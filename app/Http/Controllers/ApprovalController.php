<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;
use PhpOffice\PhpWord\TemplateProcessor;
use App\Models\ProjectModel;
use App\Models\ProponentModel;
use App\Models\OfficeModel;
use App\Models\DirectorModel;
use App\Models\ComplianceModel;
use App\Services\SupabaseUpload;

class ApprovalController extends Controller
{
    /**
     * Show list of approved projects filtered by progress stages
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user || !in_array($user->role, ['staff', 'rpmo'])) {
                return Inertia::render('Approval/Index', [
                    'projects'      => [],
                    'offices'       => [],
                    'filters'       => [],
                    'statusCounts'  => [],
                    'availableYears'=> [],
                    'error'         => 'You do not have permission to access this resource.'
                ]);
            }

            $search        = $request->input('search', '');
            $perPage       = $request->input('perPage', 10);
            $officeFilter  = $request->input('officeFilter', '');
            $yearFilter    = $request->input('yearFilter', '');
            $sortField     = $request->input('sortField', '');
            $sortDirection = $request->input('sortDirection', 'asc');
            $statusTab     = $request->input('statusTab', 'All');

            $allowedStatuses   = ['Implementation', 'Approved', 'Completed', 'Refund', 'Liquidation'];
            $allowedSortFields = ['project_id', 'project_title', 'project_cost'];

            // ── Base query — always scoped to the 5 allowed statuses ──────────
            $baseQuery = ProjectModel::with(['proponent.office'])
                ->whereIn('progress', $allowedStatuses);

            // Role-based scope
            if ($user->role === 'staff') {
                if (!$user->office_id) {
                    return Inertia::render('Approval/Index', [
                        'projects'      => [],
                        'offices'       => [],
                        'filters'       => [],
                        'statusCounts'  => [],
                        'availableYears'=> [],
                        'error'         => 'No office assigned to your account.'
                    ]);
                }
                $baseQuery->whereHas('proponent', function ($q) use ($user) {
                    $q->where('office_id', $user->office_id);
                });
            }

            // ── Collect available years for the dropdown ──────────────────────
            $availableYears = (clone $baseQuery)
                ->whereNotNull('year_obligated')
                ->distinct()
                ->orderBy('year_obligated', 'desc')
                ->pluck('year_obligated')
                ->toArray();

            // ── Apply shared filters (office, year, search) ───────────────────
            $filteredBase = clone $baseQuery;

            // Office filter (rpmo only)
            if (!empty($officeFilter) && $user->role === 'rpmo') {
                $filteredBase->whereHas('proponent', function ($q) use ($officeFilter) {
                    $q->where('office_id', $officeFilter);
                });
            }

            // Year obligated filter
            if (!empty($yearFilter)) {
                $filteredBase->where('year_obligated', $yearFilter);
            }

            // Search
            if (!empty($search)) {
                $filteredBase->where(function ($q) use ($search) {
                    $q->where('project_title', 'like', "%{$search}%")
                      ->orWhereHas('proponent', function ($q) use ($search) {
                          $q->where('company_name', 'like', "%{$search}%")
                            ->orWhere('owner_name', 'like', "%{$search}%");
                      });
                });
            }

            // ── Status counts — computed from $filteredBase (no tab filter) ───
            $statusCounts = ['All' => 0];
            foreach ($allowedStatuses as $s) {
                $count = (clone $filteredBase)->where('progress', $s)->count();
                $statusCounts[$s] = $count;
                $statusCounts['All'] += $count;
            }

            // ── Paginated query — add tab filter on top of $filteredBase ──────
            $query = clone $filteredBase;

            if ($statusTab && $statusTab !== 'All' && in_array($statusTab, $allowedStatuses)) {
                $query->where('progress', $statusTab);
            }

            // ── Sort ──────────────────────────────────────────────────────────
            // Only allow whitelisted fields; fall back to created_at desc.
            $direction = $sortDirection === 'asc' ? 'asc' : 'desc';

            if (!empty($sortField) && in_array($sortField, $allowedSortFields)) {
                $query->orderBy($sortField, $direction);
            } else {
                $query->orderBy('created_at', 'desc');
            }

            $projects = $query->paginate($perPage)->withQueryString();

            // ── Offices for dropdown ──────────────────────────────────────────
            $offices = [];
            if ($user->role === 'rpmo') {
                $offices = OfficeModel::orderBy('office_name')->get();
            }

            return Inertia::render('Approval/Index', [
                'projects'      => $projects,
                'offices'       => $offices,
                'statusCounts'  => $statusCounts,
                'availableYears'=> $availableYears,
                'filters'       => [
                    'search'        => $search,
                    'perPage'       => $perPage,
                    'officeFilter'  => $officeFilter,
                    'yearFilter'    => $yearFilter,
                    'sortField'     => $sortField,
                    'sortDirection' => $sortDirection,
                    'statusTab'     => $statusTab,
                ],
                'userRole' => $user->role,
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching approved projects: ' . $e->getMessage());

            return Inertia::render('Approval/Index', [
                'projects'      => [],
                'offices'       => [],
                'filters'       => [],
                'statusCounts'  => [],
                'availableYears'=> [],
                'error'         => 'Unable to load projects. Please try again later.'
            ]);
        }
    }

    /**
     * Generate approval document, store locally, backup to Supabase, and return download URL
     */
    public function generateDocument(Request $request, $project_id)
    {
        try {
            $validated = $request->validate([
                'owner_lastname' => 'required|string|max:255',
                'position'       => 'required|string|max:255',
            ]);

            $project = ProjectModel::with(['proponent.office'])->findOrFail($project_id);
            $proponent = $project->proponent;

            if (!$proponent) {
                return response()->json(['error' => 'proponent information not found for this project.'], 422);
            }

            $office = $proponent->office;

            if (!$office) {
                return response()->json(['error' => 'Office information not found for this proponent.'], 422);
            }

            $director = DirectorModel::where('office_id', $office->office_id)->first();

            $templatePath = public_path('templates/approval.docx');
            if (!file_exists($templatePath)) {
                Log::error('Template file not found at: ' . $templatePath);
                return response()->json(['error' => 'Approval template not found. Please contact system administrator.'], 500);
            }

            $template    = new TemplateProcessor($templatePath);
            $currentDate = Carbon::now()->format('d F Y');

            $pdFullName = 'N/A';
            $pdPosition = 'N/A';
            if ($director) {
                $middleInitial = $director->middle_name ? strtoupper(substr($director->middle_name, 0, 1)) . '.' : '';
                $pdFullName    = trim("{$director->honorific} {$director->first_name} {$middleInitial} {$director->last_name}");
                $pdPosition    = $director->title;
            }

            $addressParts      = array_filter([$proponent->street, $proponent->barangay, $proponent->municipality]);
            $proponentLocation = implode(', ', $addressParts) ?: 'N/A';
            $amountWords       = $this->convertNumberToWords($project->project_cost);

            $template->setValues([
                'CURRENT_DATE'       => $currentDate,
                'OWNER_NAME'         => $proponent->owner_name ? strtoupper($proponent->owner_name) : 'N/A',
                'POSITION'           => $validated['position'],
                'COMPANY_NAME'       => $proponent->company_name ?? 'N/A',
                'proponent_LOCATION' => $proponentLocation,
                'PD_NAME'            => $pdFullName,
                'PD_POSITION'        => $pdPosition,
                'OFFICE_NAME'        => $office->office_name ?? 'N/A',
                'OWNER_LASTNAME'     => $validated['owner_lastname'],
                'PROJECT_TITLE'      => $project->project_title,
                'PROJECT_COST'       => number_format($project->project_cost, 2),
                'AMOUNT_WORDS'       => ucwords($amountWords),
            ]);

            $signaturePath = public_path('templates/e-signature.png');
            if (file_exists($signaturePath)) {
                try {
                    $template->setImageValue('rdsignature', [
                        'path'   => $signaturePath,
                        'width'  => 130,
                        'height' => 80,
                        'ratio'  => true,
                    ]);
                } catch (\Exception $e) {
                    Log::warning('Could not add signature image: ' . $e->getMessage());
                }
            }

            $safeProjectTitle = substr(preg_replace('/[^A-Za-z0-9_\-]/', '_', $project->project_title), 0, 50);
            $timestamp        = now()->format('Y-m-d_His');
            $fileName         = "approval_{$safeProjectTitle}_{$timestamp}.docx";
            $currentYear      = now()->year;
            $localFolderPath  = "{$currentYear}/{$project_id}/approval";
            $fullPath         = storage_path("app/private/{$localFolderPath}/{$fileName}");

            if (!file_exists(dirname($fullPath))) {
                mkdir(dirname($fullPath), 0755, true);
            }

            $template->saveAs($fullPath);

            if (!file_exists($fullPath)) {
                throw new \Exception('Failed to save approval document locally');
            }

            Log::info('Approval document stored locally', ['project_id' => $project_id, 'path' => $fullPath]);

            try {
                $fileContent    = file_get_contents($fullPath);
                $supabasePath   = "backup/{$currentYear}/{$project_id}/approval/{$fileName}";
                $supabaseUpload = new SupabaseUpload();
                $uploaded       = $supabaseUpload->upload($supabasePath, $fileContent);

                if ($uploaded) {
                    Log::info('Approval document uploaded to Supabase', ['project_id' => $project_id]);
                } else {
                    Log::warning('Supabase upload failed, continuing anyway', ['project_id' => $project_id]);
                }
            } catch (\Exception $e) {
                Log::error('Supabase upload error', ['project_id' => $project_id, 'error' => $e->getMessage()]);
            }

            return response()->json([
                'success'     => true,
                'downloadUrl' => route('approvals.download', [
                    'project_id' => $project_id,
                    'fileName'   => $fileName,
                ]),
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Project not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'details' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error generating approval document: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => 'Failed to generate approval document. Please try again or contact support.'], 500);
        }
    }

    /**
     * Download the generated approval document
     */
    public function download($project_id, $fileName)
    {
        try {
            $currentYear = now()->year;
            $filePath    = storage_path("app/private/{$currentYear}/{$project_id}/approval/{$fileName}");

            if (!file_exists($filePath)) {
                Log::error('Downloaded file not found: ' . $filePath);
                return back()->withErrors(['error' => 'File not found.']);
            }

            return response()->download($filePath, $fileName, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ]);

        } catch (\Exception $e) {
            Log::error('Error downloading approval document: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to download document.']);
        }
    }

    /**
     * Convert number to words
     */
    private function convertNumberToWords($number)
    {
        try {
            if (!extension_loaded('intl')) {
                return number_format($number, 2);
            }

            $formatter   = new \NumberFormatter('en', \NumberFormatter::SPELLOUT);
            $words       = $formatter->format(floor($number));
            $decimalPart = round(($number - floor($number)) * 100);

            if ($decimalPart > 0) {
                $words .= ' and ' . $formatter->format($decimalPart) . ' centavos';
            }

            return $words;
        } catch (\Exception $e) {
            Log::warning('Error converting number to words: ' . $e->getMessage());
            return number_format($number, 2);
        }
    }
}