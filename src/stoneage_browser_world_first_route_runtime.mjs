import {
  loadSourceMapRuntime,
  loadSourceMapsetRuntime,
  sourceMapTileAt,
  sourceMapWalkableAt
} from './stoneage_map_runtime.mjs';
import { ro0000SourceMapWalkableAt } from './stoneage_ro0000_4000_repair.mjs';
import { ACTION_WORLD_MOVE_STEP } from './stoneage_browser_world_movement_runtime.mjs';
import { ACTION_WORLD_WARPPOINT_EXECUTE } from './stoneage_browser_world_warppoint_runtime.mjs';

const BROWSER_WORLD_ROUTE_RUNTIME_FORMAT='stoneage-browser-world-first-route-runtime-v1';
const ROUTE_CATALOG_FORMAT='stoneage-first-idle-route-catalog-v1';
const WARPPOINT_CATALOG_FORMAT='stoneage-start-destination-warp-coordinates-v2';
const ENCOUNTER_TARGET_INDEX_FORMAT='stoneage-start-encounter-target-index-v1';
const ACTION_WORLD_FIRST_ROUTE_PLAN='WORLD_FIRST_ROUTE_PLAN';
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const WARPPOINT_SOURCE_PATH='gmsv/data/map/mapwarp.txt';
const WARPPOINT_SOURCE_BLOB_SHA='617d2d02cbf17561d0eafc379a015d949055e922';

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>JSON.parse(JSON.stringify(value));
const intOr=(value,fallback=null)=>Number.isFinite(Number(value))?Math.trunc(Number(value)):fallback;

function normalizeCell(value){
  if(Array.isArray(value)&&value.length>=3){
    const floorId=intOr(value[0]),x=intOr(value[1]),y=intOr(value[2]);
    return floorId!=null&&floorId>=0&&x!=null&&x>=0&&y!=null&&y>=0?{floorId,x,y}:null;
  }
  if(isObject(value)){
    const floorId=intOr(value.floorId??value.floor),x=intOr(value.x),y=intOr(value.y);
    return floorId!=null&&floorId>=0&&x!=null&&x>=0&&y!=null&&y>=0?{floorId,x,y}:null;
  }
  return null;
}

function sameCell(a,b){
  const aa=normalizeCell(a),bb=normalizeCell(b);
  return !!aa&&!!bb&&aa.floorId===bb.floorId&&aa.x===bb.x&&aa.y===bb.y;
}

function validateDependencies({routeCatalog=null,warpCatalog=null,encounterTargetIndex=null}={}){
  const errors=[];
  if(!isObject(routeCatalog)||routeCatalog.format!==ROUTE_CATALOG_FORMAT)errors.push('first route catalog invalid');
  if(!isObject(warpCatalog)||warpCatalog.format!==WARPPOINT_CATALOG_FORMAT)errors.push('warppoint catalog invalid');
  if(!isObject(encounterTargetIndex)||encounterTargetIndex.format!==ENCOUNTER_TARGET_INDEX_FORMAT)errors.push('encounter target index invalid');
  for(const [name,value] of [['routeCatalog',routeCatalog],['encounterTargetIndex',encounterTargetIndex]]){
    if(value?.fixedSource?.repository!==SOURCE_REPOSITORY)errors.push(name+' fixed source repository mismatch');
    if(value?.fixedSource?.ref!==SOURCE_REF)errors.push(name+' fixed source ref mismatch');
  }
  if(warpCatalog?.fixedSource?.repository!==SOURCE_REPOSITORY)errors.push('warppoint fixed source repository mismatch');
  if(warpCatalog?.fixedSource?.ref!==SOURCE_REF)errors.push('warppoint fixed source ref mismatch');
  if(warpCatalog?.fixedSource?.path!==WARPPOINT_SOURCE_PATH)errors.push('warppoint source path mismatch');
  if(warpCatalog?.fixedSource?.blobSha!==WARPPOINT_SOURCE_BLOB_SHA)errors.push('warppoint source blob sha mismatch');
  return {ok:errors.length===0,errors};
}

function routeIdForVariant(route,variant){
  return `hometown-${route?.hometown}/floor-${route?.entryFloor}-to-${route?.encounterFloor}/${variant?.portalId??'unknown'}`;
}

function findRoute(routeCatalog,{routeId=null,hometown=null,portalId=null}={}){
  const routes=Array.isArray(routeCatalog?.routes)?routeCatalog.routes:[];
  if(routeId!=null){
    const id=String(routeId).trim();
    for(const route of routes)for(const variant of Array.isArray(route.variants)?route.variants:[]){
      if(routeIdForVariant(route,variant)===id)return {route,variant,routeId:id};
    }
    return null;
  }
  const town=Number.isFinite(Number(hometown))?Math.trunc(Number(hometown)):null;
  const route=routes.find(item=>town!=null&&Number(item.hometown)===town);
  if(!route)return null;
  const variant=(route.variants??[]).find(item=>portalId==null||String(item.portalId)===String(portalId));
  return variant?{route,variant,routeId:routeIdForVariant(route,variant)}:null;
}

function getPortalGroups(warpCatalog){
  if(Array.isArray(warpCatalog?.nextFloorPortals))return warpCatalog.nextFloorPortals;
  return [
    ...(warpCatalog?.nextFloorPortals?.to100??[]),
    ...(warpCatalog?.nextFloorPortals?.to200??[])
  ];
}

function findPortalGroup(warpCatalog,portalId){
  return getPortalGroups(warpCatalog).find(group=>String(group.id)===String(portalId))??null;
}

function directLandingSet(warpCatalog,hometown,entryFloor){
  const row=(warpCatalog?.directHometownDestinations??[]).find(item=>Number(item.hometown)===Number(hometown)&&Number(item.destinationFloor)===Number(entryFloor));
  return Array.isArray(row?.landings)
    ? row.landings.map(point=>normalizeCell([entryFloor,point?.x,point?.y])).filter(Boolean)
    : [];
}

function portalRows(group){
  return (group?.rows??[]).map(row=>({
    line:Number(row.line),
    from:normalizeCell([group.fromFloor,row.from?.[0],row.from?.[1]]),
    to:normalizeCell([group.toFloor,row.to?.[0],row.to?.[1]])
  })).filter(row=>row.from&&row.to&&Number.isInteger(row.line)&&row.line>0);
}

function normalizeEncounterRect(rect){
  if(!Array.isArray(rect)||rect.length<4)return null;
  const [x1,y1,x2,y2]=rect.map(v=>Math.trunc(Number(v)));
  if(![x1,y1,x2,y2].every(Number.isFinite))return null;
  return {minX:Math.min(x1,x2),maxX:Math.max(x1,x2),minY:Math.min(y1,y2),maxY:Math.max(y1,y2)};
}

function rectContains(rect,x,y){
  const r=normalizeEncounterRect(rect);
  const xx=Math.trunc(Number(x)),yy=Math.trunc(Number(y));
  return !!r&&Number.isFinite(xx)&&Number.isFinite(yy)
    &&r.minX<=xx&&xx<=r.maxX&&r.minY<=yy&&yy<=r.maxY;
}

function getUnconditionalTarget(index,floorId,encounterId){
  const rows=index?.floors?.[String(floorId)]?.unconditionalRows;
  if(!Array.isArray(rows))return null;
  if(encounterId!=null){
    const exact=rows.find(row=>Number(row.encounterId)===Number(encounterId));
    if(exact)return clone(exact);
  }
  return rows[0]?clone(rows[0]):null;
}

function goalIndicesForRect(map,rect){
  const goals=[];
  if(!map)return goals;
  const r=normalizeEncounterRect(rect);
  if(!r)return goals;
  const minX=Math.max(0,r.minX),maxX=Math.min(Number(map.width)-1,r.maxX);
  const minY=Math.max(0,r.minY),maxY=Math.min(Number(map.height)-1,r.maxY);
  if(minX>maxX||minY>maxY)return goals;
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
    const index=y*Number(map.width)+x;
    goals.push(index);
  }
  return goals;
}

function bfsFromStart(map,mapset,start,goalIndexes,{maxVisited=null}={}){
  const width=Number(map.width),height=Number(map.height),size=width*height;
  const startIndex=start.y*width+start.x;
  const goals=new Set(goalIndexes);
  const parent=new Int32Array(size); parent.fill(-1);
  const dist=new Int32Array(size); dist.fill(-1);
  const queue=new Int32Array(size);
  let head=0,tail=0,visited=0;
  queue[tail++]=startIndex; dist[startIndex]=0; visited=1;
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  let reached=-1;
  while(head<tail){
    const index=queue[head++];
    if(goals.has(index)){reached=index;break;}
    const x=index%width,y=Math.floor(index/width);
    for(const [dx,dy] of dirs){
      const nx=x+dx,ny=y+dy;
      if(nx<0||ny<0||nx>=width||ny>=height)continue;
      const next=ny*width+nx;
      if(dist[next]!==-1)continue;
      if(!mapWalkableAtForRo0000(map,nx,ny,mapset,{flying:false}))continue;
      dist[next]=dist[index]+1;
      parent[next]=index;
      queue[tail++]=next;
      visited++;
      if(maxVisited!=null&&visited>maxVisited)return {ok:false,reason:'route-bfs-visit-limit'};
    }
  }
  if(reached<0)return {ok:false,reason:'route-path-not-found',visited};
  const path=[];
  for(let cur=reached;cur!==startIndex;cur=parent[cur])path.push({x:cur%width,y:Math.floor(cur/width)});
  path.reverse();
  return {ok:true,distance:path.length,path,visited,targetIndex:reached};
}

function bfsToRect(map,mapset,rect,{maxVisited=null}={}){
  const width=Number(map.width),height=Number(map.height),size=width*height;
  const parent=new Int32Array(size); parent.fill(-1);
  const seed=new Int32Array(size); seed.fill(-1);
  const dist=new Int32Array(size); dist.fill(-1);
  const queue=new Int32Array(size);
  const goals=goalIndicesForRect(map,rect).filter(index=>{
    const x=index%width,y=Math.floor(index/width);
    return mapWalkableAtForRo0000(map,x,y,mapset,{flying:false});
  });
  let head=0,tail=0,visited=0;
  for(const index of goals){
    if(dist[index]!==-1)continue;
    dist[index]=0; seed[index]=index; queue[tail++]=index; visited++;
  }
  if(!tail)return {ok:false,reason:'encounter-rectangle-has-no-walkable-tile'};
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  while(head<tail){
    const index=queue[head++];
    const x=index%width,y=Math.floor(index/width);
    for(const [dx,dy] of dirs){
      const nx=x+dx,ny=y+dy;
      if(nx<0||ny<0||nx>=width||ny>=height)continue;
      const next=ny*width+nx;
      if(dist[next]!==-1)continue;
      if(!mapWalkableAtForRo0000(map,nx,ny,mapset,{flying:false}))continue;
      dist[next]=dist[index]+1;
      parent[next]=index;
      seed[next]=seed[index];
      queue[tail++]=next;
      visited++;
      if(maxVisited!=null&&visited>maxVisited)return {ok:false,reason:'route-bfs-visit-limit'};
    }
  }
  return {ok:true,parent,seed,dist,visited,width,height};
}

function reconstructToSeed(bfs,startCell){
  const width=bfs.width;
  const startIndex=startCell.y*width+startCell.x;
  if(bfs.dist[startIndex]===-1)return null;
  const seedIndex=bfs.seed[startIndex];
  if(seedIndex<0)return null;
  const path=[];
  for(let cur=startIndex;cur!==seedIndex;){
    const next=bfs.parent[cur];
    if(next<0)return null;
    cur=next;
    path.push({x:cur%width,y:Math.floor(cur/width)});
  }
  return {
    distance:Number(bfs.dist[startIndex]),
    path,
    target:{x:seedIndex%width,y:Math.floor(seedIndex/width)}
  };
}

function bfsAllFromStart(map,mapset,start,{maxVisited=null}={}){
  const width=Number(map.width),height=Number(map.height),size=width*height;
  const startIndex=start.y*width+start.x;
  const parent=new Int32Array(size); parent.fill(-1);
  const dist=new Int32Array(size); dist.fill(-1);
  const queue=new Int32Array(size);
  let head=0,tail=0,visited=0;
  queue[tail++]=startIndex; dist[startIndex]=0; visited=1;
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  while(head<tail){
    const index=queue[head++];
    const x=index%width,y=Math.floor(index/width);
    for(const [dx,dy] of dirs){
      const nx=x+dx,ny=y+dy;
      if(nx<0||ny<0||nx>=width||ny>=height)continue;
      const next=ny*width+nx;
      if(dist[next]!==-1)continue;
      if(!mapWalkableAtForRo0000(map,nx,ny,mapset,{flying:false}))continue;
      dist[next]=dist[index]+1;
      parent[next]=index;
      queue[tail++]=next;
      visited++;
      if(maxVisited!=null&&visited>maxVisited)return {ok:false,reason:'route-bfs-visit-limit'};
    }
  }
  return {ok:true,parent,dist,visited,width,height,startIndex};
}

function choosePortalAndEncounterPaths(start,mapEntry,mapEncounter,mapset,group,encounterTarget,{maxVisited=null}={}){
  const rows=portalRows(group);
  if(!rows.length)return {ok:false,stage:'to-portal',reason:'portal-group-has-no-valid-rows'};
  const entryBfs=bfsAllFromStart(mapEntry,mapset,start,{maxVisited});
  if(!entryBfs.ok)return {ok:false,stage:'to-portal',reason:entryBfs.reason};
  const landingBfs=bfsToRect(mapEncounter,mapset,encounterTarget.rect,{maxVisited});
  if(!landingBfs.ok)return {ok:false,stage:'to-encounter',reason:landingBfs.reason};
  const width=Number(mapEntry.width);
  const candidates=rows.map(row=>{
    const sourceIndex=row.from.y*width+row.from.x;
    const startDistance=entryBfs.dist[sourceIndex];
    const destPath=reconstructToSeed(landingBfs,row.to);
    return {
      row,
      startDistance,
      destinationDistance:destPath?.distance??-1,
      destinationPath:destPath?.path??null,
      encounterCell:destPath?.target??null,
      totalDistance:(startDistance>=0&&destPath)?startDistance+destPath.distance:-1
    };
  }).filter(c=>c.startDistance>=0&&c.destinationDistance>=0&&Array.isArray(c.destinationPath));
  if(!candidates.length)return {ok:false,stage:'route-pair',reason:'portal-destination-pair-not-reachable'};
  candidates.sort((a,b)=>a.totalDistance-b.totalDistance||a.row.line-b.row.line);
  const chosen=candidates[0];
  const chosenPortalPath=[];
  const startIndex=entryBfs.startIndex;
  const chosenSourceIndex=chosen.row.from.y*width+chosen.row.from.x;
  for(let cur=chosenSourceIndex;cur!==startIndex;cur=entryBfs.parent[cur]){
    if(cur<0) return {ok:false,stage:'to-portal',reason:'portal-path-parent-broken'};
    chosenPortalPath.push({x:cur%width,y:Math.floor(cur/width)});
  }
  chosenPortalPath.reverse();
  return {ok:true,portalRow:chosen.row,portalPath:chosenPortalPath,portalDistance:chosen.startDistance,landingPath:chosen.destinationPath,landingDistance:chosen.destinationDistance,encounterCell:chosen.encounterCell,totalDistance:chosen.totalDistance};
}

function actionPathFromStart(path,floorId,currentStart,revision){
  const actions=[];
  let previous=clone(currentStart);
  for(const cell of path){
    const current={floorId:Number(floorId),x:Number(cell.x),y:Number(cell.y)};
    const dx=current.x-previous.x,dy=current.y-previous.y;
    if(Math.abs(dx)+Math.abs(dy)!==1)throw new Error('planned route step is not 4-neighbor');
    actions.push({type:ACTION_WORLD_MOVE_STEP,dx,dy,player:clone(previous),expectedRevision:revision+actions.length});
    previous=current;
  }
  return actions;
}

function planFirstRoute(state,{routeId=null,hometown=null,portalId=null,routeCatalog,warpCatalog,encounterTargetIndex,loadMap=loadSourceMapRuntime,loadMapset=loadSourceMapsetRuntime,maxVisited=null}={}){
  const deps=validateDependencies({routeCatalog,warpCatalog,encounterTargetIndex});
  if(!deps.ok)return {ok:false,reason:'dependency-validation-failed',errors:deps.errors};
  const selection=findRoute(routeCatalog,{routeId,hometown,portalId});
  if(!selection)return {ok:false,reason:'first-route-not-found'};
  const variant=selection.variant;
  const route=selection.route;
  if(route.status==='source_blocked_before_portal'||Number(variant.usableLandingCount)<=0)return {ok:false,reason:'first-route-not-eligible',routeId:selection.routeId};
  const statePosition=normalizeCell(state?.world?.position);
  if(!statePosition)return {ok:false,reason:'route-state-position-required'};
  if(statePosition.floorId!==Number(route.entryFloor))return {ok:false,reason:'route-entry-floor-mismatch',expectedFloor:Number(route.entryFloor),actualFloor:statePosition.floorId};
  const directLandings=directLandingSet(warpCatalog,route.hometown,route.entryFloor);
  if(!directLandings.some(point=>sameCell(point,statePosition)))return {ok:false,reason:'route-start-is-not-direct-hometown-landing',position:statePosition};
  const group=findPortalGroup(warpCatalog,variant.portalId);
  if(!group)return {ok:false,reason:'route-portal-group-missing',portalId:variant.portalId};
  const target=getUnconditionalTarget(encounterTargetIndex,route.encounterFloor,variant.encounterId);
  if(!target)return {ok:false,reason:'route-unconditional-encounter-target-missing',floorId:route.encounterFloor,encounterId:variant.encounterId};
  return Promise.all([loadMap(route.entryFloor),loadMap(route.encounterFloor),loadMapset()]).then(([entryMap,encounterMap,mapset])=>{
    if(!entryMap||Number(entryMap.floorId)!==Number(route.entryFloor))return {ok:false,reason:'route-entry-map-unresolved',floorId:route.entryFloor};
    if(!encounterMap||Number(encounterMap.floorId)!==Number(route.encounterFloor))return {ok:false,reason:'route-encounter-map-unresolved',floorId:route.encounterFloor};
    const startTile=sourceMapTileAt(entryMap,statePosition.x,statePosition.y);
    if(!startTile)return {ok:false,reason:'route-start-coordinate-invalid',position:statePosition};
    const checked=choosePortalAndEncounterPaths(statePosition,entryMap,encounterMap,mapset,group,target,{maxVisited});
    if(!checked.ok)return checked;
    if(Number.isFinite(Number(variant.originPathMin))&&checked.portalDistance<Number(variant.originPathMin))return {ok:false,stage:'route-catalog-crosscheck',reason:'portal-path-below-catalog-minimum',expectedMinimum:Number(variant.originPathMin),actual:checked.portalDistance,portalId:variant.portalId};
    if(Number.isFinite(Number(variant.landingPathMin))&&checked.landingDistance<Number(variant.landingPathMin))return {ok:false,stage:'route-catalog-crosscheck',reason:'landing-path-below-catalog-minimum',expectedMinimum:Number(variant.landingPathMin),actual:checked.landingDistance,portalId:variant.portalId};
    const revision=Number(state?.revision??0);
    if(!Number.isInteger(revision)||revision<0)return {ok:false,reason:'route-state-revision-invalid'};
    const movementToPortal=actionPathFromStart(checked.portalPath,route.entryFloor,statePosition,revision);
    const portalAction={type:ACTION_WORLD_WARPPOINT_EXECUTE,portalId:String(variant.portalId),player:clone(checked.portalRow.from),expectedRevision:revision+movementToPortal.length};
    const movementToEncounter=actionPathFromStart(checked.landingPath,route.encounterFloor,checked.portalRow.to,revision+movementToPortal.length+1);
    const allActions=[...movementToPortal,portalAction,...movementToEncounter.map((action,index)=>({...action,expectedRevision:portalAction.expectedRevision+1+index}))];
    const finalPosition=checked.landingPath.length?checked.landingPath[checked.landingPath.length-1]:checked.portalRow.to;
    const finalCell={floorId:Number(route.encounterFloor),x:Number(finalPosition.x),y:Number(finalPosition.y)};
    return {
      ok:true,
      handled:true,
      stage:'first-route-plan',
      format:BROWSER_WORLD_ROUTE_RUNTIME_FORMAT,
      routeId:selection.routeId,
      hometown:Number(route.hometown),
      name:route.name,
      entryFloor:Number(route.entryFloor),
      encounterFloor:Number(route.encounterFloor),
      portalId:String(variant.portalId),
      sourceLine:checked.portalRow.line,
      portalFrom:clone(checked.portalRow.from),
      portalTo:clone(checked.portalRow.to),
      encounter:{id:Number(target.encounterId),rect:clone(target.rect),probMin:Number(target.probMin),probMax:Number(target.probMax),enemyMax:Number(target.enemyMax),zorder:Number(target.zorder)},
      path:{toPortal:clone(checked.portalPath),toPortalDistance:checked.portalDistance,toEncounter:clone(checked.landingPath),toEncounterDistance:checked.landingDistance,totalWalkSteps:checked.totalDistance},
      encounterBoundary:{insideUnconditional:rectContains(target.rect,finalCell.x,finalCell.y),position:finalCell,encounterId:Number(target.encounterId),rngConsumed:false,battleStarted:false},
      actions:allActions
    };
  });
}

function createBrowserWorldFirstRouteRuntime({
  routeCatalog=null,
  warpCatalog=null,
  encounterTargetIndex=null,
  loadMap=loadSourceMapRuntime,
  loadMapset=loadSourceMapsetRuntime,
  maxVisited=null
}={}){
  const deps=validateDependencies({routeCatalog,warpCatalog,encounterTargetIndex});
  if(!deps.ok)return {ok:false,format:BROWSER_WORLD_ROUTE_RUNTIME_FORMAT,reason:'dependency-validation-failed',errors:deps.errors};
  if(typeof loadMap!=='function'||typeof loadMapset!=='function')return {ok:false,format:BROWSER_WORLD_ROUTE_RUNTIME_FORMAT,reason:'map-loader-required'};
  return {
    ok:true,
    format:BROWSER_WORLD_ROUTE_RUNTIME_FORMAT,
    plan:(state,options={})=>planFirstRoute(state,{...options,routeCatalog,warpCatalog,encounterTargetIndex,loadMap,loadMapset,maxVisited})
  };
}

export {
  BROWSER_WORLD_ROUTE_RUNTIME_FORMAT,
  ROUTE_CATALOG_FORMAT,
  WARPPOINT_CATALOG_FORMAT,
  ENCOUNTER_TARGET_INDEX_FORMAT,
  ACTION_WORLD_FIRST_ROUTE_PLAN,
  SOURCE_REPOSITORY,
  SOURCE_REF,
  normalizeCell,
  sameCell,
  validateDependencies,
  routeIdForVariant,
  findRoute,
  directLandingSet,
  findPortalGroup,
  getUnconditionalTarget,
  normalizeEncounterRect,
  rectContains,
  bfsFromStart,
  bfsAllFromStart,
  bfsToRect,
  reconstructToSeed,
  planFirstRoute,
  createBrowserWorldFirstRouteRuntime
};
