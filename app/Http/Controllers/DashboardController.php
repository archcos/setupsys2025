<?php

namespace App\Http\Controllers;

use App\Models\ProjectModel;
use App\Models\UserModel;
use App\Models\ActivityModel;
use App\Models\MoaModel;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $userId = session('user_id');

        // Load user with companies (one user can have many companies)
        $user = UserModel::with('companies')->find($userId);

        // Load projects with company, implementation and tags eager loaded,
        // only projects where company is added by this user
        $projects = ProjectModel::with([
            'company',
            'implementation.tags',
        ])->whereHas('company', fn ($q) => $q->where('added_by', $userId))
          ->get();

        $projectIds = $projects->pluck('project_id')->all();

        // Get last activity per project (project_id => latest created_at)
        $lastActivities = ActivityModel::select('project_id', DB::raw('MAX(created_at) as last_activity_date'))
            ->whereIn('project_id', $projectIds)
            ->groupBy('project_id')
            ->pluck('last_activity_date', 'project_id');

        // Get MOA data keyed by project_id
        $moas = MoaModel::whereIn('project_id', $projectIds)
            ->get()
            ->keyBy('project_id');

        return Inertia::render('Dashboard', [
            'projectDetails' => $projects->map(function ($project) use ($lastActivities, $moas) {
                $projectCost = $project->project_cost ?? 0;
                $implementation = $project->implementation;
                $tags = $implementation?->tags ?? collect();
                $totalTagAmount = $tags->sum('tag_amount');

                // Get latest tag created_at for project
                $lastTagDate = $tags->max('created_at');

                // MOA info
                $moa = $moas->get($project->project_id);

                return [
                    'project_id' => $project->project_id,
                    'project_title' => $project->project_title,
                    'progress' => $project->progress ?? '',
                    'project_cost' => $projectCost,

                    // Dates for checklist
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
                ];
            }),

            // For userCompanyName, just show the first company name the user added (can be adjusted)
            'userCompanyName' => $user->companies->first()?->company_name ?? 'Your Company',
        ]);
    }
}
