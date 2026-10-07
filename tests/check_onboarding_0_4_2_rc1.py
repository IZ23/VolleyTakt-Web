from pathlib import Path
root=Path(__file__).resolve().parents[1]
app=(root/'js/app.js').read_text()
help_content=(root/'js/locales/help-content.js').read_text()
idx=(root/'index.html').read_text()
css=(root/'styles.css').read_text()
assert "const TOUR_VERSION='tour-5'" in app
assert "t('help.quickStart')" in app
assert 'Typische Fallstricke' in help_content and 'Common pitfalls' in help_content
assert 'WER und WO sind unterschiedliche Informationen' in help_content and 'WHO and WHERE are different dimensions' in help_content
assert 'openQuickStartFromGate' in app and 'openQuickStartFromApp' in app
assert 'id="startQuickBtn"' in idx and 'id="mainQuickStartBtn"' in idx
assert '.help-pitfalls' in css
print('0.4.2 RC1 onboarding/quick-start checks passed.')

assert 'A · Sofort scouten' in help_content and 'A · Scout immediately' in help_content
assert 'help-quick-spontan' in help_content and 'help-quick-regular' in help_content and 'help-quick-pitfalls' in help_content
assert 'Du musst nicht zuerst Stammdaten anlegen' in help_content and 'You do not need to create master data first' in help_content
assert '.quickstart-branches' in css and '.quickstart-branch' in css
