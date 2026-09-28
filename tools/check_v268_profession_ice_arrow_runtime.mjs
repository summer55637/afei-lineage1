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

const row=runtime.bySkillId['12'];
assert.ok(row);
assert.equal(row.name,'冰箭术');
assert.equal(row.func,'PROFESSION_ICE_ARROW');
assert.equal(row.option,'冰|0|1|10|-20|0|0|0|10|20');
assert.equal(row.target,1);
assert.equal(row.costMp,10);
assert.equal(row.kind,1);
assert.equal(row.img1,101697);
assert.equal(row.img2,101648);
assert.equal(row.commonCommand,'BATTLE_COM_S_ICE_ARROW');

const supportCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(supportCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),supportCtx);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_ICE_ARROW',12),true);

const levelM=level=>{
  level=Math.trunc(Number(level)||0);
  if(level>90)return 10;if(level>80)return 9;if(level>70)return 8;if(level>60)return 7;if(level>50)return 6;
  if(level>40)return 5;if(level>30)return 4;if(level>20)return 3;if(level>10)return 2;return 1;
};

const costCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,sourceProfessionMagicLevelM:levelM};
vm.createContext(costCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicCostPlan'),costCtx);
for(const [raw,cost] of [[10,10],[30,10],[40,15],[70,15],[80,20],[100,20]]){
  const x=costCtx.sourceProfessionMagicCostPlan('PROFESSION_ICE_ARROW',raw,row.option);
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
for(const [raw,power] of [[10,140],[50,180],[90,220],[100,250]]){
  assert.equal(practiceCtx.sourceProfessionMagicPracticePower('BATTLE_COM_S_ICE_ARROW',raw,100,{mPower:0,m2Power:0}).power,power);
}

const dexCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,battleDexRoll:()=>999,sourceCRandMacroValue:()=>0};
vm.createContext(dexCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleDexRoll'),dexCtx);
let dexArgs=null;
const dex=dexCtx.sourceProfessionBattleDexRoll(
  {commonCommand:'BATTLE_COM_S_ICE_ARROW'},80,
  {randMacro:(a,b)=>{dexArgs=[a,b];return 12;}}
);
assert.deepEqual(dexArgs,[0,20]);assert.equal(dex,88);

const specCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(specCtx);
vm.runInContext(extractFunction(game,'sourceProfessionIceArrowSpec'),specCtx);
assert.deepEqual(JSON.parse(JSON.stringify(specCtx.sourceProfessionIceArrowSpec(1))),{tier:1,success:10,decDex:10,activeTurns:1,storedTurns:2});
assert.deepEqual(JSON.parse(JSON.stringify(specCtx.sourceProfessionIceArrowSpec(5))),{tier:5,success:20,decDex:20,activeTurns:1,storedTurns:2});
assert.deepEqual(JSON.parse(JSON.stringify(specCtx.sourceProfessionIceArrowSpec(6))),{tier:6,success:20,decDex:20,activeTurns:2,storedTurns:3});
assert.deepEqual(JSON.parse(JSON.stringify(specCtx.sourceProfessionIceArrowSpec(10))),{tier:10,success:25,decDex:25,activeTurns:3,storedTurns:4});

const statuses=new Map();
const applyCtx={
  Math,Number,Map,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  battleStatuses:statuses,
  battleStatusKey:()=> 'enemy:e1',
  battleHasAnyStatus:()=>false,
  cRand:()=>0
};
vm.createContext(applyCtx);
vm.runInContext(extractFunction(game,'sourceProfessionIceArrowSpec'),applyCtx);
vm.runInContext(extractFunction(game,'sourceProfessionIceArrowApply'),applyCtx);
let called=false;
let a=applyCtx.sourceProfessionIceArrowApply({},10,{randInclusive:()=>25});
assert.equal(a.applied,true);assert.equal(a.roll,25);assert.equal(a.storedTurns,4);
assert.equal(statuses.get('enemy:e1').turns,4);
statuses.clear();
a=applyCtx.sourceProfessionIceArrowApply({},10,{randInclusive:()=>26});
assert.equal(a.applied,false);assert.equal(a.reason,'success-roll');
applyCtx.battleHasAnyStatus=()=>true;
a=applyCtx.sourceProfessionIceArrowApply({},10,{randInclusive:()=>{called=true;return 0}});
assert.equal(a.blocked,true);assert.equal(a.roll,null);assert.equal(called,false);

const tickCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(tickCtx);
vm.runInContext(extractFunction(game,'sourceProfessionIceArrowStatusTick'),tickCtx);
const unit={quick:100,roundFixQuick:100,roundQuick:100};
let t=tickCtx.sourceProfessionIceArrowStatusTick({kind:'enemy',unit},{iceArrowDecDex:25});
assert.equal(t.fixedDexBefore,100);assert.equal(t.fixedDexAfter,75);assert.equal(unit.roundFixQuick,75);assert.equal(unit.roundQuick,100);
t=tickCtx.sourceProfessionIceArrowStatusTick({kind:'enemy',unit},{iceArrowDecDex:25});
assert.equal(t.fixedDexAfter,56);assert.equal(unit.roundQuick,100);
assert.equal(t.sourceNextPreCommandRebuildsFixDex,true);

const canMoveFn=extractFunction(game,'battleStatusCanMove');
assert.equal(canMoveFn.includes("st.type==='iceArrow'"),false);

const animCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(animCtx);
vm.runInContext(extractFunction(game,'sourceProfessionIceArrowAnimation'),animCtx);
let anim=animCtx.sourceProfessionIceArrowAnimation(row,10);
assert.equal(anim.magicType,2);assert.equal(anim.attIdx,0);assert.equal(anim.img2,101648);assert.equal(anim.x,10);assert.equal(anim.y,-20);
anim=animCtx.sourceProfessionIceArrowAnimation(row,0);
assert.equal(anim.img2,101649);assert.equal(anim.x,10);assert.equal(anim.y,20);

const damageCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(damageCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicGetDamage'),damageCtx);
assert.equal(damageCtx.sourceProfessionMagicGetDamage({
  magicType:2,power:100,command:'BATTLE_COM_S_ICE_ARROW',
  proficiency:{fire:0,ice:90,thunder:20},
  resist:{fire:0,ice:0,thunder:0},
  baseSuit:{fire:0,ice:0,thunder:0},equipSuit:{fire:0,ice:0,thunder:0},spirit:{fire:0,ice:0,thunder:0}
}),120);

const dodgeCtx={
  Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,
  cRand:()=>100,enemyUnitHidden:()=>false,
  sourceProfessionPlayerMagicProficiencyVector:()=>({fire:0,ice:0,thunder:0})
};
vm.createContext(dodgeCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicEnemyDodge'),dodgeCtx);
const dodge=dodgeCtx.sourceProfessionMagicEnemyDodge(
  {hp:100,level:100},
  {magicType:2,command:'BATTLE_COM_S_ICE_ARROW',proficiencyVector:{fire:0,ice:50,thunder:20},randInclusive:()=>100}
);
assert.equal(dodge.key,'ice');assert.equal(dodge.proficiency,50);assert.equal(dodge.secondRoll,null);assert.equal(dodge.miss,false);

const execFn=extractFunction(game,'sourceProfessionIceArrowExecute');
assert.ok(execFn.indexOf("sourceProfessionSpecialSkillProficiencyByFunction(")<execFn.indexOf("sourceProfessionMagicPracticePower("));
assert.ok(execFn.indexOf('sourceProfessionMagicEnemyDodge')<execFn.indexOf('sourceProfessionMagicGetDamage('));
assert.ok(execFn.indexOf('unusedChangeStatusRoll=cRand(1,100)')<execFn.indexOf('sourceProfessionIceArrowApply('));
assert.ok(execFn.indexOf('sourceProfessionIceArrowApply(')<execFn.indexOf('const before=Math.max(0,Math.trunc(n(target.hp)))'));
assert.ok(execFn.includes('sourceDamageType2UsesThunderPracticeBug:true'));
assert.ok(execFn.includes('sourceIceArrowDoesNotBlockMove:true'));

const processFn=extractFunction(game,'processBattleStatusTurn');
assert.ok(processFn.includes("st.type==='iceArrow'"));
assert.ok(processFn.includes('sourceProfessionIceArrowStatusTick(desc,st)'));

const dispatcher=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(dispatcher.includes("prepared.functionName==='PROFESSION_ICE_ARROW'"));
assert.ok(dispatcher.includes('sourceProfessionIceArrowExecute(prepared,magicName)'));
assert.ok(dispatcher.indexOf("prepared.functionName==='PROFESSION_ICE_ARROW'")<dispatcher.indexOf('if(toNo<10)'));

assert.ok(workflow.includes('"tools/check_v268_profession_ice_arrow_runtime.mjs"'));
assert.ok(workflow.includes('Run V2.68 Ice Arrow regression'));
for(const v of ['2.67','2.68'])assert.ok(html.includes('PLAYABLE CORE V'+v));
assert.match(html,/V2\.68 live：[^<]*冰箭術/);
assert.ok(readme.includes('## V2.68 最新進度'));
assert.ok(changelog.includes('## V2.68 Skill 12 ICE_ARROW'));
assert.match(game,/schemaVersion:30/);assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.68-core',focus:'Skill 12 ICE_ARROW',
  mp:'M-tier 1-3=10,4-7=15,8-10=20',
  status:'<= success, decDex 10/20/25, active ticks 1/2/3',
  fixedBug:'CanMove ICEARROW commented; FIXDEX-only tick after EntrySort; no persistent speed effect',
  damageBug:'type2 dodge Ice / damage Thunder path',
  saveSchema:30
}));
