export function analysisDate(match){
  return String(match?.matchDate||match?.events?.find(e=>e.createdAt)?.createdAt||'').slice(0,10);
}
export function actionName(event){return String(event?.action||'').replace(/^Gegner\s+/,'');}
export function actionSide(event){return String(event?.action||'').startsWith('Gegner ')?'opponent':'own';}
export function isAction(event,actions=[]){return event?.event_type==='action'||event?.rally_event==='action'||actions.includes(actionName(event));}
export function percent(n,d){return d?`${(100*n/d).toFixed(1)} %`:'–';}
export function zoneLabel(zone){const s=String(zone??'').trim().replace(/^P/i,'');if(!/^\d+$/.test(s))return '–';const n=Number(s);return Number.isInteger(n)&&n>=1&&n<=9?`P${n}`:'–';}
export function playerLabel(event){const value=event?.player_abbreviation||event?.player||'–';return String(value??'–').normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g,' ').replace(/\s+/g,' ').trim().slice(0,240)||'–';}
export function qualityCounts(events=[]){const counts={};for(const event of events){const key=event?.value||'–';counts[key]=(counts[key]||0)+1;}return counts;}
export function attackEfficiency(kill,err,blocked,total){return total?`${(100*(kill-err-blocked)/total).toFixed(1)} %`:'–';}
