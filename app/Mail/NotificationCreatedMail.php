<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NotificationCreatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $notification;

    public function __construct($notification)
    {
        $this->notification = $notification;
    }

    public function build()
    {
        $htmlContent = "
            <div style='font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5;'>
                <h2 style='color: #0056b3; margin-bottom: 10px;'>{$this->notification['title']}</h2>
                <p style='margin: 0 0 20px 0;'>{$this->notification['message']}</p>
                
                <hr style='border:none; border-top:1px solid #ddd; margin:30px 0;'>
                <!-- Footer -->
                    <div style='background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;'>
                        <p style='margin: 0 0 10px 0; color: #666; font-size: 13px;'>
                            This is an automated notification from SETUPSYS
                        </p>
                        <p style='margin: 0; color: #999; font-size: 12px;'>
                            © 2025 SETUPSYS. All rights reserved.
                        </p>
                    </div>
            </div>
        ";


        return $this->subject('[SETUPSYS] '.$this->notification['title'])
                    ->html($htmlContent);
    }
}
