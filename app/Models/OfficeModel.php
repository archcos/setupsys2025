<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfficeModel extends Model
{
    protected $table = 'tbl_offices';
    protected $primaryKey = 'office_id';
    protected $fillable = ['office_name'];
    
    public function director()
{
    return $this->hasOne(DirectorModel::class, 'office_id', 'office_id');
}

public function users()
{
    return $this->hasMany(UserModel::class, 'office_id', 'office_id');
}
}

