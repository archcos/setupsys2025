<?php

namespace App\Http\Controllers;

use App\Models\ObjectiveModel;
use App\Models\ProjectModel;
use App\Models\CompanyModel;
use App\Models\ImplementationModel;
use App\Models\ItemModel;
use App\Models\MarketModel;
use App\Models\MOAModel;
use App\Models\UserModel;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
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
    'project_cost'      => 'required|numeric',

    'progress'          => 'required|string',
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
    'place_name'          => 'nullable|string',

    // Items
    'items'                     => 'array',
    'items.*.item_name'         => 'required|string|max:255',
    'items.*.specifications'    => 'required|string',
    'items.*.item_cost'         => 'required|numeric|min:0',
    'items.*.quantity'          => 'required|integer|min:1',
    'items.*.type'              => 'required|string|max:10',

    // Objectives
    'objectives'                => 'array',
    'objectives.*.details'      => 'required|string',
]);


if (ProjectModel::where('project_id', $validated['project_id'])->exists()) {
    return redirect()->back()->withErrors([
        'project_id' => 'This Project ID already exists.'
    ])->withInput();
}

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


// Save items
if (!empty($validated['items'])) {
    foreach ($validated['items'] as $item) {
        ItemModel::create([
            'project_id'     => $validated['project_id'],
            'item_name'      => $item['item_name'],
            'specifications' => $item['specifications'] ?? null,
            'item_cost'      => $item['item_cost'],
            'quantity'       => $item['quantity'],
            'type'       => $item['type'],
            'report'       => 'approved',
            
        ]);
    }
}

// Save objectives
if (!empty($validated['objectives'])) {
    foreach ($validated['objectives'] as $objective) {
        ObjectiveModel::create([
            'project_id' => $validated['project_id'],
            'details'    => $objective['details'],
        ]);
    }
}

if (!empty($validated['place_name'])) {
    MarketModel::create([
        'project_id' => $validated['project_id'],
        'place_name' => $validated['place_name'],
    ]);
}



return redirect('/projects')->with('success', 'Project, items, and objectives created successfully.');

}

public function edit($id)
{
    $project = ProjectModel::with(['items', 'objectives', 'markets' => function ($query) {
        $query->where('type', 'existing');
    }])->findOrFail($id);
    
    $companies = CompanyModel::all();

    return Inertia::render('Projects/Edit', [
        'project' => $project,
        'companies' => $companies,
    ]);
}

public function update(Request $request, $id)
{
    $project = ProjectModel::findOrFail($id);

    Log::info("Updating project: {$project->project_id}");

    // Fixed validation - removed unique constraint that was causing issues
    $validated = $request->validate([
        'project_title'     => 'required|string|max:255',
        'company_id'        => 'required|exists:tbl_companies,company_id',
        'project_cost'      => 'required|numeric',
        'year_obligated'    => 'required|string',
        'revenue'           => 'nullable|numeric',
        'net_income'        => 'nullable|numeric',
        'current_asset'     => 'nullable|numeric',
        'noncurrent_asset'  => 'nullable|numeric',
        'equity'            => 'nullable|numeric',
        'liability'         => 'nullable|numeric',
        'release_initial'   => 'required|regex:/^\d{4}-\d{2}$/',
        'release_end'       => 'required|regex:/^\d{4}-\d{2}$/',
        'refund_initial'    => 'required|regex:/^\d{4}-\d{2}$/',
        'refund_end'        => 'required|regex:/^\d{4}-\d{2}$/',
        'place_name'        => 'required|string',
        'items'             => 'nullable|array',
        'items.*.item_name' => 'required_with:items|string|max:255',
        'items.*.specifications' => 'nullable|string',
        'items.*.item_cost' => 'required_with:items|numeric|min:0',
        'items.*.quantity' => 'required_with:items|integer|min:1',
        'objectives'        => 'nullable|array',
        'objectives.*.details' => 'required_with:objectives|string',
    ]);

    Log::info('Validated data:', $validated);

    // Update main project fields
    $project->update([
        'project_title'     => $validated['project_title'],
        'company_id'        => $validated['company_id'],
        'project_cost'      => $validated['project_cost'],
        'year_obligated'    => $validated['year_obligated'],
        'revenue'           => $validated['revenue'] ?? null,
        'net_income'        => $validated['net_income'] ?? null,
        'current_asset'     => $validated['current_asset'] ?? null,
        'noncurrent_asset'  => $validated['noncurrent_asset'] ?? null,
        'equity'            => $validated['equity'] ?? null,
        'liability'         => $validated['liability'] ?? null,
        'release_initial'   => $validated['release_initial'],
        'release_end'       => $validated['release_end'],
        'refund_initial'    => $validated['refund_initial'],
        'refund_end'        => $validated['refund_end'],
    ]);

    Log::info("Project updated successfully.");

    // Replace items
    $project->items()->delete();
    Log::info("Deleted old items.");

    if (!empty($validated['items'])) {
        foreach ($validated['items'] as $item) {
            $project->items()->create([
                'item_name'      => $item['item_name'],
                'specifications' => $item['specifications'] ?? null,
                'item_cost'      => $item['item_cost'],
                'quantity'       => $item['quantity'],
            ]);
        }
        Log::info("Items recreated.", $validated['items']);
    }

    // Replace objectives
    $project->objectives()->delete();
    Log::info("Deleted old objectives.");

    if (!empty($validated['objectives'])) {
        foreach ($validated['objectives'] as $objective) {
            $project->objectives()->create([
                'details' => $objective['details'],
            ]);
        }
        Log::info("Objectives recreated.", $validated['objectives']);
    }

    // Handle market update/creation
    $market = $project->markets()
        ->where('type', 'existing')
        ->where('project_id', $project->project_id)
        ->first();

    if ($market) {
        // Update existing market
        $market->place_name = $validated['place_name'];
        $market->save();
        Log::info('Market updated', ['id' => $market->id, 'place_name' => $market->place_name]);
    } else {
        // Create a new market linked to this project
        $project->markets()->create([
            'type' => 'existing',
            'place_name' => $validated['place_name'],
        ]);
        Log::info('Market created', ['place_name' => $validated['place_name']]);
    }

    return redirect('/projects')->with('success', 'Project updated successfully.');
}


public function syncProjectsFromCSV()
{
    $csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTsjw8nNLTrJYI2fp0ZrKbXQvqHpiGLqpgYk82unky4g_WNf8xCcISaigp8VsllxE2dCwl-aY3wjd1W/pub?gid=84108771&single=true&output=csv';

    try {
        $response = Http::timeout(300)->get($csvUrl);
        if (!$response->ok()) {
            Log::error('Failed to fetch CSV: ' . $response->status());
            return back()->with('error', 'Failed to fetch CSV data.');
        }

        $lines = explode("\n", trim($response->body()));
        if (count($lines) < 2) {
            Log::warning('CSV contains no data rows.');
            return back()->with('error', 'CSV contains no data.');
        }

        $rawHeader = str_getcsv(array_shift($lines));
        $header = [];
        foreach ($rawHeader as $key => $col) {
            if (trim($col) !== '') {
                $header[$key] = trim($col);
            }
        }

        $csvData = array_map('str_getcsv', $lines);
        $newRecords = 0;

        foreach ($csvData as $rowIndex => $row) {
            $row = array_map('trim', $row);
            $row = array_slice($row, 0, count($header));
            $row = array_pad($row, count($header), '');

            if (count(array_filter($row)) === 0) {
                continue;
            }

            $data = array_combine(array_values($header), $row);
            if (!$data) {
                Log::warning("Malformed row $rowIndex", ['row' => $row]);
                continue;
            }

            // Skip invalid years
            $yearObligated = $data['Year Obligated'] ?? null;
            if (!in_array($yearObligated, ['2024', '2025'])) {
                continue;
            }

            // Match company_id from Name of the Business
            $companyName = trim($data['Name of the Business'] ?? '');
            if (!$companyName) {
                Log::warning("Skipping row $rowIndex: Missing business name");
                continue;
            }

            $company = CompanyModel::where('company_name', $companyName)->first();
            if (!$company) {
                Log::warning("Skipping project: No matching company for {$companyName}");
                continue;
            }

            // Parse release dates from Original Project Duration
            [$releaseInitial, $releaseEnd] = $this->splitMonthYear($data['Original Project Duration'] ?? '');

            // Parse refund dates from Original Refund Schedule
            [$refundInitial, $refundEnd] = $this->splitMonthYear($data['Original Refund Schedule'] ?? '');

            $projectCostRaw = $data['Amount of DOST Assistance'] ?? '0';

            // Remove commas and spaces if any, trim first
            $projectCostRaw = str_replace([',', ' '], '', trim($projectCostRaw));

            // Check if numeric (decimal or integer)
            if (is_numeric($projectCostRaw)) {
                // Convert to float first, then to int to handle decimals safely
                $projectCost = (int) round(floatval($projectCostRaw));
            } else {
                $projectCost = 0;
                Log::warning("Row $rowIndex has invalid project_cost value: " . $projectCostRaw);
            }

            try {
                ProjectModel::updateOrCreate(
                    [
                        'project_id' => str_replace('-', '', $data['Project Code'] ?? '')
                    ],
                    [
                        'project_title'   => $data['Name of Project'] ?? null,
                        'company_id'      => $company->company_id,
                        'release_initial' => $releaseInitial,
                        'release_end'     => $releaseEnd,
                        'refund_initial'  => $refundInitial,
                        'refund_end'      => $refundEnd,
                        'year_obligated'  => $yearObligated,
                        'added_by'        => session('user_id') ?? 1,
                        'project_cost'    => $projectCost ?? 0,
                        'progress'        => 'Implementation',
                        'revenue'         => $this->sanitizeNumeric($data['Revenue'] ?? null),
                        'equity'          => $this->sanitizeNumeric($data['Equity'] ?? null),
                        'liability'       => $this->sanitizeNumeric($data['Liability'] ?? null),
                        'net_income'      => $this->sanitizeNumeric($data['Net Income (Before SETUP)'] ?? null),
                        'current_asset'   => $this->sanitizeNumeric($data['Current Asset (Before SETUP)'] ?? null),
                        'noncurrent_asset'=> $this->sanitizeNumeric($data['Non-Current Asset (Before SETUP)'] ?? null),
                    ]
                );
                $newRecords++;
            } catch (\Exception $e) {
                Log::error("Row $rowIndex failed: " . $e->getMessage(), ['row' => $data]);
                continue;
            }
        }

        Log::info("Project CSV sync complete. Total new/updated: $newRecords");
        return back()->with('success', "$newRecords projects synced.");
    } catch (\Exception $e) {
        Log::error('Project CSV Sync failed: ' . $e->getMessage());
        return back()->with('error', 'Sync failed. Please try again.');
    }
}

/**
 * Split "MMM YYYY - MMM YYYY" into two Y-m-d dates ("YYYY-MM-DD")
 */
private function splitMonthYear($value)
{
    if (!$value) return [null, null];
    $parts = array_map('trim', explode('-', $value));

    $parseDate = function ($part) {
        if (!$part) return null;
        try {
            // Parse month-year string and set day as 1
        $dt = Carbon::createFromFormat('M Y', $part)->startOfMonth();
        return $dt->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    };

    return [
        $parseDate($parts[0] ?? null),
        $parseDate($parts[1] ?? null)
    ];
}

private function sanitizeNumeric($value)
{
    if (!$value) return null;
    $clean = str_replace([',', ' '], '', trim($value));
    return is_numeric($clean) ? (float)$clean : null;
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
