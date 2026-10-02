import assert from 'node:assert/strict';
import {
  classifySabexCell,
  decodeSabexInput,
  resolveSabexClientImages,
} from '../src/stoneage_sabex_runtime.mjs';
import {SABEX_MIN_BYTES} from '../src/stoneage_sabex_decoder.mjs';

const index={
  bitmapnumberToGraphicNo:new Map([[100,500],[101,501]]),
  graphicNoToRecord:new Map([
    [500,{adder:10,size:20,width:32,height:24,xoffset:0,yoffset:0,attr:{hit:0,height:0}}],
    [501,{adder:30,size:40,width:48,height:36,xoffset:1,yoffset:-2,attr:{hit:1,height:3}}],
  ]),
};

assert.equal(classifySabexCell(99).renderable,false);
assert.equal(classifySabexCell(100).resolver,'realGetNo');
assert.throws(()=>classifySabexCell(0x10000),/uint16/);
assert.throws(()=>classifySabexCell(100.5),/uint16/);

const sabex=new Uint8Array(SABEX_MIN_BYTES);
sabex.set([0x53,0x41,0x42,0x58],0); // synthetic "SABX" header
const putCell=(index,value)=>{
  const offset=4+index*2;
  sabex[offset]=(value>>>8)&0xff;
  sabex[offset+1]=value&0xff;
};
putCell(0,100);
putCell(1,101);
putCell(2,99);

const decoded=decodeSabexInput(sabex,{requireSabHeader:true});
assert.equal(decoded.header,'SABX');
assert.equal(decoded.grid.width,33);
assert.equal(decoded.grid.height,33);
assert.equal(decoded.cells.length,1089);
assert.deepEqual(decoded.cells.slice(0,3),[100,101,99]);
assert.throws(()=>decodeSabexInput(sabex.subarray(0,SABEX_MIN_BYTES-1)),/too short/);
assert.throws(()=>decodeSabexInput(sabex,{requireSabHeader:false}).cells.length!==1089);

const r=resolveSabexClientImages(sabex,index,{mapNo:7,requireSabHeader:true});
assert.equal(r.format,'stoneage-sabex-client-image-runtime-v3');
assert.equal(r.mapNo,7);
assert.equal(r.header,'SABX');
assert.equal(r.grid.cells,1089);
assert.equal(r.mappedCount,2);
assert.equal(r.unmappedCount,0);
assert.equal(r.skippedInvisibleCount,1087);
assert.equal(r.resolverCandidateCount,2);
assert.equal(r.resolved[0].graphicNo,500);
assert.equal(r.resolved[1].graphicNo,501);
assert.equal(r.resolved[2],null);
assert.equal(r.mappedRatio,1);

const fromArrayBuffer=resolveSabexClientImages(sabex.buffer,index);
assert.equal(fromArrayBuffer.mappedCount,2);

console.log('SABEX browser decoder and client-image resolver tests passed');
