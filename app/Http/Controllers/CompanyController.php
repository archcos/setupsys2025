<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use App\Models\CompanyModel;
use App\Models\OfficeModel;
use App\Models\UserModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CompanyController extends Controller
{
    
public function index(Request $request)
{
    $user = Auth::user();

    $query = CompanyModel::with(['office', 'addedByUser'])->withCount('projects');

    // Get all users sorted alphabetically
    $allUsers = UserModel::select('user_id', 'first_name', 'last_name')
        ->orderBy('first_name')
        ->orderBy('last_name')
        ->get();

    // Get all offices for filter dropdown
    $allOffices = OfficeModel::select('office_id', 'office_name')
        ->orderBy('office_name')
        ->get();

    // Role-based filtering
    if ($user->role === 'user') {
        $query->where('added_by', $user->user_id);
    } elseif ($user->role === 'staff') {
        $query->where('office_id', $user->office_id);
    }

    // Search (now includes products)
    if ($request->has('search') && $request->search) {
        $search = $request->search;
        $query->where(function ($q) use ($search) {
            $q->where('company_name', 'like', "%$search%")
              ->orWhere('owner_name', 'like', "%$search%")
              ->orWhere('email', 'like', "%$search%")
              ->orWhere('street', 'like', "%$search%")
              ->orWhere('barangay', 'like', "%$search%")
              ->orWhere('municipality', 'like', "%$search%")
              ->orWhere('province', 'like', "%$search%")
              ->orWhere('products', 'like', "%$search%");
        });
    }

    // Filter by office
    if ($request->has('office') && $request->office) {
        $query->where('office_id', $request->office);
    }

    // Filter by industry type
    if ($request->has('industry_type') && $request->industry_type) {
        $query->where('industry_type', $request->industry_type);
    }

    // Filter by setup industry (case-insensitive)
    if ($request->filled('setup_industry')) {
        $query->whereRaw('LOWER(setup_industry) = LOWER(?)', [$request->setup_industry]);
    }

    // Sorting
    $sortField = $request->input('sort', 'company_id');
    $sortDirection = $request->input('direction', 'desc');

    $allowedSorts = ['company_id', 'company_name', 'owner_name', 'email', 'industry_type', 'setup_industry', 'created_at'];
    if (!in_array($sortField, $allowedSorts)) {
        $sortField = 'company_id';
    }

    $sortDirection = in_array($sortDirection, ['asc', 'desc']) ? $sortDirection : 'asc';
    $query->orderBy($sortField, $sortDirection);

    $perPage = $request->input('perPage', 10);
    $companies = $query->paginate($perPage)->withQueryString();
    $availableYears = \App\Models\ProjectModel::select('year_obligated')
    ->whereNotNull('year_obligated')
    ->distinct()
    ->orderBy('year_obligated', 'desc')
    ->pluck('year_obligated');

    return Inertia::render('Companies/Index', [
        'companies' => $companies,
        'filters' => $request->only('search', 'perPage', 'office', 'industry_type', 'setup_industry', 'sort', 'direction'),
        'allUsers' => $user->role === 'rpmo' ? $allUsers : null,
        'allOffices' => $allOffices,
        'canEditAddedBy' => $user->role === 'rpmo',
        'userRole' => $user->role, // Pass user role to frontend
        'availableYears' => $availableYears,
    ]);
}

public function updateAddedBy(Request $request, $id)
{
    // Check authorization - only rpmo can change added_by
    if (Auth::user()->role !== 'rpmo') {
        return back()->with('error', 'Unauthorized to change Added By user.');
    }

    $request->validate([
        'added_by' => 'required|exists:tbl_users,user_id',
    ]);

    $company = CompanyModel::findOrFail($id);
    $oldUser = $company->addedByUser->name;
    $newUser = UserModel::find($request->added_by)->name;
    
    $company->update(['added_by' => $request->added_by]);

    Log::info("Company '{$company->company_name}' added_by changed from {$oldUser} to {$newUser}");

    return back()->with('success', "Added By updated from {$oldUser} to {$newUser}.");
}


public function create()
{
    return Inertia::render('Companies/Create');
}

public function store(Request $request)
{
    $validated = $request->validate([
        'company_name'     => 'nullable|string|max:254',
        'owner_name'       => 'nullable|string|max:254',
        'email'            => 'nullable|email|max:100',
        'street'           => 'nullable|string|max:100',
        'barangay'         => 'nullable|string|max:50',
        'municipality'     => 'nullable|string|max:50',
        'province'         => 'nullable|string|max:30',
        'district'         => 'nullable|string|max:45',
        'sex'              => 'nullable|in:Male,Female',
        'products'         => 'nullable|string',
        'setup_industry'   => 'nullable|string|max:150',
        'industry_type'    => 'nullable|string|max:10',
        'contact_number'   => 'nullable|digits_between:11,11|regex:/^09[0-9]{9}$/',
        // 'current_market'   => 'nullable|string|max:100',
    ]);

    $user = Auth::user();
    $validated['added_by']  = $user->user_id;
    $validated['office_id'] = $user->office_id;

    if ($user->role === 'user') {
        $count = CompanyModel::where('added_by', $user->user_id)->count();
        if ($count >= 5) {
            return back()->with('error', 'You have reached the maximum limit of 5 proponents.');
        }
    }


    CompanyModel::create($validated);

    return redirect()->route('proponents.index')->with('success', 'Company added successfully.');
}

public function export(Request $request)
{
    $user = Auth::user();

    $query = CompanyModel::with(['office', 'addedByUser', 'projects']);

    // Role-based filtering
    if ($user->role === 'user') {
        $query->where('added_by', $user->user_id);
    } elseif ($user->role === 'staff') {
        $query->where('office_id', $user->office_id);
    }

    // Filter by year (supports multiple)
    if ($request->filled('year')) {
        $years = (array) $request->input('year');
        $query->whereHas('projects', function ($q) use ($years) {
            $q->whereIn('year_obligated', $years);
        });
    }

    // Filter by office (supports multiple)
    if ($request->filled('office')) {
        $offices = (array) $request->input('office');
        $query->whereIn('office_id', $offices);
    }

    // Filter by industry type (supports multiple)
    if ($request->filled('industry_type')) {
        $types = (array) $request->input('industry_type');
        $query->whereIn('industry_type', $types);
    }

    // Filter by setup industry (supports multiple, case-insensitive)
    if ($request->filled('setup_industry')) {
        $industries = (array) $request->input('setup_industry');
        $query->where(function ($q) use ($industries) {
            foreach ($industries as $industry) {
                $q->orWhereRaw('LOWER(setup_industry) = LOWER(?)', [$industry]);
            }
        });
    }

    $companies = $query->orderBy('company_name')->get();

    $filename = 'proponents_' . now()->format('Ymd_His') . '.csv';

    $headers = [
        'Content-Type'        => 'text/csv',
        'Content-Disposition' => "attachment; filename=\"$filename\"",
        'Pragma'              => 'no-cache',
        'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
        'Expires'             => '0',
    ];

    $callback = function () use ($companies) {
        $handle = fopen('php://output', 'w');

        fputcsv($handle, [
            'ID',
            'Company Name',
            'Owner Name',
            'Email',
            'Contact Number',
            'Street',
            'Barangay',
            'Municipality',
            'Province',
            'District',
            'Sex',
            'Industry Type',
            'Setup Industry',
            'Products',
            'Office',
            'Added By',
            'Project Years',
        ]);

        foreach ($companies as $company) {
            // Collect all unique year_obligated values for this company's projects
            $projectYears = $company->projects
                ->pluck('year_obligated')
                ->filter()
                ->unique()
                ->sort()
                ->implode(', ');

            fputcsv($handle, [
                $company->company_id,
                $company->company_name,
                $company->owner_name,
                $company->email,
                $company->contact_number,
                $company->street,
                $company->barangay,
                $company->municipality,
                $company->province,
                $company->district,
                $company->sex,
                $company->industry_type,
                $company->setup_industry,
                $company->products,
                $company->office?->office_name,
                $company->addedByUser?->first_name . ' ' . $company->addedByUser?->last_name,
                $projectYears,
            ]);
        }

        fclose($handle);
    };

    return response()->stream($callback, 200, $headers);
}


public function syncFromCSV()
{
    $csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQoYM37FSpNPcliFztgpSVgglK0XyoDLSdhOftcdqmy2mV-83VVxuUf9EdcE57gFG36r06rwH66CZQO/pub?gid=0&single=true&output=csv';
    
    try {
        $response = Http::timeout(300)->get($csvUrl);
        if (!$response->ok()) {
            Log::error('Failed to fetch CSV: ' . $response->status());
            return back()->with('error', 'Failed to fetch CSV data.');
        }

        // Use fgetcsv for proper CSV parsing (handles commas in quoted fields)
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
        foreach ($rawHeader as $key => $col) {
            $trimmed = trim($col);
            // Normalize whitespace (handle newlines in headers)
            $normalized = preg_replace('/\s+/', ' ', $trimmed);
            if ($normalized !== '') {
                $header[$key] = $normalized;
            }
        }

        Log::info('CSV Headers loaded: ' . count($header) . ' columns');

        $newRecords = 0;
        $rowIndex = 1;

        $officeMap = [
            'BUK'            => 2, // 2-BUK
            'CAM'            => 3, // 3-CAM
            'LDN'            => 4, // 4-LDN
            'MOC'            => 5, // 5-MOC
            'MOR'            => 6, // 6-MOR
        ];

        // Read data rows
        while (($row = fgetcsv($stream)) !== false) {
            $rowIndex++;
            
            $row = array_map('trim', $row);
            $row = array_pad($row, count($header), '');

            if (count(array_filter($row)) === 0) {
                continue;
            }

            $data = array_combine(array_values($header), $row);
            if (!$data) {
                Log::warning("Malformed row $rowIndex", ['row_count' => count($row), 'header_count' => count($header)]);
                continue;
            }

            $company_name = trim($data['Name of the Business'] ?? '');
            if (!$company_name) {
                Log::warning("Skipping row $rowIndex: Missing business name");
                continue;
            }

            $exists = CompanyModel::where('company_name', $company_name)->first();
            if ($exists) {
                Log::info("Skipped row $rowIndex existing company: $company_name");
                continue;
            }

            // Determine office_id based on province
            $provinceName = $data['Province'] ?? null;
            $officeId = $officeMap[$provinceName] ?? (session('office_id') ?? 1);

            try {
                CompanyModel::create([
                    'company_name'     => $company_name,
                    'owner_name'       => $data['CEO'] ?? null,
                    'email'            => $data['Email'] ?? null,
                    'added_by'         => session('user_id') ?? 1,
                    'office_id'        => $officeId,
                    'street'           => $data["Bldg. No/Street/Subd."] ?? null,
                    'barangay'         => $data['Barangay'] ?? null,
                    'municipality'     => $data['Municipality'] ?? null,
                    'province'         => $provinceName,
                    'district'         => $data['District'] ?? null,
                    'sex'              => $data['Sex'] ?? null,
                    'products'         => $data['Products'] ?? null,
                    'setup_industry'   => (function($val) {
                        if (is_null($val)) return null;
                        return (strtolower(trim($val)) === 'food processing') ? 'Food Processing' : $val;
                    })($data['SETUP Industry Sector'] ?? null),                    
                    'industry_type'    => $data['Type of Enterprise'] ?? null,
                    'contact_number'   => $data['Contact number'] ?? null,
                ]);
                $newRecords++;
                Log::info("Row $rowIndex: Inserted $company_name (office_id={$officeId})");
            } catch (\Exception $e) {
                Log::error("Row $rowIndex failed: " . $e->getMessage(), ['row' => $data]);
                continue;
            }
        }

        fclose($stream);

        Log::info("Company CSV sync complete. Total new: $newRecords");
        return back()->with('success', "$newRecords companies synced.");
    } catch (\Exception $e) {
        Log::error('Company CSV Sync failed: ' . $e->getMessage());
        return back()->with('error', 'Sync failed. Please try again.');
    }
}


public function edit($id)
{
    $company = CompanyModel::findOrFail($id);

    return Inertia::render('Companies/Edit', [
        'company' => $company,
    ]);
}

public function update(Request $request, $id)
{
    $validated = $request->validate([
        'company_name'     => 'nullable|string|max:254',
        'owner_name'       => 'nullable|string|max:254',
        'email'            => 'nullable|email|max:100',
        'street'           => 'nullable|string|max:100',
        'barangay'         => 'nullable|string|max:50',
        'municipality'     => 'nullable|string|max:50',
        'province'         => 'nullable|string|max:30',
        'district'         => 'nullable|string|max:45',
        'sex'              => 'nullable|in:Male,Female',
        'products'         => 'nullable|string',
        'setup_industry'   => 'nullable|string|max:150',
        'industry_type'    => 'nullable|string|max:10',
        'contact_number'   => 'nullable|digits_between:11,11|regex:/^09[0-9]{9}$/',
        // 'current_market'   => 'nullable|string|max:100',
    ]);

    $company = CompanyModel::findOrFail($id);
    $company->update($validated);

    return redirect()->route('proponents.index')->with('success', 'Company updated successfully.');
}


public function destroy($id)
{
    $company = CompanyModel::withCount('projects')->findOrFail($id);

    if ($company->projects_count > 0) {
        return back()->with('error', 'Cannot delete this proponent because it has associated projects.');
    }

    $company->delete();

    return redirect()->route('proponents.index')->with('success', 'Company deleted successfully.');
}
}