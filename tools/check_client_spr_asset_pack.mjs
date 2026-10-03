import assert from 'node:assert/strict';
import {
  loadClientAssetPack,
  normalizeClientAssetPackManifest,
  resolveClientSpriteAnimation,
  resolveClientSpriteFrameAsync,
  clientAssetPackSummary,
} from '../src/stoneage_client_asset_pack.mjs';

const putU16=(b,p,v)=>{b[p]=v&255;b[p+1]=(v>>>8)&255;};
const putU32=(b,p,v)=>{b[p]=v&255;b[p+1]=(v>>>8)&255;b[p+2]=(v>>>16)&255;b[p+3]=(v>>>24)&255;};

function encodeSprite(sprNo,animations){
  const index=new Uint8Array(12);
  putU32(index,0,sprNo);
  putU32(index,4,0);
  putU16(index,8,animations.length);
  const chunks=[];
  for(const anim of animations){
    const b=new Uint8Array(12+anim.frames.length*10);
    putU16(b,0,anim.dir??1);putU16(b,2,anim.no??2);
    putU32(b,4,anim.dtAnim??320);putU32(b,8,anim.frames.length);
    let p=12;
    for(const frame of anim.frames){
      putU32(b,p,frame.bmpNo);putU16(b,p+4,frame.posX??0);
      putU16(b,p+6,frame.posY??0);putU16(b,p+8,frame.soundNo??0);p+=10;
    }
    chunks.push(b);
  }
  const total=chunks.reduce((n,b)=>n+b.length,0);
  const data=new Uint8Array(total);
  let p=0;
  for(const b of chunks){data.set(b,p);p+=b.length;}
  return {spradrn:index,spr:data};
}
const oneFrame=(count=1,{first=7,dtAnim=320,soundNo=4}={})=>Array.from({length:count},(_,i)=>({
  dir:1,no:2,dtAnim,frames:Array.from({length:i===0?1:0},(_,j)=>({
    bmpNo:first+j,posX:-1,posY:2,soundNo:soundNo+j
  }))
}));

const spriteAdrn=new Uint8Array(80);
putU32(spriteAdrn,0,201);
putU32(spriteAdrn,4,0);
putU32(spriteAdrn,8,17);
putU32(spriteAdrn,20,1);
putU32(spriteAdrn,24,1);
putU32(spriteAdrn,76,9001);
const spriteReal=new Uint8Array(17);
spriteReal.set([0x52,0x44,0x00],0);
putU32(spriteReal,4,1);
putU32(spriteReal,8,1);
putU32(spriteReal,12,17);
spriteReal[16]=0x5a;
const shard382=encodeSprite(100382,Array.from({length:50},(_,i)=>({
  dir:1,no:i,dtAnim:320,frames:[{bmpNo:100+i,posX:0,posY:0,soundNo:9}]
})));
const shard381=encodeSprite(100381,[{
  dir:1,no:0,dtAnim:640,
  frames:Array.from({length:10},(_,i)=>({bmpNo:200+i,posX:0,posY:0,soundNo:20+i}))
}]);
const manifest={
  format:'stoneage-client-asset-pack-v1',
  status:'ready',
  source:{kind:'operator-supplied',authorizationNote:'synthetic fixture only'},
  files:{
    adrn:{url:'adrn.bin'},
    real:{url:'real.bin'},
    spriteShards:[
      {nextMaxAdrnID:100,spradrn:{url:'sprite-382/spradrn.bin'},spr:{url:'sprite-382/spr.bin'}},
      {nextMaxAdrnID:200,spradrn:{url:'sprite-381/spradrn.bin'},spr:{url:'sprite-381/spr.bin'}}
    ]
  }
};
assert.equal(normalizeClientAssetPackManifest(manifest).files.spriteShards.length,2);
assert.throws(()=>normalizeClientAssetPackManifest({
  ...manifest,files:{...manifest.files,spriteShards:[{nextMaxAdrnID:0,spradrn:{url:'x'}}]}
}),/requires a URL|must be a file object/);
assert.throws(()=>normalizeClientAssetPackManifest({
  ...manifest,files:{...manifest.files,spriteShards:[{spradrn:{url:'x'},spr:{url:'y'}}]}
}),/unsigned 32-bit nextMaxAdrnID/);

const payloads={
  'https://example.test/client-assets/manifest.json':{ok:true,status:200,json:async()=>manifest},
  'https://example.test/client-assets/adrn.bin':{ok:true,status:200,arrayBuffer:async()=>spriteAdrn.buffer},
  'https://example.test/client-assets/real.bin':{ok:true,status:200,arrayBuffer:async()=>spriteReal.buffer},
  'https://example.test/client-assets/sprite-382/spradrn.bin':{ok:true,status:200,arrayBuffer:async()=>shard382.spradrn.buffer},
  'https://example.test/client-assets/sprite-382/spr.bin':{ok:true,status:200,arrayBuffer:async()=>shard382.spr.buffer},
  'https://example.test/client-assets/sprite-381/spradrn.bin':{ok:true,status:200,arrayBuffer:async()=>shard381.spradrn.buffer},
  'https://example.test/client-assets/sprite-381/spr.bin':{ok:true,status:200,arrayBuffer:async()=>shard381.spr.buffer}
};
const fetchFn=async url=>payloads[url]||{ok:false,status:404};
const pack=await loadClientAssetPack({manifestUrl:'https://example.test/client-assets/manifest.json',fetchFn});
assert.equal(pack.status,'ready');
assert.equal(pack.spritePack.status,'ready');
assert.equal(pack.spritePack.shardCount,2);
assert.equal(pack.spritePack.spriteCount,2);
assert.equal(pack.spritePack.appliedFixups.some(f=>f.slot===382),true);
const resolved=resolveClientSpriteAnimation(pack,100382,0);
assert.equal(resolved.status,'ready');
assert.equal(resolved.slot,382);
assert.equal(resolved.animation.frameCount,14);
const resolvedFrame=await resolveClientSpriteFrameAsync(pack,100382,0,0);
assert.equal(resolvedFrame.status,'ready');
assert.equal(resolvedFrame.graphicNo,201);
assert.equal(resolvedFrame.format,'RD');
assert.equal(resolvedFrame.width,1);
assert.equal(resolvedFrame.height,1);
assert.deepEqual([...resolvedFrame.pixels],[0x5a]);
assert.deepEqual(resolvedFrame.frameOffset,{x:0,y:0});
assert.equal(resolvedFrame.soundNo,0);
assert.equal(resolved.animation.frames[4].soundNo,24);
assert.equal((await resolveClientSpriteFrameAsync(pack,100382,0,14)).status,'missing-frame');
assert.equal((await resolveClientSpriteFrameAsync(pack,100382,0,-1)).status,'invalid-frame-reference');
assert.deepEqual(resolved.animation.frames.map(frame=>frame.bmpNo),
  Array.from({length:14},(_,i)=>201+i));
assert.equal(resolveClientSpriteAnimation(pack,100999,0).status,'missing-sprite');
assert.equal(resolveClientSpriteAnimation(pack,100382,100).status,'missing-animation');
assert.equal(clientAssetPackSummary(pack).text.includes('SPR 2 隻'),true);

const legacyManifest={...manifest,files:{adrn:{url:'adrn.bin'},real:{url:'real.bin'}}};
const legacyPack=await loadClientAssetPack({
  manifestUrl:'https://example.test/client-assets/legacy.json',
  fetchFn:async url=>url.endsWith('/legacy.json')
    ?{ok:true,status:200,json:async()=>legacyManifest}
    :payloads[url]||{ok:false,status:404}
});
assert.equal(legacyPack.status,'ready');
assert.equal(legacyPack.spritePack,null);
assert.equal(resolveClientSpriteAnimation(legacyPack,100382,0).status,'sprite-assets-not-loaded');
console.log('authorized client sprite-shard loader and animation resolver tests passed');
