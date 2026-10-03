#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  createBrowserBattleDamageReactCommitRuntime
} from '../src/stoneage_browser_battle_damage_react_commit_runtime.mjs';
import {
  createBrowserBattleDamageReactRuntime,
  BATTLE_MD_VANISH,
  BATTLE_MD_ABSROB,
  BATTLE_MD_REFLEC,
  BATTLE_MD_TRAP,
  BATTLE_MD_ACUPUNCTURE
} from '../src/stoneage_browser_battle_damage_react_runtime.mjs';

const entry=(bid,sourceType)=>({
  bid,
  battleSlot:bid>=10?bid-10:bid,
  battleSide:bid>=10?1:0,
  sourceType,
  hp:100,maxHp:100,
  fixDex:100,quick:100,fixVital:1,
  attackPower:30,defencePower:1,fixStr:30,fixTgh:1,
  battleFlg:0,battleCommands:[1,bid>=10?0:10,-1],
  sourceBattleCharMode:3,battleMode:'c_ok',
  isDie:false,deadCount:0,workUltimate:0,battleOutcomeFlags:0,
  elements:{fire:0,water:0,earth:0,wind:0}
});

const base={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'battle',sourceMode:2,turn:1,damageCommitRevision:0,
    sides:[
      {side:0,type:0,entries:[entry(0,'player'),...Array(9).fill(null)]},
      {side:1,type:1,entries:[entry(10,'enemy'),...Array(9).fill(null)]}
    ]
  }
};
const planRuntime=createBrowserBattleDamageReactRuntime();
const commitRuntime=createBrowserBattleDamageReactCommitRuntime();
assert.equal(commitRuntime.ok,true);

const makePlan=(reactionCode,extra={})=>{
  const ctx=JSON.parse(JSON.stringify(base));
  if(reactionCode===BATTLE_MD_VANISH)ctx.context.sides[1].entries[0].damageVanish=1;
  if(reactionCode===BATTLE_MD_ABSROB)ctx.context.sides[1].entries[0].damageAbsorb=1;
  if(reactionCode===BATTLE_MD_REFLEC)ctx.context.sides[1].entries[0].damageReflect=1;
  if(reactionCode===BATTLE_MD_TRAP){
    ctx.context.sides[1].entries[0].trap=1;
    ctx.context.sides[1].entries[0].modTrap=20;
  }
  if(reactionCode===BATTLE_MD_ACUPUNCTURE)ctx.context.sides[1].entries[0].acupuncture=1;
  const options={
    attackerBid:0,targetBid:10,damage:20,weaponType:'none',
    attackerRidePet:false,defenderRidePet:false,
    ...extra
  };
  if(reactionCode===BATTLE_MD_TRAP)options.modTrap=20;
  const plan=planRuntime.plan(ctx,options);
  assert.equal(plan.ok,true,JSON.stringify(plan));
  assert.equal(plan.reaction.code,reactionCode,JSON.stringify(plan));
  return {ctx,plan};
};

{
  const {ctx,plan}=makePlan(BATTLE_MD_VANISH);
  const out=commitRuntime.commit(ctx,{damageReactPlan:plan,transactionId:'v448-vanish',expectedDamageRevision:0});
  assert.equal(out.ok,true,JSON.stringify(out));
  assert.equal(out.damageExecuted,false);
  assert.equal(out.hpMutation,false);
  assert.equal(out.stateConsumption[0].field,'damageVanish');
  assert.equal(out.battleContext.context.sides[1].entries[0].damageVanish,0);
  assert.equal(out.battleContext.context.sides[1].entries[0].hp,100);
}

{
  const ctx=JSON.parse(JSON.stringify(base));
  ctx.context.sides[1].entries[0].hp=80;
  ctx.context.sides[1].entries[0].damageAbsorb=1;
  const plan=planRuntime.plan(ctx,{attackerBid:0,targetBid:10,damage:20,weaponType:'none'});
  assert.equal(plan.ok,true,JSON.stringify(plan));
  const out=commitRuntime.commit(ctx,{damageReactPlan:plan,transactionId:'v448-absorb',expectedDamageRevision:0});
  assert.equal(out.ok,true,JSON.stringify(out));
  assert.equal(out.battleContext.context.sides[1].entries[0].hp,100);
  assert.equal(out.battleContext.context.sides[1].entries[0].damageAbsorb,0);
}

{
  const {ctx,plan}=makePlan(BATTLE_MD_REFLEC);
  const out=commitRuntime.commit(ctx,{damageReactPlan:plan,transactionId:'v448-reflect',expectedDamageRevision:0});
  assert.equal(out.ok,true,JSON.stringify(out));
  assert.equal(out.battleContext.context.sides[0].entries[0].hp,80);
  assert.equal(out.battleContext.context.sides[1].entries[0].hp,100);
  assert.equal(out.battleContext.context.sides[1].damageReflect??0,0);
}

{
  const {ctx,plan}=makePlan(BATTLE_MD_TRAP);
  const out=commitRuntime.commit(ctx,{damageReactPlan:plan,transactionId:'v448-trap',expectedDamageRevision:0});
  assert.equal(out.ok,true,JSON.stringify(out));
  assert.equal(out.battleContext.context.sides[0].entries[0].hp,80);
  assert.equal(out.battleContext.context.sides[1].entries[0].trap??0,0);
  assert.equal(out.battleContext.context.sides[1].entries[0].modTrap??0,0);
}

{
  const {ctx,plan}=makePlan(BATTLE_MD_ACUPUNCTURE);
  const out=commitRuntime.commit(ctx,{damageReactPlan:plan,transactionId:'v448-acupuncture',expectedDamageRevision:0});
  assert.equal(out.ok,true,JSON.stringify(out));
  assert.equal(out.battleContext.context.sides[1].entries[0].hp,80);
  assert.equal(out.battleContext.context.sides[0].entries[0].hp,90);
  assert.equal(out.battleContext.context.sides[1].entries[0].acupuncture??0,0);
}

const conflictCtx=makePlan(BATTLE_MD_REFLEC);
const first=commitRuntime.commit(conflictCtx.ctx,{damageReactPlan:conflictCtx.plan,transactionId:'v448-conflict',expectedDamageRevision:0});
assert.equal(first.ok,true,JSON.stringify(first));
const secondPlan={...conflictCtx.plan,requestedDamage:21};
const conflict=commitRuntime.commit(first.battleContext,{damageReactPlan:secondPlan,transactionId:'v448-conflict',expectedDamageRevision:1});
assert.equal(conflict.ok,false);
assert.equal(conflict.reason,'damage-react-transaction-conflict');

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v448-browser-battle-damage-react-commit-v1',
  reactions:['vanish','absorb','reflect','trap','acupuncture'],
  transientOnly:true,
  transactionConflictGuard:true
},null,2));
