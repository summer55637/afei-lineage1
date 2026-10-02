import { validatePersistentState } from './stoneage_persistent_state.mjs';
import { DEFAULT_SAVE_STORAGE_KEY, loadPersistentStateFromStorage } from './stoneage_save_storage.mjs';
import { createBrowserStateController } from './stoneage_browser_state_controller.mjs';

async function createPersistentBrowserStateController({storage,storageKey=DEFAULT_SAVE_STORAGE_KEY,initialState=null,now=()=>new Date().toISOString(),...controllerOptions}={}){
  const loaded=await loadPersistentStateFromStorage(storage,{key:storageKey,now});
  if(!loaded.ok)return {...loaded,stage:'restore'};
  const state=loaded.found?loaded.state:initialState;
  if(state==null)return {ok:false,stage:'restore',reason:'initial-state-required',found:false,key:loaded.key};
  const errors=validatePersistentState(state);
  if(errors.length)return {ok:false,stage:'restore',reason:'initial-state-invalid',errors,key:loaded.key};
  const controller=createBrowserStateController({
    ...controllerOptions,
    state,
    now,
    saveStorage:storage,
    saveStorageKey:loaded.key
  });
  return {ok:true,restored:loaded.found,migration:loaded.migration,key:loaded.key,state:controller.getState(),controller};
}

export { createPersistentBrowserStateController };
