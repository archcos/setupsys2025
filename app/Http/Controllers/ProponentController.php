<?php

namespace App\Http\Controllers;

use App\Models\OfficeModel;
use App\Models\ProponentModel;
use App\Models\UserModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ProponentController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = ProponentModel::with(['office', 'addedByUser'])->withCount('projects');

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
        $sortField = $request->input('sort', 'proponent_id');
        $sortDirection = $request->input('direction', 'desc');

        $allowedSorts = ['proponent_id', 'company_name', 'owner_name', 'email', 'industry_type', 'setup_industry', 'created_at'];
        if (!in_array($sortField, $allowedSorts)) {
            $sortField = 'proponent_id';
        }

        $sortDirection = in_array($sortDirection, ['asc', 'desc']) ? $sortDirection : 'asc';
        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->input('perPage', 10);
        $proponents = $query->paginate($perPage)->withQueryString();
        $availableYears = \App\Models\ProjectModel::select('year_obligated')
        ->whereNotNull('year_obligated')
        ->distinct()
        ->orderBy('year_obligated', 'desc')
        ->pluck('year_obligated');

        return Inertia::render('Proponents/Index', [
            'proponents' => $proponents,
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

        $proponent = ProponentModel::findOrFail($id);
        $oldUser = $proponent->addedByUser->name;
        $newUser = UserModel::find($request->added_by)->name;

        $proponent->update(['added_by' => $request->added_by]);

        return back()->with('success', "Added By updated from {$oldUser} to {$newUser}.");
    }

    public function create()
    {
        return Inertia::render('Proponents/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'nullable|string|max:254',
            'owner_name' => 'nullable|string|max:254',
            'email' => 'nullable|email|max:100',
            'street' => 'nullable|string|max:100',
            'barangay' => 'nullable|string|max:50',
            'municipality' => 'nullable|string|max:50',
            'province' => 'nullable|string|max:30',
            'district' => 'nullable|string|max:45',
            'sex' => 'nullable|in:Male,Female',
            'products' => 'nullable|string',
            'setup_industry' => 'nullable|string|max:150',
            'industry_type' => 'nullable|string|max:10',
            'contact_number' => 'nullable|digits_between:11,11|regex:/^09[0-9]{9}$/',
            // 'current_market'   => 'nullable|string|max:100',
        ]);

        $user = Auth::user();
        $validated['added_by'] = $user->user_id;
        $validated['office_id'] = $user->office_id;

        if ($user->role === 'user') {
            $count = ProponentModel::where('added_by', $user->user_id)->count();
            if ($count >= 5) {
                return back()->with('error', 'You have reached the maximum limit of 5 proponents.');
            }
        }

        ProponentModel::create($validated);

        return redirect()->route('proponents.index')->with('success', 'proponent added successfully.');
    }

    public function export(Request $request)
    {
        $user = Auth::user();

        $query = ProponentModel::with(['office', 'addedByUser', 'projects']);

        // Role-based filtering
        if ($user->role === 'user') {
            $query->where('added_by', $user->user_id);
        } elseif ($user->role === 'staff') {
            $query->where('office_id', $user->office_id); // Staff locked to their office
        }
        // rpmo sees all - no filtering

        // Filter by year (supports multiple)
        if ($request->filled('year')) {
            $years = (array) $request->input('year');
            $query->whereHas('projects', function ($q) use ($years) {
                $q->whereIn('year_obligated', $years);
            });
        }

        // Filter by office (supports multiple) - but respect role restrictions
        if ($request->filled('office')) {
            $offices = (array) $request->input('office');

            // Staff can only filter within their own office
            if ($user->role === 'staff') {
                $offices = array_intersect($offices, [$user->office_id]);
            }

            if (!empty($offices)) {
                $query->whereIn('office_id', $offices);
            }
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

        $proponents = $query->orderBy('company_name')->get();

        $filename = 'proponents_'.now()->format('Ymd_His').'.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($proponents) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'ID',
                'proponent Name',
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

            foreach ($proponents as $proponent) {
                // Collect all unique year_obligated values for this proponent's projects
                $projectYears = $proponent->projects
                    ->pluck('year_obligated')
                    ->filter()
                    ->unique()
                    ->sort()
                    ->implode(', ');

                fputcsv($handle, [
                    $proponent->proponent_id,
                    $proponent->company_name,
                    $proponent->owner_name,
                    $proponent->email,
                    $proponent->contact_number,
                    $proponent->street,
                    $proponent->barangay,
                    $proponent->municipality,
                    $proponent->province,
                    $proponent->district,
                    $proponent->sex,
                    $proponent->industry_type,
                    $proponent->setup_industry,
                    $proponent->products,
                    $proponent->office?->office_name,
                    $proponent->addedByUser?->first_name.' '.$proponent->addedByUser?->last_name,
                    $projectYears,
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function syncFromCSV()
    {
        $user = Auth::user();

        if (!$user || $user->role !== 'rpmo') {
            return back()->with('error', 'Unauthorized: Only RPMO can sync projects from CSV.');
        }

        $csvUrl = env('PROPONENT_CSV_URL');

        if (!$csvUrl) {
            return back()->with('error', 'PROPONENT_CSV_URL is not configured.');
        }

        ProponentModel::disableLogging();

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
                Log::warning('CSV contains no header.');

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
            $updatedRecords = 0;
            $rowIndex = 1;

            $officeMap = [
                'BUK' => 2,
                'CAM' => 3,
                'LDN' => 4,
                'MOC' => 5,
                'MOR' => 6,
            ];

            $provinceNameMap = [
                'BUK' => 'Bukidnon',
                'CAM' => 'Camiguin',
                'LDN' => 'Lanao Del Norte',
                'MOC' => 'Misamis Occidental',
                'MOR' => 'Misamis Oriental',
            ];

            while (($row = fgetcsv($stream)) !== false) {
                ++$rowIndex;

                $row = array_map('trim', $row);
                $row = array_pad($row, count($header), '');

                if (count(array_filter($row)) === 0) {
                    continue;
                }

                $data = array_combine(array_values($header), $row);
                if (!$data) {
                    Log::warning("Malformed row $rowIndex", [
                        'row_count' => count($row),
                        'header_count' => count($header),
                    ]);
                    continue;
                }

                $company_name = trim($data['Name of the Business'] ?? '');
                if (!$company_name) {
                    Log::warning("Skipping row $rowIndex: Missing business name");
                    continue;
                }

                $normalizedName = trim(preg_replace('/\s*\(\d+\)\s*$/', '', $company_name));
                $isUpdated = (bool) preg_match('/\s*\(\d+\)\s*$/', $company_name);

                $provinceName = $provinceNameMap[$data['Province'] ?? ''] ?? ($data['Province'] ?? null);
                $officeId = $officeMap[$data['Province'] ?? ''] ?? $user->office_id;

                try {
                    $proponent = ProponentModel::updateOrCreate(
                        ['company_name' => $normalizedName],
                        [
                            'owner_name' => $data['CEO'] ?? null,
                            'email' => $data['Email'] ?? null,
                            'added_by' => Auth::id(),
                            'office_id' => $officeId,
                            'street' => $data['Bldg. No/Street/Subd.'] ?? null,
                            'barangay' => $data['Barangay'] ?? null,
                            'municipality' => $data['Municipality'] ?? null,
                            'province' => $provinceName,
                            'district' => $data['District'] ?? null,
                            'sex' => $data['Sex'] ?? null,
                            'products' => $data['Products'] ?? null,
                            'setup_industry' => (function ($val) {
                                if (is_null($val)) {
                                    return null;
                                }

                                return strtolower(trim($val)) === 'food processing' ? 'Food Processing' : $val;
                            })($data['SETUP Industry Sector'] ?? null),
                            'industry_type' => $data['Type of Enterprise'] ?? null,
                            'contact_number' => $data['Contact number'] ?? null,
                        ]
                    );

                    if ($proponent->wasRecentlyCreated) {
                        ++$newRecords;
                    } elseif ($isUpdated) {
                        ++$updatedRecords;
                    } else {
                    }
                } catch (\Exception $e) {
                    Log::error("Row $rowIndex failed: ".$e->getMessage(), ['row' => $data]);
                }
                // ↑ No finally here — enableLogging() must NOT be called per row
            }

            fclose($stream);

            // One summary log entry for the entire sync
            $dummy = new ProponentModel();
            $dummy->manualLog(
                'Synced',
                "Synced {$newRecords} new and {$updatedRecords} updated proponents from CSV."
            );

            return back()->with('success', "{$newRecords} proponents synced, {$updatedRecords} updated.");
        } catch (\Exception $e) {
            Log::error('Proponent CSV Sync failed: '.$e->getMessage());

            return back()->with('error', 'Sync failed. Please try again.');
        } finally {
            // Runs exactly once — after success OR after any exception.
            // Guarantees logging is always restored no matter what happens.
            ProponentModel::enableLogging();
        }
    }

    public function edit($id)
    {
        $proponent = ProponentModel::findOrFail($id);

        return Inertia::render('Proponents/Edit', [
            'proponent' => $proponent,
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'company_name' => 'nullable|string|max:254',
            'owner_name' => 'nullable|string|max:254',
            'email' => 'nullable|email|max:100',
            'street' => 'nullable|string|max:100',
            'barangay' => 'nullable|string|max:50',
            'municipality' => 'nullable|string|max:50',
            'province' => 'nullable|string|max:30',
            'district' => 'nullable|string|max:45',
            'sex' => 'nullable|in:Male,Female',
            'products' => 'nullable|string',
            'setup_industry' => 'nullable|string|max:150',
            'industry_type' => 'nullable|string|max:10',
            'contact_number' => 'nullable|digits_between:11,11|regex:/^09[0-9]{9}$/',
            // 'current_market'   => 'nullable|string|max:100',
        ]);

        $proponent = ProponentModel::findOrFail($id);
        $proponent->update($validated);

        return redirect()->route('proponents.index')->with('success', 'proponent updated successfully.');
    }

    public function destroy($id)
    {
        $proponent = ProponentModel::withCount('projects')->findOrFail($id);

        if ($proponent->projects_count > 0) {
            return back()->with('error', 'Cannot delete this proponent because it has associated projects.');
        }

        $proponent->delete();

        return redirect()->route('proponents.index')->with('success', 'proponent deleted successfully.');
    }
}
