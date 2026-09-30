#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args=process.argv.slice(2);
const rootArg=args.indexOf('--source-root');
const outArg=args.indexOf('--out');
const root=path.resolve(rootArg>=0?args[rootArg+1]:'/tmp/StoneAge');
const out=path.resolve(outArg>=0?args[outArg+1]:'data/generated/stoneage_start_encounter_target_index.json');
const FIXED='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const SOURCES={
  encount:{path:'gmsv/data/encount.txt',sha:'89da97a15ea866a36f26ec3bb7ab5490f3eccc5f'},
  group:{path:'gmsv/data/group1.txt',sha:'1be75eb3e56ab16d4b433146ec59538ad651c874'}
};

const sha=c=>crypto.createHash('sha1').update(Buffer.from(\`blob \${Buffer.byteLength(c,'utf8')}\\0\`)).update(c).digest('hex');
function readFixed(spec){
  const content=fs.readFileSync(path.join(root,spec.path),'utf8');
  const got=sha(content);
  if(got!==spec.sha)throw new Error(\`fixed source SHA mismatch for \${spec.path}: \${got}\`);
  return content;
}
function parseE(s){
  return s.split(/\\r?\\n/).map((raw,i)=>({line:i+1,p:raw.split(',')}))
    .filter(r=>r.p.length>=10&&r.p[0]&&!r.p[0].startsWith('#'))
    .map(r=>({index:+r.p[0],floor:+r.p[1],x1:+r.p[2],y1:+r.p[3],x2:+r.p[4],y2:+r.p[5],probMin:+r.p[6],probMax:+r.p[7],enemyMax:+r.p[8],zorder:+r.p[9],groupIds:r.p.slice(10,20).filter(Boolean).map(Number),eventNow:+(r.p[30]||-1),eventEnd:+(r.p[31]||-1)}));
}
function parseG(s){
  const m=new Map();
  for(const raw of s.split(/\\r?\\n/)){const p=raw.split(',');if(p.length<4)continue;const id=+p[1];if(!Number.isFinite(id))continue;const v=p.slice(1).map(x=>x===''?null:+x);m.set(id,{id,name:p[0],appear:v[1],notAppear:v[2],enemyIds:v.slice(3,13).filter(Number.isFinite)});}
  return m;
}
function classify(r,groups){
  if(r.probMax<=0||!r.groupIds.length)return 'placeholder';
  if(r.eventNow>0||r.eventEnd>0)return 'event_conditional';
  const gs=r.groupIds.map(id=>groups.get(id));
  if(gs.some(g=>!g))return 'unresolved_group';
  const conditional=gs.map(g=>[g.appear,g.notAppear].some(v=>v!==null&&v!==-1));
  if(conditional.some(Boolean))return conditional.every(Boolean)?'conditional_item':'mixed';
  return 'unconditional';
}
const encount=parseE(readFixed(SOURCES.encount));
const groups=parseG(readFixed(SOURCES.group));
const route=JSON.parse(fs.readFileSync('data/generated/stoneage_start_destination_warp_coordinates.json','utf8'));
const incoming={100:[],200:[]};
for(const p of route.nextFloorPortals??[]){
  const floor=Number(p.toFloor);
  if(!(floor===100||floor===200))continue;
  const existing=incoming[floor].find(x=>x.id===p.id);
  if(!existing)incoming[floor].push({id:p.id,fromFloor:Number(p.fromFloor),points:[...new Map(p.rows.map(r=>[r.to.join(','),r.to])).values()]});
}
function rect(r){return [Math.min(r.x1,r.x2),Math.min(r.y1,r.y2),Math.max(r.x1,r.x2),Math.max(r.y1,r.y2)]}
function distance(pt,R){const [x1,y1,x2,y2]=R;const x=pt[0]<x1?x1:pt[0]>x2?x2:pt[0],y=pt[1]<y1?y1:pt[1]>y2?y2:pt[1];return Math.abs(pt[0]-x)+Math.abs(pt[1]-y)}
const floors={};
for(const floor of [100,200]){
  const rows=encount.filter(r=>r.floor===floor).map(r=>({...r,classification:classify(r,groups),rect:rect(r)}));
  const landings=incoming[floor].flatMap(p=>p.points);
  const pack=r=>({
    encounterId:r.index,line:r.line,rect:r.rect,probMin:r.probMin,probMax:r.probMax,enemyMax:r.enemyMax,zorder:r.zorder,
    groupIds:r.groupIds,groupProbs:r.groupIds.map((_,i)=>r.parts?.[20+i]===''?null:Number(r.parts?.[20+i])),enemyIds:[...new Set(r.groupIds.flatMap(id=>groups.get(id)?.enemyIds||[]))],
    incoming:{containsGroup:incoming[floor].filter(p=>p.points.some(pt=>pt[0]>=r.rect[0]&&pt[0]<=r.rect[2]&&pt[1]>=r.rect[1]&&pt[1]<=r.rect[3])).map(p=>p.id),nearestLandingDistance:landings.length?Math.min(...landings.map(pt=>distance(pt,r.rect))):null}
  });
  floors[String(floor)]={
    rowCount:rows.length,
    counts:Object.fromEntries(['unconditional','mixed','conditional_item','unresolved_group','event_conditional','placeholder'].map(k=>[k,rows.filter(r=>r.classification===k).length])),
    unconditionalRows:rows.filter(r=>r.classification==='unconditional').map(pack).sort((a,b)=>a.incoming.nearestLandingDistance-b.incoming.nearestLandingDistance||a.encounterId-b.encounterId),
    mixedRows:rows.filter(r=>r.classification==='mixed').map(pack).sort((a,b)=>a.incoming.nearestLandingDistance-b.incoming.nearestLandingDistance||a.encounterId-b.encounterId),
    unresolvedGroupRows:rows.filter(r=>r.classification==='unresolved_group').map(r=>({encounterId:r.index,line:r.line,rect:r.rect,missingGroupIds:r.groupIds.filter(id=>!groups.has(id))}))
  };
}
const result={format:'stoneage-start-encounter-target-index-v1',generatedAt:'2026-09-30',fixedSource:{repository:'gavinlinasd/StoneAge',ref:FIXED,encountBlobSha:SOURCES.encount.sha,groupBlobSha:SOURCES.group.sha},policy:{
  unconditionalRow:'probMax > 0, group list present, no event gate, all referenced groups resolved, and every referenced group has appearByItemId == -1 and notAppearByItemId == -1',
  mixedRow:'at least one unconditional group plus one or more item-gated groups; retained as candidate but not treated as fully unconditional',
  unresolvedRow:'any referenced group is absent from fixed group1.txt; never promoted',
  pathClosure:'This index is source-coordinate evidence only. Exact path-to-region closure requires the matching LS2MAP runtime.'
},incomingPortalGroups:incoming,floors};
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\\n');
console.log(JSON.stringify({out,floors:Object.fromEntries([100,200].map(f=>[f,floors[f].counts]))},null,2));
