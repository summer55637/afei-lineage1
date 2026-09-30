const NPC_EVENT_RUNTIME_FORMAT='stoneage-npc-event-runtime-v1';

const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const intOr=(v,f=0)=>Number.isFinite(Number(v))?Math.trunc(Number(v)):f;

function compareNumber(actual,operator,expected){
  switch(operator){
    case '=': return actual===expected;
    case '!=': return actual!==expected;
    case '<': return actual<expected;
    case '>': return actual>expected;
    default: return false;
  }
}

function parseConditionAtom(raw){
  const text=String(raw??'').trim();
  const m=text.match(/^([A-Za-z][A-Za-z0-9_]*)\s*(==|!=|=|<|>)\s*(-?\d+)$/);
  if(!m)return {ok:false,raw:text,reason:'unsupported-condition-atom'};
  return {ok:true,raw:text,key:m[1].toUpperCase(),operator:m[2],value:Number(m[3])};
}

function splitTopLevel(expression,separator){
  const out=[];let start=0;
  const text=String(expression??'');
  for(let i=0;i<text.length;i++)if(text[i]===separator){
    out.push(text.slice(start,i).trim());
    start=i+1;
  }
  out.push(text.slice(start).trim());
  return out.filter(Boolean);
}

function parseConditionExpression(expression){
  const alternatives=splitTopLevel(expression,',').map(conjunction=>splitTopLevel(conjunction,'&').map(parseConditionAtom));
  const errors=[];
  for(const alt of alternatives)for(const atom of alt)if(!atom.ok)errors.push(atom);
  return {ok:errors.length===0,expression:String(expression??''),alternatives,errors};
}

function defaultContext(state={}){
  return {
    level:intOr(state?.player?.level,0),
    transmigration:intOr(state?.player?.transmigration,0),
    gold:intOr(state?.player?.gold,0),
    itemCount:typeof state?.runtimeAdapters?.itemCount==='function' ? state.runtimeAdapters.itemCount : null,
    petCount:typeof state?.runtimeAdapters?.petCount==='function' ? state.runtimeAdapters.petCount : null,
    isEventEnd:typeof state?.runtimeAdapters?.isEventEnd==='function' ? state.runtimeAdapters.isEventEnd : null,
    isEventNow:typeof state?.runtimeAdapters?.isEventNow==='function' ? state.runtimeAdapters.isEventNow : null
  };
}

function evaluateConditionAtom(atom,context={}){
  if(!atom.ok)return atom;
  const key=atom.key;
  let actual;
  if(key==='LV')actual=intOr(context.level,0);
  else if(key==='TRANS')actual=intOr(context.transmigration,0);
  else if(key==='GOLD')actual=intOr(context.gold,0);
  else if(key==='ITEM'){
    if(typeof context.itemCount!=='function')return {ok:false,matched:false,reason:'item-count-adapter-required',atom};
    actual=intOr(context.itemCount(atom.value),0);
  }else if(key==='ENDEV'){
    if(typeof context.isEventEnd!=='function')return {ok:false,matched:false,reason:'event-end-adapter-required',atom};
    actual=context.isEventEnd(atom.value)?1:0;
    if(atom.operator==='=')return {ok:true,matched:context.isEventEnd(atom.value)===true,atom};
    if(atom.operator==='!=')return {ok:true,matched:context.isEventEnd(atom.value)!==true,atom};
    return {ok:false,matched:false,reason:'event-flag-only-supports-equality',atom};
  }else if(key==='NOWEV'){
    if(typeof context.isEventNow!=='function')return {ok:false,matched:false,reason:'event-now-adapter-required',atom};
    actual=context.isEventNow(atom.value)?1:0;
    if(atom.operator==='=')return {ok:true,matched:context.isEventNow(atom.value)===true,atom};
    if(atom.operator==='!=')return {ok:true,matched:context.isEventNow(atom.value)!==true,atom};
    return {ok:false,matched:false,reason:'event-flag-only-supports-equality',atom};
  }else{
    return {ok:false,matched:false,reason:'unsupported-condition-key',atom};
  }
  return {ok:true,matched:compareNumber(actual,atom.operator==='=='?'=':atom.operator,atom.value),actual,atom};
}

function evaluateConditionExpression(expression,context={}){
  const parsed=parseConditionExpression(expression);
  if(!parsed.ok)return {ok:false,matched:false,reason:'unsupported-condition-expression',errors:parsed.errors,parsed};
  for(const alternative of parsed.alternatives){
    let alternativeMatched=true;
    for(const atom of alternative){
      const result=evaluateConditionAtom(atom,context);
      if(!result.ok)return result;
      if(!result.matched){alternativeMatched=false;break;}
    }
    if(alternativeMatched)return {ok:true,matched:true,expression:String(expression??''),matchedAlternative:alternative};
  }
  return {ok:true,matched:false,expression:String(expression??'')};
}

function normalizeEventBranch(branch){
  if(!isObject(branch))return {ok:false,reason:'invalid-event-branch'};
  const condition=String(branch.condition??'').trim();
  if(!condition)return {ok:false,reason:'event-branch-condition-required'};
  const parsed=parseConditionExpression(condition);
  if(!parsed.ok)return {ok:false,reason:'unsupported-event-condition',condition,errors:parsed.errors};
  const toIntArray=value=>{
    const raw=Array.isArray(value)?value:(value==null?[]:[value]);
    return raw.map(v=>intOr(v,-1)).filter(v=>v>=0);
  };
  const itemActions=toIntArray(branch.getItem);
  const petActions=toIntArray(branch.getPet);
  const endEvents=toIntArray(branch.endSetFlg);
  const nowEvents=toIntArray(branch.nowSetFlg);
  const charm=branch.charm==null?null:intOr(branch.charm,0);
  return {ok:true,branch:{
    type:String(branch.type??'UNKNOWN'),
    condition,
    getItem:itemActions,
    getPet:petActions,
    charm,
    endSetFlg:endEvents,
    nowSetFlg:nowEvents
  }};
}

function selectEventBranch(branches,context={}){
  if(!Array.isArray(branches))return {ok:false,reason:'event-branches-required'};
  const candidates=[];
  for(let index=0;index<branches.length;index++){
    const normalized=normalizeEventBranch(branches[index]);
    if(!normalized.ok)return {...normalized,index};
    const evaluation=evaluateConditionExpression(normalized.branch.condition,context);
    if(!evaluation.ok)return {...evaluation,index,branch:normalized.branch};
    candidates.push({index,branch:normalized.branch,evaluation});
    if(evaluation.matched)return {ok:true,matched:true,index,branch:normalized.branch,evaluation,candidates};
  }
  return {ok:true,matched:false,index:-1,branch:null,candidates};
}

function buildEventActionPlan(branch){
  const normalized=normalizeEventBranch(branch);
  if(!normalized.ok)return normalized;
  const b=normalized.branch;
  return {
    ok:true,
    format:NPC_EVENT_RUNTIME_FORMAT,
    type:b.type,
    condition:b.condition,
    actions:{
      literalGetItem:b.getItem.map(itemId=>({itemId,role:'GetItem'})),
      literalGetPet:b.getPet.map(petId=>({petId,role:'GetPet'})),
      charm:b.charm==null?null:{value:b.charm,role:'Charm'},
      setEndEvents:b.endSetFlg.map(eventId=>({eventId,role:'EndSetFlg'})),
      setNowEvents:b.nowSetFlg.map(eventId=>({eventId,role:'NowSetFlg'}))
    },
    semantics:{
      getItem:'preserve literal source role; caller decides creation/transfer semantics',
      getPet:'preserve literal source role; requires explicit pet factory',
      charm:'preserve literal source value; caller decides set/delta semantics',
      setEndEvents:'requires explicit event-state writer',
      setNowEvents:'requires explicit event-state writer'
    }
  };
}

function compileSourceEventScript(script){
  if(!isObject(script))return {ok:false,reason:'script-required'};
  const branches=Array.isArray(script.branches)?script.branches:[];
  const compiled=[];
  for(let index=0;index<branches.length;index++){
    const normalized=normalizeEventBranch(branches[index]);
    if(!normalized.ok)return {...normalized,index};
    const plan=buildEventActionPlan(normalized.branch);
    if(!plan.ok)return {...plan,index};
    compiled.push({index,branch:normalized.branch,plan});
  }
  return {
    ok:true,
    format:NPC_EVENT_RUNTIME_FORMAT,
    eventNo:script.eventNo??null,
    sourceScript:script.path??null,
    branches:compiled
  };
}

export {
  NPC_EVENT_RUNTIME_FORMAT,
  parseConditionAtom,
  parseConditionExpression,
  evaluateConditionAtom,
  evaluateConditionExpression,
  normalizeEventBranch,
  selectEventBranch,
  buildEventActionPlan,
  compileSourceEventScript,
  defaultContext
};
