from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[1]
idx=(root/'index.html').read_text()
app=(root/'js/app.js').read_text()
css=(root/'styles.css').read_text()
assert 'id="drawerBack"' in idx
assert 'let master=loadMaster(), state=normalizeLoadedState(loadState(),defaultState), events=loadEvents(), redoStack=[], drawerHistory=[]' in app
assert 'function drawerBack()' in app
assert "openDrawer(b.dataset.view,{resetHistory:true})" in app
assert "$('#drawerBack').onclick=drawerBack" in app
assert "row.classList.toggle('basic',!detailed)" in app
assert 'grid-template-columns:repeat(3,minmax(0,1fr))!important' in css
assert 'grid-template-rows:repeat(2,var(--vsw-quality-h))!important' in css
assert '.control-panel .quality-stack.basic>button:nth-child(n+4){grid-column:auto!important}' in css
assert 'row-gap:clamp(4px,calc(6px * var(--vsw-ui-scale,1)),8px)!important' in css
assert 'transform:none!important' in css
# Onboarding corrections
assert "async function openQuickStartFromGate(){await start({skipAutoTour:true});" in app
assert "titleKey:`tour.${n}.title`" in app
assert "target=step.sel?$(step.sel):null" in app
assert 'function updateStartQuickVisibility()' in app
assert 'b.hidden=decided' in app
# iOS issue deliberately excluded
tickets=json.loads((root/'tickets.json').read_text())['tickets']
assert not any(t.get('id')=='UI-MOBILE-IOS2' for t in tickets)
assert next(t for t in tickets if t['id']=='UI-NAV2')['status']=='implemented'
assert next(t for t in tickets if t['id']=='UI-SCOUT-QUALITY2')['status']=='closed'

# UI-NAV3A: video assignment must enter through central drawer history
assert "if($('#prepVideo'))$('#prepVideo').onclick=()=>{if(!state.matchId){setStatus(t('prep.startMatchFirst'));return}openDrawer('videoassignments')}" in app
assert 'id="videoBack"' not in app
assert next(t for t in tickets if t['id']=='UI-NAV3A')['status']=='implemented'

print('UI navigation/quality/onboarding RC1 correction checks passed.')
