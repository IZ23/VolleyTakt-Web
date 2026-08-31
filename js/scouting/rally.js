// VolleyTakt Live 0.4.0 RC2 - DOM-free rally lifecycle / automatic scoring domain.
// Responsibility: rally identity/sequence, K1/K2/K3 transition context and automatic winner decision.
// Event persistence, score mutation, side-out/rotation, set handling, rendering and status messages stay outside.

export function automaticPointFor(side,action,quality){
  const normalizedSide=side==='opponent'?'opponent':'own';
  if(quality==='=')return normalizedSide==='own'?'them':'us';
  if(quality==='#'&&['Aufschlag','Angriff','Block'].includes(action))return normalizedSide==='own'?'us':'them';
  return '';
}

export function createRallyController({getState,newId}){
  if(typeof getState!=='function')throw new TypeError('getState required');
  if(typeof newId!=='function')throw new TypeError('newId required');
  const s=()=>getState();

  function ensureActiveRally(){
    const state=s();
    if(!state.currentRallyId){
      const nextNo=Math.max(0,+state.rallyCounter||0,+state.rallyHighWater||0)+1;
      state.rallyCounter=nextNo;
      state.rallyHighWater=Math.max(+state.rallyHighWater||0,nextNo);
      state.currentRallyId=newId('rally');
      state.currentRallyNo=nextNo;
      state.currentRallySeq=0;
      state.rallyStartServing=state.servingSide||'';
      state.currentRallyPhase=state.servingSide==='them'?'K1':'K2';
      state.currentTransitionNo=1;
      state.lastActionSide='';
    }
    return {rally_id:state.currentRallyId,rally_no:String(state.currentRallyNo)};
  }

  function nextRallyMeta(kind='action'){
    const state=s(),r=ensureActiveRally();
    state.currentRallySeq=Math.max(0,+state.currentRallySeq||0)+1;
    return {...r,rally_sequence:String(state.currentRallySeq),rally_event:kind};
  }

  function closeActiveRally(){
    const state=s();
    state.currentRallyId='';
    state.currentRallyNo=0;
    state.currentRallySeq=0;
    state.rallyStartServing='';
    state.currentRallyPhase='';
    state.currentTransitionNo=1;
    state.lastActionSide='';
    state.rallyBallZone=0;
    state.rallyBallSide='';
    return {ok:true,type:'RALLY_CLOSED'};
  }

  function contextForAction(side){
    const state=s();
    ensureActiveRally();
    if(state.lastActionSide&&state.lastActionSide!==side&&side==='own'){
      state.currentTransitionNo=Math.max(1,+state.currentTransitionNo||1)+1;
      if(state.currentTransitionNo>1)state.currentRallyPhase='K3';
    }
    return {
      rally_phase:state.currentRallyPhase||(state.rallyStartServing==='them'?'K1':'K2'),
      transition_no:String(state.currentTransitionNo||1)
    };
  }

  function markActionSide(side){s().lastActionSide=side==='opponent'?'opponent':'own'}

  return Object.freeze({ensureActiveRally,nextRallyMeta,closeActiveRally,contextForAction,markActionSide});
}
