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

            LogModel::create([
                'user_id' => Auth::id(),
                'action' => $action,
                'description' => $description ?? $this->generateDescription($action),
                'model_type' => get_class($this),
                'model_id' => $this->getKey(),
                'before' => $this->filterSensitiveData($before),
                'after' => $this->filterSensitiveData($after),
                'ip_address' => Request::ip(),
                'user_agent' => Request::userAgent(),
            ]);
        } catch (\Exception $e) {
            // Log error silently to prevent breaking the application
            FacadesLog::error('Failed to log activity: ' . $e->getMessage());
        }
    }

    /**
     * Generate a human-readable description based on action
     * Override this method in your model for custom descriptions
     */
    protected function generateDescription(string $action): string
    {
        $modelName = class_basename($this);
        $displayName = $this->getDisplayName();

        return match ($action) {
            'Created' => "{$modelName} \"{$displayName}\" was created",
            'Updated' => "{$modelName} \"{$displayName}\" was updated",
            'Deleted' => "{$modelName} \"{$displayName}\" was deleted",
            default => "{$modelName} \"{$displayName}\" - {$action}",
        };
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