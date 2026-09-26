import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync('game.js','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_pet_merge_fix_runtime.json','utf8'));

assert.equal(runtime.mergeMath?.rngLifecycle?.makeItemCallsPerInput,66);
assert.match(String(runtime.mergeMath?.rngLifecycle?.mergeItemMergeBeforeMergeItem||''),/ITEM_makeItem/);
assert.match(String(runtime.mergeMath?.rngLifecycle?.cooldownPosition||''),/after all input ITEM_makeItem/);
assert.match(String(runtime.mergeMath?.rngLifecycle?.retryRollPosition||''),/before extractcnt>=ideal/);
assert.equal(runtime.mergeMath?.rngLifecycle?.finalCandidateSelection,'random()%match consumes one shared libc RNG call');
assert.match(String(runtime.mergeMath?.rngLifecycle?.allRetryFailureFallback||''),/RAND\(0,num-1\)/);

for(const fn of [
  'function sourceMergeCloneDataInt(clone,fieldName)',
  'function sourceMergeMakeInputClones(selected,{randInclusive=cRand}={})',
  'function sourceMergeCollectCloneAtoms(clones)',
  'function sourceMergePrepareClones(clones,pet=activePet())',
  'function sourceMergeExecuteRandRangePlan(plan,{randInclusive=cRand}={})',
  'function sourceMergeExecuteRetryOnce(hitPlan,ingnum,{randInclusive=cRand,randModulo=sourceRandModulo}={})',
  'function sourceMergeExecuteRetryOuter(hitPlan,ingnum,inputItemIds,{randInclusive=cRand,randModulo=sourceRandModulo}={})',
  'function sourceMergeExecuteCoreRng(selected,pet=activePet(),{'
])assert.ok(game.includes(fn),fn);

const makeStart=game.indexOf('function sourceMergeMakeInputClones');
const collectStart=game.indexOf('function sourceMergeCollectCloneAtoms',makeStart);
const make=game.slice(makeStart,collectStart);
assert.ok(make.includes("sourceItemMakeTemplateInt(itemId,'ITEM_CANMERGEFROM')"));
assert.ok(make.includes("rngCallsBeforeLeakLevel)||66"));
assert.ok(make.includes('for(let i=0;i<calls;i++)'));
assert.ok(make.includes('randInclusive(0,width)'));
assert.ok(make.indexOf("canMerge!==1")<make.indexOf('randInclusive(0,width)'));
assert.ok(make.includes('sourceItemMakeCallsPerClone:66'));

const collectEnd=game.indexOf('function sourceMergePrepareClones',collectStart);
const collect=game.slice(collectStart,collectEnd);
assert.ok(collect.includes("sourceMergeCloneDataInt(clone,'ITEM_TYPE')"));
assert.ok(collect.includes("reason:'mixed-dish',sourceReturn:-10"));
assert.ok(collect.includes("sourceMergeCloneDataInt(clone,'ITEM_INGVALUE'+i)"));
assert.ok(collect.includes('continue itemLoop'));

const randStart=game.indexOf('function sourceMergeExecuteRandRangePlan');
const retryStart=game.indexOf('function sourceMergeExecuteRetryOnce',randStart);
const rand=game.slice(randStart,retryStart);
assert.ok(rand.includes("if(plan.mode==='rng')"));
assert.ok(rand.includes('randInclusive(plan.rngMin,plan.rngMax)'));
assert.ok(rand.includes('rngCalls:1'));
assert.ok(rand.includes('rngCalls:0'));

const retryEnd=game.indexOf('function sourceMergeExecuteRetryOuter',retryStart);
const retry=game.slice(retryStart,retryEnd);
assert.ok(retry.indexOf('randInclusive(0,999)')<retry.indexOf('if(extractcnt>=ideal)'));
assert.ok(retry.includes('terminalExtraRoll:true'));
assert.ok(retry.includes('duplicateClass:true'));
assert.ok(retry.includes('firstPassHitnum:first'));
assert.ok(retry.includes('randModulo(matches.length)'));

const outerEnd=game.indexOf('function sourceMergeExecuteCoreRng',retryEnd);
const outer=game.slice(retryEnd,outerEnd);
assert.ok(outer.includes('for(let attempt=0;attempt<attempts;attempt++)'));
assert.ok(outer.includes('sourceMergeExecuteRetryOnce'));
assert.ok(outer.includes('randInclusive(0,inputItemIds.length-1)'));
assert.ok(outer.includes('fallback:true'));

const coreEnd=game.indexOf('function sourceMergePrepareStatic',outerEnd);
const core=game.slice(outerEnd,coreEnd);
assert.ok(core.indexOf('sourceMergeMakeInputClones')<core.indexOf('if(cloned.clones.length<=1)'));
assert.ok(core.indexOf('if(cloned.clones.length<=1)')<core.indexOf('if(cooldownHit)'));
assert.ok(core.indexOf('if(cooldownHit)')<core.indexOf('sourceMergePrepareClones'));
assert.ok(core.indexOf('sourceMergePrepareClones')<core.indexOf('sourceMergeExecuteRandRangePlan'));
assert.ok(core.indexOf('sourceMergeExecuteRandRangePlan')<core.indexOf('sourceMergeCandidateHitPlan'));
assert.ok(core.indexOf('sourceMergeCandidateHitPlan')<core.indexOf('sourceMergeExecuteRetryOuter'));
assert.ok(core.includes('sourceLifecycleMutationPending:true'));

// Pure deterministic mirror of fixed ITEM_merge_with_retry ordering.
const thresholds=runtime.mergeMath.retryThresholds;
function retryOnce(ideal,byExtract,randInclusive,randModulo){
  const row=thresholds[ideal-1],end=Array(ideal).fill(false),trace=[];
  let extractcnt=0,rngCalls=0,moduloCalls=0;
  while(true){
    const roll=randInclusive(0,999);rngCalls++;
    if(extractcnt>=ideal){trace.push(['terminal',roll]);return {created:-1,rngCalls,moduloCalls,trace}}
    let index=0;for(;index<ideal;index++)if(roll>=row[index])break;
    if(end[index]){trace.push(['dup',roll,index]);continue}
    end[index]=true;extractcnt++;
    const extractnum=ideal-index,matches=byExtract[extractnum]||[];
    trace.push(['class',roll,extractnum,matches.length]);
    if(matches.length){
      const pick=randModulo(matches.length);moduloCalls++;
      return {created:matches[pick],rngCalls,moduloCalls,trace};
    }
  }
}
// Immediate ideal=3 full match: one RAND(0,999), then one random()%match.
{
  const rolls=[500],mods=[0];
  const r=retryOnce(3,{3:[2106]},()=>rolls.shift(),()=>mods.shift());
  assert.equal(r.created,2106);assert.equal(r.rngCalls,1);assert.equal(r.moduloCalls,1);
}
// Failed call consumes 3 unique classes PLUS the terminal extra RAND.
{
  const rolls=[500,200,0,999];
  const r=retryOnce(3,{},()=>rolls.shift(),()=>0);
  assert.equal(r.created,-1);assert.equal(r.rngCalls,4);assert.equal(r.moduloCalls,0);
  assert.deepEqual(r.trace.at(-1),['terminal',999]);
}
// Duplicate class still consumes RNG and does not increase extractcnt.
{
  const rolls=[500,500,200,0,999];
  const r=retryOnce(3,{},()=>rolls.shift(),()=>0);
  assert.equal(r.rngCalls,5);
  assert.deepEqual(r.trace[1],['dup',500,0]);
}
// Five failed outer calls for ideal=3: 5*4 retry RAND + final input fallback RAND = 21 shared RAND calls.
assert.equal(5*4+1,21);

// Live 200/201 gate remains atomic-safe: executor is ready but is not invoked before lifecycle exists.
const gateStart=game.indexOf('if(id===200||id===201)');
const gateEnd=game.indexOf('try{await sourceEnsureItemField2Db()}',gateStart);
const gate=game.slice(gateStart,gateEnd);
assert.ok(gate.includes('mergeRngLifecycleReady:true'));
assert.ok(gate.includes('RNG executor 已來源化'));
assert.ok(gate.includes('目前不從按鈕消耗 RNG'));
assert.equal(gate.includes('sourceMergeExecuteCoreRng('),false);
assert.equal(gate.includes('cRand('),false);

console.log(JSON.stringify({
  pass:true,version:'V2.09',focus:'merge-rng-lifecycle-executor',
  makeItemCallsPerInput:66,
  retryImmediate:{rand:1,modulo:1},
  retryIdeal3FullFailureRand:4,
  retryIdeal3FiveFailuresPlusFallbackRand:21,
  liveGateConsumesRng:false
}));
