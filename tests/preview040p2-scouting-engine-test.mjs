import fs from 'node:fs';
import {createDefaultState} from '../js/app/state.js';
import {createScoutingController,SCOUTING_STEPS,SERVE_TECHNIQUES,SET_TEMPOS,SET_DISTANCES} from '../js/scouting/scouting.js';
const need=(v,m)=>{if(!v)throw new Error(m)};

function harness(overrides={}){
  let state={...createDefaultState('2026-08-28'),setReady:true,matchComplete:false,servingSide:'us',activeTeamContext:'own',allowPositionOnly:false,ownQualityProfile:'datavolley_6',opponentQualityProfile:'datavolley_6',ownLineup:{1:'o1',2:'o2',3:'o3',4:'o4',5:'o5',6:'o6'},oppLineup:{1:'p1',2:'p2',3:'p3',4:'p4',5:'p5',6:'p6'},...overrides};
  let ticks=12.5,now='2026-08-28T10:00:00.000Z';
  const ctl=createScoutingController({
    getState:()=>state,
    getLineup:side=>side==='opponent'?state.oppLineup:state.ownLineup,
    getQualityProfileForSide:side=>side==='opponent'?state.opponentQualityProfile:state.ownQualityProfile,
    getCurrentSeconds:()=>ticks,
    getNow:()=>now,
    isScoutingReady:()=>state.setReady&&!!state.servingSide
  });
  return {ctl,state,setState:v=>state=v,setClock:(sec,stamp)=>{ticks=sec;now=stamp}};
}

// DOM-free boundary
const source=fs.readFileSync(new URL('../js/scouting/scouting.js',import.meta.url),'utf8');
for(const forbidden of ['document.','querySelector','innerHTML','setStatus(','render()','persist(','saveState(','saveEvents(','syncLiveSession(','ensureActiveRally(','award(']) need(!source.includes(forbidden),`scouting module leaks responsibility: ${forbidden}`);
need(SERVE_TECHNIQUES.some(([v])=>v==='standing_overhand'),'serve techniques missing');
need(SET_TEMPOS.length===4&&SET_DISTANCES.length>=7,'set detail catalogues missing');

// WER only P1-P6
{
 const {ctl,state}=harness();
 let r=ctl.selectPosition('own',4);need(r.ok&&r.type==='WHO_SELECTED','P4 WER');
 need(state.selectedPlayerId==='o4'&&state.selectedPlayerPos===4&&state.inputStep===SCOUTING_STEPS.ACTION,'WER state');
 need(state.actionStartedSeconds===12.5,'first WER must start action timestamp');
 r=ctl.resetCaptureState();need(r.ok&&state.inputStep==='WER','reset');
 r=ctl.selectPosition('own',7);need(!r.ok&&r.reason==='WHO_INVALID','P7 must not be WER');
}

// Detailed own attack -> WO P1-P9 -> WOHIN opponent -> draft
{
 const {ctl,state}=harness();
 need(ctl.selectPosition('own',4).ok,'own WER');
 need(ctl.chooseAction('Angriff').ok,'attack');
 let r=ctl.chooseQuality('+');need(r.ok&&r.nextStep==='WO'&&r.maxZone===9,'quality to detailed WO');
 r=ctl.selectPosition('own',8);need(r.ok&&r.type==='ORIGIN_SELECTED'&&r.targetRequired,'P8 detailed origin');
 need(state.inputStep==='TARGET','target step');
 r=ctl.selectTargetZone('own',1);need(r.ok&&r.draft&&r.draft.targetSide==='own','attack may target own side');
 // repeat target step to verify opponent side is valid as well
 state.inputStep=SCOUTING_STEPS.TARGET;state.targetZone=0;state.targetSide='';
 r=ctl.selectTargetZone('opponent',1);need(r.ok&&r.draft&&r.draft.targetSide==='opponent','target completes draft on opponent side');
 const d=r.draft;need(d.side==='own'&&d.playerId==='o4'&&d.playerPosition===4,'draft identity');
 need(d.action==='Angriff'&&d.quality==='+'&&d.originZone===8&&d.targetZone===1,'draft action/zones');
 need(d.qualityProfile==='datavolley_6'&&d.actionStartedSeconds===12.5,'draft frozen context');
 need(state.scoreUs===0&&state.scoreThem===0&&!state.currentRallyId,'scouting must not score or create rally');
}

// Compact own action -> P1-P6 only and no target for reception
{
 const {ctl}=harness({ownQualityProfile:'basic_5'});
 ctl.selectPosition('own',5);ctl.chooseAction('Annahme');let r=ctl.chooseQuality('+');need(r.maxZone===9,'reception uses P1-P9 origin zones');
 r=ctl.selectPosition('own',8);need(r.ok&&r.type==='ACTION_COMPLETE'&&r.draft.originZone===8,'compact reception allows P8');
}

// Opponent attack needs target even in compact mode
{
 const {ctl}=harness({opponentQualityProfile:'basic_5',activeTeamContext:'opponent'});
 ctl.selectPosition('opponent',2);ctl.chooseAction('Angriff');ctl.chooseQuality('+');let r=ctl.selectPosition('opponent',2);need(r.targetRequired,'opponent attack target required');
 r=ctl.selectTargetZone('own',6);need(r.ok&&r.draft.targetZone===6,'opponent attack target');
}

// Direct opponent serve without WER and immediate serve error draft
{
 const {ctl,state}=harness({servingSide:'them',activeTeamContext:'opponent'});
 let r=ctl.chooseAction('Aufschlag');need(r.ok&&r.directOpponentServe,'direct opponent serve');
 need(state.pendingSide==='opponent'&&state.selectedPlayerPos===0,'direct serve has no WER');
 r=ctl.chooseQuality('=');need(r.ok&&r.immediateServeResult&&r.draft,'serve error immediate draft');
 need(r.draft.side==='opponent'&&r.draft.action==='Aufschlag'&&r.draft.quality==='='&&r.draft.originZone===0,'serve error draft');
 need(state.scoreUs===0&&state.scoreThem===0,'serve error must not score in scouting engine');
}

// Own serve preset
{
 const {ctl,state}=harness({servingSide:'us',activeTeamContext:'own'});
 need(ctl.prepareOwnServePreset(),'own serve preset expected');
 need(state.pendingSide==='own'&&state.selectedPlayerPos===1&&state.selectedPlayerId==='o1','preset WER=P1');
 need(state.pendingAction==='Aufschlag'&&state.inputStep==='WIE'&&state.autoServePreset===true,'preset WAS=serve');
}

// Detailed setting action details before WO
{
 const {ctl,state}=harness();
 ctl.selectPosition('own',3);ctl.chooseAction('Zuspiel');let r=ctl.chooseQuality('+');need(r.nextStep==='SETDETAIL','set detail step');
 r=ctl.chooseSetDetail('tempo','T1');need(r.nextStep==='SETDETAIL','only one set detail');
 r=ctl.chooseSetDetail('distance','weit');need(r.type==='SET_DETAILS_COMPLETE'&&state.inputStep==='WO','set details complete');
 r=ctl.selectPosition('own',3);need(r.targetRequired,'detailed set requires target');
 r=ctl.selectTargetZone('own',4);need(r.ok&&r.draft.setTempo==='T1'&&r.draft.setDistance==='weit','set details in draft');
}

console.log('0.4.0 RC4 scouting engine regression: OK');
