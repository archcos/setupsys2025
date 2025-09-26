<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnnouncementModel extends Model
{
    protected $table = 'tbl_announces';
    protected $primaryKey = 'announce_id';
    public $timestamps = true;

    protected $fillable = [
        'title',
        'details',
        'office_id',
        'start_date',
        'end_date',
    ];

        public function office()
    {
        return $this->belongsTo(OfficeModel::class, 'office_id', 'office_id');
    }

}
