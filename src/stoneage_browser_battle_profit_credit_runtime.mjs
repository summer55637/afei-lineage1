const BROWSER_BATTLE_PROFIT_CREDIT_RUNTIME_FORMAT='stoneage-v454-browser-battle-profit-credit-v1';
const ACTION_BATTLE_PROFIT_CREDIT_APPLY='BATTLE_PROFIT_CREDIT_APPLY';
const SIDE_OFFSET=10;

const clone=value=>JSON.parse(JSON.stringify(value));
const toInt=value=>{
  if(value==null||String(value).trim()==='')return null;
  const n=Number(value);
  return Number.isFinite(n)&&Number.isInteger(n)?n:null;
};

function allEnemyEntries(context){
  const side=context?.context?.sides?.find(x=>Number(x?.side)===1);
  const entries=Array.isArray(side?.entries)?side.entries:[];
  return entries.map((entry,slot)=>({entry,bid:slot+SIDE_OFFSET,slot})).filter(x=>x.entry);
}

function isEnemyDead(entry,{allowCommittedDeath=false}={}){
  const hp=toInt(entry?.hp);
  if(hp==null||hp>0)return false;
  if(entry?.sourceRewardProcessed===true)return false;
  if(allowCommittedDeath===true)return true;
  return entry?.isDie!==true&&entry?.dead!==true;
}

function normalizeCreditBids(bids){
  const out=[];
  const seen=new Set();
  for(const raw of Array.isArray(bids)?bids:[]){
    const bid=toInt(raw);
    if(bid==null||bid<0||bid>19||seen.has(bid))continue;
    seen.add(bid);
    out.push(bid);
  }
  return out;
}

function applyBattleProfitCredit(context,{
  attackerBids=[],
  allowPlayerCredit=true,
  allowCommittedDeath=false,
  hitIndex=null,
  source='attack',
  transactionPrefix='profit',
  now=null
}={}){
  if(!context?.context){
    return {ok:false,handled:false,stage:'battle-profit-credit',action:ACTION_BATTLE_PROFIT_CREDIT_APPLY,reason:'battle-context-required'};
  }

  const bids=normalizeCreditBids(attackerBids);
  const playerBids=bids.filter(bid=>bid<SIDE_OFFSET);
  const creditEnabled=allowPlayerCredit===true&&playerBids.length>0;
  const next=clone(context);
  const events=Array.isArray(next.context.sourceProfitCreditEvents)
    ? next.context.sourceProfitCreditEvents.slice()
    : [];
  const newCredits=[];

  for(const row of allEnemyEntries(next)){
    const enemy=row.entry;
    if(!isEnemyDead(enemy,{allowCommittedDeath:allowCommittedDeath===true}))continue;
    if(enemy.sourceRewardProcessed===true)continue;

    enemy.sourceRewardProcessed=true;
    enemy.sourceRewardCredits=creditEnabled?playerBids.slice():[];
    enemy.sourceRewardPlayerSide=creditEnabled;
    enemy.sourceRewardCreditSource=creditEnabled
      ? 'player-side-BATTLE_AddProfit'
      : 'non-player-side-BATTLE_AddProfit';

    const event={
      hitIndex:toInt(hitIndex),
      enemyBid:row.bid,
      creditBids:creditEnabled?playerBids.slice():[],
      credited:creditEnabled,
      source:String(source??'attack').trim()||'attack',
      rewardNumbersDeferred:true
    };
    events.push(event);
    newCredits.push(event);
  }

  next.context.sourceProfitCreditEvents=events;

  return {
    ok:true,
    handled:true,
    stage:'battle-profit-credit-applied',
    format:BROWSER_BATTLE_PROFIT_CREDIT_RUNTIME_FORMAT,
    action:ACTION_BATTLE_PROFIT_CREDIT_APPLY,
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66ca1',
      function:'BATTLE_AddProfit',
      boundary:'BATTLE_AddExpItem first-death credit'
    },
    attackerBids:bids,
    playerCreditBids:playerBids,
    creditEnabled,
    hitIndex:toInt(hitIndex),
    sourceType:String(source??'attack').trim()||'attack',
    newCredits,
    totalCreditEvents:events.length,
    rewardNumbersDeferred:true,
    carriedLootRngDeferred:true,
    committedDeathAdapter:allowCommittedDeath===true,
    expMutation:false,
    goldMutation:false,
    persistentMutation:false,
    context:next.context,
    transactionPrefix:String(transactionPrefix??'profit'),
    now:now??null
  };
}

function createBrowserBattleProfitCreditRuntime(){
  return {
    ok:true,
    format:BROWSER_BATTLE_PROFIT_CREDIT_RUNTIME_FORMAT,
    apply:(context,options={})=>applyBattleProfitCredit(context,options)
  };
}

export {
  BROWSER_BATTLE_PROFIT_CREDIT_RUNTIME_FORMAT,
  ACTION_BATTLE_PROFIT_CREDIT_APPLY,
  applyBattleProfitCredit,
  createBrowserBattleProfitCreditRuntime
};
