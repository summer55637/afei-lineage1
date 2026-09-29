import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync('game.js','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_gmque_trophy_runtime.json','utf8'));
const readme=fs.readFileSync('README.md','utf8');

const FIXED_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
assert.equal(runtime.source?.repository,'gavinlinasd/StoneAge');
assert.equal(runtime.source?.ref,FIXED_REF);
assert.equal(runtime.source?.path,'gmsv/src/npc/npc_eventaction.c');
for(const fn of ['GMQUE_CheckQueStr','GMQUE_AddQueStrTrophy','GMQUE_cleanQueStr']){
  assert.ok(runtime.source.functions.includes(fn),`generated runtime missing ${fn}`);
}

assert.ok(game.includes("const GMQUE_TROPHY_RUNTIME_URL='data/generated/stoneage_gmque_trophy_runtime.json';"));
assert.ok(game.includes('function sourceGmQueActionValue('));
assert.ok(game.includes('function sourceGmQueRewardType('));
assert.ok(game.includes('function sourceGmQueResolveTrophy('));
assert.ok(game.includes('function sourceGmQueParseNpcArg('));
assert.ok(game.includes('function sourceGmQueTaskEntries('));
assert.equal(game.includes('function sourceGmQueParseTaskString('),false);
assert.equal(game.includes('function sourceGmQuePetMatchesTask('),false);

const roll=runtime.actionRoll;
assert.deepEqual(roll.rawRange,[0,99]);
assert.deepEqual(roll.normalizedRange,[1,99]);
assert.deepEqual(roll.branches.map(x=>[x.type,x.rawOutcomes]),[['gold',41],['item',57],['pet',2]]);

const pools=runtime.itemReward?.pools||[];
assert.equal(pools.length,5);
const expectedPools=new Map([
  ['itemID3',[20282,20273]],
  ['itemID2',[17759,17259,14752,15053,14154,16556]],
  ['itemID4',[14693,15233,17053,17056,14364,15023,15562,17603]],
  ['itemID5',[3843,14902,6214,15235,4474,17005,17554,17558]],
  ['itemID1',[20131,20594,20171,17005,20210,20211,20212,20213,2435]]
]);
for(const row of pools)assert.deepEqual(row.ids,expectedPools.get(row.name),row.name+' pool ids');

assert.deepEqual(runtime.petReward?.effectiveIds,[1642,1636,475,0]);
assert.equal(runtime.petReward?.selection?.inclusive?.[0],0);
assert.equal(runtime.petReward?.selection?.inclusive?.[1],3);
assert.equal(runtime.itemReward?.relifeItem20131?.poolIndex,0);

const gold=runtime.goldReward?.branches||[];
assert.deepEqual(gold.map(x=>x.gold??null),[20000,50000,null]);
assert.deepEqual(gold[2].secondary.goldByIndex,{'2':100000,'3':150000,'4':200000});

assert.match(readme,/PLAYABLE CORE V3\.09/);
assert.equal(readme.includes('**目前核心版本：V2.91**'),false);
assert.match(readme,/sourceRuntimePending/);
assert.match(readme,/V3\.10 groundwork/);
assert.match(readme,/V2\.61/);

console.log(JSON.stringify({
  pass:true,
  focus:'gmque-source-contract',
  fixedC:`gavinlinasd/StoneAge@${FIXED_REF}`,
  actionBranches:{gold:'41/100',item:'57/100',pet:'2/100'},
  itemPools:pools.length,
  petRewardIds:[1642,1636,475,0],
  fullHandoverUiEnabled:false
}));
