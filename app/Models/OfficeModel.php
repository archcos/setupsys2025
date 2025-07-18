<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfficeModel extends Model
{
    protected $table = 'tbl_offices';
    protected $primaryKey = 'office_id';
    protected $fillable = ['office_name'];
}
