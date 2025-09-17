<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserModel;
use App\Models\OfficeModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;

class UserManagementController extends Controller
{

public function index(Request $request)
{
    if (Session::get('role') !== 'admin') {
        abort(403, 'Unauthorized');
    }

    $query = UserModel::with('office');

    // ✅ Search
    if ($request->filled('search')) {
        $query->where(function ($q) use ($request) {
            $q->where('first_name', 'like', "%{$request->search}%")
              ->orWhere('last_name', 'like', "%{$request->search}%")
              ->orWhere('username', 'like', "%{$request->search}%");
        });
    }

    // ✅ Role Filter
    if ($request->filled('role')) {
        $query->where('role', $request->role);
    }

    // ✅ Office Filter
    if ($request->filled('office_id')) {
        $query->where('office_id', $request->office_id);
    }

    // ✅ Status Filter
    if ($request->filled('status')) {
        $query->where('status', $request->status);
    }

    $users = $query->paginate(10)->appends($request->all());

    $onlineUserIds = DB::table('sessions')
        ->pluck('user_id')
        ->filter()
        ->unique()
        ->toArray();

    $users->getCollection()->transform(function ($user) use ($onlineUserIds) {
        $user->is_online = in_array($user->user_id, $onlineUserIds);
        return $user;
    });

    // ✅ Calculate global counts (not paginated)
    $totalUsers = UserModel::count();
    $activeUsers = UserModel::where('status', 'active')->count();
    $onlineUsers = UserModel::whereIn('user_id', $onlineUserIds)->count();

    return inertia('Admin/UserManagement', [
        'users' => $users,
        'offices' => OfficeModel::all(),
        'filters' => $request->only(['search', 'role', 'office_id', 'status']),
        'stats' => [
            'total' => $totalUsers,
            'active' => $activeUsers,
            'online' => $onlineUsers,
        ],
    ]);
}

    /**
     * Update user data by admin (password, role, office, status).
     */
    public function update(Request $request, $id)
    {
        if (Session::get('role') !== 'admin') {
            abort(403, 'Unauthorized');
        }

        $request->validate([
            'office_id' => 'required|exists:tbl_offices,office_id',
            'role' => 'required|in:admin,user,staff',
            'status' => 'required|in:active,inactive',
            'password' => 'nullable|string|min:6',
            'admin_password' => 'required|string',
        ]);

        // Get current logged in admin
        $admin = UserModel::find(Session::get('user_id'));

        if (!$admin || !Hash::check($request->admin_password, $admin->password)) {
            return back()->withErrors(['admin_password' => 'Incorrect admin password.']);
        }

        $user = UserModel::findOrFail($id);
        $user->office_id = $request->office_id;
        $user->role = $request->role;
        $user->status = $request->status;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return back()->with('success', 'User updated successfully.');
    }

public function forceLogout(Request $request, $id)
{
    if (Session::get('role') !== 'admin') {
        abort(403, 'Unauthorized');
    }

    $request->validate([
        'admin_password' => 'required|string',
    ]);

    $admin = UserModel::find(Session::get('user_id'));
    if (!$admin || !Hash::check($request->admin_password, $admin->password)) {
        return back()->withErrors(['admin_password' => 'Incorrect admin password.']);
    }

    // Check if user exists
    $user = UserModel::find($id);
    if (! $user) {
        return back()->withErrors(['message' => 'User not found.']);
    }

    // Force logout by deleting all sessions where user_id = $id
    DB::table('sessions')->where('user_id', $user->user_id)->delete();

    return back()->with('success', 'User has been forcibly logged out.');
}


public function deleteUser(Request $request, $id)
{
    if (Session::get('role') !== 'admin') {
        abort(403, 'Unauthorized');
    }

    $request->validate([
        'admin_password' => 'required|string',
    ]);

    $admin = UserModel::find(Session::get('user_id'));
    if (!$admin || !Hash::check($request->admin_password, $admin->password)) {
        return back()->withErrors(['admin_password' => 'Incorrect admin password.']);
    }

    // Delete user and their session
    DB::table('sessions')->where('user_id', $id)->delete();
    UserModel::where('user_id', $id)->delete();

    return back()->with('success', 'User deleted successfully.');
}
}
