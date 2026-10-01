#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const README = path.join(ROOT, 'README.md');
const START = '<!-- AUTO-README:START -->';
const END = '<!-- AUTO-README:END -->';

function loadJson(rel) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error('Cannot parse ' + rel + ': ' + error.message);
  }
}

function readText(rel) {
  const file = path.join(ROOT, rel);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function comma(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function latestWorkflowVersion() {
  const dir = path.join(ROOT, '.github', 'workflows');
  if (!fs.existsSync(dir)) return null;
  const versions = fs.readdirSync(dir)
    .map(name => name.match(/^check-v(\d+)-.*\.yml$/)?.[1])
    .filter(Boolean)
    .map(Number);
  return versions.length ? Math.max(...versions) : null;
}

function latestCommit() {
  try {
    const parts = execSync('git log -1 --format=%h%n%s%n%cI', { encoding: 'utf8' }).trimEnd().split('\n');
    return { sha: parts[0], subject: parts[1], iso: parts[2] };
  } catch {
    return { sha: 'unknown', subject: 'unknown', iso: 'unknown' };
  }
}

const route = loadJson('data/generated/stoneage_start_route_closure.json') ?? {};
const maps = loadJson('data/generated/stoneage_map_runtime_index.json') ?? { maps: {} };
const graph = loadJson('data/generated/stoneage_world_graph_index.json') ?? {};
const npcService = loadJson('data/generated/stoneage_npc_service_index.json') ?? {};
const state = loadJson('data/generated/stoneage_persistent_state_schema.json') ?? {};
const economy = loadJson('data/generated/stoneage_item_economy_runtime_schema.json') ?? {};
const seed = loadJson('data/generated/stoneage_new_player_seed_runtime.json') ?? {};
const idle = loadJson('data/generated/stoneage_first_idle_route_catalog.json') ?? {};
const disabled = loadJson('data/generated/stoneage_disabled_features.json') ?? {};
const reopenedFeatures = loadJson('data/generated/stoneage_reopened_features.json') ?? {};
const blockerRegistry = loadJson('data/generated/stoneage_blocker_registry.json') ?? {};
const starterItemAudit = loadJson('data/generated/stoneage_starter_item_24114_source_audit.json') ?? {};
const starterItemBuildAudit = loadJson('data/generated/stoneage_starter_item_24114_build_closure_audit.json') ?? {};
const endpointCatalog = loadJson('data/generated/stoneage_endpoint_source_catalog.json') ?? {};
const endpointItemSeedAudit = loadJson('data/generated/stoneage_endpoint_item_seed_audit.json') ?? {};
const endpointMapwarpAudit = loadJson('data/generated/stoneage_endpoint_mapwarp_audit.json') ?? {};
const endpointBattleAudit = loadJson('data/generated/stoneage_endpoint_battle_data_source_audit.json') ?? {};
const endpointGmqueLocator = loadJson('data/generated/stoneage_endpoint_gmque_source_locator.json') ?? {};
const endpointNpcAudit = loadJson('data/generated/stoneage_endpoint_npc_source_audit.json') ?? {};
const endpointCompletenessAudit = loadJson('data/generated/stoneage_endpoint_completeness_audit.json') ?? {};
const endpointSetupAudit = loadJson('data/generated/stoneage_endpoint_setup_config_audit.json') ?? {};
const creationSaveRuntimePresent = fs.existsSync(path.join(ROOT, 'src', 'stoneage_new_player_creation_save_runtime.mjs'));
const itemShopDocs = readText('docs/reference/npc-itemshop-runtime.md');
const browserDocs = readText('docs/reference/v340-browser-itemshop-runtime.md');
const commit = latestCommit();

const starterPetRanksResolved = Array.isArray(seed.starterPet?.entries)
  && seed.starterPet.entries.length === 4
  && seed.starterPet.entries.every(entry => Number.isInteger(entry.sourceRank) && Number.isInteger(entry.sourceRankParamsum));
const starterPetRankSummary = starterPetRanksResolved
  ? 'source rank closed；4 hometown templates base stat sum = 79；rank = 5'
  : 'source rank pending';

const itemShopMatch = itemShopDocs.match(/完整\s+(\d+)\s+個 ItemShop binding/);
const itemShopBindings = itemShopMatch ? Number(itemShopMatch[1]) : null;
const rootHtml = fs.readdirSync(ROOT).filter(name => name.endsWith('.html')).sort();
const oldHtml = ['game.html', 'game-live.html', 'play.html', 'start.html'];
const oldPresent = oldHtml.filter(name => fs.existsSync(path.join(ROOT, name)));
const routeStats = route.statistics ?? {};
const routeStatus = route.status ?? {};
const idleSummary = idle.summary ?? {};

const disabledNames = Object.entries(disabled.features ?? {})
  .filter(([, value]) => value?.disabled === true || value?.playable === false)
  .map(([name]) => name);
const reopenedFeatureNames = Object.entries(reopenedFeatures.features ?? {})
  .filter(([, value]) => value?.status)
  .map(([name, value]) => ({ name, status: value.status }));
const blockerEntries = Object.entries(blockerRegistry.blockers ?? {});

const auto = [
  START,
  '## 📌 自動維護狀態',
  '',
  '> 本區由 tools/generate_readme.mjs 產生。main 分支每次非 README push 都會由 GitHub Actions 自動刷新。',
  '',
  '- 最新 commit：' + commit.sha + ' — ' + commit.subject,
  '- 最後更新時間：' + commit.iso,
  '- 版本線最高 regression workflow：' + (() => { const v = latestWorkflowVersion(); return v == null ? '—' : (String(v).length === 3 ? 'V' + String(v)[0] + '.' + String(v).slice(1) : 'V' + v); })(),
  '- Playable HTML entry：目前刻意為 0 個；待資料與 runtime contract 成熟後才重新建立唯一入口',
  '- 舊入口殘留：' + (oldPresent.length === 0 ? '已清除' : oldPresent.join(', ')),
  '- 固定 source：' + (route.fixedSource?.repository ?? 'unknown') + '@' + (route.fixedSource?.ref ?? 'unknown'),
  '',
  '### 來源權威',
  '',
  '- 實機／部署資料主來源：VM 一鍵端＋手工外網端（目前最完整、最接近可直接架設版本的部署資料集合）',
  '- 引擎語義校驗基準：pinned fixed-C；endpoint 與 fixed-C 不一致時先辨識 variant，不自動丟棄 endpoint data',
  '- Source pipeline：Endpoint Provenance → Exact Identity → Endpoint Completeness → Fixed-C Semantic Check → Evidence / Regression → Canonical Runtime',
  '',
  '### Endpoint Corpus',
  '',
  '- 手工外網端：' + comma(endpointCatalog.sourceCorpus?.byProvenance?.manualExternalWeb?.fileCount) + ' files；' + comma(endpointCatalog.sourceCorpus?.byProvenance?.manualExternalWeb?.totalBytes) + ' bytes',
  '- VM 一鍵端：' + comma(endpointCatalog.sourceCorpus?.byProvenance?.vmOneClick?.fileCount) + ' files；' + comma(endpointCatalog.sourceCorpus?.byProvenance?.vmOneClick?.totalBytes) + ' bytes',
  '- Corpus 合計：' + comma(endpointCatalog.sourceCorpus?.fileCount) + ' files；' + comma(endpointCatalog.sourceCorpus?.totalBytes) + ' bytes',
  '- Endpoint snapshot completeness：' + (endpointCompletenessAudit.status?.snapshotStructure ?? 'unknown') + '；key artifacts ' + (endpointCompletenessAudit.status?.keyArtifactCoverage ?? '—'),
  '- Exact manual rule：只有 `docs/搭建教程.txt` 與 `server/merged-source/wwwroot/`；`server/merged-source/www/wwwroot/` 維持 VM 一鍵端',
  '- Endpoint Item seed：' + (endpointItemSeedAudit.status === 'unresolved' ? '⚠️ unresolved' : '⚠️ candidate') + '；setup `ITEM1=' + (endpointItemSeedAudit.endpointConfig?.item1 ?? '—') + '`；selected `itemset6.csv` exact token presence=' + (endpointItemSeedAudit.keyFindings?.configuredItem1PresentAsExactToken ? 'yes' : 'no'),
  '- Endpoint MapWarp：' + comma(endpointMapwarpAudit.source?.endpointRows) + ' rows；' + comma(endpointMapwarpAudit.exactSetComparison?.endpointOnly) + ' endpoint-only；' + comma(endpointMapwarpAudit.exactSetComparison?.fixedOnly) + ' fixed-C-only',
  '- Endpoint Battle data：encount ' + comma(endpointBattleAudit.files?.encount?.comparison?.endpointRows) + '；group1 ' + comma(endpointBattleAudit.files?.group?.comparison?.endpointRows) + '；enemy1 ' + comma(endpointBattleAudit.files?.enemy?.comparison?.endpointRows) + '；enemybase1 ' + comma(endpointBattleAudit.files?.enemybase?.comparison?.endpointRows) + '；Encounter→Group unresolved active IDs=' + comma(endpointBattleAudit.endpointInternalReferences?.unresolvedActiveEncounterGroups?.length),
  '- Endpoint GMQUE locator：' + (endpointGmqueLocator.status ?? 'unknown') + '；NPC files scanned=' + comma(endpointGmqueLocator.statistics?.filesScanned) + '；candidate files=' + comma(endpointGmqueLocator.statistics?.candidateFiles),
  '- Endpoint NPC：' + comma(endpointNpcAudit.endpoint?.files) + ' files；' + comma(endpointNpcAudit.comparison?.changedBlob) + ' changed blobs；出生城 variants 100=' + comma(endpointNpcAudit.hometownFloors?.find(x => x.floor === "100")?.changedBlob) + ' / 200=' + comma(endpointNpcAudit.hometownFloors?.find(x => x.floor === "200")?.changedBlob) + ' / 300=' + comma(endpointNpcAudit.hometownFloors?.find(x => x.floor === "300")?.changedBlob) + ' / 400=' + comma(endpointNpcAudit.hometownFloors?.find(x => x.floor === "400")?.changedBlob),
  '- Endpoint Setup：' + comma(endpointSetupAudit.summary?.changedCount) + ' selected-key variants；battleexp=' + (endpointSetupAudit.selectedKeys?.find(x => x.key === "battleexp")?.endpoint ?? '—') + '；TRANS=' + (endpointSetupAudit.selectedKeys?.find(x => x.key === "TRANS")?.endpoint ?? '—') + '；NPRIDE=' + (endpointSetupAudit.selectedKeys?.find(x => x.key === "NPRIDE")?.endpoint ?? '—') + '；GOLD=' + (endpointSetupAudit.selectedKeys?.find(x => x.key === "GOLD")?.endpoint ?? '—'),
  '',
  '### 核心 closure',
  '',
  '| 區域 | 現況 | 摘要 |',
  '|---|---|---|',
  '| First-route spine | ' + (routeStatus.sourceRouteSpine === 'closed' ? '✅ closed' : '⚠️ partial') + ' | ' + (routeStats.verifiedStartMaps ?? 0) + '/4 hometown maps；' + (routeStats.reachableDirectWarpExits ?? 0) + '/' + (routeStats.directWarpExits ?? 0) + ' direct warp exits |',
  '| Full first-route | ' + (routeStatus.fullFirstRoute === 'closed' ? '✅ closed' : '⚠️ partial') + ' | ' + (routeStats.worldExitPortalGroupsUsable ?? 0) + '/' + (routeStats.worldExitPortalGroups ?? 0) + ' portal groups usable |',
  '| Verified map runtime | ' + (Object.keys(maps.maps ?? {}).length ? '✅ active' : '⚠️ missing') + ' | ' + comma(Object.keys(maps.maps ?? {}).length) + ' maps；floor identity 以 LS2MAP header 為準 |',
  '| World graph | ' + (graph.statistics ? '✅ indexed' : '⚠️ missing') + ' | ' + comma(graph.statistics?.floorNodes) + ' floor nodes；' + comma(graph.statistics?.directedFloorEdges) + ' directed edges |',
  '| NPC service index | ' + (npcService.statistics ? '✅ indexed' : '⚠️ missing') + ' | ' + comma(npcService.statistics?.totalServiceInstances) + ' service instances；' + comma(npcService.statistics?.uniqueServiceFloors) + ' floors |',
  '| Persistent State | ' + (state.currentSchemaVersion ? '✅ schema ' + state.currentSchemaVersion : '⚠️ missing') + ' | legacy ' + (state.legacySaveSchemaVersion ?? '—') + '；skills ' + (state.fixedSlotContracts?.professionSkillSlots ?? '—') + '；player items ' + (state.fixedSlotContracts?.playerItemSlots ?? '—') + ' |',
  '| Item / Economy | ' + (economy.format ? '✅ runtime v1' : '⚠️ missing') + ' | Gold cap ' + (economy.gold?.maxFormula ?? '—') + '；backpack ' + (economy.structure?.backpackStart ?? '—') + ' to ' + ((economy.structure?.backpackEndExclusive ?? 1) - 1) + ' |',
  '| New-player seed (fixed-C) | ' + (seed.format ? '✅ source-closed' : '⚠️ missing') + ' | trans ' + (seed.sourceConfig?.transmigration ?? '—') + '；lv ' + (seed.sourceConfig?.level ?? '—') + '；pet lv ' + (seed.sourceConfig?.petLevel ?? '—') + '；gold ' + (seed.sourceConfig?.gold ?? '—') + '；item1 ' + (seed.sourceConfig?.itemSlots?.ITEM1 ?? '—') + ' |',
  '| Player creation | ' + (state.sections?.includes('creation') ? '✅ state contract' : '⚠️ missing') + ' | hometown + stats + elements + starter grant status；still headless，no playable HTML |',
  '| Starter Pet grant | ' + (seed.starterPet?.sourceClosed ? '✅ runtime' : '⚠️ pending') + ' | 16 RNG calls；VariableAI 0；HP after compliance；' + starterPetRankSummary + '；team/activePet unchanged |',
  '| Starter Item 24114 (fixed-C) | ' + (starterItemBuildAudit.resolution?.status === 'fail-closed' ? '⚠️ fail-closed' : '✅ source-closed') + ' | source max ID ' + (starterItemBuildAudit.itemSource?.maxSourceItemId ?? '—') + ' → ITEM_tblen ' + (starterItemBuildAudit.itemSource?.derivedItemTableLength ?? '—') + '；configured 24114 越界；actual row id ' + (starterItemBuildAudit.exactRow?.sourceItemId ?? '—') + ' / imagenumber ' + (starterItemBuildAudit.exactRow?.imageNumber ?? '—') + ' |',
  '| New-player creation → Save | ' + (creationSaveRuntimePresent ? '✅ headless pipeline' : '⚠️ missing') + ' | creation → hometown position → Starter Pet → Item adapter boundary → Save Envelope → reload verification；`completed` only after Item adapter succeeds |',
  '| Idle route catalog | ' + (idleSummary.towns ? '✅ indexed' : '⚠️ missing') + ' | ' + (idleSummary.pathClosedTowns ?? 0) + ' path-closed towns；' + (idleSummary.eligibleRouteVariants ?? 0) + '/' + (idleSummary.routeVariants ?? 0) + ' eligible variants |',
  '| Battle Pipeline | ' + (() => { const v = latestWorkflowVersion(); return v != null && v >= 406 ? '✅ V4.' + String(v).slice(-2) : (v == null ? '⚠️ pending' : '⚠️ V4.' + String(v).slice(-2)); })() + ' | ' + (() => { const v = latestWorkflowVersion(); if (v != null && v >= 425) return 'V4.01 AttackSeq Prelude → V4.02 Damage Plan → V4.03 Critical/Guard → V4.04 DamageReact → V4.05 Counter → V4.06 Death Plan → V4.07 Death Commit → V4.08 Battle End Plan → V4.09 Finish Commit → V4.10 Profit Route Plan → V4.11 DuelPoint Plan → V4.12 DuelPoint Commit → V4.13 Battle EXP Plan → V4.14 Battle Level-Up Plan → V4.15 Pet Growth Plan → V4.16 Level-Up Commit → V4.17 Battle Item Plan → V4.18 Battle Item Commit → V4.19 Battle Compliance Plan → V4.20 Battle Compliance Commit → V4.22 Battle Player Exit Plan → V4.22 Battle Player Exit Commit → V4.21 Battle Exit Plan → V4.23 Exit Transient Cleanup → V4.24 Settlement Receipt Barrier → V4.25 Receipt-Bound Exit Gate';
    if (v != null && v >= 424) return 'V4.01 AttackSeq Prelude → V4.02 Damage Plan → V4.03 Critical/Guard → V4.04 DamageReact → V4.05 Counter → V4.06 Death Plan → V4.07 Death Commit → V4.08 Battle End Plan → V4.09 Finish Commit → V4.10 Profit Route Plan → V4.11 DuelPoint Plan → V4.12 DuelPoint Commit → V4.13 Battle EXP Plan → V4.14 Battle Level-Up Plan → V4.15 Pet Growth Plan → V4.16 Level-Up Commit → V4.17 Battle Item Plan → V4.18 Battle Item Commit → V4.19 Battle Compliance Plan → V4.20 Battle Compliance Commit → V4.22 Battle Player Exit Plan → V4.22 Battle Player Exit Commit → V4.21 Battle Exit Plan → V4.23 Exit Transient Cleanup → V4.24 Settlement Receipt Barrier → V4.21 Battle Exit Commit';
    if (v != null && v >= 421) return 'V4.01 AttackSeq Prelude → V4.02 Damage Plan → V4.03 Critical/Guard → V4.04 DamageReact → V4.05 Counter → V4.06 Death Plan → V4.07 Death Commit → V4.08 Battle End Plan → V4.09 Finish Commit → V4.10 Profit Route Plan → V4.11 DuelPoint Plan → V4.12 DuelPoint Commit → V4.13 Battle EXP Plan → V4.14 Battle Level-Up Plan → V4.15 Pet Growth Plan → V4.16 Level-Up Commit → V4.17 Battle Item Plan → V4.18 Battle Item Commit → V4.19 Battle Compliance Plan → V4.20 Battle Compliance Commit → V4.22 Battle Player Exit Plan → V4.22 Battle Player Exit Commit → V4.21 Battle Exit Plan → V4.21 Battle Exit Commit';
    if (v != null && v >= 420) return 'V4.01 AttackSeq Prelude → V4.02 Damage Plan → V4.03 Critical/Guard → V4.04 DamageReact → V4.05 Counter → V4.06 Death Plan → V4.07 Death Commit → V4.08 Battle End Plan → V4.09 Finish Commit → V4.10 Profit Route Plan → V4.11 DuelPoint Plan → V4.12 DuelPoint Commit → V4.13 Battle EXP Plan → V4.14 Battle Level-Up Plan → V4.15 Pet Growth Plan → V4.16 Level-Up Commit → V4.17 Battle Item Plan → V4.18 Battle Item Commit → V4.19 Battle Compliance Plan → V4.20 Battle Compliance Commit';
    if (v != null && v >= 419) return 'V4.01 AttackSeq Prelude → V4.02 Damage Plan → V4.03 Critical/Guard → V4.04 DamageReact → V4.05 Counter → V4.06 Death Plan → V4.07 Death Commit → V4.08 Battle End Plan → V4.09 Finish Commit → V4.10 Profit Route Plan → V4.11 DuelPoint Plan → V4.12 DuelPoint Commit → V4.13 Battle EXP Plan → V4.14 Battle Level-Up Plan → V4.15 Pet Growth Plan → V4.16 Level-Up Commit → V4.17 Battle Item Plan → V4.18 Battle Item Commit → V4.19 Battle Compliance Plan';
    if (v != null && v >= 418) return 'V4.01 AttackSeq Prelude → V4.02 Damage Plan → V4.03 Critical/Guard → V4.04 DamageReact → V4.05 Counter → V4.06 Death Plan → V4.07 Death Commit → V4.08 Battle End Plan → V4.09 Finish Commit → V4.10 Profit Route Plan → V4.11 DuelPoint Plan → V4.12 DuelPoint Commit → V4.13 Battle EXP Plan → V4.14 Battle Level-Up Plan → V4.15 Pet Growth Plan → V4.16 Level-Up Commit → V4.17 Battle Item Plan → V4.18 Battle Item Commit';
    if (v != null && v >= 417) return 'V4.01 AttackSeq Prelude → V4.02 Damage Plan → V4.03 Critical/Guard → V4.04 DamageReact → V4.05 Counter → V4.06 Death Plan → V4.07 Death Commit → V4.08 Battle End Plan → V4.09 Finish Commit → V4.10 Profit Route Plan → V4.11 DuelPoint Plan → V4.12 DuelPoint Commit → V4.13 Battle EXP Plan → V4.14 Battle Level-Up Plan → V4.15 Pet Growth Plan → V4.16 Level-Up Commit → V4.17 Battle Item Plan';
    if (v != null && v >= 416) return 'V4.01 AttackSeq Prelude → V4.02 Damage Plan → V4.03 Critical/Guard → V4.04 DamageReact → V4.05 Counter → V4.06 Death Plan → V4.07 Death Commit → V4.08 Battle End Plan → V4.09 Finish Commit → V4.10 Profit Route Plan → V4.11 DuelPoint Plan → V4.12 DuelPoint Commit → V4.13 Battle EXP Plan → V4.14 Battle Level-Up Plan → V4.15 Pet Growth Plan → V4.16 Level-Up Commit';
    if (v != null && v >= 415) return 'V4.01 AttackSeq Prelude → V4.02 Damage Plan → V4.03 Critical/Guard → V4.04 DamageReact → V4.05 Counter → V4.06 Death Plan → V4.07 Death Commit → V4.08 Battle End Plan → V4.09 Finish Commit → V4.10 Profit Route Plan → V4.11 DuelPoint Plan → V4.12 DuelPoint Commit → V4.13 Battle EXP Plan → V4.14 Battle Level-Up Plan → V4.15 Pet Growth Plan';
    if (v != null && v >= 414) return 'V4.01 AttackSeq Prelude → V4.02 Damage Plan → V4.03 Critical/Guard → V4.04 DamageReact → V4.05 Counter → V4.06 Death Plan → V4.07 Death Commit → V4.08 Battle End Plan → V4.09 Finish Commit → V4.10 Profit Route Plan → V4.11 DuelPoint Plan → V4.12 DuelPoint Commit → V4.13 Battle EXP Plan → V4.14 Battle Level-Up Plan';
    if (v != null && v >= 413) return 'V4.01 AttackSeq Prelude → V4.02 Damage Plan → V4.03 Critical/Guard → V4.04 DamageReact → V4.05 Counter → V4.06 Death Plan → V4.07 Death Commit → V4.08 Battle End Plan → V4.09 Finish Commit → V4.10 Profit Route Plan → V4.11 DuelPoint Plan → V4.12 DuelPoint Commit → V4.13 Battle EXP Plan';
    if (v != null && v >= 412) return 'V4.01 AttackSeq Prelude → V4.02 Damage Plan → V4.03 Critical/Guard → V4.04 DamageReact → V4.05 Counter → V4.06 Death Plan → V4.07 Death Commit → V4.08 Battle End Plan → V4.09 Finish Commit → V4.10 Profit Route Plan → V4.11 DuelPoint Plan → V4.12 DuelPoint Commit';
    if (v != null && v >= 411) return 'V4.01 AttackSeq Prelude → V4.02 Damage Plan → V4.03 Critical/Guard → V4.04 DamageReact → V4.05 Counter → V4.06 Death Plan → V4.07 Death Commit → V4.08 Battle End Plan → V4.09 Finish Commit → V4.10 Profit Route Plan → V4.11 DuelPoint Plan'; if (v != null && v >= 410) return 'V4.01 AttackSeq Prelude → V4.02 Damage Plan → V4.03 Critical/Guard → V4.04 DamageReact → V4.05 Counter → V4.06 Death Plan → V4.07 Death Commit → V4.08 Battle End Plan → V4.09 Finish Commit → V4.10 Profit Route Plan'; if (v != null && v >= 409) return 'V4.01 AttackSeq Prelude → V4.02 Damage Plan → V4.03 Critical/Guard → V4.04 DamageReact → V4.05 Counter → V4.06 Death Plan → V4.07 Death Commit → V4.08 Battle End Plan → V4.09 Finish Commit'; if (v != null && v >= 408) return 'V4.01 AttackSeq Prelude → V4.02 Damage Plan → V4.03 Critical/Guard → V4.04 DamageReact → V4.05 Counter → V4.06 Death Plan → V4.07 Death Commit → V4.08 Battle End Plan'; if (v != null && v >= 407) return 'V4.01 AttackSeq Prelude → V4.02 Damage Plan → V4.03 Critical/Guard → V4.04 DamageReact → V4.05 Counter → V4.06 Death Plan → V4.07 Death Commit'; return 'V4.01 AttackSeq Prelude → V4.02 Damage Plan → V4.03 Critical/Guard → V4.04 DamageReact → V4.05 Counter → V4.06 Death Plan'; })() + ' |',
  '',
  '### NPC → ItemShop → Item → Gold → Persistent State',
  '',
  'Browser-facing runtime contract → NPC interaction gate → NPC ItemShop → source Item template → Item allocator → Item/Economy transaction → Gold debit or credit → canonical Persistent State',
  '',
  (itemShopBindings
    ? '目前 source 文件記錄完整 ' + comma(itemShopBindings) + ' 個 ItemShop binding。'
    : '目前正式 ItemShop catalog 仍以 pinned source checkout 作為 generator 輸入。')
    + ' Browser ItemShop bridge 使用同一條 contract，不另建第二套商店或貨幣規則。',
  '',
  '### 重新開放追查',
  '',
  ...(reopenedFeatureNames.length
    ? reopenedFeatureNames.map(item => '- ' + item.name + '：' + item.status + '；runtime/playable 不會因為重開追查而自動啟用。')
    : ['- 目前沒有重新開放追查中的 feature。']),
  '',
  '### 目前 Blocker',
  '',
  ...(blockerEntries.length
    ? blockerEntries.map(([id, item]) => '- ' + id + '：' + (item.status ?? 'unknown') + '；下一步：' + (item.next ?? '—'))
    : ['- 目前沒有登錄中的 blocker。']),
  '',
  '### 目前停用',
  '',
  ...(disabledNames.length
    ? disabledNames.map(name => '- ' + name + '：目前停用；移出停用清單後仍需重新完成 source closure / regression 才能啟用。')
    : ['- 目前沒有標記為停用的 feature。']),
  '',
  '### 資料時間',
  '',
  '- route closure：' + (route.generatedAt ?? '—'),
  '- persistent state：' + (state.generatedAt ?? '—'),
  '- item/economy schema：' + (economy.generatedAt ?? '—'),
  '- new-player seed：' + (seed.generatedAt ?? '—'),
  '- starter Item 24114 audit：' + (starterItemAudit.generatedAt ?? '—') + '；mapping audit v2 / build closure v1：' + (starterItemBuildAudit.generatedAt ?? '—'),
  '- V3.50 creation/save runtime：2026-09-30',
  '- idle route catalog：' + (idle.generatedAt ?? '—'),
  '- browser ItemShop contract：' + (browserDocs.match(/更新日期：([0-9-]+)/)?.[1] ?? '—'),
  '',
  END
].join('\n');

const current = fs.readFileSync(README, 'utf8');
const start = current.indexOf(START);
const end = current.indexOf(END);
if (start < 0 || end < start) {
  throw new Error('README.md is missing AUTO-README markers.');
}
const updated = current.slice(0, start) + auto + current.slice(end + END.length);
fs.writeFileSync(README, updated.endsWith('\n') ? updated : updated + '\n');
