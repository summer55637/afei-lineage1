const BROWSER_BATTLE_EXP_PLAN_RUNTIME_FORMAT='stoneage-v413-browser-battle-exp-plan-v1';
const ACTION_BATTLE_EXP_PLAN='BATTLE_EXP_PLAN';
const SOURCE_WORKGETEXP_CAP=1000000000;
const SOURCE_EXP_CAP=1224160000;
const SOURCE_MAX_UP_LEVEL=200;
const SOURCE_BATTLE_EXP_MULTIPLIER=100;

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const intOr=(value,fallback=null)=>{
  if(value==null||String(value).trim()==='')return fallback;
  const n=Number(value);
  return Number.isFinite(n)?Math.trunc(n):fallback;
};
const clone=value=>JSON.parse(JSON.stringify(value));

function applyBattleExpFormula({
  workGetExp=0,
  itemExpModifierPercent=0,
  battleExpMultiplier=SOURCE_BATTLE_EXP_MULTIPLIER,
  currentExp=0,
  level=1
}={}){
  const raw=intOr(workGetExp,0);
  let base=raw;
  if(base>SOURCE_WORKGETEXP_CAP)base=SOURCE_WORKGETEXP_CAP;
  if(base<0)base=0;
  const modifier=intOr(itemExpModifierPercent,0);
  const itemBonus=Math.trunc((base*modifier)/100);
  let addExp=base+itemBonus;
  const battleMultiplier=intOr(battleExpMultiplier,SOURCE_BATTLE_EXP_MULTIPLIER);
  if(level>=SOURCE_MAX_UP_LEVEL)addExp=0;
  else addExp=addExp*battleMultiplier;
  const before=intOr(currentExp,0);
  const nextExp=Math.min(SOURCE_EXP_CAP,Math.max(0,before+addExp));
  return {
    rawWorkGetExp:raw,
    clampedWorkGetExp:base,
    itemExpModifierPercent:modifier,
    itemBonus,
    battleExpMultiplier:battleMultiplier,
    addExp,
    currentExp:before,
    nextExp,
    expCapApplied:before+addExp>SOURCE_EXP_CAP
  };
}

function resolvePlayerEntry(battleContext){
  const row=battleContext?.context?.sides?.find(x=>Number(x?.side)===0);
  if(!row||Number(row?.type)!==0||!Array.isArray(row.entries))return null;
  const entry=row.entries.find(x=>Number(x?.bid)===0)??row.entries[0]??null;
  if(!entry||String(entry.sourceType??'').trim().toLowerCase()!=='player')return null;
  return entry;
}

function resolveActivePetEntry(battleContext,petId){
  const needle=String(petId??'').trim();
  if(!needle)return null;
  const rows=battleContext?.context?.sides?.filter(x=>Number(x?.side)===0)??[];
  for(const row of rows){
    for(const entry of Array.isArray(row?.entries)?row.entries:[]){
      if(String(entry?.sourceType??'').trim().toLowerCase()==='pet' &&
         String(entry?.characterId??entry?.stateId??'').trim()===needle)return entry;
    }
  }
  return null;
}

function planBattleExp(battleContext,state,{
  itemExpModifierPercent=0,
  battleExpMultiplier=SOURCE_BATTLE_EXP_MULTIPLIER
}={}){
  if(!isObject(battleContext))return {ok:false,handled:false,stage:'battle-exp-plan',reason:'battle-context-required'};
  if(!isObject(state))return {ok:false,handled:false,stage:'battle-exp-plan',reason:'persistent-state-required'};
  if(!isObject(state.player))return {ok:false,handled:false,stage:'battle-exp-plan',reason:'persistent-player-required'};

  const playerEntry=resolvePlayerEntry(battleContext);
  if(!playerEntry)return {ok:false,handled:false,stage:'battle-exp-plan',reason:'player-battle-entry-required'};
  if(playerEntry.isDie===true || intOr(playerEntry.hp,0)<=0){
    return {ok:false,handled:false,stage:'battle-exp-plan',reason:'player-dead-no-exp-settlement'};
  }
  const playerId=state.player?.id==null?'':String(state.player.id).trim();
  const battlePlayerId=playerEntry.characterId==null?'':String(playerEntry.characterId).trim();
  if(playerId&&battlePlayerId&&playerId!==battlePlayerId){
    return {ok:false,handled:false,stage:'battle-exp-plan',reason:'battle-player-identity-mismatch',persistentPlayerId:playerId,battleCharacterId:battlePlayerId};
  }

  const playerWorkGetExp=intOr(playerEntry.workGetExp,state.player.workGetExp??0);
  if(playerEntry.workGetExp!=null && state.player.workGetExp!=null && playerWorkGetExp!==intOr(state.player.workGetExp,0)){
    return {ok:false,handled:false,stage:'battle-exp-plan',reason:'player-workgetexp-mismatch',battleWorkGetExp:playerWorkGetExp,stateWorkGetExp:intOr(state.player.workGetExp,0)};
  }
  const playerCalc=applyBattleExpFormula({
    workGetExp:playerWorkGetExp,
    itemExpModifierPercent,
    battleExpMultiplier,
    currentExp:intOr(state.player.exp,0),
    level:intOr(playerEntry.level??state.player.level,1)
  });

  const petPlans=[];
  const seen=new Set();
  for(const pet of Array.isArray(state?.pets?.petBox)?state.pets.petBox:[]){
    if(!isObject(pet))continue;
    const id=String(pet.id??pet.petId??'').trim();
    if(!id||seen.has(id))continue;
    seen.add(id);
    const petExp=intOr(pet.exp,0);
    const petWorkGetExp=intOr(pet.workGetExp,0);
    if(pet?.hp!=null&&intOr(pet.hp,0)<=0)continue;
    if(petWorkGetExp<=0)continue;
    const contextPet=resolveActivePetEntry(battleContext,id);
    if(contextPet&&contextPet.workGetExp!=null&&petWorkGetExp!==intOr(contextPet.workGetExp,0)){
      return {ok:false,handled:false,stage:'battle-exp-plan',reason:'pet-workgetexp-mismatch',petId:id,contextWorkGetExp:intOr(contextPet.workGetExp,0),stateWorkGetExp:petWorkGetExp};
    }
    petPlans.push({
      petId:id,
      level:intOr(contextPet?.level??pet.level,1),
      workGetExp:petWorkGetExp,
      calculation:applyBattleExpFormula({
        workGetExp:petWorkGetExp,
        itemExpModifierPercent,
        battleExpMultiplier,
        currentExp:petExp,
        level:intOr(contextPet?.level??pet.level,1)
      })
    });
  }

  return {
    ok:true,
    handled:true,
    stage:'battle-exp-plan-ready',
    format:BROWSER_BATTLE_EXP_PLAN_RUNTIME_FORMAT,
    action:ACTION_BATTLE_EXP_PLAN,
    source:{
      fixedCRef:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      functions:['BATTLE_GetExp','CHAR_AddMaxExp'],
      setupBattleExp:SOURCE_BATTLE_EXP_MULTIPLIER,
      sourceWorkGetExpCap:SOURCE_WORKGETEXP_CAP,
      sourceExpCap:SOURCE_EXP_CAP
    },
    player:{
      characterId:battlePlayerId||playerId||null,
      level:intOr(playerEntry.level??state.player.level,1),
      workGetExp:playerWorkGetExp,
      currentExp:intOr(state.player.exp,0),
      calculation:playerCalc
    },
    pets:petPlans,
    levelUpDeferred:true,
    itemSettlementDeferred:true,
    goldSettlement:false,
    persistentStateMutation:false,
    battleContextMutation:false,
    uiMutation:false,
    dbMutation:false,
    nextBoundary:'BATTLE_LEVELUP_PLAN'
  };
}

function createBrowserBattleExpPlanRuntime(){
  return {
    ok:true,
    format:BROWSER_BATTLE_EXP_PLAN_RUNTIME_FORMAT,
    plan:planBattleExp
  };
}

export {
  BROWSER_BATTLE_EXP_PLAN_RUNTIME_FORMAT,
  ACTION_BATTLE_EXP_PLAN,
  SOURCE_WORKGETEXP_CAP,
  SOURCE_EXP_CAP,
  SOURCE_MAX_UP_LEVEL,
  SOURCE_BATTLE_EXP_MULTIPLIER,
  applyBattleExpFormula,
  planBattleExp,
  createBrowserBattleExpPlanRuntime
};
