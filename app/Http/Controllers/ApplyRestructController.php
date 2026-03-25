<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ApplyRestructModel;
use App\Models\ProjectModel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Mail\ApplyRestructureMail;
use App\Services\SupabaseUpload;

class ApplyRestructController extends Controller
{
    /* ══════════════════════════════════════════
     |  INDEX  (search + status filter + sort + pagination)
     ══════════════════════════════════════════ */
    public function index(Request $request)
    {
        try {
            $user         = Auth::user();
            $search       = trim($request->input('search', ''));
            $statusFilter = $request->input('statusFilter', '');
            $perPage      = (int) $request->input('perPage', 10);
            $direction    = in_array($request->input('direction'), ['asc', 'desc'])
                            ? $request->input('direction') : 'desc';

            if (!$user->office_id) {
                return Inertia::render('Restructures/Application/Index', [
                    'applyRestructs' => [],
                    'filters'        => compact('search', 'statusFilter', 'perPage', 'direction'),
                    'flash'          => ['error' => 'Your account is not assigned to an office.'],
                ]);
            }

            // Base query (office-scoped)
            $base = ApplyRestructModel::with([
                    'project.proponent',
                    'addedBy',
                    'restructures' => fn($q) => $q->orderBy('created_at', 'desc'),
                ])
                ->whereHas('project.proponent', fn($q) => $q->where('office_id', $user->office_id));

            // Search
            if ($search) {
                $base->whereHas('project', fn($q) =>
                    $q->where('project_title', 'like', "%{$search}%")
                );
            }

            // Status counts (before status filter so tabs always show real numbers)
            $allIds     = (clone $base)->pluck('apply_id');
            $statusRows = \DB::table('tbl_restructures')
                ->selectRaw('status, apply_id')
                ->whereIn('apply_id', $allIds)
                ->orderByDesc('created_at')
                ->get()
                ->groupBy('apply_id')
                ->map(fn($rows) => $rows->first()->status ?? 'pending');

            $totalCount    = $allIds->count();
            $pendingCount  = $statusRows->filter(fn($s) => strtolower($s) === 'pending')->count()
                           + ($totalCount - $statusRows->count()); // records with no restructure = pending
            $approvedCount = $statusRows->filter(fn($s) => strtolower($s) === 'approved')->count();
            $recommendedCount   = $statusRows->filter(fn($s) => strtolower($s) === 'recommended')->count();

            // Apply status filter
            if ($statusFilter && $statusFilter !== 'all') {
                if ($statusFilter === 'pending') {
                    // pending = has no restructure OR latest restructure is pending
                    $base->where(function ($q) {
                        $q->whereDoesntHave('restructures')
                          ->orWhereHas('restructures', function ($q2) {
                              $q2->where('status', 'pending')
                                 ->whereNotExists(function ($sub) {
                                     $sub->from('tbl_restructures as r2')
                                         ->whereColumn('r2.apply_id', 'tbl_restructures.apply_id')
                                         ->where('r2.created_at', '>', \DB::raw('tbl_restructures.created_at'));
                                 });
                          });
                    });
                } else {
                    $base->whereHas('restructures', function ($q) use ($statusFilter) {
                        $q->where('status', $statusFilter)
                          ->whereNotExists(function ($sub) {
                              $sub->from('tbl_restructures as r2')
                                  ->whereColumn('r2.apply_id', 'tbl_restructures.apply_id')
                                  ->where('r2.created_at', '>', \DB::raw('tbl_restructures.created_at'));
                          });
                    });
                }
            }

            $base->orderBy('created_at', $direction);

            $applyRestructs = $base->paginate($perPage)
                ->through(function ($item) {
                    $latest            = $item->restructures->first();
                    $item->status      = $latest?->status      ?? 'pending';
                    $item->restruct_id = $latest?->restruct_id ?? null;
                    return $item;
                })
                ->withQueryString();

            // Attach counts to paginator array
            $data                  = $applyRestructs->toArray();
            $data['total_count']   = $totalCount;
            $data['pending_count'] = $pendingCount;
            $data['approved_count']= $approvedCount;
            $data['recommended_count']  = $recommendedCount;

            return Inertia::render('Restructures/Application/Index', [
                'applyRestructs' => $data,
                'filters'        => compact('search', 'statusFilter', 'perPage', 'direction'),
            ]);

        } catch (\Exception $e) {
            Log::error('ApplyRestruct index error', ['error' => $e->getMessage()]);
            return Inertia::render('Restructures/Application/Index', [
                'applyRestructs' => [],
                'filters'        => ['search' => '', 'statusFilter' => '', 'perPage' => 10, 'direction' => 'desc'],
                'flash'          => ['error' => 'An error occurred while loading the data.'],
            ]);
        }
    }

    /* ══════════════════════════════════════════
     |  CREATE  (render page)
     ══════════════════════════════════════════ */
    public function create()
    {
        $user     = Auth::user();
        $projects = ProjectModel::select('project_id', 'project_title')
            ->whereHas('proponent', fn($q) => $q->where('office_id', $user->office_id))
            ->orderBy('project_title', 'asc')
            ->get();

        return Inertia::render('Restructures/Application/Create', [
            'projects' => $projects,
        ]);
    }

    /* ══════════════════════════════════════════
     |  STORE  — creates an empty record, then
     |  redirects to the edit/upload page
     ══════════════════════════════════════════ */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();

            $request->validate([
                'project_id' => 'required|exists:tbl_projects,project_id',
            ]);

            $project = ProjectModel::with('proponent')->findOrFail($request->project_id);
            if ($project->proponent->office_id !== $user->office_id) {
                return back()->with('error', 'You do not have permission to use this project.');
            }

            $applyRestruct = ApplyRestructModel::create([
                'project_id' => $request->project_id,
                'added_by'   => $user->user_id,
            ]);

            Log::info('ApplyRestruct record created (empty)', ['apply_id' => $applyRestruct->apply_id]);

            // Redirect straight to the edit/upload page so the user can upload files
            return redirect()->route('apply_restruct.edit', $applyRestruct->apply_id)
                ->with('success', 'Application created. Please upload the required documents.');

        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('ApplyRestruct store error', ['error' => $e->getMessage()]);
            return back()->with('error', 'An error occurred while creating the application.');
        }
    }

    /* ══════════════════════════════════════════
     |  EDIT  (render page — also the upload page)
     ══════════════════════════════════════════ */
    public function edit($apply_id)
    {
        $user          = Auth::user();
        $applyRestruct = ApplyRestructModel::with('project.proponent')->findOrFail($apply_id);

        if ($applyRestruct->project->proponent->office_id !== $user->office_id) {
            abort(403, 'Unauthorized');
        }

        $projects = ProjectModel::select('project_id', 'project_title')
            ->whereHas('proponent', fn($q) => $q->where('office_id', $user->office_id))
            ->orderBy('project_title', 'asc')
            ->get();

        return Inertia::render('Restructures/Application/Edit', [
            'applyRestruct' => $applyRestruct,
            'projects'      => $projects,
        ]);
    }

    /* ══════════════════════════════════════════
     |  UPLOAD FILE
     |  Mirrors ImplementationController exactly.
     |  apply_id is always known at this point.
     |
     |  Folder: {year}/{project_id}/restructure/restructure_{apply_id}/
     ══════════════════════════════════════════ */
    public function uploadFile(Request $request, $field)
    {
        $validFields = ['proponent', 'psto', 'annexc', 'annexd'];
        if (!in_array($field, $validFields)) {
            abort(400, 'Invalid field');
        }

        $request->validate([
            'apply_id' => 'required|exists:tbl_apply_restruct,apply_id',
            $field     => 'required|file|mimes:pdf,png,jpg,jpeg|max:10240',
        ]);

        if (!$request->hasFile($field)) {
            return back()->withErrors(['upload' => 'No file uploaded.']);
        }

        $file          = $request->file($field);
        $applyRestruct = ApplyRestructModel::with('project.proponent')->findOrFail($request->apply_id);
        $user          = Auth::user();

        // Auth check
        if ($applyRestruct->project->proponent->office_id !== $user->office_id) {
            abort(403, 'Unauthorized');
        }

        try {
            $extension      = $file->getClientOriginalExtension();
            $safeName       = substr(preg_replace('/[^A-Za-z0-9\-]/', '_',
                pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)), 0, 50);
            $timestamp      = now()->format('Y-m-d_His');
            $fileName       = "{$field}_{$safeName}_{$timestamp}.{$extension}";
            $year           = now()->year;
            $projectId      = $applyRestruct->project_id;
            $applyId        = $applyRestruct->apply_id;

            $folderPath     = "{$year}/{$projectId}/restructure/restructure_{$applyId}";

            // 1. Store locally
            $path = $file->storeAs($folderPath, $fileName, 'private');

            if (!$path) {
                throw new \Exception('Failed to store file locally.');
            }

            Log::info("ApplyRestruct file stored [{$field}]", [
                'apply_id'   => $applyId,
                'local_path' => $path,
            ]);

            // 2. Upload to Supabase (best-effort)
            try {
                $absolutePath = storage_path("app/private/{$path}");
                $fileContent  = file_get_contents($absolutePath);
                $supabasePath = "backup/{$year}/{$projectId}/restructure/restructure_{$applyId}/{$fileName}";

                $uploader = new SupabaseUpload();
                if ($uploader->upload($supabasePath, $fileContent)) {
                    Log::info("Supabase upload OK [{$field}]", ['path' => $supabasePath]);
                } else {
                    Log::warning("Supabase upload failed [{$field}], continuing anyway.");
                }
            } catch (\Exception $e) {
                Log::error("Supabase error [{$field}]: " . $e->getMessage());
            }

            // 3. Update DB
            $applyRestruct->update([$field => $path]);

            return back()->with('success', ucfirst($field) . ' uploaded successfully.');

        } catch (\Exception $e) {
            Log::error("ApplyRestruct upload error [{$field}]", ['error' => $e->getMessage()]);
            return back()->withErrors(['upload' => 'Upload failed: ' . $e->getMessage()]);
        }
    }

    /* ══════════════════════════════════════════
     |  DELETE FILE
     ══════════════════════════════════════════ */
    public function deleteFile(Request $request, $field)
    {
        $validFields = ['proponent', 'psto', 'annexc', 'annexd'];
        if (!in_array($field, $validFields)) {
            abort(400, 'Invalid field');
        }

        $request->validate([
            'apply_id' => 'required|exists:tbl_apply_restruct,apply_id',
        ]);

        $applyRestruct = ApplyRestructModel::with('project.proponent')->findOrFail($request->apply_id);
        $user          = Auth::user();

        if ($applyRestruct->project->proponent->office_id !== $user->office_id) {
            abort(403, 'Unauthorized');
        }

        $filePath = $applyRestruct->$field;
        if (!$filePath) {
            return back()->withErrors(['delete' => 'No file found to delete.']);
        }

        try {
            if (Storage::disk('private')->exists($filePath)) {
                Storage::disk('private')->delete($filePath);
            }

            $applyRestruct->update([$field => null]);

            Log::info("ApplyRestruct file deleted [{$field}]", ['apply_id' => $applyRestruct->apply_id]);

            return back()->with('success', ucfirst($field) . ' deleted successfully.');

        } catch (\Exception $e) {
            Log::error("ApplyRestruct delete error [{$field}]", ['error' => $e->getMessage()]);
            return back()->withErrors(['delete' => 'Failed to delete file.']);
        }
    }

    /* ══════════════════════════════════════════
     |  VIEW FILE (inline)
     ══════════════════════════════════════════ */
    public function viewFile(Request $request)
    {
        $filePath = $request->query('path');
        if (!$filePath)                                        abort(400, 'No file path provided.');
        if (!Storage::disk('private')->exists($filePath))     abort(404, 'File not found.');

        $filename    = basename($filePath);
        $fileContent = Storage::disk('private')->get($filePath);
        $mimeType    = mime_content_type(Storage::disk('private')->path($filePath)) ?: 'application/octet-stream';

        return response($fileContent, 200, [
            'Content-Type'        => $mimeType,
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
        ]);
    }

    /* ══════════════════════════════════════════
     |  DOWNLOAD FILE
     ══════════════════════════════════════════ */
    public function downloadFile(Request $request)
    {
        $filePath = $request->query('path');
        if (!$filePath)                                        abort(400, 'No file path provided.');
        if (!Storage::disk('private')->exists($filePath))     abort(404, 'File not found.');

        $filename    = basename($filePath);
        $fileContent = Storage::disk('private')->get($filePath);
        $mimeType    = mime_content_type(Storage::disk('private')->path($filePath)) ?: 'application/octet-stream';

        return response($fileContent, 200, [
            'Content-Type'        => $mimeType,
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /* ══════════════════════════════════════════
     |  UPDATE  (project change + optional final submit)
     ══════════════════════════════════════════ */
    public function update(Request $request, $apply_id)
    {
        try {
            $user = Auth::user();

            $request->validate([
                'project_id' => 'required|exists:tbl_projects,project_id',
            ]);

            $applyRestruct = ApplyRestructModel::with('project.proponent')->findOrFail($apply_id);

            if ($applyRestruct->project->proponent->office_id !== $user->office_id) {
                return back()->with('error', 'You do not have permission to update this application.');
            }

            $newProject = ProjectModel::with('proponent')->findOrFail($request->project_id);
            if ($newProject->proponent->office_id !== $user->office_id) {
                return back()->with('error', 'You do not have permission to assign this project.');
            }

            $applyRestruct->update(['project_id' => $request->project_id]);

            Log::info('ApplyRestruct updated', ['apply_id' => $apply_id]);

            // Final submit: send emails and go back to index
            if ($request->boolean('submit')) {
                $fresh = $applyRestruct->fresh();
                if ($fresh->proponent && $fresh->psto && $fresh->annexc && $fresh->annexd) {
                    $this->sendNotificationEmails($fresh);
                }
                return redirect()->route('apply_restruct.index')
                    ->with('success', 'Application submitted successfully.');
            }

            // Just a project change — stay on the page
            return back()->with('success', 'Project updated.');

        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('ApplyRestruct update error', ['error' => $e->getMessage()]);
            return back()->with('error', 'An error occurred while updating the application.');
        }
    }

    /* ══════════════════════════════════════════
     |  DESTROY
     ══════════════════════════════════════════ */
    public function destroy($apply_id)
    {
        try {
            $user          = Auth::user();
            $applyRestruct = ApplyRestructModel::with('project.proponent')->findOrFail($apply_id);

            if ($applyRestruct->project->proponent->office_id !== $user->office_id) {
                return back()->with('error', 'You do not have permission to delete this application.');
            }

            foreach (['proponent', 'psto', 'annexc', 'annexd'] as $field) {
                $path = $applyRestruct->$field;
                if ($path && Storage::disk('private')->exists($path)) {
                    Storage::disk('private')->delete($path);
                }
            }

            $applyRestruct->delete();

            Log::info('ApplyRestruct deleted', ['apply_id' => $apply_id]);
            return back()->with('success', 'Application deleted successfully.');

        } catch (\Exception $e) {
            Log::error('ApplyRestruct destroy error', ['error' => $e->getMessage()]);
            return back()->with('error', 'An error occurred while deleting the application.');
        }
    }

    /* ══════════════════════════════════════════
     |  PRIVATE HELPERS
     ══════════════════════════════════════════ */
    private function sendNotificationEmails(ApplyRestructModel $applyRestruct): void
    {
        $recipients = ['arjay.charcos25@gmail.com', 'rain.shigatsu@gmail.com'];

        foreach ($recipients as $email) {
            try {
                Mail::to($email)->send(new ApplyRestructureMail($applyRestruct));
                Log::info('ApplyRestruct email sent', ['to' => $email, 'apply_id' => $applyRestruct->apply_id]);
            } catch (\Exception $e) {
                Log::error('ApplyRestruct email failed', ['to' => $email, 'error' => $e->getMessage()]);
            }
        }
    }
}