<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class SavedDeviceModel extends Model
{
    use LogsActivity;
    
    protected $table = 'tbl_saveddevices';
    protected $primaryKey = 'id';
    protected $fillable = [
        'user_id',
        'device_name',
        'device_fingerprint',           // SHA256 hash (strict matching)
        'device_fingerprint_relaxed',   // SHA256 hash (fuzzy matching - allows updates)
        'components_hash',              // Hash of fingerprint components for logging
        'ip_address',                   // Deprecated - kept for backwards compatibility
        'last_ip',                      // Current IP address being used
        'last_used_at',
        'trust_expires_at',
        'is_trusted',
        'fingerprint_version',          // Version of fingerprinting algorithm used
    ];

    protected $casts = [
        'last_used_at' => 'datetime',
        'trust_expires_at' => 'datetime',
        'is_trusted' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected static function boot() {
        parent::boot();
        static::creating(function ($model) {
            if (!$model->trust_expires_at) {
                $model->trust_expires_at = now()->addDays(90);
            }
            if (!$model->fingerprint_version) {
                $model->fingerprint_version = 1;
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(UserModel::class, 'user_id', 'user_id');
    }

    /**
     * Scope: Get trusted devices that haven't expired
     */
    public function scopeTrusted($query)
    {
        return $query->where('is_trusted', true)
            ->where('trust_expires_at', '>', now());
    }

    /**
     * Scope: Get expired trusted devices
     */
    public function scopeExpired($query)
    {
        return $query->where('trust_expires_at', '<=', now());
    }

    /**
     * Scope: Get devices used within X days
     */
    public function scopeActiveInDays($query, $days = 30)
    {
        return $query->where('last_used_at', '>=', now()->subDays($days));
    }

    /**
     * Scope: Get devices by fingerprint (supports both strict and relaxed)
     */
    public function scopeByFingerprint($query, $fingerprint)
    {
        return $query->where('device_fingerprint', $fingerprint)
            ->orWhere('device_fingerprint_relaxed', $fingerprint);
    }

    /**
     * Scope: Get devices by user and fingerprint
     */
    public function scopeForUserByFingerprint($query, $userId, $fingerprint)
    {
        return $query->where('user_id', $userId)
            ->where(function ($q) use ($fingerprint) {
                $q->where('device_fingerprint', $fingerprint)
                  ->orWhere('device_fingerprint_relaxed', $fingerprint);
            });
    }

    /**
     * Check if device trust is still valid
     */
    public function isTrustValid(): bool
    {
        return $this->is_trusted 
            && $this->trust_expires_at 
            && $this->trust_expires_at->isFuture();
    }

    /**
     * Check if device is from the same subnet (resilient to minor IP changes)
     */
    public function isFromSameSubnet($newIp): bool
    {
        $oldSubnet = $this->getSubnet($this->last_ip ?? $this->ip_address);
        $newSubnet = $this->getSubnet($newIp);
        return $oldSubnet === $newSubnet && $oldSubnet !== 'unknown';
    }

    /**
     * Check if device is the same version
     * Useful when you update fingerprinting algorithm
     */
    public function isSameVersion($version = 1): bool
    {
        return $this->fingerprint_version === $version;
    }

    /**
     * Get IPv4 subnet (first 3 octets: X.X.X)
     */
    protected function getSubnet($ip): string
    {
        if (!$ip) {
            return 'unknown';
        }

        // Handle IPv4
        if (filter_var($ip, FILTER_VALIDATE_IP, ['flags' => FILTER_FLAG_IPV4])) {
            $parts = explode('.', $ip);
            return implode('.', array_slice($parts, 0, 3));
        }

        // Handle IPv6 (first 64 bits / 4 hextets)
        if (filter_var($ip, FILTER_VALIDATE_IP, ['flags' => FILTER_FLAG_IPV6])) {
            $parts = explode(':', $ip);
            return implode(':', array_slice($parts, 0, 4));
        }

        return 'unknown';
    }

    /**
     * Update last used timestamp
     */
    public function updateLastUsed(): void
    {
        $this->update(['last_used_at' => now()]);
    }

    /**
     * Extend trust period and update last used
     */
    public function extendTrust($days = 90): void
    {
        $this->update([
            'trust_expires_at' => now()->addDays($days),
            'last_used_at' => now(),
        ]);
    }

    /**
     * Revoke device trust
     */
    public function revoke(): void
    {
        $this->update([
            'is_trusted' => false,
            'trust_expires_at' => now(),
        ]);
    }

    /**
     * Mark device as suspicious (don't trust, but keep record)
     */
    public function markSuspicious(): void
    {
        $this->update([
            'is_trusted' => false,
        ]);
    }

    /**
     * Get days until trust expires
     */
    public function daysUntilExpiry(): ?int
    {
        if (!$this->trust_expires_at) {
            return null;
        }

        $diff = $this->trust_expires_at->diffInDays(now(), false);
        return max(0, $diff);
    }

    /**
     * Check if device should trigger additional verification
     * (e.g., significant IP change, old fingerprint version)
     */
    public function shouldRequireReVerification(): bool
    {
        // Re-verify if trust expires soon
        if ($this->daysUntilExpiry() <= 7) {
            return true;
        }

        // Re-verify if using old fingerprint version
        if (!$this->isSameVersion(1)) {
            return true;
        }

        // Re-verify if hasn't been used in 60 days
        if ($this->last_used_at && $this->last_used_at->diffInDays(now()) > 60) {
            return true;
        }

        return false;
    }
}