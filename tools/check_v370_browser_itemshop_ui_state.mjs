#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  createBrowserStateController,
  ACTION_NPC_ITEMSHOP_BUY,
  ITEMSHOP_UI_OPEN,
  ITEMSHOP_UI_SELECT_OFFER,
  ITEMSHOP_UI_SET_QUANTITY,
  ITEMSHOP_UI_CLOSE
} from '../src/stoneage_browser_state_controller.mjs';
import { ITEMSHOP_UI_STATE_FORMAT } from '../src/stoneage_browser_itemshop_ui_state.mjs';

const catalog=JSON.parse(fs.readFileSync('tools/fixtures/npc-itemshop/catalog.json','utf8'));
const itemMakeCatalog=JSON.parse(fs.readFileSync('tools/fixtures/npc-itemshop/item-make.json','utf8'));
const npc={floor:1001,npc:[17,13],template:'npcgen_shop',path:'fixture.create',blockIndex:0,runtimeModuleStatus:'resolved'};
const player={floor:1001,x:17,y:14,facingCell:[1001,17,13]};
const state=freshPersistentState({playerId:'v370'});
state.player.gold=1000;
const controller=createBrowserStateController({state,itemShopCatalog:catalog,itemMakeCatalog,itemShopRuntimeOptions:{itemCapacity:1000,cursor:1,randInclusive:(a,b)=>a},interactionRule:'NPC_Util_charIsInFrontOfChar distance=1'});

const initial=controller.getItemShopUiState();
assert.equal(initial.format,ITEMSHOP_UI_STATE_FORMAT);
assert.equal(initial.open,false);
assert.equal(controller.getState().revision,0);

const opened=await controller.dispatch({type:ITEMSHOP_UI_OPEN,npc,player,shopId:'fixture.create#0'});
assert.equal(opened.ok,true);
assert.equal(opened.handled,true);
assert.equal(opened.stage,'shop-ui-open');
assert.equal(opened.ui.open,true);
assert.equal(opened.ui.shop.offers.length,5);
assert.equal(opened.ui.selectedItemId,42);
assert.equal(opened.ui.quantity,1);
assert.equal(controller.getState().revision,0);

const selected=await controller.dispatch({type:ITEMSHOP_UI_SELECT_OFFER,itemId:42});
assert.equal(selected.ok,true);
assert.equal(selected.handled,true);
assert.equal(selected.ui.selectedItemId,42);
assert.equal(controller.getState().revision,0);

const quantity=await controller.dispatch({type:ITEMSHOP_UI_SET_QUANTITY,quantity:2});
assert.equal(quantity.ok,true);
assert.equal(quantity.ui.quantity,2);
assert.equal(controller.getState().revision,0);

const bought=await controller.dispatch({type:ACTION_NPC_ITEMSHOP_BUY,npc,player,shopId:'fixture.create#0',transactionId:'v370-buy-ui'});
assert.equal(bought.ok,true);
assert.equal(bought.state.player.gold,800);
assert.equal(bought.result.quantity,2);
assert.equal(bought.result.itemId,42);
assert.equal(bought.ui.status,'success');
assert.equal(bought.ui.lastResult.total,200);
assert.equal(controller.getState().revision,1);

const badSelect=await controller.dispatch({type:ITEMSHOP_UI_SELECT_OFFER,itemId:999});
assert.equal(badSelect.ok,false);
assert.equal(badSelect.reason,'itemshop-ui-offer-missing');
assert.equal(controller.getState().revision,1);

const badQuantity=await controller.dispatch({type:ITEMSHOP_UI_SET_QUANTITY,quantity:0});
assert.equal(badQuantity.ok,false);
assert.equal(badQuantity.reason,'itemshop-ui-quantity-positive-required');
assert.equal(controller.getState().revision,1);

const closed=await controller.dispatch({type:ITEMSHOP_UI_CLOSE});
assert.equal(closed.ok,true);
assert.equal(closed.handled,true);
assert.equal(closed.ui.open,false);
assert.equal(closed.ui.shop,null);
assert.equal(controller.getState().revision,1);

const closedQuantity=await controller.dispatch({type:ITEMSHOP_UI_SET_QUANTITY,quantity:2});
assert.equal(closedQuantity.ok,false);
assert.equal(closedQuantity.reason,'itemshop-ui-not-open');
assert.equal(controller.getState().revision,1);

console.log(JSON.stringify({pass:true,format:ITEMSHOP_UI_STATE_FORMAT,openOffers:5,selectionAndQuantityAreEphemeral:true,buyDelegatedToExistingRuntime:true,persistentRevisionAfterUiFlow:1,resultPrompt:true,closeIsReadOnly:true},null,2));
