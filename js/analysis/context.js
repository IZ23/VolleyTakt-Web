// VolleyTakt Live · ANALYSIS-CONTEXT1
// Relative comparison layer for rotation/phase/player/opponent contexts.
import {buildContextChains,chainSummary} from './chains2.js';

const groupBy=(rows,keyFn)=>{const m=new Map();for(const row of rows){const k=keyFn(row);if(!k)continue;if(!m.has(k))m.set(k,[]);m.get(k).push(row)}return m};
const rowsFrom=(m)=>[...m.entries()].map(([key,rows])=>({key,rows,summary:chainSummary(rows)}));
export function buildContextReport(events,{actions=[]}={}){
  const chains=buildContextChains(events,{actions});
  return {
    chains,
    overall:chainSummary(chains),
    byRotation:rowsFrom(groupBy(chains,x=>x.rotation)),
    byPhase:[...rowsFrom(groupBy(chains,x=>x.phase)),...rowsFrom(groupBy(chains.filter(x=>x.hasK3),()=> 'K3'))],
    byReceptionQuality:rowsFrom(groupBy(chains.filter(x=>x.reception),x=>x.reception.quality||'–')),
    byReceptionPlayer:rowsFrom(groupBy(chains.filter(x=>x.reception?.playerId),x=>x.reception.playerId)),
    bySetter:rowsFrom(groupBy(chains.filter(x=>x.set?.playerId),x=>x.set.playerId)),
    byAttacker:rowsFrom(groupBy(chains.filter(x=>x.attack?.playerId),x=>x.attack.playerId)),
    byOpponent:rowsFrom(groupBy(chains,x=>x.opponentId||'unknown'))
  };
}
export function contextRow(report={},bucket='byRotation',key=''){return (report?.[bucket]||[]).find(x=>x.key===key)||null}
