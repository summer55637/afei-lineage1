import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');

assert.equal(runtime.format,'stoneage-item-make-runtime-v2');
const idx=Object.fromEntries(runtime.itemDataIntOrder.map((name,i)=>[name,i]));
for(const name of ['ITEM_TYPE','ITEM_ATTACKNUM_MIN','ITEM_ATTACKNUM_MAX']){
  assert.ok(Number.isInteger(idx[name]),'missing '+name);
}
function expand(itemId){
  const row=runtime.byItemId[String(itemId)];
  assert.ok(row,'missing template '+itemId);
  const base=runtime.defaultData.map(Number);
  for(let i=0;i<(row.b||[]).length;i+=2)base[Number(row.b[i])]=Number(row.b[i+1]);
  return base;
}
const value=(itemId,field)=>expand(itemId)[idx[field]];

// Fixed itemset representatives used by the original weapon-command audit.
assert.equal(value(400,'ITEM_TYPE'),4);
assert.equal(value(400,'ITEM_ATTACKNUM_MIN'),1);
assert.equal(value(400,'ITEM_ATTACKNUM_MAX'),3);
assert.equal(value(500,'ITEM_TYPE'),17);
assert.equal(value(600,'ITEM_TYPE'),18);
assert.equal(value(700,'ITEM_TYPE'),19);

// V1.74 removes the ranged equip fail-closed gate while preserving other equipment safety gates.
assert.ok(!game.includes("reason:'weapon-pattern-unported'"));
for(const needle of [
  "reason:'profession-unported'",
  "reason:'callback-unported'",
  "reason:'special-equip-unported'"
])assert.ok(game.includes(needle),'lost equipment safety boundary '+needle);

// All four source indirect weapons must suppress Guardian / Counter and be excluded by ComboCheck.
assert.ok(game.includes('throwWeapon:SOURCE_PLAYER_RANGED_WEAPON_TYPES.has(weaponType)'));
assert.ok(game.includes('throwWeapon:SOURCE_PLAYER_RANGED_WEAPON_TYPES.has(Math.trunc(n(playerBattleView()?.weaponType)))'));
assert.ok(game.includes("if(attacker?.throwWeapon||defender?.throwWeapon)return {success:false,raw:0,throwWeaponBlocked:true}"));
assert.ok(game.includes("if(weaponType===4)return sourcePerformPlayerBowWeaponAttack(actor,options);"));
assert.ok(game.includes("if(weaponType===17)return sourcePerformPlayerBoomerangWeaponAttack(actor,options);"));
assert.ok(game.includes("if(weaponType===18||weaponType===19)return sourcePerformPlayerThrowWeaponAttack(actor,options);"));

// BOW: one post-AttackNum RAND(0,1), raw-COM2 battle-slot plan, skip invalid slots,
// increment only after a real attack, and stop once attack_max is satisfied.
for(const needle of [
  'function sourceBowTargetListFromBattleSlots(defNo,attackNo)',
  'const random=cRand(0,1);',
  'function sourcePlayerBowTargetList(actor)',
  'sourceBowTargetListFromBattleSlots(sourcePlayerCommandTargetBattleSlot(actor),0)',
  "weaponCommand:'BOW',protocol:'BB-w0'",
  'const target=sourcePlayerEnemyTargetableFromBattleSlot(slot);',
  'attackCount++;',
  "if(attackCount>=attackMax){"
])assert.ok(game.includes(needle),'missing bow lifecycle '+needle);

// Recompute the fixed aBowW player-side target order for raw Enemy slot 10.
const bowW=[
  0,2,1,4,3, 0,1,2,3,4,
  1,0,3,2,4, 1,3,0,2,4,
  2,4,0,1,3, 2,0,4,1,3,
  3,1,0,2,4, 3,1,0,2,4,
  4,2,0,1,3, 4,2,0,1,3
];
function bowOrder(defNo,random){
  const defsub=defNo%5,deftop=defNo-defsub,out=[];
  for(let j=0;j<5;j++){
    const first=bowW[defsub*10+random*5+j]+deftop;
    const second=(deftop===0||deftop===10)?first+5:first-5;
    out.push(first,second);
  }
  return out;
}
assert.deepEqual(bowOrder(10,0),[10,15,12,17,11,16,14,19,13,18]);
assert.deepEqual(bowOrder(10,1),[10,15,11,16,12,17,13,18,14,19]);

// BOOMERANG: source still consumes AttackNum before command execution, but the dedicated
// handler ignores that value and sweeps one row. Player side 0 is forward; Enemy side 1 remains reverse.
const boomStart=game.indexOf('function sourcePerformPlayerBoomerangWeaponAttack');
const boomEnd=game.indexOf('function sourcePerformPlayerThrowWeaponAttack',boomStart);
assert.ok(boomStart>=0&&boomEnd>boomStart);
const boom=game.slice(boomStart,boomEnd);
assert.ok(boom.includes('const order=SOURCE_BOOMERANG_VS_TBL[row].slice();'));
assert.ok(boom.includes("playerAttackResult(target,{damageMultiplier:.3})"));
assert.ok(!boom.includes('sourceAttackMax'),'boomerang must not use primed AttackNum value');
assert.ok(game.includes('const order=SOURCE_BOOMERANG_VS_TBL[row].slice().reverse(); // Enemy myside==1'));

// BOUNDTHROW/BREAKTHROW: every segment re-enters TargetAdjust from raw COM2.
// BREAKTHROW specifically inserts paralysis after WakeUp/damage but before ItemCrush.
const throwStart=game.indexOf('function sourcePerformPlayerThrowWeaponAttack');
const throwEnd=game.indexOf('function enemyWeaponApplyHit',throwStart);
assert.ok(throwStart>=0&&throwEnd>throwStart);
const thr=game.slice(throwStart,throwEnd);
assert.ok(thr.includes('const target=sourceFriendlyEnemyTargetAdjust(actor);'));
assert.ok(thr.includes('const deferItemCrush=type===19;'));
assert.ok(thr.includes('sourcePlayerBreakthrowParalysis(actual||target,r)'));
assert.ok(thr.indexOf('sourcePlayerBreakthrowParalysis(actual||target,r)') < thr.indexOf('sourceBattleFinalizeItemCrushRng(r)'));
assert.ok(thr.includes("weaponCommand:type===19?'BREAKTHROW':'BOUNDTHROW'"));
assert.ok(thr.includes("protocol:type===19?'BB-w2':'BB-w1'"));
assert.ok(game.includes("battleStatusChance({kind:'player'},targetDesc,'paralysis')"));
assert.ok(game.includes("battleStatusApply(targetDesc,'paralysis',0)"));

// Defer hook is only used when the source needs a status check before ItemCrush.
assert.ok(game.includes('if(!options.deferItemCrush)sourceBattleFinalizeItemCrushRng(r);'));

// V1.74 originally left Player ranged Confusion cross-side fail-closed.
// Later source-backed ports may remove that boundary, so the historical regression
// only requires the ranged weapon core above to remain intact.

// UI/version marker: later compatible cores may advance the displayed version.
assert.ok(/PLAYABLE CORE V\\d+\\.\\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.74',
  weapons:{bow:4,boomerang:17,boundthrow:18,breakthrow:19},
  bowAttackNum:[value(400,'ITEM_ATTACKNUM_MIN'),value(400,'ITEM_ATTACKNUM_MAX')],
  bowOrders:[bowOrder(10,0),bowOrder(10,1)]
}));
