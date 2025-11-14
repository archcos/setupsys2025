<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RestructureUpdateModel extends Model
{
    use HasFactory;

    protected $table = 'tbl_restructure_update';
    protected $primaryKey = 'update_id';

    protected $fillable = [
        'restruct_id',
        'update_start',
        'update_end',
        'update_amount',
    ];

    // Relationship: belongs to a restructure
    public function restructure()
    {
        return $this->belongsTo(RestructureModel::class, 'restruct_id', 'restruct_id');
    }
}
