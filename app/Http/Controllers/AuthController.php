<?php

namespace App\Http\Controllers;

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
        return inertia('Login');
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





    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
