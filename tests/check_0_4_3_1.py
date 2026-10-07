from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
app=(ROOT/'js/app.js').read_text(encoding='utf-8')
messages=(ROOT/'js/locales/messages.js').read_text(encoding='utf-8')
runtime=(ROOT/'js/locales/domains/runtime.js').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
manifest=json.loads((ROOT/'manifest.webmanifest').read_text(encoding='utf-8'))
update=json.loads((ROOT/'update-manifest.json').read_text(encoding='utf-8'))
checks={
 'version': "APP_VERSION='0.4.3_1'" in app and "APP_VERSION_ID='0.4.3_1'" in app,
 'manifest': manifest.get('name')=='VolleyTakt Live 0.4.3_1',
 'update': update.get('version')=='0.4.3_1' and update.get('data_schema')==6,
 'cache': 'volleytakt-live-web-v0.4.3_1-r2' in sw,
 'serve button localized': "t('scouting.serveState'" in app and "t('common.us')" in app and "t('common.opponent')" in app,
 'serve status localized': "t('status.servingSideChanged'" in app and "t('status.servingSideUnset')" in app,
 'rotation localized': "captureOpponent?t('common.opponent'):t('common.us')" in app and "activeSide()==='opponent'?t('common.opponent'):t('common.us')" in app,
 'switch title localized': "t('scouting.switchSideQuick')" in app and "t('scouting.switchSide')" in app,
 'service ball localized': "t('scouting.serveUsBall')" in app,
 'catalogue de': "'scouting.serveState':'Aufschlag: {side}'" in messages and "'status.servingSideChanged':'Aufschlagrecht: {side}.'" in runtime,
 'catalogue en': "'scouting.serveState':'Serve: {side}'" in messages and "'status.servingSideChanged':'Serving team: {side}.'" in runtime,
 'no dynamic german serve button': "`Aufschlag: ${state.servingSide" not in app,
 'no dynamic german serving status': "`Aufschlagrecht: ${state.servingSide" not in app,
}
failed=[k for k,v in checks.items() if not v]
if failed: raise SystemExit('0.4.3_1 i18n regression check failed: '+', '.join(failed))
print('0.4.3_1 serve/i18n regression checks passed.')
