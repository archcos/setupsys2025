<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanyModel extends Model
{
    protected $table = 'tbl_companies';
    protected $primaryKey = 'company_id';
    public $timestamps = false;

    protected $fillable = [
        'company_name',
        'owner_fname',
        'owner_lname',
        'owner_mname',
        'company_location',
    ];

    // Relationship: One company has many projects
    public function projects()
    {
        return $this->hasMany(ProjectModel::class, 'company_id', 'company_id');
    }
}
