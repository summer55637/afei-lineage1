'use strict';

const DATA_URL='data/generated/stoneage_general_lv1_pets.json';
const ENCOUNTER_RUNTIME_URL='data/generated/stoneage_general_encounter_runtime.json';
const ENEMY_AI_URL='data/generated/stoneage_enemy_ai.json';
const PETSKILL_RUNTIME_URL='data/generated/stoneage_petskill_runtime.json';
const PET_MODAI_URL='data/generated/stoneage_pet_modai.json';
const ATTACK_MAGIC_RUNTIME_URL='data/generated/stoneage_attack_magic_runtime.json';
const CONDITION_ITEM_URL='data/generated/capture_items.json';
const ZOO_QUEST_URL='data/generated/zoo_quest.json';
const SAVE_KEY='afei_stoneage_idle_v01';
const TEAM_SIZE=5;
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
let db=null, encounterRuntime=null, enemyAiDb=null, petSkillDb=null, petModAiDb=null, attackMagicDb=null, zooQuest=null, maps=[], conditionItems=[], sourceCatalog=new Map(), dynamicGroupCatalog=new Map(), encounterCatalog=new Map(), state=null, enemy=null, timer=null, battleStatuses=new Map(), battlePetOutIds=new Set(), battleReverseKeys=new Set(), battleElementWork=new Map(), battleFieldState={attr:'none',power:0,turns:0};

const $=s=>document.querySelector(s);
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const uid=()=>('p'+Date.now().toString(36)+Math.random().toString(36).slice(2,8));

function freshItemRuntime(){return {itemnum:25000,sindex:1,slots:{}}}
function normalizeItemRuntime(rt){
  const out=freshItemRuntime();
  if(!rt||typeof rt!=='object')return out;
  out.itemnum=25000;
  out.sindex=clamp(Math.trunc(n(rt.sindex)||1),1,out.itemnum-1);
  const slots=rt.slots&&typeof rt.slots==='object'?rt.slots:{};
  for(const [k,v] of Object.entries(slots)){
    const idx=Math.trunc(Number(k));
    if(!Number.isFinite(idx)||idx<=0||idx>=out.itemnum||!v||v.use!==true)continue;
    out.slots[String(idx)]={
      use:true,
      itemId:Number.isFinite(Number(v.itemId))?Math.trunc(Number(v.itemId)):null,
      magicUseMp:v.magicUseMp==null?null:(Number.isFinite(Number(v.magicUseMp))?Math.trunc(Number(v.magicUseMp)):null),
      owner:typeof v.owner==='string'?v.owner:null,
      source:typeof v.source==='string'?v.source:null,
      enemySlot:Number.isFinite(Number(v.enemySlot))?Math.trunc(Number(v.enemySlot)):null
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
  state.itemRuntime=normalizeItemRuntime(state.itemRuntime);
  const rt=state.itemRuntime;
  for(let guard=0;guard<rt.itemnum;guard++){
    rt.sindex++;
    if(rt.sindex>=rt.itemnum)rt.sindex=1;
    const key=String(rt.sindex);
    if(rt.slots[key]?.use===true)continue;
    rt.slots[key]={
      use:true,
      itemId:Number.isFinite(Number(itemId))?Math.trunc(Number(itemId)):null,
      magicUseMp:magicUseMp==null?null:(Number.isFinite(Number(magicUseMp))?Math.trunc(Number(magicUseMp)):null),
      owner:typeof meta?.owner==='string'?meta.owner:null,
      source:typeof meta?.source==='string'?meta.source:null,
      enemySlot:Number.isFinite(Number(meta?.enemySlot))?Math.trunc(Number(meta.enemySlot)):null
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
  if(!slot)return false;
  const key=String(itemId);
  state.inventory[key]=n(state.inventory[key])+1;
  slot.itemId=Math.trunc(Number(itemId));
  slot.owner='player';slot.source='battle-getitem';slot.enemySlot=null;
  return true;
}
function releaseEnemyRuntimeItems(unit){
  if(!unit)return 0;
  let freed=0;
  for(const drop of unit.enemyDrops||[]){
    const idx=Math.trunc(Number(drop?.itemIndex));
    const slot=sourceItemRuntimeSlot(idx);
    if(slot&&slot.owner==='enemy:'+unit.id){if(sourceItemRuntimeFree(idx))freed++;}
  }
  const styleIdx=Math.trunc(Number(unit.styleItemIndex));
  const styleSlot=sourceItemRuntimeSlot(styleIdx);
  if(styleSlot&&styleSlot.owner==='enemy:'+unit.id){if(sourceItemRuntimeFree(styleIdx))freed++;}
  return freed;
}
function releaseBattleEnemyRuntimeItems(battleEnemy=enemy){
  if(!battleEnemy)return 0;
  const units=(Array.isArray(battleEnemy.units)&&battleEnemy.units.length)?battleEnemy.units:[battleEnemy];
  return units.reduce((sum,u)=>sum+releaseEnemyRuntimeItems(u),0);
}
function clearEnemyBattleNoReward(){
  if(enemy)releaseBattleEnemyRuntimeItems(enemy);
  enemy=null;
  resetBattleStatuses();
}
function freshState(){
  return {
    schemaVersion:20,
    level:1,exp:0,expNext:2,hp:35,maxHp:35,mp:100,maxMp:100,
    playerPigUntilMs:0,playerPigImage:100388,
    magicResist:[0,0,0,0],magicResistExp:[0,0,0,0],
    attack:6,defense:6,dex:5,charm:60,luck:0,skillPoints:0,duelPoint:0,
    playerStats:{vital:5,str:5,tgh:5,dex:5},
    gold:0,battles:0,wins:0,mapId:null,encounterId:null,encounterCep:0,virtualWalkSteps:0,lastEncounterRoll:null,auto:true,autoCapture:true,
    petBox:[],team:Array(TEAM_SIZE).fill(null),activePetId:null,
    inventory:{},
    itemRuntime:freshItemRuntime(),
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
  const s=Object.assign(base,raw||{});
  s.inventory=(raw&&raw.inventory&&typeof raw.inventory==='object')?raw.inventory:{};
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
  s.team=s.team.map(id=>ids.has(id)?id:null);
  if(!ids.has(s.activePetId))s.activePetId=null;
  if(!s.activePetId){
    s.activePetId=s.team.find(Boolean)||null;
  }
  if(!s.team.some(Boolean)&&s.petBox.length){
    s.team[0]=s.petBox[0].id;
    s.activePetId=s.petBox[0].id;
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
  if(n(raw?.schemaVersion)<14){
    const earned=Math.max(0,(Math.max(1,Math.floor(n(s.level)||1))-1)*3);
    s.skillPoints=Math.max(Math.max(0,Math.floor(n(s.skillPoints))),earned);
    s.playerStats={vital:5,str:5,tgh:5,dex:5};
    s.charm=Math.min(100,Math.max(0,n(s.charm))+10);
  }
  s.playerStats=Object.assign({vital:5,str:5,tgh:5,dex:5},s.playerStats||{});
  for(const k of ['vital','str','tgh','dex'])s.playerStats[k]=Math.max(0,Math.floor(n(s.playerStats[k])));
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
  else s.itemRuntime=normalizeItemRuntime(s.itemRuntime);
  // V0.69 起 slot 記錄 owner/source；V0.68 的舊 slot 若無 owner，保留 use/index 但不捏造歸屬。
  s.schemaVersion=20;
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
  const carriedLoot=resolveEnemyCarriedLoot(defeatedEnemy);
  for(const carried of carriedLoot){
    const itemId=Number(carried.itemId);
    if(!Number.isFinite(itemId))continue;
    if(Number.isFinite(Number(carried.itemIndex))&&sourceItemRuntimeSlot(carried.itemIndex)){
      giveTrackedItemFromExisting(itemId,carried.itemIndex);
    }else{
      giveItem(itemId,1);
    }
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
  const p=target.playerStats||{vital:5,str:5,tgh:5,dex:5};
  const vital=Math.max(0,Math.floor(n(p.vital))),str=Math.max(0,Math.floor(n(p.str)));
  const tgh=Math.max(0,Math.floor(n(p.tgh))),dex=Math.max(0,Math.floor(n(p.dex)));
  target.playerStats={vital,str,tgh,dex};
  target.attack=Math.trunc(str+tgh*.1+vital*.1+dex*.05);
  target.defense=Math.trunc(tgh+str*.1+vital*.1+dex*.05);
  target.dex=Math.trunc(dex);
  target.maxHp=Math.max(1,Math.trunc(vital*4+str+tgh+dex));
  target.hp=Math.min(Math.max(0,n(target.hp)),target.maxHp);
  return {attack:target.attack,defense:target.defense,quick:target.dex,maxHp:target.maxHp};
}
function allocatePlayerStat(key){
  const labels={vital:'體力 VITAL',str:'腕力 STR',tgh:'耐力 TOUGH',dex:'速度 DEX'};
  if(!labels[key]||!state)return false;
  const points=Math.max(0,Math.floor(n(state.skillPoints)));
  if(points<=0){addLog('目前沒有可分配的能力點。','bad');return false;}
  state.playerStats=Object.assign({vital:5,str:5,tgh:5,dex:5},state.playerStats||{});
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
function rollEnemyDropSlots(raw){
  const items=Array.isArray(raw?.enemyItems)?raw.enemyItems:[];
  const probs=Array.isArray(raw?.itemProbs)?raw.itemProbs:[];
  const resolved=items.length>=10&&probs.length>=10;
  const drops=[];
  if(!resolved)return {resolved:false,drops};
  for(let i=0;i<10;i++){
    const probabilityRaw=Math.trunc(n(probs[i]));
    if(!probabilityRaw)continue;
    // 原 _FIX_ITEMPROB：RAND(0,999) < ITEMPROB。大於 1000 的原始值不 clamp。
    if(Math.floor(Math.random()*1000)<probabilityRaw){
      drops.push({slot:i+1,itemId:Math.trunc(n(items[i])),probabilityRaw});
    }
  }
  return {resolved:true,drops};
}
function resolveEnemyCarriedLoot(defeatedEnemy){
  const units=(Array.isArray(defeatedEnemy?.units)&&defeatedEnemy.units.length)
    ?defeatedEnemy.units
    :[defeatedEnemy].filter(Boolean);
  const result=[];
  for(const unit of units){
    for(const drop of unit?.enemyDrops||[]){
      const item={
        itemId:Math.trunc(n(drop?.itemId)),slot:Math.trunc(n(drop?.slot)),
        probabilityRaw:Math.trunc(n(drop?.probabilityRaw)),itemIndex:Math.trunc(Number(drop?.itemIndex)),unitId:unit.id
      };
      const runtimeSlot=sourceItemRuntimeSlot(item.itemIndex);
      if(runtimeSlot&&runtimeSlot.owner==='enemy:'+unit.id)sourceItemRuntimeSetOwner(item.itemIndex,'battle-getitem','battle-getitem');

      if(result.length<3){
        result.push(item);
      }else if(Math.floor(Math.random()*2)){
        const replace=Math.floor(Math.random()*3);
        const old=result[replace];
        if(Number.isFinite(old?.itemIndex))sourceItemRuntimeFree(old.itemIndex);
        result[replace]=item;
      }else if(Number.isFinite(item.itemIndex)){
        sourceItemRuntimeFree(item.itemIndex);
      }
    }
  }
  return result;
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
function fallbackBattleExp(defeated){
  const growth=(defeated?.dynamicGroup&&Array.isArray(defeated?.units)&&defeated.units.length)
    ?defeated.units.reduce((s,u)=>s+Math.max(1,n(u.wildGrowth)||1),0)/defeated.units.length
    :Math.max(1,n(defeated?.entry?.variant?.wildGrowth)||1);
  const unitCount=Math.max(1,Array.isArray(defeated?.units)?defeated.units.length:1);
  return Math.max(6,Math.round((7+growth*2.2)*unitCount));
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

  // 原 enemy.c 會在 CHAR_initCharOneArray() 後、RandomChange 前生成 10 格 Enemy 戰利品。
  const enemyDropRoll=rollEnemyDropSlots(raw);
  const serverExpBase=enemyServerBaseExp(raw,level);
  const change=applyEnemyRandomChange(
    raw,
    Object.assign({},raw?.elements||base.elements||{}),
    Array.isArray(raw?.petSkills)?raw.petSkills:[]
  );
  const resolvedEnemyId=Number(raw?.enemyId??base.enemyIds?.[0]??0)||null;
  const unitId='unit-'+Date.now()+'-'+index+'-'+Math.random().toString(36).slice(2,7);
  const aiRow=resolvedEnemyId!=null?(enemyAiDb?.byEnemyId?.[String(resolvedEnemyId)]||null):null;

  // 原 ENEMY_createEnemy：10 格 carried item 先 allocate，STYLE 武器再 allocate；RandomChange 在兩者之後。
  const runtimeDrops=[];
  for(const drop of enemyDropRoll.drops){
    const itemIndex=sourceItemRuntimeAlloc(drop.itemId,null,{owner:'enemy:'+unitId,source:'enemy-drop',enemySlot:drop.slot});
    // ITEM_makeItemAndRegist 失敗時 source CHAR slot 會是 -1，該物品實際不存在。
    if(itemIndex>=0)runtimeDrops.push(Object.assign({},drop,{itemIndex}));
  }
  const style=Math.max(0,Math.trunc(n(aiRow?.sty)));
  const styleWeaponId=({1:0,2:100,3:200,4:400,5:500,6:700,7:600})[style]??null;
  const styleItemIndex=styleWeaponId==null?-1:sourceItemRuntimeAlloc(styleWeaponId,null,{owner:'enemy:'+unitId,source:'enemy-style'});

  return {
    id:unitId,
    name:raw?.name||fallbackEntry?.species?.clientLabel||base.serverName||('Enemy '+(raw?.enemyId??'')),
    enemyId:resolvedEnemyId,
    ai:aiRow,
    statusResist:resolvedEnemyId!=null?(enemyAiDb?.byEnemyId?.[String(resolvedEnemyId)]?.z?.slice?.(0,6)||[0,0,0,0,0,0]):[0,0,0,0,0,0],
    tempNo:Number(raw?.tempNo??base.tempNo??0)||null,
    // 原 ENEMY_createEnemy 由 CHAR_getDefaultChar(31010) 的 defaultPlayer 建立；其 CHAR_MP / CHAR_MAXMP 都是 0，Enemy 流程沒有覆寫。
    level,hp,maxHp:hp,mp:0,maxMp:0,attack,defense,quick,
    stats:st,
    sourceBaseStats:Object.assign({},baseStats),
    allocatedFrom,
    serverDerived:server,
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
      entry,units,groupBattle:true,dynamicGroup:!!dynamicSpec,
      encounterId:dynamicSpec?.encounterId??null,groupId:dynamicSpec?.groupId??null,
      selectedEncounterId:dynamicSpec?.selectedEncounterId??dynamicSpec?.encounterId??null,
      roamX:dynamicSpec?.roamX??null,roamY:dynamicSpec?.roamY??null,
      encounterCep:dynamicSpec?.encounterCep??null,encounterRoll:dynamicSpec?.encounterRoll??null,
      level:first.level,name:first.name,hp:first.hp,maxHp:first.maxHp,attack:first.attack,defense:first.defense
    };
    state.battles++;
    addLog((dynamicSpec?'遭遇原始遇敵群組：':'遭遇任務編成：')+label+'。');
    render();return;
  }
  const unit=makeEnemyUnit(null,entry,0);
  unit.battleSlot=0;
  enemy=Object.assign({entry,groupBattle:false,dynamicGroup:false},unit);
  state.battles++;
  addLog('遭遇 Lv'+enemy.level+' '+enemy.name+'。');
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
  const p={
    id:uid(),name:'布伊胖',animationGroupId:100825,tempNo:730,level:1,exp:0,wildGrowth:27,
    stats:{vital:34,str:29,tgh:25,dex:23},elements:{},capturedAt:Date.now(),questReward:true
  };
  syncPetBattleHp(p,true);
  state.petBox.push(p);
  const open=state.team.findIndex(x=>!x);
  if(open>=0)state.team[open]=p.id;
  if(!state.activePetId)state.activePetId=p.id;
  return p;
}
function addEvent83Pet(){
  if(hasPetTempNo(854))return state.petBox.find(p=>Number(p.tempNo)===854);
  const p={
    id:uid(),name:'動物園養的拉斯基',animationGroupId:100853,tempNo:854,level:1,exp:0,wildGrowth:10,
    stats:{vital:20,str:23,tgh:21,dex:26},elements:{earth:60,water:40,fire:0,wind:0},
    capturedAt:Date.now(),questReward:true,event83:true
  };
  syncPetBattleHp(p,true);
  state.petBox.push(p);
  const open=state.team.findIndex(x=>!x);
  if(open>=0)state.team[open]=p.id;
  if(!state.activePetId)state.activePetId=p.id;
  return p;
}
function addMarefiaPet(){
  let p=state.petBox.find(x=>Number(x.tempNo)===718);
  if(p)return p;
  p={id:uid(),name:'瑪蕾菲雅',animationGroupId:null,tempNo:718,level:1,exp:0,levelCap:10,wildGrowth:1,
    stats:{vital:18,str:12,tgh:14,dex:18},elements:{earth:100,water:0,fire:0,wind:0},
    capturedAt:Date.now(),questReward:true,event71Prerequisite:true,memoryRoute:true};
  syncPetBattleHp(p,true);
  state.petBox.push(p);
  const open=state.team.findIndex(x=>!x);
  if(open>=0)state.team[open]=p.id;
  if(!state.activePetId)state.activePetId=p.id;
  return p;
}
function marefiaPet(){return state.petBox.find(p=>Number(p.tempNo)===718)||null}
function awardActivePetExp(amount){
  const p=activePet();if(!p)return;
  const isMarefia=Number(p.tempNo)===718;
  const maxLevel=isMarefia?Math.max(1,n(p.levelCap)||10):petServerLevelCap();
  p.exp=n(p.exp)+Math.max(1,Math.round(amount));
  let upCount=0,growthCount=0;
  while(p.level<maxLevel){
    const need=petExpToNext(p.level);
    if(need<=0||p.exp<need)break;
    p.exp-=need;p.level++;upCount++;
    if(serverPetLevelUp(p))growthCount++;
  }
  if(isMarefia&&p.level>=maxLevel){
    const next=petExpToNext(p.level);
    if(next>0)p.exp=Math.min(p.exp,Math.max(0,next-1));
  }
  if(upCount){
    addLog(p.name+' 升到 Lv.'+p.level+'（'+upCount+' 級）'+(growthCount?'，已套用原 CHAR_PetLevelUp 成長 '+growthCount+' 次。':'。'),'pet');
    if(isMarefia&&p.level===maxLevel&&p.level<79)addLog('瑪蕾菲雅到達目前回憶門檻 Lv.'+maxLevel+'，可前往下一個記憶地點。','pet');
  }
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
function normalizedElements(elements){
  if(!elements)return null;
  const earth=Math.max(0,n(elements.earth)),water=Math.max(0,n(elements.water));
  const fire=Math.max(0,n(elements.fire)),wind=Math.max(0,n(elements.wind));
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
function battleAttrMultiplier(attacker,defender){
  const a=normalizedElements(attacker?.elements),d=normalizedElements(defender?.elements);
  if(!a||!d)return 1;
  const same=1,up=1.5,down=.6;
  const fire=a.fire*(d.none*up+d.fire*same+d.water*down+d.earth*same+d.wind*up);
  const water=a.water*(d.none*up+d.fire*up+d.water*same+d.earth*down+d.wind*same);
  const earth=a.earth*(d.none*up+d.fire*same+d.water*up+d.earth*same+d.wind*down);
  const wind=a.wind*(d.none*up+d.fire*down+d.water*same+d.earth*up+d.wind*same);
  const none=a.none*(d.none*same+d.fire*down+d.water*down+d.earth*down+d.wind*down);
  const base=(fire+water+earth+wind+none)/10000;
  return base*battleFieldRatio(a,d);
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
  if(slot===0&&state.hp>0)return {kind:'player'};
  if(slot===5){
    const pet=activePet();
    if(pet&&petIsBattleActive(pet))return {kind:'pet',pet,petId:pet.id};
  }
  return null;
}
function enemyAttackMagicTargets(chosen,magic,pattern){
  const selectedSlot=chosen?.kind==='pet'?5:0;
  let toNo=selectedSlot;
  const rewrite=Number(magic?.targetRewrite);
  if(rewrite===20)toNo=20;
  else if(Number.isFinite(rewrite)&&rewrite!==-1)toNo=(selectedSlot>=0&&selectedSlot<=4)?rewrite:rewrite-1;

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
  poison:'中毒',deepPoison:'劇毒',paralysis:'麻痺',sleep:'睡眠',stone:'石化',drunk:'酒醉',confusion:'混亂',dizzy:'暈眩',barrier:'魔障',weaken:'虛弱',nocast:'沉默'
});
const BATTLE_STATUS_INDEX=Object.freeze({poison:0,paralysis:1,sleep:2,stone:3,drunk:4,confusion:5});
function resetBattleStatuses(){battleStatuses=new Map();battlePetOutIds=new Set();battleReverseKeys=new Set();battleElementWork=new Map();battleFieldState={attr:'none',power:0,turns:0}}
function battleStatusKey(desc){
  if(!desc)return null;
  if(desc.kind==='player')return 'player';
  if(desc.kind==='pet')return 'pet:'+String(desc.pet?.id??desc.petId??'');
  if(desc.kind==='enemy')return 'enemy:'+String(desc.unit?.id??desc.unitId??'');
  return null;
}
function battleBaseElements(desc){
  if(desc?.kind==='player')return Object.assign({},state?.elements||{});
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
  battleElementWork=new Map();
  const list=[];
  if(state)list.push({kind:'player'});
  const pet=activePet();
  if(pet)list.push({kind:'pet',pet,petId:pet.id});
  for(const unit of livingEnemyUnits())list.push({kind:'enemy',unit,unitId:unit.id});
  for(const desc of list){
    const key=battleStatusKey(desc);
    let work=battleBaseElements(desc);
    if(key&&battleReverseKeys.has(key))work=battleReverseElements(work);
    if(key)battleElementWork.set(key,work);
  }
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
function battleStatusActive(desc,type=null){
  const st=battleStatusGet(desc);
  return !!(st&&st.turns>0&&(!type||st.type===type));
}
function battleStatusClear(desc,type=null){
  const key=battleStatusKey(desc);
  if(!key)return false;
  const st=battleStatuses.get(key);
  if(!st||type&&st.type!==type)return false;
  battleStatuses.delete(key);
  return true;
}
function battleStatusCanMove(desc){
  const st=battleStatusGet(desc);
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
  if(battleStatusGet(targetDesc))return {allowed:false,per:0,reason:'existing'};
  const resist=battleStatusResist(targetDesc,type);
  if(type==='paralysis'&&!rules.forceGeneral){
    const per=20-resist;
    return {allowed:true,per,success:cRand(1,100)<per,resist};
  }
  const raw=battleStatusRawStats(targetDesc);
  const total=n(raw.vital)+n(raw.str)+n(raw.tgh)+n(raw.dex);
  const vitalPenalty=total>0?(n(raw.vital)/total)/.25*10:0;
  const bai=Number.isFinite(Number(rules.bai))?Number(rules.bai):2;
  const range=Number.isFinite(Number(rules.range))?Math.max(0,Number(rules.range)):40;
  const perOffset=Number.isFinite(Number(rules.perOffset))?Number(rules.perOffset):30;
  let level=(battleStatusLevel(attackerDesc)-battleStatusLevel(targetDesc))*bai;
  level=clamp(level,-range,range);
  let per=perOffset+level+battleStatusLuck(attackerDesc)-resist-vitalPenalty;
  if(per>80)per=80;
  return {allowed:true,per,success:cRand(1,100)<per,resist,vitalPenalty,level,bai,range,perOffset};
}
function battleStatusApply(targetDesc,type,turns){
  if(battleStatusGet(targetDesc))return false;
  const key=battleStatusKey(targetDesc);
  if(!key)return false;
  battleStatuses.set(key,{type,turns:Math.max(1,Math.trunc(n(turns))+1)});
  return true;
}
function battleStatusApplyRaw(targetDesc,type,turns){
  if(battleStatusGet(targetDesc))return false;
  const key=battleStatusKey(targetDesc);
  if(!key)return false;
  battleStatuses.set(key,{type,turns:Math.max(1,Math.trunc(n(turns)))});
  return true;
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
  }

  const st=battleStatusGet(desc);
  if(!st||st.turns<=0)return {skip:false,desc,status:null};

  const blockedBefore=battleStatusCanMove(desc)===false;
  st.turns--;

  if(st.type==='deepPoison'){
    const hp=battleStatusHp(desc);
    const name=desc.kind==='player'?'你':desc.pet?.name||desc.unit?.name||'目標';
    // 原 StatusSeq：HP<=1 直接死亡；否則倒數降到 <=1 時也直接死亡。
    if(hp<=1||st.turns<=1){
      battleStatusSetHp(desc,0);
      battleStatusClear(desc,'deepPoison');
      addLog(name+' 身中劇毒未解而倒下了！','bad');
      return {skip:true,desc,status:st,deepPoisonDeath:true};
    }
    const down=battleStatusPoisonDamage(desc);
    if(down>0)addLog(name+' 因劇毒受到 '+down+' 傷害。','bad');
    return {skip:false,desc,status:st};
  }

  if(st.turns<=0){
    battleStatusClear(desc);
    addLog((desc.kind==='player'?'你':desc.pet?.name||desc.unit?.name||'目標')+' 的'+(BATTLE_STATUS_NAMES[st.type]||st.type)+'狀態解除。');
    return {skip:blockedBefore,desc,status:st,expired:true};
  }

  if(st.type==='poison'){
    const down=battleStatusPoisonDamage(desc);
    if(down>0)addLog((desc.kind==='player'?'你':desc.pet?.name||desc.unit?.name||'目標')+' 因中毒受到 '+down+' 傷害。','bad');
  }
  if(st.type==='confusion'&&cRand(1,100)<=80){
    return {skip:false,desc,status:st,confusionAttack:true};
  }
  return {skip:blockedBefore,desc,status:st};
}
function battleStatusTypeFromOption(option){
  const t=String(option||'');
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
  // 原碼解除酒醉時會把 QUICK 還原為 ×2，但 StatusChange 命中處誤把 DRUNK 倒數值 /2。
  // 這裡採用對稱且不污染永久能力值的轉譯：酒醉期間戰鬥 QUICK 取一半，解除後自然回到基礎值。
  const base=n(quick);
  return battleStatusActive(desc,'drunk')?Math.trunc(base/2):base;
}
function playerBattleView(){
  const desc={kind:'player'};
  const stone=battleStatusActive(desc,'stone');
  const drunk=battleStatusActive(desc,'drunk');
  const weaken=battleStatusActive(desc,'weaken');
  const attack=weaken?Math.trunc(n(state.attack)*.8):n(state.attack);
  const defenseBase=weaken?Math.trunc(n(state.defense)*.8):n(state.defense);
  const quickBase=weaken?Math.trunc(n(state.dex)*.8):n(state.dex);
  return {
    type:'player',attack,defense:defenseBase*(stone?2:1),fixedTough:n(state.playerStats?.tgh),quick:battleDrunkQuick(desc,quickBase),
    luck:n(state.luck),drunk,
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
  const weaken=battleStatusActive(desc,'weaken');
  const attack=weaken?Math.trunc(n(combat?.attack)*.8):n(combat?.attack);
  const defenseBase=weaken?Math.trunc(n(combat?.defense)*.8):n(combat?.defense);
  const quickBase=weaken?Math.trunc(n(combat?.quick)*.8):n(combat?.quick);
  return {
    type:'pet',attack,defense:defenseBase*(stone?2:1),
    fixedTough:pet.serverStats?n(pet.serverStats.tgh)*.01:n(pet.stats?.tgh),
    quick:battleDrunkQuick(desc,quickBase),
    luck:0,drunk,
    level:Math.max(1,Math.trunc(n(pet.level))),elements:battleElementsForDesc(desc)
  };
}
function enemyBattleView(unit){
  const desc={kind:'enemy',unit,unitId:unit?.id};
  const drunk=battleStatusActive(desc,'drunk');
  const weaken=battleStatusActive(desc,'weaken');
  const attackBase=n(unit?.roundAttack??unit?.attack);
  const defenseRaw=n(unit?.roundDefense??unit?.defense);
  const quickRaw=n(unit?.roundQuick??unit?.quick);
  return {
    type:'enemy',
    attack:weaken?Math.trunc(attackBase*.8):attackBase,
    defense:(weaken?Math.trunc(defenseRaw*.8):defenseRaw)*(battleStatusActive(desc,'stone')?2:1),
    quick:battleDrunkQuick(desc,weaken?Math.trunc(quickRaw*.8):quickRaw),
    luck:0,
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
    if(ENEMY_SOURCE_MISSING_SKILL_IDS.has(Number(picked.skillId))){
      return {
        kind:'none',spec,
        skillSlot:picked.skillSlot,skillId:picked.skillId,
        sourceSkillMissing:true
      };
    }
    if(ENEMY_SOURCE_UNREGISTERED_SKILL_IDS.has(Number(picked.skillId))){
      return {
        kind:'none',spec,
        skillSlot:picked.skillSlot,skillId:picked.skillId,
        sourceSkillUnregistered:true,
        sourceCWaitReason:'unregistered-function'
      };
    }
    const meta=enemyPetSkillMeta(picked.skillId);
    if(meta?.f==='PETSKILL_Sacrifice'&&n(unit?.hp)<=n(unit?.maxHp)*.2){
      // 原 PETSKILL_Sacrifice() 在 AI 階段直接 return FALSE；
      // BATTLE_ai_all() 不設 C_OK，因此本回合在 StatusSeq 前被跳過。
      return {
        kind:'none',spec,skillSlot:picked.skillSlot,skillId:picked.skillId,skillMeta:meta,
        sourceSkillRejected:true,sourceCWaitReason:'sacrifice-low-hp'
      };
    }
    if(meta?.f==='PETSKILL_None')return {kind:'none',spec,skillSlot:picked.skillSlot,skillId:picked.skillId,skillMeta:meta};
    if(meta?.f==='PETSKILL_NormalAttack')return {kind:'attack',spec,skillSlot:picked.skillSlot,skillId:picked.skillId,skillMeta:meta};
    if(meta?.f==='PETSKILL_NormalGuard')return {kind:'guard',spec,skillSlot:picked.skillSlot,skillId:picked.skillId,skillMeta:meta};
    return Object.assign({},picked,{spec,skillMeta:meta});
  }
  return Object.assign({},picked,{spec});
}
function enemySignedSkillPercent(option,key){
  const m=String(option||'').match(new RegExp(key+'([+-]?\\d+(?:\\.\\d+)?)'));
  const v=m?Number(m[1]):0;
  return Number.isFinite(v)?v:0;
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
  unit.roundAttack=Math.trunc(n(unit.attack));
  unit.roundQuick=Math.trunc(n(unit.quick));

  // 原每回合 BATTLE_Pr ... CHAR_complianceParameter() 會先用當下 CHAR_MYSKILLTGH
  // 重算 FIXTOUGH，再交給 BATTLE_TurnParam。故大地鎧甲是「回合開始快照」：
  // 同回合中途才被套用，不會倒灌改變已建立好的本回合 WORKDEFENCEPOWER。
  const tghBuffPower=n(unit?.mySkillTghTurns)>0?Math.max(0,n(unit?.mySkillTghPower)):0;
  const baseDefense=Math.trunc(n(unit.defense));
  unit.roundDefense=baseDefense+Math.trunc(baseDefense*tghBuffPower/100);
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

  if(meta?.f==='PETSKILL_BattleModel'){
    const parts=String(meta.o||'').split('|');
    const attackPct=enemySignedSkillPercent(parts[5]||'','攻%');
    unit.roundAttack=Math.trunc(n(unit.attack)+n(unit.attack)*attackPct/100);
    unit.counterEligibleThisTurn=false;
  }else if(meta?.f==='PETSKILL_BattleTearDamage'){
    unit.roundAttack=Math.trunc(n(unit.attack)*.9);
    unit.roundDefense=Math.trunc(n(unit.roundDefense)*.8);
    unit.counterEligibleThisTurn=false;
  }else if(meta?.f==='PETSKILL_AttackCrazed'){
    // 原 PETSKILL_AttackCrazed 固定攻 80%、防 70%，option 只決定攻擊次數。
    unit.roundAttack=Math.trunc(n(unit.attack)*.8);
    unit.roundDefense=Math.trunc(n(unit.roundDefense)*.7);
    unit.counterEligibleThisTurn=true;
  }else if(meta?.f==='PETSKILL_SpeedyAttack'){
    const defensePct=enemySignedSkillPercent(meta.o,'防%');
    unit.roundDefense=Math.trunc(n(unit.roundDefense)+n(unit.roundDefense)*defensePct/100);
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
    unit.roundAttack=Math.trunc(n(unit.attack)*.7);
    unit.roundDefense=Math.trunc(n(unit.roundDefense)*.4);
    unit.roundQuick=Math.trunc(n(unit.quick)*.8);
    unit.counterEligibleThisTurn=false;
  }else if(meta?.f==='PETSKILL_2BattleTimid'){
    // 636 option「-攻%50+敏%30命%60」的 C parser：
    // -攻% 不是「再減 50%」寫法，而是 WORKATTACKPOWER = FIXSTR * 0.50；
    // +敏% 才是 FIXDEX + 30%。
    const attackRemain=Math.max(0,enemySkillNumber(meta.o,/-攻%([0-9.]+)/,100));
    const quickPlus=Math.max(0,enemySkillNumber(meta.o,/\+敏%([0-9.]+)/,0));
    unit.roundAttack=Math.trunc(n(unit.attack)*attackRemain/100);
    unit.roundQuick=Math.trunc(n(unit.quick)+n(unit.quick)*quickPlus/100);
    unit.counterEligibleThisTurn=false;
  }else if(meta?.f==='PETSKILL_BecomeFox'||meta?.f==='PETSKILL_BecomePig'){
    // BecomeFox / BecomePig 都在 battle.c 的一般物理攻擊群組；
    // 真正 BATTLE_Attack 前會改回 BATTLE_COM_ATTACK，因此參與完整 Counter 鏈。
    unit.counterEligibleThisTurn=true;
  }else if(meta?.f==='PETSKILL_Firekill'){
    // 原 BATTLE_COM_S_FIREKILL 在進入 BATTLE_Attack_FIREKILL 前固定 WORKATTACKPOWER=FIXSTR*0.8；
    // 專用 case 做完物理＋火魔法後直接 break，不進普通 Counter loop。
    unit.roundAttack=Math.trunc(n(unit.attack)*.8);
    unit.counterEligibleThisTurn=false;
  }else if(meta?.f==='PETSKILL_Lighttakeed'){
    // 原 PETSKILL_Lighttakeed：攻=FIXSTR*0.7、防=FIXTOUGH*0.5；QUICK 修正已註解。
    unit.roundAttack=Math.trunc(n(unit.attack)*.7);
    unit.roundDefense=Math.trunc(n(unit.roundDefense)*.5);
    // battle.c 走 BATTLE_S_AttackDamage 特殊 case，沒有一般攻擊分支的 Counter loop。
    unit.counterEligibleThisTurn=false;
  }else if(meta?.f==='PETSKILL_ToothCrushe'){
    // PETSKILL_ToothCrushe 沒有生效中的攻防敏修正；註解區塊不執行。
    // battle.c 直接呼叫 BATTLE_S_AttackDamage 後 break，不進普通 Counter loop。
    unit.counterEligibleThisTurn=false;
  }else if(meta?.f==='PETSKILL_PowerBalance'){
    const attackPct=enemySignedSkillPercent(meta.o,'攻%');
    const defensePct=enemySignedSkillPercent(meta.o,'防%');
    const baseAttack=Math.trunc(n(unit.attack));
    const skillBaseDefense=Math.trunc(n(unit.roundDefense));
    unit.roundAttack=baseAttack+Math.trunc(baseAttack*attackPct/100);
    unit.roundDefense=skillBaseDefense+Math.trunc(skillBaseDefense*defensePct/100);
  }else if(meta?.f==='PETSKILL_NoGuard'){
    unit.noGuardThisTurn=true;
    unit.noGuardDuckBonus=Math.max(0,enemySignedSkillPercent(meta.o,'回避%'));
    unit.noGuardCounterBonus=Math.max(0,enemySignedSkillPercent(meta.o,'反击%'));
    // 此來源版 NoGuard 的「會心%」處理函式位於 #if 0，因此不生效。
    unit.counterEligibleThisTurn=true;
  }else if(meta?.f==='PETSKILL_StatusChange'||meta?.f==='PETSKILL_FallGround'||meta?.f==='PETSKILL_Guardian'||meta?.f==='PETSKILL_WildViolentAttack'||meta?.f==='PETSKILL_Regret'){
    const attackPct=enemySignedSkillPercent(meta.o,'攻%');
    const defensePct=enemySignedSkillPercent(meta.o,'防%');
    const baseAttack=Math.trunc(n(unit.attack));
    const skillBaseDefense=Math.trunc(n(unit.roundDefense));
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
      // 原 BATTLE_Counter 只接受 ATTACK / NOGUARD；GUARDIAN_ATTACK 本身不能反反擊。
      unit.counterEligibleThisTurn=false;
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
  const levels=[Math.max(1,Math.trunc(n(state.level)))];
  const pet=activePet();
  if(pet&&petIsBattleActive(pet))levels.push(Math.max(1,Math.trunc(n(pet.level))));
  const avgLevel=levels.length?levels.reduce((a,b)=>a+b,0)/levels.length:0;

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
  return {esc,luck,escapeCnt,avgLevel};
}
function finishEnemyEscape(unit){
  if(!enemy||!unit)return {battleEnded:false};
  releaseEnemyRuntimeItems(unit);
  if(Array.isArray(enemy.units)){
    enemy.units=enemy.units.filter(u=>u.id!==unit.id);
    if(enemy.units.length===0){
      state.wins++;
      addLog('敵方全數逃離，戰鬥結束；沒有擊殺 EXP 或掉落。','good');
      enemy=null;save();render();
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
  enemy=null;save();render();
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
      enemy=null;resetBattleStatuses();save();render();
      return {battleEnded:true,noReward:true};
    }
    syncEnemyTarget();
    return {battleEnded:false,noReward:true};
  }
  state.wins++;
  addLog(unit.name+' 因'+reason+'離場，戰鬥結束；沒有擊殺 EXP 或掉落。','good');
  enemy=null;resetBattleStatuses();save();render();
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
  const spec=enemyAiAttackSpec(unit);
  const all=[];
  if(state.hp>0)all.push(battleTargetSnapshot('player'));
  const pet=activePet();
  if(pet&&petIsBattleActive(pet))all.push(battleTargetSnapshot('pet',pet));
  if(!all.length)return null;

  let candidates;
  if(spec.targetType===2)candidates=all.filter(x=>x.kind==='player');
  else if(spec.targetType===3)candidates=all.filter(x=>x.kind==='pet');
  else if(spec.targetType===4){
    // 單人放置版只有玩家是 party leader；原碼另有 1/3 機率把非 leader 加進候選。
    candidates=all.filter(x=>x.kind==='player');
    for(const x of all)if(x.kind!=='player'&&cRand(0,2)===0)candidates.push(x);
  }else candidates=all.slice();
  if(!candidates.length)candidates=all.slice();

  if(spec.selectMode===1||candidates.length===1){
    return candidates[cRand(0,candidates.length-1)];
  }

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

  // _ENEMY_ATTACK_AI：HP/STR/DEX/屬性選擇仍依 rn 有機率改成隨機目標。
  if(cRand(0,spec.rn)===0)return candidates[cRand(0,candidates.length-1)];
  return selected;
}
function enemyActorTarget(actor,unit){
  if(actor?.targetKind==='pet'){
    const pet=state.petBox.find(p=>p.id===actor.targetPetId);
    if(pet&&petIsBattleActive(pet))return battleTargetSnapshot('pet',pet);
  }else if(actor?.targetKind==='player'&&state.hp>0){
    return battleTargetSnapshot('player');
  }
  return enemyChooseTarget(unit);
}
function battleDuckChance(attacker,defender){
  let atDex=n(attacker?.quick),dfDex=n(defender?.quick);
  const dfLuck=defender?.type==='player'?n(defender?.luck):0;
  if(attacker?.type==='enemy'&&defender?.type==='pet')atDex*=.8;
  else if(attacker?.type!=='enemy'&&defender?.type==='pet')dfDex*=.8;
  else if(attacker?.type!=='player'&&defender?.type==='player')atDex*=.6;
  else if(attacker?.type==='player'&&defender?.type!=='player')dfDex*=.6;
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
  let atDex=n(attacker?.quick),dfDex=n(defender?.quick),root=true,div=.09;
  const atLuck=attacker?.type==='player'?n(attacker?.luck):0;
  if(attacker?.type==='pet'&&defender?.type==='enemy')dfDex*=.8;
  else if(attacker?.type==='enemy'&&defender?.type==='pet'){div=10;root=false}
  else if(attacker?.type!=='player'&&defender?.type==='player'){div=10;root=false}
  else if(attacker?.type==='player'&&defender?.type!=='player')dfDex*=.6;
  let big,small,wari;
  if(atDex>=dfDex){big=atDex;small=dfDex;wari=1}
  else{big=dfDex;small=atDex;wari=big<=0?0:small/big}
  let work=(big-small)/div;if(work<=0)work=0;
  let per=(root?Math.sqrt(work):work)*wari+atLuck;
  per*=100;
  if(per<0)per=1;
  if(per>10000)per=10000;
  return Math.trunc(per);
}
function battleDamageCore(attacker,defender,options={}){
  let attack=n(attacker?.attack);
  let defense=options.useFixedToughDefense?n(defender?.fixedTough):n(defender?.defense)*.70;

  // 原 BATTLE_DamageCalc：鐵壁在 NPCENEMY_ADDPOWER 之前生效。
  // defense += defense * ((CHAR_OTHERSTATUSNUMS + rand()%20) / 100)
  let superWallRoll=null;
  if(n(defender?.superWallPower)>0){
    superWallRoll=cRand(0,19);
    defense+=defense*(n(defender.superWallPower)+superWallRoll)/100;
  }

  if(defender?.type==='enemy')defense+=(defense*Math.floor(Math.random()*10)+2)/100;
  if(attacker?.type==='enemy')attack+=(attack*Math.floor(Math.random()*10)+2)/100;
  let damage=0;
  if(defense<=attack&&attack<defense*8/7){
    damage=cRand(0,attack/16);
  }else if(defense>attack){
    damage=cRand(0,1);
  }else if(attack>=defense*8/7){
    const k0=cRand(0,attack/8)-attack/16;
    damage=Math.trunc((attack-defense)*2+k0);
  }
  damage=Math.trunc(damage*battleAttrMultiplier(attacker,defender));
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
function resolveNormalAttack(attacker,defender,options={}){
  const guarding=!!options.guarding;
  const disableDodge=guarding||!!options.disableDodge;
  if(!disableDodge&&defender?.canMove!==false&&n(defender?.skillDuckPower)>0){
    const power=Math.trunc(n(defender.skillDuckPower));
    const roll=cRand(0,99);
    if(roll<=power){
      return {damage:0,dodged:true,critical:false,miss:false,guarded:guarding,skillDuck:true,skillDuckPower:power,skillDuckRoll:roll};
    }
  }
  let duck=disableDodge?0:battleDuckChance(attacker,defender);
  if(!disableDodge&&attacker?.drunk)duck=clamp(duck+cRand(20,30)*100,1,7500);
  if(!disableDodge){
    const bonus=n(options.duckBonusPercent)+n(defender?.duckBonus);
    if(bonus!==0)duck=clamp(duck+bonus*100,1,7500);
  }
  // 原 BATTLE_DuckCheck：防禦中直接 return FALSE，不進閃避判定。
  if(!disableDodge&&cRand(1,10000)<=duck)return {damage:0,dodged:true,critical:false,miss:false,guarded:guarding,duckRaw:duck};

  const baseCriticalRaw=battleCriticalChance(attacker,defender);
  const criticalChanceMultiplier=Number.isFinite(Number(options.criticalChanceMultiplier))
    ?Number(options.criticalChanceMultiplier):1;
  // 原 DamageToHp2 是在 BATTLE_CriticalCheck() 已完成 10000 上限後，再把 perCri ×1.3；
  // 因此這裡不重新 cap，保留 >10000 時必定會心的來源行為。
  const criticalRaw=baseCriticalRaw*criticalChanceMultiplier;
  const critical=cRand(1,10000)<criticalRaw;
  let damage=battleDamageCore(attacker,defender,options);
  if(critical){
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
function battleCounterChance(attacker,defender){
  let atDex=n(attacker?.quick),dfDex=n(defender?.quick),root=true,div=.08;
  if(attacker?.type==='enemy'&&defender?.type==='pet'){
    div=10;root=false;
  }else if(attacker?.type==='pet'&&defender?.type==='enemy'){
    dfDex*=.8;
  }else if(attacker?.type!=='player'&&defender?.type==='player'){
    div=10;root=false;
  }else if(attacker?.type==='player'&&defender?.type!=='player'){
    dfDex*=.6;
  }

  let big,small,wari;
  if(atDex>=dfDex){big=atDex;small=dfDex;wari=1}
  else{big=dfDex;small=atDex;wari=big<=0?0:small/big}

  let work=(big-small)/div;
  if(work<=0)work=0;
  let per=(root?Math.sqrt(work):work)*wari;

  // 無裝備時 Player 視為 FIST vs FIST，CounterTbl=10，
  // 所以 CriPer*10*0.1 仍等於 CriPer，再加玩家 Luck。
  if(attacker?.type==='player'){
    per+=n(attacker?.luck);
  }else{
    per+=n(attacker?.counterBonus);
    if(per>100)per=100;
  }
  return per;
}
function battleCounterCheck(attacker,defender){
  const raw=battleCounterChance(attacker,defender);
  if(attacker?.type==='player'){
    if(raw<=0)return {success:false,raw:0};
    return {success:cRand(1,10000)<raw*100,raw};
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
function battleApplyPhysicalHit(attackerDesc,targetDesc,r,{counter=false,confusion=false}={}){
  const attackerName=battleStatusDescName(attackerDesc);
  const targetName=battleStatusDescName(targetDesc);
  const action=counter?'反擊':(confusion?'因混亂攻擊':'攻擊');
  if(r.dodged){
    addLog(targetName+' 閃避了 '+attackerName+' 的'+action+'。',targetDesc?.kind==='player'?'good':'');
    return;
  }
  if(r.miss){
    addLog(attackerName+' '+action+' '+targetName+'，但沒有造成傷害。');
    return;
  }

  const before=battleStatusHp(targetDesc);
  battleStatusSetHp(targetDesc,before-r.damage);
  battleStatusWakeOnDamage(targetDesc,r.damage);
  const after=battleStatusHp(targetDesc);
  addLog(attackerName+' '+action+' '+targetName+(r.critical?'，會心一擊 ':'，造成 ')+r.damage+' 傷害。',after<=0?'bad':(attackerDesc?.kind==='pet'?'pet':''));
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
  if(primaryResult?.critical||primaryResult?.guarded||primaryResult?.guardian)return;

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
        unit.hp=Math.max(0,unit.hp-r.damage);
        addLog('你反擊 '+unit.name+(r.critical?'，會心一擊 ':'，造成 ')+r.damage+' 傷害。',r.critical?'good':'');
      }
    }else{
      if(r.dodged){
        addLog('你閃避了 '+unit.name+' 的反擊。','good');
      }else if(r.miss){
        addLog(unit.name+' 的反擊沒有造成傷害。');
      }else{
        state.hp=Math.max(0,state.hp-r.damage);
        addLog(unit.name+(r.critical?' 反擊會心 ':' 反擊 ')+r.damage+'。',state.hp<=0?'bad':'');
      }
    }

    if(enemy)syncEnemyTarget();
    if(state.hp<=0||unit.hp<=0)break;
    if(r.miss||r.critical)break;

    const next=counterer;
    counterer=target;
    target=next;
  }
}
function resolvePetEnemyCounterChain(primaryAttackerKind,pet,unit,primaryResult){
  if(!pet||!unit||!enemy||!petIsBattleActive(pet)||unit.hp<=0)return;
  if(primaryResult?.critical||primaryResult?.guarded||primaryResult?.guardian)return;

  let counterer=primaryAttackerKind==='enemy'?'pet':'enemy';
  let target=primaryAttackerKind==='enemy'?'enemy':'pet';
  for(let depth=0;depth<5;depth++){
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
      if(r.dodged){
        addLog(unit.name+' 閃避了 '+pet.name+' 的反擊。','pet');
      }else if(r.miss){
        addLog(pet.name+' 的反擊沒有造成傷害。','pet');
      }else{
        unit.hp=Math.max(0,unit.hp-r.damage);
        addLog(pet.name+' 反擊 '+unit.name+(r.critical?'，會心一擊 ':'，造成 ')+r.damage+' 傷害。','pet');
      }
    }else{
      if(r.dodged){
        addLog(pet.name+' 閃避了 '+unit.name+' 的反擊。','pet');
      }else if(r.miss){
        addLog(unit.name+' 對 '+pet.name+' 的反擊沒有造成傷害。');
      }else{
        const before=n(pet.hp);
        pet.hp=Math.max(0,before-r.damage);
        addLog(unit.name+(r.critical?' 反擊會心 ':' 反擊 ')+pet.name+'，造成 '+r.damage+' 傷害。',pet.hp<=0?'bad':'');
        if(before>0&&pet.hp<=0)addLog(pet.name+' 倒下了，本場後續回合不再行動。','bad');
      }
    }

    if(enemy)syncEnemyTarget();
    if(!petIsBattleActive(pet)||unit.hp<=0)break;
    if(r.miss||r.critical)break;

    const next=counterer;
    counterer=target;
    target=next;
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
  let duck=disableDodge?0:battleDuckChance(attacker,originalView);
  if(!disableDodge&&attacker?.drunk)duck=clamp(duck+cRand(20,30)*100,1,7500);
  if(!disableDodge){
    const bonus=n(options.duckBonusPercent)+n(originalView?.duckBonus);
    if(bonus!==0)duck=clamp(duck+bonus*100,1,7500);
    if(cRand(1,10000)<=duck){
      return {
        damage:0,dodged:true,critical:false,miss:false,guarded:originalGuarding,
        duckRaw:duck,actualTarget:target,originalTarget:target
      };
    }
  }

  // 原 BATTLE_AttackSeq：先讓原目標做 DuckCheck，成功命中後才 GuardianCheck。
  // Guardian 接手後用 Guardian 自身防禦／會心／屬性結算，且不再做第二次閃避。
  const guardian=enemyGuardianFor(target,options.attackerUnit||null);
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
function applyFriendlyEnemyHit(attackerKind,attackerName,target,r){
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

  const before=n(actual.hp);
  actual.hp=Math.max(0,before-r.damage);
  battleStatusWakeOnDamage({kind:'enemy',unit:actual,unitId:actual.id},r.damage);
  if(r.guardian){
    addLog(actual.name+' 發動忠犬護住 '+target.name+'，代受 '+r.damage+' 傷害'+(r.critical?'（會心）':'')+'。',actual.hp<=0?'bad':style);
  }else if(attackerKind==='pet'){
    addLog(attackerName+' 攻擊 '+actual.name+(r.critical?'，會心一擊 ':'，造成 ')+r.damage+' 傷害。','pet');
  }else{
    addLog('你對 '+actual.name+(r.critical?' 發動會心一擊，造成 ':' 造成 ')+r.damage+' 傷害。',r.critical?'good':'');
  }
  if(before>0&&actual.hp<=0)addLog(actual.name+' 倒下了，本場後續回合不再行動。','bad');
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
function enemyAttackResult(unit=targetEnemyUnit(),options={}){
  return resolveNormalAttack(enemyBattleView(unit),playerBattleView(),options);
}
function enemyAttackPetResult(unit,pet,options={}){
  return resolveNormalAttack(enemyBattleView(unit),petBattleView(pet),options);
}
function performEnemyPrimaryAttack(actor,unit,options={}){
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
      battleStatusWakeOnDamage({kind:'pet',pet,petId:pet.id},r.damage);
      addLog(unit.name+(r.critical?' 會心一擊 ':' 攻擊 ')+pet.name+'，造成 '+r.damage+' 傷害。',pet.hp<=0?'bad':'');
      if(before>0&&pet.hp<=0)addLog(pet.name+' 倒下了，本場後續回合不再行動。','bad');
    }
    if(petIsBattleActive(pet)&&unit.hp>0)resolvePetEnemyCounterChain('enemy',pet,unit,r);
    return {target:'pet',pet,r};
  }

  const r=enemyAttackResult(unit,Object.assign({},attackOptions,{guarding:playerGuarding}));
  if(playerGuarding){
    if(r.damage<=0)addLog('你防住了 '+unit.name+' 的攻擊，沒有受到傷害。','good');
    else{
      state.hp=Math.max(0,state.hp-r.damage);
      addLog('防禦中：'+unit.name+(r.critical?' 會心一擊 ':' 攻擊 ')+r.damage+'。',state.hp<=0?'bad':'');
    }
  }else if(r.dodged){
    addLog('你閃避了 '+unit.name+' 的攻擊。','good');
  }else if(r.miss){
    addLog(unit.name+' 的攻擊沒有造成傷害。');
  }else{
    state.hp=Math.max(0,state.hp-r.damage);
    battleStatusWakeOnDamage({kind:'player'},r.damage);
    addLog(unit.name+(r.critical?' 會心一擊 ':' 攻擊 ')+r.damage+'。',state.hp<=0?'bad':'');
  }
  if(allowPlayerCounter&&state.hp>0&&unit.hp>0)resolvePlayerEnemyCounterChain('enemy',unit,r);
  return {target:'player',r};
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
      battleStatusWakeOnDamage({kind:'pet',pet,petId:pet.id},r.damage);
      addLog(unit.name+' 的'+label+(r.critical?'會心 ':'')+'命中 '+pet.name+'，造成 '+r.damage+' 傷害。',pet.hp<=0?'bad':'');
      if(before>0&&pet.hp<=0)addLog(pet.name+' 倒下了，本場後續回合不再行動。','bad');
    }
    return;
  }

  if(r.dodged){
    addLog('你閃避了 '+unit.name+' 的'+label+'。','good');
  }else if(r.miss){
    addLog(unit.name+' 的'+label+'沒有造成傷害。');
  }else{
    state.hp=Math.max(0,state.hp-r.damage);
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
  const chosen=enemyActorTarget(actor,unit);
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

  unit.roundAttack=Math.trunc(n(unit.attack))+Math.trunc(n(unit.attack)*n(charge.attackPct)/100);
  unit.counterEligibleThisTurn=false;
  const releaseActor=Object.assign({},actor,{
    targetKind:charge.targetKind,
    targetPetId:charge.targetPetId
  });
  addLog(unit.name+' 釋放 '+charge.label+'（攻擊 +'+charge.attackPct+'%）。');
  const result=performEnemyPrimaryAttack(releaseActor,unit,options)||{};
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

  const sequence=[];
  if(spec.objectNum>=initial.length){
    for(const t of initial)sequence.push(t);
    while(sequence.length<spec.objectNum)sequence.push(initial[cRand(0,initial.length-1)]);
  }else{
    for(let i=0;i<spec.objectNum&&i<initial.length;i++)sequence.push(initial[i]);
    if(spec.coverAll)for(let i=spec.objectNum;i<initial.length;i++)sequence.push(initial[i]);
  }

  addLog(unit.name+' 使用 '+label+'：'+sequence.length+' 個物理攻擊物件'+(spec.statusType?'，每擊可附加'+BATTLE_STATUS_NAMES[spec.statusType]:'')+'。');
  const results=[];
  let playerGuardingActive=!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
  for(let i=0;i<sequence.length;i++){
    const target=sequence[i];
    if(!battleStatusDescAlive(target)){
      results.push({target:target.kind,skippedDead:true});
      continue;
    }
    let r;
    if(target.kind==='pet'&&target.pet){
      r=enemyAttackPetResult(unit,target.pet);
    }else{
      r=enemyAttackResult(unit,{guarding:playerGuardingActive});
    }
    enemyApplySkillHit(unit,target,r,label+'分身 '+(i+1)+'/'+sequence.length);

    let status=null;
    if(spec.statusType&&r.damage>0&&battleStatusDescAlive(target)){
      const check=battleStatusChance(
        {kind:'enemy',unit,unitId:unit.id},target,spec.statusType,
        {perOffset:spec.effectHit,range:30,bai:1,forceGeneral:true}
      );
      if(check.allowed&&check.success&&battleStatusApplyRaw(target,spec.statusType,spec.turns)){
        status={applied:true,type:spec.statusType,per:check.per,turns:spec.turns};
        // 原 BATTLE_BattleModel_ATTACK 在石化／魔障成功時會立即把該目標 COM1 清成 NONE。
        // 同一個 5-hit 模組後續再次命中 Player 時，不能繼續沿用本回合 Guard。
        if(target.kind==='player'&&(spec.statusType==='stone'||spec.statusType==='barrier'))playerGuardingActive=false;
        addLog(battleStatusDescName(target)+' 陷入'+BATTLE_STATUS_NAMES[spec.statusType]+'（BattleModel 原檢定 '+check.per.toFixed(1)+'%）。','bad');
      }else{
        status={applied:false,type:spec.statusType,per:check.per,reason:check.reason||'roll'};
      }
    }
    results.push({target:target.kind,r,status});
  }

  // 原 BATTLE_COM_S_BATTLE_MODEL 直接呼叫 BATTLE_BattleModel() 後 break；每個 AttackObject
  // 雖各自跑 AttackSeq / DamageSub，但整個 command 不進 battle.c 的普通 Counter loop。
  return {kind:'skill',skillId:actor.skillId,spec,results};
}
function enemyPlayerSideLivingTargets(){
  const list=[];
  if(state.hp>0)list.push({kind:'player'});
  const pet=activePet();
  if(pet&&petIsBattleActive(pet))list.push({kind:'pet',pet,petId:pet.id});
  return list;
}
function enemySkillTargetResult(unit,chosen,options={},attackerOverride=null){
  const attacker=Object.assign({},enemyBattleView(unit),attackerOverride||{});
  if(chosen?.kind==='pet'&&chosen.pet&&petIsBattleActive(chosen.pet)){
    return resolveNormalAttack(attacker,petBattleView(chosen.pet),options);
  }
  if(chosen?.kind==='player'&&state.hp>0){
    const guarding=Object.prototype.hasOwnProperty.call(options,'guarding')
      ?!!options.guarding
      :false;
    return resolveNormalAttack(attacker,playerBattleView(),Object.assign({},options,{guarding}));
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
  const r=enemySkillTargetResult(unit,chosen,{guarding});
  if(!r)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  let attr=0,bonusRoll=0,bonus=0;
  if(r.damage>0&&spec.key){
    const targetElements=normalizedElements(battleElementsForDesc(
      chosen.kind==='pet'?{kind:'pet',pet:chosen.pet,petId:chosen.pet?.id}:{kind:'player'}
    ));
    attr=Math.max(0,Math.trunc(n(targetElements?.[spec.key])));
    if(attr>0){
      // 原 BATTLE_S_Modifyattack：
      // def = option/100 + (rand()%(targetAttr+5))/100;
      // damage += damage*def；damage 是 int，最後以 C 整數規則截斷。
      bonusRoll=cRand(0,attr+4);
      const factor=n(spec.amount)/100+bonusRoll/100;
      const before=Math.trunc(n(r.damage));
      r.damage=Math.trunc(before+before*factor);
      bonus=r.damage-before;
    }
  }

  enemyApplySkillHit(unit,chosen,r,meta?.n||'屬性強化攻擊');
  return {kind:'skill',skillId:actor.skillId,target:chosen.kind,r,spec,targetAttr:attr,bonusRoll,bonus};
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
  const r=enemySkillTargetResult(unit,chosen,{guarding},{elements});
  if(!r)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  enemyApplySkillHit(unit,chosen,r,meta?.n||'屬性轉換攻擊');
  return {kind:'skill',skillId:actor.skillId,target:chosen.kind,r,spec};
}
function performEnemySonic(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  const label=meta?.n||'音波衝擊';
  const results=[];

  const firstGuarding=chosen.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
  const first=enemySkillTargetResult(unit,chosen,{guarding:firstGuarding});
  if(first){
    enemyApplySkillHit(unit,chosen,first,label);
    results.push({target:chosen.kind,r:first});
  }

  // 原 battle.c 只有目標是 5..9 / 15..19 的寵物格時才 defNo-5 貫穿主人；
  // SONIC2 在 AttackSeq 內先把傷害 ×0.5，之後才做 GuardAdjust。
  if(chosen.kind==='pet'&&state.hp>0){
    const owner={kind:'player'};
    const guarding=!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
    const second=enemySkillTargetResult(unit,owner,{guarding,preGuardDamageMultiplier:.5});
    if(second){
      enemyApplySkillHit(unit,owner,second,label+'貫穿');
      results.push({target:'player',r:second,through:true});
    }
  }
  return {kind:'skill',skillId:actor.skillId,results};
}
function performEnemyGyrate(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  const attackPct=enemySignedSkillPercent(meta?.o,'攻%');
  const baseAttack=Math.trunc(n(unit.attack));
  const attack=baseAttack+Math.trunc(baseAttack*attackPct/100);
  const label=meta?.n||'回旋攻擊';

  // 原版玩家在 0..4、寵物在 5..9；Gyrate 只掃目標所在的五格橫排。
  // 目前單機 battle side 只有一名 Player + 一隻 Active Pet，因此每排最多一個可打單位。
  const targets=enemyPlayerSideLivingTargets().filter(t=>t.kind===chosen.kind);
  const results=[];
  addLog(unit.name+' 使用 '+label+'（攻 '+(attackPct>=0?'+':'')+attackPct+'%，攻擊目標所在一排）。');
  for(const target of targets){
    const guarding=target.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
    const r=enemySkillTargetResult(unit,target,{guarding},{attack});
    if(!r)continue;
    enemyApplySkillHit(unit,target,r,label);
    results.push({target:target.kind,r});
  }
  return {kind:'skill',skillId:actor.skillId,attackPct,results};
}
function performEnemyRetrace(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  const label=meta?.n||'追跡攻擊';
  const guarding=chosen.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');

  unit.counterEligibleThisTurn=true;
  const first=enemySkillTargetResult(unit,chosen,{guarding});
  if(!first)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  enemyApplySkillHit(unit,chosen,first,label+'首擊');

  let second=null,retraceRoll=null;
  const targetStillAlive=chosen.kind==='pet'
    ?!!chosen.pet&&petIsBattleActive(chosen.pet)
    :state.hp>0;
  if(first.dodged&&targetStillAlive){
    retraceRoll=cRand(1,100);
    // 原碼是 RAND(1,100) < 80，所以實際成功值 1..79。
    if(retraceRoll<80){
      const baseAttack=Math.trunc(n(unit.attack));
      const attack=baseAttack+Math.trunc(baseAttack*.2);
      second=enemySkillTargetResult(unit,chosen,{guarding},{attack});
      if(second)enemyApplySkillHit(unit,chosen,second,label+'追擊');
    }
  }

  // 原 battle.c 第二發 BATTLE_Attack() 的回傳值沒有覆寫 ContFlg；
  // 後面的 Counter loop 仍使用第一發結果。技能進 common direct-attack 路徑後 command 已轉 ATTACK。
  const aliveAfter=chosen.kind==='pet'
    ?!!chosen.pet&&petIsBattleActive(chosen.pet)
    :state.hp>0;
  if(aliveAfter&&unit.hp>0&&enemy){
    if(chosen.kind==='pet'&&chosen.pet){
      resolvePetEnemyCounterChain('enemy',chosen.pet,unit,first);
    }else if(chosen.kind==='player'&&options.allowPlayerCounter){
      resolvePlayerEnemyCounterChain('enemy',unit,first);
    }
  }
  return {kind:'skill',skillId:actor.skillId,target:chosen.kind,first,second,retraceRoll};
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
    if(applied)addLog(battleStatusDescName(target)+' 陷入虛弱，攻／防／敏下降 20%（原檢定 '+check.per.toFixed(1)+'%）。','bad');
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
    battleStatusWakeOnDamage(target,damage);
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
  unit.counterEligibleThisTurn=true;
  addLog(unit.name+' 使用 '+label+'：攻 80%／防 70%，隨機攻擊 '+count+' 次。');

  let lastTarget=null,lastResult=null,hits=0;
  for(let i=0;i<count;i++){
    if(!enemy||unit.hp<=0||state.hp<=0)break;
    const target=enemyRandomPlayerSideTarget();
    if(!target)break;
    let r;
    if(target.kind==='pet'&&target.pet){
      r=enemyAttackPetResult(unit,target.pet);
    }else{
      const guarding=!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
      r=enemyAttackResult(unit,{guarding});
    }
    hits++;lastTarget=target;lastResult=r;
    enemyApplySkillHit(unit,target,r,label+'第 '+hits+'/'+count+' 擊');
  }

  // ATTCRAZED 位於原 direct-attack 群組；全部攻擊後只以最後一擊的 defNo / ContFlg 進普通反擊鏈。
  if(lastTarget&&lastResult&&unit.hp>0&&enemy){
    if(lastTarget.kind==='pet'&&lastTarget.pet&&petIsBattleActive(lastTarget.pet)){
      resolvePetEnemyCounterChain('enemy',lastTarget.pet,unit,lastResult);
    }else if(lastTarget.kind==='player'&&state.hp>0&&options.allowPlayerCounter&&!options.playerGuarding){
      resolvePlayerEnemyCounterChain('enemy',unit,lastResult);
    }
  }
  return {kind:'skill',skillId:actor.skillId,hits,attackCount:count,lastTarget:lastTarget?.kind||null,lastResult};
}
function performEnemySpeedyAttack(actor,unit,options,meta){
  const defensePct=enemySignedSkillPercent(meta?.o,'防%');
  addLog(unit.name+' 使用 '+(meta?.n||'疾速攻擊')+'（防 '+defensePct+'%；原來源未套用 option 內的敏捷增加）。');
  unit.counterEligibleThisTurn=true;
  return Object.assign({kind:'skill',skillId:actor.skillId},performEnemyPrimaryAttack(actor,unit,options)||{});
}
function enemySkillTargetDesc(chosen){
  if(chosen?.kind==='pet'&&chosen.pet)return {kind:'pet',pet:chosen.pet,petId:chosen.pet.id};
  if(chosen?.kind==='player')return {kind:'player'};
  return null;
}
function enemyTryRegretDizzy(chosen,successPct,label){
  const desc=enemySkillTargetDesc(chosen);
  if(!desc||!battleStatusDescAlive(desc)||battleStatusGet(desc))return false;
  if(cRand(1,100)>=successPct)return false;
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

  let r;
  if(chosen.kind==='pet'&&chosen.pet){
    r=enemyAttackPetResult(unit,chosen.pet);
  }else{
    const guarding=!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
    r=enemyAttackResult(unit,{guarding});
  }

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
      r=enemyAttackResult(unit,Object.assign({},attackOpts,{
        guarding,preGuardDamageMultiplier:secondary?.8:1
      }));
    }else return null;
    enemyApplySkillHit(unit,target,r,label+(secondary?'貫穿段':''));
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
  const count=cRand(3,10);
  const label=meta?.n||'狂暴攻擊';
  unit.counterEligibleThisTurn=true;
  addLog(unit.name+' 使用 '+label+'：隨機 '+count+' 段，單段傷害 ÷'+count+'，目標回避 +'+duckBonus+'。');

  let chosen=enemyActorTarget(actor,unit);
  let lastResult=null,lastChosen=null,hits=0;
  for(let i=0;i<count;i++){
    if(!enemy||unit.hp<=0||state.hp<=0)break;
    if(!chosen
      ||(chosen.kind==='pet'&&(!chosen.pet||!petIsBattleActive(chosen.pet)))
      ||(chosen.kind==='player'&&state.hp<=0)){
      chosen=enemyActorTarget(actor,unit);
    }
    if(!chosen)break;

    let r;
    if(chosen.kind==='pet'&&chosen.pet){
      r=enemyAttackPetResult(unit,chosen.pet,{damageDivisor:count,duckBonusPercent:duckBonus});
    }else{
      const guarding=!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
      r=enemyAttackResult(unit,{guarding,damageDivisor:count,duckBonusPercent:duckBonus});
    }
    hits++;
    lastResult=r;lastChosen=chosen;
    enemyApplySkillHit(unit,chosen,r,label+'第 '+hits+'/'+count+' 段');

    if(state.hp<=0)break;
    if(chosen.kind==='pet'&&chosen.pet&&!petIsBattleActive(chosen.pet))chosen=null;
  }

  // 原 battle.c 完成所有多段攻擊後，才以最後一次 BATTLE_Attack 的 ContFlg 進反擊鏈。
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
  const preGuardDamageMultiplier=guarding?1.3:.7;
  unit.counterEligibleThisTurn=false;

  let r;
  if(chosen.kind==='pet'&&chosen.pet){
    r=enemyAttackPetResult(unit,chosen.pet,{preGuardDamageMultiplier});
  }else{
    r=enemyAttackResult(unit,{guarding,preGuardDamageMultiplier});
  }
  enemyApplySkillHit(unit,chosen,r,label+(guarding?'（防禦目標 ×1.3）':'（非防禦目標 ×0.7）'));

  // BATTLE_COM_S_GBREAK2 是獨立特殊分支；BATTLE_S_GBreak2 回傳後直接 break，不進普通 Counter loop。
  return {kind:'skill',skillId:actor.skillId,target:chosen.kind,r,guarding,preGuardDamageMultiplier};
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
  const r=enemySkillTargetResult(unit,chosen,{guarding});
  if(!r)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  enemyApplySkillHit(unit,chosen,r,label);

  let timidRoll=null,forced=false,playerExited=false;
  if(r.damage>1){
    timidRoll=cRand(0,99);
    // 原 BATTLE_S_AttackDamage：rand()%100 < 15。
    if(timidRoll<15){
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
  const r=enemySkillTargetResult(unit,chosen,{guarding});
  if(!r)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  enemyApplySkillHit(unit,chosen,r,label);

  const timid=Math.max(0,Math.trunc(enemySkillNumber(meta?.o,/命%([0-9.]+)/,0)));
  let timidRoll=null,recalled=false;
  if(r.damage>1){
    timidRoll=cRand(0,99);
    // 原 BATTLE_COM_S_2TIMID：成功判定後只有 CHAR_TYPEPET 分支有實際處理；
    // 玩家目標即使命中 roll 成功也不會 BATTLE_Exit。
    if(timidRoll<timid&&chosen.kind==='pet'&&chosen.pet){
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
  const r=enemySkillTargetResult(unit,chosen,{guarding});
  if(!r)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  enemyApplySkillHit(unit,chosen,r,label);

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
  const r=enemySkillTargetResult(unit,chosen,{guarding});
  if(!r)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  enemyApplySkillHit(unit,chosen,r,label);

  // 原 BATTLE_S_ToothCrushe：
  // - 非 PLAYER 目標直接 return；
  // - PLAYER 也必須 BATTLE_ItemCrushCheck(defindex,1) 找到裝備才會改耐久；
  // 現版尚無玩家裝備／耐久系統，因此額外破壞分支不可達。
  const equipmentCrushReachable=false;
  addLog(unit.name+' 的 '+label+' 沒有可破壞裝備；依目前來源等價狀態只保留本次物理傷害。');

  return {
    kind:'skill',skillId:actor.skillId,target:chosen.kind,r,
    equipmentCrushReachable,crushed:false
  };
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
  const maxGold=1000000; // _FIX_MAX_GOLD 已開；單機角色轉生數目前為 0 => 1,000,000。
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
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  const match=String(meta?.o||'').match(/magic\s+(\d+)/i);
  const magicId=match?Number(match[1]):313;
  const itemMatch=String(meta?.o||'').match(/item\s+(\d+)/i);
  const itemIndex=itemMatch?Number(itemMatch[1]):-1;

  // Enemy 的 MAGIC_DirectUse 直接把 option itemnum 當 global ITEM_item[] existing index。
  // V0.68 minimal runtime 對 ITEM_CHECKINDEX 同時檢查範圍與 use；未配置 slot 回 -1。
  if(magicId===204||magicId===435){
    const mp=sourceItemRuntimeMagicUseMp(itemIndex);
    const mpBefore=Math.trunc(n(unit.mp));
    if(mp===null){
      const slot=sourceItemRuntimeSlot(itemIndex);
      addLog(unit.name+' 的 '+(meta?.n||('magic '+magicId))+' 讀到 ITEM_item['+itemIndex+'] 已被 Item '+(slot?.itemId??'未知')+' 佔用，但正式 itemset6 的 mu 尚未解碼；本次不猜 MP cost，也不套魔法效果。');
      return {kind:'skill',skillId:actor.skillId,magicId,itemIndex,mp:null,mpBefore,mpAfter:mpBefore,sourceItemMpUnknown:true,itemId:slot?.itemId??null};
    }
    if(mpBefore<mp){
      addLog(unit.name+' 的 '+(meta?.n||('magic '+magicId))+' 因 MP 不足失敗（需要 '+mp+'，目前 '+mpBefore+'）。');
      return {kind:'skill',skillId:actor.skillId,magicId,itemIndex,mp,mpBefore,mpAfter:mpBefore,mpFailed:true};
    }
    unit.mp=mpBefore-mp;

    if(magicId===204){
      const field=battleSetField('water',100,5);
      addLog(unit.name+' 使用水的精靈 Lv5：戰場變為水屬性 Power 100／5 回合；ITEM_item['+itemIndex+'] '+(mp<0?'未配置，原 ITEM_getInt 回 -1，因此 Enemy MP +1。':'MP cost '+mp+'。'),'bad');
      return {kind:'skill',skillId:actor.skillId,magicId,itemIndex,mp,mpBefore,mpAfter:unit.mp,effect:'fieldAttChange',field};
    }

    const target=chosen.kind==='pet'?{kind:'pet',pet:chosen.pet,petId:chosen.petId}:{kind:'player'};
    const attacker={kind:'enemy',unit,unitId:unit.id};
    const check=battleStatusChance(attacker,target,'weaken',{perOffset:50,range:30,bai:1,forceGeneral:true});
    let applied=false;
    if(check.allowed&&check.success)applied=battleStatusApply(target,'weaken',7); // source 寫 WORKWEAKEN=turn+1=8
    addLog(unit.name+' 使用癱瘓的精靈 Lv3：'+battleStatusDescName(target)+(applied?' 陷入虛弱 7 回合。':' 未中虛弱。')+'（原成功值 '+Number(check.per||0).toFixed(1)+'）',applied?'bad':'');
    return {kind:'skill',skillId:actor.skillId,magicId,itemIndex,mp,mpBefore,mpAfter:unit.mp,effect:'weaken',target:chosen.kind,petId:chosen.petId||null,check,applied,turn:7,storedTurn:applied?8:0};
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

  const attMagicLv=Math.trunc(n(unit.level)*.9);
  const trueRoll=cRand(0,99);
  const trueMagic=!(trueRoll>attMagicLv);
  const targets=enemyAttackMagicTargets(chosen,magic,pattern);
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
    attIdx:magic.attIdx,targetRewrite:magic.targetRewrite,attackType:pattern.attackType
  };
}
function performEnemyFirekill(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId,noTarget:true};
  const label=meta?.n||'火線獵殺';
  const guarding=chosen.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');

  // 原 battle.c：先以 FIXSTR*0.8 走 BATTLE_Attack_FIREKILL。
  // 該專用 case 不進普通 BATTLE_Counter loop；DamageReact 在 BATTLE_DamageSub_FIREKILL 內被強制 NONE。
  const physical=enemySkillTargetResult(unit,chosen,{guarding});
  if(physical)enemyApplySkillHit(unit,chosen,physical,label+'物理段');

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
  const r=enemySkillTargetResult(unit,chosen,{guarding});
  if(!r)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  enemyApplySkillHit(unit,chosen,r,label);
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
function performEnemyBecomePig(actor,unit,options,meta){
  // 原 battle.c：BECOMEPIG 先完成普通 BATTLE_Attack + Counter 鏈，
  // 再以該次攻擊結果判斷是否套黑烏力化。
  const result=performEnemyPrimaryAttack(actor,unit,options)||{};
  const parts=String(meta?.o||'').trim().split(/\s+/);
  const rate=Math.max(0,Math.trunc(Number(parts[0])||0));
  const seconds=Math.max(0,Math.trunc(Number(parts[1])||0));
  const imageNo=Math.trunc(Number(parts[2])||100388);

  let roll=null,applied=false,remaining=playerPigRemainingSeconds();
  if(result.target==='player'&&state.hp>0&&result.r&&!result.r.dodged&&!result.r.miss){
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
    pigRemainingSeconds:remaining
  },result);
}
function performEnemyBecomeFox(actor,unit,options,meta){
  // 原 BECOMEFOX 先做一發普通 BATTLE_Attack；變狐判定在攻擊／Counter 鏈之後。
  // 附加變狐要求：target != PLAYER 且 target CHAR_WORK_PETFLG != 0。
  // 玩家擁有寵物由 PET_createPetFromCharaIndex / PET_initCharOneArray 建立，
  // CHAR_getDefaultChar 將所有 workint 清 0，且來源只有 ENEMY_createEnemy 會設定 WORK_PETFLG。
  // 因此目前 Player + Active Pet 模型中，玩家必定因 type PLAYER 失敗，
  // 玩家寵物必定因 PETFLG=0 失敗；唯一來源效果就是普通攻擊。
  addLog(unit.name+' 使用 '+(meta?.n||'媚惑術')+'；來源玩家側不符合 PETFLG 變狐條件，本次依原碼執行普通物理攻擊。');
  return Object.assign(
    {kind:'skill',skillId:actor.skillId,transformEligible:false,sourcePetFlg:0},
    performEnemyPrimaryAttack(actor,unit,options)||{}
  );
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
  const baseAttack=Math.trunc(n(unit.attack));
  const attack=baseAttack+Math.trunc(baseAttack*.2);

  // 原 BATTLE_AttackSeq(DAMAGETOHP2)：
  // 1) 先以 FIXDEX 做正常會心率；
  // 2) perCri 再 ×1.3；
  // 3) WORKATTACKPOWER 改為 FIXSTR +20% 後才進 DamageCalc。
  // QUICK +20% 只屬於 BATTLE_DexCalc 的回合排序，並不改 CriticalCheck 使用的 FIXDEX。
  const guarding=chosen.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
  const r=enemySkillTargetResult(
    unit,chosen,
    {guarding,criticalChanceMultiplier:1.3},
    {attack}
  );
  if(!r)return {kind:'skill',skillId:actor.skillId,noTarget:true};

  enemyApplySkillHit(unit,chosen,r,meta?.n||'浴血狂襲');

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
  const baseAttack=Math.trunc(n(unit.attack));
  unit.roundAttack=baseAttack-Math.trunc(baseAttack*cIntegerDivision);
  unit.counterEligibleThisTurn=false;

  let r;
  if(chosen.kind==='pet'&&chosen.pet&&petIsBattleActive(chosen.pet)){
    r=enemyAttackPetResult(unit,chosen.pet);
  }else{
    const guarding=!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');
    r=enemyAttackResult(unit,{guarding});
  }
  enemyApplySkillHit(unit,chosen,r,meta?.n||'嗜血技');

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
  const tempNo=Number(pet?.tempNo);
  if(!Number.isFinite(tempNo))return null;
  const raw=petModAiDb?.byTempNo?.[String(tempNo)];
  const modAi=Number(raw);
  return Number.isFinite(modAi)?modAi:null;
}
function petFixedAi(pet){
  if(!pet||!state)return null;
  const sourceModAi=petSourceModAi(pet);
  if(sourceModAi==null)return null;

  // CHAR_initcharWorkInt()：
  // modai<=0 時改 100；
  // ai=((hostLV*WORKFIXCHARM*1.10)/(petLV*modai))*100，指定給 int 時截斷；
  // 然後 cap 100，再加 VARIABLEAI*0.01，最後再 clamp 0..100。
  // 本 web 尚無轉生系統；捕獲／任務寵也沒有 VariableAI 改寫，等價來源初值 0。
  const modAi=sourceModAi<=0?100:sourceModAi;
  const hostLv=Math.max(1,Math.trunc(n(state.level)));
  const petLv=Math.max(1,Math.trunc(n(pet.level)));
  const fixCharm=n(state.charm);
  let ai=Math.trunc(((hostLv*fixCharm*1.10)/(petLv*modAi))*100);
  if(ai>100)ai=100;
  ai+=n(pet.variableAi)*.01;
  if(ai<0)ai=0;
  if(ai>100)ai=100;
  return {ai,modAi,sourceModAi,hostLv,petLv,fixCharm,variableAi:n(pet.variableAi)};
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
    fixAiInfo=petFixedAi(pet);
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
  if(owner&&owner.guardedByUnitId===unit.id){
    addLog(unit.name+' 使用 '+(meta?.n||'忠犬')+'，本回合保護 '+owner.name+' 並以攻擊修正後出手。');
  }else{
    addLog(unit.name+' 使用 '+(meta?.n||'忠犬')+'，但目前沒有對應的前排主人可保護。');
  }
  return Object.assign({kind:'skill',skillId:actor.skillId},performEnemyPrimaryAttack(actor,unit,options)||{});
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
    r=enemyAttackResult(unit,{guarding});
  }
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
  return {kind:'skill',skillId:actor.skillId,target:chosen.kind,r,fallRoll,fallSuccess};
}
function performEnemyEarthRoundStart(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
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
  const result=performEnemyPrimaryAttack(releaseActor,unit,Object.assign({},options,{
    attackOptions:Object.assign({},options.attackOptions||{}, {damageMultiplier:multiplier})
  }))||{};
  return Object.assign({kind:'earthround',released:true,multiplier},result);
}
function performEnemyGuardBreak(actor,unit,options,meta){
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId};
  const label=meta?.n||'破除防禦';
  const guarding=chosen.kind==='player'&&!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion');

  // 原 BATTLE_S_GBreak：目標不是 GUARD 時直接 damage=0；只有 GUARD 才真正攻擊，
  // 且 opt==GBREAK 會跳過 BATTLE_GuardAdjust。
  if(!guarding){
    addLog(unit.name+' 使用 '+label+'，但目標沒有防禦，技能沒有造成傷害。');
    return {kind:'skill',skillId:actor.skillId,guardBreakMiss:true};
  }

  const r=resolveNormalAttack(enemyBattleView(unit),playerBattleView(),{disableDodge:true});
  enemyApplySkillHit(unit,chosen,r,label);
  // BATTLE_S_GBreak 對 GUARD 最後會 iRet=FALSE，不接反擊鏈。
  return {kind:'skill',skillId:actor.skillId,target:'player',r};
}
function performEnemyStatusChange(actor,unit,options,meta){
  unit.counterEligibleThisTurn=true;
  const chosen=enemyActorTarget(actor,unit);
  if(!chosen)return {kind:'skill',skillId:actor.skillId};
  const type=battleStatusTypeFromOption(meta?.o);
  const turn=battleStatusTurnFromOption(meta?.o);
  const label=meta?.n||'狀態攻擊';

  let r;
  if(chosen.kind==='pet'&&chosen.pet){
    r=enemyAttackPetResult(unit,chosen.pet);
  }else{
    r=enemyAttackResult(unit,{guarding:!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion')});
  }
  enemyApplySkillHit(unit,chosen,r,label);

  const targetDesc=chosen.kind==='pet'
    ?{kind:'pet',pet:chosen.pet,petId:chosen.pet?.id}
    :{kind:'player'};
  if(r.damage>0){
    // 原 BATTLE_DamageWakeUp 先解除既有睡眠，之後才做本次 StatusChange 判定。
    battleStatusWakeOnDamage(targetDesc,r.damage);
    if(type==='poison'||type==='deepPoison'||type==='sleep'||type==='stone'||type==='confusion'||type==='drunk'){
      const check=battleStatusChance({kind:'enemy',unit,unitId:unit.id},targetDesc,type);
      if(check.allowed&&check.success&&battleStatusApply(targetDesc,type,turn)){
        addLog((chosen.kind==='pet'?chosen.pet.name:'你')+' 陷入'+BATTLE_STATUS_NAMES[type]+'（原檢定 '+check.per.toFixed(1)+'%）。','bad');
      }else{
        addLog(label+' 的'+BATTLE_STATUS_NAMES[type]+'效果未成功'+(check.reason==='existing'?'：目標已有其他異常狀態。':'（原檢定 '+n(check.per).toFixed(1)+'%）。'));
      }
    }else if(type){
      addLog(label+' 的'+BATTLE_STATUS_NAMES[type]+'資料已辨識；該狀態的特殊回合行為留待下一層接入。');
    }
  }

  // StatusChange 的異常套用發生在 BATTLE_Attack() 返回之前；睡眠／石化成功後目標已不能反擊。
  if(unit.hp>0&&enemy){
    if(chosen.kind==='pet'&&chosen.pet&&petIsBattleActive(chosen.pet)&&battleStatusCanMove(targetDesc)){
      resolvePetEnemyCounterChain('enemy',chosen.pet,unit,r);
    }else if(chosen.kind==='player'&&state.hp>0&&options.allowPlayerCounter&&!options.playerGuarding&&battleStatusCanMove(targetDesc)){
      resolvePlayerEnemyCounterChain('enemy',unit,r);
    }
  }
  return {kind:'skill',skillId:actor.skillId,target:chosen.kind,r,statusType:type};
}
function performEnemyPowerBalance(actor,unit,options,meta){
  const attackPct=enemySignedSkillPercent(meta?.o,'攻%');
  const defensePct=enemySignedSkillPercent(meta?.o,'防%');
  addLog(unit.name+' 使用 '+(meta?.n||'背水之戰')+'（攻 '+(attackPct>=0?'+':'')+attackPct+'%／防 '+(defensePct>=0?'+':'')+defensePct+'%）。');
  // 原直接攻擊群組在執行前會把 COM 改回 ATTACK，之後具備反擊資格。
  unit.counterEligibleThisTurn=true;
  return Object.assign(
    {kind:'skill',skillId:actor.skillId},
    performEnemyPrimaryAttack(actor,unit,options)||{}
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
  addLog(unit.name+' 使用 '+(meta?.n||'一擊必殺')+'（傷害 ×'+multiplier+'／目標回避 +'+duckBonus+'）。');
  return Object.assign(
    {kind:'skill',skillId:actor.skillId},
    performEnemyPrimaryAttack(actor,unit,Object.assign({},options,{
      attackOptions:{damageMultiplier:multiplier,duckBonusPercent:duckBonus}
    }))||{}
  );
}
function performEnemyContinuation(actor,unit,options,meta){
  unit.counterEligibleThisTurn=true;
  const count=clamp(Math.trunc(enemySkillNumber(meta?.o,/^\s*(\d+)/,1)),1,10);
  const label=meta?.n||'連續攻擊';
  addLog(unit.name+' 使用 '+label+'（'+count+' 段）。');

  let chosen=enemyActorTarget(actor,unit);
  let lastResult=null,lastChosen=null,hits=0;
  for(let i=0;i<count;i++){
    if(!enemy||unit.hp<=0||state.hp<=0)break;

    if(!chosen
      ||(chosen.kind==='pet'&&(!chosen.pet||!petIsBattleActive(chosen.pet)))
      ||(chosen.kind==='player'&&state.hp<=0)){
      chosen=enemyActorTarget(actor,unit);
    }
    if(!chosen)break;

    let r;
    if(chosen.kind==='pet'&&chosen.pet){
      r=enemyAttackPetResult(unit,chosen.pet,{damageDivisor:count});
    }else{
      r=enemyAttackResult(unit,{guarding:!!options.playerGuarding&&!battleStatusActive({kind:'player'},'confusion'),damageDivisor:count});
    }

    hits++;
    lastResult=r;
    lastChosen=chosen;
    enemyApplySkillHit(unit,chosen,r,label+'第 '+hits+'/'+count+' 段');

    if(state.hp<=0)break;
    if(chosen.kind==='pet'&&chosen.pet&&!petIsBattleActive(chosen.pet)){
      chosen=null;
    }
  }

  // 原 battle.c：N 段全部處理完後，才拿最後一次 BATTLE_Attack 的 ContFlg 進一次反擊鏈。
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
    addLog(unit.name+' 的 enemy1 魔法 AI 被抽中，但來源資料未配置 ma 技能效果；本回合不行動。');
    return {kind:'magic',unsupported:true};
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
  return Object.assign({kind:'attack'},performEnemyPrimaryAttack(actor,unit,options)||{});
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
    serverCombat:target?.serverDerived?{attack:target.attack,defense:target.defense,quick:target.quick,maxHp:target.maxHp}:null,
    allocPointPacked:target?.allocatedFrom?packPetAllocPoint(target.allocatedFrom):null,
    petRank:target?.enemyExpRankIndex!=null&&Number.isFinite(Number(target.enemyExpRankIndex))?Math.trunc(Number(target.enemyExpRankIndex)):null,
    serverProgression:!!(target?.serverDerived&&target?.allocatedFrom&&target?.enemyExpRankIndex!=null&&Number.isFinite(Number(target.enemyExpRankIndex))),
    serverInitNum:target?.serverInitNum??null,serverLvUpPoint:target?.serverLvUpPoint??null,
    capturedAt:Date.now()
  };
  if(n(target?.maxHp)>0)pet.maxHp=Math.max(1,Math.trunc(n(target.maxHp)));
  syncPetBattleHp(pet,true);
  if(target&&Number.isFinite(Number(target.hp)))pet.hp=clamp(Math.trunc(n(target.hp)),0,pet.maxHp);
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

  const enemyDex=Math.max(0,n(enemy.dynamicGroup?target.stats?.dex:enemy.entry.variant?.stats?.dex));
  const captureBase=enemy.dynamicGroup?n(target.captureBase):n(enemy.entry.variant?.captureBase);
  const maxHp=Math.max(1,target.maxHp);
  const hpTerm=10-(target.hp*target.hp)/maxHp;
  const levelTerm=state.level/2-target.level/2;
  const dexTerm=state.dex/15-enemyDex/15;
  let raw=(hpTerm+levelTerm+dexTerm+(captureBase+state.luck))*state.charm/50;
  raw=Math.min(99,raw);
  return {
    raw,display:clamp(raw,0,99),allowed:true,missing:[],requirements:req.items,targetName:target.name,
    detail:{hpTerm,levelTerm,dexTerm,captureBase}
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

  const order=normalBattleOrder();
  let captured=false;
  for(const actor of order){
    if(!enemy)return captured;
    if(state.hp<=0){defeat();return captured}
    if(sourceEnemyCWait(actor))continue;
    const statusTurn=processBattleStatusTurn(actor);
    if(statusTurn.skip){
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
    if(statusTurn.confusionAttack){
      performConfusionAttack(actor,statusTurn,{playerGuarding:false,allowPlayerCounter:false});
      if(enemy)syncEnemyTarget();
      if(state.hp<=0){defeat();return captured}
      if(enemy&&!livingEnemyUnits().length){winBattle();return captured}
      continue;
    }

    if(actor.kind==='player'){
      const target=targetEnemyUnit();
      if(!target){
        if(livingEnemyUnits().length){addLog('敵方目前都在地球一周的繞背狀態，暫時沒有可指定的目標。');continue}
        winBattle();return captured
      }
      const c=captureChance();
      if(!c.allowed||c.display<=0){
        addLog('捕獲失敗：目前捕獲率為 '+Math.max(0,n(c.display)).toFixed(1)+'%。','bad');
      }else if(Math.random()*100<c.raw){
        const pet=addCapturedPet(target);
        // 原 PET_createPetFromCharaIndex 不複製 Enemy item；Enemy BATTLE_Exit/清理後其 carried/style 全釋放。
        releaseEnemyRuntimeItems(target);
        for(const item of c.requirements||[])consumeItem(item.id,1);
        addLog('捕獲成功：'+pet.name+'（'+c.display.toFixed(1)+'%）。','good');
        captured=true;

        if(enemy.dynamicGroup&&Array.isArray(enemy.units)){
          enemy.units=enemy.units.filter(u=>u.id!==target.id);
          if(!enemy.units.length){
            enemy=null;
            save();render();
            return true;
          }
          syncEnemyTarget();
        }else{
          enemy=null;
          save();render();
          return true;
        }
      }else{
        addLog('捕獲失敗：'+target.name+'（'+c.display.toFixed(1)+'%）。','bad');
      }
    }else if(actor.kind==='pet'){
      const pet=activePet();
      if(!pet||pet.id!==actor.petId||!petIsBattleActive(pet))continue;
      const target=targetEnemyUnit();
      if(!target){
        if(livingEnemyUnits().length){addLog('敵方目前都在地球一周的繞背狀態，暫時沒有可指定的目標。');continue}
        winBattle();return captured
      }
      const r=petAttackResult(pet,target);
      const actual=applyFriendlyEnemyHit('pet',pet.name,target,r);
      if(petIsBattleActive(pet)&&actual?.hp>0)resolvePetEnemyCounterChain('pet',pet,actual,r);
    }else if(actor.kind==='enemy'){
      const unit=livingEnemyUnits().find(u=>u.id===actor.unitId);
      if(!unit)continue;
      performEnemyAction(actor,unit,{playerGuarding:false,allowPlayerCounter:false});
    }

    if(enemy)syncEnemyTarget();
    if(state.hp<=0){defeat();return captured}
    if(enemy&&!livingEnemyUnits().length){winBattle();return captured}
  }

  if(enemy){syncEnemyTarget();battleFieldTick();}
  save();render();
  return captured;
}
function winBattle(){
  const defeated=enemy;
  const units=(Array.isArray(defeated?.units)&&defeated.units.length)?defeated.units:[defeated];
  const unitCount=Math.max(1,units.length);
  const serverResolved=units.length>0&&units.every(u=>u?.serverExpBase!=null);
  let exp=0,petExp=0;
  const active=activePet();
  const pet=active&&petIsBattleActive(active)?active:null;
  if(serverResolved){
    for(const unit of units){
      exp+=Math.max(0,n(serverBattleExpForRecipient(unit,state.level)));
      if(pet)petExp+=Math.max(0,n(serverBattleExpForRecipient(unit,pet.level)));
    }
  }else{
    exp=fallbackBattleExp(defeated);
    if(pet)petExp=Math.max(4,Math.round(exp*1.5));
  }
  state.wins++;
  state.exp+=exp;
  if(pet&&petExp>0)awardActivePetExp(petExp);
  addLog('擊敗 '+(defeated.groupBattle?('敵方編成 '+unitCount+' 名'):defeated.name)+'，獲得 '+exp+' EXP。'+(serverResolved?'（原 Enemy EXP／等級差衰減／battleexp ×'+Math.max(1,n(encounterRuntime?.enemyExp?.battleExpMultiplier)||1)+'）':'（手工任務編成沿用暫定 EXP）'),'good');
  const drops=rollVerifiedDrops(defeated);
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
  enemy=null;
  resetBattleStatuses();
  levelCheck();
  save();render();
}
function defeat(){
  addLog('角色體力不足，已自動回村休息並補滿 HP／MP。','bad');
  releaseBattleEnemyRuntimeItems(enemy);
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
function normalBattleOrder(){
  // 原 BATTLE_PreCommandSeq 每輪先 complianceParameter 重建 FIX 屬性，再依 REVERSE flag 套 BATTLE_AttReverse。
  battlePrepareElementWork();
  const order=[];
  let orderIndex=0;
  for(const unit of livingEnemyUnits()){
    unit.guardianReadyThisTurn=false;
    unit.guardedByUnitId=null;
  }
  const player=playerBattleView();
  order.push({kind:'player',label:'你',quick:player.quick,dex:battleDexRoll(player.quick),orderIndex:orderIndex++});

  const pet=activePet();
  if(pet&&petIsBattleActive(pet)){
    const pv=petBattleView(pet);
    const quick=pv?n(pv.quick):n(pet?.stats?.dex);
    order.push({kind:'pet',label:pet.name,petId:pet.id,quick,dex:battleDexRoll(quick),orderIndex:orderIndex++});
  }

  for(const unit of livingEnemyUnits()){
    const action=enemyChooseAction(unit);
    enemyPrepareRoundAction(unit,action);
    unit.guardThisTurn=action.kind==='guard';
    // 排序 QUICK 應使用當前狀態後的 battle view；V0.47 的 weaken 也因此會正確影響出手順序。
    const quick=n(enemyBattleView(unit)?.quick);
    const needsTarget=action.kind==='attack'||action.kind==='skill'||action.kind==='magic';
    const chosen=needsTarget?enemyChooseTarget(unit):null;
    order.push({
      kind:'enemy',label:unit.name,unitId:unit.id,quick,dex:battleDexRoll(quick,unit.roundDexMode),orderIndex:orderIndex++,
      enemyAction:action.kind,skillSlot:action.skillSlot??null,skillId:action.skillId??null,
      sourceSkillMissing:!!action.sourceSkillMissing,
      sourceSkillUnregistered:!!action.sourceSkillUnregistered,
      sourceSkillRejected:!!action.sourceSkillRejected,
      sourceCWaitReason:action.sourceCWaitReason||null,
      targetKind:chosen?.kind||null,targetPetId:chosen?.petId||null
    });
  }

  // 原 EntrySort() 會依 dex + CHAR_WORKSEQUENCEPOWER 由高到低排序。
  // 目前尚無裝備系統，所以 sequence 固定等同 0；同值時保留建表順序。
  order.sort((a,b)=>(b.dex-a.dex)||(a.orderIndex-b.orderIndex));
  return order;
}
function sourceEnemyCWait(actor){
  if(actor?.kind!=='enemy'||(!actor.sourceSkillMissing&&!actor.sourceSkillUnregistered&&!actor.sourceSkillRejected))return false;
  const unit=livingEnemyUnits().find(u=>u.id===actor.unitId);
  if(unit){
    if(actor.sourceSkillMissing){
      addLog(unit.name+' 的 Enemy AI 抽到來源未定義 PetSkill '+actor.skillId+'；原服 PETSKILL_Use() 會失敗並停在 C_WAIT，本回合不行動且不跑自身 StatusSeq。');
    }else if(actor.sourceSkillUnregistered){
      addLog(unit.name+' 的 Enemy AI 抽到 PetSkill '+actor.skillId+'，但原 build 找不到可註冊的技能函式；PETSKILL_Use() 回 FALSE，維持 C_WAIT，本回合不行動且不跑自身 StatusSeq。');
    }else if(actor.sourceCWaitReason==='sacrifice-low-hp'){
      addLog(unit.name+' 嘗試使用救援，但目前 HP 不高於最大 HP 的 20%；原 PETSKILL_Sacrifice() 直接失敗並停在 C_WAIT，本回合不跑自身 StatusSeq。');
    }
  }
  return true;
}
function attackTurn(){
  if(!enemy)return;
  const order=normalBattleOrder();

  for(const actor of order){
    if(!enemy)return;
    if(state.hp<=0){defeat();return}
    if(sourceEnemyCWait(actor))continue;
    const statusTurn=processBattleStatusTurn(actor);
    if(statusTurn.skip){
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
    if(statusTurn.confusionAttack){
      performConfusionAttack(actor,statusTurn,{playerGuarding:false,allowPlayerCounter:true});
      if(enemy)syncEnemyTarget();
      if(state.hp<=0){defeat();return}
      if(enemy&&!livingEnemyUnits().length){winBattle();return}
      continue;
    }

    if(actor.kind==='player'){
      const target=targetEnemyUnit();
      if(!target){
        if(livingEnemyUnits().length){addLog('敵方目前都在地球一周的繞背狀態，暫時沒有可指定的目標。');continue}
        winBattle();return
      }
      const r=playerAttackResult(target);
      const actual=applyFriendlyEnemyHit('player','你',target,r);
      if(state.hp>0&&actual?.hp>0)resolvePlayerEnemyCounterChain('player',actual,r);
    }else if(actor.kind==='pet'){
      const pet=activePet();
      if(!pet||pet.id!==actor.petId||!petIsBattleActive(pet))continue;
      const target=targetEnemyUnit();
      if(!target){
        if(livingEnemyUnits().length){addLog('敵方目前都在地球一周的繞背狀態，暫時沒有可指定的目標。');continue}
        winBattle();return
      }
      const r=petAttackResult(pet,target);
      const actual=applyFriendlyEnemyHit('pet',pet.name,target,r);
      if(petIsBattleActive(pet)&&actual?.hp>0)resolvePetEnemyCounterChain('pet',pet,actual,r);
    }else if(actor.kind==='enemy'){
      const unit=livingEnemyUnits().find(u=>u.id===actor.unitId);
      if(!unit)continue;
      performEnemyAction(actor,unit,{playerGuarding:false,allowPlayerCounter:true});
    }

    if(enemy)syncEnemyTarget();
    if(state.hp<=0){defeat();return}
    if(enemy&&!livingEnemyUnits().length){winBattle();return}
  }

  if(enemy){syncEnemyTarget();battleFieldTick();}
  render();
}
function guardTurn(){
  if(!enemy)return;
  const order=normalBattleOrder();

  // 原服在回合指令確定後，CHAR_WORKBATTLECOM1 已經是 GUARD；
  // 所以即使敵人的排序在玩家之前，防禦減傷也已生效。
  for(const actor of order){
    if(!enemy)return;
    if(state.hp<=0){defeat();return}
    if(sourceEnemyCWait(actor))continue;
    const statusTurn=processBattleStatusTurn(actor);
    if(statusTurn.skip){
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
    if(statusTurn.confusionAttack){
      performConfusionAttack(actor,statusTurn,{playerGuarding:true,allowPlayerCounter:false});
      if(enemy)syncEnemyTarget();
      if(state.hp<=0){defeat();return}
      if(enemy&&!livingEnemyUnits().length){winBattle();return}
      continue;
    }

    if(actor.kind==='player'){
      addLog('你採取防禦姿勢。','good');
    }else if(actor.kind==='pet'){
      const pet=activePet();
      if(!pet||pet.id!==actor.petId||!petIsBattleActive(pet))continue;
      const target=targetEnemyUnit();
      if(!target){
        if(livingEnemyUnits().length){addLog('敵方目前都在地球一周的繞背狀態，暫時沒有可指定的目標。');continue}
        winBattle();return
      }
      const r=petAttackResult(pet,target);
      const actual=applyFriendlyEnemyHit('pet',pet.name,target,r);
      if(petIsBattleActive(pet)&&actual?.hp>0)resolvePetEnemyCounterChain('pet',pet,actual,r);
    }else if(actor.kind==='enemy'){
      const unit=livingEnemyUnits().find(u=>u.id===actor.unitId);
      if(!unit)continue;
      performEnemyAction(actor,unit,{playerGuarding:true,allowPlayerCounter:false});
    }

    if(enemy)syncEnemyTarget();
    if(state.hp<=0){defeat();return}
    if(enemy&&!livingEnemyUnits().length){winBattle();return}
  }

  if(enemy){syncEnemyTarget();battleFieldTick();}
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
  document.querySelectorAll('#playerParamGrid button[data-player-stat]').forEach(b=>b.disabled=Math.floor(n(state.skillPoints))<=0);
  $('#wins').textContent=state.wins;
  $('#hpBar').style.width=clamp(state.hp/state.maxHp*100,0,100)+'%';
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
    box.innerHTML='<div class="enemy-name">等待下一次遭遇</div><div class="muted">'+(state.auto?'自動戰鬥運作中。':'目前已暫停。')+'</div>';
    $('#battleState').textContent=state.auto?'自動中':'已暫停';
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
    const [r,runtimeR,itemR,zooR,aiR,petSkillR,modAiR,attackMagicR]=await Promise.all([
      fetch(DATA_URL,{cache:'no-store'}),
      fetch(ENCOUNTER_RUNTIME_URL,{cache:'no-store'}),
      fetch(CONDITION_ITEM_URL,{cache:'no-store'}),
      fetch(ZOO_QUEST_URL,{cache:'no-store'}),
      fetch(ENEMY_AI_URL,{cache:'no-store'}),
      fetch(PETSKILL_RUNTIME_URL,{cache:'no-store'}),
      fetch(PET_MODAI_URL,{cache:'no-store'}),
      fetch(ATTACK_MAGIC_RUNTIME_URL,{cache:'no-store'})
    ]);
    if(!r.ok)throw new Error('寵物資料 HTTP '+r.status);
    if(!runtimeR.ok)throw new Error('Encounter runtime HTTP '+runtimeR.status);
    if(!itemR.ok)throw new Error('條件道具資料 HTTP '+itemR.status);
    if(!zooR.ok)throw new Error('動物園任務資料 HTTP '+zooR.status);
    if(!aiR.ok)throw new Error('Enemy AI 資料 HTTP '+aiR.status);
    if(!petSkillR.ok)throw new Error('PetSkill runtime HTTP '+petSkillR.status);
    if(!modAiR.ok)throw new Error('Pet MODAI runtime HTTP '+modAiR.status);
    if(!attackMagicR.ok)throw new Error('AttackMagic runtime HTTP '+attackMagicR.status);
    db=await r.json();
    encounterRuntime=await runtimeR.json();
    enemyAiDb=await aiR.json();
    petSkillDb=await petSkillR.json();
    petModAiDb=await modAiR.json();
    attackMagicDb=await attackMagicR.json();
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
    addLog('V0.69 載入完成：ITEM existing-index runtime 接上 Enemy 10 格攜帶物與 STYLE 武器的建立／getitem 轉移／消耗／逃跑／捕獲／戰敗釋放生命週期；未知 itemset6 mu 不猜 MP cost。','good');
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
