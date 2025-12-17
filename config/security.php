<?php

return [
    'alert_emails' => env('SECURITY_ALERT_EMAILS', [
        'arjay.charcos25@gmail.com',
        'rain.shigatsu@gmail.com',
    ]),
    'otp_secret' => env('OTP_SECRET'),
    'otp_lifetime' => env('OTP_LIFETIME'),
    'otp_attempts' => env('OTP_ATTEMPTS'),
];