<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MOAModel;
use App\Models\ProjectModel;
use App\Models\CompanyModel;
use PhpOffice\PhpWord\TemplateProcessor;
use Illuminate\Support\Str;

class MOAController extends Controller
{

public function index(Request $request)
{
    $search = $request->input('search');

    $moas = MOAModel::with('project')
        ->when($search, function ($query, $search) {
            $query->where('owner_name', 'like', "%{$search}%")
                  ->orWhere('pd_name', 'like', "%{$search}%")
                  ->orWhereHas('project', function ($q) use ($search) {
                      $q->where('project_title', 'like', "%{$search}%");
                  });
        })
        ->latest()
        ->get();

    return inertia('MOA/Index', [
        'moas' => $moas,
        'filters' => [
            'search' => $search
        ],
    ]);
}


    public function showGeneratedMoa($project_id)
{
    $moa = MOAModel::where('project_id', $project_id)->firstOrFail();
    $project = ProjectModel::with('company')->findOrFail($project_id);
    $company = $project->company;

    // Load the Word template
    $templateProcessor = new TemplateProcessor(storage_path('app/templates/template.docx'));

    // Set the values from saved DB
    $templateProcessor->setValue('company_name', $company->company_name);
    $templateProcessor->setValue('project_title', $project->project_title);
    $templateProcessor->setValue('owner_name', $moa->owner_name);
    $templateProcessor->setValue('owner_position', $moa->owner_position);
    $templateProcessor->setValue('witness', $moa->witness);
    $templateProcessor->setValue('pd_name', $moa->pd_name);
    $templateProcessor->setValue('pd_title', $moa->pd_title);
    $templateProcessor->setValue('project_cost', number_format($moa->project_cost, 2));
    $templateProcessor->setValue('amount_words', $moa->amount_words);

    // You can also insert table rows here if needed

    // Save to temp file and return download
    $fileName = 'MOA_' . $company->company_name . '.docx';
    $tempPath = storage_path("app/public/{$fileName}");
    $templateProcessor->saveAs($tempPath);

    return response()->download($tempPath)->deleteFileAfterSend(true);
}

public function generateFromMoa($moa_id)
{
    // Load MOA with all necessary relationships
    $moa = MOAModel::with(['project.company.office', 'project.items', 'project.activities'])->findOrFail($moa_id);
    $project = $moa->project;
    $company = $project->company;
    $office = $company->office;

    // Load template
    $templatePath = storage_path('app/templates/template.docx');
    $templateProcessor = new TemplateProcessor($templatePath);

    // Load image
    $templateProcessor->setImageValue('image', [
        'path' => storage_path('app/templates/signature.png'),
        'width' => 130,
        'height' => 80,
        'ratio' => true,
    ]);

    // Fill in text placeholders
    $templateProcessor->setValue('OWNER_NAME', $moa->owner_name);
    $templateProcessor->setValue('position', $moa->owner_position);
    $templateProcessor->setValue('witness', $moa->witness);
    $templateProcessor->setValue('COMPANY_NAME', $company->company_name);
    $templateProcessor->setValue('COMPANY_LOCATION', $company->company_location);
    $templateProcessor->setValue('office_name', $office->office_name ?? 'N/A');
    $templateProcessor->setValue('PROJECT_TITLE', $project->project_title);
    $templateProcessor->setValue('phase_one', $project->phase_one);
    $templateProcessor->setValue('phase_two', $project->phase_two);
    $templateProcessor->setValue('project_cost', number_format($project->project_cost, 2));
    $templateProcessor->setValue('amount', $moa->amount_words);
    $templateProcessor->setValue('pd_name', $moa->pd_name ?? 'N/A');
    $templateProcessor->setValue('pd_title', $moa->pd_title ?? 'N/A');

    // Activities list
    $activities = $project->activities->pluck('activity_name')->implode(', ');
    $templateProcessor->setValue('ACTIVITIES', $activities);

    // Create table block from project items
    $phpWord = new \PhpOffice\PhpWord\PhpWord();
    $arialFont = ['name' => 'Arial'];
    $boldArial = ['name' => 'Arial', 'bold' => true];
    $section = $phpWord->addSection();

    $table = $section->addTable([
        'borderSize' => 6,
        'borderColor' => '999999',
        'cellMargin' => 80,
    ]);

    // Table headers
    $table->addRow();
    $table->addCell(5500, ['vMerge' => 'restart'])->addText('Item of Expenditure', $boldArial);
    $table->addCell(1200, ['vMerge' => 'restart'])->addText('Qty.', $boldArial);
    $table->addCell(3000, ['vMerge' => 'restart'])->addText('Unit Cost (Php)', $boldArial);
    $table->addCell(3000)->addText('SETUP', $boldArial);
    $table->addCell(1500)->addText('Prop.', $boldArial);
    $table->addCell(3000)->addText('Total', $boldArial);

    $grandTotal = 0;

    // Table rows
    foreach ($project->items as $item) {
        $table->addRow();

        $text = $item->item_name . "\nSpecifications:\n" . ($item->specifications ?? 'N/A');
        $table->addCell(5500)->addText($text, $arialFont);
        $table->addCell(1200)->addText($item->quantity, $arialFont);
        $table->addCell(3000)->addText(number_format($item->item_cost, 2), $arialFont);

        $total = $item->quantity * $item->item_cost;
        $grandTotal += $total;

        $table->addCell(3000)->addText(number_format($total, 2), $arialFont);
        $table->addCell(1500)->addText('', $arialFont);
        $table->addCell(3000)->addText(number_format($total, 2), $arialFont);
    }

    // Total row
    $table->addRow();
    $cell = $table->addCell(9700, ['gridSpan' => 3]);
    $cell->addTextRun(['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::RIGHT])
         ->addText('TOTAL', $boldArial);
    $table->addCell(3000)->addText(number_format($grandTotal, 2), $boldArial);
    $table->addCell(1500)->addText('');
    $table->addCell(3000)->addText(number_format($grandTotal, 2), $boldArial);

    // Set table in template
    $templateProcessor->setComplexBlock('LIB_TABLE', $table);

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

public function viewPdf($moa_id)
{
    $moa = MOAModel::with(['project.company.office', 'project.activities', 'project.items'])->findOrFail($moa_id);
    $project = $moa->project;
    $company = $project->company;
    $office = $company->office;

    // Load and fill DOCX template
    $templatePath = storage_path('app/templates/template.docx');
    $templateProcessor = new TemplateProcessor($templatePath);

    $templateProcessor->setValue('owner', $moa->owner_name);
    $templateProcessor->setValue('position', $moa->owner_position);
    $templateProcessor->setValue('witness', $moa->witness);
    $templateProcessor->setValue('company', $company->company_name);
    $templateProcessor->setValue('location', $company->company_location);
    $templateProcessor->setValue('office', $office->office_name ?? 'N/A');
    $templateProcessor->setValue('project_title', $project->project_title);
    $templateProcessor->setValue('phase_one', $project->phase_one);
    $templateProcessor->setValue('phase_two', $project->phase_two);
    $templateProcessor->setValue('project_cost', '₱ ' . number_format($project->project_cost, 2));
    $templateProcessor->setValue('amount_words', $moa->amount_words);
    $templateProcessor->setValue('pd_name', $moa->pd_name);
    $templateProcessor->setValue('pd_title', $moa->pd_title);

    // Save filled DOCX
    $filename = 'moa_' . $moa_id . '_' . Str::random(5);
    $docxPath = storage_path("app/generated/{$filename}.docx");

    if (!file_exists(storage_path('app/generated'))) {
        mkdir(storage_path('app/generated'), 0777, true);
    }

    $templateProcessor->saveAs($docxPath);

    // Convert DOCX to PDF using LibreOffice
    $outputDir = storage_path('app/generated');
    $command = "soffice --headless --convert-to pdf --outdir " . escapeshellarg($outputDir) . ' ' . escapeshellarg($docxPath);
    exec($command);

    $pdfPath = storage_path("app/generated/{$filename}.pdf");

    if (!file_exists($pdfPath)) {
        abort(500, 'Failed to generate PDF.');
    }

    return response()->file($pdfPath, [
        'Content-Type' => 'application/pdf',
        'Content-Disposition' => 'inline; filename="' . $filename . '.pdf"',
    ]);
}
}
