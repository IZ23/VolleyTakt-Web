from pathlib import Path
import json, re
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def need(cond,msg):
    if not cond: errors.append(msg)

index=(ROOT/'index.html').read_text(encoding='utf-8')
app=(ROOT/'js/app.js').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
manifest=json.loads((ROOT/'manifest.webmanifest').read_text(encoding='utf-8'))
update=json.loads((ROOT/'update-manifest.json').read_text(encoding='utf-8'))
tickets=json.loads((ROOT/'tickets.json').read_text(encoding='utf-8'))

need('<title>VolleyTakt Live 0.4.1</title>' in index,'final title missing')
need("APP_VERSION='0.4.1'" in app,'final APP_VERSION missing')
need("APP_VERSION_ID='0.4.1'" in app,'final APP_VERSION_ID missing')
need("volleytakt-live-web-v0.4.1" in sw,'final service worker cache id missing')
need(manifest.get('name')=='VolleyTakt Live 0.4.1','final manifest name missing')
need(update.get('version')=='0.4.1' and update.get('version_id')=='0.4.1','final update version missing')
need(update.get('channel')=='stable','update channel is not stable')
need(update.get('data_schema')==6,'update manifest data schema must be 6')
need(tickets.get('release')=='0.4.1','ticket release mismatch')
need(any(t.get('id')=='UI-MOBILE10' and t.get('status')=='open' for t in tickets['tickets']),'UI-MOBILE10 must remain open')
need(any(t.get('id')=='REPORT-SHARE2B' and t.get('status')=='closed' for t in tickets['tickets']),'REPORT-SHARE2B must be closed')
for rel in ['README.md','CHANGELOG.md','RELEASE_0.4.1.md','TODO.md','tickets.json','CLOSED_TICKETS.md','LICENSE.md']:
    need((ROOT/rel).is_file(),f'missing release file: {rel}')

# Active runtime files must not advertise RC6-8.
for rel in ['index.html','manifest.webmanifest','update-manifest.json','sw.js','js/app.js','js/scouting/scouting.js','js/app/state.js','sync/nextcloud.php']:
    txt=(ROOT/rel).read_text(encoding='utf-8')
    need('RC6-8' not in txt and 'rc6-8' not in txt,f'prerelease identifier remains in runtime file {rel}')

if errors:
    print('FINAL 0.4.1 CHECK FAILED')
    for e in errors: print('-',e)
    raise SystemExit(1)
print('Final 0.4.1 release metadata/ticket checks passed.')
