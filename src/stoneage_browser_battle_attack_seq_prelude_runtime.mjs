const BROWSER_BATTLE_ATTACK_SEQ_PRELUDE_FORMAT='stoneage-v401-browser-battle-attack-seq-prelude-v1';
const ACTION_BATTLE_ATTACK_SEQ_PRELUDE='BATTLE_ATTACK_SEQ_PRELUDE';
const BATTLE_COM_GUARD=2;
const BATTLE_COM_JYUJYUTU=2000;
const BATTLE_COM_S_NOGUARD=1014;
const BATTLE_CHARMODE_RESCUE=5;
const CHAR_BATTLEFLG_ABIO=64;
const CHAR_BATTLEFLG_NODUCK=128;
const CHAR_BATTLEFLG_GUARDIAN=8;
const KAWASHI_MAX_RATE=75;
const G_KAWASHI_NORMAL=0.02;
const G_KAWASHI_JYUJYUTU=0.027;
const G_CRITICAL_PARA=0.09;
const SIDE_OFFSET=10;

const clone=value=>JSON.parse(JSON.stringify(value));
const num=(value,fallback=0)=>{
  const n=Number(value);
  return Number.isFinite(n)?n:fallback;
};
const int=value=>{
  const n=Number(value);
  return Number.isFinite(n)?Math.trunc(n):null;
};
const typeOf=entry=>String(entry?.sourceType??'').trim().toLowerCase();

function findEntryByBid(context,bid){
  const b=int(bid);
  if(b==null||b<0||b>19)return null;
  const side=b>=SIDE_OFFSET?1:0;
  const slot=b>=SIDE_OFFSET?b-SIDE_OFFSET:b;
  const sideObj=context?.context?.sides?.find(x=>Number(x?.side)===side);
  return Array.isArray(sideObj?.entries)?sideObj.entries[slot]??null:null;
}

function fixDexFor(entry){
  if(int(entry?.fixDex)!=null)return int(entry.fixDex);
  if(int(entry?.quick)!=null){
    const mod=int(entry?.modQuick)??0;
    return Math.trunc(num(entry.quick)-mod*0.01);
  }
  return null;
}

function duckCheck(entryAtt,entryDef,{
  weaponType='none',
  battleDuckModify=0,
  duckRoll=null,
  drunkRoll=null,
  hitRightRoll=null
}={}){
  const command=int(entryDef?.battleCommands?.[0])??-1;
  if(command===BATTLE_COM_GUARD)return {ok:true,dodged:false,rollRequired:false,rngConsumed:false,reason:'defender-guard'};
  if(num(entryDef?.damageReact)>0)return {ok:true,dodged:false,rollRequired:false,rngConsumed:false,reason:'defender-damage-react'};
  if(entryDef?.canMove===false)return {ok:true,dodged:false,rollRequired:false,rngConsumed:false,reason:'defender-cannot-move'};
  const flags=int(entryDef?.battleFlg)??0;
  if(flags&CHAR_BATTLEFLG_NODUCK)return {ok:true,dodged:false,reason:'defender-no-duck-flag'};
  if(flags&CHAR_BATTLEFLG_ABIO)return {ok:true,dodged:false,reason:'defender-abio-flag'};

  const atType=typeOf(entryAtt),dfType=typeOf(entryDef);
  let atDex=fixDexFor(entryAtt);
  let dfDex=fixDexFor(entryDef);
  if(atDex==null||dfDex==null)return {ok:false,handled:false,stage:'attack-seq-prelude-duck',reason:'fix-dex-required-for-duck'};
  let dfLuck=typeOf(entryDef)==='player'?(int(entryDef?.fixLuck??entryDef?.luck)??0):0;

  if(atType==='enemy'&&dfType==='pet')atDex*=0.8;
  else if(atType!=='enemy'&&dfType==='pet')dfDex*=0.8;
  else if(atType!=='player'&&dfType==='player')atDex*=0.6;
  else if(atType==='player'&&dfType!=='player')dfDex*=0.6;

  let big,small,wari;
  if(dfDex>=atDex){big=dfDex;small=atDex;wari=1;}
  else{big=atDex;small=dfDex;wari=big<=0?0:small/big;}
  const para=command===BATTLE_COM_JYUJYUTU?G_KAWASHI_JYUJYUTU:G_KAWASHI_NORMAL;
  let work=(big-small)/para;if(work<=0)work=0;
  let per=Math.sqrt(work)*wari+dfLuck+num(battleDuckModify);
  if(num(entryAtt?.drunk)>0){
    const r=int(drunkRoll);
    if(r==null||r<20||r>30)return {ok:false,handled:false,stage:'attack-seq-prelude-duck',reason:'drunk-duck-rng-required-or-out-of-range'};
    per+=r;
  }
  if(String(weaponType).toLowerCase()==='bow')per+=40;
  const packedCom3=int(entryDef?.battleCommands?.[2]);
  const packedDuck=packedCom3==null?0:Math.floor((packedCom3>>>16)&0xffff);
  const noguardBonus=num(entryDef?.noguardDuckBonus,command===BATTLE_COM_S_NOGUARD?packedDuck:0);
  if(command===BATTLE_COM_JYUJYUTU||command===BATTLE_COM_S_NOGUARD)per+=noguardBonus;
  per*=100;
  per=Math.min(per,KAWASHI_MAX_RATE*100);
  if(per<=0)per=1;

  if(typeOf(entryAtt)==='player'&&num(entryAtt?.hitRight)>0){
    const h=int(hitRightRoll);
    const min=Math.floor(num(entryAtt.hitRight)*0.8);
    const max=Math.floor(num(entryAtt.hitRight)*1.2);
    if(h==null||h<min||h>max)return {ok:false,handled:false,stage:'attack-seq-prelude-duck',reason:'hit-right-duck-rng-required-or-out-of-range'};
    per-=h;
    if(per<0)per=0;
  }

  const roll=int(duckRoll);
  if(roll==null||roll<1||roll>10000)return {ok:false,handled:false,stage:'attack-seq-prelude-duck',reason:'duck-rng-required-or-out-of-range'};
  return {
    ok:true,dodged:roll<=per,roll,per,
    chancePercent:per*0.01,
    weaponType:String(weaponType),
    atDex,dfDex,dfLuck,wari,para,
    source:'BATTLE_DuckCheck'
  };
}

function guardianCheck(context,attackerBid,targetBid,{throwWeapon=false,guardianBitMask=CHAR_BATTLEFLG_GUARDIAN,enabledFeatures=[]}={}){
  const target=findEntryByBid(context,targetBid);
  if(!target)return {ok:true,guardianBid:-1,reason:'target-entry-missing'};
  const guardian=int(target.guardian??-1);
  if(guardian===-1)return {ok:true,guardianBid:-1,reason:'no-guardian'};
  if(guardian===int(targetBid))return {ok:true,guardianBid:-1,reason:'guardian-is-target'};
  if(guardian===int(attackerBid))return {ok:true,guardianBid:-1,reason:'guardian-is-attacker'};
  const g=findEntryByBid(context,guardian);
  if(!g)return {ok:true,guardianBid:-1,reason:'guardian-entry-missing'};
  if(g.isDead===true||g.dead===true||num(g.hp)<=0)return {ok:true,guardianBid:-1,reason:'guardian-dead'};
  if(((int(g.battleFlg)??0)&guardianBitMask)===0)return {ok:true,guardianBid:-1,reason:'guardian-flag-missing'};
  const blocked=['sleep','confusion','paralysis','stone','barrier'];
  const conditional={PROFESSION_SKILL:['dizzy','dragnet','instigate'],PROFESSION_ADDSKILL:['doomTime']};
  const activeConditional=Object.entries(conditional).filter(([feature])=>enabledFeatures.includes(feature)).flatMap(([,keys])=>keys);
  const statusBlocked=[...blocked,...activeConditional].some(k=>num(g?.battleStatus?.[k]??g?.[k])>0);
  if(statusBlocked)return {ok:true,guardianBid:-1,reason:'guardian-status-blocked'};
  if(throwWeapon===true)return {ok:true,guardianBid:-1,reason:'throw-weapon'};
  return {ok:true,guardianBid:guardian,reason:'guardian-valid'};
}

function criticalCheck(entryAtt,entryDef,{weaponCritical=0,criticalRoll=null}={}){
  let atDex=fixDexFor(entryAtt);
  let dfDex=fixDexFor(entryDef);
  if(atDex==null||dfDex==null)return {ok:false,handled:false,stage:'attack-seq-prelude-critical',reason:'fix-dex-required-for-critical'};
  let atLuck=typeOf(entryAtt)==='player'?(int(entryAtt?.fixLuck??entryAtt?.luck)??0):0;
  let weaponCrit=num(weaponCritical);
  let divpara=G_CRITICAL_PARA;
  let root=1;
  const atType=typeOf(entryAtt),dfType=typeOf(entryDef);
  if(atType==='pet'&&dfType==='enemy')dfDex*=0.8;
  else if(atType==='enemy'&&dfType==='pet'){divpara=10;root=0;}
  else if(atType!=='player'&&dfType==='player'){divpara=10;root=0;}
  else if(atType==='player'&&dfType!=='player')dfDex*=0.6;

  let big,small,wari;
  if(atDex>=dfDex){big=atDex;small=dfDex;wari=1;}
  else{big=dfDex;small=atDex;wari=big<=0?0:small/big;}
  let work=(big-small)/divpara;if(work<=0)work=0;
  let per=(root===1?Math.sqrt(work):work)+weaponCrit*0.5;
  per*=wari;
  per+=atLuck;
  per*=100;
  if(per<0)per=1;
  if(per>10000)per=10000;
  const roll=int(criticalRoll);
  if(roll==null||roll<1||roll>10000)return {ok:false,handled:false,stage:'attack-seq-prelude-critical',reason:'critical-rng-required-or-out-of-range'};
  return {
    ok:true,critical:roll<per,roll,per,chancePercent:per*0.01,
    atDex,dfDex,atLuck,weaponCritical:weaponCrit,divpara,root,wari,
    source:'BATTLE_CriticalCheckPlayer'
  };
}

function runAttackSeqPrelude(context,{attackerBid=null,targetBid=null,weaponType='none',weaponCritical=0,throwWeapon=false,battleDuckModify=0,duckRoll=null,drunkRoll=null,hitRightRoll=null,criticalRoll=null,guardianBitMask=CHAR_BATTLEFLG_GUARDIAN,enabledFeatures=[]}={}){
  if(!context?.context)return {ok:false,handled:false,stage:'attack-seq-prelude',reason:'battle-context-required'};
  const attacker=findEntryByBid(context,attackerBid);
  const requestedTarget=findEntryByBid(context,targetBid);
  if(!attacker)return {ok:false,handled:false,stage:'attack-seq-prelude',reason:'attacker-entry-missing'};
  if(!requestedTarget)return {ok:false,handled:false,stage:'attack-seq-prelude',reason:'target-entry-missing'};
  if(num(attacker.hp)<=0)return {ok:false,handled:false,stage:'attack-seq-prelude',reason:'attacker-hp-not-positive'};
  if(num(requestedTarget.hp)<=0)return {ok:false,handled:false,stage:'attack-seq-prelude',reason:'target-hp-not-positive'};

  const duck=duckCheck(attacker,requestedTarget,{weaponType,battleDuckModify,duckRoll,drunkRoll,hitRightRoll});
  if(!duck.ok)return duck;
  if(duck.dodged){
    return {ok:true,handled:true,stage:'attack-seq-prelude-dodged',format:BROWSER_BATTLE_ATTACK_SEQ_PRELUDE_FORMAT,action:ACTION_BATTLE_ATTACK_SEQ_PRELUDE,attackerBid:int(attackerBid),requestedTargetBid:int(targetBid),finalTargetBid:int(targetBid),duck,guardian:null,critical:null,outcome:'dodge',rngConsumed:1+(num(attacker.drunk)>0?1:0)+(typeOf(attacker)==='player'&&num(attacker.hitRight)>0?1:0),persistentMutation:false,damageExecuted:false};
  }

  const guardian=guardianCheck(context,attackerBid,targetBid,{throwWeapon,guardianBitMask,enabledFeatures});
  if(!guardian.ok)return guardian;
  let finalTargetBid=int(targetBid);
  let guardianEntry=null;
  if(guardian.guardianBid!==-1){
    finalTargetBid=guardian.guardianBid;
    guardianEntry=findEntryByBid(context,finalTargetBid);
  }
  const finalTarget=guardianEntry??requestedTarget;
  const critical=criticalCheck(attacker,finalTarget,{weaponCritical,criticalRoll});
  if(!critical.ok)return critical;
  return {
    ok:true,handled:true,stage:'attack-seq-prelude-ready',
    format:BROWSER_BATTLE_ATTACK_SEQ_PRELUDE_FORMAT,
    action:ACTION_BATTLE_ATTACK_SEQ_PRELUDE,
    attackerBid:int(attackerBid),
    requestedTargetBid:int(targetBid),
    finalTargetBid,
    targetWasGuarded:guardian.guardianBid!==-1,
    duck,
    guardian,
    critical,
    outcome:critical.critical?'critical':'normal',
    rngConsumed:(1+(num(attacker.drunk)>0?1:0)+(typeOf(attacker)==='player'&&num(attacker.hitRight)>0?1:0)+1),
    persistentMutation:false,
    damageExecuted:false,
    sourceOrder:['BATTLE_DuckCheck','BATTLE_GuardianCheck','BATTLE_CriticalCheck']
  };
}

function createBrowserBattleAttackSeqPreludeRuntime(){
  return {ok:true,format:BROWSER_BATTLE_ATTACK_SEQ_PRELUDE_FORMAT,run:(context,options={})=>runAttackSeqPrelude(context,options)};
}

export {
  BATTLE_COM_GUARD,
  BATTLE_COM_JYUJYUTU,
  BATTLE_CHARMODE_RESCUE,
  BROWSER_BATTLE_ATTACK_SEQ_PRELUDE_FORMAT,
  ACTION_BATTLE_ATTACK_SEQ_PRELUDE,
  CHAR_BATTLEFLG_GUARDIAN,
  KAWASHI_MAX_RATE,
  duckCheck,
  guardianCheck,
  criticalCheck,
  runAttackSeqPrelude,
  createBrowserBattleAttackSeqPreludeRuntime
};
