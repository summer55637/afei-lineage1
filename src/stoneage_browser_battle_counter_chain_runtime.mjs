const BROWSER_BATTLE_COUNTER_CHAIN_RUNTIME_FORMAT='stoneage-v447-browser-battle-counter-chain-v1';
const ACTION_BATTLE_COUNTER_CHAIN_RESOLVE='BATTLE_COUNTER_CHAIN_RESOLVE';
const MAX_COUNTER_CHAIN=5;
const BATTLE_COM_ATTACK=1;
const BATTLE_COM_S_NOGUARD=3;
const BATTLE_COM_S_NOGUARD_SOURCE=1014;
const clone=value=>JSON.parse(JSON.stringify(value));
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
function findEntry(context,bid){
  const b=int(bid);
  if(b==null||b<0||b>19)return null;
  const side=b>=10?1:0;
  const slot=b>=10?b-10:b;
  const s=context?.context?.sides?.find(x=>Number(x?.side)===side);
  return Array.isArray(s?.entries)?s.entries[slot]??null:null;
}
function entryDamageReact(entry){
  return ['damageVanish','damageAbsorb','damageReflect','trap','acupuncture'].some(k=>num(entry?.[k],0)>0)
    ||num(entry?.damageReact,0)>0;
}
function resolveScaledCounterDamage(damage){
  const d=int(damage);
  if(d==null||d<0)return {ok:false,reason:'counter-damage-invalid'};
  if(d<=0)return {ok:true,damage:0,sourceDamage:d};
  const scaled=Math.trunc(d*0.75);
  return {ok:true,damage:Math.max(scaled,1),sourceDamage:d};
}
async function resolveCounterChain(context,{
  originAttackerBid=null,
  originTargetBid=null,
  counterRolls=[],
  counterAttackRolls=[],
  weaponClassByBid={},
  now=null,
  transactionPrefix=''
}={},runtimes={}){
  if(!context?.context)return {ok:false,handled:false,stage:'battle-counter-chain',action:ACTION_BATTLE_COUNTER_CHAIN_RESOLVE,reason:'battle-context-required'};
  const required=['counterRuntime','attackSeqPreludeRuntime','damagePlanRuntime','criticalDamageRuntime','damageReactRuntime','damageReactCommitRuntime','damageDeathChainRuntime'];
  const missing=required.find(name=>!runtimes?.[name]||runtimes[name].ok!==true);
  if(missing)return {ok:false,handled:false,stage:'battle-counter-chain',action:ACTION_BATTLE_COUNTER_CHAIN_RESOLVE,reason:'counter-chain-runtime-dependency-invalid',dependency:missing};

  let next=clone(context);
  let attackerBid=int(originTargetBid);
  let targetBid=int(originAttackerBid);
  if(attackerBid==null||targetBid==null)return {ok:false,handled:false,stage:'battle-counter-chain',action:ACTION_BATTLE_COUNTER_CHAIN_RESOLVE,reason:'origin-bids-required'};

  const rolls=Array.isArray(counterRolls)?counterRolls:[];
  const attackBundles=Array.isArray(counterAttackRolls)?counterAttackRolls:[];
  const chain=[];
  let persistentMutation=false;

  for(let step=0;step<MAX_COUNTER_CHAIN;step++){
    const attacker=findEntry(next,attackerBid);
    const target=findEntry(next,targetBid);
    if(!attacker||!target){
      return {ok:false,handled:false,stage:'battle-counter-chain',action:ACTION_BATTLE_COUNTER_CHAIN_RESOLVE,reason:'counter-chain-entry-missing',step,attackerBid,targetBid,partialContext:clone(next.context),chain:clone(chain)};
    }
    if(num(attacker.hp,0)<=0||num(target.hp,0)<=0){
      break;
    }

    const bundle=attackBundles[step]??{};
    const counterRoll=int(rolls[step]);
    const attackerWeaponClass=bundle.attackerWeaponClass??weaponClassByBid?.[String(attackerBid)]??weaponClassByBid?.[attackerBid]??'claw';
    const defenderWeaponClass=bundle.defenderWeaponClass??weaponClassByBid?.[String(targetBid)]??weaponClassByBid?.[targetBid]??'claw';
    const check=runtimes.counterRuntime.plan(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(next.context)},
      {
        attackerBid,
        targetBid,
        attackerCommand:attacker.battleCommands?.[0]??null,
        attackerBattleFlg:attacker.battleFlg??0,
        attackerWeaponClass,
        defenderWeaponClass,
        attackerLuck:bundle.attackerLuck??attacker.fixLuck??attacker.luck??0,
        attackerCounterBonus:bundle.attackerCounterBonus??attacker.counterBonus??attacker.counter??0,
        noguardCounterAdjust:bundle.noguardCounterAdjust??attacker.noguardCounterBonus??null,
        counterRoll,
        counterPara:bundle.counterPara??0.08,
        attackerDamageReact:entryDamageReact(attacker),
        defenderDamageReact:entryDamageReact(target)
      }
    );
    if(!check.ok){
      return {...check,stage:'battle-counter-chain-check',action:ACTION_BATTLE_COUNTER_CHAIN_RESOLVE,step,partialContext:clone(next.context),chain:clone(chain)};
    }

    const record={step,attackerBid,targetBid,check:clone(check),executed:false};
    chain.push(record);
    if(check.triggered!==true){
      record.stopReason='counter-not-triggered';
      break;
    }

    const weaponType=String(bundle.weaponType??'none').trim().toLowerCase();
    const prelude=runtimes.attackSeqPreludeRuntime.run(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(next.context)},
      {
        attackerBid,
        targetBid,
        weaponType,
        weaponCritical:num(bundle.weaponCritical)??0,
        throwWeapon:bundle.throwWeapon===true,
        battleDuckModify:num(bundle.battleDuckModify)??0,
        duckRoll:bundle.duckRoll,
        drunkRoll:bundle.drunkRoll,
        hitRightRoll:bundle.hitRightRoll,
        criticalRoll:bundle.criticalRoll,
        guardianBitMask:int(bundle.guardianBitMask)??8,
        enabledFeatures:Array.isArray(bundle.enabledFeatures)?bundle.enabledFeatures:[]
      }
    );
    if(!prelude.ok)return {...prelude,stage:'battle-counter-chain-attack-prelude',action:ACTION_BATTLE_COUNTER_CHAIN_RESOLVE,step,partialContext:clone(next.context),chain:clone(chain)};
    record.prelude=clone(prelude);

    if(prelude.outcome==='dodge'||prelude.outcome==='miss'){
      record.stopReason='counter-attack-missed';
      record.executed=true;
      break;
    }

    const damagePlan=runtimes.damagePlanRuntime.plan(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(next.context)},
      {
        attackerBid,
        targetBid:prelude.finalTargetBid,
        damageRollNear:bundle.damageRollNear,
        damageRollWide:bundle.damageRollWide,
        fieldAtt:num(bundle.fieldAtt)??(int(next.context.fieldAtt)??4),
        fieldAttrPower:num(bundle.fieldAttrPower)??(num(next.context.attPow)??0),
        includeAttr:bundle.includeAttr!==false
      }
    );
    if(!damagePlan.ok)return {...damagePlan,stage:'battle-counter-chain-damage-plan',action:ACTION_BATTLE_COUNTER_CHAIN_RESOLVE,step,partialContext:clone(next.context),chain:clone(chain)};

    const criticalPlan=runtimes.criticalDamageRuntime.plan(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(next.context)},
      {
        attackerBid,
        targetBid:prelude.finalTargetBid,
        damageRollNear:bundle.damageRollNear,
        damageRollWide:bundle.damageRollWide,
        fieldAtt:num(bundle.fieldAtt)??(int(next.context.fieldAtt)??4),
        fieldAttrPower:num(bundle.fieldAttrPower)??(num(next.context.attPow)??0),
        includeAttr:bundle.includeAttr!==false,
        critical:prelude.critical?.critical===true,
        attackSeqPrelude:prelude,
        weaponType,
        guardRoll:bundle.guardRoll,
        lowDamageRoll:bundle.lowDamageRoll,
        battleDamageModify:1
      }
    );
    if(!criticalPlan.ok)return {...criticalPlan,stage:'battle-counter-chain-critical',action:ACTION_BATTLE_COUNTER_CHAIN_RESOLVE,step,partialContext:clone(next.context),chain:clone(chain)};

    const scaled=resolveScaledCounterDamage(criticalPlan.damage);
    if(!scaled.ok)return {...scaled,handled:false,stage:'battle-counter-chain-scale',action:ACTION_BATTLE_COUNTER_CHAIN_RESOLVE,step,partialContext:clone(next.context),chain:clone(chain)};
    record.sourceDamage=criticalPlan.damage;
    record.counterDamage=scaled.damage;

    const reactPlan=runtimes.damageReactRuntime.plan(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(next.context)},
      {
        attackerBid,
        targetBid:prelude.finalTargetBid,
        damage:scaled.damage,
        throwWeapon:bundle.throwWeapon===true,
        weaponType,
        attackerRidePet:bundle.attackerRidePet===true,
        defenderRidePet:bundle.defenderRidePet===true,
        attackerDefencePower:bundle.attackerDefencePower??null,
        defenderDefencePower:bundle.defenderDefencePower??null,
        attackerPetDefencePower:bundle.attackerPetDefencePower??null,
        defenderPetDefencePower:bundle.defenderPetDefencePower??null,
        damageVanish:bundle.damageVanish??null,
        damageAbsorb:bundle.damageAbsorb??null,
        damageReflect:bundle.damageReflect??null,
        trap:bundle.trap??null,
        modTrap:bundle.modTrap??null,
        acupuncture:bundle.acupuncture??null
      }
    );
    if(!reactPlan.ok)return {...reactPlan,stage:'battle-counter-chain-damage-react',action:ACTION_BATTLE_COUNTER_CHAIN_RESOLVE,step,partialContext:clone(next.context),chain:clone(chain)};

    if(reactPlan.attackerRidePet===true||reactPlan.defenderRidePet===true){
      return {ok:false,handled:false,stage:'battle-counter-chain-unsupported-reaction',action:ACTION_BATTLE_COUNTER_CHAIN_RESOLVE,reason:'v448-counter-chain-ride-pet-special-reaction-deferred',step,reaction:reactPlan.reaction,partialContext:clone(next.context),chain:clone(chain)};
    }

    let commit;
    if(reactPlan.reaction?.code!==0){
      commit=runtimes.damageReactCommitRuntime.commit(
        {format:'stoneage-browser-battle-context-runtime-v1',context:clone(next.context)},
        {
          damageReactPlan:reactPlan,
          transactionId:`${transactionPrefix||'counter'}:${step}:${attackerBid}:${targetBid}:special`,
          expectedDamageRevision:reactPlan.damageCommitRevision,
          critical:prelude.critical?.critical===true,
          criticalFlag:bundle.criticalFlag??null,
          battleFlags:int(bundle.battleFlags)??0,
          deathRollByBid:bundle.deathRollByBid??{},
          lerImmuneByBid:bundle.lerImmuneByBid??{}
        }
      );
      if(!commit.ok)return {...commit,stage:'battle-counter-chain-special-damage-react',action:ACTION_BATTLE_COUNTER_CHAIN_RESOLVE,step,partialContext:clone(next.context),chain:clone(chain)};
      next.context=clone(commit.battleContext?.context??commit.battleContext??next.context);
      record.damageReactPlan=clone(reactPlan);
      record.commit=clone(commit);
      record.damageExecuted=commit.damageExecuted===true;
      record.executed=true;
      record.stopReason='special-damage-react';
      break;
    }

    const transactionId=`${transactionPrefix||'counter'}:${step}:${attackerBid}:${targetBid}`;
    const commit=runtimes.damageDeathChainRuntime.commit(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(next.context)},
      {
        damageReactPlan:reactPlan,
        transactionId,
        expectedDamageRevision:reactPlan.damageCommitRevision,
        critical:prelude.critical?.critical===true,
        criticalFlag:bundle.criticalFlag??null,
        battleFlags:int(bundle.battleFlags)??0,
        deathRoll:bundle.deathRoll??null,
        lerImmune:bundle.lerImmune===true
      }
    );
    if(!commit.ok)return {...commit,stage:'battle-counter-chain-damage-death',action:ACTION_BATTLE_COUNTER_CHAIN_RESOLVE,step,partialContext:clone(next.context),chain:clone(chain)};

    next.context=clone(commit.battleContext?.context??commit.battleContext??next.context);
    record.damagePlan=clone(damagePlan);
    record.criticalPlan=clone(criticalPlan);
    record.damageReactPlan=clone(reactPlan);
    record.commit=clone(commit);
    record.damageExecuted=commit.damageExecuted===true;
    record.executed=true;

    const ordinaryNormal=prelude.outcome==='normal';
    const nonZero=scaled.damage>0;
    const lethal=commit.deathCommitted===true;
    const reactionActive=check.reactSuppressed===true||reactPlan.reaction?.code!==0;
    if(!ordinaryNormal||!nonZero||lethal||reactionActive||commit.damageExecuted!==true){
      record.stopReason=lethal?'target-died':reactionActive?'damage-react-suppressed':!nonZero?'zero-damage':'counter-return-false';
      break;
    }

    attackerBid=targetBid;
    targetBid=int(record.attackerBid);
  }

  return {
    ok:true,
    handled:true,
    stage:'battle-counter-chain-resolved',
    format:BROWSER_BATTLE_COUNTER_CHAIN_RUNTIME_FORMAT,
    action:ACTION_BATTLE_COUNTER_CHAIN_RESOLVE,
    originAttackerBid:int(originAttackerBid),
    originTargetBid:int(originTargetBid),
    chain,
    chainCount:chain.filter(x=>x.executed===true).length,
    counterTriggeredCount:chain.filter(x=>x.check?.triggered===true).length,
    maxChain:MAX_COUNTER_CHAIN,
    context:next.context,
    persistentMutation,
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      functions:['BATTLE_CounterCheck','BATTLE_Counter','BATTLE_AttackSeq','BATTLE_DamageSub'],
      sourceOrder:['reverse first counter','counter check','AttackSeq','damage*0.75','DamageSub','iRet governs next counter','maximum five']
    },
    scope:{
      ordinaryBasicCounterOnly:true,
      maxChain:MAX_COUNTER_CHAIN,
      specialDamageReactionsDeferred:true,
      ridePetDeferred:true,
      persistentSettlementDeferred:true
    },
    now:now??null
  };
}
function createBrowserBattleCounterChainRuntime({
  counterRuntime,
  attackSeqPreludeRuntime,
  damagePlanRuntime,
  criticalDamageRuntime,
  damageReactRuntime,
  damageReactCommitRuntime,
  damageDeathChainRuntime
}={}){
  const required=[counterRuntime,attackSeqPreludeRuntime,damagePlanRuntime,criticalDamageRuntime,damageReactRuntime,damageReactCommitRuntime,damageDeathChainRuntime];
  return {
    ok:required.every(r=>r?.ok===true),
    format:BROWSER_BATTLE_COUNTER_CHAIN_RUNTIME_FORMAT,
    resolve:(context,options={})=>resolveCounterChain(context,options,{
      counterRuntime,
      attackSeqPreludeRuntime,
      damagePlanRuntime,
      criticalDamageRuntime,
      damageReactRuntime,
      damageDeathChainRuntime
    })
  };
}
export {
  BROWSER_BATTLE_COUNTER_CHAIN_RUNTIME_FORMAT,
  ACTION_BATTLE_COUNTER_CHAIN_RESOLVE,
  MAX_COUNTER_CHAIN,
  resolveCounterChain,
  createBrowserBattleCounterChainRuntime
};
