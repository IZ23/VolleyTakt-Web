import assert from 'node:assert/strict';
import {filterMatches} from '../js/analysis/filters.js';
import {rotationInsights,k1k2Insights} from '../js/analysis/insights.js';
import {buildContextChains} from '../js/analysis/chains2.js';
import {buildContextReport} from '../js/analysis/context.js';
import {advancedInsightsFor} from '../js/analysis/insights-advanced.js';

const matches=[
 {matchId:'old',matchDate:'2026-08-10',seasonId:'s1',ownTeamId:'t1',oppTeamId:'o1',matchTypeId:'m1',events:[]},
 {matchId:'cur',matchDate:'2026-09-08',seasonId:'s1',ownTeamId:'t1',oppTeamId:'o2',matchTypeId:'m1',events:[]},
 {matchId:'future',matchDate:'2026-10-02',seasonId:'s1',ownTeamId:'t1',oppTeamId:'o3',matchTypeId:'m1',events:[]}
];
assert.deepEqual(filterMatches(matches,{from:'2026-08-01',to:'2026-08-31'},'cur').map(x=>x.matchId),['old'],
  'explicit period must override pinned/current match');
assert.equal(filterMatches(matches,{from:'2026-07-01',to:'2026-07-31'},'cur').length,0,
  'empty period must remain empty');
assert.deepEqual(filterMatches(matches,{},'cur').map(x=>x.matchId),['cur'],
  'pinned match still applies without explicit filters');

const ri=rotationInsights([
 {rotation:'R1',rallies:20,k1Sideout:'10.0 %',k2Break:'65.0 %'},
 {rotation:'R2',rallies:20,k1Sideout:'40.0 %',k2Break:'64.0 %'},
 {rotation:'R3',rallies:2,k1Sideout:'100.0 %',k2Break:'100.0 %'}
]);
assert.equal(ri.find(x=>x.key==='R1').kind,'warning');
assert.equal(ri.find(x=>x.key==='R3').confidence,'insufficient');

const ki=k1k2Insights({k1Count:20,k2Count:18,k1Sideout:'40 %',firstBall:'20 %',k2Break:'60 %'});
assert.equal(ki[0].kind,'warning');

const rallyEvents=[];
function addRally(id,rotation,recQ,setQ,attQ,winner,serve='them'){
  const base={rally_id:id,context_id:`ctx:${id}`,set:'1',rotation,serving_before:serve,_match:{matchId:'m',matchDate:'2026-09-08',oppTeamId:'opp'}};
  rallyEvents.push({...base,id:`${id}-r`,event_type:'action',rally_sequence:1,action:'Annahme',value:recQ,player_id:'rec'});
  rallyEvents.push({...base,id:`${id}-s`,event_type:'action',rally_sequence:2,action:'Zuspiel',value:setQ,player_id:'set',action_zone:2,target_zone:3});
  rallyEvents.push({...base,id:`${id}-a`,event_type:'action',rally_sequence:3,action:'Angriff',value:attQ,player_id:'att',action_zone:3,target_zone:5});
  rallyEvents.push({...base,id:`${id}-x`,event_type:'rally_result',rally_sequence:4,rally_winner:winner});
}
for(let i=0;i<10;i++) addRally(`r1-${i}`,'R1',i<3?'+':'-', '+', i<1?'#':'0', i<2?'us':'them');
for(let i=0;i<10;i++) addRally(`r2-${i}`,'R2',i<8?'+':'-', '+', i<5?'#':'0', i<6?'us':'them');
const chains=buildContextChains(rallyEvents,{actions:['Annahme','Zuspiel','Angriff']});
assert.equal(chains.length,20);
assert.ok(chains.every(x=>x.contextId.startsWith('ctx:')));
const report=buildContextReport(rallyEvents,{actions:['Annahme','Zuspiel','Angriff']});
assert.equal(report.byRotation.length,2);
const adv=advancedInsightsFor('rotations',[
 {rotation:'R1',rallies:10,points:-6,k1Sideout:'20 %',firstBall:'10 %',k2Break:'50 %'},
 {rotation:'R2',rallies:10,points:2,k1Sideout:'60 %',firstBall:'50 %',k2Break:'60 %'}
],{events:rallyEvents,actions:['Annahme','Zuspiel','Angriff']});
assert.ok(adv.some(x=>/Annahme/.test(x.finding+x.context+x.next)),'advanced rotation insight should inspect reception context');
console.log('ANALYSIS RC6-3 filter, chain/context and insight checks passed.');

