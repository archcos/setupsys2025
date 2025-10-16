<?php

namespace App\Http\Controllers;

use App\Models\BlockedIp;
use Illuminate\Http\Request;
use App\Models\OfficeModel;
use App\Models\UserModel;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;

class RegisterController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // 🔄 Clear any existing session data
        session()->invalidate();

        // 🆕 Generate a fresh session and CSRF token
        session()->regenerateToken();

        $offices = OfficeModel::all();

        return inertia('Register', [
            'offices' => $offices
        ]);
    }


    public function register(Request $request)
    {
        $ip = $request->ip();
        $key = 'register:' . $ip;

        // Check if IP is blocked
        $blocked = BlockedIp::where('ip', $ip)
            ->where('blocked_until', '>', Carbon::now())
            ->first();

        if ($blocked) {
            return back()->withErrors([
                'message' => 'Your IP is temporarily blocked due to suspicious activity.',
            ]);
        }

        // Rate limit per IP — max 5 attempts per minute
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);

            BlockedIp::updateOrCreate(
                ['ip' => $ip],
                [
                    'reason' => 'Rate limit exceeded in registration',
                    'blocked_until' => Carbon::now()->addHours(1),
                ]
            );

            return back()->withErrors([
                'message' => "Too many registration attempts. You are temporarily blocked for 1 hour.",
            ]);
        }

        RateLimiter::hit($key, 60); // 1 minute decay

        // ✅ Validate fields (including honeypot)
        $validator = Validator::make($request->all(), [
            'first_name'   => ['required', 'string', 'max:20', 'regex:/^[A-Za-z\s-]+$/'],
            'middle_name'  => ['nullable', 'string', 'max:20', 'regex:/^[A-Za-z\s-]+$/'],
            'last_name'    => ['required', 'string', 'max:20', 'regex:/^[A-Za-z\s-]+$/'],
            'username'     => ['required', 'string', 'max:12', 'unique:tbl_users,username', 'regex:/^[A-Za-z0-9_]+$/'],
            'email'        => 'required|email|unique:tbl_users,email',
            'password'     => [
                'required', 'string', 'min:8',
                'regex:/[a-z]/', 'regex:/[A-Z]/', 'regex:/[0-9]/',
            ],
            'office_id'    => 'required|exists:tbl_offices,office_id',
            'website'      => 'nullable|string|max:255', //  Honeypot field
        ], [
            'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
            'first_name.regex' => 'First Name must contain letters only.',
            'middle_name.regex' => 'Middle Name must contain letters only.',
            'last_name.regex' => 'Last Name and Extension must contain letters  only.',
            'username.regex' => 'Username must contain only aphanumeric and underscore.',

        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator->errors());
        }

        // Honeypot Detection — if filled, block IP immediately
        if ($request->filled('website')) {
            BlockedIp::updateOrCreate(
                ['ip' => $ip],
                [
                    'reason' => 'Honeypot triggered during registration',
                    'blocked_until' => Carbon::now()->addHours(1),
                ]
            );

            return back()->withErrors([
                'message' => 'Error detected. Please refresh page.',
            ]);
        }

        // Create user
        $user = UserModel::create([
            'first_name'   => $request->first_name,
            'middle_name'  => $request->middle_name,
            'last_name'    => $request->last_name,
            'username'     => $request->username,
            'email'        => $request->email,
            'password'     => Hash::make($request->password),
            'office_id'    => $request->office_id,
            'role'         => 'user',
            'status'       => 'active',
        ]);

        RateLimiter::clear($key);

        // Redirect to login page with success message
        return redirect()->route('login')->with('success', 'Registration successful! Please sign in.');
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