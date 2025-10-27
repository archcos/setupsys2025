<?php

namespace App\Http\Controllers;

use App\Models\ProjectModel;
use App\Models\UserModel;
use App\Models\ActivityModel;
use App\Models\MoaModel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\RefundModel;
use Carbon\Carbon;

class DashboardController extends Controller
{

public function index()
{
    $userId = Auth::id();
    $user = UserModel::with('companies')->find($userId);

    $projects = ProjectModel::with([
        'company',
        'implementation.tags',
        'refunds' // ✅ eager load refunds directly
    ])->whereHas('company', fn ($q) => $q->where('added_by', $userId))
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

            // ✅ Refund Logic
            $refundInitial = $project->refund_initial ? Carbon::parse($project->refund_initial) : null;
            $refundEnd = $project->refund_end ? Carbon::parse($project->refund_end) : null;

            $isRefundCompleted = false;
            $isRefundOngoing = false;

if ($refundInitial && $refundEnd) {
    // Build list of expected months between refund_initial and refund_end
    $expectedMonths = [];
    $cursor = $refundInitial->copy();
    while ($cursor->lte($refundEnd)) {
        $expectedMonths[] = $cursor->format('Y-m'); // use Y-m for comparison
        $cursor->addMonth();
    }

    // Map refunds by month_paid
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

                // ✅ Refund data returned to frontend
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
}
