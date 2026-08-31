import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createScoutingController} from '../js/scouting/scouting.js';
import {createDefaultState,normalizeLoadedState} from '../js/app/state.js';
import {createRallyController} from '../js/scouting/rally.js';
import {t} from '../js/i18n.js';

const state=createDefaultState('2026-08-29');
state.setReady=true;state.servingSide='them';state.activeTeamContext='own';state.ownLineup={1:'p1',2:'p2',3:'p3',4:'p4',5:'p5',6:'p6'};state.rallyBallZone=8;state.rallyBallSide='own';
const c=createScoutingController({getState:()=>state,getLineup:()=>state.ownLineup,getQualityProfileForSide:()=> 'basic_5',getCurrentSeconds:()=>1,getNow:()=> 'now',isScoutingReady:()=>true});
assert.equal(c.selectWhoPosition('own',3).ok,true);
assert.equal(c.chooseAction('Zuspiel').ok,true);
const q=c.chooseQuality('+');assert.equal(q.inheritedOrigin,true);assert.equal(q.pos,8);assert.equal(q.nextStep,'WO');assert.equal(state.actionZone,8);

const rally=createRallyController({getState:()=>state,newId:p=>p+'-1'});state.currentRallyId='r1';state.currentRallyNo=1;state.rallyBallZone=8;state.rallyBallSide='own';rally.closeActiveRally();assert.equal(state.rallyBallZone,0);assert.equal(state.rallyBallSide,'');

const loaded=normalizeLoadedState({...createDefaultState(),currentLiberosOwn:['l1','l2'],currentLiberosOpp:['x1','x2']});assert.deepEqual(loaded.currentLiberosOwn,['l1','l2']);assert.deepEqual(loaded.currentLiberosOpp,['x1','x2']);
assert.match(t('scouting.status.origin_inherited_target',{zone:'P8'},'de'),/P8/);

const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const idx=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const manifest=fs.readFileSync(new URL('../manifest.webmanifest',import.meta.url),'utf8');
const update=fs.readFileSync(new URL('../update-manifest.json',import.meta.url),'utf8');
for(const text of [app,idx,sw,manifest,update]){assert.doesNotMatch(text,/0\.4\.0 Preview(?:[1-9]|1[0-5])\b/);assert.doesNotMatch(text,/0\.4\.0-preview(?:[1-9]|1[0-5])\b/)}
assert.match(app,/APP_VERSION='0\.4\.0 RC1'/);assert.match(sw,/0\.4\.0-rc1/);assert.doesNotMatch(app,/preview-pill\">0\.3 Preview/);
console.log('rc1-compatible ball-chain/libero/version regression: OK');
