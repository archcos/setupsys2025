<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanyModel extends Model
{
    protected $table = 'tbl_companies';
    protected $primaryKey = 'company_id';
    public $timestamps = true;

    protected $fillable = [
        'company_name',
        'owner_name',
        'email',
        'added_by',
        'office_id',
        'street',
        'barangay',
        'municipality',
        'province',
        'district',
        'sex',
        'products',
        'setup_industry',
        'industry_type',
        'female',
        'male',
        'direct_male',
        'direct_female',
        'contact_number',
    ];

    // One company has many projects
    public function projects()
    {
        return $this->hasMany(ProjectModel::class, 'company_id', 'company_id');
    }

    // A company belongs to an office
    public function office()
    {
        return $this->belongsTo(OfficeModel::class, 'office_id', 'office_id');
    }

    // A company belongs to a user who added it
    public function addedByUser()
    {
        return $this->belongsTo(UserModel::class, 'added_by', 'user_id');
    }
}
