#!/usr/bin/env node
import fs from 'node:fs';

const input='data/generated/stoneage_mapwarp_source_index.json';
const output='data/generated/stoneage_world_graph_index.json';

const src=JSON.parse(fs.readFileSync(input,'utf8'));
const rows=src.rows||[];
const nodeSet=new Set();
const edgeMap=new Map();
const outDegree=new Map();
const inDegree=new Map();
const adjacency=new Map();

function addMap(m,k,v=1){m.set(k,(m.get(k)||0)+v);}
function nodeId(p){return String(p.floor);}
function pairId(a,b){return nodeId(a)+'>'+nodeId(b);}
function undirectedAdj(a,b){
  (adjacency.get(a)||adjacency.set(a,new Set()).get(a)).add(b);
  (adjacency.get(b)||adjacency.set(b,new Set()).get(b)).add(a);
}

let sameFloorRows=0,crossFloorRows=0,selfLoopRows=0;
const eventTypes={};
for(const r of rows){
  if(!r.from||!r.to) continue;
  const a=nodeId(r.from), b=nodeId(r.to);
  nodeSet.add(a); nodeSet.add(b);
  const key=pairId(r.from,r.to);
  const e=edgeMap.get(key)||{fromFloor:r.from.floor,toFloor:r.to.floor,rowCount:0,eventTypes:{}};
  e.rowCount++;
  e.eventTypes[r.eventType]=(e.eventTypes[r.eventType]||0)+1;
  edgeMap.set(key,e);
  addMap(outDegree,a); addMap(inDegree,b); undirectedAdj(a,b);
  eventTypes[r.eventType]=(eventTypes[r.eventType]||0)+1;
  if(r.from.floor===r.to.floor) sameFloorRows++; else crossFloorRows++;
  if(a===b) selfLoopRows++;
}

const visited=new Set(),components=[];
for(const start of nodeSet){
  if(visited.has(start)) continue;
  const stack=[start]; visited.add(start); const nodes=[];
  while(stack.length){
    const n=stack.pop(); nodes.push(Number(n));
    for(const next of adjacency.get(n)||[]){
      if(!visited.has(next)){visited.add(next);stack.push(next);}
    }
  }
  components.push(nodes.sort((a,b)=>a-b));
}
components.sort((a,b)=>b.length-a.length);
const sortedEdges=[...edgeMap.values()].sort((a,b)=>b.rowCount-a.rowCount || a.fromFloor-b.fromFloor || a.toFloor-b.toFloor);
const top=(m,n=30)=>[...m.entries()].sort((a,b)=>b[1]-a[1]||Number(a[0])-Number(b[0])).slice(0,n).map(([floor,count])=>({floor:Number(floor),count}));

const graph={
  format:'stoneage-world-graph-index-v1',
  generatedAt:'2026-09-30',
  fixedSource:src.fixedSource,
  statistics:{
    mapwarpRows:rows.length,
    floorNodes:nodeSet.size,
    directedFloorEdges:edgeMap.size,
    sameFloorRows,
    crossFloorRows,
    selfLoopRows,
    weakComponentCount:components.length,
    largestWeakComponentNodes:components[0]?.length||0,
    eventTypes,
    topOutboundFloors:top(outDegree),
    topInboundFloors:top(inDegree)
  },
  directedFloorEdges:sortedEdges,
  weakComponents:components.slice(0,100).map(c=>({size:c.length,floors:c}))
};

fs.writeFileSync(output,JSON.stringify(graph,null,2)+'\n');
console.log(JSON.stringify({pass:true,statistics:graph.statistics,output}));
