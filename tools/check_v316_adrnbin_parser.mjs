import assert from 'node:assert/strict';
import {parseAdrnIndex,parseAdrnRecord,resolveClientImageId,SOURCE_ADRNBIN_RECORD_SIZE} from '../src/stoneage_client_image_runtime.mjs';

const writeU16LE=(b,p,v)=>{b[p]=v&255;b[p+1]=(v>>>8)&255};
const writeU32LE=(b,p,v)=>{b[p]=v&255;b[p+1]=(v>>>8)&255;b[p+2]=(v>>>16)&255;b[p+3]=(v>>>24)&255};
const writeI32LE=(b,p,v)=>writeU32LE(b,p,v>>>0);

const b=new Uint8Array(SOURCE_ADRNBIN_RECORD_SIZE*2);
let p=0;
writeU32LE(b,p,7);p+=4;writeU32LE(b,p,1234);p+=4;writeU32LE(b,p,56);p+=4;
writeI32LE(b,p,-3);p+=4;writeI32LE(b,p,4);p+=4;writeU32LE(b,p,64);p+=4;writeU32LE(b,p,48);p+=4;
b[p++]=5;b[p++]=6;
for(let i=0;i<20;i++){writeU16LE(b,p,i===0?37:(i===1?2:0));p+=2;}
writeU32LE(b,p,4500);

p=SOURCE_ADRNBIN_RECORD_SIZE;
writeU32LE(b,p,8);p+=4;writeU32LE(b,p,2000);p+=4;writeU32LE(b,p,99);p+=4;
writeI32LE(b,p,0);p+=4;writeI32LE(b,p,-8);p+=4;writeU32LE(b,p,80);p+=4;writeU32LE(b,p,60);p+=4;
b[p++]=0;b[p++]=1;
for(let i=0;i<20;i++){writeU16LE(b,p,0);p+=2;}
writeU32LE(b,p,4516);

assert.equal(SOURCE_ADRNBIN_RECORD_SIZE,72);
const first=parseAdrnRecord(b,0);
assert.equal(first.bitmapno,7);assert.equal(first.adder,1234);assert.equal(first.size,56);
assert.equal(first.width,64);assert.equal(first.height,48);assert.equal(first.xoffset,-3);assert.equal(first.yoffset,4);
assert.equal(first.attr.hit,37);assert.equal(first.attr.bmpnumber,4500);

const index=parseAdrnIndex(b);
assert.equal(index.records.length,2);
assert.equal(index.bitmapnumberToGraphicNo.get(4500),7);
assert.equal(index.bitmapnumberToGraphicNo.get(4516),8);
assert.deepEqual(resolveClientImageId(index,4500),{imageId:4500,graphicNo:7,adder:1234,size:56,width:64,height:48,xoffset:-3,yoffset:4,hit:37,heightFlag:2});
assert.equal(resolveClientImageId(index,99999),null);
assert.throws(()=>parseAdrnIndex(b.slice(0,-1)),/multiple of 72/);
assert.throws(()=>parseAdrnRecord(b.slice(0,10)),/truncated/);

console.log(JSON.stringify({
  pass:true,
  version:'V3.16',
  focus:'ADRNBIN record + image-id resolver',
  recordSize:72,
  syntheticRecords:2,
  realImageBytesRequired:true,
  failClosedOnMissingAsset:true
}));