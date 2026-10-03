#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const expected={
  1005:{
    sourcePath:'gmsv/data/map/sainasu/samugiru/1005',
    sourceBlobSha:'33a211e37c142679b2ddf9cdd7dfb89cd166c572',
    nameIncludes:'薩姆吉爾的醫院'
  },
  2005:{
    sourcePath:'gmsv/data/map/sainasu/marinasu/2005',
    sourceBlobSha:'6d53e2db6dd9af5913cdf193cbf6df3426458b63',
    nameIncludes:'瑪麗娜絲的醫院'
  },
  3005:{
    sourcePath:'gmsv/data/map/jyaruga/jaja/3005',
    sourceBlobSha:'a986b12d6baf558ff8d1c50d0db61379f8b28502',
    nameIncludes:'加加的醫院'
  },
  4005:{
    sourcePath:'gmsv/data/map/jyaruga/karutana/4005',
    sourceBlobSha:'961e4ea1e2fc73cccca3fb2716db8e51ee7300be',
    nameIncludes:'卡魯它那的醫院'
  }
};

for(const [id,meta] of Object.entries(expected)){
  const file=`data/generated/stoneage_map_${id}.json`;
  assert.ok(fs.existsSync(file),`missing verified hospital map ${file}`);
  const map=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.equal(Number(map.floorId),Number(id));
  assert.equal(map.source?.repository,'gavinlinasd/StoneAge');
  assert.equal(map.source?.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
  assert.equal(map.source?.path,meta.sourcePath);
  assert.equal(map.source?.blobSha,meta.sourceBlobSha);
  assert.equal(map.nameEncoding,'GBK');
  assert.ok(Number(map.width)>0&&Number(map.height)>0);
  assert.equal(Number(map.tileCount),Number(map.width)*Number(map.height));
  assert.equal(Number(map.objectCount),Number(map.width)*Number(map.height));
  assert.ok(Array.isArray(map.tiles)&&map.tiles.length===map.tileCount);
  assert.ok(Array.isArray(map.objects)&&map.objects.length===map.objectCount);
}
const index=JSON.parse(fs.readFileSync('data/generated/stoneage_map_runtime_index.json','utf8'));
for(const id of Object.keys(expected)){
  assert.ok(index.maps?.[id],`runtime index missing floor ${id}`);
  assert.equal(index.maps[id].sourcePath,expected[id].sourcePath);
  assert.equal(index.maps[id].sourceBlobSha,expected[id].sourceBlobSha);
}

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-verified-hospital-map-runtime-regression-v1',
  hospitalFloors:Object.keys(expected).map(Number),
  sourceBacked:true,
  runtimeIndexed:true
},null,2));
