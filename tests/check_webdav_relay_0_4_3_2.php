<?php
declare(strict_types=1);
$dir=sys_get_temp_dir().'/vt-relay-sec-'.bin2hex(random_bytes(5));
putenv('VOLLEYTAKT_RELAY_RATE_DIR='.$dir);
define('VOLLEYTAKT_RELAY_LIBRARY_ONLY',true);
require __DIR__.'/../sync/nextcloud.php';
function ok2(bool $v,string $m):void{if(!$v){fwrite(STDERR,"FAIL: $m\n");exit(1);}}
ok2(RELAY_VERSION==='0.4.3.2','relay version');
ok2(normalizeDavPath('/remote.php/dav/files/user/Folder/file.json')==='/remote.php/dav/files/user/Folder/file.json','normal DAV path');
$headers=validateForwardHeaders(['Depth'=>'1','Authorization'=>'x','X-Evil'=>'y'],['content-type','cache-control','depth','if-match','if-none-match','accept']);
ok2($headers===['Depth: 1'],'header allowlist');
$src=file_get_contents(__DIR__.'/../sync/nextcloud.php');
ok2(str_contains($src, "(int)\$parts['port']!==443"),'port 443 enforcement');
ok2(str_contains($src,'requestOriginAllowed()'),'origin check');
ok2(str_contains($src, "\$contentType!=='application/json'"),'content type check');
ok2(str_contains($src,'path_traversal'),'traversal rejection');
ok2(str_contains($src,'cleanupRateFiles()'),'rate GC');
ok2(strpos($src, "enforceBucket('ip',\$ip") < strpos($src, "enforceBucket('ipuser',\$ip"),'IP backstop before user bucket');
ok2(!str_contains($src,"php_uname"),'no machine-name default salt');
ok2(str_contains($src,'JSON_INVALID_UTF8_SUBSTITUTE'),'safe JSON encoding');
foreach(glob($dir.'/*')?:[] as $f)@unlink($f);@rmdir($dir);
echo "0.4.3.2 WebDAV relay checks passed.\n";
