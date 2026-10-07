import assert from 'node:assert/strict';
import {rt,localizeReport} from '../js/analysis/report-language.js';

const exact={
  'Report erzeugen':'Create report',
  'Für Spielerinnen · Team':'For players · team',
  'Persönlicher Spielerinnenreport':'Personal player report',
  'Für Trainer':'For coaches',
  'Unser Spiel in kurzen Worten':'Our match in brief',
  '✓ Das lief gut':'✓ What worked well',
  '→ Hier können wir besser werden':'→ Where we can improve',
  '🏐 Fokus fürs nächste Training':'🏐 Focus for the next practice',
  'Individuelle Auswertung':'Individual analysis',
  'Kernwerte':'Key metrics',
  '✓ Individuelle Stärke':'✓ Individual strength',
  '→ Persönlicher Entwicklungsfokus':'→ Personal development focus',
  'Techniken im ausgewählten Zeitraum':'Skills in the selected period',
  'Rotationen im individuellen Kontext':'Rotations in the individual context',
  'Begriffe kurz erklärt':'Key terms'
};
for(const [de,en] of Object.entries(exact)) assert.equal(rt(de,'en'),en,`missing report translation: ${de}`);
const dynamic=[
  ['Team-Analyse · 2 Spiele','Team analysis · 2 matches'],
  ['R6 war stabil','R6 was stable'],
  ['R1 braucht Aufmerksamkeit','R1 needs attention'],
  ['Aufschlag als individuelle Stärke','Serve as an individual strength'],
  ['Annahme weiterentwickeln','Develop reception']
];
for(const [de,en] of dynamic) assert.equal(rt(de,'en'),en,`missing dynamic report translation: ${de}`);
const report=localizeReport({title:'Team-Analyse · 2 Spiele',meta:[{label:'Spiele',value:'2'}],note:'Die Hinweise beschreiben Mannschaftsmuster aus den erfassten Daten. Sie sind keine Bewertung einzelner Spielerinnen und keine Kausalitätsbeweise.'},'en');
assert.equal(report.title,'Team analysis · 2 matches');
assert.equal(report.meta[0].label,'Matches');
assert.ok(!/[äöüß]|\b(Spielerinnen|Spiele|Hinweise)\b/.test(report.note));
console.log('Report i18n RC3 checks passed.');
