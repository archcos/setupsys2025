<?php

namespace App\Http\Controllers;

use App\Mail\RestructureApprovedMail;
use App\Mail\RestructureRecommendedMail;
use App\Mail\RestructureDeniedMail;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\RestructureModel;
use App\Models\RestructureUpdateModel;
use App\Models\ApplyRestructModel;
use App\Models\DirectorModel;
use App\Models\ProjectModel;
use App\Models\RefundModel;
use App\Models\UserModel;
use App\Models\OfficeModel;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class RestructureController extends Controller
{
    public function verifyList(Request $request)
    {
        $user = Auth::user();

        $search       = $request->input('search', '');
        $perPage      = $request->input('perPage', 10);
        $officeFilter = $request->input('officeFilter', '');
        $statusFilter = $request->input('statusFilter', 'pending');
        $sortBy       = $request->input('sortBy', 'desc');

        // ── Base query (role-scope only, no status/search/office filters yet) ──
        $baseQuery = ApplyRestructModel::with(['project.proponent.office', 'addedBy', 'restructure']);

        if ($user->role === 'rd') {
            $projectIds = RestructureModel::whereIn('status', ['recommended', 'approved'])
                ->distinct()
                ->pluck('project_id')
                ->toArray();
            $baseQuery->whereIn('project_id', $projectIds);
        }

        // ── Status counts (computed BEFORE status filter is applied) ──────────
        $statusCounts = [
            'all'      => (clone $baseQuery)->count(),
            'pending'  => (clone $baseQuery)->where(function ($q) {
                                $q->doesntHave('restructure')
                                  ->orWhereHas('restructure', fn($sq) => $sq->where('status', 'pending'));
                            })->count(),
            'recommended'   => (clone $baseQuery)->whereHas('restructure', fn($q) => $q->where('status', 'recommended'))->count(),
            'approved' => (clone $baseQuery)->whereHas('restructure', fn($q) => $q->where('status', 'approved'))->count(),
        ];

        // ── Apply remaining filters to the main query ─────────────────────────
        $query = clone $baseQuery;

        // Search
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('project', function ($pq) use ($search) {
                    $pq->where('project_title', 'like', "%{$search}%")
                       ->orWhereHas('proponent', fn($cq) => $cq->where('company_name', 'like', "%{$search}%"));
                });
            });
        }

        // Office
        if (!empty($officeFilter)) {
            $query->whereHas('project.proponent', fn($q) => $q->where('office_id', $officeFilter));
        }

        // Status
        if (!empty($statusFilter) && $statusFilter !== 'all') {
            if ($statusFilter === 'pending') {
                $query->where(function ($q) {
                    $q->doesntHave('restructure')
                      ->orWhereHas('restructure', fn($sq) => $sq->where('status', 'pending'));
                });
            } else {
                $query->whereHas('restructure', fn($q) => $q->where('status', $statusFilter));
            }
        }

        // Sort
        $sortBy === 'asc' ? $query->oldest() : $query->latest();

        $applyRestructs = $query->paginate($perPage)->withQueryString();

        $offices = OfficeModel::orderBy('office_name')->get();

        return Inertia::render('Restructures/Index', [
            'applyRestructs' => $applyRestructs,
            'offices'        => $offices,
            'statusCounts'   => $statusCounts,
            'filters'        => [
                'search'       => $search,
                'perPage'      => $perPage,
                'officeFilter' => $officeFilter,
                'statusFilter' => $statusFilter,
                'sortBy'       => $sortBy,
            ],
            'auth' => ['user' => $user],
        ]);
    }

    public function verifyShow($apply_id)
    {
        $user = Auth::user();

        $applyRestruct = ApplyRestructModel::with(['project', 'addedBy'])
            ->findOrFail($apply_id);

        $project = ProjectModel::findOrFail($applyRestruct->project_id);

        $restructuresQuery = RestructureModel::where('project_id', $project->project_id)
            ->with(['addedBy', 'updates' => function ($query) {
                $query->orderBy('update_start');
            }]);

        if ($user->role === 'rd') {
            $restructuresQuery->whereIn('status', ['recommended', 'approved']);
        }

        $restructures = $restructuresQuery->latest()->get();

        return Inertia::render('Restructures/Checklist', [
            'applyRestruct' => $applyRestruct,
            'project'       => $project,
            'restructures'  => $restructures,
            'auth'          => ['user' => $user],
        ]);
    }

    private function hasDateOverlap($projectId, $newStart, $newEnd, $excludeId = null)
    {
        $query = RestructureModel::where('project_id', $projectId);

        if ($excludeId) {
            $query->where('restruct_id', '!=', $excludeId);
        }

        foreach ($query->get() as $existing) {
            $existingStart = strtotime($existing->restruct_start);
            $existingEnd   = strtotime($existing->restruct_end);
            $newStartTime  = strtotime($newStart);
            $newEndTime    = strtotime($newEnd);

            if ($newStartTime <= $existingEnd && $newEndTime >= $existingStart) {
                return ['overlap' => true, 'existing' => $existing];
            }
        }

        return ['overlap' => false];
    }

    public function store(Request $request)
    {
        Log::info('Restructure Store Request:', $request->all());

        try {
            $validated = $request->validate([
                'project_id'                  => 'required|exists:tbl_projects,project_id',
                'apply_id'                    => 'required|exists:tbl_apply_restruct,apply_id',
                'type'                        => 'required|string|max:50',
                'restruct_start'              => 'required|string',
                'restruct_end'                => 'required|string',
                'status'                      => 'required|in:approved,recommended,pending',
                'remarks'                     => 'required|string',
                'new_refund_end'              => 'nullable|string',
                'updates'                     => 'nullable|array',
                'updates.*.update_start'      => 'required_with:updates|string',
                'updates.*.update_end'        => 'required_with:updates|string',
                'updates.*.update_amount'     => 'required_with:updates|numeric|min:0',
            ]);

            $project      = ProjectModel::findOrFail($request->project_id);
            $restructStart = $request->restruct_start . '-01';
            $restructEnd   = $request->restruct_end   . '-01';

            if (strtotime($restructEnd) <= strtotime($restructStart)) {
                return redirect()->back()->withErrors(['restruct_end' => 'End date must be after start date'])->withInput();
            }

            $refundInitial      = strtotime($project->refund_initial);
            $effectiveRefundEnd = $request->new_refund_end
                ? strtotime($request->new_refund_end . '-01')
                : strtotime($project->refund_end);

            $startTime = strtotime($restructStart);
            $endTime   = strtotime($restructEnd);

            if ($startTime < $refundInitial || $startTime > $effectiveRefundEnd) {
                return redirect()->back()->withErrors(['restruct_start' => 'Start date must be within the project refund period (' . date('M Y', $refundInitial) . ' to ' . date('M Y', $effectiveRefundEnd) . ')'])->withInput();
            }

            if ($endTime < $refundInitial || $endTime > $effectiveRefundEnd) {
                return redirect()->back()->withErrors(['restruct_end' => 'End date must be within the project refund period (' . date('M Y', $refundInitial) . ' to ' . date('M Y', $effectiveRefundEnd) . ')'])->withInput();
            }

            if ($request->new_refund_end) {
                $newRefundEndTime = strtotime($request->new_refund_end . '-01');
                if ($newRefundEndTime < $refundInitial) {
                    return redirect()->back()->withErrors(['new_refund_end' => 'New refund end date must be after the refund start date (' . date('M Y', $refundInitial) . ')'])->withInput();
                }
                if ($newRefundEndTime < $endTime) {
                    return redirect()->back()->withErrors(['new_refund_end' => 'New refund end date must be after the restructuring end date (' . date('M Y', $endTime) . ')'])->withInput();
                }
            }

            $overlapCheck = $this->hasDateOverlap($request->project_id, $restructStart, $restructEnd);
            if ($overlapCheck['overlap']) {
                $existing = $overlapCheck['existing'];
                return redirect()->back()->withErrors(['restruct_start' => 'The selected date range overlaps with an existing restructuring (' . $existing->type . ': ' . date('M Y', strtotime($existing->restruct_start)) . ' to ' . date('M Y', strtotime($existing->restruct_end)) . ')'])->withInput();
            }

            if ($request->has('updates') && is_array($request->updates)) {
                $restructEndTime = strtotime($restructEnd);
                foreach ($request->updates as $update) {
                    $updateStart     = $update['update_start'] . '-01';
                    $updateEnd       = $update['update_end']   . '-01';
                    $updateStartTime = strtotime($updateStart);
                    $updateEndTime   = strtotime($updateEnd);

                    if ($updateEndTime <= $updateStartTime) {
                        return redirect()->back()->withErrors(['updates' => 'Update end date must be after start date'])->withInput();
                    }
                    if ($updateStartTime <= $restructEndTime) {
                        return redirect()->back()->withErrors(['updates' => 'Update start date must be after the restructuring end date (' . date('M Y', $restructEndTime) . ')'])->withInput();
                    }
                    if ($updateEndTime > $effectiveRefundEnd) {
                        return redirect()->back()->withErrors(['updates' => 'Update end date cannot exceed the project refund end date (' . date('M Y', $effectiveRefundEnd) . ')'])->withInput();
                    }
                }
            }

            $restructure = RestructureModel::create([
                'project_id'    => $request->project_id,
                'apply_id'      => $request->apply_id,
                'added_by'      => Auth::id(),
                'type'          => $request->type,
                'status'        => $request->status,
                'remarks'       => $request->remarks,
                'restruct_start' => $restructStart,
                'restruct_end'   => $restructEnd,
                'new_refund_end' => $request->new_refund_end ? $request->new_refund_end . '-01' : null,
            ]);

            if ($request->has('updates') && is_array($request->updates)) {
                foreach ($request->updates as $update) {
                    RestructureUpdateModel::create([
                        'restruct_id'   => $restructure->restruct_id,
                        'update_start'  => $update['update_start'] . '-01',
                        'update_end'    => $update['update_end']   . '-01',
                        'update_amount' => $update['update_amount'],
                    ]);
                }
            }

            Log::info('Restructure created successfully:', ['id' => $restructure->restruct_id]);

            if (in_array($request->status, ['recommended', 'pending'])) {
                try {
                    $restructure = RestructureModel::with(['project.proponent', 'addedBy'])->findOrFail($restructure->restruct_id);
                    $this->sendStatusUpdateEmailsSync($restructure, $request->status, $request->remarks);
                    sleep(2);
                } catch (\Exception $emailError) {
                    Log::error('Email sending failed:', ['error' => $emailError->getMessage()]);
                }
            }

            $statusMessage = $request->status === 'recommended' ? 'recommended' : 'added';
            return redirect()->back()->with('success', "Restructuring {$statusMessage} successfully. Email notifications have been sent.");

        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Restructure Store Error:', ['message' => $e->getMessage()]);
            return redirect()->back()->withErrors(['error' => 'Failed to add restructuring: ' . $e->getMessage()])->withInput();
        }
    }

    public function update(Request $request, $restruct_id)
    {
        Log::info('Restructure Update Request:', ['restruct_id' => $restruct_id, 'data' => $request->all()]);

        try {
            $validated = $request->validate([
                'apply_id'                    => 'required|exists:tbl_apply_restruct,apply_id',
                'type'                        => 'required|string|max:50',
                'restruct_start'              => 'required|string',
                'restruct_end'                => 'required|string',
                'status'                      => 'required|in:approved,recommended,pending',
                'remarks'                     => 'required|string',
                'new_refund_end'              => 'nullable|string',
                'updates'                     => 'nullable|array',
                'updates.*.update_start'      => 'required_with:updates|string',
                'updates.*.update_end'        => 'required_with:updates|string',
                'updates.*.update_amount'     => 'required_with:updates|numeric|min:0',
            ]);

            $restructure   = RestructureModel::findOrFail($restruct_id);
            $project       = ProjectModel::findOrFail($restructure->project_id);
            $restructStart = $request->restruct_start . '-01';
            $restructEnd   = $request->restruct_end   . '-01';

            if (strtotime($restructEnd) <= strtotime($restructStart)) {
                return redirect()->back()->withErrors(['restruct_end' => 'End date must be after start date'])->withInput();
            }

            $refundInitial      = strtotime($project->refund_initial);
            $effectiveRefundEnd = $request->new_refund_end
                ? strtotime($request->new_refund_end . '-01')
                : strtotime($project->refund_end);

            $startTime = strtotime($restructStart);
            $endTime   = strtotime($restructEnd);

            if ($startTime < $refundInitial || $startTime > $effectiveRefundEnd) {
                return redirect()->back()->withErrors(['restruct_start' => 'Start date must be within the project refund period (' . date('M Y', $refundInitial) . ' to ' . date('M Y', $effectiveRefundEnd) . ')'])->withInput();
            }

            if ($endTime < $refundInitial || $endTime > $effectiveRefundEnd) {
                return redirect()->back()->withErrors(['restruct_end' => 'End date must be within the project refund period (' . date('M Y', $refundInitial) . ' to ' . date('M Y', $effectiveRefundEnd) . ')'])->withInput();
            }

            if ($request->new_refund_end) {
                $newRefundEndTime = strtotime($request->new_refund_end . '-01');
                if ($newRefundEndTime < $refundInitial) {
                    return redirect()->back()->withErrors(['new_refund_end' => 'New refund end date must be after the refund start date (' . date('M Y', $refundInitial) . ')'])->withInput();
                }
                if ($newRefundEndTime < $endTime) {
                    return redirect()->back()->withErrors(['new_refund_end' => 'New refund end date must be after the restructuring end date (' . date('M Y', $endTime) . ')'])->withInput();
                }
            }

            $overlapCheck = $this->hasDateOverlap($restructure->project_id, $restructStart, $restructEnd, $restruct_id);
            if ($overlapCheck['overlap']) {
                $existing = $overlapCheck['existing'];
                return redirect()->back()->withErrors(['restruct_start' => 'The selected date range overlaps with an existing restructuring (' . $existing->type . ': ' . date('M Y', strtotime($existing->restruct_start)) . ' to ' . date('M Y', strtotime($existing->restruct_end)) . ')'])->withInput();
            }

            if ($request->has('updates') && is_array($request->updates)) {
                $restructEndTime = strtotime($restructEnd);
                foreach ($request->updates as $update) {
                    $updateStart     = $update['update_start'] . '-01';
                    $updateEnd       = $update['update_end']   . '-01';
                    $updateStartTime = strtotime($updateStart);
                    $updateEndTime   = strtotime($updateEnd);

                    if ($updateEndTime <= $updateStartTime) {
                        return redirect()->back()->withErrors(['updates' => 'Update end date must be after start date'])->withInput();
                    }
                    if ($updateStartTime <= $restructEndTime) {
                        return redirect()->back()->withErrors(['updates' => 'Update start date must be after the restructuring end date (' . date('M Y', $restructEndTime) . ')'])->withInput();
                    }
                    if ($updateEndTime > $effectiveRefundEnd) {
                        return redirect()->back()->withErrors(['updates' => 'Update end date cannot exceed the project refund end date (' . date('M Y', $effectiveRefundEnd) . ')'])->withInput();
                    }
                }
            }

            $restructure->update([
                'apply_id'       => $request->apply_id,
                'type'           => $request->type,
                'restruct_start' => $restructStart,
                'restruct_end'   => $restructEnd,
                'status'         => $request->status,
                'remarks'        => $request->remarks,
                'new_refund_end' => $request->new_refund_end ? $request->new_refund_end . '-01' : null,
            ]);

            RestructureUpdateModel::where('restruct_id', $restruct_id)->delete();

            if ($request->has('updates') && is_array($request->updates)) {
                foreach ($request->updates as $update) {
                    RestructureUpdateModel::create([
                        'restruct_id'   => $restructure->restruct_id,
                        'update_start'  => $update['update_start'] . '-01',
                        'update_end'    => $update['update_end']   . '-01',
                        'update_amount' => $update['update_amount'],
                    ]);
                }
            }

            Log::info('Restructure updated successfully:', $restructure->toArray());

            if (in_array($request->status, ['recommended', 'pending'])) {
                try {
                    $restructure = RestructureModel::with(['project.proponent', 'addedBy'])->findOrFail($restructure->restruct_id);
                    $this->sendStatusUpdateEmailsSync($restructure, $request->status, $request->remarks);
                    sleep(2);
                } catch (\Exception $emailError) {
                    Log::error('Email sending failed:', ['error' => $emailError->getMessage()]);
                }
            }

            $statusMessage = $request->status === 'recommended' ? 'recommended' : 'updated';
            return redirect()->back()->with('success', "Restructuring {$statusMessage} successfully. Email notifications have been sent.");

        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Restructure Update Error:', ['message' => $e->getMessage()]);
            return redirect()->back()->withErrors(['error' => 'Failed to update restructuring: ' . $e->getMessage()])->withInput();
        }
    }

    public function destroy($restruct_id)
    {
        try {
            $restructure = RestructureModel::findOrFail($restruct_id);
            RestructureUpdateModel::where('restruct_id', $restruct_id)->delete();
            $restructure->delete();

            Log::info('Restructure deleted:', ['restruct_id' => $restruct_id]);
            return redirect()->back()->with('success', 'Restructuring deleted successfully.');

        } catch (\Exception $e) {
            Log::error('Restructure Delete Error:', ['message' => $e->getMessage()]);
            return redirect()->back()->withErrors(['error' => 'Failed to delete restructuring: ' . $e->getMessage()]);
        }
    }

    public function updateStatus(Request $request, $restruct_id)
    {
        try {
            Log::info('=== STATUS UPDATE STARTED ===', ['restruct_id' => $restruct_id, 'user_role' => Auth::user()->role ?? 'unknown']);

            $validated = $request->validate([
                'status'  => 'required|in:recommended,pending,approved',
                'remarks' => 'required|string',
            ]);

            $restructure = RestructureModel::findOrFail($restruct_id);
            $userRole    = Auth::user()->role;

            if ($userRole === 'rpmo') {
                if (!in_array($validated['status'], ['recommended', 'pending'])) {
                    return redirect()->back()->withErrors(['error' => 'RPMO can only recommend or deny restructuring requests.']);
                }
            } elseif ($userRole === 'rd') {
                if ($restructure->status !== 'recommended') {
                    return redirect()->back()->withErrors(['error' => 'Only recommended restructuring requests can be approved or denied.']);
                }
                if (!in_array($validated['status'], ['approved', 'pending'])) {
                    return redirect()->back()->withErrors(['error' => 'RD can only approve or deny restructuring requests.']);
                }
            } else {
                return redirect()->back()->withErrors(['error' => 'You do not have permission to update restructuring status.']);
            }

            $restructure->update(['status' => $validated['status'], 'remarks' => $validated['remarks']]);

            $restructure = RestructureModel::with(['project.proponent', 'addedBy'])->findOrFail($restruct_id);

            if ($validated['status'] === 'approved') {
                $this->createRestructuredRefundEntries($restructure);
            }

            if ($validated['status'] === 'approved' && $restructure->new_refund_end) {
                $restructure->project->update(['refund_end' => $restructure->new_refund_end]);
                Log::info('Project refund_end updated', ['project_id' => $restructure->project_id, 'new_refund_end' => $restructure->new_refund_end]);
            }

            try {
                $this->sendStatusUpdateEmailsSync($restructure, $validated['status'], $validated['remarks']);
            } catch (\Exception $emailError) {
                Log::error('Email sending failed but continuing:', ['error' => $emailError->getMessage()]);
            }

            sleep(2);

            $statusMessage = $validated['status'] === 'approved' ? 'approved' : ($validated['status'] === 'recommended' ? 'recommended' : 'denied');
            return redirect()->back()->with('success', "Restructuring request has been {$statusMessage} successfully. Email notifications have been sent.");

        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('=== STATUS UPDATE ERROR ===', ['message' => $e->getMessage()]);
            return redirect()->back()->withErrors(['error' => 'Failed to update status: ' . $e->getMessage()]);
        }
    }

    private function sendStatusUpdateEmailsSync(RestructureModel $restructure, $status, $remarks)
    {
        if ($status === 'recommended') {
            $this->sendRecommendedEmailsSync($restructure, $remarks);
        } elseif ($status === 'approved') {
            $this->sendApprovedEmailsSync($restructure, $remarks);
        } elseif ($status === 'pending') {
            $this->sendDeniedEmailsSync($restructure, $remarks);
        }
    }

    private function sendRecommendedEmailsSync(RestructureModel $restructure, $remarks)
    {
        $directors = DirectorModel::where('office_id', 1)->whereNotNull('email')->get();
        foreach ($directors as $director) {
            try {
                $recipientName = $director->honorific . ' ' . $director->last_name;
                Mail::to($director->email)->send(new RestructureRecommendedMail($restructure, $recipientName, $remarks));
                Log::info('✓ Recommended email sent', ['to' => $director->email]);
            } catch (\Exception $e) {
                Log::error('✗ Failed to send recommended email', ['to' => $director->email, 'error' => $e->getMessage()]);
            }
        }
    }

    private function sendApprovedEmailsSync(RestructureModel $restructure, $remarks)
    {
        $projectOfficeId = $restructure->project->proponent->office_id;
        $proponentEmail    = $restructure->project->proponent->email;

        $rpmoUsers  = UserModel::where('role', 'rpmo')->whereNotNull('email')->get();
        $staffUsers = UserModel::where('role', 'staff')->where('office_id', $projectOfficeId)->whereNotNull('email')->get();

        foreach ($rpmoUsers as $user) {
            try {
                Mail::to($user->email)->send(new RestructureApprovedMail($restructure, $restructure->project->proponent->company_name, Auth::user()->name, $remarks));
                Log::info('✓ Approved email sent to RPMO', ['to' => $user->email]);
            } catch (\Exception $e) {
                Log::error('✗ Failed approved email to RPMO', ['to' => $user->email, 'error' => $e->getMessage()]);
            }
        }

        foreach ($staffUsers as $user) {
            try {
                Mail::to($user->email)->send(new RestructureApprovedMail($restructure, $user->name, Auth::user()->name, $remarks));
                Log::info('✓ Approved email sent to staff', ['to' => $user->email]);
            } catch (\Exception $e) {
                Log::error('✗ Failed approved email to staff', ['to' => $user->email, 'error' => $e->getMessage()]);
            }
        }

        if ($proponentEmail) {
            try {
                Mail::to($proponentEmail)->send(new RestructureApprovedMail($restructure, $restructure->project->proponent->company_name, Auth::user()->name, $remarks));
                Log::info('✓ Approved email sent to proponent', ['to' => $proponentEmail]);
            } catch (\Exception $e) {
                Log::error('✗ Failed approved email to proponent', ['to' => $proponentEmail, 'error' => $e->getMessage()]);
            }
        }
    }

    private function sendDeniedEmailsSync(RestructureModel $restructure, $remarks)
    {
        $projectOfficeId = $restructure->project->proponent->office_id;

        $rpmoUsers  = UserModel::where('role', 'rpmo')->whereNotNull('email')->get();
        $staffUsers = UserModel::where('role', 'staff')->where('office_id', $projectOfficeId)->whereNotNull('email')->get();

        foreach ($rpmoUsers as $user) {
            try {
                Mail::to($user->email)->send(new RestructureDeniedMail($restructure, $user->name, Auth::user()->name, $remarks));
                Log::info('✓ Denied email sent to RPMO', ['to' => $user->email]);
            } catch (\Exception $e) {
                Log::error('✗ Failed denied email to RPMO', ['to' => $user->email, 'error' => $e->getMessage()]);
            }
        }

        foreach ($staffUsers as $user) {
            try {
                Mail::to($user->email)->send(new RestructureDeniedMail($restructure, $user->name, Auth::user()->name, $remarks));
                Log::info('✓ Denied email sent to staff', ['to' => $user->email]);
            } catch (\Exception $e) {
                Log::error('✗ Failed denied email to staff', ['to' => $user->email, 'error' => $e->getMessage()]);
            }
        }
    }

    private function createRestructuredRefundEntries(RestructureModel $restructure)
    {
        try {
            $startDate   = Carbon::parse($restructure->restruct_start);
            $endDate     = Carbon::parse($restructure->restruct_end);
            $currentDate = $startDate->copy();

            while ($currentDate->lte($endDate)) {
                $monthPaid     = $currentDate->format('Y-m-01');
                $existingRefund = RefundModel::where('project_id', $restructure->project_id)->where('month_paid', $monthPaid)->first();

                if ($existingRefund) {
                    $existingRefund->update(['status' => RefundModel::STATUS_RESTRUCTURED, 'refund_amount' => 0, 'amount_due' => 0]);
                } else {
                    RefundModel::create([
                        'project_id'    => $restructure->project_id,
                        'month_paid'    => $monthPaid,
                        'status'        => RefundModel::STATUS_RESTRUCTURED,
                        'refund_amount' => 0,
                        'amount_due'    => 0,
                        'check_num'     => null,
                        'receipt_num'   => null,
                    ]);
                }

                $currentDate->addMonth();
            }

            Log::info('Restructured refund entries completed', ['project_id' => $restructure->project_id]);

        } catch (\Exception $e) {
            Log::error('Error creating restructured refund entries:', ['message' => $e->getMessage()]);
        }
    }

    public function updateRefundEnd(Request $request, $project_id)
    {
        $request->validate(['refund_end' => 'required|date']);

        $project = ProjectModel::findOrFail($project_id);
        $project->update(['refund_end' => $request->refund_end . '-01']);

        return redirect()->back()->with('success', 'Refund end date updated successfully.');
    }
}