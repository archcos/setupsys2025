<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TagModel extends Model
{
    use HasFactory;
    use LogsActivity;

    protected $table = 'tbl_tags';
    protected $primaryKey = 'tag_id';
    public $timestamps = true; // Enables created_at/updated_at

    protected $fillable = [
        'implement_id',
        'tag_name',
        'tag_amount',
        'created_at', // Add to fillable for mass assignment
    ];

    // Optional: Cast created_at as datetime for easier manipulation
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function implement()
    {
        return $this->belongsTo(ImplementationModel::class, 'implement_id', 'implement_id');
    }
}