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
        return Inertia::render('Contact', [
            'flash' => [
                    'rate_limit' => "Please wait before sending another message.",
                    'rate_seconds' => $seconds,
            ],
        ]);
    }


    RateLimiter::hit($minuteKey, 600); // 60 second window

    // Validate input
    $validated = $request->validate([
        'name'    => 'required|string|max:255',
        'email'   => 'required|email',
        'subject' => 'required|string|max:255',
        'message' => 'required|string',
        'phone'   => 'nullable|string|max:50',
        'website' => 'nullable|string|max:255', // honeypot
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

    // Send the email
    Mail::raw(
        "New message from: {$validated['name']}\n"
        ."Email: {$validated['email']}\n"
        ."Phone: ".($validated['phone'] ?? 'N/A')."\n\n"
        ."Subject: {$validated['subject']}\n\n"
        ."Message:\n{$validated['message']}",
        function ($mail) use ($validated) {
            $mail->to('setup@region10.dost.gov.ph')
                ->subject('Contact Form: ' . $validated['subject'])
                ->replyTo($validated['email'], $validated['name']);
        }
    );

    return back()->with('success', 'Thank you for contacting us! We\'ll get back to you soon.');
}
        public function about() {
        return Inertia::render('About');
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
