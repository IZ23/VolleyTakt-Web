import assert from 'node:assert/strict';import fs from 'node:fs';
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const idx=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(app,/from '\.\/scouting\/match-flow\.js'/);assert.match(app,/rotationTransition\(/);assert.match(app,/nextSetTransition\(/);assert.match(app,/setLineupTransition\(/);assert.match(app,/0\.4\.0 RC3/);assert.match(sw,/scouting\/match-flow\.js/);assert.match(sw,/0\.4\.0-rc3/);assert.match(idx,/0\.4\.0 RC3/);
console.log('preview040p6 integration tests passed');
