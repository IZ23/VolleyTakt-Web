export function analysisDate(match){
  return String(match?.matchDate||match?.events?.find(e=>e.createdAt)?.createdAt||'').slice(0,10);
}

export function actionName(event){
  return String(event?.action||'').replace(/^Gegner\s+/,'');
}

export function actionSide(event){
  return String(event?.action||'').startsWith('Gegner ')?'opponent':'own';
}

export function isAction(event,actions=[]){
  return event?.event_type==='action'||event?.rally_event==='action'||actions.includes(actionName(event));
}

export function filterMatches(matches,filters={},pinnedMatchId=''){
  const {from='',to='',seasonId='',teamId='',oppId='',typeId=''}=filters;
  return (matches||[]).filter(match=>{
    if(pinnedMatchId&&match.matchId!==pinnedMatchId)return false;
    const date=analysisDate(match);
    return (!from||date>=from)&&(!to||date<=to)&&(!seasonId||match.seasonId===seasonId)&&(!teamId||match.ownTeamId===teamId)&&(!oppId||match.oppTeamId===oppId)&&(!typeId||match.matchTypeId===typeId);
  });
}

export function filterEvents(matches,filters={},actions=[]){
  const {playerId='',technique='',rotation='',setNo=''}=filters;
  const out=[];
  for(const match of matches||[])for(const event of match.events||[]){
    if(playerId&&event.player_id!==playerId)continue;
    if(technique&&actionName(event)!==technique)continue;
    if(rotation&&event.rotation!==rotation)continue;
    if(setNo&&String(event.set)!==String(setNo))continue;
    out.push({...event,_match:match});
  }
  return out;
}

export function percent(n,d){return d?`${(100*n/d).toFixed(1)} %`:'–'}

export function rallyMap(events,actions=[]){
  const map=new Map();
  for(const event of events||[]){
    if(!event.rally_id)continue;
    if(!map.has(event.rally_id))map.set(event.rally_id,{id:event.rally_id,actions:[],result:null});
    const rally=map.get(event.rally_id);
    if(event.event_type==='rally_result')rally.result=event;
    else if(isAction(event,actions))rally.actions.push(event);
  }
  for(const rally of map.values())rally.actions.sort((a,b)=>(+a.rally_sequence||0)-(+b.rally_sequence||0));
  return map;
}

export function rallyForEvent(map,event){return event?.rally_id?map.get(event.rally_id):null}
export function wonOwn(rally){return rally?.result?.rally_winner==='us'}

export function firstBallSideout(rally){
  if(!rally?.result||rally.result.serving_before!=='them')return false;
  const attacks=rally.actions.filter(event=>actionSide(event)==='own'&&actionName(event)==='Angriff');
  if(!attacks.length)return false;
  const first=attacks[0];
  return wonOwn(rally)&&first.value==='#'&&!rally.actions.some(event=>(+event.rally_sequence||0)>(+first.rally_sequence||0)&&actionSide(event)==='own'&&actionName(event)==='Angriff');
}

export function stats(matches,events,actions=[]){
  const actionEvents=(events||[]).filter(event=>isAction(event,actions));
  const rallies=(events||[]).filter(event=>event.event_type==='rally_result');
  const own=rallies.filter(event=>event.rally_winner==='us').length;
  const opp=rallies.filter(event=>event.rally_winner==='them').length;
  return {matches:(matches||[]).length,actions:actionEvents.length,rallies:rallies.length,own,opp,win:percent(own,rallies.length)};
}
