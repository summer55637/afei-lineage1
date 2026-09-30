#!/usr/bin/env node
import fs from 'node:fs';

const file='data/generated/stoneage_world_data_source_catalog.json';
const c=fs.readFileSync(file,'utf8');
const j=JSON.parse(c);

function fail(msg){ console.error('World Data Catalog FAILED:',msg); process.exit(1); }

if(j.format!=='stoneage-world-data-source-catalog-v1') fail('format drift');
if(j.fixedSource?.repository!=='gavinlinasd/StoneAge') fail('fixed repository drift');
if(j.fixedSource?.ref!=='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56') fail('fixed source ref drift');
if(j.fixedSource?.rootTreeSha!=='33f71a5f804480cec28edee4bd6a6d1851ba2dab') fail('fixed root tree drift');

const inv=j.sourceInventory;
if(inv?.totalBlobFiles!==5764) fail('source blob count drift');
if(inv?.gmsvDataTopLevelFiles!==49) fail('top-level data file count drift');
if(inv?.npcDataFiles!==3960) fail('NPC file count drift');
if(inv?.npcDataByExtension?.['.arg']!==1161) fail('NPC .arg count drift');
if(inv?.npcDataByExtension?.['.create']!==354) fail('NPC .create count drift');
if(inv?.npcDataByExtension?.['.template']!==88) fail('NPC .template count drift');

const npc=j.npcModel;
if(npc?.loader!=='gmsv/src/npc/readnpc.c') fail('NPC loader drift');
if(npc?.templateLoader!=='NPC_readNPCTemplateFiles') fail('template loader drift');
if(npc?.createLoader!=='NPC_readNPCCreateFiles') fail('create loader drift');
if(npc?.functionSetCount!==70) fail('function-set count drift');

const anomaly=j.confirmedSourceAnomalies?.find(x=>x.path==='gmsv/data/npc/bank/bankman.template');
if(!anomaly) fail('confirmed bankman source anomaly missing');
if(anomaly.fixedFunctionSetTableContains!==false) fail('bankman anomaly status changed');

console.log(JSON.stringify({
  pass:true,
  version:'V1-world-catalog',
  fixedRef:j.fixedSource.ref,
  totalSourceFiles:inv.totalBlobFiles,
  npcFiles:inv.npcDataFiles,
  npcArg:inv.npcDataByExtension['.arg'],
  npcCreate:inv.npcDataByExtension['.create'],
  npcTemplate:inv.npcDataByExtension['.template'],
  functionSets:npc.functionSetCount,
  confirmedAnomalies:j.confirmedSourceAnomalies.length,
  next:'world-npc-index'
}));
