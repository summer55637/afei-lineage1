#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const args=process.argv.slice(2);
const value=(name,fallback=null)=>{const i=args.indexOf(name);return i>=0?args[i+1]:fallback;};
const root=path.resolve(value('--source-root','/tmp/StoneAge'));
const out=path.resolve(value('--out','data/generated/stoneage_new_player_seed_runtime.json'));
const fixedRef='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

function fail(message){console.error('New-player Seed generation FAILED:',message);process.exit(1);}
function read(rel){
  const p=path.join(root,rel);
  if(!fs.existsSync(p))fail('missing source file: '+rel);
  return fs.readFileSync(p);
}
if(!fs.existsSync(root))fail('source root missing: '+root);
if(fs.existsSync(path.join(root,'.git'))){
  try{
    const head=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
    if(head!==fixedRef)fail('source checkout HEAD must equal pinned ref '+fixedRef+'; got '+head);
  }catch(error){fail('could not verify source checkout ref: '+String(error?.message??error));}
}
const bytes=rel=>read(rel);
const textOf=rel=>bytes(rel).toString('utf8').replace(/\r/g,'');
const gitBlobSha=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\\0','utf8'),b])).digest('hex');
const atoi=v=>{const m=String(v??'').trim().match(/^[+-]?\d+/);return m?Number(m[0]):0;};
const clean=v=>String(v??'').trim();

const setupPath='gmsv/setup.cf';
const setupBytes=bytes(setupPath);
const setup=textOf(setupPath);
const config={};
for(const raw of setup.split('\n')){
  const line=raw.trim();if(!line||line.startsWith('#'))continue;
  const eq=line.indexOf('=');if(eq<=0)continue;
  config[line.slice(0,eq).trim()]=line.slice(eq+1).trim();
}
const required=['TRANS','LV','PETLV','GOLD','ITEM1','ITEM2','ITEM15','PET1','PET4'];
for(const key of required)if(!(key in config))fail('setup.cf key missing: '+key);

const version=textOf('gmsv/src/include/version.h');
if(!/\#define\s+_NEW_PLAYER_CF\b/.test(version))fail('_NEW_PLAYER_CF is not enabled in pinned build');
if(!/\#define\s+_HELP_NEWHAND\b/.test(version))fail('_HELP_NEWHAND is not enabled in pinned build');
if(/^[\t ]*\#define\s+_DELBORNPLACE\b/m.test(version))fail('_DELBORNPLACE is unexpectedly enabled');
if(/^[\t ]*\#define\s+_MUSEUM\b/m.test(version))fail('_MUSEUM is unexpectedly enabled');

const configValue={
  transmigration:Math.max(0,Math.min(7,atoi(config.TRANS))),
  level:Math.max(0,Math.min(160,atoi(config.LV))),
  petLevel:Math.max(0,Math.min(160,atoi(config.PETLV))),
  gold:Math.max(0,Math.min(1000000,atoi(config.GOLD))),
  itemSlots:Array.from({length:15},(_,i)=>Math.max(0,atoi(config['ITEM'+(i+1)]))).filter(Boolean)
};
if(configValue.transmigration!==1||configValue.level!==1||configValue.petLevel!==1||configValue.gold!==30000)fail('unexpected fixed setup seed values');
if(configValue.itemSlots.length!==1||configValue.itemSlots[0]!==24114)fail('unexpected fixed setup starter item');

const configSource=textOf('gmsv/src/configfile.c');
if(!/\{\s*"PET1"\s*,NULL,0,\(void\*\)&config\.newplayergivepet\[1\]/.test(configSource))fail('PET1 parser index quirk disappeared');
if(!/\{\s*"ITEM1"\s*,NULL,0,\(void\*\)&config\.newplayergiveitem\[0\]/.test(configSource))fail('ITEM1 parser mapping drifted');
if(!/unsigned int getNewplayergivegold[\s\S]*?\n\}\n\n\#endif/.test(configSource))fail('new-player gold getter missing');

const char=textOf('gmsv/src/char/char.c');
if(!/ch\.data\[CHAR_TRANSMIGRATION\]\s*=\s*getNewplayertrans\(\)/.test(char))fail('starter transmigration assignment missing');
if(!/ch\.data\[CHAR_GOLD\]\s*=\s*getNewplayergivegold\(\)/.test(char))fail('starter gold assignment missing');
if(!/ch\.data\[CHAR_LV\]\s*=\s*getNewplayerlv\(\)/.test(char))fail('starter level assignment missing');
if(!/CHAR_loginAddItemForNew\(\s*charaindex\s*\)/.test(char))fail('starter item grant path missing');
if(!/ENEMY_createPetFromEnemyIndex\(\s*charaindex\s*,\s*enemyarray\s*\)/.test(char))fail('starter pet creation path missing');
for(const [id,re] of [
  [2,/CHAR_LASTTALKELDER\) == 1[\s\S]{0,180}setNewplayergivepet\(0,2\)/],
  [3,/CHAR_LASTTALKELDER\) == 2[\s\S]{0,180}setNewplayergivepet\(0,3\)/],
  [4,/CHAR_LASTTALKELDER\) == 3[\s\S]{0,180}setNewplayergivepet\(0,4\)/],
  [1,/else\s+setNewplayergivepet\(0,1\)/]
])if(!re.test(char))fail('starter pet fallback source branch missing: '+id);

const elderData=textOf('gmsv/src/char/char_data.c');
const em=elderData.match(/static EldersPosition elders\[MAXELDERS\]=\s*\{\s*([\s\S]*?)\n\};/);
if(!em)fail('elder table missing');
const positions=[...em[1].matchAll(/\{\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\}/g)].slice(0,4).map((m,i)=>({hometown:i,floor:Number(m[1]),x:Number(m[2]),y:Number(m[3])}));
if(positions.length!==4)fail('expected four starter hometowns');

const enemyBytes=bytes('gmsv/data/enemy1.txt');
const baseBytes=bytes('gmsv/data/enemybase1.txt');
const enemySource={path:'gmsv/data/enemy1.txt',blobSha:gitBlobSha(enemyBytes)};
const baseSource={path:'gmsv/data/enemybase1.txt',blobSha:gitBlobSha(baseBytes)};
const enemyRows=[];
for(const raw of enemyBytes.toString('utf8').replace(/\r/g,'').split('\n')){
  const line=raw.trim();if(!line||line.startsWith('#'))continue;
  const p=line.split(',');if(p.length<14)continue;
  const id=atoi(p[3]);
  if([1,2,3,4].includes(id))enemyRows.push({name:clean(p[0]),enemyId:id,tempNo:atoi(p[4]),lvMin:atoi(p[5]),lvMax:atoi(p[6]),petFlg:atoi(p[13])});
}
const byEnemyId=Object.fromEntries(enemyRows.map(x=>[String(x.enemyId),x]));
for(const id of [1,2,3,4])if(!byEnemyId[String(id)])fail('starter EnemyID missing: '+id);
const wantedTemps=[1,2,3,4].map(id=>byEnemyId[String(id)].tempNo);
const byTempNo={};
for(const raw of baseBytes.toString('utf8').replace(/\r/g,'').split('\n')){
  const line=raw.trim();if(!line||line.startsWith('#'))continue;
  const p=line.split(',');if(p.length<55)continue;
  const tempNo=atoi(p[6]);if(!wantedTemps.includes(tempNo))continue;
  if(byTempNo[String(tempNo)])fail('duplicate starter EnemyBase TempNo '+tempNo);
  byTempNo[String(tempNo)]={name:clean(p[0]),tempNo,initNum:atoi(p[7]),lvUpPoint:atoi(p[8]),baseStats:{vital:atoi(p[9]),str:atoi(p[10]),tgh:atoi(p[11]),dex:atoi(p[12])},petSkills:Array.from({length:7},(_,i)=>atoi(p[25+i])),imageNumber:atoi(p[36]),petFlg:atoi(p[37]),limitLevel:atoi(p[54])};
}
for(const id of [1,2,3,4])if(!byTempNo[String(byEnemyId[String(id)].tempNo)])fail('starter EnemyBase missing for EnemyID '+id);

const trans=textOf('gmsv/src/npc/npc_transmigration.c');
const em2=trans.match(/char \*elder\[4\]\s*=\s*\{([^}]+)\}/);
const elderNames=em2?[...em2[1].matchAll(/"([^"]+)"/g)].map(x=>x[1]):[];
positions.forEach((p,i)=>p.elder=elderNames[i]||null);

const output={
  format:'stoneage-new-player-seed-runtime-v1',
  generatedAt:'2026-09-30',
  fixedSource:{repository:'gavinlinasd/StoneAge',ref:fixedRef},
  sourceFiles:{
    setup:{path:'gmsv/setup.cf',blobSha:gitBlobSha(setupBytes),sha256:sha256(setupBytes)},
    version:{path:'gmsv/src/include/version.h',blobSha:gitBlobSha(read('gmsv/src/include/version.h'))},
    configfile:{path:'gmsv/src/configfile.c',blobSha:gitBlobSha(read('gmsv/src/configfile.c'))},
    creation:{path:'gmsv/src/char/char.c',blobSha:gitBlobSha(read('gmsv/src/char/char.c'))},
    position:{path:'gmsv/src/char/char_data.c',blobSha:gitBlobSha(read('gmsv/src/char/char_data.c'))},
    elderNames:{path:'gmsv/src/npc/npc_transmigration.c',blobSha:gitBlobSha(read('gmsv/src/npc/npc_transmigration.c'))},
    enemy:enemySource,enemyBase:baseSource
  },
  sourceConfig:{
    newPlayerFlag:true,helpNewHandFlag:true,museumFlag:false,delBornPlaceFlag:false,
    transmigration:configValue.transmigration,level:configValue.level,petLevel:configValue.petLevel,gold:configValue.gold,
    itemSlots:Object.fromEntries(Array.from({length:15},(_,i)=>['ITEM'+(i+1),config['ITEM'+(i+1)]?atoi(config['ITEM'+(i+1)]):null])),
    configuredPetSlots:Object.fromEntries(Array.from({length:4},(_,i)=>['PET'+(i+1),config['PET'+(i+1)]?atoi(config['PET'+(i+1)]):null])),
    getterPetSlot0:-1,
    parserQuirk:'Fixed config parser writes PET1 to newplayergivepet[1], while getNewplayergivepet(0) reads slot 0. Because PET1 is empty and config storage is zero-initialized, CHAR_createNewChar observes slot 0 as -1 and enters the hometown fallback branch.'
  },
  sourceContracts:{
    playerSeed:'gmsv/src/char/char.c::CHAR_makeCharFromOptionAtCreate',
    starterItem:'gmsv/src/char/char.c::CHAR_loginAddItemForNew',
    starterPet:'gmsv/src/char/char.c::CHAR_createNewChar -> ENEMY_createPetFromEnemyIndex',
    hometown:'gmsv/src/char/char_data.c::CHAR_getInitElderPosition'
  },
  hometowns:positions.map((p,i)=>({...p,elderIndex:i,fallbackPet:{hometown:i,lastTalkElder:i,enemyId:i+1,tempNo:byEnemyId[String(i+1)].tempNo,enemyName:byEnemyId[String(i+1)].name,lvRange:[byEnemyId[String(i+1)].lvMin,byEnemyId[String(i+1)].lvMax],template:byTempNo[String(byEnemyId[String(i+1)].tempNo)]}})),
  starterItem:{itemId:24114,sourceConfigKey:'ITEM1',sourceCreation:'CHAR_loginAddItemForNew -> ITEM_makeItemAndRegist(getNewplayergiveitem(i))',allocatorRequired:true,itemTemplatePromoted:false},
  starterPet:{configuredSlot0:-1,fallbackRule:'CHAR_LASTTALKELDER: 1->EnemyID2, 2->EnemyID3, 3->EnemyID4, otherwise EnemyID1',initialLevel:configValue.petLevel,maxPetHave:5,sourceClosed:true,entries:positions.map((_,i)=>{const id=i+1;return {hometown:i,lastTalkElder:i,enemyId:id,tempNo:byEnemyId[String(id)].tempNo,enemyName:byEnemyId[String(id)].name,lvRange:[byEnemyId[String(id)].lvMin,byEnemyId[String(id)].lvMax],template:byTempNo[String(byEnemyId[String(id)].tempNo)]};})},
  policy:{fixedCIsAuthoritative:true,noInventedItemTemplate:true,itemAllocatorRequired:true,noNpridePromotion:true,noPlayableHtml:true,productLayerSeparated:true}
};
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({pass:true,format:output.format,config:{trans:output.sourceConfig.transmigration,level:output.sourceConfig.level,petLevel:output.sourceConfig.petLevel,gold:output.sourceConfig.gold,item1:output.sourceConfig.itemSlots.ITEM1},starterPets:output.starterPet.entries.map(x=>({hometown:x.hometown,enemyId:x.enemyId,tempNo:x.tempNo})),output:out}));
