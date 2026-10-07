// VolleyTakt Live 0.4.2 RC2 · optional VolleyVideo-Worker API client
const trimSlash=s=>String(s||'').trim().replace(/\/+$/,'');
export function normalizeWorkerBaseUrl(value=''){
  let v=String(value||'').trim();if(!v)return '';
  if(!/^https?:\/\//i.test(v))v=`https://${v}`;
  return trimSlash(v);
}
export function workerErrorMessage(code,message=''){
  const map={SOURCE_NOT_FOUND:'Die Videodatei wurde auf dem Videoserver nicht gefunden.',SOURCE_NOT_ACCESSIBLE:'Der Videoserver kann nicht auf die Videoquelle zugreifen.',INVALID_MANIFEST:'Der Schnittauftrag ist ungültig.',INVALID_TIMESTAMP:'Mindestens eine Schnittzeit ist ungültig.',UNSUPPORTED_VIDEO:'Das Videoformat wird vom Server nicht unterstützt.',STORAGE_FULL:'Auf dem Videoserver ist nicht genügend Speicher verfügbar.',ENCODER_FAILED:'Die Videoverarbeitung ist fehlgeschlagen.',JOB_NOT_FOUND:'Der Videoauftrag wurde auf dem Server nicht gefunden.',RESULT_EXPIRED:'Das erzeugte Video ist nicht mehr verfügbar.',AUTH_FAILED:'Anmeldung am VolleyVideo-Worker fehlgeschlagen.',SERVER_BUSY:'Der Videoserver ist momentan ausgelastet.'};
  return map[code]||message||'Der VolleyVideo-Worker konnte die Anfrage nicht verarbeiten.';
}
async function parseResponse(response){
  const type=response.headers.get('content-type')||'';
  if(response.ok)return type.includes('application/json')?response.json():response;
  let payload={};try{payload=type.includes('application/json')?await response.json():{message:await response.text()}}catch{}
  const error=new Error(workerErrorMessage(payload.code,payload.message||`HTTP ${response.status}`));error.code=payload.code||`HTTP_${response.status}`;error.status=response.status;error.payload=payload;throw error;
}
export function createVideoWorkerClient(config={}){
  const base=normalizeWorkerBaseUrl(config.baseUrl);const token=String(config.apiToken||'');
  const request=async(path,{method='GET',body,timeout=15000}={})=>{
    if(!base)throw new Error('Keine VolleyVideo-Worker-Adresse konfiguriert.');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
    try{
      const headers={Accept:'application/json'};if(token)headers.Authorization=`Bearer ${token}`;if(body!==undefined)headers['Content-Type']='application/json';
      const response=await fetch(`${base}/api/v1${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal,cache:'no-store'});
      return await parseResponse(response);
    }catch(error){if(error?.name==='AbortError')throw new Error('Zeitüberschreitung beim VolleyVideo-Worker.');if(error instanceof TypeError)throw new Error('VolleyVideo-Worker nicht erreichbar. Bei einer LAN-Adresse bitte HTTPS, CORS und den lokalen Netzwerkzugriff des Browsers prüfen.');throw error}finally{clearTimeout(timer)}
  };
  return {
    health:()=>request('/health'),
    capabilities:()=>request('/capabilities'),
    createJob:manifest=>request('/jobs',{method:'POST',body:manifest,timeout:30000}),
    getJob:jobId=>request(`/jobs/${encodeURIComponent(jobId)}`),
    getResult:async jobId=>{const r=await request(`/jobs/${encodeURIComponent(jobId)}/result`,{timeout:60000});return r},
    deleteJob:jobId=>request(`/jobs/${encodeURIComponent(jobId)}`,{method:'DELETE'}),
    async test(){const health=await this.health();const capabilities=await this.capabilities();const apiVersion=Number(capabilities?.apiVersion??health?.apiVersion);if(apiVersion!==1){const e=new Error(`Worker erreichbar, aber API-Version ${capabilities?.apiVersion??health?.apiVersion??'unbekannt'} wird nicht unterstützt.`);e.code='API_INCOMPATIBLE';throw e}return {health,capabilities}}
  };
}
