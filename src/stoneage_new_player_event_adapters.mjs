import { createEventFlagHandlers } from './stoneage_event_flag_runtime.mjs';
import { createSourceCharmHandler } from './stoneage_charm_runtime.mjs';
import { createSourcePetGetPetHandler } from './stoneage_new_player_pet_runtime.mjs';
import { createNewPlayerItemRewardHandler } from './stoneage_new_player_item_reward_runtime.mjs';

const NEW_PLAYER_EVENT_ADAPTERS_FORMAT='stoneage-new-player-event-adapters-v1';

function createNewPlayerEventHandlers({
  itemRewardCatalog,
  itemMakeCatalog,
  petCatalog,
  petIdFactory,
  itemAllocator=null,
  itemRandInclusive=null,
  petRandInclusive=null,
  maxPetHave=5,
  itemCapacity=28000,
  itemCursor=1
}={}){
  const itemHandler=createNewPlayerItemRewardHandler({
    rewardCatalog:itemRewardCatalog,
    itemMakeCatalog,
    allocator:itemAllocator,
    randInclusive:typeof itemRandInclusive==='function'?itemRandInclusive:undefined,
    itemCapacity,
    cursor:itemCursor
  });
  const petHandler=createSourcePetGetPetHandler({
    catalog:petCatalog,
    idFactory:petIdFactory,
    randInclusive:typeof petRandInclusive==='function'?petRandInclusive:undefined,
    maxPetHave
  });
  return {
    ...createEventFlagHandlers(),
    GetItem:itemHandler,
    GetPet:petHandler,
    Charm:createSourceCharmHandler()
  };
}

export {
  NEW_PLAYER_EVENT_ADAPTERS_FORMAT,
  createNewPlayerEventHandlers
};
