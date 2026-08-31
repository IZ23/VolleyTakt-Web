export const CSV_HEADER=['video','video_clip_id','seconds','timestamp','action_start_seconds','action_start_timestamp','action_end_seconds','action_end_timestamp','action_started_at','action_completed_at','set','rotation','position','player_rotation_position','action_zone','target_zone','serve_technique','set_tempo','set_distance','rally_phase','transition_no','player_id','player_abbreviation','player_name','player','action','value','event_type','rally_id','rally_no','rally_sequence','rally_event','rally_winner','quality_level','quality_profile','serving_before','serving_after','sideout','rotation_side','rotation_index_before','rotation_index_after','lineup_before','lineup_after','own_lineup','opp_lineup','player_out_id','player_in_id','player_out_jersey','player_in_jersey','set_winner','set_wins_us','set_wins_them','score_us','score_them','note'];
const MASTER_KEY='volleytakt-masterdata-v2';
const STATE_KEY='volleytakt-live-state-v2';
const EVENTS_KEY='volleytakt-live-events-v2';
const SETTINGS_KEY='volleytakt-live-settings-v2';
const MATCH_ARCHIVE_KEY='volleytakt-match-archive-v1';
const DATA_SCHEMA_KEY='volleytakt-data-schema';
const DATA_BACKUP_KEY='volleytakt-update-backup';
export const CURRENT_DATA_SCHEMA=5;

function safeJson(raw,fallback){try{return JSON.parse(raw)}catch{return fallback}}
export function createUpdateBackup(reason='update'){
  const payload={
    schema:Number(localStorage.getItem(DATA_SCHEMA_KEY)||0),
    reason,
    createdAt:new Date().toISOString(),
    data:{
      master:localStorage.getItem(MASTER_KEY),
      state:localStorage.getItem(STATE_KEY),
      events:localStorage.getItem(EVENTS_KEY),
      settings:localStorage.getItem(SETTINGS_KEY),
      matchArchive:localStorage.getItem(MATCH_ARCHIVE_KEY)
    }
  };
  localStorage.setItem(DATA_BACKUP_KEY,JSON.stringify(payload));
  return payload;
}
export function latestUpdateBackup(){return safeJson(localStorage.getItem(DATA_BACKUP_KEY)||'null',null)}
export function runDataMigrations(target=CURRENT_DATA_SCHEMA){
  let current=Math.max(0,Number(localStorage.getItem(DATA_SCHEMA_KEY)||0));
  if(current>=target)return{from:current,to:current,migrated:false};
  createUpdateBackup(`schema-${current}-to-${target}`);
  const from=current;
  try{
    while(current<target){
      const next=current+1;
      if(next===1){
        // Legacy installations without an explicit data-schema marker.
      }else if(next===2){
        const m=safeJson(localStorage.getItem(MASTER_KEY)||'{}',{});
        if(m&&typeof m==='object'){m.schema=Math.max(3,Number(m.schema||3));localStorage.setItem(MASTER_KEY,JSON.stringify(m))}
      }else if(next===3){
        const archive=safeJson(localStorage.getItem(MATCH_ARCHIVE_KEY)||'[]',[]);
        if(Array.isArray(archive))localStorage.setItem(MATCH_ARCHIVE_KEY,JSON.stringify(archive.map(x=>{
          const st=x?.fullState||x?.state||{};
          return {...x,status:x?.status||(st.matchComplete?'ended':'interrupted'),videos:[...(x?.videos||st.videoAssignments||[])],fullState:x?.fullState||null};
        })));
      }else if(next===4){
        // 0.3.2: ensure video assignments and reusable match snapshots survive upgrades.
        const st=safeJson(localStorage.getItem(STATE_KEY)||'{}',{});
        if(st&&typeof st==='object'){st.videoAssignments=[...(st.videoAssignments||[])];localStorage.setItem(STATE_KEY,JSON.stringify(st))}
        const archive=safeJson(localStorage.getItem(MATCH_ARCHIVE_KEY)||'[]',[]);
        if(Array.isArray(archive))localStorage.setItem(MATCH_ARCHIVE_KEY,JSON.stringify(archive.map(x=>{
          const full={...(x?.fullState||x?.state||{})};
          full.videoAssignments=[...(full.videoAssignments||x?.videos||[])];
          return {...x,status:x?.status||(full.matchComplete?'ended':'interrupted'),videos:[...(x?.videos||full.videoAssignments||[])],fullState:full};
        })));
      }else if(next===5){
        // Preview2-r5: remove the former ++ quality tier. Legacy ++ means the same maximum success and becomes #.
        const normalizeQuality=v=>String(v??'')==='++'?'#':v;
        const st=safeJson(localStorage.getItem(STATE_KEY)||'{}',{});
        if(st&&typeof st==='object'){if(st.pendingQuality==='++')st.pendingQuality='#';localStorage.setItem(STATE_KEY,JSON.stringify(st))}
        const ev=safeJson(localStorage.getItem(EVENTS_KEY)||'[]',[]);
        if(Array.isArray(ev))localStorage.setItem(EVENTS_KEY,JSON.stringify(ev.map(x=>({...x,value:normalizeQuality(x?.value)}))));
        const archive=safeJson(localStorage.getItem(MATCH_ARCHIVE_KEY)||'[]',[]);
        if(Array.isArray(archive))localStorage.setItem(MATCH_ARCHIVE_KEY,JSON.stringify(archive.map(x=>{
          const full={...(x?.fullState||x?.state||{})};if(full.pendingQuality==='++')full.pendingQuality='#';
          const events=Array.isArray(x?.events)?x.events.map(e=>({...e,value:normalizeQuality(e?.value)})):x?.events;
          return {...x,events,fullState:full};
        })));
      }
      current=next;localStorage.setItem(DATA_SCHEMA_KEY,String(current));
    }
    return{from,to:current,migrated:true};
  }catch(error){
    const backup=latestUpdateBackup();
    if(backup?.data){
      for(const [key,value] of Object.entries({[MASTER_KEY]:backup.data.master,[STATE_KEY]:backup.data.state,[EVENTS_KEY]:backup.data.events,[SETTINGS_KEY]:backup.data.settings,[MATCH_ARCHIVE_KEY]:backup.data.matchArchive})){
        if(value===null||value===undefined)localStorage.removeItem(key);else localStorage.setItem(key,value);
      }
      localStorage.setItem(DATA_SCHEMA_KEY,String(backup.schema||0));
    }
    throw error;
  }
}

function normalizeMatchSnapshot(x={}){
  const state=x.fullState||x.state||{};
  return {...x,status:x.status||(state.matchComplete?'ended':'interrupted'),videos:[...(x.videos||state.videoAssignments||[])],fullState:x.fullState||null};
}
export function loadMatchArchive(){try{return (JSON.parse(localStorage.getItem(MATCH_ARCHIVE_KEY)||'[]')||[]).map(normalizeMatchSnapshot)}catch{return []}}
export function saveMatchArchive(v){localStorage.setItem(MATCH_ARCHIVE_KEY,JSON.stringify((v||[]).map(normalizeMatchSnapshot)))}
export function upsertMatchArchive(snapshot){
  if(!snapshot?.matchId)return;
  const next=normalizeMatchSnapshot(snapshot),all=loadMatchArchive(),i=all.findIndex(x=>x.matchId===next.matchId);
  if(i>=0)all[i]={...all[i],...next};else all.push(next);
  all.sort((a,b)=>String(b.updatedAt||b.matchDate||'').localeCompare(String(a.updatedAt||a.matchDate||'')));
  saveMatchArchive(all);
}
export function getMatchSnapshot(matchId){return loadMatchArchive().find(x=>x.matchId===matchId)||null}
export function removeMatchArchive(matchId){const id=String(matchId||'');if(!id)return false;const all=loadMatchArchive(),next=all.filter(x=>x.matchId!==id);if(next.length===all.length)return false;saveMatchArchive(next);return true}
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
  // Eine einzige Stammdatenquelle: Auswahlfelder erhalten immer die echten Datensaetze
  // (inkl. stabiler ID), nie abgeleitete Namenslisten, aus denen neue Typen entstehen koennten.
  const a=active(rows);
  if(!a.some(r=>(r.usageCount||0)>0))return {top:[],rest:[...a].sort((x,y)=>String(x.name||'').localeCompare(String(y.name||''),'de'))};
  const ranked=[...a].sort((x,y)=>(y.usageCount||0)-(x.usageCount||0)||String(x.name||'').localeCompare(String(y.name||''),'de'));
  const topRows=ranked.slice(0,3),topIds=new Set(topRows.map(r=>r.id));
  return {top:[...topRows].sort((x,y)=>String(x.name||'').localeCompare(String(y.name||''),'de')),rest:a.filter(r=>!topIds.has(r.id)).sort((x,y)=>String(x.name||'').localeCompare(String(y.name||''),'de'))};
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
