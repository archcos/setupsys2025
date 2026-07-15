<?php

namespace App\Http\Middleware;

use App\Mail\SecurityAlertMail;
use App\Models\BlockedIp;
use App\Models\LogModel;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\HttpFoundation\Response;

class LogSuspiciousRequests
{
    protected $sqlInjectionPatterns = [
        // Only match SQL keywords as complete words, not substrings
        '/\b(UNION\s+SELECT|SELECT\s+.*\s+FROM|INSERT\s+INTO|UPDATE\s+.*\s+SET|DELETE\s+FROM|DROP\s+(TABLE|DATABASE)|TRUNCATE\s+TABLE|ALTER\s+(TABLE|DATABASE)|CREATE\s+(TABLE|DATABASE)|EXEC(\s|\(|UTE?\()) /ix',
        // SQL comment/delimiter injection
        '/(\';|--\s|#|\/\*|\*\/|xp_|sp_)/i',
        // Logical operators used for SQL injection (only when in suspicious context)
        '/\b(AND|OR)\b\s*(\'|"|\d+)\s*=\s*(\'|"|\d+)/i',
        // Time-based injection patterns (only as complete words)
        '/\b(SLEEP\s*\(|BENCHMARK\s*\(|WAITFOR\s+DELAY|DBMS_LOCK\.SLEEP\s*\()/i',
        // Union-based injection
        '/UNION\s+(ALL\s+)?SELECT\b/i',
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

        // Reject already-blocked IPs
        $blocked = BlockedIp::where('ip', $ip)->first();
        if ($blocked && $blocked->blocked_until && now()->lessThan($blocked->blocked_until)) {
            return response()->json([
                'message' => 'Forbidden',
            ], 403);
        }

        $allInput = $request->all();
        $queryString = $request->getQueryString() ?? '';
        $inputValues = $this->flattenArray($allInput);
        $allContent = trim(implode(' ', $inputValues) . ' ' . $queryString);

        $suspiciousContent = null;
        $alertType = null;
        $matchedPattern = null;

        foreach ($this->sqlInjectionPatterns as $pattern) {
            if (preg_match($pattern, $allContent, $matches)) {
                $suspiciousContent = $allContent;
                $alertType = 'SQL Injection Attempt';
                $matchedPattern = $matches[0] ?? $pattern;
                break;
            }
        }

        if (!$suspiciousContent) {
            foreach ($this->xssPatterns as $pattern) {
                if (preg_match($pattern, $allContent, $matches)) {
                    $suspiciousContent = $allContent;
                    $alertType = 'XSS Attack Attempt';
                    $matchedPattern = $matches[0] ?? $pattern;
                    break;
                }
            }
        }

        if ($suspiciousContent) {
            $blockDuration = 24;

            $securityData = [
                'ip_address' => $ip,
                'user_id' => Auth::id() ?? 'Guest',
                'before' => [
                    'method' => $request->method(),
                    'path' => $request->path(),
                    'query_string' => $queryString,
                    'payload' => $suspiciousContent,
                    'request_input' => $allInput,
                    'matched_pattern' => $matchedPattern,
                ],
                'user_agent' => $request->userAgent(),
            ];

            try {
                BlockedIp::updateOrCreate(
                    ['ip' => $ip],
                    [
                        'blocked_until' => now()->addHours($blockDuration),
                        'reason' => $alertType,
                    ]
                );

                LogModel::create([
                    'user_id' => Auth::id(),
                    'action' => $alertType,
                    'description' => "Suspicious request detected: {$alertType}",
                    'model_type' => 'Security',
                    'model_id' => 0,
                    'before' => $securityData['before'],
                    'after' => null,
                    'ip_address' => $ip,
                    'user_agent' => $request->userAgent(),
                ]);

                Mail::to(config('security.alert_emails'))->send(
                    new SecurityAlertMail($alertType, $securityData, true)
                );

                Log::warning("BLOCKED - {$alertType} from IP: {$ip} - Blocked for {$blockDuration} hours");
            } catch (\Exception $e) {
                Log::error('Failed to process suspicious request: ' . $e->getMessage());
            }

            exit(); // Silently exit without returning anything
        }

        return $next($request);
    }

    /**
     * Flatten a multidimensional array into a single array of string values.
     */
    protected function flattenArray(array $array): array
    {
        $result = [];

        array_walk_recursive($array, function ($value) use (&$result) {
            if (is_scalar($value) || $value === null) {
                $result[] = (string) $value;
            }
        });

        return $result;
    }
}