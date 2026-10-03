const BROWSER_BATTLE_DEATH_EXTRA_RUNTIME_FORMAT='stoneage-v461-browser-battle-death-extra-v1';
const ACTION_BATTLE_DEATH_EXTRA_APPLY='BATTLE_DEATH_EXTRA_APPLY';

const CH_FIX_PLAYERDEAD=-2;
const CH_FIX_PLAYERULTIMATE=-4;
const AI_FIX_PLAYERDEAD=-100;
const AI_FIX_PLAYERULTIMATE=-1000;
const AI_FIX_PETDEAD=-500;
const AI_FIX_PETULTIMATE=-1000;
const AI_MAX=10000;
const AI_MIN=-10000;
const CHARM_MAX=100;
const CHARM_MIN=0;

const clone=value=>JSON.parse(JSON.stringify(value));
const int=value=>{
  if(value==null||String(value).trim()==='')return null;
  const n=Number(value);
  return Number.isFinite(n)?Math.trunc(n):null;
};
const num=value=>{
  if(value==null||String(value).trim()==='')return null;
  const n=Number(value);
  return Number.isFinite(n)?n:null;
};
const typeOf=entry=>String(entry?.sourceType??'').trim().toLowerCase();

function findEntry(context,bid){
  const b=int(bid);
  if(b==null||b<0||b>19)return null;
  const side=b>=10?1:0;
  const slot=b>=10?b-10:b;
  const row=context?.context?.sides?.find(x=>int(x?.side)===side);
  return Array.isArray(row?.entries)?row.entries[slot]??null:null;
}

function clampAi(value){
  return Math.max(AI_MIN,Math.min(AI_MAX,int(value)??0));
}

function decodeAllocPointPacked(packed){
  const p=int(packed);
  if(p==null||p<0)return null;
  const base=256;
  return {
    vital:Math.floor(p/(base**3))%base,
    str:Math.floor(p/(base**2))%base,
    tgh:Math.floor(p/base)%base,
    dex:p%base
  };
}

function encodeAllocPointPacked(stats){
  const keys=['vital','str','tgh','dex'];
  const vals=keys.map(k=>Math.max(0,Math.min(255,int(stats?.[k])??0)));
  return ((vals[0]*256+vals[1])*256+vals[2])*256+vals[3];
}

function nextMarefiaAlloc(packed,rolls){
  const decoded=decodeAllocPointPacked(packed);
  if(!decoded)return {ok:true,known:false,allocPointPacked:null,stats:null,rollsConsumed:4};
  const ranges=[[1,8],[1,4],[1,4],[1,4]];
  if(!Array.isArray(rolls)||rolls.length<4)return {ok:false,reason:'marefia-death-rng-required'};
  const out={...decoded};
  const used=[];
  const names=['vital','str','tgh','dex'];
  for(let i=0;i<4;i++){
    const roll=int(rolls[i]);
    const [min,max]=ranges[i];
    if(roll==null||roll<min||roll>max)return {ok:false,reason:'marefia-death-rng-required-or-out-of-range',index:i,roll,min,max};
    out[names[i]]=Math.max(0,Math.min(50,out[names[i]]-roll));
    used.push(roll);
  }
  return {ok:true,known:true,stats:out,allocPointPacked:encodeAllocPointPacked(out),rollsConsumed:4,rolls:used};
}

function processBattleDeathExtras(context,{
  defaultPetBidByPlayerBid={0:5},
  deathExtraRandomRollsByBid={},
  now=null
}={}){
  if(!context?.context)return {ok:false,handled:false,stage:'battle-death-extra',action:ACTION_BATTLE_DEATH_EXTRA_APPLY,reason:'battle-context-required'};
  const sourceProfile=context.context.finishHookProfile;
  if(!sourceProfile||sourceProfile.profile!=='ordinary-world-encounter')return {ok:false,handled:false,stage:'battle-death-extra',action:ACTION_BATTLE_DEATH_EXTRA_APPLY,reason:'ordinary-pve-finish-hook-required'};
  const norisk=int(context.context.norisk)??0;
  if(norisk!==0)return {ok:true,handled:true,stage:'battle-death-extra-skipped-norisk',format:BROWSER_BATTLE_DEATH_EXTRA_RUNTIME_FORMAT,action:ACTION_BATTLE_DEATH_EXTRA_APPLY,rngConsumed:0,newEvents:[],context:clone(context.context),persistentMutation:false};
  
  const next=clone(context);
  const events=[];
  let rngConsumed=0;
  const side=next.context.sides?.find(x=>int(x?.side)===0);
  if(!side||!Array.isArray(side.entries))return {ok:false,handled:false,stage:'battle-death-extra',reason:'player-side-entries-required'};

  for(let slot=0;slot<side.entries.length;slot++){
    const entry=side.entries[slot];
    if(!entry||entry.sourceAddProfitDeathPending!==true||entry.sourceDeathExtraProcessed===true)continue;
    const bid=int(entry.bid??slot);
    const type=typeOf(entry);
    const level=int(entry.level)??1;
    const levelFlag=level<=10?2:1;
    const playerEntry=type==='pet'
      ? findEntry(next,bid>=5&&bid<10?bid-5:0)
      : type==='player'?entry:null;

    if(type==='player'){
      const isUltimate=(int(entry.ultimate)??0)>0;
      const charmDelta=(isUltimate?CH_FIX_PLAYERULTIMATE:CH_FIX_PLAYERDEAD)/levelFlag;
      const charmBefore=int(entry.charm)??-1;
      entry.charm=Math.max(CHARM_MIN,Math.min(CHARM_MAX,charmBefore+charmDelta));
      entry.battleCommands=Array.isArray(entry.battleCommands)?entry.battleCommands.slice():[-1,-1,-1];
      entry.battleCommands[0]=0;

      const defaultBid=int(defaultPetBidByPlayerBid?.[String(bid)]??defaultPetBidByPlayerBid?.[bid]??5);
      const defaultPet=findEntry(next,defaultBid);
      let defaultPetEvent=null;
      if(defaultPet){
        const aiDelta=(isUltimate?AI_FIX_PLAYERULTIMATE:AI_FIX_PLAYERDEAD)/levelFlag;
        const beforeAi=int(defaultPet.variableAi)??0;
        defaultPet.variableAi=clampAi(beforeAi+aiDelta);
        defaultPetEvent={
          petBid:defaultBid,
          petId:String(defaultPet.characterId??defaultPet.stateId??'').trim()||null,
          variableAiBefore:beforeAi,
          variableAiAfter:defaultPet.variableAi,
          variableAiDelta:defaultPet.variableAi-beforeAi
        };
        if(isUltimate){
          defaultPet.sourceBattleExited=true;
          next.context.sourceBattleExitedBids=Array.isArray(next.context.sourceBattleExitedBids)?next.context.sourceBattleExitedBids.slice():[];
          if(!next.context.sourceBattleExitedBids.includes(defaultBid))next.context.sourceBattleExitedBids.push(defaultBid);
          side.entries[defaultBid]=null;
        }
      }

      events.push({
        kind:isUltimate?'player-ultimate-death':'player-normal-death',
        actorBid:bid,
        playerId:String(entry.characterId??entry.stateId??'').trim()||null,
        level,
        levelFlag,
        charmBefore,
        charmAfter:entry.charm,
        charmDelta,
        defaultPetEvent,
        defaultPetRelationPreserved:true,
        persistent:true
      });
    }else if(type==='pet'){
      const ownerBid=playerEntry&&typeOf(playerEntry)==='player'?int(playerEntry.bid)??0:0;
      const ownerLevel=int(playerEntry?.level)??level;
      const ownerLevelFlag=ownerLevel<=10?2:1;
      const isUltimate=(int(entry.ultimate)??0)>0;
      const aiDelta=(isUltimate?AI_FIX_PETULTIMATE:AI_FIX_PETDEAD)/ownerLevelFlag;
      const aiBefore=int(entry.variableAi)??0;
      entry.variableAi=clampAi(aiBefore+aiDelta);
      const deadBefore=int(playerEntry?.deadPetCount)??0;
      if(playerEntry)playerEntry.deadPetCount=deadBefore+1;
      let marefia=null;
      if(int(entry.petId??entry.tempNo)===718){
        const rolls=deathExtraRandomRollsByBid?.[String(bid)]??deathExtraRandomRollsByBid?.[bid]??null;
        const packedBefore=int(entry.allocPointPacked)??null;
        const result=nextMarefiaAlloc(entry.allocPointPacked,rolls);
        if(!result.ok)return {...result,handled:false,stage:'battle-death-extra-marefia',action:ACTION_BATTLE_DEATH_EXTRA_APPLY,bid,rngConsumed};
        rngConsumed+=result.rollsConsumed;
        if(result.known){
          entry.allocPointPacked=result.allocPointPacked;
        }
        const modBefore=int(entry.modAi)??0;
        const modAfter=Math.trunc(modBefore-(modBefore*5)/100);
        entry.modAi=modAfter;
        marefia={
          petId:718,
          allocPointKnown:result.known,
          allocPointPackedBefore:packedBefore,
          allocPointPackedAfter:result.allocPointPacked,
          statsAfter:result.stats,
          modAiBefore:modBefore,
          modAiAfter:modAfter,
          modAiDelta:modAfter-modBefore,
          rollsConsumed:result.rollsConsumed,
          rolls:result.rolls??[]
        };
      }
      if(isUltimate){
        entry.sourceBattleExited=true;
        next.context.sourceBattleExitedBids=Array.isArray(next.context.sourceBattleExitedBids)?next.context.sourceBattleExitedBids.slice():[];
        if(!next.context.sourceBattleExitedBids.includes(bid))next.context.sourceBattleExitedBids.push(bid);
        side.entries[slot]=null;
      }else{
        entry.battleCommands=Array.isArray(entry.battleCommands)?entry.battleCommands.slice():[-1,-1,-1];
        entry.battleCommands[0]=0;
      }
      events.push({
        kind:isUltimate?'pet-ultimate-death':'pet-normal-death',
        actorBid:bid,
        petId:String(entry.characterId??entry.stateId??'').trim()||null,
        level,
        ownerBid,
        ownerPlayerId:String(playerEntry?.characterId??playerEntry?.stateId??'').trim()||null,
        levelFlag:ownerLevelFlag,
        variableAiBefore:aiBefore,
        variableAiAfter:entry.variableAi,
        variableAiDelta:entry.variableAi-aiBefore,
        deadPetCountBefore:deadBefore,
        deadPetCountAfter:playerEntry?.deadPetCount??deadBefore,
        deadPetCountDelta:1,
        marefia,
        battleExited:isUltimate,
        persistent:true
      });
    }
    if(entry)entry.sourceDeathExtraProcessed=true;
    if(entry)entry.sourceAddProfitDeathPending=false;
  }

  const allEvents=Array.isArray(next.context.sourceDeathExtraEvents)?next.context.sourceDeathExtraEvents.slice():[];
  allEvents.push(...events);
  next.context.sourceDeathExtraEvents=allEvents;
  next.context.sourceDeathExtraProcessed=true;
  return {
    ok:true,
    handled:true,
    stage:'battle-death-extra-applied',
    format:BROWSER_BATTLE_DEATH_EXTRA_RUNTIME_FORMAT,
    action:ACTION_BATTLE_DEATH_EXTRA_APPLY,
    newEvents:events,
    totalEvents:allEvents.length,
    rngConsumed,
    persistentMutation:false,
    context:next.context,
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      functions:['BATTLE_AddProfit','BATTLE_NormalDeadExtra','BATTLE_UltimateExtra','Pet_Check_Die','CHAR_PetAddVariableAi']
    },
    now:now??null
  };
}

function createBrowserBattleDeathExtraRuntime(){
  return {ok:true,format:BROWSER_BATTLE_DEATH_EXTRA_RUNTIME_FORMAT,apply:(context,options={})=>processBattleDeathExtras(context,options)};
}

export {
  BROWSER_BATTLE_DEATH_EXTRA_RUNTIME_FORMAT,
  CHARM_MAX,
  CHARM_MIN,
  ACTION_BATTLE_DEATH_EXTRA_APPLY,
  CH_FIX_PLAYERDEAD,
  CH_FIX_PLAYERULTIMATE,
  AI_FIX_PLAYERDEAD,
  AI_FIX_PLAYERULTIMATE,
  AI_FIX_PETDEAD,
  AI_FIX_PETULTIMATE,
  processBattleDeathExtras,
  createBrowserBattleDeathExtraRuntime
};
