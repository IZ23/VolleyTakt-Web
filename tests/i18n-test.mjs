import {EXACT_EN,FRAGMENTS_EN} from '../js/locales/en.js';
function translate(s){if(EXACT_EN[s])return EXACT_EN[s];let out=s;for(const [a,b] of Object.entries(FRAGMENTS_EN).sort((x,y)=>y[0].length-x[0].length))out=out.split(a).join(b);return out}
const cases=new Map([
 ['Livescouting öffnen','Open live scouting'],
 ['Bedienung & Hilfe','Controls & Help'],
 ['Spiel einrichten','Set up match'],
 ['Spielerinnen – Übersicht','Players – overview'],
 ['Synchronisation','Synchronization'],
 ['Die lokale Zeit startet erst auf ausdrücklichen Befehl. Die verbundene Kamera setzt den Zeitanker erst nach bestätigter Aufnahme.','Local time starts only on an explicit command. The connected camera sets the time anchor only after recording has been confirmed.'],
 ['0.3.0 Preview 8 verwendet ein modulares Sprachsystem. Alle aktuellen Beschriftungen, Erklärungen, Hilfe-, Status- und Fehlermeldungen stehen in Deutsch und Englisch zur Verfügung.','0.3.0 Preview 8 uses a modular language system. All current labels, explanations, help, status and error messages are available in German and English.']
]);
for(const [de,en] of cases){const got=translate(de);if(got!==en)throw new Error(`i18n mismatch: ${de} => ${got}`)}
console.log('VolleyTakt i18n catalogue smoke test: OK');
