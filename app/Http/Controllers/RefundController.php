<?php

namespace App\Http\Controllers;

use App\Mail\NotificationCreatedMail;
use App\Models\ProjectModel;
use App\Models\RefundModel;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
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

            // Only apply status filter to the eager loading if we're not looking for unpaid
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
            // For unpaid: projects that either have no refunds OR have unpaid refunds
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
            // For other statuses: projects that have refunds with that specific status
            $query->whereHas('refunds', function ($q) use ($selectedDate, $status) {
                $q->whereMonth('month_paid', $selectedDate->month)
                  ->whereYear('month_paid', $selectedDate->year)
                  ->where('status', $status);
            });
        }
    })
    ->paginate(10)
    ->through(function ($project) use ($selectedDate) {
        // ✅ Check if current selected month & year match refund_end
        if (
            $project->refund_end &&
            Carbon::parse($project->refund_end)->isSameMonth($selectedDate) &&
            Carbon::parse($project->refund_end)->isSameYear($selectedDate)
        ) {
            // Replace the refund_amount with last_refund value
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




public function save()
{
    $data = request()->validate([
        'project_id'     => 'required|exists:tbl_projects,project_id',
        'refund_amount'  => 'required|numeric|min:0',
        'amount_due'     => 'nullable|numeric|min:0',
        'check_num'      => 'nullable|numeric|min:0',
        'receipt_num'    => 'nullable|numeric|min:0',
        'status'         => 'required|in:paid,unpaid',
        'save_date'      => 'required|date_format:Y-m-d',
    ]);

    try {
        // Parse and normalize save date
        $savedMonthDate = Carbon::parse($data['save_date'])->startOfMonth()->format('Y-m-d');
        $readableMonth  = Carbon::parse($data['save_date'])->format('F Y'); // e.g. September 2025

        // Save or update refund record
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

        // Prepare values
        $formattedAmount = $refund->amount_due !== null
            ? '₱' . number_format($refund->amount_due, 2)
            : 'N/A';

        $project   = $refund->project ?? null;
        $company   = $project?->company ?? null;
        $ownerName = $company?->owner_name ?? 'Valued Client';

        // Format status
        $statusText  = strtoupper($refund->status); // ALL CAPS
        $statusColor = $refund->status === 'unpaid' ? 'red' : '#0056b3'; // red if unpaid, blue if paid
        $statusHtml  = "<span style='color: {$statusColor}; font-weight: bold;'>{$statusText}</span>";

        // Notification
        $notification = [
            'title' => 'Refund Update',
            'message' => "
                Dear {$ownerName},<br><br>
                Your refund record has been updated for the month of {$readableMonth}.<br><br>
                <strong>Status:</strong> {$statusHtml}<br>
                <strong>Amount:</strong> {$formattedAmount}<br><br>
                Thank you for your continued cooperation.<br>
                <em>- SETUPSYS Team</em>
            ",
        ];

        // Send email if company has email
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
                // ✅ No need to adjust, they are already YYYY-MM-01
                $start = Carbon::parse($project->refund_initial);
                $end   = Carbon::parse($project->refund_end);

                while ($start <= $end) {
                    $monthRefund = $project->refunds
                        ->where('month_paid', $start->format('Y-m-d'))
                        ->first();

                    if ($monthRefund) {
                        // If there's a record, use it as-is
                        $refundAmount = $monthRefund->refund_amount;
                        $status       = $monthRefund->status;
                    } else {
                        // Otherwise, default behavior:
                        $refundAmount = $start->equalTo($end)
                            ? ($project->last_refund ?? 0)   // ✅ final month → last_refund
                            : ($project->refund_amount ?? 0); // ✅ all other months → regular refund_amount
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

}