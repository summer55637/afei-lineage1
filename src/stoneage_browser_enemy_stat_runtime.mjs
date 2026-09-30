const BROWSER_ENEMY_STAT_RUNTIME_FORMAT='stoneage-v390-browser-enemy-stat-runtime-v1';
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

const clone=value=>JSON.parse(JSON.stringify(value));
const toInt=value=>{
  const s=String(value??'').trim();
  if(s==='')return null;
  const m=s.match(/^[+-]?\d+/);
  return m?Number(m[0]):null;
};
const toFinite=value=>{
  const n=Number(value);
  return Number.isFinite(n)?n:null;
};
const requireRoll=(value,min,max,name)=>{
  const n=toInt(value);
  if(n==null||n<min||n>max)return {ok:false,reason:name+'-rng-required-or-out-of-range',roll:n,min,max};
  return {ok:true,roll:n};
};

function computeEnemyStats(enemy,{level=null,levelRoll=null,baseStatRolls=[],allocationRolls=[]}={}){
  const base=enemy?.base??null;
  if(!base||typeof base!=='object')return {ok:false,handled:false,stage:'enemy-stat',reason:'enemy-base-required'};
  const levelMin=toInt(enemy?.levelMin),levelMax=toInt(enemy?.levelMax);
  if(level==null){
    if(levelMin==null||levelMax==null||levelMin<1||levelMax<levelMin)return {ok:false,handled:false,stage:'enemy-stat',reason:'enemy-level-range-invalid'};
    const rr=requireRoll(levelRoll,0,levelMax-levelMin,'enemy-level');
    if(!rr.ok)return {...rr,handled:false,stage:'enemy-stat'};
    level=levelMin+rr.roll;
  }else{
    level=toInt(level);
    if(level==null||level<1)return {ok:false,handled:false,stage:'enemy-stat',reason:'enemy-level-invalid'};
  }

  if(!Array.isArray(baseStatRolls)||baseStatRolls.length!==4)return {ok:false,handled:false,stage:'enemy-stat',reason:'base-stat-rngs-four-required'};
  if(!Array.isArray(allocationRolls)||allocationRolls.length!==10)return {ok:false,handled:false,stage:'enemy-stat',reason:'allocation-rngs-ten-required'};

  const statNames=['vital','str','tgh','dex'];
  const baseValues={
    vital:toInt(base.baseVital),
    str:toInt(base.baseStr),
    tgh:toInt(base.baseTgh),
    dex:toInt(base.baseDex)
  };
  if(Object.values(baseValues).some(v=>v==null))return {ok:false,handled:false,stage:'enemy-stat',reason:'enemy-base-four-stats-required'};
  const lvupPoint=toFinite(base.lvupPoint),initNum=toInt(base.initNum);
  if(lvupPoint==null||initNum==null)return {ok:false,handled:false,stage:'enemy-stat',reason:'enemy-base-growth-fields-required'};

  const mutated={...baseValues};
  const baseRngConsumed=[];
  for(let i=0;i<4;i++){
    const rr=requireRoll(baseStatRolls[i],0,4,'base-stat');
    if(!rr.ok)return {...rr,handled:false,stage:'enemy-stat',rollIndex:i};
    mutated[statNames[i]]+=rr.roll-2;
    baseRngConsumed.push(rr.roll);
  }
  const allocationRngConsumed=[];
  for(let i=0;i<10;i++){
    const rr=requireRoll(allocationRolls[i],0,3,'allocation');
    if(!rr.ok)return {...rr,handled:false,stage:'enemy-stat',rollIndex:i};
    mutated[statNames[rr.roll]]+=1;
    allocationRngConsumed.push(rr.roll);
  }

  const calc=name=>Math.trunc(((level-1)*lvupPoint+initNum)*mutated[name]);
  const stats={
    vital:calc('vital'),
    str:calc('str'),
    tgh:calc('tgh'),
    dex:calc('dex')
  };
  const hp=Math.trunc((stats.vital*4+stats.str+stats.tgh+stats.dex)*0.01);
  const rankBaseSum=baseValues.vital+baseValues.str+baseValues.tgh+baseValues.dex;
  const petRank=rankBaseSum>=100?0:rankBaseSum>=95?1:rankBaseSum>=90?2:rankBaseSum>=85?3:rankBaseSum>=80?4:5;

  return {
    ok:true,handled:true,stage:'enemy-stat-materialized',
    format:BROWSER_ENEMY_STAT_RUNTIME_FORMAT,
    enemyId:toInt(enemy.enemyId),
    tempNo:toInt(enemy.tempNo),
    level,
    levelSource:levelRoll==null?'explicit':'fixed-c-RAND',
    rawBaseStats:clone(baseValues),
    mutatedBaseStats:clone(mutated),
    stats,
    maxHp:hp,
    hp,
    maxMp:null,
    mp:null,
    maxMpSource:'CHAR_DEFAULTCHAR(31010)-derived-value-not-yet-closed',
    elements:{
      earth:toInt(base.earth)??0,
      water:toInt(base.water)??0,
      fire:toInt(base.fire)??0,
      wind:toInt(base.wind)??0
    },
    statusResist:{
      poison:toInt(base.poison)??0,
      paralysis:toInt(base.paralysis)??0,
      sleep:toInt(base.sleep)??0,
      stone:toInt(base.stone)??0,
      drunk:toInt(base.drunk)??0,
      confusion:toInt(base.confusion)??0
    },
    ai:{
      modAi:toInt(base.modAi)??0
    },
    petSkills:Array.isArray(base.petSkills)?base.petSkills.map(v=>toInt(v)):[null,null,null,null,null,null,null],
    rare:toInt(base.rare)??0,
    critical:toInt(base.critical)??0,
    counter:toInt(base.counter)??0,
    slot:toInt(base.slot)??0,
    imageNo:toInt(base.imageNo)??null,
    petFlg:toInt(base.petFlg)??0,
    petRank,
    rng:{
      levelRoll:levelRoll==null?null:toInt(levelRoll),
      baseStatRolls:baseRngConsumed,
      allocationRolls:allocationRngConsumed,
      consumedCount:(levelRoll==null?0:1)+4+10
    },
    sourcePolicy:{
      rankUsesRawEnemyBaseStats:true,
      maxHpFormula:'trunc((VITAL*4+STR+TOUGH+DEX)*0.01)',
      growthFormula:'trunc(((level-1)*LVUPPOINT+INITNUM)*mutatedBaseStat)',
      baseVariance:'baseStat += RAND(0,4)-2 for each of four stats',
      allocation:'10 times RAND(0,3), increment selected stat',
      randomChangeAndEquipment:'not applied in this stat-only runtime'
    },
    persistentMutation:false,
    source:{repository:SOURCE_REPOSITORY,ref:SOURCE_REF}
  };
}

export {BROWSER_ENEMY_STAT_RUNTIME_FORMAT,SOURCE_REPOSITORY,SOURCE_REF,computeEnemyStats};
