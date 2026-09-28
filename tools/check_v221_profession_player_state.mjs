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
  PROFESSION_CLASS_NONE:0,
  professionSkillDb:runtime,state:null,
  n:v=>Number.isFinite(Number(v))?Number(v):0
};
vm.createContext(ctx);
for(const name of [
  'freshProfessionSkills','normalizeProfessionSkills','sourceProfessionSkillTemplate',
  'sourcePlayerProfessionSkillAt','sourcePlayerProfessionFindSkill','sourcePlayerProfessionSkillDisplayLevel',
  'sourceProfessionSkillAddPlan','sourceProfessionSkillAdd','sourceProfessionSkillPrerequisitePlan',
  'sourceProfessionSkillLearnPreflight','sourceProfessionSkillLearn'
])vm.runInContext(extractFunction(game,name),ctx);

const slots=ctx.freshProfessionSkills();
assert.equal(slots.length,26);
assert.equal(slots.every(x=>x===null),true);

const normalized=ctx.normalizeProfessionSkills([null,{skillId:'9',rawLevel:'1050'},null,{skillId:50,rawLevel:1000}]);
assert.equal(normalized.length,26);
assert.equal(normalized[0],null);
assert.deepEqual(JSON.parse(JSON.stringify(normalized[1])),{skillId:9,rawLevel:1050});
assert.equal(ctx.sourcePlayerProfessionSkillDisplayLevel(normalized[1]),10);
assert.equal(ctx.sourcePlayerProfessionSkillDisplayLevel({rawLevel:-199}),-1);

const blank=()=>({
  professionClass:0,professionLevel:0,professionSkillPoint:0,
  professionSkills:ctx.freshProfessionSkills(),gold:0,transmigration:0
});

let p=blank();
let add=ctx.sourceProfessionSkillAdd(p,1,0);
assert.equal(add.ok,true);assert.equal(add.slot,0);assert.equal(add.displayLevel,1);assert.equal(add.rawLevel,100);
add=ctx.sourceProfessionSkillAdd(p,9,999);
assert.equal(add.ok,true);assert.equal(add.slot,1);assert.equal(add.displayLevel,100);assert.equal(add.rawLevel,10000);
assert.equal(ctx.sourceProfessionSkillAdd(p,1,10).reason,'already-learned');

p=blank();
for(let i=0;i<26;i++)assert.equal(ctx.sourceProfessionSkillAdd(p,1000+i,10).ok,true);
assert.equal(ctx.sourceProfessionSkillAdd(p,2000,10).reason,'skill-slots-full');

p=blank();p.gold=999999;p.professionSkillPoint=1;
assert.equal(ctx.sourceProfessionSkillLearnPreflight({skillId:1,target:p}).reason,'no-profession');
p.professionClass=1;
assert.equal(ctx.sourceProfessionSkillLearnPreflight({skillId:1,target:p}).reason,'profession-mismatch');
p.professionClass=2;p.professionSkillPoint=0;
assert.equal(ctx.sourceProfessionSkillLearnPreflight({skillId:1,target:p}).reason,'no-skill-point');

p=blank();p.professionClass=2;p.professionLevel=1;p.professionSkillPoint=1;p.gold=1000;p.transmigration=1;
let learn=ctx.sourceProfessionSkillLearnPreflight({skillId:1,target:p});
assert.equal(learn.ok,true);assert.equal(learn.cost,1000);
assert.equal(learn.initialDisplayLevel,10);assert.equal(learn.initialRawLevel,1000);assert.equal(learn.slot,0);
learn=ctx.sourceProfessionSkillLearn({skillId:1,target:p});
assert.equal(learn.ok,true);assert.equal(p.gold,0);assert.equal(p.professionSkillPoint,0);
assert.deepEqual(JSON.parse(JSON.stringify(p.professionSkills[0])),{skillId:1,rawLevel:1000});

p=blank();p.professionClass=2;p.professionSkillPoint=1;p.gold=499;
assert.equal(ctx.sourceProfessionSkillLearnPreflight({skillId:1,target:p,skillRate:.5}).reason,'gold-short');
p.gold=500;
assert.equal(ctx.sourceProfessionSkillLearnPreflight({skillId:1,target:p,skillRate:.5}).cost,500);

p=blank();p.professionClass=2;p.professionSkillPoint=1;p.gold=100000;
let req=ctx.sourceProfessionSkillLearnPreflight({skillId:9,target:p});
assert.equal(req.reason,'missing-prerequisite');assert.equal(req.limit,1);assert.equal(req.needPercent,70);
ctx.sourceProfessionSkillAdd(p,1,69);
req=ctx.sourceProfessionSkillLearnPreflight({skillId:9,target:p});
assert.equal(req.reason,'prerequisite-level');assert.equal(req.level,69);
p.professionSkills[0].rawLevel=7000;
assert.equal(ctx.sourceProfessionSkillLearnPreflight({skillId:9,target:p}).ok,true);

p=blank();p.professionClass=3;p.professionSkillPoint=1;p.gold=100000;
req=ctx.sourceProfessionSkillLearnPreflight({skillId:50,target:p});
assert.equal(req.reason,'missing-prerequisite-alternative');
assert.deepEqual(JSON.parse(JSON.stringify(req.alternatives)),[30,31,32]);
ctx.sourceProfessionSkillAdd(p,31,10);
assert.equal(ctx.sourceProfessionSkillLearnPreflight({skillId:50,target:p}).ok,true);

p=blank();p.professionClass=2;p.professionSkillPoint=1;p.gold=999;p.transmigration=0;
assert.equal(ctx.sourceProfessionSkillLearnPreflight({skillId:1,target:p,transRequirement:2}).reason,'gold-short');
p.gold=1000;
req=ctx.sourceProfessionSkillLearnPreflight({skillId:1,target:p,transRequirement:2});
assert.equal(req.reason,'transmigration-short');assert.equal(req.requiredTrans,2);
p.transmigration=2;
assert.equal(ctx.sourceProfessionSkillLearnPreflight({skillId:1,target:p,transRequirement:2}).ok,true);

const holey=ctx.normalizeProfessionSkills([null,{skillId:1,rawLevel:1000},null,{skillId:9,rawLevel:7000}]);
assert.equal(holey[0],null);assert.equal(holey[1].skillId,1);assert.equal(holey[2],null);assert.equal(holey[3].skillId,9);

assert.ok(game.includes('const PROFESSION_SKILL_SLOT_COUNT=26;'));
assert.ok(game.includes('professionClass:PROFESSION_CLASS_NONE,professionLevel:0,professionSkillPoint:0'));
assert.ok(game.includes('professionSkills:freshProfessionSkills()'));
assert.ok(game.includes('s.professionSkills=normalizeProfessionSkills(raw.professionSkills)'));
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);
assert.equal(game.includes('s.schemaVersion=29;'),false);

console.log(JSON.stringify({
  pass:true,version:'V2.21',
  focus:'persistent profession state + 26 skill slots + NPC learning lifecycle',
  slots:26,classes:{none:0,fighter:1,wizard:2,hunter:3},
  initialLearnLevel:10,saveSchema:30
}));
