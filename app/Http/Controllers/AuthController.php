<?php

namespace App\Http\Controllers;

use App\Models\AnnouncementModel;
use App\Models\SavedDeviceModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\UserModel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
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
        'username' => [
            'required',
            'string',
            'max:12',
            'regex:/^[A-Za-z0-9_]+$/'
        ],
        'password' => [
            'required',
            'string',
            'min:8',
            'max:255'
        ],
    ], [
        'username.regex' => 'Username can only contain letters, numbers, and underscores.',
        'username.max' => 'Username must not exceed 12 characters.',
        'password.min' => 'Password must be at least 8 characters.',
    ]);

    $user = UserModel::where('username', $credentials['username'])->first();

    if (! $user || ! Hash::check($credentials['password'], $user->password)) {
        return back()->withErrors(['message' => 'Invalid username or password.']);
    }

    if ($user->status === 'inactive') {
        return back()->withErrors(['message' => 'Your account is disabled.']);
    }

    $hasSession = DB::table('sessions')
        ->where('user_id', $user->user_id)
        ->where('last_activity', '>=', now()->subMinutes(config('session.lifetime'))->timestamp)
        ->exists();

    if ($hasSession) {
        return back()->withErrors(['message' => 'This account is already logged in on another device.']);
    }

    $request->session()->invalidate();
    $request->session()->regenerate();

    Auth::login($user); // automatically stores user_id in session row

    Session::put('user_id', $user->user_id);
    Session::put('role', $user->role);

    return $user->role === 'user'
        ? redirect()->route('user.dashboard')
        : redirect()->route('home');
}


// //OTP DONT DELETE
// public function signin(Request $request)
// {
//     $credentials = $request->validate([
//         'username' => 'required|string',
//         'password' => 'required|string',
//     ]);

//     $user = UserModel::where('username', $credentials['username'])->first();

//     if (! $user || ! Hash::check($credentials['password'], $user->password)) {
//         return back()->withErrors(['message' => 'Invalid username or password.']);
//     }

//     if ($user->status === 'inactive') {
//         return back()->withErrors(['message' => 'Your account is disabled.']);
//     }

//     // Check active session
//     $hasSession = DB::table('sessions')
//         ->where('user_id', $user->user_id)
//         ->where('last_activity', '>=', now()->subMinutes(config('session.lifetime'))->timestamp)
//         ->exists();

//     if ($hasSession) {
//         return back()->withErrors(['message' => 'This account is already logged in on another device.']);
//     }

//     // Get device info
//     $deviceMac = $request->header('X-Device-ID') ?? $request->ip();
//     $deviceName = $request->header('User-Agent');
//     $deviceFingerprint = hash('sha256',
//         $request->header('User-Agent') .
//         ($request->header('X-Device-ID') ?? $request->ip())
//     );

//     /**
//      *  Allow multiple users on the same device fingerprint,
//      * but require OTP the first time per user.
//      */
//     $trusted = SavedDeviceModel::where('user_id', $user->user_id)
//         ->where('device_fingerprint', $deviceFingerprint)
//         ->exists();

//     if ($trusted) {
//         // This specific user already trusted this device fingerprint
//         Auth::login($user);
//         Session::put('user_id', $user->user_id);
//         Session::put('role', $user->role);

//         return $user->role === 'user'
//             ? redirect()->route('user.dashboard')
//             : redirect()->route('home');
//     }

//     // ✅ If not trusted yet for this user, send OTP
//     $this->sendOtp($user->email);

//     Session::put('pending_user_id', $user->user_id);
//     Session::put('otp_email', $user->email);
//     Session::put('device_mac', $deviceMac);
//     Session::put('device_name', $deviceName);
//     Session::put('device_fingerprint', $deviceFingerprint);

//     return redirect()->route('otp.verify.form');
// }


// protected function sendOtp($email)
// {
//     $otp = rand(100000, 999999);

//     Cache::put('email_otp_' . $email, [
//         'code' => $otp,
//         'expires_at' => now()->addMinutes(5),
//         'attempts' => 0,
//     ], now()->addMinutes(5));

//     Mail::raw("Your OTP code is: {$otp}\nThis code expires in 5 minutes.\n\nREMINDER: Please don't share this code to anyone.", function ($message) use ($email) {
//         $message->to($email)
//             ->subject('SETUP Login OTP Code');
//     });
// }

// protected function maskEmail($email)
// {
//     if (empty($email)) return '';
    
//     $parts = explode('@', $email);
//     if (count($parts) !== 2) return $email;
    
//     [$localPart, $domain] = $parts;
    
//     // Mask local part (before @)
//     $localLength = strlen($localPart);
//     $maskedLocal = $localLength > 2
//         ? $localPart[0] . str_repeat('*', $localLength - 2) . $localPart[$localLength - 1]
//         : $localPart[0] . '*';
    
//     // Mask domain
//     $domainParts = explode('.', $domain);
//     $domainName = $domainParts[0];
//     $extension = isset($domainParts[1]) ? $domainParts[1] : '';
    
//     $domainLength = strlen($domainName);
//     $maskedDomain = $domainLength > 2
//         ? $domainName[0] . str_repeat('*', $domainLength - 2) . $domainName[$domainLength - 1]
//         : $domainName[0] . '*';
    
//     return $maskedLocal . '@' . $maskedDomain . ($extension ? '.' . $extension : '');
// }

// public function showOtpForm()
// {
//     $email = Session::get('otp_email');
//     if (! $email) return redirect()->route('login');
    
//     return inertia('Auth/VerifyOtp', [
//         'email' => $email,
//         'maskedEmail' => $this->maskEmail($email)
//     ]);
// }

// public function verifyOtp(Request $request)
// {
//     $request->validate([
//         'email' => 'required|email',
//         'otp' => 'required',
//     ]);

//     $otpData = Cache::get('email_otp_' . $request->email);
//     $pendingUserId = Session::get('pending_user_id');

//     if (! $otpData || ! $pendingUserId) {
//         return back()->withErrors(['message' => 'OTP expired or invalid.']);
//     }

//     if ($otpData['attempts'] >= 3) {
//         Cache::forget('email_otp_' . $request->email);
//         Session::forget(['pending_user_id', 'otp_email', 'device_fingerprint']);
//         return back()->withErrors(['message' => 'Too many failed attempts. Please log in again.']);
//     }

//     $otpData['attempts']++;
//     Cache::put('email_otp_' . $request->email, $otpData, $otpData['expires_at']);

//     if ($otpData['code'] == $request->otp) {
//     Cache::forget('email_otp_' . $request->email);

//     $user = UserModel::find($pendingUserId);
//     Auth::login($user);
//     Session::put('user_id', $user->user_id);
//     Session::put('role', $user->role);

//     // ✅ Always create new record (unique per user_id + fingerprint)
//     $deviceMac = Session::pull('device_mac');
//     $deviceName = Session::pull('device_name');
//     $deviceFingerprint = Session::pull('device_fingerprint');
//     $ip = $request->ip();

//     // prevent duplicates for same user-fingerprint (safety)
//     $exists = SavedDeviceModel::where('user_id', $user->user_id)
//         ->where('device_fingerprint', $deviceFingerprint)
//         ->exists();

//     if (! $exists) {
//         SavedDeviceModel::create([
//             'user_id' => $user->user_id,
//             'device_fingerprint' => $deviceFingerprint,
//             'device_mac' => $deviceMac,
//             'device_name' => $deviceName,
//             'ip_address' => $ip,
//         ]);
//     }

//     Session::forget(['pending_user_id', 'otp_email']);

//     return $user->role === 'user'
//         ? redirect()->route('user.dashboard')
//         : redirect()->route('home');
// }


//     return back()->withErrors(['message' => 'Invalid OTP.']);
// }

// public function resendOtp(Request $request)
// {
//     $email = $request->validate(['email' => 'required|email'])['email'];

//     // Prevent spam — 30s cooldown
//     if (Cache::has('resend_cooldown_' . $email)) {
//         return response()->json(['error' => 'Please wait before requesting another OTP.'], 429);
//     }

//     $this->sendOtp($email);
//     Cache::put('resend_cooldown_' . $email, true, now()->addSeconds(30));

//     return response()->json(['message' => 'OTP resent successfully.'], 200);
// }

public function logout(Request $request)
{
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect()->route('login');
}

public function edit(string $id)
{
    $user = UserModel::with('office')->findOrFail($id);
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
        'first_name'   => ['required', 'string', 'max:20', 'regex:/^[A-Za-z\s-]+$/'],
        'middle_name'  => ['nullable', 'string', 'max:20', 'regex:/^[A-Za-z\s-]+$/'],
        'last_name'    => ['required', 'string', 'max:20', 'regex:/^[A-Za-z\s-]+$/'],
        'username'     => ['required', 'string', 'max:12', 'regex:/^[A-Za-z0-9_]+$/', 'unique:tbl_users,username,' . $id . ',user_id'],
        'email'        => ['required', 'email', 'max:255', 'unique:tbl_users,email,' . $id . ',user_id'],
        'password'     => [
            'nullable', 'string', 'min:8',
            'regex:/[a-z]/',   // at least one lowercase
            'regex:/[A-Z]/',   // at least one uppercase
            'regex:/[0-9]/',   // at least one number
            'confirmed',
        ],
        'office_id'    => ['required', 'exists:tbl_offices,office_id'],
        'website'      => ['nullable', 'string', 'max:255'], // Honeypot / spam trap
    ], [
        'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
        'password.confirmed' => 'Password confirmation does not match.',
        'first_name.regex' => 'First Name must contain letters, spaces, or hyphens only.',
        'middle_name.regex' => 'Middle Name must contain letters, spaces, or hyphens only.',
        'last_name.regex' => 'Last Name must contain letters, spaces, or hyphens only.',
        'username.regex' => 'Username must contain only letters, numbers, and underscores.',
        'username.unique' => 'This username is already taken.',
        'email.unique' => 'This email is already registered.',
    ]);

    // Update the fields
    $user->fill([
        'first_name'  => $validated['first_name'],
        'middle_name' => $validated['middle_name'] ?? null,
        'last_name'   => $validated['last_name'],
        'username'    => $validated['username'],
        'email'       => $validated['email'],
        'office_id'   => $validated['office_id'],
    ]);

    // Only update password if user entered one
    if (!empty($validated['password'])) {
        $user->password = Hash::make($validated['password']);
    }

    $user->save();

    // Return back to settings page with success message
    return back()->with('success', 'Settings updated successfully!');
}
}