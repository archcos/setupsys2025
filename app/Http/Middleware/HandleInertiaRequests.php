<?php

namespace App\Http\Middleware;

use App\Models\CompanyModel;
use App\Models\NotificationModel;
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

        // Get notifications based on user role
        $notifications = [];
        
        if ($user) {
            if ($user->role === 'user') {
                // For regular users - get notifications for their companies
                $companyIds = CompanyModel::where('added_by', $user->user_id)
                    ->pluck('company_id');
                
                $notifications = NotificationModel::whereIn('company_id', $companyIds)
                    ->latest()
                    ->take(10)
                    ->get();
                    
            } else {
                // For all other roles with office_id
                $notifications = NotificationModel::where('office_id', $user->office_id)
                    ->latest()
                    ->take(10)
                    ->get();
            }
            
        }

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user,
            ],
            'notifications' => $notifications,
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }
}