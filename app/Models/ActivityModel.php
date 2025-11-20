<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class ActivityModel extends Model
{
    use LogsActivity;
    protected $table = 'tbl_activities';
    protected $primaryKey = 'activity_id';
    public $timestamps = true;

    protected $fillable = [
        'project_id',
        'activity_name',
        'start_date',
        'end_date',
    ];

    // Relationship: One activity belongs to one project
    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id', 'project_id');
    }
}
