<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MessageModel extends Model
{
    protected $table = 'tbl_messages'; // THIS IS FOR THE REMARKS IN REVIEW AND APPROVAL
    protected $primaryKey = 'message_id';
    
    protected $fillable = [
        'project_id',
        'created_by',
        'subject',
        'message',
        'status'
    ];

    // Add this relationship
    public function user()
    {
        return $this->belongsTo(UserModel::class, 'created_by', 'user_id');
    }

    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id', 'project_id');
    }
}