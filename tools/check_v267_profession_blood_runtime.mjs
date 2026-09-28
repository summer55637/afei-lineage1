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

const row=runtime.bySkillId['11'];
assert.ok(row);
assert.equal(row.name,'嗜血成性');
assert.equal(row.func,'PROFESSION_BLOOD');
assert.equal(row.option,'无|0|1|0|80|0|0|0|0|100');
assert.equal(row.target,5);
assert.equal(row.costMp,0);
assert.equal(row.kind,2);
assert.equal(row.img1,101697);
assert.equal(row.img2,101689);
assert.equal(row.commonCommand,'BATTLE_COM_S_BLOOD');

const supportCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(supportCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),supportCtx);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_BLOOD',11),true);

const levelM=level=>{
  level=Math.trunc(Number(level)||0);
  if(level>90)return 10;if(level>80)return 9;if(level>70)return 8;if(level>60)return 7;if(level>50)return 6;
  if(level>40)return 5;if(level>30)return 4;if(level>20)return 3;if(level>10)return 2;return 1;
};

const costCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,sourceProfessionMagicLevelM:levelM};
vm.createContext(costCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicCostPlan'),costCtx);
const cost=costCtx.sourceProfessionMagicCostPlan('PROFESSION_BLOOD',100,row.option);
assert.equal(cost.dynamic,false);
assert.equal(cost.cost,-1);
assert.equal(row.costMp,0);

const practiceCtx={
  Math,Number,String,state:{},
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionMagicLevelM:levelM,
  sourcePlayerProfessionMagicSuitPower:()=>({mPower:0,m2Power:0}),
  cRand:(a,b)=>a===98&&b===102?100:(a===0&&b===99?99:50)
};
vm.createContext(practiceCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicPracticePower'),practiceCtx);
let p=practiceCtx.sourceProfessionMagicPracticePower('BATTLE_COM_S_BLOOD',10,100,{mPower:0,m2Power:0});
assert.equal(p.skillLevel,1);assert.equal(p.power,15);
p=practiceCtx.sourceProfessionMagicPracticePower('BATTLE_COM_S_BLOOD',100,100,{mPower:0,m2Power:0});
assert.equal(p.skillLevel,10);assert.equal(p.power,60);
p=practiceCtx.sourceProfessionMagicPracticePower('BATTLE_COM_S_BLOOD',100,1,{mPower:0,m2Power:0});
assert.equal(p.power,0);assert.equal(p.varianceRoll,null);

const dexCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,battleDexRoll:()=>999,sourceCRandMacroValue:()=>0};
vm.createContext(dexCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleDexRoll'),dexCtx);
let dexArgs=null;
const dex=dexCtx.sourceProfessionBattleDexRoll(
  {commonCommand:'BATTLE_COM_S_BLOOD'},80,
  {randMacro:(a,b)=>{dexArgs=[a,b];return 12;}}
);
assert.deepEqual(dexArgs,[0,30]);assert.equal(dex,88);

const dodgeState={luck:4};
const dodgeCtx={
  Math,Number,state:dodgeState,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  cRand:()=>1,
  sourceProfessionPlayerMagicProficiencyVector:()=>({fire:0,ice:20,thunder:0}),
  sourcePlayerEquipMagicDefense:()=>({quick:10})
};
vm.createContext(dodgeCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBloodSelfDodge'),dodgeCtx);
let d=dodgeCtx.sourceProfessionBloodSelfDodge({randInclusive:()=>27,proficiencyVector:{fire:0,ice:20,thunder:0},equipMagic:{quick:10}});
assert.equal(d.threshold,26);
assert.equal(d.miss,false);
assert.equal(d.sourceMinusOneResistRead,10);
assert.equal(d.equipQuickPart,4);
assert.equal(d.sourceResistFieldBug,'CHAR_WORK_I_PROFICIENCY');
d=dodgeCtx.sourceProfessionBloodSelfDodge({randInclusive:()=>26,proficiencyVector:{fire:0,ice:20,thunder:0},equipMagic:{quick:10}});
assert.equal(d.miss,true);

const mpCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(mpCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBloodMpRestore'),mpCtx);
assert.equal(mpCtx.sourceProfessionBloodMpRestore(100,1).addMp,40);
assert.equal(mpCtx.sourceProfessionBloodMpRestore(100,3).addMp,45);
assert.equal(mpCtx.sourceProfessionBloodMpRestore(100,5).addMp,50);
assert.equal(mpCtx.sourceProfessionBloodMpRestore(100,7).addMp,55);
assert.equal(mpCtx.sourceProfessionBloodMpRestore(100,10).addMp,60);

const animCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(animCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBloodAnimation'),animCtx);
for(const [tier,img] of [[1,101692],[2,101692],[3,101691],[6,101691],[7,101690],[9,101690],[10,101689]]){
  const a=animCtx.sourceProfessionBloodAnimation(row,tier);
  assert.equal(a.img2,img);assert.equal(a.attIdx,0);assert.equal(a.magicType,-1);
  assert.equal(a.x,0);assert.equal(a.y,100);
}

const execFn=extractFunction(game,'sourceProfessionBloodExecute');
assert.ok(execFn.includes("if(rawToNo!==0)"));
assert.ok(execFn.includes("sourceWouldDisconnect:true"));
assert.ok(execFn.indexOf("sourceProfessionMagicPracticePower(")<execFn.indexOf("sourceProfessionBloodSelfDodge()"));
assert.ok(execFn.indexOf("sourceProfessionBloodSelfDodge()")<execFn.indexOf("sourceProfessionMagicPreDamagePower("));
assert.ok(execFn.indexOf("sourceProfessionMagicPreDamagePower(")<execFn.indexOf("sourceProfessionBloodMpRestore("));
assert.ok(execFn.indexOf("sourceProfessionBloodMpRestore(")<execFn.indexOf("state.hp=Math.max(0,hpBefore-damage)"));
assert.ok(execFn.indexOf("state.hp=Math.max(0,hpBefore-damage)")<execFn.indexOf("sourceProfessionSignApplySelfRestore(0,mpRestore.addMp)"));
assert.ok(execFn.includes("sourceMpRestoreEvenAfterSelfDeath:true"));

const dispatcher=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(dispatcher.includes("prepared.functionName==='PROFESSION_BLOOD'"));
assert.ok(dispatcher.includes('sourceProfessionBloodExecute(prepared,magicName)'));
assert.ok(dispatcher.indexOf("prepared.functionName==='PROFESSION_BLOOD'")<dispatcher.indexOf('if(toNo<10)'));

assert.ok(workflow.includes('"tools/check_v267_profession_blood_runtime.mjs"'));
assert.ok(workflow.includes('Run V2.67 Blood regression'));
for(const v of ['2.66','2.67'])assert.ok(html.includes('PLAYABLE CORE V'+v));
assert.match(html,/V2\.67 live：[^<]*嗜血成性/);
assert.ok(readme.includes('## V2.67 最新進度'));
assert.ok(changelog.includes('## V2.67 Skill 11 BLOOD'));
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.67-core',focus:'Skill 11 BLOOD',
  costMp:0,
  practice:'currentHP*(tier*5+10)% then suit/variance',
  selfDodge:'magicType -1 => I_PROFICIENCY bug + QU*0.4',
  order:'practice -> self dodge -> self UN_POW -> damage -> add_mp -> self HP subtract -> MP apply',
  saveSchema:30
}));
