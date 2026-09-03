import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createDefaultState,normalizeLoadedState} from '../js/app/state.js';
import {createRallyController} from '../js/scouting/rally.js';
import {reconstructMatchState} from '../js/scouting/history.js';

const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');

// FE-UI10: semantic suppression only for quick scout in compact coarse-pointer landscape.
assert.match(app,/quick-default-abbr/);
assert.match(app,/quick-redundant-playerline/);
assert.match(css,/@media \(orientation:landscape\) and \(max-height:900px\) and \(pointer:coarse\)/);
assert.match(css,/\.court\.quick-scout-court \.pos-playerline\.quick-redundant-playerline\{display:none!important\}/);
assert.match(css,/\.court\.quick-scout-court \.quick-default-abbr/);
assert.match(css,/\.court\.quick-scout-court \.pos-name\{display:none!important\}/);
// Position arrays remain canonical and unchanged.
assert.match(app,/OWN_COURT_ZONES=\[4,3,2,7,8,9,5,6,1\]/);
assert.match(app,/OPP_COURT_ZONES=\[1,6,5,9,8,7,2,3,4\]/);

// FE-SCOUT7: persisted high-water survives normalization and a new branch never goes backwards.
const loaded=normalizeLoadedState({rallyCounter:'3',rallyHighWater:'7'},createDefaultState('2026-08-31'));
assert.equal(loaded.rallyCounter,3);
assert.equal(loaded.rallyHighWater,7);
const rally=createRallyController({getState:()=>loaded,newId:()=> 'r8'});
assert.equal(rally.ensureActiveRally().rally_no,'8');
assert.equal(loaded.rallyHighWater,8);

const rebuilt=reconstructMatchState([{event_type:'action',action:'Annahme',rally_id:'r4',rally_no:'4',rally_sequence:'1'}],{rallyCounter:4,rallyHighWater:8,isTechniqueEvent:r=>r.action==='Annahme'});
assert.equal(rebuilt.rallyCounter,4);
assert.equal(rebuilt.rallyHighWater,8);

console.log('RC3 FE-UI10 / FE-SCOUT7 regression test ok');
