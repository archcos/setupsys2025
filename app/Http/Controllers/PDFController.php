<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\CompanyModel;
use App\Models\ProjectModel;
use App\Models\ActivityModel;
use App\Models\OfficeModel;
use PhpOffice\PhpWord\TemplateProcessor;
use Illuminate\Support\Facades\Storage;
use \NumberFormatter;

class PDFController extends Controller
{
    public function showForm()
    {
        $companies = CompanyModel::select('company_id', 'company_name')->get();

        return Inertia::render('MOA/GenerateDocxForm', [
            'companies' => $companies,
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
        $request->validate([
            'project_id' => 'required|exists:tbl_projects,project_id',
        ]);

        $project = ProjectModel::with(['company', 'activities'])->findOrFail($request->project_id);
        $company = $project->company;

        $office = OfficeModel::find($company->office_id);
        $ownerName = "{$company->owner_fname} " . strtoupper(substr($company->owner_mname, 0, 1)) . ". {$company->owner_lname}";

        $templatePath = storage_path('app/templates/template.docx');
        $templateProcessor = new TemplateProcessor($templatePath);

        $costInWords = (new NumberFormatter('en', NumberFormatter::SPELLOUT))->format($project->project_cost);
        $costInWords = ucwords($costInWords); // Capitalize first letter of each word

        $templateProcessor->setValue('amount', $costInWords);


        $templateProcessor->setValue('COMPANY_NAME', $company->company_name);
        $templateProcessor->setValue('COMPANY_LOCATION', $company->company_location);
        $templateProcessor->setValue('OWNER_NAME', $ownerName);
        $templateProcessor->setValue('office_name', $office->office_name ?? 'N/A');
        $templateProcessor->setValue('PROJECT_TITLE', $project->project_title);
        $templateProcessor->setValue('phase_one', $project->phase_one);
        $templateProcessor->setValue('phase_two', $project->phase_two);
        $templateProcessor->setValue('project_cost', $project->project_cost);

        // Optional: Activities as string
        $activityList = $project->activities->map(fn($a) => $a->activity_name)->implode(', ');
        $templateProcessor->setValue('ACTIVITIES', $activityList);

        $fileName = now()->timestamp . '_MOA.docx';
        $outputPath = storage_path("app/generated/$fileName");

        $templateProcessor->saveAs($outputPath);
        return response()->download($outputPath)->deleteFileAfterSend(true);
    }
}
