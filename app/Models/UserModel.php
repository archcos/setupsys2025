<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserModel extends Authenticatable
{
    use HasApiTokens, Notifiable;

    use SoftDeletes;
    protected $table = 'tbl_users';
    protected $primaryKey = 'user_id';
    protected $dates = ['deleted_at'];


    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'username',
        'email',
        'password',
        'office_id',
        'role',
        'status'
    ];

    protected $hidden = [
        'password',
    ];
    public function office()
{
    return $this->belongsTo(OfficeModel::class, 'office_id', 'office_id');
}

public function companies()
{
    return $this->hasMany(CompanyModel::class, 'added_by', 'user_id');
}

}


