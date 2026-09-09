import assert from 'node:assert/strict';
import {buildTrainerReport} from '../js/analysis/trainer-report.js';

const matches=[{matchId:'m1',matchDate:'2026-08-15',ownTeamName:'A',oppTeamName:'B'}];
const dash={
 overview:{rallyRate:'50.0 %',rallies:8},k1k2:{k1Sideout:'50.0 %',firstBall:'25.0 %',k2Break:'50.0 %',k1Count:4,k2Count:4},
 firstball:{total:{}},k3:{total:{n:0}},rotations:[{rotation:'R1',rallies:8,points:0,k1Sideout:'50.0 %',firstBall:'25.0 %',k2Break:'50.0 %'}],
 reception:[],attacks:[],serve:[],blockdef:[],players:[],
 playerContext:[{player:{abbreviation:'AA'},actions:7,phases:{K1:{n:4},K2:{n:3},K3:{n:0}}}],
 opponent:{attacks:[],serves:[],sets:[],contextRows:[]}
};
const report=buildTrainerReport({matches,dash,filters:{},matchNames:()=> 'A – B',matchScoreText:()=> 'Satz 1 · 4:4'});
assert.equal(report.players[0].k1,4);
assert.equal(report.players[0].k2,3);
assert.ok(report.opponent.every(x=>x.value==='nicht erfasst'));
assert.ok(report.meta.some(x=>x.label==='Spielstand'));
console.log('RC6-8 bugfix REPORT-PRINT1 / ANALYSIS-REPORT3A / REPORT-FORMAT1 checks passed.');
