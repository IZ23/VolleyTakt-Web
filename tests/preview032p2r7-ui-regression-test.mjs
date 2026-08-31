import fs from 'node:fs';
const app=fs.readFileSync('js/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('styles.css','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const need=(v,m)=>{if(!v)throw new Error(m)};
need(app.includes("APP_VERSION='0.4.0 RC1'"),'r7 app version');
need(app.includes("APP_VERSION_ID='0.4.0-rc1'"),'r7 app version id');
need(html.includes('<title>VolleyTakt Live 0.4.0 RC1</title>'),'r7 title');
need(sw.includes("volleytakt-live-web-v0.4.0-rc1"),'r7 cache');
for(const f of ['aufschlag.png','zuspiel.png','angriff.png','annahme.png','abwehr.png','block.png']){
  need(fs.existsSync(`app-icons/techniques/${f}`),`missing icon ${f}`);
  need(sw.includes(`./app-icons/techniques/${f}`),`icon not offline cached ${f}`);
}
need(app.includes("'Aufschlag':'./app-icons/techniques/aufschlag.png'"),'serve icon externalized');
need(!app.includes('const ACTION_ICONS='),'inline action icons still active');
need(html.includes('Detailliertes Scouting'),'toggle label');
need(app.includes("profile=$('#detailedQualityToggle').checked?'datavolley_6':'basic_5'"),'toggle profile change');
need(app.includes('state.pendingSide&&!state.autoServePreset'),'auto serve preset must not block mode toggle');
need(app.includes('state.captureQualityProfile=profile'),'auto serve preset updates frozen capture profile');
need(app.includes("detailliertes Scouting · P1–P9"),'detailed mode feedback');
need(app.includes("function renderQualityButtons(action=state.pendingAction||'')"),'quality action context');
need(app.includes('qualityMeaning(q,action)'),'quality meaning bound to action');
need(app.includes('Bedeutung für ${action}'),'context label bound to action');
need(!app.includes('DV-Standard'),'DV-Standard wording remains');
need(!app.includes('DataVolley-Standard'),'DataVolley-Standard wording remains');
need(css.includes('.viewport-browser-low'),'usable-height browser layout missing');
need(app.includes("h<840 || uiScale<.88"),'browser-low threshold missing');
console.log('Preview2-r7 UI regression checks OK');
