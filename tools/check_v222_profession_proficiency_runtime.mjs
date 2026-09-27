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

const ctx={
  Math,Number,String,Object,Array,
  PROFESSION_SKILL_SLOT_COUNT:26,
  PROFESSION_SKILL_LEVEL_MAX:100,
  professionSkillDb:runtime,state:null,
  n:v=>Number.isFinite(Number(v))?Number(v):0
};
vm.createContext(ctx);
for(const name of [
  'sourceProfessionSkillTemplate',
  'sourcePlayerProfessionSkillAt',
  'sourceProfessionLevelCheckPlan','sourceProfessionLevelCheckApply',
  'sourceProfessionSkillProficiencyRollPlan','sourceProfessionSkillProficiencyApply',
  'sourceProfessionSkillPostDispatchProficiency',
  'sourceProfessionFindSkillByFunction','sourceProfessionSpecialSkillProficiencyByFunction',
  'sourceProfessionWeaponFocusMarker','sourceProfessionWeaponFocusProficiency',
  'sourceProfessionDualWeaponProficiency'
])vm.runInContext(extractFunction(game,name),ctx);

const blank=()=>({
  professionLevel:1,professionSkillPoint:0,
  professionSkills:Array(26).fill(null)
});
const seq=(values,calls=[])=>((min,max)=>{
  calls.push([min,max]);
  assert.ok(values.length>0,'unexpected RNG');
  return values.shift();
});

// First RAND happens even when raw is already maxed; second RAND must not happen.
let calls=[];
let roll=ctx.sourceProfessionSkillProficiencyRollPlan({
  skillId:1,rawSkillLevel:10000,randInclusive:seq([7777],calls)
});
assert.equal(roll.maxed,true);
assert.equal(roll.success,false);
assert.equal(roll.randNum,7777);
assert.equal(roll.randNum2,null);
assert.deepEqual(calls,[[0,10000]]);

// strict > with FIX=0.
calls=[];
roll=ctx.sourceProfessionSkillProficiencyRollPlan({
  skillId:1,rawSkillLevel:1000,randInclusive:seq([1000,0],calls)
});
assert.equal(roll.success,false);
assert.deepEqual(calls,[[0,10000],[0,0]]);
roll=ctx.sourceProfessionSkillProficiencyRollPlan({
  skillId:1,rawSkillLevel:1000,randInclusive:seq([1001,0],[])
});
assert.equal(roll.success,true);
assert.equal(roll.rawAfter,1001);

// FIX=10 -> second range 0..1000 and boundary is still strict.
calls=[];
roll=ctx.sourceProfessionSkillProficiencyRollPlan({
  skillId:9,rawSkillLevel:1000,randInclusive:seq([2000,1000],calls)
});
assert.equal(roll.upFixValue,1000);
assert.equal(roll.success,false);
assert.deepEqual(calls,[[0,10000],[0,1000]]);
roll=ctx.sourceProfessionSkillProficiencyRollPlan({
  skillId:9,rawSkillLevel:1000,randInclusive:seq([2001,1000],[])
});
assert.equal(roll.success,true);

// Level sum: common IDs 63/64/65 always contribute 5000.
let p=blank();
p.professionSkills[0]={skillId:63,rawLevel:100};
p.professionSkills[1]={skillId:1,rawLevel:2000};
let level=ctx.sourceProfessionLevelCheckPlan(p);
assert.equal(level.skillLevelSum,7000);
assert.equal(level.nextLevelNeedPoint,7000);
assert.equal(level.levelUp,true);

// A check advances exactly once, even with huge surplus.
p=blank();
for(let i=0;i<20;i++)p.professionSkills[i]={skillId:100+i,rawLevel:10000};
level=ctx.sourceProfessionLevelCheckApply(p);
assert.equal(level.skillLevelSum,200000);
assert.equal(p.professionLevel,2);
assert.equal(p.professionSkillPoint,1);

// Fixed code has no real profession Lv26 cap.
p=blank();p.professionLevel=26;p.professionSkillPoint=4;
for(let i=0;i<19;i++)p.professionSkills[i]={skillId:100+i,rawLevel:10000};
level=ctx.sourceProfessionLevelCheckApply(p);
assert.equal(level.nextLevelNeedPoint,182000);
assert.equal(level.levelUp,true);
assert.equal(p.professionLevel,27);
assert.equal(p.professionSkillPoint,5);

// Only a successful new raw multiple of 100 triggers level check.
p=blank();p.professionSkillPoint=2;
p.professionSkills[0]={skillId:1,rawLevel:1099};
p.professionSkills[1]={skillId:9,rawLevel:5900};
let applied=ctx.sourceProfessionSkillProficiencyApply(p,0,{randInclusive:seq([10000,0],[])});
assert.equal(applied.success,true);
assert.equal(applied.rawAfter,1100);
assert.equal(applied.centuryBoundary,true);
assert.equal(applied.levelCheck.levelUp,true);
assert.equal(p.professionLevel,2);
assert.equal(p.professionSkillPoint,3);

// ret==-1 first consumes rand()%10; >5 skips proficiency entirely.
p=blank();p.professionSkills[0]={skillId:1,rawLevel:1000};
let inclusiveCalls=0;
let post=ctx.sourceProfessionSkillPostDispatchProficiency({
  target:p,slot:0,dispatchRet:-1,targetIsPet:false,
  randModulo:()=>6,randInclusive:()=>{inclusiveCalls++;return 9999}
});
assert.equal(post.proficiencySkipped,true);
assert.equal(post.reason,'dispatch-ret-random');
assert.equal(post.dispatchFailureRoll,6);
assert.equal(inclusiveCalls,0);
assert.equal(p.professionSkills[0].rawLevel,1000);

// <=5 continues into normal proficiency; dispatchRet 0 also still gives a chance.
post=ctx.sourceProfessionSkillPostDispatchProficiency({
  target:p,slot:0,dispatchRet:-1,targetIsPet:false,
  randModulo:()=>5,randInclusive:seq([1001,0],[])
});
assert.equal(post.proficiencySkipped,false);
assert.equal(post.proficiency.success,true);
assert.equal(p.professionSkills[0].rawLevel,1001);
post=ctx.sourceProfessionSkillPostDispatchProficiency({
  target:p,slot:0,dispatchRet:0,targetIsPet:false,
  randModulo:()=>{throw new Error('must not use modulo')},randInclusive:seq([1002,0],[])
});
assert.equal(post.proficiency.success,true);
assert.equal(p.professionSkills[0].rawLevel,1002);

// Skill 57 non-Pet gate happens after the ret==-1 modulo branch and before normal proficiency RNG.
p=blank();p.professionSkills[0]={skillId:57,rawLevel:1000};
let moduloCalls=0;inclusiveCalls=0;
post=ctx.sourceProfessionSkillPostDispatchProficiency({
  target:p,slot:0,dispatchRet:-1,targetIsPet:false,
  randModulo:()=>{moduloCalls++;return 5},
  randInclusive:()=>{inclusiveCalls++;return 9999}
});
assert.equal(moduloCalls,1);
assert.equal(inclusiveCalls,0);
assert.equal(post.reason,'enrage-target-not-pet');
assert.equal(p.professionSkills[0].rawLevel,1000);

// Special function lookup is slot-ordered and weapon focus adds the option marker gate.
p=blank();
p.professionSkills[3]={skillId:27,rawLevel:1000}; // axe focus
p.professionSkills[5]={skillId:25,rawLevel:1000}; // avoid
let special=ctx.sourceProfessionSpecialSkillProficiencyByFunction(
  p,'PROFESSION_AVOID',{randInclusive:seq([1001,0],[])}
);
assert.equal(special.slot,5);
assert.equal(special.skillId,25);
assert.equal(p.professionSkills[5].rawLevel,1001);
assert.equal(ctx.sourceProfessionWeaponFocusMarker(1),'斧');
assert.equal(ctx.sourceProfessionWeaponFocusMarker(4),'弓');
assert.equal(ctx.sourceProfessionWeaponFocusMarker(19),'石');
special=ctx.sourceProfessionWeaponFocusProficiency(p,1,{randInclusive:seq([2001,1000],[])});
assert.equal(special.slot,3);
assert.equal(special.skillId,27);
assert.equal(p.professionSkills[3].rawLevel,1001);

// Dual weapon requires both equipment flags before it even looks up the skill.
p=blank();p.professionSkills[2]={skillId:43,rawLevel:1000};
inclusiveCalls=0;
special=ctx.sourceProfessionDualWeaponProficiency(p,{
  armEquipped:true,shieldEquipped:false,randInclusive:()=>{inclusiveCalls++;return 9999}
});
assert.equal(special.proficiencySkipped,true);
assert.equal(inclusiveCalls,0);
special=ctx.sourceProfessionDualWeaponProficiency(p,{
  armEquipped:true,shieldEquipped:true,randInclusive:seq([2501,1000],[])
});
assert.equal(special.skillId,43);
assert.equal(p.professionSkills[2].rawLevel,1001);

assert.ok(game.includes('const PROFESSION_SKILL_LEVEL_MAX=100;'));
assert.ok(game.includes('const nextLevelNeedPoint=oldLevel*70*100;'));
assert.ok(game.includes("const randNum=Math.trunc(n(randInclusive(0,10000)));"));
assert.ok(game.includes("const randNum2=Math.trunc(n(randInclusive(0,upFixValue)));"));
assert.ok(game.includes('const success=randNum>rawBefore+randNum2;'));
assert.ok(game.includes("if(entry.skillId===57&&targetIsPet!==true)"));
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.22',
  focus:'profession proficiency RNG + profession level check + post-dispatch gates',
  addPoint:1,maxRaw:10000,professionNeedPerLevel:7000,
  commonSkillFixedRaw:5000,professionHardCap:false,saveSchema:30
}));
