<?php

namespace App\Http\Controllers;

use App\Models\ImplementationModel;
use App\Models\ItemModel;
use App\Models\ProjectModel;
use App\Models\TagModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;
use GuzzleHttp\Psr7\Utils;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ImplementationController extends Controller
{
public function index(Request $request)
{
    $search = $request->input('search');
    $perPage = $request->input('perPage', 10);

    $implementations = ImplementationModel::with(['project.company', 'tags'])
        ->when($search, function ($query, $search) {
            $query->whereHas('project', function ($q) use ($search) {
                $q->where('project_title', 'like', "%{$search}%")
                ->orWhereHas('company', function ($qc) use ($search) {
                    $qc->where('company_name', 'like', "%{$search}%");
                });
            });
        })
        ->paginate($perPage)
        ->appends($request->only('search', 'perPage'));

    // Calculate untagging status through implementation->tags relationship
    $implementations->getCollection()->transform(function ($implementation) {
        $projectCost = floatval($implementation->project->project_cost ?? 0);
        
        // Sum tag amounts through the implementation's tags relationship
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

    return Inertia::render('Implementation/Index', [
        'implementations' => $implementations,
        'filters' => $request->only('search', 'perPage'),
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
    $implementation = ImplementationModel::with(['project.company', 'tags'])->findOrFail($implementId);

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

    return inertia('Implementation/Checklist', [
        'implementation' => [
            ...$cleaned,
            'project_title' => $implementation->project->project_title,
            'company_name' => $implementation->project->company->company_name,
        ],
        'approvedItems' => $approvedItems,
    ]);
}



    public function uploadToSupabase(Request $request, $field)
    {
        Log::info('📥 Starting Supabase file upload for field: ' . $field);

        $validFields = ['tarp', 'pdc', 'liquidation'];
        if (!in_array($field, $validFields)) {
            Log::error("❌ Invalid field: $field");
            abort(400, 'Invalid field');
        }

        Log::info('📝 Request data:', $request->all());
        Log::info('📦 Uploaded files:', $request->allFiles());

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

        // Add field name prefix to filename
        $originalName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        $nameWithoutExt = pathinfo($originalName, PATHINFO_FILENAME);
        $filename = "{$field}_{$nameWithoutExt}." . $extension;

        $folder = "implementation/{$implementation->project_id}";
        $path = "{$folder}/{$filename}";

        // Supabase config
        $bucket = env('SUPABASE_BUCKET');
        $supabaseUrl = env('SUPABASE_URL');
        $supabaseKey = env('SUPABASE_KEY');

        $uploadUrl = "{$supabaseUrl}/storage/v1/object/{$bucket}/{$path}";

        try {
            Log::info("📤 Uploading to Supabase: $uploadUrl");

            $fileSize = filesize($file->getRealPath());

            $response = Http::withHeaders([
                'apikey' => $supabaseKey,
                'Authorization' => "Bearer {$supabaseKey}",
                'Content-Type' => $file->getMimeType(),
                'Content-Length' => $fileSize,
            ])
            ->withBody(Utils::streamFor(fopen($file->getRealPath(), 'r')), $file->getMimeType())
            ->put($uploadUrl);

            if (!$response->successful()) {
                Log::error('❌ Supabase upload failed', [
                    'status' => $response->status(),
                    'body' => mb_convert_encoding($response->body(), 'UTF-8', 'UTF-8'),
                ]);
                return redirect()->back()->withErrors(['upload' => 'Upload to Supabase failed.']);
            }

            $publicUrl = "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$path}";
            Log::info("✅ File uploaded successfully: $publicUrl");

            // Save URL and upload timestamp
            $implementation->$field = $publicUrl;
            $implementation->{$field . '_upload'} = now('Asia/Manila');
            $implementation->save();

            if ($field === 'liquidation') {
            ProjectModel::where('project_id', $implementation->project_id)
                ->update(['progress' => 'Refund']);

            Log::info("📊 Project {$implementation->project_id} progress updated to 'Liquidation'");
        }


            return redirect()->back()->with('success', ucfirst($field) . ' uploaded successfully.');

        } catch (\Exception $e) {
            Log::error('🔥 Exception during upload: ' . $e->getMessage());
            return redirect()->back()->withErrors(['upload' => 'Upload failed. Please try again.']);
        }
    }




    public function deleteFromSupabase(Request $request, $field)
    {
        $validFields = ['tarp', 'pdc', 'liquidation'];
        if (!in_array($field, $validFields)) {
            abort(400, 'Invalid field');
        }

        $request->validate([
            'implement_id' => 'required|exists:tbl_implements,implement_id',
        ]);

        $implementation = ImplementationModel::findOrFail($request->implement_id);
        $fileUrl = $implementation->$field;

        if (!$fileUrl) {
            return back()->withErrors(['delete' => 'No file found to delete.']);
        }

        // Parse object path from URL
        $bucket = env('SUPABASE_BUCKET');
        $supabaseUrl = env('SUPABASE_URL');
        $supabaseKey = env('SUPABASE_KEY');
        $baseUrl = "{$supabaseUrl}/storage/v1/object/public/{$bucket}/";
        $objectPath = Str::replaceFirst($baseUrl, '', $fileUrl);
        $relativePath = Str::replaceFirst($baseUrl, '', $fileUrl);

        Log::info("🗑 Attempting to delete from Supabase: $objectPath");

        // Correct endpoint: /storage/v1/object/{bucket}/remove
        $response = Http::withHeaders([
            'apikey' => $supabaseKey,
            'Authorization' => 'Bearer ' . $supabaseKey,
        ])->delete("{$supabaseUrl}/storage/v1/object/{$bucket}/{$relativePath}");
        if (!$response->successful()) {
            Log::error('❌ Supabase file deletion failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return back()->withErrors(['delete' => 'Failed to delete file from Supabase.']);
        }

        // Clear DB field
        $implementation->$field = null;
        $implementation->save();

        Log::info("✅ {$field} deleted and set to NULL for implement_id {$implementation->implement_id}");

        return back()->with('success', ucfirst($field) . ' file deleted and field cleared.');
    }

    public function download($field, Request $request)
    {
        $fileUrl = $request->query('url');
        $filename = basename($fileUrl);

        try {
            $response = Http::get($fileUrl);
            if (!$response->successful()) {
                return abort(404, 'File not found');
            }

            return response($response->body(), 200, [
                'Content-Type' => $response->header('Content-Type'),
                'Content-Disposition' => "attachment; filename=\"$filename\"",
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
