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

    // Fetch only projects created by the logged-in user's companies
    $projects = ProjectModel::with(['company'])
        ->whereHas('company', function ($q) use ($userId) {
            $q->where('added_by', $userId);
        })
        ->get()
        ->map(function ($project) {
            return [
                'project_title' => $project->project_title,
                'progress' => $project->progress_status ?? null,
            ];
        });

    return Inertia::render('Dashboard', [
        'projectDetails' => $projects,
        'userCompanyName' => $user->company->company_name ?? 'Your Company',
    ]);
}
}