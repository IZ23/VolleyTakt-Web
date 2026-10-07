import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MESSAGES_DE,MESSAGES_EN} from '../js/locales/messages.js';
import {t,tr} from '../js/i18n.js';
import {helpContent} from '../js/locales/help-content.js';
import {setReportLanguage} from '../js/analysis/report-language.js';
import {teamReportHtml} from '../js/analysis/team-report.js';
import {playerReportHtml} from '../js/analysis/player-report.js';
import {trainerReportHtml,trainerShortReportHtml} from '../js/analysis/trainer-report.js';

// 1) Effective catalogue parity.
assert.deepEqual([...Object.keys(MESSAGES_DE)].sort(),[...Object.keys(MESSAGES_EN)].sort(),'DE/EN effective catalogue keys must match');
assert.ok(Object.keys(MESSAGES_DE).length>=1200,'expected broad modular catalogue coverage');

// 2) Important domain modules must be wired into the aggregator.
const messages=fs.readFileSync(new URL('../js/locales/messages.js',import.meta.url),'utf8');
for(const mod of ['domains/ui.js','domains/analysis.js','domains/reports.js','domains/match.js','domains/runtime.js','domains/shell.js','domains/forms.js','domains/camera.js','domains/sync.js','domains/volleyball.js']) assert.ok(messages.includes(mod),`missing modular locale domain ${mod}`);

// 3) High-risk UI strings that regressed in RC3 must resolve semantically.
for(const [key,de,en] of [
 ['prep.masterRoster','Stammdaten & Kader','Master data & rosters'],
 ['data.migration','Datenmigration / Sicherung','Data migration / backup'],
 ['match.library','Spielbibliothek','Match library'],
 ['match.videoAssignments','Videospeicher / Zuordnung','Video storage / assignment'],
 ['analysis.view.priorityA','Spielsteuerung im Überblick','Match management overview'],
 ['settings.videoCut','Videoschnitt','Video editing'],
 ['report.language','Reportsprache','Report language'],
 ['help.title','Hilfe','Help']
]){assert.equal(t(key,{},'de'),de,key);assert.equal(t(key,{},'en'),en,key)}

// 4) Tour and critical shell use semantic keys rather than embedded German prose.
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(app,/titleKey:`tour\.\$\{n\}\.title`/);
assert.doesNotMatch(app,/const TOUR_STEPS=\[[\s\S]*Sofort starten: Spontan scouten/);
for(const literal of ['Spielbibliothek <span','Videospeicher / Zuordnung</button>','Stammdaten & Kader</h3>','Datenmigration / Sicherung</h3>']) assert.ok(!app.includes(literal),`hard-coded visible UI text remains: ${literal}`);
for(const key of ['startup.quick','startup.install','startup.localTime','nav.match','nav.prep','nav.data','nav.help','nav.settings','common.cancel','common.apply']) assert.ok(index.includes(`data-i18n-key="${key}"`)||index.includes(`data-i18n-aria-key="${key}"`),`index shell not keyed: ${key}`);

// 5) English help must not fall back to the former German body.
const helpEn=JSON.stringify(helpContent('en'));
for(const word of ['Stammdaten & Kader','Sofort scouten – Spontan-Scouting','Typische Fallstricke','Datenverwaltung']) assert.ok(!helpEn.includes(word),`German help leakage: ${word}`);

// 6) Reports: independent report language must localize the complete rendered body, not just the window chrome.
setReportLanguage('en');
const team={title:'Team-Analyse · 2 Spiele',subtitle:'2026-08-15 bis 2026-08-16',meta:[{label:'Spiele',value:'2'}],strengths:[{title:'Druck bei eigenem Aufschlag',text:'Bei eigenem Aufschlag haben wir 64,3 % der Rallys gewonnen. Das war stärker als unser Sideout.'}],focus:[{title:'R1 braucht Aufmerksamkeit',text:'In R1 haben wir 5 Rallys mehr verloren als gewonnen. Das beschreibt die Mannschaftssituation, nicht eine einzelne Spielerin.'}],training:[{text:'Annahme unter Rotationsbedingungen: Ziel ist ein Ball, mit dem mehrere Angriffsoptionen offenbleiben.'}],metrics:[{label:'Punkt nach gegnerischem Aufschlag (K1 / Sideout)',value:'25 %',note:'4 Rallys'}],rotations:[{rotation:'R1',balance:-5,rallies:10}],note:'Die Hinweise beschreiben Mannschaftsmuster aus den erfassten Daten. Sie sind keine Bewertung einzelner Spielerinnen und keine Kausalitätsbeweise.'};
const player={playerName:'Nathna',subtitle:'2026-08-15 bis 2026-08-16',meta:[{label:'Zeitraum / Spiele',value:'x'},{label:'Spiele',value:'2'},{label:'erfasste Aktionen',value:'13'}],summary:{actions:13,unrated:0,positiveRate:'23,1 %',neutralRate:'30,8 %',errorRate:'46,2 %',distributionText:'#: 2 · +: 1 · 0: 4 · -: 2 · =: 4'},strengths:[{title:'Aufschlag als individuelle Stärke',text:'Bei 4 erfassten Aufschlag-Aktionen wurden 75,0 % positiv oder perfekt bewertet; 0,0 % lagen im neutralen/eingeschränkten und 25,0 % im negativen/fehlerhaften Bereich.'}],focus:[{title:'Annahme weiterentwickeln',text:'Bei 3 erfassten Annahme-Aktionen lagen 100,0 % im negativen/fehlerhaften Bereich; 0,0 % waren positiv/perfekt und 0,0 % neutral/eingeschränkt.'}],techniques:[{action:'Aufschlag',n:4,distribution:'#: 2 · +: 1 · =: 1',positiveRate:'75%',neutralRate:'0%',errorRate:'25%',unrated:0}],rotations:[{rotation:'R1',balance:1,n:4,neutral:0,unrated:0}],note:'Die Auswertung beschreibt ausschließlich die in VolleyTakt erfassten Aktionen im gewählten Zeitraum. Sie zeigt Zusammenhänge und Trainingshinweise, aber keine bewiesenen Ursachen. Einzelaktionsqualität und Rally-Ergebnis bleiben fachlich getrennt.'};
const trainer={title:'Traineranalyse · 2 Spiele',meta:[{label:'Spiele',value:'2'}],overview:{rallyRate:'50 %',rallies:10,best:'R6',worst:'R1'},priorities:[{title:'K1 / Sideout priorisieren',finding:'Sideout 30 %; First Ball 10 %.',interpretation:'Die Mannschaft löst gegnerischen Aufschlag aktuell deutlich seltener direkt oder früh. Annahme, Zuspiel und erster Angriff sollten als gemeinsame Kette betrachtet werden.',next:'Nach Rotation und Annahmequalität differenzieren; anschließend Zuspielverteilung und ersten Angriff prüfen.',confidence:'mittel',sample:10}],phases:[{title:'K1 · nach gegnerischem Aufschlag',metrics:[['Sideout','30 %'],['First Ball','10 %'],['Annahme +/#','40 %']],text:'Sideout und First Ball gemeinsam mit Annahme und erstem Angriff betrachten.'}],rotations:[{rotation:'R1',rallies:5,balance:-2,k1:'30%',firstBall:'10%',k2:'40%',k3:'–',rec:'40%'}],techniques:[{title:'Annahme',value:'40%',label:'positiv/perfekt',text:'Mit K1 und First Ball verknüpfen.'}],players:[{player:'AB',actions:3,k1:2,k2:1,k3:0}],opponent:[{label:'Gegnerangriffe',value:'3'}],training:['K1 in der kritischsten Rotation unter realem Aufschlagdruck trainieren: Annahme → Zuspielentscheidung → erster Angriff.'],note:'Interpretationen sind datenabhängige Trainerhinweise. Sie zeigen Zusammenhänge und Hypothesen, aber keine bewiesenen Ursachen.'};
const bodies=[teamReportHtml(team),playerReportHtml(player),trainerReportHtml(trainer),trainerShortReportHtml(trainer)].join('\n');
const germanLeak=/\b(?:Spielerinnen|Aufschlag|Annahme|Zuspiel|Angriff|Gegnerangriffe|Erkenntnisse|Trainingsprioritäten|Begriffe|Zeitraum|erfasste|gewonnene|verlorene|weiterentwickeln)\b/i;
assert.ok(!germanLeak.test(bodies),`German report text leaked into English report: ${bodies.match(germanLeak)?.[0]}`);

// 7) Semantic translations preserve volleyball terminology.
for(const [de,en] of [['Aufschlag','Serve'],['Annahme','Reception'],['Zuspiel','Set'],['Angriff','Attack'],['Abwehr','Dig'],['Spielerin','Player']]) assert.equal(tr(de,'en'),en,de);

console.log(`RC3_1 modular i18n audit passed: ${Object.keys(MESSAGES_DE).length} paired keys, UI/help/report regression checks OK.`);
