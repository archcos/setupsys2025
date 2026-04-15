<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SecurityAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $alertType,
        public array $data,
        public bool $isBlocked = true
    ) {}

    public function build()
    {
        $this->attach(resource_path('assets/SETUP_logo.png'), [
            'as' => 'setup_logo.png',
            'mime' => 'image/png',
        ]);

        $this->attach(resource_path('assets/logo.png'), [
            'as' => 'logo.png',
            'mime' => 'image/png',
        ]);

        $ipAddress = $this->data['ip_address'] ?? 'Unknown';
        $userId = $this->data['user_id'] ?? 'Guest';
        $method = $this->data['before']['method'] ?? 'N/A';
        $path = $this->data['before']['path'] ?? 'N/A';
        $queryString = $this->data['before']['query_string'] ?? 'N/A';
        $payload = $this->data['before']['payload'] ?? 'N/A';
        $matchedPattern = $this->data['before']['matched_pattern'] ?? 'N/A';
        $requestInput = $this->data['before']['request_input'] ?? [];
        $userAgent = $this->data['user_agent'] ?? 'Unknown';

        $requestInputFormatted = !empty($requestInput)
            ? json_encode($requestInput, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
            : 'N/A';

        $timestamp = now()->format('F d, Y \a\t h:i A');
        $blockedUntil = now()->addHours(24)->format('F d, Y \a\t h:i A');
        $blockStatus = $this->isBlocked
            ? "✅ BLOCKED for 24 hours until {$blockedUntil}"
            : "⚠️ NOT BLOCKED";
        $blockStatusColor = $this->isBlocked ? '#d32f2f' : '#ff9800';
        $blockStatusBg = $this->isBlocked ? '#c8e6c9' : '#ffe0b2';
        $blockStatusText = $this->isBlocked ? '#2e7d32' : '#e65100';
        $currentYear = now()->year;

        $htmlContent = "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            </head>
            <body style='margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif;'>
                <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff;'>
                    <div style='background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%); padding: 40px 20px; text-align: center;'>
                        <img src='cid:setup_logo.png' alt='SETUP Logo' style='max-width: 120px; height: auto; margin: 0 auto 15px; display: block;'>
                        <h1 style='margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;'>🚨 Security Alert</h1>
                        <p style='margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;'>Detected on {$timestamp}</p>
                    </div>

                    <div style='background-color: #ffebee; border-left: 4px solid #d32f2f; padding: 15px 20px; margin: 0;'>
                        <p style='margin: 0; color: #b71c1c; font-size: 16px; font-weight: 600;'>{$this->alertType}</p>
                    </div>

                    <div style='background-color: {$blockStatusBg}; border-left: 4px solid {$blockStatusColor}; padding: 15px 20px; margin: 0;'>
                        <p style='margin: 0; color: {$blockStatusText}; font-size: 16px; font-weight: 600;'>{$blockStatus}</p>
                    </div>

                    <div style='padding: 40px 30px;'>
                        <p style='margin: 0 0 30px 0; color: #555; font-size: 16px;'>
                            Hello,<br><br>
                            A suspicious activity has been detected on your system and requires immediate attention.
                        </p>

                        <div style='background-color: #f8f9fa; border-left: 4px solid #d32f2f; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: #d32f2f; font-size: 16px; font-weight: 600;'>Request Details</h3>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Alert Type</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$this->alertType}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>IP Address</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$ipAddress}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>User ID</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$userId}</p>
                            </div>

                            <div>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Timestamp</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$timestamp}</p>
                            </div>
                        </div>

                        <div style='background-color: #f8f9fa; border-left: 4px solid #d32f2f; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: #d32f2f; font-size: 16px; font-weight: 600;'>Request Information</h3>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>HTTP Method</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$method}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Request Path</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$path}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Matched Pattern</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$matchedPattern}</p>
                            </div>

                            <div>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>User Agent</p>
                                <p style='margin: 0; color: #333; font-size: 13px; word-break: break-all;'>{$userAgent}</p>
                            </div>
                        </div>

                        <div style='background-color: #fff8e1; border-left: 4px solid #ff9800; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: #ef6c00; font-size: 16px; font-weight: 600;'>Query String</h3>
                            <pre style='margin: 0; background-color: #fff; border: 1px solid #ffe0b2; padding: 12px; border-radius: 3px; font-size: 12px; color: #333; overflow-x: auto; max-height: 120px;'>{$queryString}</pre>
                        </div>

                        <div style='background-color: #ffe0e0; border-left: 4px solid #d32f2f; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: #d32f2f; font-size: 16px; font-weight: 600;'>Suspicious Payload</h3>
                            <pre style='margin: 0; background-color: #fff; border: 1px solid #ffcccc; padding: 12px; border-radius: 3px; font-size: 12px; color: #333; overflow-x: auto; max-height: 180px;'>{$payload}</pre>
                        </div>

                        <div style='background-color: #f3f6f9; border-left: 4px solid #607d8b; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: #455a64; font-size: 16px; font-weight: 600;'>Request Input</h3>
                            <pre style='margin: 0; background-color: #fff; border: 1px solid #cfd8dc; padding: 12px; border-radius: 3px; font-size: 12px; color: #333; overflow-x: auto; max-height: 200px;'>{$requestInputFormatted}</pre>
                        </div>

                        <div style='background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 20px; margin: 30px 0;'>
                            <p style='margin: 0; color: #856404; font-size: 14px; font-weight: 500;'>
                                ⚠️ <strong>IMMEDIATE ACTION REQUIRED</strong><br><br>
                                Please review this activity immediately. If this is not a legitimate request from your organization, investigate the source and review your application security controls.
                            </p>
                        </div>

                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='http://192.168.0.7:8096/admin/security-logs' style='display: inline-block; background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 4px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 8px rgba(211,47,47,0.3);'>
                                View Security Logs →
                            </a>
                        </div>
                    </div>

                    <div style='background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;'>
                        <img src='cid:logo.png' alt='Company Logo' style='max-width: 100px; height: auto; margin: 0 auto 15px; display: block;'>
                        <p style='margin: 0 0 10px 0; color: #666; font-size: 13px;'>
                            This is a critical security notification from your system
                        </p>
                        <p style='margin: 0; color: #999; font-size: 12px;'>
                            © {$currentYear} SETUP Information Management System (SIMS). All rights reserved.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        ";

        return $this->subject('🚨 DOSTNM-SIMS Security Alert - ' . $this->alertType)
            ->html($htmlContent);
    }
}