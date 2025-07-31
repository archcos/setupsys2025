<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationModel extends Model
{
    protected $table = 'tbl_notifications';
    protected $primaryKey = 'notification_id';

    protected $fillable = [
        'title',
        'message',
        'office_id',
        'is_read',
        'company_id'
    ];

    public function office()
    {
        return $this->belongsTo(OfficeModel::class, 'office_id');
    }
}
