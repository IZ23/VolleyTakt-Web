<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const RELAY_VERSION = '0.4.1';
const RATE_WINDOW_SECONDS = 300;       // 5 minutes
const RATE_BLOCK_SECONDS = 600;        // 10 minutes
const RATE_MAX_USER_IP_FAILURES = 6;   // per IP + username
const RATE_MAX_IP_FAILURES = 20;       // coarse backstop per IP

// Sichere Host-Allowlist für das WebDAV-Relay.
// cloud.ingozech.de bleibt für diese Installation standardmäßig erlaubt.
// Weitere Nextcloud-/WebDAV-Hosts können serverseitig über
// VOLLEYTAKT_WEBDAV_ALLOWED_HOSTS="dav.example.de,cloud.example.org"
// ergänzt werden. Das Relay bleibt damit bewusst kein offener HTTP-Proxy.
$allowedHosts = ['cloud.ingozech.de'];
$extraHosts = getenv('VOLLEYTAKT_WEBDAV_ALLOWED_HOSTS');
if (is_string($extraHosts) && trim($extraHosts) !== '') {
    foreach (explode(',', $extraHosts) as $extraHost) {
        $extraHost = strtolower(trim($extraHost));
        if ($extraHost !== '' && filter_var($extraHost, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME)) {
            $allowedHosts[] = $extraHost;
        }
    }
}
$allowedHosts = array_values(array_unique($allowedHosts));
$allowedMethods = ['GET','PUT','PROPFIND','MKCOL'];

function fail(int $status, string $message, string $code = 'relay_error', array $extra = []): never {
    http_response_code($status);
    echo json_encode(['ok'=>false,'error'=>$message,'code'=>$code] + $extra, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
    exit;
}

function clientIp(): string {
    // REMOTE_ADDR is intentionally used instead of forwarded headers: the webspace
    // may not have a trusted proxy configuration and client-controlled XFF values
    // would make the rate limiter bypassable.
    return (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
}

function rateDirectory(): string {
    $configured = getenv('VOLLEYTAKT_RELAY_RATE_DIR');
    $dir = is_string($configured) && trim($configured) !== ''
        ? rtrim(trim($configured), DIRECTORY_SEPARATOR)
        : rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'volleytakt-relay-rate-limit';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        fail(503, 'Relay-Schutz konnte nicht initialisiert werden.', 'rate_store_unavailable');
    }
    return $dir;
}

function diagnosticHash(string $value): string {
    $salt = (string)(getenv('VOLLEYTAKT_RELAY_LOG_SALT') ?: php_uname('n'));
    return substr(hash('sha256', $salt . "\0" . $value), 0, 16);
}

function logSecurity(string $event, string $ip, string $username, string $host, array $extra = []): void {
    $record = [
        'event' => $event,
        'ip_hash' => diagnosticHash($ip),
        'user_hash' => diagnosticHash($username),
        'host' => $host,
        'time' => gmdate('c'),
    ] + $extra;
    // Never log passwords, Authorization headers, request bodies or full target URLs.
    error_log('[VolleyTakt WebDAV Relay] ' . json_encode($record, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE));
}

function rateFile(string $scope, string $key): string {
    return rateDirectory() . DIRECTORY_SEPARATOR . $scope . '-' . hash('sha256', $key) . '.json';
}

function mutateRateBucket(string $scope, string $key, callable $fn): array {
    $file = rateFile($scope, $key);
    $fp = @fopen($file, 'c+');
    if ($fp === false) fail(503, 'Relay-Schutz ist vorübergehend nicht verfügbar.', 'rate_store_unavailable');
    try {
        if (!flock($fp, LOCK_EX)) fail(503, 'Relay-Schutz ist vorübergehend nicht verfügbar.', 'rate_store_unavailable');
        rewind($fp);
        $raw = stream_get_contents($fp);
        $bucket = json_decode($raw ?: '{}', true);
        if (!is_array($bucket)) $bucket = [];
        $bucket = $fn($bucket);
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($bucket, JSON_UNESCAPED_SLASHES));
        fflush($fp);
        flock($fp, LOCK_UN);
        return $bucket;
    } finally {
        fclose($fp);
    }
}

function normalizeBucket(array $bucket, int $now): array {
    $failures = array_values(array_filter(
        is_array($bucket['failures'] ?? null) ? $bucket['failures'] : [],
        static fn($ts) => is_int($ts) || ctype_digit((string)$ts)
            ? (int)$ts >= ($now - RATE_WINDOW_SECONDS)
            : false
    ));
    $blockedUntil = max(0, (int)($bucket['blocked_until'] ?? 0));
    if ($blockedUntil <= $now) $blockedUntil = 0;
    return ['failures'=>$failures,'blocked_until'=>$blockedUntil,'updated_at'=>$now];
}

function checkRateLimit(string $ip, string $username): void {
    $now = time();
    $checks = [
        ['scope'=>'ipuser','key'=>$ip . "\0" . strtolower($username), 'max'=>RATE_MAX_USER_IP_FAILURES],
        ['scope'=>'ip','key'=>$ip, 'max'=>RATE_MAX_IP_FAILURES],
    ];
    foreach ($checks as $check) {
        $bucket = mutateRateBucket($check['scope'], $check['key'], static function(array $b) use ($now): array {
            return normalizeBucket($b, $now);
        });
        if (($bucket['blocked_until'] ?? 0) > $now) {
            $retry = max(1, (int)$bucket['blocked_until'] - $now);
            header('Retry-After: ' . $retry);
            logSecurity('rate_limited', $ip, $username, '', ['scope'=>$check['scope'],'retry_after'=>$retry]);
            fail(429, 'Zu viele fehlgeschlagene Anmeldeversuche. Bitte später erneut versuchen.', 'rate_limited', ['retry_after'=>$retry]);
        }
        if (count($bucket['failures'] ?? []) >= $check['max']) {
            $blocked = mutateRateBucket($check['scope'], $check['key'], static function(array $b) use ($now): array {
                $b = normalizeBucket($b, $now);
                $b['blocked_until'] = $now + RATE_BLOCK_SECONDS;
                return $b;
            });
            $retry = max(1, (int)$blocked['blocked_until'] - $now);
            header('Retry-After: ' . $retry);
            logSecurity('rate_limited', $ip, $username, '', ['scope'=>$check['scope'],'retry_after'=>$retry]);
            fail(429, 'Zu viele fehlgeschlagene Anmeldeversuche. Bitte später erneut versuchen.', 'rate_limited', ['retry_after'=>$retry]);
        }
    }
}


function isAuthenticationFailure(int $status, array $responseHeaders): bool {
    return $status === 401 || ($status === 403 && isset($responseHeaders['www-authenticate']));
}

function registerAuthFailure(string $ip, string $username, string $host, int $status): void {
    $now = time();
    foreach ([
        ['scope'=>'ipuser','key'=>$ip . "\0" . strtolower($username), 'max'=>RATE_MAX_USER_IP_FAILURES],
        ['scope'=>'ip','key'=>$ip, 'max'=>RATE_MAX_IP_FAILURES],
    ] as $spec) {
        mutateRateBucket($spec['scope'], $spec['key'], static function(array $b) use ($now, $spec): array {
            $b = normalizeBucket($b, $now);
            $b['failures'][] = $now;
            if (count($b['failures']) >= $spec['max']) $b['blocked_until'] = $now + RATE_BLOCK_SECONDS;
            return $b;
        });
    }
    logSecurity('auth_failure', $ip, $username, $host, ['status'=>$status]);
}

function registerAuthSuccess(string $ip, string $username): void {
    // Clear only the narrow user+IP bucket after a positively authenticated request.
    // The broad IP bucket is time-window based and remains a backstop against username spraying.
    mutateRateBucket('ipuser', $ip . "\0" . strtolower($username), static fn(array $b): array => ['failures'=>[],'blocked_until'=>0,'updated_at'=>time()]);
}

// CLI-only/unit-test inclusion point. A remote request cannot define this PHP constant.
if (defined('VOLLEYTAKT_RELAY_LIBRARY_ONLY') && VOLLEYTAKT_RELAY_LIBRARY_ONLY) return;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'Nur POST zum VolleyTakt-Relay ist erlaubt.', 'method_not_allowed');
$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);
if (!is_array($data)) fail(400, 'Ungültige Relay-Anfrage.', 'invalid_request');

$method = strtoupper((string)($data['method'] ?? ''));
$url = trim((string)($data['url'] ?? ''));
$username = (string)($data['username'] ?? '');
$password = (string)($data['password'] ?? '');
$body = isset($data['body']) ? (string)$data['body'] : null;
$reqHeaders = is_array($data['headers'] ?? null) ? $data['headers'] : [];

if (!in_array($method, $allowedMethods, true)) fail(400, 'WebDAV-Methode nicht erlaubt.', 'webdav_method_not_allowed');
$parts = parse_url($url);
if (!$parts || strtolower((string)($parts['scheme'] ?? '')) !== 'https') fail(400, 'Nur HTTPS-Ziele sind erlaubt.', 'https_required');
$host = strtolower((string)($parts['host'] ?? ''));
if (!in_array($host, $allowedHosts, true)) fail(403, 'Dieser WebDAV-Host ist im Relay nicht freigegeben.', 'host_not_allowed');
if (isset($parts['user']) || isset($parts['pass'])) fail(400, 'Zugangsdaten dürfen nicht Bestandteil der URL sein.', 'url_credentials_forbidden');

// Für die eingebaute Nextcloud-Instanz bleibt die DAV-Pfadbegrenzung aktiv.
// Bei ausdrücklich serverseitig freigegebenen zusätzlichen Hosts darf ein
// generischer WebDAV-Pfad verwendet werden.
$path = (string)($parts['path'] ?? '/');
if ($host === 'cloud.ingozech.de' && !str_starts_with($path, '/remote.php/dav/files/')) {
    fail(403, 'Das Relay erwartet für die eingebaute Nextcloud den Datei-WebDAV-Pfad.', 'dav_path_required');
}

$ip = clientIp();
checkRateLimit($ip, $username);

$ch = curl_init($url);
if ($ch === false) fail(500, 'cURL konnte nicht initialisiert werden.', 'curl_init_failed');
$headers = [];
foreach ($reqHeaders as $k=>$v) {
    $name = trim((string)$k);
    if ($name === '' || strcasecmp($name, 'Authorization') === 0 || strcasecmp($name, 'Host') === 0) continue;
    $headers[] = $name . ': ' . (string)$v;
}
$responseHeaders = [];
$options = [
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => false,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_MAXREDIRS => 0,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
    CURLOPT_USERPWD => $username . ':' . $password,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_USERAGENT => 'VolleyTaktLive-WebDAV-Relay/' . RELAY_VERSION,
    CURLOPT_HEADERFUNCTION => static function($curl, string $line) use (&$responseHeaders): int {
        $length = strlen($line);
        $parts = explode(':', $line, 2);
        if (count($parts) === 2) {
            $name = strtolower(trim($parts[0]));
            if ($name !== '') $responseHeaders[$name] = trim($parts[1]);
        }
        return $length;
    },
];
if ($body !== null && $method === 'PUT') $options[CURLOPT_POSTFIELDS] = $body;
curl_setopt_array($ch, $options);
$responseBody = curl_exec($ch);
if ($responseBody === false) {
    $err = curl_error($ch);
    curl_close($ch);
    logSecurity('upstream_unreachable', $ip, $username, $host, ['curl_error_hash'=>diagnosticHash($err)]);
    fail(502, 'WebDAV ist vorübergehend nicht erreichbar.', 'webdav_unreachable');
}
$status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);

$authFailure = isAuthenticationFailure($status, $responseHeaders);
if ($authFailure) registerAuthFailure($ip, $username, $host, $status);
elseif (($status >= 200 && $status < 300) || $status === 207) registerAuthSuccess($ip, $username);

$result = ['ok'=>true,'status'=>$status,'body'=>(string)$responseBody];
if (isset($responseHeaders['etag']) && $responseHeaders['etag'] !== '') {
    // Original-ETag einschließlich schwachem W/ und Anführungszeichen erhalten,
    // damit sync.js ihn unverändert in If-Match zurücksenden kann.
    $result['etag'] = $responseHeaders['etag'];
}
echo json_encode($result, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
