<?php

namespace App\Http\Controllers;

use App\Models\AnnouncementModel;
use App\Models\OfficeModel;
use Inertia\Inertia;

class PageController extends Controller
{
    public function contact() {
        return Inertia::render('Contact');
    }

    public function about() {
        return Inertia::render('About');
    }

    public function help() {
        return Inertia::render('Help');
    }

public function announcements()
{
    $announcements = AnnouncementModel::with('office')
        ->whereDate('start_date', '<=', now())
        ->whereDate('end_date', '>=', now())
        ->orderBy('start_date', 'desc')
        ->get();

    $oldAnnouncements = AnnouncementModel::with('office')
        ->whereDate('end_date', '<', now())
        ->orderBy('end_date', 'desc')
        ->get();

    $offices = OfficeModel::orderBy('office_name')
        ->get(['office_id', 'office_name']);

    return inertia('Announcements', [
        'announcements' => $announcements,
        'old_announcements' => $oldAnnouncements,
        'offices' => $offices,
    ]);
}


}
