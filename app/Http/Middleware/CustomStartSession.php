<?php

namespace App\Http\Middleware;

use Illuminate\Session\Middleware\StartSession as BaseStartSession;

namespace App\Http\Middleware;

use Illuminate\Session\Middleware\StartSession as BaseStartSession;

class CustomStartSession extends BaseStartSession
{
    protected function saveSession($request)
    {
        if ($request->attributes->get('skip_session_touch')) {
            return;
        }

        parent::saveSession($request);
    }
}
