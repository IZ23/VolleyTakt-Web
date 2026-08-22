import fs from 'node:fs';
const app=fs.readFileSync(new URL('../js/app.js', import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css', import.meta.url),'utf8');
const checks=[
 ['opponent mirrored', app.includes('OPP_COURT_ZONES=[1,6,5,9,8,7,2,3,4]')],
 ['own zones', app.includes('OWN_COURT_ZONES=[4,3,2,7,8,9,5,6,1]')],
 ['fixed orientation', app.includes("drawCourtInto(primary,'opponent'") && app.includes("drawCourtInto(secondary,'own'")],
 ['single shared net', app.includes("const sharedNet=$('#sharedNet')") && css.includes('.shared-net') && css.includes('.court-wrap.dual-court .court>.net{display:none!important}')],
 ['middle zones locked before WER', app.includes('const zoneAllowed=playerPos||state.selectedPlayerPos||target')],
 ['split base highlight', css.includes('.base-half-near-net') && css.includes('.base-half-near-back')],
 ['no permanent grey half overlay', css.includes('.pos.zone-only{background:rgba(248,250,252,.92)!important}') && css.includes('.pos.zone-only::before,.pos.zone-only::after{opacity:0;background:transparent}')]
];
for(const [name,ok] of checks){if(!ok)throw new Error(`Preview 9 court orientation failed: ${name}`)}
console.log(`Preview 9 court orientation: OK (${checks.length}/${checks.length})`);
