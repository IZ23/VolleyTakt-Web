import assert from 'node:assert/strict';
import {reconstructMatchState,undoEventBatch,safeHistoryJson} from '../js/scouting/history.js';

assert.deepEqual(safeHistoryJson('{"1":"A"}',{}),{1:'A'});
assert.deepEqual(safeHistoryJson('broken',{1:'X'}),{1:'X'});

const grouped=[
 {id:'a',action:'Aufschlag',event_group:'g1'},
 {id:'b',action:'Punkt wir',event_group:'g2'},
 {id:'c',action:'Rotation',event_group:'g2'}
];
const gu=undoEventBatch(grouped);
assert.deepEqual(gu.events.map(x=>x.id),['a']);
assert.deepEqual(gu.removed.map(x=>x.id),['b','c']);
assert.equal(grouped.length,3,'undo helper must not mutate source array');

const legacy=[
 {id:'p',action:'Punkt wir',sideout:'1'},
 {id:'r',action:'Rotation'}
];
const lu=undoEventBatch(legacy);
assert.equal(lu.events.length,0);
assert.deepEqual(lu.removed.map(x=>x.id),['p','r']);

const lineup={1:'A',2:'B',3:'C',4:'D',5:'E',6:'F'};
const rows=[
 {event_type:'set_start',action:'Satzstart',set:'1',serving_after:'us',own_lineup:JSON.stringify(lineup),opp_lineup:'{}',own_liberos:'["L"]',opp_liberos:'[]',set_wins_us:'0',set_wins_them:'0'},
 {action:'Aufschlag',set:'1',rally_id:'ra',rally_no:'1',rally_sequence:'1'},
 {event_type:'rally_result',action:'Punkt wir',set:'1',rally_winner:'us',serving_after:'us'},
 {action:'Rotation',set:'1',rotation:'R6',rotation_side:'own',lineup_after:JSON.stringify({1:'B',2:'C',3:'D',4:'E',5:'F',6:'A'})},
 {event_type:'substitution',action:'Wechsel',set:'1',rotation_side:'own',lineup_after:JSON.stringify({1:'X',2:'C',3:'D',4:'E',5:'F',6:'A'})},
 {action:'Spielstandskorrektur',set:'1',value:'1:0->7:6'},
 {action:'Angriff',set:'1',rally_id:'rb',rally_no:'2',rally_sequence:'3'}
];
const rebuilt=reconstructMatchState(rows,{rotationLabels:['R1','R6','R5','R4','R3','R2'],firstSetServing:'',rallyCounter:0,isTechniqueEvent:r=>['Aufschlag','Angriff'].includes(r.action),servingForSet:()=>'',isMatchFinishedAfterSet:()=>false});
assert.equal(rebuilt.scoreUs,7);assert.equal(rebuilt.scoreThem,6);
assert.equal(rebuilt.servingSide,'us');assert.equal(rebuilt.rotationIndex,1);
assert.equal(rebuilt.ownLineup[1],'X');assert.equal(rebuilt.currentLiberosOwn[0],'L');
assert.equal(rebuilt.currentRallyId,'rb');assert.equal(rebuilt.currentRallyNo,2);assert.equal(rebuilt.currentRallySeq,3);
assert.equal(rebuilt.rallyCounter,2);assert.equal(rebuilt.setReady,true);

const fallbackRows=[
 {event_type:'set_start',action:'Satzstart',set:'1',own_lineup:JSON.stringify(lineup),opp_lineup:'{}'},
 {action:'Rotation',set:'1',rotation_side:'own'}
];
const fallback=reconstructMatchState(fallbackRows,{rotationLabels:['R1','R6','R5','R4','R3','R2'],isTechniqueEvent:()=>false,servingForSet:()=>'',isMatchFinishedAfterSet:()=>false});
assert.equal(fallback.ownLineup[1],'B','legacy rotation without lineup_after must reconstruct');
console.log('preview040p7 history tests passed');
