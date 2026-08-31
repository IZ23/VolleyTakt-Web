import assert from 'node:assert/strict';
import fs from 'node:fs';
import {undoEventBatch,restoreEventBatch} from '../js/scouting/history.js';
const tx='tx_x',source=[{id:'a',transaction_id:tx},{id:'b',transaction_id:tx}];const u=undoEventBatch(source);assert.equal(u.events.length,0);assert.deepEqual(restoreEventBatch(u.events,u.removed).map(x=>x.id),['a','b']);
const cam=fs.readFileSync(new URL('../js/camera/service.js',import.meta.url),'utf8');assert.doesNotMatch(cam,/^import \{DjiOsmoBle\}/m);assert.doesNotMatch(cam,/^import \{GoProBle\}/m);assert.match(cam,/await import\('\.\.\/dji-ble\.js'\)/);assert.match(cam,/await import\('\.\.\/gopro-ble\.js'\)/);
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');assert.match(app,/redoStack/);assert.match(app,/async function redo\(/);assert.match(html,/id="redoBtn"/);assert.match(css,/quality controls and legend are independent flow blocks/);
console.log('Preview12 redo/camera/ui tests passed');
