<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\BlockedIp;

class BlockSpamIps
{
    public function handle($request, Closure $next)
    {
        $ip = $request->ip();

        if (BlockedIp::where('ip', $ip)->exists()) {
            sleep(10);
            abort(403, '');
        }

        return $next($request);
    }
}
