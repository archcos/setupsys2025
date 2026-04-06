<?php

namespace App\Http\Controllers;

use App\Models\OtpModel;
use App\Models\UserModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Exception;
use Inertia\Inertia;

class PasswordResetController extends Controller
{
    // =========================================================================
    // STEP 1 — Show request form
    // =========================================================================

    public function showRequestForm()
    {
        return Inertia::render('RequestPasswordReset');
    }

    // =========================================================================
    // STEP 2 — Handle initial reset request
    // =========================================================================

    public function requestReset(Request $request)
    {
        $ip = $request->ip();

        // Per-IP cap: 3 initial requests per minute
        $ipKey = 'password_reset_request:ip:' . $ip;
        if (RateLimiter::tooManyAttempts($ipKey, 3)) {
            $seconds = RateLimiter::availableIn($ipKey);
            return back()->withErrors([
                'login' => "Too many reset requests. Try again in {$seconds} seconds.",
            ]);
        }
        RateLimiter::hit($ipKey, 60);

        $validated = $request->validate([
            'login' => 'required|string|max:255',
        ], [
            'login.required' => 'Please enter your email or username.',
        ]);

        $user = UserModel::where('email', $validated['login'])
            ->orWhere('username', $validated['login'])
            ->first();

        Log::info('Password reset requested', [
            'login'      => $validated['login'],
            'user_found' => (bool) $user,
            'ip'         => $ip,
        ]);

        // Always return the same response — prevents user enumeration
        if (!$user) {
            return back()->with('message', 'If an account exists with that email or username, you will receive a password reset OTP shortly.');
        }

        // ------------------------------------------------------------------
        // Load the latest OTP row for this email regardless of state.
        // resend_count on this row is the authoritative abuse counter and
        // survives expiry, failed attempts, and refreshes.
        // ------------------------------------------------------------------
        $existing = OtpModel::getLatest($user->email, OtpModel::TYPE_RESET);

        if ($existing && $existing->isResendLocked()) {
            $seconds = $existing->resendLockedForSeconds();
            Log::warning('Initial reset request blocked by resend lock', [
                'email'        => $user->email,
                'otp_type'     => OtpModel::TYPE_RESET,
                'resend_count' => $existing->resend_count,
                'locked_for'   => $seconds,
                'ip'           => $ip,
            ]);
            return back()->withErrors([
                'login' => "Too many reset requests. Try again in {$seconds} seconds.",
            ]);
        }

        // Check cooldown (time since last OTP was sent/refreshed)
        if ($existing && $existing->isWithinCooldown()) {
            $seconds = $existing->cooldownRemainingSeconds();
            return back()->withErrors([
                'login' => "Please wait {$seconds} seconds before requesting another OTP.",
            ]);
        }

        if (!$this->issueOtp($user->email, $existing, $ip)) {
            return back()->withErrors(['login' => 'Failed to send reset code. Please try again.']);
        }

        Session::put('reset_pending_user_id', $user->user_id);
        Session::put('reset_email', $user->email);
        Session::put('reset_otp_type', OtpModel::TYPE_RESET);

        return redirect()->route('password.reset.verify-form');
    }

    // =========================================================================
    // STEP 3 — Show OTP verification form
    // =========================================================================

    public function showVerifyForm()
    {
        $email   = Session::get('reset_email');
        $otpType = Session::get('reset_otp_type', OtpModel::TYPE_RESET);

        if (!$email) {
            return redirect()->route('password.request');
        }

        $otpRecord = OtpModel::getActive($email, $otpType);

        if (!$otpRecord) {
            Session::forget(['reset_pending_user_id', 'reset_email', 'reset_otp_type']);
            return redirect()->route('password.request')
                ->withErrors(['message' => 'Password reset code expired. Please request a new one.']);
        }

        $maxAttempts  = (int) config('security.otp_attempts');
        $attemptsLeft = max(0, $maxAttempts - $otpRecord->attempts);

        if ($attemptsLeft <= 0) {
            Session::forget(['reset_pending_user_id', 'reset_email', 'reset_otp_type']);
            return redirect()->route('password.request')
                ->withErrors(['message' => 'Too many failed attempts. Please request a new reset code.']);
        }

        return Inertia::render('Auth/VerifyResetOtp', [
            'email'        => $email,
            'maskedEmail'  => $this->maskEmail($email),
            'expiresAt'    => $otpRecord->expires_at->toIso8601String(),
            'attemptsLeft' => $attemptsLeft,
            'maxAttempts'  => $maxAttempts,
        ]);
    }

    // =========================================================================
    // STEP 4 — Real-time OTP status (AJAX polling)
    // =========================================================================

    public function getOtpStatus(Request $request)
    {
        $email   = Session::get('reset_email');
        $otpType = Session::get('reset_otp_type', OtpModel::TYPE_RESET);

        if (!$email) {
            return response()->json(['error' => 'Invalid session'], 401);
        }

        $otpRecord = OtpModel::getActive($email, $otpType);
        if (!$otpRecord) {
            return response()->json(['valid' => false, 'message' => 'OTP expired or invalidated']);
        }

        $maxAttempts  = (int) config('security.otp_attempts');
        $attemptsLeft = max(0, $maxAttempts - $otpRecord->attempts);

        return response()->json([
            'valid'        => true,
            'expiresAt'    => $otpRecord->expires_at->toIso8601String(),
            'attemptsUsed' => $otpRecord->attempts,
            'attemptsLeft' => $attemptsLeft,
            'maxAttempts'  => $maxAttempts,
        ]);
    }

    // =========================================================================
    // STEP 5 — Verify OTP
    // =========================================================================

    public function verifyOtp(Request $request)
    {
        $ip = $request->ip();

        $validated = $request->validate([
            'email' => 'required|email',
            'otp'   => 'required|string|digits:8',
        ]);

        $email         = $validated['email'];
        $otp           = $validated['otp'];
        $pendingUserId = Session::get('reset_pending_user_id');
        $resetEmail    = Session::get('reset_email');
        $otpType       = Session::get('reset_otp_type', OtpModel::TYPE_RESET);

        // Session guards
        if (!$pendingUserId || !$resetEmail) {
            Session::forget(['reset_pending_user_id', 'reset_email', 'reset_otp_type']);
            return response()->json(['message' => 'Session expired. Please request a new reset.'], 422);
        }

        if ($resetEmail !== $email) {
            Session::forget(['reset_pending_user_id', 'reset_email', 'reset_otp_type']);
            return response()->json(['message' => 'Invalid email for this reset request.'], 422);
        }

        // Per-IP and per-user rate limits
        $ipKey   = 'password_reset_verify:ip:'   . $ip;
        $userKey = 'password_reset_verify:user:' . $pendingUserId;

        if (RateLimiter::tooManyAttempts($ipKey, 15)) {
            $seconds = RateLimiter::availableIn($ipKey);
            return response()->json(['message' => "Too many verification attempts. Try again in {$seconds} seconds."], 429);
        }
        if (RateLimiter::tooManyAttempts($userKey, 5)) {
            $seconds = RateLimiter::availableIn($userKey);
            return response()->json(['message' => "Too many verification attempts. Try again in {$seconds} seconds."], 429);
        }

        $maxAttempts = (int) config('security.otp_attempts');
        $otpRecord   = OtpModel::getActive($email, $otpType);

        if (!$otpRecord) {
            Session::forget(['reset_pending_user_id', 'reset_email', 'reset_otp_type']);
            return response()->json(['message' => 'Password reset code expired. Please request a new one.'], 422);
        }

        if ($otpRecord->attempts >= $maxAttempts) {
            return response()->json(['message' => 'Too many failed attempts. Please request a new reset code.', 'attemptsLeft' => 0], 422);
        }

        RateLimiter::hit($ipKey,   30);
        RateLimiter::hit($userKey, 30);

        // Verify inside a transaction with a row lock
        try {
            $otpVerified = DB::transaction(function () use ($email, $otp, $otpType, $ip, $maxAttempts) {
                $record = OtpModel::where('email', $email)
                    ->where('otp_type', $otpType)
                    ->whereNull('used_at')
                    ->where('expires_at', '>', now())
                    ->orderBy('created_at', 'desc')
                    ->lockForUpdate()
                    ->first();

                if (!$record) {
                    return false;
                }

                if ($record->attempts >= $maxAttempts) {
                    return false;
                }

                $secret = config('security.otp_secret');
                if (empty($secret)) {
                    Log::error('OTP_SECRET not configured');
                    return false;
                }

                $submittedHash = hash_hmac('sha256', sprintf('%08d', (int) $otp), $secret);

                if (!hash_equals($submittedHash, $record->code)) {
                    // Wrong code — only increment attempts, keep the row alive
                    $record->incrementAttempts();
                    Log::warning('Invalid OTP submitted', [
                        'email'    => $email,
                        'otp_type' => $otpType,
                        'attempts' => $record->fresh()->attempts,
                        'ip'       => $ip,
                    ]);
                    return false;
                }

                // Correct code — mark as used, leave the row (deleted on reset)
                $record->markAsUsed($ip);
                Log::info('OTP verified successfully', [
                    'email'    => $email,
                    'otp_type' => $otpType,
                    'ip'       => $ip,
                ]);
                return true;
            });
        } catch (\Throwable $e) {
            Log::error('DB error during OTP verification', [
                'email'    => $email,
                'otp_type' => $otpType,
                'error'    => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Verification failed. Please try again.'], 500);
        }

        if ($otpVerified) {
            $verificationToken = hash_hmac('sha256', $email . $pendingUserId, config('app.key'));
            Session::put('reset_otp_verified', $verificationToken);

            return response()->json(['success' => true, 'redirect' => route('password.reset.form')]);
        }

        // Failed — return fresh attempt count
        $fresh        = OtpModel::getActive($email, $otpType);
        $attemptsLeft = $fresh ? max(0, $maxAttempts - $fresh->attempts) : 0;

        if ($attemptsLeft <= 0) {
            return response()->json(['message' => 'Too many failed attempts. Please request a new reset code.', 'attemptsLeft' => 0], 422);
        }

        return response()->json(['message' => 'Invalid OTP. Please try again.', 'attemptsLeft' => $attemptsLeft], 422);
    }

    // =========================================================================
    // STEP 6 — Show new-password form (after OTP verified)
    // =========================================================================

    public function showResetForm()
    {
        $email         = Session::get('reset_email');
        $pendingUserId = Session::get('reset_pending_user_id');
        $storedToken   = Session::get('reset_otp_verified');

        if (!$email || !$pendingUserId || !$storedToken) {
            Session::forget(['reset_pending_user_id', 'reset_email', 'reset_otp_type', 'reset_otp_verified']);
            return redirect()->route('password.request');
        }

        $expectedToken = hash_hmac('sha256', $email . $pendingUserId, config('app.key'));
        if (!hash_equals($expectedToken, $storedToken)) {
            Session::forget(['reset_pending_user_id', 'reset_email', 'reset_otp_type', 'reset_otp_verified']);
            return redirect()->route('password.request');
        }

        return Inertia::render('Auth/ResetPassword', [
            'email'       => $email,
            'maskedEmail' => $this->maskEmail($email),
        ]);
    }

    // =========================================================================
    // STEP 7 — Perform the actual password reset
    // =========================================================================

    public function resetPassword(Request $request)
    {
        $ip            = $request->ip();
        $email         = Session::get('reset_email');
        $pendingUserId = Session::get('reset_pending_user_id');
        $otpType       = Session::get('reset_otp_type', OtpModel::TYPE_RESET);
        $storedToken   = Session::get('reset_otp_verified');

        if (!$email || !$pendingUserId || !$storedToken) {
            Session::forget(['reset_pending_user_id', 'reset_email', 'reset_otp_type', 'reset_otp_verified']);
            return back()->withErrors(['message' => 'Invalid reset session. Please try again.']);
        }

        $expectedToken = hash_hmac('sha256', $email . $pendingUserId, config('app.key'));
        if (!hash_equals($expectedToken, $storedToken)) {
            Session::forget(['reset_pending_user_id', 'reset_email', 'reset_otp_type', 'reset_otp_verified']);
            return back()->withErrors(['message' => 'Invalid reset session. Please try again.']);
        }

        $validated = $request->validate([
            'password' => [
                'required', 'string', 'min:12', 'max:72',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,72}$/',
                'confirmed',
            ],
        ], [
            'password.regex'     => 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
            'password.confirmed' => 'Password confirmation does not match.',
            'password.min'       => 'Password must be at least 12 characters.',
        ]);

        try {
            $user = UserModel::find($pendingUserId);

            if (!$user || $user->email !== $email) {
                Session::forget(['reset_pending_user_id', 'reset_email', 'reset_otp_type', 'reset_otp_verified']);
                return back()->withErrors(['message' => 'Invalid user for this reset request.']);
            }

            if (Hash::check($validated['password'], $user->password)) {
                return back()->withErrors(['message' => 'New password must be different from your current password.']);
            }

            $user->update(['password' => Hash::make($validated['password'])]);

            // Get location from IP (cached)
            $locationData = $this->getLocationFromIp($ip);

            // Notification email (non-fatal)
            try {
                Mail::to($user->email)->send(
                    new \App\Mail\PasswordChangedMail(
                        $user->name,
                        $user->email,
                        $ip,
                        $locationData
                    )
                );
            } catch (Exception $e) {
                Log::warning('Failed to send password-changed notification', [
                    'user_id' => $user->user_id,
                    'error'   => $e->getMessage(),
                ]);
            }

            // Invalidate all active sessions for this user
            DB::table('sessions')->where('user_id', $user->user_id)->delete();

            // ------------------------------------------------------------------
            // DELETE ALL OTP rows for this email on successful reset.
            // Wipes resend_count too — clean slate for any future reset.
            // Nothing from this session can be replayed.
            // ------------------------------------------------------------------
            OtpModel::deleteAllForEmail($email);

            Session::forget(['reset_pending_user_id', 'reset_email', 'reset_otp_type', 'reset_otp_verified']);
            RateLimiter::clear('password_reset_request:ip:' . $ip);

            Log::info('Password reset completed — all OTP rows deleted', [
                'user_id' => $user->user_id,
                'email'   => $email,
                'otp_type' => $otpType,
                'ip'      => $ip,
            ]);

            return redirect()->route('login')
                ->with('message', 'Password reset successfully! Please log in with your new password.');

        } catch (Exception $e) {
            Log::error('Error during password reset', [
                'user_id' => $pendingUserId,
                'error'   => $e->getMessage(),
            ]);
            return back()->withErrors(['message' => 'An error occurred during password reset. Please try again.']);
        }
    }

    // =========================================================================
    // RESEND OTP
    // =========================================================================

    public function resendOtp(Request $request)
    {
        $ip = $request->ip();

        $validated = $request->validate(['email' => 'required|email']);
        $email     = $validated['email'];
        $otpType   = Session::get('reset_otp_type', OtpModel::TYPE_RESET);

        // Session guards
        if (!Session::has('reset_pending_user_id') || Session::get('reset_email') !== $email) {
            return response()->json(['message' => 'Invalid session. Please request a new reset.'], 422);
        }

        // ------------------------------------------------------------------
        // Always load via getLatest() — we need resend_count even if the
        // current OTP is expired or already used.
        // ------------------------------------------------------------------
        $otpRecord = OtpModel::getLatest($email, $otpType);

        if (!$otpRecord) {
            return response()->json(['message' => 'Invalid session. Please request a new reset.'], 422);
        }

        // 1. Hard lock: resend_count >= MAX_RESENDS within the last hour
        if ($otpRecord->isResendLocked()) {
            $seconds = $otpRecord->resendLockedForSeconds();
            Log::warning('Resend blocked by resend lock', [
                'email'        => $email,
                'otp_type'     => $otpType,
                'resend_count' => $otpRecord->resend_count,
                'locked_for'   => $seconds,
                'ip'           => $ip,
            ]);
            return response()->json([
                'message' => "Too many resend requests. Please wait {$seconds} seconds before trying again.",
            ], 429);
        }

        // 2. Per-resend cooldown (based on updated_at)
        if ($otpRecord->isWithinCooldown()) {
            $seconds = $otpRecord->cooldownRemainingSeconds();
            return response()->json([
                'message' => "Please wait {$seconds} seconds before requesting another OTP.",
            ], 429);
        }

        // 3. Per-IP rate limit (secondary defence against distributed abuse)
        $ipKey = 'resend_password_reset_otp:ip:' . $ip;
        if (RateLimiter::tooManyAttempts($ipKey, 10)) {
            $seconds = RateLimiter::availableIn($ipKey);
            return response()->json([
                'message' => "Too many resend requests. Try again in {$seconds} seconds.",
            ], 429);
        }

        $secret = config('security.otp_secret');
        if (empty($secret)) {
            Log::error('OTP_SECRET not configured');
            return response()->json(['message' => 'Failed to send OTP. Please try again.'], 500);
        }

        // ------------------------------------------------------------------
        // Refresh the SAME row in-place:
        //   - New code + hash
        //   - attempts reset to 0
        //   - resend_count incremented (never reset until successful reset)
        //   - updated_at touched (controls cooldown and lock window)
        // ------------------------------------------------------------------
        $otp = $otpRecord->refreshCode($secret);

        try {
            $user     = UserModel::where('email', $email)->first();
            $userName = $user ? $user->name : 'User';
            Mail::to($email)->send(
                new \App\Mail\PasswordResetOtpMail($otp, $userName, $otpRecord->expires_at)
            );
        } catch (Exception $e) {
            Log::error('Failed to send resend OTP email', [
                'email'    => $email,
                'otp_type' => $otpType,
                'error'    => $e->getMessage(),
            ]);
            // Roll back the resend_count bump — email never went out
            $otpRecord->decrement('resend_count');
            return response()->json(['message' => 'Failed to send OTP. Please try again.'], 500);
        }

        // Hit IP limiter only after confirmed successful send
        RateLimiter::hit($ipKey, 60);

        Log::info('OTP resent successfully', [
            'email'        => $email,
            'otp_type'     => $otpType,
            'resend_count' => $otpRecord->resend_count,
            'ip'           => $ip,
        ]);

        return response()->json([
            'message'   => 'OTP resent successfully! Check your email.',
            'expiresAt' => $otpRecord->expires_at->toIso8601String(),
        ]);
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * Issue an OTP for the given email.
     *
     * If a row already exists (any state — expired, used, active): refresh
     * it in-place so resend_count keeps accumulating across the entire session.
     *
     * If no row exists (first-ever request or cleaned up after a successful
     * reset): create a fresh row with resend_count = 1.
     */
    private function issueOtp(string $email, ?OtpModel $existing, string $ip): bool
    {
        $secret = config('security.otp_secret');
        if (empty($secret)) {
            Log::error('OTP_SECRET not configured');
            return false;
        }

        if ($existing) {
            $otp       = $existing->refreshCode($secret);
            $otpRecord = $existing;
        } else {
            $otp = sprintf('%08d', random_int(0, 99999999));

            try {
                $otpRecord = OtpModel::create([
                    'email'        => $email,
                    'otp_type'     => OtpModel::TYPE_RESET,
                    'code'         => hash_hmac('sha256', $otp, $secret),
                    'expires_at'   => now()->addMinutes(5),
                    'attempts'     => 0,
                    'used_at'      => null,
                    'used_ip'      => null,
                    'resend_count' => 1,
                ]);
            } catch (Exception $e) {
                Log::error('Failed to create OTP record', [
                    'email'    => $email,
                    'otp_type' => OtpModel::TYPE_RESET,
                    'error'    => $e->getMessage(),
                ]);
                return false;
            }
        }

        try {
            $user     = UserModel::where('email', $email)->first();
            $userName = $user ? $user->name : 'User';
            Mail::to($email)->send(
                new \App\Mail\PasswordResetOtpMail($otp, $userName, $otpRecord->expires_at)
            );
            Log::info('OTP issued', [
                'email'        => $email,
                'otp_type'     => OtpModel::TYPE_RESET,
                'resend_count' => $otpRecord->resend_count,
                'ip'           => $ip,
            ]);
            return true;
        } catch (Exception $e) {
            Log::error('Failed to send OTP email', [
                'email'    => $email,
                'otp_type' => OtpModel::TYPE_RESET,
                'error'    => $e->getMessage(),
            ]);
            // Roll back so a retry starts clean
            if (!$existing) {
                $otpRecord->delete();
            } else {
                $otpRecord->decrement('resend_count');
            }
            return false;
        }
    }

    /**
     * Get location data from IP address using ip-api.com
     * Results are cached for 24 hours
     */
    private function getLocationFromIp(string $ip): array
    {
        // Check cache first
        $cacheKey = "ip_location:{$ip}";
        $cached = Cache::get($cacheKey);
        if ($cached) {
            return $cached;
        }

        try {
            $response = Http::timeout(5)->get("https://ip-api.com/json/{$ip}?fields=status,country,city,regionName,isp");

            if ($response->successful()) {
                $data = $response->json();

                if ($data['status'] === 'success') {
                    $locationData = [
                        'country'   => $data['country'] ?? 'Unknown',
                        'city'      => $data['city'] ?? 'Unknown',
                        'region'    => $data['regionName'] ?? '',
                        'isp'       => $data['isp'] ?? 'Unknown',
                        'ip'        => $ip,
                        'detected'  => true,
                    ];

                    // Cache for 24 hours
                    Cache::put($cacheKey, $locationData, 86400);
                    return $locationData;
                }
            }
        } catch (\Exception $e) {
            Log::warning('Failed to get location from IP', [
                'ip'    => $ip,
                'error' => $e->getMessage(),
            ]);
        }

        // Fallback if service unavailable
        return [
            'country'  => 'Unknown',
            'city'     => 'Unknown',
            'region'   => '',
            'isp'      => 'Unknown',
            'ip'       => $ip,
            'detected' => false,
        ];
    }

    /**
     * Mask email for display — e.g. u***r@g***l.com
     */
    protected function maskEmail(string $email): string
    {
        if (empty($email)) return '';

        $parts = explode('@', $email);
        if (count($parts) !== 2) return $email;

        [$local, $domain] = $parts;

        $localLen    = strlen($local);
        $maskedLocal = $localLen > 2
            ? $local[0] . str_repeat('*', $localLen - 2) . $local[$localLen - 1]
            : $local[0] . '*';

        $domainParts  = explode('.', $domain);
        $domainName   = $domainParts[0];
        $extension    = $domainParts[1] ?? '';
        $domainLen    = strlen($domainName);
        $maskedDomain = $domainLen > 2
            ? $domainName[0] . str_repeat('*', $domainLen - 2) . $domainName[$domainLen - 1]
            : $domainName[0] . '*';

        return $maskedLocal . '@' . $maskedDomain . ($extension ? '.' . $extension : '');
    }
}