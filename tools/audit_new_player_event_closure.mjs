#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args=process.argv.slice(2);
const root=path.resolve((()=>{const i=args.indexOf('--source-root');return i>=0?args[i+1]:'/tmp/StoneAge';})());
const out=path.resolve((()=>{const i=args.indexOf('--out');return i>=0?args[i+1]:'data/generated/stoneage_new_player_event_closure.json';})());
const ref='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

const sha=(text)=>{
 const b=Buffer.from(text,'utf8');
 return crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`,'utf8')).update(b).digest('hex');
};
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const ownerPath='gmsv/data/npc/almark/xinshou/xinshou.create';
const scriptPath='gmsv/data/npc/almark/xinshou/xinshoujd.arg';
const templatePath='gmsv/src/npc/npctemplate.c';
const owner=read(ownerPath);
const script=read(scriptPath);
const template=read(templatePath);
const ownerSha=sha(owner),scriptSha=sha(script),templateSha=sha(template);
if(ownerSha!=='335470114a567f9d1a2c0a2369fc283043db920b') throw new Error(`owner blob SHA mismatch: ${ownerSha}`);
if(scriptSha!=='62dec9dc760731a90f6f0c2ab3c0a01cf5c6b0c9') throw new Error(`script blob SHA mismatch: ${scriptSha}`);
if(templateSha!=='9f487fea0229d6aeaa7d1739fa5a19c4dfc31003') throw new Error(`npctemplate blob SHA mismatch: ${templateSha}`);
if(/templatename\s*=\s*changeevent/i.test(template)) throw new Error('unexpected changeevent template found in pinned npctemplate.c');

const floors=[1006,2006,3006,4006];
const ownerChecks=floors.map(floorId=>{
 const needle=`floorid=${floorId}`;
 const count=(owner.match(new RegExp(needle,'g'))||[]).length;
 return {floorId,count,hasSharedScript:owner.includes('enemy=changeevent|file:almark/xinshou/xinshoujd.arg')};
});
if(ownerChecks.some(x=>x.count!==1||!x.hasSharedScript)) throw new Error(JSON.stringify(ownerChecks));

const required=[
 ['TRANS=0&LV<100&ENDEV!=366','EndSetFlg:366'],
 ['TRANS=0&LV>99&LV<140&ENDEV!=365','EndSetFlg:365'],
 ['TRANS=0&LV>139&LV<150&ENDEV!=364','EndSetFlg:364'],
 ['TRANS=0&LV=150&ENDEV!=363','EndSetFlg:363']
];
for(const [condition,flag] of required){
 if(!script.includes(condition)||!script.includes(flag)) throw new Error(`missing branch: ${condition} / ${flag}`);
}
const itemIds=[20145,2849,20228,18537,20866,2912,2909,2911,20867,19567,19568,19569,20615,20616,20617,20635];
const petIds=[341,2057,1645,1479,2547];
const itemset6=fs.readFileSync(path.join(root,'gmsv/data/itemset6.txt'),'utf8');
const enemy1=fs.readFileSync(path.join(root,'gmsv/data/enemy1.txt'),'utf8');
const ENEMY_ID_TOKEN_INDEX=3; // _BATTLENPC_WARP_PLAYER is enabled in pinned version.h
const itemFound=itemIds.filter(id=>itemset6.split(/\r?\n/).some(line=>Number(line.split(',')[16])===id));
const petFound=petIds.filter(id=>enemy1.split(/\r?\n/).some(line=>Number(line.split(',')[ENEMY_ID_TOKEN_INDEX])===id));
const result={
 format:'stoneage-new-player-event-closure-v2',
 generatedAt:'2026-09-30',
 fixedSource:{repository:'gavinlinasd/StoneAge',ref},
 source:{ownerPath,ownerBlobSha:ownerSha,scriptPath,scriptBlobSha:scriptSha,templatePath,templateBlobSha:templateSha,changeeventPresent:false},
 statistics:{ownerFloorsVerified:ownerChecks.filter(x=>x.count===1).length,changeeventTemplatePresent:false,itemIds:itemIds.length,itemIdsFoundInItemset6:itemFound.length,petIds:petIds.length,petIdsFoundAsEnemyIds:petFound.length},
 ownerChecks,
 rewardResolution:{itemIdsFoundInItemset6:itemFound,petIdsFoundAsEnemyIds:petFound},
 runtimeResolution:{templatePath,templateBlobSha:templateSha,changeeventPresent:false,createParser:'gmsv/src/npc/npccreate.c::NPC_templateGetTemplateIndex',status:'unresolved'},
 status:{owner:'script_reference_closed_template_unresolved',runtimeModule:'unresolved',branchLogic:'closed',rewardDefinitions:itemFound.length===itemIds.length&&petFound.length===petIds.length?'closed':'partial'}
};
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({pass:true,out,statistics:result.statistics,status:result.status},null,2));
