import assert from 'node:assert/strict';
import {libraryDisplayDate,applyMatchMetadata} from '../js/library/metadata.js';

const original={
  matchId:'m1',matchDate:'2026-08-24',createdAt:'2026-08-24T18:30:00Z',updatedAt:'2026-08-24T20:00:00Z',
  seasonId:'s1',ownTeamId:'t1',oppTeamId:'o1',matchTypeId:'mt1',matchTypeName:'Turnier',
  fullState:{matchId:'m1',matchDate:'2026-08-24',seasonId:'s1',ownTeamId:'t1',oppTeamId:'o1',matchTypeId:'mt1',matchTypeName:'Turnier',scoreUs:12,scoreThem:14,ownLineup:{1:'p1'}},
  events:[{id:'e1',rally_id:'r1',context_id:'ctx:r1',timestamp:'00:01.0'}]
};
assert.equal(libraryDisplayDate(original),'2026-08-24','library must display explicit matchDate');
assert.equal(libraryDisplayDate({createdAt:'2026-09-09T10:00:00Z'}),'','createdAt must never become displayed match date');

const next=applyMatchMetadata(original,{matchDate:'2026-08-23',oppTeamId:'o2',oppTeamName:'Goslar'},'2026-09-09T08:00:00Z');
assert.equal(next.matchDate,'2026-08-23');
assert.equal(next.fullState.matchDate,'2026-08-23');
assert.equal(next.state.matchDate,'2026-08-23');
assert.equal(next.oppTeamId,'o2');
assert.equal(next.fullState.scoreUs,12,'score must survive metadata edit');
assert.equal(next.fullState.ownLineup[1],'p1','lineup must survive metadata edit');
assert.deepEqual(next.events,original.events,'scouting events must stay untouched');
assert.equal(next.events[0].context_id,'ctx:r1','context ID must survive metadata edit');
assert.equal(next.updatedAt,'2026-09-09T08:00:00Z');
console.log('RC6-5 library metadata/date edit checks passed.');
