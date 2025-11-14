<?php

namespace App\Http\Controllers;

use App\Mail\NotificationCreatedMail;
use App\Models\ObjectiveModel;
use App\Models\ProjectModel;
use App\Models\CompanyModel;
use App\Models\ImplementationModel;
use App\Models\ItemModel;
use App\Models\MarketModel;
use App\Models\MessageModel;
use App\Models\MoaModel;
use App\Models\RtecModel;
use App\Models\UserModel;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class ReviewController extends Controller
{
public function reviewApproval(Request $request)
{
    $user = Auth::user();
    if (!$user) {
        Log::warning('Unauthorized access attempt to reviewApproval.');
        return redirect()->route('login');
    }

    $search = $request->input('search');
    $perPage = $request->input('perPage', 10);
    $stage = $request->input('stage', 'internal_rtec');

    $progressMap = [
        'internal_rtec' => 'internal_rtec',
        'internal_compliance' => 'internal_compliance',
        'external_rtec' => 'external_rtec',
        'external_compliance' => 'external_compliance',
        'approval' => 'approval',
    ];

    $query = ProjectModel::with([
        'company',
        'items' => function ($q) {
            $q->where('report', 'approved');
        }
    ]);

    // Apply progress stage filter
    if (isset($progressMap[$stage])) {
        $query->where('progress', $progressMap[$stage]);
    }

    // Apply role-based filtering with logging
    if ($user->role === 'user') {
        Log::info('Applying user filter', ['user_id' => $user->user_id]);
        $query->where('added_by', $user->user_id);
    } elseif ($user->role === 'staff') {
        Log::info('Applying staff filter', [
            'user_id' => $user->user_id,
            'office_id' => $user->office_id
        ]);
        
        // Make sure office_id exists
        if (!$user->office_id) {
            Log::error('Staff user has no office_id', ['user_id' => $user->user_id]);
            return back()->with('error', 'Your account is not assigned to an office. Please contact administrator.');
        }
        
        // Apply the office filter
        $query->whereHas('company', function ($q) use ($user) {
            $q->where('office_id', $user->office_id);
        });
        
        // Debug: Log the SQL query
        Log::info('Staff query SQL', [
            'sql' => $query->toSql(),
            'bindings' => $query->getBindings()
        ]);
    } else {
        Log::info('No additional filter applied for role', ['role' => $user->role]);
    }

    // Apply search filter
    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->where('project_title', 'like', "%{$search}%")
              ->orWhere('project_cost', 'like', "%{$search}%")
              ->orWhereHas('company', function ($q) use ($search) {
                  $q->where('company_name', 'like', "%{$search}%");
              });
        });
    }

    // Only show projects with approved items
    $query->whereHas('items', function ($q) {
        $q->where('report', 'approved');
    });

    // Execute query and get results
    $projects = $query->orderBy('project_title')->paginate($perPage)->withQueryString();

    // Log results count
    Log::info('Projects retrieved', [
        'role' => $user->role,
        'office_id' => $user->office_id ?? 'N/A',
        'total_projects' => $projects->total(),
        'stage' => $stage
    ]);

    $projects->getCollection()->transform(function ($project) {
        // Get all messages with their comments
        $allMessages = MessageModel::with([
            'user',
            'comments' => function($query) {
                $query->with(['user' => function($q) {
                    $q->select('user_id', 'first_name', 'middle_name', 'last_name');
                }])
                ->orderBy('created_at', 'asc');
            }
        ])
            ->where('project_id', $project->project_id)
            ->whereIn('status', ['todo', 'done'])
            ->orderBy('created_at', 'desc')
            ->get();

        $filteredMessages = $allMessages->filter(function ($message) use ($project) {
            return trim($message->subject) === trim($project->progress);
        })->values();

        $project->setRelation('messages', $filteredMessages);
        
        Log::info('Project messages filtered with comments', [
            'project_id' => $project->project_id,
            'progress' => $project->progress,
            'total_messages' => $allMessages->count(),
            'filtered_messages' => $filteredMessages->count(),
        ]);

        return $project;
    });

    // Fetch users with roles other than 'staff' or 'user'
    $availableUsers = UserModel::whereNotIn('role', ['staff', 'user'])
        ->select('user_id', 'first_name', 'middle_name', 'last_name', 'role')
        ->orderBy('first_name')
        ->get();

    Log::info("{$user->username} accessed reviewApproval page", [
        'role' => $user->role,
        'office_id' => $user->office_id ?? 'N/A',
        'stage' => $stage,
        'progress_filter' => $progressMap[$stage] ?? 'none',
    ]);

    return Inertia::render('ReviewApproval/ReviewApproval', [
        'projects' => $projects,
        'filters' => $request->only('search', 'perPage', 'stage'),
        'currentStage' => $stage,
        'availableUsers' => $availableUsers,
    ]);
}
    public function toggleMessageStatus($id)
    {
        $user = Auth::user();
        
        $message = MessageModel::findOrFail($id);

        if (!in_array($message->status, ['todo', 'done'])) {
            return response()->json(['error' => 'Invalid status'], 400);
        }

        $message->status = $message->status === 'done' ? 'todo' : 'done';
        $message->save();

        Log::info('Message status toggled', [
            'message_id' => $id,
            'new_status' => $message->status,
            'toggled_by' => $user->user_id
        ]);

        // Return JSON response instead of redirect
        return response()->json([
            'success' => true,
            'new_status' => $message->status,
            'message_id' => $id
        ]);
    }

    public function updateProgressReview(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['rpmo', 'staff'])) {
            Log::warning('Unauthorized review update attempt by user ID ' . ($user->user_id ?? 'unknown'));
            return back()->with('error', 'Unauthorized action.');
        }

        try {
            $request->validate([
                'action' => 'required|in:approve,disapprove',
                'remarks' => 'required|array|min:1',
                'remarks.*.message' => 'required|string|max:1000',
                'remarks.*.created_by' => 'required|exists:tbl_users,user_id',
                'stage' => 'required|string',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed for updateProgressReview', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            return back()->withErrors($e->errors())->with('error', 'Validation failed. Please check all fields.');
        }

        $project = ProjectModel::findOrFail($id);
        $oldProgress = $project->progress;
        $newProgress = $oldProgress;

        if ($request->action === 'approve') {
            if ($request->stage === 'internal_rtec') {
                $newProgress = 'internal_compliance';
            } elseif ($request->stage === 'internal_compliance') {
                $newProgress = 'external_rtec';
            } elseif ($request->stage === 'external_rtec') {
                $newProgress = 'external_compliance';
            } elseif ($request->stage === 'external_compliance') {
                $newProgress = 'approval';
            } elseif ($request->stage === 'approval') {
                $newProgress = 'Approved';
            }

            $project->progress = $newProgress;
            $project->save();

            // Determine message subject
            if ($request->stage === 'internal_rtec') {
                $subject = 'internal_compliance';
            } elseif ($request->stage === 'external_rtec') {
                $subject = 'external_compliance';
            } else {
                $subject = $newProgress; // keep same as new progress for others
            }

            // Create multiple messages
            foreach ($request->remarks as $remark) {
                MessageModel::create([
                    'project_id' => $project->project_id,
                    'created_by' => $remark['created_by'],
                    'subject' => $subject,
                    'message' => $remark['message'],
                    'status' => 'todo',
                ]);
            }

            Log::info('Project approved with multiple remarks', [
                'project_id' => $project->project_id,
                'old_progress' => $oldProgress,
                'new_progress' => $newProgress,
                'remarks_count' => count($request->remarks),
                'approved_by' => $user->user_id,
                'stage' => $request->stage,
            ]);

            return back()->with('success', 'Project approved and moved to next stage.');
        } else {
            $project->progress = 'Disapproved';
            $project->save();

            // Create multiple disapproval messages
            foreach ($request->remarks as $remark) {
                MessageModel::create([
                    'project_id' => $project->project_id,
                    'created_by' => $remark['created_by'],
                    'subject' => 'Disapproved',
                    'message' => $remark['message'],
                    'status' => 'end'
                ]);
            }

            Log::info('Project disapproved with multiple remarks', [
                'project_id' => $project->project_id,
                'old_progress' => $oldProgress,
                'remarks_count' => count($request->remarks),
                'disapproved_by' => $user->user_id,
                'stage' => $request->stage,
            ]);

            return back()->with('success', 'Project disapproved. Remarks saved.');
        }
    }

    // COMMENT METHODS - Updated to return JSON for dynamic updates

    public function storeComment(Request $request, $messageId)
    {
        $request->validate([
            'message' => 'required|string'
        ]);

        // Get the parent remark to get project_id and subject
        $parentRemark = MessageModel::where('message_id', $messageId)->firstOrFail();

        // Create comment with status set to the parent message_id
        $comment = MessageModel::create([
            'project_id' => $parentRemark->project_id,
            'created_by' => Auth::id(),
            'subject' => $parentRemark->subject,
            'message' => $request->message,
            'status' => (string)$messageId // Store parent message_id in status field
        ]);

        // Load the user relationship
        $comment->load(['user' => function($q) {
            $q->select('user_id', 'first_name', 'middle_name', 'last_name');
        }]);

        Log::info('Comment added to message', [
            'parent_message_id' => $messageId,
            'created_by' => Auth::id()
        ]);

        return response()->json([
            'success' => true,
            'comment' => $comment
        ]);
    }

    public function updateComment(Request $request, $commentId)
    {
        $comment = MessageModel::where('message_id', $commentId)->firstOrFail();
        
        if ($comment->created_by !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        $comment->update(['message' => $request->message]);
        
        Log::info('Comment updated', [
            'comment_id' => $commentId,
            'updated_by' => Auth::id()
        ]);

        return response()->json([
            'success' => true,
            'comment' => $comment
        ]);
    }

    public function deleteComment(Request $request, $commentId)
    {
        $comment = MessageModel::where('message_id', $commentId)->firstOrFail();

        if ($comment->created_by !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        $comment->delete();
        
        Log::info('Comment deleted', [
            'comment_id' => $commentId,
            'deleted_by' => Auth::id()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted successfully'
        ]);
    }
}