'use strict';
(() => {
  const KEY='afei_stoneage_world_v271';
  const canvas=document.getElementById('worldCanvas');
  const stage=document.getElementById('battleStage');
  if(!canvas||!stage)return;
  const ctx=canvas.getContext('2d');
  ctx.imageSmoothingEnabled=false;
  const W=960,H=540,G=24;
  const sprite={player:new Image(),pet:new Image(),enemy:new Image()};
  sprite.player.src='assets/player.svg';
  sprite.pet.src='assets/pet.svg';
  sprite.enemy.src='assets/enemy-dino.svg';
  let api=null,lastMapId=null,world=null,ready=false,moveLock=0,raf=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const now=()=>performance.now();
  const defaultWorld=()=>({mapId:null,x:50,y:58,dir:'down',steps:0,lastMoveAt:0,interactions:0});
  function load(){
    try{world=JSON.parse(localStorage.getItem(KEY)||'null')||defaultWorld()}catch{world=defaultWorld()}
  }
  function save(){try{localStorage.setItem(KEY,JSON.stringify(world))}catch{}}
  function mapSeed(id){let h=0; for(const c of String(id||'0'))h=(h*31+c.charCodeAt(0))|0; return Math.abs(h)||7}
  function seeded(x,y,s){const v=Math.sin((x*127.1+y*311.7+s*74.7))*43758.5453; return v-Math.floor(v)}
  function mapChanged(){
    if(!api)return false;
    const m=api.getCurrentMap?.();
    const id=m?.id??'unknown';
    if(lastMapId!==id){
      lastMapId=id;
      if(world.mapId!==id){
        world.mapId=id;
        world.x=50; world.y=58; world.dir='down'; world.steps=0;
        save();
      }
      return true;
    }
    return false;
  }
  function localPos(){return {x:clamp(world.x,4,96),y:clamp(world.y,8,94)}}
  function poiList(){
    const s=mapSeed(lastMapId);
    return [
      {x:17,y:74,r:7,type:'village',name:'部落入口',label:'村長',color:'#e7c56b'},
      {x:80,y:18,r:6,type:'healer',name:'休息小屋',label:'補給',color:'#8ccf74'},
      {x:66+(s%9),y:66-(s%11),r:5,type:'gather',name:'採集點',label:'採集',color:'#d6a35d'},
      {x:84,y:81,r:5,type:'sign',name:'告示牌',label:'任務',color:'#85b5dd'}
    ];
  }
  function nearPoi(){
    const p=localPos();let best=null,bd=999;
    for(const q of poiList()){
      const d=Math.hypot(p.x-q.x,p.y-q.y);
      if(d<bd){bd=d;best=q}
    }
    return best&&bd<=9?{poi:best,d}:null;
  }
  function drawTileField(seed){
    ctx.fillStyle='#4b7a43';ctx.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=G){
      for(let x=0;x<W;x+=G){
        const n=seeded(Math.floor(x/G),Math.floor(y/G),seed);
        ctx.fillStyle=n>.66?'#5b8a4b':n>.33?'#527f46':'#4f7941';
        ctx.fillRect(x,y,G,G);
        if(n>.86){ctx.fillStyle='#79a65b';ctx.fillRect(x+5,y+7,5,3);ctx.fillRect(x+13,y+13,3,3)}
      }
    }
    // water / shore
    ctx.fillStyle='#2c7f9d';
    ctx.beginPath();ctx.moveTo(0,H*.69);ctx.lineTo(W*.16,H*.61);ctx.lineTo(W*.34,H*.66);ctx.lineTo(W*.55,H*.6);ctx.lineTo(W*.72,H*.72);ctx.lineTo(W,H*.65);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.fill();
    ctx.fillStyle='#45a5bd';
    for(let i=0;i<10;i++){const yy=H*.73+i*18;const xx=((i*91+seed*13)%150)-20;ctx.fillRect(xx,yy,120,3)}
    // path
    ctx.fillStyle='#d7bb7d';
    ctx.beginPath();ctx.moveTo(W*.3,0);ctx.lineTo(W*.43,0);ctx.lineTo(W*.51,H*.25);ctx.lineTo(W*.43,H*.52);ctx.lineTo(W*.58,H*.73);ctx.lineTo(W*.5,H);ctx.lineTo(W*.27,H);ctx.lineTo(W*.36,H*.72);ctx.lineTo(W*.28,H*.47);ctx.lineTo(W*.37,H*.24);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(120,87,44,.15)';
    for(let i=0;i<24;i++){const x=(i*83+seed*7)%W,y=(i*47+seed*11)%(H*.95);ctx.fillRect(x,y,28,4)}
  }
  function drawTree(x,y,s=1){
    ctx.fillStyle='#68462c';ctx.fillRect(x-5*s,y+12*s,10*s,28*s);
    ctx.fillStyle='#2f6739';
    ctx.fillRect(x-19*s,y-13*s,38*s,26*s);ctx.fillRect(x-12*s,y-25*s,24*s,18*s);ctx.fillRect(x-28*s,y-3*s,20*s,14*s);ctx.fillRect(x+8*s,y-4*s,22*s,15*s);
    ctx.fillStyle='#477e43';ctx.fillRect(x-11*s,y-20*s,12*s,9*s);ctx.fillRect(x+8*s,y-10*s,10*s,8*s);
  }
  function drawRock(x,y,s=1){
    ctx.fillStyle='#7e7e6a';ctx.beginPath();ctx.moveTo(x-14*s,y+8*s);ctx.lineTo(x-10*s,y-5*s);ctx.lineTo(x+2*s,y-12*s);ctx.lineTo(x+15*s,y-4*s);ctx.lineTo(x+12*s,y+9*s);ctx.closePath();ctx.fill();
    ctx.fillStyle='#a2a08a';ctx.fillRect(x-4*s,y-6*s,7*s,4*s);
  }
  function drawHut(x,y,s=1){
    ctx.fillStyle='#7a5033';ctx.fillRect(x-27*s,y-3*s,54*s,33*s);
    ctx.fillStyle='#5c3e2a';ctx.beginPath();ctx.moveTo(x-34*s,y-3*s);ctx.lineTo(x,y-31*s);ctx.lineTo(x+34*s,y-3*s);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ad7547';ctx.fillRect(x-8*s,y+10*s,16*s,20*s);
  }
  function drawSign(x,y){
    ctx.fillStyle='#6b482e';ctx.fillRect(x-3,y,6,26);ctx.fillStyle='#d3b77a';ctx.fillRect(x-24,y-18,48,18);ctx.fillStyle='#4f3b24';ctx.fillRect(x-14,y-13,28,3)}
  function drawNpc(x,y,color,label){
    ctx.fillStyle='#2d2419';ctx.fillRect(x-5,y-2,10,17);ctx.fillStyle=color;ctx.fillRect(x-8,y-18,16,13);ctx.fillStyle='#efe4bf';ctx.fillRect(x-6,y-15,12,8);ctx.fillStyle='#362417';ctx.fillRect(x-6,y+15,5,8);ctx.fillRect(x+1,y+15,5,8);
    ctx.font='bold 12px "Microsoft JhengHei",sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff1b0';ctx.strokeStyle='#182316';ctx.lineWidth=3;ctx.strokeText(label,x,y-28);ctx.fillText(label,x,y-28);
  }
  function encounterRects(){
    const m=api?.getCurrentEncounter?.(); if(!m?.area)return [];
    const a=m.area; const x1=clamp(num(a.xMin),0,100),x2=clamp(num(a.xMax),0,100),y1=clamp(num(a.yMin),0,100),y2=clamp(num(a.yMax),0,100);
    // Represent the server encounter rectangle proportionally in our local world.
    return [{x:(x1+x2)/2/100*W-((x2-x1)/100*W)/2,y:(y1+y2)/2/100*H-((y2-y1)/100*H)/2,w:(x2-x1)/100*W,h:(y2-y1)/100*H}];
  }
  function drawEncounterZones(){
    const rects=encounterRects();
    for(const r of rects){
      ctx.save();ctx.fillStyle='rgba(228,137,83,.07)';ctx.strokeStyle='rgba(237,183,108,.22)';ctx.lineWidth=2;ctx.setLineDash([6,8]);ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeRect(r.x,r.y,r.w,r.h);ctx.restore();
    }
  }
  function drawMiniLabel(x,y,text,color){ctx.font='bold 10px "Microsoft JhengHei",sans-serif';ctx.textAlign='center';ctx.fillStyle=color;ctx.strokeStyle='#182016';ctx.lineWidth=3;ctx.strokeText(text,x,y);ctx.fillText(text,x,y)}
  function imgReady(im){return im.complete&&im.naturalWidth>0}
  function drawSprite(im,x,y,w,h,flip=false){if(!imgReady(im))return;ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.drawImage(im,-w/2,-h,w,h);ctx.restore()}
  function render(){
    if(!world)return;
    mapChanged();
    const s=mapSeed(lastMapId), p=localPos();
    ctx.clearRect(0,0,W,H);
    drawTileField(s);
    // environmental props
    const props=[
      [70,22,1.05],[91,24,.85],[11,29,.8],[20,18,.68],[88,52,1],[8,58,.72],[57,16,.72],[74,44,.74],[42,70,.62]
    ];
    props.forEach(([x,y,sc],i)=>drawTree(x/100*W,y/100*H,sc*(.85+(i%3)*.07)));
    [[25,47,.8],[52,35,.7],[76,55,.9],[61,83,.65],[31,80,.6]].forEach(([x,y,sc])=>drawRock(x/100*W,y/100*H,sc));
    drawHut(15/100*W,72/100*H,.9);drawHut(82/100*W,15/100*H,.72);drawSign(84/100*W,80/100*H);
    drawEncounterZones();
    // points of interest / NPCs
    const ps=poiList();drawNpc(ps[0].x/100*W,ps[0].y/100*H,'#c78b4d','村長');drawNpc(ps[1].x/100*W,ps[1].y/100*H,'#6fbf6b','補給');drawNpc(ps[3].x/100*W,ps[3].y/100*H,'#6da1cb','任務');
    // gather marker
    const g=ps[2];const gx=g.x/100*W,gy=g.y/100*H;ctx.fillStyle='#dca25b';ctx.beginPath();ctx.arc(gx,gy,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#5a3e1e';ctx.fillRect(gx-2,gy-16,4,8);drawMiniLabel(gx,gy-20,'採集','#ffe5a0');
    // player + pet
    const px=p.x/100*W,py=p.y/100*H;
    ctx.fillStyle='rgba(25,34,23,.45)';ctx.beginPath();ctx.ellipse(px,py+7,28,9,0,0,Math.PI*2);ctx.fill();
    drawSprite(sprite.pet,px-28,py+3,56,50,world.dir==='left');
    drawSprite(sprite.player,px+12,py,62,62,world.dir==='left');
    drawMiniLabel(px+12,py-40,'阿肥','#fff2af');
    const near=nearPoi();
    ctx.save();ctx.font='bold 12px "Microsoft JhengHei",sans-serif';ctx.textAlign='left';
    const hint=near?'按 E／◆ '+near.poi.name:'WASD／方向鍵移動';
    ctx.fillStyle='rgba(10,16,10,.75)';ctx.fillRect(18,H-42,260,26);ctx.fillStyle='#f1d18a';ctx.fillText(hint,28,H-24);ctx.restore();
    const modeEl=document.getElementById('worldMode');const coordEl=document.getElementById('worldCoords');if(modeEl)modeEl.textContent=near?near.poi.name:(api?.hasEnemy?.()?'戰鬥中':'自由探索');if(coordEl)coordEl.textContent=Math.round(p.x)+','+Math.round(p.y);if(worldInteractionTitle){worldInteractionTitle.textContent=near?near.poi.name:'自由探索'}
    if(worldInteractionHint){worldInteractionHint.textContent=near?'靠近後按 E 或中間 ◆ 互動':'WASD／方向鍵移動 · 點擊地圖也能走'}
    // Keep mini-map marker synced for player-facing layer.
    const mm=document.querySelector('.mm-player');if(mm){mm.style.left=clamp(p.x,2,98)+'%';mm.style.top=clamp(p.y,2,98)+'%'}
  }
  function persist(){save(); api?.save?.();}
  function canMove(){return !!api&&!api.hasEnemy?.()&&api.getState?.()}
  function ensureWorld(){
    if(!world)load();
    if(api?.ensureNewPlayerDefaults)api.ensureNewPlayerDefaults();
  }
  function step(dx,dy){
    if(!canMove())return;
    if(now()<moveLock)return;
    const s=api.getState();
    if(!s)return;
    if(!(s.playerCreationStatsConfigured&&s.playerHometownConfigured&&s.playerElementsConfigured)){
      api.addLog?.('請先完成角色建立；新角色通常會自動使用安全預設。','bad');return;
    }
    moveLock=now()+105;
    world.x=clamp(world.x+dx,4,96);world.y=clamp(world.y+dy,8,94);world.dir=dx<0?'left':dx>0?'right':dy<0?'up':'down';world.steps++;world.lastMoveAt=Date.now();
    if(world.steps%3===0){
      const spawned=api.moveEncounterStep?.();
      if(spawned){api.addLog?.('你在野外移動時遭遇敵人。','bad');}
    }
    persist();render();
  }
  function interact(){
    const n=nearPoi(); if(!n){api?.addLog?.('附近沒有可以互動的 NPC 或地點。');return}
    world.interactions++;
    const t=n.poi.type;
    if(t==='village'){api.addLog?.('村長：歡迎來到部落。把隊伍整理好，再去外面狩獵吧。','good');}
    else if(t==='healer'){const s=api.getState?.();if(s){s.hp=s.maxHp;s.mp=s.maxMp;for(const p of s.petBox||[]){p.hp=p.maxHp}api.addLog?.('補給小屋：角色與寵物都已休息補滿。','good');api.save?.();api.render?.()}}
    else if(t==='gather'){const s=api.getState?.();if(s){s.gold=(num(s.gold)+5);api.addLog?.('採集到一些原始素材，換得 5 石幣。','pet');api.save?.();api.render?.()}}
    else if(t==='sign'){api.addLog?.('告示牌：沿著道路前進，狩獵區就在前方。','good')}
    persist();render();
  }
  function moveToCanvas(ev){
    if(!canMove())return;
    const r=canvas.getBoundingClientRect();const tx=(ev.clientX-r.left)/r.width*100;const ty=(ev.clientY-r.top)/r.height*100;const p=localPos();
    const dx=tx-p.x,dy=ty-p.y; if(Math.abs(dx)>Math.abs(dy)){step(dx<0?-3:3,0)}else{step(0,dy<0?-3:3)}
  }
  function bind(){
    document.querySelectorAll('[data-world-dir]').forEach(b=>{
      const d=b.dataset.worldDir;const map={up:[0,-3],down:[0,3],left:[-3,0],right:[3,0]};
      b.addEventListener('click',()=>step(...map[d]));
    });
    document.querySelector('[data-world-action="interact"]')?.addEventListener('click',interact);
    canvas.addEventListener('click',moveToCanvas);
    window.addEventListener('keydown',e=>{
      const k=e.key.toLowerCase();let d=null;
      if(k==='arrowup'||k==='w')d='up';if(k==='arrowdown'||k==='s')d='down';if(k==='arrowleft'||k==='a')d='left';if(k==='arrowright'||k==='d')d='right';
      if(k==='e'){e.preventDefault();interact();return}
      if(d){e.preventDefault();const m={up:[0,-3],down:[0,3],left:[-3,0],right:[3,0]}[d];step(...m)}
    },{passive:false});
    document.getElementById('autoBtn')?.addEventListener('click',()=>setTimeout(render,20));
    document.getElementById('mapSelect')?.addEventListener('change',()=>setTimeout(()=>{mapChanged();render()},20));
  }
  function loop(){
    render();raf=requestAnimationFrame(loop);
  }
  const worldInteractionTitle=document.getElementById('worldInteractionTitle');
  const worldInteractionHint=document.getElementById('worldInteractionHint');
  function boot(){
    const started=Date.now();
    const wait=()=>{
      api=window.AfeiGameAPI;
      if(api?.getState?.()){
        ensureWorld();load();
        if(!world.mapId){world.mapId=api.getCurrentMap?.()?.id||null;save()}
        bind();ready=true;render();cancelAnimationFrame(raf);loop();return;
      }
      if(Date.now()-started<15000){setTimeout(wait,120)}
    };
    load();wait();
  }
  boot();
})();
