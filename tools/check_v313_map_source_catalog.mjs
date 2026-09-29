import assert from 'node:assert/strict';
import fs from 'node:fs';
const catalog=JSON.parse(fs.readFileSync('data/generated/stoneage_map_source_catalog.json','utf8'));
assert.equal(catalog.version,'V3.13');
assert.equal(catalog.mapBlobCount,1284);
assert.equal(catalog.maps.length,1284);
assert.equal(catalog.source.repository,'gavinlinasd/StoneAge');
assert.equal(catalog.source.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.deepEqual(catalog.verifiedFloorIds,[200,400,2000,5507,10406,10702,20000]);
for(const id of catalog.verifiedFloorIds){
 const hit=catalog.maps.filter(x=>x.basename===String(id)&&x.verifiedRuntime);
 assert.equal(hit.length,1,`verified floor ${id} catalog entry`);
 assert.ok(hit[0].generatedPath);
}
console.log(JSON.stringify({pass:true,version:'V3.13',focus:'fixed-C map source catalog',mapBlobCount:catalog.mapBlobCount,verifiedFloorIds:catalog.verifiedFloorIds}));