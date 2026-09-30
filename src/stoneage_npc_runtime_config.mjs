const NPC_RUNTIME_CONFIG_FORMAT='stoneage-npc-runtime-config-v1';

function normalizeNpcRuntimeConfig(value={}){
  const source=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  return {
    format:NPC_RUNTIME_CONFIG_FORMAT,
    compatibilityMode:source.compatibilityMode===true,
    allowExternalCompatibilityAliases:source.allowExternalCompatibilityAliases===true,
    defaultInteractionAction:String(source.defaultInteractionAction??'talk'),
    sourceProfile:String(source.sourceProfile??'fixed-c')
  };
}

function createNpcModuleRegistryOptions(config={}){
  const normalized=normalizeNpcRuntimeConfig(config);
  return {
    allowExternalCompatibilityAliases:
      normalized.compatibilityMode&&normalized.allowExternalCompatibilityAliases
  };
}

function assertBrowserCompatibilityPolicy(config={}){
  const normalized=normalizeNpcRuntimeConfig(config);
  if(normalized.compatibilityMode && !normalized.allowExternalCompatibilityAliases){
    return {ok:false,reason:'compatibility-mode-requires-external-alias-opt-in'};
  }
  return {ok:true,config:normalized};
}

export {
  NPC_RUNTIME_CONFIG_FORMAT,
  normalizeNpcRuntimeConfig,
  createNpcModuleRegistryOptions,
  assertBrowserCompatibilityPolicy
};
