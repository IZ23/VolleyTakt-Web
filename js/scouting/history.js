// VolleyTakt Live 0.4.0 RC5
// Pure event-history helpers for undo grouping and state reconstruction.
// No DOM, storage, CSV I/O, rendering or persistence access.

import {rotateLineup} from './match-flow.js';

export function safeHistoryJson(value,fallback={}){
  try{
    const v=JSON.parse(value||JSON.stringify(fallback));
    if(Array.isArray(fallback))return Array.isArray(v)?v:[...fallback];
    return v&&typeof v==='object'&&!Array.isArray(v)?v:{...fallback};
  }catch{
    return Array.isArray(fallback)?[...fallback]:{...fallback};
  }
}

export function undoEventBatch(source=[]){
  const events=[...(source||[])];
  if(!events.length)return {events,removed:[]};
  const removed=[];
  const last=events.at(-1);
  const transaction=last?.transaction_id||'';
  const group=last?.event_group||'';
  if(transaction){
    while(events.length&&events.at(-1)?.transaction_id===transaction)removed.push(events.pop());
  }else if(group){
    while(events.length&&events.at(-1)?.event_group===group)removed.push(events.pop());
  }else{
    removed.push(events.pop());
    const first=removed[0];
    if(String(first?.action||'').includes('Rotation')&&events.at(-1)?.sideout==='1'&&String(events.at(-1)?.action||'').startsWith('Punkt '))removed.push(events.pop());
  }
  removed.reverse();
  return {events,removed};
}


export function restoreEventBatch(source=[],batch=[]){
  return [...(source||[]),...(batch||[])];
}

export function reconstructMatchState(rows=[],{
  rotationLabels=['R1','R6','R5','R4','R3','R2'],
  firstSetServing='',
  rallyCounter=0,
  rallyHighWater=0,
  setLiberosOwn={},
  setLiberosOpp={},
  isTechniqueEvent=()=>false,
  servingForSet=()=>'',
  isMatchFinishedAfterSet=()=>false
}={}){
  let su=0,st=0,setNo=1,ri=0,ori=0,serving='',winsUs=0,winsThem=0,ready=false,complete=false,firstServing=firstSetServing||'';
  let own={},opp={},ownBase={},oppBase={},openRallyId='',openRallyNo=0,openRallySeq=0,maxRallyCounter=0;
  let currentLiberosOwn=[],currentLiberosOpp=[];
  const liberOwn={...(setLiberosOwn||{})},liberOpp={...(setLiberosOpp||{})};

  for(const r of rows||[]){
    const rs=Math.max(1,parseInt(r.set||String(setNo))||setNo);
    setNo=rs;
    maxRallyCounter=Math.max(maxRallyCounter,+r.rally_no||0);
    if(r.event_type==='set_start'||r.action==='Satzstart'){
      su=0;st=0;ri=0;ori=0;serving=r.serving_after||servingForSet(rs);
      own=safeHistoryJson(r.own_lineup,{});opp=safeHistoryJson(r.opp_lineup,{});
      currentLiberosOwn=safeHistoryJson(r.own_liberos,[]).filter(Boolean).slice(0,2);
      currentLiberosOpp=safeHistoryJson(r.opp_liberos,[]).filter(Boolean).slice(0,2);
      liberOwn[String(rs)]=[...currentLiberosOwn];liberOpp[String(rs)]=[...currentLiberosOpp];
      ownBase={...own};oppBase={...opp};winsUs=+r.set_wins_us||winsUs;winsThem=+r.set_wins_them||winsThem;
      if(rs===1&&serving)firstServing=serving;
      ready=true;complete=false;openRallyId='';openRallyNo=0;openRallySeq=0;
      continue;
    }
    if(isTechniqueEvent(r)&&r.rally_id){openRallyId=r.rally_id;openRallyNo=+r.rally_no||openRallyNo;openRallySeq=Math.max(openRallySeq,+r.rally_sequence||0)}
    const isResult=r.event_type==='rally_result'||r.event_type==='point'||r.action==='Punkt wir'||r.action==='Punkt Gegner';
    const isOppRot=r.rotation_side==='opponent'||String(r.action||'').startsWith('Gegner Rotation');
    if(r.rotation&&rotationLabels.includes(r.rotation)){if(isOppRot)ori=rotationLabels.indexOf(r.rotation);else ri=rotationLabels.indexOf(r.rotation)}
    if(String(r.action||'').includes('Rotation')){
      const target=isOppRot?opp:own;
      if(r.lineup_after){if(isOppRot)opp=safeHistoryJson(r.lineup_after,opp);else own=safeHistoryJson(r.lineup_after,own)}
      else{const dir=String(r.action||'').includes('zurück')?-1:1;if(isOppRot)opp=rotateLineup(target,dir);else own=rotateLineup(target,dir)}
    }
    if(r.event_type==='substitution'||r.event_type==='libero_replacement'||r.action==='Wechsel'||r.action==='Libero'){
      if(r.lineup_after){if(r.rotation_side==='opponent')opp=safeHistoryJson(r.lineup_after,opp);else own=safeHistoryJson(r.lineup_after,own)}
    }
    if(isResult){
      const winner=r.rally_winner||(r.action==='Punkt wir'?'us':r.action==='Punkt Gegner'?'them':'');
      if(winner==='us')su++;else if(winner==='them')st++;
      serving=r.serving_after||winner||serving;openRallyId='';openRallyNo=0;openRallySeq=0;
    }else if(r.action==='Spielstandskorrektur'){
      const m=String(r.value||'').match(/->(\d+):(\d+)/);
      if(m){su=+m[1];st=+m[2]}else{su=+r.score_us||su;st=+r.score_them||st}
    }
    if(r.event_type==='set_end'||r.action==='Satzende'){
      winsUs=+r.set_wins_us||winsUs+(r.set_winner==='us'?1:0);winsThem=+r.set_wins_them||winsThem+(r.set_winner==='them'?1:0);
      ready=false;complete=isMatchFinishedAfterSet(rs,winsUs,winsThem);openRallyId='';openRallyNo=0;openRallySeq=0;
      if(!complete){setNo=rs+1;su=0;st=0;ri=0;ori=0;serving='';own={};opp={};ownBase={};oppBase={};currentLiberosOwn=[];currentLiberosOpp=[]}
    }
  }

  return {
    scoreUs:su,scoreThem:st,setNo,setWinsUs:winsUs,setWinsThem:winsThem,firstSetServing:firstServing,
    rotationIndex:ri,oppRotationIndex:ori,servingSide:serving,ownLineup:own,oppLineup:opp,
    ownBaseLineup:ownBase,oppBaseLineup:oppBase,currentLiberosOwn,currentLiberosOpp,
    setLiberosOwn:liberOwn,setLiberosOpp:liberOpp,setReady:ready,matchComplete:complete,
    rallyCounter:Math.max(+rallyCounter||0,maxRallyCounter),rallyHighWater:Math.max(+rallyHighWater||0,+rallyCounter||0,maxRallyCounter),currentRallyId:openRallyId,currentRallyNo:openRallyNo,currentRallySeq:openRallySeq
  };
}
