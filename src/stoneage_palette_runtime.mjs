const SAP_ENTRY_COUNT=224;
const COLOR_COUNT=256;
const RGBA_BYTES_PER_COLOR=4;
const SAP_BYTES=SAP_ENTRY_COUNT*3;

const FIXED=[
  [0,0,0],[128,0,0],[0,128,0],[128,128,0],[0,0,128],[128,0,128],[0,128,128],[192,192,192],[192,220,192],[166,202,240],
  [222,0,0],[255,95,0],[255,255,160],[0,95,210],[80,210,255],[40,225,40],
  [245,195,150],[225,160,95],[195,125,70],[155,85,30],[70,65,55],[40,35,30],
  [255,251,240],[160,160,164],[128,128,128],[255,0,0],[0,255,0],[255,255,0],[0,0,255],[255,0,255],[0,255,255],[255,255,255]
];

function bytesOf(input){return input instanceof Uint8Array?input:new Uint8Array(input);}
function need(b,p,n,label){if(p<0||n<0||p+n>b.length)throw new Error('SAP truncated at '+label);}
function putColor(out,index,r,g,b,a=255){const p=index*RGBA_BYTES_PER_COLOR;out[p]=r;out[p+1]=g;out[p+2]=b;out[p+3]=a;}

export const SOURCE_SAP_BYTES=SAP_BYTES;

export function parseStoneAgeSap(input){
  const b=bytesOf(input);
  need(b,0,SAP_BYTES,'palette data');
  const rgba=new Uint8Array(COLOR_COUNT*RGBA_BYTES_PER_COLOR);
  for(let i=0;i<16;i++)putColor(rgba,i,...FIXED[i]);
  for(let i=0;i<224;i++){
    const p=i*3;
    const blue=b[p],green=b[p+1],red=b[p+2];
    putColor(rgba,16+i,red,green,blue);
  }
  for(let i=0;i<16;i++)putColor(rgba,240+i,...FIXED[16+i]);
  return {format:'stoneage-sap-v1',bytesRequired:SAP_BYTES,colorCount:COLOR_COUNT,rgba};
}

export function paletteColorRgba(palette,index){
  if(!palette?.rgba)return null;
  const i=Math.trunc(Number(index));
  if(!Number.isFinite(i)||i<0||i>=COLOR_COUNT)return null;
  const p=i*RGBA_BYTES_PER_COLOR;
  return [palette.rgba[p],palette.rgba[p+1],palette.rgba[p+2],palette.rgba[p+3]];
}

export function indexedPixelsToRgba(pixels,width,height,palette,{transparentIndex=0}={}){
  const src=bytesOf(pixels);
  const w=Math.trunc(Number(width)),h=Math.trunc(Number(height));
  if(!Number.isSafeInteger(w)||!Number.isSafeInteger(h)||w<=0||h<=0)throw new Error('invalid indexed image dimensions');
  const expected=w*h;
  if(src.length!==expected)throw new Error('indexed pixel count mismatch');
  if(!palette?.rgba)throw new Error('palette is required');
  const out=new Uint8Array(expected*4);
  const t=Math.trunc(Number(transparentIndex));
  for(let i=0;i<expected;i++){
    const ci=src[i];
    const pp=ci*4,dp=i*4;
    out[dp]=palette.rgba[pp];out[dp+1]=palette.rgba[pp+1];out[dp+2]=palette.rgba[pp+2];out[dp+3]=ci===t?0:palette.rgba[pp+3];
  }
  return out;
}

export function stoneAgePaletteSummary(palette){
  if(!palette?.rgba)return {status:'unresolved'};
  return {status:'ready',format:palette.format||'stoneage-sap-v1',colorCount:COLOR_COUNT,transparentIndex:0};
}