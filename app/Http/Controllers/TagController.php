<?php

namespace App\Http\Controllers;

use App\Models\ImplementationModel;
use App\Models\ProjectModel;
use App\Models\TagModel;
use Illuminate\Http\Request;

class TagController extends Controller
{
    protected function updateProjectProgress($implementId)
    {
        $implementation = ImplementationModel::findOrFail($implementId);
        $project = ProjectModel::findOrFail($implementation->project_id);

        $totalTagAmount = TagModel::where('implement_id', $implementId)
            ->sum('tag_amount');

        $newProgress = ($totalTagAmount >= $project->project_cost) ? 'Liquidation' : 'Implementation';
        $project->update(['progress' => $newProgress]);
    }

    // Helper: get remaining budget
    protected function getRemainingAmount($implementId, $excludeTagId = null)
    {
        $implementation = ImplementationModel::findOrFail($implementId);
        $project = ProjectModel::findOrFail($implementation->project_id);

        $query = TagModel::where('implement_id', $implementId);

        if ($excludeTagId) {
            $query->where('tag_id', '!=', $excludeTagId);
        }

        $totalTagged = $query->sum('tag_amount');

        return $project->project_cost - $totalTagged;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'implement_id' => 'required|exists:tbl_implements,implement_id',
            'tag_name'     => 'required|string|max:255',
            'tag_amount'   => 'required|numeric|min:0',
        ]);

        $remaining = $this->getRemainingAmount($validated['implement_id']);

        if ($validated['tag_amount'] > $remaining) {
            return back()->withErrors([
                'tag_amount' => "Amount exceeds remaining budget. Maximum allowed: ₱" . number_format($remaining, 2),
            ])->withInput();
        }

        $tag = TagModel::create($validated);
        $this->updateProjectProgress($tag->implement_id);

        return back()->with('success', 'Tag added successfully.');
    }

    public function update(Request $request, $tagId)
    {
        $validated = $request->validate([
            'tag_name'   => 'required|string|max:255',
            'tag_amount' => 'required|numeric|min:0',
        ]);

        $tag = TagModel::findOrFail($tagId);

        // Exclude current tag when calculating remaining
        $remaining = $this->getRemainingAmount($tag->implement_id, $tagId);

        if ($validated['tag_amount'] > $remaining) {
            return back()->withErrors([
                'tag_amount' => "Amount exceeds remaining budget. Maximum allowed: ₱" . number_format($remaining, 2),
            ])->withInput();
        }

        $tag->update([
            'tag_name'   => $validated['tag_name'],
            'tag_amount' => $validated['tag_amount'],
        ]);

        $this->updateProjectProgress($tag->implement_id);

        return back()->with('success', 'Tag updated successfully.');
    }

    public function destroy(Request $request, $tagId)
    {
        $tag = TagModel::findOrFail($tagId);
        $implementId = $tag->implement_id;
        $tag->delete();

        $this->updateProjectProgress($implementId);

        return back()->with('success', 'Tag deleted successfully.');
    }
}