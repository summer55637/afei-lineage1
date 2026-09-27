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

const row=runtime.bySkillId['7'];
assert.ok(row);
assert.equal(row.name,'暴风雨');
assert.equal(row.func,'PROFESSION_STORM');
assert.equal(row.option,'冰|1|0|320|240|1500|4500|0|320|240|');
assert.equal(row.professionClass,2);
assert.equal(row.target,3);
assert.equal(row.kind,1);
assert.equal(row.costMp,10);
assert.equal(row.img1,101697);
assert.equal(row.img2,101678);
assert.equal(row.commonCommand,'BATTLE_COM_S_STORM');

const supportCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(supportCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),supportCtx);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_STORM',7),true);

const levelM=level=>{
  level=Math.trunc(Number(level)||0);
  if(level>90)return 10;if(level>80)return 9;if(level>70)return 8;if(level>60)return 7;if(level>50)return 6;
  if(level>40)return 5;if(level>30)return 4;if(level>20)return 3;if(level>10)return 2;return 1;
};
const costCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,sourceProfessionMagicLevelM:levelM};
vm.createContext(costCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicCostPlan'),costCtx);
for(const [raw,cost] of [[10,30],[20,30],[30,35],[40,35],[50,40],[60,40],[70,45],[80,45],[90,50],[100,50]]){
  const x=costCtx.sourceProfessionMagicCostPlan('PROFESSION_STORM',raw,row.option);
  assert.equal(x.dynamic,true);assert.equal(x.cost,cost);
}

const dexCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,battleDexRoll:()=>999,sourceCRandMacroValue:()=>0};
vm.createContext(dexCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleDexRoll'),dexCtx);
let dexArgs=null;
const dex=dexCtx.sourceProfessionBattleDexRoll(
  {commonCommand:'BATTLE_COM_S_STORM'},80,
  {randMacro:(a,b)=>{dexArgs=[a,b];return 35;}}
);
assert.deepEqual(dexArgs,[20,50]);
assert.equal(dex,65);

const selCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,cRand:()=>0};
vm.createContext(selCtx);
vm.runInContext(extractFunction(game,'sourceProfessionStormSelectSlots'),selCtx);
let seq=[0,0,1];
let sel=selCtx.sourceProfessionStormSelectSlots([13,11,10,12,14],2,{randInclusive:()=>seq.shift()});
assert.deepEqual(JSON.parse(JSON.stringify(sel.slots)),[13,11]);
assert.deepEqual(JSON.parse(JSON.stringify(sel.rolls)),[0,0,1]);
sel=selCtx.sourceProfessionStormSelectSlots([13,11,10],5,{randInclusive:()=>{throw new Error('no RNG expected')}});
assert.deepEqual(JSON.parse(JSON.stringify(sel.slots)),[13,11,10]);
assert.equal(sel.rolls.length,0);

const waterCtx={
  Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,
  state:{},cRand:()=>1
};
vm.createContext(waterCtx);
for(const fn of ['sourceProfessionTargetWaterTurns','sourceProfessionWaterTarget','sourceProfessionWaterState','sourceProfessionWaterApply','sourceProfessionWaterStatusSeq','sourceProfessionThunderWaterPower','sourceProfessionStormWaterTurns']){
  vm.runInContext(extractFunction(game,fn),waterCtx);
}
assert.equal(waterCtx.sourceProfessionStormWaterTurns(3),1);
assert.equal(waterCtx.sourceProfessionStormWaterTurns(4),2);
assert.equal(waterCtx.sourceProfessionStormWaterTurns(6),3);
assert.equal(waterCtx.sourceProfessionStormWaterTurns(8),4);
assert.equal(waterCtx.sourceProfessionStormWaterTurns(10),5);
const unit={professionWaterTurns:0};
const desc={kind:'enemy',unit};
let a=waterCtx.sourceProfessionWaterApply(desc,3);
assert.equal(a.applied,true);assert.equal(unit.professionWaterTurns,3);
let thunder=waterCtx.sourceProfessionThunderWaterPower(unit,'BATTLE_COM_S_SUMMON_THUNDER',200,{randInclusive:()=>74});
assert.equal(thunder.power,600);assert.equal(thunder.tripled,true);
let tick=waterCtx.sourceProfessionWaterStatusSeq(desc);
assert.deepEqual(JSON.parse(JSON.stringify(tick)),{beforeTurns:3,turns:2,expired:false});
assert.equal(unit.professionWaterTurns,2);

const damageCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(damageCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicGetDamage'),damageCtx);
const bugDamage=damageCtx.sourceProfessionMagicGetDamage({
  magicType:2,power:100,command:'BATTLE_COM_S_STORM',
  proficiency:{fire:0,ice:90,thunder:20},
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
let rolls=[100,74];
let dodge=dodgeCtx.sourceProfessionMagicEnemyDodge(
  {hp:100,level:100},
  {magicType:2,command:'BATTLE_COM_S_STORM',proficiencyVector:{fire:0,ice:50,thunder:20},randInclusive:()=>rolls.shift()}
);
assert.equal(dodge.key,'ice');assert.equal(dodge.proficiency,50);assert.equal(dodge.secondRoll,74);assert.equal(dodge.miss,false);
rolls=[100,75];
dodge=dodgeCtx.sourceProfessionMagicEnemyDodge(
  {hp:100,level:100},
  {magicType:2,command:'BATTLE_COM_S_STORM',proficiencyVector:{fire:0,ice:50,thunder:20},randInclusive:()=>rolls.shift()}
);
assert.equal(dodge.secondRoll,75);assert.equal(dodge.miss,true);

const execFn=extractFunction(game,'sourceProfessionStormExecute');
assert.ok(execFn.indexOf('sourceProfessionMagicEnemySortedSlots')<execFn.indexOf("sourceProfessionMagicPracticePower("));
assert.ok(execFn.indexOf("sourceProfessionMagicPracticePower(")<execFn.indexOf('sourceProfessionStormSelectSlots('));
assert.ok(execFn.indexOf('sourceProfessionMagicEnemyDodge')<execFn.indexOf('sourceProfessionMagicGetDamage('));
assert.ok(execFn.indexOf('unusedChangeStatusRoll=cRand(1,100)')<execFn.indexOf('sourceProfessionStatusAttackCheck(targetDesc,30)'));
assert.ok(execFn.indexOf('sourceProfessionStatusAttackCheck(targetDesc,30)')<execFn.indexOf('const before=Math.max(0,Math.trunc(n(target.hp)))'));
assert.ok(execFn.includes('sourceDamageType2UsesThunderPracticeBug:true'));

const hasFn=extractFunction(game,'battleHasAnyStatus');
assert.ok(hasFn.includes('sourceProfessionWaterState(desc)'));
const processFn=extractFunction(game,'processBattleStatusTurn');
assert.ok(processFn.includes('sourceProfessionWaterStatusSeq(desc)'));
assert.ok(processFn.includes('extra.professionWater=professionWater'));

const dispatcher=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(dispatcher.includes("prepared.functionName==='PROFESSION_STORM'"));
assert.ok(dispatcher.includes('sourceProfessionStormExecute(prepared,magicName)'));
assert.ok(dispatcher.indexOf("prepared.functionName==='PROFESSION_STORM'")<dispatcher.indexOf('if(toNo<10)'));

assert.ok(workflow.includes('"tools/check_v263_profession_storm_runtime.mjs"'));
assert.ok(workflow.includes('Run V2.63 Storm regression'));
for(const v of ['2.62','2.63'])assert.ok(html.includes('PLAYABLE CORE V'+v));
assert.match(html,/V2\.63 live：[^<]*暴風雨/);
assert.ok(readme.includes('## V2.63 最新進度'));
assert.ok(changelog.includes('## V2.63 Skill 7 STORM / WATER'));
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.63-core',focus:'Skill 7 STORM / WATER',
  mp:'M-tier 1-2=30,3-4=35,5-6=40,7-8=45,9-10=50',
  target:'SortLoc then random unique count=M-tier with duplicate-index retry RNG',
  fixedBug:'dodge uses Ice proficiency; type-2 damage uses Thunder proficiency path',
  water:'strict roll<30, stored 1/2/3/4/5, own StatusSeq pre-decrement',
  saveSchema:30
}));
