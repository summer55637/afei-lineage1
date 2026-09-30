const SHELL_FORMAT='stoneage-canonical-browser-shell-v1';
async function loadJson(path,fetchImpl=globalThis.fetch){
  const response=await fetchImpl(path);
  if(!response.ok)throw new Error('failed to load '+path+': '+response.status);
  return response.json();
}
function setText(document,id,value){const node=document.getElementById(id);if(node)node.textContent=String(value);}
async function bootCanonicalBrowserShell({document=globalThis.document,fetchImpl=globalThis.fetch}={}){
  if(!document)throw new Error('browser document required');
  const [controllerRuntime,persistent,closure,reachability,audit,compatibility,itemRewardCatalog,itemMakeCatalog,petCatalog]=await Promise.all([
    import('./stoneage_browser_state_controller.mjs'),
    import('./stoneage_persistent_state.mjs'),
    loadJson('data/generated/stoneage_new_player_event_closure.json',fetchImpl),
    loadJson('data/generated/stoneage_start_npc_reachability.json',fetchImpl),
    loadJson('data/generated/stoneage_world_npc_functionset_audit.json',fetchImpl),
    loadJson('data/generated/stoneage_changeevent_compatibility_reference.json',fetchImpl),
    loadJson('data/generated/stoneage_new_player_item_reward_runtime.json',fetchImpl),
    loadJson('data/generated/stoneage_item_make_runtime.json',fetchImpl),
    loadJson('data/generated/stoneage_new_player_pet_runtime.json',fetchImpl)
  ]);
  const row=reachability.rows.find(item=>item.template==='changeevent'&&item.floor===1006&&item.hometown===0);
  if(!row)throw new Error('1006 changeevent NPC row missing');
  setText(document,'shell-format',SHELL_FORMAT);
  setText(document,'source-template',closure.owner.templateName);
  setText(document,'source-status',closure.owner.runtimeModuleStatus);
  setText(document,'entry-count',document.querySelectorAll('html').length);
  const modeNode=document.getElementById('runtime-mode');
  const output=document.getElementById('probe-output');
  const button=document.getElementById('probe-button');
  async function runProbe(){
    const mode=String(modeNode?.value??'strict');
    const {createFirstRouteRewardHandlers}=await import('./stoneage_first_route_reward_handlers.mjs');
    const bundle=createFirstRouteRewardHandlers({
      itemRewardCatalog,itemMakeCatalog,petCatalog,
      petIdFactory:(state,pet)=>'browser-pet-'+pet.petId+'-'+state.pets.petBox.length,
      itemCapacity:1000,itemCursor:900,randInclusive:(a,b)=>a===b?a:0
    });
    if(!bundle.ok)throw new Error('first-route handler bundle failed');
    const state=persistent.freshPersistentState({playerId:'browser-'+mode});
    state.player.level=1;state.player.transmigration=0;state.player.charm=60;
    const controller=controllerRuntime.createBrowserStateController({
      state,moduleAudit:audit,compatibilityCatalog:compatibility,
      modules:{ExChangeMan:{script:closure.script,kind:'changeevent-compatible'}},
      handlerFactory:()=>bundle.handlers,
      runtimeConfig:{compatibilityMode:mode==='compatibility',allowExternalCompatibilityAliases:mode==='compatibility',defaultInteractionAction:'talk',sourceProfile:'fixed-c'},
      interactionRule:'NPC_Util_charIsInFrontOfChar distance=1'
    });
    const result=await controller.dispatch({type:controllerRuntime.ACTION_NPC_TALK,npc:row,player:{floor:1006,x:15,y:21,facingCell:[1006,15,22]},transactionId:'browser-'+mode+'-probe'});
    const summary=result.ok
      ? {mode,ok:true,handled:result.handled,stage:result.stage,revision:result.state.revision,items:result.state.inventory.playerItemSlots.filter(value=>value!==null).length,petCount:result.state.pets.petBox.length,end366:(result.state.events.endWords?.[11]??0)===16384,charm:result.state.player.charm,idempotent:result.idempotent===true}
      : {mode,ok:false,stage:result.stage,reason:result.reason};
    if(output)output.textContent=JSON.stringify(summary,null,2);
    return summary;
  }
  button?.addEventListener('click',()=>runProbe().catch(error=>{if(output)output.textContent=String(error?.stack??error);}));
  return {format:SHELL_FORMAT,sourceTemplate:closure.owner.templateName,sourceStatus:closure.owner.runtimeModuleStatus,runProbe};
}
export { SHELL_FORMAT, loadJson, bootCanonicalBrowserShell };
