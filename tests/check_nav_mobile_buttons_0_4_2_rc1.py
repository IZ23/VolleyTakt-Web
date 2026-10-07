from pathlib import Path
app=Path('js/app.js').read_text()
css=Path('styles.css').read_text()
checks={
 'inactive handler': "$('#toggleInactivePlayers').onclick" in app and 'showInactivePlayers' in app,
 'matchtypes drawer route': "matchtypes:drawMatchTypes" in app and "openDrawer('matchtypes')" in app,
 'video drawer route': "videoassignments:drawVideoAssignments" in app and "openDrawer('videoassignments')" in app,
 'shortcuts drawer route': "shortcuts:drawShortcutSettings" in app and "openDrawer('shortcuts')" in app,
 'drawer top groups': "matchtypes:'prep'" in app and "videoassignments:'prep'" in app and "shortcuts:'settings'" in app,
 'ios visual viewport class': "root.classList.toggle('platform-ios',ios)" in app,
 'mobile start class': "root.classList.toggle('viewport-mobile-start',mobileInstallContext())" in app,
 'ios safe css': '.platform-ios .topbar' in css and '.platform-ios .start-gate' in css,
 'mobile start buttons visible': '.viewport-mobile-start .start-card>.start-actions>button' in css,
}
for name,ok in checks.items():
    assert ok,name
print('Navigation/mobile button static checks passed.')
