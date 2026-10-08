// VolleyTakt Live 0.4.3.2 · trust-boundary normalization for imported/stored events.
const ZONE_FIELDS=['action_zone','target_zone','zone','source_zone'];
const ROTATION_FIELDS=['rotation','rotation_us','rotation_them'];
const POSITION_FIELDS=['player_rotation_position','position'];
const TEXT_FIELDS=['player','player_name','player_abbreviation','note','video','serve_technique','technique','action','value'];

export function safeText(value,max=240){
  return String(value??'').normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
}
export function normalizeZone(value){
  const s=String(value??'').trim().replace(/^P/i,'');
  if(!/^\d+$/.test(s))return '';
  const n=Number(s);return Number.isInteger(n)&&n>=1&&n<=9?String(n):'';
}
export function normalizeRotation(value){
  const s=String(value??'').trim().toUpperCase();
  const m=s.match(/^R?([1-6])$/);return m?`R${m[1]}`:'';
}
export function normalizePosition(value){
  const s=String(value??'').trim().toUpperCase();
  const m=s.match(/^P?([1-6])$/);return m?`P${m[1]}`:'';
}
export function normalizeImportedEvent(row={}){
  const out={...row};
  for(const key of ZONE_FIELDS)if(key in out)out[key]=normalizeZone(out[key]);
  for(const key of ROTATION_FIELDS)if(key in out)out[key]=normalizeRotation(out[key]);
  for(const key of POSITION_FIELDS)if(key in out)out[key]=normalizePosition(out[key]);
  for(const key of TEXT_FIELDS)if(key in out)out[key]=safeText(out[key],key==='note'?1000:240);
  return out;
}
export function normalizeImportedEvents(rows=[]){return Array.isArray(rows)?rows.map(normalizeImportedEvent):[]}
