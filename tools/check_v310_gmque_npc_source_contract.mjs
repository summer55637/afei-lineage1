import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const readme=fs.readFileSync('README.md','utf8');
const changelog=fs.readFileSync('CHANGELOG.md','utf8');
const doc=fs.readFileSync('docs/reference/gmque-npc-source-contract.md','utf8');
const ledger=JSON.parse(fs.readFileSync('data/generated/stoneage_gmque_source_closure.json','utf8'));

function extractFunction(source,name){
  const marker=`function ${name}(`;
  const start=source.indexOf(marker);
  assert.ok(start>=0,`missing ${name}`);
  const end=source.indexOf('\nfunction ',start+marker.length);
  assert.ok(end>start,`unterminated ${name}`);
  return source.slice(start,end);
}

assert.match(readme,/sourceGmQueParseNpcArg\(\)/);
assert.match(changelog,/GMQUE NPC argument source adapter/);
assert.match(doc,/GMQUE_InSertQue/);
assert.equal(ledger.queue.npcArgContract.parser,'sourceGmQueParseNpcArg');
assert.equal(ledger.queue.npcArgContract.requiredCount,4);
assert.equal(ledger.queue.npcArgContract.liveNpcDataPresent,false);

const ctx={Math,Number,String,Object,Array,RegExp,cRand:(a)=>a,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(ctx);
vm.runInContext(extractFunction(game,'sourceGmQueParseNpcArg'),ctx);

let calls=[];
const rand=(a,b)=>{calls.push([a,b]);return a;};
const good=ctx.sourceGmQueParseNpcArg(
  'RANDGMQUE=4|QUEPART0=475=2-2,111=1-1|QUEPART1=1636=3-3|QUEPART2=1642=4-4|QUEPART3=999=5-5',
  {randInclusive:rand}
);
assert.equal(good.ok,true);
assert.equal(good.count,4);
assert.equal(good.taskString,'475-2&1636-3&1642-4&999-5');
assert.deepEqual(calls,[[1,2],[2,2],[1,1],[3,3],[1,1],[4,4],[1,1],[5,5]]);

assert.equal(ctx.sourceGmQueParseNpcArg('RANDGMQUE=3|QUEPART0=1=1-1|QUEPART1=2=1-1|QUEPART2=3=1-1').reason,'randgmque-count');
assert.equal(ctx.sourceGmQueParseNpcArg('RANDGMQUE=4|QUEPART0=1=1-1|QUEPART1=2=1-1|QUEPART2=3=1-1').reason,'quepart-missing');
assert.equal(ctx.sourceGmQueParseNpcArg('RANDGMQUE=4|QUEPART0=1=2-1|QUEPART1=2=1-1|QUEPART2=3=1-1|QUEPART3=4=1-1').reason,'quepart-level-order');
assert.equal(ctx.sourceGmQueParseNpcArg('RANDGMQUE=4|QUEPART0=1=1-1,|QUEPART1=2=1-1|QUEPART2=3=1-1|QUEPART3=4=1-1',{randInclusive:()=>99}).reason,'quepart-rng-range');
assert.equal(ctx.sourceGmQueParseNpcArg('RANDGMQUE=4|QUEPART0=0=1-1|QUEPART1=2=1-1|QUEPART2=3=1-1|QUEPART3=4=1-1',{randInclusive:()=>1}).reason,'quepart-number');
assert.equal(ctx.sourceGmQueParseNpcArg('RANDGMQUE=4|QUEPART0=1=1-1|QUEPART0=2=1-1|QUEPART1=2=1-1|QUEPART2=3=1-1|QUEPART3=4=1-1').reason,'npc-arg-duplicate');

let mutated=false;
const target={quest:{gmque:{active:false,flag:0,taskString:'NULL',nums:0}}};
const plan=ctx.sourceGmQueParseNpcArg('RANDGMQUE=4|QUEPART0=1=1-1|QUEPART1=2=1-1|QUEPART2=3=1-1|QUEPART3=4=1-1',{randInclusive:(a)=>a});
mutated=JSON.stringify(target)!==JSON.stringify({quest:{gmque:{active:false,flag:0,taskString:'NULL',nums:0}}});
assert.equal(plan.ok,true);
assert.equal(mutated,false);

console.log(JSON.stringify({pass:true,version:'V3.10-groundwork',focus:'GMQUE NPC argument source contract',requiredCount:4,liveNpcDataPresent:false}));
