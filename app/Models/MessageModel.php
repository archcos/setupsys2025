<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class MessageModel extends Model
{
    use LogsActivity;
    protected $table = 'tbl_messages'; // THIS IS FOR THE REMARKS IN REVIEW AND APPROVAL
    protected $primaryKey = 'message_id';
    
    protected $fillable = [
        'project_id',
        'created_by',
        'subject',
        'message',
        'status'
    ];

    // Relationship to the user who created this message
    public function user()
    {
        return $this->belongsTo(UserModel::class, 'created_by', 'user_id');
    }

    // Relationship to the project
    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id', 'project_id');
    }

    // Relationship to get comments (where status = this message_id)
    public function comments()
    {
        return $this->hasMany(MessageModel::class, 'status', 'message_id')
            ->whereNotIn('status', ['todo', 'done']); // Comments have message_id in status field
    }

    // Relationship to get the parent remark (if this is a comment)
    public function parentRemark()
    {
        return $this->belongsTo(MessageModel::class, 'status', 'message_id');
    }
}