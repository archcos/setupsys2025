<?php

namespace App\Http\Controllers;

use App\Models\AnnouncementModel;
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


// //OTP DONT DELETE
//     public function signin(Request $request)
//     {
//         $credentials = $request->validate([
//             'username' => 'required|string',
//             'password' => 'required|string',
//         ]);

//         $user = UserModel::where('username', $credentials['username'])->first();

//         if (! $user || ! Hash::check($credentials['password'], $user->password)) {
//             return back()->withErrors(['message' => 'Invalid username or password.']);
//         }

//         if ($user->status === 'inactive') {
//             return back()->withErrors(['message' => 'Your account is disabled.']);
//         }

//         $hasSession = DB::table('sessions')
//             ->where('user_id', $user->user_id)
//             ->where('last_activity', '>=', now()->subMinutes(config('session.lifetime'))->timestamp)
//             ->exists();

//         if ($hasSession) {
//             return back()->withErrors(['message' => 'This account is already logged in on another device.']);
//         }

//         $this->sendOtp($user->email);

//         Session::put('pending_user_id', $user->user_id);
//         Session::put('otp_email', $user->email);

//         return redirect()->route('otp.verify.form');
//     }

//     protected function sendOtp($email)
//     {
//         $otp = rand(100000, 999999);

//         Cache::put('email_otp_' . $email, [
//             'code' => $otp,
//             'expires_at' => now()->addMinutes(5),
//             'attempts' => 0,
//         ], now()->addMinutes(5));

//         Mail::raw("Your OTP code is: {$otp}\nThis code expires in 5 minutes.\n\nREMINDER: Please don't share this code to anyone.", function ($message) use ($email) {
//             $message->to($email)
//                 ->subject('SETUP Login OTP Code');
//         });
//     }

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
    
//     // Send masked email to frontend
//     return inertia('Auth/VerifyOtp', [
//         'email' => $email, // Keep real email for verification
//         'maskedEmail' => $this->maskEmail($email) // Add masked version
//     ]);
// }
//     public function verifyOtp(Request $request)
//     {
//         $request->validate([
//             'email' => 'required|email',
//             'otp' => 'required',
//         ]);

//         $otpData = Cache::get('email_otp_' . $request->email);
//         $pendingUserId = Session::get('pending_user_id');

//         if (! $otpData || ! $pendingUserId) {
//             return back()->withErrors(['message' => 'OTP expired or invalid.']);
//         }

//         if ($otpData['attempts'] >= 3) {
//             Cache::forget('email_otp_' . $request->email);
//             Session::forget(['pending_user_id', 'otp_email']);
//             return back()->withErrors(['message' => 'Too many failed attempts. Please log in again.']);
//         }

//         // Increment attempt count
//         $otpData['attempts']++;
//         Cache::put('email_otp_' . $request->email, $otpData, $otpData['expires_at']);

//         if ($otpData['code'] == $request->otp) {
//             Cache::forget('email_otp_' . $request->email);
//             Session::forget(['pending_user_id', 'otp_email']);

//             $user = UserModel::find($pendingUserId);
//             Auth::login($user);
//             Session::put('user_id', $user->user_id);
//             Session::put('role', $user->role);

//             return $user->role === 'user'
//                 ? redirect()->route('user.dashboard')
//                 : redirect()->route('home');
//         }

//         return back()->withErrors(['message' => 'Invalid OTP.']);
//     }

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
