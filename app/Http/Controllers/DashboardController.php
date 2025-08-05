<?php

namespace App\Http\Controllers;

use App\Models\ProjectModel;
use App\Models\UserModel;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $userId = session('user_id');
        $user = UserModel::find($userId);

        $projects = ProjectModel::with(['company', 'implementation.tags'])
            ->whereHas('company', fn ($q) => $q->where('added_by', $userId))
            ->get();

return Inertia::render('Dashboard', [
    'projectDetails' => $projects->map(function ($project) {
        $totalTagAmount = $project->implementation?->tags->sum('tag_amount') ?? 0;
        $projectCost = $project->project_cost ?? 0;

        return [
            'project_id' => $project->project_id,
            'project_title' => $project->project_title,
            'progress' => $project->progress ?? '',
            'project_cost' => $projectCost,
            'implementation' => $project->implementation ? [
                'tarp' => $project->implementation->tarp,
                'pdc' => $project->implementation->pdc,
                'liquidation' => $project->implementation->liquidation,
                'tags' => $project->implementation->tags->map(function ($tag) {
                    return [
                        'tag_name' => $tag->tag_name,
                        'tag_amount' => $tag->tag_amount,
                    ];
                }),
                'untagging' => [
                    'first' => $projectCost > 0 && $totalTagAmount >= $projectCost * 0.5,
                    'final' => $projectCost > 0 && $totalTagAmount >= $projectCost,
                ]
            ] : null,
        ];
    }),
    'userCompanyName' => $user->company->company_name ?? 'Your Company',
]);

    }
}
