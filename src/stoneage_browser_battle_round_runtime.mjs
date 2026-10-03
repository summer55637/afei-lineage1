const BROWSER_BATTLE_ROUND_RUNTIME_FORMAT='stoneage-v446-browser-battle-round-runtime-v1';
const ACTION_BATTLE_ROUND_RESOLVE='BATTLE_ROUND_RESOLVE';

const BATTLE_MODE_BATTLE=2;
const BATTLE_CHARMODE_C_WAIT=2;
const BATTLE_CHARMODE_C_OK=3;

const BATTLE_COM_NONE=0;
const BATTLE_COM_ATTACK=1;
const BATTLE_COM_GUARD=2;
const BATTLE_COM_WAIT=11;
const BATTLE_COM_BOOMERANG=8;
const BATTLE_COM_S_NOGUARD=1014;
const BATTLE_COM_S_CHARGE=1005;
const BATTLE_COM_S_MIGHTY=1006;
const BATTLE_COM_S_POWERBALANCE=1007;
const BATTLE_COM_S_EARTHROUND0=1009;
const BATTLE_COM_S_EARTHROUND1=1010;
const BATTLE_COM_S_CHARGE_OK=1015;

const BASIC_ATTACK_COMMANDS=new Set([
  BATTLE_COM_ATTACK,
  BATTLE_COM_BOOMERANG,
  BATTLE_COM_S_NOGUARD,
  BATTLE_COM_S_MIGHTY,
  BATTLE_COM_S_POWERBALANCE,
  BATTLE_COM_S_EARTHROUND0,
  BATTLE_COM_S_CHARGE_OK
]);

const SUPPORTED_NOOP_COMMANDS=new Set([
  BATTLE_COM_NONE,
  BATTLE_COM_GUARD,
  BATTLE_COM_WAIT
]);

const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

const clone=value=>JSON.parse(JSON.stringify(value));
const int=value=>{
  if(value==null||String(value).trim()==='')return null;
  const n=Number(value);
  return Number.isFinite(n)&&Number.isInteger(n)?n:null;
};
const num=value=>{
  if(value==null||String(value).trim()==='')return null;
  const n=Number(value);
  return Number.isFinite(n)?n:null;
};

function entryBid(entry,fallback){
  return int(entry?.bid??fallback);
}

function allEntries(context){
  const out=[];
  for(const side of context?.context?.sides??[]){
    if(!Array.isArray(side?.entries))continue;
    for(let slot=0;slot<side.entries.length;slot++){
      const entry=side.entries[slot];
      if(!entry)continue;
      out.push({
        entry,
        side:int(side.side)??0,
        slot,
        bid:entryBid(entry,(int(side.side)??0)*10+slot)
      });
    }
  }
  return out;
}

function isAlive(entry){
  const hp=int(entry?.hp);
  return hp==null ? entry?.isDie!==true&&entry?.dead!==true : hp>0&&entry?.isDie!==true&&entry?.dead!==true;
}

function sortTurnEntries(context){
  return allEntries(context)
    .filter(row=>isAlive(row.entry))
    .sort((a,b)=>{
      const aq=num(a.entry?.quick??a.entry?.fixDex)??-Infinity;
      const bq=num(b.entry?.quick??b.entry?.fixDex)??-Infinity;
      if(aq!==bq)return bq-aq;
      const as=num(a.entry?.sequencePower??a.entry?.sequence)??0;
      const bs=num(b.entry?.sequencePower??b.entry?.sequence)??0;
      if(as!==bs)return bs-as;
      return a.bid-b.bid;
    });
}

function bundleMap(attackRolls){
  if(!Array.isArray(attackRolls))return {ok:false,reason:'attack-rolls-required'};
  const map=new Map();
  for(const bundle of attackRolls){
    const bid=int(bundle?.attackerBid);
    if(bid==null)return {ok:false,reason:'attack-roll-attacker-bid-required'};
    if(map.has(bid))return {ok:false,reason:'duplicate-attack-roll-bundle',attackerBid:bid};
    map.set(bid,bundle);
  }
  return {ok:true,map};
}

function randomCursorFor(statusRandomRollsByBid,bid){
  const raw=statusRandomRollsByBid?.[String(bid)] ?? statusRandomRollsByBid?.[bid] ?? [];
  return Array.isArray(raw) ? {rolls:raw,cursor:0} : null;
}

function nextRandom(cursor,minimum=1,maximum=100){
  const roll=int(cursor?.rolls?.[cursor.cursor]);
  if(roll==null||roll<minimum||roll>maximum)return {ok:false,reason:'status-rng-required-or-out-of-range',roll,minimum,maximum,cursor:cursor?.cursor??0};
  cursor.cursor+=1;
  return {ok:true,roll};
}

function markNextCommandPhase(context){
  const next=clone(context);
  let prepared=0;
  for(const row of allEntries(next)){
    const entry=row.entry;
    if(!entry)continue;
    if(!isAlive(entry))continue;
    entry.guardian=-1;
    entry.sourceBattleCharMode=BATTLE_CHARMODE_C_WAIT;
    entry.battleMode='c_wait';
    const commands=Array.isArray(entry.battleCommands)?entry.battleCommands.slice():[-1,-1,-1];
    commands[0]=BATTLE_COM_NONE;
    commands[1]=-1;
    entry.battleCommands=commands;
    entry.noguardDuckBonus=0;
    entry.noguardCounterBonus=0;
    entry.noguardCriticalBonus=0;
    prepared++;
  }
  next.context.preCommandSequence='fixed-c-pre-command-next-round';
  return {context:next.context,prepared};
}

async function resolveBattleRound(context,{
  attackRolls=[],
  statusRandomRollsByBid={},
  counterPolicy='defer',
  roundId='',
  defaultTargetRollByBid={},
  sourceTargetRollByBid={},
  now=null,
  runtimes={}
}={}){
  if(!context?.context)return {ok:false,handled:false,stage:'battle-round',action:ACTION_BATTLE_ROUND_RESOLVE,reason:'battle-context-required'};
  if(String(context.context.mode??'').trim().toLowerCase()!=='battle'||int(context.context.sourceMode)!==BATTLE_MODE_BATTLE){
    return {ok:false,handled:false,stage:'battle-round',action:ACTION_BATTLE_ROUND_RESOLVE,reason:'battle-active-phase-required'};
  }
  if(String(counterPolicy).trim()!=='defer'){
    return {ok:false,handled:false,stage:'battle-round',action:ACTION_BATTLE_ROUND_RESOLVE,reason:'v446-round-counter-policy-must-be-explicit-defer',counterPolicy};
  }
  const id=String(roundId??'').trim();
  if(!id||id.length>128)return {ok:false,handled:false,stage:'battle-round',action:ACTION_BATTLE_ROUND_RESOLVE,reason:'round-id-required'};

  const runtimeNames=['attackPreflightRuntime','attackSeqPreludeRuntime','damagePlanRuntime','criticalDamageRuntime','damageReactRuntime','damageDeathChainRuntime','statusRuntime','endRuntime'];
  const missingRuntime=runtimeNames.find(name=>!runtimes?.[name]||runtimes[name].ok!==true);
  if(missingRuntime){
    return {
      ok:false,handled:false,stage:'battle-round',action:ACTION_BATTLE_ROUND_RESOLVE,
      reason:'battle-round-runtime-dependency-invalid',dependency:missingRuntime
    };
  }
  const processStatus=(wrapper,bid,cursor)=>{
    try{
      return runtimes.statusRuntime.process(
        {format:'stoneage-browser-battle-context-runtime-v1',context:clone(wrapper.context)},
        {
          battleBid:bid,
          randomInt:(minimum,maximum)=>{
            const next=nextRandom(cursor,minimum,maximum);
            if(!next.ok)throw Object.assign(new Error(next.reason),next);
            return next.roll;
          }
        }
      );
    }catch(error){
      return {
        ok:false,
        handled:false,
        stage:'battle-status',
        reason:String(error?.reason??error?.message??'status-rng-failed'),
        battleBid:bid,
        rngCursor:error?.cursor??cursor?.cursor??0,
        rngMinimum:error?.minimum??null,
        rngMaximum:error?.maximum??null
      };
    }
  };
  const resolveAttackPreflight=({context:wrapper},options)=>runtimes.attackPreflightRuntime.preflight({format:'stoneage-browser-battle-context-runtime-v1',context:clone(wrapper)},options);
  const runAttackPrelude=({context:wrapper},options)=>runtimes.attackSeqPreludeRuntime.run({format:'stoneage-browser-battle-context-runtime-v1',context:clone(wrapper)},options);
  const runDamagePlan=({context:wrapper},options)=>runtimes.damagePlanRuntime.plan({format:'stoneage-browser-battle-context-runtime-v1',context:clone(wrapper)},options);
  const runCriticalDamagePlan=({context:wrapper},options)=>runtimes.criticalDamageRuntime.plan({format:'stoneage-browser-battle-context-runtime-v1',context:clone(wrapper)},options);
  const runDamageReactPlan=({context:wrapper},options)=>runtimes.damageReactRuntime.plan({format:'stoneage-browser-battle-context-runtime-v1',context:clone(wrapper)},options);
  const commitDamageDeathChain=({context:wrapper},options)=>runtimes.damageDeathChainRuntime.commit({format:'stoneage-browser-battle-context-runtime-v1',context:clone(wrapper)},options);
  const planBattleEnd=(wrapper)=>runtimes.endRuntime.plan({format:'stoneage-browser-battle-context-runtime-v1',context:clone(wrapper.context??wrapper)});

  const bundles=bundleMap(attackRolls);
  if(!bundles.ok)return {...bundles,handled:false,stage:'battle-round',action:ACTION_BATTLE_ROUND_RESOLVE};

  const next=clone(context);
  next.context.turn=(int(next.context.turn)??0)+1;

  const order=sortTurnEntries(next);
  const statuses=[];
  const actions=[];
  const attacks=[];
  const deferred=[];
  let damageExecuted=false;

  for(const row of order){
    const actorBid=row.bid;
    let actor=allEntries(next).find(x=>x.bid===actorBid)?.entry;
    if(!actor||!isAlive(actor))continue;

    const statusCursor=randomCursorFor(statusRandomRollsByBid,actorBid);
    const statusBeforeCursor=statusCursor?.cursor??0;
    const statusResult=processStatus(next,actorBid,statusCursor);
    if(!statusResult.ok){
      return {...statusResult,stage:'battle-round-status',action:ACTION_BATTLE_ROUND_RESOLVE,turn:next.context.turn,partialContext:clone(next.context),actions:clone(actions),attacks:clone(attacks)};
    }
    next.context=statusResult.battleContext;
    statuses.push({...statusResult,rngConsumedCount:(statusCursor?.cursor??statusBeforeCursor)-statusBeforeCursor});
    actor=allEntries(next).find(x=>x.bid===actorBid)?.entry;
    if(!actor||!isAlive(actor))continue;

    if(statusResult.skip===true){
      actions.push({actorBid,commandCode:BATTLE_COM_NONE,action:'status-blocked',skipped:true});
      actor.battleCommands=[BATTLE_COM_NONE,-1,-1];
      actor.sourceBattleCharMode=BATTLE_CHARMODE_C_OK;
      actor.battleMode='c_ok';
      continue;
    }

    const command=int(actor.battleCommands?.[0])??BATTLE_COM_NONE;
    if(SUPPORTED_NOOP_COMMANDS.has(command)){
      actions.push({actorBid,commandCode:command,action:command===BATTLE_COM_GUARD?'guard':command===BATTLE_COM_WAIT?'wait':'none',skipped:false});
      continue;
    }

    if(BASIC_ATTACK_COMMANDS.has(command)){
      const bundle=bundles.map.get(actorBid);
      if(!bundle){
        return {
          ok:false,handled:false,stage:'battle-round-attack-input',action:ACTION_BATTLE_ROUND_RESOLVE,
          reason:'attack-roll-bundle-required',turn:next.context.turn,attackerBid:actorBid,
          partialContext:clone(next.context),statuses:clone(statuses),actions:clone(actions),attacks:clone(attacks)
        };
      }

      const weaponType=String(bundle.weaponType??'none').trim().toLowerCase();
      const defaultTargetRoll=bundle.defaultTargetRoll??defaultTargetRollByBid?.[String(actorBid)]??defaultTargetRollByBid?.[actorBid]??null;
      const preflight=resolveAttackPreflight(next,{
        attackerBid:actorBid,
        targetBid:int(actor.battleCommands?.[1])??-1,
        defaultTargetRoll
      });
      if(!preflight.ok){
        return {...preflight,stage:'battle-round-attack-preflight',action:ACTION_BATTLE_ROUND_RESOLVE,turn:next.context.turn,partialContext:clone(next.context),statuses:clone(statuses),actions:clone(actions),attacks:clone(attacks)};
      }
      const targetBid=preflight.finalTargetBid;
      if(targetBid==null||targetBid<0){
        actions.push({actorBid,commandCode:command,action:'attack-no-target',skipped:true,preflight});
        continue;
      }

      const targetRoll=preflight.targetSource==='default-attacker'
        ?(bundle.defaultTargetRoll??defaultTargetRollByBid?.[String(actorBid)]??defaultTargetRollByBid?.[actorBid]??null)
        :(bundle.defaultTargetRoll??null);

      const prelude=runAttackPrelude(next,{
        attackerBid:actorBid,
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
      });
      if(!prelude.ok){
        return {...prelude,stage:'battle-round-attack-prelude',action:ACTION_BATTLE_ROUND_RESOLVE,turn:next.context.turn,partialContext:clone(next.context),statuses:clone(statuses),actions:clone(actions),attacks:clone(attacks)};
      }

      const attackRecord={
        attackerBid,
        requestedTargetBid:int(actor.battleCommands?.[1])??-1,
        finalTargetBid:prelude.finalTargetBid,
        commandCode:command,
        targetRoll,
        preflight:clone(preflight),
        prelude:clone(prelude)
      };

      if(prelude.dodged===true||prelude.outcome==='dodge'){
        attackRecord.damageExecuted=false;
        attacks.push(attackRecord);
        continue;
      }

      const damagePlan=runDamagePlan(next,{
        attackerBid,
        targetBid:prelude.finalTargetBid,
        damageRollNear:bundle.damageRollNear,
        damageRollWide:bundle.damageRollWide,
        fieldAtt:num(bundle.fieldAtt)??(int(next.context.fieldAtt)??4),
        fieldAttrPower:num(bundle.fieldAttrPower)??(num(next.context.attPow)??0),
        includeAttr:bundle.includeAttr!==false
      });
      if(!damagePlan.ok){
        return {...damagePlan,stage:'battle-round-damage-plan',action:ACTION_BATTLE_ROUND_RESOLVE,turn:next.context.turn,partialContext:clone(next.context),statuses:clone(statuses),actions:clone(actions),attacks:clone(attacks)};
      }

      const criticalPlan=runCriticalDamagePlan(next,{
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
        battleDamageModify:num(bundle.battleDamageModify)??1
      });
      if(!criticalPlan.ok){
        return {...criticalPlan,stage:'battle-round-critical-damage',action:ACTION_BATTLE_ROUND_RESOLVE,turn:next.context.turn,partialContext:clone(next.context),statuses:clone(statuses),actions:clone(actions),attacks:clone(attacks)};
      }

      const reactPlan=runDamageReactPlan(next,{
        attackerBid,
        targetBid:prelude.finalTargetBid,
        damage:criticalPlan.damage,
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
      });
      if(!reactPlan.ok){
        return {...reactPlan,stage:'battle-round-damage-react',action:ACTION_BATTLE_ROUND_RESOLVE,turn:next.context.turn,partialContext:clone(next.context),statuses:clone(statuses),actions:clone(actions),attacks:clone(attacks)};
      }

      if(reactPlan.reaction?.code!==0||reactPlan.attackerRidePet===true||reactPlan.defenderRidePet===true){
        return {
          ok:false,handled:false,stage:'battle-round-unsupported-damage-reaction',action:ACTION_BATTLE_ROUND_RESOLVE,
          reason:'v446-round-only-ordinary-non-ride-damage-commit',reaction:reactPlan.reaction,turn:next.context.turn,
          partialContext:clone(next.context),statuses:clone(statuses),actions:clone(actions),attacks:clone(attacks)
        };
      }

      const tx=`\${id}:\${actorBid}:\${attacks.length}`;
      const deathCommit=commitDamageDeathChain(next,{
        damageReactPlan:reactPlan,
        transactionId:tx,
        expectedDamageRevision:reactPlan.damageCommitRevision,
        critical:prelude.critical?.critical===true,
        criticalFlag:bundle.criticalFlag??null,
        battleFlags:int(bundle.battleFlags)??0,
        deathRoll:bundle.deathRoll??null,
        lerImmune:bundle.lerImmune===true
      });
      if(!deathCommit.ok){
        return {...deathCommit,stage:'battle-round-damage-death',action:ACTION_BATTLE_ROUND_RESOLVE,turn:next.context.turn,partialContext:clone(next.context),statuses:clone(statuses),actions:clone(actions),attacks:clone(attacks)};
      }
      next.context=clone(deathCommit.battleContext?.context??deathCommit.battleContext??next.context);
      attackRecord.damagePlan=clone(damagePlan);
      attackRecord.criticalPlan=clone(criticalPlan);
      attackRecord.damageReactPlan=clone(reactPlan);
      attackRecord.commit=clone(deathCommit);
      attackRecord.damageExecuted=deathCommit.damageExecuted===true;
      attacks.push(attackRecord);
      actions.push({actorBid,commandCode:command,action:'attack',targetBid:prelude.finalTargetBid,damage:criticalPlan.damage,damageExecuted:deathCommit.damageExecuted===true});
      damageExecuted=damageExecuted||deathCommit.damageExecuted===true;
      if(deathCommit.deathCommitted===true)attackRecord.targetKilled=true;

      deferred.push({
        kind:'counter',
        attackerBid,
        defenderBid:prelude.finalTargetBid,
        reason:'v446-basic-round-defers-BATTLE_Counter-chain'
      });
      continue;
    }

    return {
      ok:false,handled:false,stage:'battle-round-command',action:ACTION_BATTLE_ROUND_RESOLVE,
      reason:'unsupported-command-in-v446-basic-round',attackerBid:actorBid,commandCode:command,
      turn:next.context.turn,partialContext:clone(next.context),statuses:clone(statuses),actions:clone(actions),attacks:clone(attacks)
    };
  }

  const endPlan=planBattleEnd(next);
  if(!endPlan.ok){
    return {...endPlan,stage:'battle-round-end-plan',action:ACTION_BATTLE_ROUND_RESOLVE,turn:next.context.turn,partialContext:clone(next.context),statuses:clone(statuses),actions:clone(actions),attacks:clone(attacks)};
  }

  if(endPlan.finished===true){
    next.context.winnerSide=endPlan.winnerSide;
    next.context.finishReason=endPlan.finishReason;
  }

  const prepared=markNextCommandPhase(next);
  next.context=prepared.context;

  return {
    ok:true,
    handled:true,
    stage:'battle-round-resolved',
    format:BROWSER_BATTLE_ROUND_RUNTIME_FORMAT,
    action:ACTION_BATTLE_ROUND_RESOLVE,
    roundId:id,
    turn:next.context.turn,
    order:order.map(row=>row.bid),
    statuses,
    actions,
    attacks,
    deferred,
    counterPolicy:'defer',
    counterDeferredCount:deferred.length,
    damageExecuted,
    finished:endPlan.finished===true,
    winnerSide:endPlan.winnerSide,
    finishReason:endPlan.finishReason,
    finishPlan:clone(endPlan),
    nextCommandPhase:true,
    preparedEntries:prepared.prepared,
    context:next.context,
    persistentMutation:false,
    source:{
      repository:SOURCE_REPOSITORY,
      ref:SOURCE_REF,
      functions:['BATTLE_Command','BATTLE_Battling','BATTLE_PreCommandSeq','BATTLE_OnlyRescue'],
      sourceOrder:['turn++','EntrySort','StatusSeq','command execution','end check','PreCommandSeq']
    },
    scope:{
      basicAttackOnly:true,
      maxAttackCountPerActor:1,
      counterDeferred:true,
      specialDamageReactionsDeferred:true,
      persistentSettlementDeferred:true
    },
    now:now??null
  };
}

/*
  These wrappers are injected through the factory to keep the round driver
  small and independently regression-testable. The public API accepts the
  factories so the production controller can bind the canonical runtimes.
*/
function createBrowserBattleRoundRuntime({
  attackPreflightRuntime,
  attackSeqPreludeRuntime,
  damagePlanRuntime,
  criticalDamageRuntime,
  damageReactRuntime,
  damageDeathChainRuntime,
  statusRuntime,
  endRuntime
}={}){
  const required=[
    ['attackPreflightRuntime',attackPreflightRuntime],
    ['attackSeqPreludeRuntime',attackSeqPreludeRuntime],
    ['damagePlanRuntime',damagePlanRuntime],
    ['criticalDamageRuntime',criticalDamageRuntime],
    ['damageReactRuntime',damageReactRuntime],
    ['damageDeathChainRuntime',damageDeathChainRuntime],
    ['statusRuntime',statusRuntime],
    ['endRuntime',endRuntime]
  ];
  for(const [name,runtime] of required){
    if(!runtime||runtime.ok!==true)throw new Error(name+'-required');
  }

  return {
        ok:false,
        handled:false,
        stage:'battle-status',
        reason:String(error?.reason??error?.message??'status-rng-failed'),
        battleBid,
        rngCursor:error?.cursor??cursor?.cursor??0,
        rngMinimum:error?.minimum??null,
        rngMaximum:error?.maximum??null
      };
    }
  }

  function resolveAttackPreflight(context,options){
    return attackPreflightRuntime.preflight(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(context.context)},
      options
    );
  }

  function runAttackPrelude(context,options){
    return attackSeqPreludeRuntime.run(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(context.context)},
      options
    );
  }

  function runDamagePlan(context,options){
    return damagePlanRuntime.plan(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(context.context)},
      options
    );
  }

  function runCriticalDamagePlan(context,options){
    return criticalDamageRuntime.plan(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(context.context)},
      options
    );
  }

  function runDamageReactPlan(context,options){
    return damageReactRuntime.plan(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(context.context)},
      options
    );
  }

  function commitDamageDeathChain(context,options){
    return damageDeathChainRuntime.commit(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(context.context)},
      options
    );
  }

  function planBattleEnd(context){
    return endRuntime.plan({format:'stoneage-browser-battle-context-runtime-v1',context:clone(context.context)});
  }

  return {
    ok:required.every(([,runtime])=>runtime?.ok===true),
    format:BROWSER_BATTLE_ROUND_RUNTIME_FORMAT,
    resolve:(context,options={})=>resolveBattleRound(context,{
      ...options,
      runtimes:{
        attackPreflightRuntime,
        attackSeqPreludeRuntime,
        damagePlanRuntime,
        criticalDamageRuntime,
        damageReactRuntime,
        damageDeathChainRuntime,
        statusRuntime,
        endRuntime
      }
    })
  };
}

export {
  BROWSER_BATTLE_ROUND_RUNTIME_FORMAT,
  ACTION_BATTLE_ROUND_RESOLVE,
  BASIC_ATTACK_COMMANDS,
  SUPPORTED_NOOP_COMMANDS,
  sortTurnEntries,
  resolveBattleRound,
  createBrowserBattleRoundRuntime
};