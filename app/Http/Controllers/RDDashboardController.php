<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ProjectModel;
use App\Models\ChecklistModel;

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
        ]);

        $project = ProjectModel::findOrFail($projectId);
        $project->progress = $request->status;
        $project->save();

        return redirect()->back()->with('success', "Project marked as {$request->status}");
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