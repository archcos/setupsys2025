<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DirectorModel;
use App\Models\OfficeModel;
use Inertia\Inertia;

class DirectorController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $directors = DirectorModel::query()
            ->when($search, function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })
            ->with('office')
            ->orderBy('director_id', 'asc')
            ->paginate(10)
            ->withQueryString();

        $offices = OfficeModel::select('office_id', 'office_name')->get();

        return Inertia::render('Admin/DirectorManagement', [
            'directors' => $directors,
            'offices' => $offices,
            'filters' => $request->only('search')
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:45',
            'middle_name' => 'nullable|string|max:45',
            'last_name' => 'required|string|max:45',
            'email' => 'nullable|email|max:45',
            'title' => 'nullable|string|max:45',
            'honorific' => 'nullable|string|max:45',
            'office_id' => 'nullable|integer|exists:tbl_offices,office_id',
        ]);

        // Convert empty string to null for office_id
        if (empty($validated['office_id'])) {
            $validated['office_id'] = null;
        }

        $director = DirectorModel::findOrFail($id);
        $director->update($validated);

        return back()->with('success', 'Director updated successfully!');
    }

}
