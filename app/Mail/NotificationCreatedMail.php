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
                <p style='font-size:12px; color:#777;'>
                    This is an automated message. Please do not reply to this email.
                </p>
            </div>
        ";


        return $this->subject('[SETUPSYS] '.$this->notification['title'])
                    ->html($htmlContent);
    }
}
