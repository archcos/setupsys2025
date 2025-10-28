<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DirectorModel extends Model
{
    protected $table = 'tbl_directors';
    protected $primaryKey = 'director_id';
    public $timestamps = false;

    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'title',
        'honorific',
        'office_id',
    ];

    public function setOfficeIdAttribute($value)
    {
        $this->attributes['office_id'] = empty($value) ? null : $value;
    }

    public function office()
    {
        return $this->belongsTo(OfficeModel::class, 'office_id', 'office_id');
    }
}
