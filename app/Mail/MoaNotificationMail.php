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
        $createdDate = \Carbon\Carbon::now()->format('F d, Y \a\t h:i A');
        $currentYear = \Carbon\Carbon::now()->year;

        // Determine icon and color based on action type
        $icon = '📄';
        $gradientStart = '#0056b3';
        $gradientEnd = '#003d82';
        $accentColor = '#0056b3';

        if ($this->actionType === 'uploaded' || $this->actionType === 'reuploaded') {
            $icon = '✅';
            $gradientStart = '#28a745';
            $gradientEnd = '#218838';
            $accentColor = '#28a745';
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
                    <div style='background: linear-gradient(135deg, {$gradientStart} 0%, {$gradientEnd} 100%); padding: 40px 20px; text-align: center;'>
                        <img src='cid:setup_logo.png' alt='SETUP Logo' style='max-width: 120px; height: auto; margin: 0 auto 15px; display: block;'>
                        <h1 style='margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;'>{$title}</h1>
                        <p style='margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;'>Notification sent on {$createdDate}</p>
                    </div>

                    <!-- Main Content -->
                    <div style='padding: 40px 30px;'>
                        <p style='margin: 0 0 30px 0; color: #555; font-size: 16px;'>
                            Dear {$recipientName},<br><br>
                            {$message}
                        </p>

                        <!-- Project Information Card -->
                        <div style='background-color: #f8f9fa; border-left: 4px solid {$accentColor}; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: {$accentColor}; font-size: 16px; font-weight: 600;'>Project Details</h3>
                            
                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Project Title</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$projectTitle}</p>
                            </div>

                            <div>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Company Name</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$companyName}</p>
                            </div>
                        </div>

                        <!-- Call to Action -->
                        <div style='background-color: #E3F2FD; border: 1px solid #BBDEFB; border-radius: 4px; padding: 20px; margin: 30px 0; text-align: center;'>
                            <p style='margin: 0 0 15px 0; color: #0D47A1; font-size: 14px; font-weight: 600;'>
                                {$icon} Action required
                            </p>
                            <p style='margin: 0; color: #666; font-size: 13px;'>
                                Please log in to the SETUPSYS Portal to review this MOA.
                            </p>
                        </div>

                        <!-- Visit Site Button -->
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='http://192.168.0.7:8096/' style='display: inline-block; background: linear-gradient(135deg, {$gradientStart} 0%, {$gradientEnd} 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 4px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 8px rgba(0,86,179,0.3);'>
                                Review MOA in SETUPSYS →
                            </a>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style='background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;'>
                        <img src='cid:logo.png' alt='Company Logo' style='max-width: 100px; height: auto; margin: 0 auto 15px; display: block;'>
                        <p style='margin: 0 0 10px 0; color: #666; font-size: 13px;'>
                            This is an automated notification from SETUPSYS
                        </p>
                        <p style='margin: 0; color: #999; font-size: 12px;'>
                            © {$currentYear} SETUPSYS. All rights reserved.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        ";

        return $this->subject('[SETUPSYS] ' . $title)
                    ->html($htmlContent);
    }
}