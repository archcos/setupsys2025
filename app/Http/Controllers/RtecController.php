<?php

namespace App\Http\Controllers;

use App\Models\MessageModel;
use App\Models\RtecModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class RtecController extends Controller
{
    // Add this helper method to map progress to remark subject
    private function getRemarkSubject($progress)
    {
        $subjectMap = [
            'internal_rtec' => 'internal_compliance',
            'external_rtec' => 'external_compliance',
            // All others use their own progress as subject
            'internal_compliance' => 'internal_compliance',
            'external_compliance' => 'external_compliance',
            'approval' => 'approval',
            'Approved' => 'Approved',
        ];

        return $subjectMap[$progress] ?? $progress;
    }

    public function rtecdashboard(Request $request)
    {
        $user = Auth::user();
        $role = $user->role;
        
        $allowedStatuses = $this->getAllowedStatuses($role);
        $hasFullAccess = in_array($role, ['rd', 'au']);
        
        // Status counts
        $statusCounts = [];
        foreach ($allowedStatuses as $status) {
            if ($hasFullAccess) {
                $count = RtecModel::where('progress', $status)
                    ->whereHas('project', function ($query) use ($status) {
                        $query->where('progress', $status);
                    })
                    ->distinct('project_id')
                    ->count('project_id');
            } else {
                $count = RtecModel::where('user_id', $user->user_id)
                    ->where('progress', $status)
                    ->whereHas('project', function ($query) use ($status) {
                        $query->where('progress', $status);
                    })
                    ->distinct('project_id')
                    ->count('project_id');
            }
            $statusCounts[$status] = $count;
        }
        
        $filterStatus = $request->input('status');
        
        if ($hasFullAccess) {
            $projectsQuery = RtecModel::whereIn('progress', $allowedStatuses)
                ->with(['project.company', 'user']);
        } else {
            $projectsQuery = RtecModel::where('user_id', $user->user_id)
                ->whereIn('progress', $allowedStatuses)
                ->with(['project.company', 'user']);
        }
        
        if ($filterStatus && in_array($filterStatus, $allowedStatuses)) {
            $projectsQuery->where('progress', $filterStatus)
                ->whereHas('project', function($query) use ($filterStatus) {
                    $query->where('progress', $filterStatus);
                });
        } else {
            $projectsQuery->where(function($query) use ($allowedStatuses) {
                foreach ($allowedStatuses as $status) {
                    $query->orWhere(function($q) use ($status) {
                        $q->where('progress', $status)
                        ->whereHas('project', function($subQuery) use ($status) {
                            $subQuery->where('progress', $status);
                        });
                    });
                }
            });
        }
        
        $projects = $projectsQuery
            ->orderBy('created_at', 'desc')
            ->get()
            ->when($hasFullAccess, fn($collection) => $collection->unique('project_id'))
            ->values()
            ->map(function ($rtec) {
                return [
                    'rtec_id' => $rtec->rtec_id,
                    'project_id' => $rtec->project_id,
                    'project_title' => $rtec->project->project_title ?? 'N/A',
                    'company_name' => $rtec->project->company->company_name ?? 'N/A',
                    'assigned_user' => $rtec->user->name ?? 'Unassigned',
                    'progress' => $rtec->progress,
                    'schedule' => $rtec->schedule ? $rtec->schedule->format('M d, Y h:i A') : 'Not scheduled',
                    'zoom_link' => $rtec->zoom_link,
                    'created_at' => $rtec->created_at->format('M d, Y'),
                ];
            });

        // Handle modal data if project_id is provided
        $selectedProjectData = null;
        $remarksData = [];
        
        if ($request->has('project_id') && $request->has('progress')) {
            $projectId = $request->input('project_id');
            $progress = $request->input('progress');
            
            // Find the selected project
            $selectedProjectData = $projects->firstWhere('project_id', $projectId);
            
            // Fetch remarks for this project using the mapped subject
            if ($selectedProjectData) {
                $remarkSubject = $this->getRemarkSubject($progress);
                
                $remarksData = MessageModel::where('project_id', $projectId)
                    ->where('subject', $remarkSubject)
                    ->with(['user' => function($query) {
                        $query->select('user_id', 'first_name', 'middle_name', 'last_name');
                    }])
                    ->orderBy('created_at', 'desc')
                    ->get();
            }
        }

        return inertia('RtecDashboard', [
            'statusCounts' => $statusCounts,
            'allowedStatuses' => $allowedStatuses,
            'projects' => $projects,
            'currentFilter' => $filterStatus,
            'userRole' => $role,
            'selectedProjectData' => $selectedProjectData,
            'remarksData' => $remarksData,
        ]);
    }

    private function getAllowedStatuses($role)
    {
        if ($role === 'irtec') {
            return ['internal_rtec', 'internal_compliance'];
        } elseif ($role === 'ertec') {
            return ['external_rtec', 'external_compliance', 'approval', 'Approved'];
        }
        
        return [
            'internal_rtec',
            'internal_compliance',
            'external_rtec',
            'external_compliance',
            'approval',
            'Approved'
        ];
    }

public function storeRemark(Request $request, $projectId)
{
    $request->validate([
        'message' => 'required|string',
        'subject' => 'required|string'
    ]);

    // Map the subject before saving
    $mappedSubject = $this->getRemarkSubject($request->subject);

    MessageModel::create([
        'project_id' => $projectId,
        'created_by' => Auth::id(),
        'subject' => $mappedSubject,
        'message' => $request->message,
        'status' => 'todo'
    ]);

    // Get progress from request body or query
    $progress = $request->input('progress', $request->subject);

    // Redirect back with modal open
    return redirect()->route('rtec.dashboard', [
        'status' => $request->query('status'),
        'project_id' => $projectId,
        'progress' => $progress
    ]);
}

public function updateRemark(Request $request, $messageId)
{
    $remark = MessageModel::where('message_id', $messageId)->firstOrFail();
    
    if ($remark->created_by !== Auth::id()) {
        abort(403, 'Unauthorized');
    }

    $remark->update(['message' => $request->message]);
    
    // Get progress from request body or query
    $progress = $request->input('progress', $request->query('progress'));
    
    return redirect()->route('rtec.dashboard', [
        'status' => $request->query('status'),
        'project_id' => $remark->project_id,
        'progress' => $progress
    ]);
}

public function deleteRemark(Request $request, $messageId)
{
    $remark = MessageModel::where('message_id', $messageId)->firstOrFail();

    if ($remark->created_by !== Auth::id()) {
        abort(403, 'Unauthorized');
    }

    $projectId = $remark->project_id;
    
    $remark->delete();
    
    // Get progress from query
    $progress = $request->query('progress');
    
    return redirect()->route('rtec.dashboard', [
        'status' => $request->query('status'),
        'project_id' => $projectId,
        'progress' => $progress
    ]);
}

public function toggleRemarkStatus(Request $request, $messageId)
{
    $remark = MessageModel::where('message_id', $messageId)->firstOrFail();

    if ($remark->created_by !== Auth::id()) {
        abort(403, 'Unauthorized');
    }

    $remark->status = $remark->status === 'done' ? 'todo' : 'done';
    $remark->save();

    // Get progress from request body or query
    $progress = $request->input('progress', $request->query('progress'));

    return redirect()->route('rtec.dashboard', [
        'status' => $request->query('status'),
        'project_id' => $remark->project_id,
        'progress' => $progress
    ]);
}
}