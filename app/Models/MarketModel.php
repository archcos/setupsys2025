<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MarketModel extends Model
{
    use HasFactory;

    protected $table = 'tbl_markets';
    protected $primaryKey = 'market_id';
    public $timestamps = false;

    protected $fillable = [
        'project_id',
        'place_name',
        'effective_date',
        'type'
    ];

    // Relationships
    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id', 'project_id');
    }
}
