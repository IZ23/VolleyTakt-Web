// VolleyTakt Live – Open GoPro BLE adapter (HERO10+).
// Based on GoPro's public Open GoPro BLE specification.
const UUID={
 SERVICE:0xFEA6,
 COMMAND:'b5f90072-aa8d-11e3-9046-0002a5d5c51b',
 COMMAND_RESPONSE:'b5f90073-aa8d-11e3-9046-0002a5d5c51b',
 QUERY:'b5f90076-aa8d-11e3-9046-0002a5d5c51b',
 QUERY_RESPONSE:'b5f90077-aa8d-11e3-9046-0002a5d5c51b'
};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function packetize(message){
 const data=message instanceof Uint8Array?message:new Uint8Array(message);
 if(data.length>8191)throw new Error('Open-GoPro-Nachricht zu groß');
 const packets=[];let off=0;
 const firstPayload=Math.min(18,data.length);
 const first=new Uint8Array(2+firstPayload);first[0]=0x20|((data.length>>8)&0x1f);first[1]=data.length&0xff;first.set(data.slice(0,firstPayload),2);packets.push(first);off=firstPayload;
 let counter=0;while(off<data.length){const n=Math.min(19,data.length-off),p=new Uint8Array(1+n);p[0]=0x80|(counter&0x0f);p.set(data.slice(off,off+n),1);packets.push(p);off+=n;counter=(counter+1)&0x0f}
 return packets;
}
class MessageAssembler{
 constructor(cb){this.cb=cb;this.reset()}
 reset(){this.expected=0;this.buf=[]}
 push(bytes){const b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);if(!b.length)return;
  if((b[0]&0x80)===0){let h=1,len=0;const kind=(b[0]>>5)&0x03;if(kind===0){len=b[0]&0x1f}else if(kind===1){h=2;len=((b[0]&0x1f)<<8)|b[1]}else if(kind===2){h=3;len=(b[1]<<8)|b[2]}else return;this.expected=len;this.buf=[...b.slice(h)]}
  else if(this.expected){this.buf.push(...b.slice(1))}else return;
  if(this.expected&&this.buf.length>=this.expected){const msg=new Uint8Array(this.buf.slice(0,this.expected));this.reset();this.cb(msg)}
 }
}
function beInt(bytes){let n=0;for(const x of bytes)n=n*256+x;return n}
function parseStatusResponse(msg){
 if(msg.length<2||![0x13,0x53,0x93].includes(msg[0])||msg[1]!==0)return null;
 const out={};let i=2;while(i+1<msg.length){const id=msg[i++],len=msg[i++];if(i+len>msg.length)break;const val=msg.slice(i,i+len);i+=len;out[id]=beInt(val)}return out;
}

export class GoProBle extends EventTarget{
 constructor(log=()=>{}){super();this.log=log;this.statusIntervalMs=12000;this.connected=false;this.protocolConnected=false;this.latestStatus=null;this.manualDisconnect=false;this.reconnectAttempts=0;this.reconnectTimer=null;this.pollTimer=null;this.pendingCommand=[];this.pendingQuery=[];this.recordPerfStart=0;this.commandAssembler=new MessageAssembler(m=>this.onCommandMessage(m));this.queryAssembler=new MessageAssembler(m=>this.onQueryMessage(m));this.onCommandNotification=e=>this.commandAssembler.push(new Uint8Array(e.target.value.buffer,e.target.value.byteOffset,e.target.value.byteLength));this.onQueryNotification=e=>this.queryAssembler.push(new Uint8Array(e.target.value.buffer,e.target.value.byteOffset,e.target.value.byteLength));}
 emit(name,detail){this.dispatchEvent(new CustomEvent(name,{detail}))}
 diag(stage,status='info',detail=''){this.emit('diagnostic',{stage,status,detail:String(detail??''),at:Date.now()})}
 async connect(){
  this.manualDisconnect=false;this.reconnectAttempts=0;if(!navigator.bluetooth){this.diag('api','error','Web Bluetooth API fehlt');throw new Error('Web Bluetooth wird von diesem Browser nicht angeboten.')}
  this.diag('api','ok','Web Bluetooth API verfügbar');this.diag('chooser','pending','GoPro-Geräteauswahl geöffnet');
  try{this.device=await navigator.bluetooth.requestDevice({filters:[{services:[UUID.SERVICE]}]});this.diag('device','ok',this.device.name||'GoPro');this.device.addEventListener('gattserverdisconnected',()=>this.onDisconnected());this.diag('gatt','pending','Verbinde GATT …');const server=await this.device.gatt.connect();await this.attachGatt(server);await this.refreshStatus();this.protocolConnected=true;this.diag('handshake','ok','Open GoPro bereit');this.startPolling();return true}catch(e){this.diag('error','error',e?.message||String(e));throw e}
 }
 async attachGatt(server){
  this.diag('gatt','ok','GATT verbunden');this.diag('service','pending','Open GoPro FEA6');const svc=await server.getPrimaryService(UUID.SERVICE);this.diag('service','ok','FEA6');
  this.command=await svc.getCharacteristic(UUID.COMMAND);this.commandResponse=await svc.getCharacteristic(UUID.COMMAND_RESPONSE);this.query=await svc.getCharacteristic(UUID.QUERY);this.queryResponse=await svc.getCharacteristic(UUID.QUERY_RESPONSE);this.diag('write','ok','Command 0072 / Query 0076');this.diag('notify','ok','Response 0073 / 0077');
  await this.commandResponse.startNotifications();await this.queryResponse.startNotifications();this.commandResponse.addEventListener('characteristicvaluechanged',this.onCommandNotification);this.queryResponse.addEventListener('characteristicvaluechanged',this.onQueryNotification);this.diag('notifications','ok','Open-GoPro-Notifications aktiv');this.connected=true;this.emit('ble',{connected:true,name:this.device?.name||'GoPro'});this.log(`GoPro GATT verbunden: ${this.device?.name||'GoPro'}`);
 }
 async writeMessage(characteristic,msg){for(const p of packetize(msg)){if(characteristic.writeValueWithoutResponse)await characteristic.writeValueWithoutResponse(p);else await characteristic.writeValue(p)}}
 waitPending(bucket,predicate,timeout=3500){return new Promise((resolve,reject)=>{const item={predicate,resolve,reject,timer:null};item.timer=setTimeout(()=>{const i=bucket.indexOf(item);if(i>=0)bucket.splice(i,1);reject(new Error('Open-GoPro-Antwort Timeout'))},timeout);bucket.push(item)})}
 resolvePending(bucket,msg){for(let i=0;i<bucket.length;i++){const p=bucket[i];if(p.predicate(msg)){bucket.splice(i,1);clearTimeout(p.timer);p.resolve(msg);return true}}return false}
 onCommandMessage(msg){this.log(`GoPro RX command ${[...msg].map(x=>x.toString(16).padStart(2,'0')).join(' ')}`);this.resolvePending(this.pendingCommand,msg)}
 onQueryMessage(msg){this.log(`GoPro RX query ${[...msg].slice(0,12).map(x=>x.toString(16).padStart(2,'0')).join(' ')}`);this.resolvePending(this.pendingQuery,msg);const vals=parseStatusResponse(msg);if(vals)this.applyStatuses(vals)}
 async sendCommand(msg,timeout=4000){const id=msg[0],wait=this.waitPending(this.pendingCommand,m=>m[0]===id,timeout);await this.writeMessage(this.command,new Uint8Array(msg));const res=await wait;if(res[1]!==0)throw new Error(`GoPro lehnt Befehl ab (Code ${res[1]})`);return res}
 async queryStatuses(){const wait=this.waitPending(this.pendingQuery,m=>[0x13,0x53,0x93].includes(m[0]),3500);await this.writeMessage(this.query,new Uint8Array([0x13,10,13,70]));const msg=await wait;return parseStatusResponse(msg)}
 applyStatuses(vals){const recording=!!vals[10];if(recording&&!this.recordPerfStart)this.recordPerfStart=performance.now();if(!recording)this.recordPerfStart=0;const recordTime=recording&&this.recordPerfStart?Math.max(0,(performance.now()-this.recordPerfStart)/1000):0;const s={recording,recordTime,battery:Number.isFinite(vals[70])?vals[70]:this.latestStatus?.battery,receivedPerf:performance.now(),receivedEpoch:Date.now()};this.latestStatus=s;this.emit('status',s)}
 async refreshStatus(){return this.queryStatuses()}
 setStatusInterval(ms){this.statusIntervalMs=Math.max(10000,Math.min(15000,Number(ms)||12000));if(this.protocolConnected)this.startPolling()}
 startPolling(){this.stopPolling();this.pollTimer=setInterval(()=>this.queryStatuses().catch(e=>this.diag('status','warn',e.message)),this.statusIntervalMs)}
 stopPolling(){if(this.pollTimer){clearInterval(this.pollTimer);this.pollTimer=null}}
 async waitForStatus(predicate,{timeout=6500}={}){return new Promise((resolve,reject)=>{if(this.latestStatus&&predicate(this.latestStatus))return resolve({...this.latestStatus});const timer=setTimeout(()=>{this.removeEventListener('status',handler);reject(new Error('Kein passendes GoPro-Statusfeedback innerhalb des Zeitlimits'))},timeout);const handler=e=>{if(predicate(e.detail)){clearTimeout(timer);this.removeEventListener('status',handler);resolve(e.detail)}};this.addEventListener('status',handler)})}
 async startRecording(){if(!this.protocolConnected)throw new Error('GoPro nicht verbunden');this.recordPerfStart=0;await this.sendCommand([0x01,0x01,0x01]);await sleep(120);await this.queryStatuses();return this.waitForStatus(s=>s.recording,{timeout:6500})}
 async stopRecording(){if(!this.protocolConnected)throw new Error('GoPro nicht verbunden');await this.sendCommand([0x01,0x01,0x00]);await sleep(120);await this.queryStatuses();return this.waitForStatus(s=>!s.recording,{timeout:6500})}
 async reconnectKnown(){if(this.manualDisconnect||!this.device?.gatt||this.device.gatt.connected)return;const attempt=++this.reconnectAttempts;this.diag('reconnect','pending',`GoPro Wiederverbindungsversuch ${attempt}/3`);try{const server=await this.device.gatt.connect();await this.attachGatt(server);await this.refreshStatus();this.protocolConnected=true;this.startPolling();this.diag('reconnect','ok','GoPro automatisch wiederverbunden');this.emit('reconnected',{connected:true})}catch(e){this.diag('reconnect',attempt>=3?'error':'warn',e.message);if(!this.manualDisconnect&&attempt<3)this.reconnectTimer=setTimeout(()=>this.reconnectKnown(),1500*attempt)}}
 onDisconnected(){this.stopPolling();this.connected=false;this.protocolConnected=false;this.diag('gatt','error','GoPro BLE/GATT getrennt');this.emit('ble',{connected:false});for(const p of [...this.pendingCommand,...this.pendingQuery]){clearTimeout(p.timer);p.reject(new Error('BLE getrennt'))}this.pendingCommand=[];this.pendingQuery=[];if(!this.manualDisconnect&&this.device?.gatt)this.reconnectTimer=setTimeout(()=>this.reconnectKnown(),1200)}
 disconnect(){this.manualDisconnect=true;this.stopPolling();if(this.reconnectTimer){clearTimeout(this.reconnectTimer);this.reconnectTimer=null}try{this.device?.gatt?.disconnect()}catch{}this.connected=false;this.protocolConnected=false}
}

export const __test={packetize,parseStatusResponse};
