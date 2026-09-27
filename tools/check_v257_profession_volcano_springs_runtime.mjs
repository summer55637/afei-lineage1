import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_profession_skill_runtime.json','utf8'));

function extractFunction(src,name){
  const sig='function '+name+'(';const i=src.indexOf(sig);assert.ok(i>=0,'missing '+name);
  const op=src.indexOf('(',i);let pd=0,q=null,e=false,l=false,b=false,cp=-1;
  for(let p=op;p<src.length;p++){const c=src[p],nx=src[p+1];
    if(l){if(c==='\n')l=false;continue}if(b){if(c==='*'&&nx==='/'){b=false;p++}continue}
    if(q){if(e)e=false;else if(c==='\\')e=true;else if(c===q)q=null;continue}
    if(c==='/'&&nx==='/'){l=true;p++;continue}if(c==='/'&&nx==='*'){b=true;p++;continue}
    if(c==="'"||c==='"'||c.charCodeAt(0)===96){q=c;continue}
    if(c==='(')pd++;else if(c===')'&&--pd===0){cp=p;break}
  }
  const bs=src.indexOf('{',cp);let d=0;q=null;e=false;l=false;b=false;
  for(let p=bs;p<src.length;p++){const c=src[p],nx=src[p+1];
    if(l){if(c==='\n')l=false;continue}if(b){if(c==='*'&&nx==='/'){b=false;p++}continue}
    if(q){if(e)e=false;else if(c==='\\')e=true;else if(c===q)q=null;continue}
    if(c==='/'&&nx==='/'){l=true;p++;continue}if(c==='/'&&nx==='*'){b=true;p++;continue}
    if(c==="'"||c==='"'||c.charCodeAt(0)===96){q=c;continue}
    if(c==='{')d++;else if(c==='}'&&--d===0)return src.slice(i,p+1);
  }
  throw new Error('unterminated '+name);
}

const row=runtime.bySkillId['1'],firePractice=runtime.bySkillId['18'];
assert.ok(row&&firePractice);
assert.equal(row.name,'火山泉');assert.equal(row.func,'PROFESSION_VOLCANO_SPRINGS');
assert.equal(row.option,'火|0|1|0|0|0|0|0|0|50|0|-50');
assert.equal(row.professionClass,2);assert.equal(row.target,1);assert.equal(row.kind,1);
assert.equal(row.costMp,10);assert.equal(row.img1,101697);assert.equal(row.img2,101686);
assert.equal(row.commonCommand,'BATTLE_COM_S_VOLCANO_SPRINGS');
assert.equal(firePractice.func,'PROFESSION_FIRE_PRACTICE');assert.equal(firePractice.fixValue,10);

const support={};
vm.createContext(support);vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),support);
assert.equal(support.sourceProfessionBattleFunctionSupported('PROFESSION_VOLCANO_SPRINGS',1),true);

const costCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionMagicLevelM:level=>{level=Math.trunc(Number(level)||0);if(level>90)return 10;if(level>80)return 9;if(level>70)return 8;if(level>60)return 7;if(level>50)return 6;if(level>40)return 5;if(level>30)return 4;if(level>20)return 3;if(level>10)return 2;return 1;}};
vm.createContext(costCtx);vm.runInContext(extractFunction(game,'sourceProfessionMagicCostPlan'),costCtx);
for(const [level,cost] of [[10,10],[30,15],[50,20],[70,30],[100,35]]){
  const x=costCtx.sourceProfessionMagicCostPlan('PROFESSION_VOLCANO_SPRINGS',level,row.option);
  assert.equal(x.dynamic,true);assert.equal(x.cost,cost);
}

const snapCtx={Math,Number,Object,PROFESSION_CLASS_NONE:0,PROFESSION_SKILL_SLOT_COUNT:26,
  battlePlayerProfessionMagicProficiencyWork:{fire:0,ice:0,thunder:0},
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionMagicLevelM:costCtx.sourceProfessionMagicLevelM,
  sourcePlayerProfessionSkillAt:(i,t)=>{const e=t.professionSkills[i];return e?{slot:i,skillId:e.skillId,rawLevel:e.rawLevel}:null;},
  sourceProfessionSkillTemplate:id=>runtime.bySkillId[String(id)]||null,
  sourcePlayerProfessionSkillDisplayLevel:e=>Math.trunc(Number(e.rawLevel||0)/100)
};
vm.createContext(snapCtx);
for(const fn of ['sourceProfessionMagicPracticeWork','sourceProfessionPlayerMagicProficiencyRefresh','sourceProfessionPlayerMagicProficiencyVector'])vm.runInContext(extractFunction(game,fn),snapCtx);
assert.deepEqual(JSON.parse(JSON.stringify(snapCtx.sourceProfessionMagicPracticeWork(10))),{tier:1,value:2});
assert.deepEqual(JSON.parse(JSON.stringify(snapCtx.sourceProfessionMagicPracticeWork(60))),{tier:6,value:13});
assert.deepEqual(JSON.parse(JSON.stringify(snapCtx.sourceProfessionMagicPracticeWork(100))),{tier:10,value:25});
const p={professionClass:2,professionSkills:Array(26).fill(null)};
p.professionSkills[4]={skillId:18,rawLevel:6000};
let snap=snapCtx.sourceProfessionPlayerMagicProficiencyRefresh(p,'fixture');
assert.equal(snap.work.fire,13);assert.equal(snapCtx.sourceProfessionPlayerMagicProficiencyVector().fire,13);

const dexCalls=[];
const dexCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceCRandMacroValue:()=>0,battleDexRoll:q=>999};
vm.createContext(dexCtx);vm.runInContext(extractFunction(game,'sourceProfessionBattleDexRoll'),dexCtx);
let dex=dexCtx.sourceProfessionBattleDexRoll(
  {commonCommand:'BATTLE_COM_S_VOLCANO_SPRINGS'},80,
  {randMacro:(a,b)=>{dexCalls.push([a,b]);return 20;}}
);
assert.equal(dex,80);assert.deepEqual(dexCalls,[[0,20]]);
assert.equal(dexCtx.sourceProfessionBattleDexRoll({commonCommand:'BATTLE_COM_S_BOUNDARY'},80),999);

let dodgeRoll=10;
const dodgeCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,
  enemyUnitHidden:()=>false,sourceProfessionPlayerMagicProficiencyVector:()=>({fire:25,ice:0,thunder:0}),cRand:()=>dodgeRoll};
vm.createContext(dodgeCtx);vm.runInContext(extractFunction(game,'sourceProfessionMagicEnemyDodge'),dodgeCtx);
let dodge=dodgeCtx.sourceProfessionMagicEnemyDodge({id:'e',hp:100,level:100},{magicType:1,command:'BATTLE_COM_S_VOLCANO_SPRINGS',randInclusive:()=>10});
assert.equal(dodge.threshold,10);assert.equal(dodge.miss,true);
dodge=dodgeCtx.sourceProfessionMagicEnemyDodge({id:'e',hp:100,level:100},{magicType:1,command:'BATTLE_COM_S_VOLCANO_SPRINGS',randInclusive:()=>11});
assert.equal(dodge.miss,false);

const animCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,sourceProfessionMagicLevelM:costCtx.sourceProfessionMagicLevelM};
vm.createContext(animCtx);vm.runInContext(extractFunction(game,'sourceProfessionVolcanoAnimation'),animCtx);
let anim=animCtx.sourceProfessionVolcanoAnimation(row,40,10);
assert.equal(anim.img2,101688);assert.equal(anim.x,0);assert.equal(anim.y,-50);
anim=animCtx.sourceProfessionVolcanoAnimation(row,50,10);assert.equal(anim.img2,101687);
anim=animCtx.sourceProfessionVolcanoAnimation(row,100,10);assert.equal(anim.img2,101686);
anim=animCtx.sourceProfessionVolcanoAnimation(row,100,0);assert.equal(anim.x,0);assert.equal(anim.y,50);

const activeFn=extractFunction(game,'sourceProfessionVolcanoSpringsExecute');
assert.ok(activeFn.indexOf('sourceSetMagicPetMultiList(rawToNo)')<activeFn.indexOf("sourceProfessionSpecialSkillProficiencyByFunction("));
assert.ok(activeFn.indexOf("sourceProfessionSpecialSkillProficiencyByFunction(")<activeFn.indexOf('sourceProfessionMagicPracticePower('));
assert.ok(activeFn.indexOf('sourceProfessionMagicEnemyDodge')<activeFn.indexOf('sourceProfessionMagicGetDamage'));
assert.ok(activeFn.indexOf('sourceProfessionMagicGetDamage')<activeFn.indexOf('const unusedChangeStatusRoll=cRand(1,100)'));
assert.ok(activeFn.includes('sourceCurrentCastUsesBattleEntryPracticeSnapshot:true'));
assert.ok(!activeFn.includes('sourceProfessionPlayerMagicProficiencyRefresh('));

const enemy={id:'e1',name:'石頭人',hp:500,level:1,battleSlot:0};
let marked=0,woke=0,logs=[];
const execCtx={Math,Number,String,Object,
  state:{hp:100},n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionPlayerMagicSameSide:()=>false,
  sourceSetMagicPetMultiList:raw=>({ok:true,toNo:raw,slots:[10],fallback:false,rolls:[]}),
  sourceProfessionPlayerMagicProficiencyVector:()=>({fire:25,ice:0,thunder:0}),
  sourceProfessionSpecialSkillProficiencyByFunction:()=>({ok:true,skillId:18,rawAfter:6001,success:true,centuryBoundary:false}),
  sourceProfessionLogProficiencyResult:r=>r,
  sourceProfessionSkillTemplate:id=>runtime.bySkillId[String(id)]||null,
  sourceProfessionVolcanoAnimation:()=>({tier:10,img1:101697,img2:101686,x:0,y:-50}),
  sourceProfessionMagicPracticePower:()=>({power:200,skillLevel:10,criticalRoll:26,m2Roll:99,varianceRoll:100}),
  sourceProfessionEnemyByBattleSlot:()=>enemy,
  sourceProfessionMagicEnemyDodge:()=>({miss:false,roll:99,threshold:-4}),
  sourceProfessionMagicPreDamagePower:(p,u)=>p,
  sourceProfessionMagicGetDamage:o=>Math.trunc(o.power*(1+o.proficiency.fire/100)),
  cRand:()=>77,
  sourceMarkEnemyDeathCredit:()=>{marked++;},
  sourceProfessionMagicWakeTarget:()=>{woke++;return true;},
  syncEnemyTarget:()=>{},addLog:m=>logs.push(m)
};
vm.createContext(execCtx);vm.runInContext(activeFn,execCtx);
const out=execCtx.sourceProfessionVolcanoSpringsExecute({skillId:1,functionName:'PROFESSION_VOLCANO_SPRINGS',toNo:10,displayLevel:100},'火山泉');
assert.equal(out.workSnapshot.fire,25);assert.equal(out.hits[0].damage,250);
assert.equal(out.hits[0].hpBefore,500);assert.equal(out.hits[0].hpAfter,250);
assert.equal(out.hits[0].unusedChangeStatusRoll,77);assert.equal(marked,0);assert.equal(woke,1);

const entry=extractFunction(game,'sourceInitPlayerSideEntrySnapshot');
assert.ok(entry.indexOf("sourceProfessionPlayerMagicProficiencyRefresh(state,'battle-entry')")<entry.indexOf("sourceProfessionPlayerAvoidRefresh(state,'battle-entry')"));
const move=extractFunction(game,'sourcePlayerMoveItem');
assert.ok(move.includes("moved.magicProficiencyRefresh=sourceProfessionPlayerMagicProficiencyRefresh(target,'weapon-change')"));
const reset=extractFunction(game,'resetBattleStatuses');
assert.ok(reset.includes('battlePlayerProfessionMagicProficiencyWork={fire:0,ice:0,thunder:0}'));

const order=extractFunction(game,'normalBattleOrder');
assert.ok(order.includes("sourceProfessionBattleDexRoll(playerProfessionDexPrepared,player.quick)"));
const turn=extractFunction(game,'attackTurn');
assert.ok(turn.includes("professionPrepared?'profession':'attack',professionPrepared"));

const dispatcher=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(dispatcher.includes("prepared.functionName==='PROFESSION_VOLCANO_SPRINGS'"));
assert.ok(dispatcher.includes('sourceProfessionVolcanoSpringsExecute'));

for(const v of ['2.56','2.57'])assert.ok(html.includes('PLAYABLE CORE V'+v));
assert.match(html,/V2\.57 live：[^<]*火山泉/);
assert.match(game,/schemaVersion:30/);assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.57-core',focus:'Skill 1 Volcano Springs',
  mp:'M-tier 10/15/20/30/35',
  dex:'WORKQUICK+20 - RAND(0, work*0.2)',
  practice:'Skill18 raw proficiency upgrades during analysis; current cast uses battle-entry Fire Work snapshot',
  rng:'MultiList -> passive proficiency -> practice critical/M2/variance -> magic dodge -> unused change-status RAND on hit',
  saveSchema:30
}));
