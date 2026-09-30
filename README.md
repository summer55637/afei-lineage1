# afei-lineage1

本倉庫目前維持「無可玩前端」的乾淨重建狀態，先完成資料、來源證據、系統 contract 與視覺參考整理，再重新建立唯一的遊戲入口。

## 最終目標

重建「阿肥石器時代放置版」的完整遊戲體驗：

- 行為與數值：以 pinned fixed C / source evidence 為最高依據。
- 視覺與操作流程：以 `docs/reference/video-001-visual-reference.md` 為重要還原基準。
- 放置版新增規則：與原版 source 規則分層，明確標記，不混在 source parity。
- 最終網站：只保留一個 canonical playable entry，不再累積多個 HTML 入口。

## 目前狀態

- `main` 是目前唯一保留的 Git 分支。
- 舊版 `index.html`、`game.html`、`game-live.html`、`play.html` 等入口已移除。
- 舊版 `app.js`、`game.js`、`game.css`、`styles.css` 已移除。
- 舊 GitHub Actions、部署 workflow、root `CHANGELOG.md` 與 `.nojekyll` 已移除。
- 目前倉庫不包含可直接遊玩的前端。

## 已保留的研究基礎

- `_evidence/`：研究與來源證據。
- `client-assets/`：合法 client asset 注入用 manifest／介面。
- `data/generated/`：來源解析後的 runtime data、source closure 與 regression fixture。
- `docs/`：歷史研究、source contract、視覺參考與重建藍圖。
- `src/`：map / client asset / RD / palette / tile 等來源研究 runtime。
- `tools/`：解析、產生與驗證工具。

## 目前已完成的重要研究層

戰鬥規則已累積大量 fixed-C parity 與 regression；寵物、遇敵、職業技能、裝備與多個戰鬥反制流程已有 source-backed runtime。

地圖方面已完成 LS2MAP parser、mapset、battlemap、Encounter 座標探測，以及 client image → ADRNBIN → Real → RD → palette → RGBA 的技術鏈。

目前 source catalog 有 1284 個 map blobs，但只有 7 張已產生 verified map runtime；因此世界地圖仍是主要待補區。

## 現階段優先事項

現在先不做 playable UI，而是依 `docs/rebuild-roadmap.md` 收斂：

1. World Data Catalog：NPC、任務、商店、傳送、服務、事件等。
2. Map Coverage Expansion：主要世界地圖與地圖連接。
3. Persistent State Schema：玩家、寵物、裝備、背包、技能、任務與掛機狀態。
4. Idle Loop Contract：自動遇敵、戰鬥、結算、補給、死亡、離線／恢復。
5. Battle Presentation Contract：真實戰場、站位、動畫事件與 UI。
6. NPC / Economy Runtime：互動、取得來源、商店、製作與任務。
7. Authorized Asset Integration：有合法 client assets 時再導入真實 sprite / tile。
8. 唯一可玩入口：以上資料與 contract 成熟後才建立。

## 明確停用項目

`data/generated/stoneage_disabled_features.json` 已固定 GMQUE／抓寵活動為永久停用，因此它不再作為主線 blocker，也不會自行恢復。

## 閱讀順序

先看：
- `docs/rebuild-roadmap.md`
- `docs/reference/video-001-visual-reference.md`
- `docs/reference/v320-real-tile-presentation.md`
- `docs/reference/encounter-source-closure.md`
- `docs/reference/gmque-source-closure.md`

最後整理：2026-09-30。
