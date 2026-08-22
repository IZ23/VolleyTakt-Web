// DJI R SDK frame implementation validated against DJI's public Osmo-GPS-Controller-Demo.
// Reference: protocol.md / protocol_data_segment.md and utils/crc/custom_crc16.h + custom_crc32.h.
export const DJI={SERVICE:0xfff0,NOTIFY:0xfff4,WRITE:0xfff5,ACTION4_BYTES:new Uint8Array([0x00,0x00,0x33,0xff])};

// DJI R SDK specifies 0x3AA3 as the initial value for both CRC16 and CRC32.
// This was verified against DJI's official custom_crc16.h/custom_crc32.h and the published Mode-Switch test frame.
// Do not replace it with standard CRC initial values.
function crc16(data){let crc=0x3aa3;for(const b of data){crc^=b;for(let i=0;i<8;i++)crc=(crc&1)?((crc>>>1)^0xA001):(crc>>>1)}return crc&0xffff}
function crc32(data){let crc=0x00003aa3>>>0;for(const b of data){crc^=b;for(let i=0;i<8;i++)crc=(crc&1)?((crc>>>1)^0xEDB88320):(crc>>>1);crc>>>=0}return crc>>>0}
function put16(a,o,v){a[o]=v&255;a[o+1]=(v>>>8)&255}
function put32(a,o,v){a[o]=v&255;a[o+1]=(v>>>8)&255;a[o+2]=(v>>>16)&255;a[o+3]=(v>>>24)&255}
export function u16(a,o=0){return a[o]|(a[o+1]<<8)}
export function u32(a,o=0){return (a[o]|(a[o+1]<<8)|(a[o+2]<<16)|(a[o+3]<<24))>>>0}

export function buildFrame(cmdSet,cmdId,payload=new Uint8Array(),seq=1,cmdType=0x02){const data=new Uint8Array(2+payload.length);data[0]=cmdSet;data[1]=cmdId;data.set(payload,2);const len=12+data.length+4;const out=new Uint8Array(len);out[0]=0xAA;put16(out,1,len&0x3ff);out[3]=cmdType;out[4]=0;out[5]=out[6]=out[7]=0;put16(out,8,seq);put16(out,10,crc16(out.slice(0,10)));out.set(data,12);put32(out,len-4,crc32(out.slice(0,len-4)));return out}
export function parseFrame(frame){if(frame.length<18||frame[0]!==0xAA)throw new Error('Ungültiger DJI Frame');const len=u16(frame,1)&0x3ff;if(frame.length!==len)throw new Error('DJI Framelänge stimmt nicht');if(crc16(frame.slice(0,10))!==u16(frame,10))throw new Error('DJI CRC16 falsch');if(crc32(frame.slice(0,len-4))!==u32(frame,len-4))throw new Error('DJI CRC32 falsch');return{cmdType:frame[3],isResponse:!!(frame[3]&0x20),seq:u16(frame,8),cmdSet:frame[12],cmdId:frame[13],payload:frame.slice(14,len-4),raw:frame}}

export class FrameStream{constructor(onFrame,onError=()=>{}){this.buf=new Uint8Array();this.onFrame=onFrame;this.onError=onError}push(chunk){const next=new Uint8Array(this.buf.length+chunk.length);next.set(this.buf);next.set(chunk,this.buf.length);this.buf=next;while(this.buf.length>=3){let start=this.buf.indexOf(0xAA);if(start<0){this.buf=new Uint8Array();return}if(start>0)this.buf=this.buf.slice(start);if(this.buf.length<3)return;const len=u16(this.buf,1)&0x3ff;if(len<18||len>1023){this.buf=this.buf.slice(1);continue}if(this.buf.length<len)return;const frame=this.buf.slice(0,len);this.buf=this.buf.slice(len);try{this.onFrame(parseFrame(frame))}catch(e){this.onError(e)}}}}

export function bytes32(bytes){const out=new Uint8Array(4);out.set(bytes.slice(0,4));return out}
export function recordPayload(cameraBytes,start=true){const p=new Uint8Array(9);p.set(cameraBytes,0);p[4]=start?0:1;return p}
export function statusSubscribePayload(){return new Uint8Array([3,20,0,0,0,0])}
export function connectionPayload(controllerId,macBytes,verifyMode,verifyData){const p=new Uint8Array(33);put32(p,0,controllerId>>>0);p[4]=Math.min(macBytes.length,16);p.set(macBytes.slice(0,16),5);put32(p,21,0);p[25]=0;p[26]=verifyMode;put16(p,27,verifyData);return p}
export function connectionResponsePayload(cameraBytes,ret=0,cameraNo=0){const p=new Uint8Array(9);p.set(cameraBytes,0);p[4]=ret;put32(p,5,cameraNo);return p}
export function parseCameraStatus(payload){if(payload.length<38)return null;return{cameraMode:payload[0],cameraStatus:payload[1],recordTime:u16(payload,5),battery:payload[37],recording:payload[1]===0x03}}
