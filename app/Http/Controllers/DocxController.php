<?php

namespace App\Http\Controllers;

use App\Models\CompanyModel;
use App\Models\ProjectModel;
use Illuminate\Http\Request;
use Inertia\Inertia;
use PhpOffice\PhpWord\TemplateProcessor;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocxController extends Controller
{
    public function create()
    {
        return Inertia::render('DocxForm');
    }

    public function showForm()
{
    $companies = CompanyModel::select('company_id', 'company_name')->get();

    return inertia('DocxForm', [
        'companies' => $companies
    ]);
}
    
public function generate(Request $request)
{
    $request->validate([
        'name' => 'required',
        'date' => 'required|date',
        'project' => 'required',
    ]);

    $templatePath = public_path('template.docx');
    $templateProcessor = new \PhpOffice\PhpWord\TemplateProcessor($templatePath);

    $templateProcessor->setValue('name', $request->name);
    $templateProcessor->setValue('date', $request->date);
    $templateProcessor->setValue('project', $request->project);

    $tempPath = storage_path('app/temp_' . time() . '.docx');
    $templateProcessor->saveAs($tempPath);

    return response()->download($tempPath, 'generated.docx')->deleteFileAfterSend(true);
}

    public function fetchCompanyDetails($id)
    {
        $company = CompanyModel::with(['projects.activities', 'office'])->findOrFail($id);

        return response()->json([
            'company' => [
                'company_name' => $company->company_name,
                'owner_location' => $company->owner_location,
                'owner_name' => $company->owner_fname . ' ' .
                                strtoupper(substr($company->owner_mname, 0, 1)) . '. ' .
                                $company->owner_lname,
                'office_name' => $company->office->office_name ?? 'N/A',
            ],
            'projects' => $company->projects->map(function ($project) {
                return [
                    'project_title' => $project->project_title,
                    'phase_one' => $project->phase_one,
                    'phase_two' => $project->phase_two,
                    'project_cost' => $project->project_cost,
                    'activities' => $project->activities->map(function ($activity) {
                        return [
                            'activity_name' => $activity->activity_name,
                            'activity_date' => $activity->activity_date,
                        ];
                    }),
                ];
            }),
        ]);
    }

    public function generateDocx(Request $request)
    {
        $request->validate(['company_id' => 'required|exists:tbl_companies,company_id']);

        $company = CompanyModel::with(['projects.activities', 'office'])->findOrFail($request->company_id);
        $projectId = $request->input('project_id');
        $project = ProjectModel::with('company', 'activities')->findOrFail($projectId);

        $template = new TemplateProcessor(public_path('templates/moa_template.docx'));

        $template->setValue('company_name', $company->company_name);
        $template->setValue('owner_name', $company->owner_fname . ' ' . strtoupper(substr($company->owner_mname, 0, 1)) . '. ' . $company->owner_lname);
        $template->setValue('owner_location', $company->owner_location);
        $template->setValue('office_name', $company->office->office_name ?? 'N/A');

        // Assume only 1 project is relevant (adjust logic if multiple)
        $project = $company->projects->first();
        if ($project) {
            $template->setValue('project_title', $project->project_title);
            $template->setValue('phase_one', $project->phase_one);
            $template->setValue('phase_two', $project->phase_two);
            $template->setValue('project_cost', number_format($project->project_cost, 2));
        }

        $activities = $project?->activities ?? collect();
        $activityList = $activities->map(function ($a) {
            return "- {$a->activity_name} ({$a->activity_date})";
        })->implode("\n");

        $template->setValue('activities', $activityList ?: 'No activities');

        $filename = 'MOA_' . '_' . now()->format('Ymd_His') . '.docx';
        $filePath = storage_path("app/public/{$filename}");

        $template->saveAs($filePath);

        return response()->download($filePath)->deleteFileAfterSend(true);
    }

}
