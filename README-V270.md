# 阿肥石器時代 V2.70

本版以 V2.69 PLAYABLE CORE 原始碼為底，沒有重寫原 C 戰鬥／任務／runtime 資料。

## V2.70 完整版內容

- PWA：PC、Android、iPhone 共用同一套前端。
- Service Worker：遊戲 HTML／JS／CSS 與所有 runtime JSON／CSV 可離線快取。
- 離線放置：依玩家最近實際戰鬥效率估算離線 EXP；單次離線最多結算 12 小時，採 70% 效率係數，避免跨長時間不受控爆量。
- 存檔匯出／匯入：JSON，可把 PC 存檔搬到手機，也可反向搬回。
- V2.69 schema 30 存檔向前相容至 V2.70 schema 31。
- PWA 安裝入口與手機版控制列。
- Windows `start-local-server.bat`、Linux/macOS `start-local-server.sh`。

## 本機執行

不要直接雙擊 `game.html`。遊戲需要 HTTP/HTTPS 才能讀取 runtime JSON、啟用 Service Worker 與 PWA。

Windows：**直接雙擊 `開始遊戲.bat`**（也可雙擊 `start-game.bat`）。它會自動啟動本機伺服器、等待遊戲頁可用，再自動開啟 Chrome／Edge。預設網址為 `http://127.0.0.1:8765/game.html`。

舊版 `start-local-server.bat` 仍保留，現在會轉呼叫新的穩定啟動器。

Linux/macOS：執行 `./start-local-server.sh`，再開啟同一網址。若有 Node.js，也可直接執行 `node server.js`。

部署到 GitHub Pages、Cloudflare Pages、Netlify、Nginx 等靜態網站亦可直接使用 PWA。


## Windows 啟動
請解壓縮 ZIP 後雙擊「開始遊戲.bat」。不要直接雙擊 `game.html`。
