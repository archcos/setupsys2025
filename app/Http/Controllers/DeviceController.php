<?php

namespace App\Http\Controllers;

use App\Models\SavedDeviceModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class DeviceController extends Controller
{
    /**
     * List all devices for authenticated user
     */
    public function list()
    {
        $user = Auth::user();
        
        $devices = SavedDeviceModel::where('user_id', $user->user_id)
            ->orderBy('last_used_at', 'desc')
            ->get()
            ->map(function ($device) {
                return [
                    'id' => $device->id,
                    'name' => $device->device_name ?? 'Unknown Device',
                    'ip' => $device->ip_address,
                    'fingerprint' => substr($device->device_fingerprint, 0, 16) . '...',
                    'last_used' => $device->last_used_at?->diffForHumans(),
                    'trust_expires' => $device->trust_expires_at?->format('M d, Y'),
                    'is_trusted' => $device->isTrustValid(),
                    'status' => $device->isTrustValid() ? 'trusted' : 'expired',
                ];
            });
        
        return inertia('Settings/Devices', [
            'devices' => $devices,
            'total_devices' => count($devices),
        ]);
    }

    /**
     * Revoke device trust (user-initiated)
     */
    public function revoke(Request $request, $deviceId)
    {
        $user = Auth::user();
        
        $device = SavedDeviceModel::where('id', $deviceId)
            ->where('user_id', $user->user_id)
            ->firstOrFail();
        
        $device->revoke();
        
        Log::info('Device trust revoked by user', [
            'user_id' => $user->user_id,
            'device_id' => $deviceId,
            'device_name' => $device->device_name,
            'ip' => $request->ip(),
        ]);
        
        return back()->with('success', 'Device trust revoked. You will need to verify with OTP on next login from this device.');
    }

    /**
     * Automatically revoke old/expired devices (admin/cron job)
     */
    public function cleanupExpiredDevices()
    {
        $expired = SavedDeviceModel::expired()->get();
        
        foreach ($expired as $device) {
            $device->revoke();
            
            Log::info('Expired device auto-revoked', [
                'user_id' => $device->user_id,
                'device_id' => $device->id,
                'expired_at' => $device->trust_expires_at,
            ]);
        }
        
        return response()->json([
            'message' => count($expired) . ' expired devices revoked',
            'count' => count($expired),
        ]);
    }

    /**
     * Handle device login with trust checking
     */
    public function checkDeviceTrust($fingerprint, $userEmail, $ip)
    {
        $user = \App\Models\UserModel::where('email', $userEmail)->first();
        
        if (!$user) {
            return [
                'trusted' => false,
                'reason' => 'User not found',
            ];
        }
        
        $device = SavedDeviceModel::where('user_id', $user->user_id)
            ->where('device_fingerprint', $fingerprint)
            ->first();
        
        // Device not found
        if (!$device) {
            return [
                'trusted' => false,
                'reason' => 'New device detected',
            ];
        }
        
        // Device trust expired
        if (!$device->isTrustValid()) {
            return [
                'trusted' => false,
                'reason' => 'Device trust expired',
            ];
        }
        
        // Check if IP changed significantly (different subnet)
        if (!$device->isFromSameSubnet($ip)) {
            Log::warning('Device IP changed significantly', [
                'user_id' => $user->user_id,
                'device_id' => $device->id,
                'old_ip' => $device->ip_address,
                'new_ip' => $ip,
            ]);
            
            // Require OTP verification even for trusted device
            return [
                'trusted' => false,
                'reason' => 'IP address changed - OTP required',
                'require_otp' => true,
            ];
        }
        
        // Device is trusted - update last used time
        $device->updateLastUsed();
        $device->extendTrust(90); // Extend trust for another 90 days
        
        return [
            'trusted' => true,
            'device_id' => $device->id,
        ];
    }

    /**
     * Get device statistics for security dashboard
     */
    public function getDeviceStats()
    {
        $user = Auth::user();
        
        $totalDevices = SavedDeviceModel::where('user_id', $user->user_id)->count();
        $trustedDevices = SavedDeviceModel::where('user_id', $user->user_id)->trusted()->count();
        $expiredDevices = SavedDeviceModel::where('user_id', $user->user_id)->expired()->count();
        $recentDevices = SavedDeviceModel::where('user_id', $user->user_id)
            ->activeInDays(7)
            ->count();
        
        return response()->json([
            'total' => $totalDevices,
            'trusted' => $trustedDevices,
            'expired' => $expiredDevices,
            'recently_used' => $recentDevices,
        ]);
    }
}