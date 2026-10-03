import { BROWSER_BATTLE_DAMAGE_REACT_RUNTIME_FORMAT, ACTION_BATTLE_DAMAGE_REACT_PLAN, BATTLE_MD_ABSROB, BATTLE_MD_REFLEC, BATTLE_MD_VANISH, BATTLE_MD_TRAP, BATTLE_MD_ACUPUNCTURE, BATTLE_MD_NONE } from './stoneage_browser_battle_damage_react_runtime.mjs';
import { deathPlan as planBattleDeath } from './stoneage_browser_battle_death_runtime.mjs';
import { commitDeathState } from './stoneage_browser_battle_death_commit_runtime.mjs';

const BROWSER_BATTLE_DAMAGE_REACT_COMMIT_RUNTIME_FORMAT='stoneage-v448-browser-battle-damage-react-commit-v1';
const ACTION_BATTLE_DAMAGE_REACT_COMMIT='BATTLE_DAMAGE_REACT_COMMIT';
const BATTLE_MODE_BATTLE=2;
const clone=value=>JSON.parse(JSON.stringify(value));
const int=value=>{if(value==null||String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)?Math.trunc(n):null;};
const num=value=>{if(value==null||String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)?n:null;};

function findEntry(context,bid){
  const b=int(bid);
  if(b==null||b<0||b>19)return null;
  const side=b>=10?1:0,slot=b>=10?b-10:b;
  const s=context?.context?.sides?.find(x=>Number(x?.side)===side);
  return Array.isArray(s?.entries)?s.entries[slot]??null:null;
}
function planIdentity(plan){
  return JSON.stringify({
    format:plan.format,action:plan.action,damageCommitRevision:plan.damageCommitRevision,
    attackerBid:plan.attackerBid,targetBid:plan.targetBid,requestedDamage:plan.requestedDamage,
    reactionCode:plan.reaction?.code,redirected:plan.redirected,
    attackerRidePet:plan.attackerRidePet,defenderRidePet:plan.defenderRidePet,
    defenderDamage:plan.defenderDamage,defenderPetDamage:plan.defenderPetDamage,
    attackerDamage:plan.attackerDamage,attackerPetDamage:plan.attackerPetDamage,
    defenderHeal:plan.defenderHeal,defenderPetHeal:plan.defenderPetHeal,stateConsumption:plan.stateConsumption
  });
}
function applyDamage(entry,damage,{critical=false,criticalFlag=null,battleFlags=0,deathRoll=null,lerImmune=false}={}){
  const hp=int(entry?.hp),maxHp=int(entry?.maxHp);
  const d=int(damage);
  if(hp==null||maxHp==null||hp<0||maxHp<=0||d==null||d<0)return {ok:false,reason:'special-damage-hp-invalid'};
  const raw=hp-d,after=Math.min(Math.max(raw,0),maxHp),overkill=Math.max(0,-raw);
  const threshold=maxHp*1.2+20;
  let workUltimate=int(entry.workUltimate??0)??0;
  let ultimateFromDamage=0;
  if(d>=threshold){ultimateFromDamage=2;workUltimate=0;}
  else if(overkill>0){
    workUltimate+=overkill;
    if(workUltimate>=threshold){ultimateFromDamage=1;workUltimate=0;}
  }
  entry.hp=after;
  if(ultimateFromDamage>0||overkill>0)entry.workUltimate=workUltimate;
  return {ok:true,hpBefore:hp,hpAfter:after,damage:d,overkill,ultimateFromDamage,death:after<=0,critical,criticalFlag,battleFlags,deathRoll,lerImmune};
}
function consumeState(entry,consumption=[]){
  for(const item of consumption??[]){
    const field=String(item?.field??'').trim();
    if(!field)continue;
    if(field==='modTrap'){
      entry.modTrap=0;
      continue;
    }
    const current=num(entry?.[field],null);
    if(current==null||current<1)return {ok:false,reason:'special-reaction-state-missing',field};
    entry[field]=Math.max(0,Math.trunc(current-1));
  }
  return {ok:true};
}

function commitSpecialDamageReact(context,{damageReactPlan=null,transactionId=null,expectedDamageRevision=null,critical=false,criticalFlag=null,battleFlags=0,deathRollByBid={},lerImmuneByBid={}}={}){
  if(!context?.context)return {ok:false,handled:false,stage:'battle-damage-react-commit',reason:'battle-context-required'};
  if(String(context.context.mode??'').trim().toLowerCase()!=='battle'||int(context.context.sourceMode)!==BATTLE_MODE_BATTLE)
    return {ok:false,handled:false,stage:'battle-damage-react-commit',reason:'battle-active-phase-required'};
  const plan=damageReactPlan;
  if(!plan||plan.ok!==true||plan.handled!==true||plan.format!==BROWSER_BATTLE_DAMAGE_REACT_RUNTIME_FORMAT||plan.action!==ACTION_BATTLE_DAMAGE_REACT_PLAN)
    return {ok:false,handled:false,stage:'battle-damage-react-commit',reason:'damage-react-plan-required'};
  const code=int(plan.reaction?.code)??BATTLE_MD_NONE;
  if(code===BATTLE_MD_NONE)return {ok:false,handled:false,stage:'battle-damage-react-commit',reason:'special-reaction-required'};
  if(plan.attackerRidePet===true||plan.defenderRidePet===true)
    return {ok:false,handled:false,stage:'battle-damage-react-commit',reason:'ride-pet-special-reaction-deferred'};
  const tx=String(transactionId??'').trim();
  if(!tx||tx.length>128)return {ok:false,handled:false,stage:'battle-damage-react-commit',reason:'damage-react-commit-transaction-required'};
  const currentRevision=int(context.context.damageCommitRevision??0),planRevision=int(plan.damageCommitRevision);
  if(currentRevision==null||planRevision==null||currentRevision!==planRevision)
    return {ok:false,handled:false,stage:'battle-damage-react-commit',reason:'damage-react-commit-stale-plan',expectedDamageRevision:currentRevision,actualDamageRevision:planRevision};

  const receipts=context.context.damageCommitReceipts&&typeof context.context.damageCommitReceipts==='object'&&!Array.isArray(context.context.damageCommitReceipts)
    ?context.context.damageCommitReceipts:{};
  const identity=planIdentity(plan);
  const prior=receipts[tx];
  if(prior){
    if(prior.planIdentity!==identity)return {ok:false,handled:false,stage:'battle-damage-react-commit',reason:'damage-react-transaction-conflict',transactionId:tx};
    return {ok:true,handled:true,stage:'battle-damage-react-commit-idempotent',format:BROWSER_BATTLE_DAMAGE_REACT_COMMIT_RUNTIME_FORMAT,action:ACTION_BATTLE_DAMAGE_REACT_COMMIT,transactionId:tx,idempotent:true,applied:false,damageCommitRevision:currentRevision,persistentMutation:false,battleContext:clone(context),damageExecuted:false};
  }

  const attackerBid=int(plan.attackerBid),targetBid=int(plan.targetBid);
  const attacker=findEntry(context,attackerBid),target=findEntry(context,targetBid);
  if(!attacker||!target)return {ok:false,handled:false,stage:'battle-damage-react-commit',reason:'special-reaction-participant-missing'};

  const next=clone(context);
  const nextAttacker=findEntry(next,attackerBid),nextTarget=findEntry(next,targetBid);
  const mutations=[],deathCommits=[];
  const healFields=[];
  let hpMutation=false,damageExecuted=false;

  const applyOne=(bid,damage,role)=>{
    const entry=findEntry(next,bid);
    const d=int(damage??0);
    if(!entry||d==null||d<0)return {ok:false,reason:'special-damage-value-invalid',bid,role};
    if(d===0)return {ok:true};
    const applied=applyDamage(entry,d,{
      critical,
      criticalFlag,
      battleFlags,
      deathRoll:deathRollByBid?.[String(bid)]??deathRollByBid?.[bid]??null,
      lerImmune:lerImmuneByBid?.[String(bid)]===true||lerImmuneByBid?.[bid]===true
    });
    if(!applied.ok)return applied;
    mutations.push({bid,role,...applied});
    hpMutation=hpMutation||applied.hpAfter!==applied.hpBefore;
    damageExecuted=true;
    if(applied.death){
      const death=planBattleDeath(next,{targetBid:bid,hp:applied.hpAfter,battleFlags,critical,criticalFlag,ultimateFromDamage:applied.ultimateFromDamage,lerImmune:applied.lerImmune,deathRoll:applied.deathRoll});
      if(!death.ok)return {ok:false,reason:death.reason??'special-death-plan-failed',detail:death};
      const committed=commitDeathState(next,{targetBid:bid,deathPlan:death});
      if(!committed.ok)return {ok:false,reason:committed.reason??'special-death-commit-failed',detail:committed};
      deathCommits.push({bid,death});
    }
    return {ok:true};
  };
  const healOne=(bid,heal,role)=>{
    const entry=findEntry(next,bid);
    const h=int(heal??0);
    if(!entry||h==null||h<0)return {ok:false,reason:'special-heal-value-invalid',bid,role};
    if(h===0)return {ok:true};
    const hp=int(entry.hp),maxHp=int(entry.maxHp);
    if(hp==null||maxHp==null||hp<0||maxHp<=0)return {ok:false,reason:'special-heal-hp-invalid',bid,role};
    const after=Math.min(maxHp,hp+h);
    entry.hp=after;
    healFields.push({bid,role,hpBefore:hp,hpAfter:after,heal:h});
    hpMutation=hpMutation||after!==hp;
    damageExecuted=true;
    return {ok:true};
  };

  let result;
  switch(code){
    case BATTLE_MD_VANISH:
      result=consumeState(nextTarget,plan.stateConsumption);
      break;
    case BATTLE_MD_ABSROB:
      result=consumeState(nextTarget,plan.stateConsumption);
      if(result.ok)result=healOne(targetBid,plan.defenderHeal,'defender-absorb');
      break;
    case BATTLE_MD_REFLEC:
      result=consumeState(nextTarget,plan.stateConsumption);
      if(result.ok)result=applyOne(attackerBid,plan.attackerDamage,'attacker-reflect');
      break;
    case BATTLE_MD_TRAP:
      result=consumeState(nextTarget,plan.stateConsumption);
      if(result.ok)result=applyOne(attackerBid,plan.attackerDamage,'attacker-trap');
      break;
    case BATTLE_MD_ACUPUNCTURE:
      result=consumeState(nextTarget,plan.stateConsumption);
      if(result.ok)result=applyOne(targetBid,plan.defenderDamage,'defender-acupuncture');
      if(result?.ok)result=applyOne(attackerBid,plan.attackerDamage,'attacker-acupuncture');
      break;
    default:
      return {ok:false,handled:false,stage:'battle-damage-react-commit',reason:'unsupported-special-reaction',reactionCode:code};
  }
  if(!result?.ok){
    return {ok:false,handled:false,stage:'battle-damage-react-commit',reason:result?.reason??'special-reaction-commit-failed',detail:result,partialContext:clone(context)};
  }

  if(Array.isArray(deathCommits)&&deathCommits.length){
    for(const row of deathCommits){
      const entry=findEntry(next,row.bid);
      if(entry)entry.battleOutcomeFlags=(int(entry.battleOutcomeFlags)??0)|(int(row.death.clientFlags)??0);
    }
  }

  const nextRevision=currentRevision+1;
  next.context.damageCommitRevision=nextRevision;
  next.context.damageCommitReceipts={
    ...receipts,
    [tx]:{
      transactionId:tx,
      planIdentity:identity,
      damageCommitRevision:nextRevision,
      attackerBid,
      targetBid,
      reactionCode:code,
      hpMutations:mutations,
      healMutations:healFields,
      stateConsumption:clone(plan.stateConsumption??[]),
      deathBids:deathCommits.map(x=>x.bid)
    }
  };

  return {
    ok:true,
    handled:true,
    stage:'battle-damage-react-special-committed',
    format:BROWSER_BATTLE_DAMAGE_REACT_COMMIT_RUNTIME_FORMAT,
    action:ACTION_BATTLE_DAMAGE_REACT_COMMIT,
    transactionId:tx,
    idempotent:false,
    applied:true,
    attackerBid,
    targetBid,
    reaction:clone(plan.reaction),
    hpMutations:mutations,
    healMutations:healFields,
    stateConsumption:clone(plan.stateConsumption??[]),
    deathBids:deathCommits.map(x=>x.bid),
    damageCommitRevision:nextRevision,
    battleContextMutation:true,
    hpMutation,
    persistentMutation:false,
    damageExecuted,
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      functions:['BATTLE_DamageSub','BATTLE_GetDamageReact','CHAR_setInt(CHAR_HP)','CHAR_setWorkInt']
    },
    scope:{
      vanish:true,
      absorb:true,
      reflect:true,
      trap:true,
      acupuncture:true,
      ridePetDeferred:true,
      specialAttachedStatusDeferred:true
    }
  };
}

function createBrowserBattleDamageReactCommitRuntime(){
  return {ok:true,format:BROWSER_BATTLE_DAMAGE_REACT_COMMIT_RUNTIME_FORMAT,commit:(context,options={})=>commitSpecialDamageReact(context,options)};
}

export {
  BROWSER_BATTLE_DAMAGE_REACT_COMMIT_RUNTIME_FORMAT,
  ACTION_BATTLE_DAMAGE_REACT_COMMIT,
  commitSpecialDamageReact,
  createBrowserBattleDamageReactCommitRuntime
};
