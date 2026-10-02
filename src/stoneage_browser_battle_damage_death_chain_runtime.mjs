import { commitBattleDamage } from './stoneage_browser_battle_damage_commit_runtime.mjs';
import { deathPlan as planBattleDeath } from './stoneage_browser_battle_death_runtime.mjs';
import { commitDeathState } from './stoneage_browser_battle_death_commit_runtime.mjs';

const BROWSER_BATTLE_DAMAGE_DEATH_CHAIN_FORMAT='stoneage-v427-browser-battle-damage-death-chain-v1';
const ACTION_BATTLE_DAMAGE_DEATH_COMMIT='BATTLE_DAMAGE_DEATH_COMMIT';
const int=value=>{
  if(value==null||String(value).trim()==='')return null;
  const n=Number(value);
  return Number.isFinite(n)&&Number.isInteger(n)?n:null;
};
const clone=value=>JSON.parse(JSON.stringify(value));
const findEntry=(ctx,bid)=>{
  const b=int(bid);
  if(b==null||b<0||b>19)return null;
  const side=b>=10?1:0,slot=b>=10?b-10:b;
  const row=ctx?.context?.sides?.find(s=>int(s?.side)===side);
  return Array.isArray(row?.entries)?row.entries[slot]??null:null;
};

function commitBattleDamageDeathChain(context,{
  damageReactPlan=null,transactionId=null,expectedDamageRevision=null,
  critical=false,criticalFlag=null,battleFlags=0,deathRoll=null,lerImmune=false
}={}){
  const damage=commitBattleDamage(context,{damageReactPlan,transactionId,expectedDamageRevision});
  if(!damage.ok)return {...damage,format:BROWSER_BATTLE_DAMAGE_DEATH_CHAIN_FORMAT};
  const afterDamage=damage.battleContext;
  const target=findEntry(afterDamage,damage.targetBid);
  if(!target)return {ok:false,handled:false,stage:'battle-damage-death-chain',reason:'committed-target-missing',battleContext:clone(context),hpMutation:false,persistentMutation:false};
  if(int(target.hp)>0){
    return {...damage,format:BROWSER_BATTLE_DAMAGE_DEATH_CHAIN_FORMAT,
      stage:'battle-damage-death-nonlethal',lethal:false,deathCommitted:false,deathPlan:null,deathCommit:null};
  }
  if(target.isDie===true){
    return {...damage,format:BROWSER_BATTLE_DAMAGE_DEATH_CHAIN_FORMAT,
      stage:'battle-damage-death-idempotent',lethal:true,deathCommitted:true,deathPlan:null,deathCommit:null,
      idempotent:true,applied:false};
  }
  const deathPlan=planBattleDeath(afterDamage,{
    targetBid:damage.targetBid,hp:target.hp,battleFlags,critical,criticalFlag,
    ultimateFromDamage:damage.ultimateFromDamage??0,lerImmune:lerImmune===true,deathRoll
  });
  if(!deathPlan.ok){
    return {ok:false,handled:false,stage:'battle-damage-death-plan',
      reason:deathPlan.reason??'death-plan-failed',detail:deathPlan,transactionId:damage.transactionId,
      damagePreview:{hpBefore:damage.hpBefore,hpAfter:damage.hpAfter,ultimateFromDamage:damage.ultimateFromDamage},
      battleContext:clone(context),hpMutation:false,persistentMutation:false,damageExecuted:false};
  }
  const deathCommit=commitDeathState(afterDamage,{targetBid:damage.targetBid,deathPlan});
  if(!deathCommit.ok){
    return {ok:false,handled:false,stage:'battle-damage-death-commit',
      reason:deathCommit.reason??'death-commit-failed',detail:deathCommit,transactionId:damage.transactionId,
      damagePreview:{hpBefore:damage.hpBefore,hpAfter:damage.hpAfter,ultimateFromDamage:damage.ultimateFromDamage},
      battleContext:clone(context),hpMutation:false,persistentMutation:false,damageExecuted:false};
  }
  return {...damage,format:BROWSER_BATTLE_DAMAGE_DEATH_CHAIN_FORMAT,
    stage:'battle-damage-death-committed',lethal:true,deathCommitted:true,deathPlan,
    deathCommit:{ok:true,handled:true,targetBid:deathCommit.targetBid,isDie:deathCommit.isDie,
      deadCountBefore:deathCommit.deadCountBefore,deadCountAfter:deathCommit.deadCountAfter,
      ultimate:deathCommit.ultimate,battleOutcomeFlags:deathCommit.battleOutcomeFlags},
    battleContext:deathCommit.battleContext};
}

function createBrowserBattleDamageDeathChainRuntime(){
  return {ok:true,format:BROWSER_BATTLE_DAMAGE_DEATH_CHAIN_FORMAT,
    commit:(context,options={})=>commitBattleDamageDeathChain(context,options)};
}

export {BROWSER_BATTLE_DAMAGE_DEATH_CHAIN_FORMAT,ACTION_BATTLE_DAMAGE_DEATH_COMMIT,
  commitBattleDamageDeathChain,createBrowserBattleDamageDeathChainRuntime};
