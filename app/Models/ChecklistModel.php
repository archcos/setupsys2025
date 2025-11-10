<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChecklistModel extends Model
{
    protected $table = 'tbl_checklist';
    protected $primaryKey = 'checklist_id';
    protected $fillable = [
        'project_id',
        'link_1', 'link_1_date', 'link_1_added_by',
        'link_2', 'link_2_date', 'link_2_added_by',
        'link_3', 'link_3_date', 'link_3_added_by',
        'link_4', 'link_4_date', 'link_4_added_by',
    ];

    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id');
    }
    
}
