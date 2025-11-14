<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OtpVerificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $otp;
    public $userName;

    /**
     * Create a new message instance.
     *
     * @param string $otp
     * @param string|null $userName
     */
    public function __construct($otp, $userName = null)
    {
        $this->otp = $otp;
        $this->userName = $userName ?? 'User';
    }

    public function build()
    {
        $otp = htmlspecialchars($this->otp);
        $userName = htmlspecialchars($this->userName);
        $expiryTime = '5 minutes';
        $currentDate = \Carbon\Carbon::now()->format('F d, Y \a\t h:i A');

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
                        <h1 style='margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;'>Login Verification</h1>
                        <p style='margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;'>Secure your account access</p>
                    </div>

                    <!-- Main Content -->
                    <div style='padding: 40px 30px;'>
                        <p style='margin: 0 0 20px 0; color: #555; font-size: 16px;'>
                            Hello {$userName},<br><br>
                            We detected a login attempt from a new device. To complete your login, please use the verification code below:
                        </p>

                        <!-- OTP Code Card -->
                        <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 30px; margin: 30px 0; text-align: center;'>
                            <p style='margin: 0 0 10px 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;'>Your Verification Code</p>
                            <div style='background-color: #ffffff; border-radius: 6px; padding: 20px; margin: 15px 0;'>
                                <p style='margin: 0; color: #667eea; font-size: 30px; font-weight: 700; letter-spacing: 8px; font-family: \"Courier New\", monospace;'>{$otp}</p>
                            </div>
                            <p style='margin: 10px 0 0 0; color: rgba(255,255,255,0.85); font-size: 13px;'>
                                ⏱️ This code will expire in {$expiryTime}
                            </p>
                        </div>

                        <!-- Security Notice -->
                        <div style='background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 30px 0; border-radius: 4px;'>
                            <p style='margin: 0 0 10px 0; color: #856404; font-size: 14px; font-weight: 600;'>
                                🔒 Security Reminder
                            </p>
                            <p style='margin: 0; color: #856404; font-size: 13px; line-height: 1.6;'>
                                • Never share this code with anyone, including SETUPSYS staff<br>
                                • If you didn't attempt to log in, please secure your account and contact DOST - Northern Mindanao immediately<br>
                                • This code can only be used once
                            </p>
                        </div>

                        <!-- Info Box -->
                        <div style='background-color: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 4px; padding: 20px; margin: 30px 0;'>
                            <h3 style='margin: 0 0 15px 0; color: #667eea; font-size: 16px; font-weight: 600;'>Login Details</h3>
                            
                            <div style='margin-bottom: 10px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500;'>Time</p>
                                <p style='margin: 0; color: #333; font-size: 14px;'>{$currentDate}</p>
                            </div>

                            <div>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500;'>Action Required</p>
                                <p style='margin: 0; color: #333; font-size: 14px;'>Enter the code in your login window to continue</p>
                            </div>
                        </div>

                        <p style='margin: 30px 0 0 0; color: #999; font-size: 13px; line-height: 1.6;'>
                            If you didn't request this code or are experiencing issues, please contact your system administrator immediately.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style='background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;'>
                        <p style='margin: 0 0 10px 0; color: #666; font-size: 13px;'>
                            This is an automated security notification from SETUPSYS
                        </p>
                        <p style='margin: 0; color: #999; font-size: 12px;'>
                            © 2025 SETUPSYS. All rights reserved.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        ";

        return $this->subject('[SETUPSYS] Login Verification Code')
                    ->html($htmlContent);
    }
}