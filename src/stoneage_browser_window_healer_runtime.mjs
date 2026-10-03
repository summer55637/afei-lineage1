import { canInteractWithNpc } from './stoneage_npc_interaction_runtime.mjs';

const BROWSER_WINDOW_HEALER_RUNTIME_FORMAT='stoneage-browser-window-healer-runtime-v1';
const ACTION_NPC_WINDOW_HEALER_USE='NPC_WINDOW_HEALER_USE';
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>JSON.parse(JSON.stringify(value));
const intOr=(value,fallback=null)=>{
  const n=Number(value);
  return Number.isFinite(n)?Math.trunc(n):fallback;
};
const floatOr=(value,fallback=null)=>{
  const n=Number(value);
  return Number.isFinite(n)?n:fallback;
};
const toBool=value=>value===true||String(value??'').trim().toLowerCase()==='true';

function parseWindowHealerArgument(raw){
  const parts=String(raw??'').split('|').map(x=>x.trim());
  if(parts[0]?.toLowerCase()!=='npcgen_winhealer'){
    return {ok:false,reason:'window-healer-template-required'};
  }
  if(parts.length!==5){
    return {ok:false,reason:'window-healer-argument-shape-invalid',parts};
  }
  const level=intOr(parts[1]),hpRate=floatOr(parts[2]),mpRate=floatOr(parts[3]),range=intOr(parts[4]);
  if(level==null||level<0)return {ok:false,reason:'window-healer-level-invalid'};
  if(hpRate==null||hpRate<0)return {ok:false,reason:'window-healer-hp-rate-invalid'};
  if(mpRate==null||mpRate<0)return {ok:false,reason:'window-healer-mp-rate-invalid'};
  if(range==null||range<1)return {ok:false,reason:'window-healer-range-invalid'};
  return {
    ok:true,
    level,
    hpRate,
    mpRate,
    range,
    sourceArgument:parts.slice(1).join('|'),
    raw:parts.join('|')
  };
}

function resolveWindowHealerProfile(npc){
  if(!isObject(npc))return {ok:false,reason:'npc-required'};
  const service=(npc.services??[]).find(item=>String(item?.functionSet??'').trim().toLowerCase()==='windowhealer');
  const raw=service?.raw??npc?.sourceEnemy?.raw??npc?.sourceRaw??null;
  const parsed=parseWindowHealerArgument(raw);
  if(!parsed.ok){
    return {ok:false,reason:parsed.reason};
  }
  if(String(service?.sourceStatus??'known')!=='known' && npc?.sourceFunctionSets?.some?.(x=>String(x).toLowerCase()==='windowhealer')!==true){
    return {ok:false,reason:'window-healer-service-unresolved'};
  }
  return {ok:true,profile:parsed};
}

function interactionGate(npc,player,range){
  const gate=canInteractWithNpc(npc,player,{
    interactionRule:'NPC_Util_CharDistance configurable range',
    maxDistance:range
  });
  if(!gate.ok)return {ok:false,reason:gate.reason,stage:'interaction-gate'};
  if(!gate.interactable)return {ok:false,reason:gate.reason,stage:'interaction-gate',gate};
  return {ok:true,gate};
}

function healAll(state){
  const next=clone(state);
  if(!isObject(next?.player))return {ok:false,reason:'player-state-missing'};
  const pets=next?.pets?.petBox;
  if(!Array.isArray(pets))return {ok:false,reason:'pet-box-state-missing'};
  next.player.hp=Math.max(0,intOr(next.player.maxHp,0));
  next.player.mp=Math.max(0,intOr(next.player.maxMp,0));
  for(let i=0;i<pets.length;i++){
    const pet=pets[i];
    if(!isObject(pet))return {ok:false,reason:'pet-state-invalid',index:i};
    const maxHp=intOr(pet.maxHp,-1),maxMp=intOr(pet.maxMp,-1);
    if(maxHp<0||maxMp<0)return {ok:false,reason:'pet-max-hp-mp-required',index:i};
    pet.hp=maxHp;
    pet.mp=maxMp;
    if(typeof pet.dead==='boolean')pet.dead=false;
  }
  return {ok:true,state:next,petCount:pets.length};
}

function calculateWindowHealerAllCost(state,profile){
  const level=intOr(state?.player?.level,0);
  const healerLevel=intOr(profile?.level,0);
  if(level<healerLevel){
    return {
      ok:true,
      goldBefore:intOr(state?.player?.gold??state?.player?.money,0),
      hpCost:0,
      mpCost:0,
      totalCost:0,
      freeByLevel:true,
      playerLevel:level,
      healerLevel
    };
  }
  const hp=intOr(state?.player?.hp,0),maxHp=intOr(state?.player?.maxHp,0);
  const mp=intOr(state?.player?.mp,0),maxMp=intOr(state?.player?.maxMp,0);
  const hpRate=Number(profile.hpRate);
  const mpRate=Number(profile.mpRate);
  let hpCost=0,mpCost=0;
  if(hp<maxHp){
    hpCost=Math.max(1,Math.trunc(level*hpRate));
  }
  if(mp<maxMp){
    mpCost=Math.max(1,Math.trunc(level*mpRate));
  }
  return {
    ok:true,
    goldBefore:intOr(state?.player?.gold??state?.player?.money,0),
    hpCost,mpCost,totalCost:hpCost+mpCost,
    freeByLevel:false,
    playerLevel:level,
    healerLevel
  };
}

function applyGoldCost(next,totalCost){
  const current=intOr(next?.player?.gold??next?.player?.money,0);
  if(current<totalCost)return {ok:false,reason:'insufficient-gold',goldBefore:current,totalCost};
  if(Object.prototype.hasOwnProperty.call(next.player,'gold'))next.player.gold=current-totalCost;
  else next.player.money=current-totalCost;
  return {ok:true,goldAfter:current-totalCost};
}

function applyWindowHealer(state,npc,player,{confirm=true,now=()=>new Date().toISOString()}={}){
  const profileCheck=resolveWindowHealerProfile(npc);
  if(!profileCheck.ok)return {ok:false,handled:false,stage:'module-resolution',reason:profileCheck.reason,state:clone(state)};
  const profile=profileCheck.profile;
  const gate=interactionGate(npc,player,profile.range);
  if(!gate.ok)return {ok:false,handled:false,...gate,state:clone(state),profile};
  const cost=calculateWindowHealerAllCost(state,profile);
  if(!cost.ok)return {ok:false,handled:false,stage:'cost-plan',reason:cost.reason,state:clone(state),profile};
  if(!confirm)return {
    ok:true,handled:true,stage:'window-healer-plan',
    format:BROWSER_WINDOW_HEALER_RUNTIME_FORMAT,
    action:ACTION_NPC_WINDOW_HEALER_USE,
    applied:false,
    requiresConfirmation:cost.totalCost>0,
    profile,cost,gate:gate.gate,state:clone(state),
    rngGeneratedInternally:false
  };
  const healed=healAll(state);
  if(!healed.ok)return {ok:false,handled:false,stage:'window-healer-recovery',reason:healed.reason,petIndex:healed.index??null,state:clone(state),profile,cost};
  const next=healed.state;
  const charged=applyGoldCost(next,cost.totalCost);
  if(!charged.ok)return {ok:false,handled:false,stage:'window-healer-cost',reason:charged.reason,goldBefore:charged.goldBefore,totalCost:cost.totalCost,profile,cost,state:clone(state)};
  next.revision=intOr(next.revision,0)+1;
  next.runtimeMeta??={};
  next.runtimeMeta.updatedAt=String(typeof now==='function'?now():now);
  return {
    ok:true,handled:true,stage:'window-healer',
    format:BROWSER_WINDOW_HEALER_RUNTIME_FORMAT,
    action:ACTION_NPC_WINDOW_HEALER_USE,
    applied:true,
    profile,cost,
    charge:{applied:cost.totalCost>0,totalCost:cost.totalCost,goldBefore:cost.goldBefore,goldAfter:charged.goldAfter},
    healed:{player:true,petCount:healed.petCount},
    gate:gate.gate,
    state:next,
    rngGeneratedInternally:false,
    source:{repository:SOURCE_REPOSITORY,ref:SOURCE_REF}
  };
}

function createBrowserWindowHealerRuntime(){
  return {
    ok:true,
    format:BROWSER_WINDOW_HEALER_RUNTIME_FORMAT,
    dispatch:(state,action={},options={})=>{
      if(!isObject(action))return {ok:false,handled:false,stage:'action',reason:'invalid-browser-window-healer-action',state};
      if(String(action.type??'').trim()!==ACTION_NPC_WINDOW_HEALER_USE){
        return {ok:false,handled:false,stage:'action',reason:'unsupported-browser-window-healer-action',type:action.type,state};
      }
      return applyWindowHealer(state,action.npc,action.player,{
        confirm:action.confirm!==false,
        now:action.now??options.now??(()=>new Date().toISOString())
      });
    }
  };
}

export {
  BROWSER_WINDOW_HEALER_RUNTIME_FORMAT,
  ACTION_NPC_WINDOW_HEALER_USE,
  SOURCE_REPOSITORY,
  SOURCE_REF,
  parseWindowHealerArgument,
  resolveWindowHealerProfile,
  calculateWindowHealerAllCost,
  applyWindowHealer,
  createBrowserWindowHealerRuntime
};
