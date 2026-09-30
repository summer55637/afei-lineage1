#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { parseAndValidateSaveEnvelope } from '../src/stoneage_save_transaction.mjs';
import { createFirstRouteRewardHandlers } from '../src/stoneage_first_route_reward_handlers.mjs';
import { createBrowserStateController, BROWSER_STATE_CONTROLLER_FORMAT, ACTION_NPC_TALK } from '../src/stoneage_browser_state_controller.mjs';

const reachability=JSON.parse(fs.readFileSync('data/generated/stoneage_start_npc_reachability.json','utf8'));
const closure=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_event_closure.json','utf8'));
const audit=JSON.parse(fs.readFileSync('data/generated/stoneage_world_npc_functionset_audit.json','utf8'));
const compatibility=JSON.parse(fs.readFileSync('data/generated/stoneage_changeevent_compatibility_reference.json','utf8'));
const itemRewardCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_item_reward_runtime.json','utf8'));
const itemMakeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));
const petCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_pet_runtime.json','utf8'));
const changeeventRows=reachability.rows.filter(r=>r.template==='changeevent'&&r.npcPath==='gmsv/data/npc/almark/xinshou/xinshou.create'&&r.blockIndex>=0&&r.blockIndex<=3);
assert.equal(changeeventRows.length,4);

const bundle=createFirstRouteRewardHandlers({
  itemRewardCatalog,itemMakeCatalog,petCatalog,
  petIdFactory:(st,created)=>'pet-'+created.petId+'-'+st.pets.petBox.length,
  itemCapacity:1000,itemCursor:100,randInclusive:(a,b)=>a===b?a:0
});
assert.equal(bundle.ok,true);

const strict=createBrowserStateController({
  state:freshPersistentState({playerId:'browser-strict'}),
  moduleAudit:audit,
  compatibilityCatalog:compatibility,
  modules:{ExChangeMan:{script:closure.script,kind:'changeevent-compatible'}},
  handlerFactory:()=>bundle.handlers,
  runtimeConfig:{compatibilityMode:false,allowExternalCompatibilityAliases:true},
  interactionRule:'NPC_Util_charIsInFrontOfChar distance=1'
});
assert.equal(strict.format,BROWSER_STATE_CONTROLLER_FORMAT);
const strictBefore=strict.getState();
const strictResult=await strict.dispatch({type:ACTION_NPC_TALK,npc:changeeventRows[2],player:{floor:1006,x:15,y:21,facingCell:[1006,15,22]},transactionId:'strict-controller-1'});
assert.equal(strictResult.ok,true);
assert.equal(strictResult.handled,false);
assert.equal(strictResult.stage,'module-resolution');
assert.deepEqual(strict.getState(),strictBefore);

const compatibilityControllers=[];
for(let i=0;i<changeeventRows.length;i++){
  const row=changeeventRows[i];
  const floor=row.floor; const npcX=row.npc[0]; const npcY=row.npc[1];
  const state=freshPersistentState({playerId:'browser-compat-'+floor});
  state.player.level=1; state.player.transmigration=0; state.player.charm=60;
  const controller=createBrowserStateController({
    state,moduleAudit:audit,compatibilityCatalog:compatibility,
    modules:{ExChangeMan:{script:closure.script,kind:'changeevent-compatible'}},
    handlerFactory:()=>bundle.handlers,
    runtimeConfig:{compatibilityMode:true,allowExternalCompatibilityAliases:true,defaultInteractionAction:'talk',sourceProfile:'fixed-c'},
    interactionRule:'NPC_Util_charIsInFrontOfChar distance=1',
    transactionPrefix:'compat-'+floor
  });
  const result=await controller.dispatch({
    type:ACTION_NPC_TALK,
    npc:row,
    player:{floor,x:npcX,y:npcY-1,facingCell:[floor,npcX,npcY]},
    now:()=> '2026-09-30T12:00:00.000Z'
  });
  assert.equal(result.ok,true);
  assert.equal(result.handled,true);
  assert.equal(result.execution.applied,true);
  assert.equal(result.execution.save.envelope.revision,1);
  assert.equal(result.state.player.charm,60);
  assert.equal(result.state.pets.petBox.length,1);
  assert.equal(result.state.pets.petBox[0].enemyId,341);
  assert.equal(result.state.pets.petBox[0].petId,274);
  assert.equal(result.state.events.endWords[11],16384);
  assert.equal(result.state.inventory.playerItemSlots.filter(v=>v!==null).length,4);
  const loaded=await parseAndValidateSaveEnvelope(result.execution.save.envelope,{now:()=> '2026-09-30T12:01:00.000Z'});
  assert.equal(loaded.ok,true);
  assert.equal(loaded.state.revision,1);
  assert.equal(loaded.state.events.endWords[11],16384);
  assert.equal(loaded.state.pets.petBox[0].petId,274);
  compatibilityControllers.push({floor,name:row.elder,revision:result.state.revision});
}

const denied=createBrowserStateController({
  state:freshPersistentState({playerId:'browser-denied'}),
  moduleAudit:audit,compatibilityCatalog:compatibility,
  modules:{ExChangeMan:{script:closure.script,kind:'changeevent-compatible'}},
  handlerFactory:()=>bundle.handlers,
  runtimeConfig:{compatibilityMode:true,allowExternalCompatibilityAliases:false}
});
const deniedResult=await denied.dispatch({type:ACTION_NPC_TALK,npc:changeeventRows[2],player:{floor:1006,x:15,y:21,facingCell:[1006,15,22]},transactionId:'denied-1'});
assert.equal(deniedResult.ok,false);
assert.equal(deniedResult.stage,'runtime-config');
assert.equal(denied.getState().revision,0);

console.log(JSON.stringify({
  pass:true,format:BROWSER_STATE_CONTROLLER_FORMAT,strictDefaultBlocked:true,compatibilityOptIn:true,
  fourHometowns:compatibilityControllers,allSavedRevision1:true,reloadParity:true,partialOptInRejected:true
}));
