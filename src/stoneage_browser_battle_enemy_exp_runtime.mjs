const BROWSER_BATTLE_ENEMY_EXP_RUNTIME_FORMAT='stoneage-v456-browser-battle-enemy-exp-credit-v1';
const ACTION_BATTLE_ENEMY_EXP_CREDIT='BATTLE_ENEMY_EXP_CREDIT';
const EXPGET_MAXLEVEL=5;
const EXPGET_DIV=15;
const EXP_TABLE=[1,2,3,4,5,6,9,12,15,18,22,26,30,35,40,46,52,58,65,72,79,87,95,104,113,122,131,141,151,162,173,184,196,208,220,233,246,260,274,288,303,318,333,348,365,381,398,415,432,450,468,486,506,525,545,564,585,606,627,648,670,692,714,737,760,784,808,832,857,882,907,933,959,956,1012,1040,1067,1095,1123,1152,1181,1210,1240,1270,1300,1331,1362,1394,1426,1458,1490,1524,1557,1590,1625,1659,1694,1729,1764,1800,1836,1872,1909,1946,1983,2021,2059,2097,2136,2175,2214,2254,2294,2334,2374,2414,2455,2496,2537,2578,2619,2661,2703,2745,2787,2829,2872,2915,2958,3000,3043,3088,3132,3176,3220,3264,3309,3354,3399,3444,3489,3535,3581,3627,3673,3719,3765,3812,3859,3906,3953,4000,4047,4095,4143,4191,4239,4287,4335,4384,4433,4482,4531,4580,4629,4679,4729,4779,4829,4879,4929,4980,5031,5082,5133,5184,5235,5287,5339,5391,5443,5495,5547,5599,5652,5705,5758,5811,5864,5917,5970,6024,6078,6132,6186,6240,6295,6350,6405,6460];

const clone=value=>JSON.parse(JSON.stringify(value));
const int=value=>{if(value==null||String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)?Math.trunc(n):null;};
const num=value=>{if(value==null||String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)?n:null;};

function findEntry(context,bid){
  const b=int(bid);if(b==null||b<0||b>19)return null;
  const side=b>=10?1:0,slot=b>=10?b-10:b;
  const s=context?.context?.sides?.find(x=>Number(x?.side)===side);
  return Array.isArray(s?.entries)?s.entries[slot]??null:null;
}

function rankBonus(rank){
  const r=int(rank);
  const tbl=[2.5,2.0,1.5,1.0,0.5,0.0];
  return tbl[r==null||r<0||r>5?5:r];
}

function resolveEnemyExp(enemy){
  const direct=int(enemy?.sourceEnemyExp);
  if(direct!=null&&direct!==-1)return {ok:true,exp:Math.max(1,direct),method:'direct-enemy-exp'};
  const level=int(enemy?.level??enemy?.sourceCoreStats?.level);
  if(level==null||level<1||level>EXP_TABLE.length)return {ok:false,reason:'enemy-level-required-for-exp-fallback',level};
  const template=enemy?.sourceCoreStats?.sourceTemplate??{};
  const alphaRaw=(num(template.critical)??0)+(num(template.counter)??0)+(num(template.get)??0)
    +(num(template.resist?.poison)??0)+(num(template.resist?.paralysis)??0)
    +(num(template.resist?.sleep)??0)+(num(template.resist?.stone)??0)
    +(num(template.resist?.drunk)??0)+(num(template.resist?.confusion)??0);
  const alpha=alphaRaw/100+(num(template.rare)??0);
  const base=EXP_TABLE[level-1]??null;
  if(base==null)return {ok:false,reason:'enemy-exp-base-table-missing',level};
  const rank=int(enemy?.rank??enemy?.sourceCoreStats?.rank)??5;
  const exp=Math.max(1,Math.trunc(base+(rankBonus(rank)+alpha)*level));
  return {ok:true,exp,method:'ENEMY_getExp',level,rank,rankBonus:rankBonus(rank),alpha,baseExp:base};
}

function resolveParticipantExp(actor,enemyExp){
  const actorLevel=int(actor?.level)??1;
  const delta=actorLevel-(int(actor?.enemyLevel)??0);
  let nowexp=enemyExp;
  if(delta>EXPGET_MAXLEVEL){
    const bLevel=EXPGET_MAXLEVEL+EXPGET_DIV-delta;
    if(bLevel<=0)nowexp=1;
    else nowexp=Math.max(1,Math.trunc(enemyExp*bLevel/EXPGET_DIV));
  }
  return {nowexp,actorLevel,enemyLevel:int(actor?.enemyLevel)??null,levelDelta:delta};
}

function creditEnemyExp(context,{enemyBid=null,participantBids=[],enemyExpOverride=null,source='attack',hitIndex=null,transactionPrefix='enemy-exp',now=null}={}){
  if(!context?.context)return {ok:false,handled:false,stage:'battle-enemy-exp',action:ACTION_BATTLE_ENEMY_EXP_CREDIT,reason:'battle-context-required'};
  const eBid=int(enemyBid),enemy=findEntry(context,eBid);
  if(eBid==null||eBid<10||!enemy)return {ok:false,handled:false,stage:'battle-enemy-exp',action:ACTION_BATTLE_ENEMY_EXP_CREDIT,reason:'enemy-entry-required'};
  if(enemy.sourceExpCreditProcessed===true)return {ok:true,handled:true,stage:'battle-enemy-exp-idempotent',format:BROWSER_BATTLE_ENEMY_EXP_RUNTIME_FORMAT,action:ACTION_BATTLE_ENEMY_EXP_CREDIT,enemyBid:eBid,idempotent:true,rngConsumed:0,newCredits:[],context:clone(context.context),persistentMutation:false};
  if(enemy.isDie!==true&&enemy.dead!==true&&!(int(enemy.hp)!=null&&int(enemy.hp)<=0))return {ok:true,handled:true,stage:'battle-enemy-exp-not-dead',format:BROWSER_BATTLE_ENEMY_EXP_RUNTIME_FORMAT,action:ACTION_BATTLE_ENEMY_EXP_CREDIT,enemyBid:eBid,idempotent:false,newCredits:[],rngConsumed:0,context:clone(context.context),persistentMutation:false};

  const resolved=enemyExpOverride!=null?{ok:true,exp:Math.max(1,int(enemyExpOverride)??1),method:'explicit-source-exp'}:resolveEnemyExp(enemy);
  if(!resolved.ok)return {...resolved,handled:false,stage:'battle-enemy-exp',action:ACTION_BATTLE_ENEMY_EXP_CREDIT,enemyBid:eBid};

  const bids=[];
  const seen=new Set();
  for(const raw of Array.isArray(participantBids)?participantBids:[]){
    const bid=int(raw);
    if(bid==null||bid<0||bid>=10||seen.has(bid))continue;
    seen.add(bid);bids.push(bid);
  }
  const next=clone(context),credits=[];
  for(const bid of bids){
    const actor=findEntry(next,bid);
    if(!actor)continue;
    const calc=resolveParticipantExp({...actor,enemyLevel:enemy.level},resolved.exp);
    const beforeWork=int(actor.workGetExp)??0;
    const beforeKills=int(actor.killPetCount)??0;
    actor.workGetExp=beforeWork+calc.nowexp;
    actor.killPetCount=beforeKills+1;
    credits.push({enemyBid:eBid,actorBid:bid,exp:calc.nowexp,workGetExpBefore:beforeWork,workGetExpAfter:actor.workGetExp,killPetCountBefore:beforeKills,killPetCountAfter:actor.killPetCount,levelDelta:calc.levelDelta});
  }
  const enemyNext=findEntry(next,eBid);
  enemyNext.sourceExpCreditProcessed=true;
  enemyNext.sourceExpCreditParticipants=bids.slice();
  enemyNext.sourceEnemyExpResolved=resolved.exp;
  const events=Array.isArray(next.context.sourceEnemyExpCreditEvents)?next.context.sourceEnemyExpCreditEvents.slice():[];
  events.push(...credits.map(x=>({...x,hitIndex:int(hitIndex),source:String(source??'attack').trim()||'attack'})));
  next.context.sourceEnemyExpCreditEvents=events;
  return {
    ok:true,handled:true,stage:'battle-enemy-exp-credited',format:BROWSER_BATTLE_ENEMY_EXP_RUNTIME_FORMAT,
    action:ACTION_BATTLE_ENEMY_EXP_CREDIT,enemyBid:eBid,participantBids:bids,enemyExp:resolved.exp,
    enemyExpResolution:resolved,newCredits:credits,totalCreditEvents:events.length,
    source:{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66ca1',
      functions:['BATTLE_AddExpItem','ENEMY_getExp'],boundary:'workGetExp + KILLPETCOUNT after carried getitem queue'},
    persistentMutation:false,expSettlementDeferred:true,levelUpDeferred:true,ridePetExpDeferred:true,
    context:next.context,transactionPrefix:String(transactionPrefix??'enemy-exp'),now:now??null
  };
}

function createBrowserBattleEnemyExpRuntime(){return {ok:true,format:BROWSER_BATTLE_ENEMY_EXP_RUNTIME_FORMAT,credit:(context,options={})=>creditEnemyExp(context,options)};}

export {BROWSER_BATTLE_ENEMY_EXP_RUNTIME_FORMAT,ACTION_BATTLE_ENEMY_EXP_CREDIT,EXPGET_MAXLEVEL,EXPGET_DIV,EXP_TABLE,rankBonus,resolveEnemyExp,resolveParticipantExp,creditEnemyExp,createBrowserBattleEnemyExpRuntime};
