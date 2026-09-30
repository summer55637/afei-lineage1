#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parseLS2Map } from './stoneage_ls2map_parser.mjs';

const args=process.argv.slice(2);
const value=(flag, fallback=null)=>{
  const i=args.indexOf(flag);
  return i>=0 ? args[i+1] : fallback;
};
const sourceRoot=path.resolve(value('--source-root','/tmp/StoneAge'));
const sourcePath=value('--source-path');
const floor=Number(value('--floor'));
const outPath=path.resolve(value('--out',`data/generated/stoneage_map_${floor}.json`));
const indexPath=path.resolve(value('--index','data/generated/stoneage_map_runtime_index.json'));
if(!Number.isFinite(floor)||!sourcePath){
  console.error('usage: node tools/generate_verified_map_runtime.mjs --floor <floor> --source-path <path> [--source-root <root>] [--out <json>] [--index <json>]');
  process.exit(2);
}

const FIXED_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const SOURCE_REPO='gavinlinasd/StoneAge';
const blobSha=(bytes)=>{
  const header=Buffer.from(`blob ${bytes.length}\0`,'utf8');
  return crypto.createHash('sha1').update(header).update(bytes).digest('hex');
};
const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const mapFile=path.join(sourceRoot,sourcePath);
const bytes=fs.readFileSync(mapFile);
const actualSha=blobSha(bytes);
const map=parseLS2Map(bytes);
if(map.id!==floor) throw new Error(`floor mismatch: requested ${floor}, source header ${map.id}`);

const mapset=readJson('data/generated/stoneage_mapset_runtime.json');
const battle=readJson('data/generated/stoneage_battlefield_source_manifest.json');
const assignments=Array.isArray(battle.assignments)?battle.assignments:[];
const resolveCandidates=(imageId)=>{
  const rows=assignments.filter(row=>Number(imageId)>=Number(row.start)&&Number(imageId)<=Number(row.end));
  if(rows.length!==1) return null;
  return rows[0].battlemaps.map(Number);
};

const uniqueTiles=[...new Set(Array.from(map.tiles).map(Number))];
const uniqueObjects=[...new Set(Array.from(map.objects).map(Number))];
const uniqueImageIds=[...new Set([...uniqueTiles,...uniqueObjects])];
const unknownMapsetIds=uniqueImageIds.filter(id=>!Object.prototype.hasOwnProperty.call(mapset.walkableByImageId||{},String(id)));
const missingBattleCandidates=uniqueTiles.filter(id=>!Array.isArray(resolveCandidates(id))||resolveCandidates(id).length!==3);
if(unknownMapsetIds.length||missingBattleCandidates.length){
  throw new Error(JSON.stringify({unknownMapsetIds,missingBattleCandidates},null,2));
}

const rawName=bytes.subarray(8,40);
const result={
  schemaVersion:1,
  version:'V3.13',
  source:{
    repository:SOURCE_REPO,
    ref:FIXED_REF,
    path:sourcePath,
    blobSha:actualSha,
    parser:'gmsv/src/map/readmap.c::MAP_readMapOne'
  },
  floorId:map.id,
  width:map.width,
  height:map.height,
  name:map.name,
  nameEncoding:'GBK',
  nameRawHex:rawName.toString('hex'),
  tileCount:map.tiles.length,
  objectCount:map.objects.length,
  uniqueTileCount:uniqueTiles.length,
  uniqueObjectCount:uniqueObjects.length,
  uniqueImageCount:uniqueImageIds.length,
  tiles:Array.from(map.tiles),
  objects:Array.from(map.objects),
  battlemapResolver:{
    source:'gmsv/src/battle/battle.c::BATTLE_getBattleFieldNo',
    selection:'RAND(0,2)',
    candidatesByImageId:Object.fromEntries(uniqueTiles.map(id=>[String(id),resolveCandidates(id)]))
  }
};

fs.mkdirSync(path.dirname(outPath),{recursive:true});
fs.writeFileSync(outPath,JSON.stringify(result,null,2)+'\n');

const index=fs.existsSync(indexPath)?readJson(indexPath):{
  schemaVersion:1,
  version:'V3.13',
  source:{repository:SOURCE_REPO,ref:FIXED_REF},
  maps:{}
};
index.schemaVersion=1;
index.version='V3.13';
index.source={repository:SOURCE_REPO,ref:FIXED_REF};
index.maps= index.maps||{};
index.maps[String(map.id)]={
  path:path.relative(process.cwd(),outPath).replaceAll(path.sep,'/'),
  floorId:map.id,
  width:map.width,
  height:map.height,
  tileCount:map.tiles.length,
  objectCount:map.objects.length,
  uniqueTileCount:uniqueTiles.length,
  uniqueObjectCount:uniqueObjects.length,
  sourceBlobSha:actualSha,
  sourcePath
};
fs.writeFileSync(indexPath,JSON.stringify(index,null,2)+'\n');

console.log(JSON.stringify({
  pass:true,
  floorId:map.id,
  sourcePath,
  sourceBlobSha:actualSha,
  width:map.width,
  height:map.height,
  tileCount:map.tiles.length,
  uniqueTiles:uniqueTiles.length,
  output:outPath,
  runtimeIndex:indexPath
},null,2));
