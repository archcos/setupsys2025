<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ApplyRestructModel;
use App\Models\ProjectModel;
use Illuminate\Support\Facades\Auth;

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
        $request->validate([
            'project_id' => 'required|exists:tbl_projects,project_id',
            'proponent' => [
                'nullable',
                'string',
                'regex:/^https:\/\/(drive|docs)\.google\.com\/.+|^https:\/\/(onedrive\.live\.com|1drv\.ms)\/.+/'
            ],
            'psto' => [
                'nullable',
                'string',
                'regex:/^https:\/\/(drive|docs)\.google\.com\/.+|^https:\/\/(onedrive\.live\.com|1drv\.ms)\/.+/'
            ],
            'annexc' => [
                'nullable',
                'string',
                'regex:/^https:\/\/(drive|docs)\.google\.com\/.+|^https:\/\/(onedrive\.live\.com|1drv\.ms)\/.+/'
            ],
            'annexd' => [
                'nullable',
                'string',
                'regex:/^https:\/\/(drive|docs)\.google\.com\/.+|^https:\/\/(onedrive\.live\.com|1drv\.ms)\/.+/'
            ],
        ], [
            'proponent.regex' => 'Proponent must be a valid Google Drive or OneDrive link',
            'psto.regex' => 'PSTO must be a valid Google Drive or OneDrive link',
            'annexc.regex' => 'Annex C must be a valid Google Drive or OneDrive link',
            'annexd.regex' => 'Annex D must be a valid Google Drive or OneDrive link',
        ]);

        ApplyRestructModel::create([
            'project_id' => $request->project_id,
            'added_by' => Auth::id(),
            'proponent' => $request->proponent,
            'psto' => $request->psto,
            'annexc' => $request->annexc,
            'annexd' => $request->annexd,
        ]);

        return redirect()->back()->with('success', 'Apply Restructure added successfully.');
    }

    public function update(Request $request, $apply_id)
    {
        $request->validate([
            'project_id' => 'required|exists:tbl_projects,project_id',
            'proponent' => [
                'nullable',
                'string',
                'regex:/^https:\/\/(drive|docs)\.google\.com\/.+|^https:\/\/(onedrive\.live\.com|1drv\.ms)\/.+/'
            ],
            'psto' => [
                'nullable',
                'string',
                'regex:/^https:\/\/(drive|docs)\.google\.com\/.+|^https:\/\/(onedrive\.live\.com|1drv\.ms)\/.+/'
            ],
            'annexc' => [
                'nullable',
                'string',
                'regex:/^https:\/\/(drive|docs)\.google\.com\/.+|^https:\/\/(onedrive\.live\.com|1drv\.ms)\/.+/'
            ],
            'annexd' => [
                'nullable',
                'string',
                'regex:/^https:\/\/(drive|docs)\.google\.com\/.+|^https:\/\/(onedrive\.live\.com|1drv\.ms)\/.+/'
            ],
        ], [
            'proponent.regex' => 'Proponent must be a valid Google Drive or OneDrive link',
            'psto.regex' => 'PSTO must be a valid Google Drive or OneDrive link',
            'annexc.regex' => 'Annex C must be a valid Google Drive or OneDrive link',
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

        return redirect()->back()->with('success', 'Apply Restructure updated successfully.');
    }

    public function destroy($apply_id)
    {
        $applyRestruct = ApplyRestructModel::findOrFail($apply_id);
        $applyRestruct->delete();

        return redirect()->back()->with('success', 'Apply Restructure deleted successfully.');
    }
}