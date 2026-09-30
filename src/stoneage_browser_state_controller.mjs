import { dispatchNpcInteraction } from './stoneage_npc_dispatch_runtime.mjs';
import { normalizeNpcRuntimeConfig } from './stoneage_npc_runtime_config.mjs';

const BROWSER_STATE_CONTROLLER_FORMAT='stoneage-browser-state-controller-v1';
const ACTION_NPC_TALK='NPC_TALK';
const clone=value=>JSON.parse(JSON.stringify(value));

function createBrowserStateController({
  state,
  moduleAudit=null,
  compatibilityCatalog=null,
  modules={},
  handlerFactory=null,
  runtimeConfig={},
  interactionRule=null,
  maxDistance=null,
  now=()=>new Date().toISOString(),
  transactionPrefix='browser-npc'
}={}){
  let currentState=state;
  const config=normalizeNpcRuntimeConfig(runtimeConfig);
  let sequence=0;
  return {
    format:BROWSER_STATE_CONTROLLER_FORMAT,
    getConfig(){return clone(config);},
    getState(){return clone(currentState);},
    async dispatch(action={}){
      const type=String(action?.type??'').trim();
      if(type!==ACTION_NPC_TALK){
        return {ok:false,handled:false,reason:'unsupported-browser-action',type,state:clone(currentState)};
      }
      const transactionId=String(action.transactionId??`${transactionPrefix}-${++sequence}`).trim();
      const player=action.player??null;
      const npc=action.npc??null;
      const result=await dispatchNpcInteraction(currentState,npc,player,{
        interactionRule:action.interactionRule??interactionRule,
        maxDistance:action.maxDistance??maxDistance,
        action:'talk',
        modules:action.modules??modules,
        moduleAudit:action.moduleAudit??moduleAudit,
        compatibilityCatalog:action.compatibilityCatalog??compatibilityCatalog,
        runtimeConfig:action.runtimeConfig??config,
        handlerFactory:action.handlerFactory??handlerFactory,
        now:action.now??now,
        transactionId
      });
      if(result.ok&&result.handled===true&&result.state)currentState=result.state;
      return {...result,state:clone(result.state??currentState)};
    }
  };
}

export { BROWSER_STATE_CONTROLLER_FORMAT, ACTION_NPC_TALK, createBrowserStateController };
