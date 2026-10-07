import {getLanguage} from '../i18n.js';
import {REPORT_PHRASES_EN as EXACT_EN,REPORT_TECH_EN as TECH_EN} from '../locales/domains/report-phrases.js';

let reportLanguageOverride=null;
export function setReportLanguage(lang=null){reportLanguageOverride=lang==='en'?'en':lang==='de'?'de':null;return getReportLanguage();}
export function getReportLanguage(){return reportLanguageOverride||getLanguage();}

function decimalEnglish(s){return String(s).replace(/(\d),(\d)(?=\s*%)/g,'$1.$2');}
function translateDynamic(s){
 let m;
 if((m=s.match(/^Team-Analyse · (\d+) Spiele$/)))return `Team analysis · ${m[1]} matches`;
 if((m=s.match(/^Traineranalyse · (\d+) Spiele$/)))return `Coach analysis · ${m[1]} matches`;
 if((m=s.match(/^(\d{4}-\d{2}-\d{2}) bis (\d{4}-\d{2}-\d{2})$/)))return `${m[1]} to ${m[2]}`;
 if((m=s.match(/^(.+) · Persönlicher Spielerinnenreport$/)))return `${m[1]} · Personal player report`;
 if((m=s.match(/^(.+) war stabil$/)))return `${m[1]} was stable`;
 if((m=s.match(/^In (R\d+) haben wir insgesamt mehr Rallys gewonnen als verloren \(([^)]+)\)\.$/)))return `In ${m[1]} we won more rallies than we lost overall (${m[2].replace(' bei ',' over ')}).`;
 if((m=s.match(/^In (R\d+) haben wir (\d+) Rallys mehr verloren als gewonnen\. Das beschreibt die Mannschaftssituation, nicht eine einzelne Spielerin\.$/)))return `In ${m[1]} we lost ${m[2]} more rallies than we won. This describes the team situation, not an individual player.`;
 if((m=s.match(/^(R\d+) braucht Aufmerksamkeit$/)))return `${m[1]} needs attention`;
 if((m=s.match(/^Annahme in (R\d+) stabilisieren$/)))return `Stabilize reception in ${m[1]}`;
 if((m=s.match(/^Die positive Annahme in (R\d+) lag mit (.+) unter unserem Gesamtwert von (.+)\.$/)))return `Positive reception in ${m[1]} was ${decimalEnglish(m[2])}, below our overall value of ${decimalEnglish(m[3])}.`;
 if((m=s.match(/^Bei eigenem Aufschlag haben wir (.+) der Rallys gewonnen\. Das war stärker als unser Sideout\.$/)))return `On our own serve we won ${decimalEnglish(m[1])} of rallies. That was stronger than our side-out.`;
 if((m=s.match(/^Nach unserem Aufschlag haben wir (.+) der Rallys gewonnen\. Ass und Fehler werden dabei getrennt betrachtet\.$/)))return `After our serve we won ${decimalEnglish(m[1])} of rallies. Aces and errors are considered separately.`;
 if((m=s.match(/^(.+) der erfassten Annahmen waren positiv\/perfekt; unser Sideout lag bei (.+)\.$/)))return `${decimalEnglish(m[1])} of recorded receptions were positive/perfect; our side-out rate was ${decimalEnglish(m[2])}.`;
 if((m=s.match(/^Die erfasste Angriffseffizienz lag bei (.+)\.$/)))return `Recorded attack efficiency was ${decimalEnglish(m[1])}.`;
 if((m=s.match(/^Unser Sideout lag bei (.+), aber nur (.+) wurden direkt mit dem ersten Angriff beendet\. Hier liegt Potenzial in Annahme, Zuspiel und Angriff zusammen\.$/)))return `Our side-out rate was ${decimalEnglish(m[1])}, but only ${decimalEnglish(m[2])} ended directly with the first attack. This points to potential across reception, setting and attack together.`;
 if((m=s.match(/^Nach Block\/Abwehr haben wir (.+) der erkannten Transitionen gewonnen\. Wir können den Übergang zum Gegenangriff klarer machen\.$/)))return `After block/defense we won ${decimalEnglish(m[1])} of recognized transitions. We can make the transition into the counterattack more structured.`;
 if((m=s.match(/^Aufschlagfehler (.+), Asse (.+)\. Entscheidend ist ein gutes Verhältnis zwischen Druck und Fehlern\.$/)))return `Serve errors ${decimalEnglish(m[1])}, aces ${decimalEnglish(m[2])}. The key is a good balance between pressure and errors.`;
 if((m=s.match(/^Wir haben (.+) der abgeschlossenen Rallys gewonnen\. Das ist unsere Ausgangsbasis für die nächste Einheit\.$/)))return `We won ${decimalEnglish(m[1])} of completed rallies. That is our baseline for the next practice.`;
 if((m=s.match(/^Bei (\d+) erfassten (.+)-Aktionen wurden (.+) positiv oder perfekt bewertet; (.+) lagen im neutralen\/eingeschränkten und (.+) im negativen\/fehlerhaften Bereich\.(.*)$/)))return `Of ${m[1]} recorded ${TECH_EN[m[2]]||m[2]} actions, ${decimalEnglish(m[3])} were rated positive or perfect; ${decimalEnglish(m[4])} were neutral/limited and ${decimalEnglish(m[5])} negative/error.${m[6]?' '+rt(m[6].trim(),'en'):''}`;
 if((m=s.match(/^Bei (\d+) erfassten (.+)-Aktionen lagen (.+) im negativen\/fehlerhaften Bereich; (.+) waren positiv\/perfekt und (.+) neutral\/eingeschränkt\.(.*)$/)))return `Of ${m[1]} recorded ${TECH_EN[m[2]]||m[2]} actions, ${decimalEnglish(m[3])} were negative/error; ${decimalEnglish(m[4])} were positive/perfect and ${decimalEnglish(m[5])} neutral/limited.${m[6]?' '+rt(m[6].trim(),'en'):''}`;
 if((m=s.match(/^(\d+) Aktion\(en\) enthalten keine WIE-Bewertung\.$/)))return `${m[1]} action(s) have no quality rating.`;
 if((m=s.match(/^(.+) als individuelle Stärke$/)))return `${TECH_EN[m[1]]||m[1]} as an individual strength`;
 if((m=s.match(/^(.+) weiterentwickeln$/)))return `Develop ${String(TECH_EN[m[1]]||m[1]).toLowerCase()}`;
 if((m=s.match(/^ohne WIE: (\d+)$/)))return `without rating: ${m[1]}`;
 if((m=s.match(/^(.+) Aktionen · (\d+) neutral\/eingeschr\.(.*)$/)))return `${m[1]} actions · ${m[2]} neutral/limited${m[3]}`;
 if((m=s.match(/^Rallybilanz ([+-]?\d+) bei (\d+) Rallys; K1 (.+)\.$/)))return `Rally balance ${m[1]} over ${m[2]} rallies; K1 ${decimalEnglish(m[3])}.`;
 if((m=s.match(/^Gesamte Angriffseffizienz (.+)\.$/)))return `Overall attack efficiency ${decimalEnglish(m[1])}.`;
 if((m=s.match(/^Breakwirkung (.+), Fehler (.+), Asse (.+)\.$/)))return `Break impact ${decimalEnglish(m[1])}, errors ${decimalEnglish(m[2])}, aces ${decimalEnglish(m[3])}.`;
 if((m=s.match(/^Erkannte Transitionen (\d+); Erfolgsquote (.+)\.$/)))return `Recognized transitions ${m[1]}; success rate ${decimalEnglish(m[2])}.`;
 if((m=s.match(/^(K1|K2|K3) · (.+)$/))){const tail={'nach gegnerischem Aufschlag':'after opponent serve','eigener Aufschlag':'own serve','Transition':'transition'}[m[2]]||m[2];return `${m[1]} · ${tail}`;}
 if((m=s.match(/^Direkt: (.+) Ass · (.+) Fehler\.$/)))return `Direct: ${decimalEnglish(m[1])} aces · ${decimalEnglish(m[2])} errors.`;
 if((m=s.match(/^Kritisch: (R\d+) \(([^)]+)\)\.$/)))return `Critical: ${m[1]} (${m[2]}).`;
 if((m=s.match(/^Stabil: (R\d+) \(([^)]+)\)\.$/)))return `Stable: ${m[1]} (${m[2]}).`;
 if((m=s.match(/^(R\d+) ist die kritischste Rotation$/)))return `${m[1]} is the most critical rotation`;
 if((m=s.match(/^Sideout (.+); First Ball (.+)\.$/)))return `Side-out ${decimalEnglish(m[1])}; first ball ${decimalEnglish(m[2])}.`;
 if((m=s.match(/^Direkt: (.+) Ass · (.+) Fehler\.$/)))return `Direct: ${decimalEnglish(m[1])} ace rate · ${decimalEnglish(m[2])} error rate.`;
 if((m=s.match(/^(R\d+): (.+)\. Rotationseffekt weiter prüfen\.$/)))return `${m[1]}: ${decimalEnglish(m[2])}. Continue checking the rotation effect.`;
 return s;
}

export function rt(value,lang=getReportLanguage()){
 const source=String(value??'');if(lang!=='en'||!source)return source;
 const exact=EXACT_EN[source];if(exact!==undefined)return exact;
 const tech=TECH_EN[source];if(tech)return tech;
 return decimalEnglish(translateDynamic(source));
}
export function localizeReport(value,lang=getReportLanguage()){
 if(lang!=='en'||value==null)return value;
 if(Array.isArray(value))return value.map(v=>localizeReport(v,lang));
 if(typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,localizeReport(v,lang)]));
 if(typeof value==='string')return rt(value,lang);
 return value;
}
export function localizeReportMarkup(markup,lang=getReportLanguage()){
 if(lang!=='en')return markup;
 let out=String(markup??'');
 const entries=Object.entries(EXACT_EN).sort((a,b)=>b[0].length-a[0].length);
 for(const [de,en] of entries)out=out.split(de).join(en);
 for(const [de,en] of Object.entries(TECH_EN))out=out.replace(new RegExp(`>${de}<`,'g'),`>${en}<`);
 return decimalEnglish(out);
}
