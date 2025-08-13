<?php

namespace App\Http\Controllers;

use App\Models\ProjectModel;
use App\Models\LoanModel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class LoanController extends Controller
{

public function index()
{
    $selectedMonth = request('month', now()->month);
    $selectedYear = request('year', now()->year);
    $search = request('search');

    $projects = ProjectModel::with([
        'company',
        'loans' => function ($q) use ($selectedMonth, $selectedYear) {
            $q->whereMonth('month_paid', $selectedMonth)
              ->whereYear('month_paid', $selectedYear)
              ->latest();
        }
    ])
    ->whereMonth('refund_initial', '<=', $selectedMonth)
    ->whereMonth('refund_end', '>=', $selectedMonth)
    ->whereYear('refund_initial', '<=', $selectedYear)
    ->whereYear('refund_end', '>=', $selectedYear)
    ->when($search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
            $q->where('project_title', 'like', "%{$search}%")
              ->orWhereHas('company', function ($q) use ($search) {
                  $q->where('company_name', 'like', "%{$search}%");
              });
        });
    })
    ->paginate(10)
    ->withQueryString();

    return Inertia::render('Refunds/Loan', [
        'projects' => $projects,
        'selectedMonth' => $selectedMonth,
        'selectedYear' => $selectedYear,
        'search' => $search,
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
        'status'         => 'required|in:paid,unpaid',
        'save_date'      => 'required|date_format:Y-m-d', // new
    ]);

    Log::info('LoanController@save validated data', $data);

    try {
        // Parse and normalize save date
        $savedMonthDate = \Carbon\Carbon::parse($data['save_date'])->startOfMonth()->format('Y-m-d');

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
    $userId = Auth::id(); // Get logged-in user ID
    $search = request('search');

    $projects = ProjectModel::with([
        'company',
        'loans' => function ($q) {
            $q->latest(); // Just order, no month/year filter
        }
    ])
    // Filter projects by companies where added_by = logged-in user
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
    ->paginate(10)
    ->withQueryString();

    return Inertia::render('Refunds/UserLoan', [
        'projects' => $projects,
        'search' => $search,
    ]);
}



}
