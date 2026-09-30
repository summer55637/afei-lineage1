const EVENT_FLAG_RUNTIME_FORMAT='stoneage-event-flag-runtime-v1';

const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const intOr=(v,f=0)=>Number.isFinite(Number(v))?Math.trunc(Number(v)):f;
const clone=v=>JSON.parse(JSON.stringify(v));

function normalizeWords(value){
  if(Array.isArray(value))return value.map(v=>Number.isFinite(Number(v))?Math.trunc(Number(v)):0);
  return [];
}

function normalizeEventState(state){
  state.events??={};
  if(!Array.isArray(state.events.endWords))state.events.endWords=[];
  if(!Array.isArray(state.events.nowWords))state.events.nowWords=[];
  return state.events;
}

function eventLocation(eventId){
  const id=intOr(eventId,-1);
  if(id<0)return null;
  return {eventId:id,array:Math.floor(id/32),shift:id%32,mask:(2**(id%32))};
}

function ensureWord(words,array){
  while(words.length<=array)words.push(0);
}

function isEventFlagSet(state,kind,eventId){
  const loc=eventLocation(eventId);
  if(!loc)return false;
  const events=normalizeEventState(state);
  const words=kind==='end'?events.endWords:kind==='now'?events.nowWords:null;
  if(!words)return false;
  const word=Number(words[loc.array]??0);
  return Number.isFinite(word) && Math.floor(word/loc.mask)%2===1;
}

function setEventFlag(state,kind,eventId,value=true){
  const loc=eventLocation(eventId);
  if(!loc)return {ok:false,reason:'invalid-event-id'};
  const events=normalizeEventState(state);
  const words=kind==='end'?events.endWords:kind==='now'?events.nowWords:null;
  if(!words)return {ok:false,reason:'invalid-event-flag-kind',kind};
  ensureWord(words,loc.array);
  const before=Number(words[loc.array]??0);
  const currentlySet=Math.floor(before/loc.mask)%2===1;
  const after=value?(currentlySet?before:before+loc.mask):(currentlySet?before-loc.mask:before);
  words[loc.array]=after;
  return {ok:true,changed:before!==after,eventId:loc.eventId,array:loc.array,shift:loc.shift,mask:loc.mask,value:Boolean(value)};
}

function setEndEventFlag(state,eventId){
  return setEventFlag(state,'end',eventId,true);
}

function setNowEventFlag(state,eventId){
  return setEventFlag(state,'now',eventId,true);
}

function clearEndEventFlag(state,eventId){
  return setEventFlag(state,'end',eventId,false);
}

function clearNowEventFlag(state,eventId){
  return setEventFlag(state,'now',eventId,false);
}

function clearBothEventFlags(state,eventId){
  const nowWasSet=isEventFlagSet(state,'now',eventId);
  const endWasSet=isEventFlagSet(state,'end',eventId);
  const now=clearNowEventFlag(state,eventId);
  const end=clearEndEventFlag(state,eventId);
  return {ok:now.ok&&end.ok,changed:now.changed||end.changed,nowWasSet,endWasSet,eventId:intOr(eventId,-1)};
}

function createEventFlagHandlers(){
  return {
    EndSetFlg(state,payload){return setEndEventFlag(state,payload?.eventId);},
    NowSetFlg(state,payload){return setNowEventFlag(state,payload?.eventId);},
    EvClr(state,payload){return clearBothEventFlags(state,payload?.eventId);}
  };
}

function eventFlagContext(state){
  return {
    isEventEnd:eventId=>isEventFlagSet(state,'end',eventId),
    isEventNow:eventId=>isEventFlagSet(state,'now',eventId)
  };
}

function exportLegacyEventWords(state){
  const events=normalizeEventState(state);
  return {
    endWords:normalizeWords(events.endWords),
    nowWords:normalizeWords(events.nowWords)
  };
}

export {
  EVENT_FLAG_RUNTIME_FORMAT,
  eventLocation,
  normalizeEventState,
  isEventFlagSet,
  setEventFlag,
  setEndEventFlag,
  setNowEventFlag,
  clearEndEventFlag,
  clearNowEventFlag,
  clearBothEventFlags,
  createEventFlagHandlers,
  eventFlagContext,
  exportLegacyEventWords
};
