<?php

namespace App\Http\Controllers;

use App\Mail\ProjectCreatedMail;
use App\Models\ObjectiveModel;
use App\Models\ProjectModel;
use App\Models\CompanyModel;
use App\Models\ImplementationModel;
use App\Models\ItemModel;
use App\Models\MarketModel;
use App\Models\MoaModel;
use App\Models\UserModel;
use App\Models\OfficeModel;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class ProjectController extends Controller
{

private const VALID_PROGRESS_STATUSES = [
    'Company Details',
    'Project Created',
    'internal_rtec',
    'internal_compliance',
    'external_rtec',
    'external_compliance',
    'Project Review',
    'Awaiting Approval',
    'Approved',
    'Implementation',
    'Refund',
    'Completed',
    'Disapproved',
    'Withdrawn',
    'Terminated',
];

public function index(Request $request)
{
    $user = Auth::user();
    if (!$user) {
        return redirect()->route('login');
    }

    $search = $request->input('search');
    $perPage = $request->input('perPage', 10);
    $sortField = $request->input('sortField', 'project_title');
    $sortDirection = $request->input('sortDirection', 'asc');
    $officeFilter = $request->input('officeFilter');
    $progressFilter = $request->input('progressFilter');

    $query = ProjectModel::with([
        'company.office',
        'items' => function ($q) {
            $q->where('report', 'approved');
        },
        'messages' => function ($q) {
            $q->orderBy('created_at', 'desc');
        }
    ]);

    // Filter by user role
    if ($user->role === 'user') {
        $query->where('added_by', $user->user_id);
    } elseif ($user->role === 'staff') {
        $query->whereHas('company', function ($q) use ($user) {
            $q->where('office_id', $user->office_id);
        });
    }

    // Apply search
    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->where('project_title', 'like', "%{$search}%")
                ->orWhere('project_cost', 'like', "%{$search}%")
                ->orWhere('progress', 'like', "%{$search}%")
                ->orWhereHas('company', function ($q) use ($search) {
                    $q->where('company_name', 'like', "%{$search}%");
                })
                ->orWhereHas('items', function ($q) use ($search) {
                    $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('specifications', 'like', "%{$search}%");
                });
        });
    }

    // Apply office filter
    if ($officeFilter) {
        $query->whereHas('company', function ($q) use ($officeFilter) {
            $q->where('office_id', $officeFilter);
        });
    }

    // Apply progress filter
    if ($progressFilter) {
        $query->where('progress', $progressFilter);
    }

    // REMOVED: Only include projects that have approved items
    // Now projects display even without items

    // Apply sorting
    if ($sortField === 'project_title') {
        $query->orderBy('project_title', $sortDirection);
    } elseif ($sortField === 'project_cost') {
        $query->orderBy('project_cost', $sortDirection);
    } elseif ($sortField === 'progress') {
        $query->orderBy('progress', $sortDirection);
    } elseif ($sortField === 'company_name') {
        $query->join('tbl_companies', 'tbl_projects.company_id', '=', 'tbl_companies.company_id')
                ->orderBy('tbl_companies.company_name', $sortDirection)
                ->select('tbl_projects.*');
    } else {
        $query->orderBy('project_title', 'asc');
    }

    $projects = $query->paginate($perPage)->withQueryString();

    // Get offices for filter dropdown
    $offices = OfficeModel::orderBy('office_name')->get();

    return Inertia::render('Projects/Index', [
        'projects' => $projects,
        'offices' => $offices,
        'filters' => [
            'search' => $search,
            'perPage' => $perPage,
            'sortField' => $sortField,
            'sortDirection' => $sortDirection,
            'officeFilter' => $officeFilter,
            'progressFilter' => $progressFilter,
        ],
    ]);
}

    public function updateStatus(Request $request, $id){
        $validated = $request->validate([
            'progress' => 'required|string|in:' . implode(',', self::VALID_PROGRESS_STATUSES),
        ]);

        $project = ProjectModel::findOrFail($id);
        $oldProgress = $project->progress;
        $project->progress = $validated['progress'];
        $project->save();

        // Handle Implementation status change
        if ($validated['progress'] === 'Implementation') {
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
            $moa = MoaModel::where('project_id', $project->project_id)->first();
            if ($moa) {
                $moa->acknowledge_date = Carbon::now();
                $moa->save();
            }
        }

        Log::info("Project status updated", [
            'project_id' => $project->project_id,
            'old_status' => $oldProgress,
            'new_status' => $validated['progress'],
            'updated_by' => Auth::id()
        ]);

        return back()->with('success', 'Project status updated successfully.');
    }

public function create(){
    $user = Auth::user();

    $companies = CompanyModel::query();

    if ($user->role === 'staff') {
        $companies->where('office_id', $user->office_id);
    } elseif ($user->role === 'user') {
        $companies->where('added_by', $user->user_id);
    }

    // Generate the next project code
    $nextProjectCode = $this->generateNextProjectCode();

    return Inertia::render('Projects/Create', [
        'companies' => $companies->orderBy('company_name')->get(),
        'nextProjectCode' => $nextProjectCode
    ]);
}

/**
 * Generate the next project code in format YYYYMM##
 */
private function generateNextProjectCode()
{
    $currentYear = date('Y');
    $currentMonth = date('m');
    $prefix = $currentYear . $currentMonth;

    // Find the latest project code with the current year-month prefix
    $latestProject = ProjectModel::where('project_id', 'like', $prefix . '%')
        ->orderBy('project_id', 'desc')
        ->first();

    if ($latestProject) {
        // Extract the incremental number from the latest project code
        $lastIncrement = (int) substr($latestProject->project_id, -2);
        $nextIncrement = $lastIncrement + 1;
    } else {
        // First project for this month
        $nextIncrement = 1;
    }

    // Format the increment as 2 digits
    $incrementStr = str_pad($nextIncrement, 2, '0', STR_PAD_LEFT);

    return $prefix . $incrementStr;
}

public function store(Request $request){
    $user = Auth::user();

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
        'project_id'        => 'required|string|max:255|regex:/^\d{8}$/|unique:tbl_projects,project_id',
        'project_title'     => 'required|string|max:255',
        'company_id'        => 'required|exists:tbl_companies,company_id',
        'project_cost'      => 'required|numeric',
        'refund_amount'     => 'nullable|numeric',
        'last_refund'       => 'nullable|numeric',
        'progress'          => 'required|string|in:' . implode(',', self::VALID_PROGRESS_STATUSES),
        'year_obligated'    => 'nullable|string',
        'revenue'           => 'nullable|numeric',
        'net_income'        => 'nullable|numeric',
        'current_asset'     => 'nullable|numeric',
        'noncurrent_asset'  => 'nullable|numeric',
        'equity'            => 'nullable|numeric',
        'liability'         => 'nullable|numeric',
        'fund_release'      => 'nullable|date',
        'release_initial'   => 'nullable|date',
        'release_end'       => 'nullable|date',
        'refund_initial'    => 'nullable|date',
        'refund_end'        => 'nullable|date',
        'place_name'        => 'nullable|string',
        'items'             => 'array',
        'items.*.item_name' => 'required|string|max:100',
        'items.*.specifications' => 'required|string|max:255',
        'items.*.item_cost' => 'required|numeric|min:0',
        'items.*.quantity'  => 'required|integer|min:1',
        'items.*.type'      => 'required|string|max:10',
        'objectives'        => 'array',
        'objectives.*.details' => 'required|string|max:255',
    ], [
        'project_id.unique' => 'This Project Code already exists.',
    ]);

    $project = ProjectModel::create([
        'project_id'        => $validated['project_id'],
        'project_title'     => $validated['project_title'],
        'company_id'        => $validated['company_id'],
        'project_cost'      => $validated['project_cost'] ?? null,
        'refund_amount'     => $validated['refund_amount'] ?? null,
        'last_refund'       => $validated['last_refund'] ?? null,
        'progress'          => $validated['progress'] ?? 'Company Details',
        'year_obligated'    => $validated['year_obligated'] ?? null,
        'revenue'           => $validated['revenue'] ?? null,
        'net_income'        => $validated['net_income'] ?? null,
        'current_asset'     => $validated['current_asset'] ?? null,
        'noncurrent_asset'  => $validated['noncurrent_asset'] ?? null,
        'equity'            => $validated['equity'] ?? null,
        'liability'         => $validated['liability'] ?? null,
        'fund_release'      => $validated['fund_release'] ?? null,
        'release_initial'   => $validated['release_initial'] ?? null,
        'release_end'       => $validated['release_end'] ?? null,
        'refund_initial'    => $validated['refund_initial'] ?? null,
        'refund_end'        => $validated['refund_end'] ?? null,
        'added_by'          => $user->user_id,
    ]);

    // Update Progress to 'Project Created'
    $project->progress = 'Project Created';
    $project->save();

    // Save items
    if (!empty($validated['items'])) {
        foreach ($validated['items'] as $item) {
            ItemModel::create([
                'project_id'     => $validated['project_id'],
                'item_name'      => $item['item_name'],
                'specifications' => $item['specifications'] ?? null,
                'item_cost'      => $item['item_cost'],
                'quantity'       => $item['quantity'],
                'type'           => $item['type'],
                'report'         => 'approved',
            ]);
        }
    }

    // Save objectives
    if (!empty($validated['objectives'])) {
        foreach ($validated['objectives'] as $objective) {
            ObjectiveModel::create([
                'project_id' => $validated['project_id'],
                'details'    => $objective['details'],
                'report'     => 'approved',
            ]);
        }
    }

    if (!empty($validated['place_name'])) {
        MarketModel::create([
            'project_id' => $validated['project_id'],
            'place_name' => $validated['place_name'],
        ]);
    }

    // Get company and send email to office users
    $company = CompanyModel::findOrFail($validated['company_id']);

    $officeUsers = UserModel::where('office_id', $company->office_id)
        ->whereIn('role', ['rpmo', 'staff'])
        ->get();

    foreach ($officeUsers as $officeUser) {
        try {
            Mail::to($officeUser->email)->send(
                new ProjectCreatedMail($project, $company, $user)
            );
            Log::info("Project creation email sent to {$officeUser->email}");
        } catch (\Exception $e) {
            Log::error("Failed to send project creation email to {$officeUser->email}: " . $e->getMessage());
        }
    }

    return redirect('/projects')->with('success', 'Project, items, and objectives created successfully.');
}

public function edit($id)
{
    $project = ProjectModel::with([
        'items' => function ($query) {
            $query->where('report', 'approved'); 
        },
        'objectives' => function ($query) {
            $query->where('report', 'approved'); 
        },
        'markets' => function ($query) {
            $query->where('type', 'existing');
        }
    ])->findOrFail($id);
    
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
        'fund_release'      => 'nullable|date',
        'release_initial'   => 'required|regex:/^\d{4}-\d{2}$/',
        'release_end'       => 'required|regex:/^\d{4}-\d{2}$/',
        'refund_initial'    => 'required|regex:/^\d{4}-\d{2}$/',
        'refund_end'        => 'required|regex:/^\d{4}-\d{2}$/',
        'refund_amount'     => 'nullable|numeric|min:0',
        'last_refund'       => 'nullable|numeric|min:0',
        'place_name'        => 'required|string',
        'items'             => 'nullable|array',
        'items.*.item_name' => 'required_with:items|string|max:255',
        'items.*.specifications' => 'nullable|string',
        'items.*.item_cost' => 'required_with:items|numeric|min:0',
        'items.*.quantity'  => 'required_with:items|integer|min:1',
        'items.*.type'      => 'required|in:equipment,nonequip', 
        'objectives'        => 'nullable|array',
        'objectives.*.details' => 'required_with:objectives|string',
    ]);

    Log::info('Validated data:', $validated);

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
        'fund_release'      => $validated['fund_release'] ?? null,
        'release_initial'   => $validated['release_initial'],
        'release_end'       => $validated['release_end'],
        'refund_amount'     => $validated['refund_amount'] ?? null,
        'last_refund'       => $validated['last_refund'] ?? null,
        'refund_initial'    => $validated['refund_initial'],
        'refund_end'        => $validated['refund_end'],
    ]);

    Log::info("Project updated successfully.");

    $project->items()->where('report', 'approved')->delete();
    Log::info("Deleted old items.");

    if (!empty($validated['items'])) {
        foreach ($validated['items'] as $item) {
            $project->items()->create([
                'item_name'      => $item['item_name'],
                'specifications' => $item['specifications'] ?? null,
                'item_cost'      => $item['item_cost'],
                'quantity'       => $item['quantity'],
                'type'           => $item['type'],
                'report'         => 'approved',
            ]);
        }
        Log::info("Items recreated.", $validated['items']);
    }

    $project->objectives()->where('report', 'approved')->delete();
    Log::info("Deleted old objectives.");

    if (!empty($validated['objectives'])) {
        foreach ($validated['objectives'] as $objective) {
            $project->objectives()->create([
                'details' => $objective['details'],
                'report'  => 'approved',
            ]);
        }
        Log::info("Objectives recreated.", $validated['objectives']);
    }

    $market = $project->markets()
        ->where('type', 'existing')
        ->where('project_id', $project->project_id)
        ->first();

    if ($market) {
        $market->place_name = $validated['place_name'];
        $market->save();
        Log::info('Market updated', ['id' => $market->id, 'place_name' => $market->place_name]);
    } else {
        $project->markets()->create([
            'type' => 'existing',
            'place_name' => $validated['place_name'],
        ]);
        Log::info('Market created', ['place_name' => $validated['place_name']]);
    }

    return redirect('/projects')->with('success', 'Project updated successfully.');
}

public function syncProjectsFromCSV(){
    $csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQoYM37FSpNPcliFztgpSVgglK0XyoDLSdhOftcdqmy2mV-83VVxuUf9EdcE57gFG36r06rwH66CZQO/pub?gid=0&single=true&output=csv';

    try {
        $response = Http::timeout(300)->get($csvUrl);
        if (!$response->ok()) {
            Log::error('Failed to fetch CSV: ' . $response->status());
            return back()->with('error', 'Failed to fetch CSV data.');
        }

        // Use fgetcsv for more robust CSV parsing
        $stream = fopen('php://memory', 'r+');
        fwrite($stream, $response->body());
        rewind($stream);

        // Read header
        $rawHeader = fgetcsv($stream);
        if (!$rawHeader) {
            Log::warning('CSV contains no header.');
            return back()->with('error', 'CSV contains no header.');
        }

        $header = [];
        // Build header mapping with normalization
        foreach ($rawHeader as $key => $col) {
            $trimmed = trim($col);
            $normalized = preg_replace('/\s+/', ' ', $trimmed);
            if ($normalized !== '') {
                $header[$key] = $normalized;
            }
        }

        Log::info('CSV Header count: ' . count($header));
        Log::info('CSV Headers:', $header);

        $newRecords = 0;
        $errors = [];
        $rowIndex = 1;

        // Read data rows
        while (($row = fgetcsv($stream)) !== false) {
            $rowIndex++;
            
            try {
                $row = array_map('trim', $row);
                $row = array_pad($row, count($header), '');

                // Skip empty rows
                if (count(array_filter($row)) === 0) {
                    continue;
                }

                $data = array_combine(array_values($header), $row);
                if (!$data) {
                    Log::warning("Malformed row $rowIndex", ['row_count' => count($row), 'header_count' => count($header)]);
                    continue;
                }

                Log::info("Processing row $rowIndex", $data);

                // Validate year obligated
                $yearObligated = $data['Year Obligated'] ?? null;
                // if (!in_array($yearObligated, ['2007' ])) {
                //     continue;
                // }

                // Get company
                $companyName = trim($data['Name of the Business'] ?? '');
                if (!$companyName) {
                    Log::warning("Row $rowIndex: Missing business name");
                    continue;
                }

                $company = CompanyModel::where('company_name', $companyName)->first();
                if (!$company) {
                    Log::warning("Row $rowIndex: No matching company for '{$companyName}'");
                    continue;
                }

                // Generate numeric project_id
                $projectCode = $data['Project Code'] ?? '';
                $projectCode = preg_replace('/[^0-9]/', '', $projectCode);
                
                if (empty($projectCode)) {
                    Log::warning("Row $rowIndex: Invalid project code");
                    continue;
                }

                $projectId = (int) $projectCode;
                if ($projectId === 0) {
                    $projectId = (int) (time() . mt_rand(100, 999));
                }

                // Parse dates
                [$releaseInitial, $releaseEnd] = $this->splitMonthYear($data['Original Project Duration'] ?? '');
                [$refundInitial, $refundEnd] = $this->splitMonthYear($data['Original Refund Schedule'] ?? '');

                // Parse fund release date
                $fundRelease = $this->parseDateFormat($data['Date of Fund Release'] ?? '');

                Log::info("Row $rowIndex: Parsed dates", [
                    'release_initial' => $releaseInitial,
                    'release_end' => $releaseEnd,
                    'fund_release' => $fundRelease,
                ]);

                // Parse project cost
                $projectCostRaw = $data['Amount of DOST Assistance'] ?? '0';
                $projectCostRaw = str_replace([',', ' '], '', trim($projectCostRaw));
                $projectCost = is_numeric($projectCostRaw) ? (float) $projectCostRaw : 0;

                if ($projectCost === 0) {
                    Log::warning("Row $rowIndex: Invalid or zero project_cost");
                }

                // Create or update project
                $project = ProjectModel::updateOrCreate(
                    ['project_id' => $projectId],
                    [
                        'project_title'    => $data['Name of Project'] ?? null,
                        'company_id'       => $company->company_id,
                        'release_initial'  => $releaseInitial,
                        'release_end'      => $releaseEnd,
                        'refund_initial'   => $refundInitial,
                        'refund_end'       => $refundEnd,
                        'fund_release'     => $fundRelease,
                        'year_obligated'   => $yearObligated,
                        'added_by'         => Auth::id() ?? 1,
                        'project_cost'     => $projectCost,
                        'progress'         => 'Implementation',
                        'revenue'          => $this->sanitizeNumeric($data['Revenue (Before SETUP)'] ?? null),
                        'equity'           => $this->sanitizeNumeric($data['Equity (Before SETUP)'] ?? null),
                        'liability'        => $this->sanitizeNumeric($data['Liability (Before SETUP)'] ?? null),
                        'net_income'       => $this->sanitizeNumeric($data['Net Income (Before SETUP)'] ?? null),
                        'current_asset'    => $this->sanitizeNumeric($data['Current Asset (Before SETUP)'] ?? null),
                        'noncurrent_asset' => $this->sanitizeNumeric($data['Non-Current Asset (Before SETUP)'] ?? null),
                    ]
                );

                $newRecords++;
                Log::info("Row $rowIndex synced successfully. Project ID: $projectId");

            } catch (\Exception $e) {
                $errorMsg = "Row $rowIndex failed: " . $e->getMessage();
                Log::error($errorMsg, ['row' => $data ?? []]);
                $errors[] = $errorMsg;
                continue;
            }
        }

        fclose($stream);

        $message = "$newRecords projects synced successfully.";
        if (!empty($errors)) {
            $message .= " " . count($errors) . " rows had errors.";
            Log::warning("Sync errors:", $errors);
        }

        Log::info("Project CSV sync complete. Total new/updated: $newRecords");
        return back()->with('success', $message);

    } catch (\Exception $e) {
        Log::error('Project CSV Sync failed: ' . $e->getMessage());
        return back()->with('error', 'Sync failed: ' . $e->getMessage());
    }
}


private function parseMonthYear($part)
{
    if (!$part) return null;
    
    $part = strtoupper(trim($part));

    try {
        // Handle "AUG 2003" format (space-separated)
        if (strpos($part, ' ') !== false && strpos($part, ',') === false) {
            return Carbon::createFromFormat('M Y', $part)->startOfMonth()->format('Y-m-d');
        }
        
        // Handle "SEP,2001" format (comma-separated)
        if (strpos($part, ',') !== false) {
            $pieces = explode(',', $part);
            $month = trim($pieces[0] ?? '');
            $year = trim($pieces[1] ?? '');
            return Carbon::createFromFormat('M Y', "$month $year")->startOfMonth()->format('Y-m-d');
        }
        
        // Try "M Y" format
        return Carbon::createFromFormat('M Y', $part)->startOfMonth()->format('Y-m-d');
    } catch (\Exception $e) {
        try {
            // Try full month name "F Y" format
            return Carbon::createFromFormat('F Y', ucwords(strtolower($part)))->startOfMonth()->format('Y-m-d');
        } catch (\Exception $e) {
            Log::warning("Failed to parse month-year: $part");
            return null;
        }
    }
}

private function parseDateFormat($value)
{
    if (!$value) return null;
    
    $value = trim($value);
    
    try {
        // If it's a range like "SEP,2001 - SEP,2002", take the first date
        if (strpos($value, '-') !== false) {
            $parts = explode('-', $value);
            $value = trim($parts[0] ?? '');
        }
        
        // Handle "SEP,2001" format
        if (strpos($value, ',') !== false) {
            $pieces = explode(',', $value);
            $month = trim($pieces[0] ?? '');
            $year = trim($pieces[1] ?? '');
            return Carbon::createFromFormat('M Y', "$month $year")->format('Y-m-d');
        }
        
        // Try to parse "September 21, 2001" format
        return Carbon::createFromFormat('F d, Y', $value)->format('Y-m-d');
    } catch (\Exception $e) {
        try {
            // Try other common formats
            return Carbon::parse($value)->format('Y-m-d');
        } catch (\Exception $e) {
            Log::warning("Failed to parse date: $value");
            return null;
        }
    }
}

private function splitMonthYear($value){
    if (!$value) return [null, null];
    
    // Handle ranges with "-" separator (e.g., "AUG 2003 - MAY 2006")
    $parts = preg_split('/\s*-\s*/', trim($value));
    $start = trim($parts[0] ?? '');
    $end = trim($parts[1] ?? '');

    return [
        $this->parseMonthYear($start),
        $this->parseMonthYear($end),
    ];
}

private function sanitizeNumeric($value)
{
    if (is_null($value) || $value === '') {
        return null;
    }

    $clean = preg_replace('/[^\d.-]/', '', $value);
    return is_numeric($clean) ? (float) $clean : null;
}

public function readonly()
{
    $user = Auth::user();
    if (!$user) {
        return Inertia::render('Projects/ProjectList', [
            'projects' => collect(),
        ]);
    }

    $query = ProjectModel::with([
        'company',
        'items' => function ($q) {
            $q->where('report', 'approved');
        }
    ]);
    
    // REMOVED: No longer requires items to display projects

    if ($user->role === 'user') {
        $companyIds = CompanyModel::where('added_by', $user->user_id)->pluck('company_id');
        $query->whereIn('company_id', $companyIds);
    } elseif ($user->role === 'staff') {
        $query->whereHas('company', function ($q) use ($user) {
            $q->where('office_id', $user->office_id);
        });
    }

    $projects = $query->get();

    return Inertia::render('Projects/ProjectList', [
        'projects' => $projects,
    ]);
}

public function destroy($id)
{
    ProjectModel::findOrFail($id)->delete();
    return redirect('/projects')->with('success', 'Project deleted successfully.');
}
}