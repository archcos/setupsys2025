<?php

namespace App\Http\Controllers;

use App\Models\ProjectModel;
use App\Models\LoanModel;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class LoanController extends Controller
{

public function index()
{
    $selectedMonth = request('month', now()->month);
    $selectedYear  = request('year', now()->year);
    $search        = request('search');
    $status        = request('status'); // 👈 new

    $selectedDate = Carbon::create($selectedYear, $selectedMonth, 1);

$projects = ProjectModel::with([
    'company',
    'loans' => function ($q) use ($selectedDate, $status) {
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
// 🔹 Add this so projects without a matching loan don’t appear
->when($status, function ($query, $status) use ($selectedDate) {
    $query->whereHas('loans', function ($q) use ($selectedDate, $status) {
        $q->whereMonth('month_paid', $selectedDate->month)
          ->whereYear('month_paid', $selectedDate->year)
          ->where('status', $status);
    });
})
->paginate(10)
->withQueryString();


    return Inertia::render('Refunds/Loan', [
        'projects'       => $projects,
        'selectedMonth'  => $selectedMonth,
        'selectedYear'   => $selectedYear,
        'search'         => $search,
        'selectedStatus' => $status, // 👈 pass back to frontend
    ]);
}




public function save()
{
    Log::info('LoanController@save called', [
        'incoming_data' => request()->all()
    ]);

    $data = request()->validate([
        'project_id'     => 'required|exists:tbl_projects,project_id',
        'refund_amount'  => 'required|numeric|min:0',
        'amount_due'    => 'nullable|numeric|min:0',
        'check_num'     => 'nullable|numeric|min:0',
        'receipt_num'   => 'nullable|numeric|min:0',
        'status'         => 'required|in:paid,unpaid',
        'save_date'      => 'required|date_format:Y-m-d', // new
    ]);

    Log::info('LoanController@save validated data', $data);

    try {
        // Parse and normalize save date
        $savedMonthDate = Carbon::parse($data['save_date'])->startOfMonth()->format('Y-m-d');

        // Update refund_amount in projects
        $project = ProjectModel::findOrFail($data['project_id']);
        $project->refund_amount = $data['refund_amount'];
        $project->save();

        Log::info('Project updated', [
            'project_id' => $project->project_id,
            'refund_amount' => $project->refund_amount
        ]);

        // Save or update loan
        $loan = LoanModel::updateOrCreate(
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

        Log::info('Loan saved/updated', $loan->toArray());

        return back()->with('success', 'Refund saved successfully.');
    } catch (\Exception $e) {
        Log::error('Error saving loan', [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        return back()->with('error', 'An error occurred while saving.');
    }
}

public function userLoans()
{
    $userId = Auth::id();
    $search = request('search');
    $year   = request('year');

    // Get all projects for this user
    $projects = ProjectModel::with(['company', 'loans'])
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
    $totalRefund = $project->loans
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
    $monthLoan = $project->loans
        ->where('month_paid', $start->format('Y-m-d'))
        ->first();

    $refundAmount = $monthLoan->refund_amount ?? 0;
    $status = $monthLoan->status ?? 'unpaid'; // default if no record

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

    return Inertia::render('Refunds/UserLoan', [
        'projects'      => $projects,
        'search'        => $search,
        'years'         => $years,
        'selectedYear'  => $year
    ]);
}
}