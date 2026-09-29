import assert from 'node:assert/strict';
import {parseLS2MapHeader} from './check_v314_stoneage_map_headers.mjs';

const name=Buffer.alloc(32);Buffer.from('Unit Map','ascii').copy(name);
const width=3,height=2,bytes=Buffer.alloc(44+4*width*height+2);
Buffer.from('LS2MAP','ascii').copy(bytes,0);bytes.writeUInt16BE(20000,6);name.copy(bytes,8);bytes.writeUInt16BE(width,40);bytes.writeUInt16BE(height,42);
const h=parseLS2MapHeader(bytes);
assert.deepEqual(h,{magic:'LS2MAP',floorId:20000,width:3,height:2,cellCount:6,expectedBytes:68,fileBytes:70,trailingBytes:2,nameRawHex:Buffer.from('Unit Map','ascii').toString('hex')});
assert.equal(parseLS2MapHeader(Buffer.from('TEXTNO')) ,null);
assert.equal(parseLS2MapHeader(Buffer.alloc(43)),null);
console.log(JSON.stringify({pass:true,version:'V3.14',focus:'LS2MAP header parser unit'}));