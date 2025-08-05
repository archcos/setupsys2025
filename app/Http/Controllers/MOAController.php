<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MOAModel;
use App\Models\ProjectModel;
use App\Models\CompanyModel;
use App\Models\UserModel;
use PhpOffice\PhpWord\TemplateProcessor;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;
use Symfony\Component\HttpFoundation\Response;

class MOAController extends Controller
{

public function index(Request $request)
{
    $search = $request->input('search');
    $perPage = $request->input('perPage', 10);
    $userId = session('user_id');
    $user = UserModel::find($userId);

    $query = MOAModel::with('project.company.office');

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
    } elseif ($user && $user->role !== 'admin') {
        $query->whereRaw('0 = 1');
    }

    $moas = $query->latest()->paginate($perPage)->appends($request->only('search', 'perPage'));

    return inertia('MOA/Index', [
        'moas' => $moas,
        'filters' => $request->only('search', 'perPage'),
    ]);
}





//     public function showGeneratedMoa($project_id)
// {
//     $moa = MOAModel::where('project_id', $project_id)->firstOrFail();
//     $project = ProjectModel::with('company')->findOrFail($project_id);
//     $company = $project->company;

//     // Load the Word template
//     $templateProcessor = new TemplateProcessor(storage_path('app/templates/template.docx'));

//     // Set the values from saved DB
//     $templateProcessor->setValue('company_name', $company->company_name);
//     $templateProcessor->setValue('project_title', $project->project_title);
//     $templateProcessor->setValue('owner_name', $moa->owner_name);
//     $templateProcessor->setValue('owner_position', $moa->owner_position);
//     $templateProcessor->setValue('witness', $moa->witness);
//     $templateProcessor->setValue('pd_name', $moa->pd_name);
//     $templateProcessor->setValue('pd_title', $moa->pd_title);
//     $templateProcessor->setValue('project_cost', number_format($moa->project_cost, 2));
//     $templateProcessor->setValue('amount_words', $moa->amount_words);

//     // You can also insert table rows here if needed

//     // Save to temp file and return download
//     $fileName = 'MOA_' . $company->company_name . '.docx';
//     $tempPath = storage_path("app/public/{$fileName}");
//     $templateProcessor->saveAs($tempPath);

//     return response()->download($tempPath)->deleteFileAfterSend(true);
// }

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

        $cell = $table->addCell(5500);
        $textRun = $cell->addTextRun();

        $textRun->addText($item->item_name, $boldArial); // Item name
        $textRun->addTextBreak(); // New line
        $textRun->addText("Specifications:", ['italic' => true, $arialFont]); // Subtitle
        $textRun->addTextBreak(); // New line
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
    // Generate the DOCX first
    $moa = MOAModel::with(['project.company.office', 'project.items', 'project.activities'])->findOrFail($moa_id);
    $project = $moa->project;
    $company = $project->company;
    $office = $company->office;

    $templatePath = storage_path('app/templates/template.docx');
    $templateProcessor = new TemplateProcessor($templatePath);

    $templateProcessor->setImageValue('image', [
        'path' => storage_path('app/templates/signature.png'),
        'width' => 130,
        'height' => 80,
        'ratio' => true,
    ]);

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
    $templateProcessor->setValue('ACTIVITIES', $project->activities->pluck('activity_name')->implode(', '));

    // Build item table
    $phpWord = new \PhpOffice\PhpWord\PhpWord();
    $section = $phpWord->addSection();
    $arialFont = ['name' => 'Arial'];
    $boldArial = ['name' => 'Arial', 'bold' => true];

    $table = $section->addTable([
        'borderSize' => 6,
        'borderColor' => '999999',
        'cellMargin' => 80,
    ]);

    $table->addRow();
    $table->addCell(5500)->addText('Item of Expenditure', $boldArial);
    $table->addCell(1200)->addText('Qty.', $boldArial);
    $table->addCell(3000)->addText('Unit Cost (Php)', $boldArial);
    $table->addCell(3000)->addText('SETUP', $boldArial);
    $table->addCell(1500)->addText('Prop.', $boldArial);
    $table->addCell(3000)->addText('Total', $boldArial);

    $grandTotal = 0;

    foreach ($project->items as $item) {
        $total = $item->quantity * $item->item_cost;
        $grandTotal += $total;

        $table->addRow();
        $text = $item->item_name . "\nSpecifications:\n" . ($item->specifications ?? 'N/A');

        $table->addCell(5500)->addText($text, $arialFont);
        $table->addCell(1200)->addText($item->quantity, $arialFont);
        $table->addCell(3000)->addText(number_format($item->item_cost, 2), $arialFont);
        $table->addCell(3000)->addText(number_format($total, 2), $arialFont);
        $table->addCell(1500)->addText('', $arialFont);
        $table->addCell(3000)->addText(number_format($total, 2), $arialFont);
    }

    $table->addRow();
    $table->addCell(9700, ['gridSpan' => 3])->addText('TOTAL', $boldArial);
    $table->addCell(3000)->addText(number_format($grandTotal, 2), $boldArial);
    $table->addCell(1500)->addText('');
    $table->addCell(3000)->addText(number_format($grandTotal, 2), $boldArial);

    $templateProcessor->setComplexBlock('LIB_TABLE', $table);

    // File paths
    $timestamp = now()->timestamp;
    $outputFolder = storage_path('app/generated');
    if (!file_exists($outputFolder)) mkdir($outputFolder, 0777, true);

    $tempDir = storage_path('app/temp');
    if (!file_exists($tempDir)) {
        mkdir($tempDir, 0777, true);
    }

    $docxPath = $tempDir . "/moa_" . time() . ".docx";
    $pdfPath = str_replace('.docx', '.pdf', $docxPath);

    // Save the filled DOCX
    $templateProcessor->saveAs($docxPath);

    // Convert DOCX to PDF using LibreOffice CLI
    $process = new Process([
        'C:\Program Files\LibreOffice\program\soffice.exe', // or 'libreoffice' depending on your install
        '--headless',
        '--convert-to', 'pdf',
        '--outdir', dirname($docxPath),
        $docxPath
    ]);

    $process->run();

    if (!$process->isSuccessful() || !file_exists($pdfPath)) {
        return response()->json(['error' => 'Failed to convert DOCX to PDF'], 500);
    }

    // Stream the PDF to browser
    return response()->file($pdfPath, [
        'Content-Type' => 'application/pdf',
        'Content-Disposition' => 'inline; filename="moa.pdf"',
    ])->deleteFileAfterSend(true); // optional cleanup
}
}