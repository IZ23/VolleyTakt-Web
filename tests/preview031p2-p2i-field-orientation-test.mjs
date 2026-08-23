import fs from 'node:fs';
const app=fs.readFileSync('js/app.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
const html=fs.readFileSync('index.html','utf8');
const checks=[
 ['visible p2i version',html.includes('Preview 2i')&&html.includes('0.3.1-p2i')],
 ['single scout uses marked side',app.includes('singleScout:true')&&app.includes('netAfter:markedTop')],
 ['marked top maps to net after',app.includes("netAfter:markedTop")&&app.includes("const markedTop=highlightedFieldIsTop()")],
 ['single scout mirrored zones',app.includes('const inputTop=top')&&app.includes('inputTop?OPP_COURT_ZONES:OWN_COURT_ZONES')&&app.includes('inputTop?TOP_POS:BOTTOM_POS')],
 ['both scouted dual court',app.includes('const bothScouted=!!state.opponentCapture')&&app.includes('const dual=bothScouted||targetMode')],
 ['shared net only dual',app.includes("sharedNet.hidden=!dual")],
 ['6-zone net before/after css',css.includes('.court.net-after')&&css.includes('.court.net-before')],
 ['9-zone net before/after css',css.includes('.court.nine-zone.net-after')&&css.includes('.court.nine-zone.net-before')],
 ['orientation icon active semantics',css.includes('.field-orientation-btn.active-top')&&css.includes('.field-orientation-btn.active-bottom')],
 ['left-right todo retained',fs.readFileSync('TODO_0.3.1.md','utf8').includes('Links-/Rechts-Orientierung')],
];
let ok=0;for(const [n,v] of checks){console.log(`${v?'PASS':'FAIL'} ${n}`);if(v)ok++;}
console.log(`${ok}/${checks.length}`);if(ok!==checks.length)process.exit(1);
