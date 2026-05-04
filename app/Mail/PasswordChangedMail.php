<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Carbon\Carbon;

class PasswordChangedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $userName;
    public $email;
    public $ip;
    public $location;

    public function __construct($userName, $email, $ip, $location = [])
    {
        $this->userName = $userName;
        $this->email = $email;
        $this->ip = $ip;
        $this->location = $location;
    }

    public function build()
    {
        $this->attach(resource_path('assets/SETUP_logo.png'), [
            'as' => 'setup_logo.png',
            'mime' => 'image/png',
        ]);

        $this->attach(resource_path('assets/logo.png'), [
            'as' => 'logo.png',
            'mime' => 'image/png',
        ]);

        $userName = htmlspecialchars($this->userName);
        $email = htmlspecialchars($this->email);
        $ip = htmlspecialchars($this->ip);
        $changedAt = Carbon::now()->format('F d, Y \a\t h:i A');
        $currentYear = Carbon::now()->year;

        // Extract location data
        $country = htmlspecialchars($this->location['country'] ?? 'Unknown');
        $city = htmlspecialchars($this->location['city'] ?? 'Unknown');
        $region = htmlspecialchars($this->location['region'] ?? '');
        $isp = htmlspecialchars($this->location['isp'] ?? 'Unknown');
        $detected = $this->location['detected'] ?? false;

        $locationDisplay = $city . ($region ? ', ' . $region : '') . ', ' . $country;

        // Build location rows HTML
        $locationRowsHtml = $detected
            ? "
                <tr style='border-bottom:1px solid #f9fafb;'>
                    <td style='padding:12px 18px;font-size:13px;color:#9ca3af;width:35%;'>Location</td>
                    <td style='padding:12px 18px;font-size:13px;color:#111827;text-align:right;'>{$locationDisplay}</td>
                </tr>
                <tr style='border-bottom:1px solid #f9fafb;'>
                    <td style='padding:12px 18px;font-size:13px;color:#9ca3af;'>ISP</td>
                    <td style='padding:12px 18px;font-size:13px;color:#111827;text-align:right;'>{$isp}</td>
                </tr>
            "
            : "
                <tr style='border-bottom:1px solid #f9fafb;'>
                    <td style='padding:12px 18px;font-size:13px;color:#9ca3af;'>Location</td>
                    <td style='padding:12px 18px;font-size:13px;color:#9ca3af;text-align:right;'>Unavailable</td>
                </tr>
            ";

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
                    <h1 style='margin:0 0 6px;font-size:20px;font-weight:600;color:#111827;'>Password Changed Successfully</h1>
                    <p style='margin:0;font-size:13px;color:#9ca3af;'>Sent {$changedAt}</p>
                </div>

                <!-- Card -->
                <div style='background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:0 0 24px;'>

                    <!-- Greeting -->
                    <div style='padding:24px 36px;border-bottom:1px solid #f3f4f6;'>
                        <p style='margin:0;font-size:14px;color:#6b7280;line-height:1.7;'>
                            Hello <strong style='color:#111827;font-weight:600;'>{$userName}</strong>,<br><br>
                            This confirms that your SIMS account password has been successfully changed. You can now log in with your new password.
                        </p>
                    </div>

                    <!-- Status Badge -->
                    <div style='padding:16px 36px;background:#f0fdf4;border-bottom:1px solid #f3f4f6;'>
                        <p style='margin:0;font-size:13px;color:#16a34a;font-weight:600;'>✓ Password updated successfully</p>
                    </div>

                    <!-- Change Details Label -->
                    <div style='background:#fafafa;border-bottom:1px solid #f3f4f6;padding:12px 18px;'>
                        <p style='margin:0;font-size:12px;color:#9ca3af;font-weight:500;'>Change details</p>
                    </div>

                    <!-- Change Details Rows -->
                    <table style='width:100%;border-collapse:collapse;'>
                        <tr style='border-bottom:1px solid #f9fafb;'>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;width:35%;'>Account</td>
                            <td style='padding:12px 18px;font-size:13px;color:#111827;font-weight:500;text-align:right;word-break:break-word;'>{$email}</td>
                        </tr>
                        <tr style='border-bottom:1px solid #f9fafb;'>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;'>Changed at</td>
                            <td style='padding:12px 18px;font-size:13px;color:#111827;text-align:right;'>{$changedAt}</td>
                        </tr>
                        <tr style='border-bottom:1px solid #f9fafb;'>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;'>IP address</td>
                            <td style='padding:12px 18px;font-size:13px;color:#111827;text-align:right;word-break:break-word;font-family:monospace;'>{$ip}</td>
                        </tr>
                        {$locationRowsHtml}
                    </table>

                </div>

                <!-- Security Alert -->
                <div style='background:#fef3c7;border-left:4px solid #f59e0b;padding:16px 20px;margin:0 0 24px;border-radius:6px;'>
                    <p style='margin:0 0 8px;font-size:13px;color:#92400e;font-weight:600;'>⚠️ Unrecognized change?</p>
                    <p style='margin:0;font-size:12px;color:#92400e;line-height:1.6;'>
                        If you didn't make this change or the IP address/location is unfamiliar, your account may be compromised. Contact your system administrator immediately.
                    </p>
                </div>

                <!-- VPN Notice -->
                <div style='background:#dbeafe;border-left:4px solid #0ea5e9;padding:16px 20px;margin:0 0 24px;border-radius:6px;'>
                    <p style='margin:0 0 8px;font-size:13px;color:#0369a1;font-weight:600;'>ℹ️ Using VPN or proxy?</p>
                    <p style='margin:0;font-size:12px;color:#0369a1;line-height:1.6;'>
                        If using a VPN, proxy, or privacy tool, the location shown may not reflect your actual location. This is normal and expected.
                    </p>
                </div>

                <!-- Closing -->
                <div style='padding:0 36px 24px;'>
                    <p style='margin:0;font-size:13px;color:#6b7280;line-height:1.7;'>
                        For security concerns, please contact your system administrator immediately.<br>
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

        return $this->subject('[DOSTNM-SIMS] Password Changed Successfully')
                    ->html($htmlContent);
    }
}