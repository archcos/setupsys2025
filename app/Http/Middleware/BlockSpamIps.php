<?php
// app/Http/Middleware/BlockSpamIps.php

namespace App\Http\Middleware;

use Closure;
use App\Models\BlockedIp;
use Carbon\Carbon;
use Inertia\Inertia;

class BlockSpamIps
{
    protected $except = [
        'contact',        // route name or URI segment
    ];

    public function handle($request, Closure $next)
    {
        // Skip if this request matches any exempted path
        foreach ($this->except as $path) {
            if ($request->is($path) || $request->routeIs($path)) {
                return $next($request);
            }
        }

        $ip = $request->ip();
        $blocked = BlockedIp::where('ip', $ip)->first();

        if ($blocked && $blocked->blocked_until && now()->lessThan($blocked->blocked_until)) {
            return Inertia::render('Blocked', [
                'message' => "You've been temporarily blocked due to suspicious activity.",
                'blockTime' => $blocked->blocked_until,
                'statusCode' => 403,
            ])->toResponse($request)->setStatusCode(403);
        }

        return $next($request);
    }
}
