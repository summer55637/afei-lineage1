import assert from 'node:assert/strict';
import fs from 'node:fs';

const petRuntime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const magicRuntime=JSON.parse(fs.readFileSync('data/generated/stoneage_attack_magic_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');

const combinedRows=Object.entries(petRuntime.byId||{})
  .filter(([,row])=>row?.f==='PETSKILL_Combined')
  .map(([id,row])=>({id:Number(id),row}))
  .sort((a,b)=>a.id-b.id);

assert.equal(combinedRows.length,36,'fixed runtime must contain exactly 36 PETSKILL_Combined rows');

const usedMagicIds=[];
for(const {id,row} of combinedRows){
  assert.equal(Number(row.field),1,'Combined must be battle-field skill: '+id);
  assert.equal(Number(row.illegal),0,'Combined must be legal for Pet: '+id);
  const parts=String(row.o||'').split('|');
  assert.equal(parts[0],'综合法','unexpected Combined option prefix: '+id);
  const count=Math.min(10,Math.max(0,Math.trunc(Number(parts[1])||0)));
  assert.ok(count>0,'Combined count must be >0: '+id);
  const ids=parts.slice(2,2+count).map(Number);
  assert.equal(ids.length,count,'Combined option magic count mismatch: '+id);
  assert.ok(ids.every(Number.isFinite),'Combined contains nonnumeric magic id: '+id);
  usedMagicIds.push(...ids.map(Math.trunc));
}
const uniqueMagicIds=[...new Set(usedMagicIds)].sort((a,b)=>a-b);

const expectedAttackMagicIds=[
  306,
  470,471,472,473,474,475,476,477,
  480,481,482,483,484,
  490,491,492,493,
  500,501,502,503,504,505,506,507,
  510,511,512,513,514,
  520,521,522,523,
  530,531,532,533,534,535,536,537,
  540,541,542,543,544,
  550,551,552,553,
  560,561,562,563,564,565,566,567,
  570,571,572,573,574,
  580,581,582,583
];
const attackMagicIds=uniqueMagicIds
  .filter(id=>magicRuntime.byMagicId?.[String(id)]?.func==='MAGIC_AttMagic');
assert.deepEqual(attackMagicIds,expectedAttackMagicIds,'Combined AttackMagic coverage changed');

for(const id of expectedAttackMagicIds){
  const magic=magicRuntime.byMagicId[String(id)];
  assert.ok(magic,'missing AttackMagic runtime row '+id);
  assert.equal(magic.func,'MAGIC_AttMagic');
  assert.ok(Number.isFinite(Number(magic.attIdx)),'missing attIdx for '+id);
  assert.ok(magicRuntime.byAttIdx?.[String(magic.attIdx)]?.playerSide,'missing player-side AttackMagic pattern for '+id);
}

const expectedNonAttack=[
  20,21,22,23,24,25,61,71,81,91,101,121,139,159,169,179,189,
  194,204,214,224,230,240,413,414,416,436,458,459,460,461,462
];
assert.deepEqual(
  uniqueMagicIds.filter(id=>!expectedAttackMagicIds.includes(id)),
  expectedNonAttack,
  'Combined non-AttackMagic source set changed'
);

for(const id of [458,459,462]){
  assert.ok(uniqueMagicIds.includes(id),'missing fixed no-row Combined id '+id);
  assert.equal(magicRuntime.byMagicId?.[String(id)],undefined,'fixed magic.txt must have no runtime row '+id);
}

const combinedStart=game.indexOf('const SOURCE_COMBINED_MISSING_MAGIC_IDS');
const combinedEnd=game.indexOf('function sourcePerformPetLoyalAction',combinedStart);
assert.ok(combinedStart>=0&&combinedEnd>combinedStart,'missing Player Combined runtime block');
const combined=game.slice(combinedStart,combinedEnd);

// PETSKILL_Combined: kill[rand()%count], and RANDOMACT's already-selected single COM2 is preserved.
assert.ok(combined.includes('const pickIndex=cRand(0,parsed.count-1)'));
assert.ok(combined.includes('rawToNo=sourceBattleStatusSlot(action?.targetDesc)'));
assert.ok(combined.includes('sourceCombinedMultiList(rawToNo)'));
assert.ok(combined.includes("attackMagicDb?.byAttIdx?.[String(magic.attIdx)]?.playerSide"));
assert.ok(combined.includes('ignoredTargetRewrite:magic.targetRewrite'));
assert.equal(combined.includes('sourceEnemyAttackMagicRewriteToNo'),false,'Combined must not run S_ATTACK_MAGIC target rewrite');

// Non-AttMagic DirectUse gets itemnum=0 -> MAGICUSEMP=-1 -> Pet MP +1.
// Missing magic rows and MAGIC_AttMagic do not receive this side effect.
assert.ok(combined.includes('function sourcePetCombinedGainMp'));
assert.ok(combined.includes('if(pet)pet.mp=before+1'));
assert.ok(combined.includes('missingMagicRow:true,mpDelta:0'));
assert.ok(combined.includes('{pickIndex,mpDelta:0}'));
const attackFnStart=combined.indexOf('function sourcePerformPetCombinedAttackMagic(');
const attackFnEnd=combined.indexOf('function sourceCombinedSingleTarget(',attackFnStart);
assert.ok(attackFnStart>=0&&attackFnEnd>attackFnStart);
assert.equal(combined.slice(attackFnStart,attackFnEnd).includes('sourcePetCombinedGainMp'),false,'AttackMagic must not change Pet MP');

// Fixed no-row ids are explicit no-guess boundaries.
assert.ok(combined.includes('Object.freeze([458,459,462])'));

// Fixed MAGIC_StatusChange_Battle uses parsed turn as-is; 436 writes WORKWEAKEN = turn+1 = 4.
assert.ok(combined.includes('const storedTurns=cfg.turn;'));
assert.ok(combined.includes('battleStatusApplyRaw(target,cfg.type,storedTurns)'));
assert.ok(combined.includes("{perOffset:20,range:30,bai:1,forceGeneral:true}"));
assert.ok(combined.includes("battleStatusApplyRaw(target,'weaken',4)"));

// StatusRecovery scans every source StatusTbl entry and only then decides whether the highest one is removable.
assert.ok(combined.includes('function sourceCombinedHighestRecoveryStatus'));
assert.ok(combined.includes('SOURCE_COMBINED_STATUS_ORDER'));
assert.ok(combined.includes("sars:11"));
assert.ok(combined.includes("requested==='all'&&st.index<=6"));

// 460/461 are one independent magic-status group: 3 turns, 90% / 50%.
assert.ok(combined.includes("460:Object.freeze({turns:3,nums:90})"));
assert.ok(combined.includes("461:Object.freeze({turns:3,nums:50})"));
const defApplyStart=game.indexOf('function sourceApplyDefMagicStatus');
const defApplyEnd=game.indexOf('function sourceDefMagicStatusSeq',defApplyStart);
const defApply=game.slice(defApplyStart,defApplyEnd);
assert.ok(defApplyStart>=0&&defApplyEnd>defApplyStart);
assert.ok(defApply.includes('blocked:!applied&&!!current'));
assert.equal(defApply.includes('old.nums='),false,'existing MagicStatus must not overwrite OTHERSTATUSNUMS');

assert.ok(game.includes('function sourceDefMagicStatusSeq'));
assert.ok(game.includes('function sourceMagicEffectiveResist'));
assert.ok(game.includes('sourceDefMagicResistBonus(desc)'));
assert.ok(game.includes('const effective=(base>0&&bonus!==0)'));
assert.ok(game.includes('const resistInfo=sourceMagicEffectiveResist(targetDesc,attrIndex)'));

// Pet AttackMagic uses persistent CHAR_*_EXP-equivalent state under _FIX_MAGICDAMAGE.
assert.ok(combined.includes('function sourcePetCombinedMagicPractice'));
assert.ok(combined.includes('pet.sourceAttackMagicLv'));
assert.ok(combined.includes('pet.sourceAttackMagicExp'));
assert.ok(combined.includes('const addEx=Math.max(0,Math.trunc(n(magicLv))*3*Math.max(0,Math.trunc(n(hitCount))))'));
assert.ok(combined.includes('if(exp>100)'));
assert.ok(combined.includes('const opposed=(idx+1)%4'));
assert.ok(combined.includes('const mmagic=Math.max(1,attMagicLv)'));
assert.ok(combined.includes('const hitCount=results.filter(x=>!x.r?.dodged).length'));
assert.ok(combined.includes('const practiceUpdate=!trueMagic'));
assert.ok(combined.includes('sourcePetCombinedMagicComputeAttExp(pet,attrIndex,magic.magicLv,hitCount)'));

// RANDOMACT dispatch must hit Combined before the generic sourceRuntimePending fallback.
const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
const dispatch=loyal.indexOf("meta?.f==='PETSKILL_Combined'");
const fallback=loyal.indexOf('sourceRuntimePending:true');
assert.ok(dispatch>=0&&fallback>dispatch);

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V2.02',
  focus:'player-randomact-petskill-combined-directuse-attackmagic-defmagic-practice',
  combinedSkills:combinedRows.map(x=>x.id),
  magicCount:uniqueMagicIds.length,
  attackMagicCount:expectedAttackMagicIds.length
}));
