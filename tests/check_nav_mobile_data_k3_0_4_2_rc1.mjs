import assert from 'node:assert/strict';
import {createRallyController} from '../js/scouting/rally.js';
import {buildScoutingEvent} from '../js/scouting/events.js';

const state={servingSide:'them',rallyCounter:0,rallyHighWater:0,currentRallyId:'',currentRallyNo:0,currentRallySeq:0,currentRallyPhase:'',currentTransitionNo:1,lastActionSide:'',lastActionName:'',rallyBallZone:0,rallyBallSide:''};
let n=0;const rc=createRallyController({getState:()=>state,newId:p=>`${p}_${++n}`});
let c=rc.contextForAction('opponent','Angriff');
assert.equal(c.rally_phase,'K1');
rc.markActionSide('opponent','Angriff');
c=rc.contextForAction('own','Abwehr');
assert.equal(c.rally_phase,'K3');
assert.equal(c.transition_trigger,'Abwehr');
assert.equal(c.transition_source,'opponent_attack');
assert.equal(c.transition_no,'2');
rc.markActionSide('own','Abwehr');
c=rc.contextForAction('own','Zuspiel');
assert.equal(c.rally_phase,'K3');
assert.equal(c.transition_trigger,'');

const action=buildScoutingEvent({id:'a1',action:'Annahme',value:'+',extra:{event_type:'action'},formatSeconds:s=>String(s)});
assert.equal(action.action_quality,'+');
assert.equal(action.action_effect,'+');
assert.equal(action.rally_result,'');
const result=buildScoutingEvent({id:'r1',action:'Punkt wir',value:'auto',extra:{event_type:'rally_result',rally_winner:'us',rally_result:'us',action_quality:'',action_effect:''},formatSeconds:s=>String(s)});
assert.equal(result.action_quality,'');
assert.equal(result.action_effect,'');
assert.equal(result.rally_result,'us');
console.log('Navigation/mobile/data/K3 semantic checks passed.');
