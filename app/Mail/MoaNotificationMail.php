<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class MoaNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $title;
    public $message;
    public $projectTitle;
    public $companyName;
    public $actionType;
    public $recipientName;

    /**
     * Create a new message instance.
     *
     * @param string $actionType ('created', 'uploaded', 'reuploaded')
     * @param string $projectTitle
     * @param string $companyName
     * @param string|null $recipientName
     */
    public function __construct($actionType, $projectTitle, $companyName, $recipientName = null)
    {
        $this->actionType = $actionType;
        $this->projectTitle = $projectTitle;
        $this->companyName = $companyName;
        $this->recipientName = $recipientName ?? 'Team Member';

        // Set title based on action type
        switch ($actionType) {
            case 'created':
                $this->title = 'MOA Draft Created';
                $this->message = 'A new MOA draft has been created and is ready for review.';
                break;
            case 'uploaded':
                $this->title = 'MOA File Uploaded';
                $this->message = 'An approved MOA file has been uploaded to the system.';
                break;
            case 'reuploaded':
                $this->title = 'MOA File Reuploaded';
                $this->message = 'An approved MOA file has been reuploaded with updates.';
                break;
            default:
                $this->title = 'MOA Update';
                $this->message = 'An MOA has been updated.';
        }
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

        $title = htmlspecialchars($this->title);
        $message = htmlspecialchars($this->message);
        $projectTitle = htmlspecialchars($this->projectTitle);
        $companyName = htmlspecialchars($this->companyName);
        $recipientName = htmlspecialchars($this->recipientName);
        $sentDate = \Carbon\Carbon::now()->format('F d, Y \a\t h:i A');
        $currentYear = \Carbon\Carbon::now()->year;

        // Determine status color and icon based on action type
        $statusColor = '#6b7280';
        $statusText = 'Pending Review';
        $statusIcon = '';

        if ($this->actionType === 'uploaded' || $this->actionType === 'reuploaded') {
            $statusColor = '#16a34a';
            $statusText = 'Approved';
            $statusIcon = '✓ ';
        }

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
                    <h1 style='margin:0 0 6px;font-size:20px;font-weight:600;color:#111827;'>{$title}</h1>
                    <p style='margin:0;font-size:13px;color:#9ca3af;'>Sent {$sentDate}</p>
                </div>

                <!-- Card -->
                <div style='background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:0 0 24px;'>

                    <!-- Greeting -->
                    <div style='padding:24px 36px;border-bottom:1px solid #f3f4f6;'>
                        <p style='margin:0;font-size:14px;color:#6b7280;line-height:1.7;'>
                            Hello <strong style='color:#111827;font-weight:600;'>{$recipientName}</strong>,<br><br>
                            {$message}
                        </p>
                    </div>

                    <!-- Status Badge -->
                    <div style='padding:16px 36px;background:" . ($this->actionType === 'uploaded' || $this->actionType === 'reuploaded' ? '#f0fdf4' : '#f3f4f6') . ";border-bottom:1px solid #f3f4f6;'>
                        <p style='margin:0;font-size:13px;color:{$statusColor};font-weight:600;'>{$statusIcon}{$statusText}</p>
                    </div>

                    <!-- Project Details Label -->
                    <div style='background:#fafafa;border-bottom:1px solid #f3f4f6;padding:12px 18px;'>
                        <p style='margin:0;font-size:12px;color:#9ca3af;font-weight:500;'>Project details</p>
                    </div>

                    <!-- Project Details Rows -->
                    <table style='width:100%;border-collapse:collapse;'>
                        <tr style='border-bottom:1px solid #f9fafb;'>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;width:35%;'>Project</td>
                            <td style='padding:12px 18px;font-size:13px;color:#111827;font-weight:500;text-align:right;'>{$projectTitle}</td>
                        </tr>
                        <tr>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;'>Company</td>
                            <td style='padding:12px 18px;font-size:13px;color:#111827;text-align:right;'>{$companyName}</td>
                        </tr>
                    </table>

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
                        Please review the MOA details in the DOSTNM-SIMS Portal.<br>
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

        return $this->subject('[DOSTNM-SIMS] ' . $title)
                    ->html($htmlContent);
    }
}