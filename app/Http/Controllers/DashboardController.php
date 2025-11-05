<?php

namespace App\Http\Controllers;

use App\Models\ProjectModel;
use App\Models\ActivityModel;
use App\Models\MoaModel;
use App\Models\RtecModel;
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

        return Inertia::render('Dashboard', [
            'projectDetails' => $projects->map(function ($project) use ($lastActivities, $moas) {
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

                return [
                    'project_id' => $project->project_id,
                    'project_title' => $project->project_title,
                    'progress' => $project->progress ?? '',
                    'project_cost' => $projectCost,

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

public function rtecdashboard(Request $request)
{
    $user = Auth::user();
    $role = $user->role;
    
    // Define allowed progress statuses based on role
    $allowedStatuses = $this->getAllowedStatuses($role);
    
    // Check if user has full access (rd or au roles)
    $hasFullAccess = in_array($role, ['rd', 'au']);
    
    // Initialize statusCounts array
    $statusCounts = [];
    
    // Get counts for each status
    foreach ($allowedStatuses as $status) {
        if ($hasFullAccess) {
            // For rd and au: count unique projects with this status
            $count = RtecModel::where('progress', $status)
                ->whereHas('project', function ($query) use ($status) {
                    $query->where('progress', $status);
                })
                ->distinct('project_id') // <--- only unique projects
                ->count('project_id');   // <--- count unique project IDs
        } else {
            // For irtec and ertec: count only assigned unique projects
            $count = RtecModel::where('user_id', $user->user_id)
                ->where('progress', $status)
                ->whereHas('project', function ($query) use ($status) {
                    $query->where('progress', $status);
                })
                ->distinct('project_id') // <--- ensure no duplicate projects
                ->count('project_id');
        }

        $statusCounts[$status] = $count;
    }

    
    // Get filtered projects
    $filterStatus = $request->input('status');
    
    // Base query with matching progress requirement
    if ($hasFullAccess) {
        // For rd and au: show all RTECs (no user_id filter)
        $projectsQuery = RtecModel::whereIn('progress', $allowedStatuses)
            ->with([
                'project.company',
                'user'
            ]);
    } else {
        // For irtec and ertec: show only assigned RTECs
        $projectsQuery = RtecModel::where('user_id', $user->user_id)
            ->whereIn('progress', $allowedStatuses)
            ->with([
                'project.company',
                'user'
            ]);
    }
    
    // Apply filter if status is selected
    if ($filterStatus && in_array($filterStatus, $allowedStatuses)) {
        // Filter by specific status - both rtec and project must match
        $projectsQuery->where('progress', $filterStatus)
            ->whereHas('project', function($query) use ($filterStatus) {
                $query->where('progress', $filterStatus);
            });
    } else {
        // No filter selected - show all projects where rtec and project progress match
        $projectsQuery->where(function($query) use ($allowedStatuses) {
            foreach ($allowedStatuses as $status) {
                $query->orWhere(function($q) use ($status) {
                    $q->where('progress', $status)
                      ->whereHas('project', function($subQuery) use ($status) {
                          $subQuery->where('progress', $status);
                      });
                });
            }
        });
    }
    
  $projects = $projectsQuery
    ->orderBy('created_at', 'desc')
    ->get()
    ->when($hasFullAccess, fn($collection) => $collection->unique('project_id')) // <--- only unique projects for rd/au
    ->values()
    ->map(function ($rtec) {
        return [
            'rtec_id' => $rtec->rtec_id,
            'project_id' => $rtec->project_id,
            'project_title' => $rtec->project->project_title ?? 'N/A',
            'company_name' => $rtec->project->company->company_name ?? 'N/A',
            'assigned_user' => $rtec->user->name ?? 'Unassigned',
            'progress' => $rtec->progress,
            'schedule' => $rtec->schedule ? $rtec->schedule->format('M d, Y h:i A') : 'Not scheduled',
            'zoom_link' => $rtec->zoom_link,
            'created_at' => $rtec->created_at->format('M d, Y'),
        ];
    });

    return inertia('RtecDashboard', [
        'statusCounts' => $statusCounts,
        'allowedStatuses' => $allowedStatuses,
        'projects' => $projects,
        'currentFilter' => $filterStatus,
        'userRole' => $role,
    ]);
}

private function getAllowedStatuses($role)
{
    if ($role === 'irtec') {
        return ['internal_rtec', 'internal_compliance'];
    } elseif ($role === 'ertec') {
        return ['external_rtec', 'external_compliance', 'approval', 'Approved'];
    }
    
    // For rd, au, admin or other roles: show all statuses
    return [
        'internal_rtec',
        'internal_compliance',
        'external_rtec',
        'external_compliance',
        'approval',
        'Approved'
    ];
}
}
