<?php

namespace App\Http\Controllers;

use App\Models\LogModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;

class LogController extends Controller
{
    /**
     * Display the list of logs with filters.
     */
    public function index(Request $request)
    {
        try {
            Log::info('LogController.index called');

            // Get filter inputs
            $filters = $request->only(['ip_address', 'user_id', 'project_id', 'action', 'model_type', 'days']);
            $days = $filters['days'] ?? 90;

            // Base query with eager loading
            $query = LogModel::with('user');

            // Apply date filter (default 90 days)
            $startDate = Carbon::now()->subDays($days);
            $query->where('created_at', '>=', $startDate);

            // Apply other filters
            if (!empty($filters['ip_address'])) {
                $query->where('ip_address', 'like', '%' . $filters['ip_address'] . '%');
            }

            if (!empty($filters['user_id'])) {
                $query->where('user_id', 'like', '%' . $filters['user_id'] . '%');
            }

            if (!empty($filters['project_id'])) {
                $query->where('project_id', 'like', '%' . $filters['project_id'] . '%');
            }

            if (!empty($filters['action'])) {
                $query->where('action', '=', $filters['action']);
            }

            if (!empty($filters['model_type'])) {
                $query->where('model_type', '=', $filters['model_type']);
            }

            // Get total count before pagination
            $totalCount = $query->count();

            // Fetch logs, latest first with pagination
            $perPage = $request->get('per_page', 10);
            $page = $request->get('page', 1);
            
            $logs = $query->latest('created_at')
                ->skip(($page - 1) * $perPage)
                ->take($perPage)
                ->get();

            // Fetch distinct actions and model types for filter dropdowns (from recent logs)
            $allActions = LogModel::where('created_at', '>=', $startDate)
                ->distinct()
                ->pluck('action')
                ->sort()
                ->values()
                ->toArray();
            
            $allModelTypes = LogModel::where('created_at', '>=', $startDate)
                ->distinct()
                ->pluck('model_type')
                ->sort()
                ->values()
                ->toArray();

            Log::info('Logs retrieved', [
                'count' => count($logs),
                'total_count' => $totalCount,
                'actions' => count($allActions),
                'models' => count($allModelTypes),
                'days' => $days
            ]);

            return Inertia::render('Admin/LogManagement', [
                'logs' => $logs,
                'filters' => (object) $filters,
                'actions' => $allActions,
                'modelTypes' => $allModelTypes,
                'pagination' => [
                    'total' => $totalCount,
                    'per_page' => $perPage,
                    'current_page' => $page,
                    'last_page' => ceil($totalCount / $perPage)
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('LogController.index error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return Inertia::render('Admin/LogManagement', [
                'logs' => [],
                'filters' => (object) [],
                'actions' => [],
                'modelTypes' => [],
                'pagination' => [],
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Export logs to CSV based on filters.
     */
    public function export(Request $request)
    {
        try {
            Log::info('LogController.export called', $request->all());

            // Get filter inputs from query string
            $ipAddress = $request->query('ip_address');
            $userId = $request->query('user_id');
            $projectId = $request->query('project_id');
            $action = $request->query('action');
            $modelType = $request->query('model_type');
            $days = $request->query('days', 90);

            // Base query with eager loading
            $query = LogModel::with('user');

            // Apply date filter if days is specified
            if (!empty($days)) {
                $startDate = Carbon::now()->subDays($days);
                $query->where('created_at', '>=', $startDate);
            }

            // Apply other filters only if they are not empty
            if (!empty($ipAddress)) {
                $query->where('ip_address', 'like', '%' . $ipAddress . '%');
            }

            if (!empty($userId)) {
                $query->where('user_id', 'like', '%' . $userId . '%');
            }

            if (!empty($projectId)) {
                $query->where('project_id', 'like', '%' . $projectId . '%');
            }

            if (!empty($action)) {
                $query->where('action', '=', $action);
            }

            if (!empty($modelType)) {
                $query->where('model_type', '=', $modelType);
            }

            // Get all logs (no pagination for export)
            $logs = $query->latest('created_at')->get();

            Log::info('Export query results', [
                'count' => count($logs),
                'ip_address' => $ipAddress,
                'user_id' => $userId,
                'project_id' => $projectId,
                'action' => $action,
                'model_type' => $modelType,
                'days' => $days
            ]);

            // Prepare data for CSV
            $data = [];
            $data[] = ['ID', 'IP Address', 'User', 'Project', 'Action', 'Model Type', 'Description', 'Created At'];

            foreach ($logs as $log) {
                $data[] = [
                    $log->id,
                    $log->ip_address,
                    $log->user?->name ?? 'System',
                    $log->project_id ?? '-',
                    $log->action,
                    $log->model_type,
                    $log->description,
                    $log->created_at->toDateTimeString()
                ];
            }

            // Create CSV response
            $filename = 'logs_' . now()->format('Y-m-d_H-i-s') . '.csv';
            $handle = fopen('php://memory', 'w');

            foreach ($data as $row) {
                fputcsv($handle, $row);
            }

            rewind($handle);
            $csv = stream_get_contents($handle);
            fclose($handle);

            Log::info('Logs exported successfully', ['count' => count($logs), 'filename' => $filename]);

            return response($csv, 200)
                ->header('Content-Type', 'text/csv; charset=utf-8')
                ->header('Content-Disposition', "attachment; filename=\"$filename\"");

        } catch (\Exception $e) {
            Log::error('LogController.export error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response('Error exporting logs: ' . $e->getMessage(), 500);
        }
    }
}