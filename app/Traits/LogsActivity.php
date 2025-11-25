<?php

namespace App\Traits;

use App\Models\Log;
use App\Models\LogModel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log as FacadesLog;
use Illuminate\Support\Facades\Request;

trait LogsActivity
{
    protected static array $sensitiveAttributes = [
        'password',
        'password_confirmation',
        'api_key',
        'token',
        'secret',
        'credit_card',
        'ssn',
        'updated_at'
    ];

    protected static function boot()
    {
        parent::boot();

        static::created(function ($model) {
            $model->logActivity('Created', null, $model->getAttributes());
        });

        static::updated(function ($model) {
            $model->logActivity('Updated', $model->getOriginal(), $model->getChanges());
        });

        static::deleted(function ($model) {
            $model->logActivity('Deleted', $model->getAttributes(), null);
        });
    }

    protected function detectProjectId(): ?int
    {
        // Case 1: The model itself has a project_id column
        if ($this->getAttribute('project_id')) {
            return $this->getAttribute('project_id');
        }

        // Case 2: If the model itself IS a project, use its own ID
        if (str_contains(strtolower(class_basename($this)), 'project')) {
            return $this->getKey();
        }

        // Case 3: If model has relationship like $model->project->id (optional)
        if (method_exists($this, 'project') && $this->project()->exists()) {
            return $this->project->id ?? null;
        }

        return null;
    }

    /**
     * Filter out sensitive attributes from data
     */
    protected function filterSensitiveData(?array $data): ?array
    {
        if ($data === null) {
            return null;
        }

        return collect($data)
            ->reject(function ($value, $key) {
                return in_array(strtolower($key), self::$sensitiveAttributes, true);
            })
            ->toArray();
    }

    /**
     * Log an activity to the logs table
     *
     * @param string $action The action performed (Created, Updated, Deleted, etc.)
     * @param array|null $before The original attributes
     * @param array|null $after The new attributes
     * @param string|null $description Human-readable description
     */
    public function logActivity(
        string $action,
        ?array $before = null,
        ?array $after = null,
        ?string $description = null
    ): void {
        try {
            // For updates, only log the changed fields in 'before'
            if ($action === 'Updated' && $before && $after) {
                $changedFields = [];
                foreach ($after as $key => $value) {
                    if (isset($before[$key]) && $before[$key] !== $value) {
                        $changedFields[$key] = $before[$key];
                    }
                }
                $before = $changedFields ?: null;
            }

            // Filter sensitive data for all actions
            $beforeFiltered = $this->filterSensitiveData($before);
            $afterFiltered  = $this->filterSensitiveData($after);

            LogModel::create([
                'user_id'      => Auth::id(),
                'project_id'   => $this->detectProjectId(),
                'action'       => $action,
                'description'  => $description ?? $this->generateDescription(
                    $action,
                    $beforeFiltered,
                    $afterFiltered,
                    Auth::id(),
                    now()
                ),
                'model_type'   => get_class($this),
                'model_id'     => $this->getKey(),
                'before'       => $beforeFiltered,
                'after'        => $afterFiltered,
                'ip_address'   => Request::ip(),
                'user_agent'   => Request::userAgent(),
                'created_at'   => now(),
            ]);

        } catch (\Exception $e) {
            FacadesLog::error('Failed to log activity: ' . $e->getMessage());
        }
    }


    /**
     * Generate a human-readable description based on action
     * Override this method in your model for custom descriptions
     */
    protected function generateDescription(
        string $action,
        ?array $before = null,
        ?array $after = null,
        ?int $userId = null,
        ?\DateTimeInterface $createdAt = null
    ): string {
        $model = class_basename($this);
        $name = $this->getDisplayName();

        // Get the user's full name with ID
        $userPart = '';
        if ($userId) {
            $user = \App\Models\UserModel::find($userId);
            if ($user) {
                $userPart = " by {$user->user_id} - {$user->name}";
            } else {
                $userPart = " by {$userId}";
            }
        }

        $timePart = $createdAt ? " on {$createdAt->format('Y-m-d H:i:s')}" : '';

        // CREATED
        if ($action === 'Created') {
            return "Created new {$model}: {$name}{$userPart}{$timePart}";
        }

        // UPDATED: Show changed fields
        if ($action === 'Updated' && $before && $after) {
            $changes = [];
            foreach ($after as $field => $newValue) {
                if (isset($before[$field])) {
                    $oldValue = $before[$field];
                    if (is_numeric($oldValue) && is_numeric($newValue)) {
                        $oldValue = number_format($oldValue);
                        $newValue = number_format($newValue);
                    }
                    $changes[] = "{$field} ({$oldValue} → {$newValue})";
                }
            }

            $changesStr = !empty($changes) ? ': ' . implode(', ', $changes) : '';
            return "Updated {$model} {$name}{$changesStr}{$userPart}{$timePart}";
        }

        // DELETED
        if ($action === 'Deleted') {
            return "Deleted {$model}: {$name}{$userPart}{$timePart}";
        }

        return "{$action} {$model}: {$name}{$userPart}{$timePart}";
    }



    /**
     * Get a display name for the model
     * Override this method in your model to customize the display name
     * Default: tries common naming conventions
     */
    public function getDisplayName(): string
    {
        // Try common naming attributes in order
        $commonAttributes = [
            'name',
            'title',
            'company_name',
            'project_name',
            'user_name',
            'email',
            'subject',
        ];

        foreach ($commonAttributes as $attr) {
            if ($this->hasAttribute($attr) && !empty($this->getAttribute($attr))) {
                return $this->getAttribute($attr);
            }
        }

        // Fallback to ID if no display name found
        return "#{$this->getKey()}";
    }

    /**
     * Get logs related to this model
     */
    public function logs()
    {
        return LogModel::where('model_type', get_class($this))
            ->where('model_id', $this->getKey())
            ->latest()
            ->get();
    }

    /**
     * Manually log a custom action
     */
    public function manualLog(string $action, ?string $description = null): void
    {
        $this->logActivity($action, null, null, $description);
    }
    
}