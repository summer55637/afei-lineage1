const BROWSER_BATTLE_DEATH_EXTRA_COMMIT_RUNTIME_FORMAT='stoneage-v462-browser-battle-death-extra-commit-v1';
const ACTION_BATTLE_DEATH_EXTRA_COMMIT='BATTLE_DEATH_EXTRA_COMMIT';
const TRANSACTION_BUCKET='battleDeathExtraTransactions';
const MAX_CHARM=100;
const MIN_CHARM=0;
const AI_MAX=10000;
const AI_MIN=-10000;

const clone=value=>JSON.parse(JSON.stringify(value));
const int=value=>{
  if(value==null||String(value).trim()==='')return null;
  const n=Number(value);
  return Number.isFinite(n)?Math.trunc(n):null;
};
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

function findPet(state,id){
  const needle=String(id??'').trim();
  if(!needle||!Array.isArray(state?.pets?.petBox))return null;
  return state.pets.petBox.find(p=>String(p?.id??'').trim()===needle)??null;
}

function commitBattleDeathExtras(state,battleContext,{
  transactionId=null,
  expectedRevision=null,
  now=()=>new Date().toISOString()
}={}){
  if(!isObject(state)||!isObject(state.player))return {ok:false,handled:false,stage:'battle-death-extra-commit',action:ACTION_BATTLE_DEATH_EXTRA_COMMIT,reason:'persistent-state-required',state:clone(state)};
  const context=battleContext?.context;
  if(!isObject(context))return {ok:false,handled:false,stage:'battle-death-extra-commit',action:ACTION_BATTLE_DEATH_EXTRA_COMMIT,reason:'battle-context-required',state:clone(state)};
  const events=Array.isArray(context.sourceDeathExtraEvents)?context.sourceDeathExtraEvents.filter(isObject):[];
  if(events.length===0)return {ok:false,handled:false,stage:'battle-death-extra-commit',action:ACTION_BATTLE_DEATH_EXTRA_COMMIT,reason:'death-extra-events-required',state:clone(state)};
  const tx=String(transactionId??'').trim();
  if(!tx)return {ok:false,handled:false,stage:'battle-death-extra-commit',action:ACTION_BATTLE_DEATH_EXTRA_COMMIT,reason:'transaction-id-required',state:clone(state)};

  const currentRevision=int(state.revision)??0;
  const bucket=isObject(state.runtimeMeta?.[TRANSACTION_BUCKET])?state.runtimeMeta[TRANSACTION_BUCKET]:{};
  if(bucket[tx]){
    return {ok:true,handled:true,stage:'battle-death-extra-commit-idempotent',format:BROWSER_BATTLE_DEATH_EXTRA_COMMIT_RUNTIME_FORMAT,action:ACTION_BATTLE_DEATH_EXTRA_COMMIT,transactionId:tx,idempotent:true,applied:false,revision:currentRevision,state:clone(state)};
  }
  if(expectedRevision!=null&&(int(expectedRevision)??null)!==currentRevision){
    return {ok:false,handled:false,stage:'battle-death-extra-commit',action:ACTION_BATTLE_DEATH_EXTRA_COMMIT,reason:'revision-conflict',currentRevision,expectedRevision:int(expectedRevision),state:clone(state)};
  }

  const next=clone(state);
  const committed=[];
  for(const event of events){
    if(event.kind==='player-normal-death'||event.kind==='player-ultimate-death'){
      const playerId=String(event.playerId??'').trim();
      if(state.player.id!=null&&playerId&&String(state.player.id).trim()!==playerId)return {ok:false,handled:false,stage:'battle-death-extra-commit',reason:'player-death-extra-identity-mismatch',playerId,state:clone(state)};
      const before=int(event.charmBefore);
      const after=int(event.charmAfter);
      if(before==null||after==null)return {ok:false,handled:false,stage:'battle-death-extra-commit',reason:'player-charm-snapshot-missing',state:clone(state)};
      if((int(state.player.charm)??0)!==Math.max(MIN_CHARM,Math.min(MAX_CHARM,before)))return {ok:false,handled:false,stage:'battle-death-extra-commit',reason:'player-charm-stale-plan',state:clone(state)};
      next.player.charm=Math.max(MIN_CHARM,Math.min(MAX_CHARM,after));
      const petEvent=event.defaultPetEvent;
      if(isObject(petEvent)&&petEvent.petId){
        const persistentPet=findPet(state,petEvent.petId);
        const pet=findPet(next,petEvent.petId);
        if(!persistentPet||!pet)return {ok:false,handled:false,stage:'battle-death-extra-commit',reason:'default-pet-missing',petId:petEvent.petId,state:clone(state)};
        const aiBefore=int(petEvent.variableAiBefore)??0;
        if((int(persistentPet.variableAi)??0)!==aiBefore)return {ok:false,handled:false,stage:'battle-death-extra-commit',reason:'default-pet-variableai-stale-plan',petId:petEvent.petId,state:clone(state)};
        pet.variableAi=Math.max(AI_MIN,Math.min(AI_MAX,int(petEvent.variableAiAfter)??aiBefore));
        if(event.kind==='player-ultimate-death'&&String(next.pets.activePetId??'')===String(pet.id))next.pets.activePetId=null;
        committed.push({kind:event.kind,player:true,charmBefore:before,charmAfter:next.player.charm,defaultPetId:pet.id,defaultPetVariableAiBefore:aiBefore,defaultPetVariableAiAfter:pet.variableAi});
      }else{
        committed.push({kind:event.kind,player:true,charmBefore:before,charmAfter:next.player.charm});
      }
    }else if(event.kind==='pet-normal-death'||event.kind==='pet-ultimate-death'){
      const persistentPet=findPet(state,event.petId);
      const pet=findPet(next,event.petId);
      if(!persistentPet||!pet)return {ok:false,handled:false,stage:'battle-death-extra-commit',reason:'persistent-pet-missing',petId:event.petId,state:clone(state)};
      const aiBefore=int(event.variableAiBefore)??0;
      if((int(persistentPet.variableAi)??0)!==aiBefore)return {ok:false,handled:false,stage:'battle-death-extra-commit',reason:'pet-variableai-stale-plan',petId:event.petId,state:clone(state)};
      pet.variableAi=Math.max(AI_MIN,Math.min(AI_MAX,int(event.variableAiAfter)??aiBefore));
      const deadBefore=int(event.deadPetCountBefore)??0;
      if((int(next.player.deadPetCount)??0)!==deadBefore)return {ok:false,handled:false,stage:'battle-death-extra-commit',reason:'dead-pet-count-stale-plan',state:clone(state)};
      next.player.deadPetCount=Math.max(0,deadBefore+(int(event.deadPetCountDelta)??1));
      if(isObject(event.marefia)){
        const marefia=event.marefia;
        if(marefia.allocPointKnown===true){
          if((int(persistentPet.allocPointPacked)??null)!==(int(marefia.allocPointPackedBefore)??null))return {ok:false,handled:false,stage:'battle-death-extra-commit',reason:'marefia-alloc-stale-plan',petId:event.petId,state:clone(state)};
          pet.allocPointPacked=int(marefia.allocPointPackedAfter)??pet.allocPointPacked;
        }
        if(marefia.modAiAfter!=null){
          const modBefore=int(marefia.modAiBefore)??0;
          if((int(persistentPet.modAi)??0)!==modBefore)return {ok:false,handled:false,stage:'battle-death-extra-commit',reason:'marefia-modai-stale-plan',petId:event.petId,state:clone(state)};
          pet.modAi=int(marefia.modAiAfter)??pet.modAi;
        }
      }
      if(event.kind==='pet-ultimate-death'&&String(next.pets.activePetId??'')===String(pet.id))next.pets.activePetId=null;
      committed.push({kind:event.kind,petId:pet.id,variableAiBefore:aiBefore,variableAiAfter:pet.variableAi,deadPetCount:next.player.deadPetCount,marefia:isObject(event.marefia)?clone(event.marefia):null});
    }
  }

  const timestamp=String(typeof now==='function'?now():now);
  next.runtimeMeta=isObject(next.runtimeMeta)?next.runtimeMeta:{};
  next.runtimeMeta[TRANSACTION_BUCKET]=isObject(next.runtimeMeta[TRANSACTION_BUCKET])?next.runtimeMeta[TRANSACTION_BUCKET]:{};
  next.runtimeMeta[TRANSACTION_BUCKET][tx]={
    committedAt:timestamp,
    transactionId:tx,
    battleDeathExtraEvents:committed,
    sourceEventCount:events.length,
    revisionBefore:currentRevision,
    revisionAfter:currentRevision+1
  };
  next.runtimeMeta.updatedAt=timestamp;
  next.revision=currentRevision+1;
  return {
    ok:true,handled:true,stage:'battle-death-extra-commit-applied',
    format:BROWSER_BATTLE_DEATH_EXTRA_COMMIT_RUNTIME_FORMAT,
    action:ACTION_BATTLE_DEATH_EXTRA_COMMIT,
    transactionId:tx,idempotent:false,applied:true,
    revisionBefore:currentRevision,revisionAfter:next.revision,
    events:committed,persistentMutation:true,battleContextMutation:false,rngPreserved:true,
    state:next
  };
}

function createBrowserBattleDeathExtraCommitRuntime(){
  return {ok:true,format:BROWSER_BATTLE_DEATH_EXTRA_COMMIT_RUNTIME_FORMAT,commit:(state,battleContext,options={})=>commitBattleDeathExtras(state,battleContext,options)};
}

export {BROWSER_BATTLE_DEATH_EXTRA_COMMIT_RUNTIME_FORMAT,ACTION_BATTLE_DEATH_EXTRA_COMMIT,TRANSACTION_BUCKET,commitBattleDeathExtras,createBrowserBattleDeathExtraCommitRuntime};
