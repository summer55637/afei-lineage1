import { supplyRequired } from './stoneage_idle_policy.mjs';

const BROWSER_IDLE_SUPPLY_AUTO_RETURN_RUNTIME_FORMAT='stoneage-v480-browser-idle-supply-auto-return-runtime-v1';
const ACTION_IDLE_SUPPLY_AUTO_RETURN='IDLE_SUPPLY_AUTO_RETURN';
const clone=value=>JSON.parse(JSON.stringify(value));
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

function validateDependencies({
  plannerRuntime=null,
  executionRuntime=null,
  windowHealerRuntime=null,
  idleRuntime=null
}={}){
  const errors=[];
  if(!plannerRuntime||plannerRuntime.ok!==true)errors.push('plannerRuntime');
  if(!executionRuntime||executionRuntime.ok!==true)errors.push('executionRuntime');
  if(!windowHealerRuntime||windowHealerRuntime.ok!==true)errors.push('windowHealerRuntime');
  if(!idleRuntime||idleRuntime.ok!==true)errors.push('idleRuntime');
  return {ok:errors.length===0,errors};
}

function buildWindowHealerNpc(plan){
  const nurse=plan?.nurse;
  if(!isObject(nurse)||Number.isFinite(Number(nurse.floorId))!==true)return {ok:false,reason:'window-healer-plan-nurse-missing'};
  const profile=nurse.profile;
  if(!isObject(profile)||String(profile.raw??'').trim()==='')return {ok:false,reason:'window-healer-plan-profile-missing'};
  const x=Number(nurse.x),y=Number(nurse.y);
  if(!Number.isInteger(x)||!Number.isInteger(y))return {ok:false,reason:'window-healer-plan-position-invalid'};
  return {
    ok:true,
    npc:{
      floor:Number(nurse.floorId),
      npc:[x,y],
      functionSet:'WindowHealer',
      sourceEnemy:{raw:String(profile.raw)},
      services:[{functionSet:'WindowHealer',sourceStatus:'known'}]
    }
  };
}

async function runIdleSupplyAutoReturn(state,{
  plannerRuntime=null,
  executionRuntime=null,
  windowHealerRuntime=null,
  idleRuntime=null,
  supplyWarpCatalog=null,
  policy=null,
  routePlan=null,
  confirmRoute=true,
  confirmHealer=null,
  player=null,
  transactionPrefix='v480-idle-supply-auto',
  now=()=>new Date().toISOString()
}={}){
  if(!isObject(state))return {ok:false,handled:false,stage:'idle-supply-auto-return',action:ACTION_IDLE_SUPPLY_AUTO_RETURN,reason:'state-required'};
  if(String(state?.idle?.mode??'')!=='supply_check'){
    return {ok:false,handled:false,stage:'idle-supply-auto-return-state',action:ACTION_IDLE_SUPPLY_AUTO_RETURN,reason:'idle-state-supply-check-required',idleMode:state?.idle?.mode??null,state:clone(state)};
  }
  if(!policy||!isObject(policy))return {ok:false,handled:false,stage:'idle-supply-auto-return-policy',action:ACTION_IDLE_SUPPLY_AUTO_RETURN,reason:'explicit-supply-policy-required',state:clone(state)};
  const before=supplyRequired(state,policy);
  if(!before.ok)return {ok:false,handled:false,stage:'idle-supply-auto-return-policy',action:ACTION_IDLE_SUPPLY_AUTO_RETURN,reason:'invalid-supply-policy',errors:before.errors,state:clone(state)};

  if(!before.required){
    const done=await idleRuntime.dispatch(state,{
      type:'IDLE_EVENT',
      event:'supply_done',
      payload:{reason:'already-above-supply-threshold'},
      expectedRevision:state.revision,
      now
    },{now});
    if(!done.ok)return {...done,handled:false,stage:'idle-supply-auto-return-idle',action:ACTION_IDLE_SUPPLY_AUTO_RETURN,state:clone(state)};
    return {
      ok:true,handled:true,stage:'idle-supply-auto-return-complete',
      format:BROWSER_IDLE_SUPPLY_AUTO_RETURN_RUNTIME_FORMAT,
      action:ACTION_IDLE_SUPPLY_AUTO_RETURN,
      mode:'no-healer-needed',
      policyBefore:before,
      routed:false,healed:false,idleEvent:'supply_done',
      state:clone(done.state??state),
      persistentMutation:true,
      rngGeneratedInternally:false
    };
  }

  if(confirmHealer!=null&&typeof confirmHealer!=='boolean'){
    return {ok:false,handled:false,stage:'idle-supply-auto-return-confirm',action:ACTION_IDLE_SUPPLY_AUTO_RETURN,reason:'confirmHealer-must-be-boolean',state:clone(state),policyBefore:before};
  }

  let plan=routePlan??null;
  if(!plan){
    plan=await plannerRuntime.plan(state,{routeId:state?.idle?.routeId??null,playerPosition:state?.world?.position??null});
  }
  if(!plan?.ok)return {...plan,handled:false,stage:plan.stage??'idle-supply-auto-return-plan',action:ACTION_IDLE_SUPPLY_AUTO_RETURN,state:clone(state)};
  if(confirmRoute!==true){
    return {
      ok:true,handled:true,stage:'idle-supply-auto-return-route-plan',
      format:BROWSER_IDLE_SUPPLY_AUTO_RETURN_RUNTIME_FORMAT,
      action:ACTION_IDLE_SUPPLY_AUTO_RETURN,
      mode:'route-plan-only',
      policyBefore:before,
      routePlan:clone(plan),
      routed:false,healed:false,idleEvent:null,
      state:clone(state),
      persistentMutation:false,
      rngGeneratedInternally:false
    };
  }

  const routed=await executionRuntime.execute(state,plan,{
    supplyWarpCatalog,
    transactionPrefix:`${transactionPrefix}:route`,
    now
  });
  if(!routed.ok||routed.handled!==true){
    return {...routed,handled:false,stage:'idle-supply-auto-return-route',action:ACTION_IDLE_SUPPLY_AUTO_RETURN,routePlan:clone(plan),policyBefore:before,state:clone(routed.state??state)};
  }

  const healerNpc=buildWindowHealerNpc(plan);
  if(!healerNpc.ok){
    return {ok:false,handled:false,stage:'idle-supply-auto-return-healer-gate',action:ACTION_IDLE_SUPPLY_AUTO_RETURN,reason:healerNpc.reason,state:clone(routed.state??state),routePlan:clone(plan),policyBefore:before};
  }
  if(confirmHealer!==true){
    return {
      ok:true,handled:true,stage:'idle-supply-auto-return-await-healer-confirm',
      format:BROWSER_IDLE_SUPPLY_AUTO_RETURN_RUNTIME_FORMAT,
      action:ACTION_IDLE_SUPPLY_AUTO_RETURN,
      mode:'route-complete-healer-confirm-required',
      policyBefore:before,
      routePlan:clone(plan),
      routed:clone(routed),
      healed:false,
      idleEvent:null,
      healer:clone(healerNpc.npc),
      state:clone(routed.state),
      persistentMutation:true,
      rngGeneratedInternally:false,
      nextBoundary:'NPC_WINDOW_HEALER_USE'
    };
  }

  const current=clone(routed.state);
  const healer=windowHealerRuntime.dispatch(current,{
    type:'NPC_WINDOW_HEALER_USE',
    npc:healerNpc.npc,
    player:player??current.world?.position??null,
    confirm:true,
    now
  },{now});
  if(!healer.ok||healer.handled!==true){
    return {...healer,handled:false,stage:'idle-supply-auto-return-healer',action:ACTION_IDLE_SUPPLY_AUTO_RETURN,routePlan:clone(plan),routed:clone(routed),policyBefore:before,state:clone(healer.state??current)};
  }
  const healedState=clone(healer.state??current);
  const after=supplyRequired(healedState,policy);
  if(!after.ok)return {ok:false,handled:false,stage:'idle-supply-auto-return-post-heal-check',action:ACTION_IDLE_SUPPLY_AUTO_RETURN,reason:'post-heal-policy-check-failed',errors:after.errors,policyBefore:before,routePlan:clone(plan),routed:clone(routed),healer:clone(healer),state:clone(current)};
  if(after.required)return {ok:false,handled:false,stage:'idle-supply-auto-return-post-heal-check',action:ACTION_IDLE_SUPPLY_AUTO_RETURN,reason:'window-healer-did-not-clear-supply-threshold',policyBefore:before,policyAfter:after,routePlan:clone(plan),routed:clone(routed),healer:clone(healer),state:clone(current)};

  const done=await idleRuntime.dispatch(healedState,{
    type:'IDLE_EVENT',
    event:'supply_done',
    payload:{reason:'source-window-healer-recovery-complete'},
    expectedRevision:healedState.revision,
    now
  },{now});
  if(!done.ok)return {...done,handled:false,stage:'idle-supply-auto-return-idle',action:ACTION_IDLE_SUPPLY_AUTO_RETURN,policyBefore:before,policyAfter:after,routePlan:clone(plan),routed:clone(routed),healer:clone(healer),state:clone(healedState)};

  return {
    ok:true,
    handled:true,
    stage:'idle-supply-auto-return-complete',
    format:BROWSER_IDLE_SUPPLY_AUTO_RETURN_RUNTIME_FORMAT,
    action:ACTION_IDLE_SUPPLY_AUTO_RETURN,
    mode:'return-heal-complete',
    policyBefore:before,
    policyAfter:after,
    routePlan:clone(plan),
    routed:clone(routed),
    healer:clone(healer),
    healed:true,
    idleEvent:'supply_done',
    state:clone(done.state??healedState),
    persistentMutation:true,
    rngGeneratedInternally:false
  };
}

function createBrowserIdleSupplyAutoReturnRuntime(deps={}){
  const validation=validateDependencies(deps);
  return {
    ok:validation.ok,
    format:BROWSER_IDLE_SUPPLY_AUTO_RETURN_RUNTIME_FORMAT,
    errors:validation.errors,
    run:(state,options={})=>runIdleSupplyAutoReturn(state,{...deps,...options})
  };
}

export {
  BROWSER_IDLE_SUPPLY_AUTO_RETURN_RUNTIME_FORMAT,
  ACTION_IDLE_SUPPLY_AUTO_RETURN,
  validateDependencies,
  buildWindowHealerNpc,
  runIdleSupplyAutoReturn,
  createBrowserIdleSupplyAutoReturnRuntime
};
