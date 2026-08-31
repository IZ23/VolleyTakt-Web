import fs from 'node:fs';
const css=fs.readFileSync('styles.css','utf8');
const app=fs.readFileSync('js/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
function ok(c,m){if(!c)throw new Error(m)}
ok(html.includes('0.4.0 RC2'),'visible fix2 version missing');
ok(css.includes('.start-card{max-height:calc(100dvh'),'start gate max-height missing');
ok(css.includes('overflow:auto'),'scrollable start gate missing');
ok(app.includes("const activeCaptureSide=side,otherSide=activeCaptureSide==='own'?'opponent':'own'"),'active-side orientation mapping missing');
ok(app.includes("side==='own'&&pos===1&&state.servingSide==='us'"),'own serve ball invariant missing');
ok(css.includes('.court-wrap.dual-court .court.nine-zone{grid-template-rows:repeat(3,minmax(0,1fr))!important}'),'equal nine-zone rows missing');
console.log('preview032p2r7 rebuild3 fix2 layout test: OK');
