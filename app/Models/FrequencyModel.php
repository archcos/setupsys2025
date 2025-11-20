<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FrequencyModel extends Model
{
    use HasFactory;
    use LogsActivity;

    protected $table = 'tbl_login_frequencies';

    protected $fillable = [
        'user_id',
        'office_id',
        'login_date',
        'login_count',
    ];

    public function user()
    {
        return $this->belongsTo(UserModel::class, 'user_id', 'user_id');
    }

    public function office()
    {
        return $this->belongsTo(OfficeModel::class, 'office_id', 'office_id');
    }
}
