# afei-lineage1

「阿肥石器時代放置版」重建專案。

以RO0000 實際部署系統、舊版客戶端及專案取得的原作資料作為核心 production reconstruction source，並以 Fixed-C C 原始碼與外部已核驗資料補足語義與版本考據，重建石器時代核心內容與規則，最終製作成可以用github的遊戲網頁的單機 PC＋手機可長時間遊玩的現代化 2D "石器時代"放置版。

## 目前狀態

- 最新 commit：fe55d82 — docs: record Android profession skill receive and classification chain
- 更新時間：2026-10-03T12:55:37+08:00
- Fixed-C：gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56
- Regression 最高版本：V4.42
- Playable HTML：⏸️ 尚未建立（刻意保留）

## 接手摘要

| 項目 | 現況 |
|---|---|
| 資料使用定位 | 專案內部來源依 provenance、identity、integrity 與版本驗證決定是否進入 production；外部資料另行核驗使用條件 |
| 來源 | `ro0000/` 是主要實機／部署資料；手工外網端只有 `docs/搭建教程.txt`、`server/merged-source/wwwroot/`；其餘皆為 VM 一鍵端 |
| Endpoint | 23 files 手工外網端；8,726 files VM；合計 8,749 files |
| Android Client | ✅ APK 1.0（遊戲資源格式／載入流程、ADRN/REAL/SPR、SABEX 220-slot / 33×33、map cache/HitMap/prefetch、route/movement/warp、Lua container、battle-map crosscheck 與 4 組 sprite fixup 已靜態稽核；⚠️ 外部 production resource bytes 與真機 runtime 驗證待補） |
| 來源角色 | RO0000＝實際部署系統與資料；Fixed-C＝可讀的 C 程式行為／語義證據；兩者共同用於考據，不互相覆蓋 |
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
| Battle Pipeline | ✅ V4.42 |
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
- [Android battle-map 33×33 lineage audit](docs/reference/ro0000-android-battle-map-lineage-audit.md)
- [Generated state / evidence](data/generated/)

> README 由 GitHub Actions 自動維護。狀態以 `data/generated/`、`docs/`、commit、regression 與 evidence 為準。
