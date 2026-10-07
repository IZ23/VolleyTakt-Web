// VolleyTakt Live 0.4.0 RC5 - DOM-free rally lifecycle / automatic scoring domain.
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
      state.lastActionName='';
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
    state.lastActionName='';
    state.rallyBallZone=0;
    state.rallyBallSide='';
    return {ok:true,type:'RALLY_CLOSED'};
  }

  function contextForAction(side,action=''){
    const state=s();
    ensureActiveRally();
    const normalizedSide=side==='opponent'?'opponent':'own';
    const normalizedAction=String(action||'').replace(/^Gegner\s+/,'');
    let transitionTrigger='';
    // Explicit K3 capture: a transition begins only when an opponent attack is
    // followed by our block/defense. Subsequent own actions stay in K3 until
    // the next observed opponent sequence or rally end.
    if(normalizedSide==='own'&&['Block','Abwehr'].includes(normalizedAction)&&state.lastActionSide==='opponent'&&state.lastActionName==='Angriff'){
      state.currentTransitionNo=Math.max(1,+state.currentTransitionNo||1)+1;
      state.currentRallyPhase='K3';
      transitionTrigger=normalizedAction;
    }
    return {
      rally_phase:state.currentRallyPhase||(state.rallyStartServing==='them'?'K1':'K2'),
      transition_no:String(state.currentTransitionNo||1),
      transition_trigger:transitionTrigger,
      transition_source:transitionTrigger?'opponent_attack':''
    };
  }

  function markActionSide(side,action=''){const state=s();state.lastActionSide=side==='opponent'?'opponent':'own';state.lastActionName=String(action||'').replace(/^Gegner\s+/,'')}

  return Object.freeze({ensureActiveRally,nextRallyMeta,closeActiveRally,contextForAction,markActionSide});
}
