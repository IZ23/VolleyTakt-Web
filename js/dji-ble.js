import {DJI,FrameStream,buildFrame,recordPayload,statusSubscribePayload,connectionPayload,connectionResponsePayload,parseCameraStatus,u32} from './dji-protocol.js?v=0.3.1-p2c';
const PAIRED_KEY='volleytakt-dji-paired-v1',ID_KEY='volleytakt-dji-controller-v1';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function persistentIdentity(){let v;try{v=JSON.parse(localStorage.getItem(ID_KEY)||'null')}catch{}if(v?.id&&Array.isArray(v.mac))return{id:v.id>>>0,mac:new Uint8Array(v.mac)};const a=crypto.getRandomValues(new Uint8Array(10));const id=(a[0]|a[1]<<8|a[2]<<16|a[3]<<24)>>>0;const mac=a.slice(4,10);mac[0]=(mac[0]|0x02)&0xfe;localStorage.setItem(ID_KEY,JSON.stringify({id,mac:[...mac]}));return{id,mac}}

export class DjiOsmoBle extends EventTarget{
 constructor(log=()=>{}){super();this.log=log;this.seq=1;this.pending=new Map();this.connected=false;this.protocolConnected=false;this.cameraBytes=DJI.ACTION4_BYTES.slice();this.latestStatus=null;this.reconnectAttempts=0;this.reconnectTimer=null;this.manualDisconnect=false;this.stream=new FrameStream(f=>this.onFrame(f),e=>{this.diag('crc','error',e.message);this.log('Framefehler: '+e.message)});this.notificationHandler=e=>{const v=e.target.value;this.stream.push(new Uint8Array(v.buffer,v.byteOffset,v.byteLength))};}
 nextSeq(){this.seq=(this.seq%65535)+1;return this.seq}
 emit(name,detail){this.dispatchEvent(new CustomEvent(name,{detail}))}
 diag(stage,status='info',detail=''){this.emit('diagnostic',{stage,status,detail:String(detail??''),at:Date.now()})}
 async connect(){
  this.manualDisconnect=false;this.reconnectAttempts=0;if(this.reconnectTimer){clearTimeout(this.reconnectTimer);this.reconnectTimer=null}
  if(!navigator.bluetooth){this.diag('api','error','Web Bluetooth API fehlt');throw new Error('Web Bluetooth wird von diesem Browser nicht angeboten. Einen Web-Bluetooth-fähigen Browser verwenden.')}
  this.diag('api','ok','Web Bluetooth API verfügbar');
  try{if(typeof navigator.bluetooth.getAvailability==='function'){const available=await navigator.bluetooth.getAvailability();this.diag('availability',available?'ok':'error',available?'Bluetooth-Adapter verfügbar':'Bluetooth-Adapter nicht verfügbar oder ausgeschaltet')}}catch(e){this.diag('availability','warn',e.message)}
  try{
   this.log('Bluetooth-Geräteauswahl wird geöffnet …');this.diag('chooser','pending','Geräteauswahl geöffnet');
   this.device=await navigator.bluetooth.requestDevice({acceptAllDevices:true,optionalServices:[DJI.SERVICE]});
   this.diag('device','ok',this.device.name||this.device.id||'BLE-Gerät ausgewählt');
   this.device.addEventListener('gattserverdisconnected',()=>this.onDisconnected());
   this.diag('gatt','pending','Verbinde GATT …');const server=await this.device.gatt.connect();await this.attachGatt(server);
   this.diag('handshake','pending','DJI-Protokollkopplung läuft');await this.protocolHandshake();this.diag('handshake','ok','DJI-Protokoll verbunden');return true
  }catch(e){this.diag('error','error',e?.message||String(e));throw e}
 }

 async attachGatt(server){
   this.diag('gatt','ok','GATT verbunden');
   this.diag('service','pending',DJI.SERVICE);const service=await server.getPrimaryService(DJI.SERVICE);this.diag('service','ok',DJI.SERVICE);
   this.diag('notify','pending',DJI.NOTIFY);this.notify=await service.getCharacteristic(DJI.NOTIFY);this.diag('notify','ok',DJI.NOTIFY);
   this.diag('write','pending',DJI.WRITE);this.write=await service.getCharacteristic(DJI.WRITE);this.diag('write','ok',DJI.WRITE);
   await this.notify.startNotifications();this.diag('notifications','ok','Notifications aktiv');
   this.notify.addEventListener('characteristicvaluechanged',this.notificationHandler);
   this.connected=true;this.reconnectAttempts=0;this.emit('ble',{connected:true,name:this.device?.name||'DJI Kamera'});this.log(`GATT verbunden: ${this.device?.name||'DJI'}`);
 }
 async reconnectKnown(){
   if(this.manualDisconnect||!this.device?.gatt||this.device.gatt.connected)return;
   const attempt=++this.reconnectAttempts;this.diag('reconnect','pending',`Automatischer Wiederverbindungsversuch ${attempt}/3`);this.log(`DJI Reconnect ${attempt}/3 …`);
   try{this.protocolConnected=false;const server=await this.device.gatt.connect();await this.attachGatt(server);this.diag('handshake','pending','DJI-Protokoll nach Reconnect …');await this.protocolHandshake();this.diag('reconnect','ok','DJI automatisch wiederverbunden');this.emit('reconnected',{connected:true});}
   catch(e){this.diag('reconnect',attempt>=3?'error':'warn',e?.message||String(e));if(!this.manualDisconnect&&attempt<3)this.reconnectTimer=setTimeout(()=>this.reconnectKnown(),Math.min(6000,1500*attempt));}
 }
 async protocolHandshake(){const paired=localStorage.getItem(PAIRED_KEY)==='1';const identity=persistentIdentity();const code=crypto.getRandomValues(new Uint16Array(1))[0]%10000;this.pairingCode=code;this.emit('pairing',{paired,code});this.log(paired?'DJI Protokollverbindung (bekanntes Gerät) …':`DJI Erstkopplung: Bestätigung an Kamera, Code ${String(code).padStart(4,'0')}`);const payload=connectionPayload(identity.id,identity.mac,paired?0:1,code);try{await this.send(0x00,0x19,payload,{timeout:4000})}catch(e){this.log('Erste Connection-ACK nicht bestätigt: '+e.message)}
   // The camera now actively sends its own 0019 request; onFrame completes the handshake.
   const deadline=performance.now()+12000;while(!this.protocolConnected&&performance.now()<deadline)await sleep(100);if(!this.protocolConnected)throw new Error('DJI-Protokollkopplung nicht bestätigt. Bitte Kameradisplay prüfen.');await this.subscribeStatus();}
 async rawWrite(bytes){if(!this.write)throw new Error('DJI Write-Characteristic fehlt');if(this.write.writeValueWithoutResponse)await this.write.writeValueWithoutResponse(bytes);else await this.write.writeValue(bytes)}
 async send(cmdSet,cmdId,payload=new Uint8Array(),{timeout=3000,cmdType=0x02,wait=true}={}){const seq=this.nextSeq();const frame=buildFrame(cmdSet,cmdId,payload,seq,cmdType);let promise=Promise.resolve(null);if(wait){promise=new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(seq);reject(new Error(`Timeout ${cmdSet.toString(16)}/${cmdId.toString(16)} seq ${seq}`))},timeout);this.pending.set(seq,{cmdSet,cmdId,resolve:v=>{clearTimeout(timer);resolve(v)},reject})})}await this.rawWrite(frame);this.log(`TX ${cmdSet.toString(16).padStart(2,'0')}/${cmdId.toString(16).padStart(2,'0')} seq=${seq}`);return promise}
 async sendResponse(frame,payload){const reply=buildFrame(frame.cmdSet,frame.cmdId,payload,frame.seq,0x22);await this.rawWrite(reply);this.log(`ACK ${frame.cmdSet.toString(16)}/${frame.cmdId.toString(16)} seq=${frame.seq}`)}
 async subscribeStatus(){this.log('Abonniere Kamerastatus (2 Hz + Änderungspush) …');await this.send(0x1D,0x05,statusSubscribePayload(),{wait:false,cmdType:0x01});}
 async startRecording(){if(!this.protocolConnected)throw new Error('DJI Protokoll nicht verbunden');const commandStarted=performance.now();const ack=await this.send(0x1D,0x03,recordPayload(this.cameraBytes,true),{timeout:4000});if(ack?.payload?.length&&ack.payload[0]!==0)throw new Error(`Kamera lehnt Aufnahme ab (Code ${ack.payload[0]})`);this.log('Aufnahmebefehl beantwortet; warte auf frischen Status „recording“ …');return this.waitForStatus(s=>s.recording,{needFresh:true,timeout:6500,freshAfter:commandStarted})}
 async stopRecording(){if(!this.protocolConnected)throw new Error('DJI Protokoll nicht verbunden');const commandStarted=performance.now();const ack=await this.send(0x1D,0x03,recordPayload(this.cameraBytes,false),{timeout:4000});if(ack?.payload?.length&&ack.payload[0]!==0)throw new Error(`Kamera lehnt Stop ab (Code ${ack.payload[0]})`);this.log('Stopbefehl beantwortet; warte auf frischen Kamerastatus …');return this.waitForStatus(s=>!s.recording,{needFresh:true,timeout:6500,freshAfter:commandStarted})}
 waitForStatus(predicate,{needFresh=true,timeout=5000,freshAfter=0}={}){return new Promise((resolve,reject)=>{const isFresh=s=>!needFresh||Number(s?.receivedPerf||0)>=freshAfter;if(this.latestStatus&&predicate(this.latestStatus)&&isFresh(this.latestStatus))return resolve({...this.latestStatus});const timer=setTimeout(()=>{this.removeEventListener('status',handler);reject(new Error('Kein passendes Kamerastatus-Feedback innerhalb des Zeitlimits'))},timeout);const handler=e=>{if(predicate(e.detail)&&isFresh(e.detail)){clearTimeout(timer);this.removeEventListener('status',handler);resolve(e.detail)}};this.addEventListener('status',handler)})}
 async onFrame(frame){this.log(`RX ${frame.cmdSet.toString(16).padStart(2,'0')}/${frame.cmdId.toString(16).padStart(2,'0')} seq=${frame.seq}${frame.isResponse?' ACK':''}`);if(frame.isResponse){const p=this.pending.get(frame.seq);if(p&&(p.cmdSet===frame.cmdSet&&p.cmdId===frame.cmdId)){this.pending.delete(frame.seq);p.resolve(frame)}return}
   if(frame.cmdSet===0x00&&frame.cmdId===0x19&&frame.payload.length>=29){const cameraBytes=frame.payload.slice(0,4);const verifyMode=frame.payload[26];const verifyData=frame.payload[27]|(frame.payload[28]<<8);this.cameraBytes=cameraBytes;const model=u32(cameraBytes,0);this.log(`Kamera Connection Request, device=0x${model.toString(16)}, verify=${verifyMode}/${verifyData}`);if(verifyMode===2&&verifyData===0){await this.sendResponse(frame,connectionResponsePayload(cameraBytes,0,0));this.protocolConnected=true;localStorage.setItem(PAIRED_KEY,'1');this.diag('handshake','ok','Kamera hat Verbindung bestätigt');this.emit('protocol',{connected:true,cameraBytes:[...cameraBytes]});}else if(verifyMode===2){this.diag('handshake','error',`Kamera lehnt Kopplung ab (${verifyData})`);this.emit('protocol',{connected:false,rejected:true});}}
   if(frame.cmdSet===0x1D&&frame.cmdId===0x02){const s=parseCameraStatus(frame.payload);if(s){s.receivedPerf=performance.now();s.receivedEpoch=Date.now();this.latestStatus=s;this.emit('status',s)}}
 }
 onDisconnected(){this.connected=false;this.protocolConnected=false;this.diag('gatt','error','BLE/GATT getrennt');this.emit('ble',{connected:false});this.log('BLE getrennt');for(const p of this.pending.values())p.reject?.(new Error('BLE getrennt'));this.pending.clear();if(!this.manualDisconnect&&this.device?.gatt){if(this.reconnectTimer)clearTimeout(this.reconnectTimer);this.reconnectTimer=setTimeout(()=>this.reconnectKnown(),1200)}}
 disconnect(){this.manualDisconnect=true;if(this.reconnectTimer){clearTimeout(this.reconnectTimer);this.reconnectTimer=null}try{this.device?.gatt?.disconnect()}catch{}}
}
