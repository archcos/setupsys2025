<?php

namespace App\Http\Controllers;

use App\Models\ImplementationModel;
use App\Models\ProjectModel;
use App\Models\TagModel;
use Illuminate\Http\Request;
use Carbon\Carbon;

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
            'created_at'   => 'nullable|date_format:Y-m-d H:i|before_or_equal:now', // Allow custom created_at
        ]);

        $remaining = $this->getRemainingAmount($validated['implement_id']);

        if ($validated['tag_amount'] > $remaining) {
            return back()->withErrors([
                'tag_amount' => "Amount exceeds remaining budget. Maximum allowed: ₱" . number_format($remaining, 2),
            ])->withInput();
        }

        // If no created_at provided, it will use current timestamp automatically
        $tagData = [
            'implement_id' => $validated['implement_id'],
            'tag_name'     => $validated['tag_name'],
            'tag_amount'   => $validated['tag_amount'],
        ];

        // Add created_at if provided
        if ($validated['created_at']) {
            $tagData['created_at'] = Carbon::createFromFormat('Y-m-d H:i', $validated['created_at']);
        }

        $tag = TagModel::create($tagData);
        $this->updateProjectProgress($tag->implement_id);

        return back()->with('success', 'Tag added successfully.');
    }

    public function update(Request $request, $tagId)
    {
        $validated = $request->validate([
            'tag_name'   => 'required|string|max:255',
            'tag_amount' => 'required|numeric|min:0',
            'created_at' => 'nullable|date_format:Y-m-d H:i|before_or_equal:now', // Allow updating created_at
        ]);

        $tag = TagModel::findOrFail($tagId);

        // Exclude current tag when calculating remaining
        $remaining = $this->getRemainingAmount($tag->implement_id, $tagId);

        if ($validated['tag_amount'] > $remaining) {
            return back()->withErrors([
                'tag_amount' => "Amount exceeds remaining budget. Maximum allowed: ₱" . number_format($remaining, 2),
            ])->withInput();
        }

        $updateData = [
            'tag_name'   => $validated['tag_name'],
            'tag_amount' => $validated['tag_amount'],
        ];

        // Update created_at if provided
        if ($validated['created_at']) {
            $updateData['created_at'] = Carbon::createFromFormat('Y-m-d H:i', $validated['created_at']);
        }

        $tag->update($updateData);
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