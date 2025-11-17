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
use App\Models\CompanyModel;
use App\Models\OfficeModel;
use App\Models\DirectorModel;
use App\Models\ComplianceModel;

class ApprovalController extends Controller
{
    /**
     * Show list of approved projects (with compliance status = approved)
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();

            // Check if user role is staff or rpmo
            if (!$user || !in_array($user->role, ['staff', 'rpmo'])) {
                return Inertia::render('ReviewApproval/ApprovedProjects', [
                    'projects' => [],
                    'offices' => [],
                    'filters' => [],
                    'error' => 'You do not have permission to access this resource.'
                ]);
            }

            $search = $request->input('search', '');
            $perPage = $request->input('perPage', 10);
            $officeFilter = $request->input('officeFilter', '');
            $sortBy = $request->input('sortBy', 'desc');

            // Build query
            $query = ProjectModel::with(['company.office', 'compliance'])
                ->whereHas('compliance', function ($q) {
                    $q->where('status', 'approved');
                });

            // Filter by office based on user role
            if ($user->role === 'staff') {
                // Staff can only see projects from their office
                if (!$user->office_id) {
                    return Inertia::render('ReviewApproval/ApprovedProjects', [
                        'projects' => [],
                        'offices' => [],
                        'filters' => [],
                        'error' => 'No office assigned to your account.'
                    ]);
                }

                $query->whereHas('company', function ($q) use ($user) {
                    $q->where('office_id', $user->office_id);
                });
            }
            // If role is 'rpmo', show all projects (no office filter)

            // Search filter
            if (!empty($search)) {
                $query->where(function($q) use ($search) {
                    $q->where('project_title', 'like', "%{$search}%")
                      ->orWhereHas('company', function($companyQuery) use ($search) {
                          $companyQuery->where('company_name', 'like', "%{$search}%")
                                     ->orWhere('owner_name', 'like', "%{$search}%");
                      });
                });
            }

            // Office filter (only applies if user is rpmo)
            if (!empty($officeFilter) && $user->role === 'rpmo') {
                $query->whereHas('company', function($q) use ($officeFilter) {
                    $q->where('office_id', $officeFilter);
                });
            }

            // Sort by created_at or project_title
            if ($sortBy === 'title') {
                $query->orderBy('project_title', 'asc');
            } elseif ($sortBy === 'recent') {
                $query->latest();
            } else {
                $query->oldest();
            }

            // Paginate results with withQueryString
            $projects = $query->paginate($perPage)->withQueryString();

            // Get offices for filter dropdown
            $offices = [];
            if ($user->role === 'rpmo') {
                // RPMO can see all offices
                $offices = OfficeModel::orderBy('office_name')->get();
            } elseif ($user->role === 'staff' && $user->office_id) {
                // Staff only sees their own office
                $offices = OfficeModel::where('office_id', $user->office_id)->get();
            }

            return Inertia::render('ReviewApproval/ApprovedProjects', [
                'projects' => $projects,
                'offices' => $offices,
                'filters' => [
                    'search' => $search,
                    'perPage' => $perPage,
                    'officeFilter' => $officeFilter,
                    'sortBy' => $sortBy,
                ],
                'userRole' => $user->role,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching approved projects: ' . $e->getMessage());
            
            return Inertia::render('ReviewApproval/ApprovedProjects', [
                'projects' => [],
                'offices' => [],
                'filters' => [],
                'error' => 'Unable to load projects. Please try again later.'
            ]);
        }
    }

    /**
     * Generate approval document and return download URL
     */
    public function generateDocument(Request $request, $project_id)
    {
        try {
            // Validate input
            $validated = $request->validate([
                'owner_lastname' => 'required|string|max:255',
                'position' => 'required|string|max:255',
            ]);

            // Fetch project with relationships
            $project = ProjectModel::with(['company.office'])->findOrFail($project_id);
            $company = $project->company;
            
            if (!$company) {
                return response()->json(['error' => 'Company information not found for this project.'], 422);
            }

            $office = $company->office;
            
            if (!$office) {
                return response()->json(['error' => 'Office information not found for this company.'], 422);
            }

            // Get Director Info
            $director = DirectorModel::where('office_id', $office->office_id)->first();

            // Check template exists
            $templatePath = public_path('templates/approval.docx');
            if (!file_exists($templatePath)) {
                Log::error('Template file not found at: ' . $templatePath);
                return response()->json(['error' => 'Approval template not found. Please contact system administrator.'], 500);
            }

            // Process template
            $template = new TemplateProcessor($templatePath);

            // Prepare data
            $currentDate = Carbon::now()->format('d F Y');
            
            // Director full name with middle initial
            $pdFullName = 'N/A';
            $pdPosition = 'N/A';
            if ($director) {
                $middleInitial = $director->middle_name ? strtoupper(substr($director->middle_name, 0, 1)) . '.' : '';
                $pdFullName = trim("{$director->honorific} {$director->first_name} {$middleInitial} {$director->last_name}");
                $pdPosition = $director->title;
            }

            // Combine address
            $addressParts = array_filter([
                $company->street,
                $company->barangay,
                $company->municipality
            ]);
            $companyLocation = implode(', ', $addressParts) ?: 'N/A';

            // Amount to words
            $amountWords = $this->convertNumberToWords($project->project_cost);

            // Replace placeholders
            $template->setValues([
                'CURRENT_DATE'      => $currentDate,
                'OWNER_NAME' => $company->owner_name ? strtoupper($company->owner_name) : 'N/A',
                'POSITION'          => $validated['position'],
                'COMPANY_NAME'      => $company->company_name ?? 'N/A',
                'COMPANY_LOCATION'  => $companyLocation,
                'PD_NAME'           => $pdFullName,
                'PD_POSITION'       => $pdPosition,
                'OFFICE_NAME'       => $office->office_name ?? 'N/A',
                'OWNER_LASTNAME'    => $validated['owner_lastname'],
                'PROJECT_TITLE'     => $project->project_title,
                'PROJECT_COST'      => number_format($project->project_cost, 2),
                'AMOUNT_WORDS' => ucwords($amountWords),
            ]);

            // Add e-signature image if placeholder exists in template
            $signaturePath = public_path('templates/e-signature.png');
            if (file_exists($signaturePath)) {
                try {
                    $template->setImageValue('rdsignature', [
                        'path' => $signaturePath,
                        'width' => 130,
                        'height' => 80,
                        'ratio' => true,
                    ]);
                } catch (\Exception $e) {
                    Log::warning('Could not add signature image: ' . $e->getMessage());
                }
            } else {
                Log::warning('Signature image not found at: ' . $signaturePath);
            }

            // Generate safe filename
            $safeProjectTitle = preg_replace('/[^A-Za-z0-9_\-]/', '_', $project->project_title);
            $fileName = 'approval_' . $safeProjectTitle . '_' . time() . '.docx';
            
            // Save to storage/app/private/approval directory
            $privatePath = 'private/approval/' . $fileName;
            $fullPath = storage_path('app/' . $privatePath);
            
            // Ensure directory exists
            $directory = dirname($fullPath);
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }
            
            // Save the document
            $template->saveAs($fullPath);

            // Return JSON with download URL
            return response()->json([
                'success' => true,
                'downloadUrl' => route('approvals.download', ['project_id' => $project_id, 'fileName' => $fileName]),
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Project not found: ' . $project_id);
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
            $filePath = storage_path('app/private/approval/' . $fileName);

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
     * 
     * @param float|int $number
     * @return string
     */
    private function convertNumberToWords($number)
    {
        try {
            if (!extension_loaded('intl')) {
                // Fallback if intl extension is not available
                return number_format($number, 2);
            }
            
            $formatter = new \NumberFormatter('en', \NumberFormatter::SPELLOUT);
            $words = $formatter->format(floor($number));
            
            // Handle decimal part if exists
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