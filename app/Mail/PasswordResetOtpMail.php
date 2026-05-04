<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Carbon\Carbon;

class PasswordResetOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public $otp;
    public $userName;
    public $expiresAt;

    /**
     * Create a new message instance.
     *
     * @param string $otp
     * @param string|null $userName
     * @param Carbon|null $expiresAt
     */
    public function __construct($otp, $userName = null, $expiresAt = null)
    {
        $this->otp = $otp;
        $this->userName = $userName ?? 'User';
        $this->expiresAt = $expiresAt ?? now()->addMinutes(5);
    }

    public function build()
    {
        // Attach PNG images
        $this->attach(resource_path('assets/SETUP_logo.png'), [
            'as' => 'setup_logo.png',
            'mime' => 'image/png',
        ]);

        $this->attach(resource_path('assets/logo.png'), [
            'as' => 'logo.png',
            'mime' => 'image/png',
        ]);

        $otp = htmlspecialchars($this->otp);
        $userName = htmlspecialchars($this->userName);
        
        $expiryDateTime = $this->expiresAt->format('F d, Y \a\t h:i A T');
        $currentDate = Carbon::now()->format('F d, Y \a\t h:i A');
        $currentYear = Carbon::now()->year;

        $htmlContent = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        </head>
        <body style='margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif;'>
            <div style='max-width:580px;margin:32px auto;'>

                <!-- Header -->
                <div style='padding:28px 36px 24px;'>
                    <h1 style='margin:0 0 6px;font-size:20px;font-weight:600;color:#111827;'>Password Reset Request</h1>
                    <p style='margin:0;font-size:13px;color:#9ca3af;'>Sent {$currentDate}</p>
                </div>

                <!-- Card -->
                <div style='background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:0 0 24px;'>

                    <!-- Greeting -->
                    <div style='padding:24px 36px;border-bottom:1px solid #f3f4f6;'>
                        <p style='margin:0;font-size:14px;color:#6b7280;line-height:1.7;'>
                            Hello <strong style='color:#111827;font-weight:600;'>{$userName}</strong>,<br><br>
                            A password reset has been requested for your account. Use the verification code below to complete the process.
                        </p>
                    </div>

                    <!-- OTP Code Section -->
                    <div style='padding:28px 36px;background:#fafafa;border-bottom:1px solid #f3f4f6;text-align:center;'>
                        <p style='margin:0 0 12px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.6px;font-weight:600;'>Password reset code</p>
                        <div style='background:#ffffff;border:2px solid #e5e7eb;border-radius:8px;padding:16px;margin:12px 0;'>
                            <p style='margin:0;font-size:32px;font-weight:700;letter-spacing:6px;color:#111827;font-family:\"Courier New\",monospace;'>{$otp}</p>
                        </div>
                        <p style='margin:12px 0 0;font-size:12px;color:#9ca3af;'>Expires in 5 minutes</p>
                    </div>

                    <!-- Details Section -->
                    <div style='background:#fafafa;border-bottom:1px solid #f3f4f6;padding:12px 18px;'>
                        <p style='margin:0;font-size:12px;color:#9ca3af;font-weight:500;'>Reset details</p>
                    </div>

                    <!-- Details Rows -->
                    <table style='width:100%;border-collapse:collapse;'>
                        <tr style='border-bottom:1px solid #f9fafb;'>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;width:35%;'>Request time</td>
                            <td style='padding:12px 18px;font-size:13px;color:#111827;text-align:right;'>{$currentDate}</td>
                        </tr>
                        <tr style='border-bottom:1px solid #f9fafb;'>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;'>Expires at</td>
                            <td style='padding:12px 18px;font-size:13px;color:#dc2626;font-weight:600;text-align:right;'>{$expiryDateTime}</td>
                        </tr>
                        <tr>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;'>Status</td>
                            <td style='padding:12px 18px;font-size:13px;color:#111827;text-align:right;'>Pending verification</td>
                        </tr>
                    </table>

                </div>

                <!-- Security Notice -->
                <div style='background:#fef3c7;border-left:4px solid #f59e0b;padding:16px 20px;margin:0 0 24px;border-radius:6px;'>
                    <p style='margin:0 0 8px;font-size:13px;color:#92400e;font-weight:600;'>🔒 Security Reminder</p>
                    <p style='margin:0;font-size:12px;color:#92400e;line-height:1.6;'>
                        Never share this code with anyone. If you didn't request this reset, secure your account immediately by contacting system support.
                    </p>
                </div>

                <!-- Closing -->
                <div style='padding:0 36px 24px;'>
                    <p style='margin:0;font-size:13px;color:#6b7280;line-height:1.7;'>
                        For security purposes, this code can only be used once and will expire after {$expiryDateTime}.<br>
                        <span style='color:#9ca3af;'>— SETUP-RPMU</span>
                    </p>
                </div>

                <!-- Footer with Logos -->
                <div style='padding:24px 36px;border-top:1px solid #e5e7eb;text-align:center;'>
                    <table style='width:100%;border-collapse:collapse;margin:0 auto 16px;'>
                        <tr>
                            <td style='width:50%;text-align:center;padding:0 12px;'>
                                <img src='cid:setup_logo.png' alt='SETUP Logo'
                                    style='height:36px;width:auto;display:inline-block;'>
                            </td>
                            <td style='width:1px;padding:0;background:#e5e7eb;'>&nbsp;</td>
                            <td style='width:50%;text-align:center;padding:0 12px;'>
                                <img src='cid:logo.png' alt='DOST Logo'
                                    style='height:36px;width:auto;display:inline-block;'>
                            </td>
                        </tr>
                    </table>
                    <p style='margin:0 0 4px;font-size:11px;color:#9ca3af;text-align:center;'>
                        SETUP Information Management System (SIMS) · DOST Northern Mindanao
                    </p>
                    <p style='margin:0;font-size:11px;color:#9ca3af;text-align:center;'>
                        © {$currentYear} All rights reserved · Do not reply to this email
                    </p>
                </div>

            </div>
        </body>
        </html>
        ";

        return $this->subject('[DOSTNM-SIMS] Password Reset Code')
                    ->html($htmlContent);
    }
}