// VolleyTakt Live 0.4.0 RC5 - DOM-free scouting capture engine.
// Responsibility: WER -> WAS -> WIE -> details -> WO -> WOHIN -> ActionDraft.
// Rally, scoring, event persistence, rendering and status messages stay outside this module.

export const SCOUTING_STEPS=Object.freeze({WHO:'WER',ACTION:'WAS',QUALITY:'WIE',SET_DETAIL:'SETDETAIL',ORIGIN:'WO',TARGET:'TARGET'});
export const SERVE_TECHNIQUES=Object.freeze([['','ohne Zusatzangabe'],['jump_float','Jump Float'],['jump_topspin','Jump Topspin'],['float','Float'],['standing_overhand','Standaufschlag oben'],['topspin_drive','Topspin/Drive'],['underhand','von unten'],['other','Sonstige']]);
export const SET_TEMPOS=Object.freeze([['T0','Tempo 0 · sehr schnell'],['T1','Tempo 1 · schnell'],['T2','Tempo 2 · halbschnell'],['T3','Tempo 3 · hoch']]);
export const SET_DISTANCES=Object.freeze([['kurz','kurz'],['mittel','mittel'],['weit','weit/außen'],['rueck','rückwärts'],['HF5','Hinterfeld links'],['HF6','Hinterfeld Mitte · Pipe'],['HF1','Hinterfeld rechts']]);

const WHO_POSITIONS=Object.freeze([1,2,3,4,5,6]);
const normalizeQualityProfile=profile=>(profile==='datavolley'||profile==='datavolley_6')?'datavolley_6':'basic_5';

export function createScoutingController({
  getState,
  getLineup,
  getQualityProfileForSide,
  getCurrentSeconds,
  getNow,
  isScoutingReady
}){
  const s=()=>getState();
  const sideOf=side=>side==='opponent'?'opponent':'own';

  function detailedCapture(side=currentCaptureSide()){
    const state=s();
    const frozen=(state.pendingSide===side&&state.captureQualityProfile)?state.captureQualityProfile:'';
    return normalizeQualityProfile(frozen||getQualityProfileForSide(side))==='datavolley_6';
  }
  function currentCaptureSide(){const state=s();return state.pendingSide||(state.activeTeamContext==='opponent'?'opponent':'own')}
  function originMaxZone(action=s().pendingAction){return ['Annahme','Zuspiel','Angriff'].includes(action)?9:(detailedCapture(currentCaptureSide())?9:6)}
  function targetMaxZone(action=s().pendingAction){return ['Zuspiel','Angriff'].includes(action)?9:(detailedCapture(currentCaptureSide())?9:6)}
  function targetAllowsBothSides(action=s().pendingAction){return ['Zuspiel','Angriff'].includes(action)}
  function needsTarget(side,action){if(['Zuspiel','Angriff'].includes(action))return true;if(detailedCapture(side)&&action==='Aufschlag')return true;return false}
  function targetSideFor(side,action){if(targetAllowsBothSides(action))return '';return side==='own'?'opponent':'own'}

  function inheritedOrigin(){
    const state=s(),zone=Math.max(0,+state.rallyBallZone||0),side=state.rallyBallSide||'';
    if(!zone||side!==state.pendingSide||zone>originMaxZone(state.pendingAction))return 0;
    return zone;
  }
  function applyInheritedOrigin(){
    const state=s(),zone=inheritedOrigin();if(!zone)return null;
    // Preview17: the previous target is only a visible WO preselection.
    // The scout must still confirm WO explicitly (or overwrite it) before the action advances.
    state.actionZone=zone;state.inputStep=SCOUTING_STEPS.ORIGIN;
    return {ok:true,type:'ORIGIN_PREFILLED',pos:zone,targetRequired:needsTarget(state.pendingSide,state.pendingAction),nextStep:SCOUTING_STEPS.ORIGIN};
  }
  function opponentServeDirectReady(){const state=s();return !!isScoutingReady()&&!state.matchComplete&&state.servingSide==='them'&&!state.pendingSide&&!state.selectedPlayerPos}
  function ensureActionStarted(){const state=s();if(state.actionStartedSeconds==null){state.actionStartedSeconds=getCurrentSeconds();state.actionStartedAt=getNow()}state.autoServePreset=false}
  function resetCaptureState(){const state=s();state.selectedPos=0;state.selectedOppPos=0;state.pendingSide=null;state.pendingAction=null;state.pendingQuality=null;state.inputStep=SCOUTING_STEPS.WHO;state.selectedPlayerId='';state.selectedPlayerPos=0;state.actionZone=0;state.targetZone=0;state.targetSide='';state.actionStartedSeconds=null;state.actionStartedAt='';state.setTempo='';state.setDistance='';state.serveTechnique='';state.autoServePreset=false;state.captureQualityProfile='';state.captureFieldOrientation='';return {ok:true,type:'RESET'}}
  function prepareOwnServePreset(){const state=s();if(state.servingSide!=='us'||state.activeTeamContext!=='own'||!state.setReady||state.matchComplete||state.currentRallyId||state.pendingSide)return false;const pid=(getLineup('own')||{})[1]||'';if(!pid&&!state.allowPositionOnly)return false;state.selectedPos=1;state.selectedOppPos=0;state.pendingSide='own';state.selectedPlayerPos=1;state.selectedPlayerId=pid;state.pendingAction='Aufschlag';state.pendingQuality=null;state.actionZone=0;state.targetZone=0;state.targetSide='';state.serveTechnique='';state.setTempo='';state.setDistance='';state.actionStartedSeconds=null;state.actionStartedAt='';state.captureQualityProfile=getQualityProfileForSide('own');state.captureFieldOrientation=state.fieldOrientation;state.autoServePreset=true;state.inputStep=SCOUTING_STEPS.QUALITY;return true}
  function buildActionDraft({allowServeErrorWithoutZone=false}={}){
    const state=s(),terminalServe=allowServeErrorWithoutZone&&state.pendingAction==='Aufschlag'&&['=','#'].includes(state.pendingQuality);
    if((!state.actionZone&&!terminalServe)||!state.pendingAction||!state.pendingQuality)return null;
    const side=sideOf(state.pendingSide);
    return Object.freeze({
      side,
      playerId:state.selectedPlayerId||'',
      playerPosition:+state.selectedPlayerPos||0,
      action:state.pendingAction,
      quality:state.pendingQuality,
      originZone:+state.actionZone||0,
      targetZone:+state.targetZone||0,
      targetSide:state.targetSide||'',
      serveTechnique:state.pendingAction==='Aufschlag'?(state.serveTechnique||''):'',
      setTempo:state.pendingAction==='Zuspiel'?(state.setTempo||''):'',
      setDistance:state.pendingAction==='Zuspiel'?(state.setDistance||''):'',
      qualityProfile:normalizeQualityProfile(state.captureQualityProfile||getQualityProfileForSide(side)),
      captureFieldOrientation:state.captureFieldOrientation||state.fieldOrientation||'',
      actionStartedSeconds:state.actionStartedSeconds,
      actionStartedAt:state.actionStartedAt||''
    });
  }
  function selectWhoPosition(side,pos){
    const state=s(),p=+pos;
    if(!WHO_POSITIONS.includes(p))return {ok:false,reason:'WHO_INVALID'};
    const lineup=getLineup(side)||{},pid=lineup[p]||'';
    if(!pid&&!state.allowPositionOnly)return {ok:false,reason:'WHO_UNASSIGNED',pos:p};
    if(side==='own'){state.selectedPos=p;state.selectedOppPos=0}else{state.selectedOppPos=p;state.selectedPos=0}
    const firstWer=!state.pendingSide&&!state.selectedPlayerPos;
    if(firstWer){state.captureQualityProfile=getQualityProfileForSide(side);state.captureFieldOrientation=state.fieldOrientation}
    if(firstWer||state.autoServePreset)ensureActionStarted();
    state.pendingSide=side;state.selectedPlayerPos=p;state.selectedPlayerId=pid;state.actionZone=0;state.targetZone=0;state.targetSide='';
    if(!state.pendingAction)state.inputStep=SCOUTING_STEPS.ACTION;else if(!state.pendingQuality)state.inputStep=SCOUTING_STEPS.QUALITY;
    return {ok:true,type:'WHO_SELECTED',side,pos:p,pid,nextStep:state.inputStep};
  }
  function selectOriginZone(side,pos){
    const state=s(),p=+pos;
    if(side!==state.pendingSide)return {ok:false,reason:'ORIGIN_WRONG_SIDE'};
    const maxZone=originMaxZone(state.pendingAction);
    if(p<1||p>maxZone)return {ok:false,reason:'ORIGIN_INVALID',maxZone};
    state.actionZone=p;
    if(needsTarget(state.pendingSide,state.pendingAction)){state.inputStep=SCOUTING_STEPS.TARGET;return {ok:true,type:'ORIGIN_SELECTED',pos:p,targetRequired:true,nextStep:SCOUTING_STEPS.TARGET}}
    return {ok:true,type:'ACTION_COMPLETE',pos:p,targetRequired:false,draft:buildActionDraft()};
  }
  function selectPosition(side,pos){return s().inputStep===SCOUTING_STEPS.ORIGIN?selectOriginZone(side,pos):selectWhoPosition(side,pos)}
  function chooseAction(action){
    const state=s(),directOpponentServe=action==='Aufschlag'&&opponentServeDirectReady();
    if(!state.selectedPlayerPos&&!directOpponentServe)return {ok:false,reason:'WHO_REQUIRED'};
    ensureActionStarted();
    if(directOpponentServe){state.pendingSide='opponent';state.selectedPlayerPos=0;state.selectedPlayerId='';state.selectedOppPos=0;state.selectedPos=0;state.captureQualityProfile=getQualityProfileForSide('opponent');state.captureFieldOrientation=state.fieldOrientation}
    state.pendingAction=action;state.pendingQuality=null;state.actionZone=0;state.targetZone=0;state.targetSide='';state.setTempo='';state.setDistance='';state.serveTechnique='';state.inputStep=SCOUTING_STEPS.QUALITY;
    return {ok:true,type:'ACTION_SELECTED',action,directOpponentServe,detailed:detailedCapture(state.pendingSide),nextStep:SCOUTING_STEPS.QUALITY};
  }
  function chooseQuality(quality){
    const state=s();if(!state.pendingAction)return {ok:false,reason:'ACTION_REQUIRED'};
    const directOpponentServe=state.pendingSide==='opponent'&&state.pendingAction==='Aufschlag'&&state.servingSide==='them';
    if(!state.selectedPlayerPos&&!directOpponentServe)return {ok:false,reason:'WHO_REQUIRED'};
    ensureActionStarted();state.pendingQuality=quality;state.actionZone=0;state.targetZone=0;state.targetSide='';
    if(state.pendingAction==='Aufschlag'&&['=','#'].includes(quality))return {ok:true,type:'ACTION_COMPLETE',immediateServeResult:true,draft:buildActionDraft({allowServeErrorWithoutZone:true})};
    if(state.pendingAction==='Zuspiel'&&detailedCapture(state.pendingSide)){state.inputStep=SCOUTING_STEPS.SET_DETAIL;return {ok:true,type:'QUALITY_SELECTED',quality,nextStep:SCOUTING_STEPS.SET_DETAIL,detailed:true}}
    const inherited=applyInheritedOrigin();if(inherited)return {...inherited,quality,inheritedOrigin:true};
    state.inputStep=SCOUTING_STEPS.ORIGIN;return {ok:true,type:'QUALITY_SELECTED',quality,nextStep:SCOUTING_STEPS.ORIGIN,detailed:detailedCapture(state.pendingSide),maxZone:originMaxZone(state.pendingAction)};
  }
  function chooseServeTechnique(value){const state=s();ensureActionStarted();state.serveTechnique=value;state.inputStep=SCOUTING_STEPS.QUALITY;return {ok:true,type:'SERVE_TECHNIQUE_SELECTED',value,nextStep:SCOUTING_STEPS.QUALITY}}
  function chooseSetDetail(kind,value){const state=s();if(kind==='tempo')state.setTempo=value;else state.setDistance=value;if(state.setTempo&&state.setDistance){const inherited=applyInheritedOrigin();if(inherited)return {...inherited,type:inherited.type==='ACTION_COMPLETE'?'ACTION_COMPLETE':'SET_DETAILS_COMPLETE',tempo:state.setTempo,distance:state.setDistance,inheritedOrigin:true};state.inputStep=SCOUTING_STEPS.ORIGIN;return {ok:true,type:'SET_DETAILS_COMPLETE',tempo:state.setTempo,distance:state.setDistance,nextStep:SCOUTING_STEPS.ORIGIN}}return {ok:true,type:'SET_DETAIL_SELECTED',kind,value,nextStep:SCOUTING_STEPS.SET_DETAIL}}
  function selectTargetZone(side,pos){
    const state=s();if(state.inputStep!==SCOUTING_STEPS.TARGET)return {ok:false,reason:'NOT_TARGET_STEP'};
    const expected=targetSideFor(state.pendingSide,state.pendingAction);if(expected&&side!==expected)return {ok:false,reason:'TARGET_WRONG_SIDE',expected};
    const p=+pos,maxZone=targetMaxZone(state.pendingAction);if(p<1||p>maxZone)return {ok:false,reason:'TARGET_INVALID',maxZone};
    state.targetZone=p;state.targetSide=side;return {ok:true,type:'ACTION_COMPLETE',draft:buildActionDraft()};
  }

  return {detailedCapture,currentCaptureSide,inheritedOrigin,applyInheritedOrigin,originMaxZone,targetMaxZone,targetAllowsBothSides,needsTarget,targetSideFor,opponentServeDirectReady,ensureActionStarted,resetCaptureState,prepareOwnServePreset,buildActionDraft,selectWhoPosition,selectOriginZone,selectPosition,chooseAction,chooseQuality,chooseServeTechnique,chooseSetDetail,selectTargetZone};
}
