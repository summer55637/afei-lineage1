'use strict';

const DATA_URL='data/generated/stoneage_general_lv1_pets.json';
const ENCOUNTER_RUNTIME_URL='data/generated/stoneage_general_encounter_runtime.json';
const ENEMY_AI_URL='data/generated/stoneage_enemy_ai.json';
const PETSKILL_RUNTIME_URL='data/generated/stoneage_petskill_runtime.json';
const PET_MODAI_URL='data/generated/stoneage_pet_modai.json';
const ATTACK_MAGIC_RUNTIME_URL='data/generated/stoneage_attack_magic_runtime.json';
const ITEM_MAGIC_RUNTIME_URL='data/generated/stoneage_item_magic_runtime.json';
const ITEM_RELIFE_RUNTIME_URL='data/generated/stoneage_item_relife_runtime.json';
const ITEM_MAKE_RUNTIME_URL='data/generated/stoneage_item_make_runtime.json';
const GMQUE_TROPHY_RUNTIME_URL='data/generated/stoneage_gmque_trophy_runtime.json';
const ENEMY_WEAPON_RUNTIME_URL='data/generated/stoneage_enemy_weapon_runtime.json';
const CONDITION_ITEM_URL='data/generated/capture_items.json';
const ZOO_QUEST_URL='data/generated/zoo_quest.json';
const SAVE_KEY='afei_stoneage_idle_v01';
const TEAM_SIZE=5;
const PLAYER_EQUIP_SLOT_COUNT=9;
const PLAYER_BACKPACK_SLOT_COUNT=15;
const PLAYER_BACKPACK_START=PLAYER_EQUIP_SLOT_COUNT;
const PLAYER_ITEM_SLOT_COUNT=PLAYER_EQUIP_SLOT_COUNT+PLAYER_BACKPACK_SLOT_COUNT;
const IDLE_WALK_STEPS_PER_TICK=3; // 放置版轉譯參數：900ms tick 內模擬 3 次原版走路遇敵檢查；不是服務端原始時間常數
const EVENT81_AIR_ROUTES=Object.freeze([
  [[5579,18,11],[5579,18,15],[5579,15,18],[5579,15,23],[5540,528,634],[5540,559,646],[5561,23,113],[5561,57,113],[5581,1,1],[5581,100,100],[5561,57,113],[5561,180,86],[7000,88,25],[7000,90,58],[7000,113,57],[7000,112,46],[7000,103,46]],
  [[5579,14,11],[5579,14,15],[5579,15,18],[5579,15,23],[5540,528,634],[5540,559,646],[5561,23,113],[5561,57,113],[5581,1,1],[5581,100,100],[5561,57,113],[5561,180,86],[7000,88,25],[7000,90,58],[7000,113,57],[7000,112,49],[7000,103,49]],
  [[5579,10,11],[5579,10,15],[5579,15,18],[5579,15,23],[5540,528,634],[5540,559,646],[5561,23,113],[5561,57,113],[5581,1,1],[5581,100,100],[5561,57,113],[5561,180,86],[7000,88,25],[7000,90,58],[7000,113,57],[7000,112,49],[7000,109,52],[7000,103,52]]
]);
const EVENT81_MAZE_WARPS=Object.freeze({
  24:[
    {floor:5576,x:28,y:88},{floor:5576,x:24,y:86},{floor:5576,x:24,y:87},{floor:5576,x:28,y:87},{floor:5576,x:24,y:88},
    {floor:5576,x:24,y:89},{floor:5576,x:24,y:89},{floor:5576,x:24,y:86},{floor:5576,x:24,y:86},{floor:5576,x:24,y:87}
  ],
  28:[
    {floor:5576,x:24,y:89},{floor:5576,x:28,y:88},{floor:5576,x:28,y:88},{floor:5576,x:28,y:89},{floor:5576,x:32,y:88},
    {floor:5576,x:28,y:86},{floor:5576,x:28,y:87},{floor:5576,x:32,y:87},{floor:5576,x:28,y:88},{floor:5576,x:28,y:89},{floor:5576,x:24,y:89}
  ],
  32:[
    {floor:5576,x:28,y:88},{floor:5576,x:32,y:88},{floor:5576,x:32,y:86},{floor:5576,x:32,y:88},{floor:5576,x:32,y:89},
    {floor:5576,x:32,y:86},{floor:5576,x:32,y:87},{floor:5576,x:32,y:88},{floor:5576,x:32,y:89},{floor:5582,x:33,y:87},{floor:5576,x:28,y:88}
  ]
});
const MAREFIA_MEMORY_ROUTE=Object.freeze([
  {level:10,floor:1000,nextCap:15,clue:'薩姆吉爾村的大石像'},
  {level:15,floor:1400,nextCap:20,clue:'西北方沙漠中的村落'},
  {level:20,floor:1200,nextCap:25,clue:'黃昏可看見繁星的山頂'},
  {level:25,floor:5542,nextCap:30,clue:'波拉島胡椒林與加美訓練場遺跡'},
  {level:30,floor:4000,nextCap:35,clue:'加魯卡水上漁村的燈塔'},
  {level:35,floor:20301,nextCap:40,clue:'棲息大量加美的洞窟'},
  {level:40,floor:3300,nextCap:45,clue:'尼斯大陸矮小人族的聚落'},
  {level:45,floor:21201,nextCap:50,clue:'加魯卡南方可在海上行走之地'},
  {level:50,floor:20105,nextCap:55,clue:'山崖密林與血紅大花'},
  {level:55,floor:6000,nextCap:60,clue:'村旁有日夜雙入口的巨藤洞窟'},
  {level:60,floor:31901,nextCap:65,clue:'盛產好石頭、精靈曾聚居之地'},
  {level:65,floor:30703,nextCap:70,clue:'岩石高原北方的花之洞窟',rewardItem:19688,rewardCount:3},
  {level:70,floor:31201,nextCap:75,clue:'精靈王祭壇附近的沒落礦坑'},
  {level:75,floor:40,nextCap:79,clue:'沙姆海底通路的地下水池'}
]);
let db=null, encounterRuntime=null, enemyAiDb=null, petSkillDb=null, petModAiDb=null, attackMagicDb=null, itemMagicDb=null, itemRelifeDb=null, itemMakeDb=null, gmqueDb=null, enemyWeaponDb=null, zooQuest=null, maps=[], conditionItems=[], sourceCatalog=new Map(), dynamicGroupCatalog=new Map(), encounterCatalog=new Map(), state=null, enemy=null, timer=null, playerCreationStatsDraft={vital:0,str:0,tgh:0,dex:0}, playerElementDraft={earth:0,water:0,fire:0,wind:0}, battleStatuses=new Map(), battlePetOutIds=new Set(), battlePetDeathProcessedIds=new Set(), battlePetFixAiSnapshots=new Map(), battlePlayerDeathProcessed=false, battlePlayerDeathResult=null, battleOuterAddProfitPending=false, battlePetChargeStates=new Map(), battlePetEarthRoundStates=new Map(), battlePetHiddenIds=new Set(), battlePetGuardIds=new Set(), battlePetPowerMods=new Map(), battlePetNoGuardStates=new Map(), battlePlayerGuardianPetId=null, battleReverseKeys=new Set(), battleElementWork=new Map(), battleDrunkReleaseBoostKeys=new Set(), battleWeakenRoundKeys=new Set(), battleUltimateWork=new Map(), battleUltimateFlags=new Map(), battleSarsStates=new Map(), battleSarsCarrierKeys=new Set(), battleShootSleepStates=new Map(), battleGetItemPool=[], battleFieldState={attr:'none',power:0,turns:0};
let sourceEnemyUnitSerial=0;

const $=s=>document.querySelector(s);
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const uid=()=>('p'+Date.now().toString(36)+Math.random().toString(36).slice(2,8));

function freshItemRuntime(){return {itemnum:25000,sindex:1,slots:{}}}
function sourceItemTemplateExists(itemId){
  const id=Math.trunc(Number(itemId));
  return Number.isFinite(id)&&!!itemMagicDb?.byItemId&&Object.prototype.hasOwnProperty.call(itemMagicDb.byItemId,String(id));
}
function sourceItemTemplateMagicUseMp(itemId){
  if(!sourceItemTemplateExists(itemId))return null;
  const value=Number(itemMagicDb.byItemId[String(Math.trunc(Number(itemId)))]);
  return Number.isFinite(value)?Math.trunc(value):null;
}
function sourceItemRelifeTemplate(itemId){
  const id=Math.trunc(Number(itemId));
  if(!Number.isFinite(id)||!itemRelifeDb?.byItemId)return null;
  return itemRelifeDb.byItemId[String(id)]||null;
}
function freshPlayerItemSlots(){return Array(PLAYER_ITEM_SLOT_COUNT).fill(null)}
function sourceRuntimeSlotFromTarget(target,index){
  const idx=Math.trunc(Number(index));
  if(!target?.itemRuntime||!Number.isFinite(idx)||idx<=0||idx>=25000)return null;
  const slot=target.itemRuntime.slots?.[String(idx)];
  return slot?.use===true?slot:null;
}
function sourcePlayerItemSlots(target=state){
  if(!target)return freshPlayerItemSlots();
  if(!Array.isArray(target.playerItemSlots)||target.playerItemSlots.length!==PLAYER_ITEM_SLOT_COUNT){
    target.playerItemSlots=freshPlayerItemSlots();
  }
  return target.playerItemSlots;
}
function sourcePlayerEquipTemplateForExisting(itemIndex,target=state){
  const existing=sourceRuntimeSlotFromTarget(target,itemIndex);
  if(!existing||existing.owner!=='player')return null;
  return sourceItemRelifeTemplate(existing.itemId);
}
function sourcePlayerEquipSlotAllowsTemplate(slotIndex,template){
  const to=Math.trunc(Number(slotIndex));
  const ep=Math.trunc(Number(template?.equipPlace));
  if(!Number.isFinite(to)||!Number.isFinite(ep))return false;
  // fixed CHAR_moveItemFromItemBoxToEquip special-cases CHAR_DECORATION1:
  // an item whose canonical place is slot 3 may be equipped in slot 3 or slot 4.
  if(ep===3)return to===3||to===4;
  return to===ep;
}
function sourcePlayerDecorationTypeConflict(slotIndex,template,slots=sourcePlayerItemSlots(),target=state){
  const to=Math.trunc(Number(slotIndex));
  if(Math.trunc(Number(template?.equipPlace))!==3||(to!==3&&to!==4))return false;
  const other=to===3?4:3;
  if(slots?.[other]==null)return false;
  const otherIndex=Number(slots[other]);
  if(!Number.isFinite(otherIndex))return false;
  const otherTemplate=sourcePlayerEquipTemplateForExisting(otherIndex,target);
  return !!otherTemplate&&Math.trunc(n(otherTemplate.type))===Math.trunc(n(template.type));
}
function normalizePlayerItemSlots(rawSlots,itemRuntime){
  const out=freshPlayerItemSlots();
  if(!Array.isArray(rawSlots)||!itemRuntime?.slots)return out;
  const seen=new Set();
  for(let i=0;i<PLAYER_ITEM_SLOT_COUNT;i++){
    const idx=Math.trunc(Number(rawSlots[i]));
    if(!Number.isFinite(idx)||idx<=0||seen.has(idx))continue;
    const existing=itemRuntime.slots[String(idx)];
    if(existing?.use!==true||existing.owner!=='player')continue;
    if(i<PLAYER_EQUIP_SLOT_COUNT){
      const template=sourceItemRelifeTemplate(existing.itemId);
      if(!template||!sourcePlayerEquipSlotAllowsTemplate(i,template))continue;
      if(sourcePlayerDecorationTypeConflict(i,template,out,{itemRuntime,playerItemSlots:out}))continue;
    }
    out[i]=idx;seen.add(idx);
  }
  return out;
}
function sourcePlayerFixedEquipModifier(template,key){
  const pair=template?.[key];
  if(!Array.isArray(pair)||pair.length<2)return 0;
  const a=Number(pair[0]),b=Number(pair[1]);
  // Current source-backed player-equipment modifier pairs are min=max, so the resulting
  // value is deterministic. V1.72 still consumes ITEM_makeItem's 66 RNG calls at creation;
  // this helper only avoids inventing a variable rolled field that the runtime does not store.
  if(!Number.isFinite(a)||!Number.isFinite(b)||a!==b)return null;
  return Math.trunc(a);
}
function sourcePlayerEquipmentModifiers(target=state){
  const result={attack:0,defense:0,quick:0,hp:0,mp:0,luck:0,charm:0,avoid:0,items:[],complete:true};
  const slots=sourcePlayerItemSlots(target);
  for(let i=0;i<PLAYER_EQUIP_SLOT_COUNT;i++){
    if(slots[i]==null)continue;
    const itemIndex=Number(slots[i]);
    if(!Number.isFinite(itemIndex))continue;
    const template=sourcePlayerEquipTemplateForExisting(itemIndex,target);
    if(!template)continue;
    const values={};
    for(const [outKey,templateKey] of [
      ['attack','modifyAttack'],['defense','modifyDefense'],['quick','modifyQuick'],
      ['hp','modifyHp'],['mp','modifyMp'],['luck','modifyLuck'],['charm','modifyCharm'],['avoid','modifyAvoid']
    ]){
      const value=sourcePlayerFixedEquipModifier(template,templateKey);
      if(value==null){result.complete=false;continue;}
      values[outKey]=value;result[outKey]+=value;
    }
    result.items.push({slot:i,itemIndex,itemId:Math.trunc(n(template.itemId)),name:template.name||null,values});
  }
  return result;
}
function sourcePlayerEquipRequirements(template,target=state){
  if(!template||!target)return {ok:false,reason:'template'};
  const trans=Math.max(0,Math.trunc(n(target.transmigration)));
  const level=Math.max(1,Math.trunc(n(target.level)||1));
  if(trans<=0&&Math.trunc(n(template.level))>level)return {ok:false,reason:'level'};
  const p=target.playerStats||{};
  if(Math.trunc(n(p.str))<Math.trunc(n(template.needStr)))return {ok:false,reason:'str'};
  if(Math.trunc(n(p.dex))<Math.trunc(n(template.needDex)))return {ok:false,reason:'dex'};
  if(trans<Math.trunc(n(template.needTrans)))return {ok:false,reason:'transmigration'};
  if(Math.trunc(n(template.needProfession))!==0)return {ok:false,reason:'profession-unported'};
  if(String(template.attachFunc||'')!==''||String(template.detachFunc||'')!=='')return {ok:false,reason:'callback-unported'};
  return {ok:true};
}
function sourcePlayerFindEmptyBackpackSlot(target=state){
  const slots=sourcePlayerItemSlots(target);
  for(let i=PLAYER_BACKPACK_START;i<PLAYER_ITEM_SLOT_COUNT;i++){
    if(slots[i]==null)return i;
  }
  return -1;
}
function sourcePlayerAddSpecificExistingItem(itemIndex,{target=state,source=null,incrementInventory=true}={}){
  const idx=Math.trunc(Number(itemIndex));
  const existing=sourceRuntimeSlotFromTarget(target,idx);
  if(!existing)return -1;

  // fixed CHAR_addItemSpecificItemIndex(): first empty ItemBox slot only; no pile/merge here.
  const emptyindex=sourcePlayerFindEmptyBackpackSlot(target);
  if(emptyindex<0)return PLAYER_ITEM_SLOT_COUNT;

  const slots=sourcePlayerItemSlots(target);
  slots[emptyindex]=idx;
  existing.owner='player';
  existing.enemySlot=null;
  if(source!==null)existing.source=source;

  if(incrementInventory){
    const itemId=Number(existing.itemId);
    if(Number.isFinite(itemId)){
      const key=String(Math.trunc(itemId));
      target.inventory=target.inventory&&typeof target.inventory==='object'?target.inventory:{};
      target.inventory[key]=Math.max(0,Math.trunc(n(target.inventory[key])))+1;
    }
  }
  return emptyindex;
}
function sourcePlayerRegisterExistingInBackpack(itemIndex,target=state){
  const idx=Math.trunc(Number(itemIndex));
  const existing=sourceRuntimeSlotFromTarget(target,idx);
  if(!existing||existing.owner!=='player')return -1;
  const slots=sourcePlayerItemSlots(target);
  const present=slots.findIndex(v=>v!=null&&Number(v)===idx);
  if(present>=0)return present;
  // Registration of an already-owned legacy/runtime item must not double aggregate inventory.
  return sourcePlayerAddSpecificExistingItem(idx,{target,source:existing.source,incrementInventory:false});
}
function sourcePlayerMoveBackpackToEquip(fromindex,toindex,target=state){
  const slots=sourcePlayerItemSlots(target);
  if(slots[fromindex]==null)return {ok:false,reason:'missing-source'};
  const fromid=Math.trunc(Number(slots[fromindex]));
  if(!Number.isFinite(fromid))return {ok:false,reason:'missing-source'};
  const template=sourcePlayerEquipTemplateForExisting(fromid,target);
  if(!template)return {ok:false,reason:'unsupported-template'};
  const req=sourcePlayerEquipRequirements(template,target);
  if(!req.ok)return req;
  if(!sourcePlayerEquipSlotAllowsTemplate(toindex,template))return {ok:false,reason:'wrong-equip-place'};
  if(sourcePlayerDecorationTypeConflict(toindex,template,slots,target)){
    const occupied=slots[toindex]!=null&&Number.isFinite(Number(slots[toindex]));
    return {ok:false,reason:occupied?'same-type-exchange':'same-type'};
  }
  const toid=slots[toindex]==null?null:Math.trunc(Number(slots[toindex]));
  slots[toindex]=fromid;
  slots[fromindex]=Number.isFinite(toid)?toid:null;
  return {ok:true,kind:'item-to-equip',fromindex,toindex,itemIndex:fromid,replacedItemIndex:Number.isFinite(toid)?toid:null};
}
function sourcePlayerMoveEquipToBackpack(fromindex,toindex,target=state){
  const slots=sourcePlayerItemSlots(target);
  if(slots[fromindex]==null)return {ok:false,reason:'missing-source'};
  const fromid=Math.trunc(Number(slots[fromindex]));
  if(!Number.isFinite(fromid))return {ok:false,reason:'missing-source'};
  const toid=slots[toindex]==null?null:Math.trunc(Number(slots[toindex]));
  if(!Number.isFinite(toid)){
    slots[toindex]=fromid;slots[fromindex]=null;
    return {ok:true,kind:'equip-to-item',fromindex,toindex,itemIndex:fromid,replacedItemIndex:null};
  }
  // fixed CHAR_moveItemFromEquipToItemBox(): occupied destination delegates to
  // CHAR_moveItemFromItemBoxToEquip(index,toindex,fromindex), i.e. a legal reverse equip swap.
  return sourcePlayerMoveBackpackToEquip(toindex,fromindex,target);
}
function sourcePlayerMoveItem(fromindex,toindex,{target=state,isDie=null}={}){
  if(!target)return {ok:false,reason:'state'};
  const from=Math.trunc(Number(fromindex)),to=Math.trunc(Number(toindex));
  if(!Number.isFinite(from)||!Number.isFinite(to)||from<0||to<0||from>=PLAYER_ITEM_SLOT_COUNT||to>=PLAYER_ITEM_SLOT_COUNT)return {ok:false,reason:'range'};
  const die=isDie==null?(target===state&&!!enemy&&battlePlayerDeathProcessed):!!isDie;
  if(die)return {ok:false,reason:'dead'};
  const slots=sourcePlayerItemSlots(target);
  if(slots[from]==null||!Number.isFinite(Number(slots[from])))return {ok:false,reason:'missing-source'};
  if(from===to)return {ok:false,reason:'same-slot'};
  let moved;
  const fromEquip=from<PLAYER_EQUIP_SLOT_COUNT,toEquip=to<PLAYER_EQUIP_SLOT_COUNT;
  if(fromEquip&&toEquip){
    // fixed CHAR_moveEquipItem refuses direct equip-slot movement/exchange.
    moved={ok:false,reason:slots[to]==null?'equip-direct-move':'equip-direct-exchange'};
  }else if(fromEquip){
    moved=sourcePlayerMoveEquipToBackpack(from,to,target);
  }else if(toEquip){
    moved=sourcePlayerMoveBackpackToEquip(from,to,target);
  }else{
    const tmp=slots[to];slots[to]=slots[from];slots[from]=tmp;
    moved={ok:true,kind:'item-to-item',fromindex:from,toindex:to};
  }
  if(moved?.ok&&(fromEquip||toEquip))playerComplianceParameter(target);
  return moved;
}
function sourceEnemyWeaponTemplate(itemId){
  const id=Math.trunc(Number(itemId));
  if(!Number.isFinite(id)||!enemyWeaponDb?.byItemId)return null;
  return enemyWeaponDb.byItemId[String(id)]||null;
}
function sourceEnemyStyleWeaponItemId(style){
  const key=String(Math.trunc(n(style)));
  if(!enemyWeaponDb?.styleItemByStyle||!Object.prototype.hasOwnProperty.call(enemyWeaponDb.styleItemByStyle,key))return null;
  const value=enemyWeaponDb.styleItemByStyle[key];
  return value==null?null:Math.trunc(Number(value));
}
function sourceEnemyDojoWeaponItemId(weapon){
  if(!enemyWeaponDb?.dojoItemByWeapon)return null;
  const key=String(weapon||'none');
  if(!Object.prototype.hasOwnProperty.call(enemyWeaponDb.dojoItemByWeapon,key))return null;
  const value=enemyWeaponDb.dojoItemByWeapon[key];
  return value==null?null:Math.trunc(Number(value));
}
function sourceEnemyWeaponIsThrowType(type){
  const t=Math.trunc(Number(type));
  return Array.isArray(enemyWeaponDb?.throwWeaponTypes)&&enemyWeaponDb.throwWeaponTypes.map(Number).includes(t);
}
function sourceEnemyWeaponCompliance(base,weaponId){
  const template=sourceEnemyWeaponTemplate(weaponId);
  const initial={
    attack:Math.trunc(n(base?.attack)),defense:Math.trunc(n(base?.defense)),quick:Math.trunc(n(base?.quick)),
    maxHp:Math.trunc(n(base?.maxHp)),maxMp:Math.trunc(n(base?.maxMp)),
    weaponId:null,weaponName:null,weaponType:0,weaponCritical:0,throwWeapon:false,attackNumMin:0,attackNumMax:0
  };
  if(!template)return initial;
  const fixed=pair=>Array.isArray(pair)&&Number.isFinite(Number(pair[0]))?Math.trunc(Number(pair[0])):0;
  const attack=Math.max(0,initial.attack+fixed(template.modifyAttack));
  const defense=Math.max(-100,initial.defense+fixed(template.modifyDefense));
  const quick=Math.max(-100,initial.quick+fixed(template.modifyQuick));
  const maxHp=Math.max(0,initial.maxHp+fixed(template.modifyHp));
  const maxMp=clamp(initial.maxMp+fixed(template.modifyMp),0,1000);
  const type=Math.trunc(n(template.type));
  return {
    attack,defense,quick,maxHp,maxMp,
    weaponId:Math.trunc(Number(template.itemId)),weaponName:template.name||null,weaponType:type,
    weaponCritical:fixed(template.critical),throwWeapon:sourceEnemyWeaponIsThrowType(type),
    attackNumMin:Math.trunc(n(template.attackNum?.[0])),attackNumMax:Math.trunc(n(template.attackNum?.[1]))
  };
}
function normalizeItemRuntime(rt){
  const out=freshItemRuntime();
  if(!rt||typeof rt!=='object')return out;
  out.itemnum=25000;
  out.sindex=clamp(Math.trunc(n(rt.sindex)||1),1,out.itemnum-1);
  const slots=rt.slots&&typeof rt.slots==='object'?rt.slots:{};
  for(const [k,v] of Object.entries(slots)){
    const idx=Math.trunc(Number(k));
    if(!Number.isFinite(idx)||idx<=0||idx>=out.itemnum||!v||v.use!==true)continue;
    const itemId=Number.isFinite(Number(v.itemId))?Math.trunc(Number(v.itemId)):null;
    // 原 ITEM_makeItem() 對 ITEM_tbl 不存在的 ID 會失敗；V0.69 曾無法驗證模板，V0.70 起不再保留 phantom existing item。
    if(itemId!=null&&itemMagicDb?.byItemId&&!sourceItemTemplateExists(itemId))continue;
    const sourceMu=sourceItemTemplateMagicUseMp(itemId);
    out.slots[String(idx)]={
      use:true,
      itemId,
      // V0.70：V0.69 已存在的 null slot 可由原 itemset6 第 58 欄安全回填；來源不存在才保留 unknown。
      magicUseMp:v.magicUseMp==null?sourceMu:(Number.isFinite(Number(v.magicUseMp))?Math.trunc(Number(v.magicUseMp)):sourceMu),
      owner:typeof v.owner==='string'?v.owner:null,
      source:typeof v.source==='string'?v.source:null,
      enemySlot:Number.isFinite(Number(v.enemySlot))?Math.trunc(Number(v.enemySlot)):null,
      sourceMakeRngCalls:Number.isFinite(Number(v.sourceMakeRngCalls))?Math.trunc(Number(v.sourceMakeRngCalls)):null,
      leakLevel:Number.isFinite(Number(v.leakLevel))?Math.trunc(Number(v.leakLevel)):null
    };
  }
  return out;
}
function sourceItemRuntimeMagicUseMp(index){
  const rt=state?.itemRuntime;
  const idx=Math.trunc(Number(index));
  if(!rt||!Number.isFinite(idx)||idx<0||idx>=25000)return -1;
  const slot=rt.slots?.[String(idx)];
  if(slot?.use!==true)return -1;
  return slot.magicUseMp==null?null:Math.trunc(Number(slot.magicUseMp));
}
function sourceItemRuntimeSlot(index){
  const idx=Math.trunc(Number(index));
  if(!state?.itemRuntime||!Number.isFinite(idx)||idx<0||idx>=25000)return null;
  const slot=state.itemRuntime.slots?.[String(idx)];
  return slot?.use===true?slot:null;
}
function sourceItemRuntimeSetOwner(index,owner,source=null){
  const slot=sourceItemRuntimeSlot(index);
  if(!slot)return false;
  slot.owner=typeof owner==='string'?owner:null;
  if(source!==null)slot.source=source;
  return true;
}
function sourceConsumeItemMakeRng(){
  const calls=Math.max(0,Math.trunc(n(itemMakeDb?.makeItem?.rngCallsBeforeLeakLevel)||66));
  // fixed ITEM_makeItem() loops every ITEM_DATAINT field. Even randomwidth==0 executes
  // RAND(0,0), whose macro still calls rand() once and returns 0.
  for(let i=0;i<calls;i++)cRand(0,0);
  return calls;
}
function sourceItemRuntimeAlloc(itemId=null,magicUseMp=null,meta={}){
  if(!state)return -1;
  const normalizedItemId=Number.isFinite(Number(itemId))?Math.trunc(Number(itemId)):null;
  const sourceMu=sourceItemTemplateMagicUseMp(normalizedItemId);
  // fixed ITEM_makeItem() rejects an invalid ITEM_tbl before entering its RNG loop.
  if(normalizedItemId!=null&&itemMagicDb?.byItemId&&!Object.prototype.hasOwnProperty.call(itemMagicDb.byItemId,String(normalizedItemId)))return -1;

  // ITEM_makeItemAndRegist order is make first, existing-slot allocation second. Therefore
  // even an exhausted ITEM_item[] array has already consumed all 66 make-item RNG calls.
  const sourceMakeRngCalls=sourceConsumeItemMakeRng();
  const resolvedMu=magicUseMp==null?sourceMu:(Number.isFinite(Number(magicUseMp))?Math.trunc(Number(magicUseMp)):sourceMu);
  state.itemRuntime=normalizeItemRuntime(state.itemRuntime);
  const rt=state.itemRuntime;
  for(let guard=0;guard<rt.itemnum;guard++){
    rt.sindex++;
    if(rt.sindex>=rt.itemnum)rt.sindex=1;
    const key=String(rt.sindex);
    if(rt.slots[key]?.use===true)continue;
    rt.slots[key]={
      use:true,
      itemId:normalizedItemId,
      magicUseMp:resolvedMu,
      owner:typeof meta?.owner==='string'?meta.owner:null,
      source:typeof meta?.source==='string'?meta.source:null,
      enemySlot:Number.isFinite(Number(meta?.enemySlot))?Math.trunc(Number(meta.enemySlot)):null,
      sourceMakeRngCalls,
      leakLevel:1
    };
    return rt.sindex;
  }
  return -1;
}
function sourceItemRuntimeFree(index){
  const idx=Math.trunc(Number(index));
  if(!state?.itemRuntime||!Number.isFinite(idx))return false;
  const key=String(idx);
  if(state.itemRuntime.slots?.[key]?.use!==true)return false;
  // A freed existing item cannot remain referenced by a Player CHAR item slot.
  if(Array.isArray(state.playerItemSlots)){
    for(let i=0;i<state.playerItemSlots.length;i++){
      if(Number(state.playerItemSlots[i])===idx)state.playerItemSlots[i]=null;
    }
  }
  delete state.itemRuntime.slots[key];
  return true;
}
function sourceTrackedPlayerItems(itemId=null){
  const out=[];
  const slots=state?.itemRuntime?.slots||{};
  for(const [k,v] of Object.entries(slots)){
    if(v?.use!==true||v.owner!=='player')continue;
    if(itemId!=null&&Number(v.itemId)!==Number(itemId))continue;
    out.push({index:Number(k),slot:v});
  }
  out.sort((a,b)=>a.index-b.index);
  return out;
}
function giveTrackedItemFromExisting(itemId,itemIndex){
  const slot=sourceItemRuntimeSlot(itemIndex);
  if(!slot)return {ok:false,reason:'missing-existing',itemIndex};
  slot.itemId=Math.trunc(Number(itemId));

  // fixed BATTLE_AddProfit -> CHAR_addItemSpecificItemIndex. If the 15-slot ItemBox is full,
  // the carried existing item is ended instead of becoming an aggregate-only inventory count.
  const ret=sourcePlayerAddSpecificExistingItem(itemIndex,{
    target:state,source:'battle-getitem',incrementInventory:true
  });
  if(ret<PLAYER_BACKPACK_START||ret>=PLAYER_ITEM_SLOT_COUNT){
    sourceItemRuntimeFree(itemIndex);
    return {ok:false,reason:'backpack-full',itemIndex};
  }
  return {ok:true,slotIndex:ret,itemIndex,itemId:Math.trunc(Number(itemId))};
}
function releaseEnemyRuntimeItems(unit){
  if(!unit)return 0;
  let freed=0;
  const indices=new Set();
  for(const drop of unit.enemyDrops||[])indices.add(Math.trunc(Number(drop?.itemIndex)));
  indices.add(Math.trunc(Number(unit.styleItemIndex)));
  indices.add(Math.trunc(Number(unit.weaponItemIndex)));
  for(const idx of indices){
    if(!Number.isFinite(idx)||idx<0)continue;
    const slot=sourceItemRuntimeSlot(idx);
    if(slot&&slot.owner==='enemy:'+unit.id){if(sourceItemRuntimeFree(idx))freed++;}
  }
  return freed;
}
function releaseBattleEnemyRuntimeItems(battleEnemy=enemy){
  if(!battleEnemy)return 0;
  const units=(Array.isArray(battleEnemy.units)&&battleEnemy.units.length)?battleEnemy.units:[battleEnemy];
  return units.reduce((sum,u)=>sum+releaseEnemyRuntimeItems(u),0);
}
function sourceFinalizeOwnedPetsBattleExit(){
  if(!state||!Array.isArray(state.petBox))return {revived:0,petIds:[]};
  let revived=0;
  const petIds=[];
  // fixed _BATTLE_Exit() PLAYER branch scans every owned Pet slot.
  // CHAR_ISDIE has no persistent Web equivalent, so HP<=0 is the source-observable death state.
  // Dead Pets are revived to exactly HP=1 after battle profit processing, not full HP.
  for(const pet of state.petBox){
    if(!pet)continue;
    syncPetBattleHp(pet,true);
    if(n(pet.hp)<=0){
      pet.hp=1;
      revived++;
      petIds.push(pet.id);
    }
  }
  return {revived,petIds};
}
function sourceFinalizePlayerBattleExit(){
  const pets=sourceFinalizeOwnedPetsBattleExit();
  // fixed _BATTLE_Exit under _PETSKILL_BECOMEPIG:
  // PLAYER CHAR_BECOMEPIG > -1 immediately restores the pre-pig appearance/compliance,
  // regardless of how many seconds remain. net.c later turns the outside-battle 0 into -1.
  const pigActive=!!state&&n(state.playerPigUntilMs)>0;
  if(pigActive)state.playerPigUntilMs=0;
  return Object.assign({pigCleared:pigActive},pets);
}
function clearEnemyBattleNoReward(){
  const hadBattle=!!enemy;
  if(enemy)releaseBattleEnemyRuntimeItems(enemy);
  // Full battle teardown is equivalent to the Player's final BATTLE_Exit.
  // Do not call this from mid-battle Pet BATTLE_Exit paths (LostEscape / Ultimate Pet).
  if(hadBattle)sourceFinalizePlayerBattleExit();
  enemy=null;
  resetBattleStatuses();
}
const SOURCE_QUEST_GETPET=Object.freeze({
  718:Object.freeze({
    enemyId:1479,name:'瑪蕾菲雅',animationGroupId:100451,wildGrowth:5,
    serverInitNum:20,serverLvUpPoint:5,sourceLimitLevel:79,
    baseStats:Object.freeze({vital:25,str:25,tgh:25,dex:25}),
    elements:Object.freeze({earth:100,water:0,fire:0,wind:0}),
    statusResist:Object.freeze([10,10,10,50,10,10]),
    petSkills:Object.freeze([1,2,-1,-1,-1,-1,-1])
  }),
  730:Object.freeze({
    enemyId:1563,name:'布伊胖',animationGroupId:100825,wildGrowth:4.5,
    serverInitNum:27,serverLvUpPoint:4,sourceLimitLevel:null,
    baseStats:Object.freeze({vital:34,str:29,tgh:25,dex:23}),
    elements:Object.freeze({earth:0,water:0,fire:60,wind:40}),
    statusResist:Object.freeze([0,0,0,0,0,0]),
    petSkills:Object.freeze([1,2,-1,-1,-1,-1,-1])
  }),
  854:Object.freeze({
    enemyId:1733,name:'動物園養的拉斯基',animationGroupId:100853,wildGrowth:4,
    serverInitNum:10,serverLvUpPoint:4,sourceLimitLevel:10,
    baseStats:Object.freeze({vital:20,str:23,tgh:21,dex:26}),
    elements:Object.freeze({earth:0,water:0,fire:60,wind:40}),
    statusResist:Object.freeze([0,0,0,0,0,0]),
    petSkills:Object.freeze([1,2,-1,-1,-1,-1,-1])
  })
});
function sourceQuestPetRank(baseStats){
  const sum=Math.trunc(n(baseStats?.vital))+Math.trunc(n(baseStats?.str))+Math.trunc(n(baseStats?.tgh))+Math.trunc(n(baseStats?.dex));
  if(sum>=100)return 0;
  if(sum>=95)return 1;
  if(sum>=90)return 2;
  if(sum>=85)return 3;
  if(sum>=80)return 4;
  return 5;
}
function sourceQuestPetTemplate(tempNo){
  return SOURCE_QUEST_GETPET[String(Math.trunc(n(tempNo)))]||SOURCE_QUEST_GETPET[Math.trunc(n(tempNo))]||null;
}
function sourceInitQuestPetProgression(pet,template,replayLevels=0){
  if(!pet||!template)return false;
  const oldHp=Number.isFinite(Number(pet.hp))?Math.max(0,Math.trunc(Number(pet.hp))):null;
  const rolled=rollEnemyCreateStats(template.baseStats);
  const derived=serverEnemyDerived(template,1,rolled.stats);
  pet.stats=Object.assign({},rolled.stats);
  pet.allocPointPacked=packPetAllocPoint(rolled.allocatedFrom);
  pet.petRank=sourceQuestPetRank(template.baseStats);
  pet.serverStats=Object.assign({},derived.charStats);
  pet.serverCombat={attack:derived.attack,defense:derived.defense,quick:derived.quick,maxHp:derived.maxHp};
  pet.serverProgression=true;
  pet.serverInitNum=template.serverInitNum;
  pet.serverLvUpPoint=template.serverLvUpPoint;
  for(let i=0;i<Math.max(0,Math.trunc(n(replayLevels)));i++)serverPetLevelUp(pet);
  const maxHp=petMaxHp(pet);
  pet.maxHp=maxHp;
  pet.hp=oldHp==null?maxHp:clamp(oldHp,0,maxHp);
  return true;
}
function sourceApplyQuestPetTemplate(pet,{rebuildProgression=false}={}){
  const template=sourceQuestPetTemplate(pet?.tempNo);
  if(!pet||!template)return false;
  pet.animationGroupId=template.animationGroupId;
  pet.wildGrowth=template.wildGrowth;
  pet.elements=Object.assign({},template.elements);
  pet.statusResist=Array.from(template.statusResist);
  if(!Array.isArray(pet.petSkills)||pet.petSkills.length<7)pet.petSkills=Array.from(template.petSkills);
  pet.serverInitNum=template.serverInitNum;
  pet.serverLvUpPoint=template.serverLvUpPoint;
  pet.sourceEnemyId=template.enemyId;
  pet.sourceLimitLevel=template.sourceLimitLevel;
  if(rebuildProgression||!pet.serverProgression||!pet.serverStats||pet.petRank==null||pet.allocPointPacked==null){
    const savedLevel=Math.max(1,Math.trunc(n(pet.level)||1));
    const savedExp=Math.max(0,Math.trunc(n(pet.exp)));
    sourceInitQuestPetProgression(pet,template,savedLevel-1);
    pet.level=savedLevel;
    pet.exp=savedExp;
  }else{
    pet.serverProgression=true;
    pet.petRank=sourceQuestPetRank(template.baseStats);
    pet.serverCombat=petServerCombat(pet.serverStats);
    syncPetBattleHp(pet,false);
  }
  return true;
}
function sourceCreateQuestGetPet(tempNo,extra={}){
  const template=sourceQuestPetTemplate(tempNo);
  if(!template)return null;
  const pet=Object.assign({
    id:uid(),name:template.name,animationGroupId:template.animationGroupId,tempNo:Number(tempNo),
    level:1,exp:0,wildGrowth:template.wildGrowth,
    stats:Object.assign({},template.baseStats),
    elements:Object.assign({},template.elements),
    statusResist:Array.from(template.statusResist),
    petSkills:Array.from(template.petSkills),
    serverInitNum:template.serverInitNum,serverLvUpPoint:template.serverLvUpPoint,
    sourceEnemyId:template.enemyId,sourceLimitLevel:template.sourceLimitLevel,
    capturedAt:Date.now(),questReward:true
  },extra);
  sourceInitQuestPetProgression(pet,template,0);
  syncPetBattleHp(pet,true);
  return pet;
}

function sourcePlayerCreationStatsValidate(points){
  const keys=['vital','str','tgh','dex'];
  const clean={};
  for(const key of keys){
    const value=Number(points?.[key]);
    if(!Number.isFinite(value)||!Number.isInteger(value)){
      return {valid:false,reason:'VITAL／STR／TOUGH／DEX 都必須是整數。'};
    }
    if(value<0||value>20){
      return {valid:false,reason:'原服創角四圍每一項都必須介於 0～20 點。'};
    }
    clean[key]=value;
  }
  const total=keys.reduce((sum,key)=>sum+clean[key],0);
  if(total>20)return {valid:false,reason:'固定 _NEW_PLAYER_CF build 只允許四圍合計 ≤20 點。',points:clean,total};
  return {valid:true,reason:'合法原服創角四圍。',points:clean,total,remaining:20-total};
}
function sourcePlayerCreationStatsReady(target=state){
  if(target?.playerCreationStatsLegacyUnknown===true)return true;
  const checked=sourcePlayerCreationStatsValidate(target?.creationPlayerStats);
  return !!(target?.playerCreationStatsConfigured&&checked.valid);
}
function confirmPlayerCreationStats(points=playerCreationStatsDraft){
  if(!state)return {ok:false,reason:'state-missing'};
  if(sourcePlayerCreationStatsReady(state)){
    addLog(state.playerCreationStatsLegacyUnknown
      ?'此角色是舊存檔，歷史創角四圍無法可靠倒推；保留既有累積四圍，不重新建立。'
      :'角色創角四圍已依原服規則鎖定，不能重新選擇。','bad');
    return {ok:false,reason:'already-configured'};
  }
  const checked=sourcePlayerCreationStatsValidate(points);
  if(!checked.valid){
    addLog('創角四圍無法確認：'+checked.reason,'bad');
    renderPlayerCreationStats();
    return {ok:false,reason:'invalid',validation:checked};
  }
  state.creationPlayerStats=Object.assign({},checked.points);
  state.playerStats=Object.assign({},checked.points);
  state.playerCreationStatsConfigured=true;
  state.playerCreationStatsLegacyUnknown=false;
  playerCreationStatsDraft=Object.assign({},checked.points);
  playerComplianceParameter(state);
  // CHAR_createNewChar 先把 CHAR_HP 設成 0x7fffffff；登入 compliance 後會被 MaxHP 截斷，
  // 所以真正新角色完成創角四圍時以滿 HP 開始。
  state.hp=state.maxHp;
  addLog('原服創角四圍已確認：VITAL '+checked.points.vital+'／STR '+checked.points.str+'／TOUGH '+checked.points.tgh+'／DEX '+checked.points.dex+'（合計 '+checked.total+'，未使用 '+checked.remaining+'）。此創角基底已永久鎖定。','good');
  save();render();
  return {ok:true,points:Object.assign({},checked.points),total:checked.total,remaining:checked.remaining};
}
function sourcePlayerElementValidate(points){
  const keys=['earth','water','fire','wind'];
  const clean={};
  for(const key of keys){
    const value=Number(points?.[key]);
    if(!Number.isFinite(value)||!Number.isInteger(value)){
      return {valid:false,reason:'四屬性點數都必須是整數。'};
    }
    if(value<0||value>10){
      return {valid:false,reason:'每一種屬性都必須介於 0～10 點。'};
    }
    clean[key]=value;
  }
  const total=keys.reduce((sum,key)=>sum+clean[key],0);
  if(total!==10)return {valid:false,reason:'四屬性合計必須剛好 10 點。',points:clean,total};
  const nonzero=keys.filter(key=>clean[key]>0);
  if(nonzero.length>2)return {valid:false,reason:'原服創角最多只能同時擁有兩種屬性。',points:clean,total};
  if(clean.earth>0&&clean.fire>0)return {valid:false,reason:'原服創角禁止同時選擇地＋火。',points:clean,total};
  if(clean.water>0&&clean.wind>0)return {valid:false,reason:'原服創角禁止同時選擇水＋風。',points:clean,total};
  return {
    valid:true,reason:'合法原服創角元素配點。',points:clean,total,
    elements:{
      earth:clean.earth*10,
      water:clean.water*10,
      fire:clean.fire*10,
      wind:clean.wind*10
    }
  };
}
function sourcePlayerElementStoredPoints(elements){
  if(!elements||typeof elements!=='object')return null;
  const keys=['earth','water','fire','wind'],points={};
  for(const key of keys){
    const raw=Number(elements[key]);
    if(!Number.isFinite(raw)||!Number.isInteger(raw)||raw<0||raw>100||raw%10!==0)return null;
    points[key]=raw/10;
  }
  const checked=sourcePlayerElementValidate(points);
  return checked.valid?checked.points:null;
}
const SOURCE_HOMETOWN_STARTERS=Object.freeze({
  0:Object.freeze({hometown:0,elder:0,floor:1006,x:15,y:22,enemyId:1,label:'0 號出生村'}),
  1:Object.freeze({hometown:1,elder:1,floor:2006,x:20,y:16,enemyId:2,label:'瑪麗娜絲'}),
  2:Object.freeze({hometown:2,elder:2,floor:3006,x:21,y:16,enemyId:3,label:'加加'}),
  3:Object.freeze({hometown:3,elder:3,floor:4006,x:14,y:20,enemyId:4,label:'卡魯它那'})
});
function sourcePlayerElementsConfigured(target=state){
  return !!(target?.playerElementsConfigured&&sourcePlayerElementStoredPoints(target?.elements));
}
function sourceHometownMeta(value){
  const h=Number(value);
  if(!Number.isInteger(h)||h<0||h>3)return null;
  return SOURCE_HOMETOWN_STARTERS[h]||null;
}
function sourcePlayerHometownReady(target=state){
  if(target?.hometownLegacyUnknown===true)return true;
  return !!(target?.playerHometownConfigured&&sourceHometownMeta(target?.hometown));
}
function sourceStarterEnemyTemplate(hometown){
  const meta=sourceHometownMeta(hometown);
  if(!meta)return null;
  const rows=encounterRuntime?.groups?.['1127']?.members;
  if(!Array.isArray(rows))return null;
  return rows.find(row=>Number(row?.enemyId)===meta.enemyId&&row?.validTemplate!==false)||null;
}
function sourceCreateStarterPet(hometown){
  const meta=sourceHometownMeta(hometown);
  const template=sourceStarterEnemyTemplate(hometown);
  if(!meta||!template)return null;

  // fixed ENEMY_createPetFromEnemyIndex statement/RNG order:
  // level RAND -> four ±2 rolls -> ten allocation rolls -> PETMAIL_EFFECT RAND(0,1).
  const level=rnd(Math.max(1,Math.trunc(n(template.levelMin))||1),Math.max(1,Math.trunc(n(template.levelMax))||1));
  const rolled=rollEnemyCreateStats(template.stats||{});
  const derived=serverEnemyDerived(template,level,rolled.stats);
  const petMailEffect=rnd(0,1);
  const rank=Number(template.enemyExpRankIndex);
  const statusResist=enemyAiDb?.byEnemyId?.[String(meta.enemyId)]?.z;

  const pet={
    id:uid(),name:template.name||('Enemy '+meta.enemyId),
    animationGroupId:template.animationGroupId??null,tempNo:template.tempNo??null,
    level,exp:0,wildGrowth:n(template.wildGrowth),
    stats:Object.assign({},rolled.stats),
    elements:Object.assign({},template.elements||{}),
    petSkills:Array.isArray(template.petSkills)?template.petSkills.slice(0,7):[],
    statusResist:Array.isArray(statusResist)?statusResist.slice(0,6):[0,0,0,0,0,0],
    serverStats:Object.assign({},derived.charStats),
    serverCombat:{attack:derived.attack,defense:derived.defense,quick:derived.quick,maxHp:derived.maxHp},
    allocPointPacked:packPetAllocPoint(rolled.allocatedFrom),
    petRank:Number.isFinite(rank)?Math.trunc(rank):null,
    serverProgression:Number.isFinite(rank),
    serverInitNum:template.serverInitNum??null,serverLvUpPoint:template.serverLvUpPoint??null,
    sourceEnemyId:meta.enemyId,variableAi:0,petMailEffect,
    maxHp:Math.max(1,Math.trunc(n(derived.maxHp))),hp:Math.max(1,Math.trunc(n(derived.maxHp))),
    starterPet:true,starterHometown:meta.hometown,createdAt:Date.now()
  };
  return pet;
}
function confirmPlayerHometown(value){
  if(!state)return {ok:false,reason:'state-missing'};
  if(sourcePlayerHometownReady(state)){
    addLog(state.hometownLegacyUnknown
      ?'此角色是舊存檔，歷史出生村無法可靠倒推，因此不補領起始寵。'
      :'出生村已依原服創角流程鎖定，不能重新選擇。','bad');
    return {ok:false,reason:'already-configured'};
  }
  const meta=sourceHometownMeta(value);
  if(!meta){
    addLog('出生村必須是原服 hometown 0～3。','bad');
    return {ok:false,reason:'invalid-hometown'};
  }
  const open=Array.isArray(state.team)?state.team.findIndex(x=>!x):-1;
  if(open<0){
    addLog('目前 5 個持有寵位置都已佔用，無法完成原服創角起始寵建立。','bad');
    return {ok:false,reason:'no-pet-slot'};
  }
  const pet=sourceCreateStarterPet(meta.hometown);
  if(!pet){
    addLog('找不到 Group 1127 對應的原服起始寵模板；不猜資料。','bad');
    return {ok:false,reason:'starter-template-missing'};
  }

  state.hometown=meta.hometown;
  state.lastTalkElder=meta.elder;
  state.homeFloor=meta.floor;
  state.homeX=meta.x;
  state.homeY=meta.y;
  state.hometownSavePointMask=(1<<meta.hometown);
  state.playerHometownConfigured=true;
  state.hometownLegacyUnknown=false;
  state.starterPetGranted=true;
  state.petBox.push(pet);
  state.team[open]=pet.id;
  // fixed CHAR_createNewChar never writes CHAR_DEFAULTPET after ENEMY_createPetFromEnemyIndex.
  // Therefore the first owned slot is filled, but activePetId remains untouched/null.
  addLog('原服出生村已確認：hometown '+meta.hometown+'／Floor '+meta.floor+' ('+meta.x+','+meta.y+')；取得 Lv'+pet.level+' '+pet.name+'，但未自動設為出戰寵。','good');
  save();render();
  return {ok:true,meta:Object.assign({},meta),pet};
}
function confirmPlayerElements(points=playerElementDraft){
  if(!state)return {ok:false,reason:'state-missing'};
  if(sourcePlayerElementsConfigured(state)){
    addLog('角色元素已依原服創角規則鎖定，不能在創角後重新配點。','bad');
    return {ok:false,reason:'already-configured'};
  }
  const checked=sourcePlayerElementValidate(points);
  if(!checked.valid){
    addLog('元素配點無法確認：'+checked.reason,'bad');
    renderPlayerElements();
    return {ok:false,reason:'invalid',validation:checked};
  }
  state.elements=Object.assign({},checked.elements);
  state.playerElementsConfigured=true;
  playerElementDraft=Object.assign({},checked.points);
  addLog('原服創角元素已確認：地 '+checked.elements.earth+'／水 '+checked.elements.water+'／火 '+checked.elements.fire+'／風 '+checked.elements.wind+'。此配點已永久鎖定。','good');
  save();render();
  return {ok:true,points:checked.points,elements:checked.elements};
}
function freshState(){
  return {
    schemaVersion:28,
    level:1,exp:0,expNext:2,hp:0,maxHp:0,mp:100,maxMp:100,
    playerPigUntilMs:0,playerPigImage:100388,
    magicResist:[0,0,0,0],magicResistExp:[0,0,0,0],
    attack:0,defense:0,dex:0,charm:60,luck:0,skillPoints:0,duelPoint:100,
    transmigration:1,
    hometown:null,lastTalkElder:null,homeFloor:null,homeX:null,homeY:null,hometownSavePointMask:0,
    playerHometownConfigured:false,hometownLegacyUnknown:false,starterPetGranted:false,
    creationPlayerStats:null,playerCreationStatsConfigured:false,playerCreationStatsLegacyUnknown:false,
    playerStats:{vital:0,str:0,tgh:0,dex:0},
    elements:null,playerElementsConfigured:false,
    gold:30000,battles:0,wins:0,mapId:null,encounterId:null,encounterCep:0,virtualWalkSteps:0,lastEncounterRoll:null,auto:true,autoCapture:true,
    petBox:[],team:Array(TEAM_SIZE).fill(null),activePetId:null,
    // fixed setup.cf + _HELP_NEWHAND: ITEM1=24114; exact item name/effect is not guessed.
    inventory:{'24114':1},
    itemRuntime:freshItemRuntime(),
    playerItemSlots:freshPlayerItemSlots(),
    quest:{event81Complete:false,event81:{active:false,complete:false,stage:0,deliveredTempNo:null,arrivedEden:false,postReward:false,mazeFloor:null,mazeX:null,mazeY:null,mazeBattles:0,flightRouteNo:null,flightWaypoints:[]},event71Current:false,event2:{active:false,complete:false},event4:{active:false,complete:false,stage:0},event71Prep:{stage:0,memoryIndex:0,memoryReady:false},event82:{active:false,complete:false,raelpangReported:false,popodonReported:false},event83:{active:false,complete:false}},
    log:[],savedAt:Date.now()
  };
}
function migrateLegacyPets(raw,s){
  if(Array.isArray(raw?.petBox)){
    s.petBox=raw.petBox.filter(Boolean).map(p=>Object.assign({},p,{id:p.id||uid()}));
    return;
  }
  if(!raw?.pets||typeof raw.pets!=='object')return;
  for(const old of Object.values(raw.pets)){
    const count=Math.max(0,Math.floor(n(old.count)));
    for(let i=0;i<count;i++){
      s.petBox.push({
        id:uid(),name:old.name||'舊版寵物',
        animationGroupId:old.animationGroupId??null,tempNo:null,level:1,exp:0,
        stats:{vital:8,str:8,tgh:8,dex:8},elements:{},legacy:true
      });
    }
  }
}
function normalizeState(raw){
  const base=freshState();
  // A missing save is a brand-new character, not a schema-0 legacy save.
  // Returning here prevents historical migrations (e.g. old charm / DuelPoint repairs)
  // from being applied on top of the fixed creation baseline.
  if(!raw||typeof raw!=='object')return base;
  const s=Object.assign(base,raw);
  // Prior web versions started GOLD at 0. If an unusual legacy save omitted the field,
  // preserve that historical web baseline instead of backfilling setup.cf's 30000.
  if(!Object.prototype.hasOwnProperty.call(raw,'gold'))s.gold=0;
  // Likewise, do not backfill the consumable starter Item 24114 into existing saves.
  s.inventory=(raw.inventory&&typeof raw.inventory==='object')?raw.inventory:{};
  s.quest=Object.assign({},base.quest,raw?.quest||{});
  s.quest.event81=Object.assign({},base.quest.event81,raw?.quest?.event81||{});
  s.quest.event2=Object.assign({},base.quest.event2,raw?.quest?.event2||{});
  s.quest.event4=Object.assign({},base.quest.event4,raw?.quest?.event4||{});
  s.quest.event71Prep=Object.assign({},base.quest.event71Prep,raw?.quest?.event71Prep||{});
  s.quest.event82=Object.assign({},base.quest.event82,raw?.quest?.event82||{});
  s.quest.event83=Object.assign({},base.quest.event83,raw?.quest?.event83||{});
  const legacyDev71=n(raw?.schemaVersion)<5&&raw?.quest?.event71Current===true&&!raw?.quest?.event83?.active&&!raw?.quest?.event83?.complete;
  if(legacyDev71){
    s.quest.event71Current=false;
    s.quest.event71Prep={stage:0};
    s.quest.event2={active:false,complete:false};
    if(n(s.inventory['2414'])>0)delete s.inventory['2414'];
  }
  s.team=Array.isArray(raw?.team)?raw.team.slice(0,TEAM_SIZE):Array(TEAM_SIZE).fill(null);
  while(s.team.length<TEAM_SIZE)s.team.push(null);
  migrateLegacyPets(raw,s);
  // V1.13: fixed NPC_ActionAddPet(GetPet) -> ENEMY_createPetFromEnemyIndex copies the enemybase template
  // and creates the Pet with the same source RNG/progression fields. Old hand-written quest pets lacked them.
  if(n(raw?.schemaVersion)<22){
    for(const p of s.petBox){
      const isSourceQuestPet=!!(p?.questReward||p?.event83||p?.event71Prerequisite)
        &&(Number(p?.tempNo)===718||Number(p?.tempNo)===730||Number(p?.tempNo)===854);
      if(isSourceQuestPet)sourceApplyQuestPetTemplate(p,{rebuildProgression:true});
    }
  }
  if(n(raw?.schemaVersion)<6&&!s.quest.event71Current&&n(s.quest.event71Prep.stage)===3){
    const legacyMarefia=s.petBox.find(p=>Number(p.tempNo)===718);
    if(legacyMarefia&&n(legacyMarefia.level)>=79){
      legacyMarefia.level=79;legacyMarefia.exp=0;legacyMarefia.levelCap=79;legacyMarefia.memoryRoute=true;
      s.quest.event71Prep.memoryIndex=MAREFIA_MEMORY_ROUTE.length;
      s.quest.event71Prep.memoryReady=true;
      s.quest.event71Prep.stage=4;
    }
  }
  if(n(raw?.schemaVersion)<7){
    const hadPostAdultProgress=s.quest.event71Current||n(s.quest.event71Prep.stage)>0||s.quest.event83.active||s.quest.event83.complete;
    if(hadPostAdultProgress)s.quest.event4={active:false,complete:true,stage:3};
  }
  if(n(raw?.schemaVersion)<8){
    const oldStage=n(s.quest.event71Prep.stage);
    const migratedStage={2:8,3:9,4:10,5:11}[oldStage];
    if(migratedStage!=null)s.quest.event71Prep.stage=migratedStage;
  }
  if(n(raw?.schemaVersion)<9){
    const hadDownstream=!!(s.quest.event82.active||s.quest.event82.complete||s.quest.event83.active||s.quest.event83.complete);
    if(raw?.quest?.event81Complete===true&&hadDownstream){
      s.quest.event81={active:false,complete:true,stage:8,deliveredTempNo:null,arrivedEden:false,postReward:false,legacyAccepted:true,mazeFloor:null,mazeX:null,mazeY:null,mazeBattles:0,flightRouteNo:null,flightWaypoints:[]};
      s.quest.event81Complete=true;
    }else if(raw?.quest?.event81Complete===true){
      s.quest.event81=Object.assign({},base.quest.event81);
      s.quest.event81Complete=false;
    }
  }
  if(n(raw?.schemaVersion)<10&&!s.quest.event81.complete){
    const old=n(s.quest.event81.stage);
    if(old===3){s.quest.event81.mazeFloor=5576;s.quest.event81.mazeX=24;s.quest.event81.mazeY=86;}
    if(old===4){s.quest.event81.stage=3;s.quest.event81.mazeFloor=5576;s.quest.event81.mazeX=28;s.quest.event81.mazeY=86;}
    if(old===5){s.quest.event81.stage=3;s.quest.event81.mazeFloor=5576;s.quest.event81.mazeX=32;s.quest.event81.mazeY=86;}
    if(old===6){s.quest.event81.mazeFloor=5582;s.quest.event81.mazeX=33;s.quest.event81.mazeY=87;}
    s.quest.event81.mazeBattles=Math.max(0,n(s.quest.event81.mazeBattles));
  }
  s.quest.event81Complete=!!s.quest.event81.complete;
  const ids=new Set(s.petBox.map(p=>p.id));
  const rawHasActivePetId=!!raw&&Object.prototype.hasOwnProperty.call(raw,'activePetId');
  const rawHasTeam=!!raw&&Array.isArray(raw.team);
  s.team=s.team.map(id=>ids.has(id)?id:null);
  if(!ids.has(s.activePetId))s.activePetId=null;

  // fixed BATTLE_LostEscape 只把 CHAR_DEFAULTPET 設為 -1，寵本身仍留在持有欄。
  // 現行存檔若明確保存 activePetId:null，這個「休息／未出戰」狀態必須跨 reload 保留；
  // 只有舊格式根本沒有 activePetId 欄位時，才沿用 legacy convenience 自動挑第一隻。
  if(!s.activePetId&&!rawHasActivePetId){
    s.activePetId=s.team.find(Boolean)||null;
  }
  if(!s.team.some(Boolean)&&s.petBox.length&&!rawHasTeam){
    // 舊格式沒有 team 欄位時才替它建立第一格；現行玩家明確空隊伍不可被偷偷補回。
    s.team[0]=s.petBox[0].id;
    if(!rawHasActivePetId)s.activePetId=s.petBox[0].id;
  }
  if(n(raw?.schemaVersion)<11)s.encounterId=null;
  if(n(raw?.schemaVersion)<12){
    s.encounterCep=Math.max(0,n(raw?.encounterCep));
    s.virtualWalkSteps=Math.max(0,Math.floor(n(raw?.virtualWalkSteps)));
    s.lastEncounterRoll=null;
  }
  if(n(raw?.schemaVersion)<13){
    s.skillPoints=Math.max(0,Math.floor(n(raw?.skillPoints)));
    s.duelPoint=Math.max(0,Math.floor(n(raw?.duelPoint)));
  }
  // V1.27: fixed defaultPlayer.h starts CHAR_DUELPOINT at 100.
  // This web has no PvP / duel-point mutation path, so every pre-schema24 save is
  // deterministically short by exactly this creation constant. Add it once.
  if(n(raw?.schemaVersion)<24){
    s.duelPoint=Math.max(0,Math.floor(n(s.duelPoint)))+100;
  }else{
    s.duelPoint=Math.max(0,Math.floor(n(s.duelPoint)));
  }
  // V1.28: fixed setup.cf TRANS=1. Before schema25 the web had no player-level
  // transmigration field or mutation path, so all existing saves are exactly missing this baseline.
  if(n(raw?.schemaVersion)<25)s.transmigration=1;
  else s.transmigration=Math.max(0,Math.trunc(n(s.transmigration)));

  // V1.29: pre-schema26 web saves never stored creation hometown/LASTTALKELDER.
  // A starter Pet may have been captured/released/rearranged since then, so do not invent history
  // and do not grant a retroactive starter. Mark the creation step as legacy-unknown but gameplay-ready.
  if(n(raw?.schemaVersion)<26){
    s.hometown=null;s.lastTalkElder=null;s.homeFloor=null;s.homeX=null;s.homeY=null;s.hometownSavePointMask=0;
    s.playerHometownConfigured=true;
    s.hometownLegacyUnknown=true;
    s.starterPetGranted=false;
  }else if(s.hometownLegacyUnknown===true){
    s.hometown=null;s.lastTalkElder=null;s.homeFloor=null;s.homeX=null;s.homeY=null;s.hometownSavePointMask=0;
    s.playerHometownConfigured=true;
    s.starterPetGranted=!!s.starterPetGranted;
  }else{
    const home=sourceHometownMeta(s.hometown);
    if(s.playerHometownConfigured===true&&home){
      s.hometown=home.hometown;s.lastTalkElder=home.elder;
      s.homeFloor=home.floor;s.homeX=home.x;s.homeY=home.y;s.hometownSavePointMask=(1<<home.hometown);
      s.playerHometownConfigured=true;s.hometownLegacyUnknown=false;s.starterPetGranted=!!s.starterPetGranted;
    }else{
      s.hometown=null;s.lastTalkElder=null;s.homeFloor=null;s.homeX=null;s.homeY=null;s.hometownSavePointMask=0;
      s.playerHometownConfigured=false;s.hometownLegacyUnknown=false;s.starterPetGranted=false;
    }
  }
  if(n(raw?.schemaVersion)<14){
    const earned=Math.max(0,(Math.max(1,Math.floor(n(s.level)||1))-1)*3);
    s.skillPoints=Math.max(Math.max(0,Math.floor(n(s.skillPoints))),earned);
    s.playerStats={vital:5,str:5,tgh:5,dex:5};
    s.charm=Math.min(100,Math.max(0,n(s.charm))+10);
  }
  s.playerStats=Object.assign({vital:0,str:0,tgh:0,dex:0},s.playerStats||{});
  for(const k of ['vital','str','tgh','dex'])s.playerStats[k]=Math.max(0,Math.floor(n(s.playerStats[k])));

  // V1.30: old saves have only cumulative Web playerStats. They do not preserve the original
  // CHAR_makeCharFromOptionAtCreate allocation separately, so do not pretend the historical
  // fixed 5/5/5/5 Web baseline was the source creation choice. Preserve their current stats
  // and let them pass the creation gate as legacy-unknown.
  if(n(raw?.schemaVersion)<27){
    s.creationPlayerStats=null;
    s.playerCreationStatsConfigured=true;
    s.playerCreationStatsLegacyUnknown=true;
  }else if(s.playerCreationStatsLegacyUnknown===true){
    s.creationPlayerStats=null;
    s.playerCreationStatsConfigured=true;
  }else{
    const creation=sourcePlayerCreationStatsValidate(s.creationPlayerStats);
    if(s.playerCreationStatsConfigured===true&&creation.valid){
      s.creationPlayerStats=Object.assign({},creation.points);
      s.playerCreationStatsConfigured=true;
      s.playerCreationStatsLegacyUnknown=false;
    }else{
      s.creationPlayerStats=null;
      s.playerCreationStatsConfigured=false;
      s.playerCreationStatsLegacyUnknown=false;
      s.playerStats={vital:0,str:0,tgh:0,dex:0};
      s.attack=0;s.defense=0;s.dex=0;s.maxHp=0;s.hp=0;
    }
  }

  // V1.26: old saves never persisted the original creation element allocation.
  // Do not turn the previous empty-object/no-attribute fallback into historical data.
  if(n(raw?.schemaVersion)<23){
    s.elements=null;
    s.playerElementsConfigured=false;
  }else{
    const storedPoints=sourcePlayerElementStoredPoints(s.elements);
    if(s.playerElementsConfigured===true&&storedPoints){
      const checked=sourcePlayerElementValidate(storedPoints);
      s.elements=Object.assign({},checked.elements);
      s.playerElementsConfigured=true;
    }else{
      s.elements=null;
      s.playerElementsConfigured=false;
    }
  }
  const legacyPetHp=n(raw?.schemaVersion)<15;
  for(const p of s.petBox)syncPetBattleHp(p,legacyPetHp||!Number.isFinite(Number(p.hp)));
  s.playerPigUntilMs=Math.max(0,n(s.playerPigUntilMs));
  s.playerPigImage=Math.trunc(n(s.playerPigImage)||100388);
  const normMagic4=a=>Array.from({length:4},(_,i)=>Math.max(0,Math.trunc(n(Array.isArray(a)?a[i]:0))));
  s.magicResist=normMagic4(s.magicResist);
  s.magicResistExp=normMagic4(s.magicResistExp);
  // 原 CHAR_createNewChar 將 CHAR_MAXMP 與 CHAR_MP 都固定初始化為 100；
  // CHAR_initcharWorkInt 再直接令 WORKMAXMP = CHAR_MAXMP。現版尚無 MP 裝備修正，因此上限維持 100。
  if(n(raw?.schemaVersion)<18){s.maxMp=100;s.mp=100;}
  s.maxMp=Math.max(0,Math.trunc(n(s.maxMp)||100));
  s.mp=clamp(Math.trunc(n(s.mp)),0,s.maxMp);
  for(const p of s.petBox){
    p.magicResist=normMagic4(p.magicResist);
    p.magicResistExp=normMagic4(p.magicResistExp);
  }
  // V0.68 前的 web 並不存在原 ITEM_item[] existing pool，因此舊存檔不能虛構歷史 allocation；
  // migration 從 source server 啟動後的空 pool 狀態開始，之後才依原 Sindex allocator 持續記錄。
  if(n(raw?.schemaVersion)<19)s.itemRuntime=freshItemRuntime();
  else{
    // V0.69 無 itemset6 模板表時可能曾追蹤到原 C 其實建立失敗的 missing Item ID。
    // 若該 phantom 已轉給玩家，只扣除「battle-getitem tracked」那一份，不碰同 ID 的任務／舊版 untracked 數量。
    if(n(raw?.schemaVersion)<21&&s.itemRuntime?.slots&&itemMagicDb?.byItemId){
      const invalidTracked={};
      for(const slot of Object.values(s.itemRuntime.slots)){
        const itemId=Number.isFinite(Number(slot?.itemId))?Math.trunc(Number(slot.itemId)):null;
        if(slot?.use!==true||itemId==null||sourceItemTemplateExists(itemId))continue;
        if(slot.owner==='player'&&slot.source==='battle-getitem')invalidTracked[String(itemId)]=n(invalidTracked[String(itemId)])+1;
      }
      for(const [key,count] of Object.entries(invalidTracked)){
        const left=Math.max(0,Math.trunc(n(s.inventory[key]))-Math.trunc(n(count)));
        if(left>0)s.inventory[key]=left;else delete s.inventory[key];
      }
    }
    s.itemRuntime=normalizeItemRuntime(s.itemRuntime);
  }
  // V0.69 起 slot 記錄 owner/source；V0.68 的舊 slot 若無 owner，保留 use/index 但不捏造歸屬。
  // V0.70 itemset6 runtime 已能唯一還原 ITEM_MAGICUSEMP；normalizeItemRuntime 會只對已知 itemId 的 null slot 回填來源值。
  // V1.70: pre-schema28 saves did not preserve CHAR's 9 equipment + 15 backpack slots.
  // Their historical positions cannot be reconstructed from aggregate inventory / owner alone.
  // Start them empty instead of inventing where an existing item used to sit.
  if(n(raw?.schemaVersion)<28)s.playerItemSlots=freshPlayerItemSlots();
  else s.playerItemSlots=normalizePlayerItemSlots(s.playerItemSlots,s.itemRuntime);
  s.schemaVersion=28;
  delete s.pets;
  return s;
}
function loadState(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    return normalizeState(raw?JSON.parse(raw):null);
  }catch(e){return freshState()}
}
function save(){
  state.savedAt=Date.now();
  localStorage.setItem(SAVE_KEY,JSON.stringify(state));
}
function addLog(text,type){
  const stamp=new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  state.log.unshift({text:'['+stamp+'] '+text,type:type||''});
  state.log=state.log.slice(0,100);
  renderLog();
  save();
}
function hasItem(id,count=1){return n(state.inventory[String(id)])>=count}
function consumeItem(id,count=1){
  const key=String(id);
  const want=Math.max(0,Math.trunc(n(count)));
  const before=Math.max(0,Math.trunc(n(state.inventory[key])));
  const actual=Math.min(before,want);
  if(actual<=0)return;

  // 舊版／任務 giveItem 沒有 source existing-index；先消耗 untracked，避免捏造舊 allocation。
  const tracked=sourceTrackedPlayerItems(id);
  const untracked=Math.max(0,before-tracked.length);
  let trackedNeed=Math.max(0,actual-untracked);
  for(const x of tracked){
    if(trackedNeed<=0)break;
    sourceItemRuntimeFree(x.index);trackedNeed--;
  }

  state.inventory[key]=before-actual;
  if(state.inventory[key]<=0)delete state.inventory[key];
}
function giveItem(id,count=1){
  const key=String(id);
  state.inventory[key]=n(state.inventory[key])+count;
}
function rollVerifiedDrops(defeatedEnemy){
  if(!defeatedEnemy)return [];
  const drops=[];
  const carriedLoot=sourceTakeBattleGetItemPool();
  for(const carried of carriedLoot){
    const itemId=Number(carried.itemId);
    if(!Number.isFinite(itemId))continue;
    let acquired=true;
    if(Number.isFinite(Number(carried.itemIndex))&&sourceItemRuntimeSlot(carried.itemIndex)){
      acquired=giveTrackedItemFromExisting(itemId,carried.itemIndex).ok;
    }else{
      // Legacy/untracked fallback has no source existing index; preserve the old aggregate path
      // rather than inventing a historical allocation.
      giveItem(itemId,1);
    }
    if(!acquired)continue;
    const meta=questItemMeta(itemId);
    drops.push(meta
      ?Object.assign({},meta,{enemyDrop:true,enemyDropSlot:carried.slot,dropProbabilityRaw:carried.probabilityRaw})
      :{id:itemId,name:'Item '+itemId,enemyDrop:true,enemyDropSlot:carried.slot,dropProbabilityRaw:carried.probabilityRaw,itemIndex:carried.itemIndex});
  }

  const subjects=(Array.isArray(defeatedEnemy.units)&&defeatedEnemy.units.length)
    ?defeatedEnemy.units.map(u=>({enemyIds:[u.enemyId].filter(Boolean),questDrop:u.questDrop||null,serverDropTable:!!u.serverDropTable,name:u.name}))
    :[{enemyIds:(defeatedEnemy.entry?.variant?.enemyIds||[]).map(Number),questDrop:defeatedEnemy.entry?.variant?.questDrop||null,serverDropTable:!!defeatedEnemy.serverDropTable,name:defeatedEnemy.name}];

  for(const subject of subjects){
    const enemyIds=new Set((subject.enemyIds||[]).map(Number));
    const qd=subject.questDrop;
    if(qd&&n(qd.probability)>0&&Math.random()<n(qd.probability)){
      giveItem(qd.id,1);
      drops.push(questItemMeta(qd.id)||{id:qd.id,name:qd.name||('Item '+qd.id)});
    }
    // 有完整 enemy1 10 格掉落表時，以 Enemy 建立時已抽好的 carried loot 為準；
    // 舊 conditionItems enemy_drop 只保留給沒有 server drop table 的手工任務 Enemy。
    if(subject.serverDropTable)continue;
    for(const item of conditionItems){
      for(const src of item.sources||[]){
        if(src.type!=='enemy_drop')continue;
        if(!Array.isArray(src.enemyIds)||!src.enemyIds.some(id=>enemyIds.has(Number(id))))continue;
        if(qd&&Number(qd.id)===Number(item.id))continue;
        let chance=0;
        if(src.dropRule==='_FIX_ITEMPROB')chance=n(src.dropProbabilityRaw)/1000;
        else if(Number.isFinite(Number(src.dropProbabilityPercent)))chance=n(src.dropProbabilityPercent)/100;
        if(chance>0&&Math.random()<chance){
          giveItem(item.id,1);
          drops.push(item);
          break;
        }
      }
    }
  }
  return drops;
}
function routeUnlocked(route){
  const ids=route?.appearanceInventoryItemIds||[];
  const noids=route?.notAppearanceInventoryItemIds||[];
  const req=route?.questRequirement||null;
  if(req?.event81Stage!=null&&n(state?.quest?.event81?.stage)!==n(req.event81Stage))return false;
  if(req?.event81MazeX!=null&&n(state?.quest?.event81?.mazeX)!==n(req.event81MazeX))return false;
  if(req?.event81MazeFloor!=null&&n(state?.quest?.event81?.mazeFloor)!==n(req.event81MazeFloor))return false;
  return ids.every(id=>hasItem(id))&&noids.every(id=>!hasItem(id));
}
function event81MazeZone(x){
  x=n(x);
  return x===24?'event81-thief-1':(x===28?'event81-thief-2':(x===32?'event81-thief-3':null));
}
function event81MazeWarp(sourceX){
  const e81=state.quest.event81,list=EVENT81_MAZE_WARPS[n(sourceX)]||[];
  if(!list.length)return false;
  const dest=list[Math.floor(Math.random()*list.length)];
  e81.mazeBattles=n(e81.mazeBattles)+1;
  e81.mazeFloor=dest.floor;e81.mazeX=dest.x;e81.mazeY=dest.y;
  if(dest.floor===5582){
    e81.stage=6;state.mapId='event81-boss';
    addLog('金剛陣亂數傳送命中原版唯一出口：Floor 5582 ('+dest.x+','+dest.y+')，抵達 PC團老大區。','good');
  }else{
    e81.stage=3;
    const zone=event81MazeZone(dest.x);
    if(zone)state.mapId=zone;
    addLog('金剛陣依原腳本亂數傳送到 Floor '+dest.floor+' ('+dest.x+','+dest.y+')。','pet');
  }
  return true;
}
function buildSourceCatalog(raw){
  sourceCatalog=new Map((raw?.items||[]).map(item=>[String(item.id),item]));
}
function sourceSummary(item){
  const src=item.sources?.[0];
  if(!src)return '正式來源待解';
  return src.summary||src.label||'正式來源已確認';
}
function questItemMeta(id){
  return (zooQuest?.items||[]).find(x=>Number(x.id)===Number(id))||null;
}
function buildConditionItems(){
  const map=new Map();
  const put=(item,kind,pet,floor)=>{
    if(!item||item.id==null)return;
    const key=String(item.id);
    if(!map.has(key))map.set(key,{
      id:Number(item.id),name:item.name||('Item '+item.id),description:item.description||'',
      kinds:new Set(),usedByPets:new Set(),floors:new Set()
    });
    const x=map.get(key);
    x.kinds.add(kind);
    if(pet)x.usedByPets.add(pet);
    if(floor!=null)x.floors.add(Number(floor));
  };
  for(const species of db.species){
    for(const variant of species.wildLv1Variants||[]){
      for(const item of variant.captureRule?.requiresAllItems||[])put(item,'capture',species.clientLabel,null);
      for(const route of variant.routes||[]){
        for(const item of route.appearanceInventoryItems||[])put(item,'appearance',species.clientLabel,route.floorId);
      }
    }
  }
  for(const item of zooQuest?.items||[]){
    put(item,'quest','伊甸動物園',7000);
  }
  conditionItems=[...map.values()].map(x=>{
    const src=sourceCatalog.get(String(x.id))||questItemMeta(x.id)||{};
    return {
      id:x.id,name:x.name,description:x.description,
      kinds:[...x.kinds].sort(),usedByPets:[...x.usedByPets].sort(),
      floors:[...x.floors].sort((a,b)=>a-b),
      sourceStatus:src.sourceStatus||'unresolved',
      sources:Array.isArray(src.sources)?src.sources:(src.source?[{type:'quest_npc',label:src.name||x.name,summary:'原任務腳本：'+src.source}]:[]),
      externalEvidence:Array.isArray(src.externalEvidence)?src.externalEvidence:[]
    };
  }).sort((a,b)=>a.id-b.id);
}
function findMainVariant(tempNo){
  for(const species of db.species){
    for(const variant of species.wildLv1Variants||[]){
      if(Number(variant.tempNo)===Number(tempNo))return {species,variant};
    }
  }
  return null;
}
function buildQuestMaps(){
  for(const zone of zooQuest?.huntingZones||[]){
    const entries=[];
    for(const raw of zone.entries||[]){
      let species={clientLabel:raw.name,animationGroupId:raw.animationGroupId||null};
      let variant={
        tempNo:raw.tempNo,enemyIds:raw.enemyIds||[],wildGrowth:raw.wildGrowth||1,
        captureBase:raw.captureBase||0,stats:Object.assign({},raw.stats||{}),elements:{},
        capturable:raw.capturable!==false,
        levelMin:raw.levelMin||1,levelMax:raw.levelMax||raw.levelMin||1,
        questDrop:raw.questDrop||null,
        consumeOnSpawnItemId:raw.consumeOnSpawnItemId||null,
        questOnWin:raw.questOnWin||null,
        bossComposition:raw.bossComposition||null,
        formation:Array.isArray(raw.formation)?raw.formation:null,
        dynamicFormation:raw.dynamicFormation||null
      };
      if(raw.useMainDbTempNo){
        const hit=findMainVariant(raw.useMainDbTempNo);
        if(hit){
          species=Object.assign({},hit.species,{clientLabel:raw.name});
          variant=Object.assign({},hit.variant,{enemyIds:raw.enemyIds||hit.variant.enemyIds,capturable:raw.capturable!==false});
        }
      }
      const route={
        encounterId:zone.encounterId,floorId:zone.floorId,mapName:zone.name,
        battleAppearanceChance:Number(raw.weight)||1,
        appearanceInventoryItemIds:[...(zone.requireItems||[]),...(raw.requireItems||[])],
        appearanceInventoryItems:[...(zone.requireItems||[]),...(raw.requireItems||[])].map(id=>questItemMeta(id)||{id,name:'Item '+id}),
        notAppearanceInventoryItemIds:[...(zone.forbidItems||[]),...(raw.forbidItems||[])],
        questRequirement:zone.questRequirement||null,
        questZone:true
      };
      entries.push({species,variant,route});
    }
    maps.push({id:zone.id,floorId:zone.floorId,name:zone.name,entries,questZone:true,description:zone.description||''});
  }
}
function buildMaps(){
  const m=new Map();
  for(const species of db.species){
    for(const variant of species.wildLv1Variants||[]){
      for(const route of variant.routes||[]){
        const id=String(route.floorId);
        if(!m.has(id))m.set(id,{id,floorId:Number(route.floorId),name:route.mapName||('Floor '+id),entries:[],encounters:[],runtimeEncounters:[]});
        m.get(id).entries.push({species,variant,route});
      }
    }
  }
  maps=[...m.values()].sort((a,b)=>Number(a.id)-Number(b.id));
  for(const map of maps){
    const floorRuntime=encounterRuntime?.floors?.[String(map.floorId)]||null;
    const ids=floorRuntime?.targetEncounterIds||[...new Set(map.entries.map(x=>Number(x.route.encounterId)))];
    map.encounters=ids.map(id=>encounterCatalog.get(String(id))).filter(Boolean).sort((a,b)=>a.encounterId-b.encounterId);
    map.runtimeEncounters=(floorRuntime?.encounters||map.encounters).slice().sort((a,b)=>n(a.sourceOrder)-n(b.sourceOrder));
  }
  buildQuestMaps();
}
function currentMap(){return maps.find(x=>String(x.id)===String(state.mapId))||maps[0]}
function levelExpNeed(targetLevel){
  const arr=encounterRuntime?.progression?.userExpNeedByTargetLevel;
  const i=Math.trunc(n(targetLevel));
  if(Array.isArray(arr)&&i>=0&&i<arr.length&&Number.isFinite(Number(arr[i])))return Math.max(0,Math.trunc(Number(arr[i])));
  return null;
}
function playerLevelCap(){return Math.max(1,Math.trunc(n(encounterRuntime?.progression?.ybLevel)||140))}
function petServerLevelCap(){return Math.max(1,Math.trunc(n(encounterRuntime?.progression?.loadedMaxLevel)||160))}
function expToNext(level){
  level=Math.max(1,Math.trunc(n(level)||1));
  if(level>=playerLevelCap())return 0;
  const need=levelExpNeed(level+1);
  return need!=null?need:(100+Math.max(0,level-1)*45);
}
function petExpToNext(level){
  level=Math.max(1,Math.trunc(n(level)||1));
  if(level>=petServerLevelCap())return 0;
  const need=levelExpNeed(level+1);
  return need!=null?need:(18+Math.max(0,level-1)*4);
}
function packPetAllocPoint(stats){
  if(!stats)return null;
  const v=Math.trunc(n(stats.vital))&255,s=Math.trunc(n(stats.str))&255,t=Math.trunc(n(stats.tgh))&255,d=Math.trunc(n(stats.dex))&255;
  return ((v<<24)|(s<<16)|(t<<8)|d)|0;
}
function unpackPetAllocPoint(packed){
  if(!Number.isFinite(Number(packed)))return null;
  const x=Math.trunc(Number(packed))|0;
  return {vital:(x>>>24)&255,str:(x>>>16)&255,tgh:(x>>>8)&255,dex:x&255};
}
function petServerCombat(stats){
  if(!stats)return null;
  const vital=n(stats.vital),str=n(stats.str),tgh=n(stats.tgh),dex=n(stats.dex);
  return {
    attack:Math.trunc(str*.01+tgh*.001+vital*.001+dex*.0005),
    defense:Math.trunc(tgh*.01+str*.001+vital*.001+dex*.0005),
    quick:Math.trunc(dex*.01),
    maxHp:Math.trunc((vital*4+str+tgh+dex)*.01)
  };
}
function petFallbackCombat(pet){
  const stats=pet?.stats||{};
  const vital=n(stats.vital),str=n(stats.str),tgh=n(stats.tgh),dex=n(stats.dex);
  return {
    attack:Math.max(1,Math.trunc(str+tgh*.1+vital*.1+dex*.05)),
    defense:Math.max(1,Math.trunc(tgh+str*.1+vital*.1+dex*.05)),
    quick:Math.max(0,Math.trunc(dex)),
    maxHp:Math.max(1,Math.trunc(vital*4+str+tgh+dex))
  };
}
function petMaxHp(pet){
  if(!pet)return 1;
  if(pet.serverStats){
    pet.serverCombat=petServerCombat(pet.serverStats);
    if(n(pet.serverCombat?.maxHp)>0)return Math.max(1,Math.trunc(n(pet.serverCombat.maxHp)));
  }
  if(n(pet.serverCombat?.maxHp)>0)return Math.max(1,Math.trunc(n(pet.serverCombat.maxHp)));
  if(n(pet.maxHp)>0)return Math.max(1,Math.trunc(n(pet.maxHp)));
  return petFallbackCombat(pet).maxHp;
}
function syncPetBattleHp(pet,fillIfMissing=false){
  if(!pet)return null;
  const maxHp=petMaxHp(pet);
  pet.maxHp=maxHp;
  const hasHp=Number.isFinite(Number(pet.hp));
  if(!hasHp&&fillIfMissing)pet.hp=maxHp;
  else pet.hp=clamp(Math.trunc(n(pet.hp)),0,maxHp);
  return {hp:pet.hp,maxHp};
}
function petIsAlive(pet){
  if(!pet)return false;
  syncPetBattleHp(pet,true);
  return n(pet.hp)>0;
}
function petIsBattleActive(pet){
  return !!pet&&petIsAlive(pet)&&!battlePetOutIds.has(pet.id);
}
function playerComplianceParameter(target=state){
  if(!target)return null;
  const p=target.playerStats||{vital:0,str:0,tgh:0,dex:0};
  const vital=Math.max(0,Math.floor(n(p.vital))),str=Math.max(0,Math.floor(n(p.str)));
  const tgh=Math.max(0,Math.floor(n(p.tgh))),dex=Math.max(0,Math.floor(n(p.dex)));
  target.playerStats={vital,str,tgh,dex};

  // fixed CHAR_initcharWorkInt() rebuilds base WORK first; ITEM_equipEffect() then scans
  // every equip slot and applies the total. Slot state, not incremental +/- operations,
  // is therefore the single source of truth.
  const equip=sourcePlayerEquipmentModifiers(target);
  const baseAttack=Math.trunc(str+tgh*.1+vital*.1+dex*.05);
  const baseDefense=Math.trunc(tgh+str*.1+vital*.1+dex*.05);
  const baseQuick=Math.trunc(dex);
  const baseMaxHp=Math.max(0,Math.trunc(vital*4+str+tgh+dex));
  target.attack=Math.max(0,baseAttack+Math.trunc(n(equip.attack)));
  target.defense=Math.max(-100,baseDefense+Math.trunc(n(equip.defense)));
  target.dex=Math.max(-100,baseQuick+Math.trunc(n(equip.quick)));
  target.maxHp=clamp(baseMaxHp+Math.trunc(n(equip.hp)),0,10000000);
  // fixed player creation baseline CHAR_MAXMP=100; _FIX_MAXCHARMP applies equip MP and clamps 0..1000.
  target.maxMp=clamp(100+Math.trunc(n(equip.mp)),0,1000);
  target.hp=Math.min(Math.max(0,n(target.hp)),target.maxHp);
  target.mp=Math.min(Math.max(0,n(target.mp)),target.maxMp);
  target.playerEquipCompliance=equip;
  return {attack:target.attack,defense:target.defense,quick:target.dex,maxHp:target.maxHp,maxMp:target.maxMp,equip};
}
function allocatePlayerStat(key){
  const labels={vital:'體力 VITAL',str:'腕力 STR',tgh:'耐力 TOUGH',dex:'速度 DEX'};
  if(!labels[key]||!state)return false;
  if(!sourcePlayerCreationStatsReady(state)){addLog('請先確認原服創角四圍，再使用升級取得的能力點。','bad');return false;}
  const points=Math.max(0,Math.floor(n(state.skillPoints)));
  if(points<=0){addLog('目前沒有可分配的能力點。','bad');return false;}
  state.playerStats=Object.assign({vital:0,str:0,tgh:0,dex:0},state.playerStats||{});
  state.playerStats[key]=Math.max(0,Math.floor(n(state.playerStats[key])))+1;
  state.skillPoints=points-1;
  playerComplianceParameter(state);
  addLog(labels[key]+' +1；剩餘能力點 '+state.skillPoints+'。','good');
  save();render();
  return true;
}
function serverPetLevelUp(pet){
  if(pet?.petRank==null)return false;
  const alloc=unpackPetAllocPoint(pet?.allocPointPacked),stats=pet?.serverStats;
  const rank=Math.trunc(Number(pet.petRank));
  const range=(encounterRuntime?.progression?.petGrowthRankRand||[]).find(x=>Math.trunc(n(x.rank))===rank);
  if(!alloc||!stats||!range)return false;
  const param=[0,0,0,0];
  for(let i=0;i<10;i++)param[rnd(0,3)]++;
  const roll=rnd(Math.trunc(n(range.min)),Math.trunc(n(range.max)));
  const fRand=Math.fround(Math.fround(roll)*Math.fround(.01));
  const keys=['vital','str','tgh','dex'];
  for(let i=0;i<keys.length;i++){
    const key=keys[i];
    const a=Math.fround(Math.fround(alloc[key])*fRand),b=Math.fround(Math.fround(param[i])*fRand);
    pet.serverStats[key]=Math.trunc(n(pet.serverStats[key]))+Math.trunc(Math.fround(a+b));
  }
  pet.serverCombat=petServerCombat(pet.serverStats);
  syncPetBattleHp(pet,false);
  return true;
}
function eligibleEntries(map,encounterId=null){
  return (map?.entries||[]).filter(x=>routeUnlocked(x.route)&&(encounterId==null||Number(x.route?.encounterId)===Number(encounterId)));
}
function currentEncounter(map=currentMap()){
  if(!map||map.questZone)return null;
  const list=map.encounters||[];
  let hit=list.find(x=>String(x.encounterId)===String(state.encounterId));
  if(!hit){
    hit=list[0]||null;
    if(hit)state.encounterId=hit.encounterId;
  }
  return hit;
}
function pointInEncounter(encounter,x,y){
  const a=encounter?.area||{};
  return n(a.xMin)<=x&&x<=n(a.xMax)&&n(a.yMin)<=y&&y<=n(a.yMax);
}
function randomPointInEncounter(encounter){
  const a=encounter?.area||{};
  return {x:rnd(n(a.xMin),n(a.xMax)),y:rnd(n(a.yMin),n(a.yMax))};
}
function resolveEncounterAt(map,x,y){
  let hit=null;
  for(const encounter of map?.runtimeEncounters||[]){
    if(n(encounter.zorder)<=0||!pointInEncounter(encounter,x,y))continue;
    if(!hit||n(encounter.zorder)>n(hit.zorder))hit=encounter;
  }
  return hit;
}
function runtimeEntryForEncounter(map,encounter){
  const direct=(map?.entries||[]).find(x=>Number(x.route?.encounterId)===Number(encounter?.encounterId));
  if(direct)return direct;
  return {
    species:{clientLabel:'Encounter '+(encounter?.encounterId??'—'),animationGroupId:null},
    variant:{serverName:'原始野外群組',enemyIds:[],wildGrowth:1,captureBase:0,stats:{},elements:{},capturable:false},
    route:{encounterId:encounter?.encounterId,floorId:encounter?.floorId,mapName:map?.name||''}
  };
}
function weightedEntry(entries){
  if(!entries.length)return null;
  const weights=entries.map(x=>Math.max(.000001,n(x.route.battleAppearanceChance)||.000001));
  const total=weights.reduce((a,b)=>a+b,0);
  let roll=Math.random()*total;
  for(let i=0;i<entries.length;i++){
    roll-=weights[i];
    if(roll<=0)return entries[i];
  }
  return entries[entries.length-1];
}

function buildDynamicGroupCatalog(){
  const source=encounterRuntime?.groups||db?.dynamicGroups||{};
  dynamicGroupCatalog=new Map(Object.entries(source).map(([id,g])=>[String(id),g]));
}
function buildEncounterCatalog(){
  const all=[];
  for(const floor of Object.values(encounterRuntime?.floors||{}))all.push(...(floor.encounters||[]));
  if(!all.length)all.push(...(db?.encounters||[]));
  encounterCatalog=new Map(all.map(e=>[String(e.encounterId),e]));
}
function dynamicGroupUnlocked(spec){
  if(!spec)return false;
  const need=n(spec.appearByItemId), block=n(spec.notAppearByItemId);
  if(need&&!hasItem(need))return false;
  if(block&&hasItem(block))return false;
  return true;
}
function encounterDynamicFormation(encounter){
  if(!encounter||!dynamicGroupCatalog.size)return null;
  const choices=[];
  for(const ref of encounter.groups||[]){
    const spec=dynamicGroupCatalog.get(String(ref.groupId));
    if(!ref.resolved||!spec||!dynamicGroupUnlocked(spec))continue;
    if(!(spec.members||[]).some(m=>n(m.weight)>0&&n(m.createMax)>0&&m.validTemplate!==false))continue;
    choices.push({ref,spec,weight:Math.max(0,n(ref.weight))});
  }
  if(!choices.length)return null;
  const total=choices.reduce((sum,x)=>sum+x.weight,0);
  let picked=choices[choices.length-1];
  if(total>0){
    let roll=Math.random()*total;
    for(const choice of choices){
      roll-=choice.weight;
      if(roll<=0){picked=choice;break}
    }
  }
  return Object.assign({},picked.spec,{
    encounterId:encounter.encounterId,
    encounterMax:Math.max(1,Math.floor(n(encounter.enemyMax)||1)
    )
  });
}

function rollEnemyCreateStats(rawStats){
  // enemy.c：四圍各自 RAND(0,4)-2，再額外隨機分配 10 點。
  const st={
    vital:n(rawStats?.vital)+rnd(-2,2),
    str:n(rawStats?.str)+rnd(-2,2),
    tgh:n(rawStats?.tgh)+rnd(-2,2),
    dex:n(rawStats?.dex)+rnd(-2,2)
  };
  const allocatedFrom=Object.assign({},st);
  const keys=['vital','str','tgh','dex'];
  for(let i=0;i<10;i++)st[keys[rnd(0,3)]]++;
  return {stats:st,allocatedFrom};
}
function serverEnemyDerived(raw,level,rolledStats){
  const init=n(raw?.serverInitNum);
  const lvup=Math.trunc(n(raw?.serverLvUpPoint));
  const factor=(level-1)*lvup+init;
  const charStats={
    vital:Math.trunc(factor*n(rolledStats.vital)),
    str:Math.trunc(factor*n(rolledStats.str)),
    tgh:Math.trunc(factor*n(rolledStats.tgh)),
    dex:Math.trunc(factor*n(rolledStats.dex))
  };
  // char.c CHAR_initcharWorkInt() 的 C int 截斷規則。
  const attack=Math.trunc(
    charStats.str*.01+
    charStats.tgh*.001+
    charStats.vital*.001+
    charStats.dex*.0005
  );
  const defense=Math.trunc(
    charStats.tgh*.01+
    charStats.str*.001+
    charStats.vital*.001+
    charStats.dex*.0005
  );
  const quick=Math.trunc(charStats.dex*.01);
  const maxHp=Math.trunc((charStats.vital*4+charStats.str+charStats.tgh+charStats.dex)*.01);
  return {factor,charStats,attack,defense,quick,maxHp};
}
function enemyRandomChangeType(enemyId){
  enemyId=Number(enemyId);
  const cfg=encounterRuntime?.randomChange||{};
  const inRanges=ranges=>(ranges||[]).some(([a,b])=>enemyId>=Number(a)&&enemyId<=Number(b));
  if(inRanges(cfg.humanEnemyRanges))return 'human';
  if(inRanges(cfg.petEnemyRanges))return 'pet';
  return null;
}
function applyEnemyRandomChange(raw,elements,petSkills){
  const enemyId=Number(raw?.enemyId)||0;
  const type=raw?.randomChangeType||enemyRandomChangeType(enemyId);
  const result={
    type:type||null,
    elements:Object.assign({},elements||{}),
    petSkills:Array.isArray(petSkills)?petSkills.slice():[],
    gymBodySymbol:null,
    dojoWeapon:null,
    skillRule:null
  };
  if(!type)return result;
  const cfg=encounterRuntime?.randomChange||{};
  if(type==='human'){
    const bodies=cfg.gymBodySymbols||[];
    if(bodies.length)result.gymBodySymbol=bodies[Math.floor(Math.random()*bodies.length)];
    const work=(rnd(0,20)-10)*10;
    let work2=100-Math.abs(work);
    if(rnd(0,1))work2*=-1;
    result.elements={earth:work,water:work2,fire:-work,wind:-work2};

    const weapons=cfg.weaponPool||['none','fist','axe','club','spear','bow','boomerang','boundthrow','breakthrow'];
    result.dojoWeapon=weapons[Math.floor(Math.random()*weapons.length)]||'none';
    const normal=new Set(['fist','bow','boomerang','boundthrow','breakthrow']);
    if(normal.has(result.dojoWeapon)){
      result.petSkills[0]=1;result.petSkills[1]=1;
      result.skillRule='normal-attack';
    }else{
      result.petSkills[0]='EnemyGymSkill';result.petSkills[1]='EnemyGymSkill';
      result.skillRule='compile-time EnemyGymSkill pool';
    }
  }else if(type==='pet'){
    result.petSkills[0]='EnemyGymSkill';result.petSkills[1]='EnemyGymSkill';
    result.skillRule='compile-time EnemyGymSkill pool';
  }
  return result;
}
function rollEnemyDropSlots(raw,unitId=null){
  const items=Array.isArray(raw?.enemyItems)?raw.enemyItems:[];
  const probs=Array.isArray(raw?.itemProbs)?raw.itemProbs:[];
  const resolved=items.length>=10&&probs.length>=10;
  const drops=[],attempts=[];
  if(!resolved)return {resolved:false,drops,attempts};

  // fixed enemy.c interleaves each probability roll with ITEM_makeItemAndRegist immediately:
  // slot roll -> on hit 66 item-make RNG calls -> next slot roll.
  for(let i=0;i<10;i++){
    const probabilityRaw=Math.trunc(n(probs[i]));
    if(!probabilityRaw)continue;
    const probabilityRoll=cRand(0,999);
    const attempt={slot:i+1,itemId:Math.trunc(n(items[i])),probabilityRaw,probabilityRoll,hit:probabilityRoll<probabilityRaw};
    attempts.push(attempt);
    if(!attempt.hit)continue;

    const itemIndex=sourceItemRuntimeAlloc(attempt.itemId,null,{
      owner:unitId==null?null:'enemy:'+unitId,source:'enemy-drop',enemySlot:attempt.slot
    });
    attempt.itemIndex=itemIndex;
    if(itemIndex>=0)drops.push(Object.assign({},attempt));
  }
  return {resolved:true,drops,attempts};
}
function sourceDiscardBattleGetItemPool(){
  let freed=0;
  for(const item of battleGetItemPool||[]){
    const idx=Math.trunc(Number(item?.itemIndex));
    if(!Number.isFinite(idx))continue;
    const slot=sourceItemRuntimeSlot(idx);
    if(slot&&slot.owner==='battle-getitem'&&sourceItemRuntimeFree(idx))freed++;
  }
  battleGetItemPool=[];
  return freed;
}
function sourceTakeBattleGetItemPool(){
  const out=Array.isArray(battleGetItemPool)?battleGetItemPool.slice():[];
  battleGetItemPool=[];
  return out;
}
function sourceQueueEnemyCarriedLoot(unit,attackListCount=1){
  if(!unit)return [];
  const queued=[];
  const allnum=Math.max(1,Math.trunc(n(attackListCount)||1));

  for(const drop of unit.enemyDrops||[]){
    const item={
      itemId:Math.trunc(n(drop?.itemId)),slot:Math.trunc(n(drop?.slot)),
      probabilityRaw:Math.trunc(n(drop?.probabilityRaw)),
      itemIndex:Math.trunc(Number(drop?.itemIndex)),unitId:unit.id
    };

    const runtimeSlot=sourceItemRuntimeSlot(item.itemIndex);
    if(!runtimeSlot||runtimeSlot.owner!=='enemy:'+unit.id)continue;

    // fixed BATTLE_AddExpItem always consumes RAND(0, allnum-1) to choose pEntryPlayer[k].
    // This single-player web maps Player and owned Pet back to the same player getitem[3],
    // but the RAND call itself still belongs to the source RNG sequence.
    item.sourceOwnerRoll=cRand(0,allnum-1);

    // Equivalent of CHAR_setItemIndex(enemy,item,-1): ownership leaves Enemy immediately.
    sourceItemRuntimeSetOwner(item.itemIndex,'battle-getitem','battle-getitem');

    if(battleGetItemPool.length<3){
      battleGetItemPool.push(item);
      item.sourceGetItemAction='fill';
    }else if(cRand(0,1)){
      const replace=cRand(0,2);
      const old=battleGetItemPool[replace];
      if(Number.isFinite(Number(old?.itemIndex)))sourceItemRuntimeFree(old.itemIndex);
      battleGetItemPool[replace]=item;
      item.sourceGetItemAction='replace';
      item.sourceReplaceSlot=replace;
    }else{
      sourceItemRuntimeFree(item.itemIndex);
      item.sourceGetItemAction='discard';
    }
    queued.push(item);
  }
  return queued;
}
function enemyServerBaseExp(raw,level){
  if(!raw||raw?.enemyDuelPoint>0||raw?.enemyExpResolvable===false)return null;
  const override=Number(raw?.enemyExpOverride);
  if(Number.isFinite(override)&&override!==-1)return Math.trunc(override);
  const table=encounterRuntime?.enemyExp?.baseTable||[];
  const idx=Math.trunc(n(level))-1;
  if(idx<0||idx>=table.length)return 0;
  const rankBonus=Number(raw?.enemyExpRankBonus);
  const alpha=Number(raw?.enemyExpAlpha);
  if(!Number.isFinite(rankBonus)||!Number.isFinite(alpha))return null;
  const sum=Math.fround(Math.fround(rankBonus)+Math.fround(alpha));
  const scaled=Math.fround(sum*Math.trunc(n(level)));
  const ret=Math.trunc(Math.fround(Number(table[idx])+scaled));
  return ret<1?1:ret;
}
function serverBattleExpForRecipient(unit,recipientLevel){
  if(unit?.serverExpBase==null)return null;
  const cfg=encounterRuntime?.enemyExp||{};
  const maxGap=Math.trunc(n(cfg.expGetMaxLevel)||5);
  const div=Math.trunc(n(cfg.expGetDiv)||15);
  const diff=Math.trunc(n(recipientLevel))-Math.trunc(n(unit.level));
  let nowExp=Math.trunc(n(unit.serverExpBase));
  if(diff>maxGap){
    let factor=maxGap+div-diff;
    if(factor>div)factor=div;
    if(factor<=0)nowExp=1;
    else{
      nowExp=Math.trunc(nowExp*factor/div);
      if(nowExp<1)nowExp=1;
    }
  }
  const multiplier=Math.max(1,Math.trunc(n(cfg.battleExpMultiplier)||1));
  return Math.trunc(nowExp*multiplier);
}
function sourceRewardActor(actor){
  if(!actor)return null;
  if(actor.kind==='player')return {kind:'player'};
  if(actor.kind==='pet'){
    const petId=actor.petId??actor.pet?.id??null;
    return petId?{kind:'pet',petId}:null;
  }
  return {kind:String(actor.kind||'other')};
}
function sourceMarkEnemyDeathCredit(unit,actors=[]){
  if(!unit||n(unit.hp)>0||unit.sourceRewardProcessed)return null;
  // fixed BATTLE_AddExpItem sets CHAR_ISDIE immediately after this scan, so reward ownership is fixed once.
  unit.sourceRewardProcessed=true;

  const credits=[],seen=new Set();
  for(const raw of actors||[]){
    const a=sourceRewardActor(raw);
    if(!a||(a.kind!=='player'&&a.kind!=='pet'))continue;
    const key=a.kind==='pet'?('pet:'+String(a.petId)):'player';
    if(seen.has(key))continue;
    seen.add(key);credits.push(a);
  }
  unit.sourceRewardCredits=credits;
  unit.sourceRewardPlayerSide=credits.length>0;

  // fixed BATTLE_AddExpItem handles Enemy carried item getitem[] before EXP / Pet AI.
  unit.sourceRewardCarriedLoot=credits.length
    ?sourceQueueEnemyCarriedLoot(unit,credits.length)
    :[];

  // AI_FIX_PETWIN / PETGOLDWIN happens here in BATTLE_AddExpItem, not at battle finish.
  const aiChanges=[];
  for(const credit of credits){
    if(credit.kind!=='pet')continue;
    const pet=state?.petBox?.find?.(p=>p.id===credit.petId)||null;
    if(!pet)continue;
    const change=sourcePetWinVariableAi(pet,unit.level,pet.level);
    aiChanges.push({petId:pet.id,delta:change.delta});
  }
  unit.sourceRewardPetAi=aiChanges;
  return {credits,aiChanges};
}
function sourceEnemyRewardCredits(unit){
  return Array.isArray(unit?.sourceRewardCredits)?unit.sourceRewardCredits:[];
}
function fallbackBattleExp(defeated){
  const growth=(defeated?.dynamicGroup&&Array.isArray(defeated?.units)&&defeated.units.length)
    ?defeated.units.reduce((s,u)=>s+Math.max(1,n(u.wildGrowth)||1),0)/defeated.units.length
    :Math.max(1,n(defeated?.entry?.variant?.wildGrowth)||1);
  const unitCount=Math.max(1,Array.isArray(defeated?.units)?defeated.units.length:1);
  return Math.max(6,Math.round((7+growth*2.2)*unitCount));
}
function sourceEnemyPetFlg(enemyId){
  const id=Number(enemyId);
  if(!Number.isFinite(id)||!encounterRuntime?.enemyPetFlg)return null;
  const key=String(Math.trunc(id));
  if(!Object.prototype.hasOwnProperty.call(encounterRuntime.enemyPetFlg,key))return null;
  const value=Number(encounterRuntime.enemyPetFlg[key]);
  return Number.isFinite(value)?Math.trunc(value):null;
}
function makeEnemyUnit(raw,fallbackEntry,index=0){
  const base=fallbackEntry?.variant||{};
  const baseStats=Object.assign({},base.stats||{},raw?.stats||{});
  const levelMin=Math.max(1,n(raw?.levelMin)||n(base.levelMin)||1);
  const levelMax=Math.max(levelMin,n(raw?.levelMax)||n(base.levelMax)||levelMin);
  const level=rnd(levelMin,levelMax);
  const hasServerCreate=raw?.validTemplate!==false&&raw?.serverInitNum!=null&&raw?.serverLvUpPoint!=null;

  let st=Object.assign({},baseStats),allocatedFrom=null,server=null;
  let hp,attack,defense,quick=0;
  if(hasServerCreate){
    const rolled=rollEnemyCreateStats(baseStats);
    st=rolled.stats;allocatedFrom=rolled.allocatedFrom;
    server=serverEnemyDerived(raw,level,st);
    hp=Math.max(1,server.maxHp);
    attack=server.attack;
    defense=server.defense;
    quick=server.quick;
  }else{
    const vit=Math.max(1,n(st.vital)||8);
    const str=Math.max(1,n(st.str)||6);
    const tgh=Math.max(1,n(st.tgh)||6);
    hp=Math.max(35,Math.round(28+vit*5.5));
    attack=Math.max(3,Math.round(3+str*.62));
    defense=Math.max(0,Math.round(tgh*.28));
    quick=Math.max(0,Math.round(n(st.dex)||0));
  }

  // fixed enemy.c: each successful carried-drop roll creates its existing item immediately,
  // then STYLE weapon creation happens, then ENEMY_RandomChange.
  const serverExpBase=enemyServerBaseExp(raw,level);
  const resolvedEnemyId=Number(raw?.enemyId??base.enemyIds?.[0]??0)||null;
  // Web-only identity must not advance source RNG.
  sourceEnemyUnitSerial++;
  const unitId='unit-'+sourceEnemyUnitSerial+'-'+index;
  const aiRow=resolvedEnemyId!=null?(enemyAiDb?.byEnemyId?.[String(resolvedEnemyId)]||null):null;
  const enemyDropRoll=rollEnemyDropSlots(raw,unitId);
  const runtimeDrops=enemyDropRoll.drops;

  const style=Math.max(0,Math.trunc(n(aiRow?.sty)));
  const styleWeaponId=sourceEnemyStyleWeaponItemId(style);
  const styleItemIndex=styleWeaponId==null?-1:sourceItemRuntimeAlloc(styleWeaponId,null,{owner:'enemy:'+unitId,source:'enemy-style'});
  let weaponItemIndex=styleItemIndex;
  let equippedWeaponId=styleItemIndex>=0?styleWeaponId:null;

  // 原 ENEMY_RandomChange() 在 STYLE 建立後執行。人形分支 DoujyouRandomWeponSet()
  // 一律先 ITEM_endExistItemsOne(CHAR_ARM)，再視抽中的武器建立新的 existing item。
  const change=applyEnemyRandomChange(
    raw,
    Object.assign({},raw?.elements||base.elements||{}),
    Array.isArray(raw?.petSkills)?raw.petSkills:[]
  );
  if(change.type==='human'){
    const oldSlot=sourceItemRuntimeSlot(styleItemIndex);
    if(oldSlot&&oldSlot.owner==='enemy:'+unitId)sourceItemRuntimeFree(styleItemIndex);
    weaponItemIndex=-1;equippedWeaponId=null;
    const dojoWeaponId=sourceEnemyDojoWeaponItemId(change.dojoWeapon);
    if(dojoWeaponId!=null){
      const replacement=sourceItemRuntimeAlloc(dojoWeaponId,null,{owner:'enemy:'+unitId,source:'enemy-dojo-weapon'});
      if(replacement>=0){weaponItemIndex=replacement;equippedWeaponId=dojoWeaponId;}
    }
  }

  // 原 CHAR_complianceParameter()：CHAR_initcharWorkInt() 後 ITEM_equipEffect()。
  // 這批 Enemy 自動武器 modifier min=max，所以數值可直接套來源值；建立武器本身
  // 已在 sourceItemRuntimeAlloc() 精確消耗 ITEM_makeItem 的 66 顆 RNG。
  const equipped=sourceEnemyWeaponCompliance({attack,defense,quick,maxHp:hp,maxMp:0},equippedWeaponId);
  attack=equipped.attack;defense=equipped.defense;quick=equipped.quick;hp=Math.max(1,equipped.maxHp);

  return {
    id:unitId,
    name:raw?.name||fallbackEntry?.species?.clientLabel||base.serverName||('Enemy '+(raw?.enemyId??'')),
    enemyId:resolvedEnemyId,sourcePetFlg:sourceEnemyPetFlg(resolvedEnemyId),sourceFoxTurn:null,sourceFoxImage:false,
    ai:aiRow,
    statusResist:resolvedEnemyId!=null?(enemyAiDb?.byEnemyId?.[String(resolvedEnemyId)]?.z?.slice?.(0,6)||[0,0,0,0,0,0]):[0,0,0,0,0,0],
    tempNo:Number(raw?.tempNo??base.tempNo??0)||null,
    // Enemy 原始 MP/MAXMP=0；目前這批自動武器 modifyMp 皆 0。
    level,hp,maxHp:hp,mp:0,maxMp:equipped.maxMp,attack,defense,quick,
    stats:st,
    sourceBaseStats:Object.assign({},baseStats),
    allocatedFrom,
    serverDerived:server,
    serverEquipped:equipped,
    serverInitNum:raw?.serverInitNum??null,
    serverLvUpPoint:raw?.serverLvUpPoint??null,
    sourceTemplate:raw?Object.assign({},raw,{
      stats:Object.assign({},raw.stats||{}),
      elements:Object.assign({},raw.elements||{}),
      petSkills:Array.isArray(raw.petSkills)?raw.petSkills.slice():[],
      enemyItems:Array.isArray(raw.enemyItems)?raw.enemyItems.slice():[],
      itemProbs:Array.isArray(raw.itemProbs)?raw.itemProbs.slice():[]
    }):null,
    elements:change.elements,
    petSkills:change.petSkills,
    randomChange:change.type?change:null,
    animationGroupId:raw?.animationGroupId??fallbackEntry?.species?.animationGroupId??null,
    wildGrowth:n(raw?.wildGrowth)||n(base.wildGrowth)||1,
    captureBase:raw?.captureBase!=null?n(raw.captureBase):n(base.captureBase),
    captureRule:raw?.captureRule??base.captureRule??null,
    capturable:raw?.capturable!=null?raw.capturable:(base.capturable!==false),
    questDrop:raw?.questDrop||null,
    enemyDrops:runtimeDrops,
    serverDropTable:enemyDropRoll.resolved,
    style,styleWeaponId,styleItemIndex,
    equippedWeaponId,weaponItemIndex,
    weaponType:equipped.weaponType,weaponCritical:equipped.weaponCritical,throwWeapon:equipped.throwWeapon,
    weaponAttackNumMin:equipped.attackNumMin,weaponAttackNumMax:equipped.attackNumMax,weaponName:equipped.weaponName,
    serverExpBase,
    enemyExpOverride:raw?.enemyExpOverride??null,
    enemyExpRankIndex:raw?.enemyExpRankIndex??null,
    enemyExpRankBonus:raw?.enemyExpRankBonus??null,
    enemyExpAlpha:raw?.enemyExpAlpha??null,
    size:n(raw?.size),
    isBig:!!raw?.isBig
  };
}
function randomEnemyReplacement(member){
  const sourceId=Number(member?.enemyId)||0;
  const pool=encounterRuntime?.randomEnemy?.tables?.[String(sourceId)];
  if(!Array.isArray(pool)||!pool.length)return Object.assign({},member,{sourceEnemyId:sourceId,resolvedEnemyId:sourceId});
  const targetId=Number(pool[Math.floor(Math.random()*pool.length)]);
  const template=encounterRuntime?.randomEnemy?.templates?.[String(targetId)];
  if(!template)return Object.assign({},member,{sourceEnemyId:sourceId,resolvedEnemyId:targetId,enemyId:targetId,validTemplate:false,randomEnemy:true});
  return Object.assign({},member,template,{
    slot:member.slot,
    weight:n(member.weight),
    sourceEnemyId:sourceId,
    resolvedEnemyId:targetId,
    enemyId:targetId,
    randomEnemy:true
  });
}
function buildDynamicFormation(spec,entry){
  // 原 ENEMY_getEnemy() 先對每個 Group slot 執行一次 RandomEnemy 替換，
  // 同一 slot 在整場生成期間固定使用該替代 Enemy。
  const slots=(spec?.members||[]).map(randomEnemyReplacement);
  const validSlots=slots.filter(x=>x.validTemplate!==false&&n(x.createMax)>0);
  const selectable=validSlots.filter(x=>n(x.weight)>0);
  if(!validSlots.length||!selectable.length)return [];

  // createenemynum 會計入權重 0 的有效 slot；這可能使 entrymax 高於實際可抽滿數量，
  // 原碼最後由 100 次 loop guard 自然截斷。
  const createenemynum=validSlots.reduce((sum,x)=>sum+Math.max(0,Math.floor(n(x.createMax))),0);
  const enemyentrymax=Math.min(Math.max(1,Math.floor(n(spec.encounterMax)||1)),createenemynum);
  if(enemyentrymax<1)return [];
  let entrymax=rnd(1,enemyentrymax);

  // RandomEnemy 替換後，多個 slot 可能指向同一 Enemy array。
  // 原碼限制 = ENEMY_CREATEMAXNUM * samecount。
  const sameCounts=new Map();
  for(const slot of validSlots){
    const key=Number(slot.enemyId);
    sameCounts.set(key,(sameCounts.get(key)||0)+1);
  }

  const totalWeight=selectable.reduce((sum,x)=>sum+Math.max(0,n(x.weight)),0);
  if(totalWeight<=0)return [];
  const counts=new Map(),units=[];
  let bigcnt=0,guard=0;
  while(units.length<entrymax&&guard<100){
    guard++;
    let roll=Math.random()*totalWeight,pick=selectable[selectable.length-1];
    for(const slot of selectable){
      roll-=Math.max(0,n(slot.weight));
      if(roll<=0){pick=slot;break}
    }
    const key=Number(pick.enemyId);
    const used=counts.get(key)||0;
    const samecount=sameCounts.get(key)||1;
    const limit=Math.max(0,Math.floor(n(pick.createMax)))*samecount;
    if(used>=limit)continue;

    const unit=makeEnemyUnit(pick,entry,units.length);
    unit.sourceEnemyId=pick.sourceEnemyId??pick.enemyId;
    unit.randomEnemy=!!pick.randomEnemy;

    if(unit.isBig){
      if(bigcnt>=5){
        entrymax--;
        continue;
      }
      if(units.length>4){
        const normalIndex=units.slice(0,5).findIndex(u=>!u.isBig);
        if(normalIndex<0)continue;
        const displaced=units[normalIndex];
        units[normalIndex]=unit;
        units.push(displaced);
      }else{
        units.push(unit);
      }
      bigcnt++;
    }else{
      units.push(unit);
    }
    counts.set(key,used+1);
  }
  return units;
}
function livingEnemyUnits(){
  if(!enemy)return [];
  if(Array.isArray(enemy.units)&&enemy.units.length)return enemy.units.filter(u=>u.hp>0);
  return enemy.hp>0?[enemy]:[];
}
function enemyUnitHidden(unit){return !!unit?.earthRoundState?.hidden}
function targetableEnemyUnits(){return livingEnemyUnits().filter(u=>!enemyUnitHidden(u))}
function targetEnemyUnit(){return targetableEnemyUnits()[0]||null}
function syncEnemyTarget(){
  const t=targetEnemyUnit();if(!enemy||!t)return;
  enemy.level=t.level;enemy.name=t.name;enemy.hp=t.hp;enemy.maxHp=t.maxHp;enemy.attack=t.attack;enemy.defense=t.defense;
}
function sourceInitPlayerSideEntrySnapshot(){
  if(!enemy)return [];
  const entries=[{kind:'player',level:Math.max(1,Math.trunc(n(state?.level)))}];
  const pet=activePet();
  // 原 Battle Entry 建立時只有實際出戰的寵會進 side entry；之後 HP=0 不會自動等於 BATTLE_Exit。
  if(pet&&petIsBattleActive(pet)){
    entries.push({kind:'pet',petId:pet.id,level:Math.max(1,Math.trunc(n(pet.level)))});
  }
  enemy.sourcePlayerSideEntries=entries;
  return entries;
}
function sourceBattleSurpriseRoll(){
  const luck=Math.trunc(n(state?.luck));
  let a=0,b=7;
  if(luck===5){a=20;b=0}
  else if(luck===4){a=15;b=2}
  else if(luck===3){a=10;b=3}
  else if(luck===2){a=5;b=5}
  const roll=cRand(1,100);
  let side=null;
  if(roll<=a)side='enemy';
  else if(roll<a+b)side='player';
  return {luck,a,b,roll,side};
}
function sourceInitBattleSurprise(map){
  if(!enemy)return {eligible:false,side:null};
  enemy.sourceSurprisePending=false;
  enemy.sourceSurpriseSide=null;
  enemy.sourceSurpriseRoll=null;
  enemy.sourceSurpriseLuck=Math.trunc(n(state?.luck));
  // fixed BATTLE_SurpriseCheck：BattleArray.WinFunc != NULL 直接 return 0。
  // 現行 questZone 都是腳本／任務戰，沒有足夠證據一律當成普通 WinFunc=NULL，
  // 因此只在原始一般 encounter（非 questZone）啟用，避免對腳本 Boss 猜先制。
  if(map?.questZone)return {eligible:false,side:null};
  const result=sourceBattleSurpriseRoll();
  enemy.sourceSurpriseRoll=result.roll;
  enemy.sourceSurpriseLuck=result.luck;
  enemy.sourceSurpriseSide=result.side;
  enemy.sourceSurprisePending=!!result.side;
  return Object.assign({eligible:true},result);
}
function sourceSurpriseSkipAction(actor){
  if(!actor?.sourceSurpriseSkip)return false;
  if(actor.kind==='enemy')addLog((actor.label||'敵人')+' 因你取得先制，本回合無法行動。','good');
  else addLog((actor.kind==='player'?'你':actor.label||'出戰寵物')+' 因遭到偷襲，本回合無法行動。','bad');
  return true;
}
function spawnEnemy(context=null){
  const map=context?.map||currentMap();
  if(!map)return;
  resetBattleStatuses();
  let entry=null,dynamicSpec=null;
  if(map.questZone){
    const entries=eligibleEntries(map);
    if(!entries.length)return;
    entry=weightedEntry(entries);
  }else{
    const selected=context?.selected||currentEncounter(map);
    if(!selected)return;
    const point=context?.point||randomPointInEncounter(selected);
    const encounter=context?.encounter||resolveEncounterAt(map,point.x,point.y);
    if(!encounter)return;
    entry=runtimeEntryForEncounter(map,encounter);
    dynamicSpec=encounterDynamicFormation(encounter);
    if(!dynamicSpec)return;
    dynamicSpec.roamX=point.x;
    dynamicSpec.roamY=point.y;
    dynamicSpec.selectedEncounterId=selected.encounterId;
    dynamicSpec.encounterCep=context?.cepUsed??null;
    dynamicSpec.encounterRoll=context?.roll??null;
  }
  const consumeId=map.questZone?n(entry.variant.consumeOnSpawnItemId):0;
  if(consumeId){
    if(!hasItem(consumeId))return;
    consumeItem(consumeId,1);
    addLog('依原 NPC steal 規則，開戰收走 Item '+consumeId+'。','pet');
  }
  const formation=Array.isArray(entry.variant.formation)?entry.variant.formation:[];
  dynamicSpec=dynamicSpec||entry.variant.dynamicFormation;
  if(formation.length||dynamicSpec){
    let units=[],label='';
    if(dynamicSpec){
      units=buildDynamicFormation(dynamicSpec,entry);
      label=(dynamicSpec.encounterId!=null?('Encounter '+dynamicSpec.encounterId+' / '):'')+'Group '+(dynamicSpec.groupId??'—')+' · '+units.length+' 隻'+(dynamicSpec.roamX!=null?' @ ('+dynamicSpec.roamX+','+dynamicSpec.roamY+')':'');
    }else{
      let idx=0;
      for(const member of formation){
        const count=Math.max(1,Math.floor(n(member.count)||1));
        for(let i=0;i<count;i++)units.push(makeEnemyUnit(member,entry,idx++));
      }
      label=formation.map(x=>(x.name||('Enemy '+x.enemyId))+' ×'+Math.max(1,Math.floor(n(x.count)||1))).join('、');
    }
    if(!units.length)return;
    for(let i=0;i<units.length;i++)units[i].battleSlot=i;
    const first=units[0];
    enemy={
      entry,units,groupBattle:true,dynamicGroup:!!dynamicSpec,sourceBattleTurn:0,
      encounterId:dynamicSpec?.encounterId??null,groupId:dynamicSpec?.groupId??null,
      selectedEncounterId:dynamicSpec?.selectedEncounterId??dynamicSpec?.encounterId??null,
      roamX:dynamicSpec?.roamX??null,roamY:dynamicSpec?.roamY??null,
      encounterCep:dynamicSpec?.encounterCep??null,encounterRoll:dynamicSpec?.encounterRoll??null,
      level:first.level,name:first.name,hp:first.hp,maxHp:first.maxHp,attack:first.attack,defense:first.defense
    };
    state.battles++;
    addLog((dynamicSpec?'遭遇原始遇敵群組：':'遭遇任務編成：')+label+'。');
    sourceInitPlayerSideEntrySnapshot();
    const surprise=sourceInitBattleSurprise(map);
    if(surprise.side==='enemy'){
      addLog('先制成功：原 BATTLE_SurpriseCheck roll '+surprise.roll+'，敵方首回合不能正常行動。','good');
    }else if(surprise.side==='player'){
      addLog('遭到偷襲：原 BATTLE_SurpriseCheck roll '+surprise.roll+'，你與出戰寵首回合不能正常行動。','bad');
      attackTurn();
      return;
    }
    render();return;
  }
  const unit=makeEnemyUnit(null,entry,0);
  unit.battleSlot=0;
  enemy=Object.assign({entry,groupBattle:false,dynamicGroup:false,sourceBattleTurn:0},unit);
  state.battles++;
  addLog('遭遇 Lv'+enemy.level+' '+enemy.name+'。');
  sourceInitPlayerSideEntrySnapshot();
  const surprise=sourceInitBattleSurprise(map);
  if(surprise.side==='enemy'){
    addLog('先制成功：原 BATTLE_SurpriseCheck roll '+surprise.roll+'，敵方首回合不能正常行動。','good');
  }else if(surprise.side==='player'){
    addLog('遭到偷襲：原 BATTLE_SurpriseCheck roll '+surprise.roll+'，你與出戰寵首回合不能正常行動。','bad');
    attackTurn();
    return;
  }
  render();
}
function activePet(){return state.petBox.find(p=>p.id===state.activePetId)||null}
function hasPetTempNo(tempNo){return state.petBox.some(p=>Number(p.tempNo)===Number(tempNo))}
function removeOnePetTempNo(tempNo){
  const idx=state.petBox.findIndex(p=>Number(p.tempNo)===Number(tempNo));
  if(idx<0)return false;
  const id=state.petBox[idx].id;
  state.petBox.splice(idx,1);
  state.team=state.team.map(x=>x===id?null:x);
  if(state.activePetId===id)state.activePetId=state.team.find(pid=>pid&&petIsAlive(state.petBox.find(p=>p.id===pid)))||null;
  return true;
}
function addQuestRewardPet(){
  const p=sourceCreateQuestGetPet(730);
  if(!p)return null;
  state.petBox.push(p);
  const open=state.team.findIndex(x=>!x);
  if(open>=0)state.team[open]=p.id;
  if(!state.activePetId)state.activePetId=p.id;
  return p;
}
function addEvent83Pet(){
  if(hasPetTempNo(854))return state.petBox.find(p=>Number(p.tempNo)===854);
  const p=sourceCreateQuestGetPet(854,{event83:true});
  if(!p)return null;
  state.petBox.push(p);
  const open=state.team.findIndex(x=>!x);
  if(open>=0)state.team[open]=p.id;
  if(!state.activePetId)state.activePetId=p.id;
  return p;
}
function addMarefiaPet(){
  let p=state.petBox.find(x=>Number(x.tempNo)===718);
  if(p)return p;
  p=sourceCreateQuestGetPet(718,{levelCap:10,event71Prerequisite:true,memoryRoute:true});
  if(!p)return null;
  state.petBox.push(p);
  const open=state.team.findIndex(x=>!x);
  if(open>=0)state.team[open]=p.id;
  if(!state.activePetId)state.activePetId=p.id;
  return p;
}
function marefiaPet(){return state.petBox.find(p=>Number(p.tempNo)===718)||null}
function sourceMarefiaLevelLimitPenalty(pet,currentLevel){
  if(!pet||Number(pet.tempNo)!==718||Math.trunc(n(currentLevel))%20!==0)return null;
  const alloc=unpackPetAllocPoint(pet.allocPointPacked);
  if(!alloc)return null;

  // fixed CHAR_CheckPetDoLimitlevel()：718 在「升級前目前 level % 20 == 0」時，
  // 先做 3 次 RAND(0,3)，每次讓對應 ALLOCPOINT -1，再 clamp >=0。
  // 這發生在 CHAR_LevelUpCheck 內，早於 BATTLE_GetExpGold 後面的 CHAR_PetLevelUp loop。
  const keys=['vital','str','tgh','dex'];
  const before=Object.assign({},alloc);
  const rolls=[];
  for(let j=0;j<3;j++){
    const k=cRand(0,3);
    rolls.push(k);
    const key=keys[k];
    alloc[key]=Math.max(0,Math.trunc(n(alloc[key]))-1);
  }
  pet.allocPointPacked=packPetAllocPoint(alloc);
  return {level:Math.trunc(n(currentLevel)),before,after:Object.assign({},alloc),rolls};
}

function awardPetExp(p,amount){
  if(!p)return;
  const isMarefia=Number(p.tempNo)===718;
  const maxLevel=isMarefia?Math.max(1,n(p.levelCap)||10):petServerLevelCap();
  p.exp=n(p.exp)+Math.max(1,Math.round(amount));

  // fixed BATTLE_GetExpGold 順序：
  // 1) CHAR_LevelUpCheck 先把這次可升的所有 level 一口氣處理完；
  // 2) 然後才 for(j=0;j<UpLevel;j++) CHAR_PetLevelUp + AI_FIX_PETLEVELUP。
  let upCount=0;
  const marefiaPenalties=[];
  while(p.level<maxLevel){
    const need=petExpToNext(p.level);
    if(need<=0||p.exp<need)break;

    // CHAR_CheckPetDoLimitlevel(pet, owner, level) 在 level++ 前執行。
    // 單機版沒有不同 owner/轉手路徑，因此只接目前可達的 level%20 分支。
    if(isMarefia){
      const penalty=sourceMarefiaLevelLimitPenalty(p,p.level);
      if(penalty)marefiaPenalties.push(penalty);
    }

    p.exp-=need;
    p.level++;
    upCount++;
  }

  let growthCount=0;
  for(let j=0;j<upCount;j++){
    if(serverPetLevelUp(p))growthCount++;
    sourcePetAddVariableAi(p,500);
  }

  if(isMarefia&&p.level>=maxLevel){
    const next=petExpToNext(p.level);
    if(next>0)p.exp=Math.min(p.exp,Math.max(0,next-1));
  }
  if(upCount){
    addLog(p.name+' 升到 Lv.'+p.level+'（'+upCount+' 級）'+(growthCount?'，已套用原 CHAR_PetLevelUp 成長 '+growthCount+' 次。':'。')
      +(marefiaPenalties.length?'；瑪蕾菲雅跨 20 級倍數時已先套 CHAR_CheckPetDoLimitlevel 成長底值衰減 '+marefiaPenalties.length+' 次。':''),'pet');
    if(isMarefia&&p.level===maxLevel&&p.level<79)addLog('瑪蕾菲雅到達目前回憶門檻 Lv.'+maxLevel+'，可前往下一個記憶地點。','pet');
  }
}
function awardActivePetExp(amount){
  const p=activePet();if(!p)return;
  return awardPetExp(p,amount);
}
function clearEvent83Chain(extra=[]){
  for(let id=19702;id<=19715;id++){
    while(hasItem(id))consumeItem(id,1);
  }
  for(const id of extra){
    while(hasItem(id))consumeItem(id,1);
  }
}
function cRand(min,max){
  min=Number(min);max=Number(max);
  if(!Number.isFinite(min)||!Number.isFinite(max))return 0;
  return Math.trunc(min+(max-min+1)*Math.random());
}
function sourceRandModulo(mod){
  const m=Math.max(1,Math.trunc(n(mod)));
  return Math.trunc(Math.random()*m);
}
function sourceGmQueActionValue(randModulo=sourceRandModulo){
  // fixed GMQUE_CheckQueStr: rand()%100, then 0 is folded into 1.
  let value=Math.trunc(n(randModulo(100)));
  value=((value%100)+100)%100;
  if(value<1)value=1;
  return value;
}
function sourceGmQueRewardType(gmqueNums){
  const value=Math.trunc(n(gmqueNums));
  if(value>97)return 'pet';
  if(value>40)return 'item';
  return 'gold';
}
function sourceGmQueResolveTrophy(gmqueNums,{randInclusive=cRand}={}){
  const type=sourceGmQueRewardType(gmqueNums);
  if(!gmqueDb)return {ok:false,reason:'runtime-missing',type};

  if(type==='pet'){
    const ids=gmqueDb.petReward?.effectiveIds||[];
    const i=Math.trunc(n(randInclusive(0,3)));
    const petId=Number(ids[i]??0);
    return {ok:petId>0,type:'pet',selectionIndex:i,petId,sourceFailure:petId<=0?'implicit-zero-pet-slot':null};
  }

  if(type==='item'){
    const primary=Math.trunc(n(randInclusive(0,100)));
    const pools=gmqueDb.itemReward?.pools||[];
    let pool=null;
    if(primary===0)pool=pools.find(x=>x.name==='itemID3')||null;
    else if(primary>=97)pool=pools.find(x=>x.name==='itemID2')||null;
    else if(primary>=70)pool=pools.find(x=>x.name==='itemID4')||null;
    else if(primary>=40)pool=pools.find(x=>x.name==='itemID5')||null;
    else pool=pools.find(x=>x.name==='itemID1')||null;
    if(!pool||!Array.isArray(pool.ids)||!pool.ids.length)return {ok:false,reason:'pool-missing',type:'item',primary};
    const pick=Math.trunc(n(randInclusive(0,pool.ids.length-1)));
    const itemId=Math.trunc(n(pool.ids[pick]));
    return {ok:itemId>0,type:'item',primary,pool:pool.name,selectionIndex:pick,itemId};
  }

  const primary=Math.trunc(n(randInclusive(0,30)));
  if(primary>=15)return {ok:true,type:'gold',primary,gold:20000};
  if(primary>=10)return {ok:true,type:'gold',primary,gold:50000};
  const secondary=Math.trunc(n(randInclusive(2,4)));
  const gold=Math.trunc(n(gmqueDb.goldReward?.branches?.[2]?.secondary?.goldByIndex?.[String(secondary)]));
  return {ok:gold>0,type:'gold',primary,secondary,gold};
}
function normalizedElements(elements){
  if(!elements)return null;
  const earth=Math.max(0,n(elements.earth)),water=Math.max(0,n(elements.water));
  const fire=Math.max(0,n(elements.fire)),wind=Math.max(0,n(elements.wind));
  const none=Math.max(0,100-earth-water-fire-wind);
  return {earth,water,fire,wind,none};
}
function sourceBattleElements(elements){
  if(!elements)return null;
  // fixed BATTLE_GetAttr() 的 T_pow[] 全是 int；負值歸 0，none 由 100 減四屬後下限 0。
  const earth=Math.max(0,Math.trunc(n(elements.earth)));
  const water=Math.max(0,Math.trunc(n(elements.water)));
  const fire=Math.max(0,Math.trunc(n(elements.fire)));
  const wind=Math.max(0,Math.trunc(n(elements.wind)));
  const none=Math.max(0,100-earth-water-fire-wind);
  return {earth,water,fire,wind,none};
}
function battleFieldPower(elements){
  const e=normalizedElements(elements)||{earth:0,water:0,fire:0,wind:0,none:100};
  const attr=String(battleFieldState?.attr||'none');
  if(attr==='none'||!Object.prototype.hasOwnProperty.call(e,attr))return .5;
  // 原 BATTLE_FieldAttAdjust：0.5 + pAt * att_pow * .01 * .01 * .5。
  return .5+n(e[attr])*n(battleFieldState?.power)*.00005;
}
function battleFieldRatio(attackerElements,defenderElements){
  const at=battleFieldPower(attackerElements),df=battleFieldPower(defenderElements);
  return df===0?1:at/df;
}
function battleSetField(attr,power,turns){
  battleFieldState={attr:String(attr||'none'),power:Math.trunc(n(power)),turns:Math.max(0,Math.trunc(n(turns)))};
  return Object.assign({},battleFieldState);
}
function battleFieldTick(){
  if(!battleFieldState||battleFieldState.attr==='none')return battleFieldState;
  battleFieldState.turns=Math.max(0,Math.trunc(n(battleFieldState.turns))-1);
  if(battleFieldState.turns<=0){
    const old=battleFieldState.attr;
    battleFieldState={attr:'none',power:0,turns:0};
    addLog('戰場'+({earth:'地',water:'水',fire:'火',wind:'風'}[old]||old)+'屬性效果結束，回復無屬性。');
  }
  return battleFieldState;
}
function battleAttrDamage(attacker,defender,rawDamage){
  const damage=Math.max(0,Math.trunc(n(rawDamage)));
  const a=sourceBattleElements(attacker?.elements),d=sourceBattleElements(defender?.elements);
  if(!a||!d)return damage;

  // fixed BATTLE_AttrAdjust：At_pow[] 是 int，先各自 *= damage。
  const attackVector={
    earth:Math.trunc(a.earth*damage),
    water:Math.trunc(a.water*damage),
    fire:Math.trunc(a.fire*damage),
    wind:Math.trunc(a.wind*damage),
    none:Math.trunc(a.none*damage)
  };

  // BATTLE_AttrCalc 的 My_* 參數 / iRet / return 全是 int：
  // 五個屬性分量各自截斷，再 /10000 截斷。
  const attrDamage=magicAttrCalcRaw(attackVector,d);

  // BATTLE_AttrAdjust 回來後才 damage *= At_FieldPow / Df_FieldPow；
  // damage 是 int，因此這一步還要再截一次，不能和 AttrCalc 合併成單次 multiplier。
  const fieldRatio=battleFieldRatio(a,d);
  return Math.trunc(attrDamage*fieldRatio);
}
const MAGIC_ATTR_KEYS=Object.freeze(['earth','water','fire','wind']);
const MAGIC_CHAR_TABLE=Object.freeze([
  Object.freeze([13,11,10,12,14]),
  Object.freeze([18,16,15,17,19]),
  Object.freeze([8,6,5,7,9]),
  Object.freeze([3,1,0,2,4])
]);
const MAGIC_CHAR_TABLE_IDX=Object.freeze([
  [3,2],[3,1],[3,3],[3,0],[3,4],
  [2,2],[2,1],[2,3],[2,0],[2,4],
  [0,2],[0,1],[0,3],[0,0],[0,4],
  [1,2],[1,1],[1,3],[1,0],[1,4]
]);
function magicProgressArray(v){
  return Array.from({length:4},(_,i)=>Math.max(0,Math.trunc(n(Array.isArray(v)?v[i]:0))));
}
function magicTargetStore(desc){
  if(desc?.kind==='player')return state;
  if(desc?.kind==='pet'&&desc.pet)return desc.pet;
  return null;
}
function magicTargetResist(desc,attrIndex){
  const store=magicTargetStore(desc);
  if(!store)return 0;
  store.magicResist=magicProgressArray(store.magicResist);
  store.magicResistExp=magicProgressArray(store.magicResistExp);
  return Math.max(0,Math.trunc(n(store.magicResist[attrIndex])));
}
function magicComputeDefExp(desc,attrIndex,magicLv,damage){
  const store=magicTargetStore(desc);
  if(!store||damage<200)return null;
  store.magicResist=magicProgressArray(store.magicResist);
  store.magicResistExp=magicProgressArray(store.magicResistExp);

  let lv=Math.max(0,Math.trunc(n(store.magicResist[attrIndex])));
  let exp=Math.max(0,Math.trunc(n(store.magicResistExp[attrIndex])));
  const addEx=Math.trunc(n(damage)/20)*(Math.trunc(n(magicLv))*2);
  exp+=addEx;
  let raised=false,lowered=false;
  if(exp>100){
    exp=0;
    if(lv<100){lv++;raised=true;}
  }
  lv=clamp(lv,0,100);
  store.magicResist[attrIndex]=lv;
  store.magicResistExp[attrIndex]=Math.max(0,exp);

  const sub=(attrIndex+1)%4;
  let subLv=Math.max(0,Math.trunc(n(store.magicResist[sub])));
  let subExp=Math.max(0,Math.trunc(n(store.magicResistExp[sub])));
  if(subLv>1){
    subExp-=2;
    if(subExp<0){
      subExp=90;
      subLv=Math.max(0,subLv-1);
      lowered=true;
    }
    store.magicResist[sub]=subLv;
    store.magicResistExp[sub]=subExp;
  }
  return {addEx,raised,lowered,level:lv,exp:store.magicResistExp[attrIndex],subIndex:sub,subLevel:subLv,subExp};
}
function magicAttrCalcRaw(a,d){
  const same=1,up=1.5,down=.6;
  const fire=Math.trunc(n(a.fire)*(n(d.none)*up+n(d.fire)*same+n(d.water)*down+n(d.earth)*same+n(d.wind)*up));
  const water=Math.trunc(n(a.water)*(n(d.none)*up+n(d.fire)*up+n(d.water)*same+n(d.earth)*down+n(d.wind)*same));
  const earth=Math.trunc(n(a.earth)*(n(d.none)*up+n(d.fire)*same+n(d.water)*up+n(d.earth)*same+n(d.wind)*down));
  const wind=Math.trunc(n(a.wind)*(n(d.none)*up+n(d.fire)*down+n(d.water)*same+n(d.earth)*up+n(d.wind)*same));
  const none=Math.trunc(n(a.none)*(n(d.none)*same+n(d.fire)*down+n(d.water)*down+n(d.earth)*down+n(d.wind)*down));
  return Math.trunc((fire+water+earth+wind+none)/10000);
}
function enemyMagicAttrDamage(unit,targetDesc,magic,aPower){
  const source=normalizedElements(battleElementsForDesc({kind:'enemy',unit,unitId:unit?.id}))||{earth:0,water:0,fire:0,wind:0,none:100};
  const targetView=battleStatusDescView(targetDesc);
  const def=normalizedElements(targetView?.elements||{})||{earth:0,water:0,fire:0,wind:0,none:100};
  const attrIndex=MAGIC_ATTR_KEYS.indexOf(magic.attr);
  const scaled=Math.trunc(n(magic.magicLv))*10;
  const magicVector={earth:0,water:0,fire:0,wind:0,none:Math.trunc(n(source.none))};
  const sourceAttr=Math.trunc(n(source[magic.attr]));
  magicVector[magic.attr]=scaled+scaled*Math.trunc(sourceAttr/50);
  // 原 _FIX_MAGICDAMAGE：FieldAttAdjust 在乘 damage 前先看 MagicLv 牽引後的四屬向量。
  const fieldRatio=battleFieldRatio(magicVector,def);
  const attack={earth:0,water:0,fire:0,wind:0,none:Math.trunc(n(magicVector.none)*n(aPower))};
  attack[magic.attr]=Math.trunc(n(magicVector[magic.attr])*n(aPower));
  const baseDamage=magicAttrCalcRaw(attack,def);
  const damage=Math.trunc(baseDamage*fieldRatio);
  return {damage,attrIndex,attackVector:attack,magicVector,defVector:def,fieldRatio,fieldState:Object.assign({},battleFieldState)};
}
function magicDescForSlot(slot){
  // BATTLE_MultiAttMagic's final field scan always uses BATTLE_TargetCheck.
  // EarthRound hidden Pet therefore remains a raw COM2 anchor but is not a hittable magic target.
  const target=sourceEnemyTargetableFromBattleSlot(slot);
  if(target?.kind==='player')return {kind:'player'};
  if(target?.kind==='pet')return {kind:'pet',pet:target.pet,petId:target.petId};
  return null;
}
function sourceEnemyAttackMagicRewriteToNo(actor,magic){
  // battle.c BATTLE_COM_S_ATTACK_MAGIC starts from raw CHAR_WORKBATTLECOM2.
  const rawToNo=sourceEnemyCommandTargetBattleSlot(actor,null);
  if(rawToNo<0)return {rawToNo,toNo:-1};
  const rewrite=Number(magic?.targetRewrite);
  let toNo=rawToNo;
  if(rewrite===20)toNo=20;
  else if(Number.isFinite(rewrite)&&rewrite!==-1){
    toNo=(rawToNo>=0&&rawToNo<=4)?rewrite:rewrite-1;
  }
  return {rawToNo,toNo};
}
function sourceEnemyAttackMagicMultiList(toNo){
  // fixed __ATTACK_MAGIC BATTLE_MultiList().
  // Single invalid targets use the original compact nLifeArea[10] + rand()%10 rejection loop,
  // which is intentionally NOT BATTLE_DefaultAttacker / RAND(0,cnt-1).
  const no=Math.trunc(Number(toNo));
  const targetableSlots=(start,end)=>{
    const out=[];
    for(let slot=start;slot<end;slot++){
      if(sourceEnemyTargetableFromBattleSlot(slot))out.push(slot);
    }
    return out;
  };

  if(no>=0&&no<=19){
    if(sourceEnemyTargetableFromBattleSlot(no)){
      return {ok:true,toNo:no,fallback:false,rolls:[]};
    }
    const sideStart=no<10?0:10;
    const compact=targetableSlots(sideStart,sideStart+10);
    if(!compact.length)return {ok:false,toNo:-1,fallback:true,rolls:[],reason:'all-die'};
    const rolls=[];
    for(;;){
      const roll=cRand(0,9); // source: rand()%10
      rolls.push(roll);
      const picked=compact[roll];
      if(picked!=null)return {ok:true,toNo:picked,fallback:true,rolls,compact:compact.slice()};
    }
  }

  // Right-lower side row constants from battle.h:
  // 26 = SIDE_0_B_ROW (slots 0..4), 25 = SIDE_0_F_ROW (slots 5..9).
  if(no===26){
    if(targetableSlots(0,5).length)return {ok:true,toNo:26,rowFallback:false,rolls:[]};
    if(targetableSlots(5,10).length)return {ok:true,toNo:25,rowFallback:true,rolls:[]};
    return {ok:false,toNo:-1,rowFallback:true,rolls:[],reason:'all-die'};
  }
  if(no===25){
    if(targetableSlots(5,10).length)return {ok:true,toNo:25,rowFallback:false,rolls:[]};
    if(targetableSlots(0,5).length)return {ok:true,toNo:26,rowFallback:true,rolls:[]};
    return {ok:false,toNo:-1,rowFallback:true,rolls:[],reason:'all-die'};
  }

  // Opposite side equivalents kept for source completeness.
  if(no===23){
    if(targetableSlots(10,15).length)return {ok:true,toNo:23,rowFallback:false,rolls:[]};
    if(targetableSlots(15,20).length)return {ok:true,toNo:24,rowFallback:true,rolls:[]};
    return {ok:false,toNo:-1,rowFallback:true,rolls:[],reason:'all-die'};
  }
  if(no===24){
    if(targetableSlots(15,20).length)return {ok:true,toNo:24,rowFallback:false,rolls:[]};
    if(targetableSlots(10,15).length)return {ok:true,toNo:23,rowFallback:true,rolls:[]};
    return {ok:false,toNo:-1,rowFallback:true,rolls:[],reason:'all-die'};
  }

  // TARGET_SIDE_0 / TARGET_SIDE_1 / TARGET_ALL do not perform random retargeting here.
  return {ok:true,toNo:no,fallback:false,rolls:[]};
}
function enemyAttackMagicTargets(toNo,pattern){
  const slots=new Set();
  const addSlot=slot=>{if((slot===0||slot===5)&&magicDescForSlot(slot))slots.add(slot);};
  const field=pattern?.field||[[0,0,0,0,0],[0,0,1,0,0],[0,0,0,0,0]];

  if(toNo<20){
    const idx=MAGIC_CHAR_TABLE_IDX[toNo];
    if(idx){
      const basey=idx[0],basex=idx[1];
      for(let i=0,j=basey-1;j<=basey+1;i++,j++){
        if(toNo<10&&(j<2||j>3))continue;
        if(toNo>=10&&(j<0||j>1))continue;
        for(let k=0;k<5;k++){
          const x=basex-2+k;
          if(x<0||x>4)continue;
          if(n(field?.[i]?.[k])&&MAGIC_CHAR_TABLE[j])addSlot(MAGIC_CHAR_TABLE[j][x]);
        }
      }
    }
  }else if(toNo===20){
    for(let i=0;i<2;i++)for(let j=0;j<5;j++){
      if(n(field?.[i]?.[j]))addSlot(MAGIC_CHAR_TABLE[i+2][j]);
    }
  }else if(toNo===21){
    // Enemy attack magic does not normally target its own side, but keep source shape complete.
  }else if(toNo>=23&&toNo<=26){
    const basey=toNo-23;
    for(let i=0,j=basey-1;j<=basey+1;i++,j++){
      if((toNo===25||toNo===26)&&(j<2||j>3))continue;
      if((toNo===23||toNo===24)&&(j<0||j>1))continue;
      for(let k=0;k<5;k++){
        if(n(field?.[i]?.[k])&&MAGIC_CHAR_TABLE[j])addSlot(MAGIC_CHAR_TABLE[j][k]);
      }
    }
  }
  // Original list is location-sorted; on side 0 row 3 (player) precedes row 2 (pet).
  return [...slots].sort((a,b)=>(a===0?-1:(b===0?1:a-b))).map(magicDescForSlot).filter(Boolean);
}
function enemyMagicDodge(targetDesc,attrIndex){
  let fLuck=0;
  if(targetDesc?.kind==='player'){
    fLuck=n(state.luck)*3+magicTargetResist(targetDesc,attrIndex)*.15;
  }else if(targetDesc?.kind==='pet'){
    fLuck=Math.min(30,n(targetDesc.pet?.level)*.2);
  }
  const threshold=Math.trunc(fLuck);
  const roll=cRand(1,100);
  return {dodged:roll<=threshold,roll,threshold};
}
function enemyMagicDamageOne(unit,targetDesc,magic,trueMagic,applyFalseMagicPenalty=true){
  const attrIndex=MAGIC_ATTR_KEYS.indexOf(magic.attr);
  if(attrIndex<0)return {damage:0,invalidAttr:true};
  const dodge=enemyMagicDodge(targetDesc,attrIndex);
  if(dodge.dodged)return {damage:0,dodged:true,dodge};

  const attMagicLv=Math.trunc(n(unit.level)*.9);
  const resist=magicTargetResist(targetDesc,attrIndex);
  let kmagic=attMagicLv*1.4-resist;
  if(kmagic<0)kmagic=0;
  const mmagic=Math.max(1,attMagicLv);
  const randomAmp=cRand(0,19);
  const amagic=(kmagic*kmagic)/(mmagic*mmagic)+randomAmp/100;
  const aPower=Math.trunc(n(magic.power)*(1+n(magic.magicLv)/10)*amagic);
  const adjusted=enemyMagicAttrDamage(unit,targetDesc,magic,aPower);
  let damage=Math.max(0,Math.trunc(n(adjusted.damage)));
  if(applyFalseMagicPenalty&&!trueMagic)damage=Math.trunc(damage*.7);

  const hpBefore=battleStatusHp(targetDesc);
  battleStatusSetHp(targetDesc,Math.max(0,hpBefore-damage));
  const exp=magicComputeDefExp(targetDesc,attrIndex,Math.trunc(n(magic.magicLv)),damage);
  if(battleStatusActive(targetDesc,'sleep')){
    battleStatusClear(targetDesc,'sleep');
    addLog(battleStatusDescName(targetDesc)+' 被魔法命中，睡眠解除。');
  }
  return {damage,dodged:false,dodge,attMagicLv,resist,randomAmp,amagic,aPower,adjusted,trueMagic,exp,hpBefore,hpAfter:battleStatusHp(targetDesc)};
}
const BATTLE_STATUS_NAMES=Object.freeze({
  poison:'中毒',deepPoison:'劇毒',paralysis:'麻痺',sleep:'睡眠',stone:'石化',drunk:'酒醉',confusion:'混亂',dizzy:'暈眩',barrier:'魔障',weaken:'虛弱',nocast:'沉默',sars:'毒煞'
});
const BATTLE_STATUS_INDEX=Object.freeze({poison:0,paralysis:1,sleep:2,stone:3,drunk:4,confusion:5});
function resetBattleStatuses(){sourceDiscardBattleGetItemPool();battleStatuses=new Map();battlePetOutIds=new Set();battlePetDeathProcessedIds=new Set();battlePetFixAiSnapshots=new Map();battlePlayerDeathProcessed=false;battlePlayerDeathResult=null;battleOuterAddProfitPending=false;battlePetChargeStates=new Map();battlePetEarthRoundStates=new Map();battlePetHiddenIds=new Set();battlePetGuardIds=new Set();battlePetPowerMods=new Map();battlePetNoGuardStates=new Map();battlePlayerGuardianPetId=null;battleReverseKeys=new Set();battleElementWork=new Map();battleDrunkReleaseBoostKeys=new Set();battleWeakenRoundKeys=new Set();battleUltimateWork=new Map();battleUltimateFlags=new Map();battleSarsStates=new Map();battleSarsCarrierKeys=new Set();battleShootSleepStates=new Map();battleGetItemPool=[];battleFieldState={attr:'none',power:0,turns:0}}
function sourceEnemySkipsPreCommandCompliance(unit){
  // fixed BATTLE_PreCommandSeq clears Guardian first, then EARTHROUND0 immediately continue;
  // no complianceParameter / BATTLE_TurnParam / BATTLE_AttReverse for the hidden actor.
  return !!unit?.earthRoundState?.hidden;
}
function sourcePreCommandKeySkipsCompliance(key){
  const value=String(key||'');
  if(value.startsWith('enemy:')){
    const id=value.slice(6);
    const unit=livingEnemyUnits().find(u=>String(u.id)===id);
    return !!(unit&&sourceEnemySkipsPreCommandCompliance(unit));
  }
  if(value.startsWith('pet:')){
    const id=value.slice(4);
    const pet=state?.petBox?.find?.(p=>String(p.id)===id)||null;
    return !!(pet&&sourcePetEarthRoundCommandActive(pet));
  }
  return false;
}
function sourcePreCommandResetTransient(){
  // Most actors rebuild WORKQUICK from FIXDEX here. EARTHROUND0 skips that rebuild,
  // so a DRUNK-expiry ×2 from the previous turn must survive while hidden.
  const keep=new Set();
  for(const key of battleDrunkReleaseBoostKeys){
    if(sourcePreCommandKeySkipsCompliance(key))keep.add(key);
  }
  battleDrunkReleaseBoostKeys=keep;
}
function sourcePreCommandStatusTick(){
  // fixed C: _CHAR_complianceParameter -> Other_DefcharWorkInt runs before EntrySort.
  // EARTHROUND0 is the explicit exception and skips this entire compliance stage.
  // WEAKEN applies FIXSTR/FIXTOUGH/FIXDEX * 0.8 and then decrements WORKWEAKEN.
  // BARRIER only decrements WORKBARRIER here. BATTLE_StatusSeq later protects positive
  // WEAKEN/BARRIER counters from a second net decrement.
  battleWeakenRoundKeys=new Set();
  for(const [key,st] of [...battleStatuses.entries()]){
    if(!st||st.turns<=0)continue;
    if(sourcePreCommandKeySkipsCompliance(key))continue;
    if(st.type==='weaken'){
      battleWeakenRoundKeys.add(key);
      st.turns=Math.max(0,Math.trunc(n(st.turns))-1);
      if(st.turns<=0)battleStatuses.delete(key);
    }else if(st.type==='barrier'){
      st.turns=Math.max(0,Math.trunc(n(st.turns))-1);
      if(st.turns<=0)battleStatuses.delete(key);
    }
  }
}
function battleWeakenRoundActive(desc){
  const key=battleStatusKey(desc);
  return !!(key&&battleWeakenRoundKeys.has(key));
}
function battleStatusKey(desc){
  if(!desc)return null;
  if(desc.kind==='player')return 'player';
  if(desc.kind==='pet')return 'pet:'+String(desc.pet?.id??desc.petId??'');
  if(desc.kind==='enemy')return 'enemy:'+String(desc.unit?.id??desc.unitId??'');
  return null;
}
function sourceUltimateMaxHp(desc){
  if(desc?.kind==='player')return Math.max(1,Math.trunc(n(state?.maxHp)));
  if(desc?.kind==='pet'&&desc.pet)return Math.max(1,Math.trunc(n(desc.pet.maxHp)||petMaxHp(desc.pet)));
  if(desc?.kind==='enemy'&&desc.unit)return Math.max(1,Math.trunc(n(desc.unit.maxHp)));
  return 1;
}
function sourceUltimateBaseImage(desc){
  const obj=desc?.kind==='pet'?desc.pet:desc?.kind==='enemy'?desc.unit:null;
  const value=Number(obj?.baseBaseImageNumber??obj?.baseBaseImage??obj?.sourceBaseBaseImageNumber);
  return Number.isFinite(value)?Math.trunc(value):null;
}
function sourceUltimateImmune(desc){
  const image=sourceUltimateBaseImage(desc);
  return image===101813||image===101814;
}
function sourceUltimateType(desc){
  const key=battleStatusKey(desc);
  return key?Math.trunc(n(battleUltimateFlags.get(key))):0;
}
function sourceTrackDamageSubUltimate(desc,rawDamage,beforeHp,result={}){
  const key=battleStatusKey(desc);
  if(!key)return {type:0,reason:'no-key'};
  const damage=Math.max(0,Math.trunc(n(rawDamage)));
  if(damage<=0)return {type:0,reason:'no-damage'};
  const before=Math.max(0,Math.trunc(n(beforeHp)));
  const after=battleStatusHp(desc);
  const maxHp=sourceUltimateMaxHp(desc);
  const threshold=maxHp*1.2+20;
  // Acupuncture is a source oddity: reflected HP loss is damage/2, but the later
  // BATTLE_DamageSub Ultimate direct-hit threshold still compares the pre-halved damage.
  const thresholdDamage=Object.prototype.hasOwnProperty.call(result||{},'sourceUltimateThresholdDamage')
    ?Math.max(0,Math.trunc(n(result.sourceUltimateThresholdDamage)))
    :damage;
  const rawAfter=before-damage;
  const overkill=rawAfter<0?-rawAfter:0;
  let work=Math.max(0,Math.trunc(n(battleUltimateWork.get(key))));
  let type=0;

  if(thresholdDamage>=threshold){
    type=2;
  }else if(overkill>0){
    work+=overkill;
    battleUltimateWork.set(key,work);
    if(work>=threshold)type=1;
  }

  let criticalRoll=null;
  const criticalTargetAllowed=result?.ultimateCriticalEnemyOnly
    ?desc.kind==='enemy'
    :desc.kind!=='player';
  if(after<=0&&criticalTargetAllowed&&result?.critical){
    criticalRoll=cRand(1,100);
    if(criticalRoll<50)type=1;
  }

  if(sourceUltimateImmune(desc))type=0;
  if(type>0){
    battleUltimateFlags.set(key,type);
    battleUltimateWork.delete(key);
    addLog(battleStatusDescName(desc)+' 達成原版 Ultimate／打飛條件（type '+type+'）。','bad');
  }
  return {type,damage,thresholdDamage,before,after,maxHp,threshold,overkill,work,criticalRoll};
}
function sourceBattleFinalizeItemCrushRng(r){
  if(!r||r.dodged||r.miss||n(r.damage)<=0)return null;
  if(Object.prototype.hasOwnProperty.call(r,'sourceItemCrushDefenderRoll')){
    return r.sourceItemCrushDefenderRoll;
  }
  // fixed _TAKE_ITEMDAMAGE:
  // BATTLE_ItemCrushSeq() first calls BATTLE_ItemCrushCheck(defender, flg=1).
  // That function executes rand()%100 before it knows whether the defender is a Player
  // or owns any valid armor. Therefore every positive physical hit consumes this RNG.
  // Actual durability loss is intentionally NOT modeled yet: the later BATTLE_ItemCrush()
  // RAND requires sourced ITEM_DAMAGECRUSHE / ITEM_MAXDAMAGECRUSHE equipment data.
  const roll=cRand(0,99);
  r.sourceItemCrushDefenderRoll=roll;
  return roll;
}
function sourceBattleModelAliveItemCrushRng(r,targetDesc){
  if(!r||!targetDesc||!battleStatusDescAlive(targetDesc))return null;
  if(Object.prototype.hasOwnProperty.call(r,'sourceItemCrushDefenderRoll')){
    return r.sourceItemCrushDefenderRoll;
  }
  // fixed BATTLE_BattleModel_ATTACK is a special caller:
  // its ItemCrushSeq is inside the target-alive else branch, with NO damage>0 guard.
  // Therefore DODGE / MISS / zero-damage hits still consume defender flg=1 rand()%100
  // as long as the actual target survived. A lethal hit skips ItemCrush entirely.
  const roll=cRand(0,99);
  r.sourceItemCrushDefenderRoll=roll;
  r.sourceBattleModelAliveItemCrush=true;
  return roll;
}
function battleBaseElements(desc){
  if(desc?.kind==='player')return sourcePlayerElementsConfigured(state)?Object.assign({},state.elements):null;
  if(desc?.kind==='pet')return Object.assign({},desc.pet?.elements||{});
  if(desc?.kind==='enemy')return Object.assign({},desc.unit?.elements||{});
  return {};
}
function battleReverseElements(elements){
  const e=elements||{};
  return Object.assign({},e,{
    earth:n(e.fire),water:n(e.wind),fire:n(e.earth),wind:n(e.water)
  });
}
function battleElementsForDesc(desc){
  const key=battleStatusKey(desc);
  if(key&&battleElementWork.has(key))return battleElementWork.get(key);
  return battleBaseElements(desc);
}
function battlePrepareElementWork(){
  const previous=battleElementWork,next=new Map(),list=[];
  if(state)list.push({kind:'player'});
  const pet=activePet();
  if(pet)list.push({kind:'pet',pet,petId:pet.id});
  for(const unit of livingEnemyUnits())list.push({kind:'enemy',unit,unitId:unit.id});
  for(const desc of list){
    const key=battleStatusKey(desc);
    if(key&&sourcePreCommandKeySkipsCompliance(key)&&previous.has(key)){
      next.set(key,previous.get(key));
      continue;
    }
    let work=battleBaseElements(desc);
    if(key&&battleReverseKeys.has(key))work=battleReverseElements(work);
    if(key)next.set(key,work);
  }
  battleElementWork=next;
}
function battleToggleAttributeReverse(desc){
  const key=battleStatusKey(desc);
  if(!key)return {active:false,changed:false};
  if(battleReverseKeys.has(key)){
    // 原 BATTLE_MultiAttReverse 第二次 XOR 關閉 flag 後，BATTLE_AttReverse() 立即 return；
    // 本回合已反轉的 FIX 屬性不立刻換回，等下一輪 complianceParameter 重建。
    battleReverseKeys.delete(key);
    return {active:false,changed:true,elements:battleElementsForDesc(desc)};
  }
  battleReverseKeys.add(key);
  const reversed=battleReverseElements(battleElementsForDesc(desc));
  battleElementWork.set(key,reversed);
  return {active:true,changed:true,elements:reversed};
}
function battleStatusGet(desc){
  const key=battleStatusKey(desc);
  return key?battleStatuses.get(key)||null:null;
}
function battleSarsGet(desc){
  const key=battleStatusKey(desc);
  return key?battleSarsStates.get(key)||null:null;
}
function battleShootSleepGet(desc){
  const key=battleStatusKey(desc);
  return key?battleShootSleepStates.get(key)||null:null;
}
function battleHasAnyStatus(desc){
  const st=battleStatusGet(desc),sars=battleSarsGet(desc),shootSleep=battleShootSleepGet(desc);
  return !!((st&&st.turns>0)||(sars&&sars.turns>0)||(shootSleep&&shootSleep.turns>0));
}
function battleStatusActive(desc,type=null){
  if(type==='sars'){
    const sars=battleSarsGet(desc);
    return !!(sars&&sars.turns>0);
  }
  const st=battleStatusGet(desc);
  const shootSleep=battleShootSleepGet(desc);
  if(type==='sleep'){
    return !!((st&&st.turns>0&&st.type==='sleep')||(shootSleep&&shootSleep.turns>0));
  }
  if(type==null){
    const sars=battleSarsGet(desc);
    return !!((st&&st.turns>0)||(sars&&sars.turns>0)||(shootSleep&&shootSleep.turns>0));
  }
  return !!(st&&st.turns>0&&st.type===type);
}
function battleStatusClear(desc,type=null){
  const key=battleStatusKey(desc);
  if(!key)return false;
  const st=battleStatuses.get(key);
  if(type==='sleep'){
    let cleared=false;
    if(st&&st.type==='sleep'){battleStatuses.delete(key);cleared=true;}
    if(battleShootSleepStates.delete(key))cleared=true;
    return cleared;
  }
  if(!st||type&&st.type!==type)return false;
  battleStatuses.delete(key);
  return true;
}
function battleStatusCanMove(desc){
  const st=battleStatusGet(desc),shootSleep=battleShootSleepGet(desc);
  if(shootSleep&&shootSleep.turns>0)return false;
  return !(st&&st.turns>0&&(st.type==='paralysis'||st.type==='stone'||st.type==='sleep'||st.type==='dizzy'||st.type==='barrier'));
}
function battleStatusRawStats(desc){
  if(desc?.kind==='player'){
    const p=state?.playerStats||{};
    return {vital:n(p.vital)*100,str:n(p.str)*100,tgh:n(p.tgh)*100,dex:n(p.dex)*100};
  }
  if(desc?.kind==='pet'){
    const p=desc.pet||state?.petBox?.find(x=>x.id===desc.petId);
    const src=p?.serverStats||p?.stats||{};
    const scale=p?.serverStats?1:100;
    return {vital:n(src.vital)*scale,str:n(src.str)*scale,tgh:n(src.tgh)*scale,dex:n(src.dex)*scale};
  }
  if(desc?.kind==='enemy'){
    const u=desc.unit||livingEnemyUnits().find(x=>x.id===desc.unitId);
    const src=u?.serverDerived?.charStats||u?.stats||{};
    const scale=u?.serverDerived?.charStats?1:100;
    return {vital:n(src.vital)*scale,str:n(src.str)*scale,tgh:n(src.tgh)*scale,dex:n(src.dex)*scale};
  }
  return {vital:0,str:0,tgh:0,dex:0};
}
function battleStatusResist(desc,type){
  const idx=BATTLE_STATUS_INDEX[type];
  if(idx==null)return 0;
  if(desc?.kind==='player')return 0;
  if(desc?.kind==='pet'){
    const p=desc.pet||state?.petBox?.find(x=>x.id===desc.petId);
    return Math.trunc(n(p?.statusResist?.[idx]));
  }
  if(desc?.kind==='enemy'){
    const u=desc.unit||livingEnemyUnits().find(x=>x.id===desc.unitId);
    return Math.trunc(n(u?.statusResist?.[idx]??u?.ai?.z?.[idx]));
  }
  return 0;
}
function battleStatusLevel(desc){
  if(desc?.kind==='player')return Math.max(1,Math.trunc(n(state.level)));
  if(desc?.kind==='pet')return Math.max(1,Math.trunc(n((desc.pet||{}).level)));
  if(desc?.kind==='enemy')return Math.max(1,Math.trunc(n((desc.unit||{}).level)));
  return 1;
}
function battleStatusLuck(desc){
  return desc?.kind==='player'?n(state.luck):0;
}
function battleStatusChance(attackerDesc,targetDesc,type,rules={}){
  if(battleHasAnyStatus(targetDesc))return {allowed:false,per:0,reason:'existing'};
  const targetKey=battleStatusKey(targetDesc);
  const resist=type==='sars'
    ?(targetKey&&battleSarsCarrierKeys.has(targetKey)?1:0)
    :battleStatusResist(targetDesc,type);
  if(type==='paralysis'&&!rules.forceGeneral){
    const per=20-resist;
    return {allowed:true,per,success:cRand(1,100)<per,resist};
  }
  const raw=battleStatusRawStats(targetDesc);
  const total=n(raw.vital)+n(raw.str)+n(raw.tgh)+n(raw.dex);
  const vitalShare=total>0?n(raw.vital)/total:0;
  const vitalPenalty=type==='sars'
    ?(1-vitalShare)*.9/.25*10
    :vitalShare/.25*10;
  const bai=Number.isFinite(Number(rules.bai))?Number(rules.bai):2;
  const range=Number.isFinite(Number(rules.range))?Math.max(0,Math.trunc(Number(rules.range))):40;
  const perOffset=Number.isFinite(Number(rules.perOffset))?Math.trunc(Number(rules.perOffset)):30;
  // fixed BATTLE_StatusAttackCheck：level / per 都是 int。
  // level *= Bai 會先向 0 截斷；最終含 float fVitalP 的整條命中率公式
  // 指派回 int per 時也會再截斷，之後才 cap 80 並做 RAND(1,100) < per。
  let level=Math.trunc((battleStatusLevel(attackerDesc)-battleStatusLevel(targetDesc))*bai);
  level=clamp(level,-range,range);
  const luck=Math.trunc(n(battleStatusLuck(attackerDesc)));
  let per=Math.trunc(perOffset+level+luck-resist-vitalPenalty);
  if(per>80)per=80;
  return {allowed:true,per,success:cRand(1,100)<per,resist,vitalPenalty,level,bai,range,perOffset};
}
function battleStatusApply(targetDesc,type,turns){
  if(battleHasAnyStatus(targetDesc))return false;
  const key=battleStatusKey(targetDesc);
  if(!key)return false;
  battleStatuses.set(key,{type,turns:Math.max(1,Math.trunc(n(turns))+1)});
  sourceClearPetBattleCommand(targetDesc,type);
  return true;
}
function sourceStatusClearsBattleCommand(type){
  return type==='paralysis'||type==='sleep'||type==='stone'||type==='barrier';
}
function sourceClearPetBattleCommand(targetDesc,type){
  if(!sourceStatusClearsBattleCommand(type)||targetDesc?.kind!=='pet'||!targetDesc.pet)return;
  battlePetGuardIds.delete(targetDesc.pet.id);
  battlePetNoGuardStates.delete(targetDesc.pet.id);
  sourceCancelPetCharge(targetDesc.pet);
  if(battlePetEarthRoundStates.has(targetDesc.pet.id))battlePetEarthRoundStates.delete(targetDesc.pet.id);
}
function sourcePlayerPetGuardCommand(pet){
  return !!pet&&petIsBattleActive(pet)&&petIsAlive(pet)&&battlePetGuardIds.has(pet.id);
}
function sourcePlayerPetGuardAdjust(pet){
  if(!sourcePlayerPetGuardCommand(pet))return false;
  const desc={kind:'pet',pet,petId:pet.id};
  // fixed: DuckCheck 只看 COM_GUARD；GuardAdjust 另外要求 WORKCONFUSION<=0。
  return !battleStatusActive(desc,'confusion');
}
function sourcePerformPetNormalGuard(pet,action){
  if(!pet||!petIsBattleActive(pet))return {handled:true,missingPet:true};
  battlePetGuardIds.add(pet.id);
  addLog(pet.name+' 隨機使用「'+(action?.meta?.n||'防禦')+'」，本輪剩餘時間進入防禦姿勢。','pet');
  return {handled:true,skillId:action?.skillId,guarding:true};
}

function battleStatusApplyRaw(targetDesc,type,turns){
  if(battleHasAnyStatus(targetDesc))return false;
  const key=battleStatusKey(targetDesc);
  if(!key)return false;
  battleStatuses.set(key,{type,turns:Math.max(1,Math.trunc(n(turns)))});
  sourceClearPetBattleCommand(targetDesc,type);
  return true;
}
function battleSarsApplyRaw(targetDesc,storedTurns,markCarrier=false){
  const key=battleStatusKey(targetDesc);
  if(!key)return false;
  const existing=battleSarsStates.get(key);
  if(existing&&n(existing.turns)>0)return false;
  battleSarsStates.set(key,{type:'sars',turns:Math.max(1,Math.trunc(n(storedTurns)))});
  if(markCarrier)battleSarsCarrierKeys.add(key);
  return true;
}
function battleSarsClear(targetDesc){
  const key=battleStatusKey(targetDesc);
  return key?battleSarsStates.delete(key):false;
}
function sourceAttackShootApplySleep(targetDesc){
  const key=battleStatusKey(targetDesc);
  if(!key)return false;
  const st=battleStatusGet(targetDesc);
  if(!st){
    battleStatuses.set(key,{type:'sleep',turns:3,sourceAttackShoot:true});
  }else if(st.type==='sleep'){
    st.turns=3;
    st.sourceAttackShoot=true;
  }else{
    battleShootSleepStates.set(key,{type:'sleep',turns:3,sourceAttackShoot:true});
  }
  sourceClearPetBattleCommand(targetDesc,'sleep');
  addLog(battleStatusDescName(targetDesc)+' 被栗子連激打中後陷入睡眠。','bad');
  return true;
}
function sourceProcessAttackShootSleepTurn(desc){
  const st=battleShootSleepGet(desc);
  if(!st||n(st.turns)<=0)return null;
  st.turns=Math.max(0,Math.trunc(n(st.turns))-1);
  if(st.turns<=0){
    const key=battleStatusKey(desc);
    if(key)battleShootSleepStates.delete(key);
    addLog(battleStatusDescName(desc)+' 的睡眠狀態解除。');
    return {expired:true,turns:0};
  }
  return {expired:false,turns:st.turns};
}
const SOURCE_SARS_SLOT_ORDER=Object.freeze([3,1,0,2,4,8,6,5,7,9]);
function sourceBattleStatusDescFromSlot(slot){
  const no=Math.trunc(Number(slot));
  if(no===0&&state)return {kind:'player'};
  if(no===5){
    const pet=activePet();
    if(pet&&!battlePetOutIds.has(pet.id))return {kind:'pet',pet,petId:pet.id};
    return null;
  }
  if(no>=10&&no<20){
    const units=Array.isArray(enemy?.units)&&enemy.units.length?enemy.units:(enemy?[enemy]:[]);
    const unit=units.find(u=>u&&10+Math.max(0,Math.trunc(n(u.battleSlot)))===no)||null;
    return unit?{kind:'enemy',unit,unitId:unit.id}:null;
  }
  return null;
}
function sourceBattleStatusSlot(desc){
  if(desc?.kind==='player')return 0;
  if(desc?.kind==='pet')return 5;
  if(desc?.kind==='enemy'&&desc.unit)return 10+Math.max(0,Math.trunc(n(desc.unit.battleSlot)));
  return -1;
}
function sourceSarsNeighborSlots(slot){
  const no=Math.trunc(Number(slot)),side=no>9?10:0,rel=no-(no>9?10:0);
  const j=SOURCE_SARS_SLOT_ORDER.indexOf(rel);
  if(j<0)return [];
  const out=[],push=i=>{if(i>=0&&i<10)out.push(SOURCE_SARS_SLOT_ORDER[i]+side)};
  if(j>4){
    if((j+1)<10)push(j+1);
    if((j-1)>4)push(j-1);
    if((j-5+1)<5)push(j-5+1);
    if((j-5-1)>=0)push(j-5-1);
    if((j-5)>=0)push(j-5);
  }else{
    if((j+1)<5)push(j+1);
    if((j-1)>=0)push(j-1);
    if((j+5+1)<10)push(j+5+1);
    if((j+5-1)>4)push(j+5-1);
    if((j+5)<10)push(j+5);
  }
  return out;
}
function sourceSarsSpread(desc){
  const sourceKey=battleStatusKey(desc);
  if(!sourceKey||!battleSarsCarrierKeys.has(sourceKey))return [];
  const sourceSlot=sourceBattleStatusSlot(desc);
  if(sourceSlot<0)return [];
  const rolls=[];
  for(const slot of sourceSarsNeighborSlots(sourceSlot)){
    const target=sourceBattleStatusDescFromSlot(slot);
    if(target&&battleStatusActive(target,'sars')){
      rolls.push({slot,skipped:'already-sars'});
      continue;
    }
    const roll=cRand(1,100);
    let applied=false;
    if(roll<=60&&target){
      const targetKey=battleStatusKey(target);
      if(targetKey!==sourceKey&&battleStatusHp(target)>0){
        applied=battleSarsApplyRaw(target,3,false);
        if(applied)addLog(battleStatusDescName(target)+' 被毒煞傳染。','bad');
      }
    }
    rolls.push({slot,roll,applied,target:target?.kind||null});
  }
  return rolls;
}
function sourceProcessSarsStatusTurn(desc){
  const st=battleSarsGet(desc);
  if(!st||n(st.turns)<=0)return null;
  st.turns=Math.max(0,Math.trunc(n(st.turns))-1);
  if(st.turns<=0){
    battleSarsClear(desc);
    addLog(battleStatusDescName(desc)+' 的毒煞狀態解除。');
    return {expired:true,turns:0,damage:0,mpDamage:0,spread:[]};
  }
  const hpBefore=Math.max(0,Math.trunc(n(battleStatusHp(desc))));
  let damage=Math.trunc(hpBefore*10/100);
  if(hpBefore<=damage)damage=hpBefore-1;
  if(damage<0)damage=0;
  if(hpBefore>0)battleStatusSetHp(desc,Math.max(1,hpBefore-damage));
  let mpDamage=0,mpBefore=null,mpAfter=null;
  if(desc.kind==='player'){
    mpBefore=Math.max(0,Math.trunc(n(state.mp)));
    mpDamage=Math.trunc(mpBefore/10);
    state.mp=Math.max(0,mpBefore-mpDamage);
    mpAfter=state.mp;
  }
  if(damage>0||mpDamage>0){
    addLog(battleStatusDescName(desc)+' 因毒煞受到 '+damage+' HP 傷害'
      +(desc.kind==='player'?'，並失去 '+mpDamage+' MP':'')+'。','bad');
  }
  const spread=sourceSarsSpread(desc);
  return {expired:false,turns:st.turns,hpBefore,hpAfter:battleStatusHp(desc),damage,
    mpBefore,mpDamage,mpAfter,spread,carrier:battleSarsCarrierKeys.has(battleStatusKey(desc))};
}
function battleStatusWakeOnDamage(targetDesc,damage){
  if(n(damage)>0&&battleStatusActive(targetDesc,'sleep')){
    battleStatusClear(targetDesc,'sleep');
    addLog((targetDesc.kind==='player'?'你':targetDesc.pet?.name||targetDesc.unit?.name||'目標')+' 被攻擊喚醒了。');
  }
}
function battleStatusHp(desc){
  if(desc?.kind==='player')return n(state.hp);
  if(desc?.kind==='pet')return n((desc.pet||{}).hp);
  if(desc?.kind==='enemy')return n((desc.unit||{}).hp);
  return 0;
}
function battleStatusSetHp(desc,hp){
  hp=Math.max(0,Math.trunc(n(hp)));
  if(desc?.kind==='player')state.hp=hp;
  else if(desc?.kind==='pet'&&desc.pet)desc.pet.hp=hp;
  else if(desc?.kind==='enemy'&&desc.unit)desc.unit.hp=hp;
}
function battleStatusDescAlive(desc){
  if(desc?.kind==='player')return state.hp>0;
  if(desc?.kind==='pet')return !!desc.pet&&petIsBattleActive(desc.pet);
  if(desc?.kind==='enemy')return !!desc.unit&&n(desc.unit.hp)>0;
  return false;
}
function battleStatusDescName(desc){
  if(desc?.kind==='player')return '你';
  if(desc?.kind==='pet')return desc.pet?.name||'寵物';
  if(desc?.kind==='enemy')return desc.unit?.name||'敵人';
  return '目標';
}
function battleStatusDescView(desc){
  if(desc?.kind==='player')return playerBattleView();
  if(desc?.kind==='pet')return petBattleView(desc.pet);
  if(desc?.kind==='enemy')return enemyBattleView(desc.unit);
  return null;
}
function battleStatusActorDesc(actor){
  if(actor?.kind==='player')return {kind:'player'};
  if(actor?.kind==='pet'){
    const pet=state.petBox.find(p=>p.id===actor.petId);
    return pet&&petIsBattleActive(pet)?{kind:'pet',pet,petId:pet.id}:null;
  }
  if(actor?.kind==='enemy'){
    const unit=livingEnemyUnits().find(u=>u.id===actor.unitId);
    return unit?{kind:'enemy',unit,unitId:unit.id}:null;
  }
  return null;
}
function battleStatusPoisonDamage(desc){
  const raw=battleStatusRawStats(desc);
  const total=Math.trunc(n(raw.vital)+n(raw.str)+n(raw.dex)+n(raw.tgh));
  let down=Math.trunc((Math.trunc(total/100)-20)/4);
  if(down<1)down=1;
  const hp=battleStatusHp(desc);
  if(hp<=down)down=hp-1;
  if(down<0)down=0;
  battleStatusSetHp(desc,Math.max(1,hp-down));
  return down;
}
function sourceEnemyFoxRoundActive(unit){
  return !!unit&&unit.sourceFoxTurn!=null&&Number.isFinite(Number(unit.sourceFoxTurn));
}
function sourceEnemyFoxFormActive(unit){
  return sourceEnemyFoxRoundActive(unit)||unit?.sourceFoxImage===true;
}
function sourceEnemyFoxStatusSeq(unit){
  if(!sourceEnemyFoxRoundActive(unit))return {active:false,recovered:false};
  const currentTurn=Math.max(0,Math.trunc(n(enemy?.sourceBattleTurn)));
  const startTurn=Math.trunc(Number(unit.sourceFoxTurn));
  unit.sourceFoxImage=true;
  if(currentTurn-startTurn>2){
    unit.sourceFoxTurn=null;
    unit.sourceFoxImage=false;
    unit.roundAttack=Math.trunc(n(unit.roundFixAttack??unit.attack));
    unit.roundDefense=Math.trunc(n(unit.roundFixDefense??unit.defense));
    unit.roundQuick=Math.trunc(n(unit.roundFixQuick??unit.quick));
    addLog(unit.name+' 的媚惑術小狐狸狀態解除。');
    return {active:false,recovered:true,currentTurn,startTurn};
  }
  unit.roundAttack=Math.trunc(n(unit.roundFixAttack??unit.attack)*.8);
  unit.roundDefense=Math.trunc(n(unit.roundFixDefense??unit.defense)*.8);
  unit.roundQuick=Math.trunc(n(unit.roundFixQuick??unit.quick)*.8);
  return {active:true,recovered:false,currentTurn,startTurn};
}
function sourceEnemyFoxCommandGate(unit,actor){
  if(!sourceEnemyFoxFormActive(unit))return {active:false,blocked:false,forceFist:false};
  const kind=actor?.enemyAction||'attack';
  if(kind==='attack')return {active:true,blocked:false,forceFist:true};
  if(kind==='guard'||kind==='none')return {active:true,blocked:false,forceFist:false};
  unit.counterEligibleThisTurn=false;
  unit.guardThisTurn=false;
  unit.noGuardThisTurn=false;
  unit.noGuardDuckBonus=0;
  unit.noGuardCounterBonus=0;
  if(unit.guardianReadyThisTurn){
    const owner=enemyGuardianOwner(unit);
    if(owner?.guardedByUnitId===unit.id)owner.guardedByUnitId=null;
    unit.guardianReadyThisTurn=false;
  }
  if(unit.chargeState)unit.chargeState=null;
  if(unit.earthRoundState)unit.earthRoundState=null;
  addLog(unit.name+' 仍是小狐狸，只能攻擊、防禦或待機；本回合特殊指令取消。');
  return {active:true,blocked:true};
}
function processBattleStatusTurn(actor){
  const desc=battleStatusActorDesc(actor);
  if(!desc)return {skip:false,desc:null,status:null};

  if(desc.kind==='enemy'){
    // 原 BATTLE_StatusSeq 尾端：SetDuck / SetMagicPet 各自按「輪到該角色行動」扣 1。
    if(n(desc.unit?.skillDuckTurns)>0){
      desc.unit.skillDuckTurns=Math.max(0,Math.trunc(n(desc.unit.skillDuckTurns))-1);
      if(desc.unit.skillDuckTurns<=0){
        desc.unit.skillDuckPower=0;
        addLog(desc.unit.name+' 的閃避術效果結束。');
      }
    }
    if(n(desc.unit?.mySkillTghTurns)>0){
      desc.unit.mySkillTghTurns=Math.max(0,Math.trunc(n(desc.unit.mySkillTghTurns))-1);
      if(desc.unit.mySkillTghTurns<=0){
        desc.unit.mySkillTghPower=0;
        addLog(desc.unit.name+' 的大地鎧甲效果結束。');
      }
    }

    // 原主迴圈在 BATTLE_StatusSeq 後緊接 BATTLE_MagicStatusSeq；
    // 鐵壁 MagicTbl 倒數同樣在角色自己的行動開始前遞減。
    if(n(desc.unit?.superWallTurns)>0){
      desc.unit.superWallTurns=Math.max(0,Math.trunc(n(desc.unit.superWallTurns))-1);
      if(desc.unit.superWallTurns<=0){
        desc.unit.superWallPower=0;
        addLog(desc.unit.name+' 的鐵壁效果結束。');
      }
    }
    sourceEnemyFoxStatusSeq(desc.unit);
  }

  const blockedBefore=battleStatusCanMove(desc)===false;
  const attackShootSleep=sourceProcessAttackShootSleepTurn(desc);
  const finish=result=>{
    const sars=sourceProcessSarsStatusTurn(desc);
    const extra={};
    if(attackShootSleep)extra.attackShootSleep=attackShootSleep;
    if(sars)extra.sars=sars;
    return Object.keys(extra).length?Object.assign({},result,extra):result;
  };
  const st=battleStatusGet(desc);
  if(!st||st.turns<=0)return finish({skip:blockedBefore,desc,status:null});

  if(st.type==='weaken'||st.type==='barrier'){
    // Source BATTLE_StatusSeq does --cnt, then if the same WORK value is still >0
    // immediately writes cnt+1 back. Net result: >1 stays unchanged; 1 becomes 0.
    if(Math.trunc(n(st.turns))<=1){
      battleStatusClear(desc,st.type);
      addLog((desc.kind==='player'?'你':desc.pet?.name||desc.unit?.name||'目標')+' 的'+(BATTLE_STATUS_NAMES[st.type]||st.type)+'狀態解除。');
      return finish({skip:blockedBefore,desc,status:st,expired:true,preCommandStatus:true});
    }
    return finish({skip:blockedBefore,desc,status:st,preCommandStatus:true});
  }

  st.turns--;

  if(st.type==='deepPoison'){
    const hp=battleStatusHp(desc);
    const name=desc.kind==='player'?'你':desc.pet?.name||desc.unit?.name||'目標';
    // 原 StatusSeq：HP<=1 直接死亡；否則倒數降到 <=1 時也直接死亡。
    if(hp<=1||st.turns<=1){
      battleStatusSetHp(desc,0);
      battleStatusClear(desc,'deepPoison');
      addLog(name+' 身中劇毒未解而倒下了！','bad');
      return finish({skip:true,desc,status:st,deepPoisonDeath:true});
    }
    const down=battleStatusPoisonDamage(desc);
    if(down>0)addLog(name+' 因劇毒受到 '+down+' 傷害。','bad');
    return finish({skip:false,desc,status:st});
  }

  if(st.turns<=0){
    if(st.type==='drunk'){
      // fixed C BATTLE_StatusSeq：酒醉歸零時直接 WORKQUICK *= 2（無騎乘）。
      // 命中時其實沒有把 QUICK /2，所以這是「解除當回合暫時 2x QUICK」的來源 bug。
      const key=battleStatusKey(desc);
      if(key)battleDrunkReleaseBoostKeys.add(key);
    }
    battleStatusClear(desc);
    addLog((desc.kind==='player'?'你':desc.pet?.name||desc.unit?.name||'目標')+' 的'+(BATTLE_STATUS_NAMES[st.type]||st.type)+'狀態解除。');
    return finish({skip:blockedBefore,desc,status:st,expired:true,drunkReleaseBoost:st.type==='drunk'});
  }

  if(st.type==='poison'){
    const down=battleStatusPoisonDamage(desc);
    if(down>0)addLog((desc.kind==='player'?'你':desc.pet?.name||desc.unit?.name||'目標')+' 因中毒受到 '+down+' 傷害。','bad');
  }
  if(st.type==='confusion'&&cRand(1,100)<=80){
    return finish({skip:false,desc,status:st,confusionAttack:true});
  }
  return finish({skip:blockedBefore,desc,status:st});
}
function battleStatusTypeFromOption(option){
  const t=String(option||'');
  if(t.includes('煞'))return 'sars';
  if(t.includes('剧')||t.includes('劇'))return 'deepPoison';
  if(t.includes('毒'))return 'poison';
  if(t.includes('虚')||t.includes('虛'))return 'weaken';
  if(t.includes('石'))return 'stone';
  if(t.includes('眠'))return 'sleep';
  if(t.includes('乱')||t.includes('亂'))return 'confusion';
  if(t.includes('醉'))return 'drunk';
  if(t.includes('障'))return 'barrier';
  if(t.includes('默'))return 'nocast';
  return null;
}
function battleStatusTurnFromOption(option){
  const m=String(option||'').match(/turn\s*(\d+)/i);
  return m?Math.max(0,Math.trunc(Number(m[1]))):0;
}
function battleDrunkQuick(desc,quick){
  const base=n(quick);
  const key=battleStatusKey(desc);
  // fixed C 的 StatusChange 命中酒醉時除的是 CHAR_WORKDRUNK 倒數，不是 WORKQUICK。
  // 因此酒醉存續期間 QUICK 維持原值；倒數歸零的 StatusSeq 反而 WORKQUICK *= 2，
  // 並在下一輪 BATTLE_PreCommandSeq -> complianceParameter 才恢復 FIXDEX。
  if(key&&battleDrunkReleaseBoostKeys.has(key))return Math.trunc(base*2);
  return base;
}
function playerBattleView(){
  const desc={kind:'player'};
  const stone=battleStatusActive(desc,'stone');
  const drunk=battleStatusActive(desc,'drunk');
  const weaken=battleWeakenRoundActive(desc);
  const attack=weaken?Math.trunc(n(state.attack)*.8):n(state.attack);
  const defenseBase=weaken?Math.trunc(n(state.defense)*.8):n(state.defense);
  const quickBase=weaken?Math.trunc(n(state.dex)*.8):n(state.dex);
  return {
    type:'player',attack,defense:defenseBase,stone,
    fixedTough:weaken?Math.trunc(n(state.playerStats?.tgh)*.8):n(state.playerStats?.tgh),
    fixedDex:quickBase,quick:battleDrunkQuick(desc,quickBase),
    luck:n(state.luck),drunk,weaponType:0,weaponCritical:0,throwWeapon:false,
    canMove:battleStatusCanMove(desc),
    level:Math.max(1,Math.trunc(n(state.level))),elements:battleElementsForDesc(desc)
  };
}
function petBattleView(pet){
  if(!pet)return null;
  const combat=pet.serverStats?(pet.serverCombat=petServerCombat(pet.serverStats)):petFallbackCombat(pet);
  syncPetBattleHp(pet,true);
  const desc={kind:'pet',pet,petId:pet.id};
  const stone=battleStatusActive(desc,'stone');
  const drunk=battleStatusActive(desc,'drunk');
  const weaken=battleWeakenRoundActive(desc);
  const earth=battlePetEarthRoundStates.get(pet.id)||null;
  const frozen=earth?.snapshot||null;
  const normalAttackBase=weaken?Math.trunc(n(combat?.attack)*.8):n(combat?.attack);
  const normalDefenseBase=weaken?Math.trunc(n(combat?.defense)*.8):n(combat?.defense);
  const normalQuickBase=weaken?Math.trunc(n(combat?.quick)*.8):n(combat?.quick);
  const powerMod=battlePetPowerMods.get(pet.id)||null;
  const noGuard=battlePetNoGuardStates.get(pet.id)||null;
  const attack=frozen?Math.trunc(n(frozen.attack))
    :(powerMod&&Number.isFinite(Number(powerMod.attack))?Math.trunc(Number(powerMod.attack)):normalAttackBase);
  const defense=frozen?Math.trunc(n(frozen.defense))
    :(powerMod&&Number.isFinite(Number(powerMod.defense))?Math.trunc(Number(powerMod.defense)):normalDefenseBase);
  const fixedToughBase=pet.serverStats?n(pet.serverStats.tgh)*.01:n(pet.stats?.tgh);
  const fixedTough=frozen?Number(frozen.fixedTough):weaken?Math.trunc(fixedToughBase*.8):fixedToughBase;
  const fixedDex=frozen?Number(frozen.fixedDex):normalQuickBase;
  const workQuickBase=frozen?Number(frozen.workQuickBase??frozen.fixedDex??frozen.quick):normalQuickBase;
  const elements=frozen?.elements?Object.assign({},frozen.elements):battleElementsForDesc(desc);
  return {
    type:'pet',attack,defense,stone,
    duckBonus:n(noGuard?.duckBonus),counterBonus:n(noGuard?.counterBonus),
    fixedTough,fixedDex,workQuickBase,quick:battleDrunkQuick(desc,workQuickBase),
    luck:0,drunk,weaponType:0,weaponCritical:0,throwWeapon:false,
    canMove:battleStatusCanMove(desc),
    level:Math.max(1,Math.trunc(n(pet.level))),elements
  };
}
function enemyBattleView(unit){
  const desc={kind:'enemy',unit,unitId:unit?.id};
  const stone=battleStatusActive(desc,'stone');
  const drunk=battleStatusActive(desc,'drunk');
  const attackBase=n(unit?.roundAttack??unit?.attack);
  const defenseRaw=n(unit?.roundDefense??unit?.defense);
  const quickRaw=n(unit?.roundQuick??unit?.quick);
  return {
    type:'enemy',
    attack:attackBase,
    defense:defenseRaw,stone,
    fixedDex:n(unit?.roundFixQuick??unit?.quick),
    quick:battleDrunkQuick(desc,quickRaw),
    luck:0,
    weaponType:Math.trunc(n(unit?.weaponType)),weaponCritical:n(unit?.weaponCritical),throwWeapon:!!unit?.throwWeapon,
    drunk,
    canMove:battleStatusCanMove(desc),
    skillDuckPower:n(unit?.skillDuckTurns)>0?n(unit?.skillDuckPower):0,
    superWallPower:n(unit?.superWallTurns)>0?n(unit?.superWallPower):0,
    counterBonus:n(unit?.noGuardCounterBonus),
    duckBonus:n(unit?.noGuardDuckBonus),
    level:Math.max(1,Math.trunc(n(unit?.level))),elements:battleElementsForDesc(desc)
  };
}
function enemyAiAttackSpec(unit){
  const ai=unit?.ai||enemyAiDb?.byEnemyId?.[String(unit?.enemyId)]||null;
  const a=Array.isArray(ai?.a)?ai.a:[0,1,1];
  return {
    tactics:Math.trunc(n(ai?.t)||1),
    attackWeight:Math.max(0,Math.trunc(n(a[0]))),
    targetType:Math.trunc(n(a[1]))||1,
    selectMode:Math.trunc(n(a[2]))||1,
    guardWeight:Math.max(0,Math.trunc(n(ai?.g))),
    magicWeight:Math.max(0,Math.trunc(n(ai?.m))),
    escapeWeight:Math.max(0,Math.trunc(n(ai?.e))),
    skillWeights:Array.isArray(ai?.w)?ai.w.slice(0,7).map(x=>Math.max(0,Math.trunc(n(x)))):Array(7).fill(0),
    skillIds:Array.isArray(ai?.p)?ai.p.slice(0,7):Array(7).fill(null),
    rare:Math.trunc(n(ai?.q)),
    statusResist:Array.isArray(ai?.z)?ai.z.slice(0,6).map(x=>Math.trunc(n(x))):Array(6).fill(0),
    rn:Object.prototype.hasOwnProperty.call(ai||{},'r')?Math.max(0,Math.trunc(n(ai.r))):1
  };
}
const ENEMY_SOURCE_SKILL_META={
  121:{n:'T地球一周',d:'一回合從敵人背後以更高攻擊力攻擊',f:'PETSKILL_EarthRound',o:'攻%+200',field:1,target:6},
  500:{n:'E復活術',d:'ENEMY 專屬復活術 LV1',f:'ENEMYSKILL_ReLife',o:'',field:1,target:2},
  501:{n:'E回復技',d:'ENEMY 專屬回復技 LV1',f:'ENEMYSKILL_ReHP',o:'',field:1,target:2},
  502:{n:'E招喚',d:'ENEMY 專屬招喚 LV1',f:'ENEMYSKILL_EnemyHELP',o:'',field:1,target:2},
  503:{n:'嗜血技',d:'傷害的一部分轉為自身 HP',f:'PETSKILL_DamageToHp',o:'30|50',field:1,target:6},
  504:{n:'嗜血技2',d:'傷害的 70% 轉為自身 HP',f:'PETSKILL_DamageToHp',o:'20|70',field:1,target:6},
  505:{n:'嗜血技3',d:'傷害的 100% 轉為自身 HP',f:'PETSKILL_DamageToHp',o:'10|100',field:1,target:6},
  // V0.66 runtime 邊界：資料與函式都存在，但結果依賴原 server 全域 Char / ITEM existing-index 當下配置。
  211:{n:'捐獻',d:'StealMoney；Enemy WORKPLAYERINDEX 預設 0，是否有效取決於原 server 當下 char slot 0',f:'PETSKILL_StealMoney',o:'',field:1,target:7},
  // V0.63：原 PETSKILL_MpDamage 第一參數存在 C 整數除法 bug：50/100 先算成 0，因此物理攻擊力實際不下降。
  506:{n:'MP攻擊',d:'物理命中玩家後扣除當下 MP 50%；原 C 的攻擊力-50% parser 實際不生效',f:'PETSKILL_MpDamage',o:'50|50',field:1,target:6},
  507:{n:'MP攻擊2',d:'物理命中玩家後扣除當下 MP 75%；原 C 的攻擊力-50% parser 實際不生效',f:'PETSKILL_MpDamage',o:'50|75',field:1,target:6},
  508:{n:'MP攻擊3',d:'物理命中玩家後扣除當下 MP 100%；原 C 的攻擊力-50% parser 實際不生效',f:'PETSKILL_MpDamage',o:'50|100',field:1,target:6},
  541:{n:'狂暴攻擊',d:'多段狂暴攻擊',f:'PETSKILL_WildViolentAttack',o:'攻%+80 防%-35 回避30',field:1,target:6},
  542:{n:'疾速攻擊',d:'防禦下降；此來源函式未實作資料描述的敏捷增加',f:'PETSKILL_SpeedyAttack',o:'防%-30 敏%+30',field:1,target:6},
  543:{n:'破除防禦之2',d:'防禦目標增傷、非防禦目標減傷',f:'PETSKILL_GuardBreak2',o:'',field:1,target:6},
  613:{n:'狂亂暴走',d:'亂數攻擊對手 3 次，攻防下降',f:'PETSKILL_AttackCrazed',o:'3',field:1,target:1},
  614:{n:'栗子連激',d:'亂數連續投擲栗子 3~5 顆',f:'PETSKILL_AttackShoot',o:'3|5',field:1,target:1},
  620:{n:'威嚇攻擊',d:'攻擊 -30%、敏捷 -30%；攻擊前以原 PROFESSION 判定嘗試麻痺 1 回合',f:'PETSKILL_Hector',o:'麻 turn 1 攻%-30 敏%-30',field:1,target:1},
  622:{n:'針刺外皮',d:'可令攻擊者受到 1/2 的傷害',f:'PETSKILL_Acupuncture',o:'',field:1,target:0},
  617:{n:'毒煞蔓延',d:'物理命中後感染毒煞，主傳染者可向鄰格擴散',f:'PETSKILL_Sars',o:'煞',field:1,target:1},
  615:{n:'撕裂傷口1',d:'撕裂舊傷口，增加已損失 HP 20% 的傷害',f:'PETSKILL_BattleTearDamage',o:'20',field:1,target:1},
  633:{n:'群蝠四竄',d:'吸取敵方整側目前 HP 的一部分回復自身',f:'PETSKILL_BatFly',o:'',field:1,target:3},
  // V0.64：分身地裂；直接操作敵方整側 MP／HP，不走命中、屬性、Guard 或 Counter。
  634:{n:'分身地裂',d:'敵方玩家先扣當下 MP 的一半，再對敵方整側各自扣目前 HP 20%',f:'PETSKILL_DivideAttack',o:'',field:1,target:3},
  // V0.65：Combined 固定把 COM3 high 清 0；MAGIC_DirectUse 對非玩家將 itemnum=0 當 ITEM existing index，index 0 永遠未配置，因此 mp=-1。
  627:{n:'難得糊塗',d:'隨機施放恩惠／毒／石／亂／醉／眠 Lv5 系列之一',f:'PETSKILL_Combined',o:'综合法|6|21|139|159|169|179|189',field:1,target:3},
  632:{n:'逆轉',d:'施放 magic 240 彩虹精靈，切換目標地火／水風反轉',f:'PETSKILL_Combined',o:'综合法|1|240',field:1,target:1},
  637:{n:'淨化之舞',d:'施放 magic 61，高等淨化精靈 Lv2',f:'PETSKILL_Combined',o:'综合法|1|61',field:1,target:2},
  705:{n:'調和',d:'施放 magic 230，將戰場屬性設為無',f:'PETSKILL_Combined',o:'综合法|1|230',field:1,target:2},
  590:{n:'虎虎生威',d:'5 個物理攻擊物件並附加石化',f:'PETSKILL_BattleModel',o:'5|5|石|3|30|攻%15|100871 100872',field:1,target:3},
  616:{n:'撕裂傷口2',d:'撕裂舊傷口，增加已損失 HP 50% 的傷害',f:'PETSKILL_BattleTearDamage',o:'50',field:1,target:1},
  640:{n:'憾甲一擊',d:'忽略裝備防禦並貫穿前後排',f:'PETSKILL_Regret',o:'命%20 攻%30 防%-50',field:1,target:7},
  651:{n:'撕裂傷口4',d:'依技能 option 增加已損失 HP 傷害',f:'PETSKILL_BattleTearDamage',o:'150',field:1,target:1},
  655:{n:'虎虎生威',d:'5 個物理攻擊物件並附加石化',f:'PETSKILL_BattleModel',o:'5|5|石|3|30|攻%15|100871 100872',field:1,target:3},
  656:{n:'撕裂傷口3',d:'撕裂舊傷口，增加已損失 HP 70% 的傷害',f:'PETSKILL_BattleTearDamage',o:'70',field:1,target:1},
  666:{n:'T憾甲一擊',d:'憾甲一擊強化版',f:'PETSKILL_Regret',o:'命%30 攻%60 防-20%',field:1,target:7},
  689:{n:'Q雷分身術',d:'5 個物理攻擊物件並附加魔障',f:'PETSKILL_BattleModel',o:'5|5|障|3|30|攻%10|101996',field:1,target:3},
  // V0.45：同序列 petskill2.txt 與原 C 函式都已交叉確認；只補可沿用既有戰鬥底層的正權重技能。
  14:{n:'T六段攻擊',d:'6 段連續攻擊',f:'PETSKILL_ContinuationAttack',o:'6',field:1,target:6},
  15:{n:'T七段攻擊',d:'7 段連續攻擊',f:'PETSKILL_ContinuationAttack',o:'7',field:1,target:6},
  16:{n:'T八段攻擊',d:'8 段連續攻擊',f:'PETSKILL_ContinuationAttack',o:'8',field:1,target:6},
  17:{n:'T九段攻擊',d:'9 段連續攻擊',f:'PETSKILL_ContinuationAttack',o:'9',field:1,target:6},
  53:{n:'背水之戰之其３',d:'攻擊 +70%、防禦 -65%',f:'PETSKILL_PowerBalance',o:'攻%+70 防%-65',field:1,target:6},
  54:{n:'T背水之戰之其４',d:'攻擊 +100%、防禦 -70%',f:'PETSKILL_PowerBalance',o:'攻%+100 防%-70',field:1,target:6},
  579:{n:'魔障',d:'敵方全體一回合無法行動',f:'PETSKILL_Barrier',o:'障 turn 1 成 50',field:1,target:3},
  594:{n:'究極魔障',d:'敵方全體三回合無法行動',f:'PETSKILL_Barrier',o:'障 turn 3 成 50',field:1,target:3},
  605:{n:'三重突擊',d:'蓄力 3 回合後攻擊 +150%',f:'PETSKILL_ChargeAttack',o:'3 攻%+150',field:1,target:6},
  671:{n:'暴走',d:'多段暴走攻擊',f:'PETSKILL_WildViolentAttack',o:'攻%+115 防%-25 回避10',field:1,target:6},
  676:{n:'E水的精靈',d:'AttackMagic magic 204；item 20900 對 Enemy 是動態 ITEM existing index',f:'PETSKILL_AttackMagic',o:'magic 204 item 20900',field:1,target:7},
  688:{n:'E咒靈術',d:'AttackMagic magic 435；item 20912 對 Enemy 是動態 ITEM existing index',f:'PETSKILL_AttackMagic',o:'magic 435 item 20912',field:1,target:7},
  708:{n:'石化攻擊',d:'攻擊 -30% 並嘗試石化 9 回合',f:'PETSKILL_StatusChange',o:'石 turn 9  攻%-30',field:1,target:6},
  // V0.46：原 C 已確認的純物理／屬性特殊技；不碰 MP / AttackMagic。
  544:{n:'地屬性強化攻擊',d:'對地屬性目標追加傷害',f:'PETSKILL_Modifyattack',o:'EA|20',field:1,target:6},
  545:{n:'水屬性強化攻擊',d:'對水屬性目標追加傷害',f:'PETSKILL_Modifyattack',o:'WA|20',field:1,target:6},
  546:{n:'火屬性強化攻擊',d:'對火屬性目標追加傷害',f:'PETSKILL_Modifyattack',o:'FI|20',field:1,target:6},
  548:{n:'地屬性轉換攻擊',d:'本次攻擊轉成 100 地屬性',f:'PETSKILL_Mdfyattack',o:'EA|100',field:1,target:6},
  549:{n:'水屬性轉換攻擊',d:'本次攻擊轉成 100 水屬性',f:'PETSKILL_Mdfyattack',o:'WA|100',field:1,target:6},
  550:{n:'火屬性轉換攻擊',d:'本次攻擊轉成 100 火屬性',f:'PETSKILL_Mdfyattack',o:'FI|100',field:1,target:6},
  551:{n:'風屬性轉換攻擊',d:'本次攻擊轉成 100 風屬性',f:'PETSKILL_Mdfyattack',o:'WI|100',field:1,target:6},
  618:{n:'音波衝擊',d:'攻擊寵物時再以半傷貫穿主人',f:'PETSKILL_Sonic',o:'',field:1,target:1},
  619:{n:'回旋攻擊',d:'攻擊 -50%，攻擊目標所在一排',f:'PETSKILL_Gyrate',o:'攻%-50',field:1,target:1},
  653:{n:'T回旋攻擊',d:'攻擊 +20%，攻擊目標所在一排',f:'PETSKILL_Gyrate',o:'攻%+20',field:1,target:1},
  713:{n:'追跡攻擊',d:'首擊被閃避時有機會追擊',f:'PETSKILL_Retrace',o:'攻%+100',field:1,target:1},
  825:{n:'地屬性強化攻擊',d:'對地屬性目標追加大量傷害',f:'PETSKILL_Modifyattack',o:'EA|9999',field:1,target:6},
  826:{n:'水屬性強化攻擊',d:'對水屬性目標追加大量傷害',f:'PETSKILL_Modifyattack',o:'WA|9999',field:1,target:6},
  827:{n:'火屬性強化攻擊',d:'對火屬性目標追加大量傷害',f:'PETSKILL_Modifyattack',o:'FI|9999',field:1,target:6},
  828:{n:'風屬性強化攻擊',d:'對風屬性目標追加大量傷害',f:'PETSKILL_Modifyattack',o:'WI|9999',field:1,target:6},
  // V0.47：狀態／自體回避技能，皆由原 C 的 battle_event / battle_magic / StatusSeq 還原。
  575:{n:'虛弱',d:'三回合內攻防敏下降 20%',f:'PETSKILL_Weaken',o:'虚 turn 3 成 50',field:1,target:6},
  576:{n:'全體虛弱',d:'敵全體三回合內攻防敏下降 20%',f:'PETSKILL_Weaken',o:'虚 turn 3 成 50',field:1,target:3},
  577:{n:'劇毒',d:'中劇毒五回合，未解除則死亡',f:'PETSKILL_Deeppoison',o:'剧 turn 5 成 50',field:1,target:6},
  578:{n:'全體劇毒',d:'敵全體中劇毒五回合，未解除則死亡',f:'PETSKILL_Deeppoison',o:'剧 turn 5 成 50',field:1,target:3},
  595:{n:'閃避術',d:'三回合內啟用獨立回避判定',f:'PETSKILL_SetDuck',o:'3|60',field:1,target:0},
  // V0.48：支援技與暗月狂狼變體；只接原 C 可完整還原者。
  592:{n:'淨化',d:'解除我方全體異常狀態',f:'PETSKILL_Refresh',o:'全',field:1,target:2},
  659:{n:'T浴血狂襲',d:'攻敏上升、會心提升並將傷害轉為 HP',f:'PETSKILL_DamageToHp2',o:'100',field:1,target:6},
  // V0.49：來源自帶狀態欄位的防禦支援技，不依賴 magic.txt / attmagic.bin。
  552:{n:'鐵壁',d:'我方全體獲得 3 回合鐵壁',f:'PETSKILL_MagicStatusChange',o:'铁壁|3|30|全',field:1,target:2},
  565:{n:'銅牆',d:'我方全體獲得 5 回合強化鐵壁',f:'PETSKILL_MagicStatusChange',o:'铁壁|5|40|全',field:1,target:2},
  601:{n:'大地鎧甲',d:'我方全體 TGH 強化 3 回合',f:'PETSKILL_SetMagicPet',o:'3|15|TGH',field:1,target:2},
  // V0.50：一般 BATTLE_Attack 型劇毒攻擊；與 Deeppoison 獨立技的 turn+2 路徑不同。
  707:{n:'劇毒攻擊',d:'攻擊 +20%，命中後附加劇毒',f:'PETSKILL_StatusChange',o:'剧 turn 6  攻%+20',field:1,target:6},
  // V0.51：原 BATTLE_S_AttackDamage 的怯戰系；成功後依來源把目標趕離／收回戰場。
  606:{n:'怯戰',d:'攻 70%、防 40%、敏 80%；命中後可能使目標逃離',f:'PETSKILL_BattleTimid',o:'',field:1,target:6},
  636:{n:'狂獅怒吼',d:'攻 50%、敏 130%；可能使敵方寵物回到寵物欄',f:'PETSKILL_2BattleTimid',o:'-攻%50+敏%30命%60',field:1,target:7},
  // V0.53：Enemy AI 會把既有對手側 target 直接傳給 Sacrifice，因此來源會替玩家／寵物補血。
  573:{n:'救援',d:'自身目前 HP 對半，將對半後的 HP 加到目標',f:'PETSKILL_Sacrifice',o:'',field:1,target:1},
  // V0.54：Enemy 對玩家側使用時，來源 PETFLG 條件使變狐附加效果永遠不成立；
  // 但 BECOMEFOX command 仍走完整普通物理攻擊與 Counter 鏈。
  // V0.62：火線獵殺；原 battle.c 固定物理攻 80%，再對目標所在一排施放火屬性 Power 200 / MagicLv 4。
  624:{n:'火線獵殺',d:'攻擊 80% 特殊物理攻擊後，對目標所在一排追加火屬性 Power 200／MagicLv 4',f:'PETSKILL_Firekill',o:'',field:1,target:1},
  625:{n:'媚惑術',d:'來源玩家寵物 PETFLG=0；Enemy 使用時等價普通物理攻擊',f:'PETSKILL_BecomeFox',o:'',field:1,target:1},
  626:{n:'手下留情',d:'致死物理傷害改為留下 1 HP；保留 SHOWMERCY command lifecycle',f:'PETSKILL_ShowMercy',o:'',field:1,target:1},
  // V0.55：_BATTLE_ABDUCTII 旅程伙伴3；以玩家寵物 FIXAI 與 option 80 判定。
  608:{n:'E旅程伙伴3',d:'目標寵物 FIXAI 低於 80 時必定帶走',f:'PETSKILL_Abduct',o:'80',field:1,target:7},
  // V0.56：光鏡吸收技；目前玩家側沒有 DamageReact work-int，精準走 ReactType=0 分支。
  610:{n:'破鏡重圓',d:'嘗試吸收對方 REFLEC；無鏡時仍以攻70%／防50%物理攻擊',f:'PETSKILL_Lighttakeed',o:'REFLEC',field:1,target:7},
  611:{n:'穿透術',d:'嘗試吸收對方 VANISH；無守時仍以攻70%／防50%物理攻擊',f:'PETSKILL_Lighttakeed',o:'VANISH',field:1,target:7},
  // V0.57：沉默只對非 PET 目標寫 WORKNOCAST=turn；不阻止普通移動／攻擊。
  580:{n:'沉默',d:'敵全體無法使用咒術三回合',f:'PETSKILL_Nocast',o:'默 turn 3 成 50',field:1,target:3},
  // V0.58：現版玩家無裝備耐久；ToothCrushe 的額外破壞分支不可達，但特殊物理傷害仍成立。
  574:{n:'E嚙齒術',d:'破壞對方裝備武器；現況無裝備時只保留特殊物理攻擊',f:'PETSKILL_ToothCrushe',o:'',field:1,target:6},
  // V0.60：黑烏力化；保留 30%／180 秒／重複累加與普通物理 Counter 鏈。
  // 現版玩家可用指令都在原允許清單內，因此不虛構攻防 debuff。
  635:{n:'黑烏力化',d:'命中玩家後 30% 變黑烏力 180 秒；現況不改攻防數值',f:'PETSKILL_BecomePig',o:'30 180 100388',field:1,target:7}
};

// V0.52：原 gavinlinasd/StoneAge 這個 build 已開 _PETSKILL_OPTIMUM。
// 以下 ID 被 Enemy AI 正權重引用，但在該 build 的 gmsv/data/petskill2.txt 完全沒有定義。
// PETSKILL_getPetskillArray() 對這些槽位返回 -1，PETSKILL_Use() FALSE；
// BATTLE_ai_all() 因此不把 Enemy 從 C_WAIT 改成 C_OK，該角色整回合在 StatusSeq 前就被跳過。
const ENEMY_SOURCE_MISSING_SKILL_IDS=new Set([
  -1,18,65,111,112,113,114,
  509,510,511,512,513,515,518,
  558,559,560,588,589,645,729,745
]);

// V0.59：資料列存在，但這個 build 的 PETSKILL_functbl 沒有可被該字串命中的函式。
// 502 是大小寫不一致：資料 ENEMYSKILL_EnemyHELP，functbl ENEMYSKILL_EnemyHelp。
// 582 則完全沒有 PETSKILL_SelfExplodeAttack 函式／註冊項，version.h 也標成不可開。
// 兩者都會在 PETSKILL_getPetskillFuncPointer() 得到 NULL，PETSKILL_Use() return FALSE。
const ENEMY_SOURCE_UNREGISTERED_SKILL_IDS=new Set([502,582]);

// V0.66：這些 PetSkill 在來源中不是 missing / unregistered；PETSKILL_Use 本身會成功，
// 但實際 battle effect 依賴本前端沒有的原 server 全域 runtime 狀態，不能靜態決定。
// 必須保留 AI 權重與正常 StatusSeq，但不可猜效果、也不可改成普通攻擊。
const ENEMY_SOURCE_RUNTIME_BLOCKED_SKILL_IDS=new Set([]);

function enemyPetSkillMeta(skillId){
  if(skillId==null)return null;
  return petSkillDb?.byId?.[String(skillId)]||ENEMY_SOURCE_SKILL_META[Number(skillId)]||null;
}
function enemyChooseAction(unit){
  const spec=enemyAiAttackSpec(unit);
  if(unit?.chargeState){
    return {
      kind:'charge',spec,
      skillId:unit.chargeState.skillId,
      skillSlot:unit.chargeState.skillSlot,
      skillMeta:enemyPetSkillMeta(unit.chargeState.skillId)
    };
  }
  if(unit?.earthRoundState){
    return {
      kind:'earthround',spec,
      skillId:unit.earthRoundState.skillId,
      skillSlot:unit.earthRoundState.skillSlot,
      skillMeta:enemyPetSkillMeta(unit.earthRoundState.skillId)
    };
  }
  const weights=[
    {kind:'attack',weight:spec.attackWeight},
    {kind:'guard',weight:spec.guardWeight},
    {kind:'magic',weight:spec.magicWeight},
    {kind:'escape',weight:spec.escapeWeight}
  ];
  for(let i=0;i<7;i++)weights.push({kind:'skill',weight:spec.skillWeights[i]||0,skillSlot:i,skillId:spec.skillIds[i]});

  const total=weights.reduce((sum,x)=>sum+x.weight,0);
  if(total<=0)return {kind:'none',spec};

  let roll=cRand(0,total-1);
  let picked=null;
  for(const x of weights){
    if(x.weight<=0)continue;
    if(roll<x.weight){picked=x;break}
    roll-=x.weight;
  }
  if(!picked)return {kind:'none',spec};

  if(picked.kind==='skill'){
    picked.sourceAiPickedSkill=true;
    if(ENEMY_SOURCE_MISSING_SKILL_IDS.has(Number(picked.skillId))){
      return {
        kind:'none',spec,
        skillSlot:picked.skillSlot,skillId:picked.skillId,
        sourceSkillMissing:true,sourceAiPickedSkill:true
      };
    }
    if(ENEMY_SOURCE_UNREGISTERED_SKILL_IDS.has(Number(picked.skillId))){
      return {
        kind:'none',spec,
        skillSlot:picked.skillSlot,skillId:picked.skillId,
        sourceSkillUnregistered:true,sourceAiPickedSkill:true,
        sourceCWaitReason:'unregistered-function'
      };
    }
    const meta=enemyPetSkillMeta(picked.skillId);
    if(meta?.f==='PETSKILL_Sacrifice'&&n(unit?.hp)<=n(unit?.maxHp)*.2){
      // 原 PETSKILL_Sacrifice() 在 AI 階段直接 return FALSE；
      // BATTLE_ai_all() 不設 C_OK，因此本回合在 StatusSeq 前被跳過。
      return {
        kind:'none',spec,skillSlot:picked.skillSlot,skillId:picked.skillId,skillMeta:meta,
        sourceSkillRejected:true,sourceAiPickedSkill:true,sourceCWaitReason:'sacrifice-low-hp'
      };
    }
    if(meta?.f==='PETSKILL_None')return {kind:'none',spec,skillSlot:picked.skillSlot,skillId:picked.skillId,skillMeta:meta,sourceAiPickedSkill:true};
    if(meta?.f==='PETSKILL_NormalAttack')return {kind:'attack',spec,skillSlot:picked.skillSlot,skillId:picked.skillId,skillMeta:meta,sourceAiPickedSkill:true};
    if(meta?.f==='PETSKILL_NormalGuard')return {kind:'guard',spec,skillSlot:picked.skillSlot,skillId:picked.skillId,skillMeta:meta,sourceAiPickedSkill:true};
    return Object.assign({},picked,{spec,skillMeta:meta});
  }
  // 原 BATTLE_ai_normal() 會把 ma 權重納入抽籤，但沒有 B_AI_MAGICMODE handler；
  // 抽中後一路 return FALSE，BATTLE_ai_all() 不設 C_OK，因此本回合停在 C_WAIT、StatusSeq 也不跑。
  if(picked.kind==='magic')return {kind:'none',spec,sourceMagicCWait:true,sourceCWaitReason:'magic-mode-unhandled'};
  return Object.assign({},picked,{spec});
}
function enemySignedSkillPercent(option,key){
  const m=String(option||'').match(new RegExp(key+'([+-]?\\d+(?:\\.\\d+)?)'));
  const v=m?Number(m[1]):0;
  return Number.isFinite(v)?v:0;
}
function sourceEnemyPrimeAttackShoot(action,unit,chosen){
  const meta=action?.skillMeta||enemyPetSkillMeta(action?.skillId);
  if(action?.kind!=='skill'||meta?.f!=='PETSKILL_AttackShoot'||!chosen)return null;
  const parts=String(meta?.o||'').split('|');
  let min=Math.trunc(Number(parts[0])),max=Math.trunc(Number(parts[1]));
  if(!Number.isFinite(min))min=3;
  if(!Number.isFinite(max))max=min;
  if(max<min){const swap=min;min=max;max=swap;}
  const count=cRand(min,max);
  return {count,min,max,fixAi:0,loyaltyBurstEligible:false};
}
function enemyGuardianOwner(unit){
  if(!enemy||!Array.isArray(enemy.units))return null;
  const slot=Math.trunc(n(unit?.battleSlot));
  if(slot<5||slot>9)return null;
  const ownerSlot=slot-5;
  return livingEnemyUnits().find(u=>Math.trunc(n(u.battleSlot))===ownerSlot)||null;
}
function enemyGuardianFor(target,attackerUnit=null){
  const guardianId=target?.guardedByUnitId;
  if(!guardianId)return null;
  const guardian=livingEnemyUnits().find(u=>u.id===guardianId);
  if(!guardian||guardian===target||guardian===attackerUnit||!guardian.guardianReadyThisTurn)return null;
  const desc={kind:'enemy',unit:guardian,unitId:guardian.id};
  if(!battleStatusCanMove(desc)||battleStatusActive(desc,'confusion'))return null;
  return guardian;
}
function enemyPrepareRoundAction(unit,action){
  const desc={kind:'enemy',unit,unitId:unit?.id};

  if(action?.kind==='earthround'&&sourceEnemySkipsPreCommandCompliance(unit)){
    // EARTHROUND0 的 release round 在 fixed C 於 PreCommandSeq 直接 continue。
    // 不重建 FIX/WORK，不衰減 TurnParam，也不重新套 WEAKEN；沿用隱身前一輪快照。
    unit.counterEligibleThisTurn=false;
    unit.noGuardDuckBonus=0;
    unit.noGuardCounterBonus=0;
    unit.noGuardThisTurn=false;
    return;
  }

  const weakened=battleWeakenRoundActive(desc);

  // fixed C 的 PreCommandSeq -> complianceParameter -> Other_DefcharWorkInt：
  // 先套持續中的能力 buff，再套 WEAKEN 0.8 到 FIXSTR/FIXTOUGH/FIXDEX，
  // 最後才進 AI / PETSKILL_*，因此所有技能都必須從「本輪 FIX 快照」起算。
  let sourceFixAttack=Math.trunc(n(unit.attack));
  let sourceFixQuick=Math.trunc(n(unit.quick));

  // 大地鎧甲在 Other_DefcharWorkInt 裡早於 WEAKEN 套到 FIXTOUGH。
  const tghBuffPower=n(unit?.mySkillTghTurns)>0?Math.max(0,n(unit?.mySkillTghPower)):0;
  const baseDefense=Math.trunc(n(unit.defense));
  let sourceFixDefense=baseDefense+Math.trunc(baseDefense*tghBuffPower/100);

  if(weakened){
    sourceFixAttack=Math.trunc(sourceFixAttack*.8);
    sourceFixDefense=Math.trunc(sourceFixDefense*.8);
    sourceFixQuick=Math.trunc(sourceFixQuick*.8);
  }

  unit.roundFixAttack=sourceFixAttack;
  unit.roundFixDefense=sourceFixDefense;
  unit.roundFixQuick=sourceFixQuick;
  unit.roundAttack=sourceFixAttack;
  unit.roundDefense=sourceFixDefense;
  unit.roundQuick=sourceFixQuick;
  unit.roundWeakenApplied=weakened;
  unit.roundTghBuffPower=tghBuffPower;

  unit.noGuardDuckBonus=0;
  unit.noGuardCounterBonus=0;
  unit.noGuardThisTurn=false;
  unit.counterEligibleThisTurn=action?.kind==='attack';
  unit.roundSkillFunction=null;
  unit.roundDexMode=null;

  if(action?.kind!=='skill')return;
  const meta=action.skillMeta||enemyPetSkillMeta(action.skillId);
  unit.roundSkillFunction=meta?.f||null;

  if(meta?.f==='PETSKILL_StatusChange'){
    // fixed PETSKILL_StatusChange() 在 AI 決定技能時、EntrySort 之前就直接覆寫本回合
    // WORKATTACKPOWER / WORKDEFENCEPOWER：
    //   FIXSTR + trunc(FIXSTR * 攻% / 100)
    //   FIXTOUGH + trunc(FIXTOUGH * 防% / 100)
    // 不能用「最後傷害 ×倍率」代替，因為 BATTLE_DamageCalc 對攻防是非線性的。
    const attackPct=enemySignedSkillPercent(meta.o,'攻%');
    const defensePct=enemySignedSkillPercent(meta.o,'防%');
    const fixedAttack=sourceFixAttack;
    const fixedDefense=sourceFixDefense;
    unit.roundAttack=fixedAttack+Math.trunc(fixedAttack*attackPct/100);
    if(String(meta.o||'').includes('防%')){
      unit.roundDefense=fixedDefense+Math.trunc(fixedDefense*defensePct/100);
    }
    unit.counterEligibleThisTurn=true;
  }else if(meta?.f==='PETSKILL_Gyrate'){
    // PETSKILL_Gyrate 在 AI 階段直接以當輪 FIXSTR 寫 WORKATTACKPOWER。
    const attackPct=enemySignedSkillPercent(meta.o,'攻%');
    unit.roundAttack=sourceFixAttack+Math.trunc(sourceFixAttack*attackPct/100);
    unit.counterEligibleThisTurn=false;
  }else if(meta?.f==='PETSKILL_BattleModel'){
    const parts=String(meta.o||'').split('|');
    const attackPct=enemySignedSkillPercent(parts[5]||'','攻%');
    unit.roundAttack=sourceFixAttack+Math.trunc(sourceFixAttack*attackPct/100);
    unit.counterEligibleThisTurn=false;
  }else if(meta?.f==='PETSKILL_BattleTearDamage'){
    unit.roundAttack=Math.trunc(sourceFixAttack*.9);
    unit.roundDefense=Math.trunc(n(unit.roundDefense)*.8);
    unit.counterEligibleThisTurn=false;
  }else if(meta?.f==='PETSKILL_AttackCrazed'){
    // 原 PETSKILL_AttackCrazed 固定攻 80%、防 70%，option 只決定攻擊次數。
    unit.roundAttack=Math.trunc(sourceFixAttack*.8);
    unit.roundDefense=Math.trunc(sourceFixDefense*.7);
    unit.counterEligibleThisTurn=true;
  }else if(meta?.f==='PETSKILL_AttackShoot'){
    unit.counterEligibleThisTurn=false;
  }else if(meta?.f==='PETSKILL_Hector'){
    // PETSKILL_Hector is executed by Enemy AI before EntrySort, so both modifiers affect this round.
    const attackPct=enemySignedSkillPercent(meta.o,'攻%');
    const quickPct=enemySignedSkillPercent(meta.o,'敏%');
    unit.roundAttack=sourceFixAttack+Math.trunc(sourceFixAttack*attackPct/100);
    unit.roundQuick=sourceFixQuick+Math.trunc(sourceFixQuick*quickPct/100);
    unit.hectorSkillDexPower=quickPct;
    unit.counterEligibleThisTurn=true;
  }else if(meta?.f==='PETSKILL_SpeedyAttack'){
    const defensePct=enemySignedSkillPercent(meta.o,'防%');
    const baseDefense=sourceFixDefense;
    // fixed PETSKILL_SpeedyAttack：先把 FIXTOUGH * fPer 指派到 int strdef，
    // 再做 FIXTOUGH + strdef。負百分比不能把整個和式最後才 trunc。
    unit.roundDefense=baseDefense+Math.trunc(baseDefense*defensePct/100);
    // PETSKILL_SpeedyAttack() 本身沒有改 QUICK，但 BATTLE_DexCalc 對此 command
    // 另有 work=(WORKQUICK+20); dex=work+work*0.3 的專用排序公式。
    unit.roundDexMode='speedy';
    unit.counterEligibleThisTurn=true;
  }else if(meta?.f==='PETSKILL_DamageToHp2'){
    // 暗月狂狼變體：BATTLE_DexCalc 專用排序為 work +20%，無 default 的隨機扣速。
    unit.roundDexMode='damageToHp2';
    unit.counterEligibleThisTurn=false;
  }else if(meta?.f==='PETSKILL_MpDamage'){
    // 原 PETSKILL_MpDamage：def=(float)(atoi(buf1)/100)，50/100 先走 C int division = 0，
    // 所以 506/507/508 的「攻擊力下降50%」在此 build 實際不生效。
    // battle.c 走 BATTLE_S_AttackDamage 專用 case，沒有普通 Counter loop。
    unit.counterEligibleThisTurn=false;
  }else if(meta?.f==='PETSKILL_BattleTimid'){
    // 原 PETSKILL_BattleTimid：直接把本回合 WORKATTACK/DEFENCE/QUICK
    // 改成 FIXSTR*0.7 / FIXTOUGH*0.4 / FIXDEX*0.8。
    unit.roundAttack=Math.trunc(sourceFixAttack*.7);
    unit.roundDefense=Math.trunc(sourceFixDefense*.4);
    unit.roundQuick=Math.trunc(sourceFixQuick*.8);
    unit.counterEligibleThisTurn=false;
  }else if(meta?.f==='PETSKILL_2BattleTimid'){
    // 636 option「-攻%50+敏%30命%60」的 C parser：
    // -攻% 不是「再減 50%」寫法，而是 WORKATTACKPOWER = FIXSTR * 0.50；
    // +敏% 才是 FIXDEX + 30%。
    const attackRemain=Math.max(0,enemySkillNumber(meta.o,/-攻%([0-9.]+)/,100));
    const quickPlus=Math.max(0,enemySkillNumber(meta.o,/\+敏%([0-9.]+)/,0));
    unit.roundAttack=Math.trunc(sourceFixAttack*attackRemain/100);
    unit.roundQuick=sourceFixQuick+Math.trunc(sourceFixQuick*quickPlus/100);
    unit.counterEligibleThisTurn=false;
  }else if(meta?.f==='PETSKILL_Sars'){
    unit.counterEligibleThisTurn=true;
  }else if(meta?.f==='PETSKILL_ShowMercy'){
    unit.counterEligibleThisTurn=false;
  }else if(meta?.f==='PETSKILL_BecomeFox'||meta?.f==='PETSKILL_BecomePig'){
    // BecomeFox / BecomePig 都在 battle.c 的一般物理攻擊群組；
    // 真正 BATTLE_Attack 前會改回 BATTLE_COM_ATTACK，因此參與完整 Counter 鏈。
    unit.counterEligibleThisTurn=true;
  }else if(meta?.f==='PETSKILL_Firekill'){
    // 原 BATTLE_COM_S_FIREKILL 在進入 BATTLE_Attack_FIREKILL 前固定 WORKATTACKPOWER=FIXSTR*0.8；
    // 專用 case 做完物理＋火魔法後直接 break，不進普通 Counter loop。
    unit.roundAttack=Math.trunc(sourceFixAttack*.8);
    unit.counterEligibleThisTurn=false;
  }else if(meta?.f==='PETSKILL_Lighttakeed'){
    // 原 PETSKILL_Lighttakeed：攻=FIXSTR*0.7、防=FIXTOUGH*0.5；QUICK 修正已註解。
    unit.roundAttack=Math.trunc(sourceFixAttack*.7);
    unit.roundDefense=Math.trunc(sourceFixDefense*.5);
    // battle.c 走 BATTLE_S_AttackDamage 特殊 case，沒有一般攻擊分支的 Counter loop。
    unit.counterEligibleThisTurn=false;
  }else if(meta?.f==='PETSKILL_ToothCrushe'){
    // PETSKILL_ToothCrushe 沒有生效中的攻防敏修正；註解區塊不執行。
    // battle.c 直接呼叫 BATTLE_S_AttackDamage 後 break，不進普通 Counter loop。
    unit.counterEligibleThisTurn=false;
  }else if(meta?.f==='PETSKILL_PowerBalance'){
    const attackPct=enemySignedSkillPercent(meta.o,'攻%');
    const defensePct=enemySignedSkillPercent(meta.o,'防%');
    const baseAttack=sourceFixAttack;
    const skillBaseDefense=sourceFixDefense;
    unit.roundAttack=baseAttack+Math.trunc(baseAttack*attackPct/100);
    unit.roundDefense=skillBaseDefense+Math.trunc(skillBaseDefense*defensePct/100);
  }else if(meta?.f==='PETSKILL_NoGuard'){
    unit.noGuardThisTurn=true;
    unit.noGuardDuckBonus=Math.max(0,enemySignedSkillPercent(meta.o,'回避%'));
    unit.noGuardCounterBonus=Math.max(0,enemySignedSkillPercent(meta.o,'反击%'));
    // 此來源版 NoGuard 的「會心%」處理函式位於 #if 0，因此不生效。
    unit.counterEligibleThisTurn=true;
  }else if(meta?.f==='PETSKILL_FallGround'||meta?.f==='PETSKILL_Guardian'||meta?.f==='PETSKILL_WildViolentAttack'||meta?.f==='PETSKILL_Regret'){
    const attackPct=enemySignedSkillPercent(meta.o,'攻%');
    const defensePct=enemySignedSkillPercent(meta.o,'防%');
    const baseAttack=sourceFixAttack;
    const skillBaseDefense=sourceFixDefense;
    unit.roundAttack=baseAttack+Math.trunc(baseAttack*attackPct/100);
    unit.roundDefense=skillBaseDefense+Math.trunc(skillBaseDefense*defensePct/100);
    if(meta?.f==='PETSKILL_WildViolentAttack'){
      // battle.c 會在真正 BATTLE_Attack 前把此 command 改回 ATTACK，因此可參與反擊鏈。
      unit.counterEligibleThisTurn=true;
    }
    if(meta?.f==='PETSKILL_Regret'){
      // Regret 維持特殊 command；可被對方反擊，但本身不能再反反擊。
      unit.counterEligibleThisTurn=false;
    }
    if(meta?.f==='PETSKILL_Guardian'&&!String(meta.o||'').includes('COM:防')){
      unit.guardianReadyThisTurn=true;
      // PETSKILL_Guardian 先寫 GUARDIAN_ATTACK；但 common direct-attack 分支在第一個
      // BATTLE_Attack 前會把 WORKBATTLECOM1 改成 ATTACK。Counter 階段因此可正常反擊／反反擊。
      unit.counterEligibleThisTurn=true;
      const owner=enemyGuardianOwner(unit);
      if(owner&&owner.id!==unit.id)owner.guardedByUnitId=unit.id;
    }
  }
}
function battleTargetSnapshot(kind,pet=null){
  if(kind==='pet'&&pet){
    const view=petBattleView(pet);
    const rawStr=pet.serverStats?n(pet.serverStats.str):n(pet.stats?.str)*100;
    const rawDex=pet.serverStats?n(pet.serverStats.dex):n(pet.stats?.dex)*100;
    return {
      kind:'pet',petId:pet.id,pet,view,
      hp:n(pet.hp),maxHp:n(pet.maxHp),str:rawStr,dex:rawDex,elements:battleElementsForDesc({kind:'pet',pet,petId:pet.id})
    };
  }
  return {
    kind:'player',petId:null,pet:null,view:playerBattleView(),
    hp:n(state.hp),maxHp:n(state.maxHp),
    str:n(state.playerStats?.str)*100,dex:n(state.playerStats?.dex)*100,elements:battleElementsForDesc({kind:'player'})
  };
}
function enemySubdueAttribute(unit){
  const e=unit?.elements||{};
  const a=n(e.earth),b=n(e.water),c=n(e.fire),d=n(e.wind);
  // 原 GetSubdueAttribute() 的同一個比較樹：1地、2水、3火、4風。
  return (a>c)
    ?((b>d)?((a>b)?2:3):((a>d)?2:1))
    :((b>d)?((c>b)?4:3):((c>d)?4:1));
}
function targetElementValue(target,attr){
  const e=target?.elements||{};
  if(attr===1)return n(e.earth);
  if(attr===2)return n(e.water);
  if(attr===3)return n(e.fire);
  if(attr===4)return n(e.wind);
  return 0;
}
function enemyEscapeChance(unit){
  const spec=enemyAiAttackSpec(unit);
  const rare=spec.rare;
  const luck=rare===0?1:(rare===1?3:5);

  // fixed BATTLE_EscapeCheck 掃對手 Side 的每個 BATTLE_ENTRY：
  // 只檢查 CHAR_CHECKINDEX，沒有 HP/ISDIE 篩選；因此出戰寵即使 HP=0，
  // 只要尚未 BATTLE_Exit，等級仍會算進 enemycnt / enemylevel。
  // BattleTimid / Abduct 等真正 BATTLE_Exit 的寵則由 battlePetOutIds 排除。
  let entries=Array.isArray(enemy?.sourcePlayerSideEntries)?enemy.sourcePlayerSideEntries:[];
  if(!entries.length){
    entries=[{kind:'player',level:Math.max(1,Math.trunc(n(state.level)))}];
    const pet=activePet();
    if(pet&&petIsBattleActive(pet))entries.push({kind:'pet',petId:pet.id,level:Math.max(1,Math.trunc(n(pet.level)))});
  }
  const levels=entries
    .filter(x=>x.kind!=='pet'||!battlePetOutIds.has(x.petId))
    .map(x=>Math.max(1,Math.trunc(n(x.level))));

  // enemylevel / enemycnt 在來源兩邊都是 int，所以平均值先做 C int division 截斷。
  const levelSum=levels.reduce((a,b)=>a+b,0);
  const avgLevel=levels.length?Math.trunc(levelSum/levels.length):0;

  unit.escapeAttempts=Math.max(0,Math.trunc(n(unit.escapeAttempts)))+1;
  const escapeCnt=unit.escapeAttempts+1;
  let esc=100;
  if(levels.length){
    if(luck>=5)esc=95*escapeCnt;
    else if(luck>=4)esc=60*escapeCnt-2*(avgLevel-n(unit.level));
    else if(luck>=3)esc=50*escapeCnt-2*(avgLevel-n(unit.level));
    else if(luck>=2)esc=40*escapeCnt-2*(avgLevel-n(unit.level));
    else esc=30*escapeCnt-2*(avgLevel-n(unit.level));
  }
  if(esc<1)esc=1;
  return {esc,luck,escapeCnt,avgLevel,levelSum,enemyCnt:levels.length,opponentLevels:levels.slice()};
}
function finishEnemyEscape(unit){
  if(!enemy||!unit)return {battleEnded:false};
  releaseEnemyRuntimeItems(unit);
  if(Array.isArray(enemy.units)){
    enemy.units=enemy.units.filter(u=>u.id!==unit.id);
    if(enemy.units.length===0){
      state.wins++;
      addLog('敵方全數逃離，戰鬥結束；沒有擊殺 EXP 或掉落。','good');
      clearEnemyBattleNoReward();save();render();
      return {battleEnded:true,noReward:true};
    }
    if(!livingEnemyUnits().length){
      winBattle();
      return {battleEnded:true};
    }
    syncEnemyTarget();
    return {battleEnded:false};
  }
  state.wins++;
  addLog(unit.name+' 成功逃離戰鬥；沒有擊殺 EXP 或掉落。','good');
  clearEnemyBattleNoReward();save();render();
  return {battleEnded:true,noReward:true};
}
function finishEnemyDirectExit(unit,reason='離開戰鬥'){
  if(!enemy||!unit)return {battleEnded:false};
  releaseEnemyRuntimeItems(unit);
  if(Array.isArray(enemy.units)){
    enemy.units=enemy.units.filter(u=>u.id!==unit.id);
    if(enemy.units.length===0){
      state.wins++;
      addLog('敵方最後一名成員因'+reason+'離場，戰鬥結束；該離場不產生擊殺 EXP 或掉落。','good');
      clearEnemyBattleNoReward();save();render();
      return {battleEnded:true,noReward:true};
    }
    syncEnemyTarget();
    return {battleEnded:false,noReward:true};
  }
  state.wins++;
  addLog(unit.name+' 因'+reason+'離場，戰鬥結束；沒有擊殺 EXP 或掉落。','good');
  clearEnemyBattleNoReward();save();render();
  return {battleEnded:true,noReward:true};
}
function enemyEscapeAttempt(unit){
  const c=enemyEscapeChance(unit);
  const success=cRand(1,100)<c.esc;
  if(success){
    addLog(unit.name+' 逃跑成功（原服逃跑值 '+Math.trunc(c.esc)+'）。');
    return Object.assign({escaped:true},finishEnemyEscape(unit),c);
  }
  addLog(unit.name+' 嘗試逃跑但失敗（原服逃跑值 '+Math.trunc(c.esc)+'）。');
  return Object.assign({escaped:false,battleEnded:false},c);
}
function enemyChooseTarget(unit){
  const spec=enemyAiAttackSpec(unit),all=[];
  if(state.hp>0)all.push(battleTargetSnapshot('player'));
  const pet=activePet();
  // fixed battle_ai.c builds the Enemy AI candidate list without checking CHAR_ISATTACKED.
  // EarthRound hide clears CHAR_ISATTACKED, but the hidden battle entry still participates in
  // targetType/selectMode selection and therefore still consumes the same source RNG here.
  if(pet&&petIsBattleActive(pet))all.push(battleTargetSnapshot('pet',pet));
  if(!all.length)return null;
  let candidates;
  if(spec.targetType===2)candidates=all.filter(x=>x.kind==='player');
  else if(spec.targetType===3)candidates=all.filter(x=>x.kind==='pet');
  else if(spec.targetType===4){
    // fixed _ENEMY_ATTACK_AI / B_AI_NORMAL_TARGET_LEADER:
    // every non-leader BATTLE_ENTRY independently consumes RAND(0,2) and is accepted only on 0.
    // This Web has no player-party system, so the solo player and owned Pet both correspond to
    // CHAR_PARTY_NONE here; neither may be promoted to "leader" just because the player is solo.
    candidates=[];
    for(const x of all)if(cRand(0,2)===0)candidates.push(x);
  }else candidates=all.slice();

  // Source loops once more with TARGET_ALL when the requested target class produced no entry.
  // The fallback itself consumes no extra target-filter RNG.
  if(!candidates.length)candidates=all.slice();

  // B_AI_NORMAL_SELECT_RANDOM only consumes RAND(0,cnt-1).
  if(spec.selectMode===1)return candidates[cRand(0,candidates.length-1)];

  let selected=candidates[0];
  const attr=spec.selectMode===7?enemySubdueAttribute(unit):0;
  const value=x=>{
    if(spec.selectMode===2||spec.selectMode===3)return n(x.hp);
    if(spec.selectMode===4)return n(x.str);
    if(spec.selectMode===5||spec.selectMode===6)return n(x.dex);
    if(spec.selectMode===7)return targetElementValue(x,attr);
    return 0;
  };
  for(let i=1;i<candidates.length;i++){
    const cur=value(candidates[i]),top=value(selected);
    if((spec.selectMode===3||spec.selectMode===6)?cur<top:cur>top)selected=candidates[i];
  }

  // Important source RNG order: HP/STR/DEX/attribute selectors do this even when cnt==1.
  // if(!RAND(0,rn)) target = target[RAND(0,cnt-1)]; else target = top;
  // Do not early-return a single candidate: RAND(0,rn), and sometimes RAND(0,0), must still be consumed.
  if(cRand(0,spec.rn)===0)return candidates[cRand(0,candidates.length-1)];
  return selected;
}
function enemyActorCommandTarget(actor){
  // Raw CHAR_WORKBATTLECOM2 equivalent. Do not validate it here: several source commands
  // (EarthRound start, Bow target-list construction, Boomerang row choice) intentionally
  // preserve the originally selected slot even when it later becomes untargetable.
  if(actor?.targetKind==='pet'){
    const pet=state.petBox.find(p=>p.id===actor.targetPetId);
    return pet?battleTargetSnapshot('pet',pet):null;
  }
  if(actor?.targetKind==='player')return battleTargetSnapshot('player');
  return null;
}
function sourceEnemyTargetCheck(target){
  // fixed BATTLE_TargetCheck: alive / present plus CHAR_ISATTACKED.
  // In this Web model EarthRound hidden == CHAR_ISATTACKED false.
  if(target?.kind==='player')return state.hp>0;
  if(target?.kind==='pet'){
    return !!target.pet&&petIsBattleActive(target.pet)&&!sourcePlayerPetHidden(target.pet);
  }
  return false;
}
function sourceEnemyDefaultAttacker(){
  // fixed BATTLE_DefaultAttacker walks battle slots in order, retains only TargetCheck-valid
  // entries, then always consumes RAND(0,cnt-1) -- including RAND(0,0).
  const list=[];
  if(state.hp>0)list.push(battleTargetSnapshot('player'));
  const pet=activePet();
  if(pet&&petIsBattleActive(pet)&&!sourcePlayerPetHidden(pet))list.push(battleTargetSnapshot('pet',pet));
  if(!list.length)return null;
  return list[cRand(0,list.length-1)];
}
function sourceEnemyFirstTargetablePlayerSide(){
  // FIREKILL is a source exception: on an invalid/EarthRound COM2 it scans the side from
  // the lowest slot and takes the first TargetCheck-valid entry; it does not randomize.
  if(state.hp>0)return battleTargetSnapshot('player');
  const pet=activePet();
  if(pet&&petIsBattleActive(pet)&&!sourcePlayerPetHidden(pet))return battleTargetSnapshot('pet',pet);
  return null;
}
function enemyActorTarget(actor,unit){
  // fixed BATTLE_TargetAdjust: validate the stored COM2 once; if invalid, call
  // BATTLE_DefaultAttacker. Never rerun battle_ai.c targetType/selectMode here.
  const commandTarget=enemyActorCommandTarget(actor);
  return sourceEnemyTargetCheck(commandTarget)?commandTarget:sourceEnemyDefaultAttacker();
}
function battleDuckChance(attacker,defender){
  // fixed BATTLE_DuckCheck：At_Dex / Df_Dex / Df_Luck 都是 int。
  // 因此 *=0.8 / *=0.6 的 compound assignment 會立即截斷，不能讓 JS 浮點一路帶到 sqrt。
  let atDex=Math.trunc(n(attacker?.fixedDex??attacker?.quick));
  let dfDex=Math.trunc(n(defender?.fixedDex??defender?.quick));
  const dfLuck=defender?.type==='player'?Math.trunc(n(defender?.luck)):0;
  if(attacker?.type==='enemy'&&defender?.type==='pet')atDex=Math.trunc(atDex*.8);
  else if(attacker?.type!=='enemy'&&defender?.type==='pet')dfDex=Math.trunc(dfDex*.8);
  else if(attacker?.type!=='player'&&defender?.type==='player')atDex=Math.trunc(atDex*.6);
  else if(attacker?.type==='player'&&defender?.type!=='player')dfDex=Math.trunc(dfDex*.6);
  let big,small,wari;
  if(dfDex>=atDex){big=dfDex;small=atDex;wari=1}
  else{big=atDex;small=dfDex;wari=big<=0?0:small/big}
  let work=(big-small)/.02;if(work<=0)work=0;
  let per=Math.sqrt(work)*wari+dfLuck;
  per*=100;
  if(per>7500)per=7500;
  if(per<=0)per=1;
  return per;
}
function battleCriticalChance(attacker,defender){
  // fixed BATTLE_CriticalCheckPlayer：FIXDEX / Luck / equipment critical 都以 C int 讀入。
  let atDex=Math.trunc(n(attacker?.fixedDex??attacker?.quick));
  let dfDex=Math.trunc(n(defender?.fixedDex??defender?.quick)),root=true,div=.09;
  const atLuck=attacker?.type==='player'?Math.trunc(n(attacker?.luck)):0;
  if(attacker?.type==='pet'&&defender?.type==='enemy')dfDex=Math.trunc(dfDex*.8);
  else if(attacker?.type==='enemy'&&defender?.type==='pet'){div=10;root=false}
  else if(attacker?.type!=='player'&&defender?.type==='player'){div=10;root=false}
  else if(attacker?.type==='player'&&defender?.type!=='player')dfDex=Math.trunc(dfDex*.6);
  let big,small,wari;
  if(atDex>=dfDex){big=atDex;small=dfDex;wari=1}
  else{big=dfDex;small=atDex;wari=big<=0?0:small/big}
  let work=(big-small)/div;if(work<=0)work=0;
  // Work 在來源是 float，這裡不提早截斷；只有上面的 int compound assignment 要截。
  // 裝備 ITEM_CRITICAL*0.5 在乘 wari 之前加入；非 Player 也走同一函式。
  let per=(root?Math.sqrt(work):work)+Math.trunc(n(attacker?.weaponCritical))*.5;
  per*=wari;
  per+=atLuck;
  per*=100;
  if(per<0)per=1;
  if(per>10000)per=10000;
  return Math.trunc(per);
}
function battleDamageCore(attacker,defender,options={}){
  let attack=n(attacker?.attack);
  // fixed BATTLE_DamageCalc always starts from WORKDEFENCEPOWER * 0.70.
  // STONE and REGRET are local DamageCalc transforms; keep them out of the battle view
  // so BATTLE_CriDamageCalc can still read the original WORKDEFENCEPOWER.
  let defense=n(defender?.defense)*.70;

  // 原 BATTLE_DamageCalc：鐵壁在 NPCENEMY_ADDPOWER 之前生效。
  // defense += defense * ((CHAR_OTHERSTATUSNUMS + rand()%20) / 100)
  let superWallRoll=null;
  if(n(defender?.superWallPower)>0){
    superWallRoll=cRand(0,19);
    defense+=defense*(n(defender.superWallPower)+superWallRoll)/100;
  }

  if(defender?.type==='enemy')defense+=(defense*Math.floor(Math.random()*10)+2)/100;
  if(attacker?.type==='enemy')attack+=(attack*Math.floor(Math.random()*10)+2)/100;

  // Source order is exact: NPCENEMY_ADDPOWER -> STONE *2 -> REGRET overwrite to FIXTOUGH.
  // Therefore REGRET intentionally discards SuperWall / Enemy add-power / Stone defense changes.
  if(defender?.stone)defense*=2;
  if(options.useFixedToughDefense)defense=n(defender?.fixedTough);

  let damage=0;
  if(defense<=attack&&attack<defense*8/7){
    damage=cRand(0,attack/16);
  }else if(defense>attack){
    damage=cRand(0,1);
  }else if(attack>=defense*8/7){
    const k0=cRand(0,attack/8)-attack/16;
    damage=Math.trunc((attack-defense)*2+k0);
  }
  damage=battleAttrDamage(attacker,defender,damage);

  // fixed _ADD_DEAMGEDEFC is enabled. CHAR_initcharWorkInt() initializes
  // CHAR_WORKOTHERDMAGE / CHAR_WORKOTHERDEFC to 0, and the current web runtime has no
  // sourced non-zero equipment fields for either value. Do not invent them; however,
  // BATTLE_DamageCalc() still unconditionally consumes both RAND calls even at 0..0.
  const sourceOtherDamage=0;
  const sourceOtherDefense=0;
  const sourceOtherPower=cRand(sourceOtherDamage*.3,sourceOtherDamage)
    -cRand(sourceOtherDefense*.3,sourceOtherDefense);
  if(sourceOtherPower!==0)damage+=sourceOtherPower;
  if(damage<0)damage=0;
  return damage;
}
function battleGuardAdjust(damage){
  const roll=cRand(1,100);
  if(roll<=25)damage*=0;
  else if(roll<=50)damage*=.10;
  else if(roll<=70)damage*=.20;
  else if(roll<=85)damage*=.30;
  else if(roll<=95)damage*=.40;
  else damage*=.50;
  return Math.trunc(damage);
}
function sourceBattleDuckTotal(attacker,defender,options={}){
  // 原 BATTLE_DuckCheck 的實際順序：
  // base -> gBattleDuckModyfy -> 酒醉 -> BOW +20 -> NoGuard -> BOW +20 -> ×100 / cap 75%。
  // fixed ref 裡 BOW +20 明確重複兩次；V0.73 保留這個來源 bug，不自行去重。
  // 注意 BATTLE_DuckCheck 讀的是 battle loop 的 global gWeponType，不是再次 BATTLE_GetWepon()。
  // BecomeFox 會把這個 global 強制成 FIST；但 critical / Guardian / Counter 仍會重新讀實際裝備。
  const sourceOuterWeaponType=Number(options.sourceOuterWeaponType);
  const duckWeaponType=Number.isFinite(sourceOuterWeaponType)
    ?Math.trunc(sourceOuterWeaponType)
    :Math.trunc(n(attacker?.weaponType));
  let duck=battleDuckChance(attacker,defender);
  duck+=n(options.duckBonusPercent)*100;
  if(attacker?.drunk)duck+=cRand(20,30)*100;
  if(duckWeaponType===4)duck+=20*100;
  duck+=n(defender?.duckBonus)*100;
  if(duckWeaponType===4)duck+=20*100;
  duck=clamp(duck,1,7500);

  // fixed _EQUIT_HITRIGHT is enabled. BATTLE_DuckCheck() performs this roll only for
  // PLAYER attackers, after the 75% dodge cap and before the final RAND(1,10000).
  // CHAR_initcharWorkInt() initializes CHAR_WORKHITRIGHT to 0; current web equipment
  // runtime has no sourced non-zero ITEM_HITRIGHT field, so do not invent one.
  // RAND(0,0) still consumes one RNG call and must be preserved for lifecycle parity.
  if(attacker?.type==='player'){
    const sourceHitRight=0;
    duck-=cRand(sourceHitRight*.8,sourceHitRight*1.2);
    if(duck<0)duck=0;
  }
  return duck;
}
function resolveNormalAttack(attacker,defender,options={}){
  const guarding=!!options.guarding;
  // fixed BATTLE_DuckCheck returns FALSE immediately for GUARD or BATTLE_CanMoveCheck()==FALSE.
  const disableDodge=guarding||!!options.disableDodge||defender?.canMove===false;
  if(!disableDodge&&n(defender?.skillDuckPower)>0){
    const power=Math.trunc(n(defender.skillDuckPower));
    const roll=cRand(0,99);
    if(roll<=power){
      return {damage:0,dodged:true,critical:false,miss:false,guarded:guarding,skillDuck:true,skillDuckPower:power,skillDuckRoll:roll};
    }
  }
  const duck=disableDodge?0:sourceBattleDuckTotal(attacker,defender,options);
  // 原 BATTLE_DuckCheck：防禦中直接 return FALSE，不進閃避判定。
  if(!disableDodge&&cRand(1,10000)<=duck)return {damage:0,dodged:true,critical:false,miss:false,guarded:guarding,duckRaw:duck};

  const baseCriticalRaw=battleCriticalChance(attacker,defender);
  const criticalChanceMultiplier=Number.isFinite(Number(options.criticalChanceMultiplier))
    ?Number(options.criticalChanceMultiplier):1;
  // 原 DamageToHp2 是在 BATTLE_CriticalCheck() 已完成 10000 上限後，再做：
  //   int perCri = perCri + (perCri * 0.3)
  // assignment 回 int 會立刻截斷；同時不重新 cap，保留 >10000 時必定會心的來源行為。
  const criticalRaw=Math.trunc(baseCriticalRaw*criticalChanceMultiplier);
  const critical=cRand(1,10000)<criticalRaw;
  let damage=battleDamageCore(attacker,defender,options);
  if(critical&&Math.trunc(n(attacker?.weaponType))!==4){
    damage=Math.trunc(damage+n(defender?.defense)*Math.max(1,n(attacker?.level))/Math.max(1,n(defender?.level))*.5);
  }

  // GuardBreak2 類技能會在 GuardAdjust 前先修正原始傷害。
  const preGuardMultiplier=Number.isFinite(Number(options.preGuardDamageMultiplier))
    ?Number(options.preGuardDamageMultiplier):1;
  damage=Math.trunc(damage*preGuardMultiplier);

  // AttackSeq：技能前置倍率後才 GuardAdjust，再把 <1 的傷害 RAND(0,1)，最後乘 gBattleDamageModyfy。
  if(guarding)damage=battleGuardAdjust(damage);
  if(damage<1)damage=cRand(0,1);

  const multiplier=Number.isFinite(Number(options.damageMultiplier))?Number(options.damageMultiplier):1;
  damage=Math.trunc(damage*multiplier);

  // BATTLE_Attack() 在 AttackSeq 回來後才套 gDamageDiv，正傷害最低維持 1。
  const divisor=Number(options.damageDivisor);
  if(Number.isFinite(divisor)&&divisor>0&&damage>0){
    damage=Math.trunc(damage/divisor);
    if(damage<=0)damage=1;
  }

  return {
    damage:Math.max(0,Math.trunc(damage)),dodged:false,critical,miss:damage===0,
    guarded:guarding,duckRaw:duck,criticalRaw,baseCriticalRaw,criticalChanceMultiplier,
    preGuardDamageMultiplier:preGuardMultiplier,
    damageMultiplier:multiplier,damageDivisor:Number.isFinite(divisor)&&divisor>0?divisor:1
  };
}
function sourceCounterWeaponMap(type){
  const t=Math.trunc(n(type));
  if(t===0)return 1; // FIST -> BATTLE_C_CLAW
  if(t===1)return 2; // AXE
  if(t===2)return 3; // CLUB
  // 原 BATTLE_ItemType2ItemMap() 漏掉 ITEM_SPEAR，故槍維持 BATTLE_C_NONE=0。
  if(t===4)return 5; // BOW
  if(t===17||t===18||t===19)return 6; // THROU
  return 0;
}
const SOURCE_COUNTER_TBL=[
  10,9,8,8,5,0,0,0,
  10,9,7,7,6,0,0,0,
  9,8,10,10,7,0,0,0,
  8,8,10,10,7,0,0,0,
  6,6,8,8,9,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0
];
function sourceCounterWeaponFactor(attackerType,defenderType){
  const a=sourceCounterWeaponMap(attackerType),d=sourceCounterWeaponMap(defenderType);
  return n(SOURCE_COUNTER_TBL[a*8+d]);
}
function battleCounterChance(attacker,defender){
  // fixed BATTLE_CounterCalc：At_Dex / Df_Dex / Work 都是 int。
  // FIXDEX 類型倍率先截斷；(Big-Small)/divpara 指派給 int Work 時再截斷一次。
  let atDex=Math.trunc(n(attacker?.fixedDex??attacker?.quick));
  let dfDex=Math.trunc(n(defender?.fixedDex??defender?.quick)),root=true,div=.08;
  if(attacker?.type==='enemy'&&defender?.type==='pet'){
    div=10;root=false;
  }else if(attacker?.type==='pet'&&defender?.type==='enemy'){
    dfDex=Math.trunc(dfDex*.8);
  }else if(attacker?.type!=='player'&&defender?.type==='player'){
    div=10;root=false;
  }else if(attacker?.type==='player'&&defender?.type!=='player'){
    dfDex=Math.trunc(dfDex*.6);
  }

  let big,small,wari;
  if(atDex>=dfDex){big=atDex;small=dfDex;wari=1}
  else{big=dfDex;small=atDex;wari=big<=0?0:small/big}

  let work=Math.trunc((big-small)/div);
  if(work<=0)work=0;
  let per=(root?Math.sqrt(work):work)*wari;
  // fixed BATTLE_CounterCalc() 的回傳型別是 int。
  // 函式內 per 雖是 float，但 return per 時會先截斷，再交給 Player/Pet CounterCheck 後續計算。
  per=Math.trunc(per);

  if(attacker?.type==='player'){
    // BATTLE_CounterCheckPlayer：CriPer * CounterTbl * 0.1 + Luck。
    per=per*sourceCounterWeaponFactor(attacker?.weaponType,defender?.weaponType)*.1+n(attacker?.luck);
  }else{
    // Pet/Enemy 使用 BATTLE_CounterCheckPet，不套 CounterTbl；NoGuard 額外反擊率已由 counterBonus 帶入。
    per+=n(attacker?.counterBonus);
    if(per>100)per=100;
  }
  return per;
}
function battleCounterCheck(attacker,defender){
  // 原 BATTLE_IsThrowWepon：任一方為弓／回力標／投斧／投石時，反擊直接失敗。
  if(attacker?.throwWeapon||defender?.throwWeapon)return {success:false,raw:0,throwWeaponBlocked:true};
  const raw=battleCounterChance(attacker,defender);
  if(attacker?.type==='player'){
    // fixed BATTLE_CounterCheckPlayer：per<=0 時不是 return；
    // 會先把內部 per 改成 1、顯示用 pPar 改 0，仍然執行 RAND(1,10000)<1。
    // 因為 RAND 最小為 1，所以結果必定 false，但 RNG 生命週期仍消耗一顆。
    let rollPer=raw*100;
    const displayRaw=raw<=0?0:raw;
    if(rollPer<=0)rollPer=1;
    return {success:cRand(1,10000)<rollPer,raw:displayRaw};
  }
  let rollPer=raw*100;
  if(rollPer<=0)rollPer=1; // 原 BATTLE_CounterCheckPet 的 1/10000 下限
  return {success:cRand(1,10000)<=rollPer,raw};
}
function counterScaledResult(attacker,defender){
  const r=resolveNormalAttack(attacker,defender);
  if(!r.dodged&&!r.miss&&r.damage>0){
    r.damage=Math.trunc(r.damage*.75);
    if(r.damage<1)r.damage=1;
  }
  return r;
}
function battleConfusionSideTargets(side,attackerDesc){
  const list=[];
  if(side===0){
    if(state.hp>0)list.push({kind:'player'});
    const pet=activePet();
    if(pet&&petIsBattleActive(pet))list.push({kind:'pet',pet,petId:pet.id});
  }else{
    for(const unit of targetableEnemyUnits())list.push({kind:'enemy',unit,unitId:unit.id});
  }
  const selfKey=battleStatusKey(attackerDesc);
  return list.filter(x=>battleStatusKey(x)!==selfKey);
}
function battleConfusionFallbackTarget(attackerDesc){
  if(attackerDesc?.kind==='enemy'){
    const chosen=enemyChooseTarget(attackerDesc.unit);
    if(chosen?.kind==='pet'&&chosen.pet)return {kind:'pet',pet:chosen.pet,petId:chosen.pet.id};
    if(chosen?.kind==='player')return {kind:'player'};
    return null;
  }
  const unit=targetEnemyUnit();
  return unit?{kind:'enemy',unit,unitId:unit.id}:null;
}
function battleConfusionChooseTarget(attackerDesc){
  // 原 BATTLE_StatusSeq 先 RAND(0,1) 選戰場其中一側，再從該側隨機起點循環找存活目標並排除自己。
  // 放置版沒有 0..9 的實體站位，因此保留「先選側」語意，再在該側存活單位中均勻抽一名。
  const side=cRand(0,1);
  const candidates=battleConfusionSideTargets(side,attackerDesc);
  if(candidates.length)return {target:candidates[cRand(0,candidates.length-1)],side,fallback:false};
  // 原碼找不到該側目標會把 COM2 設 -1，之後 BATTLE_TargetAdjust 退回正常敵對側目標。
  return {target:battleConfusionFallbackTarget(attackerDesc),side,fallback:true};
}
function battleConfusionGuarding(targetDesc,options){
  if(battleStatusActive(targetDesc,'confusion'))return false;
  if(targetDesc?.kind==='player')return !!options?.playerGuarding;
  if(targetDesc?.kind==='enemy')return !!targetDesc.unit?.guardThisTurn;
  return false;
}
function sourcePrepareAcupunctureReaction(attackerDesc,targetDesc,r,{counter=false}={}){
  const unit=targetDesc?.kind==='enemy'?targetDesc.unit:null;
  if(!unit||!unit.acupunctureActive||!r||r.dodged||r.miss||n(r.damage)<=0){
    return {triggered:false};
  }

  // fixed BATTLE_DamageSub: BATTLE_GetDamageReact may return ACUPUNCTURE, but a throw weapon
  // forcibly rewrites pRefrect back to NONE. The flag is therefore NOT consumed by throws.
  const attackerView=battleStatusDescView(attackerDesc);
  if(attackerView?.throwWeapon){
    return {triggered:false,throwWeaponBlocked:true};
  }

  const originalDamage=Math.max(0,Math.trunc(n(r.damage)));
  let fullDamage=originalDamage;
  if(fullDamage%2!==0)fullDamage+=1; // source rounds odd damage upward before both deductions
  const reflectedDamage=Math.trunc(fullDamage/2);
  r.damage=fullDamage;
  r.sourceAcupunctureOriginalDamage=originalDamage;
  r.sourceAcupunctureFullDamage=fullDamage;
  r.sourceAcupunctureReflectedDamage=reflectedDamage;
  return {
    triggered:true,counter:!!counter,
    attackerDesc,targetDesc,targetUnit:unit,r,
    originalDamage,fullDamage,reflectedDamage
  };
}
function sourceFinishAcupunctureReaction(reaction){
  if(!reaction?.triggered)return reaction||{triggered:false};
  const {targetUnit,attackerDesc,r,fullDamage,reflectedDamage,counter}=reaction;

  // Source order inside BATTLE_DamageSub:
  // defender full damage -> clear WORKACUPUNCTURE -> attacker half damage.
  targetUnit.acupunctureActive=false;
  const beforeAttacker=battleStatusHp(attackerDesc);
  battleStatusSetHp(attackerDesc,beforeAttacker-reflectedDamage);

  const reflectResult=Object.assign({},r,{
    damage:reflectedDamage,
    sourceAcupunctureReflect:true,
    sourceUltimateThresholdDamage:fullDamage
  });
  reaction.attackerBefore=beforeAttacker;
  reaction.attackerAfter=battleStatusHp(attackerDesc);
  reaction.ultimate=sourceTrackDamageSubUltimate(
    attackerDesc,reflectedDamage,beforeAttacker,reflectResult
  );

  // BATTLE_Counter has a different WakeUp target from primary BATTLE_Attack:
  // after acupuncture redirects defindex, Counter wakes the reflected attacker.
  if(counter&&reflectedDamage>0)battleStatusWakeOnDamage(attackerDesc,reflectedDamage);
  return reaction;
}
function sourceLogAcupunctureReaction(reaction){
  if(!reaction?.triggered)return;
  const targetName=battleStatusDescName(reaction.targetDesc);
  const attackerName=battleStatusDescName(reaction.attackerDesc);
  addLog(
    targetName+' 的針刺外皮發動：原傷害 '+reaction.originalDamage+
    (reaction.fullDamage!==reaction.originalDamage?' 先補成偶數 '+reaction.fullDamage:'')+
    '，並反彈 '+reaction.reflectedDamage+' 傷害給 '+attackerName+'；效果已消耗。',
    reaction.attackerAfter<=0?'bad':''
  );
}
function battleApplyPhysicalHit(attackerDesc,targetDesc,r,{counter=false,confusion=false}={}){
  const attackerName=battleStatusDescName(attackerDesc);
  const targetName=battleStatusDescName(targetDesc);
  const action=counter?'反擊':(confusion?'因混亂攻擊':'攻擊');

  // fixed BATTLE_AttackSeq() 在 DuckCheck / Critical / Damage 前就處理主人打自己的 Pet：
  // CHAR_PetAddVariableAi(defindex, AI_FIX_SEKKAN), AI_FIX_SEKKAN = -2*100。
  // 因此就算本次之後 DODGE / MISS，忠誠懲罰仍已發生；Counter 鏈每次 owner->pet 攻擊也各算一次。
  if(attackerDesc?.kind==='player'&&targetDesc?.kind==='pet'&&targetDesc.pet){
    const sekkann=sourcePetAddVariableAi(targetDesc.pet,-200);
    addLog('你攻擊自己的 '+targetName+'：依原 BATTLE_AttackSeq 忠誠修正 '+(sekkann.delta/100).toFixed(2)+'。','bad');
  }
  if(r.dodged){
    addLog(targetName+' 閃避了 '+attackerName+' 的'+action+'。',targetDesc?.kind==='player'?'good':'');
    return;
  }
  if(r.miss){
    addLog(attackerName+' '+action+' '+targetName+'，但沒有造成傷害。');
    return;
  }

  const acupuncture=sourcePrepareAcupunctureReaction(attackerDesc,targetDesc,r,{counter});
  const before=battleStatusHp(targetDesc);
  battleStatusSetHp(targetDesc,before-r.damage);
  sourceTrackDamageSubUltimate(targetDesc,r.damage,before,r);
  sourceFinishAcupunctureReaction(acupuncture);
  // Primary BATTLE_Attack restores the original defender before WakeUp; Counter does not.
  if(!(counter&&acupuncture.triggered))battleStatusWakeOnDamage(targetDesc,r.damage);
  sourceBattleFinalizeItemCrushRng(r);
  sourceProcessBattleDeathsAtAddProfit();
  const after=battleStatusHp(targetDesc);
  if(before>0&&after<=0&&targetDesc?.kind==='enemy'&&targetDesc.unit){
    sourceMarkEnemyDeathCredit(targetDesc.unit,[attackerDesc]);
  }
  addLog(attackerName+' '+action+' '+targetName+(r.critical?'，會心一擊 ':'，造成 ')+r.damage+' 傷害。',after<=0?'bad':(attackerDesc?.kind==='pet'?'pet':''));
  sourceLogAcupunctureReaction(acupuncture);
  if(before>0&&after<=0&&targetDesc?.kind==='pet')addLog(targetName+' 倒下了，本場後續回合不再行動。','bad');
}
function battleConfusionCounterEligible(desc,options,forcedAttackerKey){
  if(!battleStatusDescAlive(desc)||!battleStatusCanMove(desc))return false;
  if(desc.kind==='enemy')return !!desc.unit?.counterEligibleThisTurn;
  if(desc.kind==='pet')return true;
  if(desc.kind==='player')return battleStatusKey(desc)===forcedAttackerKey||!!options?.allowPlayerCounter;
  return false;
}
function resolveConfusionCounterChain(attackerDesc,targetDesc,primaryResult,options={}){
  if(!attackerDesc||!targetDesc||primaryResult?.critical||primaryResult?.guarded||primaryResult?.guardian)return;
  const forcedAttackerKey=battleStatusKey(attackerDesc);
  let counterer=targetDesc,target=attackerDesc;
  for(let depth=0;depth<5;depth++){
    if(!battleStatusDescAlive(counterer)||!battleStatusDescAlive(target))break;
    if(!battleConfusionCounterEligible(counterer,options,forcedAttackerKey))break;
    const countererView=battleStatusDescView(counterer);
    const targetView=battleStatusDescView(target);
    if(!countererView||!targetView)break;
    const chk=battleCounterCheck(countererView,targetView);
    if(!chk.success)break;

    const r=counterScaledResult(countererView,targetView);
    battleApplyPhysicalHit(counterer,target,r,{counter:true});
    if(!battleStatusDescAlive(counterer)||!battleStatusDescAlive(target))break;
    if(r.miss||r.critical)break;

    const next=counterer;
    counterer=target;
    target=next;
  }
}
function performConfusionAttack(actor,statusTurn,options={}){
  const attackerDesc=statusTurn?.desc||battleStatusActorDesc(actor);
  if(!attackerDesc||!battleStatusDescAlive(attackerDesc))return true;

  if(attackerDesc.kind==='enemy'&&attackerDesc.unit){
    if(attackerDesc.unit.chargeState){
      attackerDesc.unit.chargeState=null;
      addLog(attackerDesc.unit.name+' 因混亂中斷了蓄力。');
    }
    if(attackerDesc.unit.earthRoundState){
      attackerDesc.unit.earthRoundState=null;
      addLog(attackerDesc.unit.name+' 因混亂中斷地球一周，重新現身。');
    }
    attackerDesc.unit.guardThisTurn=false;
    attackerDesc.unit.counterEligibleThisTurn=true;
  }

  const pick=battleConfusionChooseTarget(attackerDesc);
  const targetDesc=pick.target;
  if(!targetDesc||!battleStatusDescAlive(targetDesc)){
    addLog(battleStatusDescName(attackerDesc)+' 受到混亂影響改為普通攻擊，但沒有可攻擊的目標。');
    return true;
  }

  const attackerView=battleStatusDescView(attackerDesc);
  const defenderView=battleStatusDescView(targetDesc);
  if(!attackerView||!defenderView)return true;
  const guarding=battleConfusionGuarding(targetDesc,options);
  const r=targetDesc.kind==='enemy'
    ?resolveAttackToEnemyWithGuardian(attackerView,targetDesc.unit,{guarding,attackerUnit:attackerDesc.kind==='enemy'?attackerDesc.unit:null})
    :resolveNormalAttack(attackerView,defenderView,{guarding});
  addLog(battleStatusDescName(attackerDesc)+' 的混亂發作：改為普通攻擊 '+battleStatusDescName(targetDesc)+'。');
  const resolvedTarget=r.guardian
    ?{kind:'enemy',unit:r.actualTarget,unitId:r.actualTarget.id}
    :targetDesc;
  if(r.guardian)addLog(r.guardian.name+' 發動忠犬，代替 '+targetDesc.unit.name+' 承受這次混亂攻擊。');
  battleApplyPhysicalHit(attackerDesc,resolvedTarget,r,{confusion:true});
  if(battleStatusDescAlive(attackerDesc)&&battleStatusDescAlive(resolvedTarget)){
    resolveConfusionCounterChain(attackerDesc,resolvedTarget,r,options);
  }
  return true;
}
function resolvePlayerEnemyCounterChain(primaryAttackerKind,unit,primaryResult){
  if(!unit||!enemy||state.hp<=0||unit.hp<=0)return;
  // 原 BATTLE_Attack()：會心／死亡會把 ContFlg 關掉；MISS、DODGE、NORMAL 仍可進反擊。
  if(primaryResult?.critical||primaryResult?.guarded||primaryResult?.guardian||primaryResult?.sourcePetGuardCommand)return;

  let counterer=primaryAttackerKind==='player'?'enemy':'player';
  let target=primaryAttackerKind;
  for(let depth=0;depth<5;depth++){
    if(!enemy||state.hp<=0||unit.hp<=0)break;

    if(counterer==='enemy'&&!unit.counterEligibleThisTurn)break;
    const counterDesc=counterer==='player'?{kind:'player'}:{kind:'enemy',unit,unitId:unit.id};
    if(!battleStatusCanMove(counterDesc))break;
    const countererView=counterer==='player'?playerBattleView():enemyBattleView(unit);
    const targetView=target==='player'?playerBattleView():enemyBattleView(unit);
    const chk=battleCounterCheck(countererView,targetView);
    if(!chk.success)break;

    const r=counterScaledResult(countererView,targetView);
    if(counterer==='player'){
      if(r.dodged){
        addLog(unit.name+' 閃避了你的反擊。');
      }else if(r.miss){
        addLog('你的反擊沒有造成傷害。');
      }else{
        const attackerDesc={kind:'player'};
        const targetDesc={kind:'enemy',unit,unitId:unit.id};
        const acupuncture=sourcePrepareAcupunctureReaction(attackerDesc,targetDesc,r,{counter:true});
        const sourceUltimateBefore=n(unit.hp);
        unit.hp=Math.max(0,sourceUltimateBefore-r.damage);
        sourceTrackDamageSubUltimate(targetDesc,r.damage,sourceUltimateBefore,r);
        sourceFinishAcupunctureReaction(acupuncture);
        sourceBattleFinalizeItemCrushRng(r);
        if(sourceUltimateBefore>0&&unit.hp<=0)sourceMarkEnemyDeathCredit(unit,[attackerDesc]);
        addLog('你反擊 '+unit.name+(r.critical?'，會心一擊 ':'，造成 ')+r.damage+' 傷害。',r.critical?'good':'');
        sourceLogAcupunctureReaction(acupuncture);
      }
    }else{
      if(r.dodged){
        addLog('你閃避了 '+unit.name+' 的反擊。','good');
      }else if(r.miss){
        addLog(unit.name+' 的反擊沒有造成傷害。');
      }else{
        const sourceUltimateBefore=n(state.hp);
    state.hp=Math.max(0,sourceUltimateBefore-r.damage);
    sourceTrackDamageSubUltimate({kind:'player'},r.damage,sourceUltimateBefore,r);
    sourceBattleFinalizeItemCrushRng(r);
        addLog(unit.name+(r.critical?' 反擊會心 ':' 反擊 ')+r.damage+'。',state.hp<=0?'bad':'');
      }
    }

    sourceProcessBattleDeathsAtAddProfit();
    if(enemy)syncEnemyTarget();
    if(state.hp<=0||unit.hp<=0)break;
    if(r.miss||r.critical)break;

    const next=counterer;
    counterer=target;
    target=next;
  }
}
function resolvePetEnemyCounterChain(primaryAttackerKind,pet,unit,primaryResult,options={}){
  if(!pet||!unit||!enemy||!petIsBattleActive(pet)||unit.hp<=0)return;
  if(primaryResult?.critical||primaryResult?.guarded||primaryResult?.guardian||primaryResult?.sourcePetGuardCommand)return;
  let counterer=primaryAttackerKind==='enemy'?'pet':'enemy';
  let target=primaryAttackerKind==='enemy'?'enemy':'pet';
  const maxDepth=Number.isFinite(Number(options.maxDepth))?clamp(Math.trunc(Number(options.maxDepth)),0,5):5;
  for(let depth=0;depth<maxDepth;depth++){
    if(!enemy||!petIsBattleActive(pet)||unit.hp<=0)break;
    if(counterer==='enemy'&&!unit.counterEligibleThisTurn)break;
    const counterDesc=counterer==='pet'?{kind:'pet',pet,petId:pet.id}:{kind:'enemy',unit,unitId:unit.id};
    if(!battleStatusCanMove(counterDesc))break;
    const countererView=counterer==='pet'?petBattleView(pet):enemyBattleView(unit);
    const targetView=target==='pet'?petBattleView(pet):enemyBattleView(unit);
    if(!countererView||!targetView)break;
    const chk=battleCounterCheck(countererView,targetView);
    if(!chk.success)break;
    const r=counterScaledResult(countererView,targetView);
    if(counterer==='pet'){
      if(r.dodged)addLog(unit.name+' 閃避了 '+pet.name+' 的反擊。','pet');
      else if(r.miss)addLog(pet.name+' 的反擊沒有造成傷害。','pet');
      else{
        const attackerDesc={kind:'pet',pet,petId:pet.id};
        const targetDesc={kind:'enemy',unit,unitId:unit.id};
        const acupuncture=sourcePrepareAcupunctureReaction(attackerDesc,targetDesc,r,{counter:true});
        const sourceUltimateBefore=n(unit.hp);
        unit.hp=Math.max(0,sourceUltimateBefore-r.damage);
        sourceTrackDamageSubUltimate(targetDesc,r.damage,sourceUltimateBefore,r);
        sourceFinishAcupunctureReaction(acupuncture);
        sourceBattleFinalizeItemCrushRng(r);
        if(sourceUltimateBefore>0&&unit.hp<=0)sourceMarkEnemyDeathCredit(unit,[attackerDesc]);
        addLog(pet.name+' 反擊 '+unit.name+(r.critical?'，會心一擊 ':'，造成 ')+r.damage+' 傷害。','pet');
        sourceLogAcupunctureReaction(acupuncture);
      }
    }else{
      if(r.dodged)addLog(pet.name+' 閃避了 '+unit.name+' 的反擊。','pet');
      else if(r.miss)addLog(unit.name+' 對 '+pet.name+' 的反擊沒有造成傷害。');
      else{
        const before=n(pet.hp);
        pet.hp=Math.max(0,before-r.damage);
      sourceTrackDamageSubUltimate({kind:'pet',pet,petId:pet.id},r.damage,before,r);
      sourceBattleFinalizeItemCrushRng(r);
        addLog(unit.name+(r.critical?' 反擊會心 ':' 反擊 ')+pet.name+'，造成 '+r.damage+' 傷害。',pet.hp<=0?'bad':'');
        if(before>0&&pet.hp<=0)addLog(pet.name+' 倒下了，本場後續回合不再行動。','bad');
      }
    }
    sourceProcessBattleDeathsAtAddProfit();
    if(enemy)syncEnemyTarget();
    if(!petIsBattleActive(pet)||unit.hp<=0)break;
    if(r.miss||r.critical)break;
    const next=counterer;counterer=target;target=next;
  }
}
function resolveAttackToEnemyWithGuardian(attacker,target,options={}){
  if(!target)return {damage:0,dodged:false,critical:false,miss:true,guarded:false,actualTarget:null};
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const originalGuarding=Object.prototype.hasOwnProperty.call(options,'guarding')
    ?!!options.guarding
    :(!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion'));
  const disableDodge=originalGuarding||!!options.disableDodge;
  const originalView=enemyBattleView(target);
  if(!disableDodge&&originalView?.canMove!==false&&n(originalView?.skillDuckPower)>0){
    const power=Math.trunc(n(originalView.skillDuckPower));
    const roll=cRand(0,99);
    if(roll<=power){
      return {
        damage:0,dodged:true,critical:false,miss:false,guarded:originalGuarding,
        skillDuck:true,skillDuckPower:power,skillDuckRoll:roll,
        actualTarget:target,originalTarget:target
      };
    }
  }
  const duck=disableDodge?0:sourceBattleDuckTotal(attacker,originalView,options);
  if(!disableDodge){
    if(cRand(1,10000)<=duck){
      return {
        damage:0,dodged:true,critical:false,miss:false,guarded:originalGuarding,
        duckRaw:duck,actualTarget:target,originalTarget:target
      };
    }
  }

  // 原 BATTLE_AttackSeq：先讓原目標做 DuckCheck，成功命中後才 GuardianCheck。
  // Guardian 接手後用 Guardian 自身防禦／會心／屬性結算，且不再做第二次閃避。
  // 原 BATTLE_GuardianCheck：攻擊者使用 BOW／BOOMERANG／BOUNDTHROW／BREAKTHROW 時，
  // 忠犬／Guardian 直接無法代擋。這對混亂後 Enemy 打同側 Enemy 也同樣成立。
  const guardian=attacker?.throwWeapon?null:enemyGuardianFor(target,options.attackerUnit||null);
  const actual=guardian||target;
  const actualDesc={kind:'enemy',unit:actual,unitId:actual.id};
  const actualGuarding=guardian
    ?(!!actual.guardThisTurn&&!battleStatusActive(actualDesc,'confusion'))
    :originalGuarding;
  const r=resolveNormalAttack(attacker,enemyBattleView(actual),Object.assign({},options,{
    guarding:actualGuarding,disableDodge:true
  }));
  r.duckRaw=duck;
  r.actualTarget=actual;
  r.originalTarget=target;
  if(guardian){
    // BATTLE_AttackSeq 的 Guardian 分支即使原計算傷害為 0，也會強制 NORMAL / damage=1。
    if(r.damage<=0){r.damage=1;r.miss=false}
    r.guardian=guardian;
    r.protectedTarget=target;
  }
  return r;
}
function applyFriendlyEnemyHit(attackerKind,attackerName,target,r,attackerPetId=null){
  const actual=r?.actualTarget||target;
  if(!actual)return null;
  const style=attackerKind==='pet'?'pet':(r.critical?'good':'');
  if(r.dodged){
    addLog(target.name+' 閃避了 '+attackerName+' 的攻擊。',attackerKind==='pet'?'pet':'');
    return target;
  }
  if(r.miss){
    addLog(attackerName+' 攻擊 '+target.name+'，但沒有造成傷害。',attackerKind==='pet'?'pet':'');
    return actual;
  }

  const attackerDesc=attackerKind==='pet'
    ?{kind:'pet',pet:state.petBox.find(p=>p.id===attackerPetId)||null,petId:attackerPetId}
    :{kind:'player'};
  const targetDesc={kind:'enemy',unit:actual,unitId:actual.id};
  const acupuncture=sourcePrepareAcupunctureReaction(attackerDesc,targetDesc,r);
  const before=n(actual.hp);
  actual.hp=Math.max(0,before-r.damage);
  sourceTrackDamageSubUltimate(targetDesc,r.damage,before,r);
  sourceFinishAcupunctureReaction(acupuncture);
  battleStatusWakeOnDamage(targetDesc,r.damage);
  sourceBattleFinalizeItemCrushRng(r);
  if(r.guardian){
    addLog(actual.name+' 發動忠犬護住 '+target.name+'，代受 '+r.damage+' 傷害'+(r.critical?'（會心）':'')+'。',actual.hp<=0?'bad':style);
  }else if(attackerKind==='pet'){
    addLog(attackerName+' 攻擊 '+actual.name+(r.critical?'，會心一擊 ':'，造成 ')+r.damage+' 傷害。','pet');
  }else{
    addLog('你對 '+actual.name+(r.critical?' 發動會心一擊，造成 ':' 造成 ')+r.damage+' 傷害。',r.critical?'good':'');
  }
  sourceLogAcupunctureReaction(acupuncture);
  if(before>0&&actual.hp<=0){
    sourceMarkEnemyDeathCredit(actual,[attackerKind==='pet'?{kind:'pet',petId:attackerPetId}:{kind:'player'}]);
    addLog(actual.name+' 倒下了，本場後續回合不再行動。','bad');
  }
  return actual;
}
function playerAttackResult(target=targetEnemyUnit()){
  const targetDesc={kind:'enemy',unit:target,unitId:target?.id};
  return resolveAttackToEnemyWithGuardian(playerBattleView(),target,{guarding:!!target?.guardThisTurn&&!battleStatusActive(targetDesc,'confusion')});
}
function petAttackResult(pet,target=targetEnemyUnit()){
  const attacker=petBattleView(pet);
  const targetDesc={kind:'enemy',unit:target,unitId:target?.id};
  if(attacker)return resolveAttackToEnemyWithGuardian(attacker,target,{guarding:!!target?.guardThisTurn&&!battleStatusActive(targetDesc,'confusion')});
  const str=Math.max(1,n(pet?.stats?.str)||6);
  return {damage:Math.max(1,Math.round(2+str*.42+n(pet.level)*1.2-n(target?.defense)*.28+rnd(-1,2))),dodged:false,critical:false,miss:false,legacy:true};
}
function sourceInitialDodgeOnly(attacker,defender,options={}){
  const guarding=!!options.guarding;
  const disableDodge=guarding||!!options.disableDodge||defender?.canMove===false;
  if(disableDodge)return {dodged:false,duckRaw:0};

  if(n(defender?.skillDuckPower)>0){
    const power=Math.trunc(n(defender.skillDuckPower));
    const roll=cRand(0,99);
    if(roll<=power){
      return {
        dodged:true,damage:0,critical:false,miss:false,guarded:guarding,
        skillDuck:true,skillDuckPower:power,skillDuckRoll:roll,duckRaw:0
      };
    }
  }

  const duck=sourceBattleDuckTotal(attacker,defender,options);
  if(cRand(1,10000)<=duck){
    return {dodged:true,damage:0,critical:false,miss:false,guarded:guarding,duckRaw:duck};
  }
  return {dodged:false,duckRaw:duck};
}
// fixed BATTLE_AttackSeq() Guardian caller audit (V1.12):
// - real substitution: BATTLE_Attack, BATTLE_Attack_FIREKILL, BATTLE_BattleModel_ATTACK,
//   and the later multi-target branch inside battle_profession_status_chang_fun.
// - calc-only caller-defindex bug: BATTLE_S_GBreak, BATTLE_S_GBreak2, BATTLE_S_FallGround,
//   BATTLE_S_AttackDamage, battle_profession_attack_fun, and the shield-attack branch inside
//   battle_profession_status_chang_fun.
// - Guardian intentionally disabled by caller seed -2: BATTLE_Counter and BATTLE_Combo.
// - BATTLE_S_Explode would be calc-only too, but fixed version.h leaves _PETSKILL_EXPLODE disabled.
// Do not globalize Guardian substitution: each caller owns whether its defindex is rewritten.
function sourcePlayerGuardianPetForAttack(unit){
  if(!battlePlayerGuardianPetId)return null;
  const pet=state?.petBox?.find?.(p=>p.id===battlePlayerGuardianPetId)||null;
  if(!pet||!petIsBattleActive(pet)||!petIsAlive(pet)||sourcePlayerPetHidden(pet))return null;

  // fixed BATTLE_GuardianCheck：投擲/遠距武器直接無法忠犬代擋。
  const wt=Math.trunc(n(unit?.weaponType));
  if(wt===4||wt===17||wt===18||wt===19)return null;

  const desc={kind:'pet',pet,petId:pet.id};
  // fixed 明確排除 sleep/confusion/paralysis/stone/barrier/dizzy 等不能守人的狀態。
  if(!battleStatusCanMove(desc)||battleStatusActive(desc,'confusion')||battleStatusActive(desc,'barrier'))return null;
  return pet;
}
function resolveEnemyDirectAttackToPlayer(unit,options={},attackerOverride=null){
  const attacker=Object.assign({},enemyBattleView(unit),attackerOverride||{});
  const original=playerBattleView();
  const dodge=sourceInitialDodgeOnly(attacker,original,options);
  if(dodge.dodged){
    dodge.originalTargetDesc={kind:'player'};
    dodge.actualTargetDesc={kind:'player'};
    return dodge;
  }

  // BATTLE_AttackSeq：原目標先 DuckCheck，成功命中後才 GuardianCheck。
  const guardian=attacker?.throwWeapon?null:sourcePlayerGuardianPetForAttack(unit);
  const actualDesc=guardian?{kind:'pet',pet:guardian,petId:guardian.id}:{kind:'player'};
  const defender=guardian?petBattleView(guardian):original;

  // Guardian 接手後不做第二次 dodge，也不沿用主人 GUARD；傷害/critical 以 Guardian 自身能力重算。
  const r=resolveNormalAttack(attacker,defender,Object.assign({},options,{
    guarding:guardian?false:!!options.guarding,
    disableDodge:true
  }));
  r.duckRaw=dodge.duckRaw;
  r.originalTargetDesc={kind:'player'};
  r.actualTargetDesc=actualDesc;

  if(guardian){
    // fixed BATTLE_AttackSeq：Guardian substitution 後若傷害算成 0，強制 NORMAL / damage=1。
    if(r.damage<=0){r.damage=1;r.miss=false}
    r.guardian=guardian;
    r.guardianPetId=guardian.id;
    r.protectedTarget='player';
  }
  return r;
}
function enemyAttackResult(unit=targetEnemyUnit(),options={}){
  return resolveNormalAttack(enemyBattleView(unit),playerBattleView(),options);
}
function enemyAttackPetResult(unit,pet,options={}){
  const guardCommand=sourcePlayerPetGuardCommand(pet);
  const guarding=sourcePlayerPetGuardAdjust(pet);
  const r=resolveNormalAttack(enemyBattleView(unit),petBattleView(pet),Object.assign({},options,{
    guarding,
    disableDodge:!!options.disableDodge||guardCommand
  }));
  r.sourcePetGuardCommand=guardCommand;
  r.sourcePetGuardAdjust=guarding;
  return r;
}

const SOURCE_BOW_W=Object.freeze([
  0,2,1,4,3, 0,1,2,3,4,
  1,0,3,2,4, 1,3,0,2,4,
  2,4,0,1,3, 2,0,4,1,3,
  3,1,0,2,4, 3,1,0,2,4,
  4,2,0,1,3, 4,2,0,1,3
]);
const SOURCE_BOOMERANG_VS_TBL=Object.freeze([
  Object.freeze([4,2,0,1,3]),
  Object.freeze([9,7,5,6,8]),
  Object.freeze([14,12,10,11,13]),
  Object.freeze([19,17,15,16,18])
]);
function sourceBattleGetAttackCount(unit){
  const itemIndex=Math.trunc(Number(unit?.weaponItemIndex));
  if(!Number.isFinite(itemIndex)||itemIndex<0)return 0;
  const runtimeSlot=sourceItemRuntimeSlot(itemIndex);
  if(!runtimeSlot)return 0;
  const template=sourceEnemyWeaponTemplate(runtimeSlot.itemId);
  const min=Math.trunc(n(template?.attackNum?.[0]??unit?.weaponAttackNumMin));
  const max=Math.trunc(n(template?.attackNum?.[1]??unit?.weaponAttackNumMax));
  let count=cRand(min,max);
  if(count<=0)count=1;
  return count;
}
function sourceEnemyBattleAttackMax(unit){
  const count=sourceBattleGetAttackCount(unit);
  // 原 battle.c：沒有有效 CHAR_ARM 時 BATTLE_GetAttackCount() 回 0；
  // 非 PLAYER（Enemy/Pet）隨後固定退回 1 擊，不進玩家等級／Luck 的空手連擊表。
  return count<=0?1:count;
}
function sourceEnemyPrimeExecutionAttackCount(actor){
  if(actor?.kind!=='enemy')return null;
  // BATTLE_Battling() owns Battle Entry lifetime, so look through the full unit array rather
  // than livingEnemyUnits(): StatusSeq can make the actor unable to move (or even die) and the
  // source still reaches BATTLE_GetAttackCount before switching on COM.
  const units=Array.isArray(enemy?.units)&&enemy.units.length?enemy.units:(enemy?[enemy]:[]);
  const unit=units.find(u=>u&&u.id===actor.unitId)||null;
  if(!unit)return null;
  const itemIndex=Math.trunc(Number(unit.weaponItemIndex));
  const slot=Number.isFinite(itemIndex)&&itemIndex>=0?sourceItemRuntimeSlot(itemIndex):null;
  const validArm=!!slot;
  const attackMax=sourceEnemyBattleAttackMax(unit);
  actor.sourceAttackMax=attackMax;
  actor.sourceAttackCountWeaponRoll=validArm;
  return {attackMax,validArm,itemIndex:validArm?itemIndex:-1};
}
function sourcePlayerBattleAttackMax(){
  // Current Web player runtime has no CHAR_ARM/equipment path yet: playerBattleView.weaponType
  // is fixed ITEM_FIST and no player weaponItemIndex exists. Therefore fixed BATTLE_GetAttackCount()
  // returns 0 and the source unarmed PLAYER fallback below is the reachable path.
  const level=Math.max(1,Math.trunc(n(state?.level)));
  if(level<10)return {attackMax:1,roll:null,burstRoll:null,luckWork:null};

  let luckWork=Math.trunc(n(state?.luck))*5;
  // fixed battle.c only clamps the strange high side; preserve negative values rather than inventing a floor.
  if(luckWork>25)luckWork=25;
  const roll=cRand(1,1000);
  let attackMax=1,burstRoll=null;
  if(roll<=10+luckWork){
    burstRoll=cRand(5,10);
    attackMax=burstRoll;
  }else if(roll<=30+luckWork){
    attackMax=3;
  }else if(roll<=70+luckWork){
    attackMax=2;
  }
  return {attackMax,roll,burstRoll,luckWork};
}
function sourcePlayerPrimeExecutionAttackCount(actor){
  if(actor?.kind!=='player')return null;
  const plan=sourcePlayerBattleAttackMax();
  actor.sourceAttackMax=plan.attackMax;
  actor.sourcePlayerUnarmedAttackCountRoll=plan.roll;
  actor.sourcePlayerUnarmedBurstRoll=plan.burstRoll;
  actor.sourcePlayerUnarmedLuckWork=plan.luckWork;
  return plan;
}
function sourceFriendlyEnemyTargetAdjust(actor){
  // fixed BATTLE_TargetAdjust first accepts the raw COM2 when it is still TargetCheck-valid.
  // Only an invalid/dead/hidden original target falls through to BATTLE_DefaultAttacker(),
  // which always consumes RAND(0,cnt-1), including RAND(0,0).
  const rawId=actor?.targetUnitId;
  const fixed=targetableEnemyUnits().find(u=>u?.id===rawId)||null;
  if(fixed)return fixed;
  return sourcePetRandomEnemyTarget()?.unit||null;
}
function sourcePerformPlayerCommonAttack(actor,options={}){
  const attackMax=Math.max(1,Math.trunc(n(actor?.sourceAttackMax))||1);
  let attackCount=0,lastTarget=null,lastActual=null,lastResult=null;

  // Non-BOW TargetListSet pre-fills every aDefList slot with the original raw COM2.
  // Re-run TargetAdjust from that same raw COM2 for every segment, exactly like the C loop.
  while(enemy&&state.hp>0&&attackCount<attackMax){
    const target=sourceFriendlyEnemyTargetAdjust(actor);
    if(!target)break;

    const r=playerAttackResult(target);
    const actual=applyFriendlyEnemyHit('player','你',target,r);
    sourceProcessBattleDeathsAtAddProfit();
    attackCount++;
    lastTarget=target;
    lastActual=actual;
    lastResult=r;

    // applyFriendlyEnemyHit performs per-segment ItemCrush/death-credit/carried-loot lifecycle
    // before we re-enter TargetAdjust for the next segment, matching BATTLE_Attack -> AddProfit.
    if(state.hp<=0||!enemy)break;
    if(!livingEnemyUnits().length)break;
  }

  // fixed common loop performs Counter only after the full multi-hit loop and uses the
  // last segment's ContFlg/defNo. Critical/Guardian/death suppression stays in the chain helper.
  const counterUnit=lastActual||lastTarget;
  if(lastResult&&state.hp>0&&counterUnit?.hp>0&&options.allowCounter!==false){
    resolvePlayerEnemyCounterChain('player',counterUnit,lastResult);
  }
  return {attackCount,attackMax,lastTarget,lastActual,lastResult};
}
function sourceEnemyTargetBattleSlot(target){
  if(target?.kind==='player')return 0;
  if(target?.kind==='pet')return 5;
  return -1;
}
function sourceEnemyCommandTargetBattleSlot(actor,target){
  // 原 CHAR_WORKBATTLECOM2 在回合建表後不會因目標中途倒下而先改寫。
  if(actor?.targetKind==='player')return 0;
  if(actor?.targetKind==='pet')return 5;
  return sourceEnemyTargetBattleSlot(target);
}
function sourceEnemyTargetFromBattleSlot(slot){
  const no=Math.trunc(Number(slot));
  if(no===0&&state.hp>0)return battleTargetSnapshot('player');
  if(no===5){
    const pet=activePet();
    if(pet&&petIsBattleActive(pet))return battleTargetSnapshot('pet',pet);
  }
  return null;
}
function sourceEnemyTargetableFromBattleSlot(slot){
  const target=sourceEnemyTargetFromBattleSlot(slot);
  return sourceEnemyTargetCheck(target)?target:null;
}
function sourceFoxPlayerSideTargetFromBattleSlot(slot){
  const no=Math.trunc(Number(slot));
  if(no===0&&state.hp>0)return battleTargetSnapshot('player');
  if(no===5){
    const pet=activePet();
    if(pet&&petIsBattleActive(pet)&&!sourcePlayerPetHidden(pet))return battleTargetSnapshot('pet',pet);
  }
  return null;
}
function sourceFoxDefaultPlayerSideTarget(){
  const list=[];
  if(state.hp>0)list.push(battleTargetSnapshot('player'));
  const pet=activePet();
  if(pet&&petIsBattleActive(pet)&&!sourcePlayerPetHidden(pet))list.push(battleTargetSnapshot('pet',pet));
  if(!list.length)return null;
  return list[cRand(0,list.length-1)];
}
function sourceFoxTargetAdjust(slot){
  return sourceFoxPlayerSideTargetFromBattleSlot(slot)||sourceFoxDefaultPlayerSideTarget();
}
function sourceBowTargetList(actor,unit,target){
  const defNo=sourceEnemyCommandTargetBattleSlot(actor,target);
  if(defNo<0||defNo>19)return {defNo,random:null,slots:[-1]};
  const defsub=defNo%5;
  const deftop=defNo-defsub;
  const random=cRand(0,1);
  const attackNo=10+Math.max(0,Math.trunc(n(unit?.battleSlot)));
  const slots=[];
  for(let j=0;j<5;j++){
    let first=SOURCE_BOW_W[defsub*10+random*5+j]+deftop;
    let second=(deftop===0||deftop===10)?first+5:first-5;
    if(first===attackNo)first=-1;
    if(second===attackNo)second=-1;
    slots.push(first,second);
  }
  slots.push(-1);
  return {defNo,defsub,deftop,random,attackNo,slots};
}
function enemyWeaponApplyHit(unit,target,options={},attackOptions={}){
  if(!target)return null;
  const playerGuarding=!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
  const beforeApply=typeof options.beforeApply==='function'?options.beforeApply:null;

  if(target.kind==='pet'&&target.pet&&petIsBattleActive(target.pet)){
    const pet=target.pet;
    const r=enemyAttackPetResult(unit,pet,attackOptions);
    const targetDesc={kind:'pet',pet,petId:pet.id};
    const beforeApplyResult=beforeApply?beforeApply({target:'pet',pet,targetDesc,r},target):null;
    if(r.dodged){
      addLog(pet.name+' 閃避了 '+unit.name+' 的攻擊。','pet');
    }else if(r.miss){
      addLog(unit.name+' 攻擊 '+pet.name+'，但沒有造成傷害。');
    }else{
      const before=n(pet.hp);
      pet.hp=Math.max(0,before-r.damage);
      sourceTrackDamageSubUltimate({kind:'pet',pet,petId:pet.id},r.damage,before,r);
      battleStatusWakeOnDamage({kind:'pet',pet,petId:pet.id},r.damage);
      addLog(unit.name+(r.critical?' 會心一擊 ':' 攻擊 ')+pet.name+'，造成 '+r.damage+' 傷害。',pet.hp<=0?'bad':'');
      if(before>0&&pet.hp<=0)addLog(pet.name+' 倒下了，本場後續回合不再行動。','bad');
    }
    return {target:'pet',pet,targetDesc,r,beforeApply:beforeApplyResult};
  }

  if(target.kind!=='player'||state.hp<=0)return null;
  const r=enemyAttackResult(unit,Object.assign({},attackOptions,{guarding:playerGuarding}));
  const targetDesc={kind:'player'};
  const beforeApplyResult=beforeApply?beforeApply({target:'player',targetDesc,r},target):null;
  if(playerGuarding){
    if(r.damage<=0)addLog('你防住了 '+unit.name+' 的攻擊，沒有受到傷害。','good');
    else{
      const sourceUltimateBefore=n(state.hp);
    state.hp=Math.max(0,sourceUltimateBefore-r.damage);
    sourceTrackDamageSubUltimate({kind:'player'},r.damage,sourceUltimateBefore,r);
      battleStatusWakeOnDamage({kind:'player'},r.damage);
      addLog('防禦中：'+unit.name+(r.critical?' 會心一擊 ':' 攻擊 ')+r.damage+'。',state.hp<=0?'bad':'');
    }
  }else if(r.dodged){
    addLog('你閃避了 '+unit.name+' 的攻擊。','good');
  }else if(r.miss){
    addLog(unit.name+' 的攻擊沒有造成傷害。');
  }else{
    const sourceUltimateBefore=n(state.hp);
    state.hp=Math.max(0,sourceUltimateBefore-r.damage);
    sourceTrackDamageSubUltimate({kind:'player'},r.damage,sourceUltimateBefore,r);
    battleStatusWakeOnDamage({kind:'player'},r.damage);
    addLog(unit.name+(r.critical?' 會心一擊 ':' 攻擊 ')+r.damage+'。',state.hp<=0?'bad':'');
  }
  return {target:'player',targetDesc,r,beforeApply:beforeApplyResult};
}
function sourceBreakthrowParalysis(unit,hit){
  if(!hit?.targetDesc||!hit?.r||n(hit.r.damage)<=0)return {attempted:false,applied:false};
  const check=battleStatusChance({kind:'enemy',unit,unitId:unit.id},hit.targetDesc,'paralysis');
  const applied=!!(check.allowed&&check.success&&battleStatusApply(hit.targetDesc,'paralysis',0));
  if(applied){
    addLog(battleStatusDescName(hit.targetDesc)+' 被 '+(unit.weaponName||'投石')+' 打中後陷入麻痺 1 回合。','bad');
  }
  return {attempted:true,check,applied};
}
function performEnemyBowWeaponAttack(actor,unit,options={}){
  // Source BOW skips BATTLE_TargetAdjust. aBowW is built from raw COM2, then every slot is
  // gated by BATTLE_TargetCheck; an EarthRound-hidden pet therefore shapes the list but is skipped.
  const chosen=enemyActorCommandTarget(actor);
  if(!chosen)return null;
  const overrideMax=Number(options.attackMaxOverride);
  const primedMax=Number(actor?.sourceAttackMax);
  const attackMax=Number.isFinite(overrideMax)&&overrideMax>0
    ?Math.trunc(overrideMax)
    :(Number.isFinite(primedMax)&&primedMax>0?Math.trunc(primedMax):sourceEnemyBattleAttackMax(unit));
  const plan=options.sourceBowPlan||sourceBowTargetList(actor,unit,chosen);
  const attackOptions=Object.assign({},options.attackOptions||{});
  const afterHit=typeof options.afterHit==='function'?options.afterHit:null;
  const hits=[];
  let attackCount=0;
  let sourcePostTarget=null;
  let sourceLoopExit='target-list-end';
  for(const slot of plan.slots){
    // fixed common loop assigns defNo=aDefList[++k] before testing <0.
    // Therefore hitting the sentinel leaves the later BECOMEFOX/BECOMEPIG post-check with invalid defNo.
    if(slot<0){
      sourcePostTarget=null;
      sourceLoopExit='target-list-end';
      break;
    }
    const target=sourceEnemyTargetableFromBattleSlot(slot);
    if(!target)continue;
    const hit=enemyWeaponApplyHit(unit,target,options,attackOptions);
    if(!hit)continue;
    if(afterHit)hit.afterHit=afterHit(hit,target);
    sourceBattleFinalizeItemCrushRng(hit.r);
    sourceProcessBattleDeathsAtAddProfit();
    hits.push(Object.assign({battleSlot:slot},hit));
    attackCount++;
    sourcePostTarget=target;
    // When attack_max is reached (or the attacker dies), source breaks before loading the next aDefList slot,
    // so defNo remains the target of the last real BATTLE_Attack.
    if(attackCount>=attackMax){
      sourceLoopExit='attack-max';
      break;
    }
    if(n(unit.hp)<=0){
      sourceLoopExit='attacker-dead';
      break;
    }
  }
  if(attackCount<attackMax&&n(unit.hp)>0&&sourceLoopExit!=='attacker-dead')sourcePostTarget=null;
  const sourceCounterReady=attackCount>=attackMax&&hits.length>0&&n(unit.hp)>0;
  return {
    target:chosen.kind,pet:chosen.pet||null,r:hits.length?hits[hits.length-1].r:null,
    weaponCommand:'BOW',protocol:'BB-w0',weaponItemId:unit.equippedWeaponId,
    attackMax,attackCount,bowRandom:plan.random,bowTargetSlots:plan.slots.slice(),hits,
    sourcePostTarget,sourceLoopExit,sourceCounterReady
  };
}
function performEnemyBoomerangWeaponAttack(actor,unit,options={}){
  // fixed BATTLE_COM_BOOMERANG starts from raw COM2's five-slot row.
  // It does not rerun Enemy AI when that row becomes invalid.
  let chosen=enemyActorCommandTarget(actor);
  let defNo=sourceEnemyCommandTargetBattleSlot(actor,chosen);
  if(defNo<0){
    chosen=sourceEnemyDefaultAttacker();
    if(!chosen)return null;
    defNo=sourceEnemyTargetBattleSlot(chosen);
  }
  let row=(defNo>=0&&defNo<=19)?Math.trunc(defNo/5):-1;
  const rowHasTarget=r=>r>=0&&r<SOURCE_BOOMERANG_VS_TBL.length&&SOURCE_BOOMERANG_VS_TBL[r].some(slot=>!!sourceEnemyTargetableFromBattleSlot(slot));
  if(!rowHasTarget(row)){
    chosen=sourceEnemyDefaultAttacker();
    if(!chosen)return null;
    defNo=sourceEnemyTargetBattleSlot(chosen);
    row=(defNo>=0&&defNo<=19)?Math.trunc(defNo/5):-1;
  }
  if(row<0||row>=SOURCE_BOOMERANG_VS_TBL.length)return null;

  const baseOptions=Object.assign({},options.attackOptions||{});
  const baseMultiplier=Number.isFinite(Number(baseOptions.damageMultiplier))?Number(baseOptions.damageMultiplier):1;
  baseOptions.damageMultiplier=baseMultiplier*.3;
  const order=SOURCE_BOOMERANG_VS_TBL[row].slice().reverse(); // Enemy myside==1：k=4, j=-1
  const hits=[];
  for(const slot of order){
    const target=sourceEnemyTargetableFromBattleSlot(slot);
    if(!target)continue;
    const hit=enemyWeaponApplyHit(unit,target,options,baseOptions);
    if(hit){
      sourceBattleFinalizeItemCrushRng(hit.r);
      sourceProcessBattleDeathsAtAddProfit();
      hits.push(Object.assign({battleSlot:slot},hit));
    }
    if(n(unit.hp)<=0)break;
  }
  return {
    target:chosen.kind,pet:chosen.pet||null,r:hits.length?hits[hits.length-1].r:null,
    weaponCommand:'BOOMERANG',protocol:'BO',weaponItemId:unit.equippedWeaponId,
    damageMultiplier:.3,row,targetSlots:order,hits
  };
}
function performEnemyThrowWeaponAttack(actor,unit,options={}){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return null;
  const overrideMax=Number(options.attackMaxOverride);
  const primedMax=Number(actor?.sourceAttackMax);
  const attackMax=Number.isFinite(overrideMax)&&overrideMax>0
    ?Math.trunc(overrideMax)
    :(Number.isFinite(primedMax)&&primedMax>0?Math.trunc(primedMax):sourceEnemyBattleAttackMax(unit));
  const attackOptions=Object.assign({},options.attackOptions||{});
  const afterHit=typeof options.afterHit==='function'?options.afterHit:null;
  const useBreakthrowStatus=options.breakthrowStatus!==false;
  const hits=[];
  let target=chosen;
  let sourcePostTarget=null;
  let sourceLoopExit='target-adjust-failed';
  for(let i=0;i<attackMax;i++){
    if(!target){
      sourcePostTarget=null;
      sourceLoopExit='target-adjust-failed';
      break;
    }
    const hit=enemyWeaponApplyHit(unit,target,options,attackOptions);
    if(!hit){
      sourcePostTarget=null;
      sourceLoopExit='attack-failed';
      break;
    }
    let paralysis=null;
    if(useBreakthrowStatus&&Math.trunc(n(unit.weaponType))===19)paralysis=sourceBreakthrowParalysis(unit,hit);
    if(afterHit)hit.afterHit=afterHit(hit,target);
    sourceBattleFinalizeItemCrushRng(hit.r);
    sourceProcessBattleDeathsAtAddProfit();
    hits.push(Object.assign({paralysis},hit));
    sourcePostTarget=target;
    if(i+1>=attackMax){
      sourceLoopExit='attack-max';
      break;
    }
    if(n(unit.hp)<=0){
      sourceLoopExit='attacker-dead';
      break;
    }
    // Non-BOW TargetListSet prefilled every later aDefList entry with the original COM2.
    // Each later segment writes that raw slot back to COM2 and runs BATTLE_TargetAdjust again.
    target=enemyActorTarget(actor,unit);
    // fixed code has already assigned the failed TargetAdjust result into defNo before it breaks.
    if(!target){
      sourcePostTarget=null;
      sourceLoopExit='target-adjust-failed';
      break;
    }
  }
  const type=Math.trunc(n(unit.weaponType));
  const attackCount=hits.length;
  const sourceCounterReady=attackCount>=attackMax&&hits.length>0&&n(unit.hp)>0;
  return {
    target:chosen.kind,pet:chosen.pet||null,r:hits.length?hits[hits.length-1].r:null,
    weaponCommand:type===19?'BREAKTHROW':'BOUNDTHROW',
    protocol:type===19?'BB-w2':'BB-w1',weaponItemId:unit.equippedWeaponId,
    attackMax,attackCount,hits,sourcePostTarget,sourceLoopExit,sourceCounterReady
  };
}

function sourceEnemyFinalizeWeaponSequenceCounter(unit,seq,options={},rules={}){
  if(!unit||!seq?.sourceCounterReady||!Array.isArray(seq.hits)||!seq.hits.length||!enemy||n(unit.hp)<=0)return null;
  const last=seq.hits[seq.hits.length-1];
  const r=last?.r;
  const targetDesc=last?.targetDesc;
  if(!r||!targetDesc)return null;

  // Some common-loop skills (notably STATUSCHANGE) apply their status inside BATTLE_Attack()
  // before the outer Counter loop. If that status makes the last target unable to move,
  // BATTLE_Counter() cannot begin.
  if(rules.requireCanMove&& !battleStatusCanMove(targetDesc))return null;

  if(last.target==='pet'&&last.pet&&petIsBattleActive(last.pet)){
    resolvePetEnemyCounterChain('enemy',last.pet,unit,r);
    return {target:'pet',petId:last.pet.id};
  }
  if(last.target==='player'&&state.hp>0&&options.allowPlayerCounter){
    resolvePlayerEnemyCounterChain('enemy',unit,r);
    return {target:'player'};
  }
  return null;
}

function performEnemyFoxFistRangedAttack(actor,unit,options={}){
  const actualWeaponType=Math.trunc(n(unit?.weaponType));
  const primedMax=Number(actor?.sourceAttackMax);
  const attackMax=Number.isFinite(primedMax)&&primedMax>0?Math.trunc(primedMax):sourceEnemyBattleAttackMax(unit);
  const commandSlot=sourceEnemyCommandTargetBattleSlot(actor,null);

  // Source order is important: BATTLE_GetAttackCount() is evaluated before
  // BATTLE_TargetListSet(); an actually equipped bow then consumes its RAND(0,1)
  // even though fox already forced global gWeponType to FIST.
  const bowPlan=actualWeaponType===4?sourceBowTargetList(actor,unit,null):null;
  let target=sourceFoxTargetAdjust(commandSlot);
  const attackOptions=Object.assign({},options.attackOptions||{},{
    damageDivisor:attackMax,
    sourceOuterWeaponType:0
  });
  const hits=[];
  let attackCount=0;
  let k=0;

  while(target&&attackCount<attackMax&&n(unit.hp)>0){
    const hit=enemyWeaponApplyHit(unit,target,options,attackOptions);
    if(!hit)break;
    sourceBattleFinalizeItemCrushRng(hit.r);
    sourceProcessBattleDeathsAtAddProfit();
    hits.push(Object.assign({
      battleSlot:sourceEnemyTargetBattleSlot(target),
      sourceCommandSlot:attackCount===0?commandSlot:(actualWeaponType===4?bowPlan?.slots?.[k]:commandSlot)
    },hit));
    attackCount++;
    if(attackCount>=attackMax||n(unit.hp)<=0)break;

    if(actualWeaponType===4){
      // fixed loop starts k=0 and only after the first BATTLE_Attack does ++k,
      // so fox+bow never uses aDefList[0] as its first target.
      k++;
      const nextSlot=bowPlan?.slots?.[k];
      if(nextSlot==null||nextSlot<0)break;
      target=sourceFoxTargetAdjust(nextSlot);
    }else{
      // Non-bow TargetListSet is COM2 repeated; an invalid/dead COM2 is adjusted
      // through BATTLE_DefaultAttacker on every later hit.
      target=sourceFoxTargetAdjust(commandSlot);
    }
  }

  return {
    target:hits[0]?.target||target?.kind||null,
    pet:hits[0]?.pet||null,
    r:hits.length?hits[hits.length-1].r:null,
    weaponCommand:'FIST',protocol:'BH',weaponItemId:unit.equippedWeaponId,
    sourceFoxFist:true,sourceActualWeaponType:actualWeaponType,
    attackMax,attackCount,
    bowRandom:bowPlan?.random??null,
    bowTargetSlots:bowPlan?.slots?.slice?.()||null,
    breakthrowStatus:false,
    hits
  };
}
function performEnemyPrimaryAttack(actor,unit,options={}){
  const weaponType=Math.trunc(n(unit?.weaponType));
  if(options.sourceForceFist&&(weaponType===4||weaponType===17||weaponType===18||weaponType===19)){
    return performEnemyFoxFistRangedAttack(actor,unit,options);
  }
  // 原 battle.c：只有普通 BATTLE_COM_ATTACK 會把 BOOMERANG 改成 BATTLE_COM_BOOMERANG；
  // BOW／BOUNDTHROW／BREAKTHROW 則仍走共用物理攻擊 loop。
  if(weaponType===17&&actor?.enemyAction==='attack')return performEnemyBoomerangWeaponAttack(actor,unit,options);
  if(weaponType===4){
    const seq=performEnemyBowWeaponAttack(actor,unit,options);
    if(seq)seq.counter=sourceEnemyFinalizeWeaponSequenceCounter(unit,seq,options);
    return seq;
  }
  if(weaponType===18||weaponType===19){
    const seq=performEnemyThrowWeaponAttack(actor,unit,options);
    if(seq)seq.counter=sourceEnemyFinalizeWeaponSequenceCounter(unit,seq,options);
    return seq;
  }

  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return null;
  const playerGuarding=!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
  const allowPlayerCounter=!!options.allowPlayerCounter;
  const attackOptions=Object.assign({},options.attackOptions||{});

  if(chosen.kind==='pet'&&chosen.pet&&petIsBattleActive(chosen.pet)){
    const pet=chosen.pet;
    const r=enemyAttackPetResult(unit,pet,attackOptions);
    if(r.dodged){
      addLog(pet.name+' 閃避了 '+unit.name+' 的攻擊。','pet');
    }else if(r.miss){
      addLog(unit.name+' 攻擊 '+pet.name+'，但沒有造成傷害。');
    }else{
      const before=n(pet.hp);
      pet.hp=Math.max(0,before-r.damage);
      sourceTrackDamageSubUltimate({kind:'pet',pet,petId:pet.id},r.damage,before,r);
      sourceBattleFinalizeItemCrushRng(r);
      battleStatusWakeOnDamage({kind:'pet',pet,petId:pet.id},r.damage);
      addLog(unit.name+(r.critical?' 會心一擊 ':' 攻擊 ')+pet.name+'，造成 '+r.damage+' 傷害。',pet.hp<=0?'bad':'');
      if(before>0&&pet.hp<=0)addLog(pet.name+' 倒下了，本場後續回合不再行動。','bad');
    }
    if(petIsBattleActive(pet)&&unit.hp>0)resolvePetEnemyCounterChain('enemy',pet,unit,r);
    return {target:'pet',pet,r};
  }

  const r=resolveEnemyDirectAttackToPlayer(unit,Object.assign({},attackOptions,{guarding:playerGuarding}));
  if(r.guardian){
    const pet=r.guardian;
    const before=n(pet.hp);
    pet.hp=Math.max(0,before-r.damage);
      sourceTrackDamageSubUltimate({kind:'pet',pet,petId:pet.id},r.damage,before,r);
      sourceBattleFinalizeItemCrushRng(r);
    battleStatusWakeOnDamage({kind:'pet',pet,petId:pet.id},r.damage);
    addLog(pet.name+' 發動忠犬，代替你承受 '+unit.name+(r.critical?' 的會心一擊 ':' 的攻擊 ')+r.damage+' 傷害。',pet.hp<=0?'bad':'pet');
    if(before>0&&pet.hp<=0)addLog(pet.name+' 倒下了，本場後續回合不再行動。','bad');
  }else if(playerGuarding){
    if(r.damage<=0)addLog('你防住了 '+unit.name+' 的攻擊，沒有受到傷害。','good');
    else{
      const sourceUltimateBefore=n(state.hp);
    state.hp=Math.max(0,sourceUltimateBefore-r.damage);
    sourceTrackDamageSubUltimate({kind:'player'},r.damage,sourceUltimateBefore,r);
    sourceBattleFinalizeItemCrushRng(r);
      addLog('防禦中：'+unit.name+(r.critical?' 會心一擊 ':' 攻擊 ')+r.damage+'。',state.hp<=0?'bad':'');
    }
  }else if(r.dodged){
    addLog('你閃避了 '+unit.name+' 的攻擊。','good');
  }else if(r.miss){
    addLog(unit.name+' 的攻擊沒有造成傷害。');
  }else{
    const sourceUltimateBefore=n(state.hp);
    state.hp=Math.max(0,sourceUltimateBefore-r.damage);
    sourceTrackDamageSubUltimate({kind:'player'},r.damage,sourceUltimateBefore,r);
    sourceBattleFinalizeItemCrushRng(r);
    battleStatusWakeOnDamage({kind:'player'},r.damage);
    addLog(unit.name+(r.critical?' 會心一擊 ':' 攻擊 ')+r.damage+'。',state.hp<=0?'bad':'');
  }
  // fixed common BATTLE_Attack caller reaches BATTLE_AddProfit before Counter.
  sourceProcessBattleDeathsAtAddProfit();
  if(allowPlayerCounter&&state.hp>0&&unit.hp>0)resolvePlayerEnemyCounterChain('enemy',unit,r);
  return {target:'player',actualTarget:r.guardian?'pet':'player',guardianPetId:r.guardianPetId||null,r};
}
function enemySkillNumber(option,pattern,fallback=0){
  const m=String(option||'').match(pattern);
  const v=m?Number(m[1]):NaN;
  return Number.isFinite(v)?v:fallback;
}
function enemyApplySkillHit(unit,chosen,r,label){
  if(chosen.kind==='pet'&&chosen.pet){
    const pet=chosen.pet;
    if(r.dodged){
      addLog(pet.name+' 閃避了 '+unit.name+' 的'+label+'。','pet');
    }else if(r.miss){
      addLog(unit.name+' 的'+label+'沒有造成傷害。');
    }else{
      const before=n(pet.hp);
      pet.hp=Math.max(0,before-r.damage);
      sourceTrackDamageSubUltimate({kind:'pet',pet,petId:pet.id},r.damage,before,r);
      battleStatusWakeOnDamage({kind:'pet',pet,petId:pet.id},r.damage);
      addLog(unit.name+' 的'+label+(r.critical?'會心 ':'')+'命中 '+pet.name+'，造成 '+r.damage+' 傷害。',pet.hp<=0?'bad':'');
      if(before>0&&pet.hp<=0)addLog(pet.name+' 倒下了，本場後續回合不再行動。','bad');
    }
    return;
  }

  if(r.guardianCalcOnly){
    addLog(r.guardianCalcOnly.name+' 嘗試發動忠犬；此招走原 '+(r.guardianSourceBug||'Guardian defindex')+' 舊 bug，傷害用忠犬能力計算但仍落在你身上。','bad');
  }
  if(r.dodged){
    addLog('你閃避了 '+unit.name+' 的'+label+'。','good');
  }else if(r.miss){
    addLog(unit.name+' 的'+label+'沒有造成傷害。');
  }else{
    const sourceUltimateBefore=n(state.hp);
    state.hp=Math.max(0,sourceUltimateBefore-r.damage);
    sourceTrackDamageSubUltimate({kind:'player'},r.damage,sourceUltimateBefore,r);
    battleStatusWakeOnDamage({kind:'player'},r.damage);
    addLog(unit.name+' 的'+label+(r.critical?'會心 ':'')+'造成 '+r.damage+' 傷害。',state.hp<=0?'bad':'');
  }
}
function enemyChargeSpec(meta){
  const option=String(meta?.o||'');
  const nMatch=option.match(/^\s*(\d+)/);
  const turns=clamp(nMatch?Math.trunc(Number(nMatch[1])):1,1,10);
  const attackPct=enemySignedSkillPercent(option,'攻%');
  return {turns,attackPct};
}
function performEnemyChargeAttack(actor,unit,options,meta){
  const spec=enemyChargeSpec(meta);
  const chosen=enemyActorCommandTarget(actor);
  unit.chargeState={
    remaining:Math.max(0,spec.turns-1),
    attackPct:spec.attackPct,
    targetKind:chosen?.kind||null,
    targetPetId:chosen?.petId||null,
    skillId:actor.skillId,
    skillSlot:actor.skillSlot??null,
    label:meta?.n||'蓄力攻擊'
  };
  unit.counterEligibleThisTurn=false;
  addLog(unit.name+' 開始使用 '+unit.chargeState.label+'，蓄力 '+spec.turns+' 回合。');
  return {kind:'skill',skillId:actor.skillId,charging:true,remaining:unit.chargeState.remaining};
}
function performEnemyChargeState(actor,unit,options={}){
  const charge=unit?.chargeState;
  if(!charge)return {kind:'charge',missing:true};

  if(charge.remaining>0){
    charge.remaining--;
    unit.counterEligibleThisTurn=false;
    addLog(unit.name+' 持續蓄力中（尚餘 '+charge.remaining+' 回合）。');
    return {kind:'charge',charging:true,remaining:charge.remaining};
  }

  // fixed BATTLE_Charge release：使用「釋放回合」已完成 complianceParameter 的 FIXSTR，
  // 再加 COM3 high 的攻擊百分比。當前正權重 Enemy 沒有可達 WORKMODATTACK 來源，
  // 因此此 runtime 的額外 MODATTACK 等價 0，不自行建立猜測值。
  const releaseFixAttack=Math.trunc(n(unit.roundFixAttack??unit.roundAttack??unit.attack));
  unit.roundAttack=releaseFixAttack+Math.trunc(releaseFixAttack*n(charge.attackPct)/100);

  // BATTLE_Charge() 把 command 轉成 CHARGE_OK；進 common direct-attack case 後，
  // battle.c 在第一個 BATTLE_Attack 前又把 COM1 清成 NONE。
  // 所以目標可以反擊這次攻擊，但施術者不能在 Counter 鏈中再反反擊。
  unit.counterEligibleThisTurn=false;
  const releaseActor=Object.assign({},actor,{
    targetKind:charge.targetKind,
    targetPetId:charge.targetPetId
  });
  addLog(unit.name+' 釋放 '+charge.label+'（攻擊 +'+charge.attackPct+'%）。');

  // CHARGE_OK 仍使用本釋放回合已經 prime 的 AttackNum / TargetListSet lifecycle。
  // 非 BOW 需逐段用 raw COM2 重新 TargetAdjust；技能中的 BOOMERANG 不轉特殊 BO command。
  const result=sourceEnemyCommonSkillAttack(
    releaseActor,unit,options,charge.label||'蓄力攻擊'
  )||{};
  unit.chargeState=null;
  return Object.assign({kind:'charge',released:true},result);
}
function battleStealableInventoryKeys(){
  return Object.keys(state.inventory||{}).filter(key=>n(state.inventory[key])>0);
}
function battleInventoryItemLabel(key){
  const id=Number(key);
  const meta=Number.isFinite(id)?questItemMeta(id):null;
  return meta?.name||('Item '+key);
}
function performEnemySteal(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  const label=meta?.n||'偷竊';
  if(!chosen){
    addLog(unit.name+' 使用 '+label+'，但沒有可偷竊的目標。');
    return {kind:'skill',skillId:actor.skillId,success:false,noTarget:true};
  }

  // 原 BATTLE_Steal：只有 CHAR_TYPEPLAYER 的目標 per=50；
  // 寵物／Enemy 目標 per=0，而且判定是嚴格 RAND(1,100) < per。
  if(chosen.kind!=='player'){
    addLog(unit.name+' 對 '+(chosen.pet?.name||'寵物')+' 使用 '+label+'，但原版只允許從玩家身上偷竊。');
    return {kind:'skill',skillId:actor.skillId,success:false,invalidTarget:true};
  }
  if(cRand(1,100)>=50){
    addLog(unit.name+' 使用 '+label+'，但沒有偷到任何東西。');
    return {kind:'skill',skillId:actor.skillId,success:false};
  }

  // 成功後再用嚴格 RAND(1,100) < 50 決定石幣或背包道具。
  if(cRand(1,100)<50){
    const amount=Math.trunc(Math.max(0,n(state.gold))*cRand(8,12)*.01);
    if(amount<=0){
      addLog(unit.name+' 想偷石幣，但你身上沒有可被偷走的石幣。');
      return {kind:'skill',skillId:actor.skillId,success:false,mode:'gold'};
    }
    state.gold=Math.max(0,Math.trunc(n(state.gold))-amount);
    addLog(unit.name+' 從你身上偷走 '+amount+' 石幣。','bad');
    return {kind:'skill',skillId:actor.skillId,success:true,mode:'gold',amount};
  }

  const keys=battleStealableInventoryKeys();
  if(!keys.length){
    addLog(unit.name+' 想偷道具，但你的背包沒有可偷取的道具。');
    return {kind:'skill',skillId:actor.skillId,success:false,mode:'item'};
  }
  const key=keys[cRand(0,keys.length-1)];
  const itemName=battleInventoryItemLabel(key);
  consumeItem(key,1);
  // 原 Enemy 使用 BATTLE_Steal 時不會把物品放進 Enemy 背包；被偷的物品直接從玩家持有物移除。
  addLog(unit.name+' 從你的背包偷走 '+itemName+'。','bad');
  return {kind:'skill',skillId:actor.skillId,success:true,mode:'item',itemId:Number(key)};
}
function enemyBattleModelSpec(meta){
  const p=String(meta?.o||'').split('|');
  const type=Math.max(0,Math.trunc(Number(p[0])||0));
  const objectNum=clamp(Math.trunc(Number(p[1])||0)||1,1,10);
  const statusToken=p[2]||'';
  const statusType=statusToken.includes('石')?'stone':(statusToken.includes('障')?'barrier':null);
  const turns=Math.max(0,Math.trunc(Number(p[3])||0));
  const effectHit=Math.max(0,Math.trunc(Number(p[4])||0));
  return {type,objectNum,statusType,turns,effectHit,physical:(type&4)!==0,coverAll:(type&1)!==0};
}
function performEnemyBattleModel(actor,unit,options,meta){
  const spec=enemyBattleModelSpec(meta);
  const label=meta?.n||'BattleModel';
  const initial=enemyPlayerSideLivingTargets();
  if(!initial.length)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  if(!spec.physical){
    addLog(unit.name+' 使用 '+label+'，但目前這筆 BattleModel 不是物理 type；未以猜測傷害替代。');
    return {kind:'skill',skillId:actor.skillId,unsupportedType:spec.type};
  }

  // fixed BATTLE_BattleModel() does NOT pre-roll the extra random targets.
  // It first attacks every target from the original iToList, then for each remaining
  // AttackObject performs RAND(0,i0-1) immediately before that object's attack.
  // Keep random slots as placeholders so target RNG stays interleaved with AttackSeq RNG.
  const sequence=[];
  if(spec.objectNum>=initial.length){
    for(const t of initial)sequence.push({target:t,random:false});
    while(sequence.length<spec.objectNum)sequence.push({target:null,random:true});
  }else{
    for(let i=0;i<spec.objectNum&&i<initial.length;i++)sequence.push({target:initial[i],random:false});
    if(spec.coverAll){
      for(let i=spec.objectNum;i<initial.length;i++)sequence.push({target:initial[i],random:false});
    }
  }

  addLog(unit.name+' 使用 '+label+'：'+sequence.length+' 個物理攻擊物件'+(spec.statusType?'，每擊可附加'+BATTLE_STATUS_NAMES[spec.statusType]:'')+'。');
  const results=[];
  let playerGuardingActive=!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
  for(let i=0;i<sequence.length;i++){
    const step=sequence[i];
    let randomTargetRoll=null;
    let target=step.target;
    if(step.random){
      randomTargetRoll=cRand(0,initial.length-1);
      target=initial[randomTargetRoll];
    }
    if(!target){
      results.push({target:null,noTarget:true,randomTargetRoll});
      continue;
    }
    if(!battleStatusDescAlive(target)){
      results.push({target:target.kind,petId:target.petId||target.pet?.id||null,skippedDead:true,randomTargetRoll});
      continue;
    }
    let r;
    if(target.kind==='pet'&&target.pet){
      r=enemyAttackPetResult(unit,target.pet);
    }else{
      r=resolveEnemyDirectAttackToPlayer(unit,{guarding:playerGuardingActive});
    }
    const actualTarget=enemyApplyDirectGuardianSkillHit(
      unit,target,r,label+'分身 '+(i+1)+'/'+sequence.length,
      {finalizeItemCrush:false}
    );

    // fixed BATTLE_BattleModel_ATTACK:
    // death / alive branches are mutually exclusive. Only the alive branch calls
    // BATTLE_ItemCrushSeq, and it does so even for DODGE / MISS / zero damage.
    // This must happen before the optional status check.
    const itemCrushRoll=sourceBattleModelAliveItemCrushRng(r,actualTarget);

    let status=null;
    // physical type 先把 iDefindex 換成 Guardian；後續 ItemCrush / StatusTbl
    // 全部使用真正 iDefindex。普通 BATTLE_StatusAttackCheck 仍是 existing-status
    // early return first，不沿用 REGRET 的 PROFESSION status RNG 規則。
    if(spec.statusType&&r.damage>0&&battleStatusDescAlive(actualTarget)){
      const check=battleStatusChance(
        {kind:'enemy',unit,unitId:unit.id},actualTarget,spec.statusType,
        {perOffset:spec.effectHit,range:30,bai:1,forceGeneral:true}
      );
      if(check.allowed&&check.success&&battleStatusApplyRaw(actualTarget,spec.statusType,spec.turns)){
        status={applied:true,type:spec.statusType,per:check.per,turns:spec.turns};
        // 只有真正被狀態命中的 Player 才會失去本輪 GUARD；
        // 若忠犬代擋後石化/魔障落在 Pet，主人 GUARD 仍保留。
        if(actualTarget.kind==='player'&&(spec.statusType==='stone'||spec.statusType==='barrier'))playerGuardingActive=false;
        addLog(battleStatusDescName(actualTarget)+' 陷入'+BATTLE_STATUS_NAMES[spec.statusType]+'（BattleModel 原檢定 '+check.per.toFixed(1)+'%）。','bad');
      }else{
        status={applied:false,type:spec.statusType,per:check.per,reason:check.reason||'roll'};
      }
    }
    results.push({
      target:target.kind,
      actualTarget:actualTarget?.kind||target.kind,
      guardianPetId:r?.guardianPetId||null,
      randomTargetRoll,itemCrushRoll,r,status
    });
  }

  // 原 BATTLE_COM_S_BATTLE_MODEL 直接呼叫 BATTLE_BattleModel() 後 break；每個 AttackObject
  // 雖各自跑 AttackSeq / DamageSub，但整個 command 不進 battle.c 的普通 Counter loop。
  return {kind:'skill',skillId:actor.skillId,spec,results};
}
function sourcePlayerPetHidden(pet){return !!pet&&battlePetHiddenIds.has(pet.id)}
function sourceRevealPetForDirectAttack(pet,reason=null){
  if(!pet||!battlePetHiddenIds.has(pet.id))return false;
  battlePetHiddenIds.delete(pet.id);
  if(reason)addLog(pet.name+' '+reason+'，重新現身。','pet');
  return true;
}
function sourcePetEarthRoundCommandActive(pet){
  const st=pet?battlePetEarthRoundStates.get(pet.id):null;
  return !!(st&&!st.interrupted);
}
function sourcePetEarthRoundTargetDesc(pet){
  const st=pet?battlePetEarthRoundStates.get(pet.id):null;
  if(!st)return null;
  const unit=Array.isArray(enemy?.units)?enemy.units.find(u=>u.id===st.targetUnitId):null;
  return {kind:'enemy',unit:unit||null,unitId:st.targetUnitId||null};
}
function sourceInterruptPetEarthRound(pet,reason=null){
  const st=pet?battlePetEarthRoundStates.get(pet.id):null;
  if(!st||st.interrupted)return st||null;
  st.interrupted=true;
  if(reason)addLog(pet.name+' 的地球一周 command 被'+reason+'覆寫；隱身旗標會保留到真正直接攻擊重新設回。','pet');
  return st;
}
function sourceFinishPetEarthRoundOverride(pet,result){
  const st=pet?battlePetEarthRoundStates.get(pet.id):null;
  if(st?.interrupted)battlePetEarthRoundStates.delete(pet.id);
  return result;
}
function sourceCancelPetEarthRoundFromStatus(statusTurn){
  if(statusTurn?.desc?.kind!=='pet'||!statusTurn.desc.pet)return false;
  const pet=statusTurn.desc.pet;
  if(!battlePetEarthRoundStates.has(pet.id))return false;
  battlePetEarthRoundStates.delete(pet.id);
  return true;
}
function enemyPlayerSideLivingTargets(){
  const list=[];
  if(state.hp>0)list.push({kind:'player'});
  const pet=activePet();
  if(pet&&petIsBattleActive(pet)&&!sourcePlayerPetHidden(pet))list.push({kind:'pet',pet,petId:pet.id});
  return list;
}
function enemySkillTargetResult(unit,chosen,options={},attackerOverride=null){
  const attacker=Object.assign({},enemyBattleView(unit),attackerOverride||{});
  if(chosen?.kind==='pet'&&chosen.pet&&petIsBattleActive(chosen.pet)){
    const guardCommand=sourcePlayerPetGuardCommand(chosen.pet);
    const guarding=sourcePlayerPetGuardAdjust(chosen.pet);
    const r=resolveNormalAttack(attacker,petBattleView(chosen.pet),Object.assign({},options,{
      guarding,
      disableDodge:!!options.disableDodge||guardCommand
    }));
    r.sourcePetGuardCommand=guardCommand;
    r.sourcePetGuardAdjust=guarding;
    return r;
  }
  if(chosen?.kind==='player'&&state.hp>0){
    const guarding=Object.prototype.hasOwnProperty.call(options,'guarding')
      ?!!options.guarding
      :false;
    if(options.sourceDirectGuardian){
      const directOptions=Object.assign({},options,{guarding});
      delete directOptions.sourceDirectGuardian;
      return resolveEnemyDirectAttackToPlayer(unit,directOptions,attackerOverride);
    }
    return resolveNormalAttack(attacker,playerBattleView(),Object.assign({},options,{guarding}));
  }
  return null;
}
function resolveEnemyAttackSeqBugToPlayer(unit,options={},attackerOverride=null){
  const attacker=Object.assign({},enemyBattleView(unit),attackerOverride||{});
  const original=playerBattleView();
  const guarding=Object.prototype.hasOwnProperty.call(options,'guarding')?!!options.guarding:false;
  const dodge=sourceInitialDodgeOnly(attacker,original,Object.assign({},options,{guarding}));
  if(dodge.dodged){
    dodge.originalTargetDesc={kind:'player'};
    dodge.actualTargetDesc={kind:'player'};
    return dodge;
  }

  const guardian=attacker?.throwWeapon?null:sourcePlayerGuardianPetForAttack(unit);
  const calcDefender=guardian?petBattleView(guardian):original;

  // fixed BATTLE_S_AttackDamage bug:
  // BATTLE_AttackSeq() local defindex changes to Guardian for critical/damage/guard,
  // but caller defindex is never updated, so DamageSub still hits the original Player.
  const r=resolveNormalAttack(attacker,calcDefender,Object.assign({},options,{
    guarding:guardian?false:guarding,
    disableDodge:true
  }));
  r.duckRaw=dodge.duckRaw;
  r.originalTargetDesc={kind:'player'};
  r.actualTargetDesc={kind:'player'};

  if(guardian){
    if(r.damage<=0){r.damage=1;r.miss=false}
    r.guardianCalcOnly=guardian;
    r.guardianPetId=guardian.id;
    r.guardianSourceBug=String(options.guardianSourceBug||'BATTLE_S_AttackDamage-defindex-not-updated');
  }
  return r;
}
function resolveEnemyGuardBreak2BugToPlayer(unit,originalGuarding){
  const attacker=enemyBattleView(unit);
  const original=playerBattleView();
  const dodge=sourceInitialDodgeOnly(attacker,original,{guarding:!!originalGuarding});
  if(dodge.dodged){
    dodge.originalTargetDesc={kind:'player'};
    dodge.actualTargetDesc={kind:'player'};
    dodge.guardBreak2Multiplier=originalGuarding?1.3:.7;
    return dodge;
  }
  const guardian=attacker?.throwWeapon?null:sourcePlayerGuardianPetForAttack(unit);
  const calcDefender=guardian?petBattleView(guardian):original;
  const localGuarding=guardian?false:!!originalGuarding;
  const multiplier=localGuarding?1.3:.7;
  const r=resolveNormalAttack(attacker,calcDefender,{
    guarding:false,disableDodge:true,preGuardDamageMultiplier:multiplier
  });
  r.duckRaw=dodge.duckRaw;
  r.originalTargetDesc={kind:'player'};
  r.actualTargetDesc={kind:'player'};
  r.guardBreak2Multiplier=multiplier;
  r.guardBreak2LocalGuarding=localGuarding;
  if(guardian){
    if(r.damage<=0){r.damage=1;r.miss=false}
    r.guardianCalcOnly=guardian;
    r.guardianPetId=guardian.id;
    r.guardianSourceBug='BATTLE_S_GBreak2-defindex-not-updated';
  }
  return r;
}

function enemyAttackSeqBugTargetResult(unit,chosen,options={},attackerOverride=null){
  const attacker=Object.assign({},enemyBattleView(unit),attackerOverride||{});
  if(chosen?.kind==='pet'&&chosen.pet&&petIsBattleActive(chosen.pet)){
    // Owner Guardian 不會重導本來就指向 Pet 的攻擊；但 Pet 自己的 COM_GUARD 仍參與 AttackSeq。
    const guardCommand=sourcePlayerPetGuardCommand(chosen.pet);
    const guarding=sourcePlayerPetGuardAdjust(chosen.pet);
    const r=resolveNormalAttack(attacker,petBattleView(chosen.pet),Object.assign({},options,{
      guarding,
      disableDodge:!!options.disableDodge||guardCommand
    }));
    r.sourcePetGuardCommand=guardCommand;
    r.sourcePetGuardAdjust=guarding;
    r.ultimateCriticalEnemyOnly=true;
    return r;
  }
  if(chosen?.kind==='player'&&state.hp>0){
    const r=resolveEnemyAttackSeqBugToPlayer(unit,options,attackerOverride);
    if(r)r.ultimateCriticalEnemyOnly=true;
    return r;
  }
  return null;
}
function enemySkillAttrSpec(meta){
  const p=String(meta?.o||'').split('|');
  const code=String(p[0]||'').trim().toUpperCase();
  const amount=Number(p[1]);
  const key=code==='EA'?'earth':(code==='WA'?'water':(code==='FI'?'fire':(code==='WI'?'wind':null)));
  return {code,key,amount:Number.isFinite(amount)?amount:0};
}
function performEnemyModifyAttack(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  const spec=enemySkillAttrSpec(meta);
  const guarding=chosen.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
  const r=enemyAttackSeqBugTargetResult(unit,chosen,{guarding});
  if(!r)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  let attr=0,bonusRoll=0,bonusStep=0,bonus=0;
  if(r.damage>0&&spec.key){
    const targetDesc=chosen.kind==='pet'
      ?{kind:'pet',pet:chosen.pet,petId:chosen.pet?.id}
      :{kind:'player'};
    // fixed BATTLE_S_Modifyattack reads CHAR_EARTHAT/WATERAT/FIREAT/WINDAT,
    // not WORKFIX*; attribute reversal only changes the battle FIX snapshot and must not alter ModNum.
    const targetElements=battleBaseElements(targetDesc);
    attr=Math.max(0,Math.trunc(n(targetElements?.[spec.key])));
    if(attr>0){
      // Source bug must be preserved exactly:
      //   (float)((rand() % (ModNum+5)) / 100)
      // The division happens as C integer division before the float cast.
      // For ModNum <= 95 this random term is always 0; at very high attributes it jumps by whole 1.0 steps.
      bonusRoll=cRand(0,attr+4);
      bonusStep=Math.trunc(bonusRoll/100);
      const factor=n(spec.amount)/100+bonusStep;
      const before=Math.trunc(n(r.damage));
      r.damage=Math.trunc(before+before*factor);
      bonus=r.damage-before;
    }
  }

  enemyApplySkillHit(unit,chosen,r,meta?.n||'屬性強化攻擊');
  sourceBattleFinalizeItemCrushRng(r);
  return {kind:'skill',skillId:actor.skillId,target:chosen.kind,r,spec,targetAttr:attr,bonusRoll,bonusStep,bonus};
}
function performEnemyMdfyAttack(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  const spec=enemySkillAttrSpec(meta);
  const elements={earth:0,water:0,fire:0,wind:0};
  if(spec.key)elements[spec.key]=spec.amount;
  const guarding=chosen.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');

  // 原 BATTLE_AttrAdjust 在 command=MDFYATTACK 時，先把攻方四屬清 0，
  // 再只寫入 option 指定屬性與數值；只影響本次攻擊。
  const r=enemyAttackSeqBugTargetResult(unit,chosen,{guarding},{elements});
  if(!r)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  enemyApplySkillHit(unit,chosen,r,meta?.n||'屬性轉換攻擊');
  sourceBattleFinalizeItemCrushRng(r);
  return {kind:'skill',skillId:actor.skillId,target:chosen.kind,r,spec};
}
function performEnemySonic(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  const label=meta?.n||'音波衝擊';
  const results=[];

  const firstGuarding=chosen.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
  const first=enemyAttackSeqBugTargetResult(unit,chosen,{guarding:firstGuarding});
  if(first){
    enemyApplySkillHit(unit,chosen,first,label);
    sourceBattleFinalizeItemCrushRng(first);
    results.push({target:chosen.kind,r:first});
  }

  // 原 battle.c 只有目標是 5..9 / 15..19 的寵物格時才 defNo-5 貫穿主人；
  // SONIC2 在 AttackSeq 內先把傷害 ×0.5，之後才做 GuardAdjust。
  if(chosen.kind==='pet'&&state.hp>0){
    const owner={kind:'player'};
    const guarding=!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
    const second=enemyAttackSeqBugTargetResult(unit,owner,{guarding,preGuardDamageMultiplier:.5});
    if(second){
      enemyApplySkillHit(unit,owner,second,label+'貫穿');
      sourceBattleFinalizeItemCrushRng(second);
      results.push({target:'player',r:second,through:true});
    }
  }
  return {kind:'skill',skillId:actor.skillId,results};
}
function performEnemyGyrate(actor,unit,options,meta){
  // GYRATE derives its five-slot row directly from raw COM2 and then TargetChecks that row.
  const chosen=enemyActorCommandTarget(actor);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  const attackPct=enemySignedSkillPercent(meta?.o,'攻%');
  // 攻擊修正已在 enemyPrepareRoundAction() 依當輪 FIXSTR 套好。
  const attack=Math.trunc(n(unit.roundAttack??unit.roundFixAttack??unit.attack));
  const label=meta?.n||'回旋攻擊';

  // 原版玩家在 0..4、寵物在 5..9；Gyrate 只掃目標所在的五格橫排。
  // 目前單機 battle side 只有一名 Player + 一隻 Active Pet，因此每排最多一個可打單位。
  const targets=enemyPlayerSideLivingTargets().filter(t=>t.kind===chosen.kind);
  const results=[];
  addLog(unit.name+' 使用 '+label+'（攻 '+(attackPct>=0?'+':'')+attackPct+'%，攻擊目標所在一排）。');
  for(const target of targets){
    const guarding=target.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
    const r=enemySkillTargetResult(unit,target,{guarding,sourceDirectGuardian:true},{attack});
    if(!r)continue;
    let actualTarget=target;
    if(target.kind==='player'){
      actualTarget=enemyApplyDirectGuardianSkillHit(unit,target,r,label);
    }else{
      enemyApplySkillHit(unit,target,r,label);
      sourceBattleFinalizeItemCrushRng(r);
    }
    results.push({target:target.kind,actualTarget:actualTarget?.kind||target.kind,guardianPetId:r?.guardianPetId||null,r});
  }
  return {kind:'skill',skillId:actor.skillId,attackPct,results};
}
function sourceEnemyRetraceApplyHit(unit,target,options,label){
  if(!target)return null;
  const guarding=target.kind==='player'
    &&!!options.playerGuarding
    &&!battleStatusActive({kind:'player'},'confusion');

  const r=enemySkillTargetResult(
    unit,target,
    {guarding,sourceDirectGuardian:true}
  );
  if(!r)return null;

  let targetDesc;
  if(target.kind==='player'){
    targetDesc=enemyApplyDirectGuardianSkillHit(
      unit,target,r,label,{finalizeItemCrush:false}
    );
  }else{
    enemyApplySkillHit(unit,target,r,label);
    targetDesc={kind:'pet',pet:target.pet,petId:target.pet?.id};
  }

  // BREAKTHROW's global paralysis status is already active before the common command switch.
  // Every BATTLE_Attack call -- including RETRACE's optional second call -- gets its own
  // damage>0 status check before ItemCrush.
  let paralysis=null;
  if(Math.trunc(n(unit?.weaponType))===19){
    paralysis=sourceBreakthrowParalysis(unit,{targetDesc,r});
  }

  // fixed BATTLE_Attack order finishes status first, then ItemCrush, then returns to battle.c.
  sourceBattleFinalizeItemCrushRng(r);
  return {target:target.kind,pet:target.pet||null,targetDesc,r,paralysis};
}
function sourceEnemyRetraceMaybeFollow(unit,target,options,label,primary){
  if(!primary?.r?.dodged)return {roll:null,follow:null,boosted:false};

  // fixed code checks Battle_Attack_ReturnData immediately after the first BATTLE_Attack.
  // DODGE therefore consumes RAND(1,100) even though the first hit dealt no damage.
  const roll=cRand(1,100);
  if(roll>=80)return {roll,follow:null,boosted:false};

  // Source hard-codes FIXSTR +20%; PETSKILL_Retrace's option parser is commented out.
  // This writes WORKATTACKPOWER and is NOT restored inside the common loop, so later
  // weapon segments in the same command keep the +20% attack after the first successful retrace.
  const baseAttack=Math.trunc(n(unit.roundFixAttack??unit.attack));
  unit.roundAttack=baseAttack+Math.trunc(baseAttack*.2);

  const follow=sourceEnemyRetraceApplyHit(unit,target,options,label+'追擊');
  return {roll,follow,boosted:true,boostedAttack:unit.roundAttack};
}
function performEnemyRetrace(actor,unit,options,meta){
  const label=meta?.n||'追跡攻擊';
  const weaponType=Math.trunc(n(unit?.weaponType));
  const primedMax=Number(actor?.sourceAttackMax);
  const attackMax=Number.isFinite(primedMax)&&primedMax>0
    ?Math.trunc(primedMax)
    :sourceEnemyBattleAttackMax(unit);

  unit.counterEligibleThisTurn=true;

  // fixed BATTLE_TargetListSet happens before RETRACE enters the common direct-attack loop.
  // Only BOW builds a 10-slot aBowW list; every non-BOW weapon repeats raw COM2 and reruns
  // BATTLE_TargetAdjust after each completed primary segment.
  const bowPlan=weaponType===4?sourceBowTargetList(actor,unit,enemyActorCommandTarget(actor)):null;
  const segments=[];
  let primaryCount=0;
  let lastPrimary=null;
  let lastTarget=null;
  let sourceCounterReady=false;
  let sourceLoopExit='no-target';

  if(weaponType===4){
    // Source first scans the list only to decide whether NoAction is needed, then resets
    // defNo to aDefList[0]. Iterating from slot 0 while TargetCheck-skipping invalid slots
    // is equivalent and consumes no extra RNG.
    for(const slot of bowPlan?.slots||[]){
      if(slot<0){
        sourceLoopExit='target-list-end';
        break;
      }
      const target=sourceEnemyTargetableFromBattleSlot(slot);
      if(!target)continue;

      const primary=sourceEnemyRetraceApplyHit(
        unit,target,options,label+'第 '+(primaryCount+1)+'/'+attackMax+' 段首擊'
      );
      if(!primary)continue;
      primaryCount++;
      lastPrimary=primary;
      lastTarget=target;

      const retry=sourceEnemyRetraceMaybeFollow(unit,target,options,label+'第 '+primaryCount+'/'+attackMax+' 段',primary);
      sourceProcessBattleDeathsAtAddProfit();
      segments.push({
        battleSlot:slot,target:target.kind,petId:target.pet?.id||null,
        primary,retraceRoll:retry.roll,follow:retry.follow,boosted:retry.boosted,
        boostedAttack:retry.boostedAttack??null
      });

      // Source increments attack_count once per primary BATTLE_Attack only; the optional RETRACE
      // second BATTLE_Attack does not consume attack_max.
      if(primaryCount>=attackMax){
        sourceCounterReady=true;
        sourceLoopExit='attack-max';
        break;
      }
      if(n(unit.hp)<=0){
        sourceLoopExit='attacker-dead';
        break;
      }
    }
  }else{
    // First non-BOW segment starts from BATTLE_TargetAdjust(COM2).
    let target=enemyActorTarget(actor,unit);
    while(target&&primaryCount<attackMax&&n(unit.hp)>0){
      const primary=sourceEnemyRetraceApplyHit(
        unit,target,options,label+'第 '+(primaryCount+1)+'/'+attackMax+' 段首擊'
      );
      if(!primary){
        sourceLoopExit='attack-failed';
        break;
      }
      primaryCount++;
      lastPrimary=primary;
      lastTarget=target;

      const retry=sourceEnemyRetraceMaybeFollow(unit,target,options,label+'第 '+primaryCount+'/'+attackMax+' 段',primary);
      sourceProcessBattleDeathsAtAddProfit();
      segments.push({
        battleSlot:sourceEnemyTargetBattleSlot(target),target:target.kind,petId:target.pet?.id||null,
        primary,retraceRoll:retry.roll,follow:retry.follow,boosted:retry.boosted,
        boostedAttack:retry.boostedAttack??null
      });

      if(primaryCount>=attackMax){
        sourceCounterReady=true;
        sourceLoopExit='attack-max';
        break;
      }
      if(n(unit.hp)<=0){
        sourceLoopExit='attacker-dead';
        break;
      }

      // aDefList for non-BOW is raw COM2 repeated. TargetAdjust can therefore consume a fresh
      // DefaultAttacker RNG on every later segment if that raw target died or became hidden.
      target=enemyActorTarget(actor,unit);
      if(!target){
        sourceLoopExit='target-adjust-failed';
        break;
      }
    }
  }

  // Outer Counter uses ContFlg/defNo from the LAST PRIMARY BATTLE_Attack only.
  // A RETRACE follow-up can crit, Guardian-substitute, or kill, but its return value does not
  // overwrite ContFlg. Runtime liveness checks below naturally stop Counter if that follow-up killed.
  if(sourceCounterReady&&lastPrimary&&lastTarget&&unit.hp>0&&enemy){
    const firstResult=lastPrimary.r;
    if(lastTarget.kind==='pet'&&lastTarget.pet&&petIsBattleActive(lastTarget.pet)){
      resolvePetEnemyCounterChain('enemy',lastTarget.pet,unit,firstResult);
    }else if(lastTarget.kind==='player'&&state.hp>0&&options.allowPlayerCounter){
      resolvePlayerEnemyCounterChain('enemy',unit,firstResult);
    }
  }

  return {
    kind:'skill',skillId:actor.skillId,
    weaponType,attackMax,primaryCount,
    bowRandom:bowPlan?.random??null,bowTargetSlots:bowPlan?.slots?.slice?.()||null,
    segments,sourceCounterReady,sourceLoopExit,
    lastPrimary:lastPrimary?.r||null,lastTarget:lastTarget?.kind||null,
    finalRoundAttack:Math.trunc(n(unit.roundAttack??unit.attack))
  };
}
function enemyWideStatusSpec(meta){
  const option=String(meta?.o||'');
  return {
    turns:battleStatusTurnFromOption(option),
    success:Math.max(0,Math.trunc(enemySkillNumber(option,/成\s*([+-]?\d+)/,0)))
  };
}
function enemyStatusSkillTargets(actor,unit,meta){
  if(Math.trunc(n(meta?.target))===3)return enemyPlayerSideLivingTargets();
  const chosen=enemyActorTarget(actor,unit);
  if(chosen?.kind==='pet'&&chosen.pet)return [{kind:'pet',pet:chosen.pet,petId:chosen.pet.id}];
  if(chosen?.kind==='player')return [{kind:'player'}];
  return [];
}
function performEnemyWeaken(actor,unit,options,meta){
  const spec=enemyWideStatusSpec(meta);
  const targets=enemyStatusSkillTargets(actor,unit,meta);
  const attacker={kind:'enemy',unit,unitId:unit.id};
  const results=[];
  addLog(unit.name+' 使用 '+(meta?.n||'虛弱')+'。');
  for(const target of targets){
    const check=battleStatusChance(attacker,target,'weaken',{perOffset:spec.success,range:30,bai:1,forceGeneral:true});
    const applied=check.allowed&&check.success&&battleStatusApply(target,'weaken',spec.turns);
    if(applied)addLog(battleStatusDescName(target)+' 陷入虛弱；自下一次 PreCommandSeq 起攻／防／敏下降 20%（原檢定 '+check.per.toFixed(1)+'%）。','bad');
    else if(check.reason==='existing')addLog((meta?.n||'虛弱')+' 對 '+battleStatusDescName(target)+' 未生效：目標已有其他異常狀態。');
    else addLog((meta?.n||'虛弱')+' 對 '+battleStatusDescName(target)+' 未成功（原檢定 '+n(check.per).toFixed(1)+'%）。');
    results.push({target:target.kind,petId:target.petId||null,applied,per:check.per});
  }
  return {kind:'skill',skillId:actor.skillId,spec,results};
}
function performEnemyDeepPoison(actor,unit,options,meta){
  const spec=enemyWideStatusSpec(meta);
  const targets=enemyStatusSkillTargets(actor,unit,meta);
  const attacker={kind:'enemy',unit,unitId:unit.id};
  const results=[];
  addLog(unit.name+' 使用 '+(meta?.n||'劇毒')+'。');
  for(const target of targets){
    const check=battleStatusChance(attacker,target,'deepPoison',{perOffset:spec.success,range:30,bai:1,forceGeneral:true});
    // 原 BATTLE_S_Deeppoison 傳入 turn+2；MultiStatusChange 直接保存該值。
    const applied=check.allowed&&check.success&&battleStatusApplyRaw(target,'deepPoison',spec.turns+2);
    if(applied)addLog(battleStatusDescName(target)+' 陷入劇毒；若持續到第六次狀態行動將倒下（原檢定 '+check.per.toFixed(1)+'%）。','bad');
    else if(check.reason==='existing')addLog((meta?.n||'劇毒')+' 對 '+battleStatusDescName(target)+' 未生效：目標已有其他異常狀態。');
    else addLog((meta?.n||'劇毒')+' 對 '+battleStatusDescName(target)+' 未成功（原檢定 '+n(check.per).toFixed(1)+'%）。');
    results.push({target:target.kind,petId:target.petId||null,applied,per:check.per});
  }
  return {kind:'skill',skillId:actor.skillId,spec,results};
}
function performEnemyMagicStatusChange(actor,unit,options,meta){
  const p=String(meta?.o||'').split('|');
  const status=String(p[0]||'').trim();
  const turns=Math.max(0,Math.trunc(Number(p[1])||0));
  const power=Math.max(0,Math.trunc(Number(p[2])||0));
  const targets=livingEnemyUnits();
  const results=[];

  // 目前正權重 552/565 的 status 都是「鐵壁」且 target=ALLMYSIDE。
  // 原 BATTLE_MultiMagicStatusChange：任一 MagicTbl 狀態已存在時就跳過，不刷新。
  if(!(status==='铁壁'||status==='鐵壁')){
    addLog(unit.name+' 使用 '+(meta?.n||'魔法狀態技')+'，但此 MagicStatus 尚未建模；不猜效果。');
    return {kind:'skill',skillId:actor.skillId,unsupportedStatus:status};
  }

  for(const target of targets){
    if(n(target.superWallTurns)>0){
      results.push({unitId:target.id,applied:false,existing:true});
      continue;
    }
    target.superWallTurns=turns;
    target.superWallPower=power;
    results.push({unitId:target.id,applied:true,turns,power});
  }
  addLog(unit.name+' 使用 '+(meta?.n||'鐵壁')+'：我方全體取得 '+turns+' 回合鐵壁（基準 +'+power+'%，每次受物理傷害另加原 C rand()%20）。','bad');
  return {kind:'skill',skillId:actor.skillId,status:'superWall',turns,power,results};
}
function performEnemySetMagicPet(actor,unit,options,meta){
  const p=String(meta?.o||'').split('|');
  const turns=Math.max(0,Math.trunc(Number(p[0])||0));
  const power=Math.max(0,Math.trunc(Number(p[1])||0));
  const stat=String(p[2]||'').trim().toUpperCase();
  const results=[];

  if(stat!=='TGH'){
    addLog(unit.name+' 使用 '+(meta?.n||'能力強化')+'，但目前正權重資料不是 TGH；不猜其他屬性效果。');
    return {kind:'skill',skillId:actor.skillId,unsupportedStat:stat};
  }

  // 原 PETSKILL_SetMagicPet_Battle：ALLMYSIDE；若 Duck/STR/TGH/DEX 任一 MySkill 已存在則跳過。
  // 本專案目前已建模 Duck 與 TGH，正權重 601 只使用 TGH。
  for(const target of livingEnemyUnits()){
    const busy=n(target.skillDuckTurns)>0||n(target.mySkillTghTurns)>0;
    if(busy){
      results.push({unitId:target.id,applied:false,existing:true});
      continue;
    }
    target.mySkillTghTurns=turns;
    target.mySkillTghPower=power;
    results.push({unitId:target.id,applied:true,turns,power});
  }
  addLog(unit.name+' 使用 '+(meta?.n||'大地鎧甲')+'：可套用的我方成員取得 '+turns+' 回合 TGH +'+power+'%。','bad');
  return {kind:'skill',skillId:actor.skillId,stat:'TGH',turns,power,results};
}
function performEnemySetDuck(actor,unit,options,meta){
  const p=String(meta?.o||'').split('|');
  const turns=Math.max(0,Math.trunc(Number(p[0])||0));
  const power=Math.max(0,Math.trunc(Number(p[1])||0));
  // 原 PETSKILL_SetDuckChange_Battle 只允許對自己使用；已有 CHAR_MYSKILLDUCK 時不刷新。
  if(n(unit.skillDuckTurns)>0){
    addLog(unit.name+' 再次使用 '+(meta?.n||'閃避術')+'，但原版效果尚在時不刷新回合。');
    return {kind:'skill',skillId:actor.skillId,alreadyActive:true,turns:unit.skillDuckTurns,power:unit.skillDuckPower};
  }
  unit.skillDuckTurns=turns;
  unit.skillDuckPower=power;
  addLog(unit.name+' 使用 '+(meta?.n||'閃避術')+'：'+turns+' 回合內先做獨立回避判定（rand()%100 <= '+power+'）。');
  return {kind:'skill',skillId:actor.skillId,turns,power};
}
function enemyBarrierSpec(meta){
  const option=String(meta?.o||'');
  return {
    turns:battleStatusTurnFromOption(option),
    success:Math.max(0,Math.trunc(enemySkillNumber(option,/成\s*([+-]?\d+)/,0)))
  };
}
function performEnemyNocast(actor,unit,options,meta){
  const label=meta?.n||'沉默';
  const turns=battleStatusTurnFromOption(meta?.o);
  const successMatch=String(meta?.o||'').match(/成\s*(\d+)/);
  const success=successMatch?Math.max(0,Math.trunc(Number(successMatch[1])||0)):0;
  const attackerDesc={kind:'enemy',unit,unitId:unit.id};
  const targets=enemyPlayerSideLivingTargets();
  const results=[];

  addLog(unit.name+' 使用 '+label+'：對敵方整側進行沉默檢定；來源只會對非寵物目標寫入狀態。');

  for(const target of targets){
    // 原 C 的 && 順序是先跑 BATTLE_StatusAttackCheck，再判斷 target != PET。
    // 因此即使 Active Pet 最終不會被沉默，仍保留一次狀態檢定路徑。
    const check=battleStatusChance(
      attackerDesc,target,'nocast',
      {perOffset:success,range:30,bai:1,forceGeneral:true}
    );

    let applied=false;
    let excludedPet=false;
    if(target.kind==='pet'){
      excludedPet=true;
      addLog(label+' 對 '+battleStatusDescName(target)+' 不寫入狀態：原 BATTLE_S_Nocast 明確排除 CHAR_TYPEPET。');
    }else if(check.allowed&&check.success){
      // 原 BATTLE_S_Nocast 直接 CHAR_WORKNOCAST = turn，沒有 +1。
      applied=battleStatusApplyRaw(target,'nocast',turns);
      if(applied){
        addLog(battleStatusDescName(target)+' 陷入沉默（原檢定 '+check.per.toFixed(1)+'%，raw turn '+turns+'）。','bad');
      }
    }

    if(!excludedPet&&!applied){
      if(check.reason==='existing'){
        addLog(label+' 對 '+battleStatusDescName(target)+' 未生效：目標已有其他異常狀態。');
      }else{
        addLog(label+' 對 '+battleStatusDescName(target)+' 未成功（原檢定 '+n(check.per).toFixed(1)+'%）。');
      }
    }

    results.push({
      target:target.kind,petId:target.petId||null,
      applied,excludedPet,per:check.per,
      reason:excludedPet?'pet-excluded':(check.reason||(!applied?'roll':null))
    });
  }

  // 沉默本身不造成傷害、不阻止普通行動，也不進 Counter。
  // 現版尚無玩家咒術 command 可被封鎖，但 status 仍會佔用互斥異常槽並正常倒數／可被淨化。
  return {kind:'skill',skillId:actor.skillId,turns,success,results};
}
function performEnemyBarrier(actor,unit,options,meta){
  const spec=enemyBarrierSpec(meta);
  const label=meta?.n||'魔障';
  const targets=enemyPlayerSideLivingTargets();
  const attackerDesc={kind:'enemy',unit,unitId:unit.id};
  const results=[];

  // 原 BATTLE_S_Barrier：BATTLE_MultiList 取敵方整側，逐一呼叫
  // BATTLE_StatusAttackCheck(attacker,target,BARRIER,Success,30,1.0)，成功後寫 turn+1。
  // 這是獨立特殊 command，沒有物理／魔法傷害，也不進普通 Counter loop。
  addLog(unit.name+' 使用 '+label+'：對敵方整側嘗試附加魔障。');
  for(const target of targets){
    const check=battleStatusChance(
      attackerDesc,target,'barrier',
      {perOffset:spec.success,range:30,bai:1,forceGeneral:true}
    );
    const applied=check.allowed&&check.success&&battleStatusApply(target,'barrier',spec.turns);
    if(applied){
      addLog(battleStatusDescName(target)+' 陷入魔障（原檢定 '+check.per.toFixed(1)+'%）。','bad');
    }else if(check.reason==='existing'){
      addLog(label+' 對 '+battleStatusDescName(target)+' 未生效：目標已有其他異常狀態。');
    }else{
      addLog(label+' 對 '+battleStatusDescName(target)+' 未成功（原檢定 '+n(check.per).toFixed(1)+'%）。');
    }
    results.push({target:target.kind,petId:target.petId||null,applied,per:check.per,reason:check.reason||(!applied?'roll':null)});
  }
  return {kind:'skill',skillId:actor.skillId,spec,results};
}
function performEnemyBatFly(actor,unit,options,meta){
  const label=meta?.n||'群蝠四竄';
  const targets=enemyPlayerSideLivingTargets();
  if(!targets.length)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  let drained=0;
  const results=[];
  for(const target of targets){
    const before=battleStatusHp(target);
    if(before<=0)continue;
    // 原 BATTLE_BatFly：未騎乘的每個 Battle Entry 各扣目前 HP 的 10%；
    // HP < 10 時固定扣 1。放置版 Player / Active Pet 是獨立 Entry，所以各自套一次。
    const damage=before<10?1:Math.trunc(before/10);
    battleStatusSetHp(target,before-damage);
    // fixed BATTLE_BatFly directly writes CHAR_HP and never calls BATTLE_DamageWakeUp.
    // Direct drain therefore does not wake SLEEP even though HP was lost.
    drained+=damage;
    results.push({target:target.kind,damage,hp:battleStatusHp(target)});
    addLog(unit.name+' 的'+label+'吸取 '+battleStatusDescName(target)+' '+damage+' HP。','bad');
    if(target.kind==='pet'&&battleStatusHp(target)<=0)addLog(battleStatusDescName(target)+' 倒下了，本場後續回合不再行動。','bad');
  }

  const beforeSelf=n(unit.hp);
  unit.hp=Math.min(Math.max(1,Math.trunc(n(unit.maxHp))),beforeSelf+drained);
  const healed=Math.max(0,unit.hp-beforeSelf);
  addLog(unit.name+' 由 '+label+' 回復 '+healed+' HP'+(healed<drained?'（超出上限部分捨棄）':'')+'。','bad');

  // 原 BATTLE_COM_S_BAT_FLY 直接呼叫 BATTLE_BatFly() 後 break；
  // 無 BATTLE_AttackSeq、無閃避／會心／Guard，也不進普通 Counter loop。
  return {kind:'skill',skillId:actor.skillId,targets:results,drained,healed};
}
function combinedRecoveryRate(target){
  const raw=battleStatusRawStats(target);
  // 原 GetRecoveryRate：PLAYER 為 1 + VITAL*0.00010，其餘為 1 + VITAL*0.00005。
  return 1+n(raw.vital)*(target?.kind==='player'?.00010:.00005);
}
function combinedEnemySideTargets(){
  return livingEnemyUnits().map(unit=>({kind:'enemy',unit,unitId:unit.id}));
}
function performEnemyCombined(actor,unit,options,meta){
  const parts=String(meta?.o||'').split('|');
  if(String(parts[0]||'').trim()!=='综合法')return {kind:'skill',skillId:actor.skillId,unsupportedCombined:true};
  const count=clamp(Math.trunc(Number(parts[1])||0),0,10);
  const ids=parts.slice(2,2+count).map(Number).filter(Number.isFinite);
  if(!ids.length)return {kind:'skill',skillId:actor.skillId,unsupportedCombined:true};
  const pickIndex=cRand(0,ids.length-1);
  const magicId=ids[pickIndex];

  // PETSKILL_Combined 將 COM3 high 固定清成 0。MAGIC_DirectUse 對 Enemy 直接以 itemnum=0 查 ITEM_item[0]；
  // allocator 從 index 2 開始且永不配置 0，所以 ITEM_getInt(...MAGICUSEMP) 固定 -1。
  // 各相關 MAGIC_* 都做 MP -= mp，因此每次 Combined 都讓 Enemy MP +1；Enemy 初始 MP/MAXMP 為 0/0，且此處沒有上限 clamp。
  const mpBefore=Math.trunc(n(unit.mp));
  unit.mp=mpBefore+1;
  const base={kind:'skill',skillId:actor.skillId,magicId,pickIndex,enemyMpBefore:mpBefore,enemyMpAfter:unit.mp,itemIndex:0,mpCost:-1};

  if(magicId===21){
    // 恩惠的精靈 Lv2：BATTLE_MultiRecovery，Power 100，敵方整側；每個目標各自 RAND(90,110) 再乘 GetRecoveryRate。
    const results=[];
    for(const target of enemyPlayerSideLivingTargets()){
      const before=battleStatusHp(target);
      const maxHp=target.kind==='player'?Math.max(0,n(state.maxHp)):Math.max(0,n(target.pet?.maxHp));
      const roll=cRand(90,110);
      const rate=combinedRecoveryRate(target);
      const heal=Math.trunc(roll*rate);
      battleStatusSetHp(target,Math.min(maxHp,before+heal));
      const actual=battleStatusHp(target)-before;
      results.push({target:target.kind,petId:target.petId||null,roll,rate,heal,actual,hpBefore:before,hpAfter:battleStatusHp(target)});
      addLog(unit.name+' 的恩惠精靈 Lv2 回復 '+battleStatusDescName(target)+' '+actual+' HP。',actual>0?'good':'');
    }
    return Object.assign(base,{effect:'recovery',targets:results});
  }

  const statusByMagic={139:'poison',159:'stone',169:'confusion',179:'drunk',189:'sleep'};
  if(statusByMagic[magicId]){
    const type=statusByMagic[magicId],results=[],attacker={kind:'enemy',unit,unitId:unit.id};
    for(const target of enemyPlayerSideLivingTargets()){
      const check=battleStatusChance(attacker,target,type,{perOffset:25,range:30,bai:1,forceGeneral:true});
      let applied=false;
      if(check.allowed&&check.success)applied=battleStatusApplyRaw(target,type,5);
      results.push({target:target.kind,petId:target.petId||null,type,check,applied});
      if(applied)addLog(unit.name+' 的 '+(BATTLE_STATUS_NAMES[type]||type)+'精靈使 '+battleStatusDescName(target)+' 陷入'+(BATTLE_STATUS_NAMES[type]||type)+' 5 回合。','bad');
      else addLog(unit.name+' 的 '+(BATTLE_STATUS_NAMES[type]||type)+'精靈未能使 '+battleStatusDescName(target)+' 中招。');
    }
    return Object.assign(base,{effect:'status',statusType:type,turns:5,successBase:25,targets:results});
  }

  if(magicId===61){
    // 高等淨化精靈 Lv2：status=0 的 MultiStatusRecovery 只解除原 StatusTbl 1..CHAR_WORKCONFUSION 的六種基本異常。
    const basic=new Set(['poison','paralysis','sleep','stone','drunk','confusion']);
    const results=[];
    for(const target of combinedEnemySideTargets()){
      const st=battleStatusGet(target);
      const cleared=!!(st&&basic.has(st.type)&&battleStatusClear(target,st.type));
      results.push({target:'enemy',unitId:target.unitId,status:st?.type||null,cleared});
      if(cleared)addLog(unit.name+' 的高等淨化精靈 Lv2 解除了 '+target.unit.name+' 的'+(BATTLE_STATUS_NAMES[st.type]||st.type)+'。','good');
    }
    return Object.assign(base,{effect:'statusRecovery',targets:results});
  }

  if(magicId===240){
    const target=enemyActorTarget(actor,unit);
    if(!target)return Object.assign(base,{effect:'attReverse',noTarget:true});
    const desc=target.kind==='pet'?{kind:'pet',pet:target.pet,petId:target.petId}:{kind:'player'};
    const toggled=battleToggleAttributeReverse(desc);
    addLog(unit.name+' 的彩虹精靈使 '+battleStatusDescName(desc)+' 的地↔火、水↔風反轉'+(toggled.active?'啟用':'關閉（本回合 FIX 屬性到下輪才重建）')+'。',toggled.active?'bad':'');
    return Object.assign(base,{effect:'attReverse',target:target.kind,petId:target.petId||null,active:toggled.active,elements:toggled.elements});
  }

  if(magicId===230){
    // 調和的精靈會立刻把現有 BattleArray.field_att 清為 NONE；因 NONE 不進 battle.c 的 att_count-- 分支。
    const field=battleSetField('none',30,3);
    addLog(unit.name+' 使用調和的精靈：戰場回復無屬性（原 att_pow 30／att_count 3；NONE 狀態不遞減）。');
    return Object.assign(base,{effect:'fieldAttChange',fieldAttr:'none',power:30,turns:3,field});
  }

  addLog(unit.name+' 的 Combined 抽到 magic '+magicId+'，目前沒有對應的原碼 handler；本回合不猜效果。');
  return Object.assign(base,{unsupportedMagic:true});
}
function performEnemyDivideAttack(actor,unit,options,meta){
  const label=meta?.n||'分身地裂';
  const targets=enemyPlayerSideLivingTargets();
  if(!targets.length)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  // 原 BATTLE_DivideAttack 第一輪只處理 CHAR_TYPEPLAYER 的 MP，且使用 charmp>>1：
  // 扣除 floor(currentMP/2)，所以奇數 MP 會保留 ceil(currentMP/2)。
  const mpBefore=Math.max(0,Math.trunc(n(state.mp)));
  const mpDamage=Math.trunc(mpBefore/2);
  state.mp=Math.max(0,mpBefore-mpDamage);
  if(mpDamage>0)addLog(unit.name+' 的 '+label+' 先削減你 '+mpDamage+' MP（'+mpBefore+' → '+state.mp+'）。','bad');

  const results=[];
  // 原函式第二輪逐一處理敵方 Battle Entry。只有「玩家正在騎寵」才改成人與騎寵各扣 10%。
  // 放置版目前 Player slot 0 與 Active Pet slot 5 是兩個獨立 Entry，沒有騎寵關係，
  // 因此兩者都精準落在「未騎寵」分支：各扣目前 HP 的 20%；HP<5 時固定扣 1。
  for(const target of targets){
    const before=battleStatusHp(target);
    if(before<=0)continue;
    const damage=Math.trunc(before/5)===0?1:Math.trunc(before/5);
    battleStatusSetHp(target,before-damage);
    results.push({target:target.kind,petId:target.petId||null,hpBefore:before,damage,hpAfter:battleStatusHp(target)});
    addLog(unit.name+' 的 '+label+' 對 '+battleStatusDescName(target)+' 造成 '+damage+' 直接 HP 傷害。',battleStatusHp(target)<=0?'bad':'');
    if(target.kind==='pet'&&battleStatusHp(target)<=0)addLog(battleStatusDescName(target)+' 倒下了，本場後續回合不再行動。','bad');
  }

  // 此來源函式沒有 BATTLE_AttackSeq / DamageSub / DamageWakeUp，也不進普通 Counter loop。
  return {kind:'skill',skillId:actor.skillId,mpBefore,mpDamage,mpAfter:Math.max(0,Math.trunc(n(state.mp))),targets:results};
}
function enemyRandomPlayerSideTarget(){
  const candidates=[];
  if(state.hp>0)candidates.push({kind:'player'});
  const pet=activePet();
  if(pet&&petIsBattleActive(pet))candidates.push({kind:'pet',pet,petId:pet.id});
  return candidates.length?candidates[cRand(0,candidates.length-1)]:null;
}
function performEnemyAttackCrazed(actor,unit,options,meta){
  const count=Math.max(1,Math.trunc(Number(String(meta?.o||'').match(/\d+/)?.[0])||3));
  const label=meta?.n||'狂亂暴走';
  const weaponType=Math.trunc(n(unit?.weaponType));
  unit.counterEligibleThisTurn=true;
  addLog(unit.name+' 使用 '+label+'：攻 80%／防 70%，隨機攻擊 '+count+' 次。');

  // fixed BATTLE_TargetListSet(ATTCRAZED) snapshots the living target row and consumes
  // ALL n target RANDs before the first BATTLE_Attack. Do not interleave these rolls
  // with Duck/Critical/Damage/ItemCrush RNG.
  const sourcePool=enemyPlayerSideLivingTargets();
  if(!sourcePool.length)return {kind:'skill',skillId:actor.skillId,hits:0,attackCount:count,noTarget:true};
  const plannedTargets=[];
  const targetRolls=[];
  for(let i=0;i<count;i++){
    const roll=cRand(0,sourcePool.length-1);
    targetRolls.push(roll);
    plannedTargets.push(sourcePool[roll]);
  }

  let lastTarget=null,lastResult=null,hits=0;
  let sourceCounterReady=false;
  for(let i=0;i<count;i++){
    if(!enemy||unit.hp<=0||state.hp<=0)break;

    let target=null;
    if(weaponType===4){
      // BOW explicitly replaces defNo with aDefList[0], so pList[0] is used.
      // Later dead/hidden planned slots are only TargetCheck-skipped; no TargetAdjust fallback.
      const raw=plannedTargets[i];
      if(raw?.kind==='player'&&state.hp>0)target={kind:'player'};
      else if(raw?.kind==='pet'&&raw.pet&&petIsBattleActive(raw.pet)&&!sourcePlayerPetHidden(raw.pet))target=raw;
      else continue;
    }else if(i===0){
      // Source bug/quirk: non-BOW first hit still uses the original COM2 after TargetAdjust.
      // plannedTargets[0] was already rolled above but its value is never used.
      target=enemyActorTarget(actor,unit);
      if(!target)break;
    }else{
      // Later non-BOW segments restore aDefList[i] then run TargetAdjust.
      // If that pre-rolled target died/vanished after an earlier segment, DefaultAttacker
      // is evaluated now and consumes its own fallback target RNG.
      const raw=plannedTargets[i];
      if(raw?.kind==='player'&&state.hp>0)target={kind:'player'};
      else if(raw?.kind==='pet'&&raw.pet&&petIsBattleActive(raw.pet)&&!sourcePlayerPetHidden(raw.pet))target=raw;
      else target=sourceEnemyDefaultAttacker();
      if(!target)break;
    }

    let r;
    if(target.kind==='pet'&&target.pet){
      r=enemyAttackPetResult(unit,target.pet);
      hits++;lastTarget=target;lastResult=r;
      enemyApplySkillHit(unit,target,r,label+'第 '+hits+'/'+count+' 擊');
      sourceBattleFinalizeItemCrushRng(r);
      sourceProcessBattleDeathsAtAddProfit();
    }else{
      const guarding=!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
      r=resolveEnemyDirectAttackToPlayer(unit,{guarding});
      hits++;lastTarget=target;lastResult=r;
      enemyApplyDirectGuardianSkillHit(unit,target,r,label+'第 '+hits+'/'+count+' 擊');
      sourceProcessBattleDeathsAtAddProfit();
    }

    // fixed loop breaks immediately here when ++attack_count reaches attack_max,
    // leaving defNo on the last real attack target for the following Counter loop.
    if(hits>=count){
      sourceCounterReady=true;
      break;
    }
  }

  // If BOW skipped a dead pre-rolled slot (or TargetAdjust ran out) before attack_max,
  // source advances to aDefList[count] == -1 and must not counter a stale last target.
  if(sourceCounterReady&&lastTarget&&lastResult&&unit.hp>0&&enemy){
    if(lastTarget.kind==='pet'&&lastTarget.pet&&petIsBattleActive(lastTarget.pet)){
      resolvePetEnemyCounterChain('enemy',lastTarget.pet,unit,lastResult);
    }else if(lastTarget.kind==='player'&&state.hp>0&&options.allowPlayerCounter&&!options.playerGuarding){
      resolvePlayerEnemyCounterChain('enemy',unit,lastResult);
    }
  }
  return {
    kind:'skill',skillId:actor.skillId,hits,attackCount:count,
    targetRolls,plannedTargets:plannedTargets.map(t=>t?.kind||null),
    sourceCounterReady,lastTarget:lastTarget?.kind||null,lastResult
  };
}
function sourceEnemyAttackShootApplyHit(unit,target,options,count,label){
  if(!target)return null;
  const damageOptions={damageDivisor:count};
  let r=null,actualTarget=target,targetDesc=null;
  if(target.kind==='pet'&&target.pet&&petIsBattleActive(target.pet)){
    r=enemyAttackPetResult(unit,target.pet,damageOptions);
    targetDesc={kind:'pet',pet:target.pet,petId:target.pet.id};
    actualTarget=targetDesc;
    enemyApplySkillHit(unit,target,r,label);
  }else if(target.kind==='player'&&state.hp>0){
    const guarding=!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
    r=resolveEnemyDirectAttackToPlayer(unit,{guarding,damageDivisor:count});
    actualTarget=enemyDirectActualTarget(target,r)||target;
    targetDesc=enemyApplyDirectGuardianSkillHit(unit,target,r,label,{finalizeItemCrush:false})||actualTarget;
  }else return null;

  let paralysis=null;
  if(n(r?.damage)>0&&Math.trunc(n(unit?.weaponType))===19){
    paralysis=sourceBreakthrowParalysis(unit,{targetDesc,r});
  }
  let sleepRoll=null,sleepApplied=false;
  if(n(r?.damage)>0){
    sleepRoll=cRand(1,5);
    if(sleepRoll>4)sleepApplied=sourceAttackShootApplySleep(targetDesc);
  }
  sourceBattleFinalizeItemCrushRng(r);
  sourceProcessBattleDeathsAtAddProfit();
  return {
    target:target.kind,petId:target.pet?.id||null,
    actualTarget:targetDesc?.kind||target.kind,
    actualPetId:targetDesc?.petId||targetDesc?.pet?.id||null,
    guardianPetId:r?.guardianPetId||null,r,paralysis,sleepRoll,sleepApplied
  };
}
function performEnemyAttackShoot(actor,unit,options,meta){
  const primed=Number(actor?.sourceAttackShootCount);
  const parts=String(meta?.o||'').split('|');
  let min=Math.trunc(Number(parts[0])),max=Math.trunc(Number(parts[1]));
  if(!Number.isFinite(min))min=3;
  if(!Number.isFinite(max))max=min;
  if(max<min){const swap=min;min=max;max=swap;}
  const latePrime=!(Number.isFinite(primed)&&primed>0);
  const attackMax=latePrime?cRand(min,max):Math.trunc(primed);
  const label=meta?.n||'栗子連激';
  const weaponType=Math.trunc(n(unit?.weaponType));
  unit.counterEligibleThisTurn=false;
  addLog(unit.name+' 使用 '+label+'（'+attackMax+' 顆；每擊傷害除以 '+attackMax+'）。');

  const sourcePool=enemyPlayerSideLivingTargets();
  if(!sourcePool.length)return {kind:'skill',skillId:actor.skillId,attackMax,hits:0,noTarget:true,latePrime};
  const plannedTargets=[],targetRolls=[];
  for(let i=0;i<attackMax;i++){
    const roll=cRand(0,sourcePool.length-1);
    targetRolls.push(roll);plannedTargets.push(sourcePool[roll]);
  }

  const segments=[];
  let attackCount=0,sourceLoopExit='target-list-end';
  for(let i=0;i<attackMax;i++){
    if(!enemy||n(unit.hp)<=0){sourceLoopExit='attacker-dead';break;}
    if(!enemyPlayerSideLivingTargets().length){sourceLoopExit='battle-side-empty';break;}
    let target=null;
    if(weaponType===4){
      const raw=plannedTargets[i];
      if(sourceEnemyTargetCheck(raw))target=raw;
      else continue;
    }else if(i===0){
      target=enemyActorTarget(actor,unit);
      if(!target){sourceLoopExit='target-adjust-failed';break;}
    }else{
      const raw=plannedTargets[i];
      target=sourceEnemyTargetCheck(raw)?raw:sourceEnemyDefaultAttacker();
      if(!target){sourceLoopExit='target-adjust-failed';break;}
    }
    const hit=sourceEnemyAttackShootApplyHit(unit,target,options,attackMax,label+'第 '+(attackCount+1)+'/'+attackMax+' 擊');
    if(!hit){sourceLoopExit='attack-failed';break;}
    segments.push(hit);attackCount++;
    if(attackCount>=attackMax){sourceLoopExit='attack-max';break;}
    if(n(unit.hp)<=0){sourceLoopExit='attacker-dead';break;}
  }
  return {
    kind:'skill',skillId:actor.skillId,attackMax,attackCount,hits:attackCount,
    min,max,fixAi:actor?.sourceAttackShootFixAi??0,loyaltyBurstEligible:false,latePrime,
    protocol:'BB-w0-forced',weaponType,targetRolls,
    plannedTargets:plannedTargets.map(t=>t?.kind||null),segments,sourceLoopExit,counterBlocked:true
  };
}
function sourceEnemyHectorRawEntryTarget(actor){
  const raw=enemyActorCommandTarget(actor);
  if(!raw)return null;
  if(raw.kind==='pet'&&raw.pet){
    if(battlePetOutIds.has(raw.pet.id))return null;
    // Dead/hidden pets still have a Battle Entry; LostEscape/Abduct/PetOut do not.
    const entries=Array.isArray(enemy?.sourcePlayerSideEntries)?enemy.sourcePlayerSideEntries:null;
    if(entries&&entries.length&&!entries.some(x=>x?.kind==='pet'&&x.petId===raw.pet.id))return null;
  }
  return raw;
}
function sourceEnemyHectorParalysis(actor,unit,label){
  const raw=sourceEnemyHectorRawEntryTarget(actor);
  if(!raw)return {attempted:false,applied:false,reason:'invalid-entry'};

  // PROFESSION_BATTLE_StatusAttackCheck() rolls before checking HP/ISDIE/existing status.
  // It uses strict <60, so the effective success set is 1..59.
  const roll=cRand(1,100);
  const desc=enemySkillTargetDesc(raw);
  if(!desc||!battleStatusDescAlive(desc)){
    return {attempted:true,applied:false,roll,successPct:60,reason:'dead'};
  }
  if(battleHasAnyStatus(desc)){
    return {attempted:true,applied:false,roll,successPct:60,reason:'existing-status'};
  }
  if(roll>=60){
    return {attempted:true,applied:false,roll,successPct:60,reason:'roll'};
  }

  // Source writes WORKPARALYSIS=1 directly. Do not clear the target command now:
  // an EarthRound-hidden raw COM2 must remain hidden for the immediately following TargetAdjust.
  const key=battleStatusKey(desc);
  if(!key)return {attempted:true,applied:false,roll,successPct:60,reason:'no-status-key'};
  battleStatuses.set(key,{type:'paralysis',turns:1,sourceHector:true});
  addLog(battleStatusDescName(desc)+' 被 '+label+' 威嚇成功，陷入麻痺 1 回合（roll '+roll+' < 60）。','bad');
  return {attempted:true,applied:true,roll,successPct:60,target:desc.kind,petId:desc.pet?.id||null};
}
function performEnemyHector(actor,unit,options,meta){
  const label=meta?.n||'威嚇攻擊';
  const attackPct=enemySignedSkillPercent(meta?.o,'攻%');
  const quickPct=enemySignedSkillPercent(meta?.o,'敏%');
  const weaponType=Math.trunc(n(unit?.weaponType));
  const rawTarget=enemyActorCommandTarget(actor);

  // BATTLE_TargetListSet runs before the special HECTOR status block. Only BOW consumes RNG here.
  const sourceBowPlan=(weaponType===4&&rawTarget)
    ?sourceBowTargetList(actor,unit,rawTarget)
    :null;
  const paralysis=sourceEnemyHectorParalysis(actor,unit,label);

  addLog(unit.name+' 使用 '+label+'（攻 '+attackPct+'%、敏 '+quickPct+'%；麻痺判定為 RAND(1,100) < 60）。');
  unit.counterEligibleThisTurn=true;

  // BREAKTHROW's earlier PARALYSIS global is overwritten by HECTOR LOW(COM3)=620.
  // BATTLE_ST_END is 44, so general per-hit status processing exits before any RNG.
  const commonOptions=Object.assign({},options,{breakthrowStatus:false});
  if(sourceBowPlan)commonOptions.sourceBowPlan=sourceBowPlan;
  const result=sourceEnemyCommonSkillAttack(actor,unit,commonOptions,label)||{};

  return Object.assign({
    kind:'skill',skillId:actor.skillId,attackPct,quickPct,
    paralysis,sourceCom3Low:620,sourceBattleStatusEnd:44,
    sourceGeneralHitStatusInvalid:true,breakthrowStatusOverridden:true,
    sourceBowPlan:sourceBowPlan?{
      random:sourceBowPlan.random,slots:sourceBowPlan.slots.slice()
    }:null
  },result);
}
function performEnemyAcupuncture(actor,unit,options,meta){
  const label=meta?.n||'針刺外皮';

  // fixed battle.c BATTLE_COM_S_ACUPUNCTURE sets WORKACUPUNCTURE=1 first, then falls through
  // the common physical block. Enemy AI has already supplied result->target to PETSKILL_Use,
  // so meta.target=MYSELF does not replace the AI-selected COM2 here.
  unit.acupunctureActive=true;
  unit.counterEligibleThisTurn=true;
  addLog(unit.name+' 使用 '+label+'：針刺外皮啟動；非投擲物理傷害命中時反彈一半並消耗。');

  const result=sourceEnemyCommonSkillAttack(actor,unit,options,label)||{};
  return Object.assign({
    kind:'skill',skillId:actor.skillId,acupuncture:true,
    sourceWorkAcupuncture:unit.acupunctureActive?1:0
  },result);
}
function performEnemySpeedyAttack(actor,unit,options,meta){
  const defensePct=enemySignedSkillPercent(meta?.o,'防%');
  const label=meta?.n||'疾速攻擊';
  addLog(unit.name+' 使用 '+label+'（防 '+defensePct+'%；排序敏捷由 BATTLE_DexCalc 專用 +30% 規則處理）。');
  unit.counterEligibleThisTurn=true;
  return Object.assign(
    {kind:'skill',skillId:actor.skillId,defensePct,dexMode:'speedy'},
    sourceEnemyCommonSkillAttack(actor,unit,options,label)||{}
  );
}
function enemySkillTargetDesc(chosen){
  if(chosen?.kind==='pet'&&chosen.pet)return {kind:'pet',pet:chosen.pet,petId:chosen.pet.id};
  if(chosen?.kind==='player')return {kind:'player'};
  return null;
}
function enemyTryRegretDizzy(chosen,successPct,label){
  // fixed PROFESSION_BATTLE_StatusAttackCheck() 的第一行就是 RAND(1,100)；
  // HP<=0 / ISDIE / 已有其他異常的 early return 都發生在這顆 RNG 之後。
  // REGRET / REGRET2 的 caller 又會在 damage=0 時保留 skill_type，
  // 所以 miss / dodge / kill / existing-status 都必須先消耗同一顆。
  const roll=cRand(1,100);
  const desc=enemySkillTargetDesc(chosen);
  if(!desc||!battleStatusDescAlive(desc)||battleHasAnyStatus(desc))return false;
  if(roll>=successPct)return false;
  if(!battleStatusApply(desc,'dizzy',0))return false;
  addLog(battleStatusDescName(desc)+' 被 '+label+' 擊暈，下一次行動無法動作。','bad');
  return true;
}
function performEnemyTear(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  const tearPct=Math.max(0,Math.trunc(Number(String(meta?.o||'').match(/-?\d+/)?.[0])||0));
  const targetDesc=enemySkillTargetDesc(chosen);
  const beforeHp=battleStatusHp(targetDesc);
  const maxHp=chosen.kind==='pet'?n(chosen.pet?.maxHp):n(state.maxHp);
  const missingHp=Math.max(0,maxHp-beforeHp);

  const guarding=chosen.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
  const r=enemyAttackSeqBugTargetResult(unit,chosen,{guarding});

  if(!r.dodged){
    const tearBonus=Math.trunc(missingHp*tearPct/100);
    if(tearBonus<=0){
      r.damage=0;r.miss=true;
    }else{
      r.damage=Math.max(0,Math.trunc(n(r.damage)+tearBonus));
      r.miss=r.damage<=0;
      r.tearBonus=tearBonus;
    }
  }
  enemyApplySkillHit(unit,chosen,r,meta?.n||'撕裂傷口2');
  sourceBattleFinalizeItemCrushRng(r);

  // 原 BATTLE_COM_S_PETSKILLTEAR 走 BATTLE_S_AttackDamage 後直接 break，不進普通 Counter loop。
  return {kind:'skill',skillId:actor.skillId,target:chosen.kind,r,tearPct,missingHp};
}
function performEnemyRegret(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  const label=meta?.n||'憾甲一擊';
  const successPct=Math.max(0,enemySkillNumber(meta?.o,/命%([+-]?\d+)/,0));
  const attackOpts={useFixedToughDefense:true};

  function hitOne(target,secondary=false){
    if(!target)return null;
    let r;
    if(target.kind==='pet'&&target.pet&&petIsBattleActive(target.pet)){
      r=enemyAttackPetResult(unit,target.pet,Object.assign({},attackOpts,{
        preGuardDamageMultiplier:secondary?.8:1
      }));
    }else if(target.kind==='player'&&state.hp>0){
      const guarding=!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
      r=resolveEnemyAttackSeqBugToPlayer(unit,Object.assign({},attackOpts,{
        guarding,preGuardDamageMultiplier:secondary?.8:1
      }));
    }else return null;
    r.ultimateCriticalEnemyOnly=true;
    enemyApplySkillHit(unit,target,r,label+(secondary?'貫穿段':''));
  sourceBattleFinalizeItemCrushRng(r);
    const dizzy=enemyTryRegretDizzy(target,successPct,label);
    return {target:target.kind,r,dizzy,secondary};
  }

  const primary=hitOne(chosen,false);
  let secondary=null;
  // 原 battle.c：只有命中 5..9 / 15..19 後排時，才追加同欄前排 defNo-5。
  // 放置版目前每側只具名 Player + Active Pet，因此「選到寵物」對應追加主人。
  if(chosen.kind==='pet'&&state.hp>0)secondary=hitOne({kind:'player'},true);

  // REGRET / REGRET2 都是 BATTLE_S_AttackDamage 特殊分支；原 battle.c 不接普通 Counter loop。
  return {kind:'skill',skillId:actor.skillId,primary,secondary,successPct};
}
function performEnemyWildViolent(actor,unit,options,meta){
  const option=String(meta?.o||'');
  const duckMatch=option.match(/回?避([+-]?\d+)/);
  const duckBonus=duckMatch?Math.max(0,Number(duckMatch[1])||0):0;

  // fixed battle.c：先完成本 actor 的 BATTLE_GetAttackCount lifecycle，
  // 再由 WILDVIOLENT 自己覆寫 attack_max = RAND(3,10)。
  const count=cRand(3,10);
  const label=meta?.n||'狂暴攻擊';
  const weaponType=Math.trunc(n(unit?.weaponType));
  const attackOptions=Object.assign({},options.attackOptions||{},{
    damageDivisor:count,
    duckBonusPercent:duckBonus
  });

  unit.counterEligibleThisTurn=true;
  addLog(unit.name+' 使用 '+label+'：隨機 '+count+' 段，單段傷害 ÷'+count+'，目標回避 +'+duckBonus+'。');

  // WILDVIOLENT is still in battle.c's common direct-attack group.
  // BOW therefore keeps aBowW; BOUND/BREAKTHROW keep the common throw loop.
  // attack_max is the skill's RAND(3,10), not the weapon's primed AttackNum.
  if(weaponType===4||weaponType===18||weaponType===19){
    const seqOptions=Object.assign({},options,{
      attackMaxOverride:count,
      attackOptions
    });
    const seq=weaponType===4
      ?performEnemyBowWeaponAttack(actor,unit,seqOptions)
      :performEnemyThrowWeaponAttack(actor,unit,seqOptions);
    const counter=sourceEnemyFinalizeWeaponSequenceCounter(unit,seq,options);
    return {
      kind:'skill',skillId:actor.skillId,
      hits:seq?.attackCount??seq?.hits?.length??0,
      attackCount:count,duckBonus,lastResult:seq?.r||null,
      weaponSequence:true,sequence:seq,counter
    };
  }

  // BOOMERANG is only converted to the special BOOMERANG command when COM was plain ATTACK.
  // WILDVIOLENT therefore stays in the common loop even while holding a boomerang.
  // For melee/common segments, preserve the source Guardian check on Player targets.
  let chosen=null;
  let lastResult=null,lastChosen=null,hits=0;
  for(let i=0;i<count;i++){
    if(!enemy||unit.hp<=0||state.hp<=0)break;
    // Non-BOW TargetListSet prefilled every entry with the original raw COM2.
    // Source writes that raw slot back and reruns BATTLE_TargetAdjust on EVERY segment;
    // if raw COM2 is invalid, DefaultAttacker therefore consumes a fresh RNG each hit.
    chosen=enemyActorTarget(actor,unit);
    if(!chosen)break;

    let r;
    if(chosen.kind==='pet'&&chosen.pet){
      r=enemyAttackPetResult(unit,chosen.pet,attackOptions);
      hits++;
      lastResult=r;lastChosen=chosen;
      enemyApplySkillHit(unit,chosen,r,label+'第 '+hits+'/'+count+' 段');
      sourceBattleFinalizeItemCrushRng(r);
    }else{
      const guarding=!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
      r=resolveEnemyDirectAttackToPlayer(unit,Object.assign({},attackOptions,{guarding}));
      hits++;
      lastResult=r;lastChosen=chosen;
      enemyApplyDirectGuardianSkillHit(unit,chosen,r,label+'第 '+hits+'/'+count+' 段');
    }

    sourceProcessBattleDeathsAtAddProfit();
    if(state.hp<=0)break;
    if(chosen.kind==='pet'&&chosen.pet&&!petIsBattleActive(chosen.pet))chosen=null;
  }

  // fixed common loop runs Counter only after the full multi-hit sequence, using the last
  // BATTLE_Attack ContFlg / defNo. Guardian / GUARD / critical already suppress via chain helper.
  if(lastResult&&unit.hp>0&&enemy){
    if(lastChosen?.kind==='pet'&&lastChosen.pet&&petIsBattleActive(lastChosen.pet)){
      resolvePetEnemyCounterChain('enemy',lastChosen.pet,unit,lastResult);
    }else if(lastChosen?.kind==='player'&&state.hp>0&&options.allowPlayerCounter){
      resolvePlayerEnemyCounterChain('enemy',unit,lastResult);
    }
  }
  return {kind:'skill',skillId:actor.skillId,hits,attackCount:count,duckBonus,lastResult};
}
function performEnemyGuardBreak2(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  const label=meta?.n||'破除防禦之2';
  const guarding=chosen.kind==='player'
    &&!!options.playerGuarding
    &&!battleStatusActive({kind:'player'},'confusion');
  unit.counterEligibleThisTurn=false;

  let r,multiplier;
  if(chosen.kind==='pet'&&chosen.pet){
    const guardCommand=sourcePlayerPetGuardCommand(chosen.pet);
    multiplier=guardCommand?1.3:.7;
    const attacker=enemyBattleView(unit);
    const defender=petBattleView(chosen.pet);
    if(!guardCommand){
      const dodge=sourceInitialDodgeOnly(attacker,defender,{guarding:false});
      if(dodge.dodged)r=dodge;
    }
    if(!r){
      r=resolveNormalAttack(attacker,defender,{
        guarding:false,disableDodge:true,preGuardDamageMultiplier:multiplier
      });
    }
    r.sourcePetGuardCommand=guardCommand;
    r.guardBreak2Multiplier=multiplier;
  }else{
    r=resolveEnemyGuardBreak2BugToPlayer(unit,guarding);
    multiplier=n(r?.guardBreak2Multiplier)||(guarding?1.3:.7);
  }
  r.ultimateCriticalEnemyOnly=true;
  enemyApplySkillHit(unit,chosen,r,label+'（local defindex 倍率 ×'+multiplier.toFixed(1)+'）');
  sourceBattleFinalizeItemCrushRng(r);
  return {
    kind:'skill',skillId:actor.skillId,target:chosen.kind,r,guarding,
    preGuardDamageMultiplier:multiplier,
    guardianCalcOnly:!!r?.guardianCalcOnly
  };
}
function enemyOptionParts(option){
  return String(option||'').split('|').map(x=>x.trim());
}
function finishPlayerForcedBattleExit(sourceLabel){
  if(!enemy)return {battleEnded:true,playerExited:true};
  addLog('你被'+sourceLabel+'迫使離開戰鬥；本場不計勝利、EXP 或掉落。','bad');
  clearEnemyBattleNoReward();
  save();
  render();
  return {battleEnded:true,playerExited:true,noReward:true};
}
function performEnemyBattleTimid(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  const label=meta?.n||'怯戰';
  const guarding=chosen.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
  const r=enemyAttackSeqBugTargetResult(unit,chosen,{guarding});
  if(!r)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  enemyApplySkillHit(unit,chosen,r,label);
  sourceBattleFinalizeItemCrushRng(r);

  let timidRoll=null,forced=false,playerExited=false;
  if(r.damage>0){
    timidRoll=cRand(0,99);
    // 原 BATTLE_S_AttackDamage：先無條件 rand()%100，再判斷 timid < 15 && damage > 1。
    // 因此 damage == 1 也必須消耗這顆 RNG，只是怯戰效果不能成立。
    if(timidRoll<15&&r.damage>1){
      if(chosen.kind==='pet'&&chosen.pet){
        battlePetOutIds.add(chosen.pet.id);
        forced=true;
        addLog(chosen.pet.name+' 被 '+label+' 嚇退，本場不再出戰。','bad');
      }else if(chosen.kind==='player'&&state.hp>0){
        forced=true;
        playerExited=true;
        finishPlayerForcedBattleExit(unit.name+' 的'+label);
      }
    }
  }

  // BATTLE_COM_S_TIMID 是特殊 BATTLE_S_AttackDamage case，battle.c 直接 break，不進普通 Counter loop。
  return {kind:'skill',skillId:actor.skillId,target:chosen.kind,r,timidRoll,forced,playerExited};
}
function performEnemy2BattleTimid(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  const label=meta?.n||'狂獅怒吼';
  const guarding=chosen.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
  const r=enemyAttackSeqBugTargetResult(unit,chosen,{guarding});
  if(!r)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  enemyApplySkillHit(unit,chosen,r,label);
  sourceBattleFinalizeItemCrushRng(r);

  const timid=Math.max(0,Math.trunc(enemySkillNumber(meta?.o,/命%([0-9.]+)/,0)));
  let timidRoll=null,recalled=false;
  if(r.damage>0){
    timidRoll=cRand(0,99);
    // 原 C 寫成 rand()%100 < timid && damage > 1；依 C 左到右求值，
    // damage == 1 時仍先消耗 RNG，但不會進實際召回分支。
    if(timidRoll<timid&&r.damage>1&&chosen.kind==='pet'&&chosen.pet){
      battlePetOutIds.add(chosen.pet.id);
      recalled=true;
      addLog(chosen.pet.name+' 被 '+label+' 嚇回寵物欄，本場不再出戰。','bad');
    }
  }

  return {kind:'skill',skillId:actor.skillId,target:chosen.kind,r,timid,timidRoll,recalled};
}
function performEnemyMpDamage(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  const label=meta?.n||'MP攻擊';
  const guarding=chosen.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
  const r=enemyAttackSeqBugTargetResult(unit,chosen,{guarding});
  if(!r)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  enemyApplySkillHit(unit,chosen,r,label);
  sourceBattleFinalizeItemCrushRng(r);

  const parts=String(meta?.o||'').split('|');
  const mpPercent=Math.max(0,Math.trunc(Number(parts[1])||0));
  let mpBefore=Math.max(0,Math.trunc(n(state.mp))),mpDamage=0;
  // 原 BATTLE_S_MpDamage：只有 damage>=1、目標為 PLAYER、MP>0 且沒有 DamageReact 才生效。
  // 現版玩家尚無光／鏡／守 DamageReact work-int，因此該來源條件等價為 0。
  if(r.damage>0&&chosen.kind==='player'&&mpBefore>0){
    mpDamage=Math.trunc(mpBefore*mpPercent/100);
    state.mp=Math.max(0,mpBefore-mpDamage);
    if(mpDamage>0)addLog(unit.name+' 的 '+label+' 額外削減 '+mpDamage+' MP（'+mpBefore+' → '+state.mp+'）。','bad');
  }
  return {kind:'skill',skillId:actor.skillId,target:chosen.kind,r,mpPercent,mpBefore,mpDamage,mpAfter:Math.max(0,Math.trunc(n(state.mp)))};
}
function performEnemyToothCrushe(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  const label=meta?.n||'嚙齒術';
  const guarding=chosen.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
  const r=enemyAttackSeqBugTargetResult(unit,chosen,{guarding});
  if(!r)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  enemyApplySkillHit(unit,chosen,r,label);
  sourceBattleFinalizeItemCrushRng(r);

  // fixed BATTLE_S_AttackDamage 先跑通用 BATTLE_ItemCrushSeq；
  // 隨後 TOOTHCRUSHE 本身若目標是 PLAYER，還會再呼叫一次
  // BATTLE_ItemCrushCheck(defindex,1)，函式一進去便先 rand()%100。
  // 即使最後找不到任何裝備，這第二顆 RNG 仍已經消耗。
  let toothCrushCheckRoll=null;
  if(r.damage>0&&chosen.kind==='player'){
    toothCrushCheckRoll=cRand(0,99);
  }

  // 真正耐久改寫仍需要實際裝備的 DAMAGECRUSHE / MAXDAMAGECRUSHE；
  // 現版沒有可靠 runtime，所以只還原可確定的第二次部位選擇 RNG。
  const equipmentCrushReachable=false;
  addLog(unit.name+' 的 '+label+' 沒有可破壞裝備；依目前來源等價狀態只保留本次物理傷害。');

  return {
    kind:'skill',skillId:actor.skillId,target:chosen.kind,r,
    toothCrushCheckRoll,equipmentCrushReachable,crushed:false
  };
}
function sourcePlayerTransmigration(target=state){
  return Math.max(0,Math.trunc(n(target?.transmigration)));
}
function sourcePlayerMaxGold(target=state){
  // fixed char_base.c under _FIX_MAX_GOLD.
  return 1000000+sourcePlayerTransmigration(target)*1800000;
}
function performEnemyStealMoney(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  // 單機 runtime：原 CHAR player pool 從 index 0 開始；本遊戲只有一名玩家，因此她/他就是有效 masterindex 0。
  // Enemy side 是 side 1，battleSlot 0..9 對應原 bid 10..19。
  const attackNo=10+Math.max(0,Math.trunc(n(unit?.battleSlot)));
  const defNo=chosen.kind==='player'?0:(chosen.kind==='pet'?5:0);
  let per=0;
  if(chosen.kind==='player'){
    let safeSide=0;
    // 原 bug：attackNo == 10 不滿足 >10，因此第一格 Enemy 誤把玩家視為同側，per 維持 0。
    if(attackNo>10)safeSide=1;
    const sameSide=defNo>=safeSide*10&&defNo<(safeSide*10+10);
    if(!sameSide){
      const lv=Math.max(1,Math.trunc(n(state.level)));
      per=Math.trunc((Math.trunc((50+lv)/4)+10)/2);
    }
  }

  const roll=cRand(1,100);
  let success=roll<per;
  let goldRoll=null,stolen=0;
  const goldBefore=Math.max(0,Math.trunc(n(state.gold)));
  const maxGold=sourcePlayerMaxGold(state);
  if(success&&chosen.kind==='player'){
    goldRoll=cRand(1,15);
    stolen=Math.trunc(goldBefore*goldRoll*.01);
    // 原碼先以 master slot 0 的目前 GOLD 做持有上限 clamp；單機 master 與被偷玩家是同一人。
    if(goldBefore+stolen>=maxGold)stolen=maxGold-goldBefore;
    if(stolen<=0){stolen=0;success=false;}
  }

  if(success){
    state.gold=Math.max(0,goldBefore-stolen);
    addLog(unit.name+' 的 '+(meta?.n||'捐獻')+' 成功：偷走 '+stolen+' 石幣（'+goldBefore+' → '+state.gold+'），並依原 BATTLE_StealMoney 直接離開戰鬥。','bad');
    const exit=finishEnemyDirectExit(unit,'捐獻成功');
    return {kind:'skill',skillId:actor.skillId,target:chosen.kind,attackNo,defNo,per,roll,goldRoll,stolen,goldBefore,goldAfter:state.gold,success:true,exit};
  }

  addLog(unit.name+' 的 '+(meta?.n||'捐獻')+' 失敗（原成功值 '+per+'，RAND '+roll+'；判定為 RAND < per）。');
  return {kind:'skill',skillId:actor.skillId,target:chosen.kind,attackNo,defNo,per,roll,goldRoll,stolen:0,goldBefore,goldAfter:state.gold,success:false};
}
function performEnemyAttackMagic(actor,unit,options,meta){
  // PETSKILL_Use already fixed raw COM2 during Enemy AI selection.
  // BATTLE_COM_S_ATTACK_MAGIC does not call BATTLE_TargetAdjust.
  const rawChosen=enemyActorCommandTarget(actor);
  const rawToNo=sourceEnemyCommandTargetBattleSlot(actor,null);
  if(rawToNo<0)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  const match=String(meta?.o||'').match(/magic\s+(\d+)/i);
  const magicId=match?Number(match[1]):313;
  const itemMatch=String(meta?.o||'').match(/item\s+(\d+)/i);
  const itemIndex=itemMatch?Number(itemMatch[1]):-1;

  // Enemy 的 MAGIC_DirectUse 直接把 option itemnum 當 global ITEM_item[] existing index。
  // V0.70：ITEM_CHECKINDEX 同時檢查範圍與 use；未配置 slot 回 -1，已配置 slot 則讀該 existing item 從 itemset6 帶入的真實 MAGICUSEMP。
  if(magicId===204||magicId===435){
    const mp=sourceItemRuntimeMagicUseMp(itemIndex);
    const mpBefore=Math.trunc(n(unit.mp));
    if(mp===null){
      const slot=sourceItemRuntimeSlot(itemIndex);
      addLog(unit.name+' 的 '+(meta?.n||('magic '+magicId))+' 讀到 ITEM_item['+itemIndex+'] 已被 Item '+(slot?.itemId??'未知')+' 佔用，但該 existing slot 沒有可由原 itemset6 唯一回填的 Item ID／MAGICUSEMP；本次仍不猜 MP cost，也不套魔法效果。');
      return {kind:'skill',skillId:actor.skillId,magicId,itemIndex,mp:null,mpBefore,mpAfter:mpBefore,sourceItemMpUnknown:true,itemId:slot?.itemId??null};
    }
    if(mpBefore<mp){
      addLog(unit.name+' 的 '+(meta?.n||('magic '+magicId))+' 因 MP 不足失敗（需要 '+mp+'，目前 '+mpBefore+'）。');
      return {kind:'skill',skillId:actor.skillId,magicId,itemIndex,mp,mpBefore,mpAfter:mpBefore,mpFailed:true};
    }
    unit.mp=mpBefore-mp;

    if(magicId===204){
      // TargetIndex has no 204 entry and MAGIC_FieldAttChange ignores toindex:
      // do not consume any TargetAdjust / MultiList retarget RNG.
      const field=battleSetField('water',100,5);
      addLog(unit.name+' 使用水的精靈 Lv5：戰場變為水屬性 Power 100／5 回合；ITEM_item['+itemIndex+'] '+(mp<0?'未配置，原 ITEM_getInt 回 -1，因此 Enemy MP +1。':'MP cost '+mp+'。'),'bad');
      return {kind:'skill',skillId:actor.skillId,magicId,itemIndex,mp,mpBefore,mpAfter:unit.mp,effect:'fieldAttChange',field,rawToNo};
    }

    // magic 435 -> MAGIC_Weaken -> MAGIC_ParamChange_Turn_Battle -> BATTLE_MultiList.
    // It is not currently reachable from the 85-floor encounter set, but this is the same
    // exact raw-COM2 helper used by reachable AttackMagic and avoids a generic TargetAdjust.
    const multi=sourceEnemyAttackMagicMultiList(rawToNo);
    if(!multi.ok){
      addLog(unit.name+' 使用癱瘓的精靈 Lv3，但原 BATTLE_MultiList 找不到可作用目標。');
      return {kind:'skill',skillId:actor.skillId,magicId,itemIndex,mp,mpBefore,mpAfter:unit.mp,effect:'weaken',noTarget:true,rawToNo,multi};
    }
    const target=magicDescForSlot(multi.toNo);
    if(!target)return {kind:'skill',skillId:actor.skillId,magicId,itemIndex,mp,mpBefore,mpAfter:unit.mp,effect:'weaken',noTarget:true,rawToNo,multi};
    const attacker={kind:'enemy',unit,unitId:unit.id};
    const check=battleStatusChance(attacker,target,'weaken',{perOffset:50,range:30,bai:1,forceGeneral:true});
    let applied=false;
    if(check.allowed&&check.success)applied=battleStatusApply(target,'weaken',7); // source 寫 WORKWEAKEN=turn+1=8
    addLog(unit.name+' 使用癱瘓的精靈 Lv3：'+battleStatusDescName(target)+(applied?' 陷入虛弱 7 回合。':' 未中虛弱。')+'（原成功值 '+Number(check.per||0).toFixed(1)+'）',applied?'bad':'');
    return {kind:'skill',skillId:actor.skillId,magicId,itemIndex,mp,mpBefore,mpAfter:unit.mp,effect:'weaken',target:target.kind,petId:target.petId||null,check,applied,turn:7,storedTurn:applied?8:0,rawToNo,multi};
  }

  const magic=attackMagicDb?.byMagicId?.[String(magicId)];
  if(!magic){
    addLog(unit.name+' 使用 '+(meta?.n||'攻擊魔法')+'，但 magic '+magicId+' 尚不在 AttackMagic runtime；本回合不猜魔法效果。');
    return {kind:'skill',skillId:actor.skillId,magicId,unsupportedMagic:true};
  }
  const pattern=attackMagicDb?.byAttIdx?.[String(magic.attIdx)]?.enemySide;
  if(!pattern){
    addLog(unit.name+' 使用 '+magic.name+'，但 attmagic idx '+magic.attIdx+' 缺少原始範圍資料；本回合不猜範圍。');
    return {kind:'skill',skillId:actor.skillId,magicId,missingPattern:true};
  }

  // Source order:
  // raw COM2 -> TargetIndex rewrite -> BATTLE_MultiList -> then the one rand()%100 TrueMagic roll.
  const rewritten=sourceEnemyAttackMagicRewriteToNo(actor,magic);
  const multi=sourceEnemyAttackMagicMultiList(rewritten.toNo);
  if(!multi.ok){
    addLog(unit.name+' 使用 '+magic.name+'，但原 BATTLE_MultiList 找不到可攻擊目標。');
    return {
      kind:'skill',skillId:actor.skillId,magicId,magicName:magic.name,noTarget:true,
      rawToNo:rewritten.rawToNo,rewrittenToNo:rewritten.toNo,adjustedToNo:multi.toNo,multi
    };
  }

  const attMagicLv=Math.trunc(n(unit.level)*.9);
  const trueRoll=cRand(0,99);
  const trueMagic=!(trueRoll>attMagicLv);
  const targets=enemyAttackMagicTargets(multi.toNo,pattern);
  const results=[];

  addLog(unit.name+' 使用 '+magic.name+'（'+magic.attr+'，Power '+magic.power+'，MagicLv '+magic.magicLv+'）。');
  for(const target of targets){
    if(!battleStatusDescAlive(target))continue;
    const r=enemyMagicDamageOne(unit,target,magic,trueMagic);
    results.push({target:target.kind,petId:target.petId||null,r});
    if(r.dodged){
      addLog(battleStatusDescName(target)+' 閃過 '+magic.name+'（魔法閃避 '+r.dodge.roll+' ≤ '+r.dodge.threshold+'）。','good');
    }else{
      addLog(magic.name+' 命中 '+battleStatusDescName(target)+'，造成 '+r.damage+' 魔法傷害'+(trueMagic?'':'（施法判定失敗 ×0.7）')+'。',battleStatusHp(target)<=0?'bad':'');
      if(r.exp?.raised)addLog(battleStatusDescName(target)+' 的'+magic.attr+'魔抗提升到 '+r.exp.level+'。','good');
      if(r.exp?.lowered)addLog(battleStatusDescName(target)+' 的相克魔抗下降到 '+r.exp.subLevel+'。');
    }
  }
  return {
    kind:'skill',skillId:actor.skillId,magicId,magicName:magic.name,
    trueRoll,attMagicLv,trueMagic,targets:results,
    attIdx:magic.attIdx,targetRewrite:magic.targetRewrite,attackType:pattern.attackType,
    rawToNo:rewritten.rawToNo,rewrittenToNo:rewritten.toNo,adjustedToNo:multi.toNo,
    multiFallback:!!multi.fallback,rowFallback:!!multi.rowFallback,multiRolls:(multi.rolls||[]).slice()
  };
}
function enemyDirectActualTarget(chosen,r){
  if(r?.guardian&&chosen?.kind==='player'){
    return {kind:'pet',pet:r.guardian,petId:r.guardian.id};
  }
  return chosen;
}
function enemyApplyDirectGuardianSkillHit(unit,chosen,r,label,options={}){
  const actual=enemyDirectActualTarget(chosen,r);
  if(r?.guardian&&chosen?.kind==='player'){
    addLog(r.guardian.name+' 發動忠犬，代替你承受 '+unit.name+' 的'+label+'。','pet');
  }
  enemyApplySkillHit(unit,actual,r,label);
  if(options.finalizeItemCrush!==false){
    sourceBattleFinalizeItemCrushRng(r);
  }
  return actual;
}

function performEnemyFirekill(actor,unit,options,meta){
  // FIREKILL does not call TargetAdjust: invalid / EarthRound COM2 falls back to the first
  // TargetCheck-valid slot on the same side, with no random draw.
  let chosen=enemyActorCommandTarget(actor);
  if(!sourceEnemyTargetCheck(chosen))chosen=sourceEnemyFirstTargetablePlayerSide();
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  const label=meta?.n||'火線獵殺';
  const guarding=chosen.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');

  // 原 battle.c：先以 FIXSTR*0.8 走 BATTLE_Attack_FIREKILL。
  // BATTLE_Attack_FIREKILL 會在 AttackSeq 後把 defindex 真正換成 Guardian；
  // 但 battle.c 緊接著的 BATTLE_MultiAttMagic_Fire 仍使用原始 defNo。
  let physical;
  if(chosen.kind==='pet'&&chosen.pet){
    physical=enemySkillTargetResult(unit,chosen,{});
  }else{
    physical=resolveEnemyDirectAttackToPlayer(unit,{guarding});
  }
  const physicalActual=physical?enemyApplyDirectGuardianSkillHit(unit,chosen,physical,label+'物理段'):chosen;

  // 隨後固定呼叫 BATTLE_MultiAttMagic_Fire(...,2,200)。該函式 MagicLv 固定 4。
  // 它仍會消耗一次 rand()%100 的 TrueMagic 檢定，但 _FIX_MAGICDAMAGE 下的 ×0.7 行在此專用函式已被註解，
  // 因此 Enemy 使用時這個 roll 不改傷害，只保留原 RNG 次序。
  const magic={attr:'fire',power:200,magicLv:4};
  const attMagicLv=Math.trunc(n(unit.level)*.9);
  const trueRoll=cRand(0,99);
  const trueMagic=!(trueRoll>attMagicLv);
  const target={kind:chosen.kind};
  if(chosen.kind==='pet'){target.pet=chosen.pet;target.petId=chosen.pet?.id||chosen.petId||null;}
  const magicResults=[];

  if(battleStatusDescAlive(target)){
    const r=enemyMagicDamageOne(unit,target,magic,trueMagic,false);
    magicResults.push({target:target.kind,petId:target.petId||null,r});
    if(r.dodged){
      addLog(battleStatusDescName(target)+' 閃過 '+label+' 的火焰追加（魔法閃避 '+r.dodge.roll+' ≤ '+r.dodge.threshold+'）。','good');
    }else{
      addLog(label+' 火焰追加命中 '+battleStatusDescName(target)+'，造成 '+r.damage+' 魔法傷害。',battleStatusHp(target)<=0?'bad':'');
      if(r.exp?.raised)addLog(battleStatusDescName(target)+' 的火魔抗提升到 '+r.exp.level+'。','good');
      if(r.exp?.lowered)addLog(battleStatusDescName(target)+' 的相克魔抗下降到 '+r.exp.subLevel+'。');
    }
  }

  return {
    kind:'skill',skillId:actor.skillId,target:chosen.kind,physical,
    physicalActualTarget:physicalActual?.kind||chosen.kind,
    physicalGuardianPetId:physical?.guardianPetId||null,
    fire:{fieldAttr:2,power:200,magicLv:4,trueRoll,attMagicLv,trueMagic,targets:magicResults}
  };
}
function performEnemyLighttakeed(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  const label=meta?.n||'採光術';
  const guarding=chosen.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');

  // 目前 Player + Active Pet 沒有 WORKDAMAGEVANISH / ABSROB / REFLEC。
  // 因此原 BATTLE_GetDamageReact() 必定回 0，BATTLE_S_AttackDamage 照普通物理傷害結算，
  // LIGHTTAKE 的狀態搬移 switch 也找不到可複製的 Typenum。
  const r=enemyAttackSeqBugTargetResult(unit,chosen,{guarding});
  if(!r)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  enemyApplySkillHit(unit,chosen,r,label);
  sourceBattleFinalizeItemCrushRng(r);
  addLog(unit.name+' 的 '+label+' 沒有找到可吸收的 '+String(meta?.o||'DamageReact')+' 狀態；保留本次物理傷害。');

  return {
    kind:'skill',skillId:actor.skillId,target:chosen.kind,r,
    requestedReact:String(meta?.o||''),reactType:0,absorbed:false
  };
}
function playerPigRemainingSeconds(now=Date.now()){
  const until=Math.max(0,n(state?.playerPigUntilMs));
  if(until<=0)return 0;
  return Math.max(0,Math.ceil((until-now)/1000));
}
function playerPigActive(now=Date.now()){
  if(!state||n(state.playerPigUntilMs)<=0)return false;
  if(n(state.playerPigUntilMs)>now)return true;
  // 原 net.c：倒數至 0 時若仍在 battle，不設回 -1；
  // 而 battle.c 用 >-1 判定，所以戰鬥結束前仍保持黑烏力化。
  if(enemy)return true;
  state.playerPigUntilMs=0;
  return false;
}
function applyPlayerPigDuration(seconds,imageNo){
  const now=Date.now();
  const sec=Math.max(0,Math.trunc(n(seconds)));
  const currentUntil=Math.max(0,n(state.playerPigUntilMs));
  // 原碼第一次 -1 → 180；已有剩餘時間則直接 +180；
  // battle 中已倒數到 0 再命中，也從 0 重新加 180。
  const base=currentUntil>now?currentUntil:now;
  state.playerPigUntilMs=base+sec*1000;
  state.playerPigImage=Math.trunc(n(imageNo)||100388);
  return playerPigRemainingSeconds(now);
}
function sourceCommonPostAttackTarget(result){
  if(!result)return null;
  // Ranged common-loop callers explicitly preserve the final source defNo. null means the loop
  // already loaded an invalid/sentinel defNo before breaking, so post-attack effects must not retarget.
  if(Object.prototype.hasOwnProperty.call(result,'sourcePostTarget'))return result.sourcePostTarget||null;
  if(result.target==='pet'&&result.pet)return {kind:'pet',pet:result.pet,petId:result.pet.id};
  if(result.target==='player')return {kind:'player'};
  return null;
}
function sourceCommonPostAttackTargetAlive(target){
  if(target?.kind==='pet')return !!target.pet&&petIsBattleActive(target.pet);
  if(target?.kind==='player')return state.hp>0;
  return false;
}
function performEnemyBecomePig(actor,unit,options,meta){
  // 原 battle.c：BECOMEPIG 先完成完整 common weapon loop + Counter 鏈，
  // 再用「共用 loop 離開當下的 defNo」與最後一次 primary BATTLE_Attack return-state 判斷後置效果。
  // sourceEnemyCommonSkillAttack 對 BOW／投斧／投石沿用既有 ranged helper；
  // 對近戰／技能中的 BOOMERANG 則走 V1.53 generic non-ranged AttackNum loop。
  const result=sourceEnemyCommonSkillAttack(
    actor,unit,options,meta?.n||'黑烏力化'
  )||{};
  const parts=String(meta?.o||'').trim().split(/\s+/);
  const rate=Math.max(0,Math.trunc(Number(parts[0])||0));
  const seconds=Math.max(0,Math.trunc(Number(parts[1])||0));
  const imageNo=Math.trunc(Number(parts[2])||100388);

  const sourcePostTarget=sourceCommonPostAttackTarget(result);
  const sourceTargetAlive=sourceCommonPostAttackTargetAlive(sourcePostTarget);
  const sourceReturnEligible=!!result.r
    &&!result.r.dodged
    &&!result.r.miss
    &&!result.r.allGuard
    &&!result.r.arranged;

  let roll=null,applied=false,remaining=playerPigRemainingSeconds();
  // Source condition order before rand()%100:
  // MISS/DODGE/ALLGUARD/ARRANGE -> BATTLE_TargetCheck(defNo) -> PLAYER type
  // -> opposite side -> CHAR_BECOMEPIG < 2000000000 -> rand.
  // Enemy-to-player targeting structurally satisfies the opposite-side test here.
  const sourcePigCapEligible=remaining<2000000000;
  const sourceTargetEligible=sourcePostTarget?.kind==='player'&&sourceTargetAlive;
  if(sourceReturnEligible&&sourceTargetEligible&&sourcePigCapEligible){
    roll=cRand(0,99);
    if(roll<rate){
      remaining=applyPlayerPigDuration(seconds,imageNo);
      applied=true;
      addLog(unit.name+' 的 '+(meta?.n||'黑烏力化')+' 成功：你進入黑烏力化 '+remaining+' 秒。現版可用的攻擊／防禦／捕捉均屬原碼允許指令，不額外降低能力。','bad');
    }else{
      addLog(unit.name+' 的 '+(meta?.n||'黑烏力化')+' 未成功（rand()%100='+roll+'，需 < '+rate+'）。');
    }
  }

  return Object.assign({
    kind:'skill',skillId:actor.skillId,rate,seconds,imageNo,roll,applied,
    pigRemainingSeconds:remaining,
    sourcePostTargetKind:sourcePostTarget?.kind||null,
    sourcePostTargetPetId:sourcePostTarget?.petId||sourcePostTarget?.pet?.id||null,
    sourceTargetAlive,sourceReturnEligible,sourcePigCapEligible
  },result);
}
function performEnemyBecomeFox(actor,unit,options,meta){
  // 原 BECOMEFOX 先完成完整 common weapon loop + Counter 鏈，再跑一串 && 後置條件。
  // C 的求值順序把 rand()%100 < 31 放在 target type / PETFLG 檢查之前，
  // 所以效果即使注定因玩家側資料失敗，合格的活著命中仍必須先消耗這顆 RNG。
  // 非遠距現在也使用原 AttackNum／raw COM2 TargetAdjust lifecycle。
  const result=sourceEnemyCommonSkillAttack(
    actor,unit,options,meta?.n||'媚惑術'
  )||{};
  const sourcePostTarget=sourceCommonPostAttackTarget(result);
  const sourceTargetAlive=sourceCommonPostAttackTargetAlive(sourcePostTarget);
  const sourceReturnEligible=!!result.r
    &&!result.r.dodged
    &&!result.r.miss
    &&!result.r.allGuard
    &&!result.r.arranged;
  let foxRoll=null;
  if(sourceReturnEligible&&sourceTargetAlive){
    foxRoll=cRand(0,99);
  }

  // fixed condition order after the roll:
  // 1) final defNo target != PLAYER
  // 2) target WORK_PETFLG != 0
  // 玩家擁有寵物的 WORK_PETFLG 來源初始化為 0；玩家本身又先被 type 條件排除。
  // 因此目前仍沒有可成立的變狐效果，但不能因此省略前面的 rand()%100。
  const sourcePetFlg=0;
  const transformEligible=false;
  addLog(
    unit.name+' 使用 '+(meta?.n||'媚惑術')+'；'
    +(foxRoll==null
      ?'本次攻擊未通過原版變狐後置判定的前置條件，不抽變狐 RNG。'
      :'原版先消耗變狐 rand()%100='+foxRoll+'，但玩家側仍因 target type／PETFLG 條件不成立而不變狐。')
  );
  return Object.assign({
    kind:'skill',skillId:actor.skillId,transformEligible,sourcePetFlg,
    foxRoll,foxRollPassed:foxRoll!=null&&foxRoll<31,
    sourcePostTargetKind:sourcePostTarget?.kind||null,
    sourcePostTargetPetId:sourcePostTarget?.petId||sourcePostTarget?.pet?.id||null,
    sourceTargetAlive,sourceReturnEligible
  },result);
}
function performEnemySacrifice(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  const beforeCaster=Math.max(0,Math.trunc(n(unit.hp)));
  // 原 BATTLE_S_Sacrifice：CHAR_HP = CHAR_HP * 0.5，int 截斷。
  unit.hp=Math.max(0,Math.trunc(beforeCaster*.5));
  const transfer=Math.max(0,Math.trunc(n(unit.hp)));

  let beforeTarget=0,afterTarget=0,targetName='你',targetKind=chosen.kind;
  if(chosen.kind==='pet'&&chosen.pet){
    const pet=chosen.pet;
    beforeTarget=Math.max(0,Math.trunc(n(pet.hp)));
    const maxHp=Math.max(1,Math.trunc(n(pet.maxHp)));
    pet.hp=Math.min(maxHp,beforeTarget+transfer);
    afterTarget=pet.hp;
    targetName=pet.name;
  }else{
    beforeTarget=Math.max(0,Math.trunc(n(state.hp)));
    const maxHp=Math.max(1,Math.trunc(n(state.maxHp)));
    state.hp=Math.min(maxHp,beforeTarget+transfer);
    afterTarget=state.hp;
  }

  const healed=Math.max(0,afterTarget-beforeTarget);
  addLog(unit.name+' 使用 '+(meta?.n||'救援')+'：自身 HP '+beforeCaster+' → '+unit.hp+'，並替 '+targetName+' 回復 '+healed+' HP（來源轉移值 '+transfer+'）。','bad');

  // 原 BATTLE_S_Sacrifice 沒有物理攻擊，也沒有 Counter loop。
  return {
    kind:'skill',skillId:actor.skillId,target:targetKind,
    beforeCaster,afterCaster:unit.hp,transfer,healed
  };
}
function performEnemyDamageToHp2(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  const absorbPct=Math.max(0,Math.trunc(Number(String(meta?.o||'').trim())||0));
  // BATTLE_AttackSeq(DAMAGETOHP2) 在傷害計算前直接以當輪 FIXSTR +20% 覆寫 WORKATTACKPOWER。
  const baseAttack=Math.trunc(n(unit.roundFixAttack??unit.attack));
  const attack=baseAttack+Math.trunc(baseAttack*.2);

  // 原 BATTLE_AttackSeq(DAMAGETOHP2)：
  // 1) 先以 FIXDEX 做正常會心率；
  // 2) perCri 再 ×1.3；
  // 3) WORKATTACKPOWER 改為 FIXSTR +20% 後才進 DamageCalc。
  // QUICK +20% 只屬於 BATTLE_DexCalc 的回合排序，並不改 CriticalCheck 使用的 FIXDEX。
  const guarding=chosen.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
  const r=enemyAttackSeqBugTargetResult(
    unit,chosen,
    {guarding,criticalChanceMultiplier:1.3},
    {attack}
  );
  if(!r)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  enemyApplySkillHit(unit,chosen,r,meta?.n||'浴血狂襲');
  sourceBattleFinalizeItemCrushRng(r);

  let healed=0;
  if(r.damage>0&&!r.dodged&&!r.miss&&absorbPct>0){
    const before=n(unit.hp);
    const amount=Math.trunc(n(r.damage)*absorbPct/100);
    unit.hp=Math.min(Math.max(1,Math.trunc(n(unit.maxHp))),before+amount);
    healed=Math.max(0,unit.hp-before);
    if(healed>0)addLog(unit.name+' 由 '+(meta?.n||'浴血狂襲')+' 吸收 '+healed+' HP。','bad');
  }

  // BATTLE_COM_S_DAMAGETOHP2 是 BATTLE_S_AttackDamage 的獨立 case，結束後直接 break。
  return {kind:'skill',skillId:actor.skillId,target:chosen.kind,r,healed,absorbPct,attackPct:20};
}
function performEnemyRefresh(actor,unit,options,meta){
  const targets=livingEnemyUnits().map(target=>({kind:'enemy',unit:target,unitId:target.id}));
  const results=[];
  for(const target of targets){
    const st=battleStatusGet(target);
    if(!st){
      results.push({unitId:target.unitId,cleared:false});
      continue;
    }
    const type=st.type;
    battleStatusClear(target);
    addLog(unit.name+' 使用 '+(meta?.n||'淨化')+'，解除 '+target.unit.name+' 的'+(BATTLE_STATUS_NAMES[type]||type)+'。','bad');
    results.push({unitId:target.unitId,cleared:true,type});
  }
  if(!results.some(x=>x.cleared)){
    addLog(unit.name+' 使用 '+(meta?.n||'淨化')+'，但我方目前沒有異常狀態。');
  }
  // option「全」在來源 aszStatus[0] 對應 status=0；
  // BATTLE_MultiStatusRecovery 對 ALLMYSIDE 逐一解除當前 StatusTbl 異常。
  return {kind:'skill',skillId:actor.skillId,results};
}
function performEnemyDamageToHp(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  const parts=enemyOptionParts(meta?.o);
  const attackReduceRaw=Math.trunc(Number(parts[0]))||0;
  const absorbPct=Math.trunc(Number(parts[1]))||0;

  // 原 PETSKILL_DamageToHp 寫成 def = (atoi(buf1) / 100)；
  // 這是 C 的整數除法，因此 30/100、20/100、10/100 都會先變 0。
  // 503 的說明雖寫攻擊 -30%，此來源實際 FIXSTR 不變。
  const cIntegerDivision=Math.trunc(attackReduceRaw/100);
  // PETSKILL_DamageToHp 的來源基底是當輪 FIXSTR；30/20/10 除以 100 的 C int bug 使減幅為 0，
  // 但仍不能把已被 WEAKEN 等 compliance 修過的 FIXSTR 換回永久 base attack。
  const baseAttack=Math.trunc(n(unit.roundFixAttack??unit.attack));
  unit.roundAttack=baseAttack-Math.trunc(baseAttack*cIntegerDivision);
  unit.counterEligibleThisTurn=false;

  const guarding=chosen.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
  const r=enemyAttackSeqBugTargetResult(unit,chosen,{guarding});
  enemyApplySkillHit(unit,chosen,r,meta?.n||'嗜血技');
  sourceBattleFinalizeItemCrushRng(r);

  let healed=0;
  if(r.damage>0&&!r.dodged&&!r.miss&&absorbPct>0){
    const before=n(unit.hp);
    healed=Math.trunc(n(r.damage)*absorbPct/100);
    unit.hp=Math.min(Math.max(1,Math.trunc(n(unit.maxHp))),before+healed);
    healed=Math.max(0,unit.hp-before);
    if(healed>0)addLog(unit.name+' 由 '+(meta?.n||'嗜血技')+' 吸收 '+healed+' HP。','bad');
  }

  // BATTLE_COM_S_DAMAGETOHP 是獨立的 BATTLE_S_AttackDamage 分支，原 battle.c 不接普通 Counter loop。
  return {kind:'skill',skillId:actor.skillId,target:chosen.kind,r,healed,absorbPct,attackReduceRaw};
}
function enemyDeadBattleUnits(){
  if(!enemy)return [];
  if(Array.isArray(enemy.units))return enemy.units.filter(u=>n(u.hp)<=0);
  return n(enemy.hp)<=0?[enemy]:[];
}
function performEnemyReLife(actor,unit,options,meta){
  const dead=enemyDeadBattleUnits();
  if(!dead.length){
    addLog(unit.name+' 使用 '+(meta?.n||'敵人復活')+'，但敵方沒有倒地成員；依原 battle.c 改為普通攻擊。');
    return Object.assign(
      {kind:'skill',skillId:actor.skillId,success:false,noTarget:true,fallbackAttack:true},
      performEnemyPrimaryAttack(actor,unit,options)||{}
    );
  }
  const target=dead[cRand(0,dead.length-1)];
  const base=Math.trunc(Math.max(1,n(target.maxHp))/2);
  const low=Math.trunc(base*.9),high=Math.trunc(base*1.1);
  const amount=Math.max(1,cRand(low,high));
  target.hp=Math.min(Math.max(1,Math.trunc(n(target.maxHp))),amount);
  addLog(unit.name+' 使用 '+(meta?.n||'敵人復活')+'，'+target.name+' 以 '+target.hp+' / '+target.maxHp+' HP 復活。','bad');
  return {kind:'skill',skillId:actor.skillId,success:true,targetUnitId:target.id,amount:target.hp};
}
function performEnemyReHP(actor,unit,options,meta){
  const candidates=livingEnemyUnits().filter(u=>n(u.hp)<Math.trunc(n(u.maxHp)*2/3));
  if(!candidates.length){
    addLog(unit.name+' 使用 '+(meta?.n||'敵人補血')+'，但沒有 HP 低於 2/3 的存活敵方；依原 battle.c 改為普通攻擊。');
    return Object.assign(
      {kind:'skill',skillId:actor.skillId,success:false,noTarget:true,fallbackAttack:true},
      performEnemyPrimaryAttack(actor,unit,options)||{}
    );
  }
  const target=candidates[cRand(0,candidates.length-1)];
  const power=cRand(100,Math.max(100,Math.trunc(n(target.maxHp))));
  const before=n(target.hp);
  target.hp=Math.min(Math.max(1,Math.trunc(n(target.maxHp))),before+power);
  const healed=Math.max(0,target.hp-before);
  addLog(unit.name+' 使用 '+(meta?.n||'敵人補血')+'，'+target.name+' 回復 '+healed+' HP。','bad');
  return {kind:'skill',skillId:actor.skillId,success:true,targetUnitId:target.id,rolledPower:power,healed};
}
function enemyFirstFreeBattleSlot(){
  if(!enemy||!Array.isArray(enemy.units))return -1;
  const used=new Set(enemy.units.map(u=>Math.trunc(n(u.battleSlot))).filter(x=>x>=0&&x<10));
  for(let i=0;i<10;i++)if(!used.has(i))return i;
  return -1;
}
function enemyHelpSourceTemplate(unit){
  if(unit?.sourceTemplate)return Object.assign({},unit.sourceTemplate,{
    stats:Object.assign({},unit.sourceTemplate.stats||{}),
    elements:Object.assign({},unit.sourceTemplate.elements||{}),
    petSkills:Array.isArray(unit.sourceTemplate.petSkills)?unit.sourceTemplate.petSkills.slice():[],
    enemyItems:Array.isArray(unit.sourceTemplate.enemyItems)?unit.sourceTemplate.enemyItems.slice():[],
    itemProbs:Array.isArray(unit.sourceTemplate.itemProbs)?unit.sourceTemplate.itemProbs.slice():[]
  });
  return null;
}
function performEnemyHelp(actor,unit,options,meta){
  const slot=enemyFirstFreeBattleSlot();
  if(slot<0){
    addLog(unit.name+' 使用 '+(meta?.n||'敵人招人')+'，但敵方 10 個戰鬥位置都已被占用；依原 battle.c 改為普通攻擊。');
    return Object.assign(
      {kind:'skill',skillId:actor.skillId,success:false,full:true,fallbackAttack:true},
      performEnemyPrimaryAttack(actor,unit,options)||{}
    );
  }
  const raw=enemyHelpSourceTemplate(unit);
  if(!raw){
    addLog(unit.name+' 使用 '+(meta?.n||'敵人招人')+'，但此 Enemy 缺少可重建的原始模板；不猜援軍資料，依原失敗分支改為普通攻擊。');
    return Object.assign(
      {kind:'skill',skillId:actor.skillId,success:false,missingTemplate:true,fallbackAttack:true},
      performEnemyPrimaryAttack(actor,unit,options)||{}
    );
  }

  // 原 BATTLE_E_ENEMYHELP：ENEMY_createEnemy(array, RAND(LV*0.8, LV*1.2)).
  const low=Math.trunc(n(unit.level)*.8),high=Math.trunc(n(unit.level)*1.2);
  const summonLv=Math.max(1,cRand(low,Math.max(low,high)));
  raw.levelMin=summonLv;
  raw.levelMax=summonLv;
  const summoned=makeEnemyUnit(raw,enemy.entry,enemy.units.length);
  summoned.battleSlot=slot;
  summoned.sourceEnemyId=unit.sourceEnemyId??unit.enemyId;
  summoned.randomEnemy=!!unit.randomEnemy;
  enemy.units.push(summoned);
  addLog(unit.name+' 使用 '+(meta?.n||'敵人招人')+'，Lv.'+summoned.level+' '+summoned.name+' 加入 slot '+slot+'。','bad');
  return {kind:'skill',skillId:actor.skillId,success:true,summonedUnitId:summoned.id,battleSlot:slot,level:summoned.level};
}
function petSourceModAi(pet){
  const override=Number(pet?.modAiOverride);
  if(Number.isFinite(override))return Math.trunc(override);
  const tempNo=Number(pet?.tempNo);
  if(!Number.isFinite(tempNo))return null;
  const raw=petModAiDb?.byTempNo?.[String(tempNo)];
  const modAi=Number(raw);
  return Number.isFinite(modAi)?modAi:null;
}
const SOURCE_PET_VARIABLE_AI_MIN=-10000;
const SOURCE_PET_VARIABLE_AI_MAX=10000;
const SOURCE_CAPTURE_MAX_FIXAI=60;
function sourcePetAddVariableAi(pet,delta){
  if(!pet)return {before:0,delta:0,after:0};
  const before=clamp(Math.trunc(n(pet.variableAi)),SOURCE_PET_VARIABLE_AI_MIN,SOURCE_PET_VARIABLE_AI_MAX);
  const after=clamp(before+Math.trunc(n(delta)),SOURCE_PET_VARIABLE_AI_MIN,SOURCE_PET_VARIABLE_AI_MAX);
  pet.variableAi=after;
  return {before,delta:after-before,after};
}
function sourceApplyCapturedPetInitialAi(pet){
  if(!pet)return null;
  // BATTLE_Capture() 在 PET_createPetFromCharaIndex() 後重新 compliance，
  // 接著明確把 CHAR_VARIABLEAI 清成 0；若 FIXAI > CHAR_DEFAULTMAXAI(60)，
  // 再補 (60-FIXAI)*100 的負修正，使剛捕獲時的有效忠誠最高正好 60。
  pet.variableAi=0;
  const raw=petFixedAi(pet);
  if(!raw)return {resolved:false,reason:'missing-modai'};
  const over=Math.trunc(n(raw.ai))-SOURCE_CAPTURE_MAX_FIXAI;
  let adjust={before:0,delta:0,after:0};
  if(over>0)adjust=sourcePetAddVariableAi(pet,-over*100);
  const final=petFixedAi(pet);
  pet.captureAiInit={
    source:'BATTLE_Capture',
    rawFixAi:Math.trunc(n(raw.ai)),
    variableAi:Math.trunc(n(pet.variableAi)),
    finalFixAi:final?Math.trunc(n(final.ai)):null
  };
  return {resolved:true,raw,adjust,final};
}
function sourcePetWinVariableAi(pet,enemyLevel,petLevelSnapshot=null){
  if(!pet)return {before:0,delta:0,after:0};
  // BATTLE_AddExp：敵人等級 > 寵物等級時 AI_FIX_PETGOLDWIN=+20，
  // 否則 AI_FIX_PETWIN=+1。這些是 VARIABLEAI 的百分之一單位。
  const petLv=Math.max(1,Math.trunc(n(petLevelSnapshot??pet.level)));
  const foeLv=Math.max(1,Math.trunc(n(enemyLevel)));
  return sourcePetAddVariableAi(pet,foeLv>petLv?20:1);
}
function sourceMarefiaDeathPenalty(pet){
  if(!pet||Number(pet.tempNo)!==718)return null;
  const beforeAlloc=unpackPetAllocPoint(pet.allocPointPacked);
  // fixed Pet_Check_Die() consumes all four RANDs for PETID 718 unconditionally.
  // If a legacy/malformed save lacks reconstructible ALLOCPOINT, keep RNG order but do not invent stats.
  const rolls={vital:cRand(1,8),str:cRand(1,4),tgh:cRand(1,4),dex:cRand(1,4)};
  let afterAlloc=null;
  if(beforeAlloc){
    afterAlloc={
      vital:clamp(Math.trunc(n(beforeAlloc.vital))-rolls.vital,0,50),
      str:clamp(Math.trunc(n(beforeAlloc.str))-rolls.str,0,50),
      tgh:clamp(Math.trunc(n(beforeAlloc.tgh))-rolls.tgh,0,50),
      dex:clamp(Math.trunc(n(beforeAlloc.dex))-rolls.dex,0,50)
    };
    pet.allocPointPacked=packPetAllocPoint(afterAlloc);
  }
  const modBefore=petSourceModAi(pet);
  let modAfter=null;
  if(modBefore!=null){
    modAfter=Math.trunc(n(modBefore)-(n(modBefore)*5)/100);
    pet.modAiOverride=modAfter;
  }
  return {beforeAlloc,afterAlloc,rolls,modBefore,modAfter};
}
function sourceBattlePlayerPets(){
  const ids=[];
  const entries=Array.isArray(enemy?.sourcePlayerSideEntries)?enemy.sourcePlayerSideEntries:[];
  for(const entry of entries){
    if(entry?.kind==='pet'&&entry.petId!=null&&!ids.includes(entry.petId))ids.push(entry.petId);
  }
  if(!ids.length){
    const p=activePet();
    if(p)ids.push(p.id);
  }
  return ids.map(id=>state?.petBox?.find?.(p=>p.id===id)).filter(Boolean);
}
function sourceProcessPetBattleDeath(pet){
  if(!pet||n(pet.hp)>0||battlePetDeathProcessedIds.has(pet.id))return null;
  battlePetDeathProcessedIds.add(pet.id);
  // fixed _PET_LIMITLEVEL Pet_Check_Die runs before UltimateExtra / NormalDeadExtra.
  const marefia=sourceMarefiaDeathPenalty(pet);
  const levelDiv=Math.trunc(n(state?.level))<=10?2:1;
  const ultimate=sourceUltimateType({kind:'pet',pet,petId:pet.id});
  const ai=sourcePetAddVariableAi(pet,Math.trunc((ultimate?-1000:-500)/levelDiv));
  pet.battleDeathCount=Math.max(0,Math.trunc(n(pet.battleDeathCount)))+1;
  if(ultimate){
    if(state.activePetId===pet.id)state.activePetId=null;
    battlePetOutIds.add(pet.id);
    addLog(pet.name+' 被打飛：依 BATTLE_UltimateExtra 忠誠修正 '+(ai.delta/100).toFixed(2)
      +(marefia?'；並先套瑪蕾菲雅 _PET_LIMITLEVEL 死亡懲罰':'')+'。','bad');
  }else{
    addLog(pet.name+' 戰鬥倒下：依原 C 忠誠修正 '+(ai.delta/100).toFixed(2)
      +(marefia?'；瑪蕾菲雅另套 _PET_LIMITLEVEL 成長底值／MODAI 死亡懲罰':'')+'。','bad');
  }
  return {petId:pet.id,levelDiv,ai,marefia,ultimate};
}
function sourceProcessPendingPetBattleDeaths(){
  const results=[];
  for(const pet of sourceBattlePlayerPets()){
    const r=sourceProcessPetBattleDeath(pet);
    if(r)results.push(r);
  }
  return results;
}
function sourceProcessPlayerBattleDeath(){
  if(!state)return null;
  const levelDiv=Math.trunc(n(state.level))<=10?2:1;
  const ultimate=sourceUltimateType({kind:'player'});
  const charmBefore=clamp(Math.trunc(n(state.charm)),0,100);
  const charmDelta=Math.trunc((ultimate?-4:-2)/levelDiv);
  state.charm=clamp(charmBefore+charmDelta,0,100);
  const pet=activePet();
  const petAi=pet?sourcePetAddVariableAi(pet,Math.trunc((ultimate?-1000:-100)/levelDiv)):null;
  return {levelDiv,ultimate,charmBefore,charmDelta,charmAfter:state.charm,petId:pet?.id||null,petAi};
}
function sourceProcessPlayerBattleDeathOnce(){
  if(!enemy||n(state?.hp)>0)return null;
  if(battlePlayerDeathProcessed)return battlePlayerDeathResult;
  const pet=activePet();
  const death=sourceProcessPlayerBattleDeath();
  battlePlayerDeathProcessed=true;
  battlePlayerDeathResult=death||null;

  // fixed BATTLE_UltimateExtra(PLAYER) first BATTLE_PetDefaultExit()s the DEFAULTPET Entry.
  // It does not clear CHAR_DEFAULTPET, so ownership/default selection remains intact.
  if(death?.ultimate&&pet)battlePetOutIds.add(pet.id);

  if(death){
    addLog((death.ultimate?'角色被打飛：依 BATTLE_UltimateExtra 魅力 ':'角色戰鬥倒下：依原 C 魅力 ')+death.charmDelta
      +(death.petAi?'，出戰寵忠誠修正 '+(death.petAi.delta/100).toFixed(2):'')+'。','bad');
  }
  return death;
}
function sourceProcessBattleDeathsAtAddProfit(){
  // fixed BATTLE_AddExpItem scans side 0 Entry[] in slot order: Player 0 precedes DEFAULTPET 5.
  // This matters when both die before the same AddProfit: player death-extra must still see DEFAULTPET.
  const player=sourceProcessPlayerBattleDeathOnce();

  // Player Ultimate is special: BATTLE_UltimateExtra immediately calls BATTLE_PetDefaultExit()
  // and then BATTLE_Exit(player). The DEFAULTPET Entry is gone before AddExpItem reaches slot 5,
  // so a simultaneously HP<=0 Pet must NOT run Pet_Check_Die / Pet death-extra here.
  if(player?.ultimate)return {player,pets:[],playerUltimatePetExit:true};

  const pets=sourceProcessPendingPetBattleDeaths();
  return {player,pets,playerUltimatePetExit:false};
}
function sourcePlayerEquippedRelifeItems(){
  const out=Array(5).fill(null);
  const slots=sourcePlayerItemSlots(state);
  for(let i=0;i<5;i++){
    if(slots[i]==null)continue;
    const itemIndex=Math.trunc(Number(slots[i]));
    if(!Number.isFinite(itemIndex))continue;
    const existing=sourceItemRuntimeSlot(itemIndex);
    if(!existing||existing.owner!=='player')continue;
    out[i]={itemIndex,equipped:true,playerSlotIndex:i};
  }
  return out;
}
function sourceCAtoi(value){
  // C atoi(): leading whitespace/sign are accepted; parsing stops at the first non-digit.
  const match=String(value??'').match(/^\s*([+-]?\d+)/);
  return match?Math.trunc(Number(match[1])):0;
}
function sourceRelifeHpPower(template){
  // ITEM_DIErelife reads key HP from ITEM_ARGUMENT. The generated runtime stores the exact
  // value after HP: as relifeHpArgument: missing -> 1; FULL -> WORKMAXHP; otherwise atoi().
  if(!template||template.relifeHpArgument==null)return 1;
  const raw=String(template.relifeHpArgument);
  if(raw==='FULL')return Math.trunc(n(state?.maxHp));
  return sourceCAtoi(raw);
}
function sourceConsumeRelifeEquipment(item,slots,slotIndex){
  const runtimeIndex=Math.trunc(Number(item?.itemIndex));
  const existing=Number.isFinite(runtimeIndex)?sourceItemRuntimeSlot(runtimeIndex):null;
  const itemId=existing&&Number.isFinite(Number(existing.itemId))?Math.trunc(Number(existing.itemId)):null;

  // fixed ITEM_DIErelife order: clear CHAR equip slot -> end existing item. There is no
  // detach callback and NO immediate CHAR_complianceParameter here; equipment WORK bonuses
  // therefore survive until a later source compliance boundary.
  const playerSlot=Math.trunc(Number(item?.playerSlotIndex));
  if(Array.isArray(state?.playerItemSlots)&&Number.isFinite(playerSlot)&&playerSlot>=0&&playerSlot<state.playerItemSlots.length
    &&Number(state.playerItemSlots[playerSlot])===runtimeIndex){
    state.playerItemSlots[playerSlot]=null;
  }
  if(Array.isArray(slots)&&slotIndex>=0&&slotIndex<slots.length)slots[slotIndex]=null;
  if(itemId!=null&&n(state?.inventory?.[String(itemId)])>0){
    state.inventory[String(itemId)]=Math.max(0,Math.trunc(n(state.inventory[String(itemId)]))-1);
    if(state.inventory[String(itemId)]<=0)delete state.inventory[String(itemId)];
  }
  if(Number.isFinite(runtimeIndex))sourceItemRuntimeFree(runtimeIndex);
}
function sourceCheckPlayerItemRelifeBeforeOuterAddProfit(equipmentSlots=sourcePlayerEquippedRelifeItems()){
  // fixed CHECK_ITEM_RELIFE is reached only after a completed Entry command and before
  // that Entry's unconditional outer BATTLE_AddProfit. The fixed build has _DUMMYDIE off.
  if(!enemy||n(state?.hp)>0||!battlePlayerDeathProcessed)return null;

  // BATTLE_getBattleDieIndex() returns -1 for BENT_FLG_ULTIMATE, so a blown-away Player
  // is never offered to CHECK_ITEM_RELIFE even before BATTLE_Exit removes the Entry.
  if(battlePlayerDeathResult?.ultimate)return null;

  const slots=Array.isArray(equipmentSlots)?equipmentSlots:[];
  for(let i=0;i<5;i++){
    const item=slots[i];
    if(!item)continue;
    // ITEM_CHECKINDEX + ITEM_getEquipPlace() are both hard gates in fixed CHECK_ITEM_RELIFE.
    const runtimeIndex=Math.trunc(Number(item.itemIndex));
    if(!Number.isFinite(runtimeIndex))continue;
    const existing=sourceItemRuntimeSlot(runtimeIndex);
    if(!existing||item.equipped===false)continue;

    // V1.69: function pointer / ITEM_ARGUMENT / ITEM_TYPE come only from the fixed itemset6
    // runtime. A caller cannot turn an arbitrary existing item into a relife item by passing
    // dieRelifeFunc=true or a fabricated hpArgument.
    const template=sourceItemRelifeTemplate(existing.itemId);
    if(!template||template.relifeFunc!=='ITEM_DIErelife')continue;
    const equipPlace=Math.trunc(Number(template.equipPlace));
    if(!Number.isFinite(equipPlace)||equipPlace===-1)continue;

    const requested=sourceRelifeHpPower(template);
    const workHp=Math.max(1,Math.trunc(n(requested)));
    const maxHp=Math.trunc(n(state?.maxHp));
    state.hp=Math.min(workHp,maxHp);

    // BATTLE_MultiReLife clears CHAR_ISDIE. Our battlePlayerDeathProcessed flag is the
    // current Web equivalent, so clear it or a later second death could never be processed.
    battlePlayerDeathProcessed=false;
    battlePlayerDeathResult=null;

    // ITEM_DIErelife consumes the equipped existing item immediately after MultiReLife.
    sourceConsumeRelifeEquipment(item,slots,i);
    const label=template.name||('Item '+Math.trunc(Number(template.itemId)));
    addLog(label+' 發動死亡復活：HP 回復至 '+state.hp+'，裝備已消耗。','good');
    return {
      slot:i,itemId:Math.trunc(Number(template.itemId)),itemIndex:runtimeIndex,
      requested,restoredHp:state.hp,equipPlace
    };
  }
  return null;
}
function sourceMarkBattleActorOuterAddProfit(){
  // A dead / C_WAIT / combo-consumed Entry is continued before this mark, exactly like
  // fixed BATTLE_Battling; only an Entry that reaches StatusSeq/command processing
  // earns the generic CHECK_ITEM_RELIFE -> outer BATTLE_AddProfit boundary.
  battleOuterAddProfitPending=true;
}
function sourceProcessBattleActorOuterBoundary(equipmentSlots=sourcePlayerEquippedRelifeItems()){
  if(!battleOuterAddProfitPending)return null;
  battleOuterAddProfitPending=false;

  // Critical ordering from fixed battle.c:
  // completed command -> CHECK_ITEM_RELIFE -> BATTLESTR_ADD(bad status) -> BATTLE_AddProfit.
  // Inner per-hit AddProfit calls stay separate; they can set CHAR_ISDIE first, allowing
  // this same actor's end-of-command scan to revive the Player before the next Entry.
  const relife=sourceCheckPlayerItemRelifeBeforeOuterAddProfit(equipmentSlots);
  const deaths=sourceProcessBattleDeathsAtAddProfit();
  return {relife,deaths};
}

function petFixedAi(pet){
  if(!pet||!state)return null;
  const sourceModAi=petSourceModAi(pet);
  if(sourceModAi==null)return null;

  // CHAR_initcharWorkInt()：
  // modai<=0 時改 100；
  // ai=((hostLV*WORKFIXCHARM*1.10)/(petLV*modai))*100，指定給 int 時截斷；
  // 然後 cap 100，再做 ai += VARIABLEAI*0.01。ai 本身仍是 C int，
  // 因此 compound assignment 後還會再截整數，最後才 clamp 0..100。
  // 本 web 尚無玩家轉生系統；VariableAI 則由捕獲、擊倒與升級 lifecycle 依 fixed C 累積。
  const modAi=sourceModAi<=0?100:sourceModAi;
  const hostLv=Math.max(1,Math.trunc(n(state.level)));
  const petLv=Math.max(1,Math.trunc(n(pet.level)));
  const fixCharm=n(state.charm);
  let ai=Math.trunc(((hostLv*fixCharm*1.10)/(petLv*modAi))*100);
  if(ai>100)ai=100;
  ai=Math.trunc(ai+n(pet.variableAi)*.01);
  if(ai<0)ai=0;
  if(ai>100)ai=100;
  return {ai,modAi,sourceModAi,hostLv,petLv,fixCharm,variableAi:n(pet.variableAi)};
}
function sourceRefreshPetRoundFixAi(pet){
  if(!pet)return null;
  const key=String(pet.id);
  // EARTHROUND0 skips fixed C complianceParameter, so the prior WORKFIXAI survives unchanged.
  if(sourcePetEarthRoundCommandActive(pet)&&battlePetFixAiSnapshots.has(key)){
    return battlePetFixAiSnapshots.get(key);
  }
  const fixed=petFixedAi(pet);
  if(!fixed){
    battlePetFixAiSnapshots.delete(key);
    return null;
  }
  const snapshot=Object.assign({},fixed);
  battlePetFixAiSnapshots.set(key,snapshot);
  return snapshot;
}
function sourcePetRoundFixedAi(pet){
  if(!pet)return null;
  const key=String(pet.id);
  return battlePetFixAiSnapshots.get(key)||sourceRefreshPetRoundFixAi(pet);
}

function sourcePetEnemyTargetDesc(unit=targetEnemyUnit()){
  return {kind:'enemy',unit:unit||null,unitId:unit?.id||null};
}
function sourcePetRandomSideTarget(side,pet){
  if(side===1){
    const list=targetableEnemyUnits().map(unit=>({kind:'enemy',unit,unitId:unit.id}));
    return list.length?list[cRand(0,list.length-1)]:null;
  }
  // fixed BATTLE_DefaultAttacker() 只看該 side 的 BATTLE_TargetCheck；
  // 自己也是合法 Battle Entry，所以低忠誠 TARGETRANDOM 在己方 side 可能抽到自己，
  // 後續 normal attack 會因 defNo==attackNo 而 NoAction。
  const list=[];
  if(state.hp>0)list.push({kind:'player'});
  if(pet&&petIsBattleActive(pet)&&!sourcePlayerPetHidden(pet))list.push({kind:'self',pet,petId:pet.id});
  return list.length?list[cRand(0,list.length-1)]:null;
}
function sourcePetRandomEnemyTarget(){
  const list=targetableEnemyUnits();
  if(!list.length)return null;
  const unit=list[cRand(0,list.length-1)];
  return {kind:'enemy',unit,unitId:unit.id};
}
function sourcePetConfusionIntent(statusTurn){
  const attackerDesc=statusTurn?.desc;
  if(!attackerDesc)return {confusion:true,targetDesc:null};
  const pick=battleConfusionChooseTarget(attackerDesc);
  return {confusion:true,targetDesc:pick?.target||null,side:pick?.side??null,fallback:!!pick?.fallback};
}
function sourcePetRandomSkillPlan(pet){
  const skills=Array(7).fill(-1);
  for(let i=0;i<7;i++){
    if(Array.isArray(pet?.petSkills)&&i<pet.petSkills.length)skills[i]=Math.trunc(n(pet.petSkills[i]));
  }

  let iNum=cRand(0,6);
  // fixed _FIXWOLF：PetID 981..984 抽到 skill 600 時重抽。
  // 現有捕獲資料沒有可證明的 CHAR_PETID 欄；只有真的帶 petId 時才套，不由 tempNo 猜。
  const petId=Number(pet?.petId);
  if(Number.isFinite(petId)&&petId>=981&&petId<=984&&skills[iNum]===600){
    let guard=0;
    do{
      iNum=cRand(0,6);
      guard++;
    }while(skills[iNum]===600&&guard<100);
    if(skills[iNum]===600){
      return {kind:'blocked',reason:'fixwolf-reroll-nonterminating',slot:iNum,skillId:600};
    }
  }

  // fixed BATTLE_PetRandomSkill 在抽完 iNum 後，會先呼叫 BATTLE_DefaultAttacker()
  // 選定敵方 COM2，之後才開始 50 次 PetSkill 掃描。即使後面因 array=-1
  // 落入原 C 的未定義讀取，這一次目標 RNG 也已經消耗，不能被 Web 提前省略。
  const targetDesc=sourcePetRandomEnemyTarget();

  // fixed BATTLE_PetRandomSkill 有一個很舊的索引怪癖：
  // 掃描 i 來計數 battle/all skill，最後 PETSKILL_Use() 卻傳原始 iNum slot。
  // 對目前常見 [0,0,0,0,0,0,1] 等全 Battle skill 陣列，結果等價直接抽 slot iNum。
  let i=0,j=0;
  for(let k=0;k<50;k++,i++){
    if(i>=7)i=0;
    const scanId=skills[i];
    const scanMeta=petSkillDb?.byId?.[String(scanId)]||null;
    if(!scanMeta){
      // 原 C 此處會 PETSKILL_getInt(-1, FIELD)，屬未定義記憶體讀取。
      // 不把 UB 猜成任何固定技能效果；但保留此前已發生的 BATTLE_DefaultAttacker RNG。
      return {kind:'blocked',reason:'source-invalid-petskill-array',scanSlot:i,scanSkillId:scanId,slot:iNum,skillId:skills[iNum],targetDesc};
    }
    const field=Math.trunc(n(scanMeta.field));
    if(field!==0&&field!==1)continue; // PETSKILL_FIELD_ALL / BATTLE
    if(j<iNum){j++;continue;}

    const skillId=skills[iNum];
    const meta=petSkillDb?.byId?.[String(skillId)]||null;
    if(!meta){
      // PETSKILL_Use() 會因 array==-1 return FALSE；安全可確定為 NoAction。
      return {kind:'none',slot:iNum,skillId,sourceUseFailed:true,targetDesc};
    }
    if(Math.trunc(n(meta.illegal))!==0){
      // fixed PETSKILL_Use：CHAR_TYPEPET 遇 PETSKILL_ILLEGAL 直接 return FALSE。
      return {kind:'none',slot:iNum,skillId,sourceUseFailed:true,sourceIllegal:true,targetDesc};
    }
    return {kind:'skill',slot:iNum,skillId,meta,targetDesc};
  }
  return {kind:'none',slot:iNum,skillId:skills[iNum],sourceSearchExhausted:true,targetDesc};
}
function sourcePetChargeSpec(meta){
  // 與 fixed PETSKILL_ChargeAttack 相同：option 開頭 N，攻% 寫入 COM3 high。
  const spec=enemyChargeSpec(meta);
  return {turns:clamp(Math.trunc(n(spec.turns))||1,1,10),attackPct:n(spec.attackPct)};
}
function sourcePetChargeTargetDesc(pet){
  const charge=pet?battlePetChargeStates.get(pet.id):null;
  if(!charge)return null;
  const unit=Array.isArray(enemy?.units)?enemy.units.find(u=>u.id===charge.targetUnitId):null;
  // 即使原 COM2 指向的角色已死，LoyaltyCheck 的 toSide 仍是原敵方 side；
  // 所以保留 kind='enemy'，真正 release 才做 TargetAdjust。
  return {kind:'enemy',unit:unit||null,unitId:charge.targetUnitId||null};
}
function sourceCancelPetCharge(pet,reason=null){
  if(!pet||!battlePetChargeStates.has(pet.id))return false;
  battlePetChargeStates.delete(pet.id);
  if(reason)addLog(pet.name+' 的突擊蓄力被'+reason+'中斷。','pet');
  return true;
}
function sourceCancelPetChargeFromStatus(statusTurn){
  if(statusTurn?.desc?.kind!=='pet')return false;
  const pet=statusTurn.desc.pet;
  return sourceCancelPetCharge(pet,BATTLE_STATUS_NAMES[statusTurn.status?.type]||'異常狀態');
}
function sourceStartPetCharge(pet,action){
  const meta=action?.meta;
  const spec=sourcePetChargeSpec(meta);
  const target=action?.targetDesc?.kind==='enemy'?action.targetDesc:null;
  // PETSKILL_ChargeAttack 先寫 low=N；同一個 action 隨即進 BATTLE_Charge，
  // N>0 立刻 --。因此跨到下一輪時保存的是 N-1。
  const stateCharge={
    remaining:Math.max(0,spec.turns-1),
    attackPct:spec.attackPct,
    targetUnitId:target?.unitId||target?.unit?.id||null,
    skillId:action?.skillId??null,
    skillSlot:action?.slot??null,
    label:meta?.n||'突擊'
  };
  battlePetChargeStates.set(pet.id,stateCharge);
  addLog(pet.name+' 開始使用 '+stateCharge.label+'，本回合蓄力（COM3 low '+spec.turns+' → '+stateCharge.remaining+'）。','pet');
  return {handled:true,skillId:action?.skillId,charging:true,remaining:stateCharge.remaining,attackPct:stateCharge.attackPct};
}
function sourcePerformPetChargeState(pet,options={},targetOverride=undefined){
  const charge=pet?battlePetChargeStates.get(pet.id):null;
  if(!pet||!charge)return {handled:false};

  // Loyalty TARGETRANDOM 只改 COM2，不改 COM1=CHARGE；所以蓄力繼續但目標可被重抽。
  if(targetOverride!==undefined){
    charge.targetUnitId=targetOverride?.kind==='enemy'
      ?(targetOverride.unitId||targetOverride.unit?.id||null)
      :null;
  }

  if(charge.remaining>0){
    charge.remaining--;
    addLog(pet.name+' 持續 '+charge.label+' 蓄力（COM3 low → '+charge.remaining+'）。','pet');
    return {handled:true,charging:true,remaining:charge.remaining};
  }

  sourceRevealPetForDirectAttack(pet);

  // BATTLE_Charge release 使用「釋放當輪」的 FIXSTR，再加 high(COM3)%；
  // 玩家寵目前沒有可證明的 WORKMODATTACK 來源，因此維持 0，不猜裝備/BUFF 值。
  const base=petBattleView(pet);
  const baseAttack=Math.trunc(n(base?.attack));
  const releaseAttack=baseAttack+Math.trunc(baseAttack*n(charge.attackPct)/100);

  const targetable=targetableEnemyUnits();
  let target=charge.targetUnitId?targetable.find(u=>u.id===charge.targetUnitId):null;
  if(!target){
    // fixed direct-attack branch 的 BATTLE_TargetAdjust：原 COM2 無效時，
    // 退回 BATTLE_DefaultAttacker(敵方 side)。
    target=targetable.length?targetable[cRand(0,targetable.length-1)]:null;
  }

  battlePetChargeStates.delete(pet.id);
  if(!target){
    addLog(pet.name+' 釋放 '+charge.label+'，但已沒有可攻擊目標。','pet');
    return {handled:true,released:true,noTarget:true};
  }

  const attacker=Object.assign({},base,{attack:releaseAttack});
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const r=resolveAttackToEnemyWithGuardian(attacker,target,{
    guarding:!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion')
  });
  const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
  sourceProcessBattleDeathsAtAddProfit();
  addLog(pet.name+' 釋放 '+charge.label+'（FIXSTR 攻擊 '+baseAttack+' → '+releaseAttack+'，攻擊修正 '+charge.attackPct+'%）。','pet');

  // k=0 still lets the defender counter; k=1 would ask this Pet to counter-counter,
  // but CHARGE_OK already changed its COM1 to NONE.
  if(petIsBattleActive(pet)&&actual?.hp>0)resolvePetEnemyCounterChain('pet',pet,actual,r,{maxDepth:1});
  return {
    handled:true,released:true,skillId:charge.skillId,targetUnitId:target.id,
    actualTargetUnitId:actual?.id||null,baseAttack,releaseAttack,attackPct:charge.attackPct,r
  };
}

function sourceStartPetEarthRound(pet,action){
  const meta=action?.meta;
  const attackPct=enemySignedSkillPercent(meta?.o,'攻%');
  const target=action?.targetDesc?.kind==='enemy'?action.targetDesc:null;
  const view=petBattleView(pet);
  if(!view)return {handled:true,missingPet:true};
  const snapshot=Object.assign({},view,{
    elements:Object.assign({},view.elements||{}),
    workQuickBase:Number(view.workQuickBase??view.fixedDex??view.quick)
  });
  battlePetEarthRoundStates.set(pet.id,{
    hiddenCommand:true,interrupted:false,attackPct,
    targetUnitId:target?.unitId||target?.unit?.id||null,
    skillId:action?.skillId??null,skillSlot:action?.slot??null,
    label:meta?.n||'地球一周',snapshot
  });
  battlePetHiddenIds.add(pet.id);
  battlePetGuardIds.delete(pet.id);
  battlePetNoGuardStates.delete(pet.id);
  addLog(pet.name+' 隨機使用「'+(meta?.n||'地球一周')+'」，繞到敵人背後暫時消失。','pet');
  return {handled:true,skillId:action?.skillId,earthRound:true,hidden:true,attackPct};
}
function sourcePerformPetEarthRoundState(pet,options={},targetOverride=undefined){
  const st=pet?battlePetEarthRoundStates.get(pet.id):null;
  if(!pet||!st||st.interrupted)return {handled:false};
  if(targetOverride!==undefined){
    st.targetUnitId=targetOverride?.kind==='enemy'?(targetOverride.unitId||targetOverride.unit?.id||null):null;
  }
  sourceRevealPetForDirectAttack(pet,'從背後現身');
  st.hiddenCommand=false;st.releasing=true;
  const list=targetableEnemyUnits();
  let target=st.targetUnitId?list.find(u=>u.id===st.targetUnitId):null;
  if(!target)target=list.length?list[cRand(0,list.length-1)]:null;
  const multiplier=1+n(st.attackPct)/100;
  if(!target){
    battlePetEarthRoundStates.delete(pet.id);
    addLog(pet.name+' 現身完成 '+st.label+'，但已沒有可攻擊目標。','pet');
    return {handled:true,released:true,noTarget:true,multiplier};
  }
  const attacker=petBattleView(pet);
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const r=resolveAttackToEnemyWithGuardian(attacker,target,{
    guarding:!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion'),
    damageMultiplier:multiplier
  });
  const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
  sourceProcessBattleDeathsAtAddProfit();
  addLog(pet.name+' 從背後完成 '+st.label+'（來源最終傷害 ×'+multiplier.toFixed(2)+'）。','pet');
  if(petIsBattleActive(pet)&&actual?.hp>0)resolvePetEnemyCounterChain('pet',pet,actual,r,{maxDepth:1});
  if(battlePetEarthRoundStates.get(pet.id)===st)battlePetEarthRoundStates.delete(pet.id);
  return {handled:true,released:true,skillId:st.skillId,targetUnitId:target.id,actualTargetUnitId:actual?.id||null,attackPct:st.attackPct,multiplier,r};
}

function sourcePetLoyalCheck(actor,pet,intent){
  const fixed=sourcePetRoundFixedAi(pet);
  if(!fixed){
    return {changed:false,mode:'normal',sourceUnknownAi:true,ai:null,roll:null,intent};
  }
  const ai=Math.trunc(n(fixed.ai));
  const roll=cRand(1,100);
  let mode='normal';

  if(ai>=80){
    mode='normal';
  }else if(ai>=70){
    if(roll<10)mode='targetrandom';
  }else if(ai>=60){
    if(roll<20)mode='targetrandom';
  }else if(ai>=50){
    if(roll<35)mode='targetrandom';
  }else if(ai>=40){
    if(roll<50)mode='targetrandom';
  }else if(ai>=30){
    if(roll<70)mode='randomact';
  }else if(ai>=20){
    if(roll<70)mode='randomact';
  }else if(ai>=10){
    mode=roll<80?'ownerattack':'enemyattack';
  }else{
    mode=roll<60?'ownerattack':'escape';
  }

  if(mode==='normal')return {changed:false,mode,ai,roll,fixed,intent};

  // BATTLE_PetLoyalCheck 對合法 PET 用 CHAR_getCharHaveSkill(pet,i) 判斷有無技能，
  // 但該 API 對 0..6 回傳固定 haveSkill slot 指標，不是 pet skill 是否存在；
  // 因而 PETAI_MODE_NOACT 幾乎不可達。這裡保留來源 bug，不自行新增「無技能就不動」。
  const initial=intent?.targetDesc||sourcePetEnemyTargetDesc();
  const initialSide=initial?.kind==='enemy'?1:0;
  const type=(initial?.kind==='self')?1:0;

  if(mode==='targetrandom'){
    const targetDesc=type===1?null:sourcePetRandomSideTarget(initialSide,pet);
    return {
      changed:true,aibad:true,mode,ai,roll,fixed,
      // fixed 只覆寫 COM2；若原 COM1 是 CHARGE，就不能把它錯改成普通 ATTACK。
      action:type===1
        ?{kind:'none',reason:'self-or-guard'}
        :(intent?.commandKind==='charge'
          ?{kind:'charge',targetDesc}
          :(intent?.commandKind==='earthround'?{kind:'earthround',targetDesc}:{kind:'attack',targetDesc})),
      intent
    };
  }
  if(mode==='randomact'){
    // fixed BATTLE_PetLoyalCheck special case:
    // if the Pet is already in BATTLE_COM_S_EARTHROUND0, RANDOMACT returns 0 immediately.
    // AIBAD was set just before the switch, but COM1/COM2 stay untouched and no random skill /
    // BATTLE_DefaultAttacker RNG is consumed. The hidden Pet therefore continues its EarthRound release.
    if(intent?.commandKind==='earthround'){
      return {changed:false,aibad:true,mode,ai,roll,fixed,intent,sourceEarthRoundRandomActPreserved:true};
    }
    if(type===1){
      return {changed:true,aibad:true,mode,ai,roll,fixed,action:{kind:'none',reason:'self-target'},intent};
    }
    return {changed:true,aibad:true,mode,ai,roll,fixed,action:sourcePetRandomSkillPlan(pet),intent};
  }
  if(mode==='ownerattack'){
    return {changed:true,aibad:true,mode,ai,roll,fixed,action:{kind:'attack',targetDesc:state.hp>0?{kind:'player'}:null},intent};
  }
  if(mode==='enemyattack'){
    return {changed:true,aibad:true,mode,ai,roll,fixed,action:{kind:'attack',targetDesc:sourcePetRandomEnemyTarget()},intent};
  }
  if(mode==='escape'){
    return {changed:true,aibad:true,mode,ai,roll,fixed,action:{kind:'escape'},intent};
  }
  return {changed:true,aibad:true,mode,ai,roll,fixed,action:{kind:'none'},intent};
}
function sourcePerformPetAttackTarget(pet,targetDesc,options={},meta={}){
  if(!pet||!petIsBattleActive(pet))return {handled:true,missingPet:true};
  sourceRevealPetForDirectAttack(pet);
  if(!targetDesc){
    addLog(pet.name+' 沒有可攻擊的目標。','pet');
    return {handled:true,noTarget:true};
  }
  if(targetDesc.kind==='self'){
    addLog(pet.name+' 因忠誠不足把自己選成目標，原 BATTLE_TargetAdjust 之後因 defNo==attackNo 而沒有行動。','pet');
    return {handled:true,selfTarget:true};
  }
  if(targetDesc.kind==='enemy'){
    const target=targetDesc.unit&&n(targetDesc.unit.hp)>0?targetDesc.unit:null;
    if(!target){
      addLog(pet.name+' 沒有可攻擊的敵方目標。','pet');
      return {handled:true,noTarget:true};
    }
    if(meta.confusion)addLog(pet.name+' 的混亂發作：改為普通攻擊 '+target.name+'。','pet');
    const r=petAttackResult(pet,target);
    const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
    sourceProcessBattleDeathsAtAddProfit();
    if(petIsBattleActive(pet)&&actual?.hp>0)resolvePetEnemyCounterChain('pet',pet,actual,r);
    return {handled:true,target:'enemy',targetUnitId:target.id,actualTargetUnitId:actual?.id||null,r};
  }
  if(targetDesc.kind==='player'){
    if(state.hp<=0)return {handled:true,noTarget:true};
    if(meta.confusion)addLog(pet.name+' 的混亂發作：改為普通攻擊你。','bad');
    const attackerDesc={kind:'pet',pet,petId:pet.id};
    const playerDesc={kind:'player'};
    const attacker=petBattleView(pet);
    const defender=playerBattleView();
    const r=resolveNormalAttack(attacker,defender,{guarding:!!options.playerGuarding});
    battleApplyPhysicalHit(attackerDesc,playerDesc,r,{confusion:!!meta.confusion});
    if(petIsBattleActive(pet)&&state.hp>0&&!r.critical&&!r.guarded){
      resolveConfusionCounterChain(attackerDesc,playerDesc,r,{allowPlayerCounter:!!options.allowPlayerCounter,playerGuarding:!!options.playerGuarding});
    }
    return {handled:true,target:'player',r};
  }
  return {handled:true,unsupportedTarget:true};
}
function sourcePetStatusSkillType(meta){
  const option=String(meta?.o||'');
  if(option.includes('毒'))return 'poison';
  if(option.includes('醉'))return 'drunk';
  if(option.includes('眠'))return 'sleep';
  if(option.includes('石'))return 'stone';
  if(option.includes('乱')||option.includes('亂'))return 'confusion';
  return null;
}
function sourcePetStatusSkillTurn(meta){
  const m=String(meta?.o||'').match(/turn\s*(-?\d+)/i);
  return m?Math.max(0,Math.trunc(Number(m[1])||0)):3;
}
function sourcePetStatusSkillAttackPct(meta){
  const m=String(meta?.o||'').match(/攻%([+-]?\d+(?:\.\d+)?)/);
  return m?(Number(m[1])||0):0;
}
function sourcePetApplyStatusAttackHit(pet,targetDesc,r,type,turn,label){
  if(!targetDesc||!r||n(r.damage)<=0)return {attempted:false,applied:false};
  if(!(type==='poison'||type==='deepPoison'||type==='sleep'||type==='stone'||type==='confusion'||type==='drunk'||type==='sars')){
    return {attempted:false,applied:false,unsupportedType:type||null};
  }
  const attackerDesc={kind:'pet',pet,petId:pet.id};
  const check=battleStatusChance(attackerDesc,targetDesc,type);
  let applied=false,storedTurns=0;
  if(check.allowed&&check.success){
    if(type==='sars'){
      storedTurns=Math.max(1,Math.trunc(n(turn))+1);
      applied=battleSarsApplyRaw(targetDesc,storedTurns,true);
    }else if(type==='drunk'){
      // fixed BATTLE_Attack：先寫 gBattleStausTurn+1，再把 WORKDRUNK 自己 /2。
      storedTurns=Math.trunc((Math.max(0,Math.trunc(n(turn)))+1)/2);
      if(storedTurns>0)applied=battleStatusApplyRaw(targetDesc,type,storedTurns);
    }else{
      storedTurns=Math.max(1,Math.trunc(n(turn))+1);
      applied=battleStatusApply(targetDesc,type,turn);
    }
  }
  if(applied){
    addLog(battleStatusDescName(targetDesc)+' 被 '+label+' 附加'+BATTLE_STATUS_NAMES[type]+'（原檢定 '+check.per.toFixed(1)+'%）。','pet');
  }else{
    addLog(label+' 的'+BATTLE_STATUS_NAMES[type]+'效果未成功'+(check.reason==='existing'?'：目標已有其他異常狀態。':'（原檢定 '+n(check.per).toFixed(1)+'%）。'),'pet');
  }
  return {attempted:true,check,applied,type,turn,storedTurns};
}
function sourcePerformPetStatusSkill(pet,action,options={}){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const target=action?.targetDesc?.kind==='enemy'?action.targetDesc.unit:null;
  if(!target||n(target.hp)<=0){
    addLog(pet.name+' 使用 '+(meta?.n||'狀態攻擊')+'，但沒有可攻擊的敵方目標。','pet');
    return {handled:true,noTarget:true,skillId:action?.skillId};
  }

  const type=sourcePetStatusSkillType(meta);
  const turn=sourcePetStatusSkillTurn(meta);
  const attackPct=sourcePetStatusSkillAttackPct(meta);
  const base=petBattleView(pet);
  if(!base||!type){
    addLog(pet.name+' 抽到 '+(meta?.n||('PetSkill '+action?.skillId))+'，但來源狀態字串無法唯一解析；不猜效果。','pet');
    return {handled:true,sourceRuntimePending:true,skillId:action?.skillId};
  }

  // fixed PETSKILL_StatusChange：WORKATTACKPOWER = FIXSTR + trunc(FIXSTR * 攻% / 100)。
  // 低忠誠 RANDOMACT 發生在 EntrySort 後，因此只影響真正物理攻擊，不回頭重算 dex。
  const attack=Math.trunc(n(base.attack))+Math.trunc(Math.trunc(n(base.attack))*attackPct/100);
  const attacker=Object.assign({},base,{attack});
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const r=resolveAttackToEnemyWithGuardian(attacker,target,{
    guarding:!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion')
  });
  const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
  const actualDesc=actual?{kind:'enemy',unit:actual,unitId:actual.id}:targetDesc;
  const status=sourcePetApplyStatusAttackHit(pet,actualDesc,r,type,turn,meta?.n||'狀態攻擊');
  sourceProcessBattleDeathsAtAddProfit();

  // fixed BATTLE_Attack：StatusChange 已在 Counter 判定前寫進目標 WORK status。
  // 若因此變成不能動（例如睡/石），就不能反擊。毒/醉仍可照原規則反擊。
  if(petIsBattleActive(pet)&&actual?.hp>0&&battleStatusCanMove(actualDesc)){
    resolvePetEnemyCounterChain('pet',pet,actual,r);
  }
  return {handled:true,skillId:action.skillId,targetUnitId:target.id,actualTargetUnitId:actual?.id||null,r,status,type,turn,attackPct};
}

function sourcePerformPetGuardianSkill(pet,action,options={}){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const attackPct=sourcePetStatusSkillAttackPct(meta);
  const base=petBattleView(pet);
  const baseAttack=Math.trunc(n(base?.attack));
  const attack=baseAttack+Math.trunc(baseAttack*attackPct/100);

  // PETSKILL_Guardian(COM:攻擊) 在真正 BATTLE_Attack 前就設 GUARDIAN flag
  // 並把主人 Entry.guardian 指向自己；因此從此刻起可保護本輪後續攻擊。
  battlePlayerGuardianPetId=pet.id;

  const list=targetableEnemyUnits();
  let target=action?.targetDesc?.kind==='enemy'?action.targetDesc.unit:null;
  if(!target||n(target.hp)<=0||enemyUnitHidden(target)){
    target=list.length?list[cRand(0,list.length-1)]:null;
  }

  addLog(pet.name+' 使用 '+(meta?.n||'忠犬')+'：本輪開始保護主人，攻擊修正 '+attackPct+'%。','pet');
  if(!target){
    return {handled:true,skillId:action?.skillId,guardianReady:true,noTarget:true,attackPct};
  }

  const attacker=Object.assign({},base,{attack});
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const r=resolveAttackToEnemyWithGuardian(attacker,target,{
    guarding:!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion')
  });
  const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
  sourceProcessBattleDeathsAtAddProfit();

  // GUARDIAN_ATTACK 位於 fixed direct-attack 群組；進 BATTLE_Attack 前會被改回 COM_ATTACK，
  // 所以若對方沒有被 Guardian 代擋等條件阻斷，仍可進普通 Counter chain。
  if(petIsBattleActive(pet)&&actual?.hp>0){
    resolvePetEnemyCounterChain('pet',pet,actual,r);
  }
  return {
    handled:true,skillId:action?.skillId,guardianReady:true,targetUnitId:target.id,
    actualTargetUnitId:actual?.id||null,baseAttack,attack,attackPct,r
  };
}

function sourcePetEnemyTargetFromAction(action){
  let target=action?.targetDesc?.kind==='enemy'?action.targetDesc.unit:null;
  if(target&&n(target.hp)>0&&!enemyUnitHidden(target))return target;
  const list=targetableEnemyUnits();
  return list.length?list[cRand(0,list.length-1)]:null;
}
function sourcePerformPetContinuationSkill(pet,action,options={}){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const m=String(meta?.o||'').match(/^\s*(\d+)/);
  let count=m?Math.trunc(Number(m[1])):1;
  if(count<1||count>10)count=1;

  addLog(pet.name+' 隨機使用「'+(meta?.n||'連續攻擊')+'」（'+count+' 段）。','pet');
  let target=sourcePetEnemyTargetFromAction(action);
  let lastResult=null,lastActual=null,hits=0;

  // 玩家捕獲寵沒有 CHAR_ARM；fixed TargetListSet 對 non-BOW 先把整個 aDefList 填成原 COM2。
  // 每段後仍會 TargetAdjust，所以原目標倒下時下一段改抓同 side 的其他存活目標。
  for(let step=0;step<count;step++){
    if(!petIsBattleActive(pet)||!enemy)break;
    if(!target||n(target.hp)<=0||enemyUnitHidden(target)){
      const list=targetableEnemyUnits();
      target=list.length?list[cRand(0,list.length-1)]:null;
    }
    if(!target)break;

    const attacker=petBattleView(pet);
    const targetDesc={kind:'enemy',unit:target,unitId:target.id};
    const r=resolveAttackToEnemyWithGuardian(attacker,target,{
      guarding:!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion'),
      damageDivisor:count
    });
    const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
    sourceProcessBattleDeathsAtAddProfit();
    hits++;
    lastResult=r;
    lastActual=actual;
    if(!petIsBattleActive(pet))break;
    if(n(target.hp)<=0)target=null;
  }

  // fixed 共用 direct-attack loop 只在所有 attack_count 完成後，用最後一次 ContFlg 進 Counter。
  if(lastResult&&lastActual?.hp>0&&petIsBattleActive(pet)){
    resolvePetEnemyCounterChain('pet',pet,lastActual,lastResult);
  }
  return {handled:true,skillId:action?.skillId,hits,count,lastResult};
}
function sourcePerformPetMightySkill(pet,action,options={}){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const multMatch=String(meta?.o||'').match(/倍\s*([0-9.]+)/);
  const duckMatch=String(meta?.o||'').match(/回避\s*([0-9.]+)/);
  const multiplier=multMatch?Math.max(0,Number(multMatch[1])||0):2;
  const duckBonus=duckMatch?Math.max(0,Number(duckMatch[1])||0):0;
  const target=sourcePetEnemyTargetFromAction(action);
  if(!target){
    addLog(pet.name+' 使用「'+(meta?.n||'一擊必殺')+'」，但沒有可攻擊目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true};
  }

  addLog(pet.name+' 隨機使用「'+(meta?.n||'一擊必殺')+'」（傷害 ×'+multiplier+'／目標回避 +'+duckBonus+'）。','pet');
  const attacker=petBattleView(pet);
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const r=resolveAttackToEnemyWithGuardian(attacker,target,{
    guarding:!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion'),
    damageMultiplier:multiplier,
    duckBonusPercent:duckBonus
  });
  const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
  sourceProcessBattleDeathsAtAddProfit();
  if(petIsBattleActive(pet)&&actual?.hp>0){
    resolvePetEnemyCounterChain('pet',pet,actual,r);
  }
  return {handled:true,skillId:action?.skillId,targetUnitId:target.id,actualTargetUnitId:actual?.id||null,multiplier,duckBonus,r};
}

function sourcePerformPetPowerBalanceSkill(pet,action,options={}){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const attackPct=enemySignedSkillPercent(meta?.o,'攻%');
  const defensePct=enemySignedSkillPercent(meta?.o,'防%');
  const before=petBattleView(pet);
  if(!before)return {handled:true,missingPet:true};

  // PETSKILL_PowerBalance 讀當輪 WORKFIXSTR / WORKFIXTOUGH，
  // 各自做 int(str * fPer) 後再加回 FIX 值。
  const attack=Math.trunc(n(before.attack))+Math.trunc(Math.trunc(n(before.attack))*attackPct/100);
  const defense=Math.trunc(n(before.defense))+Math.trunc(Math.trunc(n(before.defense))*defensePct/100);
  battlePetPowerMods.set(pet.id,{attack,defense,skillId:action?.skillId});

  addLog(pet.name+' 隨機使用「'+(meta?.n||'背水之戰')+'」（攻 '+(attackPct>=0?'+':'')+attackPct+'%／防 '+(defensePct>=0?'+':'')+defensePct+'%）。','pet');

  const target=sourcePetEnemyTargetFromAction(action);
  if(!target)return {handled:true,skillId:action?.skillId,noTarget:true,attackPct,defensePct,attack,defense};

  const attacker=petBattleView(pet);
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const r=resolveAttackToEnemyWithGuardian(attacker,target,{
    guarding:!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion')
  });
  const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
  sourceProcessBattleDeathsAtAddProfit();
  if(petIsBattleActive(pet)&&actual?.hp>0){
    // Counter chain 會再次 petBattleView()；battlePetPowerMods 因此同時保留本輪攻／防。
    resolvePetEnemyCounterChain('pet',pet,actual,r);
  }
  return {
    handled:true,skillId:action?.skillId,targetUnitId:target.id,actualTargetUnitId:actual?.id||null,
    attackPct,defensePct,attack,defense,r
  };
}

function sourcePerformPetGuardBreakSkill(pet,action,options={}){
  const meta=action?.meta;
  const target=sourcePetEnemyTargetFromAction(action);
  if(!target){
    addLog(pet.name+' 使用「'+(meta?.n||'破除防禦')+'」，但沒有可攻擊目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true};
  }

  const attackPct=sourcePetStatusSkillAttackPct(meta);
  const base=petBattleView(pet);
  const attack=Math.trunc(n(base?.attack))+Math.trunc(Math.trunc(n(base?.attack))*attackPct/100);
  const attacker=Object.assign({},base,{attack});
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const guarding=!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion');

  addLog(pet.name+' 隨機使用「'+(meta?.n||'破除防禦')+'」。','pet');

  if(!guarding){
    // fixed BATTLE_S_GBreak 仍先執行完整 AttackSeq，再由 caller 因原 defindex 非 GUARD
    // 把 damage=0 / iWork=MISS。這裡先消耗同一套 dodge/critical/damage/Guardian RNG，但不套 HP。
    resolveAttackToEnemyWithGuardian(attacker,target,{guarding:false});
    addLog(target.name+' 沒有採取有效防禦；'+(meta?.n||'破除防禦')+' 被原 C 強制視為 MISS、傷害 0。','pet');

    const pseudo={damage:0,dodged:false,critical:false,miss:true,guarded:false};
    // BATTLE_S_GBreak 在這條路徑回 TRUE，所以外層仍會進 Counter。
    if(petIsBattleActive(pet)&&target.hp>0){
      resolvePetEnemyCounterChain('pet',pet,target,pseudo);
    }
    return {handled:true,skillId:action?.skillId,targetUnitId:target.id,guardBreakMiss:true,counterEligible:true};
  }

  // 原 defindex 正在 GUARD：DuckCheck 直接 FALSE。
  // GuardianCheck 若成功，只在 AttackSeq local defindex 用 Guardian 算 critical/damage；
  // BATTLE_S_GBreak caller 沒把 defindex 更新，DamageSub 最後仍扣原 GUARD 目標。
  const guardian=enemyGuardianFor(target,null);
  const calcTarget=guardian||target;
  const r=resolveNormalAttack(attacker,enemyBattleView(calcTarget),{
    guarding:false,disableDodge:true
  });
  if(guardian&&r.damage<=0){r.damage=1;r.miss=false}
  r.actualTarget=target;
  r.originalTarget=target;
  r.guardBreakTargetGuard=true;
  if(guardian){
    r.guardianCalcOnly=guardian;
    r.guardianPetId=guardian.id;
    addLog(guardian.name+' 嘗試忠犬代擋破防；依原 BATTLE_S_GBreak 舊 bug，只用其能力計算傷害，HP 仍扣 '+target.name+'。','pet');
  }

  const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
  // caller 在原 defindex GUARD 時最後固定 iRet=FALSE，因此不進普通 Counter。
  return {
    handled:true,skillId:action?.skillId,targetUnitId:target.id,actualTargetUnitId:actual?.id||null,
    guarding:true,guardianCalcOnly:guardian?.id||null,attackPct,r
  };
}

function sourcePerformPetNoGuardSkill(pet,action){
  const meta=action?.meta;
  const option=String(meta?.o||'');
  const readSigned=(label)=>{
    const m=option.match(new RegExp(label+'%([+-]?\\d+)'));
    return m?Math.trunc(Number(m[1])||0):0;
  };
  const duckBonus=readSigned('回避');
  const counterBonus=readSigned('反击')||readSigned('反擊');
  const parsedCritical=readSigned('会心')||readSigned('會心');

  // fixed PETSKILL_NoGuard stores all three in COM3. However the only function
  // reading the critical low byte is BATTLE_CriticalCheckPet inside #if 0.
  battlePetNoGuardStates.set(pet.id,{duckBonus,counterBonus,parsedCritical,skillId:action?.skillId});

  addLog(
    pet.name+' 隨機使用「'+(meta?.n||'不防守戰法')+'」：本輪回避 +'+duckBonus+'、反擊 +'+counterBonus+
    '；來源雖寫會心 '+(parsedCritical>=0?'+':'')+parsedCritical+'，但固定原 C 的讀取函式被 #if 0，實際不生效。','pet'
  );
  return {handled:true,skillId:action?.skillId,noAction:true,duckBonus,counterBonus,criticalBonusIgnored:parsedCritical};
}

function sourcePerformPetGuardBreak2Skill(pet,action,options={}){
  const meta=action?.meta;
  const target=sourcePetEnemyTargetFromAction(action);
  if(!target){
    addLog(pet.name+' 使用「'+(meta?.n||'破除防禦之2')+'」，但沒有可攻擊目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true};
  }

  const attacker=petBattleView(pet);
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const originalGuarding=!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion');
  const originalView=enemyBattleView(target);
  const dodge=sourceInitialDodgeOnly(attacker,originalView,{guarding:originalGuarding});

  let r,guardian=null,localGuarding=originalGuarding;
  let multiplier=originalGuarding?1.3:.7;

  if(dodge.dodged){
    r=dodge;
    r.actualTarget=target;
    r.originalTarget=target;
    r.guardBreak2Multiplier=multiplier;
  }else{
    guardian=attacker?.throwWeapon?null:enemyGuardianFor(target,null);
    const calcTarget=guardian||target;
    const calcDesc={kind:'enemy',unit:calcTarget,unitId:calcTarget.id};
    localGuarding=guardian
      ?(!!calcTarget.guardThisTurn&&!battleStatusActive(calcDesc,'confusion'))
      :originalGuarding;
    multiplier=localGuarding?1.3:.7;

    r=resolveNormalAttack(attacker,enemyBattleView(calcTarget),{
      guarding:false,
      disableDodge:true,
      preGuardDamageMultiplier:multiplier
    });
    r.duckRaw=dodge.duckRaw;
    r.actualTarget=target;
    r.originalTarget=target;
    r.guardBreak2Multiplier=multiplier;
    r.guardBreak2LocalGuarding=localGuarding;

    if(guardian){
      if(r.damage<=0){r.damage=1;r.miss=false}
      r.guardianCalcOnly=guardian;
      r.guardianPetId=guardian.id;
      addLog(guardian.name+' 嘗試忠犬代擋破除防禦之2；原 BATTLE_S_GBreak2 未更新 caller defindex，只用其能力與 GUARD 狀態算傷害，HP 仍扣 '+target.name+'。','pet');
    }
  }

  addLog(pet.name+' 隨機使用「'+(meta?.n||'破除防禦之2')+'」（local defindex 倍率 ×'+Number(multiplier).toFixed(1)+'）。','pet');
  const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);

  return {
    handled:true,skillId:action?.skillId,targetUnitId:target.id,actualTargetUnitId:actual?.id||null,
    originalGuarding,localGuarding,multiplier,guardianCalcOnly:guardian?.id||null,r
  };
}

function sourcePerformPetBecomeFoxSkill(pet,action,options={}){
  const meta=action?.meta;
  const target=sourcePetEnemyTargetFromAction(action);
  if(!target){
    addLog(pet.name+' 使用「'+(meta?.n||'媚惑術')+'」，但沒有可攻擊目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true};
  }

  addLog(pet.name+' 隨機使用「'+(meta?.n||'媚惑術')+'」。','pet');
  const result=sourcePerformPetAttackTarget(
    pet,{kind:'enemy',unit:target,unitId:target.id},options,{loyalty:true,skillId:action?.skillId}
  );
  const r=result?.r;
  let roll=null,applied=false,dismounted=false,sourceDataMissing=false;
  const primaryEligible=!!r&&!r.dodged&&!r.miss&&!r.allGuard&&!r.arranged&&n(target.hp)>0;
  if(primaryEligible){
    roll=cRand(0,99);
    const petFlg=target.sourcePetFlg;
    sourceDataMissing=petFlg==null;
    if(roll<31&&!sourceDataMissing&&Math.trunc(Number(petFlg))!==0){
      target.sourceFoxTurn=Math.max(0,Math.trunc(n(enemy?.sourceBattleTurn)));
      target.sourceFoxImage=true;
      if(Number.isFinite(Number(target.ridePetId))&&Number(target.ridePetId)>=0){
        target.ridePetId=-1;
        target.sourcePetFall=true;
        dismounted=true;
      }
      applied=true;
      addLog(target.name+' 被媚惑成小狐狸；狀態從 battle turn '+target.sourceFoxTurn+' 開始。','pet');
    }else if(sourceDataMissing){
      addLog(target.name+' 缺少可對回 enemy1 ENEMY_PETFLG 的來源值；保留 RNG 時序但不猜是否變狐。');
    }else if(roll>=31){
      addLog((meta?.n||'媚惑術')+' 的變狐判定未成功（rand()%100='+roll+'，需 < 31）。');
    }
  }

  return Object.assign({},result,{
    skillId:action?.skillId,foxRoll:roll,foxApplied:applied,
    foxStartTurn:applied?target.sourceFoxTurn:null,
    sourcePetFlg:target.sourcePetFlg??null,sourceDataMissing,dismounted,foxImage:applied?101749:null
  });
}
function sourcePerformPetFallGroundSkill(pet,action,options={}){
  const meta=action?.meta;
  const target=sourcePetEnemyTargetFromAction(action);
  if(!target){
    addLog(pet.name+' 使用「'+(meta?.n||'落馬術')+'」，但沒有可攻擊目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true};
  }

  // PETSKILL_FallGround: WORKATTACKPOWER = FIXSTR + trunc(FIXSTR * 攻%/100).
  const attackPct=sourcePetStatusSkillAttackPct(meta);
  const base=petBattleView(pet);
  const baseAttack=Math.trunc(n(base?.attack));
  const attack=baseAttack+Math.trunc(baseAttack*attackPct/100);
  const attacker=Object.assign({},base,{attack});
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const guarding=!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion');

  addLog(pet.name+' 隨機使用「'+(meta?.n||'落馬術')+'」（攻擊修正 '+attackPct+'%）。','pet');

  // BATTLE_S_FallGround passes Guardian=-1 into AttackSeq, but unlike BATTLE_Attack
  // it never updates caller defindex to Guardian before DamageSub.
  // So Guardian may be used for dodge-after-substitution/critical/damage calculation,
  // while HP and the fall check remain on the original target.
  const calc=resolveAttackToEnemyWithGuardian(attacker,target,{guarding});
  const guardian=calc?.guardian||null;
  const r=Object.assign({},calc,{
    actualTarget:target,
    originalTarget:target,
    guardianCalcOnly:guardian||null,
    guardianPetId:guardian?.id||null
  });
  if(guardian)delete r.guardian;

  if(guardian){
    addLog(guardian.name+' 嘗試忠犬代擋落馬術；依原 BATTLE_S_FallGround caller-defindex bug，只用其能力算傷害，HP 與落馬判定仍留在 '+target.name+'。','pet');
  }
  const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);

  let fallRoll=null,fallSuccess=false,enemyRideRuntime=false;
  if(r.damage>0&&!r.dodged&&!r.miss){
    // fixed source consumes RAND(0,100) regardless of whether the Enemy actually has a ride pet.
    fallRoll=cRand(0,100);
    if(fallRoll>50){
      // _ENEMY_FALLGROUND is compiled on, but current generated Enemy runtime exposes no
      // CHAR_RIDEPET-equivalent field. Do not invent a mount and do not apply the STR/TOUGH/VITAL *0.7 branch.
      enemyRideRuntime=Number.isFinite(Number(target?.ridePetId))&&Number(target.ridePetId)>0;
      if(enemyRideRuntime){
        target.ridePetId=-1;
        // This branch is future-proof only when a real source-derived ridePetId exists.
        // Current generated runtime has none, so it is presently unreachable.
        if(Number.isFinite(Number(target.str)))target.str=Math.trunc(Number(target.str)*.7);
        if(Number.isFinite(Number(target.tough)))target.tough=Math.trunc(Number(target.tough)*.7);
        if(Number.isFinite(Number(target.vital)))target.vital=Math.trunc(Number(target.vital)*.7);
        fallSuccess=true;
        addLog(target.name+' 被落馬並依原 _ENEMY_FALLGROUND 將 STR／TOUGH／VITAL ×0.7。','pet');
      }
    }
  }

  // BATTLE_COM_S_FALLRIDE is a dedicated case; battle.c breaks after BATTLE_S_FallGround
  // and does not enter the ordinary direct-attack Counter loop.
  return {
    handled:true,skillId:action?.skillId,targetUnitId:target.id,actualTargetUnitId:actual?.id||null,
    attackPct,baseAttack,attack,guardianCalcOnly:guardian?.id||null,
    fallRoll,fallSuccess,enemyRideRuntime,r
  };
}

function sourcePerformPetLoyalAction(pet,loyalty,options={}){
  const action=loyalty?.action||{kind:'none'},ai=loyalty?.ai,roll=loyalty?.roll;
  if(loyalty?.mode==='targetrandom')addLog(pet.name+' 忠誠不足（FIXAI '+ai+'，roll '+roll+'），改為隨機選目標。','pet');
  else if(loyalty?.mode==='randomact')addLog(pet.name+' 忠誠不足（FIXAI '+ai+'，roll '+roll+'），改為隨機行動。','pet');
  else if(loyalty?.mode==='ownerattack')addLog(pet.name+' 忠誠過低（FIXAI '+ai+'，roll '+roll+'），轉頭攻擊主人。','bad');
  else if(loyalty?.mode==='enemyattack')addLog(pet.name+' 忠誠過低（FIXAI '+ai+'，roll '+roll+'），仍改為隨機攻擊敵方。','pet');
  else if(loyalty?.mode==='escape'){
    sourceCancelPetCharge(pet);
    battlePetEarthRoundStates.delete(pet.id);battlePetHiddenIds.delete(pet.id);
    battlePetOutIds.add(pet.id);
    if(state.activePetId===pet.id)state.activePetId=null;
    state.charm=Math.max(0,Math.trunc(n(state.charm))-1);
    addLog(pet.name+' 因忠誠過低離開本場戰鬥並取消出戰；魅力 -1。','bad');
    return {handled:true,escaped:true};
  }
  if(loyalty?.mode==='randomact'||loyalty?.mode==='ownerattack'||loyalty?.mode==='enemyattack'){
    sourceCancelPetCharge(pet);
    sourceInterruptPetEarthRound(pet,'低忠誠行動');
  }
  const finish=result=>sourceFinishPetEarthRoundOverride(pet,result);
  if(action.kind==='charge')return finish(sourcePerformPetChargeState(pet,options,action.targetDesc));
  if(action.kind==='earthround')return finish(sourcePerformPetEarthRoundState(pet,options,action.targetDesc));
  if(action.kind==='attack')return finish(sourcePerformPetAttackTarget(pet,action.targetDesc,options,{loyalty:true}));
  if(action.kind==='none'){
    if(action.sourceIllegal)addLog(pet.name+' 隨機抽到原表標記為 PETSKILL_ILLEGAL 的技能；原 PETSKILL_Use() 對玩家寵直接失敗，本回合不行動。','pet');
    else if(action.sourceUseFailed)addLog(pet.name+' 隨機抽到不存在的 PetSkill；原 PETSKILL_Use() 失敗，本回合不行動。','pet');
    else addLog(pet.name+' 本回合沒有行動。','pet');
    return finish({handled:true,none:true});
  }
  if(action.kind==='blocked'){
    addLog(pet.name+' 的原 C 隨機技能流程碰到未定義的 PetSkill array 讀取；不猜記憶體結果，本回合不行動。','pet');
    return finish({handled:true,sourceUndefinedBoundary:true});
  }
  if(action.kind==='skill'){
    const meta=action.meta;let result;
    if(meta?.f==='PETSKILL_None'){addLog(pet.name+' 隨機使用「'+(meta.n||'待機')+'」，本回合不行動。','pet');result={handled:true,skillId:action.skillId,wait:true};}
    else if(meta?.f==='PETSKILL_NormalAttack'){addLog(pet.name+' 隨機使用「'+(meta.n||'攻擊')+'」。','pet');result=sourcePerformPetAttackTarget(pet,action.targetDesc,options,{loyalty:true,skillId:action.skillId});}
    else if(meta?.f==='PETSKILL_StatusChange'){addLog(pet.name+' 隨機使用「'+(meta.n||'狀態攻擊')+'」。','pet');result=sourcePerformPetStatusSkill(pet,action,options);}
    else if(meta?.f==='PETSKILL_ChargeAttack'){addLog(pet.name+' 隨機使用「'+(meta.n||'突擊')+'」。','pet');result=sourceStartPetCharge(pet,action);}
    else if(meta?.f==='PETSKILL_EarthRound')result=sourceStartPetEarthRound(pet,action);
    else if(meta?.f==='PETSKILL_Guardian')result=sourcePerformPetGuardianSkill(pet,action,options);
    else if(meta?.f==='PETSKILL_NormalGuard')result=sourcePerformPetNormalGuard(pet,action);
    else if(meta?.f==='PETSKILL_ContinuationAttack')result=sourcePerformPetContinuationSkill(pet,action,options);
    else if(meta?.f==='PETSKILL_Mighty')result=sourcePerformPetMightySkill(pet,action,options);
    else if(meta?.f==='PETSKILL_PowerBalance')result=sourcePerformPetPowerBalanceSkill(pet,action,options);
    else if(meta?.f==='PETSKILL_GuardBreak')result=sourcePerformPetGuardBreakSkill(pet,action,options);
    else if(meta?.f==='PETSKILL_NoGuard')result=sourcePerformPetNoGuardSkill(pet,action);
    else if(meta?.f==='PETSKILL_BecomeFox')result=sourcePerformPetBecomeFoxSkill(pet,action,options);
    else if(meta?.f==='PETSKILL_FallGround')result=sourcePerformPetFallGroundSkill(pet,action,options);
    else if(meta?.f==='PETSKILL_GuardBreak2')result=sourcePerformPetGuardBreak2Skill(pet,action,options);
    else{addLog(pet.name+' 隨機抽到「'+(meta?.n||('PetSkill '+action.skillId))+'」；此玩家側 PetSkill 尚未接入，保留原抽籤但本回合不猜效果。','pet');result={handled:true,skillId:action.skillId,sourceRuntimePending:true};}
    return finish(result);
  }
  return finish({handled:true,none:true});
}
function sourcePetPreCommandAction(actor,statusTurn,options={}){
  if(actor?.kind!=='pet')return {handled:false};
  const pet=activePet();
  if(!pet||pet.id!==actor.petId||!petIsBattleActive(pet))return {handled:true,missingPet:true};
  const confusionIntent=statusTurn?.confusionAttack?sourcePetConfusionIntent(statusTurn):null;
  const charge=battlePetChargeStates.get(pet.id)||null;
  const earth=battlePetEarthRoundStates.get(pet.id)||null;
  if(confusionIntent&&charge)sourceCancelPetCharge(pet,'混亂');
  if(confusionIntent&&earth)sourceInterruptPetEarthRound(pet,'混亂');
  if(sourceSurpriseSkipAction(actor)){
    if(confusionIntent){
      const result=sourcePerformPetAttackTarget(pet,confusionIntent.targetDesc,options,{confusion:true,surpriseOverride:true});
      return sourceFinishPetEarthRoundOverride(pet,result);
    }
    return {handled:true,surpriseSkip:true};
  }
  const liveCharge=battlePetChargeStates.get(pet.id)||null;
  const earthNow=battlePetEarthRoundStates.get(pet.id)||null;
  const liveEarth=earthNow&&!earthNow.interrupted?earthNow:null;
  const intent=confusionIntent
    ||(liveCharge?{confusion:false,commandKind:'charge',targetDesc:sourcePetChargeTargetDesc(pet)}
    :(liveEarth?{confusion:false,commandKind:'earthround',targetDesc:sourcePetEarthRoundTargetDesc(pet)}
    :{confusion:false,commandKind:'attack',targetDesc:sourcePetEnemyTargetDesc()}));
  const loyalty=sourcePetLoyalCheck(actor,pet,intent);
  if(loyalty.changed)return Object.assign({loyalty},sourcePerformPetLoyalAction(pet,loyalty,options));
  if(confusionIntent){
    const result=sourcePerformPetAttackTarget(pet,confusionIntent.targetDesc,options,{confusion:true});
    return Object.assign({loyalty},sourceFinishPetEarthRoundOverride(pet,result));
  }
  if(liveCharge)return Object.assign({loyalty},sourcePerformPetChargeState(pet,options));
  if(liveEarth)return Object.assign({loyalty},sourcePerformPetEarthRoundState(pet,options));
  return {handled:false,loyalty};
}
function performEnemyAbduct(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  const label=meta?.n||'旅程伙伴';
  if(!chosen){
    addLog(unit.name+' 使用 '+label+'，但沒有可帶走的目標。');
    return {kind:'skill',skillId:actor.skillId,success:false,noTarget:true};
  }

  // 原 BATTLE_Abduct 對 CHAR_TYPEPLAYER 直接 return FALSE：
  // 玩家本人不能被帶走，而且此時施術者也不會退出戰鬥。
  if(chosen.kind==='player'){
    addLog(unit.name+' 使用 '+label+'，但原版不能把玩家本人帶離戰鬥。');
    return {kind:'skill',skillId:actor.skillId,success:false,invalidTarget:true};
  }

  const pet=chosen.pet;
  if(!pet||!petIsBattleActive(pet)){
    addLog(unit.name+' 使用 '+label+'，但目標已不在本場戰鬥。');
    return {kind:'skill',skillId:actor.skillId,success:false,noTarget:true};
  }

  const aiPer=Math.max(0,Math.trunc(Number(String(meta?.o||'').trim())||0));
  let per,fixAiInfo=null,sourceDataMissing=false;
  if(aiPer>0){
    // _BATTLE_ABDUCTII：option >0 且目標為 CHAR_TYPEPET 時，不走等級公式。
    // WORKFIXAI < option => per=200，否則 per=0。
    fixAiInfo=sourcePetRoundFixedAi(pet);
    if(!fixAiInfo){
      sourceDataMissing=true;
      per=null;
    }else{
      per=fixAiInfo.ai<aiPer?200:0;
    }
  }else{
    per=Math.max(Math.trunc((n(pet.level)-n(unit.level))*.6+30),50);
  }

  let roll=null,success=false;
  if(per!=null){
    roll=cRand(1,100);
    success=roll<per;
    if(success){
      battlePetOutIds.add(pet.id);
      addLog(unit.name+' 使用 '+label+'，成功把 '+pet.name+' 帶離本場戰鬥（判定 '+roll+' < '+per+(fixAiInfo?'；FIXAI '+fixAiInfo.ai+' < '+aiPer:'')+'）。','bad');
    }else{
      addLog(unit.name+' 使用 '+label+'，沒有帶走 '+pet.name+'（判定 '+roll+' ≥ '+per+(fixAiInfo?'；FIXAI '+fixAiInfo.ai+(fixAiInfo.ai<aiPer?' < ':' ≥ ')+aiPer:'')+'）。');
    }
  }else{
    addLog(unit.name+' 使用 '+label+'：'+pet.name+' 缺少可對回 enemybase1 的 TempNo／MODAI，無法猜測 FIXAI 成敗；只保留來源已確定的施術者退場。');
  }

  // 原版只要目標不是玩家，無論帶走成功或失敗，施術者本身都會 BATTLE_Exit。
  addLog(unit.name+' 隨後也離開了戰鬥。');
  const exit=finishEnemyEscape(unit);
  return Object.assign({
    kind:'skill',skillId:actor.skillId,success,per,roll,
    aiPer,fixAi:fixAiInfo?.ai??null,modAi:fixAiInfo?.modAi??null,
    sourceDataMissing,target:'pet',petId:pet.id,attackerExited:true
  },exit);
}
function performEnemyGuardianAttack(actor,unit,options,meta){
  const owner=enemyGuardianOwner(unit);
  const label=meta?.n||'忠犬';
  if(owner&&owner.guardedByUnitId===unit.id){
    addLog(unit.name+' 使用 '+label+'，本回合保護 '+owner.name+' 並以攻擊修正後出手。');
  }else{
    addLog(unit.name+' 使用 '+label+'，但目前沒有對應的前排主人可保護。');
  }
  // GUARDIAN_ATTACK 和普通 ATTACK 共用同一個 direct-attack loop。
  // 遠距沿用既有 BOW/BOUND/BREAKTHROW helper；近戰與技能中的 BOOMERANG
  // 必須沿用本回合已抽好的 AttackNum，並在 later segment 從 raw COM2 重跑 TargetAdjust。
  unit.counterEligibleThisTurn=true;
  return Object.assign(
    {kind:'skill',skillId:actor.skillId},
    sourceEnemyCommonSkillAttack(actor,unit,options,label)||{}
  );
}
function sourceEnemyAttackCrazedTargetList(actor,count){
  const rawDefNo=sourceEnemyCommandTargetBattleSlot(actor,null);
  const pList=Array(20).fill(rawDefNo);
  let defsub=0,deftop=0;
  if(rawDefNo>=0&&rawDefNo<=9){
    defsub=0;deftop=9;
  }else if(rawDefNo>=10&&rawDefNo<=19){
    defsub=10;deftop=19;
  }else{
    pList[1]=-1;
    return {rawDefNo,defsub:null,deftop:null,pool:[],randomSlots:[],slots:pList,invalid:true};
  }

  // fixed BATTLE_TargetListSet quirk: i < deftop, so slot 9 / 19 is excluded.
  const pool=[];
  for(let slot=defsub;slot<deftop;slot++){
    if(sourceEnemyTargetableFromBattleSlot(slot))pool.push(slot);
  }
  if(!pool.length){
    // Source returns here before writing a sentinel; the prefilled raw COM2 entries remain.
    return {rawDefNo,defsub,deftop,pool,randomSlots:[],slots:pList,empty:true};
  }

  const randomSlots=[];
  for(let i=0;i<count;i++){
    const slot=pool[cRand(0,pool.length-1)];
    pList[i]=slot;
    randomSlots.push(slot);
  }
  pList[count]=-1;
  return {rawDefNo,defsub,deftop,pool,randomSlots,slots:pList};
}
function sourceEnemyTargetAdjustBattleSlot(slot){
  return sourceEnemyTargetableFromBattleSlot(slot)||sourceEnemyDefaultAttacker();
}
function performEnemyAttackCrazed(actor,unit,options,meta){
  const count=clamp(Math.trunc(enemySkillNumber(meta?.o,/^\s*(\d+)/,1)),1,10);
  const label=meta?.n||'狂亂暴走';
  const weaponType=Math.trunc(n(unit?.weaponType));
  const primedMax=Number(actor?.sourceAttackMax);
  const primedAttackMax=Number.isFinite(primedMax)&&primedMax>0?Math.trunc(primedMax):1;

  // BATTLE_GetAttackCount happened before the command switch. ATTCRAZED later overwrites
  // attack_max with option n, but does NOT rewrite gDamageDiv. A real ITEM_FIST therefore
  // keeps the earlier weapon AttackNum as its damage divisor.
  const attackOptions=Object.assign({},options.attackOptions||{});
  if(weaponType===0&&actor?.sourceAttackCountWeaponRoll&&primedAttackMax>0
    &&!Number.isFinite(Number(attackOptions.damageDivisor))){
    attackOptions.damageDivisor=primedAttackMax;
  }

  // Source builds all n random pList entries up front, before the first BATTLE_Attack.
  // For non-BOW, pList[0] is nevertheless ignored because the first hit uses raw COM2
  // through BATTLE_TargetAdjust; later hits consume pList[1], pList[2], ...
  const plan=sourceEnemyAttackCrazedTargetList(actor,count);
  const segments=[];
  let attackCount=0,lastTarget=null,lastActualTarget=null,lastResult=null;
  let sourcePostTarget=null,sourceCounterReady=false,sourceLoopExit='no-target';

  const applyOne=(target,slot)=>{
    let r,actualTarget=target,paralysis=null;
    if(target?.kind==='pet'&&target.pet&&petIsBattleActive(target.pet)){
      r=enemyAttackPetResult(unit,target.pet,attackOptions);
      actualTarget={kind:'pet',pet:target.pet,petId:target.pet.id};
      enemyApplySkillHit(unit,target,r,label+'第 '+(attackCount+1)+'/'+count+' 段');
      if(weaponType===19)paralysis=sourceBreakthrowParalysis(unit,{
        target:'pet',pet:target.pet,targetDesc:actualTarget,r
      });
      sourceBattleFinalizeItemCrushRng(r);
    }else if(target?.kind==='player'&&state.hp>0){
      const guarding=!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
      r=resolveEnemyDirectAttackToPlayer(unit,Object.assign({},attackOptions,{guarding}));
      actualTarget=enemyApplyDirectGuardianSkillHit(
        unit,target,r,label+'第 '+(attackCount+1)+'/'+count+' 段',
        {finalizeItemCrush:false}
      )||target;
      if(weaponType===19)paralysis=sourceBreakthrowParalysis(unit,{
        target:'player',targetDesc:actualTarget,r
      });
      sourceBattleFinalizeItemCrushRng(r);
    }else{
      return false;
    }

    sourceProcessBattleDeathsAtAddProfit();
    attackCount++;
    lastTarget=target;
    lastActualTarget=actualTarget;
    lastResult=r;
    sourcePostTarget=target;
    segments.push({
      sourceListSlot:slot,target:target.kind,petId:target.pet?.id||null,
      actualTarget:actualTarget?.kind||target.kind,
      actualPetId:actualTarget?.petId||actualTarget?.pet?.id||null,
      guardianPetId:r?.guardianPetId||null,r,paralysis
    });
    return true;
  };

  if(weaponType===4){
    // ATTCRAZED's special TargetListSet returns before the ordinary BOW aBowW branch:
    // no bow RAND(0,1) is consumed here.
    let anyTarget=false;
    for(let scan=0;scan<10;scan++){
      const slot=plan.slots[scan];
      if(sourceEnemyTargetableFromBattleSlot(slot)){anyTarget=true;break;}
    }
    if(!anyTarget){
      sourceLoopExit='bow-no-target';
    }else{
      let k=0;
      for(;;){
        const slot=plan.slots[k];
        if(slot==null||slot<0){
          sourcePostTarget=null;
          sourceLoopExit='target-list-end';
          break;
        }
        const target=sourceEnemyTargetableFromBattleSlot(slot);
        if(target)applyOne(target,slot);
        if(attackCount>=count){
          sourceCounterReady=true;
          sourceLoopExit='attack-max';
          break;
        }
        if(n(unit.hp)<=0){
          sourceLoopExit='attacker-dead';
          break;
        }
        k++;
        if(k>=plan.slots.length){
          sourcePostTarget=null;
          sourceLoopExit='target-list-end';
          break;
        }
      }
    }
  }else{
    let target=enemyActorTarget(actor,unit);
    let k=0;
    while(target&&attackCount<count&&enemy&&n(unit.hp)>0){
      applyOne(target,k===0?plan.rawDefNo:plan.slots[k]);
      if(attackCount>=count){
        sourceCounterReady=true;
        sourceLoopExit='attack-max';
        break;
      }
      if(n(unit.hp)<=0){
        sourceLoopExit='attacker-dead';
        break;
      }

      // fixed loop: defNo = aDefList[++k] happens before the <0 check.
      k++;
      const slot=plan.slots[k];
      if(slot==null||slot<0){
        sourcePostTarget=null;
        sourceLoopExit='target-list-end';
        break;
      }
      target=sourceEnemyTargetAdjustBattleSlot(slot);
      if(!target){
        sourcePostTarget=null;
        sourceLoopExit='target-adjust-failed';
        break;
      }
    }
  }

  let counter=null;
  if(sourceCounterReady&&lastResult&&lastTarget&&n(unit.hp)>0&&enemy){
    if(lastTarget.kind==='pet'&&lastTarget.pet&&petIsBattleActive(lastTarget.pet)){
      resolvePetEnemyCounterChain('enemy',lastTarget.pet,unit,lastResult);
      counter={target:'pet',petId:lastTarget.pet.id};
    }else if(lastTarget.kind==='player'&&state.hp>0&&options.allowPlayerCounter){
      resolvePlayerEnemyCounterChain('enemy',unit,lastResult);
      counter={target:'player'};
    }
  }

  addLog(unit.name+' 使用 '+label+'：原 TargetListSet 預抽 '+count+' 個亂數目標，實際完成 '+attackCount+'/'+count+' 段。');
  return {
    kind:'skill',skillId:actor.skillId,count,weaponType,
    primedAttackMax,sourceFistDamageDiv:Number.isFinite(Number(attackOptions.damageDivisor))
      ?Number(attackOptions.damageDivisor):1,
    targetPlan:plan,segments,attackCount,
    target:segments[0]?.target||null,
    pet:segments[0]?.petId?state.petBox.find(p=>p.id===segments[0].petId)||null:null,
    r:lastResult,sourcePostTarget,sourceCounterReady,sourceLoopExit,
    lastActualTarget:lastActualTarget?.kind||null,counter
  };
}
function performEnemyGyrate(actor,unit,options,meta){
  const label=meta?.n||'回旋攻擊';
  const weaponType=Math.trunc(n(unit?.weaponType));
  const rawDefNo=sourceEnemyCommandTargetBattleSlot(actor,null);
  const primedMax=Number(actor?.sourceAttackMax);
  const primedAttackMax=Number.isFinite(primedMax)&&primedMax>0?Math.trunc(primedMax):1;

  // BATTLE_TargetListSet still executes before the special GYRATE case. If the real weapon
  // is BOW it consumes its RAND(0,1), although the resulting aBowW list is never used.
  const discardedBowPlan=weaponType===4
    ?sourceBowTargetList(actor,unit,enemyActorCommandTarget(actor))
    :null;

  // Like ATTCRAZED, GYRATE does not reset the pre-command FIST gDamageDiv.
  const attackOptions=Object.assign({},options.attackOptions||{});
  if(weaponType===0&&actor?.sourceAttackCountWeaponRoll&&primedAttackMax>0
    &&!Number.isFinite(Number(attackOptions.damageDivisor))){
    attackOptions.damageDivisor=primedAttackMax;
  }

  let rowStart;
  if(rawDefNo<5)rowStart=0;
  else if(rawDefNo<10)rowStart=5;
  else if(rawDefNo<15)rowStart=10;
  else rowStart=15;

  // Source snapshots the targetable members of that five-slot row once, then attacks each.
  const rowSlots=[];
  for(let slot=rowStart;slot<rowStart+5;slot++){
    if(sourceEnemyTargetableFromBattleSlot(slot))rowSlots.push(slot);
  }

  const segments=[];
  for(const slot of rowSlots){
    const target=sourceEnemyTargetFromBattleSlot(slot);
    if(!target)continue;
    let r,actualTarget=target,paralysis=null;
    if(target.kind==='pet'&&target.pet){
      r=enemyAttackPetResult(unit,target.pet,attackOptions);
      actualTarget={kind:'pet',pet:target.pet,petId:target.pet.id};
      enemyApplySkillHit(unit,target,r,label);
      if(weaponType===19)paralysis=sourceBreakthrowParalysis(unit,{
        target:'pet',pet:target.pet,targetDesc:actualTarget,r
      });
      sourceBattleFinalizeItemCrushRng(r);
    }else if(target.kind==='player'&&state.hp>0){
      const guarding=!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
      r=resolveEnemyDirectAttackToPlayer(unit,Object.assign({},attackOptions,{guarding}));
      actualTarget=enemyApplyDirectGuardianSkillHit(
        unit,target,r,label,{finalizeItemCrush:false}
      )||target;
      if(weaponType===19)paralysis=sourceBreakthrowParalysis(unit,{
        target:'player',targetDesc:actualTarget,r
      });
      sourceBattleFinalizeItemCrushRng(r);
    }else{
      continue;
    }
    segments.push({
      battleSlot:slot,target:target.kind,petId:target.pet?.id||null,
      actualTarget:actualTarget?.kind||target.kind,
      actualPetId:actualTarget?.petId||actualTarget?.pet?.id||null,
      guardianPetId:r?.guardianPetId||null,r,paralysis
    });
  }

  addLog(unit.name+' 使用 '+label+'：依原 COM2 所在排攻擊 '+segments.length+' 個有效目標；此專用分支不進 common Counter。');
  return {
    kind:'skill',skillId:actor.skillId,weaponType,rawDefNo,rowStart,rowSlots,
    primedAttackMax,discardedBowRandom:discardedBowPlan?.random??null,
    discardedBowTargetSlots:discardedBowPlan?.slots?.slice?.()||null,
    sourceFistDamageDiv:Number.isFinite(Number(attackOptions.damageDivisor))
      ?Number(attackOptions.damageDivisor):1,
    attackCount:segments.length,segments,
    target:segments[0]?.target||null,r:segments.length?segments[segments.length-1].r:null,
    counter:null,sourceCounterReady:false
  };
}
function performEnemyFallGround(actor,unit,options,meta){
  unit.counterEligibleThisTurn=false;
  const chosen=enemyActorTarget(actor,unit);
  const label=meta?.n||'落馬術';
  if(!chosen)return {kind:'skill',skillId:actor.skillId};

  let r;
  if(chosen.kind==='pet'&&chosen.pet){
    r=enemyAttackPetResult(unit,chosen.pet);
  }else{
    const guarding=!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
    r=resolveEnemyAttackSeqBugToPlayer(unit,{
      guarding,
      guardianSourceBug:'BATTLE_S_FallGround-defindex-not-updated'
    });
  }
  r.ultimateCriticalEnemyOnly=true;
  enemyApplySkillHit(unit,chosen,r,label);

  let fallRoll=null,fallSuccess=false;
  if(r.damage>0&&!r.dodged&&!r.miss){
    fallRoll=cRand(0,100);
    // 原版無落馬抗性時：RAND(0,100) > 50，共 50/101。
    if(fallRoll>50&&chosen.kind==='player'){
      // 目前放置版尚未建立騎乘系統；若未來以 state.ridePetId 接入，
      // 這裡已保留與 CHAR_RIDEPET >= 0 對應的清除點。
      if(state.ridePetId!=null){
        state.ridePetId=null;
        fallSuccess=true;
        addLog('落馬術發動成功：你被 '+unit.name+' 打落騎乘寵物。','bad');
      }
    }
  }
  sourceBattleFinalizeItemCrushRng(r);
  return {kind:'skill',skillId:actor.skillId,target:chosen.kind,r,fallRoll,fallSuccess};
}
function performEnemyEarthRoundStart(actor,unit,options,meta){
  // BATTLE_EarthRoundHide does not validate COM2; it only clears CHAR_ISATTACKED and keeps COM2.
  const chosen=enemyActorCommandTarget(actor);
  const attackPct=enemySignedSkillPercent(meta?.o,'攻%');
  unit.earthRoundState={
    hidden:true,
    attackPct,
    targetKind:chosen?.kind||null,
    targetPetId:chosen?.petId||null,
    skillId:actor.skillId,
    skillSlot:actor.skillSlot??null,
    label:meta?.n||'地球一周'
  };
  unit.counterEligibleThisTurn=false;
  unit.guardThisTurn=false;
  addLog(unit.name+' 使用 '+unit.earthRoundState.label+'，本回合繞到敵人背後並暫時消失。');
  return {kind:'skill',skillId:actor.skillId,earthRound:true,hidden:true};
}
function performEnemyEarthRoundRelease(actor,unit,options={}){
  const round=unit?.earthRoundState;
  if(!round)return {kind:'earthround',missing:true};

  // 原 BATTLE_COM_S_EARTHROUND0 進普通攻擊區時會先把 CHAR_ISATTACKED 恢復，
  // 並在真正 BATTLE_Attack 前把 command 清成 NONE。
  // 因此從這一刻開始重新可被鎖定，但施術者不具備後續反反擊資格。
  unit.earthRoundState=null;
  unit.counterEligibleThisTurn=false;
  const releaseActor=Object.assign({},actor,{
    targetKind:round.targetKind,
    targetPetId:round.targetPetId
  });
  const multiplier=1+n(round.attackPct)/100;
  addLog(unit.name+' 從背後現身完成 '+round.label+'（最終傷害 ×'+multiplier.toFixed(2)+'）。');

  // EARTHROUND0 在 common loop 前設定 gBattleDamageModyfy，
  // 所以每一個 primary segment 都套同一倍率；之後仍依本回合 AttackNum / aDefList 執行。
  const attackOptions=Object.assign({},options.attackOptions||{},{
    damageMultiplier:multiplier
  });
  const result=sourceEnemyCommonSkillAttack(
    releaseActor,unit,Object.assign({},options,{attackOptions}),round.label||'地球一周'
  )||{};
  return Object.assign({kind:'earthround',released:true,multiplier},result);
}
function performEnemyGuardBreak(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId};
  const label=meta?.n||'破除防禦';
  const guarding=chosen.kind==='player'
    ?(!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion'))
    :(chosen.kind==='pet'&&chosen.pet?sourcePlayerPetGuardAdjust(chosen.pet):false);

  // fixed BATTLE_S_GBreak：原 defindex 最後必須仍是有效 GUARD，否則 caller 強制 damage=0。
  if(!guarding){
    addLog(unit.name+' 使用 '+label+'，但目標沒有有效防禦，技能沒有造成傷害。');
    return {kind:'skill',skillId:actor.skillId,guardBreakMiss:true};
  }

  let r;
  if(chosen.kind==='pet'&&chosen.pet){
    // COM_GUARD 讓 DuckCheck 直接 FALSE；opt=GBREAK 又刻意跳過普通 GuardAdjust。
    r=resolveNormalAttack(enemyBattleView(unit),petBattleView(chosen.pet),{
      guarding:false,disableDodge:true
    });
    r.sourcePetGuardCommand=true;
  }else{
    r=resolveEnemyAttackSeqBugToPlayer(unit,{
      guarding:false,
      disableDodge:true,
      guardianSourceBug:'BATTLE_S_GBreak-defindex-not-updated'
    });
  }
  r.ultimateCriticalEnemyOnly=true;
  enemyApplySkillHit(unit,chosen,r,label);
  sourceBattleFinalizeItemCrushRng(r);
  return {kind:'skill',skillId:actor.skillId,target:chosen.kind,r};
}
function sourceEnemyApplyStatusAttackHit(unit,targetDesc,r,type,turn,label){
  if(!targetDesc||!r||n(r.damage)<=0)return {attempted:false,applied:false};
  if(!(type==='poison'||type==='deepPoison'||type==='sleep'||type==='stone'||type==='confusion'||type==='drunk')){
    return {attempted:false,applied:false,unsupportedType:type||null};
  }
  // BATTLE_Attack() 已先 DamageWakeUp，再進 gBattleStausChange 的 StatusAttackCheck。
  const check=battleStatusChance({kind:'enemy',unit,unitId:unit.id},targetDesc,type);
  let applied=false,storedTurns=0;
  if(check.allowed&&check.success){
    if(type==='drunk'){
      // BATTLE_Attack：先 StatusTbl[DRUNK] = gBattleStausTurn + 1，
      // 接著誤把 CHAR_WORKDRUNK 本身 /2；C int division 對正整數直接截斷。
      storedTurns=Math.trunc((Math.max(0,Math.trunc(n(turn)))+1)/2);
      if(storedTurns>0)applied=battleStatusApplyRaw(targetDesc,type,storedTurns);
    }else{
      storedTurns=Math.max(1,Math.trunc(n(turn))+1);
      applied=battleStatusApply(targetDesc,type,turn);
    }
  }
  if(applied){
    addLog(battleStatusDescName(targetDesc)+' 陷入'+BATTLE_STATUS_NAMES[type]+'（原檢定 '+check.per.toFixed(1)+'%）。','bad');
  }else{
    addLog(label+' 的'+BATTLE_STATUS_NAMES[type]+'效果未成功'+(check.reason==='existing'?'：目標已有其他異常狀態。':'（原檢定 '+n(check.per).toFixed(1)+'%）。'));
  }
  return {attempted:true,check,applied,type,turn,storedTurns};
}
function performEnemyStatusChange(actor,unit,options,meta){
  unit.counterEligibleThisTurn=true;
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId};
  const type=battleStatusTypeFromOption(meta?.o);
  const turn=battleStatusTurnFromOption(meta?.o);
  const label=meta?.n||'狀態攻擊';
  const weaponType=Math.trunc(n(unit?.weaponType));

  // 原 BATTLE_COM_S_STATUSCHANGE 先把 gBattleStausChange 改成技能狀態，
  // 再落入普通 physical common weapon loop。每一次真正 BATTLE_Attack 都會：
  // damage/wakeup -> status check -> ItemCrush，然後才回到 outer attack_count loop。
  const afterHit=hit=>sourceEnemyApplyStatusAttackHit(
    unit,hit.targetDesc,hit.r,type,turn,label
  );

  if(weaponType===4||weaponType===18||weaponType===19){
    // BOW / BOUNDTHROW / BREAKTHROW 沿既有 ranged common loop。
    // BREAKTHROW 的預設 paralysis 已被 STATUSCHANGE 的 gBattleStausChange 覆蓋。
    const seq=weaponType===4
      ?performEnemyBowWeaponAttack(actor,unit,Object.assign({},options,{afterHit}))
      :performEnemyThrowWeaponAttack(actor,unit,Object.assign({},options,{afterHit,breakthrowStatus:false}));
    const counter=sourceEnemyFinalizeWeaponSequenceCounter(unit,seq,options,{requireCanMove:true});
    return {
      kind:'skill',skillId:actor.skillId,statusType:type,weaponSequence:true,
      target:chosen.kind,sequence:seq,hits:seq?.hits||[],counter
    };
  }

  // Non-BOW including skill-held BOOMERANG also uses the source AttackNum loop.
  // Every segment restores raw COM2 and reruns TargetAdjust; BOOMERANG is NOT converted
  // to the special BO row command because the original COM was STATUSCHANGE, not ATTACK.
  const seq=sourceEnemyCommonNonRangedSkillSequence(
    actor,unit,
    Object.assign({},options,{
      afterHit,
      counterRules:{requireCanMove:true}
    }),
    label
  );
  return {
    kind:'skill',skillId:actor.skillId,statusType:type,weaponSequence:true,
    target:chosen.kind,sequence:seq,hits:seq?.segments||[],
    r:seq?.r||null
  };
}
function sourceEnemyCommonNonRangedSkillSequence(actor,unit,options={},label='攻擊'){
  const weaponType=Math.trunc(n(unit?.weaponType));
  const primedMax=Number(actor?.sourceAttackMax);
  const attackMax=Number.isFinite(primedMax)&&primedMax>0
    ?Math.trunc(primedMax)
    :sourceEnemyBattleAttackMax(unit);

  const attackOptions=Object.assign({},options.attackOptions||{});
  const beforeApply=typeof options.beforeApply==='function'?options.beforeApply:null;
  const afterHit=typeof options.afterHit==='function'?options.afterHit:null;
  const counterRules=options.counterRules&&typeof options.counterRules==='object'
    ?options.counterRules:{};

  // fixed battle.c：只有「有效武器的 BATTLE_GetAttackCount() > 0」且 gWeponType==ITEM_FIST
  // 才把 gDamageDiv 設成 attack_max。Enemy 空手的 fallback 1 擊不走這個除數。
  if(weaponType===0&&actor?.sourceAttackCountWeaponRoll&&attackMax>0
    &&!Number.isFinite(Number(attackOptions.damageDivisor))){
    attackOptions.damageDivisor=attackMax;
  }

  const segments=[];
  let attackCount=0;
  let lastTarget=null;
  let lastActualTarget=null;
  let lastResult=null;
  let sourcePostTarget=null;
  let sourceCounterReady=false;
  let sourceLoopExit='no-target';

  // Non-BOW TargetListSet fills aDefList with the original COM2 repeatedly.
  // Every segment writes that raw slot back, then reruns BATTLE_TargetAdjust.
  while(attackCount<attackMax&&enemy&&n(unit.hp)>0){
    const target=enemyActorTarget(actor,unit);
    if(!target){
      sourcePostTarget=null;
      sourceLoopExit='target-adjust-failed';
      break;
    }

    let r,actualTarget=target,beforeApplyResult=null,afterHitResult=null;
    if(target.kind==='pet'&&target.pet&&petIsBattleActive(target.pet)){
      r=enemyAttackPetResult(unit,target.pet,attackOptions);
      actualTarget={kind:'pet',pet:target.pet,petId:target.pet.id};
      if(beforeApply)beforeApplyResult=beforeApply({target:'pet',pet:target.pet,targetDesc:actualTarget,r},target);
      enemyApplySkillHit(unit,target,r,label+'第 '+(attackCount+1)+'/'+attackMax+' 段');
      // fixed BATTLE_Attack(): DamageSub / WakeUp -> gBattleStausChange -> ItemCrush.
      if(afterHit)afterHitResult=afterHit({
        target:'pet',pet:target.pet,targetDesc:actualTarget,r
      },target);
      sourceBattleFinalizeItemCrushRng(r);
      sourceProcessBattleDeathsAtAddProfit();
    }else if(target.kind==='player'&&state.hp>0){
      const guarding=!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
      r=resolveEnemyDirectAttackToPlayer(unit,Object.assign({},attackOptions,{guarding}));
      actualTarget=enemyDirectActualTarget(target,r)||target;
      if(beforeApply)beforeApplyResult=beforeApply({
        target:'player',targetDesc:actualTarget,r,guardianPetId:r?.guardianPetId||null
      },target);
      actualTarget=enemyApplyDirectGuardianSkillHit(
        unit,target,r,label+'第 '+(attackCount+1)+'/'+attackMax+' 段',
        {finalizeItemCrush:false}
      )||actualTarget;
      if(afterHit)afterHitResult=afterHit({
        target:'player',targetDesc:actualTarget,r,
        guardianPetId:r?.guardianPetId||null
      },target);
      sourceBattleFinalizeItemCrushRng(r);
      sourceProcessBattleDeathsAtAddProfit();
    }else{
      sourcePostTarget=null;
      sourceLoopExit='attack-failed';
      break;
    }

    attackCount++;
    lastTarget=target;
    lastActualTarget=actualTarget;
    lastResult=r;
    sourcePostTarget=target;
    segments.push({
      target:target.kind,petId:target.pet?.id||null,
      actualTarget:actualTarget?.kind||target.kind,
      actualPetId:actualTarget?.petId||actualTarget?.pet?.id||null,
      guardianPetId:r?.guardianPetId||null,r,beforeApply:beforeApplyResult,afterHit:afterHitResult
    });

    // fixed common loop breaks immediately after ++attack_count reaches attack_max;
    // defNo therefore remains the last real target for the following Counter/post checks.
    if(attackCount>=attackMax){
      sourceCounterReady=true;
      sourceLoopExit='attack-max';
      break;
    }
    // Attacker death is checked before loading aDefList[++k], so source defNo remains lastTarget.
    if(n(unit.hp)<=0){
      sourceLoopExit='attacker-dead';
      break;
    }
  }

  // Counter uses the last primary BATTLE_Attack result / outer defNo only.
  // STATUSCHANGE's status happens inside BATTLE_Attack before this outer loop:
  // if it immobilized the real hit target, Counter cannot begin.
  const counterTargetCanMove=!counterRules.requireCanMove
    ||!lastActualTarget
    ||battleStatusCanMove(lastActualTarget);
  if(sourceCounterReady&&counterTargetCanMove&&lastResult&&lastTarget&&n(unit.hp)>0&&enemy){
    if(lastTarget.kind==='pet'&&lastTarget.pet&&petIsBattleActive(lastTarget.pet)){
      resolvePetEnemyCounterChain('enemy',lastTarget.pet,unit,lastResult);
    }else if(lastTarget.kind==='player'&&state.hp>0&&options.allowPlayerCounter){
      resolvePlayerEnemyCounterChain('enemy',unit,lastResult);
    }
  }

  return {
    target:segments[0]?.target||null,
    pet:segments[0]?.petId?state.petBox.find(p=>p.id===segments[0].petId)||null:null,
    r:lastResult,
    weaponCommand:'COMMON',
    weaponItemId:unit.equippedWeaponId,
    weaponType,attackMax,attackCount,segments,
    sourcePostTarget,sourceCounterReady,sourceLoopExit,counterTargetCanMove,
    sourceFistDamageDiv:Number.isFinite(Number(attackOptions.damageDivisor))
      ?Number(attackOptions.damageDivisor):1
  };
}
function sourceEnemyCommonSkillAttack(actor,unit,options={},label='攻擊'){
  const weaponType=Math.trunc(n(unit?.weaponType));
  // BOW / BOUNDTHROW / BREAKTHROW already have source-accurate common-loop helpers.
  if(weaponType===4||weaponType===18||weaponType===19){
    return performEnemyPrimaryAttack(actor,unit,options);
  }
  // BOOMERANG is intentionally included here: only plain ATTACK is converted to the
  // special BO command. Skill commands stay in the ordinary non-BOW common loop.
  return sourceEnemyCommonNonRangedSkillSequence(actor,unit,options,label);
}
function sourceEnemyShowMercyBeforeApply(hit){
  const r=hit?.r,targetDesc=hit?.targetDesc;
  if(!r||!targetDesc||r.dodged||r.miss||n(r.damage)<=0)return {clamped:false,originalDamage:Math.max(0,Math.trunc(n(r?.damage)))};
  const hp=Math.max(0,Math.trunc(n(battleStatusHp(targetDesc))));
  const originalDamage=Math.max(0,Math.trunc(n(r.damage)));
  if(hp-originalDamage<=0){
    r.damage=Math.max(0,hp-1);
    r.showMercyClamped=true;
    r.showMercyOriginalDamage=originalDamage;
    return {clamped:true,hp,originalDamage,damage:r.damage};
  }
  return {clamped:false,hp,originalDamage,damage:originalDamage};
}
function performEnemyShowMercy(actor,unit,options,meta){
  const label=meta?.n||'手下留情';
  unit.counterEligibleThisTurn=false;
  const result=sourceEnemyCommonSkillAttack(actor,unit,Object.assign({},options,{beforeApply:sourceEnemyShowMercyBeforeApply}),label)||{};
  return Object.assign({kind:'skill',skillId:actor.skillId,showMercy:true},result);
}
function performEnemySars(actor,unit,options,meta){
  const label=meta?.n||'毒煞蔓延',turn=3;
  unit.counterEligibleThisTurn=true;
  const afterHit=hit=>sourceEnemyApplyStatusAttackHit(unit,hit.targetDesc,hit.r,'sars',turn,label);
  const result=sourceEnemyCommonSkillAttack(actor,unit,Object.assign({},options,{afterHit,breakthrowStatus:false}),label)||{};
  return Object.assign({kind:'skill',skillId:actor.skillId,statusType:'sars',turn},result);
}
function performEnemyPowerBalance(actor,unit,options,meta){
  const attackPct=enemySignedSkillPercent(meta?.o,'攻%');
  const defensePct=enemySignedSkillPercent(meta?.o,'防%');
  const label=meta?.n||'背水之戰';
  addLog(unit.name+' 使用 '+label+'（攻 '+(attackPct>=0?'+':'')+attackPct+'%／防 '+(defensePct>=0?'+':'')+defensePct+'%）。');
  // PETSKILL_PowerBalance 已在 AI 決定技能時修改當輪 WORKATTACK/DEFENCE；
  // battle.c 之後仍落入完整 common direct-attack loop，不是固定單擊。
  unit.counterEligibleThisTurn=true;
  return Object.assign(
    {kind:'skill',skillId:actor.skillId,attackPct,defensePct},
    sourceEnemyCommonSkillAttack(actor,unit,options,label)||{}
  );
}
function performEnemyNoGuard(actor,unit,options,meta){
  addLog(unit.name+' 使用 '+(meta?.n||'不防守戰法')+'：本回合不主動攻擊，回避 +'+n(unit.noGuardDuckBonus)+'、反擊 +'+n(unit.noGuardCounterBonus)+'。');
  // 原 BATTLE_COM_S_NOGUARD 自己 NoAction，但 BATTLE_Counter() 明確允許它反擊。
  return {kind:'skill',skillId:actor.skillId,noGuard:true};
}
function performEnemyMighty(actor,unit,options,meta){
  unit.counterEligibleThisTurn=true;
  const multiplier=Math.max(0,enemySkillNumber(meta?.o,/倍\s*([0-9.]+)/,2));
  const duckBonus=Math.max(0,enemySkillNumber(meta?.o,/回避\s*([0-9.]+)/,0));
  const label=meta?.n||'一擊必殺';
  addLog(unit.name+' 使用 '+label+'（傷害 ×'+multiplier+'／目標回避 +'+duckBonus+'）。');
  const attackOptions=Object.assign({},options.attackOptions||{},{
    damageMultiplier:multiplier,duckBonusPercent:duckBonus
  });
  return Object.assign(
    {kind:'skill',skillId:actor.skillId,multiplier,duckBonus},
    sourceEnemyCommonSkillAttack(
      actor,unit,Object.assign({},options,{attackOptions}),label
    )||{}
  );
}
function performEnemyContinuation(actor,unit,options,meta){
  unit.counterEligibleThisTurn=true;
  const count=clamp(Math.trunc(enemySkillNumber(meta?.o,/^\s*(\d+)/,1)),1,10);
  const label=meta?.n||'連續攻擊';
  addLog(unit.name+' 使用 '+label+'（'+count+' 段）。');

  const weaponType=Math.trunc(n(unit?.weaponType));
  if(weaponType===4||weaponType===18||weaponType===19){
    // 原 BATTLE_COM_S_RENZOKU 在共用 weapon loop 前把：
    // attack_max = 技能段數；gDamageDiv = 技能段數。
    // BOW 因此仍走 aBowW，BOUND/BREAKTHROW 則沿同一目標重複投擲；
    // BREAKTHROW 的預設麻痺沒有被 RENZOKU 覆寫，所以每次正傷害都可嘗試麻痺。
    const seqOptions=Object.assign({},options,{
      attackMaxOverride:count,
      attackOptions:Object.assign({},options.attackOptions||{},{damageDivisor:count})
    });
    const seq=weaponType===4
      ?performEnemyBowWeaponAttack(actor,unit,seqOptions)
      :performEnemyThrowWeaponAttack(actor,unit,seqOptions);
    const counter=sourceEnemyFinalizeWeaponSequenceCounter(unit,seq,options);
    return {
      kind:'skill',skillId:actor.skillId,hits:seq?.attackCount??seq?.hits?.length??0,
      lastResult:seq?.r||null,weaponSequence:true,sequence:seq,counter
    };
  }

  // BOOMERANG 不會被前置 ATTACK-only switch 轉成 BATTLE_COM_BOOMERANG，
  // 因而和近戰相同：固定目標連續 N 段、每段 /N；最後一次結果才決定 Counter loop。
  let chosen=null;
  let lastResult=null,lastChosen=null,hits=0;
  for(let step=0;step<count;step++){
    if(!enemy||unit.hp<=0||state.hp<=0)break;

    // TargetListSet filled non-BOW aDefList with the original COM2; every segment restores
    // that slot and executes TargetAdjust. If the raw target is hidden/dead, each segment
    // therefore consumes its own BATTLE_DefaultAttacker RAND.
    chosen=enemyActorTarget(actor,unit);
    if(!chosen)break;

    let r;
    if(chosen.kind==='pet'&&chosen.pet){
      r=enemyAttackPetResult(unit,chosen.pet,{damageDivisor:count});
      hits++;
      lastResult=r;
      lastChosen=chosen;
      enemyApplySkillHit(unit,chosen,r,label+'第 '+hits+'/'+count+' 段');
      sourceBattleFinalizeItemCrushRng(r);
    }else{
      const guarding=!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
      r=resolveEnemyDirectAttackToPlayer(unit,{guarding,damageDivisor:count});
      hits++;
      lastResult=r;
      lastChosen=chosen;
      enemyApplyDirectGuardianSkillHit(unit,chosen,r,label+'第 '+hits+'/'+count+' 段');
    }

    sourceProcessBattleDeathsAtAddProfit();
    if(state.hp<=0)break;
    if(chosen.kind==='pet'&&chosen.pet&&!petIsBattleActive(chosen.pet)){
      chosen=null;
    }
  }

  if(lastResult&&unit.hp>0&&enemy){
    if(lastChosen?.kind==='pet'&&lastChosen.pet&&petIsBattleActive(lastChosen.pet)){
      resolvePetEnemyCounterChain('enemy',lastChosen.pet,unit,lastResult);
    }else if(lastChosen?.kind==='player'&&state.hp>0&&options.allowPlayerCounter){
      resolvePlayerEnemyCounterChain('enemy',unit,lastResult);
    }
  }
  return {kind:'skill',skillId:actor.skillId,hits,lastResult};
}
function performEnemyAction(actor,unit,options={}){
  const kind=actor?.enemyAction||'attack';
  const foxGate=sourceEnemyFoxCommandGate(unit,actor);
  if(foxGate.blocked)return {kind:'none',foxBlocked:true,sourceFoxTurn:unit.sourceFoxTurn};
  if(kind==='charge')return performEnemyChargeState(actor,unit,options);
  if(kind==='earthround')return performEnemyEarthRoundRelease(actor,unit,options);
  if(kind==='guard'){
    addLog(unit.name+' 採取防禦姿勢。');
    return {kind:'guard'};
  }
  if(kind==='escape')return Object.assign({kind:'escape'},enemyEscapeAttempt(unit));
  if(kind==='none'){
    addLog(unit.name+' 這回合沒有行動。');
    return {kind:'none'};
  }
  if(kind==='magic'){
    // 正常 enemyChooseAction 已把 B_AI_MAGICMODE 精確轉成 source C_WAIT；此分支只保留防禦性 fallback。
    addLog(unit.name+' 收到非來源流程的 magic action；原 BATTLE_ai_normal() 沒有 B_AI_MAGICMODE handler，本回合不執行魔法。');
    return {kind:'magic',sourceUnhandledMagicMode:true};
  }
  if(kind==='skill'){
    const meta=enemyPetSkillMeta(actor.skillId);
    if(ENEMY_SOURCE_RUNTIME_BLOCKED_SKILL_IDS.has(Number(actor.skillId))){
      const id=Number(actor.skillId);
      let reason='需要原 server 全域 runtime，現版不能靜態唯一決定效果。';
      if(id===211){
        reason='原 Enemy WORKPLAYERINDEX 預設為 0；CHAR allocator 的玩家區從 index 0 開始，因此 slot 0 當下是否為有效玩家取決於原 server 在線角色配置。';
      }else if(id===676){
        reason='原 option 的 item 20900 對 Enemy 直接當 ITEM_item[20900] existing index；該 slot 的 ITEM_MAGICUSEMP 取決於原 server 當下全域物件配置。';
      }else if(id===688){
        reason='原 option 的 item 20912 對 Enemy 直接當 ITEM_item[20912] existing index；該 slot 的 ITEM_MAGICUSEMP 取決於原 server 當下全域物件配置。';
      }
      addLog(unit.name+' 使用 '+(meta?.n||('PetSkill '+id))+'；'+reason+' 保留原 AI 權重與本回合 StatusSeq，但不猜效果、不替換成普通攻擊。');
      return {kind:'skill',skillId:id,sourceRuntimeBlocked:true,reason};
    }
    if(meta?.f==='PETSKILL_GuardBreak')return performEnemyGuardBreak(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_ContinuationAttack')return performEnemyContinuation(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Mighty')return performEnemyMighty(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_PowerBalance')return performEnemyPowerBalance(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_NoGuard')return performEnemyNoGuard(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_StatusChange')return performEnemyStatusChange(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Sars')return performEnemySars(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_ChargeAttack')return performEnemyChargeAttack(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_EarthRound')return performEnemyEarthRoundStart(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_FallGround')return performEnemyFallGround(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Steal')return performEnemySteal(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_DamageToHp')return performEnemyDamageToHp(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_DamageToHp2')return performEnemyDamageToHp2(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_MpDamage')return performEnemyMpDamage(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_ToothCrushe')return performEnemyToothCrushe(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_StealMoney')return performEnemyStealMoney(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_AttackMagic')return performEnemyAttackMagic(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Firekill')return performEnemyFirekill(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Lighttakeed')return performEnemyLighttakeed(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_BecomePig')return performEnemyBecomePig(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_BecomeFox')return performEnemyBecomeFox(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_ShowMercy')return performEnemyShowMercy(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Sacrifice')return performEnemySacrifice(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_BattleTimid')return performEnemyBattleTimid(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_2BattleTimid')return performEnemy2BattleTimid(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Refresh')return performEnemyRefresh(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_BattleModel')return performEnemyBattleModel(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Modifyattack')return performEnemyModifyAttack(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Mdfyattack')return performEnemyMdfyAttack(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Sonic')return performEnemySonic(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Gyrate')return performEnemyGyrate(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Retrace')return performEnemyRetrace(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Weaken')return performEnemyWeaken(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Deeppoison')return performEnemyDeepPoison(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_MagicStatusChange')return performEnemyMagicStatusChange(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_SetMagicPet')return performEnemySetMagicPet(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_SetDuck')return performEnemySetDuck(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Nocast')return performEnemyNocast(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Barrier')return performEnemyBarrier(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_BatFly')return performEnemyBatFly(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Combined')return performEnemyCombined(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_DivideAttack')return performEnemyDivideAttack(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_AttackCrazed')return performEnemyAttackCrazed(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_AttackShoot')return performEnemyAttackShoot(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Hector')return performEnemyHector(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Acupuncture')return performEnemyAcupuncture(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_SpeedyAttack')return performEnemySpeedyAttack(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_BattleTearDamage')return performEnemyTear(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Regret')return performEnemyRegret(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_WildViolentAttack')return performEnemyWildViolent(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_GuardBreak2')return performEnemyGuardBreak2(actor,unit,options,meta);
    if(meta?.f==='ENEMYSKILL_ReLife')return performEnemyReLife(actor,unit,options,meta);
    if(meta?.f==='ENEMYSKILL_ReHP')return performEnemyReHP(actor,unit,options,meta);
    if(meta?.f==='ENEMYSKILL_EnemyHelp'||meta?.f==='ENEMYSKILL_EnemyHELP')return performEnemyHelp(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Abduct')return performEnemyAbduct(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Guardian')return performEnemyGuardianAttack(actor,unit,options,meta);
    if(meta?.f==='PETSKILL_Merge'){
      addLog(unit.name+' 嘗試使用 '+(meta?.n||'加工')+'，但原 PETSKILL_Merge 在戰鬥中會直接 return FALSE；本回合沒有戰鬥效果。');
      return {kind:'skill',skillId:actor.skillId,sourceRejected:true};
    }

    const label=meta?.n||('PetSkill '+(actor.skillId??'—'));
    addLog(unit.name+' 使用 '+label+'；此特殊寵技效果尚未接入，保留原 AI 權重但本回合不以普通攻擊替代。');
    return {kind:'skill',unsupported:true,skillId:actor.skillId};
  }
  const attackOptions=foxGate.forceFist?Object.assign({},options,{sourceForceFist:true}):options;
  return Object.assign({kind:'attack'},performEnemyPrimaryAttack(actor,unit,attackOptions)||{});
}
function levelCheck(){
  let upCount=0;
  const cap=playerLevelCap();
  while(state.level<cap){
    const need=expToNext(state.level);
    if(need<=0||state.exp<need)break;
    state.exp-=need;state.level++;
    state.duelPoint=Math.max(0,Math.trunc(n(state.duelPoint)))+state.level*10;
    upCount++;
  }
  state.expNext=expToNext(state.level);
  if(upCount){
    const perLevel=Math.max(0,Math.trunc(n(encounterRuntime?.progression?.playerSkillPointsPerLevel)||3));
    state.skillPoints=Math.max(0,Math.trunc(n(state.skillPoints)))+upCount*perLevel;
    state.charm=Math.min(100,Math.max(0,n(state.charm))+Math.max(0,Math.trunc(n(encounterRuntime?.progression?.playerCharmPerBattleWithLevelup)||2)));
    addLog('升級！目前 Lv.'+state.level+'；取得能力點 '+(upCount*perLevel)+'，魅力調整為 '+state.charm+'。','good');
  }
}
function createCapturedPet(target=targetEnemyUnit()){
  const v=enemy?.entry?.variant||{};
  const pet={
    id:uid(),
    name:target?.name||enemy?.name||v.serverName||'寵物',
    animationGroupId:target?.animationGroupId??enemy?.entry?.species?.animationGroupId??null,
    tempNo:target?.tempNo??v.tempNo??null,
    level:target?.level||enemy?.level||1,exp:0,
    wildGrowth:n(target?.wildGrowth??v.wildGrowth),
    stats:Object.assign({},target?.stats||v.stats||{}),
    elements:Object.assign({},target?.elements||v.elements||{}),
    petSkills:Array.isArray(target?.petSkills)?target.petSkills.slice():[],
    statusResist:Array.isArray(target?.statusResist)?target.statusResist.slice(0,6):[0,0,0,0,0,0],
    serverStats:target?.serverDerived?.charStats?Object.assign({},target.serverDerived.charStats):null,
    // 原 PET_createPetFromCharaIndex 不複製 Enemy 裝備；捕獲寵只保留裸 CHAR 能力，不把 STYLE／道場武器加成帶走。
    serverCombat:target?.serverDerived?{attack:target.serverDerived.attack,defense:target.serverDerived.defense,quick:target.serverDerived.quick,maxHp:target.serverDerived.maxHp}:null,
    allocPointPacked:target?.allocatedFrom?packPetAllocPoint(target.allocatedFrom):null,
    petRank:target?.enemyExpRankIndex!=null&&Number.isFinite(Number(target.enemyExpRankIndex))?Math.trunc(Number(target.enemyExpRankIndex)):null,
    serverProgression:!!(target?.serverDerived&&target?.allocatedFrom&&target?.enemyExpRankIndex!=null&&Number.isFinite(Number(target.enemyExpRankIndex))),
    serverInitNum:target?.serverInitNum??null,serverLvUpPoint:target?.serverLvUpPoint??null,
    petGetLv:target?.level||enemy?.level||1,
    variableAi:0,
    capturedAt:Date.now()
  };
  if(n(target?.maxHp)>0)pet.maxHp=Math.max(1,Math.trunc(n(target.maxHp)));
  syncPetBattleHp(pet,true);
  if(target&&Number.isFinite(Number(target.hp)))pet.hp=clamp(Math.trunc(n(target.hp)),0,pet.maxHp);
  sourceApplyCapturedPetInitialAi(pet);
  return pet;
}
function addCapturedPet(target=targetEnemyUnit()){
  const pet=createCapturedPet(target);
  state.petBox.push(pet);
  if(!state.team.some(Boolean)){
    state.team[0]=pet.id;
    state.activePetId=pet.id;
    addLog(pet.name+' 已自動加入隊伍並設為出戰。','pet');
  }else{
    const open=state.team.findIndex(x=>!x);
    if(open>=0){
      state.team[open]=pet.id;
      addLog(pet.name+' 已自動加入隊伍第 '+(open+1)+' 格。','pet');
    }
  }
  return pet;
}
function captureRequirements(target=targetEnemyUnit()){
  const rule=enemy?.dynamicGroup?target?.captureRule:enemy?.entry?.variant?.captureRule;
  const items=rule?.requiresAllItems||[];
  const missing=items.filter(x=>!hasItem(x.id));
  return {rule,items,missing,allowed:missing.length===0};
}
function captureChance(){
  if(!enemy)return {raw:0,display:0,allowed:false,missing:[]};
  const target=targetEnemyUnit();
  if(!target)return {raw:0,display:0,allowed:false,missing:[]};
  if(enemy.groupBattle&&!enemy.dynamicGroup)return {raw:0,display:0,allowed:false,missing:[],uncapturable:true,groupBattle:true};
  const capturable=enemy.dynamicGroup?target.capturable:(enemy.entry?.variant?.capturable!==false);
  if(!capturable)return {raw:0,display:0,allowed:false,missing:[],uncapturable:true,groupBattle:enemy.groupBattle,targetName:target.name};
  const req=captureRequirements(target);
  if(!req.allowed)return {raw:0,display:0,allowed:false,missing:req.missing,requirements:req.items,targetName:target.name};
  if(state.level+5<target.level)return {raw:0,display:0,allowed:false,missing:[],requirements:req.items,targetName:target.name};

  // fixed BATTLE_CaptureCheck 使用雙方 CHAR_WORKFIXDEX。
  // 實際捕獲判定在 normalBattleOrder() 的 PreCommand snapshot 後再次計算，因此 Enemy 可直接讀 roundFixQuick；
  // 顯示用的預先查詢尚未建立本輪 snapshot 時則退回 compliant quick。
  // fixed BATTLE_CaptureCheck 雖然來源值來自 CHAR int/work-int，
  // 但 Df_HpPer / At_Level / Df_Level / At_Dex / Df_Dex / WorkGet 全都宣告為 float。
  // 因此 HP²/MAXHP、等級 /2、敏捷 /15 與最後 *Charm/50 都必須保留小數。
  const enemyDex=Math.trunc(n(target.roundFixQuick??target.quick));
  const playerDex=Math.trunc(n(playerBattleView().fixedDex));
  const captureBase=Math.trunc(enemy.dynamicGroup?n(target.captureBase):n(enemy.entry.variant?.captureBase));
  const maxHp=Math.max(1,Math.trunc(n(target.maxHp)));
  const hp=Math.trunc(n(target.hp));
  const playerLevel=Math.trunc(n(state.level));
  const targetLevel=Math.trunc(n(target.level));
  const luck=Math.trunc(n(state.luck));
  const charm=Math.trunc(n(state.charm));

  const hpTerm=10-(hp*hp)/maxHp;
  const levelTerm=playerLevel/2-targetLevel/2;
  const dexTerm=playerDex/15-enemyDex/15;
  const workSum=hpTerm+levelTerm+dexTerm+(captureBase+luck);

  // 現行 web 尚未有 CHAR_WORKMODCAPTURE 的可靠來源，等價 fixed runtime 預設 0。
  const captureMod=0;
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const sleepBonus=battleStatusActive(targetDesc,'sleep')?15:0;
  let raw=workSum*charm/50+captureMod+sleepBonus;
  if(raw>99)raw=99;

  return {
    raw,display:clamp(raw,0,99),allowed:true,missing:[],requirements:req.items,targetName:target.name,
    detail:{hpTerm,levelTerm,dexTerm,captureBase,captureMod,sleepBonus}
  };
}
function captureTurn(manual=false){
  if(!enemy)return false;
  const initial=captureChance();
  if(!initial.allowed){
    if(initial.missing?.length){
      addLog('無法捕獲 '+enemy.name+'：缺少 '+initial.missing.map(x=>x.name||('Item '+x.id)).join('、')+'。','bad');
    }else{
      addLog('目前條件無法捕獲 '+enemy.name+'。','bad');
    }
    render();
    return false;
  }

  const order=normalBattleOrder({playerCommand:'capture'});
  let captured=false;
  for(const actor of order){
    sourceProcessBattleActorOuterBoundary();
    if(!enemy)return captured;
    if(sourceDeadBattleEntry(actor))continue;
    if(sourceEnemyCWait(actor))continue;
    // fixed BATTLE_COM_COMBO 會在 leader case 直接推進 EntryList index，
    // 已被 leader 吃掉的 combo member 不會回到外層再跑第二次 StatusSeq。
    if(actor.sourceComboConsumed)continue;
    sourceMarkBattleActorOuterAddProfit();
    const statusTurn=processBattleStatusTurn(actor);
    // fixed BATTLE_Battling(): after StatusSeq / CanMoveCheck, every C_OK actor reaches
    // BATTLE_GetAttackCount() before the command switch. A valid CHAR_ARM therefore consumes
    // its RAND(min,max) even for GUARD / ESCAPE / NONE / magic / immobilized turns.
    if(actor.kind==='player')sourcePlayerPrimeExecutionAttackCount(actor);
    else if(actor.kind==='enemy')sourceEnemyPrimeExecutionAttackCount(actor);
    if(statusTurn.skip){
      sourceCancelPetChargeFromStatus(statusTurn);
      sourceCancelPetEarthRoundFromStatus(statusTurn);
      if(statusTurn.desc?.kind==='enemy'&&statusTurn.desc.unit?.chargeState){
        statusTurn.desc.unit.chargeState=null;
        statusTurn.desc.unit.counterEligibleThisTurn=false;
        addLog(statusTurn.desc.unit.name+' 的蓄力被異常狀態中斷。');
      }
      if(statusTurn.desc?.kind==='enemy'&&statusTurn.desc.unit?.earthRoundState){
        statusTurn.desc.unit.earthRoundState=null;
        statusTurn.desc.unit.counterEligibleThisTurn=false;
        addLog(statusTurn.desc.unit.name+' 的地球一周被異常狀態中斷，重新現身。');
      }
      addLog((statusTurn.desc?.kind==='player'?'你':statusTurn.desc?.pet?.name||statusTurn.desc?.unit?.name||'目標')+' 因'+(BATTLE_STATUS_NAMES[statusTurn.status?.type]||'異常狀態')+'無法行動。');
      if(enemy)syncEnemyTarget();
      continue;
    }
    if(actor.kind==='pet'){
      const petPre=sourcePetPreCommandAction(actor,statusTurn,{playerGuarding:false,allowPlayerCounter:false});
      if(petPre.handled){
        if(enemy)syncEnemyTarget();
        sourceProcessBattleActorOuterBoundary();
        continue;
      }
    }else{
      if(statusTurn.confusionAttack){
        performConfusionAttack(actor,statusTurn,{playerGuarding:false,allowPlayerCounter:false});
        if(enemy)syncEnemyTarget();
        sourceProcessBattleActorOuterBoundary();
        continue;
      }
      if(sourceSurpriseSkipAction(actor))continue;
    }

    if(actor.kind==='player'){
      const target=sourceFriendlyEnemyTargetAdjust(actor);
      if(!target){
        if(livingEnemyUnits().length)addLog('敵方目前都在地球一周的繞背狀態，暫時沒有可指定的目標。');
        continue;
      }
      const c=captureChance();
      if(!c.allowed||c.display<=0){
        addLog('捕獲失敗：目前捕獲率為 '+Math.max(0,n(c.display)).toFixed(1)+'%。','bad');
      }else if(cRand(1,100)<c.raw){
        // fixed BATTLE_CaptureCheck：RAND(1,100) < WorkGet，為嚴格小於；
        // 例如 WorkGet=20 實際成功 roll 是 1..19。
        const pet=addCapturedPet(target);
        // 原 PET_createPetFromCharaIndex 不複製 Enemy item；Enemy BATTLE_Exit/清理後其 carried/style 全釋放。
        releaseEnemyRuntimeItems(target);
        // fixed _CAPTURE_FREES -> BATTLE_CaptureItemDelAll：
        // 成功捕獲後會掃完整個道具欄，對每個必要 ItemId 刪除所有匹配 slot；
        // 原碼刻意沒有 break（註解也寫「最後還是決定全刪」），不是只消耗 1 個。
        const consumedCaptureItems=[];
        for(const item of c.requirements||[]){
          const before=Math.max(0,Math.trunc(n(state.inventory[String(item.id)])));
          if(before>0){
            consumeItem(item.id,before);
            consumedCaptureItems.push({id:item.id,name:item.name||('Item '+item.id),count:before});
          }
        }
        if(consumedCaptureItems.length){
          addLog('原版捕獲條件道具全部消耗：'+consumedCaptureItems.map(x=>x.name+' ×'+x.count).join('、')+'。');
        }
        addLog('捕獲成功：'+pet.name+'（'+c.display.toFixed(1)+'%）。','good');
        captured=true;

        if(enemy.dynamicGroup&&Array.isArray(enemy.units)){
          enemy.units=enemy.units.filter(u=>u.id!==target.id);
          if(!enemy.units.length){
            clearEnemyBattleNoReward();
            save();render();
            return true;
          }
          syncEnemyTarget();
        }else{
          // 靜態 formation 捕獲會直接結束整場；除 target 外，其餘 Enemy 也必須走 CHAR_endCharOneArray 等價釋放。
          clearEnemyBattleNoReward();
          save();render();
          return true;
        }
      }else{
        addLog('捕獲失敗：'+target.name+'（'+c.display.toFixed(1)+'%）。','bad');
      }
    }else if(actor.kind==='pet'){
      const pet=activePet();
      if(!pet||pet.id!==actor.petId||!petIsBattleActive(pet))continue;
      const target=sourceFriendlyEnemyTargetAdjust(actor);
      if(!target){
        if(livingEnemyUnits().length)addLog('敵方目前都在地球一周的繞背狀態，暫時沒有可指定的目標。');
        continue;
      }
      sourceRevealPetForDirectAttack(pet);
      const r=petAttackResult(pet,target);
      const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
      sourceProcessBattleDeathsAtAddProfit();
      if(petIsBattleActive(pet)&&actual?.hp>0)resolvePetEnemyCounterChain('pet',pet,actual,r);
    }else if(actor.kind==='enemy'){
      const unit=livingEnemyUnits().find(u=>u.id===actor.unitId);
      if(!unit)continue;
      performEnemyAction(actor,unit,{playerGuarding:false,allowPlayerCounter:false});
    }

    sourceProcessBattleActorOuterBoundary();
    if(enemy)syncEnemyTarget();
  }

  sourceProcessBattleActorOuterBoundary();
  if(!enemy){return captured;}
  if(state.hp<=0){defeat();return captured;}
  if(!livingEnemyUnits().length){winBattle();return captured;}
  syncEnemyTarget();battleFieldTick();
  save();render();
  return captured;
}
function winBattle(){
  sourceProcessPendingPetBattleDeaths();
  const defeated=enemy;
  const units=(Array.isArray(defeated?.units)&&defeated.units.length)?defeated.units:[defeated];
  const unitCount=Math.max(1,units.length);
  const serverResolved=units.length>0&&units.every(u=>u?.serverExpBase!=null);
  let exp=0,petExp=0;
  const petExpById=new Map();
  const active=activePet();
  const fallbackPet=active&&petIsBattleActive(active)?active:null;

  if(serverResolved){
    // fixed BATTLE_AddExpItem: each newly dead Enemy pays EXP only to the current pBidList.
    for(const unit of units){
      for(const credit of sourceEnemyRewardCredits(unit)){
        if(credit.kind==='player'){
          exp+=Math.max(0,n(serverBattleExpForRecipient(unit,state.level)));
        }else if(credit.kind==='pet'){
          const p=state.petBox.find(x=>x.id===credit.petId);
          if(!p)continue;
          const amount=Math.max(0,n(serverBattleExpForRecipient(unit,p.level)));
          petExpById.set(p.id,n(petExpById.get(p.id))+amount);
        }
      }
    }
  }else{
    // Hand-authored quest formation still has no source per-unit EXP table; retain the existing explicit fallback.
    exp=fallbackBattleExp(defeated);
    if(fallbackPet)petExp=Math.max(4,Math.round(exp*1.5));
  }

  state.wins++;
  state.exp+=exp;

  if(serverResolved){
    for(const [petId,amount] of petExpById){
      const p=state.petBox.find(x=>x.id===petId);
      // fixed battle result skips CHAR_ISDIE pets, but an alive Pet that LostEscape'd can still receive WORKGETEXP.
      if(p&&n(p.hp)>0&&amount>0)awardPetExp(p,amount);
    }
  }else if(fallbackPet&&petExp>0){
    awardPetExp(fallbackPet,petExp);
  }

  const rewardUnits=units.filter(u=>u?.sourceRewardPlayerSide===true);
  addLog('擊敗 '+(defeated.groupBattle?('敵方編成 '+unitCount+' 名'):defeated.name)+'，獲得 '+exp+' EXP。'
    +(serverResolved
      ?'（原 BATTLE_AddExpItem kill-credit；'+rewardUnits.length+'/'+units.length+' 隻由玩家側取得獎勵）'
      :'（手工任務編成沿用暫定 EXP）'),'good');

  const rewardDefeated=rewardUnits.length
    ?(Array.isArray(defeated?.units)?Object.assign({},defeated,{units:rewardUnits}):defeated)
    :null;
  const drops=rewardDefeated?rollVerifiedDrops(rewardDefeated):[];
  // 被挑進 getitem 的 existing index 已轉為 player；其餘仍屬 Enemy 的 carried/style item 在 CHAR_endCharOneArray 等價清理。
  releaseBattleEnemyRuntimeItems(defeated);
  for(const item of drops){
    addLog('掉落：'+item.name+' ×1。','pet');
  }
  if(defeated.entry?.variant?.questOnWin==='event83-complete'){
    const p=addEvent83Pet();
    state.quest.event83.active=false;
    state.quest.event83.complete=true;
    addLog('Event 83 完成：席格戰結束，取得 '+p.name+'（TempNo 854）。','good');
  }
  if(defeated.entry?.variant?.questOnWin==='event69-frog-king-defeated'&&n(state.quest.event71Prep.stage)===4){
    state.quest.event71Prep.stage=5;
    state.mapId=maps.find(m=>!m.questZone)?.id||maps[0]?.id||state.mapId;
    addLog('里昂蛙王戰勝利：依 event69_5.arg 被傳送到 Floor 30607，可把金珠 19622 還給蛙王。','good');
  }
  const e81win=defeated.entry?.variant?.questOnWin;
  if(n(state.quest.event81.stage)===3){
    if(e81win==='event81-thief-1-win')event81MazeWarp(24);
    if(e81win==='event81-thief-2-win')event81MazeWarp(28);
    if(e81win==='event81-thief-3-win')event81MazeWarp(32);
  }
  if(e81win==='event81-boss-win'&&n(state.quest.event81.stage)===6){
    state.quest.event81.stage=7;
    state.quest.event81.mazeFloor=5580;state.quest.event81.mazeX=58;state.quest.event81.mazeY=20;
    state.mapId=maps.find(m=>!m.questZone)?.id||maps[0]?.id||state.mapId;
    addLog('PC團老大已被擊敗；依 event81_3f.arg 被傳送到 Floor 5580 (58,20)，可向老大取得悔過書。','good');
  }
  const exitPets=sourceFinalizePlayerBattleExit();
  if(exitPets.revived)addLog('戰鬥離場：'+exitPets.revived+' 隻倒下的持有寵依原 BATTLE_Exit 回復到 HP 1。','pet');
  if(exitPets.pigCleared)addLog('戰鬥離場：黑烏力化依原 _BATTLE_Exit 立即解除，不把剩餘秒數帶到戰鬥外。','good');
  enemy=null;
  resetBattleStatuses();
  levelCheck();
  save();render();
}
function defeat(){
  const hadBattle=!!enemy;
  if(hadBattle){
    sourceProcessBattleDeathsAtAddProfit();
  }
  addLog('角色體力不足，已自動回村休息並補滿 HP／MP。','bad');
  releaseBattleEnemyRuntimeItems(enemy);
  const exitPets=hadBattle?sourceFinalizePlayerBattleExit():{revived:0,petIds:[],pigCleared:false};
  if(exitPets.revived)addLog('戰鬥離場：'+exitPets.revived+' 隻倒下的持有寵依原 BATTLE_Exit 回復到 HP 1。','pet');
  if(exitPets.pigCleared)addLog('戰鬥離場：黑烏力化依原 _BATTLE_Exit 立即解除。','good');
  state.hp=state.maxHp;
  state.mp=state.maxMp;
  enemy=null;
  resetBattleStatuses();
  save();render();
}
function battleDexRoll(quick,mode=null){
  const work=Math.trunc(n(quick))+20;
  let dex;
  if(mode==='speedy'){
    // BATTLE_COM_S_SPEEDYATTACK：dex = work + work*0.3。
    dex=work+work*.3;
  }else if(mode==='damageToHp2'){
    // BATTLE_COM_S_DAMAGETOHP2：dex = work + work*0.2。
    dex=work+work*.2;
  }else{
    // 普通 default：dex = work - RAND(0, work*0.3)。
    dex=work-cRand(0,work*.3);
  }
  if(dex<=0)dex=1;
  return Math.trunc(dex);
}
function sourceComboActorInfo(actor,playerCommand='attack'){
  if(!actor)return {normalAttack:false,move:false,throwWeapon:false,side:-1,targetKey:null,per:0};
  if(actor.sourceSurpriseSkip)return {normalAttack:false,move:false,throwWeapon:false,side:actor.kind==='enemy'?1:0,targetKey:null,per:0};

  if(actor.kind==='player'){
    const desc={kind:'player'};
    const targetId=actor.targetUnitId||null;
    return {
      normalAttack:playerCommand==='attack',
      move:state.hp>0&&battleStatusCanMove(desc),
      throwWeapon:false,side:0,targetKey:targetId?('enemy:'+targetId):null,per:50
    };
  }

  if(actor.kind==='pet'){
    const pet=state.petBox.find(p=>p.id===actor.petId);
    const desc=pet?{kind:'pet',pet,petId:pet.id}:null;
    const targetId=actor.targetUnitId||null;
    return {
      // fixed BATTLE_IsCharge / ComboCheck：COM_S_CHARGE 不是 COM_ATTACK，
      // 蓄力中的 Pet 不能被當成普通攻擊候選拉進合擊。
      normalAttack:!!(pet&&petIsBattleActive(pet)&&!battlePetChargeStates.has(pet.id)&&!sourcePetEarthRoundCommandActive(pet)),
      move:!!(desc&&battleStatusCanMove(desc)),
      throwWeapon:false,side:0,targetKey:targetId?('enemy:'+targetId):null,per:50
    };
  }

  if(actor.kind==='enemy'){
    const unit=livingEnemyUnits().find(u=>u.id===actor.unitId);
    const desc=unit?{kind:'enemy',unit,unitId:unit.id}:null;
    const blocked=!!(actor.sourceSkillMissing||actor.sourceSkillUnregistered||actor.sourceSkillRejected||actor.sourceMagicCWait);
    const targetKey=actor.targetKind==='pet'
      ?('pet:'+String(actor.targetPetId||''))
      :(actor.targetKind==='player'?'player':null);
    return {
      // pet_skill.c 另一條可能在 PVE 改成 ATTACK 的 PETSKILL_Explode 被 fixed ref version.h 明確註解關閉；
      // 因此本 build 可達範圍內，enemyAction=attack 可精確對應 COM_ATTACK。
      normalAttack:!!(unit&&actor.enemyAction==='attack'&&!blocked),
      move:!!(desc&&battleStatusCanMove(desc)&&n(unit.hp)>0),
      throwWeapon:!!unit?.throwWeapon,side:1,targetKey,per:20
    };
  }

  return {normalAttack:false,move:false,throwWeapon:false,side:-1,targetKey:null,per:0};
}
function sourceComboCheck(order,options={}){
  const playerCommand=String(options.playerCommand||'attack');
  let start=-1,oldSide=-3,oldTarget=null,comboId=1;
  for(const actor of order){
    actor.sourceComboId=0;
    actor.sourceComboConsumed=false;
  }

  for(let i=0;i<order.length;i++){
    const actor=order[i];
    const info=sourceComboActorInfo(actor,playerCommand);

    if(start!==-1){
      if(!info.normalAttack||info.targetKey!==oldTarget||info.side!==oldSide||info.throwWeapon||!info.move){
        start=-1;
        oldSide=info.side;
      }else{
        actor.sourceComboId=comboId;
        order[start].sourceComboId=comboId;
      }
    }

    if(start===-1){
      if(info.normalAttack&&!info.throwWeapon&&info.move&&info.targetKey&&cRand(1,100)<=info.per){
        start=i;
        oldTarget=info.targetKey;
        oldSide=info.side;
        comboId++;
      }
    }
  }
  return order;
}
function sourceComboActorAliveAndMovable(actor){
  if(!actor)return false;
  if(actor.kind==='player')return state.hp>0&&battleStatusCanMove({kind:'player'});
  if(actor.kind==='pet'){
    const pet=state.petBox.find(p=>p.id===actor.petId);
    return !!(pet&&petIsBattleActive(pet)&&battleStatusCanMove({kind:'pet',pet,petId:pet.id}));
  }
  if(actor.kind==='enemy'){
    const unit=livingEnemyUnits().find(u=>u.id===actor.unitId);
    return !!(unit&&n(unit.hp)>0&&battleStatusCanMove({kind:'enemy',unit,unitId:unit.id}));
  }
  return false;
}
function sourceComboHasLater(order,index){
  const id=Math.trunc(n(order[index]?.sourceComboId));
  if(id<=0)return false;
  for(let i=index+1;i<order.length&&Math.trunc(n(order[i]?.sourceComboId))===id;i++){
    if(sourceComboActorAliveAndMovable(order[i]))return true;
  }
  return false;
}
function sourceComboResolveTarget(actor){
  if(!actor)return null;
  if(actor.kind==='player'||actor.kind==='pet'){
    const unit=livingEnemyUnits().find(u=>u.id===actor.targetUnitId&&!u.earthRoundState);
    const target=unit||targetEnemyUnit();
    return target?{kind:'enemy',unit,unitId:unit.id}:null;
  }
  if(actor.kind==='enemy'){
    const unit=livingEnemyUnits().find(u=>u.id===actor.unitId);
    if(!unit)return null;
    const chosen=enemyActorTarget(actor,unit);
    if(chosen?.kind==='pet'&&chosen.pet)return {kind:'pet',pet:chosen.pet,petId:chosen.pet.id};
    if(chosen?.kind==='player')return {kind:'player'};
  }
  return null;
}
function sourceComboAttackerView(actor){
  if(actor.kind==='player')return playerBattleView();
  if(actor.kind==='pet'){
    const pet=state.petBox.find(p=>p.id===actor.petId);
    return pet&&petIsBattleActive(pet)?petBattleView(pet):null;
  }
  if(actor.kind==='enemy'){
    const unit=livingEnemyUnits().find(u=>u.id===actor.unitId);
    return unit?enemyBattleView(unit):null;
  }
  return null;
}
function sourceComboTargetView(target){
  if(target?.kind==='player')return playerBattleView();
  if(target?.kind==='pet'&&target.pet)return petBattleView(target.pet);
  if(target?.kind==='enemy'&&target.unit)return enemyBattleView(target.unit);
  return null;
}
function sourceComboTargetGuarding(target,playerGuarding=false){
  if(target?.kind==='player')return !!playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
  if(target?.kind==='enemy'){
    const desc={kind:'enemy',unit:target.unit,unitId:target.unitId};
    return !!target.unit?.guardThisTurn&&!battleStatusActive(desc,'confusion');
  }
  return false;
}
function sourceComboApplyDamage(target,total,lastResult=null,rewardActors=[]){
  const damage=Math.max(0,Math.trunc(n(total)));
  if(!target||damage<=0)return 0;
  if(target.kind==='player'){
    const before=n(state.hp);
    state.hp=Math.max(0,before-damage);
    sourceTrackDamageSubUltimate({kind:'player'},damage,before,lastResult||{});
    return Math.max(0,before-state.hp);
  }
  if(target.kind==='pet'&&target.pet){
    const before=n(target.pet.hp);
    target.pet.hp=Math.max(0,before-damage);
    sourceTrackDamageSubUltimate({kind:'pet',pet:target.pet,petId:target.pet.id},damage,before,lastResult||{});
    return Math.max(0,before-target.pet.hp);
  }
  if(target.kind==='enemy'&&target.unit){
    const before=n(target.unit.hp);
    target.unit.hp=Math.max(0,before-damage);
    sourceTrackDamageSubUltimate({kind:'enemy',unit:target.unit,unitId:target.unit.id},damage,before,lastResult||{});
    if(before>0&&target.unit.hp<=0)sourceMarkEnemyDeathCredit(target.unit,rewardActors);
    return Math.max(0,before-target.unit.hp);
  }
  return 0;
}
function sourceComboAcupunctureSegment(actor,target,r,rewardActors=[]){
  const attackerDesc=battleStatusActorDesc(actor);
  if(!attackerDesc||!target||!r)return {triggered:false};

  // BATTLE_Combo uses the same DamageReact, but on a reacting segment it calls
  // BATTLE_DamageSub immediately instead of adding that segment into AllDamage.
  // Its later critical-death check only treats CHAR_TYPEENEMY as eligible.
  r.ultimateCriticalEnemyOnly=true;
  const reaction=sourcePrepareAcupunctureReaction(attackerDesc,target,r);
  if(!reaction.triggered)return {triggered:false,reaction,attackerDesc};

  const before=battleStatusHp(target);
  battleStatusSetHp(target,before-r.damage);
  sourceTrackDamageSubUltimate(target,r.damage,before,r);
  sourceFinishAcupunctureReaction(reaction);
  const after=battleStatusHp(target);
  if(before>0&&after<=0&&target.kind==='enemy'&&target.unit){
    // fixed BATTLE_AddProfit receives the complete combo aAttackList even if BATTLE_Combo
    // returns early after this immediate reaction kills the target.
    sourceMarkEnemyDeathCredit(target.unit,rewardActors);
  }

  reaction.targetBefore=before;
  reaction.targetAfter=after;
  reaction.targetDamage=Math.max(0,before-after);

  // BATTLE_DamageSub writes *pDamage back as playerdamage. For Acupuncture without riding,
  // that is the reflected half-damage, and BATTLE_Combo uses this value for WakeUp/ItemCrush.
  r.sourceComboAcupunctureFullDamage=reaction.fullDamage;
  r.sourceComboAcupunctureReflectedDamage=reaction.reflectedDamage;
  r.damage=reaction.reflectedDamage;
  sourceLogAcupunctureReaction(reaction);
  return {
    triggered:true,reaction,attackerDesc,
    targetDamage:reaction.targetDamage,
    postDamage:r.damage
  };
}
function sourcePerformCombo(order,index,options={}){
  const first=order[index];
  const comboId=Math.trunc(n(first?.sourceComboId));
  if(comboId<=0||!sourceComboHasLater(order,index))return null;

  const target=sourceComboResolveTarget(first);
  if(!target)return null;

  const members=[first];
  for(let i=index+1;i<order.length&&Math.trunc(n(order[i]?.sourceComboId))===comboId;i++){
    order[i].sourceComboConsumed=true;
    const actor=order[i];
    // 原 BATTLE_COM_COMBO 分支會在收進後續成員前，才對該成員執行 StatusSeq / MagicStatusSeq。
    const statusTurn=processBattleStatusTurn(actor);
    if(statusTurn.skip)continue;
    // Confusion 在 StatusSeq 內雖會把 COM/COM2 改成普通攻擊＋亂數目標，
    // 但 combo 分支此處只重新檢查 CanMove，仍把該成員加入既定 defNo；因此不另跑 confusionAttack。
    if(!sourceComboActorAliveAndMovable(actor))continue;
    members.push(actor);
  }

  const targetView=sourceComboTargetView(target);
  if(!targetView)return null;
  const guarding=sourceComboTargetGuarding(target,!!options.playerGuarding);
  const rewardActors=members.map(x=>({kind:x.kind,petId:x.petId||null}));
  const hits=[];
  let accumulatedDamage=0,rawTotal=0,immediateDamage=0;
  let deferredWake=null,abortedByTargetDeath=false;

  for(let memberIndex=0;memberIndex<members.length;memberIndex++){
    // fixed BATTLE_Combo checks the original target HP at the beginning of every segment.
    // An Acupuncture segment can therefore kill it immediately and abort all later members.
    if(!battleStatusDescAlive(target)){
      abortedByTargetDeath=true;
      break;
    }

    const actor=members[memberIndex];
    const attacker=sourceComboAttackerView(actor);
    if(!attacker)continue;
    // 原 BATTLE_Combo -> BATTLE_AttackSeq(..., BATTLE_COM_COMBO)：
    // 完全跳過 DuckCheck，Guardian 初值 -2 也使 GuardianCheck 不執行。
    const r=resolveNormalAttack(attacker,targetView,{guarding,disableDodge:true});
    if(n(r.damage)<=0){r.damage=1;r.miss=false}
    const calculatedDamage=Math.max(1,Math.trunc(n(r.damage)));
    rawTotal+=calculatedDamage;

    const acupuncture=sourceComboAcupunctureSegment(actor,target,r,rewardActors);
    let wakeDesc=target,wakeDamage=Math.max(0,Math.trunc(n(r.damage)));
    if(acupuncture.triggered){
      // Reaction segments are applied immediately by BATTLE_DamageSub and are NOT added to AllDamage.
      immediateDamage+=Math.max(0,Math.trunc(n(acupuncture.targetDamage)));
      wakeDesc=acupuncture.attackerDesc;
      wakeDamage=Math.max(0,Math.trunc(n(acupuncture.postDamage)));
    }else{
      // BATTLE_DamageSubCale only adjusts the segment damage here; HP is deferred to DamageSub2.
      accumulatedDamage+=calculatedDamage;
    }

    const isLast=memberIndex+1>=members.length;
    hits.push({
      kind:actor.kind,unitId:actor.unitId||null,petId:actor.petId||null,label:actor.label||actor.kind,r,
      acupuncture:acupuncture.triggered?acupuncture.reaction:null,
      calculatedDamage
    });

    if(!isLast){
      // For non-last members the source wakes immediately after this segment.
      // Acupuncture has already redirected defindex to the reflected attacker.
      if(wakeDamage>0)battleStatusWakeOnDamage(wakeDesc,wakeDamage);
      sourceBattleFinalizeItemCrushRng(r);

      if(acupuncture.triggered&&!battleStatusDescAlive(target)){
        // The next source loop iteration returns before DamageSub2, so any earlier AllDamage
        // would be discarded rather than applied after the target has already died.
        abortedByTargetDeath=true;
        break;
      }
    }else{
      // Last-member WakeUp / ItemCrush happen only after DamageSub2 applies accumulated AllDamage.
      deferredWake={desc:wakeDesc,damage:wakeDamage};
    }
  }

  if(!hits.length)return null;

  let accumulatedActual=0;
  if(!abortedByTargetDeath){
    const lastComboResult=hits[hits.length-1]?.r
      ?Object.assign({},hits[hits.length-1].r,{ultimateCriticalEnemyOnly:true})
      :{ultimateCriticalEnemyOnly:true};
    accumulatedActual=sourceComboApplyDamage(
      target,accumulatedDamage,lastComboResult,
      hits.map(x=>({kind:x.kind,petId:x.petId||null}))
    );
    if(deferredWake?.damage>0)battleStatusWakeOnDamage(deferredWake.desc,deferredWake.damage);
    sourceBattleFinalizeItemCrushRng(hits[hits.length-1]?.r);
    // fixed BATTLE_Combo returns to the caller, then BATTLE_AddProfit processes the new death.
    sourceProcessBattleDeathsAtAddProfit();
  }

  const actual=immediateDamage+accumulatedActual;
  const names=hits.map(x=>x.label).join('、');
  addLog(
    names+' 發動合擊，對 '+battleStatusDescName(target)+' 合計造成 '+actual+' 傷害。'
      +(abortedByTargetDeath?'（目標在合擊途中倒下）':''),
    target.kind==='enemy'?'good':'bad'
  );
  return {
    comboId,target,totalDamage:actual,rawTotal,
    accumulatedDamage,accumulatedActual,immediateDamage,
    abortedByTargetDeath,hits
  };
}

function normalBattleOrder(options={}){
  if(enemy)enemy.sourceBattleTurn=Math.max(0,Math.trunc(n(enemy.sourceBattleTurn)))+1;
  const surpriseSide=enemy?.sourceSurprisePending?enemy.sourceSurpriseSide:null;
  // fixed BATTLE_AllCharaCWaitSet 只保留 Charge 類 command；普通 GUARD 新一輪前清回 NONE。
  // PreCommandSeq 同時清掉上一輪 Guardian mapping。
  battlePetGuardIds.clear();
  // complianceParameter 會在新 round 以 FIXSTR/FIXTOUGH 重建 WORK attack/defense。
  battlePetPowerMods.clear();
  battlePetNoGuardStates.clear();
  battlePlayerGuardianPetId=null;
  // 原 BATTLE_PreCommandSeq 每輪先 complianceParameter 重建 FIX 屬性；
  // Player 沒有 EARTHROUND0 例外，所以這裡也必須重建裝備 WORK。特別重要的是
  // ITEM_DIErelife 同回合消耗裝備後不立即 compliance，直到下一 round 才失去戒指加成。
  playerComplianceParameter(state);
  // EARTHROUND0 是 Pet/Enemy 的明確例外，隱身者跳過整段並保留上一輪 WORK/FIX。
  sourcePreCommandResetTransient();
  // Other_DefcharWorkInt 同一階段處理 WEAKEN / BARRIER 的真正倒數與 WEAKEN 0.8 FIX 快照。
  sourcePreCommandStatusTick();
  // 再依 REVERSE flag 套 BATTLE_AttReverse；EARTHROUND0 同樣保留舊 FIX 屬性快照。
  battlePrepareElementWork();

  const order=[];
  let orderIndex=0;
  const enemyEntryUnits=Array.isArray(enemy?.units)&&enemy.units.length?enemy.units.slice():(enemy?[enemy]:[]);
  for(const unit of enemyEntryUnits){
    unit.guardianReadyThisTurn=false;
    unit.guardedByUnitId=null;
  }

  // Player/Pet command targets already exist before BATTLE_ai_all() in fixed C.
  // Snapshot that non-RNG command state now, but DO NOT call BATTLE_DexCalc yet.
  const friendlyTarget=targetEnemyUnit();
  const player=playerBattleView();
  const playerEntries=Array.isArray(enemy?.sourcePlayerSideEntries)?enemy.sourcePlayerSideEntries:[];
  const petEntry=playerEntries.find(x=>x?.kind==='pet'&&!battlePetOutIds.has(x.petId));
  let pet=petEntry?state.petBox.find(p=>p.id===petEntry.petId):null;
  if(!playerEntries.length){
    const fallback=activePet();
    if(fallback&&!battlePetOutIds.has(fallback.id))pet=fallback;
  }
  if(pet)sourceRefreshPetRoundFixAi(pet);

  // V1.63 source order:
  // BATTLE_Command() -> BATTLE_ai_all(side 0) -> BATTLE_ai_all(side 1)
  // -> BATTLE_Battling() -> BATTLE_DexCalc() / EntrySort() / ComboCheck().
  // In this Web PVE the Enemy side is the only BATTLE_S_TYPE_ENEMY side, so every Enemy AI
  // action/target/skill-side-effect RNG must finish before the first Player/Pet/Enemy dex RNG.
  // BATTLE_ai_all() also does not pre-filter CHAR_ISDIE/HP<=0: a dead-but-still-present Entry
  // can consume AI RNG (and PETSKILL_Use side effects) before BATTLE_Battling later skips it.
  const enemyPlans=new Map();
  for(const unit of enemyEntryUnits){
    const dead=n(unit?.hp)<=0;
    const desc={kind:'enemy',unit,unitId:unit?.id};

    if(surpriseSide==='enemy'){
      // fixed BATTLE_ai_all(): SURPRISE writes COM_NONE/C_OK and consumes no AI RNG.
      unit.guardThisTurn=false;
      unit.roundDexMode=null;
      const quick=n(enemyBattleView(unit)?.quick);
      enemyPlans.set(unit.id,{
        dead,quick,
        action:{kind:'none',spec:enemyAiAttackSpec(unit)},
        chosen:null,attackShootPrime:null,
        sourceSurpriseSkip:true
      });
      continue;
    }

    let action=enemyChooseAction(unit);
    const needsTarget=action?.kind==='attack'||action?.sourceAiPickedSkill===true;
    const chosen=needsTarget?enemyChooseTarget(unit):null;

    if(needsTarget&&!chosen){
      // fixed BATTLE_ai_normal(): if the requested target class and TARGET_ALL fallback both
      // produce cnt==0, it returns FALSE BEFORE PETSKILL_Use(). Keep PreCommand baseline state,
      // but do not apply selected-skill side effects.
      const failed=Object.assign({},action,{
        kind:'none',sourceAiTargetMissing:true,
        sourceCWaitReason:action?.sourceCWaitReason||'no-target'
      });
      enemyPrepareRoundAction(unit,{kind:'none'});
      unit.guardThisTurn=false;
      unit.counterEligibleThisTurn=false;
      unit.roundDexMode=null;
      action=failed;
      const quick=n(enemyBattleView(unit)?.quick);
      enemyPlans.set(unit.id,{dead,quick,action,chosen:null,attackShootPrime:null,sourceSurpriseSkip:false});
      continue;
    }

    // In fixed BATTLE_ai_normal, PETSKILL_Use() is after target selection.
    enemyPrepareRoundAction(unit,action);
    unit.guardThisTurn=action?.kind==='guard';
    const attackShootPrime=sourceEnemyPrimeAttackShoot(action,unit,chosen);

    // BATTLE_ai_all() checks CanMove only after the AI/PETSKILL callback returned.
    // Skill side effects already happened, but the final command is overwritten with NONE.
    if(!battleStatusCanMove(desc)){
      action=Object.assign({},action,{kind:'none',sourceAiCanMoveBlocked:true});
      unit.guardThisTurn=false;
      unit.counterEligibleThisTurn=false;
      unit.roundDexMode=null;
    }

    const quick=n(enemyBattleView(unit)?.quick);
    enemyPlans.set(unit.id,{dead,quick,action,chosen,attackShootPrime,sourceSurpriseSkip:false});
  }

  // Only now enter the fixed BATTLE_Battling() phase and consume dex RNG in Entry order.
  order.push({
    kind:'player',label:'你',quick:player.quick,dex:battleDexRoll(player.quick),orderIndex:orderIndex++,
    targetUnitId:friendlyTarget?.id||null,sourceSurpriseSkip:surpriseSide==='player'
  });

  // fixed Battle Entry：HP=0 不會自動等於 BATTLE_Exit。
  // 因此倒下但仍留在 side Entry 的出戰寵，仍要先進 EntrySort / ComboCheck，
  // 真正執行行動時才因 ISDIE / HP<=0 被跳過。
  if(pet){
    const pv=petBattleView(pet);
    const quick=pv?n(pv.quick):n(pet?.stats?.dex);
    order.push({
      kind:'pet',label:pet.name,petId:pet.id,quick,dex:battleDexRoll(quick),orderIndex:orderIndex++,
      targetUnitId:friendlyTarget?.id||null,sourceSurpriseSkip:surpriseSide==='player',
      sourceDeadEntry:!petIsAlive(pet)
    });
  }

  for(const unit of enemyEntryUnits){
    const plan=enemyPlans.get(unit.id)||{
      dead:n(unit?.hp)<=0,
      quick:n(enemyBattleView(unit)?.quick),
      action:{kind:'none',spec:enemyAiAttackSpec(unit)},
      chosen:null,attackShootPrime:null,
      sourceSurpriseSkip:false
    };
    const action=plan.action||{kind:'none'};
    const chosen=plan.chosen;
    const attackShootPrime=plan.attackShootPrime;
    order.push({
      kind:'enemy',label:unit.name,unitId:unit.id,quick:plan.quick,
      dex:battleDexRoll(plan.quick,unit.roundDexMode),orderIndex:orderIndex++,
      enemyAction:action.kind,skillSlot:action.skillSlot??null,skillId:action.skillId??null,
      sourceSkillMissing:!!action.sourceSkillMissing,
      sourceSkillUnregistered:!!action.sourceSkillUnregistered,
      sourceSkillRejected:!!action.sourceSkillRejected,
      sourceMagicCWait:!!action.sourceMagicCWait,
      sourceCWaitReason:action.sourceCWaitReason||null,
      sourceAiPickedSkill:!!action.sourceAiPickedSkill,
      sourceAiTargetMissing:!!action.sourceAiTargetMissing,
      sourceAiCanMoveBlocked:!!action.sourceAiCanMoveBlocked,
      targetKind:chosen?.kind||null,targetPetId:chosen?.petId||null,
      sourceAttackShootCount:attackShootPrime?.count??null,
      sourceAttackShootMin:attackShootPrime?.min??null,
      sourceAttackShootMax:attackShootPrime?.max??null,
      sourceAttackShootFixAi:attackShootPrime?.fixAi??null,
      sourceSurpriseSkip:!!plan.sourceSurpriseSkip,
      sourceDeadEntry:!!plan.dead
    });
  }

  // 原 EntrySort() 會依 dex + CHAR_WORKSEQUENCEPOWER 由高到低排序。
  // V0.71 Enemy 自動武器 runtime 的 sequence 全為 0，Player/Pet 也尚無正式裝備，因此目前仍等價 0；同值保留建表順序。
  // 重要：HP=0 但仍有 Battle Entry 的角色也在這裡一起排序，不能提早從陣列刪除。
  order.sort((a,b)=>(b.dex-a.dex)||(a.orderIndex-b.orderIndex));
  // 原 battle.c：EntrySort() 後立刻 ComboCheck()；死亡 Entry 的 move=0，
  // 因此會中斷正在建立的合擊鏈。真正執行時才跳過 sourceDeadEntry。
  sourceComboCheck(order,{playerCommand:String(options.playerCommand||'attack')});
  // fixed BATTLE_Command() 在第一輪 BATTLE_Battling() 後立刻清除兩側 SURPRISE flag。
  // 這裡 actor 已帶 sourceSurpriseSkip 快照，所以可在回傳前消耗 one-shot 狀態。
  if(enemy?.sourceSurprisePending)enemy.sourceSurprisePending=false;
  return order;
}
function sourceDeadBattleEntry(actor){
  // fixed BATTLE_Battling builds/sorts the full EntryList first, but re-checks the actor's
  // CURRENT CHAR_ISDIE / HP<=0 immediately before StatusSeq / GetAttackCount.
  // Do not rely only on the order-build snapshot: an actor can die after EntrySort/ComboCheck
  // because an earlier, faster actor already attacked it this same round.
  if(!actor)return false;
  if(actor.kind==='player')return n(state?.hp)<=0;
  if(actor.kind==='pet'){
    const pet=state?.petBox?.find?.(p=>p.id===actor.petId)||null;
    return !pet||battlePetOutIds.has(actor.petId)||n(pet.hp)<=0;
  }
  if(actor.kind==='enemy'){
    const units=Array.isArray(enemy?.units)&&enemy.units.length?enemy.units:(enemy?[enemy]:[]);
    const unit=units.find(u=>u&&u.id===actor.unitId)||null;
    return !unit||n(unit.hp)<=0;
  }
  return !!actor.sourceDeadEntry;
}
function sourceEnemyCWait(actor){
  if(actor?.kind!=='enemy'||(!actor.sourceSkillMissing&&!actor.sourceSkillUnregistered&&!actor.sourceSkillRejected&&!actor.sourceMagicCWait))return false;
  const unit=livingEnemyUnits().find(u=>u.id===actor.unitId);
  if(unit){
    if(actor.sourceSkillMissing){
      addLog(unit.name+' 的 Enemy AI 抽到來源未定義 PetSkill '+actor.skillId+'；原服 PETSKILL_Use() 會失敗並停在 C_WAIT，本回合不行動且不跑自身 StatusSeq。');
    }else if(actor.sourceSkillUnregistered){
      addLog(unit.name+' 的 Enemy AI 抽到 PetSkill '+actor.skillId+'，但原 build 找不到可註冊的技能函式；PETSKILL_Use() 回 FALSE，維持 C_WAIT，本回合不行動且不跑自身 StatusSeq。');
    }else if(actor.sourceCWaitReason==='sacrifice-low-hp'){
      addLog(unit.name+' 嘗試使用救援，但目前 HP 不高於最大 HP 的 20%；原 PETSKILL_Sacrifice() 直接失敗並停在 C_WAIT，本回合不跑自身 StatusSeq。');
    }else if(actor.sourceMagicCWait){
      addLog(unit.name+' 的 Enemy AI 抽中 ma／B_AI_MAGICMODE；原 BATTLE_ai_normal() 沒有 magic case 並直接 return FALSE，因此維持 C_WAIT，本回合不行動且不跑自身 StatusSeq。');
    }
  }
  return true;
}
function attackTurn(){
  if(!enemy)return;
  const order=normalBattleOrder({playerCommand:'attack'});

  for(const actor of order){
    sourceProcessBattleActorOuterBoundary();
    if(!enemy)return;
    if(sourceDeadBattleEntry(actor))continue;
    if(sourceEnemyCWait(actor))continue;
    // fixed BATTLE_COM_COMBO 會在 leader case 直接推進 EntryList index，
    // 已被 leader 吃掉的 combo member 不會回到外層再跑第二次 StatusSeq。
    if(actor.sourceComboConsumed)continue;
    sourceMarkBattleActorOuterAddProfit();
    const statusTurn=processBattleStatusTurn(actor);
    // fixed BATTLE_Battling(): after StatusSeq / CanMoveCheck, every C_OK actor reaches
    // BATTLE_GetAttackCount() before the command switch. A valid CHAR_ARM therefore consumes
    // its RAND(min,max) even for GUARD / ESCAPE / NONE / magic / immobilized turns.
    if(actor.kind==='player')sourcePlayerPrimeExecutionAttackCount(actor);
    else if(actor.kind==='enemy')sourceEnemyPrimeExecutionAttackCount(actor);
    if(statusTurn.skip){
      sourceCancelPetChargeFromStatus(statusTurn);
      sourceCancelPetEarthRoundFromStatus(statusTurn);
      if(statusTurn.desc?.kind==='enemy'&&statusTurn.desc.unit?.chargeState){
        statusTurn.desc.unit.chargeState=null;
        statusTurn.desc.unit.counterEligibleThisTurn=false;
        addLog(statusTurn.desc.unit.name+' 的蓄力被異常狀態中斷。');
      }
      if(statusTurn.desc?.kind==='enemy'&&statusTurn.desc.unit?.earthRoundState){
        statusTurn.desc.unit.earthRoundState=null;
        statusTurn.desc.unit.counterEligibleThisTurn=false;
        addLog(statusTurn.desc.unit.name+' 的地球一周被異常狀態中斷，重新現身。');
      }
      addLog((statusTurn.desc?.kind==='player'?'你':statusTurn.desc?.pet?.name||statusTurn.desc?.unit?.name||'目標')+' 因'+(BATTLE_STATUS_NAMES[statusTurn.status?.type]||'異常狀態')+'無法行動。');
      if(enemy)syncEnemyTarget();
      continue;
    }
    if(actor.kind==='pet'){
      const petPre=sourcePetPreCommandAction(actor,statusTurn,{playerGuarding:false,allowPlayerCounter:true});
      if(petPre.handled){
        if(enemy)syncEnemyTarget();
        sourceProcessBattleActorOuterBoundary();
        continue;
      }
    }else{
      if(statusTurn.confusionAttack){
        performConfusionAttack(actor,statusTurn,{playerGuarding:false,allowPlayerCounter:true});
        if(enemy)syncEnemyTarget();
        sourceProcessBattleActorOuterBoundary();
        continue;
      }
      if(sourceSurpriseSkipAction(actor))continue;
    }
    if(actor.sourceComboId&&sourceComboHasLater(order,order.indexOf(actor))){
      const combo=sourcePerformCombo(order,order.indexOf(actor),{playerGuarding:false});
      if(combo){
        if(enemy)syncEnemyTarget();
        sourceProcessBattleActorOuterBoundary();
        continue;
      }
    }

    if(actor.kind==='player'){
      const result=sourcePerformPlayerCommonAttack(actor,{allowCounter:true});
      if(!result.attackCount){
        if(livingEnemyUnits().length)addLog('敵方目前都在地球一周的繞背狀態，暫時沒有可指定的目標。');
        continue;
      }
    }else if(actor.kind==='pet'){
      const pet=activePet();
      if(!pet||pet.id!==actor.petId||!petIsBattleActive(pet))continue;
      const target=sourceFriendlyEnemyTargetAdjust(actor);
      if(!target){
        if(livingEnemyUnits().length)addLog('敵方目前都在地球一周的繞背狀態，暫時沒有可指定的目標。');
        continue;
      }
      sourceRevealPetForDirectAttack(pet);
      const r=petAttackResult(pet,target);
      const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
      sourceProcessBattleDeathsAtAddProfit();
      if(petIsBattleActive(pet)&&actual?.hp>0)resolvePetEnemyCounterChain('pet',pet,actual,r);
    }else if(actor.kind==='enemy'){
      const unit=livingEnemyUnits().find(u=>u.id===actor.unitId);
      if(!unit)continue;
      performEnemyAction(actor,unit,{playerGuarding:false,allowPlayerCounter:true});
    }

    sourceProcessBattleActorOuterBoundary();
    if(enemy)syncEnemyTarget();
  }

  sourceProcessBattleActorOuterBoundary();
  if(!enemy){return;}
  if(state.hp<=0){defeat();return;}
  if(!livingEnemyUnits().length){winBattle();return;}
  syncEnemyTarget();battleFieldTick();
  render();
}
function guardTurn(){
  if(!enemy)return;
  const order=normalBattleOrder({playerCommand:'guard'});

  // 原服在回合指令確定後，CHAR_WORKBATTLECOM1 已經是 GUARD；
  // 所以即使敵人的排序在玩家之前，防禦減傷也已生效。
  for(const actor of order){
    sourceProcessBattleActorOuterBoundary();
    if(!enemy)return;
    if(sourceDeadBattleEntry(actor))continue;
    if(sourceEnemyCWait(actor))continue;
    // fixed BATTLE_COM_COMBO 會在 leader case 直接推進 EntryList index，
    // 已被 leader 吃掉的 combo member 不會回到外層再跑第二次 StatusSeq。
    if(actor.sourceComboConsumed)continue;
    sourceMarkBattleActorOuterAddProfit();
    const statusTurn=processBattleStatusTurn(actor);
    // fixed BATTLE_Battling(): after StatusSeq / CanMoveCheck, every C_OK actor reaches
    // BATTLE_GetAttackCount() before the command switch. A valid CHAR_ARM therefore consumes
    // its RAND(min,max) even for GUARD / ESCAPE / NONE / magic / immobilized turns.
    if(actor.kind==='player')sourcePlayerPrimeExecutionAttackCount(actor);
    else if(actor.kind==='enemy')sourceEnemyPrimeExecutionAttackCount(actor);
    if(statusTurn.skip){
      sourceCancelPetChargeFromStatus(statusTurn);
      sourceCancelPetEarthRoundFromStatus(statusTurn);
      if(statusTurn.desc?.kind==='enemy'&&statusTurn.desc.unit?.chargeState){
        statusTurn.desc.unit.chargeState=null;
        statusTurn.desc.unit.counterEligibleThisTurn=false;
        addLog(statusTurn.desc.unit.name+' 的蓄力被異常狀態中斷。');
      }
      if(statusTurn.desc?.kind==='enemy'&&statusTurn.desc.unit?.earthRoundState){
        statusTurn.desc.unit.earthRoundState=null;
        statusTurn.desc.unit.counterEligibleThisTurn=false;
        addLog(statusTurn.desc.unit.name+' 的地球一周被異常狀態中斷，重新現身。');
      }
      addLog((statusTurn.desc?.kind==='player'?'你':statusTurn.desc?.pet?.name||statusTurn.desc?.unit?.name||'目標')+' 因'+(BATTLE_STATUS_NAMES[statusTurn.status?.type]||'異常狀態')+'無法行動。');
      if(enemy)syncEnemyTarget();
      continue;
    }
    if(actor.kind==='pet'){
      const petPre=sourcePetPreCommandAction(actor,statusTurn,{playerGuarding:true,allowPlayerCounter:false});
      if(petPre.handled){
        if(enemy)syncEnemyTarget();
        sourceProcessBattleActorOuterBoundary();
        continue;
      }
    }else{
      if(statusTurn.confusionAttack){
        performConfusionAttack(actor,statusTurn,{playerGuarding:true,allowPlayerCounter:false});
        if(enemy)syncEnemyTarget();
        sourceProcessBattleActorOuterBoundary();
        continue;
      }
      if(sourceSurpriseSkipAction(actor))continue;
    }
    if(actor.sourceComboId&&sourceComboHasLater(order,order.indexOf(actor))){
      const combo=sourcePerformCombo(order,order.indexOf(actor),{playerGuarding:true});
      if(combo){
        if(enemy)syncEnemyTarget();
        sourceProcessBattleActorOuterBoundary();
        continue;
      }
    }

    if(actor.kind==='player'){
      addLog('你採取防禦姿勢。','good');
    }else if(actor.kind==='pet'){
      const pet=activePet();
      if(!pet||pet.id!==actor.petId||!petIsBattleActive(pet))continue;
      const target=sourceFriendlyEnemyTargetAdjust(actor);
      if(!target){
        if(livingEnemyUnits().length)addLog('敵方目前都在地球一周的繞背狀態，暫時沒有可指定的目標。');
        continue;
      }
      sourceRevealPetForDirectAttack(pet);
      const r=petAttackResult(pet,target);
      const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
      sourceProcessBattleDeathsAtAddProfit();
      if(petIsBattleActive(pet)&&actual?.hp>0)resolvePetEnemyCounterChain('pet',pet,actual,r);
    }else if(actor.kind==='enemy'){
      const unit=livingEnemyUnits().find(u=>u.id===actor.unitId);
      if(!unit)continue;
      performEnemyAction(actor,unit,{playerGuarding:true,allowPlayerCounter:false});
    }

    sourceProcessBattleActorOuterBoundary();
    if(enemy)syncEnemyTarget();
  }

  sourceProcessBattleActorOuterBoundary();
  if(!enemy){return;}
  if(state.hp<=0){defeat();return;}
  if(!livingEnemyUnits().length){winBattle();return;}
  syncEnemyTarget();battleFieldTick();
  save();render();
}
function walkEncounterStep(){
  const map=currentMap();
  if(!map)return false;
  if(map.questZone){
    spawnEnemy();
    return !!enemy;
  }
  const selected=currentEncounter(map);
  if(!selected)return false;
  const point=randomPointInEncounter(selected);
  const encounter=resolveEncounterAt(map,point.x,point.y);
  if(!encounter)return false;

  let min=clamp(n(encounter.encounterMin),0,100);
  let max=clamp(n(encounter.encounterMax),0,100);
  if(min>max){const t=min;min=max;max=t}
  let cep=n(state.encounterCep);
  if(cep<min)cep=min;
  if(cep>max)cep=max;

  // 原 char_walk.c：每走一步 if(rand()%120 < cep)，失敗則 cep++，成功重設 minep。
  const roll=Math.floor(Math.random()*120);
  state.virtualWalkSteps=Math.max(0,Math.floor(n(state.virtualWalkSteps)))+1;
  state.lastEncounterRoll={roll,cep,min,max,encounterId:encounter.encounterId,x:point.x,y:point.y};
  if(roll<cep){
    state.encounterCep=min;
    spawnEnemy({map,selected,encounter,point,cepUsed:cep,roll});
    return !!enemy;
  }
  if(cep<max)cep++;
  state.encounterCep=cep;
  return false;
}
function tick(){
  if(!state||!state.auto)return;
  if(!sourcePlayerCreationStatsReady(state))return;
  if(!sourcePlayerHometownReady(state))return;
  if(!sourcePlayerElementsConfigured(state))return;
  if(state.hp<=0){defeat();return}
  if(!enemy){
    const map=currentMap();
    if(map?.questZone){
      spawnEnemy();
      return;
    }
    for(let i=0;i<IDLE_WALK_STEPS_PER_TICK&&!enemy;i++)walkEncounterStep();
    if(!enemy)render();
    return;
  }
  const c=captureChance();
  const target=targetEnemyUnit();
  const hpRatio=n(target?.hp)/Math.max(1,n(target?.maxHp));
  if(state.autoCapture&&c.allowed&&c.display>0&&hpRatio<=.20){
    captureTurn(false);
    return;
  }
  attackTurn();
}
function renderMapOptions(){
  const select=$('#mapSelect');
  const selected=String(state.mapId);
  select.innerHTML=maps.map(m=>{
    const floor=m.floorId??m.id;
    const suffix=m.questZone?(eligibleEntries(m).length+'/'+m.entries.length+' 路線'):((m.encounters||[]).length+' 遇敵區');
    return '<option value="'+m.id+'">'+escapeHtml(m.name)+' · Floor '+floor+' · '+suffix+'</option>';
  }).join('');
  select.value=selected;
}
function renderEncounterOptions(){
  const select=$('#encounterSelect');
  if(!select)return;
  const map=currentMap();
  if(!map||map.questZone){
    select.disabled=true;
    select.innerHTML='<option>任務固定遭遇區</option>';
    return;
  }
  const encounter=currentEncounter(map),list=map.encounters||[];
  select.disabled=!list.length;
  select.innerHTML=list.map(e=>{
    const a=e.area||{},unresolved=(e.groups||[]).filter(g=>!g.resolved).length;
    return '<option value="'+e.encounterId+'">Encounter '+e.encounterId+' · X '+a.xMin+'–'+a.xMax+' / Y '+a.yMin+'–'+a.yMax+' · Z '+e.zorder+' · Max '+e.enemyMax+(unresolved?' · '+unresolved+'失聯Group':'')+'</option>';
  }).join('');
  if(encounter)select.value=String(encounter.encounterId);
}
function renderZooQuest(){
  const q=state.quest,e81=q.event81,e2=q.event2,e4=q.event4,prep=q.event71Prep,e82=q.event82,e83=q.event83;
  const has905=hasPetTempNo(905),has786=hasPetTempNo(786),has854=hasPetTempNo(854),marefia=marefiaPet();
  $('#zooQuestBadge').textContent=e82.complete?'Event 82 完成':(e82.active?'Event 82 進行中':(q.event81Complete?'可接取':'前置未完成'));
  const lines=[];
  const mazePos=e81.stage===3?('Floor '+n(e81.mazeFloor)+' ('+n(e81.mazeX)+','+n(e81.mazeY)+') · 已戰 '+n(e81.mazeBattles)+' 場'):'';
  const flightText=e81.arrivedEden&&e81.flightRouteNo?(' · 已搭 '+e81.flightRouteNo+' 號線到伊甸'):'';
  const e81text=e81.complete?('已完成（ENDEV=81）'+(e81.postReward?' · 伊甸總教練獎勵已領':(' · 研究報告待送伊甸'+flightText))):(e81.stage===0?'尚未開始':e81.stage===1?'持有推薦函 19696':e81.stage===2?'捕捉飛龍並持有證明書 19697':e81.stage===3?'NOWEV=81 · PC團金剛陣 '+mazePos:e81.stage===6?'已傳送到 Floor 5582 · 挑戰老大':e81.stage===7?'PC團老大已敗 · 取得悔過書':e81.stage===8?'回報霍特雷敦':'進行中');
  lines.push('<div class="quest-line '+(e81.complete?'done':'blocked')+'">Event 81 金飛航空：'+e81text+'</div>');
  if(e82.active||e82.complete){
    lines.push('<div class="quest-line '+(has905?'done':'')+'">雷爾胖 905：'+(has905?'已捕獲':'未捕獲')+(e82.raelpangReported?' · 已回報':'')+'</div>');
    lines.push('<div class="quest-line '+(has786?'done':'')+'">波波頓 786：'+(has786?'已捕獲':'未捕獲')+(e82.popodonReported?' · 已確認':'')+'</div>');
    lines.push('<div class="quest-line '+(has854?'done':'')+'">任務版拉斯基 854：'+(has854?'已取得':(e83.active?'Event 83 進行中':'尚未取得'))+'</div>');
    lines.push('<div class="quest-line '+(e4.complete?'done':'blocked')+'">Event 4 成人式：'+(e4.complete?'已完成（ENDEV=4）':(e4.active?'進行中 · 儀玉 2417 '+n(state.inventory['2417'])+'/15':'尚未完成'))+'</div>');
    if(e4.complete&&!q.event71Current){
      const ps=n(prep.stage);
      const ptext=ps===0?'尚未開始':ps===1?'已接 Event69，前往庫伊爺爺':ps===2?'持有護身符 19621，準備進蛙洞':ps===3?'已進蛙洞，尋找新藏':ps===4?'持有金珠 19622，準備挑戰里昂蛙王':ps===5?'蛙王已敗，準備歸還金珠':ps===6?'持有黑玉 19623，返回新藏':ps===7?'Event70 已開，與新藏確認託付':ps===8?'Event69 已完成，前往願藏祖母':ps>=9?'Event69／70 已完成':'進行中';
      lines.push('<div class="quest-line '+(ps>=9?'done':'')+'">Event69／70 精靈少女前傳：'+ptext+'</div>');
    }
    lines.push('<div class="quest-line '+(q.event71Current&&hasItem(2414)?'done':'blocked')+'">Event83 前置：Event71 '+(q.event71Current?'進行中':'未開旗')+' / 不可思議的貝殼 2414 '+(hasItem(2414)?'持有':'缺少')+'</div>');
    if(marefia&&!q.event71Current){
      const mi=Math.max(0,Math.floor(n(prep.memoryIndex))),node=MAREFIA_MEMORY_ROUTE[mi];
      const memoryText=node?('回憶 '+(mi+1)+'/'+MAREFIA_MEMORY_ROUTE.length+' · 下一站 Floor '+node.floor+' · 需 Lv'+node.level):
        (prep.memoryReady?'14/14 已完成 · 已理解拯救精靈王的使命':'14/14 已完成 · 請訓練至 Lv79');
      lines.push('<div class="quest-line '+(prep.memoryReady?'done':'')+'">瑪蕾菲雅：Lv'+n(marefia.level)+' / 上限 Lv'+n(marefia.levelCap)+' · '+memoryText+'</div>');
    }
    if(e83.active){
      const chain=[19704,19705,19706,19707,19708,19709,19710,19711,19712,19713,19714,19716,19717,19718].filter(id=>hasItem(id));
      lines.push('<div class="quest-line done">Event 83：進行中'+(chain.length?' · 持有 '+chain.join(' / '):'')+'</div>');
    }else if(e83.complete){
      lines.push('<div class="quest-line done">Event 83：已完成，席格已交出任務版拉斯基。</div>');
    }
  }else{
    lines.push('<div class="quest-line">Event 82：園長要求尋回雷爾胖、波波頓、任務版拉斯基。</div>');
  }
  $('#zooQuestStatus').innerHTML=lines.join('');

  const actions=[];
  if(!e4.complete){
    if(!e4.active)actions.push('<button data-zoo-action="event4-start" class="wide">Floor 10204：接受成人儀式</button>');
    else if(!hasItem(2417,15))actions.push('<button data-zoo-action="event4-get-jade" class="wide">儀式審判差使：領取儀玉 2417 ×15</button>');
    else actions.push('<button data-zoo-action="event4-finish" class="wide">儀式的審判：交出儀玉 ×15 完成成人式</button>');
  }
  if(e4.complete&&!e81.complete){
    if(e81.stage===0){
      if(state.level>80)actions.push('<button data-zoo-action="event81-start" class="wide">打工名人克拉克：領取推薦函 19696</button>');
      else actions.push('<button class="wide" disabled>Event81 需要角色 Lv81+（目前 Lv'+n(state.level)+'）</button>');
    }
    if(e81.stage===1)actions.push('<button data-zoo-action="event81-trainer" class="wide">霍特雷敦：推薦函 19696 → 捕捉證明書 19697</button>');
    if(e81.stage===2){
      const dragons=[271,272,273,274],active=activePet();
      const candidate=(active&&dragons.includes(Number(active.tempNo)))?active:state.petBox.find(p=>dragons.includes(Number(p.tempNo)));
      if(candidate)actions.push('<button data-zoo-action="event81-submit-dragon" class="wide">交出 '+escapeHtml(candidate.name)+'（TempNo '+candidate.tempNo+'）開始救援布蘭恩002</button>');
      else actions.push('<button data-zoo-action="event81-goto-dragon" class="wide">前往已確認 Lv1 加寶格恩 273 出沒地捕捉飛龍</button>');
    }
    if(e81.stage===3){
      const mx=n(e81.mazeX),zone=event81MazeZone(mx);
      const layer=mx===24?'第一區':(mx===28?'第二區':(mx===32?'第三區':'未知位置'));
      if(zone)actions.push('<button data-zoo-action="event81-maze-battle" class="wide">金剛陣 '+layer+'：Floor '+n(e81.mazeFloor)+' ('+mx+','+n(e81.mazeY)+') 挑戰 PC團盜賊</button>');
      else actions.push('<button data-zoo-action="event81-maze-reset" class="wide">金剛陣座標異常：回到入口</button>');
    }
    if(e81.stage===6)actions.push('<button data-zoo-action="event81-boss" class="wide">Floor 5582 (33,87)：挑戰 PC團老大</button>');
    if(e81.stage===7)actions.push('<button data-zoo-action="event81-confession" class="wide">Floor 5580：向 PC團老大取得悔過書 19698</button>');
    if(e81.stage===8&&hasItem(19698))actions.push('<button data-zoo-action="event81-complete" class="wide">回霍特雷敦：交悔過書並完成 Event81</button>');
  }
  if(e81.complete&&!e81.postReward){
    if(!e81.arrivedEden&&hasItem(19699)){
      actions.push('<button data-zoo-action="event81-fly-eden-1">飛龍航空 1 號線（10,000 石幣）</button>');
      actions.push('<button data-zoo-action="event81-fly-eden-2">飛龍航空 2 號線（10,000 石幣）</button>');
      actions.push('<button data-zoo-action="event81-fly-eden-3">飛龍航空 3 號線（10,000 石幣）</button>');
    }
    if(e81.arrivedEden&&hasItem(19699))actions.push('<button data-zoo-action="event81-bruce" class="wide">飛龍總教練布魯斯：交研究報告 → 200,000 石幣</button>');
  }
  if(q.event81Complete&&!e82.active&&!e82.complete)actions.push('<button data-zoo-action="accept82" class="wide">向園長接 Event 82</button>');
  if(e82.active&&!e82.complete){
    actions.push('<button data-zoo-action="feed19733">向布伊太郎領 19733</button>');
    actions.push('<button data-zoo-action="feed19723">飼料桶拿 19723</button>');
    actions.push('<button data-zoo-action="goto-raelpang">前往雷爾胖任務區</button>');
    actions.push('<button data-zoo-action="goto-popodon">前往波波頓任務區</button>');
    if(has905&&!e82.raelpangReported)actions.push('<button data-zoo-action="report-raelpang">回報雷爾胖</button>');
    if(has786&&!e82.popodonReported)actions.push('<button data-zoo-action="report-popodon">確認波波頓</button>');

    if(!hasItem(2414)){
      if(!e2.active)actions.push('<button data-zoo-action="event2-start" class="wide">日美子：接 Event 2 送花委託</button>');
      else if(hasItem(2415))actions.push('<button data-zoo-action="event2-finish" class="wide">把花 2415 交給彌生 → 貝殼 2414</button>');
    }
    if(!q.event71Current){
      if(e4.complete){
        if(prep.stage===0)actions.push('<button data-zoo-action="event69-start" class="wide">願藏祖父：開始精靈少女 Event 69</button>');
        if(prep.stage===1)actions.push('<button data-zoo-action="event69-kui" class="wide">拜訪庫伊爺爺：取得發亮護身符 19621</button>');
        if(prep.stage===2)actions.push('<button data-zoo-action="event69-enter-cave" class="wide">把護身符交給卡卡金寶 → 進入蛙洞</button>');
        if(prep.stage===3)actions.push('<button data-zoo-action="event69-shinzo-gold" class="wide">找到新藏：接下金珠 19622</button>');
        if(prep.stage===4)actions.push('<button data-zoo-action="goto-frog-king" class="wide">帶金珠前往 Floor 30605 挑戰里昂蛙王</button>');
        if(prep.stage===5)actions.push('<button data-zoo-action="event69-frog-exchange" class="wide">Floor 30607：把金珠還給蛙王 → 黑玉 19623</button>');
        if(prep.stage===6)actions.push('<button data-zoo-action="event70-start-shinzo" class="wide">回找新藏：用黑玉交換精靈情報 → 開 Event70</button>');
        if(prep.stage===7)actions.push('<button data-zoo-action="event69-finish-shinzo" class="wide">新藏託付瑪蕾菲雅 → 完成 Event69</button>');
        if(prep.stage===8)actions.push('<button data-zoo-action="event70-finish" class="wide">願藏祖母：接回 Lv1 瑪蕾菲雅＋19624 項鍊</button>');
      }
      if(prep.stage===9&&marefia){
        const mi=Math.max(0,Math.floor(n(prep.memoryIndex))),node=MAREFIA_MEMORY_ROUTE[mi];
        if(node){
          if(n(marefia.level)===node.level)actions.push('<button data-zoo-action="marefia-memory-'+mi+'" class="wide">回憶 '+(mi+1)+'/'+MAREFIA_MEMORY_ROUTE.length+'：Floor '+node.floor+' · '+escapeHtml(node.clue)+'</button>');
          else actions.push('<button class="wide" disabled>先讓瑪蕾菲雅出戰並訓練到 Lv'+node.level+'（目前 Lv'+n(marefia.level)+'）</button>');
        }else if(n(marefia.level)===79){
          actions.push('<button data-zoo-action="marefia-final" class="wide">Lv79：聽瑪蕾菲雅說明拯救精靈王的使命</button>');
        }else{
          actions.push('<button class="wide" disabled>最後回憶已完成，將瑪蕾菲雅訓練到 Lv79（目前 Lv'+n(marefia.level)+'）</button>');
        }
      }
      if(prep.stage===10&&prep.memoryReady)actions.push('<button data-zoo-action="pet-trans" class="wide">精靈王：讓出戰 Lv80+ 寵物接受轉生祝福</button>');
    }else if(hasItem(2414)&&!e83.active&&!e83.complete&&!has854){
      actions.push('<button data-zoo-action="start83" class="wide">向里拉拉開始 Event 83</button>');
    }

    if(e83.active){
      if(!hasItem(19701))actions.push('<button data-zoo-action="get-shovel">向園丁借 19701 鏟子</button>');
      if(hasItem(19701)&&![19702,19703,19704,19705,19706,19707,19708,19709,19710,19711,19712,19713,19714,19715].some(hasItem)){
        actions.push('<button data-zoo-action="pull-white">挖白蘿蔔（19703 約10%）</button>');
        actions.push('<button data-zoo-action="pull-red">挖紅蘿蔔（支線採集）</button>');
      }
      if(hasItem(19702)||hasItem(12090)||hasItem(12091)||hasItem(12092))actions.push('<button data-zoo-action="discard-bad">帶給里拉拉踩爛次等蘿蔔</button>');
      if(!hasItem(12093)&&!hasItem(19704)&&!hasItem(19705)&&!hasItem(19706)&&!hasItem(19707)&&!hasItem(19708)&&!hasItem(19709)&&!hasItem(19710)&&!hasItem(19711)&&!hasItem(19712)&&!hasItem(19713)&&!hasItem(19714)){
        actions.push('<button data-zoo-action="buy12093">柯奧特產商買 12093（25 石）</button>');
      }
      if(hasItem(19703)&&hasItem(12093))actions.push('<button data-zoo-action="exchange19704">園丁交換最上等白蘿蔔 19704</button>');
      if([19704,19705,19706,19707,19708,19709,19710].some(hasItem))actions.push('<button data-zoo-action="lala-next">跟里拉拉推進下一段線索</button>');
      if(hasItem(19711)&&!hasItem(19716))actions.push('<button data-zoo-action="goto-collar">去打格爾希洛B（19716 5%）</button>');
      if(hasItem(19711)&&hasItem(19716))actions.push('<button data-zoo-action="exchange19712">把項圈交給里拉拉 → 19712</button>');
      if(hasItem(19712))actions.push('<button data-zoo-action="next19713">里拉拉指向大雕像 → 19713</button>');
      if(hasItem(19713)&&!hasItem(19717))actions.push('<button data-zoo-action="goto-clothes">去打不良少年C（19717 5%）</button>');
      if(hasItem(19713)&&hasItem(19717))actions.push('<button data-zoo-action="exchange19714">把怪衣交給里拉拉 → 19714</button>');
      if(hasItem(19714)&&!hasItem(19718))actions.push('<button data-zoo-action="goto-flag">進地下洞窟找黑旗（10%）</button>');
      if(hasItem(19714)&&hasItem(19718))actions.push('<button data-zoo-action="goto-sig" class="wide">帶黑旗挑戰席格</button>');
    }

    if(e83.complete&&has854&&hasItem(19714)&&!hasItem(19715))actions.push('<button data-zoo-action="after83">帶拉斯基回里拉拉 → 19715</button>');
    if(has905&&has786&&has854)actions.push('<button data-zoo-action="finish82" class="wide">向園長交回三隻動物</button>');
  }
  if(e82.complete&&e83.complete&&hasItem(19715)&&!hasItem(19719))actions.push('<button data-zoo-action="reward19719" class="wide">向里拉拉領 Event83 後續謝禮 19719</button>');
  $('#zooQuestActions').innerHTML=actions.join('');
}
function renderPlayerCreationStats(){
  const panel=$('#playerCreationStatsPanel');
  const status=$('#playerCreationStatsStatus');
  const button=$('#playerCreationStatsConfirmBtn');
  if(!panel||!status||!button||!state)return;
  const ids={vital:'#creationVital',str:'#creationStr',tgh:'#creationTgh',dex:'#creationDex'};

  if(state.playerCreationStatsLegacyUnknown===true){
    for(const selector of Object.values(ids)){const input=$(selector);if(input)input.disabled=true;}
    button.disabled=true;button.textContent='舊存檔保留既有四圍';
    const p=state.playerStats||{};
    status.textContent='舊存檔：歷史創角四圍沒有獨立保存，不倒推；保留目前累積 VITAL '+Math.floor(n(p.vital))+'／STR '+Math.floor(n(p.str))+'／TOUGH '+Math.floor(n(p.tgh))+'／DEX '+Math.floor(n(p.dex))+'。';
    status.className='player-element-status good';
    return;
  }

  const ready=sourcePlayerCreationStatsReady(state);
  const values=ready?state.creationPlayerStats:(playerCreationStatsDraft||{vital:0,str:0,tgh:0,dex:0});
  for(const [key,selector] of Object.entries(ids)){
    const input=$(selector);
    if(!input)continue;
    input.value=String(values?.[key]??0);
    input.disabled=ready;
  }
  const checked=sourcePlayerCreationStatsValidate(values);
  if(ready){
    status.textContent='已鎖定創角基底：VITAL '+checked.points.vital+'／STR '+checked.points.str+'／TOUGH '+checked.points.tgh+'／DEX '+checked.points.dex+'（合計 '+checked.total+'）。';
    status.className='player-element-status good';
    button.textContent='創角四圍已確認';
    button.disabled=true;
  }else{
    status.textContent=checked.valid
      ?'可確認：合計 '+checked.total+' / 20，尚可不用 '+checked.remaining+' 點'+(checked.total===0?'；原 C 確實允許全 0，但 MaxHP 也會是 0。':'。')
      :checked.reason;
    status.className='player-element-status '+(checked.valid?'good':'bad');
    button.textContent='確認創角四圍並永久鎖定';
    button.disabled=!checked.valid;
  }
}
function renderPlayerHometown(){
  const panel=$('#playerHometownPanel');
  const select=$('#playerHometownSelect');
  const status=$('#playerHometownStatus');
  const button=$('#playerHometownConfirmBtn');
  if(!panel||!select||!status||!button||!state)return;

  if(state.hometownLegacyUnknown===true){
    select.disabled=true;button.disabled=true;button.textContent='舊存檔不補領';
    status.textContent='舊存檔：歷史 hometown／LASTTALKELDER 未保存，為避免憑空多一隻寵，本版不倒推、不補起始寵。';
    status.className='player-element-status good';
    return;
  }

  const ready=sourcePlayerHometownReady(state);
  const meta=ready?sourceHometownMeta(state.hometown):sourceHometownMeta(select.value);
  if(ready&&meta){
    select.value=String(meta.hometown);select.disabled=true;button.disabled=true;button.textContent='出生村已確認';
    const starter=state.petBox.find(p=>p?.starterPet===true&&Number(p?.starterHometown)===meta.hometown);
    status.textContent='已鎖定：hometown '+meta.hometown+' · Floor '+meta.floor+' ('+meta.x+','+meta.y+') · 起始寵 '+(starter?.name||'已依原服建立／後續可能已不在持有欄');
    status.className='player-element-status good';
    return;
  }

  select.disabled=false;button.disabled=false;button.textContent='確認出生村並建立起始寵';
  const preview=meta||SOURCE_HOMETOWN_STARTERS[0];
  const template=sourceStarterEnemyTemplate(preview.hometown);
  status.textContent='將設定 hometown '+preview.hometown+' · Floor '+preview.floor+' ('+preview.x+','+preview.y+')，並建立 Lv1 '+(template?.name||('EnemyID '+preview.enemyId))+'；原 C 不會自動設為 DEFAULTPET。';
  status.className='player-element-status good';
}
function renderPlayerElements(){
  const panel=$('#playerElementPanel');
  if(!panel||!state)return;
  const configured=sourcePlayerElementsConfigured(state);
  const stored=configured?sourcePlayerElementStoredPoints(state.elements):null;
  const values=stored||playerElementDraft||{earth:0,water:0,fire:0,wind:0};
  const ids={earth:'#elementEarth',water:'#elementWater',fire:'#elementFire',wind:'#elementWind'};
  for(const [key,selector] of Object.entries(ids)){
    const input=$(selector);
    if(!input)continue;
    input.value=String(values[key]??0);
    input.disabled=configured;
  }
  const checked=configured
    ?sourcePlayerElementValidate(stored)
    :sourcePlayerElementValidate(values);
  const status=$('#playerElementStatus');
  const button=$('#playerElementConfirmBtn');
  if(configured){
    const e=state.elements;
    status.textContent='已鎖定：地 '+e.earth+'／水 '+e.water+'／火 '+e.fire+'／風 '+e.wind;
    status.className='player-element-status good';
    button.textContent='元素已確認';
    button.disabled=true;
  }else{
    status.textContent=checked.valid
      ?'可確認：'+checked.points.earth+'／'+checked.points.water+'／'+checked.points.fire+'／'+checked.points.wind+' 點 → CHAR 屬性 '+checked.elements.earth+'／'+checked.elements.water+'／'+checked.elements.fire+'／'+checked.elements.wind
      :checked.reason;
    status.className='player-element-status '+(checked.valid?'good':'bad');
    button.textContent='確認並永久鎖定';
    button.disabled=!checked.valid;
  }
}
function render(){
  if(!state)return;
  $('#level').textContent=state.level;
  $('#exp').textContent=state.level>=playerLevelCap()?(state.exp+' / MAX'):(state.exp+' / '+state.expNext);
  $('#hp').textContent=state.hp+' / '+state.maxHp;
  $('#mp').textContent=Math.max(0,Math.trunc(n(state.mp)))+' / '+Math.max(0,Math.trunc(n(state.maxMp)));
  $('#gold').textContent=state.gold;
  $('#attack').textContent=state.attack;
  $('#defense').textContent=state.defense;
  $('#dex').textContent=state.dex;
  $('#charm').textContent=state.charm;
  $('#luck').textContent=state.luck;
  $('#skillPoints').textContent=Math.max(0,Math.floor(n(state.skillPoints)));
  const ps=state.playerStats||{};
  $('#paramVital').textContent=Math.floor(n(ps.vital));
  $('#paramStr').textContent=Math.floor(n(ps.str));
  $('#paramTgh').textContent=Math.floor(n(ps.tgh));
  $('#paramDex').textContent=Math.floor(n(ps.dex));
  document.querySelectorAll('#playerParamGrid button[data-player-stat]').forEach(b=>b.disabled=!sourcePlayerCreationStatsReady(state)||Math.floor(n(state.skillPoints))<=0);
  renderPlayerCreationStats();
  renderPlayerHometown();
  renderPlayerElements();
  $('#wins').textContent=state.wins;
  $('#hpBar').style.width=(n(state.maxHp)>0?clamp(state.hp/state.maxHp*100,0,100):0)+'%';
  $('#autoBtn').textContent='自動戰鬥：'+(state.auto?'開':'關');
  $('#autoCaptureBtn').textContent='自動捕獲：'+(state.autoCapture?'開':'關');

  const map=currentMap();
  if(map){
    if(map.questZone){
      const eligible=eligibleEntries(map);
      const allNames=[...new Set(map.entries.map(x=>x.species.clientLabel))];
      const okNames=[...new Set(eligible.map(x=>x.species.clientLabel))];
      $('#mapPetCount').textContent=okNames.length+' / '+allNames.length+' 種可遇';
      $('#mapInfo').textContent=(map.description?map.description+'；':'')+'目前可遇：'+(okNames.slice(0,12).join('、')||'無')+(okNames.length>12?'…':'');
    }else{
      const encounter=currentEncounter(map);
      const all=(map.entries||[]).filter(x=>Number(x.route?.encounterId)===Number(encounter?.encounterId));
      const eligible=all.filter(x=>routeUnlocked(x.route));
      const allNames=[...new Set(all.map(x=>x.species.clientLabel))];
      const okNames=[...new Set(eligible.map(x=>x.species.clientLabel))];
      const a=encounter?.area||{},groups=encounter?.groups||[],resolved=groups.filter(g=>g.resolved).length;
      $('#mapPetCount').textContent=okNames.length+' / '+allNames.length+' 種 Lv1';
      $('#mapInfo').textContent=encounter
        ?('Encounter '+encounter.encounterId+' · X '+a.xMin+'–'+a.xMax+' / Y '+a.yMin+'–'+a.yMax+' · zorder '+encounter.zorder+' · enemyMax '+encounter.enemyMax+' · Group '+resolved+'/'+groups.length+' · 遇敵CEP '+n(state.encounterCep)+'（min '+encounter.encounterMin+' / max '+encounter.encounterMax+'） · 虛擬步數 '+Math.floor(n(state.virtualWalkSteps))+'；每 900ms 放置 tick 模擬 '+IDLE_WALK_STEPS_PER_TICK+' 步，逐步使用原 rand()%120<CEP 規則；目前此區 Lv1：'+(okNames.slice(0,12).join('、')||'無')+(okNames.length>12?'…':'')+(okNames.length<allNames.length?'；另有 '+(allNames.length-okNames.length)+' 種需要條件道具。':''))
        :'此 Floor 沒有可用的 Encounter。';
    }
  }
  renderMapOptions();
  renderEncounterOptions();
  renderEnemy();
  if(playerPigActive()){
    const pigRemain=playerPigRemainingSeconds();
    $('#battleState').textContent+=' · 黑烏力化'+(pigRemain>0?' '+pigRemain+'秒':' · 戰鬥結束後解除');
  }
  renderTeam();
  renderPets();
  renderInventory();
  renderZooQuest();
  renderLog();
}
function renderEnemy(){
  const box=$('#enemyBox');
  const capBtn=$('#captureBtn');
  if(!enemy){
    box.className='enemy empty';
    const creationStatsReady=sourcePlayerCreationStatsReady(state);
    const hometownReady=sourcePlayerHometownReady(state);
    const elementReady=sourcePlayerElementsConfigured(state);
    if(!creationStatsReady){
      box.innerHTML='<div class="enemy-name">等待原服創角四圍</div><div class="muted">固定 _NEW_PLAYER_CF build：VITAL／STR／TOUGH／DEX 各 0～20、合計 ≤20；不再替新角色猜固定 5/5/5/5。</div>';
      $('#battleState').textContent='等待創角四圍';
    }else if(!hometownReady){
      box.innerHTML='<div class="enemy-name">等待原服出生村選擇</div><div class="muted">請先確認 hometown 0～3；確認後才依原 C 建立對應 Lv1 起始寵。</div>';
      $('#battleState').textContent='等待出生村';
    }else if(!elementReady){
      box.innerHTML='<div class="enemy-name">等待原服創角元素配點</div><div class="muted">舊存檔沒有保存原始地／水／火／風，因此不猜無屬性；請先在角色面板確認合法的 10 點元素。</div>';
      $('#battleState').textContent='等待元素配點';
    }else{
      box.innerHTML='<div class="enemy-name">等待下一次遭遇</div><div class="muted">'+(state.auto?'自動戰鬥運作中。':'目前已暫停。')+'</div>';
      $('#battleState').textContent=state.auto?'自動中':'已暫停';
    }
    $('#captureChance').textContent='捕獲率：—';
    $('#captureInfo').textContent='遭遇 Lv1 寵物後顯示條件。';
    capBtn.disabled=true;
    return;
  }
  const v=enemy.entry.variant;
  box.className='enemy';
  if(enemy.groupBattle){
    const units=enemy.units||[],alive=units.filter(u=>u.hp>0).length,total=units.length;
    const rows=units.map((u,i)=>{
      const hpPct=clamp(u.hp/u.maxHp*100,0,100),dead=u.hp<=0;
      return '<div class="enemy-unit '+(dead?'defeated':'')+'">'+
        '<div class="enemy-unit-head"><b>'+(i+1)+'. Lv'+u.level+' '+escapeHtml(u.name)+(u.isBig?' · 大型':'')+(u.randomEnemy?' · RandomEnemy':'')+'</b><span>EnemyID '+(u.enemyId??'—')+(u.randomEnemy&&u.sourceEnemyId!=null?' ← '+u.sourceEnemyId:'')+'</span></div>'+
        '<div class="enemy-hp">HP '+u.hp+' / '+u.maxHp+' · 攻 '+u.attack+' · 防 '+u.defense+' · 敏 '+n(u.quick)+(u.serverDerived?' · Server公式':'')+(u.randomChange?' · RandomChange '+u.randomChange.type:'')+'</div>'+
        '<div class="progress"><i style="width:'+hpPct+'%"></i></div></div>';
    }).join('');
    box.innerHTML='<div class="enemy-name">'+(enemy.dynamicGroup?'動態群組':'任務編成')+' · '+alive+' / '+total+' 存活</div>'+
      '<div class="enemy-meta"><span class="pill">多敵人戰鬥</span><span class="pill">依序鎖定第一個存活敵人</span>'+
      (enemy.encounterId!=null?'<span class="pill">Encounter '+enemy.encounterId+'</span>':'')+
      (enemy.groupId!=null?'<span class="pill">Group '+enemy.groupId+'</span>':'')+
      (enemy.roamX!=null?'<span class="pill">座標 '+enemy.roamX+','+enemy.roamY+'</span>':'')+
      (enemy.encounterCep!=null?'<span class="pill">CEP '+enemy.encounterCep+' / Roll '+enemy.encounterRoll+'</span>':'')+'</div>'+
      '<div class="enemy-units">'+rows+'</div>';
  }else{
    const hpPct=clamp(enemy.hp/enemy.maxHp*100,0,100);
    box.innerHTML='<div class="enemy-name">Lv'+enemy.level+' '+escapeHtml(enemy.name)+'</div>'+
      '<div class="enemy-meta"><span class="pill">TempNo '+v.tempNo+'</span><span class="pill">EnemyID '+(v.enemyIds||[]).join(', ')+'</span><span class="pill">E_T_GET '+n(v.captureBase)+'</span></div>'+
      '<div class="enemy-hp">HP '+enemy.hp+' / '+enemy.maxHp+'</div>'+
      '<div class="progress"><i style="width:'+hpPct+'%"></i></div>';
  }
  $('#battleState').textContent=enemy.groupBattle?'編成戰鬥中':'戰鬥中';

  const c=captureChance();
  $('#captureChance').textContent='捕獲率：'+c.display.toFixed(1)+'%';
  if(!c.allowed){
    if(c.missing?.length){
      $('#captureInfo').textContent='缺少條件道具：'+c.missing.map(x=>x.name||('Item '+x.id)).join('、');
    }else if(c.groupBattle&&!enemy.dynamicGroup){
      $('#captureInfo').textContent='目前為固定多敵人任務編成，整隊不可捕獲。';
    }else if(c.uncapturable){
      $('#captureInfo').textContent=(c.targetName?('目前鎖定 '+c.targetName+'；'):'')+'此敵人原服務端設定不可捕獲。';
    }else{
      $('#captureInfo').textContent='目前條件無法捕獲。';
    }
    capBtn.disabled=true;
  }else{
    $('#captureInfo').textContent=(c.targetName?('目前鎖定 '+c.targetName+'。 '):'')+(c.requirements?.length?'特殊捕獲條件已滿足。':'可捕獲。')+' HP 越低越容易成功。';
    capBtn.disabled=false;
  }
}
function renderTeam(){
  const byId=new Map(state.petBox.map(p=>[p.id,p]));
  $('#teamGrid').innerHTML=state.team.map((id,i)=>{
    const p=id?byId.get(id):null;
    if(!p)return '<div class="team-slot"><div><small>槽位 '+(i+1)+'</small><b>空</b></div></div>';
    const active=p.id===state.activePetId;
    return '<div class="team-slot '+(active?'active':'')+'" data-pet-id="'+p.id+'"><div><small>'+(active?'出戰':'槽位 '+(i+1))+'</small><b>'+escapeHtml(p.name)+'</b></div></div>';
  }).join('');
  const p=activePet();
  if(p)syncPetBattleHp(p,true);
  $('#activePetInfo').textContent=p?'出戰：'+p.name+' · Lv.'+p.level+(Number(p.tempNo)===718?' / 上限 '+n(p.levelCap):'')+' · HP '+n(p.hp)+' / '+n(p.maxHp)+(petIsAlive(p)?'':' · 已倒下')+' · 腕力 '+n(p.serverStats?.str??p.stats?.str)+' · 敏捷 '+n(p.serverStats?.dex??p.stats?.dex)+(p.serverProgression?' · 原服成長':''):'尚未指定出戰寵物。';
}
function renderPets(){
  const teamSet=new Set(state.team.filter(Boolean));
  const values=[...state.petBox].sort((a,b)=>{
    const aa=a.id===state.activePetId?1:0,bb=b.id===state.activePetId?1:0;
    return bb-aa||String(a.name).localeCompare(String(b.name),'zh-Hant');
  });
  $('#petTotal').textContent=values.length;
  $('#petBox').innerHTML=values.length?values.map(p=>{
    const inTeam=teamSet.has(p.id),active=p.id===state.activePetId;
    const actions=[];
    if(!inTeam)actions.push('<button data-action="join" data-id="'+p.id+'">加入隊伍</button>');
    if(inTeam&&!active)actions.push('<button class="active-action" data-action="active" data-id="'+p.id+'">設為出戰</button>');
    if(inTeam)actions.push('<button data-action="leave" data-id="'+p.id+'">退隊</button>');
    syncPetBattleHp(p,true);
    return '<div class="pet-row '+(active?'active':'')+'"><b>'+escapeHtml(p.name)+(active?' · 出戰':'')+(petIsAlive(p)?'':' · 倒下')+'</b>'+
      '<span>Lv.'+n(p.level)+' · HP '+n(p.hp)+' / '+n(p.maxHp)+' · TempNo '+(p.tempNo??'舊存檔')+' · Animation '+(p.animationGroupId??'—')+'</span>'+
      '<div class="pet-actions">'+actions.join('')+'</div></div>';
  }).join(''):'<div class="empty-note">目前還沒有寵物。把野生 Lv1 削到低 HP 後嘗試捕獲。</div>';
}
function renderInventory(){
  const held=conditionItems.filter(x=>hasItem(x.id)).length;
  const verified=conditionItems.filter(x=>x.sourceStatus==='verified').length;
  $('#inventoryKinds').textContent=held+' / '+conditionItems.length;
  $('#sourceProgress').textContent='來源 '+verified+' / '+conditionItems.length;
  $('#inventoryList').innerHTML=conditionItems.map(item=>{
    const count=n(state.inventory[String(item.id)]);
    const tags=item.kinds.map(k=>'<span class="item-tag">'+(k==='capture'?'捕獲條件':'出現條件')+'</span>').join('');
    const floors=item.floors.length?' · Floor '+item.floors.join(', '):'';
    const verified=item.sourceStatus==='verified';
    const corroborated=!verified&&(item.externalEvidence?.length>0);
    const sourceTag='<span class="item-tag '+(verified?'verified':(corroborated?'corroborated':'unresolved'))+'">'+(verified?'正式來源已確認':(corroborated?'外部資料已交叉確認':'正式來源待解'))+'</span>';
    return '<div class="inventory-row '+(count>0?'have':'')+'">'+
      '<div class="inventory-row-top"><b>'+escapeHtml(item.name)+'</b><span class="inventory-count">×'+count+'</span></div>'+
      '<div class="inventory-meta">ID '+item.id+' · 用於 '+item.usedByPets.map(escapeHtml).join('、')+floors+'</div>'+
      '<div class="item-tags">'+tags+sourceTag+'</div>'+
      '<div class="inventory-source '+(verified?'verified':'')+'">'+escapeHtml(verified?sourceSummary(item):(corroborated?item.externalEvidence[0].summary:sourceSummary(item)))+'</div>'+
    '</div>';
  }).join('');
}
function renderLog(){
  if(!state)return;
  $('#battleLog').innerHTML=(state.log||[]).map(x=>'<div class="log-line '+(x.type||'')+'">'+escapeHtml(x.text)+'</div>').join('');
}
function addToTeam(id){
  if(state.team.includes(id))return true;
  const open=state.team.findIndex(x=>!x);
  if(open<0){addLog('隊伍已滿，最多 5 隻。','bad');return false}
  state.team[open]=id;
  if(!state.activePetId)state.activePetId=id;
  addLog('寵物已加入隊伍第 '+(open+1)+' 格。','pet');
  save();render();return true;
}
function setActivePet(id){
  const chosen=state.petBox.find(p=>p.id===id);
  if(!chosen)return;
  syncPetBattleHp(chosen,true);
  if(!petIsAlive(chosen)){addLog(chosen.name+' 已倒下，休息補滿後才能設為出戰。','bad');render();return;}
  if(!state.team.includes(id)&&!addToTeam(id))return;
  state.activePetId=id;
  const p=activePet();
  addLog((p?.name||'寵物')+' 已設為出戰。','pet');
  save();render();
}
function leaveTeam(id){
  const idx=state.team.indexOf(id);
  if(idx<0)return;
  state.team[idx]=null;
  if(state.activePetId===id)state.activePetId=state.team.find(Boolean)||null;
  addLog('寵物已退出隊伍。','pet');
  save();render();
}
function escapeHtml(s){
  return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
async function boot(){
  try{
    const [r,runtimeR,itemR,zooR,aiR,petSkillR,modAiR,attackMagicR,itemMagicR,itemRelifeR,itemMakeR,gmqueR,enemyWeaponR]=await Promise.all([
      fetch(DATA_URL,{cache:'no-store'}),
      fetch(ENCOUNTER_RUNTIME_URL,{cache:'no-store'}),
      fetch(CONDITION_ITEM_URL,{cache:'no-store'}),
      fetch(ZOO_QUEST_URL,{cache:'no-store'}),
      fetch(ENEMY_AI_URL,{cache:'no-store'}),
      fetch(PETSKILL_RUNTIME_URL,{cache:'no-store'}),
      fetch(PET_MODAI_URL,{cache:'no-store'}),
      fetch(ATTACK_MAGIC_RUNTIME_URL,{cache:'no-store'}),
      fetch(ITEM_MAGIC_RUNTIME_URL,{cache:'no-store'}),
      fetch(ITEM_RELIFE_RUNTIME_URL,{cache:'no-store'}),
      fetch(ITEM_MAKE_RUNTIME_URL,{cache:'no-store'}),
      fetch(GMQUE_TROPHY_RUNTIME_URL,{cache:'no-store'}),
      fetch(ENEMY_WEAPON_RUNTIME_URL,{cache:'no-store'})
    ]);
    if(!r.ok)throw new Error('寵物資料 HTTP '+r.status);
    if(!runtimeR.ok)throw new Error('Encounter runtime HTTP '+runtimeR.status);
    if(!itemR.ok)throw new Error('條件道具資料 HTTP '+itemR.status);
    if(!zooR.ok)throw new Error('動物園任務資料 HTTP '+zooR.status);
    if(!aiR.ok)throw new Error('Enemy AI 資料 HTTP '+aiR.status);
    if(!petSkillR.ok)throw new Error('PetSkill runtime HTTP '+petSkillR.status);
    if(!modAiR.ok)throw new Error('Pet MODAI runtime HTTP '+modAiR.status);
    if(!attackMagicR.ok)throw new Error('AttackMagic runtime HTTP '+attackMagicR.status);
    if(!itemMagicR.ok)throw new Error('Item MAGICUSEMP runtime HTTP '+itemMagicR.status);
    if(!itemRelifeR.ok)throw new Error('Item relife runtime HTTP '+itemRelifeR.status);
    if(!itemMakeR.ok)throw new Error('Item make runtime HTTP '+itemMakeR.status);
    if(!gmqueR.ok)throw new Error('GMQUE trophy runtime HTTP '+gmqueR.status);
    if(!enemyWeaponR.ok)throw new Error('Enemy weapon runtime HTTP '+enemyWeaponR.status);
    db=await r.json();
    encounterRuntime=await runtimeR.json();
    enemyAiDb=await aiR.json();
    petSkillDb=await petSkillR.json();
    petModAiDb=await modAiR.json();
    attackMagicDb=await attackMagicR.json();
    itemMagicDb=await itemMagicR.json();
    itemRelifeDb=await itemRelifeR.json();
    itemMakeDb=await itemMakeR.json();
    gmqueDb=await gmqueR.json();
    enemyWeaponDb=await enemyWeaponR.json();
    buildDynamicGroupCatalog();
    buildEncounterCatalog();
    zooQuest=await zooR.json();
    buildSourceCatalog(await itemR.json());
    buildConditionItems();
    buildMaps();
    state=loadState();
    playerComplianceParameter(state);
    if(!maps.some(m=>String(m.id)===String(state.mapId)))state.mapId=maps[0]?.id||null;
    state.expNext=expToNext(state.level);
    renderMapOptions();
    addLog('V1.72 載入完成：ITEM_makeItem 固定 66 顆 RNG 已接入 existing item 建立；Enemy 10 格掉落已改成每格命中後立即建 item，再進下一格，對齊 fixed enemy.c。','good');
    render();
    timer=setInterval(tick,900);
  }catch(err){
    document.body.innerHTML='<main class="shell"><article class="card">資料讀取失敗：'+escapeHtml(err.message)+'</article></main>';
  }
}
function handleZooAction(action){
  const q=state.quest,e81=q.event81,e2=q.event2,e4=q.event4,prep=q.event71Prep,e82=q.event82,e83=q.event83;
  if(action==='accept82'){
    if(!q.event81Complete)return;
    e82.active=true;addLog('已向園長接取 Event 82：尋回雷爾胖、波波頓與拉斯基。','good');
  }
  if(action==='feed19733'){giveItem(19733,1);addLog('布伊太郎交給你雷爾胖專用飼料 19733。','pet');}
  if(action==='feed19723'){giveItem(19723,1);addLog('從飼料桶取得肉食性飼料二號 19723。','pet');}
  if(action==='goto-raelpang'){state.mapId='zoo-raelpang';clearEnemyBattleNoReward();addLog('前往伊甸園雷爾胖任務區。');}
  if(action==='goto-popodon'){state.mapId='zoo-popodon';clearEnemyBattleNoReward();addLog('前往伊甸園波波頓任務區。');}
  if(action==='report-raelpang'&&hasPetTempNo(905)){
    e82.raelpangReported=true;if(hasItem(19733))consumeItem(19733,1);
    addLog('布伊太郎確認你帶回雷爾胖，並收回專用飼料。','good');
  }
  if(action==='report-popodon'&&hasPetTempNo(786)){
    e82.popodonReported=true;addLog('飼育員確認這是 Lv1 波波頓。','good');
  }

  if(action==='event2-start'&&!hasItem(2414)&&!e2.active){
    e2.active=true;giveItem(2415,1);
    addLog('Event 2：日美子請你把花 2415 送給彌生。','good');
  }
  if(action==='event2-finish'&&e2.active&&hasItem(2415)){
    consumeItem(2415,1);giveItem(2414,1);e2.active=false;e2.complete=true;
    addLog('Event 2 完成：彌生收下花，回贈不可思議的貝殼 2414。','good');
  }
  if(action==='event4-start'&&!e4.complete&&!e4.active){
    e4.active=true;e4.stage=1;
    addLog('Event 4：Floor 10204 的儀式審判開始成人禮，要求取得 15 個儀玉 2417。','good');
  }
  if(action==='event4-get-jade'&&e4.active&&!e4.complete&&!hasItem(2417,15)){
    const need=Math.max(0,15-n(state.inventory['2417']));
    if(need>0)giveItem(2417,need);
    e4.stage=2;
    addLog('儀式審判的差使交給你儀玉 2417，共補足至 15 個。','pet');
  }
  if(action==='event4-finish'&&e4.active&&!e4.complete&&hasItem(2417,15)){
    consumeItem(2417,15);giveItem(2418,1);
    e4.active=false;e4.complete=true;e4.stage=3;
    addLog('Event 4 成人式完成：交出儀玉 2417 ×15，取得 Item 2418；依 event04_1 正式設為 ENDEV=4。','good');
  }
  if(action==='event81-start'&&e4.complete&&!e81.complete&&e81.stage===0&&state.level>80){
    if(!hasItem(19696))giveItem(19696,1);
    e81.active=true;e81.stage=1;
    addLog('Event81：打工名人克拉克確認 Lv81+ 與成人式資格，交給你推薦函 19696。','good');
  }
  if(action==='event81-trainer'&&e81.stage===1&&hasItem(19696)){
    consumeItem(19696,1);giveItem(19697,1);e81.stage=2;
    addLog('霍特雷敦收下推薦函，交給你飛龍捕捉證明書 19697；四種飛龍任選一隻即可。','pet');
  }
  if(action==='event81-goto-dragon'&&e81.stage===2){
    const map=maps.find(m=>m.entries.some(x=>Number(x.variant?.tempNo)===273));
    if(map){state.mapId=map.id;clearEnemyBattleNoReward();addLog('前往 '+map.name+' 捕捉加寶格恩（TempNo 273）。','good');}
    else addLog('目前資料中找不到可直接前往的飛龍 Lv1 路線。','bad');
  }
  if(action==='event81-submit-dragon'&&e81.stage===2&&hasItem(19697)){
    const dragons=[271,272,273,274],active=activePet();
    const p=(active&&dragons.includes(Number(active.tempNo)))?active:state.petBox.find(x=>dragons.includes(Number(x.tempNo)));
    if(!p)addLog('霍特雷敦需要帖拉格恩271／洛卡倫恩272／加寶格恩273／朵拉比斯274其中一隻。','bad');
    else{
      e81.deliveredTempNo=Number(p.tempNo);
      const id=p.id;
      state.petBox=state.petBox.filter(x=>x.id!==id);
      state.team=state.team.map(x=>x===id?null:x);
      if(state.activePetId===id)state.activePetId=state.team.find(Boolean)||null;
      consumeItem(19697,1);e81.stage=3;e81.mazeFloor=5576;e81.mazeX=24;e81.mazeY=86;e81.mazeBattles=0;
      addLog('霍特雷敦收下 '+p.name+' 與捕捉證明書；發現布蘭恩002失蹤，正式進入 NOWEV=81。PC團金剛陣從 Floor 5576 (24,86) 開始。','good');
    }
  }
  if(action==='event81-maze-battle'&&e81.stage===3){
    const zone=event81MazeZone(e81.mazeX);
    if(zone){state.mapId=zone;clearEnemyBattleNoReward();addLog('在 Floor '+n(e81.mazeFloor)+' ('+n(e81.mazeX)+','+n(e81.mazeY)+') 挑戰 PC團盜賊。');}
    else addLog('目前金剛陣座標無法對應原始戰鬥區。','bad');
  }
  if(action==='event81-maze-reset'&&e81.stage===3){
    e81.mazeFloor=5576;e81.mazeX=24;e81.mazeY=86;state.mapId='event81-thief-1';clearEnemyBattleNoReward();
    addLog('金剛陣座標已重置到 Floor 5576 (24,86)。','pet');
  }
  if(action==='event81-boss'&&e81.stage===6){state.mapId='event81-boss';clearEnemyBattleNoReward();addLog('前往 Floor 5582 (33,87) 挑戰 PC團老大。','good');}
  if(action==='event81-confession'&&e81.stage===7){
    if(!hasItem(19698))giveItem(19698,1);
    e81.stage=8;
    addLog('PC團老大承認偷走布蘭恩002，交給你悔過書 19698；布蘭恩002由其部下送回。','pet');
  }
  if(action==='event81-complete'&&e81.stage===8&&hasItem(19698)){
    if(!hasItem(19699))giveItem(19699,1);
    e81.active=false;e81.complete=true;q.event81Complete=true;
    addLog('霍特雷敦確認布蘭恩002已歸還，交給你研究報告 19699；依 eden81_2 正式 EndSetFlg:81。','good');
  }
  const flightMatch=/^event81-fly-eden-(1|2|3)$/.exec(action);
  if(flightMatch&&e81.complete&&!e81.arrivedEden&&hasItem(19699)){
    const denied=[2402,2403,2404,2405,2406,2407,2408,2409,2410,2411,2412,2413].filter(id=>hasItem(id));
    if(denied.length)addLog('飛龍航空拒絕搭載目前持有的禁運道具：'+denied.join('、')+'。','bad');
    else if(state.gold<10000)addLog('飛龍航空旅費需要 10,000 石幣。','bad');
    else{
      const routeNo=Number(flightMatch[1]),route=EVENT81_AIR_ROUTES[routeNo-1]||[];
      state.gold-=10000;e81.arrivedEden=true;e81.flightRouteNo=routeNo;e81.flightWaypoints=route.map(p=>p.slice());
      const floors=[...new Set(route.map(p=>p[0]))].join(' → ');
      addLog('支付 10,000 石幣，搭乘飛龍航空 '+routeNo+' 號線；依原 routeto1 經過 '+route.length+' 個座標節點，Floor '+floors+'，抵達伊甸。','good');
    }
  }
  if(action==='event81-bruce'&&e81.complete&&e81.arrivedEden&&!e81.postReward&&hasItem(19699)){
    consumeItem(19699,1);state.gold+=200000;e81.postReward=true;
    addLog('飛龍總教練布魯斯收下研究報告 19699，依 eden81_10 給予 200,000 石幣。','good');
  }
  if(action==='event69-start'&&!q.event71Current&&e4.complete&&prep.stage===0){
    prep.stage=1;addLog('Event 69：願藏祖父委託你尋找失蹤的新藏，正式設為 NOWEV=69。','good');
  }
  if(action==='event69-kui'&&!q.event71Current&&e4.complete&&prep.stage===1){
    if(!hasItem(19621))giveItem(19621,1);
    prep.stage=2;
    addLog('庫伊爺爺把發亮護身符 19621 交給你，建議拿它吸引卡卡金寶。','pet');
  }
  if(action==='event69-enter-cave'&&!q.event71Current&&prep.stage===2&&hasItem(19621)){
    consumeItem(19621,1);prep.stage=3;
    addLog('卡卡金寶被護身符吸引；依 event69_2 收走 19621，進入蛙洞 Floor 30601。','good');
  }
  if(action==='event69-shinzo-gold'&&!q.event71Current&&prep.stage===3){
    if(!hasItem(19622))giveItem(19622,1);
    prep.stage=4;
    addLog('在 Floor 30602 找到新藏；他把惹怒里昂蛙群的金珠 19622 交給你。','pet');
  }
  if(action==='goto-frog-king'&&!q.event71Current&&prep.stage===4&&hasItem(19622)){
    state.mapId='event69-frog-king';clearEnemyBattleNoReward();
    addLog('帶著金珠 19622 前往 Floor 30605 挑戰里昂蛙王。','good');
  }
  if(action==='event69-frog-exchange'&&!q.event71Current&&prep.stage===5&&hasItem(19622)){
    consumeItem(19622,1);giveItem(19623,1);prep.stage=6;
    addLog('里昂蛙王收回金珠 19622，依 event69_6 送你黑玉 19623 作為和解證明。','good');
  }
  if(action==='event70-start-shinzo'&&!q.event71Current&&prep.stage===6&&hasItem(19623)){
    consumeItem(19623,1);prep.stage=7;
    addLog('新藏用精靈情報交換黑玉 19623；依 event69_4 的 EventNo 70 REQUEST 正式開啟 NOWEV=70。','good');
  }
  if(action==='event69-finish-shinzo'&&!q.event71Current&&prep.stage===7){
    prep.stage=8;
    addLog('新藏把失憶的瑪蕾菲雅託付給你照顧；依 event69_4 正式 EndSetFlg:69。','good');
  }
  if(action==='event70-finish'&&!q.event71Current&&prep.stage===8){
    const p=addMarefiaPet();
    if(!hasItem(19624))giveItem(19624,1);
    prep.stage=9;prep.memoryIndex=0;prep.memoryReady=false;
    addLog('Event70 完成：願藏祖母交給你 Lv1 瑪蕾菲雅（EnemyID 1479／TempNo 718）與項鍊 19624，正式 EndSetFlg:70。','good');
    if(!state.team.includes(p.id)){const open=state.team.findIndex(x=>!x);if(open>=0)state.team[open]=p.id;}
  }
  const memoryMatch=/^marefia-memory-(\d+)$/.exec(action);
  if(memoryMatch&&!q.event71Current&&prep.stage===9){
    const idx=Number(memoryMatch[1]),node=MAREFIA_MEMORY_ROUTE[idx],marefia=marefiaPet();
    if(!node||idx!==Math.floor(n(prep.memoryIndex)))addLog('這個回憶節點目前尚未開放。','bad');
    else if(!marefia)addLog('隊伍中沒有瑪蕾菲雅。','bad');
    else if(n(marefia.level)!==node.level)addLog('瑪蕾菲雅必須正好 Lv'+node.level+' 才能觸發這段原始回憶。','bad');
    else{
      marefia.levelCap=node.nextCap;
      prep.memoryIndex=idx+1;
      if(node.rewardItem){
        giveItem(node.rewardItem,node.rewardCount||1);
        addLog('Floor '+node.floor+' 回憶完成，依 EVENTRUN7 取得 Item '+node.rewardItem+' ×'+(node.rewardCount||1)+'。','pet');
      }
      addLog('瑪蕾菲雅回憶 '+(idx+1)+'/'+MAREFIA_MEMORY_ROUTE.length+'：Floor '+node.floor+'（'+node.clue+'），等級上限開放至 Lv'+node.nextCap+'。','good');
    }
  }
  if(action==='marefia-final'&&!q.event71Current&&prep.stage===9){
    const marefia=marefiaPet();
    if(!marefia||Math.floor(n(prep.memoryIndex))<MAREFIA_MEMORY_ROUTE.length||n(marefia.level)!==79){
      addLog('必須完成 14 段回憶並把瑪蕾菲雅練到 Lv79。','bad');
    }else{
      prep.memoryReady=true;prep.stage=10;
      addLog('Lv79 瑪蕾菲雅：已完全了解自己的使命，必須前往拯救被困的精靈王。','good');
    }
  }
  if(action==='pet-trans'&&!q.event71Current&&prep.stage===10&&prep.memoryReady){
    const marefia=marefiaPet(),p=activePet();
    if(!e4.complete)addLog('精靈王：必須先完成 Event 4 成人式。','bad');
    else if(state.level<80)addLog('精靈王：角色必須 Lv80 以上。','bad');
    else if(!marefia||n(marefia.level)!==79)addLog('精靈王：必須帶著 Lv79 瑪蕾菲雅。','bad');
    else if(!p||Number(p.tempNo)===718)addLog('請先把要接受祝福的另一隻寵物設為出戰。','bad');
    else if(n(p.level)<80)addLog('接受轉生祝福的寵物必須 Lv80 以上。','bad');
    else if(n(p.transmigration)>0)addLog('這隻寵物已經接受過轉生祝福。','bad');
    else{
      const mid=marefia.id;
      state.petBox=state.petBox.filter(x=>x.id!==mid);
      state.team=state.team.map(x=>x===mid?null:x);
      p.transmigration=1;p.level=1;p.exp=0;
      prep.stage=11;q.event71Current=true;
      addLog(p.name+' 接受精靈王祝福完成轉生；依 npc_transmigration.c 正式設為 NOWEV=71。','good');
    }
  }
  if(action==='start83'&&q.event71Current&&hasItem(2414)&&e82.active&&!e83.complete){
    e83.active=true;addLog('已向里拉拉開始 Event 83：尋回拉斯基。','good');
  }
  if(action==='get-shovel'&&e83.active&&!hasItem(19701)){
    giveItem(19701,1);addLog('園丁借給你鏟子 19701。','pet');
  }
  if(action==='pull-white'&&e83.active&&hasItem(19701)){
    if([19702,19703,19704,19705,19706,19707,19708,19709,19710,19711,19712,19713,19714,19715].some(hasItem)){
      addLog('身上已有白蘿蔔／線索道具，不能再挖。','bad');
    }else{
      const id=Math.random()<0.1?19703:19702;giveItem(id,1);
      addLog('挖到 '+(id===19703?'上等白蘿蔔 19703':'普通白蘿蔔 19702')+'。','pet');
    }
  }
  if(action==='pull-red'&&e83.active&&hasItem(19701)){
    if([12090,12091,12092,12093].some(hasItem)){addLog('身上已有紅蘿蔔，先處理掉再挖。','bad');}
    else{
      const r=Math.floor(Math.random()*9),id=r<5?12090:(r<8?12091:12092);giveItem(id,1);
      addLog('挖到任務紅蘿蔔 Item '+id+'。','pet');
    }
  }
  if(action==='discard-bad'){
    for(const id of [19702,12090,12091,12092])while(hasItem(id))consumeItem(id,1);
    addLog('里拉拉把次等蘿蔔全踩爛了。','pet');
  }
  if(action==='buy12093'&&!hasItem(12093)){
    if(state.gold<25)addLog('石幣不足 25。','bad');
    else{state.gold-=25;giveItem(12093,1);addLog('在柯奧特產品商店購買 12093 柯奧產紅蘿蔔，花費 25 石幣。價格採歷史價目交叉資料。','pet');}
  }
  if(action==='exchange19704'&&hasItem(19703)&&hasItem(12093)){
    consumeItem(19703,1);consumeItem(12093,1);giveItem(19704,1);
    addLog('園丁收下 12093＋19703，交給你最上等白蘿蔔 19704。','good');
  }
  if(action==='lala-next'){
    const cur=[19704,19705,19706,19707,19708,19709,19710].find(hasItem);
    if(cur){clearEvent83Chain();giveItem(cur+1,1);addLog('里拉拉線索推進：'+cur+' → '+(cur+1)+'。','good');}
  }
  if(action==='goto-collar'&&hasItem(19711)){state.mapId='zoo-collar';clearEnemyBattleNoReward();addLog('前往格爾希洛項圈區。');}
  if(action==='exchange19712'&&hasItem(19711)&&hasItem(19716)){
    clearEvent83Chain([19716]);giveItem(19712,1);addLog('里拉拉收下項圈，線索變為 19712。','good');
  }
  if(action==='next19713'&&hasItem(19712)){
    clearEvent83Chain();giveItem(19713,1);addLog('里拉拉指示前往大雕像，取得線索 19713。','good');
  }
  if(action==='goto-clothes'&&hasItem(19713)){state.mapId='zoo-black-clothes';clearEnemyBattleNoReward();addLog('前往不良少年怪衣區。');}
  if(action==='exchange19714'&&hasItem(19713)&&hasItem(19717)){
    clearEvent83Chain([19717]);giveItem(19714,1);addLog('里拉拉收下怪衣，取得地下據點線索 19714。','good');
  }
  if(action==='goto-flag'&&hasItem(19714)){state.mapId='zoo-underground-flag';clearEnemyBattleNoReward();addLog('進入地下洞窟 Group 962，尋找黑旗 19718。');}
  if(action==='goto-sig'&&hasItem(19714)&&hasItem(19718)){state.mapId='zoo-sig';clearEnemyBattleNoReward();addLog('前往 Floor 60044 挑戰席格。','good');}
  if(action==='after83'&&e83.complete&&hasPetTempNo(854)&&hasItem(19714)){
    clearEvent83Chain();giveItem(19715,1);addLog('帶任務版拉斯基回見里拉拉，19714 → 19715。','good');
  }

  if(action==='finish82'&&hasPetTempNo(905)&&hasPetTempNo(786)&&hasPetTempNo(854)){
    removeOnePetTempNo(905);removeOnePetTempNo(786);removeOnePetTempNo(854);
    const reward=addQuestRewardPet();e82.active=false;e82.complete=true;
    addLog('Event 82 完成：三隻動物已交回，獲得 '+reward.name+'（TempNo 730）。','good');
  }
  if(action==='reward19719'&&e82.complete&&e83.complete&&hasItem(19715)&&!hasItem(19719)){
    clearEvent83Chain();giveItem(19719,1);addLog('里拉拉交給你後續謝禮 19719。','good');
  }
  save();render();
}
$('#mapSelect').addEventListener('change',e=>{
  state.mapId=e.target.value;state.encounterId=null;clearEnemyBattleNoReward();
  const map=currentMap(),enc=currentEncounter(map);
  addLog('前往 '+map.name+(enc?' · Encounter '+enc.encounterId:'')+'。');save();render();
});
$('#encounterSelect').addEventListener('change',e=>{
  state.encounterId=Number(e.target.value)||null;clearEnemyBattleNoReward();
  const enc=currentEncounter();
  if(enc)addLog('移動到 Encounter '+enc.encounterId+' 狩獵區。');
  save();render();
});
$('#autoBtn').addEventListener('click',()=>{
  state.auto=!state.auto;
  addLog('自動戰鬥已'+(state.auto?'開啟。':'暫停。'));save();render();
});
$('#autoCaptureBtn').addEventListener('click',()=>{
  state.autoCapture=!state.autoCapture;
  addLog('自動捕獲已'+(state.autoCapture?'開啟。':'關閉。'));save();render();
});
$('#captureBtn').addEventListener('click',()=>captureTurn(true));
$('#guardBtn').addEventListener('click',()=>guardTurn());
$('#healBtn').addEventListener('click',()=>{
  state.hp=state.maxHp;
  state.mp=state.maxMp;
  let healedPets=0;
  for(const p of state.petBox){
    syncPetBattleHp(p,true);
    if(n(p.hp)<n(p.maxHp)){p.hp=p.maxHp;healedPets++;}
  }
  addLog('休息完成，角色 HP／MP 已補滿'+(healedPets?'，並恢復 '+healedPets+' 隻寵物。':'。'),'good');save();render();
});
$('#playerParamGrid').addEventListener('click',e=>{
  const b=e.target.closest('button[data-player-stat]');if(!b)return;
  allocatePlayerStat(b.dataset.playerStat);
});
$('#playerCreationStatsGrid').addEventListener('input',e=>{
  const input=e.target.closest('input[data-player-create-stat]');if(!input||sourcePlayerCreationStatsReady(state))return;
  const key=input.dataset.playerCreateStat;
  if(!Object.prototype.hasOwnProperty.call(playerCreationStatsDraft,key))return;
  const raw=input.value.trim();
  playerCreationStatsDraft[key]=raw===''?NaN:Number(raw);
  renderPlayerCreationStats();
});
$('#playerCreationStatsConfirmBtn').addEventListener('click',()=>confirmPlayerCreationStats(playerCreationStatsDraft));
$('#playerElementGrid').addEventListener('input',e=>{
  const input=e.target.closest('input[data-player-element]');if(!input||sourcePlayerElementsConfigured(state))return;
  const key=input.dataset.playerElement;
  if(!Object.prototype.hasOwnProperty.call(playerElementDraft,key))return;
  const raw=input.value.trim();
  playerElementDraft[key]=raw===''?NaN:Number(raw);
  renderPlayerElements();
});
$('#playerElementConfirmBtn').addEventListener('click',()=>confirmPlayerElements(playerElementDraft));
$('#playerHometownSelect').addEventListener('change',()=>renderPlayerHometown());
$('#playerHometownConfirmBtn').addEventListener('click',()=>confirmPlayerHometown($('#playerHometownSelect').value));
$('#zooQuestActions').addEventListener('click',e=>{
  const b=e.target.closest('button[data-zoo-action]');if(!b)return;
  handleZooAction(b.dataset.zooAction);
});
$('#testSupplyBtn').addEventListener('click',()=>{
  for(const key of sourceCatalog.keys())giveItem(key,1);
  addLog('開發測試補給：只加入原 9 種特殊出現／捕獲條件道具，不再灌入 Event83 任務鏈。','pet');
  save();render();
});
$('#petBox').addEventListener('click',e=>{
  const b=e.target.closest('button[data-action]');if(!b)return;
  const id=b.dataset.id,act=b.dataset.action;
  if(act==='join')addToTeam(id);
  if(act==='active')setActivePet(id);
  if(act==='leave')leaveTeam(id);
});
$('#teamGrid').addEventListener('click',e=>{
  const slot=e.target.closest('[data-pet-id]');if(slot)setActivePet(slot.dataset.petId);
});
window.addEventListener('beforeunload',save);
boot();
