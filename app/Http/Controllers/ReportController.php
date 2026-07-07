<?php

namespace App\Http\Controllers;

use App\Models\ImplementationModel;
use App\Models\ItemModel;
use App\Models\MarketModel;
use App\Models\ObjectiveModel;
use App\Models\ProductModel;
use App\Models\ProjectModel;
use App\Models\proponentModel;
use App\Models\ReportModel;
use App\Models\TagModel;
use App\Models\UserModel;
use App\Services\SupabaseUpload;
use Carbon\Carbon;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use PhpOffice\PhpWord\Element\Table;
use PhpOffice\PhpWord\SimpleType\Jc;
use PhpOffice\PhpWord\TemplateProcessor;

class ReportController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $userId = Auth::id();
        $user = UserModel::where('user_id', $userId)->firstOrFail();

        $search = $request->input('search');
        $perPage = $request->input('perPage', 10);
        $office = $request->input('office');
        $year = $request->input('year');
        $sortBy = $request->input('sortBy', 'project_id');
        $sortOrder = $request->input('sortOrder', 'desc');

        // ── Base query ────────────────────────────────────────────────────────────
        $query = ProjectModel::with([
            'proponent:proponent_id,company_name,office_id,added_by',
            'proponent.office:office_id,office_name',
            'reports' => function ($q) {
                $q->select('report_id', 'project_id', 'created_at', 'file_path', 'status')
                ->orderBy('created_at', 'desc');
            },
        ])->select('project_id', 'project_title', 'proponent_id', 'year_obligated');

        // ── Role-based filtering ──────────────────────────────────────────────────
        if ($user->role === 'user') {
            $proponentIds = proponentModel::where('added_by', $user->user_id)->pluck('proponent_id');
            $query->whereIn('proponent_id', $proponentIds);
        } elseif ($user->role === 'staff') {
            $query->whereHas('proponent', fn ($q) => $q->where('office_id', $user->office_id));
        }
        // 'head' → no restrictions

        // ── Search ────────────────────────────────────────────────────────────────
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('project_title', 'like', "%{$search}%")
                ->orWhere('project_id', 'like', "%{$search}%")
                ->orWhereHas('proponent', fn ($q) => $q->where('company_name', 'like', "%{$search}%"));
            });
        }

        // ── Office filter ─────────────────────────────────────────────────────────
        if (!empty($office)) {
            $query->whereHas('proponent', fn ($q) => $q->where('office_id', $office));
        }

        // ── Year filter ───────────────────────────────────────────────────────────
        if (!empty($year)) {
            $query->where('year_obligated', $year);
        }

        // ── Sorting ───────────────────────────────────────────────────────────────
        $allowedSorts = ['project_id', 'project_title', 'company_name', 'year_obligated'];
        $sortBy = in_array($sortBy, $allowedSorts) ? $sortBy : 'project_title';
        $sortOrder = in_array($sortOrder, ['asc', 'desc']) ? $sortOrder : 'asc';

        if ($sortBy === 'company_name') {
            $query->join('tbl_proponents', 'tbl_projects.proponent_id', '=', 'tbl_proponents.proponent_id')
                ->orderBy('tbl_proponents.company_name', $sortOrder)
                ->select('tbl_projects.*');
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        $projects = $query->paginate($perPage)->withQueryString();

        // ── Offices list ──────────────────────────────────────────────────────────
        $offices = \App\Models\OfficeModel::select('office_id', 'office_name')
                        ->orderBy('office_name')
                        ->get();

        // ── Years list ────────────────────────────────────────────────────────────
        $years = ProjectModel::whereNotNull('year_obligated')
                    ->distinct()
                    ->orderBy('year_obligated', 'desc')
                    ->pluck('year_obligated');

        return Inertia::render('Reports/Index', [
            'projects' => $projects,
            'offices' => $offices,
            'years' => $years,
            'filters' => $request->only('search', 'perPage', 'office', 'year', 'sortBy', 'sortOrder'),
        ]);
    }

    public function destroy($id)
    {
        $report = ReportModel::findOrFail($id);

        if ($report->file_path && Storage::disk('private')->exists($report->file_path)) {
            Storage::disk('private')->delete($report->file_path);
        }

        ItemModel::where('report', $id)->delete();
        ObjectiveModel::where('report', $id)->delete();
        MarketModel::where('report_id', $id)->delete();
        $report->delete();

        return redirect()->back()->with('success', 'Report and its related items deleted successfully.');
    }

    public function viewReport($report_id)
    {
        $report = ReportModel::with(['project.proponent'])->findOrFail($report_id);
        $this->authorize('view', $report);

        if (!$report->file_path || !Storage::disk('private')->exists($report->file_path)) {
            return redirect()->back()->with('error', 'Report file not found.');
        }

        return response()->file(Storage::disk('private')->path($report->file_path));
    }

    public function downloadReport($report_id)
    {
        $report = ReportModel::with(['project.proponent'])->findOrFail($report_id);
        $this->authorize('view', $report);

        if (!$report->file_path || !Storage::disk('private')->exists($report->file_path)) {
            return redirect()->back()->with('error', 'Report file not found.');
        }

        $filePath = Storage::disk('private')->path($report->file_path);

        return response()->download(
            $filePath,
            "Report_{$report->project->project_id}_{$report->report_id}.pdf"
        );
    }

    // ── Helper: sum all payment entries in a payments JSON array ─────────────────
    private function sumPayments(?array $payments): float
    {
        if (empty($payments)) {
            return 0.0;
        }

        return (float) collect($payments)->sum('amount');
    }

    private function docxSafe($value): string
    {
    	if ($value === null) {
            return '';
    	}

    	$value = (string) $value;

    	// Remove invalid XML control characters
    	$value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $value);

    	// Escape XML special characters: &, <, >, ", '
    	return htmlspecialchars($value, ENT_QUOTES | ENT_XML1, 'UTF-8');
    }

    private function generateReportFile($report_id)
    {
        // ── Load report with ALL needed relations upfront ─────────────────────────
        $report = ReportModel::with([
            'project.proponent',
            'project.refunds',
        ])->findOrFail($report_id);

        $project = $report->project;
        $proponent = $project->proponent;
        $refunds = $project->refunds;

        $implementIds = ImplementationModel::where('project_id', $project->project_id)->pluck('implement_id');
        $sum_cost = TagModel::whereIn('implement_id', $implementIds)->sum('tag_amount');

        // Products
        $products = ProductModel::where('report_id', $report_id)->get();

        // Gender data
        $newMale = $report->new_male ?? 0;
        $newFemale = $report->new_female ?? 0;
        $totalNew = $newMale + $newFemale;

        // Forward/Backward data
        $ifMale = $report->new_ifmale ?? 0;
        $ifFemale = $report->new_iffemale ?? 0;
        $ibMale = $report->new_ibmale ?? 0;
        $ibFemale = $report->new_ibfemale ?? 0;

        $forwardTotal = $ifMale + $ifFemale;
        $backwardTotal = $ibMale + $ibFemale;
        $overallTotal = $forwardTotal + $backwardTotal;

        $ownerName = $proponent->owner_name ?? 'N/A';

        // Phase One (Release Dates)
        $releaseInitial = $project->release_initial
            ? Carbon::parse($project->release_initial)->format('F Y')
            : 'N/A';
        $releaseEnd = $project->release_end
            ? Carbon::parse($project->release_end)->format('F Y')
            : 'N/A';
        $phaseOne = "$releaseInitial - $releaseEnd";

        // Phase Two (Refund Dates)
        $refundInitial = $project->refund_initial
            ? Carbon::parse($project->refund_initial)->format('F Y')
            : 'N/A';
        $refundEnd = $project->refund_end
            ? Carbon::parse($project->refund_end)->format('F Y')
            : 'N/A';
        $phaseTwo = "$refundInitial - $refundEnd";

        // ── SIMPLIFIED: Refund calculations ──────────────────────────────────────
        // Total Amount Release = Project Cost
        $totalAmountRelease = $project->project_cost;

        // Total Amount Refunded = sum of all payment amounts from refund records
        $totalAmountRefunded = $refunds->sum(function ($refund) {
            return $this->sumPayments(is_array($refund->payments) ? $refund->payments : []);
        });

        // Total Unsettled = Total Amount Release - Total Amount Refunded
        $totalUnsettled = $totalAmountRelease - $totalAmountRefunded;

        // For display - finding oldest unpaid/partial month
        $oldestUnpaid = $refunds
            ->whereIn('status', ['unpaid', 'partial'])
            ->sortBy('month_paid')
            ->first();

        $oldUnpaid = $oldestUnpaid
            ? Carbon::parse($oldestUnpaid->month_paid)->format('F Y')
            : 'N/A';

        // Total unpaid for current month (for display purposes)
        $totalUnpaid = $refunds
            ->whereIn('status', ['unpaid', 'partial'])
            ->where('month_paid', Carbon::now()->format('Y-m-01'))
            ->sum(function ($refund) {
                $paid = $this->sumPayments(is_array($refund->payments) ? $refund->payments : []);

                return max(0, ($refund->amount_due ?? 0) - $paid);
            });

        $currentDate = Carbon::parse($report->created_at)->format('F, Y');

        // ── Load Template ─────────────────────────────────────────────────────────
        $templatePath = storage_path('../public/templates/form.docx');

        if (!file_exists($templatePath)) {
            Log::error('Template file not found', ['path' => $templatePath]);
            throw new \Exception('Template file not found at: '.$templatePath);
        }

        $templateProcessor = new TemplateProcessor($templatePath);

        // Fill placeholder
        $templateProcessor->setValue('project_title', $this->docxSafe($project->project_title));
	$templateProcessor->setValue('owner_name', $this->docxSafe($ownerName));
	$templateProcessor->setValue('phase_one', $this->docxSafe($phaseOne));
	$templateProcessor->setValue('release_initial', $this->docxSafe($releaseInitial));
	$templateProcessor->setValue('phase_two', $this->docxSafe($phaseTwo));
	$templateProcessor->setValue('project_cost', $this->docxSafe(number_format($project->project_cost, 2)));
	$templateProcessor->setValue('util_remarks', $this->docxSafe($report->util_remarks));
	$templateProcessor->setValue('problems', $this->docxSafe($report->problems));
	$templateProcessor->setValue('actions', $this->docxSafe($report->actions));
	$templateProcessor->setValue('promotional', $this->docxSafe($report->promotional));
	$templateProcessor->setValue('sum_cost', $this->docxSafe(number_format($sum_cost, 2)));

	$templateProcessor->setValue('total_amount_release', $this->docxSafe(number_format($totalAmountRelease, 2)));
	$templateProcessor->setValue('total_amount_refunded', $this->docxSafe(number_format($totalAmountRefunded, 2)));
	$templateProcessor->setValue('total_unsettled', $this->docxSafe(number_format($totalUnsettled, 2)));

	$templateProcessor->setValue('current_date', $this->docxSafe($currentDate));
	$templateProcessor->setValue('total_unpaid', $this->docxSafe(number_format($totalUnpaid, 2)));
	$templateProcessor->setValue('old_unpaid', $this->docxSafe($oldUnpaid));

        $fontStyle = ['color' => '000000', 'size' => 11];
        $paraCenter = ['alignment' => Jc::CENTER];

        // ── Equipment Table ───────────────────────────────────────────────────────
        $approvedItems = ItemModel::where('project_id', $project->project_id)
            ->where('type', 'equipment')
            ->where('report', 'approved')
            ->get();

        $actualItems = ItemModel::where('project_id', $project->project_id)
            ->where('type', 'equipment')
            ->where('report', $report->report_id)
            ->get();

        $equipTable = new Table(['borderSize' => 6, 'borderColor' => '000000']);

        // Header Row 1
        $equipTable->addRow(500);
        $equipTable->addCell(3700, ['gridSpan' => 3, 'valign' => 'center'])
            ->addText('Approved Equipment', $fontStyle, $paraCenter);
        $equipTable->addCell(3700, ['gridSpan' => 3, 'valign' => 'center'])
            ->addText('Actual Acquired', $fontStyle, $paraCenter);
        $equipTable->addCell(1700, ['vMerge' => 'restart', 'valign' => 'center'])
            ->addText('Acknowledge', $fontStyle, $paraCenter);
        $equipTable->addCell(1500, ['vMerge' => 'restart', 'valign' => 'center'])
            ->addText('Remarks', $fontStyle, $paraCenter);

        // Header Row 2
        $equipTable->addRow(500);
        $equipTable->addCell(700, ['valign' => 'center'])->addText('Qty', $fontStyle, $paraCenter);
        $equipTable->addCell(1500, ['valign' => 'center'])->addText('Particulars', $fontStyle, $paraCenter);
        $equipTable->addCell(1500, ['valign' => 'center'])->addText('Cost', $fontStyle, $paraCenter);
        $equipTable->addCell(700, ['valign' => 'center'])->addText('Qty', $fontStyle, $paraCenter);
        $equipTable->addCell(1500, ['valign' => 'center'])->addText('Particulars', $fontStyle, $paraCenter);
        $equipTable->addCell(1500, ['valign' => 'center'])->addText('Cost', $fontStyle, $paraCenter);
        $equipTable->addCell(1700, ['vMerge' => 'continue']);
        $equipTable->addCell(1500, ['vMerge' => 'continue']);

        // Data Rows
        $maxRows = max($approvedItems->count(), $actualItems->count());
        for ($i = 0; $i < $maxRows; ++$i) {
            $equipTable->addRow(400);

            $approved = $approvedItems->get($i);
            $equipTable->addCell(700, ['valign' => 'center'])->addText($approved->quantity ?? '', $fontStyle);
            $equipTable->addCell(1500, ['valign' => 'center'])->addText(
                isset($approved) ? $approved->item_name.' - '.$approved->specifications : '',
                $fontStyle
            );
            $equipTable->addCell(1500, ['valign' => 'center'])->addText($approved->item_cost ?? '', $fontStyle);

            $actual = $actualItems->get($i);
            $equipTable->addCell(700, ['valign' => 'center'])->addText($actual->quantity ?? '', $fontStyle);
            $equipTable->addCell(1500, ['valign' => 'center'])->addText(
                isset($actual) ? $actual->item_name.' - '.$actual->specifications : '',
                $fontStyle
            );
            $equipTable->addCell(1500, ['valign' => 'center'])->addText($actual->item_cost ?? '', $fontStyle);
            $equipTable->addCell(1700, ['valign' => 'center'])->addText($actual->acknowledge ?? '', $fontStyle);
            $equipTable->addCell(1500, ['valign' => 'center'])->addText($actual->remarks ?? '', $fontStyle);
        }

        $templateProcessor->setComplexBlock('equipment_table', $equipTable);

        // ── Non-Equipment Table ───────────────────────────────────────────────────
        $approvedNonequip = ItemModel::where('project_id', $project->project_id)
            ->where('type', 'nonequip')
            ->where('report', 'approved')
            ->get();

        $actualNonequip = ItemModel::where('project_id', $project->project_id)
            ->where('type', 'nonequip')
            ->where('report', $report->report_id)
            ->get();

        $nonequipTable = new Table(['borderSize' => 6, 'borderColor' => '000000']);

        // Header Row 1
        $nonequipTable->addRow(500);
        $nonequipTable->addCell(3700, ['gridSpan' => 3, 'valign' => 'center'])
            ->addText('Approved Non-Equipment', $fontStyle, $paraCenter);
        $nonequipTable->addCell(3700, ['gridSpan' => 3, 'valign' => 'center'])
            ->addText('Actual Acquired', $fontStyle, $paraCenter);
        $nonequipTable->addCell(1700, ['vMerge' => 'restart', 'valign' => 'center'])
            ->addText('Acknowledge', $fontStyle, $paraCenter);
        $nonequipTable->addCell(1500, ['vMerge' => 'restart', 'valign' => 'center'])
            ->addText('Remarks', $fontStyle, $paraCenter);

        // Header Row 2
        $nonequipTable->addRow(500);
        $nonequipTable->addCell(700, ['valign' => 'center'])->addText('Qty', $fontStyle, $paraCenter);
        $nonequipTable->addCell(1500, ['valign' => 'center'])->addText('Particulars', $fontStyle, $paraCenter);
        $nonequipTable->addCell(1500, ['valign' => 'center'])->addText('Cost', $fontStyle, $paraCenter);
        $nonequipTable->addCell(700, ['valign' => 'center'])->addText('Qty', $fontStyle, $paraCenter);
        $nonequipTable->addCell(1500, ['valign' => 'center'])->addText('Particulars', $fontStyle, $paraCenter);
        $nonequipTable->addCell(1500, ['valign' => 'center'])->addText('Cost', $fontStyle, $paraCenter);
        $nonequipTable->addCell(1700, ['vMerge' => 'continue']);
        $nonequipTable->addCell(1500, ['vMerge' => 'continue']);

        // Data Rows
        $maxRowsNonequip = max($approvedNonequip->count(), $actualNonequip->count());
        for ($i = 0; $i < $maxRowsNonequip; ++$i) {
            $nonequipTable->addRow(400);

            $approved = $approvedNonequip->get($i);
            $nonequipTable->addCell(700, ['valign' => 'center'])->addText($approved->quantity ?? '', $fontStyle);
            $nonequipTable->addCell(1500, ['valign' => 'center'])->addText(
                isset($approved) ? $approved->item_name.' - '.$approved->specifications : '',
                $fontStyle
            );
            $nonequipTable->addCell(1500, ['valign' => 'center'])->addText($approved->item_cost ?? '', $fontStyle);

            $actual = $actualNonequip->get($i);
            $nonequipTable->addCell(700, ['valign' => 'center'])->addText($actual->quantity ?? '', $fontStyle);
            $nonequipTable->addCell(1500, ['valign' => 'center'])->addText(
                isset($actual) ? $actual->item_name.' - '.$actual->specifications : '',
                $fontStyle
            );
            $nonequipTable->addCell(1500, ['valign' => 'center'])->addText($actual->item_cost ?? '', $fontStyle);
            $nonequipTable->addCell(1700, ['valign' => 'center'])->addText($actual->acknowledge ?? '', $fontStyle);
            $nonequipTable->addCell(1500, ['valign' => 'center'])->addText($actual->remarks ?? '', $fontStyle);
        }

        $templateProcessor->setComplexBlock('nonequip_table', $nonequipTable);

        // ── Objectives Table ──────────────────────────────────────────────────────
        $objectiveTable = new Table([
            'borderSize' => 6,
            'borderColor' => '000000',
            'alignment' => Jc::CENTER,
        ]);

        $objectives = ObjectiveModel::where('project_id', $project->project_id)->get();
        $approvedObjectives = $objectives->where('report', 'approved');
        $actualObjectives = $objectives->where('report', $report->report_id);

        $objectiveTable->addRow();
        $objectiveTable->addCell(3500)->addText('Expected Output', $fontStyle, $paraCenter);
        $objectiveTable->addCell(3500)->addText('Actual Accomplishment', $fontStyle, $paraCenter);
        $objectiveTable->addCell(3500)->addText('Remarks / Justification', $fontStyle, $paraCenter);

        $maxRows = max($approvedObjectives->count(), $actualObjectives->count());
        if ($maxRows === 0) {
            $objectiveTable->addRow();
            $objectiveTable->addCell(3500)->addText('N/A', $fontStyle, $paraCenter);
            $objectiveTable->addCell(3500)->addText('N/A', $fontStyle, $paraCenter);
            $objectiveTable->addCell(3500)->addText('N/A', $fontStyle, $paraCenter);
        } else {
            for ($i = 0; $i < $maxRows; ++$i) {
                $objectiveTable->addRow();
                $objectiveTable->addCell(3500)->addText(
                    $approvedObjectives->values()->get($i)->details ?? '',
                    $fontStyle, $paraCenter
                );
                $objectiveTable->addCell(3500)->addText(
                    $actualObjectives->values()->get($i)->details ?? '',
                    $fontStyle, $paraCenter
                );
                $objectiveTable->addCell(3500)->addText(
                    $actualObjectives->values()->get($i)->remarks ?? '',
                    $fontStyle, $paraCenter
                );
            }
        }
        $templateProcessor->setComplexBlock('objective_table', $objectiveTable);

        // ── Markets Table ─────────────────────────────────────────────────────────
        $markets = MarketModel::where('project_id', $project->project_id)->get();
        $existingMarkets = $markets->where('type', 'existing');
        $newMarkets = $markets->where('type', 'new');

        $marketTable = new Table([
            'borderSize' => 6,
            'borderColor' => '000000',
            'alignment' => Jc::CENTER,
        ]);

        $marketTable->addRow();
        $marketTable->addCell(2000, ['vMerge' => 'restart'])->addText('Existing Market', $fontStyle, $paraCenter);
        $marketTable->addCell(7000, ['gridSpan' => 2])->addText('New Market', $fontStyle, $paraCenter);

        $marketTable->addRow();
        $marketTable->addCell(null, ['vMerge' => 'continue']);
        $marketTable->addCell(4500)->addText('Specify Place', $fontStyle, $paraCenter);
        $marketTable->addCell(2500)->addText('Effective Date', $fontStyle, $paraCenter);

        $maxRows = max($existingMarkets->count(), $newMarkets->count());
        if ($maxRows === 0) {
            $marketTable->addRow();
            $marketTable->addCell(2000)->addText('N/A', $fontStyle, $paraCenter);
            $marketTable->addCell(4500)->addText('N/A', $fontStyle, $paraCenter);
            $marketTable->addCell(2500)->addText('N/A', $fontStyle, $paraCenter);
        } else {
            for ($i = 0; $i < $maxRows; ++$i) {
                $marketTable->addRow();
                $marketTable->addCell(2000)->addText(
                    $existingMarkets->values()->get($i)->place_name ?? '',
                    $fontStyle, $paraCenter
                );
                $new = $newMarkets->values()->get($i);
                $marketTable->addCell(4500)->addText($new->place_name ?? '', $fontStyle, $paraCenter);
                $marketTable->addCell(2500)->addText(
                    isset($new->effective_date)
                        ? Carbon::parse($new->effective_date)->format('F d, Y')
                        : '',
                    $fontStyle, $paraCenter
                );
            }
        }
        $templateProcessor->setComplexBlock('market_table', $marketTable);

        // ── Products Table ────────────────────────────────────────────────────────
        $productTable = new Table(['borderSize' => 6, 'borderColor' => '000000', 'alignment' => Jc::CENTER]);
        $productTable->addRow();
        $productTable->addCell(3000)->addText('Product', $fontStyle, $paraCenter);
        $productTable->addCell(1500)->addText('Volume', $fontStyle, $paraCenter);
        $productTable->addCell(1500)->addText('Quarter', $fontStyle, $paraCenter);
        $productTable->addCell(2000)->addText('Gross Sales', $fontStyle, $paraCenter);
        foreach ($products as $prod) {
            $productTable->addRow();
            $productTable->addCell(3000)->addText($prod->product_name, $fontStyle, $paraCenter);
            $productTable->addCell(1500)->addText($prod->volume, $fontStyle, $paraCenter);
            $productTable->addCell(1500)->addText("Q$prod->quarter", $fontStyle, $paraCenter);
            $productTable->addCell(2000)->addText(number_format($prod->gross_sales, 2), $fontStyle, $paraCenter);
        }
        $templateProcessor->setComplexBlock('products_table', $productTable);

        // ── Gender Table ──────────────────────────────────────────────────────────
        $genderTable = new Table(['borderSize' => 6, 'borderColor' => '000000', 'alignment' => Jc::CENTER]);
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

        // ── Forward/Backward Table ────────────────────────────────────────────────
        $fbTable = new Table(['borderSize' => 6, 'borderColor' => '000000', 'alignment' => Jc::CENTER]);
        $fbTable->addRow();
        $fbTable->addCell(2000, ['vMerge' => 'restart'])->addText('Overall Total', $fontStyle, $paraCenter);
        $fbTable->addCell(3000, ['gridSpan' => 3])->addText('Forward', $fontStyle, $paraCenter);
        $fbTable->addCell(3000, ['gridSpan' => 3])->addText('Backward', $fontStyle, $paraCenter);
        $fbTable->addRow();
        $fbTable->addCell(2000, ['vMerge' => 'continue']);
        $fbTable->addCell(1000)->addText('Male', $fontStyle, $paraCenter);
        $fbTable->addCell(1000)->addText('Female', $fontStyle, $paraCenter);
        $fbTable->addCell(1000)->addText('Total', $fontStyle, $paraCenter);
        $fbTable->addCell(1000)->addText('Male', $fontStyle, $paraCenter);
        $fbTable->addCell(1000)->addText('Female', $fontStyle, $paraCenter);
        $fbTable->addCell(1000)->addText('Total', $fontStyle, $paraCenter);
        $fbTable->addRow();
        $fbTable->addCell(2000)->addText($overallTotal, $fontStyle, $paraCenter);
        $fbTable->addCell(1000)->addText($ifMale, $fontStyle, $paraCenter);
        $fbTable->addCell(1000)->addText($ifFemale, $fontStyle, $paraCenter);
        $fbTable->addCell(1000)->addText($forwardTotal, $fontStyle, $paraCenter);
        $fbTable->addCell(1000)->addText($ibMale, $fontStyle, $paraCenter);
        $fbTable->addCell(1000)->addText($ibFemale, $fontStyle, $paraCenter);
        $fbTable->addCell(1000)->addText($backwardTotal, $fontStyle, $paraCenter);
        $templateProcessor->setComplexBlock('newindirect_table', $fbTable);

        // ── Save DOCX to temp ─────────────────────────────────────────────────────
        $tempDir = sys_get_temp_dir().DIRECTORY_SEPARATOR.'reports_'.uniqid();
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0777, true);
        }

        $docxFilename = 'report_'.$project->project_id.'_'.$report->report_id.'_'.time().'.docx';
        $tempDocx = $tempDir.DIRECTORY_SEPARATOR.$docxFilename;

        Log::info('Saving DOCX file', ['path' => $tempDocx]);
        $templateProcessor->saveAs($tempDocx);

        if (!file_exists($tempDocx)) {
            Log::error('DOCX file was not created', ['path' => $tempDocx]);
            $this->cleanupTempDirectory($tempDir);
            throw new \Exception('Failed to create DOCX file');
        }

        Log::info('DOCX file created successfully', [
            'path' => $tempDocx,
            'size' => filesize($tempDocx),
        ]);

        // ── Find LibreOffice ──────────────────────────────────────────────────────
        $libreOfficePaths = [
            '/usr/bin/soffice',
            '/usr/bin/libreoffice',
            '/usr/local/bin/soffice',
            '/usr/local/bin/libreoffice',
            'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
            'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
            'C:\\Program Files\\LibreOffice\\program\\soffice.com',
            'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.com',
        ];

        $libreOfficePath = null;
        foreach ($libreOfficePaths as $path) {
            if (file_exists($path)) {
                $libreOfficePath = $path;
                break;
            }
        }

        if (!$libreOfficePath) {
            Log::error('LibreOffice not found');
            $this->cleanupTempDirectory($tempDir);
            throw new \Exception('LibreOffice not found. Please install LibreOffice.');
        }

        // ── Convert DOCX → PDF via LibreOffice ───────────────────────────────────
        $loProfile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'lo_profile_' . uniqid();
        mkdir($loProfile, 0777, true);

        $command = sprintf(
            'HOME=/tmp "%s" -env:UserInstallation=file://%s --headless --nologo --nofirststartwizard --convert-to pdf:writer_pdf_Export --outdir "%s" "%s"',
            $libreOfficePath,
            $loProfile,
            $tempDir,
            $tempDocx
        );

        Log::info('Executing conversion command', ['command' => $command]);

        $output = [];
        $returnCode = null;
        exec($command.' 2>&1', $output, $returnCode);
        Log::info('LibreOffice conversion finished', [
            'return_code' => $returnCode,
            'output' => $output,
            'temp_dir_contents_after_conversion' => is_dir($tempDir) ? scandir($tempDir) : [],
        ]);

        sleep(2);

        $pdfFilename = str_replace('.docx', '.pdf', $docxFilename);
        $tempPdf = $tempDir.DIRECTORY_SEPARATOR.$pdfFilename;

        if (!file_exists($tempPdf)) {
            $debugDocx = '/tmp/debug_report_'.$report->report_id.'.docx';

            if (file_exists($tempDocx)) {
                @copy($tempDocx, $debugDocx);
                @chmod($debugDocx, 0777);
            }

            Log::error('PDF file was not created', [
                'expected_path' => $tempPdf,
                'temp_docx' => $tempDocx,
                'debug_docx' => $debugDocx,
                'docx_exists' => file_exists($tempDocx),
                'docx_readable' => is_readable($tempDocx),
                'docx_size' => file_exists($tempDocx) ? filesize($tempDocx) : null,
                'debug_docx_exists' => file_exists($debugDocx),
                'debug_docx_size' => file_exists($debugDocx) ? filesize($debugDocx) : null,
                'temp_dir_contents' => is_dir($tempDir) ? scandir($tempDir) : [],
            ]);

            $this->cleanupTempDirectory($tempDir);
            throw new \Exception('PDF file was not created by LibreOffice.');
        }

        Log::info('PDF file created successfully', [
            'path' => $tempPdf,
            'size' => filesize($tempPdf),
        ]);

        // ── Store PDF locally ─────────────────────────────────────────────────────
        $currentYear = now()->year;
        $projectId = $project->project_id;
        $storagePath = "{$currentYear}/{$projectId}/reports/{$pdfFilename}";

        $reportsDir = storage_path("app/private/{$currentYear}/{$projectId}/reports");
        if (!is_dir($reportsDir)) {
            mkdir($reportsDir, 0777, true);
        }

        $pdfContent = file_get_contents($tempPdf);
        $stored = Storage::disk('private')->put($storagePath, $pdfContent);

        if (!$stored) {
            Log::error('Failed to store PDF');
            $this->cleanupTempDirectory($tempDir);
            throw new \Exception('Failed to store PDF in private storage');
        }

        Log::info('PDF stored locally', ['storage_path' => $storagePath]);

        // ── Upload to Supabase Storage (backup) ───────────────────────────────────
        try {
            $supabasePath = "backup/{$currentYear}/{$projectId}/reports/{$pdfFilename}";

            $supabaseUpload = new SupabaseUpload();
            $uploaded = $supabaseUpload->upload($supabasePath, $pdfContent);

            if ($uploaded) {
                Log::info('✓ Report PDF successfully uploaded to Supabase', [
                    'report_id' => $report_id,
                    'project_id' => $projectId,
                    'supabase_path' => $supabasePath,
                ]);
            } else {
                Log::warning('Supabase upload failed for report PDF, continuing anyway', [
                    'report_id' => $report_id,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Supabase upload error for report PDF', [
                'report_id' => $report_id,
                'error' => $e->getMessage(),
            ]);
            // Non-fatal — continue without backup
        }

        $this->cleanupTempDirectory($tempDir);

        return $storagePath;
    }

    private function cleanupTempDirectory($dir)
    {
        if (!is_dir($dir)) {
            return;
        }

        try {
            $files = array_diff(scandir($dir), ['.', '..']);
            foreach ($files as $file) {
                $path = $dir.DIRECTORY_SEPARATOR.$file;
                if (is_file($path)) {
                    @chmod($path, 0777);
                    @unlink($path);
                }
            }
            @rmdir($dir);
            Log::info('Cleaned up temp directory', ['dir' => $dir]);
        } catch (\Exception $e) {
            Log::warning('Failed to cleanup temp directory', [
                'dir' => $dir,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function create(ProjectModel $project)
    {
        $project->load([
            'proponent',
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

        Log::info('Creating new report - validated data received', ['validated' => $validated]);

        DB::beginTransaction();

        try {
            // Create the report
            $report = ReportModel::create([
                'project_id' => $validated['project_id'],
                'util_remarks' => $validated['util_remarks'] ?? null,
                'new_male' => $validated['new_male'] ?? 0,
                'new_female' => $validated['new_female'] ?? 0,
                'new_ifmale' => $validated['new_ifmale'] ?? 0,
                'new_iffemale' => $validated['new_iffemale'] ?? 0,
                'new_ibmale' => $validated['new_ibmale'] ?? 0,
                'new_ibfemale' => $validated['new_ibfemale'] ?? 0,
                'problems' => $validated['problems'] ?? null,
                'actions' => $validated['actions'] ?? null,
                'promotional' => $validated['promotional'] ?? null,
                'status' => 'submitted',
            ]);

            $reportId = $report->report_id;

            Log::debug('Report row inserted', [
                'report_id' => $reportId,
                'project_id' => $validated['project_id'],
            ]);

            // Save objectives
            if (!empty($validated['actual_accom'])) {
                foreach ($validated['actual_accom'] as $index => $accom) {
                    $remarks = $validated['actual_remarks'][$index] ?? null;

                    DB::table('tbl_objectives')->insert([
                        'project_id' => $validated['project_id'],
                        'report' => $reportId,
                        'details' => $accom,
                        'remarks' => $remarks,
                    ]);
                }
            }

            // Save products
            if (!empty($validated['products'])) {
                foreach ($validated['products'] as $i => $product) {
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
                foreach ($validated['markets_new'] as $i => $market) {
                    if (!empty($market['place_name'])) {
                        DB::table('tbl_markets')->insert([
                            'project_id' => $validated['project_id'],
                            'report_id' => $reportId,
                            'place_name' => $market['place_name'],
                            'effective_date' => $market['effective_date'],
                            'type' => 'new',
                        ]);
                    }
                }
            }

            // Save equipment actuals
            if (!empty($validated['equipments_actual'])) {
                $equipments = DB::table('tbl_items')
                    ->where('project_id', $validated['project_id'])
                    ->where('type', 'equipment')
                    ->where('report', 'approved')
                    ->get();

                foreach ($equipments as $index => $equipment) {
                    if (isset($validated['equipments_actual'][$index])) {
                        $actualData = $validated['equipments_actual'][$index];

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

            // Save non-equipment actuals
            if (!empty($validated['nonequipments_actual'])) {
                $nonequipments = DB::table('tbl_items')
                    ->where('project_id', $validated['project_id'])
                    ->where('type', 'nonequip')
                    ->where('report', 'approved')
                    ->get();

                foreach ($nonequipments as $index => $nonequipment) {
                    if (isset($validated['nonequipments_actual'][$index])) {
                        $actualData = $validated['nonequipments_actual'][$index];

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

            // Generate PDF
            try {
                $filePath = $this->generateReportFile($reportId);

                $report->file_path = $filePath;
                $report->save();

                Log::info('Report PDF generated and saved', [
                    'report_id' => $reportId,
                    'file_path' => $filePath,
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to generate PDF', [
                    'report_id' => $reportId,
                    'error' => $e->getMessage(),
                ]);
                // Non-fatal — report row is still saved
            }

            DB::commit();

            Log::notice('Report created successfully', [
                'project_id' => $validated['project_id'],
                'report_id' => $reportId,
            ]);

            return redirect()->route('reports.index')->with('success', 'Report created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to create report', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'data' => $validated,
            ]);

            return back()->withErrors(['error' => 'Failed to create report. Please check logs.']);
        }
    }
}
