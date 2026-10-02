import {parseAdrnIndex,resolveClientImageId} from './stoneage_client_image_runtime.mjs';
import {decodeAuthorizedClientGraphic,decodeAuthorizedClientGraphicAsync} from './stoneage_rd_decoder.mjs';

export const CLIENT_ASSET_PACK_FORMAT='stoneage-client-asset-pack-v1';

function asBytes(input){
  if(input instanceof Uint8Array)return input;
  if(input instanceof ArrayBuffer)return new Uint8Array(input);
  return new Uint8Array(input);
}

function optionalString(v){
  return typeof v==='string'&&v.trim()?v.trim():null;
}

export function normalizeClientAssetPackManifest(input){
  if(!input||typeof input!=='object')throw new Error('client asset manifest must be an object');
  if(input.format!==CLIENT_ASSET_PACK_FORMAT)throw new Error('client asset manifest format mismatch');
  const status=input.status==='ready'?'ready':'unavailable';
  const source=input.source&&typeof input.source==='object'?input.source:{};
  const files=input.files&&typeof input.files==='object'?input.files:{};
  const adrn=files.adrn&&typeof files.adrn==='object'?files.adrn:null;
  const real=files.real&&typeof files.real==='object'?files.real:null;
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
      real:real?{url:String(real.url),sha256:optionalString(real.sha256)}:null
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
  return {
    status:'ready',
    text:'Client 圖像：素材包已載入 · ADRN '+records+' 筆 · 映像索引 '+mapped
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
    return {status:'unavailable',reason:'fetch-unavailable',manifest:null,index:null,adrnBytes:null,realBytes:null};
  }
  let response;
  try{
    const url=new URL(manifestUrl,baseUrl||globalThis.location?.href||'http://localhost/').href;
    response=await fetchFn(url,{cache:'no-store'});
  }catch(error){
    return {status:'unavailable',reason:'manifest-fetch-failed',error:String(error?.message||error),manifest:null,index:null,adrnBytes:null,realBytes:null};
  }
  if(response?.status===404){
    return {status:'unavailable',reason:'manifest-not-found',manifest:null,index:null,adrnBytes:null,realBytes:null};
  }
  if(!response?.ok||typeof response.json!=='function'){
    return {status:'unavailable',reason:'manifest-fetch-failed',error:'manifest HTTP '+(response?.status??'unknown'),manifest:null,index:null,adrnBytes:null,realBytes:null};
  }
  const manifest=normalizeClientAssetPackManifest(await response.json());
  if(manifest.status!=='ready'){
    return {status:'unavailable',reason:'manifest-not-ready',manifest,index:null,adrnBytes:null,realBytes:null};
  }
  try{
    const adrnUrl=resolveUrl(manifest.files.adrn.url,manifestUrl,baseUrl);
    const realUrl=resolveUrl(manifest.files.real.url,manifestUrl,baseUrl);
    const [adrnBytes,realBytes]=await Promise.all([
      fetchAsset(fetchFn,adrnUrl,'ADRN'),
      fetchAsset(fetchFn,realUrl,'Real')
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
    return {status:'ready',reason:'ok',manifest,index,adrnBytes,realBytes};
  }catch(error){
    return {status:'unavailable',reason:'asset-load-failed',error:String(error?.message||error),manifest,index:null,adrnBytes:null,realBytes:null};
  }
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
    if(!decoded)return {status:'decode-failed',imageId:Number(imageId),graphicNo:graphic.graphicNo};
    return {
      status:'ready',
      imageId:graphic.imageId,
      graphicNo:graphic.graphicNo,
      width:decoded.width,
      height:decoded.height,
      pixels:decoded.pixels,
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
