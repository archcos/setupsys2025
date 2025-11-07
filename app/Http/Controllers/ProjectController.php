<?php

namespace App\Http\Controllers;

use App\Mail\NotificationCreatedMail;
use App\Models\ObjectiveModel;
use App\Models\ProjectModel;
use App\Models\CompanyModel;
use App\Models\ImplementationModel;
use App\Models\ItemModel;
use App\Models\MarketModel;
use App\Models\MessageModel;
use App\Models\MoaModel;
use App\Models\RtecModel;
use App\Models\UserModel;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class ProjectController extends Controller
{
public function index(Request $request)
{
    $user = Auth::user();
    if (!$user) {
        return redirect()->route('login');
    }

    $search = $request->input('search');
    $perPage = $request->input('perPage', 10);
    $sortField = $request->input('sortField', 'project_title');
    $sortDirection = $request->input('sortDirection', 'asc');
    $officeFilter = $request->input('officeFilter');
    $progressFilter = $request->input('progressFilter');

    // Validate sort field to prevent SQL injection
    $allowedSortFields = ['project_title', 'project_cost', 'progress'];
    if (!in_array($sortField, $allowedSortFields)) {
        $sortField = 'project_title';
    }

    // Validate sort direction
    $sortDirection = in_array($sortDirection, ['asc', 'desc']) ? $sortDirection : 'asc';

    $query = ProjectModel::with([
        'company.office',
        'items' => function ($q) {
            $q->where('report', 'approved');
        },
        'messages' => function ($q) {
            $q->orderBy('created_at', 'desc');
        }
    ]);

    // Filter by user role
    if ($user->role === 'user') {
        $query->where('added_by', $user->user_id);
    } elseif ($user->role === 'staff') {
        $query->whereHas('company', function ($q) use ($user) {
            $q->where('office_id', $user->office_id);
        });
    }

    // Apply office filter
    if ($officeFilter) {
        $query->whereHas('company', function ($q) use ($officeFilter) {
            $q->where('office_id', $officeFilter);
        });
    }

    // Apply progress filter
    if ($progressFilter) {
        $query->where('progress', $progressFilter);
    }

    // Apply search
    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->where('project_title', 'like', "%{$search}%")
              ->orWhere('project_cost', 'like', "%{$search}%")
              ->orWhere('release_initial', 'like', "%{$search}%")
              ->orWhere('release_end', 'like', "%{$search}%")
              ->orWhere('refund_initial', 'like', "%{$search}%")
              ->orWhere('refund_end', 'like', "%{$search}%")
              ->orWhereHas('company', function ($q) use ($search) {
                  $q->where('company_name', 'like', "%{$search}%");
              })
              ->orWhereHas('items', function ($q) use ($search) {
                  $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('specifications', 'like', "%{$search}%");
              });
        });
    }

    // Only include projects that have approved items
    $query->whereHas('items', function ($q) {
        $q->where('report', 'approved');
    });

    // Apply sorting
    $query->orderBy($sortField, $sortDirection);

    $projects = $query->paginate($perPage)->withQueryString();

    // Get all offices for the filter dropdown
    $offices = \App\Models\OfficeModel::orderBy('office_name')->get();

    return Inertia::render('Projects/Index', [
        'projects' => $projects,
        'offices' => $offices,
        'filters' => $request->only('search', 'perPage', 'sortField', 'sortDirection', 'officeFilter', 'progressFilter'),
    ]);
}

    public function create()
    {
        $user = Auth::user();


        $companies = CompanyModel::query();

        if ($user->role === 'staff') {
            $companies->where('office_id', $user->office_id);
        } elseif ($user->role === 'user') {
            $companies->where('added_by', $user->user_id);
        }

        return Inertia::render('Projects/Create', [
            'companies' => $companies->orderBy('company_name')->get()
        ]);
    }

public function store(Request $request)
    {
    $user = Auth::user();


    if ($request->has('release_initial')) {
        $releaseInitial = $request->input('release_initial');
        $request->merge(['release_initial' => $releaseInitial . '-01']);
    }

    if ($request->has('release_end')) {
        $releaseEnd = $request->input('release_end');
        $request->merge(['release_end' => $releaseEnd . '-01']);
    }

    if ($request->has('refund_initial')) {
        $refundInitial = $request->input('refund_initial');
        $request->merge(['refund_initial' => $refundInitial . '-01']);
    }

    if ($request->has('refund_end')) {
        $refundEnd = $request->input('refund_end');
        $request->merge(['refund_end' => $refundEnd . '-01']);
    }


$validated = $request->validate([
    'project_id'        => 'required|string|max:255',
    'project_title'     => 'required|string|max:255',
    'company_id'        => 'required|exists:tbl_companies,company_id',
    'project_cost'      => 'required|numeric',
    'refund_amount'     => 'nullable|numeric',
    'last_refund'       => 'nullable|numeric',

    'progress'          => 'required|string',
    'year_obligated'    => 'nullable|string',
    'revenue'           => 'nullable|numeric',
    'net_income'        => 'nullable|numeric',
    'current_asset'     => 'nullable|numeric',
    'noncurrent_asset'  => 'nullable|numeric',
    'equity'            => 'nullable|numeric',
    'liability'         => 'nullable|numeric',

    'release_initial'   => 'nullable|date',
    'release_end'       => 'nullable|date',
    'refund_initial'    => 'nullable|date',
    'refund_end'        => 'nullable|date',
    'place_name'          => 'nullable|string',

    // Items
    'items'                     => 'array',
    'items.*.item_name'         => 'required|string|max:255',
    'items.*.specifications'    => 'required|string',
    'items.*.item_cost'         => 'required|numeric|min:0',
    'items.*.quantity'          => 'required|integer|min:1',
    'items.*.type'              => 'required|string|max:10',

    // Objectives
    'objectives'                => 'array',
    'objectives.*.details'      => 'required|string',
]);


if (ProjectModel::where('project_id', $validated['project_id'])->exists()) {
    return redirect()->back()->withErrors([
        'project_id' => 'This Project ID already exists.'
    ])->withInput();
}

$project = ProjectModel::create([
    'project_id'        => $validated['project_id'],
    'project_title'     => $validated['project_title'],
    'company_id'        => $validated['company_id'],
    'project_cost'      => $validated['project_cost'] ?? null,
    'refund_amount'     => $validated['refund_amount'] ?? null,
    'last_refund'       => $validated['last_refund'] ?? null,
    'progress'          => $validated['progress'] ?? null,
    'year_obligated'    => $validated['year_obligated'] ?? null,
    'revenue'           => $validated['revenue'] ?? null,
    'net_income'        => $validated['net_income'] ?? null,
    'current_asset'     => $validated['current_asset'] ?? null,
    'noncurrent_asset'  => $validated['noncurrent_asset'] ?? null,
    'equity'            => $validated['equity'] ?? null,
    'liability'         => $validated['liability'] ?? null,
    'release_initial'   => $validated['release_initial'] ?? null,
    'release_end'       => $validated['release_end'] ?? null,
    'refund_initial'    => $validated['refund_initial'] ?? null,
    'refund_end'        => $validated['refund_end'] ?? null,
    'added_by'          => $user->user_id,
]);


// Save items
if (!empty($validated['items'])) {
    foreach ($validated['items'] as $item) {
        ItemModel::create([
            'project_id'     => $validated['project_id'],
            'item_name'      => $item['item_name'],
            'specifications' => $item['specifications'] ?? null,
            'item_cost'      => $item['item_cost'],
            'quantity'       => $item['quantity'],
            'type'       => $item['type'],
            'report'       => 'approved',
            
        ]);
    }
}

// Save objectives
if (!empty($validated['objectives'])) {
    foreach ($validated['objectives'] as $objective) {
        ObjectiveModel::create([
            'project_id' => $validated['project_id'],
            'details'    => $objective['details'],
            'report'       => 'approved',
        ]);
    }
}

if (!empty($validated['place_name'])) {
    MarketModel::create([
        'project_id' => $validated['project_id'],
        'place_name' => $validated['place_name'],
    ]);
}

return redirect('/projects')->with('success', 'Project, items, and objectives created successfully.');
}

public function edit($id)
{
    $project = ProjectModel::with([
        'items' => function ($query) {
            $query->where('report', 'approved'); 
        },
        'objectives' => function ($query) {
            $query->where('report', 'approved'); 
        },
        'markets' => function ($query) {
            $query->where('type', 'existing');
        },
        'rtecs' => function ($query) use ($id) {
            // Only load RTEC records matching current project progress
            $currentProgress = ProjectModel::find($id)->progress ?? '';
            $query->with('user')
                  ->where('progress', $currentProgress)
                  ->orderBy('created_at', 'desc');
        }
    ])->findOrFail($id);
    
    // Format RTEC schedules to simple datetime string
    if ($project->rtecs && $project->rtecs->isNotEmpty()) {
        $project->rtecs->transform(function ($rtec) {
            if ($rtec->schedule) {
                // Convert to Carbon and format as simple datetime
                $rtec->schedule = Carbon::parse($rtec->schedule)->format('Y-m-d H:i:s');
            }
            return $rtec;
        });
    }
    
    $companies = CompanyModel::all();

    // Get IRTEC and ERTEC users
    $irtecUsers = UserModel::where('role', 'irtec')
        ->select('user_id', 'first_name', 'middle_name', 'last_name', 'role')
        ->orderBy('first_name')
        ->get();

    $ertecUsers = UserModel::where('role', 'ertec')
        ->select('user_id', 'first_name', 'middle_name', 'last_name', 'role')
        ->orderBy('first_name')
        ->get();

    return Inertia::render('Projects/Edit', [
        'project' => $project,
        'companies' => $companies,
        'irtecUsers' => $irtecUsers,
        'ertecUsers' => $ertecUsers,
    ]);
}

    public function update(Request $request, $id)
    {
        $project = ProjectModel::findOrFail($id);
        $user = Auth::user();

        Log::info("Updating project: {$project->project_id}");

        // Build validation rules dynamically
        $rules = [
            'project_title'     => 'required|string|max:255',
            'company_id'        => 'required|exists:tbl_companies,company_id',
            'project_cost'      => 'required|numeric',
            'year_obligated'    => 'required|string',
            'revenue'           => 'nullable|numeric',
            'net_income'        => 'nullable|numeric',
            'current_asset'     => 'nullable|numeric',
            'noncurrent_asset'  => 'nullable|numeric',
            'equity'            => 'nullable|numeric',
            'liability'         => 'nullable|numeric',
            'release_initial'   => 'required|regex:/^\d{4}-\d{2}$/',
            'release_end'       => 'required|regex:/^\d{4}-\d{2}$/',
            'refund_initial'    => 'required|regex:/^\d{4}-\d{2}$/',
            'refund_end'        => 'required|regex:/^\d{4}-\d{2}$/',
            'refund_amount'     => 'nullable|numeric|min:0',
            'last_refund'       => 'nullable|numeric|min:0',
            'place_name'        => 'required|string',
            'items'             => 'nullable|array',
            'items.*.item_name' => 'required_with:items|string|max:255',
            'items.*.specifications' => 'nullable|string',
            'items.*.item_cost' => 'required_with:items|numeric|min:0',
            'items.*.quantity'  => 'required_with:items|integer|min:1',
            'items.*.type'      => 'required|in:equipment,nonequip', 
            'objectives'        => 'nullable|array',
            'objectives.*.details' => 'required_with:objectives|string',
        ];

        // Add RPMO-specific validation rules
        if ($user->role === 'rpmo') {
            $rules['progress'] = 'required|string|in:internal_rtec,internal_compliance,external_rtec,external_compliance,approval,Implementation,Refund,Terminated,Withdrawn,Completed';
            
            // Add RTEC field validation only if progress requires RTEC
            $rtecStatuses = ['internal_rtec', 'internal_compliance', 'external_rtec', 'external_compliance', 'approval'];
            if (in_array($request->progress, $rtecStatuses)) {
                $rules['rtec_user_ids'] = 'nullable|array';
                $rules['rtec_user_ids.*'] = 'exists:tbl_users,user_id';
                $rules['rtec_schedule'] = 'nullable|date_format:Y-m-d\TH:i';
                $rules['rtec_zoom_link'] = 'nullable|url|max:500';
            }
        }

        $validated = $request->validate($rules);

        Log::info('Validated data:', $validated);

        // Update main project fields
        $updateData = [
            'project_title'     => $validated['project_title'],
            'company_id'        => $validated['company_id'],
            'project_cost'      => $validated['project_cost'],
            'year_obligated'    => $validated['year_obligated'],
            'revenue'           => $validated['revenue'] ?? null,
            'net_income'        => $validated['net_income'] ?? null,
            'current_asset'     => $validated['current_asset'] ?? null,
            'noncurrent_asset'  => $validated['noncurrent_asset'] ?? null,
            'equity'            => $validated['equity'] ?? null,
            'liability'         => $validated['liability'] ?? null,
            'release_initial'   => $validated['release_initial'],
            'release_end'       => $validated['release_end'],
            'refund_amount'     => $validated['refund_amount'] ?? null,
            'last_refund'       => $validated['last_refund'] ?? null,
            'refund_initial'    => $validated['refund_initial'],
            'refund_end'        => $validated['refund_end'],
        ];

        // Add progress if user is RPMO
        if ($user->role === 'rpmo' && isset($validated['progress'])) {
            $updateData['progress'] = $validated['progress'];
        }

        $project->update($updateData);

        Log::info("Project updated successfully.");

        // Replace items
        $project->items()->where('report', 'approved')->delete();
        Log::info("Deleted old items.");

        if (!empty($validated['items'])) {
            foreach ($validated['items'] as $item) {
                $project->items()->create([
                    'item_name'      => $item['item_name'],
                    'specifications' => $item['specifications'] ?? null,
                    'item_cost'      => $item['item_cost'],
                    'quantity'       => $item['quantity'],
                    'type'           => $item['type'],
                    'report'         => 'approved',
                ]);
            }
            Log::info("Items recreated.", ['items_count' => count($validated['items'])]);
        }

        // Replace objectives
        $project->objectives()->where('report', 'approved')->delete();
        Log::info("Deleted old objectives.");

        if (!empty($validated['objectives'])) {
            foreach ($validated['objectives'] as $objective) {
                $project->objectives()->create([
                    'details' => $objective['details'],
                    'report'  => 'approved',
                ]);
            }
            Log::info("Objectives recreated.", ['objectives_count' => count($validated['objectives'])]);
        }

        // Handle market update/creation
        $market = $project->markets()
            ->where('type', 'existing')
            ->where('project_id', $project->project_id)
            ->first();

        if ($market) {
            $market->place_name = $validated['place_name'];
            $market->save();
            Log::info('Market updated', ['id' => $market->id, 'place_name' => $market->place_name]);
        } else {
            $project->markets()->create([
                'type' => 'existing',
                'place_name' => $validated['place_name'],
            ]);
            Log::info('Market created', ['place_name' => $validated['place_name']]);
        }

        // Handle RTEC data if user is RPMO
        if ($user->role === 'rpmo' && isset($validated['progress'])) {
            $rtecStatuses = ['internal_rtec', 'internal_compliance', 'external_rtec', 'external_compliance', 'approval'];
            
            if (in_array($validated['progress'], $rtecStatuses)) {
                // Check if any RTEC field is filled
                $hasRtecData = !empty($validated['rtec_user_ids']) || 
                              !empty($validated['rtec_schedule']) || 
                              !empty($validated['rtec_zoom_link']);

                if ($hasRtecData && !empty($validated['rtec_user_ids'])) {
                    // Convert datetime-local format to SQL datetime
                    $scheduleDateTime = null;
                    if (!empty($validated['rtec_schedule'])) {
                        $scheduleDateTime = str_replace('T', ' ', $validated['rtec_schedule']) . ':00';
                    }

                    // Get old RTEC records before deletion for comparison
                    $oldRtecRecords = RtecModel::where('project_id', $project->project_id)
                        ->where('progress', $validated['progress'])
                        ->with('user')
                        ->get();

                    // Delete old records for this specific progress stage
                    RtecModel::where('project_id', $project->project_id)
                        ->where('progress', $validated['progress'])
                        ->delete();

                    Log::info('Deleted old RTEC records for current progress', [
                        'project_id' => $project->project_id,
                        'progress' => $validated['progress']
                    ]);

                    // Track if there are any changes (users, schedule, or zoom link)
                    $oldUserIds = $oldRtecRecords->pluck('user_id')->toArray();
                    $newUserIds = $validated['rtec_user_ids'];
                    
                    // Check for user changes
                    $userChanges = count($oldUserIds) !== count($newUserIds) || 
                                  count(array_diff($oldUserIds, $newUserIds)) > 0 ||
                                  count(array_diff($newUserIds, $oldUserIds)) > 0;
                    
                    // Check for schedule/zoom link changes
                    $oldSchedule = $oldRtecRecords->first()->schedule ?? null;
                    $oldZoomLink = $oldRtecRecords->first()->zoom_link ?? null;
                    $scheduleChanged = $oldSchedule != $scheduleDateTime;
                    $zoomLinkChanged = $oldZoomLink != ($validated['rtec_zoom_link'] ?? null);
                    
                    $hasChanges = $userChanges || $scheduleChanged || $zoomLinkChanged;

                    // Create new RTEC records
                    $newRtecRecords = [];
                    foreach ($validated['rtec_user_ids'] as $userId) {
                        $rtec = RtecModel::create([
                            'project_id' => $project->project_id,
                            'user_id' => $userId,
                            'progress' => $validated['progress'],
                            'schedule' => $scheduleDateTime,
                            'zoom_link' => $validated['rtec_zoom_link'] ?? null,
                        ]);
                        $newRtecRecords[] = $rtec;

                        Log::info('RTEC record created', [
                            'project_id' => $project->project_id,
                            'user_id' => $userId,
                            'progress' => $validated['progress'],
                            'schedule' => $scheduleDateTime,
                        ]);
                    }

                    // Send email notifications if there are changes and stage is internal/external RTEC
                    if ($hasChanges && in_array($validated['progress'], ['internal_rtec', 'external_rtec'])) {
                        Log::info('Sending RTEC notifications', [
                            'project_id' => $project->project_id,
                            'progress' => $validated['progress'],
                            'user_changes' => $userChanges ?? false,
                            'schedule_changed' => $scheduleChanged ?? false,
                            'zoom_link_changed' => $zoomLinkChanged ?? false,
                        ]);
                        $this->sendRtecNotifications($newRtecRecords, $project, $user);
                    } else {
                        Log::info('RTEC notification skipped', [
                            'project_id' => $project->project_id,
                            'progress' => $validated['progress'],
                            'has_changes' => $hasChanges,
                            'is_rtec_stage' => in_array($validated['progress'], ['internal_rtec', 'external_rtec']),
                        ]);
                    }
                }
            }
        }

        return redirect('/projects')->with('success', 'Project updated successfully.');
    }

    /**
     * Send email notifications to all relevant stakeholders
     */
    private function sendRtecNotifications($rtecRecords, $project, $assignedBy)
    {
        try {
            // Load project with company relationship
            $project->load('company.office');
            
            // Collect all recipient emails
            $recipients = $this->collectRtecRecipients($rtecRecords, $project);

            // Format progress for display
            $progressLabels = [
                'internal_rtec' => 'Internal RTEC',
                'internal_compliance' => 'Internal Compliance',
                'external_rtec' => 'External RTEC',
                'external_compliance' => 'External Compliance',
                'approval' => 'Approval Stage',
            ];
            $progressLabel = $progressLabels[$rtecRecords[0]->progress] ?? $rtecRecords[0]->progress;

            // Get schedule and zoom link from first RTEC record
            $schedule = $rtecRecords[0]->schedule;
            $scheduleText = $schedule 
                ? Carbon::parse($schedule)->format('F j, Y \a\t g:i A')
                : 'Not scheduled';
            
            $zoomLink = $rtecRecords[0]->zoom_link;

            // Get RTEC member names
            $rtecMemberNames = collect($rtecRecords)->map(function($rtec) {
                $user = UserModel::find($rtec->user_id);
                return $user ? $user->name : 'Unknown';
            })->join(', ');

            // Build notification data
            $notification = [
                'title' => "RTEC Meeting: {$project->project_title}",
                'message' => "
                    <div style='font-family: Arial, sans-serif;'>
                        <p><strong>RTEC Assignment Notification</strong></p>
                        <p>The following project has been updated with RTEC information:</p>
                        
                        <div style='background-color: #f8f9fa; padding: 15px; border-left: 4px solid #0056b3; margin: 20px 0;'>
                            <p style='margin: 5px 0;'><strong>Project:</strong> {$project->project_title}</p>
                            <p style='margin: 5px 0;'><strong>Project ID:</strong> {$project->project_id}</p>
                            <p style='margin: 5px 0;'><strong>Company:</strong> {$project->company->company_name}</p>
                            <p style='margin: 5px 0;'><strong>Office:</strong> " . ($project->company->office->office_name ?? 'N/A') . "</p>
                            <p style='margin: 5px 0;'><strong>Stage:</strong> {$progressLabel}</p>
                            <p style='margin: 5px 0;'><strong>Schedule:</strong> {$scheduleText}</p>
                            " . ($zoomLink ? "<p style='margin: 5px 0;'><strong>Zoom Link:</strong> <a href='{$zoomLink}' style='color: #0056b3;'>{$zoomLink}</a></p>" : "") . "
                        </div>
                        
                        <p><strong>RTEC Members Assigned:</strong></p>
                        <p style='margin-left: 20px;'>{$rtecMemberNames}</p>
                        
                        <p style='margin-top: 20px;'>Updated by: <strong>{$assignedBy->name}</strong></p>
                        <p>Please review the project details and prepare accordingly.</p>
                    </div>
                "
            ];

            // Send emails to all unique recipients
            $successCount = 0;
            $failCount = 0;

            foreach ($recipients as $recipient) {
                try {
                    Mail::to($recipient['email'])->send(new NotificationCreatedMail($notification));
                    $successCount++;
                    
                    Log::info('RTEC notification email sent', [
                        'recipient_email' => $recipient['email'],
                        'recipient_name' => $recipient['name'],
                        'recipient_role' => $recipient['role'],
                        'project_id' => $project->project_id,
                    ]);
                } catch (\Exception $e) {
                    $failCount++;
                    Log::error('Failed to send RTEC notification to recipient', [
                        'recipient_email' => $recipient['email'],
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            Log::info('RTEC notification batch complete', [
                'project_id' => $project->project_id,
                'total_recipients' => $recipients->count(),
                'success' => $successCount,
                'failed' => $failCount,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send RTEC notifications', [
                'project_id' => $project->project_id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Collect all recipients for RTEC notifications
     */
    private function collectRtecRecipients($rtecRecords, $project)
    {
        $recipients = [];

        // 1. All selected RTEC members
        foreach ($rtecRecords as $rtec) {
            $rtecUser = UserModel::find($rtec->user_id);
            if ($rtecUser && $rtecUser->email) {
                $recipients[] = [
                    'email' => $rtecUser->email,
                    'name' => $rtecUser->name,
                    'role' => $rtecUser->role,
                ];
            }
        }

        // 2. Company email
        if ($project->company && $project->company->email) {
            $recipients[] = [
                'email' => $project->company->email,
                'name' => $project->company->company_name,
                'role' => 'company',
            ];
        }

        // 3. All RPMO users
        $rpmoUsers = UserModel::where('role', 'rpmo')
            ->whereNotNull('email')
            ->get();
        
        foreach ($rpmoUsers as $rpmoUser) {
            $recipients[] = [
                'email' => $rpmoUser->email,
                'name' => $rpmoUser->name,
                'role' => 'rpmo',
            ];
        }

        // 4. Staff users from the same office as the project
        if ($project->company && $project->company->office_id) {
            $officeStaff = UserModel::where('role', 'staff')
                ->where('office_id', $project->company->office_id)
                ->whereNotNull('email')
                ->get();
            
            foreach ($officeStaff as $staff) {
                $recipients[] = [
                    'email' => $staff->email,
                    'name' => $staff->name,
                    'role' => 'staff',
                ];
            }
        }

        // Remove duplicate emails
        return collect($recipients)->unique('email')->values();
    }



public function syncProjectsFromCSV()
{
    $csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTsjw8nNLTrJYI2fp0ZrKbXQvqHpiGLqpgYk82unky4g_WNf8xCcISaigp8VsllxE2dCwl-aY3wjd1W/pub?gid=84108771&single=true&output=csv';

    try {
        $response = Http::timeout(300)->get($csvUrl);
        if (!$response->ok()) {
            Log::error('Failed to fetch CSV: ' . $response->status());
            return back()->with('error', 'Failed to fetch CSV data.');
        }

        $lines = explode("\n", trim($response->body()));
        if (count($lines) < 2) {
            Log::warning('CSV contains no data rows.');
            return back()->with('error', 'CSV contains no data.');
        }

        $rawHeader = str_getcsv(array_shift($lines));
        $header = [];
        foreach ($rawHeader as $key => $col) {
            if (trim($col) !== '') {
                $header[$key] = trim($col);
            }
        }

        $csvData = array_map('str_getcsv', $lines);
        $newRecords = 0;

        foreach ($csvData as $rowIndex => $row) {
            $row = array_map('trim', $row);
            $row = array_slice($row, 0, count($header));
            $row = array_pad($row, count($header), '');

            if (count(array_filter($row)) === 0) {
                continue;
            }

            $data = array_combine(array_values($header), $row);
            if (!$data) {
                Log::warning("Malformed row $rowIndex", ['row' => $row]);
                continue;
            }

            // Skip invalid years
            $yearObligated = $data['Year Obligated'] ?? null;
            if (!in_array($yearObligated, ['2023', '2024', '2025'])) {
                continue;
            }

            // Match company_id from Name of the Business
            $companyName = trim($data['Name of the Business'] ?? '');
            if (!$companyName) {
                Log::warning("Skipping row $rowIndex: Missing business name");
                continue;
            }

            $company = CompanyModel::where('company_name', $companyName)->first();
            if (!$company) {
                Log::warning("Skipping project: No matching company for {$companyName}");
                continue;
            }

            // Parse release dates from Original Project Duration
            [$releaseInitial, $releaseEnd] = $this->splitMonthYear($data['Original Project Duration'] ?? '');

            // Parse refund dates from Original Refund Schedule
            [$refundInitial, $refundEnd] = $this->splitMonthYear($data['Original Refund Schedule'] ?? '');

            $projectCostRaw = $data['Amount of DOST Assistance'] ?? '0';

            // Remove commas and spaces if any, trim first
            $projectCostRaw = str_replace([',', ' '], '', trim($projectCostRaw));

            // Check if numeric (decimal or integer)
            if (is_numeric($projectCostRaw)) {
                // Convert to float first, then to int to handle decimals safely
                $projectCost = (int) round(floatval($projectCostRaw));
            } else {
                $projectCost = 0;
                Log::warning("Row $rowIndex has invalid project_cost value: " . $projectCostRaw);
            }

            try {
                ProjectModel::updateOrCreate(
                    [
                        'project_id' => str_replace('-', '', $data['Project Code'] ?? '')
                    ],
                    [
                        'project_title'   => $data['Name of Project'] ?? null,
                        'company_id'      => $company->company_id,
                        'release_initial' => $releaseInitial,
                        'release_end'     => $releaseEnd,
                        'refund_initial'  => $refundInitial,
                        'refund_end'      => $refundEnd,
                        'year_obligated'  => $yearObligated,
                        'added_by'        => session('user_id') ?? 1,
                        'project_cost'    => $projectCost ?? 0,
                        'progress'        => 'Implementation',
                        'revenue'         => $this->sanitizeNumeric($data['Revenue'] ?? null),
                        'equity'          => $this->sanitizeNumeric($data['Equity'] ?? null),
                        'liability'       => $this->sanitizeNumeric($data['Liability'] ?? null),
                        'net_income'      => $this->sanitizeNumeric($data['Net Income (Before SETUP)'] ?? null),
                        'current_asset'   => $this->sanitizeNumeric($data['Current Asset (Before SETUP)'] ?? null),
                        'noncurrent_asset'=> $this->sanitizeNumeric($data['Non-Current Asset (Before SETUP)'] ?? null),
                    ]
                );
                $newRecords++;
            } catch (\Exception $e) {
                Log::error("Row $rowIndex failed: " . $e->getMessage(), ['row' => $data]);
                continue;
            }
        }

        Log::info("Project CSV sync complete. Total new/updated: $newRecords");
        return back()->with('success', "$newRecords projects synced.");
    } catch (\Exception $e) {
        Log::error('Project CSV Sync failed: ' . $e->getMessage());
        return back()->with('error', 'Sync failed. Please try again.');
    }
}

/**
 * Split "MMM YYYY - MMM YYYY" into two Y-m-d dates ("YYYY-MM-DD")
 */
private function parseMonthYear($part)
    {
        if (!$part) return null;
        $part = strtoupper(trim($part)); // normalize (e.g. jun → JUN)

        try {
            // Try abbreviated format: JAN 2023
            return Carbon::createFromFormat('M Y', $part)->startOfMonth();
        } catch (\Exception $e) {
            try {
                // Try full month format: January 2023
                return Carbon::createFromFormat('F Y', ucwords(strtolower($part)))->startOfMonth();
            } catch (\Exception $e) {
                return null;
            }
        }
    }

    private function splitMonthYear($value)
    {
        if (!$value) return [null, null];
        $parts = explode('-', $value);
        $start = trim($parts[0] ?? '');
        $end   = trim($parts[1] ?? '');

        return [
            'start' => $this->parseMonthYear($start),
            'end'   => $this->parseMonthYear($end),
        ];
    }

private function sanitizeNumeric($value)
{
    if (is_null($value) || $value === '') {
        return null;
    }

    // Remove anything that's not a digit, decimal point, or minus sign
    $clean = preg_replace('/[^\d.-]/', '', $value);

    return is_numeric($clean) ? (float) $clean : null;
}


public function readonly()
{
    $user = Auth::user();
    if (!$user) {
        return Inertia::render('Projects/ProjectList', [
            'projects' => collect(),
        ]);
    }

    $query = ProjectModel::with([
        'company',
        'items' => function ($q) {
            $q->where('report', 'approved');
        }
    ])->whereHas('items', function ($q) {
        $q->where('report', 'approved');
    });

    if ($user->role === 'user') {
        $companyIds = CompanyModel::where('added_by', $user->user_id)->pluck('company_id');
        $query->whereIn('company_id', $companyIds);
    } elseif ($user->role === 'staff') {
        $query->whereHas('company', function ($q) use ($user) {
            $q->where('office_id', $user->office_id);
        });
    }

    $projects = $query->get();

    return Inertia::render('Projects/ProjectList', [
        'projects' => $projects,
    ]);
}

public function reviewApproval(Request $request)
{
    $user = Auth::user();
    if (!$user) {
        Log::warning('Unauthorized access attempt to reviewApproval.');
        return redirect()->route('login');
    }

    $search = $request->input('search');
    $perPage = $request->input('perPage', 10);
    $stage = $request->input('stage', 'internal_rtec');

    $progressMap = [
        'internal_rtec' => 'internal_rtec',
        'internal_compliance' => 'internal_compliance',
        'external_rtec' => 'external_rtec',
        'external_compliance' => 'external_compliance',
        'approval' => 'approval',
    ];

    $query = ProjectModel::with([
        'company',
        'items' => function ($q) {
            $q->where('report', 'approved');
        }
    ]);

    if (isset($progressMap[$stage])) {
        $query->where('progress', $progressMap[$stage]);
    }

    if ($user->role === 'user') {
        $query->where('added_by', $user->user_id);
    } elseif ($user->role === 'staff') {
        $query->whereHas('company', function ($q) use ($user) {
            $q->where('office_id', $user->office_id);
        });
    }

    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->where('project_title', 'like', "%{$search}%")
              ->orWhere('project_cost', 'like', "%{$search}%")
              ->orWhereHas('company', function ($q) use ($search) {
                  $q->where('company_name', 'like', "%{$search}%");
              });
        });
    }

    $query->whereHas('items', function ($q) {
        $q->where('report', 'approved');
    });

    $projects = $query->orderBy('project_title')->paginate($perPage)->withQueryString();

    $projects->getCollection()->transform(function ($project) {
        $allMessages = MessageModel::with('user')
            ->where('project_id', $project->project_id)
            ->orderBy('created_at', 'desc')
            ->get();

        $filteredMessages = $allMessages->filter(function ($message) use ($project) {
            return trim($message->subject) === trim($project->progress);
        })->values();

        $project->setRelation('messages', $filteredMessages);
        
        Log::info('Project messages filtered', [
            'project_id' => $project->project_id,
            'progress' => $project->progress,
            'total_messages' => $allMessages->count(),
            'filtered_messages' => $filteredMessages->count(),
        ]);

        return $project;
    });

    // Fetch users with roles other than 'staff' or 'user'
    $availableUsers = UserModel::whereNotIn('role', ['staff', 'user'])
        ->select('user_id', 'first_name', 'middle_name', 'last_name', 'role')
        ->orderBy('first_name')
        ->get();

    Log::info("{$user->username} accessed reviewApproval page", [
        'role' => $user->role,
        'stage' => $stage,
        'progress_filter' => $progressMap[$stage] ?? 'none',
    ]);

    return Inertia::render('ReviewApproval/ReviewApproval', [
        'projects' => $projects,
        'filters' => $request->only('search', 'perPage', 'stage'),
        'currentStage' => $stage,
        'availableUsers' => $availableUsers, // Pass available users to frontend
    ]);
}

public function toggleMessageStatus($id)
{
    $user = Auth::user();
    
    $message = MessageModel::findOrFail($id);

    if (!in_array($message->status, ['todo', 'done'])) {
        return back()->with('error', 'Invalid status');
    }

    $message->status = $message->status === 'done' ? 'todo' : 'done';
    $message->save();

    Log::info('Message status toggled', [
        'message_id' => $id,
        'new_status' => $message->status,
        'toggled_by' => $user->user_id
    ]);

    return back()->with('success', 'Status updated successfully');
}

public function updateProgressReview(Request $request, $id)
{
    $user = Auth::user();
    if (!$user || !in_array($user->role, ['rpmo', 'staff'])) {
        Log::warning('Unauthorized review update attempt by user ID ' . ($user->user_id ?? 'unknown'));
        return back()->with('error', 'Unauthorized action.');
    }

    try {
        $request->validate([
            'action' => 'required|in:approve,disapprove',
            'remarks' => 'required|array|min:1',
            'remarks.*.message' => 'required|string|max:1000',
            'remarks.*.created_by' => 'required|exists:tbl_users,user_id',
            'stage' => 'required|string',
        ]);
    } catch (\Illuminate\Validation\ValidationException $e) {
        Log::error('Validation failed for updateProgressReview', [
            'errors' => $e->errors(),
            'request_data' => $request->all()
        ]);
        return back()->withErrors($e->errors())->with('error', 'Validation failed. Please check all fields.');
    }

    $project = ProjectModel::findOrFail($id);
    $oldProgress = $project->progress;
    $newProgress = $oldProgress;

    if ($request->action === 'approve') {
        if ($request->stage === 'internal_rtec') {
            $newProgress = 'internal_compliance';
        } elseif ($request->stage === 'internal_compliance') {
            $newProgress = 'external_rtec';
        } elseif ($request->stage === 'external_rtec') {
            $newProgress = 'external_compliance';
        } elseif ($request->stage === 'external_compliance') {
            $newProgress = 'approval';
        } elseif ($request->stage === 'approval') {
            $newProgress = 'Approved';
        }

        $project->progress = $newProgress;
        $project->save();

        // Determine message subject
        if ($request->stage === 'internal_rtec') {
            $subject = 'internal_compliance';
        } elseif ($request->stage === 'external_rtec') {
            $subject = 'external_compliance';
        } else {
            $subject = $newProgress; // keep same as new progress for others
        }

        // Create multiple messages
        foreach ($request->remarks as $remark) {
            MessageModel::create([
                'project_id' => $project->project_id,
                'created_by' => $remark['created_by'],
                'subject' => $subject,
                'message' => $remark['message'],
                'status' => 'todo',
            ]);
        }


        Log::info('Project approved with multiple remarks', [
            'project_id' => $project->project_id,
            'old_progress' => $oldProgress,
            'new_progress' => $newProgress,
            'remarks_count' => count($request->remarks),
            'approved_by' => $user->user_id,
            'stage' => $request->stage,
        ]);

        return back()->with('success', 'Project approved and moved to next stage.');
    } else {
        $project->progress = 'Disapproved';
        $project->save();

        // Create multiple disapproval messages
        foreach ($request->remarks as $remark) {
            MessageModel::create([
                'project_id' => $project->project_id,
                'created_by' => $remark['created_by'],
                'subject' => 'Disapproved',
                'message' => $remark['message'],
                'status' => 'end'
            ]);
        }

        Log::info('Project disapproved with multiple remarks', [
            'project_id' => $project->project_id,
            'old_progress' => $oldProgress,
            'remarks_count' => count($request->remarks),
            'disapproved_by' => $user->user_id,
            'stage' => $request->stage,
        ]);

        return back()->with('success', 'Project disapproved. Remarks saved.');
    }
}


public function updateProgress(Request $request, $id)
{
    $request->validate([
        'progress' => 'required|in:Draft MOA,Implementation',
    ]);

    $project = ProjectModel::findOrFail($id);
    $project->progress = $request->progress;
    $project->save();

    // If progress is "Implementation", create implement record if not existing
    if ($request->progress === 'Implementation') {
        $exists = ImplementationModel::where('project_id', $project->project_id)->exists();

        if (!$exists) {
            ImplementationModel::create([
                'project_id' => $project->project_id,
                'tarp' => null,
                'pdc' => null,
                'liquidation' => null,
            ]);
        }

        // Update acknowledge_date in tbl_moa
        $moa = MoaModel::where('project_id', $project->project_id)->first();
        if ($moa) {
            $moa->acknowledge_date = Carbon::now();
            $moa->save();
        }
    }

    return back();
}

    public function destroy($id)
    {
        ProjectModel::findOrFail($id)->delete();
        return redirect('/projects')->with('success', 'Project deleted successfully.');
    }
}
