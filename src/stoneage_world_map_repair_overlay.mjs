export const KARUTARNA_ROAD_ACCESS_REPAIR_OVERLAY_ID='karutarna-4000-road-access-v1';
export const KARUTARNA_ROAD_ACCESS_REPAIR_OVERLAY=Object.freeze({
  format:'stoneage-world-map-repair-overlay-v1',
  id:KARUTARNA_ROAD_ACCESS_REPAIR_OVERLAY_ID,
  scope:'product-only',
  floorId:4000,
  source:{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',path:'gmsv/data/map/jyaruga/karutana/karutana',blobSha:'1429c3717685b9fb05ff7f07979cc1ce967c3eea',width:150,height:150},
  patches:[
    {x:91,y:109,fromTile:409,toTile:321,object:27},
    {x:92,y:109,fromTile:196,toTile:321,object:27},
    {x:93,y:109,fromTile:307,toTile:321,object:0}
  ]
});

export function resolveRouteProductRepair(routeCatalog,route,variant){
  const repairId=route?.productRepairId;
  if(repairId!==KARUTARNA_ROAD_ACCESS_REPAIR_OVERLAY_ID)return null;
  const repair=routeCatalog?.productRepairs?.[repairId];
  if(!repair||repair.id!==repairId||repair.overlayId!==KARUTARNA_ROAD_ACCESS_REPAIR_OVERLAY_ID)return null;
  if(repair.status!=='runtime-enabled'||Number(repair.floorId)!==4000)return null;
  if(Number(route?.hometown)!==3||Number(route?.entryFloor)!==4000||Number(route?.encounterFloor)!==200)return null;
  if(!Array.isArray(repair.portalIds)||!repair.portalIds.includes(String(variant?.portalId)))return null;
  if(!Number.isInteger(Number(repair.usableLandingCountPerVariant))||Number(repair.usableLandingCountPerVariant)<1)return null;
  return repair;
}

export function applyWorldMapRepairOverlay(map,overlay=KARUTARNA_ROAD_ACCESS_REPAIR_OVERLAY){
  if(!map||!overlay||Number(map.floorId)!==Number(overlay.floorId))return map;
  if(overlay.format!=='stoneage-world-map-repair-overlay-v1'||overlay.id!==KARUTARNA_ROAD_ACCESS_REPAIR_OVERLAY_ID)throw new Error('world map repair overlay identity mismatch');
  const expected=KARUTARNA_ROAD_ACCESS_REPAIR_OVERLAY.source;
  const source=map.source??{};
  for(const key of ['repository','ref','path','blobSha'])if(source[key]!==expected[key])throw new Error('world map repair source mismatch: '+key);
  if(Number(map.width)!==expected.width||Number(map.height)!==expected.height)throw new Error('world map repair dimensions mismatch');
  if(!Array.isArray(map.tiles)||map.tiles.length!==expected.width*expected.height)throw new Error('world map repair tile array invalid');
  if(!Array.isArray(map.objects)||map.objects.length!==expected.width*expected.height)throw new Error('world map repair object array invalid');
  if(map.repairOverlay?.id===overlay.id){
    for(const patch of overlay.patches){const index=patch.y*expected.width+patch.x;if(Number(map.tiles[index])!==patch.toTile||Number(map.objects[index])!==patch.object)throw new Error('world map repair idempotence check failed');}
    return map;
  }
  const tiles=map.tiles.slice();
  for(const patch of overlay.patches){
    if(!Number.isInteger(patch.x)||!Number.isInteger(patch.y)||patch.x<0||patch.y<0||patch.x>=expected.width||patch.y>=expected.height)throw new Error('world map repair cell out of bounds');
    const index=patch.y*expected.width+patch.x;
    if(Number(map.tiles[index])!==patch.fromTile||Number(map.objects[index])!==patch.object)throw new Error('world map repair cell preimage mismatch at '+patch.x+','+patch.y);
    if(!Number.isInteger(patch.toTile)||patch.toTile<0)throw new Error('world map repair tile invalid');
    tiles[index]=patch.toTile;
  }
  return {...map,tiles,repairOverlay:{id:overlay.id,scope:'product-only',sourceBlobSha:expected.blobSha,patchedCells:overlay.patches.map(({x,y,fromTile,toTile})=>({x,y,fromTile,toTile}))}};
}

export function withWorldMapRepairOverlay(loadMap,overlay=KARUTARNA_ROAD_ACCESS_REPAIR_OVERLAY){
  if(typeof loadMap!=='function'||!overlay)return loadMap;
  return async(...args)=>applyWorldMapRepairOverlay(await loadMap(...args),overlay);
}
