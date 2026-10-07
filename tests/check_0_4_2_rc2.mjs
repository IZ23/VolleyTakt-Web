import assert from 'node:assert/strict';
import {buildActionSelection,youtubeVideoId,eventsForAnalysisView} from '../js/analysis/action-video.js';
import {buildPlayerReport,PLAYER_REPORT_GLOSSARY} from '../js/analysis/player-report.js';
const match={matchId:'m1',matchDate:'2026-09-01',ownTeamName:'Wir',oppTeamName:'Sie',videos:[{id:'v1',storageType:'youtube',reference:'https://youtu.be/dQw4w9WgXcQ',scoutingSyncSeconds:0,videoSyncSeconds:100,label:'Spielvideo'}]};
const events=[
 {_match:match,event_id:'e1',player_id:'p1',player_name:'Anna',action:'Angriff',value:'#',set:1,rotation:'R4',player_rotation_position:4,action_zone:4,target_zone:1,action_start_seconds:20,action_end_seconds:24,video_clip_id:'v1'},
 {_match:match,event_id:'e2',player_id:'p1',player_name:'Anna',action:'Angriff',value:'=',set:1,rotation:'R4',player_rotation_position:4,action_zone:4,target_zone:6,action_start_seconds:40,action_end_seconds:43,video_clip_id:'v1'},
 {_match:match,event_id:'e3',player_id:'p1',player_name:'Anna',action:'Annahme',value:'+',set:1,rotation:'R4',player_rotation_position:4,action_start_seconds:60,action_end_seconds:62,video_clip_id:'v1'}
];
assert.equal(youtubeVideoId(match.videos[0].reference),'dQw4w9WgXcQ');
const attacks=eventsForAnalysisView('attacks',events);assert.equal(attacks.length,2);
const sel=buildActionSelection(attacks);assert.equal(sel.clips.length,2);assert.equal(sel.groups.success.length,1);assert.equal(sel.groups.error.length,1);assert.equal(sel.clips[0].start,118.5);assert.equal(sel.clips[0].end,125.5);assert.equal(sel.clips[0].playable,true);
const report=buildPlayerReport({player:{id:'p1',firstName:'Anna',lastName:'Test'},events,matches:[match],filters:{From:'2026-09-01',To:'2026-09-01'},matchNames:()=> 'Wir – Sie'});
assert.equal(report.playerName,'Anna Test');assert.equal(report.summary.actions,3);assert.equal(report.techniques.find(x=>x.action==='Angriff').n,2);assert.equal(report.summary.neutral,0);assert.equal(report.summary.unrated,0);assert.ok(PLAYER_REPORT_GLOSSARY.length>=11);assert.match(report.note,/Einzelaktionsqualität und Rally-Ergebnis/);
const malouEvents=[
 ...Array.from({length:4},(_,i)=>({_match:match,event_id:`l${i}`,player_id:'p2',action:'Libero',value:'0',quality_level:3,rotation:'R1'})),
 ...Array.from({length:4},(_,i)=>({_match:match,event_id:`a0${i}`,player_id:'p2',action:'Annahme',value:'0',quality_level:3,rotation:'R4'})),
 {_match:match,event_id:'ap',player_id:'p2',action:'Annahme',value:'+',quality_level:4,rotation:'R4'},
 ...Array.from({length:6},(_,i)=>({_match:match,event_id:`an${i}`,player_id:'p2',action:'Annahme',value:'-',quality_level:1,rotation:'R4'})),
 {_match:match,event_id:'d1',player_id:'p2',action:'Abwehr',value:'+',quality_level:4,rotation:'R6'},
 {_match:match,event_id:'d2',player_id:'p2',action:'Abwehr',value:'0',quality_level:3,rotation:'R6'},
 {_match:match,event_id:'at1',player_id:'p2',action:'Angriff',value:'',rotation:'R6'}
];
const malou=buildPlayerReport({player:{id:'p2',firstName:'Malou',lastName:'Test'},events:malouEvents,matches:[match],matchNames:()=> 'Wir – Sie'});
const libero=malou.techniques.find(x=>x.action==='Libero');assert.equal(libero.n,4);assert.equal(libero.neutral,4);assert.equal(libero.positive,0);assert.equal(libero.negative,0);assert.match(libero.distribution,/0: 4/);assert.equal(malou.summary.unrated,1);assert.ok(!malou.strengths.some(x=>/Libero/.test(x.title)));assert.equal(malou.summary.positive+malou.summary.neutral+malou.summary.negative+malou.summary.unrated,malou.summary.actions);
console.log('0.4.2 RC2 action/video and personal player report checks passed.');
