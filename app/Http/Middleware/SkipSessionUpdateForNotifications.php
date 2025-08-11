<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Session\Middleware\StartSession;

class SkipSessionUpdateForNotifications
{
    public function handle(Request $request, Closure $next)
    {
        // Detect if Inertia-only request for notifications
        if (
            $request->header('X-Inertia') &&
            $request->has('only') &&
            in_array('notifications', (array) $request->input('only'))
        ) {
            // Prevent session from being "touched"
            $request->attributes->set('skip_session_touch', true);
        }

        return $next($request);
    }
}
