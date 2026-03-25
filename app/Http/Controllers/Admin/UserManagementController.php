<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserModel;
use App\Models\OfficeModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class UserManagementController extends Controller
{

    /**
     * Get currently online user IDs from the sessions table.
     *
     * Laravel stores sessions in the `sessions` table with a `user_id` column.
     * The `user_id` is stored as a plain integer when using the database driver,
     * BUT only for authenticated users — guest sessions have a NULL user_id.
     *
     * We also apply a "last_activity" recency check (e.g. active within 5 minutes)
     * so that stale sessions don't falsely appear as "online".
     */
    private function getOnlineUserIds(): array
    {
        $threshold = now()->subMinutes(5)->timestamp;

        return DB::table('sessions')
            ->whereNotNull('user_id')
            ->where('last_activity', '>=', $threshold)
            ->pluck('user_id')
            ->map(fn($id) => (int) $id)   // cast to int for safe comparison
            ->unique()
            ->values()
            ->toArray();
    }

    public function index(Request $request)
    {
        if (Auth::user()->role !== 'head') {
            abort(403, 'Unauthorized');
        }

        $onlineUserIds = $this->getOnlineUserIds();

        $query = UserModel::withTrashed()->with('office');

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('first_name', 'like', "%{$request->search}%")
                  ->orWhere('last_name', 'like', "%{$request->search}%")
                  ->orWhere('username', 'like', "%{$request->search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('office_id')) {
            $query->where('office_id', $request->office_id);
        }

        // Access filter (login allowed/disabled)
        if ($request->filled('access')) {
            $query->where('status', $request->access);
        }

        // Online/Offline filter — applied before pagination
        if ($request->filled('status')) {
            if ($request->status === 'online') {
                $query->whereIn('user_id', $onlineUserIds);
            } elseif ($request->status === 'offline') {
                $query->whereNotIn('user_id', $onlineUserIds);
            }
        }

        $users = $query->paginate(10)->appends($request->all());

        // Attach is_online flag
        $users->getCollection()->transform(function ($user) use ($onlineUserIds) {
            $user->is_online = in_array((int) $user->user_id, $onlineUserIds);
            return $user;
        });

        // Stats (un-paginated counts)
        $allOnlineIds      = $this->getOnlineUserIds(); // fresh call for counts
        $totalUsers        = UserModel::withTrashed()->count();
        $activeUsers       = UserModel::where('status', 'active')->count();
        $onlineUsersCount  = UserModel::whereIn('user_id', $allOnlineIds)->count();
        $deletedUsers      = UserModel::onlyTrashed()->count();

        return inertia('Admin/UserManagement', [
            'users'   => $users,
            'offices' => OfficeModel::all(),
            'filters' => $request->only(['search', 'role', 'office_id', 'status', 'access']),
            'stats'   => [
                'total'   => $totalUsers,
                'active'  => $activeUsers,
                'online'  => $onlineUsersCount,
                'deleted' => $deletedUsers,
            ],
        ]);
    }

    /**
     * Update user data (role, office, status, optional password).
     * Requires admin password confirmation.
     */
    public function update(Request $request, $id)
    {
        if (Auth::user()->role !== 'head') {
            abort(403, 'Unauthorized');
        }

        $request->validate([
            'office_id'      => 'required|exists:tbl_offices,office_id',
            'role'           => 'required|in:rd,au,head,user,staff,rpmo',
            'status'         => 'required|in:active,inactive',
            'password'       => 'nullable|string|min:6',
            'admin_password' => 'required|string',
        ]);

        if (!Hash::check($request->admin_password, Auth::user()->password)) {
            return back()->withErrors(['admin_password' => 'Incorrect admin password.']);
        }

        $user            = UserModel::findOrFail($id);
        $user->office_id = $request->office_id;
        $user->role      = $request->role;
        $user->status    = $request->status;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return back()->with('success', 'User updated successfully.');
    }

    /**
     * Force-logout a user by deleting their active sessions.
     */
    public function forceLogout(Request $request, $id)
    {
        if (Auth::user()->role !== 'head') {
            abort(403, 'Unauthorized');
        }

        $request->validate(['admin_password' => 'required|string']);

        if (!Hash::check($request->admin_password, Auth::user()->password)) {
            return back()->withErrors(['admin_password' => 'Incorrect admin password.']);
        }

        $user = UserModel::find($id);
        if (!$user) {
            return back()->withErrors(['message' => 'User not found.']);
        }

        DB::table('sessions')->where('user_id', $user->user_id)->delete();

        return back()->with('success', 'User has been forcibly logged out.');
    }

    /**
     * Soft-delete a user and terminate their sessions.
     */
    public function deleteUser(Request $request, $id)
    {
        if (Auth::user()->role !== 'head') {
            abort(403, 'Unauthorized');
        }

        $request->validate(['admin_password' => 'required|string']);

        if (!Hash::check($request->admin_password, Auth::user()->password)) {
            return back()->withErrors(['admin_password' => 'Incorrect admin password.']);
        }

        $user = UserModel::find($id);
        if (!$user) {
            return back()->withErrors(['message' => 'User not found.']);
        }

        DB::table('sessions')->where('user_id', $user->user_id)->delete();
        $user->delete(); // soft delete

        return back()->with('success', 'User deleted successfully.');
    }

    /**
     * Restore a soft-deleted user.
     */
    public function restoreUser($id)
    {
        if (Auth::user()->role !== 'head') {
            abort(403, 'Unauthorized');
        }

        $user = UserModel::withTrashed()->find($id);
        if (!$user) {
            return back()->withErrors(['message' => 'User not found.']);
        }

        $user->restore();

        return back()->with('success', 'User restored successfully.');
    }
}