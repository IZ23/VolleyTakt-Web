import fs from 'node:fs';
const app=fs.readFileSync(new URL('../js/app.js', import.meta.url),'utf8');
const storage=fs.readFileSync(new URL('../js/storage.js', import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css', import.meta.url),'utf8');
const checks=[
 ['preview9 lineage', (html.includes('0.3.0 Preview 9')||html.includes('0.3.1 Preview 1')) && (app.includes("TOUR_VERSION='0.3.0-p9a'")||app.includes("TOUR_VERSION='0.3.1-p1'"))],
 ['dual timestamps', ['action_start_seconds','action_start_timestamp','action_end_seconds','action_end_timestamp'].every(x=>storage.includes(`'${x}'`)) && app.includes('state.actionStartedSeconds=currentSeconds()')],
 ['start frozen on first WER', app.includes('const firstWer=!state.pendingSide&&!state.selectedPlayerPos')],
 ['nine zones', app.includes('OWN_COURT_ZONES=[4,3,2,7,8,9,5,6,1]') && app.includes('OPP_COURT_ZONES=[1,6,5,9,8,7,2,3,4]') && css.includes('.court.nine-zone')],
 ['p7-p9 not WER', app.includes('WER kann nur über P1–P6 gewählt werden. P7–P9 sind Dokumentationszonen.')],
 ['secondary target court', html.includes('secondaryCourt') && app.includes('chooseTargetZone')],
 ['own attack target', app.includes("detailedCapture(side)&&['Angriff','Aufschlag'].includes(action)")],
 ['setter tempo', app.includes("['T0','Tempo 0 · sehr schnell']") && app.includes("['T3','Tempo 3 · hoch']")],
 ['setter distance', storage.includes("'set_tempo'") && storage.includes("'set_distance'") && app.includes('SET_DISTANCES')],
 ['setter target zone', app.includes("if(action==='Zuspiel')return side") && app.includes("state.pendingAction==='Zuspiel'?'WOHIN · Zuspiel'")],
 ['help updated', app.includes('Gegner oben spiegelbildlich P1/P6/P5 – P9/P8/P7 – P2/P3/P4') && app.includes('Start- und Endmarker')]
];
for(const [name,ok] of checks){if(!ok)throw new Error(`Preview 9 check failed: ${name}`)}
console.log(`Preview 9 extended scouting: OK (${checks.length}/${checks.length})`);
