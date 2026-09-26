import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');

const row=runtime.byId['624'];
assert.equal(row?.f,'PETSKILL_Firekill');
assert.equal(row?.o,'');
assert.equal(Number(row?.target),1);
assert.equal(Number(row?.illegal),0);

// Firekill raw COM2 resolution is deterministic on the same Enemy side, never TargetAdjust RNG.
const resolveStart=game.indexOf('function sourcePetFirekillResolveTarget');
const physicalStart=game.indexOf('function sourceApplyPetFirekillPhysicalHit',resolveStart);
const magicAttrStart=game.indexOf('function sourcePetFirekillMagicAttrDamage',physicalStart);
const magicOneStart=game.indexOf('function sourcePetFirekillMagicOne',magicAttrStart);
const firekillStart=game.indexOf('function sourcePerformPetFirekillSkill',magicOneStart);
const loyalStart=game.indexOf('function sourcePerformPetLoyalAction',firekillStart);
assert.ok(resolveStart>=0&&physicalStart>resolveStart&&magicAttrStart>physicalStart&&magicOneStart>magicAttrStart&&firekillStart>magicOneStart&&loyalStart>firekillStart);

const resolve=game.slice(resolveStart,physicalStart);
assert.ok(resolve.includes("const rawSlot=raw?sourceBattleStatusSlot({kind:'enemy',unit:raw,unitId:raw.id}):-1"));
assert.ok(resolve.includes('if(raw&&n(raw.hp)>0&&!enemyUnitHidden(raw))'));
assert.ok(resolve.includes('if(rawSlot<10||rawSlot>19)'));
assert.ok(resolve.includes(".filter(u=>u&&n(u.hp)>0&&!enemyUnitHidden(u))"));
assert.equal(resolve.includes('cRand('),false);
assert.equal(resolve.includes('sourcePetEnemyTargetFromAction'),false);

const physical=game.slice(physicalStart,magicAttrStart);
// Dedicated BATTLE_DamageSub_FIREKILL forces react=NONE: no Acupuncture prepare/finish here.
assert.ok(physical.includes('sourceTrackDamageSubUltimate(targetDesc,r.damage,before,r)'));
assert.ok(physical.includes('battleStatusWakeOnDamage(targetDesc,r.damage)'));
assert.ok(physical.includes('sourceBattleFinalizeItemCrushRng(r)'));
assert.equal(physical.includes('sourcePrepareAcupunctureReaction'),false);
assert.equal(physical.includes('sourceFinishAcupunctureReaction'),false);
assert.ok(physical.includes("sourceMarkEnemyDeathCredit(actual,[{kind:'pet',petId:pet.id}])"));

const magicAttr=game.slice(magicAttrStart,magicOneStart);
assert.ok(magicAttr.includes('const scaled=40'));
assert.ok(magicAttr.includes('fire:scaled+scaled*Math.trunc(Math.trunc(n(source.fire))/50)'));
assert.ok(magicAttr.includes('const fieldRatio=battleFieldRatio(magicVector,def)'));
assert.ok(magicAttr.includes('const baseDamage=magicAttrCalcRaw(attack,def)'));

const magicOne=game.slice(magicOneStart,firekillStart);
// BATTLE_MagicDodge treats CHAR_TYPEENEMY via its generic non-player branch.
assert.ok(magicOne.includes('Math.min(30,Math.max(0,n(target.level)*.2))'));
assert.ok(magicOne.includes('const dodgeRoll=cRand(1,100)'));
assert.ok(magicOne.includes('const attMagicLv=5'));
assert.ok(magicOne.includes('const resist=Math.trunc(Math.max(0,n(target.level))*.5)'));
assert.ok(magicOne.includes('const randomAmp=cRand(0,19)'));
assert.ok(magicOne.includes('const aPower=Math.trunc(200*(1+4/10)*amagic)'));
assert.ok(magicOne.includes('sourcePetFirekillMagicAttrDamage(pet,target,aPower)'));
assert.equal(magicOne.includes('*.7'),false);

const firekill=game.slice(firekillStart,loyalStart);
assert.ok(firekill.includes('sourcePetFirekillResolveTarget(action)'));
assert.ok(firekill.includes('const physicalAttack=Math.trunc(baseAttack*.8)'));
assert.ok(firekill.includes('resolveAttackToEnemyWithGuardian(attacker,target'));
assert.ok(firekill.includes('sourceApplyPetFirekillPhysicalHit(pet,target,physical,label)'));
// Magic row is based on original resolved slot, not physical Guardian actual target.
assert.ok(firekill.includes('const resolvedSlot=resolved.resolvedSlot'));
assert.ok(firekill.includes('const rowStart=resolvedSlot>=15?15:10'));
assert.ok(firekill.includes('n(u.hp)<=0||enemyUnitHidden(u)'));
assert.ok(firekill.includes('const trueRoll=cRand(0,99)'));
assert.ok(firekill.includes('const trueMagic=trueRoll<=5'));
assert.ok(firekill.includes('sourcePetFirekillMagicOne(pet,unit,trueMagic)'));
assert.ok(firekill.includes("if(battleStatusActive(desc,'sleep'))battleStatusClear(desc,'sleep')"));
assert.ok(firekill.includes('sourceDamageReactForcedNone:true'));
assert.ok(firekill.includes('sourceNoCounter:true'));
assert.equal(firekill.includes('resolvePetEnemyCounterChain'),false);
assert.equal(firekill.includes('sourceProcessBattleDeathsAtAddProfit'),false);

// Enemy Firekill must also bypass V1.88 Acupuncture because FIREKILL DamageSub hard-resets react.
const enemySkillStart=game.indexOf('function enemyApplySkillHit');
const enemyChargeStart=game.indexOf('function enemyChargeSpec',enemySkillStart);
const enemySkill=game.slice(enemySkillStart,enemyChargeStart);
assert.ok(enemySkill.includes('options.ignoreDamageReact'));
assert.ok(enemySkill.includes('sourceIgnoredByFirekill:true'));

const directStart=game.indexOf('function enemyApplyDirectGuardianSkillHit');
const enemyFireStart=game.indexOf('function performEnemyFirekill',directStart);
const enemyFireEnd=game.indexOf('function performEnemyLighttakeed',enemyFireStart);
const direct=game.slice(directStart,enemyFireStart);
const enemyFire=game.slice(enemyFireStart,enemyFireEnd);
assert.ok(direct.includes('enemyApplySkillHit(unit,actual,r,label,options)'));
assert.ok(enemyFire.includes("{ignoreDamageReact:true}"));

const loyal=game.slice(loyalStart,game.indexOf('function sourcePetPreCommandAction',loyalStart));
assert.ok(loyal.includes("meta?.f==='PETSKILL_Firekill'"));
assert.ok(loyal.indexOf("meta?.f==='PETSKILL_Firekill'")<loyal.indexOf('sourceRuntimePending:true'));

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.90',
  focus:'player-randomact-firekill-dedicated-physical-plus-row-fire-magic',
  skill:624
}));
