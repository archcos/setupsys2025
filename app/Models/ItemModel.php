<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ItemModel extends Model
{
    use HasFactory;
    use LogsActivity;

    protected $table = 'tbl_items';

    protected $primaryKey = 'item_id';

    protected $fillable = [
        'project_id',
        'item_name',
        'specifications',
        'item_cost',
        'quantity',
        'type',
        'report'
    ];

    public $timestamps = true;


    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id');
    }
}
