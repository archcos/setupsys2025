<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class OtpModel extends Model
{
    protected $table      = 'tbl_otp_records';
    protected $primaryKey = 'id';

    protected $fillable = [
        'email',
        'otp_type',
        'code',
        'expires_at',
        'attempts',
        'used_at',
        'used_ip',
        'resend_count',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at'    => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    /** OTP Types */
    public const TYPE_LOGIN = 'login';
    public const TYPE_RESET = 'reset';

    public const VALID_TYPES = [
        self::TYPE_LOGIN,
        self::TYPE_RESET,
    ];

    /** Max resends before the 1-hour lockout kicks in. */
    public const MAX_RESENDS = 3;

    /** Lock duration (seconds) after MAX_RESENDS is reached. */
    public const RESEND_LOCK_SECONDS = 3600;

    /** Minimum gap (seconds) between consecutive resend requests. */
    public const RESEND_COOLDOWN_SECONDS = 60;

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeActive($query)
    {
        return $query->whereNull('used_at')->where('expires_at', '>', now());
    }

    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now());
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('otp_type', $type);
    }

    public function scopeLogin($query)
    {
        return $query->where('otp_type', self::TYPE_LOGIN);
    }

    public function scopeReset($query)
    {
        return $query->where('otp_type', self::TYPE_RESET);
    }

    // -------------------------------------------------------------------------
    // State helpers
    // -------------------------------------------------------------------------

    /**
     * Can this OTP still be verified?
     */
    public function isValid(int $maxAttempts): bool
    {
        return $this->used_at === null
            && now()->isBefore($this->expires_at)
            && $this->attempts < $maxAttempts;
    }

    /**
     * Is resending blocked because MAX_RESENDS was reached within the last hour?
     * The lock is measured from updated_at so every refresh extends the window.
     */
    public function isResendLocked(): bool
    {
        if ($this->resend_count < self::MAX_RESENDS) {
            return false;
        }

        return now()->isBefore(
            $this->updated_at->copy()->addSeconds(self::RESEND_LOCK_SECONDS)
        );
    }

    /**
     * Seconds remaining on the resend lock. 0 if not locked.
     */
    public function resendLockedForSeconds(): int
    {
        if (!$this->isResendLocked()) {
            return 0;
        }

        return (int) now()->diffInSeconds(
            $this->updated_at->copy()->addSeconds(self::RESEND_LOCK_SECONDS),
            absolute: false
        );
    }

    /**
     * Was the per-resend cooldown respected?
     * Returns false if the user is requesting another resend too soon.
     */
    public function isWithinCooldown(): bool
    {
        return now()->isBefore(
            $this->updated_at->copy()->addSeconds(self::RESEND_COOLDOWN_SECONDS)
        );
    }

    /**
     * Seconds remaining on the per-resend cooldown. 0 if cooldown has passed.
     */
    public function cooldownRemainingSeconds(): int
    {
        if (!$this->isWithinCooldown()) {
            return 0;
        }

        return (int) now()->diffInSeconds(
            $this->updated_at->copy()->addSeconds(self::RESEND_COOLDOWN_SECONDS),
            absolute: false
        );
    }

    // -------------------------------------------------------------------------
    // Mutations
    // -------------------------------------------------------------------------

    /**
     * Refresh the OTP in-place:
     *   - New code + hash
     *   - Reset attempts to 0
     *   - Bump resend_count (never reset — this is the abuse counter)
     *   - Touch updated_at (Laravel does this automatically on save())
     *
     * Returns the plain-text OTP so the caller can email it.
     */
    public function refreshCode(string $secret, int $expiryMinutes = 5): string
    {
        $otp = sprintf('%08d', random_int(0, 99999999));

        $this->code         = hash_hmac('sha256', $otp, $secret);
        $this->expires_at   = now()->addMinutes($expiryMinutes);
        $this->attempts     = 0;
        $this->used_at      = null;
        $this->used_ip      = null;
        $this->resend_count = $this->resend_count + 1;
        $this->save(); // touches updated_at

        return $otp;
    }

    /**
     * Mark as used.
     */
    public function markAsUsed(string $ip): void
    {
        $this->update([
            'used_at' => now(),
            'used_ip' => $ip,
        ]);
    }

    /**
     * Increment failed attempts.
     */
    public function incrementAttempts(): void
    {
        $this->increment('attempts');
    }

    // -------------------------------------------------------------------------
    // Bulk operations
    // -------------------------------------------------------------------------

    /**
     * Delete ALL OTP rows for an email (used on successful password reset).
     * This wipes every record including past failed/resent ones so there is
     * no trace of previous attempts and nothing can be replayed.
     */
    public static function deleteAllForEmail(string $email): void
    {
        static::where('email', $email)->delete();
    }

    /**
     * Get the single active (unused, unexpired) OTP for an email.
     * We expect at most one row per email since we always update in-place.
     */
    public static function getActive(string $email, ?string $type = null): ?static
    {
        $query = static::where('email', $email)
            ->whereNull('used_at')
            ->where('expires_at', '>', now());

        if ($type !== null) {
            $query->where('otp_type', $type);
        }

        return $query->orderBy('created_at', 'desc')->first();
    }

    /**
     * Get ANY row for this email regardless of used/expired state.
     * Used to read resend_count even after expiry.
     */
    public static function getLatest(string $email, ?string $type = null): ?static
    {
        $query = static::where('email', $email);

        if ($type !== null) {
            $query->where('otp_type', $type);
        }

        return $query->orderBy('updated_at', 'desc')->first();
    }
}