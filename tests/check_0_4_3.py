from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
app=(ROOT/'js/app.js').read_text(encoding='utf-8')
idx=(ROOT/'index.html').read_text(encoding='utf-8')
css=(ROOT/'styles.css').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
manifest=json.loads((ROOT/'manifest.webmanifest').read_text(encoding='utf-8'))
update=json.loads((ROOT/'update-manifest.json').read_text(encoding='utf-8'))
tickets=json.loads((ROOT/'tickets.json').read_text(encoding='utf-8'))
by={t['id']:t for t in tickets['tickets']}
checks={
 'version app': "APP_VERSION='0.4.3_1'" in app and "APP_VERSION_ID='0.4.3_1'" in app,
 'version html': '<title>VolleyTakt Live 0.4.3_1</title>' in idx and '<small>0.4.3_1</small>' in idx,
 'manifest': manifest.get('name')=='VolleyTakt Live 0.4.3_1',
 'update manifest': update.get('version')=='0.4.3_1' and update.get('channel')=='stable' and update.get('data_schema')==6,
 'sw cache': 'volleytakt-live-web-v0.4.3_1-r2' in sw,
 'switch markup': 'id="startLanguageSwitch"' in idx and 'data-start-lang="de"' in idx and 'data-start-lang="en"' in idx,
 'switch css': '.start-language-switch' in css and '.start-language-switch button.active' in css,
 'query support': "new URLSearchParams(location.search).get('lang')" in app,
 'priority query': "if(['de','en'].includes(query))return query" in app,
 'stored language': "localStorage.getItem('volleytakt-live-ui-language')" in app,
 'browser fallback': "navigator.languages?.[0]||navigator.language" in app and "browser.startsWith('de')?'de':'en'" in app,
 'persist app setting': 'settings.ui.language=resolveStartupLanguage();saveSettings(settings);' in app,
 'immediate apply': "btn.onclick=()=>applyUiLanguage(btn.dataset.startLang)" in app,
 'startup notice refresh': 'renderStartupCameraNotice();' in app,
 'settings uses same helper': "applyUiLanguage($('#uiLanguage').value,{rerender:true})" in app,
 'english startup errors': 'Startup error:' in idx and 'Please send a screenshot.' in idx,
 'ticket': by.get('UI-I18N-SPLASH1',{}).get('status')=='implemented' and tickets.get('release')=='0.4.3_1',
 'release notes': (ROOT/'RELEASE_0.4.3.md').is_file(),
}
failed=[k for k,v in checks.items() if not v]
if failed: raise SystemExit('0.4.3 startup language check failed: '+', '.join(failed))
print('0.4.3 startup language checks passed.')
