<?php

namespace App\Http\Controllers;

use App\Mail\RegistrationNotificationMail;
use App\Models\BlockedIp;
use Illuminate\Http\Request;
use App\Models\OfficeModel;
use App\Models\UserModel;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;

class RegisterController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Clear any existing session data
        session()->invalidate();

        // Generate a fresh session and CSRF token
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

    // Validate fields (including honeypot)
    $validator = Validator::make($request->all(), [
        'first_name'   => ['required', 'string', 'max:20', 'regex:/^[A-Za-z\s-]+$/'],
        'middle_name'  => ['nullable', 'string', 'max:20', 'regex:/^[A-Za-z\s-]+$/'],
        'last_name'    => ['required', 'string', 'max:20', 'regex:/^[A-Za-z\s-]+$/'],
        'username'     => ['required', 'string', 'max:12', 'unique:tbl_users,username', 'regex:/^[A-Za-z0-9_]+$/'],
        'email'        => 'required|email|unique:tbl_users,email',
        'password' => [
                'required', 
                'string', 
                'min:8',
                'regex:/[a-z]/',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
                'not_in:Admin123,Password123',
                // Custom validation: password cannot contain last_name or username
                function ($attribute, $value, $fail) use ($request) {
                    $lastName = strtolower($request->last_name);
                    $username = strtolower($request->username);
                    $password = strtolower($value);

                    // Check if password contains last name
                    if (strpos($password, $lastName) !== false && strlen($lastName) > 2) {
                        $fail('Password cannot contain your last name.');
                    }

                    // Check if password contains username
                    if (strpos($password, $username) !== false && strlen($username) > 2) {
                        $fail('Password cannot contain your username.');
                    }

                    // Check if password contains first name
                    $firstName = strtolower($request->first_name);
                    if (strpos($password, $firstName) !== false && strlen($firstName) > 2) {
                        $fail('Password cannot contain your first name.');
                    }
                },
            ],
        'confirm_password' => 'required|same:password',
        'office_id'    => 'required|exists:tbl_offices,office_id',
        'phone_number' => 'nullable|string|max:255', // Honeypot field
        'fax'          => 'nullable|string|max:255', // Honeypot field
        'company_url'  => 'nullable|string|max:255', // Honeypot field

    ], [
        'password.required' => 'Password is required.',
        'password.string' => 'Password must be a string.',
        'password.min' => 'Password must be at least 8 characters long.',
        'password.not_in' => 'This password is too common. Please choose a stronger password.',
        'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
        'first_name.regex' => 'First Name must contain letters only.',
        'middle_name.regex' => 'Middle Name must contain letters only.',
        'last_name.regex' => 'Last Name and Extension must contain letters only.',
        'username.regex' => 'Username must contain only alphanumeric and underscore.',

    ]);

    if ($validator->fails()) {
        return back()->withErrors($validator->errors());
    }

    // Honeypot Detection — if any honeypot field is filled, block IP immediately
    if ($request->filled('phone_number') || $request->filled('fax') || $request->filled('company_url')) {
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

    // Send registration confirmation email
    try {
        $fullName = trim($request->first_name . ' ' . $request->middle_name . ' ' . $request->last_name);
        Mail::to($request->email)->send(
            new RegistrationNotificationMail($fullName, $request->email)
        );
    } catch (\Exception $e) {
        Log::error("Failed to send registration confirmation email to {$request->email}: " . $e->getMessage());
        // Don't fail the registration if email fails
    }

    RateLimiter::clear($key);

    // Redirect to login page with success message
    return redirect()->route('login')->with('success', 'Registration successful! Please sign in.');
}

}