const BROWSER_BATTLE_END_RUNTIME_FORMAT='stoneage-v408-browser-battle-end-v1';
const ACTION_BATTLE_END_PLAN='BATTLE_END_PLAN';

const SIDE_PLAYER=0;
const SIDE_ENEMY=1;
const SIDE_OFFSET=10;

const int=value=>{
  if(value==null||String(value).trim()==='')return null;
  const n=Number(value);
  return Number.isFinite(n)?Math.trunc(n):null;
};

const clone=value=>JSON.parse(JSON.stringify(value));
const sourceType=entry=>String(entry?.sourceType??'').trim().toLowerCase();
const isPet=entry=>sourceType(entry)==='pet';
const isDead=entry=>entry?.isDie===true;
const isRescue=entry=>String(entry?.battleMode??'').trim().toLowerCase()==='rescue';
const relifeCount=entry=>Math.max(0,int(entry?.relife??entry?.workRelife)??0);

function findSide(context,side){
  const s=int(side);
  return context?.context?.sides?.find(x=>Number(x?.side)===s)??null;
}

function bidFor(side,slot){
  return int(side)===1?SIDE_OFFSET+slot:slot;
}

function analyzeSide(context,side){
  const s=findSide(context,side);
  if(!s){
    return {ok:false,reason:'battle-side-missing',side:int(side)};
  }
  if(!Array.isArray(s.entries)||s.entries.length!==10){
    return {ok:false,reason:'battle-side-entries-invalid',side:int(side)};
  }

  let count=0;
  let onlyRescue=1;
  const aliveBids=[];
  const deadBids=[];
  const rescueCleanupBids=[];
  const relifeBids=[];

  for(let slot=0;slot<s.entries.length;slot++){
    const entry=s.entries[slot];
    if(!entry)continue;
    if(isPet(entry))continue;

    if(typeof entry.isDie!=='boolean'){
      return {ok:false,reason:'death-state-required',side:int(side),bid:bidFor(side,slot)};
    }

    const bid=int(entry.bid??bidFor(side,slot));
    const dead=isDead(entry);
    if(dead)deadBids.push(bid);

    const relife=relifeCount(entry);
    if(relife>0){
      count+=1;
      relifeBids.push(bid);
    }

    if(!dead){
      count+=1;
      aliveBids.push(bid);
      if(isRescue(entry)===false)onlyRescue=0;
    }
  }

  const onlyRescueFlag=count>0&&onlyRescue===1;
  if(onlyRescueFlag){
    for(const bid of deadBids)rescueCleanupBids.push(bid);
  }

  return {
    ok:true,
    side:int(side),
    participantCount:count,
    aliveBids,
    deadBids,
    relifeBids,
    onlyRescue:onlyRescueFlag,
    rescueCleanupBids
  };
}

function planBattleEnd(context){
  if(!context?.context){
    return {ok:false,handled:false,stage:'battle-end',reason:'battle-context-required'};
  }

  const player=analyzeSide(context,SIDE_PLAYER);
  if(!player.ok){
    return {ok:false,handled:false,stage:'battle-end',reason:player.reason,detail:player};
  }
  const enemy=analyzeSide(context,SIDE_ENEMY);
  if(!enemy.ok){
    return {ok:false,handled:false,stage:'battle-end',reason:enemy.reason,detail:enemy};
  }

  let finished=false;
  let winnerSide=null;
  let finishReason='none';

  if(player.participantCount===0){
    finished=true;
    winnerSide=SIDE_ENEMY;
    finishReason='player-side-empty';
  }else if(enemy.participantCount===0){
    finished=true;
    winnerSide=SIDE_PLAYER;
    finishReason='enemy-side-empty';
  }

  return {
    ok:true,
    handled:true,
    stage:finished?'battle-end-plan-ready':'battle-end-plan-not-finished',
    format:BROWSER_BATTLE_END_RUNTIME_FORMAT,
    action:ACTION_BATTLE_END_PLAN,
    finished,
    winnerSide,
    finishReason,
    finishMode:finished?'finish':null,
    playerSide:player,
    enemySide:enemy,
    finishSetMutation:false,
    battleContextMutation:false,
    hpMutation:false,
    persistentMutation:false,
    rewardMutation:false,
    rewardSettlementRequired:finished,
    persistentSettlementRequired:finished,
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      functions:['BATTLE_OnlyRescue','BATTLE_Command','BATTLE_FinishSet'],
      watchModeSeparate:true
    }
  };
}

function createBrowserBattleEndRuntime(){
  return {
    ok:true,
    format:BROWSER_BATTLE_END_RUNTIME_FORMAT,
    plan:(context)=>planBattleEnd(context)
  };
}

export {
  BROWSER_BATTLE_END_RUNTIME_FORMAT,
  ACTION_BATTLE_END_PLAN,
  analyzeSide,
  planBattleEnd,
  createBrowserBattleEndRuntime
};
