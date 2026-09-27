import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_profession_skill_runtime.json','utf8'));

function extractFunction(source,name){
  const marker='function '+name+'(';
  const start=source.indexOf(marker);
  assert.ok(start>=0,'missing '+name);
  const ps=source.indexOf('(',start);
  let pd=0,pe=-1,q=null,esc=false,lc=false,bc=false;
  for(let i=ps;i<source.length;i++){
    const c=source[i],n=source[i+1];
    if(lc){if(c==='\n')lc=false;continue}
    if(bc){if(c==='*'&&n==='/'){bc=false;i++}continue}
    if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
    if(c==="'"||c==='"'||c==='\x60'){q=c;continue}
    if(c==='/'&&n==='/'){lc=true;i++;continue}
    if(c==='/'&&n==='*'){bc=true;i++;continue}
    if(c==='(')pd++; else if(c===')'&&--pd===0){pe=i;break}
  }
  assert.ok(pe>=0,'unterminated params '+name);
  const bs=source.indexOf('{',pe);
  let d=0;q=null;esc=false;lc=false;bc=false;
  for(let i=bs;i<source.length;i++){
    const c=source[i],n=source[i+1];
    if(lc){if(c==='\n')lc=false;continue}
    if(bc){if(c==='*'&&n==='/'){bc=false;i++}continue}
    if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
    if(c==="'"||c==='"'||c==='\x60'){q=c;continue}
    if(c==='/'&&n==='/'){lc=true;i++;continue}
    if(c==='/'&&n==='*'){bc=true;i++;continue}
    if(c==='{')d++; else if(c==='}'&&--d===0)return source.slice(start,i+1);
  }
  assert.fail('unterminated '+name);
}

// Skill 58 is intentionally the fixed data bug: name says Autarky but row binds ENRAGE.
const autarky=runtime.bySkillId['58'];
assert.ok(autarky);
assert.equal(autarky.name,'自给自足');
assert.equal(autarky.func,'PROFESSION_ENRAGE');
assert.equal(autarky.commonCommand,'BATTLE_COM_S_ENRAGE');
assert.equal(autarky.target,1);
assert.equal(autarky.costMp,20);

// Skills 59-61 exact rows.
const expected={
  59:{name:'雷抗性',func:'PROFESSION_RESIST_THUNDER',option:'雷|成%100|回%3'},
  60:{name:'火抗性',func:'PROFESSION_RESIST_FIRE',option:'火|成%100|回%3'},
  61:{name:'冰抗性',func:'PROFESSION_RESIST_ICE',option:'冰|成%100|回%3'}
};
for(const [id,e] of Object.entries(expected)){
  const row=runtime.bySkillId[id];
  assert.ok(row);
  assert.equal(row.name,e.name);
  assert.equal(row.func,e.func);
  assert.equal(row.option,e.option);
  assert.equal(row.costMp,14);
  assert.equal(row.target,5);
  assert.equal(row.kind,2);
}

const support={};
vm.createContext(support);
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),support);
assert.equal(support.sourceProfessionBattleFunctionSupported('PROFESSION_ENRAGE'),true);
for(const f of ['PROFESSION_RESIST_THUNDER','PROFESSION_RESIST_FIRE','PROFESSION_RESIST_ICE']){
  assert.equal(support.sourceProfessionBattleFunctionSupported(f),true);
}

// Spec math: base success 100 + tier*4, up tier+10, turns 3/4/5 then stored +1.
const specCtx={
  Math,Number,String,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionSkillTemplate:id=>runtime.bySkillId[String(id)]||null,
  sourceProfessionStatusOptionInt:(option,label,fallback=0)=>{
    const m=String(option||'').match(new RegExp(label+'%([+-]?\\d+)'));
    return m?Number(m[1]):fallback;
  }
};
vm.createContext(specCtx);
for(const n of ['sourceProfessionResistAttr','sourceProfessionResistTurns','sourceProfessionResistSpec']){
  vm.runInContext(extractFunction(game,n),specCtx);
}
let spec=specCtx.sourceProfessionResistSpec({skillId:60,functionName:'PROFESSION_RESIST_FIRE',attackSkillTier:0});
assert.equal(spec.attr,'fire');
assert.equal(spec.success,100);
assert.equal(spec.upValue,10);
assert.equal(spec.turns,3);
assert.equal(spec.storedTurns,4);
spec=specCtx.sourceProfessionResistSpec({skillId:59,functionName:'PROFESSION_RESIST_THUNDER',attackSkillTier:5});
assert.equal(spec.attr,'thunder');
assert.equal(spec.success,120);
assert.equal(spec.upValue,15);
assert.equal(spec.turns,4);
assert.equal(spec.storedTurns,5);
spec=specCtx.sourceProfessionResistSpec({skillId:61,functionName:'PROFESSION_RESIST_ICE',attackSkillTier:10});
assert.equal(spec.attr,'ice');
assert.equal(spec.success,140);
assert.equal(spec.upValue,20);
assert.equal(spec.turns,5);
assert.equal(spec.storedTurns,6);

// Existing shared profession status checker consumes RNG before busy/dead gates and uses strict <.
const check=extractFunction(game,'sourceProfessionStatusAttackCheck');
assert.ok(check.indexOf('const roll=cRand(1,100)')<check.indexOf('battleStatusDescAlive'));
assert.ok(check.indexOf('const roll=cRand(1,100)')<check.indexOf('battleHasAnyStatus'));
assert.ok(check.includes('roll<threshold'));

// StatusTbl exclusivity now sees profession resist.
const has=extractFunction(game,'battleHasAnyStatus');
assert.ok(has.includes('sourceProfessionPlayerResistStatusActive(desc)'));

// Execute: forced self, mutation only after successful StatusAttackCheck.
const execCtx={
  Math,Number,String,
  battlePlayerProfessionResistState:null,
  battlePlayerProfessionResistWork:{fire:0,ice:0,thunder:0},
  battlePlayerProfessionResistMod:{fire:0,ice:0,thunder:0},
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionSkillTemplate:id=>runtime.bySkillId[String(id)]||null,
  sourceProfessionStatusOptionInt:specCtx.sourceProfessionStatusOptionInt,
  sourceProfessionResistAttr:specCtx.sourceProfessionResistAttr,
  sourceProfessionResistTurns:specCtx.sourceProfessionResistTurns,
  sourceProfessionResistSpec:specCtx.sourceProfessionResistSpec,
  sourceProfessionPlayerResistValue:attr=>Math.trunc(Number(execCtx.battlePlayerProfessionResistWork[attr]||0)),
  addLog:()=>{}
};
vm.createContext(execCtx);
vm.runInContext(extractFunction(game,'sourceProfessionResistExecute'),execCtx);
let seenThreshold=null;
let out=execCtx.sourceProfessionResistExecute(
  {skillId:60,functionName:'PROFESSION_RESIST_FIRE',attackSkillTier:0,toNo:13},
  '火抗性',
  (_desc,threshold)=>{seenThreshold=threshold;return {success:true,roll:99,threshold,reason:'hit'}}
);
assert.equal(seenThreshold,100);
assert.equal(out.applied,true);
assert.equal(out.toNo,0);
assert.equal(out.forcedSelfByProfessionAddskill,true);
assert.equal(execCtx.battlePlayerProfessionResistWork.fire,10);
assert.equal(execCtx.battlePlayerProfessionResistMod.fire,10);
assert.equal(execCtx.battlePlayerProfessionResistState.turns,4);

// Failed status check consumes no Work mutation.
execCtx.battlePlayerProfessionResistState=null;
execCtx.battlePlayerProfessionResistWork={fire:0,ice:0,thunder:0};
execCtx.battlePlayerProfessionResistMod={fire:0,ice:0,thunder:0};
out=execCtx.sourceProfessionResistExecute(
  {skillId:60,functionName:'PROFESSION_RESIST_FIRE',attackSkillTier:0,toNo:0},
  '火抗性',
  (_desc,threshold)=>({success:false,roll:100,threshold,reason:'roll'})
);
assert.equal(out.applied,false);
assert.equal(execCtx.battlePlayerProfessionResistWork.fire,0);

// Ghost lifecycle: stored 4 -> 3 -> 2 -> 1 removes effect but still blocks -> 0 clears state.
// MOD remains stale.
const seqCtx={
  Math,Number,String,
  battlePlayerProfessionResistState:{attr:'fire',turns:4,upValue:10,effectActive:true},
  battlePlayerProfessionResistWork:{fire:10,ice:0,thunder:0},
  battlePlayerProfessionResistMod:{fire:10,ice:0,thunder:0},
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionPlayerResistValue:attr=>Math.trunc(Number(seqCtx.battlePlayerProfessionResistWork[attr]||0)),
  addLog:()=>{}
};
vm.createContext(seqCtx);
vm.runInContext(extractFunction(game,'sourceProfessionPlayerResistStatusSeq'),seqCtx);
let q=seqCtx.sourceProfessionPlayerResistStatusSeq();
assert.equal(q.turns,3); assert.equal(q.effectActive,true); assert.equal(seqCtx.battlePlayerProfessionResistWork.fire,10);
q=seqCtx.sourceProfessionPlayerResistStatusSeq();
assert.equal(q.turns,2); assert.equal(q.effectActive,true); assert.equal(seqCtx.battlePlayerProfessionResistWork.fire,10);
q=seqCtx.sourceProfessionPlayerResistStatusSeq();
assert.equal(q.turns,1); assert.equal(q.effectRemoved,true); assert.equal(q.ghostStatus,true);
assert.equal(seqCtx.battlePlayerProfessionResistWork.fire,0);
assert.equal(seqCtx.battlePlayerProfessionResistMod.fire,10);
q=seqCtx.sourceProfessionPlayerResistStatusSeq();
assert.equal(q.turns,0); assert.equal(q.statusCleared,true);
assert.equal(seqCtx.battlePlayerProfessionResistState,null);
assert.equal(seqCtx.battlePlayerProfessionResistMod.fire,10);

// Profession magic field mapping is source F/T/I, not ordinary earth/water/fire/wind magicResist.
const mapCtx={
  Math,Number,String,
  battlePlayerProfessionResistWork:{fire:11,ice:22,thunder:33},
  n:v=>Number.isFinite(Number(v))?Number(v):0
};
vm.createContext(mapCtx);
vm.runInContext(extractFunction(game,'sourceProfessionPlayerResistValue'),mapCtx);
vm.runInContext(extractFunction(game,'sourceProfessionPlayerResistVector'),mapCtx);
vm.runInContext(extractFunction(game,'sourceProfessionPlayerResistForMagicType'),mapCtx);
assert.equal(mapCtx.sourceProfessionPlayerResistForMagicType(1),11);
assert.equal(mapCtx.sourceProfessionPlayerResistForMagicType(2),33);
assert.equal(mapCtx.sourceProfessionPlayerResistForMagicType(3),22);
assert.equal(mapCtx.sourceProfessionPlayerResistForMagicType(0),0);

// Dispatcher must route RESIST before generic same-side rejection.
const dispatch=extractFunction(game,'sourceProfessionBattleSkillExecute');
const resistAt=dispatch.indexOf("prepared.functionName==='PROFESSION_RESIST_FIRE'");
const sameSideAt=dispatch.indexOf('if(toNo<10){');
assert.ok(resistAt>=0&&sameSideAt>resistAt);
assert.ok(dispatch.includes('sourceProfessionResistExecute(prepared,resistName)'));

// Player StatusSeq consumes the ordinary resist status before MYSKILL tail and returns trace metadata.
const process=extractFunction(game,'processBattleStatusTurn');
assert.ok(process.indexOf('sourceProfessionPlayerResistStatusSeq()')
  <process.indexOf('sourceProfessionPetStrStatusSeq(desc)'));
assert.ok(process.includes('if(professionResist)extra.professionResist=professionResist'));

// Battle reset clears active Work and stale MOD.
const reset=extractFunction(game,'resetBattleStatuses');
assert.ok(reset.includes('battlePlayerProfessionResistState=null'));
assert.ok(reset.includes('battlePlayerProfessionResistWork={fire:0,ice:0,thunder:0}'));
assert.ok(reset.includes('battlePlayerProfessionResistMod={fire:0,ice:0,thunder:0}'));

// Historical regression markers remain intact.
for(const v of ['2.41','2.44','2.45','2.46','2.47','2.48'])assert.ok(html.includes('PLAYABLE CORE V'+v));
assert.match(html,/V2\.48 live：[^<]*自給自足[^<]*雷抗性[^<]*火抗性[^<]*冰抗性/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.48-core',
  focus:'Skill 58 fixed ENRAGE bind + Skills 59-61 profession elemental resist StatusTbl lifecycle',
  autarkyBug:'Skill 58 data row binds PROFESSION_ENRAGE; PROFESSION_AUTARKY is not used',
  skills:[59,60,61],
  success:'100+tier*4, strict RAND(1,100)<threshold',
  resist:'tier+10 = 10..20',
  turns:'stored 4/5/6; effect removed at counter 1; ghost StatusTbl until next own action',
  saveSchema:30
}));
