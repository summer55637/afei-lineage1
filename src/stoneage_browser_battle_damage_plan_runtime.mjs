const BROWSER_BATTLE_DAMAGE_PLAN_RUNTIME_FORMAT='stoneage-v402-browser-battle-damage-plan-v1';
const ACTION_BATTLE_DAMAGE_PLAN='BATTLE_DAMAGE_PLAN';

const D_16=1/16;
const D_8=1/8;
const DAMAGE_RATE=2.0;
const DEFENCE_RATE=0.70;
const DEF_QUICK_RATE=0.20;
const DEF_VITAL_RATE=0.10;
const AJ_SAME=1.0;
const AJ_UP=1.5;
const AJ_DOWN=0.6;
const ATTR_MAX=100;
const D_ATTR=1/(ATTR_MAX*ATTR_MAX);

const clone=value=>JSON.parse(JSON.stringify(value));
const int=value=>{const n=Number(value);return Number.isFinite(n)?Math.trunc(n):null;};
const num=value=>{const n=Number(value);return Number.isFinite(n)?n:null;};

function findEntry(context,bid){
  const b=int(bid);
  if(b==null||b<0||b>19)return null;
  const side=b>=10?1:0;
  const slot=b>=10?b-10:b;
  const s=context?.context?.sides?.find(x=>Number(x?.side)===side);
  return Array.isArray(s?.entries)?s.entries[slot]??null:null;
}

function attrsOf(entry){
  const e=entry?.elements;
  if(!e||typeof e!=='object')return {ok:false,reason:'battle-elements-required'};
  const fire=Math.max(0,int(e.fire)??0);
  const water=Math.max(0,int(e.water)??0);
  const earth=Math.max(0,int(e.earth)??0);
  const wind=Math.max(0,int(e.wind)??0);
  const none=Math.max(0,ATTR_MAX-fire-water-earth-wind);
  return {ok:true,pow:[earth,water,fire,wind,none]};
}

function attrCalc(myFire,myWater,myEarth,myWind,myNone,vsFire,vsWater,vsEarth,vsWind,vsNone){
  myFire=myFire*vsNone*AJ_UP+myFire*vsFire*AJ_SAME+myFire*vsWater*AJ_DOWN+myFire*vsEarth*AJ_SAME+myFire*vsWind*AJ_UP;
  myWater=myWater*vsNone*AJ_UP+myWater*vsFire*AJ_UP+myWater*vsWater*AJ_SAME+myWater*vsEarth*AJ_DOWN+myWater*vsWind*AJ_SAME;
  myEarth=myEarth*vsNone*AJ_UP+myEarth*vsFire*AJ_SAME+myEarth*vsWater*AJ_UP+myEarth*vsEarth*AJ_SAME+myEarth*vsWind*AJ_DOWN;
  myWind=myWind*vsNone*AJ_UP+myWind*vsFire*AJ_DOWN+myWind*vsWater*AJ_SAME+myWind*vsEarth*AJ_UP+myWind*vsWind*AJ_SAME;
  myNone=myNone*vsNone*AJ_SAME+myNone*vsFire*AJ_DOWN+myNone*vsWater*AJ_DOWN+myNone*vsEarth*AJ_DOWN+myNone*vsWind*AJ_DOWN;
  return Math.trunc((myFire+myWater+myEarth+myWind+myNone)*D_ATTR);
}

function fieldPower(fieldAtt,fieldAttrPower,attackerAttrs){
  const att=int(fieldAtt);
  const a=num(fieldAttrPower)??0;
  if(att==null||att<0||att>3)return 0.5;
  const key=[2,1,0,3][att];
  return 0.5+(attackerAttrs[key]??0)*a*0.01*0.01*0.5;
}

function damagePlan(context,{attackerBid=null,targetBid=null,damageRollNear=null,damageRollWide=null,fieldAtt=4,fieldAttrPower=0,includeAttr=true}={}){
  const attacker=findEntry(context,attackerBid);
  const defender=findEntry(context,targetBid);
  if(!attacker||!defender)return {ok:false,handled:false,stage:'battle-damage-plan',reason:'attacker-or-defender-missing'};
  const attack=num(attacker.attackPower??attacker.fixStr);
  const defencePower=num(defender.defencePower??defender.fixTgh);
  const quick=num(defender.quick??defender.fixDex);
  const fixVital=num(defender.fixVital??defender.fixVitial);
  if(attack==null||defencePower==null||quick==null)return {ok:false,handled:false,stage:'battle-damage-plan',reason:'attack-defence-quick-required'};
  const vital=fixVital==null?0:fixVital;
  let defence=defencePower*DEFENCE_RATE+quick*DEF_QUICK_RATE+vital*DEF_VITAL_RATE;
  let branch,rawDamage,rollUsed=null,rollRange=null,k0=null;
  if(defence<=attack && attack<defence*8/7){
    branch='near';
    const max=attack*D_16;
    const r=num(damageRollNear);
    if(r==null||r<0||r>max)return {ok:false,handled:false,stage:'battle-damage-plan',reason:'near-damage-rng-required-or-out-of-range',max,damageRollNear:r};
    rawDamage=Math.trunc(r);rollUsed=r;rollRange=[0,max];
  }else if(defence>attack){
    branch='defence-greater';
    const r=int(damageRollNear);
    if(r==null||r<0||r>1)return {ok:false,handled:false,stage:'battle-damage-plan',reason:'low-damage-rng-required-or-out-of-range',damageRollNear:r};
    rawDamage=r;rollUsed=r;rollRange=[0,1];
  }else{
    branch='power';
    const max=attack*D_8;
    const r=num(damageRollWide);
    if(r==null||r<0||r>max)return {ok:false,handled:false,stage:'battle-damage-plan',reason:'wide-damage-rng-required-or-out-of-range',max,damageRollWide:r};
    k0=r-attack*D_16;
    rawDamage=Math.trunc((attack-defence)*DAMAGE_RATE+k0);
    rollUsed=r;rollRange=[0,max];
  }

  let adjusted=rawDamage;
  let attributeApplied=false;
  let attackerAttr=null,defenderAttr=null;
  let attackerFieldPower=0.5,defenderFieldPower=0.5;
  if(includeAttr===true){
    const aa=attrsOf(attacker),dd=attrsOf(defender);
    if(!aa.ok||!dd.ok)return {ok:false,handled:false,stage:'battle-damage-plan',reason:'battle-elements-required'};
    attackerAttr=aa.pow;defenderAttr=dd.pow;
    adjusted=attrCalc(
      attackerAttr[2]*adjusted,
      attackerAttr[1]*adjusted,
      attackerAttr[0]*adjusted,
      attackerAttr[3]*adjusted,
      attackerAttr[4]*adjusted,
      defenderAttr[2],defenderAttr[1],defenderAttr[0],defenderAttr[3],defenderAttr[4]
    );
    attackerFieldPower=fieldPower(fieldAtt,fieldAttrPower,attackerAttr);
    defenderFieldPower=fieldPower(fieldAtt,fieldAttrPower,defenderAttr);
    adjusted=Math.trunc(adjusted*(attackerFieldPower/defenderFieldPower));
    attributeApplied=true;
  }

  return {
    ok:true,handled:true,stage:'battle-damage-plan-ready',
    format:BROWSER_BATTLE_DAMAGE_PLAN_RUNTIME_FORMAT,
    action:ACTION_BATTLE_DAMAGE_PLAN,
    attackerBid:int(attackerBid),
    targetBid:int(targetBid),
    attack,
    defence,
    defencePower,
    quick,
    fixVital:vital,
    branch,
    rawDamage,
    damage:adjusted,
    damageBeforeAttribute:rawDamage,
    rollUsed,
    rollRange,
    k0,
    attributeApplied,
    attackerAttributes:attackerAttr,
    defenderAttributes:defenderAttr,
    field:{fieldAtt:int(fieldAtt)??null,attPower:num(fieldAttrPower)??0,attackerPower:attackerFieldPower,defenderPower:defenderFieldPower},
    constants:{D_16,D_8,DAMAGE_RATE,DEFENCE_RATE,DEF_QUICK_RATE,DEF_VITAL_RATE,AJ_SAME,AJ_UP,AJ_DOWN,ATTR_MAX,D_ATTR},
    fixedCFeatureFlags:{_BATTLE_NEWPOWER:true},
    persistentMutation:false,
    hpMutation:false,
    rngConsumed:rollUsed==null?0:1,
    damageExecuted:false,
    source:{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',function:'BATTLE_DamageCalc'}
  };
}

function createBrowserBattleDamagePlanRuntime(){
  return {ok:true,format:BROWSER_BATTLE_DAMAGE_PLAN_RUNTIME_FORMAT,plan:(context,options={})=>damagePlan(context,options)};
}

export {
  BROWSER_BATTLE_DAMAGE_PLAN_RUNTIME_FORMAT,
  ACTION_BATTLE_DAMAGE_PLAN,
  damagePlan,
  attrCalc,
  createBrowserBattleDamagePlanRuntime
};
