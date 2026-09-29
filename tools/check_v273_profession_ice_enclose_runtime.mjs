import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_profession_skill_runtime.json','utf8'));
const html=fs.readFileSync('game.html','utf8');
const workflow=fs.readFileSync('.github/workflows/generate-item-make-runtime.yml','utf8');
const readme=fs.readFileSync('README.md','utf8');
const changelog=fs.readFileSync('docs/changelog/part-07-v1.75-onward.md','utf8');

function extractFunction(src,name){
  const sig='function '+name+'(';
  const i=src.indexOf(sig);
  assert.ok(i>=0,'missing '+name);
  const b=src.indexOf('{',src.indexOf(')',i));
  let d=0,q=null,esc=false,line=false,block=false;
  for(let p=b;p<src.length;p++){
    const c=src[p],nx=src[p+1];
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&nx==='/'){block=false;p++;}continue}
    if(q){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===q)q=null;continue}
    if(c==='/'&&nx==='/'){line=true;p++;continue}
    if(c==='/'&&nx==='*'){block=true;p++;continue}
    if(c==='"'||c==="'"||c==='\`'){q=c;continue}
    if(c==='{')d++;else if(c==='}'&&--d===0)return src.slice(i,p+1);
  }
  throw new Error('unterminated '+name);
}

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const row=runtime.bySkillId['17'];
assert.ok(row);
assert.equal(row.name,'冰附体');
assert.equal(row.text,'召唤冰雾附在武器或防具上增强其效能');
assert.equal(row.func,'PROFESSION_ICE_ENCLOSE');
assert.equal(row.option,'冻|效%1|回%3|成%100');
assert.equal(row.skillId,17);
assert.equal(row.professionClass,2);
assert.equal(row.target,1);
assert.equal(row.costMp,10);
assert.equal(row.useFlag,1);
assert.equal(row.kind,1);
assert.equal(row.icon,29260);
assert.equal(row.img1,101697);
assert.equal(row.img2,101700);
assert.equal(row.cost,1000);
assert.equal(row.commonCommand,'BATTLE_COM_S_ICE_ENCLOSE');

const levelM=level=>{
  level=Math.trunc(Number(level)||0);
  if(level>90)return 10;
  if(level>80)return 9;
  if(level>70)return 8;
  if(level>60)return 7;
  if(level>50)return 6;
  if(level>40)return 5;
  if(level>30)return 4;
  if(level>20)return 3;
  if(level>10)return 2;
  return 1;
};

const costCtx={
  Math,Number,String,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionMagicLevelM:levelM
};
vm.createContext(costCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicCostPlan'),costCtx);
for(const [raw,cost] of [[10,20],[30,20],[40,30],[60,30],[70,40],[90,40],[100,50]]){
  const plan=costCtx.sourceProfessionMagicCostPlan('PROFESSION_ICE_ENCLOSE',raw,row.option);
  assert.equal(plan.dynamic,true);
  assert.equal(plan.cost,cost);
}

const dexCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(dexCtx);
vm.runInContext(extractFunction(game,'sourceProfessionIceEncloseDexRoll'),dexCtx);
let dexArgs=null;
const dex=dexCtx.sourceProfessionIceEncloseDexRoll(80,{
  randMacro:(a,b)=>{dexArgs=[a,b];return 35;}
});
assert.equal(dex,65);
assert.deepEqual(dexArgs,[20,50]);

const tier=level=>{
  level=Math.trunc(Number(level)||0);
  if(level>=100)return 10;
  if(level>90)return 9;
  if(level>80)return 8;
  if(level>70)return 7;
  if(level>60)return 6;
  if(level>50)return 5;
  if(level>40)return 4;
  if(level>30)return 3;
  if(level>20)return 2;
  if(level>10)return 1;
  return 0;
};
const opt=(text,label,fallback=0)=>{
  const m=String(text).match(new RegExp(String(label)+'%([+-]?\\d+)'));
  return m?Number(m[1]):fallback;
};
const specCtx={
  Math,Number,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionSkillTemplate:id=>Math.trunc(Number(id))===17?row:null,
  sourceProfessionAttackSkillTier:tier,
  sourceProfessionStatusOptionInt:opt
};
vm.createContext(specCtx);
vm.runInContext(extractFunction(game,'sourceProfessionEncloseAuraSpec'),specCtx);
for(const [raw,expectedTier,expectedHitTurn,expectedHitStored,expectedChance] of [
  [10,0,1,2,20],
  [50,4,1,2,28],
  [60,5,2,3,30],
  [100,10,3,4,40]
]){
  const x=specCtx.sourceProfessionEncloseAuraSpec({skillId:17,displayLevel:raw},'ice');
  assert.equal(x.attackTier,expectedTier);
  assert.equal(x.baseSuccess,100);
  assert.equal(x.success,100+expectedTier*4);
  assert.equal(x.rawTurn,3);
  assert.equal(x.storedTurns,4);
  assert.equal(x.statusAuraToken,'凍');
  assert.equal(x.statusHitToken,'霜');
  assert.equal(x.img1,101697);
  assert.equal(x.img2,101700);
  assert.equal(x.onHitTurn,expectedHitTurn);
  assert.equal(x.onHitStoredTurns,expectedHitStored);
  assert.equal(x.onHitChance,expectedChance);
}

const statusMap=new Map();
const procCtx={
  Math,Number,Map,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  state:{
    sourceIceEncloseOnHitTurns:4,
    sourceIceEncloseModTier:10,
    sourceIceEncloseAuraActive:true
  },
  sourceProfessionStatusAttackCheck:()=>({success:true,roll:1,threshold:40,reason:'hit'}),
  battleStatusKey:desc=>'enemy:'+desc.unitId,
  battleHasAnyStatus:()=>false,
  battleStatuses:statusMap,
  addLog:()=>{}
};
vm.createContext(procCtx);
vm.runInContext(extractFunction(game,'sourceProfessionIceEncloseAuraProc'),procCtx);
const target={id:'e1',name:'Test',hp:100};
const proc=procCtx.sourceProfessionIceEncloseAuraProc('player',target,{damage:10});
assert.equal(proc.element,'ice');
assert.equal(proc.triggered,true);
assert.equal(proc.effectiveTurn,3);
assert.equal(proc.storedTurns,4);
assert.equal(proc.img1,101697);
assert.equal(proc.img2,101699);
assert.equal(statusMap.get('enemy:e1').type,'iceEnclose');
assert.equal(statusMap.get('enemy:e1').turns,4);
assert.equal(statusMap.get('enemy:e1').sourceStatusToken,'霜');

const failCtx={
  ...procCtx,
  state:{sourceIceEncloseOnHitTurns:4,sourceIceEncloseModTier:0,sourceIceEncloseAuraActive:true},
  sourceProfessionStatusAttackCheck:()=>({success:false,roll:99,threshold:20,reason:'roll'})
};
vm.createContext(failCtx);
vm.runInContext(extractFunction(game,'sourceProfessionIceEncloseAuraProc'),failCtx);
const fail=failCtx.sourceProfessionIceEncloseAuraProc('player',target,{damage:10});
assert.equal(fail.triggered,false);
assert.equal(fail.element,'ice');

const tickCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(tickCtx);
vm.runInContext(extractFunction(game,'sourceProfessionIceEncloseStatusTick'),tickCtx);
const unit={quick:100,roundQuick:100,roundFixQuick:100};
const tick=tickCtx.sourceProfessionIceEncloseStatusTick(
  {kind:'enemy',unit},
  {turns:4}
);
assert.equal(tick.ok,true);
assert.equal(tick.fixedDexBefore,100);
assert.equal(tick.fixedDexAfter,90);
assert.equal(unit.roundFixQuick,90);
assert.equal(tick.roundQuick,100);
assert.equal(tick.sourceFixedDexOnly,true);
assert.equal(tick.sourceNextPreCommandRebuildsFixDex,true);
assert.equal(tick.sourceCanMoveUnaffected,true);
assert.equal(tick.turnsRemaining,3);

const dexDispatcher=extractFunction(game,'sourceProfessionBattleDexRollV273');
assert.ok(dexDispatcher.includes("BATTLE_COM_S_ICE_ENCLOSE"));
const supportV273=extractFunction(game,'sourceProfessionBattleFunctionSupportedV273');
assert.ok(supportV273.includes("PROFESSION_ICE_ENCLOSE"));
assert.ok(supportV273.includes('===17'));

const skillExec=extractFunction(game,'sourceProfessionBattleSkillExecuteV273');
assert.ok(skillExec.includes("prepared?.functionName==='PROFESSION_ICE_ENCLOSE'"));
assert.ok(skillExec.includes("skillId))===17"));
assert.ok(skillExec.includes(",'ice'"));

const encloseExec=extractFunction(game,'sourceProfessionEncloseAuraExecute');
assert.ok(encloseExec.includes("element==='ice'?17:15"));
assert.ok(encloseExec.includes("PROFESSION_ICE_ENCLOSE"));
assert.ok(encloseExec.includes('sourceIceEncloseOnHitTurns'));
assert.ok(encloseExec.includes('sourceIceEncloseModTier'));
assert.ok(encloseExec.includes('sourceIceEncloseAuraActive'));
assert.ok(encloseExec.includes("'PROFESSION_ICE_PRACTICE'"));
assert.ok(encloseExec.includes('sourceBattleStatusDescFromSlot(slot)'));
assert.equal(encloseExec.includes("reason:'same-side-target'"),false);
assert.equal(encloseExec.includes('sourceProfessionMagicEnemyDodge'),false);

assert.ok(game.includes("function sourceProfessionIceEncloseDexRoll"));
assert.ok(game.includes("function sourceProfessionIceEncloseAuraProc"));
assert.ok(game.includes("function sourceProfessionIceEncloseStatusTick"));
assert.ok(game.includes('V273_ICE_ENCLOSE_RUNTIME_PATCH'));
assert.ok(game.includes('sourceProfessionBattleFunctionSupportedV273'));
assert.ok(game.includes('sourceProfessionBattleDexRollV273'));
assert.ok(game.includes('sourceProfessionBattleSkillExecuteV273'));
assert.ok(game.includes("sourceIceEncloseOnHitTurns"));
assert.ok(game.includes("sourceIceEncloseModTier"));
assert.ok(game.includes("sourceIceEncloseAuraActive"));
assert.ok(game.includes('PROFESSION_ICE_PRACTICE'));

assert.ok(workflow.includes('"tools/check_v273_profession_ice_enclose_runtime.mjs"'));
assert.ok(workflow.includes('Run V2.73 Ice Enclose regression'));
assert.ok(html.includes('PLAYABLE CORE V2.73'));
assert.ok(html.includes('PLAYABLE CORE V2.72'));
assert.match(readme,/## V2\.73[\s\S]*冰附體/);
assert.ok(readme.includes('PLAYABLE CORE V2.72'));
assert.ok(changelog.includes('## V2.73 Skill 17 ICE_ENCLOSE'));
assert.ok(changelog.includes('PROFESSION_ICE_ENCLOSE'));
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,
  version:'V2.73',
  skill:17,
  name:'冰附體',
  mp:'20/30/40/50',
  dex:'WORKQUICK+20-RAND(20%,50%)',
  aura:'凍 -> CHAR_WORK_I_ENCLOSE_2',
  onHit:'20+A-tier*2 -> 霜 -> CHAR_WORK_I_ENCLOSE',
  turns:'tier<5=1, 5-9=2, 10=3; stored=turn+1',
  tick:'FIXDEX=90% base DEX; movement unaffected'
}));
