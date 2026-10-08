import fs from 'node:fs';
function ok(cond,msg){if(!cond){console.error('FAIL:',msg);process.exit(1)}}
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const runtime=fs.readFileSync(new URL('../js/locales/domains/runtime.js',import.meta.url),'utf8');
const block=app.slice(app.indexOf('function cameraInstructionText'), app.indexOf('function syncCameraTelemetry'));
for (const raw of ['Nicht verbunden','Verbunden','Akku','Qualität*','Kamera verbinden','Trennen','DJI Osmo Action einschalten','Qualitätsanzeige aus Statusalter','Ausgewähltes Gerät','Kamera-Service','Letzter Fehler','Diagnose aktualisieren']) {
  ok(!block.includes(`>${raw}<`) && !block.includes(`'${raw}'`) && !block.includes(`\"${raw}\"`), `camera drawer must not hard-code ${raw}`);
}
for (const key of ['camera.panel.camera','camera.panel.status','camera.panel.battery','camera.panel.quality','camera.panel.connected','camera.panel.disconnected','camera.panel.connect','camera.panel.disconnect','camera.panel.instructionDji','camera.panel.instructionGoPro','camera.panel.qualityNote','camera.panel.selectedDevice','camera.panel.cameraService','camera.panel.lastError','camera.panel.refreshDiagnostics']) {
  ok(block.includes(`t('${key}')`) || block.includes(`?'${key}'`) || runtime.includes(`'${key}'`), `missing use/key ${key}`);
  const count=(runtime.match(new RegExp("'"+key.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+"'",'g'))||[]).length;
  ok(count===2, `${key} must exist once in DE and once in EN (found ${count})`);
}
ok(block.includes('quality=t(q.labelKey)'), 'drawer quality must use localized labelKey');
console.log('0.4.3.3 camera i18n checks passed.');
