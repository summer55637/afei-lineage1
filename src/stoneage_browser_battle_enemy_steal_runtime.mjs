const BROWSER_BATTLE_ENEMY_STEAL_RUNTIME_FORMAT='stoneage-v442-browser-enemy-steal-v1';
const ACTION_BATTLE_ENEMY_STEAL_PLAN='BATTLE_ENEMY_STEAL_PLAN';
const ACTION_BATTLE_ENEMY_STEAL_COMMIT='BATTLE_ENEMY_STEAL_COMMIT';
const BATTLE_COM_S_STEAL=1013;
const BATTLE_MODE_BATTLE=2;
const BATTLE_CHARMODE_C_OK=3;
const BATTLE_CHARMODE_RESCUE=5;
const SIDE_OFFSET=10;
const PLAYER_BACKPACK_START=9;
const PLAYER_ITEM_SLOT_COUNT=24;
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const clone=v=>JSON.parse(JSON.stringify(v));
const int=v=>{
  if(v==null||String(v).trim()==='')return null;
  const n=Number(v);
  return Number.isFinite(n)&&Number.isInteger(n)?n:null;
};

function locateEntry(context,bid){
  const b=int(bid);
  if(b==null||b<0||b>19)return null;
  const side=b>=SIDE_OFFSET?1:0,slot=b>=SIDE_OFFSET?b-SIDE_OFFSET:b;
  const row=context?.context?.sides?.find(s=>int(s?.side)===side);
  return {side,slot,bid:b,entry:Array.isArray(row?.entries)?row.entries[slot]??null:null,row};
}
function eligibleTarget(entry){
  if(!entry||entry.isDie===true||entry.isDead===true||entry.dead===true)return false;
  const mode=int(entry.sourceBattleCharMode);
  if(mode==null||mode===0||mode===BATTLE_CHARMODE_RESCUE)return false;
  if(entry.isAttacked===false||int(entry.isAttacked)===0)return false;
  const hp=int(entry.hp);
  if(hp!=null&&hp<=0)return false;
  return true;
}
function fallbackCandidates(context,side){
  const row=context?.context?.sides?.find(s=>int(s?.side)===side);
  const entries=Array.isArray(row?.entries)?row.entries:[];
  return entries.map((entry,slot)=>({entry,slot,bid:side*SIDE_OFFSET+slot}))
    .filter(x=>eligibleTarget(x.entry));
}
function nextRoll(values,cursor,min,max,label){
  const roll=int(values[cursor]);
  if(roll==null||roll<min||roll>max)return {ok:false,reason:label+'-rng-required-or-out-of-range',roll,min,max,consumed:cursor};
  return {ok:true,roll,cursor:cursor+1};
}
function planIdentity(plan){
  return JSON.stringify({
    format:plan?.format,action:plan?.action,turn:plan?.turn,
    attackerBid:plan?.attackerBid,requestedTargetBid:plan?.requestedTargetBid,
    finalTargetBid:plan?.finalTargetBid,targetAdjusted:plan?.targetAdjusted,
    targetResolved:plan?.targetResolved,defaultTargetRoll:plan?.defaultTargetRoll,
    stealRolls:plan?.stealRolls,rngConsumed:plan?.rngConsumed,
    outcome:plan?.outcome,stolen:plan?.stolen,stealMode:plan?.stealMode,
    goldBefore:plan?.goldBefore,goldRate:plan?.goldRate,goldAmount:plan?.goldAmount,
    item:plan?.item,stateRevision:plan?.stateRevision
  });
}

function planEnemySteal(battleContext,state,{
  attackerBid=null,targetBid=null,defaultTargetRoll=null,stealRolls=[]
}={}){
  if(!isObject(battleContext)||!isObject(battleContext.context))
    return {ok:false,handled:false,stage:'battle-enemy-steal-plan',reason:'battle-context-required'};
  if(!isObject(state)||!isObject(state.player)||!isObject(state.runtimeMeta))
    return {ok:false,handled:false,stage:'battle-enemy-steal-plan',reason:'persistent-state-required'};
  if(String(battleContext.context.mode??'').trim().toLowerCase()!=='battle'||int(battleContext.context.sourceMode)!==BATTLE_MODE_BATTLE)
    return {ok:false,handled:false,stage:'battle-enemy-steal-plan',reason:'battle-active-phase-required'};
  if(!Array.isArray(stealRolls))return {ok:false,handled:false,stage:'battle-enemy-steal-plan',reason:'steal-roll-array-required'};
  const actorLoc=locateEntry(battleContext,attackerBid);
  const actor=actorLoc?.entry;
  if(!actor||actorLoc.side!==1||String(actor.sourceType??'').toLowerCase()!=='enemy')
    return {ok:false,handled:false,stage:'battle-enemy-steal-plan',reason:'enemy-steal-attacker-required',attackerBid:int(attackerBid)};
  if(int(actor.sourceBattleCharMode)!==BATTLE_CHARMODE_C_OK||actor.isDie===true||int(actor.hp)!=null&&int(actor.hp)<=0)
    return {ok:false,handled:false,stage:'battle-enemy-steal-plan',reason:'enemy-steal-attacker-not-ready',attackerBid:actorLoc.bid};
  if(int(actor.battleCommands?.[0])!==BATTLE_COM_S_STEAL)
    return {ok:false,handled:false,stage:'battle-enemy-steal-plan',reason:'enemy-steal-command-required',attackerBid:actorLoc.bid,command:int(actor.battleCommands?.[0])};
  const skillSlot=int(actor.sourceEnemyStealSkillSlot);
  if(int(actor.sourceEnemyStealSkillId)!==140||skillSlot==null||
     int(actor.sourceEnemyPetSkills?.[skillSlot])!==140||
     actor.sourceEnemyPetSkillProfiles?.[skillSlot]?.functionName!=='PETSKILL_Steal')
    return {ok:false,handled:false,stage:'battle-enemy-steal-plan',reason:'enemy-steal-source-skill-binding-required',attackerBid:actorLoc.bid,skillSlot};

  const commandedTarget=int(actor.battleCommands?.[1]);
  if(targetBid!=null&&int(targetBid)!==commandedTarget)
    return {ok:false,handled:false,stage:'battle-enemy-steal-plan',reason:'enemy-steal-command-target-mismatch',attackerBid:actorLoc.bid,targetBid:int(targetBid),commandTarget:commandedTarget};
  const requestedTargetBid=commandedTarget;
  let finalTargetBid=requestedTargetBid;
  let target=locateEntry(battleContext,finalTargetBid);
  let targetAdjusted=false;
  let targetAdjustRoll=null;
  let targetAdjustCandidates=[];
  if(!target||target.side!==0||!eligibleTarget(target.entry)){
    targetAdjustCandidates=fallbackCandidates(battleContext,0);
    if(targetAdjustCandidates.length===0){
      if(stealRolls.length!==0)return {ok:false,handled:false,stage:'battle-enemy-steal-plan',reason:'steal-roll-count-mismatch',expected:0,actual:stealRolls.length,rngConsumed:{targetAdjust:0,steal:0,total:0}};
      return {
        ok:true,handled:true,stage:'battle-enemy-steal-plan-ready',format:BROWSER_BATTLE_ENEMY_STEAL_RUNTIME_FORMAT,
        action:ACTION_BATTLE_ENEMY_STEAL_PLAN,turn:int(battleContext.context.turn)??0,attackerBid:actorLoc.bid,
        requestedTargetBid,finalTargetBid:-1,targetAdjusted:true,targetResolved:false,defaultTargetRoll:null,
        stealRolls:[],outcome:'no-target',stolen:false,stealMode:null,goldBefore:null,goldRate:null,goldAmount:0,item:null,
        rngConsumed:{targetAdjust:0,steal:0,total:0},rngTrace:[],stateRevision:int(state.revision),
        battleContextMutation:false,persistentMutation:false,actorExitRequired:false,
        source:{repository:SOURCE_REPOSITORY,ref:SOURCE_REF,functions:['BATTLE_TargetAdjust','BATTLE_DefaultAttacker','BATTLE_Steal']}
      };
    }
    const fallback=int(defaultTargetRoll);
    if(fallback==null||fallback<0||fallback>=targetAdjustCandidates.length)
      return {ok:false,handled:false,stage:'battle-enemy-steal-plan',reason:'enemy-steal-default-target-rng-required-or-out-of-range',defaultTargetRoll:fallback,candidateCount:targetAdjustCandidates.length,min:0,max:targetAdjustCandidates.length-1};
    targetAdjustRoll=fallback;
    targetAdjusted=true;
    targetAdjustCandidates=targetAdjustCandidates.map(x=>x.bid);
    finalTargetBid=targetAdjustCandidates[fallback];
    target=locateEntry(battleContext,finalTargetBid);
  }
  const stateRevision=int(state.revision);
  if(stateRevision==null||stateRevision<0)
    return {ok:false,handled:false,stage:'battle-enemy-steal-plan',reason:'persistent-state-revision-invalid'};
  let cursor=0;
  const trace=[];
  if(targetAdjusted)trace.push({kind:'target-adjust',roll:targetAdjustRoll,min:0,max:targetAdjustCandidates.length-1});
  const first=nextRoll(stealRolls,cursor,1,100,'enemy-steal-success');
  if(!first.ok)return {...first,handled:false,stage:'battle-enemy-steal-plan',rngConsumed:{targetAdjust:targetAdjusted?1:0,steal:cursor,total:(targetAdjusted?1:0)+cursor}};
  cursor=first.cursor;
  trace.push({kind:'steal-success',roll:first.roll,min:1,max:100});
  const chance=String(target.entry.sourceType??'').toLowerCase()==='player'?50:0;
  let outcome='chance-failed',stolen=false,stealMode=null,goldBefore=null,goldRate=null,goldAmount=0,item=null;
  if(first.roll<chance){
    const branch=nextRoll(stealRolls,cursor,1,100,'enemy-steal-branch');
    if(!branch.ok)return {...branch,handled:false,stage:'battle-enemy-steal-plan',rngConsumed:{targetAdjust:targetAdjusted?1:0,steal:cursor,total:(targetAdjusted?1:0)+cursor}};
    cursor=branch.cursor;
    trace.push({kind:'steal-branch',roll:branch.roll,min:1,max:100});
    if(branch.roll<50){
      const gold=int(state.player.gold);
      if(gold==null||gold<0)return {ok:false,handled:false,stage:'battle-enemy-steal-plan',reason:'player-gold-runtime-invalid',rngConsumed:{targetAdjust:targetAdjusted?1:0,steal:cursor,total:(targetAdjusted?1:0)+cursor}};
      const rate=nextRoll(stealRolls,cursor,8,12,'enemy-steal-gold-rate');
      if(!rate.ok)return {...rate,handled:false,stage:'battle-enemy-steal-plan',rngConsumed:{targetAdjust:targetAdjusted?1:0,steal:cursor,total:(targetAdjusted?1:0)+cursor}};
      cursor=rate.cursor;
      trace.push({kind:'gold-rate',roll:rate.roll,min:8,max:12});
      const amount=Math.trunc(gold*rate.roll*0.01);
      goldBefore=gold;goldRate=rate.roll;goldAmount=amount;
      if(amount>0){outcome='stolen-gold';stolen=true;stealMode='gold';}
      else outcome='zero-gold';
    }else{
      const slots=state.inventory?.playerItemSlots;
      const instances=state.inventory?.itemRuntime?.slots;
      if(!Array.isArray(slots)||slots.length!==PLAYER_ITEM_SLOT_COUNT||!isObject(instances))
        return {ok:false,handled:false,stage:'battle-enemy-steal-plan',reason:'canonical-player-inventory-required',rngConsumed:{targetAdjust:targetAdjusted?1:0,steal:cursor,total:(targetAdjusted?1:0)+cursor}};
      const candidates=[];
      for(let slot=PLAYER_BACKPACK_START;slot<PLAYER_ITEM_SLOT_COUNT;slot++){
        const raw=slots[slot];
        if(raw==null)continue;
        const index=int(raw);
        if(index==null||index<0)return {ok:false,handled:false,stage:'battle-enemy-steal-plan',reason:'player-item-slot-reference-invalid',slot,raw};
        const instance=instances[String(index)];
        if(!isObject(instance))return {ok:false,handled:false,stage:'battle-enemy-steal-plan',reason:'player-item-instance-missing',slot,existingIndex:index};
        if(instance.use!==true)continue;
        if(instance.owner!=null&&String(instance.owner)!=='player')
          return {ok:false,handled:false,stage:'battle-enemy-steal-plan',reason:'player-item-owner-mismatch',slot,existingIndex:index,owner:instance.owner};
        const itemId=int(instance.itemId);
        const pile=int(instance.pile??1);
        if(itemId==null||itemId<0||pile==null||pile<1)
          return {ok:false,handled:false,stage:'battle-enemy-steal-plan',reason:'player-item-instance-invalid',slot,existingIndex:index,itemId:instance.itemId??null,pile:instance.pile??null};
        candidates.push({slot,existingIndex:index,itemId,pile});
      }
      if(candidates.length===0){
        outcome='inventory-empty';
      }else{
        const itemRoll=nextRoll(stealRolls,cursor,0,candidates.length-1,'enemy-steal-item-index');
        if(!itemRoll.ok)return {...itemRoll,handled:false,stage:'battle-enemy-steal-plan',rngConsumed:{targetAdjust:targetAdjusted?1:0,steal:cursor,total:(targetAdjusted?1:0)+cursor}};
        cursor=itemRoll.cursor;
        trace.push({kind:'item-index',roll:itemRoll.roll,min:0,max:candidates.length-1});
        item=clone(candidates[itemRoll.roll]);
        outcome='stolen-item';stolen=true;stealMode='item';
      }
    }
  }
  if(cursor!==stealRolls.length)return {ok:false,handled:false,stage:'battle-enemy-steal-plan',reason:'steal-roll-count-mismatch',expected:cursor,actual:stealRolls.length,rngConsumed:{targetAdjust:targetAdjusted?1:0,steal:cursor,total:(targetAdjusted?1:0)+cursor}};
  return {
    ok:true,handled:true,stage:'battle-enemy-steal-plan-ready',
    format:BROWSER_BATTLE_ENEMY_STEAL_RUNTIME_FORMAT,action:ACTION_BATTLE_ENEMY_STEAL_PLAN,
    turn:int(battleContext.context.turn)??0,attackerBid:actorLoc.bid,requestedTargetBid,finalTargetBid,
    targetAdjusted,targetResolved:true,defaultTargetRoll:targetAdjustRoll,
    stealRolls:stealRolls.slice(0,cursor),
    outcome,stolen,stealMode,goldBefore,goldRate,goldAmount,item,
    rngConsumed:{targetAdjust:targetAdjusted?1:0,steal:cursor,total:(targetAdjusted?1:0)+cursor},
    rngTrace:trace,stateRevision,
    battleContextMutation:false,persistentMutation:false,actorExitRequired:stolen,
    source:{repository:SOURCE_REPOSITORY,ref:SOURCE_REF,functions:['BATTLE_TargetAdjust','BATTLE_DefaultAttacker','BATTLE_Steal']}
  };
}

function commitEnemySteal(battleContext,state,{
  plan=null,transactionId=null,expectedRevision=null,now=()=>new Date().toISOString()
}={}){
  if(!isObject(state)||!isObject(state.runtimeMeta))
    return {ok:false,handled:false,stage:'battle-enemy-steal-commit',reason:'persistent-state-required',state:clone(state)};
  const tx=String(transactionId??'').trim();
  if(!tx||tx.length>128)
    return {ok:false,handled:false,stage:'battle-enemy-steal-commit',reason:'transaction-id-required',state:clone(state)};
  const id=planIdentity(plan);
  const persistentBucket=isObject(state.runtimeMeta.battleStealTransactions)?state.runtimeMeta.battleStealTransactions:{};
  const persistentPrior=persistentBucket[tx];
  if(persistentPrior){
    if(plan&&persistentPrior.planIdentity!==id)
      return {ok:false,handled:false,stage:'battle-enemy-steal-commit',reason:'enemy-steal-transaction-conflict',transactionId:tx,state:clone(state),battleContext:battleContext?clone(battleContext):null};
    return {ok:true,handled:true,stage:'battle-enemy-steal-commit-idempotent',format:BROWSER_BATTLE_ENEMY_STEAL_RUNTIME_FORMAT,
      action:ACTION_BATTLE_ENEMY_STEAL_COMMIT,transactionId:tx,idempotent:true,applied:false,stolen:true,
      persistentMutation:false,battleContextMutation:false,battleContext:battleContext?clone(battleContext):null,state:clone(state),
      sourceResult:clone(persistentPrior.result??{})};
  }
  if(!isObject(battleContext)||!isObject(battleContext.context))
    return {ok:false,handled:false,stage:'battle-enemy-steal-commit',reason:'battle-context-required',state:clone(state)};
  const ctx=battleContext.context;
  const contextPrior=ctx.enemyStealAttemptReceipts?.[tx];
  if(contextPrior){
    if(contextPrior.planIdentity!==id)
      return {ok:false,handled:false,stage:'battle-enemy-steal-commit',reason:'enemy-steal-transaction-conflict',transactionId:tx,state:clone(state),battleContext:clone(battleContext)};
    return {ok:true,handled:true,stage:'battle-enemy-steal-commit-idempotent',format:BROWSER_BATTLE_ENEMY_STEAL_RUNTIME_FORMAT,
      action:ACTION_BATTLE_ENEMY_STEAL_COMMIT,transactionId:tx,idempotent:true,applied:false,
      stolen:contextPrior.stolen===true,persistentMutation:false,battleContextMutation:false,battleContext:clone(battleContext),state:clone(state),
      outcome:contextPrior.outcome??null,sourceResult:clone(contextPrior)};
  }
  if(!isObject(plan)||plan.ok!==true||plan.stage!=='battle-enemy-steal-plan-ready'||
     plan.format!==BROWSER_BATTLE_ENEMY_STEAL_RUNTIME_FORMAT||plan.action!==ACTION_BATTLE_ENEMY_STEAL_PLAN)
    return {ok:false,handled:false,stage:'battle-enemy-steal-commit',reason:'enemy-steal-plan-required',state:clone(state),battleContext:clone(battleContext)};
  const currentRevision=int(state.revision);
  if(currentRevision==null||currentRevision<0)
    return {ok:false,handled:false,stage:'battle-enemy-steal-commit',reason:'persistent-state-revision-invalid',state:clone(state),battleContext:clone(battleContext)};
  if(expectedRevision!=null&&currentRevision!==int(expectedRevision))
    return {ok:false,handled:false,stage:'battle-enemy-steal-commit',reason:'revision-conflict',currentRevision,expectedRevision:int(expectedRevision),state:clone(state),battleContext:clone(battleContext)};
  if(currentRevision!==int(plan.stateRevision))
    return {ok:false,handled:false,stage:'battle-enemy-steal-commit',reason:'enemy-steal-stale-plan',currentRevision,planRevision:int(plan.stateRevision),state:clone(state),battleContext:clone(battleContext)};
  const recomputed=planEnemySteal(battleContext,state,{
    attackerBid:plan.attackerBid,targetBid:plan.requestedTargetBid,
    defaultTargetRoll:plan.defaultTargetRoll,stealRolls:plan.stealRolls
  });
  if(!recomputed.ok||planIdentity(recomputed)!==id)
    return {ok:false,handled:false,stage:'battle-enemy-steal-commit',reason:'enemy-steal-plan-snapshot-mismatch',
      detail:recomputed.ok?null:recomputed.reason,state:clone(state),battleContext:clone(battleContext)};
  const turn=int(plan.turn);
  const actorKey=String(plan.attackerBid);
  const actorPrior=ctx.enemyStealActorReceipts?.[actorKey];
  if(actorPrior&&int(actorPrior.turn)===turn)
    return {ok:false,handled:false,stage:'battle-enemy-steal-commit',reason:'enemy-steal-actor-turn-already-resolved',
      attackerBid:int(plan.attackerBid),turn,priorTransactionId:actorPrior.transactionId??null,state:clone(state),battleContext:clone(battleContext)};
  const nextContext=clone(battleContext);
  const actorLoc=locateEntry(nextContext,plan.attackerBid);
  if(!actorLoc?.entry)
    return {ok:false,handled:false,stage:'battle-enemy-steal-commit',reason:'enemy-steal-attacker-missing',attackerBid:int(plan.attackerBid),state:clone(state),battleContext:clone(battleContext)};
  const commands=Array.isArray(actorLoc.entry.battleCommands)?actorLoc.entry.battleCommands.slice():[-1,-1,-1];
  if(plan.targetAdjusted)commands[1]=int(plan.finalTargetBid)??-1;
  actorLoc.entry.battleCommands=commands;
  const after=clone(state);
  let persistentMutation=false;
  let goldBefore=null,goldAfter=null,stolenItem=null;
  if(plan.stolen===true){
    if(plan.stealMode==='gold'){
      const gold=int(after.player.gold);
      const amount=int(plan.goldAmount);
      if(gold==null||amount==null||amount<=0||amount>gold)
        return {ok:false,handled:false,stage:'battle-enemy-steal-commit',reason:'enemy-steal-gold-preimage-mismatch',state:clone(state),battleContext:clone(battleContext)};
      goldBefore=gold;goldAfter=gold-amount;after.player.gold=goldAfter;
    }else if(plan.stealMode==='item'){
      const row=plan.item;
      const slot=int(row?.slot),existingIndex=int(row?.existingIndex),itemId=int(row?.itemId),pile=int(row?.pile);
      if(slot==null||slot<PLAYER_BACKPACK_START||slot>=PLAYER_ITEM_SLOT_COUNT||existingIndex==null||existingIndex<0||itemId==null||pile==null||pile<1||
         int(after.inventory?.playerItemSlots?.[slot])!==existingIndex||
         !isObject(after.inventory?.itemRuntime?.slots)||
         !isObject(after.inventory.itemRuntime.slots[String(existingIndex)]))
        return {ok:false,handled:false,stage:'battle-enemy-steal-commit',reason:'enemy-steal-item-preimage-mismatch',state:clone(state),battleContext:clone(battleContext)};
      const live=after.inventory.itemRuntime.slots[String(existingIndex)];
      if(live.use!==true||(live.owner!=null&&String(live.owner)!=='player')||
         int(live.itemId)!==itemId||Math.max(1,int(live.pile??1)??1)!==pile)
        return {ok:false,handled:false,stage:'battle-enemy-steal-commit',reason:'enemy-steal-item-snapshot-mismatch',state:clone(state),battleContext:clone(battleContext)};
      after.inventory.playerItemSlots[slot]=null;
      delete after.inventory.itemRuntime.slots[String(existingIndex)];
      const pileAfter=Math.max(0,(int(after.inventory.piles?.[String(itemId)])??0)-pile);
      if(pileAfter>0)after.inventory.piles[String(itemId)]=pileAfter;
      else delete after.inventory.piles[String(itemId)];
      stolenItem={slot,existingIndex,itemId,pile};
    }else{
      return {ok:false,handled:false,stage:'battle-enemy-steal-commit',reason:'enemy-steal-mode-invalid',state:clone(state),battleContext:clone(battleContext)};
    }
    const timestamp=String(typeof now==='function'?now():now);
    after.runtimeMeta.battleStealTransactions=isObject(after.runtimeMeta.battleStealTransactions)?after.runtimeMeta.battleStealTransactions:{};
    persistentMutation=true;
    after.runtimeMeta.updatedAt=timestamp;
    after.revision=currentRevision+1;
    after.runtimeMeta.battleStealTransactions[tx]={
      transactionId:tx,planIdentity:id,turn,attackerBid:int(plan.attackerBid),targetBid:int(plan.finalTargetBid),
      outcome:plan.outcome,stealMode:plan.stealMode,goldBefore,goldAfter,stolenItem:clone(stolenItem),
      committedAt:timestamp,revisionBefore:currentRevision,revisionAfter:after.revision
    };
  }
  const outcomeRecord={
    transactionId:tx,planIdentity:id,turn,attackerBid:int(plan.attackerBid),requestedTargetBid:int(plan.requestedTargetBid),
    finalTargetBid:int(plan.finalTargetBid),outcome:plan.outcome,stolen:plan.stolen===true,stealMode:plan.stealMode,
    goldAmount:int(plan.goldAmount)??0,item:plan.item?clone(plan.item):null,actorExited:plan.stolen===true,
    persistentMutation,rngConsumed:clone(plan.rngConsumed)
  };
  nextContext.context.enemyStealAttemptReceipts=isObject(nextContext.context.enemyStealAttemptReceipts)?nextContext.context.enemyStealAttemptReceipts:{};
  nextContext.context.enemyStealAttemptReceipts[tx]=clone(outcomeRecord);
  nextContext.context.enemyStealActorReceipts=isObject(nextContext.context.enemyStealActorReceipts)?nextContext.context.enemyStealActorReceipts:{};
  nextContext.context.enemyStealActorReceipts[actorKey]={
    turn,transactionId:tx,outcome:plan.outcome
  };
  let exitedEntry=null;
  if(plan.stolen===true){
    const side=nextContext.context.sides.find(s=>int(s?.side)===1);
    if(!side||!Array.isArray(side.entries)||!side.entries[actorLoc.slot])
      return {ok:false,handled:false,stage:'battle-enemy-steal-commit',reason:'enemy-steal-exit-entry-missing',state:clone(state),battleContext:clone(battleContext)};
    exitedEntry=clone(side.entries[actorLoc.slot]);
    side.entries[actorLoc.slot]=null;
  }
  return {
    ok:true,handled:true,stage:'battle-enemy-steal-committed',format:BROWSER_BATTLE_ENEMY_STEAL_RUNTIME_FORMAT,
    action:ACTION_BATTLE_ENEMY_STEAL_COMMIT,transactionId:tx,idempotent:false,applied:plan.stolen===true,
    outcome:plan.outcome,stolen:plan.stolen===true,stealMode:plan.stealMode,requestedTargetBid:int(plan.requestedTargetBid),
    targetBid:int(plan.finalTargetBid),targetAdjusted:plan.targetAdjusted===true,
    goldBefore,goldAfter,goldAmount:int(plan.goldAmount)??0,stolenItem,
    attackerBid:int(plan.attackerBid),actorExited:plan.stolen===true,exitedEnemy:exitedEntry,
    rngConsumed:clone(plan.rngConsumed),battleContextMutation:true,persistentMutation,
    damageExecuted:false,rewardMutation:false,deathCredit:false,
    battleContext:nextContext,state:after
  };
}

function createBrowserBattleEnemyStealRuntime(){
  return {ok:true,format:BROWSER_BATTLE_ENEMY_STEAL_RUNTIME_FORMAT,
    plan:planEnemySteal,commit:commitEnemySteal};
}
export {
  BROWSER_BATTLE_ENEMY_STEAL_RUNTIME_FORMAT,
  ACTION_BATTLE_ENEMY_STEAL_PLAN,ACTION_BATTLE_ENEMY_STEAL_COMMIT,
  BATTLE_COM_S_STEAL,planEnemySteal,commitEnemySteal,createBrowserBattleEnemyStealRuntime
};
