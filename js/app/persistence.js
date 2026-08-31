// VolleyTakt Live 0.4.0 RC2 - persistence orchestration boundary.
// Storage and sync implementations remain unchanged in Preview1.
import {cleanStateForSnapshot,cleanStateForStorage} from './state.js';

export function createPersistenceController({
  getMaster,getState,getEvents,getDisplayMeta,saveMaster,saveState,saveEvents,upsertMatchArchive,scheduleSync
}){
  function archiveCurrentMatch(statusOverride=''){
    const state=getState();
    if(!state.matchId)return;
    const fullState=cleanStateForSnapshot(state);
    const meta=getDisplayMeta(fullState);
    const status=statusOverride||(state.matchComplete?'ended':'active');
    upsertMatchArchive({schema:2,matchId:state.matchId,...meta,matchMode:state.matchMode,fixedSetCount:state.fixedSetCount,fixedFinalSetTarget:state.fixedFinalSetTarget,opponentCapture:!!state.opponentCapture,status,updatedAt:new Date().toISOString(),state:{setNo:state.setNo,setWinsUs:state.setWinsUs,setWinsThem:state.setWinsThem,scoreUs:state.scoreUs,scoreThem:state.scoreThem,matchComplete:state.matchComplete},fullState,events:[...getEvents()],videos:[...(state.videoAssignments||[])]});
  }
  function persist(){
    const state=getState();
    saveMaster(getMaster());
    saveState(cleanStateForStorage(state));
    saveEvents(getEvents());
    archiveCurrentMatch();
    scheduleSync();
  }
  return {persist,archiveCurrentMatch};
}
