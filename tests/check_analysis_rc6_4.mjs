import assert from 'node:assert/strict';
import {
  analyzeServeSemantic,analyzeK3,analyzeRotationsDeep,analyzeFirstBallDeep,
  analyzeBlockDefense,analyzeSetDeep,analyzeAttackDeep,analyzeTargets,
  analyzePlayerDeep,analyzeOpponentDeep,analyzeChainPatterns,summarizeCompareDeep
} from '../js/analysis/deep.js';

const actions=['Aufschlag','Annahme','Zuspiel','Angriff','Block','Abwehr'];
const ev=[];
const add=(x)=>ev.push(x);

// Three own serves: error, ace, in-play. Direct result categories must partition 100%.
add({id:'s1',rally_id:'rs1',rally_sequence:1,event_type:'action',action:'Aufschlag',value:'=',player_id:'srv',player_abbreviation:'SRV',rotation:'R1',serve_technique:'Float',target_zone:5});
add({id:'sr1',rally_id:'rs1',rally_sequence:2,event_type:'rally_result',rally_winner:'them',serving_before:'us',rotation:'R1'});
add({id:'s2',rally_id:'rs2',rally_sequence:1,event_type:'action',action:'Aufschlag',value:'#',player_id:'srv',player_abbreviation:'SRV',rotation:'R1',serve_technique:'Float',target_zone:5});
add({id:'sr2',rally_id:'rs2',rally_sequence:2,event_type:'rally_result',rally_winner:'us',serving_before:'us',rotation:'R1'});
add({id:'s3',rally_id:'rs3',rally_sequence:1,event_type:'action',action:'Aufschlag',value:'+',player_id:'srv',player_abbreviation:'SRV',rotation:'R1',serve_technique:'Float',target_zone:5});
add({id:'or3',rally_id:'rs3',rally_sequence:2,event_type:'action',action:'Gegner Annahme',value:'+',rotation:'R1'});
add({id:'sr3',rally_id:'rs3',rally_sequence:3,event_type:'rally_result',rally_winner:'us',serving_before:'us',rotation:'R1'});

// K1 rally with complete first-ball chain.
add({id:'r1',rally_id:'rk1',rally_sequence:1,event_type:'action',action:'Annahme',value:'+',player_id:'rec',player_abbreviation:'REC',rotation:'R1',action_zone:6});
add({id:'z1',rally_id:'rk1',rally_sequence:2,event_type:'action',action:'Zuspiel',value:'+',player_id:'set',player_abbreviation:'SET',rotation:'R1',action_zone:2,target_zone:3,set_tempo:'1'});
add({id:'a1',rally_id:'rk1',rally_sequence:3,event_type:'action',action:'Angriff',value:'#',player_id:'att',player_abbreviation:'ATT',rotation:'R1',action_zone:3,target_zone:5});
add({id:'kr1',rally_id:'rk1',rally_sequence:4,event_type:'rally_result',rally_winner:'us',serving_before:'them',rotation:'R1'});

// Transition/K3: opponent attack -> own defense -> set -> counterattack.
add({id:'oa',rally_id:'rk3',rally_sequence:1,event_type:'action',action:'Gegner Angriff',value:'+',rotation:'R2',action_zone:4,target_zone:5});
add({id:'d1',rally_id:'rk3',rally_sequence:2,event_type:'action',action:'Abwehr',value:'+',player_id:'def',player_abbreviation:'DEF',rotation:'R2',action_zone:5});
add({id:'z2',rally_id:'rk3',rally_sequence:3,event_type:'action',action:'Zuspiel',value:'+',player_id:'set',player_abbreviation:'SET',rotation:'R2',action_zone:6,target_zone:4,set_tempo:'2'});
add({id:'a2',rally_id:'rk3',rally_sequence:4,event_type:'action',action:'Angriff',value:'#',player_id:'att',player_abbreviation:'ATT',rotation:'R2',action_zone:4,target_zone:1});
add({id:'kr2',rally_id:'rk3',rally_sequence:5,event_type:'rally_result',rally_winner:'us',serving_before:'us',rotation:'R2'});

const serve=analyzeServeSemantic(ev,{actions});
assert.equal(serve.length,1);
assert.equal(serve[0].n,3);
assert.equal(serve[0].error+serve[0].ace+serve[0].inPlay,serve[0].n);
assert.equal(serve[0].breaks,2,'break is a separate rally outcome metric');

const k3=analyzeK3(ev,{actions,rotations:['R1','R2']});
assert.equal(k3.total.n,1);
assert.equal(k3.total.won,1);
assert.equal(k3.byRotation.find(x=>x.rotation==='R2').n,1);

const rot=analyzeRotationsDeep(ev,{actions,rotations:['R1','R2']});
assert.ok('k3WinRate' in rot[0] && 'firstAttackKill' in rot[0]);
assert.equal(rot.find(x=>x.rotation==='R2').k3Count,1);

const fb=analyzeFirstBallDeep(ev,{actions,rotations:['R1','R2']});
assert.equal(fb.total.rallies,1);
assert.equal(fb.byRotation.find(x=>x.rotation==='R1').rallies,1);

const bd=analyzeBlockDefense(ev,{actions});
assert.equal(bd.find(x=>x.technique==='Abwehr').transitionAttack,1);

const sets=analyzeSetDeep(ev,{actions});
assert.ok(sets.some(x=>x.phase==='K1'&&x.recQ==='+'));
const attacks=analyzeAttackDeep(ev,{actions});
assert.ok(attacks.some(x=>x.rotation==='R1'&&x.recQ==='+'));

const targets=analyzeTargets(ev,{actions});
assert.ok(targets.some(x=>x.technique==='Aufschlag'&&x.to==='P5'));
assert.ok(targets.some(x=>x.technique==='Angriff'&&x.to==='P1'));

const players=[
 {id:'srv',abbreviation:'SRV'},{id:'rec',abbreviation:'REC'},{id:'set',abbreviation:'SET'},
 {id:'att',abbreviation:'ATT'},{id:'def',abbreviation:'DEF'}
];
const pc=analyzePlayerDeep(ev,{actions,players});
assert.ok(pc.find(x=>x.player.id==='att').phases.K3.n>=1,'counterattack player should have K3 context');

const opp=analyzeOpponentDeep(ev,{actions});
assert.ok(opp.some(x=>x.technique==='Angriff'&&x.rotation==='R2'));

const chains=analyzeChainPatterns(ev,{actions});
assert.ok(chains.length>=2);

const summary=summarizeCompareDeep(ev,{actions,rotations:['R1','R2']});
assert.ok('k3WinRate' in summary && 'attackEfficiency' in summary);

console.log('ANALYSIS RC6-4 deep semantic/K3/rotation/first-ball checks passed.');
