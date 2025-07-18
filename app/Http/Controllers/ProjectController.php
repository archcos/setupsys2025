<?php

namespace App\Http\Controllers;

use App\Models\ProjectModel;
use App\Models\CompanyModel;
use App\Models\ItemModel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $projects = ProjectModel::with('company')
            ->when($search, function ($query, $search) {
                $query->where('project_title', 'like', "%{$search}%")
                      ->orWhere('phase_one', 'like', "%{$search}%")
                      ->orWhere('phase_two', 'like', "%{$search}%")
                      ->orWhere('project_cost', 'like', "%{$search}%")
                      ->orWhereHas('company', function ($q) use ($search) {
                          $q->where('company_name', 'like', "%{$search}%");
                      });
            })
            ->get();

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
            'filters' => ['search' => $search]
        ]);
    }

    public function create()
    {
        $companies = CompanyModel::all();
        return Inertia::render('Projects/Create', ['companies' => $companies]);
    }

    public function store(Request $request)
    {
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
        ]);

        if (!empty($validated['items'])) {
            foreach ($validated['items'] as $item) {
                ItemModel::create([
                    'project_id' => $project->project_id, // or $project->id depending on your PK
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
