<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RefundModel extends Model
{
    use HasFactory;

    protected $table = 'tbl_refunds';
    protected $primaryKey = 'refund_id';
    public $timestamps = true;

    protected $fillable = [
        'refund_amount',
        'status',
        'project_id',
        'month_paid',
        'amount_due',
        'check_num',
        'receipt_num'
    ];

    // Rename relation to project for clarity
    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id', 'project_id');
    }
}
