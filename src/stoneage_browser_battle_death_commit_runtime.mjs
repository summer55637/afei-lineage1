const BROWSER_BATTLE_DEATH_COMMIT_RUNTIME_FORMAT='stoneage-v407-browser-battle-death-commit-v1';
const ACTION_BATTLE_DEATH_COMMIT='BATTLE_DEATH_COMMIT';

const int=value=>{
  if(value==null||String(value).trim()==='')return null;
  const n=Number(value);
  return Number.isFinite(n)?Math.trunc(n):null;
};

const clone=value=>JSON.parse(JSON.stringify(value));

function findEntry(context,bid){
  const b=int(bid);
  if(b==null||b<0||b>19)return null;
  const side=b>=10?1:0;
  const slot=b>=10?b-10:b;
  const s=context?.context?.sides?.find(x=>Number(x?.side)===side);
  return Array.isArray(s?.entries)?s.entries[slot]??null:null;
}

function commitDeathState(context,{
  targetBid=null,
  deathPlan=null,
  clientFlags=null,
  ultimate=null
}={}){
  if(!context?.context){
    return {ok:false,handled:false,stage:'battle-death-commit',reason:'battle-context-required'};
  }

  if(!deathPlan||deathPlan.ok!==true){
    return {ok:false,handled:false,stage:'battle-death-commit',reason:'death-plan-required'};
  }

  if(deathPlan.dead!==true||deathPlan.deathFlag!==true){
    return {
      ok:false,
      handled:false,
      stage:'battle-death-commit',
      reason:'death-plan-not-dead',
      targetBid:int(targetBid??deathPlan.targetBid)
    };
  }

  const bid=int(targetBid??deathPlan.targetBid);
  const target=findEntry(context,bid);
  if(!target){
    return {ok:false,handled:false,stage:'battle-death-commit',reason:'target-missing',targetBid:bid};
  }

  if(target.isDie===true){
    return {ok:false,handled:false,stage:'battle-death-commit',reason:'target-already-dead',targetBid:bid};
  }

  const currentDeadCount=int(target.deadCount)??0;
  if(currentDeadCount<0){
    return {ok:false,handled:false,stage:'battle-death-commit',reason:'dead-count-invalid',targetBid:bid};
  }

  const next=clone(context);
  const entry=findEntry(next,bid);
  const flags=int(clientFlags??deathPlan.clientFlags)??0;
  const ult=int(ultimate??deathPlan.ultimate)??0;

  entry.isDie=true;
  entry.deadCount=currentDeadCount+1;
  entry.battleOutcomeFlags=(int(entry.battleOutcomeFlags)??0)|flags;
  entry.ultimate=ult;

  return {
    ok:true,
    handled:true,
    stage:'battle-death-committed',
    format:BROWSER_BATTLE_DEATH_COMMIT_RUNTIME_FORMAT,
    action:ACTION_BATTLE_DEATH_COMMIT,
    targetBid:bid,
    sourceType:String(target.sourceType??'').trim().toLowerCase()||null,
    isDie:true,
    deadCountBefore:currentDeadCount,
    deadCountAfter:entry.deadCount,
    battleOutcomeFlags:entry.battleOutcomeFlags,
    ultimate:entry.ultimate,
    hpMutation:false,
    persistentMutation:false,
    rewardMutation:false,
    battleEndMutation:false,
    postDeathSettlementRequired:true,
    deferredHooks:
      ult>0?['BATTLE_UltimateExtra']:['BATTLE_NormalDeadExtra'],
    battleContextMutation:true,
    battleContext:next,
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      functions:['CHAR_setFlg(CHAR_ISDIE)','CHAR_setInt(CHAR_DEADCOUNT)'],
      callSites:['BATTLE_AddExpItem','BATTLE_AddDuelPoint']
    }
  };
}

function createBrowserBattleDeathCommitRuntime(){
  return {
    ok:true,
    format:BROWSER_BATTLE_DEATH_COMMIT_RUNTIME_FORMAT,
    commit:(context,options={})=>commitDeathState(context,options)
  };
}

export {
  BROWSER_BATTLE_DEATH_COMMIT_RUNTIME_FORMAT,
  ACTION_BATTLE_DEATH_COMMIT,
  commitDeathState,
  createBrowserBattleDeathCommitRuntime
};
