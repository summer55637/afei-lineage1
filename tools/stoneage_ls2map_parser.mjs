#!/usr/bin/env node

/**
 * Parse the server-side Stone Age LS2MAP binary container.
 * This follows gavinlinasd/StoneAge@git pinned readmap.c, not the
 * differently-shaped pioneers-g client .dat format.
 */
export const LS2MAP_MAGIC = 'LS2MAP';

const assertRange=(bytes,offset,length,label)=>{
  if(offset+length>bytes.length) throw new Error(`LS2MAP truncated while reading ${label}`);
};
const readU16BE=(bytes,offset,label)=>{
  assertRange(bytes,offset,2,label);
  return (bytes[offset]<<8)|bytes[offset+1];
};
const decodeFixedAscii=(bytes,offset,length)=>{
  const out=[];
  for(let i=0;i<length;i++){
    const v=bytes[offset+i];
    if(v===0) break;
    out.push(v);
  }
  return new TextDecoder('utf-8',{fatal:false}).decode(Uint8Array.from(out));
};

export function parseLS2Map(input){
  const bytes=input instanceof Uint8Array ? input : new Uint8Array(input);
  assertRange(bytes,0,6,'magic');
  const magic=decodeFixedAscii(bytes,0,6);
  if(magic!==LS2MAP_MAGIC) throw new Error(`invalid LS2MAP magic: ${JSON.stringify(magic)}`);
  let p=6;
  const id=readU16BE(bytes,p,'floor id'); p+=2;
  assertRange(bytes,p,32,'show string');
  const name=decodeFixedAscii(bytes,p,32); p+=32;
  const width=readU16BE(bytes,p,'width'); p+=2;
  const height=readU16BE(bytes,p,'height'); p+=2;
  const count=width*height;
  if(!Number.isSafeInteger(count) || count<0) throw new Error('invalid LS2MAP tile count');
  const tileBytes=count*2;
  assertRange(bytes,p,tileBytes,'tile layer');
  const tiles=new Uint16Array(count);
  for(let i=0;i<count;i++) tiles[i]=readU16BE(bytes,p+i*2,'tile layer');
  p+=tileBytes;
  assertRange(bytes,p,tileBytes,'object layer');
  const objects=new Uint16Array(count);
  for(let i=0;i<count;i++) objects[i]=readU16BE(bytes,p+i*2,'object layer');
  p+=tileBytes;
  return {magic,id,name,width,height,tiles,objects,bytesConsumed:p,trailingBytes:bytes.length-p};
}

if(import.meta.url===`file://${process.argv[1]}`){
  const fs=await import('node:fs');
  const path=process.argv[2];
  if(!path){console.error('usage: node tools/stoneage_ls2map_parser.mjs <file>');process.exit(2);}
  const result=parseLS2Map(fs.readFileSync(path));
  console.log(JSON.stringify({
    magic:result.magic,id:result.id,name:result.name,width:result.width,height:result.height,
    tileCount:result.tiles.length,objectCount:result.objects.length,
    bytesConsumed:result.bytesConsumed,trailingBytes:result.trailingBytes
  },null,2));
}