<?php

namespace App\Traits;

use App\Models\LogModel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log as FacadesLog;
use Illuminate\Support\Facades\Request;

trait LogsActivity
{
    /**
     * Sensitive fields never written to the log table.
     * Models can extend this by defining $extraSensitiveAttributes.
     */
    protected static array $sensitiveAttributes = [
        'password',
        'password_confirmation',
        'api_key',
        'token',
        'secret',
        'credit_card',
        'ssn',
    ];

    /**
     * Fields that change on almost every save but carry no audit value.
     */
    protected static array $ignoredAttributes = [
        'updated_at',
        'last_seen_at',
        'remember_token',
        'login_count',
    ];

    /**
     * JSON columns that Laravel may falsely flag as changed because it compares
     * serialized strings. The trait deep-compares these before logging.
     *
     * Override in your model:
     *   protected array $jsonAttributes = ['payments', 'metadata'];
     */
    // protected array $jsonAttributes = [];

    /**
     * Runtime registry of model classes that have been disabled via disableLogging().
     * Keyed by fully-qualified class name. No property declaration needed on models.
     */
    private static array $disabledModels = [];

    private const MAX_CHANGES_IN_DESCRIPTION = 5;

    // -------------------------------------------------------------------------
    // Logging toggle (safe to call without declaring a property on the model)
    // -------------------------------------------------------------------------

    public static function disableLogging(): void
    {
        self::$disabledModels[static::class] = true;
    }

    public static function enableLogging(): void
    {
        unset(self::$disabledModels[static::class]);
    }

    // -------------------------------------------------------------------------
    // Boot
    // -------------------------------------------------------------------------

    protected static function boot(): void
    {
        parent::boot();

        static::created(function ($model) {
            if (!static::loggingEnabled()) {
                return;
            }
            $model->logActivity('Created', null, $model->getAttributes());
        });

        static::updated(function ($model) {
            if (!static::loggingEnabled()) {
                return;
            }

            $changes = $model->getChanges();
            $original = $model->getOriginal();

            // Remove noise columns first
            $meaningful = array_diff_key(
                $changes,
                array_flip(array_merge(static::$ignoredAttributes, ['updated_at']))
            );

            if (empty($meaningful)) {
                return;
            }

            // Deep-compare JSON columns: remove them from $meaningful when the
            // decoded content is identical (Laravel flags them changed because
            // the serialized string differs even for equal values).
            $jsonColumns = $model->jsonAttributes ?? [];
            foreach ($jsonColumns as $col) {
                if (!array_key_exists($col, $meaningful)) {
                    continue;
                }

                $oldDecoded = is_string($original[$col] ?? null)
                    ? json_decode($original[$col], true)
                    : ($original[$col] ?? null);

                $newDecoded = is_string($changes[$col] ?? null)
                    ? json_decode($changes[$col], true)
                    : ($model->getAttribute($col) ?? null);

                if ($oldDecoded === $newDecoded) {
                    unset($meaningful[$col]);
                }
            }

            if (empty($meaningful)) {
                return;
            }

            // For the 'before' snapshot, pass the decoded version of JSON
            // columns so descriptions and before/after diffs are readable.
            $originalNormalized = $original;
            foreach ($jsonColumns as $col) {
                if (isset($originalNormalized[$col]) && is_string($originalNormalized[$col])) {
                    $originalNormalized[$col] = json_decode($originalNormalized[$col], true);
                }
            }

            // Replace raw JSON strings in $meaningful with decoded arrays too
            $meaningfulNormalized = $meaningful;
            foreach ($jsonColumns as $col) {
                if (array_key_exists($col, $meaningfulNormalized)) {
                    $meaningfulNormalized[$col] = $model->getAttribute($col);
                }
            }

            $model->logActivity('Updated', $originalNormalized, $meaningfulNormalized);
        });

        static::deleted(function ($model) {
            if (!static::loggingEnabled()) {
                return;
            }
            $model->logActivity('Deleted', $model->getAttributes(), null);
        });
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    public function logActivity(
        string $action,
        ?array $before = null,
        ?array $after = null,
        ?string $description = null
    ): void {
        $userId = Auth::id();
        $projectId = $this->detectProjectId();
        $modelType = get_class($this);
        $modelId = $this->getKey();
        $ip = Request::ip();
        $ua = Request::userAgent();
        $now = now();

        if ($action === 'Updated' && $before && $after) {
            $before = array_intersect_key($before, $after);
        }

        $beforeFiltered = $this->filterIgnoredData($this->filterSensitiveData($before));
        $afterFiltered = $this->filterIgnoredData($this->filterSensitiveData($after));

        $desc = $description ?? $this->generateDescription(
            $action,
            $beforeFiltered,
            $afterFiltered,
            $userId,
            $now
        );

        $payload = [
            'user_id' => $userId,
            'project_id' => $projectId,
            'action' => $action,
            'description' => $desc,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'before' => $beforeFiltered,
            'after' => $afterFiltered,
            'ip_address' => $ip,
            'user_agent' => $ua,
            'created_at' => $now,
        ];

        $this->writeLog($payload);
    }

    public function manualLog(string $action, ?string $description = null): void
    {
        $this->logActivity($action, null, null, $description);
    }

    public function activityLogs()
    {
        return LogModel::where('model_type', get_class($this))
            ->where('model_id', $this->getKey())
            ->latest('created_at')
            ->get();
    }

    public function getDisplayName(): string
    {
        foreach (['name', 'title', 'company_name', 'project_name', 'user_name', 'email', 'subject'] as $attr) {
            if ($this->hasAttribute($attr) && !empty($this->getAttribute($attr))) {
                return (string) $this->getAttribute($attr);
            }
        }

        return "#{$this->getKey()}";
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    private function writeLog(array $payload): void
    {
        try {
            LogModel::create($payload);
        } catch (\Throwable $e) {
            FacadesLog::error('LogsActivity: failed to write log entry', [
                'error' => $e->getMessage(),
                'model_type' => $payload['model_type'] ?? null,
                'model_id' => $payload['model_id'] ?? null,
                'action' => $payload['action'] ?? null,
            ]);
        }
    }

    private static function loggingEnabled(): bool
    {
        return !isset(self::$disabledModels[static::class]);
    }

    protected function detectProjectId(): ?int
    {
        $pid = $this->getAttribute('project_id');
        if ($pid) {
            return (int) $pid;
        }

        if (str_contains(strtolower(class_basename($this)), 'project')) {
            return (int) $this->getKey();
        }

        if (method_exists($this, 'project') && $this->relationLoaded('project')) {
            return $this->project->id ?? null;
        }

        return null;
    }

    protected function filterSensitiveData(?array $data): ?array
    {
        if ($data === null) {
            return null;
        }

        $sensitive = array_merge(
            static::$sensitiveAttributes,
            property_exists($this, 'extraSensitiveAttributes') ? $this->extraSensitiveAttributes : []
        );

        return collect($data)
            ->reject(fn ($v, $key) => in_array(strtolower($key), $sensitive, true))
            ->toArray();
    }

    protected function filterIgnoredData(?array $data): ?array
    {
        if ($data === null) {
            return null;
        }

        return collect($data)
            ->reject(fn ($v, $key) => in_array($key, static::$ignoredAttributes, true))
            ->toArray();
    }

    protected function generateDescription(
        string $action,
        ?array $before = null,
        ?array $after = null,
        ?int $userId = null,
        ?\DateTimeInterface $createdAt = null
    ): string {
        $model = class_basename($this);
        $name = $this->getDisplayName();
        $userPart = $this->resolveUserPart($userId);
        $timePart = $createdAt ? " on {$createdAt->format('Y-m-d H:i:s')}" : '';

        return match ($action) {
            'Created' => "Created new {$model}: {$name}{$userPart}{$timePart}",
            'Deleted' => "Deleted {$model}: {$name}{$userPart}{$timePart}",
            'Updated' => $this->buildUpdateDescription($model, $name, $before, $after, $userPart, $timePart),
            default => "{$action} {$model}: {$name}{$userPart}{$timePart}",
        };
    }

    private function buildUpdateDescription(
        string $model,
        string $name,
        ?array $before,
        ?array $after,
        string $userPart,
        string $timePart
    ): string {
        $changes = [];
        $jsonCols = $this->jsonAttributes ?? [];

        if ($before && $after) {
            foreach ($after as $field => $newValue) {
                if (!array_key_exists($field, $before)) {
                    continue;
                }

                $oldValue = $before[$field];

                // For JSON columns, show a count/summary instead of raw JSON
                if (in_array($field, $jsonCols, true)) {
                    $oldCount = is_array($oldValue) ? count($oldValue) : 0;
                    $newCount = is_array($newValue) ? count($newValue) : 0;
                    $changes[] = "{$field} ({$oldCount} entries → {$newCount} entries)";
                    continue;
                }

                if (is_numeric($oldValue) && is_numeric($newValue)) {
                    $oldValue = number_format((float) $oldValue);
                    $newValue = number_format((float) $newValue);
                }

                $changes[] = "{$field} ({$this->truncateValue($oldValue)} → {$this->truncateValue($newValue)})";
            }
        }

        $shown = array_slice($changes, 0, self::MAX_CHANGES_IN_DESCRIPTION);
        $overflow = count($changes) - count($shown);
        $changesStr = !empty($shown)
            ? ': '.implode(', ', $shown).($overflow > 0 ? " (+{$overflow} more)" : '')
            : '';

        return "Updated {$model} {$name}{$changesStr}{$userPart}{$timePart}";
    }

    private function resolveUserPart(?int $userId): string
    {
        if (!$userId) {
            return '';
        }

        static $cache = [];

        if (!isset($cache[$userId])) {
            $user = \App\Models\UserModel::select(['user_id', 'first_name', 'middle_name', 'last_name'])
                ->find($userId);
            $cache[$userId] = $user
                ? "{$user->user_id} - {$user->name}"  // ->name triggers the appended accessor
                : (string) $userId;
        }

        return " by {$cache[$userId]}";
    }

    private function truncateValue(mixed $value, int $max = 60): string
    {
        if (is_array($value) || is_object($value)) {
            return '[complex value]';
        }

        $str = (string) $value;

        return mb_strlen($str) > $max ? mb_substr($str, 0, $max).'…' : $str;
    }
}
