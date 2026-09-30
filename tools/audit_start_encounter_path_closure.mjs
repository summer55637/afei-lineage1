#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { sourceMapWalkableAt, sourceMapTileWithAttributes } from '../src/stoneage_map_runtime.mjs';

const outArg = process.argv.indexOf('--out');
const out = path.resolve(outArg >= 0 ? process.argv[outArg + 1] : 'data/generated/stoneage_start_encounter_path_closure.json');

const route = JSON.parse(fs.readFileSync('data/generated/stoneage_start_destination_warp_coordinates.json', 'utf8'));
const targets = JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_target_index.json', 'utf8'));
const index = JSON.parse(fs.readFileSync('data/generated/stoneage_map_runtime_index.json', 'utf8'));
const mapset = JSON.parse(fs.readFileSync('data/generated/stoneage_mapset_runtime.json', 'utf8'));

function loadMap(floor) {
  const entry = index.maps?.[String(floor)];
  if (!entry?.path) return { entry: entry ?? null, map: null };
  const p = entry.path.startsWith('./') ? entry.path.slice(2) : entry.path;
  if (!fs.existsSync(p)) return { entry, map: null };
  const map = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (Number(map.floorId) !== Number(floor)) throw new Error('runtime floor mismatch');
  return { entry, map };
}

function canWalk(map, x, y) {
  if (!map) return false;
  const t = sourceMapTileWithAttributes(map, x, y, mapset);
  return !!t && sourceMapWalkableAt(map, x, y, mapset, { flying: false });
}

function buildDistanceField(map, rows) {
  const width = Number(map.width);
  const height = Number(map.height);
  const total = width * height;
  const distance = new Int32Array(total);
  const nearestEncounter = new Int32Array(total);
  distance.fill(-1);
  nearestEncounter.fill(-1);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const ordered = [...rows].sort((a, b) => Number(a.encounterId) - Number(b.encounterId));
  for (const row of ordered) {
    const [x1, y1, x2, y2] = row.rect.map(Number);
    const minX = Math.max(0, Math.min(x1, x2));
    const maxX = Math.min(width - 1, Math.max(x1, x2));
    const minY = Math.max(0, Math.min(y1, y2));
    const maxY = Math.min(height - 1, Math.max(y1, y2));
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (!canWalk(map, x, y)) continue;
        const i = y * width + x;
        if (distance[i] !== -1) continue;
        distance[i] = 0;
        nearestEncounter[i] = Number(row.encounterId);
        queue[tail++] = i;
      }
    }
  }

  while (head < tail) {
    const i = queue[head++];
    const x = i % width;
    const y = Math.floor(i / width);
    const d = distance[i] + 1;
    const nbs = [[x+1,y],[x-1,y],[x,y+1],[x,y-1]];
    for (const [nx, ny] of nbs) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const j = ny * width + nx;
      if (distance[j] !== -1) continue;
      if (!canWalk(map, nx, ny)) continue;
      distance[j] = d;
      nearestEncounter[j] = nearestEncounter[i];
      queue[tail++] = j;
    }
  }
  return { distance, nearestEncounter };
}

const floors = {};
for (const floor of [100, 200]) {
  const { entry, map } = loadMap(floor);
  const floorTargets = targets.floors?.[String(floor)]?.unconditionalRows ?? [];
  const incoming = targets.incomingPortalGroups?.[String(floor)] ?? [];
  if (!map) {
    floors[String(floor)] = { runtimePresent: false, portalGroups: [], status: 'runtime_unresolved' };
    continue;
  }

  const field = buildDistanceField(map, floorTargets);
  const width = Number(map.width);
  const portalGroups = incoming.map(group => {
    const landingPoints = group.points.map(point => {
      const x = Number(point[0]), y = Number(point[1]);
      const walkable = canWalk(map, x, y);
      if (!walkable) {
        return { point: [x, y], walkable: false, pathToUnconditional: null };
      }
      const i = y * width + x;
      const distance = field.distance[i];
      return {
        point: [x, y],
        walkable: true,
        pathToUnconditional: distance >= 0 ? {
          distance,
          encounterId: field.nearestEncounter[i]
        } : null
      };
    });
    const reachable = landingPoints.filter(x => x.pathToUnconditional);
    return {
      id: group.id,
      fromFloor: Number(group.fromFloor),
      landingCount: landingPoints.length,
      walkableLandingCount: landingPoints.filter(x => x.walkable).length,
      reachableLandingCount: reachable.length,
      allLandingsWalkable: landingPoints.every(x => x.walkable),
      atLeastOneLandingReachesUnconditional: reachable.length > 0,
      allLandingsReachUnconditional: reachable.length === landingPoints.length,
      minPathLength: reachable.length ? Math.min(...reachable.map(x => x.pathToUnconditional.distance)) : null,
      nearestEncounterIds: [...new Set(reachable.map(x => x.pathToUnconditional.encounterId))],
      landings: landingPoints
    };
  });

  floors[String(floor)] = {
    runtimePresent: true,
    sourcePath: entry.sourcePath,
    sourceBlobSha: entry.sourceBlobSha,
    width,
    height: Number(map.height),
    unconditionalEncounterCount: floorTargets.length,
    portalGroups,
    status: portalGroups.every(g => g.atLeastOneLandingReachesUnconditional) ? 'closed' : 'partial'
  };
}

const result = {
  format: 'stoneage-start-encounter-path-closure-v1',
  generatedAt: new Date().toISOString().slice(0, 10),
  fixedSource: route.fixedSource,
  sourceContracts: {
    encounterTargets: 'data/generated/stoneage_start_encounter_target_index.json',
    walkability: 'src/stoneage_map_runtime.mjs::sourceMapWalkableAt',
    runtimeIndex: 'data/generated/stoneage_map_runtime_index.json'
  },
  policy: {
    routeClosure: 'A landing is route-closed only when it is walkable and a walkable path exists to at least one unconditional encounter rectangle.',
    mixedRows: 'Mixed encounter rows are excluded from unconditional targets.',
    unresolvedRows: 'Unresolved-group encounter rows are excluded from unconditional targets.'
  },
  floors,
  summary: {
    floorsTested: Object.keys(floors).length,
    closedFloors: Object.values(floors).filter(x => x.status === 'closed').length,
    totalPortalGroups: Object.values(floors).flatMap(x => x.portalGroups ?? []).length,
    usablePortalGroups: Object.values(floors).flatMap(x => x.portalGroups ?? []).filter(x => x.atLeastOneLandingReachesUnconditional).length,
    status: Object.values(floors).every(x => x.status === 'closed') ? 'closed' : 'partial'
  }
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result.summary, null, 2));
