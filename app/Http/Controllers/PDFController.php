<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\CompanyModel;
use App\Models\ProjectModel;
use App\Models\DirectorModel;
use App\Models\MOAModel;
use App\Models\NotificationModel;
use App\Models\OfficeModel;
use App\Models\UserModel;
use PhpOffice\PhpWord\TemplateProcessor;
use \NumberFormatter;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\SimpleType\Jc; // for alignment constants

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

        $project = ProjectModel::with(['company', 'activities', 'items'])->findOrFail($request->project_id);
        $company = $project->company;

        $office = OfficeModel::find($company->office_id);

        $templatePath = storage_path('app/templates/template.docx');
        $templateProcessor = new TemplateProcessor($templatePath);

        $templateProcessor->setImageValue('image', [
            'path' => 'templates/signature.png', // path to your image
            'width' => 130,
            'height' => 80,
            'ratio' => true, // maintain image proportions
        ]);

        $costInWords = (new NumberFormatter('en', NumberFormatter::SPELLOUT))->format($project->project_cost);
        $costInWords = ucwords($costInWords); // Capitalize first letter of each word

        $templateProcessor->setValue('amount', $costInWords);


        $inputName = trim($request->input('owner_name'));
        $inputPosition = trim($request->input('owner_position'));

        $fownerName = !empty($inputName) ? $inputName : $company->owner_name;
        $ownerPosition = !empty($inputPosition) ? $inputPosition : 'Owner';

        $templateProcessor->setValue('OWNER_NAME', $fownerName);
        $templateProcessor->setValue('position', $ownerPosition);

        $witness = $request->input('witness');
        $templateProcessor->setValue('witness', $witness);

        $templateProcessor->setValue('COMPANY_NAME', $company->company_name);
        $templateProcessor->setValue('COMPANY_LOCATION', $company->company_location);
        $templateProcessor->setValue('office_name', $office->office_name ?? 'N/A');
        $templateProcessor->setValue('PROJECT_TITLE', $project->project_title);
        $templateProcessor->setValue('phase_one', $project->phase_one);
        $templateProcessor->setValue('phase_two', $project->phase_two);
        $templateProcessor->setValue('project_cost', number_format($project->project_cost, 2));


        $director = DirectorModel::where('office_id', $company->office_id)->first();

        $pdName = 'N/A';
        $pdTitle = 'N/A';

        if ($director) {
            $middleInitial = $director->middle_name ? strtoupper(substr($director->middle_name, 0, 1)) . '.' : '';
            $pdName = "{$director->first_name} {$middleInitial} {$director->last_name}";
            $pdTitle = $director->title ?? 'N/A';
        }
        
        $templateProcessor->setValue('pd_name', $pdName);
        $templateProcessor->setValue('pd_title', $pdTitle);

        
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


        // Optional: Activities as string
        $activityList = $project->activities->map(fn($a) => $a->activity_name)->implode(', ');
        $templateProcessor->setValue('ACTIVITIES', $activityList);

        MOAModel::updateOrCreate(
            ['project_id' => $project->project_id],
            [
                'office_id' => $company->office_id,
                'owner_name' => $fownerName,
                'owner_position' => $ownerPosition,
                'witness' => $witness,
                'pd_name' => $pdName,
                'pd_title' => $pdTitle,
                'amount_words' => $costInWords,
                'project_cost' => $project->project_cost,
            ]
        );

        $officeUsers = UserModel::where('office_id', $company->office_id)
            ->where('role', '!=', 'user')
            ->get();

        foreach ($officeUsers as $user) {
                NotificationController::createNotificationAndEmail([
                'title' => 'MOA Generated',
                'message' => "A MOA has been generated for the: <br>Project: {$project->project_title} <br>Company: {$company->company_name}",
                'office_id' => $company->office_id,
                'company_id' => $company->company_id, 
            ]);
        }

        $project->progress = 'Draft MOA';
        $project->save();


        return redirect()->route('moa.index')->with('success', 'MOA document generated successfully.');


        // $fileName = now()->timestamp . '_MOA.docx';
        // $outputPath = storage_path("app/generated/$fileName");

        // $templateProcessor->saveAs($outputPath);
        // return response()->download($outputPath)->deleteFileAfterSend(true);
    }
}
