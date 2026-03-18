<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ComplianceModel;
use App\Models\ProjectModel;
use App\Models\DirectorModel;
use App\Models\UserModel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\ComplianceApprovalMail;
use App\Mail\ComplianceDenyMail;
use App\Mail\ComplianceCompletedMail;

class ComplianceController extends Controller
{
    public function index(Request $request)
    {
        $search      = $request->input('search', '');
        $year        = $request->input('year', '');
        $sortBy      = $request->input('sortBy', 'project_id');
        $sortOrder   = $request->input('sortOrder', 'desc');
        $statusFilter = $request->input('statusFilter', 'pending');
        $perPage     = $request->input('perPage', 10);

        // Valid sort columns
        $validSortColumns = ['project_id', 'project_title', 'company_id', 'year_obligated', 'created_at', 'progress'];
        if (!in_array($sortBy, $validSortColumns)) {
            $sortBy = 'project_id';
        }

        $sortOrder = strtoupper($sortOrder) === 'DESC' ? 'desc' : 'asc';

        $user = Auth::user();

        // ── Base query ────────────────────────────────────────────────────────
        $baseQuery = ProjectModel::with(['compliance', 'company'])
            ->select('project_id', 'project_title', 'company_id', 'year_obligated', 'progress', 'created_at');

        // Role-based scope
        if ($user) {
            if ($user->role === 'staff' && $user->office_id) {
                $baseQuery->whereHas('company', function ($q) use ($user) {
                    $q->where('office_id', $user->office_id);
                });
            } elseif ($user->role !== 'rpmo') {
                $baseQuery->whereRaw('1 = 0');
            }
        }

        // Search
        if ($search) {
            $baseQuery->where(function ($q) use ($search) {
                $q->where('project_title', 'like', "%{$search}%")
                  ->orWhereHas('company', function ($q) use ($search) {
                      $q->where('company_name', 'like', "%{$search}%");
                  });
            });
        }

        // Year
        if ($year) {
            $baseQuery->where('year_obligated', $year);
        }

        // ── Compute status counts BEFORE applying status filter ───────────────
        $statusCounts = [
            'all'         => (clone $baseQuery)->count(),
            'pending'     => (clone $baseQuery)->whereHas('compliance', fn($q) => $q->where('status', 'pending'))
                                               ->orWhereDoesntHave('compliance')
                                               ->count(),
            'recommended' => (clone $baseQuery)->whereHas('compliance', fn($q) => $q->where('status', 'recommended'))->count(),
            'approved'    => (clone $baseQuery)->whereHas('compliance', fn($q) => $q->where('status', 'approved'))->count(),
        ];

        // ── Apply status filter ───────────────────────────────────────────────
        $query = clone $baseQuery;

        if ($statusFilter === 'pending') {
            // pending = no compliance record OR compliance.status = 'pending'
            $query->where(function ($q) {
                $q->whereDoesntHave('compliance')
                  ->orWhereHas('compliance', fn($q) => $q->where('status', 'pending'));
            });
        } elseif (in_array($statusFilter, ['recommended', 'approved'])) {
            $query->whereHas('compliance', fn($q) => $q->where('status', $statusFilter));
        }
        // 'all' → no additional filter

        // ── Sorting ───────────────────────────────────────────────────────────
        if ($sortBy === 'company_id') {
            $query->join('tbl_companies', 'tbl_projects.company_id', '=', 'tbl_companies.company_id')
                  ->select('tbl_projects.*', 'tbl_companies.company_name')
                  ->orderBy('tbl_companies.company_name', $sortOrder);
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        // ── Paginate ──────────────────────────────────────────────────────────
        $projects = $query->paginate($perPage)->withQueryString();

        // ── Year dropdown ─────────────────────────────────────────────────────
        $yearsQuery = ProjectModel::distinct()->whereNotNull('year_obligated');

        if ($user) {
            if ($user->role === 'staff' && $user->office_id) {
                $yearsQuery->whereHas('company', fn($q) => $q->where('office_id', $user->office_id));
            } elseif ($user->role !== 'rpmo') {
                $yearsQuery->whereRaw('1 = 0');
            }
        }

        $years = $yearsQuery->orderBy('year_obligated', 'desc')->pluck('year_obligated')->toArray();

        return Inertia::render('ReviewApproval/Index', [
            'projects'     => $projects,
            'years'        => $years,
            'statusCounts' => $statusCounts,
            'filters'      => [
                'search'       => $search,
                'year'         => $year,
                'sortBy'       => $sortBy,
                'sortOrder'    => $sortOrder,
                'statusFilter' => $statusFilter,
                'perPage'      => $perPage,
            ],
        ]);
    }

    public function show($projectId)
    {
        $project    = ProjectModel::findOrFail($projectId);
        $compliance = ComplianceModel::where('project_id', $projectId)->first();

        $user = Auth::user();
        if ($user) {
            if ($user->role === 'staff' && $user->office_id) {
                if ($project->company->office_id !== $user->office_id) {
                    abort(403, 'Unauthorized access to this project.');
                }
            } elseif ($user->role !== 'rpmo') {
                abort(403, 'Unauthorized access to this project.');
            }
        }

        return Inertia::render('ReviewApproval/Compliance', [
            'project'    => $project,
            'compliance' => $compliance,
            'userRole'   => $user->role ?? null,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'project_id' => 'required|exists:tbl_projects,project_id',
            'links'      => 'array',
        ]);

        $user    = Auth::user();
        $project = ProjectModel::findOrFail($request->project_id);

        if ($user) {
            if ($user->role === 'staff' && $user->office_id) {
                if ($project->company->office_id !== $user->office_id) {
                    abort(403, 'Unauthorized to update this project.');
                }
            } elseif ($user->role !== 'rpmo') {
                abort(403, 'Unauthorized to update this project.');
            }
        }

        $linkMapping = [
            'pp_link' => 'Project Proposal',
            'fs_link' => 'Financial Statement',
        ];

        foreach ($linkMapping as $linkKey => $linkLabel) {
            if (!empty($request->links[$linkKey])) {
                if (!$this->isValidCloudLink($request->links[$linkKey])) {
                    return back()->withErrors([
                        "links.$linkKey" => "$linkLabel must be a valid Google Drive or OneDrive link"
                    ])->withInput();
                }
            }
        }

        $compliance  = ComplianceModel::firstOrNew(['project_id' => $request->project_id]);
        $currentUser = Auth::user()->name ?? 'System';

        foreach ($linkMapping as $linkKey => $linkLabel) {
            $dateKey    = "{$linkKey}_date";
            $addedByKey = "{$linkKey}_added_by";

            if (!empty($request->links[$linkKey])) {
                $link = $request->links[$linkKey];
                if ($compliance->$linkKey !== $link) {
                    $compliance->$linkKey    = $link;
                    $compliance->$dateKey    = now();
                    $compliance->$addedByKey = $currentUser;
                }
            }
        }

        $compliance->status = 'pending';
        $compliance->save();

        $filledLinks = collect(['pp_link', 'fs_link'])
            ->filter(fn($k) => !empty($compliance->$k))
            ->count();

        if ($user->role === 'staff' && $filledLinks === 2) {
            $project->progress = 'Project Review';
            $project->save();

            $rpmoUsers = UserModel::where('role', 'rpmo')->get();
            foreach ($rpmoUsers as $rpmoUser) {
                Mail::to($rpmoUser->email)->send(new ComplianceCompletedMail($request->project_id, $user));
            }
        }

        return redirect()->back()->with('success', 'Compliance updated successfully.');
    }

    public function approve(Request $request)
    {
        $request->validate([
            'project_id' => 'required|exists:tbl_projects,project_id',
        ]);

        $user = Auth::user();
        if (!$user || $user->role !== 'rpmo') {
            abort(403, 'Only RPMO can approve projects.');
        }

        $project    = ProjectModel::findOrFail($request->project_id);
        $compliance = ComplianceModel::where('project_id', $request->project_id)->first();

        if ($compliance) {
            $compliance->status = 'recommended';
            $compliance->save();
        }

        $project->progress = 'Awaiting Approval';
        $project->save();

        $director = DirectorModel::where('office_id', 1)->first();
        if ($director && $director->email) {
            Mail::to($director->email)->send(new ComplianceApprovalMail($project, $user));
        }

        return redirect()->back()->with('success', 'Project approved and recommended to Regional Director.');
    }

    public function deny(Request $request)
    {
        $request->validate([
            'project_id' => 'required|exists:tbl_projects,project_id',
            'remark'     => 'required|string|min:5|max:500',
        ]);

        $user = Auth::user();
        if (!$user || $user->role !== 'rpmo') {
            abort(403, 'Only RPMO can deny projects.');
        }

        $project    = ProjectModel::findOrFail($request->project_id);
        $compliance = ComplianceModel::where('project_id', $request->project_id)->first();

        if ($compliance) {
            $compliance->status = 'pending';
            $compliance->save();
        }

        $director = DirectorModel::where('office_id', 1)->first();
        if ($director && $director->email) {
            Mail::to($director->email)->send(new ComplianceDenyMail($project, $user, $request->input('remark')));
        }

        return redirect()->back()->with('success', 'Project denied. Director has been notified with remarks.');
    }

    private function isValidCloudLink($url)
    {
        if (empty($url)) return true;
        $lower = strtolower(trim($url));
        return str_contains($lower, 'drive.google.com')   ||
               str_contains($lower, 'onedrive.live.com')  ||
               str_contains($lower, '1drv.ms');
    }
}