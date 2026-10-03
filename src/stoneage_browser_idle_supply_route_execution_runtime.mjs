import {
  createBrowserWorldWarpPointRuntime,
  ACTION_WORLD_WARPPOINT_EXECUTE
} from './stoneage_browser_world_warppoint_runtime.mjs';

const BROWSER_IDLE_SUPPLY_ROUTE_EXECUTION_RUNTIME_FORMAT='stoneage-v478-browser-idle-supply-route-execution-runtime-v1';
const ACTION_IDLE_SUPPLY_RETURN_EXECUTE='IDLE_SUPPLY_RETURN_EXECUTE';
const PLAN_FORMAT='stoneage-v477-browser-idle-supply-route-runtime-v1';
const ACTION_WORLD_MOVE_STEP='WORLD_MOVE_STEP';

const clone=value=>JSON.parse(JSON.stringify(value));
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

function validatePlan(plan){
  const errors=[];
  if(!isObject(plan)||plan.ok!==true)errors.push('idle supply route plan required');
  if(plan?.format!==PLAN_FORMAT)errors.push('idle supply route plan format mismatch');
  if(!plan?.segments?.encounterToTown)errors.push('encounter-to-town segment missing');
  if(!plan?.segments?.townToHospital)errors.push('town-to-hospital segment missing');
  if(!plan?.segments?.hospitalToHealer)errors.push('hospital-to-healer segment missing');
  for(const name of ['encounterToTown','townToHospital','hospitalToHealer']){
    if(plan?.segments?.[name]&&!Array.isArray(plan.segments[name].movePath))errors.push(name+' movePath missing');
  }
  return {ok:errors.length===0,errors};
}

function validateDependencies({movementRuntime=null,loadMap=null}={}){
  const errors=[];
  if(!movementRuntime||movementRuntime.ok!==true)errors.push('movementRuntime');
  if(typeof loadMap!=='function')errors.push('loadMap');
  return {ok:errors.length===0,errors};
}

function adaptPortalGroupToWarpCatalog(supplyWarpCatalog,group){
  if(!isObject(supplyWarpCatalog)||supplyWarpCatalog.fixedSource==null||!isObject(group)){
    return {ok:false,reason:'supply-warp-group-required'};
  }
  const rows=Array.isArray(group.rows)?group.rows:[];
  if(!rows.length)return {ok:false,reason:'supply-warp-group-rows-required'};
  return {
    ok:true,
    catalog:{
      format:'stoneage-start-destination-warp-coordinates-v2',
      fixedSource:clone(supplyWarpCatalog.fixedSource),
      nextFloorPortals:[{
        id:String(group.id),
        fromFloor:Number(group.fromFloor),
        toFloor:Number(group.toFloor),
        sourceLines:Array.isArray(group.sourceLines)?group.sourceLines.map(Number):[],
        rows:rows.map(row=>({
          line:Number(row.line),
          from:Array.isArray(row.from)?[Number(row.from[0]),Number(row.from[1])]:null,
          to:Array.isArray(row.to)?[Number(row.to[0]),Number(row.to[1])]:null
        }))
      }]
    }
  };
}

function directionBetween(a,b){
  if(!isObject(a)||!isObject(b))return null;
  const dx=Number(b.x)-Number(a.x);
  const dy=Number(b.y)-Number(a.y);
  if(!Number.isInteger(dx)||!Number.isInteger(dy))return null;
  if(Math.abs(dx)+Math.abs(dy)!==1)return null;
  return {dx,dy};
}

async function executeMovePath(state,movePath,{
  movementRuntime,
  segment,
  segmentName,
  transactionPrefix,
  now
}={}){
  let current=clone(state);
  const executed=[];
  for(let index=0;index<movePath.length;index++){
    const target=movePath[index];
    const from=current?.world?.position??null;
    const direction=directionBetween(from,target);
    if(!direction){
      return {
        ok:false,handled:false,stage:'idle-supply-route-execute-movement',
        reason:'non-adjacent-or-invalid-route-step',
        segmentName,index,from:clone(from),target:clone(target),
        state:clone(current),executedSteps:executed
      };
    }
    const result=await movementRuntime.dispatch(current,{
      type:ACTION_WORLD_MOVE_STEP,
      dx:direction.dx,
      dy:direction.dy,
      player:from,
      expectedRevision:current?.revision,
      savedAt:now,
      now
    },{
      expectedRevision:current?.revision,
      savedAt:now,
      source:`${transactionPrefix}:${segmentName}:move:${index}`
    });
    if(!result.ok||result.handled!==true){
      return {
        ...result,
        ok:false,handled:false,
        stage:'idle-supply-route-execute-movement',
        segmentName,index,
        state:clone(result.state??current),
        executedSteps:executed
      };
    }
    current=clone(result.state);
    executed.push({
      index,
      from:clone(result.from??from),
      to:clone(result.to??target),
      revision:Number(current.revision??0)
    });
  }
  return {ok:true,handled:true,state:current,executedSteps:executed,segment};
}

async function executePortal(state,segment,{
  supplyWarpCatalog,
  loadMap,
  transactionPrefix,
  now,
  sourceSegment
}={}){
  const adapter=adaptPortalGroupToWarpCatalog(supplyWarpCatalog,{
    id:segment.portalId,
    fromFloor:Number(segment.from?.floorId),
    toFloor:Number(segment.portalDestination?.floorId),
    sourceLines:[Number(segment.sourceLine)],
    rows:[{
      line:Number(segment.sourceLine),
      from:[Number(segment.portalOrigin?.x),Number(segment.portalOrigin?.y)],
      to:[Number(segment.portalDestination?.x),Number(segment.portalDestination?.y)]
    }]
  });
  if(!adapter.ok)return {ok:false,handled:false,stage:'idle-supply-route-execute-portal',reason:adapter.reason,state:clone(state)};
  const warpRuntime=createBrowserWorldWarpPointRuntime({catalog:adapter.catalog,loadMap});
  if(warpRuntime.ok!==true)return {ok:false,handled:false,stage:'idle-supply-route-execute-portal',reason:'warppoint-runtime-invalid',errors:warpRuntime.errors??[],state:clone(state)};
  const result=await warpRuntime.execute(state,{
    position:state?.world?.position??null,
    portalId:segment.portalId,
    expectedRevision:state?.revision,
    savedAt:now,
    now,
    source:`${transactionPrefix}:${sourceSegment}:warp`
  });
  if(!result.ok||result.handled!==true){
    return {...result,ok:false,handled:false,stage:'idle-supply-route-execute-portal',state:clone(result.state??state)};
  }
  return result;
}

function samePosition(actual,expected){
  return isObject(actual)&&isObject(expected)
    &&Number(actual.floorId)===Number(expected.floorId)
    &&Number(actual.x)===Number(expected.x)
    &&Number(actual.y)===Number(expected.y);
}

async function executeIdleSupplyRoutePlan(state,plan,{
  movementRuntime=null,
  supplyWarpCatalog=null,
  loadMap=null,
  transactionPrefix='v478-idle-supply-return',
  now=()=>new Date().toISOString()
}={}){
  const planCheck=validatePlan(plan);
  if(!planCheck.ok)return {ok:false,handled:false,stage:'idle-supply-route-execute-gate',action:ACTION_IDLE_SUPPLY_RETURN_EXECUTE,reason:'plan-invalid',errors:planCheck.errors,state:clone(state)};
  const deps=validateDependencies({movementRuntime,loadMap});
  if(!deps.ok)return {ok:false,handled:false,stage:'idle-supply-route-execute-gate',action:ACTION_IDLE_SUPPLY_RETURN_EXECUTE,reason:'execution-dependencies-invalid',errors:deps.errors,state:clone(state)};
  if(!isObject(supplyWarpCatalog))return {ok:false,handled:false,stage:'idle-supply-route-execute-gate',action:ACTION_IDLE_SUPPLY_RETURN_EXECUTE,reason:'supply-warp-catalog-required',state:clone(state)};
  if(String(state?.idle?.mode??'')!=='supply_check'){
    return {ok:false,handled:false,stage:'idle-supply-route-execute-state',action:ACTION_IDLE_SUPPLY_RETURN_EXECUTE,reason:'idle-state-supply-check-required',idleMode:state?.idle?.mode??null,state:clone(state)};
  }

  let current=clone(state);
  const segments=[
    ['encounterToTown',plan.segments.encounterToTown,true],
    ['townToHospital',plan.segments.townToHospital,true],
    ['hospitalToHealer',plan.segments.hospitalToHealer,false]
  ];
  const executedSegments=[];

  for(const [segmentName,segment,withPortal] of segments){
    const segmentStart=segment?.from??null;
    if(!samePosition(current?.world?.position,segmentStart)){
      return {
        ok:false,handled:false,stage:'idle-supply-route-execute-boundary',
        action:ACTION_IDLE_SUPPLY_RETURN_EXECUTE,
        reason:'segment-start-position-mismatch',
        segmentName,
        expected:clone(segmentStart),
        actual:clone(current?.world?.position??null),
        state:clone(current),
        executedSegments
      };
    }
    const moved=await executeMovePath(current,segment.movePath??[],{
      movementRuntime,segment,segmentName,transactionPrefix,now
    });
    if(!moved.ok){
      return {...moved,action:ACTION_IDLE_SUPPLY_RETURN_EXECUTE,executedSegments,state:clone(moved.state??current)};
    }
    current=clone(moved.state);
    const expectedPortal=segment.portalOrigin??null;
    if(withPortal){
      if(!samePosition(current?.world?.position,expectedPortal)){
        return {
          ok:false,handled:false,stage:'idle-supply-route-execute-boundary',
          action:ACTION_IDLE_SUPPLY_RETURN_EXECUTE,
          reason:'portal-origin-position-mismatch',
          segmentName,
          expected:clone(expectedPortal),
          actual:clone(current?.world?.position??null),
          state:clone(current),
          executedSegments
        };
      }
      const warped=await executePortal(current,segment,{
        supplyWarpCatalog,
        loadMap,
        transactionPrefix,
        now,
        sourceSegment:segmentName
      });
      if(!warped.ok){
        return {...warped,action:ACTION_IDLE_SUPPLY_RETURN_EXECUTE,segmentName,executedSegments,state:clone(warped.state??current)};
      }
      current=clone(warped.state);
      if(!samePosition(current?.world?.position,segment.portalDestination)){
        return {
          ok:false,handled:false,stage:'idle-supply-route-execute-boundary',
          action:ACTION_IDLE_SUPPLY_RETURN_EXECUTE,
          reason:'portal-destination-position-mismatch',
          segmentName,
          expected:clone(segment.portalDestination),
          actual:clone(current?.world?.position??null),
          state:clone(current),
          executedSegments
        };
      }
    }
    executedSegments.push({
      segmentName,
      moveDistance:Number(segment.moveDistance??segment.movePath?.length??0),
      moveSteps:moved.executedSteps.length,
      portalExecuted:withPortal,
      finalPosition:clone(current.world.position),
      revision:Number(current.revision??0)
    });
  }

  const finalExpected=plan.segments.hospitalToHealer.interactionPosition??null;
  if(!samePosition(current?.world?.position,finalExpected)){
    return {
      ok:false,handled:false,stage:'idle-supply-route-execute-boundary',
      action:ACTION_IDLE_SUPPLY_RETURN_EXECUTE,
      reason:'final-healer-interaction-position-mismatch',
      expected:clone(finalExpected),
      actual:clone(current?.world?.position??null),
      state:clone(current),
      executedSegments
    };
  }
  const healerPoint=plan.segments.hospitalToHealer.healerPoint??null;
  const range=Number(plan.segments.hospitalToHealer.healerRange);
  const distance=Math.abs(Number(finalExpected?.x)-Number(healerPoint?.x))+Math.abs(Number(finalExpected?.y)-Number(healerPoint?.y));
  if(!isObject(healerPoint)||!Number.isFinite(range)||distance>range){
    return {
      ok:false,handled:false,stage:'idle-supply-route-execute-healer-gate',
      action:ACTION_IDLE_SUPPLY_RETURN_EXECUTE,
      reason:'final-healer-interaction-range-invalid',
      distance,range,
      state:clone(current),
      executedSegments
    };
  }

  return {
    ok:true,
    handled:true,
    stage:'idle-supply-route-execute-ready',
    format:BROWSER_IDLE_SUPPLY_ROUTE_EXECUTION_RUNTIME_FORMAT,
    action:ACTION_IDLE_SUPPLY_RETURN_EXECUTE,
    routeId:plan.routeId,
    finalPosition:clone(current.world.position),
    healerPoint:clone(healerPoint),
    healerRange:range,
    interactionDistance:distance,
    executedSegments,
    state:clone(current),
    battleContext:null,
    persistentMutation:true,
    rngGeneratedInternally:false,
    nextBoundary:'IDLE_SUPPLY_USE_HEALER / NPC_WINDOW_HEALER_USE',
    sourcePlan:plan.format
  };
}

function createBrowserIdleSupplyRouteExecutionRuntime(deps={}){
  const validation=validateDependencies(deps);
  return {
    ok:validation.ok,
    format:BROWSER_IDLE_SUPPLY_ROUTE_EXECUTION_RUNTIME_FORMAT,
    errors:validation.errors,
    execute:(state,plan,options={})=>executeIdleSupplyRoutePlan(state,plan,{...deps,...options})
  };
}

export {
  BROWSER_IDLE_SUPPLY_ROUTE_EXECUTION_RUNTIME_FORMAT,
  ACTION_IDLE_SUPPLY_RETURN_EXECUTE,
  PLAN_FORMAT,
  validatePlan,
  validateDependencies,
  adaptPortalGroupToWarpCatalog,
  directionBetween,
  executeMovePath,
  executeIdleSupplyRoutePlan,
  createBrowserIdleSupplyRouteExecutionRuntime
};
