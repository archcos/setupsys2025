<?php

namespace App\Http\Controllers;

use App\Mail\NotificationCreatedMail;
use App\Models\ProjectModel;
use App\Models\RefundModel;
use App\Models\RestructureModel;
use App\Models\RestructureUpdateModel;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

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
        $approvedRestrctures = RestructureModel::where('project_id', $project->project_id)
            ->where('status', 'approved')
            ->get();

        foreach ($approvedRestrctures as $restructure) {
            $restructureStart = Carbon::parse($restructure->restruct_start);
            $restructureEnd = Carbon::parse($restructure->restruct_end);

            // Check if there are updates for this restructure
            $updates = RestructureUpdateModel::where('restruct_id', $restructure->restruct_id)->get();

            foreach ($updates as $update) {
                $updateStart = Carbon::parse($update->update_start);
                $updateEnd = Carbon::parse($update->update_end);

                // If the month falls within the update period, use the update amount
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
            // Get the refund amount considering restructures and their updates
            $refundAmount = $this->getRefundAmountForMonth($project, $selectedDate);
            $project->refund_amount = $refundAmount;

            return $project;
        })
        ->withQueryString();

        return Inertia::render('Refunds/Refund', [
            'projects'       => $projects,
            'selectedMonth'  => $selectedMonth,
            'selectedYear'   => $selectedYear,
            'search'         => $search,
            'selectedStatus' => $status,
            'userRole' => $user->role,
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
                'company',
                'refunds'
            ])->findOrFail($projectId);

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
                        // Get refund amount considering restructures and updates
                        $refundAmount = $this->getRefundAmountForMonth($project, $start);
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
                'userRole' => $user->role,
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

        } catch (\Exception $e) {
            

            return back()->with('error', 'Failed to load project refund history. Please try again.');
        }
    }

    public function save(){
        $data = request()->validate([
            'project_id'     => 'required|exists:tbl_projects,project_id',
            'refund_amount'  => 'required|numeric|min:0',
            'amount_due'     => 'nullable|numeric|min:0',
            'check_num'      => 'nullable|string|max:10', 
            'receipt_num'    => 'nullable|string|max:10',
            'status'         => 'required|in:paid,unpaid,restructured',
            'save_date'      => 'required|date_format:Y-m-d',
        ]);

        try {
            Log::info('========== REFUND SAVE STARTED ==========');
            Log::info('Request data:', $data);

            $savedMonthDate = Carbon::parse($data['save_date'])->startOfMonth()->format('Y-m-d');
            $readableMonth  = Carbon::parse($data['save_date'])->format('F Y');

            Log::info('Parsed dates:', [
                'savedMonthDate' => $savedMonthDate,
                'readableMonth' => $readableMonth,
            ]);

            // Get the project with refunds loaded
            $project = ProjectModel::with('refunds')->find($data['project_id']);
            if (!$project) {
                Log::error('Project not found for ID: ' . $data['project_id']);
                return back()->with('error', 'Project not found.');
            }

            Log::info('Project found:', [
                'project_id' => $project->project_id,
                'project_title' => $project->project_title,
                'refund_initial' => $project->refund_initial,
                'refund_end' => $project->refund_end,
            ]);

            // If status is restructured, set amounts to 0
            if ($data['status'] === 'restructured') {
                $data['refund_amount'] = 0;
                $data['amount_due'] = 0;
                Log::info('Status is restructured, setting amounts to 0');
            }

            // Check if refund_end equals the month being saved
            $refundEnd = Carbon::parse($project->refund_end)->startOfMonth()->format('Y-m-d');
            
            Log::info('Date comparison:', [
                'savedMonthDate' => $savedMonthDate,
                'refundEnd' => $refundEnd,
                'isEqual' => $savedMonthDate === $refundEnd,
                'status' => $data['status'],
            ]);

            $completionCheck = null;
            
            if ($savedMonthDate === $refundEnd) {
                Log::info('✅ Saved month matches refund_end!');
                
                // Only check completion if marking as paid at the last month
                if ($data['status'] === 'paid') {
                    Log::info('Status is PAID at refund_end, checking completion...');
                    
                    // Check if all months from refund_initial to refund_end are paid
                    $completionCheck = $project->checkRefundCompletionWithNewEntry(
                        $savedMonthDate,
                        $data['status']
                    );
                    
                    Log::info('Completion check result:', [
                        'is_complete' => $completionCheck['is_complete'],
                        'unpaid_months' => $completionCheck['unpaid_months'],
                    ]);
                    
                    // If not all months are paid, show warning with unpaid months
                    if (!$completionCheck['is_complete']) {
                        Log::warning('⚠️ Not all months are paid, returning warning modal');
                        
                        $warningData = [
                            'message' => 'Cannot update project status. The following months remain unpaid:',
                            'unpaid_months' => $completionCheck['unpaid_months'],
                            'project_title' => $project->project_title,
                            'refund_initial' => Carbon::parse($project->refund_initial)->format('F Y'),
                            'refund_end' => Carbon::parse($project->refund_end)->format('F Y'),
                            'action' => 'Please ensure all months between ' . 
                                    Carbon::parse($project->refund_initial)->format('F Y') . 
                                    ' and ' . 
                                    Carbon::parse($project->refund_end)->format('F Y') . 
                                    ' are paid before completing the project.'
                        ];
                        
                        Log::info('Warning data to send:', $warningData);
                        
                        return back()
                            ->with('warning', $warningData)
                            ->withInput();
                    }
                    
                    Log::info('✅ All months are paid! Proceeding to save...');
                } else {
                    // If at refund_end but not marking as paid, show error
                    Log::warning('❌ At refund_end but status is not PAID, status: ' . $data['status']);
                    
                    return back()
                        ->with('error', 'The final refund month must be marked as "Paid" to complete the project.')
                        ->withInput();
                }
            } else {
                Log::info('⚠️ Saved month does not match refund_end, saving without completion check');
                Log::info('Months are different - no validation needed');
            }

            // Save the refund
            Log::info('Saving refund...');
            
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
            
            Log::info('Refund saved:', [
                'refund_id' => $refund->refund_id ?? 'N/A',
                'status' => $refund->status,
            ]);

            // If we're at refund_end and all months are paid, update project status to Completed
            if ($savedMonthDate === $refundEnd && $completionCheck && $completionCheck['is_complete']) {
                Log::info('🎉 All conditions met! Updating project status to Completed');
                
                $project->update([
                    'progress' => 'Completed'
                ]);
                
                Log::info('Project status updated to Completed');
            }

            $company   = $project->company ?? null;
            $ownerName = $company?->owner_name ?? 'Valued Client';
            $projectTitle = $project->project_title ?? 'N/A';
            $companyName = $company?->company_name ?? 'N/A';

            // Send email notification
            if ($company && $company->email) {
                try {
                    Log::info('Sending email to: ' . $company->email);
                    
                    Mail::to($company->email)->send(
                        new \App\Mail\RefundNotificationMail(
                            $ownerName,
                            $projectTitle,
                            $companyName,
                            $readableMonth,
                            $data['status'],
                            $refund->amount_due
                        )
                    );
                    Log::info("Refund notification email sent to {$company->email}");

                    if ($savedMonthDate === $refundEnd && $completionCheck && $completionCheck['is_complete']) {
                        Mail::to($company->email)->send(
                            new \App\Mail\RefundCompletedMail(
                                $project->project_id,
                                now()->format('F d, Y \a\t h:i A')
                            )
                        );
                        Log::info("Refund completion congratulations email sent to {$company->email}");
                    }
                } catch (\Exception $e) {
                    Log::error("Failed to send refund email to {$company->email}: " . $e->getMessage());
                }
            }

            $message = 'Refund saved successfully.';
            if ($savedMonthDate === $refundEnd && $completionCheck && $completionCheck['is_complete']) {
                $message .= ' Project status updated to Completed.';
            }

            return back()->with('success', $message);
        } catch (\Exception $e) {

            return back()->with('error', 'An error occurred while saving: ' . $e->getMessage());
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
                            // Get refund amount considering restructures and updates
                            $refundAmount = $this->getRefundAmountForMonth($project, $start);
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

    /**
     * Bulk update refund status with individual check_num and receipt_num for each month
     */
    public function bulkUpdate(){
        $data = request()->validate([
            'project_id'    => 'required|exists:tbl_projects,project_id',
            'month_dates'   => 'required|array',
            'month_dates.*' => 'required|date_format:Y-m-d',
            'status'        => 'required|in:paid,unpaid,restructured',
            'month_details' => 'nullable|array',
        ]);

        try {

            $project = ProjectModel::with('company', 'refunds')->findOrFail($data['project_id']);

            $updatedCount = 0;
            $monthDetails = $data['month_details'] ?? [];
            $refundEnd = Carbon::parse($project->refund_end)->startOfMonth()->format('Y-m-d');
            $isMarkingAsComplete = false;

            // Check if any of the months being updated is the refund_end and status is paid
            foreach ($data['month_dates'] as $monthDate) {
                $monthParsed = Carbon::parse($monthDate)->startOfMonth()->format('Y-m-d');
                
                if ($monthParsed === $refundEnd && $data['status'] === 'paid') {
                    $isMarkingAsComplete = true;
                    break;
                }
            }

            // If marking as complete, check if all months will be paid
            if ($isMarkingAsComplete) {
                
                // We need to check completion considering the new entries that will be created
                // Get all month dates being updated
                $monthsToUpdate = collect($data['month_dates'])
                    ->map(fn($date) => Carbon::parse($date)->startOfMonth()->format('Y-m-d'))
                    ->unique()
                    ->toArray();

                // Check completion with the bulk update
                $completionCheck = $project->checkRefundCompletionWithBulkUpdate(
                    $monthsToUpdate,
                    $data['status']
                );

                // If not all months are paid, show warning
                if (!$completionCheck['is_complete']) {
                    
                    $warningData = [
                        'message' => 'Cannot update project status. The following months remain unpaid:',
                        'unpaid_months' => $completionCheck['unpaid_months'],
                        'project_title' => $project->project_title,
                        'refund_initial' => Carbon::parse($project->refund_initial)->format('F Y'),
                        'refund_end' => Carbon::parse($project->refund_end)->format('F Y'),
                        'action' => 'Please ensure all months between ' . 
                                Carbon::parse($project->refund_initial)->format('F Y') . 
                                ' and ' . 
                                Carbon::parse($project->refund_end)->format('F Y') . 
                                ' are paid before completing the project.'
                    ];
                    
                    Log::info('Warning data to send:', $warningData);
                    
                    return back()
                        ->with('warning', $warningData)
                        ->withInput();
                }
                
                Log::info('✅ All months will be paid! Proceeding with bulk update...');
            }

            // Proceed with bulk update
            foreach ($data['month_dates'] as $monthDate) {
                $monthParsed = Carbon::parse($monthDate);
                
                // Get the refund amount for this month considering restructures
                $refundAmount = 0;
                $amountDue = 0;
                
                if ($data['status'] !== 'restructured') {
                    $refundAmount = $this->getRefundAmountForMonth($project, $monthParsed);
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

            // If we were marking as complete and all months are paid, update project status
            if ($isMarkingAsComplete) {
                
                $project->update([
                    'progress' => 'Completed'
                ]);
            }

            $message = "{$updatedCount} month(s) updated successfully to " . strtoupper($data['status']) . ".";
            if ($isMarkingAsComplete) {
                $message .= ' Project status updated to Completed.';
            }
            return back()->with('success', $message);
        } catch (\Exception $e) {

            return back()->with('error', 'An error occurred while updating: ' . $e->getMessage());
        }
    }

    /**
 * Show detailed refund history for the logged-in user's own project
 * View-only version for company users to see their project refund details
 */
public function userProjectRefunds($projectId)
{
    try {
        $userId = Auth::id();

        // Get project and verify it belongs to the logged-in user's company
        $project = ProjectModel::with([
            'company',
            'refunds'
        ])
        ->whereHas('company', function ($q) use ($userId) {
            $q->where('added_by', $userId);
        })
        ->findOrFail($projectId);

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
                    // Get refund amount considering restructures and updates
                    $refundAmount = $this->getRefundAmountForMonth($project, $start);
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

        return Inertia::render('Refunds/UserRefundHistory', [
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

    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        return back()->with('error', 'Project not found or you do not have permission to view this project.');
    } catch (\Exception $e) {
        \Illuminate\Support\Facades\Log::error('Error loading user project refund history: ' . $e->getMessage());
        return back()->with('error', 'Failed to load project refund history. Please try again.');
    }
}
}