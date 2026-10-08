import {t} from '../i18n.js';
// VolleyTakt Live 0.4.2 RC2 · optional VolleyVideo-Worker API client
const trimSlash=s=>String(s||'').trim().replace(/\/+$/,'');
export function normalizeWorkerBaseUrl(value=''){
  let v=String(value||'').trim();if(!v)return '';
  if(!/^https?:\/\//i.test(v))v=`https://${v}`;
  try{const u=new URL(v);const host=u.hostname.toLowerCase();const loopback=['localhost','127.0.0.1','::1'].includes(host);if(u.protocol!=='https:'&&!(u.protocol==='http:'&&loopback))return '';return trimSlash(u.href)}catch{return ''}
}
export function workerErrorMessage(code,message=''){
  const map={SOURCE_NOT_FOUND:'videoWorker.error.sourceNotFound',SOURCE_NOT_ACCESSIBLE:'videoWorker.error.sourceNotAccessible',INVALID_MANIFEST:'videoWorker.error.invalidManifest',INVALID_TIMESTAMP:'videoWorker.error.invalidTimestamp',UNSUPPORTED_VIDEO:'videoWorker.error.unsupportedVideo',STORAGE_FULL:'videoWorker.error.storageFull',ENCODER_FAILED:'videoWorker.error.encoderFailed',JOB_NOT_FOUND:'videoWorker.error.jobNotFound',RESULT_EXPIRED:'videoWorker.error.resultExpired',AUTH_FAILED:'videoWorker.error.authFailed',SERVER_BUSY:'videoWorker.error.serverBusy'};
  return map[code]?t(map[code]):message||t('videoWorker.error.generic');
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
    if(!base)throw new Error(t('videoWorker.error.addressMissingOrInsecure'));
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
    try{
      const headers={Accept:'application/json'};if(token)headers.Authorization=`Bearer ${token}`;if(body!==undefined)headers['Content-Type']='application/json';
      const response=await fetch(`${base}/api/v1${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal,cache:'no-store'});
      return await parseResponse(response);
    }catch(error){if(error?.name==='AbortError')throw new Error(t('videoWorker.error.timeout'));if(error instanceof TypeError)throw new Error(t('videoWorker.error.unreachable'));throw error}finally{clearTimeout(timer)}
  };
  return {
    health:()=>request('/health'),
    capabilities:()=>request('/capabilities'),
    createJob:manifest=>request('/jobs',{method:'POST',body:manifest,timeout:30000}),
    getJob:jobId=>request(`/jobs/${encodeURIComponent(jobId)}`),
    getResult:async jobId=>{const r=await request(`/jobs/${encodeURIComponent(jobId)}/result`,{timeout:60000});return r},
    deleteJob:jobId=>request(`/jobs/${encodeURIComponent(jobId)}`,{method:'DELETE'}),
    async test(){const health=await this.health();const capabilities=await this.capabilities();const apiVersion=Number(capabilities?.apiVersion??health?.apiVersion);if(apiVersion!==1){const e=new Error(t('videoWorker.error.apiIncompatible',{version:capabilities?.apiVersion??health?.apiVersion??'?'}));e.code='API_INCOMPATIBLE';throw e}return {health,capabilities}}
  };
}
