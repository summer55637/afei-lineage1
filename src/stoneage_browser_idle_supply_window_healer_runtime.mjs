import { supplyRequired } from './stoneage_idle_policy.mjs';

const BROWSER_IDLE_SUPPLY_WINDOW_HEALER_RUNTIME_FORMAT='stoneage-v479-browser-idle-supply-window-healer-runtime-v1';
const ACTION_IDLE_SUPPLY_USE_WINDOW_HEALER='IDLE_SUPPLY_USE_WINDOW_HEALER';
const clone=value=>JSON.parse(JSON.stringify(value));
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

function validateDependencies({idleRuntime=null,windowHealerRuntime=null}={}){
  const errors=[];
  if(!idleRuntime||idleRuntime.ok!==true)errors.push('idleRuntime');
  if(!windowHealerRuntime||windowHealerRuntime.ok!==true)errors.push('windowHealerRuntime');
  return {ok:errors.length===0,errors};
}

async function useWindowHealerForIdleSupply(state,{
  idleRuntime=null,
  windowHealerRuntime=null,
  policy=null,
  npc=null,
  player=null,
  confirm=true,
  now=()=>new Date().toISOString(),
  expectedRevision=null
}={}){
  if(!isObject(state))return {ok:false,handled:false,stage:'idle-supply-window-healer',action:ACTION_IDLE_SUPPLY_USE_WINDOW_HEALER,reason:'state-required'};
  if(String(state?.idle?.mode??'')!=='supply_check'){
    return {ok:false,handled:false,stage:'idle-supply-window-healer-state',action:ACTION_IDLE_SUPPLY_USE_WINDOW_HEALER,reason:'idle-state-supply-check-required',idleMode:state?.idle?.mode??null,state:clone(state)};
  }
  if(!policy||!isObject(policy))return {ok:false,handled:false,stage:'idle-supply-window-healer-policy',action:ACTION_IDLE_SUPPLY_USE_WINDOW_HEALER,reason:'explicit-supply-policy-required',state:clone(state)};
  const before=supplyRequired(state,policy);
  if(!before.ok)return {ok:false,handled:false,stage:'idle-supply-window-healer-policy',action:ACTION_IDLE_SUPPLY_USE_WINDOW_HEALER,reason:'invalid-supply-policy',errors:before.errors,state:clone(state)};
  if(!before.required){
    const done=await idleRuntime.dispatch(state,{
      type:'IDLE_EVENT',
      event:'supply_done',
      payload:{reason:'already-above-supply-threshold'},
      expectedRevision:expectedRevision==null?Number(state?.revision??0):expectedRevision,
      now
    },{now});
    if(!done.ok)return {...done,handled:false,stage:'idle-supply-window-healer-idle',action:ACTION_IDLE_SUPPLY_USE_WINDOW_HEALER,state:clone(state)};
    return {
      ok:true,handled:true,stage:'idle-supply-window-healer-complete',
      format:BROWSER_IDLE_SUPPLY_WINDOW_HEALER_RUNTIME_FORMAT,
      action:ACTION_IDLE_SUPPLY_USE_WINDOW_HEALER,
      mode:'no-healer-needed',policyBefore:before,healed:false,idleEvent:'supply_done',
      state:clone(done.state??state)
    };
  }
  if(!npc||!player)return {ok:false,handled:false,stage:'idle-supply-window-healer',action:ACTION_IDLE_SUPPLY_USE_WINDOW_HEALER,reason:'window-healer-npc-and-player-context-required',policyBefore:before,state:clone(state)};
  const healed=windowHealerRuntime.dispatch(state,{
    type:'NPC_WINDOW_HEALER_USE',
    npc,
    player,
    confirm:confirm!==false,
    now
  },{now});
  if(!healed.ok||healed.handled!==true){
    return {...healed,handled:false,stage:'idle-supply-window-healer',action:ACTION_IDLE_SUPPLY_USE_WINDOW_HEALER,policyBefore:before,state:clone(healed.state??state)};
  }
  if(confirm===false){
    return {
      ok:true,handled:true,stage:'idle-supply-window-healer-plan',
      format:BROWSER_IDLE_SUPPLY_WINDOW_HEALER_RUNTIME_FORMAT,
      action:ACTION_IDLE_SUPPLY_USE_WINDOW_HEALER,
      mode:'plan',policyBefore:before,healed:clone(healed),idleEvent:null,
      state:clone(state)
    };
  }
  const healedState=clone(healed.state??state);
  const after=supplyRequired(healedState,policy);
  if(!after.ok)return {ok:false,handled:false,stage:'idle-supply-window-healer-post-check',action:ACTION_IDLE_SUPPLY_USE_WINDOW_HEALER,reason:'post-heal-policy-check-failed',errors:after.errors,policyBefore:before,healed,state:clone(state)};
  if(after.required)return {ok:false,handled:false,stage:'idle-supply-window-healer-post-check',action:ACTION_IDLE_SUPPLY_USE_WINDOW_HEALER,reason:'window-healer-did-not-clear-supply-threshold',policyBefore:before,policyAfter:after,healed,state:clone(state)};
  const done=await idleRuntime.dispatch(healedState,{
    type:'IDLE_EVENT',
    event:'supply_done',
    payload:{reason:'source-window-healer-recovery-complete'},
    expectedRevision:healedState.revision,
    now
  },{now});
  if(!done.ok)return {...done,handled:false,stage:'idle-supply-window-healer-idle',action:ACTION_IDLE_SUPPLY_USE_WINDOW_HEALER,policyBefore:before,policyAfter:after,healed,state:clone(healedState)};
  return {
    ok:true,
    handled:true,
    stage:'idle-supply-window-healer-complete',
    format:BROWSER_IDLE_SUPPLY_WINDOW_HEALER_RUNTIME_FORMAT,
    action:ACTION_IDLE_SUPPLY_USE_WINDOW_HEALER,
    mode:'window-healer',
    policyBefore:before,
    policyAfter:after,
    healer:healed,
    idleEvent:'supply_done',
    state:clone(done.state??healedState),
    persistentMutation:true,
    rngGeneratedInternally:false
  };
}

function createBrowserIdleSupplyWindowHealerRuntime(deps={}){
  const validation=validateDependencies(deps);
  return {
    ok:validation.ok,
    format:BROWSER_IDLE_SUPPLY_WINDOW_HEALER_RUNTIME_FORMAT,
    errors:validation.errors,
    complete:(state,options={})=>useWindowHealerForIdleSupply(state,{...deps,...options})
  };
}

export {
  BROWSER_IDLE_SUPPLY_WINDOW_HEALER_RUNTIME_FORMAT,
  ACTION_IDLE_SUPPLY_USE_WINDOW_HEALER,
  validateDependencies,
  useWindowHealerForIdleSupply,
  createBrowserIdleSupplyWindowHealerRuntime
};
