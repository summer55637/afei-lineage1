#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parseLS2Map } from './stoneage_ls2map_parser.mjs';
import { sourceMapWalkableAt } from '../src/stoneage_map_runtime.mjs';

const args = process.argv.slice(2);
const sourceRootArg = args.indexOf('--source-root');
const outArg = args.indexOf('--out');
const root = path.resolve(sourceRootArg >= 0 ? args[sourceRootArg + 1] : '/tmp/StoneAge');
const out = path.resolve(outArg >= 0 ? args[outArg + 1] : 'data/generated/stoneage_start_walkability_audit.json');

const ref = '1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

const startMaps = [
  { hometown: 0, elder: 'samugiru', floor: 1006, x: 15, y: 22, sourcePath: 'gmsv/data/map/sainasu/samugiru/1006', sourceBlobSha: 'a95ff591d6d64a3e00d0cd9a8f308955078ed489' },
  { hometown: 1, elder: 'marinasu', floor: 2006, x: 20, y: 16, sourcePath: 'gmsv/data/map/sainasu/marinasu/2006', sourceBlobSha: '3d4266aa56915ebcba1317cb6f8af0bbba5f45c9' },
  { hometown: 2, elder: 'jaja', floor: 3006, x: 21, y: 16, sourcePath: 'gmsv/data/map/jyaruga/jaja/3006', sourceBlobSha: '7e321345229c684ba88a24ac72900fd5777732e6' },
  { hometown: 3, elder: 'karutarna', floor: 4006, x: 14, y: 20, sourcePath: 'gmsv/data/map/jyaruga/karutana/4006', sourceBlobSha: 'bbdeb0d1bef3ec3993afc75d6416599c3bd5cf46' },
];

function walk(dir, outFiles = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, outFiles);
    else if (entry.isFile()) outFiles.push(file);
  }
  return outFiles;
}

function gitBlobSha(buffer) {
  const header = Buffer.from('blob ' + buffer.length + String.fromCharCode(0), 'utf8');
  return crypto.createHash('sha1').update(header).update(buffer).digest('hex');
}

function parseWarps() {
  const files = walk(path.join(root, 'gmsv/data/npc')).filter((file) => /\\.create$|\\.creata$/i.test(file));
  const rows = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').replace(/\\r/g, '').split('\\n');
    let block = null;
    let blockIndex = 0;
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex].trim();
      if (line === '{') {
        block = { floor: null, born: null, enemies: [], startLine: lineIndex + 1 };
        continue;
      }
      if (!block) continue;
      if (line === '}') {
        if (Number.isInteger(block.floor)) {
          for (const raw of block.enemies) {
            const parts = raw.split('|');
            if (parts[0]?.trim().toLowerCase() !== 'npcgen_warp') continue;
            const toFloor = Number(parts[1]);
            const toX = Number(parts[2]);
            const toY = Number(parts[3]);
            if (Number.isInteger(toFloor) && Number.isFinite(toX) && Number.isFinite(toY) && block.born) {
              rows.push({
                fromFloor: block.floor, fromX: block.born.x, fromY: block.born.y,
                toFloor, toX, toY, blockIndex,
                path: path.relative(root, file).replaceAll(path.sep, '/'),
                startLine: block.startLine,
              });
            }
          }
        }
        block = null;
        blockIndex += 1;
        continue;
      }
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim().toLowerCase();
      const value = line.slice(eq + 1).trim();
      if (key === 'floorid') block.floor = Number(value);
      if (key === 'borncorner') {
        const parts = value.split(',').map(Number);
        if (parts.length === 4 && parts.every(Number.isFinite)) block.born = { x: parts[0], y: parts[1] };
      }
      if (key === 'enemy') block.enemies.push(value);
    }
  }
  return rows;
}

function loadExactMap(spec) {
  const file = path.join(root, spec.sourcePath);
  if (!fs.existsSync(file)) throw new Error(`missing pinned source map: ${spec.sourcePath}`);
  const buffer = fs.readFileSync(file);
  const actualBlobSha = gitBlobSha(buffer);
  if (actualBlobSha !== spec.sourceBlobSha) {
    throw new Error(`source map blob mismatch for ${spec.sourcePath}: expected ${spec.sourceBlobSha}, got ${actualBlobSha}`);
  }
  const map = parseLS2Map(buffer);
  if (map.floorId !== spec.floor) throw new Error(`map header floor mismatch for ${spec.sourcePath}: expected ${spec.floor}, got ${map.floorId}`);
  return { file, map, actualBlobSha };
}

function neighbors(x, y) {
  return [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
}

function bfs(map, mapset, start, target) {
  const key = (x, y) => `${x},${y}`;
  if (!sourceMapWalkableAt(map, start.x, start.y, mapset)) {
    return { reachable: false, path: null, reason: 'start_not_walkable' };
  }
  if (!sourceMapWalkableAt(map, target.x, target.y, mapset)) {
    return { reachable: false, path: null, reason: 'target_not_walkable' };
  }

  const queue = [[start.x, start.y]];
  let head = 0;
  const prev = new Map([[key(start.x, start.y), null]]);

  while (head < queue.length) {
    const [x, y] = queue[head++];
    if (x === target.x && y === target.y) {
      const reversed = [];
      let cursor = key(x, y);
      while (cursor) {
        const [px, py] = cursor.split(',').map(Number);
        reversed.push({ x: px, y: py });
        cursor = prev.get(cursor);
      }
      reversed.reverse();
      return { reachable: true, pathLength: reversed.length - 1, path: reversed, reason: null };
    }

    for (const [nx, ny] of neighbors(x, y)) {
      if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue;
      const nextKey = key(nx, ny);
      if (prev.has(nextKey)) continue;
      if (!sourceMapWalkableAt(map, nx, ny, mapset)) continue;
      prev.set(nextKey, key(x, y));
      queue.push([nx, ny]);
    }
  }

  return { reachable: false, path: null, reason: 'no_walkable_path' };
}

const mapset = JSON.parse(fs.readFileSync('data/generated/stoneage_mapset_runtime.json', 'utf8'));
const warps = parseWarps();
const sourceValidation = [];
const routes = [];

for (const spec of startMaps) {
  const { map, actualBlobSha, file } = loadExactMap(spec);
  sourceValidation.push({
    hometown: spec.hometown,
    floor: spec.floor,
    sourcePath: spec.sourcePath,
    expectedBlobSha: spec.sourceBlobSha,
    actualBlobSha,
    blobShaVerified: true,
    localSourceFile: path.relative(process.cwd(), file).replaceAll(path.sep, '/'),
    mapHeader: { floorId: map.floorId, width: map.width, height: map.height },
  });

  const exits = warps.filter((warp) => warp.fromFloor === spec.floor);
  const exitAudits = exits.map((warp) => ({
    ...warp,
    walkToWarpNpc: bfs(map, mapset, { x: spec.x, y: spec.y }, { x: warp.fromX, y: warp.fromY }),
  }));

  routes.push({
    hometown: spec.hometown,
    elder: spec.elder,
    spawn: { hometown: spec.hometown, elder: spec.elder, floor: spec.floor, x: spec.x, y: spec.y },
    mapFound: true,
    mapSourceVerified: true,
    directWarpCount: exitAudits.length,
    reachableWarpCount: exitAudits.filter((exit) => exit.walkToWarpNpc.reachable).length,
    exitAudits,
  });
}

const statistics = {
  startMapsFound: routes.length,
  verifiedSourceMaps: sourceValidation.filter((entry) => entry.blobShaVerified).length,
  totalDirectWarpExits: routes.reduce((sum, route) => sum + route.directWarpCount, 0),
  reachableWarpExits: routes.reduce((sum, route) => sum + route.reachableWarpCount, 0),
  unreachableWarpExits: routes.reduce((sum, route) => sum + route.directWarpCount - route.reachableWarpCount, 0),
};

const index = {
  format: 'stoneage-start-walkability-audit-v2',
  generatedAt: '2026-09-30',
  fixedSource: { repository: 'gavinlinasd/StoneAge', ref },
  sourceContracts: {
    mapParser: 'tools/stoneage_ls2map_parser.mjs',
    walkability: 'src/stoneage_map_runtime.mjs::sourceMapWalkableAt',
    movement: 'gmsv/src/char/char_walk.c::CHAR_walk_move',
    warp: 'gmsv/src/npc/npc_warp.c::NPC_WarpWatch',
  },
  statistics,
  sourceValidation,
  routes,
  policy: 'This audit uses the exact four pinned hometown map paths and verifies their Git blob SHA before walking the map. Fixed C checks MAP_walkAble for the destination cell, then treats CHAR_ISOVERED NPC objects as pass-through and invokes NPC_WarpWatch after CHAR_ACTWALK. Therefore the recorded warp NPC coordinate itself must be map-walkable; an unreachable result is not caused merely by NPC occupancy. This tool does not infer quest order or designate a best route.',
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(index, null, 2) + '\\n');
console.log(JSON.stringify({ pass: statistics.unreachableWarpExits === 0, statistics }));
