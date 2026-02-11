<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ProjectModel;
use App\Models\ComplianceModel;
use App\Models\UserModel;
use App\Models\ImplementationModel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use App\Mail\RDApprovalMail;
use App\Mail\RDDisapprovalMail;
use Illuminate\Support\Facades\Log;

class RDDashboardController extends Controller
{
    public function index()
    {
        // Get projects with complete compliances (2/2 links)
        $projects = ProjectModel::with(['compliance', 'company'])
            ->select(
                'project_id',
                'project_title',
                'company_id',
                'progress',
                'created_at'
            )
            ->get()
            ->filter(function ($project) {
                // Only show projects where all 2 links are filled
                $compliance = $project->compliance;
                if (!$compliance) return false;
                
                return $compliance->pp_link && $compliance->fs_link;
            })
            ->values();

        // Group by status for stats
        $approved = $projects->filter(fn($p) => $p->progress === 'Approved')->count();
        $disapproved = $projects->filter(fn($p) => $p->progress === 'Disapproved')->count();
        $pending = $projects->count() - $approved - $disapproved;

        return Inertia::render('RDDashboard', [
            'projects' => $projects,
            'stats' => [
                'total' => $projects->count(),
                'approved' => $approved,
                'disapproved' => $disapproved,
                'pending' => $pending,
            ]
        ]);
    }

    public function updateStatus(Request $request, $projectId)
    {
        $request->validate([
            'status' => 'required|in:Approved,Disapproved',
            'remark' => 'nullable|string|min:5|max:500',
        ]);

        $project = ProjectModel::with('company')->findOrFail($projectId);
        $project->progress = $request->status;
        $project->save();

        // Get the current user (Regional Director)
        $user = Auth::user();

        // Update compliance status
        $compliance = ComplianceModel::where('project_id', $projectId)->first();
        if ($compliance) {
            if ($request->status === 'Approved') {
                $compliance->status = 'approved';
                $compliance->save();

                // Create implementation record when approved
                $this->createImplementation($projectId);

                // Send approval email
                $this->sendApprovalEmail($project, $user);

            } elseif ($request->status === 'Disapproved') {
                $compliance->status = 'pending';
                $compliance->save();

                // Send disapproval email with remarks
                $remark = $request->input('remark', 'No remarks provided.');
                $this->sendDisapprovalEmail($project, $user, $remark);
            }
        }

        return redirect()->back()->with('success', "Project marked as {$request->status}");
    }

    /**
     * Create implementation record for approved project
     */
    private function createImplementation($projectId)
    {
        try {
            // Check if implementation already exists for this project
            $existingImplementation = ImplementationModel::where('project_id', $projectId)->first();
            
            if (!$existingImplementation) {
                // Create new implementation record
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
            } else {
                Log::info("Implementation record already exists for project ID: $projectId");
            }
        } catch (\Exception $e) {
            Log::error('Error creating implementation record: ' . $e->getMessage());
        }
    }

    /**
     * Send approval email to company email, staff with same office_id, and RPMO users
     */
    private function sendApprovalEmail($project, $user)
    {
        try {
            $recipients = [];
            $sentEmails = [];

            // Add company email if it exists
            if ($project->company->email && filter_var($project->company->email, FILTER_VALIDATE_EMAIL)) {
                $recipients[] = (object)[
                    'email' => $project->company->email,
                    'name' => $project->company->company_name
                ];
                $sentEmails[] = $project->company->email;
            }

            // Add staff users with same office_id as company
            $staffUsers = UserModel::where('role', 'staff')
                ->where('office_id', $project->company->office_id)
                ->where('status', 'active')
                ->get();

            foreach ($staffUsers as $staffUser) {
                if (!in_array($staffUser->email, $sentEmails)) {
                    $recipients[] = $staffUser;
                    $sentEmails[] = $staffUser->email;
                }
            }

            // Add RPMO users
            $rpmoUsers = UserModel::where('role', 'rpmo')
                ->where('status', 'active')
                ->get();

            foreach ($rpmoUsers as $rpmoUser) {
                if (!in_array($rpmoUser->email, $sentEmails)) {
                    $recipients[] = $rpmoUser;
                    $sentEmails[] = $rpmoUser->email;
                }
            }

            // Send emails to all recipients
            if (count($recipients) > 0) {
                foreach ($recipients as $recipient) {
                    Mail::to($recipient->email)->send(new RDApprovalMail($project, $user));
                }
            }
        } catch (\Exception $e) {
            Log::error('Error sending approval email: ' . $e->getMessage());
        }
    }

    /**
     * Send disapproval email with remarks to company email, staff with same office_id, and RPMO users
     */
    private function sendDisapprovalEmail($project, $user, $remark)
    {
        try {
            $recipients = [];
            $sentEmails = [];

            // Add company email if it exists
            if ($project->company->email && filter_var($project->company->email, FILTER_VALIDATE_EMAIL)) {
                $recipients[] = (object)[
                    'email' => $project->company->email,
                    'name' => $project->company->company_name
                ];
                $sentEmails[] = $project->company->email;
            }

            // Add staff users with same office_id as company
            $staffUsers = UserModel::where('role', 'staff')
                ->where('office_id', $project->company->office_id)
                ->where('status', 'active')
                ->get();

            foreach ($staffUsers as $staffUser) {
                if (!in_array($staffUser->email, $sentEmails)) {
                    $recipients[] = $staffUser;
                    $sentEmails[] = $staffUser->email;
                }
            }

            // Add RPMO users
            $rpmoUsers = UserModel::where('role', 'rpmo')
                ->where('status', 'active')
                ->get();

            foreach ($rpmoUsers as $rpmoUser) {
                if (!in_array($rpmoUser->email, $sentEmails)) {
                    $recipients[] = $rpmoUser;
                    $sentEmails[] = $rpmoUser->email;
                }
            }

            // Send emails to all recipients
            if (count($recipients) > 0) {
                foreach ($recipients as $recipient) {
                    Mail::to($recipient->email)->send(new RDDisapprovalMail($project, $user, $remark));
                }
            }
        } catch (\Exception $e) {
            Log::error('Error sending disapproval email: ' . $e->getMessage());
        }
    }

    public function show($projectId)
    {
        $project = ProjectModel::with(['compliance', 'company'])->findOrFail($projectId);
        $compliance = $project->compliance;

        // Check if all links are filled
        if (!$compliance || !($compliance->pp_link && $compliance->fs_link)) {
            return redirect()->route('rd-dashboard.index')->with('error', 'This project does not have all compliance items completed');
        }

        return Inertia::render('RDDashboard/Show', [
            'project' => $project,
            'compliance' => $compliance,
        ]);
    }
}