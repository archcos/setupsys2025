<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Carbon\Carbon;
use PhpOffice\PhpWord\TemplateProcessor;
use App\Models\ProjectModel;
use App\Models\CompanyModel;
use App\Models\OfficeModel;
use App\Models\DirectorModel;

class ApprovalController extends Controller
{
    /**
     * Show list of approved projects
     */
    public function index()
    {
        try {
            $projects = ProjectModel::with(['company.office'])
                ->where('progress', 'Approved')
                ->orderBy('project_title')
                ->get()
                ->map(function ($project) {
                    return [
                        'project_id' => $project->project_id,
                        'project_title' => $project->project_title,
                        'project_cost' => $project->project_cost,
                        'company' => [
                            'company_name' => $project->company->company_name ?? 'N/A',
                            'owner_name' => $project->company->owner_name ?? 'N/A',
                            'street' => $project->company->street ?? '',
                            'barangay' => $project->company->barangay ?? '',
                            'municipality' => $project->company->municipality ?? '',
                            'office' => [
                                'office_id' => $project->company->office->office_id ?? null,
                                'office_name' => $project->company->office->office_name ?? 'N/A',
                            ]
                        ]
                    ];
                });

            return Inertia::render('ReviewApproval/Approved', [
                'projects' => $projects,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching approved projects: ' . $e->getMessage());
            
            return Inertia::render('ReviewApproval/Approved', [
                'projects' => [],
                'error' => 'Unable to load projects. Please try again later.'
            ]);
        }
    }

    /**
     * Download approval document (Word)
     */
    public function download(Request $request, $project_id)
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
                return back()->withErrors(['error' => 'Company information not found for this project.']);
            }

            $office = $company->office;
            
            if (!$office) {
                return back()->withErrors(['error' => 'Office information not found for this company.']);
            }

            // Get Director Info
            $director = DirectorModel::where('office_id', $office->office_id)->first();

            // Check template exists
            $templatePath = public_path('templates/approval.docx');
            if (!file_exists($templatePath)) {
                Log::error('Template file not found at: ' . $templatePath);
                return back()->withErrors(['error' => 'Approval template not found. Please contact system administrator.']);
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

            // Return the file as download and keep it stored
            return response()->download($fullPath, $fileName, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Project not found: ' . $project_id);
            return back()->withErrors(['error' => 'Project not found.']);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
            
        } catch (\Exception $e) {
            Log::error('Error generating approval document: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            return back()->withErrors(['error' => 'Failed to generate approval document. Please try again or contact support.']);
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