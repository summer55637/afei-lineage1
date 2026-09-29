import assert from 'node:assert/strict';
import { parseLS2Map, LS2MAP_MAGIC } from './stoneage_ls2map_parser.mjs';

const writeU16BE=(b,p,v)=>{b[p]=(v>>8)&255;b[p+1]=v&255;};
const nameBytes=new TextEncoder().encode('Test Map');
const width=3,height=2,count=width*height;
const total=6+2+32+2+2+count*2+count*2+3;
const bytes=new Uint8Array(total);
let p=0;
for(const c of LS2MAP_MAGIC) bytes[p++]=c.charCodeAt(0);
writeU16BE(bytes,p,20000); p+=2;
bytes.set(nameBytes,p); p+=32;
writeU16BE(bytes,p,width); p+=2;
writeU16BE(bytes,p,height); p+=2;
for(let i=0;i<count;i++){writeU16BE(bytes,p,i+1);p+=2;}
for(let i=0;i<count;i++){writeU16BE(bytes,p,100+i);p+=2;}
bytes[p++]=1;bytes[p++]=2;bytes[p++]=3;

const parsed=parseLS2Map(bytes);
assert.deepEqual({magic:parsed.magic,id:parsed.id,name:parsed.name,width:parsed.width,height:parsed.height},{magic:'LS2MAP',id:20000,name:'Test Map',width:3,height:2});
assert.deepEqual([...parsed.tiles],[1,2,3,4,5,6]);
assert.deepEqual([...parsed.objects],[100,101,102,103,104,105]);
assert.equal(parsed.bytesConsumed,total-3);
assert.equal(parsed.trailingBytes,3);

assert.throws(()=>parseLS2Map(bytes.slice(0,10)),/truncated/);
const bad=bytes.slice();bad[0]=0x58;
assert.throws(()=>parseLS2Map(bad),/invalid LS2MAP magic/);

console.log(JSON.stringify({pass:true,version:'V3.13',focus:'LS2MAP binary parser contract',magic:'LS2MAP',endianness:'big-endian u16',header:'6-byte magic + u16 id + 32-byte name + u16 width + u16 height',trailingBytesPolicy:'reported, not rejected'}));