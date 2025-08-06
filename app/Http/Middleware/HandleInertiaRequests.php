<?php

namespace App\Http\Middleware;

use App\Models\NotificationModel;
use App\Models\UserModel;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
  public function share(Request $request): array
{
    $user = $request->session()->has('user_id')
        ? UserModel::find($request->session()->get('user_id'))
        : null;

    return array_merge(parent::share($request), [
        'auth' => [
            'user' => $user,
        ],
        'notifications' => $user
            ? NotificationModel::where('office_id', $user->office_id)
                ->latest()
                ->take(10)
                ->get()
            : [],
        'flash' => [
            'success' => $request->session()->get('success'),
            'error' => $request->session()->get('error'),
        ],
    ]);
}

}
