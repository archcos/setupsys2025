<?php

// app/Models/MOAModel.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MOAModel extends Model
{
    protected $table = 'tbl_moa';
    protected $primaryKey = 'moa_id'; // explicitly set the new primary key

    protected $fillable = [
        'project_id',
        'owner_name',
        'owner_position',
        'pd_name',
        'pd_title',
        'witness',
        'project_cost',
        'amount_words',
        'acknowledge_at'
    ];

    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id', 'project_id');
    }
}

