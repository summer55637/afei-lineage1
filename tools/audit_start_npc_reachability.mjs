#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import { parseLS2Map } from './stoneage_ls2map_parser.mjs';
import { sourceMapWalkableAt } from '../src/stoneage_map_runtime.mjs';

const args = process.argv.slice(2);
const sourceRootArg = args.indexOf('--source-root');
const outArg = args.indexOf('--out');
const root = path.resolve(sourceRootArg >= 0 ? args[sourceRootArg + 1] : '/tmp/StoneAge');
const out = path.resolve(outArg >= 0 ? args[outArg + 1] : 'data/generated/stoneage_start_npc_reachability.json');

const ref = '1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const startMaps = [
  { hometown: 0, elder: 'samugiru', floor: 1006, x: 15, y: 22, sourcePath: 'gmsv/data/map/sainasu/samugiru/1006', sourceBlobSha: 'a95ff591d6d64a3e00d0cd9a8f308955078ed489' },
  { hometown: 1, elder: 'marinasu', floor: 2006, x: 20, y: 16, sourcePath: 'gmsv/data/map/sainasu/marinasu/2006', sourceBlobSha: '3d4266aa56915ebcba1317cb6f8af0bbba5f45c9' },
  { hometown: 2, elder: 'jaja', floor: 3006, x: 21, y: 16, sourcePath: 'gmsv/data/map/jyaruga/jaja/3006', sourceBlobSha: '7e321345229c684ba88a24ac72900fd5777732e6' },
  { hometown: 3, elder: 'karutarna', floor: 4006, x: 14, y: 20, sourcePath: 'gmsv/data/map/jyaruga/karutana/4006', sourceBlobSha: 'bbdeb0d1bef3ec3993afc75d6416599c3bd5cf46' },
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, files);
    else if (entry.isFile()) files.push(file);
  }
  return files;
}

function gitBlobSha(buffer) {
  return require('node:crypto').createHash('sha1')
    .update(Buffer.from('blob ' + buffer.length + String.fromCharCode(0), 'utf8'))
    .update(buffer)
    .digest('hex');
}

function neighbors(x, y) {
  return [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
}

function bfs(map, mapset, start, targets) {
  const key = (x, y) => `${x},${y}`;
  const queue = [[start.x, start.y]];
  let head = 0;
  const prev = new Map([[key(start.x, start.y), null]]);
  const remaining = new Map(targets.map(([x, y]) => [key(x, y), { x, y }]));
  const found = [];

  if (!sourceMapWalkableAt(map, start.x, start.y, mapset)) return found;

  while (head < queue.length && remaining.size > 0) {
    const [x, y] = queue[head++];
    const k = key(x, y);

    if (remaining.has(k)) {
      let length = 0;
      let cursor = k;
      while (cursor !== key(start.x, start.y)) {
        cursor = prev.get(cursor);
        length += 1;
      }
      found.push({ x, y, pathLength: length });
      remaining.delete(k);
    }

    for (const [nx, ny] of neighbors(x, y)) {
      if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue;
      const nextKey = key(nx, ny);
      if (prev.has(nextKey)) continue;
      if (!sourceMapWalkableAt(map, nx, ny, mapset)) continue;
      prev.set(nextKey, k);
      queue.push([nx, ny]);
    }
  }

  return found;
}

const mapset = JSON.parse(
  fs.readFileSync('data/generated/stoneage_mapset_runtime.json', 'utf8'),
);
const startFlow = JSON.parse(
  fs.readFileSync('data/generated/stoneage_start_flow_index.json', 'utf8'),
);

const sourceValidation = [];
const rows = [];

for (const spec of startMaps) {
  const mapFile = path.join(root, spec.sourcePath);
  if (!fs.existsSync(mapFile)) throw new Error(`missing pinned source map: ${spec.sourcePath}`);
  const buffer = fs.readFileSync(mapFile);
  const actualBlobSha = gitBlobSha(buffer);
  if (actualBlobSha !== spec.sourceBlobSha) {
    throw new Error(`source map blob mismatch for ${spec.sourcePath}: expected ${spec.sourceBlobSha}, got ${actualBlobSha}`);
  }

  const map = parseLS2Map(buffer);
  if (map.floorId !== spec.floor) {
    throw new Error(`map header mismatch for ${spec.sourcePath}: expected ${spec.floor}, got ${map.floorId}`);
  }

  sourceValidation.push({
    hometown: spec.hometown,
    floor: spec.floor,
    sourcePath: spec.sourcePath,
    expectedBlobSha: spec.sourceBlobSha,
    actualBlobSha,
    blobShaVerified: true,
    mapHeader: { floorId: map.floorId, width: map.width, height: map.height },
  });

  const npcRows = (startFlow.npcInstancesOnStartFloors || [])
    .filter((npc) => npc.floorId === spec.floor);

  for (const npc of npcRows) {
    if (!Number.isFinite(npc.x) || !Number.isFinite(npc.y)) continue;

    const stanceCells = neighbors(npc.x, npc.y)
      .filter(([x, y]) => sourceMapWalkableAt(map, x, y, mapset));

    const found = bfs(
      map,
      mapset,
      { x: spec.x, y: spec.y },
      stanceCells,
    );

    rows.push({
      hometown: spec.hometown,
      elder: spec.elder,
      floor: spec.floor,
      template: npc.templateName,
      npcPath: npc.path,
      blockIndex: npc.blockIndex,
      npc: [npc.x, npc.y],
      npcCellWalkable: sourceMapWalkableAt(map, npc.x, npc.y, mapset),
      interactionStances: stanceCells.map(([x, y]) => [x, y]),
      reachableInteraction: found.length > 0,
      minPathToInteraction: found.length > 0
        ? Math.min(...found.map((item) => item.pathLength))
        : null,
    });
  }
}

const totalCoordinateResolved = rows.length;
const reachableCoordinateResolved = rows.filter((row) => row.reachableInteraction).length;
const totalNpcInstances = (startFlow.npcInstancesOnStartFloors || []).length;
const unresolvedCoordinateInstances = totalNpcInstances - totalCoordinateResolved;

const index = {
  format: 'stoneage-start-npc-reachability-v1',
  generatedAt: '2026-09-30',
  fixedSource: { repository: 'gavinlinasd/StoneAge', ref },
  sourceContracts: {
    startFlow: 'data/generated/stoneage_start_flow_index.json',
    mapParser: 'tools/stoneage_ls2map_parser.mjs',
    walkability: 'src/stoneage_map_runtime.mjs::sourceMapWalkableAt',
    interaction: 'gmsv/src/npc/npcutil.c::NPC_Util_charIsInFrontOfChar',
  },
  statistics: {
    totalNpcInstancesOnStartFloors: totalNpcInstances,
    coordinateResolvedInstances: totalCoordinateResolved,
    reachableCoordinateResolvedInstances: reachableCoordinateResolved,
    unreachableCoordinateResolvedInstances: totalCoordinateResolved - reachableCoordinateResolved,
    unresolvedCoordinateInstances,
  },
  sourceValidation,
  rows,
  policy:
    'This audit treats an NPC interaction as source-reachable when the player can walk from the pinned hometown spawn to at least one walkable orthogonal stance cell adjacent to the NPC. This matches NPC_Util_charIsInFrontOfChar distance=1 used by key start-town services such as Familyman, Bankman and Windowman. NPCs without a resolved numeric coordinate remain unresolved rather than being guessed.',
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(index, null, 2) + '\n');
console.log(JSON.stringify({ pass: reachableCoordinateResolved === totalCoordinateResolved, statistics: index.statistics }));
