<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogModel extends Model
{
    protected $table = 'tbl_logs';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'project_id',
        'action',
        'description',
        'model_type',
        'model_id',
        'before',
        'after',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'before' => 'array',
        'after' => 'array',
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(UserModel::class, 'user_id', 'user_id');
    }

    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id', 'project_id');
    }

    // Prevent Editing Logs
    public function save(array $options = [])
    {
        // Only allow creation, block updates
        if ($this->exists) {
            throw new \Exception("Logs cannot be modified once created.");
        }

        return parent::save($options);
    }
}