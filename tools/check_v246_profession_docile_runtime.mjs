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

const row=runtime.bySkillId['56'];
assert.ok(row);
assert.equal(row.name,'驯服宠物');
assert.equal(row.func,'PROFESSION_DOCILE');
assert.equal(row.costMp,10);
assert.equal(row.target,1);
assert.equal(row.kind,2);
assert.equal(row.option,'倍%2|次%2|攻%2|效%1');
assert.equal(row.commonCommand,'BATTLE_COM_S_DOCILE');

const supportCtx={};
vm.createContext(supportCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),supportCtx);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_DOCILE'),true);

// A-tier power is exactly tier*2+10.
const rateCtx={
  Math,Number,
  n:v=>Number.isFinite(Number(v))?Number(v):0
};
vm.createContext(rateCtx);
vm.runInContext(extractFunction(game,'sourceProfessionDocileRate'),rateCtx);
assert.equal(rateCtx.sourceProfessionDocileRate({attackSkillTier:0}),10);
assert.equal(rateCtx.sourceProfessionDocileRate({attackSkillTier:5}),20);
assert.equal(rateCtx.sourceProfessionDocileRate({attackSkillTier:10}),30);

// RAND receives fractional 0.9/1.1 endpoints and final macro value is assigned to int UpPoint.
vm.runInContext(extractFunction(game,'sourceProfessionDocileUpPoint'),rateCtx);
let bounds=null;
let point=rateCtx.sourceProfessionDocileUpPoint(12,(lo,hi)=>{bounds=[lo,hi];return 12.8});
assert.ok(Math.abs(bounds[0]-10.8)<1e-9);
assert.ok(Math.abs(bounds[1]-13.2)<1e-9);
assert.equal(point,12);

// Execute: Player bid 0 only, alive only, and repeated casts accumulate.
const execCtx={
  Math,Number,String,
  state:{hp:100},
  battlePlayerCaptureMod:7,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionDocileRate:p=>Math.trunc(Number(p.attackSkillTier))*2+10,
  sourceProfessionDocileUpPoint:(rate,randMacro)=>Math.trunc(randMacro(rate*.9,rate*1.1)),
  addLog:()=>{}
};
vm.createContext(execCtx);
vm.runInContext(extractFunction(game,'sourceProfessionDocileExecute'),execCtx);
let rngCalls=0;
let out=execCtx.sourceProfessionDocileExecute(
  {skillId:56,functionName:'PROFESSION_DOCILE',toNo:0,attackSkillTier:5},
  '馴服寵物',
  ()=>{rngCalls++;return 18.9}
);
assert.equal(out.applied,true);
assert.equal(out.rate,20);
assert.equal(out.upPoint,18);
assert.equal(out.captureModBefore,7);
assert.equal(out.captureModAfter,25);
assert.equal(execCtx.battlePlayerCaptureMod,25);
assert.equal(rngCalls,1);

out=execCtx.sourceProfessionDocileExecute(
  {skillId:56,functionName:'PROFESSION_DOCILE',toNo:0,attackSkillTier:0},
  '馴服寵物',
  ()=>{rngCalls++;return 9.9}
);
assert.equal(out.captureModBefore,25);
assert.equal(out.captureModAfter,34);
assert.equal(execCtx.battlePlayerCaptureMod,34);
assert.equal(rngCalls,2);

// Enemy direct target would remain in MultiList but BATTLE_MultiCaptureUp skips non-Player.
out=execCtx.sourceProfessionDocileExecute(
  {skillId:56,functionName:'PROFESSION_DOCILE',toNo:10,attackSkillTier:10},
  '馴服寵物',
  ()=>{rngCalls++;return 99}
);
assert.equal(out.applied,false);
assert.equal(out.reason,'source-target-not-player');
assert.equal(execCtx.battlePlayerCaptureMod,34);
assert.equal(rngCalls,2);

// Dead Player is skipped and consumes no RAND.
execCtx.state.hp=0;
out=execCtx.sourceProfessionDocileExecute(
  {skillId:56,functionName:'PROFESSION_DOCILE',toNo:0,attackSkillTier:10},
  '馴服寵物',
  ()=>{rngCalls++;return 99}
);
assert.equal(out.applied,false);
assert.equal(out.reason,'source-player-dead');
assert.equal(execCtx.battlePlayerCaptureMod,34);
assert.equal(rngCalls,2);

// Live selection special-case is isolated to DOCILE.
const liveCtx={
  Math,Number,String,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourcePlayerProfessionSkillAt:(slot)=>slot===1?{skillId:56}:{skillId:50},
  sourceProfessionSkillTemplate:id=>id===56?{func:'PROFESSION_DOCILE'}:{func:'PROFESSION_TOXIN_WEAPON'},
  targetEnemyUnit:()=>({battleSlot:3})
};
vm.createContext(liveCtx);
vm.runInContext(extractFunction(game,'sourceProfessionLiveSelectedToNo'),liveCtx);
assert.equal(liveCtx.sourceProfessionLiveSelectedToNo(1,{}),0);
assert.equal(liveCtx.sourceProfessionLiveSelectedToNo(2,{}),13);

// Dispatcher must occur before generic same-side direct target rejection.
const dispatch=extractFunction(game,'sourceProfessionBattleSkillExecute');
const docileAt=dispatch.indexOf("prepared.functionName==='PROFESSION_DOCILE'");
const sameSideAt=dispatch.indexOf('if(toNo<10){');
assert.ok(docileAt>=0&&sameSideAt>docileAt);
assert.ok(dispatch.includes('sourceProfessionDocileExecute(prepared,docileName)'));

// attackTurn must resolve DOCILE self target before prepare.
const attackTurn=extractFunction(game,'attackTurn');
assert.ok(attackTurn.includes('sourceProfessionLiveSelectedToNo(professionSlot,state)'));
assert.equal(attackTurn.includes('const selected=targetEnemyUnit();'),false);

// Existing capture formula now consumes the real battle-local Work.
const chance=extractFunction(game,'captureChance');
assert.ok(chance.includes('const captureMod=Math.trunc(n(battlePlayerCaptureMod))'));
assert.ok(chance.includes('workSum*charm/50+captureMod+sleepBonus'));
assert.equal(chance.includes('const captureMod=0'),false);

// Capture Work is cleared only after the player actually reaches its capture command.
const capture=extractFunction(game,'captureTurn');
const actorTargetAt=capture.indexOf('const target=sourceFriendlyEnemyTargetAdjust(actor)');
const chanceAt=capture.indexOf('const c=captureChance();',actorTargetAt);
const clearAt=capture.indexOf('battlePlayerCaptureMod=0;',chanceAt);
const rollAt=capture.indexOf('cRand(1,100)<c.raw',clearAt);
assert.ok(actorTargetAt>=0&&chanceAt>actorTargetAt&&clearAt>chanceAt&&rollAt>clearAt);
const preStatus=capture.slice(0,actorTargetAt);
assert.equal(preStatus.includes('battlePlayerCaptureMod=0;'),false);

// Battle entry/teardown reset.
const reset=extractFunction(game,'resetBattleStatuses');
assert.ok(reset.includes('battlePlayerCaptureMod=0'));

// Preserve old historical regression markers while publishing V2.46.
assert.match(html,/PLAYABLE CORE V2\.44/);
assert.match(html,/PLAYABLE CORE V2\.45/);
assert.match(html,/PLAYABLE CORE V2\.46/);
assert.match(html,/V2\.46 live：[^<]*屍體掠奪[^<]*馴服寵物/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.46-core',
  focus:'Skill 56 PROFESSION_DOCILE -> MultiCaptureUp -> WORKMODCAPTURE -> CaptureCheck',
  skillId:56,mpCost:10,target:'OTHER/self Player bid 0',
  power:'A-tier*2+10 = 10..30',
  rng:'RAND(power*0.9,power*1.1), final int UpPoint',
  lifecycle:'battle-local accumulate; clear only on real BATTLE_Capture execution; battle reset clears',
  saveSchema:30
}));
