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

        // Build location row HTML
        $locationHtml = $detected
            ? "
                <div style='margin-bottom: 15px;'>
                    <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500;'>📍 Location</p>
                    <p style='margin: 0; color: #333; font-size: 14px;'>{$locationDisplay}</p>
                </div>

                <div style='margin-bottom: 15px;'>
                    <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500;'>🏢 Internet Service Provider</p>
                    <p style='margin: 0; color: #333; font-size: 14px;'>{$isp}</p>
                </div>
            "
            : "
                <div style='margin-bottom: 15px;'>
                    <p style='margin: 0 0 5px 0; color: #999; font-size: 13px; font-weight: 500;'>📍 Location</p>
                    <p style='margin: 0; color: #999; font-size: 14px;'>Location information unavailable</p>
                </div>
            ";

        $htmlContent = "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            </head>
            <body style='margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif;'>
                <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff;'>
                    <!-- Header -->
                    <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;'>
                        <img src='cid:setup_logo.png' alt='SETUP Logo' style='max-width: 120px; height: auto; margin: 0 auto 15px; display: block;'>
                        <h1 style='margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;'>Password Changed</h1>
                        <p style='margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;'>Your account password was successfully updated</p>
                    </div>

                    <!-- Main Content -->
                    <div style='padding: 40px 30px;'>
                        <p style='margin: 0 0 20px 0; color: #555; font-size: 16px;'>
                            Hello {$userName},<br><br>
                            This is a confirmation that your SIMS account password has been changed successfully.
                        </p>

                        <!-- Success Card -->
                        <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 30px; margin: 30px 0; text-align: center;'>
                            <p style='margin: 0 0 10px 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;'>Password Reset Successful</p>
                            <div style='background-color: #ffffff; border-radius: 6px; padding: 20px; margin: 15px 0;'>
                                <p style='margin: 0; color: #667eea; font-size: 40px;'>✓</p>
                                <p style='margin: 8px 0 0 0; color: #333; font-size: 15px; font-weight: 600;'>Your password has been updated</p>
                            </div>
                            <p style='margin: 10px 0 0 0; color: rgba(255,255,255,0.85); font-size: 13px;'>
                                You can now log in with your new password
                            </p>
                        </div>

                        <!-- Change Details -->
                        <div style='background-color: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 4px; padding: 20px; margin: 30px 0;'>
                            <h3 style='margin: 0 0 15px 0; color: #667eea; font-size: 16px; font-weight: 600;'>Change Details</h3>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500;'>Account</p>
                                <p style='margin: 0; color: #333; font-size: 14px;'>{$email}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500;'>Date & Time</p>
                                <p style='margin: 0; color: #333; font-size: 14px;'>{$changedAt}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500;'>IP Address</p>
                                <p style='margin: 0; color: #333; font-size: 14px; word-break: break-all;'>{$ip}</p>
                            </div>

                            {$locationHtml}
                        </div>

                        <!-- Security Warning -->
                        <div style='background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 30px 0; border-radius: 4px;'>
                            <p style='margin: 0 0 10px 0; color: #856404; font-size: 14px; font-weight: 600;'>
                                🔒 Wasn't you?
                            </p>
                            <p style='margin: 0; color: #856404; font-size: 13px; line-height: 1.6;'>
                                If you did not make this change or the location/IP address is unfamiliar, your account may be compromised. Please contact your system administrator immediately and secure your account.
                            </p>
                        </div>

                        <!-- VPN Notice -->
                        <div style='background-color: #e3f2fd; border-left: 4px solid #1976d2; padding: 15px 20px; margin: 30px 0; border-radius: 4px;'>
                            <p style='margin: 0 0 8px 0; color: #0d47a1; font-size: 14px; font-weight: 600;'>
                                ℹ️ Using a VPN or Proxy?
                            </p>
                            <p style='margin: 0; color: #1565c0; font-size: 13px; line-height: 1.6;'>
                                If you're using a VPN, proxy, or privacy tool, the location shown above may not reflect your actual location. This is normal.
                            </p>
                        </div>

                        <p style='margin: 30px 0 0 0; color: #999; font-size: 13px; line-height: 1.6;'>
                            If you have any concerns about your account security, please contact your system administrator immediately.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style='background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;'>
                        <img src='cid:logo.png' alt='Company Logo' style='max-width: 100px; height: auto; margin: 0 auto 15px; display: block;'>
                        <p style='margin: 0 0 10px 0; color: #666; font-size: 13px;'>
                            This is an automated security notification from SETUP Information Management System (SIMS)
                        </p>
                        <p style='margin: 0; color: #999; font-size: 12px;'>
                            © {$currentYear} SETUP Information Management System (SIMS). All rights reserved. | Do not reply to this email
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