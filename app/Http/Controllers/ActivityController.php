<?php

namespace App\Http\Controllers;

use App\Models\ActivityModel;
use App\Models\NotificationModel;
use App\Models\ProjectModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $search = $request->input('search');
        $perPage = $request->input('perPage', 10);
        $sortBy = $request->input('sortBy', 'activity_id');
        $sortOrder = $request->input('sortOrder', 'desc');

        $query = ActivityModel::with('project.company');

        if ($search) {
            $query->where('activity_name', 'like', "%$search%")
                ->orWhereHas('project', function ($q) use ($search) {
                    $q->where('project_title', 'like', "%$search%");
                });
        }

        // Role-based access control
        if ($user) {
            if ($user->role === 'staff') {
                // Staff users see only their office's data
                $query->whereHas('project.company', function ($q) use ($user) {
                    $q->where('office_id', $user->office_id);
                });
            }
            // 'rpmo' role sees all data, no filtering needed
        }

        // Handle sorting for nested relationships
        if ($sortBy === 'project_title') {
            $query->join('tbl_projects', 'tbl_activities.project_id', '=', 'tbl_projects.project_id')
                ->select('tbl_activities.*')
                ->orderBy('tbl_projects.project_title', $sortOrder);
        } else {
            $query->orderBy('tbl_activities.' . $sortBy, $sortOrder);
        }

        $activities = $query->paginate($perPage);

        return Inertia::render('Activities/Index', [
            'activities' => $activities,
            'filters' => $request->only('search', 'perPage', 'sortBy', 'sortOrder'),
        ]);
    }

    public function readonly(Request $request)
    {
        $user = Auth::user();
        $search = $request->input('search');
        $sortBy = $request->input('sortBy', 'activity_id');
        $sortOrder = $request->input('sortOrder', 'desc');

        $query = ActivityModel::with('project.company')
            ->when($user && $user->role === 'user', function ($q) use ($user) {
                $q->whereHas('project.company', function ($q2) use ($user) {
                    $q2->where('added_by', $user->user_id);
                });
            })
            ->when($user && $user->role === 'staff', function ($q) use ($user) {
                $q->whereHas('project.company', function ($q2) use ($user) {
                    $q2->where('office_id', $user->office_id);
                });
            });
        // 'rpmo' role sees all data, no filtering applied

        if ($search) {
            $query->where('activity_name', 'like', "%$search%")
                ->orWhereHas('project', function ($q) use ($search) {
                    $q->where('project_title', 'like', "%$search%");
                });
        }

        // Handle sorting for nested relationships
        if ($sortBy === 'project_title') {
            $query->join('tbl_projects', 'tbl_activities.project_id', '=', 'tbl_projects.project_id')
                ->select('tbl_activities.*')
                ->orderBy('tbl_projects.project_title', $sortOrder);
        } else {
            $query->orderBy('tbl_activities.' . $sortBy, $sortOrder);
        }

        $activities = $query->get();

        return Inertia::render('Activities/ActivityList', [
            'activities' => $activities,
        ]);
    }

    public function create()
    {
        $user = Auth::user();
        $query = ProjectModel::with('company');

        // Staff users only see projects in their office
        if ($user && $user->role === 'staff') {
            $query->whereHas('company', function ($q) use ($user) {
                $q->where('office_id', $user->office_id);
            });
        }
        // 'rpmo' role sees all projects, no filtering needed

        return Inertia::render('Activities/Create', [
            'projects' => $query->orderBy('project_title', 'asc')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:tbl_projects,project_id',
            'activities' => 'required|array|min:1',
            'activities.*.activity_name' => 'required|string|max:45',
            'activities.*.start_date' => 'required|date',
            'activities.*.end_date' => 'required|date|after_or_equal:activities.*.start_date',
        ]);

        $project = ProjectModel::with('company.office')->findOrFail($validated['project_id']);

        // Authorization check for staff users
        if (Auth::user()->role === 'staff' && Auth::user()->office_id !== $project->company->office_id) {
            abort(403, 'Unauthorized to create activities for this project.');
        }

        foreach ($validated['activities'] as $activity) {
            ActivityModel::create([
                'project_id' => $validated['project_id'],
                'activity_name' => $activity['activity_name'],
                'start_date' => $activity['start_date'],
                'end_date' => $activity['end_date'],
            ]);
        }

        $office = $project->company->office;

        NotificationModel::create([
            'title' => 'Company Project Updated',
            'message' => "CREATED: A company project for '{$project->company->company_name}' has been completed, titled '{$project->project_title}'. Please contact PSTO {$office->office_name} for verification.",
            'office_id' => 1,
            'company_id' => $project->company_id,
        ]);

        return redirect('/activities')->with('success', 'Activities created!');
    }

    public function edit($id)
    {
        $activity = ActivityModel::with('project.company')->findOrFail($id);

        // Authorization check for staff users
        if (Auth::user()->role === 'staff' && Auth::user()->office_id !== $activity->project->company->office_id) {
            abort(403, 'Unauthorized to edit this activity.');
        }

        $query = ProjectModel::with('company');

        // Staff users only see projects in their office
        if (Auth::user()->role === 'staff') {
            $query->whereHas('company', function ($q) {
                $q->where('office_id', Auth::user()->office_id);
            });
        }

        return Inertia::render('Activities/Edit', [
            'activity' => $activity,
            'projects' => $query->orderBy('project_title', 'asc')->get(),
        ]);
    }

    public function update(Request $request, $id)
    {
        $activity = ActivityModel::with('project.company')->findOrFail($id);

        // Authorization check for staff users
        if (Auth::user()->role === 'staff' && Auth::user()->office_id !== $activity->project->company->office_id) {
            abort(403, 'Unauthorized to update this activity.');
        }

        $validated = $request->validate([
            'project_id' => 'required|exists:tbl_projects,project_id',
            'activity_name' => 'required|string|max:45',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $activity->update($validated);

        $project = ProjectModel::with('company.office')->findOrFail($validated['project_id']);
        $office = $project->company->office;

        NotificationModel::create([
            'title' => 'Company Project Updated',
            'message' => "UPDATED: A company project for '{$project->company->company_name}' has been updated, titled '{$project->project_title}'. Please contact PSTO {$office->office_name} for verification.",
            'office_id' => 1,
            'company_id' => $project->company_id,
        ]);

        return redirect('/activities')->with('success', 'Activity updated!');
    }

    public function destroy($id)
    {
        $activity = ActivityModel::with('project.company')->findOrFail($id);

        // Authorization check for staff users
        if (Auth::user()->role === 'staff' && Auth::user()->office_id !== $activity->project->company->office_id) {
            abort(403, 'Unauthorized to delete this activity.');
        }

        ActivityModel::destroy($id);
        return redirect('/activities')->with('success', 'Activity deleted!');
    }
}