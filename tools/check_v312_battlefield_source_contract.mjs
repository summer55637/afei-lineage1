import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('start.html','utf8');
const css=fs.readFileSync('game.css','utf8');
const m=JSON.parse(fs.readFileSync('data/generated/stoneage_battlefield_source_manifest.json','utf8'));
assert.match(html,/id=["']battleSourceMeta["']/,'battle source status node missing');
assert.ok(html.includes('stoneage_battlefield_source_manifest.json'),'battle source manifest loader missing');
assert.ok(css.includes('.battle-source-meta{'),'battle source status CSS missing');
assert.ok(html.includes('不猜測目前戰場地形'),'fail-closed source message missing');

assert.equal(m.version,'V3.12');
assert.equal(m.kind,'battlefield-source-manifest');
assert.equal(m.source.repository,'gavinlinasd/StoneAge');
assert.equal(m.source.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.equal(m.source.path,'gmsv/data/map/battlemap.txt');

assert.equal(m.statistics.declaredBattleMapCount,220);
assert.equal(m.statistics.assignedBattleMapCount,199);
assert.equal(m.statistics.assignmentRowCount,122);
assert.equal(m.statistics.invalidRangeCount,1);
assert.equal(m.definitions.length,220);
assert.deepEqual(m.definitions[0],{id:0,name:'土１－１'});
assert.deepEqual(m.definitions[199],{id:199,name:'サムギルの村'});
assert.deepEqual(m.definitions[218],{id:218,name:'最終ダンジョン'});
assert.deepEqual(m.definitions[219],{id:219,name:'最終ボス'});

assert.deepEqual(m.sourceRuntimeContract.candidateSlots,['MAP_BATTLEMAP','MAP_BATTLEMAP2','MAP_BATTLEMAP3']);
assert.equal(m.sourceRuntimeContract.candidateSelection,'RAND(0,2)');
assert.equal(m.sourceRuntimeContract.tileSource,'MAP_getTileAndObjData(floor,x,y) -> tile[0]');

const bad=m.invalidRanges.find(x=>x.raw==='3137 to 1349');
assert.ok(bad,'original reverse range must remain explicit');
assert.deepEqual(bad.battlemaps,[1,2,201]);
assert.equal(bad.start,3137);
assert.equal(bad.end,1349);

for(const row of m.assignments){
  assert.ok(Number.isInteger(row.start)&&Number.isInteger(row.end));
  assert.ok(row.start<=row.end);
  assert.ok(Array.isArray(row.battlemaps)&&row.battlemaps.length>0);
  for(const id of row.battlemaps) assert.ok(id>=0&&id<220);
}

console.log(JSON.stringify({pass:true,version:'V3.12',focus:'battlefield source contract',declared:220,assigned:199,rows:122,invalidRanges:1}));