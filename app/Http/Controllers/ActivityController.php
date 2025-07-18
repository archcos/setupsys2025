<?php

// app/Http/Controllers/ActivityController.php

namespace App\Http\Controllers;

use App\Models\ActivityModel;
use App\Models\ProjectModel;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
            'activity_name' => 'required|string|max:255',
            'activity_date' => 'required|date',
        ]);

        ActivityModel::create($validated);

        return redirect('/activities')->with('success', 'Activity created!');
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
            'activity_date' => 'required|date',
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

