<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoanModel extends Model
{
    use HasFactory;

    protected $table = 'tbl_loans';
    protected $primaryKey = 'loan_id';
    public $timestamps = true;

    protected $fillable = [
        'refund_amount',
        'status',
        'project_id',
        'month_paid'
    ];

    // Rename relation to project for clarity
    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id', 'project_id');
    }
}
