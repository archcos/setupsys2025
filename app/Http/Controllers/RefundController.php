<?php

namespace App\Http\Controllers;

use App\Models\ProjectModel;
use App\Models\RefundModel;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
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

            if ($status) {
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
        $query->whereHas('refunds', function ($q) use ($selectedDate, $status) {
            $q->whereMonth('month_paid', $selectedDate->month)
              ->whereYear('month_paid', $selectedDate->year)
              ->where('status', $status);
        });
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
    Log::info('RefundController@save called', [
        'incoming_data' => request()->all()
    ]);

    $data = request()->validate([
        'project_id'     => 'required|exists:tbl_projects,project_id',
        'refund_amount'  => 'required|numeric|min:0',
        'amount_due'     => 'nullable|numeric|min:0',
        'check_num'      => 'nullable|numeric|min:0',
        'receipt_num'    => 'nullable|numeric|min:0',
        'status'         => 'required|in:paid,unpaid',
        'save_date'      => 'required|date_format:Y-m-d',
    ]);

    Log::info('RefundController@save validated data', $data);

    try {
        // Parse and normalize save date
        $savedMonthDate = Carbon::parse($data['save_date'])->startOfMonth()->format('Y-m-d');


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

        Log::info('Refund saved/updated', $refund->toArray());

        return back()->with('success', 'Refund saved successfully.');
    } catch (\Exception $e) {
        Log::error('Error saving refund', [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        return back()->with('error', 'An error occurred while saving.');
    }
}

public function userRefunds()
{
    $userId = Auth::id();
    $search = request('search');
    $year   = request('year');

    // Get all projects for this user
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
        $start = Carbon::parse($project->refund_initial)->startOfMonth();
        $end   = Carbon::parse($project->refund_end)->startOfMonth();

while ($start <= $end) {
    $monthRefund = $project->refunds
        ->where('month_paid', $start->format('Y-m-d'))
        ->first();

    $refundAmount = $monthRefund->refund_amount ?? 0;
    $status = $monthRefund->status ?? 'unpaid'; // default if no record

    $months[] = [
        'month'         => $start->format('F Y'),
        'refund_amount' => $refundAmount,
        'status'        => strtolower($status) // normalize for frontend
    ];

    // First unpaid month from current month onwards
    if ($nextPaymentAmount === null && $status !== 'paid' && $start >= $today) {
        $nextPaymentAmount = $project->refund_amount; // from tbl_projects
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


    // Get distinct years for filter dropdown
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