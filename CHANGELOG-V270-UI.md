# V2.70 UI 重製版

這一版把 V2.69 的「可玩核心／工程測試頁」改成玩家導向的 PC／手機放置冒險介面。

## 主要變更
- GitHub Pages 根網址自動進入 `game.html`。
- 新增 Stone Age 風格戰鬥場景、玩家 HUD、資源列、戰鬥按鈕與底部導覽。
- 保留原本 game.js 的 63 個 DOM ID，戰鬥、寵物、捕捉、任務、裝備與 runtime 資料不重寫。
- 開發用的創角四圍、出生村、元素、技能資料、source item runtime 收進「開發／角色設定」與「原始 C 對應／資料驗證」。
- 圖鑑改放到 `museum.html`，避免玩家第一眼看到資料驗證頁。
- mobile breakpoint 針對觸控操作重新排列。

## 使用
- GitHub Pages：網站根目錄即遊戲。
- 本機仍可用 HTTP server 啟動，不能用 `file://` 直接雙擊 HTML。
