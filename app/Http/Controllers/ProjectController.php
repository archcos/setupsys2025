<?php

namespace App\Http\Controllers;


use App\Models\CompanyModel;
use App\Models\ProjectModel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index()
    {
        $projects = ProjectModel::with('company')->get();
        return Inertia::render('Projects/Index', ['projects' => $projects]);
    }

    public function create()
    {
        $companies = CompanyModel::all();
        return Inertia::render('Projects/Create', ['companies' => $companies]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'project_name' => 'required',
            'company_id' => 'required|exists:tbl_companies,company_id',
            'project_description' => 'nullable',
            'project_budget' => 'nullable|numeric',
        ]);

        ProjectModel::create($request->all());
        return redirect('/projects');
    }

    public function edit($id)
    {
        $project = ProjectModel::findOrFail($id);
        $companies = CompanyModel::all();

        return Inertia::render('Projects/Edit', [
            'project' => $project,
            'companies' => $companies
        ]);
    }

    public function update(Request $request, $id)
    {
        $project = ProjectModel::findOrFail($id);

        $request->validate([
            'project_name' => 'required',
            'company_id' => 'required|exists:tbl_companies,company_id',
            'project_description' => 'nullable',
            'project_budget' => 'nullable|numeric',
        ]);

        $project->update($request->all());
        return redirect('/projects');
    }

    public function destroy($id)
    {
        ProjectModel::destroy($id);
        return redirect('/projects');
    }
}
