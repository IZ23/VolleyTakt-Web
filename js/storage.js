export const CSV_HEADER=['video','video_clip_id','seconds','timestamp','action_start_seconds','action_start_timestamp','action_end_seconds','action_end_timestamp','action_started_at','action_completed_at','set','rotation','position','player_rotation_position','action_zone','target_zone','serve_technique','set_tempo','set_distance','rally_phase','transition_no','player_id','player_abbreviation','player_name','player','action','value','event_type','rally_id','rally_no','rally_sequence','rally_event','rally_winner','quality_level','quality_profile','serving_before','serving_after','sideout','rotation_side','rotation_index_before','rotation_index_after','lineup_before','lineup_after','own_lineup','opp_lineup','player_out_id','player_in_id','player_out_jersey','player_in_jersey','set_winner','set_wins_us','set_wins_them','score_us','score_them','note'];
const MASTER_KEY='volleytakt-masterdata-v2';
const STATE_KEY='volleytakt-live-state-v2';
const EVENTS_KEY='volleytakt-live-events-v2';
const SETTINGS_KEY='volleytakt-live-settings-v2';
const MATCH_ARCHIVE_KEY='volleytakt-match-archive-v1';
export function loadMatchArchive(){try{return JSON.parse(localStorage.getItem(MATCH_ARCHIVE_KEY)||'[]')}catch{return []}}
export function saveMatchArchive(v){localStorage.setItem(MATCH_ARCHIVE_KEY,JSON.stringify(v||[]))}
export function upsertMatchArchive(snapshot){
  if(!snapshot?.matchId)return;
  const all=loadMatchArchive(),i=all.findIndex(x=>x.matchId===snapshot.matchId);
  if(i>=0)all[i]=snapshot;else all.push(snapshot);
  all.sort((a,b)=>String(b.matchDate||b.updatedAt||'').localeCompare(String(a.matchDate||a.updatedAt||'')));
  saveMatchArchive(all);
}
const now=()=>new Date().toISOString();
const id=(p)=>`${p}_${crypto.randomUUID()}`;

export function seedMaster(){
  const t=now();
  return {
    schema:3,
    players:[],teams:[],seasons:[],seasonRosters:[],matchTypes:[],matchRosters:[],
    sharedSettings:{schema:1,updatedAt:t,revision:1},
  };
}
export function loadMaster(){try{const m={...seedMaster(),...JSON.parse(localStorage.getItem(MASTER_KEY)||'{}')};m.schema=3;m.teams=(m.teams||[]).map(t=>({...t,qualityProfile:(t.qualityProfile==='datavolley'||t.qualityProfile==='datavolley_6')?'datavolley_6':'basic_5'}));return m}catch{return seedMaster()}}
export function saveMaster(m){localStorage.setItem(MASTER_KEY,JSON.stringify(m))}
export function loadState(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{}')}catch{return {}}}
export function saveState(v){localStorage.setItem(STATE_KEY,JSON.stringify(v))}
export function loadEvents(){try{return JSON.parse(localStorage.getItem(EVENTS_KEY)||'[]')}catch{return []}}
export function saveEvents(v){localStorage.setItem(EVENTS_KEY,JSON.stringify(v))}
export function loadSettings(){try{return JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}catch{return {}}}
export function saveSettings(v){localStorage.setItem(SETTINGS_KEY,JSON.stringify(v))}
export const newId=id;
export const touched=(old={})=>({...old,updatedAt:now(),revision:(old.revision||0)+1});

export function active(rows){return rows.filter(r=>r.active!==false)}
export function orderedMatchTypes(rows){
  const a=active(rows);
  if(!a.some(r=>(r.usageCount||0)>0))return {top:[],rest:a.map(r=>r.name).sort((a,b)=>a.localeCompare(b,'de'))};
  const ranked=[...a].sort((x,y)=>(y.usageCount||0)-(x.usageCount||0)||x.name.localeCompare(y.name,'de'));
  const topRows=ranked.slice(0,3),topIds=new Set(topRows.map(r=>r.id));
  return {top:topRows.map(r=>r.name).sort((a,b)=>a.localeCompare(b,'de')),rest:a.filter(r=>!topIds.has(r.id)).map(r=>r.name).sort((a,b)=>a.localeCompare(b,'de'))};
}

const csvCell=v=>{const s=String(v??'');return /[;"\r\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s};
export function toCsv(events){return [CSV_HEADER.join(';'),...events.map(e=>CSV_HEADER.map(k=>csvCell(e[k])).join(';'))].join('\r\n')+'\r\n'}
export function parseCsv(text){
  const rows=[];let row=[],cell='',q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(q){if(c==='"'&&text[i+1]==='"'){cell+='"';i++}else if(c==='"')q=false;else cell+=c;continue}
    if(c==='"'){q=true;continue}
    if(c===';'){row.push(cell);cell='';continue}
    if(c==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';continue}
    cell+=c;
  }
  if(cell||row.length){row.push(cell);rows.push(row)}
  const head=rows.shift()||[];
  return rows.filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]??''])));
}

export class CsvStore{
  constructor(){this.filename='VolleyTaktLive_current.csv';this.opfs=false;this.lastError=''}
  async init(filename){this.filename=filename||this.filename;try{if(!navigator.storage?.getDirectory)throw new Error('OPFS nicht verfügbar');const root=await navigator.storage.getDirectory();const dir=await root.getDirectoryHandle('VolleyTaktLive',{create:true});this.handle=await dir.getFileHandle(this.filename,{create:true});this.opfs=true;return true}catch(e){this.lastError=e.message;this.opfs=false;return false}}
  async write(events){saveEvents(events);if(!this.opfs||!this.handle)return false;try{const w=await this.handle.createWritable();await w.write(toCsv(events));await w.close();return true}catch(e){this.lastError=e.message;return false}}
  download(events,filename=this.filename){const blob=new Blob([toCsv(events)],{type:'text/csv;charset=utf-8'});downloadBlob(blob,filename)}
}
export function downloadJson(value,filename){downloadBlob(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}),filename)}
function downloadBlob(blob,filename){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
