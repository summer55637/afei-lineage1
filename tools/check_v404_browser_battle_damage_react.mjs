#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  BATTLE_MD_ABSROB,
  BATTLE_MD_ACUPUNCTURE,
  BATTLE_MD_REFLEC,
  BATTLE_MD_TRAP,
  BATTLE_MD_VANISH,
  buildReactionPlan
} from '../src/stoneage_browser_battle_damage_react_runtime.mjs';

const entry=(bid,side,overrides={})=>({
  bid,
  battleSlot:bid>=10?bid-10:bid,
  battleSide:side,
  sourceType:side===0?'player':'enemy',
  hp:100,
  defencePower:20,
  damageVanish:0,
  damageAbsorb:0,
  damageReflect:0,
  battleStatus:{},
  ...overrides
});

const ctx={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{sides:[
    {side:0,type:0,entries:Array(10).fill(null)},
    {side:1,type:1,entries:Array(10).fill(null)}
  ]}
};
ctx.context.sides[0].entries[0]=entry(0,0,{defencePower:20});
ctx.context.sides[1].entries[0]=entry(10,1,{defencePower:30});

let result=buildReactionPlan(ctx,{attackerBid:0,targetBid:10,damage:50});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.reaction.code,0);
assert.equal(result.defenderDamage,50);
assert.equal(result.attackerDamage,0);
assert.equal(result.hpMutation,false);
assert.equal(result.rngConsumed,0);

const vanish=structuredClone(ctx);
vanish.context.sides[1].entries[0].damageVanish=1;
result=buildReactionPlan(vanish,{attackerBid:0,targetBid:10,damage:50});
assert.equal(result.reaction.code,BATTLE_MD_VANISH);
assert.equal(result.defenderDamage,0);
assert.equal(result.stateConsumption[0].field,'damageVanish');

const absorb=structuredClone(ctx);
absorb.context.sides[1].entries[0].damageAbsorb=1;
result=buildReactionPlan(absorb,{attackerBid:0,targetBid:10,damage:50});
assert.equal(result.reaction.code,BATTLE_MD_ABSROB);
assert.equal(result.defenderHeal,50);

const reflect=structuredClone(ctx);
reflect.context.sides[1].entries[0].damageReflect=1;
result=buildReactionPlan(reflect,{attackerBid:0,targetBid:10,damage:50,weaponType:'none'});
assert.equal(result.reaction.code,BATTLE_MD_REFLEC);
assert.equal(result.redirected,true);
assert.equal(result.attackerDamage,50);

const throwReflect=buildReactionPlan(reflect,{attackerBid:0,targetBid:10,damage:50,weaponType:'bow',throwWeapon:true});
assert.equal(throwReflect.reaction.code,0);
assert.deepEqual(throwReflect.reaction.skippedByWeapon,['reflect']);

const trap=structuredClone(ctx);
trap.context.sides[1].entries[0].battleStatus.trap=1;
result=buildReactionPlan(trap,{attackerBid:0,targetBid:10,damage:50,modTrap:17});
assert.equal(result.reaction.code,BATTLE_MD_TRAP);
assert.equal(result.attackerDamage,17);
assert.deepEqual(result.stateConsumption.map(x=>x.field),['trap','modTrap']);

const acupuncture=structuredClone(ctx);
acupuncture.context.sides[1].entries[0].battleStatus.acupuncture=1;
result=buildReactionPlan(acupuncture,{attackerBid:0,targetBid:10,damage:5});
assert.equal(result.reaction.code,BATTLE_MD_ACUPUNCTURE);
assert.equal(result.requestedDamage,6);
assert.equal(result.defenderDamage,6);
assert.equal(result.attackerDamage,3);

const priority=structuredClone(ctx);
priority.context.sides[1].entries[0].damageVanish=1;
priority.context.sides[1].entries[0].damageAbsorb=1;
priority.context.sides[1].entries[0].damageReflect=1;
priority.context.sides[1].entries[0].battleStatus.trap=1;
result=buildReactionPlan(priority,{attackerBid:0,targetBid:10,damage:50});
assert.equal(result.reaction.code,BATTLE_MD_VANISH);
assert.equal(result.reaction.priority,1);

const badTrap=buildReactionPlan(trap,{attackerBid:0,targetBid:10,damage:50,modTrap:null});
assert.equal(badTrap.ok,false);
assert.equal(badTrap.reason,'trap-mod-damage-required');

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v404-browser-battle-damage-react-v1',
  priority:['VANISH','ABSORB','REFLECT','TRAP','ACUPUNCTURE'],
  throwWeaponBlocks:['REFLECT','TRAP','ACUPUNCTURE'],
  hpMutation:false,
  persistentMutation:false
},null,2));
