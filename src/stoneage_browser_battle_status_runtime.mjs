const BROWSER_BATTLE_STATUS_RUNTIME_FORMAT='stoneage-browser-battle-status-runtime-v1';
const ACTION_BATTLE_STATUS_TURN='BATTLE_STATUS_TURN';
const ACTION_BATTLE_STATUS_APPLY='BATTLE_STATUS_APPLY';
const ACTION_BATTLE_STATUS_APPLY_RAW='BATTLE_STATUS_APPLY_RAW';
import { battleTargetCheck } from './stoneage_browser_battle_target_runtime.mjs';

const BATTLE_COM_NONE=0;
const BATTLE_COM_ATTACK=1;

const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66ca';

const STATUS_NAMES=Object.freeze({
  poison:'毒',
  paralysis:'麻痺',
  sleep:'睡眠',
  stone:'石化',
  drunk:'酒醉',
  confusion:'混亂',
  weaken:'虛弱',
  deepPoison:'劇毒',
  barrier:'魔障',
  nocast:'沉默'
});

const TURN_SEQUENCE_STATUSES=Object.freeze(['poison','paralysis','sleep','stone','drunk','confusion']);
const CANNOT_MOVE_STATUSES=new Set(['paralysis','stone','sleep','barrier','dizzy','dragnet']);

const clone=value=>JSON.parse(JSON.stringify(value));
const numberOr=(value,fallback=null)=>{
  const n=Number(value);
  return Number.isFinite(n)?n:fallback;
};
const intOr=(value,fallback=null)=>{
  const n=numberOr(value,null);
  return n==null?fallback:Math.trunc(n);
};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function statusMap(entry){
  if(!entry||typeof entry!=='object')return null;
  if(!entry.battleStatus||typeof entry.battleStatus!=='object'||Array.isArray(entry.battleStatus)){
    entry.battleStatus={};
  }
  return entry.battleStatus;
}

function statusFromEntry(entry,type=null){
  if(!entry||typeof entry!=='object')return null;
  const direct=entry.battleStatus&&typeof entry.battleStatus==='object'?entry.battleStatus:null;
  if(type){
    const directTurns=intOr(direct?.[type],null);
    if(directTurns!=null&&directTurns>0)return {type,turns:directTurns,storage:'object'};
    const legacy=entry.status&&typeof entry.status==='object'?entry.status:null;
    const legacyTurns=intOr(legacy?.[type],null);
    if(legacyTurns!=null&&legacyTurns>0)return {type,turns:legacyTurns,storage:'legacy'};
    const ownTurns=intOr(entry?.[type],null);
    if(ownTurns!=null&&ownTurns>0)return {type,turns:ownTurns,storage:'direct'};
    return null;
  }
  for(const candidate of TURN_SEQUENCE_STATUSES){
    const found=statusFromEntry(entry,candidate);
    if(found)return found;
  }
  return null;
}

function battleHasAnyStatus(entry){
  for(const type of Object.keys(STATUS_NAMES)){
    if(statusFromEntry(entry,type))return true;
  }
  for(const key of ['dizzy','dragnet','instigate']){
    if(intOr(entry?.battleStatus?.[key],0)>0)return true;
  }
  return false;
}

function battleStatusActive(entry,type=null){
  if(type)return !!statusFromEntry(entry,type);
  return battleHasAnyStatus(entry);
}

function battleStatusCanMove(entry){
  for(const type of CANNOT_MOVE_STATUSES){
    if(statusFromEntry(entry,type))return false;
  }
  return true;
}

function statusRawStats(entry){
  const explicit=entry?.statusRawStats;
  if(explicit&&typeof explicit==='object'){
    return {
      vital:numberOr(explicit.vital,0),
      str:numberOr(explicit.str,0),
      tgh:numberOr(explicit.tgh,0),
      dex:numberOr(explicit.dex,0)
    };
  }
  const stats=entry?.stats;
  if(stats&&typeof stats==='object'){
    const scale=numberOr(entry?.statusStatsScale,1);
    return {
      vital:numberOr(stats.vital,0)*scale,
      str:numberOr(stats.str,0)*scale,
      tgh:numberOr(stats.tgh,0)*scale,
      dex:numberOr(stats.dex,0)*scale
    };
  }
  return {vital:0,str:0,tgh:0,dex:0};
}

function battleStatusPoisonDamage(entry){
  const hp=intOr(entry?.hp,0);
  if(hp<=0)return 0;
  const raw=statusRawStats(entry);
  const total=Math.trunc(raw.vital+raw.str+raw.dex+raw.tgh);
  let damage=Math.trunc((Math.trunc(total/100)-20)/4);
  if(damage<1)damage=1;
  if(hp<=damage)damage=hp-1;
  if(damage<0)damage=0;
  entry.hp=Math.max(1,hp-damage);
  return damage;
}

function battleStatusClear(entry,type=null){
  if(!entry?.battleStatus)return false;
  if(type==null){
    const had=Object.keys(entry.battleStatus).length>0;
    entry.battleStatus={};
    return had;
  }
  if(!Object.prototype.hasOwnProperty.call(entry.battleStatus,type))return false;
  delete entry.battleStatus[type];
  return true;
}

function battleStatusApplyRaw(entry,type,turns){
  if(!entry||!STATUS_NAMES[type]||battleHasAnyStatus(entry))return {ok:false,applied:false,reason:battleHasAnyStatus(entry)?'existing-status':'invalid-target'};
  const stored=Math.max(1,intOr(turns,0));
  statusMap(entry)[type]=stored;
  if(['paralysis','sleep','stone','barrier'].includes(type)&&entry.sourceType==='pet'){
    entry.guardThisTurn=false;
    entry.noGuardThisTurn=false;
    entry.chargeState=null;
  }
  return {ok:true,applied:true,type,turns:stored,raw:true};
}

function battleStatusApply(entry,type,turns){
  return battleStatusApplyRaw(entry,type,Math.max(1,intOr(turns,0)+1));
}

function battleStatusResist(entry,type){
  const objectResist=entry?.statusResist;
  if(objectResist&&typeof objectResist==='object'){
    const value=intOr(objectResist[type],null);
    if(value!=null)return value;
  }
  return 0;
}

function battleStatusLevel(entry){
  return Math.max(1,intOr(entry?.level,1));
}

function battleStatusLuck(entry){
  return intOr(entry?.fixedLuck??entry?.luck,0);
}

function battleStatusChance(attacker,target,type,{
  perOffset=30,
  range=40,
  bai=2,
  randomInt=null
}={}){
  if(!STATUS_NAMES[type])return {allowed:false,success:false,per:0,reason:'unsupported-status'};
  if(battleHasAnyStatus(target))return {allowed:false,success:false,per:0,reason:'existing'};

  const rng=typeof randomInt==='function'?randomInt:(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  const resist=battleStatusResist(target,type);

  if(type==='paralysis'){
    const per=20-resist;
    const roll=rng(1,100);
    return {allowed:true,success:roll<per,per,roll,resist};
  }

  const raw=statusRawStats(target);
  const total=raw.vital+raw.str+raw.tgh+raw.dex;
  const vitalShare=total>0?raw.vital/total:0;
  const vitalPenalty=(vitalShare/0.25)*10;
  let level=Math.trunc((battleStatusLevel(attacker)-battleStatusLevel(target))*bai);
  level=clamp(level,-range,range);
  const equipResist=numberOr(target?.statusEquipResist,0);
  const renocase=type==='weaken'?numberOr(target?.statusRenocase,0):0;
  let per=Math.trunc(perOffset+level+battleStatusLuck(attacker)-resist-vitalPenalty-equipResist-renocase);
  if(per>80)per=80;
  const roll=rng(1,100);
  return {
    allowed:true,success:roll<per,per,roll,resist,vitalPenalty,level,bai,range,perOffset,
    equipResist,renocase
  };
}

function findEntryByBid(context,bid){
  const target=intOr(bid,null);
  if(target==null)return null;
  for(const side of context?.context?.sides??[]){
    for(const entry of side?.entries??[]){
      if(entry&&intOr(entry.bid,null)===target)return {side,entry};
    }
  }
  return null;
}

function findActor(context,{battleBid=null,battleSide=null,battleSlot=null}={}){
  if(battleBid!=null)return findEntryByBid(context,battleBid);
  const sideNo=intOr(battleSide,null),slotNo=intOr(battleSlot,null);
  if(slotNo==null)return null;
  const side=(context?.context?.sides??[]).find(x=>sideNo==null?true:intOr(x?.side,null)===sideNo);
  const entry=side?.entries?.[slotNo]??null;
  return entry?{side,entry}:null;
}

function aliveTargetEntries(context,actor){
  const out=[];
  for(const side of context?.context?.sides??[]){
    for(const entry of side?.entries??[]){
      if(!entry||entry===actor)continue;
      if(intOr(entry.hp,0)<=0||entry.isDie===true)continue;
      out.push(entry);
    }
  }
  return out;
}

function confusionTarget(context,actor,randomInt){
  const rng=typeof randomInt==='function'?randomInt:(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  const sideRoll=rng(0,1);
  const posRoll=rng(0,9);
  const chosenSide=(context?.context?.sides??[]).find(side=>intOr(side?.side,null)===sideRoll)??null;
  if(!chosenSide)return {target:null,sideRoll,posRoll,probed:[]};
  const probes=[];
  let pos=posRoll;
  for(let loop=0;loop<10;loop++){
    pos=(pos+1)%10;
    const candidate=chosenSide.entries?.[pos]??null;
    probes.push(intOr(candidate?.bid,null));
    if(!candidate||candidate===actor)continue;
    const checked=battleTargetCheck(candidate);
    if(!checked.ok)continue;
    return {target:candidate,sideRoll,posRoll,probed:probes};
  }
  return {target:null,sideRoll,posRoll,probed:probes};
}

function processBattleStatusTurn(context,{battleBid=null,battleSide=null,battleSlot=null,randomInt=null}={}){
  if(!context?.context)return {ok:false,handled:false,action:ACTION_BATTLE_STATUS_TURN,reason:'battle-context-required'};
  const actorRef=findActor(context,{battleBid,battleSide,battleSlot});
  if(!actorRef)return {ok:false,handled:false,action:ACTION_BATTLE_STATUS_TURN,reason:'battle-actor-not-found'};

  const next=clone(context);
  const ref=findActor(next,{battleBid:actorRef.entry.bid,battleSide:actorRef.side.side,battleSlot:actorRef.entry.battleSlot});
  const actor=ref.entry;
  const before=statusFromEntry(actor);
  if(!before){
    return {
      ok:true,handled:true,action:ACTION_BATTLE_STATUS_TURN,stage:'battle-status-noop',
      battleContext:next.context,battleBid:actor.bid,status:null,skip:false,rngConsumedCount:0,persistentMutation:false,
      source:{repository:SOURCE_REPOSITORY,ref:SOURCE_REF}
    };
  }

  const blockedBefore=!battleStatusCanMove(actor);
  const type=before.type;
  const beforeTurns=before.turns;
  const map=statusMap(actor);
  map[type]=Math.max(0,beforeTurns-1);
  const afterTurns=map[type];
  let skip=blockedBefore;
  let rngConsumedCount=0;
  let extra={};

  if(afterTurns<=0){
    delete map[type];
    if(type==='drunk'){
      const rideActive=actor.ridePetActive===true;
      const rideQuick=intOr(actor.ridePetQuick,null);
      if(rideActive){
        if(rideQuick!=null){
          actor.quick=intOr(actor.quick,0)+rideQuick;
          extra.drunkReleaseMode='ride-pet-quick-add';
          extra.ridePetQuick=rideQuick;
        }else{
          extra.drunkReleaseMode='ride-pet-quick-pending';
        }
      }else{
        actor.quick=Math.trunc(intOr(actor.quick,0)*2);
        extra.drunkReleaseMode='no-ride-quick-double';
      }
      extra.drunkReleaseBoost=true;
    }
    if(type==='confusion'){
      extra.confusionExpired=true;
    }
    if(type==='poison'){
      extra.poisonTick=false;
    }
    return {
      ok:true,handled:true,action:ACTION_BATTLE_STATUS_TURN,stage:'battle-status-expired',
      battleContext:next.context,battleBid:actor.bid,status:type,beforeTurns,turnsAfter:0,skip,
      rngConsumedCount,persistentMutation:false,expired:true,source:{repository:SOURCE_REPOSITORY,ref:SOURCE_REF},...extra
    };
  }

  if(type==='poison'){
    const hpBefore=intOr(actor.hp,0);
    const damage=battleStatusPoisonDamage(actor);
    extra={poisonTick:true,poisonDamage:damage,hpBefore,hpAfter:intOr(actor.hp,0)};
  }else if(type==='confusion'){
    const roll=randomInt?randomInt(1,100):Math.floor(Math.random()*100)+1;
    rngConsumedCount+=1;
    if(roll<=80){
      const picked=confusionTarget(next,actor,randomInt);
      rngConsumedCount+=2;
      if(picked.target){
        actor.battleCommands=Array.isArray(actor.battleCommands)?actor.battleCommands.slice():[BATTLE_COM_NONE,-1,-1];
        actor.battleCommands[0]=BATTLE_COM_ATTACK;
        actor.battleCommands[1]=intOr(picked.target.bid,-1);
        extra={confusionForcedAttack:true,confusionRoll:roll,confusionTargetBid:intOr(picked.target.bid,-1),confusionProbe:picked.probed};
      }else{
        actor.battleCommands=Array.isArray(actor.battleCommands)?actor.battleCommands.slice():[BATTLE_COM_NONE,-1,-1];
        actor.battleCommands[0]=BATTLE_COM_ATTACK;
        actor.battleCommands[1]=-1;
        extra={confusionForcedAttack:true,confusionRoll:roll,confusionTargetBid:-1,confusionProbe:picked.probed};
      }
    }else{
      extra={confusionForcedAttack:false,confusionRoll:roll};
    }
  }else if(['paralysis','sleep','stone'].includes(type)){
    skip=true;
  }

  return {
    ok:true,handled:true,action:ACTION_BATTLE_STATUS_TURN,stage:'battle-status-processed',
    battleContext:next.context,battleBid:actor.bid,status:type,beforeTurns,turnsAfter:afterTurns,skip,
    rngConsumedCount,persistentMutation:false,expired:false,source:{repository:SOURCE_REPOSITORY,ref:SOURCE_REF},...extra
  };
}

function applyStatusChangeHit({
  attacker=null,
  target=null,
  type=null,
  turns=3,
  damage=0,
  randomInt=null,
  perOffset=30,
  range=40,
  bai=2
}={}){
  if(!attacker||!target||intOr(damage,0)<=0)return {ok:true,attempted:false,applied:false,reason:'no-positive-hit'};
  if(!STATUS_NAMES[type])return {ok:false,attempted:false,applied:false,reason:'unsupported-status',type};
  const check=battleStatusChance(attacker,target,type,{perOffset,range,bai,randomInt});
  if(!check.success)return {ok:true,attempted:true,applied:false,check,storedTurns:0};
  let storedTurns=Math.max(1,intOr(turns,0)+1);
  if(type==='drunk')storedTurns=Math.max(1,Math.trunc((Math.max(0,intOr(turns,0))+1)/2));
  const applied=type==='drunk'
    ?battleStatusApplyRaw(target,type,storedTurns)
    :battleStatusApply(target,type,turns);
  return {ok:true,attempted:true,applied:applied.applied,check,storedTurns};
}

function createBrowserBattleStatusRuntime(){
  return {
    ok:true,
    format:BROWSER_BATTLE_STATUS_RUNTIME_FORMAT,
    process:(context,options={})=>processBattleStatusTurn(context,options),
    apply:(entry,type,turns)=>battleStatusApply(entry,type,turns),
    applyRaw:(entry,type,turns)=>battleStatusApplyRaw(entry,type,turns),
    chance:(attacker,target,type,options={})=>battleStatusChance(attacker,target,type,options)
  };
}

export {
  BROWSER_BATTLE_STATUS_RUNTIME_FORMAT,
  ACTION_BATTLE_STATUS_TURN,
  ACTION_BATTLE_STATUS_APPLY,
  ACTION_BATTLE_STATUS_APPLY_RAW,
  STATUS_NAMES,
  TURN_SEQUENCE_STATUSES,
  BATTLE_COM_NONE,
  BATTLE_COM_ATTACK,
  battleHasAnyStatus,
  battleStatusActive,
  battleStatusCanMove,
  battleStatusPoisonDamage,
  battleStatusClear,
  battleStatusApply,
  battleStatusApplyRaw,
  battleStatusResist,
  battleStatusChance,
  processBattleStatusTurn,
  applyStatusChangeHit,
  createBrowserBattleStatusRuntime
};
