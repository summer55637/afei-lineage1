import assert from 'node:assert/strict';
import {parseStoneAgeSap,paletteColorRgba,indexedPixelsToRgba,stoneAgePaletteSummary,SOURCE_SAP_BYTES} from '../src/stoneage_palette_runtime.mjs';

const sap=new Uint8Array(SOURCE_SAP_BYTES);
sap.set([30,20,10],0);
sap.set([60,50,40],3);
const palette=parseStoneAgeSap(sap);
assert.equal(SOURCE_SAP_BYTES,672);
assert.deepEqual(paletteColorRgba(palette,16),[10,20,30,255]);
assert.deepEqual(paletteColorRgba(palette,17),[40,50,60,255]);
assert.deepEqual(paletteColorRgba(palette,10),[222,0,0,255]);
assert.deepEqual(paletteColorRgba(palette,240),[245,195,150,255]);
assert.equal(stoneAgePaletteSummary(palette).transparentIndex,0);

const rgba=indexedPixelsToRgba(Uint8Array.from([0,16,17,240]),2,2,palette);
assert.deepEqual([...rgba],[0,0,0,0,10,20,30,255,40,50,60,255,245,195,150,255]);
assert.throws(()=>parseStoneAgeSap(sap.slice(0,-1)),/truncated/);
assert.throws(()=>indexedPixelsToRgba(Uint8Array.from([16]),2,2,palette),/pixel count mismatch/);
assert.equal(paletteColorRgba(palette,999),null);

console.log(JSON.stringify({pass:true,version:'V3.19',focus:'Palet_1.sap BGR palette -> RGBA',sapBytes:672,indexRange:'16..239',transparentIndex:0}));