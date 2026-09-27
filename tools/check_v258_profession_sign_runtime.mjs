import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_profession_skill_runtime.json','utf8'));

function extractFunction(src,name){
  const sig='function '+name+'(';const i=src.indexOf(sig);assert.ok(i>=0,'missing '+name);
  const op=src.indexOf('(',i);let pd=0,q=null,esc=false,line=false,block=false,cp=-1;
  for(let p=op;p<src.length;p++){
    const c=src[p],nx=src[p+1];
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&nx==='/'){block=false;p++}continue}
    if(q){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===q)q=null;continue}
    if(c==='/'&&nx==='/'){line=true;p++;continue}
    if(c==='/'&&nx==='*'){block=true;p++;continue}
    if(c==="'"||c==='"'||c.charCodeAt(0)===96){q=c;continue}
    if(c==='(')pd++;else if(c===')'&&--pd===0){cp=p;break}
  }
  const bs=src.indexOf('{',cp);let d=0;q=null;esc=false;line=false;block=false;
  for(let p=bs;p<src.length;p++){
    const c=src[p],nx=src[p+1];
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

const row=runtime.bySkillId['2'];
assert.ok(row);
assert.equal(row.name,'针针相对');
assert.equal(row.func,'PROFESSION_SIGN');
assert.equal(row.option,'无|0|1|0|0|0|0|0');
assert.equal(row.professionClass,2);
assert.equal(row.target,3);
assert.equal(row.kind,3);
assert.equal(row.costMp,10);
assert.equal(row.img1,101697);
assert.equal(row.img2,101633);
assert.equal(row.commonCommand,'BATTLE_COM_S_SIGN');

const support={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(support);
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),support);
assert.equal(support.sourceProfessionBattleFunctionSupported('PROFESSION_SIGN',2),true);

const costCtx={
  Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionMagicLevelM:level=>{
    level=Math.trunc(Number(level)||0);
    if(level>90)return 10;if(level>80)return 9;if(level>70)return 8;if(level>60)return 7;if(level>50)return 6;
    if(level>40)return 5;if(level>30)return 4;if(level>20)return 3;if(level>10)return 2;return 1;
  }
};
vm.createContext(costCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicCostPlan'),costCtx);
assert.equal(costCtx.sourceProfessionMagicCostPlan('PROFESSION_SIGN',70,row.option).cost,5);
assert.equal(costCtx.sourceProfessionMagicCostPlan('PROFESSION_SIGN',80,row.option).cost,10);
assert.equal(costCtx.sourceProfessionMagicCostPlan('PROFESSION_SIGN',100,row.option).cost,10);

const sortCtx={
  Math,Number,Map,n:v=>Number.isFinite(Number(v))?Number(v):0,
  SOURCE_PROFESSION_MAGIC_ENEMY_SORT_ORDER:Object.freeze([13,11,10,12,14,18,16,15,17,19])
};
vm.createContext(sortCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicEnemySortedSlots'),sortCtx);
assert.deepEqual(Array.from(sortCtx.sourceProfessionMagicEnemySortedSlots([10,11,12,13,14,15,16,17,18,19])),
  [13,11,10,12,14,18,16,15,17,19]);
assert.deepEqual(Array.from(sortCtx.sourceProfessionMagicEnemySortedSlots([10,11,12])),[11,10,12]);

let queue=[],calls=[];
const selfCtx={
  Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,
  cRand:(a,b)=>{
    calls.push([a,b]);assert.ok(queue.length);
    const v=queue.shift();assert.ok(v>=a&&v<=b);return v;
  }
};
vm.createContext(selfCtx);
vm.runInContext(extractFunction(game,'sourceProfessionSignSelfChange'),selfCtx);

queue=[77,9];calls=[];
let sc=selfCtx.sourceProfessionSignSelfChange(10,201,30);
assert.equal(sc.success,true);
assert.equal(sc.addHp,201);
assert.equal(sc.addMp,30);
assert.deepEqual(calls,[[1,100],[0,100]]);

queue=[88,0];calls=[];
sc=selfCtx.sourceProfessionSignSelfChange(8,201,20);
assert.equal(sc.addHp,100);
assert.equal(sc.addMp,0);

queue=[66,9];calls=[];
sc=selfCtx.sourceProfessionSignSelfChange(7,201,20);
assert.equal(sc.success,true);
assert.equal(sc.addHp,0);
assert.equal(sc.addMp,0);

queue=[55,10];calls=[];
sc=selfCtx.sourceProfessionSignSelfChange(10,201,30);
assert.equal(sc.success,false);
assert.equal(sc.addHp,0);
assert.equal(sc.addMp,0);

const dodgeQueue=[],dodgeCalls=[];
const dodgeCtx={
  Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,
  enemyUnitHidden:()=>false,
  sourceProfessionPlayerMagicProficiencyVector:()=>({fire:25,ice:25,thunder:25}),
  cRand:(a,b)=>{dodgeCalls.push([a,b]);return dodgeQueue.shift();}
};
vm.createContext(dodgeCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicEnemyDodge'),dodgeCtx);

dodgeQueue.push(1,49);dodgeCalls.length=0;
let dodge=dodgeCtx.sourceProfessionMagicEnemyDodge({hp:100,level:1},{magicType:-1,command:'BATTLE_COM_S_SIGN'});
assert.equal(dodge.miss,false);
assert.equal(dodge.secondRoll,49);
assert.deepEqual(dodgeCalls,[[1,100],[1,100]]);

dodgeQueue.push(1,50);dodgeCalls.length=0;
dodge=dodgeCtx.sourceProfessionMagicEnemyDodge({hp:100,level:1},{magicType:-1,command:'BATTLE_COM_S_SIGN'});
assert.equal(dodge.miss,true);
assert.equal(dodge.secondRoll,50);

const dexCtx={
  Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,
  battleDexRoll:()=>999,sourceCRandMacroValue:()=>0
};
vm.createContext(dexCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleDexRoll'),dexCtx);
const dexCalls=[];
const dex=dexCtx.sourceProfessionBattleDexRoll(
  {commonCommand:'BATTLE_COM_S_SIGN'},80,
  {randMacro:(a,b)=>{dexCalls.push([a,b]);return 30;}}
);
assert.equal(dex,70);
assert.deepEqual(dexCalls,[[0,30]]);

const units=[
  {id:'u10',name:'10',battleSlot:0,hp:500,mp:0,maxMp:0,level:1},
  {id:'u11',name:'11',battleSlot:1,hp:500,mp:0,maxMp:0,level:1},
  {id:'u13',name:'13',battleSlot:3,hp:500,mp:0,maxMp:0,level:1}
];
let rng=[1,0,1,0,1,0],logs=[],wakes=[];
const execCtx={
  Math,Number,String,Object,Array,Map,
  state:{hp:20,maxHp:100,mp:5,maxMp:100},
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  SOURCE_PROFESSION_MAGIC_ENEMY_SORT_ORDER:Object.freeze([13,11,10,12,14,18,16,15,17,19]),
  sourceProfessionPlayerMagicSameSide:()=>false,
  sourceSetMagicPetMultiList:()=>({ok:true,toNo:21,slots:[10,11,13],fallback:false,rolls:[]}),
  sourceProfessionSkillTemplate:id=>runtime.bySkillId[String(id)]||null,
  sourceProfessionMagicPracticePower:()=>({power:200,mpPower:30,skillLevel:10,criticalRoll:1,m2Roll:99,varianceRoll:100}),
  sourceProfessionEnemyByBattleSlot:s=>units.find(u=>10+u.battleSlot===s)||null,
  sourceProfessionMagicEnemyDodge:()=>({miss:false,roll:99,threshold:0,secondRoll:1}),
  sourceProfessionPlayerMagicProficiencyVector:()=>({fire:0,ice:0,thunder:0}),
  sourceProfessionMagicPreDamagePower:p=>p,
  sourceProfessionMagicGetDamage:o=>o.power,
  cRand:(a,b)=>{const v=rng.shift();assert.ok(v>=a&&v<=b);return v;},
  sourceMarkEnemyDeathCredit:()=>{},
  sourceProfessionMagicWakeTarget:t=>{wakes.push(t.id);return true;},
  syncEnemyTarget:()=>{},
  addLog:m=>logs.push(m)
};
vm.createContext(execCtx);
for(const fn of [
  'sourceProfessionMagicEnemySortedSlots',
  'sourceProfessionSignSelfChange',
  'sourceProfessionSignApplySelfRestore',
  'sourceProfessionSignExecute'
])vm.runInContext(extractFunction(game,fn),execCtx);

const out=execCtx.sourceProfessionSignExecute(
  {skillId:2,functionName:'PROFESSION_SIGN',toNo:21,displayLevel:100},
  '針針相對'
);
assert.deepEqual(Array.from(out.targetSlots),[13,11,10]);
assert.deepEqual(out.hits.map(x=>x.targetUnitId),['u13','u11','u10']);
assert.deepEqual(units.map(x=>x.hp),[300,300,300]);
assert.equal(out.addHp,600);
assert.equal(out.addMp,90);
assert.equal(out.selfRestore.hpBefore,20);
assert.equal(out.selfRestore.hpAfter,100);
assert.equal(out.selfRestore.mpBefore,5);
assert.equal(out.selfRestore.mpAfter,95);
assert.deepEqual(out.mpDrains.map(x=>x.drain),[0,0,0]);
assert.deepEqual(wakes,['u13','u11','u10']);

const active=extractFunction(game,'sourceProfessionSignExecute');
assert.ok(active.indexOf('sourceProfessionMagicEnemySortedSlots')<active.indexOf('sourceProfessionMagicPracticePower'));
assert.ok(active.indexOf('sourceProfessionMagicEnemyDodge')<active.indexOf('sourceProfessionSignSelfChange'));
assert.ok(active.indexOf('sourceProfessionSignSelfChange')<active.indexOf('target.hp=Math.max(0,before-damage)'));
assert.ok(active.indexOf('const mpDrains=[]')<active.indexOf('sourceProfessionSignApplySelfRestore'));
assert.ok(active.indexOf('sourceProfessionSignApplySelfRestore')<active.indexOf('sourceProfessionMagicWakeTarget'));
assert.ok(active.includes('sourceTargetSignStatusCompiledOut:true'));

const dispatcher=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(dispatcher.includes("prepared.functionName==='PROFESSION_SIGN'"));
assert.ok(dispatcher.indexOf("prepared.functionName==='PROFESSION_SIGN'")<dispatcher.indexOf('if(toNo<10)'));

for(const v of ['2.57','2.58'])assert.ok(html.includes('PLAYABLE CORE V'+v));
assert.match(html,/V2\.58 live：[^<]*針針相對/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.58-core',focus:'Skill 2 SIGN',
  target:'ALL_OTHERSIDE -> 21; SortLoc 13,11,10,12,14,18,16,15,17,19',
  mp:'tier <8 => 5; >=8 => 10',
  dodge:'base Enemy LV*0.15 cap20, then SIGN RAND(1,100)<50',
  conversion:'hit-only RAND(1,100) then RAND(0,100)<10; tier9+ full HP+MP, tier8 half HP',
  enemyMp:'fixed Enemy starts MP/MAXMP 0',
  saveSchema:30
}));
