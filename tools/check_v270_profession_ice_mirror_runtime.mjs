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
    if(c==="'"||c=='"'||c.charCodeAt(0)===96){q=c;continue}
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
    if(c==="'"||c=='"'||c.charCodeAt(0)===96){q=c;continue}
    if(c==='{')d++;else if(c==='}'&&--d===0)return src.slice(i,p+1);
  }
  throw new Error('unterminated '+name);
}

const row=runtime.bySkillId['14'];
assert.ok(row);
assert.equal(row.name,'冰镜术');
assert.equal(row.text,'冰属性的明镜带来可怕的效果');
assert.equal(row.func,'PROFESSION_ICE_MIRROR');
assert.equal(row.option,'冰|0|1|0|0|0|0|0|0|50|0|-50');
assert.equal(row.skillId,14);
assert.equal(row.professionClass,2);
assert.equal(row.target,1);
assert.equal(row.kind,1);
assert.equal(row.icon,29254);
assert.equal(row.img1,101697);
assert.equal(row.img2,101652);
assert.equal(row.cost,100000);
assert.equal(row.fixValue,10);
assert.equal(row.limit1,12);
assert.equal(row.percent1,70);
assert.equal(row.dispatchKnown,true);
assert.equal(row.commonCommand,'BATTLE_COM_S_ICE_MIRROR');

const levelM=level=>{
  level=Math.trunc(Number(level)||0);
  if(level>90)return 10;if(level>80)return 9;if(level>70)return 8;if(level>60)return 7;if(level>50)return 6;
  if(level>40)return 5;if(level>30)return 4;if(level>20)return 3;if(level>10)return 2;return 1;
};

const supportCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(supportCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),supportCtx);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_ICE_MIRROR',14),true);

const costCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,sourceProfessionMagicLevelM:levelM};
vm.createContext(costCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicCostPlan'),costCtx);
for(const [raw,cost] of [[10,20],[20,20],[30,25],[40,25],[50,30],[60,30],[70,35],[80,35],[90,40],[100,40]]){
  const x=costCtx.sourceProfessionMagicCostPlan('PROFESSION_ICE_MIRROR',raw,row.option);
  assert.equal(x.dynamic,true);
  assert.equal(x.cost,cost,'raw '+raw);
}

const dexCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,battleDexRoll:()=>999,sourceCRandMacroValue:()=>0};
vm.createContext(dexCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleDexRoll'),dexCtx);
let dexArgs=null;
const dex=dexCtx.sourceProfessionBattleDexRoll(
  {commonCommand:'BATTLE_COM_S_ICE_MIRROR'},80,
  {randMacro:(a,b)=>{dexArgs=[a,b];return 35;}}
);
assert.deepEqual(dexArgs,[20,50]);
assert.equal(dex,65);

const practiceCalls=[];
const practiceCtx={
  Math,Number,String,state:{},
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionMagicLevelM:levelM,
  sourcePlayerProfessionMagicSuitPower:()=>({mPower:0,m2Power:0}),
  cRand:(a,b)=>{practiceCalls.push([a,b]);return 50;}
};
vm.createContext(practiceCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicPracticePower'),practiceCtx);
const practice=practiceCtx.sourceProfessionMagicPracticePower(
  'BATTLE_COM_S_ICE_MIRROR',100,100,{mPower:0,m2Power:0}
);
assert.equal(practice.skillLevel,10);
assert.equal(practice.power,0);
assert.equal(practice.hpPower,0);
assert.equal(practice.varianceRoll,null);
assert.equal(practiceCalls.length,2);
assert.deepEqual(practiceCalls,[[1,100],[0,99]]);

const animationCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(animationCtx);
vm.runInContext(extractFunction(game,'sourceProfessionIceMirrorAnimation'),animationCtx);
let anim=animationCtx.sourceProfessionIceMirrorAnimation(row,0);
assert.equal(anim.magicType,2);
assert.equal(anim.attIdx,0);
assert.equal(anim.img1,101697);
assert.equal(anim.img2,101652);
assert.equal(anim.x,0);
assert.equal(anim.y,50);
assert.equal(anim.directPlayerSide,true);
anim=animationCtx.sourceProfessionIceMirrorAnimation(row,10);
assert.equal(anim.img2,101652);
assert.equal(anim.x,0);
assert.equal(anim.y,-50);
assert.equal(anim.directPlayerSide,false);

const specialCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,sourceProfessionMagicLevelM:levelM};
vm.createContext(specialCtx);
vm.runInContext(extractFunction(game,'sourceProfessionIceMirrorDamage'),specialCtx);
let special=specialCtx.sourceProfessionIceMirrorDamage(
  {roundDefense:100,serverDerived:{charStats:{tgh:500}}},100
);
assert.equal(special.ok,true);
assert.equal(special.rate,60);
assert.equal(special.baseDefense,5);
assert.equal(special.damage,208);
assert.equal(special.sourceRidePetNo,-1);
assert.equal(special.sourceNpcCapBugUnemulated,true);

special=specialCtx.sourceProfessionIceMirrorDamage(
  {roundDefense:2000,serverDerived:{charStats:{tgh:500}}},100
);
assert.equal(special.damage,1918);
assert.equal(special.sourceNpcCapBugUnemulated,true);
assert.equal(special.sourceNpcCapWouldUseBrokenDefenseIndex,true);

const preCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(preCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicPreDamagePower'),preCtx);
assert.equal(preCtx.sourceProfessionMagicPreDamagePower(200,0),200);

const damageCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(damageCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicGetDamage'),damageCtx);
// type=2 damage path intentionally consumes Thunder proficiency, not Ice.
const type2Damage=damageCtx.sourceProfessionMagicGetDamage({
  magicType:2,power:100,command:'BATTLE_COM_S_ICE_MIRROR',
  proficiency:{fire:0,ice:90,thunder:20},
  resist:{fire:0,ice:0,thunder:0},
  baseSuit:{fire:0,ice:0,thunder:0},
  equipSuit:{fire:0,ice:0,thunder:0},
  spirit:{fire:0,ice:0,thunder:0}
});
assert.equal(type2Damage,120);

const dodgeCtx={
  Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,
  enemyUnitHidden:()=>false
};
vm.createContext(dodgeCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicEnemyDodge'),dodgeCtx);
const dodge=dodgeCtx.sourceProfessionMagicEnemyDodge(
  {hp:100,level:100},
  {
    magicType:2,command:'BATTLE_COM_S_ICE_MIRROR',
    proficiencyVector:{fire:0,ice:0,thunder:0},
    randInclusive:()=>100
  }
);
assert.equal(dodge.key,'ice');
assert.equal(dodge.proficiency,0);
assert.equal(dodge.secondRoll,null);
assert.equal(dodge.miss,false);

const execFn=extractFunction(game,'sourceProfessionIceMirrorExecute');
assert.ok(execFn.includes("skillId!==14"));
assert.ok(execFn.indexOf('sourceProfessionSpecialSkillProficiencyByFunction(')<execFn.indexOf('sourceProfessionMagicPracticePower('));
assert.ok(execFn.indexOf('sourceProfessionMagicEnemyDodge')<execFn.indexOf('sourceProfessionIceMirrorDamage('));
assert.ok(execFn.indexOf('sourceProfessionIceMirrorDamage(')<execFn.indexOf('sourceProfessionMagicGetDamage('));
assert.ok(execFn.indexOf('sourceProfessionMagicGetDamage(')<execFn.indexOf('unusedChangeStatusRoll=cRand(1,100)'));
assert.ok(execFn.includes('sourcePracticePowerDefaultZero:true'));
assert.ok(execFn.includes('sourcePracticeVarianceRollNotConsumed:true'));
assert.ok(execFn.includes('sourceDamageType2UsesThunderPracticeBug:true'));
assert.ok(execFn.includes('sourceNpcCapBugUnemulated:true'));

const dexFn=extractFunction(game,'sourceProfessionBattleDexRoll');
assert.ok(dexFn.includes("command!=='BATTLE_COM_S_ICE_MIRROR'"));
assert.ok(dexFn.includes("command==='BATTLE_COM_S_ICE_MIRROR'"));

const dispatcher=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(dispatcher.includes("prepared.functionName==='PROFESSION_ICE_MIRROR'"));
assert.ok(dispatcher.includes('sourceProfessionIceMirrorExecute(prepared,magicName)'));
assert.ok(dispatcher.indexOf("prepared.functionName==='PROFESSION_ICE_MIRROR'")<dispatcher.indexOf("prepared.functionName==='PROFESSION_ICE_ARROW'"));

assert.ok(workflow.includes('"tools/check_v270_profession_ice_mirror_runtime.mjs"'));
assert.ok(workflow.includes('Run V2.70 Ice Mirror regression'));

assert.ok(readme.includes('PLAYABLE CORE V2.70'));
assert.ok(readme.includes('## V2.70 最新進度'));
assert.ok(changelog.includes('## V2.70 Skill 14 ICE_MIRROR'));
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.70-core',focus:'Skill 14 ICE_MIRROR',
  mp:'M-tier 1-2=20,3-4=25,5-6=30,7-8=35,9-10=40',
  practice:'fixed C has no ICE_MIRROR GET_PRACTICE case: power 0; consumes critical + M2 but no variance',
  dex:'WORKQUICK+20 - RAND(work*0.2,work*0.5)',
  dodge:'Ice proficiency; no second command gate',
  damage:'defense-derived special power + fixed type-2 Thunder proficiency/resist GET_DAMAGE path',
  animation:'101652; direct x/y=0/50, other target x/y=0/-50',
  sourceBug:'NPC 800-cap line uses defense float as character index; Web keeps cap explicitly unmodelled',
  saveSchema:30
}));
