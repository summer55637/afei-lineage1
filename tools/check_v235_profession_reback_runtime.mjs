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
    if(c==='(')pd++;
    else if(c===')'&&--pd===0){pe=i;break}
  }
  assert.ok(pe>=0,'unterminated params '+name);
  const bs=source.indexOf('{',pe);
  assert.ok(bs>=0,'missing body '+name);
  let d=0;q=null;esc=false;lc=false;bc=false;
  for(let i=bs;i<source.length;i++){
    const c=source[i],n=source[i+1];
    if(lc){if(c==='\n')lc=false;continue}
    if(bc){if(c==='*'&&n==='/'){bc=false;i++}continue}
    if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
    if(c==="'"||c==='"'||c==='\x60'){q=c;continue}
    if(c==='/'&&n==='/'){lc=true;i++;continue}
    if(c==='/'&&n==='*'){bc=true;i++;continue}
    if(c==='{')d++;
    else if(c==='}'&&--d===0)return source.slice(start,i+1);
  }
  assert.fail('unterminated '+name);
}

const row=runtime.bySkillId['33'];
assert.equal(row.name,'状态回复');
assert.equal(row.func,'PROFESSION_REBACK');
assert.equal(row.commonCommand,'BATTLE_COM_S_REBACK');
assert.equal(row.professionClass,1);
assert.equal(row.target,1);
assert.equal(row.kind,2);
assert.equal(row.useFlag,1);
assert.equal(row.costMp,0);
assert.equal(row.option,'HP%2');

const supported=extractFunction(game,'sourceProfessionBattleFunctionSupported');
assert.ok(supported.includes("functionName==='PROFESSION_REBACK'"));

const execute=extractFunction(game,'sourceProfessionBattleSkillExecute');
const rebackAt=execute.indexOf("prepared.functionName==='PROFESSION_REBACK'");
const deflectAt=execute.indexOf("prepared.functionName==='PROFESSION_DEFLECT'");
assert.ok(rebackAt>=0&&deflectAt>rebackAt);
assert.ok(execute.includes("reason:'source-reback-no-battle-case'"));
assert.ok(execute.includes('sourceNoBattleCase:true'));

assert.match(game,/SOURCE_PROFESSION_REBACK_STATUS_TYPES=Object\.freeze\(\[\s*'paralysis','sleep','stone','dizzy','entwine','dragnet','iceCrack','iceArrow','thunderEnclose'/);

const findFn=extractFunction(game,'sourceProfessionStatusSeqFindSkillByFunction');
const magicLevelFn=extractFunction(game,'sourceProfessionMagicLevelM');
const qualifyingFn=extractFunction(game,'sourceProfessionPlayerRebackQualifyingStatus');
const rebackFn=extractFunction(game,'sourceProfessionPlayerRebackStatusSeq');

// fixed skill-slot scan terminates at first empty slot instead of skipping the gap.
const rows={
  22:{func:'PROFESSION_BRUST',professionClass:1},
  33:{func:'PROFESSION_REBACK',professionClass:1}
};
let skills=[null,{skillId:33,rawLevel:9100},null];
const fctx={
  Math,Number,String,Object,Array,
  PROFESSION_SKILL_SLOT_COUNT:3,
  state:{},
  sourcePlayerProfessionSkillAt:(i)=>skills[i]?{slot:i,...skills[i]}:null,
  sourceProfessionSkillTemplate:(id)=>rows[id]||null
};
vm.createContext(fctx);
vm.runInContext(findFn,fctx);
let found=fctx.sourceProfessionStatusSeqFindSkillByFunction('PROFESSION_REBACK',{});
assert.equal(found.ok,false);
assert.equal(found.reason,'source-slot-terminator');
assert.equal(found.slot,0);

skills=[{skillId:22,rawLevel:1000},{skillId:33,rawLevel:9100},null];
found=fctx.sourceProfessionStatusSeqFindSkillByFunction('PROFESSION_REBACK',{});
assert.equal(found.ok,true);
assert.equal(found.slot,1);
assert.equal(found.entry.skillId,33);

// CHANGE_SKILL_LEVEL_M boundaries used by Reback.
const mctx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(mctx);
vm.runInContext(magicLevelFn,mctx);
assert.equal(mctx.sourceProfessionMagicLevelM(1),1);
assert.equal(mctx.sourceProfessionMagicLevelM(10),1);
assert.equal(mctx.sourceProfessionMagicLevelM(11),2);
assert.equal(mctx.sourceProfessionMagicLevelM(90),9);
assert.equal(mctx.sourceProfessionMagicLevelM(91),10);
assert.equal(mctx.sourceProfessionMagicLevelM(100),10);

// Execute the real Reback helper with source-like dependencies.
let hp=500,currentStatus={type:'paralysis',turns:2},proficiencyCalls=0,logs=[];
const state={
  professionClass:1,
  professionSkills:[{skillId:22,rawLevel:1000},{skillId:33,rawLevel:9100},null]
};
const rctx={
  Math,Number,String,Object,Array,
  PROFESSION_SKILL_SLOT_COUNT:3,
  state,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  SOURCE_PROFESSION_REBACK_STATUS_TYPES:[
    'paralysis','sleep','stone','dizzy','entwine','dragnet','iceCrack','iceArrow','thunderEnclose'
  ],
  sourcePlayerProfessionSkillAt:(i,t=state)=>{
    const e=t.professionSkills[i];return e?{slot:i,skillId:e.skillId,rawLevel:e.rawLevel}:null;
  },
  sourceProfessionSkillTemplate:(id)=>rows[id]||null,
  battleStatusGet:()=>currentStatus,
  sourcePlayerProfessionSkillDisplayLevel:e=>Math.trunc(e.rawLevel/100),
  sourceUltimateMaxHp:()=>1000,
  battleStatusHp:()=>hp,
  battleStatusSetHp:(_d,v)=>{hp=Math.max(0,Math.trunc(v));},
  sourceProfessionSkillProficiencyApply:(_t,slot)=>{proficiencyCalls++;return {ok:true,slot,success:false,rawAfter:9100};},
  sourceProfessionLogProficiencyResult:r=>r,
  addLog:(m)=>logs.push(m),
  cRand:()=>1
};
vm.createContext(rctx);
vm.runInContext(magicLevelFn,rctx);
vm.runInContext(findFn,rctx);
vm.runInContext(qualifyingFn,rctx);
vm.runInContext(rebackFn,rctx);

let result=rctx.sourceProfessionPlayerRebackStatusSeq({kind:'player'},state);
assert.equal(result.triggered,true);
assert.equal(result.status,'paralysis');
assert.equal(result.tier,10);
assert.equal(result.percent,20);
assert.equal(result.amount,200);
assert.equal(result.hpBefore,500);
assert.equal(result.hpAfter,700);
assert.equal(hp,700);
assert.equal(proficiencyCalls,1);

// Full HP still triggers PROFESSION_SKILL_LVEVEL_UP attempt with zero actual heal.
hp=1000;
result=rctx.sourceProfessionPlayerRebackStatusSeq({kind:'player'},state);
assert.equal(result.triggered,true);
assert.equal(result.amount,0);
assert.equal(result.hpAfter,1000);
assert.equal(proficiencyCalls,2);

// Non-listed statuses do not trigger and consume no proficiency attempt.
currentStatus={type:'poison',turns:3};
result=rctx.sourceProfessionPlayerRebackStatusSeq({kind:'player'},state);
assert.equal(result.triggered,false);
assert.equal(result.reason,'no-qualifying-status');
assert.equal(proficiencyCalls,2);

// Post-countdown zero is not eligible.
currentStatus={type:'sleep',turns:0};
result=rctx.sourceProfessionPlayerRebackStatusSeq({kind:'player'},state);
assert.equal(result.triggered,false);
assert.equal(proficiencyCalls,2);

// Every one of the fixed 9 status types qualifies.
for(const type of rctx.SOURCE_PROFESSION_REBACK_STATUS_TYPES){
  currentStatus={type,turns:1};
  assert.equal(rctx.sourceProfessionPlayerRebackQualifyingStatus({kind:'player'}).type,type);
}

// Profession mismatch blocks the automatic effect.
state.professionClass=3;
currentStatus={type:'stone',turns:2};
result=rctx.sourceProfessionPlayerRebackStatusSeq({kind:'player'},state);
assert.equal(result.triggered,false);
assert.equal(result.reason,'profession-mismatch');
state.professionClass=1;

// processBattleStatusTurn wires ProfessionStatusSeq into finish(), after MagicStatusSeq state updates
// and before caller-side movement skip. Expired generic status branches clear first, then call finish().
const process=extractFunction(game,'processBattleStatusTurn');
assert.ok(process.includes("const professionReback=desc.kind==='player'"));
assert.ok(process.indexOf('const defMagic=sourceDefMagicStatusSeq(desc)')
  <process.indexOf("const professionReback=desc.kind==='player'"));
assert.ok(process.includes('if(professionReback?.triggered)extra.professionReback=professionReback'));
const decrementAt=process.indexOf('st.turns--');
assert.ok(decrementAt>=0);
assert.ok(process.indexOf("battleStatusClear(desc);",decrementAt)>decrementAt);
assert.ok(process.indexOf("return finish({skip:blockedBefore,desc,status:st,expired:true",decrementAt)>decrementAt);

assert.match(html,/PLAYABLE CORE V2\.39/);
assert.match(html,/V2\.39 live：[^<]*狀態回復/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.35',
  focus:'PROFESSION_REBACK automatic BATTLE_ProfessionStatusSeq recovery',
  liveSkillId:33,
  qualifyingStatuses:[
    'paralysis','sleep','stone','dizzy','entwine','dragnet','iceCrack','iceArrow','thunderEnclose'
  ],
  heal:'min(20, CHANGE_SKILL_LEVEL_M(level)*2)% WORKMAXHP',
  sourceBugs:[
    'active BATTLE_COM_S_REBACK has no battle command case',
    'first empty/invalid profession skill slot terminates ProfessionStatusSeq scan',
    'full HP still attempts Reback proficiency level-up'
  ],
  saveSchema:30
}));
