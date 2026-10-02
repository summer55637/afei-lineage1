import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {
  parseRdHeader,
  decodeStoneAgeRd,
  decodeStoneAgeRdAsync,
  decodeAuthorizedClientGraphic,
  decodeAuthorizedClientGraphicAsync,
  classifyStoneAgeGraphic,
  decodeStoneAgePngWrappedAsync,
} from '../src/stoneage_rd_decoder.mjs';

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

const rgba=[1,2,3,4,5,6,7,8];
const compressed=deflateSync(Buffer.from(rgba));
const zlibRd=header(0x20,2,1,compressed.length);
zlibRd.set(compressed,16);
const z=await decodeStoneAgeRdAsync(zlibRd);
assert.equal(z.bytesPerPixel,4);
assert.deepEqual([...z.pixels],rgba);
assert.equal(z.width,2);
assert.equal(z.height,1);

assert.deepEqual([...decodeAuthorizedClientGraphic(b,{adder:0,size:22}).pixels],[1,2,3,4,5,6]);
const za=await decodeAuthorizedClientGraphicAsync(zlibRd,{adder:0,size:zlibRd.length});
assert.deepEqual([...za.pixels],rgba);
assert.equal(za.bytesPerPixel,4);
assert.deepEqual(classifyStoneAgeGraphic(new Uint8Array([0x52,0x44])),{format:'RD',decoder:'decodeStoneAgeRd'});
assert.deepEqual(classifyStoneAgeGraphic(new Uint8Array([0x67,0x47])),{format:'gG',decoder:'decoderPng'});

const pngWrapped=header(0,1,1,4);
pngWrapped[0]=0x67;
pngWrapped[1]=0x47;
pngWrapped.set([0x89,0x50,0x4e,0x47],16);
const previousCreateImageBitmap=globalThis.createImageBitmap;
const previousOffscreenCanvas=globalThis.OffscreenCanvas;
let pngClosed=false;
globalThis.createImageBitmap=async(blob,options)=>{
  assert.equal(blob.type,'image/png');
  assert.deepEqual([...new Uint8Array(await blob.arrayBuffer())],[0x89,0x50,0x4e,0x47]);
  assert.equal(options.premultiplyAlpha,'none');
  return {width:1,height:1,close(){pngClosed=true}};
};
globalThis.OffscreenCanvas=class {
  constructor(width,height){this.width=width;this.height=height;}
  getContext(){
    return {
      drawImage(bitmap){assert.equal(bitmap.width,1);},
      getImageData(){return {data:Uint8ClampedArray.from([12,34,56,255])};}
    };
  }
};
try{
  const png=await decodeStoneAgePngWrappedAsync(pngWrapped);
  assert.equal(png.format,'gG');
  assert.equal(png.bytesPerPixel,4);
  assert.deepEqual([...png.pixels],[12,34,56,255]);
  const wrappedImage=await decodeAuthorizedClientGraphicAsync(pngWrapped,{adder:0,size:pngWrapped.length});
  assert.equal(wrappedImage.format,'gG');
  assert.deepEqual([...wrappedImage.pixels],[12,34,56,255]);
  assert.equal(pngClosed,true);
}finally{
  if(previousCreateImageBitmap===undefined)delete globalThis.createImageBitmap;
  else globalThis.createImageBitmap=previousCreateImageBitmap;
  if(previousOffscreenCanvas===undefined)delete globalThis.OffscreenCanvas;
  else globalThis.OffscreenCanvas=previousOffscreenCanvas;
}
assert.throws(()=>decodeStoneAgeRd(header(0x20,2,1,0)),/requires decodeStoneAgeRdAsync/);
assert.throws(()=>decodeStoneAgeRd(header(16,1,1,0)),/decoded size mismatch/);
assert.throws(()=>decodeStoneAgeRd(new Uint8Array([82,68,0])),/truncated/);

console.log(JSON.stringify({
  pass:true,
  version:'V3.17',
  focus:'StoneAge RD raw/RLE/zlib decoder and graphic magic classifier',
  headerSize:16,
  supportedCompression:['0 raw 1-byte pixels','0x20 zlib 4-byte pixels','legacy custom RLE'],
  alternateGraphicMagic:'gG -> decoderPng',
}));
