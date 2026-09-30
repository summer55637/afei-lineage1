const NPC_MODULE_REGISTRY_FORMAT='stoneage-npc-module-registry-v1';
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const normalizeName=value=>String(value??'').trim().toLowerCase();
function normalizeSourceTemplateBindings(auditCatalog){
  if(!Array.isArray(auditCatalog?.sourceTemplateBindings))return [];
  return auditCatalog.sourceTemplateBindings.map((entry)=>({
    templateName:String(entry?.templateName??'').trim(),
    normalizedTemplateName:normalizeName(entry?.templateName),
    functionset:String(entry?.functionset??'').trim(),
    normalizedFunctionSet:normalizeName(entry?.functionset),
    sourcePath:entry?.sourcePath??entry?.source?.path??null,
    sourceBlobSha:entry?.sourceBlobSha??entry?.source?.blobSha??null
  })).filter((entry)=>entry.normalizedTemplateName&&entry.normalizedFunctionSet);
}
function createAuditedNpcModuleRegistry(auditCatalog,{modules={}}={}){
  if(!isObject(auditCatalog)||!Array.isArray(auditCatalog.sourceFunctionSets))return {ok:false,reason:'npc-functionset-audit-required'};
  const known=new Map(auditCatalog.sourceFunctionSets.map(name=>[normalizeName(name),name]));
  const sourceTemplateBindings=normalizeSourceTemplateBindings(auditCatalog);
  const resolved={}; const unresolved=[];
  for(const [name,module] of Object.entries(modules??{})){
    const canonical=known.get(normalizeName(name));
    if(!canonical){unresolved.push({requested:name,status:'not-in-pinned-functionset-registry'});continue;}
    if(!module||typeof module!=='object'){unresolved.push({requested:name,status:'invalid-module'});continue;}
    resolved[canonical]=module;
  }
  return {ok:true,format:NPC_MODULE_REGISTRY_FORMAT,fixedSource:auditCatalog.fixedSource??null,knownCount:known.size,resolved,unresolved,sourceTemplateBindings,sourceTemplateCount:sourceTemplateBindings.length,compatibilityMode:false,compatibilityAliases:{}};
}
function createCompatibilityNpcModuleRegistry(auditCatalog,compatibilityCatalog,{modules={},allowExternalCompatibilityAliases=false}={}){
  const base=createAuditedNpcModuleRegistry(auditCatalog,{modules});
  if(!base.ok)return base;
  if(!allowExternalCompatibilityAliases)return {...base,compatibilityMode:false};
  if(!isObject(compatibilityCatalog)||!Array.isArray(compatibilityCatalog.aliases))return {ok:false,reason:'compatibility-catalog-required'};
  const aliases={}; const rejected=[];
  for(const entry of compatibilityCatalog.aliases){
    const alias=String(entry?.templateName??'').trim();
    const functionset=String(entry?.functionset??'').trim();
    if(!alias||!functionset){rejected.push({entry,status:'invalid-alias'});continue;}
    const canonical=Object.keys(base.resolved).find(name=>normalizeName(name)===normalizeName(functionset));
    if(!canonical){rejected.push({template:alias,functionset,status:'canonical-module-not-resolved'});continue;}
    aliases[normalizeName(alias)]={template:alias,functionset:canonical,module:base.resolved[canonical],source:entry.source??null,compatibilityOnly:true};
  }
  return {...base,compatibilityMode:true,compatibilityAliases:aliases,compatibilityRejected:rejected};
}
function resolveAuditedNpcModule(registry,templateName){
  if(!isObject(registry)||registry.format!==NPC_MODULE_REGISTRY_FORMAT)return {ok:false,reason:'invalid-npc-module-registry'};
  const requested=String(templateName??'').trim(); if(!requested)return {ok:false,reason:'npc-template-name-required'};
  const canonical=Object.keys(registry.resolved??{}).find(name=>normalizeName(name)===normalizeName(requested));
  if(canonical)return {ok:true,resolved:true,template:canonical,module:registry.resolved[canonical],compatibilityAlias:false,sourceBackedTemplate:false};
  const binding=(registry.sourceTemplateBindings??[]).find(entry=>entry.normalizedTemplateName===normalizeName(requested));
  if(binding){
    const canonicalFunctionSet=Object.keys(registry.resolved??{}).find(name=>normalizeName(name)===binding.normalizedFunctionSet);
    if(canonicalFunctionSet)return {ok:true,resolved:true,template:requested,functionset:canonicalFunctionSet,module:registry.resolved[canonicalFunctionSet],compatibilityAlias:false,sourceBackedTemplate:true,sourceTemplateBinding:{templateName:binding.templateName,functionset:canonicalFunctionSet,sourcePath:binding.sourcePath,sourceBlobSha:binding.sourceBlobSha}};
    return {ok:true,resolved:false,reason:'npc-runtime-module-unresolved',template:requested,functionset:binding.functionset,sourceBackedTemplate:true};
  }
  const alias=registry.compatibilityAliases?.[normalizeName(requested)];
  if(alias)return {ok:true,resolved:true,template:requested,functionset:alias.functionset,module:alias.module,compatibilityAlias:true,source:alias.source};
  return {ok:true,resolved:false,reason:'npc-runtime-module-unresolved',template:requested};
}
export { NPC_MODULE_REGISTRY_FORMAT, createAuditedNpcModuleRegistry, createCompatibilityNpcModuleRegistry, resolveAuditedNpcModule };
