<?php

namespace App\Http\Controllers;

use App\Models\OtpModel;
use App\Models\UserModel;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Session;
use Exception;
use Inertia\Inertia;

class PasswordResetController extends Controller
{
    /**
     * Show the request password reset form
     */
    public function showRequestForm()
    {
        return Inertia::render('RequestPasswordReset');
    }

    /**
     * Handle password reset request
     * User enters their email or username to request a reset
     */
    public function requestReset(Request $request)
    {
        $ip = $request->ip();
        $rateLimitKey = 'password_reset_request:' . $ip;

        // Rate limit: max 3 reset requests per IP per minute
        if (RateLimiter::tooManyAttempts($rateLimitKey, 3)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            
            Log::warning('Password reset request rate limited', [
                'ip' => $ip,
                'retry_after' => $seconds,
            ]);

            return back()->withErrors([
                'message' => "Too many reset requests. Try again in {$seconds} seconds."
            ]);
        }

        RateLimiter::hit($rateLimitKey, 60);

        $validated = $request->validate([
            'login' => 'required|string|max:255', // email or username
        ], [
            'login.required' => 'Please enter your email or username.',
        ]);

        $login = $validated['login'];

        // Find user by email or username
        $user = UserModel::where('email', $login)
            ->orWhere('username', $login)
            ->first();

        // Security: Always return success message even if user doesn't exist
        // This prevents username enumeration
        Log::info('Password reset requested', [
            'login_attempt' => $login,
            'user_found' => $user ? true : false,
            'ip' => $ip,
        ]);

        // If user doesn't exist, just pretend we sent an email
        if (!$user) {
            return back()->with('message', 
                'If an account exists with that email or username, you will receive a password reset OTP shortly.'
            );
        }

        // User exists - send OTP
        if (!$this->sendPasswordResetOtp($user->email)) {
            Log::error('Failed to send password reset OTP', [
                'user_id' => $user->user_id,
                'email' => $user->email,
            ]);

            return back()->withErrors([
                'message' => 'Failed to send reset code. Please try again.'
            ]);
        }

        // Store in session for verification step
        Session::put('reset_pending_user_id', $user->user_id);
        Session::put('reset_email', $user->email);

        Log::info('Password reset OTP sent', [
            'user_id' => $user->user_id,
            'email' => $user->email,
            'ip' => $ip,
        ]);

        return redirect()->route('password.reset.verify-form');
    }

/**
     * Show OTP verification form for password reset
     */
    public function showVerifyForm()
    {
        $email = Session::get('reset_email');
        
        if (!$email) {
            return redirect()->route('password.request');
        }

        // Get the LATEST OTP record (not used, not expired)
        $otpRecord = OtpModel::where('email', $email)
            ->where('used_at', null)
            ->where('expires_at', '>', now())
            ->orderBy('created_at', 'desc')
            ->first();

        // If no valid OTP exists, tell user to request again
        if (!$otpRecord) {
            Log::warning('No valid OTP found when showing verify form', [
                'email' => $email,
            ]);
            
            Session::forget(['reset_pending_user_id', 'reset_email']);
            
            return redirect()->route('password.request')
                ->withErrors(['message' => 'Password reset code expired. Please request a new one.']);
        }

        // HARDCODE max attempts to 3 - DO NOT USE CONFIG
        $maxAttempts = 3;
        $attemptsUsed = $otpRecord->attempts;
        $attemptsLeft = max(0, $maxAttempts - $attemptsUsed);

        // If OTP has already exhausted all attempts, redirect back
        if ($attemptsLeft <= 0) {
            Log::warning('OTP already exhausted attempts - redirecting to request form', [
                'email' => $email,
                'attempts_used' => $attemptsUsed,
                'max_attempts' => $maxAttempts,
            ]);
            
            Session::forget(['reset_pending_user_id', 'reset_email']);
            
            return redirect()->route('password.request')
                ->withErrors(['message' => 'Too many failed attempts. Please request a new reset code.']);
        }

        $expiresAt = $otpRecord->expires_at->toIso8601String();

        Log::info('Password reset OTP verification form displayed', [
            'email' => $email,
            'attempts_used' => $attemptsUsed,
            'attempts_left' => $attemptsLeft,
            'max_attempts' => $maxAttempts,
        ]);

        return Inertia::render('Auth/VerifyResetOtp', [
            'email' => $email,
            'maskedEmail' => $this->maskEmail($email),
            'expiresAt' => $expiresAt,
            'attemptsLeft' => $attemptsLeft,
            'maxAttempts' => $maxAttempts,
        ]);
    }

    


    /**
     * Get current OTP status (for real-time updates)
     */
  public function getOtpStatus(Request $request)
    {
        $email = Session::get('reset_email');
        
        if (!$email) {
            return response()->json(['error' => 'Invalid session'], 401);
        }

        // Get LATEST OTP record
        $otpRecord = OtpModel::where('email', $email)
            ->where('used_at', null)
            ->where('expires_at', '>', now())
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$otpRecord) {
            return response()->json([
                'valid' => false,
                'message' => 'OTP expired or invalidated',
            ]);
        }

        $maxAttempts = (int)config('security.otp_attempts', 3);
        $attemptsLeft = max(0, $maxAttempts - $otpRecord->attempts);

        return response()->json([
            'valid' => true,
            'expiresAt' => $otpRecord->expires_at->toIso8601String(),
            'attemptsUsed' => $otpRecord->attempts,
            'attemptsLeft' => $attemptsLeft,
            'maxAttempts' => $maxAttempts,
        ]);
    }


/**
     * Verify the OTP for password reset
     */
    public function verifyOtp(Request $request)
    {
        $ip = $request->ip();

        $validated = $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|digits:8',
        ]);

        $email = $validated['email'];
        $otp = $validated['otp'];
        $pendingUserId = Session::get('reset_pending_user_id');
        $resetEmail = Session::get('reset_email');

        $ipKey = 'password_reset_verify:ip:' . $ip;
        $userKey = 'password_reset_verify:user:' . $pendingUserId;

        // Validate session data
        if (!$pendingUserId || !$resetEmail) {
            Log::warning('Missing session data during password reset OTP verification', [
                'ip' => $ip,
            ]);
            
            Session::forget(['reset_pending_user_id', 'reset_email']);
            
            return response()->json([
                'message' => 'Session expired. Please request a new reset.',
            ], 422);
        }

        if ($resetEmail !== $email) {
            Log::warning('Email mismatch in password reset OTP verification', [
                'expected' => $resetEmail,
                'submitted' => $email,
                'ip' => $ip,
            ]);
            
            Session::forget(['reset_pending_user_id', 'reset_email']);
            
            return response()->json([
                'message' => 'Invalid email for this reset request.',
            ], 422);
        }

        // Get LATEST OTP record first
        $otpRecord = OtpModel::where('email', $email)
            ->where('used_at', null)
            ->where('expires_at', '>', now())
            ->orderBy('created_at', 'desc')
            ->first();

        // HARDCODE max attempts to 3 - DO NOT USE CONFIG
        $maxAttempts = 3;

        // If no valid OTP exists, reject
        if (!$otpRecord) {
            Log::warning('No valid OTP found for verification', [
                'email' => $email,
                'ip' => $ip,
            ]);
            
            Session::forget(['reset_pending_user_id', 'reset_email']);
            
            return response()->json([
                'message' => 'Password reset code expired. Please request a new one.'
            ], 422);
        }

        // If max attempts already reached, reject immediately
        if ($otpRecord->attempts >= $maxAttempts) {
            Log::warning('Password reset OTP submission after max attempts reached', [
                'email' => $email,
                'attempts' => $otpRecord->attempts,
                'max_attempts' => $maxAttempts,
                'ip' => $ip,
            ]);

            Session::forget(['reset_pending_user_id', 'reset_email']);
            
            return response()->json([
                'message' => 'Too many failed attempts. Please request a new reset code.',
                'attemptsLeft' => 0,
            ], 422);
        }

        // Rate limiting
        if (RateLimiter::tooManyAttempts($ipKey, 15)) {
            $seconds = RateLimiter::availableIn($ipKey);
            
            Log::warning('Password reset OTP verification rate limited by IP', [
                'ip' => $ip,
                'retry_after' => $seconds,
            ]);

            return response()->json([
                'message' => "Too many verification attempts. Try again in {$seconds} seconds."
            ], 429);
        }

        if (RateLimiter::tooManyAttempts($userKey, 5)) {
            $seconds = RateLimiter::availableIn($userKey);
            
            Log::warning('Password reset OTP verification rate limited by user', [
                'user_id' => $pendingUserId,
                'retry_after' => $seconds,
            ]);

            return response()->json([
                'message' => "Too many verification attempts. Try again in {$seconds} seconds."
            ], 429);
        }

        RateLimiter::hit($ipKey, 30);
        RateLimiter::hit($userKey, 30);

        // Verify OTP in database transaction
        try {
            $otpVerified = DB::transaction(function () use ($email, $otp, $ip) {
                // Get LATEST OTP again with lock
                $otpRecord = OtpModel::where('email', $email)
                    ->where('used_at', null)
                    ->where('expires_at', '>', now())
                    ->orderBy('created_at', 'desc')
                    ->lockForUpdate()
                    ->first();

                if (!$otpRecord) {
                    Log::warning('OTP record not found in transaction', [
                        'email' => $email,
                        'ip' => $ip,
                    ]);
                    return false;
                }

                // Check if already used
                if ($otpRecord->used_at !== null) {
                    Log::warning('Password reset OTP reuse attempt detected', [
                        'email' => $email,
                        'used_at' => $otpRecord->used_at,
                        'ip' => $ip,
                    ]);
                    return false;
                }

                // Check expiration
                if (now()->isAfter($otpRecord->expires_at)) {
                    Log::warning('Expired password reset OTP submission', [
                        'email' => $email,
                        'ip' => $ip,
                    ]);
                    return false;
                }

                // Verify OTP hash
                $secret = config('security.otp_secret');
                if (empty($secret)) {
                    Log::error('OTP_SECRET not configured', ['email' => $email]);
                    return false;
                }

                $formattedOtp = sprintf('%08d', (int)$otp);
                $submittedHash = hash_hmac('sha256', $formattedOtp, $secret);

                Log::info('OTP verification attempt', [
                    'email' => $email,
                    'otp_length' => strlen($otp),
                    'current_attempts' => $otpRecord->attempts,
                ]);

                if (!hash_equals($submittedHash, $otpRecord->code)) {
                    // Invalid OTP - increment attempts
                    $otpRecord->increment('attempts');
                    $otpRecord->refresh();

                    Log::warning('Invalid password reset OTP submitted', [
                        'email' => $email,
                        'attempts_used' => $otpRecord->attempts,
                        'ip' => $ip,
                    ]);

                    return false;
                }

                // OTP is correct - mark as used
                $otpRecord->update([
                    'used_at' => now(),
                    'used_ip' => $ip,
                ]);

                Log::info('Password reset OTP verified successfully', [
                    'email' => $email,
                    'ip' => $ip,
                ]);

                return true;
            });
        } catch (\Throwable $e) {
            Log::error('Database transaction error during password reset OTP verification', [
                'email' => $email,
                'error' => $e->getMessage(),
                'ip' => $ip,
            ]);

            return response()->json([
                'message' => 'Verification failed. Please try again.'
            ], 500);
        }

        // If OTP was successfully verified, redirect to reset form
        if ($otpVerified) {
            Session::put('reset_otp_verified', true);

            Log::info('Password reset OTP verified, ready for new password', [
                'user_id' => $pendingUserId,
                'email' => $email,
                'ip' => $ip,
            ]);

            return response()->json([
                'success' => true,
                'redirect' => route('password.reset.form'),
            ]);
        }

        // OTP verification failed - check latest OTP record and return appropriate error
        $otpRecord = OtpModel::where('email', $email)
            ->where('used_at', null)
            ->where('expires_at', '>', now())
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$otpRecord) {
            Log::info('No valid OTP record found after failed verification', [
                'email' => $email,
                'ip' => $ip,
            ]);
            
            Session::forget(['reset_pending_user_id', 'reset_email']);
            
            return response()->json([
                'message' => 'Password reset code expired. Please request a new one.'
            ], 422);
        }

        $attemptsLeft = max(0, $maxAttempts - $otpRecord->attempts);

        // Check if attempts are NOW exhausted (after just incrementing)
        if ($attemptsLeft <= 0) {
            Log::info('Max OTP attempts reached after this submission', [
                'email' => $email,
                'attempts' => $otpRecord->attempts,
                'max_attempts' => $maxAttempts,
                'ip' => $ip,
            ]);

            Session::forget(['reset_pending_user_id', 'reset_email']);
            
            return response()->json([
                'message' => 'Too many failed attempts. Please request a new reset code.',
                'attemptsLeft' => 0,
            ], 422);
        }

        // Still have attempts remaining
        Log::info('Invalid OTP submitted, attempts remaining', [
            'email' => $email,
            'attempts_left' => $attemptsLeft,
            'ip' => $ip,
        ]);

        return response()->json([
            'message' => 'Invalid OTP. Please try again.',
            'attemptsLeft' => $attemptsLeft,
        ], 422);
    }


    /**
     * Show the password reset form (after OTP verification)
     */
    public function showResetForm()
    {
        $email = Session::get('reset_email');
        $otpVerified = Session::get('reset_otp_verified');

        if (!$email || !$otpVerified) {
            return redirect()->route('password.request');
        }

        return Inertia::render('Auth/ResetPassword', [
            'email' => $email,
            'maskedEmail' => $this->maskEmail($email),
        ]);
    }

    /**
     * Handle the actual password reset
     */
    public function resetPassword(Request $request)
    {
        $ip = $request->ip();
        $email = Session::get('reset_email');
        $otpVerified = Session::get('reset_otp_verified');
        $pendingUserId = Session::get('reset_pending_user_id');

        // Validate session
        if (!$email || !$otpVerified || !$pendingUserId) {
            Log::warning('Unauthorized password reset attempt', [
                'ip' => $ip,
                'has_email' => (bool)$email,
                'has_otp_verified' => (bool)$otpVerified,
            ]);

            Session::forget(['reset_pending_user_id', 'reset_email', 'reset_otp_verified']);
            return back()->withErrors(['message' => 'Invalid reset session. Please try again.']);
        }

        // Validate new password
        $validated = $request->validate([
            'password' => [
                'required',
                'string',
                'min:12',
                'max:72',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,72}$/',
                'confirmed',
            ],
        ], [
            'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
            'password.confirmed' => 'Password confirmation does not match.',
            'password.min' => 'Password must be at least 12 characters.',
        ]);

        try {
            $user = UserModel::find($pendingUserId);

            if (!$user) {
                Log::error('User not found during password reset', [
                    'user_id' => $pendingUserId,
                    'email' => $email,
                    'ip' => $ip,
                ]);

                Session::forget(['reset_pending_user_id', 'reset_email', 'reset_otp_verified']);
                return back()->withErrors(['message' => 'User not found.']);
            }

            if ($user->email !== $email) {
                Log::error('Email mismatch during password reset', [
                    'user_id' => $user->user_id,
                    'expected_email' => $email,
                    'actual_email' => $user->email,
                    'ip' => $ip,
                ]);

                Session::forget(['reset_pending_user_id', 'reset_email', 'reset_otp_verified']);
                return back()->withErrors(['message' => 'Invalid user for this reset request.']);
            }

            // Check if new password is same as old password
            if (Hash::check($validated['password'], $user->password)) {
                Log::warning('Password reset attempted with same password', [
                    'user_id' => $user->user_id,
                    'email' => $email,
                    'ip' => $ip,
                ]);

                return back()->withErrors([
                    'message' => 'New password must be different from your current password.'
                ]);
            }

            // Update password
            $user->update([
                'password' => Hash::make($validated['password']),
            ]);

            // Invalidate all sessions for this user
            DB::table('sessions')
                ->where('user_id', $user->user_id)
                ->delete();

            // Mark the reset OTP as used (it should already be, but just to be safe)
            OtpModel::where('email', $email)
                ->where('used_at', null)
                ->update(['used_at' => now(), 'used_ip' => $ip]);

            // Clear all reset session data
            Session::forget([
                'reset_pending_user_id',
                'reset_email',
                'reset_otp_verified',
            ]);

            RateLimiter::clear('password_reset_request:' . $ip);

            Log::info('Password reset completed successfully', [
                'user_id' => $user->user_id,
                'email' => $email,
                'ip' => $ip,
            ]);

            return redirect()->route('login')
                ->with('message', 'Password reset successfully! Please log in with your new password.');

        } catch (Exception $e) {
            Log::error('Error during password reset', [
                'user_id' => $pendingUserId,
                'email' => $email,
                'error' => $e->getMessage(),
                'ip' => $ip,
            ]);

            return back()->withErrors([
                'message' => 'An error occurred during password reset. Please try again.'
            ]);
        }
    }

    /**
     * Resend OTP for password reset
     */
    public function resendOtp(Request $request)
    {
        $ip = $request->ip();
        $rateLimitKey = 'resend_password_reset_otp:' . $ip;

        if (RateLimiter::tooManyAttempts($rateLimitKey, 5)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);

            Log::warning('Password reset OTP resend rate limited', [
                'ip' => $ip,
                'retry_after' => $seconds,
            ]);

            return response()->json([
                'message' => "Too many resend requests. Try again in {$seconds} seconds."
            ], 429);
        }

        RateLimiter::hit($rateLimitKey, 30);

        $validated = $request->validate(['email' => 'required|email']);
        $email = $validated['email'];

        if (!Session::has('reset_pending_user_id')) {
            Log::warning('Resend password reset OTP without valid session', [
                'email' => $email,
                'ip' => $ip,
            ]);

            return response()->json([
                'message' => 'Invalid session. Please request a new reset.'
            ], 422);
        }

        $sessionEmail = Session::get('reset_email');
        if ($sessionEmail !== $email) {
            Log::warning('Email mismatch in password reset OTP resend', [
                'session_email' => $sessionEmail,
                'submitted_email' => $email,
                'ip' => $ip,
            ]);

            return response()->json([
                'message' => 'Email does not match reset request.'
            ], 422);
        }

        $cooldownKey = 'resend_password_reset_cooldown:' . hash('sha256', $email . $ip);

        if (Cache::has($cooldownKey)) {
            $secondsLeft = Cache::getSeconds($cooldownKey) ?? 30;

            Log::warning('Password reset OTP resend on cooldown', [
                'email' => $email,
                'ip' => $ip,
            ]);

            return response()->json([
                'message' => "Please wait {$secondsLeft} seconds before requesting another OTP."
            ], 429);
        }

        // Delete old OTP before creating new one
        OtpModel::where('email', $email)
            ->where('used_at', null)
            ->delete();

        if (!$this->sendPasswordResetOtp($email)) {
            Log::error('Failed to resend password reset OTP', [
                'email' => $email,
                'ip' => $ip,
            ]);

            return response()->json([
                'message' => 'Failed to send OTP. Please try again.'
            ], 500);
        }

        Cache::put($cooldownKey, true, now()->addSeconds(30));

        $otpRecord = OtpModel::where('email', $email)
            ->where('used_at', null)
            ->orderBy('created_at', 'desc')
            ->first();

        Log::info('Password reset OTP resent successfully', [
            'email' => $email,
            'ip' => $ip,
        ]);

        return response()->json([
            'message' => 'OTP resent successfully! Check your email.',
            'expiresAt' => $otpRecord?->expires_at?->toIso8601String(),
        ]);
    }

    /**
     * Send password reset OTP via email
     */
    protected function sendPasswordResetOtp($email)
    {
        // DELETE ALL OLD OTP RECORDS FIRST - this is critical!
        OtpModel::where('email', $email)->delete();

        $resendKey = 'password_reset_otp_resend:' . hash('sha256', $email);

        if (Cache::has($resendKey)) {
            Log::warning('Password reset OTP resend rate limited', [
                'email' => $email,
            ]);
            return false;
        }

        $otp = sprintf('%08d', random_int(0, 99999999));

        $secret = config('security.otp_secret');
        if (empty($secret)) {
            Log::error('OTP_SECRET not configured in .env file');
            return false;
        }

        $otpHash = hash_hmac('sha256', $otp, $secret);
        $otpLifetime = 5; // minutes - hardcoded since config seems broken
        $expiresAt = now()->addMinutes($otpLifetime);

        try {
            // Make absolutely sure no old records exist
            OtpModel::where('email', $email)->delete();

            // Create fresh OTP with attempts = 0
            $otpRecord = OtpModel::create([
                'email' => $email,
                'code' => $otpHash,
                'expires_at' => $expiresAt,
                'attempts' => 0,  // Always start fresh
                'used_at' => null,
                'used_ip' => null,
                'resend_count' => 1,
            ]);

            Cache::put($resendKey, true, now()->addSeconds(30));

            $user = UserModel::where('email', $email)->first();
            $userName = $user ? $user->name : 'User';

            try {
                Mail::to($email)->send(new \App\Mail\PasswordResetOtpMail($otp, $userName, $expiresAt));

                Log::info('Password reset OTP sent successfully', [
                    'email' => $email,
                    'otp_id' => $otpRecord->id,
                    'attempts' => $otpRecord->attempts,
                    'expires_at' => $expiresAt,
                ]);

                return true;
            } catch (Exception $e) {
                Log::error('Failed to send password reset OTP email', [
                    'email' => $email,
                    'error' => $e->getMessage(),
                ]);

                $otpRecord->delete();
                return false;
            }
        } catch (Exception $e) {
            Log::error('Failed to create password reset OTP record', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }


    /**
     * Mask email for display (e.g., u***r@g***l.com)
     */
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
}