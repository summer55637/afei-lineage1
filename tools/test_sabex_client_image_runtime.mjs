import assert from 'node:assert/strict';
import { resolveSabexClientImages } from './stoneage_sabex_runtime.mjs';

const index={
  bitmapnumberToGraphicNo:new Map([[100,500],[101,501]]),
  graphicNoToRecord:new Map([
    [500,{adder:10,size:20,width:32,height:24,xoffset:0,yoffset:0,attr:{hit:0,height:0}}],
    [501,{adder:30,size:40,width:48,height:36,xoffset:1,yoffset:-2,attr:{hit:1,height:3}}],
  ]),
};

const cells=Array(1089).fill(0);
cells[0]=100;
cells[1]=101;

const r=resolveSabexClientImages({cells},index,{mapNo:7});
assert.equal(r.format,'stoneage-sabex-client-image-runtime-v1');
assert.equal(r.mapNo,7);
assert.equal(r.grid.cells,1089);
assert.equal(r.mappedCount,2);
assert.equal(r.unmappedCount,1087);
assert.equal(r.resolved[0].graphicNo,500);
assert.equal(r.resolved[1].graphicNo,501);
assert.equal(r.mappedRatio,2/1089);

console.log('SABEX client-image resolver tests passed');
