import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync('game.js','utf8');
const itemRuntime=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));

assert.ok(game.includes('let sourceLastMergeTimeSec=0;'));
assert.ok(game.includes('mergeItemCount:0'));
assert.ok(itemRuntime.itemDataIntOrder.includes('ITEM_MERGEFLG'));
assert.ok(itemRuntime.itemDataIntOrder.includes('ITEM_USEPILENUMS'));

for(const fn of [
  'function sourceMergeCooldownState(inputCount,nowSec,lastMergeTimeSec=sourceLastMergeTimeSec)',
  'function sourceMergeLifecyclePreflight(selected)',
  'function sourceMergeExecuteLifecycle(selected,pet=activePet(),{'
])assert.ok(game.includes(fn),fn);

const lifeStart=game.indexOf('function sourceMergeExecuteLifecycle');
const lifeEnd=game.indexOf('function sourceMergePrepareStatic',lifeStart);
const life=game.slice(lifeStart,lifeEnd);
assert.ok(life.indexOf('sourceMergeLifecyclePreflight')<life.indexOf('sourceMergeMakeInputClones'));
assert.ok(life.indexOf('sourceMergeMakeInputClones')<life.indexOf('sourceMergeCooldownState'));
assert.ok(life.indexOf('sourceMergeCooldownState')<life.indexOf('sourceLastMergeTimeSec=cooldown.nowSec'));
assert.ok(life.indexOf('sourceLastMergeTimeSec=cooldown.nowSec')<life.indexOf('sourceMergeExecuteCoreRng'));
assert.ok(life.indexOf('sourceMergeExecuteCoreRng')<life.indexOf('state.mergeItemCount='));
assert.ok(life.indexOf('state.mergeItemCount=')<life.indexOf('sourceConsumeTrackedExistingItem'));
assert.ok(life.indexOf('sourceConsumeTrackedExistingItem')<life.indexOf('sourceItemRuntimeAlloc(sourceReturn'));
assert.ok(life.indexOf("sourceItemRuntimeSetDataInt(outputExisting,'ITEM_MERGEFLG',1)")<life.indexOf('sourcePlayerAddSpecificExistingItem'));
assert.ok(life.includes('sourceItemRuntimeFree(outputItemIndex)'));
assert.ok(life.includes("reason:'merge-output-add-failed'"));
assert.ok(life.includes('materialsConsumed:true'));

const preStart=game.indexOf('function sourceMergeLifecyclePreflight');
const preEnd=game.indexOf('function sourceMergeExecuteLifecycle',preStart);
const pre=game.slice(preStart,preEnd);
assert.ok(pre.indexOf('sourcePlayerFindEmptyBackpackSlot(state)')<pre.indexOf("sourceItemMakeTemplateInt(itemId,'ITEM_CANMERGEFROM')"));
assert.ok(pre.includes("reason:'merge-backpack-full',sourceNoRngConsumed:true"));
assert.ok(pre.includes("sourceItemRuntimeResolvedDataInt(existing,'ITEM_USEPILENUMS')"));

const coreStart=game.indexOf('function sourceMergeExecuteCoreRng');
const coreEnd=game.indexOf('function sourceMergeCooldownState',coreStart);
const core=game.slice(coreStart,coreEnd);
assert.ok(core.includes('precloned=null'));
assert.ok(core.includes("precloned?.ok===true?precloned:sourceMergeMakeInputClones"));
assert.ok(core.includes('if(cooldownHit)'));

const gateStart=game.indexOf('if(id===200||id===201)');
const gateEnd=game.indexOf('try{await sourceEnsureItemField2Db()}',gateStart);
const gate=game.slice(gateStart,gateEnd);
assert.ok(gate.includes('sourceMergeExecuteLifecycle(selected,activePet())'));
assert.equal(gate.includes('merge-runtime-pending'),false);
assert.ok(gate.includes('材料各扣 1 pile'));
assert.ok(gate.includes('ITEM_MERGEFLG'));

assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

// Pure mirror of fixed ITEM_mergeItem cooldown math.
function cooldown(num,now,last){
  const threshold=5+(num-2);
  return {threshold,elapsed:now-last,hit:(now-last)<threshold,next:now};
}
assert.deepEqual(cooldown(2,100,95),{threshold:5,elapsed:5,hit:false,next:100});
assert.deepEqual(cooldown(2,100,96),{threshold:5,elapsed:4,hit:true,next:100});
assert.deepEqual(cooldown(5,100,92),{threshold:8,elapsed:8,hit:false,next:100});
assert.deepEqual(cooldown(5,100,93),{threshold:8,elapsed:7,hit:true,next:100});

console.log(JSON.stringify({
  pass:true,version:'V2.10',focus:'merge-live-lifecycle',
  order:[
    'empty-slot-precheck','input-make-rng','cooldown-timestamp','merge-core',
    'merge-count','material-pile-consume','output-make-and-regist','mergeflag','backpack-add-or-free'
  ],
  saveSchema:30
}));
