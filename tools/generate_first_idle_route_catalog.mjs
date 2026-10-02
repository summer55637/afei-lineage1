#!/usr/bin/env node
import fs from 'node:fs';

const exit=JSON.parse(fs.readFileSync('data/generated/stoneage_start_world_exit_reachability.json','utf8'));
const encounter=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_path_closure.json','utf8'));
const fixed={repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56'};

const byFloor=Object.fromEntries(Object.entries(encounter.floors||{}));
const wanted=[
  {hometown:0,name:'samugiru',entryFloor:1000,encounterFloor:100,portalIds:['1000_to_100_a','1000_to_100_b']},
  {hometown:1,name:'marinasu',entryFloor:2000,encounterFloor:100,portalIds:['2000_to_100_a','2000_to_100_b']},
  {hometown:2,name:'jaja',entryFloor:3000,encounterFloor:200,portalIds:['3000_to_200_a','3000_to_200_b']},
  {hometown:3,name:'karutarna',entryFloor:4000,encounterFloor:200,portalIds:['4000_to_200_a','4000_to_200_b']}
];

function findExit(id) {
  const floor=Number(id.split('_to_')[0]);
  return (exit.audits||[]).find(a=>Number(a.destinationFloor)===floor)?.portalAudits?.find(p=>p.id===id) || null;
}
function findEncounter(id,floor) {
  return (byFloor[String(floor)]?.portalGroups||[]).find(p=>p.id===id) || null;
}

const routes=wanted.map(spec=>{
  const variants=spec.portalIds.map(id=>{
    const e=findExit(id);
    const p=findEncounter(id,spec.encounterFloor);
    const sourceReach=e?.portalUsableFromDirectLanding===true;
    const encounterReach=p?.atLeastOneLandingReachesUnconditional===true;
    return {portalId:id,sourceReach,encounterReach,status:sourceReach&&encounterReach?'usable':'blocked_or_unresolved',originPathMin:e?.origins?.length?Math.min(...e.origins.flatMap(o=>o.fromLanding.map(x=>x.pathLength).filter(Number.isFinite))):null,minPathLength:p?.minPathLength??null,unusableLandingPoints:(p?.landings||[]).filter(x=>!x.walkable).map(x=>x.point)};
  });
  const eligible=variants.filter(v=>v.status==='usable');
  return {hometown:spec.hometown,name:spec.name,entryFloor:spec.entryFloor,encounterFloor:spec.encounterFloor,status:eligible.length?'path_closed_battle_policy_pending':'source_blocked_before_portal',variants};
});

const result={format:'stoneage-first-idle-route-catalog-v1',generatedAt:'2026-09-30',fixedSource:fixed,inputs:{worldExit:'data/generated/stoneage_start_world_exit_reachability.json',encounterPath:'data/generated/stoneage_start_encounter_path_closure.json'},policy:{eligibleRoute:'source portal path plus unconditional encounter path',productBoundary:'basic attack strategy v1 is available; complete battle-result execution and supply/capture/death/offline/rotation policies remain separate boundaries',battleStrategy:{version:1,mode:'basic_attack_only',targetPolicy:'source-default-random'}},routes,summary:{towns:routes.length,pathClosedTowns:routes.filter(r=>r.variants.some(v=>v.status==='usable')).length,sourceBlockedTowns:routes.filter(r=>r.status==='source_blocked_before_portal').length,eligibleRouteVariants:routes.reduce((n,r)=>n+r.variants.filter(v=>v.status==='usable').length,0),basicBattleStrategyAvailable:true,battlePolicyPendingAll:true}};
fs.writeFileSync('data/generated/stoneage_first_idle_route_catalog.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result.summary,null,2));
