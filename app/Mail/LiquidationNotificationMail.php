<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class LiquidationNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $projectTitle;
    public string $companyName;
    public string $recipientName;
    public ?string $attachedFilePath;
    public ?string $attachedFileName;
    public string $customSubject;
    public string $officeName;
    public string $uploaderName;

    public function __construct(
        string $projectTitle,
        string $companyName,
        string $recipientName = 'Team',
        ?string $attachedFilePath = null,
        ?string $attachedFileName = null,
        string $customSubject = '',
        string $officeName = '',
        string $uploaderName = 'Unknown User'
    ) {
        $this->projectTitle     = $projectTitle;
        $this->companyName      = $companyName;
        $this->recipientName    = $recipientName;
        $this->attachedFilePath = $attachedFilePath;
        $this->attachedFileName = $attachedFileName;
        $this->customSubject    = $customSubject ?: '[DOSTNM-SIMS] Liquidation Report Submitted – ' . $projectTitle;
        $this->officeName       = $officeName;
        $this->uploaderName     = $uploaderName;
    }

    public function build(): self
    {
        $this->attach(resource_path('assets/SETUP_logo.png'), [
            'as'   => 'setup_logo.png',
            'mime' => 'image/png',
        ]);
        $this->attach(resource_path('assets/logo.png'), [
            'as'   => 'logo.png',
            'mime' => 'image/png',
        ]);

        if ($this->attachedFilePath && file_exists($this->attachedFilePath)) {
            $this->attach($this->attachedFilePath, [
                'as'   => $this->attachedFileName ?? basename($this->attachedFilePath),
                'mime' => mime_content_type($this->attachedFilePath) ?: 'application/octet-stream',
            ]);
        }

        $projectTitle  = htmlspecialchars($this->projectTitle);
        $companyName   = htmlspecialchars($this->companyName);
        $recipientName = htmlspecialchars($this->recipientName);
        $officeName    = htmlspecialchars($this->officeName);
        $uploaderName  = htmlspecialchars($this->uploaderName);
        $createdDate   = \Carbon\Carbon::now('Asia/Manila')->format('F d, Y \a\t h:i A');
        $currentYear   = \Carbon\Carbon::now()->year;

        $gradientStart = '#28a745';
        $gradientEnd   = '#218838';
        $accentColor   = '#28a745';

        $officeRow = $officeName ? "
            <div style='margin-bottom:15px;'>
                <p style='margin:0 0 5px 0;color:#666;font-size:13px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;'>Office</p>
                <p style='margin:0;color:#333;font-size:15px;font-weight:600;'>{$officeName}</p>
            </div>
        " : '';

        $htmlContent = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        </head>
        <body style='margin:0;padding:0;background-color:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif;'>
            <div style='max-width:600px;margin:0 auto;background-color:#ffffff;'>

                <!-- Header -->
                <div style='background:linear-gradient(135deg,{$gradientStart} 0%,{$gradientEnd} 100%);padding:40px 20px;text-align:center;'>
                    <img src='cid:setup_logo.png' alt='SETUP Logo' style='max-width:120px;height:auto;margin:0 auto 15px;display:block;'>
                    <h1 style='margin:0;color:#ffffff;font-size:28px;font-weight:600;'>Approved Liquidation Report</h1>
                </div>

                <!-- Main Content -->
                <div style='padding:40px 30px;'>
                    <p style='margin:0 0 30px 0;color:#555;font-size:16px;'>
                        Dear Provincial Director {$recipientName},<br><br>
                        A liquidation report has been approved for the project below.
                        The file is attached to this email for your reference.
                    </p>

                    <!-- Project Details Card -->
                    <div style='background-color:#f8f9fa;border-left:4px solid {$accentColor};padding:20px;margin:30px 0;border-radius:4px;'>
                        <h3 style='margin:0 0 15px 0;color:{$accentColor};font-size:16px;font-weight:600;'>Project Details</h3>

                        <div style='margin-bottom:15px;'>
                            <p style='margin:0 0 5px 0;color:#666;font-size:13px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;'>Project Title</p>
                            <p style='margin:0;color:#333;font-size:15px;font-weight:600;'>{$projectTitle}</p>
                        </div>

                        <div style='margin-bottom:15px;'>
                            <p style='margin:0 0 5px 0;color:#666;font-size:13px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;'>Company / Beneficiary</p>
                            <p style='margin:0;color:#333;font-size:15px;font-weight:600;'>{$companyName}</p>
                        </div>

                        {$officeRow}

                        <div>
                            <p style='margin:0 0 5px 0;color:#666;font-size:13px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;'>Uploaded By</p>
                            <p style='margin:0;color:#333;font-size:15px;font-weight:600;'>{$uploaderName}</p>
                        </div>
                    </div>

                    <!-- Status Notice -->
                    <div style='background-color:#E8F5E9;border:1px solid #C8E6C9;border-radius:4px;padding:20px;margin:30px 0;text-align:center;'>
                        <p style='margin:0 0 10px 0;color:#2E7D32;font-size:14px;font-weight:600;'>
                            ✅ Liquidation Report Approved
                        </p>
                        <p style='margin:0;color:#666;font-size:13px;'>
                            The project progress has been updated to <strong>Refund</strong> status.
                            Please log in to DOSTNM-SIMS to review the full details.
                        </p>
                    </div>

                    <!-- CTA Button -->
                    <div style='text-align:center;margin:30px 0;'>
                        <a href='http://192.168.0.7:8096/'
                           style='display:inline-block;background:linear-gradient(135deg,{$gradientStart} 0%,{$gradientEnd} 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:4px;font-weight:600;font-size:15px;box-shadow:0 2px 8px rgba(40,167,69,0.3);'>
                            View Project in DOSTNM-SIMS →
                        </a>
                    </div>
                </div>

                <!-- Footer -->
                <div style='background-color:#f8f9fa;padding:30px;text-align:center;border-top:1px solid #e0e0e0;'>
                    <img src='cid:logo.png' alt='Company Logo' style='max-width:100px;height:auto;margin:0 auto 15px;display:block;'>
                    <p style='margin:0 0 10px 0;color:#666;font-size:13px;'>
                        This is an automated notification from SETUP Information Management System (SIMS)
                    </p>
                    <p style='margin:0;color:#999;font-size:12px;'>
                        © {$currentYear} SETUP Information Management System (SIMS). All rights reserved.
                    </p>
                </div>

            </div>
        </body>
        </html>
        ";

        return $this->subject($this->customSubject)
                    ->html($htmlContent);
    }
}