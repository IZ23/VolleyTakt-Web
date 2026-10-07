import {CsvStore,loadMaster,saveMaster,loadState,saveState,loadEvents,saveEvents,loadSettings,saveSettings,loadMatchArchive,saveMatchArchive,upsertMatchArchive,getMatchSnapshot,removeMatchArchive,newId,touched,active,orderedMatchTypes,parseCsv,downloadJson,runDataMigrations,createUpdateBackup,CURRENT_DATA_SCHEMA,listMigrationBackups,downloadLatestMigrationBackup} from './storage.js';
import {createProvider,syncMaster,syncLiveSession,syncStoredMatch,syncAnalysisResults,fetchCloudMatchLibrary,fetchCloudMatch,removeCloudMatchFromLibrary,normalizeServerUrl} from './sync.js';
import {initI18n,setLanguage,tr,t} from './i18n.js';
import {helpContent} from './locales/help-content.js';
import {createDefaultState,normalizeLoadedState,cleanStateForSnapshot} from './app/state.js';
import {findPlayer,findTeam,findSeason,findMatchType,matchTypeKey as selectorMatchTypeKey} from './app/selectors.js';
import {createPersistenceController} from './app/persistence.js';
import {COMMANDS} from './app/commands.js';
import {normalizeShortcutKey,shortcutKeyLabel,shortcutActionForKey,commandForShortcutAction,createEdgeSwipeRouter} from './app/input-routing.js';
import {createScoutingController,SERVE_TECHNIQUES,SET_TEMPOS,SET_DISTANCES} from './scouting/scouting.js';
import {createRallyController,automaticPointFor} from './scouting/rally.js';
import {buildScoutingEvent,buildPlayerActionExtra} from './scouting/events.js';
import {scorePointTransition,pointAwardAllowed,winningSideForTarget,setWinTransition} from './scouting/scoring.js';
import {rotationTransition,setLineupTransition,nextSetTransition,matchFinishedTransition,beginSetSetupTransition} from './scouting/match-flow.js';
import {reconstructMatchState,undoEventBatch,restoreEventBatch} from './scouting/history.js';
import {filterMatches as filterAnalysisMatches,filterEvents as filterAnalysisEvents} from './analysis/filters.js';
import {stats as analysisStats} from './analysis/rallies.js';
import {analyzeView as analyzeAnalysisView} from './analysis/basic.js';
import {createAnalysisController,renderView as renderAnalysisView} from './analysis/ui.js';
import {loadAnalysisResults} from './analysis/cache.js';
import {CameraService,adapterMeta as cameraAdapterMeta,connectionQuality as cameraConnectionQualityFor} from './camera/service.js';
import {wireDeviceLayout} from './ui/layout/device-layout.js';
import {parseTimestampInput,formatTimestampCanonical,applyTimestampToEvent,timestampInputValue,insertActionAfterEvent,insertActionBeforeEvent} from './video/timestamp-editor.js';
import {createVideoWorkerClient,normalizeWorkerBaseUrl} from './video/worker-client.js';
import {buildVideoCutManifest,buildSelectionContext,proposeVideoFilename,safeVideoFilename,validateVideoCutManifest} from './video/cut-manifest.js';
import {libraryDisplayDate,applyMatchMetadata} from './library/metadata.js';

const APP_VERSION='0.4.2';
const APP_VERSION_ID='0.4.2';
const TECHNIQUE_ICON_REV='0.4.2';
const UPDATE_REPO='IZ23/VolleyTakt-Web';
const migrationReport=runDataMigrations();
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
async function withButtonBusy(button,task,label=t('status.wait')){if(!button||button.disabled)return;const text=button.textContent;button.disabled=true;button.classList.add('is-busy');button.textContent=label;try{return await task()}finally{button.disabled=false;button.classList.remove('is-busy');button.textContent=text}}
const POS=[4,3,2,5,6,1], TOP_POS=[1,6,5,2,3,4], BOTTOM_POS=[4,3,2,5,6,1], OWN_COURT_ZONES=[4,3,2,7,8,9,5,6,1], OPP_COURT_ZONES=[1,6,5,9,8,7,2,3,4], TARGET_TOP_ZONES=[1,6,5,7,8,9,2,3,4], TARGET_BOTTOM_ZONES=[4,3,2,9,8,7,5,6,1], COURT_ZONES=OWN_COURT_ZONES, ROMAN_POS={1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI'}, ROT=['R1','R6','R5','R4','R3','R2'], ACTIONS=['Angriff','Annahme','Aufschlag','Block','Abwehr','Zuspiel'];
const QUALITY_PROFILES={basic_5:['=','-','0','+','#'],datavolley_6:['=','-','!','/','+','#']};
const BASIC_QUALITY_BUTTON_ORDER=['+','#','0','-','=']; // display only: top row + # 0; bottom row - =
const QUALITY_LEVEL={'=':0,'-':1,'/':2,'!':3,'0':3,'+':4,'#':5};
const ACTION_ICON_FILES={
 'Angriff':'./app-icons/techniques/angriff.png',
 'Annahme':'./app-icons/techniques/annahme.png',
 'Aufschlag':'./app-icons/techniques/aufschlag.png',
 'Block':'./app-icons/techniques/block.png',
 'Abwehr':'./app-icons/techniques/abwehr.png',
 'Zuspiel':'./app-icons/techniques/zuspiel.png'
};
const ACTION_LABEL_KEYS={'Angriff':'volleyball.attack','Annahme':'volleyball.reception','Aufschlag':'volleyball.serve','Block':'volleyball.block','Abwehr':'volleyball.dig','Zuspiel':'volleyball.set'};
const QUALITY_KEY_PART={'=':'eq','-':'minus','!':'bang','/':'slash','+':'plus','#':'hash'};
const ACTION_KEY_PART={'Angriff':'attack','Annahme':'reception','Aufschlag':'serve','Block':'block','Abwehr':'dig','Zuspiel':'set'};
const actionLabel=action=>t(ACTION_LABEL_KEYS[action]||action);
const DV_QUALITY_ORDER={
 'Aufschlag':['=','-','!','+','/','#'],
 'Annahme':['=','/','-','!','+','#'],
 'Angriff':['=','/','-','!','+','#'],
 'Block':['=','/','-','!','+','#'],
 'Abwehr':['=','-','/','!','+','#'],
 'Zuspiel':['=','/','-','!','+','#']
};
const TOUR_VERSION='tour-5';
const DEFAULT_SHORTCUTS={
 'position.1':'1','position.2':'2','position.3':'3','position.4':'4','position.5':'5','position.6':'6',
 'action.attack':'A','action.reception':'N','action.serve':'U','action.block':'B','action.defense':'D','action.set':'Z',
 'quality.equal':'=','quality.minus':'-','quality.bang':'!','quality.slash':'/','quality.zero':'0','quality.plus':'+','quality.hash':'*',
 'rally.own':'P','rally.opponent':'G','substitution':'W','libero':'L','rotation':'R','undo':'Backspace','cancel':'Escape'
};
const SHORTCUT_LABEL_KEYS={
 'position.1':'shortcut.position1','position.2':'shortcut.position2','position.3':'shortcut.position3','position.4':'shortcut.position4','position.5':'shortcut.position5','position.6':'shortcut.position6',
 'action.attack':'shortcut.attack','action.reception':'shortcut.reception','action.serve':'shortcut.serve','action.block':'shortcut.block','action.defense':'shortcut.defense','action.set':'shortcut.set',
 'quality.equal':['shortcut.rating',{value:'='}],'quality.minus':['shortcut.rating',{value:'-'}],'quality.bang':['shortcut.rating',{value:'!'}],'quality.slash':['shortcut.rating',{value:'/'}],'quality.zero':['shortcut.rating',{value:'0'}],'quality.plus':['shortcut.rating',{value:'+'}],'quality.hash':['shortcut.rating',{value:'#'}],
 'rally.own':'shortcut.pointUs','rally.opponent':'shortcut.pointOpponent','substitution':'shortcut.substitution','libero':'shortcut.libero','rotation':'shortcut.rotation','undo':'shortcut.undo','cancel':'shortcut.cancel'
};
const TOUR_STEPS=[1,2,3,4,5,6,7].map((n,i)=>({sel:['#quickScoutToggle','#serveStateBtn','#menuBtn','','#clockStartBtn','.court-panel','.correction-dock'][i],titleKey:`tour.${n}.title`,textKey:`tour.${n}.text`}));
const now=()=>new Date().toISOString(), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=sec=>{sec=Math.max(0,+sec||0);const m=Math.floor(sec/60),s=sec-m*60;return `${String(m).padStart(2,'0')}:${s.toFixed(1).padStart(4,'0')}`};
const defaultState=createDefaultState();
let master=loadMaster(), state=normalizeLoadedState(loadState(),defaultState), events=loadEvents(), redoStack=[], drawerHistory=[], settings={camera:{adapter:'dji_osmo',statusIntervalMs:12000,reconnect:true},sync:{provider:'none',url:'',path:'VolleyTakt',username:'',password:'',clientId:'',oneDriveClientId:'',dropboxClientId:'',boxClientId:'',appleContainerId:'',appleApiToken:'',appleEnvironment:'production',autoStart:false,autoChange:false},videoCut:{enabled:false,provider:'volleyvideo-worker',providers:{'volleyvideo-worker':{baseUrl:'',apiToken:'',preferredProfile:'1080p-h264',lastCapabilities:null}}},shortcuts:{...DEFAULT_SHORTCUTS},ui:{tourDismissedVersion:'',language:'de'},...loadSettings()};settings.camera={adapter:'dji_osmo',statusIntervalMs:12000,reconnect:true,...(settings.camera||{})};settings.videoCut={enabled:false,provider:'volleyvideo-worker',providers:{'volleyvideo-worker':{baseUrl:'',apiToken:'',preferredProfile:'1080p-h264',lastCapabilities:null}},...(settings.videoCut||{})};settings.videoCut.providers={...(settings.videoCut.providers||{}),'volleyvideo-worker':{baseUrl:'',apiToken:'',preferredProfile:'1080p-h264',lastCapabilities:null,...(settings.videoCut.providers?.['volleyvideo-worker']||{})}};settings.shortcuts={...DEFAULT_SHORTCUTS,...(settings.shortcuts||{})};settings.ui={tourDismissedVersion:'',language:'de',playerSort:'jersey',playersTableSort:{key:'abbreviation',direction:'asc'},...(settings.ui||{})};if(!['jersey','abbreviation','firstName'].includes(settings.ui.playerSort))settings.ui.playerSort='jersey';if(!settings.ui.playersTableSort||!['name','abbreviation','jersey'].includes(settings.ui.playersTableSort.key))settings.ui.playersTableSort={key:'abbreviation',direction:'asc'};if(!['asc','desc'].includes(settings.ui.playersTableSort.direction))settings.ui.playersTableSort.direction='asc';
initI18n(settings.ui.language);
const startVersionText=$('#startVersionText');if(startVersionText)startVersionText.textContent=t('shell.startSubtitle',{version:APP_VERSION});
const csv=new CsvStore();let camera=null,cameraAnchor=null,modalSubmit=null,modalCancel=null,syncTimer=null,playerChangeMode=null;const edgeSwipeRouter=createEdgeSwipeRouter();let cloudMatchLibrary=[];let libraryRefreshing=false;let matchEditorOpen=false;let matchEditorMode='';let analysisPinnedMatchId='';let selectedProtocolEventId='';const DEVICE_ID_KEY='volleytakt-live-device-id';let liveSyncBusy=false,liveSyncPending=false;
const cameraDiag={secure:window.isSecureContext===true?'Ja':'Nein',api:('bluetooth' in navigator)?'Ja':'Nein',availability:'–',chooser:'Nicht gestartet',device:'–',gatt:'Nein',service:'Nein',notify:'Nein',write:'Nein',notifications:'Nein',handshake:'Nein',lastError:'–'};
let cameraDiagLog=[];let cameraDiagVisible=false;let cameraBatteryValue=null,cameraBatteryRenderedAt=0,cameraLastStatusAt=0,cameraReconnects=0,cameraStatusFailures=0,cameraClipStartRecordTime=0;
function dlog(message){cameraDiagLog.push(`[${new Date().toLocaleTimeString()}] ${String(message??'')}`);if(cameraDiagLog.length>120)cameraDiagLog=cameraDiagLog.slice(-120);renderCameraDiagnostics()}
const cameraService=new CameraService({adapter:settings.camera?.adapter||'dji_osmo',statusIntervalMs:Number(settings.camera?.statusIntervalMs)||12000,log:dlog});
function runtimeOs(){const ua=navigator.userAgent||'',p=navigator.platform||'';if(/iPad|iPhone|iPod/i.test(ua)||(p==='MacIntel'&&navigator.maxTouchPoints>1))return 'ios';if(/Android/i.test(ua))return 'android';if(/Windows/i.test(ua))return 'windows';if(/Macintosh|Mac OS X/i.test(ua))return 'macos';if(/Linux/i.test(ua))return 'linux';return 'other'}
function cameraBrowserName(){const ua=navigator.userAgent||'';if(/SamsungBrowser/i.test(ua))return 'Samsung Internet';if(/EdgA|EdgiOS|Edg\//i.test(ua))return 'Microsoft Edge';if(/OPR\//i.test(ua))return 'Opera';if(/Vivaldi/i.test(ua))return 'Vivaldi';if(/Firefox|FxiOS/i.test(ua))return 'Firefox';if(/CriOS|Chrome\//i.test(ua))return 'Google Chrome / Chromium';if(/Safari/i.test(ua))return 'Safari';const b=navigator.userAgentData?.brands?.find(x=>!/^Not/i.test(x.brand))?.brand;return b||'dieser Browser'}
function cameraSupportInfo(){const browser=cameraBrowserName(),os=runtimeOs(),secure=window.isSecureContext===true,api=!!navigator.bluetooth;if(secure&&api&&browser==='Samsung Internet'&&os==='android')return{supported:false,browser,os,text:t('camera.samsungWarning')};if(secure&&api)return{supported:true,browser,os,text:t('camera.webBluetoothAvailable')};if(!secure)return{supported:false,browser,os,text:t('camera.httpsRequired',{browser})};if(os==='ios')return{supported:false,browser,os,text:t('camera.iosUnsupported',{browser})};if(os==='android')return{supported:false,browser,os,text:t('camera.androidUnsupported',{browser})};if(os==='windows'||os==='macos')return{supported:false,browser,os,text:t('camera.desktopUnsupported',{browser,os:os==='windows'?'Windows':'macOS'})};if(os==='linux')return{supported:false,browser,os,text:t('camera.linuxUnsupported',{browser})};return{supported:false,browser,os,text:t('camera.genericUnsupported',{browser})}}
function renderStartupCameraNotice(){const el=$('#browserCameraNotice');if(!el)return;const info=cameraSupportInfo();el.hidden=info.supported;el.textContent=info.supported?'':info.text;el.classList.toggle('warning',!info.supported)}
function cameraSupportNoticeHtml(){const info=cameraSupportInfo();return `<div class="camera-support-note ${info.supported?'ok':'warning'}"><strong>${t(info.supported?'camera.supportAvailable':'camera.supportUnavailable')}</strong><span>${esc(info.text)}</span></div>`}
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
function persistCurrentEventsIntoArchive(){if(!state.matchId)return null;return archiveCurrentMatch(state.matchComplete?'ended':'active')}
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
function targetCourtZonesForSide(side,{singleScout=false}={}){
 const top=singleScout?highlightedFieldIsTop():sideIsTopOnScreen(side);
 return top?TARGET_TOP_ZONES:TARGET_BOTTOM_ZONES
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
function pointAwardReady(terminalResult=false){return pointAwardAllowed({quickScout:state.quickScout,terminalResult,matchConfigured:matchConfigured(),setReady:state.setReady,matchComplete:state.matchComplete,servingSide:state.servingSide,ownLineupReady:lineupHasPlayers('own'),opponentCapture:state.opponentCapture,opponentLineupReady:lineupHasPlayers('opponent')})}
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
 if(events.length&&!confirm(t('status.quickExistingConfirm')))return false;
 if(state.matchId&&!state.quickScoutDraft)archiveCurrentMatch(state.matchComplete?'ended':'interrupted');
 events=[];await csv.write(events);state={...defaultState,quickScout:true,quickScoutDraft:!!draft,quickOwnName:'Wir',quickOppName:'Gegner',quickPlayers:{},matchDate:new Date().toISOString().slice(0,10),matchId:newId('match'),matchTypeId:'__quick__',matchTypeName:'Spontanes Scouting',opponentCapture:true,allowPositionOnly:true,setReady:true,ownQualityProfile:'basic_5',opponentQualityProfile:'basic_5'};
 ensureQuickPlayers();state.ownLineup=quickLineup('own');state.oppLineup=quickLineup('opponent');state.ownBaseLineup={...state.ownLineup};state.oppBaseLineup={...state.oppLineup};state.setLineupsOwn={'1':{...state.ownLineup}};state.setLineupsOpp={'1':{...state.oppLineup}};state.currentLiberosOwn=[quickLiberoId('own',1),quickLiberoId('own',2)];state.currentLiberosOpp=[quickLiberoId('opponent',1),quickLiberoId('opponent',2)];state.setLiberosOwn={'1':[...state.currentLiberosOwn]};state.setLiberosOpp={'1':[...state.currentLiberosOpp]};saveState(state);render();drawMatch();setStatus(t('status.quickReady'));
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
function qualityValues(){const profile=currentQualityProfile();if(profile==='datavolley_6')return DV_QUALITY_ORDER[state.pendingAction]||QUALITY_PROFILES.datavolley_6;return BASIC_QUALITY_BUTTON_ORDER}
function qualityLevel(value,action=state.pendingAction){if(currentQualityProfile()==='datavolley_6'){const order=DV_QUALITY_ORDER[action]||QUALITY_PROFILES.datavolley_6;const i=order.indexOf(value);return i<0?3:i}return QUALITY_LEVEL[value]??3}
function qualityClass(q){return {'=':'q-error','-':'q-negative','!':'q-limited','/':'q-poor','0':'q-neutral','+':'q-positive','#':'q-perfect'}[q]||''}
function qualityMeaning(q,action=state.pendingAction){
 const dv=currentQualityProfile()==='datavolley_6';
 if(dv&&action)return t(`quality.${ACTION_KEY_PART[action]||'attack'}.${QUALITY_KEY_PART[q]||'eq'}`);
 const key={'=':'quality.basic.error','-':'quality.basic.negative','0':'quality.basic.neutral','+':'quality.basic.positive','#':'quality.basic.perfect'}[q];return key?t(key):q
}
function qualityChip(q){return `<span class="quality-chip ${qualityClass(q)}">${esc(q||'–')}</span>`}
function renderQualityButtons(action=state.pendingAction||''){const row=$('#qualityButtons');if(!row)return;const vals=qualityValues();const detailed=vals.length===6;row.style.setProperty('--quality-count',vals.length);row.classList.toggle('detailed',detailed);row.classList.toggle('basic',!detailed);row.innerHTML='';for(const q of vals){const b=document.createElement('button');b.textContent=q;b.dataset.quality=q;b.classList.add('quality-button',qualityClass(q));b.title=qualityMeaning(q,action);b.onclick=()=>chooseQuality(q);if(q===state.pendingQuality)b.classList.add('selected');row.appendChild(b)}const help=$('#qualityMeaning');if(help){help.innerHTML='';if(detailed){const head=document.createElement('div');head.className='quality-meaning-context';head.textContent=action?t('quality.meaningFor',{skill:actionLabel(action)}):t('quality.selectSkill');help.appendChild(head)}for(const q of vals){const line=document.createElement('div');line.className='quality-meaning-row';const key=document.createElement('span');key.className=`quality-meaning-key ${qualityClass(q)}`;key.textContent=q;const text=document.createElement('span');text.className='quality-meaning-text';text.textContent=qualityMeaning(q,action);line.append(key,text);help.appendChild(line)}}}
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
function disconnectCamera(){if(!camera)return;cameraService.disconnect();camera=null;cameraAnchor=null;state.cameraRecording=false;state.clockMode='local';state.localClockRunning=false;state.localClockStartedAt=0;state.localClockElapsed=0;cameraLastStatusAt=0;cameraReconnects=0;cameraStatusFailures=0;cameraBatteryValue=null;persist();render();updateCameraUi(true);setStatus(t('status.cameraDisconnected'))}
function startLocalClock(reset=false){cameraAnchor=null;if(reset)state.localClockElapsed=0;if(!state.localClockRunning||reset){state.localClockStartedAt=Date.now();state.localClockRunning=true}state.clockMode='local';persist();render();setStatus(reset?'Lokale Zeit bei 00:00.0 neu gestartet.':state.localClockElapsed>0?'Lokale Zeit fortgesetzt.':'Lokale Zeit gestartet.')}
function stopLocalClock(message=true){if(state.localClockRunning){state.localClockElapsed=currentSeconds();state.localClockRunning=false;state.localClockStartedAt=0;state.clockMode='local';persist();render();if(message)setStatus(t('status.localClockPaused'))}return state.localClockElapsed}
async function stopLiveTimeAtBoundary(){const sec=currentSeconds(),wasRecording=!!state.cameraRecording;state.localClockElapsed=sec;state.localClockRunning=false;state.localClockStartedAt=0;cameraAnchor=null;if(wasRecording&&camera?.protocolConnected){try{await cameraService.stopRecording();syncCameraTelemetry(cameraService.snapshot());state.cameraRecording=false;state.clockMode='camera';persist();render();updateCameraUi(true);return ''}catch(e){cameraStatusFailures++;return ` Kamera-Aufnahme konnte nicht automatisch gestoppt werden: ${e?.message||e}`}}state.clockMode=camera?.protocolConnected?'camera':'local';persist();render();updateCameraUi();return ''}
function ensureManualVideoClockOnScoutingInput(){
 if(cameraAnchor||camera?.protocolConnected||state.cameraRecording)return;
 if(!(state.videoAssignments||[]).length)return;
 if(state.localClockRunning||state.videoClockInitialized)return;
 if((+state.localClockElapsed||0)>0){state.videoClockInitialized=true;persist();return}
 state.localClockElapsed=0;state.localClockStartedAt=Date.now();state.localClockRunning=true;state.clockMode='local';state.videoClockInitialized=true;persist();
 setStatus(t('video.clock.auto_started'));
}
function toggleLocalClock(){if(cameraAnchor||camera?.protocolConnected){setStatus(t('status.cameraTimeSourceStop'));return}state.videoClockInitialized=true;if(state.localClockRunning)stopLocalClock(true);else startLocalClock(false)}
function resetLocalClock(){if(cameraAnchor||camera?.protocolConnected){setStatus(t('status.cameraTimeSource'));return}state.localClockRunning=false;state.localClockStartedAt=0;state.localClockElapsed=0;state.videoClockInitialized=false;state.clockMode='local';persist();render();setStatus(t('status.localClockReset'))}
function wireClockPress(button){let timer=0,longFired=false;button.onclick=null;button.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;longFired=false;timer=setTimeout(()=>{timer=0;longFired=true;resetLocalClock()},650)});const cancel=()=>{if(timer){clearTimeout(timer);timer=0}};button.addEventListener('pointerup',cancel);button.addEventListener('pointercancel',cancel);button.addEventListener('pointerleave',cancel);button.addEventListener('contextmenu',e=>e.preventDefault());button.addEventListener('click',e=>{if(longFired){e.preventDefault();longFired=false;return}toggleLocalClock()})}
function cycleServing(){state.servingSide=state.servingSide==='us'?'them':state.servingSide==='them'?'':'us';if(state.servingSide==='us')prepareOwnServePreset();else if(state.autoServePreset)clearPending(false);persist();render();setStatus(state.servingSide?`Aufschlagrecht: ${state.servingSide==='us'?'Wir':'Gegner'}.`:'Aufschlagrecht nicht festgelegt.')}
function cloudConfigPresent(cfg=settings.sync){const p=cfg?.provider||'none';if(p==='none')return false;if(['nextcloud','webdav'].includes(p))return !!(String(cfg.url||'').trim()&&String(cfg.username||'').trim()&&String(cfg.password||'').trim());if(p==='google')return !!String(cfg.clientId||'').trim();if(p==='onedrive')return !!String(cfg.oneDriveClientId||'').trim();if(p==='dropbox')return !!String(cfg.dropboxClientId||'').trim();if(p==='box')return !!String(cfg.boxClientId||'').trim();if(p==='icloud')return !!(String(cfg.appleContainerId||'').trim()&&String(cfg.appleApiToken||'').trim());return false}
async function probeCloudOnStart(){if(!cloudConfigPresent()){syncUiState=settings.sync?.provider&&settings.sync.provider!=='none'?'incomplete':'ready';updateSyncBadge();return false}syncUiState='connecting';updateSyncBadge();try{await createProvider(settings.sync).test();syncUiState='synced';updateSyncBadge();if(settings.sync?.autoStart)runSync(false);return true}catch(e){syncUiState='error';syncUiLastError=e?.message||String(e);updateSyncBadge();return false}}
async function start({skipAutoTour=false}={}){try{await document.documentElement.requestFullscreen?.()}catch{}try{await screen.orientation?.lock?.('landscape')}catch{}$('#startGate').hidden=true;$('#app').hidden=false;const ok=await csv.init('VolleyTaktLive_current.csv');$('#storagePill').textContent=ok?'CSV: lokal ✓':'CSV: Browser';if(state.servingSide==='us'&&!state.currentRallyId&&!state.pendingSide)prepareOwnServePreset();render();probeCloudOnStart();if(!skipAutoTour)setTimeout(()=>maybeStartTour(),250)}

function render(){
 const ready=matchConfigured();
 $('#scoreUs').textContent=state.scoreUs;$('#scoreThem').textContent=state.scoreThem;$('#setDisplay').textContent=`Sätze ${state.setWinsUs} : ${state.setWinsThem}`;const captureOpponent=state.activeTeamContext==='opponent';const opponentToggle=$('#opponentToggle');if(opponentToggle){opponentToggle.checked=captureOpponent;const opponentSwitch=opponentToggle.closest('.opponent-switch');if(opponentSwitch){opponentSwitch.hidden=!state.opponentCapture;opponentSwitch.title=state.quickScout?'Zu scoutende Seite wechseln: Wir / Gegner':ready?'Zu scoutende Seite wechseln':'Nach Spiel-/Satzvorbereitung verfügbar';opponentSwitch.classList.toggle('quick-opponent-ready',!!state.quickScout)}}const activeRotation=ROT[captureOpponent?(state.oppRotationIndex||0):state.rotationIndex]||'R1';$('#rotationLabel').textContent=`${captureOpponent?'Gegner':'Wir'} · ${activeRotation}`;const quickToggle=$('#quickScoutToggle');if(quickToggle)quickToggle.checked=!!state.quickScout;const detailToggle=$('#detailedQualityToggle');if(detailToggle)detailToggle.checked=qualityProfileForSide(captureOpponent?'opponent':'own')==='datavolley_6';
 const ot=team(state.ownTeamId),op=team(state.oppTeamId);const configured=matchConfigured();$('#headerOwnTeam').textContent=state.quickScout?(state.quickOwnName||'Wir'):(ot?.name||'Wir');$('#headerOppTeam').textContent=state.quickScout?(state.quickOppName||'Gegner'):(op?.name||'Gegner');$('#matchScoreBlock').hidden=!configured;$('#matchSetupBtn').hidden=configured;const mainQuick=$('#mainQuickStartBtn');if(mainQuick)mainQuick.hidden=configured;
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
 const fullName=(!target&&playerPos&&pid)?playerFull(pid):'',showPlayerName=!!fullName&&fullName!==abbr&&!state.quickScout;
 const playerName=showPlayerName?`<small class="pos-name">${esc(fullName)}</small>`:'';
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
 const zones=target&&nineZone?targetCourtZonesForSide(side,{singleScout}):courtZonesForSide(side,nineZone,{singleScout});
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
function renderProtocol(){
 const body=$('#protocolBody');body.innerHTML='';
 const visible=[...events].reverse().slice(0,500);
 if(selectedProtocolEventId&&!visible.some(e=>e.id===selectedProtocolEventId))selectedProtocolEventId='';
 for(const e of visible){
  const rowEl=document.createElement('tr');const pabbr=eventPlayerAbbreviation(e),pname=eventPlayerName(e);const zone=e.action_zone?` → ${posToken(+e.action_zone)}`:'';
  rowEl.dataset.protocolEventId=e.id||'';rowEl.classList.toggle('selected',e.id===selectedProtocolEventId);rowEl.tabIndex=0;
  rowEl.innerHTML=`<td class="protocol-time-cell"><button type="button" class="protocol-time-edit" data-event-time-edit="${esc(e.id||'')}" title="${esc(t('timestamp.edit_one'))}">${esc(e.timestamp||'–')} <span aria-hidden="true">✎</span></button></td><td>${esc(e.set)}</td><td>${esc(e.rotation)}</td><td>${esc(e.player_rotation_position||e.position)}${esc(zone)}</td><td title="${esc(pname)}">${esc(pabbr)}</td><td>${esc(e.action)}</td><td>${qualityChip(e.value)}</td><td>${e.score_us}:${e.score_them}</td>`;
  const select=()=>{selectedProtocolEventId=e.id||'';renderProtocol()};rowEl.addEventListener('click',ev=>{if(ev.target.closest('button'))return;select()});rowEl.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();select()}});body.appendChild(rowEl)
 }
 body.querySelectorAll('[data-event-time-edit]').forEach(btn=>btn.onclick=()=>editCurrentEventTimestamp(btn.dataset.eventTimeEdit));
 const add=$('#protocolInsertBtn');if(add){add.disabled=!selectedProtocolEventId;add.title=selectedProtocolEventId?t('timestamp.insert_before_selected'):t('timestamp.select_row_first');add.onclick=()=>selectedProtocolEventId&&openProtocolInsertBeforeDialog(selectedProtocolEventId)}
 $('#eventCount').textContent=`${events.length} Einträge`
}
function timestampParserHint(){return `<p class="small timestamp-help">${esc(t('timestamp.input_help'))}</p>`}
function timestampPreviewScript(){
 const inputs=$$('#dialogBody [data-timestamp-input]');
 for(const input of inputs){const out=input.parentElement?.querySelector('[data-timestamp-preview]');const update=()=>{const parsed=parseTimestampInput(input.value);if(out){out.textContent=parsed.ok?`→ ${formatTimestampCanonical(parsed.seconds)}`:t('timestamp.invalid');out.classList.toggle('error',!parsed.ok)}};input.addEventListener('input',update);update()}
 for(const btn of $$('#dialogBody [data-timestamp-insert-after]'))btn.onclick=()=>{
  const details=$('#dialogBody .timestamp-insert'),select=$('#dialogBody select[name="insert_after"]');
  if(select)select.value=btn.dataset.timestampInsertAfter||'';
  if(details){details.open=true;details.classList.add('timestamp-insert-focus');details.scrollIntoView({block:'nearest',behavior:'smooth'});setTimeout(()=>details.classList.remove('timestamp-insert-focus'),900)}
  const first=$('#dialogBody select[name="insert_player"]');if(first)setTimeout(()=>first.focus(),120)
 }
}
function editCurrentEventTimestamp(eventId){
 const index=events.findIndex(e=>e.id===eventId);if(index<0)return;const event=events[index];
 modal(t('timestamp.edit_one'),`${timestampParserHint()}<label>${esc(t('timestamp.time'))}<input name="timestamp" data-timestamp-input inputmode="decimal" value="${esc(timestampInputValue(event))}" autocomplete="off"><small data-timestamp-preview></small></label><p class="small">${esc(event.action||'')} · ${esc(event.player_abbreviation||event.player||'')} · ${esc(t('timestamp.preserve_duration'))}</p>`,fd=>{const parsed=parseTimestampInput(fd.get('timestamp'));if(!parsed.ok)throw new Error(t('timestamp.invalid'));events[index]=applyTimestampToEvent(event,parsed.seconds,fmt);saveEvents(events);persistCurrentEventsIntoArchive();void csv.write(events);render();setStatus(t('timestamp.saved'));},t('common.save'));
 setTimeout(timestampPreviewScript,0)
}
function timestampDisplayRows(matchEvents){
 const rows=(matchEvents||[]).filter(isTechniqueEvent),fallback=new Map();let next=0;
 return rows.map((e,index)=>{let rally=Number(e.rally_no)||0;if(!rally&&e.rally_id){if(!fallback.has(e.rally_id))fallback.set(e.rally_id,++next);rally=fallback.get(e.rally_id)}const parsed=parseTimestampInput(timestampInputValue(e));return {e,index,rally,seq:Number(e.rally_sequence)||index+1,time:parsed.ok?parsed.seconds:0}})
  .sort((a,b)=>(Number(a.e.set)||0)-(Number(b.e.set)||0)||a.rally-b.rally||a.seq-b.seq||a.time-b.time||a.index-b.index)
}
function timestampEditorRows(matchEvents){return timestampDisplayRows(matchEvents).map(({e,index,rally,seq,time})=>`<tr data-ts-row data-sort-set="${Number(e.set)||0}" data-sort-rally="${rally}" data-sort-seq="${seq}" data-sort-player="${esc(String(e.player_abbreviation||e.player||'').toLocaleLowerCase())}" data-sort-action="${esc(String(e.action||'').toLocaleLowerCase())}" data-sort-time="${time}"><td>${esc(e.set||'')}</td><td>R${esc(rally||'–')}</td><td>${esc(seq||'–')}</td><td>${esc(e.player_abbreviation||e.player||'')}</td><td>${esc(e.action||'')}</td><td><label class="timestamp-inline"><input name="ts_${esc(e.id||String(index))}" data-timestamp-input data-event-id="${esc(e.id||'')}" inputmode="decimal" value="${esc(timestampInputValue(e))}"><small data-timestamp-preview></small></label></td><td class="timestamp-row-actions"><button type="button" class="timestamp-insert-row" data-timestamp-insert-after="${esc(e.id||'')}" title="${esc(t('timestamp.insert_after_row'))}" aria-label="${esc(t('timestamp.insert_after_row'))}">＋</button></td></tr>`).join('')}
function timestampSortHeader(label,key){return `<button type="button" class="timestamp-sort" data-timestamp-sort="${key}" data-dir="none">${esc(label)} <span aria-hidden="true">↕</span></button>`}
function wireTimestampTableSorting(){
 const table=$('#dialogBody .timestamp-editor-table');if(!table)return;
 const body=table.tBodies[0],sizeSelect=$('#dialogBody #timestampPageSize'),prev=$('#dialogBody #timestampPagePrev'),next=$('#dialogBody #timestampPageNext'),info=$('#dialogBody #timestampPageInfo');let page=1;
 const rows=()=>[...body.querySelectorAll('[data-ts-row]')];
 const applyPage=()=>{const all=rows(),raw=sizeSelect?.value||'25',size=raw==='all'?all.length:Math.max(1,Number(raw)||25),pages=Math.max(1,Math.ceil(all.length/Math.max(1,size)));page=Math.min(Math.max(1,page),pages);const from=raw==='all'?0:(page-1)*size,to=raw==='all'?all.length:from+size;all.forEach((r,i)=>r.hidden=i<from||i>=to);if(info)info.textContent=raw==='all'?t('timestamp.page_all',{count:all.length}):t('timestamp.page_info',{page,pages,count:all.length});if(prev)prev.disabled=raw==='all'||page<=1;if(next)next.disabled=raw==='all'||page>=pages};
 table.querySelectorAll('[data-timestamp-sort]').forEach(btn=>btn.onclick=()=>{const key=btn.dataset.timestampSort,dir=btn.dataset.dir==='asc'?'desc':'asc';table.querySelectorAll('[data-timestamp-sort]').forEach(b=>{b.dataset.dir='none';b.querySelector('span').textContent='↕'});btn.dataset.dir=dir;btn.querySelector('span').textContent=dir==='asc'?'▲':'▼';const all=rows();all.sort((a,b)=>{const av=a.dataset[`sort${key[0].toUpperCase()+key.slice(1)}`]??'',bv=b.dataset[`sort${key[0].toUpperCase()+key.slice(1)}`]??'';const an=Number(av),bn=Number(bv),cmp=(Number.isFinite(an)&&Number.isFinite(bn))?an-bn:String(av).localeCompare(String(bv),settings.ui?.language||'de',{numeric:true,sensitivity:'base'});return dir==='asc'?cmp:-cmp});all.forEach(r=>body.appendChild(r));page=1;applyPage()});
 if(sizeSelect)sizeSelect.onchange=()=>{page=1;applyPage()};if(prev)prev.onclick=()=>{page--;applyPage()};if(next)next.onclick=()=>{page++;applyPage()};applyPage()
}

function jerseySortKey(value){const raw=String(value??'').trim(),m=raw.match(/^\d+$/);return m?[0,Number(raw)]:[1,raw.toLocaleLowerCase()]}
function compareTimestampPlayers(a,b){const ak=jerseySortKey(a?.jersey),bk=jerseySortKey(b?.jersey);if(ak[0]!==bk[0])return ak[0]-bk[0];if(ak[1]!==bk[1])return typeof ak[1]==='number'&&typeof bk[1]==='number'?ak[1]-bk[1]:String(ak[1]).localeCompare(String(bk[1]),settings.ui?.language||'de',{numeric:true,sensitivity:'base'});return String(a?.abbr||a?.name||'').localeCompare(String(b?.abbr||b?.name||''),settings.ui?.language||'de',{numeric:true,sensitivity:'base'})}
function timestampInsertPlayerLabel(p,includeSide=false){const jersey=String(p?.jersey||'').trim(),abbr=String(p?.abbr||'').trim(),name=String(p?.name||'').trim(),pos=Number(p?.pos)||0;let core=jersey&&jersey!=='–'?`#${jersey}${abbr?` · ${abbr}`:name?` · ${name}`:''}`:(abbr||name||(pos?`P${pos}`:'–'));return includeSide?`${p?.side==='opponent'?t('common.opponent'):t('common.own')} · ${core}`:core}
function lineupAtTimestampAnchor(side,anchor,sourceEvents=events){if(!anchor)return lineupForSide(side)||{};const idx=sourceEvents.findIndex(e=>e.id===anchor.id);if(idx<0)return lineupForSide(side)||{};const rebuilt=reconstructMatchState(sourceEvents.slice(0,idx+1),{rotationLabels:ROT,firstSetServing:state.firstSetServing||'',rallyCounter:0,rallyHighWater:0,setLiberosOwn:{},setLiberosOpp:{},isTechniqueEvent,servingForSet,isMatchFinishedAfterSet});return side==='opponent'?(rebuillineupTransition.oppLineup||{}):(rebuillineupTransition.ownLineup||{})}
function protocolInsertPlayerOptions(anchor,sourceEvents=events){
 const side=String(anchor?.action||'').startsWith('Gegner ')?'opponent':'own',lineup=lineupAtTimestampAnchor(side,anchor,sourceEvents),onCourtIds=new Set(Object.values(lineup||{}).filter(Boolean));
 if(state.quickScout){ensureQuickPlayers();const rows=Object.values(state.quickPlayers).filter(p=>p.side===side).map(p=>({side,id:p.id,abbr:p.abbreviation||p.description||'',name:p.description||'',pos:Number(Object.entries(lineup||{}).find(([,id])=>id===p.id)?.[0])||0,jersey:p.defaultJersey||'',onCourt:onCourtIds.has(p.id)}));return rows.sort((a,b)=>(b.onCourt-a.onCourt)||compareTimestampPlayers(a,b))}
 const tid=side==='opponent'?state.oppTeamId:state.ownTeamId;let roster=matchRosterRows(tid,state.seasonId,state.matchTypeId);
 if(!roster.length){const ids=[...onCourtIds];return ids.map(id=>({side,id,abbr:playerLabel(id),name:playerFull(id),pos:Number(Object.entries(lineup||{}).find(([,pid])=>pid===id)?.[0])||0,jersey:playerJerseyForSide(side,id),onCourt:true})).sort(compareTimestampPlayers)}
 const rows=roster.map(r=>{const id=r.playerId,p=player(id);return {side,id,abbr:p?.abbreviation||'',name:p?.description||[p?.firstName,p?.lastName].filter(Boolean).join(' '),pos:Number(Object.entries(lineup||{}).find(([,pid])=>pid===id)?.[0])||0,jersey:String(r.jersey??p?.defaultJersey??'').trim(),onCourt:onCourtIds.has(id)}});
 return rows.sort((a,b)=>(b.onCourt-a.onCourt)||compareTimestampPlayers(a,b))
}
function timestampPlayerOptionHtml(players,{includeSide=false}={}){const court=players.filter(p=>p.onCourt),bench=players.filter(p=>!p.onCourt),opts=rows=>rows.map(p=>`<option value="${esc(p.id?`id:${p.id}`:`pos:${p.pos}`)}">${esc(timestampInsertPlayerLabel(p,includeSide))}</option>`).join('');return `${court.length?`<optgroup label="${esc(t('timestamp.players_on_court'))}">${opts(court)}</optgroup>`:''}${bench.length?`<optgroup label="${esc(t('timestamp.players_roster'))}">${opts(bench)}</optgroup>`:''}`}
function resolveTimestampPlayer(value,anchor,sourceEvents=events){const players=protocolInsertPlayerOptions(anchor,sourceEvents),raw=String(value||'');if(raw.startsWith('id:'))return players.find(p=>p.id===raw.slice(3))||null;if(raw.startsWith('pos:'))return players.find(p=>!p.id&&String(p.pos)===raw.slice(4))||null;return null}
function timestampTargetOptionsFor(side,action){if(!action)return '';const sides=targetAllowsBothSides(action)?['own','opponent']:[targetSideFor(side,action)||'opponent'];return sides.map(targetSide=>{const label=targetSide==='own'?t('timestamp.target_own'):t('timestamp.target_opponent');return `<optgroup label="${esc(label)}">${[1,2,3,4,5,6,7,8,9].map(n=>`<option value="${targetSide}:${n}">${esc(label)} · P${n}</option>`).join('')}</optgroup>`}).join('')}
function parseTimestampTarget(raw){const m=/^(own|opponent):(\d)$/.exec(String(raw||''));if(m)return {side:m[1],zone:Number(m[2])};const n=Number(raw)||0;return {side:'',zone:n}}
function timestampInsertAnchorOptions(matchEvents){return matchEvents.filter(isTechniqueEvent).map(e=>`<option value="${esc(e.id||'')}">S${esc(e.set||'–')} · R${esc(e.rally_no||'–')} · ${esc(e.timestamp||'–')} · ${esc(e.player_abbreviation||e.player||'–')} · ${esc(e.action||'')}</option>`).join('')}
function timestampInsertPanel(matchEvents){
 const anchors=timestampInsertAnchorOptions(matchEvents),actions=ACTIONS.map(a=>`<option value="${esc(a)}">${esc(a)}</option>`).join(''),qualities=['=','-','!','/','0','+','#'].map(q=>`<option value="${esc(q)}">${esc(q)}</option>`).join('');
 return `<details class="timestamp-insert"><summary>＋ ${esc(t('timestamp.insert_action'))}</summary><p class="small">${esc(t('timestamp.insert_help'))}</p><div class="timestamp-insert-grid"><label>${esc(t('timestamp.insert_after'))}<select name="insert_after"><option value="">–</option>${anchors}</select></label><label>${esc(t('scouting.who'))}<select name="insert_player"><option value="">–</option></select></label><label>${esc(t('scouting.what'))}<select name="insert_action"><option value="">–</option>${actions}</select></label><label>${esc(t('scouting.how'))}<select name="insert_quality"><option value="">–</option>${qualities}</select></label><label>${esc(t('scouting.where'))}<select name="insert_zone"><option value="">–</option>${[1,2,3,4,5,6,7,8,9].map(n=>`<option value="${n}">P${n}</option>`).join('')}</select></label><label class="timestamp-insert-target">${esc(t('scouting.target'))}<select name="insert_target"><option value="">–</option></select></label><label>${esc(t('timestamp.rally_result'))}<select name="insert_result"><option value="none">${esc(t('timestamp.result_none'))}</option><option value="us">${esc(t('timestamp.result_us'))}</option><option value="them">${esc(t('timestamp.result_them'))}</option></select></label><label>${esc(t('timestamp.time'))}<input name="insert_timestamp" data-timestamp-input inputmode="decimal" placeholder="1:20"><small data-timestamp-preview></small></label></div></details>`
}
function buildInsertedTimestampEvent(anchor,player,fd,seconds){
 const side=player?.side||(String(anchor?.action||'').startsWith('Gegner ')?'opponent':'own'),baseAction=String(fd.get('insert_action')||''),value=String(fd.get('insert_quality')||''),zone=Number(fd.get('insert_zone'))||0,targetSpec=parseTimestampTarget(fd.get('insert_target')),target=targetSpec.zone,stamp=now(),group=newId('tx');
 const duration=0,canonical=fmt(seconds),action=side==='opponent'?`Gegner ${baseAction}`:baseAction;
 return {...anchor,id:newId('evt'),event_group:group,transaction_id:group,event_type:'action',rally_event:'action',action,value,player_id:player?.id||'',player_abbreviation:player?.abbr||'',player_name:player?.name||'',player:player?.abbr||'',position:String(player?.pos||anchor?.position||''),player_rotation_position:player?.pos||anchor?.player_rotation_position||'',action_zone:zone||'',target_zone:target||'',target_side:target?(targetSpec.side||(baseAction==='Zuspiel'?side:(side==='opponent'?'own':'opponent'))):'',quality_level:String(QUALITY_LEVEL[value]??3),seconds:Number(seconds).toFixed(3),timestamp:canonical,action_start_seconds:Number(seconds).toFixed(3),action_start_timestamp:canonical,action_end_seconds:Number(seconds+duration).toFixed(3),action_end_timestamp:canonical,action_started_at:stamp,action_completed_at:stamp,createdAt:stamp,timestamp_edited:true,timestamp_edited_at:stamp,postprocessed:true,inserted_in_timestamp_editor:true,note:''}
}
function insertedResultEvent(actionEvent,winner){if(!['us','them'].includes(winner))return null;const stamp=now(),group=actionEvent.transaction_id||newId('tx');return {...actionEvent,id:newId('evt'),event_type:'rally_result',rally_event:'result',action:winner==='us'?'Punkt wir':'Punkt Gegner',value:'manuell nachgetragen',player_id:'',player_abbreviation:'',player_name:'',player:'',position:'',player_rotation_position:'',action_zone:'',target_zone:'',target_side:'',rally_winner:winner,transaction_id:group,event_group:group,createdAt:stamp,action_started_at:stamp,action_completed_at:stamp,postprocessed:true,inserted_in_timestamp_editor:true}}
function normalizeStoredScores(rows){let su=0,st=0;for(const e of rows){if(e.event_type==='set_start'||e.action==='Satzstart'){su=0;st=0}else if(e.event_type==='rally_result'||e.action==='Punkt wir'||e.action==='Punkt Gegner'){const winner=e.rally_winner||(e.action==='Punkt wir'?'us':'them');if(winner==='us')su++;else if(winner==='them')st++}else if(e.action==='Spielstandskorrektur'){const m=String(e.value||'').match(/->(\d+):(\d+)/);if(m){su=+m[1];st=+m[2]}}e.score_us=String(su);e.score_them=String(st)}return rows}
function applyInsertedResult(rows,inserted,result){if(!['us','them'].includes(result))return rows;const res=insertedResultEvent(inserted,result);if(!res)return rows;rows=insertActionAfterEvent(rows,inserted.id,res);return normalizeStoredScores(rows)}
function openProtocolInsertBeforeDialog(anchorId){
 const anchor=events.find(e=>e.id===anchorId);if(!anchor)return;const side=String(anchor.action||'').startsWith('Gegner ')?'opponent':'own',players=protocolInsertPlayerOptions(anchor,events),profile=qualityProfileForSide(side),qualities=QUALITY_PROFILES[profile]||QUALITY_PROFILES.basic_5,detail=detailedCapture(side);const playerOpts=timestampPlayerOptionHtml(players),actions=ACTIONS.map(a=>`<option value="${esc(a)}">${esc(a)}</option>`).join(''),qualityOpts=qualities.map(q=>`<option value="${esc(q)}">${esc(q)}</option>`).join(''),zones=[1,2,3,4,5,6,7,8,9].map(n=>`<option value="${n}">P${n}</option>`).join('');
 const html=`<p class="small">${esc(t('timestamp.insert_before_help'))}</p><div class="protocol-insert-grid"><label><span>${esc(t('scouting.who'))}</span><select name="insert_player" required><option value="">–</option>${playerOpts}</select></label><label><span>${esc(t('scouting.what'))}</span><select name="insert_action" required><option value="">–</option>${actions}</select></label><label><span>${esc(t('scouting.how'))}</span><select name="insert_quality" required><option value="">–</option>${qualityOpts}</select></label><label><span>${esc(t('scouting.where'))}</span><select name="insert_zone" required><option value="">–</option>${zones}</select></label><label class="protocol-insert-target" hidden><span>${esc(t('scouting.target'))}</span><select name="insert_target"><option value="">–</option></select></label><label><span>${esc(t('timestamp.time'))}</span><input name="insert_timestamp" data-timestamp-input inputmode="decimal" value="${esc(timestampInputValue(anchor))}" required><small data-timestamp-preview></small></label><label><span>${esc(t('timestamp.rally_result'))}</span><select name="insert_result"><option value="none">${esc(t('timestamp.result_none'))}</option><option value="us">${esc(t('timestamp.result_us'))}</option><option value="them">${esc(t('timestamp.result_them'))}</option></select></label></div>`;
 modal(t('timestamp.insert_before_title'),html,fd=>{const player=resolveTimestampPlayer(fd.get('insert_player'),anchor,events),action=String(fd.get('insert_action')||''),quality=String(fd.get('insert_quality')||''),zone=String(fd.get('insert_zone')||''),target=String(fd.get('insert_target')||''),result=String(fd.get('insert_result')||'none'),parsed=parseTimestampInput(fd.get('insert_timestamp'));if(!player||!action||!quality||!zone||!parsed.ok)throw new Error(t('timestamp.insert_incomplete'));if(needsTarget(side,action)&&!target)throw new Error(t('timestamp.target_required'));const inserted=buildInsertedTimestampEvent(anchor,player,fd,parsed.seconds);events=insertActionBeforeEvent(events,anchorId,inserted);events=applyInsertedResult(events,inserted,result);saveEvents(events);reconstruct(events,{persistResult:false,renderResult:false});persistCurrentEventsIntoArchive();void csv.write(events);selectedProtocolEventId=inserted.id;render();setStatus(t('timestamp.inserted'));},t('common.ok'),null,t('common.cancel'));
 setTimeout(()=>wireProtocolInsertDialog(side),0)
}
function wireProtocolInsertDialog(side){
 timestampPreviewScript();const ok=$('#dialogOk'),body=$('#dialogBody'),action=body.querySelector('[name="insert_action"]'),targetWrap=body.querySelector('.protocol-insert-target'),target=body.querySelector('[name="insert_target"]');
 const update=()=>{const a=action?.value||'',needs=needsTarget(side,a);if(targetWrap)targetWrap.hidden=!needs;if(target){target.required=needs;target.innerHTML=`<option value="">–</option>${needs?timestampTargetOptionsFor(side,a):''}`}const req=[...body.querySelectorAll('[required]')];const ts=parseTimestampInput(body.querySelector('[name="insert_timestamp"]')?.value||'');ok.disabled=req.some(el=>!String(el.value||'').trim())||!ts.ok};body.addEventListener('input',update);body.addEventListener('change',update);update()
}
function editMatchTimestamps(matchId){
 const isCurrent=state.matchId===matchId;if(isCurrent)persistCurrentEventsIntoArchive();const snap=getMatchSnapshot(matchId);if(!snap){setStatus(t('timestamp.local_required'));return}const matchEvents=isCurrent?[...events]:[...(snap.events||[])];
 const head=`<tr><th>${timestampSortHeader(t('timestamp.set'),'set')}</th><th>${timestampSortHeader(t('timestamp.rally'),'rally')}</th><th>${timestampSortHeader(t('timestamp.sequence'),'seq')}</th><th>${timestampSortHeader(t('timestamp.player'),'player')}</th><th>${timestampSortHeader(t('timestamp.action'),'action')}</th><th>${timestampSortHeader(t('timestamp.time'),'time')}</th><th aria-label="${esc(t('timestamp.insert_action'))}">＋</th></tr>`;
 modal(`${t('timestamp.editor')} · ${matchNames(snap)}`,`${timestampParserHint()}<p class="small">${esc(t('timestamp.editor_scope'))}</p>${timestampInsertPanel(matchEvents)}<div class="timestamp-editor-toolbar"><label>${esc(t('timestamp.page_size'))}<select id="timestampPageSize"><option value="all">${esc(t('timestamp.page_all_label'))}</option><option value="10">10</option><option value="25" selected>25</option><option value="50">50</option><option value="100">100</option></select></label><div class="timestamp-pager"><button type="button" id="timestampPagePrev" aria-label="${esc(t('timestamp.page_prev'))}">‹</button><span id="timestampPageInfo"></span><button type="button" id="timestampPageNext" aria-label="${esc(t('timestamp.page_next'))}">›</button></div></div><div class="review-table-wrap timestamp-editor-wrap"><table class="timestamp-editor-table"><thead>${head}</thead><tbody>${timestampEditorRows(matchEvents)||`<tr><td colspan="7">${esc(t('timestamp.no_events'))}</td></tr>`}</tbody></table></div>`,fd=>{let changed=0;let nextEvents=matchEvents.map(e=>{const key=`ts_${e.id||''}`;if(!e.id||!fd.has(key))return e;const parsed=parseTimestampInput(fd.get(key));if(!parsed.ok)throw new Error(`${t('timestamp.invalid')} · ${e.action||e.id}`);const old=Number(e.action_start_seconds??e.seconds);if(Number.isFinite(old)&&Math.abs(old-parsed.seconds)<0.0005)return e;changed++;return applyTimestampToEvent(e,parsed.seconds,fmt)});const insertAction=String(fd.get('insert_action')||''),anchorId=String(fd.get('insert_after')||'');if(insertAction||anchorId){if(!insertAction||!anchorId||!String(fd.get('insert_quality')||''))throw new Error(t('timestamp.insert_incomplete'));const parsed=parseTimestampInput(fd.get('insert_timestamp'));if(!parsed.ok)throw new Error(t('timestamp.invalid'));const anchor=nextEvents.find(e=>e.id===anchorId);if(!anchor)throw new Error(t('timestamp.insert_anchor_missing'));const player=resolveTimestampPlayer(fd.get('insert_player'),anchor,nextEvents);if(!player)throw new Error(t('timestamp.insert_player_required'));const inserted=buildInsertedTimestampEvent(anchor,player,fd,parsed.seconds);nextEvents=insertActionAfterEvent(nextEvents,anchorId,inserted);nextEvents=applyInsertedResult(nextEvents,inserted,String(fd.get('insert_result')||'none'));changed++;}
 if(!changed){setStatus(t('timestamp.no_changes'));return}const next={...snap,events:nextEvents,updatedAt:new Date().toISOString(),fullState:{...(snap.fullState||snap.state||{})}};upsertMatchArchive(next);if(isCurrent){events=nextEvents;saveEvents(events);persistCurrentEventsIntoArchive();void csv.write(events);render()}setStatus(t('timestamp.saved_count',{count:changed}));},t('common.save'));
 setTimeout(()=>{timestampPreviewScript();wireTimestampTableSorting();wireTimestampInsertPanel(matchEvents)},0)
}

function wireTimestampInsertPanel(matchEvents){const body=$('#dialogBody'),anchorSel=body?.querySelector('[name="insert_after"]'),playerSel=body?.querySelector('[name="insert_player"]'),actionSel=body?.querySelector('[name="insert_action"]'),targetSel=body?.querySelector('[name="insert_target"]'),targetWrap=body?.querySelector('.timestamp-insert-target');if(!anchorSel||!playerSel||!actionSel)return;const update=()=>{const anchor=matchEvents.find(e=>e.id===anchorSel.value),side=String(anchor?.action||'').startsWith('Gegner ')?'opponent':'own',players=anchor?protocolInsertPlayerOptions(anchor,matchEvents):[];playerSel.innerHTML=`<option value="">–</option>${timestampPlayerOptionHtml(players)}`;const a=actionSel.value||'',needs=anchor?needsTarget(side,a):false;if(targetWrap)targetWrap.hidden=!needs;if(targetSel)targetSel.innerHTML=`<option value="">–</option>${needs?timestampTargetOptionsFor(side,a):''}`};anchorSel.addEventListener('change',update);actionSel.addEventListener('change',update);update()}

function clearPending(msg=true){scoutingController.resetCaptureState();if(msg)setStatus(t('status.actionCancelled'));render()}
function ensureActionStarted(){return scoutingController.ensureActionStarted()}
function prepareOwnServePreset(){return scoutingController.prepareOwnServePreset()}
function handleScoutingResultError(result){
 if(result?.ok!==false)return false;
 if(result.reason==='ORIGIN_WRONG_SIDE')setStatus(t('status.originWrongSide'));
 else if(result.reason==='ORIGIN_INVALID')setStatus(t('status.originZoneRange',{max:result.maxZone||6}));
 else if(result.reason==='WHO_INVALID')setStatus(t('status.whoInvalid'));
 else if(result.reason==='WHO_UNASSIGNED')setStatus(`${posLabel(result.pos)} ist keiner Spielerin zugeordnet.`);
 else if(result.reason==='WHO_REQUIRED')setStatus(t('status.whoRequired'));
 else if(result.reason==='ACTION_REQUIRED')setStatus(t('status.actionRequired'));
 else if(result.reason==='TARGET_WRONG_SIDE')setStatus(t('status.targetWrongSide'));
 return true
}
function coreSelectionStatus(result,{whoPos=0,action='',quality=''}={}){
 if(result.type==='ACTION_COMPLETE'&&result.draft)return null;
 if(result.nextStep==='SETDETAIL')return t('scouting.status.set_details');
 if(result.inheritedOrigin&&result.nextStep==='WO')return t('scouting.status.origin_prefilled',{zone:`P${result.pos}`});
 if(result.nextStep==='WO')return t('scouting.status.choose_origin',{quality:state.pendingQuality||quality||'',max:result.maxZone||originMaxZone(state.pendingAction)});
 const missing=[];if(!state.selectedPlayerPos&&!(state.pendingSide==='opponent'&&state.pendingAction==='Aufschlag'&&state.servingSide==='them'))missing.push(t('scouting.who'));if(!state.pendingAction)missing.push(t('scouting.what'));if(!state.pendingQuality)missing.push(t('scouting.how'));
 const selected=[whoPos?`${posLabel(whoPos)} ${t('scouting.who')}`:'',action||'',quality?`${t('scouting.how')} ${quality}`:''].filter(Boolean).join(' · ');
 return `${selected}${selected&&missing.length?' · ':''}${missing.length?t('scouting.status.core_missing',{fields:missing.join(' / ')}):''}`;
}
function selectPosition(side,pos){
 if(playerChangeMode&&playerChangeMode.side===side){choosePlayerChangePosition(side,pos);return}
 ensureManualVideoClockOnScoutingInput();
 const result=scoutingController.selectPosition(side,pos);if(handleScoutingResultError(result))return;
 if(result.type==='ORIGIN_SELECTED'){setStatus(t('status.zoneStored',{zone:posToken(result.pos)}));render();return}
 if(result.type==='ACTION_COMPLETE'&&result.draft){void handleCompletedScoutingAction(result.draft);return}
 setStatus(coreSelectionStatus(result,{whoPos:result.pos})||`${posLabel(result.pos)} als WER gewählt.`);render();
}
function chooseAction(a){ensureManualVideoClockOnScoutingInput();const result=scoutingController.chooseAction(a);if(handleScoutingResultError(result))return;if(result.type==='ACTION_COMPLETE'&&result.draft){void handleCompletedScoutingAction(result.draft);return}setStatus(coreSelectionStatus(result,{action:a})||`${a} gewählt.`);render()}
async function chooseQuality(q){ensureManualVideoClockOnScoutingInput();const result=scoutingController.chooseQuality(q);if(handleScoutingResultError(result))return;if(result.type==='ACTION_COMPLETE'&&result.draft){setStatus(result.immediateServeResult?t('scouting.status.serve_terminal',{side:state.pendingSide==='opponent'?t('common.opponent'):t('common.own'),quality:q}):t('scouting.status.origin_inherited',{zone:`P${result.pos}`}));await handleCompletedScoutingAction(result.draft);return}setStatus(coreSelectionStatus(result,{quality:q})||`${t('scouting.how')} ${q} gewählt.`);render()}
function serveTechniqueLabel(value){return tr(Object.fromEntries(SERVE_TECHNIQUES)[value]||value||'')}
function renderServeDetailPanel(){const el=$('#serveDetailPanel');if(!el)return;const show=state.pendingAction==='Aufschlag'&&detailedCapture(state.pendingSide||activeSide())&&['WIE','WO','TARGET'].includes(state.inputStep);el.hidden=!show;if(!show){el.innerHTML='';return}el.innerHTML=`<div class="set-detail-title">${tr('Aufschlagtechnik')} <span class="detail-optional">optional</span></div><div class="set-detail-buttons compact serve-detail-buttons">${SERVE_TECHNIQUES.map(([v,l])=>`<button type="button" data-serve-technique="${v}" class="${state.serveTechnique===v?'selected':''}">${tr(l)}</button>`).join('')}</div>`;el.querySelectorAll('[data-serve-technique]').forEach(b=>b.onclick=()=>chooseServeTechnique(b.dataset.serveTechnique))}
function chooseServeTechnique(value){scoutingController.chooseServeTechnique(value);setStatus(value?`${serveTechniqueLabel(value)} als Zusatzinformation gesetzt – jetzt WIE auswählen.`:'Aufschlagtechnik bleibt nicht erfasst – jetzt WIE auswählen.');render()}
function renderSetDetailPanel(){const el=$('#setDetailPanel');if(!el)return;const show=state.pendingAction==='Zuspiel'&&detailedCapture(state.pendingSide||activeSide())&&['SETDETAIL','WO','TARGET'].includes(state.inputStep);el.hidden=!show;if(!show){el.innerHTML='';return}el.innerHTML=`<div class="set-detail-title">Zuspiel detailliert</div><div class="set-detail-group"><span>Passhöhe / Tempo</span><div class="set-detail-buttons">${SET_TEMPOS.map(([v,l])=>`<button type="button" data-set-tempo="${v}" class="${state.setTempo===v?'selected':''}">${l}</button>`).join('')}</div></div><div class="set-detail-group"><span>Passweite / Richtung</span><div class="set-detail-buttons compact">${SET_DISTANCES.map(([v,l])=>`<button type="button" data-set-distance="${v}" class="${state.setDistance===v?'selected':''}">${l}</button>`).join('')}</div></div>`;el.querySelectorAll('[data-set-tempo]').forEach(b=>b.onclick=()=>chooseSetDetail('tempo',b.dataset.setTempo));el.querySelectorAll('[data-set-distance]').forEach(b=>b.onclick=()=>chooseSetDetail('distance',b.dataset.setDistance))}
function chooseSetDetail(kind,value){const result=scoutingController.chooseSetDetail(kind,value);if(result.type==='ACTION_COMPLETE'&&result.draft){void handleCompletedScoutingAction(result.draft);return}if(result.type==='SET_DETAILS_COMPLETE')setStatus(result.inheritedOrigin?t('scouting.status.origin_prefilled',{zone:`P${result.pos}`}):t('scouting.status.set_origin'));render()}
function chooseTargetZone(side,pos){const result=scoutingController.selectTargetZone(side,pos);if(result?.reason==='NOT_TARGET_STEP'||result?.reason==='TARGET_INVALID')return;if(handleScoutingResultError(result))return;if(result.type==='ACTION_COMPLETE'&&result.draft)void handleCompletedScoutingAction(result.draft)}

async function handleCompletedScoutingAction(draft){if(!draft)return;const {side,action,quality}=draft,autoWinner=automaticPointFor(side,action,quality),transactionId=newId('tx');const knownBallZone=+draft.targetZone||((action==='Annahme')?+draft.originZone:0),knownBallSide=draft.targetZone?(draft.targetSide||''):(knownBallZone?side:'');state.rallyBallZone=knownBallZone;state.rallyBallSide=knownBallSide;if(side==='opponent')await logOpponent(action,quality,draft,transactionId);else await logOwn(action,quality,draft,transactionId);if(autoWinner)await award(autoWinner,`${action} ${quality}`,true,false,transactionId,true)}
async function commitPendingAction(allowServeErrorWithoutZone=false){return handleCompletedScoutingAction(scoutingController.buildActionDraft({allowServeErrorWithoutZone}))}

const rallyController=createRallyController({getState:()=>state,newId});
function ensureActiveRally(){return rallyController.ensureActiveRally()}
function nextRallyMeta(kind='action'){return rallyController.nextRallyMeta(kind)}
function closeActiveRally(){return rallyController.closeActiveRally()}
function resetCurrentScouting(){
 const kept={quickScout:state.quickScout,quickOwnName:state.quickOwnName,quickOppName:state.quickOppName,quickPlayers:{...(state.quickPlayers||{})},matchDate:state.matchDate,seasonId:state.seasonId,ownTeamId:state.ownTeamId,oppTeamId:state.oppTeamId,matchTypeId:state.matchTypeId,matchTypeName:state.matchTypeName,matchMode:state.matchMode,fixedSetCount:state.fixedSetCount,fixedFinalSetTarget:state.fixedFinalSetTarget,ownQualityProfile:state.ownQualityProfile,opponentQualityProfile:state.opponentQualityProfile,opponentCapture:state.opponentCapture,allowPositionOnly:state.allowPositionOnly,autoRotate:state.autoRotate,matchId:state.matchId||newId('match')};
 events=[];redoStack=[];
 Object.assign(state,{...kept,setNo:1,setWinsUs:0,setWinsThem:0,firstSetServing:'',setReady:false,matchComplete:false,scoreUs:0,scoreThem:0,rotationIndex:0,oppRotationIndex:0,ownLineup:{},oppLineup:{},ownBaseLineup:{},oppBaseLineup:{},setLineupsOwn:{},setLineupsOpp:{},currentLiberosOwn:[],currentLiberosOpp:[],setLiberosOwn:{},setLiberosOpp:{},selectedPos:0,selectedOppPos:0,pendingSide:null,pendingAction:null,pendingQuality:null,servingSide:'',localClockRunning:false,localClockStartedAt:0,localClockElapsed:0,sessionStartedAt:0,activeTeamContext:'own',syncGeneration:Number(state.syncGeneration||0)+1,currentRallyId:'',currentRallyNo:0,currentRallySeq:0,rallyCounter:0,rallyHighWater:0,rallyStartServing:'',currentRallyPhase:'',currentTransitionNo:1,lastActionSide:'',lastActionName:'',rallyBallZone:0,rallyBallSide:'',inputStep:'WER',selectedPlayerId:'',selectedPlayerPos:0,actionZone:0,targetZone:0,targetSide:'',actionStartedSeconds:null,actionStartedAt:'',setTempo:'',setDistance:'',serveTechnique:'',autoServePreset:false});
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
async function award(who,source='',auto=false,forceSideout=false,transactionId='',terminalResult=false){
 if(!pointAwardReady(terminalResult)){setStatus(t('status.prepareSetServe'));return}
 const transition=scorePointTransition({winner:who,scoreUs:state.scoreUs,scoreThem:state.scoreThem,servingSide:state.servingSide,forceSideout});const before=transition.servingBefore,isSideout=transition.sideout;const groupId=transactionId||newId('tx');const rallyMeta=nextRallyMeta('result');state.scoreUs=transition.scoreUs;state.scoreThem=transition.scoreThem;state.servingSide=transition.servingAfter;
 const setWinner=winningSideForScore();
 await appendEvent('','',who==='us'?'Punkt wir':'Punkt Gegner',auto?'auto':'manuell',source,{event_type:'rally_result',rally_winner:who,rally_result:who,action_quality:'',action_effect:'',serving_before:before||'',serving_after:who,sideout:isSideout?'1':'0',event_group:groupId,transaction_id:groupId,set_wins_us:String(state.setWinsUs),set_wins_them:String(state.setWinsThem),...rallyMeta});
 if(isSideout&&state.autoRotate&&!setWinner)await rotate(1,true,who==='us'?'own':'opponent',groupId);
 closeActiveRally();if(!setWinner&&who==='us')prepareOwnServePreset();persist();render();if(setWinner)await finishSet(setWinner,groupId);else setStatus(`Rally ${rallyMeta.rally_no} beendet · Punkt ${who==='us'?'Wir':'Gegner'}.`)
}
function rallyContextForAction(side,action=''){return rallyController.contextForAction(side,action)}
function markActionSide(side,action=''){return rallyController.markActionSide(side,action)}
async function logOwn(action,value,draft=null,transactionId=''){
 const pid=draft?.playerId??state.selectedPlayerId??'',source=draft?.playerPosition??state.selectedPlayerPos,zone=draft?.originZone??state.actionZone,target=draft?.targetZone??state.targetZone;if(!pid&&!state.allowPositionOnly){setStatus(`${posLabel(source)} ist keiner Spielerin zugeordnet.`);return}
 const groupId=transactionId||newId('tx'),ctx=rallyContextForAction('own',action),rallyMeta=nextRallyMeta('action'),abbr=pid?playerLabel(pid):'',full=pid?playerFull(pid):'';
 const extra=buildPlayerActionExtra({side:'own',playerId:pid,playerAbbreviation:abbr,playerName:full,playerPosition:source,originZone:zone,targetZone:target,targetSide:draft?.targetSide??state.targetSide,action,serveTechnique:draft?.serveTechnique??state.serveTechnique,setTempo:draft?.setTempo??state.setTempo,setDistance:draft?.setDistance??state.setDistance,qualityLevel:qualityLevel(value,action),qualityProfile:draft?.qualityProfile||qualityProfileForSide('own'),eventGroup:groupId,transactionId:groupId,actionStartedSeconds:draft?.actionStartedSeconds??state.actionStartedSeconds,actionStartedAt:draft?.actionStartedAt??state.actionStartedAt,context:ctx,rallyMeta});
 await appendEvent(source,playerLabel(pid),action,value,$('#noteInput').value.trim(),extra);markActionSide('own',action);clearPending(false);setStatus(`${posLabel(source)} · ${action} · ${value} · ${posToken(zone)}${target?` → ${posToken(target)}`:''} protokolliert · Rally ${rallyMeta.rally_no} läuft.`)
}
async function logOpponent(action,value,draft=null,transactionId=''){
 const pid=draft?.playerId??state.selectedPlayerId??'',source=draft?.playerPosition??state.selectedPlayerPos,zone=draft?.originZone??state.actionZone,target=draft?.targetZone??state.targetZone;
 const groupId=transactionId||newId('tx'),ctx=rallyContextForAction('opponent',action),rallyMeta=nextRallyMeta('action'),abbr=pid?playerLabel(pid):'',full=pid?playerFull(pid):'';
 const extra=buildPlayerActionExtra({side:'opponent',playerId:pid,playerAbbreviation:abbr,playerName:full,playerPosition:source,originZone:zone,targetZone:target,targetSide:draft?.targetSide??state.targetSide,action,serveTechnique:draft?.serveTechnique??state.serveTechnique,setTempo:draft?.setTempo??state.setTempo,setDistance:draft?.setDistance??state.setDistance,qualityLevel:qualityLevel(value,action),qualityProfile:draft?.qualityProfile||qualityProfileForSide('opponent'),eventGroup:groupId,transactionId:groupId,actionStartedSeconds:draft?.actionStartedSeconds??state.actionStartedSeconds,actionStartedAt:draft?.actionStartedAt??state.actionStartedAt,context:ctx,rallyMeta});
 await appendEvent(source,playerLabel(pid),`Gegner ${action}`,value,'Gegner',extra);markActionSide('opponent',action);clearPending(false);setStatus(`Gegner ${posLabel(source)} · ${action} · ${value} · ${posToken(zone)}${target?` → ${posToken(target)}`:''} protokolliert · Rally ${rallyMeta.rally_no} läuft.`)
}
async function finishOpponentAttack(target){const result=scoutingController.selectTargetZone(targetSideFor(state.pendingSide,state.pendingAction),target);return result?.draft?handleCompletedScoutingAction(result.draft):undefined}

async function rotate(dir=1,log=true,side=null,eventGroup=''){
 if(!matchConfigured()){setStatus(t('status.configureMatchFirst'));return}
 side=side||activeSide();const own=side==='own';
 const rotationState=rotationTransition({lineup:lineupForSide(side),rotationIndex:rotationIndexForSide(side),dir});
 // I–VI/P1–P6 sind feste Feldpositionen. Nur Spieler-ID, Trikotnummer und Name wandern.
 if(own){state.ownLineup=rotationState.lineupAfter;state.rotationIndex=rotationState.indexAfter}else{state.oppLineup=rotationState.lineupAfter;state.oppRotationIndex=rotationState.indexAfter}
 persist();render();
 if(log)await appendEvent('','',`${own?'':'Gegner '}${dir>0?'Rotation weiter':'Rotation zurück'}`,ROT[rotationState.indexAfter],'',{rotation_side:side,rotation_index_before:String(rotationState.indexBefore),rotation_index_after:String(rotationState.indexAfter),lineup_before:JSON.stringify(rotationState.lineupBefore),lineup_after:JSON.stringify(rotationState.lineupAfter),event_group:eventGroup||newId('grp')});
 setStatus(t('status.rotationChanged',{side:t(own?'status.ownTeam':'status.opponentTeam'),rotation:ROT[rotationState.indexAfter],direction:t(dir>0?'status.rotationForward':'status.rotationBack')}))
}
async function sideout(){await award('us','Side-out manuell',false,true)}
async function finishSet(winner,eventGroup=''){
 const finished=state.setNo,finalScore=`${state.scoreUs}:${state.scoreThem}`;
 const setWins=setWinTransition({winner,setWinsUs:state.setWinsUs,setWinsThem:state.setWinsThem});state.setWinsUs=setWins.setWinsUs;state.setWinsThem=setWins.setWinsThem;
 const clockWarning=await stopLiveTimeAtBoundary();
 await appendEvent('','', 'Satzende', `${winner==='us'?'Wir':'Gegner'} ${finalScore}`,'',{event_type:'set_end',set_winner:winner,set_wins_us:String(state.setWinsUs),set_wins_them:String(state.setWinsThem),event_group:eventGroup||newId('grp')});
 if(isMatchFinishedAfterSet(finished,state.setWinsUs,state.setWinsThem)){Object.assign(state,matchFinishedTransition());persist();render();setStatus(`Spiel beendet · Sätze ${state.setWinsUs}:${state.setWinsThem}. Livezeit gestoppt.${clockWarning}`);return}
 Object.assign(state,nextSetTransition({finishedSet:finished}));state.fieldOrientation=highlightedFieldIsTop()?'activeBottom':'activeTop';closeActiveRally();persist();render();setStatus(`Satz ${finished} beendet · Sätze ${state.setWinsUs}:${state.setWinsThem}. Livezeit gestoppt · Startaufstellung für Satz ${state.setNo} festlegen.${clockWarning}`);setTimeout(()=>startSetSetup(),180)
}
function setLiberosForSide(side){return side==='opponent'?(state.currentLiberosOpp||[]):(state.currentLiberosOwn||[])}
function setLineupAndLiberos(side,lineup,liberos){
 const lineupTransition=setLineupTransition({side,lineup,liberos,setNo:state.setNo}),key=String(state.setNo);
 if(side==='own'){
  Object.assign(state,{ownLineup:lineupTransition.ownLineup,ownBaseLineup:lineupTransition.ownBaseLineup,currentLiberosOwn:lineupTransition.currentLiberosOwn,rotationIndex:lineupTransition.rotationIndex});state.setLineupsOwn[key]=lineupTransition.setLineupsOwn.lineup;state.setLiberosOwn[key]=lineupTransition.setLiberosOwn.liberos;
 }else{
  Object.assign(state,{oppLineup:lineupTransition.oppLineup,oppBaseLineup:lineupTransition.oppBaseLineup,currentLiberosOpp:lineupTransition.currentLiberosOpp,oppRotationIndex:lineupTransition.oppRotationIndex});state.setLineupsOpp[key]=lineupTransition.setLineupsOpp.lineup;state.setLiberosOpp[key]=lineupTransition.setLiberosOpp.liberos;
 }
}
function startSetSetup(){
 if(!matchConfigured()){setStatus(t('status.configureMatchFirst'));return}
 if(state.matchComplete){setStatus(t('status.matchAlreadyEnded'));return}
 if(state.quickScout){Object.assign(state,beginSetSetupTransition({quickScout:true,ownLineup:quickLineup('own'),oppLineup:quickLineup('opponent')}));closeActiveRally();persist();render();completeSetStart();return}
 // Die Satzvorbereitung arbeitet vollständig auf einer temporären Kopie. Erst nach
 // Abschluss aller benötigten Dialoge wird der Spielzustand verändert.
 const snapshot={
  ownLineup:{...state.ownLineup},oppLineup:{...state.oppLineup},
  ownLiberos:[...(state.currentLiberosOwn||state.setLiberosOwn?.[String(state.setNo)]||[])],
  oppLiberos:[...(state.currentLiberosOpp||state.setLiberosOpp?.[String(state.setNo)]||[])],
  setReady:state.setReady,servingSide:state.servingSide,rotationIndex:state.rotationIndex,oppRotationIndex:state.oppRotationIndex
 };
 const draft={ownLineup:{...snapsholineupTransition.ownLineup},oppLineup:{...snapsholineupTransition.oppLineup},ownLiberos:[...snapshot.ownLiberos],oppLiberos:[...snapshot.oppLiberos]};
 const cancelSetup=()=>{setStatus(`Satz ${state.setNo}: Vorbereitung abgebrochen · vorhandene Aufstellung unverändert.`)};
 editLineup('own',result=>{
  draflineupTransition.ownLineup={...result.lineup};draft.ownLiberos=[...result.liberos];
  if(state.opponentCapture&&state.oppTeamId){
   setStatus(t('status.opponentLineupTitle',{set:state.setNo}));
   setTimeout(()=>editLineup('opponent',oppResult=>{draflineupTransition.oppLineup={...oppResult.lineup};draft.oppLiberos=[...oppResult.liberos];commitSetSetupDraft(draft)}, {draftOnly:true,lineup:draflineupTransition.oppLineup,liberos:draft.oppLiberos,onCancel:cancelSetup}),40)
  }else commitSetSetupDraft(draft)
 }, {draftOnly:true,lineup:draflineupTransition.ownLineup,liberos:draft.ownLiberos,onCancel:cancelSetup})
}
function commitSetSetupDraft(draft){
 state.setReady=false;state.rotationIndex=0;state.oppRotationIndex=0;state.servingSide='';closeActiveRally();playerChangeMode=null;
 setLineupAndLiberos('own',draflineupTransition.ownLineup,draft.ownLiberos);
 if(state.opponentCapture)setLineupAndLiberos('opponent',draflineupTransition.oppLineup,draft.oppLiberos);else{state.oppLineup={};state.oppBaseLineup={};state.currentLiberosOpp=[]}
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
 if(!matchConfigured()||state.matchComplete||!lineupHasPlayers(side)){setStatus(t('status.activeLineupRequired'));return}
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
 await csv.write(events);persist();render();setStatus(t(removed.length>1?'status.undoMany':'status.undoOne'))
}
async function redo(){
 if(!redoStack.length)return;
 const batch=redoStack.pop();events=restoreEventBatch(events,batch);reconstruct(events);
 await csv.write(events);persist();render();setStatus(t(batch.length>1?'status.redoMany':'status.redoOne'))
}

function updateOverlayUiState(){const open=!$('#drawerBackdrop')?.hidden||!$('#dialogBackdrop')?.hidden||!$('#tourOverlay')?.hidden;document.body.classList.toggle('overlay-open',!!open)}
function openDrawer(view='match',{resetHistory=false,fromBack=false}={}){const backdrop=$('#drawerBackdrop'),body=$('#drawerBody');const wasHidden=backdrop.hidden,current=body?.dataset.activeView||'';if(wasHidden||resetHistory)drawerHistory=[];else if(!fromBack&&current&&current!==view)drawerHistory.push(current);backdrop.hidden=false;body?.replaceChildren();body?.setAttribute('data-active-view',view);const topGroup={players:'prep',teams:'prep',seasons:'prep',rosters:'prep',matchtypes:'prep',camera:'prep',videoassignments:'prep',sync:'settings',videocut:'settings',shortcuts:'settings',about:'settings'}[view]||view;$$('#drawerNav [data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view===topGroup));const map={match:t('nav.match'),prep:t('nav.prep'),players:t('drawer.players'),teams:t('drawer.teams'),seasons:t('drawer.seasons'),rosters:t('drawer.rosters'),matchtypes:t('drawer.matchTypes'),data:t('nav.data'),camera:t('drawer.camera'),videoassignments:t('drawer.videoAssignments'),sync:t('drawer.sync'),videocut:t('drawer.videoCut'),shortcuts:t('drawer.shortcuts'),about:t('drawer.about'),analysis:t('nav.analysis'),help:t('nav.help'),settings:t('nav.settings')};$('#drawerTitle').textContent=map[view]||t('drawer.menu');const back=$('#drawerBack');if(back){back.hidden=drawerHistory.length===0;back.disabled=drawerHistory.length===0}const draw={match:drawMatch,prep:drawPreparation,players:drawPlayers,teams:drawTeams,seasons:drawSeasons,rosters:drawRosters,matchtypes:drawMatchTypes,data:drawData,camera:drawCamera,videoassignments:drawVideoAssignments,sync:drawSync,videocut:drawVideoCutSettings,shortcuts:drawShortcutSettings,about:drawAbout,analysis:()=>analysisController.draw(),help:()=>drawHelp(),settings:drawSettings}[view];if(draw)draw();updateOverlayUiState()}
function drawerBack(){const previous=drawerHistory.pop();if(!previous)return;openDrawer(previous,{fromBack:true})}
function closeDrawer(){matchEditorOpen=false;matchEditorMode='';drawerHistory=[];$('#drawerBackdrop').hidden=true;updateOverlayUiState()}
function modal(title,html,onSubmit,ok=null,onCancel=null,cancelLabel=null){$('#dialogTitle').textContent=title;$('#dialogBody').innerHTML=html;$('#dialogOk').textContent=ok||t('common.apply');const cancelBtn=$('#dialogCancel');if(cancelBtn){cancelBtn.textContent=cancelLabel||t('common.cancel');cancelBtn.onclick=()=>closeModal()}modalSubmit=onSubmit;modalCancel=onCancel;$('#dialogBackdrop').hidden=false;updateOverlayUiState();setTimeout(()=>$('#dialogBody input, #dialogBody select')?.focus(),20)}
function closeModal(runCancel=true){const cancel=modalCancel;$('#dialogBackdrop').hidden=true;modalSubmit=null;modalCancel=null;updateOverlayUiState();if(runCancel&&cancel)cancel()}
const opts=(rows,sel='',label=x=>x.name)=>rows.map(x=>`<option value="${x.id}" ${x.id===sel?'selected':''}>${esc(label(x))}</option>`).join('');


function drawPreparation(){const b=$('#drawerBody');b.innerHTML=`
<div class="card"><h3>${t('prep.masterRoster')}</h3><p class="small">${t('prep.masterRosterDesc')}</p><div class="settings-links preparation-links"><button id="prepPlayers">👥 ${t('prep.players')}</button><button id="prepTeams">🛡️ ${t('prep.teams')}</button><button id="prepSeasons">📅 ${t('prep.seasons')}</button><button id="prepRosters">📋 ${t('prep.rosters')}</button></div></div>
<div class="card"><h3>${t('prep.cameraVideo')}</h3><p class="small">${t('prep.cameraVideoDesc')}</p><div class="settings-links preparation-links"><button id="prepCamera">📷 ${t('prep.camera')}</button><button id="prepVideo" ${state.matchId?'':'disabled'}>🎬 ${t('prep.videoAssignments')}</button></div>${state.matchId?'':`<p class="small">${t('prep.videoUnavailable')}</p>`}</div>
<div class="card small"><strong>${t('prep.newbieTipTitle')}</strong> ${t('prep.newbieTip')}</div>`;
$('#prepPlayers').onclick=()=>openDrawer('players');$('#prepTeams').onclick=()=>openDrawer('teams');$('#prepSeasons').onclick=()=>openDrawer('seasons');$('#prepRosters').onclick=()=>openDrawer('rosters');$('#prepCamera').onclick=()=>openDrawer('camera');if($('#prepVideo'))$('#prepVideo').onclick=()=>{if(!state.matchId){setStatus(t('prep.startMatchFirst'));return}openDrawer('videoassignments')}
}
function drawPlayers(){const b=$('#drawerBody'),sort=settings.ui.playersTableSort||{key:'abbreviation',direction:'asc'},coll=new Intl.Collator(settings.ui?.language||'de',{numeric:true,sensitivity:'base'});const showInactive=!!settings.ui?.showInactivePlayers,rows=[...master.players].filter(p=>showInactive||p.active!==false).sort((a,b)=>{let av='',bv='';if(sort.key==='name'){av=`${a.firstName||''} ${a.lastName||''}`;bv=`${b.firstName||''} ${b.lastName||''}`}else if(sort.key==='jersey'){const an=/^\d+$/.test(String(a.defaultJersey||'').trim())?Number(a.defaultJersey):Number.POSITIVE_INFINITY,bn=/^\d+$/.test(String(b.defaultJersey||'').trim())?Number(b.defaultJersey):Number.POSITIVE_INFINITY;if(an!==bn)return (an-bn)*(sort.direction==='desc'?-1:1);av=String(a.defaultJersey||'');bv=String(b.defaultJersey||'')}else{av=String(a.abbreviation||'');bv=String(b.abbreviation||'')}const cmp=coll.compare(av,bv)||coll.compare(String(a.abbreviation||''),String(b.abbreviation||''))||coll.compare(String(a.firstName||''),String(b.firstName||''))||coll.compare(String(a.lastName||''),String(b.lastName||''));return cmp*(sort.direction==='desc'?-1:1)});const head=(label,key)=>`<button type="button" class="table-sort${sort.key===key?' active':''}" data-player-sort="${key}" aria-label="${t('players.sortAria',{label})}">${label}<span aria-hidden="true">${sort.key===key?(sort.direction==='asc'?'▲':'▼'):'↕'}</span></button>`;b.innerHTML=`<div class="drawer-subnav"><button class="primary" type="button">${t('players.title')}</button><button id="openRosterFromPlayers" type="button">📋 ${t('prep.rosters')}</button></div><div class="toolbar"><button class="primary" id="addPlayer">${t('players.add')}</button><button id="toggleInactivePlayers">${showInactive?t('players.hideInactive'):t('players.showInactive')}</button></div><table class="data-table"><thead><tr><th>${head(t('players.abbreviation'),'abbreviation')}</th><th>${head(t('players.name'),'name')}</th><th>${head(t('players.number'),'jersey')}</th><th>${t('players.position')}</th><th>${t('players.status')}</th><th></th></tr></thead><tbody>${rows.map(p=>`<tr class="${p.active===false?'inactive':''}" data-id="${p.id}"><td>${esc(p.abbreviation)}</td><td>${esc(p.firstName)} ${esc(p.lastName)}</td><td>${esc(p.defaultJersey||'')}</td><td>${esc(p.defaultRole||'')}</td><td>${p.active===false?t('players.inactive'):t('players.active')}</td><td><button data-edit>✎</button> <button data-toggle>${p.active===false?'↺':'⏸'}</button></td></tr>`).join('')}</tbody></table>`;$('#openRosterFromPlayers').onclick=()=>openDrawer('rosters');$('#addPlayer').onclick=()=>editPlayer();$('#toggleInactivePlayers').onclick=()=>{settings.ui={...(settings.ui||{}),showInactivePlayers:!showInactive};saveSettings(settings);drawPlayers()};b.querySelectorAll('[data-player-sort]').forEach(btn=>btn.onclick=()=>{const key=btn.dataset.playerSort;settings.ui.playersTableSort={key,direction:sort.key===key&&sort.direction==='asc'?'desc':'asc'};saveSettings(settings);drawPlayers()});b.querySelectorAll('[data-edit]').forEach(x=>x.onclick=()=>editPlayer(x.closest('tr').dataset.id));b.querySelectorAll('[data-toggle]').forEach(x=>x.onclick=()=>{const p=player(x.closest('tr').dataset.id);p.active=p.active===false;Object.assign(p,touched(p));persist();drawPlayers()})}
function suggestedAbbreviation(first,last,excludeId=''){
 const f=String(first||'').trim().replace(/[^\p{L}\p{N}]/gu,''),l=String(last||'').trim().replace(/[^\p{L}\p{N}]/gu,'');if(!f&&!l)return '';
 const candidates=[];const push=v=>{v=String(v||'').toUpperCase();if(v&&!candidates.includes(v))candidates.push(v)};
 push((f[0]||'')+(l[0]||''));for(let n=2;n<=Math.min(6,l.length);n++)push((f[0]||'')+l.slice(0,n));for(let n=2;n<=Math.min(4,f.length);n++)push(f.slice(0,n)+(l[0]||''));push((f+l).slice(0,8));
 const used=new Set(master.players.filter(x=>x.id!==excludeId).map(x=>String(x.abbreviation||'').toUpperCase()));return candidates.find(x=>!used.has(x))||`${(f[0]||'X')}${(l[0]||'X')}${master.players.length+1}`.slice(0,8)
}
function editPlayer(id){
 const p=id?player(id):{id:newId('plr'),firstName:'',lastName:'',abbreviation:'',defaultJersey:'',defaultRole:'',active:true,revision:0};
 modal(t(id?'form.playerEdit':'form.playerCreate'),`<p class="save-hint">${t('form.saveHint')}</p><label>${t('form.firstName')} <input name="first" value="${esc(p.firstName)}" required></label><label>${t('form.lastName')} <input name="last" value="${esc(p.lastName)}" required></label><label>${t('form.abbreviation')} <input name="abbr" value="${esc(p.abbreviation)}" required maxlength="8"><small class="abbr-hint">${t('form.abbreviationHint')}</small></label><label>${t('form.defaultNumber')} <input name="jersey" value="${esc(p.defaultJersey||'')}"></label><label>${t('form.defaultPosition')} <input name="role" value="${esc(p.defaultRole||'')}"></label>`,fd=>{const ab=fd.get('abbr').trim().toUpperCase();if(master.players.some(x=>x.id!==p.id&&String(x.abbreviation||'').toUpperCase()===ab))throw new Error(t('form.abbreviationTaken'));const oldJersey=String(p.defaultJersey||'').trim(),newJersey=fd.get('jersey').trim();Object.assign(p,touched(p),{firstName:fd.get('first').trim(),lastName:fd.get('last').trim(),abbreviation:ab,defaultJersey:newJersey,defaultRole:fd.get('role').trim().toUpperCase()});if(!id)master.players.push(p);else if(oldJersey!==newJersey){for(const r of [...(master.seasonRosters||[]),...(master.matchRosters||[])])if(r.playerId===p.id){r.jersey=newJersey;Object.assign(r,touched(r))}}persist();render();drawPlayers()},t('common.save'));
 setTimeout(()=>{const first=$('#dialogBody input[name="first"]'),last=$('#dialogBody input[name="last"]'),abbr=$('#dialogBody input[name="abbr"]');if(!first||!last||!abbr)return;let manualAbbreviation=false;const initialFirst=first.value,initialLast=last.value;const update=()=>{const nameChanged=first.value!==initialFirst||last.value!==initialLast;if((!id||nameChanged)&&!manualAbbreviation)abbr.value=suggestedAbbreviation(first.value,last.value,p.id)};first.addEventListener('input',update);last.addEventListener('input',update);abbr.addEventListener('input',()=>{manualAbbreviation=true});if(!id)update()},0)
}
function drawTeams(){const b=$('#drawerBody');b.innerHTML=`<div class="toolbar"><button class="primary" id="addTeam">${t('teams.add')}</button></div><table class="data-table"><thead><tr><th>${t('teams.name')}</th><th>${t('teams.type')}</th><th>${t('teams.logging')}</th><th>${t('common.status')}</th><th></th></tr></thead><tbody>${master.teams.map(teamRow=>`<tr class="${teamRow.active===false?'inactive':''}" data-id="${teamRow.id}"><td>${esc(teamRow.name)}</td><td>${teamRow.kind==='own'?t('teams.own'):t('teams.opponent')}</td><td>${normalizeQualityProfile(teamRow.qualityProfile)==='datavolley_6'?t('teams.detail'):t('teams.basic')}</td><td>${teamRow.active===false?t('players.inactive'):t('players.active')}</td><td><button data-edit>✎</button> <button data-toggle>${teamRow.active===false?'↺':'⏸'}</button></td></tr>`).join('')}</tbody></table>`;$('#addTeam').onclick=()=>editTeam();b.querySelectorAll('[data-edit]').forEach(x=>x.onclick=()=>editTeam(x.closest('tr').dataset.id));b.querySelectorAll('[data-toggle]').forEach(x=>x.onclick=()=>{const teamRow=team(x.closest('tr').dataset.id);teamRow.active=teamRow.active===false;Object.assign(teamRow,touched(teamRow));persist();drawTeams()})}
function editTeam(id){const teamRecord=id?team(id):{id:newId('team'),name:'',kind:'own',qualityProfile:'basic_5',active:true,revision:0};modal(t(id?'form.teamEdit':'form.teamCreate'),`<label>${t('common.name')} <input name="name" value="${esc(teamRecord.name)}" required></label><label>${t('form.kind')} <select name="kind"><option value="own" ${teamRecord.kind==='own'?'selected':''}>${t('teams.own')}</option><option value="opponent" ${teamRecord.kind==='opponent'?'selected':''}>${t('teams.opponent')}</option></select></label><label>${t('form.defaultScouting')} <select name="qualityProfile"><option value="basic_5" ${normalizeQualityProfile(teamRecord.qualityProfile)==='basic_5'?'selected':''}>${t('teams.basic')}</option><option value="datavolley_6" ${normalizeQualityProfile(teamRecord.qualityProfile)==='datavolley_6'?'selected':''}>${t('teams.detail')}</option></select></label>`,fd=>{Object.assign(teamRecord,touched(teamRecord),{name:fd.get('name').trim(),kind:fd.get('kind'),qualityProfile:normalizeQualityProfile(fd.get('qualityProfile'))});if(!id)master.teams.push(teamRecord);persist();drawTeams()})}
function drawSeasons(){const b=$('#drawerBody');b.innerHTML=`<div class="toolbar"><button class="primary" id="addSeason">${t('seasons.add')}</button></div><table class="data-table"><thead><tr><th>${t('seasons.title')}</th><th>${t('seasons.from')}</th><th>${t('seasons.to')}</th><th>${t('common.status')}</th><th></th></tr></thead><tbody>${master.seasons.map(s=>`<tr class="${s.active===false?'inactive':''}" data-id="${s.id}"><td>${esc(s.name)}</td><td>${esc(s.startDate||'')}</td><td>${esc(s.endDate||'')}</td><td>${s.active===false?t('players.inactive'):t('players.active')}</td><td><button data-edit>✎</button> <button data-toggle>${s.active===false?'↺':'⏸'}</button></td></tr>`).join('')}</tbody></table>`;$('#addSeason').onclick=()=>editSeason();b.querySelectorAll('[data-edit]').forEach(x=>x.onclick=()=>editSeason(x.closest('tr').dataset.id));b.querySelectorAll('[data-toggle]').forEach(x=>x.onclick=()=>{const s=season(x.closest('tr').dataset.id);s.active=s.active===false;Object.assign(s,touched(s));persist();drawSeasons()})}
function editSeason(id){const s=id?season(id):{id:newId('season'),name:'',startDate:'',endDate:'',active:true,revision:0};modal(t(id?'form.seasonEdit':'form.seasonCreate'),`<label>${t('form.label')} <input name="name" value="${esc(s.name)}" required></label><label>${t('form.start')} <input type="date" name="start" value="${esc(s.startDate||'')}"></label><label>${t('form.end')} <input type="date" name="end" value="${esc(s.endDate||'')}"></label>`,fd=>{Object.assign(s,touched(s),{name:fd.get('name').trim(),startDate:fd.get('start'),endDate:fd.get('end')});if(!id)master.seasons.push(s);persist();drawSeasons()})}

function selectedMatchType(id){return master.matchTypes.find(x=>x.id===id&&x.active!==false)||null}
async function changeMatchTypeFromUi(value){
 if(value==='__quick__'){
  if(!state.quickScout)await startQuickScout();
  return;
 }
 const mt=matchType(value)||master.matchTypes.find(x=>x.active!==false&&String(x.name||'')===String(value));if(!mt)return;
 if(state.quickScout){
  if(events.length&&!confirm(t('form.quickDiscardConfirm'))){drawMatch();return}
  events=[];await csv.write(events);
  state.quickScout=false;state.quickPlayers={};state.allowPositionOnly=false;state.setReady=false;state.ownLineup={};state.oppLineup={};state.ownBaseLineup={};state.oppBaseLineup={};state.setLineupsOwn={};state.setLineupsOpp={};state.matchId=newId('match');
 }
 state.matchTypeId=mt.id;state.matchTypeName=mt.name;saveState(state);render();drawMatch();setStatus(t('form.regularActive'));
}

function localLibraryMatches(){const rows=loadMatchArchive();return rows.map(m=>({...m,_local:true,_cloud:false,status:m.matchId===state.matchId?(state.matchComplete?'ended':'active'):(m.status==='active'?'interrupted':m.status||'interrupted')}))}
function mergedMatchLibrary(){const map=new Map();for(const m of cloudMatchLibrary||[])if(m?.matchId)map.set(m.matchId,{...m,_cloud:true,_local:false,_cloudMeta:{...m}});for(const m of localLibraryMatches()){const prev=map.get(m.matchId)||{};map.set(m.matchId,{...prev,...m,_cloud:!!prev.matchId,_local:true,_cloudMeta:prev._cloudMeta||null,_localMeta:{...m}})}return [...map.values()].sort((a,b)=>String(b.updatedAt||b.matchDate||'').localeCompare(String(a.updatedAt||a.matchDate||'')))}
function matchStatusLabel(m){return m.status==='ended'?t('library.ended'):m.status==='active'?t('library.active'):t('library.interrupted')}
function timestampMs(value){const ms=Date.parse(String(value||''));return Number.isFinite(ms)?ms:0}
function cloudIsNewer(m){return !!(m?._cloud&&m?._local&&timestampMs(m._cloudMeta?.updatedAt)>timestampMs(m._localMeta?.updatedAt||m.updatedAt))}
function localDeviceIcon(status=''){return `<span class="library-device-icon ${status}" title="${esc(t('library.onDevice'))}" aria-label="${esc(t('library.onDevice'))}"></span>`}
function libraryAvailability(m){const newer=cloudIsNewer(m),same=!!(m._cloud&&m._local&&!newer&&timestampMs(m._cloudMeta?.updatedAt)===timestampMs(m._localMeta?.updatedAt||m.updatedAt));const syncClass=newer?'sync-newer':same?'sync-equal':'sync-present';const cloudTitle=newer?t('library.cloudNewer'):t('library.cloud');return `${m._cloud?`<span class="library-cloud-icon ${syncClass}" title="${esc(cloudTitle)}" aria-label="${esc(t('library.cloud'))}">☁</span>`:''}${m._local?localDeviceIcon(newer?'sync-stale':same?'sync-equal':'sync-present'):''}`}
function matchScoreText(m){const st=m.fullState||m.state||m;if(m.status==='ended')return t('library.sets',{us:Number(st.setWinsUs||0),them:Number(st.setWinsThem||0)});return `${t('library.set',{set:Number(st.setNo||1)})} · ${Number(st.scoreUs||0)}:${Number(st.scoreThem||0)} · ${t('library.sets',{us:Number(st.setWinsUs||0),them:Number(st.setWinsThem||0)})}`}
function matchNames(m){const own=m.ownTeamName||team(m.ownTeamId)?.name||m.fullState?.quickOwnName||t('library.ownFallback'),opp=m.oppTeamName||team(m.oppTeamId)?.name||m.fullState?.quickOppName||t('library.opponentFallback');return `${own} – ${opp}`}
async function refreshCloudLibrary(redraw=true){if(libraryRefreshing||!navigator.onLine||!['nextcloud','webdav'].includes(settings.sync?.provider))return;libraryRefreshing=true;try{cloudMatchLibrary=await fetchCloudMatchLibrary(settings.sync);if(redraw&&$('#drawerBody')?.dataset.activeView==='match'&&!$('#drawerBackdrop').hidden)drawMatch()}catch(e){console.info(t('library.cloudUnavailable',{error:e.message}))}finally{libraryRefreshing=false}}
function renderMatchLibrary(){const rows=mergedMatchLibrary();if(!rows.length)return `<div class="library-empty">${esc(t('library.empty'))}</div>`;return `<div class="match-library-list">${rows.map(m=>{const activeCurrent=m.matchId===state.matchId&&!state.matchComplete,newer=cloudIsNewer(m),displayDate=libraryDisplayDate(m)||'–';return `<article class="match-library-item" data-match-id="${esc(m.matchId)}"><div class="match-library-main"><div class="match-library-date-wrap"><button class="library-edit-meta" data-lib-action="edit-meta" data-id="${esc(m.matchId)}" title="${esc(t('library.editMeta'))}" aria-label="${esc(t('library.editMeta'))}">✎</button><div class="match-library-date" title="${esc(t('library.actualDate'))}">${esc(displayDate)}</div></div><div class="match-library-summary"><strong>${esc(matchNames(m))}</strong><span class="match-library-meta">${esc(matchStatusLabel(m))} · ${esc(matchScoreText(m))}${m.matchTypeName?` · ${esc(m.matchTypeName)}`:''}</span></div></div><div class="match-library-availability">${libraryAvailability(m)}</div><div class="match-library-actions">${newer?`<button class="library-sync" data-lib-action="cloud-replace" data-id="${esc(m.matchId)}">${esc(t('sync.cloud.take'))}</button>`:''}${m.status!=='ended'?`<button data-lib-action="continue" data-id="${esc(m.matchId)}">${esc(t('library.continue'))}</button>`:''}<button data-lib-action="video" data-id="${esc(m.matchId)}">🎬 ${esc(t('library.video'))}</button><button data-lib-action="timestamps" data-id="${esc(m.matchId)}">⏱ ${esc(t('timestamp.editor_short'))}</button><button data-lib-action="review" data-id="${esc(m.matchId)}">${esc(t('library.review'))}</button><button data-lib-action="analyse" data-id="${esc(m.matchId)}">${esc(t('library.analyse'))}</button><button class="library-trash danger" data-lib-action="remove" data-id="${esc(m.matchId)}" ${activeCurrent?'disabled':''} title="${esc(activeCurrent?t('library.remove_active_hint'):t('library.remove'))}" aria-label="${esc(t('library.remove'))}">🗑</button></div></article>`}).join('')}</div>`}
async function editLibraryMatchMetadata(matchId){
 try{
  const snap=await resolveMatchSnapshot(matchId),st=snap.fullState||snap.state||{};
  const quick=!!st.quickScout;
  const seas=active(master.seasons),owns=active(master.teams).filter(teamRow=>teamRow.kind==='own'),opps=active(master.teams).filter(teamRow=>teamRow.kind==='opponent'),types=active(master.matchTypes);
  const date=libraryDisplayDate(snap)||new Date().toISOString().slice(0,10);
  const body=quick
   ?`<p class="small">Hier werden nur Stammdaten des vorhandenen Spiels korrigiert. Scoutingaktionen, Rallys, Zeitstempel, Spieler-IDs und Kontext-IDs bleiben unverändert.</p><div class="form-grid"><label>${t('match.date')}</label><input name="matchDate" type="date" value="${esc(date)}" required><label>Eigenes Team / Bezeichnung</label><input name="quickOwnName" value="${esc(st.quickOwnName||snap.ownTeamName||'Wir')}"><label>Gegner / Bezeichnung</label><input name="quickOppName" value="${esc(st.quickOppName||snap.oppTeamName||'Gegner')}"></div>`
   :`<p class="small">Hier werden ausschließlich die Stammdaten dieses bestehenden Spiels korrigiert. <strong>Scoutingaktionen, Rallys, Zeitstempel, Aufstellungen und Kontext-IDs werden nicht neu erzeugt oder gelöscht.</strong></p><div class="form-grid"><label>${t('match.date')}</label><input name="matchDate" type="date" value="${esc(date)}" required><label>${t('analysis.filter.season')}</label><select name="seasonId"><option value="">–</option>${opts(seas,st.seasonId||snap.seasonId)}</select><label>${t('match.ownTeam')}</label><select name="ownTeamId"><option value="">–</option>${opts(owns,st.ownTeamId||snap.ownTeamId)}</select><label>${t('match.opponent')}</label><select name="oppTeamId"><option value="">–</option>${opts(opps,st.oppTeamId||snap.oppTeamId)}</select><label>${t('roster.matchType')}</label><select name="matchTypeId"><option value="">–</option>${opts(types,st.matchTypeId||snap.matchTypeId)}</select></div><p class="small">Hinweis: Eine Korrektur von Team, Saison oder Spiel-/Kaderart ändert die Zuordnung des Spiels, nicht die bereits erfassten Spieleraktionen. Dadurch bleiben historische Scoutingdaten vollständig erhalten.</p>`;
  modal('Spieldaten bearbeiten',body,async fd=>{
    const matchDate=String(fd.get('matchDate')||'').trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(matchDate))throw new Error('Bitte ein gültiges Spieldatum angeben.');
    let patch={matchDate};
    if(quick){
      const quickOwnName=String(fd.get('quickOwnName')||'Wir').trim()||'Wir',quickOppName=String(fd.get('quickOppName')||'Gegner').trim()||'Gegner';
      patch={...patch,ownTeamName:quickOwnName,oppTeamName:quickOppName};
      const full={...(snap.fullState||snap.state||{}),quickOwnName,quickOppName};snap.fullState=full;snap.state={...(snap.state||full),quickOwnName,quickOppName};
    }else{
      const seasonId=String(fd.get('seasonId')||''),ownTeamId=String(fd.get('ownTeamId')||''),oppTeamId=String(fd.get('oppTeamId')||''),matchTypeId=String(fd.get('matchTypeId')||'');
      const mt=matchType(matchTypeId),own=team(ownTeamId),opp=team(oppTeamId);
      patch={...patch,seasonId,ownTeamId,oppTeamId,matchTypeId,matchTypeName:mt?.name||'',ownTeamName:own?.name||'',oppTeamName:opp?.name||''};
    }
    const updatedAt=now(),next=applyMatchMetadata(snap,patch,updatedAt);upsertMatchArchive(next);
    if(state.matchId===matchId){
      state={...state,...patch};
      if(quick){state.quickOwnName=patch.ownTeamName;state.quickOppName=patch.oppTeamName}
      saveState(state);archiveCurrentMatch(state.matchComplete?'ended':'active');render();
    }
    drawMatch();setStatus(t('status.matchDataSaved',{date:matchDate}));
    if(navigator.onLine&&['nextcloud','webdav'].includes(settings.sync?.provider)){
      try{
        if(state.matchId===matchId&&!state.matchComplete)await runLiveSync(false);
        else await syncStoredMatch(getMatchSnapshot(matchId)||next,settings.sync);
        await refreshCloudLibrary(false);drawMatch();setStatus(t('status.matchDataSynced',{date:matchDate}))
      }catch(e){console.info('Spieldaten lokal gespeichert; Cloud-Sync folgt später:',e.message);setStatus(t('status.matchDataCloudPending',{error:e.message}))}
    }
  },'Speichern')
 }catch(e){setStatus(e.message||String(e))}
}

async function resolveMatchSnapshot(matchId){const local=getMatchSnapshot(matchId);if(local)return local;if(!navigator.onLine)throw new Error('Dieses Spiel liegt nur in der Cloud. Für den ersten Download ist eine Internetverbindung erforderlich.');const remote=await fetchCloudMatch(matchId,settings.sync);if(!remote)throw new Error('Spiel konnte in der Cloud nicht geladen werden.');const meta=cloudMatchLibrary.find(x=>x.matchId===matchId)||{};const snap={...meta,matchId,status:remote.status,updatedAt:remote.updatedAt,fullState:{...remote.state,videoAssignments:[...(remote.videos||remote.state?.videoAssignments||[])]},state:remote.state,events:remote.events||[],videos:remote.videos||[]};upsertMatchArchive(snap);return getMatchSnapshot(matchId)||snap}
async function loadMatchForContinue(matchId){try{if(state.matchId&&state.matchId!==matchId)archiveCurrentMatch(state.matchComplete?'ended':'interrupted');const snap=await resolveMatchSnapshot(matchId);if(!snap?.fullState)throw new Error('Für dieses ältere Archiv ist kein vollständiger Spielzustand vorhanden. Es kann geprüft oder analysiert, aber nicht sicher fortgesetzt werden.');state={...defaultState,...snap.fullState,matchId:snap.matchId,videoAssignments:[...(snap.videos||snap.fullState.videoAssignments||[])]};events=migrateEventPlayerIds([...(snap.events||[])]);migrateRallyMetadata(events);saveState(cleanStateForSnapshot(state));saveEvents(events);archiveCurrentMatch(state.matchComplete?'ended':'active');await csv.init(`VolleyTaktLive_${state.matchId}.csv`);await csv.write(events);closeDrawer();render();setStatus(t('status.matchLoaded',{name:matchNames(snap),score:matchScoreText(snap)}));if(navigator.onLine&&['nextcloud','webdav'].includes(settings.sync?.provider))runLiveSync(false)}catch(e){setStatus(e.message);alert(e.message)}}
async function reviewMatch(matchId){try{const m=await resolveMatchSnapshot(matchId),ev=m.events||[];const rows=ev.slice(-80).reverse().map(e=>`<tr><td>${esc(e.timestamp||'')}</td><td>${esc(e.set||'')}</td><td>${esc(e.rotation||'')}</td><td>${esc(e.player_abbreviation||e.player||'')}</td><td>${esc(e.action||'')}</td><td>${esc(e.value||'')}</td><td>${esc((e.score_us??''))}:${esc((e.score_them??''))}</td></tr>`).join('');modal(`Spiel prüfen · ${matchNames(m)}`,`<div class="review-summary"><strong>${esc(libraryDisplayDate(m)||'')}</strong><span>${esc(matchStatusLabel(m))} · ${esc(matchScoreText(m))}</span><span>${ev.length} Protokolleinträge · ${(m.videos||m.fullState?.videoAssignments||[]).length} Videozuordnung(en)</span></div><div class="review-table-wrap"><table><thead><tr><th>Zeit</th><th>S</th><th title="Rotation">Rot.</th><th>Spielerin</th><th>Aktion</th><th>Wert</th><th>Stand</th></tr></thead><tbody>${rows||'<tr><td colspan="7">Noch keine Aktionen.</td></tr>'}</tbody></table></div>`,()=>{},t('common.close'))}catch(e){setStatus(e.message)}}
async function analyseMatch(matchId){try{await resolveMatchSnapshot(matchId);analysisPinnedMatchId=matchId;openDrawer('analysis')}catch(e){setStatus(e.message)}}
function cloudSnapshotFromRemote(matchId,remote,cloudMeta={}){
 const fullState={...(remote?.state||{}),videoAssignments:[...(remote?.videos||remote?.state?.videoAssignments||[])]};
 return {...cloudMeta,matchId,status:remote?.status||(fullState.matchComplete?'ended':'interrupted'),updatedAt:remote?.updatedAt||new Date().toISOString(),generation:Number(remote?.generation||0),fullState,state:remote?.state||{},events:[...(remote?.events||[])],videos:[...(remote?.videos||[])]};
}
async function applyCloudMatchLocally(matchId,remote=null){
 const loaded=remote||await fetchCloudMatch(matchId,settings.sync);if(!loaded)throw new Error(t('sync.cloud.load_failed'));
 const cloudMeta=cloudMatchLibrary.find(x=>x.matchId===matchId)||{};const snap=cloudSnapshotFromRemote(matchId,loaded,cloudMeta);upsertMatchArchive(snap);
 if(state.matchId===matchId){
  state={...defaultState,...snap.fullState,matchId:snap.matchId,videoAssignments:[...(snap.videos||snap.fullState.videoAssignments||[])]};
  state.syncGeneration=Math.max(Number(loaded.generation||0),Number(state.syncGeneration||0));
  events=migrateEventPlayerIds([...(snap.events||[])]);migrateRallyMetadata(events);saveState(cleanStateForSnapshot(state));saveEvents(events);
  await csv.init(`VolleyTaktLive_${state.matchId}.csv`);await csv.write(events);render();
 }
 await refreshCloudLibrary(false);syncUiState='synced';syncUiPending=0;updateSyncBadge();const syncLog=$('#syncLog');if(syncLog)syncLog.textContent=`✓ ${t('sync.cloud.applied')}`;setStatus(t('sync.cloud.applied'));
 if(!$('#drawerBackdrop').hidden&&$('#drawerBody')?.dataset.activeView==='match')drawMatch();
 return true;
}
function liveSyncPayload(){return {matchId:state.matchId,generation:state.syncGeneration,deviceId:deviceId(),deviceName:deviceName(),...matchDisplayMeta(state),videos:[...(state.videoAssignments||[])],state:{...state,selectedPos:0,selectedOppPos:0,pendingSide:null,pendingAction:null,pendingQuality:null,inputStep:'WER',selectedPlayerId:'',selectedPlayerPos:0,actionZone:0,targetZone:0,targetSide:'',actionStartedSeconds:null,actionStartedAt:'',setTempo:'',setDistance:'',serveTechnique:'',autoServePreset:false},events}}
async function keepLocalMatchAgainstCloud(matchId){
 if(matchId!==state.matchId)throw new Error('Der lokale Vorrang kann nur für das aktuell geöffnete Spiel bestätigt werden.');
 const r=await syncLiveSession(liveSyncPayload(),settings.sync,m=>{const log=$('#syncLog');if(log)log.textContent=m;syncUiState='syncing';updateSyncBadge()},{forceLocal:true});
 state.syncGeneration=r.generation||state.syncGeneration;saveState(state);archiveCurrentMatch(state.matchComplete?'ended':'active');await refreshCloudLibrary(false);syncUiState='synced';syncUiPending=0;updateSyncBadge();const log=$('#syncLog');if(log)log.textContent=`✓ ${t('sync.cloud.local_kept')}`;setStatus(t('sync.cloud.local_kept'));return true;
}
function promptCloudVersionChoice(matchId,remote=null,{allowLocalKeep=matchId===state.matchId}={}){
 const help=allowLocalKeep?t('sync.cloud.choice_help'):t('sync.cloud.replace_warning');
 modal(t('sync.cloud.newer_title'),`<p>${esc(help)}</p>`,()=>{void withGlobalBusy(t('sync.cloud.applying'),async()=>{await applyCloudMatchLocally(matchId,remote);if(matchId===state.matchId)setTimeout(()=>runLiveSync(false),120)}).catch(e=>{setStatus(e.message||String(e));alert(e.message||String(e))})},t('sync.cloud.take'),null,allowLocalKeep?t('sync.cloud.keep'):t('common.cancel'));
 if(allowLocalKeep){const cancel=$('#dialogCancel');if(cancel)cancel.onclick=()=>{closeModal(false);void withGlobalBusy(t('sync.cloud.keeping_local'),()=>keepLocalMatchAgainstCloud(matchId)).catch(e=>{setStatus(e.message||String(e));alert(e.message||String(e))})}}
}
async function replaceLocalMatchWithCloud(matchId,{confirmFirst=true,force=false,remote=null}={}){
 const row=mergedMatchLibrary().find(x=>x.matchId===matchId);
 if(!force&&(!row||!row._cloud))return false;
 if(!force&&row?._local&&!cloudIsNewer(row)){setStatus(t('sync.cloud.not_newer'));return false}
 if(confirmFirst){promptCloudVersionChoice(matchId,remote,{allowLocalKeep:matchId===state.matchId});return true}
 return applyCloudMatchLocally(matchId,remote)
}
async function withGlobalBusy(label,task){document.body.classList.add('global-busy');setStatus(label);try{return await task()}finally{document.body.classList.remove('global-busy')}}
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
   void withGlobalBusy(t('library.removing_cloud'),async()=>{const result=await removeCloudMatchFromLibrary(matchId,settings.sync);removeMatchArchive(matchId);cloudMatchLibrary=cloudMatchLibrary.filter(x=>x.matchId!==matchId);if(result?.warning){setStatus(result.warning);alert(result.warning)}else setStatus(t('library.removed_sync'));drawMatch()}).catch(e=>{setStatus(e.message||String(e));alert(e.message||String(e))});
 },t('library.remove_confirm'))
}
function wireMatchLibraryActions(){$$('[data-lib-action]').forEach(btn=>btn.onclick=()=>{if(btn.disabled)return;const id=btn.dataset.id,action=btn.dataset.libAction;if(action==='edit-meta')editLibraryMatchMetadata(id);if(action==='cloud-replace')replaceLocalMatchWithCloud(id);if(action==='continue')loadMatchForContinue(id);if(action==='video')drawLibraryVideoAssignments(id);if(action==='timestamps')editMatchTimestamps(id);if(action==='review')reviewMatch(id);if(action==='analyse')analyseMatch(id);if(action==='remove')removeMatchFromLibrary(id)})}
function newMatchFromLibrary(){
 matchEditorOpen=true;matchEditorMode='new';drawMatch();setStatus(t('status.newMatch'));
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
   current.videos=nextVideos;await saveLibraryVideoSnapshot(current);drawLibraryVideoAssignments(matchId);setStatus(t('status.videoAssignmentSaved'))
  },id?'Übernehmen':'Zuordnen')
 }catch(e){setStatus(e.message)}
}

function drawVideoAssignments(){
 const b=$('#drawerBody'),rows=state.videoAssignments||[];
 const playbackLabel=v=>({youtube:'YouTube',cloud:'Cloud',local:'Lokal / Gerät',url:'URL'}[v?.playbackSource?.type||v.storageType]||'Wiedergabe');
 const processingLabel=v=>{const p=v?.processingSource;if(!p?.type||p.type==='none')return 'keine Processing-Quelle';return ({local:'Worker-Datei',webdav:'WebDAV/Nextcloud',http:'HTTP(S)'}[p.type]||p.type)};
 b.innerHTML=`<div class="drawer-subhead"><h3>Videospeicher &amp; Videozuordnung</h3></div><div class="card"><p class="small">Wiedergabe und Videoschnitt können unterschiedliche Quellen verwenden. YouTube bleibt z. B. Wiedergabequelle, während der VolleyVideo-Worker eine lokale oder WebDAV-Datei verarbeitet.</p><div class="toolbar"><button id="addVideoAssignment" class="primary">Video zuordnen</button></div></div><div class="video-assignment-list">${rows.map(v=>`<div class="card video-assignment"><div><strong>${esc(v.label||'Spielvideo')}</strong><span>Wiedergabe: ${esc(playbackLabel(v))}${v.perspective?` · ${esc(v.perspective)}`:''}</span><small>${esc(v.playbackSource?.reference||v.reference||'Keine Referenz')}<br>Verarbeitung: ${esc(processingLabel(v))}${v.processingSource?.reference?` · ${esc(v.processingSource.reference)}`:''}<br>Abgleich: Scouting ${fmt(Number(v.scoutingSyncSeconds||0))} = Video ${fmt(Number(v.videoSyncSeconds||0))} · Offset ${fmt(Number(v.videoSyncSeconds||0)-Number(v.scoutingSyncSeconds||0))}</small></div><div class="toolbar"><button data-video-edit="${esc(v.id)}">Bearbeiten</button><button class="danger" data-video-delete="${esc(v.id)}">Entfernen</button></div></div>`).join('')||'<div class="card small">Noch kein Video diesem Spiel zugeordnet.</div>'}</div>`;
 $('#addVideoAssignment').onclick=()=>editVideoAssignment();$$('[data-video-edit]').forEach(x=>x.onclick=()=>editVideoAssignment(x.dataset.videoEdit));$$('[data-video-delete]').forEach(x=>x.onclick=()=>{state.videoAssignments=state.videoAssignments.filter(v=>v.id!==x.dataset.videoDelete);persist();drawVideoAssignments()})
}
function editVideoAssignment(id=''){
 const old=(state.videoAssignments||[]).find(v=>v.id===id)||{id:newId('video'),storageType:'local',label:'Spielvideo',reference:'',scoutingSyncSeconds:0,videoSyncSeconds:0,perspective:''};
 const playback=old.playbackSource||{type:old.storageType||'local',reference:old.reference||''},processing=old.processingSource||((old.storageType==='local'&&old.reference)?{type:'local',reference:old.reference}:old.storageType==='cloud'&&old.reference?{type:'webdav',reference:old.reference}:{type:'none',reference:''});
 modal(id?'Videozuordnung bearbeiten':'Video zuordnen',`<h4>Wiedergabe</h4><label>Wiedergabequelle<select name="playbackType"><option value="local" ${playback.type==='local'?'selected':''}>Lokal / Datei auf diesem Gerät</option><option value="cloud" ${playback.type==='cloud'?'selected':''}>Cloud-Datei / Cloud-URL</option><option value="youtube" ${playback.type==='youtube'?'selected':''}>YouTube</option><option value="url" ${playback.type==='url'?'selected':''}>HTTP(S)-URL</option></select></label><label>Bezeichnung<input name="label" value="${esc(old.label||'')}"></label><label>Dateiname / URL / Video-ID<input name="playbackReference" value="${esc(playback.reference||'')}" placeholder="z. B. match.mp4 oder YouTube-URL"></label><label>Perspektive / Kamera<input name="perspective" value="${esc(old.perspective||'')}" placeholder="z. B. Hinterfeld"></label><h4>Verarbeitung / Videoschnitt</h4><label>Processing-Quelle<select name="processingType"><option value="none" ${processing.type==='none'?'selected':''}>Keine</option><option value="local" ${processing.type==='local'?'selected':''}>Datei auf dem VolleyVideo-Worker</option><option value="webdav" ${processing.type==='webdav'?'selected':''}>Nextcloud / WebDAV</option><option value="http" ${processing.type==='http'?'selected':''}>HTTP(S)-Quelle</option></select></label><label>Worker-Pfad / Referenz<input name="processingReference" value="${esc(processing.reference||'')}" placeholder="z. B. /videos/spiel.mp4 oder WebDAV-Pfad"></label><p class="small">Eine lokale Datei auf Tablet/Smartphone ist nicht automatisch für den Worker erreichbar. Für den physischen Schnitt muss die Processing-Quelle aus Sicht des Workers erreichbar sein.</p><div class="form-grid"><label>Scouting-Zeit (Sek.)</label><input name="scoutingSyncSeconds" type="number" min="0" step="0.1" value="${Number(old.scoutingSyncSeconds||0)}"><label>Video-Zeit (Sek.)</label><input name="videoSyncSeconds" type="number" min="0" step="0.1" value="${Number(old.videoSyncSeconds||0)}"></div><p class="small">Beispiel bei langem Vorlauf: Scouting 0,0 = Video 1127,4 Sekunden. Der Offset wird daraus automatisch berechnet.</p>`,fd=>{const playbackType=String(fd.get('playbackType')||'local'),playbackReference=String(fd.get('playbackReference')||'').trim(),processingType=String(fd.get('processingType')||'none'),processingReference=String(fd.get('processingReference')||'').trim();const v={...old,storageType:playbackType==='url'?'cloud':playbackType,reference:playbackReference,playbackSource:{type:playbackType,reference:playbackReference},processingSource:processingType==='none'?null:{type:processingType,reference:processingReference},label:String(fd.get('label')||'Spielvideo').trim(),perspective:String(fd.get('perspective')||'').trim(),scoutingSyncSeconds:Math.max(0,Number(fd.get('scoutingSyncSeconds')||0)),videoSyncSeconds:Math.max(0,Number(fd.get('videoSyncSeconds')||0)),updatedAt:now()};const i=state.videoAssignments.findIndex(x=>x.id===v.id);if(i>=0)state.videoAssignments[i]=v;else state.videoAssignments.push(v);persist();drawVideoAssignments()},id?'Übernehmen':'Zuordnen')
}

function drawMatch(){
 const b=$('#drawerBody'),seas=active(master.seasons),owns=active(master.teams).filter(teamRow=>teamRow.kind==='own'),opps=active(master.teams).filter(teamRow=>teamRow.kind==='opponent'),ord=orderedMatchTypes(master.matchTypes),types=[...ord.top,...ord.rest];
 const ownDetailed=qualityProfileForSide('own')==='datavolley_6',oppDetailed=qualityProfileForSide('opponent')==='datavolley_6';
 const newMode=matchEditorOpen&&matchEditorMode==='new';
 const formDate=newMode?new Date().toISOString().slice(0,10):(state.matchDate||new Date().toISOString().slice(0,10));
 const formSeason=newMode?'':state.seasonId,formOwn=newMode?'':state.ownTeamId,formOpp=newMode?'':state.oppTeamId,formType=newMode?'':state.matchTypeId;
 const formMode=newMode?'regular':state.matchMode,formSetCount=newMode?3:state.fixedSetCount,formFinalTarget=newMode?25:state.fixedFinalSetTarget;
 const formCapture=newMode?state.opponentCapture:state.opponentCapture;
 const currentActions=!matchEditorOpen&&state.matchId?`<div class="card current-match-actions"><div class="analysis-heading"><h3>${esc(t('match.current'))}</h3><p class="small">${esc(state.quickScout?t('match.quickScouting'):matchNames(state))}</p></div><div class="toolbar"><button id="videoAssignmentsBtn">🎬 ${t('match.videoAssignments')}</button><button id="prepareSet">${state.setReady?t('match.prepareSetAgain',{set:state.setNo}):t('match.prepareSet',{set:state.setNo})}</button>${state.setReady?`<button id="lineupOwn">${t('match.changeOwnLineup')}</button>`:''}${state.setReady&&state.opponentCapture?`<button id="lineupOpp">${t('match.changeOpponentLineup')}</button>`:''}<button class="danger" id="resetScouting">${t('match.resetScouting')}</button></div></div>`:'';
 const editor=matchEditorOpen?`<div class="card match-editor-card"><div class="drawer-subhead match-editor-head"><h3>${esc(t('match.new'))}</h3><button id="cancelMatchEdit" class="ghost">${t('match.cancel')}</button></div><div class="form-grid"><label>${t('match.date')}</label><input id="mDate" type="date" value="${esc(formDate)}"><label>${t('analysis.filter.season')}</label><select id="mSeason"><option value="">–</option>${opts(seas,formSeason)}</select><label>${t('match.ownTeam')}</label><select id="mOwn"><option value="">–</option>${opts(owns,formOwn)}</select><label>${t('match.opponent')}</label><select id="mOpp"><option value="">–</option>${opts(opps,formOpp)}</select><label>${t('roster.matchType')}</label><select id="mType"><option value="">–</option>${types.map(mt=>`<option value="${esc(mt.id)}" ${mt.id===formType?'selected':''}>${esc(mt.name)}</option>`).join('')}</select><label>${t('match.mode')}</label><select id="mMatchMode"><option value="regular" ${formMode!=='fixed'?'selected':''}>${t('match.modeRegular')}</option><option value="fixed" ${formMode==='fixed'?'selected':''}>${t('match.modeFixed')}</option></select><label class="fixed-set-option">${esc(t('match.set_count'))}</label><select id="mFixedSetCount" class="fixed-set-option">${[1,2,3,4,5].map(n=>`<option value="${n}" ${+formSetCount===n?'selected':''}>${n}</option>`).join('')}</select><label class="fixed-set-option">${esc(t('match.last_set'))}</label><select id="mFixedFinalTarget" class="fixed-set-option"><option value="25" ${+formFinalTarget!==15?'selected':''}>${t('match.final25')}</option><option value="15" ${+formFinalTarget===15?'selected':''}>${t('match.final15')}</option></select></div><div class="quality-switches"><label class="switch-row"><span>${t('match.scoutOpponent')}</span><span class="switch"><input type="checkbox" id="mCaptureOpponent" ${formCapture?'checked':''}><span class="slider"></span></span></label><label class="switch-row"><span>${esc(t('match.own_detailed'))}</span><span class="switch"><input type="checkbox" id="mOwnDetailed" ${ownDetailed?'checked':''}><span class="slider"></span></span></label><small>= / - / ! / / / + / #</small><label class="switch-row"><span>${esc(t('match.opponent_detailed'))}</span><span class="switch"><input type="checkbox" id="mOppDetailed" ${oppDetailed?'checked':''}><span class="slider"></span></span></label><small>= / - / ! / / / + / #</small></div><div class="toolbar mt"><button class="primary" id="applyMatch">${t('match.apply')}</button><button id="cancelMatchEdit2">${t('match.cancel')}</button></div><p class="small">${t('match.applyHelp')}</p></div>`:'';
 b.innerHTML=`${currentActions}<div class="card match-library-card"><div class="analysis-heading"><h3>${t('match.library')} <span class="preview-pill">${APP_VERSION}</span></h3><p class="small">${t('match.libraryDesc')}</p></div><div class="toolbar"><button id="newMatchBtn" class="primary">${t('match.newButton')}</button><button id="refreshLibraryBtn">${t('match.refreshCloud')}</button></div><div id="matchLibrary">${renderMatchLibrary()}</div>${editor}</div>`;
 $('#newMatchBtn').onclick=newMatchFromLibrary;$('#refreshLibraryBtn').onclick=e=>withButtonBusy(e.currentTarget,()=>refreshCloudLibrary(true),t('match.cloudBusy'));wireMatchLibraryActions();refreshCloudLibrary(false);
 if($('#videoAssignmentsBtn'))$('#videoAssignmentsBtn').onclick=()=>openDrawer('videoassignments');if($('#prepareSet'))$('#prepareSet').onclick=startSetSetup;if($('#lineupOwn'))$('#lineupOwn').onclick=()=>editLineup('own');if($('#lineupOpp'))$('#lineupOpp').onclick=()=>editLineup('opponent');if($('#resetScouting'))$('#resetScouting').onclick=()=>modal(t('match.resetTitle'),`<p>${t('match.resetBody')}</p><p class="small"><strong>${t('match.resetKeep')}</strong></p>`,()=>resetCurrentScouting(),t('match.resetScouting'));
 if(!matchEditorOpen)return;
 const cancelEditor=()=>{matchEditorOpen=false;matchEditorMode='';drawMatch();setStatus(t('match.createCancelled'))};
 $('#cancelMatchEdit').onclick=cancelEditor;$('#cancelMatchEdit2').onclick=cancelEditor;
 const mtSel=$('#mType');if(mtSel)mtSel.onchange=()=>{if(matchEditorMode!=='new')changeMatchTypeFromUi(mtSel.value)};
 const syncSwitchDefaults=()=>{const own=$('#mOwn').value,opp=$('#mOpp').value;if(own)$('#mOwnDetailed').checked=qualityProfileForTeam(own)==='datavolley_6';if(opp)$('#mOppDetailed').checked=qualityProfileForTeam(opp)==='datavolley_6'};
 $('#mOwn').addEventListener('change',syncSwitchDefaults);$('#mOpp').addEventListener('change',syncSwitchDefaults);const syncMatchModeFields=()=>{$$('.fixed-set-option').forEach(el=>el.hidden=$('#mMatchMode').value!=='fixed')};$('#mMatchMode').addEventListener('change',syncMatchModeFields);syncMatchModeFields();
 $('#applyMatch').onclick=()=>{
  const mt=selectedMatchType($('#mType').value);if(!mt){setStatus(t('match.typeRequired'));return}
  if(newMode){if(state.matchId&&!state.quickScoutDraft)archiveCurrentMatch(state.matchComplete?'ended':'interrupted');const keep={autoRotate:state.autoRotate,allowPositionOnly:state.allowPositionOnly,opponentCapture:state.opponentCapture,ownQualityProfile:state.ownQualityProfile,opponentQualityProfile:state.opponentQualityProfile,fieldOrientation:state.fieldOrientation};state={...defaultState,...keep,matchId:newId('match'),videoAssignments:[]};events=[];redoStack=[]}
  state.quickScout=false;state.quickPlayers={};state.matchDate=$('#mDate').value||new Date().toISOString().slice(0,10);state.seasonId=$('#mSeason').value;state.ownTeamId=$('#mOwn').value;state.oppTeamId=$('#mOpp').value;state.ownQualityProfile=$('#mOwnDetailed').checked?'datavolley_6':'basic_5';state.opponentQualityProfile=$('#mOppDetailed').checked?'datavolley_6':'basic_5';state.opponentCapture=$('#mCaptureOpponent').checked;if(!state.opponentCapture)state.activeTeamContext='own';state.matchMode=$('#mMatchMode').value==='fixed'?'fixed':'regular';state.fixedSetCount=Math.min(5,Math.max(1,+$('#mFixedSetCount').value||3));state.fixedFinalSetTarget=+$('#mFixedFinalTarget').value===15?15:25;state.matchTypeId=mt.id;state.matchTypeName=mt.name;
  state.setNo=1;state.setWinsUs=0;state.setWinsThem=0;state.firstSetServing='';state.setReady=false;state.matchComplete=false;state.scoreUs=state.scoreThem=0;state.servingSide='';state.fieldOrientation='activeBottom';mt.usageCount=(mt.usageCount||0)+1;Object.assign(mt,touched(mt));persist();matchEditorOpen=false;matchEditorMode='';render();drawMatch();setStatus(t('match.baseApplied'));if(!events.length&&!state.setReady)setTimeout(startSetSetup,80)
 };
}
function rosterKey(teamId=state.ownTeamId,seasonId=state.seasonId,typeId=state.matchTypeId){return `${teamId}|${seasonId}|${typeId}`}
function seasonRosterRows(teamId,seasonId){return master.seasonRosters.filter(r=>r.teamId===teamId&&r.seasonId===seasonId&&r.active!==false)}
function matchRosterRows(teamId,seasonId,typeId){return master.matchRosters.filter(r=>r.teamId===teamId&&r.seasonId===seasonId&&r.matchTypeId===typeId&&r.active!==false)}
function editLineup(side,onSaved=null,options={}){
 const tid=side==='own'?state.ownTeamId:state.oppTeamId;if(!tid||!state.seasonId||!state.matchTypeId){setStatus(t('status.rosterPrerequisites'));return}
 let rows=matchRosterRows(tid,state.seasonId,state.matchTypeId);if(!rows.length)rows=seasonRosterRows(tid,state.seasonId);
 const lineup={...(options.lineup||(side==='own'?state.ownLineup:state.oppLineup)||{})};
 const selectedLiberos=[...(options.liberos||setLiberosForSide(side)||[])].filter(Boolean).slice(0,2);
 const playerRows=sortPlayerSelectionRows(rows.map(r=>({...player(r.playerId),jersey:r.jersey,role:r.role,playerId:r.playerId})).filter(x=>x.id),side);
 const liberoRows=playerRows.filter(x=>isLiberoRole(x.role||x.defaultRole));
 const liberoOptions=(selected='')=>`<option value="">– kein Libero –</option>${opts(liberoRows,selected,x=>`#${x.jersey||x.defaultJersey||'–'} · ${x.abbreviation} · ${x.firstName} ${x.lastName}`)}`;
 const liberoHtml=`<div class="lineup-libero-section"><h3>Libero für Satz ${state.setNo}</h3><p class="small">Wähle den zu Satzbeginn bevorzugten Libero. Bei zwei Liberos bleibt der zweite für spätere Libero-Wechsel verfügbar.</p><div class="lineup-grid"><label>Libero 1<select name="libero1">${liberoOptions(selectedLiberos[0]||'')}</select></label>${liberoRows.length>1?`<label>Libero 2<select name="libero2">${liberoOptions(selectedLiberos[1]||'')}</select></label>`:''}</div>${liberoRows.length?'':'<p class="small">Im aktuellen Kader ist keine Spielerin als Libero gekennzeichnet.</p>'}</div>`;
 modal(`Startaufstellung ${side==='own'?'Wir':'Gegner'} · Satz ${state.setNo}`,`<p class="save-hint">${esc(t('setup.help'))}</p><div class="lineup-grid">${POS.map(p=>`<label>${posLabel(p)}<select name="p${p}"><option value="">–</option>${opts(playerRows,lineup[p],x=>`#${x.jersey||x.defaultJersey||'–'} · ${x.abbreviation} · ${x.firstName} ${x.lastName}`)}</select></label>`).join('')}</div>${liberoHtml}`,fd=>{
  const vals=POS.map(p=>fd.get(`p${p}`)).filter(Boolean);if(new Set(vals).size!==vals.length)throw new Error(t('match.lineupDuplicate'));
  const target={};POS.forEach(p=>target[p]=fd.get(`p${p}`)||'');
  const liberos=[fd.get('libero1'),fd.get('libero2')].filter(Boolean);if(new Set(liberos).size!==liberos.length)throw new Error(t('match.liberoDuplicate'));
  if(liberos.some(id=>vals.includes(id)))throw new Error(t('match.liberoLineupConflict'));
  const result={lineup:target,liberos};
  if(!options.draftOnly){setLineupAndLiberos(side,target,liberos);persist();render()}
  if(onSaved)setTimeout(()=>onSaved(result),30)
 },t('match.applyLineup'),options.onCancel||null)
}

function uniqueMatchTypes(){const seen=new Set();return active(master.matchTypes).filter(mt=>{const k=String(mt.name||'').trim().toLocaleLowerCase('de');if(seen.has(k))return false;seen.add(k);return true})}
function drawRosters(){const b=$('#drawerBody'),teams=active(master.teams),seas=active(master.seasons);b.innerHTML=`<div class="drawer-subnav"><button id="backPlayersFromRoster" type="button">👥 Spielerinnen</button><button class="primary" type="button">📋 Kader</button></div><div class="form-grid"><label>${t('analysis.filter.team')}</label><select id="rTeam">${opts(teams,state.ownTeamId)}</select><label>${t('analysis.filter.season')}</label><select id="rSeason">${opts(seas,state.seasonId)}</select><label>${t('roster.level')}</label><select id="rLevel"><option value="season">${t('roster.seasonRoster')}</option><option value="match">${t('roster.matchRoster')}</option></select><label>${t('roster.matchType')}</label><select id="rType">${opts(uniqueMatchTypes(),state.matchTypeId)}</select></div><div class="toolbar mt"><button id="loadRoster" class="primary">${t('roster.show')}</button><button id="copyPrev">${t('roster.copySeason')}</button><button id="manageTypes">${t('roster.manageTypes')}</button></div><div id="rosterEditor"></div>`;$('#backPlayersFromRoster').onclick=()=>openDrawer('players');$('#loadRoster').onclick=renderRosterEditor;$('#copyPrev').onclick=copyPreviousRoster;$('#manageTypes').onclick=()=>openDrawer('matchtypes');renderRosterEditor()}

function drawMatchTypes(){const b=$('#drawerBody');b.innerHTML=`<div class="toolbar"><button class="primary" id="addType">${t('matchTypes.add')}</button><button id="backRoster">← ${t('matchTypes.backRoster')}</button></div><table class="data-table"><thead><tr><th>${t('matchTypes.label')}</th><th>${t('matchTypes.usage')}</th><th>${t('common.status')}</th><th></th></tr></thead><tbody>${master.matchTypes.map(m=>`<tr class="${m.active===false?'inactive':''}" data-id="${m.id}"><td>${esc(m.name)}</td><td>${m.usageCount||0}</td><td>${m.active===false?t('players.inactive'):t('players.active')}</td><td><button data-edit>✎</button> <button data-toggle>${m.active===false?'↺':'⏸'}</button></td></tr>`).join('')}</tbody></table>`;$('#addType').onclick=()=>editMatchType();$('#backRoster').onclick=drawerBack;b.querySelectorAll('[data-edit]').forEach(x=>x.onclick=()=>editMatchType(x.closest('tr').dataset.id));b.querySelectorAll('[data-toggle]').forEach(x=>x.onclick=()=>{const m=master.matchTypes.find(y=>y.id===x.closest('tr').dataset.id);m.active=m.active===false;Object.assign(m,touched(m));persist();drawMatchTypes()})}
function editMatchType(id){const m=id?master.matchTypes.find(x=>x.id===id):{id:newId('mt'),name:'',usageCount:0,active:true,revision:0};modal(id?t('matchTypes.edit'):t('matchTypes.create'),`<label>${t('form.label')} <input name="name" value="${esc(m.name)}" required></label>`,fd=>{const name=String(fd.get('name')||'').normalize('NFKC').trim().replace(/\s+/g,' ');if(!name)throw new Error(t('matchTypes.enterLabel'));const key=matchTypeKey(name);if(master.matchTypes.some(x=>x.id!==m.id&&matchTypeKey(x.name)===key))throw new Error(t('matchTypes.exists'));Object.assign(m,touched(m),{name});if(!id)master.matchTypes.push(m);persist();drawMatchTypes()})}
function renderRosterEditor(){const box=$('#rosterEditor');if(!box)return;const tid=$('#rTeam')?.value,sid=$('#rSeason')?.value,level=$('#rLevel')?.value||'season',mtid=$('#rType')?.value;if(!tid||!sid){box.innerHTML=`<p>${t('form.selectTeamSeason')}</p>`;return}const current=level==='season'?seasonRosterRows(tid,sid):matchRosterRows(tid,sid,mtid),cur=new Map(current.map(r=>[r.playerId,r]));const coll=new Intl.Collator(settings.ui?.language||'de',{numeric:true,sensitivity:'base'}),allowed=(level==='season'?active(master.players):seasonRosterRows(tid,sid).map(r=>player(r.playerId)).filter(Boolean)).sort((a,b)=>coll.compare(String(a.abbreviation||''),String(b.abbreviation||''))||coll.compare(String(a.firstName||''),String(b.firstName||''))||coll.compare(String(a.lastName||''),String(b.lastName||'')));box.innerHTML=`<div class="card"><div class="checklist">${allowed.map(p=>{const r=cur.get(p.id);return `<div class="checkrow"><input type="checkbox" data-pid="${p.id}" ${r?'checked':''}><span>${esc(p.abbreviation)} – ${esc(p.firstName)} ${esc(p.lastName)}</span><input data-jersey="${p.id}" placeholder="${esc(t('form.numberShort'))}" value="${esc(r?.jersey??p.defaultJersey??'')}"><input data-role="${p.id}" placeholder="${esc(t('form.position'))}" value="${esc(r?.role??p.defaultRole??'')}"></div>`}).join('')}</div><button id="saveRoster" class="primary mt">${t('form.saveRoster')}</button></div>`;$('#saveRoster').onclick=()=>saveRoster(tid,sid,level,mtid)}
function saveRoster(tid,sid,level,mtid){const arr=level==='season'?master.seasonRosters:master.matchRosters;for(const p of active(master.players)){const cb=$(`[data-pid="${p.id}"]`);if(!cb)continue;let r=arr.find(x=>x.teamId===tid&&x.seasonId===sid&&x.playerId===p.id&&(level==='season'||x.matchTypeId===mtid));if(cb.checked){if(!r){r={id:newId(level==='season'?'sr':'mr'),teamId:tid,seasonId:sid,playerId:p.id,active:true,revision:0,...(level==='match'?{matchTypeId:mtid}:{})};arr.push(r)}Object.assign(r,touched(r),{active:true,jersey:$(`[data-jersey="${p.id}"]`).value.trim(),role:$(`[data-role="${p.id}"]`).value.trim().toUpperCase()})}else if(r){r.active=false;Object.assign(r,touched(r))}}persist();setStatus(t('status.rosterSaved',{level:t(level==='season'?'status.rosterSeasonLevel':'status.rosterMatchLevel')}));renderRosterEditor()}
function copyPreviousRoster(){const tid=$('#rTeam').value,sid=$('#rSeason').value,seas=active(master.seasons),idx=seas.findIndex(s=>s.id===sid);if(idx<1){setStatus(t('status.noPreviousSeason'));return}const source=seasonRosterRows(tid,seas[idx-1].id);for(const s of source){let r=master.seasonRosters.find(x=>x.teamId===tid&&x.seasonId===sid&&x.playerId===s.playerId);if(!r){r={id:newId('sr'),teamId:tid,seasonId:sid,playerId:s.playerId,revision:0};master.seasonRosters.push(r)}Object.assign(r,touched(r),{jersey:s.jersey,role:s.role,active:true})}persist();renderRosterEditor();setStatus(t('status.playersCopied',{count:source.length}))}

function drawData(){const b=$('#drawerBody'),migrationBackups=listMigrationBackups(),latest=migrationBackups[0],backupText=latest?t('data.backupAvailable',{date:new Date(latest.createdAt).toLocaleString(settings.ui.language==='en'?'en-GB':'de-DE')}):t('data.noBackup');b.innerHTML=`<div class="card"><h3>${t('data.scouting')}</h3><div class="toolbar"><button id="exportCsv" class="primary">${t('data.exportCsv')}</button><button id="importCsv">${t('data.importCsv')}</button><button id="newScout" class="danger">${t('data.clearScouting')}</button></div></div><div class="card"><h3>${t('data.master')}</h3><div class="toolbar"><button id="exportJson">${t('data.exportMaster')}</button><button id="importJson">${t('data.importMaster')}</button></div><p class="small">${t('data.masterDesc')}</p></div><div class="card"><h3>${t('data.migration')}</h3><p class="small"><strong>${t('data.schema',{schema:CURRENT_DATA_SCHEMA})}</strong> ${backupText}</p><div class="toolbar"><button id="downloadMigrationBackup" ${latest?'':'disabled'}>${t('data.downloadBackup')}</button></div><p class="small">${t('data.backupDesc')}</p></div>`;$('#exportCsv').onclick=()=>csv.download(events,`VolleyTaktLive_${new Date().toISOString().slice(0,10)}.csv`);$('#importCsv').onclick=()=>$('#csvImport').click();$('#newScout').onclick=()=>modal(t('data.resetTitle'),`<p>${t('data.resetBody')}</p><p class="small">${t('data.resetKeep')}</p>`,()=>resetCurrentScouting(),t('data.resetConfirm'));$('#exportJson').onclick=()=>downloadJson({schema:CURRENT_DATA_SCHEMA,master},'VolleyTakt_masterdata.json');$('#importJson').onclick=()=>$('#jsonImport').click();const mb=$('#downloadMigrationBackup');if(mb)mb.onclick=()=>{if(downloadLatestMigrationBackup())setStatus(t('data.backupDownloaded'))}}
function analysisMatches(){
 const archived=loadMatchArchive();
 const current=(state.matchId&&events.length)?{matchId:state.matchId,matchDate:state.matchDate||events.find(e=>e.createdAt)?.createdAt?.slice(0,10)||'',seasonId:state.seasonId,ownTeamId:state.ownTeamId,oppTeamId:state.oppTeamId,matchTypeId:state.matchTypeId,matchTypeName:state.matchTypeName,matchMode:state.matchMode,fixedSetCount:state.fixedSetCount,fixedFinalSetTarget:state.fixedFinalSetTarget,opponentCapture:state.opponentCapture,videos:[...(state.videoAssignments||[])],state:{setWinsUs:state.setWinsUs,setWinsThem:state.setWinsThem,videoAssignments:[...(state.videoAssignments||[])]},events:[...events]}:null;
 const map=new Map(archived.map(x=>[x.matchId,x]));if(current)map.set(current.matchId,current);return [...map.values()]
}
const analysisController=createAnalysisController({query:$,getMatches:analysisMatches,getPinnedMatchId:()=>analysisPinnedMatchId,clearPinnedMatch:()=>{analysisPinnedMatchId='';},filterMatches:filterAnalysisMatches,filterEvents:filterAnalysisEvents,stats:analysisStats,actions:ACTIONS,rotations:ROT,qualityLevel:QUALITY_LEVEL,getPlayers:()=>active(master.players),getSeasons:()=>active(master.seasons),getTeams:()=>active(master.teams),getMatchTypes:()=>active(master.matchTypes),getSelectedTeamId:()=>state.ownTeamId,escapeHtml:esc,qualityChip,version:APP_VERSION,matchNames,matchScoreText,analyzeView:analyzeAnalysisView,renderView:renderAnalysisView,onSaveResult:async()=>{setStatus(t('status.analysisSaved'));if(navigator.onLine&&['nextcloud','webdav'].includes(settings.sync?.provider)){try{await syncAnalysisResults(loadAnalysisResults(),settings.sync);setStatus('Analyse gespeichert und mit der Cloud synchronisiert.')}catch(e){setStatus(t('status.analysisCloudFailed',{error:e.message}));throw new Error(`Lokal gespeichert. Cloud-Synchronisation fehlgeschlagen: ${e.message}`)}}}});




















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
 <p id="cameraQuickGuide" class="camera-quick-guide">${cameraInstructionText(adapter,connected,state.cameraRecording)}${connected?'':' · Kamera einschalten → Kamera verbinden.'}</p><div id="cameraCompatHelp" class="camera-compat-help" hidden><strong>${esc(t('camera.supported_models'))}</strong><br><strong>DJI:</strong> Osmo Action 4, Osmo Action 5 Pro, Osmo Action 6 und Osmo 360 (DJI R-SDK/BLE). Action 2 und Osmo Action 3 werden von diesem Adapter nicht unterstützt.<br><strong>GoPro:</strong> HERO9 Black, HERO10 Black, HERO11 Black, HERO11 Black Mini, HERO12 Black und HERO13 Black. Der Adapter nutzt die Open-GoPro-BLE-Unterstützung. Weitere Open-GoPro-Geräte können technisch kompatibel sein; Details stehen in der Hilfe.</div>
 <p class="camera-quality-note">* Qualitätsanzeige aus Statusalter, Fehlern und Wiederverbindungen; Web Bluetooth liefert browserübergreifend keine verlässliche RSSI-Anzeige.</p>
 ${connected?`<div class="camera-actions camera-record-actions"><button id="recordStart" ${state.cameraRecording?'disabled':''}>${t('camera.recordSync')}</button><button id="recordStop" ${!state.cameraRecording?'disabled':''}>${t('camera.stop')}</button></div>`:''}
 <div class="toolbar camera-local-time"><button id="localClock" class="primary">${t('camera.localClock')}</button><button id="localClockReset">${t('camera.localClockReset')}</button></div>
 </div>
 ${cameraDiagVisible?`<section class="ble-diag" id="bleDiag"><h3>${t('camera.diagnostics')}</h3><p class="small ble-diag-reason">${esc(t('camera.diagnostics.lastConnectionFailed'))}</p><div class="ble-diag-grid"><span>${t('camera.secureHttps')}</span><strong id="diagSecure">–</strong><span>${t('camera.webBluetoothApi')}</span><strong id="diagApi">–</strong><span>${t('camera.bluetoothAvailable')}</span><strong id="diagAvailability">–</strong><span>${t('camera.browser')}</span><strong id="diagBrowser">–</strong><span>${esc(t('camera.device_selection'))}</span><strong id="diagChooser">–</strong><span>Ausgewähltes Gerät</span><strong id="diagDevice">–</strong><span>GATT</span><strong id="diagGatt">–</strong><span>Kamera-Service</span><strong id="diagService">–</strong><span>Notify/Response</span><strong id="diagNotify">–</strong><span>Write/Command</span><strong id="diagWrite">–</strong><span>Notifications</span><strong id="diagNotifications">–</strong><span>Protokoll</span><strong id="diagHandshake">–</strong><span>Letzter Fehler</span><strong id="diagError">–</strong></div><div class="ble-diag-actions"><button id="refreshBleDiag">Diagnose aktualisieren</button><button id="clearBleLog">${esc(t('camera.clear_log'))}</button></div><pre id="bleLog" class="ble-diag-log"></pre></section>`:''}`;
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
  persist();updateCameraUi(true);setStatus(t('camera.connectedStatus',{camera:cameraShortName()}));drawCamera()
 }catch(e){
  cameraService.markFailure();syncCameraTelemetry(cameraService.snapshot());cameraStatusFailures=Math.max(cameraStatusFailures,1);cameraDiagVisible=true;setCameraDiag('lastError',e.message||String(e));
  setStatus(t('camera.errorStatus',{camera:cameraShortName(),error:e.message}));dlog('FEHLER: '+e.message);drawCamera();
  try{await probeBluetooth()}catch{}updateCameraUi(true)
 }
}
async function startRecording(){try{if(!camera?.protocolConnected)throw new Error(t('camera.notConnected'));setStatus(t('camera.commandSent'));state.localClockRunning=false;state.localClockStartedAt=0;state.localClockElapsed=0;state.clockMode='camera';state.cameraRecording=false;newVideoClipId();persist();const s=await cameraService.startRecording();syncCameraTelemetry(cameraService.snapshot());cameraClipStartRecordTime=Number(s.recordTime)||0;cameraAnchor={cameraSec:0,perf:s.receivedPerf||performance.now()};state.cameraRecording=true;state.localClockElapsed=0;persist();render();updateCameraUi(true);setStatus(t('status.cameraRecordingStarted'))}catch(e){state.cameraRecording=false;cameraAnchor=null;cameraStatusFailures++;persist();updateCameraUi();setStatus(e.message)}}
async function stopRecording(){try{if(!camera?.protocolConnected)throw new Error(t('camera.notConnected'));if(!state.cameraRecording){setStatus(t('camera.notRecording'));return}const sec=currentSeconds();await cameraService.stopRecording();syncCameraTelemetry(cameraService.snapshot());cameraAnchor=null;state.localClockElapsed=sec;state.localClockRunning=false;state.localClockStartedAt=0;state.clockMode='camera';state.cameraRecording=false;persist();render();updateCameraUi(true);setStatus(t('status.cameraRecordingStopped'))}catch(e){cameraStatusFailures++;updateCameraUi();setStatus(e.message)}}

const PROVIDER_LABELS={none:'Lokal',nextcloud:'Nextcloud',webdav:'WebDAV',google:'Google Drive',icloud:'Apple iCloud',onedrive:'OneDrive',dropbox:'Dropbox',box:'Box'};
const providerLabel=()=>PROVIDER_LABELS[settings.sync?.provider]||settings.sync?.provider||'Cloud';
let syncUiState='ready',syncUiPending=0,syncUiLastError='';
function updateSyncBadge(){const el=$('#syncBadge');if(!el)return;const p=settings.sync?.provider||'none';if(p==='none'){el.textContent=t('sync.badge.off');el.className='badge muted';el.title=t('sync.badge.offTitle');return}const label=providerLabel();const suffix=syncUiState==='pending'?(syncUiPending?` · ${syncUiPending} ${t('sync.badge.pending')}`:` · ${t('sync.badge.pending')}`):syncUiState==='offline'?` ${t('sync.badge.offline')}${syncUiPending?` · ${syncUiPending}`:''}`:syncUiState==='incomplete'?` ${t('sync.badge.incomplete')}`:syncUiState==='locked'?` ${t('sync.badge.locked')}`:syncUiState==='ready'?` ${t('sync.badge.ready')}`:'';const text=syncUiState==='synced'?`☁ ${label} ✓`:syncUiState==='connecting'||syncUiState==='syncing'?`☁ ${label} …`:syncUiState==='error'?`☁ ${label} ✕`:`☁ ${label}${suffix}`;el.textContent=text;el.className='badge '+(syncUiState==='synced'?'ok':['offline','error','locked','incomplete'].includes(syncUiState)?'warn':'muted');el.title=syncUiState==='error'?(syncUiLastError||t('sync.badge.failed')):syncUiState==='synced'?t('sync.badge.success'):syncUiState==='connecting'?t('sync.badge.testing'):''}
function syncProviderFields(){const p=$('#sProvider')?.value||'none';$$('[data-sync-provider]').forEach(el=>{const allowed=el.dataset.syncProvider.split(',');el.hidden=!allowed.includes(p)});const note=$('#providerNote');if(note){const keys={none:'sync.note.none',nextcloud:'sync.note.nextcloud',webdav:'sync.note.webdav',google:'sync.note.google',icloud:'sync.note.icloud',onedrive:'sync.note.onedrive',dropbox:'sync.note.dropbox',box:'sync.note.box'};note.textContent=t(keys[p]||'sync.note.none')}}
function drawSync(){const c=settings.sync||{},shownUrl=normalizeServerUrl(c.url||''),b=$('#drawerBody');b.innerHTML=`<div class="card sync-card"><div class="form-grid"><label>${t('sync.provider')}</label><select id="sProvider"><option value="none" ${c.provider==='none'?'selected':''}>${esc(t('sync.none'))}</option><option value="nextcloud" ${c.provider==='nextcloud'?'selected':''}>Nextcloud</option><option value="webdav" ${c.provider==='webdav'?'selected':''}>WebDAV</option><option value="google" ${c.provider==='google'?'selected':''}>Google Drive</option><option value="icloud" ${c.provider==='icloud'?'selected':''}>Apple iCloud</option><option value="onedrive" ${c.provider==='onedrive'?'selected':''}>Microsoft OneDrive</option><option value="dropbox" ${c.provider==='dropbox'?'selected':''}>Dropbox</option><option value="box" ${c.provider==='box'?'selected':''}>Box</option></select>
<div class="sync-field" data-sync-provider="nextcloud,webdav"><label>${t('sync.serverUrl')}</label><input id="sUrl" inputmode="url" autocomplete="url" placeholder="https://cloud.example.de" value="${esc(shownUrl)}"></div><div class="sync-field" data-sync-provider="nextcloud,webdav"><label>${t('sync.user')}</label><input id="sUser" value="${esc(c.username||'')}"></div><div class="sync-field" data-sync-provider="nextcloud,webdav"><label>${t('sync.appPassword')}</label><input id="sPass" type="password" value="${esc(c.password||'')}"></div>
<div class="sync-field" data-sync-provider="nextcloud,webdav,google,icloud,onedrive,dropbox,box"><label>${t('sync.cloudFolder')}</label><input id="sPath" value="${esc(c.path||'VolleyTakt')}"></div>
<div class="sync-field" data-sync-provider="google"><label>Google OAuth Client-ID</label><input id="sClient" value="${esc(c.clientId||'')}"></div>
<div class="sync-field" data-sync-provider="onedrive"><label>Microsoft Client-ID</label><input id="sOneDriveClient" value="${esc(c.oneDriveClientId||'')}"></div>
<div class="sync-field" data-sync-provider="dropbox"><label>Dropbox App-Key</label><input id="sDropboxClient" value="${esc(c.dropboxClientId||'')}"></div>
<div class="sync-field" data-sync-provider="box"><label>Box Client-ID</label><input id="sBoxClient" value="${esc(c.boxClientId||'')}"></div>
<div class="sync-field" data-sync-provider="icloud"><label>CloudKit Container-ID</label><input id="sAppleContainer" placeholder="iCloud.…" value="${esc(c.appleContainerId||'')}"></div><div class="sync-field" data-sync-provider="icloud"><label>CloudKit API-Token</label><input id="sAppleToken" type="password" value="${esc(c.appleApiToken||'')}"></div><div class="sync-field" data-sync-provider="icloud"><label>${t('sync.environment')}</label><select id="sAppleEnvironment"><option value="production" ${c.appleEnvironment!=='development'?'selected':''}>Production</option><option value="development" ${c.appleEnvironment==='development'?'selected':''}>Development</option></select></div></div>
<p id="providerNote" class="small"></p><p class="small" data-sync-provider="nextcloud,webdav">${t('sync.httpsDefault')}</p><label><input id="sAutoStart" type="checkbox" ${c.autoStart?'checked':''}> ${t('sync.autoStart')}</label><br><label><input id="sAutoChange" type="checkbox" ${c.autoChange?'checked':''}> ${t('sync.autoChange')}</label><div class="toolbar mt"><button id="saveSync">${t('videoCut.save')}</button><button id="testSync">${t('videoCut.test')}</button><button id="runSync" class="primary">${t('sync.runNow')}</button></div><pre id="syncLog" class="sync-log">${t('sync.ready')}</pre></div>`;$('#sProvider').addEventListener('change',syncProviderFields);$('#sUrl')?.addEventListener('blur',e=>{e.currentTarget.value=normalizeServerUrl(e.currentTarget.value)});syncProviderFields();$('#saveSync').onclick=saveSyncSettings;$('#testSync').onclick=async()=>{saveSyncSettings();const l=$('#syncLog');try{l.textContent=t('sync.testing');await createProvider(settings.sync).test();l.textContent=t('sync.testSuccess');syncUiState='synced';updateSyncBadge()}catch(e){l.textContent='✕ '+e.message;syncUiState='error';syncUiLastError=e.message||String(e);updateSyncBadge()}};$('#runSync').onclick=async()=>{saveSyncSettings();const btn=$('#runSync');await withButtonBusy(btn,()=>runSync(true),t('sync.syncing'))}}
function saveSyncSettings(){const p=$('#sProvider')?.value||settings.sync?.provider||'none';settings.sync={...settings.sync,provider:p,url:$('#sUrl')?normalizeServerUrl($('#sUrl').value):settings.sync.url,path:$('#sPath')?.value.trim()||'VolleyTakt',username:$('#sUser')?.value.trim()||settings.sync.username||'',password:$('#sPass')?.value||settings.sync.password||'',clientId:$('#sClient')?.value.trim()||settings.sync.clientId||'',oneDriveClientId:$('#sOneDriveClient')?.value.trim()||settings.sync.oneDriveClientId||'',dropboxClientId:$('#sDropboxClient')?.value.trim()||settings.sync.dropboxClientId||'',boxClientId:$('#sBoxClient')?.value.trim()||settings.sync.boxClientId||'',appleContainerId:$('#sAppleContainer')?.value.trim()||settings.sync.appleContainerId||'',appleApiToken:$('#sAppleToken')?.value||settings.sync.appleApiToken||'',appleEnvironment:$('#sAppleEnvironment')?.value||settings.sync.appleEnvironment||'production',autoStart:$('#sAutoStart')?.checked??settings.sync.autoStart,autoChange:$('#sAutoChange')?.checked??settings.sync.autoChange};saveSettings(settings);syncUiState='ready';updateSyncBadge();setStatus(t('sync.settingsSaved'))}
async function runLiveSync(verbose=false){
 if(liveSyncBusy){liveSyncPending=true;return false}if(state.quickScoutDraft||!state.matchId||!['nextcloud','webdav'].includes(settings.sync?.provider))return true;
 liveSyncBusy=true;liveSyncPending=false;const log=verbose?$('#syncLog'):null;
 try{const r=await syncLiveSession(liveSyncPayload(),settings.sync,m=>{if(log)log.textContent=m;syncUiState='syncing';updateSyncBadge()});state.syncGeneration=r.generation||state.syncGeneration;saveState(state);archiveCurrentMatch(state.matchComplete?'ended':'active');syncUiState='synced';syncUiPending=0;updateSyncBadge();if(log)log.textContent=t('sync.liveDone',{count:r.eventCount||0});return true;}
 catch(e){syncUiState=['SESSION_LOCKED','SESSION_TAKEN_OVER','SESSION_LOCK_RACE'].includes(e.code)?'locked':'offline';syncUiLastError=e.message||String(e);updateSyncBadge();if(log)log.textContent='✕ '+e.message;if(['SESSION_LOCKED','SESSION_TAKEN_OVER','SESSION_LOCK_RACE'].includes(e.code))setStatus(e.message);if(e.code==='SESSION_TAKEN_OVER'){try{await refreshCloudLibrary(false);setStatus(t('sync.cloud.newer_title'));promptCloudVersionChoice(state.matchId,e.remote?await fetchCloudMatch(state.matchId,settings.sync):null,{allowLocalKeep:true})}catch(syncErr){setStatus(syncErr.message||String(syncErr))}}return false}
 finally{liveSyncBusy=false;if(liveSyncPending)clearTimeout(syncTimer),syncTimer=setTimeout(()=>runLiveSync(false),900)}
}
async function runSync(verbose=true){if(!settings.sync||settings.sync.provider==='none')return;const log=verbose?$('#syncLog'):null;try{master=await syncMaster(master,settings.sync,m=>{if(log)log.textContent=m;syncUiState='syncing';updateSyncBadge()});dedupeMatchTypes();saveMaster(master);if(['nextcloud','webdav'].includes(settings.sync.provider)){for(const snap of loadMatchArchive().filter(m=>m.matchId&&m.matchId!==state.matchId)){await syncStoredMatch({...snap,status:snap.status==='active'?'interrupted':snap.status},settings.sync,m=>{if(log)log.textContent=m})}}const liveOk=state.matchId&&['nextcloud','webdav'].includes(settings.sync.provider)?await runLiveSync(verbose):true;if(['nextcloud','webdav'].includes(settings.sync.provider))await refreshCloudLibrary(false);if(liveOk){syncUiState='synced';syncUiPending=0;updateSyncBadge();if(log)log.textContent=t('sync.done');setStatus(t('sync.successFull'))}render()}catch(e){syncUiState='error';syncUiLastError=e.message||String(e);updateSyncBadge();if(log)log.textContent='✕ '+e.message;setStatus(t('sync.failed',{error:e.message}))}}

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
 if(!navigator.onLine){if(interactive)setStatus(t('status.updateInternetRequired'));return null}
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
  if(interactive)setStatus(update?t('update.newStable',{version:latest}):t('update.noneFound'));
  return update
 }catch(e){if(interactive)setStatus(t('status.updateFailed',{error:e.message}));return null}
}
async function applyConfirmedUpdate(update){
 if(!update?.version)return;
 if(!confirm(t('update.confirm',{version:update.version})))return;
 try{
  createUpdateBackup(`confirmed-update-${APP_VERSION_ID}-to-${update.version}`);
  localStorage.setItem('volleytakt-pending-update',JSON.stringify({from:APP_VERSION_ID,to:update.version,confirmedAt:new Date().toISOString()}));
  setStatus(t('status.updatePreparing'));
  if('serviceWorker' in navigator){
    const reg=await navigator.serviceWorker.getRegistration();
    if(reg)await reg.update();
  }
  // Bestehenden Offline-Cache nicht vorab löschen. Erst ein erfolgreich
  // installierter neuer Service Worker ersetzt beim Aktivieren den alten Cache.
  setTimeout(()=>location.reload(),350);
 }catch(e){setStatus(t('update.prepareFailed',{error:e.message}))}
}
function updateCardHtml(){
 const u=settings.update?.available;
 const migrated=migrationReport?.migrated?` · ${t('update.migrated',{from:migrationReport.from,to:migrationReport.to})}`:'';
 return `<div class="card update-card"><h3>${t('settings.update')}</h3><p class="small">${t('settings.installed')}: <strong>${esc(APP_VERSION)}</strong>${migrated}</p><div class="toolbar"><button id="checkUpdateBtn">${t('settings.checkUpdate')}</button>${u?`<button id="applyUpdateBtn" class="primary">${t('update.apply',{version:esc(u.version)})}</button>`:''}</div><p id="updateInfo" class="small">${u?t('update.available',{version:esc(u.version)}):t('settings.updateDesc')}</p></div>`
}
function wireUpdateCard(){
 const c=$('#checkUpdateBtn');if(c)c.onclick=async()=>{const u=await checkForUpdate({interactive:true});drawSettings()};
 const a=$('#applyUpdateBtn');if(a)a.onclick=()=>applyConfirmedUpdate(settings.update?.available)
}


const VIDEO_JOB_KEY='volleytakt-video-worker-jobs-v1';
function videoCutProviderConfig(){return settings.videoCut?.providers?.['volleyvideo-worker']||{}}
function saveVideoCutSettingsFromUi(){
  const enabled=$('#videoCutEnabled')?.checked??settings.videoCut?.enabled??false,provider=$('#videoCutProvider')?.value||'volleyvideo-worker';
  const current=videoCutProviderConfig();
  settings.videoCut={...settings.videoCut,enabled,provider,providers:{...(settings.videoCut?.providers||{}),'volleyvideo-worker':{...current,baseUrl:normalizeWorkerBaseUrl($('#videoWorkerUrl')?.value||current.baseUrl||''),apiToken:$('#videoWorkerToken')?.value||current.apiToken||'',preferredProfile:$('#videoWorkerProfile')?.value||current.preferredProfile||'1080p-h264'}}};
  saveSettings(settings);return settings.videoCut.providers['volleyvideo-worker'];
}
function videoWorkerSummary(){const c=videoCutProviderConfig(),cap=c.lastCapabilities;if(!settings.videoCut?.enabled)return t('videoCut.disabled');if(!c.baseUrl)return t('videoCut.notConfigured');if(cap?.workerVersion)return `${settings.ui?.language==='en'?'reachable':'erreichbar'} · Worker ${cap.workerVersion} · API v${cap.apiVersion}`;return t('videoCut.configuredUntested')}
function drawVideoCutSettings(){
  const b=$('#drawerBody'),c=videoCutProviderConfig(),cap=c.lastCapabilities||{},profiles=Array.isArray(cap.outputProfiles)&&cap.outputProfiles.length?cap.outputProfiles:['1080p-h264'],storage=Array.isArray(cap.storage)?cap.storage:[];
  b.innerHTML=`<div class="drawer-subhead"><h3>${t('settings.videoCut')}</h3></div><div class="card video-cut-settings"><p class="small">${t('videoCut.optional')}</p><label class="switch-row"><span>${t('videoCut.enable')}</span><span class="switch"><input id="videoCutEnabled" type="checkbox" ${settings.videoCut?.enabled?'checked':''}><span class="slider"></span></span></label><label>${t('videoCut.provider')}<select id="videoCutProvider"><option value="volleyvideo-worker" selected>VolleyVideo-Worker</option></select></label><div id="videoWorkerFields"><label>${t('videoCut.server')}<input id="videoWorkerUrl" value="${esc(c.baseUrl||'')}" placeholder="https://volleyvideo.local"></label><label>${t('videoCut.token')}<input id="videoWorkerToken" type="password" autocomplete="off" value="${esc(c.apiToken||'')}"></label><label>${t('videoCut.profile')}<select id="videoWorkerProfile">${profiles.map(x=>`<option value="${esc(x)}" ${x===(c.preferredProfile||'1080p-h264')?'selected':''}>${esc(x)}</option>`).join('')}</select></label><div class="toolbar mt"><button id="saveVideoCut" class="primary">${t('videoCut.save')}</button><button id="testVideoWorker">${t('videoCut.test')}</button></div><pre id="videoWorkerStatus" class="sync-log">${esc(videoWorkerSummary())}</pre>${cap.apiVersion?`<div class="small worker-capabilities"><strong>${t('videoCut.capabilities')}</strong><br>Worker: ${esc(cap.workerVersion||'–')} · API: ${esc(cap.apiVersion||'–')}<br>Encoder: ${esc(cap.encoder||cap.hardwareMode||'–')} · Hardware: ${esc(cap.hardwareMode||'–')}<br>Storage: ${esc(storage.join(', ')||'–')}<br>Profile: ${esc(profiles.join(', '))}</div>`:''}</div><p class="small">${t('videoCut.localOnly')}</p><p class="small"><strong>${t('videoCut.lanHint')}</strong> ${t('videoCut.lanText')}</p></div>`;
  const syncFields=()=>{$('#videoWorkerFields').hidden=!$('#videoCutEnabled').checked};$('#videoCutEnabled').onchange=syncFields;syncFields();
  $('#saveVideoCut').onclick=()=>{saveVideoCutSettingsFromUi();setStatus(t('videoCut.saved'));drawVideoCutSettings()};
  $('#testVideoWorker').onclick=async e=>withButtonBusy(e.currentTarget,async()=>{const cfg=saveVideoCutSettingsFromUi(),log=$('#videoWorkerStatus');try{log.textContent=t('videoCut.testing');const result=await createVideoWorkerClient(cfg).test();settings.videoCut.providers['volleyvideo-worker']={...cfg,lastCapabilities:result.capabilities,lastTestedAt:new Date().toISOString()};saveSettings(settings);log.textContent=t('videoCut.reachable',{worker:result.capabilities?.workerVersion||'–',api:result.capabilities?.apiVersion||1});drawVideoCutSettings()}catch(error){log.textContent=`✕ ${error.message}`;setStatus(error.message)}},t('videoCut.testingShort'));
}
function loadVideoJobs(){try{return JSON.parse(localStorage.getItem(VIDEO_JOB_KEY)||'[]')}catch{return []}}
function saveVideoJobs(rows){try{localStorage.setItem(VIDEO_JOB_KEY,JSON.stringify((rows||[]).slice(0,20)))}catch{}}
function upsertVideoJob(row){const rows=loadVideoJobs(),i=rows.findIndex(x=>x.jobId===row.jobId);if(i>=0)rows[i]={...rows[i],...row};else rows.unshift(row);saveVideoJobs(rows)}
async function downloadWorkerResult(client,jobId,filename){const response=await client.getResult(jobId);if(response instanceof Response){const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=safeVideoFilename(filename||'VolleyTakt_Video.mp4');document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);return true}return false}
function pollVideoJob(jobId,cfg,filename){const client=createVideoWorkerClient(cfg);let attempts=0;const tick=async()=>{attempts++;try{const job=await client.getJob(jobId),state=job.state||job.status||'processing',progress=Number(job.progress);upsertVideoJob({jobId,state,progress:Number.isFinite(progress)?progress:null,filename,updatedAt:new Date().toISOString()});if(state==='completed'){setStatus(t('status.videoComplete',{filename}));if(confirm(t('status.videoDownloadConfirm',{filename}))){try{await downloadWorkerResult(client,jobId,filename)}catch(e){setStatus(e.message)}}return}if(['failed','cancelled'].includes(state)){setStatus(job.error?.message||job.message||`Videoauftrag ${state}.`);return}setStatus(t('status.videoRendering',{progress:Number.isFinite(progress)?`${Math.round(progress)} %`:state}));if(attempts<720)setTimeout(tick,document.hidden?10000:3000)}catch(error){setStatus(t('status.videoStatusUnavailable',{error:error.message}));if(attempts<720)setTimeout(tick,10000)}};setTimeout(tick,1200)}
function selectionDescription(selection){const clips=selection?.clips||[],players=[...new Set(clips.map(c=>c.player).filter(Boolean))],actions=[...new Set(clips.map(c=>c.action).filter(Boolean))],positions=[...new Set(clips.map(c=>c.position||c.zone).filter(Boolean))];const parts=[];if(players.length===1)parts.push(players[0]);if(actions.length===1)parts.push(actions[0]);if(positions.length===1)parts.push(`P${positions[0]}`);return parts.length?parts.join(' · '):`${clips.length} ausgewählte Aktionen`}
function openVideoCutDialog(selection){
  if(!settings.videoCut?.enabled){setStatus(t('status.videoCutDisabled'));openDrawer('videocut');return}
  if(settings.videoCut?.provider!=='volleyvideo-worker'){setStatus(t('videoCut.noProvider'));openDrawer('videocut');return}
  const cfg=videoCutProviderConfig();if(!cfg.baseUrl){setStatus(t('status.videoWorkerAddressRequired'));openDrawer('videocut');return}
  const clips=selection?.clips||[],matches=selection?.matches||[...new Map(clips.map(c=>[c.matchId,c.sourceEvent?._match]).filter(x=>x[0])).values()].filter(Boolean),af=selection?.analysisFilters||{},contextFilters={technique:af.Technique||null,sourcePosition:af.Position?`P${af.Position}`:null,rotation:af.Rotation||null,set:af.Set||null,seasonId:af.Season||null,teamId:af.Team||null,opponentId:af.Opponent||null,matchTypeId:af.Type||null,from:af.From||null,to:af.To||null},context=buildSelectionContext({clips,matches,filters:contextFilters,description:selectionDescription(selection)}),suggested=proposeVideoFilename(context),profiles=cfg.lastCapabilities?.outputProfiles?.length?cfg.lastCapabilities.outputProfiles:[cfg.preferredProfile||'1080p-h264'];
  modal('Aus Auswahl Video erzeugen',`<p><strong>${clips.length}</strong> ausgewählte Aktion(en)</p><div class="form-grid"><label>Vorlauf in Sekunden</label><input name="preRoll" type="number" min="0" step="0.1" value="3.0"><label>Nachlauf in Sekunden</label><input name="postRoll" type="number" min="0" step="0.1" value="2.0"><label>Dateiname</label><input name="filename" value="${esc(suggested)}"><label>Ausgabeprofil</label><select name="profile">${profiles.map(x=>`<option value="${esc(x)}" ${x===(cfg.preferredProfile||'1080p-h264')?'selected':''}>${esc(x)}</option>`).join('')}</select></div><p class="small">Der VolleyVideo-Worker verwendet ausschließlich Processing-Quellen. YouTube bleibt davon unabhängig als Wiedergabequelle erhalten.</p>`,fd=>{const manifest=buildVideoCutManifest(selection,{selectionContext:context,preRollSeconds:Number(fd.get('preRoll')),postRollSeconds:Number(fd.get('postRoll')),filename:String(fd.get('filename')||suggested),profile:String(fd.get('profile')||cfg.preferredProfile||'1080p-h264')}),problem=validateVideoCutManifest(manifest);if(problem)throw new Error(problem);const filename=manifest.output.filename||suggested;setStatus('Videoauftrag wird an den VolleyVideo-Worker gesendet …');createVideoWorkerClient(cfg).createJob(manifest).then(job=>{const jobId=job.jobId||job.id;if(!jobId)throw new Error('Worker hat keine jobId zurückgegeben.');upsertVideoJob({jobId,state:job.state||'queued',filename,createdAt:new Date().toISOString()});setStatus(`Videoauftrag gestartet · ${jobId}`);pollVideoJob(jobId,cfg,filename)}).catch(error=>setStatus(`Videoauftrag fehlgeschlagen: ${error.message}`))},'Video erzeugen');
}

window.addEventListener('volleytakt:create-video',event=>openVideoCutDialog(event.detail?.selection));

function drawSettings(){const b=$('#drawerBody');b.innerHTML=`
<div class="settings-grid settings-grid-uniform">
<div class="card settings-grid-card settings-form-card"><h3>${t('settings.language')} <span class="preview-pill">${APP_VERSION}</span></h3><div class="settings-card-body"><label>${t('settings.displayLanguage')} <select id="uiLanguage"><option value="de" ${settings.ui.language!=='en'?'selected':''}>Deutsch</option><option value="en" ${settings.ui.language==='en'?'selected':''}>English</option></select></label><p class="small">${t('settings.languageInfo').replace('VolleyTakt Live',APP_VERSION)}</p></div><div class="toolbar settings-card-actions"><button id="saveLanguage">${t('settings.saveLanguage')}</button></div></div>
<div class="card settings-grid-card settings-form-card"><h3>${t('settings.scouting')}</h3><div class="settings-card-body"><div class="settings-scout-grid"><div class="settings-scout-options"><label><input id="setAutoRotate" type="checkbox" ${state.autoRotate?'checked':''}> ${t('settings.autoRotate')}</label><label><input id="setPosOnly" type="checkbox" ${state.allowPositionOnly?'checked':''}> ${t('settings.allowUnassigned')}</label><label><input id="setOpp" type="checkbox" ${state.opponentCapture?'checked':''}> ${t('settings.opponentScouting')}</label></div><label class="settings-player-sort"><span>${t('settings.playerSort')}</span><select id="playerSort"><option value="jersey" ${settings.ui.playerSort==='jersey'?'selected':''}>${t('settings.jerseyNumber')}</option><option value="abbreviation" ${settings.ui.playerSort==='abbreviation'?'selected':''}>${t('settings.abbreviation')}</option><option value="firstName" ${settings.ui.playerSort==='firstName'?'selected':''}>${t('settings.firstName')}</option></select></label></div><p class="small">${t('settings.playerSortHelp')}</p></div><div class="toolbar settings-card-actions"><button id="saveGeneral" class="primary">${t('common.save')}</button></div></div>
<button type="button" id="syncSettingsBtn" class="card settings-grid-card settings-nav-card"><span class="settings-nav-icon">☁️</span><span><strong>${t('settings.cloud')}</strong><small>${t('settings.cloudDesc')}</small></span></button>
<button type="button" id="videoCutSettingsBtn" class="card settings-grid-card settings-nav-card"><span class="settings-nav-icon">🎬</span><span><strong>${t('settings.videoCut')}</strong><small>${t('settings.videoCutDesc')} · ${esc(videoWorkerSummary())}</small></span></button>
<button type="button" id="shortcutSettingsBtn" class="card settings-grid-card settings-nav-card"><span class="settings-nav-icon">⌨️</span><span><strong>${t('settings.controls')}</strong><small>${t('settings.controlsDesc')}</small></span></button>
<div class="card settings-grid-card settings-action-card"><div><h3>${t('settings.update')}</h3><p class="small">${t('settings.installed')}: <strong>${esc(APP_VERSION)}</strong>${migrationReport?.migrated?` · ${t('update.migrated',{from:migrationReport.from,to:migrationReport.to})}`:''}</p><p id="updateInfo" class="small">${settings.update?.available?t('update.available',{version:esc(settings.update.available.version)}):t('settings.updateDesc')}</p></div><div class="toolbar settings-card-actions"><button id="checkUpdateBtn">${t('settings.checkUpdate')}</button>${settings.update?.available?`<button id="applyUpdateBtn" class="primary">${t('update.apply',{version:esc(settings.update.available.version)})}</button>`:''}</div></div>
<button type="button" id="aboutSettingsBtn" class="card settings-grid-card settings-nav-card"><span class="settings-nav-icon">ℹ️</span><span><strong>${t('settings.about')}</strong><small>${t('settings.aboutDesc')}</small></span></button>
<div class="card settings-grid-card settings-info-card"><span class="settings-nav-icon">💻</span><span><strong>${t('settings.platform')}</strong><small>${t('settings.platformDesc')}</small></span></div>
</div>`;
$('#saveLanguage').onclick=()=>{settings.ui.language=$('#uiLanguage').value==='en'?'en':'de';saveSettings(settings);setLanguage(settings.ui.language);render();drawSettings();renderStartupCameraNotice();setStatus(t('settings.savedLanguage'));};
$('#saveGeneral').onclick=()=>{state.autoRotate=$('#setAutoRotate').checked;state.allowPositionOnly=$('#setPosOnly').checked;state.opponentCapture=$('#setOpp').checked;if(!state.opponentCapture)state.activeTeamContext='own';settings.ui.playerSort=$('#playerSort')?.value||'jersey';saveSettings(settings);persist();render();setStatus(t('common.save')+' ✓')};
wireUpdateCard();$('#syncSettingsBtn').onclick=()=>openDrawer('sync');$('#videoCutSettingsBtn').onclick=()=>openDrawer('videocut');$('#shortcutSettingsBtn').onclick=()=>openDrawer('shortcuts');$('#aboutSettingsBtn').onclick=()=>openDrawer('about');
}

function drawAbout(){const b=$('#drawerBody');b.innerHTML=`<div class="drawer-subhead"><h3>${t('about.title')}</h3></div><div class="card about-card"><div class="about-version">VolleyTakt Live ${APP_VERSION}</div><div class="about-meta"><div>Livescouting-WebApp / PWA · ${APP_VERSION}</div><div>${t('about.localCloud')}</div></div><div class="about-copyright small"><strong>${t('about.copyright')}</strong><br>${t('about.licenseUse')}<br>${esc(t('legal.ai_notice'))}</div><div class="about-license small"><strong>${t('about.licenses')}</strong><br>${t('about.media')}</div></div>`;}

function configuredShortcutActionForKey(key){return shortcutActionForKey(settings.shortcuts||{},key)}
function drawShortcutSettings(){
 const b=$('#drawerBody');
 const rows=Object.keys(SHORTCUT_LABEL_KEYS).map(id=>{const label=shortcutKeyLabel(id);return `<label class="shortcut-row"><span>${esc(label)}</span><input class="shortcut-input" data-shortcut="${id}" value="${esc(shortcutKeyLabel(settings.shortcuts[id]||''))}" readonly aria-label="${esc(t('shortcuts.aria',{label}))}"></label>`}).join('');
 b.innerHTML=`<div class="drawer-subhead"><button id="shortcutsBack">← ${t('nav.settings')}</button><h3>${t('drawer.shortcuts').replace(/^⌨️\s*/, '')}</h3></div><div class="card"><p class="small">${t('shortcuts.help')}</p><div class="shortcut-list">${rows}</div><div id="shortcutError" class="form-error" hidden></div><div class="toolbar mt"><button id="saveShortcuts" class="primary">${t('shortcuts.save')}</button><button id="resetShortcuts">${t('shortcuts.reset')}</button></div></div>`;
 $('#shortcutsBack').onclick=drawerBack;$$('.shortcut-input').forEach(inp=>{inp.onkeydown=e=>{e.preventDefault();e.stopPropagation();if(['Tab','Shift','Control','Alt','Meta'].includes(e.key))return;const k=normalizeShortcutKey(e.key);inp.value=shortcutKeyLabel(k);inp.dataset.value=k;validateShortcutInputs()};inp.onclick=()=>inp.select?.()});
 $('#saveShortcuts').onclick=()=>{if(!validateShortcutInputs())return;const next={};$$('.shortcut-input').forEach(inp=>next[inp.dataset.shortcut]=inp.dataset.value||normalizeShortcutKey(inp.value));settings.shortcuts={...DEFAULT_SHORTCUTS,...next};saveSettings(settings);setStatus(t('shortcuts.saved'));drawShortcutSettings()};
 $('#resetShortcuts').onclick=()=>{settings.shortcuts={...DEFAULT_SHORTCUTS};saveSettings(settings);drawShortcutSettings();setStatus(t('shortcuts.restored'))};
}
function validateShortcutInputs(){const inputs=$$('.shortcut-input'),seen=new Map(),dups=[];for(const inp of inputs){const k=inp.dataset.value||normalizeShortcutKey(inp.value);inp.dataset.value=k;inp.classList.remove('invalid');if(!k)continue;if(seen.has(k)){dups.push([seen.get(k),inp,k])}else seen.set(k,inp)}for(const [a,b] of dups){a.classList.add('invalid');b.classList.add('invalid')}const box=$('#shortcutError');if(box){box.hidden=!dups.length;box.textContent=dups.length?t('shortcuts.duplicate',{items:[...new Set(dups.map(x=>shortcutKeyLabel(x[2])))].join(', ')}):''}return !dups.length}

function drawHelp(anchor=''){const b=$('#drawerBody'),help=helpContent(settings.ui?.language||'de');const section=(id,item)=>`<section id="help-${id}" class="help-section"><h3>${item.title}</h3>${item.html}${id==='about'?`<p>${esc(t('legal.ai_notice'))}</p>`:''}<a class="help-back" href="#help-toc">${t('help.backToc')}</a></section>`;const ids=['quickstart','prepare','scout','rally','sets','sub','quality','shortcuts','camera','sync','data','analysis','settings','about'];b.innerHTML=`<div class="drawer-subhead"><h3>${t('help.title')}</h3></div><article class="help-doc"><div id="help-toc" class="card help-toc"><h3>${t('help.contents')}</h3><div class="help-start-actions"><button id="helpTourStart" class="primary">${t('help.startTour')}</button><button id="helpTourReset">${t('help.resetTour')}</button><a class="help-quickstart-button" href="#help-quickstart">${t('help.quickStart')}</a></div><nav><a href="#help-quickstart">${t('help.toc.quick')}</a><a href="#help-prepare">${t('help.toc.prepare')}</a><a href="#help-scout">${t('help.toc.scout')}</a><a href="#help-rally">${t('help.toc.rally')}</a><a href="#help-sets">${t('help.toc.sets')}</a><a href="#help-sub">${t('help.toc.sub')}</a><a href="#help-quality">${t('help.toc.quality')}</a><a href="#help-shortcuts">${t('help.toc.shortcuts')}</a><a href="#help-camera">${t('help.toc.camera')}</a><a href="#help-sync">${t('help.toc.sync')}</a><a href="#help-data">${t('help.toc.data')}</a><a href="#help-analysis">${t('help.toc.analysis')}</a><a href="#help-settings">${t('help.toc.settings')}</a><a href="#help-about">${t('help.toc.about')}</a></nav></div>${ids.map(id=>section(id,help[id])).join('')}</article>`;$('#helpTourStart').onclick=()=>{closeDrawer();startTour(true)};$('#helpTourReset').onclick=()=>{settings.ui.tourDismissedVersion='';saveSettings(settings);updateStartQuickVisibility();setStatus(t('help.tourResetStatus'));};if(anchor)requestAnimationFrame(()=>$('#help-'+anchor)?.scrollIntoView({block:'start'}));}

let tourRepositionHandler=null;
function updateStartQuickVisibility(){const b=$('#startQuickBtn');if(!b)return;const decided=!!settings.ui?.tourDismissedVersion;b.hidden=decided;b.setAttribute('aria-hidden',decided?'true':'false')}
function maybeStartTour(){updateStartQuickVisibility();if(settings.ui?.tourDismissedVersion===TOUR_VERSION)return;startTour(false)}
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
  const overlay=$('#tourOverlay');if(!overlay)return;let i=0;overlay.hidden=false;overlay.dataset.manual=manual?'1':'0';updateOverlayUiState();
  const show=()=>{clearTourHighlight();const step=TOUR_STEPS[i],target=step.sel?$(step.sel):null;if(target&&target.isConnected&&target.getClientRects().length){target.classList.add('tour-highlight');target.scrollIntoView?.({block:'nearest',inline:'nearest',behavior:'instant'})}$('#tourStep').textContent=`${i+1} / ${TOUR_STEPS.length}`;$('#tourTitle').textContent=t(step.titleKey);$('#tourText').textContent=t(step.textKey);$('#tourPrev').disabled=i===0;$('#tourNext').textContent=i===TOUR_STEPS.length-1?t('help.done'):t('help.next');requestAnimationFrame(()=>requestAnimationFrame(()=>placeTourCard(target)))};
  $('#tourPrev').onclick=()=>{if(i>0){i--;show()}};$('#tourNext').onclick=()=>{if(i<TOUR_STEPS.length-1){i++;show()}else stopTour(false)};$('#tourClose').onclick=()=>stopTour(false);$('#tourDontShow').onclick=()=>{settings.ui.tourDismissedVersion=TOUR_VERSION;saveSettings(settings);updateStartQuickVisibility();stopTour(true)};
  if(tourRepositionHandler)window.removeEventListener('resize',tourRepositionHandler);tourRepositionHandler=()=>{const step=TOUR_STEPS[i];placeTourCard(step.sel?$(step.sel):null)};window.addEventListener('resize',tourRepositionHandler,{passive:true});window.addEventListener('orientationchange',tourRepositionHandler,{passive:true});show()
}
function stopTour(dismissed=false){clearTourHighlight();const o=$('#tourOverlay');if(o)o.hidden=true;updateOverlayUiState();if(tourRepositionHandler){window.removeEventListener('resize',tourRepositionHandler);window.removeEventListener('orientationchange',tourRepositionHandler);tourRepositionHandler=null}if(dismissed)setStatus(t('help.tourDone'))}


async function openQuickStartFromGate(){await start({skipAutoTour:true});requestAnimationFrame(()=>requestAnimationFrame(()=>startTour(true)))}
function openQuickStartFromApp(){openDrawer('help');drawHelp('quickstart')}

function setActiveTeamContext(side){
 side=side==='opponent'?'opponent':'own';
 if(side==='opponent'&&!matchConfigured()){state.activeTeamContext='own';render();setStatus(t('status.configureMatchFirst'));return}
 if(side==='opponent'&&!state.opponentCapture){
  side='own';setStatus(t('status.opponentScoutingDisabled'))
 }
 state.activeTeamContext=side;
 state.selectedPos=0;state.selectedOppPos=0;state.pendingSide=null;state.pendingAction=null;state.pendingQuality=null;state.inputStep='WER';state.selectedPlayerId='';state.selectedPlayerPos=0;state.actionZone=0;state.targetZone=0;state.targetSide='';state.actionStartedSeconds=null;state.actionStartedAt='';state.setTempo='';state.setDistance='';state.serveTechnique='';state.autoServePreset=false;
 if(side==='own'&&state.servingSide==='us')prepareOwnServePreset();persist();render();
 const ri=rotationIndexForSide(side);
 setStatus(`${side==='opponent'?'Gegner':'Eigenes Team'} aktiv · ${ROT[ri]||'R1'} · ${qualityProfileForSide(side)==='datavolley_6'?'detailliert':'kompakt'}.`)
}

let deferredInstallPrompt=window.__VSW_DEFERRED_INSTALL_PROMPT__||null;
function isStandaloneDisplay(){return !!(window.matchMedia?.('(display-mode: standalone)')?.matches||window.matchMedia?.('(display-mode: fullscreen)')?.matches||window.navigator.standalone===true)}
function pwaInstallHelpText(){
 const ua=navigator.userAgent||'';
 if(/Firefox/i.test(ua))return 'Firefox: Browsermenü öffnen und „Installieren“ bzw. „Zum Startbildschirm hinzufügen“ wählen. Firefox stellt nicht auf jedem Gerät einen direkt auslösbaren Installationsdialog bereit.';
 if(/SamsungBrowser/i.test(ua))return 'Samsung Internet: Browsermenü öffnen und „Seite hinzufügen zu“ / „Startbildschirm“ bzw. „Web-App installieren“ wählen, falls kein direkter Dialog angeboten wird.';
 if(/Chrome|Chromium|CriOS/i.test(ua))return 'Chrome: Falls kein direkter Installationsdialog erscheint, Browsermenü öffnen und „App installieren“ bzw. „Zum Startbildschirm hinzufügen“ wählen.';
 return 'Browsermenü öffnen und die Funktion „Installieren“ bzw. „Zum Startbildschirm hinzufügen“ wählen.';
}
function mobileInstallContext(){
 const vv=window.visualViewport;
 const w=Math.max(1,Math.round(vv?.width||window.innerWidth||document.documentElement.clientWidth||1280));
 const h=Math.max(1,Math.round(vv?.height||window.innerHeight||document.documentElement.clientHeight||720));
 const shortSide=Math.min(w,h);
 const coarse=!!window.matchMedia?.('(pointer: coarse)')?.matches;
 const noHover=!!window.matchMedia?.('(hover: none)')?.matches;
 // PWA1: install entry is a mobile/tablet UX feature. Do not expose it on
 // normal desktop/laptop viewports even when the desktop browser can install PWAs.
 return (coarse||noHover||navigator.maxTouchPoints>0) && shortSide<=1024;
}
function updatePwaInstallUi(){
 const btn=$('#pwaInstallBtn'),hint=$('#pwaInstallHint');if(!btn)return;
 const installed=isStandaloneDisplay();
 const mobile=mobileInstallContext();
 btn.hidden=installed||!mobile;btn.disabled=false;
 if(hint && (installed||!mobile))hint.hidden=true;
}
async function requestPwaInstall(){
 const btn=$('#pwaInstallBtn'),hint=$('#pwaInstallHint');
 deferredInstallPrompt=deferredInstallPrompt||window.__VSW_DEFERRED_INSTALL_PROMPT__||null;
 if(deferredInstallPrompt){
  try{deferredInstallPrompt.prompt();const choice=await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;window.__VSW_DEFERRED_INSTALL_PROMPT__=null;if(hint)hint.hidden=true;setStatus(choice?.outcome==='accepted'?'Installation gestartet.':'Installation nicht gestartet.');updatePwaInstallUi();return}catch(_e){deferredInstallPrompt=null}
 }
 if(hint){hint.textContent=pwaInstallHelpText();hint.hidden=false}
}
function fullscreenAvailable(){return !!(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen)}
function isFullscreen(){return !!(document.fullscreenElement||document.webkitFullscreenElement)}
function updateMobileFullscreenButton(){
 const btn=$('#phoneFullscreenBtn');if(!btn)return;
 btn.hidden=isStandaloneDisplay()||!fullscreenAvailable()||isFullscreen();
}
async function requestMobileFullscreen(){
 try{const el=document.documentElement;const fn=el.requestFullscreen||el.webkitRequestFullscreen;if(fn)await fn.call(el)}catch(_e){}
 updateMobileFullscreenButton();
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
 const ios=/iP(?:hone|ad|od)/i.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 root.classList.toggle('platform-ios',ios);
 root.style.setProperty('--vsw-vw',`${w}px`);
 root.style.setProperty('--vsw-vh',`${h}px`);
 root.style.setProperty('--vsw-scale',uiScale.toFixed(3));
 root.style.setProperty('--vsw-hscale',uiScale.toFixed(3));
 root.style.setProperty('--vsw-ui-scale',uiScale.toFixed(3));
 root.classList.toggle('viewport-compact',w<1120 || uiScale<.78);
 root.classList.toggle('viewport-low',h<760 || uiScale<.82);
 root.classList.toggle('viewport-browser-low',h<840 || uiScale<.88);
 root.classList.toggle('viewport-mobile-start',mobileInstallContext());
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
 wireDeviceLayout();
 updateStartQuickVisibility();$('#startAppBtn').onclick=start;$('#startQuickBtn').onclick=openQuickStartFromGate;$('#pwaInstallBtn').onclick=requestPwaInstall;$('#phoneFullscreenBtn').onclick=requestMobileFullscreen;$('#menuBtn').onclick=()=>openDrawer('match');$('#matchSetupBtn').onclick=()=>openDrawer('match');$('#mainQuickStartBtn').onclick=openQuickStartFromApp;$$('#drawerNav button[data-view]').forEach(b=>b.onclick=()=>openDrawer(b.dataset.view,{resetHistory:true}));$('#drawerBack').onclick=drawerBack;$('#drawerClose').onclick=closeDrawer;$('#drawerBackdrop').onclick=e=>{if(e.target===$('#drawerBackdrop'))closeDrawer()};$('#dialogCancel').onclick=closeModal;$('#dialogBackdrop').onclick=e=>{if(e.target===$('#dialogBackdrop'))closeModal()};$('#modalForm').onsubmit=e=>{e.preventDefault();try{const f=new FormData(e.currentTarget);modalSubmit?.(f);closeModal(false);render()}catch(err){setStatus(err.message);alert(err.message)}};
 $('#phoneProtocolBtn').onclick=()=>document.body.classList.add('phone-protocol-open');$('#phoneProtocolClose').onclick=()=>document.body.classList.remove('phone-protocol-open');window.addEventListener('vsw-install-available',()=>{deferredInstallPrompt=window.__VSW_DEFERRED_INSTALL_PROMPT__||deferredInstallPrompt;updatePwaInstallUi()});window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;window.__VSW_DEFERRED_INSTALL_PROMPT__=null;updatePwaInstallUi()});window.addEventListener('vsw-device-layout-change',updatePwaInstallUi);document.addEventListener('fullscreenchange',updateMobileFullscreenButton);document.addEventListener('webkitfullscreenchange',updateMobileFullscreenButton);document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateMobileFullscreenButton()});window.addEventListener('pageshow',updateMobileFullscreenButton);window.addEventListener('resize',updateMobileFullscreenButton,{passive:true});updatePwaInstallUi();updateMobileFullscreenButton();
 $('#mainRecordStart').onclick=startRecording;$('#mainRecordStop').onclick=stopRecording;$('#serveStateBtn').onclick=cycleServing;$('#clockStartBtn').onclick=toggleLocalClock;$('#rotateBtn').onclick=()=>rotate(1,true);$('#rotateBackBtn').onclick=()=>rotate(-1,true);$('#sideoutBtn').onclick=sideout;$('#substituteBtn').onclick=()=>beginPlayerChange('substitution');$('#liberoBtn').onclick=()=>beginPlayerChange('libero');$('#undoBtn').onclick=undo;$('#redoBtn').onclick=redo;$('#clearSelectionBtn').onclick=()=>{playerChangeMode=null;clearPending()};$$('[data-score]').forEach(b=>b.onclick=()=>award(b.dataset.score==='us'?'us':'them','',false));
 $('#correctScoreBtn').onclick=()=>modal('Spiel korrigieren',`<label>Satz <input name="set" type="number" min="1" max="5" value="${state.setNo}"></label><label>Punkte Wir <input name="us" type="number" min="0" value="${state.scoreUs}"></label><label>Punkte Gegner <input name="them" type="number" min="0" value="${state.scoreThem}"></label><label>Sätze Wir <input name="setsUs" type="number" min="0" max="5" value="${state.setWinsUs}"></label><label>Sätze Gegner <input name="setsThem" type="number" min="0" max="5" value="${state.setWinsThem}"></label><label>Grund <input name="reason"></label>`,async fd=>{const old=`${state.scoreUs}:${state.scoreThem}`;state.setNo=Math.min(5,Math.max(1,+fd.get('set')||1));state.scoreUs=Math.max(0,+fd.get('us')||0);state.scoreThem=Math.max(0,+fd.get('them')||0);state.setWinsUs=Math.min(5,Math.max(0,+fd.get('setsUs')||0));state.setWinsThem=Math.min(5,Math.max(0,+fd.get('setsThem')||0));state.matchComplete=state.matchMode==='fixed'?state.setNo>configuredSetLimit()||state.setWinsUs+state.setWinsThem>=configuredSetLimit():state.setWinsUs>=3||state.setWinsThem>=3;if(state.matchComplete)await stopLiveTimeAtBoundary();await appendEvent('','','Spielstandskorrektur',`${old}->${state.scoreUs}:${state.scoreThem}`,fd.get('reason').trim(),{event_type:'score_correction',set_wins_us:String(state.setWinsUs),set_wins_them:String(state.setWinsThem)});render()});
 $('#opponentToggle').onchange=()=>setActiveTeamContext($('#opponentToggle').checked?'opponent':'own');
 $('#fieldOrientationBtn').onclick=()=>{
  if(state.pendingSide){setStatus(t('status.fieldOrientationPending'));return}
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
  if(events.length){toggle.checked=true;setStatus(t('status.quickCannotDisable'));return}
  const keepOrientation=state.fieldOrientation||'activeBottom';
  state={...defaultState,fieldOrientation:keepOrientation};events=[];await csv.write(events);saveState(state);render();setStatus(t('status.quickStopped'));
 };
 $('#detailedQualityToggle').onchange=()=>{
  if(state.pendingSide&&!state.autoServePreset){$('#detailedQualityToggle').checked=detailedCapture(state.pendingSide);setStatus(t('status.modeChangePending'));return}
  const side=state.activeTeamContext==='opponent'?'opponent':'own';
  const profile=$('#detailedQualityToggle').checked?'datavolley_6':'basic_5';
  if(side==='opponent')state.opponentQualityProfile=profile;else state.ownQualityProfile=profile;
  if(state.autoServePreset&&state.pendingSide===side)state.captureQualityProfile=profile;
  state.pendingQuality=null;state.serveTechnique='';state.setTempo='';state.setDistance='';
  persist();render();
  setStatus(`${side==='opponent'?'Gegner':'Eigenes Team'}: ${profile==='datavolley_6'?'detailliertes Scouting · P1–P9 · DataVolley-orientierte Bewertung':'normales Scouting · P1–P6 · kompakte Bewertung'}.`)
 };
 for(const a of ACTIONS){const b=document.createElement('button');b.className='technique-button';b.innerHTML=`<span class="technique-icon"><img src="${ACTION_ICON_FILES[a]}?v=${TECHNIQUE_ICON_REV}" alt="" aria-hidden="true"></span><span class="technique-label">${esc(actionLabel(a))}</span>`;b.dataset.action=a;b.setAttribute('aria-label',actionLabel(a));b.onclick=()=>chooseAction(a);$('#actionButtons').appendChild(b)}renderQualityButtons()
 $('#csvImport').onchange=async e=>{const f=e.target.files[0];if(!f)return;events=migrateEventPlayerIds(parseCsv(await f.text()).map(r=>({...r,id:newId('evt'),createdAt:now()})));migrateRallyMetadata(events);inferImportedQualityProfiles(events);reconstruct(events);await csv.write(events);render();setStatus(t('import.csvLoaded',{count:events.length}));e.target.value=''};
 $('#jsonImport').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const v=JSON.parse(await f.text());if(!v.master)throw new Error(t('import.masterMissing'));master={...master,...v.master};dedupeMatchTypes();saveMaster(master);render();setStatus(t('import.masterDone'))}catch(err){alert(err.message)}e.target.value=''};
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
  if(routed.command===COMMANDS.SELECT_QUALITY){const allowed=QUALITY_PROFILES[qualityProfileForSide(currentCaptureSide())]||[];if(allowed.includes(routed.quality))chooseQuality(routed.quality);else setStatus(t('status.ratingUnavailable',{value:routed.quality}));return}
  if(routed.command===COMMANDS.AWARD_POINT_US){award('us',`Tastenkürzel ${settings.shortcuts[shortcutAction]}`,false);return}
  if(routed.command===COMMANDS.AWARD_POINT_THEM){award('them',`Tastenkürzel ${settings.shortcuts[shortcutAction]}`,false);return}
  if(routed.command===COMMANDS.SUBSTITUTION){beginPlayerChange('substitution');return}
  if(routed.command===COMMANDS.LIBERO){beginPlayerChange('libero');return}
  if(routed.command===COMMANDS.ROTATE){rotate(routed.direction||1,true);return}
  if(routed.command===COMMANDS.UNDO){undo();return}
 });setInterval(()=>{const sec=currentSeconds();$('#liveClock').textContent=fmt(sec);$('#clockMode').textContent=camera?.protocolConnected?(state.cameraRecording?`${cameraShortName()} REC`:`${cameraShortName()} bereit`):state.localClockRunning?'lokal':sec>0?'lokal pausiert':'lokal bereit';if($('#cameraTime'))$('#cameraTime').textContent=fmt(sec);if($('#mainCameraTime'))$('#mainCameraTime').textContent=fmt(sec);updateCameraUi(false)},500);
 setInterval(()=>{if(settings.sync?.autoChange&&state.matchId&&navigator.onLine)runLiveSync(false)},10000);window.addEventListener('online',()=>runSync(false));if(settings.sync?.autoStart&&navigator.onLine)setTimeout(()=>runSync(false),1200);
 wireClockPress($('#clockStartBtn'));
 document.addEventListener('pointerdown',e=>{edgeSwipeRouter.pointerDown(e)});document.addEventListener('pointerup',e=>{if(edgeSwipeRouter.pointerUp(e))openDrawer('match')});
 if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js?v=0.4.2-final-r1',{updateViaCache:'none'}).catch(()=>{});if(navigator.onLine)setTimeout(()=>checkForUpdate({interactive:false}),1800);
}
try{wireViewportLayout();wire();renderStartupCameraNotice();const resumed=restoreSessionAfterReload();render();if(migrationReport?.blocked)setStatus(migrationReport.message?tr(migrationReport.message):t('status.migrationPaused'));else if(resumed)setStatus(t('status.sessionResumed',{setsUs:state.setWinsUs,setsThem:state.setWinsThem,scoreUs:state.scoreUs,scoreThem:state.scoreThem,rotation:ROT[rotationIndexForSide(activeSide())]||'R1'}));window.__VSW_APP_READY__=true;window.dispatchEvent(new CustomEvent('vsw-app-ready'));}catch(err){console.error('VolleyTaktLive Initialisierung fehlgeschlagen',err);window.__VSW_APP_ERROR__=String(err?.stack||err?.message||err);window.dispatchEvent(new CustomEvent('vsw-app-error',{detail:window.__VSW_APP_ERROR__}));}
