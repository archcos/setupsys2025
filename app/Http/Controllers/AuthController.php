<?php

namespace App\Http\Controllers;

use App\Models\AnnouncementModel;
use App\Models\BlockedIp;
use App\Models\FrequencyModel;
use App\Models\OtpModel;
use App\Models\SavedDeviceModel;
use App\Services\DeviceFingerprintService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\UserModel;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Session;

class AuthController extends Controller
{
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

    // public function signin(Request $request){
    //     $ip = $request->ip();
    //     $key = 'signin:' . $ip;

    //     // 1. Check if IP is currently blocked
    //     $blocked = BlockedIp::where('ip', $ip)
    //         ->where('blocked_until', '>', Carbon::now())
    //         ->first();

    //     if ($blocked) {
    //         return back()->withErrors([
    //             'message' => 'Your IP is temporarily blocked due to suspicious activity.',
    //         ]);
    //     }

    //     // 2. Rate limit sign-in attempts — max 10 per minute per IP
    //     if (RateLimiter::tooManyAttempts($key, 10)) {
    //         BlockedIp::updateOrCreate(
    //             ['ip' => $ip],
    //             [
    //                 'reason' => 'Rate limit exceeded in sign-in',
    //                 'blocked_until' => Carbon::now()->addHours(1),
    //             ]
    //         );

    //         return back()->withErrors([
    //             'message' => "Too many sign-in attempts. You are temporarily blocked for 1 hour.",
    //         ]);
    //     }

    //     RateLimiter::hit($key, 30);

    //     // 3. Validate login credentials
    //     $credentials = $request->validate([
    //         'username' => [
    //             'required',
    //             'string',
    //             'max:12',
    //             'regex:/^[A-Za-z0-9_]+$/'
    //         ],
    //         'password' => 'required|string|min:8|max:255',
    //     ], [
    //         'username.regex' => 'Username can only contain letters, numbers, and underscores.',
    //         'username.max' => 'Username must not exceed 12 characters.',
    //         'password.min' => 'Password must be at least 8 characters.',
    //     ]);

    //     // 4. Block attempts to sign in as "iamsuperadmin"
    //     if (strtolower($credentials['username']) === 'iamsuperadmin') {
    //         BlockedIp::updateOrCreate(
    //             ['ip' => $ip],
    //             [
    //                 'reason' => 'Attempted login as iamsuperadmin',
    //                 'blocked_until' => Carbon::now()->addHours(1),
    //             ]
    //         );

    //         Log::warning('Attempted iamsuperadmin login', [
    //             'ip' => $ip,
    //             'timestamp' => now(),
    //         ]);

    //         return back()->withErrors([
    //             'message' => 'Access denied. Suspicious activity detected.',
    //         ]);
    //     }

    //     // 5. Check if user exists and credentials match
    //     $user = UserModel::where('username', $credentials['username'])->first();

    //     if (!$user || !Hash::check($credentials['password'], $user->password)) {
    //         Log::warning('Failed login attempt', [
    //             'ip' => $ip,
    //             'username' => $credentials['username'],
    //             'timestamp' => now(),
    //         ]);

    //         return back()->withErrors(['message' => 'Invalid username or password.']);
    //     }

    //     if ($user->status === 'inactive') {
    //         return back()->withErrors(['message' => 'Your account is disabled.']);
    //     }

    //     // 6. Check for existing active session
    //     $hasSession = DB::table('sessions')
    //         ->where('user_id', $user->user_id)
    //         ->where('last_activity', '>=', now()->subMinutes(config('session.lifetime'))->timestamp)
    //         ->exists();

    //     if ($hasSession) {
    //         return back()->withErrors(['message' => 'This account is already logged in on another device.']);
    //     }

    //     // 7. Generate device fingerprint from server-side data
    //     $deviceFingerprint = DeviceFingerprintService::generateFingerprint($request);
    //     $deviceName = substr(
    //         htmlspecialchars($request->header('User-Agent') ?? 'Unknown', ENT_QUOTES, 'UTF-8'),
    //         0,
    //         255
    //     );

    //     Log::info('Device fingerprint generated for login', [
    //         'user_id' => $user->user_id,
    //         'fingerprint' => substr($deviceFingerprint['fingerprint'], 0, 8) . '...',
    //         'ip' => $ip,
    //     ]);

    //     // 8. Try to register/recognize device
    //     try {
    //         DeviceFingerprintService::registerDevice(
    //             $user->user_id,
    //             $deviceFingerprint,
    //             $ip,
    //             $deviceName
    //         );

    //         Log::info('Device registered successfully', [
    //             'user_id' => $user->user_id,
    //             'ip' => $ip,
    //         ]);
    //     } catch (Exception $e) {
    //         Log::error('Failed to register device', [
    //             'user_id' => $user->user_id,
    //             'ip' => $ip,
    //             'error' => $e->getMessage(),
    //         ]);
    //         // Continue with login even if device registration fails
    //     }

    //     // 9. Complete login immediately (no OTP required)
    //     $this->completeLogin($user, $request);
    //     RateLimiter::clear($key);

    //     Log::info('User signed in successfully', [
    //         'user_id' => $user->user_id,
    //         'ip' => $ip,
    //         'role' => $user->role,
    //     ]);

    //     return $user->role === 'user'
    //         ? redirect()->route('user.dashboard')
    //         : redirect()->route('home');
    // }


    public function signin(Request $request){
        $ip = $request->ip();
        $key = 'signin:' . $ip;

        // 1. Check if IP is currently blocked
        $blocked = BlockedIp::where('ip', $ip)
            ->where('blocked_until', '>', Carbon::now())
            ->first();

        if ($blocked) {
            return back()->withErrors([
                'message' => 'Your IP is temporarily blocked due to suspicious activity.',
            ]);
        }

        // 2. Rate limit sign-in attempts — max 10 per minute per IP
        if (RateLimiter::tooManyAttempts($key, 10)) {
            BlockedIp::updateOrCreate(
                ['ip' => $ip],
                [
                    'reason' => 'Rate limit exceeded in sign-in',
                    'blocked_until' => Carbon::now()->addHours(1),
                ]
            );

            return back()->withErrors([
                'message' => "Too many sign-in attempts. You are temporarily blocked for 1 hour.",
            ]);
        }

        RateLimiter::hit($key, 30);

        // 3. Validate login credentials
        $credentials = $request->validate([
            'username' => [
                'required',
                'string',
                'max:12',
                'regex:/^[A-Za-z0-9_]+$/'
            ],
            'password' => 'required|string|min:8|max:255',
        ], [
            'username.regex' => 'Username can only contain letters, numbers, and underscores.',
            'username.max' => 'Username must not exceed 12 characters.',
            'password.min' => 'Password must be at least 8 characters.',
        ]);

        // 4. Block attempts to sign in as "iamsuperadmin"
        if (strtolower($credentials['username']) === 'iamsuperadmin') {
            BlockedIp::updateOrCreate(
                ['ip' => $ip],
                [
                    'reason' => 'Attempted login as iamsuperadmin',
                    'blocked_until' => Carbon::now()->addHours(1),
                ]
            );

            Log::warning('Attempted iamsuperadmin login', [
                'ip' => $ip,
                'timestamp' => now(),
            ]);

            return back()->withErrors([
                'message' => 'Access denied. Suspicious activity detected.',
            ]);
        }

        // 5. Check if user exists and credentials match
        $user = UserModel::where('username', $credentials['username'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            Log::warning('Failed login attempt', [
                'ip' => $ip,
                'username' => $credentials['username'],
                'timestamp' => now(),
            ]);

            return back()->withErrors(['message' => 'Invalid username or password.']);
        }

        if ($user->status === 'inactive') {
            return back()->withErrors(['message' => 'Your account is disabled.']);
        }

        // 6. Check for existing active session
        $hasSession = DB::table('sessions')
            ->where('user_id', $user->user_id)
            ->where('last_activity', '>=', now()->subMinutes(config('session.lifetime'))->timestamp)
            ->exists();

        if ($hasSession) {
            return back()->withErrors(['message' => 'This account is already logged in on another device.']);
        }

        // 7. Generate device fingerprint from server-side data
    $deviceFingerprint = DeviceFingerprintService::generateFingerprint($request);
    $deviceName = substr(
        htmlspecialchars($request->header('User-Agent') ?? 'Unknown', ENT_QUOTES, 'UTF-8'),
        0,
        255
    );

    // DEBUG: Check if device exists in database
    $existingDevices = SavedDeviceModel::where('user_id', $user->user_id)->get();
    
    Log::info('=== LOGIN FINGERPRINT DEBUG ===', [
        'user_id' => $user->user_id,
        'current_fingerprint' => $deviceFingerprint['fingerprint'],
        'current_fingerprint_relaxed' => $deviceFingerprint['fingerprint_relaxed'],
        'entropy_score' => $deviceFingerprint['entropy_score'],
        'ip' => $ip,
        'user_agent' => $request->header('User-Agent'),
        'total_saved_devices' => $existingDevices->count(),
    ]);

    // Show all saved fingerprints for this user
    foreach ($existingDevices as $device) {
        Log::info('Saved device in DB', [
            'device_id' => $device->id,
            'device_name' => $device->device_name,
            'saved_fingerprint' => $device->device_fingerprint,
            'saved_fingerprint_relaxed' => $device->device_fingerprint_relaxed,
            'last_ip' => $device->last_ip,
            'is_trusted' => $device->is_trusted,
            'trust_expires_at' => $device->trust_expires_at,
            'matches_strict' => $device->device_fingerprint === $deviceFingerprint['fingerprint'],
            'matches_relaxed' => $device->device_fingerprint_relaxed === $deviceFingerprint['fingerprint_relaxed'],
        ]);
    }
    // 8. Check if device is recognized and trusted
    $verification = DeviceFingerprintService::verifyDevice(
        $user->user_id,
        $deviceFingerprint,
        $ip
    );

    if (!$verification['require_mfa']) {
        // Device recognized and trusted - complete login
        Log::info('Login via recognized device - SKIPPING MFA', [
            'user_id' => $user->user_id,
            'ip' => $ip,
            'reason' => $verification['reason'],
        ]);

        $this->completeLogin($user, $request);
        RateLimiter::clear($key);

        return $user->role === 'user'
            ? redirect()->route('user.dashboard')
            : redirect()->route('home');
    }

    // 9. New/unrecognized device — Require OTP verification
    Log::warning('MFA required - device not recognized', [
        'user_id' => $user->user_id,
        'ip' => $ip,
        'reason' => $verification['reason'],
        'threat_level' => $verification['threat_level'],
    ]);

    if (!$this->sendOtp($user->email)) {
        return back()->withErrors(['message' => 'Failed to send OTP. Please try again.']);
    }

    // Store device info in session for OTP verification
    Session::put('pending_user_id', $user->user_id);
    Session::put('otp_email', $user->email);
    Session::put('device_name', $deviceName);
    Session::put('device_fingerprint', json_encode($deviceFingerprint));

    return redirect()->route('otp.verify.form');
    }

    protected function completeLogin($user, Request $request): void
    {
        $request->session()->invalidate();
        $request->session()->regenerate();

        Auth::login($user);
        Session::put('user_id', $user->user_id);
        Session::put('role', $user->role);

        if ($user->role === 'user') {
            $today = now()->format('Y-m-d');

            $record = FrequencyModel::where('user_id', $user->user_id)
                ->where('login_date', $today)
                ->first();

            if ($record) {
                $record->increment('login_count');
            } else {
                FrequencyModel::create([
                    'user_id' => $user->user_id,
                    'office_id' => $user->office_id,
                    'login_date' => $today,
                    'login_count' => 1,
                ]);
            }
        }

        if (empty($user->role)) {
            Auth::logout();
            Log::error('User without role attempted login', ['user_id' => $user->user_id]);
            Session::flash('error', 'Your account does not have a valid role assigned.');
            return;
        }

        Log::info('User logged in successfully', [
            'user_id' => $user->user_id,
            'role' => $user->role,
            'ip' => $request->ip(),
        ]);
    }

    protected function sendOtp($email){
        $resendKey = 'otp_resend_' . hash('sha256', $email);
        
        if (Cache::has($resendKey)) {
            Log::warning('OTP resend rate limited', [
                'email' => $email,
                'ip' => request()->ip(),
            ]);
            return false;
        }

        // Check if active OTP already exists for this email
        $existingOtp = OtpModel::where('email', $email)
            ->active()  // Not used and not expired
            ->first();
        
        if ($existingOtp) {
            $secondsSinceCreation = $existingOtp->created_at->diffInSeconds(now()); 
            
            // Don't allow resend too soon (30 second cooldown)
            if ($secondsSinceCreation < 30) {
                Log::warning('OTP resend too soon', [
                    'email' => $email,
                    'seconds_since_creation' => $secondsSinceCreation,
                ]);
                return false;
            }

            // Check resend limit (max 5 resends per OTP)
            if ($existingOtp->resend_count >= 5) {
                Log::warning('OTP resend limit exceeded', [
                    'email' => $email,
                    'resend_count' => $existingOtp->resend_count,
                ]);
                
                // Delete the exhausted OTP
                $existingOtp->delete();
                return false;
            }

            // Increment resend count atomically
            $existingOtp->increment('resend_count');
        }

        // Generate new OTP
        $otp = sprintf('%08d', random_int(0, 99999999));
        
        $secret = config('security.otp_secret');
        if (empty($secret)) {
            Log::error('OTP_SECRET not configured in .env file');
            return false;
        }
        
        $otpHash = hash_hmac('sha256', $otp, $secret);
        $otpLifetime = (int)config('security.otp_lifetime');
        
        // Cap OTP lifetime to 5 minutes max
        if ($otpLifetime > 5) {
            $otpLifetime = 5;
        }
        
        $expiresAt = now()->addMinutes($otpLifetime);
        
        try {
            // Delete any previous unused OTP for this email
            OtpModel::where('email', $email)
                ->whereNull('used_at')
                ->delete();

            // Create new OTP record in database
            $otpRecord = OtpModel::create([
                'email' => $email,
                'code' => $otpHash,
                'expires_at' => $expiresAt,
                'attempts' => 0,
                'used_at' => null,
                'used_ip' => null,
                'resend_count' => 1,
            ]);

            Cache::put($resendKey, true, now()->addSeconds(30));
            
            // Get user name for email
            $user = UserModel::where('email', $email)->first();
            $userName = $user ? $user->name : 'User';
            
            try {
                // Pass expiration time to email
                Mail::to($email)->send(new \App\Mail\OtpVerificationMail($otp, $userName, $expiresAt));
                
                Log::info('OTP sent successfully', [
                    'email' => $email,
                    'otp_id' => $otpRecord->id,
                    'otp_lifetime' => $otpLifetime,
                    'expires_at' => $expiresAt,
                    'ip' => request()->ip(),
                ]);
                
                return true;
            } catch (Exception $e) {
                Log::error("Failed to send OTP email", [
                    'email' => $email,
                    'error' => $e->getMessage(),
                ]);
                
                // Delete the OTP record if email sending failed
                $otpRecord->delete();
                return false;
            }
        } catch (Exception $e) {
            Log::error('Failed to create OTP record', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }


    public function verifyOtp(Request $request){
        $ip = $request->ip();
        
        $validated = $request->validate([
            'email' => 'required|email',
            'otp' => 'required|numeric|digits:8',
        ]);
        
        $email = $validated['email'];
        $otp = $validated['otp'];
        $pendingUserId = Session::get('pending_user_id');
        $otpEmail = Session::get('otp_email');
        $deviceFingerprintJson = Session::get('device_fingerprint');
        
        $ipKey = 'otp_verify:ip:' . $ip;
        $userKey = 'otp_verify:user:' . $pendingUserId;
        
        if (!$pendingUserId || !$otpEmail) {
            Log::warning('Missing session data during OTP verification', [
                'has_pending_user' => (bool)$pendingUserId,
                'has_otp_email' => (bool)$otpEmail,
                'ip' => $ip,
            ]);
            return back()->withErrors(['message' => 'OTP expired or invalid.']);
        }
        
        $deviceFingerprint = json_decode($deviceFingerprintJson, true);
        
        if (!$deviceFingerprint || !is_array($deviceFingerprint)) {
            Log::error('Device fingerprint missing or invalid from session', [
                'email' => $email,
                'pending_user_id' => $pendingUserId,
                'ip' => $ip,
            ]);
            Session::forget(['pending_user_id', 'otp_email', 'device_fingerprint']);
            return back()->withErrors(['message' => 'Device verification failed. Please try again.']);
        }
        
        if ($otpEmail !== $email) {
            Log::warning('Email mismatch in OTP verification', [
                'expected' => $otpEmail,
                'submitted' => $email,
                'ip' => $ip,
            ]);
            Session::forget(['pending_user_id', 'otp_email', 'device_fingerprint']);
            return back()->withErrors(['message' => 'Invalid email for OTP.']);
        }
        
        if (RateLimiter::tooManyAttempts($ipKey, 15)) {
            $seconds = RateLimiter::availableIn($ipKey);
            Log::warning('OTP verification rate limited by IP', [
                'ip' => $ip,
                'retry_after' => $seconds,
            ]);
            return back()->withErrors(['message' => "Too many verification attempts. Try again in {$seconds} seconds."]);
        }
        
        if (RateLimiter::tooManyAttempts($userKey, 5)) {
            $seconds = RateLimiter::availableIn($userKey);
            Log::warning('OTP verification rate limited by user', ['user_id' => $pendingUserId, 'retry_after' => $seconds]);
            return back()->withErrors(['message' => "Too many verification attempts. Try again in {$seconds} seconds."]);
        }
        
        RateLimiter::hit($ipKey, 30);
        RateLimiter::hit($userKey, 30);
        
        try {
            $otpVerified = DB::transaction(function () use ($email, $otp, $ip) {
                $otpRecord = OtpModel::where('email', $email)
                    ->lockForUpdate()
                    ->first();
                
                if (!$otpRecord) {
                    Log::warning('OTP record not found', ['email' => $email, 'ip' => $ip]);
                    return false;
                }
                
                if ($otpRecord->used_at !== null) {
                    Log::warning('OTP reuse attempt detected', [
                        'email' => $email,
                        'used_at' => $otpRecord->used_at,
                        'used_ip' => $otpRecord->used_ip,
                        'current_ip' => $ip,
                    ]);
                    return false;
                }
                
                $maxAttempts = (int)config('security.otp_attempts', 3); // Default to 3 if not set
                
                Log::info('OTP max attempts config loaded', [
                    'raw_config' => config('security.otp_attempts'),
                    'max_attempts_int' => $maxAttempts,
                    'email' => $email,
                ]);
                
                if (now()->isAfter($otpRecord->expires_at)) {
                    Log::warning('Expired OTP submission', [
                        'email' => $email,
                        'expired_at' => $otpRecord->expires_at,
                        'ip' => $ip,
                    ]);
                    return false;
                }
                
                $secret = config('security.otp_secret');
                $submittedHash = hash_hmac('sha256', $otp, $secret);
                
                if (!hash_equals($submittedHash, $otpRecord->code)) {
                    // Increment failed attempts
                    $otpRecord->increment('attempts');
                    $otpRecord->refresh(); // Refresh to get updated value
                    
                    $attemptsLeft = $maxAttempts - $otpRecord->attempts;
                    
                    Log::warning('Invalid OTP submitted', [
                        'email' => $email,
                        'current_attempts' => $otpRecord->attempts,
                        'max_attempts' => $maxAttempts,
                        'attempts_left' => $attemptsLeft,
                        'condition_check' => $otpRecord->attempts . ' >= ' . $maxAttempts . ' = ' . ($otpRecord->attempts >= $maxAttempts ? 'TRUE' : 'FALSE'),
                        'ip' => $ip,
                    ]);
                    
                    // DELETE OTP on 3rd failed attempt (or when max attempts reached)
                    if ($otpRecord->attempts >= $maxAttempts) {
                        $deleteResult = $otpRecord->delete();
                        Log::error('🔴 OTP BEING DELETED NOW', [
                            'email' => $email,
                            'current_attempts' => $otpRecord->attempts,
                            'max_attempts' => $maxAttempts,
                            'otp_id' => $otpRecord->id,
                            'ip' => $ip,
                            'deleted_successfully' => $deleteResult ? 'YES' : 'NO',
                        ]);
                        // Return false instead of throwing - this commits the transaction properly
                        return false;
                    }
                    
                    return false;
                }
                
                // OTP is correct - mark as used (DO NOT DELETE)
                $otpRecord->update([
                    'used_at' => now(),
                    'used_ip' => $ip,
                ]);
                
                Log::info('OTP verified successfully', [
                    'email' => $email,
                    'ip' => $ip,
                    'otp_id' => $otpRecord->id,
                ]);
                
                return true;
            });
            
        } catch (\Throwable $e) {
            Log::error('Database transaction error during OTP verification', [
                'email' => $email,
                'error' => $e->getMessage(),
                'ip' => $ip,
            ]);
            
            Session::forget(['pending_user_id', 'otp_email', 'device_fingerprint']);
            return back()->withErrors(['message' => 'Verification failed. Please try again.']);
        }
        
        if (!$otpVerified) {
            // Check if OTP was deleted due to max attempts
            $otpExists = OtpModel::where('email', $email)->where('used_at', null)->exists();
            
            if (!$otpExists) {
                Log::info('OTP record was deleted due to max attempts', ['email' => $email]);
                return back()->withErrors(['message' => 'Too many failed attempts. OTP has been invalidated. Please request a new OTP.']);
            }
            
            return back()->withErrors(['message' => 'Invalid OTP.']);
        }
        
        $user = UserModel::find($pendingUserId);
        
        if (!$user) {
            Log::error('User not found during OTP verification', [
                'user_id' => $pendingUserId,
                'email' => $email,
            ]);
            Session::forget(['pending_user_id', 'otp_email', 'device_fingerprint']);
            return back()->withErrors(['message' => 'User not found.']);
        }
        
        if ($user->email !== $email) {
            Log::error('User email mismatch during OTP', [
                'user_id' => $user->user_id,
                'expected_email' => $email,
                'actual_email' => $user->email,
                'ip' => $ip,
            ]);
            Session::forget(['pending_user_id', 'otp_email', 'device_fingerprint']);
            return back()->withErrors(['message' => 'Invalid user for OTP.']);
        }
        
        if ($user->status === 'inactive') {
            Log::warning('Inactive user OTP verification attempt', [
                'user_id' => $user->user_id,
                'email' => $email,
                'ip' => $ip,
            ]);
            Session::forget(['pending_user_id', 'otp_email', 'device_fingerprint']);
            return back()->withErrors(['message' => 'Your account is disabled.']);
        }
        
        $this->completeLogin($user, $request);
        
        try {
            $deviceName = Session::pull('device_name') ?? $request->header('User-Agent') ?? 'Unknown Device';
            $deviceName = substr(htmlspecialchars($deviceName, ENT_QUOTES, 'UTF-8'), 0, 255);

            Log::info('Attempting to save device after OTP', [
                'user_id' => $user->user_id,
                'fingerprint' => substr($deviceFingerprint['fingerprint'], 0, 8) . '...',
                'device_name' => $deviceName,
                'ip' => $ip,
            ]);
            
            DeviceFingerprintService::registerDevice(
                $user->user_id,
                $deviceFingerprint,
                $ip,
                $deviceName
            );
            
            Log::info('Device registered successfully', [
                'user_id' => $user->user_id,
                'fingerprint' => substr($deviceFingerprint['fingerprint'], 0, 8) . '...',
                'ip' => $ip,
            ]);
        } catch (Exception $e) {
            Log::error('Failed to save device after OTP', [
                'user_id' => $user->user_id,
                'email' => $email,
                'ip' => $ip,
                'error' => $e->getMessage(),
            ]);
        }
        
        Session::forget([
            'pending_user_id',
            'otp_email',
            'device_fingerprint',
            'device_name',
        ]);
        
        RateLimiter::clear($ipKey);
        RateLimiter::clear($userKey);
        
        Log::info('OTP verified and login completed', [
            'user_id' => $user->user_id,
            'email' => $email,
            'ip' => $ip,
            'role' => $user->role,
        ]);
        
        return $user->role === 'user'
            ? redirect()->route('user.dashboard')
            : redirect()->route('home');
    }

    public function resendOtp(Request $request){
        $ip = $request->ip();
        $rateLimitKey = 'resend_otp_ip:' . $ip;
        
        Log::info('Resend OTP request received', [
            'ip' => $ip,
            'email' => $request->email ?? 'unknown',
        ]);
        
        if (RateLimiter::tooManyAttempts($rateLimitKey, 5)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            
            Log::warning('Resend OTP rate limited by IP', [
                'ip' => $ip,
                'retry_after' => $seconds,
            ]);
            
            return back()->withErrors([
                'message' => "Too many resend requests. Try again in {$seconds} seconds."
            ]);
        }
        
        RateLimiter::hit($rateLimitKey, 30);
        
        $validated = $request->validate(['email' => 'required|email']);
        $email = $validated['email'];
        
        Log::info('Resend OTP validation passed', [
            'email' => $email,
            'ip' => $ip,
        ]);
        
        if (!Session::has('pending_user_id')) {
            Log::warning('Resend OTP without valid session', [
                'email' => $email,
                'ip' => $ip,
            ]);
            return back()->withErrors([
                'message' => 'Invalid session. Please log in again.'
            ]);
        }
        
        $sessionEmail = Session::get('otp_email');
        if ($sessionEmail !== $email) {
            Log::warning('Resend OTP email mismatch', [
                'session_email' => $sessionEmail,
                'submitted_email' => $email,
                'ip' => $ip,
            ]);
            return back()->withErrors([
                'message' => 'Email does not match session.'
            ]);
        }
        
        $cooldownKey = 'resend_otp_cooldown:' . hash('sha256', $email . $ip);
        
        if (Cache::has($cooldownKey)) {
            $secondsLeft = Cache::getSeconds($cooldownKey) ?? 30;
            
            Log::warning('Resend OTP on cooldown', [
                'email' => $email,
                'seconds_remaining' => $secondsLeft,
                'ip' => $ip,
            ]);
            
            return back()->withErrors([
                'message' => "Please wait {$secondsLeft} seconds before requesting another OTP."
            ]);
        }
        
        // Delete old OTP record for this email BEFORE creating new one
        OtpModel::where('email', $email)
            ->where('used_at', null)
            ->delete();
        
        Log::info('Deleted old OTP record, about to create new one', [
            'email' => $email,
            'ip' => $ip,
        ]);
        
        if (!$this->sendOtp($email)) {
            Log::error('sendOtp returned false', [
                'email' => $email,
                'ip' => $ip,
            ]);
            return back()->withErrors([
                'message' => 'Failed to send OTP. Please try again.'
            ]);
        }
        
        Log::info('sendOtp succeeded, setting cooldown', [
            'email' => $email,
            'ip' => $ip,
        ]);
        
        Cache::put($cooldownKey, true, now()->addSeconds(30));
        
        // Get the newly created OTP record
        $otpRecord = OtpModel::where('email', $email)
            ->where('used_at', null)
            ->orderBy('created_at', 'desc')
            ->first();
        
        if (!$otpRecord) {
            Log::error('OTP record not found after sendOtp', [
                'email' => $email,
                'ip' => $ip,
            ]);
            return back()->withErrors([
                'message' => 'OTP was sent but could not retrieve expiration time.'
            ]);
        }
        
        Log::info('OTP resent successfully', [
            'email' => $email,
            'otp_id' => $otpRecord->id,
            'expires_at' => $otpRecord->expires_at,
            'ip' => $ip,
        ]);
        
        return back()->with([
            'message' => 'OTP resent successfully! Check your email.',
            'expiresAt' => $otpRecord->expires_at->toIso8601String(),
        ]);
    }

    public function showOtpForm(){
        $email = Session::get('otp_email');
        if (!$email) {
            return redirect()->route('login');
        }
        
        // Get the OTP record to pass expiration time and attempts to frontend
        $otpRecord = OtpModel::where('email', $email)
            ->where('used_at', null)
            ->where('expires_at', '>', now())
            ->first();
        
        $expiresAt = $otpRecord?->expires_at?->toIso8601String() ?? null;
        
        // Calculate attempts left from database (max 3 attempts)
        $maxAttempts = 3;
        $attemptsUsed = $otpRecord?->attempts ?? 0;
        $attemptsLeft = max(0, $maxAttempts - $attemptsUsed);
        
        Log::info('OTP form displayed', [
            'email' => $email,
            'attempts_used' => $attemptsUsed,
            'attempts_left' => $attemptsLeft,
            'expires_at' => $expiresAt,
        ]);
        
        return inertia('Auth/VerifyOtp', [
            'email' => $email,
            'maskedEmail' => $this->maskEmail($email),
            'expiresAt' => $expiresAt,
            'attemptsLeft' => $attemptsLeft,
        ]);
    }

    protected function maskEmail($email): string
    {
        if (empty($email)) return '';
        
        $parts = explode('@', $email);
        if (count($parts) !== 2) return $email;
        
        [$localPart, $domain] = $parts;
        
        $localLength = strlen($localPart);
        $maskedLocal = $localLength > 2
            ? $localPart[0] . str_repeat('*', $localLength - 2) . $localPart[$localLength - 1]
            : $localPart[0] . '*';
        
        $domainParts = explode('.', $domain);
        $domainName = $domainParts[0];
        $extension = isset($domainParts[1]) ? $domainParts[1] : '';
        
        $domainLength = strlen($domainName);
        $maskedDomain = $domainLength > 2
            ? $domainName[0] . str_repeat('*', $domainLength - 2) . $domainName[$domainLength - 1]
            : $domainName[0] . '*';
        
        return $maskedLocal . '@' . $maskedDomain . ($extension ? '.' . $extension : '');
    }

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
            'username'     => ['required', 'string', 'max:20', 'regex:/^[A-Za-z0-9_]+$/', 'unique:tbl_users,username,' . $id . ',user_id'],
            'email'        => ['required', 'email', 'max:255', 'unique:tbl_users,email,' . $id . ',user_id'],
            'password'     => [
                'nullable', 'string', 'min:12', 'max:72',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,72}$/',
                'confirmed',
            ],
            'office_id'    => ['required', 'exists:tbl_offices,office_id'],
            'website'      => ['nullable', 'string', 'max:255'],
        ], [
            'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
            'password.confirmed' => 'Password confirmation does not match.',
            'first_name.regex' => 'First Name must contain letters, spaces, or hyphens only.',
            'middle_name.regex' => 'Middle Name must contain letters, spaces, or hyphens only.',
            'last_name.regex' => 'Last Name must contain letters, spaces, or hyphens only.',
            'username.regex' => 'Username must contain only letters, numbers, and underscores.',
            'username.unique' => 'This username is already taken.',
            'email.unique' => 'This email is already registered.',
        ]);

        if (!empty($validated['website'])) {
            Log::warning('HP triggered in user update', [
                'ip' => $request->ip(),
                'user_id' => Auth::id(),
            ]);
            return back()->with('success', 'Settings updated successfully!');
        }

        $user->fill([
            'first_name'  => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name'   => $validated['last_name'],
            'username'    => $validated['username'],
            'email'       => $validated['email'],
            'office_id'   => $validated['office_id'],
        ]);

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        Log::info('User settings updated', [
            'user_id' => $user->user_id,
            'updated_by' => Auth::id(),
        ]);

        return back()->with('success', 'Settings updated successfully!');
    }
}