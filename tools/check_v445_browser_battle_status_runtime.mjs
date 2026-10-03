#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  BATTLE_COM_ATTACK,
  battleStatusActive,
  battleStatusApply,
  battleStatusApplyRaw,
  battleStatusCanMove,
  battleStatusPoisonDamage,
  processBattleStatusTurn,
  applyStatusChangeHit
} from '../src/stoneage_browser_battle_status_runtime.mjs';

function makeContext(status={},overrides={}){
  const player={
    bid:0,battleSlot:0,battleSide:0,sourceType:'player',
    hp:100,maxHp:100,quick:10,level:10,
    battleCommands:[0,-1,-1],battleStatus:{...status},
    statusRawStats:{vital:600,str:600,tgh:600,dex:600},
    ...overrides.player
  };
  const pet={bid:5,battleSlot:5,battleSide:0,sourceType:'pet',hp:100,maxHp:100,level:10,battleCommands:[0,-1,-1],battleStatus:{},statusRawStats:{vital:2000,str:2000,tgh:2000,dex:2000},...overrides.pet};
  const enemy={bid:10,battleSlot:0,battleSide:1,sourceType:'enemy',hp:100,maxHp:100,level:10,battleCommands:[0,-1,-1],battleStatus:{},statusRawStats:{vital:2500,str:2500,tgh:2500,dex:2500},...overrides.enemy};
  return {format:'stoneage-browser-battle-context-runtime-v1',context:{mode:'battle',sourceMode:2,turn:0,sides:[
    {side:0,type:0,entries:[player,null,null,null,null,pet,null,null,null,null]},
    {side:1,type:1,entries:[enemy,null,null,null,null,null,null,null,null,null]}
  ]}};
}

assert.equal(battleStatusCanMove({battleStatus:{paralysis:1}}),false);
assert.equal(battleStatusCanMove({battleStatus:{stone:1}}),false);
assert.equal(battleStatusCanMove({battleStatus:{sleep:1}}),false);
assert.equal(battleStatusCanMove({battleStatus:{drunk:1}}),true);

{
  const entry={hp:100,statusRawStats:{vital:600,str:600,tgh:600,dex:600},battleStatus:{}};
  const damage=battleStatusPoisonDamage(entry);
  assert.equal(damage,1);
  assert.equal(entry.hp,99);
}

{
  const ctx=makeContext({poison:3});
  const r=processBattleStatusTurn(ctx,{battleBid:0});
  assert.equal(r.ok,true);
  assert.equal(r.status,'poison');
  assert.equal(r.turnsAfter,2);
  assert.equal(r.poisonTick,true);
  assert.equal(r.poisonDamage,1);
  assert.equal(r.battleContext.sides[0].entries[0].hp,99);
}

{
  const ctx=makeContext({poison:1});
  const r=processBattleStatusTurn(ctx,{battleBid:0});
  assert.equal(r.expired,true);
  assert.equal(r.poisonTick,false);
  assert.equal(r.battleContext.sides[0].entries[0].battleStatus.poison,undefined);
  assert.equal(r.battleContext.sides[0].entries[0].hp,100);
}

for(const type of ['paralysis','sleep','stone']){
  const ctx=makeContext({[type]:2});
  let r=processBattleStatusTurn(ctx,{battleBid:0});
  assert.equal(r.skip,true,type);
  assert.equal(r.turnsAfter,1,type);
  r=processBattleStatusTurn({format:ctx.format,context:r.battleContext},{battleBid:0});
  assert.equal(r.skip,true,type+' expiry still blocks this turn');
  assert.equal(r.expired,true,type);
  assert.equal(r.battleContext.sides[0].entries[0].battleStatus[type],undefined,type);
}

{
  const ctx=makeContext({drunk:1},{player:{quick:12}});
  const r=processBattleStatusTurn(ctx,{battleBid:0});
  assert.equal(r.expired,true);
  assert.equal(r.drunkReleaseBoost,true);
  assert.equal(r.drunkReleaseMode,'no-ride-quick-double');
  assert.equal(r.battleContext.sides[0].entries[0].quick,24);
}

{
  const ctx=makeContext({confusion:2});
  const rolls=[50,0,0];
  const randomInt=()=>rolls.shift();
  const r=processBattleStatusTurn(ctx,{battleBid:0,randomInt});
  assert.equal(r.confusionForcedAttack,true);
  assert.equal(r.confusionTargetBid,5);
  assert.equal(r.battleContext.sides[0].entries[0].battleCommands[0],BATTLE_COM_ATTACK);
  assert.equal(r.battleContext.sides[0].entries[0].battleCommands[1],5);
  assert.equal(r.rngConsumedCount,3);
}

{
  const ctx=makeContext({confusion:2});
  const r=processBattleStatusTurn(ctx,{battleBid:0,randomInt:()=>90});
  assert.equal(r.confusionForcedAttack,false);
  assert.equal(r.rngConsumedCount,1);
}

{
  const target={hp:100,level:10,statusRawStats:{vital:2500,str:2500,tgh:2500,dex:2500},battleStatus:{}};
  const attacker={level:10,fixedLuck:0};
  const result=applyStatusChangeHit({attacker,target,type:'sleep',turns:3,damage:10,randomInt:()=>1});
  assert.equal(result.applied,true);
  assert.equal(result.storedTurns,4);
  assert.equal(target.battleStatus.sleep,4);
}

{
  const target={hp:100,level:10,statusRawStats:{vital:2500,str:2500,tgh:2500,dex:2500},battleStatus:{}};
  const r=battleStatusApplyRaw(target,'stone',3);
  assert.equal(r.applied,true);
  assert.equal(target.battleStatus.stone,3);
  assert.equal(battleStatusActive(target,'stone'),true);
  assert.equal(battleStatusApply(target,'sleep',3).applied,false);
}

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v445-browser-battle-status-runtime',
  statuses:['poison','paralysis','sleep','stone','drunk','confusion'],
  sourceOrder:'BATTLE_StatusSeq before actor command',
  poisoning:'nonlethal fixed-C damage formula',
  confusion:'80% forced attack with source slot probing',
  drunkExpiry:'quick double without ride; explicit ride quick add when supplied',
  persistentMutation:false
},null,2));
