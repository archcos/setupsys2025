<?php

namespace App\Http\Controllers;

use App\Models\ProjectModel;
use App\Models\RefundModel;
use App\Models\RestructureModel;
use App\Models\RestructureUpdateModel;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class RefundController extends Controller
{
    /**
     * Helper method to get the refund amount for a specific month considering restructures
     *
     * @param ProjectModel $project
     * @param Carbon $monthDate
     * @return float
     */
    
    private function getRefundAmountForMonth(ProjectModel $project, Carbon $monthDate)
    {
        // Check if there's an approved restructure with updates for this month
        $approvedRestructures = RestructureModel::where('project_id', $project->project_id)
            ->where('status', 'approved')
            ->get();

        foreach ($approvedRestructures as $restructure) {
            $updates = RestructureUpdateModel::where('restruct_id', $restructure->restruct_id)->get();

            foreach ($updates as $update) {
                $updateStart = Carbon::parse($update->update_start);
                $updateEnd   = Carbon::parse($update->update_end);

                if ($monthDate->isBetween($updateStart, $updateEnd)) {
                    return $update->update_amount;
                }
            }
        }

        // If no updates apply, use the default refund amount
        // Check if it's the last month
        if ($project->refund_end && $monthDate->isSameMonth(Carbon::parse($project->refund_end))) {
            return $project->last_refund ?? 0;
        }

        return $project->refund_amount ?? 0;
    }

    public function index()
    {
        $user = Auth::user();

        $selectedMonth        = request('month',               now()->month);
        $selectedYear         = request('year',                now()->year);
        $search               = request('search');
        $status               = request('status');
        $office               = request('office');          // new
        $includeWithdrawn     = request('include_withdrawn',    false);  // new
        $includeTerminated    = request('include_terminated',   false);  // new
        $perPage              = (int) request('perPage', 10);

        $perPage = in_array($perPage, [10, 20, 50, 100]) ? $perPage : 10;

        $isRPMO = in_array($user->role, ['rpmo', 'au']);

        $selectedDate = Carbon::create($selectedYear, $selectedMonth, 1);

        // All distinct years from the projects table — no hardcoded range
        $availableYears = ProjectModel::query()
            ->whereNotNull('year_obligated')
            ->distinct()
            ->orderByDesc('year_obligated')
            ->pluck('year_obligated');

        // All offices for the filter dropdown (RPMO/AU only)
        $offices = $isRPMO
            ? \App\Models\OfficeModel::orderBy('office_name')->get(['office_id', 'office_name'])
            : collect();

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
            }
        ])
        ->whereDate('refund_initial', '<=', $selectedDate)
        ->whereDate('refund_end',     '>=', $selectedDate)

        // ── Progress exclusions (default: hide Withdrawn & Terminated) ──────
        ->when(!$includeWithdrawn && !$includeTerminated, function ($q) {
            $q->whereNotIn('progress', ['Withdrawn', 'Terminated']);
        })
        ->when($includeWithdrawn && !$includeTerminated, function ($q) {
            $q->where(function ($q) {
                $q->whereNotIn('progress', ['Terminated'])
                ->orWhereNull('progress');
            });
        })
        ->when(!$includeWithdrawn && $includeTerminated, function ($q) {
            $q->where(function ($q) {
                $q->whereNotIn('progress', ['Withdrawn'])
                ->orWhereNull('progress');
            });
        })
        // both checked → no exclusions, show everything

        // ── Office filter (RPMO/AU only) ─────────────────────────────────────
        ->when($isRPMO && $office, function ($q) use ($office) {
            $q->whereHas('proponent', function ($q) use ($office) {
                $q->where('office_id', $office);
            });
        })

        ->when($search, function ($query, $search) {
            $query->where(function ($q) use ($search) {
                $q->where('project_title', 'like', "%{$search}%")
                ->orWhere('project_id', 'like', "%{$search}%")
                ->orWhereHas('proponent', function ($q) use ($search) {
                    $q->where('company_name', 'like', "%{$search}%");
                });
            });
        })
        ->when($status, function ($query, $status) use ($selectedDate) {
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
            $refundAmount = $this->getRefundAmountForMonth($project, $selectedDate);
            $project->refund_amount = $refundAmount;
            return $project;
        })
        ->withQueryString();

        return Inertia::render('Refunds/Index', [
            'projects'           => $projects,
            'selectedMonth'      => $selectedMonth,
            'selectedYear'       => $selectedYear,
            'search'             => $search,
            'selectedStatus'     => $status,
            'selectedOffice'     => $office,
            'includeWithdrawn'   => (bool) $includeWithdrawn,
            'includeTerminated'  => (bool) $includeTerminated,
            'availableYears'     => $availableYears,
            'offices'            => $offices,
            'userRole'           => $user->role,
        ]);
    }

    /**
     * Show detailed refund history for a specific project
     */
    public function projectRefunds($projectId)
    {
        $user = Auth::user();

        try {
            $project = ProjectModel::with([
                'proponent',
                'refunds'
            ])->findOrFail($projectId);

            $months     = [];
            $totalPaid  = 0;
            $totalUnpaid = 0;
            $paidCount  = 0;
            $unpaidCount = 0;

            if ($project->refund_initial && $project->refund_end) {
                $start = Carbon::parse($project->refund_initial);
                $end   = Carbon::parse($project->refund_end);

                while ($start <= $end) {
                    $monthRefund = $project->refunds
                        ->where('month_paid', $start->format('Y-m-d'))
                        ->first();

                    if ($monthRefund) {
                        $refundAmount = $monthRefund->refund_amount;
                        $status       = $monthRefund->status;
                        $amountDue    = $monthRefund->amount_due;
                        $checkNum     = $monthRefund->check_num;
                        $checkDate    = $monthRefund->check_date;
                        $receiptNum   = $monthRefund->receipt_num;
                        $receiptDate  = $monthRefund->receipt_date;
                    } else {
                        $refundAmount = $this->getRefundAmountForMonth($project, $start);
                        $status       = 'unpaid';
                        $amountDue    = $refundAmount;
                        $checkNum     = null;
                        $checkDate    = null;
                        $receiptNum   = null;
                        $receiptDate  = null;
                    }

                    if ($status === 'paid') {
                        $totalPaid += $refundAmount;
                        $paidCount++;
                    } else {
                        $totalUnpaid += $refundAmount;
                        $unpaidCount++;
                    }

                    $months[] = [
                        'month'         => $start->format('F Y'),
                        'month_date'    => $start->format('Y-m-d'),
                        'refund_amount' => $refundAmount,
                        'amount_due'    => $amountDue,
                        'status'        => $status,
                        'check_num'     => $checkNum,
                        'check_date'    => $checkDate,
                        'receipt_num'   => $receiptNum,
                        'receipt_date'  => $receiptDate,
                        'is_past'       => $start->isPast(),
                    ];

                    $start->addMonth();
                }
            }

            return Inertia::render('Refunds/Details', [
                'userRole' => $user->role,
                'project'  => [
                    'project_id'    => $project->project_id,
                    'project_title' => $project->project_title,
                    'project_cost'  => $project->project_cost,
                    'refund_amount' => $project->refund_amount,
                    'last_refund'   => $project->last_refund,
                    'refund_initial'=> $project->refund_initial,
                    'refund_end'    => $project->refund_end,
                    'proponent'     => [
                        'company_name' => $project->proponent->company_name ?? 'N/A',
                        'email'        => $project->proponent->email ?? null,
                    ],
                ],
                'months'  => $months,
                'summary' => [
                    'total_paid'            => $totalPaid,
                    'total_unpaid'          => $totalUnpaid,
                    'paid_count'            => $paidCount,
                    'unpaid_count'          => $unpaidCount,
                    'total_months'          => count($months),
                    'completion_percentage' => count($months) > 0
                        ? round(($paidCount / count($months)) * 100, 2)
                        : 0,
                ],
            ]);

        } catch (\Exception $e) {
            return back()->with('error', 'Failed to load project refund history. Please try again.');
        }
    }

    public function save()
    {
        $data = request()->validate([
            'project_id'    => 'required|exists:tbl_projects,project_id',
            'refund_amount' => 'required|numeric|min:0',
            'amount_due'    => 'nullable|numeric|min:0',
            'check_num'     => 'nullable|string|max:10',
            'check_date'    => 'nullable|date_format:Y-m-d',
            'receipt_num'   => 'nullable|string|max:10',
            'receipt_date'  => 'nullable|date_format:Y-m-d',
            'status'        => 'required|in:paid,unpaid,restructured',
            'save_date'     => 'required|date_format:Y-m-d',
        ]);

        try {
            Log::info('========== REFUND SAVE STARTED ==========');
            Log::info('Request data:', $data);

            $savedMonthDate = Carbon::parse($data['save_date'])->startOfMonth()->format('Y-m-d');
            $readableMonth  = Carbon::parse($data['save_date'])->format('F Y');

            $project = ProjectModel::with('refunds')->find($data['project_id']);
            if (!$project) {
                Log::error('Project not found for ID: ' . $data['project_id']);
                return back()->with('error', 'Project not found.');
            }

            if ($data['status'] === 'restructured') {
                $data['refund_amount'] = 0;
                $data['amount_due']    = 0;
            }

            $refundEnd = Carbon::parse($project->refund_end)->startOfMonth()->format('Y-m-d');

            $completionCheck = null;

            if ($savedMonthDate === $refundEnd) {
                if ($data['status'] === 'paid') {
                    $completionCheck = $project->checkRefundCompletionWithNewEntry(
                        $savedMonthDate,
                        $data['status']
                    );

                    if (!$completionCheck['is_complete']) {
                        $warningData = [
                            'message'        => 'Cannot update project status. The following months remain unpaid:',
                            'unpaid_months'  => $completionCheck['unpaid_months'],
                            'project_title'  => $project->project_title,
                            'refund_initial' => Carbon::parse($project->refund_initial)->format('F Y'),
                            'refund_end'     => Carbon::parse($project->refund_end)->format('F Y'),
                            'action'         => 'Please ensure all months between ' .
                                Carbon::parse($project->refund_initial)->format('F Y') .
                                ' and ' .
                                Carbon::parse($project->refund_end)->format('F Y') .
                                ' are paid before completing the project.'
                        ];

                        return back()->with('warning', $warningData)->withInput();
                    }
                } else {
                    return back()
                        ->with('error', 'The final refund month must be marked as "Paid" to complete the project.')
                        ->withInput();
                }
            }

            $existingRefund = RefundModel::where('project_id', $data['project_id'])
                ->where('month_paid', $savedMonthDate)
                ->first();

            $statusChanged = !$existingRefund || $existingRefund->status !== $data['status'];

            $refund = RefundModel::updateOrCreate(
                [
                    'project_id' => $data['project_id'],
                    'month_paid' => $savedMonthDate,
                ],
                [
                    'refund_amount' => $data['refund_amount'],
                    'amount_due'    => $data['amount_due'],
                    'check_num'     => $data['check_num'] ?? null,
                    'check_date'    => $data['check_date'] ?? null,
                    'receipt_num'   => $data['receipt_num'] ?? null,
                    'receipt_date'  => $data['receipt_date'] ?? null,
                    'status'        => $data['status'],
                    'updated_by'    => Auth::id(),
                ]
            );

            if ($savedMonthDate === $refundEnd && $completionCheck && $completionCheck['is_complete']) {
                $project->update(['progress' => 'Completed']);
                Log::info('Project status updated to Completed');
            }

            $proponent     = $project->proponent ?? null;
            $ownerName     = $proponent?->owner_name ?? 'Valued Client';
            $projectTitle  = $project->project_title ?? 'N/A';
            $proponentName = $proponent?->company_name ?? 'N/A';

            if ($proponent && $proponent->email && $statusChanged) {
                try {
                    Mail::to($proponent->email)->send(
                        new \App\Mail\RefundNotificationMail(
                            $ownerName,
                            $projectTitle,
                            $proponentName,
                            $readableMonth,
                            $data['status'],
                            $data['amount_due'] ?? 0,
                            $data['refund_amount'],
                            $data['amount_due'] ?? 0,
                            $data['check_num'] ?? null,
                            $data['receipt_num'] ?? null,
                            $data['check_date'] ?? null,
                            $data['receipt_date'] ?? null
                        )
                    );

                    if ($savedMonthDate === $refundEnd && $completionCheck && $completionCheck['is_complete']) {
                        Mail::to($proponent->email)->send(
                            new \App\Mail\RefundCompletedMail(
                                $project->project_id,
                                now()->format('F d, Y \a\t h:i A')
                            )
                        );
                    }
                } catch (\Exception $e) {
                    Log::error("Failed to send refund email to {$proponent->email}: " . $e->getMessage());
                }
            }

            return back()->with('preserveScroll', true);

        } catch (\Exception $e) {
            return back()->with('error', 'An error occurred while saving: ' . $e->getMessage());
        }
    }

    public function userRefunds()
    {
        $userId = Auth::id();
        $search = request('search');
        $year   = request('year');

        $projects = ProjectModel::with(['proponent', 'refunds'])
            ->whereHas('proponent', function ($q) use ($userId) {
                $q->where('added_by', $userId);
            })
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('project_title', 'like', "%{$search}%")
                      ->orWhereHas('proponent', function ($q) use ($search) {
                          $q->where('company_name', 'like', "%{$search}%");
                      });
                });
            })
            ->when($year, function ($query, $year) {
                $query->where('year_obligated', $year);
            })
            ->get()
            ->map(function ($project) {
                $totalRefund = $project->refunds
                    ->where('status', 'paid')
                    ->sum('refund_amount');

                $outstanding       = $project->project_cost - $totalRefund;
                $months            = [];
                $nextPaymentAmount = null;
                $today             = Carbon::now()->startOfMonth();

                if ($project->refund_initial && $project->refund_end) {
                    $start = Carbon::parse($project->refund_initial);
                    $end   = Carbon::parse($project->refund_end);

                    while ($start <= $end) {
                        $monthRefund = $project->refunds
                            ->where('month_paid', $start->format('Y-m-d'))
                            ->first();

                        if ($monthRefund) {
                            $refundAmount = $monthRefund->refund_amount;
                            $status       = $monthRefund->status;
                        } else {
                            $refundAmount = $this->getRefundAmountForMonth($project, $start);
                            $status       = 'unpaid';
                        }

                        $months[] = [
                            'month'         => $start->format('F Y'),
                            'refund_amount' => $refundAmount,
                            'status'        => strtolower($status),
                        ];

                        if ($nextPaymentAmount === null && $status !== 'paid' && $start >= $today) {
                            $nextPaymentAmount = $refundAmount;
                        }

                        $start->addMonth();
                    }
                }

                return [
                    'project_id'          => $project->project_id,
                    'project_title'       => $project->project_title,
                    'proponent'           => $project->proponent->company_name ?? '-',
                    'project_cost'        => $project->project_cost,
                    'total_refund'        => $totalRefund,
                    'outstanding_balance' => $outstanding,
                    'months'              => $months,
                    'next_payment'        => $nextPaymentAmount ?? 0,
                ];
            });

        $years = ProjectModel::whereHas('proponent', function ($q) use ($userId) {
                $q->where('added_by', $userId);
            })
            ->select('year_obligated')
            ->distinct()
            ->pluck('year_obligated');

        return Inertia::render('Refunds/UserIndex', [
            'projects'     => $projects,
            'search'       => $search,
            'years'        => $years,
            'selectedYear' => $year,
        ]);
    }

    /**
     * Bulk update refund status with individual check_num and receipt_num for each month
     */
    public function bulkUpdate()
    {
        $data = request()->validate([
            'project_id'    => 'required|exists:tbl_projects,project_id',
            'month_dates'   => 'required|array',
            'month_dates.*' => 'required|date_format:Y-m-d',
            'status'        => 'required|in:paid,unpaid,restructured',
            'month_details' => 'nullable|array',
        ]);

        try {
            $project      = ProjectModel::with('proponent', 'refunds')->findOrFail($data['project_id']);
            $updatedCount = 0;
            $monthDetails = $data['month_details'] ?? [];
            $refundEnd    = Carbon::parse($project->refund_end)->startOfMonth()->format('Y-m-d');
            $isMarkingAsComplete = false;

            foreach ($data['month_dates'] as $monthDate) {
                $monthParsed = Carbon::parse($monthDate)->startOfMonth()->format('Y-m-d');

                if ($monthParsed === $refundEnd && $data['status'] === 'paid') {
                    $isMarkingAsComplete = true;
                    break;
                }
            }

            if ($isMarkingAsComplete) {
                $monthsToUpdate = collect($data['month_dates'])
                    ->map(fn($date) => Carbon::parse($date)->startOfMonth()->format('Y-m-d'))
                    ->unique()
                    ->toArray();

                $completionCheck = $project->checkRefundCompletionWithBulkUpdate(
                    $monthsToUpdate,
                    $data['status']
                );

                if (!$completionCheck['is_complete']) {
                    $warningData = [
                        'message'        => 'Cannot update project status. The following months remain unpaid:',
                        'unpaid_months'  => $completionCheck['unpaid_months'],
                        'project_title'  => $project->project_title,
                        'refund_initial' => Carbon::parse($project->refund_initial)->format('F Y'),
                        'refund_end'     => Carbon::parse($project->refund_end)->format('F Y'),
                        'action'         => 'Please ensure all months between ' .
                            Carbon::parse($project->refund_initial)->format('F Y') .
                            ' and ' .
                            Carbon::parse($project->refund_end)->format('F Y') .
                            ' are paid before completing the project.'
                    ];

                    return back()->with('warning', $warningData)->withInput();
                }
            }

            foreach ($data['month_dates'] as $monthDate) {
                $monthParsed  = Carbon::parse($monthDate);
                $refundAmount = 0;
                $amountDue    = 0;

                if ($data['status'] !== 'restructured') {
                    $refundAmount = $this->getRefundAmountForMonth($project, $monthParsed);
                    $amountDue    = $refundAmount;
                }

                $checkNum    = !empty($monthDetails[$monthDate]['check_num'])    ? $monthDetails[$monthDate]['check_num']    : null;
                $checkDate   = !empty($monthDetails[$monthDate]['check_date'])   ? $monthDetails[$monthDate]['check_date']   : null;
                $receiptNum  = !empty($monthDetails[$monthDate]['receipt_num'])  ? $monthDetails[$monthDate]['receipt_num']  : null;
                $receiptDate = !empty($monthDetails[$monthDate]['receipt_date']) ? $monthDetails[$monthDate]['receipt_date'] : null;

                RefundModel::updateOrCreate(
                    [
                        'project_id' => $data['project_id'],
                        'month_paid' => $monthDate,
                    ],
                    [
                        'refund_amount' => $refundAmount,
                        'amount_due'    => $amountDue,
                        'status'        => $data['status'],
                        'check_num'     => $checkNum,
                        'check_date'    => $checkDate,
                        'receipt_num'   => $receiptNum,
                        'receipt_date'  => $receiptDate,
                        'updated_by'    => Auth::id(),
                    ]
                );

                $updatedCount++;
            }

            if ($isMarkingAsComplete) {
                $project->update(['progress' => 'Completed']);
            }

            return back();

        } catch (\Exception $e) {
            return back()->with('error', 'An error occurred while updating: ' . $e->getMessage());
        }
    }

    /**
     * Sync refunds from Google Sheets CSV.
     * Matches rows by project title, handles restructuring periods,
     * and auto-corrects refund_initial / refund_end / refund_amount / last_refund.
     */
public function syncRefundsFromCSV()
{
    set_time_limit(0); 
    ini_set('memory_limit', '512M'); 

    $user = Auth::user();

    if (!$user || !in_array($user->role, ['rpmo', 'au'])) {
        return back()->with('error', 'Unauthorized: Only RPMO/AU can sync refunds from CSV.');
    }

    $csvUrls = collect(range(1, 10))
    ->map(fn($i) => env("REFUND_CSV_{$i}"))
    ->filter()
    ->values()
    ->toArray();

    $totalInserted     = 0;
    $totalSkipped      = 0;
    $allErrors         = [];
    $projectCache      = [];   // shared across all CSVs
    $projectDateBounds = [];   // shared across all CSVs

    foreach ($csvUrls as $csvIndex => $csvUrl) {
        $csvLabel = 'CSV #' . ($csvIndex + 1);

        try {
            $response = \Illuminate\Support\Facades\Http::timeout(300)->get($csvUrl);
            if (!$response->ok()) {
                $allErrors[] = "$csvLabel: Failed to fetch CSV data.";
                continue;
            }

            $stream = fopen('php://memory', 'r+');
            fwrite($stream, $response->body());
            rewind($stream);

            $rawHeader = fgetcsv($stream);
            if (!$rawHeader) {
                $allErrors[] = "$csvLabel: CSV contains no header.";
                fclose($stream);
                continue;
            }

            $header = [];
            foreach ($rawHeader as $key => $col) {
                $normalized = preg_replace('/\s+/', ' ', trim($col));
                if ($normalized !== '') $header[$key] = $normalized;
            }

            $inserted = 0;
            $skipped  = 0;
            $errors   = [];
            $rowIndex = 1;

            while (($row = fgetcsv($stream)) !== false) {
                $rowIndex++;
                try {
                    $row        = array_map('trim', $row);
                    $headerKeys = array_values($header);

                    if (count(array_filter($row)) === 0) continue;

                    $row  = array_slice(array_pad($row, count($headerKeys), ''), 0, count($headerKeys));
                    $data = array_combine($headerKeys, $row);
                    if (!$data) continue;

                    // ── 1. Resolve project by title ───────────────────────────
                    $projectTitle = trim($data['Project Title'] ?? '');
                    if (!$projectTitle) {
                        $errors[] = "Row $rowIndex skipped: 'Project Title' is empty.";
                        continue;
                    }

                    if (!isset($projectCache[$projectTitle])) {
                        $normalizedCsvTitle = $this->normalizeTitleForMatching($projectTitle);

                        $projectCache[$projectTitle] = ProjectModel::select('project_id', 'project_title', 'refund_amount', 'last_refund', 'refund_initial', 'refund_end')
                            ->get()
                            ->first(function ($p) use ($normalizedCsvTitle) {
                                return $this->normalizeTitleForMatching($p->project_title) === $normalizedCsvTitle;
                            });
                    }
                    $project = $projectCache[$projectTitle];

                    if (!$project) {
                        $errors[] = "Row $rowIndex skipped: No project matched title '$projectTitle'.";
                        $skipped++;
                        continue;
                    }

                    // ── 2. Check "Particular" for restructuring ───────────────
                    $particular      = trim($data['Particular'] ?? '');
                    $isRestructuring = (bool) preg_match('/restructur/i', $particular);

                    if ($isRestructuring) {
                        $range = $this->parseRestructureRange($particular);

                        if ($range) {
                            [$restructStart, $restructEnd] = $range;
                            try {
                                $current = $restructStart->copy();
                                while ($current->lessThanOrEqualTo($restructEnd)) {
                                    $monthKey = $current->format('Y-m-d');
                                    RefundModel::updateOrCreate(
                                        ['project_id' => $project->project_id, 'month_paid' => $monthKey],
                                        [
                                            'status'        => RefundModel::STATUS_RESTRUCTURED,
                                            'refund_amount' => 0,
                                            'amount_due'    => 0,
                                            'check_num'     => null,
                                            'check_date'    => null,
                                            'receipt_num'   => null,
                                            'receipt_date'  => null,
                                        ]
                                    );
                                    $this->trackDateBounds($projectDateBounds, $project->project_id, $monthKey);
                                    $inserted++;
                                    $current->addMonth();
                                }
                            } catch (\Exception $e) {
                                $errors[] = "Row $rowIndex restructuring parse failed (Particular): " . $e->getMessage();
                            }
                            continue;
                        }
                    }

                    // ── 3. Parse Month Due ────────────────────────────────────
                    $monthDueRaw = trim($data['Month Due'] ?? '');
                    if (!$monthDueRaw) {
                        $errors[] = "Row $rowIndex skipped: 'Month Due' is empty.";
                        continue;
                    }

                    // Case A: Range format in Month Due
                    $range = $this->parseRestructureRange($monthDueRaw);
                    if ($range) {
                        [$restructStart, $restructEnd] = $range;
                        try {
                            $current = $restructStart->copy();
                            while ($current->lessThanOrEqualTo($restructEnd)) {
                                $monthKey = $current->format('Y-m-d');
                                RefundModel::updateOrCreate(
                                    ['project_id' => $project->project_id, 'month_paid' => $monthKey],
                                    [
                                        'status'        => RefundModel::STATUS_RESTRUCTURED,
                                        'refund_amount' => 0,
                                        'amount_due'    => 0,
                                        'check_num'     => null,
                                        'check_date'    => null,
                                        'receipt_num'   => null,
                                        'receipt_date'  => null,
                                        'updated_by'    => Auth::id(),
                                    ]
                                );
                                $this->trackDateBounds($projectDateBounds, $project->project_id, $monthKey);
                                $inserted++;
                                $current->addMonth();
                            }
                        } catch (\Exception $e) {
                            $errors[] = "Row $rowIndex: Failed to parse restructuring range '{$monthDueRaw}': " . $e->getMessage();
                        }
                        continue;
                    }

                    // Case B: Standard MM/YYYY or M/YYYY
                    if (preg_match('/^(\d{1,2})\/(\d{4})$/', $monthDueRaw, $m)) {
                        $monthPaid = sprintf('%04d-%02d-01', $m[2], $m[1]);

                    // Case C: Abbreviated or full month name + year
                    } elseif (preg_match('/^([a-zA-Z]{3,9})\s+(\d{4})$/', $monthDueRaw, $m)) {
                        try {
                            $monthPaid = Carbon::parse("1 {$m[1]} {$m[2]}")->format('Y-m-d');
                        } catch (\Exception $e) {
                            $errors[] = "Row $rowIndex skipped: Cannot parse month name '{$monthDueRaw}': " . $e->getMessage();
                            continue;
                        }

                        if ($isRestructuring) {
                            RefundModel::updateOrCreate(
                                ['project_id' => $project->project_id, 'month_paid' => $monthPaid],
                                [
                                    'status'        => RefundModel::STATUS_RESTRUCTURED,
                                    'refund_amount' => 0,
                                    'amount_due'    => 0,
                                    'check_num'     => null,
                                    'check_date'    => null,
                                    'receipt_num'   => null,
                                    'receipt_date'  => null,
                                    'updated_by'    => Auth::id(),
                                ]
                            );
                            $this->trackDateBounds($projectDateBounds, $project->project_id, $monthPaid);
                            $inserted++;
                            continue;
                        }

                    } else {
                        $errors[] = "Row $rowIndex skipped: Cannot parse 'Month Due' value '$monthDueRaw'. "
                            . "Expected MM/YYYY, 'Mon YYYY', 'Month YYYY - Month YYYY', or 'Mon - Mon YYYY'.";
                        continue;
                    }

                    // ── 4. Parse financials ───────────────────────────────────
                    $sanitize = fn($v) => is_numeric(str_replace([',', ' '], '', $v))
                        ? (float) str_replace([',', ' '], '', $v)
                        : 0;

                    $payment   = $sanitize($data['Payment']    ?? '');
                    $amountDue = $sanitize($data['Amount Due'] ?? '');

                    $status = $payment > 0
                        ? RefundModel::STATUS_PAID
                        : RefundModel::STATUS_UNPAID;

                    // ── 5. Check / OR fields ──────────────────────────────────
                    $checkNum    = $this->nullIfEmpty($data['Post Dated Check No.']   ?? '');
                    $checkDate   = $this->parseCsvDate($data['Post Dated Check Date'] ?? '');
                    $receiptNum  = $this->nullIfEmpty($data['OR No.']   ?? '');
                    $receiptDate = $this->parseCsvDate($data['OR Date'] ?? '');

                    // ── 6. Upsert refund ──────────────────────────────────────
                    $finalAmountDue = $amountDue > 0
                        ? $amountDue
                        : ($payment > 0 ? $payment : ($project->refund_amount ?? 0));

                    RefundModel::updateOrCreate(
                        ['project_id' => $project->project_id, 'month_paid' => $monthPaid],
                        [
                            'refund_amount' => $payment,
                            'amount_due'    => $finalAmountDue,
                            'status'        => $status,
                            'check_num'     => $checkNum,
                            'check_date'    => $checkDate,
                            'receipt_num'   => $receiptNum,
                            'receipt_date'  => $receiptDate,
                            'updated_by'    => Auth::id(),
                        ]
                    );

                    $this->trackDateBounds($projectDateBounds, $project->project_id, $monthPaid);
                    $inserted++;

                } catch (\Exception $e) {
                    $errors[] = "Row $rowIndex failed: " . $e->getMessage();
                }
            }

            fclose($stream);

            // ── Per-CSV logging ───────────────────────────────────────────────
            Log::info("Refund CSV Sync — $csvLabel complete", [
                'inserted' => $inserted,
                'skipped'  => $skipped,
                'errors'   => count($errors),
            ]);

            $totalInserted += $inserted;
            $totalSkipped  += $skipped;
            $allErrors      = array_merge(
                $allErrors,
                array_map(fn($e) => "[$csvLabel] $e", $errors)
            );

        } catch (\Exception $e) {
            $allErrors[] = "$csvLabel failed entirely: " . $e->getMessage();
            Log::error("Refund CSV Sync — $csvLabel failed: " . $e->getMessage());
        }
    }

    // ── Auto-correct project date bounds and amounts (runs ONCE after all CSVs) ──
    foreach ($projectDateBounds as $projectId => $bounds) {
        $proj = null;
        foreach ($projectCache as $cached) {
            if ($cached && $cached->project_id == $projectId) {
                $proj = $cached;
                break;
            }
        }
        $proj = $proj ?? ProjectModel::find($projectId);
        if (!$proj) continue;

        $csvMin = $bounds['min'];
        $csvMax = $bounds['max'];

        $dbInitial = $proj->refund_initial
            ? Carbon::parse($proj->refund_initial)->format('Y-m-d')
            : null;
        $dbEnd = $proj->refund_end
            ? Carbon::parse($proj->refund_end)->format('Y-m-d')
            : null;

        // ── Date bound updates ────────────────────────────────────────────────
        $dateUpdates = [];

        if (!$dbInitial || $csvMin < $dbInitial) {
            $dateUpdates['refund_initial'] = $csvMin;
            Log::info("Project {$projectId}: refund_initial updated '{$dbInitial}' → '{$csvMin}'");
        }

        if (!$dbEnd || $csvMax > $dbEnd) {
            $dateUpdates['refund_end'] = $csvMax;
            Log::info("Project {$projectId}: refund_end updated '{$dbEnd}' → '{$csvMax}'");
        }

        if (!empty($dateUpdates)) {
            DB::table('tbl_projects')
                ->where('project_id', $projectId)
                ->update($dateUpdates);
        }

        // ── Amount updates ────────────────────────────────────────────────────
        $paidRefunds = RefundModel::where('project_id', $projectId)
            ->where('status', RefundModel::STATUS_PAID)
            ->where('refund_amount', '>', 0)
            ->get();

        if ($paidRefunds->isNotEmpty()) {
            $modeAmount = $paidRefunds
                ->groupBy('refund_amount')
                ->map->count()
                ->sortDesc()
                ->keys()
                ->first();

            $lastMonthRow = RefundModel::where('project_id', $projectId)
                ->where('month_paid', $csvMax)
                ->first();

            $lastRefundAmount = ($lastMonthRow && $lastMonthRow->refund_amount > 0)
                ? $lastMonthRow->refund_amount
                : $modeAmount;

            $amountUpdates = [];

            if ($modeAmount !== null && (float) $proj->refund_amount !== (float) $modeAmount) {
                $amountUpdates['refund_amount'] = $modeAmount;
                Log::info("Project {$projectId}: refund_amount updated '{$proj->refund_amount}' → '{$modeAmount}'");
            }

            if ($lastRefundAmount !== null && (float) $proj->last_refund !== (float) $lastRefundAmount) {
                $amountUpdates['last_refund'] = $lastRefundAmount;
                Log::info("Project {$projectId}: last_refund updated '{$proj->last_refund}' → '{$lastRefundAmount}'");
            }

            if (!empty($amountUpdates)) {
                ProjectModel::where('project_id', $projectId)->update($amountUpdates);
            }
        }
    }

    // ── Deduplicated error logging ────────────────────────────────────────────
    $deduplicatedErrors = [];
    foreach ($allErrors as $errorMsg) {
        $key = preg_match("/matched title '(.+?)'/", $errorMsg, $m)
            ? "No project matched: '{$m[1]}'"
            : $errorMsg;
        $deduplicatedErrors[$key] = ($deduplicatedErrors[$key] ?? 0) + 1;
    }

    if (!empty($deduplicatedErrors)) {
        Log::warning('Refund CSV Sync — rows that were NOT synced:');
        foreach ($deduplicatedErrors as $msg => $count) {
            $suffix = $count > 1 ? " ($count rows affected)" : '';
            Log::warning("Refund CSV Sync | Skipped: $msg$suffix");
        }
    }

    Log::info('Refund CSV Sync Summary', [
        'total_inserted' => $totalInserted,
        'total_skipped'  => $totalSkipped,
        'total_errors'   => count($allErrors),
        'sheets_synced'  => count($csvUrls),
    ]);

    $message = "$totalInserted refund records synced across " . count($csvUrls) . " sheet(s).";
    if ($totalSkipped)        $message .= " $totalSkipped rows skipped (no matching project).";
    if (!empty($allErrors))   $message .= ' ' . count($allErrors) . ' rows had errors.';

    return back()->with('success', $message);
}

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Track the earliest and latest month_paid seen per project during CSV sync.
     * Used to auto-correct refund_initial and refund_end on the project.
     */
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

    /**
     * Normalize a project title for fuzzy matching.
     * - Lowercases
     * - Replaces any punctuation/symbol with a space
     * - Collapses all resulting whitespace into a single space
     */
    private function normalizeTitleForMatching(string $title): string
    {
        $lower  = strtolower($title);
        $spaced = preg_replace('/[^a-z0-9]+/u', ' ', $lower);
        return trim(preg_replace('/\s+/', ' ', $spaced));
    }

    /**
     * Parse a date string from CSV into Y-m-d format.
     * Handles MM/DD/YYYY, MM/YYYY (treated as 1st of month), and Carbon fallback.
     */
    private function parseCsvDate(string $value): ?string
    {
        $v = trim($value);
        if ($v === '' || $v === '-') return null;

        // MM/DD/YYYY
        if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $v, $m)) {
            return sprintf('%04d-%02d-%02d', $m[3], $m[1], $m[2]);
        }

        // MM/YYYY — no day, use 1st
        if (preg_match('/^(\d{1,2})\/(\d{4})$/', $v, $m)) {
            return sprintf('%04d-%02d-01', $m[2], $m[1]);
        }

        try {
            return Carbon::parse($v)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Try to parse a restructuring date range from a string.
     *
     * Handles:
     *   "June 2004 - April 2005"   → full spaced, 4-digit years
     *   "Aug 2021 - Jan 2022"      → abbreviated spaced, 4-digit years
     *   "Jan - Jun 2023"           → shared year, spaced
     *   "Jul-Dec2024"              → no-space shared year
     *   "May2024-Jan2025"          → compact, no space between month and year
     *   "Jul23 - Aug 24"           → 2-digit years with spaces
     *   "Mar2025-2026"             → year-only end (same month, next year)
     */
    private function parseRestructureRange(string $text): ?array
    {
        $text = trim($text);

        $expand4 = function (string $year): string {
            if (strlen($year) === 2) {
                $y = (int) $year;
                return $y <= (int) date('y') + 10
                    ? '20' . sprintf('%02d', $y)
                    : '19' . sprintf('%02d', $y);
            }
            return $year;
        };

        $parseMonthYear = function (string $mon, string $year) use ($expand4): ?\Carbon\Carbon {
            try {
                return \Carbon\Carbon::parse("1 {$mon} " . $expand4($year))->startOfMonth();
            } catch (\Exception $e) {
                return null;
            }
        };

        // ── 1. Universal two-date range (MonYYYY, Mon YYYY, MonYY, Mon YY — any combo)
        if (preg_match(
            '/^([a-zA-Z]{3,9})\s*(\d{2,4})\s*[-–—]\s*([a-zA-Z]{3,9})\s*(\d{2,4})$/i',
            $text, $m
        )) {
            $start = $parseMonthYear($m[1], $m[2]);
            $end   = $parseMonthYear($m[3], $m[4]);
            if ($start && $end) return [$start, $end];
        }

        // ── 2. Year-only end: "MonYYYY-YYYY" — end month assumed same as start
        if (preg_match(
            '/^([a-zA-Z]{3,9})\s*(\d{2,4})\s*[-–—]\s*(\d{2,4})$/i',
            $text, $m
        )) {
            $start = $parseMonthYear($m[1], $m[2]);
            $end   = $parseMonthYear($m[1], $m[3]);
            if ($start && $end) return [$start, $end];
        }

        // ── 3. Shared year spaced: "Mon - Mon YYYY"
        if (preg_match(
            '/^([a-zA-Z]{3,9})\s*[-–—]\s*([a-zA-Z]{3,9})\s+(\d{2,4})$/i',
            $text, $m
        )) {
            $start = $parseMonthYear($m[1], $m[3]);
            $end   = $parseMonthYear($m[2], $m[3]);
            if ($start && $end) return [$start, $end];
        }

        // ── 4. Shared year no-space: "Mon-MonYYYY"
        if (preg_match(
            '/^([a-zA-Z]{3,9})[-–—]([a-zA-Z]{3,9})(\d{2,4})$/i',
            $text, $m
        )) {
            $start = $parseMonthYear($m[1], $m[3]);
            $end   = $parseMonthYear($m[2], $m[3]);
            if ($start && $end) return [$start, $end];
        }

        return null;
    }

    /**
     * Show detailed refund history for the logged-in user's own project.
     * View-only version for proponent users.
     */
    public function userProjectRefunds($projectId)
    {
        try {
            $userId = Auth::id();

            $project = ProjectModel::with(['proponent', 'refunds'])
                ->whereHas('proponent', function ($q) use ($userId) {
                    $q->where('added_by', $userId);
                })
                ->findOrFail($projectId);

            $months      = [];
            $totalPaid   = 0;
            $totalUnpaid = 0;
            $paidCount   = 0;
            $unpaidCount = 0;

            if ($project->refund_initial && $project->refund_end) {
                $start = Carbon::parse($project->refund_initial);
                $end   = Carbon::parse($project->refund_end);

                while ($start <= $end) {
                    $monthRefund = $project->refunds
                        ->where('month_paid', $start->format('Y-m-d'))
                        ->first();

                    if ($monthRefund) {
                        $refundAmount = $monthRefund->refund_amount;
                        $status       = $monthRefund->status;
                        $amountDue    = $monthRefund->amount_due;
                        $checkNum     = $monthRefund->check_num;
                        $checkDate    = $monthRefund->check_date;
                        $receiptNum   = $monthRefund->receipt_num;
                        $receiptDate  = $monthRefund->receipt_date;
                    } else {
                        $refundAmount = $this->getRefundAmountForMonth($project, $start);
                        $status       = 'unpaid';
                        $amountDue    = $refundAmount;
                        $checkNum     = null;
                        $checkDate    = null;
                        $receiptNum   = null;
                        $receiptDate  = null;
                    }

                    if ($status === 'paid') {
                        $totalPaid += $refundAmount;
                        $paidCount++;
                    } else {
                        $totalUnpaid += $refundAmount;
                        $unpaidCount++;
                    }

                    $months[] = [
                        'month'         => $start->format('F Y'),
                        'month_date'    => $start->format('Y-m-d'),
                        'refund_amount' => $refundAmount,
                        'amount_due'    => $amountDue,
                        'status'        => $status,
                        'check_num'     => $checkNum,
                        'check_date'    => $checkDate,
                        'receipt_num'   => $receiptNum,
                        'receipt_date'  => $receiptDate,
                        'is_past'       => $start->isPast(),
                    ];

                    $start->addMonth();
                }
            }

            return Inertia::render('Refunds/UserDetails', [
                'project' => [
                    'project_id'     => $project->project_id,
                    'project_title'  => $project->project_title,
                    'project_cost'   => $project->project_cost,
                    'refund_amount'  => $project->refund_amount,
                    'last_refund'    => $project->last_refund,
                    'refund_initial' => $project->refund_initial,
                    'refund_end'     => $project->refund_end,
                    'proponent'      => [
                        'company_name' => $project->proponent->company_name ?? 'N/A',
                        'email'        => $project->proponent->email ?? null,
                    ],
                ],
                'months'  => $months,
                'summary' => [
                    'total_paid'            => $totalPaid,
                    'total_unpaid'          => $totalUnpaid,
                    'paid_count'            => $paidCount,
                    'unpaid_count'          => $unpaidCount,
                    'total_months'          => count($months),
                    'completion_percentage' => count($months) > 0
                        ? round(($paidCount / count($months)) * 100, 2)
                        : 0,
                ],
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return back()->with('error', 'Project not found or you do not have permission to view this project.');
        } catch (\Exception $e) {
            Log::error('Error loading user project refund history: ' . $e->getMessage());
            return back()->with('error', 'Failed to load project refund history. Please try again.');
        }
    }
}