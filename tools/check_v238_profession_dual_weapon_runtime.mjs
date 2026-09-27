import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_profession_skill_runtime.json','utf8'));

function extractFunction(source,name){
  const marker='function '+name+'(';
  const start=source.indexOf(marker);
  assert.ok(start>=0,'missing function '+name);
  const ps=source.indexOf('(',start);let pd=0,pe=-1,q=null,esc=false,lc=false,bc=false;
  for(let i=ps;i<source.length;i++){const c=source[i],n=source[i+1];if(lc){if(c==='\n')lc=false;continue}if(bc){if(c==='*'&&n==='/'){bc=false;i++}continue}if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}if(c==="'"||c==='"'||c==='\x60'){q=c;continue}if(c==='/'&&n==='/'){lc=true;i++;continue}if(c==='/'&&n==='*'){bc=true;i++;continue}if(c==='(')pd++;else if(c===')'&&--pd===0){pe=i;break}}
  assert.ok(pe>=0);const bs=source.indexOf('{',pe);let d=0;q=null;esc=false;lc=false;bc=false;
  for(let i=bs;i<source.length;i++){const c=source[i],n=source[i+1];if(lc){if(c==='\n')lc=false;continue}if(bc){if(c==='*'&&n==='/'){bc=false;i++}continue}if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}if(c==="'"||c==='"'||c==='\x60'){q=c;continue}if(c==='/'&&n==='/'){lc=true;i++;continue}if(c==='/'&&n==='*'){bc=true;i++;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return source.slice(start,i+1)}
  assert.fail('unterminated '+name);
}

const row=runtime.bySkillId['43'];
assert.ok(row);assert.equal(row.name,'二刀流');assert.equal(row.func,'PROFESSION_DUAL_WEAPON');assert.equal(row.costMp,0);assert.equal(row.kind,2);assert.equal(row.commonCommand,undefined);

const ctx={Math,Number,String,Object,Array,PROFESSION_SKILL_SLOT_COUNT:26,PLAYER_EQUIP_SLOT_COUNT:9,PLAYER_ARM_SLOT:2,PLAYER_SHIELD_SLOT:6,PLAYER_HEAD_SLOT:0,PLAYER_BODY_SLOT:1,PLAYER_DECORATION1_SLOT:3,PLAYER_BELT_SLOT:5,PLAYER_SHOES_SLOT:7,PLAYER_GLOVE_SLOT:8,n:v=>Number.isFinite(Number(v))?Number(v):0,sourceProfessionSkillTemplate:id=>runtime.bySkillId[String(Math.trunc(Number(id)))]||null,sourcePlayerProfessionSkillAt:(slot,target)=>{const e=target?.professionSkills?.[slot];return e?{slot,skillId:Number(e.skillId),rawLevel:Number(e.rawLevel)}:null},sourcePlayerProfessionSkillDisplayLevel:e=>Math.trunc(Number(e?.rawLevel||0)/100),sourcePlayerItemSlots:t=>t?.slots||Array(24).fill(null),sourcePlayerEquipTemplateForExisting:(idx,t)=>t?.templates?.[String(idx)]||null,sourceRuntimeSlotFromTarget:(t,idx)=>t?.existing?.[String(idx)]||null,sourceItemRuntimeResolvedDataInt:(existing,field)=>{if(!existing)return null;return Object.prototype.hasOwnProperty.call(existing.data||{},field)?Number(existing.data[field]):0}};
vm.createContext(ctx);
for(const name of ['sourceProfessionAttackSkillTier','sourceProfessionDualWeaponEntries','sourceProfessionDualWeaponLearned','sourceProfessionDualWeaponScaledItemValue','sourcePlayerEquipPlace','sourcePlayerEquipmentModifiers','sourceProfessionBattleFunctionSupported'])vm.runInContext(extractFunction(game,name),ctx);

const blank=()=>Array(24).fill(null);const target={slots:blank(),templates:{},professionSkills:Array(26).fill(null)};target.professionSkills[0]={skillId:43,rawLevel:6000};target.professionClass=3;
assert.equal(ctx.sourceProfessionDualWeaponEntries(target)[0].tier,5);assert.equal(ctx.sourceProfessionDualWeaponEntries(target)[0].rate,35);assert.equal(ctx.sourceProfessionDualWeaponLearned(target),true);
assert.equal(ctx.sourcePlayerEquipPlace({type:1},target.slots,target),2);target.slots[2]=101;target.templates['101']={type:1};assert.equal(ctx.sourcePlayerEquipPlace({type:2},target.slots,target),6);target.slots[6]=102;target.templates['102']={type:2};assert.equal(ctx.sourcePlayerEquipPlace({type:3},target.slots,target),2);target.slots[6]=null;target.templates['101']={type:4};assert.equal(ctx.sourcePlayerEquipPlace({type:1},target.slots,target),2);target.slots[6]=102;assert.equal(ctx.sourcePlayerEquipPlace({type:4},target.slots,target),-1);assert.equal(ctx.sourcePlayerEquipPlace({type:25},target.slots,target),-1);
target.professionSkills=Array(26).fill(null);target.templates['101']={type:1};target.slots[6]=null;assert.equal(ctx.sourcePlayerEquipPlace({type:2},target.slots,target),2);

function equipTarget(skills,leftType=2){const t={slots:blank(),templates:{'101':{type:1,itemId:1001},'102':{type:leftType,itemId:1002}},existing:{'101':{data:{ITEM_MODIFYATTACK:50}},'102':{data:{ITEM_MODIFYATTACK:101,ITEM_MODIFYDEFENCE:-11,ITEM_MODIFYHP:10,ITEM_CRITICAL:9,ITEM_POISON:7,ITEM_MODIFYATTRIB:3,ITEM_MODIFYATTRIBVALUE:20}}},professionSkills:Array(26).fill(null)};t.slots[2]=101;t.slots[6]=102;for(let i=0;i<skills.length;i++)t.professionSkills[i]=skills[i];return t}
let e=equipTarget([{skillId:43,rawLevel:6000}]);let mods=ctx.sourcePlayerEquipmentModifiers(e);assert.equal(mods.attack,85);assert.equal(mods.defense,-3);assert.equal(mods.hp,3);assert.equal(mods.criticalWork,3);assert.equal(mods.statusResist.poison,2);assert.equal(mods.attribAccum[2],20);
e=equipTarget([],2);mods=ctx.sourcePlayerEquipmentModifiers(e);assert.equal(mods.attack,50);assert.equal(mods.attribAccum[2],20);
e=equipTarget([{skillId:43,rawLevel:6000}],25);mods=ctx.sourcePlayerEquipmentModifiers(e);assert.equal(mods.attack,151);assert.equal(mods.defense,-11);assert.equal(mods.hp,10);
e=equipTarget([{skillId:43,rawLevel:6000},{skillId:43,rawLevel:10000}],2);mods=ctx.sourcePlayerEquipmentModifiers(e);assert.equal(mods.attack,135);
assert.equal(ctx.sourceProfessionBattleFunctionSupported('PROFESSION_DUAL_WEAPON'),false);

const move=extractFunction(game,'sourcePlayerMoveItem');assert.ok(move.includes('const sourceItemIndex=Math.trunc(Number(slots[from]))'));assert.ok(move.includes('sourcePlayerEquipPlace(sourceTemplate,sourcePlayerItemSlots(target),target)'));assert.ok(move.includes('if(moved.postMoveEquipPlace===PLAYER_ARM_SLOT)'));assert.ok(!move.includes('from===PLAYER_ARM_SLOT||to===PLAYER_ARM_SLOT'));assert.ok(move.indexOf("sourceProfessionPlayerAvoidRefresh(target,'weapon-change')")<move.indexOf("sourceProfessionPlayerWeaponFocusRefresh(target,'weapon-change')"));
assert.match(html,/PLAYABLE CORE V2\.39/);assert.match(html,/V2\.39 live：[^<]*二刀流/);assert.match(game,/schemaVersion:30/);assert.match(game,/s\.schemaVersion=30/);
console.log(JSON.stringify({pass:true,version:'V2.38',focus:'Skill 43 PROFESSION_DUAL_WEAPON equip-place + scaled left-hand itemEffect + post-move Status_init gate',skillId:43,rateFormula:'tier*3+20',saveSchema:30}));
