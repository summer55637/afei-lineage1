#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const map=JSON.parse(fs.readFileSync('data/generated/stoneage_map_4000.json','utf8'));
const battle=JSON.parse(fs.readFileSync('data/generated/stoneage_battlefield_source_manifest.json','utf8'));

assert.equal(map.floorId,4000);
assert.equal(map.width,150);
assert.equal(map.height,150);

const target=[321,409,196,307,156];
const prefix=[321,409,196];
const suffix=[307,156];

function findHorizontal(sequence){
  const out=[];
  for(let y=0;y<map.height;y++){
    for(let x=0;x<=map.width-sequence.length;x++){
      let ok=true;
      for(let i=0;i<sequence.length;i++){
        if(Number(map.tiles[y*map.width+x+i])!==sequence[i]){
          ok=false;
          break;
        }
      }
      if(ok)out.push({x,y});
    }
  }
  return out;
}

const exact=findHorizontal(target);
const prefixes=findHorizontal(prefix);
const suffixes=findHorizontal(suffix);

assert.deepEqual(exact,[{x:90,y:109}]);
assert.deepEqual(prefixes,[{x:61,y:107},{x:90,y:109}]);
assert.deepEqual(suffixes,[{x:61,y:77},{x:93,y:109}]);

const boundary196=(battle.definitions||[]).find(row=>Number(row.id)===196);
assert.equal(boundary196?.name,'砂漠の草と土２の境界１');

const index=(x,y)=>y*map.width+x;
const tileAt=(x,y)=>Number(map.tiles[index(x,y)]);

const context=(x,y,length=8)=>Array.from({length},(_,i)=>tileAt(x+i,y));

console.log(JSON.stringify({
  pass:true,
  floor:4000,
  target:{
    origin:[90,109],
    sequence:target,
    exactOccurrences:exact.length,
    sourceBoundaryNameFor196:boundary196.name
  },
  recurrence:{
    prefix321_409_196:{occurrences:prefixes.length,origins:prefixes},
    transition307_156:{occurrences:suffixes.length,origins:suffixes},
    exact321_409_196_307_156:{occurrences:exact.length,origins:exact}
  },
  contexts:[
    {origin:[61,107],sequence:context(61,107)},
    {origin:[90,109],sequence:context(90,109)}
  ],
  interpretation:[
    '321→409→196 is a recurring source-map motif; it occurs twice.',
    '307→156 is also a recurring source-map transition; it occurs twice.',
    'The complete five-cell sequence 321→409→196→307→156 is unique to the blocker boundary at (90,109).',
    'Tile 196 is explicitly named as a desert/grass/soil boundary tile in the pinned battlefield source manifest.',
    'This evidence does not identify an original walkable replacement for (91,109),(92,109),(93,109).'
  ],
  policy:'audit-only; canonical map unchanged'
},null,2));
