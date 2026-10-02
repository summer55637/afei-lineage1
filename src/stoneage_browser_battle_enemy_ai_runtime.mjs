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
    if(w.skills[i]>0&&roll<cursor+w.skills[i])return {ok:false,reason:'enemy-ai-petskill-runtime-required',skillIndex:i,roll,total:w.total};
    cursor+=w.skills[i];
  }
  return {ok:false,reason:'enemy-ai-action-selection-unresolved',roll,total:w.total};
}
function candidatesForTarget(context,opposingSide,targetType){
  const side=context.context.sides.find(x=>int(x?.side)===opposingSide);
  const entries=Array.isArray(side?.entries)?side.entries:[];
  if(![0,1,2,3].includes(targetType))return {ok:false,reason:'enemy-ai-target-type-not-supported',targetType};
  const candidates=[];
  for(let slot=0;slot<entries.length;slot++){
    const entry=entries[slot];if(!entry||entry.isDie===true)continue;
    if(int(entry.sourceBattleCharMode)===BATTLE_CHARMODE_RESCUE)continue;
    const sourceType=String(entry.sourceType??'').toLowerCase();
    if(targetType===2&&sourceType!=='player')continue;
    if(targetType===3&&sourceType!=='pet')continue;
    candidates.push({bid:int(entry.bid)??opposingSide*10+slot,slot,sourceType:sourceType||null,hp:int(entry.hp)});
  }
  if(candidates.length===0&&(targetType===2||targetType===3)){
    for(let slot=0;slot<entries.length;slot++){
      const entry=entries[slot];if(!entry||entry.isDie===true)continue;
      if(int(entry.sourceBattleCharMode)===BATTLE_CHARMODE_RESCUE)continue;
      const sourceType=String(entry.sourceType??'').toLowerCase();
      candidates.push({bid:int(entry.bid)??opposingSide*10+slot,slot,sourceType:sourceType||null,hp:int(entry.hp)});
    }
    return {ok:true,candidates,fallbackToAll:true};
  }
  return {ok:true,candidates,fallbackToAll:false};
}
function selectTargetCandidate(candidates,selectMode,targetRolls,targetCursor){
  if(selectMode===1){
    const selected=nextRoll(targetRolls,targetCursor,0,candidates.length-1,'enemy-ai-target');
    if(!selected.ok)return selected;
    return {ok:true,candidate:candidates[selected.roll],targetRoll:selected.roll,cursor:selected.cursor};
  }
  if(selectMode===2||selectMode===3){
    let chosen=candidates[0];
    if(chosen?.hp==null)return {ok:false,reason:'enemy-ai-target-hp-required',slot:chosen?.slot};
    for(let i=1;i<candidates.length;i++){
      const candidate=candidates[i];
      if(candidate?.hp==null)return {ok:false,reason:'enemy-ai-target-hp-required',slot:candidate?.slot};
      if((selectMode===2&&candidate.hp>chosen.hp)||(selectMode===3&&candidate.hp<chosen.hp))chosen=candidate;
    }
    return {ok:true,candidate:chosen,targetRoll:null,cursor:targetCursor};
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
      let targetBid=-1,targetRoll=null;
      if(chosen.action==='attack'){
        const targetSelection=candidatesForTarget(context,1-sideNo,int(ai.targetType));
        if(!targetSelection.ok)return {...targetSelection,handled:false,stage:'battle-enemy-ai-plan',actorBid:int(actor.bid)};
        if(targetSelection.candidates.length===0)return {ok:false,handled:false,stage:'battle-enemy-ai-plan',reason:'enemy-ai-no-valid-targets',actorBid:int(actor.bid),targetType:int(ai.targetType)};
        const selected=selectTargetCandidate(targetSelection.candidates,int(ai.selectMode),targetRolls,targetCursor);
        if(!selected.ok)return {...selected,handled:false,stage:'battle-enemy-ai-plan',actorBid:int(actor.bid),candidateCount:targetSelection.candidates.length};
        targetCursor=selected.cursor;targetRoll=selected.targetRoll;targetBid=selected.candidate.bid;
      }
      const blockedOn=enemyCannotMove(actor);
      const cannotMove=blockedOn.length>0;
      commands.push({actorBid:int(actor.bid)??sideNo*10+slot,side:sideNo,slot,
        action:cannotMove?'none':chosen.action,selectedAction:chosen.action,
        commandCode:cannotMove?BATTLE_COM_NONE:chosen.commandCode,targetBid,
        moveBlockedOn:blockedOn,actionRoll:actionResult.roll,targetRoll,before});
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
export {BROWSER_BATTLE_ENEMY_AI_RUNTIME_FORMAT,ACTION_BATTLE_ENEMY_AI_APPLY,BATTLE_COM_NONE,BATTLE_COM_ATTACK,BATTLE_COM_GUARD,BATTLE_COM_ESCAPE,BATTLE_COM_S_CHARGE,BATTLE_COM_S_EARTHROUND0,BATTLE_COM_S_EARTHROUND1,BATTLE_ENEMY_AI_CHARGE_COMMANDS,BATTLE_ENEMY_AI_CANNOT_MOVE_STATUSES,planEnemyAiCommands,commitEnemyAiCommands,applyEnemyAiCommands,createBrowserBattleEnemyAiRuntime};
