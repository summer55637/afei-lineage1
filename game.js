'use strict';

const DATA_URL='data/generated/stoneage_general_lv1_pets.json';
const SAVE_KEY='afei_stoneage_idle_v01';
let db=null, maps=[], state=null, enemy=null, timer=null;

const $=s=>document.querySelector(s);
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;

function freshState(){
  return {level:1,exp:0,expNext:100,hp:120,maxHp:120,attack:18,defense:5,gold:0,battles:0,wins:0,mapId:null,auto:true,pets:{},log:[],savedAt:Date.now()};
}
function loadState(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(!raw)return freshState();
    return Object.assign(freshState(),JSON.parse(raw));
  }catch(e){return freshState()}
}
function save(){
  state.savedAt=Date.now();
  localStorage.setItem(SAVE_KEY,JSON.stringify(state));
}
function addLog(text,type){
  const stamp=new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  state.log.unshift({text:'['+stamp+'] '+text,type:type||''});
  state.log=state.log.slice(0,80);
  renderLog();
  save();
}
function buildMaps(){
  const m=new Map();
  for(const species of db.species){
    for(const variant of species.wildLv1Variants||[]){
      for(const route of variant.routes||[]){
        const id=String(route.floorId);
        if(!m.has(id))m.set(id,{id:id,name:route.mapName||('Floor '+id),entries:[]});
        m.get(id).entries.push({species:species,variant:variant,route:route});
      }
    }
  }
  maps=[...m.values()].sort((a,b)=>Number(a.id)-Number(b.id));
}
function currentMap(){return maps.find(x=>String(x.id)===String(state.mapId))||maps[0]}
function expToNext(level){return 100+Math.max(0,level-1)*45}

function spawnEnemy(){
  const map=currentMap();
  if(!map||!map.entries.length)return;
  const entry=map.entries[rnd(0,map.entries.length-1)];
  const st=entry.variant.stats||{};
  const vit=Math.max(1,n(st.vital)||8);
  const str=Math.max(1,n(st.str)||6);
  const tgh=Math.max(1,n(st.tgh)||6);
  const hp=Math.max(35,Math.round(28+vit*5.5));
  enemy={
    entry:entry,
    name:entry.species.clientLabel||entry.variant.serverName||('TempNo '+entry.variant.tempNo),
    hp:hp,maxHp:hp,
    attack:Math.max(3,Math.round(3+str*.62)),
    defense:Math.max(0,Math.round(tgh*.28))
  };
  state.battles++;
  addLog('遭遇 Lv1 '+enemy.name+'。');
  render();
}
function playerDamage(){
  return Math.max(1,Math.round(state.attack-enemy.defense+rnd(-2,4)));
}
function enemyDamage(){
  return Math.max(1,Math.round(enemy.attack-state.defense*.45+rnd(-2,2)));
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
    leveled=true;
  }
  if(leveled)addLog('升級！目前 Lv.'+state.level+'，HP 已補滿。','good');
}
function winBattle(){
  const growth=Math.max(1,n(enemy.entry.variant.wildGrowth)||1);
  const exp=Math.max(6,Math.round(7+growth*2.2));
  const gold=rnd(2,6);
  state.wins++;
  state.exp+=exp;
  state.gold+=gold;
  addLog('擊敗 '+enemy.name+'，獲得 '+exp+' EXP、'+gold+' 石幣。','good');

  const catchChance=.15;
  if(Math.random()<catchChance){
    const key=String(enemy.entry.species.animationGroupId);
    if(!state.pets[key])state.pets[key]={name:enemy.name,count:0,animationGroupId:enemy.entry.species.animationGroupId};
    state.pets[key].count++;
    addLog('測試收服成功：'+enemy.name+' ×1。','good');
  }
  enemy=null;
  levelCheck();
  save();
  render();
}
function defeat(){
  addLog('角色體力不足，已自動回村休息並補滿 HP。','bad');
  state.hp=state.maxHp;
  enemy=null;
  save();
  render();
}
function tick(){
  if(!state||!state.auto)return;
  if(state.hp<=0){defeat();return}
  if(!enemy){spawnEnemy();return}
  const dmg=playerDamage();
  enemy.hp=Math.max(0,enemy.hp-dmg);
  if(enemy.hp<=0){winBattle();return}
  const back=enemyDamage();
  state.hp=Math.max(0,state.hp-back);
  addLog('你造成 '+dmg+' 傷害；'+enemy.name+' 反擊 '+back+'。',state.hp<=0?'bad':'');
  if(state.hp<=0)defeat();
  render();
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
  $('#wins').textContent=state.wins;
  $('#battles').textContent=state.battles;
  $('#hpBar').style.width=clamp(state.hp/state.maxHp*100,0,100)+'%';
  $('#autoBtn').textContent='自動戰鬥：'+(state.auto?'開':'關');

  const map=currentMap();
  if(map){
    $('#mapPetCount').textContent=map.entries.length+' 條 Lv1 路線';
    const names=[...new Set(map.entries.map(x=>x.species.clientLabel))];
    $('#mapInfo').textContent='可遇到 '+names.length+' 種 Lv1：'+names.slice(0,12).join('、')+(names.length>12?'…':'');
  }
  renderEnemy();
  renderPets();
  renderLog();
}
function renderEnemy(){
  const box=$('#enemyBox');
  if(!enemy){
    box.className='enemy empty';
    box.innerHTML='<div class="enemy-name">等待下一次遭遇</div><div class="muted">'+(state.auto?'自動戰鬥運作中。':'目前已暫停。')+'</div>';
    $('#battleState').textContent=state.auto?'自動中':'已暫停';
    return;
  }
  const v=enemy.entry.variant;
  const hpPct=clamp(enemy.hp/enemy.maxHp*100,0,100);
  box.className='enemy';
  box.innerHTML='<div class="enemy-name">Lv1 '+escapeHtml(enemy.name)+'</div>'+
    '<div class="enemy-meta"><span class="pill">TempNo '+v.tempNo+'</span><span class="pill">EnemyID '+(v.enemyIds||[]).join(', ')+'</span></div>'+
    '<div class="enemy-hp">HP '+enemy.hp+' / '+enemy.maxHp+'</div>'+
    '<div class="progress"><i style="width:'+hpPct+'%"></i></div>';
  $('#battleState').textContent='戰鬥中';
}
function renderPets(){
  const values=Object.values(state.pets||{}).sort((a,b)=>b.count-a.count||String(a.name).localeCompare(String(b.name),'zh-Hant'));
  $('#petTotal').textContent=values.reduce((s,x)=>s+x.count,0);
  $('#petBox').innerHTML=values.length?values.map(p=>'<div class="pet-row"><b>'+escapeHtml(p.name)+'</b><span>Animation '+p.animationGroupId+' · ×'+p.count+'</span></div>').join(''):'<div class="empty-note">目前還沒有寵物。</div>';
}
function renderLog(){
  if(!state)return;
  $('#battleLog').innerHTML=(state.log||[]).map(x=>'<div class="log-line '+(x.type||'')+'">'+escapeHtml(x.text)+'</div>').join('');
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
    addLog('遊戲資料載入完成：'+db.species.length+' 種 Lv1 外觀種。','good');
    render();
    timer=setInterval(tick,900);
  }catch(err){
    document.body.innerHTML='<main class="shell"><article class="card">資料讀取失敗：'+escapeHtml(err.message)+'</article></main>';
  }
}
$('#mapSelect').addEventListener('change',e=>{
  state.mapId=e.target.value;
  enemy=null;
  addLog('前往 '+currentMap().name+'。');
  save();render();
});
$('#autoBtn').addEventListener('click',()=>{
  state.auto=!state.auto;
  addLog('自動戰鬥已'+(state.auto?'開啟。':'暫停。'));
  save();render();
});
$('#healBtn').addEventListener('click',()=>{
  state.hp=state.maxHp;
  addLog('休息完成，HP 已補滿。','good');
  save();render();
});
window.addEventListener('beforeunload',save);
boot();
