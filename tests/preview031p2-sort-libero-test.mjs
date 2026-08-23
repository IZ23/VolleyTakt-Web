import fs from 'node:fs';
const app=fs.readFileSync('js/app.js','utf8');
const checks=[
 ['player sort setting defaults to jersey', app.includes("playerSort:'jersey'")],
 ['player sort has all requested modes', app.includes('value=\"jersey\"')&&app.includes('value=\"abbreviation\"')&&app.includes('value=\"firstName\"')],
 ['player sort is saved in settings', app.includes("settings.ui.playerSort=$('#playerSort')?.value||'jersey'")&&app.includes('saveSettings(settings)')],
 ['shared selection sorter exists', app.includes('function sortPlayerSelectionRows(rows')],
 ['lineup player rows use shared sorter', app.includes('const playerRows=sortPlayerSelectionRows(')],
 ['change candidates use shared sorter', app.includes('regularRows=sortPlayerSelectionRows(regularRows,side);liberoRows=sortPlayerSelectionRows(liberoRows,side);')],
 ['lineup asks only one start libero', app.includes('Start-Libero für Satz')&&app.includes('name=\"libero1\"')&&!app.includes('name=\"libero2\"')],
 ['saved set libero list is capped to one', app.includes("filter(Boolean).slice(0,1)")],
 ['second roster libero remains available for replacement', !app.includes('const designated=new Set(setLiberosForSide(side))')],
];
let ok=0;for(const [n,v] of checks){console.log(v?'PASS':'FAIL',n);if(v)ok++}console.log(`${ok}/${checks.length}`);if(ok!==checks.length)process.exit(1);
