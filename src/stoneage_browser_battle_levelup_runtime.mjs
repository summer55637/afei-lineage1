import expCatalog from '../data/generated/stoneage_exp_table.json' with { type: 'json' };

const BROWSER_BATTLE_LEVELUP_PLAN_RUNTIME_FORMAT='stoneage-v414-browser-battle-levelup-plan-v1';
const ACTION_BATTLE_LEVELUP_PLAN='BATTLE_LEVELUP_PLAN';
const SOURCE_EXP_TABLE_MAX_LEVEL=160;
const SOURCE_PLAYER_NORMAL_LEVEL_CAP=140;
const SOURCE_CHARTRANS=5;
const SOURCE_PETTRANS=-1;
const SOURCE_MAX_UP_LEVEL=200;
const PLAYER_DUELPOINT_PER_NEW_LEVEL_MULTIPLIER=10;
const PLAYER_SKILL_POINTS_PER_LEVEL=3;
const PLAYER_LEVELUP_CHARM_GAIN=2;
const PLAYER_CHARM_CAP=100;

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const intOr=(value,fallback=null)=>{
  if(value==null||String(value).trim()==='')return fallback;
  const n=Number(value);
  return Number.isFinite(n)?Math.trunc(n):fallback;
};
const clone=value=>JSON.parse(JSON.stringify(value));

const EXP_TABLE=Object.fromEntries(
  (Array.isArray(expCatalog?.entries)?expCatalog.entries:[])
    .filter(row=>Number.isInteger(row?.level)&&Number.isFinite(Number(row?.value)))
    .map(row=>[row.level,Math.trunc(Number(row.value))])
);

function nextExpThreshold({entityType='player',level,transmigration=0,maxLevel=SOURCE_EXP_TABLE_MAX_LEVEL,playerNormalLevelCap=SOURCE_PLAYER_NORMAL_LEVEL_CAP,chartrans=SOURCE_CHARTRANS,pettrans=SOURCE_PETTRANS}={}){
  const current=intOr(level,1);
  const next=current+1;
  const trans=intOr(transmigration,0);
  const tableMax=Math.min(intOr(maxLevel,SOURCE_EXP_TABLE_MAX_LEVEL),SOURCE_EXP_TABLE_MAX_LEVEL);
  if(current>=SOURCE_MAX_UP_LEVEL)return null;
  if(next>tableMax)return null;
  if(entityType==='player' && next>playerNormalLevelCap && trans<chartrans)return null;
  if(entityType==='pet' && next>tableMax)return null;
  const threshold=EXP_TABLE[next];
  return Number.isFinite(threshold)?threshold:null;
}

function planEntityLevelUp({
  entityType='player',
  level=1,
  exp=0,
  transmigration=0,
  maxLevel=SOURCE_EXP_TABLE_MAX_LEVEL,
  playerNormalLevelCap=SOURCE_PLAYER_NORMAL_LEVEL_CAP,
  chartrans=SOURCE_CHARTRANS,
  pettrans=SOURCE_PETTRANS
}={}){
  let currentLevel=intOr(level,1);
  let currentExp=Math.max(0,intOr(exp,0));
  let levelUps=0;
  let duelPointGain=0;
  const steps=[];
  for(let guard=0;guard<SOURCE_MAX_UP_LEVEL;guard++){
    const threshold=nextExpThreshold({
      entityType,
      level:currentLevel,
      transmigration,
      maxLevel,
      playerNormalLevelCap,
      chartrans,
      pettrans
    });
    if(threshold==null || currentExp<threshold)break;
    const oldLevel=currentLevel;
    currentExp-=threshold;
    currentLevel+=1;
    levelUps+=1;
    if(entityType==='player')duelPointGain+=currentLevel*PLAYER_DUELPOINT_PER_NEW_LEVEL_MULTIPLIER;
    steps.push({fromLevel:oldLevel,toLevel:currentLevel,thresholdExp:threshold,expAfter:currentExp});
  }
  const levelUp=levelUps>0;
  return {
    entityType,
    levelBefore:intOr(level,1),
    expBefore:Math.max(0,intOr(exp,0)),
    levelAfter:currentLevel,
    expAfter:currentExp,
    levelUps,
    duelPointGain,
    levelUp,
    steps,
    levelUpCalls:entityType==='pet'?levelUps:0,
    petVariableAiCalls:entityType==='pet'?levelUps:0,
    petGrowthDeferred:entityType==='pet'&&levelUps>0
  };
}

function validateV413Plan(plan){
  if(!isObject(plan))return ['battle-exp-plan-required'];
  if(plan.ok!==true||plan.stage!=='battle-exp-plan-ready')return ['battle-exp-plan-not-ready'];
  if(plan.format!=='stoneage-v413-browser-battle-exp-plan-v1')return ['battle-exp-plan-format-invalid'];
  return [];
}

function planBattleLevelUp(battleExpPlan,state,{
  playerNormalLevelCap=SOURCE_PLAYER_NORMAL_LEVEL_CAP,
  chartrans=SOURCE_CHARTRANS,
  pettrans=SOURCE_PETTRANS
}={}){
  const errors=validateV413Plan(battleExpPlan);
  if(errors.length)return {ok:false,handled:false,stage:'battle-levelup-plan',reason:'battle-exp-plan-invalid',errors};
  if(!isObject(state)||!isObject(state.player))return {ok:false,handled:false,stage:'battle-levelup-plan',reason:'persistent-state-required'};

  const player=battleExpPlan.player;
  const playerPlan=planEntityLevelUp({
    entityType:'player',
    level:intOr(player?.level??state.player.level,1),
    exp:intOr(player?.calculation?.nextExp??state.player.exp,0),
    transmigration:intOr(state.player.transmigration,0),
    playerNormalLevelCap,
    chartrans,
    pettrans
  });

  const currentDuelPoint=intOr(state.player.duelPoint,0);
  const currentSkillPoint=intOr(state.player?.profession?.skillPoint,0);
  const currentCharm=intOr(state.player.charm,0);
  const nextDuelPoint=currentDuelPoint+playerPlan.duelPointGain;
  const nextSkillPoint=currentSkillPoint+playerPlan.levelUps*PLAYER_SKILL_POINTS_PER_LEVEL;
  const nextCharm=playerPlan.levelUp?Math.min(PLAYER_CHARM_CAP,currentCharm+PLAYER_LEVELUP_CHARM_GAIN):currentCharm;

  const petPlans=[];
  for(const petPlan of Array.isArray(battleExpPlan.pets)?battleExpPlan.pets:[]){
    const petId=String(petPlan?.petId??'').trim();
    if(!petId)continue;
    const pet=Array.isArray(state?.pets?.petBox)?state.pets.petBox.find(p=>String(p?.id??'').trim()===petId):null;
    if(!pet)continue;
    const planned=planEntityLevelUp({
      entityType:'pet',
      level:intOr(petPlan.level??pet.level,1),
      exp:intOr(petPlan?.calculation?.nextExp??pet.exp,0),
      transmigration:intOr(pet.transmigration,0),
      playerNormalLevelCap,
      chartrans,
      pettrans
    });
    petPlans.push({
      petId,
      variableAiBefore:intOr(pet?.variableAi,0),
      variableAiAfter:intOr(petPlan?.variableAi,intOr(pet?.variableAi,0)),
      variableAiDelta:intOr(petPlan?.variableAi,intOr(pet?.variableAi,0))-intOr(pet?.variableAi,0),
      ...planned,
      sourceSideEffects:(planned.levelUps>0||intOr(petPlan?.variableAiDelta,0)!==0)?[
        'CHAR_PetLevelUp x levelUps',
        'CHAR_PetAddVariableAi(AI_FIX_PETLEVELUP) x levelUps',
        'CHAR_complianceParameter(pet)',
        'CHAR_VARIABLEAI += Pet Win AI transient delta'
      ]:[]
    });
  }

  return {
    ok:true,
    handled:true,
    stage:'battle-levelup-plan-ready',
    format:BROWSER_BATTLE_LEVELUP_PLAN_RUNTIME_FORMAT,
    action:ACTION_BATTLE_LEVELUP_PLAN,
    source:{
      fixedCRef:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      functions:['CHAR_LevelUpCheck','CHAR_GetLevelExp','CHAR_HandleExp','CHAR_PetLevelUp'],
      expTablePath:'gmsv/data/exp.txt',
      expTableLoadedMaxLevel:SOURCE_EXP_TABLE_MAX_LEVEL,
      playerNormalLevelCap,
      chartrans,
      pettrans
    },
    player:{
      ...playerPlan,
      duelPointBefore:currentDuelPoint,
      duelPointAfter:nextDuelPoint,
      skillPointBefore:currentSkillPoint,
      skillPointAfter:nextSkillPoint,
      charmBefore:currentCharm,
      charmAfter:nextCharm,
      sourceSideEffects:playerPlan.levelUp?[
        'CHAR_DUELPOINT += newLevel * 10 per level-up',
        'SKILLUPPOINT += UpLevel * 3',
        'CHARM += 2 once when UpLevel > 0, cap 100',
        'CHAR_complianceParameter(player)'
      ]:[]
    },
    pets:petPlans,
    persistentStateMutation:false,
    battleContextMutation:false,
    uiMutation:false,
    dbMutation:false,
    nextBoundary:'BATTLE_LEVELUP_COMMIT'
  };
}

function createBrowserBattleLevelUpPlanRuntime(){
  return {ok:true,format:BROWSER_BATTLE_LEVELUP_PLAN_RUNTIME_FORMAT,plan:planBattleLevelUp};
}

export {
  BROWSER_BATTLE_LEVELUP_PLAN_RUNTIME_FORMAT,
  ACTION_BATTLE_LEVELUP_PLAN,
  SOURCE_EXP_TABLE_MAX_LEVEL,
  SOURCE_PLAYER_NORMAL_LEVEL_CAP,
  SOURCE_CHARTRANS,
  SOURCE_PETTRANS,
  SOURCE_MAX_UP_LEVEL,
  EXP_TABLE,
  nextExpThreshold,
  planEntityLevelUp,
  planBattleLevelUp,
  createBrowserBattleLevelUpPlanRuntime
};
