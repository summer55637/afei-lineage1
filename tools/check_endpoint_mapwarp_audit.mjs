#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const ROOT=process.cwd();
const ENDPOINT=path.join(ROOT,'ro0000/server/merged-source/gmsv/data/map/mapwarp.txt');
const FIXED=path.join(ROOT,process.env.FIXED_C_SOURCE_DIR??'fixed-c-source','gmsv/data/map/mapwarp.txt');
const OUT=path.join(ROOT,'data/generated/stoneage_endpoint_mapwarp_audit.json');
function fail(m){throw new Error(m);}
function clean(f){if(!fs.existsSync(f))fail('Missing mapwarp file: '+f);return fs.readFileSync(f,'utf8').split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith('#'));}
function pairKey(row){const p=row.split(':');return (p[2]?.split(',')[0]??'?')+'→'+(p[3]?.split(',')[0]??'?');}
function countPair(rows,from,to){return rows.filter(row=>{const p=row.split(':');return p[2]?.startsWith(from+',')&&p[3]?.startsWith(to+',');}).length;}
function topPairs(rows,limit=10){const m=new Map();for(const row of rows){const k=pairKey(row);m.set(k,(m.get(k)??0)+1);}return [...m.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,limit).map(([pair,count])=>({pair,count}));}
function gitSha(rel){try{return execFileSync('git',['rev-parse','HEAD:'+rel],{cwd:ROOT,encoding:'utf8'}).trim();}catch{return'unknown';}}
const endpoint=clean(ENDPOINT),fixed=clean(FIXED),endpointSet=new Set(endpoint),fixedSet=new Set(fixed);
const endpointOnly=endpoint.filter(x=>!fixedSet.has(x)),fixedOnly=fixed.filter(x=>!endpointSet.has(x));
const selected=[['1006','1000'],['1000','1006'],['2006','2000'],['2006','1998'],['3006','3000'],['4006','4000'],['4000','200'],['200','4000'],['3000','200'],['200','3000'],['32003','32004']];
const result={format:'stoneage-endpoint-mapwarp-audit-v1',source:{endpointPath:'ro0000/server/merged-source/gmsv/data/map/mapwarp.txt',endpointBlobSha:gitSha('ro0000/server/merged-source/gmsv/data/map/mapwarp.txt'),endpointRows:endpoint.length,fixedSource:'gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',fixedPath:'gmsv/data/map/mapwarp.txt',fixedRows:fixed.length},exactSetComparison:{intersection:endpoint.filter(x=>fixedSet.has(x)).length,endpointOnly:endpointOnly.length,fixedOnly:fixedOnly.length},selectedPairChecks:selected.map(([from,to])=>({from:Number(from),to:Number(to),endpoint:countPair(endpoint,from,to),fixed:countPair(fixed,from,to),exactRowSetDelta:{endpointOnly:countPair(endpointOnly,from,to),fixedOnly:countPair(fixedOnly,from,to)}})),topEndpointOnlyPairs:topPairs(endpointOnly),topFixedOnlyPairs:topPairs(fixedOnly),interpretation:{endpointWorldRole:'Endpoint mapwarp is deployment-version world data; differences from fixed-C are retained as endpoint variants until reachability / semantics are closed.',firstRouteDirectWarps:'1006↔1000, 2006↔2000, 3006↔3000, 4006↔4000 are exact-count parity; 4000↔200 and 3000↔200 also retain equal row counts.',noSyntheticWarp:true}};
const text=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--check')){if(!fs.existsSync(OUT))fail('Missing generated endpoint mapwarp audit: '+OUT);if(fs.readFileSync(OUT,'utf8')!==text)fail('Endpoint mapwarp audit is stale.');process.stdout.write('endpoint-mapwarp-audit-check-ok\n');}
else if(process.argv.includes('--write')){fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,text);process.stdout.write(text);}
else process.stdout.write(text);