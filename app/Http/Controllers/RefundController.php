<?php

namespace App\Http\Controllers;

use App\Models\ProjectModel;
use App\Models\RefundModel;
use App\Models\RestructureModel;
use App\Models\RestructureUpdateModel;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class RefundController extends Controller
{
    private const SHEET_NAMES = [
        1 => 'BUK',
        2 => 'CAM',
        3 => 'LDN',
        4 => 'MOC',
        5 => 'MOR',
    ];

    // ── Helper: refund amount for a month considering restructures ────────────

    private function getRefundAmountForMonth(ProjectModel $project, Carbon $monthDate)
    {
        $approvedRestructures = RestructureModel::where('project_id', $project->project_id)
            ->where('status', 'approved')
            ->get();

        foreach ($approvedRestructures as $restructure) {
            $updates = RestructureUpdateModel::where('restruct_id', $restructure->restruct_id)->get();
            foreach ($updates as $update) {
                $updateStart = Carbon::parse($update->update_start);
                $updateEnd = Carbon::parse($update->update_end);
                if ($monthDate->isBetween($updateStart, $updateEnd)) {
                    return $update->update_amount;
                }
            }
        }

        if ($project->refund_end && $monthDate->isSameMonth(Carbon::parse($project->refund_end))) {
            return $project->last_refund ?? 0;
        }

        return $project->refund_amount ?? 0;
    }

    // ── Helper: sum all payment entries in the payments JSON column ───────────

    private function sumPayments(?array $payments): float
    {
        if (empty($payments)) {
            return 0.0;
        }

        return (float) collect($payments)->sum('amount');
    }

    // ── Helper: get latest payment entry ─────────────────────────────────────

    private function latestPayment(?array $payments): ?array
    {
        if (empty($payments)) {
            return null;
        }

        return collect($payments)->last();
    }

    // ─────────────────────────────────────────────────────────────────────────

    public function index()
    {
        $user = Auth::user();

        $selectedMonth = request('month', now()->month);
        $selectedYear = request('year', now()->year);
        $search = request('search');
        $status = request('status');
        $office = request('office');
        $includeWithdrawn = request('include_withdrawn', false);
        $includeTerminated = request('include_terminated', false);
        $includeAll = request('include_all', false);
        $perPage = (int) request('perPage', 10);

        $perPage = in_array($perPage, [10, 20, 50, 100]) ? $perPage : 10;

        $isRPMO = in_array($user->role, ['rpmo', 'au']);

        $selectedDate = Carbon::create($selectedYear, $selectedMonth, 1);

        $availableYears = ProjectModel::query()
            ->whereNotNull('year_obligated')
            ->distinct()
            ->orderByDesc('year_obligated')
            ->pluck('year_obligated');

        $offices = $isRPMO
            ? \App\Models\OfficeModel::orderBy('office_name')->get(['office_id', 'office_name'])
            : collect();

        $csvSheets = collect(self::SHEET_NAMES)
            ->filter(fn ($name, $i) => !empty(env("REFUND_CSV_{$i}")))
            ->toArray();

        $projects = ProjectModel::with([
            'proponent.office',
            'refunds' => function ($q) use ($selectedDate, $status) {
                $q->with('editor')
                    ->whereMonth('month_paid', $selectedDate->month)
                    ->whereYear('month_paid', $selectedDate->year)
                    ->latest();

                if ($status && $status !== 'unpaid') {
                    $q->where('status', $status);
                }
            },
        ])
        ->when(!$includeAll, fn ($q) => $q
            ->whereDate('refund_initial', '<=', $selectedDate)
            ->whereDate('refund_end', '>=', $selectedDate)
        )

        ->when(!$includeAll && !$includeWithdrawn && !$includeTerminated, fn ($q) => $q->whereNotIn('progress', ['Withdrawn', 'Terminated']))
        ->when(!$includeAll && $includeWithdrawn && !$includeTerminated, fn ($q) => $q->where(fn ($q) => $q->whereNotIn('progress', ['Terminated'])->orWhereNull('progress')))
        ->when(!$includeAll && !$includeWithdrawn && $includeTerminated, fn ($q) => $q->where(fn ($q) => $q->whereNotIn('progress', ['Withdrawn'])->orWhereNull('progress')))

        ->when($isRPMO && $office, fn ($q) => $q->whereHas('proponent', fn ($q) => $q->where('office_id', $office)))

        ->when($search, function ($query, $search) {
            $query->where(function ($q) use ($search) {
                $q->where('project_title', 'like', "%{$search}%")
                    ->orWhere('project_id', 'like', "%{$search}%")
                    ->orWhereHas('proponent', fn ($q) => $q->where('company_name', 'like', "%{$search}%"));
            });
        })

->when($status && !$includeAll, function ($query) use ($selectedDate, $status) {
    if ($status === 'unpaid') {
        $query->where(function ($q) use ($selectedDate) {
            $q->whereDoesntHave('refunds', function ($subQ) use ($selectedDate) {
                $subQ->whereMonth('month_paid', $selectedDate->month)
                     ->whereYear('month_paid', $selectedDate->year);
            })
            ->orWhereHas('refunds', function ($subQ) use ($selectedDate) {
                $subQ->whereMonth('month_paid', $selectedDate->month)
                     ->whereYear('month_paid', $selectedDate->year)
                     ->where('status', 'unpaid');
            });
        });
    } else {
        $query->whereHas('refunds', function ($q) use ($selectedDate, $status) {
            $q->whereMonth('month_paid', $selectedDate->month)
              ->whereYear('month_paid', $selectedDate->year)
              ->where('status', $status);
        });
    }
})

        ->paginate($perPage)
        ->through(function ($project) use ($selectedDate) {
            $project->refund_amount = $this->getRefundAmountForMonth($project, $selectedDate);

            return $project;
        })
        ->withQueryString();

        return Inertia::render('Refunds/Index', [
            'projects' => $projects,
            'selectedMonth' => $selectedMonth,
            'selectedYear' => $selectedYear,
            'search' => $search,
            'selectedStatus' => $status,
            'selectedOffice' => $office,
            'includeWithdrawn' => (bool) $includeWithdrawn,
            'includeTerminated' => (bool) $includeTerminated,
            'availableYears' => $availableYears,
            'offices' => $offices,
            'csvSheets' => $csvSheets,
            'userRole' => $user->role,
            'includeAll' => (bool) $includeAll,
        ]);
    }

public function downloadProjectRefunds($projectId)
{
    // ── Load all needed relationships ─────────────────────────────────────
    $project = ProjectModel::with([
        'proponent.office',
        'refunds',
        'items',
    ])->findOrFail($projectId);

    [$months] = $this->buildMonthsArray($project);

    // ── Derived / computed fields ─────────────────────────────────────────

    $proponent = $project->proponent;

    // Full address
    $addressParts = array_filter([
        $proponent?->street,
        $proponent?->barangay,
        $proponent?->municipality,
        $proponent?->province,
    ]);
    $fullAddress = implode(', ', $addressParts);

    // Equipment cost — sum of items where type = 'equipment' (adjust if needed)
    $equipmentCost = $project->items
        ->where('type', 'equipment')
        ->sum('item_cost');

    // If your type column uses a different label, fall back to all items
    if ($equipmentCost == 0) {
        $equipmentCost = $project->items->sum('item_cost');
    }

    // ── Restructure groupings ─────────────────────────────────────────────
    // Collect all months with status 'restructured', sort them, then
    // group into consecutive runs. A new group starts when the gap
    // between two consecutive months is > 1 month OR the run exceeds 12 months.

    $restructuredMonths = collect($months)
        ->filter(fn ($m) => $m['status'] === 'restructured')
        ->pluck('month_date')
        ->map(fn ($d) => Carbon::parse($d))
        ->sort()
        ->values();

    $restructureGroups = []; // up to 5 groups: ['start' => Carbon, 'end' => Carbon]

    if ($restructuredMonths->isNotEmpty()) {
        $groupStart = $restructuredMonths->first();
        $groupEnd = $restructuredMonths->first();
        $groupMonths = 1;

        foreach ($restructuredMonths->slice(1) as $date) {
            $isConsecutive = $groupEnd->copy()->addMonth()->isSameMonth($date);
            $withinYear = $groupMonths < 12;

            if ($isConsecutive && $withinYear) {
                $groupEnd = $date;
                ++$groupMonths;
            } else {
                // Save current group and start a new one
                $restructureGroups[] = ['start' => $groupStart, 'end' => $groupEnd];
                $groupStart = $date;
                $groupEnd = $date;
                $groupMonths = 1;
            }
        }
        $restructureGroups[] = ['start' => $groupStart, 'end' => $groupEnd];
    }

    // Helper: format a group as "MMM YYYY – MMM YYYY" or blank
    $formatGroup = function (?array $group): string {
        if (!$group) {
            return '';
        }

        return $group['start']->format('M Y').' – '.$group['end']->format('M Y');
    };

    // ── Months past due ───────────────────────────────────────────────────
    // Count unpaid months from the last unpaid streak up to today
    $today = Carbon::now()->startOfMonth();
    $pastDueCount = 0;
    foreach (array_reverse($months) as $m) {
        $monthDate = Carbon::parse($m['month_date']);
        if ($monthDate->gt($today)) {
            continue;
        }               // skip future months
        if (in_array($m['status'], ['unpaid', 'partial'])) {
            ++$pastDueCount;
        } else {
            break;                                          // stop at first paid/restructured
        }
    }

    // ── Handle unexpended balance and create monthly rows ─────────────────
    $hasUnexpendedBalance = !is_null($project->unexpended_balance) && $project->unexpended_balance > 0;
    
    // Calculate initial account balance
    $amountOfAssistance = ($project->released_amount > 0)
        ? $project->released_amount
        : $project->project_cost ?? 0;
    
    $initialBalance = $hasUnexpendedBalance 
        ? $amountOfAssistance - $project->unexpended_balance
        : $amountOfAssistance;

    // Generate monthly rows based on refund_initial and refund_end
    $monthlyRows = [];
    if ($project->refund_initial && $project->refund_end) {
        $startDate = Carbon::parse($project->refund_initial)->startOfMonth();
        $endDate = Carbon::parse($project->refund_end)->startOfMonth();
        
        $currentDate = $startDate->copy();
        while ($currentDate->lte($endDate)) {
            $isLastMonth = $currentDate->isSameMonth($endDate);
            
            $monthlyRows[] = [
                'due_date' => $currentDate->format('F Y'),
                'month_date' => $currentDate->format('Y-m-01'),
                'monthly_due' => $isLastMonth ? ($project->last_refund ?? 0) : ($project->refund_amount ?? 0),
                'penalties' => 0, // You can calculate penalties here if needed
            ];
            
            $currentDate->addMonth();
        }
    }

    // Build refund data lookup from RefundModel
    $refundLookup = [];
    foreach ($project->refunds as $refund) {
        if ($refund->month_paid) {
            $monthKey = Carbon::parse($refund->month_paid)->format('Y-m-01');
            $refundLookup[$monthKey] = $refund;
        }
    }

    // ── All data ready — build the flat map for cell assignment ──────────
    $cellData = [
        // ── Header / project info ─────────────────────────────────────────
        'cooperator' => $proponent?->company_name ?? '',
        'project_title' => $project->project_title ?? '',
        'original_refund_schedule' => $project->refund_initial
                                    ? Carbon::parse($project->refund_initial)->format('F Y')
                                    : '',
        'cooperator_name' => $proponent?->owner_name ?? '',
        'address' => $fullAddress,

        // ── Restructure ranges (up to 5) ──────────────────────────────────
        'restructure_1' => $formatGroup($restructureGroups[0] ?? null),
        'restructure_2' => $formatGroup($restructureGroups[1] ?? null),
        'restructure_3' => $formatGroup($restructureGroups[2] ?? null),
        'restructure_4' => $formatGroup($restructureGroups[3] ?? null),
        'restructure_5' => $formatGroup($restructureGroups[4] ?? null),

        // ── Assistance / financial ────────────────────────────────────────
        'date_granted' => $project->fund_release
                                    ? Carbon::parse($project->fund_release)->format('F d, Y')
                                    : '',
        'amount_of_assistance' => $amountOfAssistance,
        'equipment_cost' => $equipmentCost,
        'province' => $proponent?->province ?? '',
        'project_status' => $project->progress ?? '',
        'unexpended_balance' => $project->unexpended_balance ?? null,

        // ── Past due & date ───────────────────────────────────────────────
        'months_past_due' => $pastDueCount,
        'date_today' => now()->format('F d, Y'),
    ];

    // ── Load template & populate ──────────────────────────────────────────
    $templatePath = public_path('templates/refund_template.xlsx');
    $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($templatePath);
    $sheet = $spreadsheet->getActiveSheet();

    // ── REPLACE THESE CELL REFERENCES WITH YOUR ACTUAL TEMPLATE CELLS ─────
    // Header cells
    $sheet->setCellValue('F11', $cellData['cooperator']);
    $sheet->setCellValue('F12', $cellData['project_title']);
    $sheet->setCellValue('F13', $cellData['original_refund_schedule']);
    $sheet->setCellValue('F14', $cellData['cooperator_name']);
    $sheet->setCellValue('F15', $cellData['address']);

    // Restructure rows
    $sheet->setCellValue('F17', $cellData['restructure_1']);
    $sheet->setCellValue('F18', $cellData['restructure_2']);
    $sheet->setCellValue('F19', $cellData['restructure_3']);
    $sheet->setCellValue('F20', $cellData['restructure_4']);
    $sheet->setCellValue('F21', $cellData['restructure_5']);

    // Assistance / financial
    $sheet->setCellValue('T11', $cellData['date_granted']);
    $sheet->setCellValue('T12', $cellData['amount_of_assistance']);
    $sheet->setCellValue('T13', $cellData['equipment_cost']);
    $sheet->setCellValue('T15', $cellData['province']);
    $sheet->setCellValue('T20', $cellData['project_status']);
    $sheet->setCellValue('T21', $cellData['months_past_due']);
    $sheet->setCellValue('AC8', $cellData['date_today']);

    // Get border style
    $borderStyle = [
        'borders' => [
            'allBorders' => [
                'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                'color' => ['rgb' => '000000'],
            ],
        ],
    ];

    // Currency format for PHP (Philippine Peso)
    $currencyFormat = '"₱"#,##0.00_);("₱"#,##0.00)';
    
    // Currency format style
    $currencyStyle = [
        'numberFormat' => [
            'formatCode' => $currencyFormat,
        ],
        'borders' => [
            'allBorders' => [
                'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                'color' => ['rgb' => '000000'],
            ],
        ],
    ];

    // Light blue background style
    $lightBlueStyle = [
        'fill' => [
            'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
            'startColor' => ['rgb' => 'ADD8E6'], // Light blue
        ],
        'borders' => [
            'allBorders' => [
                'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                'color' => ['rgb' => '000000'],
            ],
        ],
    ];

// ── Row 24: Initial AE cell with T12 data (FULL amount of assistance) ──
$row24 = 24;

// Merge AE24 to AI24 and set value with currency formatting (FULL amount)
$sheet->mergeCells("AE{$row24}:AI{$row24}");
$sheet->setCellValue("AE{$row24}", $amountOfAssistance); // Full amount, not initialBalance
$sheet->getStyle("AE{$row24}:AI{$row24}")->applyFromArray($currencyStyle);

// ── Add unexpended balance row (always at row 25 if exists) ────────────
$currentRow = 25;

if ($hasUnexpendedBalance) {
    // Calculate balance after unexpended deduction
    $balanceAfterUnexpended = $amountOfAssistance - $cellData['unexpended_balance'];
    
    // Merge A25:B25 for label (empty)
    $sheet->mergeCells("A{$currentRow}:B{$currentRow}");
    $sheet->setCellValue("A{$currentRow}", '');
    $sheet->getStyle("A{$currentRow}:B{$currentRow}")->applyFromArray($borderStyle);
    
    // Merge C25:E25 for "Unexpended Balance"
    $sheet->mergeCells("C{$currentRow}:E{$currentRow}");
    $sheet->setCellValue("C{$currentRow}", 'Unexpended Balance');
    $sheet->getStyle("C{$currentRow}:E{$currentRow}")->applyFromArray($borderStyle);
    
    // Merge F25:H25: Monthly Due (empty)
    $sheet->mergeCells("F{$currentRow}:H{$currentRow}");
    $sheet->getStyle("F{$currentRow}:H{$currentRow}")->applyFromArray($borderStyle);
    
    // Merge I25:J25: Show unexpended balance amount in Payments column
    $sheet->mergeCells("I{$currentRow}:J{$currentRow}");
    $sheet->setCellValue("I{$currentRow}", $cellData['unexpended_balance']);
    $sheet->getStyle("I{$currentRow}:J{$currentRow}")->applyFromArray($currencyStyle);
    
    // Merge K25:M25: Penalties (empty)
    $sheet->mergeCells("K{$currentRow}:M{$currentRow}");
    $sheet->getStyle("K{$currentRow}:M{$currentRow}")->applyFromArray($borderStyle);
    
    // Merge N25:P25: OR Date (empty)
    $sheet->mergeCells("N{$currentRow}:P{$currentRow}");
    $sheet->getStyle("N{$currentRow}:P{$currentRow}")->applyFromArray($borderStyle);
    
    // Merge Q25:S25: OR Number (empty)
    $sheet->mergeCells("Q{$currentRow}:S{$currentRow}");
    $sheet->getStyle("Q{$currentRow}:S{$currentRow}")->applyFromArray($borderStyle);
    
    // Merge T25:V25: Name of Bank (empty)
    $sheet->mergeCells("T{$currentRow}:V{$currentRow}");
    $sheet->getStyle("T{$currentRow}:V{$currentRow}")->applyFromArray($borderStyle);
    
    // Merge W25:Z25: Check No. (empty)
    $sheet->mergeCells("W{$currentRow}:Z{$currentRow}");
    $sheet->getStyle("W{$currentRow}:Z{$currentRow}")->applyFromArray($borderStyle);
    
    // Merge AA25:AD25: Check Date (empty)
    $sheet->mergeCells("AA{$currentRow}:AD{$currentRow}");
    $sheet->getStyle("AA{$currentRow}:AD{$currentRow}")->applyFromArray($borderStyle);
    
    // Merge AE25:AI25: Account Balance (balance after unexpended deduction)
    $sheet->mergeCells("AE{$currentRow}:AI{$currentRow}");
    $sheet->setCellValue("AE{$currentRow}", $balanceAfterUnexpended);
    $sheet->getStyle("AE{$currentRow}:AI{$currentRow}")->applyFromArray($currencyStyle);
    
    $currentRow++;
}

// ── Monthly refund rows ───────────────────────────────────────────────
// Start running balance from the FULL amount of assistance
$runningBalance = $amountOfAssistance;
$totalPayments = 0;
$totalMonthlyDue = 0;
$totalPenalties = 0;

// If there's unexpended balance, subtract it from running balance FIRST
if ($hasUnexpendedBalance) {
    $runningBalance -= $cellData['unexpended_balance'];
}

foreach ($monthlyRows as $index => $row) {
    $refund = $refundLookup[$row['month_date']] ?? null;
    
    // Determine status and particular text
    $status = $refund?->status ?? 'unpaid';
    $particular = '';
    $monthlyDueAmount = $row['monthly_due']; // Default to regular amount
    
    if ($status === 'restructured') {
        // Find which restructure group this month belongs to
        $monthCarbon = Carbon::parse($row['month_date']);
        $groupNumber = null;
        foreach ($restructureGroups as $groupIdx => $group) {
            if ($monthCarbon->between($group['start'], $group['end'])) {
                $groupNumber = $groupIdx + 1;
                break;
            }
        }
        $ordinal = $this->getOrdinalNumber($groupNumber ?? 1);
        $particular = "{$ordinal} Restructuring";
        // Set monthly due to 0 for restructured months
        $monthlyDueAmount = 0;
    } else {
        $particular = 'Refund';
    }
    
    // Get payment details from the latest payment
    $paymentAmount = 0;
    $orNumber = '';
    $orDate = '';
    $checkNumber = '';
    $checkDate = '';
    $bankName = '';
    
    if ($refund && $refund->payments) {
        $paymentAmount = (float) collect($refund->payments)->sum('amount');
        $latestPayment = $refund->getLatestPaymentAttribute();
        
        // Map payment fields according to the updated structure
        $orNumber = $latestPayment['receipt_num'] ?? '';
        $orDate = $latestPayment['receipt_date'] ?? '';
        $checkNumber = $latestPayment['check_num'] ?? '';
        $checkDate = $latestPayment['check_date'] ?? '';
        $bankName = $latestPayment['bank_name'] ?? '';
    }
    
    // Accumulate totals (only add monthly due if not restructured)
    $totalPayments += $paymentAmount;
    if ($status !== 'restructured') {
        $totalMonthlyDue += $row['monthly_due'];
    }
    $totalPenalties += $row['penalties'];
    
    // Update running balance (subtract payment)
    $runningBalance -= $paymentAmount;
    
    // Merge A-B: Due Date
    $sheet->mergeCells("A{$currentRow}:B{$currentRow}");
    $sheet->setCellValue("A{$currentRow}", $row['due_date']);
    $sheet->getStyle("A{$currentRow}:B{$currentRow}")->applyFromArray($borderStyle);
    
    // Merge C-E: Particular
    $sheet->mergeCells("C{$currentRow}:E{$currentRow}");
    $sheet->setCellValue("C{$currentRow}", $particular);
    $sheet->getStyle("C{$currentRow}:E{$currentRow}")->applyFromArray($borderStyle);
    
    // Merge F-H: Monthly Due with currency formatting (0 for restructured)
    $sheet->mergeCells("F{$currentRow}:H{$currentRow}");
    $sheet->setCellValue("F{$currentRow}", $monthlyDueAmount);
    $sheet->getStyle("F{$currentRow}:H{$currentRow}")->applyFromArray($currencyStyle);
    
    // Merge I-J: Payment with currency formatting
    $sheet->mergeCells("I{$currentRow}:J{$currentRow}");
    $sheet->setCellValue("I{$currentRow}", $paymentAmount > 0 ? $paymentAmount : '');
    $sheet->getStyle("I{$currentRow}:J{$currentRow}")->applyFromArray($currencyStyle);
    
    // Merge K-M: Penalties with currency formatting
    $sheet->mergeCells("K{$currentRow}:M{$currentRow}");
    $sheet->setCellValue("K{$currentRow}", $row['penalties'] > 0 ? $row['penalties'] : '');
    $sheet->getStyle("K{$currentRow}:M{$currentRow}")->applyFromArray($currencyStyle);
    
    // Merge N-P: OR Date
    $sheet->mergeCells("N{$currentRow}:P{$currentRow}");
    $sheet->setCellValue("N{$currentRow}", $orDate);
    $sheet->getStyle("N{$currentRow}:P{$currentRow}")->applyFromArray($borderStyle);
    
    // Merge Q-S: OR Number
    $sheet->mergeCells("Q{$currentRow}:S{$currentRow}");
    $sheet->setCellValue("Q{$currentRow}", $orNumber);
    $sheet->getStyle("Q{$currentRow}:S{$currentRow}")->applyFromArray($borderStyle);
    
    // Merge T-V: Name of Bank
    $sheet->mergeCells("T{$currentRow}:V{$currentRow}");
    $sheet->setCellValue("T{$currentRow}", $bankName);
    $sheet->getStyle("T{$currentRow}:V{$currentRow}")->applyFromArray($borderStyle);
    
    // Merge W-Z: Check No.
    $sheet->mergeCells("W{$currentRow}:Z{$currentRow}");
    $sheet->setCellValue("W{$currentRow}", $checkNumber);
    $sheet->getStyle("W{$currentRow}:Z{$currentRow}")->applyFromArray($borderStyle);
    
    // Merge AA-AD: Check Date
    $sheet->mergeCells("AA{$currentRow}:AD{$currentRow}");
    $sheet->setCellValue("AA{$currentRow}", $checkDate);
    $sheet->getStyle("AA{$currentRow}:AD{$currentRow}")->applyFromArray($borderStyle);
    
    // Merge AE-AI: Account Balance with currency formatting
    $sheet->mergeCells("AE{$currentRow}:AI{$currentRow}");
    $sheet->setCellValue("AE{$currentRow}", $runningBalance);
    $sheet->getStyle("AE{$currentRow}:AI{$currentRow}")->applyFromArray($currencyStyle);
    
    $currentRow++;
}
    
    // ── Summary Rows ──────────────────────────────────────────────────────
    if (!empty($monthlyRows)) {
        // Row for Total Payments, Monthly Due Total, and Total Penalties
        $summaryRow1 = $currentRow;
        
        // Leave A-B empty or merge as empty
        $sheet->mergeCells("A{$summaryRow1}:B{$summaryRow1}");
        $sheet->getStyle("A{$summaryRow1}:B{$summaryRow1}")->applyFromArray($lightBlueStyle);
        
        // Merge C-E as empty
        $sheet->mergeCells("C{$summaryRow1}:E{$summaryRow1}");
        $sheet->getStyle("C{$summaryRow1}:E{$summaryRow1}")->applyFromArray($lightBlueStyle);
        
        // Merge F-H: Total Monthly Due with currency formatting
        $sheet->mergeCells("F{$summaryRow1}:H{$summaryRow1}");
        $sheet->setCellValue("F{$summaryRow1}", $totalMonthlyDue);
        $sheet->getStyle("F{$summaryRow1}:H{$summaryRow1}")->applyFromArray($lightBlueStyle);
        $sheet->getStyle("F{$summaryRow1}:H{$summaryRow1}")->getNumberFormat()->setFormatCode($currencyFormat);
        
        // Merge I-J: Total Payments with currency formatting
        $sheet->mergeCells("I{$summaryRow1}:J{$summaryRow1}");
        $sheet->setCellValue("I{$summaryRow1}", $totalPayments);
        $sheet->getStyle("I{$summaryRow1}:J{$summaryRow1}")->applyFromArray($lightBlueStyle);
        $sheet->getStyle("I{$summaryRow1}:J{$summaryRow1}")->getNumberFormat()->setFormatCode($currencyFormat);
        
        // Merge K-M: Total Penalties with currency formatting
        $sheet->mergeCells("K{$summaryRow1}:M{$summaryRow1}");
        $sheet->setCellValue("K{$summaryRow1}", $totalPenalties);
        $sheet->getStyle("K{$summaryRow1}:M{$summaryRow1}")->applyFromArray($lightBlueStyle);
        $sheet->getStyle("K{$summaryRow1}:M{$summaryRow1}")->getNumberFormat()->setFormatCode($currencyFormat);
        
        // Merge N-P as empty
        $sheet->mergeCells("N{$summaryRow1}:P{$summaryRow1}");
        $sheet->getStyle("N{$summaryRow1}:P{$summaryRow1}")->applyFromArray($lightBlueStyle);
        
        // Merge Q-S as empty
        $sheet->mergeCells("Q{$summaryRow1}:S{$summaryRow1}");
        $sheet->getStyle("Q{$summaryRow1}:S{$summaryRow1}")->applyFromArray($lightBlueStyle);
        
        // Merge T-V as empty
        $sheet->mergeCells("T{$summaryRow1}:V{$summaryRow1}");
        $sheet->getStyle("T{$summaryRow1}:V{$summaryRow1}")->applyFromArray($lightBlueStyle);
        
        // Merge W-Z as empty
        $sheet->mergeCells("W{$summaryRow1}:Z{$summaryRow1}");
        $sheet->getStyle("W{$summaryRow1}:Z{$summaryRow1}")->applyFromArray($lightBlueStyle);
        
        // Merge AA-AD as empty
        $sheet->mergeCells("AA{$summaryRow1}:AD{$summaryRow1}");
        $sheet->getStyle("AA{$summaryRow1}:AD{$summaryRow1}")->applyFromArray($lightBlueStyle);
        
        // Merge AE-AI as empty
        $sheet->mergeCells("AE{$summaryRow1}:AI{$summaryRow1}");
        $sheet->getStyle("AE{$summaryRow1}:AI{$summaryRow1}")->applyFromArray($lightBlueStyle);
        
        // Row for Grand Total
        $summaryRow2 = $summaryRow1 + 1;
        
        // Merge A-AD for label
        $sheet->mergeCells("A{$summaryRow2}:AD{$summaryRow2}");
        $sheet->setCellValue("A{$summaryRow2}", 'GRAND TOTAL');
        $sheet->getStyle("A{$summaryRow2}:AD{$summaryRow2}")->applyFromArray($lightBlueStyle);
        // Make the text bold
        $sheet->getStyle("A{$summaryRow2}:AD{$summaryRow2}")->getFont()->setBold(true);
        
        // Merge AE-AI for remaining account balance with currency formatting
        $sheet->mergeCells("AE{$summaryRow2}:AI{$summaryRow2}");
        $sheet->setCellValue("AE{$summaryRow2}", $runningBalance);
        $sheet->getStyle("AE{$summaryRow2}:AI{$summaryRow2}")->applyFromArray($lightBlueStyle);
        $sheet->getStyle("AE{$summaryRow2}:AI{$summaryRow2}")->getNumberFormat()->setFormatCode($currencyFormat);
        $sheet->getStyle("AE{$summaryRow2}:AI{$summaryRow2}")->getFont()->setBold(true);
        
        // ── Set values in AL column ───────────────────────────────────────────
        // AL14: Total Payments
        $sheet->setCellValue('AL14', $totalPayments);
        $sheet->getStyle('AL14')->applyFromArray($currencyStyle);
        
        // AL17: Total Penalties (0 if no data)
        $penaltiesValue = $totalPenalties > 0 ? $totalPenalties : 0;
        $sheet->setCellValue('AL17', $penaltiesValue);
        $sheet->getStyle('AL17')->applyFromArray($currencyStyle);
    }
    
    // Also apply currency formatting to T12 (Amount of Assistance) and T13 (Equipment Cost)
    $sheet->getStyle('T12')->getNumberFormat()->setFormatCode($currencyFormat);
    $sheet->getStyle('T13')->getNumberFormat()->setFormatCode($currencyFormat);
    
    // Apply borders to T12 and T13 as well
    $sheet->getStyle('T12')->applyFromArray($borderStyle);
    $sheet->getStyle('T13')->applyFromArray($borderStyle);

    // ── Stream to browser ─────────────────────────────────────────────────
    $filename = "{$projectId}_refunds.xlsx";
    $writer = \PhpOffice\PhpSpreadsheet\IOFactory::createWriter($spreadsheet, 'Xlsx');

    return response()->stream(
        fn () => $writer->save('php://output'),
        200,
        [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control' => 'max-age=0',
        ]
    );
}

/**
 * Helper function to get ordinal number (1st, 2nd, 3rd, 4th, 5th)
 */
private function getOrdinalNumber($number)
{
    $suffixes = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'];
    
    if ($number % 100 >= 11 && $number % 100 <= 13) {
        return $number . 'th';
    }
    
    return $number . $suffixes[$number % 10];
}
    // ── Project refund history ────────────────────────────────────────────────

    public function projectRefunds($projectId)
    {
        $user = Auth::user();

        try {
            $project = ProjectModel::with(['proponent', 'refunds'])->findOrFail($projectId);

            [$months, $summary] = $this->buildMonthsArray($project);

            return Inertia::render('Refunds/Details', [
                'userRole' => $user->role,
                'project' => $this->formatProject($project),
                'months' => $months,
                'summary' => $summary,
            ]);
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to load project refund history. Please try again.');
        }
    }

    // ── Save single refund entry (append payment) ─────────────────────────────

    public function save()
    {
        $data = request()->validate([
            'project_id' => 'required|exists:tbl_projects,project_id',
            'amount_due' => 'nullable|numeric|min:0',
            'status' => 'required|in:paid,unpaid,restructured,partial',
            'save_date' => 'required|date_format:Y-m-d',
            // new payment entry
            'amount' => 'nullable|numeric|min:0',
            'bank_name' => 'nullable|string|max:200',
            'check_num' => 'nullable|string|max:20',
            'check_date' => 'nullable|date_format:Y-m-d',
            'receipt_num' => 'nullable|string|max:20',
            'receipt_date' => 'nullable|date_format:Y-m-d',
            // existing payments being edited
            'existing_payments' => 'nullable|array',
            'existing_payments.*.amount' => 'nullable|numeric|min:0',
            'existing_payments.*.bank_name' => 'nullable|string|max:200',
            'existing_payments.*.check_num' => 'nullable|string|max:20',
            'existing_payments.*.check_date' => 'nullable|date_format:Y-m-d',
            'existing_payments.*.receipt_num' => 'nullable|string|max:20',
            'existing_payments.*.receipt_date' => 'nullable|date_format:Y-m-d',
        ]);

        try {
            $savedMonthDate = Carbon::parse($data['save_date'])->startOfMonth()->format('Y-m-d');
            $readableMonth = Carbon::parse($data['save_date'])->format('F Y');

            $project = ProjectModel::with('refunds')->find($data['project_id']);
            if (!$project) {
                return back()->with('error', 'Project not found.');
            }

            $refundEnd = Carbon::parse($project->refund_end)->startOfMonth()->format('Y-m-d');

            // Completion check (unchanged)
            $completionCheck = null;
            if ($savedMonthDate === $refundEnd) {
                if ($data['status'] === 'paid') {
                    $completionCheck = $project->checkRefundCompletionWithNewEntry(
                        $savedMonthDate, $data['status']
                    );
                    if (!$completionCheck['is_complete']) {
                        return back()->with('warning', [
                            'message' => 'Cannot update project status. The following months remain unpaid:',
                            'unpaid_months' => $completionCheck['unpaid_months'],
                            'project_title' => $project->project_title,
                            'refund_initial' => Carbon::parse($project->refund_initial)->format('F Y'),
                            'refund_end' => Carbon::parse($project->refund_end)->format('F Y'),
                            'action' => 'Please ensure all months between '.
                                Carbon::parse($project->refund_initial)->format('F Y').
                                ' and '.Carbon::parse($project->refund_end)->format('F Y').
                                ' are paid before completing the project.',
                        ])->withInput();
                    }
                } elseif (!in_array($data['status'], ['partial'])) {
                    return back()
                        ->with('error', 'The final refund month must be marked as "Paid" to complete the project.')
                        ->withInput();
                }
            }

            $refund = RefundModel::firstOrNew([
                'project_id' => $data['project_id'],
                'month_paid' => $savedMonthDate,
            ]);

            $existingStatus = $refund->exists ? $refund->status : null;
            $statusChanged = $existingStatus !== $data['status'];

            if ($data['status'] === 'restructured') {
                $refund->payments = [];
                $refund->amount_due = 0;
            } else {
                //  Replace the full payments array with edited existing entries
                $updatedPayments = [];
                foreach ($data['existing_payments'] ?? [] as $ep) {
                    $amount = (float) ($ep['amount'] ?? 0);
                    if ($amount <= 0) {
                        continue;
                    }          // drop zero-amount rows
                    $updatedPayments[] = [
                        'amount' => $amount,
                        'bank_name' => $ep['bank_name'] ?? null,
                        'check_num' => $ep['check_num'] ?? null,
                        'check_date' => $ep['check_date'] ?? null,   // ← was missing
                        'receipt_num' => $ep['receipt_num'] ?? null,
                        'receipt_date' => $ep['receipt_date'] ?? null,   // ← was missing
                        'saved_at' => now()->toDateTimeString(),
                    ];
                }

                //  Append the new payment row (if amount > 0)
                $newAmount = (float) ($data['amount'] ?? 0);
                if ($newAmount > 0) {
                    $updatedPayments[] = [
                        'amount' => $newAmount,
                        'bank_name' => $data['bank_name'] ?? null,
                        'check_num' => $data['check_num'] ?? null,
                        'check_date' => $data['check_date'] ?? null,   // ← was missing
                        'receipt_num' => $data['receipt_num'] ?? null,
                        'receipt_date' => $data['receipt_date'] ?? null,   // ← was missing
                        'saved_at' => now()->toDateTimeString(),
                    ];
                }

                $refund->payments = $updatedPayments ?: null;
                $refund->amount_due = $data['amount_due'] ?? 0;
            }

            $refund->status = $data['status'];
            $refund->updated_by = Auth::id();
            $refund->save();

            if ($savedMonthDate === $refundEnd && ($completionCheck['is_complete'] ?? false)) {
                $project->update(['progress' => 'Completed']);
            }

            // Email notification (unchanged)
            $proponent = $project->proponent ?? null;
            if ($proponent?->email && $statusChanged) {
                try {
                    $totalAmount = collect($updatedPayments ?? [])->sum('amount');
                    Mail::to($proponent->email)->send(
                        new \App\Mail\RefundNotificationMail(
                            $proponent->owner_name ?? 'Valued Client',
                            $project->project_title ?? 'N/A',
                            $proponent->company_name ?? 'N/A',
                            $readableMonth,
                            $data['status'],
                            $data['amount_due'] ?? 0,
                            $totalAmount,
                            $data['amount_due'] ?? 0,
                            $data['check_num'] ?? null,
                            $data['receipt_num'] ?? null,
                            $data['check_date'] ?? null,
                            $data['receipt_date'] ?? null,
                        )
                    );
                    if ($savedMonthDate === $refundEnd && ($completionCheck['is_complete'] ?? false)) {
                        Mail::to($proponent->email)->send(
                            new \App\Mail\RefundCompletedMail(
                                $project->project_id,
                                now()->format('F d, Y \a\t h:i A')
                            )
                        );
                    }
                } catch (\Exception $e) {
                    Log::error("Failed to send refund email to {$proponent->email}: ".$e->getMessage());
                }
            }

            return back()->with('preserveScroll', true);
        } catch (\Exception $e) {
            return back()->with('error', 'An error occurred while saving: '.$e->getMessage());
        }
    }
    // ── Remove a specific payment entry from a refund ─────────────────────────

    // ── Update a specific payment entry ─────────────────────────────────────────

public function updatePayment()
{
    $data = request()->validate([
        'project_id' => 'required|exists:tbl_projects,project_id',
        'month_paid' => 'required|date_format:Y-m-d',
        'payment_index' => 'required|integer|min:0',
        'amount' => 'nullable|numeric|min:0',
        'bank_name' => 'nullable|string|max:200',
        'check_num' => 'nullable|string|max:20',
        'check_date' => 'nullable|date_format:Y-m-d',
        'receipt_num' => 'nullable|string|max:20',
        'receipt_date' => 'nullable|date_format:Y-m-d',
    ]);

    try {
        $refund = RefundModel::where('project_id', $data['project_id'])
            ->where('month_paid', $data['month_paid'])
            ->firstOrFail();

        $payments = $refund->payments ?? [];
        
        if (!isset($payments[$data['payment_index']])) {
            return back()->with('error', 'Payment entry not found.');
        }

        // Update the specific payment entry
        $payments[$data['payment_index']] = [
            'amount' => (float) ($data['amount'] ?? 0),
            'bank_name' => $data['bank_name'] ?? null,
            'check_num' => $data['check_num'] ?? null,
            'check_date' => $data['check_date'] ?? null,
            'receipt_num' => $data['receipt_num'] ?? null,
            'receipt_date' => $data['receipt_date'] ?? null,
            'saved_at' => now()->toDateTimeString(),
        ];

        // Remove payment if amount is 0
        if ((float) ($data['amount'] ?? 0) <= 0) {
            unset($payments[$data['payment_index']]);
            $payments = array_values($payments); // Re-index array
        }

        $refund->payments = !empty($payments) ? $payments : null;
        
        // Update status based on payments
        $totalPaid = collect($payments)->sum('amount');
        if ($totalPaid <= 0) {
            $refund->status = RefundModel::STATUS_UNPAID;
        } elseif ($totalPaid >= ($refund->amount_due ?? 0)) {
            $refund->status = RefundModel::STATUS_PAID;
        } else {
            $refund->status = RefundModel::STATUS_PARTIAL;
        }
        
        $refund->updated_by = Auth::id();
        $refund->save();

        return back()->with('success', 'Payment entry updated successfully.');
    } catch (\Exception $e) {
        return back()->with('error', 'Failed to update payment: ' . $e->getMessage());
    }
}
    public function removePayment()
    {
        $data = request()->validate([
            'project_id' => 'required|exists:tbl_projects,project_id',
            'month_paid' => 'required|date_format:Y-m-d',
            'payment_index' => 'required|integer|min:0',
        ]);

        try {
            $refund = RefundModel::where('project_id', $data['project_id'])
                ->where('month_paid', $data['month_paid'])
                ->firstOrFail();

            $refund->removePayment($data['payment_index']);

            if (empty($refund->payments)) {
                $refund->status = RefundModel::STATUS_UNPAID;
            }

            $refund->updated_by = Auth::id();
            $refund->save();

            return back()->with('success', 'Payment entry removed.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to remove payment: '.$e->getMessage());
        }
    }

    // ── User-facing refund list ───────────────────────────────────────────────

    public function userRefunds()
    {
        $userId = Auth::id();
        $search = request('search');
        $year = request('year');

        $projects = ProjectModel::with(['proponent', 'refunds'])
            ->whereHas('proponent', fn ($q) => $q->where('added_by', $userId))
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('project_title', 'like', "%{$search}%")
                        ->orWhereHas('proponent', fn ($q) => $q->where('company_name', 'like', "%{$search}%"));
                });
            })
            ->when($year, fn ($query, $year) => $query->where('year_obligated', $year))
            ->get()
            ->map(function ($project) {
                $totalRefund = $project->refunds
                    ->whereIn('status', ['paid', 'partial'])
                    ->sum(fn ($r) => $this->sumPayments($r->payments));

                $months = [];
                $nextPaymentAmount = null;
                $today = Carbon::now()->startOfMonth();

                if ($project->refund_initial && $project->refund_end) {
                    $start = Carbon::parse($project->refund_initial);
                    $end = Carbon::parse($project->refund_end);

                    while ($start <= $end) {
                        $monthRefund = $project->refunds
                            ->where('month_paid', $start->format('Y-m-d'))
                            ->first();

                        if ($monthRefund) {
                            $refundAmount = $this->sumPayments($monthRefund->payments);
                            $status = $monthRefund->status;
                        } else {
                            $refundAmount = $this->getRefundAmountForMonth($project, $start);
                            $status = 'unpaid';
                        }

                        $months[] = [
                            'month' => $start->format('F Y'),
                            'refund_amount' => $refundAmount,
                            'status' => strtolower($status),
                        ];

                        if ($nextPaymentAmount === null && $status !== 'paid' && $start >= $today) {
                            $nextPaymentAmount = $refundAmount;
                        }

                        $start->addMonth();
                    }
                }

                return [
                    'project_id' => $project->project_id,
                    'project_title' => $project->project_title,
                    'proponent' => $project->proponent->company_name ?? '-',
                    'project_cost' => $project->project_cost,
                    'total_refund' => $totalRefund,
                    'outstanding_balance' => $project->project_cost - $totalRefund,
                    'months' => $months,
                    'next_payment' => $nextPaymentAmount ?? 0,
                ];
            });

        $years = ProjectModel::whereHas('proponent', fn ($q) => $q->where('added_by', $userId))
            ->select('year_obligated')
            ->distinct()
            ->pluck('year_obligated');

        return Inertia::render('Refunds/UserIndex', [
            'projects' => $projects,
            'search' => $search,
            'years' => $years,
            'selectedYear' => $year,
        ]);
    }

    // ── Bulk update ───────────────────────────────────────────────────────────

public function bulkUpdate()
{
    $data = request()->validate([
        'project_id' => 'required|exists:tbl_projects,project_id',
        'month_dates' => 'required|array',
        'month_dates.*' => 'required|date_format:Y-m-d',
        'status' => 'required|in:paid,unpaid,restructured',
        'month_details' => 'nullable|array',
        'month_details.*' => 'nullable|array',
        'month_details.*.*.amount' => 'nullable|numeric|min:0',
        'month_details.*.*.bank_name' => 'nullable|string|max:100',
        'month_details.*.*.check_num' => 'nullable|string|max:20',
        'month_details.*.*.check_date' => 'nullable|date_format:Y-m-d',
        'month_details.*.*.receipt_num' => 'nullable|string|max:20',
        'month_details.*.*.receipt_date' => 'nullable|date_format:Y-m-d',
    ]);

    try {
        $project = ProjectModel::with('proponent', 'refunds')->findOrFail($data['project_id']);
        $updatedCount = 0;
        $monthDetails = $data['month_details'] ?? [];
        $refundEnd = Carbon::parse($project->refund_end)->startOfMonth()->format('Y-m-d');

        // Completion check (unchanged)
        $isMarkingAsComplete = false;
        foreach ($data['month_dates'] as $monthDate) {
            if (Carbon::parse($monthDate)->startOfMonth()->format('Y-m-d') === $refundEnd
                && $data['status'] === 'paid') {
                $isMarkingAsComplete = true;
                break;
            }
        }

        if ($isMarkingAsComplete) {
            $monthsToUpdate = collect($data['month_dates'])
                ->map(fn ($d) => Carbon::parse($d)->startOfMonth()->format('Y-m-d'))
                ->unique()->toArray();
            $completionCheck = $project->checkRefundCompletionWithBulkUpdate($monthsToUpdate, $data['status']);
            if (!$completionCheck['is_complete']) {
                return back()->with('warning', [
                    'message' => 'Cannot update project status. The following months remain unpaid:',
                    'unpaid_months' => $completionCheck['unpaid_months'],
                    'project_title' => $project->project_title,
                    'refund_initial' => Carbon::parse($project->refund_initial)->format('F Y'),
                    'refund_end' => Carbon::parse($project->refund_end)->format('F Y'),
                    'action' => 'Please ensure all months between '.
                        Carbon::parse($project->refund_initial)->format('F Y').
                        ' and '.Carbon::parse($project->refund_end)->format('F Y').
                        ' are paid before completing the project.',
                ])->withInput();
            }
        }

        foreach ($data['month_dates'] as $monthDate) {
            $monthParsed = Carbon::parse($monthDate);
            $paymentRows = $monthDetails[$monthDate] ?? [];

            $refund = RefundModel::firstOrNew([
                'project_id' => $data['project_id'],
                'month_paid' => $monthDate,
            ]);

            if ($data['status'] === 'restructured') {
                $refund->payments = [];
                $refund->amount_due = 0;
            } else {
                $expectedAmount = $this->getRefundAmountForMonth($project, $monthParsed);
                $builtPayments = [];

                if (!empty($paymentRows)) {
                    foreach ($paymentRows as $row) {
                        $rowAmount = (float) ($row['amount'] ?? 0);
                        if ($rowAmount <= 0) {
                            continue;
                        }
                        $builtPayments[] = [
                            'amount' => $rowAmount,
                            'bank_name' => !empty($row['bank_name']) ? $row['bank_name'] : null,  // ✅ FIXED: bank_name is now properly mapped
                            'check_num' => !empty($row['check_num']) ? $row['check_num'] : null,
                            'check_date' => !empty($row['check_date']) ? $row['check_date'] : null,
                            'receipt_num' => !empty($row['receipt_num']) ? $row['receipt_num'] : null,
                            'receipt_date' => !empty($row['receipt_date']) ? $row['receipt_date'] : null,
                            'saved_at' => now()->toDateTimeString(),
                        ];
                    }
                }

                if (empty($builtPayments)) {
                    $builtPayments[] = [
                        'amount' => $expectedAmount,
                        'bank_name' => null,
                        'check_num' => null,
                        'check_date' => null,
                        'receipt_num' => null,
                        'receipt_date' => null,
                        'saved_at' => now()->toDateTimeString(),
                    ];
                }

                $refund->payments = $builtPayments;
                $refund->amount_due = collect($builtPayments)->sum('amount');
            }

            $refund->status = $data['status'];
            $refund->updated_by = Auth::id();
            $refund->save();
            ++$updatedCount;
        }

        if ($isMarkingAsComplete) {
            $project->update(['progress' => 'Completed']);
        }

        return back();
    } catch (\Exception $e) {
        return back()->with('error', 'An error occurred while updating: '.$e->getMessage());
    }
}

    // ── CSV Sync ──────────────────────────────────────────────────────────────

    public function syncRefundsFromCSV()
    {
        set_time_limit(0);
        ini_set('memory_limit', '512M');

        $user = Auth::user();

        if (!$user || !in_array($user->role, ['rpmo', 'au'])) {
            return back()->with('error', 'Unauthorized: Only RPMO/AU can sync refunds from CSV.');
        }

        $requestedSheets = array_map('intval', (array) request()->input('selected_sheets', []));

        $csvUrls = collect(self::SHEET_NAMES)
            ->filter(function ($name, $i) use ($requestedSheets) {
                return !empty(env("REFUND_CSV_{$i}"))
                    && (empty($requestedSheets) || in_array($i, $requestedSheets));
            })
            ->mapWithKeys(fn ($name, $i) => [$i => env("REFUND_CSV_{$i}")])
            ->toArray();

        $totalInserted = 0;
        $totalSkipped = 0;
        $allErrors = [];
        $projectCache = [];
        $projectDateBounds = [];

        // Disable once before all sheets — not inside the loop
        RefundModel::disableLogging();

        try {
            foreach ($csvUrls as $csvIndex => $csvUrl) {
                $csvLabel = self::SHEET_NAMES[$csvIndex] ?? "Sheet #{$csvIndex}";

                try {
                    $response = \Illuminate\Support\Facades\Http::timeout(300)->get($csvUrl);
                    if (!$response->ok()) {
                        $allErrors[] = "{$csvLabel}: Failed to fetch CSV data.";
                        continue;
                    }

                    $stream = fopen('php://memory', 'r+');
                    fwrite($stream, $response->body());
                    rewind($stream);

                    $rawHeader = fgetcsv($stream);
                    if (!$rawHeader) {
                        $allErrors[] = "{$csvLabel}: CSV contains no header.";
                        fclose($stream);
                        continue;
                    }

                    $header = [];
                    foreach ($rawHeader as $key => $col) {
                        $normalized = preg_replace('/\s+/', ' ', trim($col));
                        if ($normalized !== '') {
                            $header[$key] = $normalized;
                        }
                    }

                    $inserted = 0;
                    $skipped = 0;
                    $errors = [];
                    $rowIndex = 1;

                    while (($row = fgetcsv($stream)) !== false) {
                        ++$rowIndex;
                        // ↑ No try/finally here — enableLogging() must NOT fire per row
                        try {
                            $row = array_map('trim', $row);
                            $headerKeys = array_values($header);

                            if (count(array_filter($row)) === 0) {
                                continue;
                            }

                            $row = array_slice(array_pad($row, count($headerKeys), ''), 0, count($headerKeys));
                            $data = array_combine($headerKeys, $row);
                            if (!$data) {
                                continue;
                            }

                            $projectTitle = trim($data['Project Title'] ?? '');
                            if (!$projectTitle) {
                                $errors[] = "Row $rowIndex skipped: 'Project Title' is empty.";
                                continue;
                            }

                            if (!isset($projectCache[$projectTitle])) {
                                $normalizedCsvTitle = $this->normalizeTitleForMatching($projectTitle);
                                $projectCache[$projectTitle] = ProjectModel::select(
                                    'project_id', 'project_title', 'refund_amount',
                                    'last_refund', 'refund_initial', 'refund_end'
                                )
                                ->get()
                                ->first(fn ($p) => $this->normalizeTitleForMatching($p->project_title) === $normalizedCsvTitle);
                            }

                            $project = $projectCache[$projectTitle];
                            if (!$project) {
                                $errors[] = "Row $rowIndex skipped: No project matched title '$projectTitle'.";
                                ++$skipped;
                                continue;
                            }

                            $particular = trim($data['Particular'] ?? '');
                            $isRestructuring = (bool) preg_match('/restructur/i', $particular);

                            if ($isRestructuring) {
                                $range = $this->parseRestructureRange($particular);
                                if ($range) {
                                    [$restructStart, $restructEnd] = $range;
                                    $current = $restructStart->copy();
                                    while ($current->lessThanOrEqualTo($restructEnd)) {
                                        $monthKey = $current->format('Y-m-d');
                                        $refund = RefundModel::firstOrNew(['project_id' => $project->project_id, 'month_paid' => $monthKey]);
                                        $refund->payments = [];
                                        $refund->amount_due = 0;
                                        $refund->status = RefundModel::STATUS_RESTRUCTURED;
                                        $refund->save();

                                        $this->trackDateBounds($projectDateBounds, $project->project_id, $monthKey);
                                        ++$inserted;
                                        $current->addMonth();
                                    }
                                    continue;
                                }
                            }

                            $monthDueRaw = trim($data['Month Due'] ?? '');
                            if (!$monthDueRaw) {
                                $errors[] = "Row $rowIndex skipped: 'Month Due' is empty.";
                                continue;
                            }

                            $range = $this->parseRestructureRange($monthDueRaw);
                            if ($range) {
                                [$restructStart, $restructEnd] = $range;
                                $current = $restructStart->copy();
                                while ($current->lessThanOrEqualTo($restructEnd)) {
                                    $monthKey = $current->format('Y-m-d');
                                    $refund = RefundModel::firstOrNew(['project_id' => $project->project_id, 'month_paid' => $monthKey]);
                                    $refund->payments = [];
                                    $refund->amount_due = 0;
                                    $refund->status = RefundModel::STATUS_RESTRUCTURED;
                                    $refund->save();

                                    $this->trackDateBounds($projectDateBounds, $project->project_id, $monthKey);
                                    ++$inserted;
                                    $current->addMonth();
                                }
                                continue;
                            }

                            if (preg_match('/^(\d{1,2})\/(\d{4})$/', $monthDueRaw, $m)) {
                                $monthPaid = sprintf('%04d-%02d-01', $m[2], $m[1]);
                            } elseif (preg_match('/^([a-zA-Z]{3,9})\s+(\d{4})$/', $monthDueRaw, $m)) {
                                try {
                                    $monthPaid = Carbon::parse("1 {$m[1]} {$m[2]}")->format('Y-m-d');
                                } catch (\Exception $e) {
                                    $errors[] = "Row $rowIndex skipped: Cannot parse month name '{$monthDueRaw}'.";
                                    continue;
                                }

                                if ($isRestructuring) {
                                    $refund = RefundModel::firstOrNew(['project_id' => $project->project_id, 'month_paid' => $monthPaid]);
                                    $refund->payments = [];
                                    $refund->amount_due = 0;
                                    $refund->status = RefundModel::STATUS_RESTRUCTURED;
                                    $refund->save();

                                    $this->trackDateBounds($projectDateBounds, $project->project_id, $monthPaid);
                                    ++$inserted;
                                    continue;
                                }
                            } else {
                                $errors[] = "Row $rowIndex skipped: Cannot parse 'Month Due' value '$monthDueRaw'.";
                                continue;
                            }

                            $sanitize = fn ($v) => is_numeric(str_replace([',', ' '], '', $v))
                                ? (float) str_replace([',', ' '], '', $v)
                                : 0;

                            $payment = $sanitize($data['Payment'] ?? '');
                            $amountDue = $sanitize($data['Amount Due'] ?? '');
                            $status = $payment > 0 ? RefundModel::STATUS_PAID : RefundModel::STATUS_UNPAID;
                            $checkNum = $this->nullIfEmpty($data['Post Dated Check No.'] ?? '');
                            $checkDate = $this->parseCsvDate($data['Post Dated Check Date'] ?? '');
                            $receiptNum = $this->nullIfEmpty($data['OR No.'] ?? '');
                            $receiptDate = $this->parseCsvDate($data['OR Date'] ?? '');

                            $finalAmountDue = $amountDue > 0
                                ? $amountDue
                                : ($payment > 0 ? $payment : ($project->refund_amount ?? 0));

                            $refund = RefundModel::firstOrNew([
                                'project_id' => $project->project_id,
                                'month_paid' => $monthPaid,
                            ]);

                            $refund->payments = $payment > 0
                                ? [[
                                    'amount' => $payment,
                                    'check_num' => $checkNum,
                                    'check_date' => $checkDate,
                                    'receipt_num' => $receiptNum,
                                    'receipt_date' => $receiptDate,
                                    'saved_at' => now()->toDateTimeString(),
                                ]]
                                : null;

                            $refund->amount_due = $finalAmountDue;
                            $refund->status = $status;
                            $refund->updated_by = Auth::id();
                            $refund->save();

                            $this->trackDateBounds($projectDateBounds, $project->project_id, $monthPaid);
                            ++$inserted;
                        } catch (\Exception $e) {
                            $errors[] = "Row $rowIndex failed: ".$e->getMessage();
                        }
                    }

                    fclose($stream);

                    $totalInserted += $inserted;
                    $totalSkipped += $skipped;
                    $allErrors = array_merge(
                        $allErrors,
                        array_map(fn ($e) => "[{$csvLabel}] $e", $errors)
                    );
                } catch (\Exception $e) {
                    $allErrors[] = "{$csvLabel} failed entirely: ".$e->getMessage();
                }
                // ↑ No finally here per sheet — enableLogging() must NOT fire per sheet iteration
            }

            // ── Post-sync: update project date bounds & refund amounts ────────
            foreach ($projectDateBounds as $projectId => $bounds) {
                $proj = null;
                foreach ($projectCache as $cached) {
                    if ($cached && $cached->project_id == $projectId) {
                        $proj = $cached;
                        break;
                    }
                }
                $proj = $proj ?? ProjectModel::find($projectId);
                if (!$proj) {
                    continue;
                }

                $dateUpdates = [];
                $dbInitial = $proj->refund_initial ? Carbon::parse($proj->refund_initial)->format('Y-m-d') : null;
                $dbEnd = $proj->refund_end ? Carbon::parse($proj->refund_end)->format('Y-m-d') : null;

                if (!$dbInitial || $bounds['min'] < $dbInitial) {
                    $dateUpdates['refund_initial'] = $bounds['min'];
                }
                if (!$dbEnd || $bounds['max'] > $dbEnd) {
                    $dateUpdates['refund_end'] = $bounds['max'];
                }

                if (!empty($dateUpdates)) {
                    DB::table('tbl_projects')->where('project_id', $projectId)->update($dateUpdates);
                }

                $paidRefunds = RefundModel::where('project_id', $projectId)
                    ->whereIn('status', [RefundModel::STATUS_PAID, RefundModel::STATUS_PARTIAL])
                    ->get()
                    ->filter(fn ($r) => $this->sumPayments($r->payments) > 0);

                if ($paidRefunds->isNotEmpty()) {
                    $modeAmount = $paidRefunds
                        ->map(fn ($r) => $this->sumPayments($r->payments))
                        ->groupBy(fn ($a) => $a)
                        ->map->count()
                        ->sortDesc()
                        ->keys()
                        ->first();

                    $lastMonthRow = RefundModel::where('project_id', $projectId)
                        ->where('month_paid', $bounds['max'])
                        ->first();

                    $lastRefundAmount = ($lastMonthRow && $this->sumPayments($lastMonthRow->payments) > 0)
                        ? $this->sumPayments($lastMonthRow->payments)
                        : $modeAmount;

                    $amountUpdates = [];
                    if ($modeAmount !== null && (float) $proj->refund_amount !== (float) $modeAmount) {
                        $amountUpdates['refund_amount'] = $modeAmount;
                    }
                    if ($lastRefundAmount !== null && (float) $proj->last_refund !== (float) $lastRefundAmount) {
                        $amountUpdates['last_refund'] = $lastRefundAmount;
                    }
                    if (!empty($amountUpdates)) {
                        ProjectModel::where('project_id', $projectId)->update($amountUpdates);
                    }
                }
            }

            // ── Build summary strings (defined here so manualLog can use them) ─
            $syncedSheetNames = collect($csvUrls)->keys()
                ->map(fn ($i) => self::SHEET_NAMES[$i] ?? "Sheet #{$i}")
                ->join(', ');

            // One summary log entry for the entire sync
            (new RefundModel())->manualLog('Synced', implode(' | ', array_filter([
                "Synced {$totalInserted} refund records from: {$syncedSheetNames}",
                $totalSkipped ? "{$totalSkipped} rows skipped" : null,
                count($allErrors) ? count($allErrors).' rows had errors' : null,
            ])));

            $message = "{$totalInserted} refund records synced from: {$syncedSheetNames}.";
            if ($totalSkipped) {
                $message .= " {$totalSkipped} rows skipped.";
            }
            if (!empty($allErrors)) {
                $message .= ' '.count($allErrors).' rows had errors.';
            }

            return back()->with('success', $message);
        } finally {
            // Runs exactly once after all sheets — success OR exception
            RefundModel::enableLogging();
        }
    }
    // ── User project refund details ───────────────────────────────────────────

    public function userProjectRefunds($projectId)
    {
        try {
            $userId = Auth::id();

            $project = ProjectModel::with(['proponent', 'refunds'])
                ->whereHas('proponent', fn ($q) => $q->where('added_by', $userId))
                ->findOrFail($projectId);

            [$months, $summary] = $this->buildMonthsArray($project);

            return Inertia::render('Refunds/UserDetails', [
                'project' => $this->formatProject($project),
                'months' => $months,
                'summary' => $summary,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return back()->with('error', 'Project not found or you do not have permission to view this project.');
        } catch (\Exception $e) {
            Log::error('Error loading user project refund history: '.$e->getMessage());

            return back()->with('error', 'Failed to load project refund history. Please try again.');
        }
    }

    // ── Shared private helpers ────────────────────────────────────────────────

    /**
     * Build the months array AND summary in one pass.
     *
     * Summary logic:
     *  - total_paid    = sum of actual payments[] for 'paid' AND 'partial' months
     *  - total_unpaid  = sum of expected refund amounts for 'unpaid' months only
     *                    (restructured months contribute ₱0; partial months already
     *                     partially contributed to total_paid so remaining is tracked separately)
     *  - paid_count    = months with status 'paid' (fully settled)
     *  - partial_count = months with status 'partial'
     *  - unpaid_count  = months with status 'unpaid' (excludes restructured)
     *  - completion_percentage = paid_count / total_months * 100
     */
    private function buildMonthsArray(ProjectModel $project): array
    {
        $months = [];
        $totalPaid = 0.0;
        $totalUnpaid = 0.0;
        $paidCount = 0;
        $partialCount = 0;
        $unpaidCount = 0;

        if ($project->refund_initial && $project->refund_end) {
            $start = Carbon::parse($project->refund_initial)->startOfMonth();
            $end = Carbon::parse($project->refund_end)->startOfMonth();

            while ($start->lte($end)) {
                // Look up the DB record for this month (month_paid stored as Y-m-d)
                $monthRefund = $project->refunds
                    ->first(fn ($r) => Carbon::parse($r->month_paid)->format('Y-m') === $start->format('Y-m'));

                // The expected/scheduled amount for this month
                $expectedAmount = $this->getRefundAmountForMonth($project, $start);

                if ($monthRefund) {
                    $status = $monthRefund->status;
                    $payments = is_array($monthRefund->payments) ? $monthRefund->payments : [];
                    $amountPaid = $this->sumPayments($payments); // actual money received
                    $amountDue = (float) ($monthRefund->amount_due ?? $expectedAmount);
                    // refund_amount shown in the row = what was actually paid (or expected if unpaid)
                    $refundAmount = in_array($status, ['paid', 'partial']) ? $amountPaid : $expectedAmount;
                } else {
                    $status = 'unpaid';
                    $payments = [];
                    $amountPaid = 0.0;
                    $amountDue = $expectedAmount;
                    $refundAmount = $expectedAmount;
                }

                // Accumulate summary figures
                switch ($status) {
                    case 'paid':
                        $totalPaid += $amountPaid;
                        ++$paidCount;
                        break;

                    case 'partial':
                        // Count partial payments toward total paid
                        $totalPaid += $amountPaid;
                        // Remaining balance counts as unpaid
                        $totalUnpaid += max(0, $expectedAmount - $amountPaid);
                        ++$partialCount;
                        break;

                    case 'restructured':
                        // Restructured months are neither paid nor unpaid — skip from totals
                        break;

                    case 'unpaid':
                    default:
                        $totalUnpaid += $expectedAmount;
                        ++$unpaidCount;
                        break;
                }

                $months[] = [
                    'month' => $start->format('F Y'),
                    'month_date' => $start->format('Y-m-d'),
                    'refund_amount' => $refundAmount,   // actual paid amount (or expected if unpaid)
                    'amount_due' => $amountDue,       // scheduled/expected amount
                    'status' => $status,
                    'payments' => $payments,        // full payments[] array for frontend chips
                    'is_past' => $start->lt(Carbon::now()->startOfMonth()),
                ];

                $start->addMonth();
            }
        }

        $totalMonths = count($months);

        $summary = [
            'total_paid' => $totalPaid,
            'total_unpaid' => $totalUnpaid,
            'paid_count' => $paidCount,
            'partial_count' => $partialCount,
            'unpaid_count' => $unpaidCount,
            'total_months' => $totalMonths,
            'completion_percentage' => $totalMonths > 0
                ? round(($paidCount / $totalMonths) * 100, 2)
                : 0,
        ];

        return [$months, $summary];
    }

    private function formatProject(ProjectModel $project): array
    {
        return [
            'project_id' => $project->project_id,
            'project_title' => $project->project_title,
            'project_cost' => $project->project_cost,
            'refund_amount' => $project->refund_amount,
            'last_refund' => $project->last_refund,
            'refund_initial' => $project->refund_initial,
            'refund_end' => $project->refund_end,
            'proponent' => [
                'company_name' => $project->proponent->company_name ?? 'N/A',
                'email' => $project->proponent->email ?? null,
            ],
        ];
    }

    private function trackDateBounds(array &$bounds, $projectId, string $monthDate): void
    {
        if (!isset($bounds[$projectId])) {
            $bounds[$projectId] = ['min' => $monthDate, 'max' => $monthDate];

            return;
        }
        if ($monthDate < $bounds[$projectId]['min']) {
            $bounds[$projectId]['min'] = $monthDate;
        }
        if ($monthDate > $bounds[$projectId]['max']) {
            $bounds[$projectId]['max'] = $monthDate;
        }
    }

    private function nullIfEmpty(string $value): ?string
    {
        $v = trim($value);

        return $v !== '' ? $v : null;
    }

    private function normalizeTitleForMatching(string $title): string
    {
        if (function_exists('normalizer_normalize')) {
            $title = normalizer_normalize($title, \Normalizer::FORM_KD) ?: $title;
        }
        $lower = mb_strtolower($title, 'UTF-8');
        $lower = preg_replace('/\bthru\b/u', 'through', $lower);
        $lower = preg_replace('/\bthro\b/u', 'through', $lower);
        $lower = str_replace('&', 'and', $lower);
        $lower = preg_replace("/['\u{2018}\u{2019}\u{0060}\u{00B4}]/u", '', $lower);
        $lower = preg_replace('/[^a-z0-9\s]/u', ' ', $lower);
        $words = preg_split('/\s+/', trim($lower));
        $words = array_map(fn ($word) => \Illuminate\Support\Str::singular($word), $words);

        return implode('', $words);
    }

    private function parseCsvDate(string $value): ?string
    {
        $v = trim($value);
        if ($v === '' || $v === '-') {
            return null;
        }
        if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $v, $m)) {
            return sprintf('%04d-%02d-%02d', $m[3], $m[1], $m[2]);
        }
        if (preg_match('/^(\d{1,2})\/(\d{4})$/', $v, $m)) {
            return sprintf('%04d-%02d-01', $m[2], $m[1]);
        }
        try {
            return Carbon::parse($v)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    private function parseRestructureRange(string $text): ?array
    {
        $text = trim($text);
        $expand4 = function (string $year): string {
            if (strlen($year) === 2) {
                $y = (int) $year;

                return $y <= (int) date('y') + 10 ? '20'.sprintf('%02d', $y) : '19'.sprintf('%02d', $y);
            }

            return $year;
        };
        $parseMonthYear = function (string $mon, string $year) use ($expand4): ?\Carbon\Carbon {
            try {
                return Carbon::parse("1 {$mon} ".$expand4($year))->startOfMonth();
            } catch (\Exception $e) {
                return null;
            }
        };

        $text = preg_replace('/([a-zA-Z]{3,9})\./', '$1', $text);

        if (preg_match('/^([a-zA-Z]{3,9})\s*(\d{2,4})\s*[-–—]\s*([a-zA-Z]{3,9})\s*(\d{2,4})$/i', $text, $m)) {
            $start = $parseMonthYear($m[1], $m[2]);
            $end = $parseMonthYear($m[3], $m[4]);
            if ($start && $end) {
                return [$start, $end];
            }
        }
        if (preg_match('/^([a-zA-Z]{3,9})\s*(\d{2,4})\s*[-–—]\s*(\d{2,4})$/i', $text, $m)) {
            $start = $parseMonthYear($m[1], $m[2]);
            $end = $parseMonthYear($m[1], $m[3]);
            if ($start && $end) {
                return [$start, $end];
            }
        }
        if (preg_match('/^([a-zA-Z]{3,9})\s*[-–—]\s*([a-zA-Z]{3,9})\s+(\d{2,4})$/i', $text, $m)) {
            $start = $parseMonthYear($m[1], $m[3]);
            $end = $parseMonthYear($m[2], $m[3]);
            if ($start && $end) {
                return [$start, $end];
            }
        }
        if (preg_match('/^([a-zA-Z]{3,9})[-–—]([a-zA-Z]{3,9})(\d{2,4})$/i', $text, $m)) {
            $start = $parseMonthYear($m[1], $m[3]);
            $end = $parseMonthYear($m[2], $m[3]);
            if ($start && $end) {
                return [$start, $end];
            }
        }
        if (preg_match('/^([a-zA-Z]{3,9})\s+(\d{2,4})\s+([a-zA-Z]{3,9})\s+(\d{2,4})$/i', $text, $m)) {
            $start = $parseMonthYear($m[1], $m[2]);
            $end = $parseMonthYear($m[3], $m[4]);
            if ($start && $end) {
                return [$start, $end];
            }
        }

        return null;
    }
}
