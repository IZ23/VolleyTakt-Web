// VolleyTakt Live · RC6-4 deep volleyball analysis
import {actionName,actionSide,isAction,percent,playerLabel,zoneLabel,attackEfficiency} from './domain.js';
import {rallyMap,wonOwn,firstBallSideout} from './rallies.js';

const pctNum=(n,d)=>d?100*n/d:null;
const phaseOf=r=>r?.result?.serving_before==='them'?'K1':r?.result?.serving_before==='us'?'K2':'K3';
const nextOwn=(r,seq,name)=>r?.actions?.find(e=>(+e.rally_sequence||0)>seq&&actionSide(e)==='own'&&actionName(e)===name)||null;
const priorOwn=(r,seq,name)=>[...(r?.actions||[])].reverse().find(e=>(+e.rally_sequence||0)<seq&&actionSide(e)==='own'&&actionName(e)===name)||null;
const priorAny=(r,seq,name,side='')=>[...(r?.actions||[])].reverse().find(e=>(+e.rally_sequence||0)<seq&&(!side||actionSide(e)===side)&&actionName(e)===name)||null;

export function analyzeServeSemantic(events,{actions=[]}={}){
 const rm=rallyMap(events,actions),groups=new Map();
 for(const e of events.filter(e=>isAction(e,actions)&&actionSide(e)==='own'&&actionName(e)==='Aufschlag')){
  const p=playerLabel(e),tech=e.serve_technique||'nicht erfasst',z=zoneLabel(e.target_zone),k=`${p}|${tech}|${z}`;
  if(!groups.has(k))groups.set(k,{p,tech,z,n:0,error:0,ace:0,inPlay:0,breaks:0,oppRec:0,oppPositive:0});
  const g=groups.get(k),r=rallyForEventSafe(rm,e);g.n++;
  if(e.value==='=')g.error++; else if(e.value==='#')g.ace++; else g.inPlay++;
  if(wonOwn(r))g.breaks++;
  const rec=r?.actions.find(x=>actionSide(x)==='opponent'&&actionName(x)==='Annahme');
  if(rec){g.oppRec++;if(['+','#'].includes(rec.value))g.oppPositive++}
 }
 return [...groups.values()].sort((a,b)=>b.n-a.n).map(g=>({...g,errorRate:percent(g.error,g.n),aceRate:percent(g.ace,g.n),inPlayRate:percent(g.inPlay,g.n),breakRate:percent(g.breaks,g.n),oppPositiveRate:percent(g.oppPositive,g.oppRec)}));
}
function rallyForEventSafe(map,e){return e?.rally_id?map.get(e.rally_id):null}

export function analyzeFirstBallDeep(events,{actions=[],rotations=[]}={}){
 const rm=rallyMap(events,actions),k1=[...rm.values()].filter(r=>r.result?.serving_before==='them');
 const build=rows=>{
  const recs=rows.map(r=>r.actions.find(e=>actionSide(e)==='own'&&actionName(e)==='Annahme')).filter(Boolean);
  const sets=rows.map(r=>r.actions.find(e=>actionSide(e)==='own'&&actionName(e)==='Zuspiel')).filter(Boolean);
  const firstAtt=rows.map(r=>r.actions.find(e=>actionSide(e)==='own'&&actionName(e)==='Angriff')).filter(Boolean);
  const won=rows.filter(wonOwn).length,fb=rows.filter(firstBallSideout).length;
  return {rallies:rows.length,sideout:percent(won,rows.length),firstBall:percent(fb,rows.length),recPositive:percent(recs.filter(e=>['+','#'].includes(e.value)).length,recs.length),recPerfect:percent(recs.filter(e=>e.value==='#').length,recs.length),attackKill:percent(firstAtt.filter(e=>e.value==='#').length,firstAtt.length),sets:sets.length,attacks:firstAtt.length};
 };
 const byRotation=rotations.map(rotation=>({rotation,...build(k1.filter(r=>r.result.rotation===rotation))}));
 const byReception=['#','+','!','0','-','/','='].map(q=>{const rows=k1.filter(r=>r.actions.some(e=>actionSide(e)==='own'&&actionName(e)==='Annahme'&&e.value===q));return {quality:q,...build(rows)}}).filter(x=>x.rallies);
 return {total:build(k1),byRotation,byReception};
}

export function analyzeK3(events,{actions=[],rotations=[]}={}){
 const rm=rallyMap(events,actions),transitions=[];
 for(const r of rm.values()){
  if(!r.result)continue;
  const a=r.actions;
  for(let i=0;i<a.length;i++){
   const trigger=a[i];
   if(actionSide(trigger)!=='own'||!['Block','Abwehr'].includes(actionName(trigger)))continue;
   const prevOpp=priorAny(r,+trigger.rally_sequence||0,'Angriff','opponent');
   if(!prevOpp)continue;
   const set=nextOwn(r,+trigger.rally_sequence||0,'Zuspiel');
   const attack=set?nextOwn(r,+set.rally_sequence||0,'Angriff'):nextOwn(r,+trigger.rally_sequence||0,'Angriff');
   if(!attack)continue;
   transitions.push({rallyId:r.id,rotation:r.result.rotation||trigger.rotation||'',trigger:actionName(trigger),triggerQuality:trigger.value||'',set,attack,won:wonOwn(r),kill:attack.value==='#',attackError:attack.value==='=',from:attack.action_zone||0,to:attack.target_zone||0});
   break;
  }
 }
 const summarize=rows=>({n:rows.length,won:rows.filter(x=>x.won).length,winRate:percent(rows.filter(x=>x.won).length,rows.length),kills:rows.filter(x=>x.kill).length,killRate:percent(rows.filter(x=>x.kill).length,rows.length),attackErrors:rows.filter(x=>x.attackError).length});
 return {total:summarize(transitions),byRotation:rotations.map(rotation=>({rotation,...summarize(transitions.filter(x=>x.rotation===rotation))})),byTrigger:['Block','Abwehr'].map(trigger=>({trigger,...summarize(transitions.filter(x=>x.trigger===trigger))})),transitions};
}

export function analyzeBlockDefense(events,{actions=[]}={}){
 const rm=rallyMap(events,actions),rows=new Map();
 for(const e of events.filter(e=>isAction(e,actions)&&actionSide(e)==='own'&&['Block','Abwehr'].includes(actionName(e)))){
   const name=actionName(e),p=playerLabel(e),k=`${name}|${p}`;
   if(!rows.has(k))rows.set(k,{technique:name,p,n:0,direct:0,continued:0,transitionAttack:0,transitionWon:0});
   const g=rows.get(k),r=rallyForEventSafe(rm,e);g.n++;if(e.value==='#')g.direct++;
   const set=nextOwn(r,+e.rally_sequence||0,'Zuspiel'),att=set?nextOwn(r,+set.rally_sequence||0,'Angriff'):nextOwn(r,+e.rally_sequence||0,'Angriff');
   if(set||att)g.continued++;if(att){g.transitionAttack++;if(wonOwn(r))g.transitionWon++}
 }
 return [...rows.values()].sort((a,b)=>b.n-a.n).map(g=>({...g,directRate:percent(g.direct,g.n),continuedRate:percent(g.continued,g.n),transitionWinRate:percent(g.transitionWon,g.transitionAttack)}));
}

export function analyzeReceptionDeep(events,{actions=[]}={}){
 const rm=rallyMap(events,actions),map=new Map();
 for(const e of events.filter(e=>isAction(e,actions)&&actionSide(e)==='own'&&actionName(e)==='Annahme')){
   const r=rallyForEventSafe(rm,e),p=playerLabel(e),rot=r?.result?.rotation||e.rotation||'',k=`${p}|${rot}`;
   if(!map.has(k))map.set(k,{p,rotation:rot,n:0,pos:0,perfect:0,err:0,so:0,fb:0,setTargets:new Map(),attack:0,kill:0});
   const g=map.get(k);g.n++;if(['+','#'].includes(e.value))g.pos++;if(e.value==='#')g.perfect++;if(e.value==='=')g.err++;if(wonOwn(r))g.so++;if(firstBallSideout(r))g.fb++;
   const set=nextOwn(r,+e.rally_sequence||0,'Zuspiel'),att=set?nextOwn(r,+set.rally_sequence||0,'Angriff'):null;
   if(set){const z=zoneLabel(set.target_zone);g.setTargets.set(z,(g.setTargets.get(z)||0)+1)}
   if(att){g.attack++;if(att.value==='#')g.kill++}
 }
 return [...map.values()].sort((a,b)=>b.n-a.n).map(g=>({...g,posRate:percent(g.pos,g.n),perfectRate:percent(g.perfect,g.n),errorRate:percent(g.err,g.n),sideoutRate:percent(g.so,g.n),firstBallRate:percent(g.fb,g.n),followKillRate:percent(g.kill,g.attack),setTargets:[...g.setTargets].sort((a,b)=>b[1]-a[1])}));
}

export function analyzeSetDeep(events,{actions=[]}={}){
 const rm=rallyMap(events,actions),groups=new Map();
 for(const e of events.filter(e=>isAction(e,actions)&&actionSide(e)==='own'&&actionName(e)==='Zuspiel')){
  const r=rallyForEventSafe(rm,e),next=nextOwn(r,+e.rally_sequence||0,'Angriff'),rec=priorOwn(r,+e.rally_sequence||0,'Annahme');
  const from=zoneLabel(e.action_zone),to=zoneLabel(e.target_zone),tempo=e.set_tempo||'–',dist=e.set_distance||'–',p=playerLabel(e),rot=r?.result?.rotation||e.rotation||'',recQ=rec?.value||'–',phase=phaseOf(r);
  const k=`${p}|${rot}|${phase}|${from}|${to}|${tempo}|${dist}|${recQ}`;
  if(!groups.has(k))groups.set(k,{p,rotation:rot,phase,from,to,tempo,dist,recQ,n:0,att:0,kill:0,won:0});
  const g=groups.get(k);g.n++;if(next){g.att++;if(next.value==='#')g.kill++}if(wonOwn(r))g.won++;
 }
 return [...groups.values()].sort((a,b)=>b.n-a.n).map(g=>({...g,followKillRate:percent(g.kill,g.att),rallyWinRate:percent(g.won,g.n)}));
}

export function analyzeAttackDeep(events,{actions=[]}={}){
 const rm=rallyMap(events,actions),groups=new Map();
 for(const e of events.filter(e=>isAction(e,actions)&&actionSide(e)==='own'&&actionName(e)==='Angriff')){
  const r=rallyForEventSafe(rm,e),set=priorOwn(r,+e.rally_sequence||0,'Zuspiel'),rec=set?priorOwn(r,+set.rally_sequence||0,'Annahme'):priorOwn(r,+e.rally_sequence||0,'Annahme');
  const p=playerLabel(e),from=zoneLabel(e.action_zone),to=zoneLabel(e.target_zone),rot=r?.result?.rotation||e.rotation||'',phase=phaseOf(r),recQ=rec?.value||'–',tempo=set?.set_tempo||'–';
  const k=`${p}|${rot}|${phase}|${from}|${to}|${recQ}|${tempo}`;
  if(!groups.has(k))groups.set(k,{p,rotation:rot,phase,from,to,recQ,tempo,n:0,kill:0,err:0,blocked:0,won:0});
  const g=groups.get(k);g.n++;if(e.value==='#')g.kill++;if(e.value==='=')g.err++;if(e.value==='/')g.blocked++;if(wonOwn(r))g.won++;
 }
 return [...groups.values()].sort((a,b)=>b.n-a.n).map(g=>({...g,killRate:percent(g.kill,g.n),errorRate:percent(g.err,g.n),blockedRate:percent(g.blocked,g.n),efficiency:attackEfficiency(g.kill,g.err,g.blocked,g.n),rallyWinRate:percent(g.won,g.n)}));
}

export function analyzeTargets(events,{actions=[]}={}){
 const rm=rallyMap(events,actions),groups=new Map();
 for(const e of events.filter(e=>isAction(e,actions)&&actionSide(e)==='own'&&['Angriff','Aufschlag'].includes(actionName(e)))){
   const tech=actionName(e),from=zoneLabel(e.action_zone),to=zoneLabel(e.target_zone),k=`${tech}|${from}|${to}`;
   if(!groups.has(k))groups.set(k,{technique:tech,from,to,n:0,success:0,error:0});
   const g=groups.get(k),r=rallyForEventSafe(rm,e);g.n++;if((tech==='Angriff'&&e.value==='#')||(tech==='Aufschlag'&&wonOwn(r)))g.success++;if(e.value==='=')g.error++;
 }
 return [...groups.values()].sort((a,b)=>b.n-a.n).map(g=>({...g,successRate:percent(g.success,g.n),errorRate:percent(g.error,g.n)}));
}

export function analyzePlayerDeep(events,{actions=[],players=[]}={}){
 const rm=rallyMap(events,actions);
 return players.map(player=>{
   const ev=events.filter(e=>e.player_id===player.id&&isAction(e,actions)&&actionSide(e)==='own');if(!ev.length)return null;
   const phases={K1:{n:0,w:0},K2:{n:0,w:0},K3:{n:0,w:0}},rots=new Map(),tech=new Map();
   for(const e of ev){
     const r=rallyForEventSafe(rm,e);
     const seq=+e.rally_sequence||0;
     const transitionTrigger=[...(r?.actions||[])].find(x=>(+x.rally_sequence||0)<seq&&actionSide(x)==='own'&&['Block','Abwehr'].includes(actionName(x))&&[...(r?.actions||[])].some(y=>(+y.rally_sequence||0)<(+x.rally_sequence||0)&&actionSide(y)==='opponent'&&actionName(y)==='Angriff'));
     const ph=transitionTrigger?'K3':phaseOf(r);
     phases[ph].n++;if(wonOwn(r))phases[ph].w++;
     const rot=r?.result?.rotation||e.rotation||'–';if(!rots.has(rot))rots.set(rot,{n:0,w:0});rots.get(rot).n++;if(wonOwn(r))rots.get(rot).w++;
     const a=actionName(e);tech.set(a,(tech.get(a)||0)+1)
   }
   return {player,actions:ev.length,phases:Object.fromEntries(Object.entries(phases).map(([k,v])=>[k,{...v,winRate:percent(v.w,v.n)}])),rotations:[...rots].map(([rotation,v])=>({rotation,...v,winRate:percent(v.w,v.n)})),techniques:[...tech].sort((a,b)=>b[1]-a[1])};
 }).filter(Boolean).sort((a,b)=>b.actions-a.actions);
}

export function analyzeOpponentDeep(events,{actions=[]}={}){
 const rm=rallyMap(events,actions),groups=new Map();
 for(const e of events.filter(e=>isAction(e,actions)&&actionSide(e)==='opponent')){
   const tech=actionName(e),r=rallyForEventSafe(rm,e),rot=r?.result?.rotation||e.rotation||'',from=zoneLabel(e.action_zone),to=zoneLabel(e.target_zone),k=`${tech}|${rot}|${from}|${to}`;
   if(!groups.has(k))groups.set(k,{technique:tech,rotation:rot,from,to,n:0,oppWon:0});
   const g=groups.get(k);g.n++;if(r&&!wonOwn(r))g.oppWon++;
 }
 return [...groups.values()].sort((a,b)=>b.n-a.n).map(g=>({...g,oppWinRate:percent(g.oppWon,g.n)}));
}

export function compareMetricSet(a={},b={}){
 const keys=['rallyRate','k1Sideout','firstBall','k2Break','k3WinRate','receptionPositive','attackEfficiency'];
 const num=v=>{const n=Number.parseFloat(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null};
 return keys.map(key=>{const av=num(a[key]),bv=num(b[key]);return {key,a:av,b:bv,delta:av==null||bv==null?null:bv-av,direction:av==null||bv==null?'na':bv>av?'up':bv<av?'down':'same'}})
}


export function analyzeRotationsDeep(events,{actions=[],rotations=[]}={}){
 const rm=rallyMap(events,actions), k3=analyzeK3(events,{actions,rotations});
 return rotations.map(rotation=>{
   const rr=[...rm.values()].filter(r=>r.result&&(r.result.rotation||r.actions[0]?.rotation)===rotation);
   const won=rr.filter(wonOwn).length,lost=rr.length-won,k1=rr.filter(r=>r.result.serving_before==='them'),k2=rr.filter(r=>r.result.serving_before==='us');
   const recs=k1.flatMap(r=>r.actions).filter(e=>actionSide(e)==='own'&&actionName(e)==='Annahme');
   const firstAtt=k1.map(r=>r.actions.find(e=>actionSide(e)==='own'&&actionName(e)==='Angriff')).filter(Boolean);
   const sets=k1.flatMap(r=>r.actions).filter(e=>actionSide(e)==='own'&&actionName(e)==='Zuspiel');
   const k3r=k3.byRotation.find(x=>x.rotation===rotation)||{n:0,winRate:'–',killRate:'–'};
   return {
     rotation,rallies:rr.length,points:won-lost,won,lost,
     k1Count:k1.length,k1Sideout:percent(k1.filter(wonOwn).length,k1.length),firstBall:percent(k1.filter(firstBallSideout).length,k1.length),
     k2Count:k2.length,k2Break:percent(k2.filter(wonOwn).length,k2.length),
     k3Count:k3r.n,k3WinRate:k3r.winRate,k3KillRate:k3r.killRate,
     receptionPositive:percent(recs.filter(e=>['+','#'].includes(e.value)).length,recs.length),
     firstAttackKill:percent(firstAtt.filter(e=>e.value==='#').length,firstAtt.length),
     setCount:sets.length,
     attackKill:percent(rr.flatMap(r=>r.actions).filter(e=>actionSide(e)==='own'&&actionName(e)==='Angriff'&&e.value==='#').length,rr.flatMap(r=>r.actions).filter(e=>actionSide(e)==='own'&&actionName(e)==='Angriff').length)
   };
 });
}

export function summarizeCompareDeep(events,{actions=[],rotations=[]}={}){
 const rm=rallyMap(events,actions),rallies=[...rm.values()].filter(r=>r.result),k1=rallies.filter(r=>r.result.serving_before==='them'),k2=rallies.filter(r=>r.result.serving_before==='us');
 const k3=analyzeK3(events,{actions,rotations}).total;
 const rec=events.filter(e=>isAction(e,actions)&&actionSide(e)==='own'&&actionName(e)==='Annahme');
 const att=events.filter(e=>isAction(e,actions)&&actionSide(e)==='own'&&actionName(e)==='Angriff');
 const kill=att.filter(e=>e.value==='#').length,err=att.filter(e=>e.value==='=').length,blocked=att.filter(e=>e.value==='/').length;
 return {
   rallies:rallies.length,
   rallyRate:percent(rallies.filter(wonOwn).length,rallies.length),
   k1Sideout:percent(k1.filter(wonOwn).length,k1.length),
   firstBall:percent(k1.filter(firstBallSideout).length,k1.length),
   k2Break:percent(k2.filter(wonOwn).length,k2.length),
   k3WinRate:k3.winRate,
   receptionPositive:percent(rec.filter(e=>['+','#'].includes(e.value)).length,rec.length),
   attackEfficiency:attackEfficiency(kill,err,blocked,att.length)
 };
}


export function analyzeChainPatterns(events,{actions=[]}={}){
 const rm=rallyMap(events,actions),groups=new Map();
 for(const r of rm.values()){
   if(!r.result)continue;
   const own=r.actions.filter(e=>actionSide(e)==='own');
   const rec=own.find(e=>actionName(e)==='Annahme')||null;
   const set=rec?own.find(e=>(+e.rally_sequence||0)>(+rec.rally_sequence||0)&&actionName(e)==='Zuspiel'):own.find(e=>actionName(e)==='Zuspiel')||null;
   const attack=set?own.find(e=>(+e.rally_sequence||0)>(+set.rally_sequence||0)&&actionName(e)==='Angriff')||null:null;
   const def=own.find(e=>['Block','Abwehr'].includes(actionName(e)))||null;
   const phase=phaseOf(r);
   let label='';
   if(phase==='K1')label=`Annahme ${rec?.value||'–'} → Zuspiel ${set?zoneLabel(set.target_zone):'–'} → Angriff ${attack?.value||'–'}`;
   else if(def)label=`${actionName(def)} ${def.value||'–'} → Zuspiel ${set?zoneLabel(set.target_zone):'–'} → Angriff ${attack?.value||'–'}`;
   else label=`${phase} → ${own.map(actionName).filter(Boolean).slice(0,4).join(' → ')||'keine Kette'}`;
   const k=`${phase}|${r.result.rotation||''}|${label}`;
   if(!groups.has(k))groups.set(k,{phase,rotation:r.result.rotation||'',label,n:0,won:0,lost:0});
   const g=groups.get(k);g.n++;if(wonOwn(r))g.won++;else g.lost++;
 }
 return [...groups.values()].sort((a,b)=>b.n-a.n).map(g=>({...g,winRate:percent(g.won,g.n)})).slice(0,60);
}
