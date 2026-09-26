import assert from 'node:assert/strict';
import fs from 'node:fs';

const field2=JSON.parse(fs.readFileSync('data/generated/stoneage_item_field2_runtime.json','utf8'));
const pets=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));

assert.equal(field2.format,'stoneage-item-field2-runtime-v1');
assert.equal(field2.source?.repository,'gavinlinasd/StoneAge');
assert.equal(field2.source?.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.equal(field2.source?.path,'gmsv/data/itemset6.txt');
assert.equal(field2.source?.gitBlobSha,'eac985796b59286c547db2abce7b3d604a5e6226');
assert.match(String(field2.source?.legacyEncodingReadMode||''),/latin1-byte-preserving/);

assert.equal(field2.fixedBuild?.itemInslay,true);
assert.equal(field2.fixedBuild?.petskillFixitem,true);
assert.equal(field2.fixedBuild?.itemFixAllBase,true);
assert.equal(field2.fixedBuild?.itemPileNums,true);
assert.equal(field2.fixedBuild?.petskill2Txt,true);

assert.deepEqual(field2.semantics?.field2Skills,[200,201,540,572]);
assert.deepEqual(field2.semantics?.stringFields,[
  'secretName','effectString','argument','typeCode','inlayCode',
  'ingName0','ingName1','ingName2','ingName3','ingName4'
]);
assert.deepEqual(field2.semantics?.functionFields,[
  'init','preOver','postOver','watch','use','attach','detach','drop','pickup','relife'
]);

assert.equal(field2.stats?.parsedLines,10737);
assert.equal(field2.stats?.syntaxErrors,0);
assert.equal(field2.stats?.duplicateIdsIgnored,0);
assert.ok(Number(field2.stats?.rowsWithField2StringData)>0);
assert.ok(Number(field2.stats?.templatesWithTypeCode)>0);
assert.ok(Number(field2.stats?.templatesWithRepairIngredientName)>0);
assert.ok(Number(field2.stats?.nonblankFunctionStrings)>0);

const rows=Object.entries(pets.byId||{})
  .map(([id,row])=>({id:Number(id),...row}))
  .filter(row=>Number(row.field)===2&&Number(row.illegal)===0)
  .sort((a,b)=>a.id-b.id);

assert.deepEqual(rows.map(r=>({id:r.id,f:r.f,n:r.n})),[
  {id:200,f:'PETSKILL_Merge',n:'加工'},
  {id:201,f:'PETSKILL_Merge',n:'料理'},
  {id:540,f:'PETSKILL_Fixitem',n:'修复'},
  {id:572,f:'PETSKILL_Inslay',n:'镶宝石'}
]);

const values=Object.values(field2.byItemId||{});
assert.ok(values.every(row=>row&&typeof row==='object'&&!Array.isArray(row)));
assert.ok(values.some(row=>typeof row.typeCode==='string'&&row.typeCode.length>0));
assert.ok(values.some(row=>Array.from({length:5},(_,i)=>row['ingName'+i]).some(x=>typeof x==='string'&&x.length>0)));
assert.ok(values.some(row=>row.functions&&Object.keys(row.functions).length>0));

// Generated strings are source bytes transported through latin1. They are not localization/display
// text and must stay source metadata only.
assert.equal(field2.semantics?.missingRowOrKey,'empty C string');

console.log(JSON.stringify({
  pass:true,
  version:'V2.04',
  focus:'fixed-item-field2-string-runtime',
  field2Skills:rows.map(r=>r.id),
  rowsWithField2StringData:field2.stats.rowsWithField2StringData,
  templatesWithTypeCode:field2.stats.templatesWithTypeCode,
  templatesWithRepairIngredientName:field2.stats.templatesWithRepairIngredientName,
  nonblankFunctionStrings:field2.stats.nonblankFunctionStrings
}));
