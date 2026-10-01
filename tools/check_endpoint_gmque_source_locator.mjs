#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT=process.cwd();
const ROOT_REL='ro0000/server/merged-source/gmsv/data/npc';
const ROOT_PATH=path.join(ROOT,ROOT_REL);
const OUT=path.join(ROOT,'data/generated/stoneage_endpoint_gmque_source_locator.json');
const TEXT_EXT=new Set(['.arg','.create','.template','.txt','.conf','.cf','.gen','.lua','.json','.csv']);
function walk(dir,out=[]){if(!fs.existsSync(dir))return out;for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name==='.'||e.name==='..')continue;const full=path.join(dir,e.name);if(e.isDirectory())walk(full,out);else if(e.isFile())out.push(full);}return out;}
function sha(content){return crypto.createHash('sha1').update(Buffer.from(`blob ${Buffer.byteLength(content,'utf8')}\0`)).update(content).digest('hex');}
function scan(file){const ext=path.extname(file).toLowerCase();if(!TEXT_EXT.has(ext))return null;let text;try{text=fs.readFileSync(file,'utf8');}catch{return null;}if(!/RANDGMQUE/i.test(text)||!/QUEPART(?:0|1|2|3)/i.test(text))return null;const lines=text.split(/\r?\n/);const matches=[];for(let i=0;i<lines.length;i++){if(/RANDGMQUE|QUEPART(?:0|1|2|3)/i.test(lines[i]))matches.push({line:i+1,text:lines[i].slice(0,500)});}return{path:path.relative(ROOT,file).replaceAll(path.sep,'/'),bytes:fs.statSync(file).size,blobSha:sha(text),matches};}
if(!fs.existsSync(ROOT_PATH))throw new Error('Missing endpoint NPC data root: '+ROOT_REL);
const results=walk(ROOT_PATH).map(scan).filter(Boolean);
const complete=args=>args.length>0&&args.some(x=>/RANDGMQUE\s*=/i.test(x.text))&&args.some(x=>/QUEPART(?:0|1|2|3)\s*=/i.test(x.text));
const candidates=results.filter(r=>complete(r.matches));
const result={format:'stoneage-endpoint-gmque-source-locator-v1',updated:'2026-10-01',source:{root:ROOT_REL,scope:'VM one-click endpoint',provenance:'vm-one-click'},status:candidates.length?'candidate-found':'pending-source',statistics:{filesScanned:walk(ROOT_PATH).length,filesWithRelevantTokens:results.length,candidateFiles:candidates.length},candidates,policy:{tokenPresenceIsNotRuntimeAdmission:true,requiresExactEndpointIdentity:true,requiresContentClosure:true,requiresRewardPetClosure:true,noSyntheticNpcArguments:true}};
const text=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--check')){if(!fs.existsSync(OUT))throw new Error('Missing generated endpoint GMQUE locator: '+OUT);const cur=fs.readFileSync(OUT,'utf8');if(cur!==text)throw new Error('Endpoint GMQUE locator is stale. Run with --write and commit the generated JSON.');process.stdout.write('endpoint-gmque-source-locator-check-ok\n');}
else if(process.argv.includes('--write')){fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,text);process.stdout.write(text);}
else process.stdout.write(text);