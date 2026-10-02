#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const ENDPOINT_MAP_ROOT = path.join(ROOT, 'ro0000/server/merged-source/gmsv/data/map');
const ENDPOINT_MAPSET = path.join(ROOT, 'ro0000/server/merged-source/gmsv/data/map/mapset.txt');
const ENDPOINT_MAPWARP = path.join(ROOT, 'ro0000/server/merged-source/gmsv/data/map/mapwarp.txt');
const ENDPOINT_NPC_ROOT = path.join(ROOT, 'ro0000/server/merged-source/gmsv/data/npc');
const OUT = path.join(ROOT, 'data/generated/stoneage_endpoint_world_blocker_audit.json');
const FIXED_ROOT = path.join(ROOT, 'fixed-c-source');
const FIXED_MAPSET = path.join(FIXED_ROOT, 'gmsv/data/map/mapset.txt');
const FIXED_REF = '1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

function readU16BE(bytes, offset, label) {
  if (offset + 2 > bytes.length) throw new Error('truncated ' + label);
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function decodeEndpointMap(bytes) {
  if (bytes.length < 42) throw new Error('endpoint map too small');
  const magic = bytes.subarray(0, 6).toString('ascii');
  if (magic !== 'LS&MAP' && magic !== 'LS2MAP') throw new Error('invalid endpoint map magic: ' + JSON.stringify(magic));
  let p = 6;
  const id = readU16BE(bytes, p, 'floor id'); p += 2;
  const nameLength = magic === 'LS&MAP' ? 48 : 32;
  const nameBytes = bytes.subarray(p, p + nameLength); p += nameLength;
  const zero = nameBytes.indexOf(0);
  const name = nameBytes.subarray(0, zero >= 0 ? zero : 32).toString('utf8');
  const width = readU16BE(bytes, p, 'width'); p += 2;
  const height = readU16BE(bytes, p, 'height'); p += 2;
  const count = width * height;
  if (!Number.isSafeInteger(count) || count <= 0) throw new Error('invalid endpoint map dimensions');
  const bytesPerLayer = count * 2;
  if (p + bytesPerLayer * 2 > bytes.length) throw new Error('endpoint map truncated');
  const tiles = new Uint16Array(count);
  const objects = new Uint16Array(count);
  for (let i = 0; i < count; i++) tiles[i] = readU16BE(bytes, p + i * 2, 'tile layer');
  p += bytesPerLayer;
  for (let i = 0; i < count; i++) objects[i] = readU16BE(bytes, p + i * 2, 'object layer');
  p += bytesPerLayer;
  return { magic, id, name, width, height, tiles, objects, bytesConsumed: p, trailingBytes: bytes.length - p };
}
function blobSha(bytes) {
  const header = Buffer.from('blob ' + bytes.length + String.fromCharCode(0), 'utf8');
  return crypto.createHash('sha1').update(header).update(bytes).digest('hex');
}

function gitSha(rel, cwd = ROOT) {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD:' + rel], { cwd, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.isFile()) out.push(p);
  }
  return out;
}

function parseMapset(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/\r/g, '');
  const rows = new Map();
  const warnings = [];
  for (const [lineIndex, raw] of text.split('\n').entries()) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const tokens = line.split(/\s+/);
    if (tokens.length < 5) {
      warnings.push({ line: lineIndex + 1, reason: 'too-few-columns', raw: line.slice(0, 240) });
      continue;
    }
    const imageId = Number(tokens[0]);
    if (!Number.isInteger(imageId) || imageId < 0 || imageId > 65534) {
      warnings.push({ line: lineIndex + 1, reason: 'invalid-image-id', raw: line.slice(0, 240) });
      continue;
    }
    const walkableRaw = Number(tokens[3]);
    const haveHeightRaw = Number(tokens[4]);
    rows.set(imageId, {
      imageId,
      walkable: Number.isFinite(walkableRaw) && walkableRaw !== 0 ? 1 : 0,
      haveHeight: Number.isFinite(haveHeightRaw) && haveHeightRaw !== 0 ? 1 : 0,
      sourceLine: lineIndex + 1
    });
  }
  const maxImageId = rows.size ? Math.max(...rows.keys()) : -1;
  return { rows, maxImageId, warnings, sha: blobSha(fs.readFileSync(file)), bytes: fs.statSync(file).size };
}

function parseWarps(file) {
  const rows = [];
  const lines = fs.readFileSync(file, 'utf8').replace(/\r/g, '').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw || raw.startsWith('#')) continue;
    const parts = raw.split(':');
    if (parts.length < 4) continue;
    const from = parts[2].split(',').map(Number);
    const to = parts[3].split(',').map(Number);
    if (from.length !== 3 || to.length !== 3 || !from.every(Number.isFinite) || !to.every(Number.isFinite)) continue;
    rows.push({ line: i + 1, raw, from, to });
  }
  return rows;
}

function parseNpcWarpSources(dir) {
  if (!fs.existsSync(dir)) return [];
  const rows = [];
  for (const file of walk(dir)) {
    if (!file.endsWith('.create')) continue;
    const lines = fs.readFileSync(file, 'utf8').replace(/\r/g, '').split('\n');
    let block = null;
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i].trim();
      if (raw === '{') {
        block = { sourceFile: path.relative(ROOT, file).replaceAll(path.sep, '/'), sourceLine: i + 1 };
        continue;
      }
      if (!block) continue;
      if (raw === '}') {
        if (block.floorid !== undefined && block.borncorner && block.enemy) {
          const born = block.borncorner.split(',').map(Number);
          const enemy = block.enemy.split('|').map(value => value.trim());
          if (
            born.length >= 2 &&
            born.slice(0, 2).every(Number.isFinite) &&
            enemy[0] === 'npcgen_warp' &&
            enemy.length >= 4 &&
            [enemy[1], enemy[2], enemy[3]].every(value => Number.isFinite(Number(value)))
          ) {
            rows.push({
              sourceFile: block.sourceFile,
              sourceLine: block.sourceLine,
              from: [Number(block.floorid), born[0], born[1]],
              to: [Number(enemy[1]), Number(enemy[2]), Number(enemy[3])]
            });
          }
        }
        block = null;
        continue;
      }
      const eq = raw.indexOf('=');
      if (eq <= 0) continue;
      const key = raw.slice(0, eq).trim();
      const value = raw.slice(eq + 1).trim();
      if (key === 'floorid' || key === 'borncorner' || key === 'enemy') block[key] = value;
    }
  }
  return rows;
}

function fixedEventWarpSemantics() {
  const callFromCli = path.join(FIXED_ROOT, 'gmsv/src/callfromcli.c');
  const eventSource = path.join(FIXED_ROOT, 'gmsv/src/char/event.c');
  if (!fs.existsSync(callFromCli) || !fs.existsSync(eventSource)) {
    return {
      available: false,
      adjacentWarpPointGuard: false,
      warpNpcDispatch: false
    };
  }
  const ev = fs.readFileSync(callFromCli, 'utf8');
  const event = fs.readFileSync(eventSource, 'utf8');
  return {
    available: true,
    adjacentWarpPointGuard:
      ev.includes('for(i=iy-1;i<=iy+1;i++)') &&
      ev.includes('for(j=ix-1;j<=ix+1;j++)') &&
      ev.includes('warp_point_x[warp_point]=j') &&
      ev.includes('if((x==warp_point_x[i])&& (y==warp_point_y[i]))'),
    warpNpcDispatch:
      event.includes('if( etype == event)') &&
      event.includes('functbl[event]') &&
      event.includes('EVENT_onWarpNPC')
  };
}

function walkableAt(map, x, y, mapset) {
  const xi = Math.trunc(Number(x));
  const yi = Math.trunc(Number(y));
  if (!Number.isFinite(xi) || !Number.isFinite(yi)) return false;
  if (xi < 0 || yi < 0 || xi >= map.width || yi >= map.height) return false;
  const idx = yi * map.width + xi;
  const tileId = Number(map.tiles[idx]);
  const objectId = Number(map.objects[idx]);
  const tile = mapset.rows.get(tileId);
  const object = mapset.rows.get(objectId);
  const objectMode = object?.walkable ?? 0;
  const tileWalkable = tile?.walkable === 1;
  if (objectMode === 0) return false;
  if (objectMode === 1) return tileWalkable;
  if (objectMode === 2) return true;
  return false;
}

function connectedComponents(map, mapset) {
  const n = map.width * map.height;
  const walkable = new Uint8Array(n);
  const component = new Int32Array(n);
  component.fill(-1);
  const queue = new Int32Array(n);
  let componentCount = 0;
  let walkableCount = 0;
  const componentSizes = [];
  for (let i = 0; i < n; i++) {
    const x = i % map.width;
    const y = Math.floor(i / map.width);
    if (!walkableAt(map, x, y, mapset)) continue;
    walkable[i] = 1;
    walkableCount++;
  }
  for (let start = 0; start < n; start++) {
    if (!walkable[start] || component[start] !== -1) continue;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    component[start] = componentCount;
    while (head < tail) {
      const i = queue[head++];
      const x = i % map.width;
      const y = Math.floor(i / map.width);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue;
        const ni = ny * map.width + nx;
        if (!walkable[ni] || component[ni] !== -1) continue;
        component[ni] = componentCount;
        queue[tail++] = ni;
      }
    }
    componentSizes.push(tail);
    componentCount++;
  }
  return { walkable, component, componentCount, walkableCount, componentSizes };
}

function movementReachable(map, mapset, startPoints, targetPoints) {
  const n = map.width * map.height;
  const visited = new Uint8Array(n);
  const queue = new Int32Array(n);
  const targets = new Set(targetPoints.map(([x, y]) => y * map.width + x));
  let head = 0;
  let tail = 0;
  const starts = [];
  for (const [x, y] of startPoints) {
    if (!walkableAt(map, x, y, mapset)) continue;
    const idx = y * map.width + x;
    if (visited[idx]) continue;
    visited[idx] = 1;
    queue[tail++] = idx;
    starts.push([x, y]);
  }
  const reached = [];
  while (head < tail) {
    const i = queue[head++];
    const x = i % map.width;
    const y = Math.floor(i / map.width);
    if (targets.has(i)) reached.push([x, y]);
    for (const [dx, dy, diagonal] of [[1, 0, false], [-1, 0, false], [0, 1, false], [0, -1, false], [1, 1, true], [1, -1, true], [-1, 1, true], [-1, -1, true]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue;
      const ni = ny * map.width + nx;
      if (visited[ni] || !walkableAt(map, nx, ny, mapset)) continue;
      if (diagonal && (!walkableAt(map, x + dx, y, mapset) || !walkableAt(map, x, y + dy, mapset))) continue;
      visited[ni] = 1;
      queue[tail++] = ni;
    }
  }
  return { starts, reached, allTargetsReached: targetPoints.every(([x, y]) => visited[y * map.width + x] === 1) };
}

function legalMoveTargetsFromCurrent(map, mapset, x, y) {
  const out = [];
  for (const [dx, dy, diagonal] of [
    [1, 0, false], [-1, 0, false], [0, 1, false], [0, -1, false],
    [1, 1, true], [1, -1, true], [-1, 1, true], [-1, -1, true]
  ]) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue;
    if (!walkableAt(map, nx, ny, mapset)) continue;
    if (diagonal && (
      !walkableAt(map, x + dx, y, mapset) ||
      !walkableAt(map, x, y + dy, mapset)
    )) continue;
    out.push({ x: nx, y: ny, diagonal, component: -1 });
  }
  return out;
}

function pointSummary(map, mapset, points, component) {
  return points.map(([x, y]) => {
    const walkable = walkableAt(map, x, y, mapset);
    const inBounds = x >= 0 && y >= 0 && x < map.width && y < map.height;
    const idx = inBounds ? y * map.width + x : -1;
    return { x, y, inBounds, walkable, component: walkable ? component[idx] : -1 };
  });
}

function findMaps() {
  if (!fs.existsSync(ENDPOINT_MAP_ROOT)) throw new Error('Missing endpoint map root: ' + ENDPOINT_MAP_ROOT);
  const candidates = [];
  for (const file of walk(ENDPOINT_MAP_ROOT)) {
    const fd = fs.openSync(file, 'r');
    const magic = Buffer.alloc(6);
    try {
      const n = fs.readSync(fd, magic, 0, 6, 0);
      const signature = magic.toString('ascii');
      if (n !== 6 || (signature !== 'LS&MAP' && signature !== 'LS2MAP')) continue;
    } finally {
      fs.closeSync(fd);
    }
    try {
      const bytes = fs.readFileSync(file);
      const map = decodeEndpointMap(bytes);
      if (map.id === 200 || map.id === 4000 || map.id === 3000 || map.id === 4006) {
        candidates.push({
          floorId: map.id,
          path: path.relative(ROOT, file).replaceAll(path.sep, '/'),
          blobSha: blobSha(bytes),
          size: bytes.length,
          width: map.width,
          height: map.height,
          magic: map.magic,
          headerNameBytes: map.magic === 'LS&MAP' ? 48 : 32,
          name: map.name,
          map
        });
      }
    } catch (error) {
      candidates.push({
        parseError: String(error.message),
        path: path.relative(ROOT, file).replaceAll(path.sep, '/'),
        size: fs.statSync(file).size
      });
    }
  }
  return candidates;
}

function summarizeCandidate(c) {
  return c.parseError ? c : {
    floorId: c.floorId, magic: c.magic, path: c.path, blobSha: c.blobSha, size: c.size,
    width: c.width, height: c.height, name: c.name, sourcePath: c.path
  };
}

const mapset = parseMapset(ENDPOINT_MAPSET);
const fixedMapset = fs.existsSync(FIXED_MAPSET) ? parseMapset(FIXED_MAPSET) : null;
const mapsetMissingImageIds = (map) => {
  const ids = new Set([...Array.from(map.tiles), ...Array.from(map.objects)].map(Number));
  return [...ids].filter(id => !mapset.rows.has(id)).slice(0, 200);
};
const candidates = findMaps();
const byFloor = new Map();
for (const c of candidates) {
  if (!c.floorId) continue;
  const list = byFloor.get(c.floorId) || [];
  list.push(c);
  byFloor.set(c.floorId, list);
}
const selected = {};
for (const floor of [200, 3000, 4000, 4006]) {
  const list = byFloor.get(floor) || [];
  selected[floor] = list.length === 1 ? list[0] : null;
}

const warps = parseWarps(ENDPOINT_MAPWARP);
const npcWarpSources = parseNpcWarpSources(ENDPOINT_NPC_ROOT);
const fixedWarpEventSemantics = fixedEventWarpSemantics();
const entry4006 = warps.filter(row => row.from[0] === 4006 && row.to[0] === 4000);
const exit4000to200 = warps.filter(row => row.from[0] === 4000 && row.to[0] === 200);
const exit3000to200 = warps.filter(row => row.from[0] === 3000 && row.to[0] === 200);
const exit3006to3000 = warps.filter(row => row.from[0] === 3006 && row.to[0] === 3000);

const result = {
  format: 'stoneage-endpoint-world-blocker-audit-v1',
  updated: new Date().toISOString(),
  source: {
    endpointRoot: 'ro0000/server/merged-source/gmsv/data/map',
    mapsetPath: 'ro0000/server/merged-source/gmsv/data/map/mapset.txt',
    mapsetBlobSha: gitSha('ro0000/server/merged-source/gmsv/data/map/mapset.txt'),
    mapwarpBlobSha: gitSha('ro0000/server/merged-source/gmsv/data/map/mapwarp.txt'),
    fixedSource: 'gavinlinasd/StoneAge@' + FIXED_REF,
    fixedMapsetBlobSha: fs.existsSync(FIXED_MAPSET) ? gitSha('gmsv/data/map/mapset.txt', FIXED_ROOT) : null,
    mapFormat: 'Endpoint accepts LS&MAP (48-byte show string) and LS2MAP (32-byte show string); endpoint snapshot is currently expected to use LS&MAP.'
  },
  endpointMapset: {
    bytes: mapset.bytes, rowCount: mapset.rows.size, maxImageId: mapset.maxImageId,
    warnings: mapset.warnings.length, sameBlobAsFixed: Boolean(fixedMapset && fixedMapset.sha === mapset.sha)
  },
  endpointMaps: {
    scannedFloorCandidates: candidates.map(summarizeCandidate),
    floorCounts: Object.fromEntries([200, 3000, 4000, 4006].map(floor => [String(floor), (byFloor.get(floor) || []).length]))
  },
  warps: {
    entry3006to3000: exit3006to3000.map(row => ({ line: row.line, from: row.from, to: row.to })),
    entry4006to4000: entry4006.map(row => ({ line: row.line, from: row.from, to: row.to })),
    exit4000to200: exit4000to200.map(row => ({ line: row.line, from: row.from, to: row.to })),
    exit3000to200: exit3000to200.map(row => ({ line: row.line, from: row.from, to: row.to })),
    npcWarpSources: npcWarpSources.length
  },
  checks: {},
  conclusion: { status: 'unresolved', reasons: [] }
};

if (selected[4000]) {
  const map = selected[4000].map;
  const components = connectedComponents(map, mapset);
  const entryPoints = entry4006.map(row => [row.to[1], row.to[2]]);
  const portalOrigins = exit4000to200.map(row => [row.from[1], row.from[2]]);
  const entrySummary = pointSummary(map, mapset, entryPoints, components.component);
  const portalSummary = pointSummary(map, mapset, portalOrigins, components.component);
  const reachable = movementReachable(map, mapset, entryPoints, portalOrigins);
  const targetComponents = [...new Set(portalSummary.map(p => p.component).filter(v => v >= 0))];
  const startComponents = [...new Set(entrySummary.map(p => p.component).filter(v => v >= 0))];
  const alternateEntryComponentWarps = warps
    .filter(row =>
      row.from[0] === 4000 &&
      row.to[0] !== 200 &&
      walkableAt(map, row.from[1], row.from[2], mapset)
    )
    .map(row => ({
      line: row.line,
      from: row.from,
      to: row.to,
      originComponent: components.component[row.from[2] * map.width + row.from[1]],
      reachableFromEntryComponent: startComponents.includes(
        components.component[row.from[2] * map.width + row.from[1]
        ]
      )
    }))
    .filter(row => row.reachableFromEntryComponent);
  const alternateNpcEntryComponentWarps = npcWarpSources
    .filter(row =>
      row.from[0] === 4000 &&
      row.to[0] !== 200 &&
      walkableAt(map, row.from[1], row.from[2], mapset)
    )
    .map(row => ({
      sourceFile: row.sourceFile,
      sourceLine: row.sourceLine,
      from: row.from,
      to: row.to,
      originComponent: components.component[row.from[2] * map.width + row.from[1]],
      reachableFromEntryComponent: startComponents.includes(
        components.component[row.from[2] * map.width + row.from[1]
        ]
      )
    }))
    .filter(row => row.reachableFromEntryComponent);
  result.checks.floor4000 = {
    map: summarizeCandidate(selected[4000]),
    missingMapsetImageIds: mapsetMissingImageIds(map),
    components: { count: components.componentCount, walkableCells: components.walkableCount },
    entryPoints: entrySummary,
    portalOrigins: portalSummary,
    startComponents,
    portalComponents: targetComponents,
    reachableTargets: reachable.reached,
    allPortalOriginsMovementReachable: reachable.allTargetsReached,
    alternateEntryComponentWarps,
    alternateNpcEntryComponentWarps,
    movementUsesLegalDiagonalRule: true
  };
} else {
  result.conclusion.reasons.push('Endpoint floor 4000 did not resolve to exactly one LS2MAP file.');
}

if (selected[200]) {
  const map = selected[200].map;
  const points4000 = exit4000to200.map(row => [row.to[1], row.to[2]]);
  const points3000 = exit3000to200.map(row => [row.to[1], row.to[2]]);
  const uniquePoints = [...new Map([...points4000, ...points3000].map(p => [p.join(','), p])).values()];
  const components = connectedComponents(map, mapset);
  const landing3000 = pointSummary(map, mapset, points3000, components.component);
  const specialLanding = landing3000.find(p => p.x === 587 && p.y === 318) || null;
  const escapeTargets = specialLanding
    ? legalMoveTargetsFromCurrent(map, mapset, specialLanding.x, specialLanding.y).map(target => ({
        ...target,
        component: components.component[target.y * map.width + target.x]
      }))
    : [];
  const escapeComponents = [...new Set(escapeTargets.map(target => target.component).filter(v => v >= 0))];
  const landingComponent = specialLanding?.component ?? -1;
  const outgoingWarps200 = warps.filter(row => row.from[0] === 200).map(row => ({
    line: row.line,
    from: row.from,
    to: row.to,
    originWalkable: walkableAt(map, row.from[1], row.from[2], mapset),
    originComponent: walkableAt(map, row.from[1], row.from[2], mapset)
      ? components.component[row.from[2] * map.width + row.from[1]]
      : -1
  }));
  const landingComponentOutgoingWarps = outgoingWarps200.filter(row => row.originComponent === landingComponent);
  const reverseSpecialWarp = npcWarpSources.find(row =>
    row.from[0] === 200 && row.from[1] === 588 && row.from[2] === 318 &&
    row.to[0] === 3000 && row.to[1] === 74 && row.to[2] === 59
  ) || null;
  const eventRecoverableSpecialLanding = Boolean(
    specialLanding &&
    reverseSpecialWarp &&
    fixedWarpEventSemantics.adjacentWarpPointGuard &&
    fixedWarpEventSemantics.warpNpcDispatch &&
    Math.abs(588 - specialLanding.x) <= 1 &&
    Math.abs(318 - specialLanding.y) <= 1
  );
  result.checks.floor200 = {
    map: summarizeCandidate(selected[200]),
    missingMapsetImageIds: mapsetMissingImageIds(map),
    components: {
      count: components.componentCount,
      walkableCells: components.walkableCount,
      sizes: components.componentSizes.map((size, id) => ({ id, size }))
    },
    landingFrom4000to200: pointSummary(map, mapset, points4000, components.component),
    landingFrom3000to200: landing3000,
    uniqueLandingCount: uniquePoints.length,
    specialLanding587318: {
      landing: specialLanding,
      escapeTargets,
      escapeComponents,
      canExitIntoWalkableMap: escapeTargets.length > 0,
      canEnterMainWalkableComponent: escapeComponents.includes(0),
      hasOutgoingWarpInLandingComponent: landingComponentOutgoingWarps.length > 0,
      outgoingWarpsInLandingComponent: landingComponentOutgoingWarps.slice(0, 100),
      manualEventWarpRecovery: {
        landing: specialLanding ? [specialLanding.x, specialLanding.y] : null,
        triggerWarpNpc: [588, 318],
        triggerIsAdjacent: Boolean(specialLanding && Math.abs(588 - specialLanding.x) <= 1 && Math.abs(318 - specialLanding.y) <= 1),
        reverseNpcWarpSource: reverseSpecialWarp,
        fixedSourceEventSemantics: fixedWarpEventSemantics,
        recoverableWithoutSteppingOnOrigin: eventRecoverableSpecialLanding
      }
    }
  };
} else {
  result.conclusion.reasons.push('Endpoint floor 200 did not resolve to exactly one LS2MAP file.');
}

const floor4000 = result.checks.floor4000;
const floor200 = result.checks.floor200;
const landing3000 = floor200?.landingFrom3000to200 || [];
const target587318 = landing3000.find(p => p.x === 587 && p.y === 318);
const endpoint4000Closed = Boolean(floor4000 && floor4000.allPortalOriginsMovementReachable);
const specialLanding587318 = floor200?.specialLanding587318;
const endpoint3000LandingClosed = Boolean(
  target587318 &&
  (
    target587318.walkable ||
    specialLanding587318?.canEnterMainWalkableComponent ||
    specialLanding587318?.manualEventWarpRecovery?.recoverableWithoutSteppingOnOrigin
  )
);
const endpointMapEvidenceClosed = Boolean(
  floor4000 &&
  floor200 &&
  floor4000.missingMapsetImageIds.length === 0 &&
  floor200.missingMapsetImageIds.length === 0
);
result.checks.reopenedBlockers = {
  route4000to200: {
    resolved: endpoint4000Closed,
    status: endpoint4000Closed ? 'closed-for-endpoint-movement' : 'still-blocked',
    evidence: floor4000 ? {
      entryPoints: floor4000.entryPoints,
      portalOrigins: floor4000.portalOrigins,
      startComponents: floor4000.startComponents,
      portalComponents: floor4000.portalComponents,
      allPortalOriginsMovementReachable: floor4000.allPortalOriginsMovementReachable
    } : null
  },
  route3000to200Landing587318: {
    resolved: endpoint3000LandingClosed,
    status: endpoint3000LandingClosed ? 'closed-for-post-warp-movement' : 'still-blocked',
    evidence: {
      landing: target587318,
      warpAllowsNonwalkableDestination: true,
      escapeTargets: specialLanding587318?.escapeTargets ?? [],
      canExitIntoWalkableMap: specialLanding587318?.canExitIntoWalkableMap ?? false,
      canEnterMainWalkableComponent: specialLanding587318?.canEnterMainWalkableComponent ?? false,
      hasOutgoingWarpInLandingComponent: specialLanding587318?.hasOutgoingWarpInLandingComponent ?? false,
      outgoingWarpsInLandingComponent: specialLanding587318?.outgoingWarpsInLandingComponent ?? [],
      manualEventWarpRecovery: specialLanding587318?.manualEventWarpRecovery ?? null
    }
  }
};

if (!endpointMapEvidenceClosed) {
  result.conclusion.status = 'unresolved-map-evidence';
} else if (endpoint4000Closed && endpoint3000LandingClosed) {
  result.conclusion.status = 'blockers-closed';
} else {
  result.conclusion.status = 'audited-open-blockers';
}
result.conclusion.mapEvidenceClosed = endpointMapEvidenceClosed;
result.conclusion.blockersClosed = endpoint4000Closed && endpoint3000LandingClosed;
result.conclusion.reasons.push(...(endpoint4000Closed ? [] : ['Endpoint 4000 portal-origin movement remains blocked: entry component and portal-origin component differ.']));
result.conclusion.reasons.push(...(endpoint3000LandingClosed ? [] : ['Endpoint 200 landing (587,318) cannot reach the main walkable component or another proven outgoing warp.']));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const serialized = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--write')) {
  fs.writeFileSync(OUT, serialized);
  console.log(JSON.stringify({
    pass: result.conclusion.status === 'blockers-closed',
    route4000to200: result.checks.reopenedBlockers.route4000to200.status,
    route3000to200Landing587318: result.checks.reopenedBlockers.route3000to200Landing587318.status,
    endpointMaps: result.endpointMaps.floorCounts
  }, null, 2));
} else if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT)) throw new Error('Missing endpoint world blocker audit: ' + OUT);
  if (fs.readFileSync(OUT, 'utf8') !== serialized) throw new Error('Endpoint world blocker audit is stale.');
  console.log('endpoint-world-blocker-audit-check-ok');
} else {
  console.log(serialized);
}