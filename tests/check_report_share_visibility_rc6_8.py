from pathlib import Path
root=Path(__file__).resolve().parents[1]
rw=(root/'js/analysis/result-window.js').read_text(encoding='utf-8')
checks=[
    'function nativeShareUiAvailable()' in rw,
    "typeof navigator.share!=='function'" in rw,
    'navigator.userAgentData?.mobile===true' in rw,
    '/Android|iPhone|iPad|iPod/i' in rw,
    "navigator.platform==='MacIntel'" in rw,
    "nativeShareUiAvailable()?'<button id=\"teamReportShare\">Teilen</button>':''" in rw,
    "nativeShareUiAvailable()?'<button id=\"trainerReportShare\">Teilen</button>':''" in rw,
    "if(shareButton)shareButton.onclick" in rw,
]
if not all(checks):
    raise SystemExit('REPORT-SHARE2B visibility check failed')
print('RC6-8 REPORT-SHARE2B share visibility checks passed.')
