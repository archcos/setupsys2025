<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class ProjectModel extends Model
{
    use LogsActivity;

    protected $table = 'tbl_projects';
    protected $primaryKey = 'project_id';
    public $timestamps = true; // Ensure this is true (default)
    public $incrementing = false;  // Important!
    protected $keyType = 'bigInteger';
    protected $fillable = [
        'project_id',
        'project_title',
        'company_id',
        'fund_release',
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
        'female',
        'male',
        'direct_male',
        'direct_female',
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
        return $this->belongsTo(UserModel::class, 'added_by', 'user_id');
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

    public function rtecs()
    {
        return $this->hasMany(RtecModel::class, 'project_id', 'project_id');
    }
    public function compliance()
    {
        return $this->hasOne(ComplianceModel::class, 'project_id');
    }

        public function applyRestructs()
    {
        return $this->hasMany(ApplyRestructModel::class, 'project_id', 'project_id');
    }

    public function checkRefundCompletion(){
        if (!$this->refund_initial || !$this->refund_end) {
            return [
                'is_complete' => false,
                'unpaid_months' => []
            ];
        }

        $refundInitial = Carbon::parse($this->refund_initial);
        $refundEnd = Carbon::parse($this->refund_end);

        $unPaidMonths = [];
        $current = $refundInitial->copy();

        // Iterate through each month from refund_initial to refund_end
        // Using lessThanOrEqualTo instead of isSameOrBefore
        while ($current->lessThanOrEqualTo($refundEnd)) {
            $monthDate = $current->format('Y-m-d');
            
            $refund = $this->refunds()
                ->where('month_paid', $monthDate)
                ->first();

            // Check if refund exists and status is 'paid'
            if (!$refund || $refund->status !== 'paid') {
                $unPaidMonths[] = $current->format('F Y');
            }

            $current->addMonth();
        }

        return [
            'is_complete' => empty($unPaidMonths),
            'unpaid_months' => $unPaidMonths
        ];
    }

    /**
     * Check refund completion including a new refund entry that hasn't been saved yet
     * This is used before saving to check if completion would be achieved
     */
    public function checkRefundCompletionWithNewEntry($newMonthDate, $newStatus){
        if (!$this->refund_initial || !$this->refund_end) {
            return [
                'is_complete' => false,
                'unpaid_months' => []
            ];
        }

        $refundInitial = Carbon::parse($this->refund_initial);
        $refundEnd = Carbon::parse($this->refund_end);

        $unPaidMonths = [];
        $current = $refundInitial->copy();

        // Iterate through each month from refund_initial to refund_end
        // Using lessThanOrEqualTo instead of isSameOrBefore
        while ($current->lessThanOrEqualTo($refundEnd)) {
            $monthDate = $current->format('Y-m-d');
            
            $refund = $this->refunds()
                ->where('month_paid', $monthDate)
                ->first();

            // If this is the new entry being saved, check its status
            if ($monthDate === $newMonthDate) {
                if ($newStatus !== 'paid') {
                    $unPaidMonths[] = $current->format('F Y');
                }
            } else {
                // Check existing refunds
                if (!$refund || $refund->status !== 'paid') {
                    $unPaidMonths[] = $current->format('F Y');
                }
            }

            $current->addMonth();
        }

        return [
            'is_complete' => empty($unPaidMonths),
            'unpaid_months' => $unPaidMonths
        ];
    }

    public function checkRefundCompletionWithBulkUpdate($monthsBeingUpdated, $newStatus)
    {
        $refundInitial = Carbon::parse($this->refund_initial)->startOfMonth();
        $refundEnd = Carbon::parse($this->refund_end)->startOfMonth();
        
        $unpaidMonths = [];
        
        // Generate all months in the range
        $current = $refundInitial->copy();
        while ($current <= $refundEnd) {
            $monthKey = $current->format('Y-m-d');
            
            // Check if this month is being updated to paid status
            if (in_array($monthKey, $monthsBeingUpdated) && $newStatus === 'paid') {
                // This month will be marked as paid
                $current->addMonth();
                continue;
            }
            
            // Check if this month already has a paid refund
            $refund = $this->refunds()
                ->where('month_paid', $monthKey)
                ->first();
            
            if (!$refund || $refund->status !== 'paid') {
                // This month is not paid
                $unpaidMonths[] = $current->format('F Y');
            }
            
            $current->addMonth();
        }
        
        return [
            'is_complete' => empty($unpaidMonths),
            'unpaid_months' => $unpaidMonths,
        ];
    }

}
