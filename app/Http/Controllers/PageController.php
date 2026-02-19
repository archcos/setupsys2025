<?php

namespace App\Http\Controllers;

use App\Models\AnnouncementModel;
use App\Models\BlockedIp;
use App\Models\OfficeModel;
use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

class PageController extends Controller
{
    public function contact() {
        return Inertia::render('Contact');
    }

public function sendContact(Request $request)
{
    $ip = $request->ip();
    $minuteKey = 'contact-form:minute:' . $ip;

    // Rate limiting: max 2 per minute
    if (RateLimiter::tooManyAttempts($minuteKey, 2)) {
        $seconds = RateLimiter::availableIn($minuteKey);
        
        // Return with error so Inertia captures it
        return back()->withErrors([
            'rate_limit' => 'Please wait before sending another message.',
            'rate_seconds' => $seconds,
        ])->withInput();
    }

    RateLimiter::hit($minuteKey, 600); // 60 second window

    // Validate input
    $validated = $request->validate([
        'name'    => 'required|string|max:255',
        'email'   => 'required|email|max:255',
        'subject' => 'required|string|max:255',
        'message' => 'required|string|max:5000',
        'phone'   => 'nullable|regex:/^09\d{9}$/|max:11',
        'website' => 'nullable|string|max:255', // honeypot
    ], [
        'phone.regex' => 'Phone number must start with 09 and contain 11 digits (Philippine format).',
    ]);

    // Honeypot detection
    if ($request->filled('website')) {
        $blockTime = Carbon::now()->addHours(6);
        
        BlockedIp::updateOrCreate(
            ['ip' => $ip],
            [
                'reason' => 'Honeypot spam detected in Contact Form',
                'blocked_until' => $blockTime,
            ]
        );

        return Inertia::render('Errors/Blocked', [
            'message' => 'Spam detected. Your IP has been temporarily blocked.',
            'blockTime' => $blockTime,
            'statusCode' => 403,
        ])->toResponse($request)->setStatusCode(403);
    }

    // Create HTML email content
    $emailContent = $this->generateEmailHTML($validated);

    // Send the email
    Mail::html(
        $emailContent,
        function ($mail) use ($validated) {
            $mail->to('setup@region10.dost.gov.ph')
                ->subject('Contact Form: ' . $validated['subject'])
                ->replyTo($validated['email'], $validated['name']);
        }
    );

    return back()->with('success', 'Thank you for contacting us! We\'ll get back to you soon.');
}

private function generateEmailHTML($data)
{
    $phoneDisplay = $data['phone'] ?? 'Not provided';
    $submittedAt = now()->format('F d, Y \a\t h:i A');

    return <<<HTML
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f5f5f5;
            }
            .email-wrapper {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #0066cc 0%, #003399 100%);
                color: #ffffff;
                padding: 30px 20px;
                text-align: center;
            }
            .header h1 {
                font-size: 28px;
                margin-bottom: 5px;
                font-weight: 600;
            }
            .header p {
                font-size: 14px;
                opacity: 0.9;
            }
            .content {
                padding: 30px 20px;
            }
            .greeting {
                font-size: 16px;
                margin-bottom: 20px;
                color: #333;
            }
            .greeting strong {
                color: #0066cc;
            }
            .info-section {
                background-color: #f9f9f9;
                border-left: 4px solid #0066cc;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .info-row {
                display: flex;
                padding: 10px 0;
                border-bottom: 1px solid #e0e0e0;
            }
            .info-row:last-child {
                border-bottom: none;
            }
            .info-label {
                font-weight: 600;
                color: #0066cc;
                width: 100px;
                flex-shrink: 0;
            }
            .info-value {
                color: #555;
                word-break: break-word;
                flex: 1;
            }
            .subject-section {
                background-color: #f0f4ff;
                border-left: 4px solid #0066cc;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .subject-label {
                font-weight: 600;
                color: #0066cc;
                margin-bottom: 8px;
                display: block;
            }
            .subject-text {
                color: #333;
                font-size: 16px;
            }
            .message-section {
                background-color: #f9f9f9;
                border-left: 4px solid #0066cc;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
                white-space: pre-wrap;
                word-wrap: break-word;
            }
            .message-label {
                font-weight: 600;
                color: #0066cc;
                margin-bottom: 10px;
                display: block;
            }
            .message-text {
                color: #555;
                line-height: 1.6;
            }
            .timestamp {
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                font-size: 12px;
                color: #999;
                margin-top: 20px;
            }
            .footer {
                background-color: #f5f5f5;
                padding: 20px;
                text-align: center;
                border-top: 1px solid #e0e0e0;
                font-size: 12px;
                color: #666;
            }
            .footer-divider {
                width: 60px;
                height: 2px;
                background: linear-gradient(135deg, #0066cc 0%, #003399 100%);
                margin: 10px auto;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #0066cc 0%, #003399 100%);
                color: #ffffff;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 4px;
                margin-top: 15px;
                font-weight: 600;
                font-size: 14px;
            }
            .cta-button:hover {
                opacity: 0.9;
            }
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <!-- Header -->
            <div class="header">
                <h1>📬 New Contact Form Submission</h1>
                <p>DOST NORMIN SETUP - INTEGRATED MANAGEMENT SYSTEM</p>
            </div>

            <!-- Content -->
            <div class="content">
                <div class="greeting">
                    Hello, <strong>DOST SETUP Team</strong>
                </div>

                <p style="margin-bottom: 20px; color: #555;">
                    You have received a new message from the SIMS Contact Form. Here are the details:
                </p>

                <!-- Contact Information -->
                <div class="info-section">
                    <div class="info-row">
                        <div class="info-label">Name:</div>
                        <div class="info-value">{$data['name']}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Email:</div>
                        <div class="info-value">
                            <a href="mailto:{$data['email']}" style="color: #0066cc; text-decoration: none;">
                                {$data['email']}
                            </a>
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Phone:</div>
                        <div class="info-value">{$phoneDisplay}</div>
                    </div>
                </div>

                <!-- Subject -->
                <div class="subject-section">
                    <span class="subject-label">📌 Subject</span>
                    <div class="subject-text">{$data['subject']}</div>
                </div>

                <!-- Message -->
                <div class="message-section">
                    <span class="message-label">💬 Message</span>
                    <div class="message-text">{$data['message']}</div>
                </div>

                <!-- Call to Action -->
                <div style="text-align: center;">
                    <p style="color: #666; font-size: 14px; margin-top: 15px;">
                       Click the Email above to respond directly to the user.
                    </p>
                </div>

                <!-- Timestamp -->
                <div class="timestamp">
                    Submitted on: {$submittedAt}
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <div class="footer-divider"></div>
                <p>
                    This is an automated message from the DOST SETUP Contact Form.<br>
                    Please do not reply to this email. Use the sender's contact information above.
                </p>
                <p style="margin-top: 10px; color: #999;">
                    © 2026 DOST Northern Mindanao. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
    HTML;
}

    public function about() {
        return Inertia::render('AboutUs');
    }

    public function help() {
        return Inertia::render('Help');
    }

public function announcements()
{
    $announcements = AnnouncementModel::with('office')
        ->whereDate('start_date', '<=', now())
        ->whereDate('end_date', '>=', now())
        ->orderBy('start_date', 'desc')
        ->get();

    $oldAnnouncements = AnnouncementModel::with('office')
        ->whereDate('end_date', '<', now())
        ->orderBy('end_date', 'desc')
        ->get();

    $offices = OfficeModel::orderBy('office_name')
        ->get(['office_id', 'office_name']);

    return inertia('Announcements', [
        'announcements' => $announcements,
        'old_announcements' => $oldAnnouncements,
        'offices' => $offices,
    ]);
}

}