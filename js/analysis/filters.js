import {analysisDate,actionName} from './domain.js';
export function filterMatches(matches,filters={},pinnedMatchId=''){
  const {from='',to='',seasonId='',teamId='',oppId='',typeId=''}=filters;
  const explicit=!!(from||to||seasonId||teamId||oppId||typeId);
  return (matches||[]).filter(match=>{
    if(pinnedMatchId&&!explicit&&match.matchId!==pinnedMatchId)return false;
    const date=analysisDate(match);
    if((from||to)&&!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
    return (!from||date>=from)&&(!to||date<=to)&&(!seasonId||match.seasonId===seasonId)&&(!teamId||match.ownTeamId===teamId)&&(!oppId||match.oppTeamId===oppId)&&(!typeId||match.matchTypeId===typeId);
  });
}
export function filterEvents(matches,filters={},actions=[]){
  const {playerId='',technique='',rotation='',setNo=''}=filters;const out=[];
  for(const match of matches||[])for(const event of match.events||[]){if(playerId&&event.player_id!==playerId)continue;if(technique&&actionName(event)!==technique)continue;if(rotation&&event.rotation!==rotation)continue;if(setNo&&String(event.set)!==String(setNo))continue;out.push({...event,_match:match});}
  return out;
}
export function normalizeAnalysisFilters(filters={}){return {from:filters.from||'',to:filters.to||'',seasonId:filters.seasonId||'',teamId:filters.teamId||'',oppId:filters.oppId||'',typeId:filters.typeId||'',playerId:filters.playerId||'',technique:filters.technique||'',rotation:filters.rotation||'',setNo:filters.setNo||''};}
