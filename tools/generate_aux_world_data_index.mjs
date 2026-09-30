#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(process.argv[process.argv.indexOf('--source-root')+1]||'/tmp/StoneAge');
const out=path.resolve(process.argv[process.argv.indexOf('--out')+1]||'data/generated/stoneage_aux_world_data_index.json');
const ref='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const files={
 mission:'gmsv/data/mission.txt',
 jobdaily:'gmsv/data/jobdaily.txt',
 ride:'gmsv/data/ride.txt',
 leaderride:'gmsv/data/leaderride.txt',
 titleconfig:'gmsv/data/titleconfig.txt',
 titlename:'gmsv/data/titlename.txt',
 question:'gmsv/data/question.txt',
 raceman:'gmsv/data/raceman.txt',
 racequiz:'gmsv/data/racequiz.txt',
 memberpets:'gmsv/data/memberpets.txt',
 membershop:'gmsv/data/membershop.txt',
 needitemeneny:'gmsv/data/needitemeneny.txt',
 contract:'gmsv/data/contract.txt'
};
function sha256(b){return crypto.createHash('sha256').update(b).digest('hex');}
function read(k){const p=path.join(root,files[k]),b=fs.readFileSync(p);return {path:files[k],sizeBytes:b.length,sha256:sha256(b),text:b.toString('utf8').replace(/\r/g,'')};}
function lines(t){return t.split('\n').filter(x=>x.trim()&&!x.trim().startsWith('#'));}
const data={};
for(const k of Object.keys(files)){
 const x=read(k); const ls=lines(x.text);
 data[k]={source:{path:x.path,sizeBytes:x.sizeBytes,sha256:x.sha256},statistics:{nonEmptyLines:ls.length},rawLines:ls};
}
data.mission.parsed=data.mission.rawLines.map(line=>{const p=line.split(',');return {id:Number(p[0]),level:Number(p[1]),eventFlags:p[2]||'',detail:p[3]||'',limitHours:Number(p[4])};});
data.jobdaily.parsed=data.jobdaily.rawLines.map(line=>{const p=line.split('|');return {jobId:p[0]||'',rule:p[1]||'',explain:p[2]||'',state:p[3]||''};});
data.memberpets.parsed=data.memberpets.rawLines.map(line=>{const p=line.trim().split(/\s+/);return p.length>=4?{name:p.slice(0,-3).join(' '),petId:Number(p[p.length-3]),price:Number(p[p.length-2]),flag:Number(p[p.length-1])}:{marker:p[0]};});
data.membershop.parsed=data.membershop.rawLines.map(line=>{if(/^(NEXT|END)\s/.test(line))return {marker:line.trim()};const p=line.trim().split(/\s+/);return p.length>=4?{name:p.slice(0,-3).join(' '),itemId:Number(p[p.length-3]),price:Number(p[p.length-2]),flag:Number(p[p.length-1])}:{raw:line};});
data.ride.parsed=data.ride.rawLines.map(line=>{const p=line.split(',');return {name:p.shift()?.trim()||'',ids:p.map(x=>Number(x.trim())).filter(Number.isFinite)};});
data.titlename.parsed=data.titlename.rawLines.map(line=>{const p=line.split(',');return {id:Number(p[0]),name:p.slice(1).join(',').trim()};});
data.titleconfig.parsed=data.titleconfig.rawLines.map(line=>({raw:line,keys:[...line.matchAll(/([A-Z][A-Z0-9_]+)\s*>?=?/g)].map(m=>m[1])}));
data.raceman.parsed=data.raceman.rawLines.map(line=>{const p=line.split('|');return p.length>=5?{no:Number(p[0]),petName:p[1],bbi:Number(p[2]),lowLv:Number(p[3]),highLv:Number(p[4])}:{raw:line};});
const outObj={format:'stoneage-aux-world-data-index-v1',generatedAt:'2026-09-30',fixedSource:{repository:'gavinlinasd/StoneAge',ref},sources:data,interpretation:{mission:'loaded by LoadMissionList when _ANGEL_SUMMON is enabled',jobdaily:'loaded by LoadJobdailyfile when _JOBDAILY is enabled',raceman:'loaded by LoadRacepetfile when _RACEMAN is enabled',needitemeneny:'legacy/encoded source requires separate decoder; raw source metadata retained',contract:'raw source retained; gameplay activation requires source-function closure'},policy:'This index inventories source data only; it does not enable gameplay.'};
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(outObj,null,2)+'\n');
console.log(JSON.stringify({pass:true,statistics:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,v.statistics.nonEmptyLines])),output:out}));