<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectModel extends Model
{
    protected $table = 'tbl_projects';
    protected $primaryKey = 'project_id';
    public $timestamps = false;

    protected $fillable = [
        'project_title',
        'company_id',
        'phase_one',
        'phase_two',
        'project_cost',
    ];

    // Relationship: One project belongs to one company
    public function company()
    {
        return $this->belongsTo(CompanyModel::class, 'company_id', 'company_id');
    }

    // Relationship: One project has many activities
    public function activities()
    {
        return $this->hasMany(ActivityModel::class, 'project_id', 'project_id');
    }
}
