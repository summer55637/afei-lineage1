#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createBrowserBattleEnemyExpRuntime, resolveEnemyExp } from '../src/stoneage_browser_battle_enemy_exp_runtime.mjs';

const runtime=createBrowserBattleEnemyExpRuntime();
assert.equal(runtime.ok,true);

const direct=resolveEnemyExp({sourceEnemyExp:100});
assert.deepEqual(direct,{ok:true,exp:100,method:'direct-enemy-exp'});

const fallback=resolveEnemyExp({
  sourceEnemyExp:-1,
  level:10,
  rank:0,
  sourceCoreStats:{
    level:10,
    rank:0,
    sourceTemplate:{
      critical:2,counter:0,get:11,
      resist:{poison:0,paralysis:0,sleep:0,stone:0,drunk:0,confusion:0},
      rare:0
    }
  }
});
assert.equal(fallback.ok,true,JSON.stringify(fallback));
assert.equal(fallback.baseExp,18);
assert.equal(fallback.rankBonus,2.5);
assert.equal(fallback.alpha,0.13);
assert.equal(fallback.exp,44);

const ctx={format:'stoneage-browser-battle-context-runtime-v1',context:{
  mode:'battle',sourceMode:2,
  sides:[
    {side:0,type:0,entries:[{bid:0,sourceType:'player',level:10,hp:100,maxHp:100,workGetExp:0,killPetCount:0}]},
    {side:1,type:1,entries:[{bid:10,sourceType:'enemy',level:10,sourceEnemyExp:100,hp:0,isDie:true,dead:false,sourceExpCreditProcessed:false}]}
  ]
}};
const same=runtime.credit(ctx,{enemyBid:10,participantBids:[0],hitIndex:0,source:'attack'});
assert.equal(same.ok,true,JSON.stringify(same));
assert.equal(same.enemyExp,100);
assert.equal(same.newCredits[0].exp,100);
assert.equal(same.context.sides[0].entries[0].workGetExp,100);
assert.equal(same.context.sides[0].entries[0].killPetCount,1);
assert.equal(same.context.sides[1].entries[0].sourceExpCreditProcessed,true);
assert.equal(same.persistentMutation,false);

const highLevel=runtime.credit({format:'stoneage-browser-battle-context-runtime-v1',context:{
  mode:'battle',sourceMode:2,
  sides:[
    {side:0,type:0,entries:[{bid:0,sourceType:'player',level:16,hp:100,maxHp:100,workGetExp:0,killPetCount:0}]},
    {side:1,type:1,entries:[{bid:10,sourceType:'enemy',level:10,sourceEnemyExp:100,hp:0,isDie:true,dead:false,sourceExpCreditProcessed:false}]}
  ]
}},{enemyBid:10,participantBids:[0],hitIndex:0});
assert.equal(highLevel.ok,true,JSON.stringify(highLevel));
assert.equal(highLevel.newCredits[0].exp,93);

const duplicate=runtime.credit({format:'stoneage-browser-battle-context-runtime-v1',context:same.context},{
  enemyBid:10,participantBids:[0],hitIndex:1
});
assert.equal(duplicate.ok,true,JSON.stringify(duplicate));
assert.equal(duplicate.idempotent,true);
assert.equal(duplicate.rngConsumed,0);
assert.equal(duplicate.newCredits.length,0);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v456-browser-battle-enemy-exp-credit-v1',
  directExp:direct.exp,
  fallbackExp:{level:10,rank:0,baseExp:fallback.baseExp,alpha:fallback.alpha,exp:fallback.exp},
  sameLevelCredit:same.newCredits[0],
  levelDifference6:highLevel.newCredits[0],
  duplicateIdempotent:duplicate.idempotent,
  persistentMutation:false
},null,2));
