<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use App\Models\UserModel;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, $role)
    {
        $userId = Session::get('user_id');
        $user = $userId ? UserModel::find($userId) : null;

        if (! $user || $user->role !== $role) {
            abort(403, 'Unauthorized.');
        }

        return $next($request);
    }
}

