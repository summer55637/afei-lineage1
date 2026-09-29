import assert from 'node:assert/strict';
import fs from 'node:fs';
const index=JSON.parse(fs.readFileSync('data/generated/stoneage_map_runtime_index.json','utf8'));
const expected={
  '20000':{width:50,height:50,tileCount:2500,objectCount:2500,sha:'b730f5aca60347f0b5b1bda497f6e65740706dc1'},
  '400':{width:150,height:149,tileCount:22350,objectCount:22350,sha:'acce0b34492112a41684d449afd03f9b0033f4e3'},
  '2000':{width:150,height:150,tileCount:22500,objectCount:22500,sha:'62b948ee1b4a45e870afa0a5bbb086916abeb6c7'},
};
for(const [id,want] of Object.entries(expected)){
  const entry=index.maps[id];
  assert.ok(entry,`verified floor ${id} missing from index`);
  for(const key of ['width','height','tileCount','objectCount'])assert.equal(entry[key],want[key],`floor ${id} ${key}`);
  assert.equal(entry.sourceBlobSha,want.sha,`floor ${id} source sha`);
  const map=JSON.parse(fs.readFileSync(entry.path,'utf8'));
  assert.equal(map.floorId,Number(id));
  assert.equal(map.tiles.length,want.tileCount);
  assert.equal(map.objects.length,want.objectCount);
  assert.equal(Object.keys(map.battlemapResolver.candidatesByImageId||{}).length>0,true);
}
console.log(JSON.stringify({pass:true,version:'V3.13',focus:'verified map runtime set',floors:Object.keys(expected).map(Number),sourceBacked:true,unknownFloorPolicy:'fail-closed'}));