export function parseTimestampInput(value){
  const raw=String(value??'').trim();
  if(!raw)return {ok:false,error:'empty'};
  if(/^\d+(?:[.,]\d+)?$/.test(raw)){
    const seconds=Number(raw.replace(',','.'));
    return Number.isFinite(seconds)&&seconds>=0?{ok:true,seconds}:{ok:false,error:'invalid'};
  }
  const parts=raw.split(':');
  if(parts.length!==2&&parts.length!==3)return {ok:false,error:'format'};
  if(parts.some((x,i)=>!/^\d+(?:[.,]\d+)?$/.test(x)||(i<parts.length-1&&/[.,]/.test(x))))return {ok:false,error:'format'};
  const nums=parts.map(x=>Number(x.replace(',','.')));
  if(nums.some(x=>!Number.isFinite(x)||x<0))return {ok:false,error:'invalid'};
  let seconds=0;
  if(nums.length===2){if(nums[1]>=60)return {ok:false,error:'range'};seconds=nums[0]*60+nums[1];}
  else {if(nums[1]>=60||nums[2]>=60)return {ok:false,error:'range'};seconds=nums[0]*3600+nums[1]*60+nums[2];}
  return {ok:true,seconds};
}
export function formatTimestampCanonical(seconds,{tenths=true}={}){
  const sec=Math.max(0,Number(seconds)||0),whole=Math.floor(sec),fraction=sec-whole;
  const h=Math.floor(whole/3600),m=Math.floor((whole%3600)/60),s=whole%60;
  const frac=tenths?`.${Math.floor(fraction*10+1e-9)}`:'';
  return h>0?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}${frac}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}${frac}`;
}
export function applyTimestampToEvent(event,startSeconds,formatSeconds){
  const next={...event};
  const oldStart=Number(event?.action_start_seconds??event?.seconds??0)||0;
  const oldEnd=Number(event?.action_end_seconds??oldStart)||oldStart;
  const duration=Math.max(0,oldEnd-oldStart),start=Math.max(0,Number(startSeconds)||0),end=start+duration;
  const fmt=typeof formatSeconds==='function'?formatSeconds:(sec=>formatTimestampCanonical(sec));
  next.seconds=start.toFixed(3);next.timestamp=fmt(start);
  next.action_start_seconds=start.toFixed(3);next.action_start_timestamp=fmt(start);
  next.action_end_seconds=end.toFixed(3);next.action_end_timestamp=fmt(end);
  next.timestamp_edited=true;next.timestamp_edited_at=new Date().toISOString();
  return next;
}
export function timestampInputValue(event){
  const rawStart=event?.action_start_seconds??event?.seconds;
  const n=Number(rawStart);
  const parsedDisplay=parseTimestampInput(event?.timestamp||'');
  // Older/live-edited records may carry the corrected display timestamp while
  // legacy numeric fields still contain 0. Prefer the explicit visible
  // timestamp in that case so post-processing never falls back to stale zeroes.
  if(parsedDisplay.ok && parsedDisplay.seconds>0 && (!Number.isFinite(n) || n<=0)){
    return String(Math.round(parsedDisplay.seconds*10)/10);
  }
  return Number.isFinite(n)?String(Math.round(n*10)/10):String(event?.timestamp||'');
}

export function insertActionAfterEvent(events,anchorId,newEvent){
  const rows=[...(events||[])];
  const index=rows.findIndex(e=>String(e?.id||'')===String(anchorId||''));
  if(index<0)throw new Error('anchor_not_found');
  const anchor=rows[index]||{},rallyId=anchor.rally_id||newEvent?.rally_id||'';
  const anchorSeq=Number(anchor.rally_sequence)||0;
  if(rallyId&&anchorSeq){
    for(const event of rows){
      if(event?.rally_id===rallyId&&(Number(event?.rally_sequence)||0)>anchorSeq){
        event.rally_sequence=String((Number(event.rally_sequence)||0)+1);
      }
    }
  }
  const inserted={...newEvent};
  if(rallyId)inserted.rally_id=rallyId;
  if(anchor.rally_no&&!inserted.rally_no)inserted.rally_no=anchor.rally_no;
  inserted.rally_sequence=String(anchorSeq?anchorSeq+1:1);
  inserted.rally_event=inserted.rally_event||'action';
  inserted.event_type=inserted.event_type||'action';
  rows.splice(index+1,0,inserted);
  return rows;
}

export function insertActionBeforeEvent(events,anchorId,newEvent){
  const rows=[...(events||[])];
  const index=rows.findIndex(e=>String(e?.id||'')===String(anchorId||''));
  if(index<0)throw new Error('anchor_not_found');
  const anchor=rows[index]||{},rallyId=anchor.rally_id||newEvent?.rally_id||'';
  const anchorSeq=Number(anchor.rally_sequence)||0;
  if(rallyId&&anchorSeq){
    for(const event of rows){
      if(event?.rally_id===rallyId&&(Number(event?.rally_sequence)||0)>=anchorSeq){
        event.rally_sequence=String((Number(event.rally_sequence)||0)+1);
      }
    }
  }
  const inserted={...newEvent};
  if(rallyId)inserted.rally_id=rallyId;
  if(anchor.rally_no&&!inserted.rally_no)inserted.rally_no=anchor.rally_no;
  inserted.rally_sequence=String(anchorSeq||1);
  inserted.rally_event=inserted.rally_event||'action';
  inserted.event_type=inserted.event_type||'action';
  rows.splice(index,0,inserted);
  return rows;
}
