import assert from 'node:assert/strict';

class MemoryStorage{
  constructor({quotaKey=null}={}){this.m=new Map();this.quotaKey=quotaKey}
  getItem(k){return this.m.has(k)?this.m.get(k):null}
  setItem(k,v){if(this.quotaKey&&k===this.quotaKey){const e=new Error('quota');e.name='QuotaExceededError';throw e}this.m.set(k,String(v))}
  removeItem(k){this.m.delete(k)}
}

globalThis.localStorage=new MemoryStorage();
const storage=await import('../js/storage.js');

// Fresh install: no pointless 0→6 migration and no backup duplication.
let r=storage.runDataMigrations();
assert.equal(r.migrated,false);
assert.equal(r.inferred,true);
assert.equal(localStorage.getItem('volleytakt-data-schema'),'6');
assert.equal(storage.listMigrationBackups().length,0);

// Missing marker but already schema-6 state: infer current schema and start normally.
globalThis.localStorage=new MemoryStorage();
localStorage.setItem('volleytakt-live-state-v2',JSON.stringify({matchId:'m1',dataSchema:6,analysisContextSchema:1}));
r=storage.runDataMigrations();
assert.equal(r.migrated,false);
assert.equal(r.to,6);
assert.equal(localStorage.getItem('volleytakt-data-schema'),'6');
assert.equal(storage.listMigrationBackups().length,0);

// Required migration with exhausted backup quota: do not touch user data and do not throw.
globalThis.localStorage=new MemoryStorage({quotaKey:'volleytakt-migration-backups-v1'});
localStorage.setItem('volleytakt-data-schema','5');
const originalState=JSON.stringify({matchId:'legacy'});
localStorage.setItem('volleytakt-live-state-v2',originalState);
r=storage.runDataMigrations();
assert.equal(r.blocked,true);
assert.equal(r.reason,'storage-quota');
assert.equal(localStorage.getItem('volleytakt-data-schema'),'5');
assert.equal(localStorage.getItem('volleytakt-live-state-v2'),originalState);

// Real migration retains only one full migration backup.
globalThis.localStorage=new MemoryStorage();
localStorage.setItem('volleytakt-data-schema','5');
localStorage.setItem('volleytakt-update-backup','stale-large-update-backup');
localStorage.setItem('volleytakt-migration-backups-v1',JSON.stringify([{old:true},{older:true}]));
localStorage.setItem('volleytakt-live-state-v2',JSON.stringify({matchId:'m2'}));
localStorage.setItem('volleytakt-live-events-v2',JSON.stringify([{id:'e1',rally_id:'r1',event_type:'action',action:'Annahme',value:'+'}]));
r=storage.runDataMigrations();
assert.equal(r.migrated,true);
assert.equal(storage.listMigrationBackups().length,1);
assert.equal(localStorage.getItem('volleytakt-update-backup'),null);
assert.equal(localStorage.getItem('volleytakt-data-schema'),'6');
console.log('DATA-MIGRATION1 inference/quota/single-backup checks passed.');
