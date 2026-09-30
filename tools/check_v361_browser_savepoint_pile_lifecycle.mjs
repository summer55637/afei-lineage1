#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_NPC_SAVEPOINT_SET,
  BROWSER_SAVEPOINT_RUNTIME_FORMAT,
  consumeSavePointItems,
  createBrowserSavePointRuntime,
  selectSavePointItemRequirement
} from '../src/stoneage_browser_savepoint_runtime.mjs';

const fixedSource={repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56'};
const moduleAudit={format:'stoneage-world-npc-functionset-audit-v1',fixedSource,sourceFunctionSets:['SavePoint']};
const npc={floor:1000,npc:[10,10],path:'genout/sp.create',blockIndex:0,template:'npcgen_savepoint',functionSet:'SavePoint'};
const player={floor:1000,x:10,y:11,facingCell:[1000,10,10]};
const runtime=createBrowserSavePointRuntime({moduleAudit});
assert.equal(runtime.ok,true);
assert.equal(runtime.format,BROWSER_SAVEPOINT_RUNTIME_FORMAT);

const itemBinding={elderId:4,born:{floorId:1000,x:92,y:99},mode:'item-required',sourceKey:'genout/sp.create#0',getItem:'1930*1',itemRequirements:[[{itemId:1930,count:1}]]};
const state=freshPersistentState();
state.inventory.playerItemSlots[9]=101;
state.inventory.itemRuntime.slots['101']={use:true,itemId:1930,owner:'player',pile:5,data:[1930]};
state.inventory.piles['1930']=5;

const set=runtime.dispatch(state,{type:ACTION_NPC_SAVEPOINT_SET,npc,player,sourceBinding:itemBinding});
assert.equal(set.ok,false);
assert.equal(set.reason,'savepoint-confirmation-required');
assert.equal(set.itemRequirement.selectedSlots[0],9);
assert.equal(state.inventory.playerItemSlots[9],101);
assert.equal(state.inventory.itemRuntime.slots['101'].pile,5);

const confirmed=runtime.dispatch(state,{type:ACTION_NPC_SAVEPOINT_CONFIRM,npc,player,sourceBinding:itemBinding});
assert.equal(confirmed.ok,true);
assert.deepEqual(confirmed.consumedItems,[{slot:9,existingIndex:101,itemId:1930,previousPile:5,remainingPile:4,removed:false}]);
assert.equal(confirmed.state.inventory.playerItemSlots[9],101);
assert.equal(confirmed.state.inventory.itemRuntime.slots['101'].pile,4);
assert.equal(confirmed.state.inventory.piles['1930'],4);
assert.equal(confirmed.state.world.savePoint.elderId,4);

const oneObjectPile99=freshPersistentState();
oneObjectPile99.inventory.playerItemSlots[9]=201;
oneObjectPile99.inventory.itemRuntime.slots['201']={use:true,itemId:1930,owner:'player',pile:99,data:[1930]};
const twoRequired=selectSavePointItemRequirement(oneObjectPile99,{itemRequirements:[[{itemId:1930,count:2}]]});
assert.equal(twoRequired.ok,false);
assert.equal(twoRequired.reason,'savepoint-item-requirement-not-met');

oneObjectPile99.inventory.playerItemSlots[10]=202;
oneObjectPile99.inventory.itemRuntime.slots['202']={use:true,itemId:1930,owner:'player',pile:1,data:[1930]};
const twoObjects=selectSavePointItemRequirement(oneObjectPile99,{itemRequirements:[[{itemId:1930,count:2}]]});
assert.equal(twoObjects.ok,true);
assert.deepEqual(twoObjects.selectedSlots,[9,10]);

const multi=freshPersistentState();
multi.inventory.playerItemSlots[9]=301;
multi.inventory.playerItemSlots[10]=302;
multi.inventory.itemRuntime.slots['301']={use:true,itemId:1931,owner:'player',pile:2,data:[1931]};
multi.inventory.itemRuntime.slots['302']={use:true,itemId:1931,owner:'player',pile:1,data:[1931]};
multi.inventory.piles['1931']=3;
const multiConsumed=consumeSavePointItems(multi,{selectedSlots:[9,10]});
assert.equal(multiConsumed.ok,true);
assert.deepEqual(multiConsumed.consumed,[
  {slot:9,existingIndex:301,itemId:1931,previousPile:2,remainingPile:1,removed:false},
  {slot:10,existingIndex:302,itemId:1931,previousPile:1,remainingPile:0,removed:true}
]);
assert.equal(multiConsumed.state.inventory.playerItemSlots[9],301);
assert.equal(multiConsumed.state.inventory.itemRuntime.slots['301'].pile,1);
assert.equal(multiConsumed.state.inventory.playerItemSlots[10],null);
assert.equal(multiConsumed.state.inventory.itemRuntime.slots['302'],undefined);
assert.equal(multiConsumed.state.inventory.piles['1931'],1);

const invalid=freshPersistentState();
invalid.inventory.playerItemSlots[9]=401;
invalid.inventory.playerItemSlots[10]=402;
invalid.inventory.itemRuntime.slots['401']={use:true,itemId:1932,owner:'player',pile:2,data:[1932]};
invalid.inventory.itemRuntime.slots['402']={use:true,itemId:1932,owner:'player',pile:0,data:[1932]};
invalid.inventory.piles['1932']=2;
const invalidResult=consumeSavePointItems(invalid,{selectedSlots:[9,10]});
assert.equal(invalidResult.ok,false);
assert.equal(invalidResult.reason,'savepoint-item-selection-pile-invalid');
assert.equal(invalid.inventory.itemRuntime.slots['401'].pile,2);
assert.equal(invalid.inventory.itemRuntime.slots['402'].pile,0);
assert.equal(invalid.inventory.piles['1932'],2);

const gone=freshPersistentState();
gone.inventory.playerItemSlots[9]=501;
gone.inventory.itemRuntime.slots['501']={use:true,itemId:1933,owner:'player',pile:1,data:[1933]};
gone.inventory.piles['1933']=1;
const one=consumeSavePointItems(gone,{selectedSlots:[9]});
assert.equal(one.ok,true);
assert.equal(one.state.inventory.playerItemSlots[9],null);
assert.equal(one.state.inventory.itemRuntime.slots['501'],undefined);
assert.equal(one.state.inventory.piles['1933'],undefined);

const repeat=runtime.dispatch(confirmed.state,{type:ACTION_NPC_SAVEPOINT_SET,npc,player,sourceBinding:itemBinding});
assert.equal(repeat.ok,true);
assert.equal(repeat.state.inventory.itemRuntime.slots['101'].pile,4);

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_SAVEPOINT_RUNTIME_FORMAT,
  fixedSource,
  checks:[
    '_ITEM_PILENUMS source-enabled lifecycle',
    'CHAR_DelItem consumes one pile unit',
    'pile>1 preserves item object and slot',
    'pile=1 removes item object and slot',
    'aggregate pile mirror decrements by one',
    'GetItem count remains distinct item-object count',
    'multi-item preflight prevents partial mutation',
    'unlocked elder repeat remains no-item'
  ]
}));
