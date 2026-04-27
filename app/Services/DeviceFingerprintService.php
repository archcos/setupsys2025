<?php

namespace App\Services;

use Illuminate\Http\Request;
use App\Models\SavedDeviceModel;
use Illuminate\Support\Facades\Log;

class DeviceFingerprintService
{
    private const FINGERPRINT_VERSION = 3; // Bumped version due to removing IP
    private const TRUST_DURATION_DAYS = 90;
    private const MAX_FINGERPRINT_AGE_DAYS = 365;
    private const ENTROPY_THRESHOLD = 0.01; // HTTP headers are naturally low-entropy text

    /**
     * Generate multi-layered device fingerprint with versioning
     * NOTE: IP address intentionally excluded - it changes on network/restart
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

  

private static function normalizeComponents(array $components): array
{
    return [
        'user_agent'      => strtolower(trim($components['user_agent'])),
        'accept'          => strtolower(trim($components['accept'])),
        'accept_language' => strtolower(trim($components['accept_language'])),
        'accept_encoding' => strtolower(trim($components['accept_encoding'])),
        'http_version'    => $components['http_version'],
        'platform_info'   => $components['platform_info'],
        'ch_platform'     => $components['ch_platform'],
        'ch_mobile'       => $components['ch_mobile'],
        'ch_ua'           => $components['ch_ua'],
        'sec_fetch_site'  => $components['sec_fetch_site'],
        'sec_fetch_mode'  => $components['sec_fetch_mode'],
        'sec_fetch_dest'  => $components['sec_fetch_dest'],
        'header_order'    => $components['header_order'],
    ];
}

private static function relaxComponents(array $components): array
{
    $relaxed = $components;

    // UA → stable platform_info only (no version numbers)
    $relaxed['user_agent'] = $components['platform_info'];

    // Language → strip region ("en-US" → "en")
    $langs = explode(',', $components['accept_language']);
    $relaxed['accept_language'] = trim(explode('-', trim($langs[0]))[0]);

    // These vary by entry point / VPN routing
    $relaxed['sec_fetch_site'] = 'any';
    $relaxed['sec_fetch_dest'] = 'any';
    $relaxed['sec_fetch_mode'] = 'any';

    // Accept header has minor variation between versions
    $relaxed['accept'] = 'any';

    // ch_platform, ch_mobile, ch_ua — already stable, keep as-is
    // header_order — engine-level, keep as-is

    return $relaxed;
}

private static function sanitizeUserAgent(string $ua): string
{
    $ua = preg_replace('/WebKit\/[\d.]+/', 'WebKit/X', $ua);
    $ua = preg_replace('/Safari\/[\d.]+/', 'Safari/X', $ua);
    $ua = preg_replace('/Chrome\/[\d.]+/', 'Chrome/X', $ua);
    $ua = preg_replace('/Firefox\/[\d.]+/', 'Firefox/X', $ua);
    $ua = preg_replace('/\s+/', ' ', trim($ua));
    return $ua;
}

private static function normalizeClientHint(string $ch): string
{
    preg_match_all('/"([^"]+)";v="\d+"/', $ch, $matches);
    $brands = array_map('strtolower', $matches[1] ?? []);
    $brands = array_filter($brands, fn($b) => !str_contains($b, 'not'));
    sort($brands);
    return implode(',', $brands) ?: 'unknown';
}

private static function extractHeaderOrder(Request $request): string
{
    $tracked = [
        'host', 'user-agent', 'accept', 'accept-language',
        'accept-encoding', 'sec-fetch-site', 'sec-fetch-mode',
        'sec-ch-ua', 'sec-ch-ua-platform', 'sec-ch-ua-mobile',
    ];
    $present = array_filter(
        $tracked,
        fn($h) => $request->headers->has($h)
    );
    return implode(',', array_values($present));
}

private static function extractPlatformHints(string $ua): string
{
    $hints = [];
    if (str_contains($ua, 'Windows')) $hints[] = 'windows';
    if (str_contains($ua, 'Mac'))     $hints[] = 'macos';
    if (str_contains($ua, 'Linux'))   $hints[] = 'linux';
    if (str_contains($ua, 'iPhone'))  $hints[] = 'ios';
    if (str_contains($ua, 'Android')) $hints[] = 'android';
    if (str_contains($ua, 'Chrome'))  $hints[] = 'chrome';
    if (str_contains($ua, 'Firefox')) $hints[] = 'firefox';
    if (str_contains($ua, 'Safari'))  $hints[] = 'safari';
    if (str_contains($ua, 'Edg'))     $hints[] = 'edge';

    return implode('|', $hints) ?: 'unknown';
}
    private static function calculateEntropy(array $components): float
    {
        $entropy = 0;
        $totalWeight = 0;
        
       $weights = [
            'user_agent'      => 0.20, // sanitized, less unique now
            'accept_language' => 0.10,
            'accept_encoding' => 0.05,
            'http_version'    => 0.05,
            'platform_info'   => 0.15, // stable and meaningful
            'ch_platform'     => 0.15, // very stable OS signal
            'ch_ua'           => 0.10, // browser family
            'header_order'    => 0.15, // engine-level, hard to spoof
            'sec_fetch_mode'  => 0.05,
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
            
            // Try relaxed match (e.g., browser updated from Chrome 120.0.1 to 120.0.2)
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

        // Device recognized and trusted - update last usage
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