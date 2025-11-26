<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ImplementationModel extends Model
{
    protected $table = 'tbl_implements';
    protected $primaryKey = 'implement_id';
    public $timestamps = false; // Since you're managing timestamps manually

    protected $fillable = [
        'project_id',
        'tarp',
        'tarp_upload',
        'pdc',
        'pdc_upload',
        'liquidation',
        'liquidation_upload',
    ];

    protected $casts = [
        'tarp_upload' => 'datetime',
        'pdc_upload' => 'datetime',
        'liquidation_upload' => 'datetime',
    ];

    // Relationships
    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id', 'project_id');
    }

    public function tags()
    {
        return $this->hasMany(TagModel::class, 'implement_id', 'implement_id');
    }
}