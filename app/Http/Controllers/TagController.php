<?php

namespace App\Http\Controllers;

use App\Models\TagModel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TagController extends Controller
{
    // Store a new tag
    public function store(Request $request)
    {
        $validated = $request->validate([
            'implement_id' => 'required|exists:tbl_implements,implement_id',
            'tag_name' => 'required|string|max:255',
            'tag_amount' => 'required|numeric|min:0',
        ]);

        TagModel::create($validated);

        return back()->with('success', 'Tag added successfully.');
    }

    // Update an existing tag
    public function update(Request $request, $tagId)
    {
        $validated = $request->validate([
            'tag_name' => 'required|string|max:255',
            'tag_amount' => 'required|numeric|min:0',
        ]);

        $tag = TagModel::findOrFail($tagId);
        $tag->update([
            'tag_name' => $validated['tag_name'],
            'tag_amount' => $validated['tag_amount'],
        ]);

        return back()->with('success', 'Tag updated successfully.');
    }


    // Delete a tag
    public function destroy(Request $request, $tagId)
    {
        $tag = TagModel::findOrFail($tagId);

        // Optional: add an authorization or implement_id check if needed
        $tag->delete();

        return back()->with('success', 'Tag deleted successfully.');
    }
}
