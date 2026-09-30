#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { sourcePlayerMaxGold } from '../src/stoneage_item_economy_runtime.mjs';
import { buildWorldNpcPointIndex, resolveWorldNpcAt } from '../src/stoneage_browser_world_npc_runtime.mjs';
import { buildWorldItemShopBindingIndex } from '../src/stoneage_browser_world_itemshop_runtime.mjs';
import {
  createBrowserStateController,
  ACTION_NPC_ITEMSHOP_BUY,
  ITEMSHOP_UI_OPEN,
  ITEMSHOP_UI_SELECT_OFFER,
  ITEMSHOP_UI_SET_QUANTITY
} from '../src/stoneage_browser_state_controller.mjs';
import { ITEMSHOP_UI_STATE_FORMAT } from '../src/stoneage_browser_itemshop_ui_state.mjs';

const sourceRoot=process.argv[2]??'stoneage-source';
const generatedRoot=process.argv[3]??'/tmp/v371-world';
const worldPath=`${generatedRoot}/stoneage_world_npc_index.json`;
const shopPath=`${generatedRoot}/stoneage_npc_itemshop_runtime.json`;
const world=JSON.parse(fs.readFileSync(worldPath,'utf8'));
const shop=JSON.parse(fs.readFileSync(shopPath,'utf8'));
const itemMake=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));

assert.equal(world.fixedSource?.repository,'gavinlinasd/StoneAge');
assert.equal(world.fixedSource?.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.equal(shop.fixedSource?.repository,'gavinlinasd/StoneAge');
assert.equal(shop.fixedSource?.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.equal(itemMake.source?.repository,'gavinlinasd/StoneAge');
assert.equal(itemMake.source?.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');

const worldPointIndex=buildWorldNpcPointIndex(world);
assert.equal(worldPointIndex.ok,true);
const joined=buildWorldItemShopBindingIndex(world,shop);
assert.equal(joined.ok,true);
assert.equal(joined.counts.worldItemShopBindings,336);
assert.equal(joined.counts.resolvedBindings,335);
assert.equal(joined.counts.unresolvedBindings,1);
assert.equal(joined.counts.catalogShops,335);

const anomaly=joined.unresolved[0];
assert.equal(anomaly?.npcKey,'my/magicdou/daochang.create#8');
assert.equal(anomaly?.unresolvedReason,'itemshop-catalog-missing-for-world-npc');

const resolvedShop=Object.values(shop.shops??{}).find(row=>
  row?.sellOnly!==true && Array.isArray(row?.itemEntries) && row.itemEntries.length>0 &&
  row?.bornCorner && Number.isFinite(Number(row.bornCorner.x1)) && Number.isFinite(Number(row.bornCorner.y1))
);
assert.ok(resolvedShop,'production ItemShop with buy offer and point spawn required');
const sourceKey=String(resolvedShop.source?.create?.path??'').replace(/^gmsv\/data\/npc\//,'')+'#'+resolvedShop.source?.create?.blockIndex;
assert.equal(joined.byNpcKey?.[sourceKey]?.resolved,true);

const npcLocated=resolveWorldNpcAt(worldPointIndex.index,{
  floor:resolvedShop.floorId,
  x:resolvedShop.bornCorner.x1,
  y:resolvedShop.bornCorner.y1
});
assert.equal(npcLocated.ok,true);
assert.equal(npcLocated.npc.path,resolvedShop.source.create.path);
assert.equal(npcLocated.npc.blockIndex,resolvedShop.source.create.blockIndex);

const state=freshPersistentState({playerId:'v371-production'});
state.player.transmigration=0;
state.player.gold=sourcePlayerMaxGold(state)-1;
const player={
  floor:resolvedShop.floorId,
  x:Number(resolvedShop.bornCorner.x1),
  y:Number(resolvedShop.bornCorner.y1)+1,
  facingCell:[resolvedShop.floorId,Number(resolvedShop.bornCorner.x1),Number(resolvedShop.bornCorner.y1)]
};
const controller=createBrowserStateController({
  state,
  worldNpcIndex:world,
  itemShopCatalog:shop,
  itemMakeCatalog:itemMake,
  itemShopRuntimeOptions:{itemCapacity:28000,cursor:1,randInclusive:(a,b)=>a},
  interactionRule:'NPC_Util_charIsInFrontOfChar distance=1'
});

const opened=await controller.dispatch({type:ITEMSHOP_UI_OPEN,targetCell:[resolvedShop.floorId,Number(resolvedShop.bornCorner.x1),Number(resolvedShop.bornCorner.y1)],player});
assert.equal(opened.ok,true);
assert.equal(opened.handled,true);
assert.equal(opened.format,ITEMSHOP_UI_STATE_FORMAT);
assert.ok(opened.ui.open);
const offer=opened.ui.shop.offers.find(x=>x.resolved===true);
assert.ok(offer,'production ItemShop must expose at least one resolved offer');

const selected=await controller.dispatch({type:ITEMSHOP_UI_SELECT_OFFER,itemId:offer.itemId});
assert.equal(selected.ok,true);
assert.equal(selected.ui.selectedItemId,offer.itemId);

const changed=await controller.dispatch({type:ITEMSHOP_UI_SET_QUANTITY,quantity:1});
assert.equal(changed.ok,true);
assert.equal(changed.ui.quantity,1);
assert.equal(controller.getState().revision,0);

const bought=await controller.dispatch({
  type:ACTION_NPC_ITEMSHOP_BUY,
  targetCell:[resolvedShop.floorId,Number(resolvedShop.bornCorner.x1),Number(resolvedShop.bornCorner.y1)],
  player,
  itemId:offer.itemId,
  quantity:1,
  transactionId:'v371-production-buy'
});
assert.equal(bought.ok,true);
assert.equal(bought.handled,true);
assert.equal(bought.result.applied,true);
assert.equal(bought.result.itemId,offer.itemId);
assert.equal(bought.state.revision,1);
assert.equal(bought.state.inventory.playerItemSlots.slice(9).some(x=>x!=null),true);
assert.equal(bought.ui.status,'success');

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v371-production-itemshop-browser-ui-v1',
  fixedSource:'gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
  worldItemShopBindings:joined.counts.worldItemShopBindings,
  resolvedBindings:joined.counts.resolvedBindings,
  unresolvedBindings:joined.counts.unresolvedBindings,
  knownUnresolved:'my/magicdou/daochang.create#8',
  productionNpcResolved:true,
  uiOpenSelectionQuantity:true,
  buyDelegatedToExistingRuntime:true,
  persistentRevisionAfterBuy:1,
  productionCatalogBacked:true
},null,2));