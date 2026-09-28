# 阿肥石器時代 V2.70 — Pixel World 玩家版

這一版在既有 V2.69 戰鬥／runtime 核心上，加入「玩家遊戲層」：

- 16-bit inspired 像素地圖場景（河流、道路、村屋、樹林、岩石、橋）
- 像素風角色／寵物／敵人 sprite
- 自動戰鬥中的角色前衝、敵人受擊、斬擊 FX、傷害跳字
- 小地圖、目前位置與目標提示
- 更簡單的玩家語言，原 C / runtime 技術資訊仍留在開發者區
- PC / 手機響應式版面
- PWA / Service Worker 離線快取

## GitHub Pages

把本目錄內容放在 repository 根目錄，並用 GitHub Actions / Pages 發布。首頁 `index.html` 會直接帶入 `game.html`。

## 注意

這裡的角色與地圖美術是本專案自製的像素風素材，不宣稱是原《石器時代 OL》官方素材。
