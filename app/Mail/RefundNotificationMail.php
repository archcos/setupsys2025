<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RefundNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $ownerName;
    public $projectTitle;
    public $companyName;
    public $month;
    public $status;
    public $amount;

    /**
     * Create a new message instance.
     *
     * @param string $ownerName
     * @param string $projectTitle
     * @param string $companyName
     * @param string $month (e.g., "January 2025")
     * @param string $status ('paid', 'unpaid', 'restructured')
     * @param float $amount
     */
    public function __construct($ownerName, $projectTitle, $companyName, $month, $status, $amount)
    {
        $this->ownerName = $ownerName;
        $this->projectTitle = $projectTitle;
        $this->companyName = $companyName;
        $this->month = $month;
        $this->status = $status;
        $this->amount = $amount;
    }

    public function build()
    {
        $ownerName = htmlspecialchars($this->ownerName);
        $projectTitle = htmlspecialchars($this->projectTitle);
        $companyName = htmlspecialchars($this->companyName);
        $month = htmlspecialchars($this->month);
        $status = strtoupper($this->status);
        $formattedAmount = $this->amount !== null 
            ? '₱' . number_format($this->amount, 2) 
            : 'N/A';
        $createdDate = \Carbon\Carbon::now()->format('F d, Y \a\t h:i A');

        // Determine colors and styling based on status
        $statusColors = [
            'PAID' => ['gradient' => '#28a745', 'gradientEnd' => '#218838', 'accent' => '#28a745', 'bg' => '#d4edda', 'border' => '#c3e6cb'],
            'UNPAID' => ['gradient' => '#dc3545', 'gradientEnd' => '#c82333', 'accent' => '#dc3545', 'bg' => '#f8d7da', 'border' => '#f5c6cb'],
            'RESTRUCTURED' => ['gradient' => '#0066cc', 'gradientEnd' => '#0056b3', 'accent' => '#0066cc', 'bg' => '#cce5ff', 'border' => '#b8daff'],
        ];

        $colors = $statusColors[$status] ?? $statusColors['UNPAID'];
        $statusIcon = $status === 'PAID' ? '✅' : ($status === 'RESTRUCTURED' ? '🔄' : '⏳');

        $currentYear = \Carbon\Carbon::now()->year;

        // Embed images as attachments
        $this->attach(resource_path('assets/SETUP_logo.webp'), [
            'as' => 'setup_logo.webp',
            'mime' => 'image/webp',
        ]);

        $this->attach(resource_path('assets/logo.webp'), [
            'as' => 'logo.webp',
            'mime' => 'image/webp',
        ]);

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
                    <div style='background: linear-gradient(135deg, {$colors['gradient']} 0%, {$colors['gradientEnd']} 100%); padding: 40px 20px; text-align: center;'>
                        <img src='cid:setup_logo.webp' alt='SETUP Logo' style='max-width: 120px; height: auto; margin-bottom: 15px;'>
                        <h1 style='margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;'>Refund Update</h1>
                        <p style='margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;'>Notification sent on {$createdDate}</p>
                    </div>

                    <!-- Main Content -->
                    <div style='padding: 40px 30px;'>
                        <p style='margin: 0 0 30px 0; color: #555; font-size: 16px;'>
                            Dear {$ownerName},<br><br>
                            Your refund record has been updated for the month of <strong>{$month}</strong>.
                        </p>

                        <!-- Status Card -->
                        <div style='background-color: {$colors['bg']}; border-left: 4px solid {$colors['accent']}; padding: 20px; margin: 30px 0; border-radius: 4px; border: 1px solid {$colors['border']};'>
                            <div style='text-align: center; margin-bottom: 20px;'>
                                <p style='margin: 0; font-size: 48px;'>{$statusIcon}</p>
                            </div>
                            
                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Status</p>
                                <p style='margin: 0; color: {$colors['accent']}; font-size: 24px; font-weight: 700;'>{$status}</p>
                            </div>

                            <div>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Amount</p>
                                <p style='margin: 0; color: #333; font-size: 20px; font-weight: 600;'>{$formattedAmount}</p>
                            </div>
                        </div>

                        <!-- Project Details Card -->
                        <div style='background-color: #f8f9fa; border-left: 4px solid {$colors['accent']}; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: {$colors['accent']}; font-size: 16px; font-weight: 600;'>Project Details</h3>
                            
                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Project Title</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$projectTitle}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Company Name</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$companyName}</p>
                            </div>

                            <div>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Refund Month</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$month}</p>
                            </div>
                        </div>

                        <!-- Call to Action -->
                        <div style='background-color: #E3F2FD; border: 1px solid #BBDEFB; border-radius: 4px; padding: 20px; margin: 30px 0; text-align: center;'>
                            <p style='margin: 0 0 15px 0; color: #0D47A1; font-size: 14px; font-weight: 600;'>
                                📊 View your complete refund history
                            </p>
                            <p style='margin: 0; color: #666; font-size: 13px;'>
                                Log in to the SETUPSYS Portal to view detailed refund records and payment schedules.
                            </p>
                        </div>

                        <!-- Visit Site Button -->
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='http://192.168.0.7:8096/' style='display: inline-block; background: linear-gradient(135deg, {$colors['gradient']} 0%, {$colors['gradientEnd']} 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 4px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 8px rgba(0,86,179,0.3);'>
                                View in SETUPSYS Portal →
                            </a>
                        </div>

                        <p style='margin: 30px 0 0 0; color: #666; font-size: 14px; line-height: 1.6;'>
                            Thank you for your continued cooperation.<br>
                            <em style='color: #999;'>- SETUP-RPMU</em>
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style='background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;'>
                        <img src='cid:logo.webp' alt='Company Logo' style='max-width: 100px; height: auto; margin-bottom: 15px;'>        
                        <p style='margin: 0 0 10px 0; color: #666; font-size: 13px;'>
                            This is an automated notification from SETUPSYS
                        </p>
                        <p style='margin: 0; color: #999; font-size: 12px;'>
                            © {$currentYear} SETUPSYS. All rights reserved. | Do not reply to this email
                        </p>
                    </div>
                </div>
            </body>
            </html>
        ";

        return $this->subject('[SETUPSYS] Refund Update - ' . $month)
                    ->html($htmlContent);
    }
}