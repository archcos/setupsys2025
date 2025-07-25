<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\RegisterController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\DocxController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MOAController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PDFController;
use App\Http\Controllers\RefundController;
use Inertia\Inertia;

Route::middleware('web')->group(function () {

    // Register
    Route::get('/register', [RegisterController::class, 'index'])->name('offices.index');
    Route::post('/registration', [RegisterController::class, 'register'])->name('registration');

    // Login
    Route::inertia('/', 'Login')->name('login');
    Route::post('/signin', [AuthController::class, 'signin'])->name('signin');

    // Protected Home Page
Route::get('/home', [HomeController::class, 'index'])->middleware('auth.custom')->name('home');


    // Logout
    Route::post('/logout', function () {
        session()->forget('user_id');
        return redirect()->route('login');
    })->name('logout');
});

Route::middleware(['auth.custom'])->group(function () {
    Route::resource('companies', CompanyController::class);
    Route::resource('projects', ProjectController::class);
    Route::get('/projects', [ProjectController::class, 'index'])->middleware('role:admin,staff');
    Route::resource('activities', ActivityController::class);
    Route::get('/project-list', [ProjectController::class, 'readonly'])->name('projects.readonly');
});


Route::middleware(['auth.custom'])->group(function () {
    Route::get('/moa/generate-pdf', [PDFController::class, 'index']);
    Route::post('/moa/generate-pdf', [PDFController::class, 'generate']);
});


// Route::get('/generate-docx-form', [DocxController::class, 'showForm'])->name('docx.form');
// Route::get('/moa/docx-form', function () {
//     return inertia('DocxForm', [
//         'companies' => \App\Models\CompanyModel::all(), // Adjust if you use a different model
//     ]);
// });

// Route::get('/moa/company/{id}/details', [DocxController::class, 'fetchCompanyDetails']);
// Route::post('/moa/generate-docx', [DocxController::class, 'generateDocx'])->name('docx.generate');


Route::get('/draft-moa', [PDFController::class, 'showForm'])->name('docx.form');
Route::get('/moa/company/{id}/details', [PDFController::class, 'getCompanyDetails']);
Route::post('/moa/generate-docx', [PDFController::class, 'generateDocx'])->name('moa.generateDocx');

Route::get('/moa', [MOAController::class, 'index'])->name('moa.index');
Route::get('/moa/{moa_id}/docx', [MOAController::class, 'generateFromMoa'])->name('moa.generate.docx');
Route::get('/moa/{moa_id}/pdf', [MOAController::class, 'viewPdf']);


Route::post('/notifications/read/{id}', [NotificationController::class, 'markAsRead']);
// routes/web.php
Route::post('/refunds/sync', [RefundController::class, 'manualSync']);
Route::get('/refunds', [RefundController::class, 'index'])->name('refunds.index');
Route::post('/refunds/{id}/update-status', [RefundController::class, 'updateStatus']);
