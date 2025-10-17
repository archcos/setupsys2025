<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectModel extends Model
{
    protected $table = 'tbl_projects';
    protected $primaryKey = 'project_id';

    protected $fillable = [
        'project_id',
        'project_title',
        'company_id',
        'release_initial',
        'release_end',
        'refund_initial',
        'refund_end',
        'project_cost',
        'refund_amount',
        'last_refund',
        'added_by',
        'progress',
        'year_obligated',
        'revenue',
        'net_income',
        'current_asset',
        'noncurrent_asset',
        'equity',
        'liability',
        'created_at',
        'updated_at',
    ];

        public function setReleaseInitialAttribute($value)
    {
        $this->attributes['release_initial'] = $value ? $value . '-01' : null;
    }

    public function setReleaseEndAttribute($value)
    {
        $this->attributes['release_end'] = $value ? $value . '-01' : null;
    }

    public function setRefundInitialAttribute($value)
    {
        $this->attributes['refund_initial'] = $value ? $value . '-01' : null;
    }

    public function setRefundEndAttribute($value)
    {
        $this->attributes['refund_end'] = $value ? $value . '-01' : null;
    }

    public function company()
    {
        return $this->belongsTo(CompanyModel::class, 'company_id', 'company_id');
    }

    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by', 'user_id');
    }

    public function activities()
    {
        return $this->hasMany(ActivityModel::class, 'project_id', 'project_id');
    }

    public function items()
    {
        return $this->hasMany(ItemModel::class, 'project_id', 'project_id');
    }

    public function implementation()
    {
        return $this->hasOne(ImplementationModel::class, 'project_id');
    }

        public function refunds()
    {
        return $this->hasMany(RefundModel::class, 'project_id', 'project_id');
    }

    public function objectives()
    {
        return $this->hasMany(ObjectiveModel::class, 'project_id', 'project_id');
    }

    public function markets()
    {
        return $this->hasMany(MarketModel::class, 'project_id', 'project_id');
    }

    public function reports()
    {
        return $this->hasMany(ReportModel::class, 'project_id', 'project_id');
    }
    public function messages()
    {
        return $this->hasMany(MessageModel::class, 'project_id', 'project_id')->latest();
    }
}
