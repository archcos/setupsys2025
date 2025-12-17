<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Illuminate\Support\Facades\Log;

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
            'log-suspicious' => \App\Http\Middleware\LogSuspiciousRequests::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Session expired (your 419 error)
        $exceptions->render(function (TokenMismatchException $e, Request $request): RedirectResponse {
            return redirect()->route('login')
                ->withErrors(['message' => 'Your session expired. Please log in again.']);
        });

        // User not logged in
        $exceptions->render(function (AuthenticationException $e, Request $request): RedirectResponse {
            return redirect()->route('login')
                ->withErrors(['message' => 'You must be logged in.']);
        });

        // User doesn't have permission
        $exceptions->render(function (AuthorizationException $e, Request $request): RedirectResponse {
            return redirect()->back()
                ->withErrors(['message' => 'You do not have permission.']);
        });

        // Model not found (e.g., User::findOrFail(999))
        $exceptions->render(function (ModelNotFoundException $e, Request $request): RedirectResponse {
            return redirect()->back()
                ->withErrors(['message' => 'The requested resource was not found.']);
        });

        // Too many requests (rate limiting)
        $exceptions->render(function (TooManyRequestsHttpException $e, Request $request): RedirectResponse {
            return redirect()->back()
                ->withErrors(['message' => 'Too many requests. Please try again later.']);
        });

        // Page not found (404)
        $exceptions->render(function (NotFoundHttpException $e, Request $request): RedirectResponse {
            return redirect('/')->withErrors(['message' => 'Page not found.']);
        });

        // Catch-all for any other unexpected errors
        $exceptions->render(function (Exception $e, Request $request): RedirectResponse {
            Log::error('Unhandled exception: ' . get_class($e) . ' - ' . $e->getMessage());
            
            return redirect('/')->withErrors(['message' => 'Something went wrong.']);
        });
    })
    ->create();