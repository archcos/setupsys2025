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

    // A project belongs to a company
    public function company()
    {
        return $this->belongsTo(CompanyModel::class, 'company_id', 'company_id');
    }

    // A project has many activities
    public function activities()
    {
        return $this->hasMany(ActivityModel::class, 'project_id', 'project_id');
    }

    public function items()
    {
        return $this->hasMany(ItemModel::class, 'project_id', 'project_id');
    }
}
