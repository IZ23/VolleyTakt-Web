from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
app=(root/'js/app.js').read_text()
for view,key in [('match','nav.match'),('prep','nav.prep'),('analysis','nav.analysis'),('data','nav.data'),('help','nav.help'),('settings','nav.settings')]:
    assert f'data-view="{view}"' in html and f'data-i18n-key="{key}"' in html, f'task-oriented navigation entry missing: {view}'
for legacy in ['data-view="players"','data-view="teams"','data-view="seasons"','data-view="camera"','data-view="sync"']:
    assert legacy not in html, f'legacy flat navigation entry remains: {legacy}'
assert 'function drawPreparation()' in app
for key in ['prep.players','prep.teams','prep.seasons','prep.rosters','prep.camera','prep.videoAssignments']:
    assert f"t('{key}')" in app, f'preparation entry missing: {key}'
assert "$('#syncSettingsBtn').onclick=()=>openDrawer('sync')" in app
assert "help:t('nav.help')" in app
assert "help:()=>drawHelp()" in app
assert "openDrawer('help');drawHelp('quickstart')" in app
assert "const TOUR_VERSION='tour-5';" in app
assert "titleKey:`tour.${n}.title`" in app and "tour.4.title" in (root/'js/locales/domains/ui.js').read_text()
# Explicitly ensure the deferred iOS issue was not silently introduced.
tickets=json.loads((root/'tickets.json').read_text())['tickets']
assert not any(t.get('id')=='UI-MOBILE-IOS2' for t in tickets), 'UI-MOBILE-IOS2 must remain out of this RC'
nav_ticket=next(t for t in tickets if t.get('id')=='UI-NAV1')
assert nav_ticket['status']=='implemented'
print('Navigation RC1 checks passed.')
