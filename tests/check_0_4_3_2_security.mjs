import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeImportedEvent,normalizeZone,normalizeRotation} from '../js/data/import-sanitize.js';
import {zoneLabel,playerLabel} from '../js/analysis/domain.js';
import {youtubeVideoId} from '../js/analysis/action-video.js';
import {normalizeWorkerBaseUrl} from '../js/video/worker-client.js';

const payload='<img src=x onerror=alert(document.domain)>';
const e=normalizeImportedEvent({target_zone:payload,action_zone:'9',rotation:'R6',player_abbreviation:payload});
assert.equal(e.target_zone,'');
assert.equal(e.action_zone,'9');
assert.equal(e.rotation,'R6');
assert.equal(normalizeZone('P7'),'7');
assert.equal(normalizeZone('10'),'');
assert.equal(normalizeRotation('2'),'R2');
assert.equal(normalizeRotation('R7'),'');
assert.equal(zoneLabel(payload),'–');
assert.equal(zoneLabel('9'),'P9');
assert.equal(playerLabel({player_abbreviation:payload}),payload);

const ui=fs.readFileSync(new URL('../js/analysis/ui.js',import.meta.url),'utf8');
assert.match(ui,/escHtml\(r\?\.\[labelKey\]/);
assert.match(ui,/analysis-card-popover[^`]*\$\{escHtml\(help\)\}/);
assert(!ui.includes('<span>${r?.[labelKey]??'));

assert.equal(youtubeVideoId('https://www.youtube.com/watch?v=abcdefghijk'),'abcdefghijk');
assert.equal(youtubeVideoId('https://youtube.com.evil.test/watch?v=abcdefghijk'),'');
assert.equal(youtubeVideoId('https://notyoutube.com/watch?v=abcdefghijk'),'');
assert.equal(normalizeWorkerBaseUrl('worker.example.test'),'https://worker.example.test');
assert.equal(normalizeWorkerBaseUrl('http://worker.example.test'),'');
assert.equal(normalizeWorkerBaseUrl('http://127.0.0.1:8080'),'http://127.0.0.1:8080');

const ht=fs.readFileSync(new URL('../.htaccess',import.meta.url),'utf8');
for(const header of ['Content-Security-Policy','Strict-Transport-Security','Permissions-Policy'])assert(ht.includes(header));
console.log('0.4.3.2 security JS/static checks passed.');
