import { createSourceItemAllocator } from './stoneage_item_source_runtime.mjs';
import { createSourcePetGetPetHandler } from './stoneage_new_player_pet_runtime.mjs';
import { createNewPlayerItemRewardHandler } from './stoneage_new_player_item_reward_runtime.mjs';
import { createEventFlagHandlers } from './stoneage_event_flag_runtime.mjs';
import { createSourceCharmHandler } from './stoneage_charm_runtime.mjs';

const FIRST_ROUTE_REWARD_HANDLER_FORMAT='stoneage-first-route-reward-handlers-v1';

function validateFirstRouteHandlerInputs({
  itemRewardCatalog,
  itemMakeCatalog,
  petCatalog,
  petIdFactory
}={}){
  const errors=[];
  if(!itemRewardCatalog||itemRewardCatalog.format!=='stoneage-new-player-item-reward-runtime-v1')errors.push('item reward catalog format drift');
  if(!itemMakeCatalog||itemMakeCatalog.format!=='stoneage-item-make-runtime-v2')errors.push('item make catalog format drift');
  if(!petCatalog||petCatalog.format!=='stoneage-new-player-pet-runtime-v1')errors.push('pet catalog format drift');
  if(typeof petIdFactory!=='function')errors.push('pet canonical id factory required');
  return {ok:errors.length===0,errors};
}

function createFirstRouteRewardHandlers({
  itemRewardCatalog,
  itemMakeCatalog,
  petCatalog,
  petIdFactory,
  itemAllocator=null,
  itemCapacity=28000,
  itemCursor=1,
  randInclusive
}={}){
  const validation=validateFirstRouteHandlerInputs({itemRewardCatalog,itemMakeCatalog,petCatalog,petIdFactory});
  if(!validation.ok){
    return {ok:false,reason:'invalid-first-route-handler-inputs',errors:validation.errors};
  }
  const allocator=itemAllocator??createSourceItemAllocator({
    catalog:itemMakeCatalog,
    itemCapacity,
    cursor:itemCursor,
    ...(typeof randInclusive==='function'?{randInclusive}:{}),
  });
  const itemHandler=createNewPlayerItemRewardHandler({
    rewardCatalog:itemRewardCatalog,
    itemMakeCatalog,
    allocator
  });
  const petHandler=createSourcePetGetPetHandler({
    catalog:petCatalog,
    idFactory:petIdFactory,
    ...(typeof randInclusive==='function'?{randInclusive}:{}),
  });
  return {
    ok:true,
    format:FIRST_ROUTE_REWARD_HANDLER_FORMAT,
    capability:{
      GetItem:true,
      GetPet:true,
      EndSetFlg:true,
      NowSetFlg:true,
      Charm:true
    },
    handlers:{
      GetItem:itemHandler,
      GetPet:petHandler,
      Charm:createSourceCharmHandler(),
      ...createEventFlagHandlers()
    },
    allocator,
    unsupported:{
      Charm:{
        sourceModule:'gmsv/src/npc/npc_exchangeman.c',
        rule:'apply only when EvNo > 0; cap CHAR_CHARM at 100',
        newPlayerEventNo:-1,
        newPlayerBehavior:'no-op under this pinned rule'
      }
    }
  };
}

export {
  FIRST_ROUTE_REWARD_HANDLER_FORMAT,
  validateFirstRouteHandlerInputs,
  createFirstRouteRewardHandlers
};
