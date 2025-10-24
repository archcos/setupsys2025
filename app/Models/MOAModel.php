<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class MOAModel extends Model
{
    protected $table = 'tbl_moa';
    protected $primaryKey = 'moa_id';

    protected $fillable = [
        'project_id',
        'owner_name',
        'owner_position',
        'pd_name',
        'pd_title',
        'witness',
        'project_cost',
        'amount_words',
        'approved_file_path',
        'approved_file_uploaded_at',
        'approved_by'
    ];

    protected $casts = [
        'approved_file_uploaded_at' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id', 'project_id');
    }

    public function approvedByUser()
    {
        return $this->belongsTo(UserModel::class, 'approved_by', 'user_id');
    }

    public function hasApprovedFile(): bool
    {
        return !empty($this->approved_file_path) && Storage::disk('private')->exists($this->approved_file_path);
    }
}