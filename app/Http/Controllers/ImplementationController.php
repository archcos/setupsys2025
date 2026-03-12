<?php

namespace App\Http\Controllers;

use App\Mail\LiquidationNotificationMail;
use App\Models\ImplementationModel;
use App\Models\ItemModel;
use App\Models\ProjectModel;
use App\Models\OfficeModel;
use App\Models\UserModel;
use App\Services\SupabaseUpload;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
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

        $userRole = $user->role;
        $canViewAll = in_array(strtolower($userRole), ['rpmo', 'au']);
        $isStaff = in_array(strtolower($userRole), ['staff']);

        if (!$canViewAll && !$isStaff) {
            return Inertia::render('Implementation/Index', [
                'implementations' => new \Illuminate\Pagination\Paginator([], $perPage, 1),
                'filters'         => $request->only('search', 'perPage', 'statusFilter', 'officeFilter'),
                'offices'         => [],
                'userRole'        => $userRole,
            ]);
        }

        $baseQuery = ImplementationModel::with([
            'project.company.office',
            'tags',
            'tarpUploadedBy',
            'pdcUploadedBy',
            'liquidationUploadedBy',
        ]);

        $sort      = $request->input('sort', 'project_id');
        $direction = $request->input('direction', 'desc');

        if ($sort === 'project_id') {
            $baseQuery->orderBy('project_id', $direction);
        }

        if (!$canViewAll && $isStaff) {
            $baseQuery->whereHas('project.company', function ($q) use ($user) {
                $q->where('office_id', $user->office_id);
            });
        }

        if ($officeFilter && $canViewAll) {
            $baseQuery->whereHas('project.company', function ($q) use ($officeFilter) {
                $q->where('office_id', $officeFilter);
            });
        }

        if ($search) {
            $baseQuery->whereHas('project', function ($q) use ($search) {
                $q->where('project_title', 'like', "%{$search}%")
                  ->orWhereHas('company', function ($qc) use ($search) {
                      $qc->where('company_name', 'like', "%{$search}%");
                  });
            });
        }

        $completeCount = (clone $baseQuery)->whereNotNull('liquidation')->count();
        $pendingCount  = (clone $baseQuery)->whereNull('liquidation')->count();
        $totalCount    = (clone $baseQuery)->count();

        $implementations = $baseQuery->paginate($perPage);

        $implementations->getCollection()->transform(function ($implementation) {
            $projectCost = floatval($implementation->project->project_cost ?? 0);

            $totalTagged = $implementation->tags->sum(function ($tag) {
                return floatval($tag->tag_amount ?? 0);
            });

            $firstUntaggingThreshold = $projectCost * 0.5;
            $percentage = $projectCost > 0 ? ($totalTagged / $projectCost) * 100 : 0;

            $implementation->first_untagged       = $totalTagged >= $firstUntaggingThreshold;
            $implementation->final_untagged        = $totalTagged >= $projectCost;
            $implementation->untagging_percentage  = min($percentage, 100);
            $implementation->total_tagged          = $totalTagged;

            return $implementation;
        });

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

        $offices = [];
        if ($canViewAll) {
            $offices = OfficeModel::select('office_id', 'office_name')
                ->orderBy('office_name')
                ->get();
        }

        $implementations->appends(request()->query());
        $implementationsArray                    = $implementations->toArray();
        $implementationsArray['complete_count']  = $completeCount;
        $implementationsArray['pending_count']   = $pendingCount;

        return Inertia::render('Implementation/Index', [
            'implementations' => $implementationsArray,
            'filters'         => $request->only('search', 'perPage', 'statusFilter', 'officeFilter'),
            'offices'         => $offices,
            'userRole'        => $userRole,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id'  => 'nullable|exists:tbl_projects,project_id',
            'tarp'        => 'nullable|string',
            'pdc'         => 'nullable|string',
            'liquidation' => 'nullable|string|max:45',
        ]);

        $implement = ImplementationModel::create($validated);

        return response()->json(['message' => 'Implement created', 'data' => $implement]);
    }

    public function checklist($implementId)
    {
        $user           = Auth::user();
        $implementation = ImplementationModel::with([
            'project.company',
            'tags',
            'tarpUploadedBy',
            'pdcUploadedBy',
            'liquidationUploadedBy',
        ])->findOrFail($implementId);

        $userRole   = $user->role;
        $canViewAll = in_array(strtolower($userRole), ['rpmo', 'au']);
        $isStaff    = in_array(strtolower($userRole), ['staff']);

        if (!$canViewAll && $isStaff) {
            if ($implementation->project->company->office_id !== $user->office_id) {
                abort(403, 'Unauthorized');
            }
        } elseif (!$canViewAll && !$isStaff) {
            abort(403, 'Unauthorized');
        }

        $projectCost    = floatval($implementation->project->project_cost);
        $totalTagAmount = $implementation->tags->sum(function ($tag) {
            return floatval($tag->tag_amount ?? 0);
        });

        $implementation->first_untagged = $totalTagAmount >= ($projectCost * 0.5);
        $implementation->final_untagged = $totalTagAmount >= $projectCost;

        $approvedItems = ItemModel::where('project_id', $implementation->project_id)
            ->where('report', 'approved')
            ->get(['item_id', 'item_name', 'item_cost', 'quantity', 'specifications']);

        $cleaned = $implementation->toArray();
        array_walk_recursive($cleaned, function (&$item) {
            if (is_string($item)) {
                $item = mb_convert_encoding($item, 'UTF-8', 'UTF-8');
            }
        });

        return inertia('Implementation/Checklist', [
            'implementation' => [
                ...$cleaned,
                'project_title'         => $implementation->project->project_title,
                'company_name'          => $implementation->project->company->company_name,
                'tarpUploadedBy'        => $implementation->tarpUploadedBy
                    ? $implementation->tarpUploadedBy->only(['user_id', 'first_name', 'middle_name', 'last_name', 'username', 'name'])
                    : null,
                'pdcUploadedBy'         => $implementation->pdcUploadedBy
                    ? $implementation->pdcUploadedBy->only(['user_id', 'first_name', 'middle_name', 'last_name', 'username', 'name'])
                    : null,
                'liquidationUploadedBy' => $implementation->liquidationUploadedBy
                    ? $implementation->liquidationUploadedBy->only(['user_id', 'first_name', 'middle_name', 'last_name', 'username', 'name'])
                    : null,
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
            $field         => 'required|file|mimes:pdf,png,jpg,jpeg|max:10240',
        ]);

        if (!$request->hasFile($field)) {
            return redirect()->back()->withErrors(['upload' => 'No file uploaded.']);
        }

        $file           = $request->file($field);
        $implementation = ImplementationModel::findOrFail($request->implement_id);

        try {
            $extension    = $file->getClientOriginalExtension();
            $originalName = $file->getClientOriginalName();
            $nameWithoutExt = pathinfo($originalName, PATHINFO_FILENAME);

            $nameWithoutExt = preg_replace('/[^A-Za-z0-9\-]/', '_', $nameWithoutExt);
            $nameWithoutExt = substr($nameWithoutExt, 0, 50);

            $timestamp   = now()->format('Y-m-d_His');
            $fileName    = "{$field}_{$nameWithoutExt}_{$timestamp}.{$extension}";
            $currentYear = now()->year;
            $projectId   = $implementation->project_id;

            // 1. Store locally
            Log::info("Uploading {$field} file", [
                'implement_id' => $implementation->implement_id,
                'file_name'    => $fileName,
                'file_size'    => $file->getSize(),
            ]);

            $localFolderPath = "{$currentYear}/{$projectId}/implementation";
            $path            = $file->storeAs($localFolderPath, $fileName, 'private');

            if (!$path) {
                throw new \Exception('Failed to store file locally');
            }

            Log::info("File stored locally for {$field}", [
                'implement_id' => $implementation->implement_id,
                'local_path'   => $path,
            ]);

            // 2. Upload to Supabase
            try {
                $localFilePath = storage_path("app/private/{$path}");

                if (!file_exists($localFilePath)) {
                    throw new \Exception("Local file not found at: {$localFilePath}");
                }

                $fileContent = file_get_contents($localFilePath);

                if ($fileContent === false) {
                    throw new \Exception("Failed to read local file content");
                }

                Log::info("Local file found, attempting Supabase upload for {$field}", [
                    'implement_id' => $implementation->implement_id,
                    'local_path'   => $localFilePath,
                    'file_size'    => strlen($fileContent),
                ]);

                $supabasePath   = "backup/{$currentYear}/{$projectId}/{$fileName}";
                $supabaseUpload = new SupabaseUpload();
                $uploaded       = $supabaseUpload->upload($supabasePath, $fileContent);

                if ($uploaded) {
                    Log::info("✓ File successfully uploaded to Supabase for {$field}", [
                        'implement_id' => $implementation->implement_id,
                        'project_id'   => $projectId,
                        'supabase_path' => $supabasePath,
                    ]);
                } else {
                    Log::warning("Supabase upload failed for {$field}, continuing anyway", [
                        'implement_id' => $implementation->implement_id,
                    ]);
                }

            } catch (\Exception $e) {
                Log::error("Supabase upload error for {$field}", [
                    'implement_id' => $implementation->implement_id,
                    'error'        => $e->getMessage(),
                ]);
            }

            // 3. Update database
            $uploadByField = $field . '_by';
            $implementation->update([
                $field              => $path,
                $field . '_upload'  => now('Asia/Manila'),
                $uploadByField      => Auth::id(),
            ]);

            // 4. If liquidation, update project progress and send emails
            if ($field === 'liquidation') {
                ProjectModel::where('project_id', $implementation->project_id)
                    ->update(['progress' => 'Refund']);

                $this->sendLiquidationNotification($implementation, $path, $fileName);
            }

            return redirect()->back()->with('success', ucfirst($field) . ' uploaded successfully.');

        } catch (\Exception $e) {
            Log::error("Upload error for {$field}", [
                'implement_id' => $implementation->implement_id,
                'error'        => $e->getMessage(),
            ]);
            return redirect()->back()->withErrors(['upload' => 'Upload failed: ' . $e->getMessage()]);
        }
    }

private function sendLiquidationNotification(
    ImplementationModel $implementation,
    string $storedPath,
    string $fileName
): void {
    try {
        $implementation->load('project.company.office.director', 'liquidationUploadedBy');

        $project      = $implementation->project;
        $company      = $project->company;
        $office       = $company->office;
        $officeId     = $company->office_id;
        $officeName   = $office->office_name ?? 'Office';
        $projectTitle = $project->project_title;
        $companyName  = $company->company_name;
        $absolutePath = storage_path("app/private/{$storedPath}");

        // Uploader name
        $uploader     = $implementation->liquidationUploadedBy;
        $uploaderName = $uploader ? $uploader->name : 'Unknown User';

        // Hardcoded CC emails
        $hardcodedCc = [
            // 'example1@dost.gov.ph',
            // 'example2@dost.gov.ph',
        ];

        $director             = $office->director ?? null;
        $directorGreetingName = 'Provincial Director and Team';
        $directorEmail        = null;

        if ($director) {
            $directorFullName = trim(
                ($director->honorific ? $director->honorific . ' ' : '') .
                ($director->first_name ?? '') . ' ' .
                ($director->middle_name ? $director->middle_name . ' ' : '') .
                ($director->last_name ?? '')
            );
            $directorGreetingName = $directorFullName . ' and Team';
            $directorEmail        = $director->email;
        }

        $officeStaffUsers = UserModel::whereRaw('LOWER(role) = ?', ['staff'])
            ->where('office_id', $officeId)
            ->whereNotNull('email')
            ->get();

        $subject = "{$officeName} SETUP Accepted Liquidation Report";

        if ($directorEmail) {
            $staffEmails = $officeStaffUsers->pluck('email')->filter()->toArray();
            $allRecipients = array_merge([$directorEmail], $staffEmails);

            Mail::to($allRecipients)
                ->cc(array_filter($hardcodedCc))
                ->send(new LiquidationNotificationMail(
                    $projectTitle,
                    $companyName,
                    $directorGreetingName,
                    $absolutePath,
                    $fileName,
                    $subject,
                    $officeName,
                    $uploaderName
                ));
        } else {
            $staffEmails = $officeStaffUsers->pluck('email')->filter()->toArray();

            if (!empty($staffEmails)) {
                Mail::to($staffEmails)
                    ->cc(array_filter($hardcodedCc))
                    ->send(new LiquidationNotificationMail(
                        $projectTitle,
                        $companyName,
                        $directorGreetingName,
                        $absolutePath,
                        $fileName,
                        $subject,
                        $officeName,
                        $uploaderName
                    ));
            } else {
                Log::warning('No recipients found for liquidation notification', [
                    'implement_id' => $implementation->implement_id,
                ]);
            }
        }

        Log::info('Liquidation notification emails sent', [
            'implement_id'   => $implementation->implement_id,
            'director_email' => $directorEmail,
            'staff_count'    => $officeStaffUsers->count(),
            'cc_emails'      => $hardcodedCc,
            'office'         => $officeName,
            'uploaded_by'    => $uploaderName,
        ]);

    } catch (\Exception $e) {
        Log::error('Failed to send liquidation notification emails', [
            'implement_id' => $implementation->implement_id,
            'error'        => $e->getMessage(),
        ]);
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
        $filePath       = $implementation->$field;

        if (!$filePath) {
            return back()->withErrors(['delete' => 'No file found to delete.']);
        }

        try {
            if (Storage::disk('private')->exists($filePath)) {
                Storage::disk('private')->delete($filePath);
            }

            $uploadByField = $field . '_by';
            $implementation->update([
                $field             => null,
                $field . '_upload' => null,
                $uploadByField     => null,
            ]);

            return back()->with('success', ucfirst($field) . ' file deleted successfully.');

        } catch (\Exception $e) {
            Log::error("Delete error for {$field}", [
                'implement_id' => $implementation->implement_id,
                'error'        => $e->getMessage(),
            ]);
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

            $filename    = basename($filePath);
            $fileContent = Storage::disk('private')->get($filePath);
            $mimeType    = mime_content_type(Storage::disk('private')->path($filePath)) ?: 'application/octet-stream';

            return response($fileContent, 200, [
                'Content-Type'        => $mimeType,
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

            $filename    = basename($filePath);
            $fileContent = Storage::disk('private')->get($filePath);
            $mimeType    = mime_content_type(Storage::disk('private')->path($filePath)) ?: 'application/octet-stream';

            return response($fileContent, 200, [
                'Content-Type'        => $mimeType,
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
            'project_id'  => 'nullable|exists:tbl_projects,project_id',
            'tarp'        => 'nullable|string',
            'pdc'         => 'nullable|string',
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