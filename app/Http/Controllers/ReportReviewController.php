<?php

namespace App\Http\Controllers;

use App\Models\ReportModel;
use App\Models\UserModel;
use App\Models\OfficeModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ReportReviewController extends Controller
{
    public function index(Request $request)
    {
        $userId = Auth::id();
        $user = UserModel::where('user_id', $userId)->firstOrFail();

        $search = $request->input('search', '');
        $perPage = (int)($request->input('perPage', 10));
        $statusFilter = $request->input('statusFilter', 'all');
        $officeFilter = $request->input('officeFilter', '');
        $yearFilter = $request->input('yearFilter', '');
        $sortBy = $request->input('sortBy', 'created_at');
        $sortOrder = $request->input('sortOrder', 'desc');

        // Base query with office relationship
        $query = ReportModel::with([
            'project.proponent:proponent_id,company_name,office_id,added_by',
            'project.proponent.office:office_id,office_name'
        ])->select('report_id', 'project_id', 'created_at', 'file_path', 'status');

        // Role-based filtering
        if ($user->role === 'staff') {
            // Staff sees submitted reports for recommend action
            $query->where('status', 'submitted');
            // Staff only sees reports from their office
            if ($user->office_id) {
                $query->whereHas('project.proponent', function ($q) use ($user) {
                    $q->where('office_id', $user->office_id);
                });
            }
        } elseif ($user->role === 'rpmo') {
            // RPMO sees recommended reports for review
            $query->where('status', 'like', 'recommended%');
        }

        // Search functionality (project_id, project_title, company_name)
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('project_id', 'like', "%{$search}%")
                    ->orWhereHas('project', function ($q) use ($search) {
                        $q->where('project_title', 'like', "%{$search}%");
                    })
                    ->orWhereHas('project.proponent', function ($q) use ($search) {
                        $q->where('company_name', 'like', "%{$search}%");
                    });
            });
        }

        // Office filter (RPMO only)
        if (!empty($officeFilter) && $user->role === 'rpmo') {
            $query->whereHas('project.proponent', function ($q) use ($officeFilter) {
                $q->where('office_id', $officeFilter);
            });
        }

        // Year filter
        if (!empty($yearFilter)) {
            $query->whereHas('project', function ($q) use ($yearFilter) {
                $q->where('year_obligated', $yearFilter);
            });
        }

        // Status filter
        if ($statusFilter !== 'all') {
            if ($statusFilter === 'denied') {
                $query->where('status', 'like', 'denied:%');
            } else {
                $query->where('status', $statusFilter);
            }
        }

        // Sorting
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $reports = $query->paginate($perPage)->withQueryString();

        // Calculate status counts for the current user
        $baseQuery = ReportModel::with([
            'project.proponent:proponent_id,company_name,office_id,added_by',
            'project.proponent.office:office_id,office_name'
        ])->select('report_id', 'project_id', 'created_at', 'file_path', 'status');

        if ($user->role === 'staff') {
            $baseQuery->where('status', 'submitted');
            if ($user->office_id) {
                $baseQuery->whereHas('project.proponent', function ($q) use ($user) {
                    $q->where('office_id', $user->office_id);
                });
            }
        } elseif ($user->role === 'rpmo') {
            $baseQuery->where('status', 'like', 'recommended%');
        }

        if (!empty($search)) {
            $baseQuery->where(function ($q) use ($search) {
                $q->where('project_id', 'like', "%{$search}%")
                    ->orWhereHas('project', function ($q) use ($search) {
                        $q->where('project_title', 'like', "%{$search}%");
                    })
                    ->orWhereHas('project.proponent', function ($q) use ($search) {
                        $q->where('company_name', 'like', "%{$search}%");
                    });
            });
        }

        if (!empty($officeFilter) && $user->role === 'rpmo') {
            $baseQuery->whereHas('project.proponent', function ($q) use ($officeFilter) {
                $q->where('office_id', $officeFilter);
            });
        }

        if (!empty($yearFilter)) {
            $baseQuery->whereHas('project', function ($q) use ($yearFilter) {
                $q->where('year_obligated', $yearFilter);
            });
        }

        $allCount = (clone $baseQuery)->count();
        $submittedCount = (clone $baseQuery)->where('status', 'submitted')->count();
        $recommendedCount = (clone $baseQuery)->where('status', 'like', 'recommended%')->count();
        $reviewedCount = (clone $baseQuery)->where('status', 'reviewed')->count();
        $deniedCount = (clone $baseQuery)->where('status', 'like', 'denied:%')->count();

        $statusCounts = [
            'all' => $allCount,
            'submitted' => $submittedCount,
            'recommended' => $recommendedCount,
            'reviewed' => $reviewedCount,
            'denied' => $deniedCount,
        ];

        // Get available offices for RPMO
        $offices = [];
        if ($user->role === 'rpmo') {
            $offices = OfficeModel::orderBy('office_name')->get();
        }

        // Get available years
        $availableYears = ReportModel::with(['project'])
            ->whereHas('project', function ($q) {
                $q->whereNotNull('year_obligated');
            })
            ->distinct()
            ->get()
            ->pluck('project.year_obligated')
            ->filter()
            ->unique()
            ->sort()
            ->reverse()
            ->values()
            ->toArray();

        return Inertia::render('Reports/Review', [
            'reports' => $reports,
            'filters' => [
                'search' => $search,
                'statusFilter' => $statusFilter,
                'officeFilter' => $officeFilter,
                'yearFilter' => $yearFilter,
                'sortBy' => $sortBy,
                'sortOrder' => $sortOrder,
                'perPage' => $perPage,
            ],
            'statusCounts' => $statusCounts,
            'offices' => $offices,
            'availableYears' => $availableYears,
        ]);
    }

    public function recommend($reportId)
    {
        $report = ReportModel::findOrFail($reportId);

        if (Auth::user()->role !== 'staff') {
            abort(403);
        }

        if ($report->status !== 'submitted') {
            return redirect()->back()->with('error', 'Can only recommend submitted reports.');
        }

        $report->status = 'recommended';
        $report->save();

        return redirect()->back()->with('success', 'Report recommended successfully.');
    }

    public function reviewed($reportId)
    {
        $report = ReportModel::findOrFail($reportId);

        if (Auth::user()->role !== 'rpmo') {
            abort(403);
        }

        if (!str_starts_with($report->status, 'recommended')) {
            return redirect()->back()->with('error', 'Can only review recommended reports.');
        }

        $report->status = 'reviewed';
        $report->save();

        return redirect()->back()->with('success', 'Report marked as reviewed successfully.');
    }

    public function deny(Request $request, $reportId)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $report = ReportModel::findOrFail($reportId);

        if (!in_array(Auth::user()->role, ['staff', 'rpmo'])) {
            abort(403);
        }

        // Status format: denied: reason text here
        $report->status = 'denied: ' . $validated['reason'];
        $report->save();

        return redirect()->back()->with('success', 'Report denied successfully.');
    }
}