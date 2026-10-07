// VolleyTakt Live 0.4.2 RC2 · server-neutral VideoCutManifest 1.1
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const safePart=s=>clean(s).normalize('NFKC').replace(/[\\/:*?"<>|\x00-\x1F]/g,' ').replace(/\.\./g,' ').replace(/\s+/g,'_').replace(/_+/g,'_').replace(/^[_\.]+|[_\.]+$/g,'').slice(0,70);
export function safeVideoFilename(value='VolleyTakt_Video.mp4'){
  let base=String(value||'').replace(/\.mp4$/i,'');base=safePart(base)||'VolleyTakt_Video';return `${base.slice(0,140)}.mp4`;
}
export function proposeVideoFilename(context={}){
  const p=context.player?.name||context.player||'',f=context.filters||{},opp=context.match?.opponent||'',parts=[];
  if(p)parts.push(p);else if(opp)parts.push(`Spiel_gegen_${opp}`);else parts.push('VolleyTakt');
  if(f.technique)parts.push(f.technique==='Angriff'?'Angriffe':f.technique==='Zuspiel'?'Zuspiele':f.technique);
  if(f.targetPosition)parts.push(`auf_${f.targetPosition}`);else if(f.sourcePosition)parts.push(f.sourcePosition);
  if(f.quality)parts.push(Array.isArray(f.quality)?f.quality.join('-'):f.quality);
  return safeVideoFilename(parts.filter(Boolean).join('_'));
}
function processingSource(assignment){
  const p=assignment?.processingSource;if(p?.type&&p?.reference)return {type:p.type,path:p.reference,reference:p.reference};
  // Backward compatibility: old local/cloud refs can be used as processing candidates; YouTube never is.
  if(assignment?.storageType==='local'&&assignment.reference)return {type:'local',path:assignment.reference};
  if(assignment?.storageType==='cloud'&&assignment.reference)return {type:'webdav',path:assignment.reference,reference:assignment.reference};
  return null;
}
export function buildSelectionContext({clips=[],filters={},description='',matches=[]}={}){
  const playerNames=[...new Set(clips.map(c=>c.player).filter(Boolean))],techniques=[...new Set(clips.map(c=>c.action).filter(Boolean))],qualities=[...new Set(clips.map(c=>c.quality).filter(Boolean))];
  const oneMatch=matches.length===1?matches[0]:null;
  return {type:'analysis-selection',description:clean(description)||`${clips.length} ausgewählte VolleyTakt-Aktion(en)`,match:oneMatch?{opponent:oneMatch.oppTeamName||oneMatch.opponent||'',date:oneMatch.matchDate||''}:null,player:playerNames.length===1?{name:playerNames[0]}:null,filters:{...filters,technique:filters.technique|| (techniques.length===1?techniques[0]:null),quality:filters.quality|| (qualities.length?qualities:null)}};
}
export function buildVideoCutManifest(selection,{selectionContext={},preRollSeconds=3,postRollSeconds=2,filename=null,profile='1080p-h264'}={}){
  const clips=selection?.clips||[],sourceMap=new Map(),manifestClips=[];
  clips.forEach((clip,index)=>{
    const assignment=clip.videoAssignment||clip.sourceEvent?._videoAssignment||null,source=processingSource(assignment||clip.assignment||{});
    if(!source||clip.rawVideoStart==null||clip.rawVideoEnd==null)return;
    const sourceId=String(assignment?.id||clip.videoAssignmentId||`source-${sourceMap.size+1}`);
    if(!sourceMap.has(sourceId))sourceMap.set(sourceId,{sourceId,type:source.type,...(source.path?{path:source.path}:{}),...(source.reference&&!source.path?{reference:source.reference}:{})});
    manifestClips.push({actionId:String(clip.eventId||clip.id),sourceId,start:Number(clip.rawVideoStart),end:Number(clip.rawVideoEnd),order:manifestClips.length+1});
  });
  return {schemaVersion:'1.1',matchId:[...new Set(clips.map(c=>c.matchId).filter(Boolean))].length===1?clips.find(c=>c.matchId)?.matchId||null:null,selectionContext,padding:{preRollSeconds:Math.max(0,Number(preRollSeconds)||0),postRollSeconds:Math.max(0,Number(postRollSeconds)||0)},sources:[...sourceMap.values()],clips:manifestClips,output:{filename:filename?safeVideoFilename(filename):null,profile}};
}
export function validateVideoCutManifest(manifest){
  if(manifest?.schemaVersion!=='1.1')return 'Manifest-Version muss 1.1 sein.';
  if(!manifest?.clips?.length)return 'Keine verarbeitbaren Clips mit Processing-Quelle vorhanden.';
  if(!manifest?.sources?.length)return 'Keine für den Worker erreichbare Videoquelle vorhanden.';
  if(manifest.clips.some(c=>!c.sourceId||!(Number.isFinite(c.start)&&Number.isFinite(c.end))||c.end<=c.start))return 'Mindestens eine Schnittzeit ist ungültig.';
  return '';
}
