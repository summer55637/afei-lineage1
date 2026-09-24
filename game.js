'use strict';

const DATA_URL='data/generated/stoneage_general_lv1_pets.json';
const CONDITION_ITEM_URL='data/generated/capture_items.json';
const ZOO_QUEST_URL='data/generated/zoo_quest.json';
const SAVE_KEY='afei_stoneage_idle_v01';
const TEAM_SIZE=5;
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
let db=null, zooQuest=null, maps=[], conditionItems=[], sourceCatalog=new Map(), state=null, enemy=null, timer=null;

const $=s=>document.querySelector(s);
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const uid=()=>('p'+Date.now().toString(36)+Math.random().toString(36).slice(2,8));

function freshState(){
  return {
    schemaVersion:9,
    level:1,exp:0,expNext:100,hp:120,maxHp:120,
    attack:18,defense:5,dex:30,charm:50,luck:0,
    gold:0,battles:0,wins:0,mapId:null,auto:true,autoCapture:true,
    petBox:[],team:Array(TEAM_SIZE).fill(null),activePetId:null,
    inventory:{},
    quest:{event81Complete:false,event81:{active:false,complete:false,stage:0,deliveredTempNo:null,arrivedEden:false,postReward:false},event71Current:false,event2:{active:false,complete:false},event4:{active:false,complete:false,stage:0},event71Prep:{stage:0,memoryIndex:0,memoryReady:false},event82:{active:false,complete:false,raelpangReported:false,popodonReported:false},event83:{active:false,complete:false}},
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
      s.quest.event81={active:false,complete:true,stage:8,deliveredTempNo:null,arrivedEden:false,postReward:false,legacyAccepted:true};
      s.quest.event81Complete=true;
    }else if(raw?.quest?.event81Complete===true){
      s.quest.event81=Object.assign({},base.quest.event81);
      s.quest.event81Complete=false;
    }
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
  s.schemaVersion=9;
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
  state.inventory[key]=Math.max(0,n(state.inventory[key])-count);
  if(state.inventory[key]<=0)delete state.inventory[key];
}
function giveItem(id,count=1){
  const key=String(id);
  state.inventory[key]=n(state.inventory[key])+count;
}
function rollVerifiedDrops(defeatedEnemy){
  if(!defeatedEnemy)return [];
  const enemyIds=new Set((defeatedEnemy.entry?.variant?.enemyIds||[]).map(Number));
  const drops=[];
  const qd=defeatedEnemy.entry?.variant?.questDrop;
  if(qd&&n(qd.probability)>0&&Math.random()<n(qd.probability)){
    giveItem(qd.id,1);
    drops.push(questItemMeta(qd.id)||{id:qd.id,name:qd.name||('Item '+qd.id)});
  }
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
  return drops;
}
function routeUnlocked(route){
  const ids=route?.appearanceInventoryItemIds||[];
  const noids=route?.notAppearanceInventoryItemIds||[];
  const req=route?.questRequirement||null;
  if(req?.event81Stage!=null&&n(state?.quest?.event81?.stage)!==n(req.event81Stage))return false;
  return ids.every(id=>hasItem(id))&&noids.every(id=>!hasItem(id));
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
        bossComposition:raw.bossComposition||null
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
        appearanceInventoryItemIds:zone.requireItems||[],
        appearanceInventoryItems:(zone.requireItems||[]).map(id=>questItemMeta(id)||{id,name:'Item '+id}),
        notAppearanceInventoryItemIds:zone.forbidItems||[],
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
        if(!m.has(id))m.set(id,{id,name:route.mapName||('Floor '+id),entries:[]});
        m.get(id).entries.push({species,variant,route});
      }
    }
  }
  maps=[...m.values()].sort((a,b)=>Number(a.id)-Number(b.id));
  buildQuestMaps();
}
function currentMap(){return maps.find(x=>String(x.id)===String(state.mapId))||maps[0]}
function expToNext(level){return 100+Math.max(0,level-1)*45}
function eligibleEntries(map){return (map?.entries||[]).filter(x=>routeUnlocked(x.route))}
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

function spawnEnemy(){
  const map=currentMap();
  const entries=eligibleEntries(map);
  if(!map||!entries.length)return;
  const entry=weightedEntry(entries);
  const consumeId=n(entry.variant.consumeOnSpawnItemId);
  if(consumeId){
    if(!hasItem(consumeId))return;
    consumeItem(consumeId,1);
    addLog('依原 NPC steal 規則，開戰收走 Item '+consumeId+'。','pet');
  }
  const st=entry.variant.stats||{};
  const vit=Math.max(1,n(st.vital)||8);
  const str=Math.max(1,n(st.str)||6);
  const tgh=Math.max(1,n(st.tgh)||6);
  const level=rnd(Math.max(1,n(entry.variant.levelMin)||1),Math.max(1,n(entry.variant.levelMax)||n(entry.variant.levelMin)||1));
  const hp=Math.max(35,Math.round(28+vit*5.5));
  enemy={
    entry,level,
    name:entry.species.clientLabel||entry.variant.serverName||('TempNo '+entry.variant.tempNo),
    hp,maxHp:hp,
    attack:Math.max(3,Math.round(3+str*.62)),
    defense:Math.max(0,Math.round(tgh*.28))
  };
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
  if(state.activePetId===id)state.activePetId=state.team.find(Boolean)||null;
  return true;
}
function addQuestRewardPet(){
  const p={
    id:uid(),name:'布伊胖',animationGroupId:100825,tempNo:730,level:1,exp:0,wildGrowth:27,
    stats:{vital:34,str:29,tgh:25,dex:23},elements:{},capturedAt:Date.now(),questReward:true
  };
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
  state.petBox.push(p);
  const open=state.team.findIndex(x=>!x);
  if(open>=0)state.team[open]=p.id;
  if(!state.activePetId)state.activePetId=p.id;
  return p;
}
function marefiaPet(){return state.petBox.find(p=>Number(p.tempNo)===718)||null}
function petExpToNext(level){return 18+Math.max(0,n(level)-1)*4}
function awardActivePetExp(amount){
  const p=activePet();if(!p)return;
  const isMarefia=Number(p.tempNo)===718;
  const maxLevel=isMarefia?Math.max(1,n(p.levelCap)||10):99;
  p.exp=n(p.exp)+Math.max(1,Math.round(amount));
  let up=false;
  while(p.level<maxLevel&&p.exp>=petExpToNext(p.level)){
    p.exp-=petExpToNext(p.level);p.level++;up=true;
  }
  if(isMarefia&&p.level>=maxLevel){
    p.exp=Math.min(p.exp,Math.max(0,petExpToNext(p.level)-1));
  }
  if(up){
    addLog(p.name+' 升到 Lv.'+p.level+'。','pet');
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
function playerDamage(){return Math.max(1,Math.round(state.attack-enemy.defense+rnd(-2,4)))}
function petDamage(pet){
  const str=Math.max(1,n(pet?.stats?.str)||6);
  return Math.max(1,Math.round(2+str*.42+n(pet.level)*1.2-enemy.defense*.28+rnd(-1,2)));
}
function enemyDamage(){return Math.max(1,Math.round(enemy.attack-state.defense*.45+rnd(-2,2)))}
function enemyCounter(){
  if(!enemy)return;
  const back=enemyDamage();
  state.hp=Math.max(0,state.hp-back);
  addLog(enemy.name+' 反擊 '+back+'。',state.hp<=0?'bad':'');
  if(state.hp<=0)defeat();
}
function levelCheck(){
  let leveled=false;
  while(state.exp>=state.expNext){
    state.exp-=state.expNext;
    state.level++;
    state.expNext=expToNext(state.level);
    state.maxHp+=18;
    state.hp=state.maxHp;
    state.attack+=3;
    state.defense+=1;
    state.dex+=1;
    leveled=true;
  }
  if(leveled)addLog('升級！目前 Lv.'+state.level+'，HP 已補滿。','good');
}
function createCapturedPet(){
  const v=enemy.entry.variant;
  return {
    id:uid(),name:enemy.name,animationGroupId:enemy.entry.species.animationGroupId,
    tempNo:v.tempNo,level:enemy.level||1,exp:0,wildGrowth:n(v.wildGrowth),
    stats:Object.assign({},v.stats||{}),elements:Object.assign({},v.elements||{}),
    capturedAt:Date.now()
  };
}
function addCapturedPet(){
  const pet=createCapturedPet();
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
function captureRequirements(){
  const rule=enemy?.entry?.variant?.captureRule;
  const items=rule?.requiresAllItems||[];
  const missing=items.filter(x=>!hasItem(x.id));
  return {rule,items,missing,allowed:missing.length===0};
}
function captureChance(){
  if(!enemy)return {raw:0,display:0,allowed:false,missing:[]};
  if(enemy.entry?.variant?.capturable===false)return {raw:0,display:0,allowed:false,missing:[],uncapturable:true};
  const req=captureRequirements();
  if(!req.allowed)return {raw:0,display:0,allowed:false,missing:req.missing,requirements:req.items};
  if(state.level+5<enemy.level)return {raw:0,display:0,allowed:false,missing:[],requirements:req.items};

  const enemyDex=Math.max(0,n(enemy.entry.variant?.stats?.dex));
  const captureBase=n(enemy.entry.variant?.captureBase);
  const maxHp=Math.max(1,enemy.maxHp);
  const hpTerm=10-(enemy.hp*enemy.hp)/maxHp;
  const levelTerm=state.level/2-enemy.level/2;
  const dexTerm=state.dex/15-enemyDex/15;
  let raw=(hpTerm+levelTerm+dexTerm+(captureBase+state.luck))*state.charm/50;
  raw=Math.min(99,raw);
  return {
    raw,display:clamp(raw,0,99),allowed:true,missing:[],requirements:req.items,
    detail:{hpTerm,levelTerm,dexTerm,captureBase}
  };
}
function captureTurn(manual=false){
  if(!enemy)return false;
  const c=captureChance();
  if(!c.allowed){
    if(c.missing?.length){
      addLog('無法捕獲 '+enemy.name+'：缺少 '+c.missing.map(x=>x.name||('Item '+x.id)).join('、')+'。','bad');
    }else{
      addLog('目前條件無法捕獲 '+enemy.name+'。','bad');
    }
    if(manual)enemyCounter();
    render();
    return false;
  }
  if(c.display<=0){
    if(manual)addLog('捕獲失敗：目前捕獲率為 0%，先削低 HP。','bad');
    if(manual)enemyCounter();
    render();
    return false;
  }
  const success=Math.random()*100<c.raw;
  if(success){
    const pet=addCapturedPet();
    for(const item of c.requirements||[])consumeItem(item.id,1);
    addLog('捕獲成功：'+pet.name+'（'+c.display.toFixed(1)+'%）。','good');
    enemy=null;
    save();render();
    return true;
  }
  addLog('捕獲失敗：'+enemy.name+'（'+c.display.toFixed(1)+'%）。','bad');
  enemyCounter();
  save();render();
  return false;
}
function winBattle(){
  const defeated=enemy;
  const growth=Math.max(1,n(defeated.entry.variant.wildGrowth)||1);
  const exp=Math.max(6,Math.round(7+growth*2.2));
  const gold=rnd(2,6);
  state.wins++;
  state.exp+=exp;
  state.gold+=gold;
  awardActivePetExp(Math.max(4,Math.round(exp*1.5)));
  addLog('擊敗 '+defeated.name+'，獲得 '+exp+' EXP、'+gold+' 石幣。','good');
  const drops=rollVerifiedDrops(defeated);
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
  const e81stageMap={'event81-thief-1-win':4,'event81-thief-2-win':5,'event81-thief-3-win':6,'event81-boss-win':7};
  if(e81stageMap[e81win]!=null&&n(state.quest.event81.stage)===e81stageMap[e81win]-1){
    state.quest.event81.stage=e81stageMap[e81win];
    state.mapId=maps.find(m=>!m.questZone)?.id||maps[0]?.id||state.mapId;
    if(e81win==='event81-boss-win')addLog('PC團老大已被擊敗；依 event81_3f.arg 被送到 Floor 5580，可向老大取得悔過書。','good');
    else addLog('PC團盜賊金剛陣突破一層，繼續深入據點。','good');
  }
  enemy=null;
  levelCheck();
  save();render();
}
function defeat(){
  addLog('角色體力不足，已自動回村休息並補滿 HP。','bad');
  state.hp=state.maxHp;
  enemy=null;
  save();render();
}
function attackTurn(){
  if(!enemy)return;
  const dmg=playerDamage();
  enemy.hp=Math.max(0,enemy.hp-dmg);
  addLog('你對 '+enemy.name+' 造成 '+dmg+' 傷害。');
  if(enemy.hp<=0){winBattle();return}

  const pet=activePet();
  if(pet){
    const pd=petDamage(pet);
    enemy.hp=Math.max(0,enemy.hp-pd);
    addLog(pet.name+' 追擊造成 '+pd+' 傷害。','pet');
    if(enemy.hp<=0){winBattle();return}
  }
  enemyCounter();
  render();
}
function tick(){
  if(!state||!state.auto)return;
  if(state.hp<=0){defeat();return}
  if(!enemy){spawnEnemy();return}
  const c=captureChance();
  const hpRatio=enemy.hp/Math.max(1,enemy.maxHp);
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
    const ok=eligibleEntries(m).length,total=m.entries.length;
    const floor=m.floorId??m.id;
    return '<option value="'+m.id+'">'+escapeHtml(m.name)+' · Floor '+floor+' · '+ok+'/'+total+' 路線</option>';
  }).join('');
  select.value=selected;
}
function renderZooQuest(){
  const q=state.quest,e81=q.event81,e2=q.event2,e4=q.event4,prep=q.event71Prep,e82=q.event82,e83=q.event83;
  const has905=hasPetTempNo(905),has786=hasPetTempNo(786),has854=hasPetTempNo(854),marefia=marefiaPet();
  $('#zooQuestBadge').textContent=e82.complete?'Event 82 完成':(e82.active?'Event 82 進行中':(q.event81Complete?'可接取':'前置未完成'));
  const lines=[];
  const e81text=e81.complete?('已完成（ENDEV=81）'+(e81.postReward?' · 伊甸總教練獎勵已領':' · 研究報告待送伊甸')):(e81.stage===0?'尚未開始':e81.stage===1?'持有推薦函 19696':e81.stage===2?'捕捉飛龍並持有證明書 19697':e81.stage===3?'NOWEV=81 · 準備闖 PC團金剛陣':e81.stage===4?'金剛陣第一層已破':e81.stage===5?'金剛陣第二層已破':e81.stage===6?'金剛陣第三層已破 · 挑戰老大':e81.stage===7?'PC團老大已敗 · 取得悔過書':e81.stage===8?'回報霍特雷敦':'進行中');
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
  if(!e4.complete&&!e81.active&&!e81.complete){
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
    if(e81.stage===3)actions.push('<button data-zoo-action="event81-thief-1" class="wide">PC團金剛陣・第一層</button>');
    if(e81.stage===4)actions.push('<button data-zoo-action="event81-thief-2" class="wide">PC團金剛陣・第二層</button>');
    if(e81.stage===5)actions.push('<button data-zoo-action="event81-thief-3" class="wide">PC團金剛陣・第三層</button>');
    if(e81.stage===6)actions.push('<button data-zoo-action="event81-boss" class="wide">Floor 5582：挑戰 PC團老大</button>');
    if(e81.stage===7)actions.push('<button data-zoo-action="event81-confession" class="wide">Floor 5580：向 PC團老大取得悔過書 19698</button>');
    if(e81.stage===8&&hasItem(19698))actions.push('<button data-zoo-action="event81-complete" class="wide">回霍特雷敦：交悔過書並完成 Event81</button>');
  }
  if(e81.complete&&!e81.postReward){
    if(!e81.arrivedEden&&hasItem(19699))actions.push('<button data-zoo-action="event81-fly-eden" class="wide">搭朵拉比斯飛往伊甸（10,000 石幣）</button>');
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
  $('#exp').textContent=state.exp+' / '+state.expNext;
  $('#hp').textContent=state.hp+' / '+state.maxHp;
  $('#gold').textContent=state.gold;
  $('#attack').textContent=state.attack;
  $('#defense').textContent=state.defense;
  $('#dex').textContent=state.dex;
  $('#charm').textContent=state.charm;
  $('#luck').textContent=state.luck;
  $('#wins').textContent=state.wins;
  $('#hpBar').style.width=clamp(state.hp/state.maxHp*100,0,100)+'%';
  $('#autoBtn').textContent='自動戰鬥：'+(state.auto?'開':'關');
  $('#autoCaptureBtn').textContent='自動捕獲：'+(state.autoCapture?'開':'關');

  const map=currentMap();
  if(map){
    const eligible=eligibleEntries(map);
    const allNames=[...new Set(map.entries.map(x=>x.species.clientLabel))];
    const okNames=[...new Set(eligible.map(x=>x.species.clientLabel))];
    $('#mapPetCount').textContent=okNames.length+' / '+allNames.length+' 種可遇';
    $('#mapInfo').textContent=(map.questZone?(map.description+'；'):'')+'目前可遇 Lv1：'+(okNames.slice(0,12).join('、')||'無')+(okNames.length>12?'…':'')+
      (okNames.length<allNames.length?'；另有 '+(allNames.length-okNames.length)+' 種需要出現條件道具。':'');
  }
  renderMapOptions();
  renderEnemy();
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
  const hpPct=clamp(enemy.hp/enemy.maxHp*100,0,100);
  box.className='enemy';
  box.innerHTML='<div class="enemy-name">Lv'+enemy.level+' '+escapeHtml(enemy.name)+'</div>'+
    '<div class="enemy-meta"><span class="pill">TempNo '+v.tempNo+'</span><span class="pill">EnemyID '+(v.enemyIds||[]).join(', ')+'</span><span class="pill">E_T_GET '+n(v.captureBase)+'</span></div>'+
    '<div class="enemy-hp">HP '+enemy.hp+' / '+enemy.maxHp+'</div>'+
    '<div class="progress"><i style="width:'+hpPct+'%"></i></div>';
  $('#battleState').textContent='戰鬥中';

  const c=captureChance();
  $('#captureChance').textContent='捕獲率：'+c.display.toFixed(1)+'%';
  if(!c.allowed){
    if(c.missing?.length){
      $('#captureInfo').textContent='缺少條件道具：'+c.missing.map(x=>x.name||('Item '+x.id)).join('、');
    }else if(c.uncapturable){
      $('#captureInfo').textContent='此為任務干擾怪，原服務端設定不可捕獲。';
    }else{
      $('#captureInfo').textContent='目前條件無法捕獲。';
    }
    capBtn.disabled=true;
  }else{
    $('#captureInfo').textContent=(c.requirements?.length?'特殊捕獲條件已滿足。':'一般 Lv1 可捕獲。')+' HP 越低越容易成功。';
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
  $('#activePetInfo').textContent=p?'出戰：'+p.name+' · Lv.'+p.level+(Number(p.tempNo)===718?' / 上限 '+n(p.levelCap):'')+' · 腕力 '+n(p.stats?.str)+' · 敏捷 '+n(p.stats?.dex):'尚未指定出戰寵物。';
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
    return '<div class="pet-row '+(active?'active':'')+'"><b>'+escapeHtml(p.name)+(active?' · 出戰':'')+'</b>'+
      '<span>Lv.'+n(p.level)+' · TempNo '+(p.tempNo??'舊存檔')+' · Animation '+(p.animationGroupId??'—')+'</span>'+
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
    const [r,itemR,zooR]=await Promise.all([
      fetch(DATA_URL,{cache:'no-store'}),
      fetch(CONDITION_ITEM_URL,{cache:'no-store'}),
      fetch(ZOO_QUEST_URL,{cache:'no-store'})
    ]);
    if(!r.ok)throw new Error('寵物資料 HTTP '+r.status);
    if(!itemR.ok)throw new Error('條件道具資料 HTTP '+itemR.status);
    if(!zooR.ok)throw new Error('動物園任務資料 HTTP '+zooR.status);
    db=await r.json();
    zooQuest=await zooR.json();
    buildSourceCatalog(await itemR.json());
    buildConditionItems();
    buildMaps();
    state=loadState();
    if(!maps.some(m=>String(m.id)===String(state.mapId)))state.mapId=maps[0]?.id||null;
    state.expNext=expToNext(state.level);
    renderMapOptions();
    addLog('V0.7 載入完成：Event2 貝殼與 Event71 寵物轉生前置已接入，開發灌旗入口已移除。','good');
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
  if(action==='goto-raelpang'){state.mapId='zoo-raelpang';enemy=null;addLog('前往伊甸園雷爾胖任務區。');}
  if(action==='goto-popodon'){state.mapId='zoo-popodon';enemy=null;addLog('前往伊甸園波波頓任務區。');}
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
    if(map){state.mapId=map.id;enemy=null;addLog('前往 '+map.name+' 捕捉加寶格恩（TempNo 273）。','good');}
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
      consumeItem(19697,1);e81.stage=3;
      addLog('霍特雷敦收下 '+p.name+' 與捕捉證明書；發現布蘭恩002失蹤，正式進入 NOWEV=81。','good');
    }
  }
  if(action==='event81-thief-1'&&e81.stage===3){state.mapId='event81-thief-1';enemy=null;addLog('闖入 PC團盜賊金剛陣第一層。');}
  if(action==='event81-thief-2'&&e81.stage===4){state.mapId='event81-thief-2';enemy=null;addLog('闖入 PC團盜賊金剛陣第二層。');}
  if(action==='event81-thief-3'&&e81.stage===5){state.mapId='event81-thief-3';enemy=null;addLog('闖入 PC團盜賊金剛陣第三層。');}
  if(action==='event81-boss'&&e81.stage===6){state.mapId='event81-boss';enemy=null;addLog('前往 Floor 5582 挑戰 PC團老大。','good');}
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
  if(action==='event81-fly-eden'&&e81.complete&&!e81.arrivedEden&&hasItem(19699)){
    const denied=[2402,2403,2404,2405,2406,2407,2408,2409,2410,2411,2412,2413].filter(id=>hasItem(id));
    if(denied.length)addLog('飛龍航空拒絕搭載目前持有的禁運道具：'+denied.join('、')+'。','bad');
    else if(state.gold<10000)addLog('飛龍航空旅費需要 10,000 石幣。','bad');
    else{state.gold-=10000;e81.arrivedEden=true;addLog('支付 10,000 石幣，搭乘朵拉比斯由波拉飛往伊甸。','good');}
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
    state.mapId='event69-frog-king';enemy=null;
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
  if(action==='goto-collar'&&hasItem(19711)){state.mapId='zoo-collar';enemy=null;addLog('前往格爾希洛項圈區。');}
  if(action==='exchange19712'&&hasItem(19711)&&hasItem(19716)){
    clearEvent83Chain([19716]);giveItem(19712,1);addLog('里拉拉收下項圈，線索變為 19712。','good');
  }
  if(action==='next19713'&&hasItem(19712)){
    clearEvent83Chain();giveItem(19713,1);addLog('里拉拉指示前往大雕像，取得線索 19713。','good');
  }
  if(action==='goto-clothes'&&hasItem(19713)){state.mapId='zoo-black-clothes';enemy=null;addLog('前往不良少年怪衣區。');}
  if(action==='exchange19714'&&hasItem(19713)&&hasItem(19717)){
    clearEvent83Chain([19717]);giveItem(19714,1);addLog('里拉拉收下怪衣，取得地下據點線索 19714。','good');
  }
  if(action==='goto-flag'&&hasItem(19714)){state.mapId='zoo-underground-flag';enemy=null;addLog('進入地下洞窟 Group 962，尋找黑旗 19718。');}
  if(action==='goto-sig'&&hasItem(19714)&&hasItem(19718)){state.mapId='zoo-sig';enemy=null;addLog('前往 Floor 60044 挑戰席格。','good');}
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
  state.mapId=e.target.value;enemy=null;
  addLog('前往 '+currentMap().name+'。');save();render();
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
$('#healBtn').addEventListener('click',()=>{
  state.hp=state.maxHp;addLog('休息完成，HP 已補滿。','good');save();render();
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
