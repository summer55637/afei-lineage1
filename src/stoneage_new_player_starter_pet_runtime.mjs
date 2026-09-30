const NEW_PLAYER_STARTER_PET_GRANT_FORMAT='stoneage-new-player-starter-pet-grant-v1';
const PET_MAX_HAVE=5;
const BASE_RNG_ROLLS=16;
const SOURCE_PET_RANK_TABLE=[
  {num:100,rank:0},
  {num:95,rank:1},
  {num:90,rank:2},
  {num:85,rank:3},
  {num:80,rank:4},
  {num:0,rank:5}
];

const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const intOr=(v,f=0)=>Number.isFinite(Number(v))?Math.trunc(Number(v)):f;
function defaultRandInclusive(min,max){
  const lo=Math.trunc(Number(min)); const hi=Math.trunc(Number(max));
  if(!Number.isFinite(lo)||!Number.isFinite(hi)||hi<lo)throw new RangeError('invalid inclusive RNG bounds');
  return lo+Math.floor(Math.random()*(hi-lo+1));
}
function resolveSourcePetRank(template){
  if(!isObject(template)||!isObject(template.baseStats))return {ok:false,reason:'starter-pet-rank-source-stats-missing'};
  const values=['vital','str','tgh','dex'].map(key=>Number(template.baseStats[key]));
  if(values.some(value=>!Number.isInteger(value)))return {ok:false,reason:'starter-pet-rank-source-stats-invalid'};
  const paramsum=values.reduce((sum,value)=>sum+value,0);
  const row=SOURCE_PET_RANK_TABLE.find(item=>paramsum>=item.num);
  if(!row)return {ok:false,reason:'starter-pet-rank-table-no-match'};
  return {ok:true,petRank:row.rank,paramsum,threshold:row.num,table:SOURCE_PET_RANK_TABLE};
}

function getStarterEntry(seed,hometown){
  if(!isObject(seed)||seed.format!=='stoneage-new-player-seed-runtime-v1')return null;
  return seed.starterPet?.entries?.find(x=>Number(x.hometown)===Number(hometown))??null;
}
function createSourceStarterPet(seed,hometown,{randInclusive=defaultRandInclusive,idFactory}={}){
  const entry=getStarterEntry(seed,hometown);
  if(!entry)return {ok:false,reason:'starter-pet-source-entry-missing',hometown};
  if(typeof randInclusive!=='function')return {ok:false,reason:'randInclusive-function-required'};
  if(typeof idFactory!=='function')return {ok:false,reason:'pet-canonical-id-factory-required'};
  const t=entry.template;
  const rank=resolveSourcePetRank(t);
  if(!rank.ok)return rank;
  const declaredRank=intOr(entry.sourceRank,-1);
  if(declaredRank!==rank.petRank)return {ok:false,reason:'starter-pet-rank-seed-mismatch',declaredRank,computedRank:rank.petRank};
  const declaredParamSum=intOr(entry.sourceRankParamsum,-1);
  if(declaredParamSum!==rank.paramsum)return {ok:false,reason:'starter-pet-rank-paramsum-seed-mismatch',declaredParamSum,computedParamSum:rank.paramsum};
  const lvRange=Array.isArray(entry.lvRange)&&entry.lvRange.length===2?entry.lvRange:[1,1];
  const level=intOr(randInclusive(lvRange[0],lvRange[1]),-1);
  if(level<lvRange[0]||level>lvRange[1])return {ok:false,reason:'invalid-starter-pet-level-roll'};
  const rolls=[{role:'level',min:lvRange[0],max:lvRange[1],roll:level}];
  const keys=['vital','str','tgh','dex'];
  const randomizedBase={};
  for(const key of keys){
    const base=intOr(t?.baseStats?.[key],0);
    const roll=intOr(randInclusive(0,4),-1);
    if(roll<0||roll>4)return {ok:false,reason:'invalid-starter-base-roll',field:key};
    randomizedBase[key]=base+roll-2;
    rolls.push({role:'base-'+key,min:0,max:4,roll});
  }
  const allocationCounts={vital:0,str:0,tgh:0,dex:0};
  for(let i=0;i<10;i++){
    const roll=intOr(randInclusive(0,3),-1);
    if(roll<0||roll>3)return {ok:false,reason:'invalid-starter-allocation-roll',index:i};
    allocationCounts[keys[roll]]++;
    rolls.push({role:'allocation',index:i,min:0,max:3,roll});
  }
  const baseAfterAllocation={};
  for(const key of keys)baseAfterAllocation[key]=randomizedBase[key]+allocationCounts[key];
  const multiplier=intOr(t?.initNum,0)+((level-1)*intOr(t?.lvUpPoint,0));
  const stats={};
  for(const key of keys)stats[key]=multiplier*baseAfterAllocation[key];
  const petMailEffect=intOr(randInclusive(0,1),-1);
  if(petMailEffect<0||petMailEffect>1)return {ok:false,reason:'invalid-starter-petmail-roll'};
  rolls.push({role:'petmail-effect',min:0,max:1,roll:petMailEffect});
  if(rolls.length!==BASE_RNG_ROLLS)return {ok:false,reason:'starter-rng-call-count-drift',actual:rolls.length};
  const maxHp=Math.trunc((stats.vital*4+stats.str+stats.tgh+stats.dex)*0.01);
  const id=String(idFactory({entry,stats,level})).trim();
  if(!id)return {ok:false,reason:'pet-canonical-id-factory-empty'};
  return {
    ok:true,
    format:NEW_PLAYER_STARTER_PET_GRANT_FORMAT,
    id,
    hometown:Number(hometown),
    enemyId:Number(entry.enemyId),
    petId:Number(entry.tempNo),
    tempNo:Number(entry.tempNo),
    name:t.name,
    level,
    exp:0,
    hp:maxHp,
    maxHp,
    variableAi:0,
    petMailEffect,
    petRank:rank.petRank,
    sourceRankResolved:true,
    sourceRankEvidence:{
      function:'gmsv/src/char/enemy.c::ENEMY_getRank',
      fixedCRef:seed.fixedSource.ref,
      paramsum:rank.paramsum,
      threshold:rank.threshold,
      rankTable:rank.table
    },
    stats,
    sourceStats:{
      randomized:randomizedBase,
      allocationCounts,
      afterAllocation:baseAfterAllocation,
      multiplier
    },
    elements:{...(t.elements??{})},
    status:{...(t.status??{})},
    petSkills:Array.isArray(t.petSkills)?t.petSkills.slice():[],
    rare:intOr(t.rare,0),
    critical:intOr(t.critical,0),
    counter:intOr(t.counter,0),
    slot:intOr(t.slot,0),
    imageNumber:intOr(t.imageNumber,0),
    modAi:intOr(t.modAi,0),
    limitLevel:intOr(t.limitLevel,0),
    sourceIdentity:{
      fixedCRef:seed.fixedSource.ref,
      hometown:Number(hometown),
      enemyId:Number(entry.enemyId),
      tempNo:Number(entry.tempNo)
    },
    rngCalls:rolls.length,
    rngRolls:rolls
  };
}

function grantSourceStarterPet(state,seed,hometown,{randInclusive=defaultRandInclusive,idFactory,now=()=>new Date().toISOString(),maxPetHave=PET_MAX_HAVE}={}){
  if(!isObject(state))return {ok:false,reason:'state-required'};
  if(!state.creation?.hometownConfigured||Number(state.creation.hometown)!==Number(hometown))return {ok:false,reason:'hometown-not-configured-for-starter-pet'};
  if(state.creation.starterPetGranted===true)return {ok:false,reason:'starter-pet-already-granted'};
  if(!Array.isArray(state.pets?.petBox))return {ok:false,reason:'pet-box-invalid'};
  const cap=Math.max(1,intOr(maxPetHave,PET_MAX_HAVE));
  if(state.pets.petBox.length>=cap)return {ok:false,reason:'pet-box-full'};
  const created=createSourceStarterPet(seed,hometown,{randInclusive,idFactory});
  if(!created.ok)return created;
  const next=JSON.parse(JSON.stringify(state));
  next.pets.petBox.push(created);
  next.creation.starterPetGranted=true;
  next.runtimeMeta.updatedAt=String(now());
  return {ok:true,state:next,pet:created,teamChanged:false,activePetChanged:false};
}

export { NEW_PLAYER_STARTER_PET_GRANT_FORMAT, SOURCE_PET_RANK_TABLE, resolveSourcePetRank, createSourceStarterPet, grantSourceStarterPet };
