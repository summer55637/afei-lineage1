import { BROWSER_BATTLE_DAMAGE_REACT_RUNTIME_FORMAT, ACTION_BATTLE_DAMAGE_REACT_PLAN } from './stoneage_browser_battle_damage_react_runtime.mjs';

const BROWSER_BATTLE_DAMAGE_COMMIT_RUNTIME_FORMAT='stoneage-v426-browser-battle-damage-commit-v1';
const ACTION_BATTLE_DAMAGE_COMMIT='BATTLE_DAMAGE_COMMIT';
const BATTLE_MODE_BATTLE=2;
const BATTLE_MD_NONE=0;
const int=value=>{
  if(value==null||String(value).trim()==='')return null;
  const n=Number(value);
  return Number.isFinite(n)&&Number.isInteger(n)?n:null;
};
const clone=value=>JSON.parse(JSON.stringify(value));
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

function findEntry(context,bid){
  const b=int(bid);
  if(b==null||b<0||b>19)return null;
  const side=b>=10?1:0,slot=b>=10?b-10:b;
  const target=context?.context?.sides?.find(s=>int(s?.side)===side);
  return Array.isArray(target?.entries)?target.entries[slot]??null:null;
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
function commitBattleDamage(context,{damageReactPlan=null,transactionId=null,expectedDamageRevision=null}={}){
  if(!isObject(context)||!isObject(context.context))
    return {ok:false,handled:false,stage:'battle-damage-commit',reason:'battle-context-required'};
  if(String(context.context.mode??'').trim().toLowerCase()!=='battle'||int(context.context.sourceMode)!==BATTLE_MODE_BATTLE)
    return {ok:false,handled:false,stage:'battle-damage-commit',reason:'battle-active-phase-required'};
  const plan=damageReactPlan;
  if(!isObject(plan)||plan.ok!==true||plan.handled!==true||
     plan.format!==BROWSER_BATTLE_DAMAGE_REACT_RUNTIME_FORMAT||
     plan.action!==ACTION_BATTLE_DAMAGE_REACT_PLAN)
    return {ok:false,handled:false,stage:'battle-damage-commit',reason:'damage-react-plan-required'};
  const attackerBid=int(plan.attackerBid),targetBid=int(plan.targetBid);
  if(attackerBid==null||targetBid==null||attackerBid===targetBid)
    return {ok:false,handled:false,stage:'battle-damage-commit',reason:'damage-plan-participants-invalid'};
  const attacker=findEntry(context,attackerBid),target=findEntry(context,targetBid);
  if(!attacker||!target)
    return {ok:false,handled:false,stage:'battle-damage-commit',reason:'damage-plan-participant-missing',attackerBid,targetBid};
  const tx=String(transactionId??'').trim();
  if(!tx||tx.length>128)
    return {ok:false,handled:false,stage:'battle-damage-commit',reason:'damage-commit-transaction-required'};
  const currentRevision=int(context.context.damageCommitRevision??0),planRevision=int(plan.damageCommitRevision);
  if(currentRevision==null||currentRevision<0||planRevision==null||planRevision<0)
    return {ok:false,handled:false,stage:'battle-damage-commit',reason:'damage-commit-revision-invalid'};
  const identity=planIdentity(plan);
  const receipts=isObject(context.context.damageCommitReceipts)?context.context.damageCommitReceipts:{};
  const prior=receipts[tx];
  if(prior){
    if(prior.planIdentity!==identity)
      return {ok:false,handled:false,stage:'battle-damage-commit',reason:'damage-commit-transaction-conflict',transactionId:tx};
    return {ok:true,handled:true,stage:'battle-damage-commit-idempotent',
      format:BROWSER_BATTLE_DAMAGE_COMMIT_RUNTIME_FORMAT,action:ACTION_BATTLE_DAMAGE_COMMIT,
      transactionId:tx,idempotent:true,applied:false,damageCommitRevision:currentRevision,
      ultimateFromDamage:int(prior.ultimateFromDamage)??0,battleContext:clone(context),
      battleContextMutation:false,hpMutation:false,persistentMutation:false,damageExecuted:false};
  }
  if(planRevision!==currentRevision)
    return {ok:false,handled:false,stage:'battle-damage-commit',reason:'damage-commit-stale-plan',
      expectedDamageRevision:currentRevision,actualDamageRevision:planRevision,transactionId:tx};
  if(expectedDamageRevision!=null&&int(expectedDamageRevision)!==currentRevision)
    return {ok:false,handled:false,stage:'battle-damage-commit',reason:'damage-commit-expected-revision-mismatch',
      expectedDamageRevision:int(expectedDamageRevision),actualDamageRevision:currentRevision,transactionId:tx};
  const requestedDamage=int(plan.requestedDamage);
  if(requestedDamage==null||requestedDamage<0)
    return {ok:false,handled:false,stage:'battle-damage-commit',reason:'damage-plan-value-invalid'};
  const fields=['defenderDamage','defenderPetDamage','attackerDamage','attackerPetDamage','defenderHeal','defenderPetHeal'];
  for(const field of fields){
    const value=int(plan[field]??0);
    if(value==null||value<0)
      return {ok:false,handled:false,stage:'battle-damage-commit',reason:'damage-plan-value-invalid',field};
  }
  if(requestedDamage===0){
    if(int(plan.reaction?.code)!==BATTLE_MD_NONE||plan.stateConsumption?.length||
       fields.some(field=>Number(plan[field]??0)!==0))
      return {ok:false,handled:false,stage:'battle-damage-commit',reason:'zero-damage-plan-must-be-noop'};
    return {ok:true,handled:true,stage:'battle-damage-commit-noop',
      format:BROWSER_BATTLE_DAMAGE_COMMIT_RUNTIME_FORMAT,action:ACTION_BATTLE_DAMAGE_COMMIT,
      transactionId:tx,idempotent:false,applied:false,damageCommitRevision:currentRevision,
      ultimateFromDamage:0,battleContext:clone(context),
      battleContextMutation:false,hpMutation:false,persistentMutation:false,damageExecuted:false};
  }
  if(int(plan.reaction?.code)!==BATTLE_MD_NONE||plan.redirected===true||
     plan.attackerRidePet===true||plan.defenderRidePet===true||
     Number(plan.defenderPetDamage??0)!==0||Number(plan.attackerDamage??0)!==0||
     Number(plan.attackerPetDamage??0)!==0||Number(plan.defenderHeal??0)!==0||
     Number(plan.defenderPetHeal??0)!==0||
     (Array.isArray(plan.stateConsumption)&&plan.stateConsumption.length>0))
    return {ok:false,handled:false,stage:'battle-damage-commit',reason:'special-reaction-or-ride-pet-commit-deferred'};
  const damage=int(plan.defenderDamage);
  if(damage==null||damage!==requestedDamage)
    return {ok:false,handled:false,stage:'battle-damage-commit',reason:'normal-damage-total-mismatch',requestedDamage,defenderDamage:damage};
  const attackerHp=int(attacker.hp);
  if(attackerHp==null||attackerHp<=0)
    return {ok:false,handled:false,stage:'battle-damage-commit',reason:'attacker-hp-runtime-invalid',attackerBid,hp:attacker.hp??null};
  const hp=int(target.hp),maxHp=int(target.maxHp);
  if(hp==null||maxHp==null||hp<=0||maxHp<=0||hp>maxHp)
    return {ok:false,handled:false,stage:'battle-damage-commit',reason:'target-hp-runtime-invalid',
      targetBid,hp:target.hp??null,maxHp:target.maxHp??null};
  const rawHp=hp-damage,hpAfter=Math.min(Math.max(rawHp,0),maxHp),overkill=Math.max(0,-rawHp);
  const threshold=maxHp*1.2+20;
  let workUltimate=int(target.workUltimate??0);
  if(workUltimate==null||workUltimate<0)
    return {ok:false,handled:false,stage:'battle-damage-commit',reason:'target-work-ultimate-invalid',targetBid};
  let ultimateFromDamage=0;
  if(damage>=threshold){ultimateFromDamage=2;workUltimate=0;}
  else if(overkill>0){workUltimate+=overkill;if(workUltimate>=threshold){ultimateFromDamage=1;workUltimate=0;}}
  const next=clone(context),nextTarget=findEntry(next,targetBid);
  nextTarget.hp=hpAfter;
  if(ultimateFromDamage>0||overkill>0)nextTarget.workUltimate=workUltimate;
  const nextRevision=currentRevision+1;
  next.context.damageCommitRevision=nextRevision;
  next.context.damageCommitReceipts={...receipts,[tx]:{transactionId:tx,planIdentity:identity,
    damageCommitRevision:nextRevision,attackerBid,targetBid,hpBefore:hp,hpAfter,overkill,ultimateFromDamage}};
  return {ok:true,handled:true,stage:'battle-damage-committed',
    format:BROWSER_BATTLE_DAMAGE_COMMIT_RUNTIME_FORMAT,action:ACTION_BATTLE_DAMAGE_COMMIT,
    transactionId:tx,idempotent:false,applied:true,attackerBid,targetBid,requestedDamage,damage,
    hpBefore:hp,hpAfter,overkill,workUltimateBefore:int(target.workUltimate??0),
    workUltimateAfter:workUltimate,ultimateFromDamage,planDamageRevision:planRevision,
    damageCommitRevision:nextRevision,battleContextMutation:true,hpMutation:hpAfter!==hp,
    persistentMutation:false,damageExecuted:true,battleContext:next};
}
function createBrowserBattleDamageCommitRuntime(){
  return {ok:true,format:BROWSER_BATTLE_DAMAGE_COMMIT_RUNTIME_FORMAT,
    commit:(context,options={})=>commitBattleDamage(context,options)};
}
export {
  BROWSER_BATTLE_DAMAGE_COMMIT_RUNTIME_FORMAT,
  ACTION_BATTLE_DAMAGE_COMMIT,
  commitBattleDamage,
  createBrowserBattleDamageCommitRuntime
};
