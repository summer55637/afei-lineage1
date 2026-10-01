const BROWSER_BATTLE_COMPLIANCE_COMMIT_RUNTIME_FORMAT='stoneage-v420-browser-battle-compliance-commit-v1';
const ACTION_BATTLE_COMPLIANCE_COMMIT='BATTLE_COMPLIANCE_COMMIT';
const TRANSACTION_BUCKET='battleComplianceTransactions';

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const intOr=(value,fallback=null)=>{
  if(value==null||String(value).trim()==='')return fallback;
  const n=Number(value);
  return Number.isFinite(n)?Math.trunc(n):fallback;
};
const clone=value=>JSON.parse(JSON.stringify(value));

function validatePlan(plan){
  return isObject(plan)&&plan.ok===true&&plan.stage==='battle-compliance-plan-ready'&&
    plan.format==='stoneage-v419-browser-battle-compliance-plan-v1';
}

function commitBattleCompliance(state,plan,{transactionId=null,expectedRevision=null,now=()=>new Date().toISOString()}={}){
  if(!isObject(state)||!isObject(state.player))return {ok:false,handled:false,stage:'battle-compliance-commit',reason:'persistent-state-required',state:clone(state)};
  if(!validatePlan(plan))return {ok:false,handled:false,stage:'battle-compliance-commit',reason:'plan-invalid',state:clone(state)};
  const tx=String(transactionId??'').trim();
  if(!tx)return {ok:false,handled:false,stage:'battle-compliance-commit',reason:'transaction-id-required',state:clone(state)};
  const currentRevision=intOr(state.revision,0);
  const meta=isObject(state.runtimeMeta)?state.runtimeMeta:{};
  const bucket=isObject(meta[TRANSACTION_BUCKET])?meta[TRANSACTION_BUCKET]:{};
  if(bucket[tx]){
    return {ok:true,handled:true,stage:'battle-compliance-commit-idempotent',format:BROWSER_BATTLE_COMPLIANCE_COMMIT_RUNTIME_FORMAT,action:ACTION_BATTLE_COMPLIANCE_COMMIT,transactionId:tx,idempotent:true,applied:false,revision:currentRevision,state:clone(state)};
  }
  if(expectedRevision!=null&&currentRevision!==intOr(expectedRevision,null)){
    return {ok:false,handled:false,stage:'battle-compliance-commit',reason:'revision-conflict',currentRevision,expectedRevision:intOr(expectedRevision,null),state:clone(state)};
  }

  const next=clone(state);
  const committed=[];
  for(const character of Array.isArray(plan.characters)?plan.characters:[]){
    const kind=String(character?.kind??'');
    if(kind==='player'){
      const plannedId=character.characterId==null?null:String(character.characterId);
      if(plannedId!=null&&String(state.player.id??'')!==plannedId){
        return {ok:false,handled:false,stage:'battle-compliance-commit',reason:'player-identity-stale-plan',state:clone(state)};
      }
      const stats=character.statsBefore??{};
      const keys=['vital','str','tgh','dex'];
      if(keys.some(k=>intOr(state.player.stats?.[k],null)!==intOr(stats[k],null))){
        return {ok:false,handled:false,stage:'battle-compliance-commit',reason:'player-stats-stale-plan',state:clone(state)};
      }
      const maxHp=intOr(character.derived?.maxHp,null);
      if(maxHp==null||maxHp<0)return {ok:false,handled:false,stage:'battle-compliance-commit',reason:'player-maxhp-invalid',state:clone(state)};
      next.player.maxHp=maxHp;
      committed.push({kind:'player',characterId:plannedId,maxHp});
    }else if(kind==='pet'){
      const petId=String(character.petId??'').trim();
      const pet=Array.isArray(state.pets?.petBox)?state.pets.petBox.find(p=>String(p?.id??'').trim()===petId):null;
      if(!pet)return {ok:false,handled:false,stage:'battle-compliance-commit',reason:'persistent-pet-missing',petId,state:clone(state)};
      const stats=character.statsBefore??{};
      const keys=['vital','str','tgh','dex'];
      if(keys.some(k=>intOr(pet.stats?.[k]??pet.serverStats?.[k],null)!==intOr(stats[k],null))){
        return {ok:false,handled:false,stage:'battle-compliance-commit',reason:'pet-stats-stale-plan',petId,state:clone(state)};
      }
      const maxHp=intOr(character.derived?.maxHp,null);
      if(maxHp==null||maxHp<0)return {ok:false,handled:false,stage:'battle-compliance-commit',reason:'pet-maxhp-invalid',petId,state:clone(state)};
      pet.maxHp=maxHp;
      committed.push({kind:'pet',petId,maxHp});
    }else{
      return {ok:false,handled:false,stage:'battle-compliance-commit',reason:'unknown-character-kind',kind,state:clone(state)};
    }
  }

  const timestamp=String(typeof now==='function'?now():now);
  next.runtimeMeta=isObject(next.runtimeMeta)?next.runtimeMeta:{};
  next.runtimeMeta[TRANSACTION_BUCKET]=isObject(next.runtimeMeta[TRANSACTION_BUCKET])?next.runtimeMeta[TRANSACTION_BUCKET]:{};
  next.runtimeMeta[TRANSACTION_BUCKET][tx]={
    committedAt:timestamp,
    characters:committed
  };
  next.runtimeMeta.updatedAt=timestamp;
  next.revision=currentRevision+1;

  return {
    ok:true,handled:true,stage:'battle-compliance-commit-applied',
    format:BROWSER_BATTLE_COMPLIANCE_COMMIT_RUNTIME_FORMAT,
    action:ACTION_BATTLE_COMPLIANCE_COMMIT,
    transactionId:tx,idempotent:false,applied:true,
    revisionBefore:currentRevision,revisionAfter:next.revision,
    characters:committed,
    hpMutation:false,
    mpMutation:false,
    maxMpDeferred:true,
    specialComplianceDeferred:true,
    persistentMutation:true,
    battleContextMutation:false,uiMutation:false,dbMutation:false,
    rngPreserved:true,
    sourceSideEffects:['CHAR_complianceParameter base derived state represented; MaxMP/special branches remain deferred'],
    state:next
  };
}

function createBrowserBattleComplianceCommitRuntime(){
  return {ok:true,format:BROWSER_BATTLE_COMPLIANCE_COMMIT_RUNTIME_FORMAT,commit:commitBattleCompliance};
}

export {
  BROWSER_BATTLE_COMPLIANCE_COMMIT_RUNTIME_FORMAT,
  ACTION_BATTLE_COMPLIANCE_COMMIT,
  TRANSACTION_BUCKET,
  commitBattleCompliance,
  createBrowserBattleComplianceCommitRuntime
};
