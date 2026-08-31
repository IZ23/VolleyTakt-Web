import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createScoutingController} from '../js/scouting/scouting.js';
import {createDefaultState} from '../js/app/state.js';
import {createRallyController} from '../js/scouting/rally.js';

function controllerFor(state){
  return createScoutingController({
    getState:()=>state,
    getLineup:()=>state.ownLineup,
    getQualityProfileForSide:()=> 'basic_5',
    getCurrentSeconds:()=>1,
    getNow:()=> 'now',
    isScoutingReady:()=>true
  });
}

// Real capture path: previous WOHIN P8 -> next WER -> WAS -> WIE -> WO prefilled P8,
// but confirmation is still mandatory before the workflow advances to WOHIN.
const state=createDefaultState('2026-08-29');
state.setReady=true;state.servingSide='them';state.activeTeamContext='own';
state.ownLineup={1:'p1',2:'p2',3:'p3',4:'p4',5:'p5',6:'p6'};
state.currentRallyId='r1';state.currentRallyNo=1;state.rallyBallZone=8;state.rallyBallSide='own';
const c=controllerFor(state);
assert.equal(c.selectWhoPosition('own',5).ok,true);
assert.equal(c.chooseAction('Zuspiel').ok,true);
const q=c.chooseQuality('+');
assert.equal(q.inheritedOrigin,true);
assert.equal(q.pos,8);
assert.equal(q.nextStep,'WO');
assert.equal(state.inputStep,'WO');
assert.equal(state.actionZone,8);
assert.equal(state.targetZone,0);
// WO can be confirmed as preselected.
const confirm=c.selectOriginZone('own',8);
assert.equal(confirm.nextStep,'TARGET');
assert.equal(state.actionZone,8);
// Or overwritten before confirmation.
state.inputStep='WO';state.actionZone=8;state.targetZone=0;
const overwrite=c.selectOriginZone('own',7);
assert.equal(overwrite.nextStep,'TARGET');
assert.equal(state.actionZone,7);

// Manual/normal rally close clears inherited position.
const rally=createRallyController({getState:()=>state,newId:p=>p+'-1'});
state.rallyBallZone=9;state.rallyBallSide='own';
rally.closeActiveRally();
assert.equal(state.rallyBallZone,0);assert.equal(state.rallyBallSide,'');

const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const idx=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const manifest=fs.readFileSync(new URL('../manifest.webmanifest',import.meta.url),'utf8');
const update=fs.readFileSync(new URL('../update-manifest.json',import.meta.url),'utf8');

// FE-UI7: half-zone WHO hints must never be applied to target courts.
assert.match(app,/if\(!target&&!playerPos&&pair\.length&&state\.selectedPlayerPos\)/);
assert.match(css,/target-court \.pos\.base-half-near-net/);
// Quality controls and legend remain separate flow blocks.
assert.match(idx,/id="qualityButtons"[\s\S]*id="qualityMeaning"/);
assert.match(css,/0\.4\.0 RC2 — scouting-state clarity and quality layout regression guard/);
// Libero remains dedicated and supports two liberos / direct swap.
assert.match(app,/beginPlayerChange\(kind\)/);
assert.match(app,/mode\.kind==='libero'/);
assert.match(app,/outLib&&inLib/);
assert.match(app,/preferredLibero/);
assert.match(app,/quickLiberoId\('own',2\)/);
// Active version surfaces are P17.
for(const text of [app,idx,sw,manifest,update]){
  assert.doesNotMatch(text,/0\.4\.0 Preview(?:[1-9]|1[0-6])\b/);
  assert.doesNotMatch(text,/0\.4\.0-preview(?:[1-9]|1[0-6])\b/);
}
assert.match(app,/APP_VERSION='0\.4\.0 RC2'/);
assert.match(sw,/0\.4\.0-rc2/);
console.log('rc2-compatible scouting stability regression: OK');
