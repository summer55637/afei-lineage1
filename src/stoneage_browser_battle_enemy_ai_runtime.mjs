const BROWSER_BATTLE_ENEMY_AI_RUNTIME_FORMAT='stoneage-v428-browser-battle-enemy-ai-v1';
const ACTION_BATTLE_ENEMY_AI_APPLY='BATTLE_ENEMY_AI_APPLY';
const BATTLE_MODE_BATTLE=2;
const BATTLE_S_TYPE_ENEMY=1;
const BATTLE_CHARMODE_C_WAIT=2;
const BATTLE_CHARMODE_C_OK=3;
const BATTLE_CHARMODE_RESCUE=5;
const BATTLE_COM_NONE=0;
const BATTLE_COM_ATTACK=1;
const BATTLE_COM_GUARD=2;
const BATTLE_COM_ESCAPE=4;
const BATTLE_COM_S_CHARGE=1005;
const BATTLE_COM_S_EARTHROUND0=1009;
const BATTLE_COM_S_EARTHROUND1=1010;
const BATTLE_ENEMY_AI_CHARGE_COMMANDS=Object.freeze([BATTLE_COM_S_CHARGE,BATTLE_COM_S_EARTHROUND0,BATTLE_COM_S_EARTHROUND1]);
const BATTLE_ENEMY_AI_CANNOT_MOVE_STATUSES=Object.freeze(['paralysis','stone','sleep','barrier']);
const BATTLE_AI_TARGET_TYPE_LEADER=4;
const BATTLE_AI_SELECT_HP_MAX=2;
const BATTLE_AI_SELECT_HP_MIN=3;
const BATTLE_AI_SELECT_STR_MAX=4;
const BATTLE_AI_SELECT_DEX_MAX=5;
const BATTLE_AI_SELECT_DEX_MIN=6;
const BATTLE_AI_SELECT_ATT_SUBDUE=7;
const BSIDE_FLG_SURPRISE=1;
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

const clone=value=>JSON.parse(JSON.stringify(value));
const int=value=>{if(value==null||String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)&&Number.isInteger(n)?n:null;};
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const weight=(ai,key)=>{const n=int(ai?.[key]??0);return n!=null&&n>=0?n:null;};

function readEnemyStatusValue(entry,key){
  for(const source of [entry?.battleStatus,entry?.status,entry]){
    if(source&&Object.prototype.hasOwnProperty.call(source,key)){
      const n=int(source[key]);
      return n==null?0:n;
    }
  }
  return 0;
}
function enemyCannotMove(entry){
  return BATTLE_ENEMY_AI_CANNOT_MOVE_STATUSES.filter(key=>readEnemyStatusValue(entry,key)>0);
}
function findEntryByBid(context,bid){
  const b=int(bid);if(b==null||b<0||b>19)return null;
  const side=b>=10?1:0,slot=b>=10?b-10:b;
  const row=context?.context?.sides?.find(x=>int(x?.side)===side);
  return Array.isArray(row?.entries)?row.entries[slot]??null:null;
}
function weightsOf(ai){
  const direct=['attackWeight','guardWeight','magicWeight','escapeWeight'].map(key=>weight(ai,key));
  const skills=Array.isArray(ai?.skillWeights)?ai.skillWeights.map(int):Array(7).fill(0);
  if(direct.some(x=>x==null)||skills.length!==7||skills.some(x=>x==null||x<0))return {ok:false,reason:'enemy-ai-weights-invalid'};
  return {ok:true,attack:direct[0],guard:direct[1],magic:direct[2],escape:direct[3],skills,total:direct.reduce((a,b)=>a+b,0)+skills.reduce((a,b)=>a+b,0)};
}
function nextRoll(values,cursor,min,max,label){
  if(!Array.isArray(values))return {ok:false,reason:label+'-roll-array-required',consumed:cursor};
  const roll=int(values[cursor]);
  if(roll==null||roll<min||roll>max)return {ok:false,reason:label+'-rng-required-or-out-of-range',roll,min,max,consumed:cursor};
  return {ok:true,roll,cursor:cursor+1};
}
function selectAction(w,roll){
  if(w.total<=0)return {ok:false,reason:'enemy-ai-no-action-weight'};
  if(roll<0||roll>=w.total)return {ok:false,reason:'enemy-ai-action-roll-out-of-range',roll,total:w.total};
  let cursor=0;
  if(w.attack>0&&roll<cursor+w.attack)return {ok:true,action:'attack',commandCode:BATTLE_COM_ATTACK,total:w.total};
  cursor+=w.attack;
  if(w.guard>0&&roll<cursor+w.guard)return {ok:true,action:'guard',commandCode:BATTLE_COM_GUARD,total:w.total};
  cursor+=w.guard;
  if(w.magic>0&&roll<cursor+w.magic)return {ok:false,reason:'enemy-ai-magic-runtime-required',roll,total:w.total};
  cursor+=w.magic;
  if(w.escape>0&&roll<cursor+w.escape)return {ok:true,action:'escape',commandCode:BATTLE_COM_ESCAPE,total:w.total};
  cursor+=w.escape;
  for(let i=0;i<w.skills.length;i++){
    if(w.skills[i]>0&&roll<cursor+w.skills[i])return {ok:true,action:'petskill',skillSlot:i,total:w.total};
    cursor+=w.skills[i];
  }
  return {ok:false,reason:'enemy-ai-action-selection-unresolved',roll,total:w.total};
}
function candidatesForTarget(context,opposingSide,targetType,targetRolls,targetCursor){
  const side=context.context.sides.find(x=>int(x?.side)===opposingSide);
  const entries=Array.isArray(side?.entries)?side.entries:[];
  let candidates=[];
  let cursor=targetCursor;
  const filterRolls=[];
  const valid=entry=>entry&&entry.isDie!==true&&int(entry.sourceBattleCharMode)!==BATTLE_CHARMODE_RESCUE;
  const allCandidates=()=>entries.map((entry,slot)=>({entry,slot})).filter(x=>valid(x.entry)).map(({entry,slot})=>({
    bid:int(entry.bid)??opposingSide*10+slot,slot,sourceType:String(entry.sourceType??'').toLowerCase()||null,
    hp:int(entry.hp),entry
  }));
  if(targetType===2||targetType===3){
    candidates=entries.map((entry,slot)=>({entry,slot})).filter(({entry})=>{
      if(!valid(entry))return false;
      const sourceType=String(entry.sourceType??'').toLowerCase();
      return targetType===2?sourceType==='player':sourceType==='pet';
    }).map(({entry,slot})=>({bid:int(entry.bid)??opposingSide*10+slot,slot,sourceType:String(entry.sourceType??'').toLowerCase()||null,hp:int(entry.hp),entry}));
  }else if(targetType===BATTLE_AI_TARGET_TYPE_LEADER){
    for(let slot=0;slot<entries.length;slot++){
      const entry=entries[slot];if(!valid(entry))continue;
      const isLeader=int(entry.sourcePartyMode??entry.partyMode)===1;
      if(isLeader){
        candidates.push({bid:int(entry.bid)??opposingSide*10+slot,slot,sourceType:String(entry.sourceType??'').toLowerCase()||null,hp:int(entry.hp),entry});
      }else{
        const selected=nextRoll(targetRolls,cursor,0,2,'enemy-ai-leader-filter');
        if(!selected.ok)return {...selected,cursor,filterRolls,reason:'enemy-ai-leader-filter-rng-required-or-out-of-range'};
        cursor=selected.cursor;filterRolls.push({slot,roll:selected.roll});
        if(selected.roll===0)candidates.push({bid:int(entry.bid)??opposingSide*10+slot,slot,sourceType:String(entry.sourceType??'').toLowerCase()||null,hp:int(entry.hp),entry});
      }
    }
  }else{
    // Fixed-C's switch default treats target type 0 and unknown values as ALL.
    candidates=allCandidates();
  }
  let fallbackToAll=false;
  if(candidates.length===0&&(targetType===2||targetType===3||targetType===BATTLE_AI_TARGET_TYPE_LEADER)){
    candidates=allCandidates();
    fallbackToAll=true;
  }
  return {ok:true,candidates,cursor,filterRolls,fallbackToAll};
}
function numericTargetValue(entry,key){
  const raw=entry?.sourceAiTargetStats?.[key]??entry?.aiTargetStats?.[key]??entry?.stats?.[key]??entry?.sourceCoreStats?.stats?.[key]??entry?.coreStats?.stats?.[key];
  if(raw==null||String(raw).trim()==='')return null;
  const value=Number(raw);return Number.isFinite(value)?value:null;
}
function elementalTargetValue(entry,key){
  const raw=entry?.sourceAiElements?.[key]??entry?.aiElements?.[key]??entry?.elements?.[key]??entry?.sourceCoreStats?.sourceTemplate?.element?.[key]??entry?.coreStats?.sourceTemplate?.element?.[key];
  if(raw==null||String(raw).trim()==='')return null;
  const value=Number(raw);return Number.isFinite(value)?value:null;
}
function subdueTargetElement(actor){
  const e=elementalTargetValue(actor,'earth');
  const w=elementalTargetValue(actor,'water');
  const f=elementalTargetValue(actor,'fire');
  const a=elementalTargetValue(actor,'wind');
  if([e,w,f,a].some(v=>v==null))return {ok:false,reason:'enemy-ai-subdue-actor-elements-required'};
  // Exact fixed-C GetSubdueAttribute() comparison tree; result is the element to compare on targets.
  const element=((e>f)?((w>a)?((e>w)?2:3):((e>a)?2:1)):((w>a)?((f>w)?4:3):((f>a)?4:1)));
  return {ok:true,element,key:({1:'earth',2:'water',3:'fire',4:'wind'})[element]};
}
function chooseByValue(candidates,selector,actor){
  const values=[];
  let elementKey=null;
  if(selector===BATTLE_AI_SELECT_ATT_SUBDUE){
    const subdue=subdueTargetElement(actor);if(!subdue.ok)return subdue;
    elementKey=subdue.key;
  }
  for(const candidate of candidates){
    let value;
    if(selector===BATTLE_AI_SELECT_HP_MAX||selector===BATTLE_AI_SELECT_HP_MIN)value=candidate.hp;
    else if(selector===BATTLE_AI_SELECT_STR_MAX)value=numericTargetValue(candidate.entry,'str');
    else if(selector===BATTLE_AI_SELECT_DEX_MAX||selector===BATTLE_AI_SELECT_DEX_MIN)value=numericTargetValue(candidate.entry,'dex');
    else value=elementalTargetValue(candidate.entry,elementKey);
    if(value==null)return {ok:false,reason:selector===BATTLE_AI_SELECT_HP_MAX||selector===BATTLE_AI_SELECT_HP_MIN?'enemy-ai-target-hp-required':selector===BATTLE_AI_SELECT_ATT_SUBDUE?'enemy-ai-target-elements-required':'enemy-ai-target-stats-required',slot:candidate.slot,selector};
    values.push(value);
  }
  let selectedIndex=0;
  for(let i=1;i<values.length;i++){
    const maximize=selector===BATTLE_AI_SELECT_HP_MAX||selector===BATTLE_AI_SELECT_STR_MAX||selector===BATTLE_AI_SELECT_DEX_MAX||selector===BATTLE_AI_SELECT_ATT_SUBDUE;
    if((maximize&&values[i]>values[selectedIndex])||(!maximize&&values[i]<values[selectedIndex]))selectedIndex=i;
  }
  return {ok:true,candidate:candidates[selectedIndex],selectedIndex,selectedValue:values[selectedIndex],elementKey};
}
function selectTargetCandidate(candidates,selectMode,ai,actor,targetRolls,targetCursor){
  if(selectMode===1){
    const selected=nextRoll(targetRolls,targetCursor,0,candidates.length-1,'enemy-ai-target');
    if(!selected.ok)return selected;
    return {ok:true,candidate:candidates[selected.roll],targetRoll:selected.roll,targetSelectorRoll:null,cursor:selected.cursor,selection:'random'};
  }
  if(selectMode>=BATTLE_AI_SELECT_HP_MAX&&selectMode<=BATTLE_AI_SELECT_ATT_SUBDUE){
    const top=chooseByValue(candidates,selectMode,actor);
    if(!top.ok)return top;
    const rn=int(ai?.targetRollRange??1);
    if(rn==null||rn<0)return {ok:false,reason:'enemy-ai-target-roll-range-invalid',targetRollRange:ai?.targetRollRange};
    const selectorRoll=nextRoll(targetRolls,targetCursor,0,rn,'enemy-ai-target-selector');
    if(!selectorRoll.ok)return selectorRoll;
    if(selectorRoll.roll===0){
      const random=nextRoll(targetRolls,selectorRoll.cursor,0,candidates.length-1,'enemy-ai-target');
      if(!random.ok)return {...random,targetSelectorRoll:selectorRoll.roll};
      return {ok:true,candidate:candidates[random.roll],targetRoll:random.roll,targetSelectorRoll:selectorRoll.roll,cursor:random.cursor,selection:'random-override',selectedValue:top.selectedValue,elementKey:top.elementKey};
    }
    return {ok:true,candidate:top.candidate,targetRoll:null,targetSelectorRoll:selectorRoll.roll,cursor:selectorRoll.cursor,selection:'top',selectedValue:top.selectedValue,elementKey:top.elementKey};
  }
  return {ok:false,reason:'enemy-ai-target-select-mode-not-supported',selectMode};
}
function planEnemyAiCommands(context,{actionRolls=[],targetRolls=[]}={}){
  if(!isObject(context)||!isObject(context.context))return {ok:false,handled:false,stage:'battle-enemy-ai-plan',reason:'battle-context-required'};
  if(String(context.context.mode??'').trim().toLowerCase()!=='battle'||int(context.context.sourceMode)!==BATTLE_MODE_BATTLE)return {ok:false,handled:false,stage:'battle-enemy-ai-plan',reason:'battle-active-phase-required'};
  if(!Array.isArray(context.context.sides)||context.context.sides.length!==2)return {ok:false,handled:false,stage:'battle-enemy-ai-plan',reason:'battle-context-sides-invalid'};
  if(!Array.isArray(actionRolls)||!Array.isArray(targetRolls))return {ok:false,handled:false,stage:'battle-enemy-ai-plan',reason:'enemy-ai-roll-arrays-required'};
  let actionCursor=0,targetCursor=0;
  const commands=[];
  const sides=context.context.sides.slice().sort((a,b)=>(int(a.side)??0)-(int(b.side)??0));
  for(const side of sides){
    if(int(side?.type)!==BATTLE_S_TYPE_ENEMY)continue;
    const sideNo=int(side.side);
    if(sideNo==null)return {ok:false,handled:false,stage:'battle-enemy-ai-plan',reason:'enemy-ai-side-id-invalid'};
    const surprised=((int(side.flg)??0)&BSIDE_FLG_SURPRISE)!==0;
    const entries=Array.isArray(side.entries)?side.entries:[];
    for(let slot=0;slot<entries.length;slot++){
      const actor=entries[slot];
      if(!actor||String(actor.sourceType??'').toLowerCase()!=='enemy')continue;
      const charMode=int(actor.sourceBattleCharMode);
      if(charMode===BATTLE_CHARMODE_C_OK||charMode!==BATTLE_CHARMODE_C_WAIT)continue;
      const before={sourceBattleCharMode:charMode,battleCommands:Array.isArray(actor.battleCommands)?actor.battleCommands.slice():[-1,-1,-1]};
      const existingCommand=int(actor.battleCommands?.[0]);
      if(BATTLE_ENEMY_AI_CHARGE_COMMANDS.includes(existingCommand)){
        commands.push({actorBid:int(actor.bid)??sideNo*10+slot,side:sideNo,slot,
          action:'charge-retained',commandCode:existingCommand,
          targetBid:int(actor.battleCommands?.[1])??-1,preserveCommand:true,
          before,actionRoll:null,targetRoll:null});
        continue;
      }
      if(surprised){
        commands.push({actorBid:int(actor.bid)??sideNo*10+slot,side:sideNo,slot,action:'surprised-none',commandCode:BATTLE_COM_NONE,targetBid:-1,before,actionRoll:null,targetRoll:null});
        continue;
      }
      const ai=actor.sourceEnemyAi;
      if(!isObject(ai)||ai.format!=='stoneage-enemy-ai-source-v1')return {ok:false,handled:false,stage:'battle-enemy-ai-plan',reason:'enemy-ai-source-profile-required',actorBid:int(actor.bid)};
      const weights=weightsOf(ai);
      if(!weights.ok)return {...weights,handled:false,stage:'battle-enemy-ai-plan',actorBid:int(actor.bid)};
      if(weights.total<=0)return {ok:false,handled:false,stage:'battle-enemy-ai-plan',reason:'enemy-ai-no-action-weight',actorBid:int(actor.bid)};
      const actionResult=nextRoll(actionRolls,actionCursor,0,weights.total-1,'enemy-ai-action');
      if(!actionResult.ok)return {...actionResult,handled:false,stage:'battle-enemy-ai-plan',actorBid:int(actor.bid),totalWeight:weights.total};
      actionCursor=actionResult.cursor;
      const chosen=selectAction(weights,actionResult.roll);
      if(!chosen.ok)return {...chosen,handled:false,stage:'battle-enemy-ai-plan',actorBid:int(actor.bid),actionRoll:actionResult.roll};
      let targetBid=-1,targetRoll=null,targetSelectorRoll=null,targetSelectionMode=null,targetElementKey=null;
      let resolvedAction=chosen.action;
      let resolvedCommandCode=chosen.commandCode??BATTLE_COM_NONE;
      let sourceAiSkillId=null;
      if(chosen.action==='attack'||chosen.action==='petskill'){
        const targetSelection=candidatesForTarget(context,1-sideNo,int(ai.targetType),targetRolls,targetCursor);
        if(!targetSelection.ok)return {...targetSelection,handled:false,stage:'battle-enemy-ai-plan',actorBid:int(actor.bid)};
        targetCursor=targetSelection.cursor;
        if(targetSelection.candidates.length===0)return {ok:false,handled:false,stage:'battle-enemy-ai-plan',reason:'enemy-ai-no-valid-targets',actorBid:int(actor.bid),targetType:int(ai.targetType),rngConsumed:{action:actionCursor,target:targetCursor,total:actionCursor+targetCursor}};
        const selected=selectTargetCandidate(targetSelection.candidates,int(ai.selectMode),ai,actor,targetRolls,targetCursor);
        if(!selected.ok)return {...selected,handled:false,stage:'battle-enemy-ai-plan',actorBid:int(actor.bid),candidateCount:targetSelection.candidates.length};
        targetCursor=selected.cursor;targetRoll=selected.targetRoll;targetSelectorRoll=selected.targetSelectorRoll;targetSelectionMode=selected.selection;targetElementKey=selected.elementKey??null;targetBid=selected.candidate.bid;
        if(chosen.action==='petskill'){
          sourceAiSkillId=int(actor.sourceEnemyPetSkills?.[chosen.skillSlot]);
          if(sourceAiSkillId==null)return {ok:false,handled:false,stage:'battle-enemy-ai-plan',reason:'enemy-ai-petskill-id-required',actorBid:int(actor.bid),skillSlot:chosen.skillSlot,rngConsumed:{action:actionCursor,target:targetCursor,total:actionCursor+targetCursor}};
          if(sourceAiSkillId!==0)return {ok:false,handled:false,stage:'battle-enemy-ai-plan',reason:'enemy-ai-petskill-runtime-required',actorBid:int(actor.bid),skillSlot:chosen.skillSlot,skillId:sourceAiSkillId,targetBid,actionRoll:actionResult.roll,targetRoll,targetSelectorRoll,rngConsumed:{action:actionCursor,target:targetCursor,total:actionCursor+targetCursor}};
          resolvedAction='petskill-none';
          resolvedCommandCode=BATTLE_COM_NONE;
        }
      }
      const blockedOn=enemyCannotMove(actor);
      const cannotMove=blockedOn.length>0;
      commands.push({actorBid:int(actor.bid)??sideNo*10+slot,side:sideNo,slot,
        action:cannotMove?'none':resolvedAction,selectedAction:chosen.action,
        commandCode:cannotMove?BATTLE_COM_NONE:resolvedCommandCode,targetBid,
        ...(chosen.action==='petskill'?{sourceAiPickedSkill:true,skillSlot:chosen.skillSlot,skillId:sourceAiSkillId}:{}),
        moveBlockedOn:blockedOn,actionRoll:actionResult.roll,targetRoll,targetSelectorRoll,targetSelectionMode,targetElementKey,before});
    }
  }
  if(commands.length===0)return {ok:false,handled:false,stage:'battle-enemy-ai-plan',reason:'enemy-ai-no-waiting-entries'};
  if(actionCursor!==actionRolls.length)return {ok:false,handled:false,stage:'battle-enemy-ai-plan',reason:'enemy-ai-action-roll-count-mismatch',expected:actionCursor,actual:actionRolls.length};
  if(targetCursor!==targetRolls.length)return {ok:false,handled:false,stage:'battle-enemy-ai-plan',reason:'enemy-ai-target-roll-count-mismatch',expected:targetCursor,actual:targetRolls.length};
  return {ok:true,handled:true,stage:'battle-enemy-ai-plan-ready',format:BROWSER_BATTLE_ENEMY_AI_RUNTIME_FORMAT,action:ACTION_BATTLE_ENEMY_AI_APPLY,turn:int(context.context.turn)??0,commands,rngConsumed:{action:actionCursor,target:targetCursor,total:actionCursor+targetCursor},battleContextMutation:false,persistentMutation:false,damageExecuted:false,source:{repository:SOURCE_REPOSITORY,ref:SOURCE_REF,functions:['BATTLE_ai_all','BATTLE_ai_normal']}};
}
function commitEnemyAiCommands(context,{plan=null}={}){
  if(!isObject(context)||!isObject(context.context))return {ok:false,handled:false,stage:'battle-enemy-ai-commit',reason:'battle-context-required'};
  if(!isObject(plan)||plan.ok!==true||plan.format!==BROWSER_BATTLE_ENEMY_AI_RUNTIME_FORMAT||plan.action!==ACTION_BATTLE_ENEMY_AI_APPLY)return {ok:false,handled:false,stage:'battle-enemy-ai-commit',reason:'enemy-ai-plan-required'};
  if(String(context.context.mode??'').trim().toLowerCase()!=='battle'||int(context.context.sourceMode)!==BATTLE_MODE_BATTLE)return {ok:false,handled:false,stage:'battle-enemy-ai-commit',reason:'battle-active-phase-required'};
  const currentTurn=int(context.context.turn)??0;
  if(currentTurn!==plan.turn)return {ok:false,handled:false,stage:'battle-enemy-ai-commit',reason:'enemy-ai-plan-turn-stale',expected:currentTurn,actual:plan.turn};
  if(!Array.isArray(plan.commands)||plan.commands.length===0)return {ok:false,handled:false,stage:'battle-enemy-ai-commit',reason:'enemy-ai-plan-commands-required'};
  for(const row of plan.commands){
    const actor=findEntryByBid(context,row.actorBid);
    if(!actor)return {ok:false,handled:false,stage:'battle-enemy-ai-commit',reason:'enemy-ai-actor-missing',actorBid:row.actorBid};
    const commands=Array.isArray(actor.battleCommands)?actor.battleCommands:[-1,-1,-1];
    if(int(actor.sourceBattleCharMode)!==row.before?.sourceBattleCharMode||JSON.stringify(commands)!==JSON.stringify(row.before?.battleCommands))return {ok:false,handled:false,stage:'battle-enemy-ai-commit',reason:'enemy-ai-actor-preimage-mismatch',actorBid:row.actorBid};
  }
  const next=clone(context);
  for(const row of plan.commands){
    const actor=findEntryByBid(next,row.actorBid);
    if(row.preserveCommand!==true){
      const commands=Array.isArray(actor.battleCommands)?actor.battleCommands.slice():[-1,-1,-1];
      commands[0]=row.commandCode;commands[1]=row.targetBid;actor.battleCommands=commands;
    }
    actor.sourceBattleCharMode=BATTLE_CHARMODE_C_OK;actor.battleMode='c_ok';
  }
  return {ok:true,handled:true,stage:'battle-enemy-ai-applied',format:BROWSER_BATTLE_ENEMY_AI_RUNTIME_FORMAT,action:ACTION_BATTLE_ENEMY_AI_APPLY,commandCount:plan.commands.length,commands:clone(plan.commands),rngConsumed:clone(plan.rngConsumed),battleContextMutation:true,persistentMutation:false,damageExecuted:false,battleContext:next};
}
function applyEnemyAiCommands(context,options={}){
  const plan=planEnemyAiCommands(context,options);if(!plan.ok)return plan;return commitEnemyAiCommands(context,{plan});
}
function createBrowserBattleEnemyAiRuntime(){
  return {ok:true,format:BROWSER_BATTLE_ENEMY_AI_RUNTIME_FORMAT,plan:planEnemyAiCommands,commit:commitEnemyAiCommands,apply:applyEnemyAiCommands};
}
export {BROWSER_BATTLE_ENEMY_AI_RUNTIME_FORMAT,ACTION_BATTLE_ENEMY_AI_APPLY,BATTLE_COM_NONE,BATTLE_COM_ATTACK,BATTLE_COM_GUARD,BATTLE_COM_ESCAPE,BATTLE_COM_S_CHARGE,BATTLE_COM_S_EARTHROUND0,BATTLE_COM_S_EARTHROUND1,BATTLE_ENEMY_AI_CHARGE_COMMANDS,BATTLE_ENEMY_AI_CANNOT_MOVE_STATUSES,BATTLE_AI_TARGET_TYPE_LEADER,BATTLE_AI_SELECT_HP_MAX,BATTLE_AI_SELECT_HP_MIN,BATTLE_AI_SELECT_STR_MAX,BATTLE_AI_SELECT_DEX_MAX,BATTLE_AI_SELECT_DEX_MIN,BATTLE_AI_SELECT_ATT_SUBDUE,planEnemyAiCommands,commitEnemyAiCommands,applyEnemyAiCommands,createBrowserBattleEnemyAiRuntime};
