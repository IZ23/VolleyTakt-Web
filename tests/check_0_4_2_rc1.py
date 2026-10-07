from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
app=(ROOT/'js/app.js').read_text(encoding='utf-8');sw=(ROOT/'sw.js').read_text(encoding='utf-8');idx=(ROOT/'index.html').read_text(encoding='utf-8');rw=(ROOT/'js/analysis/result-window.js').read_text(encoding='utf-8');ui=(ROOT/'js/analysis/ui.js').read_text(encoding='utf-8');tickets=json.loads((ROOT/'tickets.json').read_text())
checks=[
 "APP_VERSION='0.4.2 RC1'" in app,"APP_VERSION_ID='0.4.2-rc1'" in app,'0.4.2 RC1' in idx,'volleytakt-live-web-v0.4.2-rc1' in sw,
 "./js/analysis/action-video.js" in sw,"./js/analysis/player-report.js" in sw,"analysisOption('actions','Aktionen & Video')" in ui,'buildActionSelection' in ui,'buildPlayerReport' in ui,'${prefix}Position' in ui,
 'touchTablet' in rw,"nativeShareUiAvailable()?'<button id=\"playerReportShare\">Teilen</button>':''" in rw,'analysisReportPersonal' in rw,
 (ROOT/'RELEASE_0.4.2_RC1.md').is_file()
]
by={t['id']:t for t in tickets['tickets']}
checks += [tickets['release']=='0.4.2 RC1',by['ANALYSIS-ACTIONS1']['status']=='implemented',by['ANALYSIS-VIDEO1']['status']=='implemented',by['ANALYSIS-PLAYER-REPORT1']['status']=='implemented',by['REPORT-SHARE3']['status']=='verified',by['VIDEO3']['status']=='in_progress',by['UI-MOBILE10']['targetVersion']=='0.4.2']
if not all(checks): raise SystemExit('0.4.2 RC1 static metadata/ticket check failed')
print('0.4.2 RC1 metadata/ticket checks passed.')
