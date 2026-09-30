import assert from 'node:assert/strict';
import {parseAdrnIndex} from '../src/stoneage_client_image_runtime.mjs';
import {decodeStoneAgeRd} from '../src/stoneage_rd_decoder.mjs';
import {CLIENT_ASSET_PACK_FORMAT,normalizeClientAssetPackManifest,clientAssetPackSummary,loadClientAssetPack,resolveClientTilePixels} from '../src/stoneage_client_asset_pack.mjs';

const u16=(b,p,v)=>{b[p]=v&255;b[p+1]=(v>>>8)&255};
const u32=(b,p,v)=>{b[p]=v&255;b[p+1]=(v>>>8)&255;b[p+2]=(v>>>16)&255;b[p+3]=(v>>>24)&255};
const adrn=new Uint8Array(80);
let p=0;
u32(adrn,p,7);p+=4;u32(adrn,p,16);p+=4;u32(adrn,p,18);p+=4;
u32(adrn,p,0);p+=4;u32(adrn,p,0);p+=4;u32(adrn,p,3);p+=4;u32(adrn,p,2);p+=4;
adrn[p++]=0;adrn[p++]=0;
for(let i=0;i<20;i++){u16(adrn,p,i===0?1:0);p+=2;}
u32(adrn,p,4500);

const real=new Uint8Array(22);
real[0]=82;real[1]=68;real[2]=0;
u32(real,4,3);u32(real,8,2);u32(real,12,22);
real.set([1,2,3,4,5,6],16);

const manifest={
  format:CLIENT_ASSET_PACK_FORMAT,
  status:'ready',
  source:{kind:'operator-supplied',authorizationNote:'test fixture only'},
  files:{adrn:{url:'assets/adrn.bin'},real:{url:'assets/real.bin'}}
};
assert.equal(normalizeClientAssetPackManifest(manifest).status,'ready');
assert.match(clientAssetPackSummary({status:'unavailable'}).text,/未提供/);

const payloads={
  'https://example.test/client-assets/manifest.json':{status:200,ok:true,json:async()=>manifest},
  'https://example.test/client-assets/assets/adrn.bin':{status:200,ok:true,arrayBuffer:async()=>adrn.buffer},
  'https://example.test/client-assets/assets/real.bin':{status:200,ok:true,arrayBuffer:async()=>real.buffer}
};
const fetchFn=async(url)=>payloads[url]||{status:404,ok:false};
const pack=await loadClientAssetPack({manifestUrl:'https://example.test/client-assets/manifest.json',fetchFn});
assert.equal(pack.status,'ready');
assert.equal(pack.index.records.length,1);
const resolved=resolveClientTilePixels(pack,4500);
assert.equal(resolved.status,'ready');
assert.deepEqual([...resolved.pixels],[1,2,3,4,5,6]);
assert.deepEqual(parseAdrnIndex(adrn).records[0].attr.bmpnumber,4500);
assert.deepEqual([...decodeStoneAgeRd(real).pixels],[1,2,3,4,5,6]);

const disabled=await loadClientAssetPack({
  manifestUrl:'https://example.test/client-assets/missing.json',
  fetchFn
});
assert.equal(disabled.status,'unavailable');
assert.equal(disabled.reason,'manifest-not-found');
assert.equal(resolveClientTilePixels(disabled,4500),null);

console.log(JSON.stringify({
  pass:true,
  version:'V3.18',
  format:CLIENT_ASSET_PACK_FORMAT,
  authorizedBinaryRequired:true,
  proprietaryBinaryShipped:false,
  chain:'imageId -> ADRNBIN -> Real -> RD pixels'
}));
