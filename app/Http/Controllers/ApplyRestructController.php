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
        $applyRestructs = ApplyRestructModel::with(['project', 'addedBy'])
            ->latest()
            ->get();

        $projects = ProjectModel::select('project_id', 'project_title')->get();

        return Inertia::render('Restructures/ApplyRestructure', [
            'applyRestructs' => $applyRestructs,
            'projects' => $projects,
        ]);
    }

    public function store(Request $request)
    {
        try {
            Log::info('ApplyRestruct store initiated', [
                'project_id' => $request->project_id,
                'user_id' => Auth::id()
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

            $applyRestruct = ApplyRestructModel::create([
                'project_id' => $request->project_id,
                'added_by' => Auth::id(),
                'proponent' => $request->proponent,
                'psto' => $request->psto,
                'annexc' => $request->annexc,
                'annexd' => $request->annexd,
            ]);

            Log::info('ApplyRestruct created successfully', [
                'apply_id' => $applyRestruct->apply_id,
                'project_id' => $applyRestruct->project_id
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
            Log::info('ApplyRestruct update initiated', [
                'apply_id' => $apply_id,
                'user_id' => Auth::id()
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

            $applyRestruct = ApplyRestructModel::findOrFail($apply_id);
            
            $applyRestruct->update([
                'project_id' => $request->project_id,
                'proponent' => $request->proponent,
                'psto' => $request->psto,
                'annexc' => $request->annexc,
                'annexd' => $request->annexd,
            ]);

            Log::info('ApplyRestruct updated successfully', [
                'apply_id' => $apply_id,
                'project_id' => $applyRestruct->project_id
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
            Log::info('ApplyRestruct delete initiated', [
                'apply_id' => $apply_id,
                'user_id' => Auth::id()
            ]);

            $applyRestruct = ApplyRestructModel::findOrFail($apply_id);
            $applyRestruct->delete();

            Log::info('ApplyRestruct deleted successfully', [
                'apply_id' => $apply_id
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