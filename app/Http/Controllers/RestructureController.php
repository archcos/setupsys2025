<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\RestructureModel;
use App\Models\RestructureUpdateModel;
use App\Models\ApplyRestructModel;
use App\Models\ProjectModel;
use App\Models\RefundModel;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class RestructureController extends Controller
{
    public function verifyList()
    {
        $user = Auth::user();
        
        if ($user->role === 'rd') {
            // For RD: Get unique project IDs that have raised or approved restructures
            $projectIds = RestructureModel::whereIn('status', ['raised', 'approved'])
                ->distinct()
                ->pluck('project_id')
                ->toArray();
            
            // Get applications for those projects only
            $applyRestructs = ApplyRestructModel::with(['project', 'addedBy'])
                ->whereIn('project_id', $projectIds)
                ->latest()
                ->get();
        } else {
            // For RPMO and others: Show all applications
            $applyRestructs = ApplyRestructModel::with(['project', 'addedBy'])
                ->latest()
                ->get();
        }

        return Inertia::render('Restructures/RestructureList', [
            'applyRestructs' => $applyRestructs,
            'auth' => [
                'user' => $user,
            ],
        ]);
    }

    // Show verification page for specific application
    public function verifyShow($apply_id)
    {
        $user = Auth::user();
        
        $applyRestruct = ApplyRestructModel::with(['project', 'addedBy'])
            ->findOrFail($apply_id);

        $project = ProjectModel::findOrFail($applyRestruct->project_id);

        // Base query for restructures - load with updates relationship
        $restructuresQuery = RestructureModel::where('project_id', $project->project_id)
            ->with(['addedBy', 'updates' => function($query) {
                $query->orderBy('update_start');
            }]);
        
        // If user is RD, only show restructures with status = 'raised' or 'approved'
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

    // Helper function to check date overlap
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

            // Check for any overlap
            if ($newStartTime <= $existingEnd && $newEndTime >= $existingStart) {
                return [
                    'overlap' => true,
                    'existing' => $existing
                ];
            }
        }

        return ['overlap' => false];
    }

    // Store new restructure entry
    public function store(Request $request)
    {
        Log::info('Restructure Store Request:', $request->all());

        try {
            // Validate the request
            $validated = $request->validate([
                'project_id' => 'required|exists:tbl_projects,project_id',
                'type' => 'required|string|max:50',
                'restruct_start' => 'required|string',
                'restruct_end' => 'required|string',
                'status' => 'required|in:approved,raised,pending',
                'remarks' => 'required|string',
                'updates' => 'nullable|array',
                'updates.*.update_start' => 'required_with:updates|string',
                'updates.*.update_end' => 'required_with:updates|string',
                'updates.*.update_amount' => 'required_with:updates|numeric|min:0',
            ]);

            Log::info('Validation passed:', $validated);

            // Get project to check refund period
            $project = ProjectModel::findOrFail($request->project_id);

            // Format dates: add '-01' to make YYYY-MM into YYYY-MM-01
            $restructStart = $request->restruct_start . '-01';
            $restructEnd = $request->restruct_end . '-01';

            // Validate date order
            if (strtotime($restructEnd) <= strtotime($restructStart)) {
                return redirect()->back()->withErrors([
                    'restruct_end' => 'End date must be after start date'
                ])->withInput();
            }

            // Validate dates are within refund period
            $refundInitial = strtotime($project->refund_initial);
            $refundEnd = strtotime($project->refund_end);
            $startTime = strtotime($restructStart);
            $endTime = strtotime($restructEnd);

            if ($startTime < $refundInitial || $startTime > $refundEnd) {
                return redirect()->back()->withErrors([
                    'restruct_start' => 'Start date must be within the project refund period (' . 
                        date('M Y', $refundInitial) . ' to ' . date('M Y', $refundEnd) . ')'
                ])->withInput();
            }

            if ($endTime < $refundInitial || $endTime > $refundEnd) {
                return redirect()->back()->withErrors([
                    'restruct_end' => 'End date must be within the project refund period (' . 
                        date('M Y', $refundInitial) . ' to ' . date('M Y', $refundEnd) . ')'
                ])->withInput();
            }

            // Check for date overlap with existing restructures
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

            // Validate update amounts if provided
            if ($request->has('updates') && is_array($request->updates)) {
                $restructEndTime = strtotime($restructEnd);
                
                foreach ($request->updates as $update) {
                    $updateStart = $update['update_start'] . '-01';
                    $updateEnd = $update['update_end'] . '-01';
                    $updateStartTime = strtotime($updateStart);
                    $updateEndTime = strtotime($updateEnd);

                    // Validate update end is after update start
                    if ($updateEndTime <= $updateStartTime) {
                        return redirect()->back()->withErrors([
                            'updates' => 'Update end date must be after start date'
                        ])->withInput();
                    }

                    // Validate update start is AFTER restructuring end date
                    if ($updateStartTime <= $restructEndTime) {
                        return redirect()->back()->withErrors([
                            'updates' => 'Update start date must be after the restructuring end date (' . 
                                date('M Y', $restructEndTime) . ')'
                        ])->withInput();
                    }

                    // Validate update dates don't exceed project refund end
                    if ($updateEndTime > $refundEnd) {
                        return redirect()->back()->withErrors([
                            'updates' => 'Update end date cannot exceed the project refund end date (' . 
                                date('M Y', $refundEnd) . ')'
                        ])->withInput();
                    }
                }
            }

            Log::info('Formatted dates:', [
                'start' => $restructStart,
                'end' => $restructEnd
            ]);

            // Create the restructure record
            $restructure = RestructureModel::create([
                'project_id' => $request->project_id,
                'added_by' => Auth::id(),
                'type' => $request->type,
                'status' => $request->status,
                'remarks' => $request->remarks,
                'restruct_start' => $restructStart,
                'restruct_end' => $restructEnd,
            ]);

            // Create update entries if provided
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

            return redirect()->back()->with('success', 'Restructuring added successfully.');

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

    // Update restructure entry
    public function update(Request $request, $restruct_id)
    {
        Log::info('Restructure Update Request:', [
            'restruct_id' => $restruct_id,
            'data' => $request->all()
        ]);

        try {
            $validated = $request->validate([
                'type' => 'required|string|max:50',
                'restruct_start' => 'required|string',
                'restruct_end' => 'required|string',
                'status' => 'required|in:approved,raised,pending',
                'remarks' => 'required|string',
                'updates' => 'nullable|array',
                'updates.*.update_start' => 'required_with:updates|string',
                'updates.*.update_end' => 'required_with:updates|string',
                'updates.*.update_amount' => 'required_with:updates|numeric|min:0',
            ]);

            $restructure = RestructureModel::findOrFail($restruct_id);
            
            // Get project to check refund period
            $project = ProjectModel::findOrFail($restructure->project_id);

            // Format dates
            $restructStart = $request->restruct_start . '-01';
            $restructEnd = $request->restruct_end . '-01';

            // Validate date order
            if (strtotime($restructEnd) <= strtotime($restructStart)) {
                return redirect()->back()->withErrors([
                    'restruct_end' => 'End date must be after start date'
                ])->withInput();
            }

            // Validate dates are within refund period
            $refundInitial = strtotime($project->refund_initial);
            $refundEnd = strtotime($project->refund_end);
            $startTime = strtotime($restructStart);
            $endTime = strtotime($restructEnd);

            if ($startTime < $refundInitial || $startTime > $refundEnd) {
                return redirect()->back()->withErrors([
                    'restruct_start' => 'Start date must be within the project refund period (' . 
                        date('M Y', $refundInitial) . ' to ' . date('M Y', $refundEnd) . ')'
                ])->withInput();
            }

            if ($endTime < $refundInitial || $endTime > $refundEnd) {
                return redirect()->back()->withErrors([
                    'restruct_end' => 'End date must be within the project refund period (' . 
                        date('M Y', $refundInitial) . ' to ' . date('M Y', $refundEnd) . ')'
                ])->withInput();
            }

            // Check for date overlap (excluding current record)
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

            // Validate update amounts if provided
            if ($request->has('updates') && is_array($request->updates)) {
                $restructEndTime = strtotime($restructEnd);
                
                foreach ($request->updates as $update) {
                    $updateStart = $update['update_start'] . '-01';
                    $updateEnd = $update['update_end'] . '-01';
                    $updateStartTime = strtotime($updateStart);
                    $updateEndTime = strtotime($updateEnd);

                    // Validate update end is after update start
                    if ($updateEndTime <= $updateStartTime) {
                        return redirect()->back()->withErrors([
                            'updates' => 'Update end date must be after start date'
                        ])->withInput();
                    }

                    // Validate update start is AFTER restructuring end date
                    if ($updateStartTime <= $restructEndTime) {
                        return redirect()->back()->withErrors([
                            'updates' => 'Update start date must be after the restructuring end date (' . 
                                date('M Y', $restructEndTime) . ')'
                        ])->withInput();
                    }

                    // Validate update dates don't exceed project refund end
                    if ($updateEndTime > $refundEnd) {
                        return redirect()->back()->withErrors([
                            'updates' => 'Update end date cannot exceed the project refund end date (' . 
                                date('M Y', $refundEnd) . ')'
                        ])->withInput();
                    }
                }
            }

            $restructure->update([
                'type' => $request->type,
                'restruct_start' => $restructStart,
                'restruct_end' => $restructEnd,
                'status' => $request->status,
                'remarks' => $request->remarks,
            ]);

            // Delete existing updates and create new ones
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

            return redirect()->back()->with('success', 'Restructuring updated successfully.');

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

    // Delete restructure entry
    public function destroy($restruct_id)
    {
        try {
            $restructure = RestructureModel::findOrFail($restruct_id);
            
            // Delete associated updates first
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

    // Update status (Raise or Deny for RPMO, Approve or Deny for RD)
    public function updateStatus(Request $request, $restruct_id)
    {
        try {
            Log::info('Status Update Request:', [
                'restruct_id' => $restruct_id,
                'request_data' => $request->all(),
                'user_role' => Auth::user()->role ?? 'unknown'
            ]);

            $validated = $request->validate([
                'status' => 'required|in:raised,pending,approved',
                'remarks' => 'required|string',
            ]);

            $restructure = RestructureModel::findOrFail($restruct_id);
            $userRole = Auth::user()->role;

            // Role-based status validation
            if ($userRole === 'rpmo') {
                // RPMO can only raise or deny (pending)
                if (!in_array($validated['status'], ['raised', 'pending'])) {
                    return redirect()->back()->withErrors([
                        'error' => 'RPMO can only raise or deny restructuring requests.'
                    ]);
                }
            } elseif ($userRole === 'rd') {
                // RD can only approve or deny (pending) items that are already raised
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
            
            // Update the restructure status
            $restructure->update([
                'status' => $validated['status'],
                'remarks' => $validated['remarks'],
            ]);
            
            // If RD approved the restructure, create refund entries for each month
            if ($userRole === 'rd' && $validated['status'] === 'approved') {
                $this->createRestructuredRefundEntries($restructure);
            }
            
            Log::info('Status updated successfully:', [
                'restruct_id' => $restructure->restruct_id,
                'status' => $validated['status'],
                'updated_by' => Auth::user()->name
            ]);

            $statusMessage = $validated['status'] === 'approved' ? 'approved' : 
                            ($validated['status'] === 'raised' ? 'raised' : 'denied');

            return redirect()->back()
                ->with('success', "Restructuring request has been {$statusMessage} successfully.");
                    
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation Error:', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            
            return redirect()->back()->withErrors($e->errors())->withInput();
            
        } catch (\Exception $e) {
            Log::error('Status Update Error:', [
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
     * Create refund entries for restructured months
     * 
     * @param RestructureModel $restructure
     * @return void
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
            
            // Generate entries for each month in the range
            $currentDate = $startDate->copy();
            $entriesCreated = 0;
            
            while ($currentDate->lte($endDate)) {
                $monthPaid = $currentDate->format('Y-m-01');
                
                // Check if entry already exists for this month and project
                $existingRefund = RefundModel::where('project_id', $restructure->project_id)
                    ->where('month_paid', $monthPaid)
                    ->first();
                
                if ($existingRefund) {
                    // Update existing entry to restructured status
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
                    // Create new refund entry
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
                
                // Move to next month
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
            
            // Don't throw the exception - log it but allow the status update to succeed
        }
    }

    public function updateRefundEnd(Request $request, $project_id)
    {
        $request->validate([
            'refund_end' => 'required|date',
        ]);

        $project = ProjectModel::findOrFail($project_id);
        
        // Add '-01' to make it a full date
        $refundEnd = $request->refund_end . '-01';
        
        $project->update([
            'refund_end' => $refundEnd,
        ]);

        return redirect()->back()->with('success', 'Refund end date updated successfully.');
    }
}