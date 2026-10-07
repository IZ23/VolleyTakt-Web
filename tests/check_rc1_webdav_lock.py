from pathlib import Path
s=Path('js/sync.js').read_text(encoding='utf-8')
app=Path('js/app.js').read_text(encoding='utf-8')
required=[
 'WEBDAV_LOCK_RETRY_DELAYS=Object.freeze([300,800,1500])',
 "if(d.status!==423)break",
 "e.code='WEBDAV_LOCKED'",
 'Die Cloud-Datei ist momentan gesperrt. Bitte Synchronisation erneut versuchen.',
 'remoteByKey={}',
 'Unverändert: ${name}',
]
for needle in required:
    assert needle in s, needle
assert "transactionId,true)" in app
assert "pointAwardReady(terminalResult)" in app
print('RC1 WebDAV lock/static scoring integration checks passed.')
