<?php

namespace App\Http\Middleware;

use App\Mail\SecurityAlertMail;
use App\Models\LogModel;
use App\Models\BlockedIp;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogSuspiciousRequests
{
    protected $sqlInjectionPatterns = [
        '/(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bTRUNCATE\b|\bALTER\b|\bCREATE\b|\bEXEC\b|\bEXECUTE\b)/i',
        '/(\';|--|#|\/\*|\*\/|xp_|sp_)/i',
        '/(;|\|\||&&)/',
        '/(OR\s+1\s*=\s*1|AND\s+1\s*=\s*1)/i',
        '/(SLEEP|BENCHMARK|WAITFOR|DBMS_LOCK)/i',
    ];

    protected $xssPatterns = [
        '/<script[^>]*>.*?<\/script>/i',
        '/javascript:/i',
        '/\bon(?:error|click|load|mouseover|change|focus|blur|submit|input|key(?:down|up|press))\s*=/i',
        '/<iframe/i',
        '/<object/i',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $ip = $request->ip();

        // Check if IP is already blocked
        $blocked = BlockedIp::where('ip', $ip)->first();
        if ($blocked && $blocked->blocked_until && now()->lessThan($blocked->blocked_until)) {
            exit(); // Silently exit without returning anything
        }

        $suspiciousContent = null;
        $alertType = null;

        // Get all input data (query string + POST data)
        $allInput = $request->all();
        $queryString = $request->getQueryString() ?? '';

        // Check input values directly instead of JSON-encoded string
        $inputValues = $this->flattenArray($allInput);
        $allContent = implode(' ', $inputValues) . ' ' . $queryString;

        // Check for SQL Injection patterns
        foreach ($this->sqlInjectionPatterns as $pattern) {
            if (preg_match($pattern, $allContent)) {
                $suspiciousContent = $allContent;
                $alertType = 'SQL Injection Attempt';
                break;
            }
        }

        // Check for XSS patterns if not already flagged
        if (!$suspiciousContent) {
            foreach ($this->xssPatterns as $pattern) {
                if (preg_match($pattern, $allContent)) {
                    $suspiciousContent = $allContent;
                    $alertType = 'XSS Attack Attempt';
                    break;
                }
            }
        }

        // Log and block if suspicious content detected
        if ($suspiciousContent) {
            $blockDuration = 24; // hours

            try {
                // Block the IP
                BlockedIp::updateOrCreate(
                    ['ip' => $ip],
                    [
                        'blocked_until' => now()->addHours($blockDuration),
                        'reason' => $alertType,
                    ]
                );

                // Log the suspicious activity
                LogModel::create([
                    'user_id' => Auth::id(),
                    'action' => $alertType,
                    'description' => "Suspicious request detected: {$alertType}",
                    'model_type' => 'Security',
                    'model_id' => 0,
                    'before' => [
                        'method' => $request->method(),
                        'path' => $request->path(),
                        'query' => $queryString,
                    ],
                    'after' => null,
                    'ip_address' => $ip,
                    'user_agent' => $request->userAgent(),
                ]);

                // Send security alert email - IP is blocked
                Mail::to(config('security.alert_emails'))->send(
                    new SecurityAlertMail($alertType, [
                        'ip_address' => $ip,
                        'user_id' => Auth::id() ?? 'Guest',
                        'before' => [
                            'method' => $request->method(),
                            'path' => $request->path(),
                            'query' => $queryString,
                        ],
                        'user_agent' => $request->userAgent(),
                    ], true) // true = IP is blocked
                );

                Log::warning("BLOCKED - {$alertType} from IP: {$ip} - Blocked for {$blockDuration} hours");
            } catch (\Exception $e) {
                Log::error('Failed to log suspicious request: ' . $e->getMessage());
            }

            exit(); // Silently exit without returning anything
        }

        return $next($request);
    }

    /**
     * Flatten a multidimensional array into a single array of string values
     */
    protected function flattenArray($array): array
    {
        $result = [];

        array_walk_recursive($array, function ($value) use (&$result) {
            if (is_string($value)) {
                $result[] = $value;
            }
        });

        return $result;
    }
}