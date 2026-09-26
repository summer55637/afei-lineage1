import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync('game.js','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_pet_merge_fix_runtime.json','utf8'));

assert.equal(runtime.format,'stoneage-pet-merge-fix-runtime-v1');
assert.equal(runtime.source?.repository,'gavinlinasd/StoneAge');
assert.equal(runtime.source?.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.equal(runtime.source?.enemybaseGitBlobSha,'a19a508975e3a982fada323861b35b2edab79349');
assert.equal(runtime.source?.itematomGitBlobSha,'85ecfbf543b85b269e6177921f76a587d969ea26');
assert.equal(runtime.fixedBuild?.mergeNew8,false);
assert.equal(runtime.fixedBuild?.fmver21,true);
assert.equal(runtime.fixedBuild?.itemRandRangeDomBase,0);
assert.equal(runtime.fixedBuild?.itemRandRangeDom,1000);
assert.equal(runtime.fixedBuild?.fmRandRangeDom,4000);
assert.equal(runtime.fixedBuild?.maxItemAtomsSize,256);
assert.equal(runtime.semantics?.outerPasses,5);

assert.deepEqual(runtime.stats,{
  enemybaseRows:1816,
  uniqueTempNo:1813,
  duplicateTempNoIgnored:3,
  rowsWithConfiguredFix:980,
  configuredSlots:4602,
  resolvedSlots:4572,
  unresolvedSlots:30,
  swappedRanges:2,
  itemAtomCount:112,
  itemAtomDuplicateNames:0,
  expandedResolvedEntries:22860,
  abortedOuterPasses:75
});

assert.deepEqual(runtime.byTempNo['1']?.slots,[
  {slot:1,name:'石',atomIndex:1,baseAdd:0,fixMin:700,fixMax:700},
  {slot:2,name:'木',atomIndex:2,baseAdd:0,fixMin:700,fixMax:700},
  {slot:3,name:'皮',atomIndex:5,baseAdd:0,fixMin:700,fixMax:700},
  {slot:4,name:'骨',atomIndex:3,baseAdd:0,fixMin:700,fixMax:700},
  {slot:5,name:'线',atomIndex:6,baseAdd:0,fixMin:700,fixMax:700}
]);

const row600=runtime.byTempNo['600'];
assert.deepEqual(row600?.slots.map(x=>[x.slot,x.name,x.atomIndex,x.baseAdd,x.fixMin,x.fixMax]),[
  [1,'石',1,100,1,2],
  [2,'木',2,100,1,2],
  [3,'线',6,100,1,2],
  [4,'加特洛',null,-500,0,0],
  [5,'美鲁娜',null,-500,0,0]
]);

function expand(row){
  const out=[];
  outerPass:
  for(let pass=0;pass<5;pass++){
    for(const slot of row?.slots||[]){
      if(slot.atomIndex==null)continue outerPass;
      out.push({pass,slot:slot.slot,atomIndex:slot.atomIndex});
    }
  }
  return out;
}
assert.equal(expand(runtime.byTempNo['1']).length,25,'five source passes must duplicate all five valid slots');
assert.equal(expand(row600).length,15,'unknown slot 4 must abort each pass before slot 5');
assert.equal(expand(row600).some(x=>x.slot===5),false);

assert.ok(game.includes("const PET_MERGE_FIX_RUNTIME_URL='data/generated/stoneage_pet_merge_fix_runtime.json'"));
assert.ok(game.includes('async function sourceEnsurePetMergeFixDb()'));
assert.ok(game.includes("data?.format!=='stoneage-pet-merge-fix-runtime-v1'"));
assert.ok(game.includes("Math.trunc(Number(data?.stats?.uniqueTempNo))!==1813"));
assert.ok(game.includes('function sourcePetMergeFixTemplate(pet=activePet())'));
assert.ok(game.includes('const petId=Math.trunc(Number(pet?.petId))'));
assert.ok(game.includes('function sourcePetMergeFixEntries(pet=activePet())'));
assert.ok(game.includes('outerPass:'));
assert.ok(game.includes('if(raw?.atomIndex==null)continue outerPass'));
assert.ok(game.includes('for(let pass=0;pass<5;pass++)'));

const mergeGateStart=game.indexOf('if(id===200||id===201)');
const mergeGateEnd=game.indexOf('try{await sourceEnsureItemField2Db()}',mergeGateStart);
assert.ok(mergeGateStart>=0&&mergeGateEnd>mergeGateStart);
const mergeGate=game.slice(mergeGateStart,mergeGateEnd);
assert.ok(mergeGate.includes('await sourceEnsurePetMergeFixDb()'));
assert.ok(mergeGate.includes('sourcePetMergeFixEntries(activePet())'));
assert.ok(mergeGate.includes('petMergeFixReady:true'));
assert.ok(mergeGate.includes("完整 merge table/runtime"));
assert.ok(mergeGate.includes("維持不猜結果"));
assert.ok(mergeGate.includes('sourceRuntimePending:true'));

// This source layer stays lazy like the V2.04 item field2 runtime.
const bootStart=game.indexOf('async function boot()');
assert.ok(bootStart>=0);
assert.equal(game.slice(bootStart).includes('fetch(PET_MERGE_FIX_RUNTIME_URL'),false);

console.log(JSON.stringify({
  pass:true,
  version:'V2.06',
  focus:'pet-merge-fix-source-runtime',
  uniqueTempNo:runtime.stats.uniqueTempNo,
  rowsWithFix:runtime.stats.rowsWithConfiguredFix,
  configuredSlots:runtime.stats.configuredSlots,
  resolvedSlots:runtime.stats.resolvedSlots,
  unresolvedSlots:runtime.stats.unresolvedSlots,
  expandedResolvedEntries:runtime.stats.expandedResolvedEntries,
  abortedOuterPasses:runtime.stats.abortedOuterPasses
}));
