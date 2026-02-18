<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RegistrationNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $userName;
    public $userEmail;

    public function __construct($userName, $userEmail)
    {
        $this->userName = $userName;
        $this->userEmail = $userEmail;
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

        $userName = $this->userName;
        $userEmail = $this->userEmail;
        $registrationDate = now()->format('F d, Y \a\t h:i A');
        $currentYear = \Carbon\Carbon::now()->year;

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
                    <div style='background-color: #0056b3; padding: 30px 20px; text-align: center;'>
                        <img src='cid:setup_logo.png' alt='SETUP Logo' style='max-width: 120px; height: auto; margin: 0 auto 15px; display: block;'>
                        <h1 style='margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;'>Account Registration Confirmation</h1>
                    </div>

                    <!-- Main Content -->
                    <div style='padding: 30px;'>
                        <p style='margin: 0 0 20px 0; color: #333; font-size: 15px; line-height: 1.6;'>
                            Hello {$userName},
                        </p>

                        <p style='margin: 0 0 20px 0; color: #555; font-size: 15px; line-height: 1.6;'>
                            This is to confirm that an account has been registered using this email address (<strong>{$userEmail}</strong>) on the DOST Northern Mindanao - SETUP Website.
                        </p>

                        <p style='margin: 0 0 20px 0; color: #555; font-size: 15px; line-height: 1.6;'>
                            <strong>Registration Details:</strong><br>
                            Email: {$userEmail}<br>
                            Date & Time: {$registrationDate}
                        </p>

                        <p style='margin: 0 0 20px 0; color: #555; font-size: 15px; line-height: 1.6;'>
                            If you did not register for this account or believe this registration was made in error, please contact the SETUP support team immediately.
                        </p>

                        <!-- Contact Information -->
                        <div style='background-color: #f0f0f0; border-left: 4px solid #0056b3; padding: 15px; margin: 20px 0; border-radius: 4px;'>
                            <p style='margin: 0 0 5px 0; color: #333; font-size: 13px; font-weight: 600;'>Support Contact:</p>
                            <p style='margin: 0; color: #555; font-size: 14px;'>
                                Email: <strong>setup@region10.dost.gov.ph</strong><br>
                                Phone: <strong>+63935-654-5974</strong>
                            </p>
                        </div>

                        <p style='margin: 0 0 10px 0; color: #555; font-size: 14px; line-height: 1.6;'>
                            Thank you for joining the DOST Northern Mindanao - Small Enterprise Technology Upgrading Program (SETUP).
                        </p>

                        <p style='margin: 0; color: #555; font-size: 14px; line-height: 1.6;'>
                            Best regards,<br>
                            <strong>SETUP RPMU</strong><br>
                            DOST Northern Mindanao
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style='background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;'>
                        <img src='cid:logo.png' alt='Company Logo' style='max-width: 100px; height: auto; margin: 0 auto 15px; display: block;'>     
                        <p style='margin: 0 0 10px 0; color: #666; font-size: 13px;'>
                            This is an automated notification from SETUP Information Management System (SIMS)
                        </p>   
                        <p style='margin: 0; color: #999; font-size: 12px;'>
                            © {$currentYear} SETUP Information Management System (SIMS). All rights reserved. | Do not reply to this email
                        </p>
                    </div>
                </div>
            </body>
            </html>
        ";

        return $this->subject('[DOSTNM-SIMS] Account Registration Confirmation')
                    ->html($htmlContent);
    }
}