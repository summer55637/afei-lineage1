import assert from 'node:assert/strict';
import {parseRdHeader,decodeStoneAgeRd,decodeAuthorizedClientGraphic} from '../src/stoneage_rd_decoder.mjs';

const u32=(b,p,v)=>{b[p]=v&255;b[p+1]=(v>>>8)&255;b[p+2]=(v>>>16)&255;b[p+3]=(v>>>24)&255};
const header=(flag,w,h,payloadSize)=>{const b=new Uint8Array(16+payloadSize);b[0]=82;b[1]=68;b[2]=flag;u32(b,4,w);u32(b,8,h);u32(b,12,16+payloadSize);return b};

let b=header(0,3,2,6);b.set([1,2,3,4,5,6],16);
assert.deepEqual(parseRdHeader(b),{id:'RD',compressFlag:0,width:3,height:2,size:22});
assert.deepEqual([...decodeStoneAgeRd(b).pixels],[1,2,3,4,5,6]);

const payload=[0x80|0x40|5,0x00|5,10,11,12,13,14];
const rle=header(1,10,1,payload.length);
rle.set(payload,16);
assert.deepEqual([...decodeStoneAgeRd(rle).pixels],[0,0,0,0,0,10,11,12,13,14]);

const repeatedPayload=[0x80|8,77];
const repeated=header(1,8,1,repeatedPayload.length);
repeated.set(repeatedPayload,16);
assert.deepEqual([...decodeStoneAgeRd(repeated).pixels],[77,77,77,77,77,77,77,77]);

assert.deepEqual([...decodeAuthorizedClientGraphic(b,{adder:0,size:22}).pixels],[1,2,3,4,5,6]);
assert.throws(()=>decodeStoneAgeRd(header(16,1,1,0)),/unsupported RD color compression/);
assert.throws(()=>decodeStoneAgeRd(new Uint8Array([82,68,0])),/truncated/);

console.log(JSON.stringify({pass:true,version:'V3.17',focus:'StoneAge RD raw/RLE decoder',headerSize:16,supportedCompression:'0 and legacy RLE',unsupportedCompression:'>=16 fail-closed'}));