import assert from 'node:assert/strict';
import {parseAdrnIndex,parseAdrnRecord,resolveClientImageId,SOURCE_ADRNBIN_RECORD_SIZE} from '../src/stoneage_client_image_runtime.mjs';

const u16=(b,p,v)=>{b[p]=v&255;b[p+1]=(v>>>8)&255};
const u32=(b,p,v)=>{b[p]=v&255;b[p+1]=(v>>>8)&255;b[p+2]=(v>>>16)&255;b[p+3]=(v>>>24)&255};
const i32=(b,p,v)=>u32(b,p,v>>>0);
function record({bitmapno,adder,size,xoffset,yoffset,width,height,atariX,atariY,hit,heightFlag,effect1,effect2,damyA,damyB,damyC,bmpnumber}){
  const b=new Uint8Array(80);let p=0;
  u32(b,p,bitmapno);p+=4;u32(b,p,adder);p+=4;u32(b,p,size);p+=4;i32(b,p,xoffset);p+=4;i32(b,p,yoffset);p+=4;u32(b,p,width);p+=4;u32(b,p,height);p+=4;
  b[p++]=atariX;b[p++]=atariY;
  u16(b,p,hit);p+=2;u16(b,p,heightFlag);p+=2;
  for(let i=0;i<15;i++){u16(b,p,0);p+=2;}
  u16(b,p,effect1);p+=2;u16(b,p,effect2);p+=2;u16(b,p,damyA);p+=2;u16(b,p,damyB);p+=2;u16(b,p,damyC);p+=2;
  p+=2;
  u32(b,p,bmpnumber);
  return b;
}

const a=record({bitmapno:7,adder:1234,size:56,xoffset:-3,yoffset:4,width:64,height:48,atariX:5,atariY:6,hit:37,heightFlag:2,effect1:11,effect2:12,damyA:13,damyB:14,damyC:15,bmpnumber:4500});
const c=record({bitmapno:8,adder:2000,size:99,xoffset:0,yoffset:-8,width:80,height:60,atariX:0,atariY:1,hit:0,heightFlag:0,effect1:21,effect2:22,damyA:23,damyB:24,damyC:25,bmpnumber:4516});
const b=new Uint8Array(160);b.set(a,0);b.set(c,80);

assert.equal(SOURCE_ADRNBIN_RECORD_SIZE,80);
const first=parseAdrnRecord(b,0);
assert.equal(first.bitmapno,7);assert.equal(first.adder,1234);assert.equal(first.size,56);
assert.equal(first.width,64);assert.equal(first.height,48);assert.equal(first.xoffset,-3);assert.equal(first.yoffset,4);
assert.equal(first.attr.hit,37);assert.equal(first.attr.height,2);assert.equal(first.attr.effect1,11);assert.equal(first.attr.effect2,12);
assert.equal(first.attr.damyA,13);assert.equal(first.attr.damyB,14);assert.equal(first.attr.damyC,15);assert.equal(first.attr.bmpnumber,4500);

const index=parseAdrnIndex(b);
assert.equal(index.records.length,2);
assert.equal(index.bitmapnumberToGraphicNo.get(4500),7);
assert.equal(index.bitmapnumberToGraphicNo.get(4516),8);
assert.deepEqual(resolveClientImageId(index,4500),{imageId:4500,graphicNo:7,adder:1234,size:56,width:64,height:48,xoffset:-3,yoffset:4,hit:37,heightFlag:2});
assert.equal(resolveClientImageId(index,99999),null);
assert.throws(()=>parseAdrnIndex(b.slice(0,-1)),/multiple of 80/);
assert.throws(()=>parseAdrnRecord(b.slice(0,10)),/truncated/);

console.log(JSON.stringify({pass:true,version:'V3.16-correction',focus:'ADRNBIN disk record + image-id resolver',recordSize:80,syntheticRecords:2,realImageBytesRequired:true,failClosedOnMissingAsset:true}));