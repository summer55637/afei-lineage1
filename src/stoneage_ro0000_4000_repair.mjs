import overlay from '../data/generated/stoneage_ro0000_4000_walkability_repair_overlay.json' with { type: 'json' };

export const RO0000_4000_REPAIR_OVERLAY_FORMAT='stoneage-ro0000-4000-walkability-repair-overlay-v1';

function normalizeInt(value){
  return Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : null;
}

function sameRepairCell(cell,entry){
  return Number(cell?.floorId)===Number(entry?.floorId)
    && Number(cell?.x)===Number(entry?.x)
    && Number(cell?.y)===Number(entry?.y);
}

export function ro0000_4000RepairOverlay(){
  return overlay;
}

export function isRo0000_4000WalkabilityRepairCell(floorId,x,y){
  const cell={floorId:normalizeInt(floorId),x:normalizeInt(x),y:normalizeInt(y)};
  if(cell.floorId===null||cell.x===null||cell.y===null)return false;
  return Array.isArray(overlay?.cells)&&overlay.cells.some(entry=>sameRepairCell(cell,entry)&&entry.repairWalkable===true);
}

export function assertRo0000_4000RepairCellMatchesSource(map,x,y){
  if(Number(map?.floorId)!==4000)return {ok:false,reason:'repair-map-floor-mismatch'};
  const xi=normalizeInt(x),yi=normalizeInt(y);
  const entry=overlay?.cells?.find(item=>item.x===xi&&item.y===yi);
  if(!entry)return {ok:false,reason:'repair-cell-not-declared'};
  const index=yi*Number(map.width)+xi;
  const actualTile=Number(map.tiles?.[index]);
  const actualObject=Number(map.objects?.[index]);
  if(actualTile!==Number(entry.sourceTile)||actualObject!==Number(entry.sourceObject)){
    return {
      ok:false,
      reason:'repair-source-cell-mismatch',
      expected:{tile:Number(entry.sourceTile),object:Number(entry.sourceObject)},
      actual:{tile:actualTile,object:actualObject},
      cell:{floorId:4000,x:xi,y:yi}
    };
  }
  return {ok:true,cell:{floorId:4000,x:xi,y:yi},source:{tile:actualTile,object:actualObject}};
}

export function ro0000SourceMapWalkableAt(map,x,y,mapset,{flying=false,sourceMapWalkableAt}={}){
  if(typeof sourceMapWalkableAt!=='function')return false;
  if(!isRo0000_4000WalkabilityRepairCell(map?.floorId,x,y)){
    return sourceMapWalkableAt(map,x,y,mapset,{flying});
  }
  const checked=assertRo0000_4000RepairCellMatchesSource(map,x,y);
  if(!checked.ok)return false;
  if(Boolean(flying)){
    return sourceMapWalkableAt(map,x,y,mapset,{flying:true});
  }
  return true;
}

export function ro0000RepairRuntimeStatus(){
  return {
    format:RO0000_4000_REPAIR_OVERLAY_FORMAT,
    floorId:4000,
    cells:(overlay?.cells??[]).map(({floorId,x,y,sourceTile,sourceObject,repairWalkable})=>({floorId,x,y,sourceTile,sourceObject,repairWalkable})),
    policy:overlay?.policy??{}
  };
}
