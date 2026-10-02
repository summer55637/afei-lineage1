import assert from 'node:assert/strict';
import {
  classifySabexCell,
  resolveSabexClientImages,
} from '../src/stoneage_sabex_runtime.mjs';

const index={
  bitmapnumberToGraphicNo:new Map([[100,500],[101,501]]),
  graphicNoToRecord:new Map([
    [500,{adder:10,size:20,width:32,height:24,xoffset:0,yoffset:0,attr:{hit:0,height:0}}],
    [501,{adder:30,size:40,width:48,height:36,xoffset:1,yoffset:-2,attr:{hit:1,height:3}}],
  ]),
};

assert.equal(classifySabexCell(99).renderable,false);
assert.equal(classifySabexCell(100).resolver,'realGetNo');
assert.throws(() => classifySabexCell(0x10000),/uint16/);

const cells=Array(1089).fill(0);
cells[0]=100;
cells[1]=101;
cells[2]=99;

const r=resolveSabexClientImages({cells},index,{mapNo:7});
assert.equal(r.format,'stoneage-sabex-client-image-runtime-v2');
assert.equal(r.mapNo,7);
assert.equal(r.grid.cells,1089);
assert.equal(r.mappedCount,2);
assert.equal(r.unmappedCount,0);
assert.equal(r.skippedInvisibleCount,1087);
assert.equal(r.resolverCandidateCount,2);
assert.equal(r.resolved[0].graphicNo,500);
assert.equal(r.resolved[1].graphicNo,501);
assert.equal(r.resolved[2],null);
assert.equal(r.mappedRatio,1);

console.log('SABEX client-image resolver tests passed');
