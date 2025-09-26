<?php

namespace App\Http\Controllers;

use App\Mail\NotificationCreatedMail;
use App\Models\CompanyModel;
use App\Models\NotificationModel;
use App\Models\UserModel;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
  public function index()
{
    $userId = session('user_id');
    $user = UserModel::findOrFail($userId);

    if ($user->role === 'user') {
        // Get companies that this user added
        $companyIds = CompanyModel::where('added_by', $userId)->pluck('company_id');

        // Show only notifications tied to those companies
        $notifications = NotificationModel::whereIn('company_id', $companyIds)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }

    // For admins and staff: use your existing office filter
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
        'company_id' => 'required|exists:tbl_companies,company_id',
    ]);

    // Purify user input
    $validated['title'] = e($validated['title']);
    $validated['message'] = e($validated['message']);

    $notification = NotificationModel::create($validated);

    // Send to recipients (unchanged)
    $recipients = UserModel::where('office_id', $validated['office_id'])->get();
    foreach ($recipients as $user) {
        if ($user->role === 'user') {
            Log::info("Skipped sending email to {$user->email} (role: user)");
            continue;
        }

        try {
            Mail::to($user->email)->send(new NotificationCreatedMail($validated));
            Log::info("Notification email sent to {$user->email}");
        } catch (\Exception $e) {
            Log::error("Failed to send notification email to {$user->email}: ".$e->getMessage());
        }
    }

    return back()->with('success', 'Notification sent (check logs for email delivery).');
}



// In NotificationController or a NotificationService class
public static function createNotificationAndEmail($data)
{
    $notification = NotificationModel::create($data);

    $recipients = UserModel::where('office_id', $data['office_id'])->get();
    foreach ($recipients as $user) {
        if ($user->role === 'user') {
            Log::info("Skipped sending email to {$user->email} (role: user)");
            continue;
        }

        try {
            Mail::to($user->email)->send(new NotificationCreatedMail($data));
            Log::info("Notification email sent to {$user->email}");
        } catch (\Exception $e) {
            Log::error("Failed to send notification email to {$user->email}: ".$e->getMessage());
        }
    }

    return $notification;
}



    public function markAsRead($id)
    {
        $notif = NotificationModel::find($id);
        if ($notif) {
            $notif->is_read = true;
            $notif->save();
        }

        return back()->with('success', 'Notification marked as read.');
    }

}

