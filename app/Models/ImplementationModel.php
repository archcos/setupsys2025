<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ImplementationModel extends Model
{
    protected $table = 'tbl_implements';
    protected $primaryKey = 'implement_id';
    public $timestamps = false; // Since no created_at or updated_at

    protected $fillable = [
        'project_id',
        'tarp',
        'pdc',
        'liquidation',
    ];

    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id');
    }
        public function tags()
    {
        return $this->hasMany(TagModel::class, 'implement_id', 'implement_id');
    }
}
