<?php

namespace App\Http\Controllers;

use App\Models\ProjectModel;
use App\Models\ActivityModel;
use App\Models\MoaModel;
use App\Models\RtecModel;
use App\Models\LogModel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $projects = ProjectModel::with([
            'company',
            'implementation.tags',
            'refunds'
        ])
        ->when($user->role === 'user', function ($q) use ($user) {
            $q->whereHas('company', function ($sub) use ($user) {
                $sub->where('added_by', $user->user_id);
            });
        })
        ->when($user->role === 'staff', function ($q) use ($user) {
            $q->whereHas('company', function ($sub) use ($user) {
                $sub->where('office_id', $user->office_id);
            });
        })
        ->get();

        $projectIds = $projects->pluck('project_id')->all();

        $lastActivities = ActivityModel::select('project_id', DB::raw('MAX(created_at) as last_activity_date'))
            ->whereIn('project_id', $projectIds)
            ->groupBy('project_id')
            ->pluck('last_activity_date', 'project_id');

        $moas = MoaModel::whereIn('project_id', $projectIds)
            ->get()
            ->keyBy('project_id');

        // Fetch progress logs for all projects - only where project_id is not null
        $progressLogs = LogModel::whereIn('project_id', $projectIds)
            ->whereNotNull('project_id')
            ->get()
            ->groupBy('project_id');

        return Inertia::render('Dashboard', [
            'projectDetails' => $projects->map(function ($project) use ($lastActivities, $moas, $progressLogs) {
                $projectCost = $project->project_cost ?? 0;
                $implementation = $project->implementation;
                $tags = $implementation?->tags ?? collect();
                $totalTagAmount = $tags->sum('tag_amount');

                $lastTagDate = $tags->max('created_at');
                $moa = $moas->get($project->project_id);

                $refundInitial = $project->refund_initial ? Carbon::parse($project->refund_initial) : null;
                $refundEnd = $project->refund_end ? Carbon::parse($project->refund_end) : null;

                $isRefundCompleted = false;
                $isRefundOngoing = false;

                if ($refundInitial && $refundEnd) {
                    $expectedMonths = [];
                    $cursor = $refundInitial->copy();
                    while ($cursor->lte($refundEnd)) {
                        $expectedMonths[] = $cursor->format('Y-m');
                        $cursor->addMonth();
                    }

                    $refundsByMonth = $project->refunds
                        ->keyBy(fn($refund) => Carbon::parse($refund->month_paid)->format('Y-m'));

                    $allPaid = true;
                    $isRefundOngoing = false;
                    $currentMonth = Carbon::now()->format('Y-m');

                    foreach ($expectedMonths as $month) {
                        $refund = $refundsByMonth->get($month);

                        if (!$refund || strtolower($refund->status) !== 'paid') {
                            $allPaid = false;
                        }

                        if ($month === $currentMonth && $refund && strtolower($refund->status) !== 'paid') {
                            $isRefundOngoing = true;
                        }
                    }

                    if ($allPaid) {
                        $isRefundCompleted = true;
                        if ($project->progress !== 'Refund' && $project->progress !== 'Completed') {
                            $project->progress = 'Refund';
                            $project->save();
                        }
                    }
                }

                // Get timestamps for progress transitions
                $projectLogs = $progressLogs->get($project->project_id, collect());
                
                $projectReviewDate = $this->getProgressTransitionDate($projectLogs, 'Project Review');
                $awaitingApprovalDate = $this->getProgressTransitionDate($projectLogs, 'Awaiting Approval');
                $approvedDate = $this->getProgressTransitionDate($projectLogs, 'Approved');
                $completedDate = $this->getProgressTransitionDate($projectLogs, 'Completed');

                return [
                    'project_id' => $project->project_id,
                    'project_title' => $project->project_title,
                    'progress' => $project->progress ?? '',
                    'project_cost' => $projectCost,
                    'created_at' => $project->created_at,
                    'company' => [
                        'created_at' => $project->company->created_at ?? null,
                    ],
                    'last_activity_date' => $lastActivities->get($project->project_id) ?? null,
                    'moa' => [
                        'updated_at' => $moa->updated_at ?? null,
                        'acknowledge_date' => (
                            in_array(strtolower($project->progress), ['draft moa', 'complete details'])
                                ? null
                                : ($moa->acknowledge_date ?? null)
                        ),
                    ],

                    'implementation' => $implementation ? [
                        'tarp_upload' => $implementation->tarp_upload ?? null,
                        'pdc_upload' => $implementation->pdc_upload ?? null,
                        'liquidation_upload' => $implementation->liquidation_upload ?? null,
                        'tags' => $tags->map(fn($tag) => [
                            'tag_name' => $tag->tag_name,
                            'tag_amount' => $tag->tag_amount,
                            'created_at' => $tag->created_at,
                        ]),
                        'untagging' => [
                            'first' => $projectCost > 0 && $totalTagAmount >= $projectCost * 0.5,
                            'final' => $projectCost > 0 && $totalTagAmount >= $projectCost,
                        ]
                    ] : null,
                    'last_tag_date' => $lastTagDate,

                    // Add progress dates
                    'progressDates' => [
                        'project_review' => $projectReviewDate,
                        'awaiting_approval' => $awaitingApprovalDate,
                        'approved' => $approvedDate,
                        'completed' => $completedDate,
                    ],

                    'refund' => [
                        'initial' => $refundInitial ? $refundInitial->format('Y-m') : null,
                        'initial_formatted' => $refundInitial ? $refundInitial->format('F, Y') : null,
                        'end' => $refundEnd ? $refundEnd->format('Y-m') : null,
                        'end_formatted' => $refundEnd ? $refundEnd->format('F, Y') : null,
                        'currentMonthOngoing' => $isRefundOngoing,
                        'completed' => $isRefundCompleted,
                        'refunds' => $project->refunds->map(fn($refund) => [
                            'month_paid' => $refund->month_paid,
                            'refund_amount' => $refund->refund_amount,
                            'amount_due' => $refund->amount_due,
                            'status' => $refund->status,
                            'check_num' => $refund->check_num,
                            'receipt_num' => $refund->receipt_num,
                        ]),
                    ]
                ];
            }),
            'userCompanyName' => $user->companies->first()?->company_name ?? 'Your Company',
        ]);
    }

    /**
     * Get the date when a project transitioned to a specific progress status
     * Looks for log entries where the "after" progress matches the target progress
     * 
     * @param \Illuminate\Support\Collection $logs
     * @param string $targetProgress
     * @return \Carbon\Carbon|null
     */
    private function getProgressTransitionDate($logs, $targetProgress)
    {
        if ($logs->isEmpty()) {
            return null;
        }

        $log = $logs->first(function ($log) use ($targetProgress) {
            try {
                $after = is_array($log->after) ? $log->after : json_decode($log->after ?? '{}', true);
                return ($after['progress'] ?? null) === $targetProgress;
            } catch (\Exception $e) {
                return false;
            }
        });

        return $log ? $log->created_at : null;
    }
}