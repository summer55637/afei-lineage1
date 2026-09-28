import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync('game.js','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_pet_merge_fix_runtime.json','utf8'));

assert.equal(runtime.format,'stoneage-pet-merge-fix-runtime-v1');
assert.equal(Object.keys(runtime.atomIndexByByteName||{}).length,112);

// V2.04 item field2 strings use latin1 byte-preserving transport.
// These are the raw gb18030 bytes interpreted as U+00xx codepoints.
assert.equal(runtime.atomIndexByByteName['Ê¯'],0); // 石 CA AF
assert.equal(runtime.atomIndexByByteName['Ä¾'],1); // 木 C4 BE
assert.equal(runtime.atomIndexByByteName['¹Ç'],2); // 骨 B9 C7
assert.equal(runtime.atomIndexByByteName['Ïß'],5); // 线 CF DF

const math=runtime.mergeMath;
assert.equal(math.itemGenRate,0.7);
assert.deepEqual(math.itemRandNums,[10,30,65,125,205,305,425,565,725,905,1125,1354,1594,1825,2105,2405,2725,3065,3425,3805]);
assert.deepEqual(math.itemRandTable,[[700,1300],[900,1100]]);
assert.deepEqual(math.oddsTable,[0.1,0.25,0.35,0.4,0.42,0.44,0.46,0.47,0.48,0.49,0.5,0.51,0.52,0.53]);
assert.deepEqual(math.mergeRangeWidth,{min:0.87,max:1.05});
assert.equal(math.randDom,1000);

const expectedMax=[24,54,107,181,275,389,523,677,851,1059,1285,1522,1755,2021,2315,2629,2963,3317,3691,4000];
const expectedMin=[0,25,55,108,182,276,390,524,678,852,1060,1286,1523,1756,2022,2316,2630,2964,3318,3692];
assert.equal(math.itemRandTableForItem.length,20);
for(let i=0;i<20;i++){
  const row=math.itemRandTableForItem[i];
  assert.equal(row.num,math.itemRandNums[i]);
  assert.equal(row.minnum,expectedMin[i]);
  assert.equal(row.maxnum,expectedMax[i]);
  assert.equal(row.rate,row.maxnum/row.num);
}

for(const fn of [
  'function sourceMergeAtomIndexByByteName(name)',
  'function sourceMergeTableNum(value)',
  'function sourceMergeCRint(value)',
  'function sourceMergeRandRangePlan(base,minRate,maxRate)',
  'function sourceMergeSimplifyValues(values,{petPresent=true,petFamily=false}={})',
  'function sourceMergeCollectStaticAtoms(selected)',
  'function sourceMergeRatePlan(atomIndex,simplified,searchtable,petFixEntries)',
  'function sourceMergePrepareStatic(selected,pet=activePet())'
])assert.ok(game.includes(fn),fn);

const simplifyStart=game.indexOf('function sourceMergeSimplifyValues');
const collectStart=game.indexOf('function sourceMergeCollectStaticAtoms',simplifyStart);
const simplify=game.slice(simplifyStart,collectStart);
assert.ok(simplify.includes('data.sort((a,b)=>a-b)'));
assert.ok(simplify.includes('sourceMergeTableNum(data[j-1])'));
assert.ok(simplify.includes('rowRate/baseRate'));
assert.ok(simplify.includes('data[j]+=data[j-1]*Number(odds[j-1])*rate'));
assert.ok(simplify.includes('Math.trunc(data[data.length-1])'));
assert.ok(simplify.includes("reason:'simplify-odds-oob'"));
assert.ok(simplify.includes('?Math.trunc(Number(petMergeFixDb?.fixedBuild?.fmRandRangeDom)||4000)'));
assert.ok(simplify.includes(':1000'));

const collectEnd=game.indexOf('function sourceMergeRatePlan',collectStart);
const collect=game.slice(collectStart,collectEnd);
assert.ok(collect.includes('sort((a,b)=>Math.trunc(Number(a?.slotIndex))-Math.trunc(Number(b?.slotIndex)))'));
assert.ok(collect.includes("'ITEM_CANMERGEFROM'"));
assert.ok(collect.includes("'ITEM_TYPE'"));
assert.ok(collect.includes("itemType===20&&type!==20"));
assert.ok(collect.includes("itemType!==20&&type===20"));
assert.ok(collect.includes("sourceItemField2Char(entry.existing,'ingName'+i)"));
assert.ok(collect.includes('sourceMergeAtomIndexByByteName(name)'));
assert.ok(collect.includes("continue itemLoop"));
assert.ok(collect.includes("'ITEM_INGVALUE'+i"));
assert.ok(collect.includes('searchtable:itemType===20?1:0'));

const randStart=game.indexOf('function sourceMergeRandRangePlan');
const randEnd=game.indexOf('function sourceMergeSimplifyValues',randStart);
const randFn=game.slice(randStart,randEnd);
assert.ok(randFn.includes('sourceMergeCRint((b/dom)*lo)'));
assert.ok(randFn.includes("mode:'zero'"));
assert.ok(randFn.includes("mode:'base'"));
assert.ok(randFn.includes("mode:'negative-range-zero'"));
assert.ok(randFn.includes("mode:'rng'"));
assert.ok(randFn.includes('rngCalls:1'));

const rateStart=game.indexOf('function sourceMergeRatePlan');
const prepStart=game.indexOf('function sourceMergePrepareStatic',rateStart);
const rate=game.slice(rateStart,prepStart);
assert.ok(rate.includes('(1/rate)*Number(rangeWidth.min)*fixMin'));
assert.ok(rate.includes('rate*Number(rangeWidth.max)*fixMax'));
assert.ok(rate.includes("dishTable[1]?.[0])*fixMin/1000"));
assert.ok(rate.includes("dishTable[1]?.[1])*fixMin/1000"));
assert.ok(rate.includes('(1/rate)*Number(rangeWidth.min)*1000'));
assert.ok(rate.includes('rate*Number(rangeWidth.max)*1000'));

const prepEnd=game.indexOf('function sourceItemField2Template',prepStart);
const prep=game.slice(prepStart,prepEnd);
assert.ok(prep.includes('sourceMergeSimplifyValues(bucket.values,{petPresent:true,petFamily:false})'));
assert.ok(prep.includes('sourceMergeRatePlan(bucket.atomIndex,simplified.value,collected.searchtable,petFixEntries)'));
assert.ok(prep.includes('deferredMakeItemRngCalls'));
assert.ok(prep.includes('plannedAtomRandCalls'));
assert.ok(prep.includes('sourceNoRngConsumed:true'));
assert.equal(prep.includes('cRand('),false,'V2.07 is plan-only and must not consume RNG');

// Pure math representative checks independently mirror fixed C.
function tableNum(value){
  const n=Math.trunc(value);
  for(let i=0;i<math.itemRandTableForItem.length;i++)if(n<=math.itemRandTableForItem[i].maxnum)return i;
  return math.itemRandTableForItem.length-1;
}
function simplifyExample(values){
  const d=[...values].sort((a,b)=>a-b);
  for(let j=1;j<d.length;j++){
    const t=tableNum(d[j-1]);
    const ratio=math.itemRandTableForItem[t].rate/math.itemRandTableForItem[0].rate;
    d[j]+=d[j-1]*math.oddsTable[j-1]*ratio;
  }
  return Math.min(1000,Math.trunc(d[d.length-1]));
}
assert.equal(simplifyExample([10,20,30]),35);
assert.equal(simplifyExample([100,200]),206);
assert.equal(simplifyExample([900,900]),943);
assert.equal(simplifyExample([1000,1000]),1000);
assert.equal(tableNum(24),0);
assert.equal(tableNum(25),1);
assert.equal(tableNum(4001),19);

// V2.07 still owns the pure simplify/range plan. V2.10 now consumes that plan through
// the live lifecycle, so only verify that the live gate loads both fixed runtimes and delegates.
const gateStart=game.indexOf('if(id===200||id===201)');
const gateEnd=game.indexOf('try{await sourceEnsureItemField2Db()}',gateStart);
const gate=game.slice(gateStart,gateEnd);
assert.ok(gate.includes('await sourceEnsurePetMergeFixDb()'));
assert.ok(gate.includes('await sourceEnsureItemField2Db()'));
assert.ok(gate.includes('sourceMergeExecuteLifecycle(selected,activePet())'));
assert.ok(game.includes('sourceMergePrepareClones(cloned.clones,pet)'));

console.log(JSON.stringify({
  pass:true,
  version:'V2.07',
  focus:'merge-simplify-table-rand-plan',
  atomByteNames:Object.keys(runtime.atomIndexByByteName).length,
  tableRows:math.itemRandTableForItem.length,
  odds:math.oddsTable.length,
  examples:{a:simplifyExample([10,20,30]),b:simplifyExample([100,200]),c:simplifyExample([900,900]),cap:simplifyExample([1000,1000])}
}));
