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

            if ($user->role === 'user') {
                return redirect()->route('user.dashboard');
            }

            // Default redirect for admin or staff
            return redirect()->route('home');
        }

        return $next($request);
    }
}
