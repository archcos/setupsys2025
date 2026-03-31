<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OtpModel extends Model
{
    protected $table = 'tbl_otp_records';
    protected $primaryKey = 'id';
    protected $fillable = [
        'email',
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

    /**
     * Scope: Get active (unused) OTPs
     */
    public function scopeActive($query)
    {
        return $query->whereNull('used_at')
            ->where('expires_at', '>', now());
    }

    /**
     * Scope: Get expired OTPs
     */
    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now());
    }

    /**
     * Check if OTP is still valid (not expired, not used, attempts available)
     */
    public function isValid(int $maxAttempts = 3): bool
    {
        return $this->used_at === null
            && now()->isBefore($this->expires_at)
            && $this->attempts < $maxAttempts;
    }

    /**
     * Mark as used (called by verifyOtp)
     */
    public function markAsUsed(string $ip): void
    {
        $this->update([
            'used_at' => now(),
            'used_ip' => $ip,
        ]);
    }

    /**
     * Increment attempts safely
     */
    public function incrementAttempts(): void
    {
        $this->increment('attempts');
    }

    /**
     * Refresh the OTP code and expiry in place.
     * Resets attempts to 0, increments resend_count, preserves everything else.
     * Returns the plain-text OTP so the caller can email it.
     */
    public function refreshCode(string $secret, int $expiryMinutes = 5): string
    {
        $otp            = sprintf('%08d', random_int(0, 99999999));
        $hash           = hash_hmac('sha256', $otp, $secret);
        $this->code       = $hash;
        $this->expires_at = now()->addMinutes($expiryMinutes);
        $this->attempts   = 0;
        $this->used_at    = null;
        $this->used_ip    = null;
        $this->resend_count = $this->resend_count + 1;
        $this->save();

        return $otp;
    }
}