<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserModel;
use App\Models\OfficeModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;

class UserManagementController extends Controller
{
    /**
     * Display the admin user management panel.
     */public function index(Request $request)
{
    // ✅ Optional: Only allow admin access
    if (Session::get('role') !== 'admin') {
        abort(403, 'Unauthorized');
    }

    // ✅ Build query with search
    $query = UserModel::with('office');

    if ($request->filled('search')) {
        $query->where(function ($q) use ($request) {
            $q->where('first_name', 'like', "%{$request->search}%")
              ->orWhere('last_name', 'like', "%{$request->search}%")
              ->orWhere('username', 'like', "%{$request->search}%");
        });
    }

    // ✅ Paginate with search query string preserved
    $users = $query->paginate(10)->withQueryString();

    // ✅ All offices for dropdowns
    $offices = OfficeModel::all();

    // ✅ Return to Inertia
    return inertia('Admin/UserManagement', [
        'users' => $users,
        'offices' => $offices,
        'filters' => [
            'search' => $request->search,
        ]
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

    // Find the user to be logged out
    $user = UserModel::find($id);

    if (!$user || !$user->session_id) {
        return back()->withErrors(['message' => 'User has no active session.']);
    }

    // Delete the session from the sessions table
    DB::table('sessions')->where('id', $user->session_id)->delete();

    // Clear session_id from user table
    $user->session_id = null;
    $user->save();

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
