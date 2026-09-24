'use strict';

const DATA_URL='data/generated/stoneage_general_lv1_pets.json';
let db=null;
const $=s=>document.querySelector(s);
const fmt=n=>Number.isFinite(Number(n))?new Intl.NumberFormat('zh-TW',{maximumFractionDigits:2}).format(Number(n)):'—';
const pct=n=>Number.isFinite(Number(n))?Number(n).toFixed(Number(n)<.1?4:2)+'%':'—';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function boot(){
  try{
    const r=await fetch(DATA_URL,{cache:'no-store'});
    if(!r.ok)throw new Error('HTTP '+r.status);
    db=await r.json();
    $('#dbStatus').textContent='資料庫已載入 · '+db.species.length+' 種';
    buildFilters(); render();
  }catch(err){
    $('#dbStatus').textContent='資料讀取失敗';
    $('#petGrid').innerHTML='<div class="note">無法讀取 '+esc(DATA_URL)+'：'+esc(err.message)+'</div>';
  }
}
function allVariants(){return db.species.flatMap(s=>s.wildLv1Variants.map(v=>({species:s,variant:v})))}
function buildFilters(){
  const maps=new Map();
  for(const {variant} of allVariants())for(const r of variant.routes)maps.set(r.floorId,r.mapName||('Floor '+r.floorId));
  const select=$('#mapFilter');
  [...maps].sort((a,b)=>a[0]-b[0]).forEach(([id,name])=>{
    const o=document.createElement('option');o.value=id;o.textContent=name+' · '+id;select.appendChild(o);
  });
}
function currentRows(){
  const q=$('#searchInput').value.trim().toLowerCase(), floor=$('#mapFilter').value;
  return db.species.filter(s=>{
    const text=[s.clientLabel,s.animationGroupId,...s.wildLv1Variants.flatMap(v=>[
      v.tempNo,v.serverName,...v.enemyIds,...v.routes.flatMap(r=>[r.floorId,r.mapName])
    ])].join(' ').toLowerCase();
    const qok=!q||text.includes(q);
    const fok=!floor||s.wildLv1Variants.some(v=>v.routes.some(r=>String(r.floorId)===floor));
    return qok&&fok;
  });
}
function bestRoute(s){
  return s.wildLv1Variants.flatMap(v=>v.bestRoute?[{v,r:v.bestRoute}]:[]).sort((a,b)=>a.r.expectedStepsToAppearance-b.r.expectedStepsToAppearance)[0]||null;
}
function render(){
  const rows=currentRows(), validation=db._meta.validation;
  $('#summary').innerHTML=[
    ['顯示寵物',rows.length],['正式物種',validation.actual.species],['TempNo',validation.actual.variants],['有效地圖',validation.actual.floors]
  ].map(([a,b])=>'<div class="summary-card"><strong>'+b+'</strong><span>'+a+'</span></div>').join('');
  $('#petGrid').innerHTML=rows.map(s=>{
    const br=bestRoute(s),multi=s.wildLv1Variants.length;
    return '<article class="pet-card" data-anim="'+s.animationGroupId+'">'+
      '<div class="pet-name"><b>'+esc(s.clientLabel)+'</b><span class="id">'+s.animationGroupId+'</span></div>'+
      '<div class="badges"><span class="badge">'+multi+' TempNo</span>'+
      (br?'<span class="badge accent">'+pct(br.r.battleAppearancePercent)+'/場</span>':'')+'</div>'+
      (br?'<div class="route">最佳：<strong>'+esc(br.r.mapName||('Floor '+br.r.floorId))+'</strong><br>平均約 '+fmt(br.r.expectedBattlesToAppearance)+' 場遇到 Lv1</div>':'')+
    '</article>';
  }).join('');
  document.querySelectorAll('.pet-card').forEach(el=>el.addEventListener('click',()=>openPet(Number(el.dataset.anim))));
  renderMaps(); renderValidation();
}
function renderMaps(){
  const map=new Map();
  for(const s of db.species)for(const v of s.wildLv1Variants)for(const r of v.routes){
    if(!map.has(r.floorId))map.set(r.floorId,{name:r.mapName||('Floor '+r.floorId),pets:new Set(),routes:0});
    const m=map.get(r.floorId);m.pets.add(s.clientLabel);m.routes++;
  }
  $('#mapList').innerHTML=[...map].sort((a,b)=>a[0]-b[0]).map(([id,m])=>
    '<article class="map-card"><div class="map-title"><b>'+esc(m.name)+'</b><span class="id">'+id+'</span></div>'+
    '<div class="muted">'+m.pets.size+' 種 Lv1 · '+m.routes+' 條路線情境</div>'+
    '<div class="map-pets">'+[...m.pets].sort().map(n=>'<span class="badge">'+esc(n)+'</span>').join('')+'</div></article>'
  ).join('');
}
function renderValidation(){
  const v=db._meta.validation;
  const checks=[
    ['Species',v.actual.species,v.expected.species],['TempNo',v.actual.variants,v.expected.variants],
    ['EnemyID',v.actual.enemyIds,v.expected.enemyIds],['Floor',v.actual.floors,v.expected.floors]
  ];
  $('#validation').innerHTML=checks.map(([n,a,e])=>
    '<div class="'+(a===e?'ok':'warn')+'"><strong>'+a+' / '+e+'</strong><div class="muted">'+n+'</div></div>'
  ).join('')+
  '<div class="'+(v.pass?'ok':'warn')+'"><strong>'+(v.pass?'PASS':'FAIL')+'</strong><div class="muted">整體驗證</div></div>';
}
function openPet(anim){
  const s=db.species.find(x=>x.animationGroupId===anim);if(!s)return;
  $('#petDetail').innerHTML='<div class="eyebrow">ANIMATION '+s.animationGroupId+'</div><h2 class="detail-title">'+esc(s.clientLabel)+'</h2>'+
  (s.aliases?.length?'<div class="muted">別名：'+s.aliases.map(esc).join('、')+'</div>':'')+
  s.wildLv1Variants.map(v=>{
    const st=v.stats||{},el=v.elements||{};
    return '<section class="variant"><h3>TempNo '+v.tempNo+' · '+esc(v.serverName)+'</h3>'+
      '<div class="badges"><span class="badge">EnemyID '+v.enemyIds.join(', ')+'</span><span class="badge">成長 '+fmt(v.wildGrowth)+'</span><span class="badge">E_T_GET '+fmt(v.captureBase)+'</span></div>'+
      '<div class="stat-grid" style="margin-top:10px">'+
        stat('體',st.vital)+stat('腕',st.str)+stat('耐',st.tgh)+stat('敏',st.dex)+
        stat('地',el.earth)+stat('水',el.water)+stat('火',el.fire)+stat('風',el.wind)+
      '</div>'+
      '<div class="badges">'+(v.skills||[]).map(x=>'<span class="badge">'+esc(x.name||('Skill '+x.id))+'</span>').join('')+'</div>'+
      (v.captureRule?'<div class="note" style="margin-top:10px"><b>捕獲道具：</b> '+(v.captureRule.requiresAllItems||[]).map(x=>esc(x?.name||('Item '+x?.id))).join(' + ')+'</div>':'')+
      '<div class="routes">'+v.routes.map(r=>'<div class="route-row"><b>'+esc(r.mapName||('Floor '+r.floorId))+'</b> · Floor '+r.floorId+
      '<br>區域 X '+r.area.xMin+'–'+r.area.xMax+' / Y '+r.area.yMin+'–'+r.area.yMax+
      '<br>每場至少出現一隻 Lv1：<b>'+pct(r.battleAppearancePercent)+'</b> · 平均 '+fmt(r.expectedBattlesToAppearance)+' 場'+
      (r.appearanceInventoryItems?.length?'<br>出現需：'+r.appearanceInventoryItems.map(x=>esc(x?.name||('Item '+x?.id))).join(' + '):'')+
      '</div>').join('')+'</div></section>';
  }).join('');
  $('#petDialog').showModal();
}
function stat(name,value){return '<div class="stat"><small>'+name+'</small><b>'+fmt(value)+'</b></div>'}

document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id===b.dataset.tab));
}));
$('#searchInput').addEventListener('input',render);
$('#mapFilter').addEventListener('change',render);
$('#closeDialog').addEventListener('click',()=>$('#petDialog').close());
$('#petDialog').addEventListener('click',e=>{if(e.target===$('#petDialog'))$('#petDialog').close()});
boot();
