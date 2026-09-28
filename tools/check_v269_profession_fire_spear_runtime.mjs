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

const row=runtime.bySkillId['13'];
assert.ok(row);
assert.equal(row.name,'火龙枪');
assert.equal(row.func,'PROFESSION_FIRE_SPEAR');
assert.equal(row.option,'火|1|1|350|250|3200|4200|1|320|240');
assert.equal(row.target,1);assert.equal(row.kind,1);
assert.equal(row.img1,101697);assert.equal(row.img2,101641);
assert.equal(row.commonCommand,'BATTLE_COM_S_FIRE_SPEAR');

const supportCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(supportCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),supportCtx);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_FIRE_SPEAR',13),true);

const levelM=level=>{
  level=Math.trunc(Number(level)||0);
  if(level>90)return 10;if(level>80)return 9;if(level>70)return 8;if(level>60)return 7;if(level>50)return 6;
  if(level>40)return 5;if(level>30)return 4;if(level>20)return 3;if(level>10)return 2;return 1;
};
const costCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,sourceProfessionMagicLevelM:levelM};
vm.createContext(costCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicCostPlan'),costCtx);
for(const [raw,cost] of [[10,30],[20,30],[30,40],[40,40],[50,60],[60,60],[70,70],[80,70],[90,80],[100,80]]){
  const x=costCtx.sourceProfessionMagicCostPlan('PROFESSION_FIRE_SPEAR',raw,row.option);
  assert.equal(x.dynamic,true);assert.equal(x.cost,cost);
}

const practiceCtx={
  Math,Number,String,state:{},
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionMagicLevelM:levelM,
  sourcePlayerProfessionMagicSuitPower:()=>({mPower:0,m2Power:0}),
  cRand:(a,b)=>a===98&&b===102?100:(a===0&&b===99?99:50)
};
vm.createContext(practiceCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicPracticePower'),practiceCtx);
for(const [raw,power] of [[10,100],[30,100],[40,200],[50,200],[60,300],[70,350],[80,400],[90,450],[100,800]]){
  assert.equal(practiceCtx.sourceProfessionMagicPracticePower('BATTLE_COM_S_FIRE_SPEAR',raw,100,{mPower:0,m2Power:0}).power,power,'raw '+raw);
}

const dexCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,battleDexRoll:()=>999,sourceCRandMacroValue:()=>0};
vm.createContext(dexCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleDexRoll'),dexCtx);
let dexArgs=null;
const directDex=dexCtx.sourceProfessionBattleDexRoll(
  {commonCommand:'BATTLE_COM_S_FIRE_SPEAR'},80,
  {randMacro:(a,b)=>{dexArgs=[a,b];return 35;}}
);
assert.deepEqual(dexArgs,[20,50]);assert.equal(directDex,65);

const chargeCtx={
  Math,Number,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  battlePlayerProfessionCharge:null,
  addLog:()=>{},
  sourceProfessionSkillTemplate:()=>({name:'X'})
};
vm.createContext(chargeCtx);
for(const f of ['sourceProfessionPlayerChargeTurns','sourceProfessionPlayerChargeState','sourceProfessionPlayerChargeStart','sourceProfessionPlayerChargeCancel','sourceProfessionPlayerChargeStep']){
  vm.runInContext(extractFunction(game,f),chargeCtx);
}
assert.equal(chargeCtx.sourceProfessionPlayerChargeTurns('PROFESSION_FIRE_SPEAR'),2);
assert.equal(chargeCtx.sourceProfessionPlayerChargeTurns('PROFESSION_DOOM'),3);
let prepared={functionName:'PROFESSION_FIRE_SPEAR',skillId:13,toNo:10};
let start=chargeCtx.sourceProfessionPlayerChargeStart(prepared);
assert.equal(start.remaining,2);
let step=chargeCtx.sourceProfessionPlayerChargeStep();
assert.equal(step.before,2);assert.equal(step.remaining,1);assert.equal(step.charging,true);
step=chargeCtx.sourceProfessionPlayerChargeStep();
assert.equal(step.before,1);assert.equal(step.remaining,0);assert.equal(step.released,true);assert.equal(step.prepared,prepared);
assert.equal(chargeCtx.battlePlayerProfessionCharge,null);

prepared={functionName:'PROFESSION_DOOM',skillId:3,toNo:21};
start=chargeCtx.sourceProfessionPlayerChargeStart(prepared);
assert.equal(start.remaining,3);
assert.equal(chargeCtx.sourceProfessionPlayerChargeStep().remaining,2);
assert.equal(chargeCtx.sourceProfessionPlayerChargeStep().remaining,1);
step=chargeCtx.sourceProfessionPlayerChargeStep();
assert.equal(step.released,true);assert.equal(step.remaining,0);

const animCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(animCtx);
vm.runInContext(extractFunction(game,'sourceProfessionFireSpearAnimation'),animCtx);
let anim=animCtx.sourceProfessionFireSpearAnimation(row,10);
assert.equal(anim.magicType,1);assert.equal(anim.attIdx,0);assert.equal(anim.img2,101641);assert.equal(anim.x,350);assert.equal(anim.y,250);
anim=animCtx.sourceProfessionFireSpearAnimation(row,0);
assert.equal(anim.img2,101642);assert.equal(anim.x,320);assert.equal(anim.y,240);

const dodgeCtx={
  Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,
  cRand:()=>100,enemyUnitHidden:()=>false,
  sourceProfessionPlayerMagicProficiencyVector:()=>({fire:0,ice:0,thunder:0})
};
vm.createContext(dodgeCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicEnemyDodge'),dodgeCtx);
let rolls=[100,89];
let dodge=dodgeCtx.sourceProfessionMagicEnemyDodge(
  {hp:100,level:100},
  {magicType:1,command:'BATTLE_COM_S_FIRE_SPEAR',proficiencyVector:{fire:50,ice:0,thunder:0},randInclusive:()=>rolls.shift()}
);
assert.equal(dodge.key,'fire');assert.equal(dodge.proficiency,50);assert.equal(dodge.secondRoll,89);assert.equal(dodge.miss,false);
rolls=[100,90];
dodge=dodgeCtx.sourceProfessionMagicEnemyDodge(
  {hp:100,level:100},
  {magicType:1,command:'BATTLE_COM_S_FIRE_SPEAR',proficiencyVector:{fire:50,ice:0,thunder:0},randInclusive:()=>rolls.shift()}
);
assert.equal(dodge.secondRoll,90);assert.equal(dodge.miss,true);

const damageCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(damageCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicGetDamage'),damageCtx);
assert.equal(damageCtx.sourceProfessionMagicGetDamage({
  magicType:1,power:100,command:'BATTLE_COM_S_FIRE_SPEAR',
  proficiency:{fire:20,ice:90,thunder:90},
  resist:{fire:0,ice:0,thunder:0},
  baseSuit:{fire:0,ice:0,thunder:0},equipSuit:{fire:0,ice:0,thunder:0},spirit:{fire:0,ice:0,thunder:0}
}),120);

const execFn=extractFunction(game,'sourceProfessionFireSpearExecute');
assert.ok(execFn.includes('sourceProfessionMagicEnemySortedSlots(multi.slots)'));
assert.ok(execFn.includes('sourceFireSpearTolistCaseCommentedOut:true'));
assert.ok(execFn.indexOf("sourceProfessionSpecialSkillProficiencyByFunction(")<execFn.indexOf("sourceProfessionMagicPracticePower("));
assert.ok(execFn.indexOf('sourceProfessionMagicEnemyDodge')<execFn.indexOf('sourceProfessionMagicGetDamage('));
assert.ok(execFn.indexOf('sourceProfessionMagicGetDamage(')<execFn.indexOf('unusedChangeStatusRoll=cRand(1,100)'));

const attackFn=extractFunction(game,'attackTurn');
assert.ok(attackFn.includes('sourceProfessionPlayerChargeStart(professionPrepared)'));
assert.ok(attackFn.includes('const dexPrepared=chargeForOrder?null:professionPrepared'));
assert.ok(attackFn.includes('sourceProfessionPlayerChargeStep()'));
assert.ok(attackFn.includes('sourceProfessionBattleSkillExecute(releasePrepared,actor)'));
assert.ok(attackFn.indexOf('sourceProfessionPlayerChargeStep()')<attackFn.indexOf('if(statusTurn.skip)'));
assert.ok(attackFn.includes("professionPrepared&&!chargeStarted&&!playerChargeStep"));

const applyFn=extractFunction(game,'battleStatusApply');
assert.ok(applyFn.includes("type==='dragnet'&&targetDesc?.kind==='player'"));
assert.ok(applyFn.includes("sourceProfessionPlayerChargeCancel('天羅地網')"));

const guardFn=extractFunction(game,'guardTurn');
const captureFn=extractFunction(game,'captureTurn');
assert.ok(guardFn.includes('if(sourceProfessionPlayerChargeState())return attackTurn'));
assert.ok(captureFn.includes('if(sourceProfessionPlayerChargeState())return attackTurn'));

const dispatcher=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(dispatcher.includes("prepared.functionName==='PROFESSION_FIRE_SPEAR'"));
assert.ok(dispatcher.includes('sourceProfessionFireSpearExecute(prepared,magicName)'));
assert.ok(dispatcher.indexOf("prepared.functionName==='PROFESSION_FIRE_SPEAR'")<dispatcher.indexOf('if(toNo<10)'));

assert.ok(workflow.includes('"tools/check_v269_profession_fire_spear_runtime.mjs"'));
assert.ok(workflow.includes('Run V2.69 Fire Spear charge regression'));
for(const v of ['2.68','2.69'])assert.ok(html.includes('PLAYABLE CORE V'+v));
assert.match(html,/V2\.69 live：[^<]*火龍槍/);
assert.ok(readme.includes('## V2.69 最新進度'));
assert.ok(changelog.includes('## V2.69 Skill 13 FIRE_SPEAR / shared DOOMTIME charge'));
assert.match(game,/schemaVersion:30/);assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.69-core',focus:'Skill 13 FIRE_SPEAR + shared DOOMTIME',
  mp:'M-tier 1-2=30,3-4=40,5-6=60,7-8=70,9-10=80',
  charge:'FireSpear 2->1->0 release; Doom 3->2->1->0 release',
  liveDex:'EntrySort sees COM1 NONE, so charged path uses default Dex',
  dodge:'Fire type1 + strict secondRoll<90',
  saveSchema:30
}));
