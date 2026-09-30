#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { freshPersistentState, validatePersistentState } from '../src/stoneage_persistent_state.mjs';
import { createBrowserStateController, ACTION_NPC_WARP_EXECUTE, BROWSER_STATE_CONTROLLER_FORMAT } from '../src/stoneage_browser_state_controller.mjs';
import { BROWSER_WARP_RUNTIME_FORMAT, createBrowserWarpRuntime } from '../src/stoneage_browser_warp_runtime.mjs';

const sourceRoot=process.argv[2]??null;
const generatedCatalogPath=process.argv[3]??null;
const committedCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_browser_start_warp_catalog.json','utf8'));

if(sourceRoot&& !generatedCatalogPath)throw new Error('generated catalog path required with source root');
if(sourceRoot){
  execFileSync(process.execPath,['tools/generate_browser_start_warp_catalog.mjs','--source-root',sourceRoot,'--out',generatedCatalogPath],{stdio:'inherit'});
}
const catalog=generatedCatalogPath?JSON.parse(fs.readFileSync(generatedCatalogPath,'utf8')):committedCatalog;

assert.deepEqual(catalog.fixedSource,{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56'});
assert.equal(catalog.format,'stoneage-browser-start-warp-catalog-v1');
assert.deepEqual(catalog.statistics,{rowCount:8,unresolvedCount:0,sourceCreateCount:2,hometownFloorCount:4});
assert.equal(catalog.rows.length,8);

const committedByKey=new Map(committedCatalog.rows.map(x=>[x.sourceKey,x]));
for(const row of catalog.rows){
  const committed=committedByKey.get(row.sourceKey);
  assert.ok(committed,'missing committed source row: '+row.sourceKey);
  assert.deepEqual(committed.origin,row.origin);
  assert.deepEqual(committed.target,row.target);
  assert.equal(committed.sourceBlobSha,row.sourceBlobSha);
  assert.equal(committed.standardArg,row.standardArg);
  assert.equal(row.templateName,'npcgen_warp');
  assert.equal(row.functionSet,'Warp');
}

const npcFor=row=>({
  floor:row.origin.floorId,
  x:row.origin.x,
  y:row.origin.y,
  npc:[row.origin.x,row.origin.y],
  path:row.createPath,
  blockIndex:row.createBlockIndex,
  startLine:row.startLine,
  template:'npcgen_warp',
  templateName:'npcgen_warp',
  functionSet:'Warp',
  sourceTemplateCandidate:{path:'genout/npcgen.template',functionSet:'Warp'},
  runtimeModuleStatus:'source_template_reference_present'
});

const runtime=createBrowserWarpRuntime({warpCatalog:catalog});
assert.equal(runtime.ok,true);
assert.equal(runtime.format,BROWSER_WARP_RUNTIME_FORMAT);

const first=catalog.rows.find(x=>x.sourceKey==='genout/warp_y.create#23');
assert.ok(first);
const state=freshPersistentState({playerId:'v375-browser-warp'});
state.world.position={floorId:first.origin.floorId,x:first.origin.x,y:first.origin.y};
const controller=createBrowserStateController({state,worldNpcIndex:null,warpCatalog:catalog});
assert.equal(controller.format,BROWSER_STATE_CONTROLLER_FORMAT);

const npc=npcFor(first);
const resolved=await controller.dispatch({
  type:ACTION_NPC_WARP_EXECUTE,
  npc,
  player:{floor:first.origin.floorId,x:first.origin.x,y:first.origin.y},
  expectedRevision:0
});
assert.equal(resolved.ok,true);
assert.equal(resolved.handled,true);
assert.equal(resolved.stage,'warp');
assert.deepEqual(resolved.origin,first.origin);
assert.deepEqual(resolved.target,first.target);
assert.equal(resolved.state.revision,1);
assert.deepEqual(resolved.state.world.position,{floorId:1000,x:98,y:44});
assert.equal(validatePersistentState(resolved.state).length,0);
assert.equal(resolved.verification.ok,true);
assert.deepEqual(controller.getState().world.position,{floorId:1000,x:98,y:44});

const stale=await controller.dispatch({
  type:ACTION_NPC_WARP_EXECUTE,
  npc,
  player:{floor:first.origin.floorId,x:first.origin.x,y:first.origin.y},
  expectedRevision:0
});
assert.equal(stale.ok,false);
assert.equal(stale.reason,'warp-player-not-on-npc-cell');
assert.equal(controller.getState().revision,1);

const conflictState=freshPersistentState({playerId:'v375-conflict'});
conflictState.world.position={floorId:first.origin.floorId,x:first.origin.x,y:first.origin.y};
conflictState.revision=1;
const conflict=await runtime.execute(
  conflictState,
  npc,
  {floor:first.origin.floorId,x:first.origin.x,y:first.origin.y},
  {expectedRevision:0}
);
assert.equal(conflict.ok,false);
assert.equal(conflict.reason,'revision-conflict');
assert.equal(conflictState.revision,1);
assert.deepEqual(conflictState.world.position,{floorId:first.origin.floorId,x:first.origin.x,y:first.origin.y});

const farState=freshPersistentState({playerId:'v375-far'});
farState.world.position={floorId:first.origin.floorId,x:first.origin.x+1,y:first.origin.y};
const far=await runtime.execute(
  farState,
  npc,
  {floor:first.origin.floorId,x:first.origin.x+1,y:first.origin.y},
  {expectedRevision:0}
);
assert.equal(far.ok,false);
assert.equal(far.reason,'warp-player-not-on-npc-cell');
assert.equal(farState.revision,0);
assert.deepEqual(farState.world.position,{floorId:first.origin.floorId,x:first.origin.x+1,y:first.origin.y});

const badNpc={...npc,template:'Warp'};
const bad=await runtime.execute(state,badNpc,{floor:1000,x:98,y:44},{expectedRevision:1});
assert.equal(bad.ok,false);
assert.equal(bad.reason,'warp-template-mismatch');

const wrongSourceRuntime=createBrowserWarpRuntime({
  warpCatalog:{...catalog,fixedSource:{...catalog.fixedSource,ref:'wrong'}}
});
assert.equal(wrongSourceRuntime.ok,false);
assert.equal(wrongSourceRuntime.reason,'dependency-validation-failed');

const second=catalog.rows.find(x=>x.sourceKey==='genout/warp_y2.create#17');
assert.ok(second);
const secondState=freshPersistentState({playerId:'v375-second'});
secondState.world.position={floorId:second.origin.floorId,x:second.origin.x,y:second.origin.y};
const secondResult=await runtime.execute(
  secondState,
  npcFor(second),
  {floor:second.origin.floorId,x:second.origin.x,y:second.origin.y},
  {expectedRevision:0}
);
assert.equal(secondResult.ok,true);
assert.equal(secondResult.state.revision,1);
assert.deepEqual(secondResult.state.world.position,{floorId:3000,x:90,y:60});

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_WARP_RUNTIME_FORMAT,
  source:catalog.fixedSource,
  startWarpRows:catalog.rows.length,
  checks:[
    'npcgen_warp -> Warp source binding',
    'same-cell walk-on activation parity',
    'standard floor|x|y destination',
    'Persistent State world.position mutation',
    'Save Envelope verification',
    'expectedRevision guard',
    'non-warp template rejection',
    'fixed-source rejection',
    'second start-floor warp destination'
  ]
},null,2));
