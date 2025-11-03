<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RtecModel extends Model
{
    protected $table = 'tbl_rtecs';
    protected $primaryKey = 'rtec_id';
    public $timestamps = true;

    protected $fillable = [
        'project_id',
        'user_id',
        'progress',
        'schedule',
        'zoom_link',
    ];

    protected $casts = [
        'schedule' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the project that owns the RTEC record.
     */
    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id', 'project_id');
    }

    /**
     * Get the user assigned to this RTEC.
     */
    public function user()
    {
        return $this->belongsTo(UserModel::class, 'user_id', 'user_id');
    }
}