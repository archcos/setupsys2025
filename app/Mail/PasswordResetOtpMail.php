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
            <body style='margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif;'>
                <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff;'>
                    <!-- Header -->
                    <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;'>
                        <img src='cid:setup_logo.png' alt='SETUP Logo' style='max-width: 120px; height: auto; margin: 0 auto 15px; display: block;'>
                        <h1 style='margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;'>Password Reset</h1>
                        <p style='margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;'>Secure account recovery</p>
                    </div>

                    <!-- Main Content -->
                    <div style='padding: 40px 30px;'>
                        <p style='margin: 0 0 20px 0; color: #555; font-size: 16px;'>
                            Hello {$userName},<br><br>
                            We received a request to reset your password. Use the verification code below to complete the password reset process:
                        </p>

                        <!-- OTP Code Card -->
                        <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 30px; margin: 30px 0; text-align: center;'>
                            <p style='margin: 0 0 10px 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;'>Your Password Reset Code</p>
                            <div style='background-color: #ffffff; border-radius: 6px; padding: 20px; margin: 15px 0;'>
                                <p style='margin: 0; color: #667eea; font-size: 25px; font-weight: 700; letter-spacing: 2px; font-family: \"Courier New\", monospace;'>{$otp}</p>
                            </div>
                            <p style='margin: 10px 0 0 0; color: rgba(255,255,255,0.85); font-size: 13px;'>
                                ⏱️ This code will expire in <strong>5 minutes</strong>
                            </p>
                            <p style='margin: 5px 0 0 0; color: rgba(255,255,255,0.75); font-size: 12px;'>
                                Expires at: <strong>{$expiryDateTime}</strong>
                            </p>
                        </div>

                        <!-- Security Notice -->
                        <div style='background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 30px 0; border-radius: 4px;'>
                            <p style='margin: 0 0 10px 0; color: #856404; font-size: 14px; font-weight: 600;'>
                                🔒 Security Reminder
                            </p>
                            <p style='margin: 0; color: #856404; font-size: 13px; line-height: 1.6;'>
                                • Never share this code with anyone, including DOST staff<br>
                                • If you didn't request a password reset, please secure your account immediately<br>
                                • This code can only be used once<br>
                                • This code will expire and cannot be used after {$expiryDateTime}
                            </p>
                        </div>

                        <!-- Info Box -->
                        <div style='background-color: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 4px; padding: 20px; margin: 30px 0;'>
                            <h3 style='margin: 0 0 15px 0; color: #667eea; font-size: 16px; font-weight: 600;'>Password Reset Details</h3>
                            
                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500;'>Request Time</p>
                                <p style='margin: 0; color: #333; font-size: 14px;'>{$currentDate}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500;'>Code Expiration</p>
                                <p style='margin: 0; color: #d32f2f; font-size: 14px; font-weight: 600;'>{$expiryDateTime}</p>
                            </div>

                            <div>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500;'>Action Required</p>
                                <p style='margin: 0; color: #333; font-size: 14px;'>Enter the code in your password reset form to continue</p>
                            </div>
                        </div>

                        <p style='margin: 30px 0 0 0; color: #999; font-size: 13px; line-height: 1.6;'>
                            If you didn't request this password reset or are experiencing issues, please contact your system administrator immediately.
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

        return $this->subject('[SETUP Information Management System (SIMS)] Password Reset Code')
                    ->html($htmlContent);
    }
}