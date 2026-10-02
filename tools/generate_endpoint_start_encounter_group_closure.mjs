#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ROOT=process.cwd();
const args=process.argv.slice(2);
const fixedArg=args.indexOf('--fixed-source-root');
const fixedRoot=path.resolve(fixedArg>=0?args[fixedArg+1]:'fixed-c-source');
const OUT=path.join(ROOT,'data/generated/stoneage_endpoint_start_encounter_group_closure.json');
const SOURCE={repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56'};
const EP={
 encount:'ro0000/server/merged-source/gmsv/data/encount.txt',
 group:'ro0000/server/merged-source/gmsv/data/group1.txt',
 enemy:'ro0000/server/merged-source/gmsv/data/enemy1.txt',
 enemybase:'ro0000/server/merged-source/gmsv/data/enemybase1.txt'
};
const FX={encount:'gmsv/data/encount.txt',group:'gmsv/data/group1.txt',enemy:'gmsv/data/enemy1.txt',enemybase:'gmsv/data/enemybase1.txt'};
const git=(a,cwd=ROOT)=>execFileSync('git',['-c','core.quotePath=false',...a],{cwd,encoding:'utf8',maxBuffer:64*1024*1024}).trimEnd();
const read=(p,cwd=ROOT)=>fs.readFileSync(path.join(cwd,p),'utf8');
const blobSha=(p)=>{const b=fs.readFileSync(path.join(ROOT,p));return crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');};
const rows=t=>t.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).filter(x=>!x.startsWith('#'));
const find=(t,col,v)=>{for(const l of rows(t)){const p=l.split(',');if(Number(p[col])===Number(v))return l;}return null;};
const enc=(t,id)=>{const l=find(t,0,id);if(!l)return null;const p=l.split(',');return{id:Number(p[0]),floorId:Number(p[1]),rect:p.slice(2,6).map(Number),probMin:Number(p[6]),probMax:Number(p[7]),enemyMax:Number(p[8]),zorder:Number(p[9]),groupIds:p.slice(10,20).map(Number).filter(Number.isInteger),groupProbs:p.slice(20,30).map(v=>v===''?0:Number(v)),line:l};};
const grp=(t,id)=>{const l=find(t,1,id);if(!l)return null;const p=l.split(',');return{groupId:Number(p[1]),appearByItemId:Number(p[2]),notAppearByItemId:Number(p[3]),members:Array.from({length:10},(_,i)=>({slot:i+1,enemyId:Number(p[4+i]),createProb:p[14+i]===''?0:Number(p[14+i])})).filter(x=>Number.isInteger(x.enemyId)&&x.enemyId>0&&x.createProb>0),line:l};};
const enemy=(t,id)=>{const l=find(t,3,id);if(!l)return null;const p=l.split(',');return{enemyId:Number(p[3]),tempNo:Number(p[4]),levelMin:Number(p[5]),levelMax:Number(p[6]),createMaxNum:Number(p[7]),createMinNum:Number(p[8]),tactics:Number(p[9]),exp:Number(p[10]),duelPoint:Number(p[11]),style:Number(p[12]),petFlg:Number(p[13]),line:l};};
const base=(t,temp)=>{const l=find(t,6,temp);if(!l)return null;const p=l.split(',');return{tempNo:Number(p[6]),name:p[0],initNum:Number(p[7]),lvupPoint:Number(p[8]),baseVital:Number(p[9]),baseStr:Number(p[10]),baseTgh:Number(p[11]),baseDex:Number(p[12]),line:l};};
const sameEnemy=(a,b)=>!!a&&!!b&&['enemyId','tempNo','levelMin','levelMax','createMaxNum','createMinNum','tactics','exp','duelPoint','style','petFlg'].every(k=>a[k]===b[k]);
const epE=read(EP.encount),epG=read(EP.group),epN=read(EP.enemy),epB=read(EP.enemybase);
const fxE=read(FX.encount,fixedRoot),fxG=read(FX.group,fixedRoot),fxN=read(FX.enemy,fixedRoot),fxB=read(FX.enemybase,fixedRoot);
const ep=enc(epE,65),fx=enc(fxE,65);
if(!ep||!fx)throw new Error('Encounter 65 missing from endpoint or fixed-C source');
const groups=[89,92,94].map(groupId=>{
 const eg=grp(epG,groupId),fg=grp(fxG,groupId);if(!eg||!fg)throw new Error('Required first-route Group missing: '+groupId);
 const ids=[...new Set([...(eg.members||[]),...(fg.members||[])].map(x=>x.enemyId))];
 return{groupId,endpoint:eg,fixed:fg,exactLineMatch:eg.line===fg.line,enemyMembersMatch:JSON.stringify(eg.members)===JSON.stringify(fg.members),itemGatesClosed:eg.appearByItemId===-1&&eg.notAppearByItemId===-1,enemies:ids.map(enemyId=>{const ee=enemy(epN,enemyId),fe=enemy(fxN,enemyId);if(!ee||!fe)throw new Error('Required first-route Enemy missing: '+enemyId);const eb=base(epB,ee.tempNo),fb=base(fxB,fe.tempNo);if(!eb||!fb)throw new Error('Required first-route EnemyBase missing: '+ee.tempNo);return{enemyId,endpoint:ee,fixed:fe,semanticCoreMatch:sameEnemy(ee,fe),base:{tempNo:ee.tempNo,endpoint:eb,fixed:fb,exactLineMatch:eb.line===fb.line}};})};
});
const shape=ep.floorId===100&&JSON.stringify(ep.rect)==='[568,538,610,578]'&&ep.probMin===1&&ep.probMax===5&&ep.enemyMax===4&&ep.zorder===30&&JSON.stringify(ep.groupIds.filter(x=>x>0))==='[89,92,94]'&&JSON.stringify(ep.groupProbs.slice(0,3))==='[1,1,1]';
const closed=groups.every(g=>g.exactLineMatch&&g.enemyMembersMatch&&g.itemGatesClosed&&g.enemies.every(e=>e.semanticCoreMatch&&e.base.exactLineMatch));
const result={format:'stoneage-endpoint-start-encounter-group-closure-v1',generatedAt:new Date().toISOString().slice(0,10),purpose:'Endpoint-primary source closure for the first verified hunting encounter boundary.',source:{endpoint:{encountPath:EP.encount,groupPath:EP.group,enemyPath:EP.enemy,enemybasePath:EP.enemybase,encountBlobSha:blobSha(EP.encount),groupBlobSha:blobSha(EP.group),enemyBlobSha:blobSha(EP.enemy),enemybaseBlobSha:blobSha(EP.enemybase)},fixedC:{repository:SOURCE.repository,ref:SOURCE.ref,encountBlobSha:git(['rev-parse','HEAD:gmsv/data/encount.txt'],fixedRoot),groupBlobSha:git(['rev-parse','HEAD:gmsv/data/group1.txt'],fixedRoot),enemyBlobSha:git(['rev-parse','HEAD:gmsv/data/enemy1.txt'],fixedRoot),enemybaseBlobSha:git(['rev-parse','HEAD:gmsv/data/enemybase1.txt'],fixedRoot)}},encounter:{encounterId:65,endpoint:ep,fixed:fx,exactLineMatch:ep.line===fx.line,shapeMatchesVerifiedTarget:shape},groups,conclusion:{status:(ep.line===fx.line&&shape&&closed)?'closed-for-first-route':'unresolved',endpointPrimary:true,fixedCBaselineOnly:true,crossVersionFallbackUsed:false,syntheticGroupSubstitution:false,groupClosure:closed}};
const text=JSON.stringify(result,null,2)+'\n';
if(args.includes('--check')){if(!fs.existsSync(OUT))throw new Error('Missing endpoint first-route group closure audit');if(fs.readFileSync(OUT,'utf8')!==text)throw new Error('Endpoint first-route group closure audit is stale.');console.log('endpoint-start-encounter-group-closure-check-ok');}
else{fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,text);console.log(JSON.stringify({pass:result.conclusion.status==='closed-for-first-route',output:OUT,conclusion:result.conclusion},null,2));}
