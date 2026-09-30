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
const SOURCES = {
  encount: { path: 'gmsv/data/encount.txt', sha: '89da97a15ea866a36f26ec3bb7ab5490f3eccc5f' },
  group: { path: 'gmsv/data/group1.txt', sha: '1be75eb3e56ab16d4b433146ec59538ad651c874' },
  itemset6: { path: 'gmsv/data/itemset6.txt', sha: 'eac985796b59286c547db2abce7b3d604a5e6226' }
};

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}
function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function gitBlobSha(content) {
  const body = Buffer.from(content, 'utf8');
  return crypto.createHash('sha1')
    .update(Buffer.from(`blob ${body.length}\0`, 'utf8'))
    .update(body)
    .digest('hex');
}
function verifySource(root, spec, label) {
  const file = path.join(root, spec.path);
  const content = readText(file);
  const actual = gitBlobSha(content);
  if (actual !== spec.sha) {
    throw new Error(`${label} fixed-source blob SHA mismatch: expected ${spec.sha}, got ${actual}`);
  }
  return { path: spec.path, blobSha: actual, byteLength: Buffer.byteLength(content, 'utf8'), content };
}
function parseEncount(text) {
  return text.split(/\r?\n/)
    .map((raw, idx) => ({ line: idx + 1, raw, parts: raw.split(',') }))
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
      groupIds: r.parts.slice(10, 20).map(v => v === '' ? null : Number(v)).filter(v => v !== null && Number.isFinite(v)),
      groupProbs: r.parts.slice(20, 30).map(v => v === '' ? null : Number(v)),
      eventNow: Number(r.parts[30] || -1),
      eventEnd: Number(r.parts[31] || -1),
      enemyGroup: Number(r.parts[32] || -1)
    }));
}
function parseGroups(text) {
  const map = new Map();
  for (const raw of text.split(/\r?\n/)) {
    if (!raw) continue;
    const p = raw.split(',');
    if (p.length < 4) continue;
    const id = Number(p[1]);
    if (!Number.isFinite(id)) continue;
    const ints = p.slice(1).map(v => v === '' ? null : Number(v));
    map.set(id, {
      name: p[0],
      groupId: id,
      appearByItemId: ints[1],
      notAppearByItemId: ints[2],
      enemyIds: ints.slice(3, 13).filter(v => v !== null && Number.isFinite(v)),
      createProbs: ints.slice(13, 23).filter(v => v !== null && Number.isFinite(v))
    });
  }
  return map;
}
function parseItemIds(text) {
  const ids = new Set();
  const lines = text.split(/\r?\n/).filter(Boolean);
  for (const raw of lines) {
    const p = raw.split(',');
    if (p.length >= 17) {
      const id = Number(p[16]);
      if (Number.isFinite(id)) ids.add(id);
    }
  }
  return { ids, rowCount: lines.length };
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
function groupCondition(group, itemIds) {
  if (!group) return { status: 'unresolved_group', group: null };
  const hasItemGate = group.appearByItemId !== null && group.appearByItemId !== -1;
  const hasNotItemGate = group.notAppearByItemId !== null && group.notAppearByItemId !== -1;
  const missingItemGateIds = [group.appearByItemId, group.notAppearByItemId]
    .filter(v => v !== null && v !== -1 && !itemIds.has(v));
  if (missingItemGateIds.length > 0) {
    return {
      status: 'conditional_unresolved_item_source',
      hasItemGate,
      hasNotItemGate,
      gateItemIds: missingItemGateIds
    };
  }
  if (hasItemGate || hasNotItemGate) {
    return {
      status: 'conditional_item',
      hasItemGate,
      hasNotItemGate,
      gateItemIds: [group.appearByItemId, group.notAppearByItemId].filter(v => v !== null && v !== -1)
    };
  }
  return { status: 'unconditional', hasItemGate: false, hasNotItemGate: false, gateItemIds: [] };
}
function classifyRow(row, groups, itemIds) {
  if (row.probMax <= 0 || row.groupIds.length === 0) return 'placeholder';
  const conditions = row.groupIds.map(id => {
    const group = groups.get(id);
    return { groupId: id, ...(groupCondition(group, itemIds)), ...(group ? {
      enemyIds: group.enemyIds,
      name: group.name
    } : {})
    };
  });
  if (row.eventNow > 0 || row.eventEnd > 0) return 'event_conditional';
  if (conditions.some(v => v.status === 'unresolved_group')) return 'unresolved_group';
  if (conditions.some(v => v.status === 'unconditional')) {
    return conditions.some(v => v.status !== 'unconditional') ? 'mixed' : 'unconditional';
  }
  return 'conditional_unresolved_item_source';
}

const route = readJson('data/generated/stoneage_start_route_candidates.json');
const sourceCatalog = readJson('data/generated/stoneage_map_source_catalog.json');
const runtimeIndex = readJson('data/generated/stoneage_map_runtime_index.json');
const mapset = readJson('data/generated/stoneage_mapset_runtime.json');
const graph = readJson('data/generated/stoneage_world_graph_index.json');

const encountSource = verifySource(sourceRoot, SOURCES.encount, 'encount');
const groupSource = verifySource(sourceRoot, SOURCES.group, 'group1');
const itemSource = verifySource(sourceRoot, SOURCES.itemset6, 'itemset6');
const encountRows = parseEncount(encountSource.content);
const groups = parseGroups(groupSource.content);
const itemCatalog = parseItemIds(itemSource.content);

const rowClassByIndex = new Map();
const rowsByFloor = new Map();
for (const row of encountRows) {
  row.sourceClassification = classifyRow(row, groups, itemCatalog.ids);
  rowClassByIndex.set(row.index, row.sourceClassification);
  const list = rowsByFloor.get(row.floor) || [];
  list.push(row);
  rowsByFloor.set(row.floor, list);
}

const mapCatalogByFloor = new Map();
for (const m of sourceCatalog.maps || []) {
  const floor = Number(m.basename);
  if (Number.isFinite(floor)) mapCatalogByFloor.set(floor, m);
}

const adjacency = new Map();
for (const edge of graph.directedFloorEdges || []) {
  const a = Number(edge.fromFloor), b = Number(edge.toFloor);
  const list = adjacency.get(a) || [];
  list.push(b);
  adjacency.set(a, list);
}
const dedupAdjacency = new Map([...adjacency.entries()].map(([k,v]) => [k,[...new Set(v)]]));
const genericFloorCache = new Map();
function floorSummary(floor) {
  const rows = rowsByFloor.get(floor) || [];
  return {
    floor,
    totalRowCount: rows.length,
    placeholderRowCount: rows.filter(r => r.sourceClassification === 'placeholder').length,
    unconditionalRowCount: rows.filter(r => ['unconditional','mixed'].includes(r.sourceClassification)).length,
    conditionalRowCount: rows.filter(r => ['conditional_unresolved_item_source','conditional_item','event_conditional'].includes(r.sourceClassification)).length,
    rows: rows.map(r => ({
      index: r.index, line: r.line, rect: normalizeRect(r),
      probMin: r.probMin, probMax: r.probMax, enemyMax: r.enemyMax, zorder: r.zorder,
      classification: r.sourceClassification,
      groupIds: r.groupIds
    }))
  };
}
const genericFloors = new Set(encountRows.filter(r => ['unconditional','mixed'].includes(r.sourceClassification)).map(r => r.floor));
function nearestGeneric(start) {
  if (genericFloorCache.has(start)) return genericFloorCache.get(start);
  const q = [[start, [start]]];
  const seen = new Set([start]);
  while (q.length) {
    const [floor, floorPath] = q.shift();
    if (floor !== start && genericFloors.has(floor)) {
      const result = {
        floor,
        path: floorPath,
        depth: floorPath.length - 1,
        encounter: floorSummary(floor)
      };
      genericFloorCache.set(start, result);
      return result;
    }
    for (const next of dedupAdjacency.get(floor) || []) {
      if (!seen.has(next)) {
        seen.add(next);
        q.push([next, [...floorPath, next]]);
      }
    }
  }
  genericFloorCache.set(start, null);
  return null;
}

const towns = (route.routes || []).map(entry => {
  const destinationFloor = Number(entry.directWarpExits?.[0]?.toFloor);
  const landings = entry.directWarpExits.map(exit => ({ x: Number(exit.toX), y: Number(exit.toY) }));
  const sourceMap = mapCatalogByFloor.get(destinationFloor) || null;
  const runtime = runtimeIndex.maps?.[String(destinationFloor)] || null;
  let map = null;
  if (runtime?.path) {
    const file = runtime.path.startsWith('./') ? runtime.path.slice(2) : runtime.path;
    if (fs.existsSync(file)) map = readJson(file);
  }
  const exactBlobMatch = !!sourceMap && !!runtime && sourceMap.verifiedRuntime === true && runtime.sourceBlobSha === sourceMap.blobSha;
  const allRows = rowsByFloor.get(destinationFloor) || [];
  const classifications = allRows.map(row => row.sourceClassification);
  const landingAudit = landings.map(p => {
    const walk = map ? walkableAt(map, mapset, p.x, p.y) : null;
    const encounterRegions = allRows
      .filter(row => row.probMax > 0 && row.groupIds.length > 0)
      .map(row => {
        const rect = normalizeRect(row);
        return {
          index: row.index,
          line: row.line,
          rect,
          containsLanding: inRect(p.x, p.y, rect),
          classification: row.sourceClassification,
          probMin: row.probMin,
          probMax: row.probMax,
          enemyMax: row.enemyMax,
          groupIds: row.groupIds
        };
      });
    return { ...p, walkability: walk, encounterRegions };
  });
  const directEncounter = {
    allRowCount: allRows.length,
    placeholderRowCount: classifications.filter(v => v === 'placeholder').length,
    unconditionalRowCount: classifications.filter(v => ['unconditional','mixed'].includes(v)).length,
    conditionalRowCount: classifications.filter(v => ['conditional_unresolved_item_source','conditional_item','event_conditional'].includes(v)).length,
    classifications,
    rows: allRows.map(row => ({
      index: row.index, line: row.line, rect: normalizeRect(row),
      probMin: row.probMin, probMax: row.probMax, enemyMax: row.enemyMax,
      zorder: row.zorder, classification: row.sourceClassification,
      groups: row.groupIds.map(groupId => {
        const group = groups.get(groupId);
        return group ? {
          groupId,
          name: group.name,
          appearByItemId: group.appearByItemId,
          notAppearByItemId: group.notAppearByItemId,
          condition: groupCondition(group, itemCatalog.ids),
          enemyIds: group.enemyIds,
          createProbs: group.createProbs
        } : { groupId, condition: { status:'unresolved_group' } };
      })
    }))
  };
  let status = 'none';
  if (directEncounter.unconditionalRowCount > 0) status = 'unconditional_active';
  else if (directEncounter.conditionalRowCount > 0) status = 'conditional_unresolved_or_gated';
  else if (directEncounter.placeholderRowCount > 0) status = 'placeholder_only';

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
      exactBlobMatch,
      status: exactBlobMatch ? 'verified' : 'unresolved'
    },
    encounterEvidence: directEncounter,
    landingAudit,
    nearestUnconditionalEncounter: nearestGeneric(destinationFloor)
  };
});

const statistics = {
  hometowns: towns.length,
  destinationFloors: towns.length,
  exactSourceMaps: towns.filter(t => t.sourceMap.status === 'verified').length,
  landingPoints: towns.reduce((n,t) => n + t.landingAudit.length, 0),
  walkabilityVerifiedPoints: towns.reduce((n,t) => n + t.landingAudit.filter(p => p.walkability?.walkable === true).length, 0),
  unconditionalDestinationFloors: towns.filter(t => t.encounterEvidence.unconditionalRowCount > 0).length,
  conditionalDestinationFloors: towns.filter(t => t.encounterEvidence.conditionalRowCount > 0).length,
  placeholderOnlyDestinationFloors: towns.filter(t => t.encounterEvidence.placeholderRowCount > 0 && t.encounterEvidence.unconditionalRowCount === 0 && t.encounterEvidence.conditionalRowCount === 0).length,
  unresolvedDestinationMaps: towns.filter(t => t.sourceMap.status !== 'verified').length,
  itemset6Rows: itemCatalog.rowCount,
  itemGateIdsUnresolved: [...new Set(towns.flatMap(t => t.encounterEvidence.rows.flatMap(r => r.groups || []).flatMap(g => g.condition?.gateItemIds || [])))].sort((a,b) => a-b)
};

const result = {
  format: 'stoneage-start-destination-closure-v3',
  generatedAt: '2026-09-30',
  fixedSource: { repository: 'gavinlinasd/StoneAge', ref: FIXED_REF },
  sourceContracts: {
    encount: 'gmsv/src/char/encount.c::ENCOUNT_initEncount',
    group: 'gmsv/src/char/enemy.c::GROUP_initGroup',
    enemySelection: 'gmsv/src/char/enemy.c::ENEMY_getEnemy',
    itemset6: 'gmsv/setup.cf::itemset6file + gmsv/src/item/item.c',
    mapRuntime: 'src/stoneage_map_runtime.mjs::sourceMapWalkableAt',
    mapSourceCatalog: 'data/generated/stoneage_map_source_catalog.json',
    worldGraph: 'data/generated/stoneage_world_graph_index.json::directedFloorEdges'
  },
  sourceEvidence: {
    encount: encountSource,
    group1: groupSource,
    itemset6: { path: itemSource.path, blobSha: itemSource.blobSha, byteLength: itemSource.byteLength, rowCount: itemCatalog.rowCount },
    activeEncounterDefinition: 'row probMax > 0 and has group id',
    unconditionalGroupDefinition: 'GROUP_APPEARBYITEMID == -1 and GROUP_NOTAPPEARBYITEMID == -1, with no encounter event gate',
    itemGateStatus: 'conditional groups whose gate item ID is absent from pinned itemset6 remain unresolved_item_source; no assumption is made that the gate is impossible or available'
  },
  statistics,
  towns,
  status: {
    destinationWalkability: statistics.exactSourceMaps === statistics.destinationFloors && statistics.walkabilityVerifiedPoints === statistics.landingPoints ? 'closed' : 'partial',
    directDestinationEncounter: statistics.unconditionalDestinationFloors === statistics.destinationFloors ? 'closed' : 'partial',
    genericEncounterRoute: towns.every(t => t.nearestUnconditionalEncounter) ? 'closed_at_floor_level' : 'partial',
    fullFirstRoute: 'partial'
  },
  policy: 'Do not treat zero-probability/no-group rows as active encounters. Do not treat item-gated groups as unconditional hunting routes. Missing fixed-source maps and item definitions remain unresolved and are never replaced by guessed or cross-version data.'
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ out, statistics }, null, 2));
