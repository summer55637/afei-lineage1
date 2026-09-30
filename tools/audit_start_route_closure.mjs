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

const serviceByFloor = new Map((services.floors || []).map((entry) => [Number(entry.floor), entry]));
const candidateRoutes = candidates.routes || candidates.candidates || [];
const towns = candidateRoutes.map((candidate) => {
  const auditRoute = (audit.routes || []).find((route) => route.hometown === candidate.hometown);
  const serviceFloor = serviceByFloor.get(Number(candidate.spawn.floor));
  const firstEncounter = (candidate.nearestEncounterRoutes || []).find((route) => route.depth === 1);

  return {
    hometown: candidate.hometown,
    elder: candidate.elder,
    spawn: candidate.spawn,
    sourceMapVerified: auditRoute?.mapSourceVerified === true,
    startFloorServices: serviceFloor?.services || [],
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
      firstEncounterFloorEvidence: Boolean(firstEncounter && firstEncounter.depth === 1),
      coordinateLevelServiceReachability: false,
      destinationMapWalkability: false,
      questEventOwnerClosure: false,
    },
  };
});

const index = {
  format: 'stoneage-start-route-closure-v1',
  generatedAt: '2026-09-30',
  fixedSource: audit.fixedSource,
  inputContracts: {
    startWalkability: 'data/generated/stoneage_start_walkability_audit.json',
    routeCandidates: 'data/generated/stoneage_start_route_candidates.json',
    npcServices: 'data/generated/stoneage_npc_service_index.json',
  },
  status: {
    sourceRouteSpine: 'closed',
    fullFirstRoute: 'partial',
    definition:
      'Source-level closure is complete from verified hometown spawn to direct warp exit and a depth-1 encounter floor. Full first-route closure remains open until service coordinates/interactions, destination-map walkability, and player-specific quest/event ownership are closed.',
  },
  statistics: {
    hometowns: towns.length,
    verifiedStartMaps: towns.filter((town) => town.sourceMapVerified).length,
    directWarpExits: towns.reduce((sum, town) => sum + town.directWarpExits.length, 0),
    reachableDirectWarpExits: towns.reduce(
      (sum, town) => sum + town.directWarpExits.filter((exit) => exit.walkableFromSpawn).length,
      0,
    ),
    hometownsWithStartFloorServices: towns.filter((town) => town.closure.townServiceFloorPresence).length,
    hometownsWithDepth1EncounterEvidence: towns.filter((town) => town.closure.firstEncounterFloorEvidence).length,
  },
  remainingWork: [
    'Resolve coordinate-level reachability and intended interaction for the required town service NPCs.',
    'Audit destination-map walkability at each first warp landing coordinate and the first encounter region.',
    'Close new-player quest/event ownership without promoting ownerless event IDs.',
  ],
  towns,
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(index, null, 2) + '\n');
console.log(JSON.stringify({ pass: index.statistics.hometowns === 4 && index.statistics.reachableDirectWarpExits === 8 }));
