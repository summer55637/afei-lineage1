import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const css=fs.readFileSync('game.css','utf8');

assert.equal(runtime.format,'stoneage-item-make-runtime-v2');
assert.equal(runtime.itemDataIntCount,66);
assert.equal(runtime.stats.templates,10737);
assert.equal(runtime.stats.initCallbackTemplates,0);
assert.equal(runtime.stats.attachCallbackTemplates,260);
assert.equal(runtime.stats.detachCallbackTemplates,260);

const idx=Object.fromEntries(runtime.itemDataIntOrder.map((name,i)=>[name,i]));
for(const name of [
  'ITEM_ID','ITEM_TYPE','ITEM_LEVEL','ITEM_NEEDSTR','ITEM_NEEDDEX','ITEM_NEEDTRANS','ITEM_NEEDPROFESSION',
  'ITEM_MODIFYATTACK','ITEM_MODIFYDEFENCE','ITEM_MODIFYQUICK','ITEM_MODIFYHP','ITEM_MODIFYMP',
  'ITEM_MODIFYLUCK','ITEM_MODIFYCHARM','ITEM_MODIFYAVOID','ITEM_MODIFYATTRIB','ITEM_MODIFYATTRIBVALUE',
  'ITEM_OTHERDAMAGE','ITEM_OTHERDEFC','ITEM_ATTACKNUM_MIN','ITEM_ATTACKNUM_MAX','ITEM_HITRIGHT',
  'ITEM_NEGLECTGUARD','ITEM_POISON','ITEM_PARALYSIS','ITEM_SLEEP','ITEM_STONE','ITEM_DRUNK',
  'ITEM_CONFUSION','ITEM_CRITICAL'
])assert.ok(Number.isInteger(idx[name]),'missing '+name);

function expand(itemId){
  const row=runtime.byItemId[String(itemId)];
  assert.ok(row,'missing template '+itemId);
  const base=runtime.defaultData.map(Number);
  const widths=Array(66).fill(0);
  for(const [pairs,target] of [[row.b||[],base],[row.w||[],widths]]){
    assert.equal(pairs.length%2,0);
    for(let i=0;i<pairs.length;i+=2)target[Number(pairs[i])]=Number(pairs[i+1]);
  }
  assert.equal(base[idx.ITEM_ID],Number(itemId));
  return {row,base,widths};
}
function val(itemId,field){return expand(itemId).base[idx[field]];}

assert.equal(val(0,'ITEM_TYPE'),1);      // axe
assert.equal(val(100,'ITEM_TYPE'),2);    // club
assert.equal(val(200,'ITEM_TYPE'),3);    // spear
assert.equal(val(400,'ITEM_TYPE'),4);    // bow
assert.equal(val(500,'ITEM_TYPE'),17);   // boomerang
assert.equal(val(600,'ITEM_TYPE'),18);   // bound throw
assert.equal(val(700,'ITEM_TYPE'),19);   // break throw

// The fixed equip-place mapping used by ITEM_getEquipPlace().
for(const needle of [
  'if(type===0||type===1||type===2||type===3||type===17||type===18||type===19)return PLAYER_ARM_SLOT',
  'if(type===6)return PLAYER_HEAD_SLOT',
  'if(type===7)return PLAYER_BODY_SLOT',
  'if(type>=8&&type<=15)return PLAYER_DECORATION1_SLOT',
  'if(type===24)return PLAYER_BELT_SLOT',
  'if(type===25)',
  'if(type===26)return PLAYER_SHOES_SLOT',
  'if(type===27)return PLAYER_GLOVE_SLOT'
])assert.ok(game.includes(needle),'missing equip mapping: '+needle);

// Fixed CHAR_STR/DEX are displayed points * 100 when requirements are checked.
assert.ok(game.includes('n(p.str)*100'),'STR requirement must use raw CHAR_STR scale');
assert.ok(game.includes('n(p.dex)*100'),'DEX requirement must use raw CHAR_DEX scale');

// V1.73 side-effect boundaries remain fail-closed. Player ranged weapon patterns
// are intentionally allowed to advance in V1.74 without invalidating this historical regression.
for(const needle of [
  "reason:'profession-unported'",
  "reason:'callback-unported'",
  "reason:'special-equip-unported'"
])assert.ok(game.includes(needle),'missing fail-closed boundary '+needle);

// ITEM_equipEffect values must come from the creation-time generated data[].
for(const field of [
  'ITEM_MODIFYATTACK','ITEM_MODIFYDEFENCE','ITEM_MODIFYQUICK','ITEM_MODIFYHP','ITEM_MODIFYMP',
  'ITEM_MODIFYLUCK','ITEM_MODIFYCHARM','ITEM_MODIFYAVOID','ITEM_POISON','ITEM_PARALYSIS',
  'ITEM_SLEEP','ITEM_STONE','ITEM_DRUNK','ITEM_CONFUSION','ITEM_CRITICAL','ITEM_OTHERDAMAGE',
  'ITEM_OTHERDEFC','ITEM_MODIFYARRANGE','ITEM_MODIFYSEQUENCE','ITEM_ATTACHPILE','ITEM_HITRIGHT',
  'ITEM_NEGLECTGUARD','ITEM_MODIFYATTRIB','ITEM_MODIFYATTRIBVALUE'
])assert.ok(game.includes("'"+field+"'"),'game does not consume '+field);

// Source quirk: WORKFIXAVOID is not reset by CHAR_initcharWorkInt; derived Work data is not persisted across login.
assert.ok(game.includes('const previousAvoid=Math.trunc(n(target.playerEquipCompliance?.fixedAvoid))'));
assert.ok(game.includes('previousAvoid+Math.trunc(n(equip.avoid))'));
assert.ok(game.includes('s.playerEquipCompliance=null;'));

// Battle consumers now receive the fixed equipment Work values.
assert.ok(game.includes("duck-=cRand(sourceHitRight*.8,sourceHitRight*1.2)"));
assert.ok(game.includes('if(neglectGuard>1)defense*=1-neglectGuard/100'));
assert.ok(game.includes('const sourceOtherDamage=Math.trunc(n(attacker?.otherDamage))'));
assert.ok(game.includes('const sourceOtherDefense=Math.trunc(n(defender?.otherDefc))'));
assert.ok(game.includes('function sourceCRandMacroValue(min,max)'));
assert.ok(game.includes('Math.trunc((max-(min-1))*Math.random())'));
assert.ok(game.includes('const sourceOtherPower=Math.trunc('));
assert.ok(game.includes('sourceCRandMacroValue(sourceOtherDamage*.3,sourceOtherDamage)'));
assert.ok(game.includes('sourceCRandMacroValue(sourceOtherDefense*.3,sourceOtherDefense)'));
assert.ok(game.includes("state?.playerEquipCompliance?.statusResist?.[type]"));
assert.ok(game.includes("state?.playerEquipCompliance?.fixedLuck??state?.luck"));
assert.ok(game.includes("state?.playerEquipCompliance?.fixedCharm??state.charm"));
assert.ok(game.includes('cRand(Math.trunc(min),Math.trunc(max))'));

// The lifecycle must be reachable from the actual UI, not only from test/helper code.
for(const id of ['sourceItemRuntimePanel','sourceEquipmentGrid','sourceBackpackGrid','sourceItemRuntimeStatus']){
  assert.ok(html.includes('id="'+id+'"'),'missing source equipment UI '+id);
}
assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));
assert.ok(game.includes("data-source-item-action=\"equip\""));
assert.ok(game.includes("data-source-item-action=\"unequip\""));
assert.ok(game.includes("$('#sourceItemRuntimePanel').addEventListener('click'"));
assert.ok(game.split('sourcePlayerMoveItem(').length-1>=2,'sourcePlayerMoveItem must have a live UI caller');
assert.ok(css.includes('.source-equipment-grid'));
assert.ok(css.includes('.source-backpack-grid'));

// Audit the float-bound RAND sites newly activated by equipment values.
// These fields are non-random itemset integers; report any values whose 0.8/1.2 or 0.3 bounds are fractional.
const fractionalHitRight=new Set();
const fractionalOther=new Set();
const nonzero={hitRight:0,otherDamage:0,otherDefc:0,neglectGuard:0,avoid:0};
for(const itemId of Object.keys(runtime.byItemId)){
  const {base}=expand(itemId);
  const hit=base[idx.ITEM_HITRIGHT],od=base[idx.ITEM_OTHERDAMAGE],of=base[idx.ITEM_OTHERDEFC];
  const ng=base[idx.ITEM_NEGLECTGUARD],av=base[idx.ITEM_MODIFYAVOID];
  if(hit){
    nonzero.hitRight++;
    if(!Number.isInteger(hit*.8)||!Number.isInteger(hit*1.2))fractionalHitRight.add(hit);
  }
  for(const v of [od,of]){
    if(v && !Number.isInteger(v*.3))fractionalOther.add(v);
  }
  if(od)nonzero.otherDamage++;
  if(of)nonzero.otherDefc++;
  if(ng)nonzero.neglectGuard++;
  if(av)nonzero.avoid++;
}

console.log(JSON.stringify({
  pass:true,
  callbacks:{init:runtime.stats.initCallbackTemplates,attach:runtime.stats.attachCallbackTemplates,detach:runtime.stats.detachCallbackTemplates},
  nonzero,
  fractionalHitRight:[...fractionalHitRight].sort((a,b)=>a-b),
  fractionalOther:[...fractionalOther].sort((a,b)=>a-b)
}));
