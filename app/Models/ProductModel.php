<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductModel extends Model
{
    use HasFactory;

    protected $table = 'tbl_products';
    protected $primaryKey = 'product_id';
    public $timestamps = false; // since your table has no created_at/updated_at

    protected $fillable = [
        'report_id',
        'product_name',
        'volume',
        'quarter',
        'gross_sales',
    ];

    // Relationship: each product belongs to a report
    public function report()
    {
        return $this->belongsTo(ReportModel::class, 'report_id', 'report_id');
    }
}
