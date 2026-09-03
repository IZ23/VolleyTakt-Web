import fs from 'node:fs';
const html=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('js/app.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const manifest=fs.readFileSync('manifest.webmanifest','utf8');
const need=(v,m)=>{if(!v)throw new Error(m)};
need(html.includes('0.4.0 RC4-r2'),'visible RC4-r2 missing');
need(app.includes("APP_VERSION='0.4.0 RC4-r2'"),'app version missing');
need(sw.includes('volleytakt-live-web-v0.4.0-rc4-r2'),'cache id missing');
need(manifest.includes('0.4.0 RC4-r2'),'manifest version missing');
// FE-UI13
need(/id="startAppBtn"[^>]*>VolleyTakt Live<\/button>/.test(html),'entry button label must be VolleyTakt Live');
need(css.includes('.start-actions #startAppBtn{width:min(300px,100%)!important;justify-self:center!important;text-align:center!important}'),'entry button centering missing');
need(html.includes('browserCameraNotice'),'technical Web Bluetooth notice missing');
// FE-UI14
need(app.includes("let matchEditorOpen=false;let matchEditorMode=''"),'match editor state missing');
need(app.includes("function newMatchFromLibrary(){\n matchEditorOpen=true;matchEditorMode='new';drawMatch()"),'new match must open editor without immediate state creation');
need(app.includes('matchEditorOpen?`<div class="card match-editor-card"'),'new-match editor must be conditional');
need(app.includes('id="cancelMatchEdit"')&&app.includes('id="cancelMatchEdit2"'),'cancel controls missing');
need(app.includes("setStatus('Spielanlage abgebrochen · kein neues Spiel angelegt.')"),'cancel must preserve existing state');
// FE-SCOUT9
need(app.includes("return false;\n if(state.matchId&&!state.quickScoutDraft)archiveCurrentMatch"),'quick-scout cancel result missing');
need(app.includes("const started=await startQuickScout({draft:true});\n   if(!started)toggle.checked=!!state.quickScout"),'quick-scout toggle rollback missing');
console.log('RC4-r2 FE-UI13/FE-UI14/FE-SCOUT9 regression OK');
