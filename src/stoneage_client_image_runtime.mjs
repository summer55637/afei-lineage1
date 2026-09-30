const ADRNBIN_RECORD_SIZE=80;

function need(bytes,offset,length,label){
  if(offset<0||length<0||offset+length>bytes.length)throw new Error('ADRNBin truncated at '+label);
}
const u16le=(b,p,label)=>{need(b,p,2,label);return b[p]|(b[p+1]<<8)};
const i16le=(b,p,label)=>{const v=u16le(b,p,label);return v>=0x8000?v-0x10000:v};
const u32le=(b,p,label)=>{need(b,p,4,label);return ((b[p]>>>0)|((b[p+1]>>>0)<<8)|((b[p+2]>>>0)<<16)|((b[p+3]>>>0)*0x1000000))>>>0};
const i32le=(b,p,label)=>{const v=u32le(b,p,label);return v>=0x80000000?v-0x100000000:v};

export const SOURCE_ADRNBIN_RECORD_SIZE=ADRNBIN_RECORD_SIZE;

export function parseAdrnRecord(input,offset=0){
  const b=input instanceof Uint8Array?input:new Uint8Array(input);
  need(b,offset,ADRNBIN_RECORD_SIZE,'record');
  let p=offset;
  const bitmapno=u32le(b,p,'bitmapno');p+=4;
  const adder=u32le(b,p,'adder');p+=4;
  const size=u32le(b,p,'size');p+=4;
  const xoffset=i32le(b,p,'xoffset');p+=4;
  const yoffset=i32le(b,p,'yoffset');p+=4;
  const width=u32le(b,p,'width');p+=4;
  const height=u32le(b,p,'height');p+=4;
  const atariX=b[p],atariY=b[p+1];p+=2;
  const hit=u16le(b,p,'attr.hit');p+=2;
  const attrHeight=i16le(b,p,'attr.height');p+=2;
  const broken=i16le(b,p,'attr.broken');p+=2;
  const indamage=i16le(b,p,'attr.indamage');p+=2;
  const outdamage=i16le(b,p,'attr.outdamage');p+=2;
  const inpoison=i16le(b,p,'attr.inpoison');p+=2;
  const innumb=i16le(b,p,'attr.innumb');p+=2;
  const inquiet=i16le(b,p,'attr.inquiet');p+=2;
  const instone=i16le(b,p,'attr.instone');p+=2;
  const indark=i16le(b,p,'attr.indark');p+=2;
  const inconfuse=i16le(b,p,'attr.inconfuse');p+=2;
  const outpoison=i16le(b,p,'attr.outpoison');p+=2;
  const outnumb=i16le(b,p,'attr.outnumb');p+=2;
  const outquiet=i16le(b,p,'attr.outquiet');p+=2;
  const outstone=i16le(b,p,'attr.outstone');p+=2;
  const outdark=i16le(b,p,'attr.outdark');p+=2;
  const outconfuse=i16le(b,p,'attr.outconfuse');p+=2;
  const effect1=i16le(b,p,'attr.effect1');p+=2;
  const effect2=i16le(b,p,'attr.effect2');p+=2;
  const damyA=u16le(b,p,'attr.damy_a');p+=2;
  const damyB=u16le(b,p,'attr.damy_b');p+=2;
  const damyC=u16le(b,p,'attr.damy_c');p+=2;
  p+=2;
  const bmpnumber=u32le(b,p,'attr.bmpnumber');
  return {bitmapno,adder,size,xoffset,yoffset,width,height,attr:{
    atariX,atariY,hit,height:attrHeight,broken,indamage,outdamage,inpoison,innumb,inquiet,instone,indark,inconfuse,
    outpoison,outnumb,outquiet,outstone,outdark,outconfuse,effect1,effect2,damyA,damyB,damyC,bmpnumber
  }};
}

export function parseAdrnIndex(input){
  const b=input instanceof Uint8Array?input:new Uint8Array(input);
  if(b.length%ADRNBIN_RECORD_SIZE!==0)throw new Error('ADRNBIN byte length is not a multiple of 80');
  const records=[],bitmapnumberToGraphicNo=new Map(),graphicNoToRecord=new Map();
  for(let offset=0;offset<b.length;offset+=ADRNBIN_RECORD_SIZE){
    const record=parseAdrnRecord(b,offset);
    records.push(record);
    graphicNoToRecord.set(record.bitmapno,record);
    if(record.attr.bmpnumber!==0)bitmapnumberToGraphicNo.set(record.attr.bmpnumber,record.bitmapno);
  }
  return {recordSize:ADRNBIN_RECORD_SIZE,records,bitmapnumberToGraphicNo,graphicNoToRecord};
}

export function resolveClientImageId(index,imageId){
  if(!index||imageId==null)return null;
  const bitmapnumber=Math.trunc(Number(imageId));
  if(!Number.isFinite(bitmapnumber))return null;
  const graphicNo=index.bitmapnumberToGraphicNo?.get(bitmapnumber);
  if(graphicNo==null)return null;
  const record=index.graphicNoToRecord?.get(graphicNo);
  if(!record)return null;
  return {imageId:bitmapnumber,graphicNo,adder:record.adder,size:record.size,width:record.width,height:record.height,xoffset:record.xoffset,yoffset:record.yoffset,hit:record.attr.hit,heightFlag:record.attr.height};
}

export function clientImageRuntimeSummary(index){
  if(!index)return {status:'unresolved'};
  return {status:'ready',recordSize:index.recordSize,recordCount:Array.isArray(index.records)?index.records.length:0,mappedImageIds:index.bitmapnumberToGraphicNo?.size??0};
}