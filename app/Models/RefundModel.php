<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RefundModel extends Model
{
    protected $table = 'tbl_refunds';
    protected $primaryKey = 'refund_id';

    protected $fillable = [
        'project_code',
        'company_name',
        'refund_date',
        'status',
    ];

    public $timestamps = true;

    public function project()
{
    return $this->belongsTo(ProjectModel::class, 'project_id', 'project_code');
}
}
