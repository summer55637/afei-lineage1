#!/usr/bin/env node
'use strict';

import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_gmque_trophy_runtime.json','utf8'));
const rewardTemplates=JSON.parse(fs.readFileSync('data/generated/stoneage_gmque_reward_enemy_templates.json','utf8'));
const fixedRef='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

function extractFunction(name){
  const marker=`function ${name}(`;
  const start=game.indexOf(marker);
  assert.ok(start>=0,`missing ${name}`);
  const next=game.indexOf('\nfunction ',start+marker.length);
  return game.slice(start,next<0?game.length:next);
}

assert.equal(runtime.source?.ref,fixedRef);
assert.equal(runtime.source?.repository,'gavinlinasd/StoneAge');
assert.equal(runtime.source?.path,'gmsv/src/npc/npc_eventaction.c');

for(const name of ['sourceGmQueActionValue','sourceGmQueRewardType','sourceGmQueBuildPetTemplateIndex','sourceGmQueRewardPetTemplate','sourceGmQueResolveTrophy']){
  assert.doesNotThrow(()=>extractFunction(name),`missing ${name}`);
}

const ctx={
  Math,Number,Object,Array,RegExp,
  n:value=>Number.isFinite(Number(value))?Number(value):0,
  gmqueDb:runtime,
  gmquePetTemplateIndex:{},
  gmqueRewardEnemyTemplatesDb:rewardTemplates,
  gmqueRewardEnemyTemplatesDb:rewardTemplates,
  cRand:(a)=>a,
  sourceRandModulo:()=>41
};
vm.createContext(ctx);
for(const name of ['sourceGmQueActionValue','sourceGmQueRewardType','sourceGmQueBuildPetTemplateIndex','sourceGmQueRewardPetTemplate','sourceGmQueResolveTrophy']){
  vm.runInContext(extractFunction(name),ctx);
}

// Fixed observable roll semantics: rand()%100 then zero becomes one.
assert.equal(ctx.sourceGmQueActionValue(()=>0),1);
assert.equal(ctx.sourceGmQueActionValue(()=>1),1);
assert.equal(ctx.sourceGmQueActionValue(()=>41),41);
assert.equal(ctx.sourceGmQueActionValue(()=>99),99);

// Reward boundaries are semantic, not source-spelling dependent.
assert.equal(ctx.sourceGmQueRewardType(1),'gold');
assert.equal(ctx.sourceGmQueRewardType(40),'gold');
assert.equal(ctx.sourceGmQueRewardType(41),'item');
assert.equal(ctx.sourceGmQueRewardType(97),'item');
assert.equal(ctx.sourceGmQueRewardType(98),'pet');
assert.equal(ctx.sourceGmQueRewardType(99),'pet');

// Gold branch follows the generated source table: 15..30 => 20k, 10..14 => 50k, 0..9 => secondary 2..4 table.
assert.equal(ctx.sourceGmQueResolveTrophy(1,{randInclusive:()=>15}).gold,20000);
assert.equal(ctx.sourceGmQueResolveTrophy(1,{randInclusive:()=>10}).gold,50000);
const goldSecondary=ctx.sourceGmQueResolveTrophy(1,{randInclusive:(a,b)=>a});

assert.equal(goldSecondary.gold,100000);
assert.equal(goldSecondary.secondary,2);
let goldRolls=0;
const goldSecondaryMax=ctx.sourceGmQueResolveTrophy(1,{randInclusive:(a,b)=>goldRolls++===0?0:b});
assert.equal(goldSecondaryMax.gold,200000);
assert.equal(goldSecondaryMax.secondary,4);

// Item branch keeps the five documented pools and an inclusive pool-index roll.
const item=ctx.sourceGmQueResolveTrophy(41,{randInclusive:()=>0});
assert.equal(item.ok,true);
assert.equal(item.type,'item');
assert.equal(item.pool,'itemID3');
assert.equal(item.itemId,20282);

// Pet branch now resolves through the fixed-C Enemy template artifact; index 3 remains the implicit zero slot.
const petResolved=ctx.sourceGmQueResolveTrophy(98,{randInclusive:()=>0});
assert.equal(petResolved.ok,true);
assert.equal(petResolved.type,'pet');
assert.equal(petResolved.petId,1642);
assert.equal(petResolved.template.tempNo,809);
assert.equal(petResolved.template.name,'瑞里西尔');
const petZero=ctx.sourceGmQueResolveTrophy(98,{randInclusive:(_,b)=>b});
assert.equal(petZero.ok,false);
assert.equal(petZero.reason,'implicit-zero-pet-slot');
const petPending=ctx.sourceGmQueRewardPetTemplate(1642,{templateIndex:{}});
assert.equal(petPending.ok,false);
assert.equal(petPending.reason,'pet-template-pending');

// Missing generated runtime is fail-closed rather than silently inventing a reward.
const runtimeMissing=ctx.sourceGmQueResolveTrophy;
const saved=ctx.gmqueDb;
ctx.gmqueDb=null;
assert.equal(runtimeMissing(41).reason,'runtime-missing');
ctx.gmqueDb=saved;
const savedPools=ctx.gmqueDb.itemReward.pools;
ctx.gmqueDb.itemReward.pools=[];
assert.equal(runtimeMissing(41).reason,'pool-missing');
ctx.gmqueDb.itemReward.pools=savedPools;

assert.deepEqual(runtime.petReward?.effectiveIds,[1642,1636,475,0]);
assert.deepEqual(runtime.petReward?.selection?.inclusive,[0,3]);
assert.deepEqual(runtime.goldReward?.branches?.[2]?.secondary?.goldByIndex,{'2':100000,'3':150000,'4':200000});
assert.equal(runtime.itemReward?.pools?.length,5);
assert.equal(runtime.itemReward?.pools?.find(x=>x.name==='itemID1')?.ids?.[0],20131);

console.log(JSON.stringify({
  pass:true,
  version:'V3.10-groundwork',
  focus:'GMQUE trophy runtime semantic regression',
  fixedC:fixedRef,
  rewardBoundaries:{gold:'1-40',item:'41-97',pet:'98-99'},
  petRewardIds:[1642,1636,475,0],
  failClosed:['runtime-missing','pool-missing','pet-template-pending','implicit-zero-pet-slot'],
  sourceBackedRewardTemplates:[1642,1636,475]
}));
