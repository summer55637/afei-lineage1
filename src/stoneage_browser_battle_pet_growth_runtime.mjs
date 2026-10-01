const BROWSER_BATTLE_PET_GROWTH_PLAN_RUNTIME_FORMAT='stoneage-v415-browser-battle-pet-growth-plan-v1';
const ACTION_BATTLE_PET_GROWTH_PLAN='BATTLE_PET_GROWTH_PLAN';
const PET_STAT_KEYS=['vital','str','tgh','dex'];
const PET_RANK_RANGES=[
  {min:450,max:500},
  {min:470,max:520},
  {min:490,max:540},
  {min:510,max:560},
  {min:530,max:580},
  {min:550,max:600}
];

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const intOr=(value,fallback=null)=>{
  if(value==null||String(value).trim()==='')return fallback;
  const n=Number(value);
  return Number.isFinite(n)?Math.trunc(n):fallback;
};
const clone=value=>JSON.parse(JSON.stringify(value));

function decodeAllocPointPacked(value){
  const n=intOr(value,null);
  if(n==null||n<0||n>4294967295)return null;
  return {
    vital:Math.floor(n/16777216)%256,
    str:Math.floor(n/65536)%256,
    tgh:Math.floor(n/256)%256,
    dex:n%256
  };
}

function encodeAllocPointPacked(stats){
  if(!isObject(stats)||PET_STAT_KEYS.some(k=>!Number.isInteger(Number(stats[k]))||Number(stats[k])<0||Number(stats[k])>255))return null;
  return PET_STAT_KEYS.reduce((sum,key,index)=>sum+Math.trunc(Number(stats[key]))*Math.pow(256,3-index),0);
}

function validateRankRoll(rank,roll){
  const r=intOr(rank,null), x=intOr(roll,null);
  if(r==null||r<0||r>5||x==null)return false;
  const bound=PET_RANK_RANGES[r];
  return x>=bound.min&&x<=bound.max;
}

function calculatePetGrowthLevel({allocPointPacked,petRank,rngRolls}={}){
  const alloc=decodeAllocPointPacked(allocPointPacked);
  if(!alloc)return {ok:false,reason:'pet-allocpoint-required-or-invalid'};
  const rank=intOr(petRank,null);
  if(rank==null||rank<0||rank>5)return {ok:false,reason:'pet-rank-required-or-invalid'};
  if(!Array.isArray(rngRolls)||rngRolls.length!==11)return {ok:false,reason:'pet-growth-rng-11-rolls-required'};
  const allocation=[0,0,0,0];
  for(let i=0;i<10;i++){
    const roll=intOr(rngRolls[i],null);
    if(roll==null||roll<0||roll>3)return {ok:false,reason:'pet-growth-allocation-roll-invalid',index:i,roll};
    allocation[roll]+=1;
  }
  const rankRoll=intOr(rngRolls[10],null);
  if(!validateRankRoll(rank,rankRoll)){
    const bound=PET_RANK_RANGES[rank];
    return {ok:false,reason:'pet-growth-rank-roll-invalid',rank,rankRoll,min:bound.min,max:bound.max};
  }
  const multiplier=rankRoll*0.01;
  const delta={};
  const work={};
  PET_STAT_KEYS.forEach((key,index)=>{
    const base=alloc[key]+allocation[index];
    work[key]=base;
    delta[key]=Math.trunc(base*multiplier);
  });
  return {
    ok:true,
    allocPointPacked:intOr(allocPointPacked,0),
    alloc,
    allocationCounts:{
      vital:allocation[0],str:allocation[1],tgh:allocation[2],dex:allocation[3]
    },
    rank,
    rankRoll,
    multiplier,
    work,
    delta,
    rngCalls:11,
    rngRolls:rngRolls.slice()
  };
}

function findPet(state,petId){
  const id=String(petId??'').trim();
  if(!id||!Array.isArray(state?.pets?.petBox))return null;
  return state.pets.petBox.find(p=>String(p?.id??'').trim()===id)??null;
}

function planBattlePetGrowth(battleLevelUpPlan,state,{rngEvidenceByPetId={}}={}){
  if(!isObject(battleLevelUpPlan)||battleLevelUpPlan.ok!==true||
     battleLevelUpPlan.stage!=='battle-levelup-plan-ready'||
     battleLevelUpPlan.format!=='stoneage-v414-browser-battle-levelup-plan-v1'){
    return {ok:false,handled:false,stage:'battle-pet-growth-plan',reason:'battle-levelup-plan-invalid'};
  }
  if(!isObject(state)||!isObject(state.pets)||!Array.isArray(state.pets.petBox)){
    return {ok:false,handled:false,stage:'battle-pet-growth-plan',reason:'persistent-pet-box-required'};
  }

  const petPlans=[];
  for(const plannedPet of Array.isArray(battleLevelUpPlan.pets)?battleLevelUpPlan.pets:[]){
    const petId=String(plannedPet?.petId??'').trim();
    if(!petId||intOr(plannedPet?.levelUps,0)<=0)continue;
    const pet=findPet(state,petId);
    if(!pet)return {ok:false,handled:false,stage:'battle-pet-growth-plan',reason:'persistent-pet-missing',petId};

    const allocPointPacked=intOr(pet.allocPointPacked??pet.charAllocPointPacked,null);
    const petRank=intOr(pet.petRank??pet.rank,null);
    if(allocPointPacked==null)return {ok:false,handled:false,stage:'battle-pet-growth-plan',reason:'pet-allocpoint-not-source-closed',petId};
    if(petRank==null)return {ok:false,handled:false,stage:'battle-pet-growth-plan',reason:'pet-rank-not-source-closed',petId};

    const statSource=isObject(pet.stats)?pet.stats:(isObject(pet.serverStats)?pet.serverStats:null);
    if(!statSource || PET_STAT_KEYS.some(k=>!Number.isFinite(Number(statSource[k])))){
      return {ok:false,handled:false,stage:'battle-pet-growth-plan',reason:'pet-stat-source-required',petId};
    }

    const evidence=rngEvidenceByPetId?.[petId];
    if(!Array.isArray(evidence)||evidence.length!==intOr(plannedPet.levelUps,0)){
      return {ok:false,handled:false,stage:'battle-pet-growth-plan',reason:'pet-growth-rng-evidence-count-mismatch',petId,required:intOr(plannedPet.levelUps,0)};
    }

    const levelResults=[];
    const cumulativeDelta={vital:0,str:0,tgh:0,dex:0};
    let currentStats=PET_STAT_KEYS.reduce((o,k)=>(o[k]=intOr(statSource[k],0),o),{});
    for(let levelIndex=0;levelIndex<intOr(plannedPet.levelUps,0);levelIndex++){
      const levelCalc=calculatePetGrowthLevel({
        allocPointPacked,
        petRank,
        rngRolls:evidence[levelIndex]
      });
      if(!levelCalc.ok)return {ok:false,handled:false,stage:'battle-pet-growth-plan',reason:levelCalc.reason,petId,levelIndex,...levelCalc};
      const nextStats={...currentStats};
      PET_STAT_KEYS.forEach(k=>{
        nextStats[k]=currentStats[k]+levelCalc.delta[k];
        cumulativeDelta[k]+=levelCalc.delta[k];
      });
      levelResults.push({
        levelIndex,
        fromLevel:intOr(plannedPet.levelBefore,1)+levelIndex,
        toLevel:intOr(plannedPet.levelBefore,1)+levelIndex+1,
        calculation:levelCalc,
        statsBefore:{...currentStats},
        statsAfter:{...nextStats}
      });
      currentStats=nextStats;
    }

    petPlans.push({
      petId,
      levelUps:intOr(plannedPet.levelUps,0),
      allocPointPacked,
      petRank,
      statsBefore:PET_STAT_KEYS.reduce((o,k)=>(o[k]=intOr(statSource[k],0),o),{}),
      cumulativeDelta,
      statsAfter:currentStats,
      levels:levelResults,
      complianceDeferred:true,
      sourceSideEffects:[
        'CHAR_PetLevelUp per planned level',
        'CHAR_complianceParameter after Pet growth'
      ]
    });
  }

  return {
    ok:true,
    handled:true,
    stage:'battle-pet-growth-plan-ready',
    format:BROWSER_BATTLE_PET_GROWTH_PLAN_RUNTIME_FORMAT,
    action:ACTION_BATTLE_PET_GROWTH_PLAN,
    source:{
      fixedCRef:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      function:'CHAR_PetLevelUp',
      rankRanges:PET_RANK_RANGES,
      rngCallsPerLevel:11,
      packedOrder:['vital','str','tgh','dex']
    },
    pets:petPlans,
    persistentStateMutation:false,
    battleContextMutation:false,
    uiMutation:false,
    dbMutation:false,
    rerollAtCommit:false,
    nextBoundary:'BATTLE_LEVELUP_COMMIT'
  };
}

function createBrowserBattlePetGrowthPlanRuntime(){
  return {ok:true,format:BROWSER_BATTLE_PET_GROWTH_PLAN_RUNTIME_FORMAT,plan:planBattlePetGrowth};
}

export {
  BROWSER_BATTLE_PET_GROWTH_PLAN_RUNTIME_FORMAT,
  ACTION_BATTLE_PET_GROWTH_PLAN,
  PET_RANK_RANGES,
  decodeAllocPointPacked,
  encodeAllocPointPacked,
  calculatePetGrowthLevel,
  planBattlePetGrowth,
  createBrowserBattlePetGrowthPlanRuntime
};
