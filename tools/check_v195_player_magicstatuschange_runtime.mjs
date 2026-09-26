import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');

for(const [id,opt] of [
  ['552','铁壁|3|30|全'],
  ['553','铁壁|3|30|全'],
  ['565','铁壁|5|40|全'],
  ['658','铁壁|3|50|全']
]){
  const row=runtime.byId[id];
  assert.equal(row?.f,'PETSKILL_MagicStatusChange');
  assert.equal(row?.o,opt);
  assert.equal(Number(row?.target),2);
  assert.equal(Number(row?.field),1);
  assert.equal(Number(row?.illegal),0);
}

const fnStart=game.indexOf('function sourcePerformPetMagicStatusChangeSkill');
const setDuckStart=game.indexOf('function sourcePerformPetSetDuckRandomSkill',fnStart);
assert.ok(fnStart>=0&&setDuckStart>fnStart);
const fn=game.slice(fnStart,setDuckStart);

assert.ok(fn.includes("const rawToNo=action?.targetDesc?.kind==='enemy'"));
assert.ok(fn.includes('sourceBattleStatusSlot(action.targetDesc)'));
assert.ok(fn.includes('const multi=sourceSetMagicPetMultiList(rawToNo)'));
assert.ok(fn.includes("status==='铁壁'||status==='鐵壁'"));
assert.ok(fn.includes('unit.superWallTurns=turns'));
assert.ok(fn.includes('unit.superWallPower=power'));
assert.ok(fn.includes('if(n(unit.superWallTurns)>0)'));
assert.ok(fn.includes('sourceRandomActOpposingTarget:true'));
assert.ok(fn.includes('sourceScopeTextDoesNotRetarget:true'));
assert.ok(fn.includes('sourceNoCounter:true'));
assert.equal(fn.includes('resolvePetEnemyCounterChain'),false);
assert.equal(fn.includes('sourceBattleFinalizeItemCrushRng'),false);

// Existing BATTLE_MultiList adapter must preserve 0..19 single-slot semantics and
// same-side rand()%10 fallback when raw COM2 became invalid.
const multiStart=game.indexOf('function sourceSetMagicPetMultiList');
const battleStart=game.indexOf('function sourcePerformSetMagicPetBattle',multiStart);
assert.ok(multiStart>=0&&battleStart>multiStart);
const multi=game.slice(multiStart,battleStart);
assert.ok(multi.includes('if(no>=0&&no<=19)'));
assert.ok(multi.includes('if(sourceSetMagicPetTargetableDescFromSlot(no))return {ok:true,toNo:no,slots:[no],fallback:false,rolls:[]}'));
assert.ok(multi.includes('const roll=cRand(0,9)'));
assert.ok(multi.includes('const picked=compact[roll]'));

const randomStart=game.indexOf('function sourcePetRandomSkillPlan');
const chargeStart=game.indexOf('function sourcePetChargeSpec',randomStart);
const random=game.slice(randomStart,chargeStart);
// Battle random-skill scan must still reject field=2 out-of-battle skills.
assert.ok(random.includes('if(field!==0&&field!==1)continue'));

const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
assert.ok(loyal.includes("meta?.f==='PETSKILL_MagicStatusChange'"));
assert.ok(loyal.indexOf("meta?.f==='PETSKILL_MagicStatusChange'")<loyal.indexOf('sourceRuntimePending:true'));

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.95',
  focus:'player-randomact-magicstatuschange-opposing-single-target-superwall',
  skills:[552,553,565,658]
}));
