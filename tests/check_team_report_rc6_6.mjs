import assert from 'node:assert/strict';
import {buildTeamReport,teamReportHtml,teamReportText,teamReportFileBase,TEAM_REPORT_GLOSSARY} from '../js/analysis/team-report.js';

const dash={
 overview:{rallyRate:'52.0 %',rallies:50,matches:1},
 k1k2:{k1Sideout:'38.0 %',firstBall:'18.0 %',k2Break:'64.0 %',k1Count:25,k2Count:25},
 firstball:{total:{rallies:25,firstBall:'18.0 %',recPositive:'34.0 %',attackKill:'26.0 %'}},
 k3:{total:{n:8,winRate:'37.5 %',killRate:'25.0 %'}},
 rotations:[
   {rotation:'R1',rallies:12,points:-6,k1Sideout:'20.0 %',firstBall:'8.0 %',k2Break:'60.0 %',receptionPositive:'22.0 %'},
   {rotation:'R2',rallies:10,points:4,k1Sideout:'50.0 %',firstBall:'30.0 %',k2Break:'70.0 %',receptionPositive:'48.0 %'}
 ],
 reception:[
   {p:'A',n:10,posRate:'30.0 %'},{p:'B',n:10,posRate:'40.0 %'}
 ],
 attacks:[
   {p:'A',n:10,efficiency:'20.0 %'},{p:'B',n:10,efficiency:'30.0 %'}
 ],
 serve:[
   {p:'A',n:10,error:1,ace:2,inPlay:7,breaks:6,errorRate:'10.0 %',aceRate:'20.0 %',inPlayRate:'70.0 %',breakRate:'60.0 %'}
 ]
};
const matches=[{matchId:'m1',matchDate:'2026-09-01'}];
const report=buildTeamReport({
 matches,dash,filters:{From:'2026-09-01',To:'2026-09-01'},
 matchNames:()=> 'MTV BS Da3 – MTV Goslar',
 matchScoreText:()=> 'Sätze 1:3'
});
assert.equal(report.schema,3);
assert.equal(report.title,'MTV BS Da3 – MTV Goslar');
assert.ok(report.strengths.length>=1);
assert.ok(report.focus.some(x=>/R1/.test(x.title+x.text)));
assert.ok(report.training.length>=1);
assert.equal(report.metrics.length,4);
assert.ok(report.note.includes('keine Bewertung einzelner Spielerinnen'));

const html=teamReportHtml(report);
assert.ok(html.includes('Das lief gut'));
assert.ok(html.includes('Fokus fürs nächste Training'));
assert.ok(html.includes('Begriffe kurz erklärt'));
assert.ok(html.includes('R1–R6'));
assert.ok(TEAM_REPORT_GLOSSARY.some(x=>x.term==='K3'));
assert.ok(!html.includes('Kausalitätsbeweise') || html.includes('keine'));

const text=teamReportText(report);
assert.ok(text.includes('✅ Das lief gut'));
assert.ok(text.includes('🎯 Hier können wir besser werden'));
assert.ok(text.includes('🏐 Fokus fürs nächste Training'));
assert.ok(text.includes('Kurzwerte'));
assert.ok(text.includes('Begriffe kurz erklärt'));
assert.ok(text.includes('K1:'));
assert.ok(text.includes('First Ball:'));
assert.ok(!/beste Spielerin|schlechteste Spielerin/i.test(text));

assert.equal(teamReportFileBase(report),'VolleyTakt_2026-09-01_MTV-BS-Da3_vs_MTV-Goslar_Spielerinnen');

const priorityDash={...dash,rotations:[
  {rotation:'R1',rallies:25,points:-13,k1Sideout:'10.5 %',firstBall:'5.3 %',k2Break:'66.7 %',receptionPositive:'27.3 %'},
  {rotation:'R4',rallies:13,points:-7,k1Sideout:'20.0 %',firstBall:'8.0 %',k2Break:'33.3 %',receptionPositive:'30.0 %'},
  {rotation:'R3',rallies:4,points:2,k1Sideout:'100.0 %',firstBall:'50.0 %',k2Break:'66.7 %',receptionPositive:'50.0 %'}
]};
const priorityReport=buildTeamReport({
  matches:[{matchId:'m2',matchDate:'2026-08-15',ownTeamName:'MTV BS Da3',oppTeamName:'MTV Goslar',matchTypeName:'Punktspiel'}],
  dash:priorityDash,
  matchNames:m=>`${m.ownTeamName} – ${m.oppTeamName}`,
  matchScoreText:()=> 'Sätze 0:1'
});
assert.ok(priorityReport.focus[0].title.includes('R1'),'worst absolute rally balance must select R1 (-13), not R4 (-7)');
assert.ok(priorityReport.meta.some(x=>x.label==='Datum'&&x.value==='15.08.2026'));
assert.ok(priorityReport.meta.some(x=>x.label==='Gegner'&&x.value==='MTV Goslar'));
assert.ok(priorityReport.meta.some(x=>x.label==='Spielstand'&&x.value==='Sätze 0:1'));
assert.ok(priorityReport.meta.some(x=>x.label==='Spielart'&&x.value==='Punktspiel'));

console.log('ANALYSIS-REPORT2 / ANALYSIS-SHARE1 team-report checks passed.');
