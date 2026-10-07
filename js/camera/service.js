// VolleyTakt Live 0.4.0 RC5 - camera service boundary.
// Owns camera-adapter lifecycle and connection telemetry; contains no DOM/UI code.
export const CAMERA_ADAPTERS={
 dji_osmo:{id:'dji_osmo',shortName:'DJI',defaultName:'DJI Osmo Action'},
 gopro_open:{id:'gopro_open',shortName:'GoPro',defaultName:'GoPro HERO'}
};

export function adapterMeta(adapter='dji_osmo'){
 return CAMERA_ADAPTERS[adapter]||CAMERA_ADAPTERS.dji_osmo;
}

export function connectionQuality({connected=false,statusIntervalMs=12000,lastStatusAt=0,reconnects=0,statusFailures=0,now=Date.now()}={}){
 if(!connected)return{label:'Getrennt',state:'muted'};
 const interval=Math.max(10000,Number(statusIntervalMs)||12000),age=lastStatusAt?now-lastStatusAt:99999;
 if(reconnects>=2||age>interval*2.5||statusFailures>=3)return{label:'Instabil',state:'warn'};
 if(reconnects>=1||age>interval*1.6||statusFailures>=1)return{label:'Schwach',state:'warn'};
 return{label:'Stabil',state:'ok'};
}

export class CameraService{
 constructor({adapter='dji_osmo',statusIntervalMs=12000,log=()=>{}}={}){
  this.config={adapter,statusIntervalMs};this.log=log;this.camera=null;this.listeners=new Set();this.resetTelemetry();
 }
 resetTelemetry(){this.lastStatusAt=0;this.reconnects=0;this.statusFailures=0;this.battery=null;this.clipStartRecordTime=0}
 configure({adapter=this.config.adapter,statusIntervalMs=this.config.statusIntervalMs}={}){
  const changed=adapter!==this.config.adapter;this.config={adapter,statusIntervalMs};
  if(changed&&this.camera)this.disconnect();
  if(this.camera?.setStatusInterval)this.camera.setStatusInterval(Number(statusIntervalMs)||12000);
 }
 subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn)}
 emit(type,detail={}){for(const fn of this.listeners)fn({type,detail,snapshot:this.snapshot()})}
 async createAdapter(){
  if(this.config.adapter==='gopro_open'){const {GoProBle}=await import('../gopro-ble.js');return new GoProBle(this.log)}
  const {DjiOsmoBle}=await import('../dji-ble.js');return new DjiOsmoBle(this.log)
 }
 attach(camera){
  if(!camera||camera.__volleyTaktServiceListeners)return;camera.__volleyTaktServiceListeners=true;
  camera.addEventListener('diagnostic',e=>{const d=e.detail||{};if(d.stage==='reconnect'){if(d.status==='pending')this.reconnects++;if(d.status==='error')this.statusFailures++}if(d.stage==='error'||d.status==='error')this.statusFailures++;this.emit('diagnostic',d)});
  camera.addEventListener('ble',e=>{if(!e.detail?.connected)this.statusFailures++;this.emit('ble',e.detail||{})});
  camera.addEventListener('reconnected',e=>{this.lastStatusAt=Date.now();this.statusFailures=0;this.emit('reconnected',e.detail||{})});
  camera.addEventListener('status',e=>{const s=e.detail||{};this.lastStatusAt=Date.now();this.statusFailures=Math.max(0,this.statusFailures-1);if(s.battery!=null)this.battery=s.battery;this.emit('status',s)});
 }
 async connect(){
  if(!this.camera){this.camera=await this.createAdapter();this.attach(this.camera)}
  if(this.camera.setStatusInterval)this.camera.setStatusInterval(Number(this.config.statusIntervalMs)||12000);
  await this.camera.connect();this.lastStatusAt=Date.now();this.reconnects=0;this.statusFailures=0;
  if(this.camera.latestStatus?.battery!=null)this.battery=this.camera.latestStatus.battery;
  this.emit('connected',{connected:true});return this.camera;
 }
 disconnect(){if(this.camera){try{this.camera.disconnect()}catch{}}this.camera=null;this.resetTelemetry();this.emit('disconnected',{connected:false})}
 async startRecording(){if(!this.camera?.protocolConnected)throw new Error('Kamera noch nicht verbunden.');const s=await this.camera.startRecording();this.clipStartRecordTime=Number(s?.recordTime)||0;return s}
 async stopRecording(){if(!this.camera?.protocolConnected)throw new Error('Kamera noch nicht verbunden.');return this.camera.stopRecording()}
 markFailure(){this.statusFailures++}
 snapshot(){return{adapter:this.config.adapter,connected:!!this.camera?.protocolConnected,device:this.camera?.device||null,latestStatus:this.camera?.latestStatus||null,lastStatusAt:this.lastStatusAt,reconnects:this.reconnects,statusFailures:this.statusFailures,battery:this.battery,clipStartRecordTime:this.clipStartRecordTime,quality:connectionQuality({connected:!!this.camera?.protocolConnected,statusIntervalMs:this.config.statusIntervalMs,lastStatusAt:this.lastStatusAt,reconnects:this.reconnects,statusFailures:this.statusFailures})}}
 get meta(){return adapterMeta(this.config.adapter)}
}
