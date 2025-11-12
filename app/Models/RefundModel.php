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

    // Define valid status values
    const STATUS_PAID = 'paid';
    const STATUS_UNPAID = 'unpaid';
    const STATUS_RESTRUCTURED = 'restructured';

    // Rename relation to project for clarity
    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id', 'project_id');
    }

    // Optional: Add a scope to filter by status
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    // Optional: Add accessor to get formatted status
    public function getStatusLabelAttribute()
    {
        return ucfirst($this->status);
    }
}