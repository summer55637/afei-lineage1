# 阿肥石器時代 V2.70：玩家版

這個版本的方向是「打開 GitHub Pages 就像在玩遊戲」，不是工程測試頁。

## GitHub Pages

把此資料夾內的內容放到 repository 根目錄，push 到 `main`。

Repository → Settings → Pages → Source 選 **GitHub Actions**。

本專案已附 `.github/workflows/deploy-pages-v270.yml`，部署完成後根網址會進入 `game.html`。

## 玩家入口

- `/`：直接轉入遊戲
- `/game.html`：遊戲主畫面
- `/museum.html`：寵物圖鑑／地圖資料

## 重要

遊戲使用 `fetch()` 讀 runtime JSON，因此必須經由 GitHub Pages 的 `https://` 或其他 HTTP(S) 靜態伺服器開啟；不要直接以 `file://` 雙擊 HTML。

## 本版 UI

- 上方角色 HUD：等級、EXP、HP、MP、石幣
- 中央場景：地圖、狩獵區、敵人與戰鬥狀態
- 主操作：自動戰鬥、捕捉、防禦、休息、自動捕捉
- 右側：5 格隊伍、寵物背包、冒險道具
- 手機：底部固定導覽列與觸控友善按鈕
- 開發資料：收在「開發／角色設定」及「原始 C 對應／資料驗證」
