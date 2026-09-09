// VolleyTakt Live · UI-LIBRARY-EDIT1 / DATA-MATCHDATE1
// Pure helpers: library date always comes from the explicit matchDate metadata.
export function libraryDisplayDate(match={}){
  return String(match?.matchDate||match?.fullState?.matchDate||match?.state?.matchDate||'').slice(0,10);
}

export function applyMatchMetadata(snapshot={},patch={},updatedAt=new Date().toISOString()){
  const full={...(snapshot?.fullState||snapshot?.state||{})};
  const state={...(snapshot?.state||full)};
  const fields=['matchDate','seasonId','ownTeamId','oppTeamId','matchTypeId','matchTypeName','ownTeamName','oppTeamName'];
  const top={...snapshot};
  for(const key of fields){
    if(!(key in patch))continue;
    const value=patch[key]??'';
    top[key]=value;full[key]=value;state[key]=value;
  }
  top.fullState=full;
  top.state=state;
  top.updatedAt=updatedAt;
  return top;
}
