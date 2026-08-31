class Store{
  constructor(){this.m=new Map()}
  getItem(k){return this.m.has(k)?this.m.get(k):null}
  setItem(k,v){this.m.set(k,String(v))}
  removeItem(k){this.m.delete(k)}
}
globalThis.localStorage=new Store();
localStorage.setItem('volleytakt-live-state-v2',JSON.stringify({matchId:'m1',pendingQuality:'++'}));
localStorage.setItem('volleytakt-match-archive-v1',JSON.stringify([{matchId:'m1',state:{matchComplete:false,pendingQuality:'++'},events:[{value:'++'}]}]));
const mod=await import('../js/storage.js');
const r=mod.runDataMigrations();
if(r.to!==5)throw new Error('migration did not reach schema 5');
const state=JSON.parse(localStorage.getItem('volleytakt-live-state-v2'));
if(!Array.isArray(state.videoAssignments))throw new Error('videoAssignments not migrated');
if(state.pendingQuality!=='#')throw new Error('legacy pending ++ not migrated');
const archive=JSON.parse(localStorage.getItem('volleytakt-match-archive-v1'));
if(!archive[0].fullState||!Array.isArray(archive[0].videos))throw new Error('match archive not migrated');
if(archive[0].events?.[0]?.value!=='#')throw new Error('legacy archive ++ not migrated');
if(!mod.latestUpdateBackup())throw new Error('backup not created');
console.log('preview032p2-migration-test: OK');
