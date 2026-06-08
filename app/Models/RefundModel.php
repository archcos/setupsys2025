<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RefundModel extends Model
{
    use HasFactory;
    use LogsActivity {
        LogsActivity::generateDescription as traitGenerateDescription;
    }
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

    /**
     * Columns whose raw serialized value changes on every save even when the
     * decoded content is identical. The trait will do a deep comparison for
     * these instead of a simple !== check.
     */
    protected array $jsonAttributes = ['payments'];

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

    public function getStatusLabelAttribute(): string
    {
        return ucfirst($this->status);
    }

    // ── Computed helpers ──────────────────────────────────────────────────────

    public function getTotalPaidAttribute(): float
    {
        return (float) collect($this->payments ?? [])->sum('amount');
    }

    public function getLatestPaymentAttribute(): ?array
    {
        return collect($this->payments ?? [])->last();
    }

    // ── Mutators ──────────────────────────────────────────────────────────────

    public function appendPayment(array $payment): void
    {
        if (empty($payment['amount']) || (float) $payment['amount'] <= 0) {
            return;
        }

        $current = $this->payments ?? [];
        $current[] = array_merge([
            'amount' => 0,
            'bank_name' => null,
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

    // ── Logging overrides ─────────────────────────────────────────────────────

    /**
     * Produce a readable display name for log descriptions.
     */
    public function getDisplayName(): string
    {
        $month = $this->month_paid?->format('F Y') ?? "#{$this->getKey()}";

        return "Refund {$month}";
    }

    /**
     * Build a human-readable description that understands the payments JSON.
     */
    protected function generateDescription(
        string $action,
        ?array $before = null,
        ?array $after = null,
        ?int $userId = null,
        ?\DateTimeInterface $createdAt = null
    ): string {
        if ($action !== 'Updated') {
            return $this->traitGenerateDescription($action, $before, $after, $userId, $createdAt);
        }


        $parts = [];
        $after ??= [];
        $before ??= [];

        // ── payments JSON: describe what actually changed ──────────────────
        if (array_key_exists('payments', $after)) {
            $oldPayments = $before['payments'] ?? [];
            $newPayments = $after['payments'] ?? [];

            // Normalise: the trait stores the decoded array, but just in case
            // it arrives as a JSON string, decode it.
            $oldPayments = is_string($oldPayments) ? json_decode($oldPayments, true) : $oldPayments;
            $newPayments = is_string($newPayments) ? json_decode($newPayments, true) : $newPayments;

            $oldCount = count($oldPayments ?? []);
            $newCount = count($newPayments ?? []);

            $oldTotal = collect($oldPayments)->sum('amount');
            $newTotal = collect($newPayments)->sum('amount');

            if ($newCount > $oldCount) {
                $added = $newCount - $oldCount;
                $parts[] = "added {$added} payment(s), total ₱".number_format($newTotal, 2);
            } elseif ($newCount < $oldCount) {
                $removed = $oldCount - $newCount;
                $parts[] = "removed {$removed} payment(s), total ₱".number_format($newTotal, 2);
            } elseif ($oldTotal != $newTotal) {
                $parts[] = 'payments updated, total ₱'.number_format($newTotal, 2);
            }
            // If count and total are identical, skip — nothing meaningful changed
        }

        // ── scalar fields: delegate to parent logic ───────────────────────
        $scalarAfter = array_diff_key($after, ['payments' => true]);
        $scalarBefore = array_diff_key($before, ['payments' => true]);

    if (!empty($scalarAfter)) {
        $scalarDesc = $this->traitGenerateDescription(
            'Updated',
            $scalarBefore,
            $scalarAfter,
            null,
            null
        );

            // Extract just the changes portion (strip "Updated RefundModel …")
            // The parent format is: "Updated {Model} {name}: field1 (…), field2 (…)"
            if (preg_match('/: (.+)$/', $scalarDesc, $m)) {
                $parts[] = $m[1];
            }
        }

   if (empty($parts)) {
        return $this->traitGenerateDescription($action, $before, $after, $userId, $createdAt);
    }   

        $name = $this->getDisplayName();
        $userPart = $userId ? $this->resolveUserPartPublic($userId) : '';
        $timePart = $createdAt ? " on {$createdAt->format('Y-m-d H:i:s')}" : '';
        $changeStr = implode('; ', $parts);

        return "Updated Refund {$name}: {$changeStr}{$userPart}{$timePart}";
    }

    /**
     * Thin public wrapper so generateDescription() can call the trait's
     * private resolveUserPart() without reflection hacks.
     */
private function resolveUserPartPublic(?int $userId): string
{
    if (!$userId) {
        return '';
    }

    static $cache = [];

    if (!isset($cache[$userId])) {
        $user = UserModel::select(['user_id', 'first_name', 'middle_name', 'last_name'])->find($userId);
        $cache[$userId] = $user
            ? "{$user->user_id} - {$user->name}"
            : (string) $userId;
    }

    return " by {$cache[$userId]}";
}
}
