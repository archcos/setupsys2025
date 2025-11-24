<?php

namespace App\Http\Controllers;

use App\Mail\RestructureApprovedMail;
use App\Mail\RestructureRaisedMail;
use App\Mail\RestructureDeniedMail;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\RestructureModel;
use App\Models\RestructureUpdateModel;
use App\Models\ApplyRestructModel;
use App\Models\DirectorModel;
use App\Models\ProjectModel;
use App\Models\RefundModel;
use App\Models\UserModel;
use App\Models\OfficeModel;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class RestructureController extends Controller
{
public function verifyList(Request $request)
{
    $user = Auth::user();
    
    // Get filter parameters
    $search = $request->input('search', '');
    $perPage = $request->input('perPage', 10);
    $officeFilter = $request->input('officeFilter', '');
    $statusFilter = $request->input('statusFilter', '');
    $sortBy = $request->input('sortBy', 'desc'); // 'asc' or 'desc'
    
    // Build query
    $query = ApplyRestructModel::with(['project.company.office', 'addedBy', 'restructure']);
    
    // Role-based filtering
    if ($user->role === 'rd') {
        $projectIds = RestructureModel::whereIn('status', ['raised', 'approved'])
            ->distinct()
            ->pluck('project_id')
            ->toArray();
        
        $query->whereIn('project_id', $projectIds);
    }
    
    // Search filter
    if (!empty($search)) {
        $query->where(function($q) use ($search) {
            $q->whereHas('project', function($projectQuery) use ($search) {
                $projectQuery->where('project_title', 'like', "%{$search}%")
                    ->orWhereHas('company', function($companyQuery) use ($search) {
                        $companyQuery->where('company_name', 'like', "%{$search}%");
                    });
            });
        });
    }
    
    // Office filter - only filter if a specific office is selected
    if (!empty($officeFilter)) {
        $query->whereHas('project.company', function($q) use ($officeFilter) {
            $q->where('office_id', $officeFilter);
        });
    }
    
    // Status filter - check the related restructure
    if (!empty($statusFilter)) {
        if ($statusFilter === 'pending') {
            // For pending, either no restructure exists or restructure exists with pending status
            $query->where(function($q) {
                $q->doesntHave('restructure')
                  ->orWhereHas('restructure', function($subQ) {
                      $subQ->where('status', 'pending');
                  });
            });
        } else {
            $query->whereHas('restructure', function($q) use ($statusFilter) {
                $q->where('status', $statusFilter);
            });
        }
    }
    
    // Sort by created_at
    if ($sortBy === 'asc') {
        $query->oldest();
    } else {
        $query->latest();
    }
    
    // Paginate results with withQueryString() to preserve query params
    $applyRestructs = $query->paginate($perPage)->withQueryString();
    
    // Get all offices for filter dropdown (not filtered by user's office)
    $offices = OfficeModel::orderBy('office_name')->get();

    return Inertia::render('Restructures/RestructureList', [
        'applyRestructs' => $applyRestructs,
        'offices' => $offices,
        'filters' => [
            'search' => $search,
            'perPage' => $perPage,
            'officeFilter' => $officeFilter,
            'statusFilter' => $statusFilter,
            'sortBy' => $sortBy,
        ],
        'auth' => [
            'user' => $user,
        ],
    ]);
}

    public function verifyShow($apply_id)
    {
        $user = Auth::user();
        
        $applyRestruct = ApplyRestructModel::with(['project', 'addedBy'])
            ->findOrFail($apply_id);

        $project = ProjectModel::findOrFail($applyRestruct->project_id);

        $restructuresQuery = RestructureModel::where('project_id', $project->project_id)
            ->with(['addedBy', 'updates' => function($query) {
                $query->orderBy('update_start');
            }]);
        
        if ($user->role === 'rd') {
            $restructuresQuery->whereIn('status', ['raised', 'approved']);
        }
        
        $restructures = $restructuresQuery->latest()->get();

        return Inertia::render('Restructures/VerifyRestructure', [
            'applyRestruct' => $applyRestruct,
            'project' => $project,
            'restructures' => $restructures,
            'auth' => [
                'user' => $user,
            ],
        ]);
    }

    private function hasDateOverlap($projectId, $newStart, $newEnd, $excludeId = null)
    {
        $query = RestructureModel::where('project_id', $projectId);
        
        if ($excludeId) {
            $query->where('restruct_id', '!=', $excludeId);
        }

        $existingRestructures = $query->get();

        foreach ($existingRestructures as $existing) {
            $existingStart = strtotime($existing->restruct_start);
            $existingEnd = strtotime($existing->restruct_end);
            $newStartTime = strtotime($newStart);
            $newEndTime = strtotime($newEnd);

            if ($newStartTime <= $existingEnd && $newEndTime >= $existingStart) {
                return [
                    'overlap' => true,
                    'existing' => $existing
                ];
            }
        }

        return ['overlap' => false];
    }

    public function store(Request $request)
    {
        Log::info('Restructure Store Request:', $request->all());

        try {
$validated = $request->validate([
    'project_id' => 'required|exists:tbl_projects,project_id',
    'apply_id' => 'required|exists:tbl_apply_restruct,apply_id',
    'type' => 'required|string|max:50',
    'restruct_start' => 'required|string',
    'restruct_end' => 'required|string',
    'status' => 'required|in:approved,raised,pending',
    'remarks' => 'required|string',
    'new_refund_end' => 'nullable|string',
    'updates' => 'nullable|array',
    'updates.*.update_start' => 'required_with:updates|string',
    'updates.*.update_end' => 'required_with:updates|string',
    'updates.*.update_amount' => 'required_with:updates|numeric|min:0',
]);

$project = ProjectModel::findOrFail($request->project_id);

$restructStart = $request->restruct_start . '-01';
$restructEnd = $request->restruct_end . '-01';

if (strtotime($restructEnd) <= strtotime($restructStart)) {
    return redirect()->back()->withErrors([
        'restruct_end' => 'End date must be after start date'
    ])->withInput();
}

$refundInitial = strtotime($project->refund_initial);

// Determine the effective refund end (use new_refund_end if provided, otherwise use project refund_end)
$effectiveRefundEnd = $request->new_refund_end 
    ? strtotime($request->new_refund_end . '-01')
    : strtotime($project->refund_end);

$startTime = strtotime($restructStart);
$endTime = strtotime($restructEnd);

if ($startTime < $refundInitial || $startTime > $effectiveRefundEnd) {
    return redirect()->back()->withErrors([
        'restruct_start' => 'Start date must be within the project refund period (' . 
            date('M Y', $refundInitial) . ' to ' . date('M Y', $effectiveRefundEnd) . ')'
    ])->withInput();
}

if ($endTime < $refundInitial || $endTime > $effectiveRefundEnd) {
    return redirect()->back()->withErrors([
        'restruct_end' => 'End date must be within the project refund period (' . 
            date('M Y', $refundInitial) . ' to ' . date('M Y', $effectiveRefundEnd) . ')'
    ])->withInput();
}

// Validate new_refund_end if provided
if ($request->new_refund_end) {
    $newRefundEndTime = strtotime($request->new_refund_end . '-01');
    
    if ($newRefundEndTime < $refundInitial) {
        return redirect()->back()->withErrors([
            'new_refund_end' => 'New refund end date must be after the refund start date (' . 
                date('M Y', $refundInitial) . ')'
        ])->withInput();
    }
    
    if ($newRefundEndTime < $endTime) {
        return redirect()->back()->withErrors([
            'new_refund_end' => 'New refund end date must be after the restructuring end date (' . 
                date('M Y', $endTime) . ')'
        ])->withInput();
    }
}

$overlapCheck = $this->hasDateOverlap($request->project_id, $restructStart, $restructEnd);

if ($overlapCheck['overlap']) {
    $existing = $overlapCheck['existing'];
    return redirect()->back()->withErrors([
        'restruct_start' => 'The selected date range overlaps with an existing restructuring (' . 
            $existing->type . ': ' . 
            date('M Y', strtotime($existing->restruct_start)) . ' to ' . 
            date('M Y', strtotime($existing->restruct_end)) . ')'
    ])->withInput();
}

if ($request->has('updates') && is_array($request->updates)) {
    $restructEndTime = strtotime($restructEnd);
    
    foreach ($request->updates as $update) {
        $updateStart = $update['update_start'] . '-01';
        $updateEnd = $update['update_end'] . '-01';
        $updateStartTime = strtotime($updateStart);
        $updateEndTime = strtotime($updateEnd);

        if ($updateEndTime <= $updateStartTime) {
            return redirect()->back()->withErrors([
                'updates' => 'Update end date must be after start date'
            ])->withInput();
        }

        if ($updateStartTime <= $restructEndTime) {
            return redirect()->back()->withErrors([
                'updates' => 'Update start date must be after the restructuring end date (' . 
                    date('M Y', $restructEndTime) . ')'
            ])->withInput();
        }

        if ($updateEndTime > $effectiveRefundEnd) {
            return redirect()->back()->withErrors([
                'updates' => 'Update end date cannot exceed the project refund end date (' . 
                    date('M Y', $effectiveRefundEnd) . ')'
            ])->withInput();
        }
    }
}

$restructure = RestructureModel::create([
    'project_id' => $request->project_id,
    'apply_id' => $request->apply_id,
    'added_by' => Auth::id(),
    'type' => $request->type,
    'status' => $request->status,
    'remarks' => $request->remarks,
    'restruct_start' => $restructStart,
    'restruct_end' => $restructEnd,
    'new_refund_end' => $request->new_refund_end ? $request->new_refund_end . '-01' : null,
]);

            if ($request->has('updates') && is_array($request->updates)) {
                foreach ($request->updates as $update) {
                    RestructureUpdateModel::create([
                        'restruct_id' => $restructure->restruct_id,
                        'update_start' => $update['update_start'] . '-01',
                        'update_end' => $update['update_end'] . '-01',
                        'update_amount' => $update['update_amount'],
                    ]);
                }
            }

            Log::info('Restructure created successfully:', [
                'id' => $restructure->restruct_id,
                'data' => $restructure->toArray()
            ]);

            // Send emails if status is raised or pending
            if (in_array($request->status, ['raised', 'pending'])) {
                Log::info('=== SENDING EMAILS AFTER CREATE ===', [
                    'status' => $request->status,
                    'timestamp' => now()->toDateTimeString()
                ]);
                
                try {
                    // Reload with relationships for email
                    $restructure = RestructureModel::with(['project.company', 'addedBy'])->findOrFail($restructure->restruct_id);
                    
                    $this->sendStatusUpdateEmailsSync($restructure, $request->status, $request->remarks);
                    
                    Log::info('=== EMAILS SENT SUCCESSFULLY ===');
                    
                    // Add delay to ensure emails complete
                    sleep(2);
                    
                } catch (\Exception $emailError) {
                    Log::error('Email sending failed:', [
                        'error' => $emailError->getMessage(),
                        'trace' => $emailError->getTraceAsString()
                    ]);
                }
            }

            $statusMessage = $request->status === 'raised' ? 'raised' : 'added';
            return redirect()->back()->with('success', "Restructuring {$statusMessage} successfully. Email notifications have been sent.");

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation Error:', $e->errors());
            return redirect()->back()->withErrors($e->errors())->withInput();
            
        } catch (\Exception $e) {
            Log::error('Restructure Store Error:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->withErrors([
                'error' => 'Failed to add restructuring: ' . $e->getMessage()
            ])->withInput();
        }
    }

    public function update(Request $request, $restruct_id)
    {
        Log::info('Restructure Update Request:', [
            'restruct_id' => $restruct_id,
            'data' => $request->all()
        ]);

        try {
           $validated = $request->validate([
    'apply_id' => 'required|exists:tbl_apply_restruct,apply_id',
    'type' => 'required|string|max:50',
    'restruct_start' => 'required|string',
    'restruct_end' => 'required|string',
    'status' => 'required|in:approved,raised,pending',
    'remarks' => 'required|string',
    'new_refund_end' => 'nullable|string',
    'updates' => 'nullable|array',
    'updates.*.update_start' => 'required_with:updates|string',
    'updates.*.update_end' => 'required_with:updates|string',
    'updates.*.update_amount' => 'required_with:updates|numeric|min:0',
]);

$restructure = RestructureModel::findOrFail($restruct_id);
$project = ProjectModel::findOrFail($restructure->project_id);

$restructStart = $request->restruct_start . '-01';
$restructEnd = $request->restruct_end . '-01';

if (strtotime($restructEnd) <= strtotime($restructStart)) {
    return redirect()->back()->withErrors([
        'restruct_end' => 'End date must be after start date'
    ])->withInput();
}

$refundInitial = strtotime($project->refund_initial);

// Determine the effective refund end (use new_refund_end if provided, otherwise use project refund_end)
$effectiveRefundEnd = $request->new_refund_end 
    ? strtotime($request->new_refund_end . '-01')
    : strtotime($project->refund_end);

$startTime = strtotime($restructStart);
$endTime = strtotime($restructEnd);

if ($startTime < $refundInitial || $startTime > $effectiveRefundEnd) {
    return redirect()->back()->withErrors([
        'restruct_start' => 'Start date must be within the project refund period (' . 
            date('M Y', $refundInitial) . ' to ' . date('M Y', $effectiveRefundEnd) . ')'
    ])->withInput();
}

if ($endTime < $refundInitial || $endTime > $effectiveRefundEnd) {
    return redirect()->back()->withErrors([
        'restruct_end' => 'End date must be within the project refund period (' . 
            date('M Y', $refundInitial) . ' to ' . date('M Y', $effectiveRefundEnd) . ')'
    ])->withInput();
}

// Validate new_refund_end if provided
if ($request->new_refund_end) {
    $newRefundEndTime = strtotime($request->new_refund_end . '-01');
    
    if ($newRefundEndTime < $refundInitial) {
        return redirect()->back()->withErrors([
            'new_refund_end' => 'New refund end date must be after the refund start date (' . 
                date('M Y', $refundInitial) . ')'
        ])->withInput();
    }
    
    if ($newRefundEndTime < $endTime) {
        return redirect()->back()->withErrors([
            'new_refund_end' => 'New refund end date must be after the restructuring end date (' . 
                date('M Y', $endTime) . ')'
        ])->withInput();
    }
}

$overlapCheck = $this->hasDateOverlap($restructure->project_id, $restructStart, $restructEnd, $restruct_id);

if ($overlapCheck['overlap']) {
    $existing = $overlapCheck['existing'];
    return redirect()->back()->withErrors([
        'restruct_start' => 'The selected date range overlaps with an existing restructuring (' . 
            $existing->type . ': ' . 
            date('M Y', strtotime($existing->restruct_start)) . ' to ' . 
            date('M Y', strtotime($existing->restruct_end)) . ')'
    ])->withInput();
}

if ($request->has('updates') && is_array($request->updates)) {
    $restructEndTime = strtotime($restructEnd);
    
    foreach ($request->updates as $update) {
        $updateStart = $update['update_start'] . '-01';
        $updateEnd = $update['update_end'] . '-01';
        $updateStartTime = strtotime($updateStart);
        $updateEndTime = strtotime($updateEnd);

        if ($updateEndTime <= $updateStartTime) {
            return redirect()->back()->withErrors([
                'updates' => 'Update end date must be after start date'
            ])->withInput();
        }

        if ($updateStartTime <= $restructEndTime) {
            return redirect()->back()->withErrors([
                'updates' => 'Update start date must be after the restructuring end date (' . 
                    date('M Y', $restructEndTime) . ')'
            ])->withInput();
        }

        if ($updateEndTime > $effectiveRefundEnd) {
            return redirect()->back()->withErrors([
                'updates' => 'Update end date cannot exceed the project refund end date (' . 
                    date('M Y', $effectiveRefundEnd) . ')'
            ])->withInput();
        }
    }
}

$restructure->update([
    'apply_id' => $request->apply_id,
    'type' => $request->type,
    'restruct_start' => $restructStart,
    'restruct_end' => $restructEnd,
    'status' => $request->status,
    'remarks' => $request->remarks,
    'new_refund_end' => $request->new_refund_end ? $request->new_refund_end . '-01' : null,
]);

            RestructureUpdateModel::where('restruct_id', $restruct_id)->delete();
            
            if ($request->has('updates') && is_array($request->updates)) {
                foreach ($request->updates as $update) {
                    RestructureUpdateModel::create([
                        'restruct_id' => $restructure->restruct_id,
                        'update_start' => $update['update_start'] . '-01',
                        'update_end' => $update['update_end'] . '-01',
                        'update_amount' => $update['update_amount'],
                    ]);
                }
            }

            Log::info('Restructure updated successfully:', $restructure->toArray());

            // Send emails if status is raised or pending
            if (in_array($request->status, ['raised', 'pending'])) {
                Log::info('=== SENDING EMAILS AFTER UPDATE ===', [
                    'status' => $request->status,
                    'timestamp' => now()->toDateTimeString()
                ]);
                
                try {
                    // Reload with relationships for email
                    $restructure = RestructureModel::with(['project.company', 'addedBy'])->findOrFail($restructure->restruct_id);
                    
                    $this->sendStatusUpdateEmailsSync($restructure, $request->status, $request->remarks);
                    
                    Log::info('=== EMAILS SENT SUCCESSFULLY ===');
                    
                    // Add delay to ensure emails complete
                    sleep(2);
                    
                } catch (\Exception $emailError) {
                    Log::error('Email sending failed:', [
                        'error' => $emailError->getMessage(),
                        'trace' => $emailError->getTraceAsString()
                    ]);
                }
            }

            $statusMessage = $request->status === 'raised' ? 'raised' : 'updated';
            return redirect()->back()->with('success', "Restructuring {$statusMessage} successfully. Email notifications have been sent.");

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation Error:', $e->errors());
            return redirect()->back()->withErrors($e->errors())->withInput();
            
        } catch (\Exception $e) {
            Log::error('Restructure Update Error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->withErrors([
                'error' => 'Failed to update restructuring: ' . $e->getMessage()
            ])->withInput();
        }
    }

    public function destroy($restruct_id)
    {
        try {
            $restructure = RestructureModel::findOrFail($restruct_id);
            
            RestructureUpdateModel::where('restruct_id', $restruct_id)->delete();
            
            $restructure->delete();

            Log::info('Restructure deleted:', ['restruct_id' => $restruct_id]);

            return redirect()->back()->with('success', 'Restructuring deleted successfully.');
            
        } catch (\Exception $e) {
            Log::error('Restructure Delete Error:', [
                'message' => $e->getMessage()
            ]);
            
            return redirect()->back()->withErrors([
                'error' => 'Failed to delete restructuring: ' . $e->getMessage()
            ]);
        }
    }

    public function updateStatus(Request $request, $restruct_id)
    {
        try {
            Log::info('=== STATUS UPDATE STARTED ===', [
                'restruct_id' => $restruct_id,
                'request_data' => $request->all(),
                'user_role' => Auth::user()->role ?? 'unknown',
                'timestamp' => now()->toDateTimeString()
            ]);

            $validated = $request->validate([
                'status' => 'required|in:raised,pending,approved',
                'remarks' => 'required|string',
            ]);

            $restructure = RestructureModel::findOrFail($restruct_id);
            $userRole = Auth::user()->role;

            // Role-based validation
            if ($userRole === 'rpmo') {
                if (!in_array($validated['status'], ['raised', 'pending'])) {
                    return redirect()->back()->withErrors([
                        'error' => 'RPMO can only raise or deny restructuring requests.'
                    ]);
                }
            } elseif ($userRole === 'rd') {
                if ($restructure->status !== 'raised') {
                    return redirect()->back()->withErrors([
                        'error' => 'Only raised restructuring requests can be approved or denied.'
                    ]);
                }
                
                if (!in_array($validated['status'], ['approved', 'pending'])) {
                    return redirect()->back()->withErrors([
                        'error' => 'RD can only approve or deny restructuring requests.'
                    ]);
                }
            } else {
                return redirect()->back()->withErrors([
                    'error' => 'You do not have permission to update restructuring status.'
                ]);
            }
            
            Log::info('Validation passed, updating restructure status');
            
            // Update the restructure
            $restructure->update([
                'status' => $validated['status'],
                'remarks' => $validated['remarks'],
            ]);

            Log::info('Restructure status updated successfully', [
                'new_status' => $validated['status']
            ]);

            // Reload with relationships
            $restructure = RestructureModel::with(['project.company', 'addedBy'])->findOrFail($restruct_id);
            
            Log::info('Relationships loaded', [
                'has_project' => isset($restructure->project),
                'has_company' => isset($restructure->project->company),
                'has_added_by' => isset($restructure->addedBy)
            ]);
            
            // Create refund entries if approved
            if ($validated['status'] === 'approved') {
                Log::info('Status is approved, creating refund entries...');
                $this->createRestructuredRefundEntries($restructure);
                Log::info('Refund entries created successfully');
            }

            // Update project refund_end if restructure is approved and has new_refund_end
            if ($validated['status'] === 'approved' && $restructure->new_refund_end) {
                $oldRefundEnd = $restructure->project->refund_end;
                
                $restructure->project->update([
                    'refund_end' => $restructure->new_refund_end,
                ]);
                
                Log::info('Project refund_end updated from restructure', [
                    'project_id' => $restructure->project_id,
                    'old_refund_end' => $oldRefundEnd,
                    'new_refund_end' => $restructure->new_refund_end,
                ]);
            }

            // Send emails SYNCHRONOUSLY
            Log::info('=== STARTING EMAIL SENDING PROCESS ===', [
                'status' => $validated['status'],
                'timestamp' => now()->toDateTimeString()
            ]);
            
            $emailStartTime = microtime(true);
            
            try {
                $this->sendStatusUpdateEmailsSync($restructure, $validated['status'], $validated['remarks']);
                
                $emailEndTime = microtime(true);
                $emailDuration = round($emailEndTime - $emailStartTime, 2);
                
                Log::info('=== EMAIL SENDING COMPLETED SUCCESSFULLY ===', [
                    'duration_seconds' => $emailDuration
                ]);
            } catch (\Exception $emailError) {
                Log::error('Email sending failed but continuing:', [
                    'error' => $emailError->getMessage(),
                    'trace' => $emailError->getTraceAsString()
                ]);
            }
            
            // Add delay to ensure all emails are fully sent before redirect
            Log::info('Adding post-email delay to ensure completion...');
            sleep(2);
            Log::info('Post-email delay completed');
            
            Log::info('=== STATUS UPDATE COMPLETED ===', [
                'restruct_id' => $restructure->restruct_id,
                'final_status' => $validated['status'],
                'updated_by' => Auth::user()->name,
                'timestamp' => now()->toDateTimeString()
            ]);

            $statusMessage = $validated['status'] === 'approved' ? 'approved' : 
                            ($validated['status'] === 'raised' ? 'raised' : 'denied');

            return redirect()->back()
                ->with('success', "Restructuring request has been {$statusMessage} successfully. Email notifications have been sent.");
                    
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation Error:', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            
            return redirect()->back()->withErrors($e->errors())->withInput();
            
        } catch (\Exception $e) {
            Log::error('=== STATUS UPDATE ERROR ===', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->withErrors([
                'error' => 'Failed to update status: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Send emails synchronously (not queued) to ensure they're sent before page redirect
     */
    private function sendStatusUpdateEmailsSync(RestructureModel $restructure, $status, $remarks)
    {
        try {
            Log::info('sendStatusUpdateEmailsSync called', [
                'restructure_id' => $restructure->restruct_id,
                'status' => $status,
                'timestamp' => now()->toDateTimeString()
            ]);

            if ($status === 'raised') {
                Log::info('Preparing to send RAISED emails');
                $this->sendRaisedEmailsSync($restructure, $remarks);
            } elseif ($status === 'approved') {
                Log::info('Preparing to send APPROVED emails');
                $this->sendApprovedEmailsSync($restructure, $remarks);
            } elseif ($status === 'pending') {
                Log::info('Preparing to send DENIED emails');
                $this->sendDeniedEmailsSync($restructure, $remarks);
            }

            Log::info('All status emails dispatched successfully');

        } catch (\Exception $e) {
            Log::error('Error in sendStatusUpdateEmailsSync:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Send raised emails synchronously to Regional Directors
     */
    private function sendRaisedEmailsSync(RestructureModel $restructure, $remarks)
    {
        try {
            Log::info('=== SENDING RAISED EMAILS ===');
            
            $directors = DirectorModel::where('office_id', 1)
                ->whereNotNull('email')
                ->get();

            Log::info('Directors query completed', [
                'count' => $directors->count(),
                'directors' => $directors->pluck('email')->toArray()
            ]);

            if ($directors->isEmpty()) {
                Log::warning('No directors found with office_id=1 and non-null email');
                return;
            }

            $successCount = 0;
            $failCount = 0;

            foreach ($directors as $director) {
                try {
                    $recipientName = $director->honorific . ' ' . $director->last_name;
                    
                    Log::info('Attempting to send raised email', [
                        'to' => $director->email,
                        'recipient_name' => $recipientName
                    ]);

                    Mail::to($director->email)->send(new RestructureRaisedMail($restructure, $recipientName, $remarks));

                    $successCount++;
                    Log::info('✓ Raised email sent successfully', [
                        'to' => $director->email
                    ]);
                    
                } catch (\Exception $e) {
                    $failCount++;
                    Log::error('✗ Failed to send raised email', [
                        'to' => $director->email,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            }

            Log::info('Raised emails summary', [
                'total_directors' => $directors->count(),
                'successful' => $successCount,
                'failed' => $failCount
            ]);

        } catch (\Exception $e) {
            Log::error('Error in sendRaisedEmailsSync:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Send approved emails synchronously
     */
    private function sendApprovedEmailsSync(RestructureModel $restructure, $remarks)
    {
        try {
            Log::info('=== SENDING APPROVED EMAILS ===');
            
            $projectOfficeId = $restructure->project->company->office_id;
            $companyEmail = $restructure->project->company->email;

            Log::info('Fetching recipients', [
                'project_office_id' => $projectOfficeId,
                'company_email' => $companyEmail
            ]);

            $rpmoUsers = UserModel::where('role', 'rpmo')
                ->whereNotNull('email')
                ->get();

            $staffUsers = UserModel::where('role', 'staff')
                ->where('office_id', $projectOfficeId)
                ->whereNotNull('email')
                ->get();

            Log::info('Recipients found', [
                'rpmo_users' => $rpmoUsers->count(),
                'staff_users' => $staffUsers->count(),
                'rpmo_emails' => $rpmoUsers->pluck('email')->toArray(),
                'staff_emails' => $staffUsers->pluck('email')->toArray()
            ]);

            $successCount = 0;
            $failCount = 0;

            // Send to all RPMO users
            foreach ($rpmoUsers as $user) {
                try {
                    Log::info('Sending approved email to RPMO user', ['to' => $user->email]);
                    
                    Mail::to($user->email)->send(new RestructureApprovedMail(
                        $restructure, 
                        $restructure->project->company->company_name, 
                        Auth::user()->name, 
                        $remarks
                    ));

                    $successCount++;
                    Log::info('✓ Approved email sent to RPMO user', ['to' => $user->email]);
                    
                } catch (\Exception $e) {
                    $failCount++;
                    Log::error('✗ Failed to send approved email to RPMO user', [
                        'to' => $user->email,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Send to all staff users
            foreach ($staffUsers as $user) {
                try {
                    Log::info('Sending approved email to staff user', ['to' => $user->email]);
                    
                    Mail::to($user->email)->send(new RestructureApprovedMail(
                        $restructure, 
                        $user->name, 
                        Auth::user()->name, 
                        $remarks
                    ));

                    $successCount++;
                    Log::info('✓ Approved email sent to staff user', ['to' => $user->email]);
                    
                } catch (\Exception $e) {
                    $failCount++;
                    Log::error('✗ Failed to send approved email to staff user', [
                        'to' => $user->email,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Send to company email
            if ($companyEmail) {
                try {
                    Log::info('Sending approved email to company', ['to' => $companyEmail]);
                    
                    Mail::to($companyEmail)->send(new RestructureApprovedMail(
                        $restructure, 
                        $restructure->project->company->company_name, 
                        Auth::user()->name, 
                        $remarks
                    ));

                    $successCount++;
                    Log::info('✓ Approved email sent to company', ['to' => $companyEmail]);
                    
                } catch (\Exception $e) {
                    $failCount++;
                    Log::error('✗ Failed to send approved email to company', [
                        'to' => $companyEmail,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            Log::info('Approved emails summary', [
                'total_recipients' => $rpmoUsers->count() + $staffUsers->count() + ($companyEmail ? 1 : 0),
                'successful' => $successCount,
                'failed' => $failCount
            ]);

        } catch (\Exception $e) {
            Log::error('Error in sendApprovedEmailsSync:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Send denied emails synchronously
     */
    private function sendDeniedEmailsSync(RestructureModel $restructure, $remarks)
    {
        try {
            Log::info('=== SENDING DENIED EMAILS ===');
            
            $projectOfficeId = $restructure->project->company->office_id;

            $rpmoUsers = UserModel::where('role', 'rpmo')
                ->whereNotNull('email')
                ->get();

            $staffUsers = UserModel::where('role', 'staff')
                ->where('office_id', $projectOfficeId)
                ->whereNotNull('email')
                ->get();

            Log::info('Recipients found', [
                'rpmo_users' => $rpmoUsers->count(),
                'staff_users' => $staffUsers->count(),
                'rpmo_emails' => $rpmoUsers->pluck('email')->toArray(),
                'staff_emails' => $staffUsers->pluck('email')->toArray()
            ]);

            $successCount = 0;
            $failCount = 0;

            foreach ($rpmoUsers as $user) {
                try {
                    Log::info('Sending denied email to RPMO user', ['to' => $user->email]);
                    
                    Mail::to($user->email)->send(new RestructureDeniedMail(
                        $restructure, 
                        $user->name, 
                        Auth::user()->name, 
                        $remarks
                    ));

                    $successCount++;
                    Log::info('✓ Denied email sent to RPMO user', ['to' => $user->email]);
                    
                } catch (\Exception $e) {
                    $failCount++;
                    Log::error('✗ Failed to send denied email to RPMO user', [
                        'to' => $user->email,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            foreach ($staffUsers as $user) {
                try {
                    Log::info('Sending denied email to staff user', ['to' => $user->email]);
                    
                    Mail::to($user->email)->send(new RestructureDeniedMail(
                        $restructure, 
                        $user->name, 
                        Auth::user()->name, 
                        $remarks
                    ));

                    $successCount++;
                    Log::info('✓ Denied email sent to staff user', ['to' => $user->email]);
                    
                } catch (\Exception $e) {
                    $failCount++;
                    Log::error('✗ Failed to send denied email to staff user', [
                        'to' => $user->email,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            Log::info('Denied emails summary', [
                'total_recipients' => $rpmoUsers->count() + $staffUsers->count(),
                'successful' => $successCount,
                'failed' => $failCount
            ]);

        } catch (\Exception $e) {
            Log::error('Error in sendDeniedEmailsSync:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Create refund entries for restructured months
     */
    private function createRestructuredRefundEntries(RestructureModel $restructure)
    {
        try {
            $startDate = Carbon::parse($restructure->restruct_start);
            $endDate = Carbon::parse($restructure->restruct_end);
            
            Log::info('Creating restructured refund entries:', [
                'project_id' => $restructure->project_id,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d')
            ]);
            
            $currentDate = $startDate->copy();
            $entriesCreated = 0;
            
            while ($currentDate->lte($endDate)) {
                $monthPaid = $currentDate->format('Y-m-01');
                
                $existingRefund = RefundModel::where('project_id', $restructure->project_id)
                    ->where('month_paid', $monthPaid)
                    ->first();
                
                if ($existingRefund) {
                    $existingRefund->update([
                        'status' => RefundModel::STATUS_RESTRUCTURED,
                        'refund_amount' => 0,
                        'amount_due' => 0,
                    ]);
                    
                    Log::info('Updated existing refund entry:', [
                        'refund_id' => $existingRefund->refund_id,
                        'month_paid' => $monthPaid
                    ]);
                } else {
                    RefundModel::create([
                        'project_id' => $restructure->project_id,
                        'month_paid' => $monthPaid,
                        'status' => RefundModel::STATUS_RESTRUCTURED,
                        'refund_amount' => 0,
                        'amount_due' => 0,
                        'check_num' => null,
                        'receipt_num' => null,
                    ]);
                    
                    Log::info('Created new refund entry:', [
                        'project_id' => $restructure->project_id,
                        'month_paid' => $monthPaid
                    ]);
                }
                
                $entriesCreated++;
                $currentDate->addMonth();
            }
            
            Log::info('Restructured refund entries completed:', [
                'entries_created_or_updated' => $entriesCreated
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error creating restructured refund entries:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    public function updateRefundEnd(Request $request, $project_id)
    {
        $request->validate([
            'refund_end' => 'required|date',
        ]);

        $project = ProjectModel::findOrFail($project_id);
        $refundEnd = $request->refund_end . '-01';
        
        $project->update([
            'refund_end' => $refundEnd,
        ]);

        return redirect()->back()->with('success', 'Refund end date updated successfully.');
    }
}