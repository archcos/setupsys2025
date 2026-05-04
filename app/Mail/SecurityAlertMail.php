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

        $ipAddress = htmlspecialchars($this->data['ip_address'] ?? 'Unknown');
        $userId = htmlspecialchars($this->data['user_id'] ?? 'Guest');
        $method = htmlspecialchars($this->data['before']['method'] ?? 'N/A');
        $path = htmlspecialchars($this->data['before']['path'] ?? 'N/A');
        $queryString = htmlspecialchars($this->data['before']['query_string'] ?? 'N/A');
        $payload = htmlspecialchars($this->data['before']['payload'] ?? 'N/A');
        $matchedPattern = htmlspecialchars($this->data['before']['matched_pattern'] ?? 'N/A');
        $requestInput = $this->data['before']['request_input'] ?? [];
        $userAgent = htmlspecialchars($this->data['user_agent'] ?? 'Unknown');

        $requestInputFormatted = !empty($requestInput)
            ? htmlspecialchars(json_encode($requestInput, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE))
            : 'N/A';

        $timestamp = now()->format('F d, Y \a\t h:i A');
        $blockedUntil = now()->addHours(24)->format('F d, Y \a\t h:i A');
        $blockStatus = $this->isBlocked
            ? "✓ BLOCKED for 24 hours until {$blockedUntil}"
            : "⚠ NOT BLOCKED";
        $blockStatusColor = $this->isBlocked ? '#16a34a' : '#f59e0b';
        $blockStatusBg = $this->isBlocked ? '#f0fdf4' : '#fef3c7';
        $currentYear = now()->year;

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
                    <h1 style='margin:0 0 6px;font-size:20px;font-weight:600;color:#111827;'>🚨 Security Alert</h1>
                    <p style='margin:0;font-size:13px;color:#9ca3af;'>Detected {$timestamp}</p>
                </div>

                <!-- Card -->
                <div style='background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:0 0 24px;'>

                    <!-- Greeting -->
                    <div style='padding:24px 36px;border-bottom:1px solid #f3f4f6;'>
                        <p style='margin:0;font-size:14px;color:#6b7280;line-height:1.7;'>
                            Hello,<br><br>
                            A suspicious activity has been detected on your system and requires immediate attention. Please review the details below.
                        </p>
                    </div>

                    <!-- Alert Type Badge -->
                    <div style='padding:16px 36px;background:#fef2f2;border-bottom:1px solid #f3f4f6;'>
                        <p style='margin:0;font-size:13px;color:#dc2626;font-weight:600;'>{$this->alertType}</p>
                    </div>

                    <!-- Block Status Badge -->
                    <div style='padding:16px 36px;background:{$blockStatusBg};border-bottom:1px solid #f3f4f6;'>
                        <p style='margin:0;font-size:13px;color:{$blockStatusColor};font-weight:600;'>{$blockStatus}</p>
                    </div>

                    <!-- Request Details Label -->
                    <div style='background:#fafafa;border-bottom:1px solid #f3f4f6;padding:12px 18px;'>
                        <p style='margin:0;font-size:12px;color:#9ca3af;font-weight:500;'>Request details</p>
                    </div>

                    <!-- Request Details Rows -->
                    <table style='width:100%;border-collapse:collapse;'>
                        <tr style='border-bottom:1px solid #f9fafb;'>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;width:35%;'>IP address</td>
                            <td style='padding:12px 18px;font-size:13px;color:#111827;font-weight:500;text-align:right;font-family:monospace;'>{$ipAddress}</td>
                        </tr>
                        <tr style='border-bottom:1px solid #f9fafb;'>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;'>User ID</td>
                            <td style='padding:12px 18px;font-size:13px;color:#111827;text-align:right;'>{$userId}</td>
                        </tr>
                        <tr style='border-bottom:1px solid #f9fafb;'>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;'>HTTP method</td>
                            <td style='padding:12px 18px;font-size:13px;color:#111827;text-align:right;'>{$method}</td>
                        </tr>
                        <tr style='border-bottom:1px solid #f9fafb;'>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;'>Request path</td>
                            <td style='padding:12px 18px;font-size:13px;color:#111827;text-align:right;font-family:monospace;'>{$path}</td>
                        </tr>
                        <tr style='border-bottom:1px solid #f9fafb;'>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;'>Matched pattern</td>
                            <td style='padding:12px 18px;font-size:13px;color:#111827;text-align:right;'>{$matchedPattern}</td>
                        </tr>
                        <tr>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;'>Timestamp</td>
                            <td style='padding:12px 18px;font-size:13px;color:#111827;text-align:right;'>{$timestamp}</td>
                        </tr>
                    </table>

                </div>

                <!-- Technical Details -->
                <div style='margin:0 0 24px;'>
                    <div style='background:#fafafa;border-bottom:1px solid #e5e7eb;padding:12px 18px;border-radius:6px 6px 0 0;'>
                        <p style='margin:0;font-size:12px;color:#9ca3af;font-weight:500;'>Query string</p>
                    </div>
                    <div style='background:#ffffff;border:1px solid #e5e7eb;border-top:none;padding:12px 18px;border-radius:0 0 6px 6px;'>
                        <code style='margin:0;display:block;font-size:11px;color:#111827;font-family:monospace;line-height:1.4;word-break:break-all;white-space:pre-wrap;'>{$queryString}</code>
                    </div>
                </div>

                <!-- Payload -->
                <div style='margin:0 0 24px;'>
                    <div style='background:#fafafa;border-bottom:1px solid #e5e7eb;padding:12px 18px;border-radius:6px 6px 0 0;'>
                        <p style='margin:0;font-size:12px;color:#9ca3af;font-weight:500;'>Suspicious payload</p>
                    </div>
                    <div style='background:#fef2f2;border:1px solid #fecaca;border-top:none;padding:12px 18px;border-radius:0 0 6px 6px;'>
                        <code style='margin:0;display:block;font-size:11px;color:#7f1d1d;font-family:monospace;line-height:1.4;word-break:break-all;white-space:pre-wrap;'>{$payload}</code>
                    </div>
                </div>

                <!-- Request Input -->
                <div style='margin:0 0 24px;'>
                    <div style='background:#fafafa;border-bottom:1px solid #e5e7eb;padding:12px 18px;border-radius:6px 6px 0 0;'>
                        <p style='margin:0;font-size:12px;color:#9ca3af;font-weight:500;'>Request input</p>
                    </div>
                    <div style='background:#f0f9ff;border:1px solid #bae6fd;border-top:none;padding:12px 18px;border-radius:0 0 6px 6px;'>
                        <code style='margin:0;display:block;font-size:11px;color:#0c2d6b;font-family:monospace;line-height:1.4;word-break:break-all;white-space:pre-wrap;'>{$requestInputFormatted}</code>
                    </div>
                </div>

                <!-- Action Required Notice -->
                <div style='background:#fef3c7;border-left:4px solid #f59e0b;padding:16px 20px;margin:0 0 24px;border-radius:6px;'>
                    <p style='margin:0 0 8px;font-size:13px;color:#92400e;font-weight:600;'>⚠️ Immediate Action Required</p>
                    <p style='margin:0;font-size:12px;color:#92400e;line-height:1.6;'>
                        Please review this activity immediately. If not legitimate, investigate the source and review your application security controls.
                    </p>
                </div>

                <!-- CTA Button -->
                <div style='text-align:center;margin:0 0 24px;'>
                    <a href='http://192.168.0.7:8096/admin/security-logs'
                       style='display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:11px 28px;border-radius:6px;font-size:13px;font-weight:500;'>
                        View Security Logs
                    </a>
                </div>

                <!-- Closing -->
                <div style='padding:0 36px 24px;'>
                    <p style='margin:0;font-size:13px;color:#6b7280;line-height:1.7;'>
                        For security concerns, contact your system administrator immediately.<br>
                        <span style='color:#9ca3af;'>— SETUP Security Team</span>
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

        return $this->subject('🚨 DOSTNM-SIMS Security Alert - ' . $this->alertType)
            ->html($htmlContent);
    }
}