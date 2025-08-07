<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\UserModel;
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
        return back()->withErrors(['message' => 'Invalid username/password.']);
    }

    if ($user->status === 'inactive') {
        return back()->withErrors(['message' => 'Your account is disabled. Please contact the administrator.']);
    }

    // 🔒 Check if user is already logged in (has active session)
    if ($user->session_id && DB::table('sessions')->where('id', $user->session_id)->exists()) {
        return back()->withErrors(['message' => 'You are already logged in on another device.']);
    }

    // ✅ Proceed with login
    $request->session()->invalidate();
    $request->session()->regenerate();

    $user->session_id = Session::getId();
    $user->save();

    Session::put('user_id', $user->user_id);
    Session::put('role', $user->role);

    return $user->role === 'user'
        ? redirect()->route('user.dashboard')
        : redirect()->route('home');
}



public function logout(Request $request)
{
    $user = UserModel::find(Session::get('user_id'));

    if ($user) {
        $user->session_id = null;
        $user->save();
    }

    Session::flush();
    $request->session()->invalidate();
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
