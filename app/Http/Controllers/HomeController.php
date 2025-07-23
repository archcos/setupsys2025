<?php

namespace App\Http\Controllers;
use App\Models\ProjectModel;
use App\Models\UserModel;
use App\Models\OfficeModel;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Session;

class HomeController extends Controller
{
public function index(Request $request)
{
    $year = $request->input('year') ?? date('Y');
    $userId = session('user_id');
    $user = UserModel::find($userId);

    // Start project query for selected year
    $query = ProjectModel::with('company.office')
        ->whereYear('created_at', $year);

    // ✅ Filter only if user is staff or user
    if ($user && $user->role === 'staff') {
        $query->whereHas('company', function ($q) use ($user) {
            $q->where('office_id', $user->office_id);
        });
    } elseif ($user && $user->role === 'user') {
        $query->where('added_by', $user->user_id);
    }
    // Admin gets all — no filter applied

    $projects = $query->get();

    // Group results per office name
    $projectsPerOffice = $projects
        ->groupBy(fn($p) => $p->company->office->office_name ?? 'No Office')
        ->map(fn($group) => $group->count());

    $availableYears = ProjectModel::selectRaw('YEAR(created_at) as year')
        ->distinct()
        ->orderByDesc('year')
        ->pluck('year');

    return Inertia::render('Home', [
        'projectsPerOffice' => $projectsPerOffice,
        'selectedYear' => $year,
        'availableYears' => $availableYears,
        'userOfficeId' => $user->office_id ?? null,
        'userOfficeName' => optional(OfficeModel::find($user->office_id))->office_name ?? '',
    ]);
}
}
