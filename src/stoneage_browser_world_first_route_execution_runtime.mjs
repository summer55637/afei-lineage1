const BROWSER_WORLD_ROUTE_EXECUTION_RUNTIME_FORMAT='stoneage-browser-world-first-route-execution-runtime-v1';
const ACTION_WORLD_FIRST_ROUTE_EXECUTE='WORLD_FIRST_ROUTE_EXECUTE';
const PLAN_FORMAT='stoneage-browser-world-first-route-runtime-v1';
const ACTION_WORLD_MOVE_STEP='WORLD_MOVE_STEP';
const ACTION_WORLD_WARPPOINT_EXECUTE='WORLD_WARPPOINT_EXECUTE';

const clone=value=>JSON.parse(JSON.stringify(value));
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

function validatePlan(plan){
  if(!isObject(plan)||plan.ok!==true)return {ok:false,reason:'first-route-plan-required'};
  if(plan.format!==PLAN_FORMAT)return {ok:false,reason:'first-route-plan-format-mismatch'};
  if(!Array.isArray(plan.actions)||plan.actions.length===0)return {ok:false,reason:'first-route-plan-actions-required'};
  if(!isObject(plan.encounterBoundary)||!isObject(plan.encounterBoundary.position))return {ok:false,reason:'first-route-plan-encounter-boundary-required'};
  return {ok:true};
}

function validateExecutionDependencies({dispatchMove=null,dispatchWarp=null}={}){
  const errors=[];
  if(typeof dispatchMove!=='function')errors.push('world movement dispatcher required');
  if(typeof dispatchWarp!=='function')errors.push('world warppoint dispatcher required');
  return {ok:errors.length===0,errors};
}

async function executeFirstRoutePlan(plan,{dispatchMove=null,dispatchWarp=null,initialRevision=null}={}){
  const planCheck=validatePlan(plan);
  if(!planCheck.ok)return {ok:false,handled:false,stage:'first-route-execute-gate',reason:planCheck.reason};
  const deps=validateExecutionDependencies({dispatchMove,dispatchWarp});
  if(!deps.ok)return {ok:false,handled:false,stage:'first-route-execute-gate',reason:'execution-dispatchers-invalid',errors:deps.errors};
  let lastResult=null;
  const expectedInitialRevision=initialRevision==null?null:Number(initialRevision);
  for(let index=0;index<plan.actions.length;index++){
    const action=clone(plan.actions[index]);
    let result;
    try{
      if(action.type===ACTION_WORLD_MOVE_STEP)result=await dispatchMove(action);
      else if(action.type===ACTION_WORLD_WARPPOINT_EXECUTE)result=await dispatchWarp(action);
      else return {ok:false,handled:false,stage:'first-route-execute',reason:'unsupported-route-action',actionIndex:index,action};
    }catch(error){
      return {ok:false,handled:false,stage:'first-route-execute',reason:'route-action-dispatch-failed',actionIndex:index,action,error:String(error?.message??error),lastResult:clone(lastResult)};
    }
    if(!isObject(result)||result.ok!==true||result.handled!==true){
      return {
        ok:false,
        handled:false,
        stage:'first-route-execute',
        reason:'route-action-failed',
        actionIndex:index,
        action,
        result:clone(result),
        lastResult:clone(lastResult)
      };
    }
    lastResult=clone(result);
  }
  const finalState=clone(lastResult?.state??null);
  const finalPosition=finalState?.world?.position??null;
  const targetPosition=plan.encounterBoundary.position;
  const samePosition=isObject(finalPosition)&&Number(finalPosition.floorId)===Number(targetPosition.floorId)&&Number(finalPosition.x)===Number(targetPosition.x)&&Number(finalPosition.y)===Number(targetPosition.y);
  if(!samePosition){
    return {
      ok:false,
      handled:false,
      stage:'first-route-execute-boundary',
      reason:'final-position-mismatch',
      expectedPosition:clone(targetPosition),
      actualPosition:clone(finalPosition),
      state:finalState
    };
  }
  if(plan.encounterBoundary.insideUnconditional!==true){
    return {ok:false,handled:false,stage:'first-route-execute-boundary',reason:'plan-encounter-boundary-not-closed',state:finalState};
  }
  const finalRevision=Number(finalState?.revision);
  if(!Number.isInteger(finalRevision)||finalRevision<0){
    return {ok:false,handled:false,stage:'first-route-execute-save',reason:'final-revision-invalid',state:finalState};
  }
  return {
    ok:true,
    handled:true,
    stage:'first-route-execute',
    format:BROWSER_WORLD_ROUTE_EXECUTION_RUNTIME_FORMAT,
    routeId:plan.routeId,
    portalId:plan.portalId,
    executedActionCount:plan.actions.length,
    executedMoveCount:plan.actions.filter(action=>action.type===ACTION_WORLD_MOVE_STEP).length,
    executedWarpPointCount:plan.actions.filter(action=>action.type===ACTION_WORLD_WARPPOINT_EXECUTE).length,
    initialRevision:expectedInitialRevision,
    finalRevision,
    finalPosition:clone(finalPosition),
    encounterBoundary:clone(plan.encounterBoundary),
    rngConsumed:false,
    battleStarted:false,
    state:finalState
  };
}

function createBrowserWorldFirstRouteExecutionRuntime(){
  return {
    ok:true,
    format:BROWSER_WORLD_ROUTE_EXECUTION_RUNTIME_FORMAT,
    execute:executeFirstRoutePlan
  };
}

export {
  BROWSER_WORLD_ROUTE_EXECUTION_RUNTIME_FORMAT,
  ACTION_WORLD_FIRST_ROUTE_EXECUTE,
  PLAN_FORMAT,
  ACTION_WORLD_MOVE_STEP,
  ACTION_WORLD_WARPPOINT_EXECUTE,
  validatePlan,
  validateExecutionDependencies,
  executeFirstRoutePlan,
  createBrowserWorldFirstRouteExecutionRuntime
};
