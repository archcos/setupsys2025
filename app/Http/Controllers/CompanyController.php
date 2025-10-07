<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use App\Models\CompanyModel;
use App\Models\UserModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CompanyController extends Controller
{
    
public function index(Request $request)
{
    $userId = session('user_id');
    $user = UserModel::where('user_id', $userId)->first();

    $query = CompanyModel::with(['office', 'addedByUser']);

    // Get all users sorted alphabetically (by first name then last name)
    $allUsers = UserModel::select('user_id', 'first_name', 'last_name')
        ->orderBy('first_name')
        ->orderBy('last_name')
        ->get();


    // Role-based filtering
    if ($user->role === 'user') {
        $query->where('added_by', $user->user_id);
    } elseif ($user->role === 'staff') {
        $query->where('office_id', $user->office_id);
    }

    // Search
    if ($request->has('search')) {
        $search = $request->search;
        $query->where(function ($q) use ($search) {
            $q->where('company_name', 'like', "%$search%")
              ->orWhere('owner_name', 'like', "%$search%")
              ->orWhere('email', 'like', "%$search%")
              ->orWhere('street', 'like', "%$search%")
              ->orWhere('barangay', 'like', "%$search%")
              ->orWhere('municipality', 'like', "%$search%")
              ->orWhere('province', 'like', "%$search%");
        });
    }

    $perPage = $request->input('perPage', 10); // default to 10

    $companies = $query->orderBy('company_name')->paginate($perPage)->withQueryString();

    return Inertia::render('Companies/Index', [
        'companies' => $companies,
        'filters' => $request->only('search', 'perPage'),
        'allUsers' => $user->role === 'head' ? $allUsers : null,

    ]);
}

public function updateAddedBy(Request $request, $id)
{
    $request->validate([
        'added_by' => 'required|exists:tbl_users,user_id',
    ]);

    $company = CompanyModel::findOrFail($id);
    $company->update(['added_by' => $request->added_by]);

    return back()->with('success', 'Added By updated successfully.');
}


public function create()
{
    return Inertia::render('Companies/Create');
}
public function store(Request $request)
{
    $validated = $request->validate([
        'company_name'     => 'required|string|max:255',
        'owner_name'       => 'required|string|max:255',
        'email'            => 'nullable|email|max:255',
        'street'           => 'required|string|max:255',
        'barangay'         => 'required|string|max:255',
        'municipality'     => 'required|string|max:255',
        'province'         => 'required|string|max:255',
        'district'         => 'required|string|max:255',
        'sex'              => 'required|in:Male,Female',
        'products'         => 'required|string|max:255',
        'setup_industry'   => 'required|string|max:255',
        'industry_type'    => 'required|in:MICRO,SMALL,MEDIUM',
        'female'           => 'required|integer|min:0',
        'male'             => 'required|integer|min:0',
        'direct_male'      => 'required|integer|min:0',
        'direct_female'    => 'required|integer|min:0',
        'contact_number'   => 'required|string|max:20',
    ]);

    $user = UserModel::where('user_id', session('user_id'))->first();
    $validated['added_by']  = $user->user_id;
    $validated['office_id'] = $user->office_id;

    CompanyModel::create($validated);

    return redirect()->route('companies.index')->with('success', 'Company added successfully.');
}


public function syncFromCSV()
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

        $officeMap = [
            'BUK'            => 2, // 2-BUK
            'CAM'            => 3, // 3-CAM
            'LDN'     => 4, // 4-LDN
            'MOC'  => 5, // 5-MOC
            'MOR'    => 6, // 6-MOR
        ];

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

            $yearObligated = $data['Year Obligated'] ?? null;
            if (!in_array($yearObligated, ['2023', '2024', '2025'])) {
                continue;
            }

            $company_name = trim($data['Name of the Business'] ?? '');
            if (!$company_name) {
                Log::warning("Skipping row $rowIndex: Missing business name");
                continue;
            }

            $exists = CompanyModel::where('company_name', $company_name)->first();
            if ($exists) {
                Log::info("Skipped existing company: $company_name");
                continue;
            }

            // Determine office_id based on province
            $provinceName = $data['Province'] ?? null;
            $officeId = $officeMap[$provinceName] ?? (session('office_id') ?? 1);

            // Parse integer fields
            $intFields = [
                'Female indirect employees' => 'female',
                'Male indirect employees' => 'male',
                'Male direct Employees' => 'direct_male',
                'Female direct Employees' => 'direct_female'
            ];

            $parsed = [];
            foreach ($intFields as $csvKey => $dbField) {
                $parsed[$dbField] = isset($data[$csvKey]) && is_numeric($data[$csvKey]) ? (int) $data[$csvKey] : 0;
            }

            try {
                CompanyModel::create([
                    'company_name'     => $company_name,
                    'owner_name'       => $data['CEO'] ?? null,
                    'email'            => $data['Email'] ?? null,
                    'added_by'         => session('user_id') ?? 1,
                    'office_id'        => $officeId, // <-- office_id based on province
                    'street'           => $data["Bldg. No/Street/Subd."] ?? null,
                    'barangay'         => $data['Barangay'] ?? null,
                    'municipality'     => $data['Municipality'] ?? null,
                    'province'         => $provinceName,
                    'district'         => $data['District'] ?? null,
                    'sex'              => $data['Sex'] ?? null,
                    'products'         => $data['Products'] ?? null,
                    'setup_industry'   => $data['SETUP Industry Sector'] ?? null,
                    'industry_type'    => $data['Type of Enterprise'] ?? null,
                    'female'           => $parsed['female'],
                    'male'             => $parsed['male'],
                    'direct_male'      => $parsed['direct_male'],
                    'direct_female'    => $parsed['direct_female'],
                    'contact_number'   => $data['Contact number'] ?? null,
                ]);
                $newRecords++;
                Log::info("Inserted: $company_name (office_id={$officeId})");
            } catch (\Exception $e) {
                Log::error("Row $rowIndex failed: " . $e->getMessage(), ['row' => $data]);
                continue;
            }
        }


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
        'company_name'     => 'required|string|max:255',
        'owner_name'       => 'required|string|max:255',
        'email'            => 'nullable|email|max:255',
        'street'           => 'required|string|max:255',
        'barangay'         => 'required|string|max:255',
        'municipality'     => 'required|string|max:255',
        'province'         => 'required|string|max:255',
        'district'         => 'required|string|max:255',
        'sex'              => 'required|in:Male,Female',
        'products'         => 'required|string|max:255',
        'setup_industry'   => 'required|string|max:255',
        'industry_type'    => 'required|string|max:255',
        'female'           => 'required|integer|min:0',
        'male'             => 'required|integer|min:0',
        'direct_male'      => 'required|integer|min:0',
        'direct_female'    => 'required|integer|min:0',
        'contact_number'   => 'required|string|max:20',
    ]);

    $company = CompanyModel::findOrFail($id);
    $company->update($validated);

    return redirect()->route('companies.index')->with('success', 'Company updated.');
}



    /**
     * Remove the specified resource from storage.
     */
public function destroy($id)
{
    $company = CompanyModel::findOrFail($id);
    $company->delete();

    return redirect()->route('companies.index')->with('success', 'Company deleted successfully.');
}
}
