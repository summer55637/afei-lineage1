const BROWSER_BATTLE_DAMAGE_REACT_RUNTIME_FORMAT='stoneage-v404-browser-battle-damage-react-v1';
const ACTION_BATTLE_DAMAGE_REACT_PLAN='BATTLE_DAMAGE_REACT_PLAN';

const BATTLE_MD_NONE=0;
const BATTLE_MD_ABSROB=1;
const BATTLE_MD_REFLEC=2;
const BATTLE_MD_VANISH=3;
const BATTLE_MD_TRAP=4;
const BATTLE_MD_ACUPUNCTURE=5;

const SIDE_OFFSET=10;

const int=value=>{
  if(value==null||String(value).trim()==='')return null;
  const n=Number(value);
  return Number.isFinite(n)?Math.trunc(n):null;
};
const num=(value,fallback=null)=>{
  if(value==null||String(value).trim()==='')return fallback;
  const n=Number(value);
  return Number.isFinite(n)?n:fallback;
};
const truthy=value=>value===true||Number(value)>0;

function findEntry(context,bid){
  const b=int(bid);
  if(b==null||b<0||b>19)return null;
  const side=b>=SIDE_OFFSET?1:0;
  const slot=b>=SIDE_OFFSET?b-SIDE_OFFSET:b;
  const s=context?.context?.sides?.find(x=>Number(x?.side)===side);
  return Array.isArray(s?.entries)?s.entries[slot]??null:null;
}

function isThrowWeapon(options={}){
  if(options.throwWeapon===true)return true;
  const weaponType=String(options.weaponType??'none').trim().toLowerCase();
  return weaponType.includes('throw');
}

function reactionState(entry,options={}){
  const b=entry?.battleStatus??{};
  return {
    vanish:truthy(options.damageVanish??entry?.damageVanish),
    absorb:truthy(options.damageAbsorb??entry?.damageAbsorb),
    reflect:truthy(options.damageReflect??entry?.damageReflect),
    trap:truthy(options.trap??b.trap??entry?.trap),
    acupuncture:truthy(options.acupuncture??b.acupuncture??entry?.acupuncture)
  };
}

function resolveReaction(entry,options={}){
  const flags=reactionState(entry,options);
  if(flags.vanish)return {code:BATTLE_MD_VANISH,name:'vanish',priority:1,flags};
  if(flags.absorb)return {code:BATTLE_MD_ABSROB,name:'absorb',priority:2,flags};
  if(flags.reflect&&!isThrowWeapon(options))return {code:BATTLE_MD_REFLEC,name:'reflect',priority:3,flags};
  if(flags.trap&&!isThrowWeapon(options))return {code:BATTLE_MD_TRAP,name:'trap',priority:4,flags};
  if(flags.acupuncture&&!isThrowWeapon(options))return {code:BATTLE_MD_ACUPUNCTURE,name:'acupuncture',priority:5,flags};
  const skipped=[];
  if(flags.reflect&&isThrowWeapon(options))skipped.push('reflect');
  if(flags.trap&&isThrowWeapon(options))skipped.push('trap');
  if(flags.acupuncture&&isThrowWeapon(options))skipped.push('acupuncture');
  return {code:BATTLE_MD_NONE,name:'none',priority:0,flags,skippedByWeapon:skipped};
}

function splitDamageAcrossRidePet(damage,{ridePet=false,defencePower=0,petDefencePower=0}={}){
  const d=int(damage);
  if(d==null||d<0)return {ok:false,reason:'damage-required'};
  if(!ridePet)return {ok:true,ownerDamage:d,petDamage:0,split:false};
  const ownerDef=Math.max(num(defencePower,0),1);
  const petDef=Math.max(num(petDefencePower,0),1);
  const ownerDamage=Math.trunc((d*petDef)/(ownerDef+petDef))+1;
  const petDamage=d-ownerDamage+1;
  return {ok:true,ownerDamage:Math.max(ownerDamage,0),petDamage:Math.max(petDamage,0),split:true};
}

function buildReactionPlan(context,{
  attackerBid=null,
  targetBid=null,
  damage=0,
  throwWeapon=false,
  weaponType='none',
  attackerRidePet=false,
  defenderRidePet=false,
  attackerDefencePower=null,
  defenderDefencePower=null,
  attackerPetDefencePower=null,
  defenderPetDefencePower=null,
  damageVanish=null,
  damageAbsorb=null,
  damageReflect=null,
  trap=null,
  modTrap=null,
  acupuncture=null
}={}){
  if(!context?.context)return {ok:false,handled:false,stage:'battle-damage-react',reason:'battle-context-required'};
  const attacker=findEntry(context,attackerBid);
  const defender=findEntry(context,targetBid);
  if(!attacker||!defender)return {ok:false,handled:false,stage:'battle-damage-react',reason:'attacker-or-defender-missing'};

  const incoming=int(damage);
  if(incoming==null||incoming<0)return {ok:false,handled:false,stage:'battle-damage-react',reason:'non-negative-damage-required'};

  const resolved=resolveReaction(defender,{
    throwWeapon,
    weaponType,
    damageVanish,
    damageAbsorb,
    damageReflect,
    trap,
    acupuncture
  });

  const result={
    ok:true,
    handled:true,
    stage:'battle-damage-react-plan-ready',
    format:BROWSER_BATTLE_DAMAGE_REACT_RUNTIME_FORMAT,
    action:ACTION_BATTLE_DAMAGE_REACT_PLAN,
    attackerBid:int(attackerBid),
    targetBid:int(targetBid),
    requestedDamage:incoming,
    reaction:resolved,
    redirected:false,
    defenderDamage:0,
    defenderPetDamage:0,
    attackerDamage:0,
    attackerPetDamage:0,
    defenderHeal:0,
    defenderPetHeal:0,
    stateConsumption:[],
    rngConsumed:0,
    hpMutation:false,
    persistentMutation:false,
    damageExecuted:false,
    damageCommitRevision:int(context.context.damageCommitRevision??0),
    attackerRidePet:attackerRidePet===true,
    defenderRidePet:defenderRidePet===true,
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      functions:['BATTLE_GetDamageReact','BATTLE_DamageSub']
    }
  };

  if(incoming===0){
    result.reaction={code:BATTLE_MD_NONE,name:'none',priority:0,flags:{}};
    result.stage='battle-damage-react-noop';
    result.notes=['Source BATTLE_DamageSub returns before checking reactions when damage is zero'];
    return result;
  }

  const splitToDefender=dmg=>splitDamageAcrossRidePet(dmg,{
    ridePet:defenderRidePet===true,
    defencePower:defenderDefencePower??defender.defencePower,
    petDefencePower:defenderPetDefencePower??0
  });
  const splitToAttacker=dmg=>splitDamageAcrossRidePet(dmg,{
    ridePet:attackerRidePet===true,
    defencePower:attackerDefencePower??attacker.defencePower,
    petDefencePower:attackerPetDefencePower??0
  });

  switch(resolved.code){
    case BATTLE_MD_VANISH:
      result.stateConsumption.push({field:'damageVanish',from:1,to:0});
      result.notes=['Source clears one vanish charge and leaves HP unchanged'];
      break;
    case BATTLE_MD_ABSROB:{
      const split=splitToDefender(incoming);
      if(!split.ok)return {...split,stage:'battle-damage-react'};
      result.defenderHeal=split.ownerDamage;
      result.defenderPetHeal=split.petDamage;
      result.stateConsumption.push({field:'damageAbsorb',from:1,to:0});
      result.notes=['Source converts incoming damage into HP recovery'];
      break;
    }
    case BATTLE_MD_REFLEC:{
      const split=splitToAttacker(incoming);
      if(!split.ok)return {...split,stage:'battle-damage-react'};
      result.redirected=true;
      result.attackerDamage=split.ownerDamage;
      result.attackerPetDamage=split.petDamage;
      result.stateConsumption.push({field:'damageReflect',from:1,to:0});
      result.notes=['Source redirects damage to the attacker'];
      break;
    }
    case BATTLE_MD_TRAP:{
      const reflected=int(modTrap);
      if(reflected==null||reflected<0)return {ok:false,handled:false,stage:'battle-damage-react',reason:'trap-mod-damage-required'};
      const split=splitToAttacker(reflected);
      if(!split.ok)return {...split,stage:'battle-damage-react'};
      result.redirected=true;
      result.requestedDamage=reflected;
      result.attackerDamage=split.ownerDamage;
      result.attackerPetDamage=split.petDamage;
      result.stateConsumption.push({field:'trap',from:1,to:0},{field:'modTrap',from:reflected,to:0});
      result.notes=['Source redirects trap damage to the attacker and clears trap state'];
      break;
    }
    case BATTLE_MD_ACUPUNCTURE:{
      let adjusted=incoming;
      if(adjusted%2!==0)adjusted+=1;
      const first=splitToDefender(adjusted);
      if(!first.ok)return {...first,stage:'battle-damage-react'};
      const backlash=Math.trunc(adjusted/2);
      const second=splitToAttacker(backlash);
      if(!second.ok)return {...second,stage:'battle-damage-react'};
      result.requestedDamage=adjusted;
      result.defenderDamage=first.ownerDamage;
      result.defenderPetDamage=first.petDamage;
      result.attackerDamage=second.ownerDamage;
      result.attackerPetDamage=second.petDamage;
      result.stateConsumption.push({field:'acupuncture',from:1,to:0});
      result.notes=['Source applies acupuncture damage to defender first, then half damage to attacker'];
      break;
    }
    default:{
      const split=splitToDefender(incoming);
      if(!split.ok)return {...split,stage:'battle-damage-react'};
      result.defenderDamage=split.ownerDamage;
      result.defenderPetDamage=split.petDamage;
      break;
    }
  }

  return result;
}

function createBrowserBattleDamageReactRuntime(){
  return {ok:true,format:BROWSER_BATTLE_DAMAGE_REACT_RUNTIME_FORMAT,plan:(context,options={})=>buildReactionPlan(context,options)};
}

export {
  BROWSER_BATTLE_DAMAGE_REACT_RUNTIME_FORMAT,
  ACTION_BATTLE_DAMAGE_REACT_PLAN,
  BATTLE_MD_NONE,
  BATTLE_MD_ABSROB,
  BATTLE_MD_REFLEC,
  BATTLE_MD_VANISH,
  BATTLE_MD_TRAP,
  BATTLE_MD_ACUPUNCTURE,
  resolveReaction,
  splitDamageAcrossRidePet,
  buildReactionPlan,
  createBrowserBattleDamageReactRuntime
};
