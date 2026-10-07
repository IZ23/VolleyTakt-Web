import assert from 'node:assert/strict';
import {parseTimestampInput,formatTimestampCanonical,applyTimestampToEvent,timestampInputValue,insertActionAfterEvent,insertActionBeforeEvent} from '../js/video/timestamp-editor.js';
assert.deepEqual(parseTimestampInput('80'),{ok:true,seconds:80});
assert.deepEqual(parseTimestampInput('1:20'),{ok:true,seconds:80});
assert.deepEqual(parseTimestampInput('01:20'),{ok:true,seconds:80});
assert.deepEqual(parseTimestampInput('1:02:03'),{ok:true,seconds:3723});
assert.equal(parseTimestampInput('1.20').seconds,1.2);
assert.equal(parseTimestampInput('1:80').ok,false);
assert.equal(timestampInputValue({seconds:'0.000',action_start_seconds:'0.000',timestamp:'00:46.0'}),'46');
const shifted=applyTimestampToEvent({seconds:'10.000',timestamp:'00:10.0',action_start_seconds:'10.000',action_end_seconds:'12.500'},80,s=>formatTimestampCanonical(s));
assert.equal(shifted.action_start_seconds,'80.000');assert.equal(shifted.action_end_seconds,'82.500');assert.equal(shifted.timestamp,'01:20.0');
const rows=[
 {id:'a',rally_id:'r1',rally_no:'1',rally_sequence:'1',action:'Annahme'},
 {id:'b',rally_id:'r1',rally_no:'1',rally_sequence:'2',action:'Zuspiel'},
 {id:'c',rally_id:'r1',rally_no:'1',rally_sequence:'3',event_type:'rally_result',action:'Punkt wir'}
];
const inserted={id:'x',action:'Abwehr'};
const next=insertActionAfterEvent(rows,'a',inserted);
assert.deepEqual(next.map(e=>e.id),['a','x','b','c']);
assert.equal(next[1].rally_id,'r1');assert.equal(next[1].rally_sequence,'2');assert.equal(next[2].rally_sequence,'3');assert.equal(next[3].rally_sequence,'4');
assert.equal(next[1].event_type,'action');assert.equal(next[1].rally_event,'action');
const beforeRows=[
 {id:'a',rally_id:'r1',rally_no:'1',rally_sequence:'1',action:'Annahme'},
 {id:'b',rally_id:'r1',rally_no:'1',rally_sequence:'2',action:'Zuspiel'},
 {id:'c',rally_id:'r1',rally_no:'1',rally_sequence:'3',event_type:'rally_result',action:'Punkt wir'}
];
const before=insertActionBeforeEvent(beforeRows,'b',{id:'y',action:'Block'});
assert.deepEqual(before.map(e=>e.id),['a','y','b','c']);
assert.equal(before[1].rally_id,'r1');assert.equal(before[1].rally_sequence,'2');assert.equal(before[2].rally_sequence,'3');assert.equal(before[3].rally_sequence,'4');
console.log('timestamp editor checks: OK');
