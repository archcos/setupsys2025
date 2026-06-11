<?php

// app/Http/Controllers/RDUnifiedDashboardController.php

namespace App\Http\Controllers;

use App\Mail\RestructureApprovedMail;
use App\Mail\RestructureDeniedMail;
use App\Models\ApplyRestructModel;
use App\Models\ComplianceModel;
use App\Models\ImplementationModel;
use App\Models\OfficeModel;
use App\Models\ProjectModel;
use App\Models\RestructureModel;
use App\Models\UserModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class RDUnifiedDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $activeTab = $request->input('tab', 'compliance'); // compliance or restructuring

        // ─────────────────────────────────────────────────────────────
        // 1. COMPLIANCE PROJECTS (for RD approval)
        // ─────────────────────────────────────────────────────────────
        $complianceProjects = ProjectModel::with(['compliance', 'proponent.office'])
            ->select('project_id', 'project_title', 'proponent_id', 'progress', 'created_at')
            ->get()
            ->filter(function ($project) {
                $compliance = $project->compliance;
                if (!$compliance) {
                    return false;
                }

                return $compliance->pp_link && $compliance->fs_link;
            })
            ->values();

        // Compliance stats
        $complianceStats = [
            'total' => $complianceProjects->count(),
            'approved' => $complianceProjects->filter(fn ($p) => $p->progress === 'Approved')->count(),
            'disapproved' => $complianceProjects->filter(fn ($p) => $p->progress === 'Disapproved')->count(),
            'pending' => $complianceProjects->filter(fn ($p) => !$p->progress || ($p->progress !== 'Approved' && $p->progress !== 'Disapproved'))->count(),
        ];

        // ─────────────────────────────────────────────────────────────
        // 2. RESTRUCTURING APPLICATIONS (for RD approval)
        // ─────────────────────────────────────────────────────────────
        $restructureQuery = ApplyRestructModel::with(['project.proponent.office', 'addedBy', 'restructure']);

        // RD can only see recommended restructuring applications
        $projectIds = RestructureModel::where('status', 'recommended')
            ->distinct()
            ->pluck('project_id')
            ->toArray();
        $restructureQuery->whereIn('project_id', $projectIds);

        // Apply filters for restructuring
        $search = $request->input('search', '');
        $officeFilter = $request->input('officeFilter', '');
        $yearFilter = $request->input('yearFilter', '');

        if (!empty($search)) {
            $restructureQuery->where(function ($q) use ($search) {
                $q->whereHas('project', function ($pq) use ($search) {
                    $pq->where('project_title', 'like', "%{$search}%")
                       ->orWhere('project_id', 'like', "%{$search}%")
                       ->orWhereHas('proponent', fn ($cq) => $cq->where('company_name', 'like', "%{$search}%"));
                });
            });
        }

        if (!empty($officeFilter)) {
            $restructureQuery->whereHas('project.proponent', fn ($q) => $q->where('office_id', $officeFilter));
        }

        if (!empty($yearFilter)) {
            $restructureQuery->whereHas('project', fn ($q) => $q->where('year_obligated', $yearFilter));
        }

        $restructureApplications = $restructureQuery->latest()->paginate(10)->through(function ($item) {
            $item->computed_status = $item->restructure?->status ?? 'pending';

            return $item;
        });

        // Restructure stats
        $restructureStats = [
            'total' => ApplyRestructModel::whereIn('project_id', $projectIds)->count(),
            'approved' => RestructureModel::whereIn('project_id', $projectIds)->where('status', 'approved')->count(),
            'recommended' => RestructureModel::whereIn('project_id', $projectIds)->where('status', 'recommended')->count(),
            'pending' => ApplyRestructModel::whereIn('project_id', $projectIds)
                ->whereDoesntHave('restructure', fn ($q) => $q->whereIn('status', ['approved', 'recommended']))
                ->count(),
        ];

        // Get offices and years for filters
        $offices = OfficeModel::orderBy('office_name')->get();
        $years = ProjectModel::distinct()->whereNotNull('year_obligated')
            ->orderBy('year_obligated', 'desc')
            ->pluck('year_obligated')
            ->toArray();

        return Inertia::render('RDUnifiedDashboard', [
            'complianceProjects' => $complianceProjects,
            'complianceStats' => $complianceStats,
            'restructureApplications' => $restructureApplications,
            'restructureStats' => $restructureStats,
            'offices' => $offices,
            'years' => $years,
            'activeTab' => $activeTab,
            'filters' => [
                'search' => $search,
                'officeFilter' => $officeFilter,
                'yearFilter' => $yearFilter,
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // COMPLIANCE APPROVAL METHODS
    // ─────────────────────────────────────────────────────────────

    public function updateComplianceStatus(Request $request, $projectId)
    {
        $request->validate([
            'status' => 'required|in:Approved,Disapproved',
            'remark' => 'nullable|string|min:5|max:500',
        ]);

        $project = ProjectModel::with('proponent')->findOrFail($projectId);
        $project->progress = $request->status;
        $project->save();

        $user = Auth::user();
        $compliance = ComplianceModel::where('project_id', $projectId)->first();

        if ($compliance) {
            if ($request->status === 'Approved') {
                $compliance->status = 'approved';
                $compliance->save();
                $this->createImplementation($projectId);
                $this->sendComplianceApprovalEmail($project, $user);
            } elseif ($request->status === 'Disapproved') {
                $compliance->status = 'pending';
                $compliance->save();
                $remark = $request->input('remark', 'No remarks provided.');
                $this->sendComplianceDisapprovalEmail($project, $user, $remark);
            }
        }

        return redirect()->back()->with('success', "Project compliance marked as {$request->status}");
    }

    // ─────────────────────────────────────────────────────────────
    // RESTRUCTURE APPROVAL METHODS
    // ─────────────────────────────────────────────────────────────

    public function updateRestructureStatus(Request $request, $restructId)
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:approved,pending',
                'remarks' => 'required|string',
            ]);

            $restructure = RestructureModel::with(['project.proponent', 'addedBy'])->findOrFail($restructId);

            // RD can only approve/deny recommended restructures
            if ($restructure->status !== 'recommended') {
                return redirect()->back()->withErrors(['error' => 'Only recommended restructuring requests can be approved or denied.']);
            }

            $oldStatus = $restructure->status;
            $restructure->update([
                'status' => $validated['status'],
                'remarks' => $validated['remarks'],
            ]);

            if ($validated['status'] === 'approved') {
                $this->createRestructuredRefundEntries($restructure);

                if ($restructure->new_refund_end) {
                    $restructure->project->update(['refund_end' => $restructure->new_refund_end]);
                }

                $this->sendRestructureApprovalEmail($restructure, $validated['remarks']);
            } elseif ($validated['status'] === 'pending') {
                $this->sendRestructureDenialEmail($restructure, $validated['remarks']);
            }

            $statusMessage = $validated['status'] === 'approved' ? 'approved' : 'denied';

            return redirect()->back()->with('success', "Restructuring request has been {$statusMessage} successfully.");
        } catch (\Exception $e) {
            Log::error('Restructure status update error:', ['message' => $e->getMessage()]);

            return redirect()->back()->withErrors(['error' => 'Failed to update status: '.$e->getMessage()]);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // HELPER METHODS
    // ─────────────────────────────────────────────────────────────

    private function createImplementation($projectId)
    {
        try {
            $existing = ImplementationModel::where('project_id', $projectId)->first();
            if (!$existing) {
                ImplementationModel::create([
                    'project_id' => $projectId,
                    'tarp' => null,
                    'pdc' => null,
                    'liquidation' => null,
                    'tarp_by' => null,
                    'pdc_by' => null,
                    'liquidation_by' => null,
                ]);
                Log::info("Implementation record created for project ID: $projectId");
            }
        } catch (\Exception $e) {
            Log::error('Error creating implementation record: '.$e->getMessage());
        }
    }

    private function sendComplianceApprovalEmail($project, $user)
    {
        // Your existing approval email logic
        try {
            $recipients = [];
            // Add proponent, staff, RPMO users...
            // (Same as your RDDashboardController sendApprovalEmail method)
        } catch (\Exception $e) {
            Log::error('Error sending approval email: '.$e->getMessage());
        }
    }

    private function sendComplianceDisapprovalEmail($project, $user, $remark)
    {
        // Your existing disapproval email logic
        try {
            // (Same as your RDDashboardController sendDisapprovalEmail method)
        } catch (\Exception $e) {
            Log::error('Error sending disapproval email: '.$e->getMessage());
        }
    }

    private function sendRestructureApprovalEmail($restructure, $remarks)
    {
        try {
            $projectOfficeId = $restructure->project->proponent->office_id;
            $proponentEmail = $restructure->project->proponent->email;
            $rpmoUsers = UserModel::where('role', 'rpmo')->whereNotNull('email')->get();
            $staffUsers = UserModel::where('role', 'staff')->where('office_id', $projectOfficeId)->whereNotNull('email')->get();

            foreach ($rpmoUsers as $user) {
                Mail::to($user->email)->send(new RestructureApprovedMail(
                    $restructure,
                    $restructure->project->proponent->company_name,
                    Auth::user()->name,
                    $remarks
                ));
            }

            foreach ($staffUsers as $user) {
                Mail::to($user->email)->send(new RestructureApprovedMail(
                    $restructure,
                    $user->name,
                    Auth::user()->name,
                    $remarks
                ));
            }

            if ($proponentEmail) {
                Mail::to($proponentEmail)->send(new RestructureApprovedMail(
                    $restructure,
                    $restructure->project->proponent->company_name,
                    Auth::user()->name,
                    $remarks
                ));
            }
        } catch (\Exception $e) {
            Log::error('Error sending restructure approval email: '.$e->getMessage());
        }
    }

    private function sendRestructureDenialEmail($restructure, $remarks)
    {
        try {
            $projectOfficeId = $restructure->project->proponent->office_id;
            $rpmoUsers = UserModel::where('role', 'rpmo')->whereNotNull('email')->get();
            $staffUsers = UserModel::where('role', 'staff')->where('office_id', $projectOfficeId)->whereNotNull('email')->get();

            foreach ($rpmoUsers as $user) {
                Mail::to($user->email)->send(new RestructureDeniedMail(
                    $restructure,
                    $user->name,
                    Auth::user()->name,
                    $remarks
                ));
            }

            foreach ($staffUsers as $user) {
                Mail::to($user->email)->send(new RestructureDeniedMail(
                    $restructure,
                    $user->name,
                    Auth::user()->name,
                    $remarks
                ));
            }
        } catch (\Exception $e) {
            Log::error('Error sending restructure denial email: '.$e->getMessage());
        }
    }

    private function createRestructuredRefundEntries($restructure)
    {
        // Your existing method from RestructureController
        try {
            $startDate = \Carbon\Carbon::parse($restructure->restruct_start);
            $endDate = \Carbon\Carbon::parse($restructure->restruct_end);
            $currentDate = $startDate->copy();

            while ($currentDate->lte($endDate)) {
                $monthPaid = $currentDate->format('Y-m-01');
                $existingRefund = \App\Models\RefundModel::where('project_id', $restructure->project_id)
                    ->where('month_paid', $monthPaid)
                    ->first();

                if ($existingRefund) {
                    $existingRefund->update([
                        'status' => \App\Models\RefundModel::STATUS_RESTRUCTURED,
                        'refund_amount' => 0,
                        'amount_due' => 0,
                    ]);
                } else {
                    \App\Models\RefundModel::create([
                        'project_id' => $restructure->project_id,
                        'month_paid' => $monthPaid,
                        'status' => \App\Models\RefundModel::STATUS_RESTRUCTURED,
                        'refund_amount' => 0,
                        'amount_due' => 0,
                        'check_num' => null,
                        'receipt_num' => null,
                    ]);
                }
                $currentDate->addMonth();
            }
        } catch (\Exception $e) {
            Log::error('Error creating restructured refund entries: '.$e->getMessage());
        }
    }
}
