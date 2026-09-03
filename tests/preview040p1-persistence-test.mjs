import {createDefaultState} from '../js/app/state.js';
import {createPersistenceController} from '../js/app/persistence.js';
const need=(v,m)=>{if(!v)throw new Error(m)};
const state={...createDefaultState('2026-08-27'),matchId:'match-1',pendingAction:'Angriff',selectedPos:4,cameraRecording:true,videoAssignments:[{id:'v1'}]};
const master={players:[]}; const events=[{rally_id:'r1',player_id:'p1',action:'Angriff'}];
let savedMaster,savedState,savedEvents,archive,syncCount=0;
const ctl=createPersistenceController({
 getMaster:()=>master,getState:()=>state,getEvents:()=>events,
 getDisplayMeta:()=>({matchDate:'2026-08-27',ownTeamName:'Wir',oppTeamName:'Gegner'}),
 saveMaster:v=>savedMaster=v,saveState:v=>savedState=v,saveEvents:v=>savedEvents=v,
 upsertMatchArchive:v=>archive=v,scheduleSync:()=>syncCount++
});
ctl.persist();
need(savedMaster===master,'master delegation');
need(savedEvents===events,'events delegation');
need(savedState.pendingAction===null&&savedState.selectedPos===0,'persist state cleanup');
need(savedState.cameraRecording===true,'persist must preserve fix2 cameraRecording behavior');
need(archive.matchId==='match-1'&&archive.schema===2,'archive schema/match');
need(archive.fullState.pendingAction===null,'archive transient cleanup');
need(archive.fullState.cameraRecording===false,'archive camera cleanup');
need(archive.events.length===1&&archive.events[0].rally_id==='r1','archive event preservation');
need(archive.videos.length===1,'archive video preservation');
need(syncCount===1,'sync scheduling delegation');
console.log('0.4.0 RC3 persistence regression: OK');
