<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ObjectiveModel extends Model
{
    use HasFactory;

    protected $table = 'tbl_objectives';
    protected $primaryKey = 'objective_id';
    public $timestamps = false;

    protected $fillable = [
        'project_id',
        'details',
        'report',
        'remarks'
    ];

    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id', 'project_id');
    }
}
