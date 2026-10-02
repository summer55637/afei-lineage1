import {loadClientAssetPack,resolveClientTilePixels,resolveClientTilePixelsAsync} from './stoneage_client_asset_pack.mjs';
import {parseStoneAgeSap,indexedPixelsToRgba,stoneAgePaletteSummary} from './stoneage_palette_runtime.mjs';

const SAP_BYTES=672;

function bytesOf(input){return input instanceof Uint8Array?input:new Uint8Array(input);}

async function fetchBytes(fetchFn,url,label){
  const r=await fetchFn(url,{cache:'no-store'});
  if(!r?.ok||typeof r.arrayBuffer!=='function')throw new Error(label+' HTTP '+(r?.status??'unknown'));
  return bytesOf(await r.arrayBuffer());
}

export async function loadClientTilePresentation({
  assetManifestUrl='client-assets/manifest.json',
  paletteUrl='client-assets/Palet_1.sap',
  fetchFn=globalThis.fetch,
  baseUrl=null
}={}){
  if(typeof fetchFn!=='function')return {status:'unavailable',reason:'fetch-unavailable'};
  const pack=await loadClientAssetPack({manifestUrl:assetManifestUrl,fetchFn,baseUrl});
  if(pack.status!=='ready')return {status:'unavailable',reason:'asset-pack-'+pack.reason,pack,palette:null};
  let paletteBytes;
  try{
    const url=new URL(paletteUrl,baseUrl||globalThis.location?.href||'http://localhost/').href;
    paletteBytes=await fetchBytes(fetchFn,url,'SAP');
  }catch(error){
    return {status:'unavailable',reason:'palette-load-failed',error:String(error?.message||error),pack,palette:null};
  }
  if(paletteBytes.length<SAP_BYTES)return {status:'unavailable',reason:'palette-too-short',pack,palette:null};
  const palette=parseStoneAgeSap(paletteBytes);
  return {status:'ready',reason:'ok',pack,palette};
}

function clearCanvas(ctx,canvas){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='rgba(8,12,8,.78)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.imageSmoothingEnabled=false;
}

function drawGraphic(ctx,canvas,graphic,rgba,scale,originX,originY,label){
  const w=graphic.width,h=graphic.height;
  if(w<=0||h<=0)return false;
  const imageBytes=rgba instanceof Uint8ClampedArray?rgba:Uint8ClampedArray.from(rgba);
  const imageData=new ImageData(imageBytes,w,h);
  const bitmap=document.createElement('canvas');
  bitmap.width=w;bitmap.height=h;
  bitmap.getContext('2d').putImageData(imageData,0,0);
  const dx=Math.round(originX+graphic.xoffset*scale-(w*scale)/2);
  const dy=Math.round(originY+graphic.yoffset*scale-(h*scale)/2);
  ctx.drawImage(bitmap,dx,dy,w*scale,h*scale);
  if(label){ctx.fillStyle='rgba(10,14,9,.82)';ctx.fillRect(dx,Math.max(0,dy-15),Math.min(canvas.width,Math.max(0,w*scale)),14);ctx.fillStyle='rgba(239,231,205,.92)';ctx.font='10px system-ui';ctx.fillText(label,dx+4,Math.max(10,dy-4));}
  return true;
}

export function renderSourceTileObjectPreview(ctx,presentation,{tileId,objectId,scale=1,showLabels=true}={}){
  const canvas=ctx?.canvas;
  if(!ctx||!canvas||presentation?.status!=='ready')return {status:'unavailable',reason:presentation?.reason||'presentation-not-ready'};
  const tile=resolveClientTilePixels(presentation.pack,tileId);
  if(tile?.status!=='ready')return {status:'tile-'+(tile?.status||'missing')};
  const tileRgba=indexedPixelsToRgba(tile.pixels,tile.width,tile.height,presentation.palette);
  let object=null,objectRgba=null;
  const oid=Math.trunc(Number(objectId));
  if(Number.isFinite(oid)&&oid>0){
    object=resolveClientTilePixels(presentation.pack,oid);
    if(object?.status==='ready')objectRgba=indexedPixelsToRgba(object.pixels,object.width,object.height,presentation.palette);
  }
  clearCanvas(ctx,canvas);
  const ox=canvas.width/2,oy=canvas.height/2+12;
  const tileScale=Math.max(1,Math.min(Number(scale)||1,4));
  const objectScale=tileScale;
  drawGraphic(ctx,canvas,tile,tileRgba,tileScale,ox,oy,showLabels?'T '+tileId:null);
  if(object&&objectRgba)drawGraphic(ctx,canvas,object,objectRgba,objectScale,ox,oy,showLabels?'O '+oid:null);
  ctx.strokeStyle='rgba(212,180,95,.42)';ctx.strokeRect(.5,.5,canvas.width-1,canvas.height-1);
  return {status:'ready',tileId:Number(tileId),objectId:Number.isFinite(oid)&&oid>0?oid:0,objectDecoded:Boolean(objectRgba),width:tile.width,height:tile.height};
}

function graphicPixelsToRgba(graphic,palette){
  if(graphic.bytesPerPixel===4){
    const expected=graphic.width*graphic.height*4;
    if(graphic.pixels.length!==expected)throw new Error('RGBA pixel count mismatch');
    return Uint8ClampedArray.from(graphic.pixels);
  }
  return indexedPixelsToRgba(graphic.pixels,graphic.width,graphic.height,palette);
}

export async function renderSourceTileObjectPreviewAsync(ctx,presentation,{tileId,objectId,scale=1,showLabels=true}={}){
  const canvas=ctx?.canvas;
  if(!ctx||!canvas||presentation?.status!=='ready')return {status:'unavailable',reason:presentation?.reason||'presentation-not-ready'};
  const tile=await resolveClientTilePixelsAsync(presentation.pack,tileId);
  if(tile?.status!=='ready')return {status:'tile-'+(tile?.status||'missing')};
  let tileRgba;
  try{tileRgba=graphicPixelsToRgba(tile,presentation.palette);}
  catch(error){return {status:'tile-pixel-conversion-failed',error:String(error?.message||error)};}

  let object=null,objectRgba=null;
  const oid=Math.trunc(Number(objectId));
  if(Number.isFinite(oid)&&oid>0){
    object=await resolveClientTilePixelsAsync(presentation.pack,oid);
    if(object?.status==='ready'){
      try{objectRgba=graphicPixelsToRgba(object,presentation.palette);}
      catch{object=null;objectRgba=null;}
    }
  }
  clearCanvas(ctx,canvas);
  const ox=canvas.width/2,oy=canvas.height/2+12;
  const tileScale=Math.max(1,Math.min(Number(scale)||1,4));
  drawGraphic(ctx,canvas,tile,tileRgba,tileScale,ox,oy,showLabels?'T '+tileId:null);
  if(object&&objectRgba)drawGraphic(ctx,canvas,object,objectRgba,tileScale,ox,oy,showLabels?'O '+oid:null);
  ctx.strokeStyle='rgba(212,180,95,.42)';ctx.strokeRect(.5,.5,canvas.width-1,canvas.height-1);
  return {
    status:'ready',
    tileId:Number(tileId),
    objectId:Number.isFinite(oid)&&oid>0?oid:0,
    objectDecoded:Boolean(objectRgba),
    pixelFormats:{tile:tile.bytesPerPixel===4?'rgba':'indexed',object:object?.bytesPerPixel===4?'rgba':object?'indexed':'none'},
    width:tile.width,
    height:tile.height
  };
}

export function clientTilePresentationSummary(presentation){
  if(presentation?.status!=='ready')return {status:'unavailable',reason:presentation?.reason||'unavailable'};
  return {status:'ready',palette:stoneAgePaletteSummary(presentation.palette),assetRecords:presentation.pack.index?.records?.length??0,mappedImageIds:presentation.pack.index?.bitmapnumberToGraphicNo?.size??0};
}