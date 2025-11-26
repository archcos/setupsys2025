<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class ImplementationModel extends Model
{
    use LogsActivity;

    protected $table = 'tbl_implements';
    protected $primaryKey = 'implement_id';
    public $timestamps = false;

    protected $fillable = [
        'project_id',
        'tarp',
        'tarp_upload',
        'tarp_by',
        'pdc',
        'pdc_upload',
        'pdc_by',
        'liquidation',
        'liquidation_upload',
        'liquidation_by'
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

    // User relationships for file uploads
    public function tarpUploadedBy()
    {
        return $this->belongsTo(UserModel::class, 'tarp_by', 'user_id');
    }

    public function pdcUploadedBy()
    {
        return $this->belongsTo(UserModel::class, 'pdc_by', 'user_id');
    }

    public function liquidationUploadedBy()
    {
        return $this->belongsTo(UserModel::class, 'liquidation_by', 'user_id');
    }
}