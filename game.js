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
const ITEM_FIELD2_RUNTIME_URL='data/generated/stoneage_item_field2_runtime.json';
const PET_MERGE_FIX_RUNTIME_URL='data/generated/stoneage_pet_merge_fix_runtime.json';
const PROFESSION_SKILL_RUNTIME_URL='data/generated/stoneage_profession_skill_runtime.json';
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
const PROFESSION_SKILL_SLOT_COUNT=26;
const PROFESSION_LEVEL_MAX=26;
const PROFESSION_SKILL_LEVEL_MAX=100;
const PROFESSION_CLASS_NONE=0;
const PROFESSION_CLASS_FIGHTER=1;
const PROFESSION_CLASS_WIZARD=2;
const PROFESSION_CLASS_HUNTER=3;
const PLAYER_HEAD_SLOT=0;
const PLAYER_BODY_SLOT=1;
const PLAYER_ARM_SLOT=2;
const PLAYER_DECORATION1_SLOT=3;
const PLAYER_DECORATION2_SLOT=4;
const PLAYER_BELT_SLOT=5;
const PLAYER_SHIELD_SLOT=6;
const PLAYER_SHOES_SLOT=7;
const PLAYER_GLOVE_SLOT=8;
const SOURCE_PLAYER_RANGED_WEAPON_TYPES=new Set([4,17,18,19]);
// fixed _ANGEL_SUMMON: CHAR_moveItemFromItemBoxToEquip only special-checks ANGELITEM 2884.\n// HEROITEM 2885 is ITEM_OTHER (type 16), so ITEM_getEquipPlace() rejects it normally.\nconst SOURCE_PLAYER_SPECIAL_EQUIP_IDS=new Set([2884]);
// fixed itemset6.txt ITEM_ARGUMENT: 18546 noen:40 / 18547 noen:80 / 18548 noen:120.
const SOURCE_PLAYER_NOENEMY_LEVEL_BY_ITEM=Object.freeze({18546:40,18547:80,18548:120});
// fixed itemset6.txt ITEM_ARGUMENT: moon ornaments use rand:60 / rand:70 / rand:100.
const SOURCE_PLAYER_RANDENEMY_BY_ITEM=Object.freeze({20126:60,20127:70,20128:100});
// fixed itemset6 callback rows with ITEM_MagicEquitWear / ITEM_MagicEquitReWear.
const SOURCE_PLAYER_MAGIC_DEFENSE_ITEM_IDS=new Set([20184,20420,20421]);
// fixed ITEM_CheckSuitEquip ListSuit[] order. The parser uses strstr() on each pipe token,
// so preserve this exact key order instead of treating ITEM_ARGUMENT as a generic object.
const SOURCE_PLAYER_SUIT_KEYS=Object.freeze([
  'VIT','FSTR','MSTR','MTGH','MDEX','WAST','HP','MP',
  'FRES','IRES','TRES','RESIST','COUNTER','M_POW',
  'EARTH','WRITER','FIRE','WIND',
  'WDUCKPOWER','RENOCASE','SUITSTRP','SUITTGH_P','SUITDEXP',
  'SUITPOISON','M2_POW','UN_POW_M'
]);
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
let db=null, encounterRuntime=null, enemyAiDb=null, petSkillDb=null, petModAiDb=null, attackMagicDb=null, itemMagicDb=null, itemRelifeDb=null, itemMakeDb=null, itemField2Db=null, itemField2LoadPromise=null, petMergeFixDb=null, petMergeFixLoadPromise=null, professionSkillDb=null, gmqueDb=null, enemyWeaponDb=null, zooQuest=null, maps=[], conditionItems=[], sourceCatalog=new Map(), dynamicGroupCatalog=new Map(), encounterCatalog=new Map(), state=null, enemy=null, timer=null, playerCreationStatsDraft={vital:0,str:0,tgh:0,dex:0}, playerElementDraft={earth:0,water:0,fire:0,wind:0}, battleStatuses=new Map(), battlePetOutIds=new Set(), battlePetDeathProcessedIds=new Set(), battlePetFixAiSnapshots=new Map(), battlePlayerDeathProcessed=false, battlePlayerDeathResult=null, battleOuterAddProfitPending=false, battlePetChargeStates=new Map(), battlePetEarthRoundStates=new Map(), battlePetHiddenIds=new Set(), battlePetGuardIds=new Set(), battlePetAcupunctureIds=new Set(), battlePetPowerMods=new Map(), battleMagicPetStates=new Map(), battleMagicPetRoundStates=new Map(), battlePetRecoveryAiIds=new Set(), battlePetNoGuardStates=new Map(), battlePetVaryStates=new Map(), battlePlayerGuardianPetId=null, battleReverseKeys=new Set(), battlePropertyKeys=new Set(), battleElementWork=new Map(), battleDrunkReleaseBoostKeys=new Set(), battleWeakenRoundKeys=new Set(), battleUltimateWork=new Map(), battleUltimateFlags=new Map(), battleSarsStates=new Map(), battleSarsCarrierKeys=new Set(), battleShootSleepStates=new Map(), battleDefMagicStates=new Map(), battleGetItemPool=[], battleFieldState={attr:'none',power:0,turns:0};
let sourceEnemyUnitSerial=0;
const sourceField2SelectedSlots=new Set();
let sourceMergeCandidateCacheMemo=null;
let sourceLastMergeTimeSec=0;
let professionEncounterFix=0;
let professionEncounterUntilSec=0;
let battlePlayerProfessionHitState=null;
let battlePlayerProfessionStatStates={str:null,tgh:null,dex:null};
let battlePlayerProfessionStatRound=null;
let battleProfessionScapegoat=null;
let battlePlayerRawGuardCommand=false;
let battlePlayerFixedToughWork=null;
let battlePlayerAvoidWork=null;
let battlePlayerWeaponFocusWork=null;
let battlePlayerProfessionTrap=null;
let battlePlayerMySkillStrPower=0;
let battlePlayerFixedAttackWork=null;
let battlePlayerAttackWork=null;

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
const sourceItemMakeTemplateCache=new Map();
function sourceItemMakeDataIndex(name){
  const order=itemMakeDb?.itemDataIntOrder;
  return Array.isArray(order)?order.indexOf(String(name)):-1;
}
function sourceItemMakeTemplateData(itemId){
  const id=Math.trunc(Number(itemId));
  if(!Number.isFinite(id)||!itemMakeDb?.byItemId)return null;
  const key=String(id);
  if(sourceItemMakeTemplateCache.has(key))return sourceItemMakeTemplateCache.get(key);
  if(!Object.prototype.hasOwnProperty.call(itemMakeDb.byItemId,key))return null;
  const count=Math.trunc(Number(itemMakeDb.itemDataIntCount));
  if(count!==66||!Array.isArray(itemMakeDb.defaultData)||itemMakeDb.defaultData.length!==count)return null;
  const row=itemMakeDb.byItemId[key];
  const base=itemMakeDb.defaultData.map(v=>Math.trunc(Number(v)));
  const widths=Array(count).fill(0);
  const applySparse=(pairs,target,{nonnegative=false}={})=>{
    if(!Array.isArray(pairs)||(pairs.length%2)!==0)return false;
    for(let i=0;i<pairs.length;i+=2){
      const index=Math.trunc(Number(pairs[i])),value=Number(pairs[i+1]);
      if(!Number.isFinite(index)||index<0||index>=count||!Number.isFinite(value))return false;
      const resolved=Math.trunc(value);
      if(nonnegative&&resolved<0)return false;
      target[index]=resolved;
    }
    return true;
  };
  if(!applySparse(row?.b||[],base)||!applySparse(row?.w||[],widths,{nonnegative:true}))return null;
  const idIndex=sourceItemMakeDataIndex('ITEM_ID');
  if(idIndex<0||base[idIndex]!==id)return null;
  const result={base,widths};
  sourceItemMakeTemplateCache.set(key,result);
  return result;
}
function sourceItemRuntimeDataInt(slot,fieldName){
  const index=sourceItemMakeDataIndex(fieldName);
  const count=Math.trunc(Number(itemMakeDb?.itemDataIntCount));
  if(index<0||count!==66||!Array.isArray(slot?.sourceData)||slot.sourceData.length!==count)return null;
  const value=Number(slot.sourceData[index]);
  return Number.isFinite(value)?Math.trunc(value):null;
}
function sourceItemMakeCallbacks(itemId){
  const id=Math.trunc(Number(itemId));
  const row=Number.isFinite(id)&&itemMakeDb?.byItemId?itemMakeDb.byItemId[String(id)]:null;
  const f=row?.f&&typeof row.f==='object'?row.f:{};
  return {
    initFunc:typeof f.i==='string'?f.i:'',
    attachFunc:typeof f.a==='string'?f.a:'',
    detachFunc:typeof f.d==='string'?f.d:''
  };
}
function sourceItemMakeCallbackArgument(itemId){
  const id=Math.trunc(Number(itemId));
  const row=Number.isFinite(id)&&itemMakeDb?.byItemId?itemMakeDb.byItemId[String(id)]:null;
  return typeof row?.g==='string'?row.g:'';
}
function sourcePlayerLiveCallbackArgument(existing,itemId){
  if(existing?.field2Char&&Object.prototype.hasOwnProperty.call(existing.field2Char,'argument')){
    return String(existing.field2Char.argument??'');
  }
  return sourceItemMakeCallbackArgument(itemId);
}
function sourcePlayerEquipResistSpecFromArgument(argument){
  const markers=Array.isArray(itemMakeDb?.equipResistSource?.markers)
    ?itemMakeDb.equipResistSource.markers:[];
  const raw=String(argument||'');
  for(const entry of markers){
    const marker=typeof entry?.marker==='string'?entry.marker:'';
    const offset=Math.trunc(Number(entry?.atoiOffset));
    if(!marker||!Number.isFinite(offset)||offset<0)continue;
    const p=raw.indexOf(marker);
    if(p<0)continue;
    const parsed=parseInt(raw.slice(p+offset),10);
    return {
      key:String(entry?.key||''),
      value:Number.isFinite(parsed)?Math.trunc(parsed):0,
      marker,offset
    };
  }
  return null;
}
function sourcePlayerFixedEquipResistTemplate(itemId){
  const id=Math.trunc(Number(itemId));
  const row=Number.isFinite(id)&&itemMakeDb?.byItemId?itemMakeDb.byItemId[String(id)]:null;
  const f=row?.f&&typeof row.f==='object'?row.f:{};
  // A fixed row with this exact callback pair is source-backed even when its argument
  // contains none of the seven strstr markers. In that case the original callback is a no-op;
  // do not turn that harmless source row into a callback-unported equip rejection.
  return f.a==='ITEM_MagicResist'&&f.d==='ITEM_MagicReResist';
}
function sourceItemRuntimeResolvedDataInt(slot,fieldName){
  const exact=sourceItemRuntimeDataInt(slot,fieldName);
  if(exact!=null)return exact;
  const index=sourceItemMakeDataIndex(fieldName);
  const itemId=Math.trunc(Number(slot?.itemId));
  const template=sourceItemMakeTemplateData(itemId);
  if(index<0||!template||!Array.isArray(template.widths)||template.widths[index]!==0)return null;
  const value=Number(template.base[index]);
  return Number.isFinite(value)?Math.trunc(value):null;
}

async function sourceEnsureItemField2Db(){
  if(itemField2Db)return itemField2Db;
  if(itemField2LoadPromise)return itemField2LoadPromise;
  itemField2LoadPromise=(async()=>{
    const r=await fetch(ITEM_FIELD2_RUNTIME_URL,{cache:'no-store'});
    if(!r.ok)throw new Error('Item field2 runtime HTTP '+r.status);
    const data=await r.json();
    if(data?.format!=='stoneage-item-field2-runtime-v1')throw new Error('Item field2 runtime format mismatch');
    if(data?.source?.ref!=='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56')throw new Error('Item field2 runtime source-ref mismatch');
    if(Math.trunc(Number(data?.stats?.parsedLines))!==10737)throw new Error('Item field2 runtime template-count mismatch');
    itemField2Db=data;
    return data;
  })();
  try{return await itemField2LoadPromise}
  catch(err){itemField2LoadPromise=null;throw err}
}
async function sourceEnsurePetMergeFixDb(){
  if(petMergeFixDb)return petMergeFixDb;
  if(petMergeFixLoadPromise)return petMergeFixLoadPromise;
  petMergeFixLoadPromise=(async()=>{
    const r=await fetch(PET_MERGE_FIX_RUNTIME_URL,{cache:'no-store'});
    if(!r.ok)throw new Error('Pet merge-fix runtime HTTP '+r.status);
    const data=await r.json();
    if(data?.format!=='stoneage-pet-merge-fix-runtime-v1')throw new Error('Pet merge-fix runtime format mismatch');
    if(data?.source?.ref!=='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56')throw new Error('Pet merge-fix runtime source-ref mismatch');
    if(Math.trunc(Number(data?.stats?.uniqueTempNo))!==1813)throw new Error('Pet merge-fix runtime TempNo-count mismatch');
    if(Math.trunc(Number(data?.stats?.itemAtomCount))!==112)throw new Error('Pet merge-fix runtime atom-count mismatch');
    if(Math.trunc(Number(data?.stats?.configuredSlots))!==4602)throw new Error('Pet merge-fix runtime slot-count mismatch');
    if(Object.keys(data?.atomIndexByByteName||{}).length!==112)throw new Error('Pet merge-fix runtime byte-atom-count mismatch');
    if(!Array.isArray(data?.mergeMath?.itemRandTableForItem)||data.mergeMath.itemRandTableForItem.length!==20)throw new Error('Pet merge-fix runtime math-table mismatch');
    if(!Array.isArray(data?.mergeMath?.oddsTable)||data.mergeMath.oddsTable.length!==14)throw new Error('Pet merge-fix runtime odds-table mismatch');
    petMergeFixDb=data;
    return data;
  })();
  try{return await petMergeFixLoadPromise}
  catch(err){petMergeFixLoadPromise=null;throw err}
}
function sourcePetMergeFixTemplate(pet=activePet()){
  const petId=Math.trunc(Number(pet?.petId));
  if(!Number.isFinite(petId)||!petMergeFixDb?.byTempNo)return null;
  return petMergeFixDb.byTempNo[String(petId)]||null;
}
function sourcePetMergeFixEntries(pet=activePet()){
  const row=sourcePetMergeFixTemplate(pet);
  if(!row||!Array.isArray(row.slots))return [];
  const out=[];
  outerPass:
  for(let pass=0;pass<5;pass++){
    for(const raw of row.slots){
      if(!raw||!raw.name)continue;
      if(raw?.atomIndex==null)continue outerPass;
      const atomIndex=Math.trunc(Number(raw.atomIndex));
      if(!Number.isFinite(atomIndex))continue outerPass;
      out.push({
        pass,slot:Math.trunc(Number(raw.slot)),
        name:String(raw.name),atomIndex,
        baseAdd:Math.trunc(Number(raw.baseAdd)||0),
        fixMin:Math.trunc(Number(raw.fixMin)||0),
        fixMax:Math.trunc(Number(raw.fixMax)||0)
      });
    }
  }
  return out;
}

function sourceMergeAtomIndexByByteName(name){
  const value=petMergeFixDb?.atomIndexByByteName?.[String(name??'')];
  const index=Number(value);
  return Number.isFinite(index)?Math.trunc(index):null;
}
function sourceMergeTableNum(value){
  const rows=petMergeFixDb?.mergeMath?.itemRandTableForItem;
  if(!Array.isArray(rows)||!rows.length)return null;
  const num=Math.trunc(Number(value));
  if(!Number.isFinite(num))return null;
  for(let i=0;i<rows.length;i++){
    if(num<=Math.trunc(Number(rows[i]?.maxnum)))return i;
  }
  return rows.length-1;
}
function sourceMergeCRint(value){
  const v=Number(value);
  if(!Number.isFinite(v))return null;
  const sign=v<0?-1:1,a=Math.abs(v),floor=Math.floor(a),fraction=a-floor;
  if(fraction<0.5)return sign*floor;
  if(fraction>0.5)return sign*(floor+1);
  return sign*((floor%2===0)?floor:floor+1);
}
function sourceMergeRandRangePlan(base,minRate,maxRate){
  const dom=Math.trunc(Number(petMergeFixDb?.mergeMath?.randDom)||1000);
  let b=Math.trunc(Number(base)),lo=Math.trunc(Number(minRate)),hi=Math.trunc(Number(maxRate));
  if(!Number.isFinite(b)||!Number.isFinite(lo)||!Number.isFinite(hi)||dom<=0)return {ok:false,reason:'rand-range-source'};
  if(lo>hi){const t=lo;lo=hi;hi=t}
  const minnum=sourceMergeCRint((b/dom)*lo),maxnum=sourceMergeCRint((b/dom)*hi);
  if(minnum==null||maxnum==null)return {ok:false,reason:'rand-range-source'};
  const range=maxnum-minnum;
  if(lo===0&&hi===0)return {ok:true,base:b,minRate:lo,maxRate:hi,minnum,maxnum,range,mode:'zero',result:0,rngCalls:0};
  if(range===0)return {ok:true,base:b,minRate:lo,maxRate:hi,minnum,maxnum,range,mode:'base',result:b,rngCalls:0};
  if(range<0)return {ok:true,base:b,minRate:lo,maxRate:hi,minnum,maxnum,range,mode:'negative-range-zero',result:0,rngCalls:0};
  return {ok:true,base:b,minRate:lo,maxRate:hi,minnum,maxnum,range,mode:'rng',resultMin:minnum,resultMax:maxnum,rngMin:0,rngMax:range,rngCalls:1};
}
function sourceMergeSimplifyValues(values,{petPresent=true,petFamily=false}={}){
  const rows=petMergeFixDb?.mergeMath?.itemRandTableForItem;
  const odds=petMergeFixDb?.mergeMath?.oddsTable;
  if(!Array.isArray(rows)||rows.length!==20||!Array.isArray(odds)||odds.length!==14)return {ok:false,reason:'simplify-source'};
  if(!Array.isArray(values)||!values.length)return {ok:false,reason:'simplify-empty'};
  if(values.length>odds.length+1)return {ok:false,reason:'simplify-odds-oob',count:values.length};
  const data=values.map(Number);
  if(data.some(v=>!Number.isFinite(v)))return {ok:false,reason:'simplify-value-source'};
  data.sort((a,b)=>a-b);
  const steps=[];
  for(let j=1;j<data.length;j++){
    const tableNum=sourceMergeTableNum(data[j-1]);
    if(tableNum==null)return {ok:false,reason:'simplify-table-source'};
    const rowRate=Number(rows[tableNum]?.rate),baseRate=Number(rows[0]?.rate);
    if(!Number.isFinite(rowRate)||!Number.isFinite(baseRate)||baseRate===0)return {ok:false,reason:'simplify-rate-source'};
    const rate=rowRate/baseRate,before=data[j];
    data[j]+=data[j-1]*Number(odds[j-1])*rate;
    steps.push({j,tableNum,rate,before,after:data[j]});
  }
  let value=Math.trunc(data[data.length-1]);
  if(petPresent){
    const cap=petFamily
      ?Math.trunc(Number(petMergeFixDb?.fixedBuild?.fmRandRangeDom)||4000)
      :1000;
    if(value>cap)value=cap;
  }
  return {ok:true,value,sorted:data,steps,petPresent:!!petPresent,petFamily:!!petFamily};
}
function sourceMergeCollectStaticAtoms(selected){
  if(!Array.isArray(selected))return {ok:false,reason:'merge-selection-source'};
  const ordered=[...selected].sort((a,b)=>Math.trunc(Number(a?.slotIndex))-Math.trunc(Number(b?.slotIndex)));
  const items=[],buckets=[],byAtom=new Map(),skipped=[];
  let itemType=-1;
  itemLoop:
  for(const entry of ordered){
    const canMerge=sourceItemRuntimeResolvedDataInt(entry?.existing,'ITEM_CANMERGEFROM');
    if(canMerge==null)return {ok:false,reason:'merge-canmerge-source'};
    if(canMerge!==1){skipped.push({slotIndex:entry?.slotIndex,reason:'cannot-merge-from'});continue}
    const type=sourceItemRuntimeResolvedDataInt(entry?.existing,'ITEM_TYPE');
    if(type==null)return {ok:false,reason:'merge-type-source'};
    if(itemType===-1)itemType=type;
    else if(itemType===20&&type!==20)return {ok:false,reason:'mixed-dish'};
    else if(itemType!==20&&type===20)return {ok:false,reason:'mixed-dish'};
    items.push(entry);
    for(let i=0;i<5;i++){
      const name=sourceItemField2Char(entry.existing,'ingName'+i);
      if(!name)continue;
      const atomIndex=sourceMergeAtomIndexByByteName(name);
      if(atomIndex==null){
        skipped.push({slotIndex:entry.slotIndex,ingredient:i,reason:'unknown-atom'});
        continue itemLoop;
      }
      const value=sourceItemRuntimeResolvedDataInt(entry.existing,'ITEM_INGVALUE'+i);
      if(value==null)return {ok:false,reason:'merge-ingvalue-source',slotIndex:entry.slotIndex,ingredient:i};
      let bucket=byAtom.get(atomIndex);
      if(!bucket){
        bucket={atomIndex,name,values:[]};
        byAtom.set(atomIndex,bucket);buckets.push(bucket);
      }
      bucket.values.push(value);
    }
  }
  if(items.length<=1)return {ok:false,reason:'less-than-two-mergeable',items:items.length,skipped};
  return {ok:true,items,skipped,itemType,searchtable:itemType===20?1:0,buckets};
}
function sourceMergeRatePlan(atomIndex,simplified,searchtable,petFixEntries){
  const rows=petMergeFixDb?.mergeMath?.itemRandTableForItem;
  const rangeWidth=petMergeFixDb?.mergeMath?.mergeRangeWidth;
  const dishTable=petMergeFixDb?.mergeMath?.itemRandTable;
  if(!Array.isArray(rows)||!rangeWidth||!Array.isArray(dishTable))return {ok:false,reason:'merge-rate-source'};
  const tableNum=searchtable===0?sourceMergeTableNum(simplified):0;
  if(tableNum==null)return {ok:false,reason:'merge-table-source'};
  const rate=Number(rows[tableNum]?.rate);
  if(!Number.isFinite(rate)||rate===0)return {ok:false,reason:'merge-rate-source'};
  const fixed=(Array.isArray(petFixEntries)?petFixEntries:[]).find(x=>Math.trunc(Number(x?.atomIndex))===Math.trunc(Number(atomIndex)))||null;
  let base=Math.trunc(Number(simplified)),minRate,maxRate;
  if(fixed){
    let fixMin=Math.trunc(Number(fixed.fixMin)),fixMax=Math.trunc(Number(fixed.fixMax));
    if(fixMin<0)fixMin=1000;
    if(fixMax<0)fixMax=1000;
    base+=Math.trunc(Number(fixed.baseAdd)||0);
    if(searchtable===0){
      minRate=Math.trunc((1/rate)*Number(rangeWidth.min)*fixMin);
      maxRate=Math.trunc(rate*Number(rangeWidth.max)*fixMax);
    }else{
      minRate=Math.trunc(Number(dishTable[1]?.[0])*fixMin/1000);
      maxRate=Math.trunc(Number(dishTable[1]?.[1])*fixMin/1000);
    }
  }else if(searchtable===0){
    minRate=Math.trunc((1/rate)*Number(rangeWidth.min)*1000);
    maxRate=Math.trunc(rate*Number(rangeWidth.max)*1000);
  }else{
    minRate=Math.trunc(Number(dishTable[1]?.[0]));
    maxRate=Math.trunc(Number(dishTable[1]?.[1]));
  }
  const randPlan=sourceMergeRandRangePlan(base,minRate,maxRate);
  if(!randPlan.ok)return randPlan;
  return {ok:true,atomIndex,tableNum,rate,fixed,base,minRate,maxRate,randPlan};
}
function sourceItemMakeTemplateInt(itemId,fieldName){
  const index=sourceItemMakeDataIndex(fieldName);
  const template=sourceItemMakeTemplateData(itemId);
  if(index<0||!template||!Array.isArray(template.widths)||template.widths[index]!==0)return null;
  const value=Number(template.base[index]);
  return Number.isFinite(value)?Math.trunc(value):null;
}
function sourceMergeCandidateCache(){
  if(sourceMergeCandidateCacheMemo)return sourceMergeCandidateCacheMemo;
  if(!itemMakeDb?.byItemId||!itemField2Db?.byItemId||!petMergeFixDb?.atomIndexByByteName){
    return {ok:false,reason:'candidate-runtime-source'};
  }
  const ids=Object.keys(itemMakeDb.byItemId).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
  const candidates=[];
  const byIngUse={1:0,2:0,3:0,4:0,5:0};
  let canMergeTo=0,canMergeToNoResolvedIngredients=0,withResolvedIngredients=0;
  let resolvedIngredientEntries=0,unknownIngredientOccurrences=0,maxIngUse=0;
  for(const id of ids){
    const canTo=sourceItemMakeTemplateInt(id,'ITEM_CANMERGETO');
    if(canTo==null)return {ok:false,reason:'candidate-canmergeto-source',itemId:id};
    if(canTo===1)canMergeTo++;
    const row=sourceItemField2Template(id)||{};
    const ingredients=[];
    for(let i=0;i<5;i++){
      const name=typeof row['ingName'+i]==='string'?row['ingName'+i]:'';
      if(!name)continue;
      const atomIndex=sourceMergeAtomIndexByByteName(name);
      if(atomIndex==null){unknownIngredientOccurrences++;continue}
      const value=sourceItemMakeTemplateInt(id,'ITEM_INGVALUE'+i);
      if(value==null)return {ok:false,reason:'candidate-ingvalue-source',itemId:id,ingredient:i};
      ingredients.push({slot:i,atomIndex,name,value});
      resolvedIngredientEntries++;
    }
    if(ingredients.length){
      withResolvedIngredients++;
      maxIngUse=Math.max(maxIngUse,ingredients.length);
    }
    if(canTo!==1)continue;
    if(!ingredients.length){canMergeToNoResolvedIngredients++;continue}
    const inguse=ingredients.length;
    if(!Object.prototype.hasOwnProperty.call(byIngUse,inguse))return {ok:false,reason:'candidate-inguse-source',itemId:id,inguse};
    byIngUse[inguse]++;
    candidates.push({id,inguse,ingredients});
  }
  sourceMergeCandidateCacheMemo={
    ok:true,candidates,
    stats:{
      templates:ids.length,withResolvedIngredients,canMergeTo,
      candidates:candidates.length,canMergeToNoResolvedIngredients,
      resolvedIngredientEntries,unknownIngredientOccurrences,maxIngUse,byIngUse
    }
  };
  return sourceMergeCandidateCacheMemo;
}
function sourceMergeCandidateHitPlan(ingEntries,searchtable,inputItemIds=[]){
  const cache=sourceMergeCandidateCache();
  if(!cache.ok)return cache;
  const rows=petMergeFixDb?.mergeMath?.itemRandTableForItem;
  const searchRows=petMergeFixDb?.mergeMath?.itemSearchTable;
  const maxMatch=Math.trunc(Number(petMergeFixDb?.mergeMath?.maxMatch)||2048);
  const mode=Math.trunc(Number(searchtable));
  if(!Array.isArray(rows)||rows.length!==20||!Array.isArray(searchRows)||!Array.isArray(searchRows[mode])){
    return {ok:false,reason:'candidate-range-source'};
  }
  if(mode!==0&&mode!==1)return {ok:false,reason:'candidate-searchtable-source'};
  const work=(Array.isArray(ingEntries)?ingEntries:[]).map(raw=>({
    atomIndex:Math.trunc(Number(raw?.atomIndex)),
    value:Math.trunc(Number(raw?.value))
  }));
  if(!work.length||work.some(x=>!Number.isFinite(x.atomIndex)||!Number.isFinite(x.value))){
    return {ok:false,reason:'candidate-ingtable-source'};
  }
  const inputSet=new Set((Array.isArray(inputItemIds)?inputItemIds:[]).map(x=>Math.trunc(Number(x))));
  const byExtract={1:[],2:[],3:[],4:[],5:[]};
  let fullyMatchedBeforeInputExclusion=0,excludedInputCandidates=0;
  const searchMin=Number(searchRows[mode][0]),searchMax=Number(searchRows[mode][1]);
  if(!Number.isFinite(searchMin)||!Number.isFinite(searchMax))return {ok:false,reason:'candidate-search-range-source'};
  const foodCap=mode===1?Math.trunc(Number(rows[9]?.maxnum)/searchMax):null;

  for(const candidate of cache.candidates){
    let hitnum=0;
    for(const ingredient of candidate.ingredients){
      for(let k=0;k<work.length;k++){
        if(ingredient.atomIndex!==work[k].atomIndex)continue;
        if(mode===0){
          const tableNum=sourceMergeTableNum(work[k].value);
          if(tableNum==null)return {ok:false,reason:'candidate-table-source'};
          const rate=Number(rows[tableNum]?.rate);
          if(!Number.isFinite(rate)||rate===0)return {ok:false,reason:'candidate-rate-source'};
          let top=work[k].value*rate;
          if(top>1000)top=1000;
          if(ingredient.value<=top&&ingredient.value>=work[k].value*(1/rate)){
            hitnum++;break;
          }
        }else{
          // fixed ordinary-pet cooking path mutates ingtable[k] in place before the range check.
          if(work[k].value>foodCap)work[k].value=foodCap;
          if(ingredient.value<=work[k].value*searchMax&&ingredient.value>=work[k].value*searchMin){
            hitnum++;break;
          }
        }
      }
    }
    if(hitnum!==candidate.inguse)continue;
    fullyMatchedBeforeInputExclusion++;
    if(inputSet.has(candidate.id)){excludedInputCandidates++;continue}
    const bucket=byExtract[candidate.inguse];
    bucket.push(candidate.id);
    if(bucket.length>maxMatch){
      return {ok:false,reason:'maxmatch-overflow-no-guess',extractnum:candidate.inguse,count:bucket.length,maxMatch};
    }
  }
  return {
    ok:true,byExtract,mutatedIngEntries:work,
    fullyMatchedBeforeInputExclusion,excludedInputCandidates,maxMatch,
    sourceFirstPassHitnumCached:true
  };
}
function sourceMergeRetryExtractNum(ingnum,roll){
  const thresholds=petMergeFixDb?.mergeMath?.retryThresholds;
  const ideal=Math.min(5,Math.max(0,Math.trunc(Number(ingnum))));
  const r=Math.trunc(Number(roll));
  if(ideal<1||!Array.isArray(thresholds)||!Array.isArray(thresholds[ideal-1])||!Number.isFinite(r)||r<0||r>999)return null;
  const row=thresholds[ideal-1];
  let extractIndex=0;
  for(;extractIndex<ideal;extractIndex++){
    if(r>=Math.trunc(Number(row[extractIndex])))break;
  }
  return ideal-extractIndex;
}
function sourceMergeRetrySpec(ingnum){
  const ideal=Math.min(5,Math.max(0,Math.trunc(Number(ingnum))));
  if(ideal<1)return {ok:false,reason:'retry-ideal-source'};
  const rollCounts={};
  for(let r=0;r<1000;r++){
    const required=sourceMergeRetryExtractNum(ideal,r);
    if(required==null)return {ok:false,reason:'retry-threshold-source'};
    rollCounts[required]=(rollCounts[required]||0)+1;
  }
  return {
    ok:true,ideal,rollCounts,
    distinctExtractClasses:ideal,
    duplicateClassRollsConsumeRng:true,
    firstPassComputesHitnum:true,
    laterPassesReuseHitnum:true,
    finalSelection:'random()%match',
    maxMatch:Math.trunc(Number(petMergeFixDb?.mergeMath?.maxMatch)||2048),
    outerMergeAttempts:Math.trunc(Number(petMergeFixDb?.mergeMath?.outerMergeAttempts)||5),
    sourceNoRngConsumed:true
  };
}

function sourceMergeCloneDataInt(clone,fieldName){
  const index=sourceItemMakeDataIndex(fieldName);
  const value=Number(clone?.data?.[index]);
  return index>=0&&Number.isFinite(value)?Math.trunc(value):null;
}
function sourceMergeMakeInputClones(selected,{randInclusive=cRand}={}){
  if(!Array.isArray(selected))return {ok:false,reason:'merge-selection-source'};
  const ordered=[...selected].sort((a,b)=>Math.trunc(Number(a?.slotIndex))-Math.trunc(Number(b?.slotIndex)));
  const clones=[],seenExisting=new Set();
  let rngCalls=0,skippedNotMergeable=0;
  for(const entry of ordered){
    const existing=entry?.existing;
    if(!existing||existing.owner!=='player')continue;
    const itemIndex=Math.trunc(Number(entry?.itemIndex));
    if(seenExisting.has(itemIndex))return {ok:false,reason:'merge-collision'};
    seenExisting.add(itemIndex);
    const itemId=Math.trunc(Number(existing.itemId));
    const canMerge=sourceItemMakeTemplateInt(itemId,'ITEM_CANMERGEFROM');
    if(canMerge==null)return {ok:false,reason:'merge-canmerge-source',itemId};
    if(canMerge!==1){skippedNotMergeable++;continue}
    const template=sourceItemMakeTemplateData(itemId);
    const calls=Math.max(0,Math.trunc(Number(itemMakeDb?.makeItem?.rngCallsBeforeLeakLevel)||66));
    if(!template||!Array.isArray(template.base)||!Array.isArray(template.widths)||template.base.length!==calls||template.widths.length!==calls){
      return {ok:false,reason:'merge-input-template-source',itemId};
    }
    const data=template.base.slice();
    for(let i=0;i<calls;i++){
      const width=Math.max(0,Math.trunc(Number(template.widths[i])||0));
      const roll=Math.trunc(Number(randInclusive(0,width)));
      data[i]+=Number.isFinite(roll)?roll:0;
      rngCalls++;
    }
    const leakIndex=Math.trunc(Number(itemMakeDb?.makeItem?.leakLevelIndex));
    if(Number.isFinite(leakIndex)&&leakIndex>=0&&leakIndex<data.length){
      data[leakIndex]=Math.trunc(Number(itemMakeDb?.makeItem?.leakLevelAfterLoop)||1);
    }
    clones.push({slotIndex:Math.trunc(Number(entry.slotIndex)),itemIndex,itemId,data});
  }
  return {ok:true,clones,rngCalls,skippedNotMergeable,sourceItemMakeCallsPerClone:66};
}
function sourceMergeCollectCloneAtoms(clones){
  if(!Array.isArray(clones))return {ok:false,reason:'merge-clone-source'};
  const buckets=[],byAtom=new Map(),items=[],skipped=[];
  let itemType=-1;
  itemLoop:
  for(const clone of clones){
    const type=sourceMergeCloneDataInt(clone,'ITEM_TYPE');
    if(type==null)return {ok:false,reason:'merge-type-source',itemId:clone?.itemId};
    if(itemType===-1)itemType=type;
    else if(itemType===20&&type!==20)return {ok:false,reason:'mixed-dish',sourceReturn:-10};
    else if(itemType!==20&&type===20)return {ok:false,reason:'mixed-dish',sourceReturn:-10};
    items.push(clone);
    const row=sourceItemField2Template(clone.itemId)||{};
    for(let i=0;i<5;i++){
      const name=typeof row['ingName'+i]==='string'?row['ingName'+i]:'';
      if(!name)continue;
      const atomIndex=sourceMergeAtomIndexByByteName(name);
      if(atomIndex==null){
        skipped.push({itemId:clone.itemId,ingredient:i,reason:'unknown-atom'});
        continue itemLoop;
      }
      const value=sourceMergeCloneDataInt(clone,'ITEM_INGVALUE'+i);
      if(value==null)return {ok:false,reason:'merge-ingvalue-source',itemId:clone.itemId,ingredient:i};
      let bucket=byAtom.get(atomIndex);
      if(!bucket){bucket={atomIndex,name,values:[]};byAtom.set(atomIndex,bucket);buckets.push(bucket)}
      bucket.values.push(value);
    }
  }
  if(!items.length)return {ok:false,reason:'no-mergeable-items'};
  return {ok:true,items,skipped,itemType,searchtable:itemType===20?1:0,buckets};
}
function sourceMergePrepareClones(clones,pet=activePet()){
  const collected=sourceMergeCollectCloneAtoms(clones);
  if(!collected.ok)return collected;
  const petFixEntries=sourcePetMergeFixEntries(pet);
  const atoms=[];
  for(const bucket of collected.buckets){
    const simplified=sourceMergeSimplifyValues(bucket.values,{petPresent:true,petFamily:false});
    if(!simplified.ok)return Object.assign({atomIndex:bucket.atomIndex},simplified);
    const ratePlan=sourceMergeRatePlan(bucket.atomIndex,simplified.value,collected.searchtable,petFixEntries);
    if(!ratePlan.ok)return ratePlan;
    atoms.push({atomIndex:bucket.atomIndex,name:bucket.name,rawValues:[...bucket.values],simplified,ratePlan});
  }
  if(!atoms.length)return {ok:false,reason:'no-merge-atoms',sourceReturn:-1};
  return {
    ok:true,searchtable:collected.searchtable,itemType:collected.itemType,
    inputItemIds:collected.items.map(x=>x.itemId),atoms,skipped:collected.skipped
  };
}
function sourceMergeExecuteRandRangePlan(plan,{randInclusive=cRand}={}){
  if(!plan?.ok)return {ok:false,reason:'rand-range-plan'};
  if(plan.mode==='rng'){
    const roll=Math.trunc(Number(randInclusive(plan.rngMin,plan.rngMax)));
    const result=Math.trunc(Number(plan.minnum))+roll;
    return {ok:true,result,roll,rngCalls:1,mode:'rng'};
  }
  if(Object.prototype.hasOwnProperty.call(plan,'result')){
    return {ok:true,result:Math.trunc(Number(plan.result)),roll:null,rngCalls:0,mode:String(plan.mode||'fixed')};
  }
  return {ok:false,reason:'rand-range-plan-mode'};
}
function sourceMergeExecuteRetryOnce(hitPlan,ingnum,{randInclusive=cRand,randModulo=sourceRandModulo}={}){
  if(!hitPlan?.ok)return {ok:false,reason:'retry-hitplan'};
  const ideal=Math.min(5,Math.max(0,Math.trunc(Number(ingnum))));
  const thresholds=petMergeFixDb?.mergeMath?.retryThresholds;
  if(ideal<1||!Array.isArray(thresholds)||!Array.isArray(thresholds[ideal-1]))return {ok:false,reason:'retry-threshold-source'};
  const row=thresholds[ideal-1],endflg=Array(ideal).fill(false),trace=[];
  let extractcnt=0,rngCalls=0,moduloCalls=0,first=true;
  while(true){
    const roll=Math.trunc(Number(randInclusive(0,999)));rngCalls++;
    if(extractcnt>=ideal){
      trace.push({roll,terminalExtraRoll:true});
      return {ok:true,createdItemId:-1,rngCalls,moduloCalls,trace,exhausted:true};
    }
    let extractIndex=0;
    for(;extractIndex<ideal;extractIndex++){
      if(roll>=Math.trunc(Number(row[extractIndex])))break;
    }
    if(endflg[extractIndex]){
      trace.push({roll,extractIndex,duplicateClass:true});
      continue;
    }
    endflg[extractIndex]=true;extractcnt++;
    const extractnum=ideal-extractIndex;
    const matches=Array.isArray(hitPlan.byExtract?.[extractnum])?hitPlan.byExtract[extractnum]:[];
    trace.push({roll,extractIndex,extractnum,firstPassHitnum:first,matches:matches.length});
    first=false;
    if(matches.length>0){
      let pick=Math.trunc(Number(randModulo(matches.length)));moduloCalls++;
      pick=((pick%matches.length)+matches.length)%matches.length;
      return {ok:true,createdItemId:matches[pick],pickIndex:pick,rngCalls,moduloCalls,trace,exhausted:false};
    }
  }
}
function sourceMergeExecuteRetryOuter(hitPlan,ingnum,inputItemIds,{randInclusive=cRand,randModulo=sourceRandModulo}={}){
  const attempts=Math.max(0,Math.trunc(Number(petMergeFixDb?.mergeMath?.outerMergeAttempts)||5));
  const trace=[];let rngCalls=0,moduloCalls=0;
  for(let attempt=0;attempt<attempts;attempt++){
    const one=sourceMergeExecuteRetryOnce(hitPlan,ingnum,{randInclusive,randModulo});
    if(!one.ok)return one;
    rngCalls+=one.rngCalls;moduloCalls+=one.moduloCalls;
    trace.push({attempt,...one});
    if(one.createdItemId>=0){
      return {ok:true,createdItemId:one.createdItemId,rngCalls,moduloCalls,attemptsUsed:attempt+1,trace,fallback:false};
    }
  }
  if(!Array.isArray(inputItemIds)||!inputItemIds.length)return {ok:false,reason:'retry-fallback-inputs'};
  let pick=Math.trunc(Number(randInclusive(0,inputItemIds.length-1)));rngCalls++;
  pick=((pick%inputItemIds.length)+inputItemIds.length)%inputItemIds.length;
  return {
    ok:true,createdItemId:Math.trunc(Number(inputItemIds[pick])),rngCalls,moduloCalls,
    attemptsUsed:attempts,trace,fallback:true,fallbackPickIndex:pick
  };
}
function sourceMergeExecuteCoreRng(selected,pet=activePet(),{
  randInclusive=cRand,randModulo=sourceRandModulo,cooldownHit=false,precloned=null
}={}){
  const cloned=precloned?.ok===true?precloned:sourceMergeMakeInputClones(selected,{randInclusive});
  if(!cloned.ok)return cloned;
  const inputIds=cloned.clones.map(x=>x.itemId);
  if(cloned.clones.length<=1){
    return {ok:false,reason:'less-than-two-mergeable',inputMakeRngCalls:cloned.rngCalls,sourceRngConsumed:true};
  }
  if(cooldownHit){
    let pick=Math.trunc(Number(randInclusive(0,inputIds.length-1)));
    pick=((pick%inputIds.length)+inputIds.length)%inputIds.length;
    return {
      ok:true,createdItemId:inputIds[pick],cooldownHit:true,inputMakeRngCalls:cloned.rngCalls,
      atomRngCalls:0,retryRngCalls:0,moduloCalls:0,cooldownFallbackRngCalls:1,sourceRngConsumed:true
    };
  }
  const prepared=sourceMergePrepareClones(cloned.clones,pet);
  if(!prepared.ok)return Object.assign({inputMakeRngCalls:cloned.rngCalls,sourceRngConsumed:true},prepared);
  const ingEntries=[];let atomRngCalls=0;
  for(const atom of prepared.atoms){
    const executed=sourceMergeExecuteRandRangePlan(atom.ratePlan.randPlan,{randInclusive});
    if(!executed.ok)return executed;
    atomRngCalls+=executed.rngCalls;
    ingEntries.push({atomIndex:atom.atomIndex,value:executed.result});
  }
  const hitPlan=sourceMergeCandidateHitPlan(ingEntries,prepared.searchtable,prepared.inputItemIds);
  if(!hitPlan.ok)return hitPlan;
  const retry=sourceMergeExecuteRetryOuter(hitPlan,prepared.atoms.length,prepared.inputItemIds,{randInclusive,randModulo});
  if(!retry.ok)return retry;
  return {
    ok:true,createdItemId:retry.createdItemId,searchtable:prepared.searchtable,
    inputMakeRngCalls:cloned.rngCalls,atomRngCalls,retryRngCalls:retry.rngCalls,
    moduloCalls:retry.moduloCalls,totalSharedRngCalls:cloned.rngCalls+atomRngCalls+retry.rngCalls+retry.moduloCalls,
    retry,hitPlan,executedIngEntries:hitPlan.mutatedIngEntries,
    sourceRngConsumed:true,sourceLifecycleMutationPending:true
  };
}


function sourceMergeCooldownState(inputCount,nowSec,lastMergeTimeSec=sourceLastMergeTimeSec){
  const num=Math.max(0,Math.trunc(Number(inputCount)));
  const now=Math.trunc(Number(nowSec));
  const previous=Math.trunc(Number(lastMergeTimeSec)||0);
  if(num<=1||!Number.isFinite(now))return {ok:false,reason:'merge-cooldown-source'};
  const threshold=5+(num-2);
  const elapsed=now-previous;
  return {ok:true,hit:elapsed<threshold,threshold,elapsed,nowSec:now,previousSec:previous};
}
function sourceMergeLifecyclePreflight(selected){
  // fixed ITEM_mergeItem_merge checks CHAR_findEmptyItemBox before it parses or makes any input item.
  if(sourcePlayerFindEmptyBackpackSlot(state)<0){
    return {ok:false,reason:'merge-backpack-full',sourceNoRngConsumed:true};
  }
  if(!Array.isArray(selected))return {ok:false,reason:'merge-selection-source',sourceNoRngConsumed:true};
  const ordered=[...selected].sort((a,b)=>Math.trunc(Number(a?.slotIndex))-Math.trunc(Number(b?.slotIndex)));
  const valid=[],seen=new Set();
  for(const entry of ordered){
    const existing=entry?.existing;
    if(!existing||existing.owner!=='player')continue;
    const itemIndex=Math.trunc(Number(entry?.itemIndex));
    if(seen.has(itemIndex))return {ok:false,reason:'merge-collision',sourceNoRngConsumed:true};
    seen.add(itemIndex);
    const itemId=Math.trunc(Number(existing.itemId));
    const canMerge=sourceItemMakeTemplateInt(itemId,'ITEM_CANMERGEFROM');
    if(canMerge==null)return {ok:false,reason:'merge-canmerge-source',itemId,sourceNoRngConsumed:true};
    if(canMerge!==1)continue;
    if(!sourceItemMakeTemplateData(itemId)){
      return {ok:false,reason:'merge-input-template-source',itemId,sourceNoRngConsumed:true};
    }
    const pile=sourceItemRuntimeResolvedDataInt(existing,'ITEM_USEPILENUMS');
    if(pile==null||pile<1){
      return {ok:false,reason:'merge-pile-source',itemId,itemIndex,sourceNoRngConsumed:true};
    }
    valid.push({slotIndex:Math.trunc(Number(entry.slotIndex)),itemIndex,itemId,pile});
  }
  return {ok:true,valid,sourceNoRngConsumed:true};
}
function sourceMergeExecuteLifecycle(selected,pet=activePet(),{
  randInclusive=cRand,randModulo=sourceRandModulo,nowSec=Math.trunc(Date.now()/1000)
}={}){
  const preflight=sourceMergeLifecyclePreflight(selected);
  if(!preflight.ok)return preflight;

  // ITEM_mergeItem_merge calls ITEM_makeItem for every valid CANMERGEFROM input before cnt>1.
  const cloned=sourceMergeMakeInputClones(selected,{randInclusive});
  if(!cloned.ok)return cloned;
  if(cloned.clones.length<=1){
    return {
      ok:false,reason:'less-than-two-mergeable',inputCount:cloned.clones.length,
      inputMakeRngCalls:cloned.rngCalls,sourceRngConsumed:cloned.rngCalls>0,
      materialsConsumed:false
    };
  }

  // fixed ITEM_mergeItem: time(NULL), test < 5+(num-2), then ALWAYS overwrite LASTMERGETIME.
  const cooldown=sourceMergeCooldownState(cloned.clones.length,nowSec,sourceLastMergeTimeSec);
  if(!cooldown.ok)return cooldown;
  sourceLastMergeTimeSec=cooldown.nowSec;

  const core=sourceMergeExecuteCoreRng(selected,pet,{
    randInclusive,randModulo,cooldownHit:cooldown.hit,precloned:cloned
  });
  let sourceReturn=null;
  if(core?.ok)sourceReturn=Math.trunc(Number(core.createdItemId));
  else if(Number.isFinite(Number(core?.sourceReturn)))sourceReturn=Math.trunc(Number(core.sourceReturn));
  else{
    return Object.assign({
      ok:false,reason:core?.reason||'merge-core-source',
      cooldown,sourceRngConsumed:!!core?.sourceRngConsumed,
      materialsConsumed:false,sourceLifecycleStoppedNoGuess:true
    },core||{});
  }

  // fixed CHAR_MERGEITEMCOUNT increments for every cnt>1 attempt, including negative source return.
  state.mergeItemCount=Math.max(0,Math.trunc(n(state.mergeItemCount)))+1;

  // fixed _ITEM_PILENUMS path: decrement one unit; free existing only when resulting pile <=0.
  const consumed=[];
  for(const clone of cloned.clones){
    const beforeSlot=sourceItemRuntimeSlot(clone.itemIndex);
    const pileBefore=sourceItemRuntimeResolvedDataInt(beforeSlot,'ITEM_USEPILENUMS');
    const consumedOk=sourceConsumeTrackedExistingItem(clone.itemIndex);
    const afterSlot=sourceItemRuntimeSlot(clone.itemIndex);
    const pileAfter=afterSlot?sourceItemRuntimeResolvedDataInt(afterSlot,'ITEM_USEPILENUMS'):0;
    consumed.push({
      itemIndex:clone.itemIndex,itemId:clone.itemId,pileBefore,
      pileAfter,freed:!afterSlot,ok:consumedOk
    });
    if(!consumedOk){
      sourceField2SelectedSlots.clear();
      return {
        ok:false,reason:'merge-consume-failed',sourceReturn,cooldown,core,consumed,
        sourceRngConsumed:true,materialsConsumed:consumed.some(x=>x.ok),mutated:true
      };
    }
  }
  sourceField2SelectedSlots.clear();

  if(sourceReturn<0){
    return {
      ok:false,reason:core?.reason||'merge-source-failed',sourceReturn,cooldown,core,consumed,
      sourceRngConsumed:true,materialsConsumed:true,mutated:true
    };
  }

  // fixed ITEM_makeItemAndRegist(ret): consumes the output ITEM_makeItem RNG before existing allocation.
  const outputItemIndex=sourceItemRuntimeAlloc(sourceReturn,null,{source:'merge'});
  if(outputItemIndex<0){
    return {
      ok:false,reason:'merge-output-alloc-failed',sourceReturn,cooldown,core,consumed,
      sourceRngConsumed:true,materialsConsumed:true,outputMakeAttempted:true,mutated:true
    };
  }
  const outputExisting=sourceItemRuntimeSlot(outputItemIndex);
  const outputMakeRngCalls=Math.trunc(Number(outputExisting?.sourceMakeRngCalls)||0);

  // fixed ITEM_setInt(createitemindex, ITEM_MERGEFLG, TRUE) occurs before CHAR_addItemSpecificItemIndex.
  if(!sourceItemRuntimeSetDataInt(outputExisting,'ITEM_MERGEFLG',1)){
    sourceItemRuntimeFree(outputItemIndex);
    return {
      ok:false,reason:'merge-mergeflag-source',sourceReturn,cooldown,core,consumed,
      sourceRngConsumed:true,materialsConsumed:true,outputMakeAttempted:true,
      outputMakeRngCalls,outputFreed:true,mutated:true
    };
  }

  const addRc=sourcePlayerAddSpecificExistingItem(outputItemIndex,{source:'merge',incrementInventory:true});
  if(addRc<PLAYER_BACKPACK_START||addRc>=PLAYER_ITEM_SLOT_COUNT){
    // fixed failure branch destroys the newly registered output existing item.
    sourceItemRuntimeFree(outputItemIndex);
    return {
      ok:false,reason:'merge-output-add-failed',sourceReturn,cooldown,core,consumed,
      sourceRngConsumed:true,materialsConsumed:true,outputMakeAttempted:true,
      outputMakeRngCalls,outputFreed:true,addRc,mutated:true
    };
  }

  return {
    ok:true,sourceReturn,createdItemId:sourceReturn,outputItemIndex,backpackSlot:addRc,
    outputMakeRngCalls,mergeFlag:1,cooldown,core,consumed,
    sourceRngConsumed:true,materialsConsumed:true,mutated:true,
    searchtable:core?.searchtable??null
  };
}

function sourceMergePrepareStatic(selected,pet=activePet()){
  const collected=sourceMergeCollectStaticAtoms(selected);
  if(!collected.ok)return collected;
  const petFixEntries=sourcePetMergeFixEntries(pet);
  const atoms=[];
  let plannedAtomRandCalls=0;
  for(const bucket of collected.buckets){
    // Current Web pet lifecycle only creates ordinary pets, not CHAR_PETFAMILY guardian pets.
    const simplified=sourceMergeSimplifyValues(bucket.values,{petPresent:true,petFamily:false});
    if(!simplified.ok)return Object.assign({atomIndex:bucket.atomIndex},simplified);
    const ratePlan=sourceMergeRatePlan(bucket.atomIndex,simplified.value,collected.searchtable,petFixEntries);
    if(!ratePlan.ok)return ratePlan;
    plannedAtomRandCalls+=Math.trunc(Number(ratePlan.randPlan?.rngCalls)||0);
    atoms.push({atomIndex:bucket.atomIndex,name:bucket.name,rawValues:[...bucket.values],simplified,ratePlan});
  }
  const makeItemCalls=Math.max(0,Math.trunc(Number(itemMakeDb?.makeItem?.rngCallsBeforeLeakLevel)||66));
  return {
    ok:true,itemCount:collected.items.length,searchtable:collected.searchtable,itemType:collected.itemType,
    inputItemIds:collected.items.map(x=>Math.trunc(Number(x?.existing?.itemId))).filter(Number.isFinite),
    skipped:collected.skipped,atoms,petFixEntries:petFixEntries.length,
    deferredMakeItemRngCalls:makeItemCalls*collected.items.length,
    plannedAtomRandCalls,
    sourceNoRngConsumed:true
  };
}

function sourceItemField2Template(itemId){
  const id=Math.trunc(Number(itemId));
  if(!Number.isFinite(id)||!itemField2Db?.byItemId)return null;
  return itemField2Db.byItemId[String(id)]||null;
}
function sourceItemField2Char(slot,key){
  if(!slot)return '';
  if(slot.field2Char&&Object.prototype.hasOwnProperty.call(slot.field2Char,key)){
    return String(slot.field2Char[key]??'');
  }
  const row=sourceItemField2Template(slot.itemId);
  const value=row?.[key];
  return typeof value==='string'?value:'';
}
function sourceItemField2SetChar(slot,key,value){
  if(!slot)return false;
  if(!slot.field2Char||typeof slot.field2Char!=='object')slot.field2Char={};
  slot.field2Char[key]=String(value??'');
  return true;
}
function sourceItemField2Function(slot,key){
  if(!slot)return '';
  if(slot.field2Functions&&Object.prototype.hasOwnProperty.call(slot.field2Functions,key)){
    return String(slot.field2Functions[key]??'');
  }
  const row=sourceItemField2Template(slot.itemId);
  const value=row?.functions?.[key];
  return typeof value==='string'?value:'';
}
function sourceItemField2SetFunction(slot,key,value){
  if(!slot)return false;
  if(!slot.field2Functions||typeof slot.field2Functions!=='object')slot.field2Functions={};
  slot.field2Functions[key]=String(value??'');
  return true;
}
function sourceItemRuntimeSetDataInt(slot,fieldName,value){
  const index=sourceItemMakeDataIndex(fieldName);
  const count=Math.trunc(Number(itemMakeDb?.itemDataIntCount));
  if(index<0||count!==66||!Array.isArray(slot?.sourceData)||slot.sourceData.length!==count)return false;
  const resolved=Number(value);
  if(!Number.isFinite(resolved))return false;
  slot.sourceData[index]=Math.trunc(resolved);
  if(fieldName==='ITEM_MAGICUSEMP')slot.magicUseMp=Math.trunc(resolved);
  return true;
}
function sourceMakeItemData(itemId){
  const calls=Math.max(0,Math.trunc(n(itemMakeDb?.makeItem?.rngCallsBeforeLeakLevel)||66));
  const template=sourceItemMakeTemplateData(itemId);
  if(!template||template.base.length!==calls||template.widths.length!==calls){
    // Legacy/malformed metadata fallback: preserve the known one-rand-per-field lifecycle only.
    // Do not fabricate data[] when base/randomwidth cannot be source-backed.
    for(let i=0;i<calls;i++)cRand(0,0);
    return {calls,data:null,materialized:false};
  }
  const data=template.base.slice();
  for(let i=0;i<calls;i++){
    const width=template.widths[i];
    data[i]+=cRand(0,width);
  }
  const leakIndex=Math.trunc(Number(itemMakeDb?.makeItem?.leakLevelIndex));
  if(Number.isFinite(leakIndex)&&leakIndex>=0&&leakIndex<data.length){
    data[leakIndex]=Math.trunc(n(itemMakeDb?.makeItem?.leakLevelAfterLoop)||1);
  }
  return {calls,data,materialized:true};
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
  const itemId=Math.trunc(Number(existing.itemId));
  if(!Number.isFinite(itemId))return null;
  const read=field=>sourceItemRuntimeResolvedDataInt(existing,field);
  const type=read('ITEM_TYPE');
  if(type==null)return null;
  const callbacks=sourceItemMakeCallbacks(itemId);
  if(existing.field2Functions&&typeof existing.field2Functions==='object'){
    if(Object.prototype.hasOwnProperty.call(existing.field2Functions,'init'))callbacks.initFunc=String(existing.field2Functions.init??'');
    if(Object.prototype.hasOwnProperty.call(existing.field2Functions,'attach'))callbacks.attachFunc=String(existing.field2Functions.attach??'');
    if(Object.prototype.hasOwnProperty.call(existing.field2Functions,'detach'))callbacks.detachFunc=String(existing.field2Functions.detach??'');
  }
  const relife=sourceItemRelifeTemplate(itemId);
  return {
    itemId,
    name:relife?.name||('Item '+itemId),
    type,
    level:read('ITEM_LEVEL'),
    needStr:read('ITEM_NEEDSTR'),
    needDex:read('ITEM_NEEDDEX'),
    needTrans:read('ITEM_NEEDTRANS'),
    needProfession:read('ITEM_NEEDPROFESSION'),
    suitCode:read('ITEM_SUITCODE'),
    initFunc:callbacks.initFunc,
    attachFunc:callbacks.attachFunc,
    detachFunc:callbacks.detachFunc
  };
}
function sourceProfessionDualWeaponEntries(target=state){
  const out=[];
  for(let i=0;i<PROFESSION_SKILL_SLOT_COUNT;i++){
    const entry=sourcePlayerProfessionSkillAt(i,target);
    if(!entry)continue;
    const row=sourceProfessionSkillTemplate(entry.skillId);
    if(!row||String(row.func||'')!=='PROFESSION_DUAL_WEAPON')continue;
    const displayLevel=sourcePlayerProfessionSkillDisplayLevel(entry);
    const tier=sourceProfessionAttackSkillTier(displayLevel);
    out.push({slot:i,skillId:entry.skillId,displayLevel,tier,rate:tier*3+20});
  }
  return out;
}
function sourceProfessionDualWeaponLearned(target=state){
  return sourceProfessionDualWeaponEntries(target).length>0;
}
function sourceProfessionDualWeaponScaledItemValue(value,entries){
  const raw=Math.trunc(n(value));
  if(!Array.isArray(entries)||!entries.length)return 0;
  let total=0;
  for(const entry of entries){
    total+=Math.trunc(raw*Math.trunc(n(entry?.rate))/100);
  }
  return total;
}
function sourcePlayerEquipPlace(template,slots=sourcePlayerItemSlots(),target=state){
  const type=Math.trunc(Number(template?.type));
  if(!Number.isFinite(type))return -1;
  if(type===0||type===1||type===2||type===3||type===17||type===18||type===19){
    // fixed ITEM_getEquipPlace(): Dual Weapon only changes non-bow weapon placement.
    // It checks the learned function name, not profession-class validity.
    if(sourceProfessionDualWeaponLearned(target)){
      const armIndex=slots?.[PLAYER_ARM_SLOT];
      if(armIndex!=null){
        const armTemplate=sourcePlayerEquipTemplateForExisting(Number(armIndex),target);
        if(Math.trunc(Number(armTemplate?.type))!==4){
          return slots?.[PLAYER_SHIELD_SLOT]==null?PLAYER_SHIELD_SLOT:PLAYER_ARM_SLOT;
        }
      }
    }
    return PLAYER_ARM_SLOT;
  }
  if(type===6)return PLAYER_HEAD_SLOT;
  if(type===7)return PLAYER_BODY_SLOT;
  if(type>=8&&type<=15)return PLAYER_DECORATION1_SLOT;
  if(type===4){
    return slots?.[PLAYER_SHIELD_SLOT]==null?PLAYER_ARM_SLOT:-1;
  }
  if(type===24)return PLAYER_BELT_SLOT;
  if(type===25){
    const armIndex=slots?.[PLAYER_ARM_SLOT];
    if(armIndex!=null){
      const armTemplate=sourcePlayerEquipTemplateForExisting(Number(armIndex),target);
      if(Math.trunc(Number(armTemplate?.type))===4)return -1;
    }
    return PLAYER_SHIELD_SLOT;
  }
  if(type===26)return PLAYER_SHOES_SLOT;
  if(type===27)return PLAYER_GLOVE_SLOT;
  return -1;
}
function sourcePlayerEquipSlotAllowsTemplate(slotIndex,template,slots=sourcePlayerItemSlots(),target=state){
  const to=Math.trunc(Number(slotIndex));
  const ep=sourcePlayerEquipPlace(template,slots,target);
  if(!Number.isFinite(to)||ep<0)return false;
  // fixed CHAR_moveItemFromItemBoxToEquip special-cases CHAR_DECORATION1:
  // canonical decoration place 3 may occupy slot 3 or slot 4.
  if(ep===PLAYER_DECORATION1_SLOT)return to===PLAYER_DECORATION1_SLOT||to===PLAYER_DECORATION2_SLOT;
  return to===ep;
}
function sourcePlayerDecorationTypeConflict(slotIndex,template,slots=sourcePlayerItemSlots(),target=state){
  const to=Math.trunc(Number(slotIndex));
  const type=Math.trunc(Number(template?.type));
  if(!(type>=8&&type<=15)||(to!==PLAYER_DECORATION1_SLOT&&to!==PLAYER_DECORATION2_SLOT))return false;
  const other=to===PLAYER_DECORATION1_SLOT?PLAYER_DECORATION2_SLOT:PLAYER_DECORATION1_SLOT;
  if(slots?.[other]==null)return false;
  const otherIndex=Number(slots[other]);
  if(!Number.isFinite(otherIndex))return false;
  const otherTemplate=sourcePlayerEquipTemplateForExisting(otherIndex,target);
  return !!otherTemplate&&Math.trunc(Number(otherTemplate.type))===type;
}
function normalizePlayerItemSlots(rawSlots,itemRuntime){
  const out=freshPlayerItemSlots();
  if(!Array.isArray(rawSlots)||!itemRuntime?.slots)return out;
  const seen=new Set();
  const target={itemRuntime,playerItemSlots:out};
  for(let i=0;i<PLAYER_ITEM_SLOT_COUNT;i++){
    const idx=Math.trunc(Number(rawSlots[i]));
    if(!Number.isFinite(idx)||idx<=0||seen.has(idx))continue;
    const existing=itemRuntime.slots[String(idx)];
    if(existing?.use!==true||existing.owner!=='player')continue;
    if(i<PLAYER_EQUIP_SLOT_COUNT){
      const template=sourcePlayerEquipTemplateForExisting(idx,target);
      if(!template||!sourcePlayerEquipSlotAllowsTemplate(i,template,out,target))continue;
      if(sourcePlayerDecorationTypeConflict(i,template,out,target))continue;
    }
    out[i]=idx;seen.add(idx);
  }
  return out;
}
function sourcePlayerEquipmentModifiers(target=state){
  const result={
    attack:0,defense:0,quick:0,hp:0,mp:0,luck:0,charm:0,avoid:0,
    statusResist:{poison:0,paralysis:0,sleep:0,stone:0,drunk:0,confusion:0},
    criticalWork:0,otherDamage:0,otherDefc:0,arrange:0,sequence:0,attachPile:0,hitRight:0,neglectGuard:0,
    attribAccum:[0,0,0,0],arm:null,items:[],complete:true
  };
  const slots=sourcePlayerItemSlots(target);
  const numericFields=[
    ['attack','ITEM_MODIFYATTACK'],['defense','ITEM_MODIFYDEFENCE'],['quick','ITEM_MODIFYQUICK'],
    ['hp','ITEM_MODIFYHP'],['mp','ITEM_MODIFYMP'],['luck','ITEM_MODIFYLUCK'],
    ['charm','ITEM_MODIFYCHARM'],['avoid','ITEM_MODIFYAVOID'],
    ['criticalWork','ITEM_CRITICAL'],['otherDamage','ITEM_OTHERDAMAGE'],['otherDefc','ITEM_OTHERDEFC'],
    ['arrange','ITEM_MODIFYARRANGE'],['sequence','ITEM_MODIFYSEQUENCE'],['attachPile','ITEM_ATTACHPILE'],
    ['hitRight','ITEM_HITRIGHT'],['neglectGuard','ITEM_NEGLECTGUARD']
  ];
  const statusFields=[
    ['poison','ITEM_POISON'],['paralysis','ITEM_PARALYSIS'],['sleep','ITEM_SLEEP'],
    ['stone','ITEM_STONE'],['drunk','ITEM_DRUNK'],['confusion','ITEM_CONFUSION']
  ];
  for(let i=0;i<PLAYER_EQUIP_SLOT_COUNT;i++){
    if(slots[i]==null)continue;
    const itemIndex=Math.trunc(Number(slots[i]));
    if(!Number.isFinite(itemIndex))continue;
    const existing=sourceRuntimeSlotFromTarget(target,itemIndex);
    const template=sourcePlayerEquipTemplateForExisting(itemIndex,target);
    if(!existing||!template){result.complete=false;continue;}
    // fixed ITEM_equipEffect(): a non-shield item occupying CHAR_EQSHIELD contributes
    // only through every learned PROFESSION_DUAL_WEAPON row. Each field is integer-
    // truncated separately at (tier*3+20)%, while ITEM_MODIFYATTRIBVALUE remains full.
    const leftDualEntries=i===PLAYER_SHIELD_SLOT&&Math.trunc(Number(template.type))!==25
      ?sourceProfessionDualWeaponEntries(target):null;
    const applyEquipValue=value=>leftDualEntries===null
      ?Math.trunc(n(value))
      :sourceProfessionDualWeaponScaledItemValue(value,leftDualEntries);
    const values={};
    for(const [outKey,fieldName] of numericFields){
      const value=sourceItemRuntimeResolvedDataInt(existing,fieldName);
      if(value==null){result.complete=false;continue;}
      const applied=applyEquipValue(value);result[outKey]+=applied;values[outKey]=applied;
    }
    const statusValues={};
    for(const [statusKey,fieldName] of statusFields){
      const value=sourceItemRuntimeResolvedDataInt(existing,fieldName);
      if(value==null){result.complete=false;continue;}
      const applied=applyEquipValue(value);result.statusResist[statusKey]+=applied;statusValues[statusKey]=applied;
    }
    const attrib=sourceItemRuntimeResolvedDataInt(existing,'ITEM_MODIFYATTRIB');
    const attribValue=sourceItemRuntimeResolvedDataInt(existing,'ITEM_MODIFYATTRIBVALUE');
    if(attrib==null||attribValue==null){
      result.complete=false;
    }else if(attrib>0&&attrib<5){
      result.attribAccum[attrib-1]+=attribValue;
    }
    if(i===PLAYER_ARM_SLOT){
      const critical=sourceItemRuntimeResolvedDataInt(existing,'ITEM_CRITICAL');
      const attackNumMin=sourceItemRuntimeResolvedDataInt(existing,'ITEM_ATTACKNUM_MIN');
      const attackNumMax=sourceItemRuntimeResolvedDataInt(existing,'ITEM_ATTACKNUM_MAX');
      if(critical==null||attackNumMin==null||attackNumMax==null)result.complete=false;
      result.arm={
        itemIndex,itemId:template.itemId,type:Math.trunc(Number(template.type)),
        critical:critical==null?0:critical,
        attackNumMin:attackNumMin==null?null:attackNumMin,
        attackNumMax:attackNumMax==null?null:attackNumMax
      };
    }
    result.items.push({
      slot:i,itemIndex,itemId:template.itemId,name:template.name,type:template.type,
      values,statusResist:statusValues,attrib:attrib??null,attribValue:attribValue??null
    });
  }
  return result;
}
function sourcePlayerEquipCallbackSupported(template){
  const attach=String(template?.attachFunc||'');
  const detach=String(template?.detachFunc||'');
  if(attach===''&&detach==='')return true;
  // fixed item_event.c: ITEM_equipNoenemy reads ITEM_ARGUMENT noen; only the three
  // fixed itemset6 rows below have that callback pair and an exact sourced value.
  if(attach==='ITEM_equipNoenemy'&&detach==='ITEM_remNoenemy'){
    const key=String(Math.trunc(Number(template?.itemId)));
    return Object.prototype.hasOwnProperty.call(SOURCE_PLAYER_NOENEMY_LEVEL_BY_ITEM,key);
  }
  // fixed _Item_MoonAct: ITEM_randEnemyEquip reads ITEM_ARGUMENT rand; only these
  // fixed itemset6 rows have an exact sourced threshold.
  if(attach==='ITEM_randEnemyEquip'&&detach==='ITEM_RerandEnemyEquip'){
    const key=String(Math.trunc(Number(template?.itemId)));
    return Object.prototype.hasOwnProperty.call(SOURCE_PLAYER_RANDENEMY_BY_ITEM,key);
  }
  if(attach==='ITEM_MagicEquitWear'&&detach==='ITEM_MagicEquitReWear'){
    return SOURCE_PLAYER_MAGIC_DEFENSE_ITEM_IDS.has(Math.trunc(Number(template?.itemId)));
  }
  if(attach==='ITEM_MagicResist'&&detach==='ITEM_MagicReResist'){
    return sourcePlayerFixedEquipResistTemplate(template?.itemId);
  }
  if(attach==='ITEM_suitEquip'&&detach==='ITEM_ResuitEquip'){
    return sourcePlayerFixedSuitTemplate(template?.itemId);
  }
  // fixed item_event.c: this pair only toggles CHAR_PickAllPet.
  return attach==='ITEM_WearEquip'&&detach==='ITEM_ReWearEquip';
}
function sourcePlayerMagicDefenseArgumentValue(argument,key){
  const wanted=String(key||'');
  for(const token of String(argument||'').split('|')){
    const colon=token.indexOf(':');
    if(colon<0||token.slice(0,colon)!==wanted)continue;
    const value=parseInt(token.slice(colon+1),10);
    if(!Number.isFinite(value)||value<-100||value>100)return 0;
    return Math.trunc(value);
  }
  return 0;
}
function sourcePlayerEquipMagicDefense(target=state){
  const out={earth:0,water:0,fire:0,wind:0,quick:0,items:[]};
  const slots=sourcePlayerItemSlots(target);
  const fields=[['EA','earth'],['WA','water'],['FI','fire'],['WI','wind'],['QU','quick']];
  for(let i=0;i<PLAYER_EQUIP_SLOT_COUNT;i++){
    const itemIndex=Math.trunc(Number(slots?.[i]));
    if(!Number.isFinite(itemIndex))continue;
    const existing=sourceRuntimeSlotFromTarget(target,itemIndex);
    const template=sourcePlayerEquipTemplateForExisting(itemIndex,target);
    if(!existing||!template)continue;
    if(String(template.attachFunc||'')!=='ITEM_MagicEquitWear'||
       String(template.detachFunc||'')!=='ITEM_MagicEquitReWear')continue;
    if(!SOURCE_PLAYER_MAGIC_DEFENSE_ITEM_IDS.has(Math.trunc(Number(template.itemId))))continue;
    // V2.05 PETSKILL_ITEM_inslay may overwrite the live ITEM_ARGUMENT / callbacks.
    // Base callback arguments come from the small item-make runtime so this effect does not
    // depend on the large field2 runtime having been lazily loaded first.
    const argument=sourcePlayerLiveCallbackArgument(existing,template.itemId);
    const values={};
    for(const [sourceKey,outKey] of fields){
      const value=sourcePlayerMagicDefenseArgumentValue(argument,sourceKey);
      out[outKey]+=value;values[outKey]=value;
    }
    out.items.push({slot:i,itemIndex,itemId:Math.trunc(Number(template.itemId)),argument,values});
  }
  return out;
}
function sourcePlayerFixedSuitTemplate(itemId){
  const id=Math.trunc(Number(itemId));
  const row=Number.isFinite(id)&&itemMakeDb?.byItemId?itemMakeDb.byItemId[String(id)]:null;
  const f=row?.f&&typeof row.f==='object'?row.f:{};
  return f.a==='ITEM_suitEquip'&&f.d==='ITEM_ResuitEquip';
}
function sourcePlayerSuitArgumentValue(argument,key){
  const wanted=String(key||'');
  for(const token of String(argument||'').split('|')){
    // fixed NPC_Util_GetStrFromStrWithDelim first uses strstr(token,key), not exact key equality.
    if(!token.includes(wanted))continue;
    const fields=token.split(':');
    if(fields.length<2)continue;
    const m=String(fields[1]??'').match(/^[ \t]*([+-]?\d+)/);
    return m?Math.trunc(Number(m[1])):0;
  }
  return null;
}
function sourcePlayerSuitFreshWork(){
  const work={activeCode:0,members:[]};
  for(const key of SOURCE_PLAYER_SUIT_KEYS)work[key]=0;
  return work;
}
function sourcePlayerSuitWork(target=state){
  const out=sourcePlayerSuitFreshWork();
  if(!target)return out;
  const slots=sourcePlayerItemSlots(target);
  const equipped=[];
  for(let i=0;i<PLAYER_EQUIP_SLOT_COUNT;i++){
    const itemIndex=Math.trunc(Number(slots?.[i]));
    if(!Number.isFinite(itemIndex))continue;
    const existing=sourceRuntimeSlotFromTarget(target,itemIndex);
    const template=sourcePlayerEquipTemplateForExisting(itemIndex,target);
    if(!existing||!template)continue;
    equipped.push({
      slot:i,itemIndex,existing,template,
      suitCode:Math.trunc(n(template.suitCode))
    });
  }

  // fixed ITEM_CheckSuitEquip: first suit code encountered in equip-slot order with >=3 members wins.
  let activeCode=0;
  for(const entry of equipped){
    if(entry.suitCode<=0)continue;
    let same=0;
    for(const other of equipped)if(other.suitCode===entry.suitCode)same++;
    if(same>=3){activeCode=entry.suitCode;break}
  }
  out.activeCode=activeCode;
  if(activeCode<=0)return out;

  // Second source scan is again slot 0..8. Every matching member may set any ListSuit Work;
  // CHAR_setWorkInt means later slots overwrite earlier values instead of accumulating them.
  for(const entry of equipped){
    if(entry.suitCode!==activeCode)continue;
    const argument=sourcePlayerLiveCallbackArgument(entry.existing,entry.template.itemId);
    const values={};
    for(const key of SOURCE_PLAYER_SUIT_KEYS){
      const value=sourcePlayerSuitArgumentValue(argument,key);
      if(value==null)continue;
      out[key]=Math.trunc(n(value));
      values[key]=Math.trunc(n(value));
    }
    out.members.push({
      slot:entry.slot,itemIndex:entry.itemIndex,itemId:Math.trunc(n(entry.template.itemId)),
      suitCode:activeCode,argument,values
    });
  }
  return out;
}
function sourcePlayerApplySuitCompliance(normal,suit){
  const src=suit||sourcePlayerSuitFreshWork();
  let mfix=Math.trunc(n(normal?.fixedAttack));
  const mtgh=Math.trunc(n(normal?.fixedTough));
  const mdex=Math.trunc(n(normal?.fixedDex));
  let maxHp=Math.trunc(n(normal?.maxHp));

  mfix=mfix+Math.trunc(mfix*Math.trunc(n(src.FSTR))/100);
  let fixedAttack=mfix+Math.trunc(n(src.MSTR));
  let fixedTough=mtgh+Math.trunc(n(src.MTGH));
  let fixedDex=mdex+Math.trunc(n(src.MDEX));
  maxHp=maxHp+Math.trunc(n(src.VIT));

  // Other_DefcharWorkInt uses float /100.0 then assigns back to int Work values.
  if(mfix>0)fixedAttack=Math.trunc(fixedAttack+mfix*Math.trunc(n(src.SUITSTRP))/100);
  if(mtgh>0)fixedTough=Math.trunc(fixedTough+mtgh*Math.trunc(n(src.SUITTGH_P))/100);
  if(mdex>0)fixedDex=Math.trunc(fixedDex+mdex*Math.trunc(n(src.SUITDEXP))/100);

  return {fixedAttack,fixedTough,fixedDex,maxHp,mfix,mtgh,mdex};
}
function sourcePlayerEquipResistFreshWork(){
  return {fire:0,thunder:0,ice:0,weaken:0,barrier:0,nocast:0,fallride:0};
}
function sourcePlayerEquipResistAttachEvent(itemIndex,target=state){
  if(!target)return false;
  const existing=sourceRuntimeSlotFromTarget(target,itemIndex);
  const template=sourcePlayerEquipTemplateForExisting(itemIndex,target);
  if(!existing||!template||String(template.attachFunc||'')!=='ITEM_MagicResist')return false;
  const spec=sourcePlayerEquipResistSpecFromArgument(sourcePlayerLiveCallbackArgument(existing,template.itemId));
  if(!spec)return false;
  const work=sourcePlayerEquipResistWork(target);
  if(!Object.prototype.hasOwnProperty.call(work,spec.key))return false;
  // fixed ITEM_MagicResist uses CHAR_setWorkInt, not accumulation.
  work[spec.key]=Math.trunc(n(spec.value));
  return true;
}
function sourcePlayerEquipResistDetachEvent(itemIndex,target=state){
  if(!target)return false;
  const existing=sourceRuntimeSlotFromTarget(target,itemIndex);
  const template=sourcePlayerEquipTemplateForExisting(itemIndex,target);
  if(!existing||!template||String(template.detachFunc||'')!=='ITEM_MagicReResist')return false;
  const spec=sourcePlayerEquipResistSpecFromArgument(sourcePlayerLiveCallbackArgument(existing,template.itemId));
  if(!spec)return false;
  const clearKey=String(itemMakeDb?.equipResistSource?.detachClearsKey||'');
  const work=sourcePlayerEquipResistWork(target);
  if(!Object.prototype.hasOwnProperty.call(work,clearKey))return false;
  // fixed source bug: every detach branch writes CHAR_WORKEQUITFIRE=0,
  // even for thunder/ice/weaken/barrier/nocast/fallride.
  work[clearKey]=0;
  return true;
}
function sourcePlayerEquipResistWork(target=state){
  if(!target)return sourcePlayerEquipResistFreshWork();
  const current=target.playerEquipResistWork;
  const keys=['fire','thunder','ice','weaken','barrier','nocast','fallride'];
  if(current&&typeof current==='object'&&keys.every(k=>Number.isFinite(Number(current[k])))){
    return current;
  }
  // CHAR_loginCheckUserItem replays ATTACHFUNC for equipped slots in 0..8 order.
  // Build the transient Work snapshot the same way after every page reload.
  const work=sourcePlayerEquipResistFreshWork();
  target.playerEquipResistWork=work;
  const slots=sourcePlayerItemSlots(target);
  for(let i=0;i<PLAYER_EQUIP_SLOT_COUNT;i++){
    const itemIndex=Math.trunc(Number(slots?.[i]));
    if(Number.isFinite(itemIndex))sourcePlayerEquipResistAttachEvent(itemIndex,target);
  }
  return work;
}
function sourcePlayerProfessionMagicEquipSuitResist(attr,target=state){
  const key=String(attr||'');
  if(!(key==='fire'||key==='thunder'||key==='ice'))return 0;
  return Math.trunc(n(sourcePlayerEquipResistWork(target)[key]));
}

// V2.19 fixed profession-magic numeric core.
// This does not invent a profession-skill menu. It preserves the pinned C
// PROFESSION_MAGIC_GET_PRACTICE -> UN_POW_M -> PROFESSION_MAGIC_GET_DAMAGE chain.
function sourceProfessionMagicLevelM(rawLevel){
  const skillLevel=Math.trunc(n(rawLevel));
  if(skillLevel>90)return 10;
  if(skillLevel>80)return 9;
  if(skillLevel>70)return 8;
  if(skillLevel>60)return 7;
  if(skillLevel>50)return 6;
  if(skillLevel>40)return 5;
  if(skillLevel>30)return 4;
  if(skillLevel>20)return 3;
  if(skillLevel>10)return 2;
  return 1;
}
function sourceProfessionMagicTypeFromOption(option){
  // pinned analysis_profession_parameter(): char magic[3][5]={"火","冰","电"}.
  // Keep the fixed source literals and their 1/2/3 ordering exactly.
  const value=String(option??'');
  if(value==='火')return 1;
  if(value==='冰')return 2;
  if(value==='电')return 3;
  return -1;
}
function sourcePlayerProfessionMagicSuitPower(target=state){
  const suit=sourcePlayerSuitWork(target);
  return {
    mPower:Math.trunc(n(suit?.M_POW)),
    m2Power:Math.trunc(n(suit?.M2_POW)),
    unPower:Math.trunc(n(suit?.UN_POW_M))
  };
}
function sourcePlayerProfessionMagicEquipSuitForType(magicType,target=state){
  // PROFESSION_MAGIC_GET_DAMAGE fixed mapping is intentionally not corrected:
  // type 2 consumes thunder equip Work, type 3 consumes ice equip Work.
  const type=Math.trunc(n(magicType));
  if(type===1)return sourcePlayerProfessionMagicEquipSuitResist('fire',target);
  if(type===2)return sourcePlayerProfessionMagicEquipSuitResist('thunder',target);
  if(type===3)return sourcePlayerProfessionMagicEquipSuitResist('ice',target);
  return 0;
}
function sourceProfessionMagicPracticePower(command,rawSkillLevel,playerHp=0,suitWork=null){
  const skillLevel=sourceProfessionMagicLevelM(rawSkillLevel);
  // fixed C consumes this RAND even for commands whose switch branch never reads critical.
  const criticalRoll=cRand(1,100);
  let hpPower=0,mpPower=0;

  switch(String(command||'')){
    case 'BATTLE_COM_S_VOLCANO_SPRINGS':
      hpPower=skillLevel*10+100;
      if(skillLevel>=10){
        if(criticalRoll<=25)hpPower=Math.fround(hpPower*1.5);
      }else if(criticalRoll<=skillLevel+12){
        hpPower=Math.fround(hpPower*1.5);
      }
      break;
    case 'BATTLE_COM_S_FIRE_BALL':
      if(skillLevel>=10)hpPower=360;
      else if(skillLevel>=9)hpPower=320;
      else if(skillLevel>=8)hpPower=280;
      else if(skillLevel>=7)hpPower=260;
      else if(skillLevel>=5)hpPower=220;
      else if(skillLevel>=3)hpPower=180;
      else hpPower=160;
      break;
    case 'BATTLE_COM_S_SUMMON_THUNDER':
      hpPower=skillLevel*10+200;
      break;
    case 'BATTLE_COM_S_CURRENT':
      // Preserve the fixed _PROFESSION_ADDSKILL branch, including the unreachable >9 case.
      if(skillLevel>=10)hpPower=300;
      else if(skillLevel>9)hpPower=250;
      else if(skillLevel>7)hpPower=200;
      else if(skillLevel>4)hpPower=150;
      else if(skillLevel>1)hpPower=10;
      else hpPower=50;
      break;
    case 'BATTLE_COM_S_STORM':
      if(skillLevel>9)hpPower=200;
      else if(skillLevel>7)hpPower=180;
      else if(skillLevel>5)hpPower=160;
      else if(skillLevel>3)hpPower=140;
      else hpPower=120;
      break;
    case 'BATTLE_COM_S_ICE_ARROW':
      hpPower=skillLevel>=10?250:skillLevel*10+130;
      break;
    case 'BATTLE_COM_S_ICE_CRACK':
      if(skillLevel>=10)hpPower=400;
      else if(skillLevel===9)hpPower=300;
      else hpPower=skillLevel*10+210;
      break;
    case 'BATTLE_COM_S_DOOM':
      if(skillLevel>=10)hpPower=550;
      else if(skillLevel>9)hpPower=500;
      else if(skillLevel>8)hpPower=450;
      else if(skillLevel>7)hpPower=400;
      else if(skillLevel>6)hpPower=350;
      else if(skillLevel>4)hpPower=300;
      else if(skillLevel>2)hpPower=250;
      else hpPower=200;
      break;
    case 'BATTLE_COM_S_FIRE_SPEAR':
      if(skillLevel>9)hpPower=800;
      else if(skillLevel>8)hpPower=450;
      else if(skillLevel>7)hpPower=400;
      else if(skillLevel>6)hpPower=350;
      else if(skillLevel>5)hpPower=300;
      else if(skillLevel>3)hpPower=200;
      else hpPower=100;
      break;
    case 'BATTLE_COM_S_BLOOD': {
      const hp=Math.trunc(n(playerHp));
      hpPower=hp>1?Math.trunc(hp*(skillLevel*5+10)/100):0;
      break;
    }
    case 'BATTLE_COM_S_BLOOD_WORMS':
      hpPower=skillLevel*10+20;
      break;
    case 'BATTLE_COM_S_SIGN':
      if(skillLevel>=10){hpPower=200;mpPower=30}
      else if(skillLevel>6){hpPower=150;mpPower=20}
      else if(skillLevel>3){hpPower=100;mpPower=15}
      else{hpPower=50;mpPower=10}
      break;
    case 'BATTLE_COM_S_ENCLOSE':
      if(skillLevel>=10)hpPower=400;
      else if(skillLevel>9)hpPower=300;
      else if(skillLevel>7)hpPower=250;
      else if(skillLevel>4)hpPower=200;
      else hpPower=150;
      break;
  }

  const work=suitWork||sourcePlayerProfessionMagicSuitPower(state);
  const mPower=Math.trunc(n(work?.mPower??work?.M_POW));
  const m2Power=Math.trunc(n(work?.m2Power??work?.M2_POW));
  hpPower=Math.fround(hpPower+hpPower*(mPower/100));

  // fixed _SUIT_ADDPART4 consumes rand()%100 even when hpPower is zero.
  const m2Roll=cRand(0,99);
  if(m2Roll<30)hpPower=Math.fround(hpPower+hpPower*(m2Power/100));

  let varianceRoll=null;
  if(hpPower>0){
    varianceRoll=cRand(98,102);
    hpPower=Math.fround(hpPower*Math.fround(varianceRoll/100));
  }else{
    hpPower=0;
  }

  // PROFESSION_MAGIC_ATTAIC assigns the float hp_power into int power here.
  return {
    hpPower,mpPower,power:Math.trunc(hpPower),
    skillLevel,criticalRoll,m2Roll,varianceRoll
  };
}
function sourceProfessionMagicPreDamagePower(power,unPower){
  // fixed PROFESSION_MAGIC_ATTAIC applies UN_POW_M after ICE_MIRROR/special power
  // and before PROFESSION_MAGIC_GET_DAMAGE; compound assignment stores back into int power.
  let out=Math.trunc(n(power));
  const pct=Math.trunc(n(unPower));
  if(pct>0)out=Math.trunc(out-out*(pct/100));
  return out;
}
function sourceProfessionMagicGetDamage({
  magicType=0,power=0,command='',
  proficiency={},resist={},baseSuit={},equipSuit={},spirit={}
}={}){
  const inputPower=Math.trunc(n(power));
  const term=type=>{
    let prof=0,res=0,suit=0,sp=0;
    if(type===1){
      prof=n(proficiency?.fire);
      res=n(resist?.fire);
      suit=n(baseSuit?.fire)+n(equipSuit?.fire);
      sp=n(spirit?.fire);
    }else if(type===2){
      // fixed source mismatch: type 2 reads T proficiency/resist, I base suit, THUNDER equipment.
      prof=n(proficiency?.thunder);
      res=n(resist?.thunder);
      suit=n(baseSuit?.ice)+n(equipSuit?.thunder);
      sp=n(spirit?.thunder);
    }else if(type===3){
      // fixed source mismatch: type 3 reads I proficiency/resist, T base suit, ICE equipment.
      prof=n(proficiency?.ice);
      res=n(resist?.ice);
      suit=n(baseSuit?.thunder)+n(equipSuit?.ice);
      sp=n(spirit?.ice);
    }
    return inputPower*(1+prof/100)*(1-res/100)*(1-suit/100)*(1-sp/100);
  };

  let damage=0;
  if(String(command||'')==='BATTLE_COM_S_DOOM'){
    // fixed int damage receives each double expression through assignment / += / /= in sequence.
    damage=Math.trunc(term(1));
    damage=Math.trunc(damage+term(2));
    damage=Math.trunc(damage+term(3));
    damage=Math.trunc(damage/3);
  }else{
    damage=Math.trunc(term(Math.trunc(n(magicType))));
  }
  return damage<0?0:damage;
}
function sourcePlayerProfessionMagicDamageCore({
  magicType=0,power=0,command='',
  proficiency={},resist={},baseSuit={},spirit={},target=state
}

={}){
  const suitPower=sourcePlayerProfessionMagicSuitPower(target);
  const reducedPower=sourceProfessionMagicPreDamagePower(power,suitPower.unPower);
  const equipSuit={
    fire:sourcePlayerProfessionMagicEquipSuitForType(1,target),
    thunder:sourcePlayerProfessionMagicEquipSuitForType(2,target),
    ice:sourcePlayerProfessionMagicEquipSuitForType(3,target)
  };
  const damage=sourceProfessionMagicGetDamage({
    magicType,power:reducedPower,command,proficiency,resist,baseSuit,equipSuit,spirit
  });
  return {damage,power:reducedPower,equipSuit,unPower:suitPower.unPower};
}


function sourceProfessionSkillTemplate(skillId){
  const id=Math.trunc(Number(skillId));
  if(!Number.isFinite(id)||!professionSkillDb?.bySkillId)return null;
  return professionSkillDb.bySkillId[String(id)]||null;
}
function sourceProfessionMagicCostPlan(funcName,rawSkillLevel,option=''){
  const skillLevel=sourceProfessionMagicLevelM(rawSkillLevel);
  const func=String(funcName||'');
  let cost=-1;
  switch(func){
    case 'PROFESSION_VOLCANO_SPRINGS':
      cost=skillLevel>=10?35:skillLevel>=7?30:skillLevel>=5?20:skillLevel>=3?15:10;break;
    case 'PROFESSION_FIRE_BALL':
      cost=skillLevel>=9?50:skillLevel>=7?45:skillLevel>=5?40:skillLevel>=3?35:30;break;
    case 'PROFESSION_SUMMON_THUNDER':
      cost=skillLevel>=8?30:skillLevel>=5?25:skillLevel>=3?20:10;break;
    case 'PROFESSION_CURRENT':
      if(skillLevel>=10)cost=100;
      else if(skillLevel>9)cost=90;
      else if(skillLevel>8)cost=80;
      else if(skillLevel>7)cost=70;
      else if(skillLevel>6)cost=60;
      else if(skillLevel>4)cost=50;
      else if(skillLevel>2)cost=40;
      else cost=30;
      break;
    case 'PROFESSION_STORM':
      cost=skillLevel>8?50:skillLevel>6?45:skillLevel>4?40:skillLevel>2?35:30;break;
    case 'PROFESSION_ICE_ARROW':
      cost=skillLevel>=8?20:skillLevel>=4?15:10;break;
    case 'PROFESSION_ICE_CRACK':
      cost=skillLevel>=10?80:skillLevel>8?70:skillLevel>6?60:skillLevel>4?50:skillLevel>2?40:30;break;
    case 'PROFESSION_DOOM':
      cost=skillLevel>8?150:skillLevel>4?100:50;break;
    case 'PROFESSION_FIRE_SPEAR':
      cost=skillLevel>8?80:skillLevel>6?70:skillLevel>4?60:skillLevel>2?40:30;break;
    case 'PROFESSION_BLOOD_WORMS':
      cost=skillLevel>=10?15:skillLevel>=5?10:5;break;
    case 'PROFESSION_SIGN':
      cost=skillLevel>=8?10:5;break;
    case 'PROFESSION_ENCLOSE':
      cost=skillLevel>=10?80:skillLevel>=8?70:skillLevel>=5?60:50;break;
    case 'PROFESSION_ICE_MIRROR':
      cost=skillLevel>=9?40:skillLevel>=7?35:skillLevel>=5?30:skillLevel>=3?25:20;break;
    case 'PROFESSION_FIRE_ENCLOSE':
    case 'PROFESSION_ICE_ENCLOSE':
    case 'PROFESSION_THUNDER_ENCLOSE':
      cost=skillLevel>=10?50:skillLevel>=7?40:skillLevel>=4?30:20;break;
    case 'PROFESSION_TRANSPOSE':
      cost=skillLevel>=10?50:skillLevel>=9?40:skillLevel>=7?30:skillLevel>=4?20:10;break;
    case 'PROFESSION_RESIST_F_I_T':
      cost=skillLevel>=10?20:skillLevel>=9?15:skillLevel>=6?10:5;break;
    case 'PROFESSION_CALL_NATURE':
      cost=50;break;
    case 'PROFESSION_BOUNDARY':
      if(String(option||'').includes('破结界')){
        cost=skillLevel>=9?20:skillLevel>4?15:skillLevel>2?10:5;
      }else{
        cost=skillLevel>9?20:skillLevel>6?15:10;
      }
      break;
  }
  return {skillLevel,dynamic:cost>=0,cost};
}
function sourceProfessionSkillMpCost(skillId,rawSkillLevel){
  const row=sourceProfessionSkillTemplate(skillId);
  if(!row)return {ok:false,reason:'skill-not-found'};
  const magic=sourceProfessionMagicCostPlan(row.func,rawSkillLevel,row.option);
  const decMp=magic.dynamic?Math.trunc(n(magic.cost)):Math.trunc(n(row.costMp));
  return {
    ok:true,skillId:Math.trunc(n(row.skillId)),rawSkillLevel:Math.trunc(n(rawSkillLevel)),
    skillLevel:magic.skillLevel,decMp,dynamic:magic.dynamic,fallbackCost:Math.trunc(n(row.costMp))
  };
}
function sourceProfessionCommonCommandPlan(skillId,toNo,rawSkillLevel){
  const row=sourceProfessionSkillTemplate(skillId);
  if(!row)return null;
  const command=String(professionSkillDb?.commonCommandByFunc?.[String(row.func||'')]||'');
  if(!command)return null;
  const target=Math.trunc(n(toNo)),level=Math.trunc(n(rawSkillLevel)),array=Math.trunc(n(row.skillId));
  const delayed=command==='BATTLE_COM_S_DOOM'||command==='BATTLE_COM_S_FIRE_SPEAR';
  return {
    skillId:array,functionName:String(row.func||''),command,
    initialCom1:command,finalCom1:delayed?'BATTLE_COM_NONE':command,
    com2:target,com3High:level,com3Low:array,battleMode:'BATTLE_CHARMODE_C_OK',
    deferred:delayed?{
      com1:command,toNo:target,mode:'BATTLE_CHARMODE_C_OK',
      skillLevel:level,array,doomTime:command==='BATTLE_COM_S_DOOM'?3:2
    }:null
  };
}
function sourceProfessionSkillUsePreflight({
  skillId,rawSkillLevel,professionClass,mp,isPlayer=true,toNo=0
}

={}){
  const row=sourceProfessionSkillTemplate(skillId);
  if(!row)return {ok:false,reason:'skill-not-found'};
  const charClass=Math.trunc(n(professionClass));
  const requiredClass=Math.trunc(n(row.professionClass));
  if(charClass<=0||charClass!==requiredClass){
    return {ok:false,reason:'profession-mismatch',skillId:Math.trunc(n(row.skillId)),professionClass:charClass,requiredClass};
  }
  if(row.dispatchKnown!==true)return {ok:false,reason:'function-missing',skillId:Math.trunc(n(row.skillId))};
  if(!isPlayer)return {ok:false,reason:'not-player',skillId:Math.trunc(n(row.skillId))};

  const rawLevel=Math.trunc(n(rawSkillLevel));
  if(rawLevel<=0)return {ok:false,reason:'skill-level',skillId:Math.trunc(n(row.skillId))};

  const cost=sourceProfessionSkillMpCost(row.skillId,rawLevel);
  if(!cost.ok)return cost;
  const oldMp=Math.trunc(n(mp));
  if(oldMp<cost.decMp){
    return {ok:false,reason:'mp-short',skillId:Math.trunc(n(row.skillId)),mpBefore:oldMp,decMp:cost.decMp};
  }
  if(Math.trunc(n(row.skillId))!==11&&cost.decMp<=0){
    return {ok:false,reason:'mp-cost-invalid',skillId:Math.trunc(n(row.skillId)),mpBefore:oldMp,decMp:cost.decMp};
  }

  const mpAfter=Math.max(0,oldMp-cost.decMp);
  return {
    ok:true,skillId:Math.trunc(n(row.skillId)),functionName:String(row.func||''),
    professionClass:charClass,requiredClass,rawSkillLevel:rawLevel,
    skillLevel:cost.skillLevel,mpBefore:oldMp,decMp:cost.decMp,mpAfter,
    dynamicMp:cost.dynamic,deductBeforeDispatch:true,
    useFlag:Math.trunc(n(row.useFlag)),targetType:Math.trunc(n(row.target)),
    commonCommand:sourceProfessionCommonCommandPlan(row.skillId,toNo,rawLevel)
  };
}

function sourcePlayerProfessionSkillAt(slot,target=state){
  const i=Math.trunc(Number(slot));
  if(!target||i<0||i>=PROFESSION_SKILL_SLOT_COUNT)return null;
  const entry=Array.isArray(target.professionSkills)?target.professionSkills[i]:null;
  if(!entry||typeof entry!=='object')return null;
  const skillId=Number(entry.skillId),rawLevel=Number(entry.rawLevel);
  if(!Number.isFinite(skillId)||!Number.isFinite(rawLevel))return null;
  return {slot:i,skillId:Math.trunc(skillId),rawLevel:Math.trunc(rawLevel)};
}
function sourcePlayerProfessionFindSkill(skillId,target=state){
  const wanted=Math.trunc(Number(skillId));
  if(!Number.isFinite(wanted))return null;
  for(let i=0;i<PROFESSION_SKILL_SLOT_COUNT;i++){
    const entry=sourcePlayerProfessionSkillAt(i,target);
    if(entry&&entry.skillId===wanted)return entry;
  }
  return null;
}
function sourcePlayerProfessionSkillDisplayLevel(entry){
  if(!entry||!Number.isFinite(Number(entry.rawLevel)))return 0;
  return Math.trunc(Math.trunc(Number(entry.rawLevel))/100);
}
function sourceProfessionSkillAddPlan(target,skillId,displayLevel){
  if(!target)return {ok:false,reason:'state-missing'};
  const id=Math.trunc(Number(skillId));
  let level=Math.trunc(Number(displayLevel));
  if(!Number.isFinite(id)||!Number.isFinite(level))return {ok:false,reason:'skill-data'};
  if(level>PROFESSION_SKILL_LEVEL_MAX)level=PROFESSION_SKILL_LEVEL_MAX;
  else if(level<1)level=1;
  let firstEmpty=-1;
  for(let i=0;i<PROFESSION_SKILL_SLOT_COUNT;i++){
    const entry=sourcePlayerProfessionSkillAt(i,target);
    if(entry){
      if(entry.skillId===id)return {ok:false,reason:'already-learned',skillId:id,slot:i};
    }else if(firstEmpty<0){
      firstEmpty=i;
    }
  }
  if(firstEmpty<0)return {ok:false,reason:'skill-slots-full',skillId:id};
  return {ok:true,skillId:id,slot:firstEmpty,displayLevel:level,rawLevel:level*100};
}
function sourceProfessionSkillAdd(target,skillId,displayLevel){
  const plan=sourceProfessionSkillAddPlan(target,skillId,displayLevel);
  if(!plan.ok)return plan;
  if(!Array.isArray(target.professionSkills)||target.professionSkills.length!==PROFESSION_SKILL_SLOT_COUNT){
    target.professionSkills=normalizeProfessionSkills(target.professionSkills);
  }
  target.professionSkills[plan.slot]={skillId:plan.skillId,rawLevel:plan.rawLevel};
  return plan;
}
function sourceProfessionSkillPrerequisitePlan(row,target=state){
  if(!row)return {ok:false,reason:'skill-not-found'};
  let zeroPercentNeed=0,zeroPercentMissing=0;
  const missingAlternatives=[];
  for(let i=1;i<=4;i++){
    const limit=Math.trunc(n(row['limit'+i]));
    const needPercent=Math.trunc(n(row['percent'+i]));
    if(limit!==0&&needPercent===0)zeroPercentNeed++;
    if(limit===0)continue;
    if(limit===-1){
      let any=false;
      for(let slot=0;slot<PROFESSION_SKILL_SLOT_COUNT;slot++){
        const learned=sourcePlayerProfessionSkillAt(slot,target);
        if(learned&&learned.skillId>0){any=true;break}
      }
      if(!any)return {ok:false,reason:'needs-any-battle-skill',limit,needPercent};
      continue;
    }
    const learned=sourcePlayerProfessionFindSkill(limit,target);
    if(!learned){
      if(needPercent===0){
        zeroPercentMissing++;
        missingAlternatives.push(limit);
        continue;
      }
      return {ok:false,reason:'missing-prerequisite',limit,needPercent};
    }
    const level=sourcePlayerProfessionSkillDisplayLevel(learned);
    if(level<needPercent)return {ok:false,reason:'prerequisite-level',limit,needPercent,level};
  }
  if(zeroPercentNeed!==0&&zeroPercentMissing===zeroPercentNeed){
    return {ok:false,reason:'missing-prerequisite-alternative',alternatives:missingAlternatives};
  }
  return {ok:true,zeroPercentNeed,zeroPercentMissing};
}
function sourceProfessionSkillLearnPreflight({
  skillId,target=state,skillRate=1,transRequirement=null,inBattle=false
}={}){
  const row=sourceProfessionSkillTemplate(skillId);
  if(!row)return {ok:false,reason:'skill-not-found'};
  if(inBattle)return {ok:false,reason:'in-battle',skillId:Math.trunc(n(row.skillId))};
  const professionClass=Math.trunc(n(target?.professionClass));
  const requiredClass=Math.trunc(n(row.professionClass));
  if(professionClass===PROFESSION_CLASS_NONE){
    return {ok:false,reason:'no-profession',skillId:Math.trunc(n(row.skillId)),requiredClass};
  }
  if(professionClass!==requiredClass&&requiredClass!==4){
    return {ok:false,reason:'profession-mismatch',skillId:Math.trunc(n(row.skillId)),professionClass,requiredClass};
  }
  const skillPoint=Math.trunc(n(target?.professionSkillPoint));
  if(skillPoint<=0)return {ok:false,reason:'no-skill-point',skillId:Math.trunc(n(row.skillId)),skillPoint};
  const prerequisite=sourceProfessionSkillPrerequisitePlan(row,target);
  if(!prerequisite.ok)return Object.assign({skillId:Math.trunc(n(row.skillId))},prerequisite);
  const rate=Number.isFinite(Number(skillRate))?Number(skillRate):0;
  const cost=Math.trunc(Math.trunc(n(row.cost))*rate);
  const gold=Math.trunc(n(target?.gold));
  if(gold<cost)return {ok:false,reason:'gold-short',skillId:Math.trunc(n(row.skillId)),gold,cost,rate};
  if(transRequirement!=null){
    const requiredTrans=Math.trunc(n(transRequirement));
    const trans=Math.trunc(n(target?.transmigration));
    if(trans<requiredTrans){
      return {ok:false,reason:'transmigration-short',skillId:Math.trunc(n(row.skillId)),transmigration:trans,requiredTrans,cost};
    }
  }
  const initialDisplayLevel=([63,64,65].includes(Math.trunc(n(row.skillId))))?50:10;
  const addPlan=sourceProfessionSkillAddPlan(target,row.skillId,initialDisplayLevel);
  if(!addPlan.ok)return Object.assign({skillId:Math.trunc(n(row.skillId)),cost},addPlan);
  return {
    ok:true,skillId:Math.trunc(n(row.skillId)),professionClass,requiredClass,
    skillPointBefore:skillPoint,skillPointAfter:skillPoint-1,
    goldBefore:gold,goldAfter:gold-cost,cost,rate,
    initialDisplayLevel,initialRawLevel:initialDisplayLevel*100,
    slot:addPlan.slot,prerequisite,
    transRequirement:transRequirement==null?null:Math.trunc(n(transRequirement))
  };
}
function sourceProfessionSkillLearn(options={}){
  const target=options?.target??state;
  const plan=sourceProfessionSkillLearnPreflight(Object.assign({},options,{target}));
  if(!plan.ok)return plan;
  const added=sourceProfessionSkillAdd(target,plan.skillId,plan.initialDisplayLevel);
  if(!added.ok)return Object.assign({},plan,{ok:false,reason:added.reason});
  target.gold=plan.goldAfter;
  target.professionSkillPoint=plan.skillPointAfter;
  return Object.assign({},plan,{slot:added.slot,rawLevel:added.rawLevel});
}

function sourceProfessionLevelCheckPlan(target=state){
  const oldLevel=Math.trunc(n(target?.professionLevel));
  const oldSkillPoint=Math.trunc(n(target?.professionSkillPoint));
  let skillLevelSum=0;
  const contributions=[];
  for(let i=0;i<PROFESSION_SKILL_SLOT_COUNT;i++){
    const entry=sourcePlayerProfessionSkillAt(i,target);
    if(!entry||entry.skillId<=0)continue;
    const common=[63,64,65].includes(entry.skillId);
    const add=common?50*100:Math.trunc(n(entry.rawLevel));
    skillLevelSum+=add;
    contributions.push({slot:i,skillId:entry.skillId,rawLevel:entry.rawLevel,add,commonFixed50:common});
  }
  // fixed PROFESSION_LEVEL_CHECK_UP has no PROFESSION_MAX_LEVEL guard and advances only once.
  const nextLevelNeedPoint=oldLevel*70*100;
  const levelUp=skillLevelSum>=nextLevelNeedPoint;
  return {
    oldLevel,skillLevelSum,nextLevelNeedPoint,levelUp,contributions,
    levelAfter:levelUp?oldLevel+1:oldLevel,
    skillPointBefore:oldSkillPoint,
    skillPointAfter:levelUp?oldSkillPoint+1:oldSkillPoint
  };
}
function sourceProfessionLevelCheckApply(target=state){
  const plan=sourceProfessionLevelCheckPlan(target);
  if(plan.levelUp){
    target.professionLevel=plan.levelAfter;
    target.professionSkillPoint=plan.skillPointAfter;
  }
  return plan;
}
function sourceProfessionSkillProficiencyRollPlan({
  skillId,rawSkillLevel,randInclusive=cRand
}={}){
  const row=sourceProfessionSkillTemplate(skillId);
  if(!row)return {ok:false,reason:'skill-not-found',skillId:Math.trunc(n(skillId))};
  const rawBefore=Math.trunc(n(rawSkillLevel));
  // fixed PROFESSION_NORMAL_SKILL_LEVLE_UP draws RAND(0,10000) before the max-level check.
  const randNum=Math.trunc(n(randInclusive(0,10000)));
  if(rawBefore>=PROFESSION_SKILL_LEVEL_MAX*100){
    return {
      ok:true,skillId:Math.trunc(n(row.skillId)),rawBefore,rawAfter:rawBefore,
      randNum,randNum2:null,upFixValue:Math.trunc(n(row.fixValue))*100,
      success:false,maxed:true,centuryBoundary:false,addPoint:0
    };
  }
  const upFixValue=Math.trunc(n(row.fixValue))*100;
  const randNum2=Math.trunc(n(randInclusive(0,upFixValue)));
  const success=randNum>rawBefore+randNum2;
  const rawAfter=success?rawBefore+1:rawBefore;
  return {
    ok:true,skillId:Math.trunc(n(row.skillId)),rawBefore,rawAfter,
    randNum,randNum2,upFixValue,success,maxed:false,
    centuryBoundary:success&&(rawAfter%100===0),
    addPoint:success?1:0
  };
}
function sourceProfessionSkillProficiencyApply(target,slot,{randInclusive=cRand}={}){
  const entry=sourcePlayerProfessionSkillAt(slot,target);
  if(!entry)return {ok:false,reason:'skill-slot-empty',slot:Math.trunc(n(slot))};
  const roll=sourceProfessionSkillProficiencyRollPlan({
    skillId:entry.skillId,rawSkillLevel:entry.rawLevel,randInclusive
  });
  if(!roll.ok)return Object.assign({slot:entry.slot},roll);
  let levelCheck=null;
  if(roll.success){
    target.professionSkills[entry.slot].rawLevel=roll.rawAfter;
    if(roll.centuryBoundary)levelCheck=sourceProfessionLevelCheckApply(target);
  }
  return Object.assign({slot:entry.slot,displayLevelAfter:Math.trunc(roll.rawAfter/100),levelCheck},roll);
}
function sourceProfessionSkillPostDispatchProficiency({
  target=state,slot,dispatchRet=1,targetIsPet=false,
  randModulo=sourceRandModulo,randInclusive=cRand
}={}){
  const entry=sourcePlayerProfessionSkillAt(slot,target);
  if(!entry)return {ok:false,reason:'skill-slot-empty',slot:Math.trunc(n(slot))};
  let dispatchFailureRoll=null;
  if(Math.trunc(n(dispatchRet))===-1){
    const rawRoll=Math.trunc(n(randModulo(10)));
    dispatchFailureRoll=((rawRoll%10)+10)%10;
    // fixed source: ret==-1 only exits early when rand()%10 > 5.
    if(dispatchFailureRoll>5){
      return {
        ok:true,skillId:entry.skillId,slot:entry.slot,dispatchRet:-1,
        dispatchFailureRoll,proficiencySkipped:true,reason:'dispatch-ret-random'
      };
    }
  }
  // fixed _PROSKILL_OPTIMUM keeps Pskillid equal to Skill ID here; Skill 57 only gains
  // proficiency when its selected target resolves to CHAR_TYPEPET.
  if(entry.skillId===57&&targetIsPet!==true){
    return {
      ok:true,skillId:entry.skillId,slot:entry.slot,dispatchRet:Math.trunc(n(dispatchRet)),
      dispatchFailureRoll,proficiencySkipped:true,reason:'enrage-target-not-pet'
    };
  }
  const proficiency=sourceProfessionSkillProficiencyApply(target,entry.slot,{randInclusive});
  return Object.assign({
    ok:proficiency.ok,skillId:entry.skillId,slot:entry.slot,
    dispatchRet:Math.trunc(n(dispatchRet)),dispatchFailureRoll,
    proficiencySkipped:false
  },{proficiency});
}
function sourceProfessionFindSkillByFunction(funcName,target=state,optionNeedle=null){
  const wanted=String(funcName||'');
  const needle=optionNeedle==null?null:String(optionNeedle);
  for(let i=0;i<PROFESSION_SKILL_SLOT_COUNT;i++){
    const entry=sourcePlayerProfessionSkillAt(i,target);
    if(!entry)continue;
    const row=sourceProfessionSkillTemplate(entry.skillId);
    if(!row||String(row.func||'')!==wanted)continue;
    if(needle!=null&&!String(row.option||'').includes(needle))continue;
    return {slot:i,entry,row};
  }
  return null;
}
function sourceProfessionSpecialSkillProficiencyByFunction(
  target,funcName,{optionNeedle=null,randInclusive=cRand}={}
){
  const found=sourceProfessionFindSkillByFunction(funcName,target,optionNeedle);
  if(!found)return {ok:false,reason:'skill-not-learned',functionName:String(funcName||''),optionNeedle};
  const proficiency=sourceProfessionSkillProficiencyApply(target,found.slot,{randInclusive});
  return Object.assign({
    functionName:String(funcName||''),optionNeedle,skillId:found.entry.skillId,slot:found.slot
  },proficiency);
}
function sourceProfessionWeaponFocusMarker(weaponType){
  switch(Math.trunc(n(weaponType))){
    case 1:return '斧';
    case 2:return '棍';
    case 3:return '枪';
    case 4:return '弓';
    case 17:return '镖';
    case 18:return '投';
    case 19:return '石';
    default:return '无';
  }
}
function sourceProfessionWeaponFocusProficiency(target,weaponType,{randInclusive=cRand}={}){
  const marker=sourceProfessionWeaponFocusMarker(weaponType);
  return sourceProfessionSpecialSkillProficiencyByFunction(
    target,'PROFESSION_WEAPON_FOCUS',{optionNeedle:marker,randInclusive}
  );
}
function sourceProfessionPlayerAvoidRefresh(target=state,reason='battle-entry'){
  // fixed BATTLE_ProfessionStatus_init resets WORK_P_DUCK / WORKMOD_P_DUCK,
  // then scans all profession slots. Empty / invalid slots use CONTINUE.
  battlePlayerAvoidWork=null;
  if(!target)return {active:false,reason:'state-missing'};
  const professionClass=Math.trunc(n(target.professionClass));
  if(professionClass<=PROFESSION_CLASS_NONE)return {active:false,reason:'no-profession'};
  let matched=null;
  for(let i=0;i<PROFESSION_SKILL_SLOT_COUNT;i++){
    const entry=sourcePlayerProfessionSkillAt(i,target);
    if(!entry)continue;
    const row=sourceProfessionSkillTemplate(entry.skillId);
    if(!row||String(row.func||'')!=='PROFESSION_AVOID')continue;
    const requiredClass=Math.trunc(n(row.professionClass));
    // fixed Avoid branch uses RETURN, not continue, on profession mismatch.
    if(professionClass!==requiredClass){
      battlePlayerAvoidWork=null;
      return {
        active:false,reason:'profession-mismatch-terminator',
        slot:i,skillId:entry.skillId,professionClass,requiredClass
      };
    }
    const displayLevel=sourcePlayerProfessionSkillDisplayLevel(entry);
    const tier=sourceProfessionAttackSkillTier(displayLevel);
    // Preserve source discontinuity: tier 5 = 10%, tier 6 falls to 3%.
    let mod=tier<=5?tier*2:(tier-5)*3;
    if(mod>25)mod=25;
    matched={
      active:true,reason:String(reason||'refresh'),
      slot:i,skillId:entry.skillId,displayLevel,tier,
      professionClass,mod
    };
  }
  battlePlayerAvoidWork=matched;
  return matched||{active:false,reason:'skill-not-learned',professionClass};
}
function sourceProfessionPlayerAvoidApply(raw,work=battlePlayerAvoidWork){
  const before=Math.max(0,n(raw));
  if(!work?.active)return {active:false,before,after:before,mod:0,work:work||null};
  // BATTLE_DuckCheck owns float per, but BATTLE_check_profession_duck takes int per.
  // The call therefore truncates BEFORE multiplying by (100 + WORKMOD_P_DUCK)%.
  const input=Math.trunc(before);
  const mod=Math.trunc(n(work.mod));
  const after=Math.trunc(input*(100+mod)/100);
  return {active:true,before,input,after,mod,work};
}
function sourceProfessionPlayerWeaponType(target=state){
  const slots=sourcePlayerItemSlots(target);
  const itemIndex=Math.trunc(Number(slots?.[PLAYER_ARM_SLOT]));
  if(!Number.isFinite(itemIndex))return 0;
  const template=sourcePlayerEquipTemplateForExisting(itemIndex,target);
  return template?Math.trunc(n(template.type)):0;
}
function sourceProfessionPlayerWeaponFocusRefresh(target=state,reason='battle-entry'){
  // fixed BATTLE_ProfessionStatus_init resets WORK_WEAPON / WORKMOD_WEAPON first,
  // then scans every profession slot with CONTINUE on empty/invalid rows.
  battlePlayerWeaponFocusWork=null;
  if(!target)return {active:false,reason:'state-missing'};
  const professionClass=Math.trunc(n(target.professionClass));
  const weaponType=sourceProfessionPlayerWeaponType(target);
  if(professionClass<=PROFESSION_CLASS_NONE){
    return {active:false,reason:'no-profession',weaponType};
  }
  if(![1,2,3,4,17,18,19].includes(weaponType)){
    return {active:false,reason:'weapon-type',weaponType};
  }
  const marker=sourceProfessionWeaponFocusMarker(weaponType);
  let matched=null;
  for(let i=0;i<PROFESSION_SKILL_SLOT_COUNT;i++){
    const entry=sourcePlayerProfessionSkillAt(i,target);
    if(!entry)continue;
    const row=sourceProfessionSkillTemplate(entry.skillId);
    if(!row||String(row.func||'')!=='PROFESSION_WEAPON_FOCUS')continue;
    if(professionClass!==Math.trunc(n(row.professionClass)))continue;
    if(!String(row.option||'').includes(marker))continue;
    const displayLevel=sourcePlayerProfessionSkillDisplayLevel(entry);
    const tier=sourceProfessionAttackSkillTier(displayLevel);
    const oldStrPower=Math.trunc(n(battlePlayerMySkillStrPower));
    let mod=tier<=5?tier*2+oldStrPower:(tier-5)*3+10+oldStrPower;
    if(mod>25)mod=25;
    // A later matching slot overwrites the Work values; do not sum matching skills.
    matched={
      active:true,reason:String(reason||'refresh'),
      slot:i,skillId:entry.skillId,displayLevel,tier,
      professionClass,weaponType,marker,option:String(row.option||''),
      oldStrPower,mod
    };
  }
  battlePlayerWeaponFocusWork=matched;
  return matched||{active:false,reason:'no-matching-skill',professionClass,weaponType,marker};
}
function sourceProfessionPlayerWeaponFocusApply(attack,work=battlePlayerWeaponFocusWork){
  const before=Math.trunc(n(attack));
  if(!work?.active)return {active:false,before,after:before,mod:0,work:work||null};
  const mod=Math.trunc(n(work.mod));
  // fixed ITEM_equipEffect: FIXSTR = FIXSTR * (100 + WORKMOD_WEAPON) / 100.
  const after=Math.trunc(before*(100+mod)/100);
  return {active:true,before,after,mod,work};
}
function sourceProfessionDualWeaponProficiency(
  target,{armEquipped=false,shieldEquipped=false,randInclusive=cRand}={}
){
  if(armEquipped!==true||shieldEquipped!==true){
    return {ok:true,proficiencySkipped:true,reason:'dual-weapon-equipment'};
  }
  return sourceProfessionSpecialSkillProficiencyByFunction(
    target,'PROFESSION_DUAL_WEAPON',{randInclusive}
  );
}


function sourceProfessionLogProficiencyResult(result){
  if(!result||result.ok!==true)return result;
  const roll=result.proficiency&&typeof result.proficiency==='object'?result.proficiency:result;
  if(roll.success&&roll.centuryBoundary){
    const row=sourceProfessionSkillTemplate(roll.skillId);
    const name=String(row?.name||('Skill '+roll.skillId));
    addLog(name+'技能熟練度上升為'+Math.trunc(n(roll.rawAfter)/100)+'。','good');
  }
  const levelCheck=roll.levelCheck||null;
  if(levelCheck?.levelUp){
    addLog('職業等級上升為'+levelCheck.levelAfter+'級，職業技能點 +1。','good');
  }
  return result;
}
const SOURCE_PROFESSION_REBACK_STATUS_TYPES=Object.freeze([
  'paralysis','sleep','stone','dizzy','entwine','dragnet','iceCrack','iceArrow','thunderEnclose'
]);
function sourceProfessionStatusSeqFindSkillByFunction(funcName,target=state){
  const wanted=String(funcName||'');
  for(let i=0;i<PROFESSION_SKILL_SLOT_COUNT;i++){
    const entry=sourcePlayerProfessionSkillAt(i,target);
    // fixed BATTLE_ProfessionStatusSeq uses "if(Pskillid <= 0) return", not continue.
    if(!entry)return {ok:false,reason:'source-slot-terminator',slot:i,functionName:wanted};
    const row=sourceProfessionSkillTemplate(entry.skillId);
    if(!row)return {ok:false,reason:'source-invalid-skill-terminator',slot:i,skillId:entry.skillId,functionName:wanted};
    if(String(row.func||'')===wanted)return {ok:true,slot:i,entry,row,functionName:wanted};
  }
  return {ok:false,reason:'not-found',functionName:wanted};
}
function sourceProfessionPlayerRebackQualifyingStatus(desc){
  const st=battleStatusGet(desc);
  if(!st||Math.trunc(n(st.turns))<=0)return null;
  return SOURCE_PROFESSION_REBACK_STATUS_TYPES.includes(String(st.type||''))?st:null;
}
function sourceProfessionPlayerRebackStatusSeq(desc={kind:'player'},target=state,{randInclusive=cRand}={}){
  if(desc?.kind!=='player')return {triggered:false,reason:'not-player'};
  const found=sourceProfessionStatusSeqFindSkillByFunction('PROFESSION_REBACK',target);
  if(!found.ok)return Object.assign({triggered:false},found);
  const professionClass=Math.trunc(n(target?.professionClass));
  const requiredClass=Math.trunc(n(found.row?.professionClass));
  if(professionClass!==requiredClass){
    return {
      triggered:false,reason:'profession-mismatch',
      slot:found.slot,skillId:found.entry.skillId,professionClass,requiredClass
    };
  }
  const status=sourceProfessionPlayerRebackQualifyingStatus(desc);
  if(!status){
    return {triggered:false,reason:'no-qualifying-status',slot:found.slot,skillId:found.entry.skillId};
  }

  // fixed BATTLE_ProfessionStatusSeq reads SKILL_LEVEL, then CHANGE_SKILL_LEVEL_M:
  // >90 => 10 ... >10 => 2, otherwise 1. Heal percent is tier*2, capped at 20.
  const displayLevel=sourcePlayerProfessionSkillDisplayLevel(found.entry);
  const tier=sourceProfessionMagicLevelM(displayLevel);
  const percent=Math.min(20,tier*2);
  const maxHp=sourceUltimateMaxHp(desc);
  const hpBefore=Math.max(0,Math.trunc(n(battleStatusHp(desc))));
  let amount=Math.trunc(maxHp*percent/100);
  if(amount+hpBefore>maxHp)amount=maxHp-hpBefore;
  if(amount<0)amount=0;
  battleStatusSetHp(desc,hpBefore+amount);

  // Source calls PROFESSION_SKILL_LVEVEL_UP even when capped heal amount is zero.
  const proficiency=sourceProfessionSkillProficiencyApply(
    target,found.slot,{randInclusive}
  );
  sourceProfessionLogProficiencyResult(proficiency);
  if(amount>0)addLog('狀態回復自動恢復 '+amount+' HP。','good');
  else addLog('狀態回復自動觸發；目前 HP 已滿。','good');
  return {
    triggered:true,slot:found.slot,skillId:found.entry.skillId,
    status:String(status.type||''),statusTurns:Math.trunc(n(status.turns)),
    displayLevel,tier,percent,maxHp,hpBefore,hpAfter:battleStatusHp(desc),
    amount,proficiency
  };
}
function sourceProfessionPlayerDeflectArrangePower(compliance=state?.playerEquipCompliance){
  // fixed BATTLE_ProfessionStatus_init() first adds (tier+10) to WORKFIXARRANGE,
  // then immediately calls CHAR_complianceParameter(). CHAR_initcharWorkInt() resets
  // WORKFIXARRANGE to 0 and ITEM_equipEffect() rebuilds it from ITEM_MODIFYARRANGE.
  // Therefore effective WORKARRANGEPOWER is equipment-only; do not add Skill 53 tier here.
  return clamp(Math.trunc(n(compliance?.arrange)),0,1000);
}
function sourceProfessionPlayerDeflectEvent(target=state,{randInclusive=cRand}={}){
  const result=sourceProfessionSpecialSkillProficiencyByFunction(
    target,'PROFESSION_DEFLECT',{randInclusive}
  );
  sourceProfessionLogProficiencyResult(result);
  return result;
}
function sourceProfessionPlayerNormalDodgeEvent(target=state,{randInclusive=cRand}={}){
  const result=sourceProfessionSpecialSkillProficiencyByFunction(
    target,'PROFESSION_AVOID',{randInclusive}
  );
  sourceProfessionLogProficiencyResult(result);
  return result;
}
function sourceProfessionPlayerCriticalEvent(
  target=state,weaponType=0,{randInclusive=cRand}={}
){
  // fixed BATTLE_AttackSeq critical block order:
  // weapon-focus helper first, then dual-weapon helper.
  const slots=sourcePlayerItemSlots(target);
  const armEquipped=slots?.[PLAYER_ARM_SLOT]!=null;
  const shieldEquipped=slots?.[PLAYER_SHIELD_SLOT]!=null;
  const weaponFocus=sourceProfessionWeaponFocusProficiency(
    target,weaponType,{randInclusive}
  );
  sourceProfessionLogProficiencyResult(weaponFocus);
  const dualWeapon=sourceProfessionDualWeaponProficiency(
    target,{armEquipped,shieldEquipped,randInclusive}
  );
  sourceProfessionLogProficiencyResult(dualWeapon);
  return {weaponType:Math.trunc(n(weaponType)),armEquipped,shieldEquipped,weaponFocus,dualWeapon};
}


function sourceProfessionSkillStatusRow(slot,target=state){
  const entry=sourcePlayerProfessionSkillAt(slot,target);
  if(!entry)return null;
  const row=sourceProfessionSkillTemplate(entry.skillId);
  if(!row)return null;
  const displayLevel=sourcePlayerProfessionSkillDisplayLevel(entry);
  const mp=sourceProfessionSkillMpCost(entry.skillId,displayLevel);
  if(!mp.ok)return null;
  return {
    slot:entry.slot,
    useFlag:Math.trunc(n(row.useFlag)),
    skillId:entry.skillId,
    targetType:Math.trunc(n(row.target)),
    kind:Math.trunc(n(row.kind)),
    icon:Math.trunc(n(row.icon)),
    costMp:Math.trunc(n(mp.decMp)),
    displayLevel,
    rawLevel:entry.rawLevel,
    name:String(row.name||''),
    text:String(row.text||''),
    functionName:String(row.func||'')
  };
}
function sourceProfessionSkillStatusString(slot,target=state){
  const row=sourceProfessionSkillStatusRow(slot,target);
  if(!row)return '|';
  // fixed SKILL_makeSkillStatusString() field order.
  return [
    row.useFlag,row.skillId,row.targetType,row.kind,row.icon,
    row.costMp,row.displayLevel,row.name,row.text
  ].join('|');
}
function sourceProfessionSkillMenu(target=state){
  const out=[];
  for(let slot=0;slot<PROFESSION_SKILL_SLOT_COUNT;slot++){
    out.push(sourceProfessionSkillStatusRow(slot,target));
  }
  return out;
}
const SOURCE_PROFESSION_TARGET=Object.freeze({
  MYSELF:0,OTHER:1,ALL_MYSIDE:2,ALL_OTHERSIDE:3,ALL:4,NONE:5,
  OTHER_WITHOUT_MYSELF:6,WITHOUT_MYSELF_AND_PET:7,ONE_ROW:8,ONE_LINE:9,DEATH:10
});
const SOURCE_PROFESSION_KIND=Object.freeze({BATTLE:1,ASSIST:2,ADVANCE:3});
const SOURCE_PROFESSION_BATTLE_TO_NO=Object.freeze({
  SIDE_0:20,SIDE_1:21,ALL:22,SIDE_1_B_ROW:23,SIDE_1_F_ROW:24,SIDE_0_F_ROW:25,SIDE_0_B_ROW:26
});
function sourceProfessionKindSemantic(kind){
  switch(Math.trunc(n(kind))){
    case SOURCE_PROFESSION_KIND.BATTLE:return 'battle';
    case SOURCE_PROFESSION_KIND.ASSIST:return 'assist';
    case SOURCE_PROFESSION_KIND.ADVANCE:return 'advance';
    default:return 'unknown';
  }
}
function sourceProfessionTargetSemantic(targetType){
  switch(Math.trunc(n(targetType))){
    case SOURCE_PROFESSION_TARGET.MYSELF:return 'myself';
    case SOURCE_PROFESSION_TARGET.OTHER:return 'other';
    case SOURCE_PROFESSION_TARGET.ALL_MYSIDE:return 'all-my-side';
    case SOURCE_PROFESSION_TARGET.ALLOTHERSIDE:return 'all-other-side';
    case SOURCE_PROFESSION_TARGET.ALL:return 'all';
    case SOURCE_PROFESSION_TARGET.NONE:return 'none';
    case SOURCE_PROFESSION_TARGET.OTHER_WITHOUT_MYSELF:return 'other-without-myself';
    case SOURCE_PROFESSION_TARGET.WITHOUT_MYSELF_AND_PET:return 'without-myself-and-pet';
    case SOURCE_PROFESSION_TARGET.ONE_ROW:return 'one-row';
    case SOURCE_PROFESSION_TARGET.ONE_LINE:return 'one-line';
    case SOURCE_PROFESSION_TARGET.DEATH:return 'death';
    default:return 'unknown';
  }
}
function sourceProfessionTargetToNo({targetType,selectedToNo,battleMyNo=0}={}){
  const type=Math.trunc(Number(targetType));
  const myNo=Math.trunc(Number(battleMyNo));
  if(!Number.isFinite(Number(targetType))||!Number.isFinite(Number(battleMyNo))||myNo<0||myNo>19){
    return {ok:false,reason:'target-source-invalid',targetType:type,battleMyNo:myNo};
  }
  const selected=Math.trunc(Number(selectedToNo));
  const selectedValid=selectedToNo!=null&&!(typeof selectedToNo==='string'&&!selectedToNo.trim())
    &&Number.isFinite(Number(selectedToNo))&&selected>=0&&selected<=19;
  const side0=myNo<10;

  // fixed client battlemenu.cpp / ai_setting.cpp:
  // TARGET is the PETSKILL target enum. P|slot|toNo carries a battle number:
  // direct entries 0..19, side/all pseudo targets 20..22, and row pseudo targets 23..26.
  switch(type){
    case SOURCE_PROFESSION_TARGET.MYSELF:
    case SOURCE_PROFESSION_TARGET.NONE:
      return {ok:true,toNo:myNo,source:'battle-my-no'};
    case SOURCE_PROFESSION_TARGET.OTHER:
    case SOURCE_PROFESSION_TARGET.OTHER_WITHOUT_MYSELF:
    case SOURCE_PROFESSION_TARGET.WITHOUT_MYSELF_AND_PET:
    case SOURCE_PROFESSION_TARGET.ONE_LINE:
    case SOURCE_PROFESSION_TARGET.DEATH:
      return selectedValid
        ?{ok:true,toNo:selected,source:'selected-direct'}
        :{ok:false,reason:'target-unresolved',targetType:type,battleMyNo:myNo};
    case SOURCE_PROFESSION_TARGET.ALL_MYSIDE:
      return {ok:true,toNo:side0?SOURCE_PROFESSION_BATTLE_TO_NO.SIDE_0:SOURCE_PROFESSION_BATTLE_TO_NO.SIDE_1,source:'my-side'};
    case SOURCE_PROFESSION_TARGET.ALLOTHERSIDE:
      return {ok:true,toNo:side0?SOURCE_PROFESSION_BATTLE_TO_NO.SIDE_1:SOURCE_PROFESSION_BATTLE_TO_NO.SIDE_0,source:'other-side'};
    case SOURCE_PROFESSION_TARGET.ALL:
      return {ok:true,toNo:SOURCE_PROFESSION_BATTLE_TO_NO.ALL,source:'all'};
    case SOURCE_PROFESSION_TARGET.ONE_ROW:
      if(!selectedValid)return {ok:false,reason:'target-unresolved',targetType:type,battleMyNo:myNo};
      if(selected<=4)return {ok:true,toNo:SOURCE_PROFESSION_BATTLE_TO_NO.SIDE_0_B_ROW,source:'selected-row',selectedToNo:selected};
      if(selected<=9)return {ok:true,toNo:SOURCE_PROFESSION_BATTLE_TO_NO.SIDE_0_F_ROW,source:'selected-row',selectedToNo:selected};
      if(selected<=14)return {ok:true,toNo:SOURCE_PROFESSION_BATTLE_TO_NO.SIDE_1_B_ROW,source:'selected-row',selectedToNo:selected};
      return {ok:true,toNo:SOURCE_PROFESSION_BATTLE_TO_NO.SIDE_1_F_ROW,source:'selected-row',selectedToNo:selected};
    default:
      return {ok:false,reason:'target-type-unported',targetType:type,battleMyNo:myNo};
  }
}
function sourceProfessionBattleCommandPlan({
  slot,toNo,selectedToNo,battleMyNo=0,target=state
}={}){
  const entry=sourcePlayerProfessionSkillAt(slot,target);
  if(!entry)return {ok:false,reason:'skill-slot-empty',slot:Math.trunc(n(slot))};
  const row=sourceProfessionSkillTemplate(entry.skillId);
  if(!row)return {ok:false,reason:'skill-not-found',slot:entry.slot,skillId:entry.skillId};

  const explicitToNo=toNo!=null&&!(typeof toNo==='string'&&!toNo.trim())&&Number.isFinite(Number(toNo))&&Math.trunc(Number(toNo))>=0;
  const targetPlan=explicitToNo
    ?{ok:true,toNo:Math.trunc(Number(toNo)),source:'explicit-toNo'}
    :sourceProfessionTargetToNo({
      targetType:Math.trunc(n(row.target)),selectedToNo,battleMyNo
    });
  if(!targetPlan.ok){
    return Object.assign({
      ok:false,reason:targetPlan.reason||'target-unresolved',slot:entry.slot,skillId:entry.skillId,
      clientBattleUse:Math.trunc(n(row.useFlag))===1,targetType:Math.trunc(n(row.target)),
      kind:Math.trunc(n(row.kind)),kindSemantic:sourceProfessionKindSemantic(row.kind),
      targetSemantic:sourceProfessionTargetSemantic(row.target)
    },{targetPlan});
  }
  const resolvedToNo=Math.trunc(n(targetPlan.toNo));
  const displayLevel=sourcePlayerProfessionSkillDisplayLevel(entry);
  const use=sourceProfessionSkillUsePreflight({
    skillId:entry.skillId,rawSkillLevel:displayLevel,
    professionClass:Math.trunc(n(target?.professionClass)),
    mp:Math.trunc(n(target?.mp)),isPlayer:true,toNo:resolvedToNo
  });
  if(!use.ok)return Object.assign({slot:entry.slot,skillId:entry.skillId,toNo:resolvedToNo,targetPlan},use);
  const slotHex=entry.slot.toString(16).toUpperCase();
  const toNoHex=resolvedToNo.toString(16).toUpperCase();
  return {
    ok:true,slot:entry.slot,skillId:entry.skillId,toNo:resolvedToNo,
    slotHex,toNoHex,command:'P|'+slotHex+'|'+toNoHex,
    clientBattleUse:Math.trunc(n(row.useFlag))===1,
    useFlag:Math.trunc(n(row.useFlag)),targetType:Math.trunc(n(row.target)),
    targetSemantic:sourceProfessionTargetSemantic(row.target),
    kind:Math.trunc(n(row.kind)),kindSemantic:sourceProfessionKindSemantic(row.kind),
    displayLevel,use,targetPlan
  };
}
function sourceProfessionAttackSkillTier(displayLevel){
  const level=Math.trunc(n(displayLevel));
  if(level>=100)return 10;
  if(level>90)return 9;
  if(level>80)return 8;
  if(level>70)return 7;
  if(level>60)return 6;
  if(level>50)return 5;
  if(level>40)return 4;
  if(level>30)return 3;
  if(level>20)return 2;
  if(level>10)return 1;
  return 0;
}
function sourceProfessionPlayerAttackWork(){
  const view=playerBattleView();
  return Math.trunc(n(view?.attack));
}
function sourceProfessionSetPlayerAttackWork(value){
  battlePlayerAttackWork=Math.trunc(n(value));
  return battlePlayerAttackWork;
}
function sourceProfessionBattleFunctionSupported(functionName){
  return functionName==='PROFESSION_BRUST'
    ||functionName==='PROFESSION_CHAIN_ATK'
    ||functionName==='PROFESSION_CHAIN_ATK_2'
    ||functionName==='PROFESSION_SHIELD_ATTACK'
    ||functionName==='PROFESSION_DEAD_ATTACK'
    ||functionName==='PROFESSION_CAVALRY'
    ||functionName==='PROFESSION_ENTWINE'
    ||functionName==='PROFESSION_DRAGNET'
    ||functionName==='PROFESSION_TRAP'
    ||functionName==='PROFESSION_ATTACK_WEAK'
    ||functionName==='PROFESSION_INSTIGATE'
    ||functionName==='PROFESSION_THROUGH_ATTACK'
    ||functionName==='PROFESSION_CONVOLUTE'
    ||functionName==='PROFESSION_CHAOS'
    ||functionName==='PROFESSION_ENRAGE'
    ||functionName==='PROFESSION_ENERGY_COLLECT'
    ||functionName==='PROFESSION_FOCUS'
    ||functionName==='PROFESSION_SCAPEGOAT'
    ||functionName==='PROFESSION_DEFLECT'
    ||functionName==='PROFESSION_REBACK'
    ||functionName==='PROFESSION_AVOID';
}
function sourceProfessionBattleSkillPrepare({
  slot,toNo,selectedToNo,battleMyNo=0,target=state,
  randModulo=sourceRandModulo,randInclusive=cRand
}={}){
  if(!enemy)return {ok:false,reason:'not-in-battle',slot:Math.trunc(n(slot))};
  const plan=sourceProfessionBattleCommandPlan({slot,toNo,selectedToNo,battleMyNo,target});
  if(!plan.ok)return plan;
  if(plan.clientBattleUse!==true){
    return Object.assign({},plan,{ok:false,reason:'client-nonbattle-skill'});
  }
  if(!sourceProfessionBattleFunctionSupported(plan.use.functionName)){
    return Object.assign({},plan,{ok:false,reason:'battle-function-unported'});
  }

  // fixed PROFESSION_SKILL_Use(): MP is deducted at command receipt, BEFORE the
  // profession callback stores COM1/COM2/COM3 and before the later battle turn executes.
  target.mp=plan.use.mpAfter;
  const proficiency=sourceProfessionSkillPostDispatchProficiency({
    target,slot:plan.slot,dispatchRet:1,targetIsPet:false,
    randModulo,randInclusive
  });
  sourceProfessionLogProficiencyResult(proficiency);
  return Object.assign({},plan,{
    prepared:true,mpAfter:Math.trunc(n(target.mp)),
    functionName:plan.use.functionName,
    commonCommand:plan.use.commonCommand,
    attackSkillTier:sourceProfessionAttackSkillTier(plan.displayLevel),
    proficiency
  });
}
function sourceProfessionEnemyByBattleSlot(toNo){
  const slot=Math.trunc(Number(toNo));
  if(!enemy||slot<10||slot>19)return null;
  const units=Array.isArray(enemy.units)&&enemy.units.length?enemy.units:[enemy];
  return units.find(unit=>10+Math.trunc(n(unit?.battleSlot))===slot)||null;
}
function sourceProfessionPhysicalCalcOnlyResult(target,attackOptions={}){
  const base=playerBattleView();
  if(!base||!target)return null;
  const attacker=Object.assign({},base,attackOptions.attackerOverride||{});
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const originalGuarding=!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion');
  const dodgeOptions=Object.assign({},attackOptions,{guarding:originalGuarding});
  delete dodgeOptions.attackerOverride;
  const dodge=sourceInitialDodgeOnly(attacker,enemyBattleView(target),dodgeOptions);
  if(dodge.dodged){
    dodge.actualTarget=target;
    dodge.originalTarget=target;
    return dodge;
  }

  // fixed battle_profession_attack_fun() seeds Guardian=-1 and BATTLE_AttackSeq()
  // may calculate against the Guardian, but the caller never rewrites defindex afterward.
  // DamageSub / WakeUp / ItemCrush therefore still hit the ORIGINAL target.
  const guardian=attacker?.throwWeapon?null:enemyGuardianFor(target,null);
  const calcTarget=guardian||target;
  const calcDesc={kind:'enemy',unit:calcTarget,unitId:calcTarget.id};
  const calcGuarding=guardian
    ?!!calcTarget.guardThisTurn&&!battleStatusActive(calcDesc,'confusion')
    :originalGuarding;
  const opts=Object.assign({},attackOptions,{guarding:calcGuarding,disableDodge:true});
  delete opts.attackerOverride;
  const r=resolveNormalAttack(attacker,enemyBattleView(calcTarget),opts);
  r.duckRaw=dodge.duckRaw;
  r.actualTarget=target;
  r.originalTarget=target;
  if(guardian){
    if(r.damage<=0){r.damage=1;r.miss=false}
    r.guardianCalcOnly=guardian;
    r.guardianSourceBug='battle_profession_attack_fun-defindex-not-updated';
  }
  return r;
}
function sourceProfessionChainAtk2FixedStr(target=state){
  // fixed battle_profession_attack_fun() reads CHAR_WORKFIXSTR, not current
  // WORKATTACKPOWER. V2.36 includes MYSKILLSTR -> Weapon Focus -> WEAKEN order.
  return sourceProfessionPlayerEffectiveFixedAttack(target);
}
function sourceProfessionChainAtk2AttackPower(fixedStr,attackSkillTier){
  const base=Math.trunc(n(fixedStr));
  const tier=Math.trunc(n(attackSkillTier));
  return Math.trunc(base*(tier*2+100)/100);
}
function sourceProfessionChainAtk2ReactionConsume(target){
  // fixed CHAIN_ATK_2 consumes one ABSROB, one VANISH and clears TRAP BEFORE
  // the real BATTLE_Attack. It intentionally does NOT consume REFLEC.
  //
  // Current source-backed Web Enemy DamageReact can only reach ACUPUNCTURE.
  // ABSROB / VANISH / TRAP have no reachable runtime state yet, so do not
  // invent storage fields just to make this skill look more complete.
  return {
    absorbModeled:false,vanishModeled:false,trapModeled:false,
    acupunctureUntouched:!!target?.acupunctureActive,
    sourceCountersUnreachable:true
  };
}
function sourceProfessionOrdinaryPlayerAttackResult(target,{attackPower=null,sourceProfessionChaos=false}={}){
  if(!target)return {damage:0,dodged:false,critical:false,miss:true,guarded:false,actualTarget:null};
  const attacker=playerBattleView();
  if(!attacker)return {damage:0,dodged:false,critical:false,miss:true,guarded:false,actualTarget:null};
  if(Number.isFinite(Number(attackPower)))attacker.attack=Math.trunc(Number(attackPower));
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  return resolveAttackToEnemyWithGuardian(attacker,target,{
    guarding:!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion'),
    sourceProfessionChaos:!!sourceProfessionChaos
  });
}
function sourceProfessionPlayerShieldEquipped(target=state){
  const slots=sourcePlayerItemSlots(target);
  const itemIndex=Math.trunc(Number(slots?.[PLAYER_SHIELD_SLOT]));
  if(!Number.isFinite(itemIndex))return {equipped:false,itemIndex:null,template:null};
  const template=sourcePlayerEquipTemplateForExisting(itemIndex,target);
  return {
    equipped:!!template&&Math.trunc(Number(template.type))===25,
    itemIndex,template:template||null
  };
}
function sourceProfessionShieldAttackPower(currentAttack,attackSkillTier){
  const attack=Math.trunc(n(currentAttack));
  return Math.trunc(n(attackSkillTier))===10?attack:Math.trunc(attack*.5);
}
function sourceProfessionStatusAttackCheck(targetDesc,success){
  // fixed PROFESSION_BATTLE_StatusAttackCheck() consumes RAND before EVERY early return.
  const roll=cRand(1,100);
  if(!targetDesc||!battleStatusDescAlive(targetDesc)){
    return {success:false,roll,threshold:Math.trunc(n(success)),reason:'dead-or-missing'};
  }
  if(battleHasAnyStatus(targetDesc)){
    return {success:false,roll,threshold:Math.trunc(n(success)),reason:'existing-status'};
  }
  const threshold=Math.trunc(n(success));
  return {success:roll<threshold,roll,threshold,reason:roll<threshold?'hit':'roll'};
}
function sourceProfessionShieldAttackExecute(target,prepared,name){
  const shield=sourceProfessionPlayerShieldEquipped(state);
  if(!shield.equipped){
    addLog('「'+name+'」執行失敗：fixed 原 C 在角色回合才檢查盾牌，目前未裝備 ITEM_WSHIELD。','bad');
    return {
      handled:true,noAction:true,reason:'shield-required',
      skillId:prepared.skillId,functionName:prepared.functionName,
      toNo:prepared.toNo,targetUnitId:target?.id??null,shield
    };
  }

  const base=playerBattleView();
  const attackPower=sourceProfessionShieldAttackPower(base?.attack,prepared.attackSkillTier);
  sourceProfessionSetPlayerAttackWork(attackPower);
  // fixed status-change branch uses BATTLE_AttackSeq with Guardian output but never rewrites
  // defindex to Guardian, so this is the same calc-only Guardian bug as the first profession hit.
  const r=sourceProfessionPhysicalCalcOnlyResult(target,{attackerOverride:{attack:attackPower}});
  if(!r)return {handled:true,noAction:true,reason:'attack-result-missing',toNo:prepared.toNo,targetUnitId:target.id};

  // No ordinary BATTLE_Attack SUITPOISON branch. ItemCrush still happens for positive damage,
  // and must happen BEFORE PROFESSION_BATTLE_StatusAttackCheck consumes its RAND(1,100).
  const actual=applyFriendlyEnemyHit('player','你',target,r,null,{suppressSuitPoison:true});
  let dizzy=null,applied=false;
  const sourceHit=!r.dodged&&!r.miss;
  if(sourceHit){
    const targetDesc={kind:'enemy',unit:target,unitId:target.id};
    const success=30+prepared.attackSkillTier*4;
    dizzy=sourceProfessionStatusAttackCheck(targetDesc,success);
    if(dizzy.success){
      // fixed option 回%2 -> source stores turn+1 = 3.
      applied=battleStatusApply(targetDesc,'dizzy',2);
      if(applied){
        // Source explicitly rewrites CHAR_WORKBATTLECOM1=BATTLE_COM_NONE for DIZZY.
        target.guardThisTurn=false;
        addLog(target.name+' 被「'+name+'」擊暈；fixed stored turn=3。','bad');
      }
    }
  }
  return {
    handled:true,skillId:prepared.skillId,functionName:prepared.functionName,
    toNo:prepared.toNo,targetUnitId:target.id,shield,
    attackSkillTier:prepared.attackSkillTier,attackPower,sourceHit,
    r,actual,dizzy,dizzyApplied:applied,dizzyStoredTurns:applied?3:0,
    noOrdinaryCounter:true
  };
}
function sourceProfessionPlayerHitRight(compliance=state?.playerEquipCompliance){
  const base=Math.trunc(n(compliance?.hitRight));
  if(!battlePlayerProfessionHitState)return base;
  const work=Number(battlePlayerProfessionHitState.workHitRight);
  return Number.isFinite(work)?Math.trunc(work):base;
}
function sourceProfessionPlayerHitPreCommandCompliance(target=state){
  if(!target)return null;
  const compliance=target.playerEquipCompliance||null;
  const baseHitRight=Math.trunc(n(compliance?.hitRight));
  if(!battlePlayerProfessionHitState)return {active:false,workHitRight:baseHitRight};

  // fixed _CHAR_complianceParameter -> CHAR_initcharWorkInt -> ITEM_equipEffect:
  // WORKHITRIGHT is rebuilt from equipment, while MYSKILLHIT / MYSKILLHIT_NUM survive.
  battlePlayerProfessionHitState.workHitRight=baseHitRight;

  const beforeTurns=Math.trunc(n(battlePlayerProfessionHitState.turns));
  let afterTurns=beforeTurns;
  let sourceEquipBugAdd=0;
  if(beforeTurns>0){
    // fixed Other_DefcharWorkInt source bug:
    // mpower=MYSKILLHIT; mdef=WORKHITRIGHT;
    // mpower += (mtgh*mdef)/100; then writes the result BACK to MYSKILLHIT.
    // mtgh is the pre-suit FIXTOUGH snapshot.
    const mtgh=Math.trunc(n(compliance?.preSuitFixedTough));
    sourceEquipBugAdd=Math.trunc(mtgh*baseHitRight/100);
    afterTurns=beforeTurns+sourceEquipBugAdd;
    battlePlayerProfessionHitState.turns=afterTurns;
  }
  return {
    active:afterTurns>0,beforeTurns,afterTurns,baseHitRight,
    sourceEquipBugAdd,
    preSuitFixedTough:Math.trunc(n(compliance?.preSuitFixedTough)),
    power:Math.trunc(n(battlePlayerProfessionHitState.power)),
    workHitRight:Math.trunc(n(battlePlayerProfessionHitState.workHitRight))
  };
}
function sourceProfessionPlayerHitStatusSeq(target=state){
  const st=battlePlayerProfessionHitState;
  if(!st||Math.trunc(n(st.turns))<=0)return null;
  const beforeTurns=Math.trunc(n(st.turns));
  const turns=beforeTurns-1;
  st.turns=turns;
  let restored=false;
  if(turns===0){
    // fixed BATTLE_StatusSeq tail subtracts MYSKILLHIT_NUM from the CURRENT
    // compliance-rebuilt WORKHITRIGHT. This can create a negative one-round Work value.
    st.workHitRight=Math.trunc(n(st.workHitRight))-Math.trunc(n(st.power));
    restored=true;
  }
  return {
    beforeTurns,turns,power:Math.trunc(n(st.power)),
    restored,workHitRight:Math.trunc(n(st.workHitRight))
  };
}

function sourceProfessionPlayerStatActiveAny(){
  return ['str','tgh','dex'].some(key=>{
    const st=battlePlayerProfessionStatStates?.[key];
    return !!st&&Math.trunc(n(st.turns))>0;
  });
}
function sourceProfessionPlayerStatSet(stat,turns,power){
  const key=String(stat||'').toLowerCase();
  if(!['str','tgh','dex'].includes(key))return {ok:false,reason:'unsupported-stat',stat:key};
  const value={
    turns:Math.max(0,Math.trunc(n(turns))),
    power:Math.trunc(n(power))
  };

  // SetMagicPet and profession assists share CHAR_MYSKILLSTR/TGH/DEX in fixed C.
  // A profession callback writes its field unconditionally, so it overwrites a same-stat
  // SetMagicPet state for future PreCommand rounds. The already-built current-round
  // snapshot intentionally remains untouched.
  let overwroteMagicPet=false;
  const magic=typeof sourceMagicPetState==='function'?sourceMagicPetState({kind:'player'}):null;
  if(magic&&String(magic.stat||'').toLowerCase()===key){
    battleMagicPetStates.delete('player');
    overwroteMagicPet=true;
  }

  battlePlayerProfessionStatStates[key]=value;
  // fixed CHAR_MYSKILLSTRPOWER survives when CHAR_MYSKILLSTR turns later reach zero.
  // It is cleared only by BATTLE_BadStatusAllClr at battle entry.
  if(key==='str')battlePlayerMySkillStrPower=value.power;
  return {ok:true,stat:key,turns:value.turns,power:value.power,overwroteMagicPet};
}
function sourceProfessionPlayerStatPreCommandCompliance(target=state){
  if(!target)return null;
  const compliance=target.playerEquipCompliance||null;
  const mtgh=Math.trunc(n(compliance?.preSuitFixedTough??compliance?.fixedTough??target.defense));
  const effects={};
  let attackAdd=0,defenseAdd=0,quickAdd=0;

  // fixed Other_DefcharWorkInt source bug: STR/TGH/DEX ALL use the saved mtgh
  // snapshot as the percentage base, not their own FIX stat.
  for(const key of ['str','tgh','dex']){
    const st=battlePlayerProfessionStatStates?.[key]||null;
    if(!st||Math.trunc(n(st.turns))<=0)continue;
    const power=Math.trunc(n(st.power));
    const add=Math.trunc(mtgh*power/100);
    effects[key]={turns:Math.trunc(n(st.turns)),power,add};
    if(key==='str')attackAdd+=add;
    else if(key==='tgh')defenseAdd+=add;
    else quickAdd+=add;
  }
  battlePlayerProfessionStatRound={mtgh,attackAdd,defenseAdd,quickAdd,effects};
  return Object.assign({active:Object.keys(effects).length>0},battlePlayerProfessionStatRound);
}
function sourceProfessionPlayerStatRoundAdjusted(attack,defense,quick){
  const round=battlePlayerProfessionStatRound||{};
  return {
    attack:Math.trunc(n(attack))+Math.trunc(n(round.attackAdd)),
    defense:Math.trunc(n(defense))+Math.trunc(n(round.defenseAdd)),
    quick:Math.trunc(n(quick))+Math.trunc(n(round.quickAdd)),
    attackAdd:Math.trunc(n(round.attackAdd)),
    defenseAdd:Math.trunc(n(round.defenseAdd)),
    quickAdd:Math.trunc(n(round.quickAdd)),
    mtgh:Math.trunc(n(round.mtgh)),
    effects:round.effects||{}
  };
}
function sourceProfessionPlayerFixedAttackCompliance(target=state){
  if(!target){
    battlePlayerFixedAttackWork=null;
    return null;
  }
  const desc={kind:'player'};
  const compliance=target.playerEquipCompliance||null;
  const fixedToughBase=Math.trunc(n(compliance?.fixedTough??target.defense));
  const magicPet=sourceMagicPetAdjusted(
    desc,target.attack,target.defense,target.dex,fixedToughBase
  );
  const professionStats=sourceProfessionPlayerStatRoundAdjusted(
    magicPet.attack,magicPet.defense,magicPet.quick
  );
  // fixed ITEM_equipEffect order: MYSKILLSTR first, then WORK_WEAPON multiplier.
  const focus=sourceProfessionPlayerWeaponFocusApply(professionStats.attack);
  battlePlayerFixedAttackWork=Math.trunc(n(focus.after));
  return {
    fixedAttack:battlePlayerFixedAttackWork,
    preFocusAttack:Math.trunc(n(professionStats.attack)),
    magicPet,professionStats,focus
  };
}
function sourceProfessionPlayerEffectiveFixedAttack(target=state){
  const desc={kind:'player'};
  let value=battlePlayerFixedAttackWork;
  if(value==null){
    const fallback=sourceProfessionPlayerWeaponFocusApply(Math.trunc(n(target?.attack)));
    value=fallback.after;
  }
  value=Math.trunc(n(value));
  // fixed _MAGIC_WEAKEN runs after Weapon Focus inside Other_DefcharWorkInt.
  if(target===state&&battleWeakenRoundActive(desc))value=Math.trunc(value*.8);
  return value;
}
function sourceProfessionPlayerStatStatusSeq(target=state){
  const results=[];
  for(const key of ['str','tgh','dex']){
    const st=battlePlayerProfessionStatStates?.[key]||null;
    if(!st||Math.trunc(n(st.turns))<=0)continue;
    const beforeTurns=Math.trunc(n(st.turns));
    const turns=beforeTurns-1;
    const power=Math.trunc(n(st.power));
    if(turns<=0){
      battlePlayerProfessionStatStates[key]=null;
      addLog('你的職業 '+key.toUpperCase()+' Work 效果結束。');
    }else{
      st.turns=turns;
    }
    results.push({stat:key,beforeTurns,turns:Math.max(0,turns),power,expired:turns<=0});
  }
  return results.length?results:null;
}
function sourceProfessionWarriorAssistTurns(attackSkillTier){
  const tier=Math.trunc(n(attackSkillTier));
  return tier>=10?5:(tier>=5?4:3);
}

function sourceProfessionScapegoatSourceSlots(tier,battleMyNo=0){
  const skillTier=Math.trunc(n(tier));
  const myNo=clamp(Math.trunc(n(battleMyNo)),0,19);
  const sideBase=myNo>=10?10:0;
  const local=myNo-sideBase;
  if(skillTier>=10){
    const slots=[];
    for(let i=0;i<10;i++){
      const slot=sideBase+i;
      if(slot!==myNo)slots.push(slot);
    }
    return slots;
  }
  if(skillTier>=5){
    return [5,6,7,8,9].map(i=>sideBase+i);
  }
  return [sideBase+((local+5)%10)];
}
function sourceProfessionScapegoatProtectedPets(tier,battleMyNo=0){
  const slots=sourceProfessionScapegoatSourceSlots(tier,battleMyNo);
  const pets=sourceBattlePlayerPets().filter(p=>petIsBattleActive(p)&&!battlePetOutIds.has(p.id));
  // Current web battle runtime materializes Player slot 0 + at most one active Pet slot 5.
  // Keep the fixed covered-slot plan separately; do not invent absent party members/pets.
  if(!slots.some(slot=>slot%10===5))return [];
  return Math.trunc(n(tier))<5?pets.slice(0,1):pets;
}
function sourceProfessionScapegoatGuardianForPet(unit,pet){
  const st=battleProfessionScapegoat;
  if(!st||!pet||!st.protectedPetIds?.has?.(pet.id))return null;
  if(!state||n(state.hp)<=0)return null;
  if(!petIsBattleActive(pet)||!petIsAlive(pet)||sourcePlayerPetHidden(pet))return null;

  // fixed BATTLE_GuardianCheck: all indirect / throw weapons bypass Guardian.
  const wt=Math.trunc(n(unit?.weaponType));
  if(wt===4||wt===17||wt===18||wt===19)return null;

  const desc={kind:'player'};
  // Source rejects sleep/confusion/paralysis/stone/barrier/dizzy/dragnet/instigate/doom.
  // Every currently modeled blocking state is covered by CanMove, with confusion explicit.
  if(!battleStatusCanMove(desc)||battleStatusActive(desc,'confusion')||battleStatusActive(desc,'barrier'))return null;
  return state;
}
function sourceProfessionScapegoatExecute(prepared,name){
  const tier=Math.trunc(n(prepared?.attackSkillTier));
  const battleMyNo=Math.trunc(n(prepared?.toNo));
  const sourceSlots=sourceProfessionScapegoatSourceSlots(tier,battleMyNo);
  const pets=sourceProfessionScapegoatProtectedPets(tier,battleMyNo);
  const protectedPetIds=new Set(pets.map(p=>p.id));

  // fixed callback mutates FIXTOUGH only, after this round's WORKDEFENCEPOWER was already built.
  // Normal physical damage therefore keeps the old Work defense, while later same-round callers
  // that explicitly read FIXTOUGH see this reduced value.
  const beforeView=playerBattleView();
  const fixedToughBefore=Math.trunc(n(beforeView?.fixedTough));
  const tghPenalty=30-tier*2;
  const fixedToughScale=100-tghPenalty; // 70 + tier*2
  const fixedToughAfter=Math.trunc(fixedToughBefore*fixedToughScale/100);
  battlePlayerFixedToughWork=fixedToughAfter;

  battleProfessionScapegoat={
    tier,battleMyNo,sourceSlots:sourceSlots.slice(),protectedPetIds,
    fixedToughBefore,fixedToughAfter,fixedToughScale,tghPenalty,
    appliedBattleTurn:Math.max(0,Math.trunc(n(enemy?.sourceBattleTurn)))
  };

  addLog('你施放「'+name+'」：本輪後續近戰物理攻擊可替出戰寵物代擋；'
    +'FIXTOUGH '+fixedToughBefore+' → '+fixedToughAfter
    +'（WORKDEFENCEPOWER 本輪不重建）。','good');
  return {
    handled:true,skillId:prepared.skillId,functionName:String(prepared.functionName||''),
    toNo:battleMyNo,attackSkillTier:tier,sourceSlots:sourceSlots.slice(),
    protectedPetIds:[...protectedPetIds],
    fixedToughBefore,fixedToughAfter,fixedToughScale,tghPenalty,
    guardianUntilNextPreCommand:true,noDamage:true,noOrdinaryCounter:true
  };
}
function sourceProfessionWarriorAssistExecute(prepared,name){
  const tier=Math.trunc(n(prepared?.attackSkillTier));
  const functionName=String(prepared?.functionName||'');

  if(functionName==='PROFESSION_SCAPEGOAT'){
    return sourceProfessionScapegoatExecute(prepared,name);
  }

  if(functionName==='PROFESSION_ENRAGE'){
    const turns=sourceProfessionWarriorAssistTurns(tier);
    const strPower=tier*2+20;
    const tghPower=-(tier*2+10);
    const str=sourceProfessionPlayerStatSet('str',turns,strPower);
    const tgh=sourceProfessionPlayerStatSet('tgh',turns,tghPower);
    addLog('你施放「'+name+'」：STR Work +'+strPower+'%、TGH Work '+tghPower+
      '%，stored turns='+turns+'；真正能力從下一輪 compliance 生效。','good');
    return {
      handled:true,skillId:prepared.skillId,functionName,toNo:Math.trunc(n(prepared.toNo)),
      attackSkillTier:tier,turns,strPower,tghPower,str,tgh,
      effectStartsNextPreCommand:true,noDamage:true,noOrdinaryCounter:true
    };
  }

  if(functionName==='PROFESSION_ENERGY_COLLECT'){
    const turns=sourceProfessionWarriorAssistTurns(tier);
    const dexPower=tier*2+10;
    const tghPower=tier*2+20;
    const dex=sourceProfessionPlayerStatSet('dex',turns,dexPower);
    const tgh=sourceProfessionPlayerStatSet('tgh',turns,tghPower);
    // fixed source comment/client packet says "reduce dex", but MYSKILLDEXPOWER is stored POSITIVE.
    addLog('你施放「'+name+'」：TGH Work +'+tghPower+'%、DEX Work +'+dexPower+
      '%（保留 fixed 正號 bug），stored turns='+turns+'。','good');
    return {
      handled:true,skillId:prepared.skillId,functionName,toNo:Math.trunc(n(prepared.toNo)),
      attackSkillTier:tier,turns,dexPower,tghPower,dex,tgh,
      sourceDexSignBug:true,effectStartsNextPreCommand:true,
      noDamage:true,noOrdinaryCounter:true
    };
  }

  if(functionName==='PROFESSION_FOCUS'){
    const workHitRight=sourceProfessionPlayerHitRight();
    // fixed ignores option 命%200 for Work mutation here and hardcodes:
    // MYSKILLHIT=2, MYSKILLHIT_NUM=100. It does NOT add 100 to WORKHITRIGHT now.
    battlePlayerProfessionHitState={turns:2,power:100,workHitRight};
    addLog('你施放「'+name+'」：fixed 只寫 MYSKILLHIT=2／NUM=100，當下 WORKHITRIGHT 不增加。','good');
    return {
      handled:true,skillId:prepared.skillId,functionName,toNo:Math.trunc(n(prepared.toNo)),
      attackSkillTier:tier,turns:2,power:100,workHitRight,
      noImmediateHitRightIncrease:true,usesExistingHitLifecycle:true,
      noDamage:true,noOrdinaryCounter:true
    };
  }

  return {handled:false,reason:'battle-function-unported',skillId:prepared?.skillId??null};
}
function sourceProfessionStatusOptionInt(option,label,fallback=0){
  const token=String(label||'')+'%';
  const text=String(option||'');
  const at=text.indexOf(token);
  if(at<0)return Math.trunc(n(fallback));
  const m=text.slice(at+token.length).match(/^[+-]?\d+/);
  return m?Math.trunc(Number(m[0])):Math.trunc(n(fallback));
}
function sourceProfessionDragnetEnemyCount(){
  const units=Array.isArray(enemy?.units)&&enemy.units.length?enemy.units:(enemy?[enemy]:[]);
  let count=0;
  for(const unit of units){
    if(!unit)continue;
    if(battleStatusActive({kind:'enemy',unit,unitId:unit.id},'dragnet'))count++;
  }
  return count;
}
function sourceProfessionCancelEnemyCurrentCommand(unit,statusType){
  if(!unit)return null;
  const turn=Math.max(0,Math.trunc(n(enemy?.sourceBattleTurn)));
  // fixed status-change success writes CHAR_WORKBATTLECOM1=BATTLE_COM_NONE for
  // ENTWINE/DRAGNET immediately. This cancels a not-yet-executed command but
  // does not retroactively undo an action that already happened earlier in EntrySort.
  unit.sourceProfessionCommandCancelledTurn=turn;
  unit.sourceProfessionCommandCancelStatus=String(statusType||'');
  unit.guardThisTurn=false;
  unit.counterEligibleThisTurn=false;
  return {turn,statusType:String(statusType||'')};
}
function sourceProfessionEnemyCommandCancelled(unit){
  if(!unit)return null;
  const turn=Math.max(0,Math.trunc(n(enemy?.sourceBattleTurn)));
  if(Math.trunc(n(unit.sourceProfessionCommandCancelledTurn))!==turn)return null;
  return {turn,statusType:String(unit.sourceProfessionCommandCancelStatus||'')};
}
function sourceProfessionTrapTier(prepared){
  return sourceProfessionMagicLevelM(prepared?.displayLevel);
}

function sourceProfessionTrapExecute(prepared,name){
  const tier=sourceProfessionTrapTier(prepared);
  const value=tier*30+100;
  const turns=tier>=10?3:(tier>=5?2:1);
  battlePlayerProfessionTrap={turns,value,tier};
  addLog('你設下「'+name+'」：陷阱傷害 '+value+'，WORKTRAP='+turns+'。','good');
  return {
    handled:true,skillId:prepared.skillId,functionName:prepared.functionName,
    toNo:Math.trunc(n(prepared.toNo)),tier,value,turns,
    sourceLevelM:true,noDamage:true,noOrdinaryCounter:true
  };
}

function sourceProfessionPlayerTrapStatusSeq(){
  if(!battlePlayerProfessionTrap)return null;
  const before=Math.max(0,Math.trunc(n(battlePlayerProfessionTrap.turns)));
  const value=Math.max(0,Math.trunc(n(battlePlayerProfessionTrap.value)));
  if(before>0){
    const after=before-1;
    battlePlayerProfessionTrap.turns=after;
    return {before,after,value,active:after>0,modRetainedAtZero:after===0};
  }
  // fixed BATTLE_ProfessionStatusSeq clears MODTRAP only on a later pass that starts at count==0.
  battlePlayerProfessionTrap=null;
  return {before:0,after:0,value,active:false,modCleared:true};
}

function sourceProfessionPlayerTrapActive(){
  return !!battlePlayerProfessionTrap
    &&Math.trunc(n(battlePlayerProfessionTrap.turns))>0
    &&Math.trunc(n(battlePlayerProfessionTrap.value))>0;
}

function sourcePrepareProfessionTrapReaction(attackerDesc,targetDesc,r,{ignoreDamageReact=false}={}){
  if(ignoreDamageReact||targetDesc?.kind!=='player'||!sourceProfessionPlayerTrapActive()
    ||!r||r.dodged||r.miss||n(r.damage)<=0){
    return {triggered:false};
  }
  const attackerView=battleStatusDescView(attackerDesc);
  // fixed BATTLE_DamageSub: TRAP is returned by BATTLE_GetDamageReact, but any throw weapon
  // rewrites pRefrect back to NONE. The trap remains armed.
  if(attackerView?.throwWeapon){
    return {triggered:false,throwWeaponBlocked:true};
  }

  const originalDamage=Math.max(0,Math.trunc(n(r.damage)));
  const trapDamage=Math.max(0,Math.trunc(n(battlePlayerProfessionTrap.value)));
  const trapTurns=Math.max(0,Math.trunc(n(battlePlayerProfessionTrap.turns)));
  // Trigger consumes both WORKTRAP and WORKMODTRAP immediately.
  battlePlayerProfessionTrap=null;
  r.damage=trapDamage;
  r.sourceProfessionTrap=true;
  r.sourceProfessionTrapOriginalDamage=originalDamage;
  r.sourceProfessionTrapDamage=trapDamage;
  // BATTLE_Attack() sets iRet/ContFlg FALSE as soon as either side has DamageReact.
  // A real TRAP trigger therefore cannot flow into the outer Counter loop.
  r.sourceCounterBlockedByTrap=true;
  return {
    triggered:true,attackerDesc,targetDesc,r,
    originalDamage,trapDamage,trapTurns
  };
}

function sourceFinishProfessionTrapReaction(reaction){
  if(!reaction?.triggered)return reaction||{triggered:false};
  const {attackerDesc,targetDesc,r,trapDamage}=reaction;
  const before=battleStatusHp(attackerDesc);
  battleStatusSetHp(attackerDesc,before-trapDamage);
  reaction.attackerBefore=before;
  reaction.attackerAfter=battleStatusHp(attackerDesc);
  reaction.ultimate=sourceTrackDamageSubUltimate(attackerDesc,trapDamage,before,r);
  // fixed BATTLE_Attack rewrites defindex to attackindex after TRAP, so wake / later crush
  // observe the attacker rather than the protected Player.
  battleStatusWakeOnDamage(attackerDesc,trapDamage);
  if(before>0&&reaction.attackerAfter<=0&&attackerDesc?.kind==='enemy'&&attackerDesc.unit){
    sourceMarkEnemyDeathCredit(attackerDesc.unit,[targetDesc]);
  }
  return reaction;
}

function sourceLogProfessionTrapReaction(reaction){
  if(!reaction?.triggered)return;
  addLog(
    '你的陷阱發動：原本 '+reaction.originalDamage+' 傷害被改成陷阱固定 '
      +reaction.trapDamage+'，反傷 '+battleStatusDescName(reaction.attackerDesc)
      +'；陷阱已消耗。',
    reaction.attackerAfter<=0?'good':''
  );
}

function sourceProfessionHunterControlExecute(target,prepared,name){
  const functionName=String(prepared?.functionName||'');
  const type=functionName==='PROFESSION_ENTWINE'?'entwine'
    :(functionName==='PROFESSION_DRAGNET'?'dragnet':null);
  if(!type)return {handled:false,reason:'hunter-control-function',functionName};
  const row=sourceProfessionSkillTemplate(prepared.skillId);
  const option=String(row?.option||'');
  const tier=Math.trunc(n(prepared.attackSkillTier));
  const baseSuccess=sourceProfessionStatusOptionInt(option,'成',0);
  let success=baseSuccess+tier*4;
  const dragnetBefore=type==='dragnet'?sourceProfessionDragnetEnemyCount():0;
  if(type==='dragnet'){
    if(dragnetBefore===1)success=Math.trunc(success*.64);
    else if(dragnetBefore>1)success=Math.trunc(success*.4);
  }
  const turn=Math.max(1,sourceProfessionStatusOptionInt(option,'回',1));
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};

  // fixed PROFESSION_BATTLE_StatusAttackCheck consumes RAND(1,100) before
  // checking death or any existing StatusTbl entry. The shared helper preserves that.
  const check=sourceProfessionStatusAttackCheck(targetDesc,success);
  let applied=false,cancel=null,dexPercent=0,fixedDexBefore=null,fixedDexAfter=null;
  if(check.success){
    applied=battleStatusApply(targetDesc,type,turn);
    if(applied){
      cancel=sourceProfessionCancelEnemyCurrentCommand(target,type);
      if(type==='entwine'){
        // fixed branch writes FIXDEX only. WORKQUICK / already-built EntrySort order is
        // untouched, and next BATTLE_PreCommandSeq compliance rebuilds FIXDEX from base.
        dexPercent=sourceProfessionStatusOptionInt(option,'敏',0)+tier*4;
        fixedDexBefore=Math.trunc(n(target.roundFixQuick??target.quick));
        fixedDexAfter=Math.trunc(fixedDexBefore*(100-dexPercent)/100);
        target.roundFixQuick=fixedDexAfter;
      }
    }
  }
  if(applied){
    if(type==='entwine'){
      addLog(target.name+' 被「'+name+'」纏住：stored turn='+(turn+1)
        +'；FIXDEX '+fixedDexBefore+' → '+fixedDexAfter
        +'（WORKQUICK/本輪排序不重算，下一輪 compliance 會洗掉降敏）。','bad');
    }else{
      addLog(target.name+' 被「'+name+'」困住：stored turn='+(turn+1)
        +'，期間 BATTLE_CanMoveCheck=false。','bad');
    }
  }else{
    addLog('「'+name+'」對 '+target.name+' 未成功；原檢定 roll '+check.roll
      +' / threshold '+check.threshold+'。');
  }
  return {
    handled:true,skillId:prepared.skillId,functionName,toNo:prepared.toNo,
    targetUnitId:target.id,attackSkillTier:tier,type,option,
    baseSuccess,success,dragnetBefore,turn,storedTurns:applied?turn+1:0,
    check,applied,cancel,dexPercent,fixedDexBefore,fixedDexAfter,
    fixedDexOnly:type==='entwine',workQuickUnchanged:type==='entwine',
    nextPreCommandResetsEntwineDex:type==='entwine',
    noDamage:true,noOrdinaryCounter:true
  };
}

function sourceProfessionInstigateExecute(target,prepared,name){
  const row=sourceProfessionSkillTemplate(prepared.skillId);
  const option=String(row?.option||'');
  const tier=Math.trunc(n(prepared?.attackSkillTier));
  const baseSuccess=sourceProfessionStatusOptionInt(option,'成',0);
  const success=baseSuccess+tier*4;
  // fixed row says 回%2, but tier 10 is explicitly overridden to turn=4
  // before StatusTbl[INSTIGATE] receives turn+1.
  const optionTurn=Math.max(1,sourceProfessionStatusOptionInt(option,'回',1));
  const turn=tier===10?4:optionTurn;
  const rate=tier+10;
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};

  const check=sourceProfessionStatusAttackCheck(targetDesc,success);
  let applied=false;
  if(check.success){
    applied=battleStatusApply(targetDesc,'instigate',turn);
    if(applied){
      const st=battleStatusGet(targetDesc);
      if(st)st.instigateRate=rate;
    }
  }

  if(applied){
    addLog(target.name+' 被「'+name+'」挑撥：stored turn='+(turn+1)
      +'，StatusSeq 發作率 80%，發作時 FIX 攻防敏 -'+rate+'%。','bad');
  }else{
    addLog('「'+name+'」對 '+target.name+' 未成功；原檢定 roll '+check.roll
      +' / threshold '+check.threshold+'。');
  }
  return {
    handled:true,skillId:prepared.skillId,functionName:prepared.functionName,
    toNo:prepared.toNo,targetUnitId:target.id,attackSkillTier:tier,
    option,baseSuccess,success,optionTurn,turn,storedTurns:applied?turn+1:0,
    rate,check,applied,
    // Unlike ENTWINE / DRAGNET, INSTIGATE is absent from the fixed list that
    // clears BATTLECOM1 immediately on application.
    commandCancelledOnApply:false,noDamage:true,noOrdinaryCounter:true
  };
}

function sourceProfessionAttackWeakExecute(target,prepared,name){
  const tier=Math.trunc(n(prepared?.attackSkillTier));
  const base=playerBattleView();
  if(!base||!target){
    return {
      handled:true,noAction:true,reason:'attack-result-missing',
      skillId:prepared?.skillId,functionName:prepared?.functionName,
      toNo:prepared?.toNo,targetUnitId:target?.id??null
    };
  }

  // fixed BATTLE_COM_S_ATTACK_WEAK mutates current WORKATTACKPOWER for Pet/Enemy targets.
  // The live Web profession target here is CHAR_TYPEENEMY, so that source branch applies.
  const attackBefore=Math.trunc(n(base.attack));
  const attackScale=tier*2+110;
  const attackPower=Math.trunc(attackBefore*attackScale/100);
  sourceProfessionSetPlayerAttackWork(attackPower);

  // Source reduces the ATTACKER's WORKQUICK, not the defender's DEX.
  // EntrySort already ran, so this cannot reorder the current round; however the
  // immediately following BATTLE_AttackSeq/BATTLE_DamageCalc reads this lower WORKQUICK.
  const fixedDex=Math.trunc(n(base.fixedDex));
  const quickScale=90-tier;
  const workQuick=Math.trunc(fixedDex*quickScale/100);

  const r=sourceProfessionPhysicalCalcOnlyResult(target,{
    attackerOverride:{attack:attackPower,quick:workQuick}
  });
  if(!r){
    return {
      handled:true,noAction:true,reason:'attack-result-missing',
      skillId:prepared.skillId,functionName:prepared.functionName,
      toNo:prepared.toNo,targetUnitId:target.id,
      attackSkillTier:tier,attackBefore,attackScale,attackPower,
      fixedDex,quickScale,workQuick
    };
  }

  // Generic direct-profession boundary: non-CHAIN DamageReact is cleared and
  // ordinary BATTLE_Attack SUITPOISON is absent; wake / ItemCrush still occur.
  const actual=applyFriendlyEnemyHit(
    'player','你',target,r,null,
    {suppressSuitPoison:true,suppressDamageReact:true}
  );
  addLog('你施放「'+name+'」：WORKATTACKPOWER '+attackBefore+' → '+attackPower
    +'；自身 WORKQUICK = FIXDEX '+fixedDex+' × '+quickScale+'%。','good');
  return {
    handled:true,skillId:prepared.skillId,functionName:prepared.functionName,
    toNo:prepared.toNo,targetUnitId:target.id,attackSkillTier:tier,
    attackBefore,attackScale,attackPower,fixedDex,quickScale,workQuick,
    targetTypeBoost:true,entrySortAlreadyFixed:true,
    r,actual,damageReactSuppressed:true,suitPoisonSuppressed:true,
    noOrdinaryCounter:true
  };
}

function sourceProfessionCavalryExecute(target,prepared,name){
  // fixed version.h defines CAVALRY_DEBUG. In battle_profession_attack_fun(),
  // Cavalry therefore uses ordinary BATTLE_DamageSub(), NOT
  // BATTLE_PROFESSION_ATK_PET_DamageSub(). The special ride-pet damage split
  // is compiled out in this pinned build.
  //
  // Web still has no formal CHAR_RIDEPET ride system. Do not treat the active
  // battle pet as a mount and do not invent BATTLE_adjustRidePet3A inputs.
  const r=sourceProfessionPhysicalCalcOnlyResult(target);
  if(!r){
    return {
      handled:true,noAction:true,reason:'attack-result-missing',
      skillId:prepared.skillId,functionName:prepared.functionName,
      toNo:prepared.toNo,targetUnitId:target?.id??null,
      sourceCavalryDebug:true,ridePetDamageSplitDisabled:true
    };
  }

  // Same generic profession-direct boundary as the fixed helper:
  // no ordinary SUITPOISON branch, and every non-CHAIN direct skill clears
  // DamageReact before BATTLE_DamageSub. ItemCrush / wake / Guard / Arrange
  // remain part of the normal physical chain.
  const actual=applyFriendlyEnemyHit(
    'player','你',target,r,null,
    {suppressSuitPoison:true,suppressDamageReact:true}
  );
  addLog('你施放「'+name+'」；fixed CAVALRY_DEBUG 走一般 BATTLE_DamageSub，不啟用騎寵分傷。','good');
  return {
    handled:true,skillId:prepared.skillId,functionName:prepared.functionName,
    toNo:prepared.toNo,targetUnitId:target.id,
    attackSkillTier:Math.trunc(n(prepared.attackSkillTier)),
    r,actual,
    sourceCavalryDebug:true,
    ordinaryDamageSub:true,
    ridePetDamageSplitDisabled:true,
    noFormalRideSystem:true,
    damageReactSuppressed:true,
    suitPoisonSuppressed:true,
    noOrdinaryCounter:true
  };
}

function sourceProfessionDeadAttackExecute(target,prepared,name){
  const oldHp=Math.max(0,Math.trunc(n(state.hp)));
  if(oldHp<=10){
    addLog('「'+name+'」執行失敗：fixed 原 C 要求目前 HP > 10；MP／熟練度已在指令接收時處理。','bad');
    return {
      handled:true,noAction:true,reason:'dead-attack-hp-too-low',
      skillId:prepared.skillId,functionName:prepared.functionName,
      toNo:prepared.toNo,targetUnitId:target?.id??null,oldHp
    };
  }

  const tier=Math.trunc(n(prepared.attackSkillTier));
  const hpRate=tier*2+10;
  const hpAfter=Math.trunc(oldHp*hpRate/100);
  const hit=tier*2+80;
  const hitRightBefore=sourceProfessionPlayerHitRight();
  battlePlayerProfessionHitState={
    turns:1,power:hit,workHitRight:hitRightBefore+hit
  };
  state.hp=hpAfter;

  // fixed generic profession direct branch preserves skill_type but zeros any non-CHAIN
  // DamageReact before BATTLE_DamageSub. ACUPUNCTURE therefore stays unconsumed here.
  const r=sourceProfessionPhysicalCalcOnlyResult(target);
  if(!r)return {
    handled:true,noAction:true,reason:'attack-result-missing',
    toNo:prepared.toNo,targetUnitId:target.id,oldHp,hpAfter,hit
  };
  const actual=applyFriendlyEnemyHit(
    'player','你',target,r,null,
    {suppressSuitPoison:true,suppressDamageReact:true}
  );
  addLog('你施放「'+name+'」：HP '+oldHp+' → '+hpAfter+
    '，本次 WORKHITRIGHT +'+hit+'。','good');
  return {
    handled:true,skillId:prepared.skillId,functionName:prepared.functionName,
    toNo:prepared.toNo,targetUnitId:target.id,
    attackSkillTier:tier,oldHp,hpRate,hpAfter,hit,
    hitRightBefore,hitRightAfter:sourceProfessionPlayerHitRight(),
    r,actual,damageReactSuppressed:true,noOrdinaryCounter:true
  };
}
function sourceProfessionThroughAliveEnemySlots(){
  if(!enemy)return [];
  const units=Array.isArray(enemy.units)&&enemy.units.length?enemy.units:[enemy];
  return units
    .filter(unit=>unit&&n(unit.hp)>0)
    .map(unit=>10+Math.trunc(n(unit.battleSlot)))
    .filter(slot=>slot>=10&&slot<=19)
    .sort((a,b)=>a-b);
}
function sourceProfessionThroughResolveInitialSlot(toNo,{randModulo=sourceRandModulo}={}){
  const requested=Math.trunc(Number(toNo));
  const alive=sourceProfessionThroughAliveEnemySlots();
  if(!alive.length)return {ok:false,reason:'target-side-empty',requestedToNo:requested,aliveSlots:alive};
  if(alive.includes(requested)){
    return {ok:true,toNo:requested,requestedToNo:requested,retargeted:false,aliveSlots:alive,retargetRolls:[]};
  }

  // fixed __ATTACK_MAGIC BATTLE_MultiList packs alive slots into nLifeArea[0..nLife-1],
  // then repeatedly uses rand()%10 until the sampled packed index is not -1.
  const rolls=[];
  while(true){
    const roll=((Math.trunc(n(randModulo(10)))%10)+10)%10;
    rolls.push(roll);
    if(roll<alive.length){
      return {
        ok:true,toNo:alive[roll],requestedToNo:requested,retargeted:true,
        aliveSlots:alive,retargetRolls:rolls
      };
    }
  }
}
function sourceProfessionThroughTargetSlots(toNo){
  const base=Math.trunc(Number(toNo));
  const alive=new Set(sourceProfessionThroughAliveEnemySlots());
  if(!alive.has(base))return [];
  const pair=base<15?base+5:base-5;
  if(!alive.has(pair))return [base];

  // fixed PROFESSION_MAGIC_TOLIST_SORT always puts the front-row slot (15..19)
  // before the paired back-row slot (10..14), regardless of which one was clicked.
  return pair>base?[pair,base]:[base,pair];
}
function sourceProfessionThroughMagicDodge(target){
  // fixed PROFESSION_MAGIC_DODGE consumes RAND(1,100) before the EARTHROUND early return.
  const roll=cRand(1,100);
  if(!target||n(target.hp)<=0){
    return {miss:true,roll,luck:0,reason:'dead-or-missing'};
  }
  if(enemyUnitHidden(target)){
    return {miss:true,roll,luck:0,reason:'earthround'};
  }
  // CHAR_TYPEENEMY follows the non-Player ("pet") branch: LV*0.15, capped at 20.
  const luck=Math.trunc(Math.min(Math.max(1,Math.trunc(n(target.level)))*.15,20));
  return {miss:roll<=luck,roll,luck,reason:roll<=luck?'roll':'hit'};
}
function sourceProfessionThroughHitPenalty(attackSkillTier){
  const tier=Math.trunc(n(attackSkillTier));
  if(tier===10)return {applied:false,tier,workHitRight:sourceProfessionPlayerHitRight()};
  const before=sourceProfessionPlayerHitRight();
  // fixed Through special-power helper runs once PER target that passed magic dodge.
  // It overwrites MYSKILLHIT=1 / NUM=-70 each time and subtracts 50 from current WORKHITRIGHT.
  battlePlayerProfessionHitState={turns:1,power:-70,workHitRight:before-50};
  return {applied:true,tier,before,after:before-50,turns:1,power:-70};
}

function sourceProfessionChaosDuckRaw(raw){
  const duck=Math.max(0,Math.trunc(n(raw)));
  return Math.trunc(duck+duck*.4);
}
function sourceProfessionChaosAttackPowerStep(){
  const before=sourceProfessionPlayerAttackWork();
  const after=Math.trunc(before*70/100);
  sourceProfessionSetPlayerAttackWork(after);
  return {before,after,pct:70};
}
function sourceProfessionChaosAttackCount(attackSkillTier){
  const tier=Math.trunc(n(attackSkillTier));
  return tier>=10?5:(tier>=5?4:3);
}
function sourceProfessionChaosAliveSideSlots(toNo){
  const slot=Math.trunc(n(toNo));
  if(slot<10||slot>19)return [];
  // Current live player profession targets enemy-side slots 10..19.
  // fixed only checks BATTLE_TargetCheck while building this pool: EarthRound
  // remains a candidate and is rejected later when that pre-drawn slot executes.
  return sourceProfessionThroughAliveEnemySlots();
}
function sourceProfessionChaosDrawBatch(slots,count,randInclusive=cRand){
  const pool=Array.isArray(slots)?slots.slice():[];
  const total=Math.max(0,Math.trunc(n(count)));
  if(!pool.length||total<=0)return [];
  const out=[];
  for(let i=0;i<total;i++){
    out.push(pool[randInclusive(0,pool.length-1)]);
  }
  return out;
}
function sourceProfessionChaosExecute(target,prepared,name){
  const tier=Math.trunc(n(prepared.attackSkillTier));
  const attackCount=sourceProfessionChaosAttackCount(tier);

  // fixed mutates CURRENT WORKATTACKPOWER once before the first AttackSeq.
  // V2.30's battle-local Work mirror makes this 70% value survive the round.
  const attackWork=sourceProfessionChaosAttackPowerStep();

  // First hit is still inside battle_profession_attack_fun:
  // calc-only Guardian bug, non-CHAIN DamageReact suppression, no SUITPOISON,
  // but normal DamageSub / wake / ItemCrush are retained.
  const first=sourceProfessionPhysicalCalcOnlyResult(target,{
    attackerOverride:{attack:attackWork.after},
    sourceProfessionChaos:true
  });
  if(!first){
    return {
      handled:true,noAction:true,reason:'attack-result-missing',
      skillId:prepared.skillId,functionName:prepared.functionName,
      toNo:prepared.toNo,targetUnitId:target?.id??null,
      attackSkillTier:tier,attackCount,attackWork
    };
  }
  const firstActual=applyFriendlyEnemyHit(
    'player','你',target,first,null,
    {suppressSuitPoison:true,suppressDamageReact:true}
  );

  let remaining=attackCount-1;
  let pool=sourceProfessionChaosAliveSideSlots(prepared.toNo);
  let batch=sourceProfessionChaosDrawBatch(pool,remaining);
  const selectionBatches=[{
    reason:'initial-after-first-hit',remaining,pool:pool.slice(),draws:batch.slice()
  }];
  const extras=[];
  let k=0;
  let sourceInfiniteLoop=false;
  let sourceInfiniteLoopReason=null;

  // fixed pre-draws the WHOLE remaining target batch before any extra
  // BATTLE_Attack damage RNG. Duplicates are allowed.
  while(remaining>0){
    if(!pool.length||!batch.length)break;
    const slot=Math.trunc(n(batch[k]));
    const extraTarget=sourceProfessionEnemyByBattleSlot(slot);
    const valid=!!extraTarget&&n(extraTarget.hp)>0&&!enemyUnitHidden(extraTarget);

    if(valid){
      const attack=sourceProfessionOrdinaryPlayerAttackResult(
        extraTarget,{sourceProfessionChaos:true}
      );
      const actual=applyFriendlyEnemyHit('player','你',extraTarget,attack);
      extras.push({
        slot,targetUnitId:extraTarget.id,attack,actualUnitId:actual?.id??null,
        hpAfter:Math.max(0,Math.trunc(n(extraTarget.hp))),
        ordinaryBattleAttack:true,realGuardian:true,
        normalDamageReact:true,normalSuitPoison:true,normalItemCrush:true,
        noOuterCounter:true
      });
      remaining--;
      k++;
      continue;
    }

    // Invalid pre-drawn target: fixed discards the rest of the old batch,
    // rebuilds the current live side, then pre-draws ALL remaining targets again.
    pool=sourceProfessionChaosAliveSideSlots(prepared.toNo);
    if(!pool.length)break;

    // fixed can spin forever if the live pool consists only of EarthRound entries.
    // Preserve that source fact but do not freeze the browser.
    const visible=pool.filter(s=>{
      const unit=sourceProfessionEnemyByBattleSlot(s);
      return !!unit&&n(unit.hp)>0&&!enemyUnitHidden(unit);
    });
    if(!visible.length){
      sourceInfiniteLoop=true;
      sourceInfiniteLoopReason='earthround-only-candidate-pool';
      break;
    }

    batch=sourceProfessionChaosDrawBatch(pool,remaining);
    k=0;
    selectionBatches.push({
      reason:'invalid-predrawn-target-reroll',remaining,
      pool:pool.slice(),draws:batch.slice()
    });
  }

  syncEnemyTarget();
  addLog(
    '你施放「'+name+'」：WORK attack '+attackWork.before+' → '+attackWork.after+
    '，fixed 總攻擊 '+attackCount+' 次；實際追加 '+extras.length+' 次。',
    'good'
  );

  return {
    handled:true,skillId:prepared.skillId,functionName:prepared.functionName,
    toNo:Math.trunc(n(prepared.toNo)),targetUnitId:target.id,
    attackSkillTier:tier,attackCount,attackWork,
    first,firstActual,extras,selectionBatches,
    remainingExtraAttacks:remaining,
    sourceInfiniteLoop,sourceInfiniteLoopReason,
    finalWorkAttack:sourceProfessionPlayerAttackWork(),
    chaosDuckMultiplier:1.4,
    firstDamageReactSuppressed:true,firstSuitPoisonSuppressed:true,
    extraHitsOrdinaryBattleAttack:true,
    noOrdinaryCounter:true,workAttackPersists:true
  };
}
function sourceProfessionThroughPhysicalResult(target){
  if(!target)return null;
  const attacker=playerBattleView();
  const defender=enemyBattleView(target);
  if(!attacker||!defender)return null;

  // fixed BATTLE_PROFESSION_THROUGH_ATTACK_GET_DAMAGE:
  // critical RNG is consumed BEFORE BATTLE_DuckCheck.
  const criticalRaw=battleCriticalChance(attacker,defender);
  const criticalRoll=cRand(1,10000);
  const critical=criticalRoll<criticalRaw;

  if(critical){
    let damage=battleDamageCore(attacker,defender);
    // Direct BATTLE_CriDamageCalc: unlike BATTLE_AttackSeq, BOW has no critical-damage exception.
    damage=Math.trunc(
      damage+n(defender.defense)*Math.max(1,n(attacker.level))/Math.max(1,n(defender.level))*.5
    );
    return {
      damage:Math.max(0,Math.trunc(damage)),critical:true,dodged:false,miss:damage<=0,
      criticalRaw,criticalRoll,duckSkippedByCritical:true,
      noCriticalProficiencyHook:true
    };
  }

  const desc={kind:'enemy',unit:target,unitId:target.id};
  const guarding=!!target.guardThisTurn&&!battleStatusActive(desc,'confusion');
  const damageReact=!!target.acupunctureActive;

  // fixed BATTLE_DuckCheck returns FALSE immediately for GUARD, any DamageReact,
  // or an actor that cannot move. Through never follows with GuardAdjust/DamageSub.
  if(!guarding&&!damageReact&&defender.canMove!==false){
    const skillDuckPower=Math.trunc(n(defender.skillDuckPower));
    if(skillDuckPower>0){
      const skillDuckRoll=cRand(0,99);
      if(skillDuckRoll<=skillDuckPower){
        return {
          damage:0,critical:false,dodged:true,miss:false,criticalRaw,criticalRoll,
          skillDuck:true,skillDuckPower,skillDuckRoll,damageReact,
          noSuitDuck:true
        };
      }
    }
    const duckRaw=sourceBattleDuckTotal(attacker,defender);
    const duckRoll=cRand(1,10000);
    if(duckRoll<=duckRaw){
      return {
        damage:0,critical:false,dodged:true,miss:false,criticalRaw,criticalRoll,
        duckRaw,duckRoll,damageReact,noSuitDuck:true
      };
    }
    const damage=battleDamageCore(attacker,defender);
    return {
      damage:Math.max(0,Math.trunc(damage)),critical:false,dodged:false,miss:damage<=0,
      criticalRaw,criticalRoll,duckRaw,duckRoll,damageReact,noSuitDuck:true
    };
  }

  const damage=battleDamageCore(attacker,defender);
  return {
    damage:Math.max(0,Math.trunc(damage)),critical:false,dodged:false,miss:damage<=0,
    criticalRaw,criticalRoll,duckRaw:0,duckRoll:null,
    duckDisabled:true,guarding,damageReact,noSuitDuck:true
  };
}
function sourceProfessionThroughWakeTarget(target){
  if(!target)return false;
  const desc={kind:'enemy',unit:target,unitId:target.id};
  if(!battleStatusActive(desc,'sleep'))return false;
  // fixed PROFESSION_MAGIC_ATTAIC calls BATTLE_DamageWakeUp at the tail for every
  // def_be_hit target, even when the inner physical dodge yielded attvalue==0.
  battleStatusClear(desc,'sleep');
  addLog(target.name+' 被貫穿攻擊的來源 tail 喚醒了。');
  return true;
}
function sourceProfessionConvoluteResolveRow(toNo){
  const requested=Math.trunc(Number(toNo));
  if(requested!==23&&requested!==24){
    return {ok:false,reason:'unsupported-convolute-row',requestedToNo:requested};
  }
  const back=sourceProfessionThroughAliveEnemySlots().filter(slot=>slot>=10&&slot<=14);
  const front=sourceProfessionThroughAliveEnemySlots().filter(slot=>slot>=15&&slot<=19);
  const primary=requested===23?back:front;
  if(primary.length){
    return {
      ok:true,toNo:requested,requestedToNo:requested,fallback:false,
      targetSlots:primary.slice()
    };
  }
  const alternate=requested===23?front:back;
  if(!alternate.length){
    return {ok:false,reason:'target-side-empty',requestedToNo:requested,targetSlots:[]};
  }
  // fixed __ATTACK_MAGIC BATTLE_MultiList row fallback mutates COM2 to the opposite row pseudo.
  return {
    ok:true,toNo:requested===23?24:23,requestedToNo:requested,fallback:true,
    targetSlots:alternate.slice()
  };
}
function sourceProfessionConvoluteAttackStep(attackSkillTier){
  const before=sourceProfessionPlayerAttackWork();
  const pct=50+Math.trunc(n(attackSkillTier))*2;
  const after=Math.trunc(before*pct/100);
  sourceProfessionSetPlayerAttackWork(after);
  return {before,after,pct};
}
function sourceProfessionConvoluteExecute(prepared,name){
  const row=sourceProfessionConvoluteResolveRow(prepared.toNo);
  if(!row.ok){
    return {
      handled:true,noAction:true,reason:row.reason,
      skillId:prepared.skillId,functionName:prepared.functionName,
      toNo:Math.trunc(n(prepared.toNo)),row
    };
  }

  // Same PROFESSION_MAGIC_GET_PRACTICE source quirk as Through:
  // no Convolute branch, but unconditional critical + M2 RNG are still consumed.
  const practice=sourceProfessionMagicPracticePower(
    'BATTLE_COM_S_CONVOLUTE',prepared.displayLevel,state.hp
  );
  const slots=row.targetSlots.slice();
  const hits=[],wakeTargets=[];

  for(const slot of slots){
    const target=sourceProfessionEnemyByBattleSlot(slot);
    if(!target)continue;

    const magicDodge=sourceProfessionThroughMagicDodge(target);
    if(magicDodge.miss){
      hits.push({slot,targetUnitId:target.id,magicDodge,damage:0,magicMiss:true});
      addLog('「'+name+'」對 '+target.name+' 的 profession magic dodge 判定落空。');
      continue;
    }

    // fixed BATTLE_PROFESSION_CONVOLUTE_GET_DAMAGE mutates global WORKATTACKPOWER
    // before critical/duck. It reads the already-mutated value again for every next target.
    const attackWork=sourceProfessionConvoluteAttackStep(prepared.attackSkillTier);
    const physical=sourceProfessionThroughPhysicalResult(target);
    const rawPhysical=Math.max(0,Math.trunc(n(physical?.damage)));
    const magicDamage=sourcePlayerProfessionMagicDamageCore({
      magicType:-1,power:rawPhysical,command:'BATTLE_COM_S_CONVOLUTE',target:state
    });

    // No Convolute case, but fixed PROFESSION_MAGIC_CHANGE_STATUS still consumes its leading RAND.
    const unusedChangeStatusRoll=cRand(1,100);
    const damage=Math.max(0,Math.trunc(n(magicDamage.damage)));
    const before=Math.max(0,Math.trunc(n(target.hp)));
    target.hp=Math.max(0,before-damage);
    const after=Math.max(0,Math.trunc(n(target.hp)));
    if(before>0&&after<=0)sourceMarkEnemyDeathCredit(target,[{kind:'player'}]);

    hits.push({
      slot,targetUnitId:target.id,magicDodge,attackWork,physical,
      rawPhysical,magicDamage,unusedChangeStatusRoll,
      damage,hpBefore:before,hpAfter:after,
      directHpSubtract:true,noDamageSub:true,noGuardian:true,
      noDamageReact:true,noItemCrush:true,noCounter:true,noGuardAdjust:true
    });
    wakeTargets.push(target);

    if(physical?.dodged){
      addLog(target.name+' 閃過「'+name+'」內層物理判定；傷害 0，但 fixed tail 仍會解除睡眠。');
    }else{
      addLog('你以「'+name+'」命中 '+target.name+'，造成 '+damage+' 傷害。',after<=0?'bad':'good');
    }
  }

  const wakes=wakeTargets.map(target=>({
    targetUnitId:target.id,woke:sourceProfessionThroughWakeTarget(target)
  }));
  syncEnemyTarget();

  return {
    handled:true,skillId:prepared.skillId,functionName:prepared.functionName,
    requestedToNo:Math.trunc(n(prepared.toNo)),toNo:row.toNo,row,
    practice,targetSlots:slots,hits,wakes,
    attackSkillTier:prepared.attackSkillTier,
    finalWorkAttack:sourceProfessionPlayerAttackWork(),
    sourceMagicType:-1,sourcePracticePower:practice.power,
    noOrdinaryCounter:true,noGuardian:true,noItemCrush:true,noDamageSub:true
  };
}
function sourceProfessionThroughAttackExecute(prepared,name){
  const resolved=sourceProfessionThroughResolveInitialSlot(prepared.toNo);
  if(!resolved.ok){
    return {
      handled:true,noAction:true,reason:resolved.reason,
      skillId:prepared.skillId,functionName:prepared.functionName,
      toNo:Math.trunc(n(prepared.toNo)),resolved
    };
  }

  // fixed PROFESSION_MAGIC_GET_PRACTICE runs once before Through re-builds its paired list.
  // Through has no practice-power case, but still consumes its unconditional RAND(1,100)
  // and _SUIT_ADDPART4 rand()%100. power remains zero.
  const practice=sourceProfessionMagicPracticePower(
    'BATTLE_COM_S_THROUGH_ATTACK',prepared.displayLevel,state.hp
  );
  const slots=sourceProfessionThroughTargetSlots(resolved.toNo);
  const hits=[],wakeTargets=[];

  for(let i=0;i<slots.length;i++){
    const slot=slots[i];
    const target=sourceProfessionEnemyByBattleSlot(slot);
    if(!target)continue;

    const magicDodge=sourceProfessionThroughMagicDodge(target);
    if(magicDodge.miss){
      hits.push({slot,targetUnitId:target.id,magicDodge,damage:0,magicMiss:true});
      addLog('「'+name+'」對 '+target.name+' 的 profession magic dodge 判定落空。');
      continue;
    }

    const hitPenalty=sourceProfessionThroughHitPenalty(prepared.attackSkillTier);
    const physical=sourceProfessionThroughPhysicalResult(target);
    const rawPhysical=Math.max(0,Math.trunc(n(physical?.damage)));

    // fixed order: special physical power -> UN_POW_M -> PROFESSION_MAGIC_GET_DAMAGE.
    // magic_type is -1 ("无"), so the damage core otherwise returns this reduced power unchanged.
    const magicDamage=sourcePlayerProfessionMagicDamageCore({
      magicType:-1,power:rawPhysical,command:'BATTLE_COM_S_THROUGH_ATTACK',target:state
    });

    // fixed PROFESSION_MAGIC_CHANGE_STATUS consumes this RAND even though Through has no switch case.
    const unusedChangeStatusRoll=cRand(1,100);

    // fixed PROFESSION_MAGIC_CHANG_STATUS uses loop index, not actual row.
    // Therefore a single surviving back-row target is still "no==0" and gets the front multiplier.
    const multiplier=i===0?(prepared.attackSkillTier*2+70):(prepared.attackSkillTier*2+50);
    const damage=Math.max(0,Math.trunc(n(magicDamage.damage)*multiplier/100));
    const before=Math.max(0,Math.trunc(n(target.hp)));
    target.hp=Math.max(0,before-damage);
    const after=Math.max(0,Math.trunc(n(target.hp)));

    if(before>0&&after<=0){
      sourceMarkEnemyDeathCredit(target,[{kind:'player'}]);
    }

    hits.push({
      slot,targetUnitId:target.id,magicDodge,hitPenalty,physical,
      rawPhysical,magicDamage,unusedChangeStatusRoll,multiplier,
      damage,hpBefore:before,hpAfter:after,
      directHpSubtract:true,noDamageSub:true,noGuardian:true,
      noDamageReact:true,noItemCrush:true,noCounter:true,noGuardAdjust:true
    });
    wakeTargets.push(target);

    if(physical?.dodged){
      addLog(target.name+' 閃過「'+name+'」內層物理判定；傷害 0，但 fixed tail 仍會解除睡眠。');
    }else{
      addLog('你以「'+name+'」命中 '+target.name+'，造成 '+damage+' 傷害。',after<=0?'bad':'good');
    }
  }

  const wakes=wakeTargets.map(target=>({
    targetUnitId:target.id,woke:sourceProfessionThroughWakeTarget(target)
  }));
  syncEnemyTarget();

  return {
    handled:true,skillId:prepared.skillId,functionName:prepared.functionName,
    requestedToNo:Math.trunc(n(prepared.toNo)),toNo:resolved.toNo,
    resolved,practice,targetSlots:slots,hits,wakes,
    attackSkillTier:prepared.attackSkillTier,
    sourceMagicType:-1,sourcePracticePower:practice.power,
    noOrdinaryCounter:true,noGuardian:true,noItemCrush:true,noDamageSub:true
  };
}
function sourceProfessionBattleSkillExecute(prepared,actor=null){
  if(!prepared?.ok||prepared.prepared!==true){
    return {handled:false,reason:'profession-command-not-prepared'};
  }
  const toNo=Math.trunc(n(prepared.toNo));
  if(prepared.functionName==='PROFESSION_AVOID'){
    // fixed PROFESSION_avoid() prepares BATTLE_COM_S_AVOID and battle.c routes it
    // into battle_profession_assist_fun(), whose switch has NO S_AVOID case.
    // Command-receipt proficiency still happened; turn execution has no effect.
    return {
      handled:true,noAction:true,reason:'source-avoid-assist-no-case',
      skillId:prepared.skillId,functionName:prepared.functionName,toNo,
      sourceAssistNoCase:true
    };
  }
  if(prepared.functionName==='PROFESSION_REBACK'){
    // fixed PROFESSION_reback() prepares BATTLE_COM_S_REBACK, but the pinned
    // battle.c profession command switch has no matching case. Its real effect
    // lives in BATTLE_ProfessionStatusSeq(), not in active command execution.
    return {
      handled:true,noAction:true,reason:'source-reback-no-battle-case',
      skillId:prepared.skillId,functionName:prepared.functionName,toNo,
      sourceNoBattleCase:true
    };
  }
  if(prepared.functionName==='PROFESSION_DEFLECT'){
    // fixed profession_skill.c only prepares BATTLE_COM_S_DEFLECT. The pinned battle.c
    // has no matching command-switch case, so active use reaches the turn and does nothing.
    // MP/proficiency were already handled at command receipt; do not invent an active block buff.
    return {
      handled:true,noAction:true,reason:'source-deflect-no-battle-case',
      skillId:prepared.skillId,functionName:prepared.functionName,toNo,
      sourceNoBattleCase:true
    };
  }
  if(prepared.functionName==='PROFESSION_CONVOLUTE'){
    const convoluteRow=sourceProfessionSkillTemplate(prepared.skillId);
    const convoluteName=String(convoluteRow?.name||('Skill '+prepared.skillId));
    return sourceProfessionConvoluteExecute(prepared,convoluteName);
  }

  if(prepared.functionName==='PROFESSION_TRAP'){
    const trapRow=sourceProfessionSkillTemplate(prepared.skillId);
    const trapName=String(trapRow?.name||('Skill '+prepared.skillId));
    return sourceProfessionTrapExecute(prepared,trapName);
  }
  if(prepared.functionName==='PROFESSION_SCAPEGOAT'
    ||prepared.functionName==='PROFESSION_ENRAGE'
    ||prepared.functionName==='PROFESSION_ENERGY_COLLECT'
    ||prepared.functionName==='PROFESSION_FOCUS'){
    const assistRow=sourceProfessionSkillTemplate(prepared.skillId);
    const assistName=String(assistRow?.name||('Skill '+prepared.skillId));
    return sourceProfessionWarriorAssistExecute(prepared,assistName);
  }
  if(toNo<10){
    // fixed battle.c direct-attack profession gate rejects same-side direct targets here;
    // MP/proficiency were already consumed earlier by PROFESSION_SKILL_Use().
    return {handled:true,noAction:true,reason:'same-side-target',toNo};
  }
  if(toNo>19){
    return {handled:true,noAction:true,reason:'unsupported-pseudo-target-for-direct-physical',toNo};
  }
  if(prepared.functionName==='PROFESSION_THROUGH_ATTACK'){
    const throughRow=sourceProfessionSkillTemplate(prepared.skillId);
    const throughName=String(throughRow?.name||('Skill '+prepared.skillId));
    return sourceProfessionThroughAttackExecute(prepared,throughName);
  }
  const target=sourceProfessionEnemyByBattleSlot(toNo);
  if(!target||n(target.hp)<=0){
    return {handled:true,noAction:true,reason:'target-dead-or-missing',toNo};
  }
  if(enemyUnitHidden(target)){
    // battle_profession_attack_fun() explicitly returns on BATTLE_COM_S_EARTHROUND0;
    // it does not TargetAdjust to a replacement enemy.
    return {handled:true,noAction:true,reason:'target-earthround',toNo,targetUnitId:target.id};
  }

  const row=sourceProfessionSkillTemplate(prepared.skillId);
  const name=String(row?.name||('Skill '+prepared.skillId));

  if(prepared.functionName==='PROFESSION_ENTWINE'||prepared.functionName==='PROFESSION_DRAGNET'){
    return sourceProfessionHunterControlExecute(target,prepared,name);
  }

  if(prepared.functionName==='PROFESSION_INSTIGATE'){
    return sourceProfessionInstigateExecute(target,prepared,name);
  }

  if(prepared.functionName==='PROFESSION_ATTACK_WEAK'){
    return sourceProfessionAttackWeakExecute(target,prepared,name);
  }

  if(prepared.functionName==='PROFESSION_CAVALRY'){
    return sourceProfessionCavalryExecute(target,prepared,name);
  }

  if(prepared.functionName==='PROFESSION_CHAOS'){
    return sourceProfessionChaosExecute(target,prepared,name);
  }

  let second=null,secondActual=null,chainRoll=null,chainHit=null,chainEffectiveTier=null;
  let chainExtra=false;

  if(prepared.functionName==='PROFESSION_SHIELD_ATTACK'){
    return sourceProfessionShieldAttackExecute(target,prepared,name);
  }

  if(prepared.functionName==='PROFESSION_DEAD_ATTACK'){
    return sourceProfessionDeadAttackExecute(target,prepared,name);
  }

  if(prepared.functionName==='PROFESSION_CHAIN_ATK_2'){
    // fixed source order:
    // 1) consume ABSROB/VANISH/TRAP counters (REFLEC is deliberately untouched),
    // 2) emit a zero-damage skill animation with WORKATTACKPOWER=0,
    // 3) set WORKATTACKPOWER = FIXSTR * (100 + tier*2)%,
    // 4) issue exactly one ordinary BATTLE_Attack on the same raw defNo.
    const reactionConsume=sourceProfessionChainAtk2ReactionConsume(target);
    const fixedStr=sourceProfessionChainAtk2FixedStr(state);
    const attackPower=sourceProfessionChainAtk2AttackPower(fixedStr,prepared.attackSkillTier);
    sourceProfessionSetPlayerAttackWork(attackPower);
    addLog('你施放「'+name+'」；第一段為 0 傷害動作，真正攻擊力改為 FIXSTR×'
      +(prepared.attackSkillTier*2+100)+'%。','good');

    let attack=null,actual=null;
    if(state.hp>0&&n(target.hp)>0){
      attack=sourceProfessionOrdinaryPlayerAttackResult(target,{attackPower});
      actual=applyFriendlyEnemyHit('player','你',target,attack);
    }
    return {
      handled:true,skillId:prepared.skillId,functionName:prepared.functionName,
      toNo,targetUnitId:target.id,zeroDamageLead:true,reactionConsume,
      attackSkillTier:prepared.attackSkillTier,fixedStr,attackPower,
      attack,actual,noOrdinaryCounter:true
    };
  }

  if(prepared.functionName==='PROFESSION_CHAIN_ATK'){
    // fixed battle_profession_attack_fun order: proc RNG happens BEFORE BATTLE_AttackSeq.
    chainRoll=cRand(1,100);
    chainEffectiveTier=prepared.attackSkillTier;
    if(chainEffectiveTier%10!==0)chainEffectiveTier+=1;
    chainHit=chainEffectiveTier*5+15;
    chainExtra=chainRoll<=chainHit;
  }

  const first=sourceProfessionPhysicalCalcOnlyResult(target);
  if(!first)return {handled:true,noAction:true,reason:'attack-result-missing',toNo,targetUnitId:target.id};

  // Unlike ordinary BATTLE_Attack, the profession helper has no SUITPOISON branch.
  const firstActual=applyFriendlyEnemyHit(
    'player','你',target,first,null,
    {
      suppressSuitPoison:true,
      // fixed generic profession helper zeroes react for every direct skill except CHAIN_ATK.
      suppressDamageReact:prepared.functionName!=='PROFESSION_CHAIN_ATK'
    }
  );

  if(prepared.functionName==='PROFESSION_BRUST'){
    // fixed source quirk: BRUST multiplies CHAR_WORKFIXSTR, but the immediately following
    // BATTLE_DamageCalc() reads CHAR_WORKATTACKPOWER. Do NOT "fix" it into current-hit damage.
    const sourceFixedStrMultiplier=prepared.attackSkillTier*3+100;
    addLog('你施放「'+name+'」；fixed 原 C 本次只改 FIXSTR，當下傷害仍讀 WORKATTACKPOWER。','good');
    return {
      handled:true,skillId:prepared.skillId,functionName:prepared.functionName,
      toNo,targetUnitId:target.id,first,firstActual,
      attackSkillTier:prepared.attackSkillTier,sourceFixedStrMultiplier,
      sourceBrustAttackPowerUnchanged:true,noOrdinaryCounter:true
    };
  }

  if(prepared.functionName==='PROFESSION_CHAIN_ATK'){
    addLog('你施放「'+name+'」；連擊判定 '+chainRoll+' / '+chainHit+(chainExtra?'，第二擊發動。':'，未發動第二擊。'),chainExtra?'good':'');
    if(chainExtra&&state.hp>0&&n(target.hp)>0){
      // The second hit is a direct fixed BATTLE_Attack() on the SAME raw defNo:
      // real Guardian substitution and normal on-hit/item-crush rules apply, but the
      // profession command breaks afterward and never enters the ordinary Counter loop.
      second=playerAttackResult(target);
      secondActual=applyFriendlyEnemyHit('player','你',target,second);
    }
    return {
      handled:true,skillId:prepared.skillId,functionName:prepared.functionName,
      toNo,targetUnitId:target.id,first,firstActual,second,secondActual,
      attackSkillTier:prepared.attackSkillTier,chainEffectiveTier,chainRoll,chainHit,
      extraAttack:!!second,noOrdinaryCounter:true
    };
  }
  return {handled:false,reason:'battle-function-unported',skillId:prepared.skillId};
}
function sourceProfessionBattleFailureText(reason){
  return ({
    'not-in-battle':'目前不在戰鬥中',
    'skill-slot-empty':'職業技能槽是空的',
    'skill-not-found':'找不到 fixed profession skill',
    'target-unresolved':'目前沒有可用的職業技能目標',
    'target-type-unported':'此 TARGET 類型尚未接入',
    'profession-mismatch':'目前職業不符合技能',
    'skill-level':'技能熟練度不足',
    'mp-short':'MP 不足',
    'mp-cost-invalid':'fixed MP cost 無效',
    'client-nonbattle-skill':'這招不是 client 戰鬥技能',
    'battle-function-unported':'這招的戰鬥函式尚未移植',
    'source-deflect-no-battle-case':'fixed battle.c 沒有 BATTLE_COM_S_DEFLECT 執行 case',
    'source-reback-no-battle-case':'fixed battle.c 沒有 BATTLE_COM_S_REBACK 執行 case；效果在 StatusSeq 自動觸發',
    'source-avoid-assist-no-case':'fixed battle_profession_assist_fun 沒有 BATTLE_COM_S_AVOID case；主動使用無效果',
    'shield-required':'需要裝備盾牌',
    'dead-attack-hp-too-low':'目前 HP 必須大於 10',
    'target-side-empty':'敵方已沒有可用目標',
    'unsupported-convolute-row':'回旋攻擊目前沒有有效的敵方列目標'
  })[reason]||String(reason||'未知原因');
}

function sourceProfessionEncounterRate(option){
  const m=String(option||'').match(/倍%([+-]?\d+)/);
  return m?Math.trunc(Number(m[1])):0;
}
function sourceProfessionEncounterRollPlan(baseCep,{nowMs=Date.now()}={}){
  const cep=Math.trunc(n(baseCep));
  const pCep=Math.trunc(n(professionEncounterFix));
  const nowSec=Math.trunc(n(nowMs)/1000);
  let expired=false;
  // fixed char_walk.c reads p_cep first. If expired, it clears Work values but
  // still computes this step's temp from that stale local p_cep.
  if(pCep!==0&&professionEncounterUntilSec<nowSec){
    professionEncounterFix=0;
    professionEncounterUntilSec=0;
    expired=true;
  }
  const rollCep=pCep!==0?Math.trunc(cep*(100+pCep)/100):cep;
  return {
    baseCep:cep,pCep,rollCep,nowSec,expired,
    workFixAfter:Math.trunc(n(professionEncounterFix)),
    workUntilAfter:Math.trunc(n(professionEncounterUntilSec))
  };
}
function sourceProfessionOutOfBattleSkillPlan({
  slot,target=state,nowMs=Date.now()
}={}){
  const entry=sourcePlayerProfessionSkillAt(slot,target);
  if(!entry)return {ok:false,reason:'skill-slot-empty',slot:Math.trunc(n(slot))};
  const row=sourceProfessionSkillTemplate(entry.skillId);
  if(!row)return {ok:false,reason:'skill-not-found',slot:entry.slot,skillId:entry.skillId};
  const func=String(row.func||'');
  if(func!=='PROFESSION_TRACK'&&func!=='PROFESSION_ESCAPE'){
    return {
      ok:false,reason:'out-of-battle-function-unported',
      slot:entry.slot,skillId:entry.skillId,useFlag:Math.trunc(n(row.useFlag)),functionName:func
    };
  }
  const displayLevel=sourcePlayerProfessionSkillDisplayLevel(entry);
  const use=sourceProfessionSkillUsePreflight({
    skillId:entry.skillId,rawSkillLevel:displayLevel,
    professionClass:Math.trunc(n(target?.professionClass)),
    mp:Math.trunc(n(target?.mp)),isPlayer:true,toNo:0
  });
  if(!use.ok)return Object.assign({slot:entry.slot,skillId:entry.skillId},use);

  const nowSec=Math.trunc(n(nowMs)/1000);
  const dispatchRet=(professionEncounterUntilSec>=nowSec&&professionEncounterUntilSec>0)?-1:1;
  const rate=sourceProfessionEncounterRate(row.option);
  const level10=Math.trunc(displayLevel/10);
  const magnitude=level10*rate;
  const encounterFix=func==='PROFESSION_ESCAPE'?-magnitude:magnitude;
  return {
    ok:true,slot:entry.slot,skillId:entry.skillId,functionName:func,
    useFlag:Math.trunc(n(row.useFlag)),displayLevel,level10,rate,encounterFix,
    nowSec,untilSec:nowSec+180,dispatchRet,
    protocolReturn:dispatchRet,
    protocolWouldReject:dispatchRet!==1,
    use
  };
}
function sourceProfessionOutOfBattleSkillUse({
  slot,target=state,nowMs=Date.now(),
  randModulo=sourceRandModulo,randInclusive=cRand
}={}){
  const plan=sourceProfessionOutOfBattleSkillPlan({slot,target,nowMs});
  if(!plan.ok)return plan;

  // PROFESSION_SKILL_DEC_COST_MP runs before the function callback.
  target.mp=plan.use.mpAfter;

  // TRACK / ESCAPE apply their Work values even when they set ret=-1 because
  // CHAR_ENCOUNT_NUM is still active.
  professionEncounterFix=plan.encounterFix;
  professionEncounterUntilSec=plan.untilSec;

  const proficiency=sourceProfessionSkillPostDispatchProficiency({
    target,slot:plan.slot,dispatchRet:plan.dispatchRet,targetIsPet:false,
    randModulo,randInclusive
  });
  sourceProfessionLogProficiencyResult(proficiency);

  const up=plan.encounterFix>=0;
  addLog(
    (plan.functionName==='PROFESSION_TRACK'?'追尋敵蹤':'回避戰鬥')
      +'：遇敵 CEP 修正 '+(up?'+':'')+plan.encounterFix+'%，效力 180 秒。'
      +(plan.protocolWouldReject?'（來源重複施放 ret=-1；server protocol 會視為失敗）':''),
    up?'bad':'good'
  );
  return Object.assign({},plan,{
    effectApplied:true,mpAfter:target.mp,
    workFix:professionEncounterFix,workUntilSec:professionEncounterUntilSec,
    proficiency
  });
}

function sourcePlayerRandEnemyThreshold(target=state){
  const slots=sourcePlayerItemSlots(target);
  for(let i=0;i<PLAYER_EQUIP_SLOT_COUNT;i++){
    const itemIndex=Math.trunc(Number(slots?.[i]));
    if(!Number.isFinite(itemIndex))continue;
    const template=sourcePlayerEquipTemplateForExisting(itemIndex,target);
    if(!template)continue;
    if(String(template.attachFunc||'')!=='ITEM_randEnemyEquip'||
       String(template.detachFunc||'')!=='ITEM_RerandEnemyEquip')continue;
    const key=String(Math.trunc(Number(template.itemId)));
    if(Object.prototype.hasOwnProperty.call(SOURCE_PLAYER_RANDENEMY_BY_ITEM,key)){
      return Math.trunc(Number(SOURCE_PLAYER_RANDENEMY_BY_ITEM[key]));
    }
  }
  return 0;
}
function sourcePlayerNoEnemyLevel(target=state){
  const slots=sourcePlayerItemSlots(target);
  for(let i=0;i<PLAYER_EQUIP_SLOT_COUNT;i++){
    const itemIndex=Math.trunc(Number(slots?.[i]));
    if(!Number.isFinite(itemIndex))continue;
    const template=sourcePlayerEquipTemplateForExisting(itemIndex,target);
    if(!template)continue;
    if(String(template.attachFunc||'')!=='ITEM_equipNoenemy'||
       String(template.detachFunc||'')!=='ITEM_remNoenemy')continue;
    const key=String(Math.trunc(Number(template.itemId)));
    if(Object.prototype.hasOwnProperty.call(SOURCE_PLAYER_NOENEMY_LEVEL_BY_ITEM,key)){
      return Math.trunc(Number(SOURCE_PLAYER_NOENEMY_LEVEL_BY_ITEM[key]));
    }
  }
  return 0;
}
function sourcePlayerNoEnemyFloorActive(level,floorId){
  const noen=Math.trunc(n(level)),floor=Math.trunc(n(floorId));
  if(noen>=200)return true;
  if(noen>=120)return floor===100||floor===200||floor===300||floor===400||floor===500;
  if(noen>=80)return floor===100||floor===200||floor===300||floor===400;
  if(noen>=40)return floor===100||floor===200;
  return false;
}
function sourcePlayerNoEnemyActive(target=state,map=currentMap()){
  const noen=sourcePlayerNoEnemyLevel(target);
  const floor=Math.trunc(n(map?.floorId??map?.id));
  return sourcePlayerNoEnemyFloorActive(noen,floor);
}
function sourcePlayerPickAllPetEnabled(target=state){
  const slots=sourcePlayerItemSlots(target);
  for(let i=0;i<PLAYER_EQUIP_SLOT_COUNT;i++){
    const itemIndex=Math.trunc(Number(slots?.[i]));
    if(!Number.isFinite(itemIndex))continue;
    const template=sourcePlayerEquipTemplateForExisting(itemIndex,target);
    if(!template)continue;
    if(String(template.attachFunc||'')==='ITEM_WearEquip'&&
       String(template.detachFunc||'')==='ITEM_ReWearEquip')return true;
  }
  return false;
}
function sourcePlayerCaptureLevelAllowed(enemyUnit,player=state){
  if(!enemyUnit||!player)return false;
  if(sourcePlayerPickAllPetEnabled(player))return true;
  return Math.trunc(n(player.level))+5>=Math.trunc(n(enemyUnit.level));
}
function sourcePlayerEquipRequirements(template,target=state){
  if(!template||!target)return {ok:false,reason:'template'};
  const trans=Math.max(0,Math.trunc(n(target.transmigration)));
  const level=Math.max(1,Math.trunc(n(target.level)||1));
  const itemLevel=Math.trunc(n(template.level));
  if(trans<=0&&itemLevel>level)return {ok:false,reason:'level'};
  const p=target.playerStats||{};
  // fixed CHAR_STR/CHAR_DEX are stored as displayed creation points * 100.
  if(Math.trunc(n(p.str)*100)<Math.trunc(n(template.needStr)))return {ok:false,reason:'str'};
  if(Math.trunc(n(p.dex)*100)<Math.trunc(n(template.needDex)))return {ok:false,reason:'dex'};
  if(trans<Math.trunc(n(template.needTrans)))return {ok:false,reason:'transmigration'};
  if(Math.trunc(n(template.needProfession))!==0)return {ok:false,reason:'profession-unported'};
  if(!sourcePlayerEquipCallbackSupported(template))return {ok:false,reason:'callback-unported'};
  if(SOURCE_PLAYER_SPECIAL_EQUIP_IDS.has(Math.trunc(Number(template.itemId))))return {ok:false,reason:'special-equip-unported'};
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
  if(!sourcePlayerEquipSlotAllowsTemplate(toindex,template,slots,target))return {ok:false,reason:'wrong-equip-place'};
  if(sourcePlayerDecorationTypeConflict(toindex,template,slots,target)){
    const occupied=slots[toindex]!=null&&Number.isFinite(Number(slots[toindex]));
    return {ok:false,reason:occupied?'same-type-exchange':'same-type'};
  }
  const toid=slots[toindex]==null?null:Math.trunc(Number(slots[toindex]));
  // Work values are transient and stateful; reconstruct the pre-move login state before
  // mutating slots so subsequent detach/attach events see the same history as fixed C.
  sourcePlayerEquipResistWork(target);
  slots[toindex]=fromid;
  slots[fromindex]=Number.isFinite(toid)?toid:null;
  if(Number.isFinite(toid))sourcePlayerEquipResistDetachEvent(toid,target);
  sourcePlayerEquipResistAttachEvent(fromid,target);
  return {ok:true,kind:'item-to-equip',fromindex,toindex,itemIndex:fromid,replacedItemIndex:Number.isFinite(toid)?toid:null};
}
function sourcePlayerMoveEquipToBackpack(fromindex,toindex,target=state){
  const slots=sourcePlayerItemSlots(target);
  if(slots[fromindex]==null)return {ok:false,reason:'missing-source'};
  const fromid=Math.trunc(Number(slots[fromindex]));
  if(!Number.isFinite(fromid))return {ok:false,reason:'missing-source'};
  const toid=slots[toindex]==null?null:Math.trunc(Number(slots[toindex]));
  if(!Number.isFinite(toid)){
    sourcePlayerEquipResistWork(target);
    slots[toindex]=fromid;slots[fromindex]=null;
    sourcePlayerEquipResistDetachEvent(fromid,target);
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
  // battle.c caches the source itemindex before CHAR_ItemUse(), then calls
  // ITEM_getEquipPlace(charaindex,itemindex) only after the move has completed.
  const sourceItemIndex=Math.trunc(Number(slots[from]));
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
  if(moved?.ok&&(fromEquip||toEquip)){
    // fixed CHAR_moveEquipItem performs compliance BEFORE battle.c calls
    // BATTLE_ProfessionStatus_init for an equipped weapon. Preserve that order:
    // current FIX/WORK attack sees the OLD Weapon Focus Work once, then the new
    // weapon refresh only affects the next compliance.
    playerComplianceParameter(target);
    if(target===state&&enemy){
      sourceProfessionPlayerStatPreCommandCompliance(target);
      sourceProfessionPlayerFixedAttackCompliance(target);
      battlePlayerAttackWork=null;
      const sourceTemplate=sourcePlayerEquipTemplateForExisting(sourceItemIndex,target);
      moved.postMoveEquipPlace=sourceTemplate
        ?sourcePlayerEquipPlace(sourceTemplate,sourcePlayerItemSlots(target),target):-1;
      if(moved.postMoveEquipPlace===PLAYER_ARM_SLOT){
        moved.avoidRefresh=sourceProfessionPlayerAvoidRefresh(target,'weapon-change');
        moved.weaponFocusRefresh=sourceProfessionPlayerWeaponFocusRefresh(target,'weapon-change');
      }
    }
  }
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
function sourceEnemyWeaponCompliance(base,weaponId,itemIndex=null){
  const template=sourceEnemyWeaponTemplate(weaponId);
  const initial={
    attack:Math.trunc(n(base?.attack)),defense:Math.trunc(n(base?.defense)),quick:Math.trunc(n(base?.quick)),
    maxHp:Math.trunc(n(base?.maxHp)),maxMp:Math.trunc(n(base?.maxMp)),
    weaponId:null,weaponName:null,weaponType:0,weaponCritical:0,throwWeapon:false,attackNumMin:0,attackNumMax:0
  };
  if(!template)return initial;
  const existing=sourceItemRuntimeSlot(itemIndex);
  const fixed=pair=>Array.isArray(pair)&&Number.isFinite(Number(pair[0]))?Math.trunc(Number(pair[0])):0;
  const rolled=(field,pair)=>{
    const value=sourceItemRuntimeDataInt(existing,field);
    return value==null?fixed(pair):value;
  };
  const attack=Math.max(0,initial.attack+rolled('ITEM_MODIFYATTACK',template.modifyAttack));
  const defense=Math.max(-100,initial.defense+rolled('ITEM_MODIFYDEFENCE',template.modifyDefense));
  const quick=Math.max(-100,initial.quick+rolled('ITEM_MODIFYQUICK',template.modifyQuick));
  const maxHp=Math.max(0,initial.maxHp+rolled('ITEM_MODIFYHP',template.modifyHp));
  const maxMp=clamp(initial.maxMp+rolled('ITEM_MODIFYMP',template.modifyMp),0,1000);
  const rolledType=sourceItemRuntimeDataInt(existing,'ITEM_TYPE');
  const type=rolledType==null?Math.trunc(n(template.type)):rolledType;
  const rolledCritical=sourceItemRuntimeDataInt(existing,'ITEM_CRITICAL');
  const attackNumMin=sourceItemRuntimeDataInt(existing,'ITEM_ATTACKNUM_MIN');
  const attackNumMax=sourceItemRuntimeDataInt(existing,'ITEM_ATTACKNUM_MAX');
  return {
    attack,defense,quick,maxHp,maxMp,
    weaponId:Math.trunc(Number(template.itemId)),weaponName:template.name||null,weaponType:type,
    weaponCritical:rolledCritical==null?fixed(template.critical):rolledCritical,
    throwWeapon:sourceEnemyWeaponIsThrowType(type),
    attackNumMin:attackNumMin==null?Math.trunc(n(template.attackNum?.[0])):attackNumMin,
    attackNumMax:attackNumMax==null?Math.trunc(n(template.attackNum?.[1])):attackNumMax
  };
}
function normalizeItemRuntime(rt){
  const out=freshItemRuntime();
  if(!rt||typeof rt!=='object')return out;
  out.itemnum=25000;
  out.sindex=clamp(Math.trunc(n(rt.sindex)||1),1,out.itemnum-1);
  const slots=rt.slots&&typeof rt.slots==='object'?rt.slots:{};
  const dataCount=Math.trunc(Number(itemMakeDb?.itemDataIntCount));
  const muIndex=sourceItemMakeDataIndex('ITEM_MAGICUSEMP');
  const leakIndex=sourceItemMakeDataIndex('ITEM_LEAKLEVEL');
  for(const [k,v] of Object.entries(slots)){
    const idx=Math.trunc(Number(k));
    if(!Number.isFinite(idx)||idx<=0||idx>=out.itemnum||!v||v.use!==true)continue;
    const itemId=Number.isFinite(Number(v.itemId))?Math.trunc(Number(v.itemId)):null;
    // 原 ITEM_makeItem() 對 ITEM_tbl 不存在的 ID 會失敗；V0.69 曾無法驗證模板，V0.70 起不再保留 phantom existing item。
    if(itemId!=null&&itemMagicDb?.byItemId&&!sourceItemTemplateExists(itemId))continue;
    const sourceMu=sourceItemTemplateMagicUseMp(itemId);
    const sourceData=(
      dataCount===66&&Array.isArray(v.sourceData)&&v.sourceData.length===dataCount&&
      v.sourceData.every(value=>Number.isFinite(Number(value)))
    )?v.sourceData.map(value=>Math.trunc(Number(value))):null;
    const dataMu=sourceData&&muIndex>=0?sourceData[muIndex]:null;
    const dataLeak=sourceData&&leakIndex>=0?sourceData[leakIndex]:null;
    out.slots[String(idx)]={
      use:true,
      itemId,
      magicUseMp:v.magicUseMp==null?(dataMu==null?sourceMu:dataMu):(Number.isFinite(Number(v.magicUseMp))?Math.trunc(Number(v.magicUseMp)):sourceMu),
      owner:typeof v.owner==='string'?v.owner:null,
      source:typeof v.source==='string'?v.source:null,
      enemySlot:Number.isFinite(Number(v.enemySlot))?Math.trunc(Number(v.enemySlot)):null,
      sourceMakeRngCalls:Number.isFinite(Number(v.sourceMakeRngCalls))?Math.trunc(Number(v.sourceMakeRngCalls)):null,
      sourceMakeMaterialized:sourceData!==null&&v.sourceMakeMaterialized!==false,
      sourceData,
      leakLevel:Number.isFinite(Number(v.leakLevel))?Math.trunc(Number(v.leakLevel)):(dataLeak==null?null:dataLeak)
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
function sourceItemRuntimeAlloc(itemId=null,magicUseMp=null,meta={}){
  if(!state)return -1;
  const normalizedItemId=Number.isFinite(Number(itemId))?Math.trunc(Number(itemId)):null;
  if(normalizedItemId==null||!sourceItemTemplateExists(normalizedItemId))return -1;
  // V1.72 v2 runtime is an exact parse of the pinned itemset6 blob. If a v2 row is missing or
  // malformed, fail before RNG instead of inventing base/randomwidth values.
  if(itemMakeDb?.byItemId&&!sourceItemMakeTemplateData(normalizedItemId))return -1;

  const sourceMu=sourceItemTemplateMagicUseMp(normalizedItemId);
  // ITEM_makeItemAndRegist order is make first, existing-slot allocation second. Therefore
  // even an exhausted ITEM_item[] array has already consumed all 66 make-item RNG calls.
  const made=sourceMakeItemData(normalizedItemId);
  const sourceMakeRngCalls=made.calls;
  const makeMuIndex=sourceItemMakeDataIndex('ITEM_MAGICUSEMP');
  const madeMu=made.materialized&&makeMuIndex>=0?made.data[makeMuIndex]:null;
  const resolvedMu=magicUseMp==null?(madeMu==null?sourceMu:madeMu):(Number.isFinite(Number(magicUseMp))?Math.trunc(Number(magicUseMp)):sourceMu);
  const leakIndex=sourceItemMakeDataIndex('ITEM_LEAKLEVEL');
  const madeLeak=made.materialized&&leakIndex>=0?made.data[leakIndex]:1;

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
      sourceMakeMaterialized:made.materialized,
      sourceData:made.materialized?made.data:null,
      leakLevel:madeLeak
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

const SOURCE_FIELD2_SKILL_IDS=Object.freeze([200,201,540,572]);
const SOURCE_FIELD2_FUNCTION_KEYS=Object.freeze([
  'init','preOver','postOver','watch','use','attach','detach','drop','pickup','relife'
]);
const SOURCE_INSLAY_ADD_FIELDS=Object.freeze([
  'ITEM_MODIFYATTACK','ITEM_MODIFYDEFENCE','ITEM_MODIFYQUICK','ITEM_MODIFYHP',
  'ITEM_MODIFYMP','ITEM_MODIFYLUCK','ITEM_OTHERDAMAGE','ITEM_OTHERDEFC'
]);
function sourceField2PetSkills(pet=activePet()){
  if(!pet||!Array.isArray(pet.petSkills))return [];
  const seen=new Set(),out=[];
  for(const raw of pet.petSkills){
    const id=Math.trunc(Number(raw));
    if(!SOURCE_FIELD2_SKILL_IDS.includes(id)||seen.has(id))continue;
    const meta=petSkillDb?.byId?.[String(id)]||null;
    if(!meta||Number(meta.field)!==2||Number(meta.illegal)!==0)continue;
    seen.add(id);out.push({id,meta});
  }
  return out;
}
function sourceField2PruneSelection(){
  const slots=sourcePlayerItemSlots(state);
  for(const slotIndex of [...sourceField2SelectedSlots]){
    const s=Math.trunc(Number(slotIndex));
    if(s<PLAYER_BACKPACK_START||s>=PLAYER_ITEM_SLOT_COUNT){
      sourceField2SelectedSlots.delete(slotIndex);continue;
    }
    const itemIndex=Math.trunc(Number(slots[s]));
    const existing=sourceRuntimeSlotFromTarget(state,itemIndex);
    if(!existing||existing.owner!=='player')sourceField2SelectedSlots.delete(slotIndex);
  }
}
function sourceField2SelectedEntries(){
  sourceField2PruneSelection();
  const slots=sourcePlayerItemSlots(state),out=[];
  for(const slotIndex of sourceField2SelectedSlots){
    const itemIndex=Math.trunc(Number(slots[slotIndex]));
    const existing=sourceRuntimeSlotFromTarget(state,itemIndex);
    if(existing?.owner==='player')out.push({slotIndex,itemIndex,existing});
  }
  return out;
}
function sourceConsumeTrackedExistingItem(itemIndex){
  const existing=sourceItemRuntimeSlot(itemIndex);
  if(!existing||existing.owner!=='player')return false;
  const itemId=Math.trunc(Number(existing.itemId));
  const pile=sourceItemRuntimeResolvedDataInt(existing,'ITEM_USEPILENUMS');
  // fixed _CHAR_DelItem(..., num=1): insufficient pile fails without mutation.
  if(pile==null||pile<1)return false;

  // Client selection is for this one submitted use. Remove the selected backpack slot
  // even when the underlying existing item remains because the pile still has units.
  const slots=sourcePlayerItemSlots(state);
  for(const selectedSlot of [...sourceField2SelectedSlots]){
    if(Number(slots[selectedSlot])===Number(itemIndex))sourceField2SelectedSlots.delete(selectedSlot);
  }

  let freed=false;
  if(pile>1){
    if(!sourceItemRuntimeSetDataInt(existing,'ITEM_USEPILENUMS',pile-1))return false;
  }else{
    if(!sourceItemRuntimeFree(itemIndex))return false;
    freed=true;
  }

  // state.inventory counts source-backed existing entries, not ITEM_USEPILENUMS units.
  // Keep the aggregate entry while a decremented pile still owns the same existing slot.
  if(freed&&Number.isFinite(itemId)){
    const key=String(itemId),before=Math.max(0,Math.trunc(n(state.inventory?.[key])));
    if(before>1)state.inventory[key]=before-1;
    else if(before===1)delete state.inventory[key];
  }
  sourceField2PruneSelection();
  return true;
}
function sourceField2FixTargetType(existing){
  const type=sourceItemRuntimeResolvedDataInt(existing,'ITEM_TYPE');
  if(type==null)return false;
  return (type>=0&&type<=15)||type===17||type===18||type===19;
}
function sourceUsePetFixitem(selected){
  if(!Array.isArray(selected)||selected.length>2)return {ok:false,reason:'max-two'};
  let target=null;
  for(const entry of selected){
    const type=sourceItemRuntimeResolvedDataInt(entry.existing,'ITEM_TYPE');
    if(type===20)return {ok:false,reason:'dish'};
    if(sourceField2FixTargetType(entry.existing)){
      if(target)return {ok:false,reason:'multiple-equipment'};
      target=entry;
    }
  }
  if(!target)return {ok:false,reason:'no-equipment'};
  const material=selected.find(x=>x.itemIndex!==target.itemIndex)||null;
  if(!material)return {ok:false,reason:'no-material'};

  const materialName=sourceItemField2Char(material.existing,'ingName0');
  let matched=false;
  for(let i=0;i<5;i++){
    const need=sourceItemField2Char(target.existing,'ingName'+i);
    if(!materialName||!need)continue;
    if(need===materialName){matched=true;break}
  }
  const fixAll=sourceItemField2Char(material.existing,'argument')==='FIXITEMALL';
  if(!matched&&!fixAll)return {ok:false,reason:'material-mismatch'};

  const crush=sourceItemRuntimeResolvedDataInt(target.existing,'ITEM_DAMAGECRUSHE');
  const maxCrush=sourceItemRuntimeResolvedDataInt(target.existing,'ITEM_MAXDAMAGECRUSHE');
  if(crush==null||maxCrush==null)return {ok:false,reason:'missing-durability-source'};
  if(crush>=maxCrush*0.80)return {ok:false,reason:'not-damaged-enough',crush,maxCrush};
  if(maxCrush<500)return {ok:false,reason:'cannot-repair',crush,maxCrush};
  if(crush<=0)return {ok:false,reason:'no-durability',crush,maxCrush};

  const repairedMax=Math.trunc(maxCrush*0.85);
  if(!sourceItemRuntimeSetDataInt(target.existing,'ITEM_DAMAGECRUSHE',repairedMax)
    ||!sourceItemRuntimeSetDataInt(target.existing,'ITEM_MAXDAMAGECRUSHE',repairedMax)
    ||!sourceItemRuntimeSetDataInt(target.existing,'ITEM_CRUSHLEVEL',0)){
    return {ok:false,reason:'mutable-source-missing'};
  }
  const secret=sourceItemField2Char(target.existing,'secretName');
  if(secret.includes('('))sourceItemField2SetChar(target.existing,'secretName',secret.split('(')[0]);
  const consumed=sourceConsumeTrackedExistingItem(material.itemIndex);
  playerComplianceParameter(state);
  return {
    ok:true,skillId:540,targetItemIndex:target.itemIndex,materialItemIndex:material.itemIndex,
    oldCrush:crush,oldMaxCrush:maxCrush,newCrush:repairedMax,newMaxCrush:repairedMax,
    fixAll,consumed
  };
}
function sourceApplyPetInslayMaterial(target,material){
  const code=sourceItemField2Char(material.existing,'typeCode');
  if(!code||code==='NULL')return {ok:false,reason:'material-typecode'};

  const raw=sourceItemField2Char(target.existing,'inlayCode');
  const parts=['NULL','NULL','NULL'];
  if(raw){
    const src=raw.split('|');
    for(let i=0;i<3&&i<src.length;i++)if(src[i]!=='')parts[i]=src[i];
  }
  const open=parts.findIndex(x=>x==='NULL');
  if(open<0)return {ok:false,reason:'full'};
  parts[open]=code;
  sourceItemField2SetChar(target.existing,'inlayCode',parts.join('|'));

  const work={};
  for(const field of SOURCE_INSLAY_ADD_FIELDS){
    const a=sourceItemRuntimeResolvedDataInt(target.existing,field);
    const b=sourceItemRuntimeResolvedDataInt(material.existing,field);
    if(a==null||b==null)return {ok:false,reason:'missing-int-source',field,mutated:true};
    const value=a+b;
    if(!sourceItemRuntimeSetDataInt(target.existing,field,value))return {ok:false,reason:'mutable-source-missing',field,mutated:true};
    work[field]=value;
  }

  const materialMagic=sourceItemRuntimeResolvedDataInt(material.existing,'ITEM_MAGICID');
  if(materialMagic!=null&&materialMagic>0){
    const materialMp=sourceItemRuntimeResolvedDataInt(material.existing,'ITEM_MAGICUSEMP');
    if(!sourceItemRuntimeSetDataInt(target.existing,'ITEM_MAGICID',materialMagic)
      ||materialMp==null
      ||!sourceItemRuntimeSetDataInt(target.existing,'ITEM_MAGICUSEMP',materialMp)){
      return {ok:false,reason:'magic-source-missing',mutated:true};
    }
  }

  // fixed PETSKILL_ITEM_inslay clears every ITEM function and then copies the material's
  // corresponding string, so empty source functions intentionally erase target callbacks.
  for(const key of SOURCE_FIELD2_FUNCTION_KEYS){
    sourceItemField2SetFunction(target.existing,key,sourceItemField2Function(material.existing,key));
  }
  sourceItemField2SetChar(target.existing,'argument',sourceItemField2Char(material.existing,'argument'));

  // Source also rebuilds ITEM_EFFECTSTRING using legacy localized magic-name text. That field
  // is display-only in this web; gameplay state above is exact, so do not invent a magic label.
  target.existing.field2EffectStringNeedsSourceMagicName=true;
  return {ok:true,slot:open,code,work,materialMagic:materialMagic??0,mutated:true};
}
function sourceUsePetInslay(selected){
  if(!Array.isArray(selected)||selected.length>4)return {ok:false,reason:'max-four'};
  let target=null;
  for(const entry of selected){
    const code=sourceItemField2Char(entry.existing,'typeCode');
    if(!code||code==='NULL')return {ok:false,reason:'unsuitable-item',itemIndex:entry.itemIndex};
    if(code.includes('INSLAY')){
      if(target)return {ok:false,reason:'multiple-equipment'};
      target=entry;
    }
  }
  if(!target)return {ok:false,reason:'no-equipment'};

  const applied=[];
  for(const material of selected){
    if(material.itemIndex===target.itemIndex)continue;
    const r=sourceApplyPetInslayMaterial(target,material);
    if(!r.ok)return {
      ok:false,reason:r.reason,partial:applied.length>0,applied,
      targetItemIndex:target.itemIndex,failedMaterialItemIndex:material.itemIndex,mutated:!!r.mutated||applied.length>0
    };
    const consumed=sourceConsumeTrackedExistingItem(material.itemIndex);
    applied.push({materialItemIndex:material.itemIndex,consumed,...r});
  }
  playerComplianceParameter(state);
  return {ok:true,skillId:572,targetItemIndex:target.itemIndex,applied,mutated:applied.length>0};
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
    id:uid(),name:template.name,animationGroupId:template.animationGroupId,tempNo:Number(tempNo),petId:Number(tempNo),
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
    animationGroupId:template.animationGroupId??null,tempNo:template.tempNo??null,petId:template.tempNo??null,
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
function freshProfessionSkills(){
  return Array(PROFESSION_SKILL_SLOT_COUNT).fill(null);
}
function normalizeProfessionSkills(raw){
  const out=freshProfessionSkills();
  if(!Array.isArray(raw))return out;
  for(let i=0;i<PROFESSION_SKILL_SLOT_COUNT&&i<raw.length;i++){
    const entry=raw[i];
    if(!entry||typeof entry!=='object')continue;
    const skillId=Number(entry.skillId),rawLevel=Number(entry.rawLevel);
    if(!Number.isFinite(skillId)||!Number.isFinite(rawLevel))continue;
    out[i]={skillId:Math.trunc(skillId),rawLevel:Math.trunc(rawLevel)};
  }
  return out;
}
function freshState(){
  return {
    schemaVersion:30,
    level:1,exp:0,expNext:2,hp:0,maxHp:0,mp:100,maxMp:100,
    playerPigUntilMs:0,playerPigImage:100388,
    magicResist:[0,0,0,0],magicResistExp:[0,0,0,0],
    attack:0,defense:0,dex:0,charm:60,luck:0,skillPoints:0,duelPoint:100,
    transmigration:1,
    // fixed _CHAR_PROFESSION: persistent profession fields + CHAR_HaveSkill[26].
    professionClass:PROFESSION_CLASS_NONE,professionLevel:0,professionSkillPoint:0,
    professionSkills:freshProfessionSkills(),
    hometown:null,lastTalkElder:null,homeFloor:null,homeX:null,homeY:null,hometownSavePointMask:0,
    playerHometownConfigured:false,hometownLegacyUnknown:false,starterPetGranted:false,
    creationPlayerStats:null,playerCreationStatsConfigured:false,playerCreationStatsLegacyUnknown:false,
    playerStats:{vital:0,str:0,tgh:0,dex:0},
    elements:null,playerElementsConfigured:false,
    gold:30000,mergeItemCount:0,battles:0,wins:0,mapId:null,encounterId:null,encounterCep:0,virtualWalkSteps:0,lastEncounterRoll:null,auto:true,autoCapture:true,
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
    s.petBox=raw.petBox.filter(Boolean).map(p=>{
      const copy=Object.assign({},p,{id:p.id||uid()});
      // V1.77 migration: every source-created Pet tempNo came from the same E_T_TEMPNO
      // that fixed C stores in CHAR_PETID. Only backfill when tempNo itself is present.
      if(copy.petId==null&&copy.tempNo!=null&&Number.isFinite(Number(copy.tempNo))){
        copy.petId=Math.trunc(Number(copy.tempNo));
      }
      return copy;
    });
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
  // V2.21 mirrors persistent CHAR profession fields; original skillN slot indices are retained.
  s.professionClass=Number.isFinite(Number(raw.professionClass))?Math.trunc(Number(raw.professionClass)):PROFESSION_CLASS_NONE;
  s.professionLevel=Number.isFinite(Number(raw.professionLevel))?Math.trunc(Number(raw.professionLevel)):0;
  s.professionSkillPoint=Number.isFinite(Number(raw.professionSkillPoint))?Math.trunc(Number(raw.professionSkillPoint)):0;
  s.professionSkills=normalizeProfessionSkills(raw.professionSkills);
  // playerEquipCompliance mirrors transient CHAR_WORK* values, not persistent CHAR data.
  // A real login reconstructs these Work fields from scratch before ITEM_equipEffect();
  // never restore a serialized derived snapshot across reload.
  s.playerEquipCompliance=null;
  // ITEM_MagicResist writes transient CHAR_WORK values. Login reconstructs them by replaying
  // equipped ATTACHFUNC in slot order, so stale in-process detach bugs must not persist in save.
  s.playerEquipResistWork=null;
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
  s.schemaVersion=30;
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

  // fixed CHAR_initcharWorkInt() rebuilds every Work value from raw CHAR data first.
  // ITEM_equipEffect() then accumulates all 9 equip slots from the generated existing-item data[].
  const equip=sourcePlayerEquipmentModifiers(target);
  const baseAttack=Math.trunc(str+tgh*.1+vital*.1+dex*.05);
  const baseDefense=Math.trunc(tgh+str*.1+vital*.1+dex*.05);
  const baseQuick=Math.trunc(dex);
  const baseMaxHp=Math.max(0,Math.trunc(vital*4+str+tgh+dex));

  let fixedAttack=Math.max(0,baseAttack+Math.trunc(n(equip.attack)));
  let fixedTough=Math.max(-100,baseDefense+Math.trunc(n(equip.defense)));
  let fixedDex=Math.max(-100,baseQuick+Math.trunc(n(equip.quick)));
  const preSuitFixedTough=fixedTough;
  const normalMaxHp=clamp(baseMaxHp+Math.trunc(n(equip.hp)),0,10000000);
  const suit=sourcePlayerSuitWork(target);
  const suitApplied=sourcePlayerApplySuitCompliance(
    {fixedAttack,fixedTough,fixedDex,maxHp:normalMaxHp},suit
  );
  fixedAttack=suitApplied.fixedAttack;
  fixedTough=suitApplied.fixedTough;
  fixedDex=suitApplied.fixedDex;
  const suitMaxHp=suitApplied.maxHp;
  const fixedLuck=clamp(Math.trunc(n(target.luck))+Math.trunc(n(equip.luck)),1,5);
  const fixedCharm=clamp(Math.trunc(n(target.charm))+Math.trunc(n(equip.charm)),0,100);
  // Fixed source quirk: CHAR_initcharWorkInt() resets the other ITEM_equipEffect Work fields,
  // but never resets CHAR_WORKFIXAVOID. ITEM_equipEffect therefore re-adds the equipped avoid
  // total on every compliance call. Preserve that in-process accumulation bug; normalizeState()
  // clears this transient Work value across reload, like a fresh server login.
  const previousAvoid=Math.trunc(n(target.playerEquipCompliance?.fixedAvoid));
  const fixedAvoid=clamp(previousAvoid+Math.trunc(n(equip.avoid)),0,10000000);
  const statusResist={};
  for(const key of ['poison','paralysis','sleep','stone','drunk','confusion']){
    statusResist[key]=clamp(Math.trunc(n(equip.statusResist?.[key])),-100,100);
  }
  const criticalWork=clamp(Math.trunc(n(equip.criticalWork)),-100,100);
  const otherDamage=clamp(Math.trunc(n(equip.otherDamage)),-100,100);
  const otherDefc=clamp(Math.trunc(n(equip.otherDefc)),-100,100);
  const arrange=clamp(Math.trunc(n(equip.arrange)),0,1000);
  // fixed type=1 entries are raw accumulation: no max clamp despite the table's max metadata.
  const sequence=Math.trunc(n(equip.sequence));
  const attachPile=Math.trunc(n(equip.attachPile));
  const hitRight=Math.trunc(n(equip.hitRight));
  const neglectGuard=Math.trunc(n(equip.neglectGuard));

  // CHAR_initcharWorkInt() first turns every positive base element into a negative opposite,
  // then ITEM_equipEffect applies each attribute accumulator to self and subtracts it from all others.
  const rawElements=target.elements||{};
  const elementValues=[
    Math.trunc(n(rawElements.earth)),Math.trunc(n(rawElements.water)),
    Math.trunc(n(rawElements.fire)),Math.trunc(n(rawElements.wind))
  ];
  for(let i=0;i<4;i++){
    const attr=elementValues[i];
    if(attr>0)elementValues[(i+2)%4]=-attr;
  }
  const attribAccum=Array.isArray(equip.attribAccum)?equip.attribAccum.map(v=>Math.trunc(n(v))):[0,0,0,0];
  for(let i=0;i<4;i++)elementValues[i]+=attribAccum[i]||0;
  for(let i=0;i<4;i++)for(let j=0;j<4;j++)if(i!==j)elementValues[j]-=attribAccum[i]||0;
  for(let i=0;i<4;i++)if(elementValues[i]>100)elementValues[i]=100;
  const elementsRaw={earth:elementValues[0],water:elementValues[1],fire:elementValues[2],wind:elementValues[3]};

  target.attack=fixedAttack;
  target.defense=fixedTough;
  target.dex=fixedDex;
  target.maxHp=clamp(suitMaxHp,0,10000000);
  // fixed player creation baseline CHAR_MAXMP=100; _FIX_MAXCHARMP applies equip MP and clamps 0..1000.
  target.maxMp=clamp(100+Math.trunc(n(equip.mp)),0,1000);
  target.hp=Math.min(Math.max(0,n(target.hp)),target.maxHp);
  target.mp=Math.min(Math.max(0,n(target.mp)),target.maxMp);
  Object.assign(equip,{
    fixedAttack,fixedTough,fixedDex,fixedLuck,fixedCharm,fixedAvoid,statusResist,criticalWork,
    otherDamage,otherDefc,arrange,sequence,attachPile,hitRight,neglectGuard,elementsRaw,
    preSuitFixedTough,suit,suitApplied
  });
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
  // V1.72 直接讀 existing item 保存的生成後 data[]，因此即使 itemset6 是 min!=max，
  // compliance 也使用同一輪 ITEM_makeItem 66 顆 RNG 得到的實際 modifier。
  const equipped=sourceEnemyWeaponCompliance({attack,defense,quick,maxHp:hp,maxMp:0},equippedWeaponId,weaponItemIndex);
  attack=equipped.attack;defense=equipped.defense;quick=equipped.quick;hp=Math.max(1,equipped.maxHp);

  return {
    id:unitId,
    name:raw?.name||fallbackEntry?.species?.clientLabel||base.serverName||('Enemy '+(raw?.enemyId??'')),
    enemyId:resolvedEnemyId,sourcePetFlg:sourceEnemyPetFlg(resolvedEnemyId),sourceFoxTurn:null,sourceFoxImage:false,
    ai:aiRow,
    statusResist:resolvedEnemyId!=null?(enemyAiDb?.byEnemyId?.[String(resolvedEnemyId)]?.z?.slice?.(0,6)||[0,0,0,0,0,0]):[0,0,0,0,0,0],
    tempNo:Number(raw?.tempNo??base.tempNo??0)||null,
    // fixed ENEMY_createEnemyIndex: CHAR_PETID is copied directly from E_T_TEMPNO.
    petId:Number(raw?.tempNo??base.tempNo??0)||null,
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
  // fixed BATTLE_NewEntry: BATTLE_BadStatusAllClr has already cleared MYSKILLSTRPOWER,
  // then BATTLE_ProfessionStatus_init snapshots Weapon Focus for the current arm.
  sourceProfessionPlayerAvoidRefresh(state,'battle-entry');
  sourceProfessionPlayerWeaponFocusRefresh(state,'battle-entry');
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
function sourceCRandMacroValue(min,max){
  min=Number(min);max=Number(max);
  if(!Number.isFinite(min)||!Number.isFinite(max))return 0;
  // Exact fixed util.h macro value before assignment to an int lvalue:
  // (x-1)+1+(int)((double)(y-(x-1))*rand()/(RAND_MAX+1.0))
  // The inner product truncates toward zero first. If x is fractional, the macro
  // expression itself remains fractional until its caller assigns/compound-assigns it.
  const inner=Math.trunc((max-(min-1))*Math.random());
  return (min-1)+1+inner;
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
function sourceBattlePropertyCounterElements(otherElements){
  const d=sourceBattleElements(otherElements);
  if(!d)return null;
  // fixed PET_PetskillPropertyEvent():
  // EARTH(0)->WIND(3), WATER(1)->EARTH(0), FIRE(2)->WATER(1), WIND(3)->FIRE(2).
  // The callback writes T_Pow[4]=100-sum directly; unlike BATTLE_GetAttr it does not clamp this none value.
  return {
    earth:d.water,
    water:d.fire,
    fire:d.wind,
    wind:d.earth,
    none:100-d.earth-d.water-d.fire-d.wind
  };
}
function sourceBattlePropertyActive(desc){
  const key=battleStatusKey(desc);
  return !!(key&&battlePropertyKeys.has(key));
}
function sourceClearPetBattleProperty(pet){
  if(!pet)return false;
  return battlePropertyKeys.delete('pet:'+String(pet.id));
}
function sourceClearPetVary(pet){
  if(!pet)return false;
  return battlePetVaryStates.delete(pet.id);
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
  const baseA=sourceBattleElements(attacker?.elements),baseD=sourceBattleElements(defender?.elements);
  if(!baseA||!baseD)return damage;

  // fixed BATTLE_AttrAdjust reads both source vectors first, then invokes attacker and defender
  // CHAR_BATTLEPROPERTY callbacks independently. PET_PetskillPropertyEvent re-reads the opponent's
  // current attributes, so two active callbacks do not recursively counter an already-countered vector.
  const a=attacker?.battleProperty?(sourceBattlePropertyCounterElements(baseD)||baseA):baseA;
  const d=defender?.battleProperty?(sourceBattlePropertyCounterElements(baseA)||baseD):baseD;

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
    const equipMagic=sourcePlayerEquipMagicDefense(state);
    // fixed BATTLE_MagicDodge: elemental equipment resist is NOT part of fResist here;
    // only CHAR_EQUITQUIMAGIC contributes, at 0.9 per point.
    fLuck=n(state.luck)*3+magicTargetResist(targetDesc,attrIndex)*.15+n(equipMagic.quick)*.9;
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
  const resistInfo=sourceMagicEffectiveResist(targetDesc,attrIndex);
  const resist=resistInfo.effective;
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
  return {damage,dodged:false,dodge,attMagicLv,resist,resistBase:resistInfo.base,resistBonus:resistInfo.bonus,randomAmp,amagic,aPower,adjusted,trueMagic,exp,hpBefore,hpAfter:battleStatusHp(targetDesc)};
}
const BATTLE_STATUS_NAMES=Object.freeze({
  poison:'中毒',deepPoison:'劇毒',paralysis:'麻痺',sleep:'睡眠',stone:'石化',drunk:'酒醉',confusion:'混亂',
  dizzy:'暈眩',entwine:'樹根纏繞',dragnet:'天羅地網',instigate:'挑撥',iceCrack:'冰爆',iceArrow:'冰箭',thunderEnclose:'雷附體',
  barrier:'魔障',weaken:'虛弱',nocast:'沉默',sars:'毒煞'
});
const BATTLE_STATUS_INDEX=Object.freeze({poison:0,paralysis:1,sleep:2,stone:3,drunk:4,confusion:5});
function resetBattleStatuses(){sourceDiscardBattleGetItemPool();battleStatuses=new Map();battlePetOutIds=new Set();battlePetDeathProcessedIds=new Set();battlePetFixAiSnapshots=new Map();battlePlayerDeathProcessed=false;battlePlayerDeathResult=null;battleOuterAddProfitPending=false;battlePetChargeStates=new Map();battlePetEarthRoundStates=new Map();battlePetHiddenIds=new Set();battlePetGuardIds=new Set();battlePetAcupunctureIds=new Set();battlePetPowerMods=new Map();battleMagicPetStates=new Map();battleMagicPetRoundStates=new Map();battlePetRecoveryAiIds=new Set();battlePetNoGuardStates=new Map();battlePetVaryStates=new Map();battlePlayerGuardianPetId=null;battleReverseKeys=new Set();battlePropertyKeys=new Set();battleElementWork=new Map();battleDrunkReleaseBoostKeys=new Set();battleWeakenRoundKeys=new Set();battleUltimateWork=new Map();battleUltimateFlags=new Map();battleSarsStates=new Map();battleSarsCarrierKeys=new Set();battleShootSleepStates=new Map();battleDefMagicStates=new Map();battleGetItemPool=[];battleFieldState={attr:'none',power:0,turns:0};battlePlayerProfessionHitState=null;battlePlayerProfessionStatStates={str:null,tgh:null,dex:null};battlePlayerProfessionStatRound=null;battleProfessionScapegoat=null;battlePlayerRawGuardCommand=false;battlePlayerFixedToughWork=null;battlePlayerAvoidWork=null;battlePlayerWeaponFocusWork=null;battlePlayerProfessionTrap=null;battlePlayerMySkillStrPower=0;battlePlayerFixedAttackWork=null;battlePlayerAttackWork=null}
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
function sourceDefMagicState(desc){
  const key=battleStatusKey(desc);
  const st=key?battleDefMagicStates.get(key)||null:null;
  return st&&Math.trunc(n(st.turns))>0?st:null;
}
function sourceApplyDefMagicStatus(desc,turns,nums){
  const key=battleStatusKey(desc);
  if(!key)return {applied:false,updated:false,blocked:false,turns:0,nums:0};
  const old=battleDefMagicStates.get(key)||null;
  let applied=false;
  if(!old||Math.trunc(n(old.turns))<=0){
    battleDefMagicStates.set(key,{
      type:'defMagic',turns:Math.max(0,Math.trunc(n(turns))),nums:Math.trunc(n(nums))
    });
    applied=true;
  }
  // fixed BATTLE_MultiMagicStatusChange scans every MagicTbl[] slot first.
  // If ANY magic-status counter is already active it skips both writes, including
  // CHAR_OTHERSTATUSNUMS. Therefore 460/461 do not refresh or replace each other.
  const current=battleDefMagicStates.get(key)||old;
  return {
    applied,updated:false,blocked:!applied&&!!current,
    turns:Math.max(0,Math.trunc(n(current?.turns))),
    nums:Math.trunc(n(current?.nums))
  };
}
function sourceDefMagicStatusSeq(desc){
  const key=battleStatusKey(desc),st=key?battleDefMagicStates.get(key)||null:null;
  if(!key||!st||Math.trunc(n(st.turns))<=0)return null;
  st.turns=Math.max(0,Math.trunc(n(st.turns))-1);
  if(st.turns<=0){
    battleDefMagicStates.delete(key);
    addLog(battleStatusDescName(desc)+' 的魔抗狀態結束。');
    return {expired:true,turns:0,nums:Math.trunc(n(st.nums))};
  }
  return {expired:false,turns:st.turns,nums:Math.trunc(n(st.nums))};
}
function sourceDefMagicResistBonus(desc){
  const st=sourceDefMagicState(desc);
  return st?Math.trunc(n(st.nums)):0;
}
function sourceMagicEffectiveResist(desc,attrIndex){
  // fixed BATTLE_MultiAttMagic:
  // Player starts from CHAR_*_RESIST, then adds CHAR_EQUITDEFMAGIC_E+j.
  // Pet does not receive equipment magic defense; Enemy uses trunc(LV*0.5).
  // _MAGIC_DEFMAGICATT then scales only a positive combined def_magic_resist[].
  const natural=desc?.kind==='enemy'
    ?Math.trunc(Math.max(0,n(desc.unit?.level))*.5)
    :Math.max(0,Math.trunc(n(magicTargetResist(desc,attrIndex))));
  const equipMagic=desc?.kind==='player'?sourcePlayerEquipMagicDefense(state):null;
  const equipKeys=['earth','water','fire','wind'];
  const equip=desc?.kind==='player'?Math.trunc(n(equipMagic?.[equipKeys[attrIndex]])):0;
  const base=natural+equip;
  const bonus=sourceDefMagicResistBonus(desc);
  const effective=(base>0&&bonus!==0)
    ?base+Math.trunc(base*bonus/100)
    :base;
  return {base,natural,equip,bonus,effective};
}

function sourceMagicPetState(desc){
  const key=battleStatusKey(desc);
  if(!key)return null;
  const st=battleMagicPetStates.get(key)||null;
  return st&&Math.trunc(n(st.turns))>0?st:null;
}
function sourceMagicPetRoundState(desc){
  const key=battleStatusKey(desc);
  return key?(battleMagicPetRoundStates.get(key)||null):null;
}
function sourceMagicPetDuckActive(desc){
  return !!(desc?.kind==='enemy'&&n(desc.unit?.skillDuckTurns)>0);
}
function sourceMagicPetBusy(desc){
  const professionBusy=desc?.kind==='player'
    &&typeof sourceProfessionPlayerStatActiveAny==='function'
    &&sourceProfessionPlayerStatActiveAny();
  return sourceMagicPetDuckActive(desc)||!!sourceMagicPetState(desc)||professionBusy;
}
function sourceMagicPetApply(desc,stat,turns,power){
  const key=battleStatusKey(desc);
  if(!key||sourceMagicPetBusy(desc))return false;
  const normalizedStat=String(stat||'').toUpperCase();
  const normalizedPower=Math.trunc(n(power));
  battleMagicPetStates.set(key,{
    stat:normalizedStat,
    turns:Math.max(0,Math.trunc(n(turns))),
    power:normalizedPower,
    appliedBattleTurn:Math.max(0,Math.trunc(n(enemy?.sourceBattleTurn)))
  });
  // SetMagicPet writes the same CHAR_MYSKILLSTRPOWER field used by Weapon Focus init.
  // Expiry clears only the turn counter; the power Work value remains stale in fixed C.
  if(desc?.kind==='player'&&normalizedStat==='STR')battlePlayerMySkillStrPower=normalizedPower;
  return true;
}
function sourceMagicPetStatusSeq(desc){
  const key=battleStatusKey(desc),st=key?battleMagicPetStates.get(key):null;
  if(!key||!st||Math.trunc(n(st.turns))<=0)return null;
  st.turns=Math.max(0,Math.trunc(n(st.turns))-1);
  if(st.turns<=0){
    battleMagicPetStates.delete(key);
    addLog(battleStatusDescName(desc)+' 的 '+String(st.stat||'能力')+' 強化效果結束。');
    return {expired:true,stat:st.stat,power:st.power,turns:0};
  }
  return {expired:false,stat:st.stat,power:st.power,turns:st.turns};
}
function sourcePrepareMagicPetRoundStates(){
  battleMagicPetRoundStates=new Map();
  const current=Math.max(0,Math.trunc(n(enemy?.sourceBattleTurn)));
  const descs=[];
  if(state?.hp>0)descs.push({kind:'player'});
  const pet=activePet();
  if(pet&&petIsBattleActive(pet))descs.push({kind:'pet',pet,petId:pet.id});
  const units=Array.isArray(enemy?.units)&&enemy.units.length?enemy.units:(enemy?[enemy]:[]);
  for(const unit of units)if(unit&&n(unit.hp)>0)descs.push({kind:'enemy',unit,unitId:unit.id});
  for(const desc of descs){
    const key=battleStatusKey(desc),st=sourceMagicPetState(desc);
    if(!key||!st)continue;
    if(current<=Math.trunc(n(st.appliedBattleTurn)))continue;
    battleMagicPetRoundStates.set(key,Object.assign({},st));
  }
}
function sourceMagicPetAdjusted(desc,attack,defense,quick,mtghBase=defense){
  const out={
    attack:Math.trunc(n(attack)),defense:Math.trunc(n(defense)),quick:Math.trunc(n(quick)),
    stat:null,power:0,add:0
  };
  const st=sourceMagicPetRoundState(desc);
  if(!st)return out;
  const stat=String(st.stat||'').toUpperCase(),power=Math.trunc(n(st.power));
  // fixed Other_DefcharWorkInt() bug: STR/TGH/DEX all add (mtgh * power) / 100.
  const add=Math.trunc(Math.trunc(n(mtghBase))*power/100);
  if(stat==='STR')out.attack+=add;
  else if(stat==='TGH')out.defense+=add;
  else if(stat==='DEX')out.quick+=add;
  out.stat=stat;out.power=power;out.add=add;
  return out;
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
  if(desc?.kind==='player'){
    if(!sourcePlayerElementsConfigured(state))return null;
    const compliant=state?.playerEquipCompliance?.elementsRaw;
    return compliant?Object.assign({},compliant):Object.assign({},state.elements);
  }
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
  return !(st&&st.turns>0&&(st.type==='paralysis'||st.type==='stone'||st.type==='sleep'||st.type==='dizzy'||st.type==='dragnet'||st.type==='barrier'));
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
  if(desc?.kind==='player'){
    const equipKey=({weaken:'weaken',barrier:'barrier',nocast:'nocast'})[type];
    if(equipKey)return Math.trunc(n(sourcePlayerEquipResistWork(state)[equipKey]));
  }
  const idx=BATTLE_STATUS_INDEX[type];
  if(idx==null)return 0;
  if(desc?.kind==='player')return Math.trunc(n(state?.playerEquipCompliance?.statusResist?.[type]));
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
  return desc?.kind==='player'?n(state?.playerEquipCompliance?.fixedLuck??state?.luck):0;
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
  const suit=targetDesc?.kind==='player'?sourcePlayerSuitWork(state):null;
  const suitResist=targetDesc?.kind==='player'?Math.trunc(n(suit?.RESIST)):0;
  // fixed _SUIT_ADDPART3 source bug: RENOCASE is subtracted only when status is WEAKEN.
  const suitRenocase=targetDesc?.kind==='player'&&type==='weaken'
    ?Math.trunc(n(suit?.RENOCASE)):0;
  let per=Math.trunc(perOffset+level+luck-resist-vitalPenalty-suitResist-suitRenocase);
  if(per>80)per=80;
  return {
    allowed:true,per,success:cRand(1,100)<per,resist,vitalPenalty,level,bai,range,perOffset,
    suitResist,suitRenocase
  };
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
function sourcePlayerSuitStatusSeq(target=state){
  if(!target)return null;
  const suit=sourcePlayerSuitWork(target);
  if(Math.trunc(n(suit.activeCode))<=0)return null;
  const addHp=Math.trunc(n(suit.HP)),addMp=Math.trunc(n(suit.MP));
  if(addHp===0&&addMp===0)return {activeCode:suit.activeCode,addHp,addMp,hpActual:0,mpActual:0};

  const hpBefore=Math.trunc(n(target.hp)),mpBefore=Math.trunc(n(target.mp));
  let hpAfter=hpBefore,mpAfter=mpBefore;

  // fixed _TYPE_TOXICATION gates HP recovery through connection toxication state.
  // That connection-side system is not present in the web core; every currently representable
  // state corresponds to the non-toxicated branch, so do not substitute battle poison for it.
  if(addHp!==0){
    hpAfter=Math.min(Math.trunc(n(target.maxHp)),hpBefore+addHp);
    if(hpAfter<=1)hpAfter=1;
    target.hp=hpAfter;
  }
  if(addMp!==0){
    mpAfter=Math.min(Math.trunc(n(target.maxMp)),mpBefore+addMp);
    if(mpAfter<0)mpAfter=0;
    target.mp=mpAfter;
  }
  return {
    activeCode:suit.activeCode,addHp,addMp,
    hpBefore,hpAfter:Math.trunc(n(target.hp)),hpActual:Math.trunc(n(target.hp))-hpBefore,
    mpBefore,mpAfter:Math.trunc(n(target.mp)),mpActual:Math.trunc(n(target.mp))-mpBefore
  };
}
function processBattleStatusTurn(actor){
  const desc=battleStatusActorDesc(actor);
  if(!desc)return {skip:false,desc:null,status:null};

  // fixed BATTLE_StatusSeq tail: SetMagicPet counts down on the target's own action.
  // The round WORK/FIX snapshot was already prepared before StatusSeq, so an expiry here
  // must not erase this round's already-built stat bonus.
  sourceMagicPetStatusSeq(desc);

  if(desc.kind==='enemy'){
    // 原 BATTLE_StatusSeq 尾端：SetDuck 同樣按「輪到該角色行動」扣 1。
    if(n(desc.unit?.skillDuckTurns)>0){
      desc.unit.skillDuckTurns=Math.max(0,Math.trunc(n(desc.unit.skillDuckTurns))-1);
      if(desc.unit.skillDuckTurns<=0){
        desc.unit.skillDuckPower=0;
        addLog(desc.unit.name+' 的閃避術效果結束。');
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
    // fixed BATTLE_StatusSeq tail order: MYSKILLSTR -> TGH -> DEX -> MYSKILLHIT.
    // The PreCommand FIX snapshot is already built, so expiry here affects the NEXT round.
    const professionStats=desc.kind==='player'?sourceProfessionPlayerStatStatusSeq(state):null;
    const professionHit=desc.kind==='player'?sourceProfessionPlayerHitStatusSeq(state):null;
    // fixed BATTLE_StatusSeq handles suit round HP/MP after the ordinary status loop.
    const suitRound=desc.kind==='player'?sourcePlayerSuitStatusSeq(state):null;
    // fixed battle.c then continues with other independent WORK-status lifecycles.
    const defMagic=sourceDefMagicStatusSeq(desc);
    const sars=sourceProcessSarsStatusTurn(desc);
    // fixed main loop: ordinary StatusSeq -> MagicStatusSeq -> ProfessionStatusSeq -> CanMoveCheck.
    // Reback therefore observes the post-countdown status and still runs before the caller skips movement.
    const professionReback=desc.kind==='player'
      ?sourceProfessionPlayerRebackStatusSeq(desc,state):null;
    // fixed BATTLE_ProfessionStatusSeq runs after ordinary/Magic StatusSeq on the
    // actor's own turn. TRAP count belongs here, not to generic StatusTbl.
    const professionTrap=desc.kind==='player'
      ?sourceProfessionPlayerTrapStatusSeq():null;
    const extra={};
    if(professionStats)extra.professionStats=professionStats;
    if(professionHit)extra.professionHit=professionHit;
    if(attackShootSleep)extra.attackShootSleep=attackShootSleep;
    if(suitRound&&(suitRound.addHp!==0||suitRound.addMp!==0))extra.suitRound=suitRound;
    if(defMagic)extra.defMagic=defMagic;
    if(sars)extra.sars=sars;
    if(professionReback?.triggered)extra.professionReback=professionReback;
    if(professionTrap)extra.professionTrap=professionTrap;
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
  if(st.type==='instigate'){
    // fixed CHAR_WORKINSTIGATE: decrement already happened above; expiry skips
    // the switch entirely. Every remaining active tick consumes RAND(1,100).
    const roll=cRand(1,100);
    if(roll<=80){
      const rate=Math.trunc(n(st.instigateRate));
      const fixMutation=sourceProfessionInstigateFixMutation(desc,rate);
      // The same-side RAND(0,9) belongs to StatusSeq and must happen before
      // BATTLE_GetAttackCount(). The scan starts from ++pos and excludes self.
      const pick=sourceProfessionInstigateSameSideTarget(desc);
      return finish({
        skip:false,desc,status:st,instigateAttack:true,
        instigateRoll:roll,instigateRate:rate,instigateFixMutation:fixMutation,
        instigateTarget:pick.target,instigateTargetRoll:pick.roll,
        instigateRawToNo:pick.rawToNo
      });
    }
    return finish({skip:false,desc,status:st,instigateRoll:roll,instigateAttack:false});
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
  if(t.includes('麻'))return 'paralysis';
  if(t.includes('虚')||t.includes('虛'))return 'weaken';
  if(t.includes('罗')||t.includes('羅'))return 'dragnet';
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
  const compliance=state?.playerEquipCompliance||playerComplianceParameter(state)?.equip||{};
  const fixedToughBase=Math.trunc(n(compliance.fixedTough??state.defense));
  const magicPet=sourceMagicPetAdjusted(desc,state.attack,state.defense,state.dex,fixedToughBase);
  const professionStats=sourceProfessionPlayerStatRoundAdjusted(
    magicPet.attack,magicPet.defense,magicPet.quick
  );
  // fixed Other_DefcharWorkInt applies MYSKILL STR/TGH/DEX, then Weapon Focus,
  // then WEAKEN. battlePlayerFixedAttackWork is the FIXSTR snapshot from compliance.
  const fixedAttackBase=battlePlayerFixedAttackWork==null
    ?sourceProfessionPlayerWeaponFocusApply(professionStats.attack).after
    :Math.trunc(n(battlePlayerFixedAttackWork));
  const compliantAttack=weaken?Math.trunc(fixedAttackBase*.8):fixedAttackBase;
  const attack=battlePlayerAttackWork==null?compliantAttack:Math.trunc(n(battlePlayerAttackWork));
  const defenseBase=weaken?Math.trunc(n(professionStats.defense)*.8):n(professionStats.defense);
  const quickBase=weaken?Math.trunc(n(professionStats.quick)*.8):n(professionStats.quick);
  const arm=compliance.arm||null;
  const weaponType=arm?Math.trunc(n(arm.type)):0;
  const fixedTough=battlePlayerFixedToughWork==null
    ?defenseBase:Math.trunc(n(battlePlayerFixedToughWork));
  return {
    type:'player',attack,defense:defenseBase,stone,
    fixedTough,
    fixedDex:quickBase,quick:battleDrunkQuick(desc,quickBase),
    luck:n(compliance.fixedLuck??state.luck),drunk,
    weaponType,weaponCritical:arm?Math.trunc(n(arm.critical)):0,
    // fixed BATTLE_IsThrowWepon(): bow / boomerang / boundthrow / breakthrow are all indirect weapons.
    throwWeapon:SOURCE_PLAYER_RANGED_WEAPON_TYPES.has(weaponType),
    hitRight:sourceProfessionPlayerHitRight(compliance),neglectGuard:Math.trunc(n(compliance.neglectGuard)),
    otherDamage:Math.trunc(n(compliance.otherDamage)),otherDefc:Math.trunc(n(compliance.otherDefc)),
    arrangePower:sourceProfessionPlayerDeflectArrangePower(compliance),
    professionAvoidActive:!!battlePlayerAvoidWork?.active,
    professionAvoidMod:Math.trunc(n(battlePlayerAvoidWork?.mod)),
    rawGuardCommand:!!battlePlayerRawGuardCommand,
    suitCounter:Math.trunc(n(sourcePlayerSuitWork(state).COUNTER)),
    suitDuckPower:Math.trunc(n(sourcePlayerSuitWork(state).WDUCKPOWER)),
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
  const vary=battlePetVaryStates.get(pet.id)||null;
  const sourceAttackBase=Math.trunc(n(combat?.attack));
  const sourceDefenseBase=Math.trunc(n(combat?.defense));
  const sourceQuickBase=Math.trunc(n(combat?.quick));
  // fixed Other_DefcharWorkInt(): SetMagicPet is applied before Vary/WEAKEN.
  // The source bug uses the saved mtgh base for STR/TGH/DEX alike.
  const magicPet=sourceMagicPetAdjusted(desc,sourceAttackBase,sourceDefenseBase,sourceQuickBase,sourceDefenseBase);
  const variedAttackBase=vary
    ?magicPet.attack+Math.trunc(magicPet.attack*Math.trunc(n(vary.attackPct))/100)
    :magicPet.attack;
  const variedQuickBase=vary
    ?magicPet.quick+Math.trunc(magicPet.quick*Math.trunc(n(vary.dexPct))/100)
    :magicPet.quick;
  const normalAttackBase=weaken?Math.trunc(variedAttackBase*.8):variedAttackBase;
  const normalDefenseBase=weaken?Math.trunc(magicPet.defense*.8):magicPet.defense;
  const normalQuickBase=weaken?Math.trunc(variedQuickBase*.8):variedQuickBase;
  const powerMod=battlePetPowerMods.get(pet.id)||null;
  const noGuard=battlePetNoGuardStates.get(pet.id)||null;
  const attack=frozen?Math.trunc(n(frozen.attack))
    :(powerMod&&Number.isFinite(Number(powerMod.attack))?Math.trunc(Number(powerMod.attack)):normalAttackBase);
  const defense=frozen?Math.trunc(n(frozen.defense))
    :(powerMod&&Number.isFinite(Number(powerMod.defense))?Math.trunc(Number(powerMod.defense)):normalDefenseBase);
  const fixedTough=frozen?Number(frozen.fixedTough):normalDefenseBase;
  const fixedDex=frozen?Number(frozen.fixedDex):normalQuickBase;
  const workQuickBase=frozen?Number(frozen.workQuickBase??frozen.fixedDex??frozen.quick)
    :(powerMod&&Number.isFinite(Number(powerMod.quick))?Math.trunc(Number(powerMod.quick)):normalQuickBase);
  const elements=frozen?.elements?Object.assign({},frozen.elements):battleElementsForDesc(desc);
  return {
    type:'pet',attack,defense,stone,
    duckBonus:n(noGuard?.duckBonus),counterBonus:n(noGuard?.counterBonus),
    fixedTough,fixedDex,workQuickBase,quick:battleDrunkQuick(desc,workQuickBase),
    luck:0,drunk,weaponType:0,weaponCritical:0,throwWeapon:false,
    canMove:battleStatusCanMove(desc),
    battleProperty:sourceBattlePropertyActive(desc),
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

// V1.76 fixed PETSKILL_functbl exact-name audit.
// These petskill2 rows exist, but their function strings are not registered in this build.
// PETSKILL_Use() therefore gets a NULL function pointer and returns FALSE.
const SOURCE_PLAYER_UNREGISTERED_PETSKILL_FUNCTIONS=new Set([
  'PETSKILL_SelfExplodeAttack',
  'PETSKILL_Awaken',
  'PETSKILL_Temptation'
]);

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
  const baseDefense=Math.trunc(n(unit.defense));

  // fixed Other_DefcharWorkInt(): SetMagicPet precedes WEAKEN and, due to a source bug,
  // STR/TGH/DEX all use the saved mtgh base for their percentage addition.
  const magicPet=sourceMagicPetAdjusted(desc,sourceFixAttack,baseDefense,sourceFixQuick,baseDefense);
  sourceFixAttack=magicPet.attack;
  let sourceFixDefense=magicPet.defense;
  sourceFixQuick=magicPet.quick;

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
  unit.roundMagicPetStat=magicPet.stat;
  unit.roundMagicPetPower=magicPet.power;
  unit.roundTghBuffPower=magicPet.stat==='TGH'?magicPet.power:0;

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

  let superWallRoll=null;
  if(n(defender?.superWallPower)>0){
    superWallRoll=cRand(0,19);
    defense+=defense*(n(defender.superWallPower)+superWallRoll)/100;
  }

  if(defender?.type==='enemy')defense+=(defense*Math.floor(Math.random()*10)+2)/100;
  if(attacker?.type==='enemy')attack+=(attack*Math.floor(Math.random()*10)+2)/100;

  // Source order: NPCENEMY_ADDPOWER -> STONE -> REGRET overwrite -> _EQUIT_NEGLECTGUARD.
  if(defender?.stone)defense*=2;
  if(options.useFixedToughDefense)defense=n(defender?.fixedTough);
  const neglectGuard=Math.trunc(n(attacker?.neglectGuard));
  if(neglectGuard>1)defense*=1-neglectGuard/100;

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

  // fixed _ADD_DEAMGEDEFC unconditionally consumes both RAND calls, including 0..0.
  const sourceOtherDamage=Math.trunc(n(attacker?.otherDamage));
  const sourceOtherDefense=Math.trunc(n(defender?.otherDefc));
  // C: int otherpower = RAND(apower*.3,apower) - RAND(dpower*.3,dpower).
  // Both RAND macro expressions may be fractional because x is a double; the subtraction
  // happens first and only the final assignment to int truncates toward zero.
  const sourceOtherPower=Math.trunc(
    sourceCRandMacroValue(sourceOtherDamage*.3,sourceOtherDamage)
    -sourceCRandMacroValue(sourceOtherDefense*.3,sourceOtherDefense)
  );
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

  // fixed _EQUIT_HITRIGHT: PLAYER only, after the 75% cap, before final dodge RAND.
  if(attacker?.type==='player'){
    const sourceHitRight=Math.trunc(n(attacker?.hitRight));
    duck-=cRand(sourceHitRight*.8,sourceHitRight*1.2);
    if(duck<0)duck=0;
  }
  // fixed _PROFESSION_SKILL: Player Avoid runs AFTER the 75% cap and HITRIGHT.
  // BATTLE_check_profession_duck(int per) truncates the float threshold first,
  // multiplies by (100+WORKMOD_P_DUCK)%, and does NOT re-cap.
  if(defender?.type==='player'&&defender?.professionAvoidActive){
    duck=sourceProfessionPlayerAvoidApply(duck,{
      active:true,mod:Math.trunc(n(defender.professionAvoidMod))
    }).after;
  }
  // fixed _PROFESSION_ADDSKILL: CHAOS adds 40% after Profession Avoid and
  // does NOT cap the threshold again.
  if(options.sourceProfessionChaos===true){
    duck=sourceProfessionChaosDuckRaw(duck);
  }
  return duck;
}
function sourceSuitDuckCheck(defender,options={}){
  // fixed BATTLE_AttackSeq: this is a second independent dodge after BATTLE_DuckCheck.
  // It still runs when GUARD / immobility made BATTLE_DuckCheck return FALSE; only COMBO skips it.
  if(options.sourceCombo||options.skipSuitDodge)return {dodged:false,power:0,roll:null};
  const power=Math.trunc(n(defender?.suitDuckPower));
  if(power<=0)return {dodged:false,power,roll:null};
  const roll=cRand(0,99); // rand()%100
  return {dodged:roll<power,power,roll};
}
function sourceBattleArrangeCheck(defender,options={}){
  const power=clamp(Math.trunc(n(defender?.arrangePower)),0,1000);
  const per=Math.min(700,power);
  // fixed BATTLE_ArrangeCheck reads raw COM_GUARD before the confusion-aware GuardAdjust check.
  const guardCommand=Object.prototype.hasOwnProperty.call(options,'arrangeGuardCommand')
    ?!!options.arrangeGuardCommand:(!!defender?.rawGuardCommand||!!options.guarding);
  if(guardCommand)return {arranged:false,power,per,roll:null,reason:'guard'};
  const damageReact=Math.trunc(n(options.damageReact??defender?.damageReact));
  if(damageReact>0)return {arranged:false,power,per,roll:null,reason:'damage-react'};
  if(defender?.canMove===false)return {arranged:false,power,per,roll:null,reason:'cannot-move'};
  if(options.noDuck===true||defender?.noDuck===true)return {arranged:false,power,per,roll:null,reason:'no-duck'};
  if(options.abio===true||defender?.abio===true)return {arranged:false,power,per,roll:null,reason:'abio'};
  if(power<=0)return {arranged:false,power,per,roll:null,reason:'no-power'};
  const roll=cRand(1,1000);
  return {arranged:roll<=per,power,per,roll,reason:roll<=per?'success':'roll'};
}
function resolveNormalAttack(attacker,defender,options={}){
  const guarding=!!options.guarding;
  // fixed BATTLE_DuckCheck returns FALSE immediately for GUARD / immobility, while the
  // separate suit-dodge branch below still executes unless this is COMBO/already checked.
  const disableDodge=guarding||!!options.disableDodge||defender?.canMove===false;
  if(!disableDodge&&n(defender?.skillDuckPower)>0){
    const power=Math.trunc(n(defender.skillDuckPower));
    const roll=cRand(0,99);
    if(roll<=power){
      return {damage:0,dodged:true,critical:false,miss:false,guarded:guarding,skillDuck:true,skillDuckPower:power,skillDuckRoll:roll};
    }
  }
  const duck=disableDodge?0:sourceBattleDuckTotal(attacker,defender,options);
  // 原 BATTLE_DuckCheck：防禦中直接 return FALSE，不進普通閃避判定。
  if(!disableDodge&&cRand(1,10000)<=duck){
    const professionDodge=defender?.type==='player'?sourceProfessionPlayerNormalDodgeEvent(state):null;
    return {damage:0,dodged:true,critical:false,miss:false,guarded:guarding,duckRaw:duck,professionDodge};
  }
  const suitDuck=sourceSuitDuckCheck(defender,options);
  if(suitDuck.dodged){
    return {
      damage:0,dodged:true,critical:false,miss:false,guarded:guarding,duckRaw:duck,
      suitDuck:true,suitDuckPower:suitDuck.power,suitDuckRoll:suitDuck.roll
    };
  }

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
  // fixed BATTLE_AttackSeq invokes Weapon Focus then Dual Weapon immediately after
  // critical damage is calculated, before GuardBreak/GuardAdjust and the damage<1 RAND.
  const professionCritical=(critical&&attacker?.type==='player')
    ?sourceProfessionPlayerCriticalEvent(state,Math.trunc(n(attacker?.weaponType)))
    :null;

  // GuardBreak2 類技能會在 GuardAdjust 前先修正原始傷害。
  const preGuardMultiplier=Number.isFinite(Number(options.preGuardDamageMultiplier))
    ?Number(options.preGuardDamageMultiplier):1;
  damage=Math.trunc(damage*preGuardMultiplier);

  // AttackSeq：技能前置倍率後才 GuardAdjust，再把 <1 的傷害 RAND(0,1)，最後乘 gBattleDamageModyfy。
  if(guarding)damage=battleGuardAdjust(damage);
  if(damage<1)damage=cRand(0,1);

  // fixed BATTLE_AttackSeq: Arrange runs after GuardAdjust / damage<1 RAND and before
  // gBattleDamageModyfy. Player success raises Deflect proficiency before zero can become MISS.
  const arrange=sourceBattleArrangeCheck(defender,Object.assign({},options,{guarding}));
  let professionDeflect=null;
  if(arrange.arranged){
    damage=Math.trunc(damage*.1);
    if(defender?.type==='player')professionDeflect=sourceProfessionPlayerDeflectEvent(state);
  }
  const arranged=arrange.arranged&&damage>0;

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
    preGuardDamageMultiplier:preGuardMultiplier,professionCritical,
    arrangeTriggered:arrange.arranged,arranged,
    arrangePower:arrange.power,arrangePer:arrange.per,arrangeRoll:arrange.roll,
    arrangeReason:arrange.reason,professionDeflect,
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
    // fixed _SUIT_ADDENDUM: Player counter adds CHAR_WORKCOUNTER after weapon factor + Luck.
    per=per*sourceCounterWeaponFactor(attacker?.weaponType,defender?.weaponType)*.1
      +n(attacker?.luck)+n(attacker?.suitCounter);
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
  if(targetDesc?.kind==='pet')return sourcePlayerPetGuardAdjust(targetDesc.pet);
  if(targetDesc?.kind==='enemy')return !!targetDesc.unit?.guardThisTurn;
  return false;
}
function sourcePrepareAcupunctureReaction(attackerDesc,targetDesc,r,{counter=false}={}){
  const unit=targetDesc?.kind==='enemy'?targetDesc.unit:null;
  const pet=targetDesc?.kind==='pet'?targetDesc.pet:null;
  const active=!!unit?.acupunctureActive||!!(pet&&battlePetAcupunctureIds.has(pet.id));
  if(!active||!r||r.dodged||r.miss||n(r.damage)<=0){
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
    attackerDesc,targetDesc,targetUnit:unit,targetPet:pet,r,
    originalDamage,fullDamage,reflectedDamage
  };
}
function sourceFinishAcupunctureReaction(reaction){
  if(!reaction?.triggered)return reaction||{triggered:false};
  const {targetUnit,targetPet,attackerDesc,targetDesc,r,fullDamage,reflectedDamage,counter}=reaction;

  // Source order inside BATTLE_DamageSub:
  // defender full damage -> clear WORKACUPUNCTURE -> attacker half damage.
  if(targetUnit)targetUnit.acupunctureActive=false;
  if(targetPet)battlePetAcupunctureIds.delete(targetPet.id);
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
  if(beforeAttacker>0&&reaction.attackerAfter<=0&&attackerDesc?.kind==='enemy'&&attackerDesc.unit){
    sourceMarkEnemyDeathCredit(attackerDesc.unit,[targetDesc]);
  }

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
function sourcePlayerSuitPoisonAfterPhysicalHit(attackerDesc,targetDesc,r){
  if(attackerDesc?.kind!=='player'||!targetDesc||!r||n(r.damage)<=0)return null;
  const suit=sourcePlayerSuitWork(state);
  const power=Math.trunc(n(suit.SUITPOISON));
  if(power<=0)return null;

  // fixed _SUIT_ADDPART4: only when no other gBattleStausChange was already selected,
  // SUITPOISON chooses poison, turn=3, and passes its Work value as PerOffset.
  const check=battleStatusChance(
    attackerDesc,targetDesc,'poison',
    {perOffset:power,range:40,bai:2,forceGeneral:true}
  );
  const applied=!!(check.allowed&&check.success&&battleStatusApply(targetDesc,'poison',3));
  if(applied)addLog(battleStatusDescName(targetDesc)+' 受到套裝帶毒效果，陷入中毒。','bad');
  return {power,check,applied,storedTurns:applied?4:0};
}
function battleApplyPhysicalHit(attackerDesc,targetDesc,r,{counter=false,confusion=false,deferItemCrush=false,deferAddProfit=false,suppressSuitPoison=false}={}){
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

  const trap=sourcePrepareProfessionTrapReaction(attackerDesc,targetDesc,r);
  if(trap.triggered){
    sourceFinishProfessionTrapReaction(trap);
    if(!deferItemCrush)sourceBattleFinalizeItemCrushRng(r);
    if(!deferAddProfit)sourceProcessBattleDeathsAtAddProfit();
    sourceLogProfessionTrapReaction(trap);
    return trap;
  }

  const acupuncture=sourcePrepareAcupunctureReaction(attackerDesc,targetDesc,r,{counter});
  const before=battleStatusHp(targetDesc);
  battleStatusSetHp(targetDesc,before-r.damage);
  sourceTrackDamageSubUltimate(targetDesc,r.damage,before,r);
  sourceFinishAcupunctureReaction(acupuncture);
  // Primary BATTLE_Attack restores the original defender before WakeUp; Counter does not.
  if(!(counter&&acupuncture.triggered))battleStatusWakeOnDamage(targetDesc,r.damage);
  const suitPoison=(!counter&&!suppressSuitPoison)
    ?sourcePlayerSuitPoisonAfterPhysicalHit(attackerDesc,targetDesc,r):null;
  if(suitPoison)r.suitPoison=suitPoison;
  if(!deferItemCrush)sourceBattleFinalizeItemCrushRng(r);
  if(!deferAddProfit)sourceProcessBattleDeathsAtAddProfit();
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
  if(!attackerDesc||!targetDesc||primaryResult?.critical||primaryResult?.guarded
    ||primaryResult?.guardian||primaryResult?.sourceCounterBlockedByTrap)return;
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
function sourceProfessionInstigateSameSideTarget(attackerDesc){
  const attackerSlot=sourceBattleStatusSlot(attackerDesc);
  if(attackerSlot<0)return {roll:null,target:null,targetSlot:-1,rawToNo:-1};
  const sideStart=attackerSlot>=10?10:0;
  let pos=cRand(0,9);
  const roll=pos;
  for(let lop=0;lop<10;lop++){
    if(++pos>=10)pos=0;
    const slot=sideStart+pos;
    if(slot===attackerSlot)continue;
    const target=sourcePlayerConfusionTargetableFromBattleSlot(slot);
    if(target)return {roll,target,targetSlot:slot,rawToNo:slot};
  }
  // fixed StatusSeq writes COM2=-1 here. BATTLE_TargetAdjust's opponent-side
  // BATTLE_DefaultAttacker RNG happens later, after BATTLE_GetAttackCount().
  return {roll,target:null,targetSlot:-1,rawToNo:-1};
}

function sourceProfessionInstigateDefaultTarget(attackerDesc){
  const list=attackerDesc?.kind==='enemy'
    ?enemyPlayerSideLivingTargets()
    :targetableEnemyUnits().map(unit=>({kind:'enemy',unit,unitId:unit.id}));
  if(!list.length)return null;
  // fixed BATTLE_DefaultAttacker always calls RAND(0,cnt-1), including cnt==1.
  return list[cRand(0,list.length-1)]||null;
}

function sourceProfessionInstigateFixMutation(desc,rate){
  if(desc?.kind!=='enemy'||!desc.unit)return null;
  const unit=desc.unit;
  const pct=100-Math.trunc(n(rate));
  const before={
    attack:Math.trunc(n(unit.roundFixAttack??unit.attack)),
    defense:Math.trunc(n(unit.roundFixDefense??unit.defense)),
    quick:Math.trunc(n(unit.roundFixQuick??unit.quick))
  };
  const after={
    attack:Math.trunc(before.attack*pct/100),
    defense:Math.trunc(before.defense*pct/100),
    quick:Math.trunc(before.quick*pct/100)
  };
  unit.roundFixAttack=after.attack;
  unit.roundFixDefense=after.defense;
  unit.roundFixQuick=after.quick;
  // fixed StatusSeq changes FIX only. WORKATTACKPOWER / WORKDEFENCEPOWER /
  // WORKQUICK and the already-built EntrySort order are intentionally untouched.
  return {
    rate:Math.trunc(n(rate)),before,after,
    workAttack:Math.trunc(n(unit.roundAttack??unit.attack)),
    workDefense:Math.trunc(n(unit.roundDefense??unit.defense)),
    workQuick:Math.trunc(n(unit.roundQuick??unit.quick))
  };
}

function sourceProfessionInstigateApplyHit(attackerDesc,targetDesc,options={},attackOptions={},deferFinalize=false){
  if(attackerDesc?.kind!=='enemy'||!attackerDesc.unit||!targetDesc)return null;
  const unit=attackerDesc.unit;
  let r=null,actualTargetDesc=targetDesc;

  if(targetDesc.kind==='enemy'&&targetDesc.unit){
    const guarding=battleConfusionGuarding(targetDesc,options);
    r=resolveAttackToEnemyWithGuardian(enemyBattleView(unit),targetDesc.unit,{
      ...attackOptions,guarding,attackerUnit:unit
    });
    if(r?.guardian)actualTargetDesc={kind:'enemy',unit:r.actualTarget,unitId:r.actualTarget.id};
  }else if(targetDesc.kind==='pet'&&targetDesc.pet&&petIsBattleActive(targetDesc.pet)){
    r=enemyAttackPetResult(unit,targetDesc.pet,{...attackOptions,sourceGuardianReal:true});
    actualTargetDesc=enemyDirectActualTarget(targetDesc,r)||targetDesc;
  }else if(targetDesc.kind==='player'&&state.hp>0){
    const guarding=battleConfusionGuarding(targetDesc,options);
    r=resolveEnemyDirectAttackToPlayer(unit,{...attackOptions,guarding});
    actualTargetDesc=r?.actualTargetDesc||targetDesc;
  }
  if(!r)return null;

  battleApplyPhysicalHit(attackerDesc,actualTargetDesc,r,{
    deferItemCrush:deferFinalize,deferAddProfit:deferFinalize
  });
  return {targetDesc:actualTargetDesc,originalTargetDesc:targetDesc,r};
}

function sourceProfessionInstigateTargetFromSlot(slot){
  return sourcePlayerConfusionTargetableFromBattleSlot(slot);
}

function sourceProfessionInstigateBoomerang(actor,attackerDesc,statusTurn,options={}){
  const unit=attackerDesc.unit;
  const attackSlot=sourceBattleStatusSlot(attackerDesc);
  let defNo=Math.trunc(n(statusTurn?.instigateRawToNo));
  let chosen=defNo>=0?sourceProfessionInstigateTargetFromSlot(defNo):null;
  if(defNo<0||!chosen){
    chosen=sourceProfessionInstigateDefaultTarget(attackerDesc);
    if(!chosen)return {handled:true,noAction:true,reason:'target-adjust-failed',hits:[]};
    defNo=sourceBattleStatusSlot(chosen);
  }
  let row=(defNo>=0&&defNo<=19)?Math.trunc(defNo/5):-1;
  if(row<0)return {handled:true,noAction:true,reason:'boomerang-row-invalid',hits:[]};
  // fixed BATTLE_COM_BOOMERANG explicitly refuses to attack the attacker's own 5-slot row.
  if(Math.trunc(attackSlot/5)===row){
    return {handled:true,noAction:true,reason:'boomerang-same-row',row,hits:[]};
  }

  const rowHasTarget=r=>r>=0&&r<SOURCE_BOOMERANG_VS_TBL.length
    &&SOURCE_BOOMERANG_VS_TBL[r].some(slot=>!!sourceProfessionInstigateTargetFromSlot(slot));
  if(!rowHasTarget(row)){
    chosen=sourceProfessionInstigateDefaultTarget(attackerDesc);
    if(!chosen)return {handled:true,noAction:true,reason:'boomerang-row-empty',hits:[]};
    defNo=sourceBattleStatusSlot(chosen);
    row=Math.trunc(defNo/5);
  }

  const order=SOURCE_BOOMERANG_VS_TBL[row].slice().reverse(); // Enemy side => k=4,j=-1
  const hits=[];
  for(const slot of order){
    const target=sourceProfessionInstigateTargetFromSlot(slot);
    if(!target)continue;
    const hit=sourceProfessionInstigateApplyHit(attackerDesc,target,options,{damageMultiplier:.3});
    if(hit)hits.push({battleSlot:slot,...hit});
    if(n(unit.hp)<=0)break;
  }
  return {handled:true,weaponCommand:'BOOMERANG',row,targetSlots:order,hits,noOrdinaryCounter:true};
}

function sourceProfessionInstigateBow(actor,attackerDesc,statusTurn,options={}){
  const unit=attackerDesc.unit;
  const rawToNo=Math.trunc(n(statusTurn?.instigateRawToNo));
  const attackSlot=sourceBattleStatusSlot(attackerDesc);
  // fixed BATTLE_TargetListSet: invalid raw COM2 gives [-1] and consumes NO bow RAND.
  if(rawToNo<0||rawToNo>19){
    return {handled:true,noAction:true,reason:'bow-raw-target-invalid',attackMax:Math.max(1,Math.trunc(n(actor?.sourceAttackMax)||1)),hits:[]};
  }
  const plan=sourceBowTargetListFromBattleSlots(rawToNo,attackSlot);
  const attackMax=Math.max(1,Math.trunc(n(actor?.sourceAttackMax)||1));
  const hits=[];
  for(const slot of plan.slots){
    if(slot<0)break;
    const target=sourceProfessionInstigateTargetFromSlot(slot);
    if(!target)continue;
    const hit=sourceProfessionInstigateApplyHit(attackerDesc,target,options);
    if(!hit)continue;
    hits.push({battleSlot:slot,...hit});
    if(hits.length>=attackMax||n(unit.hp)<=0)break;
  }
  return {
    handled:true,weaponCommand:'BOW',attackMax,attackCount:hits.length,
    bowRandom:plan.random,bowTargetSlots:plan.slots.slice(),hits,
    noOrdinaryCounter:true
  };
}

function sourceProfessionInstigateCommonAttack(actor,attackerDesc,statusTurn,options={}){
  const unit=attackerDesc.unit;
  const weaponType=Math.trunc(n(unit?.weaponType));
  const attackMax=Math.max(1,Math.trunc(n(actor?.sourceAttackMax)||1));
  const rawToNo=Math.trunc(n(statusTurn?.instigateRawToNo));
  let target=rawToNo>=0?sourceProfessionInstigateTargetFromSlot(rawToNo):null;
  let fallback=false;
  if(!target){
    target=sourceProfessionInstigateDefaultTarget(attackerDesc);
    fallback=true;
  }
  if(!target)return {handled:true,noAction:true,reason:'target-adjust-failed',attackMax,hits:[]};

  const hits=[];
  for(let i=0;i<attackMax;i++){
    if(!target)break;
    const defer=weaponType===19;
    const hit=sourceProfessionInstigateApplyHit(attackerDesc,target,options,{},defer);
    if(!hit)break;
    let paralysis=null;
    if(weaponType===19){
      paralysis=sourceBreakthrowParalysis(unit,hit);
      sourceBattleFinalizeItemCrushRng(hit.r);
      sourceProcessBattleDeathsAtAddProfit();
    }
    hits.push({paralysis,...hit});
    if(i+1>=attackMax||n(unit.hp)<=0)break;

    // BATTLE_TargetListSet prefilled later entries with the ORIGINAL COM2.
    // When original COM2 was -1, the next list entry is the sentinel and the loop ends.
    if(rawToNo<0)break;
    target=sourceProfessionInstigateTargetFromSlot(rawToNo);
    if(!target){
      target=sourceProfessionInstigateDefaultTarget(attackerDesc);
      fallback=true;
    }
  }

  const last=hits[hits.length-1]||null;
  if(last&&hits.length>=attackMax&&n(unit.hp)>0&&!last.r?.playerGuardian){
    resolveConfusionCounterChain(attackerDesc,last.targetDesc,last.r,options);
  }
  return {
    handled:true,weaponCommand:weaponType===19?'BREAKTHROW':(weaponType===18?'BOUNDTHROW':'ATTACK'),
    attackMax,attackCount:hits.length,rawToNo,fallback,hits
  };
}

function performProfessionInstigateAttack(actor,statusTurn,options={}){
  const attackerDesc=statusTurn?.desc||battleStatusActorDesc(actor);
  if(!attackerDesc||!battleStatusDescAlive(attackerDesc))return true;
  if(attackerDesc.kind!=='enemy'||!attackerDesc.unit)return true;
  const unit=attackerDesc.unit;

  // StatusSeq overwrites COM1 with ordinary ATTACK after BATTLE_ai_all() already planned
  // the original command. Preserve that replacement before executing the weapon command.
  if(unit.chargeState)unit.chargeState=null;
  if(unit.earthRoundState)unit.earthRoundState=null;
  unit.guardThisTurn=false;
  unit.counterEligibleThisTurn=true;

  const weaponType=Math.trunc(n(unit.weaponType));
  let result;
  if(weaponType===17){
    result=sourceProfessionInstigateBoomerang(actor,attackerDesc,statusTurn,options);
  }else if(weaponType===4){
    result=sourceProfessionInstigateBow(actor,attackerDesc,statusTurn,options);
  }else{
    result=sourceProfessionInstigateCommonAttack(actor,attackerDesc,statusTurn,options);
  }

  const forced=statusTurn?.instigateTarget;
  addLog(battleStatusDescName(attackerDesc)+' 的挑撥發作：'
    +(forced?'強制普通攻擊同隊 '+battleStatusDescName(forced)
      :'同隊無有效目標，依普通 ATTACK / TargetAdjust 繼續處理。'),'bad');
  return result||true;
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
  const attackerView=battleStatusDescView(attackerDesc);
  if(!attackerView)return true;

  // V1.75: StatusSeq has already rewritten COM1/COM2 before BATTLE_GetAttackCount.
  // A Player holding an indirect weapon therefore follows the same BOW/BOOMERANG/
  // BOUNDTHROW/BREAKTHROW command path even when confusion pointed COM2 back to side 0.
  if(attackerDesc.kind==='player'&&attackerView.throwWeapon){
    return sourcePerformPlayerRangedConfusionAttack(actor,pick,options)||true;
  }

  const targetDesc=pick.target;
  if(!targetDesc||!battleStatusDescAlive(targetDesc)){
    addLog(battleStatusDescName(attackerDesc)+' 受到混亂影響改為普通攻擊，但沒有可攻擊的目標。');
    return true;
  }

  const defenderView=battleStatusDescView(targetDesc);
  if(!defenderView)return true;

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
  if(primaryResult?.critical||primaryResult?.guarded||primaryResult?.guardian
    ||primaryResult?.playerGuardian||primaryResult?.sourcePetGuardCommand
    ||primaryResult?.sourceCounterBlockedByTrap)return;

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
        const trap=sourcePrepareProfessionTrapReaction(
          {kind:'enemy',unit,unitId:unit.id},{kind:'player'},r
        );
        if(trap.triggered){
          sourceFinishProfessionTrapReaction(trap);
          sourceBattleFinalizeItemCrushRng(r);
          sourceLogProfessionTrapReaction(trap);
          r.sourceCounterBlockedByTrap=true;
        }else{
          const sourceUltimateBefore=n(state.hp);
          state.hp=Math.max(0,sourceUltimateBefore-r.damage);
          sourceTrackDamageSubUltimate({kind:'player'},r.damage,sourceUltimateBefore,r);
          sourceBattleFinalizeItemCrushRng(r);
          addLog(unit.name+(r.critical?' 反擊會心 ':' 反擊 ')+r.damage+'。',state.hp<=0?'bad':'');
        }
      }
    }

    sourceProcessBattleDeathsAtAddProfit();
    if(enemy)syncEnemyTarget();
    if(state.hp<=0||unit.hp<=0)break;
    if(r.sourceCounterBlockedByTrap)break;
    if(r.miss||r.critical)break;

    const next=counterer;
    counterer=target;
    target=next;
  }
}
function resolvePetEnemyCounterChain(primaryAttackerKind,pet,unit,primaryResult,options={}){
  if(!pet||!unit||!enemy||!petIsBattleActive(pet)||unit.hp<=0)return;
  if(primaryResult?.critical||primaryResult?.guarded||primaryResult?.guardian
    ||primaryResult?.playerGuardian||primaryResult?.sourcePetGuardCommand)return;
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
        battleApplyPhysicalHit(
          {kind:'enemy',unit,unitId:unit.id},{kind:'pet',pet,petId:pet.id},r,
          {counter:true,deferAddProfit:true}
        );
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
function applyFriendlyEnemyHit(attackerKind,attackerName,target,r,attackerPetId=null,options={}){
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
  const acupuncture=options.suppressDamageReact
    ?{triggered:false,suppressed:true}
    :sourcePrepareAcupunctureReaction(attackerDesc,targetDesc,r);
  const before=n(actual.hp);
  actual.hp=Math.max(0,before-r.damage);
  sourceTrackDamageSubUltimate(targetDesc,r.damage,before,r);
  sourceFinishAcupunctureReaction(acupuncture);
  battleStatusWakeOnDamage(targetDesc,r.damage);
  const suitPoison=options.suppressSuitPoison
    ?null:sourcePlayerSuitPoisonAfterPhysicalHit(attackerDesc,targetDesc,r);
  if(suitPoison)r.suitPoison=suitPoison;
  if(!options.deferItemCrush)sourceBattleFinalizeItemCrushRng(r);
  if(r.guardian){
    addLog(actual.name+' 發動忠犬護住 '+target.name+'，代受 '+r.damage+' 傷害'+(r.critical?'（會心）':'')+'。',actual.hp<=0?'bad':style);
  }else if(attackerKind==='pet'){
    addLog(attackerName+' 攻擊 '+actual.name+(r.critical?'，會心一擊 ':'，造成 ')+r.damage+' 傷害。','pet');
  }else{
    addLog('你對 '+actual.name+(r.critical?' 發動會心一擊，造成 ':' 造成 ')+r.damage+' 傷害。',r.critical?'good':'');
  }
  sourceLogAcupunctureReaction(acupuncture);
  if(before>0&&actual.hp<=0){
    if(!options.deferDeathCredit){
      sourceMarkEnemyDeathCredit(actual,[attackerKind==='pet'?{kind:'pet',petId:attackerPetId}:{kind:'player'}]);
    }
    addLog(actual.name+' 倒下了，本場後續回合不再行動。','bad');
  }
  return actual;
}
function playerAttackResult(target=targetEnemyUnit(),options={}){
  const targetDesc={kind:'enemy',unit:target,unitId:target?.id};
  return resolveAttackToEnemyWithGuardian(
    playerBattleView(),target,
    Object.assign({},options,{guarding:!!target?.guardThisTurn&&!battleStatusActive(targetDesc,'confusion')})
  );
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

  if(!disableDodge&&n(defender?.skillDuckPower)>0){
    const power=Math.trunc(n(defender.skillDuckPower));
    const roll=cRand(0,99);
    if(roll<=power){
      return {
        dodged:true,damage:0,critical:false,miss:false,guarded:guarding,
        skillDuck:true,skillDuckPower:power,skillDuckRoll:roll,duckRaw:0
      };
    }
  }

  const duck=disableDodge?0:sourceBattleDuckTotal(attacker,defender,options);
  if(!disableDodge&&cRand(1,10000)<=duck){
    const professionDodge=defender?.type==='player'?sourceProfessionPlayerNormalDodgeEvent(state):null;
    return {dodged:true,damage:0,critical:false,miss:false,guarded:guarding,duckRaw:duck,professionDodge};
  }
  const suitDuck=sourceSuitDuckCheck(defender,options);
  if(suitDuck.dodged){
    return {
      dodged:true,damage:0,critical:false,miss:false,guarded:guarding,duckRaw:duck,
      suitDuck:true,suitDuckPower:suitDuck.power,suitDuckRoll:suitDuck.roll
    };
  }
  return {dodged:false,duckRaw:duck,suitDuckPower:suitDuck.power,suitDuckRoll:suitDuck.roll};
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
    disableDodge:true,skipSuitDodge:true
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

function resolveEnemyDirectAttackToPet(unit,pet,options={},attackerOverride=null){
  const attacker=Object.assign({},enemyBattleView(unit),attackerOverride||{});
  const original=petBattleView(pet);
  const guardCommand=sourcePlayerPetGuardCommand(pet);
  const guarding=sourcePlayerPetGuardAdjust(pet);
  const dodge=sourceInitialDodgeOnly(attacker,original,Object.assign({},options,{
    guarding,disableDodge:!!options.disableDodge||guardCommand
  }));
  dodge.sourcePetGuardCommand=guardCommand;
  dodge.sourcePetGuardAdjust=guarding;
  if(dodge.dodged){
    dodge.originalTargetDesc={kind:'pet',pet,petId:pet.id};
    dodge.actualTargetDesc={kind:'pet',pet,petId:pet.id};
    return dodge;
  }

  // fixed BATTLE_AttackSeq: original Pet completes DuckCheck first; GuardianCheck happens after.
  const guardian=attacker?.throwWeapon?null:sourceProfessionScapegoatGuardianForPet(unit,pet);
  const actualDesc=guardian?{kind:'player'}:{kind:'pet',pet,petId:pet.id};
  const defender=guardian?playerBattleView():original;
  const r=resolveNormalAttack(attacker,defender,Object.assign({},options,{
    guarding:guardian?false:guarding,
    disableDodge:true,skipSuitDodge:true
  }));
  r.duckRaw=dodge.duckRaw;
  r.sourcePetGuardCommand=guardCommand;
  r.sourcePetGuardAdjust=guarding;
  r.originalTargetDesc={kind:'pet',pet,petId:pet.id};
  r.actualTargetDesc=actualDesc;

  if(guardian){
    // Guardian substitution forces NORMAL damage=1 when the redirected calculation reaches 0.
    if(r.damage<=0){r.damage=1;r.miss=false}
    r.playerGuardian=true;
    r.professionScapegoat=true;
    r.protectedPetId=pet.id;
    r.protectedTarget='pet';
  }
  return r;
}
function enemyAttackResult(unit=targetEnemyUnit(),options={}){
  return resolveNormalAttack(enemyBattleView(unit),playerBattleView(),options);
}
function enemyAttackPetResult(unit,pet,options={}){
  if(options.sourceGuardianReal===true){
    const directOptions=Object.assign({},options);
    delete directOptions.sourceGuardianReal;
    return resolveEnemyDirectAttackToPet(unit,pet,directOptions);
  }
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
  const compliance=state?.playerEquipCompliance||playerComplianceParameter(state)?.equip||{};
  const arm=compliance.arm||null;
  if(arm){
    const min=Number(arm.attackNumMin),max=Number(arm.attackNumMax);
    if(Number.isFinite(min)&&Number.isFinite(max)){
      const roll=cRand(Math.trunc(min),Math.trunc(max));
      const attackMax=Math.max(1,Math.trunc(n(roll)));
      return {attackMax,roll,burstRoll:null,luckWork:null,weapon:true,weaponType:Math.trunc(n(arm.type))};
    }
    // New V1.73 generic equipment is creation-materialized, so this is only a legacy unknown boundary.
    return {attackMax:1,roll:null,burstRoll:null,luckWork:null,weapon:true,weaponType:Math.trunc(n(arm.type)),sourceUnknown:true};
  }

  const level=Math.max(1,Math.trunc(n(state?.level)));
  if(level<10)return {attackMax:1,roll:null,burstRoll:null,luckWork:null,weapon:false};

  // fixed unarmed fallback reads raw CHAR_LUCK, not WORKFIXLUCK.
  let luckWork=Math.trunc(n(state?.luck))*5;
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
  return {attackMax,roll,burstRoll,luckWork,weapon:false};
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
  const weaponType=Math.trunc(n(playerBattleView()?.weaponType));
  if(weaponType===4)return sourcePerformPlayerBowWeaponAttack(actor,options);
  if(weaponType===17)return sourcePerformPlayerBoomerangWeaponAttack(actor,options);
  if(weaponType===18||weaponType===19)return sourcePerformPlayerThrowWeaponAttack(actor,options);

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
function sourceBowTargetListFromBattleSlots(defNo,attackNo){
  const sourceDefNo=Math.trunc(Number(defNo));
  const sourceAttackNo=Math.trunc(Number(attackNo));
  if(!Number.isFinite(sourceDefNo)||sourceDefNo<0||sourceDefNo>19){
    return {defNo:sourceDefNo,random:null,attackNo:sourceAttackNo,slots:[-1]};
  }
  const defsub=sourceDefNo%5;
  const deftop=sourceDefNo-defsub;
  // fixed BATTLE_TargetListSet(): exactly one RAND(0,1) after AttackNum was already primed.
  const random=cRand(0,1);
  const slots=[];
  for(let j=0;j<5;j++){
    let first=SOURCE_BOW_W[defsub*10+random*5+j]+deftop;
    let second=(deftop===0||deftop===10)?first+5:first-5;
    if(first===sourceAttackNo)first=-1;
    if(second===sourceAttackNo)second=-1;
    slots.push(first,second);
  }
  slots.push(-1);
  return {defNo:sourceDefNo,defsub,deftop,random,attackNo:sourceAttackNo,slots};
}
function sourceBowTargetList(actor,unit,target){
  return sourceBowTargetListFromBattleSlots(
    sourceEnemyCommandTargetBattleSlot(actor,target),
    10+Math.max(0,Math.trunc(n(unit?.battleSlot)))
  );
}
function sourcePlayerCommandTargetBattleSlot(actor){
  const rawId=actor?.targetUnitId;
  const units=Array.isArray(enemy?.units)&&enemy.units.length?enemy.units:(enemy?[enemy]:[]);
  const unit=units.find(u=>u&&u.id===rawId)||null;
  return unit?10+Math.max(0,Math.trunc(n(unit.battleSlot))):-1;
}
function sourcePlayerEnemyTargetableFromBattleSlot(slot){
  const no=Math.trunc(Number(slot));
  if(!Number.isFinite(no)||no<10||no>19)return null;
  const units=Array.isArray(enemy?.units)&&enemy.units.length?enemy.units:(enemy?[enemy]:[]);
  const unit=units.find(u=>u&&10+Math.max(0,Math.trunc(n(u.battleSlot)))===no)||null;
  return unit&&n(unit.hp)>0&&!enemyUnitHidden(unit)?unit:null;
}
function sourcePlayerBowTargetList(actor){
  return sourceBowTargetListFromBattleSlots(sourcePlayerCommandTargetBattleSlot(actor),0);
}
function sourcePlayerDefaultAttacker(){
  return sourcePetRandomEnemyTarget()?.unit||null;
}
function sourcePlayerBreakthrowParalysisDesc(targetDesc,r){
  if(!targetDesc||!r||n(r.damage)<=0)return {attempted:false,applied:false};
  // fixed BATTLE_StatusAttackCheck() has a dedicated paralysis branch: 20 - resistance.
  // It rejects an already-statused target before consuming RAND(1,100).
  const check=battleStatusChance({kind:'player'},targetDesc,'paralysis');
  const applied=!!(check.allowed&&check.success&&battleStatusApply(targetDesc,'paralysis',0));
  if(applied)addLog(battleStatusDescName(targetDesc)+' 被投擲石打中後陷入麻痺 1 回合。','good');
  return {attempted:true,check,applied};
}
function sourcePlayerBreakthrowParalysis(target,r){
  const targetDesc=target?{kind:'enemy',unit:target,unitId:target.id}:null;
  return sourcePlayerBreakthrowParalysisDesc(targetDesc,r);
}
function sourcePlayerConfusionTargetableFromBattleSlot(slot){
  const desc=sourceBattleStatusDescFromSlot(slot);
  if(!desc||!battleStatusDescAlive(desc))return null;
  if(desc.kind==='pet'&&sourcePlayerPetHidden(desc.pet))return null;
  if(desc.kind==='enemy'&&enemyUnitHidden(desc.unit))return null;
  return desc;
}
function sourcePlayerConfusionDefaultAttackerDesc(){
  const unit=sourcePetRandomEnemyTarget()?.unit||null;
  return unit?{kind:'enemy',unit,unitId:unit.id}:null;
}
function sourcePlayerConfusionRangedResult(targetDesc,options={},attackOptions={}){
  const attackerView=playerBattleView();
  const defenderView=battleStatusDescView(targetDesc);
  if(!attackerView||!defenderView)return null;
  const guarding=battleConfusionGuarding(targetDesc,options);
  if(targetDesc.kind==='enemy'){
    return resolveAttackToEnemyWithGuardian(
      attackerView,targetDesc.unit,Object.assign({},attackOptions,{guarding})
    );
  }
  return resolveNormalAttack(attackerView,defenderView,Object.assign({},attackOptions,{guarding}));
}
function sourcePlayerConfusionResolvedTargetDesc(targetDesc,r){
  if(targetDesc?.kind==='enemy'&&r?.actualTarget&&r.actualTarget!==targetDesc.unit){
    return {kind:'enemy',unit:r.actualTarget,unitId:r.actualTarget.id};
  }
  return targetDesc;
}
function sourceApplyPlayerConfusionRangedHit(targetDesc,r,{breakthrow=false}={}){
  if(!targetDesc||!r)return {resolvedTarget:targetDesc,paralysis:null};
  const resolvedTarget=sourcePlayerConfusionResolvedTargetDesc(targetDesc,r);
  let paralysis=null;
  if(breakthrow){
    // fixed BATTLE_Attack order for BREAKTHROW:
    // DamageSub/WakeUp -> StatusAttackCheck(paralysis) -> ItemCrush -> AddProfit.
    battleApplyPhysicalHit({kind:'player'},resolvedTarget,r,{
      confusion:true,deferItemCrush:true,deferAddProfit:true,suppressSuitPoison:true
    });
    paralysis=sourcePlayerBreakthrowParalysisDesc(resolvedTarget,r);
    sourceBattleFinalizeItemCrushRng(r);
    sourceProcessBattleDeathsAtAddProfit();
  }else{
    battleApplyPhysicalHit({kind:'player'},resolvedTarget,r,{confusion:true});
  }
  return {resolvedTarget,paralysis};
}
function sourcePerformPlayerConfusionBowAttack(actor,pick,options={}){
  const attackMax=Math.max(1,Math.trunc(n(actor?.sourceAttackMax))||1);
  // StatusSeq can leave COM2=-1 when the randomly chosen side has no valid target.
  // BOW TargetListSet does NOT DefaultAttacker that case and does NOT consume RAND(0,1).
  const rawSlot=pick?.fallback?-1:sourceBattleStatusSlot(pick?.target);
  const plan=sourceBowTargetListFromBattleSlots(rawSlot,0);
  const hits=[];
  let attackCount=0,sourceLoopExit='target-list-end';

  if(rawSlot<0){
    addLog('你的混亂發作，但弓的原始 COM2 無有效目標，因此本次沒有射擊。');
    return {handled:true,weaponCommand:'BOW',protocol:'BB-w0',attackMax,attackCount,
      rawSlot,bowRandom:plan.random,bowTargetSlots:plan.slots.slice(),hits,sourceLoopExit:'raw-com2-invalid'};
  }

  addLog('你的混亂發作：弓依原 C 的 aBowW 順序改打戰場目標。');
  for(const slot of plan.slots){
    if(slot<0){sourceLoopExit='target-list-end';break;}
    const targetDesc=sourcePlayerConfusionTargetableFromBattleSlot(slot);
    if(!targetDesc)continue;
    const r=sourcePlayerConfusionRangedResult(targetDesc,options);
    if(!r)continue;
    const applied=sourceApplyPlayerConfusionRangedHit(targetDesc,r);
    hits.push({battleSlot:slot,targetKey:battleStatusKey(targetDesc),r,
      resolvedTargetKey:battleStatusKey(applied.resolvedTarget)});
    attackCount++;
    if(attackCount>=attackMax){sourceLoopExit='attack-max';break;}
    if(!battleStatusDescAlive({kind:'player'})){sourceLoopExit='attacker-dead';break;}
  }
  // Common BOW path reaches Counter, but BATTLE_IsThrowWepon blocks it before Counter RNG.
  return {handled:true,weaponCommand:'BOW',protocol:'BB-w0',attackMax,attackCount,
    rawSlot,bowRandom:plan.random,bowTargetSlots:plan.slots.slice(),hits,sourceLoopExit};
}
function sourcePerformPlayerConfusionBoomerangAttack(actor,pick,options={}){
  // BATTLE_GetAttackCount already consumed the weapon RAND before ATTACK becomes BOOMERANG.
  // The dedicated BOOMERANG case ignores that attack_max value.
  let rawSlot=pick?.fallback?-1:sourceBattleStatusSlot(pick?.target);
  let defNo=rawSlot;
  let fallbackTarget=null;
  if(defNo<0){
    fallbackTarget=sourcePlayerConfusionDefaultAttackerDesc();
    if(!fallbackTarget){
      return {handled:true,weaponCommand:'BOOMERANG',protocol:'BO',rawSlot,attackCount:0,hits:[],sourceLoopExit:'no-target'};
    }
    defNo=sourceBattleStatusSlot(fallbackTarget);
  }

  let row=(defNo>=0&&defNo<=19)?Math.trunc(defNo/5):-1;
  const attackerRow=0;
  if(row===attackerRow){
    addLog('你的混亂發作，但回力標目標與攻擊者位於同一列，依原 C 本次無動作。');
    return {handled:true,weaponCommand:'BOOMERANG',protocol:'BO',rawSlot,row,attackCount:0,hits:[],sourceLoopExit:'same-row'};
  }

  const rowHasTarget=r=>r>=0&&r<SOURCE_BOOMERANG_VS_TBL.length
    &&SOURCE_BOOMERANG_VS_TBL[r].some(slot=>!!sourcePlayerConfusionTargetableFromBattleSlot(slot));
  if(!rowHasTarget(row)){
    fallbackTarget=sourcePlayerConfusionDefaultAttackerDesc();
    if(!fallbackTarget){
      return {handled:true,weaponCommand:'BOOMERANG',protocol:'BO',rawSlot,row,attackCount:0,hits:[],sourceLoopExit:'no-target'};
    }
    defNo=sourceBattleStatusSlot(fallbackTarget);
    row=Math.trunc(defNo/5);
  }
  if(row<0||row>=SOURCE_BOOMERANG_VS_TBL.length){
    return {handled:true,weaponCommand:'BOOMERANG',protocol:'BO',rawSlot,row,attackCount:0,hits:[],sourceLoopExit:'invalid-row'};
  }

  const order=SOURCE_BOOMERANG_VS_TBL[row].slice(); // Player side 0: k=0,j=+1.
  const hits=[];
  addLog('你的混亂發作：回力標依原 C 順序掃過目標列。');
  for(const slot of order){
    const targetDesc=sourcePlayerConfusionTargetableFromBattleSlot(slot);
    if(!targetDesc)continue;
    const r=sourcePlayerConfusionRangedResult(targetDesc,options,{damageMultiplier:.3});
    if(!r)continue;
    const applied=sourceApplyPlayerConfusionRangedHit(targetDesc,r);
    hits.push({battleSlot:slot,targetKey:battleStatusKey(targetDesc),r,
      resolvedTargetKey:battleStatusKey(applied.resolvedTarget)});
    if(!battleStatusDescAlive({kind:'player'}))break;
  }
  // Dedicated BOOMERANG case breaks before the common Counter loop.
  return {handled:true,weaponCommand:'BOOMERANG',protocol:'BO',damageMultiplier:.3,
    rawSlot,row,targetSlots:order,hits,attackCount:hits.length,sourceLoopExit:'row-complete'};
}
function sourcePerformPlayerConfusionThrowAttack(actor,pick,options={},weaponType){
  const type=Math.trunc(n(weaponType));
  const attackMax=Math.max(1,Math.trunc(n(actor?.sourceAttackMax))||1);
  // TargetListSet pre-fills with the StatusSeq raw COM2. If raw COM2 is -1,
  // the first TargetAdjust may DefaultAttacker, but the next aDefList entry is already -1.
  const rawSlot=pick?.fallback?-1:sourceBattleStatusSlot(pick?.target);
  const hits=[];
  let attackCount=0,sourceLoopExit='target-adjust-failed';

  addLog('你的混亂發作：'+(type===19?'投擲石':'投擲斧')+'依原 C TargetAdjust 執行。');
  while(attackCount<attackMax&&battleStatusDescAlive({kind:'player'})){
    let targetDesc=rawSlot>=0?sourcePlayerConfusionTargetableFromBattleSlot(rawSlot):null;
    if(!targetDesc)targetDesc=sourcePlayerConfusionDefaultAttackerDesc();
    if(!targetDesc){sourceLoopExit='target-adjust-failed';break;}

    const r=sourcePlayerConfusionRangedResult(targetDesc,options);
    if(!r){sourceLoopExit='target-adjust-failed';break;}
    const applied=sourceApplyPlayerConfusionRangedHit(targetDesc,r,{breakthrow:type===19});
    hits.push({battleSlot:sourceBattleStatusSlot(targetDesc),targetKey:battleStatusKey(targetDesc),r,
      resolvedTargetKey:battleStatusKey(applied.resolvedTarget),paralysis:applied.paralysis});
    attackCount++;

    if(attackCount>=attackMax){sourceLoopExit='attack-max';break;}
    if(rawSlot<0){
      // aDefList[++k] is the original -1 sentinel, so source stops after this first fallback hit.
      sourceLoopExit='target-list-end';
      break;
    }
  }
  // BOUNDTHROW/BREAKTHROW common path would enter Counter, but throw-weapon gate returns before RNG.
  return {handled:true,weaponCommand:type===19?'BREAKTHROW':'BOUNDTHROW',
    protocol:type===19?'BB-w2':'BB-w1',rawSlot,attackMax,attackCount,hits,sourceLoopExit};
}
function sourcePerformPlayerRangedConfusionAttack(actor,pick,options={}){
  const weaponType=Math.trunc(n(playerBattleView()?.weaponType));
  if(weaponType===4)return sourcePerformPlayerConfusionBowAttack(actor,pick,options);
  if(weaponType===17)return sourcePerformPlayerConfusionBoomerangAttack(actor,pick,options);
  if(weaponType===18||weaponType===19){
    return sourcePerformPlayerConfusionThrowAttack(actor,pick,options,weaponType);
  }
  return null;
}
function sourcePerformPlayerBowWeaponAttack(actor,options={}){
  const attackMax=Math.max(1,Math.trunc(n(actor?.sourceAttackMax))||1);
  // raw COM2 is preserved even if that unit dies before this actor executes.
  const plan=sourcePlayerBowTargetList(actor);
  const hits=[];
  let attackCount=0,lastTarget=null,lastActual=null,lastResult=null;
  let sourceLoopExit='target-list-end';

  for(const slot of plan.slots){
    if(slot<0){
      sourceLoopExit='target-list-end';
      break;
    }
    const target=sourcePlayerEnemyTargetableFromBattleSlot(slot);
    if(!target)continue;
    const r=playerAttackResult(target);
    const actual=applyFriendlyEnemyHit('player','你',target,r);
    sourceProcessBattleDeathsAtAddProfit();
    hits.push({battleSlot:slot,targetId:target.id,r,actual});
    attackCount++;
    lastTarget=target;
    lastActual=actual;
    lastResult=r;

    // Source checks attack_max immediately after the real BATTLE_Attack/AddProfit segment,
    // before loading the next aDefList slot.
    if(attackCount>=attackMax){
      sourceLoopExit='attack-max';
      break;
    }
    if(state.hp<=0||!enemy){
      sourceLoopExit='attacker-dead';
      break;
    }
  }

  const counterUnit=lastActual||lastTarget;
  if(sourceLoopExit==='attack-max'&&lastResult&&state.hp>0&&counterUnit?.hp>0&&options.allowCounter!==false){
    // The common loop reaches Counter, but BATTLE_IsThrowWepon blocks it before Counter RNG.
    resolvePlayerEnemyCounterChain('player',counterUnit,lastResult);
  }
  return {
    weaponCommand:'BOW',protocol:'BB-w0',attackMax,attackCount,
    bowRandom:plan.random,bowTargetSlots:plan.slots.slice(),hits,
    sourceLoopExit,lastTarget,lastActual,lastResult
  };
}
function sourcePerformPlayerBoomerangWeaponAttack(actor,options={}){
  // The earlier BATTLE_GetAttackCount weapon RAND has already been consumed.
  // BATTLE_COM_BOOMERANG ignores attack_max and sweeps its five-slot row once.
  let defNo=sourcePlayerCommandTargetBattleSlot(actor);
  let chosen=defNo>=0?sourcePlayerEnemyTargetableFromBattleSlot(defNo):null;
  if(defNo<0){
    chosen=sourcePlayerDefaultAttacker();
    if(!chosen)return {weaponCommand:'BOOMERANG',protocol:'BO',attackCount:0,hits:[],sourceLoopExit:'no-target'};
    defNo=10+Math.max(0,Math.trunc(n(chosen.battleSlot)));
  }

  let row=(defNo>=0&&defNo<=19)?Math.trunc(defNo/5):-1;
  const attackerRow=0; // Player battle slot 0.
  if(row===attackerRow){
    return {weaponCommand:'BOOMERANG',protocol:'BO',attackCount:0,hits:[],row,sourceLoopExit:'same-side-row'};
  }

  const rowHasTarget=r=>r>=0&&r<SOURCE_BOOMERANG_VS_TBL.length
    && SOURCE_BOOMERANG_VS_TBL[r].some(slot=>!!sourcePlayerEnemyTargetableFromBattleSlot(slot));
  if(!rowHasTarget(row)){
    chosen=sourcePlayerDefaultAttacker();
    if(!chosen)return {weaponCommand:'BOOMERANG',protocol:'BO',attackCount:0,hits:[],sourceLoopExit:'no-target'};
    defNo=10+Math.max(0,Math.trunc(n(chosen.battleSlot)));
    row=Math.trunc(defNo/5);
  }
  if(row<0||row>=SOURCE_BOOMERANG_VS_TBL.length){
    return {weaponCommand:'BOOMERANG',protocol:'BO',attackCount:0,hits:[],sourceLoopExit:'invalid-row'};
  }

  // Player is side 0: source uses k=0,j=+1. Enemy side 1 is the existing reversed path.
  const order=SOURCE_BOOMERANG_VS_TBL[row].slice();
  const hits=[];
  for(const slot of order){
    const target=sourcePlayerEnemyTargetableFromBattleSlot(slot);
    if(!target)continue;
    const r=playerAttackResult(target,{damageMultiplier:.3});
    const actual=applyFriendlyEnemyHit('player','你',target,r);
    sourceProcessBattleDeathsAtAddProfit();
    hits.push({battleSlot:slot,targetId:target.id,r,actual});
    if(state.hp<=0||!enemy)break;
  }
  // Dedicated BOOMERANG case breaks before the common Counter loop.
  return {
    weaponCommand:'BOOMERANG',protocol:'BO',damageMultiplier:.3,row,
    targetSlots:order,hits,attackCount:hits.length,sourceLoopExit:'row-complete'
  };
}
function sourcePerformPlayerThrowWeaponAttack(actor,options={}){
  const type=Math.trunc(n(playerBattleView()?.weaponType));
  const attackMax=Math.max(1,Math.trunc(n(actor?.sourceAttackMax))||1);
  const hits=[];
  let attackCount=0,lastTarget=null,lastActual=null,lastResult=null;
  let sourceLoopExit='target-adjust-failed';

  while(enemy&&state.hp>0&&attackCount<attackMax){
    // Non-BOW TargetListSet repeats the original raw COM2. Each segment reruns TargetAdjust,
    // so a dead/hidden original target consumes a fresh DefaultAttacker RNG every segment.
    const target=sourceFriendlyEnemyTargetAdjust(actor);
    if(!target){
      sourceLoopExit='target-adjust-failed';
      break;
    }
    const r=playerAttackResult(target);
    const deferItemCrush=type===19;
    const actual=applyFriendlyEnemyHit('player','你',target,r,null,{
      deferItemCrush,suppressSuitPoison:type===19
    });
    let paralysis=null;
    if(type===19){
      // fixed BATTLE_Attack order: DamageSub/WakeUp -> BREAKTHROW paralysis -> ItemCrush.
      paralysis=sourcePlayerBreakthrowParalysis(actual||target,r);
      sourceBattleFinalizeItemCrushRng(r);
    }
    sourceProcessBattleDeathsAtAddProfit();
    hits.push({targetId:target.id,r,actual,paralysis});
    attackCount++;
    lastTarget=target;
    lastActual=actual;
    lastResult=r;

    if(attackCount>=attackMax){
      sourceLoopExit='attack-max';
      break;
    }
    if(state.hp<=0||!enemy){
      sourceLoopExit='attacker-dead';
      break;
    }
    if(!livingEnemyUnits().length){
      sourceLoopExit='no-living-target';
      break;
    }
  }

  const counterUnit=lastActual||lastTarget;
  if(sourceLoopExit==='attack-max'&&lastResult&&state.hp>0&&counterUnit?.hp>0&&options.allowCounter!==false){
    // Common path reaches Counter; throw-weapon gate makes it fail without Counter RNG.
    resolvePlayerEnemyCounterChain('player',counterUnit,lastResult);
  }
  return {
    weaponCommand:type===19?'BREAKTHROW':'BOUNDTHROW',
    protocol:type===19?'BB-w2':'BB-w1',
    attackMax,attackCount,hits,sourceLoopExit,lastTarget,lastActual,lastResult
  };
}
function enemyWeaponApplyHit(unit,target,options={},attackOptions={}){
  if(!target)return null;
  const playerGuarding=!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
  const beforeApply=typeof options.beforeApply==='function'?options.beforeApply:null;

  if(target.kind==='pet'&&target.pet&&petIsBattleActive(target.pet)){
    const pet=target.pet;
    const r=enemyAttackPetResult(unit,pet,Object.assign({},attackOptions,{sourceGuardianReal:true}));
    const originalDesc={kind:'pet',pet,petId:pet.id};
    const targetDesc=enemyDirectActualTarget(originalDesc,r)||originalDesc;
    if(r.playerGuardian){
      addLog('你發動舍己為友，代替 '+pet.name+' 承受 '+unit.name+' 的攻擊。','good');
    }
    const beforeApplyResult=beforeApply?beforeApply({target:'pet',pet,targetDesc,r},target):null;
    battleApplyPhysicalHit(
      {kind:'enemy',unit,unitId:unit.id},targetDesc,r,
      {deferItemCrush:true,deferAddProfit:true}
    );
    return {target:'pet',pet,targetDesc,r,beforeApply:beforeApplyResult};
  }

  if(target.kind!=='player'||state.hp<=0)return null;
  const r=enemyAttackResult(unit,Object.assign({},attackOptions,{guarding:playerGuarding}));
  const targetDesc={kind:'player'};
  const beforeApplyResult=beforeApply?beforeApply({target:'player',targetDesc,r},target):null;
  const trap=sourcePrepareProfessionTrapReaction(
    {kind:'enemy',unit,unitId:unit.id},targetDesc,r
  );
  if(trap.triggered){
    sourceFinishProfessionTrapReaction(trap);
    sourceLogProfessionTrapReaction(trap);
    return {target:'player',targetDesc:{kind:'enemy',unit,unitId:unit.id},r,beforeApply:beforeApplyResult,trap};
  }
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
  if(!r||!targetDesc||r.playerGuardian||r.sourceCounterBlockedByTrap)return null;

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
    const r=enemyAttackPetResult(unit,pet,Object.assign({},attackOptions,{sourceGuardianReal:true}));
    const originalDesc={kind:'pet',pet,petId:pet.id};
    const targetDesc=enemyDirectActualTarget(originalDesc,r)||originalDesc;
    if(r.playerGuardian){
      addLog('你發動舍己為友，代替 '+pet.name+' 承受 '+unit.name+' 的攻擊。','good');
    }
    battleApplyPhysicalHit(
      {kind:'enemy',unit,unitId:unit.id},targetDesc,r,
      {deferAddProfit:true}
    );
    sourceProcessBattleDeathsAtAddProfit();
    if(!r.playerGuardian&&petIsBattleActive(pet)&&unit.hp>0)resolvePetEnemyCounterChain('enemy',pet,unit,r);
    return {target:'pet',actualTarget:targetDesc.kind,pet,r,playerGuardian:!!r.playerGuardian};
  }

  const r=resolveEnemyDirectAttackToPlayer(unit,Object.assign({},attackOptions,{guarding:playerGuarding}));
  const playerTrap=(!r.guardian)?sourcePrepareProfessionTrapReaction(
    {kind:'enemy',unit,unitId:unit.id},{kind:'player'},r
  ): {triggered:false};
  if(playerTrap.triggered){
    sourceFinishProfessionTrapReaction(playerTrap);
    sourceBattleFinalizeItemCrushRng(r);
    sourceProcessBattleDeathsAtAddProfit();
    sourceLogProfessionTrapReaction(playerTrap);
    return {target:'player',actualTarget:'enemy',r,trap:playerTrap,sourceCounterBlockedByDamageReact:true};
  }
  if(r.guardian){
    const pet=r.guardian;
    addLog(pet.name+' 發動忠犬，代替你承受 '+unit.name+' 的攻擊。','pet');
    battleApplyPhysicalHit(
      {kind:'enemy',unit,unitId:unit.id},{kind:'pet',pet,petId:pet.id},r,
      {deferAddProfit:true}
    );
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
function enemyApplySkillHit(unit,chosen,r,label,options={}){
  if(r?.playerGuardian&&chosen?.kind==='pet')chosen={kind:'player'};
  if(chosen.kind==='pet'&&chosen.pet){
    const pet=chosen.pet;
    const targetDesc={kind:'pet',pet,petId:pet.id};
    if(r.dodged){
      addLog(pet.name+' 閃避了 '+unit.name+' 的'+label+'。','pet');
    }else if(r.miss){
      addLog(unit.name+' 的'+label+'沒有造成傷害。');
    }else{
      const acupuncture=options.ignoreDamageReact
        ?{triggered:false,sourceIgnoredByFirekill:true}
        :sourcePrepareAcupunctureReaction(
          {kind:'enemy',unit,unitId:unit.id},targetDesc,r
        );
      const before=n(pet.hp);
      pet.hp=Math.max(0,before-r.damage);
      sourceTrackDamageSubUltimate(targetDesc,r.damage,before,r);
      sourceFinishAcupunctureReaction(acupuncture);
      battleStatusWakeOnDamage(targetDesc,r.damage);
      addLog(unit.name+' 的'+label+(r.critical?'會心 ':'')+'命中 '+pet.name+'，造成 '+r.damage+' 傷害。',pet.hp<=0?'bad':'');
      sourceLogAcupunctureReaction(acupuncture);
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
    const trap=sourcePrepareProfessionTrapReaction(
      {kind:'enemy',unit,unitId:unit.id},{kind:'player'},r,
      {ignoreDamageReact:!!options.ignoreDamageReact}
    );
    if(trap.triggered){
      sourceFinishProfessionTrapReaction(trap);
      sourceLogProfessionTrapReaction(trap);
      return trap;
    }
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
    addLog(unit.name+' 使用 '+label+'，但 BATTLE_TargetAdjust 找不到有效目標。');
    return {kind:'skill',skillId:actor.skillId,success:false,noTarget:true};
  }

  const targetType=chosen.kind==='player'?'CHAR_TYPEPLAYER'
    :(chosen.kind==='pet'?'CHAR_TYPEPET':'CHAR_TYPEENEMY');
  const per=chosen.kind==='player'?50:0;

  // Fixed BATTLE_Steal consumes this roll even when per==0.
  const successRoll=cRand(1,100);
  if(!(successRoll<per)){
    addLog(
      unit.name+' 使用 '+label+'，沒有偷到任何東西（RAND(1,100)='+
      successRoll+'，成功率 '+per+'）。'
    );
    return {
      kind:'skill',skillId:actor.skillId,success:false,per,successRoll,targetType,
      sourceNoSecondRoll:true,attackerExited:false
    };
  }

  // Only a successful first roll consumes the mode roll.
  const modeRoll=cRand(1,100);
  if(modeRoll<50){
    const percentRoll=cRand(8,12);
    const amount=Math.trunc(Math.max(0,n(state.gold))*percentRoll*.01);
    if(amount<=0){
      addLog(unit.name+' 想偷石幣，但你身上沒有可被偷走的石幣。');
      return {
        kind:'skill',skillId:actor.skillId,success:false,mode:'gold',per,successRoll,
        modeRoll,percentRoll,amount:0,targetType,attackerExited:false
      };
    }

    state.gold=Math.max(0,Math.trunc(n(state.gold))-amount);
    addLog(unit.name+' 從你身上偷走 '+amount+' 石幣，隨後依原 C 離開戰鬥。','bad');
    const exit=finishEnemyDirectExit(unit,label+'成功後離場');
    return Object.assign({
      kind:'skill',skillId:actor.skillId,success:true,mode:'gold',amount,
      per,successRoll,modeRoll,percentRoll,targetType,attackerExited:true
    },exit);
  }

  // Fixed source scans CHAR_STARTITEMARRAY..CHAR_MAXITEMHAVE-1 only: backpack ItemBox,
  // not equipment and not aggregate-only legacy inventory.
  const slots=sourcePlayerItemSlots(state);
  const candidates=[];
  for(let slotIndex=PLAYER_BACKPACK_START;slotIndex<PLAYER_ITEM_SLOT_COUNT;slotIndex++){
    const itemIndex=Math.trunc(Number(slots[slotIndex]));
    if(!Number.isFinite(itemIndex))continue;
    const existing=sourceItemRuntimeSlot(itemIndex);
    if(!existing||existing.owner!=='player')continue;
    candidates.push({slotIndex,itemIndex,itemId:Math.trunc(Number(existing.itemId))});
  }

  if(!candidates.length){
    addLog(unit.name+' 想偷道具，但你的 15 格 existing-item 背包沒有可偷取物。');
    return {
      kind:'skill',skillId:actor.skillId,success:false,mode:'item',
      per,successRoll,modeRoll,targetType,itemCandidates:0,attackerExited:false
    };
  }

  const itemRoll=cRand(0,candidates.length-1);
  const picked=candidates[itemRoll];
  const itemName=Number.isFinite(picked.itemId)
    ?battleInventoryItemLabel(String(picked.itemId))
    :('existing item '+picked.itemIndex);

  // CHAR_setItemIndex(slot,-1) + ITEM_endExistItemsOne(existing).
  slots[picked.slotIndex]=null;
  if(Number.isFinite(picked.itemId)&&n(state.inventory?.[String(picked.itemId)])>0){
    state.inventory[String(picked.itemId)]=Math.max(
      0,Math.trunc(n(state.inventory[String(picked.itemId)]))-1
    );
    if(state.inventory[String(picked.itemId)]<=0)delete state.inventory[String(picked.itemId)];
  }
  sourceItemRuntimeFree(picked.itemIndex);

  addLog(unit.name+' 從你的背包偷走 '+itemName+'，隨後依原 C 離開戰鬥。','bad');
  const exit=finishEnemyDirectExit(unit,label+'成功後離場');
  return Object.assign({
    kind:'skill',skillId:actor.skillId,success:true,mode:'item',
    per,successRoll,modeRoll,itemRoll,itemCandidates:candidates.length,
    itemIndex:picked.itemIndex,itemId:picked.itemId,playerSlotIndex:picked.slotIndex,
    targetType,attackerExited:true,sourceExistingItemDestroyed:true
  },exit);
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
      r=enemyAttackPetResult(unit,target.pet,{sourceGuardianReal:true});
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
    if(options.sourceDirectGuardian){
      const directOptions=Object.assign({},options);
      delete directOptions.sourceDirectGuardian;
      return resolveEnemyDirectAttackToPet(unit,chosen.pet,directOptions,attackerOverride);
    }
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
    disableDodge:true,skipSuitDodge:true
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
    guarding:false,disableDodge:true,skipSuitDodge:true,preGuardDamageMultiplier:multiplier
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
function sourceSetMagicPetTargetableDescFromSlot(slot){
  const desc=sourceBattleStatusDescFromSlot(slot);
  if(!desc)return null;
  if(desc.kind==='player')return state.hp>0?desc:null;
  if(desc.kind==='pet')return desc.pet&&petIsBattleActive(desc.pet)&&!sourcePlayerPetHidden(desc.pet)?desc:null;
  if(desc.kind==='enemy')return desc.unit&&n(desc.unit.hp)>0&&!enemyUnitHidden(desc.unit)?desc:null;
  return null;
}
function sourceSetMagicPetMultiList(toNo){
  const no=Math.trunc(Number(toNo));
  const slots=(start,end)=>{
    const out=[];
    for(let slot=start;slot<end;slot++)if(sourceSetMagicPetTargetableDescFromSlot(slot))out.push(slot);
    return out;
  };
  if(no>=0&&no<=19){
    if(sourceSetMagicPetTargetableDescFromSlot(no))return {ok:true,toNo:no,slots:[no],fallback:false,rolls:[]};
    const compact=slots(no<10?0:10,no<10?10:20);
    if(!compact.length)return {ok:false,toNo:-1,slots:[],fallback:true,rolls:[],reason:'all-die'};
    const rolls=[];
    for(;;){
      const roll=cRand(0,9); // fixed __ATTACK_MAGIC path: nLifeArea[rand()%10]
      rolls.push(roll);
      const picked=compact[roll];
      if(picked!=null)return {ok:true,toNo:picked,slots:[picked],fallback:true,rolls,compact:compact.slice()};
    }
  }
  if(no===20)return {ok:true,toNo:no,slots:slots(0,10),fallback:false,rolls:[]};
  if(no===21)return {ok:true,toNo:no,slots:slots(10,20),fallback:false,rolls:[]};
  if(no===22)return {ok:true,toNo:no,slots:slots(0,20),fallback:false,rolls:[]};
  const rows={23:[10,15,15,20,24],24:[15,20,10,15,23],25:[5,10,0,5,26],26:[0,5,5,10,25]};
  const row=rows[no];
  if(row){
    let picked=slots(row[0],row[1]);
    if(picked.length)return {ok:true,toNo:no,slots:picked,rowFallback:false,rolls:[]};
    picked=slots(row[2],row[3]);
    if(picked.length)return {ok:true,toNo:row[4],slots:picked,rowFallback:true,rolls:[]};
    return {ok:false,toNo:-1,slots:[],rowFallback:true,rolls:[],reason:'all-die'};
  }
  return {ok:false,toNo:no,slots:[],fallback:false,rolls:[],reason:'invalid-target'};
}
function sourceSetMagicPetRecoveryRate(desc){
  const raw=battleStatusRawStats(desc);
  const vital=Math.trunc(n(raw.vital));
  return 1+(desc?.kind==='player'?0.00010:0.00005)*vital;
}
function sourceSetMagicPetHeal(desc,power){
  const low=Math.trunc(n(power)*0.9),high=Math.trunc(n(power)*1.1);
  const roll=cRand(Math.min(low,high),Math.max(low,high));
  const rate=sourceSetMagicPetRecoveryRate(desc);
  const amount=Math.trunc(roll*rate);
  const before=Math.max(0,Math.trunc(n(battleStatusHp(desc))));
  const maxHp=sourceUltimateMaxHp(desc);
  const after=Math.min(maxHp,before+amount);
  battleStatusSetHp(desc,after);

  // fixed BATTLE_MultiRecovery tail: in risk battle, the first recovery that targets a Pet
  // adds AI_FIX_PETRECOVERY (+10 VARIABLEAI units) and sets CHAR_BATTLEFLG_RECOVERY.
  // This Web currently models PvE/risk battle only; there is no norisk battle mode to guess.
  let recoveryAi=null;
  if(desc?.kind==='pet'&&desc.pet){
    const key=String(desc.pet.id);
    if(!battlePetRecoveryAiIds.has(key)){
      recoveryAi=sourcePetAddVariableAi(desc.pet,10);
      battlePetRecoveryAiIds.add(key);
    }
  }
  return {before,after,amount:after-before,rawAmount:amount,roll,rate,maxHp,recoveryAi};
}
function sourcePerformSetMagicPetBattle(casterLabel,skillId,rawToNo,meta,logClass=''){
  const p=String(meta?.o||'').split('|');
  const turns=Math.trunc(Number(p[0])||0);
  const power=Math.trunc(Number(p[1])||0);
  const stat=String(p[2]||'').trim().toUpperCase();
  const multi=sourceSetMagicPetMultiList(rawToNo);
  if(!multi.ok||!multi.slots.length){
    addLog(casterLabel+' 使用 '+(meta?.n||'能力強化')+'，但原 BATTLE_MultiList 找不到可作用目標。',logClass);
    return {kind:'skill',skillId,noTarget:true,rawToNo,multi,stat,turns,power,magicPetMpBehaviorallyUnchanged:true};
  }

  const results=[];
  if(stat==='HP'){
    for(const slot of multi.slots){
      const desc=sourceSetMagicPetTargetableDescFromSlot(slot);
      if(!desc)continue;
      const heal=sourceSetMagicPetHeal(desc,power);
      results.push({slot,target:battleStatusDescName(desc),kind:desc.kind,petId:desc.petId||null,unitId:desc.unitId||null,heal});
    }
    addLog(casterLabel+' 使用 '+(meta?.n||'回復')+'：依原 BATTLE_MultiRecovery 對 '+results.length+' 個目標抽 90%～110% 後回復 HP。',logClass);
    return {kind:'skill',skillId,stat,turns,power,rawToNo,multi,results,magicPetMpBehaviorallyUnchanged:true};
  }

  if(stat!=='STR'&&stat!=='TGH'&&stat!=='DEX'){
    addLog(casterLabel+' 使用 '+(meta?.n||'能力強化')+'，但 option 屬性 '+stat+' 無對應原 C 分支；不猜效果。',logClass);
    return {kind:'skill',skillId,unsupportedStat:stat,turns,power,rawToNo,multi,magicPetMpBehaviorallyUnchanged:true};
  }

  for(const slot of multi.slots){
    const desc=sourceSetMagicPetTargetableDescFromSlot(slot);
    if(!desc)continue;
    const busy=sourceMagicPetBusy(desc);
    const applied=!busy&&sourceMagicPetApply(desc,stat,turns,power);
    results.push({slot,target:battleStatusDescName(desc),kind:desc.kind,petId:desc.petId||null,unitId:desc.unitId||null,applied,busy});
  }
  addLog(
    casterLabel+' 使用 '+(meta?.n||'能力強化')+'：'+stat+' '+power+'／'+turns+' 回合；'
      +'原 C 與 Duck/STR/TGH/DEX 共用互斥 gate，且真正能力變化從下一輪 PreCommand 生效。',
    logClass
  );
  return {kind:'skill',skillId,stat,turns,power,rawToNo,multi,results,magicPetMpBehaviorallyUnchanged:true};
}
function performEnemySetMagicPet(actor,unit,options,meta){
  // fixed BATTLE_ai_normal() selects the opposite-side attack target first and passes that raw
  // target through PETSKILL_Use(); BATTLE_ai_all() then stores the absolute COM2 slot.
  // It does NOT rewrite PETSKILL_TARGET_ALLMYSIDE here.
  const rawToNo=sourceEnemyCommandTargetBattleSlot(actor,null);
  return sourcePerformSetMagicPetBattle(unit.name,actor.skillId,rawToNo,meta,'bad');
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
    r=enemyAttackPetResult(unit,target.pet,Object.assign({},damageOptions,{sourceGuardianReal:true}));
    const originalDesc={kind:'pet',pet:target.pet,petId:target.pet.id};
    targetDesc=enemyDirectActualTarget(originalDesc,r)||originalDesc;
    actualTarget=targetDesc;
    enemyApplyDirectGuardianSkillHit(unit,target,r,label,{finalizeItemCrush:false});
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
  const tearPct=Math.max(0,Math.trunc(Number(String(meta?.o||'').match(/-?\\d+/)?.[0])||0));
  const targetDesc=enemySkillTargetDesc(chosen);
  const beforeHp=battleStatusHp(targetDesc);
  const maxHp=chosen.kind==='pet'?n(chosen.pet?.maxHp):n(state.maxHp);
  const missingHp=Math.max(0,maxHp-beforeHp);

  // BATTLE_S_AttackDamage checks DamageReact before AttackSeq. Player-side Acupuncture
  // therefore downgrades local PETSKILLTEAR to -1 and suppresses the missing-HP bonus.
  const hadDamageReact=chosen.kind==='pet'&&chosen.pet
    ?battlePetAcupunctureIds.has(chosen.pet.id)
    :false;
  const localTear=!hadDamageReact;
  const guarding=chosen.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
  const r=enemyAttackSeqBugTargetResult(unit,chosen,{guarding});

  let tearBonus=0;
  if(!r.dodged&&localTear){
    tearBonus=Math.trunc(missingHp*tearPct/100);
    if(tearBonus<=0){
      r.damage=0;r.miss=true;
      r.sourceTearZeroedBaseDamage=true;
    }else{
      r.damage=Math.max(0,Math.trunc(n(r.damage)+tearBonus));
      r.miss=r.damage<=0;
      r.tearBonus=tearBonus;
    }
  }
  enemyApplySkillHit(unit,chosen,r,meta?.n||'撕裂傷口2');
  sourceBattleFinalizeItemCrushRng(r);

  // 原 BATTLE_COM_S_PETSKILLTEAR 走 BATTLE_S_AttackDamage 後直接 break，不進普通 Counter loop。
  return {
    kind:'skill',skillId:actor.skillId,target:chosen.kind,r,tearPct,missingHp,tearBonus,
    hadDamageReact,localTear
  };
}
function performEnemyRegret(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  const label=meta?.n||'憾甲一擊';
  const successPct=Math.max(0,enemySkillNumber(meta?.o,/命%([+-]?\d+)/,0));
  const attackOpts={useFixedToughDefense:true};

  function hitOne(target,secondary=false){
    if(!target)return null;
    // BATTLE_S_AttackDamage checks BATTLE_GetDamageReact(original defindex) before AttackSeq.
    // Any positive ReactType changes only the local skill_type to -1. For current player-side
    // state this is reachable when the target Pet has Acupuncture. That suppresses REGRET2's
    // 0.8 multiplier and the later dizzy switch, even though DamageSub may then consume the skin.
    const hadDamageReact=target.kind==='pet'&&target.pet
      ?battlePetAcupunctureIds.has(target.pet.id)
      :false;
    const localRegret= !hadDamageReact;
    let r;
    if(target.kind==='pet'&&target.pet&&petIsBattleActive(target.pet)){
      r=enemyAttackPetResult(unit,target.pet,Object.assign({},attackOpts,{
        preGuardDamageMultiplier:secondary&&localRegret ? .8 : 1
      }));
    }else if(target.kind==='player'&&state.hp>0){
      const guarding=!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
      r=resolveEnemyAttackSeqBugToPlayer(unit,Object.assign({},attackOpts,{
        guarding,preGuardDamageMultiplier:secondary&&localRegret ? .8 : 1
      }));
    }else return null;
    r.ultimateCriticalEnemyOnly=true;
    enemyApplySkillHit(unit,target,r,label+(secondary?'貫穿段':''));
    sourceBattleFinalizeItemCrushRng(r);
    const dizzy=localRegret?enemyTryRegretDizzy(target,successPct,label):false;
    return {target:target.kind,r,dizzy,secondary,hadDamageReact,localRegret};
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
      r=enemyAttackPetResult(unit,chosen.pet,Object.assign({},attackOptions,{sourceGuardianReal:true}));
      hits++;
      lastResult=r;lastChosen=chosen;
      enemyApplyDirectGuardianSkillHit(
        unit,chosen,r,label+'第 '+hits+'/'+count+' 段',
        {finalizeItemCrush:false}
      );
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
  // BATTLE_S_AttackDamage reads DamageReact on the ORIGINAL defindex before AttackSeq.
  // Current reachable player-side reaction here is Pet Acupuncture.
  const hadDamageReact=chosen.kind==='pet'&&chosen.pet
    ?battlePetAcupunctureIds.has(chosen.pet.id)
    :false;
  const localTimid=!hadDamageReact;
  const guarding=chosen.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
  const r=enemyAttackSeqBugTargetResult(unit,chosen,{guarding});
  if(!r)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  enemyApplySkillHit(unit,chosen,r,label);
  sourceBattleFinalizeItemCrushRng(r);

  let timidRoll=null,forced=false,playerExited=false;
  if(localTimid&&r.damage>0){
    timidRoll=cRand(0,99);
    // Source enters TIMID only when local skill_type survives and final damage>0.
    // damage==1 still consumes the roll but cannot force an exit.
    if(timidRoll<15&&r.damage>1){
      if(chosen.kind==='pet'&&chosen.pet){
        battlePetOutIds.add(chosen.pet.id);
        sourceClearPetBattleProperty(chosen.pet);
        forced=true;
        addLog(chosen.pet.name+' 被 '+label+' 嚇退，本場不再出戰。','bad');
      }else if(chosen.kind==='player'&&state.hp>0){
        forced=true;
        playerExited=true;
        finishPlayerForcedBattleExit(unit.name+' 的'+label);
      }
    }
  }

  return {
    kind:'skill',skillId:actor.skillId,target:chosen.kind,r,timidRoll,forced,playerExited,
    hadDamageReact,localTimid
  };
}
function performEnemy2BattleTimid(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  const label=meta?.n||'狂獅怒吼';
  const hadDamageReact=chosen.kind==='pet'&&chosen.pet
    ?battlePetAcupunctureIds.has(chosen.pet.id)
    :false;
  const localTimid=!hadDamageReact;
  const guarding=chosen.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
  const r=enemyAttackSeqBugTargetResult(unit,chosen,{guarding});
  if(!r)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  enemyApplySkillHit(unit,chosen,r,label);
  sourceBattleFinalizeItemCrushRng(r);

  const timid=Math.max(0,Math.trunc(enemySkillNumber(meta?.o,/命%([0-9.]+)/,0)));
  let timidRoll=null,recalled=false;
  if(localTimid&&r.damage>0){
    timidRoll=cRand(0,99);
    if(timidRoll<timid&&r.damage>1&&chosen.kind==='pet'&&chosen.pet){
      battlePetOutIds.add(chosen.pet.id);
      sourceClearPetBattleProperty(chosen.pet);
      recalled=true;
      addLog(chosen.pet.name+' 被 '+label+' 嚇回寵物欄，本場不再出戰。','bad');
    }
  }

  return {
    kind:'skill',skillId:actor.skillId,target:chosen.kind,r,timid,timidRoll,recalled,
    hadDamageReact,localTimid
  };
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
  if(r?.playerGuardian&&chosen?.kind==='pet'){
    return {kind:'player'};
  }
  return chosen;
}
function enemyApplyDirectGuardianSkillHit(unit,chosen,r,label,options={}){
  const actual=enemyDirectActualTarget(chosen,r);
  if(r?.guardian&&chosen?.kind==='player'){
    addLog(r.guardian.name+' 發動忠犬，代替你承受 '+unit.name+' 的'+label+'。','pet');
  }else if(r?.playerGuardian&&chosen?.kind==='pet'){
    addLog('你發動舍己為友，代替 '+(chosen.pet?.name||'出戰寵物')+' 承受 '+unit.name+' 的'+label+'。','good');
  }
  const applied=enemyApplySkillHit(unit,actual,r,label,options);
  if(options.finalizeItemCrush!==false){
    sourceBattleFinalizeItemCrushRng(r);
  }
  if(applied?.triggered&&applied?.attackerDesc)return applied.attackerDesc;
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
    physical=enemySkillTargetResult(unit,chosen,{sourceDirectGuardian:true});
  }else{
    physical=resolveEnemyDirectAttackToPlayer(unit,{guarding});
  }
  const physicalActual=physical?enemyApplyDirectGuardianSkillHit(
    unit,chosen,physical,label+'物理段',{ignoreDamageReact:true}
  ):chosen;

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
    sourceClearPetBattleProperty(pet);sourceClearPetVary(pet);
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
  if(death?.ultimate&&pet){battlePetOutIds.add(pet.id);sourceClearPetBattleProperty(pet);sourceClearPetVary(pet);}

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
function sourceItemArgumentValue(argument,entryName){
  // fixed ITEM_getArgument(): split by "|" first, then ":"; entry name is case-insensitive.
  const wanted=String(entryName??'').toLowerCase();
  for(const part of String(argument??'').split('|')){
    const fields=part.split(':');
    if(fields.length<2)continue;
    if(String(fields[0]).toLowerCase()===wanted)return String(fields[1]);
  }
  return null;
}
function sourceRelifeHpPowerFromArgument(argument){
  const raw=sourceItemArgumentValue(argument,'HP');
  if(raw==null)return 1;
  if(raw==='FULL')return Math.trunc(n(state?.maxHp));
  return sourceCAtoi(raw);
}
function sourceRelifeHpPower(template){
  // Preserve the V1.69 generated source path, but parse the original ITEM_ARGUMENT so
  // an Inslay-copied argument can share the exact ITEM_DIErelife parser.
  if(!template)return 1;
  if(typeof template.argument==='string')return sourceRelifeHpPowerFromArgument(template.argument);
  if(template.relifeHpArgument==null)return 1;
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

    // Base function/argument come from pinned itemset6. After V2.05 Inslay, however,
    // PETSKILL_ITEM_inslay has legitimately overwritten ITEM_DIERELIFEFUNC and ITEM_ARGUMENT
    // on this existing item. Only those persisted source-backed overrides may replace the base.
    const template=sourceItemRelifeTemplate(existing.itemId);
    const hasRelifeOverride=!!existing.field2Functions
      &&Object.prototype.hasOwnProperty.call(existing.field2Functions,'relife');
    const relifeFunc=hasRelifeOverride
      ?String(existing.field2Functions.relife??'')
      :String(template?.relifeFunc??'');
    if(relifeFunc!=='ITEM_DIErelife')continue;

    const equipTemplate=sourcePlayerEquipTemplateForExisting(runtimeIndex,state);
    const equipPlace=equipTemplate
      ?Math.trunc(Number(sourcePlayerEquipPlace(equipTemplate,sourcePlayerItemSlots(state),state)))
      :Math.trunc(Number(template?.equipPlace));
    if(!Number.isFinite(equipPlace)||equipPlace===-1)continue;

    const hasArgumentOverride=!!existing.field2Char
      &&Object.prototype.hasOwnProperty.call(existing.field2Char,'argument');
    const argument=hasArgumentOverride
      ?String(existing.field2Char.argument??'')
      :String(template?.argument??'');
    const requested=sourceRelifeHpPowerFromArgument(argument);
    const workHp=Math.max(1,Math.trunc(n(requested)));
    const maxHp=Math.trunc(n(state?.maxHp));
    state.hp=Math.min(workHp,maxHp);

    // BATTLE_MultiReLife clears CHAR_ISDIE. Our battlePlayerDeathProcessed flag is the
    // current Web equivalent, so clear it or a later second death could never be processed.
    battlePlayerDeathProcessed=false;
    battlePlayerDeathResult=null;

    // ITEM_DIErelife consumes the equipped existing item immediately after MultiReLife.
    sourceConsumeRelifeEquipment(item,slots,i);
    const itemId=Math.trunc(Number(existing.itemId));
    const label=sourcePlayerRuntimeItemLabel(existing);
    addLog(label+' 發動死亡復活：HP 回復至 '+state.hp+'，裝備已消耗。','good');
    return {
      slot:i,itemId,itemIndex:runtimeIndex,
      requested,restoredHp:state.hp,equipPlace,relifeFunc,argument,
      sourceInslayOverride:hasRelifeOverride||hasArgumentOverride
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
  const fixCharm=n(state?.playerEquipCompliance?.fixedCharm??state.charm);
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
  // V1.77 起 petId follows fixed CHAR_PETID <- E_T_TEMPNO and capture copies it unchanged.
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
    if(SOURCE_PLAYER_UNREGISTERED_PETSKILL_FUNCTIONS.has(String(meta.f||''))){
      // BATTLE_PetRandomSkill has already consumed its DefaultAttacker RNG before PETSKILL_Use()
      // resolves the exact function string. Missing functbl entry => FALSE / no command.
      return {kind:'none',slot:iNum,skillId,sourceUseFailed:true,sourceFunctionMissing:true,targetDesc};
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

function sourcePetSpecialStatusTarget(action){
  const unit=action?.targetDesc?.kind==='enemy'?action.targetDesc.unit:null;
  if(!unit||n(unit.hp)<=0)return null;
  return {kind:'enemy',unit,unitId:unit.id};
}
function sourcePetSpecialStatusSpec(meta){
  const option=String(meta?.o||'');
  const turnMatch=option.match(/turn\s*(-?\d+)/i);
  const successMatch=option.match(/成\s*([+-]?\d+)/);
  return {
    type:battleStatusTypeFromOption(option),
    turns:turnMatch?Math.max(0,Math.trunc(Number(turnMatch[1])||0)):null,
    success:successMatch?Math.max(0,Math.trunc(Number(successMatch[1])||0)):null
  };
}
const SOURCE_REFRESH_STATUS_ORDER=Object.freeze([
  'poison','paralysis','sleep','stone','drunk','confusion',
  'weaken','deepPoison','barrier','nocast','sars','dizzy','dragnet'
]);
function sourceRefreshLastStatus(targetDesc){
  // fixed BATTLE_MultiStatusRecovery scans StatusTbl from 1 to BATTLE_ST_END
  // without breaking, so the last positive StatusTbl entry wins.
  let current=null;
  for(const type of SOURCE_REFRESH_STATUS_ORDER){
    if(battleStatusActive(targetDesc,type))current=type;
  }
  return current;
}
function sourceRefreshClearStatus(targetDesc,type){
  if(type==='sars')return battleSarsClear(targetDesc);
  return battleStatusClear(targetDesc,type);
}
function sourcePerformPetRefreshSkill(pet,action){
  const meta=action?.meta;
  const targetDesc=sourcePetSpecialStatusTarget(action);
  if(!targetDesc){
    addLog(pet.name+' 使用「'+(meta?.n||'淨化')+'」，但原 RANDOMACT 選定的目標已無效；不另抽目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true};
  }
  const option=String(meta?.o||'');
  const all=option.includes('全');
  const requested=all?null:battleStatusTypeFromOption(option);
  if(!all&&!requested){
    addLog(pet.name+' 抽到「'+(meta?.n||'淨化')+'」，但來源 status token 無法解析；不猜效果。','pet');
    return {handled:true,skillId:action?.skillId,sourceRuntimePending:true};
  }

  const current=sourceRefreshLastStatus(targetDesc);
  let cleared=false;
  // fixed BATTLE_MultiStatusRecovery clears only the single "last positive" StatusTbl
  // entry. status=0 ("全") is not a blanket clear-all; a specific token must equal it.
  if(current&&(all||requested===current)){
    cleared=sourceRefreshClearStatus(targetDesc,current);
  }
  if(cleared){
    addLog(pet.name+' 使用「'+(meta?.n||'淨化')+'」，解除 '+targetDesc.unit.name+' 的'+(BATTLE_STATUS_NAMES[current]||current)+'。','pet');
  }else{
    addLog(pet.name+' 使用「'+(meta?.n||'淨化')+'」，但 '+targetDesc.unit.name+' 沒有符合來源掃描結果的可解除狀態。','pet');
  }
  return {
    handled:true,skillId:action?.skillId,targetUnitId:targetDesc.unit.id,
    all,requested,current,cleared
  };
}
function sourcePerformPetSpecialStatusSkill(pet,action,type){
  const meta=action?.meta;
  const targetDesc=sourcePetSpecialStatusTarget(action);
  if(!targetDesc){
    addLog(pet.name+' 使用「'+(meta?.n||BATTLE_STATUS_NAMES[type]||'狀態技')+'」，但原 RANDOMACT 選定的目標已無效；不另抽目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true};
  }

  const spec=sourcePetSpecialStatusSpec(meta);
  if(spec.type!==type||spec.turns==null||spec.success==null){
    addLog(pet.name+' 抽到「'+(meta?.n||BATTLE_STATUS_NAMES[type]||'狀態技')+'」，但 fixed option 缺少可證明的狀態／turn／成功率；不猜。','pet');
    return {handled:true,skillId:action?.skillId,sourceRuntimePending:true,spec};
  }

  const attackerDesc={kind:'pet',pet,petId:pet.id};
  // fixed CHAR_complianceParameter explicitly initializes MODWEAKEN / MODDEEPPOISON /
  // MODBARRIER / MODNOCAST to 0. These four source status checks therefore use the
  // common BATTLE_StatusAttackCheck formula with Success, range 30 and Bai 1.0.
  const check=battleStatusChance(
    attackerDesc,targetDesc,type,
    {perOffset:spec.success,range:30,bai:1,forceGeneral:true}
  );
  let applied=false,storedTurns=0;
  if(check.allowed&&check.success){
    if(type==='deepPoison'){
      // fixed BATTLE_S_Deeppoison -> BATTLE_MultiStatusChange(..., turn+2, ...).
      storedTurns=spec.turns+2;
      applied=battleStatusApplyRaw(targetDesc,type,storedTurns);
    }else if(type==='nocast'){
      // fixed BATTLE_S_Nocast writes CHAR_WORKNOCAST = turn (no +1).
      // RANDOMACT's target is an Enemy, so the source's CHAR_TYPEPET exclusion is false.
      storedTurns=spec.turns;
      applied=battleStatusApplyRaw(targetDesc,type,storedTurns);
    }else{
      // WEAKEN and BARRIER both write turn+1; battleStatusApply stores that exact +1.
      storedTurns=spec.turns+1;
      applied=battleStatusApply(targetDesc,type,spec.turns);
    }
  }

  const label=meta?.n||BATTLE_STATUS_NAMES[type]||'狀態技';
  if(applied){
    addLog(pet.name+' 使用「'+label+'」，'+targetDesc.unit.name+' 陷入'+(BATTLE_STATUS_NAMES[type]||type)+'（原檢定 '+check.per.toFixed(1)+'%，stored turn '+storedTurns+'）。','pet');
  }else if(check.reason==='existing'){
    addLog(pet.name+' 使用「'+label+'」，但 '+targetDesc.unit.name+' 已有其他異常狀態；原 BATTLE_StatusAttackCheck 不再擲成功率。','pet');
  }else{
    addLog(pet.name+' 使用「'+label+'」，對 '+targetDesc.unit.name+' 的狀態檢定未成功（'+n(check.per).toFixed(1)+'%）。','pet');
  }

  // These are standalone BATTLE_COM_S_* commands: no physical damage and no Counter.
  return {
    handled:true,skillId:action?.skillId,targetUnitId:targetDesc.unit.id,
    type,turns:spec.turns,success:spec.success,storedTurns,applied,
    per:check.per,reason:check.reason||(!applied?'roll':null)
  };
}

function sourcePetAdjustedAttackDamageTarget(action){
  let unit=action?.targetDesc?.kind==='enemy'&&action.targetDesc.unit&&n(action.targetDesc.unit.hp)>0
    ?action.targetDesc.unit:null;
  if(unit)return unit;

  // fixed battle.c re-runs BATTLE_TargetAdjust() when BATTLE_COM_S_DAMAGETOHP /
  // DAMAGETOHP2 executes. If the raw COM2 target disappeared before this Pet's turn,
  // TargetAdjust falls back through DefaultAttacker and consumes that target RNG now.
  const fallback=sourcePetRandomEnemyTarget();
  return fallback?.unit&&n(fallback.unit.hp)>0?fallback.unit:null;
}
function sourcePetAttackDamageCalcOnlyGuardianResult(pet,target,attackOptions={}){
  const attacker=Object.assign({},petBattleView(pet),attackOptions.attackerOverride||{});
  if(!attacker||!target)return null;

  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const originalGuarding=!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion');
  const dodge=sourceInitialDodgeOnly(attacker,enemyBattleView(target),{guarding:originalGuarding});
  if(dodge.dodged){
    dodge.actualTarget=target;
    dodge.originalTarget=target;
    return dodge;
  }

  // fixed BATTLE_S_AttackDamage bug:
  // BATTLE_AttackSeq() may locally switch defindex to Guardian for critical / defence /
  // GuardAdjust, but caller BATTLE_S_AttackDamage keeps its original defindex for
  // BATTLE_DamageSub, WakeUp, death, ItemCrush and the later drain helper.
  const guardian=attacker?.throwWeapon?null:enemyGuardianFor(target,null);
  const calcTarget=guardian||target;
  const calcDesc={kind:'enemy',unit:calcTarget,unitId:calcTarget.id};
  const calcGuarding=guardian
    ?!!calcTarget.guardThisTurn&&!battleStatusActive(calcDesc,'confusion')
    :originalGuarding;
  const r=resolveNormalAttack(attacker,enemyBattleView(calcTarget),Object.assign({},attackOptions,{
    guarding:calcGuarding,
    disableDodge:true
  }));
  r.duckRaw=dodge.duckRaw;
  r.actualTarget=target;
  r.originalTarget=target;
  if(guardian){
    // fixed Guardian branch forces NORMAL / damage=1 when its local damage is <= 0.
    if(r.damage<=0){r.damage=1;r.miss=false}
    r.guardianCalcOnly=guardian;
    r.guardianSourceBug='BATTLE_S_AttackDamage-defindex-not-updated';
  }
  return r;
}
function sourcePetOriginalDamageReact(target){
  // Current source-backed Enemy DamageReact state is ACUPUNCTURE.
  // BATTLE_S_AttackDamage calls BATTLE_GetDamageReact(original defindex) BEFORE
  // BATTLE_AttackSeq / Guardian. Any positive ReactType downgrades non-LIGHTTAKE
  // skill_type to -1, so DAMAGETOHP / DAMAGETOHP2 still deal/react but do not drain HP.
  return !!target?.acupunctureActive;
}
function sourcePetDrainHeal(pet,damage,pct,label){
  const percent=Math.max(0,Math.trunc(n(pct)));
  if(!pet||damage<1||percent<=0)return 0;
  const before=Math.max(0,Math.trunc(n(pet.hp)));
  const maxHp=Math.max(1,Math.trunc(n(pet.maxHp)));
  const amount=Math.trunc(Math.max(0,Math.trunc(n(damage)))*percent/100);
  pet.hp=Math.min(maxHp,before+amount);
  const healed=Math.max(0,Math.trunc(n(pet.hp))-before);
  if(healed>0)addLog(pet.name+' 由「'+label+'」吸收 '+healed+' HP。','pet');
  return healed;
}
function sourcePerformPetDamageToHpSkill(pet,action){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const target=sourcePetAdjustedAttackDamageTarget(action);
  if(!target){
    addLog(pet.name+' 使用「'+(meta?.n||'嗜血技')+'」，但沒有可作用的敵方目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true};
  }

  const parts=String(meta?.o||'').split('|');
  const attackReduceRaw=sourceCAtoi(parts[0]);
  const absorbPct=Math.max(0,sourceCAtoi(parts[1]));
  const base=petBattleView(pet);
  if(!base)return {handled:true,skillId:action?.skillId,missingPet:true};

  // fixed PETSKILL_DamageToHp:
  //   float def = (atoi(buf1) / 100);
  // Both operands are int, so all current 30 / 20 / 10 options truncate to 0 first.
  const cIntegerDivision=Math.trunc(attackReduceRaw/100);
  const attack=Math.trunc(n(base.attack))-Math.trunc(Math.trunc(n(base.attack))*cIntegerDivision);
  const hadDamageReact=sourcePetOriginalDamageReact(target);
  const r=sourcePetAttackDamageCalcOnlyGuardianResult(pet,target,{
    attackerOverride:{attack}
  });
  if(!r)return {handled:true,skillId:action?.skillId,noTarget:true};

  const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
  let healed=0;
  if(!hadDamageReact&&r.damage>0&&!r.dodged&&!r.miss){
    healed=sourcePetDrainHeal(pet,r.damage,absorbPct,meta?.n||'嗜血技');
  }
  sourceProcessBattleDeathsAtAddProfit();

  // BATTLE_COM_S_DAMAGETOHP is an isolated BATTLE_S_AttackDamage case.
  // battle.c breaks after it, so there is no normal Counter chain.
  return {
    handled:true,skillId:action?.skillId,targetUnitId:target.id,
    actualTargetUnitId:actual?.id||target.id,r,healed,absorbPct,attackReduceRaw,
    cIntegerDivision,hadDamageReact,guardianCalcOnlyId:r.guardianCalcOnly?.id||null
  };
}
function sourcePerformPetDamageToHp2Skill(pet,action){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const target=sourcePetAdjustedAttackDamageTarget(action);
  if(!target){
    addLog(pet.name+' 使用「'+(meta?.n||'浴血狂襲')+'」，但沒有可作用的敵方目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true};
  }

  const absorbPct=Math.max(0,sourceCAtoi(meta?.o));
  const base=petBattleView(pet);
  if(!base)return {handled:true,skillId:action?.skillId,missingPet:true};

  // fixed BATTLE_AttackSeq(DAMAGETOHP2):
  // CriticalCheck is computed first from FIXDEX; then perCri *= 1.3 and
  // WORKATTACKPOWER becomes FIXSTR +20% before DamageCalc.
  // Its WORKQUICK +20% write occurs after EntrySort on this low-loyalty RANDOMACT path,
  // so it cannot retroactively change this turn's order.
  const hadDamageReact=sourcePetOriginalDamageReact(target);
  // BATTLE_S_AttackDamage downgrades skill_type to -1 before BATTLE_AttackSeq when the
  // ORIGINAL target already has DamageReact. In that branch DAMAGETOHP2's +20% STR /
  // +30% critical code is unreachable and this becomes an ordinary AttackSeq reaction.
  const attackPct=hadDamageReact?0:20;
  const criticalChanceMultiplier=hadDamageReact?1:1.3;
  const attack=Math.trunc(n(base.attack))+Math.trunc(Math.trunc(n(base.attack))*attackPct/100);
  const r=sourcePetAttackDamageCalcOnlyGuardianResult(pet,target,{
    criticalChanceMultiplier,
    attackerOverride:{attack}
  });
  if(!r)return {handled:true,skillId:action?.skillId,noTarget:true};

  const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
  let healed=0;
  if(!hadDamageReact&&r.damage>0&&!r.dodged&&!r.miss){
    healed=sourcePetDrainHeal(pet,r.damage,absorbPct,meta?.n||'浴血狂襲');
  }
  sourceProcessBattleDeathsAtAddProfit();

  return {
    handled:true,skillId:action?.skillId,targetUnitId:target.id,
    actualTargetUnitId:actual?.id||target.id,r,healed,absorbPct,
    attackPct,criticalChanceMultiplier,hadDamageReact,
    guardianCalcOnlyId:r.guardianCalcOnly?.id||null
  };
}

function sourcePerformPetMpDamageSkill(pet,action){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const target=sourcePetAdjustedAttackDamageTarget(action);
  if(!target){
    addLog(pet.name+' 使用「'+(meta?.n||'MP攻擊')+'」，但沒有可作用的敵方目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true};
  }

  const parts=String(meta?.o||'').split('|');
  const attackReduceRaw=sourceCAtoi(parts[0]);
  const mpPct=Math.max(0,sourceCAtoi(parts[1]));
  const base=petBattleView(pet);
  if(!base)return {handled:true,skillId:action?.skillId,missingPet:true};

  // fixed PETSKILL_MpDamage uses:
  //   def = (float)(atoi(buf1) / 100);
  // so current 50/100 is C int division first -> 0; physical attack is not reduced.
  const cIntegerDivision=Math.trunc(attackReduceRaw/100);
  const attack=Math.trunc(n(base.attack))-Math.trunc(Math.trunc(n(base.attack))*cIntegerDivision);
  const hadDamageReact=sourcePetOriginalDamageReact(target);
  const r=sourcePetAttackDamageCalcOnlyGuardianResult(pet,target,{
    attackerOverride:{attack}
  });
  if(!r)return {handled:true,skillId:action?.skillId,noTarget:true};

  const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);

  // fixed BATTLE_S_MpDamage returns immediately for CHAR_TYPEENEMY / CHAR_TYPEPET.
  // Low-loyalty BATTLE_PetRandomSkill picked an opposing Enemy through DefaultAttacker,
  // and BATTLE_S_AttackDamage keeps the original defindex even if Guardian is used only
  // for local AttackSeq calculation. Therefore MP damage is source-provably 0 here.
  const mpDamage=0;
  sourceProcessBattleDeathsAtAddProfit();

  return {
    handled:true,skillId:action?.skillId,targetUnitId:target.id,
    actualTargetUnitId:actual?.id||target.id,r,
    attackReduceRaw,cIntegerDivision,mpPct,mpDamage,hadDamageReact,
    sourceTargetType:'enemy',guardianCalcOnlyId:r.guardianCalcOnly?.id||null
  };
}

function sourcePetAttrSkillSpec(meta){
  const parts=String(meta?.o||'').split('|');
  const code=String(parts[0]||'').trim().toUpperCase();
  const amount=Number(parts[1]);
  const key=code==='EA'?'earth':(code==='WA'?'water':(code==='FI'?'fire':(code==='WI'?'wind':null)));
  return {code,key,amount:Number.isFinite(amount)?amount:null};
}
function sourcePerformPetModifyAttackSkill(pet,action){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const target=sourcePetAdjustedAttackDamageTarget(action);
  if(!target){
    addLog(pet.name+' 使用「'+(meta?.n||'屬性強化攻擊')+'」，但沒有可作用的敵方目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true};
  }

  const spec=sourcePetAttrSkillSpec(meta);
  if(!spec.key||spec.amount==null){
    addLog(pet.name+' 抽到「'+(meta?.n||'屬性強化攻擊')+'」，但 fixed option 無法解析；不猜效果。','pet');
    return {handled:true,skillId:action?.skillId,sourceUseFailed:true};
  }

  const hadDamageReact=sourcePetOriginalDamageReact(target);
  const r=sourcePetAttackDamageCalcOnlyGuardianResult(pet,target,{});
  if(!r)return {handled:true,skillId:action?.skillId,noTarget:true};

  let attr=0,bonusRoll=null,bonusStep=0,bonus=0;
  // fixed BATTLE_S_AttackDamage downgrades local skill_type to -1 before AttackSeq
  // when the ORIGINAL target has DamageReact, so the later MODIFYATT switch is skipped.
  if(!hadDamageReact&&r.damage>0){
    // fixed BATTLE_S_Modifyattack reads CHAR_*AT from the caller's ORIGINAL defindex.
    // Guardian may have been used only for AttackSeq calculation, but it does not replace
    // this target attribute lookup.
    const targetElements=battleBaseElements({kind:'enemy',unit:target,unitId:target.id})||{};
    attr=Math.max(0,Math.trunc(n(targetElements[spec.key])));
    if(attr>0){
      // Source bug: (float)((rand() % (ModNum+5)) / 100)
      // rand()% range is 0..ModNum+4, then C integer /100 before float cast.
      bonusRoll=cRand(0,attr+4);
      bonusStep=Math.trunc(bonusRoll/100);
      const factor=n(spec.amount)/100+bonusStep;
      const before=Math.trunc(n(r.damage));
      r.damage=Math.trunc(before+before*factor);
      bonus=r.damage-before;
    }
  }

  const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
  sourceProcessBattleDeathsAtAddProfit();
  return {
    handled:true,skillId:action?.skillId,targetUnitId:target.id,
    actualTargetUnitId:actual?.id||target.id,r,spec,targetAttr:attr,
    bonusRoll,bonusStep,bonus,hadDamageReact,
    guardianCalcOnlyId:r.guardianCalcOnly?.id||null
  };
}
function sourcePerformPetMdfyAttackSkill(pet,action){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const target=sourcePetAdjustedAttackDamageTarget(action);
  if(!target){
    addLog(pet.name+' 使用「'+(meta?.n||'屬性轉換攻擊')+'」，但沒有可作用的敵方目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true};
  }

  const spec=sourcePetAttrSkillSpec(meta);
  if(!spec.key||spec.amount==null){
    addLog(pet.name+' 抽到「'+(meta?.n||'屬性轉換攻擊')+'」，但 fixed option 無法解析；原 PETSKILL_Mdfyattack() 會 FALSE。','pet');
    return {handled:true,skillId:action?.skillId,sourceUseFailed:true};
  }

  const elements={earth:0,water:0,fire:0,wind:0};
  elements[spec.key]=spec.amount;

  // fixed BATTLE_AttrAdjust checks the attacker's WORKBATTLECOM1, not the local
  // BATTLE_S_AttackDamage skill_type variable. Therefore even if the original target has
  // DamageReact and local skill_type becomes -1, MDFYATTACK's one-hit element replacement
  // still participates in AttackSeq / DamageCalc.
  const hadDamageReact=sourcePetOriginalDamageReact(target);
  const r=sourcePetAttackDamageCalcOnlyGuardianResult(pet,target,{
    attackerOverride:{elements}
  });
  if(!r)return {handled:true,skillId:action?.skillId,noTarget:true};

  const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
  sourceProcessBattleDeathsAtAddProfit();
  return {
    handled:true,skillId:action?.skillId,targetUnitId:target.id,
    actualTargetUnitId:actual?.id||target.id,r,spec,elements,hadDamageReact,
    guardianCalcOnlyId:r.guardianCalcOnly?.id||null
  };
}

function sourcePerformPetLighttakeedSkill(pet,action){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const target=sourcePetAdjustedAttackDamageTarget(action);
  if(!target){
    addLog(pet.name+' 使用「'+(meta?.n||'採光術')+'」，但沒有可作用的敵方目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true};
  }

  const base=petBattleView(pet);
  if(!base)return {handled:true,skillId:action?.skillId,missingPet:true};

  // fixed PETSKILL_Lighttakeed writes WORK values from this round's FIX snapshot:
  //   WORKATTACKPOWER = FIXSTR * 0.7
  //   WORKDEFENCEPOWER = FIXTOUGH * 0.5
  // The WORKQUICK *0.95 line is commented out.
  // battlePetPowerMods is cleared at the next normalBattleOrder compliance boundary,
  // so it has the same one-round WORK lifetime and also remains visible to same-round Counter.
  const attack=Math.trunc(n(base.attack)*.7);
  const defense=Math.trunc(n(base.defense)*.5);
  battlePetPowerMods.set(pet.id,{attack,defense,skillId:action?.skillId,sourceLighttakeed:true});

  const option=String(meta?.o||'').trim().toUpperCase();
  const requestedReact=option==='VANISH'?'vanish':(option==='ABSROB'?'absorb':(option==='REFLEC'?'reflect':null));
  if(!requestedReact){
    // Current fixed rows are all valid; retain PETSKILL_Use FALSE semantics for malformed data.
    battlePetPowerMods.delete(pet.id);
    addLog(pet.name+' 抽到「'+(meta?.n||'採光術')+'」，但來源 option 不是 VANISH / ABSROB / REFLEC；不猜。','pet');
    return {handled:true,skillId:action?.skillId,sourceUseFailed:true};
  }

  // Current source-backed Enemy DamageReact can be ACUPUNCTURE. It is a positive ReactType,
  // but never one of Lighttakeed's three requested types. fixed BATTLE_S_AttackDamage then
  // changes only its local skill_type to -1; the 70% / 50% WORK values written above remain.
  // No source-backed Enemy WORKDAMAGEVANISH / ABSROB / REFLEC exists yet, so copying one of
  // those counters into the Pet is not reachable and is intentionally not fabricated.
  const hadDamageReact=sourcePetOriginalDamageReact(target);
  const matchedReact=false;
  const absorbed=false;

  const r=sourcePetAttackDamageCalcOnlyGuardianResult(pet,target,{
    attackerOverride:{attack,defense}
  });
  if(!r)return {handled:true,skillId:action?.skillId,noTarget:true};

  const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
  sourceProcessBattleDeathsAtAddProfit();

  addLog(
    pet.name+' 使用「'+(meta?.n||'採光術')+'」：本輪 WORK攻/防改為 70%/50%'
    +(hadDamageReact?'；原目標只有不相符的 DamageReact，依原 C 降成普通反應，不吸收狀態。':'；目標沒有可吸收的 '+option+'。'),
    'pet'
  );

  // BATTLE_COM_S_LIGHTTAKE is an isolated BATTLE_S_AttackDamage case; no normal Counter.
  return {
    handled:true,skillId:action?.skillId,targetUnitId:target.id,
    actualTargetUnitId:actual?.id||target.id,r,
    attack,defense,attackPct:70,defensePct:50,
    requestedReact,hadDamageReact,matchedReact,absorbed,
    guardianCalcOnlyId:r.guardianCalcOnly?.id||null
  };
}

function sourcePerformPetMagicStatusChangeSkill(pet,action){
  const meta=action?.meta;
  const label=meta?.n||'鐵壁';
  const parts=String(meta?.o||'').split('|');
  const status=String(parts[0]||'').trim();
  const turns=Math.max(0,sourceCAtoi(parts[1]));
  const power=Math.max(0,sourceCAtoi(parts[2]));
  const scope=String(parts[3]||'').trim();

  // PETSKILL_MagicStatusChange() blindly copies the RANDOMACT toNo into COM2.
  // BATTLE_PetRandomSkill chose that toNo through BATTLE_DefaultAttacker(opposing side),
  // so even rows described as "全" do NOT become own-side/all-side here.
  const rawToNo=action?.targetDesc?.kind==='enemy'
    ?sourceBattleStatusSlot(action.targetDesc)
    :-1;

  if(!(status==='铁壁'||status==='鐵壁')){
    addLog(pet.name+' 隨機抽到「'+label+'」，但 fixed MagicStatus 名稱不是鐵壁；不猜效果。','pet');
    return {handled:true,skillId:action?.skillId,sourceRuntimePending:true,status,turns,power,scope,rawToNo};
  }

  // BATTLE_MultiMagicStatusChange calls BATTLE_MultiList(raw COM2).
  // For a valid 0..19 slot this is one target only. If that target died before execution,
  // __ATTACK_MAGIC repeatedly rand()%10-picks a living member of the same side.
  const multi=sourceSetMagicPetMultiList(rawToNo);
  if(!multi.ok||!multi.slots.length){
    addLog(pet.name+' 使用「'+label+'」，但來源 BATTLE_MultiList 找不到有效目標。','pet');
    return {
      handled:true,skillId:action?.skillId,noTarget:true,status:'superWall',
      turns,power,scope,rawToNo,multi,sourceNoCounter:true
    };
  }

  const results=[];
  for(const slot of multi.slots){
    const desc=sourceBattleStatusDescFromSlot(slot);
    if(desc?.kind!=='enemy'||!desc.unit||n(desc.unit.hp)<=0)continue;
    const unit=desc.unit;

    // BATTLE_MultiMagicStatusChange scans every MagicTbl[j] and only writes the new
    // status if none are active. Current source-backed MagicTbl runtime exposes SuperWall.
    if(n(unit.superWallTurns)>0){
      results.push({unitId:unit.id,slot,applied:false,existing:true});
      continue;
    }
    unit.superWallTurns=turns;
    unit.superWallPower=power;
    results.push({unitId:unit.id,slot,applied:true,turns,power});
    addLog(
      pet.name+' 低忠誠亂放「'+label+'」，反而讓敵方 '+unit.name+
      ' 取得 '+turns+' 回合鐵壁（基準 +'+power+'%）。','bad'
    );
  }

  // This is an isolated SUPERWALL case: no physical hit, no ItemCrush, no Counter.
  return {
    handled:true,skillId:action?.skillId,status:'superWall',turns,power,scope,
    rawToNo,multi,results,sourceRandomActOpposingTarget:true,
    sourceScopeTextDoesNotRetarget:true,sourceNoCounter:true
  };
}

function sourcePerformPetSetDuckRandomSkill(pet,action){
  const meta=action?.meta;

  // fixed PETSKILL_SetDuck() itself succeeds and stores the RANDOMACT DefaultAttacker
  // Enemy toNo in COM2. It also writes CHAR_MAGICPETMP=0.
  //
  // Execution then enters PETSKILL_SetDuckChange_Battle(), whose first target gate is:
  //   BATTLE_No2Index(battleindex,toNo) == charaindex
  // RANDOMACT's toNo is the opposing Enemy, never this casting Pet, so the function
  // returns FALSE before parsing "3|60", before MagicEffect and before writing Duck state.
  //
  // Fixed-repo audit also finds no increment of CHAR_MAGICPETMP anywhere:
  // SetMagicPet reads it and writes the same value back. Thus this reset-to-zero has
  // no separately observable runtime effect in the fixed build.
  addLog(
    pet.name+' 隨機抽到「'+(meta?.n||'閃避術')+'」，但 RANDOMACT 的 COM2 是敵方目標；'
    +'原 PETSKILL_SetDuckChange_Battle() 要求目標必須等於施術寵自己，因此直接 FALSE、不加閃避。',
    'pet'
  );
  return {
    handled:true,skillId:action?.skillId,noAction:true,
    sourceExecutionFailed:true,sourceSetDuckSelfTargetGate:true,
    magicPetMpResetBehaviorallyZero:true
  };
}

function sourcePerformPetAcupunctureSkill(pet,action,options={}){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const label=meta?.n||'針刺外皮';

  // fixed BATTLE_COM_S_ACUPUNCTURE sets WORKACUPUNCTURE=1 on the attacker, then
  // deliberately falls through into the ordinary physical common loop.
  battlePetAcupunctureIds.add(pet.id);

  const target=sourcePetEnemyTargetFromAction(action);
  addLog(pet.name+' 隨機使用「'+label+'」：針刺外皮啟動，直到被非投擲物理傷害觸發一次為止。','pet');
  if(!target){
    return {handled:true,skillId:action?.skillId,acupuncture:true,noTarget:true};
  }

  const attacker=petBattleView(pet);
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const r=resolveAttackToEnemyWithGuardian(attacker,target,{
    guarding:!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion')
  });
  const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
  sourceProcessBattleDeathsAtAddProfit();

  // ACUPUNCTURE is in the source common direct-attack group. The outer Counter uses
  // the original post-TargetAdjust defNo and is suppressed by Guardian/critical/death as usual.
  if(petIsBattleActive(pet)&&n(target.hp)>0){
    resolvePetEnemyCounterChain('pet',pet,target,r);
  }
  return {
    handled:true,skillId:action?.skillId,acupuncture:true,
    targetUnitId:target.id,actualTargetUnitId:actual?.id||null,r
  };
}

function sourcePerformPetHectorParalysis(pet,action,label){
  const target=action?.targetDesc?.kind==='enemy'?action.targetDesc.unit:null;
  if(!target)return {attempted:false,applied:false,reason:'invalid-entry'};

  // fixed PROFESSION_BATTLE_StatusAttackCheck() consumes RAND first, then checks
  // HP/death/existing status. Hector passes status=2 and Success=60: strict roll < 60.
  const roll=cRand(1,100);
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  if(n(target.hp)<=0){
    return {attempted:true,applied:false,roll,successPct:60,reason:'dead'};
  }
  if(battleHasAnyStatus(targetDesc)){
    return {attempted:true,applied:false,roll,successPct:60,reason:'existing-status'};
  }
  if(roll>=60){
    return {attempted:true,applied:false,roll,successPct:60,reason:'roll'};
  }

  // Hector writes StatusTbl[PARALYSIS]=1 directly. It does not use the normal
  // BATTLE_Attack status block and therefore does not clear COM1 here.
  const key=battleStatusKey(targetDesc);
  if(!key)return {attempted:true,applied:false,roll,successPct:60,reason:'no-status-key'};
  battleStatuses.set(key,{type:'paralysis',turns:1,sourceHector:true});
  addLog(target.name+' 被 '+label+' 威嚇成功，陷入麻痺 1 回合（roll '+roll+' < 60）。','pet');
  return {attempted:true,applied:true,roll,successPct:60,targetUnitId:target.id};
}

function sourcePerformPetHectorSkill(pet,action,options={}){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const label=meta?.n||'威嚇攻擊';
  const attackPct=enemySignedSkillPercent(meta?.o,'攻%');
  const quickPct=enemySignedSkillPercent(meta?.o,'敏%');
  const base=petBattleView(pet);
  if(!base)return {handled:true,skillId:action?.skillId,missingPet:true};

  // PETSKILL_Hector writes WORKATTACKPOWER from FIXSTR and WORKQUICK from FIXDEX.
  // RANDOMACT happens after EntrySort, so quick cannot reorder this round, but it still
  // affects same-round attack/counter/dodge calculations that read WORKQUICK.
  const baseAttack=Math.trunc(n(base.attack));
  const baseQuick=Math.trunc(n(base.fixedDex));
  const attack=baseAttack+Math.trunc(baseAttack*attackPct/100);
  const quick=baseQuick+Math.trunc(baseQuick*quickPct/100);
  battlePetPowerMods.set(pet.id,{
    attack,quick,skillId:action?.skillId,sourceHector:true
  });

  // Source special Hector status check runs on RAW COM2 before the later common-loop
  // BATTLE_TargetAdjust and before any physical attack RNG.
  const paralysis=sourcePerformPetHectorParalysis(pet,action,label);
  const target=sourcePetEnemyTargetFromAction(action);
  if(!target){
    addLog(pet.name+' 使用「'+label+'」，威嚇判定後已沒有可攻擊目標。','pet');
    return {
      handled:true,skillId:action?.skillId,noTarget:true,
      attackPct,quickPct,attack,quick,paralysis,sourceOrderAlreadyFixed:true
    };
  }

  const attacker=petBattleView(pet);
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const r=resolveAttackToEnemyWithGuardian(attacker,target,{
    guarding:!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion')
  });
  const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
  sourceProcessBattleDeathsAtAddProfit();

  // The generic status machinery sees LOW(COM3)=skill array 620, which is >= BATTLE_ST_END,
  // so no second status roll occurs. Outer Counter still uses the common-loop original defNo.
  if(petIsBattleActive(pet)&&n(target.hp)>0){
    resolvePetEnemyCounterChain('pet',pet,target,r);
  }

  addLog(
    pet.name+' 隨機使用「'+label+'」（攻 '+attackPct+'%、敏 '+quickPct
      +'%；敏捷變更發生在排序後，不倒帶重排）。',
    'pet'
  );
  return {
    handled:true,skillId:action?.skillId,targetUnitId:target.id,
    actualTargetUnitId:actual?.id||null,attackPct,quickPct,attack,quick,
    paralysis,sourceOrderAlreadyFixed:true,sourceNoGeneralStatusRoll:true,r
  };
}

function sourcePerformPetSarsSkill(pet,action,options={}){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const label=meta?.n||'毒煞蔓延';
  const turn=3;

  // PETSKILL_Sars defaults turn=3. Current option is only "煞", so no "turn" override exists.
  // LOW(COM3)=BATTLE_ST_SARS, HIGH(COM3)=3 before TargetListSet/common physical execution.
  const target=sourcePetEnemyTargetFromAction(action);
  if(!target){
    addLog(pet.name+' 隨機使用「'+label+'」，但 BATTLE_TargetAdjust 找不到有效目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true,statusType:'sars',turn};
  }

  const attacker=petBattleView(pet);
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const r=resolveAttackToEnemyWithGuardian(attacker,target,{
    guarding:!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion')
  });

  // fixed BATTLE_Attack order is damage/wakeup -> status roll/write -> ItemCrush.
  const actual=applyFriendlyEnemyHit(
    'pet',pet.name,target,r,pet.id,{deferItemCrush:true}
  );
  const actualDesc=actual?{kind:'enemy',unit:actual,unitId:actual.id}:targetDesc;
  const status=sourcePetApplyStatusAttackHit(pet,actualDesc,r,'sars',turn,label);
  sourceBattleFinalizeItemCrushRng(r);
  sourceProcessBattleDeathsAtAddProfit();

  // SARS does not block CanMove. Common Counter uses the original post-TargetAdjust defNo;
  // Guardian itself already makes ContFlg false via r.guardian.
  if(petIsBattleActive(pet)&&n(target.hp)>0){
    resolvePetEnemyCounterChain('pet',pet,target,r);
  }
  return {
    handled:true,skillId:action?.skillId,targetUnitId:target.id,
    actualTargetUnitId:actual?.id||null,statusType:'sars',turn,status,r
  };
}

function sourcePerformPetGyrateSkill(pet,action,options={}){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const attackPct=enemySignedSkillPercent(meta?.o,'攻%');
  const base=petBattleView(pet);
  if(!base)return {handled:true,skillId:action?.skillId,missingPet:true};

  // PETSKILL_Gyrate() writes WORKATTACKPOWER from this round's FIXSTR before execution.
  // Low-loyalty RANDOMACT happens after EntrySort, so only the same-round attack/calc state changes.
  const baseAttack=Math.trunc(n(base.attack));
  const attack=baseAttack+Math.trunc(baseAttack*attackPct/100);
  battlePetPowerMods.set(pet.id,{
    attack,skillId:action?.skillId,sourceGyrate:true
  });

  // fixed GYRATE does NOT TargetAdjust before choosing the row: it derives f_num directly
  // from raw COM2, then snapshots every TargetCheck-valid member of those five battle slots.
  const rawDefNo=sourceBattleStatusSlot(action?.targetDesc);
  let rowStart;
  if(rawDefNo<5)rowStart=0;
  else if(rawDefNo<10)rowStart=5;
  else if(rawDefNo<15)rowStart=10;
  else rowStart=15;

  const rowTargets=[];
  for(let slot=rowStart;slot<rowStart+5;slot++){
    const unit=targetableEnemyUnits().find(u=>sourceBattleStatusSlot({kind:'enemy',unit})===slot)||null;
    if(unit)rowTargets.push({slot,unit});
  }

  const label=meta?.n||'回旋攻擊';
  addLog(
    pet.name+' 隨機使用「'+label+'」（攻 '+(attackPct>=0?'+':'')+attackPct
      +'%），依 raw COM2 攻擊同一橫排 '+rowTargets.length+' 個有效目標。',
    'pet'
  );

  const results=[];
  for(const entry of rowTargets){
    const target=entry.unit;
    if(!target||n(target.hp)<=0||enemyUnitHidden(target))continue;
    const attacker=petBattleView(pet);
    const targetDesc={kind:'enemy',unit:target,unitId:target.id};
    const r=resolveAttackToEnemyWithGuardian(attacker,target,{
      guarding:!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion')
    });
    const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
    results.push({
      battleSlot:entry.slot,targetUnitId:target.id,
      actualTargetUnitId:actual?.id||target.id,r
    });
  }

  // Source GYRATE special case writes FF and breaks immediately:
  // no BATTLE_AddProfit call here and no common Counter loop.
  return {
    handled:true,skillId:action?.skillId,attackPct,attack,
    rawDefNo,rowStart,results,sourceNoCounter:true,sourceNoImmediateAddProfit:true
  };
}

function sourcePerformPetRetraceSkill(pet,action,options={}){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const label=meta?.n||'追跡攻擊';

  // Player Pet has no CHAR_ARM. BATTLE_GetAttackCount() therefore returned 0 before
  // BATTLE_PetLoyalCheck(), and the non-PLAYER fallback fixed attack_max to exactly 1.
  const target=sourcePetEnemyTargetFromAction(action);
  if(!target){
    addLog(pet.name+' 隨機使用「'+label+'」，但 BATTLE_TargetAdjust 找不到有效目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true,attackMax:1};
  }

  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const base=petBattleView(pet);
  if(!base)return {handled:true,skillId:action?.skillId,missingPet:true};

  const guarding=!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion');
  const primary=resolveAttackToEnemyWithGuardian(base,target,{guarding});
  const primaryActual=applyFriendlyEnemyHit(
    'pet',pet.name,target,primary,pet.id,{deferItemCrush:true}
  );
  sourceBattleFinalizeItemCrushRng(primary);

  let retraceRoll=null,follow=null,followActual=null,boosted=false,boostedAttack=null;
  if(primary?.dodged){
    // fixed condition is strict RAND(1,100) < 80, so 1..79 succeeds.
    retraceRoll=cRand(1,100);
    if(retraceRoll<80){
      // PETSKILL_Retrace's option parser is commented out. All 621/713/735 therefore use
      // the hard-coded FIXSTR +20% in battle.c regardless of their displayed +20/+100/+50.
      const fixAttack=Math.trunc(n(base.attack));
      boostedAttack=fixAttack+Math.trunc(fixAttack*.2);
      battlePetPowerMods.set(pet.id,{
        attack:boostedAttack,skillId:action?.skillId,sourceRetrace:true
      });
      const retryTargetDesc={kind:'enemy',unit:target,unitId:target.id};
      follow=resolveAttackToEnemyWithGuardian(
        Object.assign({},petBattleView(pet),{attack:boostedAttack}),
        target,
        {guarding:!!target.guardThisTurn&&!battleStatusActive(retryTargetDesc,'confusion')}
      );
      followActual=applyFriendlyEnemyHit(
        'pet',pet.name,target,follow,pet.id,{deferItemCrush:true}
      );
      sourceBattleFinalizeItemCrushRng(follow);
      boosted=true;
    }
  }

  // BATTLE_AddProfit is after the optional RETRACE follow-up, once per primary segment.
  sourceProcessBattleDeathsAtAddProfit();

  // Outer common Counter uses ContFlg/defNo from the PRIMARY BATTLE_Attack, not the
  // optional follow-up return value. The source target remains the post-TargetAdjust defNo.
  if(primary&&petIsBattleActive(pet)&&n(target.hp)>0){
    resolvePetEnemyCounterChain('pet',pet,target,primary);
  }

  addLog(
    pet.name+' 隨機使用「'+label+'」：首擊'
      +(primary?.dodged?'被閃避'+(retraceRoll!=null?'，追跡 roll '+retraceRoll:''):'完成')
      +(boosted?'；觸發固定 FIXSTR +20% 追擊。':'。'),
    'pet'
  );

  return {
    handled:true,skillId:action?.skillId,attackMax:1,targetUnitId:target.id,
    primary,primaryActualTargetUnitId:primaryActual?.id||target.id,
    retraceRoll,boosted,boostedAttack,follow,
    followActualTargetUnitId:followActual?.id||null,
    sourceOptionIgnored:true,sourceCounterUsesPrimary:true
  };
}

function sourcePetBattleModelSpec(meta){
  const p=String(meta?.o||'').split('|');
  const type=Math.max(0,sourceCAtoi(p[0]));
  let objectNum=sourceCAtoi(p[1]),objectNumRoll=null;
  // fixed PETSKILL_BattleModel: <=0 rolls RAND(1,10); >10 clamps to 10.
  if(objectNum<=0){
    objectNumRoll=cRand(1,10);
    objectNum=objectNumRoll;
  }else if(objectNum>10){
    objectNum=10;
  }

  const statusToken=String(p[2]||'');
  const statusType=battleStatusTypeFromOption(statusToken);
  const turns=Math.max(0,sourceCAtoi(p[3]));
  const effectHit=Math.max(0,sourceCAtoi(p[4]));

  // PETSKILL_BattleModel parses up to three SPACE-delimited stat tokens positionally:
  // token 1 may affect 攻, token 2 防, token 3 敏. It does not search a token in every slot.
  // Source bug: every matched stat starts from WORKATTACKPOWER, even 防/敏.
  const statTokens=String(p[5]||'').trim()?String(p[5]).trim().split(/\s+/).slice(0,3):[];
  const actionNumbers=String(p[6]||'').trim()
    ?String(p[6]).trim().split(/\s+/).slice(0,4).map(sourceCAtoi)
    :[];

  return {
    type,objectNum,objectNumRoll,statusToken,statusType,turns,effectHit,
    statTokens,actionNumbers,
    physical:(type&4)!==0,coverAll:(type&1)!==0
  };
}
function sourceApplyPetBattleModelPower(pet,spec,skillId){
  const base=petBattleView(pet);
  if(!base)return {baseAttack:0,mods:null};
  const attackBase=Math.trunc(n(base.attack));
  const mods={};
  const words=['攻','防','敏'];
  const keys=['attack','defense','quick'];

  for(let i=0;i<3;i++){
    const token=String(spec?.statTokens?.[i]||'');
    if(!token||!token.includes(words[i]))continue;
    let value=attackBase;
    if(token.includes('%')){
      const m=token.match(/%([+-]?\d+(?:\.\d+)?)/);
      const pct=m?(Number(m[1])||0):0;
      value=value+Math.trunc(value*pct/100);
    }else{
      const m=token.match(/[攻防敏]([+-]?\d+(?:\.\d+)?)/);
      value=m?Math.trunc(Number(m[1])||0):0;
    }
    mods[keys[i]]=Math.trunc(value);
  }

  if(Object.keys(mods).length){
    battlePetPowerMods.set(pet.id,Object.assign(
      {skillId,sourceBattleModel:true},
      mods
    ));
  }
  return {baseAttack:attackBase,mods:Object.keys(mods).length?mods:null};
}
function sourceBattleModelEnemyTargets(){
  // fixed BATTLE_MultiList(TARGET_SIDE_1) scans 10..19, then qsort(SortLoc).
  // CharTableIdx + SortLoc produces source order 13,11,10,12,14,18,16,15,17,19.
  // Web battleSlot is source slot-10, exactly the already sourced SARS location order.
  const bySlot=new Map(
    targetableEnemyUnits().map(unit=>[Math.trunc(n(unit?.battleSlot)),unit])
  );
  const out=[];
  for(const slot of SOURCE_SARS_SLOT_ORDER){
    const unit=bySlot.get(slot);
    if(unit)out.push(unit);
  }
  return out;
}
function sourcePerformPetBattleModelSkill(pet,action,options={}){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const spec=sourcePetBattleModelSpec(meta);
  const label=meta?.n||'BattleModel';

  if(!spec.physical){
    addLog(pet.name+' 隨機使用「'+label+'」，但來源 type '+spec.type+' 不是物理 BattleModel；不猜非物理傷害。','pet');
    return {handled:true,skillId:action?.skillId,spec,unsupportedType:spec.type};
  }

  // PETSKILL_BattleModel ignores RANDOMACT toNo after PETSKILL_Use enters the handler:
  // COM2 is overwritten with low=type / high=objectNum. Actual targets are rebuilt here
  // from the entire opposing side.
  const power=sourceApplyPetBattleModelPower(pet,spec,action?.skillId);
  const initial=sourceBattleModelEnemyTargets();
  if(!initial.length){
    addLog(pet.name+' 使用「'+label+'」，但敵方已沒有可攻擊目標。','pet');
    return {handled:true,skillId:action?.skillId,spec,power,noTarget:true,sourceTargetDescIgnored:true};
  }

  // fixed BATTLE_BattleModel does NOT pre-roll extra random targets.
  // It first consumes attacks against the sorted initial iToList; only an extra object
  // beyond live-count rolls RAND(0,i0-1), immediately before that object's attack.
  const sequence=[];
  if(spec.objectNum>=initial.length){
    for(const unit of initial)sequence.push({unit,random:false});
    while(sequence.length<spec.objectNum)sequence.push({unit:null,random:true});
  }else{
    for(let i=0;i<spec.objectNum&&i<initial.length;i++)sequence.push({unit:initial[i],random:false});
    if(spec.coverAll){
      for(let i=spec.objectNum;i<initial.length;i++)sequence.push({unit:initial[i],random:false});
    }
  }

  addLog(
    pet.name+' 隨機使用「'+label+'」：BattleModel type '+spec.type+'，'
      +spec.objectNum+' 個攻擊物件'+(spec.statusType?'，可附加'+(BATTLE_STATUS_NAMES[spec.statusType]||spec.statusType):'')+'。',
    'pet'
  );

  const results=[];
  for(let i=0;i<sequence.length;i++){
    const step=sequence[i];
    let randomTargetRoll=null;
    let target=step.unit;
    if(step.random){
      randomTargetRoll=cRand(0,initial.length-1);
      target=initial[randomTargetRoll];
    }

    const actionNumber=spec.actionNumbers.length
      ?spec.actionNumbers[i%spec.actionNumbers.length]
      :null;

    // Extra random objects select from the ORIGINAL iToList. If that selected entry died
    // after an earlier object, BATTLE_BattleModel_ATTACK TargetCheck simply returns.
    if(!target||n(target.hp)<=0||enemyUnitHidden(target)){
      results.push({
        objectIndex:i,actionNumber,
        targetUnitId:target?.id||null,randomTargetRoll,skippedDead:true
      });
      continue;
    }

    const attacker=petBattleView(pet);
    const originalDesc={kind:'enemy',unit:target,unitId:target.id};
    const r=resolveAttackToEnemyWithGuardian(attacker,target,{
      guarding:!!target.guardThisTurn&&!battleStatusActive(originalDesc,'confusion')
    });
    const actual=applyFriendlyEnemyHit(
      'pet',pet.name,target,r,pet.id,{deferItemCrush:true}
    );
    const actualDesc=actual
      ?{kind:'enemy',unit:actual,unitId:actual.id}
      :originalDesc;

    // fixed BattleModel alive branch: ItemCrush happens even on DODGE/MISS/0 damage,
    // but is skipped completely when the actual defender died.
    const itemCrushRoll=sourceBattleModelAliveItemCrushRng(r,actualDesc);

    let status=null;
    if(spec.statusType&&n(r?.damage)>0&&battleStatusDescAlive(actualDesc)){
      const check=battleStatusChance(
        {kind:'pet',pet,petId:pet.id},actualDesc,spec.statusType,
        {perOffset:spec.effectHit,range:30,bai:1,forceGeneral:true}
      );
      let applied=false;
      if(check.allowed&&check.success){
        // BATTLE_BattleModel_ATTACK stores iTurn exactly, unlike common StatusChange (+1).
        applied=battleStatusApplyRaw(actualDesc,spec.statusType,spec.turns);
      }
      status={
        applied,type:spec.statusType,turns:spec.turns,
        per:check.per,reason:check.reason||(!check.success?'roll':null)
      };
      if(applied){
        addLog(
          battleStatusDescName(actualDesc)+' 被「'+label+'」附加'
            +(BATTLE_STATUS_NAMES[spec.statusType]||spec.statusType)
            +' '+spec.turns+' 回合（BattleModel 原檢定 '+check.per.toFixed(1)+'%）。',
          'pet'
        );
      }
    }

    results.push({
      objectIndex:i,actionNumber,
      targetUnitId:target.id,actualTargetUnitId:actual?.id||target.id,
      guardianUnitId:r?.guardian?.id||null,
      randomTargetRoll,itemCrushRoll,r,status
    });
  }

  // BATTLE_COM_S_BATTLE_MODEL calls BATTLE_BattleModel() and immediately breaks.
  // There is no ordinary Counter loop and no per-object BATTLE_AddProfit.
  return {
    handled:true,skillId:action?.skillId,spec,power,
    sourceTargetDescIgnored:true,
    initialTargetUnitIds:initial.map(unit=>unit.id),
    sourceSortSlots:SOURCE_SARS_SLOT_ORDER.slice(),
    sequenceLength:sequence.length,results,
    sourceNoCounter:true,sourceNoPerObjectAddProfit:true
  };
}

function sourcePerformPetAttackCrazedSkill(pet,action,options={}){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const count=Math.max(0,sourceCAtoi(meta?.o));
  const label=meta?.n||'狂亂暴走';
  const base=petBattleView(pet);
  if(!base)return {handled:true,skillId:action?.skillId,missingPet:true};

  // fixed PETSKILL_AttackCrazed() uses the current round FIX values directly:
  // WORKATTACKPOWER = trunc(FIXSTR * 0.8), WORKDEFENCEPOWER = trunc(FIXTOUGH * 0.7).
  // It stores atoi(option) in COM3 high; BATTLE_AttackSeq later uses that exact value
  // as attack_max, without gDamageDiv. 613 therefore performs three full-damage attacks.
  const baseAttack=Math.trunc(n(base.attack));
  const baseDefense=Math.trunc(n(base.defense));
  const attack=Math.trunc(baseAttack*.8);
  const defense=Math.trunc(baseDefense*.7);
  battlePetPowerMods.set(pet.id,{
    attack,defense,skillId:action?.skillId,sourceAttackCrazed:true
  });

  // Player Pets have no CHAR_ARM in this runtime, so fixed BATTLE_GetWepon() is ITEM_FIST.
  // BATTLE_TargetListSet(ATTCRAZED) first fills every aDefList entry with the original COM2,
  // then snapshots live entries from defsub through i < deftop. For Enemy side 10..19 this
  // source loop is 10..18: slot 19 is intentionally excluded by the original '< deftop'.
  // When at least one such entry exists, ALL count target RANDs are consumed before the
  // first BATTLE_Attack. If none exists, the initial COM2-filled list is left untouched and
  // no target-list RNG is consumed.
  const originalTarget=action?.targetDesc?.kind==='enemy'?action.targetDesc.unit:null;
  const sourcePool=targetableEnemyUnits().filter(unit=>{
    const slot=Math.trunc(n(unit?.battleSlot));
    return slot>=0&&slot<9;
  });
  const plannedTargets=[];
  const targetRolls=[];
  if(sourcePool.length){
    for(let i=0;i<count;i++){
      const roll=cRand(0,sourcePool.length-1);
      targetRolls.push(roll);
      plannedTargets.push(sourcePool[roll]);
    }
  }else{
    for(let i=0;i<count;i++)plannedTargets.push(originalTarget);
  }

  addLog(
    pet.name+' 隨機使用「'+label+'」：攻 80%／防 70%，依原 COM3 high 連續攻擊 '+count+' 次。',
    'pet'
  );

  let hits=0,lastTarget=null,lastActual=null,lastResult=null;
  let sourceCounterReady=false;
  for(let i=0;i<count;i++){
    if(!petIsBattleActive(pet)||!enemy)break;

    let target=null;
    if(i===0){
      // Non-BOW source quirk: pList[0] was already randomly generated above, but the
      // first hit still TargetAdjusts the ORIGINAL COM2. The first pre-roll is consumed
      // yet its selected value is not used.
      target=sourcePetEnemyTargetFromAction(action);
    }else{
      // Later segments restore aDefList[i], then run BATTLE_TargetAdjust. A pre-rolled
      // target that died/vanished falls back to BATTLE_DefaultAttacker and consumes the
      // fallback target RNG at this point.
      const raw=plannedTargets[i];
      if(raw&&n(raw.hp)>0&&!enemyUnitHidden(raw)){
        target=raw;
      }else{
        const list=targetableEnemyUnits();
        target=list.length?list[cRand(0,list.length-1)]:null;
      }
    }
    if(!target)break;

    const attacker=petBattleView(pet);
    const targetDesc={kind:'enemy',unit:target,unitId:target.id};
    const r=resolveAttackToEnemyWithGuardian(attacker,target,{
      guarding:!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion')
    });
    const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
    sourceProcessBattleDeathsAtAddProfit();

    hits++;
    lastTarget=target;
    lastActual=actual;
    lastResult=r;

    // fixed loop breaks immediately after ++attack_count reaches attack_max and keeps
    // the final defNo / ContFlg for the single outer Counter chain.
    if(hits>=count){
      sourceCounterReady=true;
      break;
    }
    if(!petIsBattleActive(pet))break;
  }

  if(sourceCounterReady&&lastResult&&lastActual?.hp>0&&petIsBattleActive(pet)){
    resolvePetEnemyCounterChain('pet',pet,lastActual,lastResult);
  }
  return {
    handled:true,skillId:action?.skillId,hits,attackCount:count,
    baseAttack,baseDefense,attack,defense,
    targetRolls,plannedTargetUnitIds:plannedTargets.map(unit=>unit?.id||null),
    sourcePoolUnitIds:sourcePool.map(unit=>unit.id),
    sourceExcludedSlot19:true,sourceCounterReady,
    targetUnitId:lastTarget?.id||null,actualTargetUnitId:lastActual?.id||null,lastResult
  };
}

function sourcePerformPetAttackShootSkill(pet,action,options={}){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const parts=String(meta?.o||'').split('|');
  const min=sourceCAtoi(parts[0]);
  const max=sourceCAtoi(parts[1]);
  const attackMax=cRand(min,max);
  const label=meta?.n||'栗子連激';

  // fixed PETSKILL_AttackShoot() first RANDs the count from option min|max.
  // Its loyal>=100 burst branch is unreachable from BATTLE_PetLoyalCheck RANDOMACT:
  // RANDOMACT exists only for FIXAI 20..39. Do not consume RAND(1,300) / RAND(1,50).
  // The skill leaves WORK attack/defense unchanged; the commented 1.2/n code is inert.
  addLog(
    pet.name+' 隨機使用「'+label+'」：'+attackMax+' 顆，每擊傷害依原 gDamageDiv 除以 '+attackMax+'。',
    'pet'
  );

  // Same fixed TargetListSet branch as ATTCRAZED. Enemy side 10..19 is scanned with
  // i < deftop, so only source slots 10..18 (Web battleSlot 0..8) enter the pre-roll pool.
  // If this pool is non-empty, ALL attackMax target RANDs happen before the first hit.
  // If empty, the original COM2-filled aDefList remains and no target-list RNG is consumed.
  const originalTarget=action?.targetDesc?.kind==='enemy'?action.targetDesc.unit:null;
  const sourcePool=targetableEnemyUnits().filter(unit=>{
    const slot=Math.trunc(n(unit?.battleSlot));
    return slot>=0&&slot<9;
  });
  const plannedTargets=[];
  const targetRolls=[];
  if(sourcePool.length){
    for(let i=0;i<attackMax;i++){
      const roll=cRand(0,sourcePool.length-1);
      targetRolls.push(roll);
      plannedTargets.push(sourcePool[roll]);
    }
  }else{
    for(let i=0;i<attackMax;i++)plannedTargets.push(originalTarget);
  }

  const segments=[];
  let attackCount=0,sourceLoopExit='target-list-end';
  for(let i=0;i<attackMax;i++){
    if(!petIsBattleActive(pet)||!enemy){
      sourceLoopExit='attacker-dead';
      break;
    }
    if(!targetableEnemyUnits().length){
      sourceLoopExit='battle-side-empty';
      break;
    }

    let target=null;
    if(i===0){
      // Player Pet has no CHAR_ARM => non-BOW. Source consumes plannedTargets[0] RNG but
      // still TargetAdjusts the original COM2 for the first hit.
      target=sourcePetEnemyTargetFromAction(action);
    }else{
      const raw=plannedTargets[i];
      if(raw&&n(raw.hp)>0&&!enemyUnitHidden(raw)){
        target=raw;
      }else{
        const list=targetableEnemyUnits();
        target=list.length?list[cRand(0,list.length-1)]:null;
      }
    }
    if(!target){
      sourceLoopExit='target-adjust-failed';
      break;
    }

    const attacker=petBattleView(pet);
    const targetDesc={kind:'enemy',unit:target,unitId:target.id};
    const r=resolveAttackToEnemyWithGuardian(attacker,target,{
      guarding:!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion'),
      damageDivisor:attackMax
    });

    // fixed BATTLE_Attack order for ATTSHOOT:
    // DamageWakeUp -> special RAND(1,5) sleep -> ItemCrush -> return -> BATTLE_AddProfit.
    // Defer the shared ItemCrush RNG so the sleep roll stays in its exact source position.
    const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id,{deferItemCrush:true});
    let sleepRoll=null,sleepApplied=false;
    if(n(r?.damage)>0){
      sleepRoll=cRand(1,5);
      if(sleepRoll>4&&actual){
        sleepApplied=sourceAttackShootApplySleep({kind:'enemy',unit:actual,unitId:actual.id});
      }
    }
    sourceBattleFinalizeItemCrushRng(r);
    sourceProcessBattleDeathsAtAddProfit();

    attackCount++;
    segments.push({
      targetUnitId:target.id,actualTargetUnitId:actual?.id||null,
      r,sleepRoll,sleepApplied
    });

    if(attackCount>=attackMax){
      sourceLoopExit='attack-max';
      break;
    }
    if(!petIsBattleActive(pet)){
      sourceLoopExit='attacker-dead';
      break;
    }
  }

  // fixed BATTLE_Counter / BATTLE_CounterCheck explicitly return FALSE when either
  // participant still has COM1 == BATTLE_COM_S_ATTSHOOT. No post-loop Counter RNG.
  return {
    handled:true,skillId:action?.skillId,attackMax,attackCount,hits:attackCount,
    min,max,sourceRandomActFixAiBelow40:true,loyaltyBurstEligible:false,
    protocol:'BB-w0-forced',targetRolls,
    plannedTargetUnitIds:plannedTargets.map(unit=>unit?.id||null),
    sourcePoolUnitIds:sourcePool.map(unit=>unit.id),
    sourceExcludedSlot19:true,segments,sourceLoopExit,counterBlocked:true
  };
}

function sourcePerformPetWildViolentSkill(pet,action,options={}){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const option=String(meta?.o||'');
  const attackPct=enemySignedSkillPercent(option,'攻%');
  const defensePct=enemySignedSkillPercent(option,'防%');
  const duckMatch=option.match(/回?避([+-]?\d+)/);
  const duckBonus=duckMatch?Math.trunc(Number(duckMatch[1])||0):0;
  const base=petBattleView(pet);
  if(!base)return {handled:true,skillId:action?.skillId,missingPet:true};

  // fixed PETSKILL_WildViolentAttack() writes WORK attack/defense immediately from this
  // round's FIXSTR/FIXTOUGH. BATTLE_PetLoyalCheck() runs only after EntrySort, so these
  // RANDOMACT work values affect this action/counter chain, not the already-fixed turn order.
  const baseAttack=Math.trunc(n(base.attack));
  const baseDefense=Math.trunc(n(base.defense));
  const attack=baseAttack+Math.trunc(baseAttack*attackPct/100);
  const defense=baseDefense+Math.trunc(baseDefense*defensePct/100);
  battlePetPowerMods.set(pet.id,{
    attack,defense,skillId:action?.skillId,sourceWildViolent:true
  });

  // battle.c overwrites the already-primed attack_max with RAND(3,10), then uses that
  // same value as gDamageDiv. Captured Pets have no CHAR_ARM, so this is the common
  // non-BOW direct-attack loop with raw COM2 re-adjusted on every later segment.
  const count=cRand(3,10);
  addLog(
    pet.name+' 隨機使用「'+(meta?.n||'狂暴攻擊')+'」：'+count+' 段，攻 '
      +(attackPct>=0?'+':'')+attackPct+'%／防 '+(defensePct>=0?'+':'')+defensePct
      +'%／目標回避 +'+duckBonus+'。',
    'pet'
  );

  let lastResult=null,lastActual=null,hits=0,lastTarget=null;
  for(let step=0;step<count;step++){
    if(!petIsBattleActive(pet)||!enemy)break;
    // fixed BATTLE_TargetListSet pre-fills every non-BOW slot with the original COM2.
    // Each later segment writes that raw slot back and calls BATTLE_TargetAdjust again.
    const target=sourcePetEnemyTargetFromAction(action);
    if(!target)break;
    const attacker=petBattleView(pet);
    const targetDesc={kind:'enemy',unit:target,unitId:target.id};
    const r=resolveAttackToEnemyWithGuardian(attacker,target,{
      guarding:!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion'),
      damageDivisor:count,
      duckBonusPercent:duckBonus
    });
    const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
    sourceProcessBattleDeathsAtAddProfit();
    hits++;
    lastResult=r;
    lastActual=actual;
    lastTarget=target;
  }

  // The common direct-attack loop performs Counter only after all attack_max segments,
  // using the final BATTLE_Attack result/defNo.
  if(lastResult&&lastActual?.hp>0&&petIsBattleActive(pet)){
    resolvePetEnemyCounterChain('pet',pet,lastActual,lastResult);
  }
  return {
    handled:true,skillId:action?.skillId,hits,attackCount:count,
    attackPct,defensePct,duckBonus,attack,defense,
    targetUnitId:lastTarget?.id||null,actualTargetUnitId:lastActual?.id||null,
    lastResult
  };
}

function sourcePerformPetSpeedyAttackSkill(pet,action,options={}){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const defensePct=enemySignedSkillPercent(meta?.o,'防%');
  const base=petBattleView(pet);
  if(!base)return {handled:true,skillId:action?.skillId,missingPet:true};

  const baseDefense=Math.trunc(n(base.defense));
  const defense=baseDefense+Math.trunc(baseDefense*defensePct/100);
  // PETSKILL_SpeedyAttack() itself only writes WORKDEFENCEPOWER. The advertised 敏%+30
  // is not parsed there; battle.c implements it only in BATTLE_DexCalc for this COM.
  // Low-loyalty RANDOMACT happens after EntrySort, so that DexCalc branch is too late to
  // change this round's position. Keep the defense work value for attack/counter only.
  battlePetPowerMods.set(pet.id,{
    defense,skillId:action?.skillId,sourceSpeedyAttack:true
  });

  const target=sourcePetEnemyTargetFromAction(action);
  addLog(
    pet.name+' 隨機使用「'+(meta?.n||'疾速攻擊')+'」（防 '
      +(defensePct>=0?'+':'')+defensePct
      +'%；低忠誠 RANDOMACT 發生在排序後，本輪不倒帶套用 +30% 排序敏捷）。',
    'pet'
  );
  if(!target){
    return {
      handled:true,skillId:action?.skillId,noTarget:true,
      defensePct,defense,sourceDexOrderAlreadyFixed:true
    };
  }

  const attacker=petBattleView(pet);
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const r=resolveAttackToEnemyWithGuardian(attacker,target,{
    guarding:!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion')
  });
  const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
  sourceProcessBattleDeathsAtAddProfit();
  if(petIsBattleActive(pet)&&actual?.hp>0){
    resolvePetEnemyCounterChain('pet',pet,actual,r);
  }
  return {
    handled:true,skillId:action?.skillId,targetUnitId:target.id,
    actualTargetUnitId:actual?.id||null,defensePct,defense,
    sourceDexOrderAlreadyFixed:true,r
  };
}

function sourcePerformPetSacrificeSkill(pet,action){
  const meta=action?.meta;
  syncPetBattleHp(pet,true);
  const beforeCaster=Math.max(0,Math.trunc(n(pet?.hp)));
  const maxCaster=Math.max(1,Math.trunc(n(pet?.maxHp)));

  // PETSKILL_Sacrifice() gates before writing COM1: strictly HP > WORKMAXHP*0.2.
  // BATTLE_PetRandomSkill() already cleared COM1 to NONE, so a failed gate remains NoAction.
  if(!(beforeCaster>maxCaster*.2)){
    addLog(
      pet.name+' 隨機抽到「'+(meta?.n||'救援')+'」，但自身耐久力不足（HP '
        +beforeCaster+' / '+maxCaster+'）；原 PETSKILL_Use() FALSE，本回合不行動。',
      'pet'
    );
    return {
      handled:true,skillId:action?.skillId,noAction:true,sourceUseFailed:true,
      hpGateFailed:true,beforeCaster,maxCaster
    };
  }

  const target=sourcePetEnemyTargetFromAction(action);
  if(!target){
    // PETSKILL_Use already succeeded, but battle.c BATTLE_TargetAdjust can still fail later.
    addLog(pet.name+' 使用「'+(meta?.n||'救援')+'」，但執行時已沒有可作用的目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true,beforeCaster,maxCaster};
  }

  // fixed BATTLE_S_Sacrifice first halves caster HP (C int truncation), then heals the
  // single defindex by that post-halving HP. Although it calls BATTLE_MultiList for the
  // animation, the actual CHAR_HP write is only to defindex.
  pet.hp=Math.max(0,Math.trunc(beforeCaster*.5));
  const transfer=Math.max(0,Math.trunc(n(pet.hp)));
  const beforeTarget=Math.max(0,Math.trunc(n(target.hp)));
  const maxTarget=Math.max(1,Math.trunc(n(target.maxHp)));
  target.hp=Math.min(maxTarget,beforeTarget+transfer);
  const healed=Math.max(0,Math.trunc(n(target.hp))-beforeTarget);

  addLog(
    pet.name+' 低忠誠隨機使用「'+(meta?.n||'救援')+'」：自身 HP '
      +beforeCaster+' → '+pet.hp+'，反而替敵方 '+target.name+' 回復 '+healed
      +' HP（來源轉移值 '+transfer+'）。',
    'bad'
  );
  // No physical BATTLE_Attack and no Counter loop.
  return {
    handled:true,skillId:action?.skillId,targetUnitId:target.id,
    beforeCaster,afterCaster:pet.hp,transfer,beforeTarget,afterTarget:target.hp,healed
  };
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

function sourcePetCommonAttackContFlg(pet,originalTarget,actualTarget,r){
  // fixed BATTLE_Attack() seeds iRet=TRUE, then disables the common Counter loop when:
  // - attacker or ORIGINAL defindex already has DamageReact before AttackSeq;
  // - AttackSeq returns CRITICAL;
  // - the actual (Guardian-substituted) defindex is guarding;
  // - the actual defindex dies.
  // DODGE / MISS / ARRANGE do not by themselves clear iRet.
  const attackerHadDamageReact=!!pet&&battlePetAcupunctureIds.has(pet.id);
  const originalTargetHadDamageReact=!!originalTarget?.acupunctureActive;
  const actualAlive=!!actualTarget&&n(actualTarget.hp)>0;
  const contFlg=!attackerHadDamageReact&&!originalTargetHadDamageReact
    &&!r?.critical&&!r?.guarded&&actualAlive;
  return {
    contFlg,attackerHadDamageReact,originalTargetHadDamageReact,actualAlive
  };
}
function sourcePetCommonCounterResult(r){
  // Guardian only rewrites BATTLE_Attack()'s LOCAL defindex. battle.c's outer common
  // loop keeps the raw/TargetAdjusted defNo, so Counter starts from the original target.
  // resolvePetEnemyCounterChain normally treats r.guardian as "do not counter"; remove
  // only that JS helper marker while keeping Critical/Guard/etc source return state.
  if(!r)return r;
  if(!r.guardian)return r;
  const seed=Object.assign({},r);
  delete seed.guardian;
  delete seed.protectedTarget;
  seed.sourceOuterDefNoPreservedThroughGuardian=true;
  return seed;
}
function sourcePerformPetShowMercySkill(pet,action,options={}){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const label=meta?.n||'手下留情';
  const target=sourcePetEnemyTargetFromAction(action);
  if(!target){
    addLog(pet.name+' 使用「'+label+'」，但 BATTLE_TargetAdjust 找不到有效目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true};
  }

  const attacker=petBattleView(pet);
  if(!attacker)return {handled:true,skillId:action?.skillId,missingPet:true};
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const r=resolveAttackToEnemyWithGuardian(attacker,target,{
    guarding:!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion')
  });
  const actual=r?.actualTarget||target;
  const hpBefore=Math.max(0,Math.trunc(n(actual?.hp)));
  const originalDamage=Math.max(0,Math.trunc(n(r?.damage)));

  // fixed BATTLE_DamageSub ordering: SHOWMERCY clamps lethal damage BEFORE DamageReact.
  // This uses the Guardian-substituted defindex, because BATTLE_Attack() rewrites its
  // local defindex to Guardian immediately after AttackSeq.
  let clamped=false;
  if(r&&!r.dodged&&!r.miss&&originalDamage>0&&hpBefore-originalDamage<=0){
    r.damage=Math.max(0,hpBefore-1);
    r.showMercyClamped=true;
    r.showMercyOriginalDamage=originalDamage;
    clamped=true;
  }

  const actualApplied=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
  sourceProcessBattleDeathsAtAddProfit();

  const cont=sourcePetCommonAttackContFlg(pet,target,actualApplied||actual,r);
  let counterAttempted=false;
  // SHOWMERCY is the one common skill battle.c deliberately does NOT rewrite to ATTACK.
  // Therefore the original target may counter once, but the Pet cannot counter back:
  // BATTLE_Counter() only accepts ATTACK / NOGUARD as the counterer's COM1.
  if(cont.contFlg&&petIsBattleActive(pet)&&n(target.hp)>0){
    counterAttempted=true;
    resolvePetEnemyCounterChain(
      'pet',pet,target,sourcePetCommonCounterResult(r),{maxDepth:1}
    );
  }

  addLog(
    pet.name+' 隨機使用「'+label+'」'+
      (clamped?'：原傷害 '+originalDamage+' 會致死，依原 C 先壓到 '+r.damage+'。':
        '：本次不需要啟動 HP-1 致死保護。'),
    'pet'
  );
  return {
    handled:true,skillId:action?.skillId,showMercy:true,
    targetUnitId:target.id,actualTargetUnitId:actualApplied?.id||actual?.id||null,
    hpBefore,originalDamage,clamped,r,counterAttempted,
    sourceCounterMaxDepth:1,
    sourceOuterCounterTargetUnitId:target.id,
    sourcePrimaryContFlg:cont
  };
}
function sourcePerformPetBecomePigSkill(pet,action,options={}){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const label=meta?.n||'黑烏力化';
  const target=sourcePetEnemyTargetFromAction(action);
  if(!target){
    addLog(pet.name+' 使用「'+label+'」，但 BATTLE_TargetAdjust 找不到有效目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true,pigRoll:null};
  }

  const attacker=petBattleView(pet);
  if(!attacker)return {handled:true,skillId:action?.skillId,missingPet:true,pigRoll:null};
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const r=resolveAttackToEnemyWithGuardian(attacker,target,{
    guarding:!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion')
  });
  const actual=r?.actualTarget||target;
  const actualApplied=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
  sourceProcessBattleDeathsAtAddProfit();

  const cont=sourcePetCommonAttackContFlg(pet,target,actualApplied||actual,r);
  let counterAttempted=false;
  // BECOMEPIG is NOT exempted by the common-loop COM1 rewrite, so before BATTLE_Attack
  // the Pet's COM1 becomes ATTACK. It can therefore participate in the full 5-step
  // Counter chain, while outer defNo still points at the original target through Guardian.
  if(cont.contFlg&&petIsBattleActive(pet)&&n(target.hp)>0){
    counterAttempted=true;
    resolvePetEnemyCounterChain(
      'pet',pet,target,sourcePetCommonCounterResult(r)
    );
  }

  // The pig post-effect is evaluated only AFTER the whole common Counter loop.
  // Condition order is return-state -> TargetCheck(defNo) -> target CHAR_TYPEPLAYER
  // -> opposite side -> BECOMEPIG cap -> option parse -> rand()%100.
  // Player Pet RANDOMACT targets Enemy entries (CHAR_TYPEENEMY), so the PLAYER-type
  // condition always fails before option parsing and before rand(). Preserve zero RNG.
  const sourceReturnEligible=!!r&&!r.miss&&!r.dodged&&!r.allGuard&&!r.arranged;
  const sourcePostTargetAlive=n(target.hp)>0&&!enemyUnitHidden(target);
  const sourceTargetType='CHAR_TYPEENEMY';
  const sourceTargetTypeEligible=false;
  const pigRoll=null;

  addLog(
    pet.name+' 隨機使用「'+label+'」完成物理攻擊；原 C 後置烏力化要求 defNo 為 CHAR_TYPEPLAYER，'+
    target.name+' 是 Enemy，因此在 rand()%100 之前就停止判定。','pet'
  );
  return {
    handled:true,skillId:action?.skillId,becomePig:true,
    targetUnitId:target.id,actualTargetUnitId:actualApplied?.id||actual?.id||null,
    r,counterAttempted,sourceOuterCounterTargetUnitId:target.id,
    sourcePrimaryContFlg:cont,sourceReturnEligible,sourcePostTargetAlive,
    sourceTargetType,sourceTargetTypeEligible,pigRoll,
    sourceOptionNotParsed:true,sourceNoPigRng:true
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

function sourcePerformPetBattlePropertySkill(pet,action){
  if(!pet||!petIsBattleActive(pet))return {handled:true,missingPet:true};
  const meta=action?.meta;
  // BATTLE_S_PetSkillProperty copies PETSKILL_OPTION into CHAR_BATTLEPROPERTY, reconstructs
  // the function table, and battle.c then calls BATTLE_NoAction. No TargetAdjust / extra RNG.
  if(String(meta?.o||'')!=='PET_PetskillPropertyEvent'){
    addLog(pet.name+' 抽到 '+(meta?.n||'戰鬥屬性技')+'，但 callback 名稱不是固定來源值；不猜效果。','pet');
    return {handled:true,skillId:action?.skillId,sourceRuntimePending:true};
  }
  const desc={kind:'pet',pet,petId:pet.id};
  const key=battleStatusKey(desc);
  if(key)battlePropertyKeys.add(key);
  addLog(pet.name+' 使用「'+(meta?.n||'魔之詛咒')+'」：本場戰鬥啟用原 PET_PetskillPropertyEvent 屬性剋制 callback。','pet');
  return {handled:true,skillId:action?.skillId,battleProperty:true,noAction:true};
}
function sourcePerformPetAntInterSkill(pet,action,options={}){
  // ANTINTER only enters its special branch when COM2 is a dead CHAR_TYPEPET.
  // RANDOMACT's COM2 came from BATTLE_DefaultAttacker, which only returns live TargetCheck targets.
  // In this Player-Pet PVE path, a live Enemy therefore falls through into the common physical block.
  const target=action?.targetDesc;
  if(target?.kind==='enemy'&&target.unit&&n(target.unit.hp)>0){
    addLog(pet.name+' 隨機使用「'+(action?.meta?.n||'蟻葬')+'」；目標仍存活，依原 C 落入普通物理攻擊。','pet');
    const result=sourcePerformPetAttackTarget(pet,target,options,{loyalty:true,skillId:action?.skillId});
    return Object.assign({},result,{skillId:action?.skillId,sourceAntInterFallthrough:true});
  }
  addLog(pet.name+' 的「'+(action?.meta?.n||'蟻葬')+'」沒有符合原 C 可執行的隨機目標。','pet');
  return {handled:true,skillId:action?.skillId,noTarget:true,sourceAntInter:true};
}
const SOURCE_VARY_WOLF_PETIDS=new Set([981,982,983,984]);
function sourcePetRoarPetIds(meta){
  return String(meta?.o||'').split('|').map(sourceCAtoi).filter(v=>Number.isFinite(v));
}
function sourcePerformPetStealMoneySkill(pet,action){
  if(!pet||!petIsBattleActive(pet))return {handled:true,missingPet:true};
  const meta=action?.meta;
  const label=meta?.n||'捐獻';

  // battle.c performs BATTLE_TargetAdjust before BATTLE_StealMoney().
  const target=sourcePetEnemyTargetFromAction(action);
  if(!target){
    addLog(pet.name+' 使用「'+label+'」，但 BATTLE_TargetAdjust 找不到有效目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true};
  }

  const goldBefore=Math.max(0,Math.trunc(n(state.gold)));
  const maxGold=sourcePlayerMaxGold(state);

  // Fixed BATTLE_StealMoney: CHAR_TYPEENEMY => per=5.
  // A PET attacker whose owner is already at max gold then forces per back to 0.
  let per=5;
  const ownerGoldFull=goldBefore>=maxGold;
  if(ownerGoldFull)per=0;

  // This RAND is unconditional even when per was forced to 0.
  const roll=cRand(1,100);
  const success=roll<per;
  let goldRoll=null,gained=0;

  if(success){
    // Enemy target branch does NOT read/subtract Enemy GOLD. It simply creates RAND(10,100).
    goldRoll=cRand(10,100);
    gained=Math.min(goldRoll,Math.max(0,maxGold-goldBefore));
    state.gold=goldBefore+gained;

    // flg remains TRUE because RAND(10,100) can never be <=0. A successful PET attacker
    // is always BATTLE_PetDefaultExit()ed, DEFAULTPET=-1, then BATTLE_Exit(attacker).
    battlePetOutIds.add(pet.id);
    sourceClearPetBattleProperty(pet);
    sourceClearPetVary(pet);
    battlePetGuardIds.delete(pet.id);
    battlePetAcupunctureIds.delete(pet.id);
    battlePetNoGuardStates.delete(pet.id);
    battleMagicPetStates.delete(pet.id);
    battleMagicPetRoundStates.delete(pet.id);
    if(state.activePetId===pet.id)state.activePetId=null;

    addLog(
      pet.name+' 的「'+label+'」成功（RAND(1,100)='+roll+' < '+per+
      '）：由 Enemy 分支取得 RAND(10,100)='+goldRoll+' 石幣，主人實收 '+gained+
      '，Pet 隨後離開本場戰鬥。','good'
    );
  }else{
    addLog(
      pet.name+' 的「'+label+'」失敗（RAND(1,100)='+roll+'，成功值 '+per+
      (ownerGoldFull?'；主人已達金錢上限，原 C 先把 per 強制為 0':'')+'）。','pet'
    );
  }

  return {
    handled:true,skillId:action?.skillId,targetUnitId:target.id,
    sourceTargetType:'CHAR_TYPEENEMY',per,roll,success,
    goldRoll,goldBefore,gained,goldAfter:Math.max(0,Math.trunc(n(state.gold))),maxGold,
    ownerGoldFull,sourceEnemyGoldUntouched:true,
    attackerExited:success,sourceDefaultPetCleared:success,
    sourceNoDamage:true,sourceNoCounter:true
  };
}

function sourcePerformPetStealSkill(pet,action){
  if(!pet||!petIsBattleActive(pet))return {handled:true,missingPet:true};
  const meta=action?.meta;
  const label=meta?.n||'偷竊';

  // battle.c performs BATTLE_TargetAdjust before entering BATTLE_Steal().
  const target=sourcePetEnemyTargetFromAction(action);
  if(!target){
    addLog(pet.name+' 使用「'+label+'」，但 BATTLE_TargetAdjust 找不到有效目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true};
  }

  // Fixed BATTLE_Steal:
  //   CHAR_TYPEPLAYER => per=50
  //   every other target type (PET / ENEMY) => per=0
  // The success RAND is nevertheless called unconditionally.
  const per=0;
  const roll=cRand(1,100);
  const success=roll<per; // structurally impossible, but preserve the strict source comparison.

  addLog(
    pet.name+' 隨機使用「'+label+'」對 '+target.name+
    '；Enemy 目標的原 C 成功率固定 0，但仍消耗 RAND(1,100)='+roll+
    '，因此不進石幣／道具第二階段，Pet 也不離場。','pet'
  );

  return {
    handled:true,skillId:action?.skillId,targetUnitId:target.id,
    sourceTargetType:'CHAR_TYPEENEMY',per,roll,success,
    sourceFirstRollConsumed:true,sourceNoSecondRoll:true,
    sourceNoGoldMutation:true,sourceNoItemMutation:true,
    sourceAttackerStays:true,sourceNoDamage:true,sourceNoCounter:true
  };
}

function sourcePerformPetAbductSkill(pet,action){
  if(!pet||!petIsBattleActive(pet))return {handled:true,missingPet:true};
  const meta=action?.meta;
  const label=meta?.n||'旅程伙伴';

  // battle.c first performs BATTLE_TargetAdjust on the RANDOMACT opposing COM2.
  const target=sourcePetEnemyTargetFromAction(action);
  if(!target){
    addLog(pet.name+' 使用「'+label+'」，但 BATTLE_TargetAdjust 找不到有效目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true};
  }

  // _BATTLE_ABDUCTII only uses option AiPer when Deftype == CHAR_TYPEPET.
  // RANDOMACT's opposing target here is CHAR_TYPEENEMY, so both skill 130 (empty option)
  // and 607 (option 60) MUST use the old level formula.
  const attackLevel=Math.max(1,Math.trunc(n(pet.level)));
  const defLevel=Math.max(1,Math.trunc(n(target.level)));
  const aiPer=Math.max(0,sourceCAtoi(meta?.o));
  const per=Math.max(Math.trunc((defLevel-attackLevel)*.6+30),50);

  // BATTLE_Abduct always consumes RAND(1,100) after the source WinFunc gate.
  // Web encounter battles do not expose a source WinFunc callback, matching the normal null path.
  const roll=cRand(1,100);
  const success=roll<per;

  // Source always BATTLE_PetDefaultExit()s a PET attacker after the attempt, regardless
  // of success. Mark this before possibly tearing down the last-enemy battle so the web
  // cleanup observes the same final DEFAULTPET=-1 state.
  battlePetOutIds.add(pet.id);
  sourceClearPetBattleProperty(pet);
  sourceClearPetVary(pet);
  battlePetGuardIds.delete(pet.id);
  battlePetAcupunctureIds.delete(pet.id);
  battlePetNoGuardStates.delete(pet.id);
  battleMagicPetStates.delete(pet.id);
  battleMagicPetRoundStates.delete(pet.id);
  if(state.activePetId===pet.id)state.activePetId=null;

  let targetExit=null;
  if(success){
    // CHAR_TYPEENEMY success branch is BATTLE_Exit(defindex): no kill EXP / drop credit.
    addLog(
      pet.name+' 使用「'+label+'」成功把 '+target.name+
      ' 帶離戰鬥（RAND(1,100)='+roll+' < '+per+'）；此離場不是擊殺。','good'
    );
    targetExit=finishEnemyDirectExit(target,label+'帶離');
  }else{
    addLog(
      pet.name+' 使用「'+label+'」未能帶走 '+target.name+
      '（RAND(1,100)='+roll+' ≥ '+per+'）；但施術 Pet 仍依原 C 自己離場。','pet'
    );
  }

  return Object.assign({
    handled:true,skillId:action?.skillId,targetUnitId:target.id,
    attackLevel,defLevel,aiPer,per,roll,success,
    sourceTargetType:'CHAR_TYPEENEMY',
    sourceAiPerIgnoredForEnemy:true,
    attackerExited:true,sourceDefaultPetCleared:true,
    sourceNoDamage:true,sourceNoCounter:true,sourceNoKillReward:success
  },targetExit||{});
}

function sourcePerformPetRoarSkill(pet,action){
  if(!pet||!petIsBattleActive(pet))return {handled:true,missingPet:true};
  let target=action?.targetDesc?.kind==='enemy'&&action.targetDesc.unit&&n(action.targetDesc.unit.hp)>0
    ?action.targetDesc.unit:null;
  if(!target){
    // fixed BATTLE_COM_S_ROAR runs TargetAdjust at execution; an invalid COM2 falls back
    // to BATTLE_DefaultAttacker on the opposing side.
    const fallback=sourcePetRandomEnemyTarget();
    target=fallback?.unit||null;
  }
  if(!target){
    addLog(pet.name+' 使用「'+(action?.meta?.n||'大吼')+'」，但沒有可作用的目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true};
  }

  const petId=target.petId==null?null:Number(target.petId);
  if(!Number.isFinite(petId)){
    addLog(pet.name+' 使用「'+(action?.meta?.n||'大吼')+'」，但目標缺少可由原 C 證明的 CHAR_PETID；不猜效果。','pet');
    return {handled:true,skillId:action?.skillId,targetUnitId:target.id,sourcePetIdMissing:true};
  }
  const ids=sourcePetRoarPetIds(action?.meta);
  if(!ids.includes(Math.trunc(petId))){
    addLog(pet.name+' 使用「'+(action?.meta?.n||'大吼')+'」，'+target.name+' 的 PETID '+Math.trunc(petId)+' 不在此技能清單內。','pet');
    return {handled:true,skillId:action?.skillId,targetUnitId:target.id,petId:Math.trunc(petId),roared:false};
  }

  addLog(pet.name+' 使用「'+(action?.meta?.n||'大吼')+'」：'+target.name+'（PETID '+Math.trunc(petId)+'）被吼聲嚇離戰鬥。','good');
  const exit=finishEnemyDirectExit(target,action?.meta?.n||'大吼');
  return Object.assign({
    handled:true,skillId:action?.skillId,targetUnitId:target.id,petId:Math.trunc(petId),roared:true
  },exit);
}
function sourcePerformPetVarySkill(pet,action){
  if(!pet||!petIsBattleActive(pet))return {handled:true,missingPet:true};
  const petId=pet.petId==null?null:Number(pet.petId);
  if(!Number.isFinite(petId)||!SOURCE_VARY_WOLF_PETIDS.has(Math.trunc(petId))){
    // fixed PETSKILL_Vary returns FALSE before setting COM1/COM2 or any transform state.
    addLog(pet.name+' 抽到「'+(action?.meta?.n||'暗月變身')+'」，但 PETID 不是 981～984；原 PETSKILL_Vary() 直接 FALSE。','pet');
    return {handled:true,skillId:action?.skillId,sourceUseFailed:true,sourceVaryPetIdRejected:true};
  }
  const attackPct=Math.trunc(enemySignedSkillPercent(action?.meta?.o,'攻%'));
  const dexPct=Math.trunc(enemySignedSkillPercent(action?.meta?.o,'敏%'));
  battlePetVaryStates.set(pet.id,{
    skillId:action?.skillId??null,
    attackPct,dexPct,workTurn:0,sourceImage:101428
  });
  // fixed PETSKILL_Vary parses only 攻% / 敏%. The descriptive 魔防% token is not read here.
  addLog(pet.name+' 使用「'+(action?.meta?.n||'暗月變身')+'」：依原 C 攻 '+attackPct+'%／敏 '+dexPct+'%，WORKTURN 重設為 0。','pet');
  return {handled:true,skillId:action?.skillId,vary:true,attackPct,dexPct,workTurn:0};
}
function sourceAdvancePetVaryTurn(pet){
  if(!pet)return null;
  const vary=battlePetVaryStates.get(pet.id);
  if(!vary)return null;
  vary.workTurn=Math.trunc(n(vary.workTurn))+1;
  if(vary.workTurn>5){
    battlePetVaryStates.delete(pet.id);
    addLog(pet.name+' 的暗月變身依原 C WORKTURN > 5 結束，攻擊／敏捷回復 FIX 值。','pet');
    return {expired:true,workTurn:0};
  }
  return {expired:false,workTurn:vary.workTurn,attackPct:vary.attackPct,dexPct:vary.dexPct};
}
function sourceFinalizePetExecutedCommand(pet,result){
  const varyTurn=sourceAdvancePetVaryTurn(pet);
  return varyTurn?Object.assign({},result,{varyTurn}):result;
}

function sourcePetPierceFrontEnemy(primary){
  if(!primary)return null;
  const slot=sourceBattleStatusSlot({kind:'enemy',unit:primary,unitId:primary.id});
  if(slot<15||slot>=20)return null;
  const frontSlot=slot-5;

  // Source only checks BATTLE_No2Index(frontSlot) >= 0 here; it does NOT run TargetCheck
  // or EarthRound filtering for the second target. In the Web model, hp>0 represents an
  // entry still present in battle; hidden EarthRound entries remain valid for this direct index hit.
  const units=Array.isArray(enemy?.units)&&enemy.units.length?enemy.units:(enemy?[enemy]:[]);
  const unit=units.find(u=>u&&sourceBattleStatusSlot({kind:'enemy',unit,unitId:u.id})===frontSlot)||null;
  return unit&&n(unit.hp)>0?unit:null;
}

function sourcePetTryRegretDizzy(pet,target,successPct,label){
  // PROFESSION_BATTLE_StatusAttackCheck() consumes RAND first, then checks HP/death/existing status.
  const roll=cRand(1,100);
  const desc={kind:'enemy',unit:target,unitId:target?.id};
  if(!target||n(target.hp)<=0)return {attempted:true,applied:false,roll,reason:'dead'};
  if(battleHasAnyStatus(desc))return {attempted:true,applied:false,roll,reason:'existing-status'};
  if(roll>=successPct)return {attempted:true,applied:false,roll,reason:'roll'};

  // Source writes StatusTbl[DIZZY]=2 and then CanMove is checked after StatusSeq.
  // This runtime stores one blocked action as turns=1 (the StatusSeq adapter checks blockedBefore).
  const applied=battleStatusApply(desc,'dizzy',0);
  if(applied)addLog(target.name+' 被 '+label+' 擊暈，下一次行動無法動作。','pet');
  return {attempted:true,applied,roll,reason:applied?'success':'apply-failed'};
}

function sourcePet2TimidPowerMod(pet,meta){
  const base=petBattleView(pet);
  if(!base)return null;
  const option=String(meta?.o||'');
  const baseAttack=Math.trunc(n(base.attack));
  const baseDefense=Math.trunc(n(base.fixedTough));
  const baseQuick=Math.trunc(n(base.fixedDex));
  const power={skillId:meta?.id??null,source2Timid:true};
  let attack=baseAttack,defense=baseDefense,quick=baseQuick;
  let attackMatched=false,defenseMatched=false,quickMatched=false;

  const read=(token)=>{
    const m=option.match(new RegExp(token+'([0-9]+(?:\\.[0-9]+)?)'));
    return m?Math.max(0,Number(m[1])||0):null;
  };
  const negAttack=read('-攻%'),posAttack=read('\\+攻%');
  const negDefense=read('-防%'),posDefense=read('\\+防%');
  const negQuick=read('-敏%'),posQuick=read('\\+敏%');

  // Fixed PETSKILL_2BattleTimid parser quirk:
  // "-攻%50" writes FIXSTR * 0.50, not FIXSTR * (1-0.50).
  if(negAttack!=null){attack=Math.trunc(baseAttack*(negAttack/100));attackMatched=true;}
  else if(posAttack!=null){attack=Math.trunc(baseAttack+baseAttack*(posAttack/100));attackMatched=true;}
  if(negDefense!=null){defense=Math.trunc(baseDefense*(negDefense/100));defenseMatched=true;}
  else if(posDefense!=null){defense=Math.trunc(baseDefense+baseDefense*(posDefense/100));defenseMatched=true;}
  if(negQuick!=null){quick=Math.trunc(baseQuick*(negQuick/100));quickMatched=true;}
  else if(posQuick!=null){quick=Math.trunc(baseQuick+baseQuick*(posQuick/100));quickMatched=true;}

  if(attackMatched)power.attack=attack;
  if(defenseMatched)power.defense=defense;
  if(quickMatched)power.quick=quick;
  return {
    base,option,power,attack,defense,quick,
    attackMatched,defenseMatched,quickMatched
  };
}
function sourcePerformPetBattleTimidSkill(pet,action){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const label=meta?.n||'怯戰';
  const base=petBattleView(pet);
  if(!base)return {handled:true,skillId:action?.skillId,missingPet:true};

  // fixed PETSKILL_BattleTimid writes WORK powers immediately:
  // STR 70%, TOUGH 40%, DEX 80%. RANDOMACT is after EntrySort, so the quick write
  // cannot change this actor's already-decided position but remains source work state.
  const attack=Math.trunc(n(base.attack)*.7);
  const defense=Math.trunc(n(base.fixedTough)*.4);
  const quick=Math.trunc(n(base.fixedDex)*.8);
  battlePetPowerMods.set(pet.id,{
    attack,defense,quick,skillId:action?.skillId,sourceTimid:true
  });

  const target=sourcePetAdjustedAttackDamageTarget(action);
  if(!target){
    addLog(pet.name+' 使用「'+label+'」，但 BATTLE_TargetAdjust 找不到有效目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true,attack,defense,quick,sourceNoCounter:true};
  }

  const targetHpBefore=Math.max(0,Math.trunc(n(target.hp)));
  const hadDamageReact=sourcePetOriginalDamageReact(target);
  const localTimid=!hadDamageReact;
  const r=sourcePetAttackDamageCalcOnlyGuardianResult(pet,target,{attackerOverride:{attack}});
  if(!r)return {handled:true,skillId:action?.skillId,noTarget:true,attack,defense,quick,hadDamageReact,localTimid,sourceNoCounter:true};

  // Timid's possible BATTLE_Exit happens after damage/death/ItemCrush but before outer AddProfit.
  // Delay kill credit so a successful forced exit does not accidentally become a kill reward.
  const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id,{deferDeathCredit:true});

  let timidRoll=null,forcedExit=false,exit=null;
  // BATTLE_S_AttackDamage changes local skill_type to -1 on DamageReact or damage<=0,
  // so in either case the TIMID switch (and its rand()%100) is unreachable.
  if(localTimid&&n(r.damage)>0){
    timidRoll=cRand(0,99);
    // Source consumes this roll even at damage==1; only damage>1 may force the exit.
    if(timidRoll<15&&n(r.damage)>1){
      forcedExit=true;
      exit=finishEnemyDirectExit(target,label+'成功');
    }
  }

  // If the special did not BATTLE_Exit the Enemy, a lethal hit is a normal Pet kill.
  if(!forcedExit&&targetHpBefore>0&&n(target.hp)<=0){
    sourceMarkEnemyDeathCredit(target,[{kind:'pet',petId:pet.id}]);
  }

  addLog(
    pet.name+' 隨機使用「'+label+'」（攻70%／防40%／敏80%）'+
      (hadDamageReact?'；目標 DamageReact 令 local skill_type=-1，不抽怯戰 RNG。':
        (timidRoll==null?'；本次最終傷害為 0，不抽怯戰 RNG。':
          ('；rand()%100='+timidRoll+(forcedExit?'，Enemy 被迫 BATTLE_Exit。':'。')))),
    forcedExit?'good':'pet'
  );
  return {
    handled:true,skillId:action?.skillId,targetUnitId:target.id,
    actualTargetUnitId:actual?.id||target.id,r,attack,defense,quick,
    hadDamageReact,localTimid,timidRoll,forcedExit,exit,
    sourceNoCounter:true,sourceDeferredDeathCredit:true
  };
}
function sourcePerformPet2BattleTimidSkill(pet,action){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const label=meta?.n||'狂獅怒吼';
  const parsed=sourcePet2TimidPowerMod(pet,meta);
  if(!parsed)return {handled:true,skillId:action?.skillId,missingPet:true};
  parsed.power.skillId=action?.skillId;
  battlePetPowerMods.set(pet.id,parsed.power);

  const target=sourcePetAdjustedAttackDamageTarget(action);
  const timid=Math.max(0,Math.trunc(enemySkillNumber(meta?.o,/命%([0-9.]+)/,0)));
  if(!target){
    addLog(pet.name+' 使用「'+label+'」，但 BATTLE_TargetAdjust 找不到有效目標。','pet');
    return {
      handled:true,skillId:action?.skillId,noTarget:true,timid,
      attack:parsed.attack,defense:parsed.defense,quick:parsed.quick,
      attackMatched:parsed.attackMatched,defenseMatched:parsed.defenseMatched,quickMatched:parsed.quickMatched,
      sourceNoCounter:true
    };
  }

  const targetHpBefore=Math.max(0,Math.trunc(n(target.hp)));
  const hadDamageReact=sourcePetOriginalDamageReact(target);
  const localTimid=!hadDamageReact;
  const r=sourcePetAttackDamageCalcOnlyGuardianResult(pet,target,{
    attackerOverride:{attack:parsed.attack}
  });
  if(!r)return {handled:true,skillId:action?.skillId,noTarget:true,timid,hadDamageReact,localTimid,sourceNoCounter:true};

  const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id,{deferDeathCredit:true});
  let timidRoll=null,rollPassed=false,recalled=false;

  if(localTimid&&n(r.damage)>0){
    timidRoll=cRand(0,99);
    rollPassed=timidRoll<timid;
    // fixed S_2TIMID only performs BATTLE_PetIn when defindex is CHAR_TYPEPET.
    // Player Pet attacks CHAR_TYPEENEMY here, so even a passing roll + damage>1 never recalls/exits it.
    recalled=false;
  }

  if(targetHpBefore>0&&n(target.hp)<=0){
    sourceMarkEnemyDeathCredit(target,[{kind:'pet',petId:pet.id}]);
  }

  addLog(
    pet.name+' 隨機使用「'+label+'」'+
      (hadDamageReact?'；DamageReact 將 local skill_type=-1，不抽恐嚇 RNG。':
        (timidRoll==null?'；本次最終傷害為 0，不抽恐嚇 RNG。':
          ('；rand()%100='+timidRoll+'（命 '+timid+'%）'+
            (rollPassed&&n(r.damage)>1?'，但 Enemy 不是 CHAR_TYPEPET，因此不會被收回。':'。')))),
    'pet'
  );
  return {
    handled:true,skillId:action?.skillId,targetUnitId:target.id,
    actualTargetUnitId:actual?.id||target.id,r,timid,timidRoll,rollPassed,recalled,
    attack:parsed.attack,defense:parsed.defense,quick:parsed.quick,
    attackMatched:parsed.attackMatched,defenseMatched:parsed.defenseMatched,quickMatched:parsed.quickMatched,
    hadDamageReact,localTimid,sourceTargetType:'CHAR_TYPEENEMY',
    sourceNoCounter:true,sourceDeferredDeathCredit:true
  };
}

function sourcePetDirectEnemySideTargets(){
  // BATTLE_MultiList(TARGET_SIDE_x) is evaluated after the TargetAdjust gate and returns
  // TargetCheck-valid entries on the opposing side. EarthRound-hidden / dead entries are out.
  return targetableEnemyUnits().slice().sort((a,b)=>
    sourceBattleStatusSlot({kind:'enemy',unit:a,unitId:a.id})
      -sourceBattleStatusSlot({kind:'enemy',unit:b,unitId:b.id})
  );
}
function sourcePerformPetBatFlySkill(pet,action){
  const meta=action?.meta;
  const label=meta?.n||'群蝠四竄';

  // battle.c runs BATTLE_TargetAdjust first even though BATTLE_BatFly never uses defNo later.
  // Preserve a fallback target RNG when the raw RANDOMACT COM2 became invalid before execution.
  const gateTarget=sourcePetEnemyTargetFromAction(action);
  if(!gateTarget){
    addLog(pet.name+' 使用「'+label+'」，但 BATTLE_TargetAdjust 找不到有效目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true};
  }

  const targets=sourcePetDirectEnemySideTargets();
  syncPetBattleHp(pet,true);
  const beforeSelf=Math.max(0,Math.trunc(n(pet.hp)));
  const maxSelf=Math.max(1,Math.trunc(n(pet.maxHp)));
  let drained=0;
  const results=[];

  for(const unit of targets){
    const before=Math.max(0,Math.trunc(n(unit.hp)));
    if(before<=0)continue;
    // Current generated Enemy Battle Entries have no BATTLE_getRidePet relationship.
    // Therefore every Enemy deterministically uses BATTLE_BatFly's no-ride branch:
    // floor(currentHP/10), but HP 1..9 still loses exactly 1.
    const damage=Math.trunc(before/10)===0?1:Math.trunc(before/10);
    unit.hp=Math.max(0,before-damage);
    drained+=damage;
    results.push({unitId:unit.id,hpBefore:before,damage,hpAfter:unit.hp});
    addLog(pet.name+' 的「'+label+'」吸取 '+unit.name+' '+damage+' HP。','pet');
    if(before>0&&unit.hp<=0){
      sourceMarkEnemyDeathCredit(unit,[{kind:'pet',petId:pet.id}]);
      addLog(unit.name+' 被「'+label+'」吸乾而倒下。','bad');
    }
  }

  // Source quirk: on overflow it heals to MAXHP and then rewrites local addhp=0 only for
  // the outgoing protocol field. Actual HP is still MAXHP.
  let sourceProtocolAddHp=drained;
  if(beforeSelf+drained>maxSelf){
    pet.hp=maxSelf;
    sourceProtocolAddHp=0;
  }else{
    pet.hp=Math.min(maxSelf,beforeSelf+drained);
  }
  const healed=Math.max(0,Math.trunc(n(pet.hp))-beforeSelf);

  addLog(
    pet.name+' 由「'+label+'」總共吸取 '+drained+' HP，實際回復 '+healed+
      (sourceProtocolAddHp===0&&drained>0?'（超出上限時原 C 將顯示用 addhp 清 0）':'')+'。','pet'
  );

  // Direct CHAR_HP writes only: no AttackSeq / DamageSub / WakeUp / ItemCrush / Counter.
  // Enemy death rewards are credited now; generic actor outer AddProfit remains the boundary.
  return {
    handled:true,skillId:action?.skillId,gateTargetUnitId:gateTarget.id,
    targets:results,drained,beforeSelf,afterSelf:pet.hp,healed,sourceProtocolAddHp,
    sourceEnemyRidePetRuntime:false,sourceNoWake:true,sourceNoCounter:true,sourceNoInnerAddProfit:true
  };
}
function sourcePerformPetDivideAttackSkill(pet,action){
  const meta=action?.meta;
  const label=meta?.n||'分身地裂';

  // Same source gate as BatFly: TargetAdjust must succeed before the all-side helper runs.
  const gateTarget=sourcePetEnemyTargetFromAction(action);
  if(!gateTarget){
    addLog(pet.name+' 使用「'+label+'」，但 BATTLE_TargetAdjust 找不到有效目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true};
  }

  const targets=sourcePetDirectEnemySideTargets();

  // BATTLE_DivideAttack's first pass halves MP only for CHAR_TYPEPLAYER entries.
  // Player Pet attacks side-1 Enemy entries, all CHAR_TYPEENEMY, so this pass is a strict no-op.
  const mpResults=[];

  const results=[];
  for(const unit of targets){
    const before=Math.max(0,Math.trunc(n(unit.hp)));
    if(before<=0)continue;
    // No ride-pet relationship exists for generated Enemy entries, so use the fixed
    // no-ride branch: floor(currentHP/5), with HP 1..4 still losing exactly 1.
    const damage=Math.trunc(before/5)===0?1:Math.trunc(before/5);
    unit.hp=Math.max(0,before-damage);
    results.push({unitId:unit.id,hpBefore:before,damage,hpAfter:unit.hp});
    addLog(pet.name+' 的「'+label+'」對 '+unit.name+' 造成 '+damage+' 直接 HP 傷害。',unit.hp<=0?'bad':'pet');
    if(before>0&&unit.hp<=0){
      sourceMarkEnemyDeathCredit(unit,[{kind:'pet',petId:pet.id}]);
    }
  }

  // Direct CHAR_HP / CHAR_MP writes only. Source never invokes AttackSeq, DamageSub,
  // DamageWakeUp, ItemCrush or the common Counter loop here.
  return {
    handled:true,skillId:action?.skillId,gateTargetUnitId:gateTarget.id,
    mpResults,targets:results,sourceEnemyMpPassNoop:true,
    sourceEnemyRidePetRuntime:false,sourceNoWake:true,sourceNoCounter:true,sourceNoInnerAddProfit:true
  };
}

function sourcePerformPetTearSkill(pet,action){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const label=meta?.n||'撕裂傷口';
  const tearPct=sourceCAtoi(meta?.o);
  const base=petBattleView(pet);
  if(!base)return {handled:true,skillId:action?.skillId,missingPet:true};

  // fixed PETSKILL_BattleTearDamage() writes this round's WORK values before battle.c:
  // ATTACK = trunc(FIXSTR*0.9), DEFENCE = trunc(FIXTOUGH*0.8).
  // Low-loyalty RANDOMACT is after EntrySort, so DEF cannot reorder this turn,
  // but remains the Pet's work defence for later attacks in the same round.
  const baseAttack=Math.trunc(n(base.attack));
  const baseDefense=Math.trunc(n(base.defense));
  const attack=Math.trunc(baseAttack*.9);
  const defense=Math.trunc(baseDefense*.8);
  battlePetPowerMods.set(pet.id,{
    attack,defense,skillId:action?.skillId,sourceTear:true
  });

  const target=sourcePetAdjustedAttackDamageTarget(action);
  if(!target){
    addLog(pet.name+' 使用「'+label+'」，但 BATTLE_TargetAdjust 找不到有效目標。','pet');
    return {
      handled:true,skillId:action?.skillId,noTarget:true,
      tearPct,attack,defense,sourceNoCounter:true
    };
  }

  const targetMaxHp=Math.max(0,Math.trunc(n(target.maxHp)));
  const targetHpBefore=Math.max(0,Math.trunc(n(target.hp)));
  const missingHp=Math.max(0,targetMaxHp-targetHpBefore);

  // BATTLE_S_AttackDamage reads DamageReact before AttackSeq. Any positive react changes
  // the LOCAL skill_type to -1, so PETSKILLTEAR's missing-HP bonus is skipped entirely.
  // PETSKILL_Use's 90% attack / 80% defence writes have already happened and remain.
  const hadDamageReact=sourcePetOriginalDamageReact(target);
  const localTear=!hadDamageReact;
  const r=sourcePetAttackDamageCalcOnlyGuardianResult(pet,target,{
    attackerOverride:{attack}
  });
  if(!r)return {
    handled:true,skillId:action?.skillId,noTarget:true,
    tearPct,attack,defense,missingHp,hadDamageReact,localTear,sourceNoCounter:true
  };

  let tearBonus=0;
  if(!r.dodged&&localTear){
    // Source stores the float result back into int userhp, truncating toward zero.
    tearBonus=Math.trunc(missingHp*tearPct/100);
    // Source quirk: if the computed old-wound amount is <=0, base physical damage is zeroed.
    if(tearBonus<=0){
      r.damage=0;
      r.miss=true;
      r.sourceTearZeroedBaseDamage=true;
    }else{
      r.damage=Math.max(0,Math.trunc(n(r.damage)+tearBonus));
      r.miss=r.damage<=0;
      r.tearBonus=tearBonus;
    }
  }

  const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
  addLog(
    pet.name+' 隨機使用「'+label+'」：攻 90%／防 80%，目標已損 '+missingHp+
      ' HP，撕裂係數 '+tearPct+'%'+
      (hadDamageReact?'；目標 DamageReact 令原 C local skill_type=-1，撕裂追加被跳過。':
        (tearBonus>0?'，追加 '+tearBonus+' 傷害。':'；原 C 因撕裂追加 <=0，把本次傷害歸零。')),
    'pet'
  );

  // BATTLE_COM_S_PETSKILLTEAR is an isolated BATTLE_S_AttackDamage case.
  // It breaks before the common direct-attack Counter loop; command-end AddProfit stays outer.
  return {
    handled:true,skillId:action?.skillId,targetUnitId:target.id,
    actualTargetUnitId:actual?.id||target.id,r,tearPct,missingHp,tearBonus,
    attack,defense,hadDamageReact,localTear,sourceNoCounter:true
  };
}

function sourcePerformPetSonicSkill(pet,action){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const label=meta?.n||'音波衝擊';
  const primary=sourcePetAdjustedAttackDamageTarget(action);
  if(!primary){
    addLog(pet.name+' 使用「'+label+'」，但 BATTLE_TargetAdjust 找不到有效目標。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true};
  }

  const results=[];
  const hitOne=(target,secondary=false)=>{
    if(!target)return null;
    const hadDamageReact=sourcePetOriginalDamageReact(target);
    // BATTLE_S_AttackDamage changes local skill_type to -1 before AttackSeq on DamageReact.
    // Therefore SONIC2's 0.5 pre-Guard multiplier disappears for that target.
    const localSonic=!hadDamageReact;
    const r=sourcePetAttackDamageCalcOnlyGuardianResult(pet,target,{
      preGuardDamageMultiplier:secondary&&localSonic ? .5 : 1
    });
    if(!r)return null;
    r.ultimateCriticalEnemyOnly=true;
    const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);
    return {
      targetUnitId:target.id,actualTargetUnitId:actual?.id||target.id,
      secondary,hadDamageReact,localSonic,r
    };
  };

  const first=hitOne(primary,false);
  if(first)results.push(first);

  const secondaryTarget=sourcePetPierceFrontEnemy(primary);
  if(secondaryTarget){
    const second=hitOne(secondaryTarget,true);
    if(second)results.push(second);
  }

  // SONIC / SONIC2 are isolated BATTLE_S_AttackDamage calls. No common Counter loop;
  // the generic actor outer boundary owns the command-end AddProfit pass.
  addLog(
    pet.name+' 隨機使用「'+label+'」：主目標'+
      (secondaryTarget?'，並貫穿同欄前排 '+secondaryTarget.name+'（正常 SONIC2 傷害 ×0.5）。':'；沒有可對應的前排貫穿目標。'),
    'pet'
  );
  return {
    handled:true,skillId:action?.skillId,primaryUnitId:primary.id,
    secondaryUnitId:secondaryTarget?.id||null,results,sourceNoCounter:true
  };
}

function sourcePerformPetRegretSkill(pet,action){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const label=meta?.n||'憾甲一擊';
  const option=String(meta?.o||'');
  const successPct=Math.max(0,Math.trunc(enemySkillNumber(option,/命%([+-]?\d+)/,0)));
  const attackPct=enemySignedSkillPercent(option,'攻%');
  const hasDefenseToken=option.includes('防%');
  const defensePct=hasDefenseToken?enemySignedSkillPercent(option,'防%'):null;

  const base=petBattleView(pet);
  if(!base)return {handled:true,skillId:action?.skillId,missingPet:true};
  const baseAttack=Math.trunc(n(base.attack));
  const baseDefense=Math.trunc(n(base.defense));
  const attack=baseAttack+Math.trunc(baseAttack*attackPct/100);
  const powerMod={attack,skillId:action?.skillId,sourceRegret:true};
  let defense=baseDefense;
  if(hasDefenseToken){
    defense=baseDefense+Math.trunc(baseDefense*defensePct/100);
    powerMod.defense=defense;
  }
  // 666/718 use "防-20%" / "防-35%"; fixed PETSKILL_Regret searches "防%" exactly,
  // so those rows never enter the defense parser. Preserve that data/parser mismatch.
  battlePetPowerMods.set(pet.id,powerMod);

  const primary=sourcePetAdjustedAttackDamageTarget(action);
  if(!primary){
    addLog(pet.name+' 使用「'+label+'」，但 BATTLE_TargetAdjust 找不到有效目標。','pet');
    return {
      handled:true,skillId:action?.skillId,noTarget:true,attackPct,defensePct,
      defenseParserMatched:hasDefenseToken,attack,defense,successPct
    };
  }

  const results=[];
  const hitOne=(target,secondary=false)=>{
    if(!target)return null;
    const hadDamageReact=sourcePetOriginalDamageReact(target);
    const localRegret=!hadDamageReact;
    const r=sourcePetAttackDamageCalcOnlyGuardianResult(pet,target,{
      // BATTLE_DamageCalc checks attacker's COM1 and therefore keeps REGRET's FIXTOUGH
      // defense overwrite even if local BATTLE_S_AttackDamage skill_type became -1.
      useFixedToughDefense:true,
      preGuardDamageMultiplier:secondary&&localRegret ? .8 : 1,
      attackerOverride:{attack}
    });
    if(!r)return null;
    r.ultimateCriticalEnemyOnly=true;
    const actual=applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id);

    // Regret's status switch runs after ItemCrush and is skipped entirely when local
    // skill_type was downgraded by DamageReact.
    const dizzy=localRegret
      ?sourcePetTryRegretDizzy(pet,target,successPct,label)
      :{attempted:false,applied:false,reason:'damage-react-local-skilltype-minus1'};

    return {
      targetUnitId:target.id,actualTargetUnitId:actual?.id||target.id,
      secondary,hadDamageReact,localRegret,dizzy,r
    };
  };

  const first=hitOne(primary,false);
  if(first)results.push(first);
  const secondaryTarget=sourcePetPierceFrontEnemy(primary);
  if(secondaryTarget){
    const second=hitOne(secondaryTarget,true);
    if(second)results.push(second);
  }

  addLog(
    pet.name+' 隨機使用「'+label+'」（命 '+successPct+'%、攻 '
      +(attackPct>=0?'+':'')+attackPct+'%'
      +(hasDefenseToken?'、防 '+(defensePct>=0?'+':'')+defensePct+'%':'；來源防禦字串未匹配「防%」，防禦不變')
      +'）。',
    'pet'
  );
  return {
    handled:true,skillId:action?.skillId,primaryUnitId:primary.id,
    secondaryUnitId:secondaryTarget?.id||null,results,successPct,
    attackPct,defensePct,defenseParserMatched:hasDefenseToken,
    attack,defense,sourceNoCounter:true
  };
}

function sourcePetFirekillResolveTarget(action){
  const raw=action?.targetDesc?.kind==='enemy'?action.targetDesc.unit:null;
  const rawSlot=raw?sourceBattleStatusSlot({kind:'enemy',unit:raw,unitId:raw.id}):-1;

  // fixed FIREKILL does NOT call TargetAdjust. A dead/invalid/EarthRound COM2 instead
  // falls back deterministically to the first TargetCheck-valid, non-EarthRound slot
  // on the same side. RANDOMACT supplies an Enemy-side COM2, so valid slots are 10..19.
  if(raw&&n(raw.hp)>0&&!enemyUnitHidden(raw)){
    return {target:raw,rawSlot,resolvedSlot:rawSlot,fallback:false};
  }
  if(rawSlot<10||rawSlot>19){
    return {target:null,rawSlot,resolvedSlot:-1,fallback:false,sourceInvalidRawSide:true};
  }

  const units=(Array.isArray(enemy?.units)&&enemy.units.length?enemy.units:(enemy?[enemy]:[]))
    .filter(u=>u&&n(u.hp)>0&&!enemyUnitHidden(u))
    .sort((a,b)=>sourceBattleStatusSlot({kind:'enemy',unit:a,unitId:a.id})
      -sourceBattleStatusSlot({kind:'enemy',unit:b,unitId:b.id}));
  const target=units.find(u=>{
    const slot=sourceBattleStatusSlot({kind:'enemy',unit:u,unitId:u.id});
    return slot>=10&&slot<20;
  })||null;
  return {
    target,rawSlot,resolvedSlot:target?sourceBattleStatusSlot({kind:'enemy',unit:target,unitId:target.id}):-1,
    fallback:true
  };
}

function sourceApplyPetFirekillPhysicalHit(pet,target,r,label){
  const actual=r?.actualTarget||target;
  if(!actual)return null;
  if(r.dodged){
    addLog(target.name+' 閃避了 '+pet.name+' 的「'+label+'」物理段。','pet');
    return target;
  }
  if(r.miss){
    addLog(pet.name+' 的「'+label+'」物理段沒有造成傷害。','pet');
    return actual;
  }

  // BATTLE_DamageSub_FIREKILL reads BATTLE_GetDamageReact() and then immediately forces
  // react=BATTLE_MD_NONE. Thus Acupuncture/Reflect/Absorb/Vanish do not trigger or consume.
  const targetDesc={kind:'enemy',unit:actual,unitId:actual.id};
  const before=Math.max(0,Math.trunc(n(actual.hp)));
  actual.hp=Math.max(0,before-Math.max(0,Math.trunc(n(r.damage))));
  sourceTrackDamageSubUltimate(targetDesc,r.damage,before,r);
  battleStatusWakeOnDamage(targetDesc,r.damage);
  sourceBattleFinalizeItemCrushRng(r);

  if(r.guardian){
    addLog(actual.name+' 發動忠犬護住 '+target.name+'，承受 '+pet.name+' 的「'+label+'」物理段 '+r.damage+' 傷害。',actual.hp<=0?'bad':'pet');
  }else{
    addLog(pet.name+' 的「'+label+'」物理段命中 '+actual.name+'，造成 '+r.damage+' 傷害。','pet');
  }
  if(before>0&&actual.hp<=0){
    sourceMarkEnemyDeathCredit(actual,[{kind:'pet',petId:pet.id}]);
    addLog(actual.name+' 倒下了，本場後續回合不再行動。','bad');
  }
  return actual;
}

function sourcePetFirekillMagicAttrDamage(pet,target,aPower){
  const attackerDesc={kind:'pet',pet,petId:pet.id};
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const source=normalizedElements(battleElementsForDesc(attackerDesc))
    ||{earth:0,water:0,fire:0,wind:0,none:100};
  const targetView=battleStatusDescView(targetDesc);
  const def=normalizedElements(targetView?.elements||{})
    ||{earth:0,water:0,fire:0,wind:0,none:100};

  // BATTLE_getMagicAdjustInt(... MagicLv=4, flg=2):
  // MagicLv*=10, keep none, zero Earth/Water/Wind, and pull Fire from the caster.
  const scaled=40;
  const magicVector={
    earth:0,water:0,wind:0,
    fire:scaled+scaled*Math.trunc(Math.trunc(n(source.fire))/50),
    none:Math.trunc(n(source.none))
  };
  const fieldRatio=battleFieldRatio(magicVector,def);
  const attack={
    earth:0,water:0,wind:0,
    fire:Math.trunc(n(magicVector.fire)*n(aPower)),
    none:Math.trunc(n(magicVector.none)*n(aPower))
  };
  const baseDamage=magicAttrCalcRaw(attack,def);
  return {
    damage:Math.max(0,Math.trunc(baseDamage*fieldRatio)),
    magicVector,attackVector:attack,defVector:def,fieldRatio,
    fieldState:Object.assign({},battleFieldState)
  };
}

function sourcePetFirekillMagicOne(pet,target,trueMagic){
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};

  // BATTLE_MagicDodge() treats every non-PLAYER as the Pet branch, including CHAR_TYPEENEMY:
  // fLuck = LV*0.2, capped at 30; rand()%100+1 <= trunc(fLuck) dodges.
  const threshold=Math.trunc(Math.min(30,Math.max(0,n(target.level)*.2)));
  const dodgeRoll=cRand(1,100);
  if(dodgeRoll<=threshold){
    return {damage:0,dodged:true,dodge:{roll:dodgeRoll,threshold},trueMagic};
  }

  // BATTLE_MultiAttMagic_Fire hard-codes PET att_magic_lv[all]=5.
  // Enemy magic resistance is trunc(LV*0.5). The function still rolls TrueMagic once
  // for the whole row, but its false-magic ×0.7 line is commented out.
  const attMagicLv=5;
  const resist=Math.trunc(Math.max(0,n(target.level))*.5);
  let kmagic=attMagicLv*1.4-resist;
  if(kmagic<0)kmagic=0;
  const randomAmp=cRand(0,19);
  const amagic=(kmagic*kmagic)/(attMagicLv*attMagicLv)+randomAmp/100;
  const aPower=Math.trunc(200*(1+4/10)*amagic);
  const adjusted=sourcePetFirekillMagicAttrDamage(pet,target,aPower);
  const damage=Math.max(0,Math.trunc(n(adjusted.damage)));
  const before=Math.max(0,Math.trunc(n(target.hp)));
  target.hp=Math.max(0,before-damage);

  if(before>0&&target.hp<=0){
    sourceMarkEnemyDeathCredit(target,[{kind:'pet',petId:pet.id}]);
  }
  return {
    damage,dodged:false,dodge:{roll:dodgeRoll,threshold},
    trueMagic,attMagicLv,resist,kmagic,randomAmp,amagic,aPower,adjusted,
    hpBefore:before,hpAfter:target.hp
  };
}

function sourcePerformPetFirekillSkill(pet,action){
  sourceRevealPetForDirectAttack(pet);
  const meta=action?.meta;
  const label=meta?.n||'火線獵殺';
  const resolved=sourcePetFirekillResolveTarget(action);
  const target=resolved.target;
  if(!target){
    addLog(pet.name+' 使用「'+label+'」，但 raw COM2 同側沒有可用目標；原 FIREKILL 結束不行動。','pet');
    return {handled:true,skillId:action?.skillId,noTarget:true,targetResolution:resolved};
  }

  // fixed battle.c overwrites WORKATTACKPOWER = (float)FIXSTR * 0.8 immediately
  // before BATTLE_Attack_FIREKILL. Pet has no weapon, so use the current round FIX snapshot.
  const base=petBattleView(pet);
  if(!base)return {handled:true,skillId:action?.skillId,missingPet:true};
  const baseAttack=Math.trunc(n(base.attack));
  const physicalAttack=Math.trunc(baseAttack*.8);
  const targetDesc={kind:'enemy',unit:target,unitId:target.id};
  const attacker=Object.assign({},base,{attack:physicalAttack});
  const physical=resolveAttackToEnemyWithGuardian(attacker,target,{
    guarding:!!target.guardThisTurn&&!battleStatusActive(targetDesc,'confusion')
  });
  const physicalActual=sourceApplyPetFirekillPhysicalHit(pet,target,physical,label);

  // The magic call receives the ORIGINAL resolved defNo, not the Guardian's slot.
  // BATTLE_MultiAttMagic_Fire snapshots every TargetCheck-valid member of that five-slot row.
  const resolvedSlot=resolved.resolvedSlot;
  const rowStart=resolvedSlot>=15?15:10;
  const magicTargets=(Array.isArray(enemy?.units)&&enemy.units.length?enemy.units:(enemy?[enemy]:[]))
    .filter(u=>{
      if(!u||n(u.hp)<=0||enemyUnitHidden(u))return false;
      const slot=sourceBattleStatusSlot({kind:'enemy',unit:u,unitId:u.id});
      return slot>=rowStart&&slot<rowStart+5;
    })
    .sort((a,b)=>sourceBattleStatusSlot({kind:'enemy',unit:a,unitId:a.id})
      -sourceBattleStatusSlot({kind:'enemy',unit:b,unitId:b.id}));

  // Source consumes exactly one rand()%100 TrueMagic roll before iterating the row.
  // PET fire magic level is 5, so true iff roll<=5; dedicated Firekill damage ignores false penalty.
  const trueRoll=cRand(0,99);
  const trueMagic=trueRoll<=5;
  const magicResults=[];
  const wake=[];
  for(const unit of magicTargets){
    const r=sourcePetFirekillMagicOne(pet,unit,trueMagic);
    magicResults.push({
      unitId:unit.id,battleSlot:sourceBattleStatusSlot({kind:'enemy',unit,unitId:unit.id}),r
    });
    if(r.dodged){
      addLog(unit.name+' 閃過「'+label+'」火焰追加（'+r.dodge.roll+' ≤ '+r.dodge.threshold+'）。');
    }else{
      addLog('「'+label+'」火焰追加命中 '+unit.name+'，造成 '+r.damage+' 魔法傷害。',unit.hp<=0?'bad':'pet');
      wake.push(unit);
    }
  }

  // Dedicated Firekill helper clears sleep only after the complete row loop.
  for(const unit of wake){
    const desc={kind:'enemy',unit,unitId:unit.id};
    if(battleStatusActive(desc,'sleep'))battleStatusClear(desc,'sleep');
  }

  // FIREKILL is an isolated special case: no common Counter and no inner AddProfit.
  // The actor outer boundary processes all physical/magic deaths after the command.
  return {
    handled:true,skillId:action?.skillId,targetUnitId:target.id,
    targetResolution:resolved,baseAttack,physicalAttack,physical,
    physicalActualTargetUnitId:physicalActual?.id||target.id,
    physicalGuardianUnitId:physical?.guardian?.id||null,
    fire:{
      fieldAttr:2,power:200,magicLv:4,attMagicLv:5,trueRoll,trueMagic,
      rowStart,targets:magicResults
    },
    sourceDamageReactForcedNone:true,sourceNoCounter:true
  };
}


const SOURCE_COMBINED_MISSING_MAGIC_IDS=Object.freeze([458,459,462]);
const SOURCE_COMBINED_RECOVERY_POWER=Object.freeze({20:50,21:100,22:200,23:300,24:420,25:600});
const SOURCE_COMBINED_STATUS_RECOVERY=Object.freeze({
  61:'all',71:'poison',81:'paralysis',91:'stone',101:'confusion',121:'sleep'
});
const SOURCE_COMBINED_STATUS_CHANGE=Object.freeze({
  139:Object.freeze({type:'poison',turn:5,success:25}),
  159:Object.freeze({type:'stone',turn:5,success:25}),
  169:Object.freeze({type:'confusion',turn:5,success:25}),
  179:Object.freeze({type:'drunk',turn:5,success:25}),
  189:Object.freeze({type:'sleep',turn:5,success:25}),
  413:Object.freeze({type:'stone',turn:6,success:25}),
  414:Object.freeze({type:'confusion',turn:6,success:25}),
  416:Object.freeze({type:'sleep',turn:6,success:25})
});
const SOURCE_COMBINED_FIELD_MAGIC=Object.freeze({
  194:Object.freeze({attr:'earth',power:100,turns:5}),
  204:Object.freeze({attr:'water',power:100,turns:5}),
  214:Object.freeze({attr:'fire',power:100,turns:5}),
  224:Object.freeze({attr:'wind',power:100,turns:5}),
  230:Object.freeze({attr:'none',power:30,turns:3})
});
const SOURCE_COMBINED_MAGIC_STATUS=Object.freeze({
  460:Object.freeze({turns:3,nums:90}),
  461:Object.freeze({turns:3,nums:50})
});
function sourcePetCombinedOption(meta){
  const parts=String(meta?.o||'').split('|');
  if(parts[0]!=='综合法'&&parts[0]!=='綜合法')return null;
  let count=Math.max(0,Math.trunc(Number(parts[1])||0));
  if(count>10)count=10;
  const magicIds=[];
  for(let i=0;i<count;i++){
    const id=Number(parts[2+i]);
    if(Number.isFinite(id))magicIds.push(Math.trunc(id));
  }
  if(!count||magicIds.length!==count)return null;
  return {count,magicIds};
}
function sourcePetCombinedGainMp(pet){
  // PETSKILL_Combined stores HIGH(COM3)=0, so MAGIC_DirectUse sees itemnum=0.
  // Existing non-AttMagic wrappers get MAGICUSEMP=-1 and execute MP -= -1.
  const before=Math.trunc(n(pet?.mp));
  if(pet)pet.mp=before+1;
  return {before,after:pet?Math.trunc(n(pet.mp)):before+1,delta:1};
}
function sourceCombinedTargetableFromSlot(slot){
  const desc=sourceBattleStatusDescFromSlot(slot);
  if(!desc||!battleStatusDescAlive(desc))return null;
  if(desc.kind==='pet'&&sourcePlayerPetHidden(desc.pet))return null;
  if(desc.kind==='enemy'&&enemyUnitHidden(desc.unit))return null;
  return desc;
}
function sourceCombinedMultiList(toNo){
  let no=Math.trunc(Number(toNo));
  const slots=(start,end)=>{
    const out=[];
    for(let i=start;i<end;i++)if(sourceCombinedTargetableFromSlot(i))out.push(i);
    return out;
  };
  if(no>=0&&no<=19){
    const start=no<10?0:10,compact=slots(start,start+10);
    if(!compact.length)return {ok:false,toNo:-1,rolls:[],reason:'all-die'};
    const rolls=[];
    if(!sourceCombinedTargetableFromSlot(no)){
      for(;;){
        const roll=cRand(0,9); // fixed nLifeArea[rand()%10] rejection loop
        rolls.push(roll);
        if(compact[roll]!=null){no=compact[roll];break;}
      }
    }
    return {ok:true,toNo:no,rolls,fallback:rolls.length>0};
  }
  const row=(a,b,fallbackNo,fa,fb)=>{
    let picked=slots(a,b);
    if(picked.length)return {ok:true,toNo:no,slots:picked,rowFallback:false};
    picked=slots(fa,fb);
    if(!picked.length)return {ok:false,toNo:-1,slots:[],rowFallback:true,reason:'all-die'};
    return {ok:true,toNo:fallbackNo,slots:picked,rowFallback:true};
  };
  if(no===26)return row(0,5,25,5,10);
  if(no===25)return row(5,10,26,0,5);
  if(no===23)return row(10,15,24,15,20);
  if(no===24)return row(15,20,23,10,15);
  if(no===20)return {ok:true,toNo:no,slots:slots(0,10),fallback:false};
  if(no===21)return {ok:true,toNo:no,slots:slots(10,20),fallback:false};
  if(no===22)return {ok:true,toNo:no,slots:slots(0,20),fallback:false};
  return {ok:true,toNo:no,slots:sourceCombinedTargetableFromSlot(no)?[no]:[],fallback:false};
}
function sourceCombinedSortLoc(a,b){
  const ai=MAGIC_CHAR_TABLE_IDX[a],bi=MAGIC_CHAR_TABLE_IDX[b];
  if(!ai||!bi)return a-b;
  const ay=ai[0],ax=ai[1],by=bi[0],bx=bi[1];
  if(a>=10){
    if(ay!==by)return ay-by;
    return ax-bx;
  }
  if(ay!==by)return by-ay;
  return bx-ay; // fixed side-0 SortLoc typo: ele2basex - ele1basey
}
function sourceCombinedAttackMagicTargets(toNo,pattern){
  const found=new Set();
  const add=slot=>{if(sourceCombinedTargetableFromSlot(slot))found.add(slot);};
  const field=pattern?.field||[[0,0,0,0,0],[0,0,1,0,0],[0,0,0,0,0]];
  if(toNo>=0&&toNo<20){
    const idx=MAGIC_CHAR_TABLE_IDX[toNo];
    if(idx){
      const basey=idx[0],basex=idx[1];
      for(let i=0,j=basey-1;j<=basey+1;i++,j++){
        if(toNo<10&&(j<2||j>3))continue;
        if(toNo>=10&&(j<0||j>1))continue;
        for(let k=0;k<5;k++){
          const x=basex-2+k;
          if(x<0||x>4)continue;
          if(n(field?.[i]?.[k])&&MAGIC_CHAR_TABLE[j])add(MAGIC_CHAR_TABLE[j][x]);
        }
      }
    }
  }else if(toNo===20||toNo===21){
    const rowBase=toNo===20?2:0;
    for(let i=0;i<2;i++)for(let j=0;j<5;j++){
      if(n(field?.[i]?.[j]))add(MAGIC_CHAR_TABLE[rowBase+i][j]);
    }
  }else if(toNo>=23&&toNo<=26){
    const basey=toNo-23;
    for(let i=0,j=basey-1;j<=basey+1;i++,j++){
      if((toNo===25||toNo===26)&&(j<2||j>3))continue;
      if((toNo===23||toNo===24)&&(j<0||j>1))continue;
      for(let k=0;k<5;k++)if(n(field?.[i]?.[k])&&MAGIC_CHAR_TABLE[j])add(MAGIC_CHAR_TABLE[j][k]);
    }
  }
  return [...found].sort(sourceCombinedSortLoc)
    .map(slot=>({slot,desc:sourceCombinedTargetableFromSlot(slot)}))
    .filter(x=>x.desc);
}
function sourcePetCombinedMagicPractice(pet){
  if(!pet)return {levels:[0,0,0,0],exp:[0,0,0,0]};
  if(!Array.isArray(pet.sourceAttackMagicLv))pet.sourceAttackMagicLv=[0,0,0,0];
  if(!Array.isArray(pet.sourceAttackMagicExp))pet.sourceAttackMagicExp=[0,0,0,0];
  while(pet.sourceAttackMagicLv.length<4)pet.sourceAttackMagicLv.push(0);
  while(pet.sourceAttackMagicExp.length<4)pet.sourceAttackMagicExp.push(0);
  pet.sourceAttackMagicLv=pet.sourceAttackMagicLv.slice(0,4).map(v=>clamp(Math.trunc(n(v)),0,100));
  pet.sourceAttackMagicExp=pet.sourceAttackMagicExp.slice(0,4).map(v=>Math.max(0,Math.trunc(n(v))));
  return {levels:pet.sourceAttackMagicLv,exp:pet.sourceAttackMagicExp};
}
function sourcePetCombinedMagicComputeAttExp(pet,attrIndex,magicLv,hitCount){
  // fixed Magic_ComputeAttExp() runs only when TrueMagic==FALSE && AttIsPlayer.
  // Under _FIX_MAGICDAMAGE PET sets AttIsPlayer=1, so Pet CHAR_*_EXP really does advance.
  const st=sourcePetCombinedMagicPractice(pet);
  const idx=clamp(Math.trunc(n(attrIndex)),0,3);
  const addEx=Math.max(0,Math.trunc(n(magicLv))*3*Math.max(0,Math.trunc(n(hitCount))));
  let level=Math.trunc(n(st.levels[idx])),exp=Math.trunc(n(st.exp[idx]))+addEx;
  if(exp>100){
    exp=0;
    if(level<100)level++;
  }
  exp=Math.max(0,Math.trunc(exp));
  level=clamp(Math.trunc(level),0,100);
  st.levels[idx]=level;st.exp[idx]=exp;

  const opposed=(idx+1)%4;
  let opposedLevel=Math.trunc(n(st.levels[opposed]));
  let opposedExp=Math.trunc(n(st.exp[opposed]));
  if(opposedLevel>1){
    opposedExp=Math.trunc(opposedExp-addEx*.5);
    if(opposedExp<0){
      opposedExp=0;
      opposedLevel=Math.max(0,opposedLevel-1);
    }
    st.levels[opposed]=opposedLevel;
    st.exp[opposed]=Math.max(0,opposedExp);
  }
  return {
    attrIndex:idx,addEx,hitCount:Math.max(0,Math.trunc(n(hitCount))),
    level,exp,opposedAttrIndex:opposed,opposedLevel:st.levels[opposed],opposedExp:st.exp[opposed]
  };
}

function sourcePetCombinedMagicAttrDamage(pet,targetDesc,magic,aPower){
  const source=normalizedElements(battleElementsForDesc({kind:'pet',pet,petId:pet?.id}))
    ||{earth:0,water:0,fire:0,wind:0,none:100};
  const targetView=battleStatusDescView(targetDesc);
  const def=normalizedElements(targetView?.elements||{})
    ||{earth:0,water:0,fire:0,wind:0,none:100};
  const scaled=Math.trunc(n(magic.magicLv))*10;
  const vector={earth:0,water:0,fire:0,wind:0,none:Math.trunc(n(source.none))};
  const sourceAttr=Math.trunc(n(source[magic.attr]));
  vector[magic.attr]=scaled+scaled*Math.trunc(sourceAttr/50);
  const fieldRatio=battleFieldRatio(vector,def);
  const attack={earth:0,water:0,fire:0,wind:0,none:Math.trunc(n(vector.none)*n(aPower))};
  attack[magic.attr]=Math.trunc(n(vector[magic.attr])*n(aPower));
  const baseDamage=magicAttrCalcRaw(attack,def);
  return {damage:Math.trunc(baseDamage*fieldRatio),attackVector:attack,magicVector:vector,
    defVector:def,fieldRatio,fieldState:Object.assign({},battleFieldState)};
}
function sourcePetCombinedAttackMagicOne(pet,targetDesc,magic,trueMagic,attMagicLv){
  const threshold=Math.trunc(Math.min(30,Math.max(0,n(targetDesc?.unit?.level))*.2));
  const dodgeRoll=cRand(1,100);
  if(dodgeRoll<=threshold)return {damage:0,dodged:true,dodge:{roll:dodgeRoll,threshold},trueMagic};

  const attrIndex=MAGIC_ATTR_KEYS.indexOf(magic.attr);
  attMagicLv=clamp(Math.trunc(n(attMagicLv)),0,100);
  const resistInfo=sourceMagicEffectiveResist(targetDesc,attrIndex);
  const resist=resistInfo.effective;
  let kmagic=attMagicLv*1.4-resist;
  if(kmagic<0)kmagic=0;
  const mmagic=Math.max(1,attMagicLv);
  const randomAmp=cRand(0,19);
  const amagic=(kmagic*kmagic)/(mmagic*mmagic)+randomAmp/100;
  const aPower=Math.trunc(n(magic.power)*(1+n(magic.magicLv)/10)*amagic);
  const adjusted=sourcePetCombinedMagicAttrDamage(pet,targetDesc,magic,aPower);
  let damage=Math.max(0,Math.trunc(n(adjusted.damage)));
  if(!trueMagic)damage=Math.trunc(damage*.7);

  const hpBefore=battleStatusHp(targetDesc);
  battleStatusSetHp(targetDesc,Math.max(0,hpBefore-damage));
  if(battleStatusActive(targetDesc,'sleep')){
    battleStatusClear(targetDesc,'sleep');
    addLog(battleStatusDescName(targetDesc)+' 被魔法命中，睡眠解除。');
  }
  if(hpBefore>0&&battleStatusHp(targetDesc)<=0&&targetDesc.kind==='enemy'){
    sourceMarkEnemyDeathCredit(targetDesc.unit,[{kind:'pet',petId:pet.id}]);
  }
  return {damage,dodged:false,dodge:{roll:dodgeRoll,threshold},trueMagic,attMagicLv,
    resist,resistBase:resistInfo.base,resistBonus:resistInfo.bonus,kmagic,randomAmp,
    amagic,aPower,adjusted,hpBefore,hpAfter:battleStatusHp(targetDesc)};
}
function sourcePerformPetCombinedAttackMagic(pet,action,magicId,magic,rawToNo){
  const multi=sourceCombinedMultiList(rawToNo);
  if(!multi.ok){
    addLog(pet.name+' 的綜合法抽到 '+magic.name+'，但原 BATTLE_MultiList 已沒有可作用目標。','pet');
    return {handled:true,skillId:action.skillId,magicId,attackMagic:true,noTarget:true,rawToNo,multi};
  }
  const pattern=attackMagicDb?.byAttIdx?.[String(magic.attIdx)]?.playerSide||null;
  if(!pattern){
    addLog(pet.name+' 的綜合法抽到 AttackMagic '+magicId+'，但固定 AttackMagic pattern 缺資料；不猜效果。','pet');
    return {handled:true,skillId:action.skillId,magicId,attackMagic:true,sourceDataMissing:true,rawToNo,multi};
  }

  // JYUJYUTU calls MAGIC_DirectUse directly: do NOT run S_ATTACK_MAGIC TargetIndex rewrite.
  const attrIndex=MAGIC_ATTR_KEYS.indexOf(magic.attr);
  const practice=sourcePetCombinedMagicPractice(pet);
  const attMagicLv=clamp(Math.trunc(n(practice.levels[attrIndex])),0,100);
  const trueRoll=cRand(0,99);
  const trueMagic=!(trueRoll>attMagicLv);
  const targets=sourceCombinedAttackMagicTargets(multi.toNo,pattern),results=[];
  addLog(pet.name+' 的綜合法抽到「'+magic.name+'」（raw COM2 '+rawToNo+'）。','pet');
  for(const entry of targets){
    const target=entry.desc;
    if(!target||!battleStatusDescAlive(target))continue;
    const r=sourcePetCombinedAttackMagicOne(pet,target,magic,trueMagic,attMagicLv);
    results.push({battleSlot:entry.slot,targetKey:battleStatusKey(target),r});
    if(r.dodged)addLog(battleStatusDescName(target)+' 閃過 '+magic.name+'。','good');
    else addLog(magic.name+' 命中 '+battleStatusDescName(target)+'，造成 '+r.damage+' 魔法傷害'+(trueMagic?'':'（施法判定失敗 ×0.7）')+'。',battleStatusHp(target)<=0?'bad':'');
  }
  const hitCount=results.filter(x=>!x.r?.dodged).length;
  const practiceUpdate=!trueMagic
    ?sourcePetCombinedMagicComputeAttExp(pet,attrIndex,magic.magicLv,hitCount)
    :null;
  return {handled:true,skillId:action.skillId,magicId,magicName:magic.name,attackMagic:true,
    rawToNo,adjustedToNo:multi.toNo,multi,trueRoll,attMagicLv,trueMagic,
    attIdx:magic.attIdx,ignoredTargetRewrite:magic.targetRewrite,targets:results,hitCount,practiceUpdate};
}
function sourceCombinedSingleTarget(rawToNo){
  const multi=sourceCombinedMultiList(rawToNo);
  if(!multi.ok)return {multi,target:null,targetSlot:-1};
  const target=sourceCombinedTargetableFromSlot(multi.toNo);
  return {multi,target,targetSlot:multi.toNo};
}
function sourcePerformPetCombinedRecovery(pet,action,magicId,rawToNo){
  const mp=sourcePetCombinedGainMp(pet),picked=sourceCombinedSingleTarget(rawToNo);
  const power=SOURCE_COMBINED_RECOVERY_POWER[magicId];
  if(!picked.target)return {handled:true,skillId:action.skillId,magicId,mp,noTarget:true,multi:picked.multi};
  const target=picked.target,heal=cRand(Math.trunc(power*.9),Math.trunc(power*1.1));
  const before=Math.max(0,Math.trunc(n(battleStatusHp(target))));
  const maxHp=target.kind==='enemy'
    ?Math.max(1,Math.trunc(n(target.unit?.maxHp)))
    :target.kind==='pet'
      ?Math.max(1,Math.trunc(n(target.pet?.maxHp)||petMaxHp(target.pet)))
      :Math.max(1,Math.trunc(n(state?.maxHp)));
  battleStatusSetHp(target,Math.min(maxHp,before+heal));
  addLog(pet.name+' 的綜合法抽到回復精靈，'+battleStatusDescName(target)+' 回復 '+Math.max(0,battleStatusHp(target)-before)+' HP。','pet');
  return {handled:true,skillId:action.skillId,magicId,mp,power,rollHeal:heal,targetSlot:picked.targetSlot,hpBefore:before,hpAfter:battleStatusHp(target),multi:picked.multi};
}
function sourcePerformPetCombinedStatusRecovery(pet,action,magicId,rawToNo){
  const mp=sourcePetCombinedGainMp(pet),picked=sourceCombinedSingleTarget(rawToNo);
  if(!picked.target)return {handled:true,skillId:action.skillId,magicId,mp,noTarget:true,multi:picked.multi};
  const target=picked.target,requested=SOURCE_COMBINED_STATUS_RECOVERY[magicId];
  // Same fixed BATTLE_MultiStatusRecovery used by V1.78 Refresh:
  // scan all StatusTbl entries, retain the LAST positive one, then either status=0 ("全")
  // or an exact requested status clears that single winner. Do not rationalize the
  // source's status-index-vs-CHAR_WORKCONFUSION comparison into a six-status limit.
  const current=sourceRefreshLastStatus(target);
  const canClear=!!current&&(requested==='all'||requested===current);
  const cleared=canClear&&sourceRefreshClearStatus(target,current);
  addLog(pet.name+' 的綜合法抽到異常回復：'+battleStatusDescName(target)+(cleared?' 的 '+(BATTLE_STATUS_NAMES[current]||current)+' 被解除。':' 沒有符合的異常狀態。'),'pet');
  return {handled:true,skillId:action.skillId,magicId,mp,requested,current,cleared:cleared?current:null,targetSlot:picked.targetSlot,multi:picked.multi};
}
function sourcePerformPetCombinedStatusChange(pet,action,magicId,rawToNo){
  const mp=sourcePetCombinedGainMp(pet),picked=sourceCombinedSingleTarget(rawToNo);
  const cfg=SOURCE_COMBINED_STATUS_CHANGE[magicId];
  if(!picked.target)return {handled:true,skillId:action.skillId,magicId,mp,noTarget:true,multi:picked.multi};
  const target=picked.target;
  const check=battleStatusChance({kind:'pet',pet,petId:pet.id},target,cfg.type,
    {perOffset:cfg.success,range:30,bai:1,forceGeneral:true});
  // fixed MAGIC_StatusChange_Battle passes the parsed turn unchanged.
  // Use the raw writer because battleStatusApply() is the physical StatusChange adapter (+1).
  const storedTurns=cfg.turn;
  const applied=!!(check.allowed&&check.success&&battleStatusApplyRaw(target,cfg.type,storedTurns));
  if(applied)addLog(pet.name+' 的綜合法使 '+battleStatusDescName(target)+' 陷入 '+(BATTLE_STATUS_NAMES[cfg.type]||cfg.type)+'。','pet');
  return {handled:true,skillId:action.skillId,magicId,mp,targetSlot:picked.targetSlot,status:cfg.type,turn:cfg.turn,storedTurns,check,applied,multi:picked.multi};
}
function sourcePerformPetCombinedWeaken(pet,action,rawToNo){
  const magicId=436,mp=sourcePetCombinedGainMp(pet),picked=sourceCombinedSingleTarget(rawToNo);
  if(!picked.target)return {handled:true,skillId:action.skillId,magicId,mp,noTarget:true,multi:picked.multi};
  const target=picked.target;
  const check=battleStatusChance({kind:'pet',pet,petId:pet.id},target,'weaken',
    {perOffset:20,range:30,bai:1,forceGeneral:true});
  const applied=!!(check.allowed&&check.success&&battleStatusApplyRaw(target,'weaken',4));
  if(applied)addLog(pet.name+' 的綜合法使 '+battleStatusDescName(target)+' 陷入虛弱（WORKWEAKEN=4）。','pet');
  return {handled:true,skillId:action.skillId,magicId,mp,targetSlot:picked.targetSlot,check,applied,storedTurns:4,multi:picked.multi};
}
function sourcePerformPetCombinedField(pet,action,magicId){
  const mp=sourcePetCombinedGainMp(pet),cfg=SOURCE_COMBINED_FIELD_MAGIC[magicId];
  battleSetField(cfg.attr,cfg.power,cfg.turns);
  addLog(pet.name+' 的綜合法改變戰場屬性為 '+cfg.attr+'（'+cfg.power+'，'+cfg.turns+' 回合）。','pet');
  return {handled:true,skillId:action.skillId,magicId,mp,field:Object.assign({},battleFieldState)};
}
function sourcePerformPetCombinedReverse(pet,action,rawToNo){
  const magicId=240,mp=sourcePetCombinedGainMp(pet),picked=sourceCombinedSingleTarget(rawToNo);
  if(!picked.target)return {handled:true,skillId:action.skillId,magicId,mp,noTarget:true,multi:picked.multi};
  const reverse=battleToggleAttributeReverse(picked.target);
  addLog(pet.name+' 的綜合法對 '+battleStatusDescName(picked.target)+' 發動屬性逆轉。','pet');
  return {handled:true,skillId:action.skillId,magicId,mp,targetSlot:picked.targetSlot,reverse,multi:picked.multi};
}
function sourcePerformPetCombinedDefMagic(pet,action,magicId,rawToNo){
  const mp=sourcePetCombinedGainMp(pet),cfg=SOURCE_COMBINED_MAGIC_STATUS[magicId];
  const picked=sourceCombinedSingleTarget(rawToNo);
  if(!picked.target)return {handled:true,skillId:action.skillId,magicId,mp,noTarget:true,multi:picked.multi};
  const status=sourceApplyDefMagicStatus(picked.target,cfg.turns,cfg.nums);
  addLog(pet.name+' 的綜合法抽到魔抗狀態（'+cfg.nums+'%／'+cfg.turns+' 回合）'
    +(status.applied?'，套用到 '+battleStatusDescName(picked.target)+'。':'，但目標已有 MagicStatus，原 C 不覆蓋。'),'pet');
  return {handled:true,skillId:action.skillId,magicId,mp,targetSlot:picked.targetSlot,status,multi:picked.multi};
}
function sourcePerformPetCombinedSkill(pet,action){
  const parsed=sourcePetCombinedOption(action?.meta);
  if(!parsed){
    addLog(pet.name+' 的 PETSKILL_Combined option 無法依固定格式解析；不猜效果。','pet');
    return {handled:true,skillId:action?.skillId,sourceDataMissing:true};
  }
  const pickIndex=cRand(0,parsed.count-1),magicId=parsed.magicIds[pickIndex];
  const rawToNo=sourceBattleStatusSlot(action?.targetDesc);
  const magic=attackMagicDb?.byMagicId?.[String(magicId)]||null;

  if(SOURCE_COMBINED_MISSING_MAGIC_IDS.includes(magicId)){
    addLog(pet.name+' 的綜合法抽到 magic '+magicId+'；固定 magic.txt 無 row，依原 C 不猜效果。','pet');
    return {handled:true,skillId:action.skillId,pickIndex,magicId,rawToNo,missingMagicRow:true,mpDelta:0};
  }
  if(magic?.func==='MAGIC_AttMagic'){
    return Object.assign({pickIndex,mpDelta:0},sourcePerformPetCombinedAttackMagic(pet,action,magicId,magic,rawToNo));
  }
  if(Object.prototype.hasOwnProperty.call(SOURCE_COMBINED_RECOVERY_POWER,magicId))
    return Object.assign({pickIndex},sourcePerformPetCombinedRecovery(pet,action,magicId,rawToNo));
  if(Object.prototype.hasOwnProperty.call(SOURCE_COMBINED_STATUS_RECOVERY,magicId))
    return Object.assign({pickIndex},sourcePerformPetCombinedStatusRecovery(pet,action,magicId,rawToNo));
  if(Object.prototype.hasOwnProperty.call(SOURCE_COMBINED_STATUS_CHANGE,magicId))
    return Object.assign({pickIndex},sourcePerformPetCombinedStatusChange(pet,action,magicId,rawToNo));
  if(Object.prototype.hasOwnProperty.call(SOURCE_COMBINED_FIELD_MAGIC,magicId))
    return Object.assign({pickIndex},sourcePerformPetCombinedField(pet,action,magicId));
  if(magicId===240)return Object.assign({pickIndex},sourcePerformPetCombinedReverse(pet,action,rawToNo));
  if(magicId===436)return Object.assign({pickIndex},sourcePerformPetCombinedWeaken(pet,action,rawToNo));
  if(Object.prototype.hasOwnProperty.call(SOURCE_COMBINED_MAGIC_STATUS,magicId))
    return Object.assign({pickIndex},sourcePerformPetCombinedDefMagic(pet,action,magicId,rawToNo));

  addLog(pet.name+' 的綜合法抽到已存在的 magic '+magicId+'，但玩家側 DirectUse 尚無固定對應；不猜效果。','pet');
  return {handled:true,skillId:action.skillId,pickIndex,magicId,rawToNo,sourceRuntimePending:true};
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
    sourceClearPetBattleProperty(pet);sourceClearPetVary(pet);
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
    else if(action.sourceFunctionMissing)addLog(pet.name+' 隨機抽到的 PetSkill 在 fixed PETSKILL_functbl 沒有同名函式；原 PETSKILL_Use() 直接 FALSE，本回合不行動。','pet');
    else if(action.sourceUseFailed)addLog(pet.name+' 隨機抽到不存在的 PetSkill；原 PETSKILL_Use() 失敗，本回合不行動。','pet');
    else addLog(pet.name+' 本回合沒有行動。','pet');
    return finish({handled:true,none:true,sourceUseFailed:!!action.sourceUseFailed,sourceFunctionMissing:!!action.sourceFunctionMissing});
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
    else if(meta?.f==='PETSKILL_ShowMercy')result=sourcePerformPetShowMercySkill(pet,action,options);
    else if(meta?.f==='PETSKILL_BecomePig')result=sourcePerformPetBecomePigSkill(pet,action,options);
    else if(meta?.f==='PETSKILL_BecomeFox')result=sourcePerformPetBecomeFoxSkill(pet,action,options);
    else if(meta?.f==='PETSKILL_FallGround')result=sourcePerformPetFallGroundSkill(pet,action,options);
    else if(meta?.f==='PETSKILL_GuardBreak2')result=sourcePerformPetGuardBreak2Skill(pet,action,options);
    else if(meta?.f==='PETSKILL_BattleProperty')result=sourcePerformPetBattlePropertySkill(pet,action);
    else if(meta?.f==='PETSKILL_AntInter')result=sourcePerformPetAntInterSkill(pet,action,options);
    else if(meta?.f==='PETSKILL_Roar')result=sourcePerformPetRoarSkill(pet,action);
    else if(meta?.f==='PETSKILL_Vary')result=sourcePerformPetVarySkill(pet,action);
    else if(meta?.f==='PETSKILL_Refresh')result=sourcePerformPetRefreshSkill(pet,action);
    else if(meta?.f==='PETSKILL_Weaken')result=sourcePerformPetSpecialStatusSkill(pet,action,'weaken');
    else if(meta?.f==='PETSKILL_Deeppoison')result=sourcePerformPetSpecialStatusSkill(pet,action,'deepPoison');
    else if(meta?.f==='PETSKILL_Barrier')result=sourcePerformPetSpecialStatusSkill(pet,action,'barrier');
    else if(meta?.f==='PETSKILL_Nocast')result=sourcePerformPetSpecialStatusSkill(pet,action,'nocast');
    else if(meta?.f==='PETSKILL_DamageToHp')result=sourcePerformPetDamageToHpSkill(pet,action);
    else if(meta?.f==='PETSKILL_DamageToHp2')result=sourcePerformPetDamageToHp2Skill(pet,action);
    else if(meta?.f==='PETSKILL_MpDamage')result=sourcePerformPetMpDamageSkill(pet,action);
    else if(meta?.f==='PETSKILL_Modifyattack')result=sourcePerformPetModifyAttackSkill(pet,action);
    else if(meta?.f==='PETSKILL_Mdfyattack')result=sourcePerformPetMdfyAttackSkill(pet,action);
    else if(meta?.f==='PETSKILL_Lighttakeed')result=sourcePerformPetLighttakeedSkill(pet,action);
    else if(meta?.f==='PETSKILL_MagicStatusChange')result=sourcePerformPetMagicStatusChangeSkill(pet,action);
    else if(meta?.f==='PETSKILL_SetMagicPet'){
      const rawToNo=action?.targetDesc?.kind==='enemy'?sourceBattleStatusSlot(action.targetDesc):-1;
      result=sourcePerformSetMagicPetBattle(pet.name,action.skillId,rawToNo,meta,'pet');
    }
    else if(meta?.f==='PETSKILL_SetDuck')result=sourcePerformPetSetDuckRandomSkill(pet,action);
    else if(meta?.f==='PETSKILL_Acupuncture')result=sourcePerformPetAcupunctureSkill(pet,action,options);
    else if(meta?.f==='PETSKILL_Hector')result=sourcePerformPetHectorSkill(pet,action,options);
    else if(meta?.f==='PETSKILL_Sars')result=sourcePerformPetSarsSkill(pet,action,options);
    else if(meta?.f==='PETSKILL_Gyrate')result=sourcePerformPetGyrateSkill(pet,action,options);
    else if(meta?.f==='PETSKILL_Retrace')result=sourcePerformPetRetraceSkill(pet,action,options);
    else if(meta?.f==='PETSKILL_Combined')result=sourcePerformPetCombinedSkill(pet,action);
    else if(meta?.f==='PETSKILL_BattleModel')result=sourcePerformPetBattleModelSkill(pet,action,options);
    else if(meta?.f==='PETSKILL_AttackCrazed')result=sourcePerformPetAttackCrazedSkill(pet,action,options);
    else if(meta?.f==='PETSKILL_AttackShoot')result=sourcePerformPetAttackShootSkill(pet,action,options);
    else if(meta?.f==='PETSKILL_WildViolentAttack')result=sourcePerformPetWildViolentSkill(pet,action,options);
    else if(meta?.f==='PETSKILL_SpeedyAttack')result=sourcePerformPetSpeedyAttackSkill(pet,action,options);
    else if(meta?.f==='PETSKILL_StealMoney')result=sourcePerformPetStealMoneySkill(pet,action);
    else if(meta?.f==='PETSKILL_Steal')result=sourcePerformPetStealSkill(pet,action);
    else if(meta?.f==='PETSKILL_Abduct')result=sourcePerformPetAbductSkill(pet,action);
    else if(meta?.f==='PETSKILL_Sacrifice')result=sourcePerformPetSacrificeSkill(pet,action);
    else if(meta?.f==='PETSKILL_BattleTimid')result=sourcePerformPetBattleTimidSkill(pet,action);
    else if(meta?.f==='PETSKILL_2BattleTimid')result=sourcePerformPet2BattleTimidSkill(pet,action);
    else if(meta?.f==='PETSKILL_BatFly')result=sourcePerformPetBatFlySkill(pet,action);
    else if(meta?.f==='PETSKILL_DivideAttack')result=sourcePerformPetDivideAttackSkill(pet,action);
    else if(meta?.f==='PETSKILL_BattleTearDamage')result=sourcePerformPetTearSkill(pet,action);
    else if(meta?.f==='PETSKILL_Sonic')result=sourcePerformPetSonicSkill(pet,action);
    else if(meta?.f==='PETSKILL_Regret')result=sourcePerformPetRegretSkill(pet,action);
    else if(meta?.f==='PETSKILL_Firekill')result=sourcePerformPetFirekillSkill(pet,action);
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
  if(loyalty.changed){
    const result=sourcePerformPetLoyalAction(pet,loyalty,options);
    return Object.assign({loyalty},sourceFinalizePetExecutedCommand(pet,result));
  }
  if(confusionIntent){
    const result=sourcePerformPetAttackTarget(pet,confusionIntent.targetDesc,options,{confusion:true});
    return Object.assign({loyalty},sourceFinalizePetExecutedCommand(pet,sourceFinishPetEarthRoundOverride(pet,result)));
  }
  if(liveCharge)return Object.assign({loyalty},sourceFinalizePetExecutedCommand(pet,sourcePerformPetChargeState(pet,options)));
  if(liveEarth)return Object.assign({loyalty},sourceFinalizePetExecutedCommand(pet,sourcePerformPetEarthRoundState(pet,options)));
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
      sourceClearPetBattleProperty(pet);sourceClearPetVary(pet);
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
      r=enemyAttackPetResult(unit,target.pet,Object.assign({},attackOptions,{sourceGuardianReal:true}));
      actualTarget=enemyApplyDirectGuardianSkillHit(
        unit,target,r,label+'第 '+(attackCount+1)+'/'+count+' 段',
        {finalizeItemCrush:false}
      )||target;
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
      r=enemyAttackPetResult(unit,target.pet,Object.assign({},attackOptions,{sourceGuardianReal:true}));
      actualTarget=enemyApplyDirectGuardianSkillHit(
        unit,target,r,label,{finalizeItemCrush:false}
      )||target;
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
    const fallResist=chosen.kind==='player'
      ?Math.trunc(n(sourcePlayerEquipResistWork(state).fallride)):0;
    // fixed _EQUIT_RESIST: RAND(0,100) > 50 + CHAR_WORKEQUITFALLRIDE.
    if(fallRoll>50+fallResist&&chosen.kind==='player'){
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
  return {
    kind:'skill',skillId:actor.skillId,target:chosen.kind,r,fallRoll,fallSuccess,
    fallResist:chosen.kind==='player'?Math.trunc(n(sourcePlayerEquipResistWork(state).fallride)):0
  };
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
  if(!(type==='poison'||type==='deepPoison'||type==='sleep'||type==='stone'||type==='confusion'||type==='drunk'||type==='sars')){
    return {attempted:false,applied:false,unsupportedType:type||null};
  }
  // BATTLE_Attack() 已先 DamageWakeUp，再進 gBattleStausChange 的 StatusAttackCheck。
  const check=battleStatusChance({kind:'enemy',unit,unitId:unit.id},targetDesc,type);
  let applied=false,storedTurns=0;
  if(check.allowed&&check.success){
    if(type==='sars'){
      // BATTLE_Attack writes WORKSARS = gBattleStausTurn + 1 and WORKMODSARS = 1.
      // Only the directly infected carrier receives MODSARS; spread infections do not.
      storedTurns=Math.max(1,Math.trunc(n(turn))+1);
      applied=battleSarsApplyRaw(targetDesc,storedTurns,true);
    }else if(type==='drunk'){
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
      r=enemyAttackPetResult(unit,target.pet,Object.assign({},attackOptions,{sourceGuardianReal:true}));
      const originalDesc={kind:'pet',pet:target.pet,petId:target.pet.id};
      actualTarget=enemyDirectActualTarget(originalDesc,r)||originalDesc;
      if(beforeApply)beforeApplyResult=beforeApply({target:'pet',pet:target.pet,targetDesc:actualTarget,r},target);
      enemyApplyDirectGuardianSkillHit(
        unit,target,r,label+'第 '+(attackCount+1)+'/'+attackMax+' 段',
        {finalizeItemCrush:false}
      );
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
      r=enemyAttackPetResult(unit,chosen.pet,{damageDivisor:count,sourceGuardianReal:true});
      hits++;
      lastResult=r;
      lastChosen=chosen;
      enemyApplyDirectGuardianSkillHit(
        unit,chosen,r,label+'第 '+hits+'/'+count+' 段',
        {finalizeItemCrush:false}
      );
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
  const professionCancel=sourceProfessionEnemyCommandCancelled(unit);
  if(professionCancel){
    addLog(unit.name+' 的本輪指令被'+(BATTLE_STATUS_NAMES[professionCancel.statusType]||'職業異常狀態')+'清除。');
    return {kind:'none',sourceProfessionCommandCancelled:true,...professionCancel};
  }
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
    // fixed PET_createPetFromCharaIndex copies enemy CHAR_PETID unchanged.
    petId:target?.petId??target?.tempNo??v.tempNo??null,
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
  // fixed BATTLE_CaptureCheck: CHAR_PickAllPet bypasses only the player-level +5 gate.\n  if(!sourcePlayerCaptureLevelAllowed(target,state))return {raw:0,display:0,allowed:false,missing:[],requirements:req.items,targetName:target.name};

  // fixed BATTLE_CaptureCheck 使用雙方 CHAR_WORKFIXDEX。
  // 實際捕獲判定在 normalBattleOrder() 的 PreCommand snapshot 後再次計算，因此 Enemy 可直接讀 roundFixQuick；
  // 顯示用的預先查詢尚未建立本輪 snapshot 時則退回 compliant quick。
  // fixed BATTLE_CaptureCheck 雖然來源值來自 CHAR int/work-int，
  // 但 Df_HpPer / At_Level / Df_Level / At_Dex / Df_Dex / WorkGet 全都宣告為 float。
  // 因此 HP²/MAXHP、等級 /2、敏捷 /15 與最後 *Charm/50 都必須保留小數。
  const enemyDex=Math.trunc(n(target.roundFixQuick??target.quick));
  const playerView=playerBattleView();
  const playerDex=Math.trunc(n(playerView.fixedDex));
  const captureBase=Math.trunc(enemy.dynamicGroup?n(target.captureBase):n(enemy.entry.variant?.captureBase));
  const maxHp=Math.max(1,Math.trunc(n(target.maxHp)));
  const hp=Math.trunc(n(target.hp));
  const playerLevel=Math.trunc(n(state.level));
  const targetLevel=Math.trunc(n(target.level));
  const luck=Math.trunc(n(state?.playerEquipCompliance?.fixedLuck??state.luck));
  const charm=Math.trunc(n(state?.playerEquipCompliance?.fixedCharm??state.charm));

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
      if(statusTurn.instigateAttack){
        performProfessionInstigateAttack(actor,statusTurn,{playerGuarding:false,allowPlayerCounter:false});
        if(enemy)syncEnemyTarget();
        sourceProcessBattleActorOuterBoundary();
        continue;
      }
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
      sourceAdvancePetVaryTurn(pet);
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
      // fixed ComboCheck excludes BOW / BOOMERANG / BOUNDTHROW / BREAKTHROW.
      throwWeapon:SOURCE_PLAYER_RANGED_WEAPON_TYPES.has(Math.trunc(n(playerBattleView()?.weaponType))),
      side:0,targetKey:targetId?('enemy:'+targetId):null,per:50
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
  const trap=sourcePrepareProfessionTrapReaction(attackerDesc,target,r);
  if(trap.triggered){
    sourceFinishProfessionTrapReaction(trap);
    // Combo's immediate DamageSub reaction is not added to AllDamage; TRAP protects
    // the original target entirely and returns fixed trap damage as *pDamage.
    sourceLogProfessionTrapReaction(trap);
    return {
      triggered:true,reaction:trap,reactionType:'trap',attackerDesc,
      targetDamage:0,postDamage:trap.trapDamage
    };
  }
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
    const r=resolveNormalAttack(attacker,targetView,{guarding,disableDodge:true,sourceCombo:true,skipSuitDodge:true});
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
      acupuncture:acupuncture.triggered&&acupuncture.reactionType!=='trap'?acupuncture.reaction:null,
      trap:acupuncture.reactionType==='trap'?acupuncture.reaction:null,
      damageReactType:acupuncture.reactionType|| (acupuncture.triggered?'acupuncture':null),
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
  battlePlayerRawGuardCommand=String(options.playerCommand||'')==='guard';
  if(enemy)enemy.sourceBattleTurn=Math.max(0,Math.trunc(n(enemy.sourceBattleTurn)))+1;
  const surpriseSide=enemy?.sourceSurprisePending?enemy.sourceSurpriseSide:null;
  // fixed BATTLE_AllCharaCWaitSet 只保留 Charge 類 command；普通 GUARD 新一輪前清回 NONE。
  // PreCommandSeq 同時清掉上一輪 Guardian mapping。
  battlePetGuardIds.clear();
  // complianceParameter 會在新 round 以 FIXSTR/FIXTOUGH 重建 WORK attack/defense。
  battlePetPowerMods.clear();
  battlePetNoGuardStates.clear();
  battlePlayerGuardianPetId=null;
  battleProfessionScapegoat=null;
  battlePlayerFixedToughWork=null;
  // 原 BATTLE_PreCommandSeq 每輪先清 Guardian mapping/flag，再 complianceParameter 重建 FIX 屬性；
  // Player 沒有 EARTHROUND0 例外，所以這裡也必須重建裝備 WORK。特別重要的是
  // ITEM_DIErelife 同回合消耗裝備後不立即 compliance，直到下一 round 才失去戒指加成。
  playerComplianceParameter(state);
  // fixed Other_DefcharWorkInt applies MYSKILL STR/TGH/DEX during this same compliance pass.
  sourceProfessionPlayerStatPreCommandCompliance(state);
  // fixed CHAR_complianceParameter + BATTLE_TurnParam rebuilds Player WORKATTACKPOWER each round.
  battlePlayerAttackWork=null;
  sourceProfessionPlayerHitPreCommandCompliance(state);
  // EARTHROUND0 是 Pet/Enemy 的明確例外，隱身者跳過整段並保留上一輪 WORK/FIX。
  sourcePreCommandResetTransient();
  // Other_DefcharWorkInt 同一階段處理 WEAKEN / BARRIER 的真正倒數與 WEAKEN 0.8 FIX 快照。
  sourcePreCommandStatusTick();
  // SetMagicPet is read by Other_DefcharWorkInt() during this PreCommand phase.
  // Freeze which buffs affect this round before any later StatusSeq countdown can expire them.
  sourcePrepareMagicPetRoundStates();
  // fixed Other_DefcharWorkInt: MYSKILLSTR is applied first, then Weapon Focus
  // multiplies FIXSTR. Freeze that FIXSTR before StatusSeq can expire the source Work.
  sourceProfessionPlayerFixedAttackCompliance(state);
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
function attackTurn(options={}){
  if(!enemy)return;
  const professionSlot=Number.isInteger(Number(options?.professionSlot))
    ?Math.trunc(Number(options.professionSlot)):null;
  let professionPrepared=null;
  if(professionSlot!==null){
    const selected=targetEnemyUnit();
    const selectedToNo=selected?10+Math.trunc(n(selected.battleSlot)):null;
    professionPrepared=sourceProfessionBattleSkillPrepare({
      slot:professionSlot,selectedToNo,battleMyNo:0,target:state
    });
    if(!professionPrepared.ok){
      addLog('職業技能無法施放：'+sourceProfessionBattleFailureText(professionPrepared.reason)+'。','bad');
      render();
      return professionPrepared;
    }
  }
  const order=normalBattleOrder({playerCommand:professionPrepared?'profession':'attack'});

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
      if(statusTurn.instigateAttack){
        performProfessionInstigateAttack(actor,statusTurn,{playerGuarding:false,allowPlayerCounter:true});
        if(enemy)syncEnemyTarget();
        sourceProcessBattleActorOuterBoundary();
        continue;
      }
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
      if(professionPrepared){
        const result=sourceProfessionBattleSkillExecute(professionPrepared,actor);
        professionPrepared.execution=result;
        if(result?.noAction){
          addLog('「'+String(sourceProfessionSkillTemplate(professionPrepared.skillId)?.name||'職業技能')+'」沒有產生效果：'+sourceProfessionBattleFailureText(result.reason)+'。');
        }
      }else{
        const result=sourcePerformPlayerCommonAttack(actor,{allowCounter:true});
        if(!result.attackCount){
          if(livingEnemyUnits().length)addLog('敵方目前都在地球一周的繞背狀態，暫時沒有可指定的目標。');
          continue;
        }
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
      sourceAdvancePetVaryTurn(pet);
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
  return professionPrepared;
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
      if(statusTurn.instigateAttack){
        performProfessionInstigateAttack(actor,statusTurn,{playerGuarding:true,allowPlayerCounter:false});
        if(enemy)syncEnemyTarget();
        sourceProcessBattleActorOuterBoundary();
        continue;
      }
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
      sourceAdvancePetVaryTurn(pet);
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

  // fixed char_walk.c still counts the successful walk, then skips the whole
  // rand()%120 / CEP branch when equipped eqnoenemy is effective on this Floor.
  state.virtualWalkSteps=Math.max(0,Math.floor(n(state.virtualWalkSteps)))+1;
  if(sourcePlayerNoEnemyActive(state,map))return false;

  const point=randomPointInEncounter(selected);
  const encounter=resolveEncounterAt(map,point.x,point.y);
  if(!encounter)return false;

  let min=clamp(n(encounter.encounterMin),0,100);
  let max=clamp(n(encounter.encounterMax),0,100);
  if(min>max){const t=min;min=max;max=t}
  let cep=n(state.encounterCep);
  // fixed char_walk.c computes profession temp from the PRE-clamp CEP, then clamps CEP only
  // for the normal min/max progression state.
  const professionEncounter=sourceProfessionEncounterRollPlan(cep);
  const rollCep=professionEncounter.rollCep;
  if(cep<min)cep=min;
  if(cep>max)cep=max;

  // 原 char_walk.c：每走一步 if(rand()%120 < temp)，失敗則 cep++，成功重設 minep。
  const roll=Math.floor(Math.random()*120);
  state.lastEncounterRoll={
    roll,cep,rollCep,min,max,encounterId:encounter.encounterId,x:point.x,y:point.y,
    professionEncounterFix:professionEncounter.pCep,
    professionEncounterExpired:professionEncounter.expired
  };
  if(professionEncounter.expired)addLog('職業技能的遇敵率效果結束。');
  if(roll<rollCep){
    // fixed _Item_MoonAct order: only after the primary rand()%120 encounter hit,
    // roll RAND(0,100); encounter continues only when Rnum > equipped rand threshold.
    const randEnemy=sourcePlayerRandEnemyThreshold(state);
    if(randEnemy>0){
      const randEnemyRoll=cRand(0,100);
      state.lastEncounterRoll.randEnemyThreshold=randEnemy;
      state.lastEncounterRoll.randEnemyRoll=randEnemyRoll;
      state.lastEncounterRoll.randEnemySuppressed=randEnemyRoll<=randEnemy;
      if(randEnemyRoll<=randEnemy){
        state.encounterCep=cep;
        return false;
      }
    }
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
function renderProfessionBattleActions(){
  const info=$('#professionBattleInfo'),actions=$('#professionBattleActions');
  if(!info||!actions)return;
  const rows=sourceProfessionSkillMenu(state).filter(Boolean);
  const learnedBattle=rows.filter(row=>row.useFlag===1);
  const supported=learnedBattle.filter(row=>sourceProfessionBattleFunctionSupported(row.functionName));
  const unsupportedCount=learnedBattle.length-supported.length;

  if(!supported.length){
    info.textContent='V2.33 live：暴擊／連環攻擊／雙重攻擊／舍己為友／激化攻擊／能量聚集／專注戰鬥／盾擊／貫穿攻擊／瀕死攻擊／回旋攻擊／混亂攻擊。角色目前尚未學會已接入的戰鬥職技。'
      +(unsupportedCount>0?' 另有 '+unsupportedCount+' 招已學戰鬥技能待後續移植。':'');
    actions.innerHTML='';
    return;
  }
  info.textContent='固定 client TARGET → battle toNo 已接入；目前鎖定 '+(targetEnemyUnit()?.name||'—')
    +(unsupportedCount>0?'；另有 '+unsupportedCount+' 招已學戰鬥技能尚未接函式。':'。');
  actions.innerHTML=supported.map(row=>{
    const disabled=!enemy||state.hp<=0||Math.trunc(n(state.mp))<row.costMp;
    return '<button data-profession-battle-slot="'+row.slot+'" '+(disabled?'disabled':'')+'>'
      +escapeHtml(row.name)+' Lv'+row.displayLevel+' · MP '+row.costMp+'</button>';
  }).join('');
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
  renderProfessionBattleActions();
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
const SOURCE_PLAYER_EQUIP_SLOT_LABELS=Object.freeze([
  '頭部','身體','武器','飾品1','飾品2','腰帶','盾牌','鞋子','手套'
]);
const SOURCE_ITEM_TYPE_LABELS=Object.freeze({
  0:'空手類',1:'斧',2:'棍棒',3:'槍',4:'弓',6:'頭盔',7:'鎧甲',
  8:'手環',9:'樂器',10:'項鍊',11:'戒指',12:'腰帶飾品',13:'耳環',14:'鼻環',15:'護身符',
  16:'其他',17:'回力標',18:'投擲斧',19:'投擲石',20:'料理',21:'金屬',22:'寶石',23:'商品',
  24:'腰帶',25:'盾牌',26:'鞋子',27:'手套'
});
function sourcePlayerRuntimeItemLabel(existing){
  if(!existing)return '空';
  const itemId=Math.trunc(Number(existing.itemId));
  const relife=sourceItemRelifeTemplate(itemId);
  return relife?.name||('Item '+itemId);
}
function sourcePlayerRuntimeItemSummary(existing){
  if(!existing)return '';
  const parts=[];
  for(const [label,field] of [
    ['攻','ITEM_MODIFYATTACK'],['防','ITEM_MODIFYDEFENCE'],['敏','ITEM_MODIFYQUICK'],
    ['HP','ITEM_MODIFYHP'],['MP','ITEM_MODIFYMP'],['運','ITEM_MODIFYLUCK'],['魅','ITEM_MODIFYCHARM'],
    ['迴避','ITEM_MODIFYAVOID'],['會心','ITEM_CRITICAL'],['額傷','ITEM_OTHERDAMAGE'],
    ['額防','ITEM_OTHERDEFC'],['命中','ITEM_HITRIGHT'],['忽防','ITEM_NEGLECTGUARD']
  ]){
    const value=sourceItemRuntimeResolvedDataInt(existing,field);
    if(value)parts.push(label+(value>0?'+':'')+value);
  }
  const type=sourceItemRuntimeResolvedDataInt(existing,'ITEM_TYPE');
  if(type!=null)parts.unshift(SOURCE_ITEM_TYPE_LABELS[type]||('Type '+type));
  return parts.join(' · ');
}
function sourcePlayerMoveFailureText(reason){
  return ({
    'state':'角色資料不存在',
    'range':'裝備／背包格超出範圍',
    'dead':'角色死亡時不能移動裝備',
    'missing-source':'找不到 source-backed existing item',
    'same-slot':'已在同一格',
    'unsupported-template':'item template 尚未完整來源化',
    'level':'角色等級不足',
    'str':'腕力 STR 未達原 C 裝備需求',
    'dex':'速度 DEX 未達原 C 裝備需求',
    'transmigration':'轉生次數不足',
    'profession-unported':'此物品有職業限制，職業系統尚未完整移植',
    'callback-unported':'此物品有 attach/detach callback，特殊效果尚未移植',
    'special-equip-unported':'此物品有固定原 C 特殊裝備副作用，尚未移植',
    'wrong-equip-place':'目前裝備位置不符合固定 ITEM_getEquipPlace',
    'same-type':'兩個飾品槽不能同時裝備相同 ITEM_TYPE',
    'same-type-exchange':'同類飾品交換會違反固定同 ITEM_TYPE 限制',
    'equip-direct-move':'原 C 不允許裝備格直接移到另一個空裝備格',
    'equip-direct-exchange':'原 C 不允許兩個裝備格直接交換',
    'backpack-full':'15 格 source-backed 背包已滿'
  })[reason]||('無法移動：'+String(reason||'unknown'));
}
function sourcePlayerAutoEquipDestination(fromSlot,target=state){
  const slots=sourcePlayerItemSlots(target);
  const from=Math.trunc(Number(fromSlot));
  if(from<PLAYER_BACKPACK_START||from>=PLAYER_ITEM_SLOT_COUNT)return {ok:false,reason:'range'};
  const itemIndex=Math.trunc(Number(slots[from]));
  if(!Number.isFinite(itemIndex))return {ok:false,reason:'missing-source'};
  const template=sourcePlayerEquipTemplateForExisting(itemIndex,target);
  if(!template)return {ok:false,reason:'unsupported-template'};
  const req=sourcePlayerEquipRequirements(template,target);
  if(!req.ok)return req;
  const canonical=sourcePlayerEquipPlace(template,slots,target);
  if(canonical<0)return {ok:false,reason:'wrong-equip-place'};
  if(canonical===PLAYER_DECORATION1_SLOT){
    const candidates=[PLAYER_DECORATION1_SLOT,PLAYER_DECORATION2_SLOT];
    const empty=candidates.find(slot=>slots[slot]==null&&!sourcePlayerDecorationTypeConflict(slot,template,slots,target));
    if(empty!=null)return {ok:true,to:empty,template,itemIndex};
    const legal=candidates.find(slot=>!sourcePlayerDecorationTypeConflict(slot,template,slots,target));
    if(legal!=null)return {ok:true,to:legal,template,itemIndex};
    return {ok:false,reason:'same-type'};
  }
  return {ok:true,to:canonical,template,itemIndex};
}
function sourceField2FailureText(reason){
  return ({
    'max-two':'修復每次只能選擇兩個物品',
    'max-four':'精工每次只能選擇四個物品',
    'dish':'料理不能做修復',
    'multiple-equipment':'每次只能選擇一個武器或防具',
    'no-equipment':'必須選擇一個武器或防具',
    'no-material':'修復還需要一個材料',
    'material-mismatch':'材料不符',
    'not-damaged-enough':'物品並沒有損壞到需要修復',
    'cannot-repair':'此物品已不能修復',
    'no-durability':'目前耐久資料不能執行修復',
    'missing-durability-source':'缺少固定耐久來源資料',
    'mutable-source-missing':'existing item 缺少可寫入的 sourceData',
    'unsuitable-item':'選到不適合精工的物品',
    'material-typecode':'精工材料缺少 TYPECODE',
    'full':'武器或防具已經鑲滿三格',
    'missing-int-source':'精工所需整數欄位來源不完整',
    'magic-source-missing':'精工魔法欄位來源不完整',
    'consume-failed':'材料 existing item 無法依原生命週期刪除',
    'merge-backpack-full':'合成時最少需要一個空的背包欄位',
    'merge-collision':'同一個 existing item 被重複送入合成',
    'merge-pile-source':'材料 pile 資料不完整，已停止且不猜值',
    'less-than-two-mergeable':'至少需要兩個可加工／料理材料',
    'mixed-dish':'料理與非料理材料不能混合',
    'no-merge-atoms':'材料沒有可供原 C 合成的 atom',
    'merge-consume-failed':'合成材料無法依原 C pile 生命週期扣除',
    'merge-output-alloc-failed':'成品 ITEM_makeItemAndRegist 無法取得 existing slot',
    'merge-mergeflag-source':'成品缺少可寫入的 ITEM_MERGEFLG 來源欄位',
    'merge-output-add-failed':'成品無法加入背包，已依原 C 銷毀成品 existing'
  })[reason]||String(reason||'未知 field=2 錯誤');
}
async function sourceUseField2PetSkill(skillId){
  const id=Math.trunc(Number(skillId)),pet=activePet();
  if(!pet){addLog('目前沒有出戰寵物，不能使用寵物生活技能。','bad');return {ok:false,reason:'no-active-pet'}}
  const skills=sourceField2PetSkills(pet);
  if(!skills.some(x=>x.id===id)){addLog(pet.name+' 並沒有這個 field=2 技能。','bad');return {ok:false,reason:'skill-not-owned'}}
  if(enemy){addLog('原 C field=2 PetSkill 只能在非戰鬥狀態使用。','bad');return {ok:false,reason:'in-battle'}}

  if(id===200||id===201){
    try{
      await sourceEnsurePetMergeFixDb();
      await sourceEnsureItemField2Db();
    }catch(err){
      addLog('加工／料理固定 merge runtime 載入失敗：'+String(err?.message||err),'bad');
      return {ok:false,reason:'merge-fix-runtime-load',sourceNoRngConsumed:true};
    }
    const candidateCache=sourceMergeCandidateCache();
    if(!candidateCache.ok){
      addLog((id===200?'加工':'料理')+' 的 fixed candidate runtime 無法完成：'+String(candidateCache.reason||'unknown')+'；未消耗 RNG／材料。','bad');
      return Object.assign({ok:false,reason:'merge-candidate-runtime',sourceNoRngConsumed:true},candidateCache);
    }

    const selected=sourceField2SelectedEntries();
    const result=sourceMergeExecuteLifecycle(selected,activePet());
    if(!result.ok){
      if(result.reason==='mixed-dish'&&result.materialsConsumed){
        addLog('非法的合成方法：料理與非料理材料混用；依原 C，這次有效材料仍已各消耗 1 pile。','bad');
      }else if(result.materialsConsumed){
        addLog((id===200?'加工':'料理')+' 未產生成品（'+sourceField2FailureText(result.reason)+'）；依原 C，這次有效材料已各消耗 1 pile。','bad');
      }else{
        addLog((id===200?'加工':'料理')+' 無法執行：'+sourceField2FailureText(result.reason)+'。','bad');
      }
      if(result.mutated||result.sourceRngConsumed)render();
      else renderSourcePlayerItems();
      return result;
    }

    const output=sourceItemRuntimeSlot(result.outputItemIndex);
    const label=output?sourcePlayerRuntimeItemLabel(output):('Item '+result.createdItemId);
    const mode=result.searchtable===1?'料理':'加工';
    const cooldownText=result.cooldown?.hit?'（命中原 C 頻繁合成 fallback）':'';
    addLog(mode+'完成'+cooldownText+'：'+label+'；材料各扣 1 pile，成品已設 ITEM_MERGEFLG 並加入背包。','good');
    save();render();
    return result;
  }

  try{await sourceEnsureItemField2Db()}
  catch(err){addLog('field=2 固定 item runtime 載入失敗：'+String(err?.message||err),'bad');return {ok:false,reason:'runtime-load'}}

  const selected=sourceField2SelectedEntries();
  let result=id===540?sourceUsePetFixitem(selected):sourceUsePetInslay(selected);
  if(!result.ok){
    const prefix=result.partial?'精工已保留前面成功材料的原 C 部分提交；後續失敗：':'';
    addLog(prefix+sourceField2FailureText(result.reason)+'。','bad');
    if(result.mutated){save();render()}
    else renderSourcePlayerItems();
    return result;
  }

  if(id===540){
    addLog('修復完成：耐久上限 '+result.oldMaxCrush+' → '+result.newMaxCrush+'，目前耐久恢復為 '+result.newCrush+'；材料已消耗。','good');
  }else{
    addLog('鑲寶石完成：'+result.applied.length+' 個材料依選取順序套用並消耗。','good');
  }
  sourceField2SelectedSlots.clear();
  save();render();
  return result;
}
function renderSourceField2Skills(){
  const statusEl=$('#sourceField2SelectionStatus'),actionsEl=$('#sourceField2SkillActions');
  if(!statusEl||!actionsEl)return;
  const selected=sourceField2SelectedEntries(),pet=activePet(),skills=sourceField2PetSkills(pet);
  statusEl.textContent=selected.length
    ?'已選 '+selected.length+'：'+selected.map((x,i)=>(i+1)+'. '+sourcePlayerRuntimeItemLabel(x.existing)).join('／')
    :'未選取材料（只從 15 格背包選取；順序會影響多材料精工）';
  const buttons=[];
  for(const {id,meta} of skills){
    buttons.push('<button data-source-item-action="field2-use" data-skill="'+id+'">'+escapeHtml(meta?.n||('Skill '+id))+' #'+id+'</button>');
  }
  if(selected.length)buttons.push('<button data-source-item-action="field2-clear">清除選取</button>');
  actionsEl.innerHTML=buttons.length
    ?buttons.join('')
    :'<span class="muted">'+(pet?'出戰寵目前沒有 field=2 技能。':'請先指定一隻出戰寵物。')+'</span>';
}
function renderSourcePlayerItems(){
  const equipEl=$('#sourceEquipmentGrid'),bagEl=$('#sourceBackpackGrid'),statusEl=$('#sourceItemRuntimeStatus');
  if(!equipEl||!bagEl||!statusEl)return;
  sourceField2PruneSelection();
  const slots=sourcePlayerItemSlots(state);
  const tracked=sourceTrackedPlayerItems();
  const equippedCount=slots.slice(0,PLAYER_EQUIP_SLOT_COUNT).filter(v=>v!=null).length;
  const bagCount=slots.slice(PLAYER_BACKPACK_START).filter(v=>v!=null).length;
  statusEl.textContent='裝備 '+equippedCount+' / 9 · 背包 '+bagCount+' / 15 · existing '+tracked.length;

  equipEl.innerHTML=SOURCE_PLAYER_EQUIP_SLOT_LABELS.map((label,slotIndex)=>{
    const itemIndex=slots[slotIndex];
    const existing=itemIndex==null?null:sourceRuntimeSlotFromTarget(state,itemIndex);
    const itemLabel=sourcePlayerRuntimeItemLabel(existing);
    const summary=sourcePlayerRuntimeItemSummary(existing);
    return '<div class="source-item-slot '+(existing?'filled':'empty')+'">'+
      '<div class="source-item-slot-head"><span>'+label+'</span><small>#'+slotIndex+'</small></div>'+
      '<b>'+escapeHtml(itemLabel)+'</b>'+
      (existing?'<div class="source-item-effects">'+escapeHtml(summary||'sourceData 已建立')+'</div>':'<div class="source-item-effects">空</div>')+
      (existing?'<button data-source-item-action="unequip" data-slot="'+slotIndex+'">卸下</button>':'')+
    '</div>';
  }).join('');

  bagEl.innerHTML=Array.from({length:PLAYER_BACKPACK_SLOT_COUNT},(_,offset)=>{
    const slotIndex=PLAYER_BACKPACK_START+offset;
    const itemIndex=slots[slotIndex];
    const existing=itemIndex==null?null:sourceRuntimeSlotFromTarget(state,itemIndex);
    if(!existing){
      return '<div class="source-item-slot empty"><div class="source-item-slot-head"><span>背包 '+(offset+1)+'</span><small>#'+slotIndex+'</small></div><div class="source-item-effects">空</div></div>';
    }
    const template=sourcePlayerEquipTemplateForExisting(itemIndex,state);
    const equipPlace=template?sourcePlayerEquipPlace(template,slots,state):-1;
    const canAttempt=equipPlace>=0;
    const field2Selected=sourceField2SelectedSlots.has(slotIndex);
    return '<div class="source-item-slot filled'+(field2Selected?' field2-selected':'')+'">'+
      '<div class="source-item-slot-head"><span>背包 '+(offset+1)+'</span><small>#'+slotIndex+'</small></div>'+
      '<b>'+escapeHtml(sourcePlayerRuntimeItemLabel(existing))+'</b>'+
      '<div class="source-item-effects">'+escapeHtml(sourcePlayerRuntimeItemSummary(existing)||'sourceData 已建立')+'</div>'+
      '<button data-source-item-action="field2-select" data-slot="'+slotIndex+'">'+(field2Selected?'取消材料':'選為材料')+'</button>'+
      (canAttempt?'<button data-source-item-action="equip" data-slot="'+slotIndex+'">裝備</button>':'<span class="source-item-not-equip">不可裝備類型</span>')+
    '</div>';
  }).join('');
  renderSourceField2Skills();
}
function renderInventory(){
  renderSourcePlayerItems();
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
    const [r,runtimeR,itemR,zooR,aiR,petSkillR,modAiR,attackMagicR,itemMagicR,itemRelifeR,itemMakeR,professionSkillR,gmqueR,enemyWeaponR]=await Promise.all([
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
      fetch(PROFESSION_SKILL_RUNTIME_URL,{cache:'no-store'}),
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
    if(!professionSkillR.ok)throw new Error('Profession skill runtime HTTP '+professionSkillR.status);
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
    sourceItemMakeTemplateCache.clear();
    if(itemMakeDb?.format==='stoneage-item-make-runtime-v2'){
      if(Math.trunc(Number(itemMakeDb.itemDataIntCount))!==66)throw new Error('Item make runtime field-count mismatch');
      if(Math.trunc(Number(itemMakeDb?.stats?.templates))!==10737)throw new Error('Item make runtime template-count mismatch');
      if(Math.trunc(Number(itemMakeDb?.fixedBuild?.itemIdTokenIndex))!==17)throw new Error('Item make runtime fixed-build mismatch');
    }
    professionSkillDb=await professionSkillR.json();
    if(professionSkillDb?.format!=='stoneage-profession-skill-runtime-v1')throw new Error('Profession skill runtime format mismatch');
    if(professionSkillDb?.source?.ref!=='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56')throw new Error('Profession skill runtime source-ref mismatch');
    if(Math.trunc(Number(professionSkillDb?.stats?.rows))!==69||Math.trunc(Number(professionSkillDb?.stats?.maxSkillId))!==72)throw new Error('Profession skill runtime row-count mismatch');
    if(JSON.stringify(professionSkillDb?.stats?.holes)!=='[63,64,65]')throw new Error('Profession skill runtime hole mismatch');
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
    addLog('V1.73 載入完成：一般裝備位置與 ITEM_equipEffect 已讀取 existing item 的 66 欄 sourceData；callback／職業／遠程武器未完整移植者維持 fail-closed。','good');
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
$('#professionBattleActions').addEventListener('click',e=>{
  const b=e.target.closest('button[data-profession-battle-slot]');if(!b||b.disabled)return;
  const slot=Math.trunc(Number(b.dataset.professionBattleSlot));
  if(!Number.isFinite(slot))return;
  attackTurn({professionSlot:slot});
  save();render();
});
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
$('#sourceItemRuntimePanel').addEventListener('click',async e=>{
  const b=e.target.closest('button[data-source-item-action]');if(!b)return;
  const action=b.dataset.sourceItemAction,slot=Math.trunc(Number(b.dataset.slot));
  if(action==='field2-select'){
    if(slot<PLAYER_BACKPACK_START||slot>=PLAYER_ITEM_SLOT_COUNT)return;
    if(sourceField2SelectedSlots.has(slot))sourceField2SelectedSlots.delete(slot);
    else sourceField2SelectedSlots.add(slot);
    renderSourcePlayerItems();return;
  }
  if(action==='field2-clear'){
    sourceField2SelectedSlots.clear();renderSourcePlayerItems();return;
  }
  if(action==='field2-use'){
    await sourceUseField2PetSkill(b.dataset.skill);return;
  }
  let moved=null;
  if(action==='equip'){
    const dest=sourcePlayerAutoEquipDestination(slot,state);
    if(!dest.ok){
      addLog('無法裝備：'+sourcePlayerMoveFailureText(dest.reason)+'。','bad');
      render();return;
    }
    moved=sourcePlayerMoveItem(slot,dest.to,{target:state});
  }else if(action==='unequip'){
    const to=sourcePlayerFindEmptyBackpackSlot(state);
    if(to<PLAYER_BACKPACK_START){
      addLog('無法卸下：'+sourcePlayerMoveFailureText('backpack-full')+'。','bad');
      render();return;
    }
    moved=sourcePlayerMoveItem(slot,to,{target:state});
  }
  if(!moved?.ok){
    addLog('裝備移動失敗：'+sourcePlayerMoveFailureText(moved?.reason)+'。','bad');
  }else{
    addLog((action==='equip'?'已裝備 ':'已卸下 ')+(sourcePlayerRuntimeItemLabel(sourceRuntimeSlotFromTarget(state,moved.itemIndex))||'道具')+'。','good');
  }
  save();render();
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
