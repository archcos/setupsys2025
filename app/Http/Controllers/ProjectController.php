<?php

namespace App\Http\Controllers;

use App\Mail\ProjectCreatedMail;
use App\Models\ImplementationModel;
use App\Models\ItemModel;
use App\Models\MarketModel;
use App\Models\MoaModel;
use App\Models\ObjectiveModel;
use App\Models\OfficeModel;
use App\Models\ProjectModel;
use App\Models\ProponentModel;
use App\Models\UserModel;
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
        'Proponent Details',
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
        $sortField = $request->input('sortField', 'project_id');
        $sortDirection = $request->input('sortDirection', 'desc');
        $officeFilter = $request->input('officeFilter');
        $progressFilter = $request->input('progressFilter');
        $yearFilter = $request->input('yearFilter');

        $query = ProjectModel::with([
            'proponent.office',
            'items' => function ($q) {
                $q->where('report', 'approved');
            },
            'messages' => function ($q) {
                $q->orderBy('created_at', 'desc');
            },
        ]);

        if ($user->role === 'user') {
            $query->where('added_by', $user->user_id);
        } elseif ($user->role === 'staff') {
            $query->whereHas('proponent', function ($q) use ($user) {
                $q->where('office_id', $user->office_id);
            });
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('project_title', 'like', "%{$search}%")
                    ->orWhere('project_id', 'like', "%{$search}%")
                    ->orWhere('project_cost', 'like', "%{$search}%")
                    ->orWhere('progress', 'like', "%{$search}%")
                    ->orWhereHas('proponent', function ($q) use ($search) {
                        $q->where('company_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('items', function ($q) use ($search) {
                        $q->where('item_name', 'like', "%{$search}%")
                        ->orWhere('specifications', 'like', "%{$search}%");
                    });
            });
        }

        if ($officeFilter) {
            $query->whereHas('proponent', function ($q) use ($officeFilter) {
                $q->where('office_id', $officeFilter);
            });
        }

        if ($yearFilter) {
            $query->where('year_obligated', $yearFilter);
        }

        if ($progressFilter) {
            $query->where('progress', $progressFilter);
        }

        if ($sortField === 'project_title') {
            $query->orderBy('project_title', $sortDirection);
        } elseif ($sortField === 'project_id') {
            $query->orderBy('project_id', $sortDirection);
        } elseif ($sortField === 'project_cost') {
            $query->orderBy('project_cost', $sortDirection);
        } elseif ($sortField === 'progress') {
            $query->orderBy('progress', $sortDirection);
        } elseif ($sortField === 'year_obligated') {
            $query->orderBy('year_obligated', $sortDirection);
        } elseif ($sortField === 'fund_release') {
            $query->orderBy('fund_release', $sortDirection);
        } elseif ($sortField === 'company_name') {
            $query->join('tbl_proponents', 'tbl_projects.proponent_id', '=', 'tbl_proponents.proponent_id')
                    ->orderBy('tbl_proponents.company_name', $sortDirection)
                    ->select('tbl_projects.*');
        } else {
            $query->orderBy('project_title', 'asc');
        }

        $projects = $query->paginate($perPage)->withQueryString();

        $offices = OfficeModel::orderBy('office_name')->get();

        $yearQuery = ProjectModel::where('year_obligated', '!=', null)
            ->distinct()
            ->orderBy('year_obligated', 'desc');

        if ($user->role === 'user') {
            $yearQuery->where('added_by', $user->user_id);
        } elseif ($user->role === 'staff') {
            $yearQuery->whereHas('proponent', function ($q) use ($user) {
                $q->where('office_id', $user->office_id);
            });
        }

        $allYears = $yearQuery->pluck('year_obligated')->toArray();

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
            'offices' => $offices,
            'allYears' => $allYears,
            'filters' => [
                'search' => $search,
                'perPage' => $perPage,
                'sortField' => $sortField,
                'sortDirection' => $sortDirection,
                'officeFilter' => $officeFilter,
                'progressFilter' => $progressFilter,
                'yearFilter' => $yearFilter,
            ],
        ]);
    }

    // FIXED: Added authorization check for status updates
    public function updateStatus(Request $request, $id)
    {
        $user = Auth::user();

        // ✅ SECURITY FIX: Only RPMO can update project status
        if ($user->role !== 'rpmo') {
            return back()->with('error', 'Unauthorized: Only RPMO can update project status.');
        }

        $validated = $request->validate([
            'progress' => 'required|string|in:'.implode(',', self::VALID_PROGRESS_STATUSES),
        ]);

        $project = ProjectModel::findOrFail($id);
        $oldProgress = $project->progress;
        $project->progress = $validated['progress'];
        $project->save();

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
            $moa = MoaModel::where('project_id', $project->project_id)->first();
            if ($moa) {
                $moa->acknowledge_date = Carbon::now();
                $moa->save();
            }
        }

        Log::info('Project status updated', [
            'project_id' => $project->project_id,
            'old_status' => $oldProgress,
            'new_status' => $validated['progress'],
            'updated_by' => Auth::id(),
        ]);

        return back()->with('success', 'Project status updated successfully.');
    }

    public function create()
    {
        $user = Auth::user();

        $proponents = ProponentModel::query();

        if ($user->role === 'staff') {
            $proponents->where('office_id', $user->office_id);
        } elseif ($user->role === 'user') {
            $proponents->where('added_by', $user->user_id);
        }

        $nextProjectCode = $this->generateNextProjectCode();

        return Inertia::render('Projects/Create', [
            'proponents' => $proponents->orderBy('company_name')->get(),
            'nextProjectCode' => $nextProjectCode,
        ]);
    }

    private function generateNextProjectCode()
    {
        $currentYear = date('Y');
        $currentMonth = date('m');
        $prefix = $currentYear.$currentMonth;

        $latestProject = ProjectModel::where('project_id', 'like', $prefix.'%')
            ->orderBy('project_id', 'desc')
            ->first();

        if ($latestProject) {
            $lastIncrement = (int) substr($latestProject->project_id, -2);
            $nextIncrement = $lastIncrement + 1;
        } else {
            $nextIncrement = 1;
        }

        $incrementStr = str_pad($nextIncrement, 2, '0', STR_PAD_LEFT);

        return $prefix.$incrementStr;
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        if ($request->has('release_initial')) {
            $request->merge(['release_initial' => $request->input('release_initial').'-01']);
        }
        if ($request->has('release_end')) {
            $request->merge(['release_end' => $request->input('release_end').'-01']);
        }
        if ($request->has('refund_initial')) {
            $request->merge(['refund_initial' => $request->input('refund_initial').'-01']);
        }
        if ($request->has('refund_end')) {
            $request->merge(['refund_end' => $request->input('refund_end').'-01']);
        }

        $validated = $request->validate([
            'project_id' => 'required|string|max:255|regex:/^\d{8}$/|unique:tbl_projects,project_id',
            'project_title' => 'required|string|max:255',
            'proponent_id' => 'required|exists:tbl_proponents,proponent_id',
            'fund_release' => 'nullable|date',
            'project_cost' => 'required|numeric',
            'counterpart' => 'nullable|numeric',
            'released_amount' => 'nullable|numeric',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'refund_amount' => 'nullable|numeric',
            'last_refund' => 'nullable|numeric',
            'progress' => 'required|string|in:'.implode(',', self::VALID_PROGRESS_STATUSES),
            'year_obligated' => 'nullable|string',
            'revenue' => 'nullable|numeric',
            'net_income' => 'nullable|numeric',
            'current_asset' => 'nullable|numeric',
            'noncurrent_asset' => 'nullable|numeric',
            'equity' => 'nullable|numeric',
            'liability' => 'nullable|numeric',
            'female' => 'nullable|integer|min:0',
            'male' => 'nullable|integer|min:0',
            'direct_male' => 'nullable|integer|min:0',
            'direct_female' => 'nullable|integer|min:0',
            'release_initial' => 'nullable|date',
            'release_end' => 'nullable|date',
            'refund_initial' => 'nullable|date',
            'refund_end' => 'nullable|date',
            'place_name' => 'nullable|string',
            'items' => 'array',
            'items.*.item_name' => 'required|string|max:100',
            'items.*.specifications' => 'required',
            'items.*.item_cost' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.type' => 'required|string|max:10',
            'objectives' => 'array',
            'objectives.*.details' => 'required',
        ], [
            'project_id.unique' => 'This Project Code already exists.',
            'latitude.between' => 'Latitude must be between -90 and 90.',
            'longitude.between' => 'Longitude must be between -180 and 180.',
        ]);

        $project = ProjectModel::create([
            'project_id' => $validated['project_id'],
            'project_title' => $validated['project_title'],
            'proponent_id' => $validated['proponent_id'],
            'project_cost' => $validated['project_cost'],
            'counterpart' => $validated['counterpart'] ?? null,
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'released_amount' => $validated['released_amount'] ?? null,
            'refund_amount' => $validated['refund_amount'] ?? null,
            'last_refund' => $validated['last_refund'] ?? null,
            'progress' => 'Project Created',
            'year_obligated' => $validated['year_obligated'] ?? null,
            'revenue' => $validated['revenue'] ?? null,
            'net_income' => $validated['net_income'] ?? null,
            'current_asset' => $validated['current_asset'] ?? null,
            'noncurrent_asset' => $validated['noncurrent_asset'] ?? null,
            'equity' => $validated['equity'] ?? null,
            'liability' => $validated['liability'] ?? null,
            'female' => $validated['female'] ?? null,
            'male' => $validated['male'] ?? null,
            'direct_male' => $validated['direct_male'] ?? null,
            'direct_female' => $validated['direct_female'] ?? null,
            'fund_release' => $validated['fund_release'] ?? null,
            'release_initial' => $validated['release_initial'] ?? null,
            'release_end' => $validated['release_end'] ?? null,
            'refund_initial' => $validated['refund_initial'] ?? null,
            'refund_end' => $validated['refund_end'] ?? null,
            'added_by' => $user->user_id,
        ]);

        if (!empty($validated['items'])) {
            foreach ($validated['items'] as $item) {
                ItemModel::create([
                    'project_id' => $validated['project_id'],
                    'item_name' => $item['item_name'],
                    'specifications' => $item['specifications'] ?? null,
                    'item_cost' => $item['item_cost'],
                    'quantity' => $item['quantity'],
                    'type' => $item['type'],
                    'report' => 'approved',
                ]);
            }
        }

        if (!empty($validated['objectives'])) {
            foreach ($validated['objectives'] as $objective) {
                ObjectiveModel::create([
                    'project_id' => $validated['project_id'],
                    'details' => $objective['details'],
                    'report' => 'approved',
                ]);
            }
        }

        if (!empty($validated['place_name'])) {
            MarketModel::create([
                'project_id' => $validated['project_id'],
                'place_name' => $validated['place_name'],
                'type' => 'existing',
            ]);
        }

        $proponent = ProponentModel::findOrFail($validated['proponent_id']);
        $officeUsers = UserModel::where('office_id', $proponent->office_id)
            ->whereIn('role', ['rpmo', 'staff'])
            ->get();

        foreach ($officeUsers as $officeUser) {
            try {
                Mail::to($officeUser->email)->send(new ProjectCreatedMail($project, $proponent, $user));
                Log::info("Project creation email sent to {$officeUser->email}");
            } catch (\Exception $e) {
                Log::error("Failed to send project creation email to {$officeUser->email}: ".$e->getMessage());
            }
        }

        $redirectTo = in_array($user->role, ['rpmo', 'staff', 'head'])
            ? '/projects'
            : '/project-list';

        return redirect($redirectTo)->with('success', 'Project, items, and objectives created successfully.');
    }

    public function export(Request $request)
    {
        $user = Auth::user();

        $query = ProjectModel::with([
            'proponent.office',
            'items' => fn ($q) => $q->where('report', 'approved'),
            'objectives' => fn ($q) => $q->where('report', 'approved'),
            'markets' => fn ($q) => $q->where('type', 'existing'),
        ]);

        // Role-based filtering
        if ($user->role === 'staff') {
            $query->whereHas('proponent', fn ($q) => $q->where('office_id', $user->office_id));
        } elseif ($user->role === 'user') {
            $query->where('added_by', $user->user_id);
        }
        // rpmo sees all - no filtering

        if ($request->filled('year')) {
            $query->whereIn('year_obligated', (array) $request->input('year'));
        }

        if ($request->filled('office')) {
            $offices = (array) $request->input('office');

            // Staff can only filter within their own office
            if ($user->role === 'staff') {
                $offices = array_intersect($offices, [$user->office_id]);
            }

            if (!empty($offices)) {
                $query->whereHas('proponent', fn ($q) => $q->whereIn('office_id', $offices));
            }
        }

        if ($request->filled('progress')) {
            $query->whereIn('progress', (array) $request->input('progress'));
        }

        $projects = $query->orderBy('year_obligated', 'desc')->orderBy('project_id')->get();

        $filename = 'projects_'.now()->format('Ymd_His').'.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($projects) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'Project Code',
                'Year Obligated',
                'Project Title',
                'Progress/Status',
                'proponent Name',
                'Owner Name',
                'Office',
                'Fund Release Date',
                'Released Date',
                'Released Amount',
                'Release Initial',
                'Release End',
                'Refund Initial',
                'Refund End',
                'Project Cost',
                'Counterpart',
                'Latitude',
                'Longitude',
                'Refund Amount',
                'Last Refund',
                'Revenue (Before SETUP)',
                'Net Income (Before SETUP)',
                'Current Asset (Before SETUP)',
                'Non-Current Asset (Before SETUP)',
                'Equity (Before SETUP)',
                'Liability (Before SETUP)',
                'Male Employees',
                'Female Employees',
                'Total Indirect Employees',
                'Direct Male',
                'Direct Female',
                'Total Direct Employees',
                'Existing Markets',
                'Items (Approved)',
                'Objectives (Approved)',
            ]);

            foreach ($projects as $project) {
                $markets = $project->markets->map(fn ($m) => $m->place_name)->filter()->implode(', ');

                $itemsText = $project->items->values()->map(function ($item, $index) {
                    $num = $index + 1;
                    $lines = ["{$num}. Item: {$item->item_name}"];
                    if ($item->specifications) {
                        $lines[] = "   Specification: {$item->specifications}";
                    }
                    $lines[] = '   Cost: '.number_format($item->item_cost, 2);
                    $lines[] = "   Quantity: {$item->quantity}";
                    $lines[] = "   Type: {$item->type}";

                    return implode("\n", $lines);
                })->implode("\n\n");

                $objectivesText = $project->objectives->values()->map(function ($obj, $index) {
                    $num = $index + 1;
                    $line = "{$num}. {$obj->details}";
                    if ($obj->remarks) {
                        $line .= "\n   Remarks: {$obj->remarks}";
                    }

                    return $line;
                })->implode("\n\n");

                $totalIndirect = ($project->male ?? 0) + ($project->female ?? 0);
                $totalDirect = ($project->direct_male ?? 0) + ($project->direct_female ?? 0);

                fputcsv($handle, [
                    $project->project_id,
                    $project->year_obligated,
                    $project->project_title,
                    $project->progress,
                    $project->proponent?->company_name,
                    $project->proponent?->owner_name,
                    $project->proponent?->office?->office_name,
                    $project->fund_release,
                    $project->released_amount,
                    $project->release_initial,
                    $project->release_end,
                    $project->refund_initial,
                    $project->refund_end,
                    $project->project_cost,
                    $project->counterpart,
                    $project->latitude,
                    $project->longitude,
                    $project->refund_amount,
                    $project->last_refund,
                    $project->revenue,
                    $project->net_income,
                    $project->current_asset,
                    $project->noncurrent_asset,
                    $project->equity,
                    $project->liability,
                    $project->male ?? 0,
                    $project->female ?? 0,
                    $totalIndirect,
                    $project->direct_male ?? 0,
                    $project->direct_female ?? 0,
                    $totalDirect,
                    $markets,
                    $itemsText,
                    $objectivesText,
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function edit($id)
    {
        $project = ProjectModel::with([
            'items' => fn ($q) => $q->where('report', 'approved'),
            'objectives' => fn ($q) => $q->where('report', 'approved'),
            'markets' => fn ($q) => $q->where('type', 'existing'),
        ])->findOrFail($id);

        $proponents = ProponentModel::all();

        return Inertia::render('Projects/Edit', [
            'project' => $project,
            'proponents' => $proponents,
        ]);
    }

    public function update(Request $request, $id)
    {
        $project = ProjectModel::findOrFail($id);

        Log::info("Updating project: {$project->project_id}");

        $validated = $request->validate([
            'project_title' => 'required|string|max:255',
            'proponent_id' => 'required|exists:tbl_proponents,proponent_id',
            'project_cost' => 'required|numeric',
            'counterpart' => 'nullable|numeric',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'fund_release' => 'nullable|date',
            'released_amount' => 'nullable|numeric',                      // NEW
            'year_obligated' => 'required|string',
            'revenue' => 'nullable|numeric',
            'net_income' => 'nullable|numeric',
            'current_asset' => 'nullable|numeric',
            'noncurrent_asset' => 'nullable|numeric',
            'equity' => 'nullable|numeric',
            'liability' => 'nullable|numeric',
            'female' => 'nullable|integer|min:0',
            'male' => 'nullable|integer|min:0',
            'direct_male' => 'nullable|integer|min:0',
            'direct_female' => 'nullable|integer|min:0',
            'release_initial' => 'required|regex:/^\d{4}-\d{2}$/',
            'release_end' => 'required|regex:/^\d{4}-\d{2}$/',
            'refund_initial' => 'required|regex:/^\d{4}-\d{2}$/',
            'refund_end' => 'required|regex:/^\d{4}-\d{2}$/',
            'refund_amount' => 'nullable|numeric|min:0',
            'last_refund' => 'nullable|numeric|min:0',
            'place_name' => 'required|string',
            'items' => 'nullable|array',
            'items.*.item_name' => 'required_with:items|string|max:255',
            'items.*.specifications' => 'nullable|string',
            'items.*.item_cost' => 'required_with:items|numeric|min:0',
            'items.*.quantity' => 'required_with:items|integer|min:1',
            'items.*.type' => 'required|in:equipment,nonequip',
            'objectives' => 'nullable|array',
            'objectives.*.details' => 'required_with:objectives|string',
        ], [
            'latitude.between' => 'Latitude must be between -90 and 90.',
            'longitude.between' => 'Longitude must be between -180 and 180.',
        ]);

        $project->update([
            'project_title' => $validated['project_title'],
            'proponent_id' => $validated['proponent_id'],
            'project_cost' => $validated['project_cost'],
            'counterpart' => $validated['counterpart'] ?? null,
            'fund_release' => $validated['fund_release'] ?? null,
            'released_amount' => $validated['released_amount'] ?? null,   // NEW
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'year_obligated' => $validated['year_obligated'],
            'revenue' => $validated['revenue'] ?? null,
            'net_income' => $validated['net_income'] ?? null,
            'current_asset' => $validated['current_asset'] ?? null,
            'noncurrent_asset' => $validated['noncurrent_asset'] ?? null,
            'equity' => $validated['equity'] ?? null,
            'liability' => $validated['liability'] ?? null,
            'female' => $validated['female'] ?? null,
            'male' => $validated['male'] ?? null,
            'direct_male' => $validated['direct_male'] ?? null,
            'direct_female' => $validated['direct_female'] ?? null,
            'release_initial' => $validated['release_initial'],
            'release_end' => $validated['release_end'],
            'refund_amount' => $validated['refund_amount'] ?? null,
            'last_refund' => $validated['last_refund'] ?? null,
            'refund_initial' => $validated['refund_initial'],
            'refund_end' => $validated['refund_end'],
        ]);

        Log::info('Project updated successfully.');

        $project->items()->where('report', 'approved')->delete();
        if (!empty($validated['items'])) {
            foreach ($validated['items'] as $item) {
                $project->items()->create([
                    'item_name' => $item['item_name'],
                    'specifications' => $item['specifications'] ?? null,
                    'item_cost' => $item['item_cost'],
                    'quantity' => $item['quantity'],
                    'type' => $item['type'],
                    'report' => 'approved',
                ]);
            }
        }

        $existingObjectives = $project->objectives()->where('report', 'approved')->get();
        $incomingDetails = collect($validated['objectives'] ?? [])->pluck('details')->map('trim')->filter()->values();
        $existingDetails = $existingObjectives->pluck('details')->map('trim')->values();

        // Only touch objectives if the content actually changed
        if ($incomingDetails->toArray() !== $existingDetails->toArray()) {
            $project->objectives()->where('report', 'approved')->delete();

            foreach ($incomingDetails as $detail) {
                $project->objectives()->create([
                    'details' => $detail,
                    'report' => 'approved',
                ]);
            }
        }

        $market = $project->markets()->where('type', 'existing')->where('project_id', $project->project_id)->first();
        if ($market) {
            $market->place_name = $validated['place_name'];
            $market->save();
        } else {
            $project->markets()->create(['type' => 'existing', 'place_name' => $validated['place_name']]);
        }

        return redirect('/projects')->with('success', 'Project updated successfully.');
    }

    public function syncProjectsFromCSV()
    {

        set_time_limit(0);
        ini_set('memory_limit', '512M');

        $user = Auth::user();

        if (!$user || $user->role !== 'rpmo') {
            return back()->with('error', 'Unauthorized: Only RPMO can sync projects from CSV.');
        }

        $csvUrl = env('PROJECT_CSV_URL');

        if (!$csvUrl) {
            return back()->with('error', 'PROJECT_CSV_URL is not configured.');
        }

        // Disable logging for all models touched during this bulk sync
        ProjectModel::disableLogging();
        ImplementationModel::disableLogging();
        MarketModel::disableLogging();

        try {
            $response = Http::timeout(300)->get($csvUrl);
            if (!$response->ok()) {
                Log::error('Failed to fetch CSV: '.$response->status());

                return back()->with('error', 'Failed to fetch CSV data.');
            }

            $stream = fopen('php://memory', 'r+');
            fwrite($stream, $response->body());
            rewind($stream);

            $rawHeader = fgetcsv($stream);
            if (!$rawHeader) {
                return back()->with('error', 'CSV contains no header.');
            }

            $header = [];
            foreach ($rawHeader as $key => $col) {
                $normalized = preg_replace('/\s+/', ' ', trim($col));
                if ($normalized !== '') {
                    $header[$key] = $normalized;
                }
            }

            $newRecords = 0;
            $errors = [];
            $rowIndex = 1;

            while (($row = fgetcsv($stream)) !== false) {
                ++$rowIndex;
                // ↑ No try/finally here — enableLogging() must NOT fire per row
                try {
                    $row = array_pad(array_map('trim', $row), count($header), '');
                    if (count(array_filter($row)) === 0) {
                        continue;
                    }

                    $data = array_combine(array_values($header), $row);
                    if (!$data) {
                        continue;
                    }

                    $proponentName = trim($data['Name of the Business'] ?? '');
                    if (!$proponentName) {
                        $errors[] = "Row $rowIndex skipped: 'Name of the Business' is empty.";
                        Log::warning("CSV Sync - Row $rowIndex skipped: 'Name of the Business' is empty.");
                        continue;
                    }

                    $normalizedName = trim(preg_replace('/\s*\(\d+\)\s*$/', '', $proponentName));

                    $proponent = ProponentModel::where('company_name', $normalizedName)->first();
                    if (!$proponent) {
                        $errors[] = "Row $rowIndex skipped: No matching proponent found for '$proponentName' (normalized: '$normalizedName').";
                        Log::warning("CSV Sync - Row $rowIndex skipped: No proponent matched company_name='$normalizedName' (original: '$proponentName').");
                        continue;
                    }

                    $projectCode = preg_replace('/[^0-9]/', '', $data['Project Code'] ?? '');
                    if (empty($projectCode)) {
                        $errors[] = "Row $rowIndex skipped: 'Project Code' is empty or non-numeric (raw value: '".($data['Project Code'] ?? '')."').";
                        Log::warning("CSV Sync - Row $rowIndex skipped: Empty/non-numeric Project Code for proponent '$proponentName'.");
                        continue;
                    }

                    $projectId = (int) $projectCode;
                    if ($projectId === 0) {
                        $projectId = (int) (time().mt_rand(100, 999));
                    }

                    if (ProjectModel::where('project_id', $projectId)->exists()) {
                        Log::info("CSV Sync - Row $rowIndex skipped: Project ID $projectId already exists (proponent: '$proponentName').");
                        continue;
                    }

                    [$releaseInitial, $releaseEnd] = $this->splitMonthYear($data['Original Project Duration'] ?? '');
                    [$refundInitial, $refundEnd] = $this->splitMonthYear($data['Original Refund Schedule'] ?? '');
                    $fundRelease = $this->parseDateFormat($data['Date of Fund Release'] ?? '');

                    $projectCostRaw = str_replace([',', ' '], '', trim($data['Amount of DOST Assistance'] ?? '0'));
                    $projectCost = is_numeric($projectCostRaw) ? (float) $projectCostRaw : 0;

                    $counterpartRaw = str_replace([',', ' '], '', trim($data['Counterpart'] ?? '0'));
                    $counterpartCost = is_numeric($counterpartRaw) ? (float) $counterpartRaw : 0;

                    $releasedAmountRaw = str_replace([',', ' '], '', trim($data['Amount of Released Assistance'] ?? '0'));
                    $releasedAmount = is_numeric($releasedAmountRaw) ? (float) $releasedAmountRaw : 0;

                    $unexpendedBalanceRaw = str_replace([',', ' '], '', trim($data['Unexpended Balance'] ?? '0'));
                    $unexpendedBalance = is_numeric($unexpendedBalanceRaw) ? (float) $unexpendedBalanceRaw : 0;

                    $status = trim($data['Status of Implementation (On-Time, Delayed, Terminated, Graduated) . This is linked to Project Monitoring Database'] ?? '');
                    $progress = match ($status) {
                        'WITHDRAWN' => 'Withdrawn',
                        'TERMINATED' => 'Terminated',
                        'GRADUATED' => 'Completed',
                        default => 'Implementation',
                    };

                    if ($progress === 'Implementation' && $refundInitial && $refundEnd) {
                        $today = now()->startOfDay();
                        $refundStart = Carbon::parse($refundInitial)->startOfDay();
                        $refundFinish = Carbon::parse($refundEnd)->startOfDay();

                        if ($today->between($refundStart, $refundFinish)) {
                            $progress = 'Refund';
                        }
                    }

                    $project = ProjectModel::updateOrCreate(
                        ['project_id' => $projectId],
                        [
                            'project_title' => $data['Name of Project'] ?? null,
                            'proponent_id' => $proponent->proponent_id,
                            'release_initial' => $releaseInitial,
                            'release_end' => $releaseEnd,
                            'refund_initial' => $refundInitial,
                            'refund_end' => $refundEnd,
                            'fund_release' => $fundRelease,
                            'year_obligated' => $data['Year Obligated'] ?? null,
                            'added_by' => Auth::id() ?? 1,
                            'project_cost' => $projectCost,
                            'unexpended_balance' => $unexpendedBalance,
                            'counterpart' => $counterpartCost,
                            'released_amount' => $releasedAmount,
                            'progress' => $progress,
                            'revenue' => $this->sanitizeNumeric($data['Revenue (Before SETUP)'] ?? null),
                            'equity' => $this->sanitizeNumeric($data['Equity (Before SETUP)'] ?? null),
                            'liability' => $this->sanitizeNumeric($data['Liability (Before SETUP)'] ?? null),
                            'net_income' => $this->sanitizeNumeric($data['Net Income (Before SETUP)'] ?? null),
                            'current_asset' => $this->sanitizeNumeric($data['Current Asset (Before SETUP)'] ?? null),
                            'noncurrent_asset' => $this->sanitizeNumeric($data['Non-Current Asset (Before SETUP)'] ?? null),
                            'female' => $this->sanitizeNumeric($data['Female indirect employees'] ?? null),
                            'male' => $this->sanitizeNumeric($data['Male indirect employees'] ?? null),
                            'direct_male' => $this->sanitizeNumeric($data['Male direct Employees'] ?? null),
                            'direct_female' => $this->sanitizeNumeric($data['Female direct Employees'] ?? null),
                        ]
                    );

                    if (!ImplementationModel::where('project_id', $project->project_id)->exists() && $progress === 'Implementation') {
                        ImplementationModel::create([
                            'project_id' => $project->project_id,
                            'tarp' => null,
                            'pdc' => null,
                            'liquidation' => null,
                        ]);
                    }

                    $barangay = trim($data['Barangay'] ?? '');
                    $municipality = trim($data['Municipality'] ?? '');
                    $placeParts = array_filter([$barangay, $municipality]);
                    $placeName = implode(', ', $placeParts);

                    if ($placeName) {
                        $existingMarket = MarketModel::where('project_id', $project->project_id)
                            ->where('type', 'existing')
                            ->first();

                        if ($existingMarket) {
                            $existingMarket->place_name = $placeName;
                            $existingMarket->save();
                        } else {
                            MarketModel::create([
                                'project_id' => $project->project_id,
                                'place_name' => $placeName,
                                'type' => 'existing',
                            ]);
                        }
                    }

                    ++$newRecords;
                } catch (\Exception $e) {
                    $errors[] = "Row $rowIndex failed: ".$e->getMessage();
                }
            }

            fclose($stream);

            // One summary log for the entire projects sync
            $dummy = new ProjectModel();
            $dummy->manualLog(
                'Synced',
                "Synced {$newRecords} projects from CSV.".
                (!empty($errors) ? ' '.count($errors).' rows had errors.' : '')
            );

            // Run geo/objectives sync (manages its own disable/enable internally)
            $geoSummary = $this->syncGeoAndObjectivesFromCSV();
            $itemsSummary = $this->syncItemsFromCSV();

            $message = "$newRecords projects synced successfully.";
            if (!empty($errors)) {
                $message .= ' '.count($errors).' rows had errors.';
            }
            $message .= ' '.$geoSummary;
            $message .= ' '.$itemsSummary;

            return back()->with('success', $message);
        } catch (\Exception $e) {
            Log::error('Project CSV Sync failed: '.$e->getMessage());

            return back()->with('error', 'Sync failed: '.$e->getMessage());
        } finally {
            // Runs exactly once — restores logging whether sync succeeded or crashed
            ProjectModel::enableLogging();
            ImplementationModel::enableLogging();
            MarketModel::enableLogging();
        }
    }

    private function syncItemsFromCSV(): string
    {
        $csvUrl = env('ITEMS_CSV_URL');

        if (!$csvUrl) {
            return 'ITEMS_CSV_URL is not configured; items sync skipped.';
        }

        ItemModel::disableLogging();

        $newRecords = 0;
        $errors = [];

        try {
            $response = Http::timeout(300)->get($csvUrl);
            if (!$response->ok()) {
                Log::error('Failed to fetch Items CSV: '.$response->status());

                return 'Failed to fetch items CSV data.';
            }

            $stream = fopen('php://memory', 'r+');
            fwrite($stream, $response->body());
            rewind($stream);

            $rawHeader = fgetcsv($stream);
            if (!$rawHeader) {
                fclose($stream);

                return 'Items CSV contains no header.';
            }

            $header = [];
            foreach ($rawHeader as $key => $col) {
                $normalized = preg_replace('/\s+/', ' ', trim($col));
                if ($normalized !== '') {
                    $header[$key] = $normalized;
                }
            }

            $rowIndex = 1;

            while (($row = fgetcsv($stream)) !== false) {
                ++$rowIndex;
                try {
                    $row = array_pad(array_map('trim', $row), count($header), '');
                    if (count(array_filter($row)) === 0) {
                        continue;
                    }

                    $data = array_combine(array_values($header), $row);
                    if (!$data) {
                        continue;
                    }

                    // Resolve project
                    $projectCode = preg_replace('/[^0-9]/', '', $data['Project Code'] ?? '');
                    if (empty($projectCode)) {
                        $errors[] = "Row $rowIndex skipped: 'Project Code' is empty or non-numeric.";
                        Log::warning("Items CSV Sync - Row $rowIndex skipped: empty/non-numeric Project Code.");
                        continue;
                    }

                    $projectId = (int) $projectCode;
                    if (!ProjectModel::where('project_id', $projectId)->exists()) {
                        $errors[] = "Row $rowIndex skipped: No project found for Project Code '$projectCode'.";
                        Log::warning("Items CSV Sync - Row $rowIndex skipped: project_id=$projectId not found.");
                        continue;
                    }

                    $itemName = trim($data['Item Name'] ?? '');
                    if (!$itemName) {
                        $errors[] = "Row $rowIndex skipped: 'Item Name' is empty.";
                        Log::warning("Items CSV Sync - Row $rowIndex skipped: empty Item Name for project_id=$projectId.");
                        continue;
                    }

                    $quantityRaw = trim($data['Quantity'] ?? '');
                    $quantity = is_numeric($quantityRaw) ? (int) $quantityRaw : null;

                    $costRaw = str_replace([',', ' '], '', trim($data['Cost'] ?? '0'));
                    $itemCost = is_numeric($costRaw) ? (float) $costRaw : 0;

                    $specifications = trim($data['Specifications'] ?? '') ?: null;

                    $typeRaw = trim($data['Type'] ?? '');
                    $type = match ($typeRaw) {
                        'Equipment' => 'equipment',
                        'Non-Equipment' => 'nonequip',
                        default => 'equipment', // fallback if column is missing or unexpected value
                    };

                    // Skip exact duplicates (same project + item name + specs + qty)
                    $alreadyExists = ItemModel::where('project_id', $projectId)
                        ->where('item_name', $itemName)
                        ->where('specifications', $specifications)
                        ->where('quantity', $quantity)
                        ->exists();

                    if ($alreadyExists) {
                        Log::info("Items CSV Sync - Row $rowIndex skipped: duplicate item '$itemName' for project_id=$projectId.");
                        continue;
                    }

                    ItemModel::create([
                        'project_id' => $projectId,
                        'item_name' => $itemName,
                        'type' => $type,
                        'specifications' => $specifications,
                        'quantity' => $quantity,
                        'item_cost' => $itemCost,
                        'added_by' => Auth::id() ?? 1,
                        'report' => 'approved',
                    ]);

                    ++$newRecords;
                } catch (\Exception $e) {
                    $errors[] = "Row $rowIndex failed: ".$e->getMessage();
                    Log::error("Items CSV Sync - Row $rowIndex exception: ".$e->getMessage());
                }
            }

            fclose($stream);

            // One summary log for the entire items sync
            $dummy = new ItemModel();
            $dummy->manualLog(
                'Synced',
                "Synced {$newRecords} items from CSV.".
                (!empty($errors) ? ' '.count($errors).' rows had errors.' : '')
            );

            $summary = "$newRecords items synced successfully.";
            if (!empty($errors)) {
                $summary .= ' '.count($errors).' rows had errors.';
            }

            return $summary;
        } catch (\Exception $e) {
            Log::error('Items CSV Sync failed: '.$e->getMessage());

            return 'Items sync failed: '.$e->getMessage();
        } finally {
            ItemModel::enableLogging();
        }
    }
    // -------------------------------------------------------------------------

    private function syncGeoAndObjectivesFromCSV(): string
    {
        $csvUrl = env('PROJECT_GEO_CSV_URL');

        if (!$csvUrl) {
            return 'Geo sync skipped: PROJECT_GEO_CSV_URL is not configured.';
        }

        ProjectModel::disableLogging();
        ObjectiveModel::disableLogging();

        try {
            $response = Http::timeout(300)->get($csvUrl);
            if (!$response->ok()) {
                Log::error('Failed to fetch geo CSV: '.$response->status());

                return 'Geo sync failed: could not fetch CSV.';
            }

            $stream = fopen('php://memory', 'r+');
            fwrite($stream, $response->body());
            rewind($stream);

            $rawHeader = fgetcsv($stream);
            if (!$rawHeader) {
                return 'Geo sync failed: CSV has no header row.';
            }

            $header = array_map(fn ($col) => preg_replace('/\s+/', ' ', trim($col)), $rawHeader);

            $colTitle = $this->findColumnIndex($header, ['Project Title', 'Name of Project', 'Project Name']);
            $colLat = $this->findColumnIndex($header, ['Latitude', 'Lat']);
            $colLng = $this->findColumnIndex($header, ['Longitude', 'Long', 'Lng']);
            $colObjectives = $this->findColumnIndex($header, ['Objectives', 'Objective', 'Project Objectives']);

            if ($colTitle === null) {
                return 'Geo sync failed: no "Project Title" column found. Headers: '.implode(', ', $header);
            }

            $updatedProjects = 0;
            $skippedRows = 0;
            $objectivesAdded = 0;
            $errors = [];
            $rowIndex = 1;

            while (($row = fgetcsv($stream)) !== false) {
                ++$rowIndex;
                // ↑ No try/finally here — enableLogging() must NOT fire per row
                try {
                    $row = array_map('trim', $row);
                    if (count(array_filter($row)) === 0) {
                        continue;
                    }

                    $projectTitle = $row[$colTitle] ?? '';
                    if (empty($projectTitle)) {
                        ++$skippedRows;
                        continue;
                    }

                    $project = ProjectModel::whereRaw(
                        'LOWER(TRIM(project_title)) = ?',
                        [strtolower(trim($projectTitle))]
                    )->first();

                    if (!$project) {
                        Log::warning("Geo CSV row $rowIndex: No project found for title \"{$projectTitle}\"");
                        ++$skippedRows;
                        continue;
                    }

                    $updateData = [];

                    if ($colLat !== null && ($row[$colLat] ?? '') !== '') {
                        $lat = $this->sanitizeNumeric($row[$colLat]);
                        if ($lat !== null && $lat >= -90 && $lat <= 90) {
                            $updateData['latitude'] = $lat;
                        } else {
                            $errors[] = "Row $rowIndex: invalid latitude \"{$row[$colLat]}\" for \"{$projectTitle}\"";
                        }
                    }

                    if ($colLng !== null && ($row[$colLng] ?? '') !== '') {
                        $lng = $this->sanitizeNumeric($row[$colLng]);
                        if ($lng !== null && $lng >= -180 && $lng <= 180) {
                            $updateData['longitude'] = $lng;
                        } else {
                            $errors[] = "Row $rowIndex: invalid longitude \"{$row[$colLng]}\" for \"{$projectTitle}\"";
                        }
                    }

                    if (!empty($updateData)) {
                        $project->update($updateData);
                        ++$updatedProjects;
                    }

                    if ($colObjectives !== null && ($row[$colObjectives] ?? '') !== '') {
                        $lines = preg_split('/\r\n|\r|\n/', $row[$colObjectives]);

                        foreach ($lines as $line) {
                            $detail = trim($line);
                            if (empty($detail)) {
                                continue;
                            }

                            $alreadyExists = ObjectiveModel::where('project_id', $project->project_id)
                                ->where('details', $detail)
                                ->where('report', 'approved')
                                ->exists();

                            if (!$alreadyExists) {
                                ObjectiveModel::create([
                                    'project_id' => $project->project_id,
                                    'details' => $detail,
                                    'report' => 'approved',
                                ]);
                                ++$objectivesAdded;
                            }
                        }
                    }
                } catch (\Exception $e) {
                    $errors[] = "Row $rowIndex failed: ".$e->getMessage();
                    Log::error("Geo CSV row $rowIndex error: ".$e->getMessage());
                }
            }

            fclose($stream);

            // One summary log for the geo/objectives sync
            $dummy = new ProjectModel();
            $dummy->manualLog(
                'Synced',
                "Geo sync: {$updatedProjects} project(s) updated, {$objectivesAdded} objective(s) added, {$skippedRows} skipped.".
                (!empty($errors) ? ' '.count($errors).' rows had errors.' : '')
            );

            if (!empty($errors)) {
                Log::warning('Geo CSV sync had errors', ['errors' => $errors]);
            }

            return "Geo sync: {$updatedProjects} project(s) updated, {$objectivesAdded} objective(s) added, {$skippedRows} skipped.";
        } catch (\Exception $e) {
            Log::error('Geo CSV sync failed: '.$e->getMessage());

            return 'Geo sync failed: '.$e->getMessage();
        } finally {
            // Runs exactly once — restores logging whether geo sync succeeded or crashed
            ProjectModel::enableLogging();
            ObjectiveModel::enableLogging();
        }
    }

    private function findColumnIndex(array $header, array $candidates): ?int
    {
        $lowerHeader = array_map('strtolower', $header);
        foreach ($candidates as $candidate) {
            $idx = array_search(strtolower($candidate), $lowerHeader);
            if ($idx !== false) {
                return (int) $idx;
            }
        }

        return null;
    }

    private function parseMonthYear($part)
    {
        if (!$part) {
            return null;
        }
        $part = strtoupper(trim($part));
        try {
            if (strpos($part, ' ') !== false && strpos($part, ',') === false) {
                return Carbon::createFromFormat('M Y', $part)->startOfMonth()->format('Y-m-d');
            }
            if (strpos($part, ',') !== false) {
                $pieces = explode(',', $part);

                return Carbon::createFromFormat('M Y', trim($pieces[0]).' '.trim($pieces[1]))->startOfMonth()->format('Y-m-d');
            }

            return Carbon::createFromFormat('M Y', $part)->startOfMonth()->format('Y-m-d');
        } catch (\Exception $e) {
            try {
                return Carbon::createFromFormat('F Y', ucwords(strtolower($part)))->startOfMonth()->format('Y-m-d');
            } catch (\Exception $e) {
                return null;
            }
        }
    }

    private function parseDateFormat($value)
    {
        if (!$value) {
            return null;
        }
        $value = trim($value);
        try {
            if (strpos($value, '-') !== false) {
                $parts = explode('-', $value);
                $value = trim($parts[0]);
            }
            if (strpos($value, ',') !== false) {
                $pieces = explode(',', $value);

                return Carbon::createFromFormat('M Y', trim($pieces[0]).' '.trim($pieces[1]))->format('Y-m-d');
            }

            return Carbon::createFromFormat('F d, Y', $value)->format('Y-m-d');
        } catch (\Exception $e) {
            try {
                return Carbon::parse($value)->format('Y-m-d');
            } catch (\Exception $e) {
                return null;
            }
        }
    }

    private function splitMonthYear($value)
    {
        if (!$value) {
            return [null, null];
        }
        $parts = preg_split('/\s*-\s*/', trim($value));

        return [$this->parseMonthYear(trim($parts[0] ?? '')), $this->parseMonthYear(trim($parts[1] ?? ''))];
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
            return Inertia::render('Projects/ProjectList', ['projects' => collect()]);
        }

        $query = ProjectModel::with(['proponent', 'items' => fn ($q) => $q->where('report', 'approved')]);

        if ($user->role === 'user') {
            $proponentIds = ProponentModel::where('added_by', $user->user_id)->pluck('proponent_id');
            $query->whereIn('proponent_id', $proponentIds);
        } elseif ($user->role === 'staff') {
            $query->whereHas('proponent', fn ($q) => $q->where('office_id', $user->office_id));
        }

        return Inertia::render('Projects/ProjectList', ['projects' => $query->get()]);
    }

    // FIXED: Added authorization check for delete
    public function destroy($id)
    {
        $user = Auth::user();

        // ✅ SECURITY FIX: Only RPMO can delete projects
        if ($user->role !== 'rpmo') {
            return back()->with('error', 'Unauthorized: Only RPMO can delete projects.');
        }

        ProjectModel::findOrFail($id)->delete();

        return redirect('/projects')->with('success', 'Project deleted successfully.');
    }
}
