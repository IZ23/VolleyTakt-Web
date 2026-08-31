import assert from 'node:assert/strict';import fs from 'node:fs';
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(app,/\.\/analysis\/domain\.js/);assert.match(app,/\.\/analysis\/ui\.js/);
assert.doesNotMatch(app,/function analysisActionName/);assert.doesNotMatch(app,/function analysisRallyMap/);
assert.match(app,/0\.4\.0 RC1/);assert.match(app,/0\.4\.0-rc1/);
assert.match(sw,/analysis\/domain\.js/);assert.match(sw,/analysis\/ui\.js/);assert.match(sw,/0\.4\.0-rc1/);assert.match(index,/0\.4\.0 RC1/);
console.log('preview040p9-integration-test: ok');
