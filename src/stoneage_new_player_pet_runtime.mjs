const NEW_PLAYER_PET_RUNTIME_FORMAT='stoneage-new-player-pet-runtime-v1';
const NEW_PLAYER_PET_HANDLER_FORMAT='stoneage-new-player-pet-handler-v1';
const PET_MAX_HAVE=5;
const PETMAIL_EFFECT_MAX=1;

const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const intOr=(v,f=0)=>Number.isFinite(Number(v))?Math.trunc(Number(v)):f;

function defaultRandInclusive(min,max){
  const lo=Math.trunc(Number(min));
  const hi=Math.trunc(Number(max));
  if(!Number.isFinite(lo)||!Number.isFinite(hi)||hi<lo)throw new RangeError('invalid inclusive RNG bounds');
  return lo+Math.floor(Math.random()*(hi-lo+1));
}

function validateNewPlayerPetCatalog(catalog){
  const errors=[];
  if(!isObject(catalog))return {ok:false,errors:['catalog must be an object']};
  if(catalog.format!==NEW_PLAYER_PET_RUNTIME_FORMAT)errors.push('catalog format drift');
  if(!isObject(catalog.byEnemyId))errors.push('catalog byEnemyId must be an object');
  if(!isObject(catalog.byTempNo))errors.push('catalog byTempNo must be an object');
  if(intOr(catalog.petMaxHave,-1)!==PET_MAX_HAVE)errors.push('catalog petMaxHave must be 5');
  return {ok:errors.length===0,errors};
}

function resolveNewPlayerPetTemplate(catalog,enemyId){
  const validation=validateNewPlayerPetCatalog(catalog);
  if(!validation.ok)return {ok:false,reason:'invalid-new-player-pet-catalog',errors:validation.errors};
  const id=intOr(enemyId,-1);
  if(id<0)return {ok:false,reason:'invalid-enemy-id'};
  const row=catalog.byEnemyId[String(id)];
  if(!isObject(row))return {ok:false,reason:'source-pet-enemy-id-missing',enemyId:id};
  if(row.enemyId!==id)return {ok:false,reason:'source-pet-enemy-id-mismatch',enemyId:id,rowEnemyId:row.enemyId};
  const tempNo=intOr(row.tempNo,-1);
  if(tempNo<0)return {ok:false,reason:'source-pet-tempno-missing',enemyId:id};
  const template=catalog.byTempNo[String(tempNo)];
  if(!isObject(template))return {ok:false,reason:'source-pet-enemybase-template-missing',enemyId:id,tempNo};
  return {ok:true,enemy:row,template,tempNo};
}

function createSourceNewPlayerPet(catalog,enemyId,{randInclusive=defaultRandInclusive}={}){
  const resolved=resolveNewPlayerPetTemplate(catalog,enemyId);
  if(!resolved.ok)return resolved;
  if(typeof randInclusive!=='function')return {ok:false,reason:'randInclusive-function-required',enemyId};
  const e=resolved.enemy;
  const t=resolved.template;
  const rolls=[];
  const levelRoll=Number(randInclusive(e.lvMin,e.lvMax));
  if(!Number.isInteger(levelRoll)||levelRoll<e.lvMin||levelRoll>e.lvMax)return {ok:false,reason:'invalid-level-rng-result',enemyId,roll:levelRoll};
  rolls.push({role:'level',min:e.lvMin,max:e.lvMax,roll:levelRoll});
  const baseKeys=['vital','str','tgh','dex'];
  const randomizedBase={};
  for(const key of baseKeys){
    const raw=Number(t.baseStats?.[key]??0);
    const roll=Number(randInclusive(0,4));
    if(!Number.isInteger(roll)||roll<0||roll>4)return {ok:false,reason:'invalid-base-rng-result',enemyId,field:key,roll};
    randomizedBase[key]=intOr(raw,0)+roll-2;
    rolls.push({role:'base-'+key,min:0,max:4,roll});
  }
  const allocationCounts={vital:0,str:0,tgh:0,dex:0};
  for(let i=0;i<10;i++){
    const roll=Number(randInclusive(0,3));
    if(!Number.isInteger(roll)||roll<0||roll>3)return {ok:false,reason:'invalid-allocation-rng-result',enemyId,allocationIndex:i,roll};
    allocationCounts[baseKeys[roll]]++;
    rolls.push({role:'allocation',index:i,min:0,max:3,roll});
  }
  const baseAfterAllocation={
    vital:randomizedBase.vital+allocationCounts.vital,
    str:randomizedBase.str+allocationCounts.str,
    tgh:randomizedBase.tgh+allocationCounts.tgh,
    dex:randomizedBase.dex+allocationCounts.dex
  };
  const multiplier=intOr(t.initNum,0)+((levelRoll-1)*intOr(t.lvUpPoint,0));
  const stats={
    vital:multiplier*baseAfterAllocation.vital,
    str:multiplier*baseAfterAllocation.str,
    tgh:multiplier*baseAfterAllocation.tgh,
    dex:multiplier*baseAfterAllocation.dex
  };
  const petMailEffect=Number(randInclusive(0,PETMAIL_EFFECT_MAX));
  if(!Number.isInteger(petMailEffect)||petMailEffect<0||petMailEffect>PETMAIL_EFFECT_MAX)return {ok:false,reason:'invalid-petmail-rng-result',enemyId,roll:petMailEffect};
  rolls.push({role:'petmail-effect',min:0,max:PETMAIL_EFFECT_MAX,roll:petMailEffect});

  return {
    ok:true,
    format:NEW_PLAYER_PET_RUNTIME_FORMAT,
    enemyId:e.enemyId,
    petId:t.tempNo,
    tempNo:t.tempNo,
    name:t.name,
    level:levelRoll,
    imageNumber:t.imageNumber,
    slot:t.slot,
    modAi:t.modAi,
    rare:t.rare,
    critical:t.critical,
    counter:t.counter,
    limitLevel:t.limitLevel,
    petFlg:t.petFlg,
    elements:{...t.elements},
    status:{...t.status},
    petSkills:Array.isArray(t.petSkills)?t.petSkills.slice():[],
    sourceBaseStats:{
      randomized:randomizedBase,
      allocationCounts,
      afterAllocation:baseAfterAllocation,
      multiplier
    },
    stats,
    petMailEffect,
    sourceIdentity:{
      enemyId:e.enemyId,
      enemyTempNo:e.tempNo,
      enemyName:e.name,
      enemyLvRange:[e.lvMin,e.lvMax],
      enemyPetFlg:e.petFlg,
      enemySource:e.source,
      enemyBaseTempNo:t.tempNo,
      enemyBaseName:t.name,
      enemyBaseSource:t.source
    },
    unresolvedDerived:{
      hpMpCompliance:true,
      rank:true,
      canonicalId:true
    },
    rngCalls:rolls.length,
    rngRolls:rolls
  };
}

function createSourcePetGetPetHandler({catalog,idFactory,randInclusive=defaultRandInclusive,maxPetHave=PET_MAX_HAVE}={}){
  return (state,payload)=>{
    if(typeof idFactory!=='function')return {ok:false,reason:'pet-canonical-id-factory-required'};
    const petId=intOr(payload?.petId,-1);
    const created=createSourceNewPlayerPet(catalog,petId,{randInclusive});
    if(!created.ok)return created;
    const pets=isObject(state?.pets)?state.pets:(state.pets={petBox:[],team:[],activePetId:null});
    if(!Array.isArray(pets.petBox))pets.petBox=[];
    const cap=Math.max(1,intOr(maxPetHave,PET_MAX_HAVE));
    if(pets.petBox.length>=cap)return {ok:false,reason:'pet-box-full',enemyId:petId,maxPetHave:cap};
    const id=String(idFactory(state,created)).trim();
    if(!id)return {ok:false,reason:'pet-canonical-id-factory-empty',enemyId:petId};
    if(pets.petBox.some(p=>String(p?.id??'')===id))return {ok:false,reason:'pet-canonical-id-duplicate',enemyId:petId,id};
    const pet={...created,id};
    pets.petBox.push(pet);
    return {ok:true,pet,source:created.sourceIdentity};
  };
}

export {
  NEW_PLAYER_PET_RUNTIME_FORMAT,
  NEW_PLAYER_PET_HANDLER_FORMAT,
  PET_MAX_HAVE,
  PETMAIL_EFFECT_MAX,
  defaultRandInclusive,
  validateNewPlayerPetCatalog,
  resolveNewPlayerPetTemplate,
  createSourceNewPlayerPet,
  createSourcePetGetPetHandler
};
