<?php

namespace App\Http\Controllers;

use App\Models\FrequencyModel;
use App\Models\Office;
use App\Models\OfficeModel;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Carbon\Carbon;

class FrequencyController extends Controller
{
    public function index(Request $request)
    {
        $filter = $request->input('filter', 'daily');
        $selectedOffice = $request->input('office', 'all');

        // ✅ Query with office filter only
        $query = FrequencyModel::with(['user', 'office'])
            ->when($selectedOffice !== 'all', function($q) use ($selectedOffice) {
                $q->where('office_id', $selectedOffice);
            })
            ->orderBy('login_date', 'desc');

        $records = $query->get();

        // Get all offices for dropdown
        $offices = OfficeModel::select('office_id', 'office_name')
            ->orderBy('office_name')
            ->get();

        // ✅ Create time-based chart data (Bar Chart)
        $chartData = [];
        if ($records->count() > 0) {
            switch ($filter) {
                case 'monthly':
                    $grouped = $records->groupBy(function ($item) {
                        return Carbon::parse($item->login_date)->format('Y-m');
                    });
                    
                    foreach ($grouped as $month => $group) {
                        $chartData[] = [
                            'date' => Carbon::createFromFormat('Y-m', $month)->format('M Y'),
                            'count' => (int) $group->sum('login_count'),
                        ];
                    }
                    break;

                case 'yearly':
                    $grouped = $records->groupBy(function ($item) {
                        return Carbon::parse($item->login_date)->format('Y');
                    });
                    
                    foreach ($grouped as $year => $group) {
                        $chartData[] = [
                            'date' => $year,
                            'count' => (int) $group->sum('login_count'),
                        ];
                    }
                    break;

                default: // daily
                    $grouped = $records->groupBy('login_date');
                    
                    foreach ($grouped as $date => $group) {
                        $chartData[] = [
                            'date' => Carbon::parse($date)->format('M d, Y'),
                            'count' => (int) $group->sum('login_count'),
                        ];
                    }
                    break;
            }
        }

        // ✅ Create office distribution data (Pie Chart)
        $officeChartData = [];
        
        // Get all records (ignore time filter for office distribution)
        $allRecords = FrequencyModel::with('office')
            ->when($selectedOffice !== 'all', function($q) use ($selectedOffice) {
                $q->where('office_id', $selectedOffice);
            })
            ->get();

        $officeGrouped = $allRecords->groupBy('office_id');
        
        foreach ($officeGrouped as $officeId => $group) {
            $officeName = $group->first()->office->office_name ?? 'Unknown Office';
            $officeChartData[] = [
                'name' => $officeName,
                'count' => (int) $group->sum('login_count'),
            ];
        }

        // Sort by count descending
        usort($officeChartData, function($a, $b) {
            return $b['count'] - $a['count'];
        });

        Log::info('Login Frequency Data', [
            'total_records' => $records->count(),
            'chart_data_count' => count($chartData),
            'office_chart_count' => count($officeChartData),
            'filter' => $filter,
            'selected_office' => $selectedOffice,
        ]);

        return Inertia::render('Admin/LoginFrequency', [
            'records' => $records->toArray(),
            'chartData' => $chartData,
            'officeChartData' => $officeChartData,
            'offices' => $offices->toArray(),
            'filter' => $filter,
            'selectedOffice' => $selectedOffice,
        ]);
    }

    public function download()
    {
        $filename = 'login_frequency_' . now()->format('Y-m-d_H-i-s') . '.csv';

        $response = new StreamedResponse(function () {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['User', 'Office', 'Date', 'Login Count']);

            $records = FrequencyModel::with(['user', 'office'])
                ->orderBy('login_date', 'desc')
                ->get();

            foreach ($records as $record) {
                fputcsv($handle, [
                    $record->user->name ?? 'N/A',
                    $record->office->office_name ?? 'N/A',
                    Carbon::parse($record->login_date)->format('Y-m-d'),
                    $record->login_count,
                ]);
            }

            fclose($handle);
        });

        $response->headers->set('Content-Type', 'text/csv; charset=UTF-8');
        $response->headers->set('Content-Disposition', "attachment; filename=\"{$filename}\"");

        return $response;
    }
}