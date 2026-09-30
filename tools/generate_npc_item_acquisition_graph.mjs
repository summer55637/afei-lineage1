#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args=process.argv.slice(2);
const root=path.resolve(args[args.indexOf('--source-root')+1]||'/tmp/StoneAge');
const out=path.resolve(args[args.indexOf('--out')+1]||'data/generated/stoneage_npc_item_acquisition_graph.json');
const ref='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

function walk(dir,out=[]){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory())walk(p,out);
    else if(e.isFile())out.push(p);
  }
  return out;
}
function rel(p){return path.relative(root,p).replaceAll(path.sep,'/');}
function clean(s){return s.trim();}
function parseBlocks(text){
  const lines=text.replace(/\r/g,'').split('\n');
  const blocks=[]; let cur=null;
  for(let i=0;i<lines.length;i++){
    const raw=lines[i], line=raw.trim();
    if(/^EventNo\s*:/i.test(line)){
      if(cur)blocks.push(cur);
      cur={startLine:i+1,eventNo:Number((line.split(':')[1]||'').trim()),lines:[raw],fields:{actions:[]}};
      continue;
    }
    if(cur){
      cur.lines.push(raw);
      if(/^EventEnd\s*$/i.test(line)){
        blocks.push(cur);cur=null;
      }
    }
  }
  if(cur)blocks.push(cur);
  for(const b of blocks){
    let field=null;
    for(const raw of b.lines){
      const line=raw.trim();
      if(!line||line.startsWith('#'))continue;
      const m=line.match(/^([A-Za-z][A-Za-z0-9_]*)\s*:(.*)$/);
      if(m){
        const k=m[1],v=m[2].trim();
        if(k==='EventNo')continue;
        b.fields[k]??=[];
        b.fields[k].push(v);
        if(['AddItem','GetRandItem','GetItem','DelItem','GetPet','DelPet','AddGold','DelGold','EndSetFlg','Event_End','Event_Now','EvEnd','EvNow'].includes(k))
          b.fields.actions.push({role:k,value:v,line:b.lines.indexOf(raw)+b.startLine});
      }
    }
  }
  return blocks;
}
function parseItemIds(v){
  const out=[];
  for(const token of String(v).split(',')){
    const m=token.trim().match(/^(-?\d+)/);
    if(m)out.push(Number(m[1]));
  }
  return out;
}
function refsFromCondition(v){
  const out=[];
  const rx=/(?:ITEM|ITEM=|ITEM!=|ITEM>|ITEM<)\s*=?\s*(-?\d+)/gi;
  for(const m of String(v).matchAll(rx))out.push(Number(m[1]));
  return [...new Set(out)];
}
function parseCreateFiles(){
  const rootNpc=path.join(root,'gmsv/data/npc');
  const files=walk(rootNpc).filter(p=>/\.create$|\.creata$/i.test(p)).sort();
  const inst=[];
  for(const p of files){
    const lines=fs.readFileSync(p,'utf8').replace(/\r/g,'').split('\n');
    let cur=null;let inBlock=false;let blockIndex=0;
    for(let i=0;i<lines.length;i++){
      const raw=lines[i],line=raw.trim();
      if(line==='{'){inBlock=true;cur={path:rel(p),blockIndex,startLine:i+1,kv:{}};continue;}
      if(inBlock&&cur){
        if(line==='}'){
          const enemy=(cur.kv.enemy||[]).map(v=>{
            const m=v.match(/^([^|]+)\|file:(.+)$/i);
            return {raw:v,templateName:m?.[1]?.trim()||v.trim(),fileRef:m?.[2]?.trim().replaceAll('\\\\','/')||null};
          });
          inst.push({
            path:cur.path,blockIndex:cur.blockIndex,startLine:cur.startLine,
            floorId:Number(cur.kv.floorid?.[0]),x:Number((cur.kv.borncenter?.[0]||'').split(',')[0]),
            y:Number((cur.kv.borncenter?.[0]||'').split(',')[1]),
            name:cur.kv.name?.[0]||null,graphicName:cur.kv.graphicname?.[0]||null,
            templateEnemies:enemy
          });
          cur=null;inBlock=false;blockIndex++;continue;
        }
        const eq=line.indexOf('=');
        if(eq>0){
          const k=clean(line.slice(0,eq)).toLowerCase(),v=clean(line.slice(eq+1));
          (cur.kv[k]??=[]).push(v);
        }
      }
    }
  }
  return inst;
}

const itemText=fs.readFileSync(path.join(root,'gmsv/data/itemset6.txt'),'utf8').replace(/\r/g,'');
const itemMap=new Map();
for(const line of itemText.split('\n')){
  if(!line.trim()||line.trim().startsWith('#'))continue;
  const c=line.split(',');
  const id=Number((c[16]??'').trim());
  if(Number.isInteger(id)&&id>=0)itemMap.set(id,{name:(c[0]??'').trim(),secretName:(c[1]??'').trim()});
}

const instances=parseCreateFiles();
const nodes=[],edges=[],unresolvedFiles=new Set();
let npcInstancesWithArg=0,eventBlocks=0,itemEdges=0,petEdges=0,goldEdges=0;
const eventSeen=new Map();

for(const npc of instances){
  for(const enemy of npc.templateEnemies){
    if(!enemy.fileRef)continue;
    const argPath=path.join(root,'gmsv/data/npc',enemy.fileRef);
    if(!fs.existsSync(argPath)){unresolvedFiles.add(enemy.fileRef);continue;}
    npcInstancesWithArg++;
    const argRel=rel(argPath);
    const blocks=parseBlocks(fs.readFileSync(argPath,'utf8'));
    for(let bi=0;bi<blocks.length;bi++){
      const b=blocks[bi];eventBlocks++;
      const evKey=argRel+'#'+bi;
      const evNode={
        id:evKey,path:argRel,blockIndex:bi,startLine:b.startLine,eventNo:b.eventNo,
        type:b.fields.TYPE?.[0]||null,event:b.fields.EVENT?.[0]||null,
        conditionTokens:{
          itemIds:(b.fields.EVENT||[]).flatMap(refsFromCondition),
          nowEventIds:(b.fields.FREE||[]).flatMap(v=>[...String(v).matchAll(/NOWEV\s*=\s*(-?\d+)/gi)].map(m=>Number(m[1]))),
          endEventIds:(b.fields.FREE||[]).flatMap(v=>[...String(v).matchAll(/ENDEV\s*=\s*(-?\d+)/gi)].map(m=>Number(m[1]))),
          petConditions:(b.fields.EVENT||[]).filter(v=>/PET\s*[=<>]/i.test(v))
        }
      };
      nodes.push({type:'npc',id:npc.path+'#'+npc.blockIndex,floorId:npc.floorId,name:npc.name,createPath:npc.path,templateName:enemy.templateName});
      nodes.push({type:'event',...evNode,npcId:npc.path+'#'+npc.blockIndex,argPath:argRel});
      edges.push({type:'npc_has_event',from:npc.path+'#'+npc.blockIndex,to:evKey});
      const tracked=eventSeen.get(String(b.eventNo))||{eventNo:b.eventNo,occurrences:0,types:new Set(),argFiles:new Set(),sampleEvents:[]};
      tracked.occurrences++;if(b.fields.TYPE?.[0])tracked.types.add(b.fields.TYPE[0]);tracked.argFiles.add(argRel);if(tracked.sampleEvents.length<8)tracked.sampleEvents.push({argPath:argRel,blockIndex:bi,event:b.fields.EVENT?.[0]||null});
      eventSeen.set(String(b.eventNo),tracked);

      for(const action of b.fields.actions){
        if(['AddItem','GetRandItem','GetItem','DelItem'].includes(action.role)){
          for(const id of parseItemIds(action.value)){
            itemEdges++;
            const resolved=itemMap.has(id);
            if(action.role==='GetRandItem'){} 
            edges.push({type:'item_action',from:evKey,to:'item:'+id,role:action.role,itemId:id,resolved,item:itemMap.get(id)||null,line:action.line,value:action.value});
          }
        } else if(['GetPet','DelPet'].includes(action.role)){
          petEdges++;edges.push({type:'pet_action',from:evKey,role:action.role,value:action.value,line:action.line});
        } else if(['AddGold','DelGold'].includes(action.role)){
          goldEdges++;edges.push({type:'gold_action',from:evKey,role:action.role,value:action.value,line:action.line});
        } else if(['EndSetFlg','Event_End','Event_Now','EvEnd','EvNow'].includes(action.role)){
          edges.push({type:'event_state_action',from:evKey,role:action.role,value:action.value,line:action.line});
        }
      }
      for(const id of evNode.conditionTokens.itemIds)
        edges.push({type:'item_condition',from:evKey,to:'item:'+id,role:'EVENT_ITEM',itemId:id,resolved:itemMap.has(id),item:itemMap.get(id)||null});
    }
  }
}

const eventSummary=[...eventSeen.values()].filter(x=>Number.isInteger(x.eventNo)&&x.eventNo>=0).map(x=>({eventNo:x.eventNo,occurrences:x.occurrences,types:[...x.types].sort(),uniqueArgFiles:x.argFiles.size,samples:x.sampleEvents})).sort((a,b)=>b.occurrences-a.occurrences||a.eventNo-b.eventNo);
const sentinelEventBlocks=[...eventSeen.values()].find(x=>x.eventNo===-1)?.occurrences||0;

const index={
  format:'stoneage-npc-item-acquisition-graph-v1',
  generatedAt:'2026-09-30',
  fixedSource:{repository:'gavinlinasd/StoneAge',ref},
  statistics:{
    npcCreateInstances:instances.length,npcInstancesWithArg,
    unresolvedArgFiles:unresolvedFiles.size,eventBlocks,
    itemActionEdges:itemEdges,petActionEdges:petEdges,goldActionEdges:goldEdges,
    eventStateActionEdges:edges.filter(x=>x.type==='event_state_action').length,
    itemConditionEdges:edges.filter(x=>x.type==='item_condition').length,
    uniqueEventNoNodes:eventSummary.length,
    sentinelEventNoMinusOneBlocks:sentinelEventBlocks,
    unresolvedItemActionEdges:edges.filter(x=>x.type==='item_action'&&!x.resolved).length,
    unresolvedItemConditionEdges:edges.filter(x=>x.type==='item_condition'&&!x.resolved).length
  },
  unresolvedArgFiles:[...unresolvedFiles].sort(),
  eventNoSummary:eventSummary,
  nodes,
  edges,
  policy:'This is a source graph only. It does not infer quest meaning beyond explicit source roles and does not promote unresolved items/events.'
};

fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(index,null,2)+'\n');
console.log(JSON.stringify({pass:true,statistics:index.statistics,unresolvedArgFiles:index.unresolvedArgFiles,topEventNos:eventSummary.slice(0,20),output:out}));
