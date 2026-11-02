from pathlib import Path
root=Path(__file__).resolve().parents[1]
app=(root/'js/app.js').read_text()
idx=(root/'index.html').read_text()
assert "function updateStartQuickVisibility(){const b=$('#startQuickBtn');if(!b)return;b.hidden=false;b.setAttribute('aria-hidden','false')}" in app
assert "if(settings.ui?.tourDismissedVersion===TOUR_VERSION)return;startTour(false)" in app
assert "id=\"startQuickBtn\"" in idx
assert "browserCameraNotice" in idx
print('0.4.3.5 startup quick-start checks passed.')
