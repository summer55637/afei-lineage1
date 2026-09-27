import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));
const idx=Object.fromEntries(runtime.itemDataIntOrder.map((name,i)=>[name,i]));
assert.ok(Number.isInteger(idx.ITEM_SUITCODE),'ITEM_SUITCODE missing');

function expand(itemId){
  const row=runtime.byItemId[String(itemId)];
  assert.ok(row,'missing '+itemId);
  const base=runtime.defaultData.map(Number);
  for(let i=0;i<(row.b||[]).length;i+=2)base[row.b[i]]=row.b[i+1];
  return {row,base};
}

const rows=Object.entries(runtime.byItemId||{})
  .filter(([,row])=>row?.f?.a==='ITEM_suitEquip'||row?.f?.d==='ITEM_ResuitEquip')
  .map(([id,row])=>{
    const {base}=expand(Number(id));
    return {
      id:Number(id),
      suitCode:base[idx.ITEM_SUITCODE],
      type:base[idx.ITEM_TYPE],
      argument:typeof row.g==='string'?row.g:'',
      attach:row.f?.a||'',
      detach:row.f?.d||''
    };
  })
  .sort((a,b)=>a.id-b.id);

assert.ok(rows.length>0,'fixed itemset6 must contain ITEM_suitEquip / ITEM_ResuitEquip rows');
for(const r of rows){
  assert.equal(r.attach,'ITEM_suitEquip');
  assert.equal(r.detach,'ITEM_ResuitEquip');
}

const byCode={};
for(const r of rows)(byCode[String(r.suitCode)]??=[]).push(r.id);

const suitKeys=[
  'VIT','FSTR','MSTR','MTGH','MDEX','WAST','HP','MP',
  'FRES','IRES','TRES','RESIST','COUNTER','M_POW',
  'EARTH','WRITER','FIRE','WIND',
  'WDUCKPOWER','RENOCASE','SUITSTRP','SUITTGH_P','SUITDEXP',
  'SUITPOISON','M2_POW','UN_POW_M'
];
function cAtoi(v){
  const m=String(v??'').match(/^[ \t]*([+-]?\d+)/);
  return m?Number(m[1]):0;
}
function sourceDelimValue(argument,key){
  for(const token of String(argument||'').split('|')){
    if(!token.includes(key))continue;
    const parts=token.split(':');
    if(parts.length>=2)return cAtoi(parts[1]);
  }
  return null;
}
const usedKeys={};
const byCodeValues={};
for(const r of rows){
  const values={};
  for(const key of suitKeys){
    const value=sourceDelimValue(r.argument,key);
    if(value===null)continue;
    values[key]=value;
    (usedKeys[key]??=[]).push({id:r.id,suitCode:r.suitCode,value});
  }
  if(Object.keys(values).length)(byCodeValues[String(r.suitCode)]??=[]).push({id:r.id,values});
}

console.log(JSON.stringify({
  pass:true,
  version:'V2.18-discovery',
  focus:'ITEM_suitEquip / ITEM_ResuitEquip',
  count:rows.length,
  suitCodes:Object.keys(byCode).map(Number).sort((a,b)=>a-b),
  byCode,
  usedKeys,
  byCodeValues,
  rows
}));
