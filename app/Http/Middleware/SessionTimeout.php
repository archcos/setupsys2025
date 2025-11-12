<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Auth;

class SessionTimeout
{
    protected $timeout = 60; // 10 minutes

    // Routes that shouldn't reset the timeout
    protected $excludedRoutes = [
        'api/notifications/check',
        'api/notifications/poll',
    ];

    public function handle(Request $request, Closure $next)
    {
        // Skip timeout reset for polling/background requests
        foreach ($this->excludedRoutes as $route) {
            if ($request->is($route)) {
                // Check timeout but don't update activity
                if (Session::has('last_activity')) {
                    $inactive = time() - Session::get('last_activity');
                    if ($inactive > $this->timeout) {
                        Session::flush();
                        Auth::logout();
                        return response()->json(['error' => 'Session expired'], 401);
                    }
                }
                return $next($request);
            }
        }

        // For all other requests, check and update timeout
        if (Session::has('last_activity')) {
            $inactive = time() - Session::get('last_activity');
            if ($inactive > $this->timeout) {
                Session::flush();
                Auth::logout();
                return redirect()->route('login')->withErrors([
                    'message' => 'You have been logged out due to inactivity.'
                ]);
            }
        }

        // Update last activity for meaningful interactions
        Session::put('last_activity', time());

        return $next($request);
    }
}