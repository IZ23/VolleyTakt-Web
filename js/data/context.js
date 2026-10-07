// VolleyTakt Live · schema 6 context normalization
// context_id groups every event of the same rally without replacing legacy IDs.
export const CONTEXT_SCHEMA=1;

const clean=s=>String(s??'').trim();
export function contextIdForEvent(event={},matchId=''){
  if(clean(event.context_id))return clean(event.context_id);
  const rally=clean(event.rally_id);
  if(rally)return `ctx:${rally}`;
  const set=clean(event.set)||'0', no=clean(event.rally_no);
  if(no)return `ctx:${clean(matchId)||'legacy'}:s${set}:r${no}`;
  const group=clean(event.event_group||event.transaction_id);
  if(group)return `ctx:${clean(matchId)||'legacy'}:g:${group}`;
  return '';
}
export function normalizeContextEvent(event={},matchId=''){
  const contextId=contextIdForEvent(event,matchId);
  return {
    ...event,
    ...(contextId?{context_id:contextId,context_schema:CONTEXT_SCHEMA}:{}),
    legacy_event_id:event.legacy_event_id||event.id||''
  };
}
export function normalizeContextEvents(events=[],matchId=''){
  return (events||[]).map(e=>normalizeContextEvent(e,matchId));
}
export function contextKey(event={},matchId=''){return contextIdForEvent(event,matchId)||`event:${event.id||''}`;}
