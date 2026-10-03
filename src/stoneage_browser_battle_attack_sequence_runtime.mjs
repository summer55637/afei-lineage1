const BROWSER_BATTLE_ATTACK_SEQUENCE_RUNTIME_FORMAT='stoneage-v455-browser-battle-attack-sequence-v1';
const ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE='BATTLE_ATTACK_SEQUENCE_RESOLVE';
const ITEM_FIST=0;
const clone=value=>JSON.parse(JSON.stringify(value));
const int=value=>{if(value==null||String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)&&Number.isInteger(n)?n:null;};

function findEntry(context,bid){
  const b=int(bid); if(b==null||b<0||b>19)return null;
  const side=b>=10?1:0,slot=b>=10?b-10:b;
  const s=context?.context?.sides?.find(x=>Number(x?.side)===side);
  return Array.isArray(s?.entries)?s.entries[slot]??null:null;
}
function alive(entry){return !!entry&&int(entry.hp)!=null&&int(entry.hp)>0&&entry.isDie!==true&&entry.dead!==true;}
function sideHasAlive(context,side){
  const s=context?.context?.sides?.find(x=>Number(x?.side)===Number(side));
  return Array.isArray(s?.entries)&&s.entries.some(alive);
}
function isFist(weaponType){return int(weaponType)===ITEM_FIST||String(weaponType??'').trim().toLowerCase()==='fist';}

async function resolveAttackSequence(context,{
  attackerBid=null,
  requestedTargetBid=null,
  weaponType='none',
  attackCount=null,
  targets=[],
  hitRollBundles=[],
  damageDivisorOverride=null,
  now=null,
  transactionPrefix='',
  carriedLootItemsByEnemyBid={},
  carriedLootOwnerRollsByEnemyBid={},
  carriedLootReplaceRollsByEnemyBid={},
  carriedLootReplaceSlotRollsByEnemyBid={}
}={},runtimes={}){
  if(!context?.context)return {ok:false,handled:false,stage:'battle-attack-sequence',action:ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE,reason:'battle-context-required'};
  const required=['attackPreflightRuntime','attackSeqPreludeRuntime','damagePlanRuntime','criticalDamageRuntime','damageReactRuntime','damageReactCommitRuntime','damageDeathChainRuntime','profitCreditRuntime'];
  const missing=required.find(name=>!runtimes?.[name]||runtimes[name].ok!==true);
  if(missing)return {ok:false,handled:false,stage:'battle-attack-sequence',action:ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE,reason:'attack-sequence-runtime-dependency-invalid',dependency:missing};
  const actorBid=int(attackerBid),initialTarget=int(requestedTargetBid),count=int(attackCount);
  if(actorBid==null||initialTarget==null)return {ok:false,handled:false,stage:'battle-attack-sequence',action:ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE,reason:'attacker-and-target-required'};
  if(count==null||count<1||count>50)return {ok:false,handled:false,stage:'battle-attack-sequence',action:ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE,reason:'attack-count-positive-required'};
  if(!Array.isArray(targets)||targets.length<count)return {ok:false,handled:false,stage:'battle-attack-sequence',action:ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE,reason:'target-list-length-insufficient',attackCount:count,targetListLength:Array.isArray(targets)?targets.length:null};

  let next=clone(context);
  const hits=[];
  let damageExecuted=false;

  for(let i=0;i<count;i++){
    const attacker=findEntry(next,actorBid);
    if(!alive(attacker))break;
    const rawTarget=int(targets[i]);
    if(rawTarget==null||rawTarget<0)break;

    const bundle=hitRollBundles[i]??hitRollBundles[0]??{};
    const preflight=runtimes.attackPreflightRuntime.preflight(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(next.context)},
      {
        attackerBid:actorBid,
        targetBid:rawTarget,
        defaultTargetRoll:bundle.defaultTargetRoll??0
      }
    );
    if(!preflight.ok)return {...preflight,stage:'battle-attack-sequence-preflight',action:ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE,hitIndex:i,partialContext:clone(next.context),hits:clone(hits)};
    if(preflight.finalTargetBid==null||preflight.finalTargetBid<0){
      hits.push({hitIndex:i,attackerBid:actorBid,requestedTargetBid:rawTarget,skipped:true,reason:'no-executable-target',preflight});
      continue;
    }

    const prelude=runtimes.attackSeqPreludeRuntime.run(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(next.context)},
      {
        attackerBid:actorBid,
        targetBid:preflight.finalTargetBid,
        weaponType,
        weaponCritical:int(bundle.weaponCritical)??0,
        throwWeapon:bundle.throwWeapon===true,
        battleDuckModify:int(bundle.battleDuckModify)??0,
        duckRoll:bundle.duckRoll,
        drunkRoll:bundle.drunkRoll,
        hitRightRoll:bundle.hitRightRoll,
        criticalRoll:bundle.criticalRoll,
        guardianBitMask:int(bundle.guardianBitMask)??8,
        enabledFeatures:Array.isArray(bundle.enabledFeatures)?bundle.enabledFeatures:[]
      }
    );
    if(!prelude.ok)return {...prelude,stage:'battle-attack-sequence-prelude',action:ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE,hitIndex:i,partialContext:clone(next.context),hits:clone(hits)};
    const hit={hitIndex:i,attackerBid:actorBid,requestedTargetBid:rawTarget,finalTargetBid:prelude.finalTargetBid,preflight:clone(preflight),prelude:clone(prelude),executed:false};

    if(prelude.outcome==='dodge'||prelude.outcome==='miss'){
      hit.executed=true;
      hit.damageExecuted=false;
      hit.stopCounterChain=true;
      hits.push(hit);
      continue;
    }

    const damagePlan=runtimes.damagePlanRuntime.plan(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(next.context)},
      {
        attackerBid:actorBid,
        targetBid:prelude.finalTargetBid,
        damageRollNear:bundle.damageRollNear,
        damageRollWide:bundle.damageRollWide,
        fieldAtt: int(bundle.fieldAtt)??(int(next.context.fieldAtt)??4),
        fieldAttrPower:Number(bundle.fieldAttrPower??next.context.attPow??0),
        includeAttr:bundle.includeAttr!==false
      }
    );
    if(!damagePlan.ok)return {...damagePlan,stage:'battle-attack-sequence-damage-plan',action:ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE,hitIndex:i,partialContext:clone(next.context),hits:clone(hits)};
    const criticalPlan=runtimes.criticalDamageRuntime.plan(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(next.context)},
      {
        attackerBid:actorBid,
        targetBid:prelude.finalTargetBid,
        damageRollNear:bundle.damageRollNear,
        damageRollWide:bundle.damageRollWide,
        fieldAtt:int(bundle.fieldAtt)??(int(next.context.fieldAtt)??4),
        fieldAttrPower:Number(bundle.fieldAttrPower??next.context.attPow??0),
        includeAttr:bundle.includeAttr!==false,
        critical:prelude.critical?.critical===true,
        attackSeqPrelude:prelude,
        weaponType,
        guardRoll:bundle.guardRoll,
        lowDamageRoll:bundle.lowDamageRoll,
        battleDamageModify:Number(bundle.battleDamageModify??1)
      }
    );
    if(!criticalPlan.ok)return {...criticalPlan,stage:'battle-attack-sequence-critical',action:ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE,hitIndex:i,partialContext:clone(next.context),hits:clone(hits)};

    const damageDiv=damageDivisorOverride!=null
      ? Math.max(1,int(damageDivisorOverride)??1)
      : (isFist(weaponType)?count:1);
    const dividedDamage=damageDiv>1?Math.max(Math.trunc(Number(criticalPlan.damage)/damageDiv),Number(criticalPlan.damage)>0?1:0):int(criticalPlan.damage);
    hit.sourceDamage=int(criticalPlan.damage)??0;
    hit.damageDiv=damageDiv;
    hit.damage=dividedDamage;

    const reactPlan=runtimes.damageReactRuntime.plan(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(next.context)},
      {
        attackerBid:actorBid,
        targetBid:prelude.finalTargetBid,
        damage:dividedDamage,
        throwWeapon:bundle.throwWeapon===true,
        weaponType,
        attackerRidePet:false,
        defenderRidePet:false,
        attackerDefencePower:bundle.attackerDefencePower??null,
        defenderDefencePower:bundle.defenderDefencePower??null,
        damageVanish:bundle.damageVanish??null,
        damageAbsorb:bundle.damageAbsorb??null,
        damageReflect:bundle.damageReflect??null,
        trap:bundle.trap??null,
        modTrap:bundle.modTrap??null,
        acupuncture:bundle.acupuncture??null
      }
    );
    if(!reactPlan.ok)return {...reactPlan,stage:'battle-attack-sequence-damage-react',action:ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE,hitIndex:i,partialContext:clone(next.context),hits:clone(hits)};

    let commit;
    const transactionId=`${transactionPrefix||'attack-sequence'}:${actorBid}:${i}`;
    if(reactPlan.reaction?.code!==0){
      commit=runtimes.damageReactCommitRuntime.commit(
        {format:'stoneage-browser-battle-context-runtime-v1',context:clone(next.context)},
        {
          damageReactPlan:reactPlan,
          transactionId:transactionId+':special',
          expectedDamageRevision:reactPlan.damageCommitRevision,
          critical:prelude.critical?.critical===true,
          criticalFlag:bundle.criticalFlag??null,
          battleFlags:int(bundle.battleFlags)??0,
          deathRollByBid:bundle.deathRollByBid??{},
          lerImmuneByBid:bundle.lerImmuneByBid??{}
        }
      );
    }else{
      commit=runtimes.damageDeathChainRuntime.commit(
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
    }
    if(!commit.ok)return {...commit,stage:'battle-attack-sequence-commit',action:ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE,hitIndex:i,partialContext:clone(next.context),hits:clone(hits)};
    next.context=clone(commit.battleContext?.context??commit.battleContext??next.context);
    const profitCredit=runtimes.profitCreditRuntime.apply(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(next.context)},
      {
        attackerBids:[actorBid],
        allowPlayerCredit:actorBid<10,
        allowCommittedDeath:true,
        hitIndex:i,
        source:reactPlan.reaction?.code!==0?'attack-special-react':'attack',
        transactionPrefix:transactionId,
        now
      }
    );
    if(!profitCredit.ok)return {...profitCredit,stage:'battle-attack-sequence-profit-credit',action:ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE,hitIndex:i,partialContext:clone(next.context),hits:clone(hits)};
    next.context=clone(profitCredit.context);
    hit.profitCredit=clone(profitCredit);
    const creditEvent=Array.isArray(profitCredit.newCredits)
      ? profitCredit.newCredits.find(x=>x?.enemyBid===prelude.finalTargetBid)
      : null;
    const carriedItems=carriedLootItemsByEnemyBid?.[String(prelude.finalTargetBid)]??carriedLootItemsByEnemyBid?.[prelude.finalTargetBid]??null;
    let carriedLoot=null;
    if(creditEvent&&Array.isArray(carriedItems)){
      if(!runtimes.carriedLootRuntime||runtimes.carriedLootRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-attack-sequence-carried-loot',action:ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE,hitIndex:i,reason:'carried-loot-runtime-required'};
      carriedLoot=await runtimes.carriedLootRuntime.queue(
        {format:'stoneage-browser-battle-context-runtime-v1',context:clone(next.context)},
        {
          enemyBid:prelude.finalTargetBid,
          ownerBids:creditEvent.creditBids??[],
          items:carriedItems,
          ownerRolls:carriedLootOwnerRollsByEnemyBid?.[String(prelude.finalTargetBid)]??carriedLootOwnerRollsByEnemyBid?.[prelude.finalTargetBid]??[],
          replaceRolls:carriedLootReplaceRollsByEnemyBid?.[String(prelude.finalTargetBid)]??carriedLootReplaceRollsByEnemyBid?.[prelude.finalTargetBid]??[],
          replaceSlotRolls:carriedLootReplaceSlotRollsByEnemyBid?.[String(prelude.finalTargetBid)]??carriedLootReplaceSlotRollsByEnemyBid?.[prelude.finalTargetBid]??[],
          transactionPrefix:transactionId,
          now
        }
      );
      if(!carriedLoot.ok)return {...carriedLoot,stage:'battle-attack-sequence-carried-loot',action:ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE,hitIndex:i,partialContext:clone(next.context),hits:clone(hits)};
      next.context=clone(carriedLoot.context);
    }
    hit.carriedLoot=carriedLoot;
    let enemyExpCredit=null;
    if(creditEvent){
      if(!runtimes.enemyExpRuntime||runtimes.enemyExpRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-attack-sequence-enemy-exp',action:ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE,hitIndex:i,reason:'enemy-exp-runtime-required'};
      enemyExpCredit=runtimes.enemyExpRuntime.credit(
        {format:'stoneage-browser-battle-context-runtime-v1',context:clone(next.context)},
        {enemyBid:creditEvent.enemyBid,participantBids:creditEvent.creditBids??[],hitIndex:i,source:'attack',transactionPrefix:transactionId,now}
      );
      if(!enemyExpCredit.ok)return {...enemyExpCredit,stage:'battle-attack-sequence-enemy-exp',action:ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE,hitIndex:i,partialContext:clone(next.context),hits:clone(hits)};
      next.context=clone(enemyExpCredit.context);
    }
    hit.enemyExpCredit=enemyExpCredit;
    hit.damageReactPlan=clone(reactPlan);
    hit.commit=clone(commit);
    hit.damageExecuted=commit.damageExecuted===true;
    hit.executed=true;
    hit.specialReaction=reactPlan.reaction?.code!==0;
    hit.stopCounterChain=hit.specialReaction===true||commit.deathCommitted===true||prelude.outcome!=='normal';
    hits.push(hit);
    damageExecuted=damageExecuted||hit.damageExecuted;

    const targetAfter=findEntry(next,prelude.finalTargetBid);
    if(!alive(targetAfter)&&i+1<count){
      hit.remainingHitsBlocked=true;
      const nextRawTarget=int(targets[i+1]);
      const nextTargetEntry=nextRawTarget==null?null:findEntry(next,nextRawTarget);
      if(nextRawTarget==null||!alive(nextTargetEntry)||nextRawTarget===prelude.finalTargetBid)break;
    }
    if(!alive(attacker)&&i+1<count)break;
  }

  return {
    ok:true,
    handled:true,
    stage:'battle-attack-sequence-resolved',
    format:BROWSER_BATTLE_ATTACK_SEQUENCE_RUNTIME_FORMAT,
    action:ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE,
    attackerBid:actorBid,
    requestedTargetBid:initialTarget,
    weaponType,
    attackCount:count,
    executedHitCount:hits.filter(x=>x.executed===true).length,
    hits,
    context:next.context,
    damageExecuted,
    counterDeferred:true,
    persistentMutation:false,
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      functions:['BATTLE_GetAttackCount','BATTLE_TargetListSet','BATTLE_Attack','BATTLE_AttackSeq']
    },
    sourceOrder:['attack count consumed','target list prepared','AttackSeq per hit','FIST gDamageDiv=attack_max','damage/react commit per hit','BATTLE_AddProfit per hit'],
    scope:{
      basicMultiHit:true,
      fistDamageDivisor:true,
      damageDivisorOverrideSupported:true,
      perHitProfitCredit:true,
      perHitCarriedLootQueue:true,
      perHitEnemyExpCredit:true,
      bowTargetListInput:true,
      specialDamageReactSupported:true,
      counterExecutionDeferred:true,
      ridePetDeferred:true,
      settlementDeferred:true
    },
    now:now??null
  };
}
function createBrowserBattleAttackSequenceRuntime(deps={}){
  return {
    ok:Object.values(deps).every(x=>x?.ok===true),
    format:BROWSER_BATTLE_ATTACK_SEQUENCE_RUNTIME_FORMAT,
    resolve:(context,options={})=>resolveAttackSequence(context,options,deps)
  };
}
export {
  BROWSER_BATTLE_ATTACK_SEQUENCE_RUNTIME_FORMAT,
  ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE,
  resolveAttackSequence,
  createBrowserBattleAttackSequenceRuntime
};
