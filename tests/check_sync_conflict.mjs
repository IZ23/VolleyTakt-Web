import {decideLiveSessionConflict} from '../js/sync.js';
function ok(cond,msg){if(!cond)throw new Error(msg)}
const now=1_000_000;
ok(decideLiveSessionConflict({remoteActive:'B',remoteExpiry:now+1000,remoteGeneration:4,localGeneration:3,localDeviceId:'A',nowMs:now})==='locked','active foreign lease must block');
ok(decideLiveSessionConflict({remoteActive:'B',remoteExpiry:now-1,remoteGeneration:4,localGeneration:3,localDeviceId:'A',nowMs:now})==='remote-newer','expired foreign lease with newer generation must offer cloud choice');
ok(decideLiveSessionConflict({remoteActive:'',remoteExpiry:0,remoteGeneration:4,localGeneration:3,localDeviceId:'A',nowMs:now})==='remote-newer','newer generation must be detected even without active lease owner');
ok(decideLiveSessionConflict({remoteActive:'B',remoteExpiry:now-1,remoteGeneration:4,localGeneration:3,localDeviceId:'A',nowMs:now,forceLocal:true})==='proceed','explicit keep-local may replace expired remote generation');
ok(decideLiveSessionConflict({remoteActive:'B',remoteExpiry:now+1000,remoteGeneration:4,localGeneration:3,localDeviceId:'A',nowMs:now,forceLocal:true})==='locked','force-local must never override valid foreign lease');
ok(decideLiveSessionConflict({remoteActive:'A',remoteExpiry:now+1000,remoteGeneration:4,localGeneration:4,localDeviceId:'A',nowMs:now})==='proceed','same-device heartbeat proceeds');
console.log('Sync conflict decision checks OK.');
