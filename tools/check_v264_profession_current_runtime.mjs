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

const row=runtime.bySkillId['8'];
assert.ok(row);
assert.equal(row.name,'电流术');
assert.equal(row.func,'PROFESSION_CURRENT');
assert.equal(row.option,'电|0|1|0|0|0|0|0');
assert.equal(row.professionClass,2);
assert.equal(row.target,3);
assert.equal(row.kind,1);
assert.equal(row.costMp,10);
assert.equal(row.img1,101697);
assert.equal(row.img2,101624);
assert.equal(row.commonCommand,'BATTLE_COM_S_CURRENT');

const supportCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(supportCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),supportCtx);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_CURRENT',8),true);

const levelM=level=>{
  level=Math.trunc(Number(level)||0);
  if(level>90)return 10;if(level>80)return 9;if(level>70)return 8;if(level>60)return 7;if(level>50)return 6;
  if(level>40)return 5;if(level>30)return 4;if(level>20)return 3;if(level>10)return 2;return 1;
};
const costCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,sourceProfessionMagicLevelM:levelM};
vm.createContext(costCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicCostPlan'),costCtx);
for(const [raw,cost] of [[10,30],[20,30],[30,40],[40,40],[50,50],[60,50],[70,60],[80,70],[90,80],[100,100]]){
  const x=costCtx.sourceProfessionMagicCostPlan('PROFESSION_CURRENT',raw,row.option);
  assert.equal(x.dynamic,true);assert.equal(x.cost,cost);
}

const practiceCtx={
  Math,Number,String,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionMagicLevelM:levelM,
  sourcePlayerProfessionMagicSuitPower:()=>({mPower:0,m2Power:0}),
  cRand:(a,b)=>a===0&&b===99?99:(a===98&&b===102?100:50)
};
vm.createContext(practiceCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicPracticePower'),practiceCtx);
for(const [raw,power] of [[10,50],[20,10],[30,10],[40,10],[50,150],[70,150],[80,200],[90,200],[100,300]]){
  const p=practiceCtx.sourceProfessionMagicPracticePower('BATTLE_COM_S_CURRENT',raw,100);
  assert.equal(p.power,power,'practice raw '+raw);
}

const dexCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,battleDexRoll:()=>999,sourceCRandMacroValue:()=>0};
vm.createContext(dexCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleDexRoll'),dexCtx);
let dexArgs=null;
const dex=dexCtx.sourceProfessionBattleDexRoll(
  {commonCommand:'BATTLE_COM_S_CURRENT'},80,
  {randMacro:(a,b)=>{dexArgs=[a,b];return 25;}}
);
assert.deepEqual(dexArgs,[0,50]);
assert.equal(dex,75);

const waterCtx={
  Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,
  cRand:()=>1
};
vm.createContext(waterCtx);
vm.runInContext(extractFunction(game,'sourceProfessionTargetWaterTurns'),waterCtx);
vm.runInContext(extractFunction(game,'sourceProfessionThunderWaterPower'),waterCtx);
let calls=0;
let w=waterCtx.sourceProfessionThunderWaterPower(
  {professionWaterTurns:0},'BATTLE_COM_S_CURRENT',200,
  {randInclusive:()=>{calls++;return 1}}
);
assert.equal(w.power,200);assert.equal(w.roll,null);assert.equal(calls,0);
w=waterCtx.sourceProfessionThunderWaterPower(
  {professionWaterTurns:2},'BATTLE_COM_S_CURRENT',200,{randInclusive:()=>74}
);
assert.equal(w.power,600);assert.equal(w.tripled,true);
w=waterCtx.sourceProfessionThunderWaterPower(
  {professionWaterTurns:2},'BATTLE_COM_S_CURRENT',200,{randInclusive:()=>75}
);
assert.equal(w.power,200);assert.equal(w.tripled,false);

const dodgeCtx={
  Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,
  cRand:()=>100,enemyUnitHidden:()=>false,
  sourceProfessionPlayerMagicProficiencyVector:()=>({fire:0,ice:0,thunder:0})
};
vm.createContext(dodgeCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicEnemyDodge'),dodgeCtx);
let rolls=[100,74];
let dodge=dodgeCtx.sourceProfessionMagicEnemyDodge(
  {hp:100,level:100},
  {magicType:3,command:'BATTLE_COM_S_CURRENT',proficiencyVector:{fire:0,ice:20,thunder:50},randInclusive:()=>rolls.shift()}
);
assert.equal(dodge.key,'thunder');assert.equal(dodge.proficiency,50);assert.equal(dodge.secondRoll,74);assert.equal(dodge.miss,false);
rolls=[100,75];
dodge=dodgeCtx.sourceProfessionMagicEnemyDodge(
  {hp:100,level:100},
  {magicType:3,command:'BATTLE_COM_S_CURRENT',proficiencyVector:{fire:0,ice:20,thunder:50},randInclusive:()=>rolls.shift()}
);
assert.equal(dodge.secondRoll,75);assert.equal(dodge.miss,true);

const damageCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(damageCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicGetDamage'),damageCtx);
assert.equal(damageCtx.sourceProfessionMagicGetDamage({
  magicType:3,power:100,command:'BATTLE_COM_S_CURRENT',
  proficiency:{fire:0,ice:20,thunder:90},
  resist:{fire:0,ice:0,thunder:0},
  baseSuit:{fire:0,ice:0,thunder:0},
  equipSuit:{fire:0,ice:0,thunder:0},
  spirit:{fire:0,ice:0,thunder:0}
}),120);

const execFn=extractFunction(game,'sourceProfessionCurrentExecute');
assert.ok(execFn.indexOf('sourceProfessionMagicEnemySortedSlots')<execFn.indexOf("sourceProfessionMagicPracticePower("));
assert.ok(execFn.indexOf("sourceProfessionMagicPracticePower(")<execFn.indexOf('sourceProfessionStormSelectSlots('));
assert.ok(execFn.indexOf('sourceProfessionMagicEnemyDodge')<execFn.indexOf('sourceProfessionThunderWaterPower('));
assert.ok(execFn.indexOf('sourceProfessionThunderWaterPower(')<execFn.indexOf('sourceProfessionMagicPreDamagePower('));
assert.ok(execFn.indexOf('sourceProfessionMagicGetDamage(')<execFn.indexOf('unusedChangeStatusRoll=cRand(1,100)'));
assert.ok(execFn.includes('sourceCurrentTargetCountEqualsMTier:true'));
assert.ok(execFn.includes('sourceDamageType3UsesIcePracticeBug:true'));

const encloseAnim=extractFunction(game,'sourceProfessionEncloseAnimation');
const summonAnim=extractFunction(game,'sourceProfessionSummonThunderAnimation');
const stormAnim=extractFunction(game,'sourceProfessionStormAnimation');
assert.ok(encloseAnim.includes('magicType:-1,attIdx:0'));
assert.ok(summonAnim.includes('magicType:3,attIdx:0'));
assert.ok(stormAnim.includes('magicType:2,attIdx:2'));

const dispatcher=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(dispatcher.includes("prepared.functionName==='PROFESSION_CURRENT'"));
assert.ok(dispatcher.includes('sourceProfessionCurrentExecute(prepared,magicName)'));
assert.ok(dispatcher.indexOf("prepared.functionName==='PROFESSION_CURRENT'")<dispatcher.indexOf('if(toNo<10)'));

assert.ok(workflow.includes('"tools/check_v264_profession_current_runtime.mjs"'));
assert.ok(workflow.includes('Run V2.64 Current regression'));
for(const v of ['2.63','2.64'])assert.ok(html.includes('PLAYABLE CORE V'+v));
assert.match(html,/V2\.64 live：[^<]*電流術/);
assert.ok(readme.includes('## V2.64 最新進度'));
assert.ok(changelog.includes('## V2.64 Skill 8 CURRENT'));
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.64-core',focus:'Skill 8 CURRENT',
  mp:'M-tier 1-2=30,3-4=40,5-6=50,7=60,8=70,9=80,10=100',
  practice:'tier1=50,2-4=10,5-7=150,8-9=200,10=300',
  target:'SortLoc + M-tier rejection sampling',
  fixedBug:'dodge Thunder / damage Ice path; second dodge gate <75',
  water:'Water>0 => strict <75 then pre-damage x3',
  saveSchema:30
}));
