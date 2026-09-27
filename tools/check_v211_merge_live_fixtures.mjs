import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');

function extractFunction(source,name){
  const marker='function '+name+'(';
  const start=source.indexOf(marker);
  assert.ok(start>=0,'missing '+name);
  const bodyStart=source.indexOf('{',start);
  assert.ok(bodyStart>=0,'missing body '+name);
  let depth=0,quote=null,escape=false,lineComment=false,blockComment=false;
  for(let i=bodyStart;i<source.length;i++){
    const c=source[i],n=source[i+1];
    if(lineComment){if(c==='\n')lineComment=false;continue}
    if(blockComment){if(c==='*'&&n==='/'){blockComment=false;i++}continue}
    if(quote){
      if(escape){escape=false;continue}
      if(c==='\\'){escape=true;continue}
      if(c===quote)quote=null;
      continue;
    }
    if(c==="'"||c==='"'||c==='\x60'){quote=c;continue}
    if(c==='/'&&n==='/'){lineComment=true;i++;continue}
    if(c==='/'&&n==='*'){blockComment=true;i++;continue}
    if(c==='{')depth++;
    else if(c==='}'&&--depth===0)return source.slice(start,i+1);
  }
  assert.fail('unterminated '+name);
}

const FN={
  cooldown:extractFunction(game,'sourceMergeCooldownState'),
  preflight:extractFunction(game,'sourceMergeLifecyclePreflight'),
  consume:extractFunction(game,'sourceConsumeTrackedExistingItem'),
  lifecycle:extractFunction(game,'sourceMergeExecuteLifecycle')
};

function context(extra={}){
  const ctx={
    console,
    PLAYER_BACKPACK_START:9,
    PLAYER_ITEM_SLOT_COUNT:24,
    n:v=>Number.isFinite(Number(v))?Number(v):0,
    sourceField2SelectedSlots:new Set(),
    sourceLastMergeTimeSec:0,
    cRand:()=>0,
    sourceRandModulo:()=>0,
    activePet:()=>null,
    ...extra
  };
  vm.createContext(ctx);
  return ctx;
}
function load(ctx,...keys){
  for(const key of keys)vm.runInContext(FN[key],ctx);
  return ctx;
}
function runtimeState(specs,{fillBackpack=false}={}){
  const state={
    mergeItemCount:0,
    inventory:{},
    playerItemSlots:Array(24).fill(null),
    itemRuntime:{slots:{}}
  };
  for(const spec of specs){
    const slot={use:true,owner:'player',itemId:spec.itemId,pile:spec.pile,sourceMakeRngCalls:0,mergeFlag:0};
    state.itemRuntime.slots[String(spec.index)]=slot;
    state.playerItemSlots[spec.backpackSlot]=spec.index;
    state.inventory[String(spec.itemId)]=(state.inventory[String(spec.itemId)]||0)+1;
  }
  if(fillBackpack){
    let fake=1000;
    for(let i=9;i<24;i++){
      if(state.playerItemSlots[i]!=null)continue;
      state.playerItemSlots[i]=fake++;
    }
  }
  return state;
}
function installItemOps(ctx){
  ctx.sourceItemRuntimeSlot=index=>ctx.state.itemRuntime.slots[String(index)]||null;
  ctx.sourceItemRuntimeResolvedDataInt=(slot,field)=>{
    if(!slot)return null;
    if(field==='ITEM_USEPILENUMS')return slot.pile;
    if(field==='ITEM_MERGEFLG')return slot.mergeFlag;
    return null;
  };
  ctx.sourceItemRuntimeSetDataInt=(slot,field,value)=>{
    if(!slot)return false;
    if(field==='ITEM_USEPILENUMS'){slot.pile=Math.trunc(Number(value));return true}
    if(field==='ITEM_MERGEFLG'){slot.mergeFlag=Math.trunc(Number(value));return true}
    return false;
  };
  ctx.sourcePlayerItemSlots=()=>ctx.state.playerItemSlots;
  ctx.sourceItemRuntimeFree=index=>{
    const key=String(index);
    if(!ctx.state.itemRuntime.slots[key])return false;
    for(let i=0;i<ctx.state.playerItemSlots.length;i++){
      if(Number(ctx.state.playerItemSlots[i])===Number(index))ctx.state.playerItemSlots[i]=null;
    }
    delete ctx.state.itemRuntime.slots[key];
    return true;
  };
  ctx.sourceField2PruneSelection=()=>{};
}
function installLifecycleOps(ctx,{core,addResult=9,outputId=999}={}){
  installItemOps(ctx);
  ctx.sourceMergeLifecyclePreflight=()=>({ok:true,valid:[]});
  ctx.sourceMergeMakeInputClones=()=>({
    ok:true,rngCalls:132,
    clones:[
      {slotIndex:9,itemIndex:1,itemId:100},
      {slotIndex:10,itemIndex:2,itemId:101}
    ]
  });
  ctx.sourceMergeExecuteCoreRng=core||(()=>({ok:true,createdItemId:outputId,searchtable:0,sourceRngConsumed:true}));
  ctx.sourceItemRuntimeAlloc=itemId=>{
    ctx.state.itemRuntime.slots['50']={
      use:true,owner:null,itemId,sourceMakeRngCalls:66,pile:1,mergeFlag:0
    };
    return 50;
  };
  ctx.sourcePlayerAddSpecificExistingItem=(index,{incrementInventory=true}={})=>{
    if(addResult<9||addResult>=24)return addResult;
    const slot=ctx.state.itemRuntime.slots[String(index)];
    ctx.state.playerItemSlots[addResult]=index;
    slot.owner='player';
    if(incrementInventory){
      const key=String(slot.itemId);
      ctx.state.inventory[key]=(ctx.state.inventory[key]||0)+1;
    }
    return addResult;
  };
}

// 1) Full backpack must stop before parsing templates / RNG.
{
  let templateCalls=0;
  const ctx=context({
    state:{},
    sourcePlayerFindEmptyBackpackSlot:()=>-1,
    sourceItemMakeTemplateInt:()=>{templateCalls++;return 1},
    sourceItemMakeTemplateData:()=>({}),
    sourceItemRuntimeResolvedDataInt:()=>1
  });
  load(ctx,'preflight');
  const r=ctx.sourceMergeLifecyclePreflight([{slotIndex:9,itemIndex:1,existing:{owner:'player',itemId:100}}]);
  assert.deepEqual(JSON.parse(JSON.stringify(r)),{ok:false,reason:'merge-backpack-full',sourceNoRngConsumed:true});
  assert.equal(templateCalls,0);
}

// 2) pile > 1 decrements only; pile == 1 frees existing and aggregate inventory.
{
  const state=runtimeState([{index:1,itemId:100,pile:3,backpackSlot:9}]);
  const ctx=context({state});
  ctx.sourceField2SelectedSlots.add(9);
  installItemOps(ctx);load(ctx,'consume');
  assert.equal(ctx.sourceConsumeTrackedExistingItem(1),true);
  assert.equal(state.itemRuntime.slots['1'].pile,2);
  assert.equal(state.playerItemSlots[9],1);
  assert.equal(state.inventory['100'],1);
}
{
  const state=runtimeState([{index:1,itemId:100,pile:1,backpackSlot:9}]);
  const ctx=context({state});
  ctx.sourceField2SelectedSlots.add(9);
  installItemOps(ctx);load(ctx,'consume');
  assert.equal(ctx.sourceConsumeTrackedExistingItem(1),true);
  assert.equal(state.itemRuntime.slots['1'],undefined);
  assert.equal(state.playerItemSlots[9],null);
  assert.equal(state.inventory['100'],undefined);
}

// 3) Normal success runs production lifecycle: consume -> output -> MERGEFLG -> backpack.
{
  const state=runtimeState([
    {index:1,itemId:100,pile:1,backpackSlot:9},
    {index:2,itemId:101,pile:2,backpackSlot:10}
  ]);
  const ctx=context({state,sourceLastMergeTimeSec:0});
  ctx.sourceField2SelectedSlots=new Set([9,10]);
  installLifecycleOps(ctx,{addResult:9,outputId:999});
  load(ctx,'cooldown','consume','lifecycle');
  const r=ctx.sourceMergeExecuteLifecycle([],{},{
    randInclusive:()=>0,randModulo:()=>0,nowSec:100
  });
  assert.equal(r.ok,true);
  assert.equal(state.mergeItemCount,1);
  assert.equal(state.itemRuntime.slots['1'],undefined);
  assert.equal(state.itemRuntime.slots['2'].pile,1);
  assert.equal(state.itemRuntime.slots['50'].mergeFlag,1);
  assert.equal(state.itemRuntime.slots['50'].owner,'player');
  assert.equal(state.playerItemSlots[9],50);
  assert.equal(state.inventory['100'],undefined);
  assert.equal(state.inventory['101'],1);
  assert.equal(state.inventory['999'],1);
  assert.equal(ctx.sourceLastMergeTimeSec,100);
  assert.equal(r.outputMakeRngCalls,66);
}

// 4) Cooldown fallback updates timestamp and still consumes inputs / creates fallback result.
{
  const state=runtimeState([
    {index:1,itemId:100,pile:1,backpackSlot:9},
    {index:2,itemId:101,pile:1,backpackSlot:10}
  ]);
  let seenCooldown=null;
  const ctx=context({state,sourceLastMergeTimeSec:98});
  ctx.sourceField2SelectedSlots=new Set([9,10]);
  installLifecycleOps(ctx,{
    addResult:9,
    core:(_selected,_pet,opt)=>{
      seenCooldown=opt.cooldownHit;
      return {ok:true,createdItemId:100,cooldownHit:opt.cooldownHit,searchtable:0,sourceRngConsumed:true};
    }
  });
  load(ctx,'cooldown','consume','lifecycle');
  const r=ctx.sourceMergeExecuteLifecycle([],{},{
    randInclusive:()=>0,randModulo:()=>0,nowSec:100
  });
  assert.equal(seenCooldown,true);
  assert.equal(r.cooldown.hit,true);
  assert.equal(ctx.sourceLastMergeTimeSec,100);
  assert.equal(state.mergeItemCount,1);
  assert.equal(r.createdItemId,100);
  assert.equal(r.materialsConsumed,true);
}

// 5) Source mixed-dish -10 consumes both inputs, increments merge count, creates no output.
{
  const state=runtimeState([
    {index:1,itemId:100,pile:1,backpackSlot:9},
    {index:2,itemId:101,pile:1,backpackSlot:10}
  ]);
  let allocCalls=0;
  const ctx=context({state,sourceLastMergeTimeSec:0});
  ctx.sourceField2SelectedSlots=new Set([9,10]);
  installLifecycleOps(ctx,{
    core:()=>({ok:false,reason:'mixed-dish',sourceReturn:-10,sourceRngConsumed:true})
  });
  ctx.sourceItemRuntimeAlloc=()=>{allocCalls++;return 50};
  load(ctx,'cooldown','consume','lifecycle');
  const r=ctx.sourceMergeExecuteLifecycle([],{},{
    randInclusive:()=>0,randModulo:()=>0,nowSec:100
  });
  assert.equal(r.ok,false);
  assert.equal(r.reason,'mixed-dish');
  assert.equal(r.sourceReturn,-10);
  assert.equal(r.materialsConsumed,true);
  assert.equal(state.mergeItemCount,1);
  assert.equal(state.itemRuntime.slots['1'],undefined);
  assert.equal(state.itemRuntime.slots['2'],undefined);
  assert.equal(allocCalls,0);
}

// 6) If output add fails after creation, output existing is freed; consumed inputs do not roll back.
{
  const state=runtimeState([
    {index:1,itemId:100,pile:1,backpackSlot:9},
    {index:2,itemId:101,pile:1,backpackSlot:10}
  ]);
  const freed=[];
  const ctx=context({state,sourceLastMergeTimeSec:0});
  ctx.sourceField2SelectedSlots=new Set([9,10]);
  installLifecycleOps(ctx,{addResult:24,outputId:999});
  const originalFree=ctx.sourceItemRuntimeFree;
  ctx.sourceItemRuntimeFree=index=>{freed.push(index);return originalFree(index)};
  load(ctx,'cooldown','consume','lifecycle');
  const r=ctx.sourceMergeExecuteLifecycle([],{},{
    randInclusive:()=>0,randModulo:()=>0,nowSec:100
  });
  assert.equal(r.ok,false);
  assert.equal(r.reason,'merge-output-add-failed');
  assert.equal(r.outputFreed,true);
  assert.equal(state.mergeItemCount,1);
  assert.equal(state.itemRuntime.slots['1'],undefined);
  assert.equal(state.itemRuntime.slots['2'],undefined);
  assert.equal(state.itemRuntime.slots['50'],undefined);
  assert.ok(freed.includes(50));
}

assert.match(game,/schemaVersion:29/);
assert.match(game,/s\.schemaVersion=29/);

console.log(JSON.stringify({
  pass:true,version:'V2.11',focus:'merge-live-executable-fixtures',
  fixtures:[
    'full-backpack-preflight','pile-decrement','pile-free',
    'normal-success','cooldown-fallback','mixed-dish-minus10','output-add-failure-free'
  ],
  saveSchema:29
}));
