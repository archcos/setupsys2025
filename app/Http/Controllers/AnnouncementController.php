<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\AnnouncementModel; // ✅ Use the correct model

class AnnouncementController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $announcements = AnnouncementModel::with('office')
            ->when($user->role === 'staff', function ($query) use ($user) {
                // ✅ Filter by the logged-in user's office
                $query->where('office_id', $user->office_id);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Announcement/Index', [
            'announcements' => $announcements,
            'userRole' => $user->role, // ✅ pass user role
        ]);
    }

    public function create()
    {
        // Get the authenticated user
        $user = Auth::user();

        return Inertia::render('Announcement/Create', [
            'office_id' => $user->office_id ?? null, //  Get office_id safely
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:150',
            'details' => 'required|string|max:500', // ✅ Match with DB column name (details not body)
            'office_id' => 'required|exists:tbl_offices,office_id',
        ]);

        AnnouncementModel::create([
            'title' => $request->title,
            'details' => $request->details, // ✅ Match your migration column
            'office_id' => $request->office_id,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
        ]);

        return redirect()->route('announcements.index')
            ->with('success', 'Announcement created successfully!');
    }

     /**
     * Show the form for editing the specified announcement.
     */
    public function edit($id)
    {
        $announcement = AnnouncementModel::findOrFail($id);
        return Inertia::render('Announcement/Edit', [
            'announcement' => $announcement,
        ]);
    }

    /**
     * Update the specified announcement in storage.
     */
    public function update(Request $request, $id)
    {
        $announcement = AnnouncementModel::findOrFail($id);

        $validated = $request->validate([
            'title'      => 'required|string|max:150',
            'details'    => 'required|string|max:500',
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date|after_or_equal:start_date',
        ]);

        $announcement->update($validated);

        return redirect()->route('announcements.index')
            ->with('success', 'Announcement updated successfully!');
    }

    /**
     * Remove the specified announcement from storage.
     */
    public function destroy($id)
    {
        $announcement = AnnouncementModel::findOrFail($id);
        $announcement->delete();

        return redirect()->route('announcements.index')
            ->with('success', 'Announcement deleted successfully!');
    }

}
