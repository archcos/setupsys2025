<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RefundModel extends Model
{
    use HasFactory;
    use LogsActivity;

    protected $table = 'tbl_refunds';
    protected $primaryKey = 'refund_id';
    public $timestamps = true;

    public const STATUS_PAID = 'paid';
    public const STATUS_UNPAID = 'unpaid';
    public const STATUS_RESTRUCTURED = 'restructured';
    public const STATUS_PARTIAL = 'partial';

    protected $fillable = [
        'project_id',
        'updated_by',
        'amount_due',
        'payments',
        'status',
        'month_paid',
    ];

    protected $casts = [
        'payments' => 'array',
        'amount_due' => 'decimal:2',
        'month_paid' => 'date',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function project()
    {
        return $this->belongsTo(ProjectModel::class, 'project_id', 'project_id');
    }

    public function editor()
    {
        return $this->belongsTo(UserModel::class, 'updated_by', 'user_id')
                    ->select(['user_id', 'first_name', 'middle_name', 'last_name']);
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    public function getStatusLabelAttribute()
    {
        return ucfirst($this->status);
    }

    // ── Computed helpers ──────────────────────────────────────────────────────

    public function getTotalPaidAttribute(): float
    {
        if (empty($this->payments)) {
            return 0;
        }

        return (float) collect($this->payments)->sum('amount');
    }

    public function getLatestPaymentAttribute(): ?array
    {
        if (empty($this->payments)) {
            return null;
        }

        return collect($this->payments)->last();
    }

    // ── Mutators ──────────────────────────────────────────────────────────────

    public function appendPayment(array $payment): void
    {
        // Never store a zero or empty payment entry
        if (empty($payment['amount']) || (float) $payment['amount'] <= 0) {
            return;
        }

        $current = $this->payments ?? [];
        $current[] = array_merge([
            'amount' => 0,
            'check_num' => null,
            'check_date' => null,
            'receipt_num' => null,
            'receipt_date' => null,
            'saved_at' => now()->toDateTimeString(),
        ], $payment);

        $this->payments = $current;
    }

    public function removePayment(int $index): void
    {
        $current = $this->payments ?? [];
        array_splice($current, $index, 1);
        $this->payments = array_values($current);
    }
}
