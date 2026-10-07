import assert from 'node:assert/strict';
import {setReportLanguage,getReportLanguage} from '../js/analysis/report-language.js';
import {playerReportHtml,playerReportText} from '../js/analysis/player-report.js';

// UI language defaults to German in the Node test runtime; force report language only.
setReportLanguage('en');
assert.equal(getReportLanguage(),'en');

const report={
  playerName:'Nathna Nathongbor',
  subtitle:'2026-08-15 bis 2026-08-16',
  meta:[{label:'Zeitraum / Spiele',value:'2026-08-15 bis 2026-08-16'},{label:'Spiele',value:'2'},{label:'erfasste Aktionen',value:'13'}],
  summary:{actions:13,unrated:0,positiveRate:'23,1 %',neutralRate:'30,8 %',errorRate:'46,2 %',distribution:'#: 2 · +: 1 · 0: 4 · -: 2 · =: 4'},
  strengths:[{title:'Aufschlag als individuelle Stärke',text:'Bei 4 erfassten Aufschlag-Aktionen wurden 75,0 % positiv oder perfekt bewertet; 0,0 % lagen im neutralen/eingeschränkten und 25,0 % im negativen/fehlerhaften Bereich.'}],
  focus:[{title:'Annahme weiterentwickeln',text:'Bei 3 erfassten Annahme-Aktionen lagen 100,0 % im negativen/fehlerhaften Bereich; 0,0 % waren positiv/perfekt und 0,0 % neutral/eingeschränkt. Die Kennzahlen beschreiben die erfassten Aktionen im ausgewählten Zeitraum und keine allgemeine Bewertung der Spielerin.'}],
  techniques:[{action:'Aufschlag',n:4,distribution:'#: 2 · +: 1 · =: 1',positiveRate:'75,0 %',neutralRate:'0,0 %',errorRate:'25,0 %',unrated:0}],
  rotations:[{rotation:'R1',balance:1,n:4,neutral:0,unrated:0}],
  note:'Die Auswertung beschreibt ausschließlich die in VolleyTakt erfassten Aktionen im gewählten Zeitraum. Sie zeigt Zusammenhänge und Trainingshinweise, aber keine bewiesenen Ursachen. Einzelaktionsqualität und Rally-Ergebnis bleiben fachlich getrennt.'
};

const html=playerReportHtml(report);
const text=playerReportText(report);
for(const expected of [
  'Individual analysis',
  'This report shows the actions recorded for Nathna Nathongbor during the selected period.',
  'Key metrics',
  '# / + or high quality level',
  '− / = or low quality level',
  'Serve as an individual strength',
  'Develop reception',
  'These metrics describe the recorded actions in the selected period and are not a general evaluation of the player.',
  'Skills in the selected period',
  'Rotations in the individual context',
  'Key terms'
]) assert.ok(html.includes(expected),`missing English report content: ${expected}`);

for(const leak of [
  'Dieser Report zeigt','ausgewählten Zeitraum','Qualitätsstufe','bzw. hohe','bzw. niedrige',
  'Die Kennzahlen beschreiben','Individuelle Stärke','Persönlicher Entwicklungsfokus',
  'Techniken im ausgewählten Zeitraum','Rotationen im individuellen Kontext','Begriffe kurz erklärt'
]){
  assert.ok(!html.includes(leak),`German text leaked into English HTML report: ${leak}`);
  assert.ok(!text.includes(leak),`German text leaked into English text export: ${leak}`);
}

assert.ok(text.includes('Personal player report'));
assert.ok(text.includes('Serve as an individual strength'));
assert.ok(text.includes('Develop reception'));
console.log('REPORT-I18N1a RC3_1 checks passed.');
