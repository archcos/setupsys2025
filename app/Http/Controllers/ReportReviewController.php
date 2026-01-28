<?php

namespace App\Http\Controllers;

use App\Models\ReportModel;
use App\Models\UserModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ReportReviewController extends Controller
{
    public function index(Request $request)
    {
        $userId = Auth::id();
        $user = UserModel::where('user_id', $userId)->firstOrFail();

        $search = $request->input('search');
        $perPage = $request->input('perPage', 10);

        $query = ReportModel::with([
            'project.company:company_id,company_name,office_id,added_by'
        ])
            ->select('report_id', 'project_id', 'created_at', 'file_path', 'status');

        // Role-based filtering
        if ($user->role === 'staff') {
            // Staff sees all submitted reports
            $query->where('status', 'submitted');
        } elseif ($user->role === 'rpmo') {
            // RPMO sees all recommended reports
            $query->where('status', 'like', 'recommended%');
        }

        // Search functionality
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('project', function ($q) use ($search) {
                    $q->where('project_title', 'like', "%{$search}%");
                })
                    ->orWhereHas('project.company', function ($q) use ($search) {
                        $q->where('company_name', 'like', "%{$search}%");
                    });
            });
        }

        $reports = $query->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Reports/Review', [
            'reports' => $reports,
            'filters' => $request->only('search', 'perPage'),
        ]);
    }

    public function recommend($reportId)
    {
        $report = ReportModel::findOrFail($reportId);

        if (Auth::user()->role !== 'staff') {
            abort(403);
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