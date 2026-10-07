from pathlib import Path

app = Path("js/app.js").read_text(encoding="utf-8")

# Regression UI-MATCH2: selecting a match type while the New Match editor is open
# must remain local form state and must not invoke the global state-changing handler.
needle = "if(mtSel)mtSel.onchange=()=>{if(matchEditorMode!==\'new\')changeMatchTypeFromUi(mtSel.value)};"
assert needle in app, "new-match mType handler must not call changeMatchTypeFromUi in new mode"

# The apply action remains the commit point for all entered values.
apply_start = app.index("$('#applyMatch').onclick=()=>{")
apply_end = app.index("\n };", apply_start)
apply_block = app[apply_start:apply_end]
for field in ["#mDate", "#mSeason", "#mOwn", "#mOpp", "#mType", "#mMatchMode"]:
    assert field in apply_block, f"{field} must be committed by Spiel übernehmen"

match_locale = Path("js/locales/domains/match.js").read_text(encoding="utf-8")
assert "match.applyHelp" in app, "new-match help must use semantic i18n key"
assert "Die Spielangaben werden erst mit „Spiel übernehmen“ angelegt." in match_locale
print("UI-MATCH2 new-match form regression check passed.")
