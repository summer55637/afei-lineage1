const BROWSER_BATTLE_COMPLIANCE_PLAN_RUNTIME_FORMAT='stoneage-v419-browser-battle-compliance-plan-v1';
const ACTION_BATTLE_COMPLIANCE_PLAN='BATTLE_COMPLIANCE_PLAN';
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const PLAYER_STAT_KEYS=['vital','str','tgh','dex'];
const PET_STAT_KEYS=['vital','str','tgh','dex'];

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const num=value=>Number.isFinite(Number(value))?Number(value):null;
const integer=value=>Number.isFinite(Number(value))?Math.trunc(Number(value)):null;
const clone=value=>JSON.parse(JSON.stringify(value));

function readStats(source,keys){
  if(!isObject(source))return null;
  const out={};
  for(const key of keys){
    const value=num(source[key]);
    if(value==null)return null;
    out[key]=value;
  }
  return out;
}

function derivePlayerCompliance(stats){
  const s=readStats(stats,PLAYER_STAT_KEYS);
  if(!s)return {ok:false,reason:'player-stats-required'};
  const fixStr=s.str+s.tgh*0.1+s.vital*0.1+s.dex*0.05;
  const fixTough=s.tgh+s.str*0.1+s.vital*0.1+s.dex*0.05;
  const fixDex=s.dex;
  const maxHp=Math.trunc(s.vital*4+s.str+s.tgh+s.dex);
  return {
    ok:true,
    stats:s,
    derived:{
      fixVital:null,
      fixStr,
      fixTough,
      fixDex,
      attackPower:fixStr,
      defencePower:fixTough,
      quick:fixDex,
      maxHp,
      maxMp:null,
      hp:null,
      mp:null
    },
    rounding:{
      fixStr:'not truncated in player point-unit runtime; fixed-C stores int when written to WORK',
      fixTough:'not truncated in player point-unit runtime; fixed-C stores int when written to WORK',
      fixDex:'exact',
      maxHp:'C int truncation'
    }
  };
}

function derivePetCompliance(stats){
  const s=readStats(stats,PET_STAT_KEYS);
  if(!s)return {ok:false,reason:'pet-stats-required'};
  const fixVital=Math.trunc(s.vital*0.01);
  const fixStr=Math.trunc(s.str*0.01+s.tgh*0.01*0.1+s.vital*0.01*0.1+s.dex*0.01*0.05);
  const fixTough=Math.trunc(s.tgh*0.01+s.str*0.01*0.1+s.vital*0.01*0.1+s.dex*0.01*0.05);
  const fixDex=Math.trunc(s.dex*0.01);
  const maxHp=Math.trunc((s.vital*4+s.str+s.tgh+s.dex)*0.01);
  return {
    ok:true,
    stats:s,
    derived:{
      fixVital,
      fixStr,
      fixTough,
      fixDex,
      attackPower:fixStr,
      defencePower:fixTough,
      quick:fixDex,
      maxHp,
      maxMp:null,
      hp:null,
      mp:null
    },
    rounding:{
      fixVital:'C int truncation',
      fixStr:'C int truncation',
      fixTough:'C int truncation',
      fixDex:'C int truncation',
      maxHp:'C int truncation'
    }
  };
}

function planBattleCompliance(state,{petIds=null,includePlayer=true}={}){
  if(!isObject(state)||!isObject(state.player))return {ok:false,handled:false,stage:'battle-compliance-plan',reason:'persistent-state-required',state:clone(state)};
  const plans=[];
  const warnings=[];
  if(includePlayer){
    const player=derivePlayerCompliance(state.player.stats);
    if(!player.ok)return {ok:false,handled:false,stage:'battle-compliance-plan',reason:'player-compliance-source-required',state:clone(state)};
    plans.push({
      kind:'player',
      characterId:String(state.player.id??'').trim()||null,
      level:integer(state.player.level),
      statsBefore:player.stats,
      derived:player.derived
    });
    warnings.push('player equipment / Other_DefcharWorkInt special branches remain outside this base compliance plan');
  }

  const wanted=Array.isArray(petIds)
    ? new Set(petIds.map(id=>String(id??'').trim()).filter(Boolean))
    : null;
  const petBox=Array.isArray(state.pets?.petBox)?state.pets.petBox:[];
  for(const pet of petBox){
    const petId=String(pet?.id??'').trim();
    if(wanted && !wanted.has(petId))continue;
    const stats=pet?.stats??pet?.serverStats;
    const calc=derivePetCompliance(stats);
    if(!calc.ok){
      return {ok:false,handled:false,stage:'battle-compliance-plan',reason:'pet-compliance-source-required',petId,state:clone(state)};
    }
    plans.push({
      kind:'pet',
      petId,
      level:integer(pet.level),
      statsBefore:calc.stats,
      derived:calc.derived,
      sourceProgression:pet.serverProgression===true,
      complianceDeferredMaxMp:true
    });
  }

  return {
    ok:true,
    handled:true,
    stage:'battle-compliance-plan-ready',
    format:BROWSER_BATTLE_COMPLIANCE_PLAN_RUNTIME_FORMAT,
    action:ACTION_BATTLE_COMPLIANCE_PLAN,
    source:{
      repository:SOURCE_REPOSITORY,
      ref:SOURCE_REF,
      playerFormula:'FIXSTR=STR+TOUGH*0.1+VITAL*0.1+DEX*0.05; FIXTOUGH=TOUGH+STR*0.1+VITAL*0.1+DEX*0.05; FIXDEX=DEX; MaxHP=VITAL*4+STR+TOUGH+DEX',
      petFormula:'FIXSTR=trunc(STR*0.01+TOUGH*0.001+VITAL*0.001+DEX*0.0005); FIXTOUGH=trunc(TOUGH*0.01+STR*0.001+VITAL*0.001+DEX*0.0005); FIXDEX=trunc(DEX*0.01); MaxHP=trunc((VITAL*4+STR+TOUGH+DEX)*0.01)',
      function:'CHAR_complianceParameter',
      supporting:'CHAR_initcharWorkInt / Other_DefcharWorkInt'
    },
    characters:plans,
    deferred:[
      'CHAR_MAXMP / CHAR_getDefaultChar source join for final MaxMP',
      'HP/MP mutation or clamp policy after compliance',
      'equipment / suit / profession / feature branches in Other_DefcharWorkInt',
      'network/status side effects such as status packet sends'
    ],
    warnings,
    persistentStateMutation:false,
    battleContextMutation:false,
    uiMutation:false,
    dbMutation:false,
    rngPreserved:true,
    nextBoundary:'BATTLE_COMPLIANCE_COMMIT'
  };
}

function createBrowserBattleCompliancePlanRuntime(){
  return {ok:true,format:BROWSER_BATTLE_COMPLIANCE_PLAN_RUNTIME_FORMAT,plan:planBattleCompliance};
}

export {
  BROWSER_BATTLE_COMPLIANCE_PLAN_RUNTIME_FORMAT,
  ACTION_BATTLE_COMPLIANCE_PLAN,
  derivePlayerCompliance,
  derivePetCompliance,
  planBattleCompliance,
  createBrowserBattleCompliancePlanRuntime
};
