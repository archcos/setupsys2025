<?php

namespace App\Http\Controllers;

use App\Models\OfficeModel;
use App\Models\ProjectModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index(Request $request)
    {
        $year = $request->input('year') ?? date('Y');
        $user = Auth::user();

        // Province mapping based on office_id
        $provinceMapping = [
            2 => 'Bukidnon',
            3 => 'Camiguin',
            4 => 'Lanao del Norte',
            5 => 'Misamis Occidental',
            6 => 'Misamis Oriental',
        ];

        $query = ProjectModel::with('proponent.office')
            // Exclude Regional Office (office_id = 1)
            ->whereHas('proponent', function ($q) {
                $q->where('office_id', '!=', 1);
            });

                // Only filter by year if not 'all'
        if ($year !== 'all') {
            $query->where('year_obligated', (int)$year);
        }

        // Filter projects based on user role
        if ($user && $user->role === 'staff') {
            // Staff users only see projects from their office (already excluding office_id = 1)
            $query->whereHas('proponent', function ($q) use ($user) {
                $q->where('office_id', $user->office_id);
            });
        } elseif ($user && $user->role === 'user') {
            // Regular users only see their own projects
            $query->where('added_by', $user->user_id);
        }
        // Admin, RPMO, AU, Head users see all projects (excluding office_id = 1)

        $projects = $query->get();

        // Group projects by office for the "Projects Per Office" card and sort alphabetically
        $projectsPerOffice = $projects
            ->groupBy(fn ($p) => $p->proponent->office->office_name ?? 'No Office')
            ->map(fn ($group) => $group->count())
            ->sortKeys();

        // Calculate total project cost by province WITH stage breakdown
        $projectCostByProvince = $projects
            ->groupBy(function ($project) use ($provinceMapping) {
                // Get province from office_id mapping
                $officeId = $project->proponent->office_id ?? null;

                return $provinceMapping[$officeId] ?? 'Unknown';
            })
            ->map(function ($group) {
                $withdrawnProjects = $group->filter(fn ($p) => $p->progress === 'Withdrawn');
                $terminatedProjects = $group->filter(fn ($p) => $p->progress === 'Terminated');
                $disapprovedProjects = $group->filter(fn ($p) => $p->progress === 'Disapproved');
                $activeProjects = $group->filter(fn ($p) => !in_array($p->progress, ['Withdrawn', 'Terminated', 'Disapproved']));

                return [
                    'total_cost' => $group->sum('project_cost'),
                    'project_count' => $group->count(),
                    'active_cost' => $activeProjects->sum('project_cost'),
                    'active_count' => $activeProjects->count(),
                    'withdrawn_cost' => $withdrawnProjects->sum('project_cost'),
                    'withdrawn_count' => $withdrawnProjects->count(),
                    'terminated_cost' => $terminatedProjects->sum('project_cost'),
                    'terminated_count' => $terminatedProjects->count(),
                    'disapproved_cost' => $disapprovedProjects->sum('project_cost'),
                    'disapproved_count' => $disapprovedProjects->count(),
                ];
            })
            ->sortKeys();

        // Total project cost for the year (already excluding Regional Office)
        $totalProjectCost = $projects->sum('project_cost');

        // Cost breakdowns
        $activeProjectCost = $projects->filter(fn ($p) => !in_array($p->progress, ['Withdrawn', 'Terminated', 'Disapproved']))->sum('project_cost');
        $withdrawnProjectCost = $projects->filter(fn ($p) => $p->progress === 'Withdrawn')->sum('project_cost');
        $terminatedProjectCost = $projects->filter(fn ($p) => $p->progress === 'Terminated')->sum('project_cost');
        $disapprovedProjectCost = $projects->filter(fn ($p) => $p->progress === 'Disapproved')->sum('project_cost');

        // Get all available years from the database
        $availableYears = ProjectModel::select('year_obligated')
            ->distinct()
            ->whereNotNull('year_obligated')
            ->orderByDesc('year_obligated')
            ->pluck('year_obligated')
            ->map(function ($year) {
                return (int) $year; // Convert to integer since YEAR type returns string
            })
            ->toArray();

        $currentYear = (int) date('Y');
        if (!in_array($currentYear, $availableYears)) {
            $availableYears[] = $currentYear;
        }
        rsort($availableYears);

        // Determine if user can view analytics
        $canViewAnalytics = in_array($user->role, ['admin', 'rpmo', 'au', 'head']);

        return Inertia::render('Home/Index', [
            'projectsPerOffice' => $projectsPerOffice,
            'projectCostByProvince' => $projectCostByProvince,
            'totalProjectCost' => $totalProjectCost,
            'activeProjectCost' => $activeProjectCost,
            'withdrawnProjectCost' => $withdrawnProjectCost,
            'terminatedProjectCost' => $terminatedProjectCost,
            'disapprovedProjectCost' => $disapprovedProjectCost,
            'projectDetails' => $projects->map(function ($project) use ($provinceMapping) {
                $officeId = $project->proponent->office_id ?? null;

                return [
                    'project_id' => $project->project_id,
                    'project_title' => $project->project_title,
                    'company_name' => $project->proponent->company_name ?? '',
                    'office_name' => $project->proponent->office->office_name ?? '',
                    'progress' => $project->progress ?? '',
                    'project_cost' => $project->project_cost ?? 0,
                    'province' => $provinceMapping[$officeId] ?? 'Unknown',
                ];
            }),
            'selectedYear' => $year === 'all' ? 'all' : (int) $year,
            'availableYears' => $availableYears,
            'userOfficeId' => $user->office_id ?? null,
            'userOfficeName' => optional(OfficeModel::find($user->office_id))->office_name ?? '',
            'userRole' => $user->role ?? null,
            'canViewAnalytics' => $canViewAnalytics,
        ]);
    }
}
