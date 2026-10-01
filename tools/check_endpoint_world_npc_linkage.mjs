#!/usr/bin/env node
import fs from 'node:fs';

const file='endpoint-world/stoneage_world_npc_index.json';
if(!fs.existsSync(file)) throw new Error('Missing generated endpoint world NPC index: '+file);
const j=JSON.parse(fs.readFileSync(file,'utf8'));
const s=j.statistics ?? {};
const expected={npcFiles:2384,templateFiles:57,createFiles:210,argFiles:454,mapWarpRows:4734};
for(const [key,value] of Object.entries(expected)){if(s[key]!==value) throw new Error(key+' drift: expected '+value+', got '+s[key]);}
if((s.unresolvedTemplateRefs ?? -1)!==0) throw new Error('Endpoint NPC unresolved template refs: '+s.unresolvedTemplateRefs);
if((s.unresolvedFileRefs ?? -1)!==0) throw new Error('Endpoint NPC unresolved file refs: '+s.unresolvedFileRefs);
if((s.templateBlocks ?? 0)<=0 || (s.createBlocks ?? 0)<=0) throw new Error('Endpoint NPC parser produced no template/create blocks.');
if(j.sourceRole!=='vm-one-click-endpoint') throw new Error('Endpoint NPC source role drift: '+j.sourceRole);
if(j.fixedSource?.repository!=='summer55637/afei-lineage1') throw new Error('Endpoint NPC source repository drift.');
if(j.fixedSource?.ref!==process.env.GITHUB_SHA) throw new Error('Endpoint NPC source ref does not match checked-out commit.');
console.log(JSON.stringify({pass:true,sourceRole:j.sourceRole,statistics:{npcFiles:s.npcFiles,templateFiles:s.templateFiles,templateBlocks:s.templateBlocks,createFiles:s.createFiles,createBlocks:s.createBlocks,argFiles:s.argFiles,resolvedTemplateRefs:s.resolvedTemplateRefs,unresolvedTemplateRefs:s.unresolvedTemplateRefs,unresolvedFileRefs:s.unresolvedFileRefs,uniqueFloorCount:s.uniqueFloorCount,mapWarpRows:s.mapWarpRows}}));