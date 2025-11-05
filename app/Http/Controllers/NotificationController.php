<?php

namespace App\Http\Controllers;

use App\Mail\NotificationCreatedMail;
use App\Models\CompanyModel;
use App\Models\NotificationModel;
use App\Models\UserModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // For regular company users — only notifications related to their companies
        if ($user->role === 'user') {
            $companyIds = CompanyModel::where('added_by', $user->user_id)->pluck('company_id');

            $notifications = NotificationModel::whereIn('company_id', $companyIds)
                ->orderBy('created_at', 'desc')
                ->get();
        } 
        // For staff — notifications within their assigned office
        elseif ($user->role === 'staff') {
            $notifications = NotificationModel::where('office_id', $user->office_id)
                ->orderBy('created_at', 'desc')
                ->get();
        } 
        // For admin — show all notifications
        else {
            $notifications = NotificationModel::orderBy('created_at', 'desc')->get();
        }

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

        // Sanitize inputs
        $validated['title'] = e($validated['title']);
        $validated['message'] = e($validated['message']);

        $notification = NotificationModel::create($validated);

        // Notify all staff/admin in the target office
        $recipients = UserModel::where('office_id', $validated['office_id'])->get();

        foreach ($recipients as $user) {
            // Skip company users
            if ($user->role === 'user') {
                Log::info("Skipped sending email to {$user->email} (role: user)");
                continue;
            }

            try {
                Mail::to($user->email)->send(new NotificationCreatedMail($validated));
                Log::info("Notification email sent to {$user->email}");
            } catch (\Exception $e) {
                Log::error("Failed to send notification email to {$user->email}: " . $e->getMessage());
            }
        }

        return back()->with('success', 'Notification sent (check logs for email delivery).');
    }

    /**
     * Create a notification record and email recipients.
     * Can be reused by other controllers (e.g., ActivityController).
     */
    public static function createNotificationAndEmail(array $data)
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
                Log::error("Failed to send notification email to {$user->email}: " . $e->getMessage());
            }
        }

        return $notification;
    }

    public function markAsRead($id)
    {
        $notification = NotificationModel::find($id);

        if ($notification) {
            $notification->is_read = true;
            $notification->save();
        }

        return back()->with('success', 'Notification marked as read.');
    }
}
