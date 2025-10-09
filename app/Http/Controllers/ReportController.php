<?php

namespace App\Http\Controllers;

use App\Models\CompanyModel;
use App\Models\ImplementationModel;
use App\Models\ItemModel;
use App\Models\MarketModel;
use App\Models\ObjectiveModel;
use App\Models\ProductModel;
use App\Models\ReportModel;
use App\Models\ProjectModel;
use App\Models\TagModel;
use App\Models\UserModel;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use PhpOffice\PhpWord\TemplateProcessor;
use PhpOffice\PhpWord\Element\Table;
use PhpOffice\PhpWord\SimpleType\Jc;

class ReportController extends Controller
{
public function index(Request $request)
{
    $userId = Auth::id();
    $user   = UserModel::where('user_id', $userId)->firstOrFail();

    $search  = $request->input('search');
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

        // eager load latest reports
        'reports' => function ($q) {
            $q->select('report_id', 'project_id', 'created_at')
              ->orderBy('created_at', 'desc');
        }
    ])->select('project_id', 'project_title', 'company_id');

    // ✅ Role-based filtering
    if ($user->role === 'user') {
        Log::debug('Filtering projects for USER role', ['user_id' => $user->user_id]);

        $companyIds = CompanyModel::where('added_by', $user->user_id)->pluck('company_id');
        $query->whereIn('company_id', $companyIds);

    } elseif ($user->role === 'staff') {
        Log::debug('Filtering projects for STAFF role', ['office_id' => $user->office_id]);

        $query->whereHas('company', function ($q) use ($user) {
            $q->where('office_id', $user->office_id);
        });

    } elseif ($user->role === 'head') {
        Log::debug('ADMIN role detected - no restrictions applied');
        // admin sees all projects

    } else {
        Log::warning('Unknown role - applying no filters', ['role' => $user->role]);
    }

    if (!empty($search)) {
        Log::debug('Applying search filter', ['search' => $search]);

        $query->where(function ($q) use ($search) {
            $q->where('project_title', 'like', "%{$search}%")
              ->orWhereHas('company', function ($q) use ($search) {
                  $q->where('company_name', 'like', "%{$search}%");
              });
        });
    }

    // ✅ Pagination
    $projects = $query->orderBy('project_title')
                      ->paginate($perPage)
                      ->withQueryString();

    Log::info('Projects retrieved', [
        'count' => $projects->count(),
        'total' => $projects->total(),
    ]);

    return Inertia::render('Reports/Index', [
        'projects' => $projects,
        'filters'  => $request->only('search', 'perPage'),
    ]);
}

public function destroy($id)
{
    // Delete items linked by the "report" column
    ItemModel::where('report', $id)->delete();
    ObjectiveModel::where('report', $id)->delete();

    // Delete the report
    $report = ReportModel::findOrFail($id);
    $report->delete();

    return redirect()->back()->with('success', 'Report and its related items deleted successfully.');
}
public function downloadReport($report_id)
{
    // Fetch the report (with relations)
    $report = ReportModel::with(['project.company'])->findOrFail($report_id);
    $project = $report->project;
    $company = $project->company;

    $implementIds = ImplementationModel::where('project_id', $project->project_id)->pluck('implement_id');
    $sum_cost = TagModel::whereIn('implement_id', $implementIds)->sum('tag_amount');


    // === 1️⃣ PRODUCTS TABLE ===
    $products = ProductModel::where('report_id', $report_id)->get();

    // === 2️⃣ NEW MALE/FEMALE TABLE ===
    $newMale   = $report->new_male ?? 0;
    $newFemale = $report->new_female ?? 0;
    $totalNew  = $newMale + $newFemale;

    // === 3️⃣ FORWARD/BACKWARD TABLE ===
    $ifMale   = $report->new_ifmale ?? 0;
    $ifFemale = $report->new_iffemale ?? 0;
    $ibMale   = $report->new_ibmale ?? 0;
    $ibFemale = $report->new_ibfemale ?? 0;

    $forwardTotal  = $ifMale + $ifFemale;
    $backwardTotal = $ibMale + $ibFemale;
    $overallTotal  = $forwardTotal + $backwardTotal;

    $ownerName = $company->owner_name ?? 'N/A';

    // Phase One (Release Dates)
    $releaseInitial = $project->release_initial ? Carbon::parse($project->release_initial)->format('F Y') : 'N/A';
    $releaseEnd     = $project->release_end ? Carbon::parse($project->release_end)->format('F Y') : 'N/A';
    $phaseOne       = "$releaseInitial - $releaseEnd";

    // Phase Two (Refund Dates)
    $refundInitial = $project->refund_initial ? Carbon::parse($project->refund_initial)->format('F Y') : 'N/A';
    $refundEnd     = $project->refund_end ? Carbon::parse($project->refund_end)->format('F Y') : 'N/A';
    $phaseTwo      = "$refundInitial - $refundEnd";

    // Refund Data
    $refunds = $project->refunds;

    $totalRefund = $refunds->sum('refund_amount');
    $toRefunded  = $project->project_cost - $totalRefund;
    $unsetRefund = $project->project_cost - $totalRefund;
    $currentDate = Carbon::parse($report->created_at)->format('F, Y');

    $totalUnpaid = $refunds
        ->where('status', 'unpaid')
        ->where('month_paid', Carbon::now()->format('Y-m-01'))
        ->sum('refund_amount');

    $oldestUnpaid = $refunds
        ->where('status', 'unpaid')
        ->sortBy('month_paid')
        ->first();

    $oldUnpaid = $oldestUnpaid
        ? Carbon::parse($oldestUnpaid->month_paid)->format('F Y')
        : 'N/A';


    // --- Load Template ONCE ---
    $templatePath = storage_path('app/templates/form.docx');
    $templateProcessor = new TemplateProcessor($templatePath);

    // --- Fill placeholders ---
    $templateProcessor->setValue('project_title', $project->project_title);
    $templateProcessor->setValue('owner_name', $ownerName);
    $templateProcessor->setValue('phase_one', $phaseOne);
    $templateProcessor->setValue('release_initial', $releaseInitial);
    $templateProcessor->setValue('phase_two', $phaseTwo);    $templateProcessor->setValue('project_cost', number_format($project->project_cost, 2));

    $templateProcessor->setValue('util_remarks', $report->util_remarks);
    $templateProcessor->setValue('problems', $report->problems);
    $templateProcessor->setValue('actions', $report->actions);
    $templateProcessor->setValue('promotional', $report->promotional);

    $templateProcessor->setValue('sum_cost', number_format($sum_cost, 2));
    $templateProcessor->setValue('to_refunded', number_format($toRefunded, 2));
    $templateProcessor->setValue('current_date', $currentDate);
    $templateProcessor->setValue('total_unpaid', number_format($totalUnpaid, 2));
    $templateProcessor->setValue('total_refund', number_format($totalRefund, 2));
    $templateProcessor->setValue('unset_refund', number_format($unsetRefund, 2));
    $templateProcessor->setValue('old_unpaid', $oldUnpaid);

    // === Insert Tables ===
    

    $fontStyle = ['color' => '000000', 'size' => 11];
    $paraCenter = ['alignment' => Jc::CENTER];

        // Assuming you already have $projectId and $reportId
    $approvedItems = ItemModel::where('project_id', $project->project_id)
        ->where('type', 'equipment')
        ->where('report', 'approved')
        ->get();

    $actualItems = ItemModel::where('project_id', $project->project_id)
        ->where('report', $report->report_id)
        ->get();

    // Create table
    $equipTable = new Table(['borderSize' => 6, 'borderColor' => '000000']);

    // 🔹 Row 1: Header row
    $equipTable->addRow();
    $equipTable->addCell(3500, ['gridSpan' => 3])->addText('Approved Equipment', $fontStyle, $paraCenter);
    $equipTable->addCell(3500, ['gridSpan' => 3])->addText('Actual Acquired', $fontStyle, $paraCenter);
    $equipTable->addCell(2500, ['vMerge' => 'restart'])->addText('Acknowledge', $fontStyle, $paraCenter);
    $equipTable->addCell(2000, ['vMerge' => 'restart'])->addText('Remarks', $fontStyle, $paraCenter);
    

    // 🔹 Row 2: Sub-header row
    $equipTable->addRow();
    $equipTable->addCell(1000)->addText('Qty', $fontStyle, $paraCenter);
    $equipTable->addCell(3000)->addText('Particulars', $fontStyle, $paraCenter);
    $equipTable->addCell(2000)->addText('Cost', $fontStyle, $paraCenter);
    $equipTable->addCell(1000)->addText('Qty', $fontStyle, $paraCenter);
    $equipTable->addCell(3000)->addText('Particulars', $fontStyle, $paraCenter);
    $equipTable->addCell(2000)->addText('Cost', $fontStyle, $paraCenter);
    $equipTable->addCell(null, ['vMerge' => 'continue']); // continue merge for Existing Market
    $equipTable->addCell(null, ['vMerge' => 'continue']); // continue merge for Existing Market

  
    // 🔹 Rows: Data
    $maxRows = max($approvedItems->count(), $actualItems->count());
    for ($i = 0; $i < $maxRows; $i++) {
        $equipTable->addRow();

        // Approved equipment (left side)
        $approved = $approvedItems->get($i);
        $equipTable->addCell(1000)->addText($approved->quantity ?? '', ['color' => '000000']);
        $equipTable->addCell(3000)->addText(
            isset($approved) ? $approved->item_name . ' - ' . $approved->specifications : '',
            ['color' => '000000']
        );
        $equipTable->addCell(2500)->addText($approved->item_cost ?? '', ['color' => '000000']);

        // Actual equipment (right side)
        $actual = $actualItems->get($i);
        $equipTable->addCell(1000)->addText($actual->quantity ?? '', ['color' => '000000']);
        $equipTable->addCell(3000)->addText(
            isset($actual) ? $actual->item_name . ' - ' . $actual->specifications : '',
            ['color' => '000000']
        );
        $equipTable->addCell(2500)->addText($actual->item_cost ?? '', ['color' => '000000']);
        $equipTable->addCell(2500)->addText($actual->acknowledge ?? '', ['color' => '000000']);
        $equipTable->addCell(2000)->addText($actual->remarks ?? '', ['color' => '000000']);
    }

    // Add table to your template
    $templateProcessor->setComplexBlock('equipment_table', $equipTable);



    // Assuming you already have $projectId and $reportId
    $approvedNonequip = ItemModel::where('project_id', $project->project_id)
        ->where('type', 'nonequip')
        ->where('report', 'approved')
        ->get();

    $actualNonequip = ItemModel::where('project_id', $project->project_id)
        ->where('type', 'nonequip')
        ->where('report', $report->report_id)
        ->get();

    $nonequipTable = new Table(['borderSize' => 6, 'borderColor' => '000000']);

    // 🔹 Row 1: Header row
    $nonequipTable->addRow();
    $nonequipTable->addCell(3500, ['gridSpan' => 3])
        ->addText('Approved Non-Equipment', $fontStyle, $paraCenter);
    $nonequipTable->addCell(3500, ['gridSpan' => 3])
        ->addText('Actual Acquired', $fontStyle, $paraCenter);
    $nonequipTable->addCell(2500, ['vMerge' => 'restart'])->addText('Acknowledge', $fontStyle, $paraCenter);
    $nonequipTable->addCell(2000, ['vMerge' => 'restart'])->addText('Remarks', $fontStyle, $paraCenter);
    

    // 🔹 Row 2: Sub-header row
    $nonequipTable->addRow();
    $nonequipTable->addCell(1000)->addText('Qty', $fontStyle, $paraCenter);
    $nonequipTable->addCell(3000)->addText('Particulars', $fontStyle, $paraCenter);
    $nonequipTable->addCell(2500)->addText('Cost', $fontStyle, $paraCenter);
    $nonequipTable->addCell(1000)->addText('Qty', $fontStyle, $paraCenter);
    $nonequipTable->addCell(3000)->addText('Particulars', $fontStyle, $paraCenter);
    $nonequipTable->addCell(2500)->addText('Cost', $fontStyle, $paraCenter);
    $nonequipTable->addCell(null, ['vMerge' => 'continue']); // continue merge for Existing Market
    $nonequipTable->addCell(null, ['vMerge' => 'continue']); // continue merge for Existing Market

    // 🔹 Data rows
    $maxRowsNonequip = max($approvedNonequip->count(), $actualNonequip->count());
    for ($i = 0; $i < $maxRowsNonequip; $i++) {
        $nonequipTable->addRow();

        // Approved non-equip (left side)
        $approved = $approvedNonequip->get($i);
        $nonequipTable->addCell(1000)->addText($approved->quantity ?? '', ['color' => '000000']);
        $nonequipTable->addCell(3000)->addText(
            isset($approved) ? $approved->item_name . ' - ' . $approved->specifications : '',
            ['color' => '000000']
        );
        $nonequipTable->addCell(2000)->addText($approved->item_cost ?? '', ['color' => '000000']);

        // Actual non-equip (right side)
        $actual = $actualNonequip->get($i);
        $nonequipTable->addCell(1000)->addText($actual->quantity ?? '', ['color' => '000000']);
        $nonequipTable->addCell(3000)->addText(
            isset($actual) ? $actual->item_name . ' - ' . $actual->specifications : '',
            ['color' => '000000']
        );
        $nonequipTable->addCell(2000)->addText($actual->item_cost ?? '', ['color' => '000000']);
        $nonequipTable->addCell(2500)->addText($actual->acknowledge ?? '', ['color' => '000000']);
        $nonequipTable->addCell(2000)->addText($actual->remarks ?? '', ['color' => '000000']);
    }

    // Add to your template (use a different placeholder than equipment table)
    $templateProcessor->setComplexBlock('nonequip_table', $nonequipTable);

    $objectiveTable = new Table([
        'borderSize' => 6,
        'borderColor' => '000000',
        'alignment' => Jc::CENTER,
    ]);

    // Get objectives for this project
    $objectives = ObjectiveModel::where('project_id', $project->project_id)->get();

    // Separate approved objectives (expected output)
    $approvedObjectives = $objectives->where('report', 'approved');

    // Get objectives linked to this specific report (actual accomplishments)
    $actualObjectives = $objectives->where('report', $report->report_id);


    // --- Header Row ---
    $objectiveTable->addRow();
    $objectiveTable->addCell(4000)->addText('Expected Output', $fontStyle, $paraCenter);
    $objectiveTable->addCell(4000)->addText('Actual Accomplishment', $fontStyle, $paraCenter);
    $objectiveTable->addCell(4000)->addText('Remarks / Justification', $fontStyle, $paraCenter);

    // --- Data Rows ---
    $maxRows = max($approvedObjectives->count(), $actualObjectives->count());

    if ($maxRows === 0) {
        // No objectives at all
        $objectiveTable->addRow();
        $objectiveTable->addCell(4000)->addText('N/A', $fontStyle, $paraCenter);
        $objectiveTable->addCell(4000)->addText('N/A', $fontStyle, $paraCenter);
        $objectiveTable->addCell(4000)->addText('N/A', $fontStyle, $paraCenter);
    } else {
        for ($i = 0; $i < $maxRows; $i++) {
            $objectiveTable->addRow();

            // Expected Output (approved objective details)
            $objectiveTable->addCell(4000)->addText(
                $approvedObjectives->values()->get($i)->details ?? '',
                $fontStyle,
                $paraCenter
            );

            // Actual Accomplishment (from current report)
            $objectiveTable->addCell(4000)->addText(
                $actualObjectives->values()->get($i)->details ?? '',
                $fontStyle,
                $paraCenter
            );

            // Remarks/Justification
            $objectiveTable->addCell(4000)->addText(
                $actualObjectives->values()->get($i)->remarks ?? '',
                $fontStyle,
                $paraCenter
            );
        }
    }

    // Add to template placeholder
    $templateProcessor->setComplexBlock('objective_table', $objectiveTable);

    $markets = MarketModel::where('project_id', $project->project_id)->get();

    $existingMarkets = $markets->where('type', 'existing');
    $newMarkets = $markets->where('type', 'new');

    $marketTable = new Table([
    'borderSize' => 6,
    'borderColor' => '000000',
    'alignment' => Jc::CENTER,
]);

// --- Header Row 1 ---
// First row: Existing Market + merged cell for New Market
$marketTable->addRow();
$marketTable->addCell(2000, ['vMerge' => 'restart'])->addText('Existing Market', $fontStyle, $paraCenter);
$marketTable->addCell(5000, ['gridSpan' => 2])->addText('New Market', $fontStyle, $paraCenter);

// --- Header Row 2 ---
// Second row: Specify Place + Effective Date under New Market
$marketTable->addRow();
$marketTable->addCell(null, ['vMerge' => 'continue']); // continue merge for Existing Market
$marketTable->addCell(2000)->addText('Specify Place', $fontStyle, $paraCenter);
$marketTable->addCell(3000)->addText('Effective Date', $fontStyle, $paraCenter);

// --- Data Rows ---
$maxRows = max($existingMarkets->count(), $newMarkets->count());

if ($maxRows === 0) {
    // No data at all
    $marketTable->addRow();
    $marketTable->addCell(2000)->addText('N/A', $fontStyle, $paraCenter);
    $marketTable->addCell(2000)->addText('N/A', $fontStyle, $paraCenter);
    $marketTable->addCell(3000)->addText('N/A', $fontStyle, $paraCenter);
} else {
    for ($i = 0; $i < $maxRows; $i++) {
        $marketTable->addRow();
        // Existing Market
        $marketTable->addCell(2000)->addText(
            $existingMarkets->values()->get($i)->place_name ?? '',
            $fontStyle, $paraCenter
        );

        // New Market - Place + Date
        $new = $newMarkets->values()->get($i);
        $marketTable->addCell(2000)->addText($new->place_name ?? '', $fontStyle, $paraCenter);
        $marketTable->addCell(3000)->addText(
            isset($new->effective_date) ? Carbon::parse($new->effective_date)->format('F d, Y') : '',
            $fontStyle,
            $paraCenter
        );
    }
}
    // Add to template placeholder
    $templateProcessor->setComplexBlock('market_table', $marketTable);


    // Products Table
    $productTable = new Table(['borderSize' => 6, 'borderColor' => '000000', 'alignment'   => Jc::CENTER]);
    $productTable->addRow();
    $productTable->addCell(3000)->addText('Product', $fontStyle, $paraCenter);
    $productTable->addCell(1500)->addText('Volume', $fontStyle, $paraCenter);
    $productTable->addCell(1500)->addText('Quarter', $fontStyle, $paraCenter);
    $productTable->addCell(2000)->addText('Gross Sales', $fontStyle, $paraCenter);
    foreach ($products as $prod) {
        $productTable->addRow();
        $productTable->addCell(3000)->addText($prod->product_name, $fontStyle, $paraCenter);
        $productTable->addCell(1500)->addText($prod->volume, $fontStyle, $paraCenter);
        $productTable->addCell(1500)->addText("₱$prod->quarter", $fontStyle, $paraCenter);
        $productTable->addCell(2000)->addText(number_format($prod->gross_sales, 2), $fontStyle, $paraCenter);
    }
    $templateProcessor->setComplexBlock('products_table', $productTable);

    // Male/Female Table
    $genderTable = new Table(['borderSize' => 6, 'borderColor' => '000000', 'alignment'   => Jc::CENTER]);
    $genderTable->addRow();
    $genderTable->addCell(2000)->addText('No. of Employees', $fontStyle, $paraCenter);
    $genderTable->addCell(2000)->addText('No. of Males', $fontStyle, $paraCenter);
    $genderTable->addCell(2000)->addText('No. of Females', $fontStyle, $paraCenter);
    $genderTable->addCell(2000)->addText('No. of Person With Disability', $fontStyle, $paraCenter);

    $genderTable->addRow();
    $genderTable->addCell(2000)->addText($totalNew, $fontStyle, $paraCenter);
    $genderTable->addCell(2000)->addText($newMale, $fontStyle, $paraCenter);
    $genderTable->addCell(2000)->addText($newFemale, $fontStyle, $paraCenter);
    $genderTable->addCell(2000)->addText('', $fontStyle, $paraCenter);
    $templateProcessor->setComplexBlock('newdirect_table', $genderTable);

    // Forward/Backward Table
    $fbTable = new Table(['borderSize' => 6, 'borderColor' => '000000', 'alignment'   => Jc::CENTER]);

    // 🔹 Row 1: Header with Overall Total + Forward/Backward headings
    $fbTable->addRow();
    $fbTable->addCell(2000, ['vMerge' => 'restart']) // Start vertical merge
    ->addText('Overall Total', $fontStyle, $paraCenter); // Left-most cell
    $fbTable->addCell(3000, ['gridSpan' => 3])->addText('Forward', $fontStyle, $paraCenter);
    $fbTable->addCell(3000, ['gridSpan' => 3])->addText('Backward', $fontStyle, $paraCenter);

    // 🔹 Row 2: Sub-header with Male | Female | Total for each direction
    $fbTable->addRow();
    $fbTable->addCell(2000, ['vMerge' => 'continue']); // Continue merged cell
    $fbTable->addCell(1000)->addText('Male', $fontStyle, $paraCenter);
    $fbTable->addCell(1000)->addText('Female', $fontStyle, $paraCenter);
    $fbTable->addCell(1000)->addText('Total', $fontStyle, $paraCenter);
    $fbTable->addCell(1000)->addText('Male', $fontStyle, $paraCenter);
    $fbTable->addCell(1000)->addText('Female', $fontStyle, $paraCenter);
    $fbTable->addCell(1000)->addText('Total', $fontStyle, $paraCenter);

    // 🔹 Row 3: Data row
    $fbTable->addRow();
    $fbTable->addCell(2000)->addText($overallTotal, $fontStyle, $paraCenter);
    $fbTable->addCell(1000)->addText($ifMale, $fontStyle, $paraCenter);
    $fbTable->addCell(1000)->addText($ifFemale, $fontStyle, $paraCenter);
    $fbTable->addCell(1000)->addText($forwardTotal, $fontStyle, $paraCenter);
    $fbTable->addCell(1000)->addText($ibMale, $fontStyle, $paraCenter);
    $fbTable->addCell(1000)->addText($ibFemale, $fontStyle, $paraCenter);
    $fbTable->addCell(1000)->addText($backwardTotal, $fontStyle, $paraCenter);

    $templateProcessor->setComplexBlock('newindirect_table', $fbTable);


    // Generate file
    $tempFile = tempnam(sys_get_temp_dir(), 'word');
    $templateProcessor->saveAs($tempFile);

    return response()->download($tempFile, "Report_{$project->project_id}.docx")->deleteFileAfterSend(true);
}



public function create(ProjectModel $project)
{
    Log::info('Opening report creation page', [
        'project_id' => $project->project_id,
    ]);

    $project->load([
        'company',
        'objectives' => function ($q) {
            $q->where('report', 'approved');
        },
        'items',
        'refunds',
        'markets',
    ]);

    $equipments = $project->items->where('type', 'equipment')->values();
    $nonequipments = $project->items->where('type', 'nonequip')->values();

    return Inertia::render('Reports/Create', [
        'project' => $project,
        'objects' => $project->objectives,
        'equipments' => $equipments,
        'nonequipments' => $nonequipments,
        'refunds' => $project->refunds,
        'markets' => $project->markets,
    ]);
}


    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:tbl_projects,project_id',
            'actual_accom' => 'nullable|array',
            'actual_accom.*' => 'nullable|string',
            'actual_remarks' => 'nullable|array',
            'actual_remarks.*' => 'nullable|string',
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

       Log::info('Creating new report - validated data received', [
        'validated' => $validated,
    ]);

    DB::beginTransaction();

    try {
        // Create the report
        $report = ReportModel::create([
            'project_id'   => $validated['project_id'],
            'util_remarks' => $validated['util_remarks'] ?? null,
            'new_male'     => $validated['new_male'] ?? 0,
            'new_female'   => $validated['new_female'] ?? 0,
            'new_ifmale'   => $validated['new_ifmale'] ?? 0,
            'new_iffemale' => $validated['new_iffemale'] ?? 0,
            'new_ibmale'   => $validated['new_ibmale'] ?? 0,
            'new_ibfemale' => $validated['new_ibfemale'] ?? 0,
            'problems'     => $validated['problems'] ?? null,
            'actions'      => $validated['actions'] ?? null,
            'promotional'  => $validated['promotional'] ?? null,
        ]);

        $reportId = $report->report_id;

        Log::debug('Report row inserted', [
            'report_id' => $reportId,
            'project_id' => $validated['project_id']
        ]);

        // ✅ Save objectives
        if (!empty($validated['actual_accom'])) {
            foreach ($validated['actual_accom'] as $index => $accom) {
                $remarks = $validated['actual_remarks'][$index] ?? null;

                Log::debug('Inserting objective report', [
                    'index' => $index,
                    'actual_accom' => $accom,
                    'actual_remarks' => $remarks,
                ]);

                DB::table('tbl_objectives')->insert([
                    'project_id'     => $validated['project_id'],
                    'report'      => $reportId,
                    'details'   => $accom,
                    'remarks' => $remarks,
                ]);
            }
        } else {
            Log::info('No actual_accom provided, skipping objectives insert.');
        }

        // ✅ Save products
        if (!empty($validated['products'])) {
            foreach ($validated['products'] as $i => $product) {
                Log::debug('Processing product', ['index' => $i, 'data' => $product]);

                if (!empty($product['product_name'])) {
                    DB::table('tbl_products')->insert([
                        'report_id'    => $reportId,
                        'product_name' => $product['product_name'],
                        'volume'       => $product['volume'] ?? 0,
                        'quarter'      => $product['quarter'] ?? 1,
                        'gross_sales'  => $product['gross_sales'] ?? 0,
                    ]);
                    Log::info('Product inserted', ['product_name' => $product['product_name']]);
                } else {
                    Log::warning('Skipping product with empty name', ['index' => $i]);
                }
            }
        }

        // ✅ Save new markets
        if (!empty($validated['markets_new'])) {
            foreach ($validated['markets_new'] as $i => $market) {
                Log::debug('Processing market', ['index' => $i, 'data' => $market]);

                if (!empty($market['place_name'])) {
                    DB::table('tbl_markets')->insert([
                        'project_id'     => $validated['project_id'],
                        'place_name'     => $market['place_name'],
                        'effective_date' => $market['effective_date'],
                        'type'           => 'new',
                    ]);
                    Log::info('Market inserted', ['place_name' => $market['place_name']]);
                } else {
                    Log::warning('Skipping market with empty place_name', ['index' => $i]);
                }
            }
        }

        // ✅ Equipment and Non-Equipment inserts
        Log::debug('Processing equipment and non-equipment actual data');

        if (!empty($validated['equipments_actual'])) {
            $equipments = DB::table('tbl_items')
                ->where('project_id', $validated['project_id'])
                ->where('type', 'equipment')
                ->where('report', 'approved')
                ->get();

            foreach ($equipments as $index => $equipment) {
                if (isset($validated['equipments_actual'][$index])) {
                    $actualData = $validated['equipments_actual'][$index];
                    Log::debug('Equipment actual data', ['index' => $index, 'data' => $actualData]);

                    if (!empty($actualData['actual']) || !empty($actualData['acknowledge']) || !empty($actualData['remarks'])) {
                        DB::table('tbl_items')->insert([
                            'project_id'    => $validated['project_id'],
                            'item_name'     => $actualData['actual'] ?? $equipment->item_name,
                            'specifications'=> $equipment->specifications,
                            'quantity'      => $equipment->quantity,
                            'item_cost'     => $equipment->item_cost,
                            'type'          => 'equipment',
                            'report'        => $reportId,
                            'acknowledge'   => $actualData['acknowledge'],
                            'remarks'       => $actualData['remarks'],
                        ]);
                        Log::info('Equipment inserted', ['item_name' => $actualData['actual'] ?? $equipment->item_name]);
                    }
                }
            }
        }

        if (!empty($validated['nonequipments_actual'])) {
            $nonequipments = DB::table('tbl_items')
                ->where('project_id', $validated['project_id'])
                ->where('type', 'nonequip')
                ->where('report', 'approved')
                ->get();

            foreach ($nonequipments as $index => $nonequipment) {
                if (isset($validated['nonequipments_actual'][$index])) {
                    $actualData = $validated['nonequipments_actual'][$index];
                    Log::debug('Non-equipment actual data', ['index' => $index, 'data' => $actualData]);

                    if (!empty($actualData['actual']) || !empty($actualData['acknowledge']) || !empty($actualData['remarks'])) {
                        DB::table('tbl_items')->insert([
                            'project_id'    => $validated['project_id'],
                            'item_name'     => $actualData['actual'] ?? $nonequipment->item_name,
                            'specifications'=> $nonequipment->specifications,
                            'quantity'      => $nonequipment->quantity,
                            'item_cost'     => $nonequipment->item_cost,
                            'type'          => 'nonequip',
                            'report'        => $reportId,
                            'acknowledge'   => $actualData['acknowledge'],
                            'remarks'       => $actualData['remarks'],
                        ]);
                        Log::info('Non-equipment inserted', ['item_name' => $actualData['actual'] ?? $nonequipment->item_name]);
                    }
                }
            }
        }

        DB::commit();

        Log::notice('Report created successfully', [
            'project_id' => $validated['project_id'],
            'report_id'  => $reportId,
        ]);

        return redirect()->route('reports.index')->with('success', 'Report created successfully.');

    } catch (\Exception $e) {
        DB::rollBack();

        Log::error('Failed to create report', [
            'message' => $e->getMessage(),
            'trace'   => $e->getTraceAsString(),
            'data'    => $validated,
        ]);

        return back()->withErrors(['error' => 'Failed to create report. Please check logs.']);
    }
}
}