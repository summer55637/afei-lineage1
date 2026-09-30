const NPC_MODULE_REGISTRY_FORMAT='stoneage-npc-module-registry-v1';
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function normalizeName(value){return String(value??'').trim().toLowerCase();}
function createAuditedNpcModuleRegistry(auditCatalog,{modules={}}={}){
  if(!isObject(auditCatalog)||!Array.isArray(auditCatalog.sourceFunctionSets))return {ok:false,reason:'npc-functionset-audit-required'};
  const known=new Map(auditCatalog.sourceFunctionSets.map(name=>[normalizeName(name),name]));
  const resolved={}; const unresolved=[];
  for(const [name,module] of Object.entries(modules??{})){
    const canonical=known.get(normalizeName(name));
    if(!canonical){unresolved.push({requested:name,status:'not-in-pinned-functionset-registry'});continue;}
    if(!module||typeof module!=='object'){unresolved.push({requested:name,status:'invalid-module'});continue;}
    resolved[canonical]=module;
  }
  return {ok:true,format:NPC_MODULE_REGISTRY_FORMAT,fixedSource:auditCatalog.fixedSource??null,knownCount:known.size,resolved,unresolved};
}
function resolveAuditedNpcModule(registry,templateName){
  if(!isObject(registry)||registry.format!==NPC_MODULE_REGISTRY_FORMAT)return {ok:false,reason:'invalid-npc-module-registry'};
  const requested=String(templateName??'').trim(); if(!requested)return {ok:false,reason:'npc-template-name-required'};
  const canonical=Object.keys(registry.resolved).find(name=>normalizeName(name)===normalizeName(requested));
  if(!canonical)return {ok:true,resolved:false,reason:'npc-runtime-module-unresolved',template:requested};
  return {ok:true,resolved:true,template:canonical,module:registry.resolved[canonical]};
}
export { NPC_MODULE_REGISTRY_FORMAT, createAuditedNpcModuleRegistry, resolveAuditedNpcModule };
