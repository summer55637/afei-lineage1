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

const expected=[
  [26,'枪',1,3],[27,'斧',1,1],[28,'棍',1,2],
  [29,'弓',3,4],[30,'镖',3,17],[31,'石',3,19],[32,'投',3,18]
];
for(const [id,marker,professionClass] of expected){
  const row=runtime.bySkillId[String(id)];
  assert.ok(row,'missing Skill '+id);
  assert.equal(row.func,'PROFESSION_WEAPON_FOCUS');
  assert.equal(row.option,marker);
  assert.equal(row.professionClass,professionClass);
  assert.equal(row.costMp,0);
  assert.equal(row.useFlag,1);
  assert.equal(row.kind,2);
}
assert.deepEqual(expected.map(x=>x[3]),[3,1,2,4,17,19,18]);

const markerFn=extractFunction(game,'sourceProfessionWeaponFocusMarker');
const typeFn=extractFunction(game,'sourceProfessionPlayerWeaponType');
const refreshFn=extractFunction(game,'sourceProfessionPlayerWeaponFocusRefresh');
const applyFn=extractFunction(game,'sourceProfessionPlayerWeaponFocusApply');
const tierFn=extractFunction(game,'sourceProfessionAttackSkillTier');

const rows={};
for(const [id] of expected)rows[id]=runtime.bySkillId[String(id)];

let skills=[
  null,
  {skillId:27,rawLevel:9100},
  null,
  {skillId:26,rawLevel:7100},
  null,null,null,null,null
];
let armType=3;
let strPower=6;
const target={professionClass:1};
const ctx={
  Math,Number,String,Object,Array,
  PROFESSION_CLASS_NONE:0,
  PROFESSION_SKILL_SLOT_COUNT:9,
  PLAYER_ARM_SLOT:0,
  state:target,
  battlePlayerWeaponFocusWork:null,
  battlePlayerMySkillStrPower:strPower,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourcePlayerItemSlots:()=>[101],
  sourcePlayerEquipTemplateForExisting:()=>({type:armType}),
  sourcePlayerProfessionSkillAt:i=>skills[i]?{slot:i,...skills[i]}:null,
  sourceProfessionSkillTemplate:id=>rows[id]||null,
  sourcePlayerProfessionSkillDisplayLevel:e=>Math.trunc(Number(e.rawLevel)/100)
};
vm.createContext(ctx);
for(const fn of [markerFn,typeFn,tierFn,refreshFn,applyFn])vm.runInContext(fn,ctx);

assert.equal(ctx.sourceProfessionWeaponFocusMarker(1),'斧');
assert.equal(ctx.sourceProfessionWeaponFocusMarker(2),'棍');
assert.equal(ctx.sourceProfessionWeaponFocusMarker(3),'枪');
assert.equal(ctx.sourceProfessionWeaponFocusMarker(4),'弓');
assert.equal(ctx.sourceProfessionWeaponFocusMarker(17),'镖');
assert.equal(ctx.sourceProfessionWeaponFocusMarker(18),'投');
assert.equal(ctx.sourceProfessionWeaponFocusMarker(19),'石');

// BATTLE_ProfessionStatus_init uses continue on sparse slots: Skill 26 at slot 3 is still found.
let focus=ctx.sourceProfessionPlayerWeaponFocusRefresh(target,'fixture');
assert.equal(focus.active,true);
assert.equal(focus.skillId,26);
assert.equal(focus.slot,3);
assert.equal(focus.tier,7);
assert.equal(focus.oldStrPower,6);
assert.equal(focus.mod,22); // (7-5)*3 + 10 + 6

let applied=ctx.sourceProfessionPlayerWeaponFocusApply(101);
assert.equal(applied.before,101);
assert.equal(applied.mod,22);
assert.equal(applied.after,123); // C int truncation of 101*122/100

// Source has only an upper clamp. Stale MYSKILLSTRPOWER can drive the snapshot to 25.
ctx.battlePlayerMySkillStrPower=20;
focus=ctx.sourceProfessionPlayerWeaponFocusRefresh(target,'fixture-cap');
assert.equal(focus.mod,25);

// Wrong profession class does not steal another profession's Weapon Focus.
target.professionClass=3;
armType=3;
focus=ctx.sourceProfessionPlayerWeaponFocusRefresh(target,'wrong-class');
assert.equal(focus.active,false);
assert.equal(focus.reason,'no-matching-skill');

// Hunter bow path.
skills=[null,{skillId:29,rawLevel:10000},null,null,null,null,null,null,null];
armType=4;
ctx.battlePlayerMySkillStrPower=0;
focus=ctx.sourceProfessionPlayerWeaponFocusRefresh(target,'hunter-bow');
assert.equal(focus.skillId,29);
assert.equal(focus.tier,10);
assert.equal(focus.mod,25);

// Unsupported/fist weapon creates no focus Work.
armType=0;
focus=ctx.sourceProfessionPlayerWeaponFocusRefresh(target,'fist');
assert.equal(focus.active,false);
assert.equal(focus.reason,'weapon-type');

// PROFESSION_weapon_focus() is passive: it must remain absent from active battle executor support.
const supported=extractFunction(game,'sourceProfessionBattleFunctionSupported');
assert.equal(supported.includes("functionName==='PROFESSION_WEAPON_FOCUS'"),false);

// Raw MYSKILLSTRPOWER Work survives turn expiry.
const statSet=extractFunction(game,'sourceProfessionPlayerStatSet');
const statSeq=extractFunction(game,'sourceProfessionPlayerStatStatusSeq');
const sctx={
  Math,Number,String,Object,Array,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  state:{},
  battlePlayerProfessionStatStates:{str:null,tgh:null,dex:null},
  battlePlayerMySkillStrPower:0,
  battleMagicPetStates:new Map(),
  sourceMagicPetState:()=>null,
  addLog:()=>{}
};
vm.createContext(sctx);
vm.runInContext(statSet,sctx);
vm.runInContext(statSeq,sctx);
let set=sctx.sourceProfessionPlayerStatSet('str',1,34);
assert.equal(set.ok,true);
assert.equal(sctx.battlePlayerMySkillStrPower,34);
let expired=sctx.sourceProfessionPlayerStatStatusSeq({});
assert.equal(expired[0].expired,true);
assert.equal(sctx.battlePlayerProfessionStatStates.str,null);
assert.equal(sctx.battlePlayerMySkillStrPower,34);

// SetMagicPet writes the same raw STR power field and expiry does not clear it.
const magicApply=extractFunction(game,'sourceMagicPetApply');
assert.ok(magicApply.includes("desc?.kind==='player'&&normalizedStat==='STR'"));
assert.ok(magicApply.includes('battlePlayerMySkillStrPower=normalizedPower'));
const magicSeq=extractFunction(game,'sourceMagicPetStatusSeq');
assert.equal(magicSeq.includes('battlePlayerMySkillStrPower=0'),false);

// Battle entry rebuilds Focus only after reset has cleared raw STR power.
const entry=extractFunction(game,'sourceInitPlayerSideEntrySnapshot');
assert.ok(entry.includes("sourceProfessionPlayerWeaponFocusRefresh(state,'battle-entry')"));
const reset=extractFunction(game,'resetBattleStatuses');
assert.ok(reset.includes('battlePlayerWeaponFocusWork=null'));
assert.ok(reset.includes('battlePlayerMySkillStrPower=0'));
assert.ok(reset.includes('battlePlayerFixedAttackWork=null'));

// PreCommand order: compliance -> profession stat snapshot -> MagicPet round snapshot
// -> FIXSTR Weapon Focus snapshot -> Player view.
const order=extractFunction(game,'normalBattleOrder');
const complianceAt=order.indexOf('playerComplianceParameter(state)');
const statAt=order.indexOf('sourceProfessionPlayerStatPreCommandCompliance(state)');
const magicAt=order.indexOf('sourcePrepareMagicPetRoundStates()');
const fixedAt=order.indexOf('sourceProfessionPlayerFixedAttackCompliance(state)');
const viewAt=order.indexOf('const player=playerBattleView()');
assert.ok(complianceAt>=0&&statAt>complianceAt&&magicAt>statAt&&fixedAt>magicAt&&viewAt>fixedAt);

// Fixed attack bridge applies MYSKILL stat result before Weapon Focus.
const fixedBridge=extractFunction(game,'sourceProfessionPlayerFixedAttackCompliance');
assert.ok(fixedBridge.indexOf('sourceProfessionPlayerStatRoundAdjusted(')
  <fixedBridge.indexOf('sourceProfessionPlayerWeaponFocusApply(professionStats.attack)'));

// Player view uses the frozen FIXSTR snapshot, then WEAKEN.
const view=extractFunction(game,'playerBattleView');
assert.ok(view.includes('battlePlayerFixedAttackWork==null'));
assert.ok(view.includes('sourceProfessionPlayerWeaponFocusApply(professionStats.attack).after'));
assert.ok(view.includes('Math.trunc(fixedAttackBase*.8)'));

// Skill 24 FIXSTR now consumes the effective FIXSTR bridge, not equipment-only compliance.
const chainFix=extractFunction(game,'sourceProfessionChainAtk2FixedStr');
assert.ok(chainFix.includes('sourceProfessionPlayerEffectiveFixedAttack(target)'));
assert.equal(chainFix.includes('playerEquipCompliance'),false);

// Mid-battle equipment move preserves fixed source ordering:
// compliance and current FIX snapshot first, then Weapon Focus Status_init refresh.
const move=extractFunction(game,'sourcePlayerMoveItem');
const moveCompliance=move.indexOf('playerComplianceParameter(target)');
const moveStat=move.indexOf('sourceProfessionPlayerStatPreCommandCompliance(target)');
const moveFixed=move.indexOf('sourceProfessionPlayerFixedAttackCompliance(target)');
const moveResetAttack=move.indexOf('battlePlayerAttackWork=null');
const moveRefresh=move.indexOf("sourceProfessionPlayerWeaponFocusRefresh(target,'weapon-change')");
assert.ok(moveCompliance>=0&&moveStat>moveCompliance&&moveFixed>moveStat&&moveResetAttack>moveFixed&&moveRefresh>moveResetAttack);
assert.ok(move.includes('from===PLAYER_ARM_SLOT||to===PLAYER_ARM_SLOT'));

// Proficiency helper still uses weapon marker; growing skill raw level alone does not mutate Work.
const prof=extractFunction(game,'sourceProfessionWeaponFocusProficiency');
assert.ok(prof.includes('sourceProfessionWeaponFocusMarker(weaponType)'));
assert.equal(prof.includes('battlePlayerWeaponFocusWork'),false);

assert.match(html,/PLAYABLE CORE V2\.37/);
assert.match(html,/V2\.37 live：[^<]*武器專精 26～32/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.36',
  focus:'PROFESSION_WEAPON_FOCUS fixed WORK_WEAPON / FIXSTR lifecycle',
  skillIds:[26,27,28,29,30,31,32],
  weaponTypes:{axe:1,club:2,spear:3,bow:4,boomerang:17,boundthrow:18,breakthrow:19},
  formula:'FIXSTR=int((FIXSTR + MYSKILLSTR add) * (100 + WORKMOD_WEAPON) / 100), then WEAKEN',
  sourceBugs:[
    'MYSKILLSTRPOWER remains stale after STR turn counter expires',
    'critical proficiency gain does not refresh current Weapon Focus Work',
    'mid-battle weapon change compliance uses old focus snapshot before new Status_init refresh'
  ],
  saveSchema:30
}));
