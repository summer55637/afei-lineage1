const PLAYER_CREATION_RUNTIME_FORMAT='stoneage-player-creation-runtime-v1';
const STAT_KEYS=['vital','str','tgh','dex'];
const ELEMENT_KEYS=['earth','water','fire','wind'];
const MAX_STAT=20;
const MAX_ELEMENT=10;
const TOTAL_ELEMENT=10;

const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);

function normalizeAllocation(input, keys, fallback=0){
  const source=isObject(input)?input:{};
  return Object.fromEntries(keys.map(k=>[k, source[k] == null ? fallback : Number(source[k])]));
}

function validatePlayerCreationStats(stats){
  const a=normalizeAllocation(stats,STAT_KEYS);
  const errors=[];
  let total=0;
  for(const key of STAT_KEYS){
    const value=a[key];
    if(!Number.isInteger(value))errors.push(key+' must be an integer');
    else if(value<0||value>MAX_STAT)errors.push(key+' must be between 0 and 20');
    total+=Number.isFinite(value)?value:0;
  }
  if(errors.length===0&&total>MAX_STAT)errors.push('stat total must be <= 20 in _NEW_PLAYER_CF build');
  return {ok:errors.length===0,errors,allocation:a,total};
}

function validatePlayerCreationElements(elements){
  const a=normalizeAllocation(elements,ELEMENT_KEYS);
  const errors=[];
  let total=0;
  let positive=0;
  for(const key of ELEMENT_KEYS){
    const value=a[key];
    if(!Number.isInteger(value))errors.push(key+' must be an integer');
    else if(value<0||value>MAX_ELEMENT)errors.push(key+' must be between 0 and 10');
    else {
      total+=value;
      if(value>0)positive++;
    }
  }
  if(errors.length===0&&total!==TOTAL_ELEMENT)errors.push('element total must equal 10');
  if(errors.length===0&&positive>2)errors.push('at most two elements may be positive');
  if(errors.length===0&&(a.earth>0&&a.fire>0))errors.push('earth + fire is forbidden');
  if(errors.length===0&&(a.water>0&&a.wind>0))errors.push('water + wind is forbidden');
  return {ok:errors.length===0,errors,allocation:a,total,positive};
}

function derivePlayerCombatStats(stats){
  const checked=validatePlayerCreationStats(stats);
  if(!checked.ok)return {ok:false,errors:checked.errors};
  const {vital,str,tgh,dex}=checked.allocation;
  const attack=str+tgh*0.1+vital*0.1+dex*0.05;
  const defence=tgh+str*0.1+vital*0.1+dex*0.05;
  const quick=dex;
  const maxHp=Math.trunc(vital*4+str+tgh+dex);
  return {
    ok:true,
    sourceStoredStats:{vital:vital*100,str:str*100,tgh:tgh*100,dex:dex*100},
    sourceWork:{fixStr:attack,fixTough:defence,fixDex:quick},
    combat:{attack,defence,quick,maxHp,hp:maxHp}
  };
}

function applyPlayerCreationInput(state,{seed,hometown,stats,elements,now=()=>new Date().toISOString()}={}){
  if(!isObject(state))return {ok:false,reason:'state-required'};
  if(!isObject(seed)||seed.format!=='stoneage-new-player-seed-runtime-v1')return {ok:false,reason:'new-player-seed-required'};
  const h=Number(hometown);
  const home=seed.hometowns?.find(x=>Number(x.hometown)===h);
  if(!home)return {ok:false,reason:'invalid-hometown'};
  const statCheck=validatePlayerCreationStats(stats);
  if(!statCheck.ok)return {ok:false,stage:'stats',errors:statCheck.errors};
  const elementCheck=validatePlayerCreationElements(elements);
  if(!elementCheck.ok)return {ok:false,stage:'elements',errors:elementCheck.errors};
  const combat=derivePlayerCombatStats(statCheck.allocation);
  if(state.creation?.playerCreationStatsConfigured===true||state.creation?.hometownConfigured===true||state.creation?.elementsConfigured===true){
    return {ok:false,reason:'creation-input-already-locked'};
  }
  const next=JSON.parse(JSON.stringify(state));
  next.creation.hometown=h;
  next.creation.hometownConfigured=true;
  next.creation.playerCreationStats={...statCheck.allocation};
  next.creation.playerCreationStatsConfigured=true;
  next.creation.elements={...elementCheck.allocation};
  next.creation.elementsConfigured=true;
  next.creation.starterPetGranted=false;
  next.creation.starterItemGranted=false;
  next.creation.completed=false;
  next.creation.source={fixedCRef:seed.fixedSource.ref,seedFormat:seed.format};
  next.player.level=Number(seed.sourceConfig.level);
  next.player.transmigration=Number(seed.sourceConfig.transmigration);
  next.player.gold=Number(seed.sourceConfig.gold);
  next.player.charm=60;
  next.player.maxMp=100;
  next.player.mp=100;
  next.player.stats={...statCheck.allocation};
  next.player.hp=combat.combat.hp;
  next.player.maxHp=combat.combat.maxHp;
  next.runtimeMeta.updatedAt=String(now());
  return {
    ok:true,
    state:next,
    creation:{
      hometown:h,
      position:{floorId:home.floor,x:home.x,y:home.y},
      stats:statCheck.allocation,
      elements:elementCheck.allocation,
      combat:combat.combat,
      sourceStoredStats:combat.sourceStoredStats,
      sourceStoredElements:Object.fromEntries(ELEMENT_KEYS.map(k=>[k,elementCheck.allocation[k]*10])),
      starterItemPending:Number(seed.sourceConfig.itemSlots?.ITEM1??0)||null,
      starterPetPending:seed.starterPet?.entries?.find(x=>Number(x.hometown)===h)?.enemyId??null
    }
  };
}

export {
  PLAYER_CREATION_RUNTIME_FORMAT,
  validatePlayerCreationStats,
  validatePlayerCreationElements,
  derivePlayerCombatStats,
  applyPlayerCreationInput
};
