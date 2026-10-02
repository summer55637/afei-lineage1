#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const README = path.join(ROOT, 'README.md');
const START = '<!-- AUTO-README:START -->';
const END = '<!-- AUTO-README:END -->';
const HANDOFF_START = '<!-- SELF-DESCRIPTION:START -->';
const HANDOFF_END = '<!-- SELF-DESCRIPTION:END -->';

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
const androidClientAudit = loadJson('data/generated/stoneage_ro0000_android_apk_audit.json') ?? {};
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

function buildReadme() {
  const fixedSource = (route.fixedSource?.repository ?? 'gavinlinasd/StoneAge') + '@' + (route.fixedSource?.ref ?? '1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
  const workflowVersion = latestWorkflowVersion();
  const workflowLabel = workflowVersion == null ? '—' : (String(workflowVersion).length === 3 ? 'V' + String(workflowVersion)[0] + '.' + String(workflowVersion).slice(1) : 'V' + workflowVersion);
  const manual = endpointCatalog.sourceCorpus?.byProvenance?.manualExternalWeb ?? {};
  const vm = endpointCatalog.sourceCorpus?.byProvenance?.vmOneClick ?? {};
  const blockers = blockerEntries.filter(([, item]) => ['active', 'reopened-for-reaudit'].includes(item?.status)).slice(0, 5).map(([id, item]) => '- ' + id + '：' + (item.summary ?? item.next ?? '待定'));
  const reopened = reopenedFeatureNames.map(item => item.name + '：' + item.status + '（未啟用）');
  const routeLine = routeStatus.sourceRouteSpine === 'closed' ? '✅ 已閉合（' + (routeStats.verifiedStartMaps ?? 0) + '/4 出生城、' + (routeStats.reachableDirectWarpExits ?? 0) + '/' + (routeStats.directWarpExits ?? 0) + ' direct warp）' : '⚠️ 未完成';
  const portalGroups = Number(routeStats.worldExitPortalGroups ?? 0);
  const sourceUsablePortalGroups = Number(routeStats.worldExitPortalGroupsUsable ?? 0);
  const repairCatalog = idle.productRepairs?.['karutarna-4000-road-access-v1'];
  const productRepairPortalGroups = repairCatalog?.status === 'runtime-enabled'
    ? (Array.isArray(repairCatalog.portalIds) ? repairCatalog.portalIds.length : 0)
    : 0;
  const repairedPortalGroups = Math.min(portalGroups, sourceUsablePortalGroups + productRepairPortalGroups);
  const firstRoutePathClosed = portalGroups > 0 && repairedPortalGroups >= portalGroups;
  const battlePolicyPending = idleSummary.battlePolicyPendingAll === true;
  const fullRouteLine = firstRoutePathClosed
    ? '✅ 路徑已閉合（' + repairedPortalGroups + '/' + portalGroups + ' portal groups）' + (battlePolicyPending ? '；⚠️ 完整自動戰鬥待串接（基礎策略已實作）' : '')
    : '⚠️ 部分完成（' + repairedPortalGroups + '/' + portalGroups + ' portal groups）';
  const mapCount = Object.keys(maps.maps ?? {}).length;
  const mapLine = mapCount ? '✅ ' + comma(mapCount) + ' 張' : '⚠️ 未建立';
  const stateLine = state.currentSchemaVersion ? '✅ Schema ' + state.currentSchemaVersion : '⚠️ 未建立';
  const economyLine = economy.format ? '✅ Runtime v1' : '⚠️ 未建立';
  const androidLine = androidClientAudit.source?.sha256
    ? '✅ APK ' + (androidClientAudit.manifest?.versionName ?? 'version unknown') + '（Manifest/DEX/Java wrapper、雙 ABI native ELF、SABEX 220-slot / 33×33、RD/gG、browser battle preview 已稽核；⚠️ v1 簽章摘要不符；原始資源與真機驗證待補）'
    : '⚠️ APK 尚未完成封裝稽核';
  const battleLine = workflowVersion == null ? '⚠️ 未知' : '✅ ' + workflowLabel;
  const playableLine = oldPresent.length === 0 ? '⏸️ 尚未建立（刻意保留）' : '⚠️ 發現舊入口：' + oldPresent.join(', ');

  return [
    '# afei-lineage1',
    '',
    '「阿肥石器時代放置版」重建專案。',
    '',
    '以RO0000 實際部署系統、舊版客戶端及專案取得的原作資料作為核心 production reconstruction source，並以 Fixed-C C 原始碼與外部已核驗資料補足語義與版本考據，重建石器時代核心內容與規則，最終製作成單機 PC＋手機可長時間遊玩的現代化 2D 高品質重製放置版。',
    '',
    '## 目前狀態',
    '',
    '- 最新 commit：' + commit.sha + ' — ' + commit.subject,
    '- 更新時間：' + commit.iso,
    '- Fixed-C：' + fixedSource,
    '- Regression 最高版本：' + workflowLabel,
    '- Playable HTML：' + playableLine,
    '',
    '## 接手摘要',
    '',
    '| 項目 | 現況 |',
    '|---|---|',
    '| 資料使用定位 | 專案內部來源依 provenance、identity、integrity 與版本驗證決定是否進入 production；外部資料另行核驗使用條件 |',
    '| 來源 | `ro0000/` 是主要實機／部署資料；手工外網端只有 `docs/搭建教程.txt`、`server/merged-source/wwwroot/`；其餘皆為 VM 一鍵端 |',
    '| Endpoint | ' + comma(manual.fileCount) + ' files 手工外網端；' + comma(vm.fileCount) + ' files VM；合計 ' + comma(endpointCatalog.sourceCorpus?.fileCount) + ' files |',
    '| Android Client | ' + androidLine + ' |',
    '| 來源角色 | RO0000＝實際部署系統與資料；Fixed-C＝可讀的 C 程式行為／語義證據；兩者共同用於考據，不互相覆蓋 |',
    '| 原則 | 有證據才做；缺證據就 fail-closed；先 contract / state / transaction / regression，再做 UI |',
    '| 重開案 | ' + (reopened.length ? reopened.join('、') : '目前沒有') + ' |',
    '',
    '## 開發進度',
    '',
    '| 區域 | 現況 |',
    '|---|---|',
    '| First-route spine | ' + routeLine + ' |',
    '| Full first-route | ' + fullRouteLine + ' |',
    '| Map runtime | ' + mapLine + ' |',
    '| Persistent State | ' + stateLine + ' |',
    '| Item / Economy | ' + economyLine + ' |',
    '| Battle Pipeline | ' + battleLine + ' |',
    '| Playable | ' + playableLine + ' |',
    '',
    '## Blocker',
    '',
    ...(blockers.length ? blockers : ['- 目前沒有 active / reopened blocker。']),
    '',
    '## 重要文件',
    '',
    '- [Source authority / provenance](docs/source-authority-and-provenance.md)',
    '- [Endpoint source catalog](docs/reference/endpoint-source-catalog.md)',
    '- [Rebuild roadmap](docs/rebuild-roadmap.md)',
    '- [Persistent State current gap audit](docs/reference/persistent-state-current-audit.md)',
    '- [Idle battle strategy v1](docs/reference/idle-battle-strategy-v1.md)\n    - [V4.26 Battle damage commit](docs/reference/v426-browser-battle-damage-commit.md)',
    '- [Android battle-map 33×33 lineage audit](docs/reference/ro0000-android-battle-map-lineage-audit.md)',
    '- [Generated state / evidence](data/generated/)',
    '',
    '> README 由 GitHub Actions 自動維護。狀態以 `data/generated/`、`docs/`、commit、regression 與 evidence 為準。'
  ].join('\n');
}

const updated = buildReadme();
fs.writeFileSync(README, updated.endsWith('\n') ? updated : updated + '\n');
