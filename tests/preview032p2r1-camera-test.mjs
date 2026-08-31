import fs from 'node:fs';
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const gp=fs.readFileSync(new URL('../js/gopro-ble.js',import.meta.url),'utf8');
const dji=fs.readFileSync(new URL('../js/dji-ble.js',import.meta.url),'utf8');
const need=(v,m)=>{if(!v)throw new Error(m)};

need(app.includes('let cameraDiagLog=[];let cameraDiagVisible=false;'),'diagnostics must default hidden');
need(app.includes("${cameraDiagVisible?`<section class=\"ble-diag\""),'diagnostics must render conditionally');
need(app.includes('cameraDiagVisible=true;setCameraDiag'), 'failed connect must show diagnostics');
need(app.includes("cameraDiagVisible=false;cameraDiag.lastError='–'"), 'successful connect must hide diagnostics');
need(!/function drawCamera\(\)[\s\S]{0,10000}probeBluetooth\(\);updateCameraUi/.test(app),'drawCamera must not probe/show diagnostics by default');

need(app.includes('Kamera einschalten → Kamera verbinden.'),'quick guide missing');
need(app.includes('camera-battery-shell'),'drawer battery symbol missing');
need(app.includes('Qualität*'),'quality label missing');
need(app.includes('keine RSSI-Messung'),'quality explanation missing');

need(gp.includes('this.statusIntervalMs=12000'),'GoPro default status cadence must be 12 seconds');
need(gp.includes('Math.max(10000,Math.min(15000'),'GoPro cadence must be constrained to 10–15 seconds');
need(gp.includes('this.statusIntervalMs)}'),'GoPro polling must use configured cadence');
need(dji.includes('setStatusInterval(ms)'),'DJI adapter must expose common status interval contract');
need(dji.includes('Status per Push'),'DJI push-status behavior must be explicit');

const stopFn=app.slice(app.indexOf('async function stopRecording()'),app.indexOf('function makeSessionToken',app.indexOf('async function stopRecording()')));
need(stopFn.includes('Verbindung bleibt aktiv'),'stop UI must explicitly retain camera connection');
need(!stopFn.includes('disconnectCamera()'),'recording stop must not disconnect camera');

need(css.includes('grid-template-columns:minmax(180px,1.75fr)'), 'compact one-line camera grid missing');
need(css.includes('.camera-drawer-battery'),'drawer battery styles missing');

console.log('preview032p2r1-camera-test: OK');
