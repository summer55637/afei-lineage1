const RD_HEADER_SIZE=16;
const BIT_CMP=0x80;
const BIT_ZERO=0x40;
const BIT_REP_LARG=0x10;
const BIT_REP_LARG2=0x20;

const u32le=(b,p)=>((b[p]>>>0)|((b[p+1]>>>0)<<8)|((b[p+2]>>>0)<<16)|((b[p+3]>>>0)*0x1000000))>>>0;
function need(b,p,n,label){if(p<0||n<0||p+n>b.length)throw new Error('graphic truncated at '+label);}

function parseWrappedHeader(input,magic){
  const b=input instanceof Uint8Array?input:new Uint8Array(input);
  need(b,0,RD_HEADER_SIZE,'header');
  if(b[0]!==magic.charCodeAt(0)||b[1]!==magic.charCodeAt(1))throw new Error('invalid '+magic+' magic');
  return {
    id:magic,
    compressFlag:b[2],
    width:u32le(b,4),
    height:u32le(b,8),
    size:u32le(b,12)
  };
}

export function parseRdHeader(input){
  return parseWrappedHeader(input,'RD');
}

function checkedArea(width,height,bytesPerPixel){
  const area=width*height*bytesPerPixel;
  if(!Number.isSafeInteger(area)||area<0)throw new Error('invalid RD dimensions');
  return area;
}

function validateWrappedSize(h,b){
  if(h.size<RD_HEADER_SIZE||h.size>b.length)throw new Error('invalid graphic size');
}

export function decodeStoneAgeRd(input){
  const b=input instanceof Uint8Array?input:new Uint8Array(input);
  const h=parseRdHeader(b);
  validateWrappedSize(h,b);

  if(h.compressFlag===0){
    const outputBytes=checkedArea(h.width,h.height,1);
    need(b,RD_HEADER_SIZE,outputBytes,'raw payload');
    return {format:'RD',width:h.width,height:h.height,compressFlag:0,bytesPerPixel:1,pixels:b.slice(RD_HEADER_SIZE,RD_HEADER_SIZE+outputBytes)};
  }

  if(h.compressFlag===0x20){
    throw new Error('RD zlib branch requires decodeStoneAgeRdAsync in browser-safe runtime');
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
      if(count>=0xfffff)throw new Error('RD repeat count reaches target guard');
      if(dst+count>out.length)throw new Error('RD repeat exceeds decoded size');
      out.fill(rep,dst,dst+count);dst+=count;
    }else{
      if(idx&BIT_REP_LARG){need(b,src,1,'literal count');count=((idx&0x0f)<<8)|b[src++];}
      else count=idx&0x0f;
      if(count<=0||count>=0xfffff)throw new Error('RD literal count reaches target guard');
      if(dst+count>out.length)throw new Error('RD literal exceeds decoded size');
      need(b,src,count,'literal bytes');
      out.set(b.slice(src,src+count),dst);src+=count;dst+=count;
    }
  }
  if(dst!==out.length)throw new Error('RD decoded size mismatch: '+dst+' / '+out.length);
  return {format:'RD',width:h.width,height:h.height,compressFlag:h.compressFlag,bytesPerPixel:1,pixels:out};
}

export function classifyStoneAgeGraphic(input){
  const b=input instanceof Uint8Array?input:new Uint8Array(input);
  need(b,0,2,'graphic magic');
  const magic=b[0]|(b[1]<<8);
  if(magic===0x4452)return {format:'RD',decoder:'decodeStoneAgeRd'};
  if(magic===0x4767)return {format:'gG',decoder:'decoderPng'};
  throw new Error('unsupported client graphic magic 0x'+magic.toString(16));
}

export async function decodeStoneAgeRdAsync(input){
  const b=input instanceof Uint8Array?input:new Uint8Array(input);
  const h=parseRdHeader(b);
  validateWrappedSize(h,b);

  if(h.compressFlag!==0x20)return decodeStoneAgeRd(b);

  const outputBytes=checkedArea(h.width,h.height,4);
  if(typeof DecompressionStream!=='function')throw new Error('Web DecompressionStream is unavailable');
  const compressed=b.slice(RD_HEADER_SIZE,h.size);
  const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate'));
  const inflated=new Uint8Array(await new Response(stream).arrayBuffer());
  if(inflated.byteLength!==outputBytes)throw new Error('RD zlib decoded size mismatch: '+inflated.byteLength+' / '+outputBytes);
  return {format:'RD',width:h.width,height:h.height,compressFlag:0x20,bytesPerPixel:4,pixels:inflated};
}

function makeCanvas(width,height){
  if(typeof OffscreenCanvas==='function')return new OffscreenCanvas(width,height);
  if(typeof document!=='undefined'&&typeof document.createElement==='function'){
    const canvas=document.createElement('canvas');
    canvas.width=width;
    canvas.height=height;
    return canvas;
  }
  throw new Error('Canvas pixel extraction is unavailable');
}

export async function decodeStoneAgePngWrappedAsync(input){
  const b=input instanceof Uint8Array?input:new Uint8Array(input);
  const h=parseWrappedHeader(b,'gG');
  validateWrappedSize(h,b);
  if(checkedArea(h.width,h.height,4)===0)throw new Error('invalid PNG dimensions');
  if(typeof createImageBitmap!=='function')throw new Error('createImageBitmap is unavailable');

  const payload=b.slice(RD_HEADER_SIZE,h.size);
  const bitmap=await createImageBitmap(
    new Blob([payload],{type:'image/png'}),
    {premultiplyAlpha:'none',colorSpaceConversion:'none'},
  );
  try{
    if(bitmap.width!==h.width||bitmap.height!==h.height){
      throw new Error('gG PNG dimensions mismatch: '+bitmap.width+'x'+bitmap.height+' / '+h.width+'x'+h.height);
    }
    const canvas=makeCanvas(h.width,h.height);
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx||typeof ctx.drawImage!=='function'||typeof ctx.getImageData!=='function'){
      throw new Error('Canvas 2D pixel extraction is unavailable');
    }
    ctx.drawImage(bitmap,0,0);
    const data=ctx.getImageData(0,0,h.width,h.height).data;
    const pixels=new Uint8Array(data.length);
    pixels.set(data);
    if(pixels.length!==h.width*h.height*4)throw new Error('gG PNG pixel size mismatch');
    return {format:'gG',width:h.width,height:h.height,compressFlag:h.compressFlag,bytesPerPixel:4,pixels};
  }finally{
    if(typeof bitmap.close==='function')bitmap.close();
  }
}

export async function decodeStoneAgeGraphicAsync(input){
  const classification=classifyStoneAgeGraphic(input);
  if(classification.format==='RD')return decodeStoneAgeRdAsync(input);
  if(classification.format==='gG')return decodeStoneAgePngWrappedAsync(input);
  throw new Error('unsupported client graphic format');
}

export async function decodeAuthorizedClientGraphicAsync(realBytes,graphic){
  if(!graphic||graphic.adder==null||graphic.size==null)return null;
  const b=realBytes instanceof Uint8Array?realBytes:new Uint8Array(realBytes);
  const start=Math.trunc(Number(graphic.adder)),size=Math.trunc(Number(graphic.size));
  if(!Number.isFinite(start)||!Number.isFinite(size)||start<0||size<=0) return null;
  need(b,start,size,'graphic payload');
  return decodeStoneAgeGraphicAsync(b.slice(start,start+size));
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
