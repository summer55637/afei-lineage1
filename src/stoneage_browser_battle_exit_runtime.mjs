const BROWSER_BATTLE_EXIT_PLAN_RUNTIME_FORMAT='stoneage-v421-browser-battle-exit-plan-v1';
const ACTION_BATTLE_EXIT_PLAN='BATTLE_EXIT_PLAN';
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const clone=v=>JSON.parse(JSON.stringify(v));
const intOr=(v,fallback=null)=>{if(v==null||String(v).trim()==='')return fallback;const n=Number(v);return Number.isFinite(n)?Math.trunc(n):fallback;};

function planBattleExit(context,state,{settlementComplete=false,petMailModeById=null}={}){
  if(!isObject(context)||!isObject(context.context))return {ok:false,handled:false,stage:'battle-exit-plan',reason:'battle-context-required'};
  const mode=String(context.context.mode??'').trim().toLowerCase();
  const sourceMode=intOr(context.context.sourceMode,null);
  if(mode!=='finish'&&sourceMode!==3)return {ok:false,handled:false,stage:'battle-exit-plan',reason:'battle-not-finished'};
  if(settlementComplete!==true)return {ok:false,handled:false,stage:'battle-exit-plan',reason:'settlement-complete-flag-required'};
  if(!isObject(state)||!isObject(state.pets)||!Array.isArray(state.pets.petBox))return {ok:false,handled:false,stage:'battle-exit-plan',reason:'persistent-pet-box-required'};

  const pets=[];
  for(const pet of state.pets.petBox){
    if(!isObject(pet))continue;
    const petId=String(pet.id??'').trim();
    if(!petId)continue;
    const hp=intOr(pet.hp,null);
    if(hp==null)continue;
    const declaredMailMode = petMailModeById && Object.prototype.hasOwnProperty.call(petMailModeById,petId)
      ? intOr(petMailModeById[petId],null)
      : intOr(pet.mailMode??null,null);
    if(hp<=0){
      if(declaredMailMode==null)return {ok:false,handled:false,stage:'battle-exit-plan',reason:'pet-mail-mode-required',petId};
      if(declaredMailMode!==0)continue;
      pets.push({petId,hpBefore:hp,hpAfter:1,mailMode:declaredMailMode});
    }
  }

  return {
    ok:true,handled:true,stage:'battle-exit-plan-ready',
    format:BROWSER_BATTLE_EXIT_PLAN_RUNTIME_FORMAT,
    action:ACTION_BATTLE_EXIT_PLAN,
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      function:'BATTLE_Exit',
      playerExitRule:'scan all owned Pet slots; skip CHAR_MAILMODE != CHAR_PETMAIL_NONE; dead Pet -> isDie=false and HP=1'
    },
    battleMode:mode||null,
    sourceMode,
    settlementComplete:true,
    pets,
    petMailModeSource:'explicit petMailModeById or persisted pet.mailMode; missing dead-Pet mail mode fails closed',
    petCountScanned:Array.isArray(state.pets.petBox)?state.pets.petBox.length:0,
    onlyDeadPetsMutated:true,
    activePetIdPreserved:true,
    alivePetHpPreserved:true,
    midBattleExitHeal:false,
    playerHpMutation:false,
    playerMpMutation:false,
    persistentStateMutation:false,
    battleContextMutation:false,
    rngPreserved:true,
    nextBoundary:'BATTLE_EXIT_COMMIT'
  };
}
function createBrowserBattleExitPlanRuntime(){return {ok:true,format:BROWSER_BATTLE_EXIT_PLAN_RUNTIME_FORMAT,plan:planBattleExit};}
export {BROWSER_BATTLE_EXIT_PLAN_RUNTIME_FORMAT,ACTION_BATTLE_EXIT_PLAN,planBattleExit,createBrowserBattleExitPlanRuntime};
