import fs from 'node:fs';
const app=fs.readFileSync('js/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const checks=[
 ['default orientation blue bottom',app.includes("fieldOrientation:'activeBottom'")],
 ['new regular match resets bottom',app.includes("state.servingSide='';state.fieldOrientation='activeBottom'")],
 ['quick scout inherits bottom default',app.includes("state={...defaultState,quickScout:true")],
 ['opponent switch hidden when capture off',app.includes("opponentSwitch.hidden=!state.opponentCapture")],
 ['settings disable opponent context',app.includes("state.opponentCapture=$('#setOpp').checked;if(!state.opponentCapture)state.activeTeamContext='own'")],
 ['game setup disable opponent context',app.includes("state.opponentCapture=$('#mCaptureOpponent').checked;if(!state.opponentCapture)state.activeTeamContext='own'")],
 ['orientation toggle remains independent',html.includes('id="fieldOrientationBtn"')&&html.includes('id="opponentToggle"')],
 ['cache r3',html.includes('0.3.1-p2i-r3')&&sw.includes('0.3.1-p2i-r3')],
];
let ok=0;for(const [n,v] of checks){console.log(`${v?'PASS':'FAIL'} ${n}`);if(v)ok++;}console.log(`${ok}/${checks.length}`);if(ok!==checks.length)process.exit(1);
