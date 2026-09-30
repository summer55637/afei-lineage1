#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args=process.argv.slice(2);
const value=(name,fallback=null)=>{const i=args.indexOf(name);return i>=0?args[i+1]:fallback;};
const itemMakePath=path.resolve(value('--item-make','data/generated/stoneage_item_make_runtime.json'));
const closurePath=path.resolve(value('--closure','data/generated/stoneage_new_player_event_closure.json'));
const out=path.resolve(value('--out','data/generated/stoneage_new_player_item_reward_runtime.json'));

function fail(message){throw new Error(message);}
const itemMake=JSON.parse(fs.readFileSync(itemMakePath,'utf8'));
const closure=JSON.parse(fs.readFileSync(closurePath,'utf8'));

if(itemMake.format!=='stoneage-item-make-runtime-v2')fail('item make catalog format drift');
if(itemMake.itemDataIntCount!==66)fail('item make field count drift');

const requested=[...new Set((closure.rewardClosure?.itemIds??[]).map(Number).filter(Number.isInteger))];
if(requested.length===0)fail('closure contains no reward Item IDs');

const byItemId={};
for(const id of requested){
  const row=itemMake.byItemId?.[String(id)];
  if(!row)fail('reward Item ID missing from item make runtime: '+id);
  const entry={itemId:id,b:Array.isArray(row.b)?row.b.slice():[],w:Array.isArray(row.w)?row.w.slice():[]};
  if(row.f)entry.f=row.f;
  if(row.g!==undefined)entry.g=row.g;
  byItemId[String(id)]=entry;
}

const focused={
  format:'stoneage-new-player-item-reward-runtime-v1',
  generatedAt:'2026-09-30',
  fixedSource:itemMake.source,
  fixedBuild:itemMake.fixedBuild,
  itemDataIntCount:itemMake.itemDataIntCount,
  itemDataIntOrder:itemMake.itemDataIntOrder,
  playerBackpackStart:9,
  playerBackpackEnd:23,
  stats:{requestedItemIds:requested.length,resolvedItemIds:Object.keys(byItemId).length},
  itemIds:requested,
  byItemId,
  upstream:{format:itemMake.format,catalogPath:path.relative(process.cwd(),itemMakePath).replaceAll(path.sep,'/')},
  policy:'Only Item IDs explicitly referenced by the new-player event closure are promoted; runtime creation still flows through the shared 66-field Item allocator.'
};

fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(focused,null,2)+'\n');
console.log(JSON.stringify({pass:true,stats:focused.stats,source:focused.fixedSource,out}));
