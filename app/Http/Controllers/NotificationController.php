<?php

namespace App\Http\Controllers;

use App\Models\CompanyModel;
use App\Models\NotificationModel;
use App\Models\UserModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        return back()->with('success', 'Notification created successfully.');
    }

     public function checkUnread()
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['hasUnread' => false], 401);
        }

        $hasUnread = false;

        // For regular company users — only notifications related to their companies
        if ($user->role === 'user') {
            $companyIds = CompanyModel::where('added_by', $user->user_id)->pluck('company_id');

            $hasUnread = NotificationModel::whereIn('company_id', $companyIds)
                ->where('is_read', false)
                ->exists();
        } 
        // For staff — notifications within their assigned office
        elseif ($user->role === 'staff') {
            $hasUnread = NotificationModel::where('office_id', $user->office_id)
                ->where('is_read', false)
                ->exists();
        } 
        // For admin/head — check all notifications
        else {
            $hasUnread = NotificationModel::where('is_read', false)->exists();
        }

        return response()->json(['hasUnread' => $hasUnread]);
    }

    /**
     * Create a notification record in the database.
     * Can be reused by other controllers (e.g., ActivityController).
     */
    public static function createNotification(array $data)
    {
        $notification = NotificationModel::create($data);
        
        Log::info("Notification created: {$data['title']} for office {$data['office_id']}");

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