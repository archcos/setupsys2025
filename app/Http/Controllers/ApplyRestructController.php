<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ApplyRestructModel;
use App\Models\ProjectModel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\ApplyRestructureMail;

class ApplyRestructController extends Controller
{
public function index()
{
    try {
        $user = Auth::user();
        
        Log::info('ApplyRestruct index accessed', [
            'user_id' => $user->user_id,
            'office_id' => $user->office_id ?? 'NULL'
        ]);
        
        // Check if user has office_id
        if (!$user->office_id) {
            Log::warning('User has no office_id assigned', [
                'user_id' => $user->user_id
            ]);
            
            return Inertia::render('Restructures/ApplyRestructure', [
                'applyRestructs' => [],
                'projects' => [],
                'flash' => [
                    'error' => 'Your account is not assigned to an office. Please contact the administrator.'
                ]
            ]);
        }
        
        // Filter apply restructs based on user's office_id through company
        // Eager load restructures to get status
        $applyRestructs = ApplyRestructModel::with([
                'project.company', 
                'addedBy', 
                'restructures' => function($query) {
                    $query->orderBy('created_at', 'desc'); // Use orderBy instead of latest() in relationship
                }
            ])
            ->whereHas('project.company', function ($query) use ($user) {
                $query->where('office_id', $user->office_id);
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($item) {
                // Log the raw restructures relationship data
                Log::info('ApplyRestruct raw restructures data', [
                    'apply_id' => $item->apply_id,
                    'restructures_count' => $item->restructures->count(),
                    'restructures_exists' => $item->restructures->isNotEmpty(),
                    'all_restructures' => $item->restructures->map(function($r) {
                        return [
                            'restruct_id' => $r->restruct_id ?? 'NULL',
                            'status' => $r->status ?? 'NULL',
                            'created_at' => $r->created_at ?? 'NULL'
                        ];
                    })->toArray()
                ]);
                
                // Get the latest restructure status
                $latestRestructure = $item->restructures->first();
                
                // Log whether we found a latest restructure
                Log::info('Latest restructure lookup', [
                    'apply_id' => $item->apply_id,
                    'has_latest_restructure' => $latestRestructure !== null,
                    'latest_restructure_data' => $latestRestructure ? [
                        'restruct_id' => $latestRestructure->restruct_id,
                        'status' => $latestRestructure->status,
                        'created_at' => $latestRestructure->created_at
                    ] : null
                ]);
                
                $item->status = $latestRestructure ? $latestRestructure->status : 'pending';
                $item->restruct_id = $latestRestructure ? $latestRestructure->restruct_id : null;
                
                // Debug log - final assigned values
                Log::info('ApplyRestruct final status assignment', [
                    'apply_id' => $item->apply_id,
                    'assigned_status' => $item->status,
                    'assigned_restruct_id' => $item->restruct_id,
                    'total_restructures' => $item->restructures->count()
                ]);
                
                return $item;
            });

        // Filter projects based on user's office_id through company
        $projects = ProjectModel::select('project_id', 'project_title')
            ->whereHas('company', function ($query) use ($user) {
                $query->where('office_id', $user->office_id);
            })
            ->get();

        Log::info('ApplyRestruct index data fetched', [
            'apply_restructs_count' => $applyRestructs->count(),
            'projects_count' => $projects->count(),
            'apply_restructs_summary' => $applyRestructs->map(function($item) {
                return [
                    'apply_id' => $item->apply_id,
                    'status' => $item->status,
                    'restruct_id' => $item->restruct_id
                ];
            })->toArray()
        ]);

        return Inertia::render('Restructures/ApplyRestructure', [
            'applyRestructs' => $applyRestructs,
            'projects' => $projects,
        ]);
    } catch (\Exception $e) {
        Log::error('Error in ApplyRestruct index', [
            'error' => $e->getMessage(),
            'line' => $e->getLine(),
            'file' => $e->getFile(),
            'trace' => $e->getTraceAsString(),
            'user_id' => Auth::id()
        ]);
        
        return Inertia::render('Restructures/ApplyRestructure', [
            'applyRestructs' => [],
            'projects' => [],
            'flash' => [
                'error' => 'An error occurred while loading the data. Please try again.'
            ]
        ]);
    }
}
public function store(Request $request)
{
    try {
        $user = Auth::user();
        
        Log::info('ApplyRestruct store initiated', [
            'project_id' => $request->project_id,
            'user_id' => $user->user_id,
            'office_id' => $user->office_id
        ]);

        $request->validate([
            'project_id' => 'required|exists:tbl_projects,project_id',
            'proponent' => [
                'required',
                'string',
                'regex:/^https:\/\/(drive|docs)\.google\.com\/.+|^https:\/\/(onedrive\.live\.com|1drv\.ms)\/.+/'
            ],
            'psto' => [
                'required',
                'string',
                'regex:/^https:\/\/(drive|docs)\.google\.com\/.+|^https:\/\/(onedrive\.live\.com|1drv\.ms)\/.+/'
            ],
            'annexc' => [
                'required',
                'string',
                'regex:/^https:\/\/(drive|docs)\.google\.com\/.+|^https:\/\/(onedrive\.live\.com|1drv\.ms)\/.+/'
            ],
            'annexd' => [
                'required',
                'string',
                'regex:/^https:\/\/(drive|docs)\.google\.com\/.+|^https:\/\/(onedrive\.live\.com|1drv\.ms)\/.+/'
            ],
        ], [
            'proponent.required' => 'Proponent is required',
            'proponent.regex' => 'Proponent must be a valid Google Drive or OneDrive link',
            'psto.required' => 'PSTO is required',
            'psto.regex' => 'PSTO must be a valid Google Drive or OneDrive link',
            'annexc.required' => 'Annex C is required',
            'annexc.regex' => 'Annex C must be a valid Google Drive or OneDrive link',
            'annexd.required' => 'Annex D is required',
            'annexd.regex' => 'Annex D must be a valid Google Drive or OneDrive link',
        ]);

        // Verify the project belongs to user's office through company
        $project = ProjectModel::with('company')->findOrFail($request->project_id);
        if ($project->company->office_id !== $user->office_id) {
            Log::warning('Unauthorized project access attempt', [
                'user_id' => $user->user_id,
                'user_office_id' => $user->office_id,
                'project_id' => $request->project_id,
                'project_office_id' => $project->company->office_id
            ]);
            return redirect()->back()->with('error', 'You do not have permission to create an application for this project.');
        }

        $applyRestruct = ApplyRestructModel::create([
            'project_id' => $request->project_id,
            'added_by' => $user->user_id,
            'proponent' => $request->proponent,
            'psto' => $request->psto,
            'annexc' => $request->annexc,
            'annexd' => $request->annexd,
        ]);

        Log::info('ApplyRestruct created successfully', [
            'apply_id' => $applyRestruct->apply_id,
            'project_id' => $applyRestruct->project_id,
            'office_id' => $user->office_id
        ]);

        // Send email to 2 specific recipients
        $recipients = [
            'arjay.charcos25@gmail.com',
            'rain.shigatsu@gmail.com'
        ];

        Log::info('Starting to send emails', [
            'apply_id' => $applyRestruct->apply_id,
            'recipients' => $recipients
        ]);

        foreach ($recipients as $email) {
            try {
                Mail::to($email)->send(new ApplyRestructureMail($applyRestruct));
                Log::info('Email sent successfully', [
                    'apply_id' => $applyRestruct->apply_id,
                    'recipient' => $email
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to send email', [
                    'apply_id' => $applyRestruct->apply_id,
                    'recipient' => $email,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }

        Log::info('ApplyRestruct store completed successfully', [
            'apply_id' => $applyRestruct->apply_id
        ]);

        return redirect()->back()->with('success', 'Apply Restructure added successfully.');
    } catch (\Illuminate\Validation\ValidationException $e) {
        Log::warning('Validation failed in store', [
            'errors' => $e->errors(),
            'user_id' => Auth::id()
        ]);
        throw $e;
    } catch (\Exception $e) {
        Log::error('Error in ApplyRestruct store', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'user_id' => Auth::id()
        ]);
        return redirect()->back()->with('error', 'An error occurred while creating the restructure application.');
    }
}

public function update(Request $request, $apply_id)
{
    try {
        $user = Auth::user();
        
        Log::info('ApplyRestruct update initiated', [
            'apply_id' => $apply_id,
            'user_id' => $user->user_id,
            'office_id' => $user->office_id
        ]);

        $request->validate([
            'project_id' => 'required|exists:tbl_projects,project_id',
            'proponent' => [
                'required',
                'string',
                'regex:/^https:\/\/(drive|docs)\.google\.com\/.+|^https:\/\/(onedrive\.live\.com|1drv\.ms)\/.+/'
            ],
            'psto' => [
                'required',
                'string',
                'regex:/^https:\/\/(drive|docs)\.google\.com\/.+|^https:\/\/(onedrive\.live\.com|1drv\.ms)\/.+/'
            ],
            'annexc' => [
                'required',
                'string',
                'regex:/^https:\/\/(drive|docs)\.google\.com\/.+|^https:\/\/(onedrive\.live\.com|1drv\.ms)\/.+/'
            ],
            'annexd' => [
                'required',
                'string',
                'regex:/^https:\/\/(drive|docs)\.google\.com\/.+|^https:\/\/(onedrive\.live\.com|1drv\.ms)\/.+/'
            ],
        ], [
            'proponent.required' => 'Proponent is required',
            'proponent.regex' => 'Proponent must be a valid Google Drive or OneDrive link',
            'psto.required' => 'PSTO is required',
            'psto.regex' => 'PSTO must be a valid Google Drive or OneDrive link',
            'annexc.required' => 'Annex C is required',
            'annexc.regex' => 'Annex C must be a valid Google Drive or OneDrive link',
            'annexd.required' => 'Annex D is required',
            'annexd.regex' => 'Annex D must be a valid Google Drive or OneDrive link',
        ]);

        $applyRestruct = ApplyRestructModel::with('project.company')->findOrFail($apply_id);
        
        // Verify the apply restruct belongs to user's office through company
        if ($applyRestruct->project->company->office_id !== $user->office_id) {
            Log::warning('Unauthorized update attempt', [
                'user_id' => $user->user_id,
                'user_office_id' => $user->office_id,
                'apply_id' => $apply_id,
                'project_office_id' => $applyRestruct->project->company->office_id
            ]);
            return redirect()->back()->with('error', 'You do not have permission to update this application.');
        }

        // Verify the new project belongs to user's office through company
        $newProject = ProjectModel::with('company')->findOrFail($request->project_id);
        if ($newProject->company->office_id !== $user->office_id) {
            Log::warning('Unauthorized project change attempt', [
                'user_id' => $user->user_id,
                'user_office_id' => $user->office_id,
                'new_project_id' => $request->project_id,
                'new_project_office_id' => $newProject->company->office_id
            ]);
            return redirect()->back()->with('error', 'You do not have permission to assign this project.');
        }
        
        $applyRestruct->update([
            'project_id' => $request->project_id,
            'proponent' => $request->proponent,
            'psto' => $request->psto,
            'annexc' => $request->annexc,
            'annexd' => $request->annexd,
        ]);

        Log::info('ApplyRestruct updated successfully', [
            'apply_id' => $apply_id,
            'project_id' => $applyRestruct->project_id,
            'office_id' => $user->office_id
        ]);

        return redirect()->back()->with('success', 'Apply Restructure updated successfully.');
    } catch (\Illuminate\Validation\ValidationException $e) {
        Log::warning('Validation failed in update', [
            'apply_id' => $apply_id,
            'errors' => $e->errors(),
            'user_id' => Auth::id()
        ]);
        throw $e;
    } catch (\Exception $e) {
        Log::error('Error in ApplyRestruct update', [
            'apply_id' => $apply_id,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'user_id' => Auth::id()
        ]);
        return redirect()->back()->with('error', 'An error occurred while updating the restructure application.');
    }
}

public function destroy($apply_id)
{
    try {
        $user = Auth::user();
        
        Log::info('ApplyRestruct delete initiated', [
            'apply_id' => $apply_id,
            'user_id' => $user->user_id,
            'office_id' => $user->office_id
        ]);

        $applyRestruct = ApplyRestructModel::with('project.company')->findOrFail($apply_id);
        
        // Verify the apply restruct belongs to user's office through company
        if ($applyRestruct->project->company->office_id !== $user->office_id) {
            Log::warning('Unauthorized delete attempt', [
                'user_id' => $user->user_id,
                'user_office_id' => $user->office_id,
                'apply_id' => $apply_id,
                'project_office_id' => $applyRestruct->project->company->office_id
            ]);
            return redirect()->back()->with('error', 'You do not have permission to delete this application.');
        }
        
        $applyRestruct->delete();

        Log::info('ApplyRestruct deleted successfully', [
            'apply_id' => $apply_id,
            'office_id' => $user->office_id
        ]);

        return redirect()->back()->with('success', 'Apply Restructure deleted successfully.');
    } catch (\Exception $e) {
        Log::error('Error in ApplyRestruct destroy', [
            'apply_id' => $apply_id,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'user_id' => Auth::id()
        ]);
        return redirect()->back()->with('error', 'An error occurred while deleting the restructure application.');
    }
}
}