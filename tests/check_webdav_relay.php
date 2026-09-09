<?php
declare(strict_types=1);
$dir = sys_get_temp_dir() . '/vt-relay-test-' . bin2hex(random_bytes(6));
putenv('VOLLEYTAKT_RELAY_RATE_DIR=' . $dir);
define('VOLLEYTAKT_RELAY_LIBRARY_ONLY', true);
require __DIR__ . '/../sync/nextcloud.php';

function ok(bool $cond, string $message): void {
    if (!$cond) { fwrite(STDERR, "FAIL: $message\n"); exit(1); }
}

$ip='198.51.100.17'; $user='coach@example.test'; $host='cloud.example.test';
ok(isAuthenticationFailure(401, []) === true, '401 must count as auth failure');
ok(isAuthenticationFailure(403, ['www-authenticate'=>'Basic realm="x"']) === true, '403 with WWW-Authenticate must count');
ok(isAuthenticationFailure(403, []) === false, 'plain 403 must not count');
ok(isAuthenticationFailure(500, []) === false, 'technical 500 must not count');

for ($i=0; $i<RATE_MAX_USER_IP_FAILURES-1; $i++) registerAuthFailure($ip,$user,$host,401);
$bucket = mutateRateBucket('ipuser', $ip . "\0" . strtolower($user), fn(array $b): array => normalizeBucket($b,time()));
ok(count($bucket['failures']) === RATE_MAX_USER_IP_FAILURES-1, 'failure count before threshold');
ok((int)$bucket['blocked_until'] === 0, 'must not block before threshold');
registerAuthFailure($ip,$user,$host,401);
$bucket = mutateRateBucket('ipuser', $ip . "\0" . strtolower($user), fn(array $b): array => normalizeBucket($b,time()));
ok(count($bucket['failures']) >= RATE_MAX_USER_IP_FAILURES, 'threshold failure recorded');
ok((int)$bucket['blocked_until'] > time(), 'threshold must create temporary block');

registerAuthSuccess($ip,$user);
$bucket = mutateRateBucket('ipuser', $ip . "\0" . strtolower($user), fn(array $b): array => normalizeBucket($b,time()));
ok(count($bucket['failures']) === 0 && (int)$bucket['blocked_until'] === 0, 'successful auth clears user+IP failures');

$src=file_get_contents(__DIR__ . '/../sync/nextcloud.php');
ok(str_contains($src, "fail(429"), '429 protection response exists');
ok(str_contains($src, "CURLOPT_FOLLOWLOCATION => false"), 'redirect following disabled');
ok(str_contains($src, "strtolower((string)(\$parts['scheme'] ?? '')) !== 'https'"), 'HTTPS enforcement exists');
ok(str_contains($src, "isset(\$parts['user']) || isset(\$parts['pass'])"), 'URL credentials rejected');
ok(str_contains($src, "strcasecmp(\$name, 'Authorization') === 0"), 'Authorization header is filtered');
ok(str_contains($src, "CURLOPT_USERAGENT => 'VolleyTaktLive-WebDAV-Relay/' . RELAY_VERSION"), 'central relay user agent used');
ok(RELAY_VERSION === '0.4.1', 'relay version is RC6-2');

foreach (glob($dir.'/*') ?: [] as $f) @unlink($f); @rmdir($dir);
echo "WebDAV relay security checks OK.\n";
