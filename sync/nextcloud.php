<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const RELAY_VERSION = '0.4.3.2';
const RATE_WINDOW_SECONDS = 300;
const RATE_BLOCK_SECONDS = 600;
const RATE_MAX_USER_IP_FAILURES = 6;
const RATE_MAX_IP_FAILURES = 20;
const RATE_GC_MAX_AGE = 86400;

$allowedHosts = ['cloud.ingozech.de'];
$extraHosts = getenv('VOLLEYTAKT_WEBDAV_ALLOWED_HOSTS');
if (is_string($extraHosts) && trim($extraHosts) !== '') {
    foreach (explode(',', $extraHosts) as $extraHost) {
        $extraHost = strtolower(trim($extraHost));
        if ($extraHost !== '' && filter_var($extraHost, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME)) $allowedHosts[] = $extraHost;
    }
}
$allowedHosts = array_values(array_unique($allowedHosts));
$allowedMethods = ['GET','PUT','PROPFIND','MKCOL','DELETE'];
$allowedForwardHeaders = ['content-type','cache-control','depth','if-match','if-none-match','accept'];

function jsonFlags(): int { return JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE; }
function fail(int $status, string $message, string $code = 'relay_error', array $extra = []): never {
    http_response_code($status);
    echo json_encode(['ok'=>false,'error'=>$message,'code'=>$code] + $extra, jsonFlags());
    exit;
}
function clientIp(): string { return (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown'); }
function rateDirectory(): string {
    $configured = getenv('VOLLEYTAKT_RELAY_RATE_DIR');
    $dir = is_string($configured) && trim($configured) !== '' ? rtrim(trim($configured), DIRECTORY_SEPARATOR) : rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'volleytakt-relay-rate-limit';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) fail(503, 'Relay-Schutz konnte nicht initialisiert werden.', 'rate_store_unavailable');
    return $dir;
}
function relaySecret(): string {
    $configured = getenv('VOLLEYTAKT_RELAY_LOG_SALT');
    if (is_string($configured) && trim($configured) !== '') return $configured;
    $file = rateDirectory() . DIRECTORY_SEPARATOR . '.log-salt';
    $fp = @fopen($file, 'c+');
    if ($fp === false) return 'volleytakt-relay-session-' . __FILE__;
    try {
        if (!flock($fp, LOCK_EX)) return 'volleytakt-relay-session-' . __FILE__;
        rewind($fp); $secret = trim((string)stream_get_contents($fp));
        if ($secret === '') {
            try { $secret = bin2hex(random_bytes(32)); } catch (Throwable) { $secret = hash('sha256', __FILE__ . microtime(true)); }
            ftruncate($fp,0); rewind($fp); fwrite($fp,$secret); fflush($fp); @chmod($file,0600);
        }
        flock($fp,LOCK_UN); return $secret;
    } finally { fclose($fp); }
}
function diagnosticHash(string $value): string { return substr(hash_hmac('sha256', $value, relaySecret()), 0, 16); }
function logSecurity(string $event, string $ip, string $username, string $host, array $extra = []): void {
    $record=['event'=>$event,'ip_hash'=>diagnosticHash($ip),'user_hash'=>diagnosticHash($username),'host'=>$host,'time'=>gmdate('c')]+$extra;
    error_log('[VolleyTakt WebDAV Relay] ' . json_encode($record, jsonFlags()));
}
function rateFile(string $scope,string $key): string { return rateDirectory().DIRECTORY_SEPARATOR.$scope.'-'.hash('sha256',$key).'.json'; }
function cleanupRateFiles(): void {
    $dir=rateDirectory(); $now=time(); $seen=0;
    foreach (glob($dir.DIRECTORY_SEPARATOR.'*.json') ?: [] as $file) {
        if (++$seen>300) break;
        $mtime=@filemtime($file); if ($mtime!==false && $mtime < $now-RATE_GC_MAX_AGE) @unlink($file);
    }
}
function mutateRateBucket(string $scope,string $key,callable $fn): array {
    $file=rateFile($scope,$key); $fp=@fopen($file,'c+');
    if($fp===false) fail(503,'Relay-Schutz ist vorübergehend nicht verfügbar.','rate_store_unavailable');
    try {
        if(!flock($fp,LOCK_EX)) fail(503,'Relay-Schutz ist vorübergehend nicht verfügbar.','rate_store_unavailable');
        rewind($fp); $raw=stream_get_contents($fp); $bucket=json_decode($raw?:'{}',true); if(!is_array($bucket))$bucket=[];
        $bucket=$fn($bucket); ftruncate($fp,0); rewind($fp); fwrite($fp,json_encode($bucket,JSON_UNESCAPED_SLASHES)); fflush($fp); flock($fp,LOCK_UN); return $bucket;
    } finally { fclose($fp); }
}
function normalizeBucket(array $bucket,int $now): array {
    $failures=array_values(array_filter(is_array($bucket['failures']??null)?$bucket['failures']:[],static fn($ts)=>(is_int($ts)||ctype_digit((string)$ts)) && (int)$ts>=($now-RATE_WINDOW_SECONDS)));
    $blockedUntil=max(0,(int)($bucket['blocked_until']??0)); if($blockedUntil<=$now)$blockedUntil=0;
    return ['failures'=>$failures,'blocked_until'=>$blockedUntil,'updated_at'=>$now];
}
function enforceBucket(string $scope,string $key,int $max,string $ip,string $username): void {
    $now=time();
    $bucket=mutateRateBucket($scope,$key,static function(array $b) use($now,$max): array {
        $b=normalizeBucket($b,$now);
        if(($b['blocked_until']??0)<=$now && count($b['failures']??[]) >= $max) $b['blocked_until']=$now+RATE_BLOCK_SECONDS;
        return $b;
    });
    if(($bucket['blocked_until']??0)>$now){$retry=max(1,(int)$bucket['blocked_until']-$now);header('Retry-After: '.$retry);logSecurity('rate_limited',$ip,$username,'',['scope'=>$scope,'retry_after'=>$retry]);fail(429,'Zu viele fehlgeschlagene Anmeldeversuche. Bitte später erneut versuchen.','rate_limited',['retry_after'=>$retry]);}
}
function checkRateLimit(string $ip,string $username): void {
    // Broad IP backstop is checked before a username-specific file is ever created.
    enforceBucket('ip',$ip,RATE_MAX_IP_FAILURES,$ip,$username);
    cleanupRateFiles();
    enforceBucket('ipuser',$ip."\0".strtolower($username),RATE_MAX_USER_IP_FAILURES,$ip,$username);
}
function isAuthenticationFailure(int $status,array $responseHeaders): bool { return $status===401 || ($status===403 && isset($responseHeaders['www-authenticate'])); }
function registerAuthFailure(string $ip,string $username,string $host,int $status): void {
    $now=time();
    foreach ([['scope'=>'ip','key'=>$ip,'max'=>RATE_MAX_IP_FAILURES],['scope'=>'ipuser','key'=>$ip."\0".strtolower($username),'max'=>RATE_MAX_USER_IP_FAILURES]] as $spec) {
        mutateRateBucket($spec['scope'],$spec['key'],static function(array $b) use($now,$spec): array {$b=normalizeBucket($b,$now);$b['failures'][]=$now;if(count($b['failures']) >= $spec['max'])$b['blocked_until']=$now+RATE_BLOCK_SECONDS;return $b;});
    }
    logSecurity('auth_failure',$ip,$username,$host,['status'=>$status]);
}
function registerAuthSuccess(string $ip,string $username): void { mutateRateBucket('ipuser',$ip."\0".strtolower($username),static fn(array $b):array=>['failures'=>[],'blocked_until'=>0,'updated_at'=>time()]); }
function requestOriginAllowed(): bool {
    $origin=(string)($_SERVER['HTTP_ORIGIN']??'');
    if($origin==='') return false;
    $allowed=[]; $env=getenv('VOLLEYTAKT_RELAY_ALLOWED_ORIGINS');
    if(is_string($env)&&trim($env)!=='')foreach(explode(',',$env) as $o){$o=rtrim(trim($o),'/');if($o!=='')$allowed[]=$o;}
    $host=(string)($_SERVER['HTTP_HOST']??''); if($host!=='')$allowed[]='https://'.$host;
    return in_array(rtrim($origin,'/'),array_unique($allowed),true);
}
function normalizeDavPath(string $path): string {
    $decoded=$path;
    for($i=0;$i<4;$i++){ $next=rawurldecode($decoded); if($next===$decoded)break; $decoded=$next; }
    if(str_contains($decoded,"\0")||str_contains($decoded,'\\')) fail(400,'Ungültiger WebDAV-Pfad.','invalid_path');
    $segments=explode('/',$decoded); $out=[];
    foreach($segments as $segment){ if($segment===''||$segment==='.')continue; if($segment==='..')fail(403,'Pfadnavigation ist nicht erlaubt.','path_traversal'); $out[]=$segment; }
    return '/'.implode('/',$out);
}
function validateForwardHeaders(array $headers,array $allow): array {
    $out=[];
    foreach($headers as $k=>$v){$name=trim((string)$k);$lower=strtolower($name);$value=(string)$v;if($name===''||!in_array($lower,$allow,true))continue;if(preg_match('/[\r\n]/',$name.$value))fail(400,'Ungültiger Request-Header.','invalid_header');if(!preg_match('/^[A-Za-z0-9-]+$/',$name))fail(400,'Ungültiger Request-Header.','invalid_header');$out[]=$name.': '.$value;}
    return $out;
}

if (defined('VOLLEYTAKT_RELAY_LIBRARY_ONLY') && VOLLEYTAKT_RELAY_LIBRARY_ONLY) return;

if(($_SERVER['REQUEST_METHOD']??'')!=='POST')fail(405,'Nur POST zum VolleyTakt-Relay ist erlaubt.','method_not_allowed');
$contentType=strtolower(trim(explode(';',(string)($_SERVER['CONTENT_TYPE']??''))[0]));
if($contentType!=='application/json')fail(415,'Das Relay akzeptiert nur application/json.','content_type_required');
if(!requestOriginAllowed())fail(403,'Die Anfrage stammt nicht von einer freigegebenen VolleyTakt-Origin.','origin_not_allowed');
$raw=file_get_contents('php://input');$data=json_decode($raw?:'',true);if(!is_array($data))fail(400,'Ungültige Relay-Anfrage.','invalid_request');
$method=strtoupper((string)($data['method']??''));$url=trim((string)($data['url']??''));$username=(string)($data['username']??'');$password=(string)($data['password']??'');$body=isset($data['body'])?(string)$data['body']:null;$reqHeaders=is_array($data['headers']??null)?$data['headers']:[];
if(!in_array($method,$allowedMethods,true))fail(400,'WebDAV-Methode nicht erlaubt.','webdav_method_not_allowed');
$parts=parse_url($url);if(!$parts||strtolower((string)($parts['scheme']??''))!=='https')fail(400,'Nur HTTPS-Ziele sind erlaubt.','https_required');
if(isset($parts['port'])&&(int)$parts['port']!==443)fail(403,'Für WebDAV ist ausschließlich HTTPS-Port 443 erlaubt.','port_not_allowed');
$host=strtolower((string)($parts['host']??''));if(!in_array($host,$allowedHosts,true))fail(403,'Dieser WebDAV-Host ist im Relay nicht freigegeben.','host_not_allowed');
if(isset($parts['user'])||isset($parts['pass']))fail(400,'Zugangsdaten dürfen nicht Bestandteil der URL sein.','url_credentials_forbidden');
$path=normalizeDavPath((string)($parts['path']??'/'));
if($host==='cloud.ingozech.de'&&!str_starts_with($path,'/remote.php/dav/files/'))fail(403,'Das Relay erwartet für die eingebaute Nextcloud den Datei-WebDAV-Pfad.','dav_path_required');
$ip=clientIp();checkRateLimit($ip,$username);
$headers=validateForwardHeaders($reqHeaders,$allowedForwardHeaders);
$ch=curl_init($url);if($ch===false)fail(500,'cURL konnte nicht initialisiert werden.','curl_init_failed');$responseHeaders=[];
$options=[CURLOPT_CUSTOMREQUEST=>$method,CURLOPT_RETURNTRANSFER=>true,CURLOPT_HEADER=>false,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_MAXREDIRS=>0,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>30,CURLOPT_HTTPAUTH=>CURLAUTH_BASIC,CURLOPT_USERPWD=>$username.':'.$password,CURLOPT_HTTPHEADER=>$headers,CURLOPT_USERAGENT=>'VolleyTaktLive-WebDAV-Relay/'.RELAY_VERSION,CURLOPT_HEADERFUNCTION=>static function($curl,string $line)use(&$responseHeaders):int{$length=strlen($line);$p=explode(':',$line,2);if(count($p)===2){$name=strtolower(trim($p[0]));if($name!=='')$responseHeaders[$name]=trim($p[1]);}return $length;}];
if(defined('CURLOPT_PROTOCOLS')&&defined('CURLPROTO_HTTPS'))$options[CURLOPT_PROTOCOLS]=CURLPROTO_HTTPS;
if($body!==null&&$method==='PUT')$options[CURLOPT_POSTFIELDS]=$body;
curl_setopt_array($ch,$options);$responseBody=curl_exec($ch);if($responseBody===false){$err=curl_error($ch);curl_close($ch);logSecurity('upstream_unreachable',$ip,$username,$host,['curl_error_hash'=>diagnosticHash($err)]);fail(502,'WebDAV ist vorübergehend nicht erreichbar.','webdav_unreachable');}
$status=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);curl_close($ch);
if(isAuthenticationFailure($status,$responseHeaders))registerAuthFailure($ip,$username,$host,$status);elseif(($status>=200&&$status<300)||$status===207)registerAuthSuccess($ip,$username);
$result=['ok'=>true,'status'=>$status];
if((function_exists('mb_check_encoding') && mb_check_encoding((string)$responseBody,'UTF-8')) || (!function_exists('mb_check_encoding') && preg_match('//u',(string)$responseBody)===1)){$result['body']=(string)$responseBody;$result['bodyEncoding']='utf-8';}else{$result['body']=base64_encode((string)$responseBody);$result['bodyEncoding']='base64';}
if(isset($responseHeaders['etag'])&&$responseHeaders['etag']!=='')$result['etag']=$responseHeaders['etag'];
echo json_encode($result,jsonFlags());
