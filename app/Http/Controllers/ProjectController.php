<?php

namespace App\Http\Controllers;

use App\Models\ProjectModel;
use App\Models\CompanyModel;
use App\Models\ItemModel;
use App\Models\UserModel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectController extends Controller
{
public function index(Request $request)
{
    $userId = session('user_id');
    $user = UserModel::where('user_id', $userId)->first();

    $search = $request->input('search');

    $query = ProjectModel::with(['company', 'items']);

    // ✅ Role-based filtering
    if ($user->role === 'user') {
        $query->where('added_by', $user->user_id);
    } elseif ($user->role === 'staff') {
        $query->whereHas('company', function ($q) use ($user) {
            $q->where('office_id', $user->office_id);
        });
    }
    // Admin sees all — no filter

    // 🔍 Search filter
    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->where('project_title', 'like', "%{$search}%")
              ->orWhere('phase_one', 'like', "%{$search}%")
              ->orWhere('phase_two', 'like', "%{$search}%")
              ->orWhere('project_cost', 'like', "%{$search}%")
              ->orWhereHas('company', function ($q) use ($search) {
                  $q->where('company_name', 'like', "%{$search}%");
              })
              ->orWhereHas('items', function ($q) use ($search) {
                  $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('specifications', 'like', "%{$search}%");
              });
        });
    }

    $projects = $query->orderBy('project_title')->get();

    return Inertia::render('Projects/Index', [
        'projects' => $projects,
        'filters' => $request->only('search'),
    ]);
}

    public function readonly(Request $request)
        {
            $search = $request->input('search');
            $userId = session('user_id');
            $user = UserModel::find($userId);

            $projects = ProjectModel::with(['company', 'items'])
                ->when($user && $user->role === 'user', function ($query) use ($user) {
                    $query->where('added_by', $user->user_id);
                })
                ->get();

            return Inertia::render('Projects/ProjectList', [
                'projects' => $projects,
                'filters' => $request->only('search'),
            ]);
        }


    public function create()
    {
        $userId = session('user_id');
        $user = UserModel::find($userId);

        // Filter companies by user's office_id
        $companies = CompanyModel::query();

        if ($user->role === 'staff') {
            $companies->where('office_id', $user->office_id);
        } elseif ($user->role === 'user') {
            $companies->where('added_by', $user->user_id);
        }
        // Admin sees all

        return Inertia::render('Projects/Create', [
            'companies' => $companies->orderBy('company_name')->get()
        ]);
    }


public function store(Request $request)
{
    $userId = session('user_id');
    $user = UserModel::find($userId);

    $validated = $request->validate([
        'project_title' => 'required|string|max:255',
        'company_id' => 'required|exists:tbl_companies,company_id',
        'phase_one' => 'nullable|string',
        'phase_two' => 'nullable|string',
        'project_cost' => 'nullable|numeric',

        'items' => 'array',
        'items.*.item_name' => 'required|string|max:255',
        'items.*.specifications' => 'nullable|string',
        'items.*.item_cost' => 'required|numeric|min:0',
        'items.*.quantity' => 'required|integer|min:1',
    ]);

    $project = ProjectModel::create([
        'project_title' => $validated['project_title'],
        'company_id' => $validated['company_id'],
        'phase_one' => $validated['phase_one'] ?? null,
        'phase_two' => $validated['phase_two'] ?? null,
        'project_cost' => $validated['project_cost'] ?? null,
        'added_by' => $user->user_id, // ✅ Add this line
    ]);

    if (!empty($validated['items'])) {
        foreach ($validated['items'] as $item) {
            ItemModel::create([
                'project_id' => $project->project_id,
                'item_name' => $item['item_name'],
                'specifications' => $item['specifications'] ?? null,
                'item_cost' => $item['item_cost'],
                'quantity' => $item['quantity'],
            ]);
        }
    }

    return redirect('/projects')->with('success', 'Project and items created successfully.');
}



    public function edit($id)
    {
        $project = ProjectModel::with('items')->findOrFail($id); // ← load items here
        $companies = CompanyModel::all();

        return Inertia::render('Projects/Edit', [
            'project' => $project,
            'companies' => $companies,
        ]);
    }


    public function update(Request $request, $id)
    {
        $project = ProjectModel::findOrFail($id);

        $validated = $request->validate([
            'project_title' => 'required|string|max:255',
            'company_id' => 'required|exists:tbl_companies,company_id',
            'phase_one' => 'nullable|string',
            'phase_two' => 'nullable|string',
            'project_cost' => 'nullable|numeric',

            'items' => 'array',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.specifications' => 'nullable|string',
            'items.*.item_cost' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $project->update([
            'project_title' => $validated['project_title'],
            'company_id' => $validated['company_id'],
            'phase_one' => $validated['phase_one'] ?? null,
            'phase_two' => $validated['phase_two'] ?? null,
            'project_cost' => $validated['project_cost'] ?? null,
        ]);

        // Clear existing items first
        $project->items()->delete();

        if (!empty($validated['items'])) {
            foreach ($validated['items'] as $item) {
                ItemModel::create([
                    'project_id' => $project->project_id,
                    'item_name' => $item['item_name'],
                    'specifications' => $item['specifications'] ?? null,
                    'item_cost' => $item['item_cost'],
                    'quantity' => $item['quantity'],
                ]);
            }
        }

        return redirect('/projects')->with('success', 'Project and items updated successfully.');
    }


    public function destroy($id)
    {
        ProjectModel::findOrFail($id)->delete();
        return redirect('/projects')->with('success', 'Project deleted successfully.');
    }
}
