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
    public $refundAmount;              // ← NEW
    public $amountDue;                 // ← NEW
    public $checkNum;                  // ← NEW
    public $receiptNum;                // ← NEW

    /**
     * Updated constructor to accept all refund details
     */
    public function __construct($ownerName, $projectTitle, $companyName, $month, $status, $amount, 
        $refundAmount = null, $amountDue = null, $checkNum = null, $receiptNum = null)
    {
        $this->ownerName = $ownerName;
        $this->projectTitle = $projectTitle;
        $this->companyName = $companyName;
        $this->month = $month;
        $this->status = $status;
        $this->amount = $amount;
        $this->refundAmount = $refundAmount ?? $amount;
        $this->amountDue = $amountDue ?? $amount;
        $this->checkNum = $checkNum;
        $this->receiptNum = $receiptNum;
    }

    public function build()
    {
        // Attach logos
        $this->attach(resource_path('assets/SETUP_logo.png'), [
            'as' => 'setup_logo.png',
            'mime' => 'image/png',
        ]);

        $this->attach(resource_path('assets/logo.png'), [
            'as' => 'logo.png',
            'mime' => 'image/png',
        ]);

        // Sanitize data
        $ownerName = htmlspecialchars($this->ownerName);
        $projectTitle = htmlspecialchars($this->projectTitle);
        $companyName = htmlspecialchars($this->companyName);
        $month = htmlspecialchars($this->month);
        $status = strtoupper($this->status);
        
        // Format amounts with currency
        $formattedRefundAmount = $this->refundAmount !== null 
            ? '₱' . number_format($this->refundAmount, 2) 
            : 'N/A';
        $formattedAmountDue = $this->amountDue !== null 
            ? '₱' . number_format($this->amountDue, 2) 
            : 'N/A';
        
        $createdDate = \Carbon\Carbon::now()->format('F d, Y \a\t h:i A');

        // Colors based on status
        $statusColors = [
            'PAID' => ['gradient' => '#28a745', 'gradientEnd' => '#218838', 'accent' => '#28a745', 'bg' => '#d4edda', 'border' => '#c3e6cb'],
            'UNPAID' => ['gradient' => '#dc3545', 'gradientEnd' => '#c82333', 'accent' => '#dc3545', 'bg' => '#f8d7da', 'border' => '#f5c6cb'],
            'RESTRUCTURED' => ['gradient' => '#0066cc', 'gradientEnd' => '#0056b3', 'accent' => '#0066cc', 'bg' => '#cce5ff', 'border' => '#b8daff'],
        ];

        $colors = $statusColors[$status] ?? $statusColors['UNPAID'];
        $statusIcon = $status === 'PAID' ? '✅' : ($status === 'RESTRUCTURED' ? '🔄' : '⏳');
        $currentYear = \Carbon\Carbon::now()->year;

        // Build Payment Details card (only if check or receipt number exists)
        $additionalDetailsHtml = '';
        
        if ($this->checkNum || $this->receiptNum) {
            $additionalDetailsHtml = "
                <div style='background-color: #fafbfc; border-left: 4px solid {$colors['accent']}; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                    <h3 style='margin: 0 0 15px 0; color: {$colors['accent']}; font-size: 16px; font-weight: 600;'>Payment Details</h3>
                    " . ($this->checkNum ? "
                    <div style='margin-bottom: 15px;'>
                        <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Check Number</p>
                        <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600; font-family: monospace; background-color: #fff; padding: 8px 12px; border-radius: 3px; border: 1px solid #e0e0e0;'>{$this->checkNum}</p>
                    </div>
                    " : "") . "
                    " . ($this->receiptNum ? "
                    <div>
                        <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Receipt Number</p>
                        <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600; font-family: monospace; background-color: #fff; padding: 8px 12px; border-radius: 3px; border: 1px solid #e0e0e0;'>{$this->receiptNum}</p>
                    </div>
                    " : "") . "
                </div>
            ";
        }

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
                        <img src='cid:setup_logo.png' alt='SETUP Logo' style='max-width: 120px; height: auto; margin: 0 auto 15px; display: block;'>
                        <h1 style='margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;'>Refund Update</h1>
                        <p style='margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;'>Notification sent on {$createdDate}</p>
                    </div>

                    <!-- Main Content -->
                    <div style='padding: 40px 30px;'>
                        <p style='margin: 0 0 30px 0; color: #555; font-size: 16px;'>
                            Dear {$ownerName},<br><br>
                            Your refund record has been updated for the month of <strong>{$month}</strong>.
                        </p>

                        <!-- Status Card - NOW WITH REFUND DETAILS -->
                        <div style='background-color: {$colors['bg']}; border-left: 4px solid {$colors['accent']}; padding: 20px; margin: 30px 0; border-radius: 4px; border: 1px solid {$colors['border']};'>
                            <div style='text-align: center; margin-bottom: 20px;'>
                                <p style='margin: 0; font-size: 48px;'>{$statusIcon}</p>
                            </div>
                            
                            <div style='margin-bottom: 20px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Status</p>
                                <p style='margin: 0; color: {$colors['accent']}; font-size: 24px; font-weight: 700;'>{$status}</p>
                            </div>

                            <div style='margin-bottom: 20px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Refund Amount</p>
                                <p style='margin: 0; color: #333; font-size: 20px; font-weight: 600;'>{$formattedRefundAmount}</p>
                            </div>

                            <div>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Amount Due</p>
                                <p style='margin: 0; color: #333; font-size: 20px; font-weight: 600;'>{$formattedAmountDue}</p>
                            </div>
                        </div>

                        <!-- Payment Details Card -->
                        {$additionalDetailsHtml}

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
                                Log in to the SIMS Portal to view detailed refund records and payment schedules.
                            </p>
                        </div>

                        <!-- Button -->
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='http://192.168.0.7:8096/' style='display: inline-block; background: linear-gradient(135deg, {$colors['gradient']} 0%, {$colors['gradientEnd']} 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 4px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 8px rgba(0,86,179,0.3);'>
                                View in SIMS Portal →
                            </a>
                        </div>

                        <p style='margin: 30px 0 0 0; color: #666; font-size: 14px; line-height: 1.6;'>
                            Thank you for your continued cooperation.<br>
                            <em style='color: #999;'>- SETUP-RPMU</em>
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style='background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;'>
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

        return $this->subject('[DOSTNM-SIMS] Refund Update - ' . $month)
                    ->html($htmlContent);
    }
}