<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use App\Models\MoaModel;
use App\Models\ProjectModel;
use App\Models\CompanyModel;
use App\Models\DirectorModel;
use App\Models\UserModel;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use \NumberFormatter;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\SimpleType\Jc;
use PhpOffice\PhpWord\TemplateProcessor;
use Inertia\Inertia;

class MOAController extends Controller
{

    use AuthorizesRequests;
public function index(Request $request)
{
    $this->authorize('viewAny', MoaModel::class);

    $search = $request->input('search');
    $perPage = $request->input('perPage', 10);
    $sortBy = $request->input('sortBy', 'created_at');
    $sortOrder = $request->input('sortOrder', 'desc');
    $user = Auth::user();


    // Eager load approved_by_user relationship
    $query = MoaModel::with(['project.company.office', 'approvedByUser']);

    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->where('owner_name', 'like', "%{$search}%")
              ->orWhere('pd_name', 'like', "%{$search}%")
              ->orWhereHas('project', function ($q2) use ($search) {
                  $q2->where('project_title', 'like', "%{$search}%");
              });
        });
    }

    if ($user && $user->role === 'staff') {
        $query->whereHas('project.company', function ($q) use ($user) {
            $q->where('office_id', $user->office_id);
        });
    } elseif ($user && $user->role !== 'rpmo') {
        $query->whereRaw('0 = 1');
    }

    if ($sortBy === 'project_cost') {
        $query->join('tbl_projects', 'tbl_moa.project_id', '=', 'tbl_projects.project_id')
              ->orderBy('tbl_projects.project_cost', $sortOrder)
              ->select('tbl_moa.*');
    } else {
        $query->orderBy('tbl_moa.' . $sortBy, $sortOrder);
    }

    $moas = $query->paginate($perPage)->appends($request->only('search', 'perPage', 'sortBy', 'sortOrder'));

    return inertia('MOA/Index', [
        'moas' => $moas,
        'filters' => $request->only('search', 'perPage', 'sortBy', 'sortOrder'),
    ]);
}


public function uploadApprovedFile(Request $request, $moa_id)
{
    $moa = MoaModel::with('project.company')->findOrFail($moa_id);
    $this->authorize('uploadApprovedFile', $moa);

    $validator = Validator::make($request->all(), [
        'approved_file' => [
            'required',
            'file',
            'mimes:pdf', // Only PDF allowed
            'max:10240', // 10MB
        ],
    ], [
        'approved_file.required' => 'Please select a file to upload.',
        'approved_file.mimes' => 'Only PDF files are allowed.',
        'approved_file.max' => 'File size must not exceed 10MB.',
    ]);

    if ($validator->fails()) {
        return back()->withErrors($validator)->withInput();
    }

    try {
        $file = $request->file('approved_file');
        $extension = $file->getClientOriginalExtension();
        
        // Sanitize project and company names for filename
        $projectTitle = preg_replace('/[^A-Za-z0-9\-]/', '_', $moa->project->project_title);
        $projectTitle = substr($projectTitle, 0, 50);
        
        $companyName = preg_replace('/[^A-Za-z0-9\-]/', '_', $moa->project->company->company_name);
        $companyName = substr($companyName, 0, 50);
        
        $timestamp = now()->format('Y-m-d_His');
        $fileName = "MOA_{$projectTitle}_{$companyName}_{$timestamp}.{$extension}";
        
        // Keep old file (DO NOT DELETE - just overwrite reference)
        $oldFilePath = $moa->approved_file_path;
        
        // Store new file
        $path = $file->storeAs('moa', $fileName, 'private');
        
        if (!$path) {
            throw new \Exception('Failed to store file on disk');
        }
        
        // Update MOA database
        $isReupload = !empty($oldFilePath);
        $moa->update([
            'approved_file_path' => $path,
            'approved_file_uploaded_at' => now(),
            'approved_by' => Auth::id(),
        ]);

        // Send notification
$officeUsers = UserModel::where('office_id', $moa->project->company->office_id)
    ->whereIn('role', ['rpmo', 'staff'])
    ->get();

    $actionType = $isReupload ? 'reuploaded' : 'uploaded';

    foreach ($officeUsers as $user) {
        try {
            Mail::to($user->email)->send(
                new \App\Mail\MoaNotificationMail(
                    $actionType,
                    $moa->project->project_title,
                    $moa->project->company->company_name,
                    $user->name
                )
            );
            Log::info("MOA notification email sent to {$user->email}");
        } catch (\Exception $e) {
            Log::error("Failed to send MOA email to {$user->email}: " . $e->getMessage());
        }
    }


        $successMessage = $isReupload 
            ? 'Approved MOA file reuploaded successfully.' 
            : 'Approved MOA file uploaded successfully.';

        return back()->with('success', $successMessage);
        
    } catch (\Exception $e) {
        Log::error('MOA File Upload Error', [
            'moa_id' => $moa_id,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
        
        return back()->withErrors([
            'error' => 'Failed to upload file: ' . $e->getMessage()
        ]);
    }
}
public function viewApprovedFile($moa_id)
{
    $moa = MoaModel::findOrFail($moa_id);
    $this->authorize('downloadApprovedFile', $moa); // Use same authorization as download

    if (!$moa->hasApprovedFile()) {
        return back()->withErrors(['error' => 'No approved file found for this MOA.']);
    }

    $filePath = storage_path('app/private/' . $moa->approved_file_path);
    
    if (!file_exists($filePath)) {
        return back()->withErrors(['error' => 'File not found on server.']);
    }

    // Return file for inline viewing in browser
    return response()->file($filePath, [
        'Content-Type' => 'application/pdf',
        'Content-Disposition' => 'inline; filename="' . basename($moa->approved_file_path) . '"'
    ]);
}
public function downloadApprovedFile($moa_id)
{
    $moa = MoaModel::findOrFail($moa_id);
    $this->authorize('downloadApprovedFile', $moa);

    if (!$moa->hasApprovedFile()) {
        return back()->withErrors(['error' => 'No approved file found for this MOA.']);
    }

    $filePath = storage_path('app/private/' . $moa->approved_file_path);
    $fileName = basename($moa->approved_file_path);

    return response()->download($filePath, $fileName);
}

// public function deleteApprovedFile($moa_id)
// {
//     $moa = MOAModel::findOrFail($moa_id);
//     $this->authorize('deleteApprovedFile', $moa);

//     try {
//         if ($moa->approved_file_path && Storage::disk('private')->exists($moa->approved_file_path)) {
//             Storage::disk('private')->delete($moa->approved_file_path);
//         }

//         $moa->update([
//             'approved_file_path' => null,
//             'approved_file_uploaded_at' => null,
//             'approved_by' => null,
//         ]);

//         return back()->with('success', 'Approved file deleted successfully.');
//     } catch (\Exception $e) {
//         Log::error('MOA File Delete Error: ' . $e->getMessage());
//         return back()->withErrors(['error' => 'Failed to delete file: ' . $e->getMessage()]);
//     }
// }


public function generateFromMoa($moa_id)
{
    // Load MOA with all necessary relationships
    $moa = MoaModel::with(['project.company.office', 'project.items', 'project.activities'])->findOrFail($moa_id);
    $this->authorize('generate', $moa);
    $project = $moa->project;
    $company = $project->company;
    $office = $company->office;

    // Load template
    $templatePath = storage_path('../public/templates/template.docx');
    $templateProcessor = new TemplateProcessor($templatePath);

    // Load image
    // $templateProcessor->setImageValue('image', [
    //     'path' => storage_path('app/templates/signature.png'),
    //     'width' => 130,
    //     'height' => 80,
    //     'ratio' => true,
    // ]);

    $companyAddress = collect([
        $company->street,
        $company->barangay,
        $company->municipality,
        $company->province,
    ])->filter()->implode(', ');

    $releaseInitial = $project->release_initial ? Carbon::parse($project->release_initial)->format('F Y') : 'N/A';
    $releaseEnd     = $project->release_end ? Carbon::parse($project->release_end)->format('F Y') : 'N/A';
    $refundInitial  = $project->refund_initial ? Carbon::parse($project->refund_initial)->format('F Y') : 'N/A';
    $refundEnd      = $project->refund_end ? Carbon::parse($project->refund_end)->format('F Y') : 'N/A';

    // Group into phase strings
    $phaseOne = "$releaseInitial - $releaseEnd";
    $phaseTwo = "$refundInitial - $refundEnd";

    // Fill in text placeholders
    $templateProcessor->setValue('OWNER_NAME', $moa->owner_name);
    $templateProcessor->setValue('position', $moa->owner_position);
    $templateProcessor->setValue('witness', $moa->witness);
    $templateProcessor->setValue('COMPANY_NAME', $company->company_name);
    $templateProcessor->setValue('COMPANY_LOCATION', $companyAddress);
    $templateProcessor->setValue('office_name', $office->office_name ?? 'N/A');
    $templateProcessor->setValue('PROJECT_TITLE', $project->project_title);
    $templateProcessor->setValue('phase_one', $phaseOne);
    $templateProcessor->setValue('phase_two', $phaseTwo);
    $templateProcessor->setValue('project_cost', number_format($project->project_cost, 2));
    $templateProcessor->setValue('amount', $moa->amount_words);
    $templateProcessor->setValue('pd_name', $moa->pd_name ?? 'N/A');
    $templateProcessor->setValue('pd_title', $moa->pd_title ?? 'N/A');

    
    // Create table block from project items
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

        // Merge vertically down: vMerge = 'restart'
        $table->addCell(5500, ['vMerge' => 'restart'])->addText('Item of Expenditure', $boldArial);
        $table->addCell(1200, ['vMerge' => 'restart'])->addText('Qty.', $boldArial);
        $table->addCell(3000, ['vMerge' => 'restart'])->addText('Unit Cost (Php)' , $boldArial);

        // Merge horizontally across 3 cells
        $cell = $table->addCell(7500, ['gridSpan' => 3]);
        $cell->addText('Amount (PhP)', $boldArial, ['alignment' => Jc::CENTER]);

        // Second row
        $table->addRow();

        // vMerge = 'continue' fills vertically merged cells
        $table->addCell(5500, ['vMerge' => 'continue']);
        $table->addCell(1200, ['vMerge' => 'continue']);
        $table->addCell(3000, ['vMerge' => 'continue']);

        // Subheaders
        $table->addCell(3000)->addText('SETUP' , $boldArial);
        $table->addCell(1500)->addText('Prop.', $boldArial);
        $table->addCell(3000)->addText('Total', $boldArial);


        foreach ($project->items as $item) {
            $table->addRow();

            $cell = $table->addCell(5500);
            $textRun = $cell->addTextRun();

            $textRun->addText($item->item_name, $boldArial); // Item name
            $textRun->addTextBreak(); // New line
            $textRun->addText("Specifications:", ['italic' => true, $arialFont]); // Subtitle
            $textRun->addTextBreak(); // New line
            $textRun->addText($item->specifications ?? 'N/A', ); // Actual specs

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

        // Add Total row
        $table->addRow();

        // Merge first 3 columns for the "Total" label
        $mergedCell = $table->addCell(9700, ['gridSpan' => 3]);

        // Add "TOTAL" aligned to the right of the merged cell
        $mergedTextRun = $mergedCell->addTextRun(['alignment' => Jc::END]);
        $mergedTextRun->addText('TOTAL', $boldArial);

        // SETUP column total (same as grand total for now)
        $table->addCell(3000)->addText(number_format($grandTotal, 2), $boldArial);
        $table->addCell(1500)->addText(''); // Prop. column left blank
        $table->addCell(3000)->addText(number_format($grandTotal, 2), $boldArial);


        // Now inject it to template
        $templateProcessor->setComplexBlock('LIB_TABLE', $table);


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

        // Header row
        $activitiesTable->addRow();
        $activitiesTable->addCell(5000)->addText("Activity", $boldArial);
        $activitiesTable->addCell(4000)->addText("Period Covered", $boldArial, ['alignment' => Jc::CENTER]);

        // Rows for each activity
        foreach ($project->activities as $activity) {
            $activitiesTable->addRow();
            $activitiesTable->addCell(5000)->addText($activity->activity_name, $arialFont);

            // Combine start_date and end_date
            $start = $activity->start_date ? Carbon::parse($activity->start_date)->format('F Y') : 'N/A';
            $end   = $activity->end_date ? Carbon::parse($activity->end_date)->format('F Y') : 'N/A';
            $period = "$start - $end";

            $activitiesTable->addCell(4000)->addText($period, $arialFont, ['alignment' => Jc::CENTER]);
        }

        // Last row = Refund Period
        $activitiesTable->addRow();
        $activitiesTable->addCell(5000)->addText("Refund Period", $boldArial);

        // This will now correctly use your $phaseTwo string (Refund Start - Refund End)
        $activitiesTable->addCell(4000)->addText($phaseTwo, $arialFont, ['alignment' => Jc::CENTER]);

        // Insert into template
        $templateProcessor->setComplexBlock('ACTIVITY_TABLE', $activitiesTable);


        $start = Carbon::parse($project->refund_initial)->startOfYear(); // force to January of that year
        $end   = Carbon::parse($project->refund_end);

        $periodMonths = [];
        $current = $start->copy();

        while ($current->lessThanOrEqualTo($end)) {
            $periodMonths[] = [
                'month' => $current->format('F'),
                'year'  => $current->year,
                'date'  => $current->copy(),
            ];
            $current->addMonth();
        }

// Prepare refund data
        $refundData = [];
        foreach ($periodMonths as $p) {
            $month = $p['month'];
            $year  = $p['year'];

            if ($p['date']->lessThan(Carbon::parse($project->refund_initial))) {
                $refundData[$year][$month] = ''; // blank before start
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

// Header row
        $refundTable->addRow();
        $refundTable->addCell(3000)->addText('Month', ['bold' => true, 'name' => 'Arial']);
        $years = array_unique(array_column($periodMonths, 'year'));
        foreach ($years as $year) {
            $refundTable->addCell(2000)->addText($year, ['bold' => true, 'name' => 'Arial'], ['alignment' => Jc::CENTER]);
        }

// Prepare monthly + yearly totals
        $months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
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

            if (!$rowHasData) continue;

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

        // Add Yearly Totals Row
        $refundTable->addRow();
        $refundTable->addCell(3000)->addText('Year Total', ['bold' => true, 'name' => 'Arial']);
        foreach ($years as $year) {
            $refundTable->addCell(2000)->addText(
                number_format($yearTotals[$year], 2),
                ['bold' => true, 'name' => 'Arial'],
                ['alignment' => Jc::CENTER]
            );
        }

        // Add Overall Total Row
        $colSpan = count($years);

        $refundTable->addRow();

        // First cell (Overall Total label)
        $refundTable->addCell(3000)->addText('Overall Total', ['bold' => true, 'name' => 'Arial']);

        // Second cell (merged across all year columns)
        $refundTable->addCell(
            2000 * $colSpan, // Optional: multiply width by number of columns
            ['gridSpan' => $colSpan] // Merge columns
        )->addText(
            number_format($overallTotal, 2),
            ['bold' => true, 'name' => 'Arial'],
            ['alignment' => Jc::CENTER]
        );

        // Inject into template
        $templateProcessor->setComplexBlock('REFUND_TABLE', $refundTable);

                // Ensure output folder exists
        $outputFolder = storage_path('app/generated');
        if (!file_exists($outputFolder)) {
            mkdir($outputFolder, 0777, true);
        }

        // Save and return file
        $fileName = now()->timestamp . '_MOA.docx';
        $outputPath = "$outputFolder/$fileName";
        $templateProcessor->saveAs($outputPath);

        return response()->download($outputPath)->deleteFileAfterSend(true);
    }



public function showForm(Request $request)
{
    $this->authorize('viewAny', MoaModel::class);

    $user = Auth::user();


    // Build company query based on user role
    $companiesQuery = CompanyModel::select('company_id', 'company_name')
        ->whereHas('projects', function($query) {
            $query->whereIn('progress', ['internal_rtec', 'internal_compliance', 'external_rtec', 'external_compliance', 'Awaiting Approval', 'Project Review']);
        });
    
    if ($user->role === 'staff') {
        $companiesQuery->where('office_id', $user->office_id);
    } elseif ($user->role !== 'rpmo') {
        $companiesQuery->whereRaw('0 = 1'); // No access
    }
    
    $companies = $companiesQuery->get();
    
    $companyId = $request->query('company_id');
    $selectedCompany = null;
    $projects = collect([]);

    if ($companyId) {
        $selectedCompany = CompanyModel::with('office')->find($companyId);
        
        if ($selectedCompany) {
            // Verify access
            if ($user->role === 'staff' && $selectedCompany->office_id !== $user->office_id) {
                abort(403, 'Unauthorized access to this company.');
            }

            // Only show projects with Approved or Draft MOA status
            $projects = ProjectModel::where('company_id', $companyId)
                ->whereIn('progress', ['Awaiting Approval', 'Project Review', 'internal_rtec', 'internal_compliance', 'external_rtec', 'external_compliance',])
                ->with(['activities', 'items'])
                ->select('project_id', 'project_title', 'company_id')
                ->get();
        }
    }

    return Inertia::render('MOA/GenerateDocxForm', [
        'companies' => $companies,
        'selectedCompany' => $selectedCompany,
        'projects' => $projects,
        'filters' => [
            'company_id' => $companyId,
        ]
    ]);
}
public function getCompanyDetails($id)
{
    try {
        $company = CompanyModel::with([
            'projects.activities', // assuming you have correct relations
            'office'
        ])->findOrFail($id);

        return response()->json($company);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Server error',
            'message' => $e->getMessage()
        ], 500);
    }
}


public function generateDocx(Request $request)
{
    try {
        $this->authorize('viewAny', MoaModel::class);

        // Validate
        $request->validate([
            'project_id' => 'required|exists:tbl_projects,project_id',
            'witness' => 'required|string',
        ]);

        // Load project with relationships
        $project = ProjectModel::with(['company.office'])
            ->findOrFail($request->project_id);
        
        $company = $project->company;
        $officeId = $company->office_id;

        // Get owner details
        $inputName = trim($request->input('owner_name', ''));
        $inputPosition = trim($request->input('owner_position', ''));
        
        $ownerName = !empty($inputName) ? $inputName : ($company->owner_name ?? 'N/A');
        $ownerPosition = !empty($inputPosition) ? $inputPosition : 'Owner';
        $witness = $request->input('witness');

        // Process cost in words
        $costInWords = (new NumberFormatter('en', NumberFormatter::SPELLOUT))
            ->format($project->project_cost);
        $costInWords = ucwords($costInWords);

        // Get director details using the office_id from company
        $director = DirectorModel::where('office_id', $officeId)->first();
        
        $pdName = 'N/A';
        $pdTitle = 'N/A';
        
        if ($director) {
            $middleInitial = $director->middle_name 
                ? strtoupper(substr($director->middle_name, 0, 1)) . '.' 
                : '';
            $pdName = trim("{$director->first_name} {$middleInitial} {$director->last_name}");
            $pdTitle = $director->title ?? 'N/A';
        }

        // Save MOA record to database (NO DOCUMENT GENERATION)
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
        Log::error('MOA Draft Creation Error: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
        
        return back()->withErrors([
            'error' => 'Failed to create MOA draft: ' . $e->getMessage()
        ])->withInput();
    }
}
}