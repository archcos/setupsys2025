<?php

namespace App\Http\Controllers;

use App\Models\ImplementationModel;
use App\Models\ItemModel;
use App\Models\ProjectModel;
use App\Models\OfficeModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ImplementationController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = $request->input('perPage', 10);
        $statusFilter = $request->input('statusFilter');
        $officeFilter = $request->input('officeFilter');
        $user = Auth::user();

        // Authorization check
        $userRole = $user->role;
        $canViewAll = in_array(strtolower($userRole), ['rpmo']);
        $isStaff = in_array(strtolower($userRole), ['staff']);
        
        if (!$canViewAll && !$isStaff) {
            return Inertia::render('Implementation/Index', [
                'implementations' => new \Illuminate\Pagination\Paginator([], $perPage, 1),
                'filters' => $request->only('search', 'perPage', 'statusFilter', 'officeFilter'),
                'offices' => [],
                'userRole' => $userRole,
            ]);
        }

        // Build base query
        $baseQuery = ImplementationModel::with([
            'project.company.office',
            'tags',
            'tarpUploadedBy',
            'pdcUploadedBy',
            'liquidationUploadedBy'
        ]);

        // Add sorting by project_id (highest first)
        $sort = $request->input('sort', 'project_id');
        $direction = $request->input('direction', 'desc');

        if ($sort === 'project_id') {
            $baseQuery->orderBy('project_id', $direction);
        }

        // Apply office filter for staff (restrict to their office)
        if (!$canViewAll && $isStaff) {
            $baseQuery->whereHas('project.company', function ($q) use ($user) {
                $q->where('office_id', $user->office_id);
            });
        }

        // Apply office filter for RPMO
        if ($officeFilter && $canViewAll) {
            $baseQuery->whereHas('project.company', function ($q) use ($officeFilter) {
                $q->where('office_id', $officeFilter);
            });
        }

        // Apply search filter
        if ($search) {
            $baseQuery->whereHas('project', function ($q) use ($search) {
                $q->where('project_title', 'like', "%{$search}%")
                  ->orWhereHas('company', function ($qc) use ($search) {
                      $qc->where('company_name', 'like', "%{$search}%");
                  });
            });
        }

        // Get total counts BEFORE pagination (all matching records)
        $completeCount = (clone $baseQuery)->whereNotNull('liquidation')->count();
        $pendingCount = (clone $baseQuery)->whereNull('liquidation')->count();
        $totalCount = (clone $baseQuery)->count();

        // Paginate
        $implementations = $baseQuery->paginate($perPage);

        // Transform data to add computed fields
        $implementations->getCollection()->transform(function ($implementation) {
            $projectCost = floatval($implementation->project->project_cost ?? 0);
            
            $totalTagged = $implementation->tags->sum(function ($tag) {
                return floatval($tag->tag_amount ?? 0);
            });
            
            $firstUntaggingThreshold = $projectCost * 0.5;
            $percentage = $projectCost > 0 ? ($totalTagged / $projectCost) * 100 : 0;
            
            $implementation->first_untagged = $totalTagged >= $firstUntaggingThreshold;
            $implementation->final_untagged = $totalTagged >= $projectCost;
            $implementation->untagging_percentage = min($percentage, 100);
            $implementation->total_tagged = $totalTagged;
            
            return $implementation;
        });

        // Filter by status if provided (after pagination, on the current page only)
        if ($statusFilter) {
            $filtered = $implementations->getCollection()->filter(function ($implementation) use ($statusFilter) {
                if ($statusFilter === 'complete') {
                    return !!$implementation->liquidation;
                } elseif ($statusFilter === 'pending') {
                    return !$implementation->liquidation;
                }
                return true;
            });
            
            $implementations->setCollection($filtered);
        }

        // Fetch offices for dropdown (only for RPMO)
        $offices = [];
        if ($canViewAll) {
            $offices = OfficeModel::select('office_id', 'office_name')
                ->orderBy('office_name')
                ->get();
        }

        // Add counts to response
        $implementations->appends(request()->query());
        $implementationsArray = $implementations->toArray();
        $implementationsArray['complete_count'] = $completeCount;
        $implementationsArray['pending_count'] = $pendingCount;

        return Inertia::render('Implementation/Index', [
            'implementations' => $implementationsArray,
            'filters' => $request->only('search', 'perPage', 'statusFilter', 'officeFilter'),
            'offices' => $offices,
            'userRole' => $userRole,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'nullable|exists:tbl_projects,project_id',
            'tarp' => 'nullable|string',
            'pdc' => 'nullable|string',
            'liquidation' => 'nullable|string|max:45',
        ]);

        $implement = ImplementationModel::create($validated);

        return response()->json(['message' => 'Implement created', 'data' => $implement]);
    }
            
    public function checklist($implementId)
    {
        $user = Auth::user();
        $implementation = ImplementationModel::with([
            'project.company', 
            'tags',
            'tarpUploadedBy',
            'pdcUploadedBy',
            'liquidationUploadedBy'
        ])->findOrFail($implementId);

        $userRole = $user->role;
        $canViewAll = in_array(strtolower($userRole), ['rpmo']);
        $isStaff = in_array(strtolower($userRole), ['staff']);
        
        if (!$canViewAll && $isStaff) {
            if ($implementation->project->company->office_id !== $user->office_id) {
                abort(403, 'Unauthorized');
            }
        } elseif (!$canViewAll && !$isStaff) {
            abort(403, 'Unauthorized');
        }

        $projectCost = floatval($implementation->project->project_cost);
        $totalTagAmount = $implementation->tags->sum(function ($tag) {
            return floatval($tag->tag_amount ?? 0);
        });

        $implementation->first_untagged = $totalTagAmount >= ($projectCost * 0.5);
        $implementation->final_untagged = $totalTagAmount >= $projectCost;

        // Fetch approved items for this project
        $approvedItems = ItemModel::where('project_id', $implementation->project_id)
            ->where('report', 'approved')
            ->get(['item_id', 'item_name', 'item_cost', 'quantity', 'specifications']);

        // Clean data to ensure valid UTF-8
        $cleaned = $implementation->toArray();
        array_walk_recursive($cleaned, function (&$item) {
            if (is_string($item)) {
                $item = mb_convert_encoding($item, 'UTF-8', 'UTF-8');
            }
        });

        return inertia('Implementation/Checklist', [
            'implementation' => [
                ...$cleaned,
                'project_title' => $implementation->project->project_title,
                'company_name' => $implementation->project->company->company_name,
                'tarpUploadedBy' => $implementation->tarpUploadedBy ? $implementation->tarpUploadedBy->only(['user_id', 'first_name', 'middle_name', 'last_name', 'username', 'name']) : null,
                'pdcUploadedBy' => $implementation->pdcUploadedBy ? $implementation->pdcUploadedBy->only(['user_id', 'first_name', 'middle_name', 'last_name', 'username', 'name']) : null,
                'liquidationUploadedBy' => $implementation->liquidationUploadedBy ? $implementation->liquidationUploadedBy->only(['user_id', 'first_name', 'middle_name', 'last_name', 'username', 'name']) : null,
            ],
            'approvedItems' => $approvedItems,
        ]);
    }

    public function uploadToLocal(Request $request, $field)
    {
        $validFields = ['tarp', 'pdc', 'liquidation'];
        if (!in_array($field, $validFields)) {
            abort(400, 'Invalid field');
        }

        $validated = $request->validate([
            'implement_id' => 'required|exists:tbl_implements,implement_id',
            $field => 'required|file|max:10240',
        ]);

        if (!$request->hasFile($field)) {
            return redirect()->back()->withErrors(['upload' => 'No file uploaded.']);
        }

        $file = $request->file($field);
        $implementation = ImplementationModel::findOrFail($request->implement_id);

        try {
            $folderPath = "implementation/{$implementation->project_id}";
            
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $nameWithoutExt = pathinfo($originalName, PATHINFO_FILENAME);
            $filename = "{$field}_{$nameWithoutExt}." . $extension;

            $storedPath = Storage::disk('private')->putFileAs($folderPath, $file, $filename);

            $uploadByField = $field . '_by';
            $implementation->update([
                $field => $storedPath,
                $field . '_upload' => now('Asia/Manila'),
                $uploadByField => Auth::id()
            ]);

            if ($field === 'liquidation') {
                ProjectModel::where('project_id', $implementation->project_id)
                    ->update(['progress' => 'Refund']);
            }

            return redirect()->back()->with('success', ucfirst($field) . ' uploaded successfully.');

        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['upload' => 'Upload failed: ' . $e->getMessage()]);
        }
    }

    public function deleteFromLocal(Request $request, $field)
    {
        $validFields = ['tarp', 'pdc', 'liquidation'];
        if (!in_array($field, $validFields)) {
            abort(400, 'Invalid field');
        }

        $request->validate([
            'implement_id' => 'required|exists:tbl_implements,implement_id',
        ]);

        $implementation = ImplementationModel::findOrFail($request->implement_id);
        $filePath = $implementation->$field;

        if (!$filePath) {
            return back()->withErrors(['delete' => 'No file found to delete.']);
        }

        try {
            if (Storage::disk('private')->exists($filePath)) {
                Storage::disk('private')->delete($filePath);
            }

            $uploadByField = $field . '_by';
            $implementation->update([
                $field => null,
                $field . '_upload' => null,
                $uploadByField => null,
            ]);

            return back()->with('success', ucfirst($field) . ' file deleted successfully.');

        } catch (\Exception $e) {
            return back()->withErrors(['delete' => 'Failed to delete file.']);
        }
    }

    public function view($field, Request $request)
    {
        $filePath = $request->query('url');

        try {
            if (!$filePath) {
                return abort(400, 'No file path provided');
            }

            if (!Storage::disk('private')->exists($filePath)) {
                return abort(404, 'File not found');
            }

            $filename = basename($filePath);
            $fileContent = Storage::disk('private')->get($filePath);
            $mimeType = mime_content_type(Storage::disk('private')->path($filePath)) ?: 'application/octet-stream';

            return response($fileContent, 200, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'inline; filename="' . $filename . '"',
            ]);

        } catch (\Exception $e) {
            return abort(500, 'Error viewing file');
        }
    }

    public function download($field, Request $request)
    {
        $filePath = $request->query('url');

        try {
            if (!$filePath) {
                return abort(400, 'No file path provided');
            }

            if (!Storage::disk('private')->exists($filePath)) {
                return abort(404, 'File not found');
            }

            $filename = basename($filePath);
            $fileContent = Storage::disk('private')->get($filePath);
            $mimeType = mime_content_type(Storage::disk('private')->path($filePath)) ?: 'application/octet-stream';

            return response($fileContent, 200, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]);

        } catch (\Exception $e) {
            return abort(500, 'Error downloading file');
        }
    }

    public function show($id)
    {
        $implement = ImplementationModel::with('project')->findOrFail($id);
        return response()->json($implement);
    }

    public function update(Request $request, $id)
    {
        $implement = ImplementationModel::findOrFail($id);

        $validated = $request->validate([
            'project_id' => 'nullable|exists:tbl_projects,project_id',
            'tarp' => 'nullable|string',
            'pdc' => 'nullable|string',
            'liquidation' => 'nullable|string|max:45',
        ]);

        $implement->update($validated);

        return response()->json(['message' => 'Implement updated', 'data' => $implement]);
    }

    public function destroy($id)
    {
        $implement = ImplementationModel::findOrFail($id);
        $implement->delete();

        return response()->json(['message' => 'Implement deleted']);
    }
}