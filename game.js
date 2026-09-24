'use strict';

const DATA_URL='data/generated/stoneage_general_lv1_pets.json';
const SAVE_KEY='afei_stoneage_idle_v01';
const TEAM_SIZE=5;
let db=null, maps=[], state=null, enemy=null, timer=null;

const $=s=>document.querySelector(s);
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const uid=()=>('p'+Date.now().toString(36)+Math.random().toString(36).slice(2,8));

function freshState(){
  return {
    schemaVersion:2,
    level:1,exp:0,expNext:100,hp:120,maxHp:120,
    attack:18,defense:5,dex:30,charm:50,luck:0,
    gold:0,battles:0,wins:0,mapId:null,auto:true,autoCapture:true,
    petBox:[],team:Array(TEAM_SIZE).fill(null),activePetId:null,
    inventory:{},log:[],savedAt:Date.now()
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
  s.team=Array.isArray(raw?.team)?raw.team.slice(0,TEAM_SIZE):Array(TEAM_SIZE).fill(null);
  while(s.team.length<TEAM_SIZE)s.team.push(null);
  migrateLegacyPets(raw,s);
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
  s.schemaVersion=2;
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
function routeUnlocked(route){
  const ids=route?.appearanceInventoryItemIds||[];
  return ids.every(id=>hasItem(id));
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
  const st=entry.variant.stats||{};
  const vit=Math.max(1,n(st.vital)||8);
  const str=Math.max(1,n(st.str)||6);
  const tgh=Math.max(1,n(st.tgh)||6);
  const hp=Math.max(35,Math.round(28+vit*5.5));
  enemy={
    entry,
    level:1,
    name:entry.species.clientLabel||entry.variant.serverName||('TempNo '+entry.variant.tempNo),
    hp,maxHp:hp,
    attack:Math.max(3,Math.round(3+str*.62)),
    defense:Math.max(0,Math.round(tgh*.28))
  };
  state.battles++;
  addLog('遭遇 Lv1 '+enemy.name+'。');
  render();
}
function activePet(){return state.petBox.find(p=>p.id===state.activePetId)||null}
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
    tempNo:v.tempNo,level:1,exp:0,wildGrowth:n(v.wildGrowth),
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
  const growth=Math.max(1,n(enemy.entry.variant.wildGrowth)||1);
  const exp=Math.max(6,Math.round(7+growth*2.2));
  const gold=rnd(2,6);
  state.wins++;
  state.exp+=exp;
  state.gold+=gold;
  addLog('擊敗 '+enemy.name+'，獲得 '+exp+' EXP、'+gold+' 石幣。','good');
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
  select.innerHTML=maps.map(m=>'<option value="'+m.id+'">'+escapeHtml(m.name)+' · Floor '+m.id+'</option>').join('');
  select.value=String(state.mapId);
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
    $('#mapInfo').textContent='目前可遇 Lv1：'+(okNames.slice(0,12).join('、')||'無')+(okNames.length>12?'…':'')+
      (okNames.length<allNames.length?'；另有 '+(allNames.length-okNames.length)+' 種需要出現條件道具。':'');
  }
  renderEnemy();
  renderTeam();
  renderPets();
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
  box.innerHTML='<div class="enemy-name">Lv1 '+escapeHtml(enemy.name)+'</div>'+
    '<div class="enemy-meta"><span class="pill">TempNo '+v.tempNo+'</span><span class="pill">EnemyID '+(v.enemyIds||[]).join(', ')+'</span><span class="pill">E_T_GET '+n(v.captureBase)+'</span></div>'+
    '<div class="enemy-hp">HP '+enemy.hp+' / '+enemy.maxHp+'</div>'+
    '<div class="progress"><i style="width:'+hpPct+'%"></i></div>';
  $('#battleState').textContent='戰鬥中';

  const c=captureChance();
  $('#captureChance').textContent='捕獲率：'+c.display.toFixed(1)+'%';
  if(c.missing?.length){
    $('#captureInfo').textContent='缺少條件道具：'+c.missing.map(x=>x.name||('Item '+x.id)).join('、');
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
  $('#activePetInfo').textContent=p?'出戰：'+p.name+' · Lv.'+p.level+' · 腕力 '+n(p.stats?.str)+' · 敏捷 '+n(p.stats?.dex):'尚未指定出戰寵物。';
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
    const r=await fetch(DATA_URL,{cache:'no-store'});
    if(!r.ok)throw new Error('HTTP '+r.status);
    db=await r.json();
    buildMaps();
    state=loadState();
    if(!maps.some(m=>String(m.id)===String(state.mapId)))state.mapId=maps[0]?.id||null;
    state.expNext=expToNext(state.level);
    renderMapOptions();
    addLog('V0.2 載入完成：正式 Lv1 資料 '+db.species.length+' 種，捕獲／隊伍系統已啟用。','good');
    render();
    timer=setInterval(tick,900);
  }catch(err){
    document.body.innerHTML='<main class="shell"><article class="card">資料讀取失敗：'+escapeHtml(err.message)+'</article></main>';
  }
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
