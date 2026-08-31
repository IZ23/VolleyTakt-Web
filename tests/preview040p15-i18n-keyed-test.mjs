import assert from 'node:assert/strict';
// Minimal DOM stubs so i18n can be imported in Node.
globalThis.document={documentElement:{lang:'de'},createTreeWalker(){return {nextNode(){return null}}}};globalThis.Node={TEXT_NODE:3,ELEMENT_NODE:1};globalThis.NodeFilter={SHOW_TEXT:4,SHOW_ELEMENT:1};globalThis.Element=class{};globalThis.localStorage={setItem(){}};globalThis.window={dispatchEvent(){},CustomEvent:class{},alert(){},confirm(){return true},prompt(){return ''}};globalThis.CustomEvent=class{};globalThis.MutationObserver=class{observe(){}};
const {tr,t}=await import('../js/i18n.js');
assert.equal(t('libero.select_backrow',{},'en'),'Libero replacement: select P1, P6 or P5.');
assert.equal(tr('Wird nur angezeigt, weil…','en'),'Only shown because…');
assert.equal(tr('Weitere Dateien oder Perspektiven…','en'),'Additional files or perspectives…');
assert.equal(tr('bleibt Grundlage für Undo…','en'),'remains the basis for Undo…');
assert.equal(tr('Saisonkader übernehmen','en'),'Apply season roster');
assert.equal(tr('Nicht verfügbar / Bluetooth aus','en'),'Unavailable / Bluetooth off');
assert.equal(tr('Wird absichtlich nicht fragmentweise übersetzt','en'),'Wird absichtlich nicht fragmentweise übersetzt');
const source=await (await import('node:fs/promises')).readFile(new URL('../js/i18n.js',import.meta.url),'utf8');assert.doesNotMatch(source,/FRAGMENTS_EN|sortedFragments|\.includes\(de\)/);console.log('preview15 keyed i18n ok');
