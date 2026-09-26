import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');

const skill=id=>runtime.byId[String(id)];

// fixed petskill2 rows used by V1.77.
assert.equal(skill(581)?.f,'PETSKILL_Roar');
assert.equal(skill(581)?.o,'901|902|903|904|1056|1057|1058|1059');
assert.equal(skill(734)?.f,'PETSKILL_Roar');
assert.equal(skill(734)?.o,'1009|1010|1011|989|990|991|992|1030|1031|1032|997|998|999|1000');
assert.equal(skill(600)?.f,'PETSKILL_Vary');
assert.equal(skill(600)?.o,'攻%+30 敏%+30 魔防%-50');
assert.equal(skill(674)?.f,'PETSKILL_Vary');
assert.equal(skill(674)?.o,'攻%+60 敏%+50 魔防%-80');

// fixed ENEMY_createEnemyIndex stores E_T_TEMPNO in CHAR_PETID and
// PET_createPetFromCharaIndex copies CHAR_PETID unchanged. Web now persists that same identity.
assert.ok(game.includes('petId:Number(raw?.tempNo??base.tempNo??0)||null'));
assert.ok(game.includes('petId:target?.petId??target?.tempNo??v.tempNo??null'));
assert.ok(game.includes('petId:Number(tempNo)'));
assert.ok(game.includes('petId:template.tempNo??null'));
assert.ok(game.includes('copy.petId=Math.trunc(Number(copy.tempNo))'));
assert.ok(game.includes('schemaVersion:29'));

// _FIXWOLF uses CHAR_PETID 981..984 and rerolls skill 600 before DefaultAttacker.
const randomStart=game.indexOf('function sourcePetRandomSkillPlan');
const randomEnd=game.indexOf('function sourcePetChargeSpec',randomStart);
assert.ok(randomStart>=0&&randomEnd>randomStart);
const randomPlan=game.slice(randomStart,randomEnd);
assert.ok(randomPlan.includes('petId>=981&&petId<=984&&skills[iNum]===600'));
assert.ok(randomPlan.includes('while(skills[iNum]===600'));
assert.ok(randomPlan.indexOf('skills[iNum]===600')<randomPlan.indexOf('const targetDesc=sourcePetRandomEnemyTarget()'));

// Roar compares exact PETID tokens and direct BATTLE_Exit-equivalent removal has no kill reward.
const roarStart=game.indexOf('function sourcePerformPetRoarSkill');
const roarEnd=game.indexOf('function sourcePerformPetVarySkill',roarStart);
assert.ok(roarStart>=0&&roarEnd>roarStart);
const roar=game.slice(roarStart,roarEnd);
assert.ok(roar.includes("String(meta?.o||'').split('|').map(sourceCAtoi)"));
assert.ok(roar.includes('target.petId==null?null:Number(target.petId)'));
assert.ok(roar.includes('ids.includes(Math.trunc(petId))'));
assert.ok(roar.includes("finishEnemyDirectExit(target,action?.meta?.n||'大吼')"));
assert.ok(roar.includes('sourcePetRandomEnemyTarget()'));

// Roar option matching itself is exact and contains no guessed range logic.
const ids581=skill(581).o.split('|').map(Number);
const ids734=skill(734).o.split('|').map(Number);
assert.equal(ids581.includes(901),true);
assert.equal(ids581.includes(1059),true);
assert.equal(ids581.includes(900),false);
assert.equal(ids734.includes(989),true);
assert.equal(ids734.includes(1000),true);
assert.equal(ids734.includes(1001),false);

// Vary accepts only PETID 981..984, parses only 攻% / 敏%, and ignores descriptive 魔防%.
const varyStart=game.indexOf('function sourcePerformPetVarySkill');
const varyEnd=game.indexOf('function sourceAdvancePetVaryTurn',varyStart);
assert.ok(varyStart>=0&&varyEnd>varyStart);
const vary=game.slice(varyStart,varyEnd);
assert.ok(game.includes('const SOURCE_VARY_WOLF_PETIDS=new Set([981,982,983,984])'));
assert.ok(vary.includes("enemySignedSkillPercent(action?.meta?.o,'攻%')"));
assert.ok(vary.includes("enemySignedSkillPercent(action?.meta?.o,'敏%')"));
assert.equal(vary.includes("enemySignedSkillPercent(action?.meta?.o,'魔防%')"),false);
assert.ok(vary.includes('sourceVaryPetIdRejected:true'));
assert.ok(vary.includes('sourceImage:101428'));

// fixed PETSKILL_Vary option values.
function signed(option,key){
  const m=String(option||'').match(new RegExp(key+'([+-]?\\d+(?:\\.\\d+)?)'));
  return m?Number(m[1]):0;
}
assert.deepEqual(
  [signed(skill(600).o,'攻%'),signed(skill(600).o,'敏%')],
  [30,30]
);
assert.deepEqual(
  [signed(skill(674).o,'攻%'),signed(skill(674).o,'敏%')],
  [60,50]
);

// ITEM_equipEffect/compliance applies Vary to FIXSTR/FIXDEX before WEAKEN.
const viewStart=game.indexOf('function petBattleView');
const viewEnd=game.indexOf('function enemyBattleView',viewStart);
const view=game.slice(viewStart,viewEnd);
assert.ok(view.includes('const vary=battlePetVaryStates.get(pet.id)||null'));
assert.ok(view.indexOf('const variedAttackBase=')<view.indexOf('const normalAttackBase=weaken?'));
assert.ok(view.indexOf('const variedQuickBase=')<view.indexOf('const normalQuickBase=weaken?'));
assert.ok(view.includes('Math.trunc(sourceAttackBase*Math.trunc(n(vary.attackPct))/100)'));
assert.ok(view.includes('Math.trunc(sourceQuickBase*Math.trunc(n(vary.dexPct))/100)'));

// fixed post-command WORKTURN: cast action 0->1, then five subsequent executed commands;
// reset occurs only after the fifth subsequent command changes 5->6.
let workTurn=0;
const observed=[];
for(let action=0;action<6;action++){
  workTurn++;
  if(workTurn>5){workTurn=0;observed.push('expired');}
  else observed.push(workTurn);
}
assert.deepEqual(observed,[1,2,3,4,5,'expired']);
assert.ok(game.includes('vary.workTurn=Math.trunc(n(vary.workTurn))+1'));
assert.ok(game.includes('if(vary.workTurn>5)'));
assert.ok(game.includes('sourceFinalizePetExecutedCommand(pet'));

// Status-skip returns before sourcePetPreCommandAction, so immobilized turns do not advance Vary.
// Normal Pet attacks have an explicit post-command tick in capture / attack / guard loops.
assert.equal((game.match(/sourceAdvancePetVaryTurn\(pet\);/g)||[]).length,3);

// Battle exit lifecycle clears transformation state, while full reset reconstructs the map.
assert.ok(game.includes('battlePetVaryStates=new Map()'));
assert.ok(game.includes('function sourceClearPetVary(pet)'));
assert.ok((game.match(/sourceClearPetVary\(pet\)/g)||[]).length>=5);

// RANDOMACT dispatch is no longer sourceRuntimePending for these functions.
assert.ok(game.includes("PETSKILL_Roar')result=sourcePerformPetRoarSkill"));
assert.ok(game.includes("PETSKILL_Vary')result=sourcePerformPetVarySkill"));

assert.ok(html.includes('PLAYABLE CORE V1.77'));

console.log(JSON.stringify({
  pass:true,
  version:'V1.77',
  focus:'char-petid-roar-vary',
  roarSkills:[581,734],
  varySkills:[600,674],
  varyPetIds:[981,982,983,984],
  schemaVersion:29
}));