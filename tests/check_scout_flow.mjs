import assert from 'node:assert/strict';
import {createScoutingController,SCOUTING_STEPS} from '../js/scouting/scouting.js';

const permutations = [
  ['WER','WAS','WIE'],['WER','WIE','WAS'],['WAS','WER','WIE'],
  ['WAS','WIE','WER'],['WIE','WER','WAS'],['WIE','WAS','WER']
];

function initialState(){return {
  activeTeamContext:'own',pendingSide:null,pendingAction:null,pendingQuality:null,
  selectedPos:0,selectedOppPos:0,selectedPlayerPos:0,selectedPlayerId:'',
  inputStep:SCOUTING_STEPS.WHO,actionZone:0,targetZone:0,targetSide:'',
  actionStartedSeconds:null,actionStartedAt:'',setTempo:'',setDistance:'',serveTechnique:'',
  autoServePreset:false,captureQualityProfile:'',captureFieldOrientation:'',fieldOrientation:'activeBottom',
  allowPositionOnly:false,servingSide:'',matchComplete:false,setReady:true,currentRallyId:'',rallyBallZone:0,rallyBallSide:''
}}
function run(order){
  const state=initialState();
  const ctl=createScoutingController({
    getState:()=>state,
    getLineup:()=>({1:'p1',2:'p2',3:'p3',4:'p4',5:'p5',6:'p6'}),
    getQualityProfileForSide:()=> 'basic_5',
    getCurrentSeconds:()=>12.345,
    getNow:()=> '2026-09-04T18:00:00.000Z',
    isScoutingReady:()=>true
  });
  const ops={
    WER:()=>ctl.selectWhoPosition('own',4),
    WAS:()=>ctl.chooseAction('Angriff'),
    WIE:()=>ctl.chooseQuality('+')
  };
  for(const key of order){const r=ops[key]();assert.equal(r.ok,true,`${order}: ${key} failed`)}
  assert.equal(state.inputStep,SCOUTING_STEPS.ORIGIN,`${order}: core must end at WO`);
  let r=ctl.selectOriginZone('own',3);assert.equal(r.ok,true);assert.equal(state.inputStep,SCOUTING_STEPS.TARGET);
  r=ctl.selectTargetZone('opponent',2);assert.equal(r.ok,true);assert.equal(r.type,'ACTION_COMPLETE');
  return r.draft;
}
const reference=run(permutations[0]);
for(const order of permutations.slice(1)) assert.deepEqual(run(order),reference,`Different semantic draft for ${order.join('→')}`);
assert.deepEqual({playerId:reference.playerId,playerPosition:reference.playerPosition,action:reference.action,quality:reference.quality,originZone:reference.originZone,targetZone:reference.targetZone,targetSide:reference.targetSide},{playerId:'p4',playerPosition:4,action:'Angriff',quality:'+',originZone:3,targetZone:2,targetSide:'opponent'});
console.log('SCOUT-FLOW1 OK: all 6 WER/WAS/WIE permutations produce the same semantic action draft.');
