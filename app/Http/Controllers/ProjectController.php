<?php

namespace App\Http\Controllers;

use App\Models\ProjectModel;
use App\Models\CompanyModel;
use App\Models\ImplementationModel;
use App\Models\ItemModel;
use App\Models\MOAModel;
use App\Models\UserModel;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ProjectController extends Controller
{
public function index(Request $request)
{
    $userId = session('user_id');
    $user = UserModel::where('user_id', $userId)->first();
    $search = $request->input('search');
    $perPage = $request->input('perPage', 10); // Default 10

    $query = ProjectModel::with(['company', 'items']);

    if ($user->role === 'user') {
        $query->where('added_by', $user->user_id);
    } elseif ($user->role === 'staff') {
        $query->whereHas('company', function ($q) use ($user) {
            $q->where('office_id', $user->office_id);
        });
    }

    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->where('project_title', 'like', "%{$search}%")
              // Removed phase_one and phase_two
              ->orWhere('project_cost', 'like', "%{$search}%")
              // Optional: add search on release/refund fields if desired:
              ->orWhere('release_initial', 'like', "%{$search}%")
              ->orWhere('release_end', 'like', "%{$search}%")
              ->orWhere('refund_initial', 'like', "%{$search}%")
              ->orWhere('refund_end', 'like', "%{$search}%")
              ->orWhereHas('company', function ($q) use ($search) {
                  $q->where('company_name', 'like', "%{$search}%");
              })
              ->orWhereHas('items', function ($q) use ($search) {
                  $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('specifications', 'like', "%{$search}%");
              });
        });
    }

    $projects = $query->orderBy('project_title')->paginate($perPage)->withQueryString();

    return Inertia::render('Projects/Index', [
        'projects' => $projects,
        'filters' => $request->only('search', 'perPage'),
    ]);
}


    public function create()
    {
        $userId = session('user_id');
        $user = UserModel::find($userId);

        $companies = CompanyModel::query();

        if ($user->role === 'staff') {
            $companies->where('office_id', $user->office_id);
        } elseif ($user->role === 'user') {
            $companies->where('added_by', $user->user_id);
        }

        return Inertia::render('Projects/Create', [
            'companies' => $companies->orderBy('company_name')->get()
        ]);
    }

public function store(Request $request)
    {
        $userId = session('user_id');
        $user = UserModel::find($userId);

    if ($request->has('release_initial')) {
        $releaseInitial = $request->input('release_initial');
        $request->merge(['release_initial' => $releaseInitial . '-01']);
    }

    if ($request->has('release_end')) {
        $releaseEnd = $request->input('release_end');
        $request->merge(['release_end' => $releaseEnd . '-01']);
    }

    if ($request->has('refund_initial')) {
        $refundInitial = $request->input('refund_initial');
        $request->merge(['refund_initial' => $refundInitial . '-01']);
    }

    if ($request->has('refund_end')) {
        $refundEnd = $request->input('refund_end');
        $request->merge(['refund_end' => $refundEnd . '-01']);
    }


    $validated = $request->validate([
        'project_id'        => 'required|string|max:255',
        'project_title'     => 'required|string|max:255',
        'company_id'        => 'required|exists:tbl_companies,company_id',
        'project_cost'      => 'nullable|numeric',

        'progress'          => 'nullable|string',
        'year_obligated'    => 'nullable|string',
        'revenue'           => 'nullable|numeric',
        'net_income'        => 'nullable|numeric',
        'current_asset'     => 'nullable|numeric',
        'noncurrent_asset'  => 'nullable|numeric',
        'equity'            => 'nullable|numeric',
        'liability'         => 'nullable|numeric',

        'release_initial'   => 'nullable|date',
        'release_end'       => 'nullable|date',
        'refund_initial'    => 'nullable|date',
        'refund_end'        => 'nullable|date',

        'items'                     => 'array',
        'items.*.item_name'         => 'required|string|max:255',
        'items.*.specifications'    => 'nullable|string',
        'items.*.item_cost'         => 'required|numeric|min:0',
        'items.*.quantity'          => 'required|integer|min:1',
    ]);

    $project = ProjectModel::create([
        'project_id'        => $validated['project_id'],
        'project_title'     => $validated['project_title'],
        'company_id'        => $validated['company_id'],
        'project_cost'      => $validated['project_cost'] ?? null,
        'progress'          => $validated['progress'] ?? null,
        'year_obligated'    => $validated['year_obligated'] ?? null,
        'revenue'           => $validated['revenue'] ?? null,
        'net_income'        => $validated['net_income'] ?? null,
        'current_asset'     => $validated['current_asset'] ?? null,
        'noncurrent_asset'  => $validated['noncurrent_asset'] ?? null,
        'equity'            => $validated['equity'] ?? null,
        'liability'         => $validated['liability'] ?? null,
        'release_initial'   => $validated['release_initial'] ?? null,
        'release_end'       => $validated['release_end'] ?? null,
        'refund_initial'    => $validated['refund_initial'] ?? null,
        'refund_end'        => $validated['refund_end'] ?? null,
        'added_by'          => $user->user_id,
    ]);

    if (!empty($validated['items'])) {
        foreach ($validated['items'] as $item) {
            ItemModel::create([
                'project_id'     => $project->project_id,
                'item_name'      => $item['item_name'],
                'specifications' => $item['specifications'] ?? null,
                'item_cost'      => $item['item_cost'],
                'quantity'       => $item['quantity'],
            ]);
        }
    }

    return redirect('/projects')->with('success', 'Project and items created successfully.');
}

    public function edit($id)
    {
        $project = ProjectModel::with('items')->findOrFail($id);
        $companies = CompanyModel::all();

        return Inertia::render('Projects/Edit', [
            'project' => $project,
            'companies' => $companies,
        ]);
    }
public function update(Request $request, $id)
{
    $project = ProjectModel::findOrFail($id);

    if ($request->has('release_initial')) {
        $releaseInitial = $request->input('release_initial');
        $request->merge(['release_initial' => $releaseInitial . '-01']);
    }

    if ($request->has('release_end')) {
        $releaseEnd = $request->input('release_end');
        $request->merge(['release_end' => $releaseEnd . '-01']);
    }

    if ($request->has('refund_initial')) {
        $refundInitial = $request->input('refund_initial');
        $request->merge(['refund_initial' => $refundInitial . '-01']);
    }

    if ($request->has('refund_end')) {
        $refundEnd = $request->input('refund_end');
        $request->merge(['refund_end' => $refundEnd . '-01']);
    }


    $validated = $request->validate([
        'project_title'     => 'required|string|max:255|unique:tbl_projects,project_id,' . $id . ',project_id',
        'company_id'        => 'required|exists:tbl_companies,company_id',
        'project_cost'      => 'nullable|numeric',

        'progress'          => 'nullable|string',
        'year_obligated'    => 'nullable|string',
        'revenue'           => 'nullable|numeric',
        'net_income'        => 'nullable|numeric',
        'current_asset'     => 'nullable|numeric',
        'noncurrent_asset'  => 'nullable|numeric',
        'equity'            => 'nullable|numeric',
        'liability'         => 'nullable|numeric',

        'release_initial'   => 'nullable|date',
        'release_end'       => 'nullable|date',
        'refund_initial'    => 'nullable|date',
        'refund_end'        => 'nullable|date',

        'items'                     => 'array',
        'items.*.item_name'         => 'required|string|max:255',
        'items.*.specifications'    => 'nullable|string',
        'items.*.item_cost'         => 'required|numeric|min:0',
        'items.*.quantity'          => 'required|integer|min:1',
    ]);

    $project->update([
        'project_title'     => $validated['project_title'],
        'company_id'        => $validated['company_id'],
        'project_cost'      => $validated['project_cost'] ?? null,
        'progress'          => $validated['progress'] ?? null,
        'year_obligated'    => $validated['year_obligated'] ?? null,
        'revenue'           => $validated['revenue'] ?? null,
        'net_income'        => $validated['net_income'] ?? null,
        'current_asset'     => $validated['current_asset'] ?? null,
        'noncurrent_asset'  => $validated['noncurrent_asset'] ?? null,
        'equity'            => $validated['equity'] ?? null,
        'liability'         => $validated['liability'] ?? null,
        'release_initial'   => $validated['release_initial'] ?? null,
        'release_end'       => $validated['release_end'] ?? null,
        'refund_initial'    => $validated['refund_initial'] ?? null,
        'refund_end'        => $validated['refund_end'] ?? null,
    ]);

    $project->items()->delete();

    if (!empty($validated['items'])) {
        foreach ($validated['items'] as $item) {
            ItemModel::create([
                'project_id'     => $project->project_id,
                'item_name'      => $item['item_name'],
                'specifications' => $item['specifications'] ?? null,
                'item_cost'      => $item['item_cost'],
                'quantity'       => $item['quantity'],
            ]);
        }
    }

    return redirect('/projects')->with('success', 'Project and items updated successfully.');
}


public function readonly()
{
    $userId = session('user_id');
    $user = UserModel::find($userId);

    if (!$user) {
        // Handle unauthenticated or missing user case
        return Inertia::render('Projects/ProjectList', [
            'projects' => collect(),
        ]);
    }

    if ($user->role === 'user') {
        // Get all companies added by this user
        $companyIds = CompanyModel::where('added_by', $userId)->pluck('company_id');

        // Get projects whose company_id is in $companyIds
        $projects = ProjectModel::with(['company', 'items'])
            ->whereIn('company_id', $companyIds)
            ->get();
    } else {
        // Admin or other roles: show all projects
        $projects = ProjectModel::with(['company', 'items'])->get();
    }

    return Inertia::render('Projects/ProjectList', [
        'projects' => $projects,
    ]);
}


public function updateProgress(Request $request, $id)
{
    $request->validate([
        'progress' => 'required|in:Draft MOA,Implementation',
    ]);

    $project = ProjectModel::findOrFail($id);
    $project->progress = $request->progress;
    $project->save();

    // If progress is "Implementation", create implement record if not existing
    if ($request->progress === 'Implementation') {
        $exists = ImplementationModel::where('project_id', $project->project_id)->exists();

        if (!$exists) {
            ImplementationModel::create([
                'project_id' => $project->project_id,
                'tarp' => null,
                'pdc' => null,
                'liquidation' => null,
            ]);
        }

        // Update acknowledge_date in tbl_moa
        $moa = MOAModel::where('project_id', $project->project_id)->first();
        if ($moa) {
            $moa->acknowledge_date = Carbon::now();
            $moa->save();
        }
    }

    return back();
}

    public function destroy($id)
    {
        ProjectModel::findOrFail($id)->delete();
        return redirect('/projects')->with('success', 'Project deleted successfully.');
    }
}
