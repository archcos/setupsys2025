<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class ApplyRestructModel extends Model
{
    use LogsActivity;
    protected $table = 'tbl_apply_restruct';
    protected $primaryKey = 'apply_id';
    public $timestamps = true;

    protected $fillable = [
        'project_id',
        'added_by',
        'proponent',
        'psto',
        'annexc',
        'annexd',
    ];

    // // Add this to append status to JSON
    // protected $appends = ['status'];

    /**
     * Relationship: Each apply restructure belongs to one project.
     */
    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id', 'project_id');
    }

    /**
     * Relationship: The user who added this apply restructure.
     */
    public function addedBy()
    {
        return $this->belongsTo(UserModel::class, 'added_by', 'user_id');
    }

    /**
     * Relationship: Get the latest restructure (singular - for direct access)
     */
    public function restructure()
    {
        return $this->hasOne(RestructureModel::class, 'apply_id', 'apply_id')->latest();
    }

    /**
     * Relationship: Get all restructures related to this apply restruct via apply_id
     */
    public function restructures()
    {
        return $this->hasMany(RestructureModel::class, 'apply_id', 'apply_id');
    }

    /**
     * Get the latest restructure status
     */
    public function getStatusAttribute()
    {
        // Check if restructure relationship is loaded
        if ($this->relationLoaded('restructure')) {
            $latestRestructure = $this->restructure;
            return $latestRestructure ? $latestRestructure->status : 'pending';
        }
        
        // If not loaded, query it
        $latestRestructure = $this->restructure()->first();
        return $latestRestructure ? $latestRestructure->status : 'pending';
    }

    /**
     * Check if the application is approved
     */
    public function isLocked()
    {
        if ($this->relationLoaded('restructures')) {
            $latestRestructure = $this->restructures->first();
        } else {
            $latestRestructure = $this->restructures()->latest()->first();
        }
        
        if (!$latestRestructure) {
            return false;
        }
        
        $lockedStatuses = ['recommended', 'approved'];
        return in_array(strtolower($latestRestructure->status), $lockedStatuses);
    }

    /**
     * Get the latest status
     */
    public function getLatestStatusAttribute()
    {
        if ($this->relationLoaded('restructures')) {
            $latestRestructure = $this->restructures->first();
        } else {
            $latestRestructure = $this->restructures()->latest()->first();
        }
        
        return $latestRestructure ? $latestRestructure->status : 'pending';
    }
}