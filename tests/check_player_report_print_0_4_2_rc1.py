from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
css=(ROOT/'styles.css').read_text(encoding='utf-8')
js=(ROOT/'js/analysis/player-report.js').read_text(encoding='utf-8')
required=[
 'REPORT-PLAYER-LAYOUT1',
 '.team-report.player-report',
 '"metrics metrics"',
 '"table table"',
 '"rotations glossary"',
 'table-layout:fixed!important',
 'overflow-wrap:anywhere!important',
 'width:198mm!important',
 'max-width:100%!important'
]
for item in required:
    assert item in css, f'missing print safeguard: {item}'
for cls in ['team-report-metrics','player-report-table','team-report-rotations','team-report-glossary']:
    assert cls in js, f'missing report section: {cls}'
print('player report A4 print regression checks passed')
