import { inflateSync } from 'node:zlib';

const RD_HEADER_SIZE=16;
const BIT_CMP=0x80;
const BIT_ZERO=0x40;
const BIT_REP_LARG=0x10;
const BIT_REP_LARG2=0x20;

const u32le=(b,p)=>((b[p]>>>0)|((b[p+1]>>>0)<<8)|((b[p+2]>>>0)<<16)|((b[p+3]>>>0)*0x1000000))>>>0;
function need(b,p,n,label){if(p<0||n<0||p+n>b.length)throw new Error('RD truncated at '+label);}

export function parseRdHeader(input){
  const b=input instanceof Uint8Array?input:new Uint8Array(input);
  need(b,0,RD_HEADER_SIZE,'header');
  if(b[0]!==82||b[1]!==68)throw new Error('invalid RD magic');
  return {id:'RD',compressFlag:b[2],width:u32le(b,4),height:u32le(b,8),size:u32le(b,12)};
}

function checkedArea(width,height,bytesPerPixel){
  const area=width*height*bytesPerPixel;
  if(!Number.isSafeInteger(area)||area<0)throw new Error('invalid RD dimensions');
  return area;
}

export function decodeStoneAgeRd(input){
  const b=input instanceof Uint8Array?input:new Uint8Array(input);
  const h=parseRdHeader(b);
  if(h.size<RD_HEADER_SIZE||h.size>b.length)throw new Error('invalid RD size');

  if(h.compressFlag===0){
    const outputBytes=checkedArea(h.width,h.height,1);
    need(b,RD_HEADER_SIZE,outputBytes,'raw payload');
    return {width:h.width,height:h.height,compressFlag:0,bytesPerPixel:1,pixels:b.slice(RD_HEADER_SIZE,RD_HEADER_SIZE+outputBytes)};
  }

  if(h.compressFlag===0x20){
    const outputBytes=checkedArea(h.width,h.height,4);
    const out=new Uint8Array(outputBytes);
    const compressed=b.slice(RD_HEADER_SIZE,h.size);
    const inflated=inflateSync(compressed);
    if(inflated.byteLength!==outputBytes)throw new Error('RD zlib decoded size mismatch: '+inflated.byteLength+' / '+outputBytes);
    out.set(inflated);
    return {width:h.width,height:h.height,compressFlag:0x20,bytesPerPixel:4,pixels:out};
  }

  const outputBytes=checkedArea(h.width,h.height,1);
  const out=new Uint8Array(outputBytes);
  let src=RD_HEADER_SIZE,dst=0,end=h.size;
  while(src<end){
    const idx=b[src++];
    let count;
    if(idx&BIT_CMP){
      let rep=0;
      if(!(idx&BIT_ZERO)){need(b,src,1,'repeat value');rep=b[src++];}
      if(idx&BIT_REP_LARG2){need(b,src,2,'large repeat count');count=((idx&0x0f)<<16)|(b[src++]<<8)|b[src++];}
      else if(idx&BIT_REP_LARG){need(b,src,1,'repeat count');count=((idx&0x0f)<<8)|b[src++];}
      else count=idx&0x0f;
      if(dst+count>out.length)throw new Error('RD repeat exceeds decoded size');
      out.fill(rep,dst,dst+count);dst+=count;
    }else{
      if(idx&BIT_REP_LARG){need(b,src,1,'literal count');count=((idx&0x0f)<<8)|b[src++];}
      else count=idx&0x0f;
      if(count<=0||dst+count>out.length)throw new Error('RD literal exceeds decoded size');
      need(b,src,count,'literal bytes');
      out.set(b.slice(src,src+count),dst);src+=count;dst+=count;
    }
  }
  if(dst!==out.length)throw new Error('RD decoded size mismatch: '+dst+' / '+out.length);
  return {width:h.width,height:h.height,compressFlag:h.compressFlag,bytesPerPixel:1,pixels:out};
}


export function classifyStoneAgeGraphic(input){
  const b=input instanceof Uint8Array?input:new Uint8Array(input);
  need(b,0,2,'graphic magic');
  const magic=b[0]|(b[1]<<8);
  if(magic===0x4452)return {format:'RD',decoder:'decodeStoneAgeRd'};
  if(magic===0x4767)return {format:'gG',decoder:'decoderPng'};
  throw new Error('unsupported client graphic magic 0x'+magic.toString(16));
}

export function decodeAuthorizedClientGraphic(realBytes,graphic){
  if(!graphic||graphic.adder==null||graphic.size==null)return null;
  const b=realBytes instanceof Uint8Array?realBytes:new Uint8Array(realBytes);
  const start=Math.trunc(Number(graphic.adder)),size=Math.trunc(Number(graphic.size));
  if(!Number.isFinite(start)||!Number.isFinite(size)||start<0||size<=0)return null;
  need(b,start,size,'graphic payload');
  const slice=b.slice(start,start+size);
  const classification=classifyStoneAgeGraphic(slice);
  if(classification.format==='RD')return decodeStoneAgeRd(slice);
  return {format:'gG',decoder:'decoderPng',status:'png-runtime-required'};
}
