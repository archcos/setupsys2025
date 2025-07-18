<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\RegisterController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ActivityController;
use Inertia\Inertia;

Route::middleware('web')->group(function () {

    // Register
    Route::get('/register', [RegisterController::class, 'index'])->name('offices.index');
    Route::post('/registration', [RegisterController::class, 'register'])->name('registration');

    // Login
    Route::inertia('/', 'Login')->name('login');
    Route::post('/signin', [AuthController::class, 'signin'])->name('signin');

    // Protected Home Page
    Route::get('/home', fn () => inertia('Home'))
        ->middleware('auth.custom')
        ->name('home');

    // Logout
    Route::post('/logout', function () {
        session()->forget('user_id');
        return redirect()->route('login');
    })->name('logout');
});

Route::middleware(['auth.custom'])->group(function () {
    Route::resource('companies', CompanyController::class);
    Route::resource('projects', ProjectController::class);
    Route::resource('activities', ActivityController::class);
});
