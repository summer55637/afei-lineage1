const BROWSER_BATTLE_DUELPOINT_RUNTIME_FORMAT='stoneage-v411-browser-battle-duelpoint-plan-v1';
const ACTION_BATTLE_DUELPOINT_PLAN='BATTLE_DUELPOINT_PLAN';
const PLAYER_SIDE=0;
const ENEMY_SIDE=1;
const SIDE_OFFSET=10;
const DUELPOINT_RATE=0.1;
const MAX_DUELPOINT=100000000;

const int=value=>{
  if(value==null||String(value).trim()==='')return null;
  const n=Number(value);
  return Number.isFinite(n)?Math.trunc(n):null;
};
const clone=value=>JSON.parse(JSON.stringify(value));

function findEntry(context,side,num){
  const s=int(side);
  const n=int(num);
  if(s!==0&&s!==1)return null;
  if(n==null||n<0||n>=10)return null;
  const row=context?.context?.sides?.find(x=>Number(x?.side)===s);
  return row&&Array.isArray(row.entries)?row.entries[n]??null:null;
}

function normalizeDelta(workGetExp){
  const value=int(workGetExp);
  if(value==null)return null;
  if(value===0)return 0;
  return value<0?Math.min(-1,value):Math.max(1,value);
}

function planDuelPoint(context,{
  side=PLAYER_SIDE,
  num=0,
  duelPoint=null,
  workGetExp=null
}={}){
  if(!context?.context){
    return {ok:false,handled:false,stage:'battle-duelpoint',reason:'battle-context-required'};
  }

  const s=int(side);
  const n=int(num);
  if(s!==PLAYER_SIDE&&s!==ENEMY_SIDE){
    return {ok:false,handled:false,stage:'battle-duelpoint',reason:'battle-side-invalid',side:s};
  }
  if(n==null||n<0||n>=10){
    return {ok:false,handled:false,stage:'battle-duelpoint',reason:'battle-entry-invalid',side:s,num:n};
  }

  const sideRow=context.context.sides?.find(x=>Number(x?.side)===s);
  if(!sideRow){
    return {ok:false,handled:false,stage:'battle-duelpoint',reason:'battle-side-missing',side:s};
  }
  const sideType=int(sideRow.type);
  if(sideType!==PLAYER_SIDE){
    return {ok:false,handled:false,stage:'battle-duelpoint',reason:'non-player-side',side:s,sideType};
  }

  const entry=findEntry(context,s,n);
  if(!entry){
    return {ok:false,handled:false,stage:'battle-duelpoint',reason:'target-missing',side:s,num:n};
  }
  if(String(entry.sourceType??'').trim().toLowerCase()==='pet'){
    return {ok:false,handled:false,stage:'battle-duelpoint',reason:'pet-not-eligible',targetBid:int(entry.bid??(s*SIDE_OFFSET+n))};
  }
  if(String(entry.sourceType??'').trim().toLowerCase()!=='player'){
    return {ok:false,handled:false,stage:'battle-duelpoint',reason:'player-entry-required',targetBid:int(entry.bid??(s*SIDE_OFFSET+n))};
  }

  const current=int(duelPoint??entry.duelPoint);
  const work=int(workGetExp??entry.workGetExp);
  if(current==null||current<0){
    return {ok:false,handled:false,stage:'battle-duelpoint',reason:'duelpoint-required-or-invalid',currentDuelPoint:current};
  }
  if(work==null){
    return {ok:false,handled:false,stage:'battle-duelpoint',reason:'work-getexp-required'};
  }

  const dpadd=normalizeDelta(work);
  const unclamped=current+dpadd;
  const next=Math.min(MAX_DUELPOINT,Math.max(0,unclamped));

  return {
    ok:true,
    handled:true,
    stage:'battle-duelpoint-plan-ready',
    format:BROWSER_BATTLE_DUELPOINT_RUNTIME_FORMAT,
    action:ACTION_BATTLE_DUELPOINT_PLAN,
    targetBid:int(entry.bid??(s*SIDE_OFFSET+n)),
    side:s,
    num:n,
    currentDuelPoint:current,
    workGetExp:work,
    dpadd,
    unclampedDuelPoint:unclamped,
    nextDuelPoint:next,
    deltaApplied:next-current,
    minDuelPoint:0,
    maxDuelPoint:MAX_DUELPOINT,
    rate:DUELPOINT_RATE,
    isDeadIgnored:true,
    mutation:false,
    battleContextMutation:false,
    persistentMutation:false,
    uiMutation:false,
    dbMutation:false,
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      function:'BATTLE_GetDuelPoint',
      constants:['DUELPOINT_RATE=0.1','CHAR_MAXDUELPOINT=100000000'],
      semantics:[
        'dpadd = CHAR_WORKGETEXP',
        'non-zero dpadd is kept non-zero',
        'dpnow = CHAR_DUELPOINT + dpadd',
        'dpnow clamped to 0..CHAR_MAXDUELPOINT'
      ]
    },
    nextBoundary:{
      commitAction:'BATTLE_DUELPOINT_COMMIT',
      sourceSideEffect:[
        'CHAR_setInt(CHAR_DUELPOINT)',
        'lssproto_RD_send',
        'CHAR_send_DpDBUpdate',
        'CHAR_send_DpDBUpdate_AddressBook'
      ]
    }
  };
}

function createBrowserBattleDuelPointRuntime(){
  return {
    ok:true,
    format:BROWSER_BATTLE_DUELPOINT_RUNTIME_FORMAT,
    plan:(context,options={})=>planDuelPoint(context,options)
  };
}

export {
  BROWSER_BATTLE_DUELPOINT_RUNTIME_FORMAT,
  ACTION_BATTLE_DUELPOINT_PLAN,
  DUELPOINT_RATE,
  MAX_DUELPOINT,
  normalizeDelta,
  planDuelPoint,
  createBrowserBattleDuelPointRuntime
};
