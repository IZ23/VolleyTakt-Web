from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
app=(ROOT/'js/app.js').read_text(encoding='utf-8')
ui=(ROOT/'js/analysis/ui.js').read_text(encoding='utf-8')
css=(ROOT/'styles.css').read_text(encoding='utf-8')
idx=(ROOT/'index.html').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
tickets=json.loads((ROOT/'tickets.json').read_text(encoding='utf-8'))
by={t['id']:t for t in tickets['tickets']}
checks=[
 "APP_VERSION='0.4.2 RC3_1'" in app,
 "APP_VERSION_ID='0.4.2-rc3_1'" in app,
 '0.4.2 RC3_1' in idx,
 'volleytakt-live-web-v0.4.2-rc3_1-i18n-modular-r2' in sw,
 "priorityA:'analysis.view.priorityA'" in ui,
 "priorityB:'analysis.view.priorityB'" in ui,
 "${t('analysis.view')}: ${analysisViewLabel(activeView)}" in ui,
 'class="settings-grid settings-grid-uniform"' in app,
 app.count('class="card settings-grid-card settings-nav-card"') >= 4,
 'settings-nav-arrow' not in app,
 'id="aboutSettingsBtn"' in app,
 'class="card settings-grid-card settings-action-card"' in app,
 'class="card settings-grid-card settings-info-card"' in app,
 "about:'settings'" in app,
 'about:drawAbout' in app,
 '.settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))' in css,
 'border:1px solid var(--line)!important' in css,
 'align-items:stretch' in css,
 '.settings-form-card,.settings-action-card{padding:12px!important;display:flex;flex-direction:column;min-height:178px}' in css,
 '@media(max-width:860px){.settings-grid{grid-template-columns:1fr}' in css,
 tickets['release']=='0.4.2 RC3_1',
 by['UI-ANALYSIS-LABEL1']['status']=='implemented',
 by['UI-SETTINGS2']['status']=='implemented',
 by.get('UI-I18N1',{}).get('status')=='implemented',
 by.get('UI-I18N2',{}).get('status')=='implemented',
 (ROOT/'RELEASE_0.4.2_RC3_1.md').is_file(),
]
if not all(checks): raise SystemExit('0.4.2 RC3_1 static UI/release check failed')
print('0.4.2 RC3_1 UI/release checks passed.')
