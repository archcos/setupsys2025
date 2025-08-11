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

    public function implementation()
    {
        return $this->hasOne(ImplementationModel::class, 'project_id');
    }

    public function refunds()
    {
        return $this->hasMany(RefundModel::class, 'project_code', 'project_id');
    }
}
