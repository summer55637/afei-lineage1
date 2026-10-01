const BROWSER_BATTLE_DEATH_RUNTIME_FORMAT='stoneage-v406-browser-battle-death-v1';
const ACTION_BATTLE_DEATH_PLAN='BATTLE_DEATH_PLAN';

const BCF_DEATH=1<<0;
const BCF_KAISHIN=1<<2;
const BCF_ULTIMATE_1=1<<6;
const BCF_ULTIMATE_2=1<<7;

const int=value=>{
  if(value==null||String(value).trim()==='')return null;
  const n=Number(value);
  return Number.isFinite(n)?Math.trunc(n):null;
};
const truthy=value=>value===true||Number(value)>0;
const typeOf=entry=>String(entry?.sourceType??'').trim().toLowerCase();

function findEntry(context,bid){
  const b=int(bid);
  if(b==null||b<0||b>19)return null;
  const side=b>=10?1:0;
  const slot=b>=10?b-10:b;
  const s=context?.context?.sides?.find(x=>Number(x?.side)===side);
  return Array.isArray(s?.entries)?s.entries[slot]??null:null;
}

function deathPlan(context,{
  targetBid=null,
  hp=null,
  battleFlags=0,
  critical=false,
  criticalFlag=null,
  ultimateFromDamage=0,
  lerImmune=false,
  deathRoll=null
}={}){
  if(!context?.context)return {ok:false,handled:false,stage:'battle-death',reason:'battle-context-required'};
  const target=findEntry(context,targetBid);
  if(!target)return {ok:false,handled:false,stage:'battle-death',reason:'target-missing'};

  const currentHp=int(hp??target.hp);
  if(currentHp==null)return {ok:false,handled:false,stage:'battle-death',reason:'target-hp-required'};

  const flags=int(battleFlags??0)??0;
  const crit=critical===true||criticalFlag===true||((flags&BCF_KAISHIN)!==0);
  const sourceType=typeOf(target);
  const abio=(int(target.battleFlg??target.battleFlags)??flags)&64;
  let ultimate=int(ultimateFromDamage??0)??0;
  let deathRollUsed=null;
  let deathFromZero=false;
  let randomUltimate=false;

  if(currentHp<=0){
    deathFromZero=true;
    if((abio&64)!==0){
      ultimate=1;
    }else if(sourceType!=='player'&&crit){
      const roll=int(deathRoll);
      if(roll==null||roll<1||roll>100){
        return {
          ok:false,handled:false,stage:'battle-death',
          reason:'critical-death-rng-required-or-out-of-range',
          deathCondition:true,
          criticalEnemyUltimateCheck:true
        };
      }
      deathRollUsed=roll;
      if(roll<50){
        ultimate=1;
        randomUltimate=true;
      }
    }
    if(lerImmune===true||target.lerImmune===true)ultimate=0;
  }

  const flagsOut=deathFromZero
    ? (BCF_DEATH | (ultimate===1?BCF_ULTIMATE_1:0) | (ultimate===2?BCF_ULTIMATE_2:0))
    : 0;

  return {
    ok:true,
    handled:true,
    stage:deathFromZero?'battle-death-plan-ready':'battle-death-plan-nonlethal',
    format:BROWSER_BATTLE_DEATH_RUNTIME_FORMAT,
    action:ACTION_BATTLE_DEATH_PLAN,
    targetBid:int(targetBid),
    hp:currentHp,
    dead:deathFromZero,
    battleReturnFlag:deathFromZero?false:true,
    deathFlag:deathFromZero,
    clientFlags:flagsOut,
    critical:crit,
    ultimate,
    ultimateFromDamage:int(ultimateFromDamage??0)??0,
    ultimateSource:
      ultimate===2?'damage-sub-ultimate-2':
      ((abio&64)!==0?'abio':
      (randomUltimate?'critical-enemy-roll':
      ((lerImmune===true||target.lerImmune===true)?'ler-immune':'none'))),
    deathRoll:deathRollUsed,
    rngConsumed:deathRollUsed==null?0:1,
    hpMutation:false,
    persistentMutation:false,
    charIsDieMutation:false,
    battleCommandMutation:false,
    battleEndMutation:false,
    rewardMutation:false,
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      functions:['BATTLE_DefDieType','BATTLE_AttackSeq']
    }
  };
}

function createBrowserBattleDeathRuntime(){
  return {ok:true,format:BROWSER_BATTLE_DEATH_RUNTIME_FORMAT,plan:(context,options={})=>deathPlan(context,options)};
}

export {
  BROWSER_BATTLE_DEATH_RUNTIME_FORMAT,
  ACTION_BATTLE_DEATH_PLAN,
  BCF_DEATH,
  BCF_KAISHIN,
  BCF_ULTIMATE_1,
  BCF_ULTIMATE_2,
  deathPlan,
  createBrowserBattleDeathRuntime
};
