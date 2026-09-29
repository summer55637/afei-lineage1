import assert from 'node:assert/strict';
import fs from 'node:fs';

const index=JSON.parse(fs.readFileSync('data/generated/stoneage_map_runtime_index.json','utf8'));
const ids=Object.keys(index.maps).map(Number).sort((a,b)=>a-b);
assert.deepEqual(ids,[200,400,2000,5507,10406,10702,20000]);

const reports=[];
for(const id of ids){
  const entry=index.maps[String(id)];
  const map=JSON.parse(fs.readFileSync(entry.path,'utf8'));
  assert.equal(map.version,'V3.13');
  assert.equal(map.floorId,id);
  assert.equal(map.width,entry.width);
  assert.equal(map.height,entry.height);
  assert.equal(map.tileCount,entry.tileCount);
  assert.equal(map.objectCount,entry.objectCount);
  assert.equal(map.tiles.length,entry.tileCount);
  assert.equal(map.objects.length,entry.objectCount);
  assert.equal(map.source.blobSha,entry.sourceBlobSha);
  assert.ok(typeof map.source.path==='string'&&map.source.path.length>0);
  assert.equal(map.battlemapResolver.source,'gmsv/src/battle/battle.c::BATTLE_getBattleFieldNo');
  assert.equal(map.battlemapResolver.selection,'RAND(0,2)');
  const uniqueTiles=[...new Set(map.tiles)];
  const candidates=map.battlemapResolver.candidatesByImageId||{};
  for(const tileId of uniqueTiles){
    const row=candidates[String(tileId)];
    assert.ok(Array.isArray(row)&&row.length===3,`missing battle candidates floor=${id} tile=${tileId}`);
  }
  const expectedBytes=44+4*entry.tileCount;
  assert.equal(entry.width*entry.height,entry.tileCount);
  reports.push({floorId:id,width:entry.width,height:entry.height,cells:entry.tileCount,uniqueTiles:uniqueTiles.length,uniqueTileCandidates:Object.keys(candidates).length});
}

assert.ok(reports.every(x=>x.uniqueTiles===x.uniqueTileCandidates),'every unique tile must have battle candidates');
console.log(JSON.stringify({pass:true,version:'V3.13',verifiedMapCount:reports.length,totalCells:reports.reduce((s,x)=>s+x.cells,0),maps:reports},null,2));