<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use App\Models\UserModel;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $userId = Session::get('user_id');
        $user = $userId ? UserModel::find($userId) : null;

        if (! $user || ! in_array($user->role, $roles)) {
            abort(404, 'Page Not Available');
        }

        return $next($request);
    }
}


