<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MOAModel;
use App\Models\ProjectModel;
use App\Models\CompanyModel;
use App\Models\UserModel;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\SimpleType\Jc;
use PhpOffice\PhpWord\TemplateProcessor;
use Symfony\Component\Process\Process;

class MOAController extends Controller
{

public function index(Request $request)
{
    $search = $request->input('search');
    $perPage = $request->input('perPage', 10);
    $sortBy = $request->input('sortBy', 'created_at');
    $sortOrder = $request->input('sortOrder', 'desc');
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
    } elseif ($user && $user->role !== 'rpmo') {
        $query->whereRaw('0 = 1');
    }

    // Apply sorting
    if ($sortBy === 'project_cost') {
        // Join with tbl_projects to sort by project_cost
        $query->join('tbl_projects', 'tbl_moa.project_id', '=', 'tbl_projects.project_id')
              ->orderBy('tbl_projects.project_cost', $sortOrder)
              ->select('tbl_moa.*'); // Select only MOA columns to avoid conflicts
    } else {
        // Sort by MOA table columns (like created_at)
        $query->orderBy('tbl_moa.' . $sortBy, $sortOrder);
    }

    $moas = $query->paginate($perPage)->appends($request->only('search', 'perPage', 'sortBy', 'sortOrder'));

    return inertia('MOA/Index', [
        'moas' => $moas,
        'filters' => $request->only('search', 'perPage', 'sortBy', 'sortOrder'),
    ]);
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

    // ✅ Group into phase strings
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

        // ✅ This will now correctly use your $phaseTwo string (Refund Start - Refund End)
        $activitiesTable->addCell(4000)->addText($phaseTwo, $arialFont, ['alignment' => Jc::CENTER]);

        // Insert into template
        $templateProcessor->setComplexBlock('ACTIVITY_TABLE', $activitiesTable);


        $start = Carbon::parse($project->refund_initial)->startOfYear(); // ✅ force to January of that year
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

}