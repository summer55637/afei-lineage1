import { applyPlayerCreationInput } from './stoneage_player_creation_runtime.mjs';
import { grantSourceStarterPet } from './stoneage_new_player_starter_pet_runtime.mjs';
import { commitSave, parseAndValidateSaveEnvelope } from './stoneage_save_transaction.mjs';

const NEW_PLAYER_CREATION_SAVE_FORMAT='stoneage-new-player-creation-save-v1';

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

function clone(value){return JSON.parse(JSON.stringify(value));}
function stateOrPetStateHasStarterPet(state){return Array.isArray(state?.pets?.petBox)&&state.pets.petBox.length>0;}

async function runNewPlayerCreationSave(state,{
  seed,
  hometown,
  stats,
  elements,
  randInclusive,
  idFactory,
  itemGrantAdapter=null,
  now=()=>new Date().toISOString(),
  expectedRevision=null,
  source='new-player-creation'
}={}){
  if(!isObject(state))return {ok:false,stage:'input',reason:'state-required'};
  let prepared;
  let petState;
  let petResult;
  const canResumeItemStage =
    state.creation?.hometownConfigured === true
    && state.creation?.playerCreationStatsConfigured === true
    && state.creation?.elementsConfigured === true
    && Number(state.creation.hometown) === Number(hometown)
    && state.creation?.starterPetGranted === true
    && state.creation?.starterItemGranted !== true
    && state.creation?.completed !== true
    && state.creation?.source?.transactionFormat === NEW_PLAYER_CREATION_SAVE_FORMAT;
  if(canResumeItemStage){
    prepared={ok:true,state:clone(state),creation:null};
    petState=clone(state);
    petResult={ok:true,state:clone(state),pet:state.pets?.petBox?.[state.pets.petBox.length-1]??null};
  }else{
    prepared=applyPlayerCreationInput(state,{seed,hometown,stats,elements,now});
    if(!prepared.ok)return {ok:false,stage:'creation-input',...prepared};
    const pet=grantSourceStarterPet(prepared.state,seed,hometown,{randInclusive,idFactory,now});
    if(!pet.ok)return {ok:false,stage:'starter-pet',state:prepared.state,...pet};
    petState=pet.state;
    petResult=pet;
  }

  if(typeof itemGrantAdapter!=='function'){
    const checkpoint=clone(petState);
    checkpoint.creation.source={
      ...(isObject(checkpoint.creation.source)?checkpoint.creation.source:{}),
      fixedCRef:seed.fixedSource.ref,
      transactionFormat:NEW_PLAYER_CREATION_SAVE_FORMAT,
      pendingStage:'starter-item'
    };
    petState=checkpoint;
    return {
      ok:false,
      stage:'starter-item',
      reason:'starter-item-template-unresolved',
      sourceClosed:false,
      state:petState,
      pendingItemId:Number(seed.sourceConfig?.itemSlots?.ITEM1??0)||null,
      petGranted:petResult.ok===true && stateOrPetStateHasStarterPet(petState),
      creationCompleted:false,
      saveCommitted:false
    };
  }

  let itemResult;
  try{itemResult=await itemGrantAdapter(clone(petState),{seed,hometown,itemId:Number(seed.sourceConfig?.itemSlots?.ITEM1??0)||null,now});}
  catch(error){return {ok:false,stage:'starter-item',reason:'starter-item-adapter-error',error:String(error?.message??error),state:petState};}
  if(!isObject(itemResult)||itemResult.ok!==true||!isObject(itemResult.state)){
    return {ok:false,stage:'starter-item',reason:itemResult?.reason??'starter-item-adapter-rejected',state:petState,adapterResult:itemResult??null};
  }

  const completed=clone(itemResult.state);
  completed.creation.starterPetGranted=true;
  completed.creation.starterItemGranted=true;
  completed.creation.completed=true;
  completed.creation.source={
    ...(isObject(completed.creation.source)?completed.creation.source:{}),
    fixedCRef:seed.fixedSource.ref,
    transactionFormat:NEW_PLAYER_CREATION_SAVE_FORMAT
  };

  const committed=await commitSave(completed,completed,{expectedRevision,savedAt:now,source});
  if(!committed.ok)return {ok:false,stage:'save',...committed,state:completed,creationCompleted:true};

  const parsed=await parseAndValidateSaveEnvelope(committed.envelope,{now});
  if(!parsed.ok)return {ok:false,stage:'save-verify',reason:'save-round-trip-verification-failed',save:committed.envelope,state:committed.state,verification:parsed};

  return {
    ok:true,
    format:NEW_PLAYER_CREATION_SAVE_FORMAT,
    state:parsed.state,
    envelope:committed.envelope,
    verification:parsed,
    stages:{creationInput:true,starterPet:true,starterItem:true,save:true},
    resumedItemStage:canResumeItemStage,
    pet:petResult.pet,
    creation:prepared.creation ?? {resumedItemStage:true},
  };
}

export { NEW_PLAYER_CREATION_SAVE_FORMAT, runNewPlayerCreationSave };
