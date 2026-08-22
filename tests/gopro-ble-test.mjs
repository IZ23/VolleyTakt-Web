import {__test} from '../js/gopro-ble.js';
const packets=__test.packetize(new Uint8Array([0x01,0x01,0x01]));
const got=[...packets[0]];const exp=[0x20,0x03,0x01,0x01,0x01];
if(JSON.stringify(got)!==JSON.stringify(exp))throw new Error(`Open GoPro packet mismatch: ${got}`);
const st=__test.parseStatusResponse(new Uint8Array([0x13,0x00,10,1,1,13,4,0,0,0,0,70,1,85]));
if(!st||st[10]!==1||st[70]!==85)throw new Error('Open GoPro status parser mismatch');
console.log('Open GoPro BLE protocol smoke test: OK');
