<?php

namespace App\Services;

use Illuminate\Http\Request;
use App\Models\SavedDeviceModel;
use Illuminate\Support\Facades\Log;

class DeviceFingerprintService
{
    private const FINGERPRINT_VERSION = 1;
    private const TRUST_DURATION_DAYS = 90;
    private const MAX_FINGERPRINT_AGE_DAYS = 365;
    private const ENTROPY_THRESHOLD = 0.01; // HTTP headers are naturally low-entropy text

    /**
     * Generate multi-layered device fingerprint with versioning
     */
    public static function generateFingerprint(Request $request): array
    {
        $components = self::extractComponents($request);
        $normalizedComponents = self::normalizeComponents($components);
        
        // PRIMARY FINGERPRINT (strict - must be consistent)
        $fingerprintString = implode('|', [
            self::FINGERPRINT_VERSION,
            ...array_values($normalizedComponents),
        ]);
        
        // SECONDARY FINGERPRINT (relaxed - allows updates)
        $relaxedString = implode('|', [
            self::FINGERPRINT_VERSION,
            ...self::relaxComponents($normalizedComponents),
        ]);
        
        $fingerprint = hash('sha256', $fingerprintString);
        $fingerprintRelaxed = hash('sha256', $relaxedString);
        
        // DEBUG: Log the actual fingerprint components
        Log::debug('🔍 FINGERPRINT GENERATION', [
            'fingerprint_string' => $fingerprintString,
            'fingerprint_hash' => $fingerprint,
            'fingerprint_relaxed' => $fingerprintRelaxed,
            'components' => $normalizedComponents,
        ]);
        
        return [
            'fingerprint' => $fingerprint,
            'fingerprint_relaxed' => $fingerprintRelaxed,
            'components_hash' => hash('sha256', json_encode($normalizedComponents)),
            'entropy_score' => self::calculateEntropy($normalizedComponents),
            'components' => $normalizedComponents,
            'version' => self::FINGERPRINT_VERSION,
        ];
    }

    private static function extractComponents(Request $request): array
    {
        return [
            'user_agent' => self::sanitizeUserAgent($request->header('User-Agent', '')),
            'accept_language' => $request->header('Accept-Language', 'unknown'),
            'accept_encoding' => $request->header('Accept-Encoding', 'unknown'),
            'tls_cipher' => $_SERVER['SSL_CIPHER'] ?? 'unknown',
            'tls_version' => $_SERVER['SSL_PROTOCOL'] ?? 'unknown',
            'http_version' => $_SERVER['SERVER_PROTOCOL'] ?? 'HTTP/1.1',
            'platform_info' => self::extractPlatformHints($request->header('User-Agent', '')),
            'ipv4_subnet' => self::getIPv4Subnet($request->ip()),
            'ipv6_prefix' => self::getIPv6Prefix($request->ip()),
        ];
    }

    private static function normalizeComponents(array $components): array
    {
        return [
            'user_agent' => strtolower(trim($components['user_agent'])),
            'accept_language' => strtolower(trim($components['accept_language'])),
            'accept_encoding' => strtolower(trim($components['accept_encoding'])),
            'tls_cipher' => $components['tls_cipher'],
            'tls_version' => $components['tls_version'],
            'http_version' => $components['http_version'],
            'platform_info' => $components['platform_info'],
            'ipv4_subnet' => $components['ipv4_subnet'],
            'ipv6_prefix' => $components['ipv6_prefix'],
        ];
    }

    private static function relaxComponents(array $components): array
    {
        $relaxed = $components;
        
        if (preg_match('/Chrome\/(\d+)/', $components['user_agent'], $m)) {
            $relaxed['user_agent'] = preg_replace('/Chrome\/\d+\.\d+\.\d+/', 'Chrome/' . $m[1], $components['user_agent']);
        }
        if (preg_match('/Firefox\/(\d+)/', $components['user_agent'], $m)) {
            $relaxed['user_agent'] = preg_replace('/Firefox\/\d+\.\d+/', 'Firefox/' . $m[1], $components['user_agent']);
        }
        if (preg_match('/Version\/(\d+)/', $components['user_agent'], $m)) {
            $relaxed['user_agent'] = preg_replace('/Version\/\d+\.\d+/', 'Version/' . $m[1], $components['user_agent']);
        }
        
        $langs = explode(',', $components['accept_language']);
        $relaxed['accept_language'] = trim($langs[0]);
        
        return $relaxed;
    }

    private static function calculateEntropy(array $components): float
    {
        $entropy = 0;
        $totalWeight = 0;
        
        $weights = [
            'user_agent' => 0.25,
            'accept_language' => 0.15,
            'accept_encoding' => 0.1,
            'tls_cipher' => 0.2,
            'http_version' => 0.15,
            'platform_info' => 0.15,
        ];
        
        foreach ($weights as $key => $weight) {
            if (!isset($components[$key])) continue;
            
            $value = $components[$key];
            $length = strlen($value);
            $uniqueChars = count(array_unique(str_split($value)));
            
            $componentEntropy = ($uniqueChars / 256);
            $entropy += $componentEntropy * $weight;
            $totalWeight += $weight;
        }
        
        return $totalWeight > 0 ? $entropy / $totalWeight : 0;
    }

    private static function sanitizeUserAgent(string $ua): string
    {
        $ua = preg_replace('/WebKit\/[\d.]+/', 'WebKit/X', $ua);
        $ua = preg_replace('/\s+/', ' ', trim($ua));
        return $ua;
    }

    private static function extractPlatformHints(string $ua): string
    {
        $hints = [];
        if (strpos($ua, 'Windows') !== false) $hints[] = 'windows';
        if (strpos($ua, 'Mac') !== false) $hints[] = 'macos';
        if (strpos($ua, 'Linux') !== false) $hints[] = 'linux';
        if (strpos($ua, 'iPhone') !== false) $hints[] = 'ios';
        if (strpos($ua, 'Android') !== false) $hints[] = 'android';
        if (strpos($ua, 'Chrome') !== false) $hints[] = 'chrome';
        if (strpos($ua, 'Firefox') !== false) $hints[] = 'firefox';
        if (strpos($ua, 'Safari') !== false) $hints[] = 'safari';
        
        return implode('|', $hints) ?: 'unknown';
    }

    private static function getIPv4Subnet(?string $ip): string
    {
        if (!$ip || !filter_var($ip, FILTER_VALIDATE_IP, ['flags' => FILTER_FLAG_IPV4])) {
            return 'unknown';
        }
        $parts = explode('.', $ip);
        return implode('.', array_slice($parts, 0, 3));
    }

    private static function getIPv6Prefix(?string $ip): string
    {
        if (!$ip || !filter_var($ip, FILTER_VALIDATE_IP, ['flags' => FILTER_FLAG_IPV6])) {
            return 'unknown';
        }
        $parts = explode(':', $ip);
        return implode(':', array_slice($parts, 0, 4));
    }

    public static function verifyDevice(
        string $userId,
        array $currentFingerprint,
        string $currentIp
    ): array {
        Log::info('🔐 VERIFY DEVICE START', [
            'user_id' => $userId,
            'current_fp_strict' => substr($currentFingerprint['fingerprint'], 0, 16) . '...',
            'current_fp_relaxed' => substr($currentFingerprint['fingerprint_relaxed'], 0, 16) . '...',
            'ip' => $currentIp,
            'entropy' => $currentFingerprint['entropy_score'],
        ]);

        // Skip entropy check for HTTP headers (they're naturally low-entropy text)
        // Entropy checking is more relevant for client-side fingerprinting,
        // not server-side HTTP header analysis

        // Try strict match first
        $device = SavedDeviceModel::where('user_id', $userId)
            ->where('device_fingerprint', $currentFingerprint['fingerprint'])
            ->first();

        if ($device) {
            Log::info('✅ STRICT MATCH FOUND', [
                'device_id' => $device->id,
                'saved_at' => $device->created_at,
            ]);
        } else {
            Log::warning('❌ NO STRICT MATCH', [
                'looking_for' => substr($currentFingerprint['fingerprint'], 0, 16) . '...',
            ]);
            
            // Try relaxed match
            $device = SavedDeviceModel::where('user_id', $userId)
                ->where('device_fingerprint_relaxed', $currentFingerprint['fingerprint_relaxed'])
                ->first();
            
            if ($device) {
                Log::info('✅ RELAXED MATCH FOUND (browser update)', [
                    'device_id' => $device->id,
                ]);
            }
        }

        if (!$device) {
            Log::warning('❌ NO DEVICE FOUND', [
                'user_id' => $userId,
                'all_devices' => SavedDeviceModel::where('user_id', $userId)->get(['id', 'device_fingerprint', 'device_fingerprint_relaxed', 'created_at'])->toArray(),
            ]);
            
            return [
                'recognized' => false,
                'reason' => 'UNKNOWN_DEVICE',
                'require_mfa' => true,
                'log_event' => true,
                'threat_level' => 'low',
            ];
        }

        // Check trust validity
        if (!$device->is_trusted || $device->trust_expires_at?->isPast()) {
            Log::warning('❌ TRUST EXPIRED', [
                'is_trusted' => $device->is_trusted,
                'expires_at' => $device->trust_expires_at,
            ]);
            return [
                'recognized' => false,
                'reason' => 'TRUST_EXPIRED',
                'require_mfa' => true,
                'log_event' => true,
                'threat_level' => 'low',
            ];
        }

        // Device recognized and trusted
        Log::info('✅ DEVICE VERIFIED - SKIPPING MFA', [
            'device_id' => $device->id,
            'device_name' => $device->device_name,
        ]);
        
        $device->update([
            'last_used_at' => now(),
            'last_ip' => $currentIp,
            'trust_expires_at' => now()->addDays(self::TRUST_DURATION_DAYS),
        ]);

        return [
            'recognized' => true,
            'reason' => 'TRUSTED_DEVICE',
            'require_mfa' => false,
            'log_event' => false,
            'threat_level' => 'low',
        ];
    }

    public static function registerDevice(
        string $userId,
        array $fingerprint,
        string $ip,
        string $deviceName = null
    ): SavedDeviceModel {
        Log::info('💾 REGISTERING DEVICE', [
            'user_id' => $userId,
            'fingerprint' => substr($fingerprint['fingerprint'], 0, 16) . '...',
            'device_name' => $deviceName,
        ]);

        SavedDeviceModel::where('user_id', $userId)
            ->where('device_fingerprint', $fingerprint['fingerprint'])
            ->delete();

        $device = SavedDeviceModel::create([
            'user_id' => $userId,
            'device_fingerprint' => $fingerprint['fingerprint'],
            'device_fingerprint_relaxed' => $fingerprint['fingerprint_relaxed'],
            'components_hash' => $fingerprint['components_hash'],
            'device_name' => $deviceName ?? 'Unknown Device',
            'last_ip' => $ip,
            'last_used_at' => now(),
            'trust_expires_at' => now()->addDays(self::TRUST_DURATION_DAYS),
            'is_trusted' => true,
            'fingerprint_version' => $fingerprint['version'],
        ]);

        Log::info('✅ DEVICE REGISTERED', [
            'device_id' => $device->id,
            'expires' => $device->trust_expires_at,
        ]);

        return $device;
    }
}