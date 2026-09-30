const NPC_INTERACTION_RUNTIME_FORMAT='stoneage-npc-interaction-runtime-v1';

const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const intOr=(v,f=0)=>Number.isFinite(Number(v))?Math.trunc(Number(v)):f;

function normalizePoint(value){
  if(!Array.isArray(value)||value.length<3)return null;
  const floor=intOr(value[0],-1),x=intOr(value[1],-1),y=intOr(value[2],-1);
  return floor<0||x<0||y<0?null:{floor,x,y};
}

function normalizeNpc(npc){
  if(!isObject(npc))return null;
  const raw=Array.isArray(npc.npc)?npc.npc:null;
  const floor=intOr(npc.floor,-1);
  const point=raw&&raw.length>=2?{floor,x:intOr(raw[0],-1),y:intOr(raw[1],-1)}:null;
  if(!point||floor<0||point.x<0||point.y<0)return null;
  point.floor=floor;
  return {...npc,point};
}

function normalizePlayer(player){
  if(!isObject(player))return null;
  const floor=intOr(player.floor??player.floorId,-1);
  const x=intOr(player.x,-1),y=intOr(player.y,-1);
  if(floor<0||x<0||y<0)return null;
  const facing=normalizePoint(player.facingCell);
  return {floor,x,y,facingCell:facing};
}

function manhattan(a,b){
  if(!a||!b||a.floor!==b.floor)return Infinity;
  return Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
}

function parseInteractionRule(rule){
  const text=String(rule??'').trim();
  if(!text||/^unresolved:/i.test(text))return {ok:false,reason:'interaction-rule-unresolved',rule:text||null};
  const m=text.match(/distance\s*=\s*(\d+)|<=\s*(\d+)/i);
  const distance=m?intOr(m[1]??m[2],1):null;
  return {ok:true,rule:text,distance};
}

function canInteractWithNpc(npc,player,{interactionRule=null,maxDistance=null}={}){
  const normalizedNpc=normalizeNpc(npc);
  if(!normalizedNpc)return {ok:false,interactable:false,reason:'invalid-npc-coordinate'};
  if(normalizedNpc.runtimeModuleStatus==='unresolved_in_npctemplate_functionSet'){
    return {ok:true,interactable:false,reason:'npc-runtime-module-unresolved',npc:normalizedNpc};
  }
  const normalizedPlayer=normalizePlayer(player);
  if(!normalizedPlayer)return {ok:false,interactable:false,reason:'invalid-player-coordinate'};
  if(normalizedNpc.point.floor!==normalizedPlayer.floor){
    return {ok:true,interactable:false,reason:'different-floor'};
  }
  if(normalizedNpc.point.x===normalizedPlayer.x&&normalizedNpc.point.y===normalizedPlayer.y){
    return {ok:true,interactable:false,reason:'same-cell'};
  }
  const parsed=parseInteractionRule(interactionRule);
  if(!parsed.ok)return {ok:true,interactable:false,reason:parsed.reason,npc:normalizedNpc};
  const limit=maxDistance==null?parsed.distance:intOr(maxDistance,-1);
  if(limit<0)return {ok:false,interactable:false,reason:'interaction-distance-required'};
  const distance=manhattan(normalizedNpc.point,normalizedPlayer);
  if(distance>limit)return {ok:true,interactable:false,reason:'out-of-range',distance,limit};
  const requiresFacing=/front|facing|charIsInFrontOfChar/i.test(parsed.rule);
  if(requiresFacing){
    if(!normalizedPlayer.facingCell)return {ok:true,interactable:false,reason:'facing-cell-required',distance,limit};
    const facingDistance=manhattan(normalizedNpc.point,normalizedPlayer.facingCell);
    if(facingDistance!==0)return {ok:true,interactable:false,reason:'npc-not-in-facing-cell',distance,limit,facingCell:normalizedPlayer.facingCell};
  }
  return {ok:true,interactable:true,reason:'source-interaction-gate-passed',distance,limit,facingRequired:requiresFacing};
}

function buildInteractionRequest(npc,player,{interactionRule,maxDistance,action='talk'}={}){
  const gate=canInteractWithNpc(npc,player,{interactionRule,maxDistance});
  if(!gate.ok||!gate.interactable)return {...gate,action,request:null};
  return {
    ok:true,
    interactable:true,
    action:String(action),
    request:{
      npcId:npc.path?npc.path+'#'+intOr(npc.blockIndex,0):String(npc.id??''),
      template:npc.template??npc.templateName??null,
      action:String(action),
      point:{...gate.npc.point},
      distance:gate.distance
    }
  };
}

export {
  NPC_INTERACTION_RUNTIME_FORMAT,
  normalizeNpc,
  normalizePlayer,
  manhattan,
  parseInteractionRule,
  canInteractWithNpc,
  buildInteractionRequest
};
