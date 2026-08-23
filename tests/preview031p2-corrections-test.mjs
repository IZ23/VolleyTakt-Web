import fs from 'node:fs';
const app=fs.readFileSync('js/app.js','utf8');
const storage=fs.readFileSync('js/storage.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
const checks=[
 ['selection uses stable match type id', app.includes('function selectedMatchType(id)') && app.includes('mt.id===state.matchTypeId')],
 ['match setup cannot auto-create type', !app.includes('ensureMatchType(')],
 ['manual editor checks normalized redundancy', app.includes('matchTypeKey(x.name)===key')],
 ['normalization collapses whitespace', app.includes("replace(/\\s+/g,' ')" )],
 ['sync deduplicates central table', app.includes('});dedupeMatchTypes();saveMaster(master);')],
 ['import deduplicates central table', app.includes('v.master};dedupeMatchTypes();saveMaster(master);')],
 ['ordered types return records with ids', storage.includes('return {top:[...topRows]') && !storage.includes('topRows.map(r=>r.name)')],
 ['quick scouting is not a match-type option', !app.includes('<option value="__quick__"')],
 ['regular and quick courts have explicit classes', app.includes("'quick-scout-court'") && app.includes("'regular-scout-court'")],
 ['quick court has separate neutral styling', css.includes('.court.quick-scout-court')],
 ['opponent off forces own context', app.includes("if(!state.opponentCapture)state.activeTeamContext='own'")],
];
let ok=0;for(const [n,v] of checks){console.log(v?'PASS':'FAIL',n);if(v)ok++}console.log(`${ok}/${checks.length}`);if(ok!==checks.length)process.exit(1);
