<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\RegisterController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\Admin\BlockedIpController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ImplementationController;
use App\Http\Controllers\MOAController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PDFController;
use App\Http\Controllers\RefundController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TagController;

Route::middleware(['redirectIfAuthenticated'])->group(function () {
    // Register

    // Login
    Route::get('/', [AuthController::class, 'index'])->name('login');
    Route::post('/signin', [AuthController::class, 'signin'])->name('signin');
    
    //OTP
    Route::get('/verify-otp', [AuthController::class, 'showOtpForm'])->name('otp.verify.form');
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp'])->name('otp.verify');
    Route::post('/resend-otp', [AuthController::class, 'resendOtp'])->name('otp.resend');
});

Route::middleware(['web'])->group(function () {
    Route::get('/register', action: [RegisterController::class, 'index'])->name('offices.index');
    Route::post('/registration', [RegisterController::class, 'register'])->name('registration');
});


Route::middleware(['auth'])->group(function () {
   // Protected Home Page
    Route::get('/home', [HomeController::class, 'index'])->middleware('role:head,staff,rpmo')->name('home');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('user.dashboard')->middleware('role:user');
    Route::get('/users/{id}/edit', [AuthController::class, 'edit'])->name('users.edit');
    Route::put('/users/{id}', [AuthController::class, 'update'])->name('users.update');

    // Logout
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

});


Route::get('/contact', [PageController::class, 'contact'])->name('contact');
Route::post('/contact', [PageController::class, 'sendContact'])
    ->name('contact.send');
Route::get('/about', [PageController::class, 'about'])->name('about');
Route::get('/help', [PageController::class, 'help'])->name('help');
Route::get('/announcements/view', [PageController::class, 'announcements'])->name('announcements.public');


// SIDEBAR
Route::middleware(['auth'])->group(function () {
    Route::resource('companies', CompanyController::class);
    Route::resource('projects', ProjectController::class)->middleware('role:head,staff,rpmo')
        ->except(['destroy', 'show']); // exclude destroy from staff
    Route::delete('/projects/{id}', [ProjectController::class, 'destroy'])
        ->middleware('role:head,rpmo')
        ->name('projects.destroy');    
    Route::resource('activities', ActivityController::class)->middleware('role:head,staff,rpmo');

    Route::get('/project-list', [ProjectController::class, 'readonly'])->name('projects.readonly');
    Route::post('/companies/sync', [CompanyController::class, 'syncFromCSV'])->name('companies.sync');
    Route::get('/activity-list', [ActivityController::class, 'readonly'])->name('activities.readonly');
});


//MOA
Route::middleware(['auth', 'role:head,staff,rpmo'])->group(function () {
    Route::get('/moa/generate-pdf', [PDFController::class, 'index']);
    Route::post('/moa/generate-pdf', [PDFController::class, 'generate']);

    Route::get('/draft-moa', [PDFController::class, 'showForm'])->name('docx.form');
    Route::get('/moa/company/{id}/details', [PDFController::class, 'getCompanyDetails']);
    Route::post('/moa/generate-docx', [PDFController::class, 'generateDocx'])->name('moa.generateDocx');

    Route::get('/moa', [MOAController::class, 'index'])->name('moa.index');
    Route::get('/moa/{moa_id}/docx', [MOAController::class, 'generateFromMoa'])->name('moa.generate.docx');
    Route::get('/moa/{moa_id}/pdf', [MOAController::class, 'viewPdf']);
    Route::get('/review-approval', [ProjectController::class, 'reviewApproval'])
        ->name('projects.review-approval');
    Route::post('/projects/{id}/update-progress', [ProjectController::class, 'updateProgressReview'])
        ->name('projects.update-progress');
    Route::put('/projects/{id}/progress', [ProjectController::class, 'updateProgress'])->middleware('role:staff');
    Route::post('/messages/{id}/toggle-status', [ProjectController::class, 'toggleMessageStatus'])->name('messages.toggle');

});

//NOTIFICATION
Route::middleware(['auth', 'role:head,staff,rpmo'])->group(function () {
Route::post('/notifications/read/{id}', [NotificationController::class, 'markAsRead']);
});


Route::middleware(['auth', 'role:head,staff,rpmo'])->group(function () {
    Route::get('/implementation', [ImplementationController::class, 'index'])->name('implementation.index');
    Route::get('/implementation/checklist/{implementId}', [ImplementationController::class, 'checklist']);
    Route::post('/implementation/upload/{field}', [ImplementationController::class, 'uploadToSupabase']);
    Route::delete('/implementation/delete/{field}', [ImplementationController::class, 'deleteFromSupabase']);
    Route::get('/implementation/download/{field}', [ImplementationController::class, 'download']);

    Route::post('/tags', [TagController::class, 'store']);
    Route::delete('/tags/{id}', [TagController::class, 'destroy']);
    Route::put('/tags/{tagId}', [TagController::class, 'update']);
});


Route::middleware(['auth', 'role:head'])->group(function () {
    Route::get('/admin/users', [UserManagementController::class, 'index'])->name('admin.users');
    Route::put('/admin/users/{id}', [UserManagementController::class, 'update'])->name('admin.users.update');
    Route::post('/admin/users/{id}/logout', [UserManagementController::class, 'forceLogout']);
    Route::post('/admin/users/{id}/delete', [UserManagementController::class, 'deleteUser']);
    Route::put('/admin/users/{id}/restore', [UserManagementController::class, 'restoreUser'])->name('users.restore');
});

Route::middleware(['auth', 'role:head'])->group(function () {
    Route::get('/blocked-ips', [BlockedIpController::class, 'index'])->name('blocked.ips.index');
    Route::post('/blocked-ips', [BlockedIpController::class, 'store'])->name('blocked.ips.store');
    Route::post('blocked-ips/{id}/block-again', [BlockedIpController::class, 'blockAgain'])->name('blocked.blockAgain');
    Route::post('blocked-ips/{id}/unblock', [BlockedIpController::class, 'unblock'])->name('blocked.unblock');
    Route::get('blocked-ips/download', [BlockedIpController::class, 'download'])->name('blocked.download');
});


Route::middleware(['auth'])->group(function () {
    Route::get('/refunds', [RefundController::class, 'index'])->name('refunds.index');
    Route::post('/refunds/save', [RefundController::class, 'save']);
    Route::get('/my-refunds', [RefundController::class, 'userRefunds'])
        ->name('refunds.user');
});

Route::put('/companies/{id}/update-added-by', [CompanyController::class, 'updateAddedBy']);



Route::post('/projects/sync', [ProjectController::class, 'syncProjectsFromCSV'])
    ->middleware('role:head')
    ->name('projects.sync');



Route::middleware(['auth'])->group(function () {
    Route::get('/reports', action: [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/create/{project}', [ReportController::class, 'create'])->name('reports.create');
    Route::post('/reports', [ReportController::class, 'store'])->name('reports.store');
    Route::get('/reports/download/{report}', [ReportController::class, 'downloadReport'])
        ->name('reports.download');
    Route::delete('/reports/{id}', [ReportController::class, 'destroy'])->name('reports.destroy');
});


Route::middleware(['auth', 'role:head,staff,rpmo'])->group(function () {
    Route::get('/announcements', [AnnouncementController::class, 'index'])->name('announcements.index');
    Route::get('/announcements/create', [AnnouncementController::class, 'create'])->name('announcements.create');
    Route::post('/announcements', [AnnouncementController::class, 'store'])->name('announcements.store');
    Route::get('/announcements/{id}/edit', [AnnouncementController::class, 'edit'])->name('announcements.edit');
    Route::put('/announcements/{id}', [AnnouncementController::class, 'update'])->name('announcements.update');
    Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy'])->name('announcements.destroy');
});




