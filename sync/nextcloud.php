<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

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

function fail(int $status, string $message): never {
    http_response_code($status);
    echo json_encode(['ok'=>false,'error'=>$message], JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'Nur POST zum VolleyTakt-Relay ist erlaubt.');
$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);
if (!is_array($data)) fail(400, 'Ungültige Relay-Anfrage.');

$method = strtoupper((string)($data['method'] ?? ''));
$url = trim((string)($data['url'] ?? ''));
$username = (string)($data['username'] ?? '');
$password = (string)($data['password'] ?? '');
$body = isset($data['body']) ? (string)$data['body'] : null;
$reqHeaders = is_array($data['headers'] ?? null) ? $data['headers'] : [];

if (!in_array($method, $allowedMethods, true)) fail(400, 'WebDAV-Methode nicht erlaubt.');
$parts = parse_url($url);
if (!$parts || strtolower((string)($parts['scheme'] ?? '')) !== 'https') fail(400, 'Nur HTTPS-Ziele sind erlaubt.');
$host = strtolower((string)($parts['host'] ?? ''));
if (!in_array($host, $allowedHosts, true)) fail(403, 'Dieser WebDAV-Host ist im Relay nicht freigegeben.');
if (isset($parts['user']) || isset($parts['pass'])) fail(400, 'Zugangsdaten dürfen nicht Bestandteil der URL sein.');

// Für die eingebaute Nextcloud-Instanz bleibt die DAV-Pfadbegrenzung aktiv.
// Bei ausdrücklich serverseitig freigegebenen zusätzlichen Hosts darf ein
// generischer WebDAV-Pfad verwendet werden.
$path = (string)($parts['path'] ?? '/');
if ($host === 'cloud.ingozech.de' && !str_starts_with($path, '/remote.php/dav/files/')) {
    fail(403, 'Das Relay erwartet für die eingebaute Nextcloud den Datei-WebDAV-Pfad.');
}

$ch = curl_init($url);
if ($ch === false) fail(500, 'cURL konnte nicht initialisiert werden.');
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
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
    CURLOPT_USERPWD => $username . ':' . $password,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_USERAGENT => 'VolleyTaktLive-WebDAV-Relay/0.3.2-preview2-r7-rebuild3-fix2',
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
    fail(502, 'WebDAV nicht erreichbar: ' . $err);
}
$status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);

$result = ['ok'=>true,'status'=>$status,'body'=>(string)$responseBody];
if (isset($responseHeaders['etag']) && $responseHeaders['etag'] !== '') {
    // Original-ETag einschließlich schwachem W/ und Anführungszeichen erhalten,
    // damit sync.js ihn unverändert in If-Match zurücksenden kann.
    $result['etag'] = $responseHeaders['etag'];
}
echo json_encode($result, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
