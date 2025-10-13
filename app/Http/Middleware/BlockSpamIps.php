<?php
// app/Http/Middleware/BlockSpamIps.php

namespace App\Http\Middleware;

use Closure;
use App\Models\BlockedIp;
use Carbon\Carbon;
use Inertia\Inertia;

class BlockSpamIps
{
    public function handle($request, Closure $next)
    {
        $ip = $request->ip();
        $blocked = BlockedIp::where('ip', $ip)->first();

        if ($blocked) {
            if ($blocked->blocked_until && Carbon::now()->lessThan($blocked->blocked_until)) {
                return Inertia::render('Blocked', [
                    'message' => 'Your IP has been temporarily blocked due to suspicious activity.',
                    'blockTime' => $blocked->blocked_until,
                    'statusCode' => 403,
                ])->toResponse($request)->setStatusCode(403);
            }
        }

        return $next($request);
    }
}