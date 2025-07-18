<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateUser
{
    public function handle(Request $request, Closure $next): Response
{
    if (! session()->has('user_id')) {
        // 🔍 Debug this:
         if ($request->expectsJson()) {
                return redirect()->route('login');
            }

        return redirect()->route('login')->withErrors([
            'message' => 'Please login first.',
        ]);
    }

    return $next($request);
}

}

