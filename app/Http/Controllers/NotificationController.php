<?php

namespace App\Http\Controllers;

use App\Models\NotificationModel;
use App\Models\UserModel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index()
    {
        $userId = session('user_id');
        $user = UserModel::findOrFail($userId);

        if ($user->role === 'user') {
            abort(403, 'Users are not allowed to view notifications.');
        }

        $notifications = NotificationModel::where('office_id', $user->office_id)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }

    public function store(Request $request)
{
    $validated = $request->validate([
        'title' => 'required|string|max:255',
        'message' => 'required|string',
        'office_id' => 'required|exists:tbl_offices,office_id',
        'company_id' => 'required|exists:tbl_companies,company_id', // ✅ Added validation
    ]);

    NotificationModel::create($validated);

    return back()->with('success', 'Notification sent.');
}

    public function markAsRead($id)
        {
            $notif = NotificationModel::find($id);
            if ($notif) {
                $notif->is_read = true;
                $notif->save();
            }

            return response()->json(['status' => 'success']);
        }
}

