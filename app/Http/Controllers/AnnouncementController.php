<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\AnnouncementModel;
use App\Models\OfficeModel;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = AnnouncementModel::with(['office', 'addedBy']);

        // Filter by office for staff
        if ($user->role === 'staff') {
            $query->where('office_id', $user->office_id);
        }

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('details', 'like', "%{$search}%")
                  ->orWhereHas('addedBy', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Office filter
        if ($request->filled('officeFilter')) {
            $query->where('office_id', $request->officeFilter);
        }

        // Status filter (active, expired, upcoming)
        if ($request->filled('statusFilter') && $request->statusFilter !== 'all') {
            $today = now()->startOfDay();
            
            switch ($request->statusFilter) {
                case 'active':
                    $query->where(function ($q) use ($today) {
                        $q->where(function ($q) use ($today) {
                            $q->whereNull('start_date')->orWhere('start_date', '<=', $today);
                        })
                        ->where(function ($q) use ($today) {
                            $q->whereNull('end_date')->orWhere('end_date', '>=', $today);
                        });
                    });
                    break;
                case 'expired':
                    $query->where('end_date', '<', $today);
                    break;
                case 'upcoming':
                    $query->where('start_date', '>', $today);
                    break;
            }
        }

        // Sorting
        $sortBy = $request->sortBy ?? 'created_at';
        $sortOrder = $request->sortOrder ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = (int)($request->perPage ?? 10);
        $announcements = $query->paginate($perPage);

        // Get status counts
        $baseQuery = AnnouncementModel::with(['office', 'addedBy']);
        if ($user->role === 'staff') {
            $baseQuery->where('office_id', $user->office_id);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $baseQuery->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('details', 'like', "%{$search}%")
                  ->orWhereHas('addedBy', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        }
        if ($request->filled('officeFilter')) {
            $baseQuery->where('office_id', $request->officeFilter);
        }

        $today = now()->startOfDay();

        $allCount = $baseQuery->count();
        $activeCount = (clone $baseQuery)
            ->where(function ($q) use ($today) {
                $q->where(function ($q) use ($today) {
                    $q->whereNull('start_date')->orWhere('start_date', '<=', $today);
                })
                ->where(function ($q) use ($today) {
                    $q->whereNull('end_date')->orWhere('end_date', '>=', $today);
                });
            })
            ->count();

        $expiredCount = (clone $baseQuery)->where('end_date', '<', $today)->count();
        $upcomingCount = (clone $baseQuery)->where('start_date', '>', $today)->count();

        $statusCounts = [
            'all' => $allCount,
            'active' => $activeCount,
            'expired' => $expiredCount,
            'upcoming' => $upcomingCount,
        ];

        // Get all offices for filter dropdown
        $offices = OfficeModel::all();

        return Inertia::render('Announcement/Index', [
            'announcements' => $announcements,
            'filters' => [
                'search' => $request->search ?? '',
                'officeFilter' => $request->officeFilter ?? '',
                'sortBy' => $sortBy,
                'sortOrder' => $sortOrder,
                'statusFilter' => $request->statusFilter ?? 'all',
                'perPage' => $perPage,
            ],
            'statusCounts' => $statusCounts,
            'offices' => $offices,
            'userRole' => $user->role,
            'userId' => $user->user_id,
        ]);
    }

    public function create()
    {
        $user = Auth::user();

        return Inertia::render('Announcement/Create', [
            'office_id' => $user->office_id ?? null,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:150',
            'details' => 'required|string|max:500',
            'office_id' => 'required|exists:tbl_offices,office_id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        AnnouncementModel::create([
            'title' => $request->title,
            'details' => $request->details,
            'office_id' => $request->office_id,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'added_by' => Auth::id(),
        ]);

        return redirect()->route('announcements.index')
            ->with('success', 'Announcement created successfully!');
    }

    /**
     * Show the form for editing the specified announcement.
     */
    public function edit($id)
    {
        $user = Auth::user();
        $announcement = AnnouncementModel::with('addedBy')->findOrFail($id);

        // Check authorization: only the person who added it or rpmo can edit
        if ($announcement->added_by !== $user->user_id && $user->role !== 'rpmo') {
            abort(403, 'You are not authorized to edit this announcement.');
        }

        return Inertia::render('Announcement/Edit', [
            'announcement' => $announcement,
        ]);
    }

    /**
     * Update the specified announcement in storage.
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $announcement = AnnouncementModel::findOrFail($id);

        // Check authorization: only the person who added it or rpmo can edit
        if ($announcement->added_by !== $user->user_id && $user->role !== 'rpmo') {
            abort(403, 'You are not authorized to edit this announcement.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'details' => 'required|string|max:500',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        // Update added_by to current user if they're editing
        $validated['added_by'] = Auth::id();

        $announcement->update($validated);

        return redirect()->route('announcements.index')
            ->with('success', 'Announcement updated successfully!');
    }

    /**
     * Remove the specified announcement from storage.
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $announcement = AnnouncementModel::findOrFail($id);

        // Check authorization: only the person who added it or rpmo can delete
        if ($announcement->added_by !== $user->user_id && $user->role !== 'rpmo') {
            abort(403, 'You are not authorized to delete this announcement.');
        }

        $announcement->delete();

        return redirect()->route('announcements.index')
            ->with('success', 'Announcement deleted successfully!');
    }
}