<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApplyRestructModel extends Model
{
    protected $table = 'tbl_apply_restruct';
    protected $primaryKey = 'apply_id';
    public $timestamps = true;

    protected $fillable = [
        'project_id',
        'added_by',
        'proponent',
        'psto',
        'annexc',
        'annexd',
    ];

    /**
     * Relationship: Each apply restructure belongs to one project.
     */
    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id', 'project_id');
    }

    /**
     * Relationship: The user who added this apply restructure.
     */
    public function addedBy()
    {
        return $this->belongsTo(UserModel::class, 'added_by', 'user_id');
    }

    public function restructures()
    {
        return $this->hasMany(RestructureModel::class, 'project_id', 'project_id');
    }
}
