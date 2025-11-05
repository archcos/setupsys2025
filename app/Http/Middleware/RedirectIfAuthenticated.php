<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RedirectIfAuthenticated
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check()) {
            $user = Auth::user();

            // No role assigned — prevent login
            if (empty($user->role)) {
                Auth::logout();
                return redirect()->route('login')->withErrors([
                    'message' => 'Your account does not have a valid role assigned. Please contact the administrator.',
                ]);
            }

            // Role-based redirects
            if ($user->role === 'user') {
                return redirect()->route('user.dashboard');
            }

            if (in_array($user->role, ['irtec', 'ertec', 'rd', 'au'])) {
                return redirect()->route('rtec.dashboard');
            }

            if (in_array($user->role, ['staff', 'rpmo'])) {
                return redirect()->route('home');
            }

            // Block all other roles
            Auth::logout();
            return redirect()->route('login')->withErrors([
                'message' => 'You do not have permission to access the system. Please contact the administrator.',
            ]);
        }

        return $next($request);
    }
}
