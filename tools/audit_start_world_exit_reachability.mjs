#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { sourceMapWalkableAt, sourceMapTileWithAttributes } from '../src/stoneage_map_runtime.mjs';

const outIdx = process.argv.indexOf('--out');
const out = path.resolve(outIdx >= 0 ? process.argv[outIdx + 1] : 'data/generated/stoneage_start_world_exit_reachability.json');
const route = JSON.parse(fs.readFileSync('data/generated/stoneage_start_destination_warp_coordinates.json', 'utf8'));
const index = JSON.parse(fs.readFileSync('data/generated/stoneage_map_runtime_index.json', 'utf8'));
const mapset = JSON.parse(fs.readFileSync('data/generated/stoneage_mapset_runtime.json', 'utf8'));

const load = floor => {
  const e = index.maps[String(floor)];
  if (!e?.path) return { e: e || null, map: null };
  const map = JSON.parse(fs.readFileSync(e.path, 'utf8'));
  if (Number(map.floorId) !== Number(floor)) throw new Error('floor mismatch');
  return { e, map };
};

const canWalk = (map, x, y) =>
  !!sourceMapTileWithAttributes(map, x, y, mapset) &&
  sourceMapWalkableAt(map, x, y, mapset, { flying: false });

function bfs(map, a, b) {
  if (!canWalk(map, ...a) || !canWalk(map, ...b)) return null;
  const w = Number(map.width), h = Number(map.height), n = w * h;
  const s = a[1] * w + a[0], t = b[1] * w + b[0];
  const q = new Int32Array(n), prev = new Int32Array(n);
  prev.fill(-2); prev[s] = -1; let head = 0, tail = 1; q[0] = s;
  while (head < tail) {
    const i = q[head++], x = i % w, y = Math.floor(i / w);
    if (i === t) break;
    for (const [nx, ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const j = ny * w + nx;
      if (prev[j] !== -2 || !canWalk(map, nx, ny)) continue;
      prev[j] = i; q[tail++] = j;
    }
  }
  if (prev[t] === -2) return null;
  let i = t, d = 0; while (i !== -1) { d++; i = prev[i]; } return d - 1;
}

const audits = [...new Map(route.directHometownDestinations.map(x => [x.destinationFloor, x])).values()]
  .sort((a,b) => a.hometown - b.hometown).map(src => {
    const floor = Number(src.destinationFloor);
    const { e, map } = load(floor);
    const landings = src.landings.map(p => ({x:p.x, y:p.y, walkable:canWalk(map,p.x,p.y)}));
    const portals = route.nextFloorPortals.filter(p => Number(p.fromFloor) === floor).map(p => {
      const origins = [...new Map(p.rows.map(r => [r.from.join(','), r.from])).values()].map(origin => {
        const paths = landings.map(l => ({from:[l.x,l.y], pathLength:bfs(map,[l.x,l.y],origin)}));
        const finite = paths.map(x => x.pathLength).filter(Number.isFinite);
        return {origin, walkable:canWalk(map,...origin), paths, reachableFromDirectLanding:finite.length>0, minPathLength:finite.length?Math.min(...finite):null};
      });
      const reachable = origins.filter(x => x.reachableFromDirectLanding).length;
      return {id:p.id,toFloor:Number(p.toFloor),sourceLines:p.sourceLines,destinationPoints:[...new Set(p.rows.map(r=>r.to.join(',')))].map(s=>s.split(',').map(Number)),originCount:origins.length,reachableOriginPoints:reachable,allOriginPointsReachable:reachable===origins.length,portalUsableFromDirectLanding:reachable>0,origins};
    });
    return {hometown:Number(src.hometown),destinationFloor:floor,runtime:{path:e?.path||null,sourcePath:e?.sourcePath||null,sourceBlobSha:e?.sourceBlobSha||null,width:e?.width||null,height:e?.height||null,present:!!map},directLandings:landings,portalAudits:portals};
  });

const result = {
  format:'stoneage-start-world-exit-reachability-v1',
  generatedAt:new Date().toISOString().slice(0,10),
  fixedSource:route.fixedSource,
  sourceContracts:{walkability:'src/stoneage_map_runtime.mjs::sourceMapWalkableAt',portalSource:'data/generated/stoneage_start_destination_warp_coordinates.json',mapRuntime:'data/generated/stoneage_map_runtime_index.json'},
  policy:{routeProof:'Do not promote a floor edge to a playable route unless at least one exact source portal origin is reachable from a direct landing on the fixed runtime map.',unresolvedFloor200:'Do not use data/generated/stoneage_map_200.json as the world-map runtime for 3000/4000 -> 200 exits.'},
  audits,
  worldFloor200Resolution:{
    status:'source-path-identified-runtime-unverified',
    fixedSourceCandidate:{path:'gmsv/data/map/jyaruga/jalga',blobSha:'dcbb20f0212192fc852e1489a29a0d6d8d4c95ce',size:3840044},
    conflictingCurrentRuntime:{path:'data/generated/stoneage_map_200.json',sourcePath:'gmsv/data/map/extra/200',sourceBlobSha:'d08e8fea4dffd127c26f764d51231ec75ec73f98',width:30,height:30,reason:'cannot contain fixed-C world portal coordinates reaching at least x=588 and y=1008'}
  },
  summary:{destinationFloors:audits.length,allDirectLandingsWalkable:audits.every(a=>a.directLandings.every(p=>p.walkable)),usablePortalGroups:audits.reduce((n,a)=>n+a.portalAudits.filter(p=>p.portalUsableFromDirectLanding).length,0),totalPortalGroups:audits.reduce((n,a)=>n+a.portalAudits.length,0),blockedPortalGroups:audits.flatMap(a=>a.portalAudits.filter(p=>!p.portalUsableFromDirectLanding).map(p=>({hometown:a.hometown,destinationFloor:a.destinationFloor,portalId:p.id}))),status:audits.every(a=>a.portalAudits.every(p=>p.portalUsableFromDirectLanding))?'closed':'partial'}
};
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result.summary,null,2));
