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
  const i=src.indexOf(sig); assert.ok(i>=0,'missing '+name);
  const b=src.indexOf('{',src.indexOf(')',i));
  let d=0,q=null,esc=false,line=false,block=false;
  for(let p=b;p<src.length;p++){
    const c=src[p],nx=src[p+1];
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&nx==='/'){block=false;p++}continue}
    if(q){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===q)q=null;continue}
    if(c==='/'&&nx==='/'){line=true;p++;continue}
    if(c==='/'&&nx==='*'){block=true;p++;continue}
    if(c==='"'||c==="'"||c==='`'){q=c;continue}
    if(c==='{')d++; else if(c==='}'&&--d===0)return src.slice(i,p+1);
  }
  throw new Error('unterminated '+name);
}
assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const row=runtime.bySkillId['16'];
assert.ok(row);
assert.equal(row.name,'雷附体');
assert.equal(row.text,'召唤雷电附在武器或防具上增强其效能');
assert.equal(row.func,'PROFESSION_THUNDER_ENCLOSE');
assert.equal(row.option,'击|效%1|回%1|成%100');
assert.equal(row.skillId,16);
assert.equal(row.professionClass,2);
assert.equal(row.target,1);
assert.equal(row.costMp,10);
assert.equal(row.icon,29259);
assert.equal(row.img1,101697);
assert.equal(row.img2,101701);
assert.equal(row.commonCommand,'BATTLE_COM_S_THUNDER_ENCLOSE');

const dexCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(dexCtx);
vm.runInContext(extractFunction(game,'sourceProfessionThunderEncloseDexRoll'),dexCtx);
let dexArgs=null;
const dex=dexCtx.sourceProfessionThunderEncloseDexRoll(80,{randMacro:(a,b)=>{dexArgs=[a,b];return 35;}});
assert.equal(dex,65);
assert.deepEqual(dexArgs,[20,50]);

const opt=(text,label,fallback=0)=>{
  const at=String(text).indexOf(String(label)+'%');
  if(at<0)return fallback;
  const m=String(text).slice(at+String(label).length+1).match(/^[+-]?\d+/);
  return m?Number(m[0]):fallback;
};
const tier=level=>{
  level=Math.trunc(Number(level)||0);
  if(level>=100)return 10;if(level>90)return 9;if(level>80)return 8;if(level>70)return 7;
  if(level>60)return 6;if(level>50)return 5;if(level>40)return 4;if(level>30)return 3;
  if(level>20)return 2;if(level>10)return 1;return 0;
};
const specCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionSkillTemplate:()=>row,sourceProfessionAttackSkillTier:tier,sourceProfessionStatusOptionInt:opt};
vm.createContext(specCtx);
vm.runInContext(extractFunction(game,'sourceProfessionEncloseAuraSpec'),specCtx);
for(const [raw,expectedTier] of [[10,0],[20,1],[50,4],[100,10]]){
  const x=specCtx.sourceProfessionEncloseAuraSpec({skillId:16,displayLevel:raw},'thunder');
  assert.equal(x.attackTier,expectedTier);
  assert.equal(x.rawTurn,1);
  assert.equal(x.storedTurns,2);
  assert.equal(x.onHitTurn,1);
  assert.equal(x.onHitStoredTurns,2);
  assert.equal(x.onHitChance,20+expectedTier*2);
}

const procCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,
  state:{sourceThunderEncloseOnHitTurns:2,sourceThunderEncloseModTier:10,sourceThunderEncloseAuraActive:true,
         sourceFireEncloseOnHitTurns:0,sourceFireEncloseModTier:0,sourceFireEncloseAuraActive:false},
  battleStatusKey:desc=>'enemy:'+desc.unitId,
  sourceProfessionStatusAttackCheck:()=>({success:true,roll:1,threshold:40,reason:'hit'}),
  battleHasAnyStatus:()=>false,battleStatuses:new Map(),addLog:()=>{}};
vm.createContext(procCtx);
vm.runInContext(extractFunction(game,'sourceProfessionApplyEncloseAuraProc'),procCtx);
const target={id:'e1',name:'Test',hp:100};
const thunder=procCtx.sourceProfessionApplyEncloseAuraProc('player',target,{damage:10});
assert.equal(thunder.element,'thunder');
assert.equal(thunder.triggered,true);
assert.equal(thunder.effectiveTurn,1);
assert.equal(thunder.storedTurns,2);
assert.equal(thunder.img1,101697);
assert.equal(thunder.img2,101700);
assert.equal(procCtx.battleStatuses.get('enemy:e1').type,'thunderShock');
assert.equal(procCtx.battleStatuses.get('enemy:e1').turns,2);

procCtx.state={sourceThunderEncloseOnHitTurns:0,sourceThunderEncloseModTier:0,sourceThunderEncloseAuraActive:false,
  sourceFireEncloseOnHitTurns:4,sourceFireEncloseModTier:10,sourceFireEncloseAuraActive:true};
procCtx.battleStatuses.clear();
const fire=procCtx.sourceProfessionApplyEncloseAuraProc('player',target,{damage:10});
assert.equal(fire.element,'fire');
assert.equal(fire.triggered,true);
assert.equal(fire.effectiveTurn,3);
assert.equal(fire.storedTurns,4);
assert.equal(fire.img2,101698);
assert.equal(procCtx.battleStatuses.get('enemy:e1').type,'fireEnclose');

assert.ok(game.includes("function sourceProfessionBattleFunctionSupportedV272"));
assert.ok(game.includes("functionName==='PROFESSION_THUNDER_ENCLOSE'"));
assert.ok(game.includes("String(prepared?.commonCommand||'')==='BATTLE_COM_S_THUNDER_ENCLOSE'"));
assert.ok(game.includes("st?.type==='encloseAura'"));
assert.ok(game.includes("st?.type==='thunderShock'"));
assert.ok(game.includes('sourceBattleStatusDescFromSlot(slot)'));
const encloseExec=extractFunction(game,'sourceProfessionEncloseAuraExecute');
assert.equal(encloseExec.includes("reason:'same-side-target'"),false);
assert.ok(game.includes('img2:101700'));
assert.ok(workflow.includes('tools/check_v272_profession_thunder_enclose_runtime.mjs'));
assert.match(html,/PLAYABLE CORE V2\.72/);
assert.match(html,/Skill 16 雷附體/);
assert.ok(readme.includes('PLAYABLE CORE V2.72'));
assert.ok(changelog.includes('PROFESSION_THUNDER_ENCLOSE'));
assert.ok(changelog.includes('20 + A-tier ×2'));

console.log(JSON.stringify({pass:true,version:'V2.72',skill:16,name:'雷附體',cost:'20/30/40/50',dex:'WORKQUICK+20-RAND(20%,50%)',onHit:'20+A-tier*2, forced 1 turn',storedCounter:2}));