#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  EVENT_FLAG_RUNTIME_FORMAT,
  eventLocation,
  isEventFlagSet,
  setEndEventFlag,
  setNowEventFlag,
  clearBothEventFlags,
  createEventFlagHandlers,
  eventFlagContext
} from '../src/stoneage_event_flag_runtime.mjs';

assert.equal(EVENT_FLAG_RUNTIME_FORMAT,'stoneage-event-flag-runtime-v1');

const loc366=eventLocation(366);
assert.deepEqual(loc366,{eventId:366,array:11,shift:14,mask:16384});

const state={events:{}};
assert.equal(isEventFlagSet(state,'end',366),false);
const set366=setEndEventFlag(state,366);
assert.equal(set366.ok,true);
assert.equal(state.events.endWords.length,12);
assert.equal(state.events.endWords[11],16384);
assert.equal(isEventFlagSet(state,'end',366),true);

const set365=setEndEventFlag(state,365);
assert.equal(set365.changed,true);
assert.equal(isEventFlagSet(state,'end',365),true);
assert.equal(isEventFlagSet(state,'end',364),false);

const now365=setNowEventFlag(state,365);
assert.equal(now365.ok,true);
assert.equal(isEventFlagSet(state,'now',365),true);

const both=clearBothEventFlags(state,365);
assert.equal(both.ok,true);
assert.equal(both.nowWasSet,true);
assert.equal(both.endWasSet,true);
assert.equal(isEventFlagSet(state,'now',365),false);
assert.equal(isEventFlagSet(state,'end',365),false);

const handlers=createEventFlagHandlers();
const viaHandler=handlers.EndSetFlg(state,{eventId:363});
assert.equal(viaHandler.ok,true);
assert.equal(isEventFlagSet(state,'end',363),true);
const nowViaHandler=handlers.NowSetFlg(state,{eventId:363});
assert.equal(nowViaHandler.ok,true);
assert.equal(isEventFlagSet(state,'now',363),true);

const context=eventFlagContext(state);
assert.equal(context.isEventEnd(363),true);
assert.equal(context.isEventNow(363),true);

const invalid=setEndEventFlag(state,-1);
assert.equal(invalid.ok,false);
assert.equal(invalid.reason,'invalid-event-id');

console.log(JSON.stringify({
  pass:true,
  format:EVENT_FLAG_RUNTIME_FORMAT,
  event366Location:loc366,
  supportsEventRange:'dynamic words',
  end366Set:true,
  now365SetThenCleared:true,
  explicitHandlers:true
}));
