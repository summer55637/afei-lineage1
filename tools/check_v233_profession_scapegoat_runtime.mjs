import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_profession_skill_runtime.json','utf8'));

function extractFunction(source,name,last=false){
  const marker='function '+name+'(';
  const start=last?source.lastIndexOf(marker):source.indexOf(marker);
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

const row=runtime.bySkillId['34'];
assert.equal(row.name,'舍已为友');
assert.equal(row.func,'PROFESSION_SCAPEGOAT');
assert.equal(row.commonCommand,'BATTLE_COM_S_SCAPEGOAT');
assert.equal(row.target,5);
assert.equal(row.kind,2);
assert.equal(row.useFlag,1);
assert.equal(row.costMp,5);
assert.equal(row.option,'回%1');

const pet={id:'pet1',name:'測試寵',hp:100};
const ctx={
  Math,Number,Object,Array,Set,Map,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  state:{hp:100},
  enemy:{sourceBattleTurn:7},
  battlePetOutIds:new Set(),
  battleProfessionScapegoat:null,
  battlePlayerFixedToughWork:null,
  sourceBattlePlayerPets:()=>[pet],
  petIsBattleActive:()=>true,
  petIsAlive:()=>true,
  sourcePlayerPetHidden:()=>false,
  battleStatusCanMove:()=>true,
  battleStatusActive:()=>false,
  playerBattleView:()=>({fixedTough:80,defense:80}),
  addLog:()=>{}
};
vm.createContext(ctx);
for(const name of [
  'sourceProfessionScapegoatSourceSlots',
  'sourceProfessionScapegoatProtectedPets',
  'sourceProfessionScapegoatGuardianForPet',
  'sourceProfessionScapegoatExecute'
])vm.runInContext(extractFunction(game,name),ctx);

assert.deepEqual(Array.from(ctx.sourceProfessionScapegoatSourceSlots(0,0)),[5]);
assert.deepEqual(Array.from(ctx.sourceProfessionScapegoatSourceSlots(4,0)),[5]);
assert.deepEqual(Array.from(ctx.sourceProfessionScapegoatSourceSlots(5,0)),[5,6,7,8,9]);
assert.deepEqual(Array.from(ctx.sourceProfessionScapegoatSourceSlots(10,0)),[1,2,3,4,5,6,7,8,9]);

let result=ctx.sourceProfessionScapegoatExecute(
  {skillId:34,functionName:'PROFESSION_SCAPEGOAT',attackSkillTier:5,toNo:0},
  '舍已为友'
);
assert.equal(result.fixedToughBefore,80);
assert.equal(result.fixedToughScale,80);
assert.equal(result.fixedToughAfter,64);
assert.deepEqual(Array.from(result.sourceSlots),[5,6,7,8,9]);
assert.deepEqual(Array.from(result.protectedPetIds),['pet1']);
assert.equal(ctx.battlePlayerFixedToughWork,64);
assert.equal(ctx.battleProfessionScapegoat.protectedPetIds.has('pet1'),true);

// Melee can Guardian; ranged / unable Player cannot.
assert.equal(ctx.sourceProfessionScapegoatGuardianForPet({weaponType:1},pet),ctx.state);
assert.equal(ctx.sourceProfessionScapegoatGuardianForPet({weaponType:4},pet),null);
assert.equal(ctx.sourceProfessionScapegoatGuardianForPet({weaponType:17},pet),null);
ctx.battleStatusCanMove=()=>false;
assert.equal(ctx.sourceProfessionScapegoatGuardianForPet({weaponType:1},pet),null);

// AttackSeq adapter must perform original-Pet dodge BEFORE Guardian selection.
const directPet=extractFunction(game,'resolveEnemyDirectAttackToPet');
assert.ok(directPet.indexOf('sourceInitialDodgeOnly(')
  <directPet.indexOf('sourceProfessionScapegoatGuardianForPet('));
assert.ok(directPet.includes('guardian?playerBattleView():original'));
assert.ok(directPet.includes('disableDodge:true,skipSuitDodge:true'));
assert.ok(directPet.includes('r.playerGuardian=true'));
assert.ok(directPet.includes('if(r.damage<=0){r.damage=1;r.miss=false}'));

// Real substitution is opt-in; calc-only old paths remain untouched.
const petResult=extractFunction(game,'enemyAttackPetResult');
assert.ok(petResult.includes('options.sourceGuardianReal===true'));
const fall=extractFunction(game,'performEnemyFallGround',true);
assert.ok(fall.includes('enemyAttackPetResult(unit,chosen.pet)'));
assert.equal(fall.includes('sourceGuardianReal:true'),false);

// FIREKILL is a fixed real-defindex caller, so Pet target uses direct Guardian.
const firekill=extractFunction(game,'performEnemyFirekill');
assert.ok(firekill.includes("enemySkillTargetResult(unit,chosen,{sourceDirectGuardian:true})"));

// Actual target and status routing go Player-side after Scapegoat.
const actual=extractFunction(game,'enemyDirectActualTarget');
assert.ok(actual.includes("r?.playerGuardian&&chosen?.kind==='pet'"));
assert.ok(actual.includes("return {kind:'player'}"));
const shoot=extractFunction(game,'sourceEnemyAttackShootApplyHit');
assert.ok(shoot.includes('targetDesc=enemyDirectActualTarget(originalDesc,r)||originalDesc'));

// Counter loop is blocked exactly like fixed Guardian ContFlg FALSE.
const petCounter=extractFunction(game,'resolvePetEnemyCounterChain');
assert.ok(petCounter.includes('primaryResult?.playerGuardian'));
const playerCounter=extractFunction(game,'resolvePlayerEnemyCounterChain');
assert.ok(playerCounter.includes('primaryResult?.playerGuardian'));
const weaponCounter=extractFunction(game,'sourceEnemyFinalizeWeaponSequenceCounter');
assert.ok(weaponCounter.includes('r.playerGuardian'));

// FIXTOUGH differs from ordinary WORK defense during the same round.
const view=extractFunction(game,'playerBattleView');
assert.ok(view.includes('battlePlayerFixedToughWork==null'));
assert.ok(view.includes("type:'player',attack,defense:defenseBase"));
assert.ok(view.includes('fixedTough,'));

// Next PreCommand clears mapping/FIX override before compliance rebuild.
const order=extractFunction(game,'normalBattleOrder');
assert.ok(order.indexOf('battleProfessionScapegoat=null')
  <order.indexOf('playerComplianceParameter(state)'));
assert.ok(order.indexOf('battlePlayerFixedToughWork=null')
  <order.indexOf('playerComplianceParameter(state)'));

const reset=extractFunction(game,'resetBattleStatuses');
assert.ok(reset.includes('battleProfessionScapegoat=null'));
assert.ok(reset.includes('battlePlayerFixedToughWork=null'));

assert.match(html,/PLAYABLE CORE V2\.34/);
assert.match(html,/V2\.34 live：[^<]*舍己為友/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.33',
  focus:'PROFESSION_SCAPEGOAT real current-round Guardian mapping',
  liveSkillId:34,mpCost:5,
  coverage:'tier<5 owner Pet; tier5..9 all Pet entries; tier10 all same-side entries except caster',
  sourceOrder:'original Pet dodge -> GuardianCheck -> Player critical/damage',
  fixedTough:'old FIXTOUGH * (70+tier*2)%, WORKDEFENCEPOWER unchanged same round',
  counter:'real Guardian forces ordinary BATTLE_Attack ContFlg false',
  rangedGuardian:false,
  saveSchema:30
}));
