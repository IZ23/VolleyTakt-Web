import fs from 'node:fs';
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const scouting=fs.readFileSync(new URL('../js/scouting/scouting.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const need=(v,m)=>{if(!v)throw new Error(m)};
need(app.includes("APP_VERSION='0.4.0 RC3'"),'version');
need(html.includes('0.4.0 RC3'),'visible version');
need(sw.includes('volleytakt-live-web-v0.4.0-rc3'),'cache version');
for(const n of ['aufschlag','zuspiel','angriff','annahme','abwehr','block']){need(app.includes(`./app-icons/techniques/${n}.png`),`${n} PNG mapping`);need(fs.existsSync(new URL(`../app-icons/techniques/${n}.png`,import.meta.url)),`${n} PNG missing`)}
need(css.includes('flex-direction:row!important'),'horizontal icon label layout');
need(css.includes('minmax(330px,30%)'),'desktop control minimum width');
need(app.includes('function opponentServeDirectReady()')&&scouting.includes('function opponentServeDirectReady()'),'direct opponent serve helper');
need(scouting.includes("state.pendingAction==='Aufschlag'&&['=','#'].includes(quality)"),'serve terminal result immediate logic');
need(app.includes('await handleCompletedScoutingAction(result.draft)')&&scouting.includes('allowServeErrorWithoutZone:true'),'serve error ActionDraft handoff');
console.log('preview2-r7 rebuild3 regression: OK');
