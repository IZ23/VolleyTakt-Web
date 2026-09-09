import assert from 'node:assert/strict';
import {buildTeamReport,teamReportFileBase} from '../js/analysis/team-report.js';
import {buildTrainerReport,trainerReportHtml} from '../js/analysis/trainer-report.js';
import {reportExportBase,safeFilePart} from '../js/analysis/report-export.js';

const matches=[{
  matchId:'m1',matchDate:'2026-08-15',ownTeamName:'MTV BS Da3',oppTeamName:'MTV Goslar',
  matchTypeName:'Punktspiel'
}];
const matchNames=()=> 'MTV BS Da3 – MTV Goslar';
const matchScoreText=()=> 'Sätze 0:1';
const dash={
  overview:{rallyRate:'41.8 %',rallies:67,matches:1},
  k1k2:{k1Sideout:'25.6 %',firstBall:'2.6 %',k2Break:'64.3 %',k1Count:39,k2Count:28},
  firstball:{total:{rallies:39,firstBall:'2.6 %',recPositive:'24.4 %'}},
  k3:{total:{n:0,winRate:'–',killRate:'–'}},
  rotations:[
    {rotation:'R1',rallies:25,points:-13,k1Sideout:'10.5 %',firstBall:'0.0 %',k2Break:'66.7 %',receptionPositive:'18.0 %'},
    {rotation:'R6',rallies:13,points:5,k1Sideout:'50.0 %',firstBall:'10.0 %',k2Break:'77.8 %',receptionPositive:'30.0 %'},
    {rotation:'R5',rallies:9,points:3,k1Sideout:'66.7 %',firstBall:'0.0 %',k2Break:'66.7 %',receptionPositive:'25.0 %'},
    {rotation:'R4',rallies:13,points:-7,k1Sideout:'20.0 %',firstBall:'0.0 %',k2Break:'33.3 %',receptionPositive:'20.0 %'},
    {rotation:'R3',rallies:4,points:2,k1Sideout:'100.0 %',firstBall:'0.0 %',k2Break:'66.7 %',receptionPositive:'50.0 %'}
  ],
  reception:[{p:'FO',n:7,posRate:'28.6 %'},{p:'MG',n:6,posRate:'16.7 %'}],
  attacks:[{p:'SF',n:17,efficiency:'-20.6 %'}],
  serve:[{p:'SF',n:29,error:3,ace:4,breaks:19,errorRate:'10.3 %',aceRate:'13.8 %',breakRate:'65.5 %'}],
  blockdef:[],
  players:[{player:{abbreviation:'SF'},actions:34}],
  playerContext:[{player:{abbreviation:'SF'},actions:34,phases:{K1:{n:18},K2:{n:16},K3:{n:0}}}],
  opponent:{attacks:[{n:20}],serves:[{n:39}],sets:[{n:18}],contextRows:[{technique:'Angriff',n:1}]}
};

const filters={From:'2026-08-15',To:'2026-08-15',Team:'MTV BS Da3'};
const team=buildTeamReport({matches,dash,filters,matchNames,matchScoreText});
assert.equal(team.exportBase,'VolleyTakt_2026-08-15_MTV-BS-Da3_vs_MTV-Goslar_Spielerinnen');
assert.equal(teamReportFileBase(team),team.exportBase);
assert.ok(team.focus[0].title.includes('R1'), 'player report must prioritize R1 over R4');
assert.ok(team.metrics[0].value.includes(','), 'German percentage format must use comma');
assert.ok(team.meta.some(m=>m.label==='Spielstand'), 'unfinished match must use Spielstand');

const trainer=buildTrainerReport({matches,dash,filters,matchNames,matchScoreText});
trainer.exportBase=reportExportBase({matches,filters,matchNames,target:'Trainer'});
assert.equal(trainer.exportBase,'VolleyTakt_2026-08-15_MTV-BS-Da3_vs_MTV-Goslar_Trainer');
assert.equal(trainer.overview.worst,'R1');
assert.ok(trainer.priorities.some(p=>p.title.includes('R1')));
assert.ok(trainer.phases.some(p=>p.key==='K1'));
assert.ok(trainer.phases.some(p=>p.key==='K2'));
assert.ok(trainer.phases.some(p=>p.key==='K3'));
assert.equal(trainer.players[0].k1,18);
assert.equal(trainer.players[0].k2,16);
assert.ok(trainer.meta.some(m=>m.label==='Spielstand'));
assert.ok(trainer.phases[0].metrics[0][1].includes(','));
const html=trainerReportHtml(trainer);
assert.ok(html.includes('Wichtigste Erkenntnisse'));
assert.ok(html.includes('Trainingsableitung'));
assert.ok(html.includes('Spielerinnen im Kontext'));
assert.ok(!html.includes('Analyse – Dashboard'));
assert.ok(!html.includes('Report erzeugen'));

assert.equal(safeFilePart('MTV BS Da3 / A'),'MTV-BS-Da3-A');
console.log('RC6-8 UI-REPORT1 / ANALYSIS-REPORT3 / ANALYSIS-SHARE2 checks passed.');
