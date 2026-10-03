import { normalizeRouteSelection } from './stoneage_browser_idle_runtime.mjs';
import { parseWindowHealerArgument } from './stoneage_browser_window_healer_runtime.mjs';
import { sourceMapWalkableAt } from './stoneage_map_runtime.mjs';

const BROWSER_IDLE_SUPPLY_ROUTE_RUNTIME_FORMAT='stoneage-v477-browser-idle-supply-route-runtime-v1';

const clone=value=>JSON.parse(JSON.stringify(value));
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const int=value=>Number.isInteger(Number(value))?Number(value):null;

function validateDependencies({
  routeCatalog=null,
  supplyWarpCatalog=null,
  recoveryServiceCatalog=null,
  loadMap=null,
  loadMapset=null
}={}){
  const errors=[];
  if(!isObject(routeCatalog)||routeCatalog.format!=='stoneage-first-idle-route-catalog-v1')errors.push('routeCatalog');
  if(!isObject(supplyWarpCatalog)||supplyWarpCatalog.format!=='stoneage-idle-supply-warp-catalog-v1')errors.push('supplyWarpCatalog');
  if(!isObject(recoveryServiceCatalog)||recoveryServiceCatalog.format!=='stoneage-recovery-service-source-catalog-v1')errors.push('recoveryServiceCatalog');
  if(typeof loadMap!=='function')errors.push('loadMap');
  if(typeof loadMapset!=='function')errors.push('loadMapset');
  return {ok:errors.length===0,errors};
}

function sourceWarpCatalogGroups(catalog){
  return Array.isArray(catalog?.groups)?catalog.groups:[];
}

function groupForRoute(catalog,routeVariant){
  const wanted=String(routeVariant?.portalId??'').trim();
  if(!wanted)return null;
  return sourceWarpCatalogGroups(catalog).find(g=>g.kind==='encounter-return'&&String(g.sourceDerivedFrom??'').trim()===wanted)??null;
}

function hospitalGroupForTown(catalog,hometown){
  const n=Number(hometown);
  return sourceWarpCatalogGroups(catalog).find(g=>g.kind==='town-to-hospital'&&Number(g.hometown)===n)??null;
}

function rowsToTargets(group,direction='from'){
  return (group?.rows??[]).map(row=>Array.isArray(row?.[direction])?{x:int(row[direction][0]),y:int(row[direction][1]),line:int(row.line)}:null)
    .filter(x=>x?.x!=null&&x?.y!=null);
}

function manhattan(a,b){
  return Math.abs(Number(a.x)-Number(b.x))+Math.abs(Number(a.y)-Number(b.y));
}

async function findPathToTargets(map,mapset,start,targets,{allowStartTarget=true}={}){
  const width=Number(map?.width),height=Number(map?.height);
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)return {ok:false,reason:'map-dimension-invalid'};
  const sx=int(start?.x),sy=int(start?.y);
  if(sx==null||sy==null||sx<0||sy<0||sx>=width||sy>=height)return {ok:false,reason:'path-start-invalid',start};
  const unique=[];
  const targetKeys=new Set();
  for(const target of targets){
    const x=int(target?.x),y=int(target?.y);
    if(x==null||y==null||x<0||y<0||x>=width||y>=height)continue;
    const key=y*width+x;
    if(targetKeys.has(key))continue;
    targetKeys.add(key);
    unique.push({x,y,line:target.line??null});
  }
  if(!unique.length)return {ok:false,reason:'path-targets-empty'};
  const walkableTargetByIndex=new Map();
  for(const target of unique){
    if(sourceMapWalkableAt(map,target.x,target.y,mapset)){
      walkableTargetByIndex.set(target.y*width+target.x,target);
    }
  }
  if(!walkableTargetByIndex.size)return {ok:false,reason:'no-walkable-target'};
  const startIndex=sy*width+sx;
  if(walkableTargetByIndex.has(startIndex)&&allowStartTarget){
    return {ok:true,distance:0,path:[],target:clone(walkableTargetByIndex.get(startIndex)),visited:1};
  }
  if(!sourceMapWalkableAt(map,sx,sy,mapset))return {ok:false,reason:'path-start-not-walkable',start};
  const total=width*height;
  const previous=new Int32Array(total);
  previous.fill(-2);
  const queue=new Int32Array(total);
  let head=0,tail=0,visited=0;
  previous[startIndex]=-1;
  queue[tail++]=startIndex;
  let found=-1;
  while(head<tail){
    const current=queue[head++];
    visited++;
    const x=current%width,y=Math.floor(current/width);
    const neighbors=[
      [x-1,y],[x+1,y],[x,y-1],[x,y+1]
    ];
    for(const [nx,ny] of neighbors){
      if(nx<0||ny<0||nx>=width||ny>=height)continue;
      const ni=ny*width+nx;
      if(previous[ni]!==-2)continue;
      if(!sourceMapWalkableAt(map,nx,ny,mapset))continue;
      previous[ni]=current;
      if(walkableTargetByIndex.has(ni)){found=ni;head=tail;break;}
      queue[tail++]=ni;
    }
  }
  if(found<0)return {ok:false,reason:'path-not-found',start,targets:unique,visited};
  const indices=[];
  for(let at=found;at!==startIndex;at=previous[at]){
    if(at<0)break;
    indices.push(at);
  }
  indices.reverse();
  const path=indices.map(index=>({x:index%width,y:Math.floor(index/width)}));
  return {
    ok:true,
    distance:path.length,
    path,
    target:clone(walkableTargetByIndex.get(found)),
    visited
  };
}

function hospitalInteractionTargets(nursePoint,range,map,mapset){
  const targets=[];
  const radius=Math.max(1,Number(range));
  for(let dy=-radius;dy<=radius;dy++){
    for(let dx=-radius;dx<=radius;dx++){
      const x=Number(nursePoint.x)+dx,y=Number(nursePoint.y)+dy;
      if(Math.abs(dx)+Math.abs(dy)>radius)continue;
      if(!sourceMapWalkableAt(map,x,y,mapset))continue;
      if(x===Number(nursePoint.x)&&y===Number(nursePoint.y))continue;
      targets.push({x,y});
    }
  }
  return targets;
}

async function planIdleSupplyRoute(state,{
  routeCatalog=null,
  supplyWarpCatalog=null,
  recoveryServiceCatalog=null,
  loadMap=null,
  loadMapset=null,
  routeId=null,
  playerPosition=null
}={}){
  const deps=validateDependencies({routeCatalog,supplyWarpCatalog,recoveryServiceCatalog,loadMap,loadMapset});
  if(!deps.ok)return {ok:false,handled:false,stage:'idle-supply-route-dependency',reason:'dependency-validation-failed',dependencies:deps.errors,state:clone(state)};
  const boundRouteId=routeId??state?.idle?.routeId??null;
  const selection=normalizeRouteSelection(routeCatalog,{routeId:boundRouteId});
  if(!selection.ok)return {ok:false,handled:false,stage:'idle-supply-route-selection',reason:selection.reason,routeId:boundRouteId,state:clone(state)};
  const route=selection.route,variant=selection.variant;
  const current=playerPosition??state?.world?.position??null;
  const currentFloor=int(current?.floorId??current?.floor);
  const encounterFloor=int(route?.encounterFloor),entryFloor=int(route?.entryFloor);
  if(currentFloor==null||encounterFloor==null||entryFloor==null)return {ok:false,handled:false,stage:'idle-supply-route-state',reason:'route-floor-binding-invalid',state:clone(state)};
  if(currentFloor!==encounterFloor)return {ok:false,handled:false,stage:'idle-supply-route-state',reason:'player-not-on-route-encounter-floor',currentFloor,encounterFloor,state:clone(state)};
  const returnGroup=groupForRoute(supplyWarpCatalog,variant);
  if(!returnGroup)return {ok:false,handled:false,stage:'idle-supply-route-portal',reason:'encounter-return-portal-not-found',portalId:variant.portalId,state:clone(state)};
  const hospitalGroup=hospitalGroupForTown(supplyWarpCatalog,route.hometown);
  if(!hospitalGroup)return {ok:false,handled:false,stage:'idle-supply-route-portal',reason:'town-hospital-portal-not-found',hometown:route.hometown,state:clone(state)};
  const hospitalFloor=int(hospitalGroup.toFloor);
  if(hospitalFloor==null)return {ok:false,handled:false,stage:'idle-supply-route-portal',reason:'hospital-floor-invalid',state:clone(state)};

  const nurseCandidates=(recoveryServiceCatalog.instances??[])
    .filter(row=>row?.service==='windowhealer'&&Number(row.floorId)===hospitalFloor&&row.exactPoint);
  if(nurseCandidates.length!==1){
    return {ok:false,handled:false,stage:'idle-supply-route-healer',reason:'hospital-window-healer-instance-not-unique',hospitalFloor,candidateCount:nurseCandidates.length,state:clone(state)};
  }
  const nurse=nurseCandidates[0];
  const profile=parseWindowHealerArgument(nurse.enemyRaw);
  if(!profile.ok)return {ok:false,handled:false,stage:'idle-supply-route-healer',reason:profile.reason,hospitalFloor,nurse:clone(nurse),state:clone(state)};

  let encounterMap,townMap,hospitalMap,mapset;
  try{
    encounterMap=await loadMap(encounterFloor);
    townMap=await loadMap(entryFloor);
    hospitalMap=await loadMap(hospitalFloor);
    mapset=await loadMapset();
  }catch(error){
    return {ok:false,handled:false,stage:'idle-supply-route-map-load',reason:'map-load-failed',error:String(error?.message??error),state:clone(state)};
  }
  if(!encounterMap||Number(encounterMap.floorId)!==encounterFloor)return {ok:false,handled:false,stage:'idle-supply-route-map-load',reason:'encounter-map-unresolved',floorId:encounterFloor,state:clone(state)};
  if(!townMap||Number(townMap.floorId)!==entryFloor)return {ok:false,handled:false,stage:'idle-supply-route-map-load',reason:'town-map-unresolved',floorId:entryFloor,state:clone(state)};
  if(!hospitalMap||Number(hospitalMap.floorId)!==hospitalFloor)return {ok:false,handled:false,stage:'idle-supply-route-map-load',reason:'hospital-map-unresolved',floorId:hospitalFloor,state:clone(state)};

  const reverseTargets=rowsToTargets(returnGroup,'from');
  const returnPath=await findPathToTargets(encounterMap,mapset,current,reverseTargets);
  if(!returnPath.ok)return {ok:false,handled:false,stage:'idle-supply-route-return-to-town',reason:returnPath.reason,detail:returnPath,state:clone(state)};
  const returnRow=returnGroup.rows.find(row=>Number(row.line)===Number(returnPath.target?.line))??returnGroup.rows.find(row=>Number(row.from?.[0])===returnPath.target.x&&Number(row.from?.[1])===returnPath.target.y);
  if(!returnRow)return {ok:false,handled:false,stage:'idle-supply-route-return-to-town',reason:'return-portal-row-not-found',state:clone(state)};
  const townArrival={floorId:entryFloor,x:int(returnRow.to?.[0]),y:int(returnRow.to?.[1])};
  if(townArrival.x==null||townArrival.y==null)return {ok:false,handled:false,stage:'idle-supply-route-return-to-town',reason:'return-portal-destination-invalid',state:clone(state)};

  const hospitalPortalTargets=rowsToTargets(hospitalGroup,'from');
  const townPath=await findPathToTargets(townMap,mapset,{x:townArrival.x,y:townArrival.y},hospitalPortalTargets);
  if(!townPath.ok)return {ok:false,handled:false,stage:'idle-supply-route-town-to-hospital',reason:townPath.reason,detail:townPath,state:clone(state)};
  const hospitalRow=hospitalGroup.rows.find(row=>Number(row.line)===Number(townPath.target?.line))??hospitalGroup.rows.find(row=>Number(row.from?.[0])===townPath.target.x&&Number(row.from?.[1])===townPath.target.y);
  if(!hospitalRow)return {ok:false,handled:false,stage:'idle-supply-route-town-to-hospital',reason:'hospital-portal-row-not-found',state:clone(state)};
  const hospitalArrival={floorId:hospitalFloor,x:int(hospitalRow.to?.[0]),y:int(hospitalRow.to?.[1])};
  if(hospitalArrival.x==null||hospitalArrival.y==null)return {ok:false,handled:false,stage:'idle-supply-route-town-to-hospital',reason:'hospital-destination-invalid',state:clone(state)};

  const healerTargets=hospitalInteractionTargets(nurse.exactPoint,profile.range,hospitalMap,mapset);
  const healerPath=await findPathToTargets(hospitalMap,mapset,{x:hospitalArrival.x,y:hospitalArrival.y},healerTargets);
  if(!healerPath.ok)return {ok:false,handled:false,stage:'idle-supply-route-hospital-to-healer',reason:healerPath.reason,detail:healerPath,state:clone(state)};

  return {
    ok:true,
    handled:true,
    stage:'idle-supply-route-planned',
    format:BROWSER_IDLE_SUPPLY_ROUTE_RUNTIME_FORMAT,
    routeId:selection.routeId,
    hometown:Number(route.hometown),
    portalId:String(variant.portalId),
    encounterFloor,
    entryFloor,
    hospitalFloor,
    nurse:{
      floorId:hospitalFloor,
      x:Number(nurse.exactPoint.x),
      y:Number(nurse.exactPoint.y),
      name:nurse.sourcePath??null,
      profile
    },
    segments:{
      encounterToTown:{
        portalId:String(returnGroup.id),
        sourceDerivedFrom:String(returnGroup.sourceDerivedFrom),
        from:{floorId:encounterFloor,x:int(current?.x),y:int(current?.y)},
        moveDistance:returnPath.distance,
        movePath:returnPath.path,
        portalOrigin:{floorId:encounterFloor,x:returnPath.target.x,y:returnPath.target.y},
        portalDestination:townArrival,
        sourceLine:Number(returnPath.target.line)
      },
      townToHospital:{
        portalId:String(hospitalGroup.id),
        from:{floorId:entryFloor,x:townArrival.x,y:townArrival.y},
        moveDistance:townPath.distance,
        movePath:townPath.path,
        portalOrigin:{floorId:entryFloor,x:townPath.target.x,y:townPath.target.y},
        portalDestination:hospitalArrival,
        sourceLine:Number(townPath.target.line)
      },
      hospitalToHealer:{
        from:hospitalArrival,
        moveDistance:healerPath.distance,
        movePath:healerPath.path,
        interactionPosition:{floorId:hospitalFloor,x:healerPath.target.x,y:healerPath.target.y},
        healerPoint:{floorId:hospitalFloor,x:Number(nurse.exactPoint.x),y:Number(nurse.exactPoint.y)},
        healerRange:Number(profile.range)
      }
    },
    source:{
      fixedSource:clone(supplyWarpCatalog.fixedSource),
      routeCatalog:routeCatalog.format,
      recoveryServiceCatalog:recoveryServiceCatalog.format
    },
    persistentMutation:false,
    rngGeneratedInternally:false
  };
}

function createBrowserIdleSupplyRouteRuntime(deps={}){
  const validation=validateDependencies(deps);
  return {
    ok:validation.ok,
    format:BROWSER_IDLE_SUPPLY_ROUTE_RUNTIME_FORMAT,
    errors:validation.errors,
    plan:(state,options={})=>planIdleSupplyRoute(state,{...deps,...options})
  };
}

export {
  BROWSER_IDLE_SUPPLY_ROUTE_RUNTIME_FORMAT,
  validateDependencies,
  findPathToTargets,
  planIdleSupplyRoute,
  createBrowserIdleSupplyRouteRuntime
};
