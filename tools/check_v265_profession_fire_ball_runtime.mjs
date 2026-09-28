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

const row=runtime.bySkillId['9'];
assert.ok(row);
assert.equal(row.name,'火星球');
assert.equal(row.func,'PROFESSION_FIRE_BALL');
assert.equal(row.option,'火|1|1|150|150|1500|4500|0|330|280|420|320|250|180|350|260');
assert.equal(row.professionClass,2);
assert.equal(row.target,8);
assert.equal(row.kind,1);
assert.equal(row.img1,101697);
assert.equal(row.img2,101693);
assert.equal(row.commonCommand,'BATTLE_COM_S_FIRE_BALL');

const supportCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(supportCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),supportCtx);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_FIRE_BALL',9),true);

const levelM=level=>{
  level=Math.trunc(Number(level)||0);
  if(level>90)return 10;if(level>80)return 9;if(level>70)return 8;if(level>60)return 7;if(level>50)return 6;
  if(level>40)return 5;if(level>30)return 4;if(level>20)return 3;if(level>10)return 2;return 1;
};
const costCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,sourceProfessionMagicLevelM:levelM};
vm.createContext(costCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicCostPlan'),costCtx);
for(const [raw,cost] of [[10,30],[20,30],[30,35],[40,35],[50,40],[60,40],[70,45],[80,45],[90,50],[100,50]]){
  assert.equal(costCtx.sourceProfessionMagicCostPlan('PROFESSION_FIRE_BALL',raw,row.option).cost,cost);
}

const practiceCtx={
  Math,Number,String,state:{},n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionMagicLevelM:levelM,
  sourcePlayerProfessionMagicSuitPower:()=>({mPower:0,m2Power:0}),
  cRand:(a,b)=>a===0&&b===99?99:(a===98&&b===102?100:50)
};
vm.createContext(practiceCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicPracticePower'),practiceCtx);
for(const [raw,power] of [[10,160],[20,160],[30,180],[40,180],[50,220],[60,220],[70,260],[80,280],[90,320],[100,360]]){
  assert.equal(practiceCtx.sourceProfessionMagicPracticePower('BATTLE_COM_S_FIRE_BALL',raw,100).power,power);
}

const dexCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,battleDexRoll:()=>999,sourceCRandMacroValue:()=>0};
vm.createContext(dexCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleDexRoll'),dexCtx);
let dexArgs=null;
const dex=dexCtx.sourceProfessionBattleDexRoll(
  {commonCommand:'BATTLE_COM_S_FIRE_BALL'},80,
  {randMacro:(a,b)=>{dexArgs=[a,b];return 25;}}
);
assert.deepEqual(dexArgs,[0,50]);assert.equal(dex,75);

const rowCtx={
  Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceSetMagicPetTargetableDescFromSlot:slot=>[10,12,14,15,17,19].includes(slot)?{slot}:null
};
vm.createContext(rowCtx);
vm.runInContext(extractFunction(game,'sourceProfessionFireBallRowSlots'),rowCtx);
assert.deepEqual(JSON.parse(JSON.stringify(rowCtx.sourceProfessionFireBallRowSlots(23))),[10,12,14]);
assert.deepEqual(JSON.parse(JSON.stringify(rowCtx.sourceProfessionFireBallRowSlots(24))),[15,17,19]);
assert.deepEqual(JSON.parse(JSON.stringify(rowCtx.sourceProfessionFireBallRowSlots(21))),[]);

const animCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(animCtx);
vm.runInContext(extractFunction(game,'sourceProfessionFireBallAnimation'),animCtx);
let anim=animCtx.sourceProfessionFireBallAnimation(row,23);
assert.equal(anim.attIdx,1);assert.equal(anim.magicType,1);assert.equal(anim.img2,101693);assert.equal(anim.x,250);assert.equal(anim.y,180);
anim=animCtx.sourceProfessionFireBallAnimation(row,24);
assert.equal(anim.img2,101693);assert.equal(anim.x,350);assert.equal(anim.y,260);

const damageCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(damageCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicGetDamage'),damageCtx);
assert.equal(damageCtx.sourceProfessionMagicGetDamage({
  magicType:1,power:100,command:'BATTLE_COM_S_FIRE_BALL',
  proficiency:{fire:20,ice:90,thunder:90},
  resist:{fire:0,ice:0,thunder:0},
  baseSuit:{fire:0,ice:0,thunder:0},equipSuit:{fire:0,ice:0,thunder:0},spirit:{fire:0,ice:0,thunder:0}
}),120);

const execFn=extractFunction(game,'sourceProfessionFireBallExecute');
assert.ok(execFn.indexOf('sourceProfessionMagicEnemySortedSlots(multi.slots)')<execFn.indexOf("sourceProfessionMagicPracticePower("));
assert.ok(execFn.indexOf("sourceProfessionMagicPracticePower(")<execFn.indexOf('sourceProfessionFireBallRowSlots(toNo)'));
assert.ok(execFn.indexOf('sourceProfessionFireBallRowSlots(toNo)')<execFn.indexOf('for(const slot of targetSlots)'));
assert.ok(execFn.indexOf('sourceProfessionMagicEnemyDodge')<execFn.indexOf('sourceProfessionMagicGetDamage('));
assert.ok(execFn.indexOf('sourceProfessionMagicGetDamage(')<execFn.indexOf('unusedChangeStatusRoll=cRand(1,100)'));
assert.ok(execFn.includes('sourceFireBallRebuildsRowAfterSort:true'));
assert.ok(execFn.includes('sourceRowSlotOrderAscending:true'));

const dispatcher=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(dispatcher.includes("prepared.functionName==='PROFESSION_FIRE_BALL'"));
assert.ok(dispatcher.includes('sourceProfessionFireBallExecute(prepared,magicName)'));
assert.ok(dispatcher.indexOf("prepared.functionName==='PROFESSION_FIRE_BALL'")<dispatcher.indexOf('if(toNo<10)'));

assert.ok(workflow.includes('"tools/check_v265_profession_fire_ball_runtime.mjs"'));
assert.ok(workflow.includes('Run V2.65 Fire Ball regression'));
for(const v of ['2.64','2.65'])assert.ok(html.includes('PLAYABLE CORE V'+v));
assert.match(html,/V2\.65 live：[^<]*火星球/);
assert.ok(readme.includes('## V2.65 最新進度'));
assert.ok(changelog.includes('## V2.65 Skill 9 FIRE_BALL'));
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.65-core',focus:'Skill 9 FIRE_BALL',
  target:'ONE_ROW 23/24 + MultiList row fallback + ascending row rebuild',
  mp:'M-tier 1-2=30,3-4=35,5-6=40,7-8=45,9-10=50',
  practice:'160/180/220/260/280/320/360',
  dex:'WORKQUICK+20 - RAND(0, work*0.5)',
  saveSchema:30
}));
