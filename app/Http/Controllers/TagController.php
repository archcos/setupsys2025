<?php

namespace App\Http\Controllers;

use App\Models\ImplementationModel;
use App\Models\ProjectModel;
use App\Models\TagModel;
use Illuminate\Http\Request;

class TagController extends Controller
{
    // Helper: check if project is fully tagged
    protected function updateProjectProgress($implementId)
    {
        $implementation = ImplementationModel::findOrFail($implementId);
        $project = ProjectModel::findOrFail($implementation->project_id);

        $totalTagAmount = TagModel::where('implement_id', $implementId)
            ->sum('tag_amount');

        $newProgress = ($totalTagAmount >= $project->project_cost) ? 'Liquidation' : 'Implementation';
        $project->update(['progress' => $newProgress]);
    }

    // Store a new tag
    public function store(Request $request)
    {
        $validated = $request->validate([
            'implement_id' => 'required|exists:tbl_implements,implement_id',
            'tag_name' => 'required|string|max:255',
            'tag_amount' => 'required|numeric|min:0',
        ]);

        $tag = TagModel::create($validated);

        // 🔄 Check project progress
        $this->updateProjectProgress($tag->implement_id);

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

        // 🔄 Check project progress
        $this->updateProjectProgress($tag->implement_id);

        return back()->with('success', 'Tag updated successfully.');
    }

    // Delete a tag
    public function destroy(Request $request, $tagId)
    {
        $tag = TagModel::findOrFail($tagId);
        $implementId = $tag->implement_id;
        $tag->delete();

        // 🔄 Check project progress (maybe revert progress if below total)
        $this->updateProjectProgress($implementId);

        return back()->with('success', 'Tag deleted successfully.');
    }
}
