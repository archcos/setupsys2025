<?php

return [
    'alert_emails' => env('SECURITY_ALERT_EMAILS', [
        'arjay.charcos25@gmail.com',
        'rain.shigatsu@gmail.com',
    ]),
    'otp_secret' => env('OTP_SECRET'),
    'otp_lifetime' => env('OTP_LIFETIME'),
    'otp_attempts' => env('OTP_MAX_ATTEMPTS'),

    
    // --- brute force: how many total OTP failures before an email is locked out ---
    // Across ALL sessions/resends. Attacker gets 3 attempts × 3 resends = 9 tries
    // before hitting this. Set lower than 9 to close that window.
    'otp_email_lockout_threshold' => env('OTP_EMAIL_LOCKOUT_THRESHOLD', 10),
 
    // --- brute force: how long the email lockout lasts (minutes) ---
    'otp_email_lockout_minutes' => env('OTP_EMAIL_LOCKOUT_MINUTES', 60),
 
    // --- daily cap: max reset requests an email can trigger in one calendar day ---
    // Prevents sustained multi-day campaigns even without triggering the lockout.
    'otp_max_daily_requests' => env('OTP_MAX_DAILY_REQUESTS', 10),
];
