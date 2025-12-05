<?php

use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RegisterController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\Admin\BlockedIpController;
use App\Http\Controllers\Admin\DirectorController;
use App\Http\Controllers\ApplyRestructController;
use App\Http\Controllers\ComplianceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FrequencyController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ImplementationController;
use App\Http\Controllers\MOAController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\RDDashboardController;
use App\Http\Controllers\RefundController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RestructureController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\RtecController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\LogController;
    use App\Mail\SecurityAlertMail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;

Route::middleware(['log-suspicious'])->group(function () {

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
        Route::post('/projects/{id}/update-status', [ProjectController::class, 'updateStatus'])->name('projects.updateStatus');
        Route::get('/project-list', [ProjectController::class, 'readonly'])->name('projects.readonly');
        Route::post('/companies/sync', [CompanyController::class, 'syncFromCSV'])->name('companies.sync');
        Route::get('/activity-list', [ActivityController::class, 'readonly'])->name('activities.readonly');
        Route::post('/companies/{id}/update-added-by', [CompanyController::class, 'updateAddedBy']);
        Route::post('/projects/sync', [ProjectController::class, 'syncProjectsFromCSV'])
        ->middleware('role:rpmo')
        ->name('projects.sync');
    });


    //MOA
    Route::middleware(['auth', 'role:head,staff,rpmo'])->group(function () {
        Route::get('/draft-moa', [MOAController::class, 'showForm'])->name('docx.form');
        Route::post('/moa/generate-docx', [MOAController::class, 'generateDocx'])->name('moa.generateDocx');

            // View approved PDF in browser (new route)
        Route::get('/moa/{moa_id}/view-approved', [MOAController::class, 'viewApprovedFile'])
            ->name('moa.view-approved');

        Route::get('/moa', [MOAController::class, 'index'])->name('moa.index');
        Route::get('/moa/{moa_id}/docx', [MOAController::class, 'generateFromMoa'])->name('moa.generate.docx');

        // New routes for approved file management
        Route::post('/moa/{moa_id}/upload-approved', [MOAController::class, 'uploadApprovedFile'])->name('moa.upload.approved');
        Route::get('/moa/{moa_id}/download-approved', [MOAController::class, 'downloadApprovedFile'])->name('moa.download.approved');
        
        
        Route::put('/projects/{id}/progress', [ProjectController::class, 'updateProgress'])->middleware('role:staff');
    });

    //APPROVAL
    Route::middleware(['auth', 'role:staff,rpmo'])->group(function () {
    Route::get('/approved-projects', [ApprovalController::class, 'index'])->name('approvals.index');
    Route::post('/approvals/{project_id}/generate', [ApprovalController::class, 'generateDocument'])->name('approvals.generate');
    Route::get('/approvals/{project_id}/download/{fileName}', [ApprovalController::class, 'download'])->name('approvals.download');
    Route::get('/approvals', [ApprovalController::class, 'index'])->name('approvals.index');
    });

    //COMPLIANCE
    Route::middleware(['auth'])->group(function () {
        Route::get('/compliance', [ComplianceController::class, 'index'])->name('compliance.index');
        Route::get('/compliance/{id}', [ComplianceController::class, 'show'])->name('compliance.show');
        Route::post('/compliance/store', [ComplianceController::class, 'store'])->name('compliance.store');
        Route::post('/compliance/approve', [ComplianceController::class, 'approve'])->name('compliance.approve');
        Route::post('/compliance/deny', [ComplianceController::class, 'deny'])->name('compliance.deny');
    });

    //RD-DASHBOARD
    Route::middleware(['auth'])->group(function () {
        Route::get('/rd-dashboard', [RDDashboardController::class, 'index'])->name('rd-dashboard.index');
        Route::post('/rd-dashboard/{projectId}/update-status', [RDDashboardController::class, 'updateStatus'])->name('rd-dashboard.update-status');
        Route::get('/rd-dashboard/{projectId}', [RDDashboardController::class, 'show'])->name('rd-dashboard.show');
    });

    //NOTIFICATION
    Route::middleware(['auth'])->group(function () {
        Route::post('/notifications/read/{id}', [NotificationController::class, 'markAsRead']);
        Route::get('/api/notifications/check', [NotificationController::class, 'checkUnread']);
    });

    //IMPLEMENTATION
    Route::middleware(['auth', 'role:staff,rpmo'])->group(function () {
        Route::get('/implementation', [ImplementationController::class, 'index'])->name('implementation.index');
        Route::get('/implementation/checklist/{implementId}', [ImplementationController::class, 'checklist']);
        Route::post('/implementation/upload/{field}', [ImplementationController::class, 'uploadToLocal']);
        Route::delete('/implementation/delete/{field}', [ImplementationController::class, 'deleteFromLocal']);
        Route::get('/implementation/view/{field}', [ImplementationController::class, 'view']);
        Route::get('/implementation/download/{field}', [ImplementationController::class, 'download']);
    });

    //  TAGS: RPMO ONLY 
    Route::middleware(['auth', 'role:rpmo'])->group(function () {
        Route::post('/tags', [TagController::class, 'store']);
        Route::delete('/tags/{id}', [TagController::class, 'destroy']);
        Route::put('/tags/{tagId}', [TagController::class, 'update']);
    });

    //ADMIN
    Route::middleware(['auth', 'role:head'])->group(function () {
        Route::get('/admin/users', [UserManagementController::class, 'index'])->name('admin.users');
        Route::put('/admin/users/{id}', [UserManagementController::class, 'update'])->name('admin.users.update');
        Route::post('/admin/users/{id}/logout', [UserManagementController::class, 'forceLogout']);
        Route::post('/admin/users/{id}/delete', [UserManagementController::class, 'deleteUser']);
        Route::put('/admin/users/{id}/restore', [UserManagementController::class, 'restoreUser'])->name('users.restore');
    });
    //ADMIN-DIRECTORS
    Route::middleware(['auth', 'role:head'])->group(function () {
        Route::get('/admin/directors', [DirectorController::class, 'index'])->name('admin.directors.index');
        Route::put('/admin/directors/{id}', [DirectorController::class, 'update'])->name('admin.directors.update');
    });

    //ADMIN-LOGS
    Route::middleware(['auth', 'role:head'])->group(function () {
        Route::get('/logs', [LogController::class, 'index'])->name('logs.index');
        Route::get('/logs/export', [LogController::class, 'export'])->name('logs.export');
    });

    //BLOCKED-IPS
    Route::middleware(['auth', 'role:head'])->group(function () {
        Route::get('/blocked-ips', [BlockedIpController::class, 'index'])->name('blocked.ips.index');
        Route::post('/blocked-ips', [BlockedIpController::class, 'store'])->name('blocked.ips.store');
        Route::post('blocked-ips/{id}/block-again', [BlockedIpController::class, 'blockAgain'])->name('blocked.blockAgain');
        Route::post('blocked-ips/{id}/unblock', [BlockedIpController::class, 'unblock'])->name('blocked.unblock');
        Route::get('blocked-ips/download', [BlockedIpController::class, 'download'])->name('blocked.download');

        Route::get('/login-frequency', [FrequencyController::class, 'index'])->name('login-frequency.index');
        Route::get('/login-frequency/download', [FrequencyController::class, 'download'])->name('login-frequency.download');

    });

    //  VIEWING (Accessible to staff, rpmo, and users) 
    Route::middleware(['auth', 'role:staff,rpmo'])->group(function () {
        Route::get('/refunds', [RefundController::class, 'index'])->name('refunds.index');
        Route::get('/refunds/project/{projectId}', [RefundController::class, 'projectRefunds'])
            ->name('refunds.project.details');
    });


    //  RPMO ONLY (Save + Bulk Update) 
    Route::middleware(['auth', 'role:rpmo'])->group(function () {
        Route::post('/refunds/save', [RefundController::class, 'save']);
        Route::post('/refunds/bulk-update', [RefundController::class, 'bulkUpdate'])
            ->name('refunds.bulk.update');
    });


    //  USER-ONLY ROUTES 
    Route::middleware(['auth', 'role:user'])->group(function () {
        Route::get('/my-refunds', [RefundController::class, 'userRefunds'])->name('refunds.user');
        Route::get('/user/refunds/{projectId}', [RefundController::class, 'userProjectRefunds'])
            ->name('user.refunds.details');
    });


    //APPLY-RESTRUCT
    Route::middleware(['auth', 'role:staff'])->group(function () {
        // Only staff
            Route::get('/apply-restructuring', [ApplyRestructController::class, 'index'])
                ->name('apply_restruct.index');
            Route::post('/apply-restruct/store', [ApplyRestructController::class, 'store'])
                ->name('apply_restruct.store');
            Route::put('/apply-restruct/{apply_id}', [ApplyRestructController::class, 'update'])
                ->name('apply_restruct.update');
            Route::delete('/apply-restruct/{apply_id}', [ApplyRestructController::class, 'destroy'])
                ->name('apply_restruct.destroy');
    });

    // RESTRUCT
    Route::middleware(['auth',  'role:rpmo,rd'])->group(function () {
        // List of applications to verify (accessible by RPMO and RD)
        Route::get('/verify-restructure', [RestructureController::class, 'verifyList'])
            ->name('verify_restruct.list');
        
        // Show verification page (accessible by RPMO and RD)
        Route::get('/verify-restructure/{apply_id}', [RestructureController::class, 'verifyShow'])
            ->name('verify_restruct.show');
        
        // RPMO only routes - Create, Update, Delete
        Route::middleware(['role:rpmo'])->group(function () {
            Route::post('/restructure', [RestructureController::class, 'store'])
                ->name('restructure.store');
            
            Route::put('/restructure/{restruct_id}', [RestructureController::class, 'update'])
                ->name('restructure.update');
            
            Route::delete('/restructure/{restruct_id}', [RestructureController::class, 'destroy'])
                ->name('restructure.destroy');
        });
        
        // Update status (accessible by both RPMO and RD with different statuses)
        Route::put('/restructure/{restruct_id}/status', [RestructureController::class, 'updateStatus'])
            ->name('restructure.update-status');
        
        // Update refund end date
        Route::put('/project/{project_id}/refund-end', [RestructureController::class, 'updateRefundEnd'])
            ->name('project.update-refund-end');
    });


    // Route::get('/review-approval', [ReviewController::class, 'reviewApproval'])->name('review.approval');
    // Route::post('/projects/{id}/update-progress', [ReviewController::class, 'updateProgressReview'])->name('projects.updateProgress');
    // Route::post('/messages/{id}/toggle-status', [ReviewController::class, 'toggleMessageStatus'])->name('messages.toggleStatus');
    //REPORTS

    Route::middleware(['auth'])->group(function () {
        Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('/reports/create/{project}', [ReportController::class, 'create'])->name('reports.create');
        Route::post('/reports', [ReportController::class, 'store'])->name('reports.store');
        Route::delete('/reports/{id}', [ReportController::class, 'destroy'])->name('reports.destroy');
        
        // New routes for viewing and downloading
        Route::get('/reports/{report_id}/view', [ReportController::class, 'viewReport'])->name('reports.view');
        Route::get('/reports/{report_id}/download', [ReportController::class, 'downloadReport'])->name('reports.download');
    });


    //ANNOUCNEMENTS
    Route::middleware(['auth', 'role:head,staff,rpmo'])->group(function () {
        Route::get('/announcements', [AnnouncementController::class, 'index'])->name('announcements.index');
        Route::get('/announcements/create', [AnnouncementController::class, 'create'])->name('announcements.create');
        Route::post('/announcements', [AnnouncementController::class, 'store'])->name('announcements.store');
        Route::get('/announcements/{id}/edit', [AnnouncementController::class, 'edit'])->name('announcements.edit');
        Route::put('/announcements/{id}', [AnnouncementController::class, 'update'])->name('announcements.update');
        Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy'])->name('announcements.destroy');
    });

});

