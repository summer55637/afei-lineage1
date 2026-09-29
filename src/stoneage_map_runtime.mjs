export const SOURCE_MAP_RUNTIME_INDEX_URL='data/generated/stoneage_map_runtime_index.json';

const cache=new Map();
const promises=new Map();
let indexPromise=null;

async function loadIndex(fetchImpl=globalThis.fetch){
  if(!indexPromise){
    indexPromise=fetchImpl(SOURCE_MAP_RUNTIME_INDEX_URL,{cache:'no-store'}).then(r=>{
      if(!r.ok)throw new Error('source map runtime index HTTP '+r.status);
      return r.json();
    }).catch(err=>{indexPromise=null;throw err});
  }
  return indexPromise;
}

export async function loadSourceMapRuntime(floorId,{fetchImpl=globalThis.fetch}={}){
  const id=String(Math.trunc(Number(floorId)));
  if(!/^[-]?\d+$/.test(id))return null;
  if(cache.has(id))return cache.get(id);
  if(promises.has(id))return promises.get(id);
  const promise=(async()=>{
    const index=await loadIndex(fetchImpl);
    const entry=index?.maps?.[id];
    if(!entry)return null;
    const r=await fetchImpl('./'+entry.path.replace(/^\.\//,''),{cache:'no-store'});
    if(!r.ok)throw new Error('source map runtime HTTP '+r.status);
    const map=await r.json();
    if(Number(map.floorId)!==Number(entry.floorId))throw new Error('source map floor mismatch');
    if(Number(map.width)!==Number(entry.width)||Number(map.height)!==Number(entry.height))throw new Error('source map dimension mismatch');
    cache.set(id,map);
    return map;
  })();
  promises.set(id,promise);
  try{return await promise}finally{promises.delete(id)}
}

export function sourceMapTileAt(map,x,y){
  if(!map)return null;
  const xi=Math.trunc(Number(x)),yi=Math.trunc(Number(y));
  if(!Number.isFinite(xi)||!Number.isFinite(yi))return null;
  if(xi<0||yi<0||xi>=Number(map.width)||yi>=Number(map.height))return null;
  const index=yi*Number(map.width)+xi;
  return {x:xi,y:yi,tile:Number(map.tiles?.[index]),object:Number(map.objects?.[index]),index};
}

export function sourceMapBattleCandidates(map,tileId){
  const key=String(Math.trunc(Number(tileId)));
  const row=map?.battlemapResolver?.candidatesByImageId?.[key];
  return Array.isArray(row)?row.map(v=>Math.trunc(Number(v))):null;
}

export function sourceMapBattleCandidatesAt(map,x,y){
  const tile=sourceMapTileAt(map,x,y);
  if(!tile)return null;
  return Object.assign({},tile,{battleCandidates:sourceMapBattleCandidates(map,tile.tile)});
}

export function sourceMapBattleFieldNoAt(map,x,y,{randIndex}={}){
  const resolved=sourceMapBattleCandidatesAt(map,x,y);
  if(!resolved||!Array.isArray(resolved.battleCandidates)||resolved.battleCandidates.length!==3)return null;
  if(typeof randIndex!=='function')return Object.assign({},resolved,{battleFieldNo:null,selection:null,reason:'rng-not-provided'});
  const selected=Math.trunc(Number(randIndex(0,2)));
  if(!Number.isFinite(selected)||selected<0||selected>2)return Object.assign({},resolved,{battleFieldNo:null,selection:null,reason:'rng-index-invalid'});
  return Object.assign({},resolved,{battleFieldNo:resolved.battleCandidates[selected],selection:selected});
}

export function sourceMapRuntimeSummary(map){
  if(!map)return {status:'unresolved'};
  return {status:'ready',floorId:Number(map.floorId),width:Number(map.width),height:Number(map.height),tileCount:Array.isArray(map.tiles)?map.tiles.length:0,objectCount:Array.isArray(map.objects)?map.objects.length:0};
}
export const SOURCE_MAPSET_RUNTIME_URL='data/generated/stoneage_mapset_runtime.json';
let sourceMapsetPromise=null;

export async function loadSourceMapsetRuntime({fetchImpl=globalThis.fetch}={}){
  if(!sourceMapsetPromise){
    sourceMapsetPromise=fetchImpl(SOURCE_MAPSET_RUNTIME_URL,{cache:'no-store'}).then(r=>{
      if(!r.ok)throw new Error('source mapset runtime HTTP '+r.status);
      return r.json();
    }).catch(err=>{sourceMapsetPromise=null;throw err});
  }
  return sourceMapsetPromise;
}

export function sourceMapImageAttributes(mapset,imageId){
  if(!mapset||imageId==null)return null;
  const id=Math.trunc(Number(imageId));
  if(!Number.isFinite(id))return null;
  const key=String(id);
  if(!Object.prototype.hasOwnProperty.call(mapset.walkableByImageId||{},key))return null;
  return {
    imageId:id,
    walkable:mapset.walkableByImageId[key]===1,
    haveHeight:Array.isArray(mapset.haveHeightImageIds)&&mapset.haveHeightImageIds.includes(id),
    defence:Number(mapset.defaultData?.defence??-1),
    introDamage:Number(mapset.defaultData?.intodamage??0),
    outofDamage:Number(mapset.defaultData?.outofdamage??0),
  };
}

export function sourceMapTileWithAttributes(map,tileX,tileY,mapset){
  if(!map)return null;
  const tile={x:Math.trunc(Number(tileX)),y:Math.trunc(Number(tileY))};
  if(!Number.isFinite(tile.x)||!Number.isFinite(tile.y)||tile.x<0||tile.y<0||tile.x>=Number(map.width)||tile.y>=Number(map.height))return null;
  const index=tile.y*Number(map.width)+tile.x;
  const imageId=Number(map.tiles?.[index]);
  return {x:tile.x,y:tile.y,index,tile:imageId,object:Number(map.objects?.[index]),attributes:sourceMapImageAttributes(mapset,imageId)};
}