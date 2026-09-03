import {CsvStore,loadMaster,saveMaster,loadState,saveState,loadEvents,saveEvents,loadSettings,saveSettings,loadMatchArchive,saveMatchArchive,upsertMatchArchive,getMatchSnapshot,removeMatchArchive,newId,touched,active,orderedMatchTypes,parseCsv,downloadJson,runDataMigrations,createUpdateBackup,CURRENT_DATA_SCHEMA} from './storage.js';
import {createProvider,syncMaster,syncLiveSession,syncStoredMatch,fetchCloudMatchLibrary,fetchCloudMatch,removeCloudMatchFromLibrary,normalizeServerUrl} from './sync.js';
import {initI18n,setLanguage,tr,t} from './i18n.js';
import {createDefaultState,normalizeLoadedState,cleanStateForSnapshot} from './app/state.js';
import {findPlayer,findTeam,findSeason,findMatchType,matchTypeKey as selectorMatchTypeKey} from './app/selectors.js';
import {createPersistenceController} from './app/persistence.js';
import {COMMANDS} from './app/commands.js';
import {normalizeShortcutKey,shortcutKeyLabel,shortcutActionForKey,commandForShortcutAction,createEdgeSwipeRouter} from './app/input-routing.js';
import {createScoutingController,SERVE_TECHNIQUES,SET_TEMPOS,SET_DISTANCES} from './scouting/scouting.js';
import {createRallyController,automaticPointFor} from './scouting/rally.js';
import {buildScoutingEvent,buildPlayerActionExtra} from './scouting/events.js';
import {scorePointTransition,winningSideForTarget,setWinTransition} from './scouting/scoring.js';
import {rotationTransition,setLineupTransition,nextSetTransition,matchFinishedTransition,beginSetSetupTransition} from './scouting/match-flow.js';
import {reconstructMatchState,undoEventBatch,restoreEventBatch} from './scouting/history.js';
import {analysisDate,actionName as analysisActionName,actionSide as analysisActionSide,isAction as analysisIsAction,filterMatches as filterAnalysisMatches,filterEvents as filterAnalysisEvents,percent as pct,rallyMap as analysisRallyMap,rallyForEvent as analysisRallyForEvent,wonOwn as analysisWonOwn,firstBallSideout as analysisFirstBallSideout,stats as analysisStats} from './analysis/domain.js';
import {filterBlockHtml as analysisFilterBlockHtml,resultShellHtml as analysisResultShellHtml} from './analysis/ui.js';
import {CameraService,adapterMeta as cameraAdapterMeta,connectionQuality as cameraConnectionQualityFor} from './camera/service.js';

const APP_VERSION='0.4.0 RC4-r2';
const APP_VERSION_ID='0.4.0-rc4-r2';
const TECHNIQUE_ICON_REV='0.4.0-rc4-r2-pictograms';
const UPDATE_REPO='IZ23/VolleyTakt-Web';
const migrationReport=runDataMigrations();
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const POS=[4,3,2,5,6,1], TOP_POS=[1,6,5,2,3,4], BOTTOM_POS=[4,3,2,5,6,1], OWN_COURT_ZONES=[4,3,2,7,8,9,5,6,1], OPP_COURT_ZONES=[1,6,5,9,8,7,2,3,4], COURT_ZONES=OWN_COURT_ZONES, ROMAN_POS={1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI'}, ROT=['R1','R6','R5','R4','R3','R2'], ACTIONS=['Angriff','Annahme','Aufschlag','Block','Abwehr','Zuspiel'];
const QUALITY_PROFILES={basic_5:['=','-','0','+','#'],datavolley_6:['=','-','!','/','+','#']};
const QUALITY_LEVEL={'=':0,'-':1,'/':2,'!':3,'0':3,'+':4,'#':5};
const ACTION_ICON_FILES={
 'Angriff':'./app-icons/techniques/angriff.png',
 'Annahme':'./app-icons/techniques/annahme.png',
 'Aufschlag':'./app-icons/techniques/aufschlag.png',
 'Block':'./app-icons/techniques/block.png',
 'Abwehr':'./app-icons/techniques/abwehr.png',
 'Zuspiel':'./app-icons/techniques/zuspiel.png'
};
const DV_QUALITY_MEANINGS={
 'Aufschlag':{'=':'Fehler – Punkt Gegner','-':'negativ – Gegner kann frei angreifen','!':'okay – kein erster Tempoangriff möglich','/':'positiv – Gegner kann nicht angreifen','+':'positiv – Gegner kann eingeschränkt angreifen','#':'Ass'},
 'Annahme':{'=':'Annahmefehler','/':'schlecht – kein Angriff möglich','-':'negativ – Angriff nur eingeschränkt möglich','!':'okay – kein erster Tempoangriff möglich','+':'positiv – Angriff möglich','#':'perfekte Annahme'},
 'Angriff':{'=':'Angriffsfehler','/':'geblockt','-':'schwach – leicht abwehrbar','!':'geblockt – eigener Wiederangriff möglich','+':'positiv – guter Angriff','#':'direkter Angriffspunkt'},
 'Block':{'=':'Blockfehler','/':'Übergriff / Invasion','-':'schwach – Gegner kann weiterspielen','!':'schwach – Gegner kann weiterspielen','+':'positiv – Blockberührung','#':'direkter Blockpunkt'},
 'Abwehr':{'=':'Abwehrfehler','-':'kein strukturierter Angriff möglich','/':'Ball direkt zurück über das Netz','!':'okay – kein erster Tempoangriff möglich','+':'gute Abwehr','#':'perfekte Abwehr'},
 'Zuspiel':{'=':'Zuspiel-Fehler','/':'schlecht','-':'okay – nur hoher Pass möglich','!':'okay – kein erster Tempoangriff möglich','+':'gutes Zuspiel','#':'perfektes Zuspiel'}
};
const DV_QUALITY_ORDER={
 'Aufschlag':['=','-','!','+','/','#'],
 'Annahme':['=','/','-','!','+','#'],
 'Angriff':['=','/','-','!','+','#'],
 'Block':['=','/','-','!','+','#'],
 'Abwehr':['=','-','/','!','+','#'],
 'Zuspiel':['=','/','-','!','+','#']
};
const TOUR_VERSION='0.4.0-rc4-r2';
const DEFAULT_SHORTCUTS={
 'position.1':'1','position.2':'2','position.3':'3','position.4':'4','position.5':'5','position.6':'6',
 'action.attack':'A','action.reception':'N','action.serve':'U','action.block':'B','action.defense':'D','action.set':'Z',
 'quality.equal':'=','quality.minus':'-','quality.bang':'!','quality.slash':'/','quality.zero':'0','quality.plus':'+','quality.hash':'*',
 'rally.own':'P','rally.opponent':'G','substitution':'W','libero':'L','rotation':'R','undo':'Backspace','cancel':'Escape'
};
const SHORTCUT_LABELS={
 'position.1':'Position I','position.2':'Position II','position.3':'Position III','position.4':'Position IV','position.5':'Position V','position.6':'Position VI',
 'action.attack':'Angriff','action.reception':'Annahme','action.serve':'Aufschlag','action.block':'Block','action.defense':'Abwehr','action.set':'Zuspiel',
 'quality.equal':'Bewertung =','quality.minus':'Bewertung -','quality.bang':'Bewertung !','quality.slash':'Bewertung /','quality.zero':'Bewertung 0','quality.plus':'Bewertung +','quality.hash':'Bewertung #',
 'rally.own':'Punkt Wir / Rallyende','rally.opponent':'Punkt Gegner / Rallyende','substitution':'Wechsel','libero':'Libero','rotation':'Rotation vor','undo':'Undo','cancel':'Auswahl abbrechen'
};
const TOUR_STEPS=[
 {sel:'#menuBtn',title:'Menü',text:'Über Logo und Menü-Symbol erreichst du Spiel, Stammdaten, Kader, Kamera, Synchronisation, Einstellungen und Hilfe.'},
 {sel:'.match-center',title:'Spielstand und Teams',text:'Hier siehst du die beiden Teams und den aktuellen Punktestand. Rechts oben steht zusätzlich der Satzstand.'},
 {sel:'#serveStateBtn',title:'Aufschlagrecht',text:'Hier stellst du ein, ob Wir oder der Gegner aufschlägt. Bei eigenem Aufschlag werden WER=P1 und WAS=Aufschlag automatisch vorausgewählt; beides bleibt korrigierbar.'},
 {sel:'.court-panel',title:'WER',text:'Tippe P1–P6 an. VolleyTakt löst die dort aktuell stehende Spielerin sofort auf ihre player_id auf. Der Außenrahmen zeigt WER.'},
 {sel:'#actionButtons',title:'WAS',text:'Danach wählst du WAS: Angriff, Annahme, Aufschlag, Block, Abwehr oder Zuspiel. Bis vor WO kannst du WER durch Antippen einer anderen Position korrigieren.'},
 {sel:'#qualityButtons',title:'WIE, WO und WOHIN',text:'Wähle WIE, also die Qualität. In der detaillierten Bewertung werden Zuspiel- und Aufschlagdetails ergänzt. Danach folgen WO (Aktionsort) und – sofern fachlich erforderlich – WOHIN (Zielzone).'},
 {sel:'.correction-dock',title:'Rallyende und Korrekturen',text:'„+ Punkt Wir“ bzw. „+ Punkt Gegner“ beendet die Rally. Erst dann ändern sich Punktestand, Aufschlagrecht und gegebenenfalls Rotation.'},
 {sel:'.protocol-panel',title:'Live-Protokoll',text:'Jede Aktion bleibt einzeln gespeichert und gehört über die Rally-ID zum Ballwechsel. Undo setzt auch den daraus rekonstruierten Spielzustand zurück.'},
 {sel:'.player-change-controls',title:'Wechsel und Libero',text:'Position wählen, dann Wechsel (W) oder Libero (L). Es werden die für den Satz verfügbaren Spielerinnen angeboten.'},
 {sel:'.statusbar',title:'Speicherung und Synchronisation',text:'Unten siehst du lokalen CSV-Status, Cloud-Sync und Kamerastatus. Offline wird lokal weitergescoutet.'}
];
const now=()=>new Date().toISOString(), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=sec=>{sec=Math.max(0,+sec||0);const m=Math.floor(sec/60),s=sec-m*60;return `${String(m).padStart(2,'0')}:${s.toFixed(1).padStart(4,'0')}`};
const defaultState=createDefaultState();
let master=loadMaster(), state=normalizeLoadedState(loadState(),defaultState), events=loadEvents(), redoStack=[], settings={camera:{adapter:'dji_osmo',statusIntervalMs:12000,reconnect:true},sync:{provider:'none',url:'',path:'VolleyTakt',username:'',password:'',clientId:'',oneDriveClientId:'',dropboxClientId:'',boxClientId:'',appleContainerId:'',appleApiToken:'',appleEnvironment:'production',autoStart:false,autoChange:false},shortcuts:{...DEFAULT_SHORTCUTS},ui:{tourDismissedVersion:'',language:'de'},...loadSettings()};settings.camera={adapter:'dji_osmo',statusIntervalMs:12000,reconnect:true,...(settings.camera||{})};settings.shortcuts={...DEFAULT_SHORTCUTS,...(settings.shortcuts||{})};settings.ui={tourDismissedVersion:'',language:'de',playerSort:'jersey',playersTableSort:{key:'abbreviation',direction:'asc'},...(settings.ui||{})};if(!['jersey','abbreviation','firstName'].includes(settings.ui.playerSort))settings.ui.playerSort='jersey';if(!settings.ui.playersTableSort||!['name','abbreviation','jersey'].includes(settings.ui.playersTableSort.key))settings.ui.playersTableSort={key:'abbreviation',direction:'asc'};if(!['asc','desc'].includes(settings.ui.playersTableSort.direction))settings.ui.playersTableSort.direction='asc';
initI18n(settings.ui.language);
const csv=new CsvStore();let camera=null,cameraAnchor=null,modalSubmit=null,modalCancel=null,syncTimer=null,playerChangeMode=null;const edgeSwipeRouter=createEdgeSwipeRouter();let cloudMatchLibrary=[];let libraryRefreshing=false;let matchEditorOpen=false;let matchEditorMode='';let analysisPinnedMatchId='';const DEVICE_ID_KEY='volleytakt-live-device-id';let liveSyncBusy=false,liveSyncPending=false;
const cameraDiag={secure:window.isSecureContext===true?'Ja':'Nein',api:('bluetooth' in navigator)?'Ja':'Nein',availability:'–',chooser:'Nicht gestartet',device:'–',gatt:'Nein',service:'Nein',notify:'Nein',write:'Nein',notifications:'Nein',handshake:'Nein',lastError:'–'};
let cameraDiagLog=[];let cameraDiagVisible=false;let cameraBatteryValue=null,cameraBatteryRenderedAt=0,cameraLastStatusAt=0,cameraReconnects=0,cameraStatusFailures=0,cameraClipStartRecordTime=0;
function dlog(message){cameraDiagLog.push(`[${new Date().toLocaleTimeString()}] ${String(message??'')}`);if(cameraDiagLog.length>120)cameraDiagLog=cameraDiagLog.slice(-120);renderCameraDiagnostics()}
const cameraService=new CameraService({adapter:settings.camera?.adapter||'dji_osmo',statusIntervalMs:Number(settings.camera?.statusIntervalMs)||12000,log:dlog});
function runtimeOs(){const ua=navigator.userAgent||'',p=navigator.platform||'';if(/iPad|iPhone|iPod/i.test(ua)||(p==='MacIntel'&&navigator.maxTouchPoints>1))return 'ios';if(/Android/i.test(ua))return 'android';if(/Windows/i.test(ua))return 'windows';if(/Macintosh|Mac OS X/i.test(ua))return 'macos';if(/Linux/i.test(ua))return 'linux';return 'other'}
function cameraBrowserName(){const ua=navigator.userAgent||'';if(/SamsungBrowser/i.test(ua))return 'Samsung Internet';if(/EdgA|EdgiOS|Edg\//i.test(ua))return 'Microsoft Edge';if(/OPR\//i.test(ua))return 'Opera';if(/Vivaldi/i.test(ua))return 'Vivaldi';if(/Firefox|FxiOS/i.test(ua))return 'Firefox';if(/CriOS|Chrome\//i.test(ua))return 'Google Chrome / Chromium';if(/Safari/i.test(ua))return 'Safari';const b=navigator.userAgentData?.brands?.find(x=>!/^Not/i.test(x.brand))?.brand;return b||'dieser Browser'}
function cameraSupportInfo(){const browser=cameraBrowserName(),os=runtimeOs(),secure=window.isSecureContext===true,api=!!navigator.bluetooth;if(secure&&api&&browser==='Samsung Internet'&&os==='android')return{supported:false,browser,os,text:'Samsung Internet stellt die Web-Bluetooth-API bereit, der Geräteauswahldialog funktioniert auf manchen Android-Geräten jedoch nicht zuverlässig. Für die Kamerakopplung Google Chrome verwenden.'};if(secure&&api)return{supported:true,browser,os,text:'Web Bluetooth verfügbar – Kamerakopplung wird von diesem Browser bereitgestellt.'};if(!secure)return{supported:false,browser,os,text:`Du verwendest ${browser}. Die Kamerakopplung benötigt einen sicheren HTTPS-Kontext. Öffne VolleyTaktLive über HTTPS.`};if(os==='ios')return{supported:false,browser,os,text:`Du verwendest ${browser} unter iOS/iPadOS. Web Bluetooth steht dort derzeit nicht zur Verfügung; ein Browserwechsel aktiviert die Kamerakopplung nicht. Die lokale Zeitquelle bleibt nutzbar.`};if(os==='android')return{supported:false,browser,os,text:`Du verwendest ${browser} unter Android; daher steht die Kamera-Synchronisation über Web Bluetooth hier nicht zur Verfügung. Verwende Google Chrome; weitere Chromium-Browser können je nach Android-Version ebenfalls funktionieren.`};if(os==='windows'||os==='macos')return{supported:false,browser,os,text:`Du verwendest ${browser} unter ${os==='windows'?'Windows':'macOS'}; daher steht die Kamera-Synchronisation über Web Bluetooth hier nicht zur Verfügung. Verwende Google Chrome, Microsoft Edge oder Opera.`};if(os==='linux')return{supported:false,browser,os,text:`Du verwendest ${browser} unter Linux. Web Bluetooth ist in diesem Browser nicht verfügbar. Verwende einen Chromium-basierten Browser mit aktivem Web Bluetooth; die Unterstützung ist unter Linux systemabhängig.`};return{supported:false,browser,os,text:`Du verwendest ${browser}. Dieser Browser stellt Web Bluetooth nicht bereit. Verwende einen Web-Bluetooth-fähigen Chromium-Browser; die lokale Zeitquelle bleibt verfügbar.`}}
function renderStartupCameraNotice(){const el=$('#browserCameraNotice');if(!el)return;const info=cameraSupportInfo();el.hidden=info.supported;el.textContent=info.supported?'':info.text;el.classList.toggle('warning',!info.supported)}
function cameraSupportNoticeHtml(){const info=cameraSupportInfo();return `<div class="camera-support-note ${info.supported?'ok':'warning'}"><strong>${info.supported?'Kameraunterstützung verfügbar':'Keine Kameraunterstützung in diesem Browser'}</strong><span>${esc(info.text)}</span></div>`}
function diagClass(v){if(['Ja','Verbunden','Gefunden','Aktiv','Erfolgreich','Verfügbar'].some(x=>String(v).includes(x)))return 'diag-ok';if(['Nein','Fehler','Nicht verfügbar','getrennt'].some(x=>String(v).includes(x)))return 'diag-bad';if(['Prüfe','geöffnet','Verbinde','läuft','–'].some(x=>String(v).includes(x)))return 'diag-warn';return 'diag-neutral'}
function setCameraDiag(key,value){cameraDiag[key]=value;renderCameraDiagnostics()}
function renderCameraDiagnostics(){const values={diagSecure:cameraDiag.secure,diagApi:cameraDiag.api,diagAvailability:cameraDiag.availability,diagBrowser:cameraBrowserName(),diagChooser:cameraDiag.chooser,diagDevice:cameraDiag.device,diagGatt:cameraDiag.gatt,diagService:cameraDiag.service,diagNotify:cameraDiag.notify,diagWrite:cameraDiag.write,diagNotifications:cameraDiag.notifications,diagHandshake:cameraDiag.handshake,diagError:cameraDiag.lastError};for(const [id,val] of Object.entries(values)){const el=$('#'+id);if(el){el.textContent=val;el.className=diagClass(val)}}const log=$('#bleLog');if(log)log.textContent=cameraDiagLog.join('\n')||'Noch keine Verbindungsversuche.'}
async function probeBluetooth(){setCameraDiag('secure',window.isSecureContext===true?'Ja':'Nein');setCameraDiag('api',('bluetooth' in navigator)?'Ja':'Nein');if(!navigator.bluetooth){setCameraDiag('availability','Nicht verfügbar');return}setCameraDiag('availability','Prüfe …');try{if(typeof navigator.bluetooth.getAvailability==='function'){const ok=await navigator.bluetooth.getAvailability();setCameraDiag('availability',ok?'Verfügbar':'Nicht verfügbar / Bluetooth aus')}else setCameraDiag('availability','API vorhanden')}catch(e){setCameraDiag('availability','Prüfung fehlgeschlagen');dlog('Bluetooth-Verfügbarkeit: '+e.message)}}
function handleCameraDiagnostic(d){const detail=d?.detail||'';const status=d?.status||'info';const map={api:['api',status==='ok'?'Ja':'Nein'],availability:['availability',status==='ok'?'Verfügbar':status==='error'?'Nicht verfügbar':detail],chooser:['chooser',status==='pending'?'Geräteauswahl geöffnet':detail],device:['device',detail||'Ausgewählt'],gatt:['gatt',status==='ok'?'Verbunden':status==='pending'?'Verbinde …':'Fehler'],service:['service',status==='ok'?(detail||'Gefunden'):status==='pending'?(detail||'Suche …'):'Fehler'],notify:['notify',status==='ok'?(detail||'Gefunden'):status==='pending'?(detail||'Suche …'):'Fehler'],write:['write',status==='ok'?(detail||'Gefunden'):status==='pending'?(detail||'Suche …'):'Fehler'],notifications:['notifications',status==='ok'?'Aktiv':'Fehler'],handshake:['handshake',status==='ok'?(detail||'Erfolgreich'):status==='pending'?(detail||'Läuft …'):'Fehler']};if(map[d?.stage])setCameraDiag(...map[d.stage]);if(d?.stage==='error'||status==='error')setCameraDiag('lastError',detail||'Unbekannter Fehler');if(detail)dlog(`${d.stage}: ${detail}`)}
function deviceId(){let v=localStorage.getItem(DEVICE_ID_KEY);if(!v){v=newId('device');localStorage.setItem(DEVICE_ID_KEY,v)}return v}
function deviceName(){return navigator.userAgentData?.platform||navigator.platform||'WebApp'}

function matchDisplayMeta(st=state){return {matchDate:st.matchDate||new Date().toISOString().slice(0,10),seasonId:st.seasonId||'',ownTeamId:st.ownTeamId||'',oppTeamId:st.oppTeamId||'',ownTeamName:st.quickScout?(st.quickOwnName||'Wir'):(team(st.ownTeamId)?.name||'Eigenes Team'),oppTeamName:st.quickScout?(st.quickOppName||'Gegner'):(team(st.oppTeamId)?.name||'Gegner'),matchTypeId:st.matchTypeId||'',matchTypeName:st.matchTypeName||matchType(st.matchTypeId)?.name||''}}
function scheduleSync(){if(!settings.sync?.autoChange||!['nextcloud','webdav'].includes(settings.sync?.provider)||!state.matchId)return;liveSyncPending=true;syncUiState='pending';syncUiPending=Math.max(1,syncUiPending+1);updateSyncBadge();clearTimeout(syncTimer);syncTimer=setTimeout(()=>runLiveSync(false),650)}
const persistenceController=createPersistenceController({getMaster:()=>master,getState:()=>state,getEvents:()=>events,getDisplayMeta:matchDisplayMeta,saveMaster,saveState,saveEvents,upsertMatchArchive,scheduleSync});
function archiveCurrentMatch(statusOverride=''){return persistenceController.archiveCurrentMatch(statusOverride)}
function persist(){return persistenceController.persist()}
function matchTypeKey(name){return selectorMatchTypeKey(name)}
function dedupeMatchTypes(){
 const groups=new Map();for(const mt of master.matchTypes||[]){const key=matchTypeKey(mt.name);if(!key)continue;(groups.get(key)||groups.set(key,[]).get(key)).push(mt)}
 let changed=false;const idMap=new Map();
 for(const rows of groups.values()){
  rows.sort((a,b)=>(b.usageCount||0)-(a.usageCount||0)||String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
  const keep=rows[0];if(!keep)continue;keep.name=String(keep.name||'').trim().replace(/\s+/g,' ');
  if(rows.length<2)continue;changed=true;
  const removeRows=rows.slice(1),remove=new Set(removeRows.map(x=>x.id));for(const x of removeRows)idMap.set(x.id,keep.id);
  keep.usageCount=rows.reduce((n,x)=>n+(x.usageCount||0),0);keep.revision=Math.max(...rows.map(x=>x.revision||0));keep.updatedAt=rows.map(x=>x.updatedAt||'').sort().at(-1)||keep.updatedAt;
  for(const r of master.matchRosters||[])if(remove.has(r.matchTypeId))r.matchTypeId=keep.id;
  if(remove.has(state.matchTypeId))state.matchTypeId=keep.id;
  master.matchTypes=master.matchTypes.filter(x=>!remove.has(x.id));
 }
 // Auch historische Match-Snapshots auf die zentrale Stammdaten-ID umbiegen.
 if(idMap.size){const archive=loadMatchArchive();let archiveChanged=false;for(const m of archive){const next=idMap.get(m.matchTypeId);if(next){m.matchTypeId=next;m.matchTypeName=matchType(next)?.name||m.matchTypeName;archiveChanged=true}}if(archiveChanged)saveMatchArchive(archive)}
 return changed
}
function seedDefaults(){dedupeMatchTypes();for(const name of ['Punktspiel','Trainingsspiel','Testspiel','Turnier','Freundschaftsspiel'])if(!master.matchTypes.some(x=>String(x.name||'').trim().toLowerCase()===name.toLowerCase()))master.matchTypes.push({id:newId('mt'),name,usageCount:0,active:true,revision:1,updatedAt:now()});saveMaster(master);saveState(state)}
seedDefaults();migrateEventPlayerIds(events);migrateRallyMetadata(events);saveEvents(events);
function player(id){return findPlayer(master,state,id)} function team(id){return findTeam(master,id)} function season(id){return findSeason(master,id)} function matchType(id){return findMatchType(master,id)}
// LEGACY: remaining UI adapters stay here while 0.4.0 modularization continues.
function normalizeQualityProfile(profile){if(profile==='datavolley'||profile==='datavolley_6')return 'datavolley_6';return 'basic_5'}
function detailedCapture(side=currentCaptureSide()){return scoutingController.detailedCapture(side)}
function captureOrientation(){return state.pendingSide&&state.captureFieldOrientation?state.captureFieldOrientation:state.fieldOrientation}
function highlightedFieldIsTop(){return !['activeBottom','opponentBottom'].includes(captureOrientation())}
function sideIsTopOnScreen(side){
 const top=highlightedFieldIsTop();
 if(state.opponentCapture)return side==='opponent'?top:!top;
 return top;
}
function zonesForCapture(side=currentCaptureSide()){return courtZonesForSide(side,detailedCapture(side))}
function courtZonesForSide(side,detailed=true,{singleScout=false}={}){
 const top=singleScout?highlightedFieldIsTop():sideIsTopOnScreen(side);
 // Einzelfeldansicht: Die markierte Symbolhälfte legt die Bildschirmseite fest.
 // Markiert oben => spiegelbildliche obere Feldgeometrie (1-6-5 / 9-8-7 / 2-3-4).
 // Markiert unten => normale untere Feldgeometrie (4-3-2 / 7-8-9 / 5-6-1).
 // Im einfachen Scouting gilt dieselbe Spiegelung ohne P7-P9.
 const inputTop=top;
 return detailed?(inputTop?OPP_COURT_ZONES:OWN_COURT_ZONES):(inputTop?TOP_POS:BOTTOM_POS)
}
function needsTarget(side,action){return scoutingController.needsTarget(side,action)}
function targetSideFor(side,action){return scoutingController.targetSideFor(side,action)}
function targetAllowsBothSides(action){return scoutingController.targetAllowsBothSides(action)}
function originMaxZone(action){return scoutingController.originMaxZone(action)}
function targetMaxZone(action){return scoutingController.targetMaxZone(action)}
function qualityProfileForTeam(teamId){return normalizeQualityProfile(team(teamId)?.qualityProfile||'basic_5')}
function qualityProfileForSide(side){const saved=side==='opponent'?state.opponentQualityProfile:state.ownQualityProfile;return normalizeQualityProfile(saved||qualityProfileForTeam(side==='opponent'?state.oppTeamId:state.ownTeamId))}
function currentCaptureSide(){return state.pendingSide||(state.activeTeamContext==='opponent'?'opponent':'own')}
function activeSide(){return state.activeTeamContext==='opponent'?'opponent':'own'}
function rotationIndexForSide(side){return side==='opponent'?(state.oppRotationIndex||0):(state.rotationIndex||0)}
function lineupForSide(side){return side==='opponent'?state.oppLineup:state.ownLineup}
function matchConfigured(){return state.quickScout?!!state.matchId:!!(state.matchId&&state.seasonId&&state.ownTeamId&&state.oppTeamId&&state.matchTypeId)}
function lineupHasPlayers(side){return POS.some(pos=>!!lineupForSide(side)?.[pos])}
function setScoutingReady(){return matchConfigured()&&state.setReady&&!state.matchComplete&&!!state.servingSide&&lineupHasPlayers('own')&&(!state.opponentCapture||lineupHasPlayers('opponent'))}
function techniqueReady(side=activeSide()){return matchConfigured()&&!state.matchComplete&&lineupHasPlayers(side==='opponent'?'opponent':'own')}

function quickPlayerId(side,pos){return `quick-${side}-${pos}`}
function quickLiberoId(side,index){return `quick-${side}-libero-${index}`}
function ensureQuickPlayers(){
 state.quickPlayers={...(state.quickPlayers||{})};
 for(const side of ['own','opponent']){
  for(let pos=1;pos<=6;pos++){
   const id=quickPlayerId(side,pos);if(!state.quickPlayers[id])state.quickPlayers[id]={id,abbreviation:`P${pos}`,description:'',defaultJersey:'',defaultRole:'',quick:true,side};
  }
  for(const index of [1,2]){
   const id=quickLiberoId(side,index);if(!state.quickPlayers[id])state.quickPlayers[id]={id,abbreviation:`Libero${index}`,description:`Libero ${index}`,defaultJersey:'',defaultRole:`LIBERO${index}`,quick:true,side};
  }
 }
}
function quickLineup(side){ensureQuickPlayers();return Object.fromEntries([1,2,3,4,5,6].map(pos=>[pos,quickPlayerId(side,pos)]))}
async function startQuickScout({draft=true}={}){
 if(events.length&&!confirm('Das aktuelle Scouting enthält bereits Einträge. Spontanes Scouting wirklich als neues Match starten?'))return false;
 if(state.matchId&&!state.quickScoutDraft)archiveCurrentMatch(state.matchComplete?'ended':'interrupted');
 events=[];await csv.write(events);state={...defaultState,quickScout:true,quickScoutDraft:!!draft,quickOwnName:'Wir',quickOppName:'Gegner',quickPlayers:{},matchDate:new Date().toISOString().slice(0,10),matchId:newId('match'),matchTypeId:'__quick__',matchTypeName:'Spontanes Scouting',opponentCapture:true,allowPositionOnly:true,setReady:true,ownQualityProfile:'basic_5',opponentQualityProfile:'basic_5'};
 ensureQuickPlayers();state.ownLineup=quickLineup('own');state.oppLineup=quickLineup('opponent');state.ownBaseLineup={...state.ownLineup};state.oppBaseLineup={...state.oppLineup};state.setLineupsOwn={'1':{...state.ownLineup}};state.setLineupsOpp={'1':{...state.oppLineup}};state.currentLiberosOwn=[quickLiberoId('own',1),quickLiberoId('own',2)];state.currentLiberosOpp=[quickLiberoId('opponent',1),quickLiberoId('opponent',2)];state.setLiberosOwn={'1':[...state.currentLiberosOwn]};state.setLiberosOpp={'1':[...state.currentLiberosOpp]};saveState(state);render();drawMatch();setStatus('Spontanes Scouting bereit · Aufschlagrecht oben rechts festlegen. Der Bibliothekseintrag entsteht mit dem ersten gespeicherten Ereignis. Long-Touch auf eine Position bearbeitet Trikotnummer/Beschreibung.');
 return true;
}
function editQuickPlayer(side,pos){
 if(!state.quickScout)return;const pid=lineupForSide(side)?.[pos]||quickPlayerId(side,pos);ensureQuickPlayers();const p=state.quickPlayers[pid]||state.quickPlayers[quickPlayerId(side,pos)];
 modal(`Spontanes Scouting · ${side==='opponent'?'Gegner':'Wir'} · ${posLabel(pos)}`,`<label>Trikotnummer <input name="jersey" inputmode="numeric" value="${esc(p.defaultJersey||'')}" placeholder="z. B. 12"></label><label>Beschreibung / Kürzel <input name="description" value="${esc(p.description||p.abbreviation||'')}" placeholder="z. B. Zuspiel oder MB1"></label>`,fd=>{const jersey=String(fd.get('jersey')||'').trim(),description=String(fd.get('description')||'').trim();p.defaultJersey=jersey;p.description=description;p.abbreviation=description||`P${pos}`;state.quickPlayers[p.id]=p;persist();render();setStatus(`${posLabel(pos)} aktualisiert${jersey?` · #${jersey}`:''}${description?` · ${description}`:''}.`)},'Speichern')
}

function oppositeServing(side){return side==='us'?'them':'us'}
function servingForSet(setNo){if(setNo===1)return state.firstSetServing||'';if(setNo>=2&&setNo<=4&&state.firstSetServing)return setNo%2===1?state.firstSetServing:oppositeServing(state.firstSetServing);return ''}
function configuredSetLimit(){return state.matchMode==='fixed'?Math.min(5,Math.max(1,+state.fixedSetCount||3)):5}
function pointsTargetForSet(setNo=state.setNo){if(state.matchMode==='fixed')return setNo===configuredSetLimit()&&+state.fixedFinalSetTarget===15?15:25;return setNo===5?15:25}
function isMatchFinishedAfterSet(finishedSet=state.setNo,winsUs=state.setWinsUs,winsThem=state.setWinsThem){return state.matchMode==='fixed'?finishedSet>=configuredSetLimit():winsUs>=3||winsThem>=3}
function winningSideForScore(us=state.scoreUs,them=state.scoreThem,setNo=state.setNo){return winningSideForTarget(us,them,pointsTargetForSet(setNo))}
function isLiberoRole(role){const r=String(role||'').trim().toUpperCase().replace(/\s+/g,'');return /^(?:L|LIB|LIBERO)\d*$/.test(r)}
function currentQualityProfile(){return qualityProfileForSide(currentCaptureSide())}
function qualityValues(){const profile=currentQualityProfile();if(profile==='datavolley_6')return DV_QUALITY_ORDER[state.pendingAction]||QUALITY_PROFILES.datavolley_6;return QUALITY_PROFILES.basic_5}
function qualityLevel(value,action=state.pendingAction){if(currentQualityProfile()==='datavolley_6'){const order=DV_QUALITY_ORDER[action]||QUALITY_PROFILES.datavolley_6;const i=order.indexOf(value);return i<0?3:i}return QUALITY_LEVEL[value]??3}
function qualityClass(q){return {'=':'q-error','-':'q-negative','!':'q-limited','/':'q-poor','0':'q-neutral','+':'q-positive','#':'q-perfect'}[q]||''}
function qualityMeaning(q,action=state.pendingAction){
 const dv=currentQualityProfile()==='datavolley_6';
 if(dv&&action&&DV_QUALITY_MEANINGS[action]?.[q])return tr(DV_QUALITY_MEANINGS[action][q]);
 const map=dv?{'=':'Fehler','-':'technikspezifisch','!':'technikspezifisch','/':'technikspezifisch','+':'positiv','#':'perfekt'}:{'=':'Fehler','-':'negativ','0':'neutral','+':'positiv','#':'perfekt'};return tr(map[q]||q)
}
function qualityChip(q){return `<span class="quality-chip ${qualityClass(q)}">${esc(q||'–')}</span>`}
function renderQualityButtons(action=state.pendingAction||''){const row=$('#qualityButtons');if(!row)return;const vals=qualityValues();const detailed=vals.length===6;row.style.setProperty('--quality-count',vals.length);row.classList.toggle('detailed',detailed);row.innerHTML='';for(const q of vals){const b=document.createElement('button');b.textContent=q;b.dataset.quality=q;b.classList.add('quality-button',qualityClass(q));b.title=qualityMeaning(q,action);b.onclick=()=>chooseQuality(q);if(q===state.pendingQuality)b.classList.add('selected');row.appendChild(b)}const help=$('#qualityMeaning');if(help){help.innerHTML='';if(detailed){const head=document.createElement('div');head.className='quality-meaning-context';head.textContent=action?`Bedeutung für ${action}`:'Bedeutung wird nach Auswahl der Technik konkretisiert';help.appendChild(head)}for(const q of vals){const line=document.createElement('div');line.className='quality-meaning-row';const key=document.createElement('span');key.className=`quality-meaning-key ${qualityClass(q)}`;key.textContent=q;const text=document.createElement('span');text.className='quality-meaning-text';text.textContent=qualityMeaning(q,action);line.append(key,text);help.appendChild(line)}}}
function inferImportedQualityProfiles(rows){
 let own=null,opp=null;
 for(const r of rows){
  const side=(r.side==='opponent'||String(r.action||'').startsWith('Gegner '))?'opponent':'own';
  let profile=r.quality_profile?normalizeQualityProfile(r.quality_profile):null;
  if(!profile&&['!','/'].includes(String(r.value||'')))profile='datavolley_6';
  if(profile){if(side==='opponent')opp=profile;else own=profile}
 }
 if(own)state.ownQualityProfile=own;if(opp)state.opponentQualityProfile=opp;
}
function posLabel(pos){return ROMAN_POS[+pos]||String(pos||'–')}
function posToken(pos){return +pos?`P${+pos}`:'–'}
function playerLabel(id){const p=player(id);return p?(p.abbreviation||p.description||'–'):'–'} function playerFull(id){const p=player(id);if(!p)return '–';return p.description||`${p.firstName||''} ${p.lastName||''}`.trim()||''}
function playerJerseyForSide(side,id){
 if(!id)return '–';
 const p=player(id);
 if(state.quickScout)return String(p?.defaultJersey??'').trim()||'–';
 // Die aktuelle Spielerinnen-Stammdaten-Nr. ist fuer die Live-Darstellung fuehrend.
 // Kadernummern bleiben als Fallback fuer Alt-/Importdaten erhalten.
 const current=String(p?.defaultJersey??'').trim();
 if(current)return current;
 const tid=side==='opponent'?state.oppTeamId:state.ownTeamId;
 let r=master.matchRosters.find(x=>x.teamId===tid&&x.seasonId===state.seasonId&&x.matchTypeId===state.matchTypeId&&x.playerId===id&&x.active!==false);
 if(!r)r=master.seasonRosters.find(x=>x.teamId===tid&&x.seasonId===state.seasonId&&x.playerId===id&&x.active!==false);
 return String(r?.jersey??'').trim()||'–';
}
function playerSelectionSortValue(row,mode,side='own'){
 const p=row?.playerId?player(row.playerId):row;if(!p)return '';
 if(mode==='abbreviation')return String(p.abbreviation||'');
 if(mode==='firstName')return String(p.firstName||'');
 const raw=String(row?.jersey??p.defaultJersey??'').trim();return raw;
}
function sortPlayerSelectionRows(rows,side='own'){
 const mode=settings.ui?.playerSort||'jersey', coll=new Intl.Collator(settings.ui?.language||'de',{numeric:true,sensitivity:'base'});
 return [...(rows||[])].sort((a,b)=>{
  const av=playerSelectionSortValue(a,mode,side),bv=playerSelectionSortValue(b,mode,side);
  if(mode==='jersey'){
   const an=/^\d+$/.test(av)?Number(av):Number.POSITIVE_INFINITY,bn=/^\d+$/.test(bv)?Number(bv):Number.POSITIVE_INFINITY;
   if(an!==bn)return an-bn;
  }
  const primary=coll.compare(av,bv);if(primary)return primary;
  const ap=a?.playerId?player(a.playerId):a,bp=b?.playerId?player(b.playerId):b;
  return coll.compare(String(ap?.abbreviation||''),String(bp?.abbreviation||''))||coll.compare(String(ap?.firstName||''),String(bp?.firstName||''))||coll.compare(String(ap?.lastName||''),String(bp?.lastName||''));
 });
}
function eventPlayer(e){return e?.player_id?player(e.player_id):null}
function eventPlayerAbbreviation(e){return eventPlayer(e)?.abbreviation||e?.player_abbreviation||e?.player||''}
function eventPlayerName(e){const p=eventPlayer(e);return p?`${p.firstName} ${p.lastName}`:(e?.player_name||'')}
function migrateEventPlayerIds(rows){for(const e of rows||[]){if(e.player_id&&player(e.player_id))continue;const ab=String(e.player_abbreviation||e.player||'').trim().toUpperCase();if(!ab)continue;const matches=master.players.filter(p=>String(p.abbreviation||'').trim().toUpperCase()===ab);if(matches.length===1){e.player_id=matches[0].id;e.player_abbreviation=e.player_abbreviation||matches[0].abbreviation;e.player_name=e.player_name||`${matches[0].firstName} ${matches[0].lastName}`}}return rows}
function setStatus(s){$('#statusText').textContent=s}
function currentSeconds(){if(cameraAnchor)return Math.max(0,cameraAnchor.cameraSec+(performance.now()-cameraAnchor.perf)/1000);const base=Math.max(0,+state.localClockElapsed||0);if(state.clockMode==='local'&&state.localClockRunning&&state.localClockStartedAt)return base+Math.max(0,(Date.now()-state.localClockStartedAt)/1000);return base}
const scoutingController=createScoutingController({getState:()=>state,getLineup:side=>lineupForSide(side),getQualityProfileForSide:side=>qualityProfileForSide(side),getCurrentSeconds:()=>currentSeconds(),getNow:()=>now(),isScoutingReady:()=>setScoutingReady()});
function newVideoClipId(){state.videoClipCounter=(Number(state.videoClipCounter)||0)+1;state.videoClipId=`clip_${state.videoClipCounter}_${Date.now().toString(36)}`;return state.videoClipId}
function cameraShortName(){return cameraAdapterMeta(settings.camera?.adapter).shortName}
function cameraDefaultName(){return cameraAdapterMeta(settings.camera?.adapter).defaultName}
function cameraConnectionQuality(){return cameraConnectionQualityFor({connected:!!camera?.protocolConnected,statusIntervalMs:settings.camera?.statusIntervalMs,lastStatusAt:cameraLastStatusAt,reconnects:cameraReconnects,statusFailures:cameraStatusFailures})}
function updateCameraUi(forceBattery=false){const connected=!!camera?.protocolConnected,recording=!!state.cameraRecording,q=cameraConnectionQuality(),short=cameraShortName();const panel=$('#mainCameraPanel');if(panel)panel.hidden=!connected;const name=$('#mainCameraName');if(name)name.textContent=camera?.device?.name||cameraDefaultName();const link=$('#mainCameraLink');if(link)link.textContent=recording?'REC':'verbunden';const qual=$('#mainCameraQuality');if(qual){qual.textContent=q.label;qual.className=`camera-quality ${q.state}`}const nowMs=Date.now();if(forceBattery||nowMs-cameraBatteryRenderedAt>=12000){cameraBatteryRenderedAt=nowMs;const pct=Number.isFinite(+cameraBatteryValue)?Math.max(0,Math.min(100,+cameraBatteryValue)):null;const pctEl=$('#mainCameraBatteryPct'),fill=$('#mainCameraBatteryFill');if(pctEl)pctEl.textContent=pct==null?'–%':`${Math.round(pct)}%`;if(fill)fill.style.width=pct==null?'0%':`${pct}%`;const drawerBatt=$('#cameraBattery'),drawerFill=$('#cameraDrawerBatteryFill');if(drawerBatt)drawerBatt.textContent=pct==null?'– %':`${Math.round(pct)} %`;if(drawerFill)drawerFill.style.width=pct==null?'0%':`${pct}%`}const st=$('#mainRecordStart'),sp=$('#mainRecordStop');if(st){st.disabled=!connected||recording;st.textContent=recording?'● Aufnahme läuft':'● Aufnahme starten'}if(sp)sp.disabled=!connected||!recording;const tm=$('#mainCameraTime');if(tm)tm.textContent=fmt(currentSeconds());const sy=$('#mainCameraSync');if(sy)sy.textContent=recording?'Sync ✓':connected?'Sync bereit':'Sync –';const badge=$('#bleMini');if(badge){badge.textContent=!connected?'Kamera getrennt':recording?`${short} REC · Sync ✓`:`${short} ✓ · ${q.label}`;badge.className=`badge ${!connected?'muted':q.state==='warn'?'warn':'ok'}`;badge.title=connected?`${cameraDefaultName()} verbunden · Verbindung ${q.label}${cameraBatteryValue!=null?` · Akku ${cameraBatteryValue}%`:''}`:'Keine Kamera verbunden.'}}
function disconnectCamera(){if(!camera)return;cameraService.disconnect();camera=null;cameraAnchor=null;state.cameraRecording=false;state.clockMode='local';state.localClockRunning=false;state.localClockStartedAt=0;state.localClockElapsed=0;cameraLastStatusAt=0;cameraReconnects=0;cameraStatusFailures=0;cameraBatteryValue=null;persist();render();updateCameraUi(true);setStatus('Kamera getrennt.')}
function startLocalClock(reset=false){cameraAnchor=null;if(reset)state.localClockElapsed=0;if(!state.localClockRunning||reset){state.localClockStartedAt=Date.now();state.localClockRunning=true}state.clockMode='local';persist();render();setStatus(reset?'Lokale Zeit bei 00:00.0 neu gestartet.':state.localClockElapsed>0?'Lokale Zeit fortgesetzt.':'Lokale Zeit gestartet.')}
function stopLocalClock(message=true){if(state.localClockRunning){state.localClockElapsed=currentSeconds();state.localClockRunning=false;state.localClockStartedAt=0;state.clockMode='local';persist();render();if(message)setStatus('Lokale Zeit pausiert.')}return state.localClockElapsed}
async function stopLiveTimeAtBoundary(){const sec=currentSeconds(),wasRecording=!!state.cameraRecording;state.localClockElapsed=sec;state.localClockRunning=false;state.localClockStartedAt=0;cameraAnchor=null;if(wasRecording&&camera?.protocolConnected){try{await cameraService.stopRecording();syncCameraTelemetry(cameraService.snapshot());state.cameraRecording=false;state.clockMode='camera';persist();render();updateCameraUi(true);return ''}catch(e){cameraStatusFailures++;return ` Kamera-Aufnahme konnte nicht automatisch gestoppt werden: ${e?.message||e}`}}state.clockMode=camera?.protocolConnected?'camera':'local';persist();render();updateCameraUi();return ''}
function toggleLocalClock(){if(cameraAnchor||camera?.protocolConnected){setStatus('Kamera ist die aktive Zeitquelle. Aufnahme über die Kamerasteuerung stoppen.');return}if(state.localClockRunning)stopLocalClock(true);else startLocalClock(false)}
function resetLocalClock(){if(cameraAnchor||camera?.protocolConnected){setStatus('Kamera ist die aktive Zeitquelle.');return}state.localClockRunning=false;state.localClockStartedAt=0;state.localClockElapsed=0;state.clockMode='local';persist();render();setStatus('Lokale Zeit auf 00:00.0 zurückgesetzt.')}
function cycleServing(){state.servingSide=state.servingSide==='us'?'them':state.servingSide==='them'?'':'us';if(state.servingSide==='us')prepareOwnServePreset();else if(state.autoServePreset)clearPending(false);persist();render();setStatus(state.servingSide?`Aufschlagrecht: ${state.servingSide==='us'?'Wir':'Gegner'}.`:'Aufschlagrecht nicht festgelegt.')}
function cloudConfigPresent(cfg=settings.sync){const p=cfg?.provider||'none';if(p==='none')return false;if(['nextcloud','webdav'].includes(p))return !!(String(cfg.url||'').trim()&&String(cfg.username||'').trim()&&String(cfg.password||'').trim());if(p==='google')return !!String(cfg.clientId||'').trim();if(p==='onedrive')return !!String(cfg.oneDriveClientId||'').trim();if(p==='dropbox')return !!String(cfg.dropboxClientId||'').trim();if(p==='box')return !!String(cfg.boxClientId||'').trim();if(p==='icloud')return !!(String(cfg.appleContainerId||'').trim()&&String(cfg.appleApiToken||'').trim());return false}
async function probeCloudOnStart(){if(!cloudConfigPresent()){syncUiState=settings.sync?.provider&&settings.sync.provider!=='none'?'incomplete':'ready';updateSyncBadge();return false}syncUiState='connecting';updateSyncBadge();try{await createProvider(settings.sync).test();syncUiState='synced';updateSyncBadge();if(settings.sync?.autoStart)runSync(false);return true}catch(e){syncUiState='error';syncUiLastError=e?.message||String(e);updateSyncBadge();return false}}
async function start(){try{await document.documentElement.requestFullscreen?.()}catch{}try{await screen.orientation?.lock?.('landscape')}catch{}$('#startGate').hidden=true;$('#app').hidden=false;const ok=await csv.init('VolleyTaktLive_current.csv');$('#storagePill').textContent=ok?'CSV: lokal ✓':'CSV: Browser';if(state.servingSide==='us'&&!state.currentRallyId&&!state.pendingSide)prepareOwnServePreset();render();probeCloudOnStart();setTimeout(()=>maybeStartTour(),250)}

function render(){
 const ready=matchConfigured();
 $('#scoreUs').textContent=state.scoreUs;$('#scoreThem').textContent=state.scoreThem;$('#setDisplay').textContent=`Sätze ${state.setWinsUs} : ${state.setWinsThem}`;const captureOpponent=state.activeTeamContext==='opponent';const opponentToggle=$('#opponentToggle');if(opponentToggle){opponentToggle.checked=captureOpponent;const opponentSwitch=opponentToggle.closest('.opponent-switch');if(opponentSwitch){opponentSwitch.hidden=!state.opponentCapture;opponentSwitch.title=state.quickScout?'Zu scoutende Seite wechseln: Wir / Gegner':ready?'Zu scoutende Seite wechseln':'Nach Spiel-/Satzvorbereitung verfügbar';opponentSwitch.classList.toggle('quick-opponent-ready',!!state.quickScout)}}const activeRotation=ROT[captureOpponent?(state.oppRotationIndex||0):state.rotationIndex]||'R1';$('#rotationLabel').textContent=`${captureOpponent?'Gegner':'Wir'} · ${activeRotation}`;const quickToggle=$('#quickScoutToggle');if(quickToggle)quickToggle.checked=!!state.quickScout;const detailToggle=$('#detailedQualityToggle');if(detailToggle)detailToggle.checked=qualityProfileForSide(captureOpponent?'opponent':'own')==='datavolley_6';
 const ot=team(state.ownTeamId),op=team(state.oppTeamId);const configured=matchConfigured();$('#headerOwnTeam').textContent=state.quickScout?(state.quickOwnName||'Wir'):(ot?.name||'Wir');$('#headerOppTeam').textContent=state.quickScout?(state.quickOppName||'Gegner'):(op?.name||'Gegner');$('#matchScoreBlock').hidden=!configured;$('#matchSetupBtn').hidden=configured;
 $('#serveStateBtn').textContent=`Aufschlag: ${state.servingSide==='us'?'Wir':state.servingSide==='them'?'Gegner':'–'}`;$('#serveStateBtn').classList.toggle('selected',!!state.servingSide);
 const orientationBtn=$('#fieldOrientationBtn');if(orientationBtn){const top=highlightedFieldIsTop();orientationBtn.classList.toggle('active-top',top);orientationBtn.classList.toggle('active-bottom',!top);orientationBtn.classList.remove('opponent-top','opponent-bottom');orientationBtn.setAttribute('aria-label',top?'Felddarstellung: markierte Seite oben':'Felddarstellung: markierte Seite unten');orientationBtn.title=top?'Felddarstellung umschalten · markierte Seite oben':'Felddarstellung umschalten · markierte Seite unten';orientationBtn.disabled=!!state.pendingSide;}
 const localReady=!cameraAnchor&&!state.localClockRunning&&currentSeconds()===0;$('#clockStartBtn').title=(cameraAnchor||camera?.protocolConnected)?'Kamera-Zeitquelle – über die Kamerasteuerung bedienen':state.localClockRunning?'Lokale Zeit pausieren':localReady?'Lokale Zeit starten':'Lokale Zeit fortsetzen';
 drawActiveCourt();renderQualityButtons();renderSelection();renderProtocol();renderActionAvailability();updateShortcutHints();$('#undoBtn').disabled=!events.length;const redoBtn=$('#redoBtn');if(redoBtn)redoBtn.disabled=!redoStack.length;
 const scoutReady=setScoutingReady(),actionReady=techniqueReady(activeSide());$('#opponentToggle').disabled=!state.opponentCapture||(!ready&&!state.quickScout)||!!state.pendingSide;$('#rotateBtn').disabled=!scoutReady;$('#rotateBackBtn').disabled=!scoutReady;$('#sideoutBtn').disabled=!scoutReady;const subBtn=$('#substituteBtn'),liberoBtn=$('#liberoBtn');if(subBtn){subBtn.disabled=!actionReady;subBtn.classList.toggle('selected',playerChangeMode?.kind==='substitution')}if(liberoBtn){liberoBtn.disabled=!actionReady;liberoBtn.classList.toggle('selected',playerChangeMode?.kind==='libero')}$$('#actionButtons button').forEach(b=>{if(b.dataset.action!=='Aufschlag')b.disabled=!actionReady});
 updateSyncBadge();updateCameraUi();
}

function middleZonePair(side,pos){
 const own={7:[4,5],8:[3,6],9:[2,1]},opp={9:[1,2],8:[6,3],7:[5,4]};return (side==='opponent'?opp:own)[+pos]||[]
}
function buildCourtButton(side,pos,{target=false,interactive=true}={}){
 const nineZone=detailedCapture(state.pendingSide||activeSide())||((state.inputStep==='WO')&&originMaxZone(state.pendingAction)===9)||((state.inputStep==='TARGET')&&targetMaxZone(state.pendingAction)===9),lineup=lineupForSide(side),ready=matchConfigured();
 const b=document.createElement('button');b.type='button';b.className='pos';b.dataset.zone=String(pos);
 const playerPos=POS.includes(+pos),pid=playerPos?lineup[pos]:'',jersey=playerJerseyForSide(side,pid),abbr=playerLabel(pid);
 if(state.quickScout&&playerPos)b.classList.add('quick-scout-position');
 if(!playerPos){b.classList.add('zone-only');const pair=middleZonePair(side,pos);if(pair.length){b.dataset.nearNet=String(pair[0]);b.dataset.nearBack=String(pair[1])}}
 if(!target){const sel=side==='own'?state.selectedPos===pos:state.selectedOppPos===pos;if(sel&&state.selectedPlayerPos===pos)b.classList.add('selectedpos');if(state.actionZone===pos)b.classList.add('actionzone')}
 else if(state.targetZone===pos&&(!state.targetSide||state.targetSide===side))b.classList.add('targetzone');
 const pair=middleZonePair(side,pos);if(!target&&!playerPos&&pair.length&&state.selectedPlayerPos){if(state.selectedPlayerPos===pair[0])b.classList.add('base-half-near-net');if(state.selectedPlayerPos===pair[1])b.classList.add('base-half-near-back')}
 const hasJersey=!!jersey&&!['–','-'].includes(String(jersey).trim());
 const quickDefaultAbbr=!!(state.quickScout&&playerPos&&pid&&abbr===`P${pos}`);
 const serviceBall=(!target&&playerPos&&side==='own'&&pos===1&&state.servingSide==='us')?'<img class="service-ball" src="./assets/volleyball-service.png" alt="Aufschlag Wir" title="Aufschlag Wir">':'';
 const quickLineClass=quickDefaultAbbr?(hasJersey?' quick-default-abbr-line':' quick-redundant-playerline'):'';
 const abbrClass=quickDefaultAbbr?'pos-abbr quick-default-abbr':'pos-abbr';
 const sepClass=quickDefaultAbbr?'pos-sep quick-default-sep':'pos-sep';
 const playerLine=playerPos?(pid?(hasJersey?`<div class="pos-playerline${quickLineClass}"><strong class="pos-jersey">#${esc(jersey)}</strong><span class="${sepClass}">·</span><span class="${abbrClass}">${esc(abbr)}</span></div>`:`<div class="pos-playerline${quickLineClass}"><span class="${abbrClass}">${esc(abbr)}</span></div>`):''):'<div class="pos-playerline"><span class="pos-abbr">Zone</span></div>';
 const playerName=(!target&&playerPos&&pid)?`<small class="pos-name">${esc(playerFull(pid))}</small>`:'';
 b.innerHTML=`${serviceBall}<strong class="pos-position">${posToken(pos)}</strong>${playerLine}${playerName}`;
 const validZone=nineZone||playerPos;
 const zoneAllowed=playerPos||state.selectedPlayerPos||target;
 const playerChangeBlocked=!!playerChangeMode&&playerChangeMode.side===side&&(!playerPos||(playerChangeMode.kind==='libero'&&![1,5,6].includes(+pos)));
 b.disabled=!interactive||!ready||!validZone||!zoneAllowed||playerChangeBlocked||(!target&&state.inputStep==='TARGET')||(!target&&state.inputStep!=='WO'&&!playerPos);
 if(!target&&interactive&&playerPos){let lpTimer=0,lpFired=false;b.addEventListener('pointerdown',()=>{if(!state.quickScout||state.inputStep==='WO')return;lpFired=false;lpTimer=setTimeout(()=>{lpFired=true;editQuickPlayer(side,pos)},550)});const clearLp=()=>{if(lpTimer){clearTimeout(lpTimer);lpTimer=0}};b.addEventListener('pointerup',clearLp);b.addEventListener('pointercancel',clearLp);b.addEventListener('pointerleave',clearLp);b.addEventListener('contextmenu',e=>{if(state.quickScout&&state.inputStep!=='WO'){e.preventDefault();editQuickPlayer(side,pos)}});b.addEventListener('click',e=>{if(lpFired){e.preventDefault();lpFired=false;return}selectPosition(side,pos)})}
 else if(!target&&interactive)b.addEventListener('click',()=>selectPosition(side,pos));
 else if(target&&interactive)b.addEventListener('click',()=>chooseTargetZone(side,pos));
 return b
}
function drawCourtInto(el,side,{target=false,label='',interactive=true,showNet=true,singleScout=false,netAfter=false}={}){
 if(!el)return;el.innerHTML='';el.dataset.side=side;el.classList.toggle('own',side==='own');el.classList.toggle('opponent',side==='opponent');el.classList.toggle('target-court',target);el.classList.toggle('quick-scout-court',state.quickScout);el.classList.toggle('regular-scout-court',!state.quickScout);const detailed=detailedCapture(state.pendingSide||activeSide()),nineZone=detailed||((state.inputStep==='WO')&&originMaxZone(state.pendingAction)===9)||((state.inputStep==='TARGET')&&targetMaxZone(state.pendingAction)===9);el.classList.toggle('nine-zone',nineZone);el.classList.toggle('inactive-court',!interactive);el.classList.toggle('net-after',!!netAfter);el.classList.toggle('net-before',!netAfter);
 const net=document.createElement('div');net.className='net';net.textContent='NETZ';
 const zones=courtZonesForSide(side,nineZone,{singleScout});
 if(showNet&&!netAfter)el.appendChild(net);
 for(const pos of zones)el.appendChild(buildCourtButton(side,pos,{target,interactive}));
 if(showNet&&netAfter)el.appendChild(net);
 if(label)el.setAttribute('aria-label',label)
}
function drawActiveCourt(){
 const primary=$('#activeCourt'),secondary=$('#secondaryCourt');if(!primary)return;
 const side=state.pendingSide||activeSide(),detail=detailedCapture(side),targetMode=state.inputStep==='TARGET',tSide=targetSideFor(side,state.pendingAction||'');
 const bothScouted=!!state.opponentCapture;
 // RC3: before a match/set is actually ready, the start view must stay a single-court view.
 // The second court is only useful once opponent scouting is active in a prepared match,
 // or temporarily while a target selection needs both court halves.
 const dual=targetMode||(!state.quickScout&&bothScouted&&matchConfigured()&&state.setReady);
 if(dual){
  const activeCaptureSide=side,otherSide=activeCaptureSide==='own'?'opponent':'own';
  const topSide=highlightedFieldIsTop()?activeCaptureSide:otherSide,bottomSide=topSide===activeCaptureSide?otherSide:activeCaptureSide;
  const bothTargetSides=targetMode&&targetAllowsBothSides(state.pendingAction);
  drawCourtInto(primary,topSide,{target:targetMode&&(bothTargetSides||tSide===topSide),interactive:(side===topSide&&!targetMode)||(targetMode&&(bothTargetSides||tSide===topSide)),label:'Oberes Feld',showNet:false});
  drawCourtInto(secondary,bottomSide,{target:targetMode&&(bothTargetSides||tSide===bottomSide),interactive:(side===bottomSide&&!targetMode)||(targetMode&&(bothTargetSides||tSide===bottomSide)),label:'Unteres Feld',showNet:false});secondary.hidden=false;
 }else{
  const markedTop=highlightedFieldIsTop();
  // Markiert oben => Eingabefeld unten gespiegelt, Netz unterhalb. Markiert unten => Eingabefeld oben gespiegelt, Netz oberhalb.
  drawCourtInto(primary,side,{target:false,interactive:true,label:'Aktives Feld',singleScout:true,showNet:true,netAfter:markedTop});
  if(secondary)secondary.hidden=true;
 }
 const wrap=$('#courtWrap');if(wrap)wrap.classList.toggle('dual-court',dual);const sharedNet=$('#sharedNet');if(sharedNet)sharedNet.hidden=!dual;
 const ready=matchConfigured(),lineup=lineupForSide(side);
 $('#captureTitle').textContent=!ready?'Spiel zuerst einrichten':state.matchComplete?'Spiel beendet':!state.setReady?`Satz ${state.setNo} vorbereiten`:playerChangeMode?(playerChangeMode.kind==='libero'?`WER · Libero ${side==='opponent'?'Gegner':'Eigenes Team'} · P1/P6/P5 wählen`:`WER · Wechsel ${side==='opponent'?'Gegner':'Eigenes Team'}`):targetMode?(state.pendingAction==='Zuspiel'?'WOHIN · Zuspiel':'WOHIN · Ballrichtung'):state.inputStep==='WO'?`WO · Aktionszone ${side==='opponent'?'Gegner':'Eigenes Team'}`:`${side==='opponent'?'Gegner':'Eigenes Team'}${lineupHasPlayers(side)?'':' · Startaufstellung fehlt'}`;
 const ri=rotationIndexForSide(activeSide());$('#rotationLabel').textContent=`${activeSide()==='opponent'?'Gegner':'Wir'} · ${ROT[ri]||'R1'}`;
}
function renderSelection(){
 const step=state.inputStep||'WER';const labels=['WER','WAS','WIE','WO','WOHIN'];const visualStep=step==='SETDETAIL'?'WIE':step==='SERVEDETAIL'?'WAS':step==='TARGET'?'WOHIN':step;const stepIndex=labels.indexOf(visualStep);
 document.documentElement.dataset.scoutStep=visualStep.toLowerCase();
 const stepEl=$('#inputStepIndicator');if(stepEl)stepEl.innerHTML=labels.map((x,i)=>`<span class="${x===visualStep?'current':i<stepIndex?'done':''}">${x}${i<stepIndex?' ✓':''}</span>`).join('<b>→</b>');
 const parts=[];if(state.selectedPlayerPos)parts.push(posToken(state.selectedPlayerPos));if(state.pendingAction)parts.push(state.pendingAction);if(state.serveTechnique)parts.push(serveTechniqueLabel(state.serveTechnique));if(state.pendingQuality)parts.push(state.pendingQuality);if(state.actionZone)parts.push(posToken(state.actionZone));if(state.targetZone)parts.push(`→ ${state.targetSide==='opponent'?'Gegner ':state.targetSide==='own'?'Wir ':''}${posToken(state.targetZone)}`);
 $('#selectionLabel').textContent=(parts.join(' · ')||'–');
 const target=step==='TARGET';$('#targetHint').hidden=!target;if(target)$('#targetHint').textContent=targetAllowsBothSides(state.pendingAction)?`${state.pendingAction}: WO ist gespeichert. Jetzt WOHIN – Zielzone im eigenen oder gegnerischen Feld wählen.`:'WO ist gespeichert. Jetzt WOHIN – Zielposition im gegenüberliegenden Feld wählen.';renderServeDetailPanel();renderSetDetailPanel();
 $$('#actionButtons button').forEach(b=>b.classList.toggle('selected',b.dataset.action===state.pendingAction));renderActionAvailability();$$('#qualityButtons button').forEach(b=>b.classList.toggle('selected',b.dataset.quality===state.pendingQuality));
}
function shortcutFor(id){return settings.shortcuts?.[id]||DEFAULT_SHORTCUTS[id]||''}
function updateShortcutHints(){
 const actionIds={'Angriff':'action.attack','Annahme':'action.reception','Aufschlag':'action.serve','Block':'action.block','Abwehr':'action.defense','Zuspiel':'action.set'};
 for(const [name,id] of Object.entries(actionIds)){const b=$(`#actionButtons button[data-action="${name}"]`);if(b)b.title=`Tastenkürzel ${shortcutKeyLabel(shortcutFor(id))}`}
 const qids={'=':'quality.equal','-':'quality.minus','!':'quality.bang','/':'quality.slash','0':'quality.zero','+':'quality.plus','#':'quality.hash'};for(const [q,id] of Object.entries(qids)){const b=$(`#qualityButtons button[data-quality="${CSS.escape(q)}"]`);if(b)b.dataset.shortcut=shortcutKeyLabel(shortcutFor(id))}
 const sub=$('#substituteBtn'),lib=$('#liberoBtn'),own=$('[data-score="us"]'),opp=$('[data-score="them"]'),rot=$('#rotateBtn'),undoBtn=$('#undoBtn'),redoBtn=$('#redoBtn');
 if(sub)sub.title=`Tastenkürzel ${shortcutKeyLabel(shortcutFor('substitution'))}`;if(lib)lib.title=`Tastenkürzel ${shortcutKeyLabel(shortcutFor('libero'))}`;if(own)own.title=`Tastenkürzel ${shortcutKeyLabel(shortcutFor('rally.own'))}`;if(opp)opp.title=`Tastenkürzel ${shortcutKeyLabel(shortcutFor('rally.opponent'))}`;if(rot)rot.title=`Tastenkürzel ${shortcutKeyLabel(shortcutFor('rotation'))}`;if(undoBtn)undoBtn.title=`Tastenkürzel ${shortcutKeyLabel(shortcutFor('undo'))}`;if(redoBtn)redoBtn.title='Zuletzt rückgängig gemachte Aktion wiederherstellen';
}
function opponentServeDirectReady(){return scoutingController.opponentServeDirectReady()}
function renderActionAvailability(){const side=currentCaptureSide();const serve=$('#actionButtons button[data-action="Aufschlag"]');if(!serve)return;const ready=techniqueReady(side),directOpponentServe=opponentServeDirectReady();const allowed=directOpponentServe||(ready&&((side==='own'&&state.servingSide==='us')||(side==='opponent'&&state.servingSide==='them')));serve.disabled=!allowed;serve.title=directOpponentServe?'Gegnerischen Aufschlag direkt erfassen – bei = ohne Annahme sofort Punkt Wir':!ready?'Keine aktive Aufstellung':!state.servingSide?'Aufschlagrecht oben rechts festlegen':allowed?'Aufschlag protokollieren':'Nicht im Aufschlagrecht';}
function renderProtocol(){const body=$('#protocolBody');body.innerHTML='';for(const e of [...events].reverse().slice(0,500)){const tr=document.createElement('tr');const pabbr=eventPlayerAbbreviation(e),pname=eventPlayerName(e);const zone=e.action_zone?` → ${posToken(+e.action_zone)}`:'';tr.innerHTML=`<td>${esc(e.timestamp)}</td><td>${esc(e.set)}</td><td>${esc(e.rotation)}</td><td>${esc(e.player_rotation_position||e.position)}${esc(zone)}</td><td title="${esc(pname)}">${esc(pabbr)}</td><td>${esc(e.action)}</td><td>${qualityChip(e.value)}</td><td>${e.score_us}:${e.score_them}</td>`;body.appendChild(tr)}$('#eventCount').textContent=`${events.length} Einträge`}
function clearPending(msg=true){scoutingController.resetCaptureState();if(msg)setStatus('Scouting-Auswahl verworfen.');render()}
function ensureActionStarted(){return scoutingController.ensureActionStarted()}
function prepareOwnServePreset(){return scoutingController.prepareOwnServePreset()}
function handleScoutingResultError(result){
 if(result?.ok!==false)return false;
 if(result.reason==='ORIGIN_WRONG_SIDE')setStatus('WO: Bitte die Aktionszone im Feld des aktuell gescouteten Teams wählen.');
 else if(result.reason==='ORIGIN_INVALID')setStatus(`WO: Bitte P1–P${result.maxZone||6} auswählen.`);
 else if(result.reason==='WHO_INVALID')setStatus('WER kann nur über P1–P6 gewählt werden. P7–P9 sind Dokumentationszonen.');
 else if(result.reason==='WHO_UNASSIGNED')setStatus(`${posLabel(result.pos)} ist keiner Spielerin zugeordnet.`);
 else if(result.reason==='WHO_REQUIRED')setStatus('Bitte zuerst WER über P1–P6 auswählen.');
 else if(result.reason==='ACTION_REQUIRED')setStatus('Bitte zuerst WAS auswählen.');
 else if(result.reason==='TARGET_WRONG_SIDE')setStatus('Bitte WOHIN im dafür angezeigten Zielfeld wählen.');
 return true
}
function selectPosition(side,pos){
 if(playerChangeMode&&playerChangeMode.side===side){choosePlayerChangePosition(side,pos);return}
 const result=scoutingController.selectPosition(side,pos);if(handleScoutingResultError(result))return;
 if(result.type==='WHO_SELECTED'){setStatus(`${posLabel(result.pos)} als WER gewählt${result.pid?` · ${playerLabel(result.pid)}`:''}.`);render();return}
 if(result.type==='ORIGIN_SELECTED'){setStatus(`${posToken(result.pos)} als Aktionszone gespeichert – jetzt WOHIN wählen.`);render();return}
 if(result.type==='ACTION_COMPLETE'&&result.draft){void handleCompletedScoutingAction(result.draft)}
}
function chooseAction(a){const result=scoutingController.chooseAction(a);if(handleScoutingResultError(result))return;setStatus(result.directOpponentServe?'Gegnerischer Aufschlag gewählt – WIE auswählen. Bei = wird der Aufschlagfehler ohne Annahme direkt als Punkt Wir gespeichert.':a==='Aufschlag'&&result.detailed?`${a} gewählt – WIE auswählen; Aufschlagtechnik ist eine optionale Zusatzangabe.`:`${a} gewählt – WIE auswählen.`);render()}
async function chooseQuality(q){const result=scoutingController.chooseQuality(q);if(result?.ok===false&&result.reason==='WHO_REQUIRED'){setStatus(t('scouting.status.who_required'));return}if(handleScoutingResultError(result))return;if(result.type==='ACTION_COMPLETE'&&result.draft){setStatus(result.immediateServeResult?t('scouting.status.serve_terminal',{side:state.pendingSide==='opponent'?t('common.opponent'):t('common.own'),quality:q}):t('scouting.status.origin_inherited',{zone:`P${result.pos}`}));await handleCompletedScoutingAction(result.draft);return}if(result.inheritedOrigin&&result.nextStep==='WO')setStatus(t('scouting.status.origin_prefilled',{zone:`P${result.pos}`}));else if(result.nextStep==='SETDETAIL')setStatus(t('scouting.status.set_details'));else setStatus(t('scouting.status.choose_origin',{quality:q,max:result.maxZone||6}));render()}
function serveTechniqueLabel(value){return tr(Object.fromEntries(SERVE_TECHNIQUES)[value]||value||'')}
function renderServeDetailPanel(){const el=$('#serveDetailPanel');if(!el)return;const show=state.pendingAction==='Aufschlag'&&detailedCapture(state.pendingSide||activeSide())&&['WIE','WO','TARGET'].includes(state.inputStep);el.hidden=!show;if(!show){el.innerHTML='';return}el.innerHTML=`<div class="set-detail-title">${tr('Aufschlagtechnik')} <span class="detail-optional">optional</span></div><div class="set-detail-buttons compact serve-detail-buttons">${SERVE_TECHNIQUES.map(([v,l])=>`<button type="button" data-serve-technique="${v}" class="${state.serveTechnique===v?'selected':''}">${tr(l)}</button>`).join('')}</div>`;el.querySelectorAll('[data-serve-technique]').forEach(b=>b.onclick=()=>chooseServeTechnique(b.dataset.serveTechnique))}
function chooseServeTechnique(value){scoutingController.chooseServeTechnique(value);setStatus(value?`${serveTechniqueLabel(value)} als Zusatzinformation gesetzt – jetzt WIE auswählen.`:'Aufschlagtechnik bleibt nicht erfasst – jetzt WIE auswählen.');render()}
function renderSetDetailPanel(){const el=$('#setDetailPanel');if(!el)return;const show=state.pendingAction==='Zuspiel'&&detailedCapture(state.pendingSide||activeSide())&&['SETDETAIL','WO','TARGET'].includes(state.inputStep);el.hidden=!show;if(!show){el.innerHTML='';return}el.innerHTML=`<div class="set-detail-title">Zuspiel detailliert</div><div class="set-detail-group"><span>Passhöhe / Tempo</span><div class="set-detail-buttons">${SET_TEMPOS.map(([v,l])=>`<button type="button" data-set-tempo="${v}" class="${state.setTempo===v?'selected':''}">${l}</button>`).join('')}</div></div><div class="set-detail-group"><span>Passweite / Richtung</span><div class="set-detail-buttons compact">${SET_DISTANCES.map(([v,l])=>`<button type="button" data-set-distance="${v}" class="${state.setDistance===v?'selected':''}">${l}</button>`).join('')}</div></div>`;el.querySelectorAll('[data-set-tempo]').forEach(b=>b.onclick=()=>chooseSetDetail('tempo',b.dataset.setTempo));el.querySelectorAll('[data-set-distance]').forEach(b=>b.onclick=()=>chooseSetDetail('distance',b.dataset.setDistance))}
function chooseSetDetail(kind,value){const result=scoutingController.chooseSetDetail(kind,value);if(result.type==='ACTION_COMPLETE'&&result.draft){void handleCompletedScoutingAction(result.draft);return}if(result.type==='SET_DETAILS_COMPLETE')setStatus(result.inheritedOrigin?t('scouting.status.origin_prefilled',{zone:`P${result.pos}`}):t('scouting.status.set_origin'));render()}
function chooseTargetZone(side,pos){const result=scoutingController.selectTargetZone(side,pos);if(result?.reason==='NOT_TARGET_STEP'||result?.reason==='TARGET_INVALID')return;if(handleScoutingResultError(result))return;if(result.type==='ACTION_COMPLETE'&&result.draft)void handleCompletedScoutingAction(result.draft)}

async function handleCompletedScoutingAction(draft){if(!draft)return;const {side,action,quality}=draft,autoWinner=automaticPointFor(side,action,quality),transactionId=newId('tx');const knownBallZone=+draft.targetZone||((action==='Annahme')?+draft.originZone:0),knownBallSide=draft.targetZone?(draft.targetSide||''):(knownBallZone?side:'');state.rallyBallZone=knownBallZone;state.rallyBallSide=knownBallSide;if(side==='opponent')await logOpponent(action,quality,draft,transactionId);else await logOwn(action,quality,draft,transactionId);if(autoWinner)await award(autoWinner,`${action} ${quality}`,true,false,transactionId)}
async function commitPendingAction(allowServeErrorWithoutZone=false){return handleCompletedScoutingAction(scoutingController.buildActionDraft({allowServeErrorWithoutZone}))}

const rallyController=createRallyController({getState:()=>state,newId});
function ensureActiveRally(){return rallyController.ensureActiveRally()}
function nextRallyMeta(kind='action'){return rallyController.nextRallyMeta(kind)}
function closeActiveRally(){return rallyController.closeActiveRally()}
function resetCurrentScouting(){
 const kept={quickScout:state.quickScout,quickOwnName:state.quickOwnName,quickOppName:state.quickOppName,quickPlayers:{...(state.quickPlayers||{})},matchDate:state.matchDate,seasonId:state.seasonId,ownTeamId:state.ownTeamId,oppTeamId:state.oppTeamId,matchTypeId:state.matchTypeId,matchTypeName:state.matchTypeName,matchMode:state.matchMode,fixedSetCount:state.fixedSetCount,fixedFinalSetTarget:state.fixedFinalSetTarget,ownQualityProfile:state.ownQualityProfile,opponentQualityProfile:state.opponentQualityProfile,opponentCapture:state.opponentCapture,allowPositionOnly:state.allowPositionOnly,autoRotate:state.autoRotate,matchId:state.matchId||newId('match')};
 events=[];redoStack=[];
 Object.assign(state,{...kept,setNo:1,setWinsUs:0,setWinsThem:0,firstSetServing:'',setReady:false,matchComplete:false,scoreUs:0,scoreThem:0,rotationIndex:0,oppRotationIndex:0,ownLineup:{},oppLineup:{},ownBaseLineup:{},oppBaseLineup:{},setLineupsOwn:{},setLineupsOpp:{},currentLiberosOwn:[],currentLiberosOpp:[],setLiberosOwn:{},setLiberosOpp:{},selectedPos:0,selectedOppPos:0,pendingSide:null,pendingAction:null,pendingQuality:null,servingSide:'',localClockRunning:false,localClockStartedAt:0,localClockElapsed:0,sessionStartedAt:0,activeTeamContext:'own',syncGeneration:Number(state.syncGeneration||0)+1,currentRallyId:'',currentRallyNo:0,currentRallySeq:0,rallyCounter:0,rallyHighWater:0,rallyStartServing:'',currentRallyPhase:'',currentTransitionNo:1,lastActionSide:'',rallyBallZone:0,rallyBallSide:'',inputStep:'WER',selectedPlayerId:'',selectedPlayerPos:0,actionZone:0,targetZone:0,targetSide:'',actionStartedSeconds:null,actionStartedAt:'',setTempo:'',setDistance:'',serveTechnique:'',autoServePreset:false});
 playerChangeMode=null;cameraAnchor=null;
 csv.write(events).catch(e=>setStatus(`CSV-Reset: ${e.message||e}`));
 if(state.quickScout){state.setReady=true;state.ownLineup=quickLineup('own');state.oppLineup=quickLineup('opponent');state.ownBaseLineup={...state.ownLineup};state.oppBaseLineup={...state.oppLineup};state.setLineupsOwn={'1':{...state.ownLineup}};state.setLineupsOpp={'1':{...state.oppLineup}};state.currentLiberosOwn=[quickLiberoId('own',1),quickLiberoId('own',2)];state.currentLiberosOpp=[quickLiberoId('opponent',1),quickLiberoId('opponent',2)];state.setLiberosOwn={'1':[...state.currentLiberosOwn]};state.setLiberosOpp={'1':[...state.currentLiberosOpp]}}persist();render();drawMatch();setStatus(state.quickScout?'Spontanes Scouting zurückgesetzt · Aufschlagrecht neu festlegen.':'Scouting vollständig zurückgesetzt · Satz 1 bitte neu vorbereiten.');
}
function isTechniqueEvent(r){const a=String(r?.action||'').replace(/^Gegner\s+/,'');return ACTIONS.includes(a)}
function migrateRallyMetadata(rows){
 let activeId='',activeNo=0,seq=0,counter=0;
 for(const r of rows||[]){
  const existingNo=Math.max(0,+r.rally_no||0);if(existingNo)counter=Math.max(counter,existingNo);
  const isAction=isTechniqueEvent(r),isResult=r.event_type==='rally_result'||r.event_type==='point'||r.action==='Punkt wir'||r.action==='Punkt Gegner';
  if(isAction){
   if(r.rally_id){activeId=r.rally_id;activeNo=existingNo||activeNo||++counter;seq=Math.max(seq,+r.rally_sequence||0)}
   else if(!activeId){activeId=`rally_legacy_${r.id||newId('evt')}`;activeNo=++counter;seq=0}
   seq++;r.rally_id=r.rally_id||activeId;r.rally_no=r.rally_no||String(activeNo);r.rally_sequence=r.rally_sequence||String(seq);r.rally_event=r.rally_event||'action';
  }else if(isResult){
   if(!activeId){activeId=r.rally_id||`rally_legacy_${r.id||newId('evt')}`;activeNo=existingNo||++counter;seq=0}
   seq++;r.rally_id=r.rally_id||activeId;r.rally_no=r.rally_no||String(activeNo);r.rally_sequence=r.rally_sequence||String(seq);r.rally_event=r.rally_event||'result';r.rally_winner=r.rally_winner||(r.action==='Punkt wir'?'us':r.action==='Punkt Gegner'?'them':'');
   activeId='';activeNo=0;seq=0;
  }
  if(r.event_type==='set_end'||r.action==='Satzende'){activeId='';activeNo=0;seq=0}
 }
 state.rallyCounter=Math.max(state.rallyCounter||0,counter);state.rallyHighWater=Math.max(state.rallyHighWater||0,state.rallyCounter||0,counter);return rows
}

async function appendEvent(pos,abbr,action,value,note='',extra={}){
 if(redoStack.length)redoStack=[];
 const endSec=currentSeconds(),eventSide=extra?.rotation_side||(String(action||'').startsWith('Gegner ')?'opponent':'own');
 const stamp=now();
 const e=buildScoutingEvent({id:newId('evt'),video:state.cameraRecording?(camera?.device?.name||cameraDefaultName()):'',videoClipId:state.cameraRecording?(state.videoClipId||''):'',endSeconds:endSec,formatSeconds:fmt,completedAt:stamp,createdAt:stamp,setNo:state.setNo,matchMode:state.matchMode,fixedSetCount:state.fixedSetCount,fixedFinalSetTarget:state.fixedFinalSetTarget,rotation:ROT[rotationIndexForSide(eventSide)]||'R1',position:pos,player:abbr,action,value,scoreUs:state.scoreUs,scoreThem:state.scoreThem,note,extra});
 events.push(e);if(state.quickScoutDraft)state.quickScoutDraft=false;await csv.write(events);persist();renderProtocol();return e
}
async function award(who,source='',auto=false,forceSideout=false,transactionId=''){
 if(!setScoutingReady()){setStatus('Bitte zuerst den aktuellen Satz vorbereiten und das Aufschlagrecht festlegen.');return}
 const transition=scorePointTransition({winner:who,scoreUs:state.scoreUs,scoreThem:state.scoreThem,servingSide:state.servingSide,forceSideout});const before=transition.servingBefore,isSideout=transition.sideout;const groupId=transactionId||newId('tx');const rallyMeta=nextRallyMeta('result');state.scoreUs=transition.scoreUs;state.scoreThem=transition.scoreThem;state.servingSide=transition.servingAfter;
 const setWinner=winningSideForScore();
 await appendEvent('','',who==='us'?'Punkt wir':'Punkt Gegner',auto?'auto':'manuell',source,{event_type:'rally_result',rally_winner:who,serving_before:before||'',serving_after:who,sideout:isSideout?'1':'0',event_group:groupId,transaction_id:groupId,set_wins_us:String(state.setWinsUs),set_wins_them:String(state.setWinsThem),...rallyMeta});
 if(isSideout&&state.autoRotate&&!setWinner)await rotate(1,true,who==='us'?'own':'opponent',groupId);
 closeActiveRally();if(!setWinner&&who==='us')prepareOwnServePreset();persist();render();if(setWinner)await finishSet(setWinner,groupId);else setStatus(`Rally ${rallyMeta.rally_no} beendet · Punkt ${who==='us'?'Wir':'Gegner'}.`)
}
function rallyContextForAction(side){return rallyController.contextForAction(side)}
function markActionSide(side){return rallyController.markActionSide(side)}
async function logOwn(action,value,draft=null,transactionId=''){
 const pid=draft?.playerId??state.selectedPlayerId??'',source=draft?.playerPosition??state.selectedPlayerPos,zone=draft?.originZone??state.actionZone,target=draft?.targetZone??state.targetZone;if(!pid&&!state.allowPositionOnly){setStatus(`${posLabel(source)} ist keiner Spielerin zugeordnet.`);return}
 const groupId=transactionId||newId('tx'),ctx=rallyContextForAction('own'),rallyMeta=nextRallyMeta('action'),abbr=pid?playerLabel(pid):'',full=pid?playerFull(pid):'';
 const extra=buildPlayerActionExtra({side:'own',playerId:pid,playerAbbreviation:abbr,playerName:full,playerPosition:source,originZone:zone,targetZone:target,targetSide:draft?.targetSide??state.targetSide,action,serveTechnique:draft?.serveTechnique??state.serveTechnique,setTempo:draft?.setTempo??state.setTempo,setDistance:draft?.setDistance??state.setDistance,qualityLevel:qualityLevel(value,action),qualityProfile:draft?.qualityProfile||qualityProfileForSide('own'),eventGroup:groupId,transactionId:groupId,actionStartedSeconds:draft?.actionStartedSeconds??state.actionStartedSeconds,actionStartedAt:draft?.actionStartedAt??state.actionStartedAt,context:ctx,rallyMeta});
 await appendEvent(source,playerLabel(pid),action,value,$('#noteInput').value.trim(),extra);markActionSide('own');clearPending(false);setStatus(`${posLabel(source)} · ${action} · ${value} · ${posToken(zone)}${target?` → ${posToken(target)}`:''} protokolliert · Rally ${rallyMeta.rally_no} läuft.`)
}
async function logOpponent(action,value,draft=null,transactionId=''){
 const pid=draft?.playerId??state.selectedPlayerId??'',source=draft?.playerPosition??state.selectedPlayerPos,zone=draft?.originZone??state.actionZone,target=draft?.targetZone??state.targetZone;
 const groupId=transactionId||newId('tx'),ctx=rallyContextForAction('opponent'),rallyMeta=nextRallyMeta('action'),abbr=pid?playerLabel(pid):'',full=pid?playerFull(pid):'';
 const extra=buildPlayerActionExtra({side:'opponent',playerId:pid,playerAbbreviation:abbr,playerName:full,playerPosition:source,originZone:zone,targetZone:target,targetSide:draft?.targetSide??state.targetSide,action,serveTechnique:draft?.serveTechnique??state.serveTechnique,setTempo:draft?.setTempo??state.setTempo,setDistance:draft?.setDistance??state.setDistance,qualityLevel:qualityLevel(value,action),qualityProfile:draft?.qualityProfile||qualityProfileForSide('opponent'),eventGroup:groupId,transactionId:groupId,actionStartedSeconds:draft?.actionStartedSeconds??state.actionStartedSeconds,actionStartedAt:draft?.actionStartedAt??state.actionStartedAt,context:ctx,rallyMeta});
 await appendEvent(source,playerLabel(pid),`Gegner ${action}`,value,'Gegner',extra);markActionSide('opponent');clearPending(false);setStatus(`Gegner ${posLabel(source)} · ${action} · ${value} · ${posToken(zone)}${target?` → ${posToken(target)}`:''} protokolliert · Rally ${rallyMeta.rally_no} läuft.`)
}
async function finishOpponentAttack(target){const result=scoutingController.selectTargetZone(targetSideFor(state.pendingSide,state.pendingAction),target);return result?.draft?handleCompletedScoutingAction(result.draft):undefined}

async function rotate(dir=1,log=true,side=null,eventGroup=''){
 if(!matchConfigured()){setStatus('Bitte zuerst das Spiel einrichten.');return}
 side=side||activeSide();const own=side==='own';
 const t=rotationTransition({lineup:lineupForSide(side),rotationIndex:rotationIndexForSide(side),dir});
 // I–VI/P1–P6 sind feste Feldpositionen. Nur Spieler-ID, Trikotnummer und Name wandern.
 if(own){state.ownLineup=t.lineupAfter;state.rotationIndex=t.indexAfter}else{state.oppLineup=t.lineupAfter;state.oppRotationIndex=t.indexAfter}
 persist();render();
 if(log)await appendEvent('','',`${own?'':'Gegner '}${dir>0?'Rotation weiter':'Rotation zurück'}`,ROT[t.indexAfter],'',{rotation_side:side,rotation_index_before:String(t.indexBefore),rotation_index_after:String(t.indexAfter),lineup_before:JSON.stringify(t.lineupBefore),lineup_after:JSON.stringify(t.lineupAfter),event_group:eventGroup||newId('grp')});
 setStatus(`${own?'Eigenes Team':'Gegner'} · ${ROT[t.indexAfter]} · Rotation ${dir>0?'weiter':'zurück'}.`)
}
async function sideout(){await award('us','Side-out manuell',false,true)}
async function finishSet(winner,eventGroup=''){
 const finished=state.setNo,finalScore=`${state.scoreUs}:${state.scoreThem}`;
 const setWins=setWinTransition({winner,setWinsUs:state.setWinsUs,setWinsThem:state.setWinsThem});state.setWinsUs=setWins.setWinsUs;state.setWinsThem=setWins.setWinsThem;
 const clockWarning=await stopLiveTimeAtBoundary();
 await appendEvent('','', 'Satzende', `${winner==='us'?'Wir':'Gegner'} ${finalScore}`,'',{event_type:'set_end',set_winner:winner,set_wins_us:String(state.setWinsUs),set_wins_them:String(state.setWinsThem),event_group:eventGroup||newId('grp')});
 if(isMatchFinishedAfterSet(finished,state.setWinsUs,state.setWinsThem)){Object.assign(state,matchFinishedTransition());persist();render();setStatus(`Spiel beendet · Sätze ${state.setWinsUs}:${state.setWinsThem}. Livezeit gestoppt.${clockWarning}`);return}
 Object.assign(state,nextSetTransition({finishedSet:finished}));closeActiveRally();persist();render();setStatus(`Satz ${finished} beendet · Sätze ${state.setWinsUs}:${state.setWinsThem}. Livezeit gestoppt · Startaufstellung für Satz ${state.setNo} festlegen.${clockWarning}`);setTimeout(()=>startSetSetup(),180)
}
function setLiberosForSide(side){return side==='opponent'?(state.currentLiberosOpp||[]):(state.currentLiberosOwn||[])}
function setLineupAndLiberos(side,lineup,liberos){
 const t=setLineupTransition({side,lineup,liberos,setNo:state.setNo}),key=String(state.setNo);
 if(side==='own'){
  Object.assign(state,{ownLineup:t.ownLineup,ownBaseLineup:t.ownBaseLineup,currentLiberosOwn:t.currentLiberosOwn,rotationIndex:t.rotationIndex});state.setLineupsOwn[key]=t.setLineupsOwn.lineup;state.setLiberosOwn[key]=t.setLiberosOwn.liberos;
 }else{
  Object.assign(state,{oppLineup:t.oppLineup,oppBaseLineup:t.oppBaseLineup,currentLiberosOpp:t.currentLiberosOpp,oppRotationIndex:t.oppRotationIndex});state.setLineupsOpp[key]=t.setLineupsOpp.lineup;state.setLiberosOpp[key]=t.setLiberosOpp.liberos;
 }
}
function startSetSetup(){
 if(!matchConfigured()){setStatus('Bitte zuerst das Spiel einrichten.');return}
 if(state.matchComplete){setStatus('Das Spiel ist bereits beendet.');return}
 if(state.quickScout){Object.assign(state,beginSetSetupTransition({quickScout:true,ownLineup:quickLineup('own'),oppLineup:quickLineup('opponent')}));closeActiveRally();persist();render();completeSetStart();return}
 // Die Satzvorbereitung arbeitet vollständig auf einer temporären Kopie. Erst nach
 // Abschluss aller benötigten Dialoge wird der Spielzustand verändert.
 const snapshot={
  ownLineup:{...state.ownLineup},oppLineup:{...state.oppLineup},
  ownLiberos:[...(state.currentLiberosOwn||state.setLiberosOwn?.[String(state.setNo)]||[])],
  oppLiberos:[...(state.currentLiberosOpp||state.setLiberosOpp?.[String(state.setNo)]||[])],
  setReady:state.setReady,servingSide:state.servingSide,rotationIndex:state.rotationIndex,oppRotationIndex:state.oppRotationIndex
 };
 const draft={ownLineup:{...snapshot.ownLineup},oppLineup:{...snapshot.oppLineup},ownLiberos:[...snapshot.ownLiberos],oppLiberos:[...snapshot.oppLiberos]};
 const cancelSetup=()=>{setStatus(`Satz ${state.setNo}: Vorbereitung abgebrochen · vorhandene Aufstellung unverändert.`)};
 editLineup('own',result=>{
  draft.ownLineup={...result.lineup};draft.ownLiberos=[...result.liberos];
  if(state.opponentCapture&&state.oppTeamId){
   setStatus(`Startaufstellung Gegner · Satz ${state.setNo}`);
   setTimeout(()=>editLineup('opponent',oppResult=>{draft.oppLineup={...oppResult.lineup};draft.oppLiberos=[...oppResult.liberos];commitSetSetupDraft(draft)}, {draftOnly:true,lineup:draft.oppLineup,liberos:draft.oppLiberos,onCancel:cancelSetup}),40)
  }else commitSetSetupDraft(draft)
 }, {draftOnly:true,lineup:draft.ownLineup,liberos:draft.ownLiberos,onCancel:cancelSetup})
}
function commitSetSetupDraft(draft){
 state.setReady=false;state.rotationIndex=0;state.oppRotationIndex=0;state.servingSide='';closeActiveRally();playerChangeMode=null;
 setLineupAndLiberos('own',draft.ownLineup,draft.ownLiberos);
 if(state.opponentCapture)setLineupAndLiberos('opponent',draft.oppLineup,draft.oppLiberos);else{state.oppLineup={};state.oppBaseLineup={};state.currentLiberosOpp=[]}
 persist();render();finalizeSetSetup()
}
function finalizeSetSetup(){
 // Das Aufschlagrecht wird ausschließlich über den bereits vorhandenen Schalter
 // "Aufschlag: – / Wir / Gegner" oben rechts festgelegt. Keine zusätzliche Abfrage.
 completeSetStart()
}
async function completeSetStart(){
 closeActiveRally();state.setReady=true;state.matchComplete=false;state.setLineupsOwn[String(state.setNo)]={...state.ownLineup};state.setLiberosOwn[String(state.setNo)]=[...(state.currentLiberosOwn||[])];if(state.opponentCapture){state.setLineupsOpp[String(state.setNo)]={...state.oppLineup};state.setLiberosOpp[String(state.setNo)]=[...(state.currentLiberosOpp||[])]}
 await appendEvent('','','Satzstart',`Satz ${state.setNo}`,'',{event_type:'set_start',serving_before:'',serving_after:state.servingSide,set_wins_us:String(state.setWinsUs),set_wins_them:String(state.setWinsThem),own_lineup:JSON.stringify(state.ownLineup),opp_lineup:JSON.stringify(state.opponentCapture?state.oppLineup:{}),own_liberos:JSON.stringify(state.currentLiberosOwn||[]),opp_liberos:JSON.stringify(state.opponentCapture?(state.currentLiberosOpp||[]):[]),rotation_side:'own',event_group:newId('grp')});if(state.servingSide==='us')prepareOwnServePreset();persist();render();setStatus(`Satz ${state.setNo} gestartet · Aufschlagrecht ${state.servingSide==='us'?'Wir':state.servingSide==='them'?'Gegner':'noch nicht festgelegt'} (oben rechts auswählbar).`)
}
function rosterRowsForSide(side){if(state.quickScout){ensureQuickPlayers();return Object.values(state.quickPlayers).filter(p=>p.side===side).map(p=>({playerId:p.id,role:p.defaultRole||'',jersey:p.defaultJersey||'',active:true,quick:true}))}const tid=side==='opponent'?state.oppTeamId:state.ownTeamId;let rows=matchRosterRows(tid,state.seasonId,state.matchTypeId);if(!rows.length)rows=seasonRosterRows(tid,state.seasonId);return rows}
function currentSetEvents(side,type='substitution'){return events.filter(r=>(+r.set||1)===state.setNo&&r.event_type===type&&(r.rotation_side||'own')===side)}
function substitutionPairs(side){
 const pairs=[];
 for(const r of currentSetEvents(side,'substitution')){
  const out=r.player_out_id,inId=r.player_in_id;if(!out||!inId)continue;
  const returning=[...pairs].reverse().find(p=>!p.closed&&p.substitute===out&&p.starter===inId);
  if(returning){returning.closed=true;returning.active='starter';continue}
  pairs.push({starter:out,substitute:inId,closed:false,active:'substitute'})
 }
 return pairs
}
function openLiberoPairs(side){
 const open=[];
 for(const r of currentSetEvents(side,'libero_replacement')){
  const out=r.player_out_id,inId=r.player_in_id;if(!out||!inId)continue;
  const outLib=isLiberoRole(player(out)?.defaultRole||rosterRowsForSide(side).find(x=>x.playerId===out)?.role);
  const inLib=isLiberoRole(player(inId)?.defaultRole||rosterRowsForSide(side).find(x=>x.playerId===inId)?.role);
  if(!outLib&&inLib){open.push({regular:out,libero:inId})}
  else if(outLib&&inLib){const pair=[...open].reverse().find(x=>x.libero===out);if(pair)pair.libero=inId}
  else if(outLib&&!inLib){const i=[...open].map((x,j)=>[x,j]).reverse().find(([x])=>x.libero===out&&x.regular===inId)?.[1];if(i!==undefined)open.splice(i,1)}
 }
 return open
}
function pickRow(r,kind='substitution',selectedId=''){
 const p=player(r.playerId);if(!p)return '';const j=String(r.jersey??p.defaultJersey??'').trim();
 const role=kind==='libero'?'Libero':String(r.role||p.defaultRole||'').trim();
 return `<label class="player-pick-row ${kind==='libero'?'is-libero':''}"><input type="radio" name="inId" value="${esc(p.id)}" ${p.id===selectedId?'checked':''} required data-change-kind="${kind}"><span class="player-pick-main"><span class="player-pick-id">${j?`<strong>#${esc(j)}</strong> · `:''}<strong>${esc(p.abbreviation||'')}</strong></span><span class="player-pick-name">${esc(p.firstName||'')} ${esc(p.lastName||'')}</span></span>${role?`<span class="player-pick-role">${esc(role)}</span>`:''}</label>`
}
function beginPlayerChange(kind){
 const side=activeSide();
 if(!matchConfigured()||state.matchComplete||!lineupHasPlayers(side)){setStatus('Bitte zuerst eine aktive Aufstellung wählen.');return}
 scoutingController.resetCaptureState();state.selectedPos=0;state.selectedOppPos=0;state.pendingSide=null;state.pendingAction=null;state.pendingQuality=null;state.inputStep='WER';playerChangeMode={kind,side};render();
 setStatus(kind==='libero'?t('libero.select_backrow'):`Wechsel: WER über Position I–VI wählen.`)
}
function choosePlayerChangePosition(side,pos){
 const mode=playerChangeMode;if(!mode||mode.side!==side)return;if(mode.kind==='libero'&&![1,5,6].includes(+pos)){playerChangeMode=null;setStatus(t('libero.backrow_only'));return}
 const lineup=lineupForSide(side),outId=lineup[pos];if(!outId){playerChangeMode=null;setStatus(`${posLabel(pos)} ist keiner Spielerin zugeordnet.`);return}
 const roster=rosterRowsForSide(side),onCourt=new Set(Object.values(lineup).filter(Boolean)),offCourt=roster.filter(r=>r.playerId&&r.playerId!==outId&&!onCourt.has(r.playerId));
 const outJ=playerJerseyForSide(side,outId),outPrefix=outJ&&outJ!=='–'&&outJ!=='-'?`#${esc(outJ)} · `:'';
 let regularRows=[],liberoRows=[],returnOnly=false;
 let preferredLibero='';
 if(mode.kind==='libero'){
  const pairs=openLiberoPairs(side),returnPair=[...pairs].reverse().find(p=>p.libero===outId&&!onCourt.has(p.regular));
  if(returnPair){const rr=roster.find(r=>r.playerId===returnPair.regular);if(rr)regularRows=[rr]}
  liberoRows=offCourt.filter(r=>isLiberoRole(r.role||player(r.playerId)?.defaultRole));
  const lastUsed=[...currentSetEvents(side,'libero_replacement')].reverse().map(r=>r.player_in_id).find(id=>id&&isLiberoRole(player(id)?.defaultRole||roster.find(x=>x.playerId===id)?.role));
  const setPreferred=(setLiberosForSide(side)||[]).find(Boolean);preferredLibero=liberoRows.some(r=>r.playerId===lastUsed)?lastUsed:(liberoRows.some(r=>r.playerId===setPreferred)?setPreferred:(liberoRows[0]?.playerId||''));
  returnOnly=!!returnPair&&!liberoRows.length;
 }else{
  const pairs=substitutionPairs(side),open=[...pairs].reverse().find(p=>!p.closed&&p.substitute===outId),used=new Set(pairs.flatMap(p=>[p.starter,p.substitute]));
  const alreadyUsed=pairs.some(p=>p.starter===outId||p.substitute===outId);
  if(open){const rr=roster.find(r=>r.playerId===open.starter&&!onCourt.has(r.playerId));if(rr)regularRows=[rr],returnOnly=true}
  else if(!alreadyUsed)regularRows=offCourt.filter(r=>!isLiberoRole(r.role||player(r.playerId)?.defaultRole)&&!used.has(r.playerId));
  if([1,5,6].includes(+pos)){liberoRows=offCourt.filter(r=>isLiberoRole(r.role||player(r.playerId)?.defaultRole))}
 }
 regularRows=sortPlayerSelectionRows(regularRows,side);liberoRows=sortPlayerSelectionRows(liberoRows,side);
 if(!regularRows.length&&!liberoRows.length){playerChangeMode=null;setStatus(mode.kind==='libero'?t('libero.none_available'):returnOnly?'Für diesen Rückwechsel ist die zugehörige Spielerin derzeit nicht verfügbar.':'Keine regelkonform verfügbare Spielerin für diesen Wechsel vorhanden.');return}
 let list='';
 if(regularRows.length)list+=`<div class="player-pick-list">${regularRows.map(r=>pickRow(r,'substitution')).join('')}</div>`;
 if(liberoRows.length)list+=`${regularRows.length?'<div class="player-pick-divider"><span>Liberos</span></div>':'<div class="player-pick-heading">Liberos</div>'}<div class="player-pick-list">${liberoRows.map(r=>pickRow(r,'libero',preferredLibero)).join('')}</div>`;
 playerChangeMode=null;
 modal(`${mode.kind==='libero'?'Libero':'Wechsel'} · ${posLabel(pos)}`,`<div class="player-change-summary"><strong>Raus:</strong> ${outPrefix}<strong>${esc(playerLabel(outId))}</strong> · ${esc(playerFull(outId))}</div>${returnOnly?'<p class="small">Für diese Spielerin ist in diesem Satz nur der zugehörige Rücktausch möglich.</p>':mode.kind==='libero'&&isLiberoRole(player(outId)?.defaultRole||roster.find(x=>x.playerId===outId)?.role)?`<p class="small">${esc(t('libero.direct_swap_hint'))}</p>`:''}<div class="player-pick-heading">Rein</div>${list}`,fd=>{const inId=fd.get('inId');const chosen=roster.find(r=>r.playerId===inId);const chosenKind=mode.kind==='libero'?'libero':(chosen&&isLiberoRole(chosen.role||player(inId)?.defaultRole)?'libero':'substitution');return performPlayerChange(chosenKind,side,pos,outId,inId)},mode.kind==='libero'?t('libero.apply'):'Wechsel übernehmen')
}
async function performPlayerChange(kind,side,pos,outId,inId){
 if(!inId||outId===inId)return;const before={...lineupForSide(side)},after={...before,[pos]:inId};if(side==='own')state.ownLineup=after;else state.oppLineup=after;state.selectedPos=0;state.selectedOppPos=0;state.pendingSide=null;state.pendingAction=null;state.pendingQuality=null;playerChangeMode=null;
 const outJ=playerJerseyForSide(side,outId),inJ=playerJerseyForSide(side,inId),groupId=newId('grp');
 await appendEvent(pos,playerLabel(inId),`${side==='opponent'?'Gegner ':''}${kind==='libero'?'Libero':'Wechsel'}`,`#${outJ} → #${inJ}`,'',{event_type:kind==='libero'?'libero_replacement':'substitution',rotation_side:side,player_id:inId,player_abbreviation:playerLabel(inId),player_name:playerFull(inId),player_out_id:outId,player_in_id:inId,player_out_jersey:outJ,player_in_jersey:inJ,lineup_before:JSON.stringify(before),lineup_after:JSON.stringify(after),set_wins_us:String(state.setWinsUs),set_wins_them:String(state.setWinsThem),event_group:groupId});persist();render();setStatus(`${kind==='libero'?'Libero':'Wechsel'} ${side==='opponent'?'Gegner':'Wir'} · ${posLabel(pos)} · #${outJ} → #${inJ}.`)
}
function reconstruct(rows,{persistResult=true,renderResult=true}={}){
 migrateRallyMetadata(rows);
 const rebuilt=reconstructMatchState(rows,{rotationLabels:ROT,firstSetServing:state.firstSetServing||'',rallyCounter:state.rallyCounter||0,rallyHighWater:state.rallyHighWater||0,setLiberosOwn:state.setLiberosOwn||{},setLiberosOpp:state.setLiberosOpp||{},isTechniqueEvent,servingForSet,isMatchFinishedAfterSet});
 Object.assign(state,rebuilt);
 const activeBall=[...(rows||[])].reverse().find(r=>state.currentRallyId&&r.rally_id===state.currentRallyId&&isTechniqueEvent(r)&&+r.target_zone>0);state.rallyBallZone=activeBall?+activeBall.target_zone:0;state.rallyBallSide=activeBall?(activeBall.target_side||''):'';
 if(persistResult)persist();if(renderResult)render()
}
function restoreSessionAfterReload(){
 if(!events.length||!matchConfigured())return false;
 const saved={servingSide:state.servingSide,setReady:state.setReady,ownLineup:{...state.ownLineup},oppLineup:{...state.oppLineup},ownBaseLineup:{...state.ownBaseLineup},oppBaseLineup:{...state.oppBaseLineup}};
 const hasSetStart=events.some(r=>r.event_type==='set_start'||r.action==='Satzstart');
 if(hasSetStart){
  reconstruct(events,{persistResult:false,renderResult:false});
  // Das Aufschlagrecht kann nach Satzstart über den Header gesetzt worden sein und ist
  // deshalb nicht zwingend als eigenes Event vorhanden. In diesem Fall gilt der
  // persistierte Session-Snapshot als Ergänzung zum Eventstrom.
  if(!state.servingSide&&saved.servingSide)state.servingSide=saved.servingSide;
 }else{
  // Rückwärtskompatibilität für Sessions aus älteren Revisionen ohne Satzstart-Event.
  state.ownLineup={...saved.ownLineup};state.oppLineup={...saved.oppLineup};state.ownBaseLineup={...saved.ownBaseLineup};state.oppBaseLineup={...saved.oppBaseLineup};
  if(!state.setReady&&lineupHasPlayers('own')&&(!state.opponentCapture||lineupHasPlayers('opponent')))state.setReady=true;
 }
 saveState({...state,selectedPos:0,selectedOppPos:0,pendingSide:null,pendingAction:null,pendingQuality:null,inputStep:'WER',selectedPlayerId:'',selectedPlayerPos:0,actionZone:0,targetZone:0,targetSide:'',actionStartedSeconds:null,actionStartedAt:'',setTempo:'',setDistance:'',serveTechnique:'',autoServePreset:false});
 return true;
}
async function undo(){
 if(!events.length)return;
 const result=undoEventBatch(events);events=result.events;const removed=result.removed;if(!removed.length)return;redoStack.push(removed);
 // Der sichtbare Zustand wird immer aus dem verbleibenden Eventstrom rekonstruiert.
 reconstruct(events);
 await csv.write(events);persist();render();setStatus(`${removed.length>1?'Letzte Aktion':'Letzten Eintrag'} inklusive Spielzustand zurückgenommen · Redo verfügbar.`)
}
async function redo(){
 if(!redoStack.length)return;
 const batch=redoStack.pop();events=restoreEventBatch(events,batch);reconstruct(events);
 await csv.write(events);persist();render();setStatus(`${batch.length>1?'Letzte Aktion':'Letzten Eintrag'} wiederhergestellt.`)
}

function openDrawer(view='match'){$('#drawerBackdrop').hidden=false;$$('#drawerNav [data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view===view));const map={match:'🏐 Spiel',players:'👥 Spielerinnen',teams:'🛡️ Teams',seasons:'📅 Saisons',rosters:'📋 Kader',data:'📄 Daten / CSV',camera:'📷 Kamera',sync:'☁️ Synchronisation',analysis:'📊 Analyse',settings:'⚙️ Einstellungen'};$('#drawerTitle').textContent=map[view]||'Menü';({match:drawMatch,players:drawPlayers,teams:drawTeams,seasons:drawSeasons,rosters:drawRosters,data:drawData,camera:drawCamera,sync:drawSync,analysis:drawAnalysis,settings:drawSettings}[view]||(()=>{}))()}
function closeDrawer(){matchEditorOpen=false;matchEditorMode='';$('#drawerBackdrop').hidden=true}
function modal(title,html,onSubmit,ok='Übernehmen',onCancel=null){$('#dialogTitle').textContent=title;$('#dialogBody').innerHTML=html;$('#dialogOk').textContent=ok;modalSubmit=onSubmit;modalCancel=onCancel;$('#dialogBackdrop').hidden=false;setTimeout(()=>$('#dialogBody input, #dialogBody select')?.focus(),20)}
function closeModal(runCancel=true){const cancel=modalCancel;$('#dialogBackdrop').hidden=true;modalSubmit=null;modalCancel=null;if(runCancel&&cancel)cancel()}
const opts=(rows,sel='',label=x=>x.name)=>rows.map(x=>`<option value="${x.id}" ${x.id===sel?'selected':''}>${esc(label(x))}</option>`).join('');

function drawPlayers(){const b=$('#drawerBody'),sort=settings.ui.playersTableSort||{key:'abbreviation',direction:'asc'},coll=new Intl.Collator(settings.ui?.language||'de',{numeric:true,sensitivity:'base'});const rows=[...master.players].sort((a,b)=>{let av='',bv='';if(sort.key==='name'){av=`${a.firstName||''} ${a.lastName||''}`;bv=`${b.firstName||''} ${b.lastName||''}`}else if(sort.key==='jersey'){const an=/^\d+$/.test(String(a.defaultJersey||'').trim())?Number(a.defaultJersey):Number.POSITIVE_INFINITY,bn=/^\d+$/.test(String(b.defaultJersey||'').trim())?Number(b.defaultJersey):Number.POSITIVE_INFINITY;if(an!==bn)return (an-bn)*(sort.direction==='desc'?-1:1);av=String(a.defaultJersey||'');bv=String(b.defaultJersey||'')}else{av=String(a.abbreviation||'');bv=String(b.abbreviation||'')}const cmp=coll.compare(av,bv)||coll.compare(String(a.abbreviation||''),String(b.abbreviation||''))||coll.compare(String(a.firstName||''),String(b.firstName||''))||coll.compare(String(a.lastName||''),String(b.lastName||''));return cmp*(sort.direction==='desc'?-1:1)});const head=(label,key)=>`<button type="button" class="table-sort${sort.key===key?' active':''}" data-player-sort="${key}" aria-label="${label} sortieren">${label}<span aria-hidden="true">${sort.key===key?(sort.direction==='asc'?'▲':'▼'):'↕'}</span></button>`;b.innerHTML=`<div class="toolbar"><button class="primary" id="addPlayer">+ Spielerin</button><button id="toggleInactivePlayers">Inaktive anzeigen</button></div><table class="data-table"><thead><tr><th>${head('Kürzel','abbreviation')}</th><th>${head('Name','name')}</th><th>${head('Nr.','jersey')}</th><th>Position</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(p=>`<tr class="${p.active===false?'inactive':''}" data-id="${p.id}"><td>${esc(p.abbreviation)}</td><td>${esc(p.firstName)} ${esc(p.lastName)}</td><td>${esc(p.defaultJersey||'')}</td><td>${esc(p.defaultRole||'')}</td><td>${p.active===false?'inaktiv':'aktiv'}</td><td><button data-edit>✎</button> <button data-toggle>${p.active===false?'↺':'⏸'}</button></td></tr>`).join('')}</tbody></table>`;$('#addPlayer').onclick=()=>editPlayer();b.querySelectorAll('[data-player-sort]').forEach(btn=>btn.onclick=()=>{const key=btn.dataset.playerSort;settings.ui.playersTableSort={key,direction:sort.key===key&&sort.direction==='asc'?'desc':'asc'};saveSettings(settings);drawPlayers()});b.querySelectorAll('[data-edit]').forEach(x=>x.onclick=()=>editPlayer(x.closest('tr').dataset.id));b.querySelectorAll('[data-toggle]').forEach(x=>x.onclick=()=>{const p=player(x.closest('tr').dataset.id);p.active=p.active===false;Object.assign(p,touched(p));persist();drawPlayers()})}
function suggestedAbbreviation(first,last,excludeId=''){
 const f=String(first||'').trim().replace(/[^\p{L}\p{N}]/gu,''),l=String(last||'').trim().replace(/[^\p{L}\p{N}]/gu,'');if(!f&&!l)return '';
 const candidates=[];const push=v=>{v=String(v||'').toUpperCase();if(v&&!candidates.includes(v))candidates.push(v)};
 push((f[0]||'')+(l[0]||''));for(let n=2;n<=Math.min(6,l.length);n++)push((f[0]||'')+l.slice(0,n));for(let n=2;n<=Math.min(4,f.length);n++)push(f.slice(0,n)+(l[0]||''));push((f+l).slice(0,8));
 const used=new Set(master.players.filter(x=>x.id!==excludeId).map(x=>String(x.abbreviation||'').toUpperCase()));return candidates.find(x=>!used.has(x))||`${(f[0]||'X')}${(l[0]||'X')}${master.players.length+1}`.slice(0,8)
}
function editPlayer(id){
 const p=id?player(id):{id:newId('plr'),firstName:'',lastName:'',abbreviation:'',defaultJersey:'',defaultRole:'',active:true,revision:0};
 modal(id?'Spielerin bearbeiten':'Spielerin anlegen',`<p class="save-hint">Änderungen werden erst mit <strong>Speichern</strong> übernommen.</p><label>Vorname <input name="first" value="${esc(p.firstName)}" required></label><label>Nachname <input name="last" value="${esc(p.lastName)}" required></label><label>Kürzel <input name="abbr" value="${esc(p.abbreviation)}" required maxlength="8"><small class="abbr-hint">Vorschlag wird bei Namensänderungen automatisch aktualisiert; manuelle Eingaben bleiben erhalten.</small></label><label>Standard-Nr. <input name="jersey" value="${esc(p.defaultJersey||'')}"></label><label>Standard-Position <input name="role" value="${esc(p.defaultRole||'')}"></label>`,fd=>{const ab=fd.get('abbr').trim().toUpperCase();if(master.players.some(x=>x.id!==p.id&&String(x.abbreviation||'').toUpperCase()===ab))throw new Error('Kürzel ist bereits vergeben.');const oldJersey=String(p.defaultJersey||'').trim(),newJersey=fd.get('jersey').trim();Object.assign(p,touched(p),{firstName:fd.get('first').trim(),lastName:fd.get('last').trim(),abbreviation:ab,defaultJersey:newJersey,defaultRole:fd.get('role').trim().toUpperCase()});if(!id)master.players.push(p);else if(oldJersey!==newJersey){for(const r of [...(master.seasonRosters||[]),...(master.matchRosters||[])])if(r.playerId===p.id){r.jersey=newJersey;Object.assign(r,touched(r))}}persist();render();drawPlayers()},'Speichern');
 setTimeout(()=>{const first=$('#dialogBody input[name="first"]'),last=$('#dialogBody input[name="last"]'),abbr=$('#dialogBody input[name="abbr"]');if(!first||!last||!abbr)return;let manualAbbreviation=false;const initialFirst=first.value,initialLast=last.value;const update=()=>{const nameChanged=first.value!==initialFirst||last.value!==initialLast;if((!id||nameChanged)&&!manualAbbreviation)abbr.value=suggestedAbbreviation(first.value,last.value,p.id)};first.addEventListener('input',update);last.addEventListener('input',update);abbr.addEventListener('input',()=>{manualAbbreviation=true});if(!id)update()},0)
}
function drawTeams(){const b=$('#drawerBody');b.innerHTML=`<div class="toolbar"><button class="primary" id="addTeam">+ Team</button></div><table class="data-table"><thead><tr><th>Name</th><th>Art</th><th>Protokollierung</th><th>Status</th><th></th></tr></thead><tbody>${master.teams.map(t=>`<tr class="${t.active===false?'inactive':''}" data-id="${t.id}"><td>${esc(t.name)}</td><td>${t.kind==='own'?'Eigenes':'Gegner'}</td><td>${normalizeQualityProfile(t.qualityProfile)==='datavolley_6'?'Detailliert (= / - / ! / / / + / #)':'Basis (= / - / 0 / + / #)'}</td><td>${t.active===false?'inaktiv':'aktiv'}</td><td><button data-edit>✎</button> <button data-toggle>${t.active===false?'↺':'⏸'}</button></td></tr>`).join('')}</tbody></table>`;$('#addTeam').onclick=()=>editTeam();b.querySelectorAll('[data-edit]').forEach(x=>x.onclick=()=>editTeam(x.closest('tr').dataset.id));b.querySelectorAll('[data-toggle]').forEach(x=>x.onclick=()=>{const t=team(x.closest('tr').dataset.id);t.active=t.active===false;Object.assign(t,touched(t));persist();drawTeams()})}
function editTeam(id){const t=id?team(id):{id:newId('team'),name:'',kind:'own',qualityProfile:'basic_5',active:true,revision:0};modal(id?'Team bearbeiten':'Team anlegen',`<label>Name <input name="name" value="${esc(t.name)}" required></label><label>Art <select name="kind"><option value="own" ${t.kind==='own'?'selected':''}>Eigenes Team</option><option value="opponent" ${t.kind==='opponent'?'selected':''}>Gegner</option></select></label><label>Standard-Protokollierung <select name="qualityProfile"><option value="basic_5" ${normalizeQualityProfile(t.qualityProfile)==='basic_5'?'selected':''}>Basis (= / - / 0 / + / #)</option><option value="datavolley_6" ${normalizeQualityProfile(t.qualityProfile)==='datavolley_6'?'selected':''}>Detailliert (= / - / ! / / / + / #)</option></select></label>`,fd=>{Object.assign(t,touched(t),{name:fd.get('name').trim(),kind:fd.get('kind'),qualityProfile:normalizeQualityProfile(fd.get('qualityProfile'))});if(!id)master.teams.push(t);persist();drawTeams()})}
function drawSeasons(){const b=$('#drawerBody');b.innerHTML=`<div class="toolbar"><button class="primary" id="addSeason">+ Saison</button></div><table class="data-table"><thead><tr><th>Saison</th><th>Von</th><th>Bis</th><th>Status</th><th></th></tr></thead><tbody>${master.seasons.map(s=>`<tr class="${s.active===false?'inactive':''}" data-id="${s.id}"><td>${esc(s.name)}</td><td>${esc(s.startDate||'')}</td><td>${esc(s.endDate||'')}</td><td>${s.active===false?'inaktiv':'aktiv'}</td><td><button data-edit>✎</button> <button data-toggle>${s.active===false?'↺':'⏸'}</button></td></tr>`).join('')}</tbody></table>`;$('#addSeason').onclick=()=>editSeason();b.querySelectorAll('[data-edit]').forEach(x=>x.onclick=()=>editSeason(x.closest('tr').dataset.id));b.querySelectorAll('[data-toggle]').forEach(x=>x.onclick=()=>{const s=season(x.closest('tr').dataset.id);s.active=s.active===false;Object.assign(s,touched(s));persist();drawSeasons()})}
function editSeason(id){const s=id?season(id):{id:newId('season'),name:'',startDate:'',endDate:'',active:true,revision:0};modal(id?'Saison bearbeiten':'Saison anlegen',`<label>Bezeichnung <input name="name" value="${esc(s.name)}" required></label><label>Start <input type="date" name="start" value="${esc(s.startDate||'')}"></label><label>Ende <input type="date" name="end" value="${esc(s.endDate||'')}"></label>`,fd=>{Object.assign(s,touched(s),{name:fd.get('name').trim(),startDate:fd.get('start'),endDate:fd.get('end')});if(!id)master.seasons.push(s);persist();drawSeasons()})}

function selectedMatchType(id){return master.matchTypes.find(x=>x.id===id&&x.active!==false)||null}
async function changeMatchTypeFromUi(value){
 if(value==='__quick__'){
  if(!state.quickScout)await startQuickScout();
  return;
 }
 const mt=matchType(value)||master.matchTypes.find(x=>x.active!==false&&String(x.name||'')===String(value));if(!mt)return;
 if(state.quickScout){
  if(events.length&&!confirm('Das spontane Scouting enthält bereits Einträge. Beim Wechsel in ein reguläres Scouting werden diese Einträge verworfen. Fortfahren?')){drawMatch();return}
  events=[];await csv.write(events);
  state.quickScout=false;state.quickPlayers={};state.allowPositionOnly=false;state.setReady=false;state.ownLineup={};state.oppLineup={};state.ownBaseLineup={};state.oppBaseLineup={};state.setLineupsOwn={};state.setLineupsOpp={};state.matchId=newId('match');
 }
 state.matchTypeId=mt.id;state.matchTypeName=mt.name;saveState(state);render();drawMatch();setStatus('Reguläres Scouting aktiv · Spielangaben prüfen und Spiel übernehmen.');
}

function localLibraryMatches(){archiveCurrentMatch();const rows=loadMatchArchive();return rows.map(m=>({...m,_local:true,_cloud:false,status:m.matchId===state.matchId?(state.matchComplete?'ended':'active'):(m.status==='active'?'interrupted':m.status||'interrupted')}))}
function mergedMatchLibrary(){const map=new Map();for(const m of cloudMatchLibrary||[])if(m?.matchId)map.set(m.matchId,{...m,_cloud:true,_local:false});for(const m of localLibraryMatches()){const prev=map.get(m.matchId)||{};map.set(m.matchId,{...prev,...m,_cloud:!!prev.matchId,_local:true})}return [...map.values()].sort((a,b)=>String(b.updatedAt||b.matchDate||'').localeCompare(String(a.updatedAt||a.matchDate||'')))}
function matchStatusLabel(m){return m.status==='ended'?'Beendet':m.status==='active'?'Aktiv':'Unterbrochen'}
function localDeviceIcon(){return '<span class="library-device-icon" title="Auf diesem Gerät" aria-label="Auf diesem Gerät"></span>'}
function libraryAvailability(m){return `${m._cloud?'<span class="library-cloud-icon" title="Cloud" aria-label="Cloud">☁</span>':''}${m._local?localDeviceIcon():''}`}
function matchScoreText(m){const st=m.fullState||m.state||m;const sets=`${Number(st.setWinsUs||0)}:${Number(st.setWinsThem||0)}`;if(m.status==='ended')return `Sätze ${sets}`;return `Satz ${Number(st.setNo||1)} · ${Number(st.scoreUs||0)}:${Number(st.scoreThem||0)} · Sätze ${sets}`}
function matchNames(m){const own=m.ownTeamName||team(m.ownTeamId)?.name||m.fullState?.quickOwnName||'Eigenes Team',opp=m.oppTeamName||team(m.oppTeamId)?.name||m.fullState?.quickOppName||'Gegner';return `${own} – ${opp}`}
async function refreshCloudLibrary(redraw=true){if(libraryRefreshing||!navigator.onLine||!['nextcloud','webdav'].includes(settings.sync?.provider))return;libraryRefreshing=true;try{cloudMatchLibrary=await fetchCloudMatchLibrary(settings.sync);if(redraw&&$('#drawerBody')&&!$('#drawerBackdrop').hidden&&$('#drawerTitle')?.textContent?.includes('Spiel'))drawMatch()}catch(e){console.info('Cloud-Spielbibliothek nicht verfügbar:',e.message)}finally{libraryRefreshing=false}}
function renderMatchLibrary(){const rows=mergedMatchLibrary();if(!rows.length)return `<div class="library-empty">${esc(t('library.empty'))}</div>`;return `<div class="match-library-list">${rows.map(m=>{const activeCurrent=m.matchId===state.matchId&&!state.matchComplete;return `<article class="match-library-item" data-match-id="${esc(m.matchId)}"><div class="match-library-main"><div class="match-library-date">${esc(m.matchDate||'–')}</div><strong>${esc(matchNames(m))}</strong><div class="match-library-meta">${esc(matchStatusLabel(m))} · ${esc(matchScoreText(m))}${m.matchTypeName?` · ${esc(m.matchTypeName)}`:''}</div></div><div class="match-library-availability">${libraryAvailability(m)}</div><div class="match-library-actions">${m.status!=='ended'?`<button data-lib-action="continue" data-id="${esc(m.matchId)}">${esc(t('library.continue'))}</button>`:''}<button data-lib-action="video" data-id="${esc(m.matchId)}">🎬 ${esc(t('library.video'))}</button><button data-lib-action="review" data-id="${esc(m.matchId)}">${esc(t('library.review'))}</button><button data-lib-action="analyse" data-id="${esc(m.matchId)}">${esc(t('library.analyse'))}</button><button class="library-trash danger" data-lib-action="remove" data-id="${esc(m.matchId)}" ${activeCurrent?'disabled':''} title="${esc(activeCurrent?t('library.remove_active_hint'):t('library.remove'))}" aria-label="${esc(t('library.remove'))}">🗑</button></div></article>`}).join('')}</div>`}
async function resolveMatchSnapshot(matchId){const local=getMatchSnapshot(matchId);if(local)return local;if(!navigator.onLine)throw new Error('Dieses Spiel liegt nur in der Cloud. Für den ersten Download ist eine Internetverbindung erforderlich.');const remote=await fetchCloudMatch(matchId,settings.sync);if(!remote)throw new Error('Spiel konnte in der Cloud nicht geladen werden.');const meta=cloudMatchLibrary.find(x=>x.matchId===matchId)||{};const snap={...meta,matchId,status:remote.status,updatedAt:remote.updatedAt,fullState:{...remote.state,videoAssignments:[...(remote.videos||remote.state?.videoAssignments||[])]},state:remote.state,events:remote.events||[],videos:remote.videos||[]};upsertMatchArchive(snap);return getMatchSnapshot(matchId)||snap}
async function loadMatchForContinue(matchId){try{if(state.matchId&&state.matchId!==matchId)archiveCurrentMatch(state.matchComplete?'ended':'interrupted');const snap=await resolveMatchSnapshot(matchId);if(!snap?.fullState)throw new Error('Für dieses ältere Archiv ist kein vollständiger Spielzustand vorhanden. Es kann geprüft oder analysiert, aber nicht sicher fortgesetzt werden.');state={...defaultState,...snap.fullState,matchId:snap.matchId,videoAssignments:[...(snap.videos||snap.fullState.videoAssignments||[])]};events=migrateEventPlayerIds([...(snap.events||[])]);migrateRallyMetadata(events);saveState(cleanStateForSnapshot(state));saveEvents(events);archiveCurrentMatch(state.matchComplete?'ended':'active');await csv.init(`VolleyTaktLive_${state.matchId}.csv`);await csv.write(events);closeDrawer();render();setStatus(`Spiel geladen · ${matchNames(snap)} · ${matchScoreText(snap)}.`);if(navigator.onLine&&['nextcloud','webdav'].includes(settings.sync?.provider))runLiveSync(false)}catch(e){setStatus(e.message);alert(e.message)}}
async function reviewMatch(matchId){try{const m=await resolveMatchSnapshot(matchId),ev=m.events||[];const rows=ev.slice(-80).reverse().map(e=>`<tr><td>${esc(e.timestamp||'')}</td><td>${esc(e.set||'')}</td><td>${esc(e.rotation||'')}</td><td>${esc(e.player_abbreviation||e.player||'')}</td><td>${esc(e.action||'')}</td><td>${esc(e.value||'')}</td><td>${esc((e.score_us??''))}:${esc((e.score_them??''))}</td></tr>`).join('');modal(`Spiel prüfen · ${matchNames(m)}`,`<div class="review-summary"><strong>${esc(m.matchDate||'')}</strong><span>${esc(matchStatusLabel(m))} · ${esc(matchScoreText(m))}</span><span>${ev.length} Protokolleinträge · ${(m.videos||m.fullState?.videoAssignments||[]).length} Videozuordnung(en)</span></div><div class="review-table-wrap"><table><thead><tr><th>Zeit</th><th>S</th><th title="Rotation">Rot.</th><th>Spielerin</th><th>Aktion</th><th>Wert</th><th>Stand</th></tr></thead><tbody>${rows||'<tr><td colspan="7">Noch keine Aktionen.</td></tr>'}</tbody></table></div>`,()=>{},'Schließen')}catch(e){setStatus(e.message)}}
async function analyseMatch(matchId){try{await resolveMatchSnapshot(matchId);analysisPinnedMatchId=matchId;openDrawer('analysis')}catch(e){setStatus(e.message)}}
async function removeMatchFromLibrary(matchId){
 const row=mergedMatchLibrary().find(x=>x.matchId===matchId);if(!row)return;
 if(matchId===state.matchId&&!state.matchComplete){setStatus(t('library.remove_active_hint'));return}
 const hasCloud=!!row._cloud,hasLocal=!!row._local;
 const choices=[];
 if(hasLocal)choices.push(`<label class="library-remove-choice"><input type="radio" name="removeScope" value="local" ${hasLocal?'checked':''}> <span><strong>${esc(t('library.remove_local'))}</strong><small>${esc(t('library.remove_local_help'))}</small></span></label>`);
 if(hasCloud)choices.push(`<label class="library-remove-choice"><input type="radio" name="removeScope" value="sync" ${!hasLocal?'checked':''}> <span><strong>${esc(t('library.remove_sync'))}</strong><small>${esc(t('library.remove_sync_help'))}</small></span></label>`);
 modal(t('library.remove_title'),`<p><strong>${esc(matchNames(row))}</strong></p><p class="small">${esc(t('library.remove_video_safe'))}</p><div class="library-remove-options">${choices.join('')}</div>`,fd=>{
   const scope=fd.get('removeScope')||'local';
   if(scope==='sync'&&!(navigator.onLine&&['nextcloud','webdav'].includes(settings.sync?.provider)))throw new Error(t('library.remove_sync_offline'));
   if(scope==='local'){
     removeMatchArchive(matchId);setStatus(t('library.removed_local'));drawMatch();return;
   }
   void removeCloudMatchFromLibrary(matchId,settings.sync).then(()=>{removeMatchArchive(matchId);cloudMatchLibrary=cloudMatchLibrary.filter(x=>x.matchId!==matchId);setStatus(t('library.removed_sync'));drawMatch()}).catch(e=>{setStatus(e.message||String(e));alert(e.message||String(e))});
 },t('library.remove_confirm'))
}
function wireMatchLibraryActions(){$$('[data-lib-action]').forEach(btn=>btn.onclick=()=>{if(btn.disabled)return;const id=btn.dataset.id,action=btn.dataset.libAction;if(action==='continue')loadMatchForContinue(id);if(action==='video')drawLibraryVideoAssignments(id);if(action==='review')reviewMatch(id);if(action==='analyse')analyseMatch(id);if(action==='remove')removeMatchFromLibrary(id)})}
function newMatchFromLibrary(){
 matchEditorOpen=true;matchEditorMode='new';drawMatch();setStatus('Neues Spiel · Angaben erfassen und mit „Spiel übernehmen“ anlegen.');
}

function videoStorageLabel(v){return v.storageType==='youtube'?'YouTube':v.storageType==='cloud'?'Cloud':'Lokal'}
async function saveLibraryVideoSnapshot(snapshot){
 const videos=[...(snapshot.videos||snapshot.fullState?.videoAssignments||[])];
 const fullState={...(snapshot.fullState||snapshot.state||{}),videoAssignments:videos};
 const next={...snapshot,videos,fullState,updatedAt:new Date().toISOString()};
 upsertMatchArchive(next);
 if(state.matchId===next.matchId){
  state.videoAssignments=[...videos];
  saveState(state);
 }
 if(navigator.onLine&&['nextcloud','webdav'].includes(settings.sync?.provider)){
  syncStoredMatch(next,settings.sync).then(()=>refreshCloudLibrary(false)).catch(e=>console.info('Videozuordnung noch nicht in Cloud synchronisiert:',e.message))
 }
 return next
}
async function drawLibraryVideoAssignments(matchId){
 try{
  const snap=await resolveMatchSnapshot(matchId);
  const b=$('#drawerBody'),rows=[...(snap.videos||snap.fullState?.videoAssignments||[])];
  b.innerHTML=`<div class="drawer-subhead"><button id="libraryVideoBack">← Spielbibliothek</button><h3>🎬 Video · ${esc(matchNames(snap))}</h3></div>
  <div class="card"><p class="small">Videozuordnungen können direkt am gespeicherten Spiel gepflegt werden. Das Spiel muss dafür nicht fortgesetzt werden.</p><div class="toolbar"><button id="libraryAddVideo" class="primary">Video zuordnen</button></div></div>
  <div class="video-assignment-list">${rows.map(v=>`<div class="card video-assignment"><div><strong>${esc(v.label||'Spielvideo')}</strong><span>${esc(videoStorageLabel(v))}${v.perspective?` · ${esc(v.perspective)}`:''}</span><small>${esc(v.reference||'Keine Referenz')}<br>Abgleich: Scouting ${fmt(Number(v.scoutingSyncSeconds||0))} = Video ${fmt(Number(v.videoSyncSeconds||0))} · Offset ${fmt(Number(v.videoSyncSeconds||0)-Number(v.scoutingSyncSeconds||0))}</small></div><div class="toolbar"><button data-library-video-edit="${esc(v.id)}">Bearbeiten</button><button class="danger" data-library-video-delete="${esc(v.id)}">Entfernen</button></div></div>`).join('')||'<div class="card small">Noch kein Video diesem Spiel zugeordnet.</div>'}</div>`;
  $('#libraryVideoBack').onclick=drawMatch;
  $('#libraryAddVideo').onclick=()=>editLibraryVideoAssignment(matchId,'');
  $$('[data-library-video-edit]').forEach(x=>x.onclick=()=>editLibraryVideoAssignment(matchId,x.dataset.libraryVideoEdit));
  $$('[data-library-video-delete]').forEach(x=>x.onclick=async()=>{
    const current=await resolveMatchSnapshot(matchId);
    current.videos=[...(current.videos||current.fullState?.videoAssignments||[])].filter(v=>v.id!==x.dataset.libraryVideoDelete);
    await saveLibraryVideoSnapshot(current);drawLibraryVideoAssignments(matchId)
  })
 }catch(e){setStatus(e.message)}
}
async function editLibraryVideoAssignment(matchId,id=''){
 try{
  const snap=await resolveMatchSnapshot(matchId),videos=[...(snap.videos||snap.fullState?.videoAssignments||[])];
  const old=videos.find(v=>v.id===id)||{id:newId('video'),storageType:'local',label:'Spielvideo',reference:'',scoutingSyncSeconds:0,videoSyncSeconds:0,perspective:''};
  modal(id?'Videozuordnung bearbeiten':'Video zuordnen',`<label>Videospeicher<select name="storageType"><option value="local" ${old.storageType==='local'?'selected':''}>Lokal / Datei auf diesem Gerät</option><option value="cloud" ${old.storageType==='cloud'?'selected':''}>Cloud-Datei / Cloud-URL</option><option value="youtube" ${old.storageType==='youtube'?'selected':''}>YouTube</option></select></label><label>Bezeichnung<input name="label" value="${esc(old.label||'')}"></label><label>Dateiname / URL / Video-ID<input name="reference" value="${esc(old.reference||'')}" placeholder="z. B. match.mp4 oder YouTube-URL"></label><label>Perspektive / Kamera<input name="perspective" value="${esc(old.perspective||'')}" placeholder="z. B. Hinterfeld"></label><div class="form-grid"><label>Scouting-Zeit (Sek.)</label><input name="scoutingSyncSeconds" type="number" min="0" step="0.1" value="${Number(old.scoutingSyncSeconds||0)}"><label>Video-Zeit (Sek.)</label><input name="videoSyncSeconds" type="number" min="0" step="0.1" value="${Number(old.videoSyncSeconds||0)}"></div><p class="small">Der Abgleich gilt nur für dieses Video. Weitere Dateien oder Perspektiven können separat zugeordnet werden.</p>`,async fd=>{
   const v={...old,storageType:fd.get('storageType'),label:String(fd.get('label')||'Spielvideo').trim(),reference:String(fd.get('reference')||'').trim(),perspective:String(fd.get('perspective')||'').trim(),scoutingSyncSeconds:Math.max(0,Number(fd.get('scoutingSyncSeconds')||0)),videoSyncSeconds:Math.max(0,Number(fd.get('videoSyncSeconds')||0)),updatedAt:now()};
   const current=await resolveMatchSnapshot(matchId),nextVideos=[...(current.videos||current.fullState?.videoAssignments||[])],i=nextVideos.findIndex(x=>x.id===v.id);
   if(i>=0)nextVideos[i]=v;else nextVideos.push(v);
   current.videos=nextVideos;await saveLibraryVideoSnapshot(current);drawLibraryVideoAssignments(matchId);setStatus('Videozuordnung gespeichert.')
  },id?'Übernehmen':'Zuordnen')
 }catch(e){setStatus(e.message)}
}

function drawVideoAssignments(){const b=$('#drawerBody'),rows=state.videoAssignments||[];b.innerHTML=`<div class="drawer-subhead"><button id="videoBack">← Spiel</button><h3>Videospeicher &amp; Videozuordnung</h3></div><div class="card"><p class="small">Hier wird nur gespeichert, <strong>wo</strong> das Spielvideo liegt und wie Scouting-Zeit und Video-Zeit zusammengehören. Das Video selbst wird in dieser Preview nicht kopiert oder geschnitten.</p><div class="toolbar"><button id="addVideoAssignment" class="primary">Video zuordnen</button></div></div><div class="video-assignment-list">${rows.map(v=>`<div class="card video-assignment"><div><strong>${esc(v.label||'Spielvideo')}</strong><span>${esc(videoStorageLabel(v))}${v.perspective?` · ${esc(v.perspective)}`:''}</span><small>${esc(v.reference||'Keine Referenz')}<br>Abgleich: Scouting ${fmt(Number(v.scoutingSyncSeconds||0))} = Video ${fmt(Number(v.videoSyncSeconds||0))} · Offset ${fmt(Number(v.videoSyncSeconds||0)-Number(v.scoutingSyncSeconds||0))}</small></div><div class="toolbar"><button data-video-edit="${esc(v.id)}">Bearbeiten</button><button class="danger" data-video-delete="${esc(v.id)}">Entfernen</button></div></div>`).join('')||'<div class="card small">Noch kein Video diesem Spiel zugeordnet.</div>'}</div>`;$('#videoBack').onclick=drawMatch;$('#addVideoAssignment').onclick=()=>editVideoAssignment();$$('[data-video-edit]').forEach(x=>x.onclick=()=>editVideoAssignment(x.dataset.videoEdit));$$('[data-video-delete]').forEach(x=>x.onclick=()=>{state.videoAssignments=state.videoAssignments.filter(v=>v.id!==x.dataset.videoDelete);persist();drawVideoAssignments()})}
function editVideoAssignment(id=''){const old=(state.videoAssignments||[]).find(v=>v.id===id)||{id:newId('video'),storageType:'local',label:'Spielvideo',reference:'',scoutingSyncSeconds:0,videoSyncSeconds:0,perspective:''};modal(id?'Videozuordnung bearbeiten':'Video zuordnen',`<label>Videospeicher<select name="storageType"><option value="local" ${old.storageType==='local'?'selected':''}>Lokal / Datei auf diesem Gerät</option><option value="cloud" ${old.storageType==='cloud'?'selected':''}>Cloud-Datei / Cloud-URL</option><option value="youtube" ${old.storageType==='youtube'?'selected':''}>YouTube</option></select></label><label>Bezeichnung<input name="label" value="${esc(old.label||'')}"></label><label>Dateiname / URL / Video-ID<input name="reference" value="${esc(old.reference||'')}" placeholder="z. B. match.mp4 oder YouTube-URL"></label><label>Perspektive / Kamera<input name="perspective" value="${esc(old.perspective||'')}" placeholder="z. B. Hinterfeld"></label><div class="form-grid"><label>Scouting-Zeit (Sek.)</label><input name="scoutingSyncSeconds" type="number" min="0" step="0.1" value="${Number(old.scoutingSyncSeconds||0)}"><label>Video-Zeit (Sek.)</label><input name="videoSyncSeconds" type="number" min="0" step="0.1" value="${Number(old.videoSyncSeconds||0)}"></div><p class="small">Beispiel bei langem Vorlauf: Scouting 0,0 = Video 1127,4 Sekunden. Der Offset wird daraus automatisch berechnet.</p>`,fd=>{const v={...old,storageType:fd.get('storageType'),label:String(fd.get('label')||'Spielvideo').trim(),reference:String(fd.get('reference')||'').trim(),perspective:String(fd.get('perspective')||'').trim(),scoutingSyncSeconds:Math.max(0,Number(fd.get('scoutingSyncSeconds')||0)),videoSyncSeconds:Math.max(0,Number(fd.get('videoSyncSeconds')||0)),updatedAt:now()};const i=state.videoAssignments.findIndex(x=>x.id===v.id);if(i>=0)state.videoAssignments[i]=v;else state.videoAssignments.push(v);persist();drawVideoAssignments()},id?'Übernehmen':'Zuordnen')}
function drawMatch(){
 const b=$('#drawerBody'),seas=active(master.seasons),owns=active(master.teams).filter(t=>t.kind==='own'),opps=active(master.teams).filter(t=>t.kind==='opponent'),ord=orderedMatchTypes(master.matchTypes),types=[...ord.top,...ord.rest];
 const ownDetailed=qualityProfileForSide('own')==='datavolley_6',oppDetailed=qualityProfileForSide('opponent')==='datavolley_6';
 const newMode=matchEditorOpen&&matchEditorMode==='new';
 const formDate=newMode?new Date().toISOString().slice(0,10):(state.matchDate||new Date().toISOString().slice(0,10));
 const formSeason=newMode?'':state.seasonId,formOwn=newMode?'':state.ownTeamId,formOpp=newMode?'':state.oppTeamId,formType=newMode?'':state.matchTypeId;
 const formMode=newMode?'regular':state.matchMode,formSetCount=newMode?3:state.fixedSetCount,formFinalTarget=newMode?25:state.fixedFinalSetTarget;
 const formCapture=newMode?state.opponentCapture:state.opponentCapture;
 const currentActions=!matchEditorOpen&&state.matchId?`<div class="card current-match-actions"><div class="analysis-heading"><h3>Aktuelles Spiel</h3><p class="small">${esc(state.quickScout?'Spontanes Scouting':matchNames(state))}</p></div><div class="toolbar"><button id="videoAssignmentsBtn">🎬 Videospeicher / Zuordnung</button><button id="prepareSet">${state.setReady?`Satz ${state.setNo} neu vorbereiten`:`Satz ${state.setNo} vorbereiten`}</button>${state.setReady?'<button id="lineupOwn">Aufstellung Wir ändern</button>':''}${state.setReady&&state.opponentCapture?'<button id="lineupOpp">Aufstellung Gegner ändern</button>':''}<button class="danger" id="resetScouting">Scouting zurücksetzen</button></div></div>`:'';
 const editor=matchEditorOpen?`<div class="card match-editor-card"><div class="drawer-subhead match-editor-head"><h3>Neues Spiel</h3><button id="cancelMatchEdit" class="ghost">Abbrechen</button></div><div class="form-grid"><label>Spieldatum</label><input id="mDate" type="date" value="${esc(formDate)}"><label>Saison</label><select id="mSeason"><option value="">–</option>${opts(seas,formSeason)}</select><label>Eigenes Team</label><select id="mOwn"><option value="">–</option>${opts(owns,formOwn)}</select><label>Gegner</label><select id="mOpp"><option value="">–</option>${opts(opps,formOpp)}</select><label>Spiel-/Kaderart</label><select id="mType"><option value="">–</option>${types.map(mt=>`<option value="${esc(mt.id)}" ${mt.id===formType?'selected':''}>${esc(mt.name)}</option>`).join('')}</select><label>Spielmodus</label><select id="mMatchMode"><option value="regular" ${formMode!=='fixed'?'selected':''}>Regulär · 3 Gewinnsätze (max. 5)</option><option value="fixed" ${formMode==='fixed'?'selected':''}>Feste Anzahl Sätze</option></select><label class="fixed-set-option">Anzahl Sätze</label><select id="mFixedSetCount" class="fixed-set-option">${[1,2,3,4,5].map(n=>`<option value="${n}" ${+formSetCount===n?'selected':''}>${n}</option>`).join('')}</select><label class="fixed-set-option">Letzter Satz</label><select id="mFixedFinalTarget" class="fixed-set-option"><option value="25" ${+formFinalTarget!==15?'selected':''}>normal bis 25</option><option value="15" ${+formFinalTarget===15?'selected':''}>verkürzt bis 15</option></select></div><div class="quality-switches"><label class="switch-row"><span>Gegner mitscouten / Startaufstellung erfassen</span><span class="switch"><input type="checkbox" id="mCaptureOpponent" ${formCapture?'checked':''}><span class="slider"></span></span></label><label class="switch-row"><span>Eigenes Team · detailliertes Scouting</span><span class="switch"><input type="checkbox" id="mOwnDetailed" ${ownDetailed?'checked':''}><span class="slider"></span></span></label><small>= / - / ! / / / + / #</small><label class="switch-row"><span>Gegner · detailliertes Scouting</span><span class="switch"><input type="checkbox" id="mOppDetailed" ${oppDetailed?'checked':''}><span class="slider"></span></span></label><small>= / - / ! / / / + / #</small></div><div class="toolbar mt"><button class="primary" id="applyMatch">Spiel übernehmen</button><button id="cancelMatchEdit2">Abbrechen</button></div><p class="small">Die Spielangaben werden erst mit „Spiel übernehmen“ angelegt. „Abbrechen“ verwirft die Eingabe vollständig.</p></div>`:'';
 b.innerHTML=`<div class="card match-library-card"><div class="analysis-heading"><h3>Spielbibliothek <span class="preview-pill">0.4.0 RC4-r2</span></h3><p class="small">Automatisch gespeicherte Spiele auf diesem Gerät und – bei aktiver Synchronisation – aus der Cloud.</p></div><div class="toolbar"><button id="newMatchBtn" class="primary">Neues Spiel</button><button id="refreshLibraryBtn">Cloud aktualisieren</button></div><div id="matchLibrary">${renderMatchLibrary()}</div>${editor}</div>${currentActions}`;
 $('#newMatchBtn').onclick=newMatchFromLibrary;$('#refreshLibraryBtn').onclick=()=>refreshCloudLibrary(true);wireMatchLibraryActions();refreshCloudLibrary(false);
 if($('#videoAssignmentsBtn'))$('#videoAssignmentsBtn').onclick=drawVideoAssignments;if($('#prepareSet'))$('#prepareSet').onclick=startSetSetup;if($('#lineupOwn'))$('#lineupOwn').onclick=()=>editLineup('own');if($('#lineupOpp'))$('#lineupOpp').onclick=()=>editLineup('opponent');if($('#resetScouting'))$('#resetScouting').onclick=()=>modal('Scouting dieses Spiels vollständig zurücksetzen?',`<p>Protokoll, Punkte, Sätze, Aufstellungen, Wechsel und Rallys dieses Spiels werden gelöscht.</p><p class="small"><strong>Erhalten bleiben:</strong> Spieldatum, Saison, Teams, Spiel-/Kaderart, Spielkader sowie die Einstellungen für Gegner-Scouting und Bewertung.</p>`,()=>resetCurrentScouting(),'Scouting zurücksetzen');
 if(!matchEditorOpen)return;
 const cancelEditor=()=>{matchEditorOpen=false;matchEditorMode='';drawMatch();setStatus('Spielanlage abgebrochen · kein neues Spiel angelegt.')};
 $('#cancelMatchEdit').onclick=cancelEditor;$('#cancelMatchEdit2').onclick=cancelEditor;
 const mtSel=$('#mType');if(mtSel)mtSel.onchange=()=>changeMatchTypeFromUi(mtSel.value);
 const syncSwitchDefaults=()=>{const own=$('#mOwn').value,opp=$('#mOpp').value;if(own)$('#mOwnDetailed').checked=qualityProfileForTeam(own)==='datavolley_6';if(opp)$('#mOppDetailed').checked=qualityProfileForTeam(opp)==='datavolley_6'};
 $('#mOwn').addEventListener('change',syncSwitchDefaults);$('#mOpp').addEventListener('change',syncSwitchDefaults);const syncMatchModeFields=()=>{$$('.fixed-set-option').forEach(el=>el.hidden=$('#mMatchMode').value!=='fixed')};$('#mMatchMode').addEventListener('change',syncMatchModeFields);syncMatchModeFields();
 $('#applyMatch').onclick=()=>{
  const mt=selectedMatchType($('#mType').value);if(!mt){setStatus('Bitte eine vorhandene Spiel-/Kaderart auswählen. Neue Spielarten werden ausschließlich in den Stammdaten manuell angelegt.');return}
  if(newMode){if(state.matchId&&!state.quickScoutDraft)archiveCurrentMatch(state.matchComplete?'ended':'interrupted');const keep={autoRotate:state.autoRotate,allowPositionOnly:state.allowPositionOnly,opponentCapture:state.opponentCapture,ownQualityProfile:state.ownQualityProfile,opponentQualityProfile:state.opponentQualityProfile,fieldOrientation:state.fieldOrientation};state={...defaultState,...keep,matchId:newId('match'),videoAssignments:[]};events=[];redoStack=[]}
  state.quickScout=false;state.quickPlayers={};state.matchDate=$('#mDate').value||new Date().toISOString().slice(0,10);state.seasonId=$('#mSeason').value;state.ownTeamId=$('#mOwn').value;state.oppTeamId=$('#mOpp').value;state.ownQualityProfile=$('#mOwnDetailed').checked?'datavolley_6':'basic_5';state.opponentQualityProfile=$('#mOppDetailed').checked?'datavolley_6':'basic_5';state.opponentCapture=$('#mCaptureOpponent').checked;if(!state.opponentCapture)state.activeTeamContext='own';state.matchMode=$('#mMatchMode').value==='fixed'?'fixed':'regular';state.fixedSetCount=Math.min(5,Math.max(1,+$('#mFixedSetCount').value||3));state.fixedFinalSetTarget=+$('#mFixedFinalTarget').value===15?15:25;state.matchTypeId=mt.id;state.matchTypeName=mt.name;
  state.setNo=1;state.setWinsUs=0;state.setWinsThem=0;state.firstSetServing='';state.setReady=false;state.matchComplete=false;state.scoreUs=state.scoreThem=0;state.servingSide='';state.fieldOrientation='activeBottom';mt.usageCount=(mt.usageCount||0)+1;Object.assign(mt,touched(mt));persist();matchEditorOpen=false;matchEditorMode='';render();drawMatch();setStatus('Spielbasis übernommen · Satz 1 wird vorbereitet.');if(!events.length&&!state.setReady)setTimeout(startSetSetup,80)
 };
}
function rosterKey(teamId=state.ownTeamId,seasonId=state.seasonId,typeId=state.matchTypeId){return `${teamId}|${seasonId}|${typeId}`}
function seasonRosterRows(teamId,seasonId){return master.seasonRosters.filter(r=>r.teamId===teamId&&r.seasonId===seasonId&&r.active!==false)}
function matchRosterRows(teamId,seasonId,typeId){return master.matchRosters.filter(r=>r.teamId===teamId&&r.seasonId===seasonId&&r.matchTypeId===typeId&&r.active!==false)}
function editLineup(side,onSaved=null,options={}){
 const tid=side==='own'?state.ownTeamId:state.oppTeamId;if(!tid||!state.seasonId||!state.matchTypeId){setStatus('Bitte zuerst Saison, Teams und Spiel-/Kaderart festlegen.');return}
 let rows=matchRosterRows(tid,state.seasonId,state.matchTypeId);if(!rows.length)rows=seasonRosterRows(tid,state.seasonId);
 const lineup={...(options.lineup||(side==='own'?state.ownLineup:state.oppLineup)||{})};
 const selectedLiberos=[...(options.liberos||setLiberosForSide(side)||[])].filter(Boolean).slice(0,2);
 const playerRows=sortPlayerSelectionRows(rows.map(r=>({...player(r.playerId),jersey:r.jersey,role:r.role,playerId:r.playerId})).filter(x=>x.id),side);
 const liberoRows=playerRows.filter(x=>isLiberoRole(x.role||x.defaultRole));
 const liberoOptions=(selected='')=>`<option value="">– kein Libero –</option>${opts(liberoRows,selected,x=>`#${x.jersey||x.defaultJersey||'–'} · ${x.abbreviation} · ${x.firstName} ${x.lastName}`)}`;
 const liberoHtml=`<div class="lineup-libero-section"><h3>Libero für Satz ${state.setNo}</h3><p class="small">Wähle den zu Satzbeginn bevorzugten Libero. Bei zwei Liberos bleibt der zweite für spätere Libero-Wechsel verfügbar.</p><div class="lineup-grid"><label>Libero 1<select name="libero1">${liberoOptions(selectedLiberos[0]||'')}</select></label>${liberoRows.length>1?`<label>Libero 2<select name="libero2">${liberoOptions(selectedLiberos[1]||'')}</select></label>`:''}</div>${liberoRows.length?'':'<p class="small">Im aktuellen Kader ist keine Spielerin als Libero gekennzeichnet.</p>'}</div>`;
 modal(`Startaufstellung ${side==='own'?'Wir':'Gegner'} · Satz ${state.setNo}`,`<p class="save-hint">Vorhandene Werte sind vorausgewählt. Änderungen werden erst mit <strong>Übernehmen</strong> gespeichert; <strong>Abbrechen</strong> verwirft alle Änderungen.</p><div class="lineup-grid">${POS.map(p=>`<label>${posLabel(p)}<select name="p${p}"><option value="">–</option>${opts(playerRows,lineup[p],x=>`#${x.jersey||x.defaultJersey||'–'} · ${x.abbreviation} · ${x.firstName} ${x.lastName}`)}</select></label>`).join('')}</div>${liberoHtml}`,fd=>{
  const vals=POS.map(p=>fd.get(`p${p}`)).filter(Boolean);if(new Set(vals).size!==vals.length)throw new Error('Eine Spielerin darf in der Startaufstellung nicht mehrfach vorkommen.');
  const target={};POS.forEach(p=>target[p]=fd.get(`p${p}`)||'');
  const liberos=[fd.get('libero1'),fd.get('libero2')].filter(Boolean);if(new Set(liberos).size!==liberos.length)throw new Error('Libero 1 und Libero 2 müssen unterschiedliche Spielerinnen sein.');
  if(liberos.some(id=>vals.includes(id)))throw new Error('Ein ausgewählter Libero darf nicht gleichzeitig Teil der Startaufstellung I–VI sein.');
  const result={lineup:target,liberos};
  if(!options.draftOnly){setLineupAndLiberos(side,target,liberos);persist();render()}
  if(onSaved)setTimeout(()=>onSaved(result),30)
 },'Übernehmen',options.onCancel||null)
}

function uniqueMatchTypes(){const seen=new Set();return active(master.matchTypes).filter(mt=>{const k=String(mt.name||'').trim().toLocaleLowerCase('de');if(seen.has(k))return false;seen.add(k);return true})}
function drawRosters(){const b=$('#drawerBody'),teams=active(master.teams),seas=active(master.seasons);b.innerHTML=`<div class="form-grid"><label>Team</label><select id="rTeam">${opts(teams,state.ownTeamId)}</select><label>Saison</label><select id="rSeason">${opts(seas,state.seasonId)}</select><label>Ebene</label><select id="rLevel"><option value="season">Saisonkader</option><option value="match">Spielkader</option></select><label>Spiel-/Kaderart</label><select id="rType">${opts(uniqueMatchTypes(),state.matchTypeId)}</select></div><div class="toolbar mt"><button id="loadRoster" class="primary">Kader anzeigen</button><button id="copyPrev">Saisonkader übernehmen</button><button id="manageTypes">Spiel-/Kaderarten</button></div><div id="rosterEditor"></div>`;$('#loadRoster').onclick=renderRosterEditor;$('#copyPrev').onclick=copyPreviousRoster;$('#manageTypes').onclick=drawMatchTypes;renderRosterEditor()}

function drawMatchTypes(){const b=$('#drawerBody');b.innerHTML=`<div class="toolbar"><button class="primary" id="addType">+ Spiel-/Kaderart</button><button id="backRoster">← Kader</button></div><table class="data-table"><thead><tr><th>Bezeichnung</th><th>Nutzung</th><th>Status</th><th></th></tr></thead><tbody>${master.matchTypes.map(m=>`<tr class="${m.active===false?'inactive':''}" data-id="${m.id}"><td>${esc(m.name)}</td><td>${m.usageCount||0}</td><td>${m.active===false?'inaktiv':'aktiv'}</td><td><button data-edit>✎</button> <button data-toggle>${m.active===false?'↺':'⏸'}</button></td></tr>`).join('')}</tbody></table>`;$('#addType').onclick=()=>editMatchType();$('#backRoster').onclick=drawRosters;b.querySelectorAll('[data-edit]').forEach(x=>x.onclick=()=>editMatchType(x.closest('tr').dataset.id));b.querySelectorAll('[data-toggle]').forEach(x=>x.onclick=()=>{const m=master.matchTypes.find(y=>y.id===x.closest('tr').dataset.id);m.active=m.active===false;Object.assign(m,touched(m));persist();drawMatchTypes()})}
function editMatchType(id){const m=id?master.matchTypes.find(x=>x.id===id):{id:newId('mt'),name:'',usageCount:0,active:true,revision:0};modal(id?'Spiel-/Kaderart bearbeiten':'Spiel-/Kaderart anlegen',`<label>Bezeichnung <input name="name" value="${esc(m.name)}" required></label>`,fd=>{const name=String(fd.get('name')||'').normalize('NFKC').trim().replace(/\s+/g,' ');if(!name)throw new Error('Bitte eine Bezeichnung eingeben.');const key=matchTypeKey(name);if(master.matchTypes.some(x=>x.id!==m.id&&matchTypeKey(x.name)===key))throw new Error('Diese Spiel-/Kaderart existiert bereits.');Object.assign(m,touched(m),{name});if(!id)master.matchTypes.push(m);persist();drawMatchTypes()})}
function renderRosterEditor(){const box=$('#rosterEditor');if(!box)return;const tid=$('#rTeam')?.value,sid=$('#rSeason')?.value,level=$('#rLevel')?.value||'season',mtid=$('#rType')?.value;if(!tid||!sid){box.innerHTML='<p>Team und Saison auswählen.</p>';return}const current=level==='season'?seasonRosterRows(tid,sid):matchRosterRows(tid,sid,mtid),cur=new Map(current.map(r=>[r.playerId,r]));const coll=new Intl.Collator(settings.ui?.language||'de',{numeric:true,sensitivity:'base'}),allowed=(level==='season'?active(master.players):seasonRosterRows(tid,sid).map(r=>player(r.playerId)).filter(Boolean)).sort((a,b)=>coll.compare(String(a.abbreviation||''),String(b.abbreviation||''))||coll.compare(String(a.firstName||''),String(b.firstName||''))||coll.compare(String(a.lastName||''),String(b.lastName||'')));box.innerHTML=`<div class="card"><div class="checklist">${allowed.map(p=>{const r=cur.get(p.id);return `<div class="checkrow"><input type="checkbox" data-pid="${p.id}" ${r?'checked':''}><span>${esc(p.abbreviation)} – ${esc(p.firstName)} ${esc(p.lastName)}</span><input data-jersey="${p.id}" placeholder="Nr." value="${esc(r?.jersey??p.defaultJersey??'')}"><input data-role="${p.id}" placeholder="Position" value="${esc(r?.role??p.defaultRole??'')}"></div>`}).join('')}</div><button id="saveRoster" class="primary mt">Kader speichern</button></div>`;$('#saveRoster').onclick=()=>saveRoster(tid,sid,level,mtid)}
function saveRoster(tid,sid,level,mtid){const arr=level==='season'?master.seasonRosters:master.matchRosters;for(const p of active(master.players)){const cb=$(`[data-pid="${p.id}"]`);if(!cb)continue;let r=arr.find(x=>x.teamId===tid&&x.seasonId===sid&&x.playerId===p.id&&(level==='season'||x.matchTypeId===mtid));if(cb.checked){if(!r){r={id:newId(level==='season'?'sr':'mr'),teamId:tid,seasonId:sid,playerId:p.id,active:true,revision:0,...(level==='match'?{matchTypeId:mtid}:{})};arr.push(r)}Object.assign(r,touched(r),{active:true,jersey:$(`[data-jersey="${p.id}"]`).value.trim(),role:$(`[data-role="${p.id}"]`).value.trim().toUpperCase()})}else if(r){r.active=false;Object.assign(r,touched(r))}}persist();setStatus(`${level==='season'?'Saison':'Spiel'}kader gespeichert.`);renderRosterEditor()}
function copyPreviousRoster(){const tid=$('#rTeam').value,sid=$('#rSeason').value,seas=active(master.seasons),idx=seas.findIndex(s=>s.id===sid);if(idx<1){setStatus('Keine vorherige aktive Saison verfügbar.');return}const source=seasonRosterRows(tid,seas[idx-1].id);for(const s of source){let r=master.seasonRosters.find(x=>x.teamId===tid&&x.seasonId===sid&&x.playerId===s.playerId);if(!r){r={id:newId('sr'),teamId:tid,seasonId:sid,playerId:s.playerId,revision:0};master.seasonRosters.push(r)}Object.assign(r,touched(r),{jersey:s.jersey,role:s.role,active:true})}persist();renderRosterEditor();setStatus(`${source.length} Spielerinnen übernommen.`)}

function drawData(){const b=$('#drawerBody');b.innerHTML=`<div class="card"><h3>Scoutingdaten</h3><div class="toolbar"><button id="exportCsv" class="primary">CSV exportieren</button><button id="importCsv">CSV laden / fortsetzen</button><button id="newScout" class="danger">Scouting leeren</button></div></div><div class="card"><h3>Stammdaten</h3><div class="toolbar"><button id="exportJson">VolleyTakt-Daten exportieren</button><button id="importJson">VolleyTakt-Daten importieren</button></div><p class="small">Enthält Spielerinnen, Teams, Saisons, Saison-/Spielkader und Spiel-/Kaderarten. Cloud-Zugangsdaten werden nicht exportiert.</p></div>`;$('#exportCsv').onclick=()=>csv.download(events,`VolleyTaktLive_${new Date().toISOString().slice(0,10)}.csv`);$('#importCsv').onclick=()=>$('#csvImport').click();$('#newScout').onclick=()=>modal('Scouting dieses Spiels vollständig zurücksetzen?',`<p>Protokoll, Punkte, Sätze, Aufstellungen, Wechsel und Rallys dieses Spiels werden gelöscht.</p><p class="small">Teams, Kader und Spieleinstellungen bleiben erhalten.</p>`,()=>resetCurrentScouting(),'Scouting zurücksetzen');$('#exportJson').onclick=()=>downloadJson({schema:2,master},'VolleyTakt_masterdata.json');$('#importJson').onclick=()=>$('#jsonImport').click()}


function analysisMatches(){
 const archived=loadMatchArchive();
 const current=(state.matchId&&events.length)?{matchId:state.matchId,matchDate:state.matchDate||events.find(e=>e.createdAt)?.createdAt?.slice(0,10)||'',seasonId:state.seasonId,ownTeamId:state.ownTeamId,oppTeamId:state.oppTeamId,matchTypeId:state.matchTypeId,matchTypeName:state.matchTypeName,matchMode:state.matchMode,fixedSetCount:state.fixedSetCount,fixedFinalSetTarget:state.fixedFinalSetTarget,opponentCapture:state.opponentCapture,state:{setWinsUs:state.setWinsUs,setWinsThem:state.setWinsThem},events:[...events]}:null;
 const map=new Map(archived.map(x=>[x.matchId,x]));if(current)map.set(current.matchId,current);return [...map.values()]
}
function analysisFilteredMatches(prefix='a'){
 const val=id=>$('#'+prefix+id)?.value||'';return filterAnalysisMatches(analysisMatches(),{from:val('From'),to:val('To'),seasonId:val('Season'),teamId:val('Team'),oppId:val('Opponent'),typeId:val('Type')},analysisPinnedMatchId)
}
function analysisEvents(matches,prefix='a'){
 const val=id=>$('#'+prefix+id)?.value||'';return filterAnalysisEvents(matches,{playerId:val('Player'),technique:val('Technique'),rotation:val('Rotation'),setNo:val('Set')},ACTIONS)
}
function analysisFilterBlock(prefix,title,compare=false){const dates=analysisMatches().map(analysisDate).filter(Boolean).sort();return analysisFilterBlockHtml({prefix,title,compare,minDate:dates[0]||'',maxDate:dates.at(-1)||'',seasons:active(master.seasons),teams:active(master.teams),matchTypes:active(master.matchTypes),players:active(master.players),actions:ACTIONS,rotations:ROT,selectedTeamId:state.ownTeamId,escapeHtml:esc})}
function analysisQualityTable(evs){const acts=evs.filter(e=>analysisIsAction(e,ACTIONS)&&analysisActionSide(e)==='own');const counts={};for(const e of acts){const k=e.value||'–';counts[k]=(counts[k]||0)+1}return `<div class="analysis-table-wrap"><table class="data-table compact"><thead><tr><th>Qualität</th><th>Anzahl</th><th>Anteil</th></tr></thead><tbody>${Object.entries(counts).sort((a,b)=>(QUALITY_LEVEL[a[0]]??9)-(QUALITY_LEVEL[b[0]]??9)).map(([q,n])=>`<tr><td>${qualityChip(q)}</td><td>${n}</td><td>${pct(n,acts.length)}</td></tr>`).join('')||'<tr><td colspan="3">Keine Aktionen</td></tr>'}</tbody></table></div>`}
function analysisRotationTable(evs){const rm=analysisRallyMap(evs,ACTIONS);const rallies=[...rm.values()].filter(r=>r.result);return `<div class="analysis-table-wrap"><table class="data-table compact"><thead><tr><th>Rotation</th><th>Rallys</th><th>Punkte +/−</th><th>K1 Sideout</th><th>First Ball</th><th>K2 Break</th><th>Annahme +/#</th><th>Angriff #</th></tr></thead><tbody>${ROT.map(rot=>{const rr=rallies.filter(r=>r.result.rotation===rot),won=rr.filter(analysisWonOwn).length,lost=rr.length-won,k1=rr.filter(r=>r.result.serving_before==='them'),k2=rr.filter(r=>r.result.serving_before==='us'),recs=rr.flatMap(r=>r.actions).filter(e=>analysisActionSide(e)==='own'&&analysisActionName(e)==='Annahme'),atts=rr.flatMap(r=>r.actions).filter(e=>analysisActionSide(e)==='own'&&analysisActionName(e)==='Angriff');return `<tr><td>${rot}</td><td>${rr.length}</td><td>${won-lost>=0?'+':''}${won-lost}</td><td>${pct(k1.filter(analysisWonOwn).length,k1.length)}</td><td>${pct(k1.filter(analysisFirstBallSideout).length,k1.length)}</td><td>${pct(k2.filter(analysisWonOwn).length,k2.length)}</td><td>${pct(recs.filter(e=>['+','#'].includes(e.value)).length,recs.length)}</td><td>${pct(atts.filter(e=>e.value==='#').length,atts.length)}</td></tr>`}).join('')}</tbody></table></div>`}
function analysisPlayersTable(evs){const map=analysisRallyMap(evs,ACTIONS);const rows=active(master.players).map(p=>{const a=evs.filter(e=>e.player_id===p.id&&analysisIsAction(e,ACTIONS)&&analysisActionSide(e)==='own');return {p,a}}).filter(x=>x.a.length).sort((a,b)=>b.a.length-a.a.length);return `<div class="analysis-table-wrap"><table class="data-table compact"><thead><tr><th>Spielerin</th><th>Aktionen</th><th>#</th><th>+</th><th>0/!</th><th>−</th><th>=</th><th>Rally +*</th></tr></thead><tbody>${rows.map(({p,a})=>{const won=new Set(a.filter(e=>analysisWonOwn(analysisRallyForEvent(map,e))).map(e=>e.rally_id)).size;return `<tr><td>${esc(p.abbreviation)} · ${esc(p.firstName)} ${esc(p.lastName)}</td><td>${a.length}</td><td>${a.filter(e=>e.value==='#').length}</td><td>${a.filter(e=>e.value==='+').length}</td><td>${a.filter(e=>['0','!'].includes(e.value)).length}</td><td>${a.filter(e=>['-','/'].includes(e.value)).length}</td><td>${a.filter(e=>e.value==='=').length}</td><td>${won}</td></tr>`}).join('')||'<tr><td colspan="8">Keine Spielerinnenaktionen</td></tr>'}</tbody></table></div><p class="small">* Gewonnene Rallys mit mindestens einer Aktion dieser Spielerin; keine Kausalitätsaussage.</p>`}
function analysisPlayersOverviewTable(evs){const rows=active(master.players).map(p=>{const a=evs.filter(e=>e.player_id===p.id&&analysisIsAction(e,ACTIONS)&&analysisActionSide(e)==='own');if(!a.length)return null;const by=Object.fromEntries(ACTIONS.map(t=>[t,a.filter(e=>analysisActionName(e)===t).length]));const rallyIds=new Set(a.map(e=>e.rally_id).filter(Boolean)),rm=analysisRallyMap(evs,ACTIONS);let won=0,lost=0;for(const rid of rallyIds){if(analysisWonOwn(rm.get(rid)))won++;else if(rm.get(rid)?.result)lost++}return {p,a,by,won,lost}}).filter(Boolean).sort((x,y)=>y.a.length-x.a.length);return `<div class="analysis-table-wrap"><table class="data-table compact players-overview"><thead><tr><th>Spielerin</th><th>Aktionen</th>${ACTIONS.map(t=>`<th title="${esc(t)}">${esc(t)}</th>`).join('')}<th>Rallys +</th><th>Rallys −</th></tr></thead><tbody>${rows.map(({p,a,by,won,lost})=>`<tr><td>${esc(p.abbreviation)} · ${esc(p.firstName)} ${esc(p.lastName)}</td><td>${a.length}</td>${ACTIONS.map(t=>`<td>${by[t]||0}</td>`).join('')}<td>${won}</td><td>${lost}</td></tr>`).join('')||`<tr><td colspan="${ACTIONS.length+4}">Keine Spielerinnenaktionen</td></tr>`}</tbody></table></div><p class="small">Rallys +/− zeigen Mannschaftserfolg während der Beteiligung; Einzelaktionen bleiben getrennt auswertbar.</p>`}
function analysisK1K2Table(evs){const rm=analysisRallyMap(evs,ACTIONS),rallies=[...rm.values()].filter(r=>r.result);const k1=rallies.filter(r=>r.result.serving_before==='them'),k2=rallies.filter(r=>r.result.serving_before==='us'),fb=k1.filter(analysisFirstBallSideout);const recByQ={};for(const r of k1){const rec=r.actions.find(e=>analysisActionSide(e)==='own'&&analysisActionName(e)==='Annahme');const q=rec?.value||'ohne Annahme';if(!recByQ[q])recByQ[q]={n:0,w:0,fb:0};recByQ[q].n++;if(analysisWonOwn(r))recByQ[q].w++;if(analysisFirstBallSideout(r))recByQ[q].fb++}const qRows=Object.entries(recByQ).map(([q,x])=>`<tr><td>${esc(q)}</td><td>${x.n}</td><td>${pct(x.w,x.n)}</td><td>${pct(x.fb,x.n)}</td></tr>`).join('');return `<div class="analysis-kpis"><div><strong>${pct(k1.filter(analysisWonOwn).length,k1.length)}</strong><span>K1 Sideout</span></div><div><strong>${pct(fb.length,k1.length)}</strong><span>First-Ball-Sideout</span></div><div><strong>${pct(k2.filter(analysisWonOwn).length,k2.length)}</strong><span>K2 Breakpoint</span></div><div><strong>${k1.length}</strong><span>K1 Rallys</span></div><div><strong>${k2.length}</strong><span>K2 Rallys</span></div></div>${analysisRotationTable(evs)}<h4>Sideout nach Annahmequalität</h4><div class="analysis-table-wrap"><table class="data-table compact"><thead><tr><th>Annahme</th><th>Rallys</th><th>Sideout</th><th>First Ball</th></tr></thead><tbody>${qRows||'<tr><td colspan="4">Keine K1-Daten</td></tr>'}</tbody></table></div>`}
function analysisServeTable(evs){const rm=analysisRallyMap(evs,ACTIONS),serves=evs.filter(e=>analysisIsAction(e,ACTIONS)&&analysisActionSide(e)==='own'&&analysisActionName(e)==='Aufschlag');const groups=new Map();for(const e of serves){const p=e.player_abbreviation||e.player||'–',tech=e.serve_technique||'nicht erfasst',z=e.target_zone?`P${e.target_zone}`:'–',k=`${p}|${tech}|${z}`;if(!groups.has(k))groups.set(k,{p,tech,z,n:0,err:0,ace:0,breaks:0,oppRec:0,oppGood:0});const g=groups.get(k),r=analysisRallyForEvent(rm,e);g.n++;if(e.value==='=')g.err++;if(e.value==='#')g.ace++;if(analysisWonOwn(r))g.breaks++;const rec=r?.actions.find(x=>analysisActionSide(x)==='opponent'&&analysisActionName(x)==='Annahme');if(rec){g.oppRec++;if(['+','#'].includes(rec.value))g.oppGood++}}return `<div class="analysis-table-wrap"><table class="data-table compact"><thead><tr><th>Spielerin</th><th>Technik</th><th>Ziel</th><th>Aufschläge</th><th>Fehler</th><th>Asse</th><th>Breakpoint</th><th>Gegner +/#</th></tr></thead><tbody>${[...groups.values()].sort((a,b)=>b.n-a.n).map(g=>`<tr><td>${esc(g.p)}</td><td>${esc(g.tech)}</td><td>${g.z}</td><td>${g.n}</td><td>${pct(g.err,g.n)}</td><td>${pct(g.ace,g.n)}</td><td>${pct(g.breaks,g.n)}</td><td>${pct(g.oppGood,g.oppRec)}</td></tr>`).join('')||'<tr><td colspan="8">Keine Aufschläge</td></tr>'}</tbody></table></div>`}
function analysisReceptionTable(evs){const rm=analysisRallyMap(evs,ACTIONS),rows=new Map();for(const e of evs.filter(e=>analysisIsAction(e,ACTIONS)&&analysisActionSide(e)==='own'&&analysisActionName(e)==='Annahme')){const p=e.player_abbreviation||e.player||'–';if(!rows.has(p))rows.set(p,{p,n:0,pos:0,perfect:0,err:0,so:0,fb:0});const g=rows.get(p),r=analysisRallyForEvent(rm,e);g.n++;if(['+','#'].includes(e.value))g.pos++;if(e.value==='#')g.perfect++;if(e.value==='=')g.err++;if(r?.result?.serving_before==='them'&&analysisWonOwn(r))g.so++;if(analysisFirstBallSideout(r))g.fb++}return `<div class="analysis-table-wrap"><table class="data-table compact"><thead><tr><th>Spielerin</th><th>Annahmen</th><th>+/#</th><th># perfekt</th><th>= Fehler</th><th>Sideout danach</th><th>First Ball</th></tr></thead><tbody>${[...rows.values()].sort((a,b)=>b.n-a.n).map(g=>`<tr><td>${esc(g.p)}</td><td>${g.n}</td><td>${pct(g.pos,g.n)}</td><td>${pct(g.perfect,g.n)}</td><td>${pct(g.err,g.n)}</td><td>${pct(g.so,g.n)}</td><td>${pct(g.fb,g.n)}</td></tr>`).join('')||'<tr><td colspan="7">Keine Annahmen</td></tr>'}</tbody></table></div>`}
function analysisSetTable(evs){const rm=analysisRallyMap(evs,ACTIONS),groups=new Map();for(const e of evs.filter(e=>analysisIsAction(e,ACTIONS)&&analysisActionSide(e)==='own'&&analysisActionName(e)==='Zuspiel')){const r=analysisRallyForEvent(rm,e),next=r?.actions.find(x=>(+x.rally_sequence||0)>(+e.rally_sequence||0)&&analysisActionSide(x)==='own'&&analysisActionName(x)==='Angriff'),from=e.action_zone?`P${e.action_zone}`:'–',to=e.target_zone?`P${e.target_zone}`:'–',tempo=e.set_tempo||'–',dist=e.set_distance||'–',k=`${from}|${to}|${tempo}|${dist}`;if(!groups.has(k))groups.set(k,{from,to,tempo,dist,n:0,kill:0,att:0});const g=groups.get(k);g.n++;if(next){g.att++;if(next.value==='#')g.kill++}}return `<div class="analysis-table-wrap"><table class="data-table compact"><thead><tr><th>Zuspiel von</th><th>Ziel</th><th>Tempo</th><th>Distanz</th><th>Anzahl</th><th>Folgeangriff #</th></tr></thead><tbody>${[...groups.values()].sort((a,b)=>b.n-a.n).map(g=>`<tr><td>${g.from}</td><td>${g.to}</td><td>${esc(g.tempo)}</td><td>${esc(g.dist)}</td><td>${g.n}</td><td>${pct(g.kill,g.att)}</td></tr>`).join('')||'<tr><td colspan="6">Keine Zuspiele</td></tr>'}</tbody></table></div>`}
function analysisAttackTable(evs){const groups=new Map();for(const e of evs.filter(e=>analysisIsAction(e,ACTIONS)&&analysisActionSide(e)==='own'&&analysisActionName(e)==='Angriff')){const p=e.player_abbreviation||e.player||'–',from=e.action_zone?`P${e.action_zone}`:'–',to=e.target_zone?`P${e.target_zone}`:'–',k=`${p}|${from}|${to}`;if(!groups.has(k))groups.set(k,{p,from,to,n:0,kill:0,err:0,blocked:0});const g=groups.get(k);g.n++;if(e.value==='#')g.kill++;if(e.value==='=')g.err++;if(e.value==='/')g.blocked++}return `<div class="analysis-table-wrap"><table class="data-table compact"><thead><tr><th>Angreiferin</th><th>Von</th><th>Nach</th><th>Angriffe</th><th>Punktquote</th><th>Fehler</th><th>Geblockt</th><th>Effizienz</th></tr></thead><tbody>${[...groups.values()].sort((a,b)=>b.n-a.n).map(g=>{const eff=g.n?`${(100*(g.kill-g.err-g.blocked)/g.n).toFixed(1)} %`:'–';return `<tr><td>${esc(g.p)}</td><td>${g.from}</td><td>${g.to}</td><td>${g.n}</td><td>${pct(g.kill,g.n)}</td><td>${pct(g.err,g.n)}</td><td>${pct(g.blocked,g.n)}</td><td>${eff}</td></tr>`}).join('')||'<tr><td colspan="8">Keine Angriffe</td></tr>'}</tbody></table></div>`}
function analysisChainsTable(evs){const rm=analysisRallyMap(evs,ACTIONS),groups=new Map();for(const r of rm.values()){const a=r.actions.filter(e=>analysisActionSide(e)==='own');for(let i=0;i<a.length;i++){if(analysisActionName(a[i])!=='Annahme')continue;const set=a.slice(i+1).find(e=>analysisActionName(e)==='Zuspiel');if(!set)continue;const att=a.find(e=>(+e.rally_sequence||0)>(+set.rally_sequence||0)&&analysisActionName(e)==='Angriff');if(!att)continue;const key=[a[i].player_abbreviation||a[i].player||'–',a[i].value||'–',set.action_zone||'–',set.target_zone||'–',att.player_abbreviation||att.player||'–',att.action_zone||'–',att.target_zone||'–'].join('|');if(!groups.has(key))groups.set(key,{rec:a[i].player_abbreviation||a[i].player||'–',rq:a[i].value||'–',sz:set.action_zone||'–',st:set.target_zone||'–',att:att.player_abbreviation||att.player||'–',az:att.action_zone||'–',at:att.target_zone||'–',n:0,won:0,kill:0});const g=groups.get(key);g.n++;if(analysisWonOwn(r))g.won++;if(att.value==='#')g.kill++;break}}return `<p class="small">Kontextketten werden nur gebildet, wenn Annahme → Zuspiel → Angriff innerhalb derselben Rally vollständig erfasst wurde.</p><div class="analysis-table-wrap"><table class="data-table compact"><thead><tr><th>Annahme</th><th>Qual.</th><th>Zuspiel von→nach</th><th>Angriff</th><th>von→nach</th><th>Anzahl</th><th>Angriff #</th><th>Rally +</th></tr></thead><tbody>${[...groups.values()].sort((a,b)=>b.n-a.n).slice(0,40).map(g=>`<tr><td>${esc(g.rec)}</td><td>${esc(g.rq)}</td><td>P${g.sz} → P${g.st}</td><td>${esc(g.att)}</td><td>P${g.az} → P${g.at}</td><td>${g.n}</td><td>${pct(g.kill,g.n)}</td><td>${pct(g.won,g.n)}</td></tr>`).join('')||'<tr><td colspan="8">Noch keine vollständigen Kontextketten</td></tr>'}</tbody></table></div>`}
function analysisOpponentTable(evs){const attacks=evs.filter(e=>analysisIsAction(e,ACTIONS)&&analysisActionSide(e)==='opponent'&&analysisActionName(e)==='Angriff'),serves=evs.filter(e=>analysisIsAction(e,ACTIONS)&&analysisActionSide(e)==='opponent'&&analysisActionName(e)==='Aufschlag'),sets=evs.filter(e=>analysisIsAction(e,ACTIONS)&&analysisActionSide(e)==='opponent'&&analysisActionName(e)==='Zuspiel');const tally=(arr,keyFn)=>{const m=new Map();for(const e of arr){const k=keyFn(e);m.set(k,(m.get(k)||0)+1)}return [...m].sort((a,b)=>b[1]-a[1]).slice(0,12)};const attackRows=tally(attacks,e=>`${e.player_abbreviation||e.player||'–'}|P${e.action_zone||'–'}|P${e.target_zone||'–'}`).map(([k,n])=>{const [p,f,t]=k.split('|');return `<tr><td>${esc(p)}</td><td>${f}</td><td>${t}</td><td>${n}</td><td>${pct(n,attacks.length)}</td></tr>`}).join('');const serveRows=tally(serves,e=>`P${e.target_zone||'–'}|${e.serve_technique||'nicht erfasst'}`).map(([k,n])=>{const [z,t]=k.split('|');return `<tr><td>${z}</td><td>${esc(t)}</td><td>${n}</td><td>${pct(n,serves.length)}</td></tr>`}).join('');const setRows=tally(sets,e=>`P${e.action_zone||'–'}|P${e.target_zone||'–'}`).map(([k,n])=>{const [f,t]=k.split('|');return `<tr><td>${f}</td><td>${t}</td><td>${n}</td><td>${pct(n,sets.length)}</td></tr>`}).join('');return `<div class="analysis-split"><section><h4>Angriffstendenzen</h4><div class="analysis-table-wrap"><table class="data-table compact"><thead><tr><th>Spielerin</th><th>Von</th><th>Nach</th><th>Anzahl</th><th>Anteil</th></tr></thead><tbody>${attackRows||'<tr><td colspan="5">Keine Gegnerangriffe</td></tr>'}</tbody></table></div></section><section><h4>Aufschlagziele</h4><div class="analysis-table-wrap"><table class="data-table compact"><thead><tr><th>Ziel</th><th>Technik</th><th>Anzahl</th><th>Anteil</th></tr></thead><tbody>${serveRows||'<tr><td colspan="4">Keine Gegneraufschläge</td></tr>'}</tbody></table></div></section><section><h4>Zuspielwege</h4><div class="analysis-table-wrap"><table class="data-table compact"><thead><tr><th>Von</th><th>Nach</th><th>Anzahl</th><th>Anteil</th></tr></thead><tbody>${setRows||'<tr><td colspan="4">Keine Gegnerzuspiele</td></tr>'}</tbody></table></div></section></div>`}
function analysisOverview(evs,matches){const rm=analysisRallyMap(evs,ACTIONS),rallies=[...rm.values()].filter(r=>r.result),own=rallies.filter(analysisWonOwn),k1=rallies.filter(r=>r.result.serving_before==='them'),k2=rallies.filter(r=>r.result.serving_before==='us'),fb=k1.filter(analysisFirstBallSideout),acts=evs.filter(e=>analysisIsAction(e,ACTIONS)),ownTerminal=acts.filter(e=>analysisActionSide(e)==='own'&&['Aufschlag','Angriff','Block'].includes(analysisActionName(e))&&e.value==='#'),oppErrors=acts.filter(e=>analysisActionSide(e)==='opponent'&&e.value==='=');const bySource={Aufschlag:0,Angriff:0,Block:0};for(const e of ownTerminal)bySource[analysisActionName(e)]++;const insights=[];const rotStats=ROT.map(rot=>{const rr=k1.filter(r=>r.result.rotation===rot);return {rot,n:rr.length,rate:rr.length?rr.filter(analysisWonOwn).length/rr.length:null}}).filter(x=>x.n>=3).sort((a,b)=>a.rate-b.rate);if(rotStats[0])insights.push(`${rotStats[0].rot}: ${pct(rotStats[0].rate*rotStats[0].n,rotStats[0].n)} Sideout bei ${rotStats[0].n} K1-Rallys.`);const bestServe=(()=>{const m=new Map();for(const e of acts.filter(e=>analysisActionSide(e)==='own'&&analysisActionName(e)==='Aufschlag')){const p=e.player_abbreviation||e.player||'–',r=analysisRallyForEvent(rm,e);if(!m.has(p))m.set(p,{n:0,w:0});const x=m.get(p);x.n++;if(analysisWonOwn(r))x.w++}return [...m].filter(([,x])=>x.n>=4).sort((a,b)=>b[1].w/b[1].n-a[1].w/a[1].n)[0]})();if(bestServe)insights.push(`${bestServe[0]}: ${pct(bestServe[1].w,bestServe[1].n)} Breakpoint während eigener Aufschläge (${bestServe[1].n}).`);return `<div class="analysis-kpis"><div><strong>${matches.length}</strong><span>Spiele</span></div><div><strong>${rallies.length}</strong><span>Rallys</span></div><div><strong>${pct(own.length,rallies.length)}</strong><span>Rallyquote Wir</span></div><div><strong>${pct(k1.filter(analysisWonOwn).length,k1.length)}</strong><span>K1 Sideout</span></div><div><strong>${pct(k2.filter(analysisWonOwn).length,k2.length)}</strong><span>K2 Break</span></div><div><strong>${pct(fb.length,k1.length)}</strong><span>First Ball</span></div></div><div class="analysis-split"><section><h4>Eigene direkte Punktaktionen</h4><div class="analysis-mini-bars">${Object.entries(bySource).map(([k,n])=>`<div><span>${k}</span><strong>${n}</strong></div>`).join('')}<div><span>Gegnerfehler</span><strong>${oppErrors.length}</strong></div></div></section><section><h4>Auffälligkeiten</h4><ul class="analysis-insights">${insights.map(x=>`<li>${esc(x)}</li>`).join('')||'<li>Noch zu wenig Daten für belastbare Tendenzen.</li>'}</ul></section></div><h4>Rotationen</h4>${analysisRotationTable(evs)}`}
function analysisRallyTable(evs){const rs=evs.filter(e=>e.event_type==='rally_result').slice(-100).reverse();return `<div class="analysis-table-wrap"><table class="data-table compact"><thead><tr><th>Rally</th><th>Satz</th><th>Rotation</th><th>Aktionen</th><th>Gewinner</th><th>Stand</th></tr></thead><tbody>${rs.map(r=>{const n=evs.filter(e=>e.rally_id&&e.rally_id===r.rally_id&&e.event_type!=='rally_result').length;return `<tr><td>${esc(r.rally_no||r.rally_id)}</td><td>${esc(r.set)}</td><td>${esc(r.rotation)}</td><td>${n}</td><td>${r.rally_winner==='us'?'Wir':'Gegner'}</td><td>${esc(r.score_us)}:${esc(r.score_them)}</td></tr>`}).join('')||'<tr><td colspan="6">Keine abgeschlossenen Rallys</td></tr>'}</tbody></table></div>`}
function renderAnalysisResult(){const ma=analysisFilteredMatches('a'),ea=analysisEvents(ma,'a'),sa=analysisStats(ma,ea,ACTIONS),compare=$('#analysisCompare')?.checked,mb=compare?analysisFilteredMatches('b'):[],eb=compare?analysisEvents(mb,'b'):[],sb=compare?analysisStats(mb,eb,ACTIONS):null;const view=$('#analysisView')?.value||'overview';const renderView=(v,evs,matches)=>{if(v==='k1k2')return analysisK1K2Table(evs);if(v==='rotations')return analysisRotationTable(evs);if(v==='serve')return analysisServeTable(evs);if(v==='reception')return analysisReceptionTable(evs);if(v==='sets')return analysisSetTable(evs);if(v==='attacks')return analysisAttackTable(evs);if(v==='chains')return analysisChainsTable(evs);if(v==='opponent')return analysisOpponentTable(evs);if(v==='playersOverview')return analysisPlayersOverviewTable(evs);if(v==='players')return analysisPlayersTable(evs);if(v==='techniques')return analysisQualityTable(evs);if(v==='rallies')return analysisRallyTable(evs);return analysisOverview(evs,matches)};const content=renderView(view,ea,ma);let comp='';if(compare&&sb)comp=`<div class="card analysis-compare-result"><h3>Vergleich B</h3><div class="analysis-kpis"><div><strong>${sb.matches}</strong><span>Spiele</span></div><div><strong>${sb.actions}</strong><span>Aktionen</span></div><div><strong>${sb.rallies}</strong><span>Rallys</span></div><div><strong>${sb.own}:${sb.opp}</strong><span>Rallys Wir:Gegner</span></div><div><strong>${sb.win}</strong><span>Rallyquote Wir</span></div></div>${renderView(view,eb,mb)}</div>`;$('#analysisResult').innerHTML=analysisResultShellHtml({content,compareContent:comp,compare})}
function drawAnalysis(){const b=$('#drawerBody');const pinned=analysisPinnedMatchId?analysisMatches().find(m=>m.matchId===analysisPinnedMatchId):null;b.innerHTML=`${pinned?`<div class="card analysis-pinned"><strong>Spielanalyse: ${esc(matchNames(pinned))}</strong><span>${esc(pinned.matchDate||'')} · ${esc(matchScoreText(pinned))}</span><button id="analysisAllMatches">Alle Spiele analysieren</button></div>`:''}<div class="card analysis-card"><div class="analysis-heading"><h3>Analyse <span class="preview-pill">0.4.0 RC4-r2</span></h3><p class="small">Vom Spielüberblick bis zur Kontextkette · gleiche Datenbasis für einfaches und detailliertes Scouting.</p></div><div class="analysis-top"><label>Ansicht <select id="analysisView"><option value="overview">Spiel- / Satzübersicht</option><option value="rotations">Rotations-Dashboard</option><option value="k1k2">K1 / Sideout & K2 / Break</option><option value="serve">Aufschlaganalyse</option><option value="reception">Annahmeanalyse</option><option value="sets">Zuspielverteilung</option><option value="attacks">Angriff · Quelle → Ziel</option><option value="chains">Kontextketten</option><option value="opponent">Gegner-Tendenzen</option><option value="playersOverview">Spielerinnen – Übersicht</option><option value="players">Spielerinnen – Qualität</option><option value="techniques">Techniken / Qualität</option><option value="rallies">Rallys</option></select></label><label class="analysis-compare-toggle"><input id="analysisCompare" type="checkbox"> Zeitraum A mit B vergleichen</label></div>${analysisFilterBlock('a','Zeitraum / Filter A')}<div id="analysisB" hidden>${analysisFilterBlock('b','Zeitraum / Filter B',true)}</div><div class="toolbar mt"><button id="runAnalysis" class="primary">Auswerten</button></div></div><div id="analysisResult"></div>`;if($('#analysisAllMatches'))$('#analysisAllMatches').onclick=()=>{analysisPinnedMatchId='';drawAnalysis()};$('#analysisCompare').onchange=()=>{$('#analysisB').hidden=!$('#analysisCompare').checked};$('#runAnalysis').onclick=renderAnalysisResult;$('#analysisView').onchange=renderAnalysisResult;renderAnalysisResult()}

function cameraInstructionText(adapter,connected,recording){if(recording)return 'Aufnahme läuft. Zeitstempel und Scouting-Zeit sind synchronisiert.';if(connected)return 'Kamera verbunden · Verbindung bleibt nach Aufnahme-Stopp aktiv. Trennen beendet die Kopplung.';return adapter==='gopro_open'?'GoPro einschalten und Pairing-Modus aktivieren, anschließend „Kamera verbinden“ wählen.':'DJI Osmo Action einschalten, anschließend „Kamera verbinden“ wählen.'}
function drawCamera(){
 const b=$('#drawerBody'),connected=!!camera?.protocolConnected,adapter=settings.camera?.adapter||'dji_osmo',q=cameraConnectionQuality();
 const pct=Number.isFinite(+cameraBatteryValue)?Math.max(0,Math.min(100,+cameraBatteryValue)):null;
 b.innerHTML=`${cameraSupportNoticeHtml()}<div class="card camera-compact-card">
 <div class="camera-compact-row">
  <label class="camera-adapter-inline"><span class="camera-label-row">Kamera <button type="button" id="cameraCompatInfo" class="camera-info-btn" title="Unterstützte Kameramodelle anzeigen" aria-label="Unterstützte Kameramodelle anzeigen">ⓘ</button></span><select id="cameraAdapter" ${connected?'disabled':''}>
   <option value="dji_osmo" ${adapter==='dji_osmo'?'selected':''}>DJI Osmo Action</option>
   <option value="gopro_open" ${adapter==='gopro_open'?'selected':''}>GoPro HERO</option>
  </select></label>
  <div class="camera-inline-stat status"><span>Status</span><strong id="cameraState">${connected?'Verbunden':'Nicht verbunden'}</strong></div>
  <div class="camera-inline-stat battery-stat"><span>Akku</span><div class="camera-drawer-battery"><span class="camera-battery-shell"><i id="cameraDrawerBatteryFill" style="width:${pct==null?0:pct}%"></i></span><small id="cameraBattery">${pct==null?'– %':`${Math.round(pct)} %`}</small></div></div>
  <div class="camera-inline-stat" title="Aus Statusalter, Fehlern und Wiederverbindungen abgeleitete Qualitätsanzeige; keine RSSI-Messung."><span>Qualität*</span><strong id="cameraQuality" class="camera-quality ${q.state}">${q.label}</strong></div>
  <button id="connectCamera" class="camera-connect-inline ${connected?'danger':'primary'}">${connected?'Trennen':'Kamera verbinden'}</button>
 </div>
 <p id="cameraQuickGuide" class="camera-quick-guide">${cameraInstructionText(adapter,connected,state.cameraRecording)}${connected?'':' · Kamera einschalten → Kamera verbinden.'}</p><div id="cameraCompatHelp" class="camera-compat-help" hidden><strong>Unterstützte Modelle</strong><br><strong>DJI:</strong> Osmo Action 4, Osmo Action 5 Pro, Osmo Action 6 und Osmo 360 (DJI R-SDK/BLE). Action 2 und Osmo Action 3 werden von diesem Adapter nicht unterstützt.<br><strong>GoPro:</strong> HERO9 Black, HERO10 Black, HERO11 Black, HERO11 Black Mini, HERO12 Black und HERO13 Black. Der Adapter nutzt die Open-GoPro-BLE-Unterstützung. Weitere Open-GoPro-Geräte können technisch kompatibel sein; Details stehen in der Hilfe.</div>
 <p class="camera-quality-note">* Qualitätsanzeige aus Statusalter, Fehlern und Wiederverbindungen; Web Bluetooth liefert browserübergreifend keine verlässliche RSSI-Anzeige.</p>
 ${connected?`<div class="camera-actions camera-record-actions"><button id="recordStart" ${state.cameraRecording?'disabled':''}>● Aufnahme + Sync</button><button id="recordStop" ${!state.cameraRecording?'disabled':''}>■ Stop</button></div>`:''}
 <div class="toolbar camera-local-time"><button id="localClock" class="primary">Lokale Zeit Start / Pause / Fortsetzen</button><button id="localClockReset">Lokale Zeit auf 00:00.0</button></div>
 </div>
 ${cameraDiagVisible?`<section class="ble-diag" id="bleDiag"><h3>Bluetooth-Diagnose</h3><p class="small ble-diag-reason">Wird nur angezeigt, weil die letzte Kameraverbindung nicht erfolgreich war.</p><div class="ble-diag-grid"><span>Sicherer HTTPS-Kontext</span><strong id="diagSecure">–</strong><span>Web Bluetooth API</span><strong id="diagApi">–</strong><span>Bluetooth verfügbar</span><strong id="diagAvailability">–</strong><span>Browser</span><strong id="diagBrowser">–</strong><span>Geräteauswahl</span><strong id="diagChooser">–</strong><span>Ausgewähltes Gerät</span><strong id="diagDevice">–</strong><span>GATT</span><strong id="diagGatt">–</strong><span>Kamera-Service</span><strong id="diagService">–</strong><span>Notify/Response</span><strong id="diagNotify">–</strong><span>Write/Command</span><strong id="diagWrite">–</strong><span>Notifications</span><strong id="diagNotifications">–</strong><span>Protokoll</span><strong id="diagHandshake">–</strong><span>Letzter Fehler</span><strong id="diagError">–</strong></div><div class="ble-diag-actions"><button id="refreshBleDiag">Diagnose aktualisieren</button><button id="clearBleLog">Protokoll löschen</button></div><pre id="bleLog" class="ble-diag-log"></pre></section>`:''}`;
 const compatBtn=$('#cameraCompatInfo'),compatHelp=$('#cameraCompatHelp');if(compatBtn&&compatHelp)compatBtn.onclick=()=>{compatHelp.hidden=!compatHelp.hidden};
 $('#cameraAdapter').onchange=e=>{cameraService.configure({adapter:e.target.value,statusIntervalMs:settings.camera?.statusIntervalMs});camera=null;cameraDiagVisible=false;settings.camera.adapter=e.target.value;saveSettings(settings);cameraDiagLog=[];cameraBatteryValue=null;cameraLastStatusAt=0;render();drawCamera()};
 $('#connectCamera').onclick=connected?()=>{disconnectCamera();cameraDiagVisible=false;drawCamera()}:connectCamera;
 if($('#recordStart'))$('#recordStart').onclick=startRecording;
 if($('#recordStop'))$('#recordStop').onclick=stopRecording;
 $('#localClock').onclick=toggleLocalClock;$('#localClockReset').onclick=resetLocalClock;
 if($('#refreshBleDiag'))$('#refreshBleDiag').onclick=probeBluetooth;
 if($('#clearBleLog'))$('#clearBleLog').onclick=()=>{cameraDiagLog=[];cameraDiag.lastError='–';renderCameraDiagnostics()};
 if(cameraDiagVisible)renderCameraDiagnostics();
 updateCameraUi(true)
}
function syncCameraTelemetry(snapshot){cameraLastStatusAt=snapshot.lastStatusAt;cameraReconnects=snapshot.reconnects;cameraStatusFailures=snapshot.statusFailures;cameraBatteryValue=snapshot.battery??cameraBatteryValue;cameraClipStartRecordTime=snapshot.clipStartRecordTime||cameraClipStartRecordTime}
cameraService.subscribe(({type,detail,snapshot})=>{syncCameraTelemetry(snapshot);camera=cameraService.camera;if(type==='diagnostic'){handleCameraDiagnostic(detail);updateCameraUi()}else if(type==='ble'){if(!detail?.connected){state.cameraRecording=false;cameraAnchor=null;persist()}updateCameraUi(true)}else if(type==='reconnected'){cameraDiagVisible=false;updateCameraUi(true);if($('#drawerBody')&&$('#cameraAdapter'))drawCamera()}else if(type==='status'){if(detail.recording){state.cameraRecording=true;if(!state.videoClipId)newVideoClipId();const relative=Math.max(0,(Number(detail.recordTime)||0)-cameraClipStartRecordTime);cameraAnchor={cameraSec:relative,perf:detail.receivedPerf||performance.now()};state.clockMode='camera'}else if(state.cameraRecording){state.cameraRecording=false;cameraAnchor=null;state.clockMode='camera'}updateCameraUi(false)}});
async function connectCamera(){
 try{
  cameraDiagVisible=false;cameraDiag.lastError='–';cameraDiag.chooser='Nicht gestartet';cameraDiag.device='–';cameraDiag.gatt='Nein';cameraDiag.service='Nein';cameraDiag.notify='Nein';cameraDiag.write='Nein';cameraDiag.notifications='Nein';cameraDiag.handshake='Nein';
  cameraService.configure({adapter:settings.camera?.adapter||'dji_osmo',statusIntervalMs:Number(settings.camera?.statusIntervalMs)||12000});
  dlog(`Lade ${cameraDefaultName()} Kamera-Service …`);camera=await cameraService.connect();syncCameraTelemetry(cameraService.snapshot());
  state.cameraRecording=!!camera.latestStatus?.recording;cameraBatteryValue=camera.latestStatus?.battery??cameraBatteryValue;
  persist();updateCameraUi(true);setStatus(`${cameraShortName()} Kamera verbunden.`);drawCamera()
 }catch(e){
  cameraService.markFailure();syncCameraTelemetry(cameraService.snapshot());cameraStatusFailures=Math.max(cameraStatusFailures,1);cameraDiagVisible=true;setCameraDiag('lastError',e.message||String(e));
  setStatus(`${cameraShortName()}: ${e.message}`);dlog('FEHLER: '+e.message);drawCamera();
  try{await probeBluetooth()}catch{}updateCameraUi(true)
 }
}
async function startRecording(){try{if(!camera?.protocolConnected)throw new Error('Kamera noch nicht verbunden.');setStatus('Aufnahmebefehl gesendet – warte auf Kamera-Feedback …');state.localClockRunning=false;state.localClockStartedAt=0;state.localClockElapsed=0;state.clockMode='camera';state.cameraRecording=false;newVideoClipId();persist();const s=await cameraService.startRecording();syncCameraTelemetry(cameraService.snapshot());cameraClipStartRecordTime=Number(s.recordTime)||0;cameraAnchor={cameraSec:0,perf:s.receivedPerf||performance.now()};state.cameraRecording=true;state.localClockElapsed=0;persist();render();updateCameraUi(true);setStatus('Kamera bestätigt neue Aufnahme – Clip-Timestamp bei 00:00.0 synchronisiert.')}catch(e){state.cameraRecording=false;cameraAnchor=null;cameraStatusFailures++;persist();updateCameraUi();setStatus(e.message)}}
async function stopRecording(){try{if(!camera?.protocolConnected)throw new Error('Kamera noch nicht verbunden.');if(!state.cameraRecording){setStatus('Kamera ist verbunden, aber es läuft keine Aufnahme.');return}const sec=currentSeconds();await cameraService.stopRecording();syncCameraTelemetry(cameraService.snapshot());cameraAnchor=null;state.localClockElapsed=sec;state.localClockRunning=false;state.localClockStartedAt=0;state.clockMode='camera';state.cameraRecording=false;persist();render();updateCameraUi(true);setStatus('Kamera bestätigt Aufnahmeende · Verbindung bleibt aktiv.')}catch(e){cameraStatusFailures++;updateCameraUi();setStatus(e.message)}}

const PROVIDER_LABELS={none:'Lokal',nextcloud:'Nextcloud',webdav:'WebDAV',google:'Google Drive',icloud:'Apple iCloud',onedrive:'OneDrive',dropbox:'Dropbox',box:'Box'};
const providerLabel=()=>PROVIDER_LABELS[settings.sync?.provider]||settings.sync?.provider||'Cloud';
let syncUiState='ready',syncUiPending=0,syncUiLastError='';
function updateSyncBadge(){const el=$('#syncBadge');if(!el)return;const p=settings.sync?.provider||'none';if(p==='none'){el.textContent='☁ Cloud: aus';el.className='badge muted';el.title='Keine Cloudverbindung eingerichtet.';return}const label=providerLabel();const text=syncUiState==='synced'?`☁ ${label} ✓`:syncUiState==='connecting'||syncUiState==='syncing'?`☁ ${label} …`:syncUiState==='pending'?`☁ ${label}${syncUiPending?` · ${syncUiPending} ausstehend`: ' · ausstehend'}`:syncUiState==='offline'?`☁ ${label} offline${syncUiPending?` · ${syncUiPending}`:''}`:syncUiState==='error'?`☁ ${label} ✕`:syncUiState==='incomplete'?`☁ ${label} unvollständig`:syncUiState==='locked'?`☁ ${label} gesperrt`:`☁ ${label} bereit`;el.textContent=text;el.className='badge '+(syncUiState==='synced'?'ok':['offline','error','locked','incomplete'].includes(syncUiState)?'warn':'muted');el.title=syncUiState==='error'?(syncUiLastError||'Cloud-Verbindung fehlgeschlagen.'):syncUiState==='synced'?'Cloud-Verbindung erfolgreich.':syncUiState==='connecting'?'Cloud-Verbindung wird geprüft.':''}
function syncProviderFields(){const p=$('#sProvider')?.value||'none';$$('[data-sync-provider]').forEach(el=>{const allowed=el.dataset.syncProvider.split(',');el.hidden=!allowed.includes(p)});const note=$('#providerNote');if(note){const notes={none:'Keine Cloud-Synchronisation aktiv.',nextcloud:'Nextcloud wird über WebDAV angebunden.',webdav:'Generisches WebDAV. Der Zielhost muss serverseitig im Relay freigegeben sein.',google:'Google Drive verwendet OAuth und die Google Drive API.',icloud:'Apple iCloud ist als CloudKit-Adapter vorgesehen; benötigt Container-ID und API-Token.',onedrive:'OneDrive verwendet Microsoft Graph/OAuth; benötigt eine App-/Client-ID.',dropbox:'Dropbox verwendet die Dropbox API/OAuth; benötigt einen App-Key.',box:'Box verwendet die Box API/OAuth; benötigt eine Client-ID.'};note.textContent=notes[p]||''}}
function drawSync(){const c=settings.sync||{},shownUrl=normalizeServerUrl(c.url||''),b=$('#drawerBody');b.innerHTML=`<div class="card sync-card"><div class="form-grid"><label>Anbieter</label><select id="sProvider"><option value="none" ${c.provider==='none'?'selected':''}>Keine Synchronisation</option><option value="nextcloud" ${c.provider==='nextcloud'?'selected':''}>Nextcloud</option><option value="webdav" ${c.provider==='webdav'?'selected':''}>WebDAV</option><option value="google" ${c.provider==='google'?'selected':''}>Google Drive</option><option value="icloud" ${c.provider==='icloud'?'selected':''}>Apple iCloud</option><option value="onedrive" ${c.provider==='onedrive'?'selected':''}>Microsoft OneDrive</option><option value="dropbox" ${c.provider==='dropbox'?'selected':''}>Dropbox</option><option value="box" ${c.provider==='box'?'selected':''}>Box</option></select>
<div class="sync-field" data-sync-provider="nextcloud,webdav"><label>Server / WebDAV-URL</label><input id="sUrl" inputmode="url" autocomplete="url" placeholder="https://cloud.example.de" value="${esc(shownUrl)}"></div><div class="sync-field" data-sync-provider="nextcloud,webdav"><label>Benutzer</label><input id="sUser" value="${esc(c.username||'')}"></div><div class="sync-field" data-sync-provider="nextcloud,webdav"><label>App-Passwort</label><input id="sPass" type="password" value="${esc(c.password||'')}"></div>
<div class="sync-field" data-sync-provider="nextcloud,webdav,google,icloud,onedrive,dropbox,box"><label>Cloud-Ordner</label><input id="sPath" value="${esc(c.path||'VolleyTakt')}"></div>
<div class="sync-field" data-sync-provider="google"><label>Google OAuth Client-ID</label><input id="sClient" value="${esc(c.clientId||'')}"></div>
<div class="sync-field" data-sync-provider="onedrive"><label>Microsoft Client-ID</label><input id="sOneDriveClient" value="${esc(c.oneDriveClientId||'')}"></div>
<div class="sync-field" data-sync-provider="dropbox"><label>Dropbox App-Key</label><input id="sDropboxClient" value="${esc(c.dropboxClientId||'')}"></div>
<div class="sync-field" data-sync-provider="box"><label>Box Client-ID</label><input id="sBoxClient" value="${esc(c.boxClientId||'')}"></div>
<div class="sync-field" data-sync-provider="icloud"><label>CloudKit Container-ID</label><input id="sAppleContainer" placeholder="iCloud.…" value="${esc(c.appleContainerId||'')}"></div><div class="sync-field" data-sync-provider="icloud"><label>CloudKit API-Token</label><input id="sAppleToken" type="password" value="${esc(c.appleApiToken||'')}"></div><div class="sync-field" data-sync-provider="icloud"><label>CloudKit Umgebung</label><select id="sAppleEnvironment"><option value="production" ${c.appleEnvironment!=='development'?'selected':''}>Production</option><option value="development" ${c.appleEnvironment==='development'?'selected':''}>Development</option></select></div></div>
<p id="providerNote" class="small"></p><p class="small" data-sync-provider="nextcloud,webdav">HTTPS ist Standard; fehlendes <code>https://</code> wird automatisch ergänzt.</p><label><input id="sAutoStart" type="checkbox" ${c.autoStart?'checked':''}> Beim Start synchronisieren</label><br><label><input id="sAutoChange" type="checkbox" ${c.autoChange?'checked':''}> Live-Daten automatisch (nahezu live) synchronisieren</label><div class="toolbar mt"><button id="saveSync">Einstellungen speichern</button><button id="testSync">Verbindung testen</button><button id="runSync" class="primary">Jetzt synchronisieren</button></div><pre id="syncLog" class="sync-log">Bereit.</pre></div>`;$('#sProvider').addEventListener('change',syncProviderFields);$('#sUrl')?.addEventListener('blur',e=>{e.currentTarget.value=normalizeServerUrl(e.currentTarget.value)});syncProviderFields();$('#saveSync').onclick=saveSyncSettings;$('#testSync').onclick=async()=>{saveSyncSettings();const l=$('#syncLog');try{l.textContent='Teste Verbindung …';await createProvider(settings.sync).test();l.textContent='✓ Verbindung erfolgreich.';syncUiState='synced';updateSyncBadge()}catch(e){l.textContent='✕ '+e.message;syncUiState='error';syncUiLastError=e.message||String(e);updateSyncBadge()}};$('#runSync').onclick=()=>{saveSyncSettings();runSync(true)}}
function saveSyncSettings(){const p=$('#sProvider')?.value||settings.sync?.provider||'none';settings.sync={...settings.sync,provider:p,url:$('#sUrl')?normalizeServerUrl($('#sUrl').value):settings.sync.url,path:$('#sPath')?.value.trim()||'VolleyTakt',username:$('#sUser')?.value.trim()||settings.sync.username||'',password:$('#sPass')?.value||settings.sync.password||'',clientId:$('#sClient')?.value.trim()||settings.sync.clientId||'',oneDriveClientId:$('#sOneDriveClient')?.value.trim()||settings.sync.oneDriveClientId||'',dropboxClientId:$('#sDropboxClient')?.value.trim()||settings.sync.dropboxClientId||'',boxClientId:$('#sBoxClient')?.value.trim()||settings.sync.boxClientId||'',appleContainerId:$('#sAppleContainer')?.value.trim()||settings.sync.appleContainerId||'',appleApiToken:$('#sAppleToken')?.value||settings.sync.appleApiToken||'',appleEnvironment:$('#sAppleEnvironment')?.value||settings.sync.appleEnvironment||'production',autoStart:$('#sAutoStart')?.checked??settings.sync.autoStart,autoChange:$('#sAutoChange')?.checked??settings.sync.autoChange};saveSettings(settings);syncUiState='ready';updateSyncBadge();setStatus('Synchronisationseinstellungen gespeichert.')}
async function runLiveSync(verbose=false){
 if(liveSyncBusy){liveSyncPending=true;return false}if(state.quickScoutDraft||!state.matchId||!['nextcloud','webdav'].includes(settings.sync?.provider))return true;
 liveSyncBusy=true;liveSyncPending=false;const log=verbose?$('#syncLog'):null;
 try{const r=await syncLiveSession({matchId:state.matchId,generation:state.syncGeneration,deviceId:deviceId(),deviceName:deviceName(),...matchDisplayMeta(state),updatedAt:new Date().toISOString(),videos:[...(state.videoAssignments||[])],state:{...state,selectedPos:0,selectedOppPos:0,pendingSide:null,pendingAction:null,pendingQuality:null,inputStep:'WER',selectedPlayerId:'',selectedPlayerPos:0,actionZone:0,targetZone:0,targetSide:'',actionStartedSeconds:null,actionStartedAt:'',setTempo:'',setDistance:'',serveTechnique:'',autoServePreset:false},events},settings.sync,m=>{if(log)log.textContent=m;syncUiState='syncing';updateSyncBadge()});state.syncGeneration=r.generation||state.syncGeneration;saveState(state);syncUiState='synced';syncUiPending=0;updateSyncBadge();if(log)log.textContent=`✓ Live-Session synchron · ${r.eventCount||0} Einträge`;return true;}
 catch(e){syncUiState=['SESSION_LOCKED','SESSION_TAKEN_OVER','SESSION_LOCK_RACE'].includes(e.code)?'locked':'offline';syncUiLastError=e.message||String(e);updateSyncBadge();if(log)log.textContent='✕ '+e.message;if(['SESSION_LOCKED','SESSION_TAKEN_OVER','SESSION_LOCK_RACE'].includes(e.code))setStatus(e.message);return false}
 finally{liveSyncBusy=false;if(liveSyncPending)clearTimeout(syncTimer),syncTimer=setTimeout(()=>runLiveSync(false),900)}
}
async function runSync(verbose=true){if(!settings.sync||settings.sync.provider==='none')return;const log=verbose?$('#syncLog'):null;try{master=await syncMaster(master,settings.sync,m=>{if(log)log.textContent=m;syncUiState='syncing';updateSyncBadge()});dedupeMatchTypes();saveMaster(master);if(['nextcloud','webdav'].includes(settings.sync.provider)){archiveCurrentMatch();for(const snap of loadMatchArchive().filter(m=>m.matchId&&m.matchId!==state.matchId)){await syncStoredMatch({...snap,status:snap.status==='active'?'interrupted':snap.status},settings.sync,m=>{if(log)log.textContent=m})}}const liveOk=state.matchId&&['nextcloud','webdav'].includes(settings.sync.provider)?await runLiveSync(verbose):true;if(['nextcloud','webdav'].includes(settings.sync.provider))await refreshCloudLibrary(false);if(liveOk){syncUiState='synced';syncUiPending=0;updateSyncBadge();if(log)log.textContent='✓ Synchronisation abgeschlossen.';setStatus('Stammdaten, Spielbibliothek und Live-Session synchronisiert.')}render()}catch(e){syncUiState='error';syncUiLastError=e.message||String(e);updateSyncBadge();if(log)log.textContent='✕ '+e.message;setStatus('Synchronisation fehlgeschlagen: '+e.message)}}

function versionTuple(value){
 const s=String(value||'').replace(/^v/i,'');
 const m=s.match(/^(\d+)\.(\d+)\.(\d+)/);
 if(!m)return[0,0,0,0];
 const pm=s.match(/preview[\s._-]*(\d+)/i);
 // Stable release sorts after previews of the same base version.
 return[+m[1],+m[2],+m[3],pm?+pm[1]:9999]
}
function compareVersion(a,b){
 const A=versionTuple(a),B=versionTuple(b);
 for(let i=0;i<4;i++){if(A[i]!==B[i])return A[i]-B[i]}
 return 0
}
async function checkForUpdate({interactive=false}={}){
 if(!navigator.onLine){if(interactive)setStatus('Update-Prüfung benötigt eine Internetverbindung.');return null}
 try{
  const r=await fetch(`https://api.github.com/repos/${UPDATE_REPO}/releases?per_page=20`,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
  if(!r.ok)throw new Error(`GitHub ${r.status}`);
  const releases=(await r.json()).filter(x=>!x.draft&&x.tag_name);
  const includePrerelease=/preview/i.test(APP_VERSION);
  const candidate=releases.find(x=>includePrerelease||!x.prerelease);
  if(!candidate)return null;
  const latest=String(candidate.tag_name||'').replace(/^v/i,'');
  const update=compareVersion(latest,APP_VERSION)>0?{version:latest,tag:candidate.tag_name,name:candidate.name||candidate.tag_name,url:candidate.html_url||'',publishedAt:candidate.published_at||'',prerelease:!!candidate.prerelease}:null;
  settings.update={...(settings.update||{}),lastCheckedAt:new Date().toISOString(),available:update,ignoredVersion:settings.update?.ignoredVersion||''};
  saveSettings(settings);
  if(interactive)setStatus(update?`Neue stabile Version ${latest} verfügbar.`:'Keine neuere stabile GitHub-Version gefunden.');
  return update
 }catch(e){if(interactive)setStatus(`Update-Prüfung fehlgeschlagen: ${e.message}`);return null}
}
async function applyConfirmedUpdate(update){
 if(!update?.version)return;
 if(!confirm(`VolleyTakt Live ${update.version} installieren?\n\nLokale Stammdaten, Spiele, Spielbibliothek, Einstellungen und Videozuordnungen bleiben erhalten und werden bei Bedarf migriert.`))return;
 try{
  createUpdateBackup(`confirmed-update-${APP_VERSION_ID}-to-${update.version}`);
  localStorage.setItem('volleytakt-pending-update',JSON.stringify({from:APP_VERSION_ID,to:update.version,confirmedAt:new Date().toISOString()}));
  setStatus('Update bestätigt · sichere lokale Daten und aktualisiere App-Cache …');
  if('serviceWorker' in navigator){
    const reg=await navigator.serviceWorker.getRegistration();
    if(reg)await reg.update();
  }
  // Bestehenden Offline-Cache nicht vorab löschen. Erst ein erfolgreich
  // installierter neuer Service Worker ersetzt beim Aktivieren den alten Cache.
  setTimeout(()=>location.reload(),350);
 }catch(e){setStatus(`Update konnte nicht vorbereitet werden: ${e.message}`)}
}
function updateCardHtml(){
 const u=settings.update?.available;
 const migrated=migrationReport?.migrated?` · Daten ${migrationReport.from}→${migrationReport.to} migriert`:'';
 return `<div class="card update-card"><h3>App-Update</h3><p class="small">Installiert: <strong>${esc(APP_VERSION)}</strong>${migrated}</p><div class="toolbar"><button id="checkUpdateBtn">Nach Update suchen</button>${u?`<button id="applyUpdateBtn" class="primary">${esc(u.version)} aktualisieren</button>`:''}</div><p id="updateInfo" class="small">${u?`GitHub-Release ${esc(u.version)} ist verfügbar. Das bestätigte Update behält lokale Daten und migriert sie bei Bedarf.`:'Updates werden nur online gegen veröffentlichte GitHub-Releases geprüft. Offline bleibt die installierte Version vollständig nutzbar.'}</p></div>`
}
function wireUpdateCard(){
 const c=$('#checkUpdateBtn');if(c)c.onclick=async()=>{const u=await checkForUpdate({interactive:true});drawSettings()};
 const a=$('#applyUpdateBtn');if(a)a.onclick=()=>applyConfirmedUpdate(settings.update?.available)
}

function drawSettings(){const b=$('#drawerBody');b.innerHTML=`
<div class="card"><h3>Sprache <span class="preview-pill">${APP_VERSION}</span></h3><label>Anzeigesprache <select id="uiLanguage"><option value="de" ${settings.ui.language!=='en'?'selected':''}>Deutsch</option><option value="en" ${settings.ui.language==='en'?'selected':''}>English</option></select></label><p class="small">0.4.0 RC4-r2 verwendet das modulare Sprachsystem. Alle aktuellen Beschriftungen, Erklärungen, Hilfe-, Status- und Fehlermeldungen stehen in Deutsch und Englisch zur Verfügung.</p><div class="toolbar mt"><button id="saveLanguage">Sprache speichern</button></div></div>
<div class="card"><h3>Scouting</h3><div class="settings-scout-grid"><div class="settings-scout-options"><label><input id="setAutoRotate" type="checkbox" ${state.autoRotate?'checked':''}> Bei Side-out automatisch rotieren</label><label><input id="setPosOnly" type="checkbox" ${state.allowPositionOnly?'checked':''}> Scouting ohne zugeordnete Spielerin erlauben</label><label><input id="setOpp" type="checkbox" ${state.opponentCapture?'checked':''}> Gegner-Scouting aktivieren</label></div><label class="settings-player-sort"><span>Sortierung Spielerinnen</span><select id="playerSort"><option value="jersey" ${settings.ui.playerSort==='jersey'?'selected':''}>Trikotnummer</option><option value="abbreviation" ${settings.ui.playerSort==='abbreviation'?'selected':''}>Kürzel</option><option value="firstName" ${settings.ui.playerSort==='firstName'?'selected':''}>Vorname</option></select></label></div><p class="small">Diese persönliche Scout-Einstellung gilt für Spielerinnen-Auswahllisten wie Startaufstellung, Wechsel und Libero.</p><div class="toolbar mt"><button id="saveGeneral" class="primary">Speichern</button></div></div>
<div class="card settings-links"><h3>Bedienung & Hilfe</h3><button id="shortcutSettingsBtn">⌨️ Tastaturkürzel</button><button id="tourStartBtn">🧭 Einführung starten</button><button id="tourResetBtn">↺ „Nicht mehr zeigen“ zurücksetzen</button><button id="helpBtn">❓ Hilfe öffnen</button><p class="small">Die Einführung erklärt die wichtigsten Bedienelemente direkt in der Oberfläche. Die Hilfe enthält den vollständigen Ablauf und alle Einstellungen.</p></div>
<div class="card small"><strong>Plattformspezifisch:</strong> Video/mpv, Monitor- und Fensterverwaltung bleiben Desktop-Funktionen. DJI BLE, Landscape, PWA und OPFS bleiben Web-Funktionen.</div>
${updateCardHtml()}<div class="card about-card"><h3>About</h3><div class="about-version">VolleyTakt Live 0.4.0 RC4-r2</div><div class="about-meta"><div>Livescouting-WebApp / PWA · 0.4.0 RC4-r2</div><div>Lokale Datenspeicherung mit optionaler Cloud-Synchronisation</div></div><div class="about-license small"><strong>Lizenzen / verwendete Medien</strong><br>Technik-Piktogramme: eigene, für VolleyTakt erstellte PNG-Piktogramme als separate App-Dateien; unabhängig austauschbar.<br>Kameraadapter: DJI-Protokollimplementierung gegen die öffentliche DJI R SDK Referenz validiert; GoPro HERO über die offizielle Open-GoPro-BLE-API.</div></div>`;
$('#saveLanguage').onclick=()=>{settings.ui.language=$('#uiLanguage').value==='en'?'en':'de';saveSettings(settings);setLanguage(settings.ui.language);render();drawSettings();renderStartupCameraNotice();setStatus(settings.ui.language==='en'?'Display language saved.':'Anzeigesprache gespeichert.');};
$('#saveGeneral').onclick=()=>{state.autoRotate=$('#setAutoRotate').checked;state.allowPositionOnly=$('#setPosOnly').checked;state.opponentCapture=$('#setOpp').checked;if(!state.opponentCapture)state.activeTeamContext='own';settings.ui.playerSort=$('#playerSort')?.value||'jersey';saveSettings(settings);persist();render();setStatus('Einstellungen gespeichert.')};
wireUpdateCard();$('#shortcutSettingsBtn').onclick=drawShortcutSettings;$('#tourStartBtn').onclick=()=>{closeDrawer();startTour(true)};$('#tourResetBtn').onclick=()=>{settings.ui.tourDismissedVersion='';saveSettings(settings);setStatus('Einführungsstatus zurückgesetzt. Die Einführung wird beim nächsten Öffnen wieder angeboten.');};$('#helpBtn').onclick=drawHelp;
}

function configuredShortcutActionForKey(key){return shortcutActionForKey(settings.shortcuts||{},key)}
function drawShortcutSettings(){const b=$('#drawerBody');const rows=Object.entries(SHORTCUT_LABELS).map(([id,label])=>`<label class="shortcut-row"><span>${esc(label)}</span><input class="shortcut-input" data-shortcut="${id}" value="${esc(shortcutKeyLabel(settings.shortcuts[id]||''))}" readonly aria-label="Tastenkürzel für ${esc(label)}"></label>`).join('');b.innerHTML=`<div class="drawer-subhead"><button id="shortcutsBack">← Einstellungen</button><h3>Tastaturkürzel</h3></div><div class="card"><p class="small">Feld antippen und anschließend die gewünschte Taste drücken. Doppelte Belegungen werden nicht gespeichert.</p><div class="shortcut-list">${rows}</div><div id="shortcutError" class="form-error" hidden></div><div class="toolbar mt"><button id="saveShortcuts" class="primary">Kürzel speichern</button><button id="resetShortcuts">Auf Standard zurücksetzen</button></div></div>`;$('#shortcutsBack').onclick=drawSettings;$$('.shortcut-input').forEach(inp=>{inp.onkeydown=e=>{e.preventDefault();e.stopPropagation();if(['Tab','Shift','Control','Alt','Meta'].includes(e.key))return;const k=normalizeShortcutKey(e.key);inp.value=shortcutKeyLabel(k);inp.dataset.value=k;validateShortcutInputs()};inp.onclick=()=>inp.select?.()});$('#saveShortcuts').onclick=()=>{if(!validateShortcutInputs())return;const next={};$$('.shortcut-input').forEach(inp=>next[inp.dataset.shortcut]=inp.dataset.value||normalizeShortcutKey(inp.value));settings.shortcuts={...DEFAULT_SHORTCUTS,...next};saveSettings(settings);setStatus('Tastaturkürzel gespeichert.');drawShortcutSettings()};$('#resetShortcuts').onclick=()=>{settings.shortcuts={...DEFAULT_SHORTCUTS};saveSettings(settings);drawShortcutSettings();setStatus('Standard-Tastaturkürzel wiederhergestellt.')};}
function validateShortcutInputs(){const inputs=$$('.shortcut-input'),seen=new Map(),dups=[];for(const inp of inputs){const k=inp.dataset.value||normalizeShortcutKey(inp.value);inp.dataset.value=k;inp.classList.remove('invalid');if(!k)continue;if(seen.has(k)){dups.push([seen.get(k),inp,k])}else seen.set(k,inp)}for(const [a,b] of dups){a.classList.add('invalid');b.classList.add('invalid')}const box=$('#shortcutError');if(box){box.hidden=!dups.length;box.textContent=dups.length?`Doppelte Belegung: ${[...new Set(dups.map(x=>shortcutKeyLabel(x[2])))].join(', ')}`:''}return !dups.length}

function drawHelp(){const b=$('#drawerBody');const section=(id,title,html)=>`<section id="help-${id}" class="help-section"><h3>${title}</h3>${html}<a class="help-back" href="#help-toc">↑ Zum Inhaltsverzeichnis</a></section>`;b.innerHTML=`<div class="drawer-subhead"><button id="helpSettingsBack">← Einstellungen</button><h3>Hilfe</h3></div><article class="help-doc"><div id="help-toc" class="card help-toc"><h3>Inhaltsverzeichnis</h3><button id="helpTourStart" class="primary">Einführung starten</button><nav><a href="#help-prepare">1. Spiel vorbereiten</a><a href="#help-scout">2. Scouting durchführen</a><a href="#help-rally">3. Rally & Punkte</a><a href="#help-sets">4. Sätze</a><a href="#help-sub">5. Wechsel & Libero</a><a href="#help-quality">6. Bewertung</a><a href="#help-shortcuts">7. Tastaturkürzel</a><a href="#help-camera">8. Kamera</a><a href="#help-sync">9. Synchronisation</a><a href="#help-data">10. Datenverwaltung</a><a href="#help-analysis">11. Analyse</a><a href="#help-settings">12. Einstellungen</a><a href="#help-about">13. About & Lizenzen</a></nav></div>
${section('prepare','1. Spiel vorbereiten','<p>Lege Saison, eigenes Team, Gegner und Spiel-/Kaderart fest. Wähle den Spielkader. „Satz vorbereiten“ führt anschließend durch die erforderlichen Startaufstellungen und die Auswahl des Start-Liberos: immer unser Team und zusätzlich den Gegner, wenn Gegner-Scouting aktiviert ist. Bereits gespeicherte Werte werden beim erneuten Öffnen vorausgewählt; Abbrechen verändert nichts. Nach erfolgreicher Vorbereitung können die Aufstellungen über „Aufstellung … ändern“ korrigiert werden. Das Aufschlagrecht wird über die Schaltfläche oben rechts gesetzt.</p>')}
${section('scout','2. Scouting durchführen','<p><strong>Neue Eingabelogik: WER → WAS → WIE → WO → WOHIN.</strong> WER wird durch Antippen von P1–P6 gewählt. Die dort gemäß aktueller Rotation zugeordnete Spielerin und der Start-Timestamp werden sofort festgehalten. WAS ist die Technik/Aktion, WIE die Qualität und WO die tatsächliche Aktionszone.</p><p>Für Annahme, Zuspiel und Angriff stehen bei WO unabhängig vom Bewertungsprofil P1–P9 zur Verfügung; P7–P9 bleiben reine Dokumentationszonen. Für andere Aktionen richtet sich der WO-Umfang nach dem Scoutingprofil. In der detaillierten Bewertung werden beide Feldhälften am Netz ausgerichtet dargestellt. Über den kleinen Felddarstellungs-Schalter im Kopf des Spielfeldes kann die Ansicht jederzeit oben/unten gedreht werden; dabei ändert sich ausschließlich die Darstellung, niemals P1–P9, Rotation oder gespeicherte Scoutingdaten. In der Standardansicht liegt der Gegner oben spiegelbildlich P1/P6/P5 – P9/P8/P7 – P2/P3/P4 und Wir unten P4/P3/P2 – P7/P8/P9 – P5/P6/P1. P7–P9 dienen ausschließlich der Ortsdokumentation und können niemals WER sein. Sie werden erst nach einer WER-Auswahl als Ortszonen aktiv; optisch teilen sie die angrenzenden Grundpositionsflächen jeweils zur Hälfte.</p><p>Bis einschließlich WAS/WIE kann ein erneuter Touch auf P1–P6 die Spielerwahl korrigieren. Erst bei <strong>WO</strong> bedeuten die Feldzonen Aktionsort. Außenrahmen = WER, Innenrahmen = WO; bei gleicher Position entsteht ein Doppelrahmen.</p><p>WOHIN bezeichnet die Zielzone und wird als eigener fünfter Workflow-Schritt angezeigt. In der detaillierten Bewertung erscheint dafür das gegenüberliegende Feld. Für Angriff und Aufschlag wird dadurch die Ballrichtung als Zielzone gespeichert. Beim Zuspiel werden zusätzlich FIVB-Tempo 0–3, Passweite/-richtung und die Ziel-/Angriffszone erfasst. Bei Zuspiel und Angriff kann WOHIN sowohl im eigenen als auch im gegnerischen Feld liegen, etwa für eine Finte bzw. einen direkt zum Gegner gespielten zweiten Ball.</p><p>Beim eigenen Aufschlag werden P1 als WER und Aufschlag als WAS automatisch vorausgewählt; beide Angaben können weiterhin korrigiert werden. Die abschließenden Bewertungen = (Fehler) und # (Ass) beenden den Aufschlag sofort ohne verpflichtendes WO. In der detaillierten Erfassung kann die Aufschlagtechnik als optionale Zusatzinformation dokumentiert werden (Jump Float, Jump Topspin, Float, Standaufschlag oben, Topspin/Drive, von unten, Sonstige). Ohne Auswahl wird der Aufschlag vollständig gescoutet; das Feld <code>serve_technique</code> bleibt leer und ist später entsprechend analysierbar. Bei der automatischen Vorauswahl startet der Aktions-Timestamp erst mit dem ersten manuellen Scouting-Touch, damit nicht bereits das Ende der vorherigen Rally als Startzeit verwendet wird.</p><p>Beim Abschluss der Aktion wird ein zweiter Timestamp gespeichert. Damit stehen für Videoanalyse Start- und Endmarker getrennt zur Verfügung.</p><p>Das Notizfeld ergänzt freie Hinweise. Das Live-Protokoll zeigt die jüngsten Ereignisse und bleibt Grundlage für Undo und Wiederaufnahme.</p><p><strong>Smartphone quer:</strong> Bei Touch-Geräten mit geringer nutzbarer Viewport-Höhe schaltet VolleyTakt automatisch in einen Smartphone-Landscape-Modus. Scouting und Spielfeld erhalten Vorrang; das Live-Protokoll wird über „Protokoll“ als überlagernde Ansicht geöffnet. Die aktuelle Eingabestufe wird hervorgehoben, bereits erledigte Bereiche werden nach WO kompakter. Die Entscheidung basiert auf CSS-Viewport, Querformat und Touch-Eingabe – nicht auf Android oder iOS.</p>')}
${section('rally','3. Rally & Punkte','<p>Eine Rally ist ein Container für beliebig viele Einzelaktionen. Normalerweise schließen „+ Punkt Wir“ oder „+ Punkt Gegner“ die Rally ab. Zusätzlich greift die DataVolley-nahe Automatik: <strong>=</strong> beendet die Rally als Fehler zugunsten der Gegenseite; <strong>#</strong> beendet sie bei Aufschlag, Angriff und Block als direkter Erfolg. Bei Annahme, Abwehr und Zuspiel ist # dagegen eine perfekte Aktion ohne automatisches Rallyende.</p><p>Rallyphase, Spieleridentität, Rotationsposition und tatsächliche Aktionszone sind getrennte Informationen. K1/K2/K3 ist Analysekontext und keine angenommene Grundformation. VolleyTakt positioniert Spielerinnen während einer Rally nicht automatisch um. Bei beobachteten weiteren Wechseln zwischen den Teams können Transitionen fortlaufend unterschieden werden.</p><p>Beispiel: P4 → Angriff → + → P3 bedeutet: Die beim WER-Schritt auf P4 stehende Spielerin hat aus P3 positiv angegriffen. P3 identifiziert niemals nachträglich eine andere Spielerin.</p>')}
${section('sets','4. Sätze','<p>Im regulären Spiel werden drei Gewinnsätze gespielt (maximal fünf Sätze): Satz 1–4 bis 25, ein notwendiger fünfter Satz bis 15, jeweils mit zwei Punkten Vorsprung. Alternativ kann für Turniere, Vorbereitung und Freundschaftsspiele eine feste Anzahl von 1–5 Sätzen gewählt werden. Dabei werden alle festgelegten Sätze gespielt; für den letzten Satz ist 25 oder 15 als Ziel wählbar.</p><p>Bei Satzende stoppt die Livezeit automatisch. Nach Erreichen der regulären drei Gewinnsätze bzw. der festen Satzanzahl ist das Scouting beendet. Die Startaufstellung wird für jeden Satz neu erfasst.</p>')}
${section('sub','5. Wechsel & Libero','<p>Für einen normalen Wechsel: Position wählen, dann Wechsel bzw. W. Die Liste zeigt aktuell verfügbare Spielerinnen; Liberos stehen getrennt. Bereits gebildete Wechselpaare werden satzbezogen berücksichtigt, ein Rückwechsel erfolgt nur gegen die zugehörige eingewechselte Spielerin.</p><p>Für einen Libero-Austausch: Hinterfeldposition I, VI oder V wählen, dann Libero bzw. L. Der aktive Libero wird mit seiner player_id auf dem Feld geführt, sodass alle Aktionen korrekt ihm zugeordnet werden.</p>')}
${section('quality','6. Bewertung','<p><strong>Einheitliches Bewertungssystem:</strong> VolleyTakt verwendet in allen Geräteansichten, im Protokoll und in der Analyse dieselben Symbole und Farben. Die frühere Stufe <code>++</code> entfällt vollständig; vorhandene Alt-Daten werden beim Update als <code>#</code> übernommen.</p><p><strong>Normal:</strong> = / - / 0 / + / #. <strong>Detailliert / DataVolley-orientiert:</strong> verwendet =, -, !, /, + und #. Wichtig: ! und / besitzen keine universelle Rangfolge; ihre Bedeutung ist technikspezifisch. Deshalb ordnet VolleyTakt die Buttons und die Legende passend zur gewählten Technik und zeigt ausdrücklich „Bedeutung für …“ an. Die Farben unterstützen die schnelle Erfassung, ersetzen aber nicht die technikspezifische Bedeutung.</p><div class="help-quality-table"><table class="data-table compact"><thead><tr><th>Technik</th><th>=</th><th>-</th><th>!</th><th>/</th><th>+</th><th>#</th></tr></thead><tbody><tr><td>Aufschlag</td><td>Fehler</td><td>Gegner frei</td><td>kein 1. Tempo</td><td>kein Angriff</td><td>eingeschränkter Angriff</td><td>Ass</td></tr><tr><td>Annahme</td><td>Fehler</td><td>stark eingeschränkt</td><td>kein 1. Tempo</td><td>kein Angriff</td><td>Angriff möglich</td><td>perfekt</td></tr><tr><td>Angriff</td><td>Fehler</td><td>leicht abwehrbar</td><td>Block + Wiederangriff</td><td>geblockt</td><td>guter Angriff</td><td>Punkt</td></tr><tr><td>Block</td><td>Fehler/Punkt Gegner</td><td>schwach</td><td>Gegner spielt weiter</td><td>Übergriff / Blockfehler</td><td>Blockberührung</td><td>Punkt</td></tr><tr><td>Abwehr</td><td>Fehler</td><td>kein Aufbau</td><td>kein 1. Tempo</td><td>direkt zurück</td><td>gut</td><td>perfekt</td></tr><tr><td>Zuspiel</td><td>Fehler</td><td>nur hoher Pass</td><td>kein 1. Tempo</td><td>schlecht</td><td>gut</td><td>perfekt</td></tr></tbody></table></div><p class="small">Beim Block können Bewertungsbezeichnungen je nach verwendeter Scoutingkonvention abweichen. VolleyTakt zeigt deshalb die konkrete Bedeutung direkt bei der ausgewählten Technik.</p><p><code>=</code> beendet die Rally als Fehler zugunsten der Gegenseite. <code>#</code> beendet sie bei Aufschlag, Angriff und Block als direkten Erfolg. Bei Annahme, Abwehr und Zuspiel ist <code>#</code> eine perfekte Aktion ohne automatisches Rallyende.</p>')}
${section('shortcuts','7. Tastaturkürzel','<p>Unter Einstellungen → Tastaturkürzel siehst du die vollständige aktive Belegung. Jede Taste kann angepasst werden. Doppelte Belegungen werden erkannt und verhindert. „Auf Standard zurücksetzen“ stellt die mitgelieferte Grundbelegung wieder her.</p>')}
${section('camera','8. Kamera','<p>VolleyTakt verwendet modulare Bluetooth-Kameraadapter. In der Auswahl werden bewusst nur die Familien <strong>DJI Osmo Action</strong> und <strong>GoPro HERO</strong> angezeigt. Welche konkreten Modelle unterstützt werden, hängt vom verwendeten Bluetooth-Protokoll ab.</p><p><strong>DJI R-SDK/BLE:</strong> unterstützt werden <strong>Osmo Action 4</strong>, <strong>Osmo Action 5 Pro</strong>, <strong>Osmo Action 6</strong> und <strong>Osmo 360</strong>. <strong>Action 2</strong> und <strong>Osmo Action 3</strong> werden vom hier verwendeten R-SDK-Adapter nicht unterstützt.</p><p><strong>GoPro / Open GoPro BLE:</strong> für die HERO-Reihe unterstützt die API <strong>HERO9 Black</strong>, <strong>HERO10 Black</strong>, <strong>HERO11 Black</strong>, <strong>HERO11 Black Mini</strong>, <strong>HERO12 Black</strong> und <strong>HERO13 Black</strong>. Die Open-GoPro-API führt zusätzlich weitere kompatible Kameras wie LIT HERO, MAX 2 sowie MISSION 1 / MISSION 1 Pro; VolleyTakt zeigt diese derzeit nicht als eigene Kamerafamilien an.</p><p><strong>Bedienung:</strong> Kamera einschalten, gegebenenfalls Pairing-Modus aktivieren und anschließend „Kamera verbinden“ wählen. Nach Aufnahme-Stopp bleibt die Bluetooth-Verbindung bestehen. Erst „Trennen“ oder ein nicht wiederherstellbarer Verbindungsverlust beendet die Kopplung. Akku und Status werden laufend übernommen; die sichtbare Akkuanzeige wird ungefähr alle 10–15 Sekunden aktualisiert.</p><p><strong>Verbindungsqualität:</strong> Die Anzeige „Stabil / Schwach / Instabil“ wird aus Statusalter, Fehlern und Wiederverbindungen abgeleitet. Web Bluetooth stellt browserübergreifend keine verlässliche RSSI-Signalstärke bereit.</p><p><strong>Bluetooth-Diagnose:</strong> Sie wird im normalen Betrieb nicht angezeigt. Erst wenn ein Verbindungsversuch fehlschlägt, zeigt VolleyTakt Details zu Web Bluetooth, GATT, Dienst/Characteristics, Notifications, Protokoll-Handschlag und letztem Fehler.</p><p>Die lokale Zeit bleibt immer als Fallback verfügbar. Ein Kamera-Zeitanker wird erst nach bestätigtem Aufnahmestart gesetzt.</p>')}
${section('sync','9. Synchronisation','<p>Lokale Speicherung hat immer Vorrang. Bei Online-Verbindung werden Stammdaten und laufende Sessiondaten nahezu live synchronisiert. Offline wird ohne Unterbrechung lokal weitergescoutet und später nachsynchronisiert. Eine aktive Live-Session besitzt nur einen Schreib-Client; Lease/Heartbeat und ETag-Schutz reduzieren konkurrierende Schreibzugriffe.</p><p>Cloudanbieter sind Nextcloud, WebDAV, Google Drive sowie vorbereitete Adapter für iCloud, OneDrive, Dropbox und Box. Die Eingabefelder hängen vom gewählten Anbieter ab.</p>')}
${section('data','10. Datenverwaltung','<p>Spielerinnen werden über eine stabile player_id identifiziert. Beim WER-Schritt wird P1–P6 unmittelbar auf diese player_id aufgelöst und zugleich der Start-Timestamp eingefroren. Beim Abschluss werden zusätzlich End-Timestamp, Rotationsposition bei WER und action_zone bei WO gespeichert. In der detaillierten Bewertung stehen für WO P1–P9 zur Verfügung; P7–P9 sind reine Dokumentationszonen. Name, Kürzel und Trikotnummer bleiben Anzeige-/Snapshotdaten.</p><p>Zielzonen bleiben separat von WO: WO beschreibt den Ort der Ballaktion, ZIEL die Ballrichtung bzw. beim Zuspiel die vorgesehene Ziel-/Angriffszone. Dadurch können spätere Analysen Annahme, Zuspielort, Zuspielziel, Angreifer und Angriffsziel miteinander verknüpfen.</p>')}
${section('analysis','11. Analyse','<p>Unter Analyse kannst du Zeitraum, Saison, Team, Gegner, Spielart, Spielerin, Technik, Rotation und Satz filtern. Preview 2 ergänzt Spiel-/Satzübersicht, Rotations-Dashboard, K1/Sideout mit First-Ball-Sideout, K2/Breakpoint, Aufschlag-, Annahme- und Zuspielanalyse, Angriff Quelle→Ziel, Kontextketten Annahme→Zuspiel→Angriff sowie Gegner-Tendenzen. Die Ansichten nutzen dasselbe Datenmodell; bei einfacher Erfassung bleiben Detaildimensionen leer und werden nur dort ausgewertet, wo Daten vorhanden sind. Der Vergleichsmodus stellt Zeitraum A und B gegenüber.</p>')}
${section('settings','12. Einstellungen','<p>Hier stellst du unter anderem automatische Side-out-Rotation, Gegner-Scouting und Scouting ohne zugeordnete Spielerin ein. Die Sortierung von Spielerinnen-Auswahllisten kann persönlich nach Trikotnummer, Kürzel oder Vorname eingestellt werden. Zusätzlich findest du Tastaturkürzel, die Einführung, den Reset für „Nicht mehr zeigen“ und diese Hilfe.</p>')}
${section('about','13. About & Lizenzen','<p>About zeigt Version und verwendete Medien/Lizenzen. Das Volleyball-Piktogramm stammt von Blue-Hat-Graphics via Pixabay. Der DJI-Kameraadapter verwendet das öffentliche DJI-R-SDK/BLE-Protokoll; der GoPro-Adapter nutzt die offizielle Open-GoPro-BLE-API.</p>')}
</article>`;$('#helpSettingsBack').onclick=drawSettings;$('#helpTourStart').onclick=()=>{closeDrawer();startTour(true)};}

let tourRepositionHandler=null;
function maybeStartTour(){if(settings.ui?.tourDismissedVersion===TOUR_VERSION)return;startTour(false)}
function clearTourHighlight(){$$('.tour-highlight').forEach(x=>x.classList.remove('tour-highlight'));const spot=$('#tourSpotlight');if(spot){spot.hidden=true;spot.removeAttribute('style')}}
function placeTourCard(target){
  const card=$('.tour-card'),spot=$('#tourSpotlight');if(!card)return;
  const vw=Math.max(document.documentElement.clientWidth||0,window.innerWidth||0),vh=Math.max(document.documentElement.clientHeight||0,window.innerHeight||0);
  const margin=Math.max(10,Math.min(20,Math.round(Math.min(vw,vh)*.018))),gap=Math.max(10,Math.min(18,Math.round(Math.min(vw,vh)*.016)));
  card.style.left='';card.style.right='';card.style.top='';card.style.bottom='';
  const maxW=Math.max(250,Math.min(460,vw-margin*2));card.style.width=`min(${maxW}px, calc(100vw - ${margin*2}px))`;
  card.style.maxHeight=`calc(100dvh - ${margin*2}px)`;
  const cr=card.getBoundingClientRect();
  if(!target||!target.isConnected){card.style.left=`${Math.max(margin,(vw-cr.width)/2)}px`;card.style.top=`${Math.max(margin,(vh-cr.height)/2)}px`;if(spot)spot.hidden=true;return}
  const r=target.getBoundingClientRect();
  if(spot){const pad=6;spot.hidden=false;spot.style.left=`${Math.max(4,r.left-pad)}px`;spot.style.top=`${Math.max(4,r.top-pad)}px`;spot.style.width=`${Math.max(8,Math.min(vw-8,r.width+pad*2))}px`;spot.style.height=`${Math.max(8,Math.min(vh-8,r.height+pad*2))}px`}
  const candidates=[
    {x:r.right+gap,y:r.top+(r.height-cr.height)/2,space:vw-r.right},
    {x:r.left-cr.width-gap,y:r.top+(r.height-cr.height)/2,space:r.left},
    {x:r.left+(r.width-cr.width)/2,y:r.bottom+gap,space:vh-r.bottom},
    {x:r.left+(r.width-cr.width)/2,y:r.top-cr.height-gap,space:r.top}
  ];
  let chosen=candidates.find((c,idx)=>idx<2?c.space>=cr.width+gap:c.space>=cr.height+gap)||candidates.sort((a,b)=>b.space-a.space)[0];
  let x=Math.min(Math.max(margin,chosen.x),Math.max(margin,vw-cr.width-margin));
  let y=Math.min(Math.max(margin,chosen.y),Math.max(margin,vh-cr.height-margin));
  card.style.left=`${Math.round(x)}px`;card.style.top=`${Math.round(y)}px`;
}
function startTour(manual=false){
  const overlay=$('#tourOverlay');if(!overlay)return;let i=0;overlay.hidden=false;overlay.dataset.manual=manual?'1':'0';
  const show=()=>{clearTourHighlight();const step=TOUR_STEPS[i],target=$(step.sel);if(target){target.classList.add('tour-highlight');target.scrollIntoView?.({block:'nearest',inline:'nearest',behavior:'instant'})}$('#tourStep').textContent=`${i+1} / ${TOUR_STEPS.length}`;$('#tourTitle').textContent=step.title;$('#tourText').textContent=step.text;$('#tourPrev').disabled=i===0;$('#tourNext').textContent=i===TOUR_STEPS.length-1?'Fertig':'Weiter';requestAnimationFrame(()=>requestAnimationFrame(()=>placeTourCard(target)))};
  $('#tourPrev').onclick=()=>{if(i>0){i--;show()}};$('#tourNext').onclick=()=>{if(i<TOUR_STEPS.length-1){i++;show()}else stopTour(false)};$('#tourClose').onclick=()=>stopTour(false);$('#tourDontShow').onclick=()=>{settings.ui.tourDismissedVersion=TOUR_VERSION;saveSettings(settings);stopTour(true)};
  if(tourRepositionHandler)window.removeEventListener('resize',tourRepositionHandler);tourRepositionHandler=()=>{const step=TOUR_STEPS[i];placeTourCard($(step.sel))};window.addEventListener('resize',tourRepositionHandler,{passive:true});window.addEventListener('orientationchange',tourRepositionHandler,{passive:true});show()
}
function stopTour(dismissed=false){clearTourHighlight();const o=$('#tourOverlay');if(o)o.hidden=true;if(tourRepositionHandler){window.removeEventListener('resize',tourRepositionHandler);window.removeEventListener('orientationchange',tourRepositionHandler);tourRepositionHandler=null}if(dismissed)setStatus('Einführung wird für diese Tour-Version nicht mehr automatisch angezeigt.')}


function setActiveTeamContext(side){
 side=side==='opponent'?'opponent':'own';
 if(side==='opponent'&&!matchConfigured()){state.activeTeamContext='own';render();setStatus('Bitte zuerst das Spiel einrichten.');return}
 if(side==='opponent'&&!state.opponentCapture){
  side='own';setStatus('Gegner-Scouting ist in den Einstellungen deaktiviert.')
 }
 state.activeTeamContext=side;
 state.selectedPos=0;state.selectedOppPos=0;state.pendingSide=null;state.pendingAction=null;state.pendingQuality=null;state.inputStep='WER';state.selectedPlayerId='';state.selectedPlayerPos=0;state.actionZone=0;state.targetZone=0;state.targetSide='';state.actionStartedSeconds=null;state.actionStartedAt='';state.setTempo='';state.setDistance='';state.serveTechnique='';state.autoServePreset=false;
 if(side==='own'&&state.servingSide==='us')prepareOwnServePreset();persist();render();
 const ri=rotationIndexForSide(side);
 setStatus(`${side==='opponent'?'Gegner':'Eigenes Team'} aktiv · ${ROT[ri]||'R1'} · ${qualityProfileForSide(side)==='datavolley_6'?'detailliert':'kompakt'}.`)
}

function applyViewportLayout(){
 const vv=window.visualViewport;
 const w=Math.max(320,Math.round(vv?.width||window.innerWidth||document.documentElement.clientWidth||1280));
 const h=Math.max(240,Math.round(vv?.height||window.innerHeight||document.documentElement.clientHeight||720));
 // Rev. 13h: one shared UI density derived from the *usable window*, not the device.
 // Height deliberately has equal priority because Landscape/Split-Screen usually fails vertically first.
 const widthScale=Math.min(1,Math.max(.58,w/1600));
 const heightScale=Math.min(1,Math.max(.58,h/900));
 const uiScale=Math.min(widthScale,heightScale);
 const root=document.documentElement;
 root.style.setProperty('--vsw-vw',`${w}px`);
 root.style.setProperty('--vsw-vh',`${h}px`);
 root.style.setProperty('--vsw-scale',uiScale.toFixed(3));
 root.style.setProperty('--vsw-hscale',uiScale.toFixed(3));
 root.style.setProperty('--vsw-ui-scale',uiScale.toFixed(3));
 root.classList.toggle('viewport-compact',w<1120 || uiScale<.78);
 root.classList.toggle('viewport-low',h<760 || uiScale<.82);
 root.classList.toggle('viewport-browser-low',h<840 || uiScale<.88);
 root.dataset.viewport=`${w}x${h}`;
 root.dataset.uiScale=uiScale.toFixed(3);
}
function wireViewportLayout(){
 let raf=0;const update=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(applyViewportLayout)};
 applyViewportLayout();
 window.addEventListener('resize',update,{passive:true});
 window.addEventListener('orientationchange',update,{passive:true});
 window.visualViewport?.addEventListener('resize',update,{passive:true});
 window.visualViewport?.addEventListener('scroll',update,{passive:true});
}

function wire(){
 $('#startAppBtn').onclick=start;$('#menuBtn').onclick=()=>openDrawer('match');$('#matchSetupBtn').onclick=()=>openDrawer('match');$$('#drawerNav button[data-view]').forEach(b=>b.onclick=()=>openDrawer(b.dataset.view));$('#drawerClose').onclick=closeDrawer;$('#drawerBackdrop').onclick=e=>{if(e.target===$('#drawerBackdrop'))closeDrawer()};$('#dialogCancel').onclick=closeModal;$('#dialogBackdrop').onclick=e=>{if(e.target===$('#dialogBackdrop'))closeModal()};$('#modalForm').onsubmit=e=>{e.preventDefault();try{const f=new FormData(e.currentTarget);modalSubmit?.(f);closeModal(false);render()}catch(err){setStatus(err.message);alert(err.message)}};
 $('#phoneProtocolBtn').onclick=()=>document.body.classList.add('phone-protocol-open');$('#phoneProtocolClose').onclick=()=>document.body.classList.remove('phone-protocol-open');
 $('#mainRecordStart').onclick=startRecording;$('#mainRecordStop').onclick=stopRecording;$('#serveStateBtn').onclick=cycleServing;$('#clockStartBtn').onclick=toggleLocalClock;$('#rotateBtn').onclick=()=>rotate(1,true);$('#rotateBackBtn').onclick=()=>rotate(-1,true);$('#sideoutBtn').onclick=sideout;$('#substituteBtn').onclick=()=>beginPlayerChange('substitution');$('#liberoBtn').onclick=()=>beginPlayerChange('libero');$('#undoBtn').onclick=undo;$('#redoBtn').onclick=redo;$('#clearSelectionBtn').onclick=()=>{playerChangeMode=null;clearPending()};$$('[data-score]').forEach(b=>b.onclick=()=>award(b.dataset.score==='us'?'us':'them','',false));
 $('#correctScoreBtn').onclick=()=>modal('Spiel korrigieren',`<label>Satz <input name="set" type="number" min="1" max="5" value="${state.setNo}"></label><label>Punkte Wir <input name="us" type="number" min="0" value="${state.scoreUs}"></label><label>Punkte Gegner <input name="them" type="number" min="0" value="${state.scoreThem}"></label><label>Sätze Wir <input name="setsUs" type="number" min="0" max="5" value="${state.setWinsUs}"></label><label>Sätze Gegner <input name="setsThem" type="number" min="0" max="5" value="${state.setWinsThem}"></label><label>Grund <input name="reason"></label>`,async fd=>{const old=`${state.scoreUs}:${state.scoreThem}`;state.setNo=Math.min(5,Math.max(1,+fd.get('set')||1));state.scoreUs=Math.max(0,+fd.get('us')||0);state.scoreThem=Math.max(0,+fd.get('them')||0);state.setWinsUs=Math.min(5,Math.max(0,+fd.get('setsUs')||0));state.setWinsThem=Math.min(5,Math.max(0,+fd.get('setsThem')||0));state.matchComplete=state.matchMode==='fixed'?state.setNo>configuredSetLimit()||state.setWinsUs+state.setWinsThem>=configuredSetLimit():state.setWinsUs>=3||state.setWinsThem>=3;if(state.matchComplete)await stopLiveTimeAtBoundary();await appendEvent('','','Spielstandskorrektur',`${old}->${state.scoreUs}:${state.scoreThem}`,fd.get('reason').trim(),{event_type:'score_correction',set_wins_us:String(state.setWinsUs),set_wins_them:String(state.setWinsThem)});render()});
 $('#opponentToggle').onchange=()=>setActiveTeamContext($('#opponentToggle').checked?'opponent':'own');
 $('#fieldOrientationBtn').onclick=()=>{
  if(state.pendingSide){setStatus('Felddarstellung kann nach Abschluss der aktuellen Aktion geändert werden.');return}
  state.fieldOrientation=highlightedFieldIsTop()?'activeBottom':'activeTop';persist();render();setStatus(t(highlightedFieldIsTop()?'court.orientation.top':'court.orientation.bottom'))
 };
 $('#quickScoutToggle').onchange=async()=>{
  const toggle=$('#quickScoutToggle');
  if(toggle.checked){
   const started=await startQuickScout({draft:true});
   if(!started)toggle.checked=!!state.quickScout;
   return;
  }
  if(!state.quickScout)return;
  if(events.length){toggle.checked=true;setStatus('Spontanes Scouting enthält bereits Einträge und kann hier nicht deaktiviert werden. Für ein reguläres Spiel „Spiel einrichten“ verwenden.');return}
  const keepOrientation=state.fieldOrientation||'activeBottom';
  state={...defaultState,fieldOrientation:keepOrientation};events=[];await csv.write(events);saveState(state);render();setStatus('Spontanes Scouting beendet · reguläres Spiel kann eingerichtet werden.');
 };
 $('#detailedQualityToggle').onchange=()=>{
  if(state.pendingSide&&!state.autoServePreset){$('#detailedQualityToggle').checked=detailedCapture(state.pendingSide);setStatus('Scouting-Modus kann nach Abschluss der aktuellen Aktion geändert werden.');return}
  const side=state.activeTeamContext==='opponent'?'opponent':'own';
  const profile=$('#detailedQualityToggle').checked?'datavolley_6':'basic_5';
  if(side==='opponent')state.opponentQualityProfile=profile;else state.ownQualityProfile=profile;
  if(state.autoServePreset&&state.pendingSide===side)state.captureQualityProfile=profile;
  state.pendingQuality=null;state.serveTechnique='';state.setTempo='';state.setDistance='';
  persist();render();
  setStatus(`${side==='opponent'?'Gegner':'Eigenes Team'}: ${profile==='datavolley_6'?'detailliertes Scouting · P1–P9 · DataVolley-orientierte Bewertung':'normales Scouting · P1–P6 · kompakte Bewertung'}.`)
 };
 for(const a of ACTIONS){const b=document.createElement('button');b.className='technique-button';b.innerHTML=`<span class="technique-icon"><img src="${ACTION_ICON_FILES[a]}?v=${TECHNIQUE_ICON_REV}" alt="" aria-hidden="true"></span><span class="technique-label">${esc(a)}</span>`;b.dataset.action=a;b.setAttribute('aria-label',a);b.onclick=()=>chooseAction(a);$('#actionButtons').appendChild(b)}renderQualityButtons()
 $('#csvImport').onchange=async e=>{const f=e.target.files[0];if(!f)return;events=migrateEventPlayerIds(parseCsv(await f.text()).map(r=>({...r,id:newId('evt'),createdAt:now()})));migrateRallyMetadata(events);inferImportedQualityProfiles(events);reconstruct(events);await csv.write(events);render();setStatus(`${events.length} CSV-Einträge geladen; Spielzustand rekonstruiert.`);e.target.value=''};
 $('#jsonImport').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const v=JSON.parse(await f.text());if(!v.master)throw new Error('Keine VolleyTakt-Stammdaten.');master={...master,...v.master};dedupeMatchTypes();saveMaster(master);render();setStatus('Stammdaten importiert.')}catch(err){alert(err.message)}e.target.value=''};
 document.addEventListener('keydown',e=>{
  const typing=/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName||'');
  if(typing)return;
  const shortcutAction=configuredShortcutActionForKey(e.key);
  const routed=commandForShortcutAction(shortcutAction);
  if(routed?.command===COMMANDS.CANCEL){e.preventDefault();playerChangeMode=null;if(!$('#dialogBackdrop').hidden)closeModal();else if(!$('#drawerBackdrop').hidden)closeDrawer();else if(!$('#tourOverlay').hidden)stopTour(false);else clearPending();return}
  if(!$('#dialogBackdrop').hidden||!$('#drawerBackdrop').hidden||!$('#tourOverlay').hidden||!routed)return;
  e.preventDefault();
  if(routed.command===COMMANDS.SELECT_POSITION){selectPosition(activeSide(),routed.position);return}
  if(routed.command===COMMANDS.SELECT_ACTION){chooseAction(routed.action);return}
  if(routed.command===COMMANDS.SELECT_QUALITY){const allowed=QUALITY_PROFILES[qualityProfileForSide(currentCaptureSide())]||[];if(allowed.includes(routed.quality))chooseQuality(routed.quality);else setStatus(`Bewertung ${routed.quality} ist im aktuellen Profil nicht verfügbar.`);return}
  if(routed.command===COMMANDS.AWARD_POINT_US){award('us',`Tastenkürzel ${settings.shortcuts[shortcutAction]}`,false);return}
  if(routed.command===COMMANDS.AWARD_POINT_THEM){award('them',`Tastenkürzel ${settings.shortcuts[shortcutAction]}`,false);return}
  if(routed.command===COMMANDS.SUBSTITUTION){beginPlayerChange('substitution');return}
  if(routed.command===COMMANDS.LIBERO){beginPlayerChange('libero');return}
  if(routed.command===COMMANDS.ROTATE){rotate(routed.direction||1,true);return}
  if(routed.command===COMMANDS.UNDO){undo();return}
 });setInterval(()=>{const sec=currentSeconds();$('#liveClock').textContent=fmt(sec);$('#clockMode').textContent=camera?.protocolConnected?(state.cameraRecording?`${cameraShortName()} REC`:`${cameraShortName()} bereit`):state.localClockRunning?'lokal':sec>0?'lokal pausiert':'lokal bereit';if($('#cameraTime'))$('#cameraTime').textContent=fmt(sec);if($('#mainCameraTime'))$('#mainCameraTime').textContent=fmt(sec);updateCameraUi(false)},500);
 setInterval(()=>{if(settings.sync?.autoChange&&state.matchId&&navigator.onLine)runLiveSync(false)},10000);window.addEventListener('online',()=>runSync(false));if(settings.sync?.autoStart&&navigator.onLine)setTimeout(()=>runSync(false),1200);
 document.addEventListener('pointerdown',e=>{edgeSwipeRouter.pointerDown(e)});document.addEventListener('pointerup',e=>{if(edgeSwipeRouter.pointerUp(e))openDrawer('match')});
 if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js?v=0.4.0-rc4-r2',{updateViaCache:'none'}).catch(()=>{});if(navigator.onLine)setTimeout(()=>checkForUpdate({interactive:false}),1800);
}
try{wireViewportLayout();wire();renderStartupCameraNotice();const resumed=restoreSessionAfterReload();render();if(resumed)setStatus(`Session wiederaufgenommen · Sätze ${state.setWinsUs}:${state.setWinsThem} · ${state.scoreUs}:${state.scoreThem} · ${ROT[rotationIndexForSide(activeSide())]||'R1'}.`);window.__VSW_APP_READY__=true;window.dispatchEvent(new CustomEvent('vsw-app-ready'));}catch(err){console.error('VolleyTaktLive Initialisierung fehlgeschlagen',err);window.__VSW_APP_ERROR__=String(err?.stack||err?.message||err);window.dispatchEvent(new CustomEvent('vsw-app-error',{detail:window.__VSW_APP_ERROR__}));}
