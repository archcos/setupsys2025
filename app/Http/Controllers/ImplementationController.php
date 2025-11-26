<?php

namespace App\Http\Controllers;

use App\Models\ImplementationModel;
use App\Models\ItemModel;
use App\Models\ProjectModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ImplementationController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = $request->input('perPage', 10);
        $statusFilter = $request->input('statusFilter');

        $implementations = ImplementationModel::with(['project.company', 'tags'])
            ->when($search, function ($query, $search) {
                $query->whereHas('project', function ($q) use ($search) {
                    $q->where('project_title', 'like', "%{$search}%")
                    ->orWhereHas('company', function ($qc) use ($search) {
                        $qc->where('company_name', 'like', "%{$search}%");
                    });
                });
            })
            ->get();

        // Transform data to add untagging status
        $implementations = $implementations->map(function ($implementation) {
            $projectCost = floatval($implementation->project->project_cost ?? 0);
            
            $totalTagged = $implementation->tags->sum(function ($tag) {
                return floatval($tag->tag_amount);
            });
            
            $firstUntaggingThreshold = $projectCost * 0.5;
            $percentage = $projectCost > 0 ? ($totalTagged / $projectCost) * 100 : 0;
            
            $implementation->first_untagged = $totalTagged >= $firstUntaggingThreshold;
            $implementation->final_untagged = $totalTagged >= $projectCost;
            $implementation->untagging_percentage = min($percentage, 100);
            $implementation->total_tagged = $totalTagged;
            
            return $implementation;
        });

        // Filter by status if provided
        if ($statusFilter) {
            $implementations = $implementations->filter(function ($implementation) use ($statusFilter) {
                $hasFiles = !!($implementation->tarp && $implementation->pdc && $implementation->liquidation);
                $hasUntagging = !!($implementation->first_untagged && $implementation->final_untagged);
                
                if ($statusFilter === 'complete') {
                    return $hasFiles && $hasUntagging;
                } elseif ($statusFilter === 'in-progress') {
                    return $implementation->tarp || $implementation->pdc || $implementation->liquidation;
                } elseif ($statusFilter === 'pending') {
                    return !$implementation->tarp && !$implementation->pdc && !$implementation->liquidation;
                }
                return true;
            });
        }

        // Paginate the filtered results
        $page = request('page', 1);
        $total = $implementations->count();
        $items = $implementations->forPage($page, $perPage);
        $implementations = new \Illuminate\Pagination\Paginator(
            $items,
            $perPage,
            $page,
            [
                'path' => route('implementation.index'),
                'query' => $request->query(),
            ]
        );

        return Inertia::render('Implementation/Index', [
            'implementations' => $implementations,
            'filters' => $request->only('search', 'perPage', 'statusFilter'),
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
    $implementation = ImplementationModel::with([
        'project.company', 
        'tags',
        'tarpUploadedBy',
        'pdcUploadedBy',
        'liquidationUploadedBy'
    ])->findOrFail($implementId);

    $projectCost = floatval($implementation->project->project_cost);
    $totalTagAmount = $implementation->tags->sum(function ($tag) {
        return floatval($tag->tag_amount);
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

    // Ensure relationships are included in the response
    return inertia('Implementation/Checklist', [
        'implementation' => [
            ...$cleaned,
            'project_title' => $implementation->project->project_title,
            'company_name' => $implementation->project->company->company_name,
            // Add the user relationship data explicitly
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
            Log::error("❌ File missing for field: $field");
            return redirect()->back()->withErrors(['upload' => 'No file uploaded.']);
        }

        $file = $request->file($field);
        $implementation = ImplementationModel::findOrFail($request->implement_id);

        try {
            // Create folder structure: storage/private/implementation/{project_id}
            $folderPath = "implementation/{$implementation->project_id}";
            
            // Generate filename with field prefix
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $nameWithoutExt = pathinfo($originalName, PATHINFO_FILENAME);
            $filename = "{$field}_{$nameWithoutExt}." . $extension;

            // Store file in private disk
            $storedPath = Storage::disk('private')->putFileAs($folderPath, $file, $filename);

            Log::info("✅ File uploaded locally: $storedPath");

            // Save file path, upload timestamp, and uploader ID to database
            $uploadByField = $field . '_by';
            $implementation->update([
                $field => $storedPath,
                $field . '_upload' => now('Asia/Manila'),
                $uploadByField => Auth::id()
            ]);

            // Update project progress if liquidation file is uploaded
            if ($field === 'liquidation') {
                ProjectModel::where('project_id', $implementation->project_id)
                    ->update(['progress' => 'Refund']);
            }

            return redirect()->back()->with('success', ucfirst($field) . ' uploaded successfully.');

        } catch (\Exception $e) {
            Log::error('❌ Exception during upload: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
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
            // Delete file from private storage
            if (Storage::disk('private')->exists($filePath)) {
                Storage::disk('private')->delete($filePath);
                Log::info("🗑 File deleted from storage: $filePath");
            }

            // Clear database fields (file path, upload timestamp, and uploader ID)
            $uploadByField = $field . '_by';
            $implementation->update([
                $field => null,
                $field . '_upload' => null,
                $uploadByField => null, // Also clear who uploaded it
            ]);

            return back()->with('success', ucfirst($field) . ' file deleted successfully.');

        } catch (\Exception $e) {
            Log::error('❌ Exception during deletion: ' . $e->getMessage());
            return back()->withErrors(['delete' => 'Failed to delete file.']);
        }
    }

    public function view($field, Request $request)
    {
        $filePath = $request->query('url');

        try {
            if (!$filePath) {
                Log::error("❌ No file path provided");
                return abort(400, 'No file path provided');
            }

            if (!Storage::disk('private')->exists($filePath)) {
                Log::error("❌ File not found: $filePath");
                return abort(404, 'File not found');
            }

            $filename = basename($filePath);
            $fileContent = Storage::disk('private')->get($filePath);
            $mimeType = mime_content_type(Storage::disk('private')->path($filePath)) ?: 'application/octet-stream';

            Log::info("✅ Viewing file: $filePath");

            return response($fileContent, 200, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'inline; filename="' . $filename . '"',
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error viewing file: ' . $e->getMessage());
            return abort(500, 'Error viewing file');
        }
    }

    public function download($field, Request $request)
    {
        $filePath = $request->query('url');

        try {
            if (!$filePath) {
                Log::error("❌ No file path provided");
                return abort(400, 'No file path provided');
            }

            if (!Storage::disk('private')->exists($filePath)) {
                Log::error("❌ File not found: $filePath");
                return abort(404, 'File not found');
            }

            $filename = basename($filePath);
            $fileContent = Storage::disk('private')->get($filePath);
            $mimeType = mime_content_type(Storage::disk('private')->path($filePath)) ?: 'application/octet-stream';

            Log::info("✅ Downloading file: $filePath");

            return response($fileContent, 200, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error downloading file: ' . $e->getMessage());
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