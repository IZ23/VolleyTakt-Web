// VolleyTakt Live 0.4.0 RC4-r1
// Pure rotation and set/match state transitions. No DOM, storage or event I/O.

export function rotateLineup(lineup={},dir=1){
  const old={...(lineup||{})};
  return dir>0
    ?{1:old[2]||'',2:old[3]||'',3:old[4]||'',4:old[5]||'',5:old[6]||'',6:old[1]||''}
    :{1:old[6]||'',2:old[1]||'',3:old[2]||'',4:old[3]||'',5:old[4]||'',6:old[5]||''};
}

export function rotationTransition({lineup={},rotationIndex=0,dir=1}={}){
  const before={...(lineup||{})};
  const indexBefore=Number(rotationIndex||0)%6;
  const after=rotateLineup(before,dir);
  const indexAfter=(indexBefore+(dir>0?1:5))%6;
  return {lineupBefore:before,lineupAfter:after,indexBefore,indexAfter};
}

export function setLineupTransition({side='own',lineup={},liberos=[],setNo=1}={}){
  const target={...(lineup||{})};
  const ls=[...(liberos||[])].filter(Boolean).slice(0,2);
  const key=String(setNo||1);
  if(side==='opponent')return {
    oppLineup:target,oppBaseLineup:{...target},currentLiberosOpp:ls,
    setLineupsOpp:{key,lineup:{...target}},setLiberosOpp:{key,liberos:[...ls]},oppRotationIndex:0
  };
  return {
    ownLineup:target,ownBaseLineup:{...target},currentLiberosOwn:ls,
    setLineupsOwn:{key,lineup:{...target}},setLiberosOwn:{key,liberos:[...ls]},rotationIndex:0
  };
}

export function nextSetTransition({finishedSet=1}={}){
  return {
    setNo:Number(finishedSet||1)+1,
    scoreUs:0,scoreThem:0,rotationIndex:0,oppRotationIndex:0,
    ownLineup:{},oppLineup:{},ownBaseLineup:{},oppBaseLineup:{},
    currentLiberosOwn:[],currentLiberosOpp:[],servingSide:'',setReady:false
  };
}

export function matchFinishedTransition(){
  return {matchComplete:true,setReady:false};
}

export function beginSetSetupTransition({quickScout=false,ownLineup={},oppLineup={}}={}){
  const base={setReady:false,rotationIndex:0,oppRotationIndex:0,servingSide:''};
  if(!quickScout)return base;
  return {...base,ownLineup:{...ownLineup},oppLineup:{...oppLineup},ownBaseLineup:{...ownLineup},oppBaseLineup:{...oppLineup},currentLiberosOwn:[],currentLiberosOpp:[]};
}
