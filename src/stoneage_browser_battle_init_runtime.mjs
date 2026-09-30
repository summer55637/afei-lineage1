const BROWSER_BATTLE_INIT_RUNTIME_FORMAT='stoneage-v391-browser-battle-init-runtime-v1';
const ACTION_BATTLE_INIT='BATTLE_INIT';
const BATTLE_MODE_INIT=1;
const BATTLE_MODE_BATTLE=2;
const BATTLE_CHARMODE_INIT=1;
const BATTLE_CHARMODE_C_WAIT=2;
const BATTLE_COM_NONE=0;
const BATTLE_FLG_FREEDP=1;
const BSIDE_FLG_SURPRISE=1;
const CHAR_BATTLEFLG_GUARDIAN=1<<3;

const clone=value=>JSON.parse(JSON.stringify(value));
const toInt=value=>{
  const s=String(value??'').trim();
  if(s==='')return null;
  const m=s.match(/^[+-]?\d+/);
  return m?Number(m[0]):null;
};

function surpriseResultForLuck(luck,roll){
  const r=toInt(roll);
  if(r==null||r<1||r>100)return {ok:false,reason:'surprise-rng-required-or-out-of-range',roll:r};
  const l=toInt(luck)??0;
  let a=0,b=7;
  switch(l){
    case 5:a=20;b=0;break;
    case 4:a=15;b=2;break;
    case 3:a=10;b=3;break;
    case 2:a=5;b=5;break;
    default:a=0;b=7;break;
  }
  let result=0;
  if(r<=a)result=1;
  else if(r<a+b)result=2;
  return {ok:true,roll:r,luck:l,a,b,result};
}

function applyPreCommandSeq(context,{playerLuck=0,surpriseRoll=null,now=null}={}){
  if(!context||context.format===undefined)return {ok:false,handled:false,stage:'battle-init',reason:'battle-context-required'};
  if(context.context?.mode!=='init'&&context.context?.sourceMode!==BATTLE_MODE_INIT){
    return {ok:false,handled:false,stage:'battle-init',reason:'battle-mode-not-init',mode:context.context?.mode,sourceMode:context.context?.sourceMode};
  }
  if(context.context?.type!==1)return {ok:false,handled:false,stage:'battle-init',reason:'battle-type-unsupported',type:context.context?.type};
  const surprise=surpriseResultForLuck(playerLuck,surpriseRoll);
  if(!surprise.ok)return {...surprise,handled:false,stage:'battle-init'};
  const next=clone(context);
  next.action=ACTION_BATTLE_INIT;
  next.stage='battle-initialized';
  next.format=BROWSER_BATTLE_INIT_RUNTIME_FORMAT;
  next.context.mode='battle';
  next.context.sourceMode=BATTLE_MODE_BATTLE;
  next.context.turn=0;
  next.context.flg=(toInt(next.context.flg)??0)|BATTLE_FLG_FREEDP;
  next.context.timerSec=now==null?null:Math.floor(new Date(String(now)).getTime()/1000);
  next.context.surprise={
    result:surprise.result,
    roll:surprise.roll,
    luck:surprise.luck,
    thresholds:{side1Max:surprise.a,side0MaxExclusive:surprise.a+surprise.b},
    source:'BATTLE_SurpriseCheck'
  };
  next.context.sideFlags=[0,0];
  if(surprise.result===1)next.context.sideFlags[1]|=BSIDE_FLG_SURPRISE;
  if(surprise.result===2)next.context.sideFlags[0]|=BSIDE_FLG_SURPRISE;
  let actorCount=0;
  for(const side of next.context.sides??[]){
    for(const entry of side.entries??[]){
      if(!entry)continue;
      actorCount++;
      entry.guardian=-1;
      entry.battleFlg=(toInt(entry.battleFlg)??0)&~CHAR_BATTLEFLG_GUARDIAN;
      entry.battleMode='c_wait';
      entry.sourceBattleCharMode=BATTLE_CHARMODE_C_WAIT;
      const cmds=Array.isArray(entry.battleCommands)?entry.battleCommands.slice(0,3):[-1,-1,-1];
      while(cmds.length<3)cmds.push(-1);
      cmds[0]=BATTLE_COM_NONE;
      entry.battleCommands=cmds;
      entry.preCommandApplied=true;
    }
  }
  next.context.preCommand={
    cWait:true,
    actorCount,
    guardianDefault:-1,
    guardianBitCleared:true,
    command1Default:BATTLE_COM_NONE,
    battleFlgFreeDp:true,
    turnParams:{
      note:'BATTLE_TurnParam receives zeroed battle modifiers from BATTLE_NewEntry, so base attack/defence/quick values are preserved until later runtime effects',
      executedModel:false
    }
  };
  next.persistentMutation=false;
  next.battleStarted=true;
  next.rngConsumed=true;
  next.source={
    ...(next.source??{}),
    fixedCInit:{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',function:'BATTLE_Init'},
    fixedCPreCommand:{function:'BATTLE_PreCommandSeq'}
  };
  return next;
}

export {
  BROWSER_BATTLE_INIT_RUNTIME_FORMAT,
  ACTION_BATTLE_INIT,
  BATTLE_MODE_INIT,
  BATTLE_MODE_BATTLE,
  BATTLE_CHARMODE_INIT,
  BATTLE_CHARMODE_C_WAIT,
  BATTLE_COM_NONE,
  BATTLE_FLG_FREEDP,
  BSIDE_FLG_SURPRISE,
  surpriseResultForLuck,
  applyPreCommandSeq
};
