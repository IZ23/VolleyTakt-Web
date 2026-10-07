from pathlib import Path
root=Path(__file__).resolve().parents[1]
app=(root/'js/app.js').read_text(encoding='utf-8')
css=(root/'styles.css').read_text(encoding='utf-8')

current='${currentActions}<div class="card match-library-card">'
if current not in app:
    raise SystemExit('UI-MATCH1: current match is not rendered before the library')

need=[
    'REPORT-PRINT3' in css,
    '.trainer-report-techniques{' in css,
    'break-before:page!important' in css,
    'page-break-before:always!important' in css,
    'overflow:visible!important' in css,
]
if not all(need):
    raise SystemExit('REPORT-PRINT3: stable detail-report pagination missing')
print('RC6-8 UI-MATCH1 / REPORT-PRINT3 checks passed.')
