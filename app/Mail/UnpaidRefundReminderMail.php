<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class UnpaidRefundReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public $companyName;
    public $projectTitle;
    public $refundAmount;
    public $month;
    public $daysLeft;
    public $isDeadlineDay;

    /**
     * Create a new message instance.
     *
     * @param string $companyName
     * @param string $projectTitle
     * @param float $refundAmount
     * @param string $month (e.g., "January 2025")
     * @param int $daysLeft
     * @param bool $isDeadlineDay
     */
    public function __construct($companyName, $projectTitle, $refundAmount, $month, $daysLeft, $isDeadlineDay)
    {
        $this->companyName = $companyName;
        $this->projectTitle = $projectTitle;
        $this->refundAmount = $refundAmount;
        $this->month = $month;
        $this->daysLeft = $daysLeft;
        $this->isDeadlineDay = $isDeadlineDay;
    }

    public function build()
    {
        $companyName = htmlspecialchars($this->companyName);
        $projectTitle = htmlspecialchars($this->projectTitle);
        $month = htmlspecialchars($this->month);
        $formattedAmount = '₱' . number_format($this->refundAmount, 2);
        // $createdDate = \Carbon\Carbon::now()->format('F d, Y \a\t h:i A');

        // Determine urgency level
        $isUrgent = $this->daysLeft <= 1;
        $gradientStart = $isUrgent ? '#dc3545' : '#ff6b35';
        $gradientEnd = $isUrgent ? '#c82333' : '#d84315';
        $accentColor = $isUrgent ? '#dc3545' : '#ff6b35';
        $urgencyBg = $isUrgent ? '#f8d7da' : '#fff3e0';
        $urgencyBorder = $isUrgent ? '#f5c6cb' : '#ffe0b2';
        $urgencyText = $isUrgent ? '#721c24' : '#e65100';

        // Deadline message
        if ($this->isDeadlineDay) {
            $deadlineMessage = "⚠️ TODAY IS THE DEADLINE!";
            $timeLeftText = "Payment must be submitted today";
        } elseif ($this->daysLeft === 1) {
            $deadlineMessage = "⚠️ 1 DAY LEFT UNTIL DEADLINE";
            $timeLeftText = "Payment deadline is tomorrow (15th)";
        } else {
            $deadlineMessage = "⏰ {$this->daysLeft} DAYS LEFT UNTIL DEADLINE";
            $timeLeftText = "Payment deadline: 15th of the month";
        }
        
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
                    <div style='background: linear-gradient(135deg, {$gradientStart} 0%, {$gradientEnd} 100%); padding: 40px 20px; text-align: center;'>
                        <img src='cid:setup_logo.webp' alt='SETUP Logo' style='max-width: 120px; height: auto; margin-bottom: 15px;'>
                        <h1 style='margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;'>Payment Reminder</h1>
                        <p style='margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;'>Refund Obligation Notice</p>
                    </div>

                    <!-- Main Content -->
                    <div style='padding: 40px 30px;'>
                        <p style='margin: 0 0 30px 0; color: #555; font-size: 16px;'>
                            Dear {$companyName},<br><br>
                            This is a reminder that your refund obligation for <strong>{$month}</strong> is currently unpaid.
                        </p>

                        <!-- Urgency Alert -->
                        <div style='background-color: {$urgencyBg}; border-left: 4px solid {$accentColor}; padding: 20px; margin: 30px 0; border-radius: 4px; border: 1px solid {$urgencyBorder};'>
                            <p style='margin: 0 0 10px 0; color: {$urgencyText}; font-size: 18px; font-weight: 700; text-align: center;'>
                                {$deadlineMessage}
                            </p>
                            <p style='margin: 0; color: {$urgencyText}; font-size: 14px; text-align: center;'>
                                {$timeLeftText}
                            </p>
                        </div>

                        <!-- Payment Details Card -->
                        <div style='background-color: #f8f9fa; border-left: 4px solid {$accentColor}; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: {$accentColor}; font-size: 16px; font-weight: 600;'>Payment Details</h3>
                            
                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Project Title</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$projectTitle}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Payment Period</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$month}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Amount Due</p>
                                <p style='margin: 0; color: {$accentColor}; font-size: 24px; font-weight: 700;'>{$formattedAmount}</p>
                            </div>

                            <div>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Status</p>
                                <p style='margin: 0; color: #dc3545; font-size: 15px; font-weight: 600;'>UNPAID</p>
                            </div>
                        </div>

                        <!-- Action Required -->
                        <div style='background-color: #e3f2fd; border: 1px solid #bbdefb; border-radius: 4px; padding: 20px; margin: 30px 0; text-align: center;'>
                            <p style='margin: 0 0 15px 0; color: #0d47a1; font-size: 14px; font-weight: 600;'>
                                💰 Action Required
                            </p>
                            <p style='margin: 0; color: #666; font-size: 13px; line-height: 1.6;'>
                                Please make payment at your earliest convenience to avoid any delays or complications with your project.
                            </p>
                        </div>

                        <!-- Important Note -->
                        <div style='background-color: #fff9e6; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 30px 0; border-radius: 4px;'>
                            <p style='margin: 0 0 10px 0; color: #856404; font-size: 14px; font-weight: 600;'>
                                📋 Important Note
                            </p>
                            <p style='margin: 0; color: #856404; font-size: 13px; line-height: 1.6;'>
                                If you have an Approved Project Restructuring for this time period, please disregard this reminder. Your restructured payment schedule will be honored.
                            </p>
                        </div>

                        <!-- Visit Site Button -->
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='http://192.168.0.7:8096/' style='display: inline-block; background: linear-gradient(135deg, {$gradientStart} 0%, {$gradientEnd} 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 4px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 8px rgba(255,107,53,0.3);'>
                                View Payment Details →
                            </a>
                        </div>

                        <p style='margin: 30px 0 0 0; color: #666; font-size: 13px; line-height: 1.6;'>
                            For any questions or concerns regarding this payment, please contact your SETUP-RPMU coordinator.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style='background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;'>
                        <img src='cid:logo.webp' alt='Company Logo' style='max-width: 100px; height: auto; margin-bottom: 15px;'>
                        <p style='margin: 0 0 10px 0; color: #666; font-size: 13px;'>
                            This is an automated reminder from SETUPSYS
                        </p>
                        <p style='margin: 0; color: #999; font-size: 12px;'>
                            © {$currentYear} SETUPSYS. All rights reserved.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        ";

        return $this->subject('[SETUPSYS] Unpaid Refund Reminder - ' . $projectTitle)
                    ->html($htmlContent);
    }
}