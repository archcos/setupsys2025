<?php
namespace App\Http\Middleware;

use Closure;
use App\Models\BlockedIp;

class BlockSpamIps
{
    public function handle($request, Closure $next)
    {
        $ip = $request->ip();
        $blocked = BlockedIp::where('ip', $ip)->first();

        if ($blocked && $blocked->blocked_until && now()->lessThan($blocked->blocked_until)) {
            exit(); // Silently exit without returning anything
        }

        return $next($request);
    }
}