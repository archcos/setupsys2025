<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class AnnouncementModel extends Model
{
    use LogsActivity;
    protected $table = 'tbl_announces';
    protected $primaryKey = 'announce_id';
    public $timestamps = true;

    protected $fillable = [
        'title',
        'details',
        'office_id',
        'start_date',
        'end_date',
        'added_by',
    ];

    public function office()
    {
        return $this->belongsTo(OfficeModel::class, 'office_id', 'office_id');
    }

    public function addedBy()
    {
        return $this->belongsTo(UserModel::class, 'added_by', 'user_id');
    }

}
