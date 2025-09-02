<?php

namespace App\Http\Controllers;

use App\Models\CompanyModel;
use App\Models\ReportModel;
use App\Models\ProjectModel;
use App\Models\UserModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $userId = Auth::id();
        $user = UserModel::where('user_id', $userId)->first();
        $search = $request->input('search');
        $perPage = $request->input('perPage', 10);

        Log::info('Reports Index Accessed', [
            'user_id'   => $userId,
            'role'      => $user->role ?? null,
            'office_id' => $user->office_id ?? null,
            'search'    => $search,
            'perPage'   => $perPage,
        ]);

        $query = ProjectModel::with([
            // eager load company
            'company:company_id,company_name,office_id',

            // eager load reports
            'reports' => function ($q) {
                $q->select('report_id', 'project_id', 'created_at')
                  ->orderBy('created_at', 'desc');
            }
        ])->select('project_id', 'project_title', 'company_id');

        // Role restrictions
        if ($user->role === 'user') {
            Log::debug('Filtering projects for user role', ['user_id' => $user->user_id]);
            $companyIds = CompanyModel::where('added_by', $user->user_id)->pluck('company_id');
            $query->whereIn('company_id', $companyIds);
        } elseif ($user->role === 'staff') {
            Log::debug('Filtering projects for staff role', ['office_id' => $user->office_id]);
            $query->whereHas('company', function ($q) use ($user) {
                $q->where('office_id', $user->office_id);
            });
        } else {
            Log::debug('No role restriction applied (admin or other)');
        }

        // Search filter
        if ($search) {
            Log::debug('Applying search filter', ['search' => $search]);
            $query->where(function ($q) use ($search) {
                $q->where('project_title', 'like', "%{$search}%")
                  ->orWhereHas('company', function ($q) use ($search) {
                      $q->where('company_name', 'like', "%{$search}%");
                  });
            });
        }

        $projects = $query->orderBy('project_title')->paginate($perPage)->withQueryString();

        Log::info('Projects retrieved', [
            'count' => $projects->count(),
            'total' => $projects->total(),
        ]);

        return Inertia::render('Reports/Index', [
            'projects' => $projects,
            'filters'  => $request->only('search', 'perPage'),
        ]);
    }


    public function create(ProjectModel $project)
    {
        Log::info('Opening report creation page', [
            'project_id' => $project->project_id,
        ]);

        // Load related data
        $project->load(['company']);

        $objectives = DB::table('tbl_objectives')
            ->where('project_id', $project->project_id)
            ->get();

        $equipments = DB::table('tbl_items')
            ->where('project_id', $project->project_id)
            ->where('type', 'equipment')
            ->get();

        $nonequipments = DB::table('tbl_items')
            ->where('project_id', $project->project_id)
            ->where('type', 'nonequip')
            ->get();

        $loans = DB::table('tbl_loans')
            ->where('project_id', $project->project_id)
            ->get();

        $markets = DB::table('tbl_markets')
            ->where('project_id', $project->project_id)
            ->get();

        return Inertia::render('Reports/Create', [
            'project' => $project,
            'objects' => $objectives,
            'equipments' => $equipments,
            'nonequipments' => $nonequipments,
            'loans' => $loans,
            'markets' => $markets,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:tbl_projects,project_id',
            'actual_accom' => 'nullable|string',
            'actual_remarks' => 'nullable|string|max:45',
            'util_remarks' => 'nullable|string',
            'new_male' => 'nullable|integer|min:0',
            'new_female' => 'nullable|integer|min:0',
            'new_ifmale' => 'nullable|integer|min:0',
            'new_iffemale' => 'nullable|integer|min:0',
            'new_ibmale' => 'nullable|integer|min:0',
            'new_ibfemale' => 'nullable|integer|min:0',
            'problems' => 'nullable|string',
            'actions' => 'nullable|string',
            'promotional' => 'nullable|string',
            'products' => 'nullable|array',
            'products.*.product_name' => 'required_with:products|string|max:45',
            'products.*.volume' => 'required_with:products|integer|min:0',
            'products.*.quarter' => 'required_with:products|integer|between:1,4',
            'products.*.gross_sales' => 'required_with:products|integer|min:0',
            'markets_new' => 'nullable|array',
            'markets_new.*.place_name' => 'required_with:markets_new|string|max:255',
            'markets_new.*.effective_date' => 'required_with:markets_new|date',
            'equipments_actual' => 'nullable|array',
            'equipments_actual.*.actual' => 'nullable|string',
            'equipments_actual.*.acknowledge' => 'nullable|string',
            'equipments_actual.*.remarks' => 'nullable|string',
            'nonequipments_actual' => 'nullable|array',
            'nonequipments_actual.*.actual' => 'nullable|string',
            'nonequipments_actual.*.acknowledge' => 'nullable|string',
            'nonequipments_actual.*.remarks' => 'nullable|string',
        ]);

        Log::info('Creating new report', [
            'validated_data' => $validated,
        ]);

        DB::beginTransaction();
        
        try {
            // Create the report
            $report = ReportModel::create([
                'project_id' => $validated['project_id'],
                'actual_accom' => $validated['actual_accom'],
                'actual_remarks' => $validated['actual_remarks'],
                'util_remarks' => $validated['util_remarks'],
                'new_male' => $validated['new_male'] ?? 0,
                'new_female' => $validated['new_female'] ?? 0,
                'new_ifmale' => $validated['new_ifmale'] ?? 0,
                'new_iffemale' => $validated['new_iffemale'] ?? 0,
                'new_ibmale' => $validated['new_ibmale'] ?? 0,
                'new_ibfemale' => $validated['new_ibfemale'] ?? 0,
                'problems' => $validated['problems'],
                'actions' => $validated['actions'],
                'promotional' => $validated['promotional'],
            ]);

            $reportId = $report->report_id;

            // Save products
            if (!empty($validated['products'])) {
                foreach ($validated['products'] as $product) {
                    if (!empty($product['product_name'])) {
                        DB::table('tbl_products')->insert([
                            'report_id' => $reportId,
                            'product_name' => $product['product_name'],
                            'volume' => $product['volume'] ?? 0,
                            'quarter' => $product['quarter'] ?? 1,
                            'gross_sales' => $product['gross_sales'] ?? 0,
                        ]);
                    }
                }
            }

            // Save new markets
            if (!empty($validated['markets_new'])) {
                foreach ($validated['markets_new'] as $market) {
                    if (!empty($market['place_name'])) {
                        DB::table('tbl_markets')->insert([
                            'project_id' => $validated['project_id'],
                            'place_name' => $market['place_name'],
                            'effective_date' => $market['effective_date'],
                            'type' => 'new',
                        ]);
                    }
                }
            }

            // Update equipment actual data
            if (!empty($validated['equipments_actual'])) {
                $equipments = DB::table('tbl_items')
                    ->where('project_id', $validated['project_id'])
                    ->where('type', 'equipment')
                    ->where('report', 'approved')
                    ->get();

                foreach ($equipments as $index => $equipment) {
                    if (isset($validated['equipments_actual'][$index])) {
                        $actualData = $validated['equipments_actual'][$index];
                        
                        // Create new item entry for actual equipment
                        if (!empty($actualData['actual']) || !empty($actualData['acknowledge']) || !empty($actualData['remarks'])) {
                            DB::table('tbl_items')->insert([
                                'project_id' => $validated['project_id'],
                                'item_name' => $actualData['actual'] ?? $equipment->item_name,
                                'specifications' => $equipment->specifications,
                                'quantity' => $equipment->quantity,
                                'item_cost' => $equipment->item_cost,
                                'type' => 'equipment',
                                'report' => $reportId,
                                'acknowledge' => $actualData['acknowledge'],
                                'remarks' => $actualData['remarks'],
                            ]);
                        }
                    }
                }
            }

            // Update non-equipment actual data
            if (!empty($validated['nonequipments_actual'])) {
                $nonequipments = DB::table('tbl_items')
                    ->where('project_id', $validated['project_id'])
                    ->where('type', 'nonequip')
                    ->where('report', 'approved')
                    ->get();

                foreach ($nonequipments as $index => $nonequipment) {
                    if (isset($validated['nonequipments_actual'][$index])) {
                        $actualData = $validated['nonequipments_actual'][$index];
                        
                        // Create new item entry for actual non-equipment
                        if (!empty($actualData['actual']) || !empty($actualData['acknowledge']) || !empty($actualData['remarks'])) {
                            DB::table('tbl_items')->insert([
                                'project_id' => $validated['project_id'],
                                'item_name' => $actualData['actual'] ?? $nonequipment->item_name,
                                'specifications' => $nonequipment->specifications,
                                'quantity' => $nonequipment->quantity,
                                'item_cost' => $nonequipment->item_cost,
                                'type' => 'nonequip',
                                'report' => $reportId,
                                'acknowledge' => $actualData['acknowledge'],
                                'remarks' => $actualData['remarks'],
                            ]);
                        }
                    }
                }
            }

            DB::commit();
            
            Log::notice('Report created successfully', [
                'project_id' => $validated['project_id'],
                'report_id' => $reportId,
            ]);

            return redirect()->route('reports.index')->with('success', 'Report created successfully.');

        } catch (\Exception $e) {
            DB::rollback();
            
            Log::error('Failed to create report', [
                'error' => $e->getMessage(),
                'project_id' => $validated['project_id'],
            ]);

            return back()->withErrors(['error' => 'Failed to create report. Please try again.']);
        }
    }
}