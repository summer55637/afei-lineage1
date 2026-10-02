# afei-lineage1

「阿肥石器時代放置版」重建專案。

先還原真正可架設的石器時代手游部署資料，再建立 source-backed runtime，最後做成 PC＋手機可長時間遊玩的現代化 3D 放置版。

## 目前狀態

- 最新 commit：b3de157 — ci: deduplicate endpoint Item audit runs
- 更新時間：2026-10-02T08:36:34+08:00
- Fixed-C：gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56
- Regression 最高版本：V4.25
- Playable HTML：⏸️ 尚未建立（刻意保留）

## 接手摘要

| 項目 | 現況 |
|---|---|
| 來源 | `ro0000/` 是主要實機／部署資料；手工外網端只有 `docs/搭建教程.txt`、`server/merged-source/wwwroot/`；其餘皆為 VM 一鍵端 |
| Endpoint | 23 files 手工外網端；8,726 files VM；合計 8,749 files |
| 判定 | Endpoint 決定「實際部署有什麼」；Fixed-C 驗證「引擎怎麼運作」；variant 不互相覆蓋 |
| 原則 | 有證據才做；缺證據就 fail-closed；先 contract / state / transaction / regression，再做 UI |
| 重開案 | gmque：reopened-for-source-reconstruction（未啟用）、world-blockers：reopened-for-endpoint-reaudit（未啟用） |

## 開發進度

| 區域 | 現況 |
|---|---|
| First-route spine | ✅ 已閉合（4/4 出生城、8/8 direct warp） |
| Full first-route | ⚠️ 部分完成（6/8 portal groups） |
| Map runtime | ✅ 11 張 |
| Persistent State | ✅ Schema 1 |
| Item / Economy | ✅ Runtime v1 |
| Battle Pipeline | ✅ V4.25 |
| Playable | ⏸️ 尚未建立（刻意保留） |

## Blocker

- route-4000-to-200：active → keep active; inspect whether endpoint contains an alternate source-backed route/warp connection from component 48 to component 0 before changing runtime eligibility
- route-3000-to-200-landing-587-318：active → keep active; inspect endpoint object/warp placement semantics around component 1 and whether the non-walkable warp origin (588,318) can be triggered without stepping onto it
- starter-item-24114-fixed-c：reopened-for-reaudit → keep fixed-C 24114 fail-closed while endpoint loader semantics are separately closed
- starter-item-endpoint-32003：active → keep endpoint Starter Item fail-closed; reopen only if new authoritative endpoint evidence provides source Item 32003 or a proven endpoint-specific mapping path
- persistent-state-expansion：active → expand player/pet/inventory/equipment/skills/quests/map/idle/save-migration using endpoint data where applicable and fixed-C semantics

## 重要文件

- [Source authority / provenance](docs/source-authority-and-provenance.md)
- [Endpoint source catalog](docs/reference/endpoint-source-catalog.md)
- [Rebuild roadmap](docs/rebuild-roadmap.md)
- [Generated state / evidence](data/generated/)

> README 由 GitHub Actions 自動維護。狀態以 `data/generated/`、`docs/`、commit、regression 與 evidence 為準。
