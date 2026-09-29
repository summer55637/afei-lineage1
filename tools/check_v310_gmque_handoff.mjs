import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const readme=fs.readFileSync('README.md','utf8');
const changelog=fs.readFileSync('CHANGELOG.md','utf8');
const gmqueRuntime=JSON.parse(fs.readFileSync('data/generated/stoneage_gmque_trophy_runtime.json','utf8'));
function sliceFunction(name){
  const start=game.indexOf('function '+name+'(');
  assert.ok(start>=0,'missing '+name);
  const end=game.indexOf('\nfunction ',start+10);
  return game.slice(start,end>start?end:start+40000);
}
assert.doesNotThrow(()=>new Function(game),'game.js syntax');
assert.equal(gmqueRuntime.source?.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.deepEqual(gmqueRuntime.petReward?.effectiveIds,[1642,1636,475,0]);
assert.equal(gmqueRuntime.itemReward?.pools?.find(x=>x.name==='itemID1')?.ids?.[0],20131);
assert.equal(gmqueRuntime.goldReward?.branches?.[2]?.secondary?.goldByIndex?.['4'],200000);

const names=[
  'sourceGmQueActionValue','sourceGmQueRewardType','sourceGmQueResolveTrophy','sourceGmQueParseTaskString',
  'sourceGmQueParseNpcArg','sourceGmQuePetReferenceName','sourceGmQuePetMatchesTask',
  'sourceGmQueFindPetMatches','sourceGmQueState','sourceGmQueBeginFromNpcArg',
  'sourceGmQueCheck','sourceGmQueDeleteMatchedPets','sourceGmQueGrantItem','sourceGmQueGrantPet','sourceGmQueClaimPrize','sourceGmQueShowTask'
];
const ctx={
  Math,Number,Object,Array,RegExp,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  TEAM_SIZE:5,PLAYER_ITEM_SLOT_COUNT:24,
  state:null,gmqueDb:{goldReward:{branches:[null,null,{secondary:{goldByIndex:{'2':100000,'3':150000,'4':200000}}}]},petReward:{effectiveIds:[1642,1636,475,0]},itemReward:{pools:[{name:'itemID3',ids:[20282,20273]},{name:'itemID2',ids:[17759,17259,14752,15053,14154,16556]},{name:'itemID4',ids:[14693,15233,17053,17056,14364,15023,15562,17603]},{name:'itemID5',ids:[3843,14902,6214,15235,4474,17005,17554,17558]},{name:'itemID1',ids:[20131,20594,20171,17005,20210,20211,20212,20213,2435]}]}},
  cRand:(a,b)=>Math.trunc(a),
  sourceRandModulo:mod=>7,
  sourcePlayerFindEmptyBackpackSlot:()=>15,
  findMainVariant:()=>null,
  sourceItemRuntimeAlloc:()=>-1,
  sourcePlayerAddSpecificExistingItem:()=>-1,
  sourceItemRuntimeFree:()=>true,
  sourceGmQueRewardType:null,
  sourceGmQueActionValue:null,
  sourceGmQueResolveTrophy:null,
  sourceQuestPetTemplate:()=>null,
  sourceCreateQuestGetPet:()=>null
};
vm.createContext(ctx);
for(const name of names)vm.runInContext(sliceFunction(name),ctx);
ctx.sourceGmQueRewardType=ctx.sourceGmQueRewardType;
ctx.sourceGmQueResolveTrophy=ctx.sourceGmQueResolveTrophy;

const state={quest:{gmque:{active:false,flag:0,taskString:'NULL',nums:0,handoverComplete:false}},gold:100000,
  petBox:[
    {id:'p1',name:'A',tempNo:475,petId:475,level:2},
    {id:'p2',name:'B',tempNo:1636,petId:1636,level:3},
    {id:'p3',name:'C',tempNo:1642,petId:1642,level:4},
    {id:'p4',name:'D',tempNo:999,petId:999,level:5}
  ],team:['p1','p2','p3','p4',null],activePetId:'p2',inventory:{}};

const npcArg='RANDGMQUE=4|QUEPART0=475=2-2,111=1-1|QUEPART1=1636=3-3|QUEPART2=1642=4-4|QUEPART3=999=5-5';
const task=ctx.sourceGmQueBeginFromNpcArg(npcArg,{target:state,randInclusive:(a,b)=>a});
assert.equal(task.ok,true);
assert.equal(task.taskString,'475-2&1636-3&1642-4&999-5');
assert.equal(state.quest.gmque.flag,10);
assert.equal(state.quest.gmque.nums,0);

let check=ctx.sourceGmQueCheck({target:state,count:4,randModulo:()=>41});
assert.equal(check.ok,true);
assert.equal(check.gmqueNums,41);
assert.equal(check.rewardType,'item');
assert.equal(state.quest.gmque.nums,41);

const show=ctx.sourceGmQueShowTask(state);
assert.equal(show.ok,true);
assert.equal(show.tasks.length,4);

const handed=ctx.sourceGmQueDeleteMatchedPets(check,{target:state});
assert.equal(handed.ok,true);
assert.equal(handed.deleted.length,4);
assert.equal(state.petBox.length,0);
assert.equal(state.activePetId,null);
assert.ok(state.team.every(x=>x==null));
assert.equal(state.quest.gmque.handoverComplete,true);
assert.equal(state.quest.gmque.flag,10);
assert.equal(state.quest.gmque.nums,41);

// Reward-type source boundary: gold can be claimed independently after handover and cleanup only on success.
state.quest.gmque.nums=15;
state.quest.gmque.handoverComplete=true;
ctx.cRand=(a,b)=>15;
const prize=ctx.sourceGmQueClaimPrize({target:state,randInclusive:(a,b)=>15});
assert.equal(prize.ok,true);
assert.equal(prize.type,'gold');
assert.equal(prize.gold,20000);
assert.equal(state.gold,120000);
assert.equal(state.quest.gmque.flag,0);
assert.equal(state.quest.gmque.taskString,'NULL');
assert.equal(state.quest.gmque.nums,0);
assert.equal(state.quest.gmque.handoverComplete,false);

const refillPets=()=>{
  state.petBox=[
    {id:'p1',name:'A',tempNo:475,petId:475,level:2},
    {id:'p2',name:'B',tempNo:1636,petId:1636,level:3},
    {id:'p3',name:'C',tempNo:1642,petId:1642,level:4},
    {id:'p4',name:'D',tempNo:999,petId:999,level:5}
  ];
};
// Item reward gate: fixed C persists GMQUENUMS before the backpack-capacity check.
refillPets();
state.quest.gmque={active:true,flag:10,taskString:'475-2&1636-3&1642-4&999-5',nums:0,handoverComplete:true};
ctx.sourcePlayerFindEmptyBackpackSlot=()=>-1;
const full=ctx.sourceGmQueCheck({target:state,count:4,randModulo:()=>41});
assert.equal(full.ok,false);
assert.equal(full.reason,'item-full');
assert.equal(full.gmqueNums,41);
assert.equal(state.quest.gmque.nums,41);

// Gold reward gate: fixed C also persists GMQUENUMS before the 800,000 cap blocks Check.
refillPets();
state.quest.gmque={active:true,flag:10,taskString:'475-2&1636-3&1642-4&999-5',nums:0,handoverComplete:false};
state.gold=800000;
const goldFull=ctx.sourceGmQueCheck({target:state,count:4,randModulo:()=>15});
assert.equal(goldFull.ok,false);
assert.equal(goldFull.reason,'gold-cap');
assert.equal(goldFull.gmqueNums,15);
assert.equal(state.quest.gmque.nums,15);

// Item reward handoff: deterministic resolver result must pass through the source item allocator/add path and clean only after success.
refillPets();
state.quest.gmque={active:true,flag:10,taskString:'475-2&1636-3&1642-4&999-5',nums:41,handoverComplete:true};
state.gold=100000;
ctx.sourcePlayerFindEmptyBackpackSlot=()=>15;
ctx.sourceItemRuntimeAlloc=(itemId)=>{ assert.equal(itemId,20131); return 701; };
ctx.sourcePlayerAddSpecificExistingItem=(itemIndex)=>{ assert.equal(itemIndex,701); return 15; };
ctx.sourceItemRuntimeFree=()=>true;
let itemRoll=0;
const itemPrize=ctx.sourceGmQueClaimPrize({target:state,randInclusive:(a,b)=>itemRoll++===0?1:a});
assert.equal(itemPrize.ok,true);
assert.equal(itemPrize.type,'item');
assert.equal(itemPrize.itemId,20131);
assert.equal(state.quest.gmque.flag,0);
assert.equal(state.quest.gmque.taskString,'NULL');
assert.equal(state.quest.gmque.nums,0);

// fixed C name fallback: when task TempNo differs, matching is name-based; without a source name it must fail closed.
assert.equal(ctx.sourceGmQuePetMatchesTask({name:'X',tempNo:999,petId:999,level:5},{tempNo:475,level:5},{referenceName:'X'}),true);
assert.equal(ctx.sourceGmQuePetMatchesTask({name:'X',tempNo:999,petId:999,level:5},{tempNo:475,level:5},{referenceName:null}),false);

assert.match(html,/gmqueCard/);
assert.match(game,/sourceGmQueBeginFromNpcArg/);
assert.match(game,/sourceGmQueDeleteMatchedPets/);
assert.match(game,/sourceGmQueClaimPrize/);
assert.match(readme,/V3\.10 development checkpoint — GMQUE handoff runtime/);
assert.match(changelog,/V3\.10 development checkpoint：GMQUE handoff runtime/);

console.log(JSON.stringify({pass:true,fixedSourcePin:true,rewardRuntimePinned:true,taskGeneration:true,fourPetExactMatch:true,checkLocksRewardRng:true,itemCapacityBoundary:true,goldCapBoundary:true,handoverKeepsFlag:true,goldClaimAndCleanup:true,nameFallback:true,failClosedWithoutReferenceName:true,uiHooked:true}));
