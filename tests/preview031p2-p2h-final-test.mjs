import fs from 'node:fs';
const app=fs.readFileSync('js/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('styles.css','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const todo=fs.readFileSync('TODO_0.3.1.md','utf8');
const checks=[
 ['Version Preview 2i sichtbar', html.includes('0.3.1 Preview 2i') && app.includes('0.3.1 Preview 2i')],
 ['Cache p2i konsistent', html.includes('0.3.1-p2i') && app.includes('0.3.1-p2i') && sw.includes('0.3.1-p2i')],
 ['Orientierungsschalter vorhanden', html.includes('id="fieldOrientationBtn"') && css.includes('.field-orientation-btn')],
 ['Nur aktive obere/untere Symbolhälfte', css.includes('.field-orientation-btn.active-top .orientation-half.top') && css.includes('.field-orientation-btn.active-bottom .orientation-half.bottom')],
 ['Orientierung im State', app.includes("fieldOrientation:'activeBottom'")],
 ['Oben/Unten tauscht Feldseiten', app.includes("const inputTop=top")],
 ['Positionsreihenfolge folgt Bildschirmseite', app.includes('function sideIsTopOnScreen') && app.includes('TOP_POS') && app.includes('BOTTOM_POS')],
 ['Toggle ändert nur Orientierung und rendert', app.includes("state.fieldOrientation=highlightedFieldIsTop()?'activeBottom':'activeTop';persist();render()")],
 ['Aktuelle Stammdaten-Trikotnummer führt', app.includes('const current=String(p?.defaultJersey') && app.includes('if(current)return current')],
 ['Trikotänderung aktualisiert Kaderreferenzen', app.includes('oldJersey!==newJersey') && app.includes('r.jersey=newJersey')],
 ['Links/Rechts bleibt TODO', todo.includes('Links-/Rechts-Orientierung')],
];
let ok=0;for(const [name,pass] of checks){console.log(`${pass?'OK':'FAIL'} ${name}`);if(pass)ok++;}
console.log(`${ok}/${checks.length}`);if(ok!==checks.length)process.exit(1);
