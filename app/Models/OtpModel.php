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
        'used_at' => 'datetime',
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
}