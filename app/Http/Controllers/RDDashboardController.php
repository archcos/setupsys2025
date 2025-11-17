<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ProjectModel;
use App\Models\ChecklistModel;
use App\Models\UserModel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use App\Mail\RDApprovalMail;
use App\Mail\RDDisapprovalMail;
use Illuminate\Support\Facades\Log;

class RDDashboardController extends Controller
{
    public function index()
    {
        // Get projects with complete checklists (4/4 links)
        $projects = ProjectModel::with(['checklist', 'company'])
            ->select(
                'project_id',
                'project_title',
                'company_id',
                'progress',
                'created_at'
            )
            ->get()
            ->filter(function ($project) {
                // Only show projects where all 4 links are filled
                $checklist = $project->checklist;
                if (!$checklist) return false;
                
                return $checklist->link_1 && 
                       $checklist->link_2 && 
                       $checklist->link_3 && 
                       $checklist->link_4;
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

        // Update checklist status
        $checklist = ChecklistModel::where('project_id', $projectId)->first();
        if ($checklist) {
            if ($request->status === 'Approved') {
                $checklist->status = 'approved';
                $checklist->save();

                // Send approval email
                $this->sendApprovalEmail($project, $user);

            } elseif ($request->status === 'Disapproved') {
                $checklist->status = 'pending';
                $checklist->save();

                // Send disapproval email with remarks
                $remark = $request->input('remark', 'No remarks provided.');
                $this->sendDisapprovalEmail($project, $user, $remark);
            }
        }

        return redirect()->back()->with('success', "Project marked as {$request->status}");
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
        $project = ProjectModel::with(['checklist', 'company'])->findOrFail($projectId);
        $checklist = $project->checklist;

        // Check if all links are filled
        if (!$checklist || !($checklist->link_1 && $checklist->link_2 && $checklist->link_3 && $checklist->link_4)) {
            return redirect()->route('rd-dashboard.index')->with('error', 'This project does not have all checklist items completed');
        }

        return Inertia::render('RDDashboard/Show', [
            'project' => $project,
            'checklist' => $checklist,
        ]);
    }
}