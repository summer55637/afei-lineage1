#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createBrowserBattleDexRuntime, resolveBattleDex } from '../src/stoneage_browser_battle_dex_runtime.mjs';
import { createBrowserBattleRidePetAdjustRuntime } from '../src/stoneage_browser_battle_ride_pet_adjust_runtime.mjs';
import { createBrowserBattleRoundRuntime } from '../src/stoneage_browser_battle_round_runtime.mjs';

const dex=createBrowserBattleDexRuntime();
const ride=createBrowserBattleRidePetAdjustRuntime();
assert.equal(dex.ok,true);
assert.equal(ride.ok,true);

const noPet=resolveBattleDex({quick:100,command:'attack',roll:5});
assert.equal(noPet.ok,true,JSON.stringify(noPet));
assert.equal(noPet.work,120);
assert.equal(noPet.randomUpper,36);
assert.equal(noPet.dex,115);
assert.equal(noPet.rngConsumed,1);

const rq=ride.adjust({
  character:{value:100},
  pet:{value:80},
  work:'quick',
  action:'attack',
  throwWeapon:false
});
assert.equal(rq.ok,true,JSON.stringify(rq));
assert.equal(rq.value,84);

const withRide=resolveBattleDex({
  quick:100,
  command:'attack',
  ridePetQuickAdjustment:rq,
  roll:5
});
assert.equal(withRide.ok,true,JSON.stringify(withRide));
assert.equal(withRide.work,104);
assert.equal(withRide.randomUpper,31);
assert.equal(withRide.dex,99);
assert.equal(withRide.rngConsumed,1);

const e=(bid,quick,command,target)=>({
  bid,battleSide:bid>=10?1:0,battleSlot:bid>=10?bid-10:bid,
  sourceType:bid>=10?'enemy':(bid===5?'pet':'player'),
  hp:100,maxHp:100,quick,fixDex:quick,fixVital:10,attackPower:30,defencePower:10,fixStr:30,fixTgh:10,
  level:10,fixLuck:0,battleFlg:0,battleCommands:[command,target,-1],
  sourceBattleCharMode:3,battleMode:'c_ok',isDie:false,dead:false,
  isAttacked:1,elements:{fire:0,water:0,earth:0,wind:0},
  damageVanish:0,damageAbsorb:0,damageReflect:0,damageReact:0
});

const context={format:'stoneage-browser-battle-context-runtime-v1',context:{
  mode:'battle',sourceMode:2,turn:0,damageCommitRevision:0,fieldAtt:4,attPow:0,
  sides:[
    {side:0,type:0,entries:[
      e(0,100,1,10),null,null,null,null,
      {...e(5,80,0,-1),sourceType:'pet',hp:0}
    ]},
    {side:1,type:1,entries:[e(10,100,0,-1),...Array(9).fill(null)]}
  ]
}};

const round=createBrowserBattleRoundRuntime({
  attackCountRuntime:{ok:true,resolve:()=>({ok:true,attackCount:1,rngConsumed:0})},
  targetListRuntime:{ok:true,resolve:()=>({ok:true,targets:[]})},
  attackSequenceRuntime:{ok:true,resolve:async()=>({ok:true,context:context.context,executedHitCount:0,damageExecuted:false,hits:[]})},
  attackPreflightRuntime:{ok:true},
  attackSeqPreludeRuntime:{ok:true},
  damagePlanRuntime:{ok:true},
  criticalDamageRuntime:{ok:true},
  damageReactRuntime:{ok:true},
  damageReactCommitRuntime:{ok:true},
  damageDeathChainRuntime:{ok:true},
  counterChainRuntime:{ok:true},
  statusRuntime:{ok:true,process:()=>({ok:true,battleContext:context.context,skip:false})},
  endRuntime:{ok:true,plan:()=>({ok:true,finished:false,winnerSide:null,finishReason:null})},
  dexRuntime:dex,
  ridePetAdjustRuntime:ride
});
assert.equal(round.ok,true);

const result=await round.resolve(context,{
  roundId:'v459-dex',
  counterPolicy:'defer',
  attackRolls:[{attackerBid:0,weaponType:'none',throwWeapon:false}],
  dexRollByBid:{0:0,10:20},
  ridePetBidByParticipantBid:{0:5}
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.deepEqual(result.dexPrimes.map(x=>x.actorBid),[0,10]);
assert.equal(result.dexPrimes.find(x=>x.actorBid===0).dex,104);
assert.equal(result.dexPrimes.find(x=>x.actorBid===10).dex,100);
assert.deepEqual(result.order,[0,10]);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v459-browser-battle-dex-v1',
  noRide:{work:noPet.work,randomUpper:noPet.randomUpper,dex:noPet.dex},
  ridePetQuick:{adjustedQuick:rq.value,work:withRide.work,randomUpper:withRide.randomUpper,dex:withRide.dex},
  roundOrder:result.order,
  roundDex:result.dexPrimes.map(x=>({actorBid:x.actorBid,dex:x.dex,rngConsumed:x.rngConsumed})),
  persistentMutation:false
},null,2));
