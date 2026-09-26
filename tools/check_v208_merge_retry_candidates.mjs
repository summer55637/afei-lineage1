import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync('game.js','utf8');
const field2=JSON.parse(fs.readFileSync('data/generated/stoneage_item_field2_runtime.json','utf8'));
const itemMake=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));
const pet=JSON.parse(fs.readFileSync('data/generated/stoneage_pet_merge_fix_runtime.json','utf8'));

assert.equal(itemMake.fixedBuild?.improveItemTable,false);
assert.equal(pet.source?.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.deepEqual(pet.mergeMath?.itemSearchTable,[[0.8,1.2],[0.7,1.3]]);
assert.deepEqual(pet.mergeMath?.retryThresholds,[
  [0],[250,0],[400,150,0],[700,260,70,0],[740,500,200,40,0]
]);
assert.equal(pet.mergeMath?.maxMatch,2048);
assert.equal(pet.mergeMath?.outerMergeAttempts,5);

const idx=Object.fromEntries(itemMake.itemDataIntOrder.map((name,i)=>[name,i]));
function template(id){
  const row=itemMake.byItemId[String(id)];
  assert.ok(row,'template '+id);
  const base=itemMake.defaultData.map(Number);
  for(let i=0;i<(row.b||[]).length;i+=2)base[row.b[i]]=row.b[i+1];
  return base;
}

const candidates=[];
let withResolvedIngredients=0,canMergeTo=0,canMergeToNoResolvedIngredients=0;
let resolvedIngredientEntries=0,unknownIngredientOccurrences=0,maxIngUse=0;
const byIngUse={1:0,2:0,3:0,4:0,5:0};
for(const key of Object.keys(itemMake.byItemId).sort((a,b)=>Number(a)-Number(b))){
  const id=Number(key),base=template(id),row=field2.byItemId[key]||{};
  const ingredients=[];
  for(let i=0;i<5;i++){
    const name=row['ingName'+i]||'';
    if(!name)continue;
    const atomIndex=pet.atomIndexByByteName?.[name];
    if(atomIndex==null){unknownIngredientOccurrences++;continue}
    ingredients.push({atomIndex:Number(atomIndex),value:Number(base[idx['ITEM_INGVALUE'+i]])});
    resolvedIngredientEntries++;
  }
  if(ingredients.length){withResolvedIngredients++;maxIngUse=Math.max(maxIngUse,ingredients.length)}
  const cmt=Number(base[idx.ITEM_CANMERGETO])===1;
  if(cmt)canMergeTo++;
  if(!cmt)continue;
  if(!ingredients.length){canMergeToNoResolvedIngredients++;continue}
  byIngUse[ingredients.length]++;
  candidates.push({id,inguse:ingredients.length,ingredients});
}
assert.equal(Object.keys(itemMake.byItemId).length,10737);
assert.equal(withResolvedIngredients,9437);
assert.equal(canMergeTo,5808);
assert.equal(candidates.length,5804);
assert.equal(canMergeToNoResolvedIngredients,4);
assert.equal(resolvedIngredientEntries,31518);
assert.equal(unknownIngredientOccurrences,0);
assert.equal(maxIngUse,5);
assert.deepEqual(byIngUse,{1:11,2:270,3:1278,4:2892,5:1353});

const rows=pet.mergeMath.itemRandTableForItem;
function tableNum(value){
  const n=Math.trunc(value);
  for(let i=0;i<rows.length;i++)if(n<=Number(rows[i].maxnum))return i;
  return rows.length-1;
}
function candidateHits(input,searchtable,inputIds=[]){
  const work=input.map(x=>({...x}));
  const inputSet=new Set(inputIds);
  const byExtract={1:[],2:[],3:[],4:[],5:[]};
  const [searchMin,searchMax]=pet.mergeMath.itemSearchTable[searchtable];
  const foodCap=searchtable===1?Math.trunc(rows[9].maxnum/searchMax):null;
  for(const c of candidates){
    let hitnum=0;
    for(const ci of c.ingredients){
      for(let k=0;k<work.length;k++){
        if(ci.atomIndex!==work[k].atomIndex)continue;
        if(searchtable===0){
          const rate=rows[tableNum(work[k].value)].rate;
          let top=work[k].value*rate;if(top>1000)top=1000;
          if(ci.value<=top&&ci.value>=work[k].value*(1/rate)){hitnum++;break}
        }else{
          if(work[k].value>foodCap)work[k].value=foodCap;
          if(ci.value<=work[k].value*searchMax&&ci.value>=work[k].value*searchMin){hitnum++;break}
        }
      }
    }
    if(hitnum===c.inguse&&!inputSet.has(c.id))byExtract[c.inguse].push(c.id);
  }
  return {byExtract,work};
}
const p305=candidateHits([
  {atomIndex:4,value:305},{atomIndex:2,value:305},{atomIndex:5,value:305}
],0);
assert.deepEqual(p305.byExtract[3],[2106]);
assert.equal(p305.byExtract[1].length+p305.byExtract[2].length+p305.byExtract[4].length+p305.byExtract[5].length,0);

const food=candidateHits([{atomIndex:26,value:900}],1);
assert.deepEqual(food.byExtract[1],[2506]);
assert.deepEqual(food.work,[{atomIndex:26,value:814}]);

function extract(ingnum,r){
  const ideal=Math.min(5,ingnum),row=pet.mergeMath.retryThresholds[ideal-1];
  let i=0;for(;i<ideal;i++)if(r>=row[i])break;
  return ideal-i;
}
function rollCounts(ideal){
  const out={};for(let r=0;r<1000;r++){const e=extract(ideal,r);out[e]=(out[e]||0)+1}return out;
}
assert.deepEqual(rollCounts(1),{1:1000});
assert.deepEqual(rollCounts(2),{1:250,2:750});
assert.deepEqual(rollCounts(3),{1:150,2:250,3:600});
assert.deepEqual(rollCounts(4),{1:70,2:190,3:440,4:300});
assert.deepEqual(rollCounts(5),{1:40,2:160,3:300,4:240,5:260});

for(const fn of [
  'function sourceItemMakeTemplateInt(itemId,fieldName)',
  'function sourceMergeCandidateCache()',
  'function sourceMergeCandidateHitPlan(ingEntries,searchtable,inputItemIds=[])',
  'function sourceMergeRetryExtractNum(ingnum,roll)',
  'function sourceMergeRetrySpec(ingnum)'
])assert.ok(game.includes(fn),fn);
assert.ok(game.includes('let sourceMergeCandidateCacheMemo=null;'));

const cacheStart=game.indexOf('function sourceMergeCandidateCache()');
const hitStart=game.indexOf('function sourceMergeCandidateHitPlan',cacheStart);
const cacheCode=game.slice(cacheStart,hitStart);
assert.ok(cacheCode.includes("'ITEM_CANMERGETO'"));
assert.ok(cacheCode.includes("'ITEM_INGVALUE'+i"));
assert.ok(cacheCode.includes('sourceMergeAtomIndexByByteName(name)'));
assert.ok(cacheCode.includes('unknownIngredientOccurrences++'));
assert.ok(cacheCode.includes('canMergeToNoResolvedIngredients++'));

const hitEnd=game.indexOf('function sourceMergeRetryExtractNum',hitStart);
const hitCode=game.slice(hitStart,hitEnd);
assert.ok(hitCode.includes('if(top>1000)top=1000'));
assert.ok(hitCode.includes('Math.trunc(Number(rows[9]?.maxnum)/searchMax)'));
assert.ok(hitCode.includes('if(work[k].value>foodCap)work[k].value=foodCap'));
assert.ok(hitCode.includes('hitnum!==candidate.inguse'));
assert.ok(hitCode.includes('inputSet.has(candidate.id)'));
assert.ok(hitCode.includes("reason:'maxmatch-overflow-no-guess'"));
assert.ok(hitCode.includes('sourceFirstPassHitnumCached:true'));

const retryStart=game.indexOf('function sourceMergeRetryExtractNum');
const prepStart=game.indexOf('function sourceMergePrepareStatic',retryStart);
const retryCode=game.slice(retryStart,prepStart);
assert.ok(retryCode.includes('if(r>=Math.trunc(Number(row[extractIndex])))break'));
assert.ok(retryCode.includes('duplicateClassRollsConsumeRng:true'));
assert.ok(retryCode.includes('laterPassesReuseHitnum:true'));
assert.ok(retryCode.includes("finalSelection:'random()%match'"));
assert.ok(retryCode.includes('sourceNoRngConsumed:true'));

const gateStart=game.indexOf('if(id===200||id===201)');
const gateEnd=game.indexOf('try{await sourceEnsureItemField2Db()}',gateStart);
const gate=game.slice(gateStart,gateEnd);
assert.ok(gate.includes('const candidateCache=sourceMergeCandidateCache()'));
assert.ok(gate.includes('const retrySpec=sourceMergeRetrySpec(prepared.atoms.length)'));
assert.ok(gate.includes('mergeCandidatePrepared:true'));
assert.ok(gate.includes('candidateStats:candidateCache.stats'));
assert.ok(gate.includes('實際候選 hitnum/成品抽選'));
assert.equal(gate.includes('cRand('),false,'V2.08 remains plan-only');

console.log(JSON.stringify({
  pass:true,version:'V2.08',focus:'merge-with-retry-candidate-plan',
  templates:10737,canMergeTo,candidates:candidates.length,byIngUse,
  examples:{processing305:p305.byExtract[3],cooking900:food.byExtract[1],foodClamp:food.work[0].value},
  retry5:rollCounts(5)
}));
