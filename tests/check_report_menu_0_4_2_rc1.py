from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
css=(root/'styles.css').read_text()
assert 'UI-REPORT2 compact chooser + internal overflow scrolling' in css
assert 'grid-template-columns:repeat(3,minmax(0,1fr))' in css
assert 'overflow-y:auto' in css
assert 'scrollbar-gutter:stable' in css
assert '.analysis-report-personal-actions button' in css
assert 'min-height:38px!important' in css
data=json.loads((root/'tickets.json').read_text())
byid={t['id']:t for t in data['tickets']}
assert byid['UI-REPORT2']['status']=='implemented'
assert byid['REPORT-SHARE3']['status']=='verified'
print('0.4.2 RC1 report chooser regression checks passed.')
