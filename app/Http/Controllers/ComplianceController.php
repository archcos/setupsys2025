<?php

namespace App\Http\Controllers;

use App\Mail\ComplianceApprovalMail;
use App\Mail\ComplianceCompletedMail;
use App\Mail\ComplianceDenyMail;
use App\Models\ComplianceModel;
use App\Models\DirectorModel;
use App\Models\OfficeModel;
use App\Models\ProjectModel;
use App\Models\UserModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use App\Services\SupabaseUpload;
use Illuminate\Support\Facades\Log;

class ComplianceController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $year = $request->input('year', '');
        $officeFilter = $request->input('officeFilter', '');
        $sortBy = $request->input('sortBy', 'completion');
        $sortOrder = $request->input('sortOrder', 'desc');
        $statusFilter = $request->input('statusFilter', 'all');
        $perPage = $request->input('perPage', 10);
        $showAll = $request->input('showAll', false);
        $completionFilter = $request->input('completionFilter', 'all');

        $validSortColumns = ['project_id', 'project_title', 'proponent_id', 'year_obligated', 'created_at', 'progress', 'completion'];
        if (!in_array($sortBy, $validSortColumns)) {
            $sortBy = 'completion';
        }

        $sortOrder = strtoupper($sortOrder) === 'DESC' ? 'desc' : 'asc';

        $user = Auth::user();

        $baseQuery = ProjectModel::with(['compliance', 'proponent'])
            ->select('project_id', 'project_title', 'proponent_id', 'year_obligated', 'progress', 'created_at');

        if (!$showAll) {
            $baseQuery->whereNotIn('progress', ['Terminated', 'Completed', 'Withdrawn']);
        }

        if ($user) {
            if ($user->role === 'staff' && $user->office_id) {
                $baseQuery->whereHas('proponent', function ($q) use ($user) {
                    $q->where('office_id', $user->office_id);
                });
            } elseif ($user->role !== 'rpmo') {
                $baseQuery->whereRaw('1 = 0');
            }
        }

        if ($search) {
            $baseQuery->where(function ($q) use ($search) {
                $q->where('project_title', 'like', "%{$search}%")
                    ->orWhere('project_id', 'like', "%{$search}%")
                    ->orWhereHas('proponent', function ($q) use ($search) {
                        $q->where('company_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($year) {
            $baseQuery->where('year_obligated', $year);
        }

        if (!empty($officeFilter) && $user && $user->role === 'rpmo') {
            $baseQuery->whereHas('proponent', function ($q) use ($officeFilter) {
                $q->where('office_id', $officeFilter);
            });
        }

        if ($completionFilter === 'complete') {
            $baseQuery->whereHas('compliance', function ($q) {
                $q->whereNotNull('pp_link')
                  ->whereNotNull('fs_link')
                  ->where('pp_link', '!=', '')
                  ->where('fs_link', '!=', '');
            });
        } elseif ($completionFilter === 'partial') {
            $baseQuery->whereHas('compliance', function ($q) {
                $q->where(function ($subQ) {
                    $subQ->where(function ($innerQ) {
                        $innerQ->whereNotNull('pp_link')
                               ->where('pp_link', '!=', '')
                               ->where(function ($innermostQ) {
                                   $innermostQ->whereNull('fs_link')
                                             ->orWhere('fs_link', '=', '');
                               });
                    })->orWhere(function ($innerQ) {
                        $innerQ->whereNotNull('fs_link')
                               ->where('fs_link', '!=', '')
                               ->where(function ($innermostQ) {
                                   $innermostQ->whereNull('pp_link')
                                             ->orWhere('pp_link', '=', '');
                               });
                    });
                });
            });
        } elseif ($completionFilter === 'missing') {
            $baseQuery->where(function ($q) {
                $q->whereDoesntHave('compliance')
                  ->orWhereHas('compliance', function ($subQ) {
                      $subQ->where(function ($innerQ) {
                          $innerQ->whereNull('pp_link')
                                 ->orWhere('pp_link', '=', '');
                      })->where(function ($innerQ) {
                          $innerQ->whereNull('fs_link')
                                 ->orWhere('fs_link', '=', '');
                      });
                  });
            });
        }

        $statusCounts = [
            'all' => (clone $baseQuery)->count(),
            'pending' => (clone $baseQuery)->where(function ($q) {
                $q->whereDoesntHave('compliance')
                  ->orWhereHas('compliance', fn ($q) => $q->where('status', 'pending'));
            })->count(),
            'recommended' => (clone $baseQuery)->whereHas('compliance', fn ($q) => $q->where('status', 'recommended'))->count(),
            'approved' => (clone $baseQuery)->whereHas('compliance', fn ($q) => $q->where('status', 'approved'))->count(),
        ];

        $query = clone $baseQuery;

        if ($statusFilter === 'pending') {
            $query->where(function ($q) {
                $q->whereDoesntHave('compliance')
                  ->orWhereHas('compliance', fn ($q) => $q->where('status', 'pending'));
            });
        } elseif (in_array($statusFilter, ['recommended', 'approved'])) {
            $query->whereHas('compliance', fn ($q) => $q->where('status', $statusFilter));
        }

        if ($sortBy === 'proponent_id') {
            $query->join('tbl_proponents', 'tbl_projects.proponent_id', '=', 'tbl_proponents.proponent_id')
                  ->select('tbl_projects.*', 'tbl_proponents.company_name')
                  ->orderBy('tbl_proponents.company_name', $sortOrder);
        } elseif ($sortBy === 'completion') {
            $query->leftJoin('tbl_compliance', 'tbl_projects.project_id', '=', 'tbl_compliance.project_id')
                  ->select('tbl_projects.*')
                  ->selectRaw('(
                      CASE WHEN tbl_compliance.pp_link IS NOT NULL AND tbl_compliance.pp_link != "" THEN 1 ELSE 0 END +
                      CASE WHEN tbl_compliance.fs_link IS NOT NULL AND tbl_compliance.fs_link != "" THEN 1 ELSE 0 END
                  ) as completed_files_count')
                  ->orderBy('completed_files_count', $sortOrder);
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        $projects = $query->paginate($perPage)->withQueryString();

        $yearsQuery = ProjectModel::distinct()->whereNotNull('year_obligated');
        
        if (!$showAll) {
            $yearsQuery->whereNotIn('progress', ['Terminated', 'Completed', 'Withdrawn']);
        }

        if ($user) {
            if ($user->role === 'staff' && $user->office_id) {
                $yearsQuery->whereHas('proponent', fn ($q) => $q->where('office_id', $user->office_id));
            } elseif ($user->role !== 'rpmo') {
                $yearsQuery->whereRaw('1 = 0');
            }
        }

        $years = $yearsQuery->orderBy('year_obligated', 'desc')->pluck('year_obligated')->toArray();

        $offices = [];
        if ($user && $user->role === 'rpmo') {
            $offices = OfficeModel::orderBy('office_name')->get();
        }

        return Inertia::render('Compliance/Index', [
            'projects' => $projects,
            'years' => $years,
            'offices' => $offices,
            'statusCounts' => $statusCounts,
            'filters' => [
                'search' => $search,
                'year' => $year,
                'officeFilter' => $officeFilter,
                'sortBy' => $sortBy,
                'sortOrder' => $sortOrder,
                'statusFilter' => $statusFilter,
                'perPage' => $perPage,
                'showAll' => $showAll,
                'completionFilter' => $completionFilter,
            ],
        ]);
    }

    public function show($projectId)
    {
        $project = ProjectModel::findOrFail($projectId);
        $compliance = ComplianceModel::where('project_id', $projectId)->first();

        $user = Auth::user();
        if ($user) {
            if ($user->role === 'staff' && $user->office_id) {
                if ($project->proponent->office_id !== $user->office_id) {
                    abort(403, 'Unauthorized access to this project.');
                }
            } elseif ($user->role !== 'rpmo') {
                abort(403, 'Unauthorized access to this project.');
            }
        }

        // Send only the filename, not the full path
        $complianceData = null;
        if ($compliance) {
            $complianceData = [
                'compliance_id' => $compliance->compliance_id,
                'project_id' => $compliance->project_id,
                'pp_link' => $compliance->pp_link ? basename($compliance->pp_link) : null,
                'pp_link_date' => $compliance->pp_link_date,
                'pp_link_added_by' => $compliance->pp_link_added_by,
                'fs_link' => $compliance->fs_link ? basename($compliance->fs_link) : null,
                'fs_link_date' => $compliance->fs_link_date,
                'fs_link_added_by' => $compliance->fs_link_added_by,
                'status' => $compliance->status,
            ];
        }

        return Inertia::render('Compliance/Checklist', [
            'project' => $project,
            'compliance' => $complianceData,
            'userRole' => $user->role ?? null,
            'backUrl' => url()->previous(),
            'showEmailPrompt' => session('showEmailPrompt', false),
        ]);
    }

public function store(Request $request)
{
    $request->validate([
        'project_id' => 'required|exists:tbl_projects,project_id',
        'pp_file' => 'nullable|file|mimes:pdf|max:20480',
        'fs_file' => 'nullable|file|mimes:pdf|max:20480',
    ]);

    $user = Auth::user();
    $project = ProjectModel::findOrFail($request->project_id);

    if ($user) {
        if ($user->role === 'staff' && $user->office_id) {
            if ($project->proponent->office_id !== $user->office_id) {
                abort(403, 'Unauthorized to update this project.');
            }
        } elseif ($user->role !== 'rpmo') {
            abort(403, 'Unauthorized to update this project.');
        }
    }

    // Get or create the compliance record
    $compliance = ComplianceModel::firstOrNew(['project_id' => $request->project_id]);
    $currentUser = Auth::user()->name ?? 'System';
    $currentYear = now()->year;
    $projectId = $project->project_id;

    $fileTypes = [
        'pp_file' => [
            'db_field' => 'pp_link',
            'date_field' => 'pp_link_date',
            'added_by_field' => 'pp_link_added_by',
            'folder' => 'project_proposal'
        ],
        'fs_file' => [
            'db_field' => 'fs_link',
            'date_field' => 'fs_link_date',
            'added_by_field' => 'fs_link_added_by',
            'folder' => 'financial_statement'
        ]
    ];

    foreach ($fileTypes as $inputKey => $config) {
        if ($request->hasFile($inputKey)) {
            $file = $request->file($inputKey);
            
            // Use original filename for local storage
            $fileName = $file->getClientOriginalName();
            
            // Storage path structure for local
            $reportsDir = storage_path("app/private/{$currentYear}/{$projectId}/{$config['folder']}");
            
            if (!is_dir($reportsDir)) {
                mkdir($reportsDir, 0777, true);
            }
            
            // Remove old file if it exists (local only)
            $existingFilePath = $compliance->{$config['db_field']} ?? null;
            if ($existingFilePath && file_exists($existingFilePath)) {
                unlink($existingFilePath);
            }
            
            // Store file locally (replaces if same name)
            $file->move($reportsDir, $fileName);
            
            // Save full path in database
            $fullLocalPath = $reportsDir . '/' . $fileName;
            $compliance->{$config['db_field']} = $fullLocalPath;
            $compliance->{$config['date_field']} = now();
            $compliance->{$config['added_by_field']} = $currentUser;
            
            // Upload to Supabase with unique filename to avoid duplicates
            try {
                $fileContent = file_get_contents($fullLocalPath);
                
                // Add timestamp to filename for Supabase to avoid duplicates
                $fileInfo = pathinfo($fileName);
                $supabaseFileName = $fileInfo['filename'] . '_' . time() . '.' . $fileInfo['extension'];
                $supabasePath = "backup/compliance/{$currentYear}/{$projectId}/{$config['folder']}/{$supabaseFileName}";
                
                $supabaseUpload = new SupabaseUpload();
                $uploaded = $supabaseUpload->upload($supabasePath, $fileContent);
                
                if ($uploaded) {
                    
                }
            } catch (\Exception $e) {
                Log::error('Supabase upload error', [
                    'project_id' => $projectId,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    $compliance->status = 'pending';
    $compliance->save();

    // Count how many files are present after saving
    $currentFilledCount = 0;
    if (!empty($compliance->pp_link)) $currentFilledCount++;
    if (!empty($compliance->fs_link)) $currentFilledCount++;

    // Show prompt if user is staff and both files are present (regardless of whether files were just uploaded)
    if ($user->role === 'staff' && $currentFilledCount === 2) {
        $project->progress = 'Project Review';
        $project->save();
        


        return redirect()->back()->with([
            'success' => 'Compliance files updated successfully.',
            'showEmailPrompt' => true,
        ]);
    }

    return redirect()->back()->with('success', 'Compliance files updated successfully.');
}
public function sendNotification(Request $request)
{
    $request->validate([
        'project_id' => 'required|exists:tbl_projects,project_id',
    ]);

    $user = Auth::user();
    
    if (!$user || $user->role !== 'staff') {
        abort(403, 'Only staff can send notifications.');
    }

    // Send to specific email addresses
    $specificEmails = [
        'setup@region10.dost.gov.ph',
        // Add more emails as needed
    ];
    
    foreach ($specificEmails as $email) {
        Mail::to($email)->send(new ComplianceCompletedMail($request->project_id, $user));
    }
    
    // Or if you want to keep the RPMO users as well
    $rpmoUsers = UserModel::where('role', 'rpmo')->get();
    foreach ($rpmoUsers as $rpmoUser) {
        Mail::to($rpmoUser->email)->send(new ComplianceCompletedMail($request->project_id, $user));
    }

    return redirect()->back()->with('success', 'Notification sent successfully.');
}

    public function downloadFile($projectId, $type)
    {
        $compliance = ComplianceModel::where('project_id', $projectId)->first();
        
        if (!$compliance) {
            abort(404, 'Compliance record not found.');
        }

        $filePath = null;

        if ($type === 'pp') {
            $filePath = $compliance->pp_link;
        } elseif ($type === 'fs') {
            $filePath = $compliance->fs_link;
        }

        if (!$filePath || !file_exists($filePath)) {
            abort(404, 'File not found.');
        }

        return response()->download($filePath);
    }

    public function viewFile($projectId, $type)
    {
        $compliance = ComplianceModel::where('project_id', $projectId)->first();
        
        if (!$compliance) {
            abort(404, 'Compliance record not found.');
        }

        $filePath = null;

        if ($type === 'pp') {
            $filePath = $compliance->pp_link;
        } elseif ($type === 'fs') {
            $filePath = $compliance->fs_link;
        }

        if (!$filePath || !file_exists($filePath)) {
            abort(404, 'File not found.');
        }

        return response()->file($filePath, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . basename($filePath) . '"',
        ]);
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

        $project = ProjectModel::findOrFail($request->project_id);
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
            'remark' => 'required|string|min:5|max:500',
        ]);

        $user = Auth::user();
        if (!$user || $user->role !== 'rpmo') {
            abort(403, 'Only RPMO can deny projects.');
        }

        $project = ProjectModel::findOrFail($request->project_id);
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
}