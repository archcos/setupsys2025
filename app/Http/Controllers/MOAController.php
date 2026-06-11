<?php

namespace App\Http\Controllers;

use App\Models\DirectorModel;
use App\Models\MoaModel;
use App\Models\OfficeModel;
use App\Models\ProjectModel;
use App\Models\ProponentModel;
use App\Models\UserModel;
use App\Services\SupabaseUpload;
use Carbon\Carbon;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\SimpleType\Jc;
use PhpOffice\PhpWord\TemplateProcessor;

class MOAController extends Controller
{
    use AuthorizesRequests;

    // ══════════════════════════════════════════════
    //  PRIVATE HELPER METHODS
    // ══════════════════════════════════════════════

    /**
     * Get the full storage path for a MOA's approved file.
     */
    private function getApprovedFilePath(MoaModel $moa): string
    {
        return storage_path('app/private/'.$moa->approved_file_path);
    }

    /**
     * Validate that a MOA has an approved file and it exists on disk.
     * Returns the validated file path or throws an exception.
     */
    private function validateApprovedFile(MoaModel $moa): string
    {
        if (!$moa->hasApprovedFile()) {
            throw new \RuntimeException('No approved file found for this MOA.');
        }

        $filePath = $this->getApprovedFilePath($moa);

        if (!file_exists($filePath)) {
            throw new \RuntimeException('File not found on server.');
        }

        // Security: Ensure path doesn't escape storage directory
        $realPath = realpath($filePath);
        $storagePath = realpath(storage_path('app/private'));

        if (!$realPath || !str_starts_with($realPath, $storagePath)) {
            Log::warning('Potential path traversal detected', [
                'moa_id' => $moa->moa_id,
                'user_id' => Auth::id(),
            ]);
            throw new \RuntimeException('Invalid file path detected.');
        }

        return $filePath;
    }

    /**
     * Sanitize a string for safe use in filenames.
     */
    private function sanitizeForFilename(string $string, int $maxLength = 50): string
    {
        $sanitized = preg_replace('/[^A-Za-z0-9\-]/', '_', $string);
        $sanitized = preg_replace('/_+/', '_', $sanitized);
        $sanitized = trim($sanitized, '_');

        return substr($sanitized, 0, $maxLength);
    }

    /**
     * Generate a descriptive but safe filename for MOA documents.
     */
    private function generateMoaFileName(MoaModel $moa, string $extension): string
    {
        $projectTitle = $this->sanitizeForFilename($moa->project->project_title);
        $companyName = $this->sanitizeForFilename($moa->project->proponent->company_name);
        $timestamp = now()->format('Y-m-d_His');

        return "MOA_{$projectTitle}_{$companyName}_{$timestamp}.{$extension}";
    }

    /**
     * Validate a PDF file upload with proper MIME type checking.
     */
    private function validatePdfUpload(Request $request): \Illuminate\Validation\Validator
    {
        return Validator::make($request->all(), [
            'approved_file' => [
                'required',
                'file',
                'mimes:pdf',
                'max:10240',
                function ($attribute, $value, $fail) {
                    $finfo = finfo_open(FILEINFO_MIME_TYPE);
                    $actualMime = finfo_file($finfo, $value->getRealPath());
                    finfo_close($finfo);

                    if ($actualMime !== 'application/pdf') {
                        Log::warning('Non-PDF file upload attempt', [
                            'user_id' => Auth::id(),
                            'actual_mime' => $actualMime,
                            'ip' => request()->ip(),
                        ]);
                        $fail('The file must be a valid PDF document.');
                    }
                },
            ],
        ], [
            'approved_file.required' => 'Please select a file to upload.',
            'approved_file.mimes' => 'Only PDF files are allowed.',
            'approved_file.max' => 'File size must not exceed 10MB.',
        ]);
    }

    /**
     * Upload a file to Supabase as backup.
     * Never throws exceptions - backup failures are logged but not fatal.
     */
    private function backupToSupabase(string $localFilePath, string $fileName, MoaModel $moa): bool
    {
        try {
            if (!file_exists($localFilePath)) {
                return false;
            }

            $fileContent = file_get_contents($localFilePath);

            if ($fileContent === false) {
                return false;
            }

            $currentYear = now()->year;
            $supabasePath = "backup/{$currentYear}/{$moa->project_id}/{$fileName}";

            $supabaseUpload = new SupabaseUpload();
            $uploaded = $supabaseUpload->upload($supabasePath, $fileContent);

            if (!$uploaded) {
                Log::warning('Supabase backup failed', ['moa_id' => $moa->moa_id]);
            }

            return $uploaded;
        } catch (\Exception $e) {
            Log::error('Supabase backup error', [
                'moa_id' => $moa->moa_id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Send MOA notification emails to all relevant office users.
     */
    private function notifyOfficeUsers(MoaModel $moa, string $actionType): void
    {
        $officeUsers = UserModel::where('office_id', $moa->project->proponent->office_id)
            ->whereIn('role', ['rpmo', 'staff'])
            ->get();

        foreach ($officeUsers as $user) {
            try {
                Mail::to($user->email)->send(
                    new \App\Mail\MoaNotificationMail(
                        $actionType,
                        $moa->project->project_title,
                        $moa->project->proponent->company_name,
                        $user->name
                    )
                );
            } catch (\Exception $e) {
                Log::error('Failed to send MOA notification', [
                    'email' => $user->email,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Build the base query for MOA listings with role-based scoping.
     */
    private function buildMoaBaseQuery(Request $request, $user)
    {
        $search = $request->input('search', '');
        $sortBy = $request->input('sortBy', 'created_at');
        $sortOrder = $request->input('sortOrder', 'desc');
        $officeFilter = $request->input('officeFilter', '');
        $yearFilter = $request->input('yearFilter', '');

        $validSortColumns = ['created_at', 'project_cost', 'owner_name', 'pd_name'];
        if (!in_array($sortBy, $validSortColumns)) {
            $sortBy = 'created_at';
        }

        $sortOrder = strtoupper($sortOrder) === 'ASC' ? 'asc' : 'desc';

        $baseQuery = MoaModel::with(['project.proponent.office', 'approvedByUser']);

        // Role-based scope
        if ($user && $user->role === 'staff' && $user->office_id) {
            $baseQuery->whereHas('project.proponent', function ($q) use ($user) {
                $q->where('office_id', $user->office_id);
            });
        } elseif ($user && $user->role !== 'rpmo') {
            $baseQuery->whereRaw('1 = 0');
        }

        // Search
        if (!empty($search)) {
            $baseQuery->where(function ($q) use ($search) {
                $q->where('owner_name', 'like', "%{$search}%")
                  ->orWhere('pd_name', 'like', "%{$search}%")
                  ->orWhereHas('project', function ($q2) use ($search) {
                      $q2->where('project_title', 'like', "%{$search}%")
                         ->orWhere('project_id', 'like', "%{$search}%");
                  });
            });
        }

        // Office filter (rpmo only)
        if (!empty($officeFilter) && $user && $user->role === 'rpmo') {
            $baseQuery->whereHas('project.proponent', function ($q) use ($officeFilter) {
                $q->where('office_id', $officeFilter);
            });
        }

        // Year filter
        if (!empty($yearFilter)) {
            $baseQuery->whereHas('project', function ($q) use ($yearFilter) {
                $q->where('year_obligated', $yearFilter);
            });
        }

        // Sorting
        if ($sortBy === 'project_cost') {
            $baseQuery->join('tbl_projects', 'tbl_moa.project_id', '=', 'tbl_projects.project_id')
                      ->orderBy('tbl_projects.project_cost', $sortOrder)
                      ->select('tbl_moa.*');
        } else {
            $baseQuery->orderBy('tbl_moa.'.$sortBy, $sortOrder);
        }

        return $baseQuery;
    }

    /**
     * Get available years for filtering based on user permissions.
     */
    private function getAvailableYears($user): array
    {
        $yearsQuery = ProjectModel::query()
            ->distinct()
            ->whereNotNull('year_obligated')
            ->whereHas('moa')
            ->select('year_obligated');

        if ($user && $user->role === 'staff' && $user->office_id) {
            $yearsQuery->whereHas('proponent', function ($q) use ($user) {
                $q->where('office_id', $user->office_id);
            });
        } elseif ($user && $user->role !== 'rpmo') {
            $yearsQuery->whereRaw('1 = 0');
        }

        return $yearsQuery
            ->orderBy('year_obligated', 'desc')
            ->pluck('year_obligated')
            ->filter()
            ->unique()
            ->values()
            ->toArray();
    }

    // ══════════════════════════════════════════════
    //  PUBLIC CONTROLLER METHODS
    // ══════════════════════════════════════════════

    /**
     * Display a listing of MOAs.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', MoaModel::class);

        $user = Auth::user();
        $perPage = $request->input('perPage', 10);
        $search = $request->input('search', '');
        $sortBy = $request->input('sortBy', 'created_at');
        $sortOrder = $request->input('sortOrder', 'desc');
        $officeFilter = $request->input('officeFilter', '');
        $yearFilter = $request->input('yearFilter', '');

        $baseQuery = $this->buildMoaBaseQuery($request, $user);
        $moas = $baseQuery->paginate($perPage)->appends($request->only([
            'search', 'perPage', 'sortBy', 'sortOrder', 'officeFilter', 'yearFilter',
        ]));

        $years = $this->getAvailableYears($user);

        $offices = [];
        if ($user && $user->role === 'rpmo') {
            $offices = OfficeModel::orderBy('office_name')->get();
        }

        return inertia('MOA/Index', [
            'moas' => $moas,
            'years' => $years,
            'offices' => $offices,
            'filters' => [
                'search' => $search,
                'perPage' => $perPage,
                'sortBy' => $sortBy,
                'sortOrder' => $sortOrder,
                'officeFilter' => $officeFilter,
                'yearFilter' => $yearFilter,
            ],
        ]);
    }

    /**
     * Upload an approved MOA file (PDF).
     */
    public function uploadApprovedFile(Request $request, $moa_id)
    {
        $moa = MoaModel::with('project.proponent')->findOrFail($moa_id);
        $this->authorize('uploadApprovedFile', $moa);

        $validator = $this->validatePdfUpload($request);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $file = $request->file('approved_file');
            $extension = $file->getClientOriginalExtension();
            $fileName = $this->generateMoaFileName($moa, $extension);

            $currentYear = now()->year;
            $projectId = $moa->project_id;
            $oldFilePath = $moa->approved_file_path;

            // Store file locally
            $localFolderPath = "{$currentYear}/{$projectId}/moa";
            $path = $file->storeAs($localFolderPath, $fileName, 'private');

            if (!$path) {
                throw new \Exception('Failed to store file on local storage.');
            }

            // Backup to Supabase (non-blocking)
            $localFilePath = storage_path("app/private/{$path}");
            $this->backupToSupabase($localFilePath, $fileName, $moa);

            // Update database
            $isReupload = !empty($oldFilePath);
            $moa->update([
                'approved_file_path' => $path,
                'approved_file_uploaded_at' => now(),
                'approved_by' => Auth::id(),
            ]);

            // Send notifications
            $actionType = $isReupload ? 'reuploaded' : 'uploaded';
            $this->notifyOfficeUsers($moa, $actionType);

            $successMessage = $isReupload
                ? 'Approved MOA file reuploaded successfully.'
                : 'Approved MOA file uploaded successfully.';

            return back()->with('success', $successMessage);
        } catch (\Exception $e) {
            Log::error('MOA Upload Failed', [
                'moa_id' => $moa_id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            $errorMessage = config('app.debug')
                ? 'Failed to upload file: '.$e->getMessage()
                : 'Failed to upload file. Please try again or contact support.';

            return back()->withErrors(['error' => $errorMessage]);
        }
    }

    /**
     * View an approved MOA file inline in the browser.
     */
    public function viewApprovedFile($moa_id)
    {
        $moa = MoaModel::findOrFail($moa_id);
        $this->authorize('viewApprovedFile', $moa);

        try {
            $filePath = $this->validateApprovedFile($moa);

            return response()->file($filePath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.basename($moa->approved_file_path).'"',
            ]);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Download an approved MOA file.
     */
    public function downloadApprovedFile($moa_id)
    {
        $moa = MoaModel::findOrFail($moa_id);
        $this->authorize('downloadApprovedFile', $moa);

        try {
            $filePath = $this->validateApprovedFile($moa);
            $fileName = basename($moa->approved_file_path);

            return response()->download($filePath, $fileName);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Show the form for creating a new MOA draft.
     */
    public function showForm(Request $request)
    {
        $this->authorize('viewAny', MoaModel::class);

        $user = Auth::user();

        $proponentsQuery = ProponentModel::select('proponent_id', 'company_name')
            ->whereHas('projects', function ($query) {
                $query->whereIn('progress', [
                    'internal_rtec',
                    'internal_compliance',
                    'external_rtec',
                    'external_compliance',
                    'Awaiting Approval',
                    'Project Review',
                    'Approved',
                ]);
            });

        if ($user->role === 'staff') {
            $proponentsQuery->where('office_id', $user->office_id);
        } elseif ($user->role !== 'rpmo') {
            $proponentsQuery->whereRaw('0 = 1');
        }

        $proponents = $proponentsQuery->get();

        $proponentId = $request->query('proponent_id');
        $selectedproponent = null;
        $projects = collect([]);

        if ($proponentId) {
            $selectedproponent = ProponentModel::with('office')->find($proponentId);

            if ($selectedproponent) {
                if ($user->role === 'staff' && $selectedproponent->office_id !== $user->office_id) {
                    abort(403, 'Unauthorized access to this proponent.');
                }

                $projects = ProjectModel::where('proponent_id', $proponentId)
                    ->whereIn('progress', [
                        'Awaiting Approval',
                        'Project Review',
                        'internal_rtec',
                        'internal_compliance',
                        'external_rtec',
                        'external_compliance',
                        'Approved',
                    ])
                    ->with(['activities', 'items'])
                    ->select('project_id', 'project_title', 'proponent_id')
                    ->get();
            }
        }

        return Inertia::render('MOA/DraftMoa', [
            'proponents' => $proponents,
            'selectedproponent' => $selectedproponent,
            'projects' => $projects,
            'filters' => [
                'proponent_id' => $proponentId,
            ],
        ]);
    }

    /**
     * Get proponent details as JSON.
     */
    public function getproponentDetails($id)
    {
        try {
            $proponent = ProponentModel::with(['projects.activities', 'office'])->findOrFail($id);

            return response()->json($proponent);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Server error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate a MOA document from a saved draft.
     */
    public function generateFromMoa($moa_id)
    {
        $moa = MoaModel::with(['project.proponent.office', 'project.items', 'project.activities'])->findOrFail($moa_id);
        $this->authorize('generate', $moa);
        $project = $moa->project;
        $proponent = $project->proponent;
        $office = $proponent->office;

        // Load template
        $templatePath = storage_path('../public/templates/moa_template.docx');
        $templateProcessor = new TemplateProcessor($templatePath);

        $companyAddress = collect([
            $proponent->street,
            $proponent->barangay,
            $proponent->municipality,
            $proponent->province,
        ])->filter()->implode(', ');

        $releaseInitial = $project->release_initial ? Carbon::parse($project->release_initial)->format('F Y') : 'N/A';
        $releaseEnd = $project->release_end ? Carbon::parse($project->release_end)->format('F Y') : 'N/A';
        $refundInitial = $project->refund_initial ? Carbon::parse($project->refund_initial)->format('F Y') : 'N/A';
        $refundEnd = $project->refund_end ? Carbon::parse($project->refund_end)->format('F Y') : 'N/A';

        $phaseOne = "$releaseInitial - $releaseEnd";
        $phaseTwo = "$refundInitial - $refundEnd";

        $regionalDirector = DirectorModel::find(1);
        $honorific = 'Dir.';
        $regionalDirectorName = 'N/A';

        if ($regionalDirector) {
            $honorific = $regionalDirector->honorific ?? $regionalDirector->title ?? 'Dir.';

            // Build full name
            $firstName = $regionalDirector->first_name ?? '';
            $middleName = $regionalDirector->middle_name ?? '';
            $lastName = $regionalDirector->last_name ?? '';

            $middleInitial = $middleName ? strtoupper(substr($middleName, 0, 1)).'.' : '';

            $regionalDirectorName = trim("{$firstName} {$middleInitial} {$lastName}");

            if (empty($regionalDirectorName) || $regionalDirectorName === ' . ') {
                $regionalDirectorName = 'N/A';
            }
        }

        // Fill text placeholders
        $templateProcessor->setValue('OWNER_NAME', $moa->owner_name);
        $templateProcessor->setValue('position', $moa->owner_position);
        $templateProcessor->setValue('witness', $moa->witness);
        $templateProcessor->setValue('COMPANY_NAME', $proponent->company_name);
        $templateProcessor->setValue('COMPANY_LOCATION', $companyAddress);
        $templateProcessor->setValue('office_name', $office->office_name ?? 'N/A');
        $templateProcessor->setValue('PROJECT_TITLE', $project->project_title);
        $templateProcessor->setValue('phase_one', $phaseOne);
        $templateProcessor->setValue('phase_two', $phaseTwo);
        $templateProcessor->setValue('project_cost', number_format($project->project_cost, 2));
        $templateProcessor->setValue('amount', $moa->amount_words);
        $templateProcessor->setValue('pd_name', $moa->pd_name ?? 'N/A');
        $templateProcessor->setValue('pd_title', $moa->pd_title ?? 'N/A');
        $templateProcessor->setValue('HONORIFIC', $honorific);
        $templateProcessor->setValue('REGIONAL_DIRECTOR', $regionalDirectorName);

        // Create items table
        $phpWord = new PhpWord();
        $arialFont = ['name' => 'Arial'];
        $boldArial = ['name' => 'Arial', 'bold' => true];
        $section = $phpWord->addSection();

        $table = $section->addTable([
            'borderSize' => 6,
            'borderColor' => '999999',
            'cellMargin' => 80,
        ]);

        $table->addRow();
        $table->addCell(5500, ['vMerge' => 'restart'])->addText('Item of Expenditure', $boldArial);
        $table->addCell(1200, ['vMerge' => 'restart'])->addText('Qty.', $boldArial);
        $table->addCell(3000, ['vMerge' => 'restart'])->addText('Unit Cost (Php)', $boldArial);

        $cell = $table->addCell(7500, ['gridSpan' => 3]);
        $cell->addText('Amount (PhP)', $boldArial, ['alignment' => Jc::CENTER]);

        $table->addRow();
        $table->addCell(5500, ['vMerge' => 'continue']);
        $table->addCell(1200, ['vMerge' => 'continue']);
        $table->addCell(3000, ['vMerge' => 'continue']);
        $table->addCell(3000)->addText('SETUP', $boldArial);
        $table->addCell(1500)->addText('Prop.', $boldArial);
        $table->addCell(3000)->addText('Total', $boldArial);

        foreach ($project->items as $item) {
            $table->addRow();

            $cell = $table->addCell(5500);
            $textRun = $cell->addTextRun();
            $textRun->addText($item->item_name, $boldArial);
            $textRun->addTextBreak();
            $textRun->addText('Specifications:', ['italic' => true, $arialFont]);
            $textRun->addTextBreak();
            $textRun->addText($item->specifications ?? 'N/A');

            $table->addCell(1200)->addText($item->quantity, $arialFont);
            $table->addCell(3000)->addText(number_format($item->item_cost, 2), $arialFont);

            $totalCost = $item->item_cost * $item->quantity;
            $table->addCell(3000)->addText(number_format($totalCost, 2), $arialFont);
            $table->addCell(1500)->addText('');
            $table->addCell(3000)->addText(number_format($totalCost, 2), $arialFont);
        }

        $grandTotal = 0;
        foreach ($project->items as $item) {
            $grandTotal += $item->item_cost * $item->quantity;
        }

        $table->addRow();
        $mergedCell = $table->addCell(9700, ['gridSpan' => 3]);
        $mergedTextRun = $mergedCell->addTextRun(['alignment' => Jc::END]);
        $mergedTextRun->addText('TOTAL', $boldArial);
        $table->addCell(3000)->addText(number_format($grandTotal, 2), $boldArial);
        $table->addCell(1500)->addText('');
        $table->addCell(3000)->addText(number_format($grandTotal, 2), $boldArial);

        $templateProcessor->setComplexBlock('LIB_TABLE', $table);

        // Create activities table
        $phpWord = new PhpWord();
        $arialFont = ['name' => 'Arial', 'size' => 9];
        $boldArial = ['name' => 'Arial', 'bold' => true, 'size' => 9];

        $section = $phpWord->addSection();
        $activitiesTable = $section->addTable([
            'borderSize' => 6,
            'borderColor' => '999999',
            'cellMargin' => 80,
            'alignment' => Jc::CENTER,
        ]);

        $activitiesTable->addRow();
        $activitiesTable->addCell(5000)->addText('Activity', $boldArial);
        $activitiesTable->addCell(4000)->addText('Period Covered', $boldArial, ['alignment' => Jc::CENTER]);

        foreach ($project->activities as $activity) {
            $activitiesTable->addRow();
            $activitiesTable->addCell(5000)->addText($activity->activity_name, $arialFont);

            $start = $activity->start_date ? Carbon::parse($activity->start_date)->format('F Y') : 'N/A';
            $end = $activity->end_date ? Carbon::parse($activity->end_date)->format('F Y') : 'N/A';
            $period = "$start - $end";

            $activitiesTable->addCell(4000)->addText($period, $arialFont, ['alignment' => Jc::CENTER]);
        }

        $activitiesTable->addRow();
        $activitiesTable->addCell(5000)->addText('Refund Period', $boldArial);
        $activitiesTable->addCell(4000)->addText($phaseTwo, $arialFont, ['alignment' => Jc::CENTER]);

        $templateProcessor->setComplexBlock('ACTIVITY_TABLE', $activitiesTable);

        // Create refund table
        $start = Carbon::parse($project->refund_initial)->startOfYear();
        $end = Carbon::parse($project->refund_end);

        $periodMonths = [];
        $current = $start->copy();

        while ($current->lessThanOrEqualTo($end)) {
            $periodMonths[] = [
                'month' => $current->format('F'),
                'year' => $current->year,
                'date' => $current->copy(),
            ];
            $current->addMonth();
        }

        $refundData = [];
        foreach ($periodMonths as $p) {
            $month = $p['month'];
            $year = $p['year'];

            if ($p['date']->lessThan(Carbon::parse($project->refund_initial))) {
                $refundData[$year][$month] = '';
            } elseif ($p['date']->equalTo($end)) {
                $refundData[$year][$month] = $project->last_refund;
            } else {
                $refundData[$year][$month] = $project->refund_amount ?? 0;
            }
        }

        $phpWord = new PhpWord();
        $refundTable = $section->addTable([
            'borderSize' => 6,
            'borderColor' => '999999',
            'cellMargin' => 80,
        ]);

        $refundTable->addRow();
        $refundTable->addCell(3000)->addText('Month', ['bold' => true, 'name' => 'Arial']);
        $years = array_unique(array_column($periodMonths, 'year'));
        foreach ($years as $year) {
            $refundTable->addCell(2000)->addText($year, ['bold' => true, 'name' => 'Arial'], ['alignment' => Jc::CENTER]);
        }

        $months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        $yearTotals = array_fill_keys($years, 0);
        $overallTotal = 0;

        foreach ($months as $month) {
            $rowHasData = false;
            foreach ($years as $year) {
                if (isset($refundData[$year][$month])) {
                    $rowHasData = true;
                    break;
                }
            }

            if (!$rowHasData) {
                continue;
            }

            $refundTable->addRow();
            $refundTable->addCell(3000)->addText($month, ['name' => 'Arial']);

            foreach ($years as $year) {
                $amount = $refundData[$year][$month] ?? '';
                if ($amount !== '' && $amount !== null) {
                    $yearTotals[$year] += $amount;
                    $overallTotal += $amount;
                }

                $refundTable->addCell(2000)->addText(
                    $amount !== '' ? number_format($amount, 2) : '',
                    ['name' => 'Arial'],
                    ['alignment' => Jc::CENTER]
                );
            }
        }

        $refundTable->addRow();
        $refundTable->addCell(3000)->addText('Year Total', ['bold' => true, 'name' => 'Arial']);
        foreach ($years as $year) {
            $refundTable->addCell(2000)->addText(
                number_format($yearTotals[$year], 2),
                ['bold' => true, 'name' => 'Arial'],
                ['alignment' => Jc::CENTER]
            );
        }

        $colSpan = count($years);
        $refundTable->addRow();
        $refundTable->addCell(3000)->addText('Overall Total', ['bold' => true, 'name' => 'Arial']);
        $refundTable->addCell(2000 * $colSpan, ['gridSpan' => $colSpan])->addText(
            number_format($overallTotal, 2),
            ['bold' => true, 'name' => 'Arial'],
            ['alignment' => Jc::CENTER]
        );

        $templateProcessor->setComplexBlock('REFUND_TABLE', $refundTable);

        // Save and return file
        $outputFolder = storage_path('app/generated');
        if (!file_exists($outputFolder)) {
            mkdir($outputFolder, 0777, true);
        }

        $fileName = now()->timestamp.'_MOA.docx';
        $outputPath = "$outputFolder/$fileName";
        $templateProcessor->saveAs($outputPath);

        return response()->download($outputPath)->deleteFileAfterSend(true);
    }

    /**
     * Generate a MOA docx from form submission.
     */
    public function generateDocx(Request $request)
    {
        try {
            $this->authorize('viewAny', MoaModel::class);

            $request->validate([
                'project_id' => 'required|exists:tbl_projects,project_id',
                'witness' => 'required|string',
            ]);

            $project = ProjectModel::with(['proponent.office'])->findOrFail($request->project_id);
            $proponent = $project->proponent;
            $officeId = $proponent->office_id;

            $inputName = trim($request->input('owner_name', ''));
            $inputPosition = trim($request->input('owner_position', ''));

            $ownerName = !empty($inputName) ? $inputName : ($proponent->owner_name ?? 'N/A');
            $ownerPosition = !empty($inputPosition) ? $inputPosition : 'Owner';
            $witness = $request->input('witness');

            $costInWords = (new \NumberFormatter('en', \NumberFormatter::SPELLOUT))
                ->format($project->project_cost);
            $costInWords = ucwords($costInWords);

            $director = DirectorModel::where('office_id', $officeId)->first();

            $pdName = 'N/A';
            $pdTitle = 'N/A';

            if ($director) {
                $middleInitial = $director->middle_name
                    ? strtoupper(substr($director->middle_name, 0, 1)).'.'
                    : '';
                $pdName = trim("{$director->first_name} {$middleInitial} {$director->last_name}");
                $pdTitle = $director->title ?? 'N/A';
            }

            $moa = MoaModel::updateOrCreate(
                ['project_id' => $project->project_id],
                [
                    'office_id' => $officeId,
                    'owner_name' => $ownerName,
                    'owner_position' => $ownerPosition,
                    'witness' => $witness,
                    'pd_name' => $pdName,
                    'pd_title' => $pdTitle,
                    'amount_words' => $costInWords,
                    'project_cost' => $project->project_cost,
                ]
            );

            return redirect()->route('moa.index')
                ->with('success', 'MOA draft saved successfully. You can now generate the document from the MOA list.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('MOA Draft Creation Error', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors([
                'error' => 'Failed to create MOA draft: '.$e->getMessage(),
            ])->withInput();
        }
    }
}
