<?php

namespace App\Http\Controllers;

use App\Models\ProjectModel;
use App\Models\OfficeModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index(Request $request)
    {
        $year = $request->input('year') ?? date('Y');
        $user = Auth::user();

        $query = ProjectModel::with('company.office');

        // Only filter by year if not 'all'
        if ($year !== 'all') {
          $query->whereYear('year_obligated', $year);
        }

        // Filter projects based on user role
        if ($user && $user->role === 'staff') {
            // Staff users only see projects from their office
            $query->whereHas('company', function ($q) use ($user) {
                $q->where('office_id', $user->office_id);
            });
        } elseif ($user && $user->role === 'user') {
            // Regular users only see their own projects
            $query->where('added_by', $user->user_id);
        }
        // Admin users see all projects (no filtering applied)

        $projects = $query->get();

        // Group projects by office for the "Projects Per Office" card and sort alphabetically
        $projectsPerOffice = $projects
            ->groupBy(fn($p) => $p->company->office->office_name ?? 'No Office')
            ->map(fn($group) => $group->count())
            ->sortKeys(); // Sort offices alphabetically

        // Get all available years from the database
        $availableYears = ProjectModel::selectRaw('YEAR(year_obligated) as year')
            ->distinct()
            ->orderByDesc('year')
            ->pluck('year')
            ->toArray();

        // Ensure current year is included
        $currentYear = (int) date('Y');
        if (!in_array($currentYear, $availableYears)) {
            $availableYears[] = $currentYear;
        }
        rsort($availableYears);

        return Inertia::render('Home/Index', [
            'projectsPerOffice' => $projectsPerOffice,
            'projectDetails' => $projects->map(function ($project) {
                return [
                    'project_id' => $project->project_id,
                    'project_title' => $project->project_title,
                    'company_name' => $project->company->company_name ?? '',
                    'office_name' => $project->company->office->office_name ?? '',
                    'progress' => $project->progress ?? '', // Can be: internal_rtec, internal_compliance, external_rtec, external_compliance, or standard stages, or Terminated, Withdrawn, Disapproved
                ];
            }),
            'selectedYear' => $year,
            'availableYears' => $availableYears,
            'userOfficeId' => $user->office_id ?? null,
            'userOfficeName' => optional(OfficeModel::find($user->office_id))->office_name ?? '',
            'userRole' => $user->role ?? null,
        ]);
    }
}