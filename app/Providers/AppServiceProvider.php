<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;


class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */public function boot(): void
{



    Vite::prefetch(concurrency: 3);
    date_default_timezone_set('Asia/Manila');


        // if (app()->environment('local')) {
        //     URL::forceScheme('https');
        // }

        // ngrok http 8000

        // cloudflared tunnel --url http://127.0.0.1:8000

    // Inertia::share([
    //     'auth' => function () {
    //         $userId = Session::get('user_id');
    //         return [
    //             'user' => $userId ? UserModel::find($userId) : null,
    //         ];
    //     },
    //     'notifications' => function () {
    //         $userId = Session::get('user_id');
    //         $user = $userId ? UserModel::find($userId) : null;

    //         if ($user && $user->role !== 'user') {
    //             return NotificationModel::where('office_id', $user->office_id)
    //                 ->where('is_read', false)
    //                 ->latest()
    //                 ->take(5)
    //                 ->get();
    //         }

    //         return [];
    //     },
    // ]);
}
}
