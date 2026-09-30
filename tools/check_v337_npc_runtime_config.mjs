#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  NPC_RUNTIME_CONFIG_FORMAT,
  normalizeNpcRuntimeConfig,
  createNpcModuleRegistryOptions,
  assertBrowserCompatibilityPolicy
} from '../src/stoneage_npc_runtime_config.mjs';

assert.equal(NPC_RUNTIME_CONFIG_FORMAT,'stoneage-npc-runtime-config-v1');
assert.deepEqual(normalizeNpcRuntimeConfig(),{
  format:NPC_RUNTIME_CONFIG_FORMAT,
  compatibilityMode:false,
  allowExternalCompatibilityAliases:false,
  defaultInteractionAction:'talk',
  sourceProfile:'fixed-c'
});
assert.equal(createNpcModuleRegistryOptions({compatibilityMode:false,allowExternalCompatibilityAliases:true}).allowExternalCompatibilityAliases,false);
assert.equal(createNpcModuleRegistryOptions({compatibilityMode:true,allowExternalCompatibilityAliases:true}).allowExternalCompatibilityAliases,true);
assert.equal(assertBrowserCompatibilityPolicy({compatibilityMode:true,allowExternalCompatibilityAliases:false}).ok,false);
assert.equal(assertBrowserCompatibilityPolicy({compatibilityMode:true,allowExternalCompatibilityAliases:true}).ok,true);
console.log(JSON.stringify({
  pass:true,
  format:NPC_RUNTIME_CONFIG_FORMAT,
  strictDefault:true,
  compatibilityExplicitOptIn:true,
  invalidHalfOptInBlocked:true
}));
