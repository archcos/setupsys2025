<?php

namespace App\Http\Controllers;

use App\Models\ProjectModel;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $projects = ProjectModel::with([
            'proponent',
            'implementation.tags',
            'refunds',
            'moa',
        ])
        ->when($user->role === 'user', function ($q) use ($user) {
            $q->whereHas('proponent', function ($sub) use ($user) {
                $sub->where('added_by', $user->user_id);
            });
        })
        ->when($user->role === 'staff', function ($q) use ($user) {
            $q->whereHas('proponent', function ($sub) use ($user) {
                $sub->where('office_id', $user->office_id);
            });
        })
        ->orderBy('created_at', 'desc')
        ->get();

        return Inertia::render('Dashboard/Index', [
            'projectDetails' => $projects->map(function ($project) {
                $projectCost = $project->project_cost ?? 0;
                $implementation = $project->implementation;
                $tags = $implementation?->tags ?? collect();
                $moa = $project->moa;
                $isWithdrawn = $project->progress === 'Withdrawn';
                $isTerminated = $project->progress === 'Terminated';

                // Calculate tag amounts
                $totalTagAmount = $tags->sum('tag_amount');
                $tagPercentage = $projectCost > 0 ? ($totalTagAmount / $projectCost) * 100 : 0;
                $isFullyUntagged = $tagPercentage >= 100;

                // Get 100% untagging date
                $finalUntagDate = null;
                $runningTotal = 0;
                foreach ($tags->sortBy('created_at') as $tag) {
                    $runningTotal += $tag->tag_amount;
                    if (!$finalUntagDate && $runningTotal >= $projectCost) {
                        $finalUntagDate = $tag->created_at;
                        break;
                    }
                }

                // Refund calculations
                $refundInitial = $project->refund_initial ? Carbon::parse($project->refund_initial) : null;
                $refundEnd = $project->refund_end ? Carbon::parse($project->refund_end) : null;
                
                $refundData = null;
                $refundCompleted = false;
                $lastRefundDate = null;
                
                if ($refundInitial && $refundEnd) {
                    $paidRefunds = $project->refunds->filter(fn($r) => strtolower($r->status) === 'paid');
                    $allPaid = $paidRefunds->count() === $project->refunds->count() && $project->refunds->isNotEmpty();
                    $lastPaidRefund = $paidRefunds->sortByDesc('updated_at')->first();
                    
                    $expectedMonths = [];
                    $cursor = $refundInitial->copy();
                    while ($cursor->lte($refundEnd)) {
                        $expectedMonths[] = $cursor->format('Y-m');
                        $cursor->addMonth();
                    }
                    
                    $refundCompleted = $allPaid;
                    $lastRefundDate = $lastPaidRefund?->updated_at;
                    
                    $refundData = [
                        'initial' => $refundInitial->format('F Y'),
                        'end' => $refundEnd->format('F Y'),
                        'total_months' => count($expectedMonths),
                        'paid_months' => $paidRefunds->count(),
                        'completed' => $refundCompleted,
                        'last_paid_date' => $lastRefundDate,
                        'progress' => count($expectedMonths) > 0 
                            ? round(($paidRefunds->count() / count($expectedMonths)) * 100) 
                            : 0,
                    ];
                }

                // Build milestones based on actual data
                $milestones = [];
                $completedCount = 0;
                $totalMilestones = 0;

                // 1. Company Profile
                $hasProponent = $project->proponent !== null;
                $milestones[] = [
                    'id' => 'company_profile',
                    'label' => 'Company Profile',
                    'description' => 'Proponent registration',
                    'completed' => $hasProponent,
                    'date' => $project->proponent?->created_at,
                    'icon' => 'Building',
                ];
                if ($hasProponent) $completedCount++;
                $totalMilestones++;

                // 2. Project Created
                $projectCreated = $project->created_at !== null;
                $milestones[] = [
                    'id' => 'project_created',
                    'label' => 'Project Created',
                    'description' => 'Project proposal submitted',
                    'completed' => $projectCreated,
                    'date' => $project->created_at,
                    'icon' => 'FileText',
                ];
                if ($projectCreated) $completedCount++;
                $totalMilestones++;

                // 3. Project Approved
                $projectApproved = $implementation !== null;
                $approvedDate = null;
                if ($projectApproved && $project->year_obligated && $project->year_obligated <= 2026) {
                    $approvedDate = Carbon::createFromDate($project->year_obligated, 1, 1)->format('Y-m-d');
                }
                $milestones[] = [
                    'id' => 'project_approved',
                    'label' => 'Project Approved',
                    'description' => 'Project approved for implementation',
                    'completed' => $projectApproved,
                    'date' => $approvedDate ?? $implementation?->created_at,
                    'icon' => 'CheckBadge',
                ];
                if ($projectApproved) $completedCount++;
                $totalMilestones++;

                // 4. MOA Uploaded
                $moaUploaded = $moa && $moa->hasApprovedFile();
                $milestones[] = [
                    'id' => 'moa_uploaded',
                    'label' => 'MOA Uploaded',
                    'description' => 'Approved MOA file uploaded',
                    'completed' => $moaUploaded,
                    'date' => $moa?->approved_file_uploaded_at,
                    'icon' => 'FileCheck',
                ];
                if ($moaUploaded) $completedCount++;
                $totalMilestones++;

                // 5. Implementation (with sub-items)
                $implementationStarted = $implementation !== null;
                $implementationCompleted = $implementation && $implementation->liquidation_upload && $isFullyUntagged;
                
                $implementationSubItems = [];
                if ($implementation) {
                    $implementationSubItems = [
                        [
                            'label' => 'Implementation Started',
                            'completed' => true,
                            'date' => $implementation->created_at,
                        ],
                        [
                            'label' => 'Tarpaulin Uploaded',
                            'completed' => (bool)($implementation->tarp_upload),
                            'date' => $implementation->tarp_upload,
                        ],
                        [
                            'label' => 'PDC Uploaded',
                            'completed' => (bool)($implementation->pdc_upload),
                            'date' => $implementation->pdc_upload,
                        ],
                        [
                            'label' => 'Final Untagging (100%)',
                            'completed' => $isFullyUntagged,
                            'date' => $finalUntagDate,
                        ],
                        [
                            'label' => 'Liquidation Submitted',
                            'completed' => (bool)($implementation->liquidation_upload),
                            'date' => $implementation->liquidation_upload,
                        ],
                    ];
                }

                $milestones[] = [
                    'id' => 'implementation',
                    'label' => 'Implementation',
                    'description' => 'Project execution & untagging',
                    'completed' => $implementationCompleted,
                    'date' => $implementation?->liquidation_upload ?? $finalUntagDate ?? $implementation?->created_at,
                    'icon' => 'Wrench',
                    'subItems' => $implementationSubItems,
                ];
                if ($implementationStarted) $completedCount++;
                $totalMilestones++;

                // 6. Refund
                $hasRefunds = !empty($refundData);
                $milestones[] = [
                    'id' => 'refund',
                    'label' => 'Refund',
                    'description' => 'Payment refund processing',
                    'completed' => $refundCompleted,
                    'date' => $lastRefundDate,
                    'icon' => 'Wallet',
                ];
                if ($hasRefunds) {
                    if ($refundCompleted) $completedCount++;
                    $totalMilestones++;
                }

                // 7. Completed
                $projectCompleted = $refundCompleted || $project->progress === 'Completed';
                $completedDate = null;
                if ($refundCompleted && $lastRefundDate) {
                    $completedDate = $lastRefundDate;
                } elseif ($project->progress === 'Completed') {
                    $completedDate = $project->updated_at;
                }
                
                $milestones[] = [
                    'id' => 'completed',
                    'label' => 'Completed',
                    'description' => 'Project successfully finished',
                    'completed' => $projectCompleted,
                    'date' => $completedDate,
                    'icon' => 'Trophy',
                ];
                if ($projectCompleted) $completedCount++;
                $totalMilestones++;

                // Determine overall status
                $status = $project->progress ?? 'Draft';
                if ($isWithdrawn) $status = 'Withdrawn';
                if ($isTerminated) $status = 'Terminated';
                
                // Calculate progress percentage
                $overallProgress = $totalMilestones > 0 ? round(($completedCount / $totalMilestones) * 100) : 0;
                
                // Override for special statuses
                if ($isWithdrawn || $isTerminated) {
                    $overallProgress = 100; // Or keep actual progress
                }

                return [
                    'project_id' => $project->project_id,
                    'project_title' => $project->project_title,
                    'project_cost' => $projectCost,
                    'progress_status' => $status,
                    'overall_progress' => $overallProgress,
                    'is_withdrawn' => $isWithdrawn,
                    'is_terminated' => $isTerminated,
                    'created_at' => $project->created_at,
                    'proponent' => [
                        'company_name' => $project->proponent?->company_name ?? 'N/A',
                        'owner_name' => $project->proponent?->owner_name ?? null,
                        'created_at' => $project->proponent?->created_at,
                    ],
                    'moa' => $moa ? [
                        'id' => $moa->moa_id,
                        'has_approved_file' => $moa->hasApprovedFile(),
                        'approved_file_uploaded_at' => $moa->approved_file_uploaded_at,
                        'approved_by' => $moa->approvedByUser?->name ?? null,
                    ] : null,
                    'implementation' => $implementation ? [
                        'implement_id' => $implementation->implement_id,
                        'tarp_upload' => $implementation->tarp_upload,
                        'pdc_upload' => $implementation->pdc_upload,
                        'liquidation_upload' => $implementation->liquidation_upload,
                        'created_at' => $implementation->created_at,
                        'total_tag_amount' => $totalTagAmount,
                        'tag_percentage' => round($tagPercentage, 1),
                        'is_fully_untagged' => $isFullyUntagged,
                        'final_untag_date' => $finalUntagDate,
                        'tags' => $tags->sortBy('created_at')->map(fn($tag) => [
                            'tag_name' => $tag->tag_name,
                            'tag_amount' => $tag->tag_amount,
                            'created_at' => $tag->created_at,
                        ])->values(),
                    ] : null,
                    'refund' => $refundData,
                    'milestones' => $milestones,
                ];
            }),
            'userCompanyName' => $user->proponents->first()?->company_name ?? 'User',
        ]);
    }
}