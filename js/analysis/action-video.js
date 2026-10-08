import {tr} from '../i18n.js';
// VolleyTakt Live 0.4.2 RC1 · ANALYSIS-ACTIONS1 / ANALYSIS-VIDEO1 / VIDEO2 / VIDEO3
// Builds action selections from the already filtered analysis data and provides a
// virtual video cut/playlist. Streaming references are played in-place; local
// filename-only assignments stay exportable but cannot be opened by a browser
// without a user-selected File/URL.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const n=v=>{if(v===null||v===undefined||String(v).trim()==='')return null;const x=Number(v);return Number.isFinite(x)?x:null};
const eventStart=e=>n(e?.action_start_seconds)??n(e?.seconds);
const eventEnd=e=>{const start=eventStart(e),end=n(e?.action_end_seconds);if(start===null)return null;return Math.max(start+0.5,end??start+6)};
const fmtSeconds=seconds=>{const s=Math.max(0,Number(seconds)||0),m=Math.floor(s/60),r=Math.floor(s%60);return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`};
const actionName=e=>clean(e?.action||e?.technique||'Aktion');
const quality=e=>clean(e?.value||e?.quality||'');
const playerName=e=>clean(e?.player_name||e?.player||e?.player_abbreviation||'–');
const groupFor=q=>['#','+'].includes(q)?'success':['=','-'].includes(q)?'error':'neutral';
const groupLabel={success:'Erfolgreich',neutral:'Neutral / eingeschränkt',error:'Fehlerhaft'};
const L=value=>tr(String(value??''));

export function youtubeVideoId(reference=''){
  const ref=String(reference||'').trim();
  if(/^[A-Za-z0-9_-]{11}$/.test(ref))return ref;
  try{
    const u=new URL(ref);
    const host=u.hostname.toLowerCase().replace(/\.$/,'');
    if(host==='youtu.be'||host==='www.youtu.be')return (/^[A-Za-z0-9_-]{11}$/.test(u.pathname.split('/').filter(Boolean)[0]||'')?u.pathname.split('/').filter(Boolean)[0]:'');
    if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host)){
      if(/^[A-Za-z0-9_-]{11}$/.test(u.searchParams.get('v')||''))return u.searchParams.get('v');
      const p=u.pathname.split('/').filter(Boolean),i=p.findIndex(x=>['embed','shorts','live'].includes(x));
      if(i>=0&&/^[A-Za-z0-9_-]{11}$/.test(p[i+1]||''))return p[i+1];
    }
  }catch{}
  return '';
}
function assignmentFor(event){
  const match=event?._match||{},rows=[...(match.videos||match.fullState?.videoAssignments||match.state?.videoAssignments||[])];
  return rows.find(v=>v.id&&v.id===event?.video_clip_id)||rows[0]||null;
}
function clipForEvent(event,index=0,{preRoll=1.5,postRoll=1.5}={}){
  const match=event?._match||{},assignment=assignmentFor(event),scoutStart=eventStart(event),scoutEnd=eventEnd(event),offset=assignment?Number(assignment.videoSyncSeconds||0)-Number(assignment.scoutingSyncSeconds||0):0;
  const hasTimestamp=scoutStart!==null&&scoutEnd!==null;
  const rawVideoStart=hasTimestamp?Math.max(0,scoutStart+offset):null,rawVideoEnd=hasTimestamp?Math.max(rawVideoStart+.5,scoutEnd+offset):null;
  const start=hasTimestamp?Math.max(0,rawVideoStart-preRoll):null,end=hasTimestamp?Math.max(start+.5,rawVideoEnd+postRoll):null;
  const playback=assignment?.playbackSource||null,storageType=playback?.type||assignment?.storageType||'',ref=playback?.reference||assignment?.reference||'',youtubeId=storageType==='youtube'?youtubeVideoId(ref):youtubeVideoId(ref);
  let browserUrl='';try{const u=new URL(ref);browserUrl=u.protocol==='https:'?u.href:''}catch{}
  const playable=hasTimestamp&&!!(youtubeId||browserUrl);
  return {
    id:`clip_${match.matchId||'match'}_${event?.event_id||event?.id||index}`,
    index,matchId:match.matchId||'',matchDate:match.matchDate||'',matchLabel:clean(match.displayName||match.matchName||((match.ownTeamName&&match.oppTeamName)?`${match.ownTeamName} – ${match.oppTeamName}`:'')),
    set:event?.set||'',rally:event?.rally_no||event?.rally||'',rotation:event?.rotation||'',position:event?.player_rotation_position||event?.position||'',zone:event?.action_zone||'',target:event?.target_zone||'',
    playerId:event?.player_id||'',player:playerName(event),action:actionName(event),quality:quality(event),group:groupFor(quality(event)),
    eventId:event?.event_id||event?.id||'',scoutingStart:scoutStart,scoutingEnd:scoutEnd,rawVideoStart,rawVideoEnd,start,end,hasTimestamp,
    videoAssignmentId:assignment?.id||'',videoAssignment:assignment,
    storageType,videoLabel:assignment?.label||'',videoReference:ref,youtubeId,browserUrl,playable,
    sourceEvent:event
  };
}
export function buildActionSelection(events=[],options={}){
  const allowed=new Set(['Angriff','Annahme','Aufschlag','Block','Abwehr','Zuspiel']);
  const clips=(events||[]).filter(e=>allowed.has(actionName(e))).map((e,i)=>clipForEvent(e,i,options)).sort((a,b)=>String(a.matchDate||'').localeCompare(String(b.matchDate||''))||Number(a.set||0)-Number(b.set||0)||(a.scoutingStart??Number.MAX_SAFE_INTEGER)-(b.scoutingStart??Number.MAX_SAFE_INTEGER)||String(a.eventId||a.id).localeCompare(String(b.eventId||b.id)));
  clips.forEach((clip,index)=>clip.index=index);
  return {clips,groups:{success:clips.filter(x=>x.group==='success'),neutral:clips.filter(x=>x.group==='neutral'),error:clips.filter(x=>x.group==='error')}};
}
export function eventsForAnalysisView(view,events=[]){
  const names={serve:['Aufschlag'],reception:['Annahme'],sets:['Zuspiel'],attacks:['Angriff'],blockdef:['Block','Abwehr']};
  if(names[view])return events.filter(e=>names[view].includes(actionName(e)));
  if(view==='targets')return events.filter(e=>Number(e?.target_zone)>0||Number(e?.action_zone)>0);
  return events.filter(e=>['Angriff','Annahme','Aufschlag','Block','Abwehr','Zuspiel'].includes(actionName(e)));
}
export function actionSelectionHtml(selection,{title='Gefilterte Aktionen'}={}){
  const clips=selection?.clips||[];
  const groupHtml=key=>`<section class="analysis-action-group"><header><h4>${esc(L(groupLabel[key]))}</h4><span>${selection?.groups?.[key]?.length||0}</span></header><div class="analysis-action-list">${(selection?.groups?.[key]||[]).map(c=>`<article><div><strong>${esc(c.player)} · ${esc(L(c.action))} <span class="analysis-quality-badge" title="${esc(L('Qualität'))}">${esc(L('Qualität'))} ${esc(c.quality||'–')}</span></strong><span>${esc(c.matchDate)} · ${esc(L('Satz'))} ${esc(c.set||'–')} · ${esc(c.rotation||'–')} · P${esc(c.position||c.zone||'–')}</span><small>${esc(c.matchLabel||c.matchId)} · ${c.hasTimestamp?`${esc(L('Video'))} ${fmtSeconds(c.start)}–${fmtSeconds(c.end)}`:esc(L('kein Aktions-Timestamp'))}${c.target?` · ${esc(L('WOHIN'))} P${esc(c.target)}`:''}</small></div><button type="button" data-action-video="${c.index}" ${c.playable?'':'disabled'} title="${esc(L(c.playable?'Videosequenz abspielen':(c.hasTimestamp?'Für diese Aktion ist keine browserfähige Video-URL hinterlegt.':'Kein belastbarer Aktions-Timestamp vorhanden.')))}">▶ ${esc(L('Video'))}</button></article>`).join('')||`<p class="small">${esc(L('Keine Aktionen in dieser Gruppe.'))}</p>`}</div></section>`;
  return `<section class="analysis-actions"><header class="analysis-actions-head"><div><h3>${esc(L(title))}</h3><p>${clips.length} ${esc(L('Aktion(en)'))} · ${esc(L('gruppiert nach Wirkung'))}</p></div><div class="toolbar"><button type="button" data-action-play-all ${clips.some(c=>c.playable)?'':'disabled'}>▶ ${esc(L('Alle abspielen'))}</button><button type="button" data-action-export-json>JSON</button><button type="button" data-action-export-csv>CSV</button><button type="button" class="primary" data-action-create-video>🎬 ${esc(L('Aus Auswahl Video erzeugen'))}</button></div></header>${groupHtml('success')}${groupHtml('neutral')}${groupHtml('error')}</section>`;
}
function download(name,type,text){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200)}
export function exportActionSelection(selection,format='json',base='VolleyTakt_Aktionen'){
  const rows=(selection?.clips||[]).map(({sourceEvent,videoAssignment,...x})=>x);
  if(format==='csv'){
    const cols=['matchDate','matchLabel','set','rally','rotation','position','zone','target','player','action','quality','group','videoLabel','videoReference','start','end'];
    const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;
    download(`${base}.csv`,'text/csv;charset=utf-8','\ufeff'+cols.join(';')+'\n'+rows.map(r=>cols.map(c=>q(r[c])).join(';')).join('\n'));return;
  }
  download(`${base}.json`,'application/json;charset=utf-8',JSON.stringify({schema:1,kind:'volleytakt-action-playlist',generatedAt:new Date().toISOString(),clips:rows},null,2));
}
let playerRoot=null,queue=[],queueIndex=0;
function ensurePlayer(){
  if(playerRoot)return playerRoot;
  playerRoot=document.createElement('div');playerRoot.className='analysis-video-backdrop';playerRoot.hidden=true;
  playerRoot.innerHTML=`<section class="analysis-video-window" role="dialog" aria-modal="true"><header><div><h2>${esc(L('Video-Sequenzen'))}</h2><p id="analysisVideoMeta"></p></div><button id="analysisVideoClose" aria-label="${esc(L('Schließen'))}">×</button></header><main><div id="analysisVideoPlayer"></div><div id="analysisVideoInfo"></div></main><footer><button id="analysisVideoPrev">← ${esc(L('Vorherige'))}</button><span id="analysisVideoCounter"></span><button id="analysisVideoNext">${esc(L('Nächste'))} →</button></footer></section>`;
  document.body.appendChild(playerRoot);playerRoot.querySelector('#analysisVideoClose').onclick=()=>{playerRoot.hidden=true;playerRoot.querySelector('#analysisVideoPlayer').replaceChildren()};
  playerRoot.addEventListener('click',e=>{if(e.target===playerRoot)playerRoot.querySelector('#analysisVideoClose').click()});
  playerRoot.querySelector('#analysisVideoPrev').onclick=()=>showQueue(Math.max(0,queueIndex-1));
  playerRoot.querySelector('#analysisVideoNext').onclick=()=>showQueue(Math.min(queue.length-1,queueIndex+1));
  return playerRoot;
}
function playerNode(clip){
  if(clip.youtubeId){const iframe=document.createElement('iframe');iframe.allow='autoplay; encrypted-media; picture-in-picture';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';iframe.src=`https://www.youtube-nocookie.com/embed/${encodeURIComponent(clip.youtubeId)}?autoplay=1&start=${Math.floor(clip.start)}&end=${Math.ceil(clip.end)}`;return iframe}
  if(clip.browserUrl){const video=document.createElement('video');video.controls=true;video.autoplay=true;video.playsInline=true;video.src=clip.browserUrl;video.addEventListener('loadedmetadata',()=>{try{video.currentTime=clip.start}catch{}});video.addEventListener('timeupdate',()=>{if(video.currentTime>=clip.end){video.pause();if(queueIndex<queue.length-1)showQueue(queueIndex+1)}});return video}
  const p=document.createElement('p');p.className='analysis-video-unavailable';p.textContent=L('Die Videozuordnung enthält nur einen lokalen Dateinamen. Bitte eine browserfähige URL/YouTube-Referenz verwenden oder die exportierte Schnittliste in VolleyTakt Desktop weiterverarbeiten.');return p;
}
function showQueue(index){
  const root=ensurePlayer();queueIndex=index;const clip=queue[index];if(!clip)return;
  root.querySelector('#analysisVideoPlayer').replaceChildren(playerNode(clip));root.querySelector('#analysisVideoMeta').textContent=`${clip.player} · ${L(clip.action)} · ${L('Qualität')} ${clip.quality||'–'} · ${clip.matchDate||clip.matchId}`;
  root.querySelector('#analysisVideoInfo').innerHTML=`<strong>${esc(L('Satz'))} ${esc(clip.set||'–')} · ${esc(clip.rotation||'–')} · P${esc(clip.position||clip.zone||'–')}</strong><span>${fmtSeconds(clip.start)}–${fmtSeconds(clip.end)} · ${esc(clip.videoLabel||clip.storageType||'Video')}</span>`;
  root.querySelector('#analysisVideoCounter').textContent=`${index+1} / ${queue.length}`;root.querySelector('#analysisVideoPrev').disabled=index===0;root.querySelector('#analysisVideoNext').disabled=index>=queue.length-1;root.hidden=false;
}
export function openActionPlaylist(selection,startIndex=0){queue=(selection?.clips||[]).filter(c=>c.playable);if(!queue.length)return false;const requested=selection.clips?.[startIndex],i=requested?Math.max(0,queue.findIndex(c=>c.id===requested.id)):0;showQueue(i<0?0:i);return true}
export function wireActionSelection(root,selection,{base='VolleyTakt_Aktionen',onCreateVideo=null}={}){
  if(!root||!selection)return;
  root.querySelectorAll('[data-action-video]').forEach(b=>b.onclick=()=>openActionPlaylist(selection,Number(b.dataset.actionVideo)||0));
  root.querySelectorAll('[data-action-play-all]').forEach(b=>b.onclick=()=>openActionPlaylist(selection,0));
  root.querySelectorAll('[data-action-export-json]').forEach(b=>b.onclick=()=>exportActionSelection(selection,'json',base));
  root.querySelectorAll('[data-action-export-csv]').forEach(b=>b.onclick=()=>exportActionSelection(selection,'csv',base));
  root.querySelectorAll('[data-action-create-video]').forEach(b=>b.onclick=()=>onCreateVideo?onCreateVideo(selection):window.dispatchEvent(new CustomEvent('volleytakt:create-video',{detail:{selection}})));
}
