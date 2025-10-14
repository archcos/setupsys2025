<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavedDeviceModel extends Model
{
    protected $table = 'tbl_saveddevices';
    protected $primaryKey = 'id';
    protected $fillable = [
        'user_id',
        'device_mac',
        'device_name',
        'device_fingerprint',
        'ip_address',
    ];

    public function user()
    {
        return $this->belongsTo(UserModel::class, 'user_id', 'user_id');
    }
}
