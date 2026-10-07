from pathlib import Path
root=Path(__file__).resolve().parents[1]
sync=(root/'js/sync.js').read_text(encoding='utf-8')
relay=(root/'sync/nextcloud.php').read_text(encoding='utf-8')
app=(root/'js/app.js').read_text(encoding='utf-8')
assert "'DELETE'" in relay
assert 'async deleteSession(matchId)' in sync
assert "row?.deleted&&x?.matchId" not in sync  # guard against accidental typo in predicate
assert "x=>x?.deleted&&x?.matchId" in sync
assert "await p.deleteSession(matchId)" in sync
assert "removed-with-cloud-residue" in sync
assert "result?.warning" in app
print('RC1 SYNC-CLEANUP1 regression checks passed.')
