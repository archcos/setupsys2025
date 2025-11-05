<?php

namespace App\Http\Controllers;

use App\Models\FrequencyModel;
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
        $selectedYear = $request->input('year', Carbon::now()->year);

        // Determine date range based on filter
        $dateRange = $this->getDateRange($filter, $selectedYear);

        // Query with date range and office filter
        $query = FrequencyModel::with(['user', 'office'])
            ->whereBetween('login_date', [$dateRange['start'], $dateRange['end']])
            ->when($selectedOffice !== 'all', function($q) use ($selectedOffice) {
                $q->where('office_id', $selectedOffice);
            })
            ->orderBy('login_date', 'desc');

        $records = $query->get();

        // Get all offices for dropdown
        $offices = OfficeModel::select('office_id', 'office_name')
            ->orderBy('office_name')
            ->get();

        // Get available years from data
        $availableYears = FrequencyModel::selectRaw('DISTINCT YEAR(login_date) as year')
            ->orderBy('year', 'desc')
            ->pluck('year')
            ->toArray();

        // If no data, at least show current year
        if (empty($availableYears)) {
            $availableYears = [Carbon::now()->year];
        }

        // Create time-based chart data (Bar Chart)
        $chartData = [];
        if ($records->count() > 0) {
            switch ($filter) {
                    case 'weekly':
                        // Group by day of week (Y-m-d ensures correct chronological order)
                        $grouped = $records->groupBy(function ($item) {
                            return Carbon::parse($item->login_date)->format('Y-m-d');
                        });

                        // Sort keys by ascending date (oldest first)
                        $sorted = $grouped->sortKeys();

                        foreach ($sorted as $date => $group) {
                            $chartData[] = [
                                'date' => Carbon::parse($date)->format('D, M d'),
                                'count' => (int) $group->sum('login_count'),
                            ];
                        }
                        break;


                case 'monthly':
                    // Group by month for the selected year
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
                    // Group by year - show all years
                    $grouped = $records->groupBy(function ($item) {
                        return Carbon::parse($item->login_date)->format('Y');
                    });

                    // Sort by year ascending (oldest first)
                    $sorted = $grouped->sortKeys();

                    foreach ($sorted as $year => $group) {
                        $chartData[] = [
                            'date' => $year,
                            'count' => (int) $group->sum('login_count'),
                        ];
                    }
                    break;


                default: // daily
                    // Show today's data
                    $chartData[] = [
                        'date' => Carbon::parse($dateRange['start'])->format('M d, Y'),
                        'count' => (int) $records->sum('login_count'),
                    ];
                    break;
            }
        }

        // Create office distribution data (Pie Chart) - filtered by date range
        $officeChartData = [];
        
        $officeGrouped = $records->groupBy('office_id');
        
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
            'year' => $selectedYear,
            'date_range' => [
                'start' => $dateRange['start']->format('Y-m-d'),
                'end' => $dateRange['end']->format('Y-m-d'),
            ],
            'selected_office' => $selectedOffice,
        ]);

        return Inertia::render('Admin/LoginFrequency', [
            'records' => $records->toArray(),
            'chartData' => $chartData,
            'officeChartData' => $officeChartData,
            'offices' => $offices->toArray(),
            'availableYears' => $availableYears,
            'filter' => $filter,
            'selectedOffice' => $selectedOffice,
            'selectedYear' => (int) $selectedYear,
            'dateRange' => [
                'start' => $dateRange['start']->format('M d, Y'),
                'end' => $dateRange['end']->format('M d, Y'),
            ],
        ]);
    }

    /**
     * Get date range based on filter type and year
     */
    private function getDateRange($filter, $year)
    {
        $now = Carbon::now();
        $selectedYear = Carbon::createFromDate($year, 1, 1);
        
        switch ($filter) {
            case 'daily':
                return [
                    'start' => $now->copy()->startOfDay(),
                    'end' => $now->copy()->endOfDay(),
                ];
                
            case 'weekly':
                return [
                    'start' => $now->copy()->startOfWeek(Carbon::MONDAY),
                    'end' => $now->copy()->endOfWeek(Carbon::SUNDAY),
                ];
                
            case 'monthly':
                // Show all months in the selected year
                return [
                    'start' => $selectedYear->copy()->startOfYear(),
                    'end' => $selectedYear->copy()->endOfYear(),
                ];
                
            case 'yearly':
                // Show all years from earliest to latest
                return [
                    'start' => Carbon::createFromDate(2000, 1, 1), // Or use earliest record
                    'end' => Carbon::now()->endOfYear(),
                ];
                
            default:
                return [
                    'start' => $now->copy()->startOfDay(),
                    'end' => $now->copy()->endOfDay(),
                ];
        }
    }

    public function download(Request $request)
    {
        $filter = $request->input('filter', 'daily');
        $selectedOffice = $request->input('office', 'all');
        $selectedYear = $request->input('year', Carbon::now()->year);

        $filename = 'login_frequency_' . $filter . '_' . now()->format('Y-m-d_H-i-s') . '.csv';

        // Apply same filters as the view
        $dateRange = $this->getDateRange($filter, $selectedYear);

        $response = new StreamedResponse(function () use ($dateRange, $selectedOffice) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['User', 'Office', 'Date', 'Login Count']);

            $records = FrequencyModel::with(['user', 'office'])
                ->whereBetween('login_date', [$dateRange['start'], $dateRange['end']])
                ->when($selectedOffice !== 'all', function($q) use ($selectedOffice) {
                    $q->where('office_id', $selectedOffice);
                })
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