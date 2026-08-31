import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRallyController} from '../js/scouting/rally.js';
import {reconstructMatchState} from '../js/scouting/history.js';
import {LEGACY_KEY_BY_DE} from '../js/locales/legacy-messages.js';
import {MESSAGES_DE,MESSAGES_EN} from '../js/locales/messages.js';

// FE-SCOUT7: high-water rally numbering must never go backwards after undo/new branch.
const state={currentRallyId:'',currentRallyNo:0,currentRallySeq:0,rallyCounter:3,rallyHighWater:5,servingSide:'us'};
const rally=createRallyController({getState:()=>state,newId:()=> 'rally_new'});
const meta=rally.ensureActiveRally();
assert.equal(meta.rally_no,'6');
assert.equal(state.rallyCounter,6);
assert.equal(state.rallyHighWater,6);

const rebuilt=reconstructMatchState([
  {event_type:'set_start',action:'Satzstart',set:'1',own_lineup:'{}',opp_lineup:'{}'},
  {event_type:'action',action:'Annahme',rally_id:'r4',rally_no:'4',rally_sequence:'1'}
],{rallyCounter:4,rallyHighWater:6,isTechniqueEvent:r=>r.action==='Annahme'});
assert.equal(rebuilt.rallyHighWater,6);
assert.equal(rebuilt.rallyCounter,4);

// Scouting9: library removal exists, distinguishes local/sync, and explicitly leaves video files untouched.
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const storage=fs.readFileSync(new URL('../js/storage.js',import.meta.url),'utf8');
const sync=fs.readFileSync(new URL('../js/sync.js',import.meta.url),'utf8');
assert.match(app,/data-lib-action="remove"/);
assert.match(app,/library\.remove_local/);
assert.match(app,/library\.remove_sync/);
assert.match(app,/library\.remove_video_safe/);
assert.match(storage,/export function removeMatchArchive/);
assert.match(sync,/export async function removeCloudMatchFromLibrary/);
assert.match(sync,/deleted:true/);
assert.match(sync,/filter\(x=>!x\?\.deleted\)/);
const removeFn=sync.slice(sync.indexOf('export async function removeCloudMatchFromLibrary'),sync.indexOf('export async function fetchCloudMatch',sync.indexOf('export async function removeCloudMatchFromLibrary'))>0?sync.indexOf('export async function fetchCloudMatch',sync.indexOf('export async function removeCloudMatchFromLibrary')):sync.length);
assert.doesNotMatch(removeFn,/\bDELETE\b/i);

// I18N3: the full legacy exact catalogue is routed through keys; old exact source is gone.
assert.ok(Object.keys(LEGACY_KEY_BY_DE).length>=400);
for(const [de,key] of Object.entries(LEGACY_KEY_BY_DE)){
  assert.equal(MESSAGES_DE[key],de);
  assert.ok(MESSAGES_EN[key]);
}
assert.equal(fs.existsSync(new URL('../js/locales/en.js',import.meta.url)),false);
const i18n=fs.readFileSync(new URL('../js/i18n.js',import.meta.url),'utf8');
assert.doesNotMatch(i18n,/EXACT_EN/);
assert.match(i18n,/LEGACY_KEY_BY_DE/);
console.log('RC2 rally/library/i18n regression test ok');
