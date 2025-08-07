<?php


namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Auth;

class SessionTimeout
{
    // Timeout in seconds (10 minutes)
    protected $timeout = 600;

    public function handle(Request $request, Closure $next)
    {
        if (Session::has('last_activity')) {
            $inactive = time() - Session::get('last_activity');
            if ($inactive > $this->timeout) {
                Session::flush();
                // Auth::logout(); // optional, only if using Auth
                return redirect()->route('login')->withErrors([
                    'message' => 'You have been logged out due to inactivity.'
                ]);
            }
        }

        // Update last activity timestamp
        Session::put('last_activity', time());

        return $next($request);
    }
}

