<?php

namespace App\Http\Controllers;
use App\Models\ProjectModel;
use App\Models\UserModel;
use App\Models\OfficeModel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeController extends Controller
{
public function index(Request $request)
{
    $year = $request->input('year') ?? date('Y');
    $userId = session('user_id');
    $user = UserModel::find($userId);

    $query = ProjectModel::with('company.office')
        ->whereYear('year_obligated', $year);

    if ($user && $user->role === 'staff') {
        $query->whereHas('company', function ($q) use ($user) {
            $q->where('office_id', $user->office_id);
        });
    } elseif ($user && $user->role === 'user') {
        $query->where('added_by', $user->user_id);
    }

    $projects = $query->get();

    $projectsPerOffice = $projects
        ->groupBy(fn($p) => $p->company->office->office_name ?? 'No Office')
        ->map(fn($group) => $group->count());

    $availableYears = ProjectModel::selectRaw('YEAR(year_obligated) as year')
        ->distinct()
        ->orderByDesc('year')
        ->pluck('year');

    return Inertia::render('Home', [
        'projectsPerOffice' => $projectsPerOffice,
        'projectDetails' => $projects->map(function ($project) {
            return [
                'project_title' => $project->project_title,
                'company_name' => $project->company->company_name ?? '',
                'progress' => $project->progress ?? '',
            ];
        }),
        'selectedYear' => $year,
        'availableYears' => $availableYears,
        'userOfficeId' => $user->office_id ?? null,
        'userOfficeName' => optional(OfficeModel::find($user->office_id))->office_name ?? '',
    ]);
}

}
