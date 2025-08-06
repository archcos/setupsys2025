<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RedirectIfAuthenticated
{
    public function handle(Request $request, Closure $next)
    {
        if (session()->has('user_id')) {
            $role = session('role'); // adjust based on your session key

            if ($role === 'user') {
                return redirect()->route('user.dashboard');
            }

            // default redirect for admin or staff
            return redirect()->route('home');
        }

        return $next($request);
    }
}
