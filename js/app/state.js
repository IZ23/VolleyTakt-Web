// VolleyTakt Live 0.4.0 RC1 - central application state boundary.
// The persisted shape intentionally remains compatible with 0.3.2 Preview2-r7 rebuild3-fix2.

export const TRANSIENT_STATE_KEYS = Object.freeze([
  'selectedPos','selectedOppPos','pendingSide','pendingAction','pendingQuality','inputStep',
  'selectedPlayerId','selectedPlayerPos','actionZone','targetZone','targetSide','actionStartedSeconds','actionStartedAt',
  'setTempo','setDistance','serveTechnique','autoServePreset','cameraRecording'
]);

export function createDefaultState(today = new Date().toISOString().slice(0,10)) {
  return {
    quickScout:false,quickOwnName:'Wir',quickOppName:'Gegner',quickPlayers:{},matchDate:today,seasonId:'',ownTeamId:'',oppTeamId:'',matchTypeId:'',matchTypeName:'',matchMode:'regular',fixedSetCount:3,fixedFinalSetTarget:25,ownQualityProfile:'',opponentQualityProfile:'',setNo:1,setWinsUs:0,setWinsThem:0,firstSetServing:'',setReady:false,matchComplete:false,scoreUs:0,scoreThem:0,rotationIndex:0,oppRotationIndex:0,ownLineup:{},oppLineup:{},ownBaseLineup:{},oppBaseLineup:{},setLineupsOwn:{},setLineupsOpp:{},currentLiberosOwn:[],currentLiberosOpp:[],setLiberosOwn:{},setLiberosOpp:{},selectedPos:0,selectedOppPos:0,pendingSide:null,pendingAction:null,pendingQuality:null,opponentCapture:true,allowPositionOnly:false,autoRotate:true,servingSide:'',localClockRunning:false,localClockStartedAt:0,localClockElapsed:0,sessionStartedAt:0,clockMode:'local',activeTeamContext:'own',matchId:'',syncGeneration:0,currentRallyId:'',currentRallyNo:0,currentRallySeq:0,rallyCounter:0,rallyHighWater:0,rallyStartServing:'',currentRallyPhase:'',currentTransitionNo:1,lastActionSide:'',rallyBallZone:0,rallyBallSide:'',inputStep:'WER',selectedPlayerId:'',selectedPlayerPos:0,actionZone:0,targetZone:0,targetSide:'',actionStartedSeconds:null,actionStartedAt:'',setTempo:'',setDistance:'',serveTechnique:'',autoServePreset:false,captureQualityProfile:'',captureFieldOrientation:'',videoClipId:'',videoClipCounter:0,cameraRecording:false,fieldOrientation:'activeBottom',videoAssignments:[]
  };
}

export function normalizeLoadedState(source = {}, defaults = createDefaultState()) {
  const state = {...defaults, ...source};
  state.quickPlayers={...(state.quickPlayers||{})};
  state.quickScout=state.quickScout===true;
  state.ownLineup={...(state.ownLineup||{})};
  state.oppLineup={...(state.oppLineup||{})};
  state.ownBaseLineup={...(state.ownBaseLineup||state.ownLineup)};
  state.oppBaseLineup={...(state.oppBaseLineup||state.oppLineup)};
  state.setLineupsOwn={...(state.setLineupsOwn||{})};
  state.setLineupsOpp={...(state.setLineupsOpp||{})};
  state.currentLiberosOwn=[...(state.currentLiberosOwn||[])].filter(Boolean).slice(0,2);
  state.currentLiberosOpp=[...(state.currentLiberosOpp||[])].filter(Boolean).slice(0,2);
  state.setLiberosOwn={...(state.setLiberosOwn||{})};
  state.setLiberosOpp={...(state.setLiberosOpp||{})};
  Object.keys(state.setLiberosOwn).forEach(k=>state.setLiberosOwn[k]=[...(state.setLiberosOwn[k]||[])].filter(Boolean).slice(0,2));
  Object.keys(state.setLiberosOpp).forEach(k=>state.setLiberosOpp[k]=[...(state.setLiberosOpp[k]||[])].filter(Boolean).slice(0,2));
  state.setWinsUs=Math.max(0,+state.setWinsUs||0);
  state.setWinsThem=Math.max(0,+state.setWinsThem||0);
  state.matchMode=state.matchMode==='fixed'?'fixed':'regular';
  state.fixedSetCount=Math.min(5,Math.max(1,+state.fixedSetCount||3));
  state.fixedFinalSetTarget=+state.fixedFinalSetTarget===15?15:25;
  state.setReady=state.setReady===true;
  state.matchComplete=state.matchComplete===true;
  state.rallyCounter=Math.max(0,+state.rallyCounter||0);
  state.currentRallyNo=Math.max(0,+state.currentRallyNo||0);
  state.currentRallySeq=Math.max(0,+state.currentRallySeq||0);
  if(!['own','opponent'].includes(state.activeTeamContext))state.activeTeamContext='own';
  if(!['WER','WAS','SERVEDETAIL','WIE','SETDETAIL','WO','TARGET'].includes(state.inputStep))state.inputStep='WER';
  state.selectedPlayerId=state.selectedPlayerId||'';
  state.selectedPlayerPos=Math.max(0,+state.selectedPlayerPos||0);
  state.actionZone=Math.max(0,+state.actionZone||0);
  state.targetZone=Math.max(0,+state.targetZone||0);
  state.targetSide=state.targetSide==='opponent'?'opponent':state.targetSide==='own'?'own':'';
  state.actionStartedSeconds=Number.isFinite(+state.actionStartedSeconds)?+state.actionStartedSeconds:null;
  state.actionStartedAt=state.actionStartedAt||'';
  state.setTempo=state.setTempo||'';
  state.setDistance=state.setDistance||'';
  state.serveTechnique=state.serveTechnique||'';
  state.autoServePreset=state.autoServePreset===true;
  state.currentTransitionNo=Math.max(1,+state.currentTransitionNo||1);
  state.rallyStartServing=state.rallyStartServing||'';
  state.currentRallyPhase=state.currentRallyPhase||'';
  state.lastActionSide=state.lastActionSide||'';
  state.rallyBallZone=Math.max(0,+state.rallyBallZone||0);
  state.rallyBallSide=state.rallyBallSide==='opponent'?'opponent':state.rallyBallSide==='own'?'own':'';
  state.videoAssignments=[...(state.videoAssignments||[])];
  return state;
}

export function cleanStateForStorage(source = {}) {
  return {...source,selectedPos:0,selectedOppPos:0,pendingSide:null,pendingAction:null,pendingQuality:null,inputStep:'WER',selectedPlayerId:'',selectedPlayerPos:0,actionZone:0,targetZone:0,targetSide:'',actionStartedSeconds:null,actionStartedAt:'',setTempo:'',setDistance:'',serveTechnique:'',autoServePreset:false};
}

export function cleanStateForSnapshot(source = {}) {
  return {...cleanStateForStorage(source),cameraRecording:false};
}
