<?php

namespace App\Providers;

use App\Mail\SecurityAlertMail;
use App\Models\LogModel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
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
     */
    public function boot(): void
    {
        // Log dangerous database queries
        DB::listen(function ($query) {
            $dangerousQueries = ['DROP', 'TRUNCATE', 'DELETE', 'ALTER'];
            
            foreach ($dangerousQueries as $keyword) {
                if (stripos($query->sql, $keyword) !== false) {
                    try {
                        LogModel::create([
                            'user_id' => Auth::id(),
                            'action' => 'Dangerous Query',
                            'description' => "Database query containing {$keyword}",
                            'model_type' => 'Database',
                            'model_id' => 0,
                            'before' => [
                                'query' => $query->sql,
                                'bindings' => $query->bindings,
                            ],
                            'after' => null,
                            'ip_address' => request()->ip(),
                            'user_agent' => request()->userAgent(),
                        ]);
                        Mail::to(config('security.alert_emails'))->send(
                            new SecurityAlertMail('Dangerous Database Query', [
                                'ip_address' => request()->ip(),
                                'user_id' => Auth::id() ?? 'System',
                                'before' => [
                                    'method' => 'Database',
                                    'path' => 'Query Execution',
                                    'query' => $query->sql,
                                ],
                                'user_agent' => request()->userAgent(),
                            ], false) // Not blocked, just logged
                        );
                    } catch (\Exception $e) {
                        Log::error('Failed to log dangerous query: ' . $e->getMessage());
                    }
                    break;
                }
            }
        });

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
