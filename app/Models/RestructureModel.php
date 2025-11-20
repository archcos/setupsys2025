<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class RestructureModel extends Model
{
    use LogsActivity;
    protected $table = 'tbl_restructures';
    protected $primaryKey = 'restruct_id';
    public $timestamps = true;

    protected $fillable = [
        'project_id',
        'apply_id',
        'added_by',
        'type',
        'status',
        'remarks',
        'restruct_start',
        'restruct_end',
    ];

    protected $casts = [
        'restruct_amount' => 'decimal:2',
    ];

    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id', 'project_id');
    }

    public function addedBy()
    {
        return $this->belongsTo(UserModel::class, 'added_by', 'user_id');
    }

    public function updates()
{
    return $this->hasMany(RestructureUpdateModel::class, 'restruct_id', 'restruct_id');
}

public function applyRestruct()
{
    return $this->belongsTo(ApplyRestructModel::class, 'apply_id', 'apply_id');
}
}