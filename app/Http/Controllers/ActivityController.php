<?php

namespace App\Http\Controllers;

use App\Models\ActivityModel;
use App\Models\ProjectModel;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $activities = ActivityModel::with('project')
            ->when($search, function ($query, $search) {
                $query->where('activity_name', 'like', "%$search%")
                      ->orWhereHas('project', function ($q) use ($search) {
                          $q->where('project_title', 'like', "%$search%");
                      });
            })
            ->get();

        return Inertia::render('Activities/Index', [
            'activities' => $activities,
            'filters' => ['search' => $search],
        ]);
    }

    public function create()
    {
        return Inertia::render('Activities/Create', [
            'projects' => ProjectModel::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:tbl_projects,project_id',
            'activities' => 'required|array|min:1',
            'activities.*.activity_name' => 'required|string|max:255',
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
            'activity_name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $activity->update($validated);

        return redirect('/activities')->with('success', 'Activity updated!');
    }

    public function destroy($id)
    {
        ActivityModel::destroy($id);
        return redirect('/activities')->with('success', 'Activity deleted!');
    }
}
