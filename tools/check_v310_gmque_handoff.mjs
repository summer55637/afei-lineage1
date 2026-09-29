#!/usr/bin/env node
'use strict';

import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const readme=fs.readFileSync('README.md','utf8');
const changelog=fs.readFileSync('CHANGELOG.md','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_gmque_source_closure.json','utf8'));

function extractFunction(name){
  const marker=`function ${name}(`;
  const start=game.indexOf(marker);
  assert.ok(start>=0,`missing ${name}`);
  const next=game.indexOf('\nfunction ',start+marker.length);
  return game.slice(start,next<0?game.length:next);
}

assert.doesNotThrow(()=>new Function(game),'game.js syntax');
assert.equal(runtime.playableCore,'V3.09');
assert.equal(runtime.workstream,'V3.10-groundwork');
assert.equal(runtime.fixedC?.repository,'gavinlinasd/StoneAge');
assert.equal(runtime.fixedC?.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.equal(runtime.fixedC?.path,'gmsv/src/npc/npc_eventaction.c');

const required=['sourceGmQueActionValue','sourceGmQueRewardType','sourceGmQueParseNpcArg','sourceGmQueTaskEntries','sourceGmQuePetIdentity','sourceGmQueMatchPetToTask','sourceGmQueHandoverCheck'];
const forbidden=['sourceGmQueParseTaskString','sourceGmQuePetReferenceName','sourceGmQuePetMatchesTask'];
for(const name of required)assert.doesNotThrow(()=>extractFunction(name),`current API ${name}`);
for(const name of forbidden)assert.equal(game.includes(`function ${name}(`),false,`stale API ${name} still present`);

const ctx={
  Math,Number,Object,Array,RegExp,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceRandModulo:()=>41,
  cRand:(a)=>a
};
vm.createContext(ctx);
for(const name of required)vm.runInContext(extractFunction(name),ctx);

// NPC argument -> four fixed task entries, including inclusive option and level RNG.
const calls=[];
const npc=ctx.sourceGmQueParseNpcArg(
  'RANDGMQUE=4|QUEPART0=475=2-2,111=1-1|QUEPART1=1636=3-3|QUEPART2=1642=4-4|QUEPART3=999=5-5',
  {randInclusive:(a,b)=>{calls.push([a,b]);return a;}}
);
assert.equal(npc.ok,true);
assert.equal(npc.count,4);
assert.equal(npc.taskString,'475-2&1636-3&1642-4&999-5');
assert.deepEqual(calls,[[1,2],[2,2],[1,1],[3,3],[1,1],[4,4],[1,1],[5,5]]);

// Task parser preserves slot order and does not accept malformed tokens.
const parsed=ctx.sourceGmQueTaskEntries('1642-10&1636-11&475-12&1642-13');
assert.equal(parsed.ok,true);
assert.equal(JSON.stringify(parsed.entries.map(x=>[x.slot,x.petId,x.level])),JSON.stringify([[0,1642,10],[1,1636,11],[2,475,12],[3,1642,13]]));
assert.equal(ctx.sourceGmQueTaskEntries('1-1&2-2').reason,'task-count');
assert.equal(ctx.sourceGmQueTaskEntries('1-x&2-2&3-3&4-4').reason,'task-token');

// Exact player pet ID + exact level wins; different ID may only fall back to an explicitly supplied source name.
const exact=ctx.sourceGmQueMatchPetToTask({petId:1642,name:'A',level:10},{petId:1642,level:10});
assert.equal(exact.match,true); assert.equal(exact.reason,'exact-id');
const fallback=ctx.sourceGmQueMatchPetToTask({petId:999,name:'B',level:11},{petId:1636,level:11},{expectedName:'B'});
assert.equal(fallback.match,true); assert.equal(fallback.reason,'enemy-name-fallback');
const noFallback=ctx.sourceGmQueMatchPetToTask({petId:999,name:'B',level:11},{petId:1636,level:11});
assert.equal(noFallback.match,false);

// Handover eligibility initializes GMQUENUMS before item/gold gates and remains pure.
const stateBefore={
  quest:{gmque:{active:true,flag:10,taskString:'1642-10&1636-11&475-12&1642-13',nums:0}},
  gold:800000
};
const snapshot=JSON.stringify(stateBefore);
const blocked=ctx.sourceGmQueHandoverCheck(stateBefore.quest.gmque.taskString,[
  {petId:1642,level:10,name:'A'},
  {petId:1636,level:11,name:'B'},
  {petId:475,level:12,name:'C'},
  {petId:1642,level:13,name:'D'}
],{gmqueNums:0,randModulo:()=>15,bagHasSpace:true,gold:800000});
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,'gold-cap');
assert.equal(blocked.nums,15);
assert.equal(blocked.generatedNums,true);
assert.equal(blocked.matches.length,0);
assert.equal(JSON.stringify(stateBefore),snapshot);

const itemBlocked=ctx.sourceGmQueHandoverCheck(stateBefore.quest.gmque.taskString,[
  {petId:1642,level:10,name:'A'},
  {petId:1636,level:11,name:'B'},
  {petId:475,level:12,name:'C'},
  {petId:1642,level:13,name:'D'}
],{gmqueNums:41,bagHasSpace:false,gold:0});
assert.equal(itemBlocked.ok,false);
assert.equal(itemBlocked.reason,'item-full');
assert.equal(itemBlocked.nums,41);

const eligible=ctx.sourceGmQueHandoverCheck('1642-10&1636-11&475-12&1642-13',[
  {petId:1642,level:10,name:'A'},
  {petId:1636,level:11,name:'B'},
  {petId:475,level:12,name:'C'},
  {petId:1642,level:13,name:'D'}
],{gmqueNums:15,bagHasSpace:true,gold:0});
assert.equal(eligible.ok,true);
assert.equal(eligible.matchedTaskCount,4);
assert.equal(eligible.matchedAll,true);

console.log(JSON.stringify({
  pass:true,
  focus:'GMQUE handover parser / eligibility current-API regression',
  fixedC:runtime.fixedC.ref,
  fourSlotTask:true,
  exactIdAndSourceNameFallback:true,
  rewardRollInitializedBeforeGate:true,
  pureEligibility:true,
  staleApiRemoved:true
}));
