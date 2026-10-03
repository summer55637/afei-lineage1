const BROWSER_BATTLE_LEVELUP_COMMIT_RUNTIME_FORMAT='stoneage-v416-browser-battle-levelup-commit-v1';
const ACTION_BATTLE_LEVELUP_COMMIT='BATTLE_LEVELUP_COMMIT';
const TRANSACTION_BUCKET='battleLevelUpTransactions';
const MAX_PLAYER_DUELPOINT=100000000;
const MAX_PLAYER_EXP=1224160000;
const PET_STAT_KEYS=['vital','str','tgh','dex'];

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const intOr=(value,fallback=null)=>{
  if(value==null||String(value).trim()==='')return fallback;
  const n=Number(value);
  return Number.isFinite(n)?Math.trunc(n):fallback;
};
const clone=value=>JSON.parse(JSON.stringify(value));

function validatePlans(levelPlan,petGrowthPlan){
  const errors=[];
  if(!isObject(levelPlan)||levelPlan.ok!==true||levelPlan.stage!=='battle-levelup-plan-ready'||levelPlan.format!=='stoneage-v414-browser-battle-levelup-plan-v1')errors.push('battle-levelup-plan-invalid');
  if(!isObject(petGrowthPlan)||petGrowthPlan.ok!==true||petGrowthPlan.stage!=='battle-pet-growth-plan-ready'||petGrowthPlan.format!=='stoneage-v415-browser-battle-pet-growth-plan-v1')errors.push('pet-growth-plan-invalid');
  return errors;
}

function findPet(state,id){
  const needle=String(id??'').trim();
  if(!needle||!Array.isArray(state?.pets?.petBox))return null;
  return state.pets.petBox.find(p=>String(p?.id??'').trim()===needle)??null;
}

function commitBattleLevelUp(state,levelPlan,petGrowthPlan,{transactionId=null,expectedRevision=null,now=()=>new Date().toISOString()}={}){
  if(!isObject(state)||!isObject(state.player))return {ok:false,handled:false,stage:'battle-levelup-commit',reason:'persistent-state-required',state:clone(state)};
  const errors=validatePlans(levelPlan,petGrowthPlan);
  if(errors.length)return {ok:false,handled:false,stage:'battle-levelup-commit',reason:'plan-invalid',errors,state:clone(state)};
  const tx=String(transactionId??levelPlan.transactionId??'').trim();
  if(!tx)return {ok:false,handled:false,stage:'battle-levelup-commit',reason:'transaction-id-required',state:clone(state)};

  const currentRevision=intOr(state.revision,0);
  const meta=isObject(state.runtimeMeta)?state.runtimeMeta:{};
  const bucket=isObject(meta[TRANSACTION_BUCKET])?meta[TRANSACTION_BUCKET]:{};
  if(bucket[tx]){
    return {
      ok:true,handled:true,stage:'battle-levelup-commit-idempotent',
      format:BROWSER_BATTLE_LEVELUP_COMMIT_RUNTIME_FORMAT,
      action:ACTION_BATTLE_LEVELUP_COMMIT,transactionId:tx,idempotent:true,applied:false,
      revision:currentRevision,state:clone(state)
    };
  }
  if(expectedRevision!=null&&currentRevision!==intOr(expectedRevision,null)){
    return {ok:false,handled:false,stage:'battle-levelup-commit',reason:'revision-conflict',currentRevision,expectedRevision:intOr(expectedRevision,null),state:clone(state)};
  }

  const playerPlan=levelPlan.player;
  const playerExpBefore=intOr(playerPlan?.expBefore,null);
  const playerLevelBefore=intOr(playerPlan?.levelBefore,null);
  const playerDpBefore=intOr(playerPlan?.duelPointBefore,null);
  const playerSkillBefore=intOr(playerPlan?.skillPointBefore,null);
  const playerCharmBefore=intOr(playerPlan?.charmBefore,null);
  if([playerExpBefore,playerLevelBefore,playerDpBefore,playerSkillBefore,playerCharmBefore].some(v=>v==null)){
    return {ok:false,handled:false,stage:'battle-levelup-commit',reason:'player-plan-snapshot-incomplete',state:clone(state)};
  }
  if(intOr(state.player.exp,0)!==playerExpBefore || intOr(state.player.level,1)!==playerLevelBefore){
    return {ok:false,handled:false,stage:'battle-levelup-commit',reason:'player-progression-stale-plan',state:clone(state)};
  }
  if(intOr(state.player.duelPoint,0)!==playerDpBefore){
    return {ok:false,handled:false,stage:'battle-levelup-commit',reason:'player-duelpoint-stale-plan',state:clone(state)};
  }
  if(intOr(state.player?.profession?.skillPoint,0)!==playerSkillBefore){
    return {ok:false,handled:false,stage:'battle-levelup-commit',reason:'player-skillpoint-stale-plan',state:clone(state)};
  }
  if(intOr(state.player.charm,0)!==playerCharmBefore){
    return {ok:false,handled:false,stage:'battle-levelup-commit',reason:'player-charm-stale-plan',state:clone(state)};
  }

  const nextPlayerLevel=intOr(playerPlan.levelAfter,null);
  const nextPlayerExp=intOr(playerPlan.expAfter,null);
  const nextPlayerDp=intOr(playerPlan.duelPointAfter,null);
  const nextPlayerSkill=intOr(playerPlan.skillPointAfter,null);
  const nextPlayerCharm=intOr(playerPlan.charmAfter,null);
  if(nextPlayerLevel==null||nextPlayerLevel<playerLevelBefore||nextPlayerExp==null||nextPlayerExp<0||nextPlayerExp>MAX_PLAYER_EXP||
     nextPlayerDp==null||nextPlayerDp<0||nextPlayerDp>MAX_PLAYER_DUELPOINT||
     nextPlayerSkill==null||nextPlayerSkill<playerSkillBefore||nextPlayerCharm==null||nextPlayerCharm<0||nextPlayerCharm>100){
    return {ok:false,handled:false,stage:'battle-levelup-commit',reason:'player-plan-result-invalid',state:clone(state)};
  }

  const growthById=new Map((petGrowthPlan.pets??[]).map(p=>[String(p?.petId??'').trim(),p]));
  for(const p of Array.isArray(levelPlan.pets)?levelPlan.pets:[]){
    const count=intOr(p?.levelUps,0);
    const id=String(p?.petId??'').trim();
    const aiBefore=intOr(p?.variableAiBefore,0);
    const aiAfter=intOr(p?.variableAiAfter,aiBefore);
    const persistentPet=findPet(state,id);
    if(persistentPet&&intOr(persistentPet.variableAi,0)!==aiBefore){
      return {ok:false,handled:false,stage:'battle-levelup-commit',reason:'pet-variableai-stale-plan',petId:id,state:clone(state)};
    }
    if(count<=0)continue;
    const id=String(p?.petId??'').trim();
    const growth=growthById.get(id);
    if(!growth||intOr(growth.levelUps,0)!==count){
      return {ok:false,handled:false,stage:'battle-levelup-commit',reason:'pet-growth-plan-required-for-levelups',petId:id};
    }
  }

  const next=clone(state);
  next.player.level=nextPlayerLevel;
  next.player.exp=nextPlayerExp;
  next.player.duelPoint=nextPlayerDp;
  next.player.profession=next.player.profession&&typeof next.player.profession==='object'?next.player.profession:{};
  next.player.profession.skillPoint=nextPlayerSkill;
  next.player.charm=nextPlayerCharm;
  next.pets=next.pets&&typeof next.pets==='object'?next.pets:{petBox:[],team:[],activePetId:null};

  const committedPets=[];
  for(const p of Array.isArray(levelPlan.pets)?levelPlan.pets:[]){
    const id=String(p?.petId??'').trim();
    const count=intOr(p?.levelUps,0);
    const aiBefore=intOr(p?.variableAiBefore,0);
    const aiAfter=intOr(p?.variableAiAfter,aiBefore);
    if(!id)continue;
    const pet=findPet(next,id);
    if(!pet)return {ok:false,handled:false,stage:'battle-levelup-commit',reason:'persistent-pet-missing',petId:id,state:clone(state)};
    if(intOr(pet.variableAi,0)!==aiBefore){
      return {ok:false,handled:false,stage:'battle-levelup-commit',reason:'pet-variableai-stale-plan',petId:id,state:clone(state)};
    }
    const aiChanged=aiAfter!==aiBefore;
    if(aiChanged)pet.variableAi=aiAfter;
    if(count<=0){
      committedPets.push({petId:id,levelBefore:intOr(pet.level,1),levelAfter:intOr(pet.level,1),expBefore:intOr(pet.exp,0),expAfter:intOr(pet.exp,0),levelUps:0,variableAiBefore:aiBefore,variableAiAfter:aiAfter,variableAiDelta:aiAfter-aiBefore});
      continue;
    }
    if(intOr(pet.level,1)!==intOr(p.levelBefore,1) || intOr(pet.exp,0)!==intOr(p.expBefore,0)){
      return {ok:false,handled:false,stage:'battle-levelup-commit',reason:'pet-progression-stale-plan',petId:id,state:clone(state)};
    }
    const growth=growthById.get(id);
    if(PET_STAT_KEYS.some(k=>intOr(pet.stats?.[k],null)!==intOr(growth.statsBefore?.[k],null))){
      return {ok:false,handled:false,stage:'battle-levelup-commit',reason:'pet-stats-stale-plan',petId:id,state:clone(state)};
    }
    pet.level=intOr(p.levelAfter,intOr(p.levelBefore,1));
    pet.exp=intOr(p.expAfter,intOr(p.expBefore,0));
    pet.stats=PET_STAT_KEYS.reduce((o,k)=>(o[k]=intOr(growth.statsAfter?.[k],intOr(pet.stats?.[k],0)),o),{});
    pet.serverStats={...pet.stats};
    committedPets.push({petId:id,levelBefore:intOr(p.levelBefore,1),levelAfter:pet.level,expBefore:intOr(p.expBefore,0),expAfter:pet.exp,levelUps:count,variableAiBefore:aiBefore,variableAiAfter:pet.variableAi,variableAiDelta:pet.variableAi-aiBefore});
  }

  const timestamp=String(typeof now==='function'?now():now);
  next.runtimeMeta=isObject(next.runtimeMeta)?next.runtimeMeta:{};
  next.runtimeMeta[TRANSACTION_BUCKET]=isObject(next.runtimeMeta[TRANSACTION_BUCKET])?next.runtimeMeta[TRANSACTION_BUCKET]:{};
  next.runtimeMeta[TRANSACTION_BUCKET][tx]={
    committedAt:timestamp,
    player:{levelBefore:playerLevelBefore,levelAfter:nextPlayerLevel,expBefore:playerExpBefore,expAfter:nextPlayerExp,duelPointBefore:playerDpBefore,duelPointAfter:nextPlayerDp},
    pets:committedPets,
    revisionBefore:currentRevision,
    revisionAfter:currentRevision+1
  };
  next.runtimeMeta.updatedAt=timestamp;
  next.revision=currentRevision+1;

  return {
    ok:true,handled:true,stage:'battle-levelup-commit-applied',
    format:BROWSER_BATTLE_LEVELUP_COMMIT_RUNTIME_FORMAT,
    action:ACTION_BATTLE_LEVELUP_COMMIT,transactionId:tx,
    idempotent:false,applied:true,
    revisionBefore:currentRevision,revisionAfter:next.revision,
    player:{
      levelBefore:playerLevelBefore,levelAfter:nextPlayerLevel,
      expBefore:playerExpBefore,expAfter:nextPlayerExp,
      duelPointBefore:playerDpBefore,duelPointAfter:nextPlayerDp,
      skillPointBefore:playerSkillBefore,skillPointAfter:nextPlayerSkill,
      charmBefore:playerCharmBefore,charmAfter:nextPlayerCharm
    },
    pets:committedPets,
    playerComplianceDeferred:true,
    petComplianceDeferred:committedPets.length>0,
    persistentMutation:true,
    battleContextMutation:false,uiMutation:false,dbMutation:false,
    rngPreserved:true,
    sourceSideEffects:[
      'CHAR_complianceParameter(player) when UpLevel > 0',
      'CHAR_PetLevelUp per planned pet level',
      'CHAR_PetAddVariableAi(AI_FIX_PETLEVELUP) per planned pet level',
      'CHAR_complianceParameter(pet) after pet growth'
    ],
    state:next
  };
}

function createBrowserBattleLevelUpCommitRuntime(){
  return {ok:true,format:BROWSER_BATTLE_LEVELUP_COMMIT_RUNTIME_FORMAT,commit:commitBattleLevelUp};
}

export {
  BROWSER_BATTLE_LEVELUP_COMMIT_RUNTIME_FORMAT,
  ACTION_BATTLE_LEVELUP_COMMIT,
  TRANSACTION_BUCKET,
  commitBattleLevelUp,
  createBrowserBattleLevelUpCommitRuntime
};
