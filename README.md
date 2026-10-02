# afei-lineage1

「阿肥石器時代放置版」重建專案。

先還原真正可架設的石器時代手游部署資料，再建立 source-backed runtime，最後做成 PC＋手機可長時間遊玩的現代化 3D 放置版。

## 目前狀態

- 最新 commit：f90df1f — fix: auto-preserve active charge commands at turn start
- 更新時間：2026-10-02T16:48:40+08:00
- Fixed-C：gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56
- Regression 最高版本：V4.38
- Playable HTML：⏸️ 尚未建立（刻意保留）

## 接手摘要

| 項目 | 現況 |
|---|---|
| 來源 | `ro0000/` 是主要實機／部署資料；手工外網端只有 `docs/搭建教程.txt`、`server/merged-source/wwwroot/`；其餘皆為 VM 一鍵端 |
| Endpoint | 23 files 手工外網端；8,726 files VM；合計 8,749 files |
| Android Client | ✅ APK 1.0（ZIP / Manifest / native path 已稽核；map data 語義待解） |
| 判定 | Endpoint 決定「實際部署有什麼」；Fixed-C 驗證「引擎怎麼運作」；variant 不互相覆蓋 |
| 原則 | 有證據才做；缺證據就 fail-closed；先 contract / state / transaction / regression，再做 UI |
| 重開案 | 目前沒有 |

## 開發進度

| 區域 | 現況 |
|---|---|
| First-route spine | ✅ 已閉合（4/4 出生城、8/8 direct warp） |
| Full first-route | ✅ 路徑已閉合（8/8 portal groups）；⚠️ 完整自動戰鬥待串接（基礎策略已實作） |
| Map runtime | ✅ 11 張 |
| Persistent State | ✅ Schema 1 |
| Item / Economy | ✅ Runtime v1 |
| Battle Pipeline | ✅ V4.38 |
| Playable | ⏸️ 尚未建立（刻意保留） |

## Blocker

- 目前沒有 active / reopened blocker。

## 重要文件

- [Source authority / provenance](docs/source-authority-and-provenance.md)
- [Endpoint source catalog](docs/reference/endpoint-source-catalog.md)
- [Rebuild roadmap](docs/rebuild-roadmap.md)
- [Persistent State current gap audit](docs/reference/persistent-state-current-audit.md)
- [Idle battle strategy v1](docs/reference/idle-battle-strategy-v1.md)
    - [V4.26 Battle damage commit](docs/reference/v426-browser-battle-damage-commit.md)
- [Generated state / evidence](data/generated/)

> README 由 GitHub Actions 自動維護。狀態以 `data/generated/`、`docs/`、commit、regression 與 evidence 為準。
