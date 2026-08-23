const FILES={players:'players.json',teams:'teams.json',seasons:'seasons.json',seasonRosters:'season_rosters.json',matchTypes:'match_types.json',matchRosters:'match_rosters.json',sharedSettings:'shared_settings.json'};
function mergeRows(local=[],remote=[]){const map=new Map();for(const x of [...local,...remote]){const prev=map.get(x.id);if(!prev||String(x.updatedAt||'')>String(prev.updatedAt||'')||(x.updatedAt===prev.updatedAt&&(x.revision||0)>(prev.revision||0)))map.set(x.id,x)}return [...map.values()]}
function matchTypeKey(name){return String(name||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('de')}
function normalizeMatchTypes(master){
 const groups=new Map();for(const mt of master.matchTypes||[]){const key=matchTypeKey(mt.name);if(!key)continue;(groups.get(key)||groups.set(key,[]).get(key)).push(mt)}
 const idMap=new Map(),kept=[];
 for(const rows of groups.values()){rows.sort((a,b)=>(b.usageCount||0)-(a.usageCount||0)||String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));const keep=rows[0];keep.name=String(keep.name||'').normalize('NFKC').trim().replace(/\s+/g,' ');keep.usageCount=rows.reduce((n,x)=>n+(x.usageCount||0),0);for(const x of rows.slice(1))idMap.set(x.id,keep.id);kept.push(keep)}
 master.matchTypes=kept;for(const r of master.matchRosters||[]){const next=idMap.get(r.matchTypeId);if(next)r.matchTypeId=next}return master
}
export function mergeMaster(local,remote){const out={...local};for(const k of ['players','teams','seasons','seasonRosters','matchTypes','matchRosters'])out[k]=mergeRows(local[k]||[],remote[k]||[]);if(remote.sharedSettings&&String(remote.sharedSettings.updatedAt||'')>String(local.sharedSettings?.updatedAt||''))out.sharedSettings=remote.sharedSettings;return out}
export function normalizeServerUrl(value){let v=String(value||'').trim();if(!v)return '';if(!/^https?:\/\//i.test(v))v='https://'+v;try{const u=new URL(v);u.hash='';u.search='';u.pathname=u.pathname.replace(/\/+$/,'');return u.toString().replace(/\/$/,'')}catch{return v}}

async function relayRequest(payload){const r=await fetch('./sync/nextcloud.php',{method:'POST',headers:{'Content-Type':'application/json;charset=utf-8'},body:JSON.stringify(payload)});let data=null;try{data=await r.json()}catch{}if(!r.ok||!data?.ok){const msg=data?.error||`Relay HTTP ${r.status}`;throw new Error(msg)}return data}

class WebDavProvider{
 constructor(cfg){this.cfg={...cfg,url:normalizeServerUrl(cfg.url)};const root=this.cfg.url.replace(/\/$/,'');const folder=String(cfg.path||'VolleyTakt').replace(/^\/+|\/+$/g,'');if(cfg.provider==='nextcloud'&&!root.includes('/remote.php/dav/')){this.userRoot=`${root}/remote.php/dav/files/${encodeURIComponent(cfg.username||'')}`;this.projectRoot=`${this.userRoot}/${folder}`;this.base=`${this.projectRoot}/masterdata`}else{this.userRoot=root;this.projectRoot=`${root}/${folder}`;this.base=`${this.projectRoot}/masterdata`}}
 async call(method,url,{body=null,headers={}}={}){return relayRequest({method,url,username:this.cfg.username||'',password:this.cfg.password||'',headers,body})}
 async ensure(){for(const p of [this.projectRoot,this.base]){const d=await this.call('MKCOL',p);if(![200,201,204,301,302,405].includes(d.status))throw new Error(`WebDAV Ordner konnte nicht angelegt werden (${d.status}).`)}}
 async get(name){const d=await this.call('GET',`${this.base}/${name}`,{headers:{'Cache-Control':'no-cache'}});if(d.status===404)return null;if(d.status<200||d.status>=300)throw new Error(`WebDAV GET ${d.status}`);try{return JSON.parse(d.body||'null')}catch{throw new Error(`${name} enthält kein gültiges JSON.`)}}
 async put(name,data){const d=await this.call('PUT',`${this.base}/${name}`,{headers:{'Content-Type':'application/json;charset=utf-8'},body:JSON.stringify(data,null,2)});if(d.status<200||d.status>=300)throw new Error(`WebDAV PUT ${d.status}`)}
 sessionRoot(matchId){return `${this.projectRoot}/sessions/${encodeURIComponent(matchId)}`}
 async ensureSession(matchId){for(const p of [`${this.projectRoot}/sessions`,this.sessionRoot(matchId)]){const d=await this.call('MKCOL',p);if(![200,201,204,301,302,405].includes(d.status))throw new Error(`Session-Ordner konnte nicht angelegt werden (${d.status}).`)}}
 async getSessionMeta(matchId,name){const d=await this.call('GET',`${this.sessionRoot(matchId)}/${name}`,{headers:{'Cache-Control':'no-cache'}});if(d.status===404)return {data:null,etag:null,status:404};if(d.status<200||d.status>=300)throw new Error(`Session GET ${d.status}`);try{return {data:JSON.parse(d.body||'null'),etag:typeof d.etag==='string'&&d.etag.trim()?d.etag:null,status:d.status}}catch{throw new Error(`${name} enthält kein gültiges JSON.`)}}
 async getSession(matchId,name){return (await this.getSessionMeta(matchId,name)).data}
 async putSession(matchId,name,data,condition={}){const headers={'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-cache'};if(condition.ifMatch)headers['If-Match']=condition.ifMatch;if(condition.ifNoneMatch)headers['If-None-Match']=condition.ifNoneMatch;const d=await this.call('PUT',`${this.sessionRoot(matchId)}/${name}`,{headers,body:JSON.stringify(data,null,2)});if(d.status===412){const e=new Error('Live-Session-Lock wurde gleichzeitig von einem anderen Gerät geändert.');e.code='SESSION_LOCK_RACE';throw e}if(d.status<200||d.status>=300)throw new Error(`Session PUT ${d.status}`)}
 async test(){const d=await this.call('PROPFIND',this.userRoot,{headers:{Depth:'0'}});if(![200,207].includes(d.status))throw new Error(`WebDAV ${d.status}`);return true}
}

let googleScriptPromise;
function googleScript(){if(window.google?.accounts?.oauth2)return Promise.resolve();if(googleScriptPromise)return googleScriptPromise;googleScriptPromise=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;s.onload=res;s.onerror=()=>rej(new Error('Google Identity Services konnte nicht geladen werden'));document.head.appendChild(s)});return googleScriptPromise}
class GoogleDriveProvider{
 constructor(cfg){this.cfg=cfg;this.token=sessionStorage.getItem('volleytakt-gdrive-token')||'';this.folderIds={}}
 async auth(){if(this.token)return;await googleScript();if(!this.cfg.clientId)throw new Error('Google OAuth Client-ID fehlt.');this.token=await new Promise((resolve,reject)=>{const c=google.accounts.oauth2.initTokenClient({client_id:this.cfg.clientId,scope:'https://www.googleapis.com/auth/drive.file',callback:r=>r.error?reject(new Error(r.error)):resolve(r.access_token)});c.requestAccessToken({prompt:''})});sessionStorage.setItem('volleytakt-gdrive-token',this.token)}
 headers(){return {Authorization:`Bearer ${this.token}`}}
 async api(url,opt={}){await this.auth();let r=await fetch(url,{...opt,headers:{...this.headers(),...(opt.headers||{})}});if(r.status===401){this.token='';sessionStorage.removeItem('volleytakt-gdrive-token');await this.auth();r=await fetch(url,{...opt,headers:{...this.headers(),...(opt.headers||{})}})}if(!r.ok)throw new Error(`Google Drive ${r.status}`);return r}
 async findFolder(name,parent='root'){const q=`mimeType='application/vnd.google-apps.folder' and trashed=false and name='${name.replaceAll("'","\\'")}' and '${parent}' in parents`;const r=await this.api(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive`);return (await r.json()).files?.[0]?.id||null}
 async ensureFolder(name,parent='root'){let id=await this.findFolder(name,parent);if(id)return id;const r=await this.api('https://www.googleapis.com/drive/v3/files',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,mimeType:'application/vnd.google-apps.folder',parents:[parent]})});return (await r.json()).id}
 async folder(){if(this.folderIds.master)return this.folderIds.master;const root=await this.ensureFolder(this.cfg.path||'VolleyTakt');return this.folderIds.master=await this.ensureFolder('masterdata',root)}
 async findFile(name){const parent=await this.folder();const q=`trashed=false and name='${name.replaceAll("'","\\'")}' and '${parent}' in parents`;const r=await this.api(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive`);return (await r.json()).files?.[0]?.id||null}
 async get(name){const id=await this.findFile(name);if(!id)return null;const r=await this.api(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`);return r.json()}
 async put(name,data){const existing=await this.findFile(name),body=JSON.stringify(data,null,2);if(existing){await this.api(`https://www.googleapis.com/upload/drive/v3/files/${existing}?uploadType=media`,{method:'PATCH',headers:{'Content-Type':'application/json'},body});return}const parent=await this.folder();const boundary='vs'+Date.now();const meta=JSON.stringify({name,parents:[parent]});const multipart=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;await this.api(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,{method:'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body:multipart})}
 async test(){await this.folder();return true}
}

class PreparedProvider{constructor(cfg,name,requirements){this.cfg=cfg;this.name=name;this.requirements=requirements}async test(){throw new Error(`${this.name}: Anbieter ist in 0.3.1 Preview 2 konfigurierbar. Für die produktive API-Anmeldung wird ${this.requirements} benötigt.`)}async get(){return null}async put(){throw new Error(`${this.name}: API-Anmeldung noch nicht aktiviert.`)}}
export function createProvider(cfg){if(cfg.provider==='google')return new GoogleDriveProvider(cfg);if(cfg.provider==='nextcloud'||cfg.provider==='webdav')return new WebDavProvider(cfg);if(cfg.provider==='icloud')return new PreparedProvider(cfg,'Apple iCloud / CloudKit','eine CloudKit-Container-ID, ein API-Token und die Apple-Anmeldung');if(cfg.provider==='onedrive')return new PreparedProvider(cfg,'Microsoft OneDrive','eine Microsoft-App-Registrierung mit Client-ID und OAuth/PKCE');if(cfg.provider==='dropbox')return new PreparedProvider(cfg,'Dropbox','eine Dropbox-App mit App-Key und OAuth/PKCE');if(cfg.provider==='box')return new PreparedProvider(cfg,'Box','eine Box-App mit Client-ID und OAuth-Anmeldung');throw new Error('Kein Cloud-Anbieter gewählt.')}
export async function syncMaster(master,cfg,onProgress=()=>{}){
 const p=createProvider(cfg);if(p.ensure)await p.ensure();let merged=structuredClone(master);
 for(const [key,name] of Object.entries(FILES)){onProgress(`Lese ${name} …`);const remote=await p.get(name);if(remote){if(Array.isArray(master[key]))merged[key]=mergeRows(master[key],remote);else if(key==='sharedSettings'&&String(remote.updatedAt||'')>String(master[key]?.updatedAt||''))merged[key]=remote}}
 normalizeMatchTypes(merged);
 for(const [key,name] of Object.entries(FILES)){onProgress(`Schreibe ${name} …`);await p.put(name,merged[key]||[])}
 return merged;
}


export async function syncLiveSession(local,cfg,onProgress=()=>{}){
 if(!local?.matchId)return {status:'no-match',generation:local?.generation||0};
 if(!['nextcloud','webdav'].includes(cfg?.provider))throw new Error('Live-Session-Sync ist in dieser Revision für Nextcloud/WebDAV verfügbar.');
 const p=createProvider(cfg);if(p.ensure)await p.ensure();await p.ensureSession(local.matchId);
 const nowMs=Date.now(),leaseMs=20000;onProgress('Prüfe Live-Session-Lock …');
 const remoteMeta=await p.getSessionMeta(local.matchId,'session.json');const remote=remoteMeta.data;
 const remoteExpiry=Date.parse(remote?.leaseExpiresAt||0)||0,remoteActive=remote?.activeDeviceId||'';
 const localGeneration=Number(local.generation||0),remoteGeneration=Number(remote?.generation||0);
 if(remoteActive&&remoteActive!==local.deviceId&&remoteExpiry>nowMs){const e=new Error(`Live-Scouting ist auf ${remote.deviceName||'einem anderen Gerät'} aktiv.`);e.code='SESSION_LOCKED';e.remote=remote;throw e}
 if(remoteActive&&remoteActive!==local.deviceId&&localGeneration&&remoteGeneration>localGeneration){const e=new Error('Diese Session wurde inzwischen von einem anderen Gerät übernommen. Lokale Live-Daten werden nicht automatisch überschrieben.');e.code='SESSION_TAKEN_OVER';e.remote=remote;throw e}
 const generation=remoteActive===local.deviceId?Math.max(localGeneration,remoteGeneration,1):Math.max(localGeneration,remoteGeneration)+1;
 const leaseExpiresAt=new Date(nowMs+leaseMs).toISOString();
 const session={schema:1,matchId:local.matchId,activeDeviceId:local.deviceId,deviceName:local.deviceName||'WebApp',generation,leaseExpiresAt,lastHeartbeat:new Date(nowMs).toISOString(),updatedAt:new Date(nowMs).toISOString(),state:local.state,eventCount:(local.events||[]).length,lastEventId:local.events?.at?.(-1)?.id||''};
 onProgress('Schreibe Sessionstatus …');await p.putSession(local.matchId,'session.json',session,remote?{ifMatch:remoteMeta.etag||undefined}:{ifNoneMatch:'*'});
 onProgress('Synchronisiere Protokoll …');await p.putSession(local.matchId,'events.json',{schema:1,matchId:local.matchId,generation,updatedAt:session.updatedAt,events:local.events||[]});
 return {status:'synced',generation,leaseExpiresAt,eventCount:session.eventCount};
}
