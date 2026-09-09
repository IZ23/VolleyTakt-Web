/**
 * VolleyTakt Live scouting event model.
 *
 * Pure helpers only: no DOM, storage, CSV, sync, camera or rendering access.
 */
export function inferEventSide(action='',rotationSide=''){
  if(rotationSide==='own'||rotationSide==='opponent')return rotationSide;
  return String(action||'').startsWith('Gegner ')?'opponent':'own';
}

export function splitEventTiming(extra={},endSeconds=0){
  const cleanExtra={...(extra||{})};
  const end=Number.isFinite(+endSeconds)?+endSeconds:0;
  const start=Number.isFinite(+cleanExtra.action_start_seconds)?+cleanExtra.action_start_seconds:end;
  const startedAt=cleanExtra.action_started_at||'';
  delete cleanExtra.action_start_seconds;
  delete cleanExtra.action_started_at;
  return {startSeconds:start,endSeconds:end,startedAt,extra:cleanExtra};
}

export function buildScoutingEvent({
  id='',video='',videoClipId='',endSeconds=0,formatSeconds,completedAt='',createdAt='',
  setNo=1,matchMode='regular',fixedSetCount=3,fixedFinalSetTarget=25,
  rotation='R1',position='',player='',action='',value='',scoreUs=0,scoreThem=0,note='',extra={}
}={}){
  const timing=splitEventTiming(extra,endSeconds);
  const fmt=typeof formatSeconds==='function'?formatSeconds:(sec=>String(sec));
  const clean=timing.extra;
  return {
    id,
    video:video||'',
    video_clip_id:videoClipId||'',
    seconds:timing.startSeconds.toFixed(3),
    timestamp:fmt(timing.startSeconds),
    action_start_seconds:timing.startSeconds.toFixed(3),
    action_start_timestamp:fmt(timing.startSeconds),
    action_end_seconds:timing.endSeconds.toFixed(3),
    action_end_timestamp:fmt(timing.endSeconds),
    action_started_at:timing.startedAt,
    action_completed_at:completedAt||'',
    set:String(setNo),
    match_mode:matchMode,
    fixed_set_count:String(fixedSetCount||3),
    fixed_final_set_target:String(fixedFinalSetTarget||25),
    rotation,
    position:position||'',
    player:player||'',
    context_id:clean.context_id||(clean.rally_id?`ctx:${clean.rally_id}`:''),
    context_schema:clean.context_schema||1,
    legacy_event_id:clean.legacy_event_id||id||'',
    player_id:clean.player_id||'',
    player_abbreviation:clean.player_abbreviation||player||'',
    player_name:clean.player_name||'',
    action,
    value:value??'',
    score_us:String(scoreUs),
    score_them:String(scoreThem),
    note:note||'',
    createdAt:createdAt||completedAt||'',
    ...clean
  };
}

export function buildPlayerActionExtra({
  side='own',playerId='',playerAbbreviation='',playerName='',playerPosition=0,
  originZone=0,targetZone=0,targetSide='',action='',serveTechnique='',setTempo='',setDistance='',
  qualityLevel='',qualityProfile='',eventGroup='',transactionId='',actionStartedSeconds=null,actionStartedAt='',
  context={},rallyMeta={}
}={}){
  const own=side!=='opponent';
  return {
    player_id:playerId||'',
    player_abbreviation:playerAbbreviation||'',
    player_name:playerName||'',
    player_rotation_position:playerPosition||0,
    action_zone:originZone||0,
    target_zone:targetZone||'',
    target_side:targetSide||'',
    ...(own?{}:{attack_to:action==='Angriff'&&targetZone?targetZone:''}),
    serve_technique:action==='Aufschlag'?(serveTechnique||''):'',
    set_tempo:action==='Zuspiel'?(setTempo||''):'',
    set_distance:action==='Zuspiel'?(setDistance||''):'',
    quality_level:qualityLevel,
    quality_profile:qualityProfile||'',
    event_group:eventGroup||'',
    transaction_id:transactionId||eventGroup||'',
    action_start_seconds:actionStartedSeconds,
    action_started_at:actionStartedAt||'',
    ...(context||{}),
    ...(rallyMeta||{})
  };
}
