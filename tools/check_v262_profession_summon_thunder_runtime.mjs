import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const workflow=fs.readFileSync('.github/workflows/generate-item-make-runtime.yml','utf8');
const readme=fs.readFileSync('README.md','utf8');
const changelog=fs.readFileSync('docs/changelog/part-07-v1.75-onward.md','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_profession_skill_runtime.json','utf8'));

function extractFunction(src,name){
  const sig='function '+name+'(';const i=src.indexOf(sig);assert.ok(i>=0,'missing '+name);
  const op=src.indexOf('(',i);let pd=0,q=null,esc=false,line=false,block=false,cp=-1;
  for(let p=op;p<src.length;p++){const c=src[p],nx=src[p+1];
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&nx==='/'){block=false;p++}continue}
    if(q){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===q)q=null;continue}
    if(c==='/'&&nx==='/'){line=true;p++;continue}
    if(c==='/'&&nx==='*'){block=true;p++;continue}
    if(c==="'"||c==='"'||c.charCodeAt(0)===96){q=c;continue}
    if(c==='(')pd++;else if(c===')'&&--pd===0){cp=p;break}
  }
  assert.ok(cp>=0,'bad signature '+name);
  const bs=src.indexOf('{',cp);let d=0;q=null;esc=false;line=false;block=false;
  for(let p=bs;p<src.length;p++){const c=src[p],nx=src[p+1];
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&nx==='/'){block=false;p++}continue}
    if(q){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===q)q=null;continue}
    if(c==='/'&&nx==='/'){line=true;p++;continue}
    if(c==='/'&&nx==='*'){block=true;p++;continue}
    if(c==="'"||c==='"'||c.charCodeAt(0)===96){q=c;continue}
    if(c==='{')d++;else if(c==='}'&&--d===0)return src.slice(i,p+1);
  }
  throw new Error('unterminated '+name);
}

const row=runtime.bySkillId['6'];
assert.ok(row);
assert.equal(row.name,'召雷术');
assert.equal(row.func,'PROFESSION_SUMMON_THUNDER');
assert.equal(row.option,'电|0|1|0|0|0|0|0');
assert.equal(row.professionClass,2);
assert.equal(row.target,1);
assert.equal(row.kind,1);
assert.equal(row.costMp,10);
assert.equal(row.img1,101697);
assert.equal(row.img2,101628);
assert.equal(row.commonCommand,'BATTLE_COM_S_SUMMON_THUNDER');

const supportCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(supportCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),supportCtx);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_SUMMON_THUNDER',6),true);

const levelM=level=>{
  level=Math.trunc(Number(level)||0);
  if(level>90)return 10;if(level>80)return 9;if(level>70)return 8;if(level>60)return 7;if(level>50)return 6;
  if(level>40)return 5;if(level>30)return 4;if(level>20)return 3;if(level>10)return 2;return 1;
};
const costCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,sourceProfessionMagicLevelM:levelM};
vm.createContext(costCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicCostPlan'),costCtx);
for(const [raw,cost] of [[10,10],[20,10],[30,20],[40,20],[50,25],[70,25],[80,30],[100,30]]){
  const x=costCtx.sourceProfessionMagicCostPlan('PROFESSION_SUMMON_THUNDER',raw,row.option);
  assert.equal(x.dynamic,true);assert.equal(x.cost,cost);
}

const dexCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,battleDexRoll:()=>999,sourceCRandMacroValue:()=>0};
vm.createContext(dexCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleDexRoll'),dexCtx);
let dexArgs=null;
const dex=dexCtx.sourceProfessionBattleDexRoll(
  {commonCommand:'BATTLE_COM_S_SUMMON_THUNDER'},80,
  {randMacro:(a,b)=>{dexArgs=[a,b];return 12;}}
);
assert.deepEqual(dexArgs,[0,20]);
assert.equal(dex,88);

const waterCtx={
  Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,
  cRand:()=>1
};
vm.createContext(waterCtx);
vm.runInContext(extractFunction(game,'sourceProfessionTargetWaterTurns'),waterCtx);
vm.runInContext(extractFunction(game,'sourceProfessionThunderWaterPower'),waterCtx);
let rngCalls=0;
let w=waterCtx.sourceProfessionThunderWaterPower(
  {professionWaterTurns:0},'BATTLE_COM_S_SUMMON_THUNDER',250,
  {randInclusive:()=>{rngCalls++;return 1}}
);
assert.equal(w.power,250);assert.equal(w.roll,null);assert.equal(rngCalls,0);

w=waterCtx.sourceProfessionThunderWaterPower(
  {professionWaterTurns:2},'BATTLE_COM_S_SUMMON_THUNDER',250,
  {randInclusive:()=>74}
);
assert.equal(w.power,750);assert.equal(w.tripled,true);assert.equal(w.roll,74);

w=waterCtx.sourceProfessionThunderWaterPower(
  {professionWaterTurns:2},'BATTLE_COM_S_SUMMON_THUNDER',250,
  {randInclusive:()=>75}
);
assert.equal(w.power,250);assert.equal(w.tripled,false);assert.equal(w.roll,75);

const damageCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(damageCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicGetDamage'),damageCtx);
const bugDamage=damageCtx.sourceProfessionMagicGetDamage({
  magicType:3,power:100,command:'BATTLE_COM_S_SUMMON_THUNDER',
  proficiency:{fire:0,ice:20,thunder:90},
  resist:{fire:0,ice:0,thunder:0},
  baseSuit:{fire:0,ice:0,thunder:0},
  equipSuit:{fire:0,ice:0,thunder:0},
  spirit:{fire:0,ice:0,thunder:0}
});
assert.equal(bugDamage,120);

const dodgeCtx={
  Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,
  cRand:()=>100,enemyUnitHidden:()=>false,
  sourceProfessionPlayerMagicProficiencyVector:()=>({fire:0,ice:0,thunder:0})
};
vm.createContext(dodgeCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicEnemyDodge'),dodgeCtx);
const dodge=dodgeCtx.sourceProfessionMagicEnemyDodge(
  {hp:100,level:100},
  {magicType:3,command:'BATTLE_COM_S_SUMMON_THUNDER',
   proficiencyVector:{fire:0,ice:20,thunder:50},randInclusive:()=>100}
);
assert.equal(dodge.key,'thunder');
assert.equal(dodge.proficiency,50);
assert.equal(dodge.miss,false);

const execFn=extractFunction(game,'sourceProfessionSummonThunderExecute');
assert.ok(execFn.indexOf('sourceSetMagicPetMultiList(rawToNo)')<execFn.indexOf('sourceProfessionPlayerMagicProficiencyVector()'));
assert.ok(execFn.indexOf('sourceProfessionPlayerMagicProficiencyVector()')<execFn.indexOf("sourceProfessionSpecialSkillProficiencyByFunction("));
assert.ok(execFn.indexOf("state,'PROFESSION_THUNDER_PRACTICE'")<execFn.indexOf("sourceProfessionMagicPracticePower("));
assert.ok(execFn.indexOf('sourceProfessionMagicEnemyDodge')<execFn.indexOf('sourceProfessionThunderWaterPower('));
assert.ok(execFn.indexOf('sourceProfessionThunderWaterPower(')<execFn.indexOf('sourceProfessionMagicPreDamagePower('));
assert.ok(execFn.indexOf('sourceProfessionMagicPreDamagePower(')<execFn.indexOf('sourceProfessionMagicGetDamage('));
assert.ok(execFn.indexOf('sourceProfessionMagicGetDamage(')<execFn.indexOf('unusedChangeStatusRoll=cRand(1,100)'));
assert.ok(execFn.includes('magicType:3'));
assert.ok(execFn.includes('sourceDamageType3UsesIcePracticeBug:true'));

const dispatcher=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(dispatcher.includes("prepared.functionName==='PROFESSION_SUMMON_THUNDER'"));
assert.ok(dispatcher.includes('sourceProfessionSummonThunderExecute(prepared,magicName)'));
assert.ok(dispatcher.indexOf("prepared.functionName==='PROFESSION_SUMMON_THUNDER'")<dispatcher.indexOf('if(toNo<10)'));

assert.ok(workflow.includes('"tools/check_v262_profession_summon_thunder_runtime.mjs"'));
assert.ok(workflow.includes('Run V2.62 Summon Thunder regression'));
for(const v of ['2.61','2.62'])assert.ok(html.includes('PLAYABLE CORE V'+v));
assert.match(html,/V2\.62 live：[^<]*召雷術/);
assert.ok(readme.includes('## V2.62 最新進度'));
assert.ok(changelog.includes('## V2.62 Skill 6 SUMMON_THUNDER'));
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.62-core',focus:'Skill 6 SUMMON_THUNDER',
  mp:'M-tier 1-2=10,3-4=20,5-7=25,8-10=30',
  dex:'WORKQUICK+20 - RAND(0, work*0.2)',
  fixedBug:'dodge uses Thunder proficiency; type-3 damage uses Ice proficiency path',
  water:'CHAR_WORKWATER>0 => RAND(1,100)<75 then pre-damage power x3',
  saveSchema:30
}));
