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
        $search = $request->input('search', '');
        $year = $request->input('year', '');
        $sortBy = $request->input('sortBy', 'project_id');
        $sortOrder = $request->input('sortOrder', 'desc');

        // Valid sort columns
        $validSortColumns = ['project_id','project_title', 'company_id', 'year_obligated', 'created_at', 'progress'];
        if (!in_array($sortBy, $validSortColumns)) {
            $sortBy = 'project_id';
        }

        $sortOrder = strtoupper($sortOrder) === 'DESC' ? 'desc' : 'asc';

        // Build query
        $query = ProjectModel::with(['compliance', 'company'])
            ->select(
                'project_id',
                'project_title',
                'company_id',
                'year_obligated',
                'progress',
                'created_at'
            );

        // Filter by office based on user role
        $user = Auth::user();
        if ($user) {
            if ($user->role === 'staff' && $user->office_id) {
                $query->whereHas('company', function ($q) use ($user) {
                    $q->where('office_id', $user->office_id);
                });
            } elseif ($user->role !== 'rpmo') {
                // Non-RPMO and non-staff roles see nothing
                $query->whereRaw('1 = 0');
            }
            // RPMO role sees all (no filter applied)
        }

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('project_title', 'like', "%{$search}%")
                  ->orWhereHas('company', function ($q) use ($search) {
                      $q->where('company_name', 'like', "%{$search}%");
                  });
            });
        }

        // Apply year filter
        if ($year) {
            $query->where('year_obligated', $year);
        }

        // Apply sorting
        if ($sortBy === 'company_id') {
            $query->join('tbl_companies', 'tbl_projects.company_id', '=', 'tbl_companies.company_id')
                  ->select('tbl_projects.*', 'tbl_companies.company_name')
                  ->orderBy('tbl_companies.company_name', $sortOrder);
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        $projects = $query->get();

        // Get all available years for filter dropdown
        $yearsQuery = ProjectModel::distinct()
            ->whereNotNull('year_obligated');

        // Filter years by role
        if ($user) {
            if ($user->role === 'staff' && $user->office_id) {
                $yearsQuery->whereHas('company', function ($q) use ($user) {
                    $q->where('office_id', $user->office_id);
                });
            } elseif ($user->role !== 'rpmo') {
                // Non-RPMO and non-staff roles see nothing
                $yearsQuery->whereRaw('1 = 0');
            }
        }

        $years = $yearsQuery->orderBy('year_obligated', 'desc')
            ->pluck('year_obligated')
            ->toArray();

        return Inertia::render('ReviewApproval/Index', [
            'projects' => $projects,
            'years' => $years,
            'filters' => [
                'search' => $search,
                'year' => $year,
                'sortBy' => $sortBy,
                'sortOrder' => $sortOrder,
            ]
        ]);
    }
    
    public function show($projectId)
    {
        $project = ProjectModel::findOrFail($projectId);
        $compliance = ComplianceModel::where('project_id', $projectId)->first();

        // Check authorization
        $user = Auth::user();
        if ($user) {
            if ($user->role === 'staff' && $user->office_id) {
                if ($project->company->office_id !== $user->office_id) {
                    abort(403, 'Unauthorized access to this project.');
                }
            } elseif ($user->role !== 'rpmo') {
                // Non-RPMO and non-staff roles cannot access
                abort(403, 'Unauthorized access to this project.');
            }
        }

        return Inertia::render('ReviewApproval/Compliance', [
            'project' => $project,
            'compliance' => $compliance,
            'userRole' => $user->role ?? null,
        ]);
    }

    public function store(Request $request)
    {
        // Custom validation for links
        $request->validate([
            'project_id' => 'required|exists:tbl_projects,project_id',
            'links' => 'array',
        ]);

        $user = Auth::user();
        $project = ProjectModel::findOrFail($request->project_id);  // Add this line

        if ($user) {
            if ($user->role === 'staff' && $user->office_id) {
                if ($project->company->office_id !== $user->office_id) {
                    abort(403, 'Unauthorized to update this project.');
                }
            } elseif ($user->role !== 'rpmo') {
                abort(403, 'Unauthorized to update this project.');
            }
        }

        // Validate each link
        $linkMapping = [
            'pp_link' => 'Project Proposal',
            'fs_link' => 'Financial Statement'
        ];

        foreach ($linkMapping as $linkKey => $linkLabel) {
            if (!empty($request->links[$linkKey])) {
                $link = $request->links[$linkKey];
                
                if (!$this->isValidCloudLink($link)) {
                    return back()->withErrors([
                        "links.$linkKey" => "$linkLabel must be a valid Google Drive or OneDrive link"
                    ])->withInput();
                }
            }
        }

        // Get existing compliance or create new instance
        $compliance = ComplianceModel::firstOrNew(['project_id' => $request->project_id]);

        $currentUser = Auth::user()->name ?? 'System';

        foreach ($linkMapping as $linkKey => $linkLabel) {
            $dateKey = "{$linkKey}_date";
            $addedByKey = "{$linkKey}_added_by";

            // Only update if a new value is provided
            if (!empty($request->links[$linkKey])) {
                $link = $request->links[$linkKey];
                
                // If the link is changed or empty before, update it
                if ($compliance->$linkKey !== $link) {
                    $compliance->$linkKey = $link;
                    $compliance->$dateKey = now();
                    $compliance->$addedByKey = $currentUser;
                }
            }
        }

        // Set status to pending when staff saves
        $compliance->status = 'pending';
        $compliance->save();

        // Check if all links are filled
        $filledLinks = collect(['pp_link', 'fs_link'])
            ->filter(fn($linkKey) => !empty($compliance->$linkKey))
            ->count();

        // If staff and compliance is complete (2/2), send email to RPMO users
        if ($user->role === 'staff' && $filledLinks === 2) {

            $project->progress = 'Project Review';
            $project->save();
            $rpmoUsers = UserModel::where('role', 'rpmo')->get();
            
            if ($rpmoUsers->count() > 0) {
                foreach ($rpmoUsers as $rpmoUser) {
                    Mail::to($rpmoUser->email)->send(new ComplianceCompletedMail($request->project_id, $user));
                }
            }
        }

        return redirect()->back()->with('success', 'compliance updated successfully.');
    }

    public function approve(Request $request)
    {
        $request->validate([
            'project_id' => 'required|exists:tbl_projects,project_id',
        ]);

        // Only RPMO can approve
        $user = Auth::user();
        if (!$user || $user->role !== 'rpmo') {
            abort(403, 'Only RPMO can approve projects.');
        }

        $project = ProjectModel::findOrFail($request->project_id);

        // Update compliance status to 'recommended'
        $compliance = ComplianceModel::where('project_id', $request->project_id)->first();
        if ($compliance) {
            $compliance->status = 'recommended';
            $compliance->save();
        }

        // Update project progress to 'approval'
        $project->progress = 'Awaiting Approval';
        $project->save();

        // Get director with office_id = 1
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
            'remark' => 'required|string|min:5|max:500',
        ]);

        // Only RPMO can deny
        $user = Auth::user();
        if (!$user || $user->role !== 'rpmo') {
            abort(403, 'Only RPMO can deny projects.');
        }

        $project = ProjectModel::findOrFail($request->project_id);
        $remark = $request->input('remark');

        // Keep compliance status as 'pending' when denied
        $compliance = ComplianceModel::where('project_id', $request->project_id)->first();
        if ($compliance) {
            $compliance->status = 'pending';
            $compliance->save();
        }

        // Get director with office_id = 1
        $director = DirectorModel::where('office_id', 1)->first();

        if ($director && $director->email) {
            Mail::to($director->email)->send(new ComplianceDenyMail($project, $user, $remark));
        }

        return redirect()->back()->with('success', 'Project denied. Director has been notified with remarks.');
    }

    private function isValidCloudLink($url)
    {
        if (empty($url)) {
            return true; // Allow empty
        }
        
        $lower = strtolower(trim($url));
        
        // Only allow Google Drive and OneDrive links
        return strpos($lower, 'drive.google.com') !== false ||
               strpos($lower, 'onedrive.live.com') !== false ||
               strpos($lower, '1drv.ms') !== false; // OneDrive short links
    }
}