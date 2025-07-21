<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use App\Models\CompanyModel;
use App\Models\UserModel;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
 public function index(Request $request)
    {
        $userId = session('user_id');
        $user = UserModel::where('user_id', $userId)->first();

        $query = CompanyModel::query();

        // ✅ Role-based filtering
        if ($user->role === 'user') {
            $query->where('added_by', $user->user_id);
        } elseif ($user->role === 'staff') {
            $query->where('office_id', $user->office_id);
        }
        // Admin sees all — no filter

        // 🔍 Search filter
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%$search%")
                ->orWhere('owner_fname', 'like', "%$search%")
                ->orWhere('owner_mname', 'like', "%$search%")
                ->orWhere('owner_lname', 'like', "%$search%")
                ->orWhere('company_location', 'like', "%$search%");
            });
        }

        $companies = $query->orderBy('company_name')->get();

        return Inertia::render('Companies/Index', [
            'companies' => $companies,
            'filters' => $request->only('search'),
        ]);
    }

public function create()
{
    return Inertia::render('Companies/Create');
}

public function store(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'owner_fname' => 'required|string|max:255',
            'owner_lname' => 'required|string|max:255',
            'owner_mname' => 'nullable|string|max:255',
            'company_location' => 'required|string|max:255',
        ]);

        $user = UserModel::where('user_id', session('user_id'))->first();

        $validated['added_by'] = $user->user_id;
        $validated['office_id'] = $user->office_id;

        CompanyModel::create($validated);

        return redirect()->route('companies.index')->with('success', 'Company added successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */

    /**
     * Update the specified resource in storage.
     */
public function edit($id)
{
    $company = CompanyModel::findOrFail($id);
    return Inertia::render('Companies/Edit', compact('company'));
}

public function update(Request $request, $id)
{
    $request->validate([
        'company_name' => 'required',
        'owner_fname' => 'required',
        'owner_lname' => 'required',
        'company_location' => 'required',
    ]);

    $company = CompanyModel::findOrFail($id);
    $company->update($request->all());

    return redirect()->route('companies.index')->with('success', 'Company updated.');
}


    /**
     * Remove the specified resource from storage.
     */
public function destroy($id)
{
    $company = CompanyModel::findOrFail($id);
    $company->delete();

    return redirect()->route('companies.index')->with('success', 'Company deleted successfully.');
}
}
