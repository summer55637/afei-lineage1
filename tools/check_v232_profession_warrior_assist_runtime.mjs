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
    if(c==='{')d++;
    else if(c==='}'&&--d===0)return source.slice(start,i+1);
  }
  assert.fail('unterminated '+name);
}

const rows=[35,36,37].map(id=>runtime.bySkillId[String(id)]);
assert.deepEqual(rows.map(x=>x.name),['激化攻击','能量聚集','专注战斗']);
assert.deepEqual(rows.map(x=>x.func),['PROFESSION_ENRAGE','PROFESSION_ENERGY_COLLECT','PROFESSION_FOCUS']);
assert.deepEqual(rows.map(x=>x.commonCommand),['BATTLE_COM_S_ENRAGE','BATTLE_COM_S_COLLECT','BATTLE_COM_S_FOCUS']);
assert.deepEqual(rows.map(x=>x.target),[5,5,5]);
assert.deepEqual(rows.map(x=>x.kind),[2,2,2]);
assert.deepEqual(rows.map(x=>x.useFlag),[1,1,1]);
assert.deepEqual(rows.map(x=>x.costMp),[20,10,9]);
assert.equal(rows[0].option,'攻%20|防%10|倍%2|效%1|回%3');
assert.equal(rows[1].option,'防%20|敏%10|倍%2|效%1|回%3');
assert.equal(rows[2].option,'命%200|倍%2|效%1|回%2');

const ctx={
  Math,Number,Object,Array,Set,Map,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  state:{
    attack:100,defense:80,dex:50,
    playerEquipCompliance:{fixedAttack:100,fixedTough:80,fixedDex:50,preSuitFixedTough:80,hitRight:7}
  },
  battlePlayerProfessionStatStates:{str:null,tgh:null,dex:null},
  battlePlayerProfessionStatRound:null,
  battlePlayerProfessionHitState:null,
  battleMagicPetStates:new Map(),
  sourceMagicPetState:()=>null,
  sourceProfessionPlayerHitRight:()=>7,
  addLog:()=>{}
};
vm.createContext(ctx);

for(const name of [
  'sourceProfessionBattleFunctionSupported',
  'sourceProfessionPlayerStatActiveAny',
  'sourceProfessionPlayerStatSet',
  'sourceProfessionPlayerStatPreCommandCompliance',
  'sourceProfessionPlayerStatRoundAdjusted',
  'sourceProfessionPlayerStatStatusSeq',
  'sourceProfessionWarriorAssistTurns',
  'sourceProfessionWarriorAssistExecute'
])vm.runInContext(extractFunction(game,name),ctx);

for(const fn of ['PROFESSION_ENRAGE','PROFESSION_ENERGY_COLLECT','PROFESSION_FOCUS']){
  assert.equal(ctx.sourceProfessionBattleFunctionSupported(fn),true);
}

assert.equal(ctx.sourceProfessionWarriorAssistTurns(0),3);
assert.equal(ctx.sourceProfessionWarriorAssistTurns(4),3);
assert.equal(ctx.sourceProfessionWarriorAssistTurns(5),4);
assert.equal(ctx.sourceProfessionWarriorAssistTurns(9),4);
assert.equal(ctx.sourceProfessionWarriorAssistTurns(10),5);

// Enrage tier 5 -> STR +30 / TGH -20, both stored for 4 turns.
let result=ctx.sourceProfessionWarriorAssistExecute(
  {skillId:35,functionName:'PROFESSION_ENRAGE',attackSkillTier:5,toNo:0},'激化攻击'
);
assert.equal(result.turns,4);
assert.equal(result.strPower,30);
assert.equal(result.tghPower,-20);
assert.equal(ctx.battlePlayerProfessionStatStates.str.turns,4);
assert.equal(ctx.battlePlayerProfessionStatStates.tgh.turns,4);

// fixed Other_DefcharWorkInt bug: BOTH deltas use mtgh=80.
let snap=ctx.sourceProfessionPlayerStatPreCommandCompliance(ctx.state);
assert.equal(snap.mtgh,80);
assert.equal(snap.attackAdd,24);
assert.equal(snap.defenseAdd,-16);
assert.equal(snap.quickAdd,0);
let adjusted=ctx.sourceProfessionPlayerStatRoundAdjusted(100,80,50);
assert.deepEqual(JSON.parse(JSON.stringify({
  attack:adjusted.attack,defense:adjusted.defense,quick:adjusted.quick
})),{attack:124,defense:64,quick:50});

// StatusSeq decrements STR -> TGH -> DEX counters but must not mutate this round snapshot.
let ticks=ctx.sourceProfessionPlayerStatStatusSeq(ctx.state);
assert.deepEqual(Array.from(ticks,x=>x.stat),['str','tgh']);
assert.equal(ctx.battlePlayerProfessionStatStates.str.turns,3);
assert.equal(ctx.battlePlayerProfessionStatRound.attackAdd,24);

// Collect tier 5 overwrites TGH and writes POSITIVE DEX despite source comment/client display.
ctx.battlePlayerProfessionStatStates={str:null,tgh:null,dex:null};
result=ctx.sourceProfessionWarriorAssistExecute(
  {skillId:36,functionName:'PROFESSION_ENERGY_COLLECT',attackSkillTier:5,toNo:0},'能量聚集'
);
assert.equal(result.turns,4);
assert.equal(result.tghPower,30);
assert.equal(result.dexPower,20);
assert.equal(result.sourceDexSignBug,true);
snap=ctx.sourceProfessionPlayerStatPreCommandCompliance(ctx.state);
assert.equal(snap.defenseAdd,24);
assert.equal(snap.quickAdd,16);
adjusted=ctx.sourceProfessionPlayerStatRoundAdjusted(100,80,50);
assert.equal(adjusted.defense,104);
assert.equal(adjusted.quick,66);

// Profession write replaces a same-stat SetMagicPet future state.
ctx.battleMagicPetStates.set('player',{stat:'DEX',turns:3,power:-40});
ctx.sourceMagicPetState=()=>ctx.battleMagicPetStates.get('player')||null;
const overwrite=ctx.sourceProfessionPlayerStatSet('dex',3,10);
assert.equal(overwrite.overwroteMagicPet,true);
assert.equal(ctx.battleMagicPetStates.has('player'),false);
assert.equal(ctx.sourceProfessionPlayerStatActiveAny(),true);

// Focus hardcodes 2 / 100 but DOES NOT add 100 to current WORKHITRIGHT.
result=ctx.sourceProfessionWarriorAssistExecute(
  {skillId:37,functionName:'PROFESSION_FOCUS',attackSkillTier:10,toNo:0},'专注战斗'
);
assert.equal(result.turns,2);
assert.equal(result.power,100);
assert.equal(result.workHitRight,7);
assert.equal(result.noImmediateHitRightIncrease,true);
assert.deepEqual(JSON.parse(JSON.stringify(ctx.battlePlayerProfessionHitState)),{
  turns:2,power:100,workHitRight:7
});

// Live route must happen before generic same-side direct-attack rejection.
const exec=extractFunction(game,'sourceProfessionBattleSkillExecute');
const assistAt=exec.indexOf("prepared.functionName==='PROFESSION_ENRAGE'");
const sameSideAt=exec.indexOf('if(toNo<10){');
assert.ok(assistAt>=0&&assistAt<sameSideAt);
assert.ok(exec.includes('sourceProfessionWarriorAssistExecute(prepared,assistName)'));

// SetMagicPet mutual exclusion includes active Player profession STR/TGH/DEX.
const busy=extractFunction(game,'sourceMagicPetBusy');
assert.ok(busy.includes("desc?.kind==='player'"));
assert.ok(busy.includes('sourceProfessionPlayerStatActiveAny()'));

// PreCommand builds profession stat snapshot after compliance and before Player view.
const order=extractFunction(game,'normalBattleOrder');
assert.ok(order.indexOf('playerComplianceParameter(state)')
  <order.indexOf('sourceProfessionPlayerStatPreCommandCompliance(state)'));
assert.ok(order.indexOf('sourceProfessionPlayerStatPreCommandCompliance(state)')
  <order.indexOf('const player=playerBattleView()'));

// Player view applies MYSKILL stat deltas before WEAKEN and still allows current WORKATTACK override.
const view=extractFunction(game,'playerBattleView');
assert.ok(view.indexOf('sourceMagicPetAdjusted(')<view.indexOf('sourceProfessionPlayerStatRoundAdjusted('));
assert.ok(view.indexOf('sourceProfessionPlayerStatRoundAdjusted(')<view.indexOf('const compliantAttack=weaken?'));
assert.ok(view.includes('battlePlayerAttackWork==null?compliantAttack:Math.trunc(n(battlePlayerAttackWork))'));

// fixed StatusSeq order: STR/TGH/DEX countdown before HIT.
const status=extractFunction(game,'processBattleStatusTurn');
assert.ok(status.indexOf('sourceProfessionPlayerStatStatusSeq(state)')
  <status.indexOf('sourceProfessionPlayerHitStatusSeq(state)'));

const reset=extractFunction(game,'resetBattleStatuses');
assert.ok(reset.includes('battlePlayerProfessionStatStates={str:null,tgh:null,dex:null}'));
assert.ok(reset.includes('battlePlayerProfessionStatRound=null'));

assert.match(html,/PLAYABLE CORE V2\.35/);
assert.match(html,/V2\.35 live：[^<]*舍己為友[^<]*激化攻擊[^<]*能量聚集[^<]*專注戰鬥/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.32',
  focus:'Warrior ENRAGE / ENERGY_COLLECT / FOCUS fixed assist Work lifecycle',
  liveSkillIds:[35,36,37],
  storedTurns:'tier<5:3, tier5..9:4, tier10:5 for 35/36',
  sourceBugs:[
    'STR/TGH/DEX percentage delta all use pre-suit mtgh base',
    'ENERGY_COLLECT stores positive DEX power despite reduce-dex comment/client packet',
    'FOCUS writes MYSKILLHIT=2/NUM=100 without immediate WORKHITRIGHT increase'
  ],
  saveSchema:30
}));
