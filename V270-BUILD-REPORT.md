# 阿肥石器時代 V2.70 Build Report

Build date: 2026-09-28
Base: V2.69 PLAYABLE CORE

## Included

- 原 V2.69 戰鬥／任務／runtime 資料完整保留
- PWA manifest
- Service Worker offline cache
- PC／手機安裝入口
- JSON 存檔匯出／匯入
- 離線放置 EXP 估算（單次最多 12 小時）
- Windows / Linux 本機靜態伺服器啟動腳本

## Validation

- `node --check game.js`：PASS
- `node --check app.js`：PASS
- `node --check pwa.js`：PASS
- HTTP static server smoke test：PASS
- 遊戲頁 / 圖鑑 / manifest / service-worker：HTTP 200
- game.js 引用的 runtime JSON / CSV：HTTP 200
- ZIP 完整性：待最終打包後檢查

## 啟動修正版驗證
- `game.js`／`pwa.js`／`app.js`／`server.js` Node syntax check：PASS
- HTTP `game.html`：200
- `manifest.json`：200，start_url=`game.html`
- 核心 runtime JSON：200
- Windows 啟動器：新增自動等待 server ready；未再以固定 1 秒假設 server 已啟動
- Windows 入口：`開始遊戲.bat`
