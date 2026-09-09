from pathlib import Path
root=Path(__file__).resolve().parents[1]
css=(root/'styles.css').read_text(encoding='utf-8')
checks=[
    '--report-radius-outer:12px' in css,
    '--report-radius-inner:8px' in css,
    '.team-report-head,' in css and 'border-radius:var(--report-radius-outer) var(--report-radius-outer) 0 0!important' in css,
    '.trainer-report-head' in css,
    'REPORT-STYLE1' in css,
]
if not all(checks):
    raise SystemExit('REPORT-STYLE1 check failed')
print('RC6-8 REPORT-STYLE1 checks passed.')
