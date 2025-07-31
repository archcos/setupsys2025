<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectModel extends Model
{
    protected $table = 'tbl_projects';
    protected $primaryKey = 'project_id';

    protected $fillable = [
        'project_id',
        'project_title',
        'company_id',
        'phase_one',
        'phase_two',
        'project_cost',
        'added_by',
        'progress',
        'year_obligated',
        'revenue',
        'net_income',
        'current_asset',
        'noncurrent_asset',
        'equity',
        'liability',
        'created_at',
        'updated_at',
    ];

    // Relationships

    // ✅ Each project belongs to a company
    public function company()
    {
        return $this->belongsTo(CompanyModel::class, 'company_id', 'company_id');
    }

    // ✅ Each project belongs to a user (added_by)
    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by', 'user_id');
    }

    // ✅ A project has many activities
    public function activities()
    {
        return $this->hasMany(ActivityModel::class, 'project_id', 'project_id');
    }

    // ✅ A project has many items (if applicable)
    public function items()
    {
        return $this->hasMany(ItemModel::class, 'project_id', 'project_id');
    }

    // ❌ Removed this:
    // public function office()
    // {
    //     return $this->hasMany(OfficeModel::class, 'office_id', 'office_id');
    // }
    // There’s **no office_id** column in `tbl_projects`, so this is incorrect unless added manually later.
}
