<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use App\Models\UserModel;

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
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Share authenticated user with Inertia
        Inertia::share([
            'auth' => function () {
                $userId = Session::get('user_id');
                if ($userId) {
                    return [
                        'user' => UserModel::find($userId),
                    ];
                }
                return ['user' => null];
            },
        ]);
    }
}
