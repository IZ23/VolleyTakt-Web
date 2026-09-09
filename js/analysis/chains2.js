// VolleyTakt Live · ANALYSIS-CHAIN2
// Builds normalized action chains per rally/context for deeper, explainable analysis.
import {actionName,actionSide} from './domain.js';
import {rallyMap,wonOwn,firstBallSideout} from './rallies.js';
import {contextIdForEvent} from '../data/context.js';

const qPositive=q=>['+','#'].includes(String(q||''));
const qNegative=q=>['=','-','/'].includes(String(q||''));
const pct=(n,d)=>d?100*n/d:null;

export function buildContextChains(events,{actions=[]}={}){
  const rm=rallyMap(events,actions), rows=[];
  for(const rally of rm.values()){
    if(!rally.result)continue;
    const all=[...rally.actions].sort((a,b)=>(+a.rally_sequence||0)-(+b.rally_sequence||0));
    const own=all.filter(e=>actionSide(e)==='own');
    const rec=own.find(e=>actionName(e)==='Annahme')||null;
    const set=rec?own.find(e=>(+e.rally_sequence||0)>(+rec.rally_sequence||0)&&actionName(e)==='Zuspiel'):own.find(e=>actionName(e)==='Zuspiel')||null;
    const attack=set?own.find(e=>(+e.rally_sequence||0)>(+set.rally_sequence||0)&&actionName(e)==='Angriff'):own.find(e=>actionName(e)==='Angriff')||null;

    let transition=null;
    for(const trigger of own){
      if(!['Block','Abwehr'].includes(actionName(trigger)))continue;
      const seq=+trigger.rally_sequence||0;
      const previousOpponentAttack=[...all].reverse().find(e=>(+e.rally_sequence||0)<seq&&actionSide(e)==='opponent'&&actionName(e)==='Angriff');
      if(!previousOpponentAttack)continue;
      const k3Set=own.find(e=>(+e.rally_sequence||0)>seq&&actionName(e)==='Zuspiel')||null;
      const k3Attack=k3Set?own.find(e=>(+e.rally_sequence||0)>(+k3Set.rally_sequence||0)&&actionName(e)==='Angriff'):own.find(e=>(+e.rally_sequence||0)>seq&&actionName(e)==='Angriff')||null;
      if(k3Attack){
        transition={
          trigger:actionName(trigger),triggerQuality:trigger.value||'',
          set:k3Set?{playerId:k3Set.player_id||'',from:k3Set.action_zone||0,to:k3Set.target_zone||0,tempo:k3Set.set_tempo||'',distance:k3Set.set_distance||''}:null,
          attack:{playerId:k3Attack.player_id||'',quality:k3Attack.value||'',from:k3Attack.action_zone||0,to:k3Attack.target_zone||0,kill:k3Attack.value==='#',error:k3Attack.value==='=',blocked:k3Attack.value==='/'}
        };
        break;
      }
    }

    const first=all[0]||rally.result;
    const match=first?._match||rally.result?._match||{};
    const phase=rally.result.serving_before==='them'?'K1':rally.result.serving_before==='us'?'K2':'';
    rows.push({
      contextId:contextIdForEvent(first,match?.matchId||'')||contextIdForEvent(rally.result,match?.matchId||'')||`ctx:${rally.id}`,
      matchId:match?.matchId||'',matchDate:match?.matchDate||'',opponentId:match?.oppTeamId||'',seasonId:match?.seasonId||'',
      rallyId:rally.id,set:String(rally.result.set||''),rotation:rally.result.rotation||first?.rotation||'',phase,
      won:wonOwn(rally),firstBall:firstBallSideout(rally),
      reception:rec?{playerId:rec.player_id||'',quality:rec.value||'',positive:qPositive(rec.value),negative:qNegative(rec.value),zone:rec.action_zone||0}:null,
      set:set?{playerId:set.player_id||'',quality:set.value||'',from:set.action_zone||0,to:set.target_zone||0,tempo:set.set_tempo||'',distance:set.set_distance||''}:null,
      attack:attack?{playerId:attack.player_id||'',quality:attack.value||'',from:attack.action_zone||0,to:attack.target_zone||0,kill:attack.value==='#',error:attack.value==='=',blocked:attack.value==='/'}:null,
      transition,
      hasK3:!!transition,
      completeK1:phase==='K1'&&!!(rec&&set&&attack),
      actionCount:all.length
    });
  }
  return rows;
}

export function chainSummary(chains=[]){
  const n=chains.length, won=chains.filter(x=>x.won).length, k1=chains.filter(x=>x.phase==='K1'),k2=chains.filter(x=>x.phase==='K2'),k3=chains.filter(x=>x.hasK3);
  const rec=k1.filter(x=>x.reception), recPos=rec.filter(x=>x.reception.positive);
  const complete=k1.filter(x=>x.completeK1), attacks=k1.filter(x=>x.attack);
  const attackGood=attacks.filter(x=>x.attack.kill).length;
  const k3Attack=k3.filter(x=>x.transition?.attack),k3Kills=k3Attack.filter(x=>x.transition.attack.kill).length;
  return {
    rallies:n,winRate:pct(won,n),k1:k1.length,k2:k2.length,k3:k3.length,completeK1:complete.length,
    receptionCount:rec.length,receptionPositiveRate:pct(recPos.length,rec.length),
    firstBallRate:pct(k1.filter(x=>x.firstBall).length,k1.length),
    attackCount:attacks.length,attackKillRate:pct(attackGood,attacks.length),
    k3WinRate:pct(k3.filter(x=>x.won).length,k3.length),k3AttackKillRate:pct(k3Kills,k3Attack.length)
  };
}
