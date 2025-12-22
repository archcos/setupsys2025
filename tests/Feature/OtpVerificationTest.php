<?php

namespace Tests\Feature;

use App\Models\UserModel;
use App\Models\OtpModel;
use Tests\TestCase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class OtpVerificationTest extends TestCase
{
    // Test: OTP verification with invalid code
    public function test_verify_otp_with_invalid_code()
    {
        $user = UserModel::create([
            'username' => 'testuser',
            'password' => Hash::make('SecurePassword123!'),
            'email' => 'test@example.com',
            'status' => 'active',
            'role' => 'user',
        ]);

        $secret = config('security.otp_secret');
        $otpHash = hash_hmac('sha256', '12345678', $secret);

        OtpModel::create([
            'email' => 'test@example.com',
            'code' => $otpHash,
            'expires_at' => now()->addMinutes(5),
            'attempts' => 0,
        ]);

        $this->session([
            'pending_user_id' => $user->user_id,
            'otp_email' => 'test@example.com',
            'device_fingerprint' => json_encode([
                'fingerprint' => 'test_fingerprint',
                'fingerprint_relaxed' => 'test_relaxed',
                'entropy_score' => 85,
            ]),
        ]);

        $response = $this->post('/verify-otp', [
            'email' => 'test@example.com',
            'otp' => '87654321', // Wrong code
        ]);

        $response->assertSessionHasErrors('message');
        
        // CORRECT WAYS TO CHECK USER IS NOT AUTHENTICATED:
        
        // Method 1: Check Auth facade
        $this->assertFalse(Auth::check());
        
        // Method 2: Assert guest
        $this->assertGuest();
        
        // Method 3: Assert null user
        $this->assertNull(Auth::user());
    }

    // Test: OTP verification successful
    public function test_verify_otp_with_valid_code()
    {
        $user = UserModel::create([
            'username' => 'testuser',
            'password' => Hash::make('SecurePassword123!'),
            'email' => 'test@example.com',
            'status' => 'active',
            'role' => 'user',
        ]);

        $otp = '12345678';
        $secret = config('security.otp_secret');
        $otpHash = hash_hmac('sha256', $otp, $secret);

        OtpModel::create([
            'email' => 'test@example.com',
            'code' => $otpHash,
            'expires_at' => now()->addMinutes(5),
            'attempts' => 0,
        ]);

        $this->session([
            'pending_user_id' => $user->user_id,
            'otp_email' => 'test@example.com',
            'device_fingerprint' => json_encode([
                'fingerprint' => 'test_fingerprint',
                'fingerprint_relaxed' => 'test_relaxed',
                'entropy_score' => 85,
            ]),
        ]);

        $response = $this->post('/verify-otp', [
            'email' => 'test@example.com',
            'otp' => $otp,
        ]);

        $response->assertRedirect();
        
        // CORRECT WAYS TO CHECK USER IS AUTHENTICATED:
        
        // Method 1: Assert authenticated
        $this->assertAuthenticated();
        
        // Method 2: Assert authenticated as specific user
        $this->assertAuthenticatedAs($user);
        
        // Method 3: Check Auth facade
        $this->assertTrue(Auth::check());
        $this->assertEquals($user->user_id, Auth::user()->user_id);
    }

    // Test: User is guest (not authenticated)
    public function test_unauthenticated_user_cannot_access_dashboard()
    {
        $response = $this->get('/user/dashboard');

        // Multiple ways to assert guest:
        $this->assertGuest();
        $this->assertFalse(Auth::check());
        $this->assertNull(Auth::user());
        
        $response->assertRedirect('/login');
    }

    // Test: Authenticated user can access dashboard
    public function test_authenticated_user_can_access_dashboard()
    {
        $user = UserModel::create([
            'username' => 'testuser',
            'password' => Hash::make('SecurePassword123!'),
            'email' => 'test@example.com',
            'status' => 'active',
            'role' => 'user',
        ]);

        $response = $this->actingAs($user)->get('/user/dashboard');

        $this->assertAuthenticated();
        $this->assertAuthenticatedAs($user);
        $response->assertSuccessful();
    }

    // Test: Logout clears authentication
    public function test_logout_clears_authentication()
    {
        $user = UserModel::create([
            'username' => 'testuser',
            'password' => Hash::make('SecurePassword123!'),
            'email' => 'test@example.com',
            'status' => 'active',
            'role' => 'user',
        ]);

        $this->actingAs($user)->post('/logout');

        // After logout, user should not be authenticated
        $this->assertGuest();
        $this->assertFalse(Auth::check());
        $this->assertNull(Auth::user());
    }
}