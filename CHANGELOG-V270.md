# V2.70 CHANGELOG

## 啟動修正版
- 新增 `開始遊戲.bat`，Windows 雙擊即可自動啟動本機 HTTP 伺服器並開啟遊戲。
- 新增穩定等待機制，不再只固定等待 1 秒後就搶先開瀏覽器。
- `start-local-server.bat` 改為轉呼叫新啟動器。
- 新增 Node.js `server.js` 備援啟動方式。
- Linux/macOS 啟動腳本統一使用 8765 port，並嘗試自動開啟瀏覽器。
- 啟動失敗時顯示更清楚的原因與修復方式。

# V2.70

- 保留 V2.69 Skill 13 火龍槍與既有戰鬥核心。
- 新增 PWA manifest / service worker。
- 新增 runtime 資料離線快取。
- 新增離線放置 EXP 估算與 12 小時上限。
- 新增 JSON 存檔匯出／匯入。
- 新增 PC／手機 PWA 安裝按鈕。
- 存檔 schema 由 30 升到 31，保留 V2.69 舊存檔相容。
