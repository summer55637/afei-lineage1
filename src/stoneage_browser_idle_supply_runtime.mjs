import { supplyRequired } from './stoneage_idle_policy.mjs';

const BROWSER_IDLE_SUPPLY_RUNTIME_FORMAT='stoneage-v472-browser-idle-supply-runtime-v1';
const ACTION_IDLE_SUPPLY_USE_HEALER='IDLE_SUPPLY_USE_HEALER';
const clone=value=>JSON.parse(JSON.stringify(value));
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

function validateDependencies({idleRuntime=null,healerRuntime=null}={}){
  const errors=[];
  if(!idleRuntime||idleRuntime.ok!==true)errors.push('idleRuntime');
  if(!healerRuntime||healerRuntime.ok!==true)errors.push('healerRuntime');
  return {ok:errors.length===0,errors};
}

async function useHealerForIdleSupply(state,{
  idleRuntime=null,
  healerRuntime=null,
  policy=null,
  npc=null,
  player=null,
  now=()=>new Date().toISOString(),
  expectedRevision=null
}={}){
  if(!isObject(state))return {ok:false,handled:false,stage:'idle-supply',action:ACTION_IDLE_SUPPLY_USE_HEALER,reason:'state-required'};
  if(String(state?.idle?.mode??'')!=='supply_check'){
    return {ok:false,handled:false,stage:'idle-supply-state',action:ACTION_IDLE_SUPPLY_USE_HEALER,reason:'idle-state-supply-check-required',idleMode:state?.idle?.mode??null,state:clone(state)};
  }
  if(!policy||!isObject(policy))return {ok:false,handled:false,stage:'idle-supply-policy',action:ACTION_IDLE_SUPPLY_USE_HEALER,reason:'explicit-supply-policy-required',state:clone(state)};
  const needed=supplyRequired(state,policy);
  if(!needed.ok)return {ok:false,handled:false,stage:'idle-supply-policy',action:ACTION_IDLE_SUPPLY_USE_HEALER,reason:'invalid-supply-policy',errors:needed.errors,state:clone(state)};
  if(!needed.required){
    const done=await idleRuntime.dispatch(state,{
      type:'IDLE_EVENT',
      event:'supply_done',
      payload:{reason:'already-above-supply-threshold'},
      expectedRevision:expectedRevision==null?Number(state?.revision??0):expectedRevision,
      now
    },{now});
    if(!done.ok)return {...done,handled:false,stage:'idle-supply-idle',action:ACTION_IDLE_SUPPLY_USE_HEALER,state:clone(state)};
    return {
      ok:true,handled:true,stage:'idle-supply-complete',format:BROWSER_IDLE_SUPPLY_RUNTIME_FORMAT,
      action:ACTION_IDLE_SUPPLY_USE_HEALER,mode:'no-healer-needed',policyCheck:needed,
      healed:false,state:clone(done.state??state),idleEvent:'supply_done'
    };
  }
  if(!npc||!player)return {ok:false,handled:false,stage:'idle-supply-healer',action:ACTION_IDLE_SUPPLY_USE_HEALER,reason:'healer-npc-and-player-context-required',policyCheck:needed,state:clone(state)};
  const healed=healerRuntime.dispatch(state,{
    type:'NPC_HEALER_USE',
    npc,
    player,
    now
  },{now});
  if(!healed.ok||healed.handled!==true){
    return {...healed,handled:false,stage:'idle-supply-healer',action:ACTION_IDLE_SUPPLY_USE_HEALER,policyCheck:needed,state:clone(healed.state??state)};
  }
  const healedState=clone(healed.state??state);
  const after=supplyRequired(healedState,policy);
  if(!after.ok)return {ok:false,handled:false,stage:'idle-supply-post-heal-check',action:ACTION_IDLE_SUPPLY_USE_HEALER,reason:'post-heal-policy-check-failed',errors:after.errors,policyCheck:needed,healer:healed,state:clone(state)};
  if(after.required)return {ok:false,handled:false,stage:'idle-supply-post-heal-check',action:ACTION_IDLE_SUPPLY_USE_HEALER,reason:'healer-did-not-clear-supply-threshold',policyBefore:needed,policyAfter:after,healer:healed,state:clone(state)};
  const done=await idleRuntime.dispatch(healedState,{
    type:'IDLE_EVENT',
    event:'supply_done',
    payload:{reason:'source-healer-recovery-complete'},
    expectedRevision:healedState.revision,
    now
  },{now});
  if(!done.ok)return {...done,handled:false,stage:'idle-supply-idle',action:ACTION_IDLE_SUPPLY_USE_HEALER,policyCheck:needed,healer:healed,state:clone(healedState)};
  return {
    ok:true,
    handled:true,
    stage:'idle-supply-complete',
    format:BROWSER_IDLE_SUPPLY_RUNTIME_FORMAT,
    action:ACTION_IDLE_SUPPLY_USE_HEALER,
    mode:'healer',
    policyBefore:needed,
    policyAfter:after,
    healer:healed,
    idleEvent:'supply_done',
    state:clone(done.state??healedState)
  };
}

function createBrowserIdleSupplyRuntime(deps={}){
  const validation=validateDependencies(deps);
  return {
    ok:validation.ok,
    format:BROWSER_IDLE_SUPPLY_RUNTIME_FORMAT,
    errors:validation.errors,
    complete:(state,options={})=>useHealerForIdleSupply(state,{...deps,...options})
  };
}

export {
  BROWSER_IDLE_SUPPLY_RUNTIME_FORMAT,
  ACTION_IDLE_SUPPLY_USE_HEALER,
  validateDependencies,
  useHealerForIdleSupply,
  createBrowserIdleSupplyRuntime
};
