const BROWSER_ENEMY_CORE_STAT_RUNTIME_FORMAT='stoneage-browser-enemy-core-stat-runtime-v1';
const ACTION_ENEMY_CORE_STAT_MATERIALIZE='ENEMY_CORE_STAT_MATERIALIZE';
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

const RANK_TABLE=Object.freeze([
  {threshold:100,multiplier:2.5,rank:0},
  {threshold:95,multiplier:2.0,rank:1},
  {threshold:90,multiplier:1.5,rank:2},
  {threshold:85,multiplier:1.0,rank:3},
  {threshold:80,multiplier:0.5,rank:4},
  {threshold:0,multiplier:0.0,rank:5}
]);

const clone=value=>JSON.parse(JSON.stringify(value));
const toInt=value=>{const s=String(value??'').trim();if(s==='')return null;const m=s.match(/^[+-]?\d+/);return m?Number(m[0]):null;};
const finite=value=>Number.isFinite(Number(value))?Number(value):null;

function rankFromBase(base){
  const sum=toInt(base?.baseVital)+toInt(base?.baseStr)+toInt(base?.baseTgh)+toInt(base?.baseDex);
  if([base?.baseVital,base?.baseStr,base?.baseTgh,base?.baseDex].some(v=>toInt(v)==null))return {ok:false,reason:'enemy-base-four-stats-required'};
  const row=RANK_TABLE.find(x=>sum>=x.threshold)??RANK_TABLE[RANK_TABLE.length-1];
  return {ok:true,rank:row.rank,paramsum:sum,multiplier:row.multiplier};
}

function validateRolls(template,options={}){
  const levelMin=toInt(template?.levelMin),levelMax=toInt(template?.levelMax);
  if(levelMin==null||levelMax==null||levelMin<0||levelMax<levelMin)return {ok:false,reason:'enemy-level-range-invalid'};
  const levelRoll=toInt(options.levelRoll);
  const levelSpan=levelMax-levelMin+1;
  if(levelRoll==null||levelRoll<0||levelRoll>=levelSpan)return {ok:false,reason:'enemy-level-rng-required-or-out-of-range',levelMin,levelMax,levelRoll,levelSpan};
  const baseStatRolls=Array.isArray(options.baseStatRolls)?options.baseStatRolls.map(toInt):[];
  if(baseStatRolls.length!==4||baseStatRolls.some(r=>r==null||r<0||r>4))return {ok:false,reason:'enemy-base-stat-rng-required-or-out-of-range',baseStatRolls};
  const allocationRolls=Array.isArray(options.allocationRolls)?options.allocationRolls.map(toInt):[];
  if(allocationRolls.length!==10||allocationRolls.some(r=>r==null||r<0||r>3))return {ok:false,reason:'enemy-allocation-rng-required-or-out-of-range',allocationRolls};
  return {ok:true,levelMin,levelMax,levelRoll,levelSpan,baseStatRolls,allocationRolls};
}

function materializeEnemyCoreStats(template,{levelRoll=null,baseStatRolls=[],allocationRolls=[]}={}){
  const base=template?.base;
  if(!base)return {ok:false,handled:false,stage:'enemy-core-stat',reason:'enemy-base-template-required'};
  const enemyId=toInt(template?.enemyId);
  const tempNo=toInt(template?.tempNo??base?.tempNo);
  if(enemyId==null||tempNo==null)return {ok:false,handled:false,stage:'enemy-core-stat',reason:'enemy-id-and-temp-no-required'};
  const rolls=validateRolls(template,{levelRoll,baseStatRolls,allocationRolls});
  if(!rolls.ok)return {ok:false,handled:false,stage:'enemy-core-stat',...rolls};
  const rank=rankFromBase(base);
  if(!rank.ok)return {ok:false,handled:false,stage:'enemy-core-stat',...rank};
  const level=rolls.levelMin+rolls.levelRoll;
  const baseBefore={
    vital:toInt(base.baseVital),str:toInt(base.baseStr),tgh:toInt(base.baseTgh),dex:toInt(base.baseDex)
  };
  const randomized={
    vital:baseBefore.vital+rolls.baseStatRolls[0]-2,
    str:baseBefore.str+rolls.baseStatRolls[1]-2,
    tgh:baseBefore.tgh+rolls.baseStatRolls[2]-2,
    dex:baseBefore.dex+rolls.baseStatRolls[3]-2
  };
  const allocated={...randomized};
  for(const roll of rolls.allocationRolls){
    if(roll===0)allocated.vital++;
    else if(roll===1)allocated.str++;
    else if(roll===2)allocated.tgh++;
    else if(roll===3)allocated.dex++;
  }
  const factor=(level-1)*finite(base.lvupPoint)+toInt(base.initNum);
  if(!Number.isFinite(factor))return {ok:false,handled:false,stage:'enemy-core-stat',reason:'enemy-level-growth-factor-invalid'};
  const stats={
    vital:Math.trunc(factor*allocated.vital),
    str:Math.trunc(factor*allocated.str),
    tgh:Math.trunc(factor*allocated.tgh),
    dex:Math.trunc(factor*allocated.dex)
  };
  const fixDex=Math.trunc(stats.dex*0.01);
  const fixVital=Math.trunc(stats.vital*0.01);
  const fixStr=Math.trunc(stats.str*0.01+stats.tgh*0.01*0.1+stats.vital*0.01*0.1+stats.dex*0.01*0.05);
  const fixTgh=Math.trunc(stats.tgh*0.01+stats.str*0.01*0.1+stats.vital*0.01*0.1+stats.dex*0.01*0.05);
  const maxHp=Math.trunc((stats.vital*4+stats.str+stats.tgh+stats.dex)*0.01);
  return {
    ok:true,handled:true,stage:'enemy-core-stat-materialized',
    format:BROWSER_ENEMY_CORE_STAT_RUNTIME_FORMAT,
    action:ACTION_ENEMY_CORE_STAT_MATERIALIZE,
    enemyId,tempNo,level,
    rngConsumedCount:15,
    rng:{
      levelRoll:rolls.levelRoll,
      baseStatRolls:rolls.baseStatRolls.slice(),
      allocationRolls:rolls.allocationRolls.slice()
    },
    rank:rank.rank,
    rankParamSum:rank.paramsum,
    baseBefore,
    baseAfterRandomized:randomized,
    baseAfterAllocation:allocated,
    levelGrowthFactor:factor,
    stats,
    derived:{
      fixVital,
      fixStr,
      fixTgh,
      fixDex,
      attackPower:fixStr,
      defencePower:fixTgh,
      quick:fixDex,
      maxHp,
      hp:maxHp,
      maxMp:null,
      mp:null
    },
    sourceTemplate:{
      initNum:toInt(base.initNum),
      lvupPoint:finite(base.lvupPoint),
      element:{earth:toInt(base.earth),water:toInt(base.water),fire:toInt(base.fire),wind:toInt(base.wind)},
      resist:{poison:toInt(base.poison),paralysis:toInt(base.paralysis),sleep:toInt(base.sleep),stone:toInt(base.stone),drunk:toInt(base.drunk),confusion:toInt(base.confusion)},
      rare:toInt(base.rare),
      get:toInt(base.get),
      critical:toInt(base.critical),
      counter:toInt(base.counter),
      slot:toInt(base.slot),
      imageNo:toInt(base.imageNo),
      petFlg:toInt(base.petFlg),
      petSkills:Array.isArray(base.petSkills)?base.petSkills.map(toInt):[]
    },
    postCompliance:{
      maxMp:'pending CHAR_getDefaultChar/CHAR_MAXMP source join',
      itemEquipEffects:'not applied',
      Other_DefcharWorkInt:'only base maxHP derivation represented; suit/feature branches omitted',
      enemyRandomChange:'not applied'
    },
    persistentMutation:false,
    battleStarted:false,
    source:{repository:SOURCE_REPOSITORY,ref:SOURCE_REF}
  };
}

function createBrowserEnemyCoreStatRuntime(){
  return {
    ok:true,
    format:BROWSER_ENEMY_CORE_STAT_RUNTIME_FORMAT,
    materialize:(template,options={})=>materializeEnemyCoreStats(template,options)
  };
}

export {
  BROWSER_ENEMY_CORE_STAT_RUNTIME_FORMAT,
  ACTION_ENEMY_CORE_STAT_MATERIALIZE,
  RANK_TABLE,
  rankFromBase,
  validateRolls,
  materializeEnemyCoreStats,
  createBrowserEnemyCoreStatRuntime
};
