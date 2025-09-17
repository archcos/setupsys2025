<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\RegisterController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ImplementationController;
use App\Http\Controllers\MOAController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PDFController;
use App\Http\Controllers\RefundController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TagController;

Route::middleware(['redirectIfAuthenticated'])->group(function () {
    // Register

    // Login
    Route::inertia('/', 'Login')->name('login');
    Route::post('/signin', [AuthController::class, 'signin'])->name('signin');

});

Route::middleware(['web'])->group(function () {
    Route::get('/register', action: [RegisterController::class, 'index'])->name('offices.index');
    Route::post('/registration', [RegisterController::class, 'register'])->name('registration');
});


Route::middleware(['auth'])->group(function () {
   // Protected Home Page
    Route::get('/home', [HomeController::class, 'index'])->middleware('role:admin,staff')->name('home');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('user.dashboard')->middleware('role:user');
    Route::get('/users/{id}/edit', [AuthController::class, 'edit'])->name('users.edit');
    Route::put('/users/{id}', [AuthController::class, 'update'])->name('users.update');

    // Logout
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

});


// SIDEBAR
Route::middleware(['auth'])->group(function () {
    Route::resource('companies', CompanyController::class);
    Route::resource('projects', ProjectController::class)->middleware('role:admin,staff')
        ->except(['destroy', 'show']); // exclude destroy from staff
    Route::delete('/projects/{id}', [ProjectController::class, 'destroy'])
        ->middleware('role:admin')
        ->name('projects.destroy');    
    Route::resource('activities', ActivityController::class)->middleware('role:admin,staff');

    Route::get('/project-list', [ProjectController::class, 'readonly'])->name('projects.readonly');
    Route::post('/companies/sync', [CompanyController::class, 'syncFromCSV'])->name('companies.sync');
    Route::get('/activity-list', [ActivityController::class, 'readonly'])->name('activities.readonly');
});


//MOA
Route::middleware(['auth', 'role:admin,staff'])->group(function () {
    Route::get('/moa/generate-pdf', [PDFController::class, 'index']);
    Route::post('/moa/generate-pdf', [PDFController::class, 'generate']);

    Route::get('/draft-moa', [PDFController::class, 'showForm'])->name('docx.form');
    Route::get('/moa/company/{id}/details', [PDFController::class, 'getCompanyDetails']);
    Route::post('/moa/generate-docx', [PDFController::class, 'generateDocx'])->name('moa.generateDocx');

    Route::get('/moa', [MOAController::class, 'index'])->name('moa.index');
    Route::get('/moa/{moa_id}/docx', [MOAController::class, 'generateFromMoa'])->name('moa.generate.docx');
    Route::get('/moa/{moa_id}/pdf', [MOAController::class, 'viewPdf']);

    Route::put('/projects/{id}/progress', [ProjectController::class, 'updateProgress'])->middleware('role:staff');

});

//NOTIFICATION
Route::middleware(['auth', 'role:admin,staff'])->group(function () {
Route::post('/notifications/read/{id}', [NotificationController::class, 'markAsRead']);
});


Route::middleware(['auth', 'role:admin,staff'])->group(function () {
    Route::get('/implementation', [ImplementationController::class, 'index'])->name('implementation.index');
    Route::get('/implementation/checklist/{implementId}', [ImplementationController::class, 'checklist']);
    Route::post('/implementation/upload/{field}', [ImplementationController::class, 'uploadToSupabase']);
    Route::delete('/implementation/delete/{field}', [ImplementationController::class, 'deleteFromSupabase']);
    Route::get('/implementation/download/{field}', [ImplementationController::class, 'download']);

    Route::post('/tags', [TagController::class, 'store']);
    Route::delete('/tags/{id}', [TagController::class, 'destroy']);
    Route::put('/tags/{tagId}', [TagController::class, 'update']);
});


Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/admin/users', [UserManagementController::class, 'index'])->name('admin.users');
    Route::put('/admin/users/{id}', [UserManagementController::class, 'update'])->name('admin.users.update');
    Route::post('/admin/users/{id}/logout', [UserManagementController::class, 'forceLogout']);
    Route::post('/admin/users/{id}/delete', [UserManagementController::class, 'deleteUser']);
});

Route::middleware(['auth'])->group(function () {
    Route::get('/refunds', [RefundController::class, 'index']);
    Route::post('/refunds/save', [RefundController::class, 'save']);
    Route::get('/my-refunds', [RefundController::class, 'userRefunds'])
        ->name('refunds.user');
});

Route::put('/companies/{id}/update-added-by', [CompanyController::class, 'updateAddedBy']);



Route::post('/projects/sync', [ProjectController::class, 'syncProjectsFromCSV'])
    ->middleware('role:admin')
    ->name('projects.sync');



Route::middleware(['auth'])->group(function () {
    Route::get('/reports', action: [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/create/{project}', [ReportController::class, 'create'])->name('reports.create');
    Route::post('/reports', [ReportController::class, 'store'])->name('reports.store');
    Route::get('/reports/download/{report}', [ReportController::class, 'downloadReport'])
        ->name('reports.download');
    Route::delete('/reports/{id}', [ReportController::class, 'destroy'])->name('reports.destroy');
});



