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
        // Attach PNG images
        $this->attach(resource_path('assets/SETUP_logo.png'), [
            'as' => 'setup_logo.png',
            'mime' => 'image/png',
        ]);

        $this->attach(resource_path('assets/logo.png'), [
            'as' => 'logo.png',
            'mime' => 'image/png',
        ]);

        $companyName = htmlspecialchars($this->companyName);
        $projectTitle = htmlspecialchars($this->projectTitle);
        $month = htmlspecialchars($this->month);
        $formattedAmount = '₱' . number_format($this->refundAmount, 2);
        $sentDate = \Carbon\Carbon::now()->format('F d, Y \a\t h:i A');

        // Determine urgency level
        $isUrgent = $this->daysLeft <= 1;
        $badgeColor = $isUrgent ? '#dc2626' : '#f59e0b';
        $badgeBg = $isUrgent ? '#fef2f2' : '#fef3c7';

        // Deadline message
        if ($this->isDeadlineDay) {
            $deadlineMessage = "⚠️ TODAY IS THE DEADLINE";
            $timeLeftText = "Payment must be submitted today";
        } elseif ($this->daysLeft === 1) {
            $deadlineMessage = "⚠️ 1 DAY LEFT UNTIL DEADLINE";
            $timeLeftText = "Payment deadline is tomorrow (15th)";
        } else {
            $deadlineMessage = "⏰ {$this->daysLeft} DAYS LEFT UNTIL DEADLINE";
            $timeLeftText = "Payment deadline: 15th of the month";
        }
        
        $currentYear = \Carbon\Carbon::now()->year;

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
                    <h1 style='margin:0 0 6px;font-size:20px;font-weight:600;color:#111827;'>Payment Reminder</h1>
                    <p style='margin:0;font-size:13px;color:#9ca3af;'>Sent {$sentDate}</p>
                </div>

                <!-- Card -->
                <div style='background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:0 0 24px;'>

                    <!-- Greeting -->
                    <div style='padding:24px 36px;border-bottom:1px solid #f3f4f6;'>
                        <p style='margin:0;font-size:14px;color:#6b7280;line-height:1.7;'>
                            Dear <strong style='color:#111827;font-weight:600;'>{$companyName}</strong>,<br><br>
                            This is a reminder that your refund obligation for <strong style='color:#111827;font-weight:600;'>{$month}</strong> is currently unpaid.
                        </p>
                    </div>

                    <!-- Status Badge -->
                    <div style='padding:16px 36px;background:{$badgeBg};border-bottom:1px solid #f3f4f6;'>
                        <p style='margin:0;font-size:13px;color:{$badgeColor};font-weight:600;'>{$deadlineMessage}</p>
                    </div>

                    <!-- Payment Details Label -->
                    <div style='background:#fafafa;border-bottom:1px solid #f3f4f6;padding:12px 18px;'>
                        <p style='margin:0;font-size:12px;color:#9ca3af;font-weight:500;'>Payment details</p>
                    </div>

                    <!-- Payment Details Rows -->
                    <table style='width:100%;border-collapse:collapse;'>
                        <tr style='border-bottom:1px solid #f9fafb;'>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;width:35%;'>Project</td>
                            <td style='padding:12px 18px;font-size:13px;color:#111827;font-weight:500;text-align:right;'>{$projectTitle}</td>
                        </tr>
                        <tr style='border-bottom:1px solid #f9fafb;'>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;'>Period</td>
                            <td style='padding:12px 18px;font-size:13px;color:#111827;text-align:right;'>{$month}</td>
                        </tr>
                        <tr style='border-bottom:1px solid #f9fafb;'>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;'>Amount due</td>
                            <td style='padding:12px 18px;font-size:16px;color:#111827;font-weight:700;text-align:right;'>{$formattedAmount}</td>
                        </tr>
                        <tr>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;'>Status</td>
                            <td style='padding:12px 18px;font-size:13px;color:#dc2626;font-weight:600;text-align:right;'>Unpaid</td>
                        </tr>
                    </table>

                </div>

                <!-- Deadline Notice -->
                <div style='background:{$badgeBg};border-left:4px solid:{$badgeColor};padding:16px 20px;margin:0 0 24px;border-radius:6px;'>
                    <p style='margin:0 0 8px;font-size:13px;color:{$badgeColor};font-weight:600;'>⏰ {$timeLeftText}</p>
                    <p style='margin:0;font-size:12px;color:{$badgeColor};line-height:1.6;'>
                        Please make payment at your earliest convenience to avoid any delays or complications with your project.
                    </p>
                </div>

                <!-- Important Notes -->
                <div style='background:#fef3c7;border-left:4px solid #f59e0b;padding:16px 20px;margin:0 0 24px;border-radius:6px;'>
                    <p style='margin:0 0 8px;font-size:13px;color:#92400e;font-weight:600;'>📋 Important Notes</p>
                    <p style='margin:0 0 6px;font-size:12px;color:#92400e;line-height:1.6;'>
                        • If you have already submitted payment, please disregard this message.
                    </p>
                    <p style='margin:0;font-size:12px;color:#92400e;line-height:1.6;'>
                        • If you have an Approved Project Restructuring for this period, your restructured payment schedule will be honored.
                    </p>
                </div>

                <!-- CTA Button -->
                <div style='text-align:center;margin:0 0 24px;'>
                    <a href='http://192.168.0.7:8096/'
                       style='display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:11px 28px;border-radius:6px;font-size:13px;font-weight:500;'>
                        View in SIMS Portal
                    </a>
                </div>

                <!-- Closing -->
                <div style='padding:0 36px 24px;'>
                    <p style='margin:0;font-size:13px;color:#6b7280;line-height:1.7;'>
                        For any questions regarding this payment, please contact your SETUP-RPMU coordinator.<br>
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

        return $this->subject('[DOSTNM-SIMS] Unpaid Refund Reminder - ' . $projectTitle)
                    ->html($htmlContent);
    }
}