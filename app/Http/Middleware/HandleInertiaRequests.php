<?php

namespace App\Http\Middleware;

use App\Models\ProponentModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = Auth::user();

  
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user,
            ],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
                'warning' => $request->session()->pull('warning'),
            ],
            'errors' => $request->session()->get('errors') 
                ? $request->session()->get('errors')->getBag('default')->getMessages()
                : [],
        ]);
    }
}