import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_profession_skill_runtime.json','utf8'));

function extractFunction(source,name){
  const marker='function '+name+'(';
  const start=source.indexOf(marker);
  assert.ok(start>=0,'missing '+name);
  const ps=source.indexOf('(',start);
  let pd=0,pe=-1,q=null,esc=false,lc=false,bc=false;
  for(let i=ps;i<source.length;i++){
    const c=source[i],n=source[i+1];
    if(lc){if(c==='\n')lc=false;continue}
    if(bc){if(c==='*'&&n==='/'){bc=false;i++}continue}
    if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
    if(c==="'"||c==='"'||c==='\x60'){q=c;continue}
    if(c==='/'&&n==='/'){lc=true;i++;continue}
    if(c==='/'&&n==='*'){bc=true;i++;continue}
    if(c==='(')pd++;
    else if(c===')'&&--pd===0){pe=i;break}
  }
  const bs=source.indexOf('{',pe);
  let d=0;q=null;esc=false;lc=false;bc=false;
  for(let i=bs;i<source.length;i++){
    const c=source[i],n=source[i+1];
    if(lc){if(c==='\n')lc=false;continue}
    if(bc){if(c==='*'&&n==='/'){bc=false;i++}continue}
    if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
    if(c==="'"||c==='"'||c==='\x60'){q=c;continue}
    if(c==='/'&&n==='/'){lc=true;i++;continue}
    if(c==='/'&&n==='*'){bc=true;i++;continue}
    if(c==='{')d++;
    else if(c==='}'&&--d===0)return source.slice(start,i+1);
  }
  assert.fail('unterminated '+name);
}

const logs=[];
const ctx={
  Math,Number,String,Object,Array,
  PROFESSION_SKILL_SLOT_COUNT:26,
  PROFESSION_SKILL_LEVEL_MAX:100,
  PLAYER_ARM_SLOT:2,PLAYER_SHIELD_SLOT:6,
  professionSkillDb:runtime,state:null,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  addLog:(text,type)=>logs.push({text,type}),
  cRand:()=>0
};
vm.createContext(ctx);
for(const name of [
  'sourceProfessionSkillTemplate','sourcePlayerProfessionSkillAt',
  'sourceProfessionLevelCheckPlan','sourceProfessionLevelCheckApply',
  'sourceProfessionSkillProficiencyRollPlan','sourceProfessionSkillProficiencyApply',
  'sourceProfessionFindSkillByFunction','sourceProfessionSpecialSkillProficiencyByFunction',
  'sourceProfessionWeaponFocusMarker','sourceProfessionWeaponFocusProficiency',
  'sourceProfessionDualWeaponProficiency',
  'sourceProfessionLogProficiencyResult',
  'sourceProfessionPlayerNormalDodgeEvent','sourceProfessionPlayerCriticalEvent'
])vm.runInContext(extractFunction(game,name),ctx);

ctx.sourcePlayerItemSlots=target=>target.playerItemSlots||Array(24).fill(null);

const blank=()=>({
  professionLevel:1,professionSkillPoint:0,
  professionSkills:Array(26).fill(null),
  playerItemSlots:Array(24).fill(null)
});
const seq=(values,calls=[])=>((min,max)=>{
  calls.push([min,max]);
  assert.ok(values.length>0,'unexpected RNG');
  return values.shift();
});

// Ordinary player dodge: learned Avoid consumes proficiency RNG and mutates raw.
let p=blank();
p.professionSkills[4]={skillId:25,rawLevel:1000};
let calls=[];
let r=ctx.sourceProfessionPlayerNormalDodgeEvent(p,{randInclusive:seq([1001,0],calls)});
assert.equal(r.ok,true);
assert.equal(r.skillId,25);
assert.equal(r.slot,4);
assert.equal(r.success,true);
assert.equal(p.professionSkills[4].rawLevel,1001);
assert.deepEqual(calls,[[0,10000],[0,0]]);

// Not learned => source scan exits without RNG.
p=blank();calls=[];
r=ctx.sourceProfessionPlayerNormalDodgeEvent(p,{randInclusive:seq([],calls)});
assert.equal(r.ok,false);
assert.equal(r.reason,'skill-not-learned');
assert.equal(calls.length,0);

// Critical: Weapon Focus is processed before Dual Weapon and both mutate independently.
p=blank();
p.professionSkills[1]={skillId:27,rawLevel:1000}; // axe focus
p.professionSkills[3]={skillId:43,rawLevel:1000}; // dual weapon
p.playerItemSlots[2]=101;
p.playerItemSlots[6]=202;
calls=[];
r=ctx.sourceProfessionPlayerCriticalEvent(p,1,{
  randInclusive:seq([2001,1000,2501,1000],calls)
});
assert.equal(r.weaponFocus.skillId,27);
assert.equal(r.weaponFocus.success,true);
assert.equal(r.dualWeapon.skillId,43);
assert.equal(r.dualWeapon.success,true);
assert.equal(p.professionSkills[1].rawLevel,1001);
assert.equal(p.professionSkills[3].rawLevel,1001);
assert.deepEqual(calls,[[0,10000],[0,1000],[0,10000],[0,1000]]);

// Wrong weapon option: Focus consumes no RNG; Dual still runs if both equip slots exist.
p=blank();
p.professionSkills[1]={skillId:27,rawLevel:1000}; // axe, but current weapon bow
p.professionSkills[3]={skillId:43,rawLevel:1000};
p.playerItemSlots[2]=101;p.playerItemSlots[6]=202;
calls=[];
r=ctx.sourceProfessionPlayerCriticalEvent(p,4,{
  randInclusive:seq([2501,1000],calls)
});
assert.equal(r.weaponFocus.ok,false);
assert.equal(r.weaponFocus.reason,'skill-not-learned');
assert.equal(r.dualWeapon.success,true);
assert.deepEqual(calls,[[0,10000],[0,1000]]);

// Missing shield: Focus can roll, Dual must stop before RNG.
p=blank();
p.professionSkills[1]={skillId:27,rawLevel:1000};
p.professionSkills[3]={skillId:43,rawLevel:1000};
p.playerItemSlots[2]=101;
calls=[];
r=ctx.sourceProfessionPlayerCriticalEvent(p,1,{
  randInclusive:seq([2001,1000],calls)
});
assert.equal(r.weaponFocus.success,true);
assert.equal(r.dualWeapon.proficiencySkipped,true);
assert.equal(r.dualWeapon.reason,'dual-weapon-equipment');
assert.deepEqual(calls,[[0,10000],[0,1000]]);

// Live wiring: ordinary dodge only. SkillDuck and suitDuck returns must stay before the hook.
const resolve=extractFunction(game,'resolveNormalAttack');
const normalHook=resolve.indexOf("sourceProfessionPlayerNormalDodgeEvent(state)");
assert.ok(normalHook>=0);
assert.ok(resolve.indexOf("if(!disableDodge&&n(defender?.skillDuckPower)>0)")<normalHook);
assert.ok(normalHook<resolve.indexOf("const suitDuck=sourceSuitDuckCheck"));
assert.equal((resolve.match(/sourceProfessionPlayerNormalDodgeEvent\(state\)/g)||[]).length,1);

const initial=extractFunction(game,'sourceInitialDodgeOnly');
const initialHook=initial.indexOf("sourceProfessionPlayerNormalDodgeEvent(state)");
assert.ok(initialHook>=0);
assert.ok(initial.indexOf("if(!disableDodge&&n(defender?.skillDuckPower)>0)")<initialHook);
assert.ok(initialHook<initial.indexOf("const suitDuck=sourceSuitDuckCheck"));
assert.equal((initial.match(/sourceProfessionPlayerNormalDodgeEvent\(state\)/g)||[]).length,1);

// Critical hook source position: after critical damage calculation, before GuardBreak and damage<1 RAND.
const criticalHook=resolve.indexOf("sourceProfessionPlayerCriticalEvent(state");
assert.ok(criticalHook>resolve.indexOf("if(critical&&Math.trunc(n(attacker?.weaponType))!==4)"));
assert.ok(criticalHook<resolve.indexOf("const preGuardMultiplier"));
assert.ok(criticalHook<resolve.indexOf("if(damage<1)damage=cRand(0,1)"));
assert.ok(resolve.includes("professionCritical,"));

assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.23',
  focus:'live ordinary dodge + player critical profession proficiency hooks',
  avoidSkillId:25,
  criticalOrder:['PROFESSION_WEAPON_FOCUS','PROFESSION_DUAL_WEAPON'],
  skippedUntilSourceReady:['PROFESSION_DEFLECT','magic-practice','active-skill-post-dispatch'],
  saveSchema:30
}));
