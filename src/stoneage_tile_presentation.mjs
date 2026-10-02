import {loadClientAssetPack,resolveClientTilePixels,resolveClientTilePixelsAsync} from './stoneage_client_asset_pack.mjs';
import {parseStoneAgeSap,indexedPixelsToRgba,stoneAgePaletteSummary} from './stoneage_palette_runtime.mjs';
import {decodeBattleSabex} from './stoneage_sabex_decoder.mjs';

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
  const bitmap=typeof OffscreenCanvas==='function'
    ?new OffscreenCanvas(w,h)
    :document.createElement('canvas');
  bitmap.width=w;bitmap.height=h;
  const bitmapContext=bitmap.getContext('2d');
  if(!bitmapContext)throw new Error('2D bitmap canvas context is unavailable');
  bitmapContext.putImageData(imageData,0,0);
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

export const TARGET_BATTLE_GRID_SIZE=33;
export const TARGET_BATTLE_HORIZONTAL_STEP=32;
export const TARGET_BATTLE_VERTICAL_STEP=23;
const TARGET_BATTLE_BASE_X=-450;
const TARGET_BATTLE_BASE_Y=350;

export function targetBattleCellPosition(row,col,{originX=0,originY=0,scale=1}={}){
  const r=Number(row),c=Number(col),s=Number(scale);
  if(!Number.isInteger(r)||r<0||r>=TARGET_BATTLE_GRID_SIZE)throw new RangeError('battle row must be 0..32');
  if(!Number.isInteger(c)||c<0||c>=TARGET_BATTLE_GRID_SIZE)throw new RangeError('battle column must be 0..32');
  if(!Number.isFinite(s)||s<=0)throw new RangeError('battle cell scale must be positive');
  const centerX=TARGET_BATTLE_BASE_X+TARGET_BATTLE_HORIZONTAL_STEP*32;
  const centerY=TARGET_BATTLE_BASE_Y;
  const targetX=TARGET_BATTLE_BASE_X+TARGET_BATTLE_HORIZONTAL_STEP*(r+c);
  const targetY=TARGET_BATTLE_BASE_Y+TARGET_BATTLE_VERTICAL_STEP*(r-c);
  return {
    x:originX+(targetX-centerX)*s,
    y:originY+(targetY-centerY)*s,
    targetX,
    targetY
  };
}

export async function renderBattleSabexPreviewAsync(ctx,presentation,sabexInput,{
  scale=null,
  fitToCanvas=true,
  padding=12,
  requireSabHeader=false,
  showCellLabels=false
}={}){
  const canvas=ctx?.canvas;
  if(!ctx||!canvas||presentation?.status!=='ready'){
    return {status:'unavailable',reason:presentation?.reason||'presentation-not-ready'};
  }

  let decoded;
  try{
    decoded=decodeBattleSabex(sabexInput,{requireSabHeader});
  }catch(error){
    return {status:'invalid-sabex',error:String(error?.message||error)};
  }

  const imageIds=[...new Set(decoded.cells.filter(id=>id>99))];
  const imageEntries=await Promise.all(imageIds.map(async imageId=>[
    imageId,
    await resolveClientTilePixelsAsync(presentation.pack,imageId)
  ]));
  const images=new Map(imageEntries);

  const cells=[];
  let skippedInvisibleCount=0;
  const unresolvedImageIds=new Set();
  for(let row=0;row<TARGET_BATTLE_GRID_SIZE;row++){
    for(let col=0;col<TARGET_BATTLE_GRID_SIZE;col++){
      const index=row*TARGET_BATTLE_GRID_SIZE+col;
      const imageId=decoded.cells[index];
      if(imageId<=99){
        skippedInvisibleCount++;
        continue;
      }
      const graphic=images.get(imageId);
      if(graphic?.status!=='ready'){
        unresolvedImageIds.add(imageId);
        continue;
      }
      try{
        const rgba=graphicPixelsToRgba(graphic,presentation.palette);
        const position=targetBattleCellPosition(row,col);
        cells.push({row,col,imageId,graphic,rgba,position});
      }catch{
        unresolvedImageIds.add(imageId);
      }
    }
  }

  clearCanvas(ctx,canvas);
  if(!cells.length){
    ctx.strokeStyle='rgba(212,180,95,.42)';
    ctx.strokeRect(.5,.5,canvas.width-1,canvas.height-1);
    return {
      status:unresolvedImageIds.size?'unavailable':'ready',
      reason:unresolvedImageIds.size?'no-battle-tiles-resolved':'no-drawable-battle-tiles',
      header:decoded.header,
      grid:decoded.grid,
      drawnCells:0,
      skippedInvisibleCount,
      unresolvedCellCount:decoded.cells.filter(id=>id>99).length,
      unresolvedImageIds:[...unresolvedImageIds].sort((a,b)=>a-b),
      scale:0
    };
  }

  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const item of cells){
    const g=item.graphic,p=item.position;
    const left=p.x+g.xoffset-g.width/2;
    const top=p.y+g.yoffset-g.height/2;
    minX=Math.min(minX,left);
    minY=Math.min(minY,top);
    maxX=Math.max(maxX,left+g.width);
    maxY=Math.max(maxY,top+g.height);
  }
  const boundsWidth=Math.max(1,maxX-minX);
  const boundsHeight=Math.max(1,maxY-minY);
  const safePadding=Math.max(0,Number(padding)||0);
  const fitScale=Math.min(
    4,
    (canvas.width-2*safePadding)/boundsWidth,
    (canvas.height-2*safePadding)/boundsHeight
  );
  const explicitScale=Number(scale);
  const drawScale=Number.isFinite(explicitScale)&&explicitScale>0
    ?explicitScale
    :fitToCanvas?Math.max(.01,fitScale):1;
  const shiftX=canvas.width/2-((minX+maxX)/2)*drawScale;
  const shiftY=canvas.height/2-((minY+maxY)/2)*drawScale;

  // Preserve target ReadBattleMap's row-major StockDispBuffer submission order.
  for(const item of cells){
    const x=shiftX+item.position.x*drawScale;
    const y=shiftY+item.position.y*drawScale;
    drawGraphic(
      ctx,canvas,item.graphic,item.rgba,drawScale,x,y,
      showCellLabels?'('+item.row+','+item.col+') '+item.imageId:null
    );
  }
  ctx.strokeStyle='rgba(212,180,95,.42)';
  ctx.strokeRect(.5,.5,canvas.width-1,canvas.height-1);

  const drawableCellCount=decoded.cells.filter(id=>id>99).length;
  const unresolvedCellCount=drawableCellCount-cells.length;
  return {
    status:unresolvedCellCount?'partial':'ready',
    reason:unresolvedCellCount?'some-battle-tiles-unresolved':'ok',
    header:decoded.header,
    grid:decoded.grid,
    drawnCells:cells.length,
    drawableCellCount,
    skippedInvisibleCount,
    unresolvedCellCount,
    unresolvedImageIds:[...unresolvedImageIds].sort((a,b)=>a-b),
    scale:drawScale,
    geometry:{
      horizontalStep:TARGET_BATTLE_HORIZONTAL_STEP,
      verticalStep:TARGET_BATTLE_VERTICAL_STEP,
      submissionOrder:'row-major',
      coordinateFormula:'x=32*(row+col-32); y=23*(row-col)'
    }
  };
}

export function clientTilePresentationSummary(presentation){
  if(presentation?.status!=='ready')return {status:'unavailable',reason:presentation?.reason||'unavailable'};
  return {status:'ready',palette:stoneAgePaletteSummary(presentation.palette),assetRecords:presentation.pack.index?.records?.length??0,mappedImageIds:presentation.pack.index?.bitmapnumberToGraphicNo?.size??0};
}