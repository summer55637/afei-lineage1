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
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const levelM=level=>{level=Math.trunc(Number(level)||0);if(level>90)return 10;if(level>80)return 9;if(level>70)return 8;if(level>60)return 7;if(level>50)return 6;if(level>40)return 5;if(level>30)return 4;if(level>20)return 3;if(level>10)return 2;return 1};
const levelA=level=>{level=Math.trunc(Number(level)||0);if(level>=100)return 10;if(level>90)return 9;if(level>80)return 8;if(level>70)return 7;if(level>60)return 6;if(level>50)return 5;if(level>40)return 4;if(level>30)return 3;if(level>20)return 2;if(level>10)return 1;return 0};

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const row=runtime.bySkillId['15'];
assert.ok(row);
assert.equal(row.name,'火附体');
assert.equal(row.text,'召唤火焰附在武器或防具上增强其效能');
assert.equal(row.func,'PROFESSION_FIRE_ENCLOSE');
assert.equal(row.option,'炎|效%1|回%3|成%100');
assert.equal(row.skillId,15);
assert.equal(row.professionClass,2);
assert.equal(row.target,1);
assert.equal(row.costMp,10);
assert.equal(row.useFlag,1);
assert.equal(row.kind,1);
assert.equal(row.icon,29258);
assert.equal(row.img1,101697);
assert.equal(row.img2,101699);
assert.equal(row.cost,1000);
assert.equal(row.dispatchKnown,true);
assert.equal(row.commonCommand,'BATTLE_COM_S_FIRE_ENCLOSE');

const support=new Function(`return (${extractFunction(game,'sourceProfessionBattleFunctionSupported')})`)();
assert.equal(support('PROFESSION_FIRE_ENCLOSE',15),true);

const cost=new Function('sourceProfessionMagicLevelM',`return ${extractFunction(game,'sourceProfessionMagicCostPlan')}`)(levelM);
for(const [raw,expected] of [[10,20],[30,20],[40,30],[60,30],[70,40],[90,40],[100,50]]){
  assert.equal(cost('PROFESSION_FIRE_ENCLOSE',raw,row.option).cost,expected,'raw '+raw);
}

const dex=new Function('n',`return ${extractFunction(game,'sourceProfessionBattleDexRoll')}`)(n);
let dexArgs=null;
assert.equal(
  dex({commonCommand:'BATTLE_COM_S_FIRE_ENCLOSE'},80,{randMacro:(a,b)=>{dexArgs=[a,b];return 35}}),
  65
);
assert.deepEqual(dexArgs,[20,50]);

const spec=new Function('sourceProfessionAttackSkillTier','sourceProfessionStatusOptionInt','sourceProfessionSkillTemplate','n',`return ${extractFunction(game,'sourceProfessionFireEncloseSpec')}`)(levelA,(option,label,fallback=0)=>{
  const token=String(label)+'%'; const at=String(option).indexOf(token); if(at<0)return fallback;
  const m=String(option).slice(at+token.length).match(/^[+-]?\d+/); return m?Number(m[0]):fallback;
},()=>row,n);
for(const [raw,attackTier,success] of [[10,0,100],[20,1,104],[50,4,116],[100,10,140]]){
  const s=spec({displayLevel:raw,skillId:15});
  assert.equal(s.attackTier,attackTier,'raw '+raw);
  assert.equal(s.success,success,'success '+raw);
  assert.equal(s.storedTurns,4);
  assert.equal(s.activeDamageTicks,3);
  assert.equal(s.effect,1);
  assert.equal(s.img1,101697);assert.equal(s.img2,101699);
}

const anim=new Function('n',`return ${extractFunction(game,'sourceProfessionFireEncloseAnimation')}`)(n);
const a=anim(row,10);
assert.equal(a.img1,101697);assert.equal(a.img2,101699);assert.equal(a.effect,1);

const statusTick=new Function(
  'n','sourceProfessionMagicGetDamage','battleStatusHp',
  `return ${extractFunction(game,'sourceProfessionFireEncloseStatusTick')}`
)(
  n,
  ({power})=>Math.trunc(power),
  desc=>Math.trunc(desc.hp)
);
const desc={kind:'enemy',unit:{hp:1000},unitId:'e1'};
let st={turns:3};
let t=statusTick(desc,st);assert.deepEqual({cnt:t.cnt,sourcePower:t.sourcePower,damage:t.damage,hpBefore:t.hpBefore,hpAfter:t.hpAfter},{cnt:3,sourcePower:150,damage:150,hpBefore:1000,hpAfter:850});
desc.hp=850;st={turns:2};t=statusTick(desc,st);assert.equal(t.damage,100);assert.equal(t.hpAfter,750);
desc.hp=750;st={turns:1};t=statusTick(desc,st);assert.equal(t.damage,50);assert.equal(t.hpAfter,700);

const statuses=new Map();
const target={id:'e1',hp:500,level:100};
const profResult={ok:true,proficiency:{skillId:0,success:false,centuryBoundary:false}};
const logs=[];
const exec=new Function(
  'Math','Number','String','state','n','sourceProfessionAttackSkillTier','sourceProfessionStatusOptionInt',
  'sourceProfessionSkillTemplate','sourceSetMagicPetMultiList','sourceProfessionPlayerMagicSameSide',
  'sourceProfessionEnemyByBattleSlot','enemyUnitHidden','sourceProfessionStatusAttackCheck',
  'battleHasAnyStatus','battleStatusKey','battleStatuses','sourceProfessionSpecialSkillProficiencyByFunction',
  'sourceProfessionLogProficiencyResult','addLog','syncEnemyTarget','cRand',
  `return ${extractFunction(game,'sourceProfessionFireEncloseExecute')}`
)(
  Math,Number,String,{professionClass:2},n,levelA,
  (option,label,fallback=0)=>{const token=String(label)+'%';const at=String(option).indexOf(token);if(at<0)return fallback;const m=String(option).slice(at+token.length).match(/^[+-]?\d+/);return m?Number(m[0]):fallback},
  ()=>row,
  raw=>({ok:true,toNo:10,slots:[10]}),
  ()=>false,
  ()=>target,
  ()=>false,
  (_desc,success)=>({success:true,roll:1,threshold:success,reason:'hit'}),
  ()=>false,
  ()=>'enemy:e1',
  statuses,
  ()=>profResult,
  ()=>{},
  (...x)=>logs.push(x.join(' ')),
  ()=>{},
  ()=>42
);
const prepared={ok:true,prepared:true,skillId:15,functionName:'PROFESSION_FIRE_ENCLOSE',displayLevel:100,toNo:10};
const result=exec(prepared,'火附体');
assert.equal(result.handled,true);
assert.equal(result.spec.attackTier,10);
assert.equal(result.spec.success,140);
assert.equal(result.results[0].applied,true);
assert.equal(result.results[0].storedTurns,4);
assert.equal(result.results[0].sourceCounterFieldWritten,false);
assert.equal(statuses.get('enemy:e1').turns,4);
assert.equal(statuses.get('enemy:e1').fireEncloseModTier,10);
assert.equal(target.sourceFireEncloseModTier,10);
assert.equal(target.sourceFireEncloseAuraActive,false);

const dispatcher=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(dispatcher.includes("prepared.functionName==='PROFESSION_FIRE_ENCLOSE'"));
assert.ok(dispatcher.includes('sourceProfessionFireEncloseExecute(prepared,magicName)'));

const dexFn=extractFunction(game,'sourceProfessionBattleDexRoll');
assert.ok(dexFn.includes("command==='BATTLE_COM_S_FIRE_ENCLOSE'"));

assert.ok(workflow.includes('"tools/check_v271_profession_fire_enclose_runtime.mjs"'));
assert.ok(workflow.includes('Run V2.71 Fire Enclose regression'));
assert.ok(readme.includes('PLAYABLE CORE V2.71'));
assert.ok(readme.includes('V2.71'));
assert.ok(changelog.includes('## V2.71 Skill 15 FIRE_ENCLOSE'));
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.71-core',focus:'Skill 15 FIRE_ENCLOSE',
  mp:'M-tier 1-3=20,4-6=30,7-9=40,10=50',
  dex:'WORKQUICK+20 - RAND(work*0.2, work*0.5)',
  apply:'success = 100 + A-tier*4; stored StatusTbl = 4; proficiency raises only after success',
  dot:'three active ticks 150 -> 100 -> 50 from fixed 50*cnt',
  sourceBug:'MOD_F_ENCLOSE_2 is written, but fixed CHAR_WORK_F_ENCLOSE_2 is never written in pinned build; later physical-hit aura branch therefore stays inactive',
  saveSchema:30
}));
