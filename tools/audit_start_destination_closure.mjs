#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = process.argv.slice(2);
const sourceRootArg = args.indexOf('--source-root');
const outArg = args.indexOf('--out');
const sourceRoot = path.resolve(sourceRootArg >= 0 ? args[sourceRootArg + 1] : '/tmp/StoneAge');
const out = path.resolve(outArg >= 0 ? args[outArg + 1] : 'data/generated/stoneage_start_destination_closure.json');

const FIXED_REF = '1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const ENCOUNT_PATH = 'gmsv/data/encount.txt';
const ENCOUNT_SHA = '89da97a15ea866a36f26ec3bb7ab5490f3eccc5f';

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}
function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function sha1(content) {
  return crypto.createHash('sha1').update(content).digest('hex');
}
function parseEncount(text) {
  return text.split(/\r?\n/).map((line, idx) => ({line: idx + 1, raw: line, parts: line.split(',')}))
    .filter(r => r.raw && !r.raw.startsWith('#') && r.parts.length >= 10)
    .map(r => ({
      line: r.line,
      index: Number(r.parts[0]),
      floor: Number(r.parts[1]),
      x1: Number(r.parts[2]),
      y1: Number(r.parts[3]),
      x2: Number(r.parts[4]),
      y2: Number(r.parts[5]),
      probMin: Number(r.parts[6]),
      probMax: Number(r.parts[7]),
      enemyMax: Number(r.parts[8]),
      zorder: Number(r.parts[9]),
      groups: r.parts.slice(10, 20)
        .map(v => v === '' ? null : Number(v))
        .filter(v => v !== null && Number.isFinite(v))
    }));
}
function normalizeRect(row) {
  return {
    x1: Math.min(row.x1, row.x2),
    y1: Math.min(row.y1, row.y2),
    x2: Math.max(row.x1, row.x2),
    y2: Math.max(row.y1, row.y2)
  };
}
function inRect(x, y, rect) {
  return x >= rect.x1 && x <= rect.x2 && y >= rect.y1 && y <= rect.y2;
}
function walkableAt(map, mapset, x, y) {
  if (!map || !mapset) return null;
  const xi = Math.trunc(Number(x)), yi = Math.trunc(Number(y));
  if (xi < 0 || yi < 0 || xi >= Number(map.width) || yi >= Number(map.height)) return null;
  const i = yi * Number(map.width) + xi;
  const tile = Number(map.tiles?.[i]);
  const object = Number(map.objects?.[i]);
  const groundWalk = mapset.walkableByImageId?.[String(tile)] === 1;
  const objectWalk = mapset.walkableByImageId?.[String(object)] === 1;
  const groundHeight = Array.isArray(mapset.haveHeightImageIds) && mapset.haveHeightImageIds.includes(tile);
  const objectHeight = Array.isArray(mapset.haveHeightImageIds) && mapset.haveHeightImageIds.includes(object);
  return {
    x: xi, y: yi, tile, object,
    groundWalk, objectWalk, groundHeight, objectHeight,
    walkable: groundWalk && objectWalk
  };
}

const route = readJson('data/generated/stoneage_start_route_candidates.json');
const sourceCatalog = readJson('data/generated/stoneage_map_source_catalog.json');
const runtimeIndex = readJson('data/generated/stoneage_map_runtime_index.json');
const mapset = readJson('data/generated/stoneage_mapset_runtime.json');
const encountText = readText(path.join(sourceRoot, ENCOUNT_PATH));
const actualEncountSha = sha1(encountText);
if (actualEncountSha !== ENCOUNT_SHA) {
  throw new Error(`fixed-source encount SHA mismatch: expected ${ENCOUNT_SHA}, got ${actualEncountSha}`);
}

const encountRows = parseEncount(encountText);
const activeRowsByFloor = new Map();
for (const row of encountRows) {
  if (row.probMax > 0 && row.groups.length > 0) {
    const list = activeRowsByFloor.get(row.floor) || [];
    list.push(row);
    activeRowsByFloor.set(row.floor, list);
  }
}

const mapCatalogByFloor = new Map();
for (const m of sourceCatalog.maps || []) {
  const floor = Number(m.basename);
  if (Number.isFinite(floor)) {
    mapCatalogByFloor.set(floor, m);
  }
}

const towns = (route.routes || []).map(entry => {
  const destinationFloor = Number(entry.directWarpExits?.[0]?.toFloor);
  const landings = entry.directWarpExits.map(exit => ({x:Number(exit.toX), y:Number(exit.toY)}));
  const sourceMap = mapCatalogByFloor.get(destinationFloor) || null;
  const runtime = runtimeIndex.maps?.[String(destinationFloor)] || null;
  let map = null;
  if (runtime?.path) {
    const file = runtime.path.startsWith('./') ? runtime.path.slice(2) : runtime.path;
    if (fs.existsSync(file)) map = readJson(file);
  }
  const sourceMapVerified =
    !!sourceMap &&
    !!runtime &&
    sourceMap.verifiedRuntime === true &&
    runtime.sourceBlobSha === sourceMap.blobSha;
  const landingAudit = landings.map(p => {
    const walk = map ? walkableAt(map, mapset, p.x, p.y) : null;
    const activeRects = (activeRowsByFloor.get(destinationFloor) || []).map(row => ({
      index: row.index,
      line: row.line,
      rect: normalizeRect(row),
      containsLanding: inRect(p.x, p.y, normalizeRect(row)),
      probMin: row.probMin,
      probMax: row.probMax,
      enemyMax: row.enemyMax,
      groups: row.groups
    }));
    return { ...p, walkability: walk, activeEncounterRegions: activeRects };
  });
  const allRows = encountRows.filter(row => row.floor === destinationFloor);
  const activeRows = activeRowsByFloor.get(destinationFloor) || [];
  return {
    hometown: entry.hometown,
    elder: entry.elder,
    spawn: entry.spawn,
    destinationFloor,
    sourceMap: {
      catalogPresent: !!sourceMap,
      sourcePath: sourceMap?.path ?? null,
      sourceBlobSha: sourceMap?.blobSha ?? null,
      verifiedRuntime: sourceMap?.verifiedRuntime ?? false,
      runtimePath: runtime?.path ?? null,
      runtimePresent: !!runtime,
      exactBlobMatch: sourceMapVerified,
      status: sourceMapVerified ? 'verified' : 'unresolved'
    },
    encounterEvidence: {
      allRowCount: allRows.length,
      activeRowCount: activeRows.length,
      activeRows: activeRows.map(row => ({
        index: row.index,
        line: row.line,
        rect: normalizeRect(row),
        probMin: row.probMin,
        probMax: row.probMax,
        enemyMax: row.enemyMax,
        groups: row.groups
      })),
      classification: activeRows.length > 0 ? 'active' : allRows.length > 0 ? 'placeholder_only' : 'none'
    },
    landingAudit
  };
});

const activeFloorSet = new Set(activeRowsByFloor.keys());
const adjacency = new Map();
for (const edge of readJson('data/generated/stoneage_world_graph_index.json').directedFloorEdges || []) {
  const a = Number(edge.fromFloor), b = Number(edge.toFloor);
  const list = adjacency.get(a) || [];
  list.push(b);
  adjacency.set(a, list);
}
function nearestActive(start) {
  const q = [[start, [start]]];
  const seen = new Set([start]);
  while (q.length) {
    const [floor, p] = q.shift();
    if (floor !== start && activeFloorSet.has(floor)) return {floor, path:p};
    for (const next of adjacency.get(floor) || []) {
      if (!seen.has(next)) {
        seen.add(next);
        q.push([next, [...p, next]]);
      }
    }
  }
  return null;
}

for (const town of towns) {
  town.nearestActiveEncounter = town.encounterEvidence.classification === 'active'
    ? {floor: town.destinationFloor, path:[town.destinationFloor], depth:0, reason:'direct destination has active encounter row'}
    : nearestActive(town.destinationFloor);
}

const statistics = {
  hometowns: towns.length,
  destinationFloors: towns.length,
  exactSourceMaps: towns.filter(t => t.sourceMap.status === 'verified').length,
  landingPoints: towns.reduce((n,t)=>n+t.landingAudit.length,0),
  walkabilityVerifiedPoints: towns.reduce((n,t)=>n+t.landingAudit.filter(p=>p.walkability?.walkable === true).length,0),
  activeEncounterDestinationFloors: towns.filter(t=>t.encounterEvidence.classification === 'active').length,
  placeholderOnlyDestinationFloors: towns.filter(t=>t.encounterEvidence.classification === 'placeholder_only').length,
  unresolvedDestinationMaps: towns.filter(t=>t.sourceMap.status !== 'verified').length
};

const result = {
  format: 'stoneage-start-destination-closure-v1',
  generatedAt: '2026-09-30',
  fixedSource: { repository:'gavinlinasd/StoneAge', ref:FIXED_REF },
  sourceContracts: {
    encount: 'gmsv/src/char/encount.c::ENCOUNT_initEncount',
    encountFile: ENCOUNT_PATH,
    mapRuntime: 'src/stoneage_map_runtime.mjs::sourceMapWalkableAt',
    mapSourceCatalog: 'data/generated/stoneage_map_source_catalog.json',
    worldGraph: 'data/generated/stoneage_world_graph_index.json::directedFloorEdges'
  },
  sourceEvidence: {
    encountBlobSha: ENCOUNT_SHA,
    encountRowsTotal: encountRows.length,
    activeEncounterDefinition: 'probMax > 0 AND at least one numeric group id'
  },
  statistics,
  towns,
  status: {
    destinationWalkability: statistics.exactSourceMaps === statistics.destinationFloors && statistics.walkabilityVerifiedPoints === statistics.landingPoints ? 'closed' : 'partial',
    directDestinationEncounter: statistics.activeEncounterDestinationFloors === statistics.destinationFloors ? 'closed' : 'partial',
    fullFirstRoute: 'partial'
  },
  policy: 'Do not treat zero-probability/no-group encounter placeholders as active encounters. Missing fixed-source destination map blobs remain unresolved and are never replaced by guessed or cross-version maps.'
};

fs.mkdirSync(path.dirname(out), {recursive:true});
fs.writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({out, statistics}, null, 2));
