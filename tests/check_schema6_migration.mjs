import assert from 'node:assert/strict';

class MemoryStorage{
  constructor(){this.m=new Map()}
  getItem(k){return this.m.has(k)?this.m.get(k):null}
  setItem(k,v){this.m.set(k,String(v))}
  removeItem(k){this.m.delete(k)}
}
globalThis.localStorage=new MemoryStorage();
localStorage.setItem('volleytakt-data-schema','5');
localStorage.setItem('volleytakt-live-state-v2',JSON.stringify({matchId:'match-live'}));
localStorage.setItem('volleytakt-live-events-v2',JSON.stringify([
 {id:'e1',rally_id:'r1',event_type:'action',action:'Annahme',value:'+'},
 {id:'e2',rally_id:'r1',event_type:'rally_result',rally_winner:'us'}
]));
localStorage.setItem('volleytakt-match-archive-v1',JSON.stringify([
 {matchId:'m-old',matchDate:'2026-09-01',events:[
  {id:'a1',rally_id:'ra',event_type:'action',action:'Aufschlag',value:'#'},
  {id:'a2',rally_id:'ra',event_type:'rally_result',rally_winner:'us'}
 ]}
]));
const storage=await import('../js/storage.js');
const report=storage.runDataMigrations();
assert.equal(report.from,5);
assert.equal(report.to,6);
assert.equal(Number(localStorage.getItem('volleytakt-data-schema')),6);
const live=storage.loadEvents();
assert.equal(live[0].context_id,'ctx:r1');
assert.equal(live[0].legacy_event_id,'e1');
const archive=storage.loadMatchArchive();
assert.equal(archive[0].dataSchema,6);
assert.equal(archive[0].events[0].context_id,'ctx:ra');
const backups=storage.listMigrationBackups();
assert.equal(backups.length,1);
assert.equal(backups[0].fromSchema,5);
assert.equal(backups[0].toSchema,6);
assert.ok(backups[0].data.matchArchive.includes('"a1"'),'raw pre-migration archive must be retained');
assert.ok(backups[0].contextMap.some(x=>x.eventId==='a1'&&x.contextId==='ctx:ra'),'legacy event -> context mapping retained');
console.log('Schema 5→6 migration backup/context checks passed.');
