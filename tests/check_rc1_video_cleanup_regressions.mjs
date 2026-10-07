import assert from 'node:assert/strict';
import {buildActionSelection,actionSelectionHtml} from '../js/analysis/action-video.js';

const match={matchId:'match_test',matchDate:'2026-08-15',ownTeamName:'A',oppTeamName:'B',videos:[{storageType:'youtube',reference:'https://youtu.be/abcdefghijk',videoSyncSeconds:0,scoutingSyncSeconds:0}]};
const base={_match:match,action:'Aufschlag',value:'0',player_name:'Mona Janke',set:1,rotation:'R1',player_rotation_position:1};
const events=[
 {...base,id:'a',action_start_seconds:'',seconds:'23.000',action_end_seconds:'27.000'},
 {...base,id:'b',action_start_seconds:null,seconds:'30.000',action_end_seconds:'34.000'},
 {...base,id:'c',action_start_seconds:'46.000',seconds:'0.000',action_end_seconds:'50.000'},
 {...base,id:'d',action_start_seconds:'',seconds:'',action_end_seconds:''},
];
const selection=buildActionSelection(events,{preRoll:0,postRoll:0});
assert.equal(selection.clips.length,4);
assert.deepEqual(selection.clips.slice(0,3).map(c=>c.scoutingStart),[23,30,46]);
assert.deepEqual(selection.clips.slice(0,3).map(c=>c.start),[23,30,46]);
assert.equal(selection.clips[3].hasTimestamp,false);
assert.equal(selection.clips[3].playable,false);
const html=actionSelectionHtml(selection);
assert.match(html,/Aufschlag <span[^>]*>Qualität 0<\/span>/);
assert.match(html,/kein Aktions-Timestamp/);
console.log('RC1 ANALYSIS-VIDEO2 regression checks passed.');
