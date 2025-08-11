<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TagModel extends Model
{
    use HasFactory;

    protected $table = 'tbl_tags';
    protected $primaryKey = 'tag_id';
    public $timestamps = true; // Your table doesn't have created_at/updated_at

    protected $fillable = [
        'implement_id',
        'tag_name',
        'tag_amount',
    ];

    

    public function implement()
    {
        return $this->belongsTo(ImplementationModel::class, 'implement_id', 'implement_id');
    }
}
