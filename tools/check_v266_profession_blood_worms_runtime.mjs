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
  if(line){if(c==='\n')line=false;continue} if(block){if(c==='*'&&nx==='/'){block=false;p++}continue}
  if(q){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===q)q=null;continue}
  if(c==='/'&&nx==='/'){line=true;p++;continue} if(c==='/'&&nx==='*'){block=true;p++;continue}
  if(c==="'"||c==='"'||c.charCodeAt(0)===96){q=c;continue}
  if(c==='(')pd++;else if(c===')'&&--pd===0){cp=p;break}
 }
 const bs=src.indexOf('{',cp);let d=0;q=null;esc=false;line=false;block=false;
 for(let p=bs;p<src.length;p++){const c=src[p],nx=src[p+1];
  if(line){if(c==='\n')line=false;continue} if(block){if(c==='*'&&nx==='/'){block=false;p++}continue}
  if(q){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===q)q=null;continue}
  if(c==='/'&&nx==='/'){line=true;p++;continue} if(c==='/'&&nx==='*'){block=true;p++;continue}
  if(c==="'"||c==='"'||c.charCodeAt(0)===96){q=c;continue}
  if(c==='{')d++;else if(c==='}'&&--d===0)return src.slice(i,p+1);
 }
 throw new Error('unterminated '+name);
}
const row=runtime.bySkillId['10'];
assert.equal(row.name,'嗜血蛊');assert.equal(row.func,'PROFESSION_BLOOD_WORMS');
assert.equal(row.option,'无|0|1|0|-120|0|0|0|0|120|');
assert.equal(row.target,1);assert.equal(row.kind,1);assert.equal(row.img2,101623);
assert.equal(row.commonCommand,'BATTLE_COM_S_BLOOD_WORMS');

const supportCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(supportCtx);vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),supportCtx);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_BLOOD_WORMS',10),true);

const levelM=level=>{level=Math.trunc(Number(level)||0);if(level>90)return 10;if(level>80)return 9;if(level>70)return 8;if(level>60)return 7;if(level>50)return 6;if(level>40)return 5;if(level>30)return 4;if(level>20)return 3;if(level>10)return 2;return 1};
const costCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,sourceProfessionMagicLevelM:levelM};
vm.createContext(costCtx);vm.runInContext(extractFunction(game,'sourceProfessionMagicCostPlan'),costCtx);
for(const [raw,cost] of [[10,5],[40,5],[50,10],[90,10],[100,15]])assert.equal(costCtx.sourceProfessionMagicCostPlan('PROFESSION_BLOOD_WORMS',raw,row.option).cost,cost);

const practiceCtx={Math,Number,String,state:{},n:v=>Number.isFinite(Number(v))?Number(v):0,sourceProfessionMagicLevelM:levelM,sourcePlayerProfessionMagicSuitPower:()=>({mPower:0,m2Power:0}),cRand:(a,b)=>a===0&&b===99?99:(a===98&&b===102?100:50)};
vm.createContext(practiceCtx);vm.runInContext(extractFunction(game,'sourceProfessionMagicPracticePower'),practiceCtx);
for(const [raw,power] of [[10,30],[50,70],[100,120]])assert.equal(practiceCtx.sourceProfessionMagicPracticePower('BATTLE_COM_S_BLOOD_WORMS',raw,100).power,power);

const dexCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,battleDexRoll:()=>999,sourceCRandMacroValue:()=>0};
vm.createContext(dexCtx);vm.runInContext(extractFunction(game,'sourceProfessionBattleDexRoll'),dexCtx);
let dexArgs=null;const dex=dexCtx.sourceProfessionBattleDexRoll({commonCommand:'BATTLE_COM_S_BLOOD_WORMS'},80,{randMacro:(a,b)=>{dexArgs=[a,b];return 12;}});
assert.deepEqual(dexArgs,[0,30]);assert.equal(dex,88);

const specCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(specCtx);vm.runInContext(extractFunction(game,'sourceProfessionBloodWormSpec'),specCtx);vm.runInContext(extractFunction(game,'sourceProfessionBloodWormImmediateHeal'),specCtx);
assert.deepEqual(JSON.parse(JSON.stringify(specCtx.sourceProfessionBloodWormSpec(1))),{tier:1,activeTurns:2,storedTurns:3,immediateRate:5});
assert.deepEqual(JSON.parse(JSON.stringify(specCtx.sourceProfessionBloodWormSpec(5))),{tier:5,activeTurns:3,storedTurns:4,immediateRate:10});
assert.deepEqual(JSON.parse(JSON.stringify(specCtx.sourceProfessionBloodWormSpec(8))),{tier:8,activeTurns:4,storedTurns:5,immediateRate:15});
assert.deepEqual(JSON.parse(JSON.stringify(specCtx.sourceProfessionBloodWormSpec(10))),{tier:10,activeTurns:5,storedTurns:6,immediateRate:20});
assert.equal(specCtx.sourceProfessionBloodWormImmediateHeal(37,1).heal,1);
assert.equal(specCtx.sourceProfessionBloodWormImmediateHeal(37,10).heal,7);

const unit={hp:100};const state={hp:50,maxHp:100};
const tickCtx={
 Math,Number,state,n:v=>Number.isFinite(Number(v))?Number(v):0,
 sourceProfessionMagicLevelM:levelM,
 battleStatusHp:()=>unit.hp,battleStatusSetHp:(d,h)=>{unit.hp=h},
 sourceMarkEnemyDeathCredit:()=>{},
 sourceProfessionSignApplySelfRestore:(hp)=>{const before=state.hp;state.hp=Math.min(state.maxHp,state.hp+Math.trunc(hp));return {hpBefore:before,hpAfter:state.hp,hpApplied:state.hp-before}},
};
vm.createContext(tickCtx);vm.runInContext(extractFunction(game,'sourceProfessionBloodWormStatusTick'),tickCtx);
const tick=tickCtx.sourceProfessionBloodWormStatusTick({kind:'enemy',unit},{bloodWormStoredTier:10,bloodWormCaster:'player'});
assert.equal(tick.storedTier,10);assert.equal(tick.tickTier,1);assert.equal(tick.damage,40);assert.equal(tick.requestedHeal,2);
assert.equal(unit.hp,60);assert.equal(state.hp,52);assert.equal(tick.sourceDoubleMConversionBug,true);

const applyFn=extractFunction(game,'sourceProfessionBloodWormApply');
assert.equal(applyFn.includes('cRand('),false);
const execFn=extractFunction(game,'sourceProfessionBloodWormExecute');
assert.ok(execFn.indexOf('unusedChangeStatusRoll=cRand(1,100)')<execFn.indexOf('sourceProfessionBloodWormImmediateHeal('));
assert.ok(execFn.indexOf('sourceProfessionBloodWormImmediateHeal(')<execFn.indexOf('sourceProfessionBloodWormApply('));
assert.ok(execFn.indexOf('sourceProfessionBloodWormApply(')<execFn.indexOf('const before=Math.max(0,Math.trunc(n(target.hp)))'));
assert.ok(execFn.indexOf('sourceProfessionSignApplySelfRestore(addHp,0)')<execFn.indexOf('sourceProfessionMagicWakeTarget'));
assert.ok(execFn.includes('sourceBloodWormNoSuccessRng:true'));

const hasFn=extractFunction(game,'battleHasAnyStatus');
assert.ok(hasFn.includes('sourceProfessionDoomFearState(desc)'));
const processFn=extractFunction(game,'processBattleStatusTurn');
assert.ok(processFn.includes("st.type==='bloodWorms'"));
assert.ok(processFn.includes('sourceProfessionBloodWormStatusTick(desc,st)'));

const dispatcher=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(dispatcher.includes("prepared.functionName==='PROFESSION_BLOOD_WORMS'"));
assert.ok(dispatcher.includes('sourceProfessionBloodWormExecute(prepared,magicName)'));
assert.ok(dispatcher.indexOf("prepared.functionName==='PROFESSION_BLOOD_WORMS'")<dispatcher.indexOf('if(toNo<10)'));

assert.ok(workflow.includes('"tools/check_v266_profession_blood_worms_runtime.mjs"'));
assert.ok(workflow.includes('Run V2.66 Blood Worms regression'));
for(const v of ['2.65','2.66'])assert.ok(html.includes('PLAYABLE CORE V'+v));
assert.match(html,/V2\.66 live：[^<]*嗜血蠱/);
assert.ok(readme.includes('## V2.66 最新進度'));assert.ok(changelog.includes('## V2.66 Skill 10 BLOOD_WORMS'));
assert.match(game,/schemaVersion:30/);assert.match(game,/s\.schemaVersion=30/);
console.log(JSON.stringify({pass:true,version:'V2.66-core',focus:'Skill 10 BLOOD_WORMS',direct:'no-element + immediate caster heal',duration:'2/3/4/5 ticks',fixedBug:'stored M-tier reconverted => every DOT tick 40 damage + 2 HP heal',saveSchema:30}));
