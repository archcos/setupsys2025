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
        ->whereDate('refund_initial', '<=', $selectedDate)
        ->whereDate('refund_end', '>=', $selectedDate)

        ->when(!$includeWithdrawn && !$includeTerminated, fn ($q) => $q->whereNotIn('progress', ['Withdrawn', 'Terminated']))
        ->when($includeWithdrawn && !$includeTerminated, fn ($q) => $q->where(fn ($q) => $q->whereNotIn('progress', ['Terminated'])->orWhereNull('progress')))
        ->when(!$includeWithdrawn && $includeTerminated, fn ($q) => $q->where(fn ($q) => $q->whereNotIn('progress', ['Withdrawn'])->orWhereNull('progress')))

        ->when($isRPMO && $office, fn ($q) => $q->whereHas('proponent', fn ($q) => $q->where('office_id', $office)))

        ->when($search, function ($query, $search) {
            $query->where(function ($q) use ($search) {
                $q->where('project_title', 'like', "%{$search}%")
                    ->orWhere('project_id', 'like', "%{$search}%")
                    ->orWhereHas('proponent', fn ($q) => $q->where('company_name', 'like', "%{$search}%"));
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
        ]);
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
            'check_num' => 'nullable|string|max:20',
            'check_date' => 'nullable|date_format:Y-m-d',
            'receipt_num' => 'nullable|string|max:20',
            'receipt_date' => 'nullable|date_format:Y-m-d',
            // existing payments being edited
            'existing_payments' => 'nullable|array',
            'existing_payments.*.amount' => 'nullable|numeric|min:0',
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
                // 1️⃣  Replace the full payments array with edited existing entries
                $updatedPayments = [];
                foreach ($data['existing_payments'] ?? [] as $ep) {
                    $amount = (float) ($ep['amount'] ?? 0);
                    if ($amount <= 0) {
                        continue;
                    }          // drop zero-amount rows
                    $updatedPayments[] = [
                        'amount' => $amount,
                        'check_num' => $ep['check_num'] ?? null,
                        'check_date' => $ep['check_date'] ?? null,   // ← was missing
                        'receipt_num' => $ep['receipt_num'] ?? null,
                        'receipt_date' => $ep['receipt_date'] ?? null,   // ← was missing
                        'saved_at' => now()->toDateTimeString(),
                    ];
                }

                // 2️⃣  Append the new payment row (if amount > 0)
                $newAmount = (float) ($data['amount'] ?? 0);
                if ($newAmount > 0) {
                    $updatedPayments[] = [
                        'amount' => $newAmount,
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
            // each month_details value is an array of payment rows
            'month_details.*' => 'nullable|array',
            'month_details.*.*.amount' => 'nullable|numeric|min:0',
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
                // ← array of payment-row objects for this month
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
                        // Use the explicitly provided rows (with check/OR details)
                        foreach ($paymentRows as $row) {
                            $rowAmount = (float) ($row['amount'] ?? 0);
                            if ($rowAmount <= 0) {
                                continue;
                            }
                            $builtPayments[] = [
                                'amount' => $rowAmount,
                                'check_num' => !empty($row['check_num']) ? $row['check_num'] : null,
                                'check_date' => !empty($row['check_date']) ? $row['check_date'] : null,   // ← was broken
                                'receipt_num' => !empty($row['receipt_num']) ? $row['receipt_num'] : null,
                                'receipt_date' => !empty($row['receipt_date']) ? $row['receipt_date'] : null,   // ← was broken
                                'saved_at' => now()->toDateTimeString(),
                            ];
                        }
                    }

                    if (empty($builtPayments)) {
                        // No explicit rows — fall back to expected amount with no check/OR details
                        $builtPayments[] = [
                            'amount' => $expectedAmount,
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
