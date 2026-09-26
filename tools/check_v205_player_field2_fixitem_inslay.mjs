import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const petRuntime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const field2=JSON.parse(fs.readFileSync('data/generated/stoneage_item_field2_runtime.json','utf8'));

const rows=Object.entries(petRuntime.byId||{})
  .map(([id,row])=>({id:Number(id),...row}))
  .filter(row=>Number(row.field)===2&&Number(row.illegal)===0)
  .sort((a,b)=>a.id-b.id);

assert.deepEqual(rows.map(r=>({id:r.id,f:r.f,n:r.n})),[
  {id:200,f:'PETSKILL_Merge',n:'加工'},
  {id:201,f:'PETSKILL_Merge',n:'料理'},
  {id:540,f:'PETSKILL_Fixitem',n:'修复'},
  {id:572,f:'PETSKILL_Inslay',n:'镶宝石'}
]);

const itemRows=Object.entries(field2.byItemId||{});
const inslay=itemRows.filter(([,r])=>String(r?.typeCode||'').includes('INSLAY'));
const fixAll=itemRows.filter(([,r])=>String(r?.argument||'')==='FIXITEMALL');
const repairName=itemRows.filter(([,r])=>Array.from({length:5},(_,i)=>String(r?.['ingName'+i]||'')).some(Boolean));
assert.ok(inslay.length>0,'fixed itemset6 must contain INSLAY base templates');
assert.ok(fixAll.length>0,'fixed itemset6 must contain FIXITEMALL materials');
assert.equal(repairName.length,9437,'repair ingredient-name coverage changed');

assert.ok(game.includes("const SOURCE_FIELD2_SKILL_IDS=Object.freeze([200,201,540,572])"));
assert.ok(game.includes('function sourceField2PetSkills(pet=activePet())'));
assert.ok(game.includes("Number(meta.field)!==2||Number(meta.illegal)!==0"));
assert.ok(game.includes("if(enemy){addLog('原 C field=2 PetSkill 只能在非戰鬥狀態使用。'"));
assert.ok(game.includes("if(id===200||id===201)"));
assert.ok(game.includes("ITEM_mergeItem_merge"));
assert.ok(game.includes("完整 merge table/runtime"));
assert.ok(game.includes("維持不猜結果"));
assert.ok(game.includes("sourceRuntimePending:true"));

const fixStart=game.indexOf('function sourceUsePetFixitem(selected)');
const fixEnd=game.indexOf('function sourceApplyPetInslayMaterial',fixStart);
assert.ok(fixStart>=0&&fixEnd>fixStart);
const fix=game.slice(fixStart,fixEnd);
assert.ok(fix.includes("selected.length>2"));
assert.ok(fix.includes("if(type===20)"));
assert.ok(game.includes("return (type>=0&&type<=15)||type===17||type===18||type===19;"));
assert.ok(fix.includes("sourceItemField2Char(material.existing,'ingName0')"));
for(let i=0;i<5;i++)assert.ok(fix.includes("'ingName'+i"));
assert.ok(fix.includes("sourceItemField2Char(material.existing,'argument')==='FIXITEMALL'"));
assert.ok(fix.includes("crush>=maxCrush*0.80"));
assert.ok(fix.includes("maxCrush<500"));
assert.ok(fix.includes("crush<=0"));
assert.ok(fix.includes("const repairedMax=Math.trunc(maxCrush*0.85)"));
assert.ok(fix.includes("sourceItemRuntimeSetDataInt(target.existing,'ITEM_DAMAGECRUSHE',repairedMax)"));
assert.ok(fix.includes("sourceItemRuntimeSetDataInt(target.existing,'ITEM_MAXDAMAGECRUSHE',repairedMax)"));
assert.ok(fix.includes("sourceItemRuntimeSetDataInt(target.existing,'ITEM_CRUSHLEVEL',0)"));
assert.ok(fix.includes("secret.split('(')[0]"));
assert.ok(fix.includes("sourceConsumeTrackedExistingItem(material.itemIndex)"));

const consumeStart=game.indexOf('function sourceConsumeTrackedExistingItem(itemIndex)');
const consumeEnd=game.indexOf('function sourceField2FixTargetType',consumeStart);
assert.ok(consumeStart>=0&&consumeEnd>consumeStart);
const consume=game.slice(consumeStart,consumeEnd);
assert.ok(consume.includes("sourceItemRuntimeResolvedDataInt(existing,'ITEM_USEPILENUMS')"));
assert.ok(consume.includes("if(pile==null||pile<1)return false"));
assert.ok(consume.includes("if(pile>1)"));
assert.ok(consume.includes("sourceItemRuntimeSetDataInt(existing,'ITEM_USEPILENUMS',pile-1)"));
assert.ok(consume.includes("sourceItemRuntimeFree(itemIndex)"));
assert.ok(consume.includes("let freed=false"));
assert.ok(consume.includes("if(freed&&Number.isFinite(itemId))"));
assert.ok(consume.indexOf("sourceItemRuntimeSetDataInt(existing,'ITEM_USEPILENUMS',pile-1)") <
          consume.indexOf("sourceItemRuntimeFree(itemIndex)"),
          'stack decrement branch must precede free branch');
assert.ok(consume.indexOf("if(freed&&Number.isFinite(itemId))") >
          consume.indexOf("sourceItemRuntimeFree(itemIndex)"),
          'aggregate inventory must decrement only after the existing item is actually freed');

const inlayStart=game.indexOf('function sourceApplyPetInslayMaterial(target,material)');
const inlayEnd=game.indexOf('function sourceUsePetInslay(selected)',inlayStart);
assert.ok(inlayStart>=0&&inlayEnd>inlayStart);
const inlay=game.slice(inlayStart,inlayEnd);
assert.ok(inlay.includes("if(!code||code==='NULL')"));
assert.ok(inlay.includes("const parts=['NULL','NULL','NULL']"));
assert.ok(inlay.includes("const open=parts.findIndex(x=>x==='NULL')"));
assert.ok(inlay.includes("sourceItemField2SetChar(target.existing,'inlayCode',parts.join('|'))"));

const expectedAddFields=[
  'ITEM_MODIFYATTACK','ITEM_MODIFYDEFENCE','ITEM_MODIFYQUICK','ITEM_MODIFYHP',
  'ITEM_MODIFYMP','ITEM_MODIFYLUCK','ITEM_OTHERDAMAGE','ITEM_OTHERDEFC'
];
const fieldConstStart=game.indexOf('const SOURCE_INSLAY_ADD_FIELDS=Object.freeze([');
const fieldConstEnd=game.indexOf(']);',fieldConstStart);
const fieldConst=game.slice(fieldConstStart,fieldConstEnd+3);
for(const field of expectedAddFields)assert.ok(fieldConst.includes("'"+field+"'"));
assert.equal(expectedAddFields.filter(f=>fieldConst.includes("'"+f+"'")).length,8);

assert.ok(inlay.includes("materialMagic!=null&&materialMagic>0"));
assert.ok(inlay.includes("ITEM_MAGICID"));
assert.ok(inlay.includes("ITEM_MAGICUSEMP"));
assert.ok(inlay.includes("sourceItemField2SetFunction(target.existing,key,sourceItemField2Function(material.existing,key))"));
assert.ok(inlay.includes("sourceItemField2SetChar(target.existing,'argument'"));
assert.ok(inlay.includes('field2EffectStringNeedsSourceMagicName=true'));
assert.equal(inlay.includes('MAGIC_getChar'),false,'web must not invent unavailable localized magic name');

const useInlayStart=game.indexOf('function sourceUsePetInslay(selected)');
const useInlayEnd=game.indexOf('function giveTrackedItemFromExisting',useInlayStart);
assert.ok(useInlayStart>=0&&useInlayEnd>useInlayStart);
const useInlay=game.slice(useInlayStart,useInlayEnd);
assert.ok(useInlay.includes('selected.length>4'));
assert.ok(useInlay.includes("if(!code||code==='NULL')"));
assert.ok(useInlay.includes("code.includes('INSLAY')"));
assert.ok(useInlay.includes('sourceApplyPetInslayMaterial(target,material)'));
assert.ok(useInlay.includes('sourceConsumeTrackedExistingItem(material.itemIndex)'));
assert.ok(useInlay.indexOf('sourceApplyPetInslayMaterial(target,material)') <
          useInlay.indexOf('sourceConsumeTrackedExistingItem(material.itemIndex)'),
          'each material must mutate first, then be deleted like fixed C');
assert.ok(useInlay.includes('partial:applied.length>0'));
assert.equal(useInlay.includes('rollback'),false,'fixed Inslay has no transaction rollback');

assert.ok(game.includes('existing.field2Functions'));
assert.ok(game.includes("callbacks.initFunc=String(existing.field2Functions.init"));
assert.ok(game.includes("callbacks.attachFunc=String(existing.field2Functions.attach"));
assert.ok(game.includes("callbacks.detachFunc=String(existing.field2Functions.detach"));

assert.ok(html.includes('id="sourceField2SkillPanel"'));
assert.ok(html.includes('id="sourceField2SelectionStatus"'));
assert.ok(html.includes('id="sourceField2SkillActions"'));
assert.ok(game.includes('data-source-item-action="field2-select"'));
assert.ok(game.includes("action==='field2-use'"));
assert.ok(game.includes("action==='field2-clear'"));

// Selection is restricted to the existing-item backpack, not equipped slots.
assert.ok(game.includes("if(slot<PLAYER_BACKPACK_START||slot>=PLAYER_ITEM_SLOT_COUNT)return"));

// Large field2 runtime stays lazy-loaded.
const bootStart=game.indexOf('async function boot()');
assert.ok(bootStart>=0);
assert.equal(game.slice(bootStart).includes('fetch(ITEM_FIELD2_RUNTIME_URL'),false);

console.log(JSON.stringify({
  pass:true,
  version:'V2.05',
  focus:'player-field2-fixitem-inslay',
  field2Skills:rows.map(r=>r.id),
  inslayTemplates:inslay.length,
  fixAllMaterials:fixAll.length,
  repairIngredientTemplates:repairName.length
}));
