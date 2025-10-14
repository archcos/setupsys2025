<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\BlockedIp;
use Inertia\Inertia;
use Carbon\Carbon;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BlockedIpController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $filter = $request->input('filter', 'active'); // default to currently blocked

        $blockedIps = BlockedIp::query()
            ->when($search, fn($q) =>
                $q->where('ip', 'like', "%$search%")
                  ->orWhere('reason', 'like', "%$search%")
            )
            ->when($filter === 'active', fn($q) =>
                $q->where('blocked_until', '>=', now())
            )
            ->when($filter === 'expired', fn($q) =>
                $q->where('blocked_until', '<', now())
            )
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/BlockedIpManagement', [
            'blockedIps' => $blockedIps,
            'filters' => [
                'search' => $search,
                'filter' => $filter,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'ip' => 'required|ip',
            'reason' => 'nullable|string|max:255',
            'duration' => 'required|integer|min:1',
            'unit' => 'required|in:days,hours',
        ]);

        // Calculate expiration
        $expiresAt = $validated['unit'] === 'days'
            ? now()->addDays($validated['duration'])
            : now()->addHours($validated['duration']);

        BlockedIp::create([
            'ip' => $validated['ip'],
            'reason' => $validated['reason'],
            'blocked_until' => $expiresAt,
        ]);

        return back()->with('success', "IP blocked until " . $expiresAt->format('F d, Y h:i A'));
    }

    public function unblock($id)
    {
        $ip = BlockedIp::findOrFail($id);
        $ip->update(['blocked_until' => now()->subDay()]); // mark expired
        return back()->with('success', 'IP unblocked successfully.');
    }

    public function blockAgain($id, Request $request)
    {
        $ip = BlockedIp::findOrFail($id);

        $validated = $request->validate([
            'duration' => 'required|integer|min:1',
            'unit' => 'required|in:days,hours',
        ]);

        $expiresAt = $validated['unit'] === 'days'
            ? now()->addDays($validated['duration'])
            : now()->addHours($validated['duration']);

        $ip->update(['blocked_until' => $expiresAt]);

        return back()->with('success', "IP re-blocked until " . $expiresAt->format('F d, Y h:i A'));
    }

    public function download()
    {
        $response = new StreamedResponse(function () {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['IP Address', 'Reason', 'Blocked Until', 'Created At']);

            BlockedIp::orderBy('created_at', 'desc')->chunk(100, function ($ips) use ($handle) {
                foreach ($ips as $ip) {
                    fputcsv($handle, [
                        $ip->ip,
                        $ip->reason,
                        optional($ip->blocked_until)->toDateTimeString(),
                        $ip->created_at->toDateTimeString(),
                    ]);
                }
            });

            fclose($handle);
        });

        $response->headers->set('Content-Type', 'text/csv');
        $response->headers->set('Content-Disposition', 'attachment; filename="blocked_ips.csv"');
        return $response;
    }
}
