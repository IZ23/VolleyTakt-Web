import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createDefaultState} from '../js/app/state.js';
import {createScoutingController} from '../js/scouting/scouting.js';

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

// FE-SCOUT5: last known WOHIN/current ball zone becomes a visible but unconfirmed WO preselection.
const state=createDefaultState('2026-08-29');
state.setReady=true;state.activeTeamContext='own';state.servingSide='them';
state.ownLineup={1:'p1',2:'p2',3:'p3',4:'p4',5:'p5',6:'p6'};
state.currentRallyId='r1';state.currentRallyNo=1;state.rallyBallZone=9;state.rallyBallSide='own';
const c=controllerFor(state);
assert.equal(c.selectWhoPosition('own',5).nextStep,'WAS');
assert.equal(c.chooseAction('Zuspiel').nextStep,'WIE');
const quality=c.chooseQuality('+');
assert.equal(quality.inheritedOrigin,true);
assert.equal(quality.nextStep,'WO');
assert.equal(state.actionZone,9);
assert.equal(state.inputStep,'WO');
assert.equal(state.targetZone,0);
// explicit confirmation still required
const confirm=c.selectOriginZone('own',9);
assert.equal(confirm.nextStep,'TARGET');

const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const idx=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');

// Reception completion keeps its recorded zone as known ball position when no separate target exists.
assert.match(app,/knownBallZone=\+draft\.targetZone\|\|\(\(action==='Annahme'\)\?\+draft\.originZone:0\)/);
// FE-UI8 / FE-SCOUT6: Libero enters a dedicated WER mode and the button is visibly active.
assert.match(app,/state\.inputStep='WER';playerChangeMode=\{kind,side\};render\(\)/);
assert.match(app,/liberoBtn\.classList\.toggle\('selected',playerChangeMode\?\.kind==='libero'\)/);
assert.match(app,/WER · Libero/);
assert.match(app,/playerChangeMode\.kind==='libero'&&!\[1,5,6\]\.includes\(\+pos\)/);
assert.match(css,/player-change-controls button\.selected/);
// Modal remains after WER/position selection, not before.
assert.match(app,/function choosePlayerChangePosition\(side,pos\)[\s\S]*modal\(`/);

for(const text of [app,idx,sw]){
  assert.doesNotMatch(text,/0\.4\.0 Preview17\b/);
  assert.doesNotMatch(text,/0\.4\.0-preview17\b/);
}
assert.match(app,/APP_VERSION='0\.4\.0 RC2'/);
assert.match(sw,/0\.4\.0-rc2/);
console.log('rc2 libero / ball-chain / UI regression: OK');
