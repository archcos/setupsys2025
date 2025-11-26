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
        $user = Auth::user(); // Get authenticated user

        $search = $request->input('search');
        $perPage = $request->input('perPage', 10);

        $query = ActivityModel::with('project.company');

        if ($search) {
            $query->where('activity_name', 'like', "%$search%")
                ->orWhereHas('project', function ($q) use ($search) {
                    $q->where('project_title', 'like', "%$search%");
                });
        }

        // Staff users see only their office's data
        if ($user && $user->role === 'staff') {
            $query->whereHas('project.company', function ($q) use ($user) {
                $q->where('office_id', $user->office_id);
            });
        }

        $activities = $query->orderBy('activity_id', 'desc')->paginate($perPage);

        return Inertia::render('Activities/Index', [
            'activities' => $activities,
            'filters' => $request->only('search', 'perPage'),
        ]);
    }

    public function readonly(Request $request)
    {
        $user = Auth::user();
        $search = $request->input('search');

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
            })
            ->orderBy('activity_id', 'desc');

        if ($search) {
            $query->where('activity_name', 'like', "%$search%")
                ->orWhereHas('project', function ($q) use ($search) {
                    $q->where('project_title', 'like', "%$search%");
                });
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

        return Inertia::render('Activities/Create', [
            'projects' => $query->get(),
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

        foreach ($validated['activities'] as $activity) {
            ActivityModel::create([
                'project_id' => $validated['project_id'],
                'activity_name' => $activity['activity_name'],
                'start_date' => $activity['start_date'],
                'end_date' => $activity['end_date'],
            ]);
        }

        $project = ProjectModel::with('company.office')->findOrFail($validated['project_id']);


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
        $activity = ActivityModel::with('project')->findOrFail($id);

        return Inertia::render('Activities/Edit', [
            'activity' => $activity,
            'projects' => ProjectModel::all(),
        ]);
    }

    public function update(Request $request, $id)
    {
        $activity = ActivityModel::findOrFail($id);

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
        ActivityModel::destroy($id);
        return redirect('/activities')->with('success', 'Activity deleted!');
    }
}
