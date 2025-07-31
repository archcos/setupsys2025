<?php

namespace App\Http\Controllers;

use App\Models\RefundModel;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class RefundController extends Controller
{
   public function index(Request $request)
{
    $selectedMonth = $request->input('month') ?? Carbon::now()->format('M , Y');
    $selectedStatus = $request->input('status') ?? 'all';
    $perPage = $request->input('perPage', 10); // default 10
    $search = $request->input('search', '');

    $query = RefundModel::query()->where('refund_date', $selectedMonth);

    if ($selectedStatus !== 'all') {
        $query->where('status', $selectedStatus);
    }

    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->where('project_code', 'like', "%$search%")
              ->orWhere('company_name', 'like', "%$search%");
        });
    }

    $refunds = $query->orderBy('project_code')->paginate($perPage)->withQueryString();
    $months = RefundModel::distinct()->pluck('refund_date');

    return Inertia::render('Refunds/Index', [
        'refunds' => $refunds,
        'months' => $months,
        'selectedMonth' => $selectedMonth,
        'selectedStatus' => $selectedStatus,
        'perPage' => (int) $perPage,
        'search' => $search,
    ]);
}


public function manualSync()
{
    $csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTsjw8nNLTrJYI2fp0ZrKbXQvqHpiGLqpgYk82unky4g_WNf8xCcISaigp8VsllxE2dCwl-aY3wjd1W/pub?gid=1408398601&single=true&output=csv';

    try {
        $response = Http::timeout(300)->get($csvUrl);
        if (!$response->ok()) {
            Log::error('Failed to fetch CSV: ' . $response->status());
            return back()->with('error', 'Failed to fetch CSV data.');
        }

        $lines = explode("\n", trim($response->body()));
        if (count($lines) < 2) {
            Log::warning('CSV contains no data rows.');
            return back()->with('error', 'CSV contains no data.');
        }

        $header = str_getcsv(array_shift($lines));
        $csvData = array_map('str_getcsv', $lines);
        $newRecords = 0;

        Log::debug('CSV Headers: ' . json_encode($header));
        Log::debug('Sample row 0: ' . json_encode($csvData[0] ?? []));

        foreach ($csvData as $rowIndex => $row) {
            $row = array_map('trim', $row);
            $row = array_pad($row, count($header), null);
            $data = array_combine($header, $row);

            $project_code = trim($data['Project Code'] ?? '');
            $company_name = trim($data['Name of the Business'] ?? '');
            $status = strtoupper($data['Status'] ?? '');

            if (!$project_code || !$company_name) {
                Log::warning("Skipping row $rowIndex: Missing Project Code or Business Name");
                continue;
            }

            if (in_array($status, ['TERMINATED', 'WITHDRAWN', 'GRADUATED'])) {
                Log::info("Skipping row $rowIndex ($project_code): Status is $status");
                continue;
            }

            Log::info("Processing row $rowIndex: $project_code - $company_name");

            foreach ($header as $i => $columnName) {
                if (preg_match('/^Refund\s*#\d+/i', $columnName)) {
                    $refund_date = trim($row[$i] ?? '');

                    if ($refund_date) {
                        $exists = RefundModel::where('project_code', $project_code)
                            ->where('refund_date', $refund_date)
                            ->exists();

                        if (!$exists) {
                            RefundModel::create([
                                'project_code' => $project_code,
                                'company_name' => $company_name,
                                'refund_date' => $refund_date,
                                'status' => 'unpaid',
                            ]);
                            Log::info("Inserted refund: $project_code | $refund_date");
                            $newRecords++;
                        } else {
                            Log::info("Skipped duplicate: $project_code | $refund_date");
                        }
                    } else {
                        Log::debug("Empty refund date at row $rowIndex for $columnName");
                    }
                }
            }
        }

        Log::info("Sync complete. Total new records: $newRecords");
        return back()->with('success', "$newRecords new refund(s) added.");
    } catch (\Exception $e) {
        Log::error('CSV Sync failed: ' . $e->getMessage());
        return back()->with('error', 'Sync failed. Please try again.');
    }
}



public function updateStatus(Request $request, $id)
{
    try {
        if ($id != 0) {
            // Update by ID
            $refund = RefundModel::findOrFail($id);
        } else {
            // Check if record exists by unique fields
            $refund = RefundModel::where('project_code', $request->input('project_code'))
                ->where('company_name', $request->input('company_name'))
                ->where('refund_date', $request->input('refund_date'))
                ->first();

            if (!$refund) {
                // If not found, create new
                $refund = new RefundModel();
                $refund->project_code = $request->input('project_code');
                $refund->company_name = $request->input('company_name');
                $refund->refund_date = $request->input('refund_date');
            }
        }

        $refund->status = $request->input('status', 'unpaid');
        $refund->save();

        return back()->with('success', 'Status updated successfully.');
    } catch (\Exception $e) {
        return back()->with('error', 'Failed to update status: ' . $e->getMessage());
    }
}

}
