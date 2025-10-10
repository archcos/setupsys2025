<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Date;


return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \Illuminate\Session\Middleware\StartSession::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\SessionTimeout::class,
            \App\Http\Middleware\BlockSpamIps::class,
        ]);
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'redirectIfAuthenticated' => \App\Http\Middleware\RedirectIfAuthenticated::class,

        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Handle GET /logout and similar method errors
        $exceptions->render(function (MethodNotAllowedHttpException $e, Request $request): RedirectResponse {
            // if ($request->is('logout')) {
            //     return redirect('/');
            // }

            return redirect('/')
                ->withErrors(['message' => 'Invalid request method.']);
        });

        // Optional: Handle 404 errors
        $exceptions->render(function (NotFoundHttpException $e, Request $request): RedirectResponse {
            return redirect('/')
                ->withErrors(['message' => 'Page not found.']);
        });
    })
    ->create();