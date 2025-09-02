<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportModel extends Model
{
    use HasFactory;

    protected $table = 'tbl_reports';
    protected $primaryKey = 'report_id';

    protected $fillable = [
        'project_id',
        'actual_accom',
        'actual_remarks',
        'util_remarks',
        'new_male',
        'new_female',
        'new_ifmale',
        'new_iffemale',
        'new_ibmale',
        'new_ibfemale',
        'problems',
        'actions',
        'promotional',
    ];

    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id', 'project_id');
    }
}
