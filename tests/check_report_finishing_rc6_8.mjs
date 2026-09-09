import assert from 'node:assert/strict';
import {buildTeamReport} from '../js/analysis/team-report.js';
import {buildTrainerReport,trainerReportText} from '../js/analysis/trainer-report.js';

const matches=[{matchId:'m1',matchDate:'2026-08-15',ownTeamName:'MTV BS Da3',oppTeamName:'MTV Goslar',matchTypeName:'Turnier'}];
const matchNames=()=> 'MTV BS Da3 – MTV Goslar';
const matchScoreText=()=> 'Satz 1 · 0:0 · Sätze 0:1';
const dash={
 overview:{rallyRate:'41.8 %',rallies:67},
 k1k2:{k1Sideout:'25.6 %',firstBall:'2.6 %',k2Break:'64.3 %',k1Count:39,k2Count:28},
 firstball:{total:{}},k3:{total:{n:0,winRate:'–',killRate:'–'}},
 rotations:[
   {rotation:'R1',rallies:25,points:-13,k1Sideout:'10.5 %',firstBall:'5.3 %',k2Break:'66.7 %',receptionPositive:'27.3 %'},
   {rotation:'R6',rallies:13,points:5,k1Sideout:'50.0 %',firstBall:'0.0 %',k2Break:'77.8 %',receptionPositive:'0.0 %'}
 ],
 reception:[{n:41,posRate:'24.4 %'}],attacks:[{n:34,efficiency:'-20.6 %'}],
 serve:[{n:29,error:5,ace:6,breaks:19}],blockdef:[],
 playerContext:[{player:{abbreviation:'SF'},actions:34,phases:{K1:{n:26},K2:{n:8},K3:{n:0}}}],
 opponent:{attacks:[],serves:[],sets:[],contextRows:[]}
};
const filters={From:'2026-08-15',To:'2026-08-15',Team:'MTV BS Da3'};

const team=buildTeamReport({matches,dash,filters,matchNames,matchScoreText});
assert.ok(team.generatedAt);
assert.ok(team.metrics.every(m=>!/\d+\.\d+\s*%/.test(m.value)), 'player metrics must use German decimal comma');

const trainer=buildTrainerReport({matches,dash,filters,matchNames,matchScoreText});
assert.equal(trainer.schema,2);
assert.equal(trainer.overview.rallyRate,'41,8 %');
assert.ok(trainer.techniques[0].text.includes('27,3 %'));
assert.ok(trainer.generatedAt);
const shortText=trainerReportText(trainer,'short');
const detailText=trainerReportText(trainer,'detail');
assert.ok(shortText.includes('Trainer-Kurzreport'));
assert.ok(detailText.includes('Trainer-Detailreport'));
assert.ok(detailText.includes('Spielerinnen im Kontext'));
console.log('RC6-8 REPORT-PRINT2 / REPORT-FORMAT1A / REPORT-TYPO1 / REPORT-SHARE2A checks passed.');
