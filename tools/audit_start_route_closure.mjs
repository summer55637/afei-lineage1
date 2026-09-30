#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const outArg = args.indexOf('--out');
const out = path.resolve(outArg >= 0 ? args[outArg + 1] : 'data/generated/stoneage_start_route_closure.json');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const audit = readJson('data/generated/stoneage_start_walkability_audit.json');
const candidates = readJson('data/generated/stoneage_start_route_candidates.json');
const services = readJson('data/generated/stoneage_npc_service_index.json');
const npcReachability = readJson('data/generated/stoneage_start_npc_reachability.json');

const serviceByFloor = new Map((services.floors || []).map((entry) => [Number(entry.floor), entry]));
const npcByFloor = new Map();

for (const row of npcReachability.rows || []) {
  const list = npcByFloor.get(Number(row.floor)) || [];
  list.push(row);
  npcByFloor.set(Number(row.floor), list);
}

const candidateRoutes = candidates.routes || candidates.candidates || [];
const towns = candidateRoutes.map((candidate) => {
  const auditRoute = (audit.routes || []).find((route) => route.hometown === candidate.hometown);
  const serviceFloor = serviceByFloor.get(Number(candidate.spawn.floor));
  const firstEncounter = (candidate.nearestEncounterRoutes || []).find((route) => route.depth === 1);
  const npcRows = npcByFloor.get(Number(candidate.spawn.floor)) || [];

  return {
    hometown: candidate.hometown,
    elder: candidate.elder,
    spawn: candidate.spawn,
    sourceMapVerified: auditRoute?.mapSourceVerified === true,
    startFloorServices: serviceFloor?.services || [],
    coordinateResolvedNpcReachability: {
      totalCoordinateResolved: npcRows.length,
      reachableCoordinateResolved: npcRows.filter((row) => row.reachableInteraction).length,
      unreachableCoordinateResolved: npcRows.filter((row) => !row.reachableInteraction).length,
      rows: npcRows.map((row) => ({
        template: row.template,
        npc: row.npc,
        reachableInteraction: row.reachableInteraction,
        minPathToInteraction: row.minPathToInteraction,
        npcPath: row.npcPath,
        blockIndex: row.blockIndex,
      })),
    },
    directWarpExits: (auditRoute?.exitAudits || []).map((exit) => ({
      from: [exit.fromFloor, exit.fromX, exit.fromY],
      to: [exit.toFloor, exit.toX, exit.toY],
      walkableFromSpawn: exit.walkToWarpNpc?.reachable === true,
      pathLength: exit.walkToWarpNpc?.pathLength ?? null,
      source: exit.path,
      blockIndex: exit.blockIndex,
      startLine: exit.startLine,
    })),
    firstEncounterFloorEvidence: firstEncounter
      ? {
          floor: firstEncounter.floor,
          depth: firstEncounter.depth,
          encounterCount: firstEncounter.encounterCount,
          floorPath: firstEncounter.path,
        }
      : null,
    closure: {
      spawnToWarpSourceWalkability:
        auditRoute?.reachableWarpCount === auditRoute?.directWarpCount
        && (auditRoute?.directWarpCount || 0) > 0,
      townServiceFloorPresence: (serviceFloor?.services || []).length > 0,
      coordinateResolvedNpcReachability:
        npcRows.length > 0 && npcRows.every((row) => row.reachableInteraction),
      firstEncounterFloorEvidence: Boolean(firstEncounter && firstEncounter.depth === 1),
      destinationMapWalkability: false,
      questEventOwnerClosure: false,
    },
  };
});

const coordinateResolved = npcReachability.statistics?.coordinateResolvedInstances || 0;
const reachableCoordinateResolved = npcReachability.statistics?.reachableCoordinateResolvedInstances || 0;

const index = {
  format: 'stoneage-start-route-closure-v2',
  generatedAt: '2026-09-30',
  fixedSource: audit.fixedSource,
  inputContracts: {
    startWalkability: 'data/generated/stoneage_start_walkability_audit.json',
    routeCandidates: 'data/generated/stoneage_start_route_candidates.json',
    npcServices: 'data/generated/stoneage_npc_service_index.json',
    npcReachability: 'data/generated/stoneage_start_npc_reachability.json',
  },
  status: {
    sourceRouteSpine: 'closed',
    coordinateResolvedTownServices: reachableCoordinateResolved === coordinateResolved ? 'closed_for_resolved_instances' : 'partial',
    fullFirstRoute: 'partial',
    definition:
      'Source-level closure is complete from verified hometown spawn to direct warp exit and a depth-1 encounter floor. Coordinate-level interaction is closed only for NPC instances with resolved numeric coordinates. Full first-route closure remains open until unresolved NPC coordinates, destination-map walkability, and player-specific quest/event ownership are closed.',
  },
  statistics: {
    hometowns: towns.length,
    verifiedStartMaps: towns.filter((town) => town.sourceMapVerified).length,
    directWarpExits: towns.reduce((sum, town) => sum + town.directWarpExits.length, 0),
    reachableDirectWarpExits: towns.reduce(
      (sum, town) => sum + town.directWarpExits.filter((exit) => exit.walkableFromSpawn).length,
      0,
    ),
    hometownsWithStartFloorServices: towns.filter((town) => town.startFloorServices.length > 0).length,
    hometownsWithDepth1EncounterEvidence: towns.filter((town) => town.closure.firstEncounterFloorEvidence).length,
    coordinateResolvedNpcInstances: coordinateResolved,
    reachableCoordinateResolvedNpcInstances: reachableCoordinateResolved,
    unresolvedNpcCoordinateInstances: npcReachability.statistics?.unresolvedCoordinateInstances || 0,
  },
  remainingWork: [
    'Resolve source coordinates for the remaining start-floor NPC instances without guessing.',
    'Audit destination-map walkability at each first warp landing coordinate and the first encounter region.',
    'Close new-player quest/event ownership without promoting ownerless event IDs.',
  ],
  towns,
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(index, null, 2) + '\\n');
console.log(JSON.stringify({ pass: index.statistics.reachableDirectWarpExits === index.statistics.directWarpExits, statistics: index.statistics }));
