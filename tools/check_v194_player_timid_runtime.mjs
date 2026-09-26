import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');

for(const id of ['606','727']){
  const row=runtime.byId[id];
  assert.equal(row?.f,'PETSKILL_BattleTimid');
  assert.equal(row?.o,'');
  assert.equal(Number(row?.target),6);
  assert.equal(Number(row?.illegal),0);
}
for(const [id,opt] of [
  ['636','-攻%50+敏%30命%60'],
  ['824','-攻%50+敏%50命%60']
]){
  const row=runtime.byId[id];
  assert.equal(row?.f,'PETSKILL_2BattleTimid');
  assert.equal(row?.o,opt);
  assert.equal(Number(row?.target),7);
  assert.equal(Number(row?.illegal),0);
}

// Generic hit helper must keep default kill-credit behavior while allowing Timid to delay it.
const applyStart=game.indexOf('function applyFriendlyEnemyHit');
const playerAttackStart=game.indexOf('function playerAttackResult',applyStart);
assert.ok(applyStart>=0&&playerAttackStart>applyStart);
const apply=game.slice(applyStart,playerAttackStart);
assert.ok(apply.includes('if(!options.deferDeathCredit)'));
assert.ok(apply.includes("sourceMarkEnemyDeathCredit(actual,[attackerKind==='pet'?{kind:'pet',petId:attackerPetId}:{kind:'player'}])"));

const parserStart=game.indexOf('function sourcePet2TimidPowerMod');
const timidStart=game.indexOf('function sourcePerformPetBattleTimidSkill',parserStart);
const timid2Start=game.indexOf('function sourcePerformPet2BattleTimidSkill',timidStart);
const sideStart=game.indexOf('function sourcePetDirectEnemySideTargets',timid2Start);
assert.ok(parserStart>=0&&timidStart>parserStart&&timid2Start>timidStart&&sideStart>timid2Start);

const parser=game.slice(parserStart,timidStart);
// Fixed parser: "-攻%N" is FIXSTR * N%, NOT FIXSTR * (100-N)%.
assert.ok(parser.includes("const negAttack=read('-攻%'),posAttack=read('\\\\+攻%')"));
assert.ok(parser.includes('attack=Math.trunc(baseAttack*(negAttack/100))'));
assert.ok(parser.includes('attack=Math.trunc(baseAttack+baseAttack*(posAttack/100))'));
assert.ok(parser.includes('quick=Math.trunc(baseQuick+baseQuick*(posQuick/100))'));

// Independent parser examples lock current 636/824 semantics.
function parse(option,baseAttack=101,baseDefense=83,baseQuick=77){
  const read=(token)=>{
    const m=option.match(new RegExp(token+'([0-9]+(?:\\.[0-9]+)?)'));
    return m?Math.max(0,Number(m[1])||0):null;
  };
  const negAttack=read('-攻%'),posAttack=read('\\+攻%');
  const negDefense=read('-防%'),posDefense=read('\\+防%');
  const negQuick=read('-敏%'),posQuick=read('\\+敏%');
  let attack=baseAttack,defense=baseDefense,quick=baseQuick;
  if(negAttack!=null)attack=Math.trunc(baseAttack*(negAttack/100));
  else if(posAttack!=null)attack=Math.trunc(baseAttack+baseAttack*(posAttack/100));
  if(negDefense!=null)defense=Math.trunc(baseDefense*(negDefense/100));
  else if(posDefense!=null)defense=Math.trunc(baseDefense+baseDefense*(posDefense/100));
  if(negQuick!=null)quick=Math.trunc(baseQuick*(negQuick/100));
  else if(posQuick!=null)quick=Math.trunc(baseQuick+baseQuick*(posQuick/100));
  return {attack,defense,quick};
}
assert.deepEqual(parse('-攻%50+敏%30命%60'),{attack:50,defense:83,quick:100});
assert.deepEqual(parse('-攻%50+敏%50命%60'),{attack:50,defense:83,quick:115});

const timidFn=game.slice(timidStart,timid2Start);
assert.ok(timidFn.includes('const attack=Math.trunc(n(base.attack)*.7)'));
assert.ok(timidFn.includes('const defense=Math.trunc(n(base.fixedTough)*.4)'));
assert.ok(timidFn.includes('const quick=Math.trunc(n(base.fixedDex)*.8)'));
assert.ok(timidFn.includes('battlePetPowerMods.set(pet.id,{'));
assert.ok(timidFn.includes('sourcePetAdjustedAttackDamageTarget(action)'));
assert.ok(timidFn.includes('const hadDamageReact=sourcePetOriginalDamageReact(target)'));
assert.ok(timidFn.includes('const localTimid=!hadDamageReact'));
assert.ok(timidFn.includes("applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id,{deferDeathCredit:true})"));
// local skill_type -1 on DamageReact / damage<=0 suppresses the whole Timid switch and RNG.
assert.ok(timidFn.includes('if(localTimid&&n(r.damage)>0)'));
assert.ok(timidFn.includes('timidRoll=cRand(0,99)'));
assert.ok(timidFn.includes('if(timidRoll<15&&n(r.damage)>1)'));
// Enemy target uses BATTLE_Exit; reward credit only happens if no forced exit.
assert.ok(timidFn.includes("exit=finishEnemyDirectExit(target,label+'成功')"));
assert.ok(timidFn.includes('if(!forcedExit&&targetHpBefore>0&&n(target.hp)<=0)'));
assert.ok(timidFn.includes("sourceMarkEnemyDeathCredit(target,[{kind:'pet',petId:pet.id}])"));
assert.ok(timidFn.includes('sourceNoCounter:true'));

const timid2Fn=game.slice(timid2Start,sideStart);
assert.ok(timid2Fn.includes('sourcePet2TimidPowerMod(pet,meta)'));
assert.ok(timid2Fn.includes("enemySkillNumber(meta?.o,/命%([0-9.]+)/,0)"));
assert.ok(timid2Fn.includes('const hadDamageReact=sourcePetOriginalDamageReact(target)'));
assert.ok(timid2Fn.includes('if(localTimid&&n(r.damage)>0)'));
assert.ok(timid2Fn.includes('timidRoll=cRand(0,99)'));
assert.ok(timid2Fn.includes("sourceTargetType:'CHAR_TYPEENEMY'"));
assert.ok(timid2Fn.includes('recalled=false'));
assert.ok(timid2Fn.includes('sourceNoCounter:true'));

// Enemy-side existing Timid handlers must now obey the same Acupuncture crossover.
const enemy1Start=game.indexOf('function performEnemyBattleTimid');
const enemy2Start=game.indexOf('function performEnemy2BattleTimid',enemy1Start);
const enemyMpStart=game.indexOf('function performEnemyMpDamage',enemy2Start);
assert.ok(enemy1Start>=0&&enemy2Start>enemy1Start&&enemyMpStart>enemy2Start);
const enemy1=game.slice(enemy1Start,enemy2Start);
const enemy2=game.slice(enemy2Start,enemyMpStart);
for(const fn of [enemy1,enemy2]){
  assert.ok(fn.includes('battlePetAcupunctureIds.has(chosen.pet.id)'));
  assert.ok(fn.includes('const localTimid=!hadDamageReact'));
  assert.ok(fn.includes('if(localTimid&&r.damage>0)'));
}

const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
assert.ok(loyal.includes("meta?.f==='PETSKILL_BattleTimid'"));
assert.ok(loyal.includes("meta?.f==='PETSKILL_2BattleTimid'"));
assert.ok(loyal.indexOf("meta?.f==='PETSKILL_BattleTimid'")<loyal.indexOf('sourceRuntimePending:true'));
assert.ok(loyal.indexOf("meta?.f==='PETSKILL_2BattleTimid'")<loyal.indexOf('sourceRuntimePending:true'));

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.94',
  focus:'player-randomact-timid-two-timid-damagereact-exit-reward-lifecycle',
  skills:[606,727,636,824]
}));
