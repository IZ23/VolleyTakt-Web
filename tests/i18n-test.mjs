import assert from 'node:assert/strict';
import {LEGACY_KEY_BY_DE} from '../js/locales/legacy-messages.js';
import {MESSAGES_DE,MESSAGES_EN} from '../js/locales/messages.js';
assert.ok(Object.keys(LEGACY_KEY_BY_DE).length>=400,'legacy catalogue must be key-migrated');
for(const [de,key] of Object.entries(LEGACY_KEY_BY_DE)){
  assert.equal(MESSAGES_DE[key],de,`German keyed message missing: ${key}`);
  assert.ok(MESSAGES_EN[key],`English keyed message missing: ${key}`);
}
for(const bad of ['Usd nur angezeigt','Nexte Dateien','Reasonlage','Seasonkader übernehmen']){
  assert.ok(!Object.values(MESSAGES_EN).some(v=>String(v).includes(bad)),`corrupted translation remains: ${bad}`);
}
console.log('i18n keyed catalogue test ok');
