import fs from 'node:fs';
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const checks=[
 ['version',html.includes('0.3.1 Preview 2')&&app.includes("TOUR_VERSION='0.3.1-p2i'")],
 ['overview',app.includes('function analysisOverview')&&app.includes('Spiel- / Satzübersicht')],
 ['rotation dashboard',app.includes('function analysisRotationTable')&&app.includes('First Ball')],
 ['k1 k2',app.includes('function analysisK1K2Table')&&app.includes('First-Ball-Sideout')&&app.includes('K2 Breakpoint')],
 ['serve analysis',app.includes('function analysisServeTable')&&app.includes('serve_technique')&&app.includes('Gegner +/#')],
 ['reception analysis',app.includes('function analysisReceptionTable')&&app.includes('Sideout danach')],
 ['set distribution',app.includes('function analysisSetTable')&&app.includes('set_tempo')&&app.includes('set_distance')],
 ['attack source target',app.includes('function analysisAttackTable')&&app.includes('Angriff · Quelle → Ziel')],
 ['attack efficiency',app.includes('(g.kill-g.err-g.blocked)/g.n')],
 ['context chains',app.includes('function analysisChainsTable')&&app.includes('Annahme → Zuspiel → Angriff')],
 ['opponent tendencies',app.includes('function analysisOpponentTable')&&app.includes('Gegner-Tendenzen')],
 ['same model sparse details',app.includes('gleiche Datenbasis für einfaches und detailliertes Scouting')],
 ['compare retained',app.includes('Zeitraum A mit B vergleichen')&&app.includes("renderView(view,eb,mb)")],
 ['responsive analysis',css.includes('.analysis-split')&&css.includes('@media(max-width:680px)')]
];
for(const [name,ok] of checks){if(!ok)throw new Error(`0.3.1 Preview 2 analysis check failed: ${name}`)}
console.log(`0.3.1 Preview 2 analysis: OK (${checks.length}/${checks.length})`);
