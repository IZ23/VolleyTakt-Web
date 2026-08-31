import assert from 'node:assert/strict';
import {analysisDate,actionName,actionSide,isAction,filterMatches,filterEvents,rallyMap,wonOwn,firstBallSideout,stats} from '../js/analysis/domain.js';
const ACTIONS=['Angriff','Annahme','Aufschlag','Block','Abwehr','Zuspiel'];
const match={matchId:'m1',matchDate:'2026-08-29',seasonId:'s1',ownTeamId:'t1',oppTeamId:'t2',matchTypeId:'mt1',events:[
 {event_type:'action',rally_id:'r1',rally_sequence:1,action:'Annahme',player_id:'p1',rotation:'R1',set:1,value:'+'},
 {event_type:'action',rally_id:'r1',rally_sequence:2,action:'Angriff',player_id:'p2',rotation:'R1',set:1,value:'#'},
 {event_type:'rally_result',rally_id:'r1',rotation:'R1',set:1,rally_winner:'us',serving_before:'them'}
]};
assert.equal(analysisDate(match),'2026-08-29');
assert.equal(actionName({action:'Gegner Aufschlag'}),'Aufschlag');
assert.equal(actionSide({action:'Gegner Aufschlag'}),'opponent');
assert.equal(isAction(match.events[0],ACTIONS),true);
assert.equal(filterMatches([match],{teamId:'t1'},'').length,1);
assert.equal(filterMatches([match],{teamId:'x'},'').length,0);
assert.equal(filterEvents([match],{playerId:'p2'},ACTIONS).length,1);
const rm=rallyMap(match.events,ACTIONS);assert.equal(rm.size,1);assert.equal(wonOwn(rm.get('r1')),true);assert.equal(firstBallSideout(rm.get('r1')),true);
assert.deepEqual(stats([match],match.events,ACTIONS),{matches:1,actions:2,rallies:1,own:1,opp:0,win:'100.0 %'});
console.log('preview040p9-analysis-domain-test: ok');
