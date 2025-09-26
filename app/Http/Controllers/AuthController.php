<?php

namespace App\Http\Controllers;

use App\Models\AnnouncementModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\UserModel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;

class AuthController extends Controller
{
    /**
     * Display a listing of the resource.
     */
public function index()
{
    $announcements = AnnouncementModel::with('office')
        ->whereDate('start_date', '<=', now()) 
        ->whereDate('end_date', '>=', now()) 
        ->orderBy('start_date', 'desc')
        ->get(['announce_id', 'title', 'office_id']);

    return inertia('Login', [
        'announcements' => $announcements
    ]);
}

public function signin(Request $request)
{
    $credentials = $request->validate([
        'username' => 'required|string',
        'password' => 'required|string',
    ]);

    $user = UserModel::where('username', $credentials['username'])->first();

    if (! $user || ! Hash::check($credentials['password'], $user->password)) {
        return back()->withErrors(['message' => 'Invalid username or password.']);
    }

    if ($user->status === 'inactive') {
        return back()->withErrors(['message' => 'Your account is disabled.']);
    }

    // ✅ Check if there's already an active session for this user
    $hasSession = DB::table('sessions')
        ->where('user_id', $user->user_id)
        ->where('last_activity', '>=', now()->subMinutes(config('session.lifetime'))->timestamp)
        ->exists();

    if ($hasSession) {
        return back()->withErrors(['message' => 'This account is already logged in on another device.']);
    }

    // ✅ Invalidate and regenerate session
    $request->session()->invalidate();
    $request->session()->regenerate();

    // ✅ Log in the user
    Auth::login($user); // automatically stores user_id in session row

    // ✅ Store extras in session if needed
    Session::put('user_id', $user->user_id);
    Session::put('role', $user->role);

    return $user->role === 'user'
        ? redirect()->route('user.dashboard')
        : redirect()->route('home');
}


public function logout(Request $request)
{
    // Log the user out (removes user_id from session)
    Auth::logout();

    // Invalidate the current session
    $request->session()->invalidate();

    // Regenerate CSRF token for safety
    $request->session()->regenerateToken();

    return redirect()->route('login');
}





public function edit(string $id)
{
    $user = UserModel::with('office')->findOrFail($id);

    // If you have offices table, fetch them for dropdown
    $offices = \App\Models\OfficeModel::all();

    return inertia('Settings', [
        'user' => $user,
        'offices' => $offices
    ]);
}

public function update(Request $request, string $id)
{
    $user = UserModel::findOrFail($id);

    $validated = $request->validate([
        'first_name'  => 'required|string|max:255',
        'middle_name' => 'nullable|string|max:255',
        'last_name'   => 'required|string|max:255',
        'username'    => 'required|string|max:255|unique:tbl_users,username,'.$id.',user_id',
        'email'       => 'required|email|max:255|unique:tbl_users,email,'.$id.',user_id',
        'password'    => 'nullable|string|min:6|confirmed',
        'office_id'   => 'required|exists:tbl_offices,office_id',
    ]);

    // ✅ Update fields
    $user->first_name  = $validated['first_name'];
    $user->middle_name = $validated['middle_name'];
    $user->last_name   = $validated['last_name'];
    $user->username    = $validated['username'];
    $user->email       = $validated['email'];
    $user->office_id   = $validated['office_id'];

    // ✅ Update password only if provided
    if (!empty($validated['password'])) {
        $user->password = Hash::make($validated['password']);
    }

    $user->save();

    if ($user->role === 'user') {
            return redirect()->route('user.dashboard')->with('success', 'User updated successfully.');
        } else {
            return redirect()->route('home')->with('success', 'User updated successfully.');
    }}

}
