// VolleyTakt Live 0.4.0 RC4-r2 - pure master-data selectors.
export function findPlayer(master, state, id){return master?.players?.find(x=>x.id===id)||state?.quickPlayers?.[id]}
export function findTeam(master, id){return master?.teams?.find(x=>x.id===id)}
export function findSeason(master, id){return master?.seasons?.find(x=>x.id===id)}
export function findMatchType(master, id){return master?.matchTypes?.find(x=>x.id===id)}
export function matchTypeKey(name){return String(name||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('de')}
