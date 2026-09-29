const ADRNBIN_RECORD_SIZE=72;

function need(bytes,offset,length,label){
  if(offset<0||length<0||offset+length>bytes.length)throw new Error('ADRNBIN truncated at '+label);
}
const u16le=(b,p,label)=>{need(b,p,2,label);return b[p]|(b[p+1]<<8)};
const u32le=(b,p,label)=>{need(b,p,4,label);return (b[p]>>>0)|((b[p+1]>>>0)<<8)|((b[p+2]>>>0)<<16)|((b[p+3]>>>0)*0x1000000);};
const i32le=(b,p,label)=>{const v=u32le(b,p,label);return v>=0x80000000?v-0x100000000:v;};

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
  const shorts=[];
  for(let i=0;i<20;i++){shorts.push(u16le(b,p,'MAP_ATTR short '+i));p+=2;}
  const bmpnumber=u32le(b,p,'attr.bmpnumber');p+=4;
  return {bitmapno,adder,size,xoffset,yoffset,width,height,attr:{atariX,atariY,hit:shorts[0],height:shorts[1],broken:shorts[2],indamage:shorts[3],outdamage:shorts[4],inpoison:shorts[5],innumb:shorts[6],inquiet:shorts[7],instone:shorts[8],indark:shorts[9],inconfuse:shorts[10],outpoison:shorts[11],outnumb:shorts[12],outquiet:shorts[13],outstone:shorts[14],outdark:shorts[15],outconfuse:shorts[16],damyA:shorts[17],damyB:shorts[18],damyC:shorts[19],bmpnumber}};
}

export function parseAdrnIndex(input){
  const b=input instanceof Uint8Array?input:new Uint8Array(input);
  if(b.length%ADRNBIN_RECORD_SIZE!==0)throw new Error('ADRNBIN byte length is not a multiple of 72');
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