import {parseAdrnIndex,resolveClientImageId} from './stoneage_client_image_runtime.mjs';
import {decodeAuthorizedClientGraphic,decodeAuthorizedClientGraphicAsync} from './stoneage_rd_decoder.mjs';
import {parseSprAnimationPack,applyTargetSpritePostLoadFixups} from './stoneage_spr_decoder.mjs';

export const CLIENT_ASSET_PACK_FORMAT='stoneage-client-asset-pack-v1';

function asBytes(input){
  if(input instanceof Uint8Array)return input;
  if(input instanceof ArrayBuffer)return new Uint8Array(input);
  return new Uint8Array(input);
}

function optionalString(v){
  return typeof v==='string'&&v.trim()?v.trim():null;
}

function normalizeSpriteFile(value,label){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error(label+' must be a file object');
  const url=optionalString(value.url);
  if(!url)throw new Error(label+' requires a URL');
  return {url,sha256:optionalString(value.sha256)};
}

function normalizeSpriteShards(input){
  const shards=input??[];
  if(!Array.isArray(shards))throw new Error('files.spriteShards must be an array');
  return shards.map((shard,index)=>{
    if(!shard||typeof shard!=='object'||Array.isArray(shard))throw new Error('sprite shard '+index+' must be an object');
    const nextMaxAdrnID=shard.nextMaxAdrnID;
    if(!Number.isInteger(nextMaxAdrnID)||nextMaxAdrnID<0||nextMaxAdrnID>0xffffffff){
      throw new Error('sprite shard '+index+' requires an unsigned 32-bit nextMaxAdrnID');
    }
    return {
      nextMaxAdrnID,
      spradrn:normalizeSpriteFile(shard.spradrn,'sprite shard '+index+' spradrn'),
      spr:normalizeSpriteFile(shard.spr,'sprite shard '+index+' spr')
    };
  });
}

export function normalizeClientAssetPackManifest(input){
  if(!input||typeof input!=='object')throw new Error('client asset manifest must be an object');
  if(input.format!==CLIENT_ASSET_PACK_FORMAT)throw new Error('client asset manifest format mismatch');
  const status=input.status==='ready'?'ready':'unavailable';
  const source=input.source&&typeof input.source==='object'?input.source:{};
  const files=input.files&&typeof input.files==='object'?input.files:{};
  const adrn=files.adrn&&typeof files.adrn==='object'?files.adrn:null;
  const real=files.real&&typeof files.real==='object'?files.real:null;
  const spriteShards=normalizeSpriteShards(files.spriteShards);
  const authorizationNote=optionalString(source.authorizationNote);
  if(status==='ready'){
    if(!adrn?.url||!real?.url)throw new Error('ready client asset pack requires adrn and real URLs');
    if(!authorizationNote)throw new Error('ready client asset pack requires authorizationNote');
  }
  return {
    format:CLIENT_ASSET_PACK_FORMAT,
    status,
    source:{
      kind:optionalString(source.kind)||'operator-supplied',
      authorizationNote
    },
    files:{
      adrn:adrn?{url:String(adrn.url),sha256:optionalString(adrn.sha256)}:null,
      real:real?{url:String(real.url),sha256:optionalString(real.sha256)}:null,
      spriteShards
    }
  };
}

export function clientAssetPackSummary(pack){
  if(!pack||pack.status!=='ready'){
    return {
      status:'unavailable',
      text:pack?.reason==='manifest-fetch-failed'
        ?'Client 圖像：素材包讀取失敗，維持 fail-closed'
        :'Client 圖像：未提供可發布的 client asset pack'
    };
  }
  const records=Array.isArray(pack.index?.records)?pack.index.records.length:0;
  const mapped=pack.index?.bitmapnumberToGraphicNo?.size??0;
  const spriteCount=Array.isArray(pack.spritePack?.sprites)?pack.spritePack.sprites.length:0;
  const spriteText=pack.spritePack?' · SPR '+spriteCount+' 隻':'';
  return {
    status:'ready',
    text:'Client 圖像：素材包已載入 · ADRN '+records+' 筆 · 映像索引 '+mapped+spriteText
  };
}

async function sha256Hex(bytes){
  const subtle=globalThis.crypto?.subtle;
  if(!subtle)throw new Error('Web Crypto SHA-256 is unavailable');
  const digest=await subtle.digest('SHA-256',asBytes(bytes));
  return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
}

async function fetchAsset(fetchFn,url,label){
  const r=await fetchFn(url,{cache:'no-store'});
  if(!r?.ok)throw new Error(label+' HTTP '+(r?.status??'unknown'));
  if(typeof r.arrayBuffer!=='function')throw new Error(label+' response has no arrayBuffer()');
  return asBytes(await r.arrayBuffer());
}

function resolveUrl(path,manifestUrl,baseUrl){
  const base=baseUrl||globalThis.location?.href||'http://localhost/';
  return new URL(path,new URL(manifestUrl,base)).href;
}

export async function loadClientAssetPack({
  manifestUrl='client-assets/manifest.json',
  fetchFn=globalThis.fetch,
  baseUrl=null
}={}){
  if(typeof fetchFn!=='function'){
    return {status:'unavailable',reason:'fetch-unavailable',manifest:null,index:null,adrnBytes:null,realBytes:null,spritePack:null};
  }
  let response;
  try{
    const url=new URL(manifestUrl,baseUrl||globalThis.location?.href||'http://localhost/').href;
    response=await fetchFn(url,{cache:'no-store'});
  }catch(error){
    return {status:'unavailable',reason:'manifest-fetch-failed',error:String(error?.message||error),manifest:null,index:null,adrnBytes:null,realBytes:null,spritePack:null};
  }
  if(response?.status===404){
    return {status:'unavailable',reason:'manifest-not-found',manifest:null,index:null,adrnBytes:null,realBytes:null,spritePack:null};
  }
  if(!response?.ok||typeof response.json!=='function'){
    return {status:'unavailable',reason:'manifest-fetch-failed',error:'manifest HTTP '+(response?.status??'unknown'),manifest:null,index:null,adrnBytes:null,realBytes:null,spritePack:null};
  }
  const manifest=normalizeClientAssetPackManifest(await response.json());
  if(manifest.status!=='ready'){
    return {status:'unavailable',reason:'manifest-not-ready',manifest,index:null,adrnBytes:null,realBytes:null,spritePack:null};
  }
  try{
    const adrnUrl=resolveUrl(manifest.files.adrn.url,manifestUrl,baseUrl);
    const realUrl=resolveUrl(manifest.files.real.url,manifestUrl,baseUrl);
    const [adrnBytes,realBytes,spriteShardData]=await Promise.all([
      fetchAsset(fetchFn,adrnUrl,'ADRN'),
      fetchAsset(fetchFn,realUrl,'Real'),
      Promise.all(manifest.files.spriteShards.map(async(shard,shardIndex)=>{
        const spradrnUrl=resolveUrl(shard.spradrn.url,manifestUrl,baseUrl);
        const sprUrl=resolveUrl(shard.spr.url,manifestUrl,baseUrl);
        const [spradrnBytes,sprBytes]=await Promise.all([
          fetchAsset(fetchFn,spradrnUrl,'SPRADRN shard '+shardIndex),
          fetchAsset(fetchFn,sprUrl,'SPR shard '+shardIndex)
        ]);
        if(shard.spradrn.sha256){
          const got=await sha256Hex(spradrnBytes);
          if(got.toLowerCase()!==shard.spradrn.sha256.toLowerCase())throw new Error('SPRADRN shard '+shardIndex+' SHA-256 mismatch');
        }
        if(shard.spr.sha256){
          const got=await sha256Hex(sprBytes);
          if(got.toLowerCase()!==shard.spr.sha256.toLowerCase())throw new Error('SPR shard '+shardIndex+' SHA-256 mismatch');
        }
        return {spradrnBytes,sprBytes,nextMaxAdrnID:shard.nextMaxAdrnID};
      }))
    ]);
    if(manifest.files.adrn.sha256){
      const got=await sha256Hex(adrnBytes);
      if(got.toLowerCase()!==manifest.files.adrn.sha256.toLowerCase())throw new Error('ADRN SHA-256 mismatch');
    }
    if(manifest.files.real.sha256){
      const got=await sha256Hex(realBytes);
      if(got.toLowerCase()!==manifest.files.real.sha256.toLowerCase())throw new Error('Real SHA-256 mismatch');
    }
    const index=parseAdrnIndex(adrnBytes);
    let spritePack=null;
    if(spriteShardData.length){
      const spriteBySlot=new Map();
      const parsedShards=spriteShardData.map((shard,shardIndex)=>{
        const parsed=parseSprAnimationPack(shard.spradrnBytes,shard.sprBytes,{nextMaxAdrnID:shard.nextMaxAdrnID});
        for(const sprite of parsed.sprites){
          if(spriteBySlot.has(sprite.slot))throw new Error('duplicate sprite slot across sprite shards: '+sprite.slot);
          spriteBySlot.set(sprite.slot,sprite);
        }
        return {shardIndex,nextMaxAdrnID:shard.nextMaxAdrnID,spriteCount:parsed.sprites.length};
      });
      const rawSprites=[...spriteBySlot.values()].sort((a,b)=>a.slot-b.slot);
      const corrected=applyTargetSpritePostLoadFixups(rawSprites);
      const sprites=corrected.sprites;
      spritePack={
        format:'stoneage-client-spr-pack-v1',
        status:'ready',
        shardCount:parsedShards.length,
        spriteCount:sprites.length,
        shards:parsedShards,
        appliedFixups:corrected.appliedFixups,
        sprites,
        spriteByNo:new Map(sprites.map(sprite=>[sprite.sprNo,sprite]))
      };
    }
    return {status:'ready',reason:'ok',manifest,index,adrnBytes,realBytes,spritePack};
  }catch(error){
    return {status:'unavailable',reason:'asset-load-failed',error:String(error?.message||error),manifest,index:null,adrnBytes:null,realBytes:null,spritePack:null};
  }
}

export function resolveClientSpriteAnimation(pack,sprNo,animationIndex){
  if(!pack||pack.status!=='ready')return null;
  if(!pack.spritePack)return {status:'sprite-assets-not-loaded',sprNo:Number(sprNo)};
  const id=Number(sprNo),index=Number(animationIndex);
  if(!Number.isSafeInteger(id)||!Number.isSafeInteger(index)||index<0){
    return {status:'invalid-sprite-reference',sprNo,animationIndex};
  }
  const sprite=pack.spritePack.spriteByNo?.get(id)
    ??pack.spritePack.sprites?.find(item=>item.sprNo===id);
  if(!sprite)return {status:'missing-sprite',sprNo:id};
  const animation=sprite.animations[index];
  if(!animation)return {status:'missing-animation',sprNo:id,animationIndex:index};
  return {status:'ready',sprNo:id,slot:sprite.slot,animationIndex:index,animation};
}

export async function resolveClientTilePixelsAsync(pack,imageId){
  if(!pack||pack.status!=='ready'||!pack.index||!pack.realBytes)return null;
  const graphic=resolveClientImageId(pack.index,imageId);
  if(!graphic)return {status:'missing-image-id',imageId:Number(imageId)};
  try{
    const decoded=await decodeAuthorizedClientGraphicAsync(pack.realBytes,graphic);
    if(!decoded)return {status:'decode-failed',imageId:Number(imageId),graphicNo:graphic.graphicNo};
    return {
      status:'ready',
      imageId:graphic.imageId,
      graphicNo:graphic.graphicNo,
      width:decoded.width,
      height:decoded.height,
      pixels:decoded.pixels,
      bytesPerPixel:decoded.bytesPerPixel??1,
      xoffset:graphic.xoffset,
      yoffset:graphic.yoffset
    };
  }catch(error){
    return {
      status:'decode-failed',
      imageId:graphic.imageId,
      graphicNo:graphic.graphicNo,
      error:String(error?.message||error)
    };
  }
}

export function resolveClientTilePixels(pack,imageId){
  if(!pack||pack.status!=='ready'||!pack.index||!pack.realBytes)return null;
  const graphic=resolveClientImageId(pack.index,imageId);
  if(!graphic)return {status:'missing-image-id',imageId:Number(imageId)};
  try{
    const decoded=decodeAuthorizedClientGraphic(pack.realBytes,graphic);
    if(!decoded||!decoded.pixels||!Number.isInteger(decoded.width)||!Number.isInteger(decoded.height)){
      return {status:'decode-failed',imageId:Number(imageId),graphicNo:graphic.graphicNo};
    }
    if(decoded.bytesPerPixel===4){
      return {status:'decode-failed',imageId:Number(imageId),graphicNo:graphic.graphicNo,error:'async decoder required for RGBA or PNG graphics'};
    }
    return {
      status:'ready',
      imageId:graphic.imageId,
      graphicNo:graphic.graphicNo,
      width:decoded.width,
      height:decoded.height,
      pixels:decoded.pixels,
      bytesPerPixel:decoded.bytesPerPixel??1,
      xoffset:graphic.xoffset,
      yoffset:graphic.yoffset
    };
  }catch(error){
    return {
      status:'decode-failed',
      imageId:graphic.imageId,
      graphicNo:graphic.graphicNo,
      error:String(error?.message||error)
    };
  }
}
