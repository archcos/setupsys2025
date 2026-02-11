<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class ComplianceModel extends Model
{
    use LogsActivity;
    protected $table = 'tbl_compliance';
    protected $primaryKey = 'compliance_id';
    protected $fillable = [
        'project_id',
        'pp_link', 'pp_link_date', 'pp_link_added_by',
        'fs_link', 'fs_link_date', 'fs_link_added_by',
        'status',
    ];

    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id');
    }
    
}