<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ChecklistModel;
use App\Models\ProjectModel;
use Illuminate\Support\Facades\Auth;

class ChecklistController extends Controller
{
    public function list(Request $request)
    {
        $search = $request->input('search', '');
        $year = $request->input('year', '');
        $sortBy = $request->input('sortBy', 'project_title');
        $sortOrder = $request->input('sortOrder', 'asc');

        // Valid sort columns
        $validSortColumns = ['project_title', 'company_id', 'year_obligated', 'created_at'];
        if (!in_array($sortBy, $validSortColumns)) {
            $sortBy = 'project_title';
        }

        $sortOrder = strtoupper($sortOrder) === 'DESC' ? 'desc' : 'asc';

        // Build query
        $query = ProjectModel::with(['checklist', 'company'])
            ->select(
                'project_id',
                'project_title',
                'company_id',
                'year_obligated',
                'created_at'
            );

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
        $years = ProjectModel::distinct()
            ->whereNotNull('year_obligated')
            ->orderBy('year_obligated', 'desc')
            ->pluck('year_obligated')
            ->toArray();

        return Inertia::render('ReviewApproval/ReviewList', [
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

    public function index($projectId)
    {
        $project = ProjectModel::findOrFail($projectId);
        $checklist = ChecklistModel::where('project_id', $projectId)->first();

        return Inertia::render('ReviewApproval/ReviewChecklist', [
            'project' => $project,
            'checklist' => $checklist,
        ]);
    }

    public function store(Request $request)
    {
        // Custom validation for links
        $request->validate([
            'project_id' => 'required|exists:tbl_projects,project_id',
            'links' => 'array',
        ]);

        // Validate each link
        foreach (range(1, 4) as $i) {
            $linkKey = "link_$i";
            if (!empty($request->links[$linkKey])) {
                $link = $request->links[$linkKey];
                
                if (!$this->isValidCloudLink($link)) {
                    return back()->withErrors([
                        "links.$linkKey" => "Link $i must be a valid Google Drive or OneDrive link"
                    ])->withInput();
                }
            }
        }

        // Get existing checklist or create new instance
        $checklist = ChecklistModel::firstOrNew(['project_id' => $request->project_id]);

        $user = Auth::user()->name ?? 'System';

        foreach (range(1, 4) as $i) {
            $linkKey = "link_$i";
            $dateKey = "link_{$i}_date";
            $addedByKey = "link_{$i}_added_by";

            // Only update if a new value is provided
            if (!empty($request->links[$linkKey])) {
                $link = $request->links[$linkKey];
                
                // If the link is changed or empty before, update it
                if ($checklist->$linkKey !== $link) {
                    $checklist->$linkKey = $link;
                    $checklist->$dateKey = now();
                    $checklist->$addedByKey = $user;
                }
            }
        }

        $checklist->save();

        return redirect()->back()->with('success', 'Checklist updated successfully.');
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