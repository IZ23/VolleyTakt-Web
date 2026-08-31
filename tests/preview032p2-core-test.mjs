import fs from 'node:fs';
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const stateModule=fs.readFileSync(new URL('../js/app/state.js',import.meta.url),'utf8');
const scouting=fs.readFileSync(new URL('../js/scouting/scouting.js',import.meta.url),'utf8');
const appState=app+'\n'+stateModule+'\n'+scouting;
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const storage=fs.readFileSync(new URL('../js/storage.js',import.meta.url),'utf8');
const sync=fs.readFileSync(new URL('../js/sync.js',import.meta.url),'utf8');
const need=(v,m)=>{if(!v)throw new Error(m)};

need(app.includes("APP_VERSION='0.4.0 RC1'"),'visible version missing');
need(html.includes('<title>VolleyTakt Live 0.4.0 RC1</title>'),'tab version wrong');
need(html.includes('<small>0.4.0 RC1</small>'),'header version wrong');
need(sw.includes("volleytakt-live-web-v0.4.0-rc1"),'cache version wrong');
need(html.includes('volleytakt-192.png?v=0.4.0-rc1'),'favicon missing');

need(appState.includes("captureQualityProfile:''"),'capture profile freeze missing');
need(appState.includes("captureFieldOrientation:''"),'capture orientation freeze missing');
need(scouting.includes("const maxZone=originMaxZone(state.pendingAction)"),'WO validation missing');
need(app.includes("Scouting-Modus kann nach Abschluss der aktuellen Aktion geändert werden."),'mode guard missing');
need(app.includes("Felddarstellung kann nach Abschluss der aktuellen Aktion geändert werden."),'orientation guard missing');

need(/\.court:not\(\.nine-zone\)\.net-after\s*\{[^}]*repeat\(2,minmax\(0,1fr\)\)/s.test(css),'simple single court must have 2 rows');
need(/\.court-wrap\.dual-court \.court:not\(\.nine-zone\)\s*\{[^}]*repeat\(2,minmax\(0,1fr\)\)/s.test(css),'simple dual court must have 2 rows');
need(/\.court-wrap\.dual-court \.court\.nine-zone\s*\{[^}]*repeat\(3,minmax\(0,1fr\)\)/s.test(css),'detailed dual court must have 3 rows');

need(storage.includes('CURRENT_DATA_SCHEMA=5'),'data schema missing');
need(storage.includes('createUpdateBackup'),'backup missing');
need(storage.includes('runDataMigrations'),'migration missing');
need(app.includes('checkForUpdate'),'update check missing');
need(app.includes('applyConfirmedUpdate'),'confirmed updater missing');
need(!app.includes("caches.delete(k)"),'existing offline cache must not be deleted before successful SW activation');

need(app.includes('Spielbibliothek'),'match library missing');
need(app.includes('Videospeicher &amp; Videozuordnung'),'video storage UI missing');
need(sync.includes('fetchCloudMatchLibrary'),'cloud library missing');
need(sync.includes('syncStoredMatch'),'stored match sync missing');

need(app.includes("GoPro HERO"),'GoPro adapter UI missing');
need(app.includes("DJI Osmo Action"),'DJI adapter UI missing');
need(app.includes("Verbindung bleibt nach Aufnahme-Stopp aktiv"),'camera keep-alive guidance missing');
need(app.includes("cameraBatteryRenderedAt>=12000") || app.includes("nowMs-cameraBatteryRenderedAt>=12000"),'battery UI cadence missing');

console.log('preview032p2-core-test: OK');
