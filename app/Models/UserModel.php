<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserModel extends Authenticatable
{
    use HasApiTokens, Notifiable, SoftDeletes;
    use LogsActivity;

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

    protected $appends = ['name'];

    public function getNameAttribute()
    {
        $middleInitial = $this->middle_name ? strtoupper(substr($this->middle_name, 0, 1)) . '.' : '';
        return trim("{$this->first_name} {$middleInitial} {$this->last_name}");
    }

    public function office()
    {
        return $this->belongsTo(OfficeModel::class, 'office_id', 'office_id');
    }

    public function companies()
    {
        return $this->hasMany(CompanyModel::class, 'added_by', 'user_id');
    }

    /**
     * Define which attributes should NOT be logged for users
     */
    protected function getExcludedAttributes(): array
    {
        return array_merge(parent::getExcludedAttributes(), [
            'password',
            'remember_token',
            'deleted_at', // Don't log soft delete timestamp
        ]);
    }

    /**
     * Custom display name for logs
     */
    public function getDisplayName(): string
    {
        return $this->name; // Uses the computed 'name' attribute
    }
}