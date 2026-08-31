import assert from 'node:assert/strict';import fs from 'node:fs';
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const idx=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(app,/from '\.\/scouting\/history\.js'/);
assert.match(app,/reconstructMatchState\(/);assert.match(app,/undoEventBatch\(/);
assert.doesNotMatch(app,/function safeLineupJson\(/);
assert.match(app,/0\.4\.0 RC1/);assert.match(app,/serviceWorker\.register\('\.\/sw\.js\?v=0\.4\.0-rc1'/);assert.match(sw,/scouting\/history\.js/);assert.match(sw,/0\.4\.0-rc1/);assert.match(idx,/0\.4\.0 RC1/);
console.log('preview040p7 integration tests passed');
