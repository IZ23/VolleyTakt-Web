import assert from 'node:assert/strict';
import fs from 'node:fs';
import {rt,setReportLanguage,getReportLanguage} from '../js/analysis/report-language.js';
import {tr} from '../js/i18n.js';

setReportLanguage('en');
assert.equal(getReportLanguage(),'en');
assert.equal(rt('Team-Analyse · 2 Spiele'),'Team analysis · 2 matches');
assert.equal(rt('Persönlicher Spielerinnenreport'),'Personal player report');
assert.equal(rt('Aufschlag als individuelle Stärke'),'Serve as an individual strength');
assert.equal(rt('Annahme weiterentwickeln'),'Develop reception');
assert.equal(rt('Reportsprache'),'Report language');
assert.equal(rt('Die Reportsprache ist unabhängig von der Sprache der Benutzeroberfläche.'),'The report language is independent of the user interface language.');

for (const [de,en] of [
 ['Saison','Season'],['Gegner','Opponent'],['Spielart','Match type'],['Spielerin','Player'],['Technik','Skill'],['Satz','Set'],
 ['Spielübersicht','Match overview'],['Rallyquote Wir','Our rally win rate'],['Aufschlag','Serve'],['Annahme','Reception'],['Zuspiel','Set'],['Angriff','Attack'],
 ['Erfolgreich','Successful'],['Neutral / eingeschränkt','Neutral / limited'],['Fehlerhaft','Errors'],['Alle abspielen','Play all'],['Aus Auswahl Video erzeugen','Create video from selection']
]) assert.equal(tr(de,'en'),en,`missing English UI translation: ${de}`);

const resultWindow=fs.readFileSync(new URL('../js/analysis/result-window.js',import.meta.url),'utf8');
assert.match(resultWindow,/id="analysisReportLanguage"/);
assert.match(resultWindow,/setReportLanguage\(reportLanguage\)/);
assert.match(resultWindow,/t\('report\.language'\)/);
console.log('REPORT-I18N1 RC3 checks passed.');
