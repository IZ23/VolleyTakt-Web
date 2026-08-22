import {buildFrame, parseFrame} from '../js/dji-protocol.js';

// DJI R SDK public Mode Switch (CmdSet 0x1D / CmdID 0x04) example for Osmo Action 4.
const payload = new Uint8Array([0x00,0x00,0x33,0xFF,0x0A,0x01,0x47,0x39,0x36]);
const expected = new Uint8Array([
  0xAA,0x1B,0x00,0x01,0x00,0x00,0x00,0x00,0x05,0x00,0x57,0xEE,
  0x1D,0x04,0x00,0x00,0x33,0xFF,0x0A,0x01,0x47,0x39,0x36,0xF4,0xFA,0xE1,0xD0
]);
const actual = buildFrame(0x1D,0x04,payload,5,0x01);
if (actual.length !== expected.length || actual.some((v,i)=>v!==expected[i])) {
  console.error('DJI R SDK test vector mismatch');
  console.error('actual  ', [...actual].map(v=>v.toString(16).padStart(2,'0')).join(' '));
  console.error('expected', [...expected].map(v=>v.toString(16).padStart(2,'0')).join(' '));
  process.exit(1);
}
const parsed=parseFrame(actual);
if(parsed.cmdSet!==0x1D||parsed.cmdId!==0x04||parsed.seq!==5) process.exit(2);
console.log('DJI R SDK protocol test vector: OK');
