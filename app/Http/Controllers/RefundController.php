<?php

namespace App\Http\Controllers;

use App\Mail\NotificationCreatedMail;
use App\Models\ProjectModel;
use App\Models\RefundModel;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class RefundController extends Controller
{

public function index()
{
    $selectedMonth = request('month', now()->month);
    $selectedYear  = request('year', now()->year);
    $search        = request('search');
    $status        = request('status');

    $selectedDate = Carbon::create($selectedYear, $selectedMonth, 1);

    $projects = ProjectModel::with([
        'company',
        'refunds' => function ($q) use ($selectedDate, $status) {
            $q->whereMonth('month_paid', $selectedDate->month)
              ->whereYear('month_paid', $selectedDate->year)
              ->latest();

            if ($status && $status !== 'unpaid') {
                $q->where('status', $status);
            }
        }
    ])
    ->whereDate('refund_initial', '<=', $selectedDate)
    ->whereDate('refund_end', '>=', $selectedDate)
    ->when($search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
            $q->where('project_title', 'like', "%{$search}%")
              ->orWhereHas('company', function ($q) use ($search) {
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
    ->paginate(10)
    ->through(function ($project) use ($selectedDate) {
        if (
            $project->refund_end &&
            Carbon::parse($project->refund_end)->isSameMonth($selectedDate) &&
            Carbon::parse($project->refund_end)->isSameYear($selectedDate)
        ) {
            $project->refund_amount = $project->last_refund;
        }

        return $project;
    })
    ->withQueryString();

    return Inertia::render('Refunds/Refund', [
        'projects'       => $projects,
        'selectedMonth'  => $selectedMonth,
        'selectedYear'   => $selectedYear,
        'search'         => $search,
        'selectedStatus' => $status,
    ]);
}

// NEW METHOD: Show detailed refund history for a specific project
public function projectRefunds($projectId)
{
    $project = ProjectModel::with(['company', 'refunds'])->findOrFail($projectId);

    $months = [];
    $totalPaid = 0;
    $totalUnpaid = 0;
    $paidCount = 0;
    $unpaidCount = 0;

    if ($project->refund_initial && $project->refund_end) {
        $start = Carbon::parse($project->refund_initial);
        $end = Carbon::parse($project->refund_end);

        while ($start <= $end) {
            $monthRefund = $project->refunds
                ->where('month_paid', $start->format('Y-m-d'))
                ->first();

            if ($monthRefund) {
                $refundAmount = $monthRefund->refund_amount;
                $status = $monthRefund->status;
                $amountDue = $monthRefund->amount_due;
                $checkNum = $monthRefund->check_num;
                $receiptNum = $monthRefund->receipt_num;
            } else {
                $refundAmount = $start->equalTo($end)
                    ? ($project->last_refund ?? 0)
                    : ($project->refund_amount ?? 0);
                $status = 'unpaid';
                $amountDue = $refundAmount;
                $checkNum = null;
                $receiptNum = null;
            }

            // Calculate totals
            if ($status === 'paid') {
                $totalPaid += $refundAmount;
                $paidCount++;
            } else {
                $totalUnpaid += $refundAmount;
                $unpaidCount++;
            }

            $months[] = [
                'month' => $start->format('F Y'),
                'month_date' => $start->format('Y-m-d'),
                'refund_amount' => $refundAmount,
                'amount_due' => $amountDue,
                'status' => $status,
                'check_num' => $checkNum,
                'receipt_num' => $receiptNum,
                'is_past' => $start->isPast(),
            ];

            $start->addMonth();
        }
    }

    return Inertia::render('Refunds/RefundHistory', [
        'project' => [
            'project_id' => $project->project_id,
            'project_title' => $project->project_title,
            'project_cost' => $project->project_cost,
            'refund_amount' => $project->refund_amount,
            'last_refund' => $project->last_refund,
            'refund_initial' => $project->refund_initial,
            'refund_end' => $project->refund_end,
            'company' => [
                'company_name' => $project->company->company_name ?? 'N/A',
                'email' => $project->company->email ?? null,
            ],
        ],
        'months' => $months,
        'summary' => [
            'total_paid' => $totalPaid,
            'total_unpaid' => $totalUnpaid,
            'paid_count' => $paidCount,
            'unpaid_count' => $unpaidCount,
            'total_months' => count($months),
            'completion_percentage' => count($months) > 0 
                ? round(($paidCount / count($months)) * 100, 2) 
                : 0,
        ],
    ]);
}

public function save()
{
    $data = request()->validate([
        'project_id'     => 'required|exists:tbl_projects,project_id',
        'refund_amount'  => 'required|numeric|min:0',
        'amount_due'     => 'nullable|numeric|min:0',
        'check_num'      => 'nullable|numeric|min:0|max:11',
        'receipt_num'    => 'nullable|numeric|min:0|max:11',
        'status'         => 'required|in:paid,unpaid,restructured',
        'save_date'      => 'required|date_format:Y-m-d',
    ]);

    try {
        $savedMonthDate = Carbon::parse($data['save_date'])->startOfMonth()->format('Y-m-d');
        $readableMonth  = Carbon::parse($data['save_date'])->format('F Y');

        // If status is restructured, set amounts to 0
        if ($data['status'] === 'restructured') {
            $data['refund_amount'] = 0;
            $data['amount_due'] = 0;
        }

        $refund = RefundModel::updateOrCreate(
            [
                'project_id' => $data['project_id'],
                'month_paid' => $savedMonthDate
            ],
            [
                'refund_amount' => $data['refund_amount'],
                'amount_due'    => $data['amount_due'],
                'check_num'     => $data['check_num'] ?? null,
                'receipt_num'   => $data['receipt_num'] ?? null,
                'status'        => $data['status'],
            ]
        );

        $formattedAmount = $refund->amount_due !== null
            ? '₱' . number_format($refund->amount_due, 2)
            : 'N/A';

        $project   = $refund->project ?? null;
        $company   = $project?->company ?? null;
        $ownerName = $company?->owner_name ?? 'Valued Client';

        $statusText  = strtoupper($refund->status);
        $statusColor = $refund->status === 'unpaid' ? 'red' : ($refund->status === 'restructured' ? '#0066cc' : '#0056b3');
        $statusHtml  = "<span style='color: {$statusColor}; font-weight: bold;'>{$statusText}</span>";

        $notification = [
            'title' => 'Refund Update',
            'message' => "
                Dear {$ownerName},<br><br>
                Your refund record has been updated for the month of {$readableMonth}.<br><br>
                <strong>Status:</strong> {$statusHtml}<br>
                <strong>Amount:</strong> {$formattedAmount}<br><br>
                Thank you for your continued cooperation.<br>
                <em>- SETUP-RPMU</em>
            ",
        ];

        if ($company && $company->email) {
            Mail::to($company->email)->send(new NotificationCreatedMail($notification));
        }

        return back()->with('success', 'Refund saved successfully.');
    } catch (\Exception $e) {
        return back()->with('error', 'An error occurred while saving.');
    }
}

public function userRefunds()
{
    $userId = Auth::id();
    $search = request('search');
    $year   = request('year');

    $projects = ProjectModel::with(['company', 'refunds'])
        ->whereHas('company', function ($q) use ($userId) {
            $q->where('added_by', $userId);
        })
        ->when($search, function ($query, $search) {
            $query->where(function ($q) use ($search) {
                $q->where('project_title', 'like', "%{$search}%")
                  ->orWhereHas('company', function ($q) use ($search) {
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

            $outstanding = $project->project_cost - $totalRefund;

            $months = [];
            $nextPaymentAmount = null;
            $today = Carbon::now()->startOfMonth();

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
                        $refundAmount = $start->equalTo($end)
                            ? ($project->last_refund ?? 0)
                            : ($project->refund_amount ?? 0);
                        $status = 'unpaid';
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
                'company'             => $project->company->company_name ?? '-',
                'project_cost'        => $project->project_cost,
                'total_refund'        => $totalRefund,
                'outstanding_balance' => $outstanding,
                'months'              => $months,
                'next_payment'        => $nextPaymentAmount ?? 0
            ];
        });

    $years = ProjectModel::whereHas('company', function ($q) use ($userId) {
            $q->where('added_by', $userId);
        })
        ->select('year_obligated')
        ->distinct()
        ->pluck('year_obligated');

    return Inertia::render('Refunds/UserRefund', [
        'projects'      => $projects,
        'search'        => $search,
        'years'         => $years,
        'selectedYear'  => $year
    ]);
}

// UPDATED METHOD: Bulk update refund status with individual check_num and receipt_num for each month
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
        $project = ProjectModel::with('company')->findOrFail($data['project_id']);
        $updatedCount = 0;
        $monthDetails = $data['month_details'] ?? [];

        foreach ($data['month_dates'] as $monthDate) {
            $monthParsed = Carbon::parse($monthDate);
            
            // Get the refund amount for this month
            $refundAmount = 0;
            $amountDue = 0;
            
            if ($data['status'] !== 'restructured') {
                // Check if it's the last month
                if ($project->refund_end && $monthParsed->isSameMonth(Carbon::parse($project->refund_end))) {
                    $refundAmount = $project->last_refund ?? 0;
                } else {
                    $refundAmount = $project->refund_amount ?? 0;
                }
                $amountDue = $refundAmount;
            }

            // Get individual check_num and receipt_num for this month
            $checkNum = $monthDetails[$monthDate]['check_num'] ?? null;
            $receiptNum = $monthDetails[$monthDate]['receipt_num'] ?? null;

            // Only save if values are not empty strings
            $checkNum = !empty($checkNum) ? $checkNum : null;
            $receiptNum = !empty($receiptNum) ? $receiptNum : null;

            RefundModel::updateOrCreate(
                [
                    'project_id' => $data['project_id'],
                    'month_paid' => $monthDate
                ],
                [
                    'refund_amount' => $refundAmount,
                    'amount_due'    => $amountDue,
                    'status'        => $data['status'],
                    'check_num'     => $checkNum,
                    'receipt_num'   => $receiptNum,
                ]
            );
            
            $updatedCount++;
        }

        return back()->with('success', "{$updatedCount} month(s) updated successfully to " . strtoupper($data['status']) . ".");
    } catch (\Exception $e) {
        return back()->with('error', 'An error occurred while updating: ' . $e->getMessage());
    }
}

}