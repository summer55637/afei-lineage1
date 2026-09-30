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
const starterItemAudit = loadJson('data/generated/stoneage_starter_item_24114_source_audit.json') ?? {};
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
  '| New-player seed | ' + (seed.format ? '✅ source-closed' : '⚠️ missing') + ' | trans ' + (seed.sourceConfig?.transmigration ?? '—') + '；lv ' + (seed.sourceConfig?.level ?? '—') + '；pet lv ' + (seed.sourceConfig?.petLevel ?? '—') + '；gold ' + (seed.sourceConfig?.gold ?? '—') + '；item1 ' + (seed.sourceConfig?.itemSlots?.ITEM1 ?? '—') + ' |',
  '| Player creation | ' + (schema.sections?.includes('creation') ? '✅ state contract' : '⚠️ missing') + ' | hometown + stats + elements + starter grant status；still headless，no playable HTML |',
  '| Starter Pet grant | ' + (seed.starterPet?.sourceClosed ? '✅ runtime' : '⚠️ pending') + ' | 16 RNG calls；VariableAI 0；HP after compliance；' + starterPetRankSummary + '；team/activePet unchanged |',
  '| Starter Item 24114 | ' + (starterItemAudit.resolution?.configuredIdDirectTemplateResolved ? '✅ source-closed' : '⚠️ fail-closed') + ' | source file ' + (starterItemAudit.sourceFiles?.itemset6?.sizeBytes ?? '—') + ' bytes；row exists as id ' + (starterItemAudit.requestedIdEvidence?.matchingRow?.token17SourceId ?? '—') + ' / imagenumber ' + (starterItemAudit.requestedIdEvidence?.matchingRow?.imageNumber ?? '—') + '；configured ID 24114 still has no direct source-table resolution |',
  '| New-player creation → Save | ' + (creationSaveRuntimePresent ? '✅ headless pipeline' : '⚠️ missing') + ' | creation → hometown position → Starter Pet → Item adapter boundary → Save Envelope → reload verification；`completed` only after Item adapter succeeds |',
  '| Idle route catalog | ' + (idleSummary.towns ? '✅ indexed' : '⚠️ missing') + ' | ' + (idleSummary.pathClosedTowns ?? 0) + ' path-closed towns；' + (idleSummary.eligibleRouteVariants ?? 0) + '/' + (idleSummary.routeVariants ?? 0) + ' eligible variants |',
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
  '### 主要 blocker',
  '',
  ...(route.remainingWork ?? []).slice(0, 3).map((item, index) => (index + 1) + '. ' + item),
  ...(!starterItemAudit.resolution?.configuredIdDirectTemplateResolved ? ['4. Starter Item 24114：pinned Item source row exists as id ' + (starterItemAudit.requestedIdEvidence?.matchingRow?.token17SourceId ?? '—') + ' with imagenumber 24114；fixed-C configured ID 24114 is still unresolved，keep fail-closed and do not remap.'] : []),
  '',
  '### 永久停用',
  '',
  ...(disabledNames.length
    ? disabledNames.map(name => '- ' + name + '：維持永久停用，不由後續版本自動恢復。')
    : ['- 目前沒有標記永久停用的 feature。']),
  '',
  '### 資料時間',
  '',
  '- route closure：' + (route.generatedAt ?? '—'),
  '- persistent state：' + (state.generatedAt ?? '—'),
  '- item/economy schema：' + (economy.generatedAt ?? '—'),
  '- new-player seed：' + (seed.generatedAt ?? '—'),
  '- starter Item 24114 audit：' + (starterItemAudit.generatedAt ?? '—') + '；mapping audit v2',
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
