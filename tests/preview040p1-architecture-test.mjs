import fs from 'node:fs';
import {createDefaultState,normalizeLoadedState,cleanStateForStorage,cleanStateForSnapshot} from '../js/app/state.js';
import {findPlayer,findTeam,findSeason,findMatchType,matchTypeKey} from '../js/app/selectors.js';
import {COMMANDS} from '../js/app/commands.js';
const need=(v,m)=>{if(!v)throw new Error(m)};
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const storage=fs.readFileSync(new URL('../js/storage.js',import.meta.url),'utf8');

need(app.includes("APP_VERSION='0.4.0 RC4'"),'Preview1 app version missing');
need(html.includes('VolleyTakt Live 0.4.0 RC4'),'Preview1 visible version missing');
need(sw.includes("volleytakt-live-web-v0.4.0-rc4"),'Preview1 cache missing');
for(const file of ['./js/app/state.js','./js/app/selectors.js','./js/app/persistence.js','./js/app/commands.js']) need(sw.includes(file),`SW missing ${file}`);
need(storage.includes('CURRENT_DATA_SCHEMA=5'),'Preview1 must keep schema 5');

const d=createDefaultState('2026-08-27');
for(const key of ['matchId','setNo','scoreUs','scoreThem','selectedPlayerId','pendingAction','pendingQuality','actionZone','targetZone','currentRallyId','currentRallyNo','currentTransitionNo','ownLineup','oppLineup','videoClipId','cameraRecording','fieldOrientation','activeTeamContext']) need(Object.hasOwn(d,key),`default state missing ${key}`);
need(d.matchDate==='2026-08-27','default date injection failed');
const n=normalizeLoadedState({setWinsUs:'2',fixedSetCount:9,inputStep:'INVALID',currentLiberosOwn:['a','b'],videoAssignments:null},d);
need(n.setWinsUs===2,'set wins normalization');
need(n.fixedSetCount===5,'set count normalization');
need(n.inputStep==='WER','inputStep normalization');
need(n.currentLiberosOwn.length===2&&n.currentLiberosOwn[0]==='a'&&n.currentLiberosOwn[1]==='b','libero normalization');
need(Array.isArray(n.videoAssignments),'videoAssignments normalization');

const source={...d,selectedPos:4,pendingAction:'Angriff',cameraRecording:true,actionZone:8,targetZone:1};
const stored=cleanStateForStorage(source);
need(stored.selectedPos===0&&stored.pendingAction===null&&stored.actionZone===0&&stored.targetZone===0,'storage transient cleanup');
need(stored.cameraRecording===true,'storage compatibility: cameraRecording must remain as in fix2 persist()');
const snap=cleanStateForSnapshot(source);
need(snap.cameraRecording===false,'archive snapshot must clear cameraRecording like fix2');

const master={players:[{id:'p1'}],teams:[{id:'t1'}],seasons:[{id:'s1'}],matchTypes:[{id:'m1'}]};
need(findPlayer(master,{quickPlayers:{}},'p1')?.id==='p1','player selector');
need(findPlayer(master,{quickPlayers:{q:{id:'q'}}},'q')?.id==='q','quick player selector');
need(findTeam(master,'t1')?.id==='t1','team selector');
need(findSeason(master,'s1')?.id==='s1','season selector');
need(findMatchType(master,'m1')?.id==='m1','match type selector');
need(matchTypeKey('  Test  Spiel ')==='test spiel','match type key');
for(const c of ['SELECT_POSITION','SELECT_ACTION','SELECT_QUALITY','SELECT_ORIGIN_ZONE','SELECT_TARGET_ZONE','AWARD_POINT_US','AWARD_POINT_THEM','ROTATE','UNDO','CANCEL']) need(COMMANDS[c]===c,`command missing ${c}`);
console.log('0.4.0 RC4 architecture/state regression: OK');
