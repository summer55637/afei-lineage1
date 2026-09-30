
#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const audit=JSON.parse(fs.readFileSync('data/generated/stoneage_changeevent_module_audit.json','utf8'));
const closure=JSON.parse(fs.readFileSync('data/generated/stoneage_start_route_closure.json','utf8'));
const fixedRoot=process.argv[2];
if(!fixedRoot) throw new Error('fixed-C source checkout path is required');
const read=p=>fs.readFileSync(fixedRoot+'/'+p,'utf8');

assert.equal(audit.format,'stoneage-changeevent-module-audit-v2');
assert.equal(audit.fixedSource.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.equal(audit.target.startFloorInstanceCount,5);
assert.equal(audit.status,'runtime-module-unresolved');
assert.equal(audit.closureClass,'source-proven-non-instantiable-in-pinned-build');

const create=read('gmsv/src/npc/npccreate.c');
assert.ok(create.includes('templateindex= NPC_templateGetTemplateIndex(enemyname);'));
assert.ok(create.includes('if( templateindex != -1 ){'));
assert.ok(create.includes('if( enemyreadindex == 0 ){'));

const templates=read('gmsv/src/npc/npctemplate.c');
const loader=templates.indexOf('BOOL NPC_readNPCTemplateFiles');
const lookup=templates.indexOf('int NPC_templateGetTemplateIndex');
assert.ok(loader>=0 && lookup>loader);
assert.ok(templates.slice(loader,lookup).includes('rgetFileName( topdirectory'));
assert.ok(templates.slice(lookup,lookup+1100).includes('return -1;'));

const xinshou=read('gmsv/data/npc/almark/xinshou/xinshou.create');
assert.equal((xinshou.match(/enemy=changeevent\|file:almark\/xinshou\/xinshoujd\.arg/g)||[]).length,4);
const shop=read('gmsv/data/npc/genout/shop_m.create');
assert.ok(shop.includes('floorid=1006'));
assert.ok(shop.includes('borncorner=18,22,18,22'));
assert.ok(shop.includes('enemy=changeevent|file:genout/msg_1006_18_22'));

const grep=(needle)=>{
  try{return execSync("grep -RinE --include='*.template' '"+needle+"' '"+fixedRoot+"/gmsv/data/npc'",{encoding:'utf8'}).trim();}
  catch(e){if(e.status===1)return '';throw e;}
};
assert.equal(grep('templatename[[:space:]]*=[[:space:]]*changeevent'),'');
assert.equal(grep('functionset[[:space:]]*=[[:space:]]*changeevent'),'');
const rows=closure.towns.flatMap(t=>t.coordinateResolvedNpcReachability?.rows||[]).filter(r=>r.template==='changeevent');
assert.equal(rows.length,5);
assert.equal(rows.every(r=>r.reachableInteraction===null),true);

console.log(JSON.stringify({
  pass:true,
  format:audit.format,
  fixedSource:audit.fixedSource,
  startFloorChangeEventInstances:rows.length,
  templateRegistryEntry:false,
  createParserStoresUnknownTemplate:false,
  closureClass:audit.closureClass,
  strictAliasPromotion:false
},null,2));
