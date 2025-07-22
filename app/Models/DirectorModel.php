<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DirectorModel extends Model
{
    protected $table = 'tbl_directors';
    protected $primaryKey = 'director_id';

    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'title',
        'office_id',
    ];

}
