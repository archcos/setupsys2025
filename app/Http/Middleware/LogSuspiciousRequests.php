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
    /**
     * SQL injection detection patterns.
     *
     * These patterns intentionally avoid treating ordinary characters such as
     * "--" and ";" as SQL injection by themselves, because they can legitimately
     * occur in project descriptions, specifications, measurements, etc.
     */
    protected $sqlInjectionPatterns = [
        // UNION-based SQL injection
        '/\bUNION\s+(?:ALL\s+)?SELECT\b/i',

        // SELECT ... FROM SQL injection
        '/\bSELECT\s+.+?\s+\bFROM\b/i',

        // INSERT ... INTO SQL injection
        '/\bINSERT\s+INTO\b/i',

        // UPDATE ... SET SQL injection
        '/\bUPDATE\s+\S+\s+\bSET\b/i',

        // DELETE ... FROM SQL injection
        '/\bDELETE\s+FROM\b/i',

        // Destructive/schema-changing SQL statements
        '/\b(?:DROP|ALTER|CREATE|TRUNCATE)\s+(?:TABLE|DATABASE)\b/i',

        // SQL execution procedures
        '/\bEXEC(?:UTE)?\s*\(/i',

        // Time-based SQL injection
        '/\b(?:SLEEP|BENCHMARK)\s*\(/i',
        '/\bWAITFOR\s+DELAY\b/i',
        '/\bDBMS_LOCK\.SLEEP\s*\(/i',

        // Boolean-based SQL injection with an explicit comparison
        '/[\'"]\s*(?:OR|AND)\s+[\'"]?\d+[\'"]?\s*=\s*[\'"]?\d+/i',

        // SQL comment syntax only when attached to a quoted value.
        // This avoids flagging ordinary text such as "Type -- Semi-Hot".
        '/[\'"]\s*(?:--|#|\/\*)/i',
    ];

    /**
     * XSS detection patterns.
     */
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

        /*
         * Reject already-blocked IPs.
         */
        $blocked = BlockedIp::where('ip', $ip)->first();

        if (
            $blocked &&
            $blocked->blocked_until &&
            now()->lessThan($blocked->blocked_until)
        ) {
            return response()->json([
                'message' => 'Forbidden',
            ], 403);
        }

        /*
         * Collect request input and query string.
         */
        $allInput = $request->all();
        $queryString = $request->getQueryString() ?? '';

        $inputValues = $this->flattenArray($allInput);

        $allContent = trim(
            implode(' ', $inputValues) . ' ' . $queryString
        );

        $suspiciousContent = null;
        $alertType = null;
        $matchedPattern = null;

        /*
         * Check for SQL injection.
         */
        foreach ($this->sqlInjectionPatterns as $pattern) {
            if (preg_match($pattern, $allContent, $matches)) {
                $suspiciousContent = $allContent;
                $alertType = 'SQL Injection Attempt';
                $matchedPattern = $matches[0] ?? $pattern;
                break;
            }
        }

        /*
         * If no SQL injection was detected, check for XSS.
         */
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

        /*
         * Suspicious request detected.
         */
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
                /*
                 * Block the IP for 24 hours.
                 */
                BlockedIp::updateOrCreate(
                    ['ip' => $ip],
                    [
                        'blocked_until' => now()->addHours($blockDuration),
                        'reason' => $alertType,
                    ]
                );

                /*
                 * Record the security event in the application log.
                 */
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

                /*
                 * Send security alert email.
                 */
                Mail::to(config('security.alert_emails'))->send(
                    new SecurityAlertMail(
                        $alertType,
                        $securityData,
                        true
                    )
                );

                Log::warning(
                    "BLOCKED - {$alertType} from IP: {$ip} - " .
                    "Blocked for {$blockDuration} hours"
                );
            } catch (\Exception $e) {
                Log::error(
                    'Failed to process suspicious request: ' .
                    $e->getMessage()
                );
            }

            /*
             * Do not continue processing a confirmed suspicious request.
             */
            exit();
        }

        return $next($request);
    }

    /**
     * Flatten a multidimensional array into a single array
     * of string values.
     */
    protected function flattenArray(array $array): array
    {
        $result = [];

        array_walk_recursive(
            $array,
            function ($value) use (&$result) {
                if (is_scalar($value) || $value === null) {
                    $result[] = (string) $value;
                }
            }
        );

        return $result;
    }
}
