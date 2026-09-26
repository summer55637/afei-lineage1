import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));
const gmque=JSON.parse(fs.readFileSync('data/generated/stoneage_gmque_trophy_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');

assert.equal(runtime.format,'stoneage-item-make-runtime-v2');
assert.equal(runtime.itemDataIntCount,66);
assert.equal(runtime.fixedBuild.itemIdTokenIndex,17);
assert.equal(runtime.stats.templates,10737);
assert.equal(runtime.stats.syntaxErrors,0);
assert.equal(runtime.stats.duplicateIdsIgnored,0);
assert.equal(runtime.stats.weaponTemplatesCrossChecked,8);
assert.equal(runtime.stats.relifeTemplatesCrossChecked,5);
assert.equal(runtime.source.gitBlobSha,'eac985796b59286c547db2abce7b3d604a5e6226');

const order=runtime.itemDataIntOrder;
const idx=Object.fromEntries(order.map((name,i)=>[name,i]));
assert.equal(idx.ITEM_ID,0);
assert.equal(idx.ITEM_MAGICUSEMP,33);
assert.equal(idx.ITEM_LEAKLEVEL,59);

function expand(itemId){
  const row=runtime.byItemId[String(itemId)];
  assert.ok(row, `missing template ${itemId}`);
  const base=runtime.defaultData.map(Number);
  const widths=Array(runtime.itemDataIntCount).fill(0);
  for(const [pairs,target,nonnegative] of [[row.b,base,false],[row.w,widths,true]]){
    assert.ok(Array.isArray(pairs)&&pairs.length%2===0);
    for(let i=0;i<pairs.length;i+=2){
      const field=Number(pairs[i]),value=Number(pairs[i+1]);
      assert.ok(Number.isInteger(field)&&field>=0&&field<66);
      assert.ok(Number.isInteger(value));
      if(nonnegative)assert.ok(value>=0);
      target[field]=value;
    }
  }
  assert.equal(base[idx.ITEM_ID],Number(itemId));
  return {base,widths};
}
function simulateMake(itemId){
  const {base,widths}=expand(itemId);
  const calls=[];
  const data=base.slice();
  for(let i=0;i<66;i++){
    const width=widths[i];
    calls.push({field:i,width});
    const deterministicRoll=0;
    data[i]+=deterministicRoll;
  }
  data[idx.ITEM_LEAKLEVEL]=1;
  return {calls,data,widths};
}

const itemPool=gmque.itemReward.pools.find(pool=>pool.name==='itemID1');
assert.ok(itemPool);
assert.equal(itemPool.ids[0],20131);
const doll=simulateMake(20131);
assert.equal(doll.calls.length,66,'GMQUE 20131 must consume all 66 item-create RNG calls');
assert.equal(doll.data[idx.ITEM_ID],20131);
assert.equal(doll.data[idx.ITEM_LEAKLEVEL],1);

let variableTemplate=null;
for(const [itemId,row] of Object.entries(runtime.byItemId)){
  if(Array.isArray(row.w)&&row.w.length){
    variableTemplate={itemId,row};
    break;
  }
}
assert.ok(variableTemplate,'expected at least one min!=max item template');
const variable=simulateMake(variableTemplate.itemId);
assert.equal(variable.calls.length,66);
assert.ok(variable.calls.some(call=>call.width>0),'variable template must preserve a nonzero randomwidth');
assert.ok(variable.calls.some(call=>call.width===0),'zero-width fields must still remain in the 66-call loop');

function functionSlice(name,nextName){
  const start=game.indexOf(`function ${name}(`);
  assert.ok(start>=0,`missing function ${name}`);
  const end=nextName?game.indexOf(`function ${nextName}(`,start+1):-1;
  return end>start?game.slice(start,end):game.slice(start);
}
function assertOrdered(haystack,needles,label){
  let at=-1;
  for(const needle of needles){
    const next=haystack.indexOf(needle,at+1);
    assert.ok(next>at,`${label}: missing/out-of-order ${needle}`);
    at=next;
  }
}

const dropFn=functionSlice('rollEnemyDropSlots','makeEnemyUnit');
assertOrdered(dropFn,[
  'for(let i=0;i<10;i++)',
  'probabilityRoll=cRand(0,999)',
  'sourceItemRuntimeAlloc(itemId'
],'Enemy drop per-slot order');

const enemyFn=functionSlice('makeEnemyUnit','makeEnemyGroup');
assertOrdered(enemyFn,[
  'rollEnemyDropSlots(raw,unitId)',
  'sourceItemRuntimeAlloc(styleWeaponId',
  'applyEnemyRandomChange(',
  'sourceItemRuntimeAlloc(dojoWeaponId',
  'sourceEnemyWeaponCompliance('
],'Enemy create RNG order');

const allocFn=functionSlice('sourceItemRuntimeAlloc','sourceItemRuntimeFree');
assertOrdered(allocFn,[
  'sourceMakeItemData(normalizedItemId)',
  'normalizeItemRuntime(state.itemRuntime)',
  'for(let guard=0;guard<rt.itemnum;guard++)'
],'ITEM_makeItemAndRegist order');

const makeFn=functionSlice('sourceMakeItemData','sourceItemRelifeTemplate');
assert.ok(makeFn.includes('for(let i=0;i<calls;i++)'));
assert.ok(makeFn.includes('cRand(0,width)'));
assert.ok(makeFn.includes('data[i]+=cRand(0,width)'));

console.log(JSON.stringify({
  pass:true,
  templates:runtime.stats.templates,
  randomizedTemplates:runtime.stats.randomizedTemplates,
  nonzeroRandomWidthFields:runtime.stats.nonzeroRandomWidthFields,
  gmque20131Calls:doll.calls.length,
  gmque20131NonzeroWidths:doll.widths.filter(width=>width>0).length,
  variableTemplateId:Number(variableTemplate.itemId),
  enemyOrder:'drop -> style item -> ENEMY_RandomChange -> dojo replacement -> compliance'
}));
